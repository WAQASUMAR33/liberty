"use client";

import { useState, useEffect, useRef } from "react";
import {
    Truck,
    Search,
    Plus,
    Trash2,
    Building2,
    Calendar,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Printer,
    Package,
    X,
    FileText,
    ChevronDown,
    Layers,
    UserPlus,
    Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";

interface CartItem {
    id: string;
    productId: string;
    code: string;
    name: string;
    quantity: number;
    costPrice: number;
    retailPrice?: number;
    subtotal: number;
}

export default function PurchasesPage() {
    const [activeTab, setActiveTab] = useState<"NEW" | "HISTORY">("NEW");

    // Master data
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loadingPurchases, setLoadingPurchases] = useState(false);

    // Form state
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [customInvoiceNumber, setCustomInvoiceNumber] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [discount, setDiscount] = useState<number | string>(0);
    const [paidAmount, setPaidAmount] = useState<number | string>(0);

    // Product search & Cart
    const [productQuery, setProductQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Receipt / Print Modal
    const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
    const [historySearch, setHistorySearch] = useState("");

    const supplierContainerRef = useRef<HTMLDivElement>(null);
    const productContainerRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        try {
            const [supRes, prodRes] = await Promise.all([
                fetch("/api/suppliers"),
                fetch("/api/products")
            ]);
            const supData = await supRes.json();
            const prodData = await prodRes.json();
            setSuppliers(Array.isArray(supData) ? supData : []);
            setProducts(Array.isArray(prodData) ? prodData : []);
        } catch (e) {
            console.error("Error loading master data:", e);
        }
    };

    const loadPurchases = async () => {
        setLoadingPurchases(true);
        try {
            const res = await fetch("/api/purchases");
            const data = await res.json();
            setPurchases(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error loading purchases:", e);
        } finally {
            setLoadingPurchases(false);
        }
    };

    useEffect(() => {
        loadData();
        loadPurchases();
    }, []);

    // Outside click handlers
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (supplierContainerRef.current && !supplierContainerRef.current.contains(e.target as Node)) {
                setShowSupplierDropdown(false);
            }
            if (productContainerRef.current && !productContainerRef.current.contains(e.target as Node)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter suppliers
    const filteredSuppliers = suppliers.filter((s) => {
        const q = supplierSearch.toLowerCase().trim();
        if (!q) return true;
        return (
            s.name.toLowerCase().includes(q) ||
            (s.companyName && s.companyName.toLowerCase().includes(q)) ||
            s.contact.toLowerCase().includes(q)
        );
    });

    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    // Filter products
    const filteredProducts = products.filter((p) => {
        const q = productQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q)
        );
    });

    const handleSelectProduct = (prod: any) => {
        const existingIndex = cart.findIndex((c) => c.productId === prod.id);
        const cost = Number(prod.costPrice) || 0;
        const retail = Number(prod.retailPrice) || 0;

        if (existingIndex > -1) {
            const updated = [...cart];
            updated[existingIndex].quantity += 1;
            updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].costPrice;
            setCart(updated);
        } else {
            setCart([
                ...cart,
                {
                    id: `${prod.id}-${Date.now()}`,
                    productId: prod.id,
                    code: prod.code,
                    name: prod.name,
                    quantity: 1,
                    costPrice: cost,
                    retailPrice: retail,
                    subtotal: cost,
                },
            ]);
        }
        setProductQuery("");
        setShowProductDropdown(false);
    };

    const updateCartItem = (id: string, field: "quantity" | "costPrice" | "retailPrice", val: number) => {
        setCart(
            cart.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: val };
                    updated.subtotal = updated.quantity * updated.costPrice;
                    return updated;
                }
                return item;
            })
        );
    };

    const removeCartItem = (id: string) => {
        setCart(cart.filter((c) => c.id !== id));
    };

    // Calculations
    const grossTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discAmount = Math.max(0, Number(discount) || 0);
    const netTotal = Math.max(0, grossTotal - discAmount);
    const paid = Math.max(0, Number(paidAmount) || 0);
    const balance = Math.max(0, netTotal - paid);

    const handleProcessPurchase = async () => {
        if (!selectedSupplierId) {
            setFeedback({ type: "error", message: "Please select a supplier for this stock-in purchase." });
            return;
        }
        if (cart.length === 0) {
            setFeedback({ type: "error", message: "Please add at least 1 product item to the purchase order." });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            const payload = {
                supplierId: selectedSupplierId,
                date: purchaseDate,
                items: cart.map((c) => ({
                    productId: c.productId,
                    name: c.name,
                    quantity: c.quantity,
                    costPrice: c.costPrice,
                    retailPrice: c.retailPrice,
                })),
                discount: discAmount,
                paidAmount: paid,
                notes,
                customInvoiceNumber,
            };

            const res = await fetch("/api/purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to process purchase");
            }

            setFeedback({
                type: "success",
                message: `Purchase invoice #${data.invoiceNumber} recorded successfully! Inventory updated.`,
            });

            // Open printable invoice
            setActiveReceipt(data);

            // Reset form
            setCart([]);
            setDiscount(0);
            setPaidAmount(0);
            setNotes("");
            setCustomInvoiceNumber("");
            loadPurchases();
            loadData();
        } catch (err: any) {
            setFeedback({ type: "error", message: err.message || "Something went wrong" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const printPurchaseReceipt = (record: any) => {
        if (!record) return;
        const printWindow = window.open("", "_blank", "width=850,height=1100");
        if (!printWindow) return;

        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Purchase Order - ${record.invoiceNumber}</title>
                <style>
                    @page { size: A4; margin: 12mm; }
                    body { font-family: Arial, sans-serif; font-size: 11px; color: black; margin: 0; padding: 0; background: white; }
                    .container { padding: 20px; border: 1px solid #000; min-height: 260mm; position: relative; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
                    .store-info h1 { font-size: 24px; margin: 0; font-weight: 900; }
                    .store-info p { margin: 2px 0; font-size: 11px; color: #444; }
                    .invoice-meta { text-align: right; }
                    .invoice-meta h2 { font-size: 20px; margin: 0 0 5px 0; text-decoration: underline; }
                    .vendor-box { background: #f8f8f8; border: 1px solid #ddd; padding: 10px; margin-bottom: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    th, td { border: 1px solid #000; padding: 8px; }
                    th { background: #eee; font-weight: bold; font-size: 11px; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .summary-box { float: right; width: 280px; margin-top: 10px; }
                    .sum-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
                    .sum-row.grand { border-top: 2px solid #000; border-bottom: 2px solid #000; font-size: 15px; font-weight: bold; padding: 6px 0; }
                    .sign-row { margin-top: 80px; display: flex; justify-content: space-between; clear: both; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="store-info">
                            <h1>Liberty Kollection</h1>
                            <p>Chapai wali gali, Committee Bazar, Mandi Bahauddin</p>
                            <p>0345 5754717 | 0546-506717</p>
                        </div>
                        <div class="invoice-meta">
                            <h2>STOCK PURCHASE INVOICE</h2>
                            <div>Invoice #: <strong>${record.invoiceNumber}</strong></div>
                            <div>Date: <strong>${new Date(record.date).toLocaleDateString()}</strong></div>
                        </div>
                    </div>

                    <div class="vendor-box">
                        <div>Supplier: <strong>${record.supplier?.name}</strong> ${record.supplier?.companyName ? `(${record.supplier.companyName})` : ""}</div>
                        <div>Contact: <strong>${record.supplier?.contact || "N/A"}</strong></div>
                        ${record.supplier?.address ? `<div>Address: ${record.supplier.address}</div>` : ""}
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 5%;" class="text-center">#</th>
                                <th style="width: 20%;">Item Code</th>
                                <th style="width: 45%;">Product Description</th>
                                <th style="width: 10%;" class="text-center">Qty</th>
                                <th style="width: 10%;" class="text-right">Unit Cost</th>
                                <th style="width: 10%;" class="text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${record.items
                                .map(
                                    (it: any, index: number) => `
                                <tr>
                                    <td class="text-center">${index + 1}</td>
                                    <td>${it.product?.code || "—"}</td>
                                    <td><strong>${it.name || it.product?.name}</strong></td>
                                    <td class="text-center">${it.quantity}</td>
                                    <td class="text-right">RS ${Number(it.costPrice).toFixed(2)}</td>
                                    <td class="text-right">RS ${Number(it.subtotal).toFixed(2)}</td>
                                </tr>
                            `
                                )
                                .join("")}
                        </tbody>
                    </table>

                    <div class="summary-box">
                        <div class="sum-row"><span>Gross Amount:</span> <span>RS ${Number(record.total).toFixed(2)}</span></div>
                        <div class="sum-row"><span>Discount:</span> <span>RS ${Number(record.discount || 0).toFixed(2)}</span></div>
                        <div class="sum-row grand"><span>Net Payable:</span> <span>RS ${Number(record.netTotal).toFixed(2)}</span></div>
                        <div class="sum-row"><span>Paid to Supplier:</span> <span>RS ${Number(record.paidAmount || 0).toFixed(2)}</span></div>
                        <div class="sum-row"><span>Unpaid Balance:</span> <span>RS ${Number(record.balance || 0).toFixed(2)}</span></div>
                    </div>

                    <div class="sign-row">
                        <div>Received By: _____________________</div>
                        <div>Authorized Signature: _____________________</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() { window.close(); };
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
    };

    const filteredPurchases = purchases.filter((p) => {
        const q = historySearch.toLowerCase().trim();
        if (!q) return true;
        return (
            p.invoiceNumber.toLowerCase().includes(q) ||
            p.supplier?.name.toLowerCase().includes(q) ||
            (p.supplier?.companyName && p.supplier.companyName.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Purchases & Stock In
                    </h2>
                    <p className="text-foreground/60 text-sm mt-0.5">
                        Record new stock inventory arrivals, supplier purchase orders, and cost prices.
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-black/5 p-1 border border-black/5">
                    <button
                        onClick={() => setActiveTab("NEW")}
                        className={cn(
                            "px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === "NEW" ? "bg-primary text-white shadow-xs" : "text-foreground/60 hover:text-foreground"
                        )}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Stock In</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("HISTORY")}
                        className={cn(
                            "px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === "HISTORY" ? "bg-primary text-white shadow-xs" : "text-foreground/60 hover:text-foreground"
                        )}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Purchase Invoices ({purchases.length})</span>
                    </button>
                </div>
            </div>

            {/* Notification Alert */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "p-4 border flex items-center justify-between shadow-xs",
                            feedback.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"
                                : "bg-red-500/10 border-red-500/30 text-red-800"
                        )}
                    >
                        <div className="flex items-center gap-2.5 font-medium text-xs">
                            {feedback.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                            <span>{feedback.message}</span>
                        </div>
                        <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100 p-1 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeTab === "NEW" ? (
                /* ================= NEW STOCK IN PURCHASE TAB ================= */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Supplier & Products to Add */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Supplier Info & Bill Meta Card */}
                        <div className="p-6 glass border border-black/5 bg-white shadow-xs space-y-4">
                            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-primary" />
                                Supplier & Invoice Details
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Filterable Supplier Search */}
                                <div className="relative" ref={supplierContainerRef}>
                                    <label className="text-xs font-bold text-foreground/70 block mb-1">
                                        Select Supplier <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search supplier..."
                                        className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                        value={supplierSearch}
                                        onChange={(e) => {
                                            setSupplierSearch(e.target.value);
                                            setShowSupplierDropdown(true);
                                        }}
                                        onFocus={() => setShowSupplierDropdown(true)}
                                    />
                                    {showSupplierDropdown && (
                                        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-black/10 shadow-2xl max-h-52 overflow-y-auto divide-y divide-black/5">
                                            {filteredSuppliers.length === 0 ? (
                                                <div className="p-3 text-center text-xs text-foreground/40 font-medium">
                                                    No supplier found
                                                </div>
                                            ) : (
                                                filteredSuppliers.map((s) => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => {
                                                            setSelectedSupplierId(s.id);
                                                            setSupplierSearch(s.name);
                                                            setShowSupplierDropdown(false);
                                                        }}
                                                        className="p-2.5 hover:bg-primary/5 cursor-pointer flex justify-between items-center text-xs transition-colors"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-foreground">{s.name}</p>
                                                            <p className="text-[11px] text-foreground/40">{s.companyName || s.contact}</p>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-red-600">
                                                            Bal: {formatCurrency(s.balance)}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Custom / Supplier Bill Number */}
                                <div>
                                    <label className="text-xs font-bold text-foreground/70 block mb-1">
                                        Supplier Bill / Invoice #
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Auto generated or e.g. INV-889"
                                        className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                        value={customInvoiceNumber}
                                        onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="text-xs font-bold text-foreground/70 block mb-1">
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                        value={purchaseDate}
                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Product Search & Line Items */}
                        <div className="p-6 glass border border-black/5 bg-white shadow-xs space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                    <Package className="w-4 h-4 text-primary" />
                                    Select Products to Stock In
                                </h3>
                                <span className="text-[11px] text-foreground/40 font-mono">Scan barcode or search by code/name</span>
                            </div>

                            {/* Product Search Bar */}
                            <div className="relative" ref={productContainerRef}>
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Scan barcode or type product name/code..."
                                    className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground shadow-xs"
                                    value={productQuery}
                                    onChange={(e) => {
                                        setProductQuery(e.target.value);
                                        setShowProductDropdown(true);
                                    }}
                                    onFocus={() => setShowProductDropdown(true)}
                                />

                                {showProductDropdown && (
                                    <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-black/10 shadow-2xl max-h-56 overflow-y-auto divide-y divide-black/5">
                                        {filteredProducts.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-foreground/40">
                                                No products found matching "{productQuery}"
                                            </div>
                                        ) : (
                                            filteredProducts.map((p) => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleSelectProduct(p)}
                                                    className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors text-xs"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-primary">{p.code}</span>
                                                            <span className="font-bold text-foreground">{p.name}</span>
                                                        </div>
                                                        <p className="text-[11px] text-foreground/40 mt-0.5">
                                                            Current Cost: {formatCurrency(p.costPrice)} | Current Stock: {p.stock} units
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-primary">+ Add</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Cart / Stock In Table */}
                            <div className="border border-black/5 overflow-hidden">
                                {cart.length === 0 ? (
                                    <div className="p-12 text-center text-foreground/40 text-xs">
                                        <Truck className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                        <p className="font-bold">No products selected for stock in</p>
                                        <p className="mt-0.5">Use the search box above to add items to this purchase order.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-black/5 bg-black/[0.02]">
                                                <th className="px-4 py-2.5 font-bold uppercase text-foreground/50">Item</th>
                                                <th className="px-4 py-2.5 font-bold uppercase text-foreground/50 text-center">Stock In Qty</th>
                                                <th className="px-4 py-2.5 font-bold uppercase text-foreground/50 text-right">Cost Price (RS)</th>
                                                <th className="px-4 py-2.5 font-bold uppercase text-foreground/50 text-right">Subtotal</th>
                                                <th className="px-4 py-2.5 font-bold uppercase text-foreground/50 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5">
                                            {cart.map((item) => (
                                                <tr key={item.id} className="hover:bg-black/[0.01]">
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-foreground">{item.name}</p>
                                                        <p className="text-[10px] font-mono text-foreground/40">{item.code}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-20 px-2 py-1 text-center font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                updateCartItem(item.id, "quantity", Math.max(1, Number(e.target.value)))
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-24 px-2 py-1 text-right font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                                            value={item.costPrice}
                                                            onChange={(e) =>
                                                                updateCartItem(item.id, "costPrice", Math.max(0, Number(e.target.value)))
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-sm text-foreground">
                                                        {formatCurrency(item.subtotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => removeCartItem(item.id)}
                                                            className="p-1 hover:bg-red-500/10 text-foreground/40 hover:text-red-500 cursor-pointer transition-colors"
                                                            title="Remove item"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Bill Summary & Checkout */}
                    <div className="space-y-6">
                        <div className="p-6 glass border border-black/5 bg-white shadow-xs space-y-4">
                            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-primary" />
                                Purchase Order Summary
                            </h3>

                            {/* Summary Rows */}
                            <div className="space-y-3 pt-2 text-xs">
                                <div className="flex justify-between items-center text-foreground/70 font-medium">
                                    <span>Items Gross Total</span>
                                    <span className="font-bold text-foreground">{formatCurrency(grossTotal)}</span>
                                </div>

                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-foreground/70 font-medium">Supplier Discount (RS)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-28 px-2 py-1 text-right font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground text-xs"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                    />
                                </div>

                                <div className="p-3 bg-primary/5 border border-primary/10 flex justify-between items-center">
                                    <span className="font-bold text-xs uppercase text-primary">Net Purchase Total</span>
                                    <span className="font-black text-lg text-primary">{formatCurrency(netTotal)}</span>
                                </div>

                                <div className="flex justify-between items-center gap-3">
                                    <span className="text-foreground/70 font-medium">Amount Paid (Cash)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-28 px-2 py-1 text-right font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground text-xs"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-foreground/80 font-bold border-t border-black/5 pt-2">
                                    <span>Remaining Balance (Payable)</span>
                                    <span className={cn("text-sm font-black", balance > 0 ? "text-red-600" : "text-emerald-600")}>
                                        {formatCurrency(balance)}
                                    </span>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-foreground/70 block mb-1">
                                        Notes / Batch Remarks
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Add any delivery notes or batch references..."
                                        className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleProcessPurchase}
                                disabled={isSubmitting || cart.length === 0 || !selectedSupplierId}
                                className="w-full py-3 premium-gradient text-white font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-none animate-spin" />
                                        <span>Saving Stock In...</span>
                                    </>
                                ) : (
                                    <>
                                        <Truck className="w-4 h-4" />
                                        <span>Process Stock In ({cart.length} Items)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ================= PURCHASE HISTORY LOG TAB ================= */
                <div className="glass border border-black/5 bg-white shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-black/5 bg-black/[0.01] flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by invoice number or supplier..."
                                className="w-full pl-10 pr-4 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                            />
                        </div>
                        <div className="text-xs font-bold text-foreground/50">
                            Total {filteredPurchases.length} Purchase Invoices
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-black/5 bg-black/[0.01]">
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40">Invoice #</th>
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40">Supplier</th>
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40">Date</th>
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40 text-center">Items</th>
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40 text-right">Net Total</th>
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40 text-right">Paid</th>
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40 text-right">Balance</th>
                                    <th className="px-6 py-3.5 font-bold uppercase text-foreground/40 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {loadingPurchases ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center text-foreground/40 font-medium">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-none animate-spin" />
                                                <span>Loading purchase records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPurchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center text-foreground/40">
                                            No purchase invoices found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPurchases.map((pur) => (
                                        <tr key={pur.id} className="hover:bg-black/[0.01] transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-primary">
                                                {pur.invoiceNumber}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-foreground">
                                                {pur.supplier?.name}
                                                {pur.supplier?.companyName && (
                                                    <span className="block text-[11px] text-foreground/40 font-normal">
                                                        {pur.supplier.companyName}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-foreground/60">
                                                {new Date(pur.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-0.5 bg-black/5 text-foreground/70 font-bold text-[11px]">
                                                    {pur.items?.length || 0} Products
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-foreground">
                                                {formatCurrency(pur.netTotal)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                {formatCurrency(pur.paidAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black">
                                                <span className={cn(Number(pur.balance) > 0 ? "text-red-600" : "text-emerald-600")}>
                                                    {formatCurrency(pur.balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => printPurchaseReceipt(pur)}
                                                    className="p-1.5 glass border border-black/10 hover:bg-primary/10 hover:text-primary text-foreground/60 transition-colors cursor-pointer"
                                                    title="Print Purchase Bill"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            <AnimatePresence>
                {activeReceipt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveReceipt(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative w-full max-w-lg glass border border-black/5 p-6 md:p-8 shadow-2xl bg-white space-y-5"
                        >
                            <div className="flex justify-between items-center border-b border-black/5 pb-4">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">Stock-In Processed</h3>
                                        <p className="text-xs text-foreground/50">Invoice #{activeReceipt.invoiceNumber}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveReceipt(null)}
                                    className="p-1 text-foreground/40 hover:text-foreground cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-foreground/50">Supplier:</span>
                                    <span className="font-bold text-foreground">{activeReceipt.supplier?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground/50">Date:</span>
                                    <span className="font-bold text-foreground">{new Date(activeReceipt.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground/50">Total Items:</span>
                                    <span className="font-bold text-foreground">{activeReceipt.items?.length} items stocked</span>
                                </div>
                                <div className="flex justify-between border-t border-black/5 pt-2">
                                    <span className="text-foreground/50">Net Amount:</span>
                                    <span className="font-black text-sm text-foreground">{formatCurrency(activeReceipt.netTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground/50">Paid Amount:</span>
                                    <span className="font-bold text-emerald-600">{formatCurrency(activeReceipt.paidAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-foreground/50">Balance (Payable):</span>
                                    <span className="font-bold text-red-600">{formatCurrency(activeReceipt.balance)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-3">
                                <button
                                    onClick={() => setActiveReceipt(null)}
                                    className="px-4 py-2 bg-black/5 hover:bg-black/10 font-bold text-xs text-foreground/70 transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => printPurchaseReceipt(activeReceipt)}
                                    className="px-5 py-2 premium-gradient text-white font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print Purchase Bill</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
