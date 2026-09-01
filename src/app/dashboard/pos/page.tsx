"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    Printer,
    CreditCard,
    CheckCircle2,
    User,
    Percent,
    Search,
    RotateCcw,
    Sparkles,
    UserPlus,
    X,
    FileText,
    ArrowRight,
    Tag,
    DollarSign,
    Box,
    Barcode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function POSPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-none-none animate-spin" />
                <p className="text-sm font-semibold text-foreground/50">Loading Point of Sale...</p>
            </div>
        }>
            <POSContent />
        </Suspense>
    );
}

function POSContent() {
    const searchParams = useSearchParams();
    const quotationId = searchParams.get("quotationId");

    // Main Mode: SALE | QUOTATION | RETURN
    const [activeMode, setActiveMode] = useState<"SALE" | "QUOTATION" | "RETURN">("SALE");
    const [billType, setBillType] = useState<"RETAIL" | "WHOLESALE">("RETAIL");

    // Master Data
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

    // New Customer Form State
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerContact, setNewCustomerContact] = useState("");
    const [newCustomerAddress, setNewCustomerAddress] = useState("");
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    // Common Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cart, setCart] = useState<any[]>([]);
    const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
    const [billDiscountValue, setBillDiscountValue] = useState<number>(0);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [remarks, setRemarks] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Product Search & Adding
    const [productQuery, setProductQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(1);
    const [itemDiscount, setItemDiscount] = useState<number>(0);

    // Sale Return Specific State
    const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
    const [foundInvoice, setFoundInvoice] = useState<any>(null);
    const [returnItems, setReturnItems] = useState<any[]>([]); // items selected for return
    const [returnPayoutMethod, setReturnPayoutMethod] = useState<"ACCOUNT" | "CASH">("ACCOUNT");
    const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);

    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);
    const [lastReturn, setLastReturn] = useState<any>(null);

    const productInputRef = useRef<HTMLInputElement>(null);
    const productContainerRef = useRef<HTMLDivElement>(null);
    const customerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
        const handleClickOutside = (event: MouseEvent) => {
            if (productContainerRef.current && !productContainerRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
            if (customerContainerRef.current && !customerContainerRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (quotationId) {
            fetchQuotation(quotationId);
        }
    }, [quotationId]);

    const loadData = async () => {
        try {
            const [prodRes, custRes] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/customers")
            ]);
            const prodData = await prodRes.json();
            const custData = await custRes.json();
            setProducts(Array.isArray(prodData) ? prodData : []);
            setCustomers(Array.isArray(custData) ? custData : []);
        } catch (error) {
            console.error("Error loading master data:", error);
        }
    };

    const fetchQuotation = async (id: string) => {
        try {
            const res = await fetch(`/api/sales/${id}`);
            const data = await res.json();
            if (data && !data.error) {
                if (data.customer) {
                    setSelectedCustomer(data.customer);
                    setCustomerSearch(data.customer.name);
                }
                setActiveMode("SALE");
                setBillType(data.type === 'QUOTATION' ? 'RETAIL' : data.type);

                const cartItems = data.items.map((item: any) => ({
                    id: `${item.productId}-${Date.now()}-${Math.random()}`,
                    productId: item.productId,
                    code: item.product?.code || "",
                    name: item.name || item.product?.name || "Product",
                    quantity: item.quantity,
                    price: Number(item.price),
                    itemDiscount: Number(item.discount),
                    subtotal: Number(item.subtotal),
                    stock: item.product?.stock || 0
                }));
                setCart(cartItems);
            }
        } catch (error) {
            console.error("Failed to load quotation", error);
        }
    };

    // Customer Selection Handling
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.contact && c.contact.includes(customerSearch))
    );

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerName.trim()) return alert("Customer name is required");
        setIsCreatingCustomer(true);
        try {
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newCustomerName,
                    contact: newCustomerContact,
                    address: newCustomerAddress,
                })
            });
            const created = await res.json();
            if (!res.ok) throw new Error(created.error || "Failed to create customer");

            setCustomers([created, ...customers]);
            setSelectedCustomer(created);
            setCustomerSearch(created.name);
            setShowAddCustomerModal(false);
            setNewCustomerName("");
            setNewCustomerContact("");
            setNewCustomerAddress("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    // Product Selector & Barcode Scan
    const filteredProducts = products.filter(p =>
        p.code.toLowerCase().includes(productQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(productQuery.toLowerCase())
    );

    const handleSelectProduct = (product: any) => {
        setSelectedProductId(product.id);
        setProductName(product.name);
        const itemPrice = billType === "WHOLESALE" ? Number(product.wholesalePrice) : Number(product.retailPrice);
        setPrice(itemPrice);
        setQuantity(1);
        setItemDiscount(0);
        setProductQuery(`${product.code} - ${product.name}`);
        setShowProductDropdown(false);
    };

    const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && productQuery.trim()) {
            // Check exact barcode match first
            const exactMatch = products.find(p => p.code.toLowerCase() === productQuery.trim().toLowerCase());
            if (exactMatch) {
                quickAddProductToCart(exactMatch);
                setProductQuery("");
                setShowProductDropdown(false);
                return;
            }
            // If 1 item filtered, select it
            if (filteredProducts.length === 1) {
                quickAddProductToCart(filteredProducts[0]);
                setProductQuery("");
                setShowProductDropdown(false);
            }
        }
    };

    const quickAddProductToCart = (product: any) => {
        const itemPrice = billType === "WHOLESALE" ? Number(product.wholesalePrice) : Number(product.retailPrice);
        const existingIndex = cart.findIndex(c => c.productId === product.id && c.price === itemPrice && c.itemDiscount === 0);

        if (existingIndex > -1) {
            const updatedCart = [...cart];
            updatedCart[existingIndex].quantity += 1;
            updatedCart[existingIndex].subtotal = (updatedCart[existingIndex].price * updatedCart[existingIndex].quantity) - updatedCart[existingIndex].itemDiscount;
            setCart(updatedCart);
        } else {
            const newItem = {
                id: `${product.id}-${Date.now()}`,
                productId: product.id,
                code: product.code,
                name: product.name,
                quantity: 1,
                price: itemPrice,
                itemDiscount: 0,
                subtotal: itemPrice,
                stock: product.stock
            };
            setCart([...cart, newItem]);
        }
    };

    const addCustomProductToCart = () => {
        if (!selectedProductId) return;
        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const subtotal = (price * quantity) - Number(itemDiscount);
        const newItem = {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            code: product.code,
            name: productName || product.name,
            quantity: Number(quantity),
            price: Number(price),
            itemDiscount: Number(itemDiscount),
            subtotal: subtotal,
            stock: product.stock
        };

        setCart([...cart, newItem]);

        // Reset quick form
        setSelectedProductId("");
        setProductName("");
        setPrice(0);
        setQuantity(1);
        setItemDiscount(0);
        setProductQuery("");
    };

    const updateCartQuantity = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return {
                    ...item,
                    quantity: newQty,
                    subtotal: (item.price * newQty) - item.itemDiscount
                };
            }
            return item;
        }));
    };

    const updateCartItemField = (id: string, field: string, value: any) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                updated.subtotal = (Number(updated.price) * Number(updated.quantity)) - Number(updated.itemDiscount || 0);
                return updated;
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    // Financial calculations
    const itemsGrossTotal = cart.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
    const itemDiscountsTotal = cart.reduce((sum, item) => sum + Number(item.itemDiscount || 0), 0);
    const subtotalAfterItemDiscounts = Math.max(0, itemsGrossTotal - itemDiscountsTotal);

    let calculatedBillDiscountAmount = 0;
    if (discountType === "PERCENT") {
        calculatedBillDiscountAmount = (subtotalAfterItemDiscounts * Math.min(100, Math.max(0, billDiscountValue))) / 100;
    } else {
        calculatedBillDiscountAmount = Math.min(subtotalAfterItemDiscounts, Math.max(0, billDiscountValue));
    }

    const netTotal = Math.max(0, subtotalAfterItemDiscounts - calculatedBillDiscountAmount);
    const balance = netTotal - paidAmount;

    // Checkout Handling
    const handleCheckout = async () => {
        if (!selectedCustomer) return alert("Please select a customer before completing checkout");
        if (cart.length === 0) return alert("Cart is empty. Add items first!");

        setIsProcessing(true);
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId: selectedCustomer.id,
                    date,
                    type: activeMode === "QUOTATION" ? "QUOTATION" : billType,
                    items: cart,
                    total: itemsGrossTotal,
                    discount: itemDiscountsTotal + calculatedBillDiscountAmount,
                    netTotal,
                    paidAmount: activeMode === "QUOTATION" ? 0 : Number(paidAmount),
                    balance: activeMode === "QUOTATION" ? 0 : (balance > 0 ? balance : 0),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to process transaction");

            setLastSale(data);
            setLastReturn(null);
            setShowReceipt(true);

            // Clear state
            setCart([]);
            setPaidAmount(0);
            setBillDiscountValue(0);
            setRemarks("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Sale Return Logic
    const handleSearchInvoice = async () => {
        if (!invoiceSearchQuery.trim()) return;
        setIsSearchingInvoice(true);
        try {
            const res = await fetch(`/api/sales`);
            const allSales = await res.json();
            if (Array.isArray(allSales)) {
                const match = allSales.find((s: any) => s.billNumber.toLowerCase() === invoiceSearchQuery.trim().toLowerCase());
                if (match) {
                    setFoundInvoice(match);
                    if (match.customer) {
                        setSelectedCustomer(match.customer);
                        setCustomerSearch(match.customer.name);
                    }
                    // Init return items
                    const itemsToReturn = match.items.map((it: any) => ({
                        productId: it.productId,
                        name: it.name || it.product?.name,
                        originalQty: it.quantity,
                        price: Number(it.price),
                        returnQty: 0,
                        subtotal: 0
                    }));
                    setReturnItems(itemsToReturn);
                } else {
                    alert(`No invoice found with number "${invoiceSearchQuery}"`);
                    setFoundInvoice(null);
                    setReturnItems([]);
                }
            }
        } catch (error) {
            console.error("Error searching invoice:", error);
            alert("Failed to search invoice");
        } finally {
            setIsSearchingInvoice(false);
        }
    };

    const updateReturnQuantity = (productId: string, returnQty: number) => {
        setReturnItems(returnItems.map(item => {
            if (item.productId === productId) {
                const validQty = Math.min(item.originalQty, Math.max(0, returnQty));
                return {
                    ...item,
                    returnQty: validQty,
                    subtotal: validQty * item.price
                };
            }
            return item;
        }));
    };

    const totalReturnAmount = returnItems.reduce((sum, item) => sum + item.subtotal, 0);

    const handleProcessReturn = async () => {
        if (!selectedCustomer) return alert("Please select a customer for the return");
        const activeReturns = returnItems.filter(i => i.returnQty > 0);
        if (activeReturns.length === 0) return alert("Please select at least 1 item quantity to return");

        setIsProcessing(true);
        try {
            const payload = {
                customerId: selectedCustomer.id,
                saleId: foundInvoice?.id || null,
                date,
                items: activeReturns.map(i => ({
                    productId: i.productId,
                    name: i.name,
                    quantity: i.returnQty,
                    price: i.price,
                    subtotal: i.subtotal
                })),
                totalAmount: totalReturnAmount,
                creditAmount: returnPayoutMethod === "ACCOUNT" ? totalReturnAmount : 0,
                refundAmount: returnPayoutMethod === "CASH" ? totalReturnAmount : 0,
                remarks: remarks || (foundInvoice ? `Return for ${foundInvoice.billNumber}` : "Direct Sale Return")
            };

            const res = await fetch("/api/sales/return", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to process sale return");

            setLastReturn(data);
            setLastSale(null);
            setShowReceipt(true);

            // Reset return form
            setFoundInvoice(null);
            setReturnItems([]);
            setInvoiceSearchQuery("");
            setRemarks("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Print Receipt Handler
    const handlePrint = () => {
        const record = lastSale || lastReturn;
        if (!record) return;

        const isReturn = !!lastReturn;
        const isWholesale = record.type === 'WHOLESALE';

        const printWindow = window.open('', '_blank', isWholesale ? 'width=800,height=1000' : 'width=300,height=600');
        if (!printWindow) return;

        if (isReturn) {
            // Return Credit Note / Voucher Format
            const receiptHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Return Voucher - ${record.returnNumber}</title>
                    <style>
                        @page { size: A4; margin: 10mm; }
                        body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; color: black; padding: 20px; background: white; }
                        .container { border: 2px solid #000; padding: 20px; min-height: 250mm; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                        .header h1 { font-size: 24px; margin: 0; font-weight: 800; }
                        .info-box { margin-bottom: 15px; background: #f9f9f9; padding: 10px; border-radius: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        th { background: #eee; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .grand-total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; border-top: 2px solid #000; padding-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div>
                                <h1>Liberty Kollection</h1>
                                <p>Chapai wali gali, Committee Bazar, Mandi Bahauddin</p>
                                <p>0345 5754717 | 0546-506717</p>
                            </div>
                            <div style="text-align: right;">
                                <h2 style="color: #dc2626; margin:0;">CREDIT NOTE / RETURN</h2>
                                <p>Voucher #: <strong>${record.returnNumber}</strong></p>
                                <p>Date: <strong>${new Date(record.date).toLocaleDateString()}</strong></p>
                            </div>
                        </div>

                        <div class="info-box">
                            <p><strong>Customer:</strong> ${record.customer?.name} (${record.customer?.contact || 'N/A'})</p>
                            ${record.sale ? `<p><strong>Original Ref Bill:</strong> ${record.sale.billNumber}</p>` : ''}
                            <p><strong>Payout Mode:</strong> ${Number(record.creditAmount) > 0 ? 'Account Credit (Ledger Adjusted)' : 'Cash Refunded'}</p>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Sr #</th>
                                    <th>Returned Item</th>
                                    <th class="text-right">Price</th>
                                    <th class="text-center">Qty</th>
                                    <th class="text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${record.items.map((item: any, i: number) => `
                                    <tr>
                                        <td class="text-center">${i + 1}</td>
                                        <td>${item.name}</td>
                                        <td class="text-right">${Number(item.price).toFixed(2)}</td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-right">${Number(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="grand-total">
                            Total Return Value: RS ${Number(record.totalAmount).toLocaleString()}
                        </div>

                        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                            <div>Customer Signature: __________________</div>
                            <div>Authorized Signature: __________________</div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
                    </script>
                </body>
                </html>
            `;
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            return;
        }

        // Wholesale A4 format or Thermal format for Sale
        // Wholesale A4 format or Thermal format for Sale
        if (isWholesale) {
            const getWords = (n: number) => {
                if (!n || n === 0) return "Zero Rupees Only";
                const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
                const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
                const sr = (num: number, s: string) => {
                    let res = "";
                    if (num > 99) { res += ones[Math.floor(num / 100)] + " Hundred "; num %= 100; }
                    if (num > 19) { res += tens[Math.floor(num / 10)] + " "; num %= 10; }
                    if (num > 0) res += ones[num] + " ";
                    if (res !== "") res += s + " ";
                    return res;
                };
                let res = "";
                res += sr(Math.floor(n / 10000000), "Crore");
                res += sr(Math.floor((n % 10000000) / 100000), "Lakh");
                res += sr(Math.floor((n % 100000) / 1000), "Thousand");
                res += sr(n % 1000, "");
                return res.trim() + " Rupees Only";
            };

            const itemsGross = record.items.reduce((sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)), 0);
            const totalItemDiscounts = record.items.reduce((sum: number, it: any) => sum + (Number(it.discount) || 0), 0);
            const totalDiscount = Number(record.discount || 0);
            const billDiscountValue = Math.max(0, totalDiscount - totalItemDiscounts);

            const printHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Invoice - ${record.billNumber}</title>
                    <style>
                        @page { size: A4; margin: 8mm; }
                        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
                        .container { padding: 24px; border: 2px solid #000; min-height: 265mm; position: relative; box-sizing: border-box; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
                        .store-info h1 { font-size: 26px; margin: 0 0 2px 0; font-weight: 900; letter-spacing: 0.5px; }
                        .store-info p { margin: 2px 0; font-size: 11px; font-weight: 500; }
                        .invoice-title-box { text-align: right; }
                        .invoice-title-box h2 { font-size: 22px; margin: 0; text-decoration: underline; letter-spacing: 1px; font-weight: 900; }
                        .customer-info { margin-bottom: 14px; font-size: 12px; line-height: 1.5; }
                        .info-row { display: flex; margin-bottom: 3px; }
                        .info-label { width: 140px; font-weight: 600; }
                        .info-value { font-weight: 800; text-transform: uppercase; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        th, td { border: 1px solid #000; padding: 6px 8px; }
                        th { background: #e8e8e8 !important; font-size: 11px; text-transform: uppercase; font-weight: 800; }
                        td { font-size: 11px; font-weight: 600; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .footer-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
                        .footer-left { flex: 1; padding-right: 20px; }
                        .footer-right { width: 320px; }
                        .sum-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; font-weight: 600; border-bottom: 1px solid #ddd; }
                        .sum-row.grand { border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 6px; padding: 6px 0; font-size: 17px; font-weight: 900; }
                        .urdu-note { font-size: 15px; font-weight: 800; text-align: left; margin: 15px 0 10px 0; font-family: 'Urdu Typesetting', 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial; }
                        .amount-words { font-size: 13px; font-weight: 800; text-decoration: underline; margin-top: 8px; }
                        .barcode-box { margin-top: 2px; font-size: 11px; letter-spacing: 1px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <img src="${window.location.origin}/libertycollection.png" alt="Logo" style="height: 85px; object-fit: contain;" />
                                <div class="store-info">
                                    <h1>Liberty Kollection</h1>
                                    <p>Chapai wali gali ,Committe Bazar , Mandi Bahauddin</p>
                                    <p>0345 5754717 | 0546-506717</p>
                                </div>
                            </div>
                            <div class="invoice-title-box">
                                <h2>SALE INVOICE</h2>
                                <div style="margin-top: 8px;">
                                    <div>Invoice #: <strong>${record.billNumber}</strong></div>
                                    <div class="barcode-box">|||||||||||||||||||||||||</div>
                                    <div>Date: <strong>${new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                                </div>
                            </div>
                        </div>

                        <div class="customer-info">
                            <div class="info-row"><span class="info-label">Customer Name:</span> <span class="info-value">${record.customer?.name || 'Walk-in'}</span></div>
                            <div class="info-row"><span class="info-label">Operator:</span> <span class="info-value">ADMIN</span></div>
                            <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">M.B.D</span></div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 6%;">SR. #</th>
                                    <th>PRODUCT NAME</th>
                                    <th style="width: 14%;" class="text-right">PRICE</th>
                                    <th style="width: 12%;" class="text-center">QUANTITY</th>
                                    <th style="width: 14%;" class="text-right">DISCOUNT</th>
                                    <th style="width: 16%;" class="text-right">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${record.items.map((item: any, i: number) => {
                                    const itemPrice = Number(item.price);
                                    const itemQty = Number(item.quantity);
                                    const itemDiscount = Number(item.discount || 0);
                                    const itemTotal = (itemPrice * itemQty) - itemDiscount;
                                    return `
                                        <tr>
                                            <td class="text-center">${i + 1}</td>
                                            <td>${item.name}</td>
                                            <td class="text-right">${itemPrice.toFixed(2)}</td>
                                            <td class="text-center">${itemQty}</td>
                                            <td class="text-right">${itemDiscount.toFixed(2)}</td>
                                            <td class="text-right">${itemTotal.toFixed(2)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>

                        <div class="footer-flex">
                            <div class="footer-left">
                                <div class="urdu-note" dir="rtl">نوٹ: امپورٹڈ، ایکسپائرڈ اور ٹوٹی ہوئی آئٹمز کی واپسی یا تبدیلی نہیں ہوگی۔</div>
                                <div class="amount-words">${getWords(Math.round(Number(record.netTotal)))}</div>
                            </div>
                            <div class="footer-right">
                                <div class="sum-row"><span>Gross Amount:</span><span>${itemsGross.toFixed(2)}</span></div>
                                <div class="sum-row"><span>Bill Discount:</span><span>${billDiscountValue > 0 ? billDiscountValue.toFixed(2) : (totalItemDiscounts > 0 ? totalItemDiscounts.toFixed(2) : '0.00')}</span></div>
                                <div class="sum-row grand"><span>Total Bill Amount:</span><span>${Number(record.netTotal).toFixed(2)}</span></div>
                            </div>
                        </div>

                        <div style="position: absolute; bottom: 12px; left: 24px; font-size: 10px; color: #666; font-weight: 600;">powered by RapidTechPro</div>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
                    </script>
                </body>
                </html>
            `;
            printWindow.document.write(printHTML);
            printWindow.document.close();
            return;
        }

        // Thermal standard receipt
        const itemsGross = record.items.reduce((sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)), 0);
        const itemDiscounts = record.items.reduce((sum: number, it: any) => sum + (Number(it.discount || 0)), 0);
        const totalSaleDiscount = Number(record.discount || 0);
        const billDiscountValue = Math.max(0, totalSaleDiscount - itemDiscounts);
        const billDiscountPercentage = itemsGross > 0 ? (billDiscountValue / itemsGross) * 100 : 0;
        const paymentMethod = Number(record.paidAmount) >= Number(record.netTotal) ? 'Cash' : (Number(record.paidAmount) > 0 ? 'Partial' : 'Credit');

        const thermalHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Receipt - ${record.billNumber}</title>
                <style>
                    @page { size: 80mm auto; margin: 4mm; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5px; padding: 2px 4px; color: #000; font-weight: 600; line-height: 1.3; }
                    .header { text-align: center; margin-bottom: 6px; }
                    .header img { height: 95px; max-width: 100%; object-fit: contain; margin: 0 auto 4px auto; display: block; }
                    .header p { margin: 1px 0; font-size: 9px; font-weight: 600; }
                    .divider { border-top: 1px dashed #000; margin: 6px 0; }
                    .divider-double { border-top: 2px dashed #000; margin: 6px 0; }
                    .info-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 10px; }
                    table { width: 100%; border-collapse: collapse; margin: 5px 0; }
                    th { font-weight: 800; text-transform: uppercase; font-size: 9.5px; padding: 3px 1px; border-bottom: 1px dashed #000; }
                    td { padding: 3px 1px; font-size: 9.5px; vertical-align: top; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .total-row { display: flex; justify-content: space-between; font-size: 10px; margin: 2px 0; }
                    .total-row.grand { font-size: 13px; font-weight: 900; margin: 4px 0; }
                    .footer { text-align: center; margin-top: 8px; font-size: 8.5px; }
                    .footer p { margin: 2px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${window.location.origin}/libertycollection.png" alt="Liberty Kollection" />
                    <p>Chapai wali gali ,Committe Bazar , Mandi Bahauddin</p>
                    <p>0345 5754717 | 0546-506717</p>
                </div>
                <div class="divider"></div>
                <div class="info-row"><span>Receipt #:</span><span>${record.billNumber}</span></div>
                <div class="info-row"><span>Date:</span><span>${new Date(record.date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
                <div class="info-row"><span>Customer:</span><span>${record.customer?.name || 'Walk-in'}</span></div>
                <div class="info-row"><span>Cashier:</span><span>Admin</span></div>
                <div class="divider"></div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">ITEM</th>
                            <th class="text-center" style="width: 10%;">QTY</th>
                            <th class="text-right" style="width: 22%;">PRICE</th>
                            <th class="text-right" style="width: 18%;">DISC</th>
                            <th class="text-right" style="width: 24%;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${record.items.map((item: any) => {
                            const itemPrice = Number(item.price);
                            const itemQty = Number(item.quantity);
                            const itemDiscount = Number(item.discount || 0);
                            const itemTotal = (itemPrice * itemQty) - itemDiscount;
                            return `
                                <tr>
                                    <td style="text-align: left; word-break: break-word;">${item.name}</td>
                                    <td class="text-center">${itemQty}</td>
                                    <td class="text-right">${itemPrice.toFixed(2)}</td>
                                    <td class="text-right">${itemDiscount.toFixed(2)}</td>
                                    <td class="text-right">${itemTotal.toFixed(2)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div class="divider"></div>
                <div class="total-row"><span>Subtotal:</span><span>${itemsGross.toFixed(2)}</span></div>
                ${itemDiscounts > 0 && billDiscountValue > 0 ? `
                    <div class="total-row"><span>Item Discount:</span><span>- ${itemDiscounts.toFixed(2)}</span></div>
                    <div class="total-row"><span>Bill Discount ${billDiscountPercentage > 0 ? `(${billDiscountPercentage.toFixed(0)}%)` : ''}:</span><span>- ${billDiscountValue.toFixed(2)}</span></div>
                ` : billDiscountValue > 0 ? `
                    <div class="total-row"><span>Bill Discount ${billDiscountPercentage > 0 ? `(${billDiscountPercentage.toFixed(0)}%)` : ''}:</span><span>- ${billDiscountValue.toFixed(2)}</span></div>
                ` : itemDiscounts > 0 ? `
                    <div class="total-row"><span>Bill Discount:</span><span>- ${itemDiscounts.toFixed(2)}</span></div>
                ` : ''}
                <div class="divider-double"></div>
                <div class="total-row grand"><span>TOTAL:</span><span>${Number(record.netTotal).toFixed(2)}</span></div>
                <div class="divider-double"></div>
                <div class="total-row"><span>Payment Method:</span><span>${paymentMethod}</span></div>
                <div class="total-row"><span>Amount Received:</span><span>${Number(record.paidAmount || 0).toFixed(2)}</span></div>
                ${Number(record.balance || 0) > 0 ? `<div class="total-row" style="color: #c00;"><span>Balance Due:</span><span>${Number(record.balance).toFixed(2)}</span></div>` : ''}
                <div class="divider"></div>
                <div class="footer">
                    <p style="margin-bottom: 4px; line-height: 1.35;">
                        No item can be returned after sale.<br>
                        Items can be exchanged only within 3 days of purchase.<br>
                        Receipt must be presented for exchange.
                    </p>
                    <div class="divider"></div>
                    <p>For queries: 0345 5754717 | 0546-506717</p>
                    <p style="font-size: 7.5px; margin-top: 5px; opacity: 0.8;">Powered By RapidTechPro</p>
                </div>
                <script>
                    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(thermalHTML);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            {/* Top Bar Navigation & Mode Toggles */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 backdrop-blur-xl p-4 rounded-none-none border border-black/5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-none-none bg-primary/10 text-primary">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight">Point of Sale</h2>
                        <p className="text-xs text-foreground/50 font-medium">Billing, Sales, and Returns Counter</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Primary Mode Tabs */}
                    <div className="flex bg-black/5 p-1 rounded-none-none border border-black/5 flex-1 md:flex-initial">
                        <button
                            onClick={() => setActiveMode("SALE")}
                            className={cn(
                                "flex-1 md:flex-initial px-4 py-2 rounded-none-none text-xs font-bold transition-all flex items-center justify-center gap-2",
                                activeMode === "SALE" ? "bg-primary text-white shadow-md" : "text-foreground/60 hover:text-foreground"
                            )}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Sale
                        </button>
                        <button
                            onClick={() => setActiveMode("QUOTATION")}
                            className={cn(
                                "flex-1 md:flex-initial px-4 py-2 rounded-none-none text-xs font-bold transition-all flex items-center justify-center gap-2",
                                activeMode === "QUOTATION" ? "bg-amber-600 text-white shadow-md" : "text-foreground/60 hover:text-foreground"
                            )}
                        >
                            <FileText className="w-4 h-4" />
                            Quotation
                        </button>
                        <button
                            onClick={() => setActiveMode("RETURN")}
                            className={cn(
                                "flex-1 md:flex-initial px-4 py-2 rounded-none-none text-xs font-bold transition-all flex items-center justify-center gap-2",
                                activeMode === "RETURN" ? "bg-red-600 text-white shadow-md" : "text-foreground/60 hover:text-foreground"
                            )}
                        >
                            <RotateCcw className="w-4 h-4" />
                            Sale Return
                        </button>
                    </div>

                    {/* Retail / Wholesale toggle (Only for SALE mode) */}
                    {activeMode === "SALE" && (
                        <div className="flex bg-black/5 p-1 rounded-none-none border border-black/5">
                            <button
                                onClick={() => setBillType("RETAIL")}
                                className={cn(
                                    "px-3 py-1.5 rounded-none-none text-xs font-bold transition-all",
                                    billType === "RETAIL" ? "bg-slate-800 text-white shadow-sm" : "text-foreground/50 hover:text-foreground"
                                )}
                            >
                                Retail
                            </button>
                            <button
                                onClick={() => setBillType("WHOLESALE")}
                                className={cn(
                                    "px-3 py-1.5 rounded-none-none text-xs font-bold transition-all",
                                    billType === "WHOLESALE" ? "bg-purple-700 text-white shadow-sm" : "text-foreground/50 hover:text-foreground"
                                )}
                            >
                                Wholesale
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area based on Active Mode */}
            {activeMode === "RETURN" ? (
                /* ================= SALE RETURN MODE ================= */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Return Selection Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Invoice Lookup Card */}
                        <div className="rounded-none-none glass border border-red-500/10 bg-red-500/[0.01] p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Lookup Invoice for Return
                            </h3>

                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                    <input
                                        type="text"
                                        placeholder="Enter Bill Number e.g. INV-000001"
                                        className="w-full pl-12 pr-4 py-3.5 rounded-none-none bg-black/5 border border-black/10 focus:outline-none focus:border-red-500 font-bold"
                                        value={invoiceSearchQuery}
                                        onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchInvoice()}
                                    />
                                </div>
                                <button
                                    onClick={handleSearchInvoice}
                                    disabled={isSearchingInvoice || !invoiceSearchQuery.trim()}
                                    className="px-6 py-3.5 rounded-none-none bg-red-600 hover:bg-red-700 text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSearchingInvoice ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-none-none animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    Find Bill
                                </button>
                            </div>
                        </div>

                        {/* Return Items Selection Table */}
                        <div className="rounded-none-none glass border border-black/5 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-black/5 bg-black/[0.02] flex justify-between items-center">
                                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                    <Box className="w-4 h-4 text-red-600" />
                                    Select Items to Return
                                </h3>
                                {foundInvoice && (
                                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-none-none bg-red-500/10 text-red-600">
                                        Bill #{foundInvoice.billNumber}
                                    </span>
                                )}
                            </div>

                            <div className="overflow-x-auto max-h-[450px]">
                                {returnItems.length === 0 ? (
                                    <div className="p-16 text-center text-foreground/40">
                                        <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-20 text-red-500" />
                                        <p className="font-bold">Search a bill number above to load sold items</p>
                                        <p className="text-xs mt-1">Or select a customer on the right to process a direct return</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-black/[0.01] sticky top-0">
                                            <tr className="border-b border-black/5 text-xs font-bold text-foreground/50 uppercase">
                                                <th className="px-4 py-3">Product</th>
                                                <th className="px-4 py-3 text-right">Sold Price</th>
                                                <th className="px-4 py-3 text-center">Sold Qty</th>
                                                <th className="px-4 py-3 text-center">Return Qty</th>
                                                <th className="px-4 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5">
                                            {returnItems.map((item) => (
                                                <tr key={item.productId} className="hover:bg-black/[0.01]">
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-sm">{item.name}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-sm">
                                                        {formatCurrency(item.price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-sm">
                                                        {item.originalQty}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="inline-flex items-center gap-2 bg-black/5 rounded-none-none p-1 border border-black/5">
                                                            <button
                                                                onClick={() => updateReturnQuantity(item.productId, item.returnQty - 1)}
                                                                className="w-7 h-7 rounded-none-none bg-white flex items-center justify-center font-bold shadow-sm hover:bg-black/5"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.originalQty}
                                                                className="w-12 text-center bg-transparent font-black text-sm focus:outline-none"
                                                                value={item.returnQty}
                                                                onChange={(e) => updateReturnQuantity(item.productId, Number(e.target.value))}
                                                            />
                                                            <button
                                                                onClick={() => updateReturnQuantity(item.productId, item.returnQty + 1)}
                                                                className="w-7 h-7 rounded-none-none bg-white flex items-center justify-center font-bold shadow-sm hover:bg-black/5"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-red-600 text-sm">
                                                        {formatCurrency(item.subtotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Return Summary & Payout Column */}
                    <div className="space-y-6">
                        {/* Customer Panel */}
                        <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm space-y-3">
                            <label className="text-xs font-bold text-foreground/50 uppercase tracking-widest block">
                                Customer Account
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type="text"
                                    placeholder="Search customer..."
                                    className="w-full pl-12 pr-4 py-3 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-red-500 font-bold"
                                    value={customerSearch}
                                    onChange={(e) => {
                                        setCustomerSearch(e.target.value);
                                        setShowCustomerDropdown(true);
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                />
                                {showCustomerDropdown && (
                                    <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-white rounded-none-none shadow-xl border border-black/10 max-h-48 overflow-y-auto divide-y divide-black/5">
                                        {filteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                className="p-3 hover:bg-black/5 cursor-pointer flex justify-between items-center"
                                                onClick={() => {
                                                    setSelectedCustomer(c);
                                                    setCustomerSearch(c.name);
                                                    setShowCustomerDropdown(false);
                                                }}
                                            >
                                                <div>
                                                    <p className="font-bold text-sm">{c.name}</p>
                                                    <p className="text-xs text-foreground/50">{c.contact}</p>
                                                </div>
                                                <span className="text-xs font-bold text-red-600">
                                                    Bal: {formatCurrency(c.balance)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedCustomer && (
                                <div className="p-3 rounded-none-none bg-red-500/5 border border-red-500/10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-foreground/50 font-bold uppercase">Selected Customer</p>
                                        <p className="font-black text-sm">{selectedCustomer.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-foreground/50 font-bold uppercase">Current Debt</p>
                                        <p className="font-black text-sm text-red-600">{formatCurrency(selectedCustomer.balance)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payout Options & Complete Return */}
                        <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-widest">
                                Return Payout Mode
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setReturnPayoutMethod("ACCOUNT")}
                                    className={cn(
                                        "py-3.5 rounded-none-none font-bold text-xs transition-all border flex flex-col items-center gap-1",
                                        returnPayoutMethod === "ACCOUNT"
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg"
                                            : "bg-black/5 border-black/5 text-foreground/60 hover:text-foreground"
                                    )}
                                >
                                    <span>Account Credit</span>
                                    <span className="text-[10px] opacity-80">(Reduces Customer Debt)</span>
                                </button>
                                <button
                                    onClick={() => setReturnPayoutMethod("CASH")}
                                    className={cn(
                                        "py-3.5 rounded-none-none font-bold text-xs transition-all border flex flex-col items-center gap-1",
                                        returnPayoutMethod === "CASH"
                                            ? "bg-amber-600 text-white border-amber-600 shadow-lg"
                                            : "bg-black/5 border-black/5 text-foreground/60 hover:text-foreground"
                                    )}
                                >
                                    <span>Cash Refund</span>
                                    <span className="text-[10px] opacity-80">(Pays Cash to Customer)</span>
                                </button>
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="text-xs font-bold text-foreground/50 uppercase tracking-widest block mb-1">
                                    Return Note / Reason
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-red-500 font-medium text-xs resize-none"
                                    rows={2}
                                    placeholder="Defective item, size exchange, etc..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </div>

                            {/* Total Return Amount */}
                            <div className="p-4 rounded-none-none bg-red-600 text-white space-y-1">
                                <span className="text-xs font-bold uppercase opacity-80 tracking-wider">Total Return Value</span>
                                <div className="text-3xl font-black">{formatCurrency(totalReturnAmount)}</div>
                            </div>

                            {/* Submit Return */}
                            <button
                                onClick={handleProcessReturn}
                                disabled={isProcessing || totalReturnAmount === 0 || !selectedCustomer}
                                className="w-full py-4 rounded-none-none bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-none-none animate-spin" />
                                        Processing Return...
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="w-5 h-5" />
                                        Process Sale Return
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ================= SALE & QUOTATION MODE ================= */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Product Selection & Cart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Search & Add Product Card */}
                        <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-widest flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-primary" />
                                    Add Items to Cart
                                </h3>
                                <span className="text-xs text-foreground/40 font-mono">Press Enter to scan barcode</span>
                            </div>

                            <div className="relative" ref={productContainerRef}>
                                <div className="relative flex items-center">
                                    <Search className="absolute left-4 w-5 h-5 text-foreground/40" />
                                    <input
                                        ref={productInputRef}
                                        type="text"
                                        placeholder="Scan barcode or type product name/code..."
                                        className="w-full pl-12 pr-4 py-3.5 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold text-sm"
                                        value={productQuery}
                                        onChange={(e) => {
                                            setProductQuery(e.target.value);
                                            setShowProductDropdown(true);
                                        }}
                                        onFocus={() => setShowProductDropdown(true)}
                                        onKeyDown={handleProductKeyDown}
                                    />
                                    {productQuery && (
                                        <button
                                            onClick={() => {
                                                setProductQuery("");
                                                setSelectedProductId("");
                                            }}
                                            className="absolute right-4 p-1 rounded-none-none hover:bg-black/10 text-foreground/40"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Instant Product Dropdown */}
                                {showProductDropdown && (
                                    <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-white rounded-none-none shadow-2xl border border-black/10 max-h-60 overflow-y-auto divide-y divide-black/5">
                                        {filteredProducts.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-foreground/40 font-medium">
                                                No products found {productQuery ? `matching "${productQuery}"` : ""}
                                            </div>
                                        ) : (
                                            filteredProducts.map(p => {
                                                const unitPrice = billType === "WHOLESALE" ? Number(p.wholesalePrice) : Number(p.retailPrice);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className="p-3 hover:bg-black/5 cursor-pointer flex justify-between items-center transition-colors"
                                                        onClick={() => handleSelectProduct(p)}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs font-bold text-primary">{p.code}</span>
                                                                <span className="font-bold text-sm text-foreground">{p.name}</span>
                                                            </div>
                                                            <p className="text-xs text-foreground/40 mt-0.5">
                                                                Retail: {formatCurrency(p.retailPrice)} | Wholesale: {formatCurrency(p.wholesalePrice)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-sm text-foreground">{formatCurrency(unitPrice)}</p>
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-none-none inline-block mt-0.5",
                                                                p.stock > 5 ? "bg-emerald-500/10 text-emerald-600" : p.stock > 0 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                                                            )}>
                                                                Stock: {p.stock}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Detailed item modifier (when product selected) */}
                            {selectedProductId && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-none-none bg-black/[0.02] border border-black/5 grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-12 md:col-span-4">
                                        <label className="text-[10px] font-bold uppercase text-foreground/40 block mb-1">Item Title</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 rounded-none-none bg-white border border-black/10 font-bold text-sm"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-foreground/40 block mb-1">Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 rounded-none-none bg-white border border-black/10 font-black text-sm text-center"
                                            value={price}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-foreground/40 block mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-3 py-2 rounded-none-none bg-white border border-black/10 font-black text-sm text-center"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-foreground/40 block mb-1">Discount</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2 rounded-none-none bg-white border border-black/10 font-medium text-sm text-center"
                                            value={itemDiscount}
                                            onChange={(e) => setItemDiscount(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-12 md:col-span-2">
                                        <button
                                            onClick={addCustomProductToCart}
                                            className="w-full py-2 rounded-none-none bg-primary text-white font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Cart Table */}
                        <div className="rounded-none-none glass border border-black/5 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-black/5 bg-black/[0.02] flex items-center justify-between">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-primary" />
                                    Cart Items ({cart.length})
                                </h3>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => setCart([])}
                                        className="text-xs text-red-500 font-bold hover:underline"
                                    >
                                        Clear Cart
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[420px] overflow-y-auto">
                                {cart.length === 0 ? (
                                    <div className="p-16 text-center text-foreground/40">
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-medium">No items added to cart</p>
                                        <p className="text-xs mt-1">Scan barcode or search products above</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-black/[0.01] sticky top-0">
                                            <tr className="border-b border-black/5 text-xs font-bold text-foreground/40 uppercase">
                                                <th className="px-4 py-3">Item</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3 text-right">Price</th>
                                                <th className="px-4 py-3 text-right">Disc.</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                                <th className="px-4 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5">
                                            {cart.map((item) => (
                                                <tr key={item.id} className="hover:bg-black/[0.01]">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-transparent border-none focus:outline-none font-bold text-sm"
                                                            value={item.name}
                                                            onChange={(e) => updateCartItemField(item.id, 'name', e.target.value)}
                                                        />
                                                        <span className="text-[10px] text-foreground/40 font-mono">{item.code}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="inline-flex items-center gap-1 bg-black/5 rounded-none-none p-1 border border-black/5">
                                                            <button
                                                                onClick={() => updateCartQuantity(item.id, -1)}
                                                                className="w-6 h-6 rounded-none-none bg-white flex items-center justify-center font-bold text-xs shadow-sm hover:bg-black/5"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="w-10 text-center bg-transparent font-black text-xs focus:outline-none"
                                                                value={item.quantity}
                                                                onChange={(e) => updateCartItemField(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                                                            />
                                                            <button
                                                                onClick={() => updateCartQuantity(item.id, 1)}
                                                                className="w-6 h-6 rounded-none-none bg-white flex items-center justify-center font-bold text-xs shadow-sm hover:bg-black/5"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-20 px-2 py-1 rounded-none-none bg-black/5 border border-black/5 text-right font-medium text-xs focus:outline-none"
                                                            value={item.price}
                                                            onChange={(e) => updateCartItemField(item.id, 'price', Number(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-16 px-2 py-1 rounded-none-none bg-black/5 border border-black/5 text-right font-medium text-xs focus:outline-none"
                                                            value={item.itemDiscount}
                                                            onChange={(e) => updateCartItemField(item.id, 'itemDiscount', Number(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-sm">
                                                        {formatCurrency(item.subtotal)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="p-1.5 rounded-none-none hover:bg-red-500/10 text-foreground/40 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

                    {/* Right Column: Customer & Checkout */}
                    <div className="space-y-6">
                        {/* Customer Search & Selector */}
                        <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-primary" />
                                    Customer
                                </label>
                                <button
                                    onClick={() => setShowAddCustomerModal(true)}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    New Customer
                                </button>
                            </div>

                            <div className="relative" ref={customerContainerRef}>
                                <input
                                    type="text"
                                    placeholder="Search customer name or phone..."
                                    className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold text-sm"
                                    value={customerSearch}
                                    onChange={(e) => {
                                        setCustomerSearch(e.target.value);
                                        setShowCustomerDropdown(true);
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                />
                                {showCustomerDropdown && (
                                    <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-white rounded-none-none shadow-2xl border border-black/10 max-h-52 overflow-y-auto divide-y divide-black/5">
                                        {filteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                className="p-3 hover:bg-black/5 cursor-pointer flex justify-between items-center transition-colors"
                                                onClick={() => {
                                                    setSelectedCustomer(c);
                                                    setCustomerSearch(c.name);
                                                    setShowCustomerDropdown(false);
                                                }}
                                            >
                                                <div>
                                                    <p className="font-bold text-sm">{c.name}</p>
                                                    <p className="text-xs text-foreground/40">{c.contact || 'No Contact'}</p>
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-1 rounded-none-none",
                                                    c.balance > 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                                                )}>
                                                    Bal: {formatCurrency(c.balance)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedCustomer && (
                                <div className="p-3 rounded-none-none bg-primary/5 border border-primary/10 flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-sm text-foreground">{selectedCustomer.name}</p>
                                        <p className="text-xs text-foreground/50">{selectedCustomer.contact || 'No phone'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-foreground/40 uppercase block">Ledger Balance</span>
                                        <span className={cn(
                                            "font-black text-sm",
                                            selectedCustomer.balance > 0 ? "text-red-600" : "text-emerald-600"
                                        )}>
                                            {formatCurrency(selectedCustomer.balance)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Checkout & Bill Summary */}
                        <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-primary" />
                                Payment Summary
                            </h3>

                            {/* Date */}
                            <div>
                                <label className="text-[10px] font-bold text-foreground/40 uppercase block mb-1">Invoice Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2.5 rounded-none-none bg-black/5 border border-black/5 font-bold text-sm focus:outline-none"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            {/* Subtotal */}
                            <div className="flex justify-between items-center text-sm font-medium">
                                <span className="text-foreground/60">Gross Items Total</span>
                                <span className="font-bold">{formatCurrency(itemsGrossTotal)}</span>
                            </div>

                            {/* Bill Discount Row */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase">Bill Discount</label>
                                    <div className="flex text-[10px] font-bold bg-black/5 p-0.5 rounded-none-none border border-black/5">
                                        <button
                                            onClick={() => setDiscountType("PERCENT")}
                                            className={cn("px-2 py-0.5 rounded-none", discountType === "PERCENT" ? "bg-white text-black shadow-xs font-black" : "text-foreground/40")}
                                        >
                                            %
                                        </button>
                                        <button
                                            onClick={() => setDiscountType("FIXED")}
                                            className={cn("px-2 py-0.5 rounded-none", discountType === "FIXED" ? "bg-white text-black shadow-xs font-black" : "text-foreground/40")}
                                        >
                                            RS
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-4 py-2.5 rounded-none-none bg-black/5 border border-black/5 font-bold text-sm focus:outline-none"
                                    placeholder={discountType === "PERCENT" ? "0%" : "RS 0"}
                                    value={billDiscountValue || ""}
                                    onChange={(e) => setBillDiscountValue(Number(e.target.value))}
                                />
                            </div>

                            {/* Net Total Box */}
                            <div className="p-4 rounded-none-none bg-primary text-white flex justify-between items-center shadow-lg">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-80 block">Net Total</span>
                                    <span className="text-2xl font-black">{formatCurrency(netTotal)}</span>
                                </div>
                                <Sparkles className="w-6 h-6 opacity-60" />
                            </div>

                            {/* Paid Amount */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-foreground/40 uppercase">Paid Amount (Cash)</label>
                                    {/* Quick cash buttons */}
                                    <button
                                        onClick={() => setPaidAmount(netTotal)}
                                        className="text-[10px] font-bold text-primary hover:underline"
                                    >
                                        Exact Amount
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/5 font-black text-lg text-emerald-600 focus:outline-none"
                                    placeholder="0.00"
                                    value={paidAmount || ""}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                />

                                {/* Quick Cash increment chips */}
                                <div className="flex gap-1.5 mt-2">
                                    {[100, 500, 1000, 5000].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setPaidAmount((prev) => prev + val)}
                                            className="flex-1 py-1 rounded-none-none bg-black/5 hover:bg-black/10 font-bold text-[10px] text-foreground/70"
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Balance Due / Change */}
                            <div className={cn(
                                "p-3 rounded-none-none flex justify-between items-center border font-bold text-sm",
                                balance > 0 ? "bg-red-500/5 border-red-500/20 text-red-600" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                            )}>
                                <span>{balance > 0 ? "Balance Due (Credit)" : "Change Return / Cleared"}</span>
                                <span className="font-black">{formatCurrency(Math.abs(balance))}</span>
                            </div>

                            {/* Complete Sale Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing || cart.length === 0 || !selectedCustomer}
                                className="w-full py-4 rounded-none-none premium-gradient text-white font-black text-lg shadow-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-none-none animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        {activeMode === "QUOTATION" ? "Save Quotation" : "Complete Sale"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Customer Modal */}
            <AnimatePresence>
                {showAddCustomerModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCustomerModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white text-black p-6 rounded-none-none shadow-2xl w-full max-w-md z-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-lg flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-primary" />
                                    Add New Customer
                                </h3>
                                <button onClick={() => setShowAddCustomerModal(false)} className="p-1 rounded-none-none hover:bg-black/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCustomer} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-foreground/50 uppercase block mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/10 font-bold focus:outline-none focus:border-primary"
                                        placeholder="Full Name"
                                        value={newCustomerName}
                                        onChange={(e) => setNewCustomerName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-foreground/50 uppercase block mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/10 font-bold focus:outline-none focus:border-primary"
                                        placeholder="0300 0000000"
                                        value={newCustomerContact}
                                        onChange={(e) => setNewCustomerContact(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-foreground/50 uppercase block mb-1">Address</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/10 font-medium focus:outline-none focus:border-primary"
                                        placeholder="City / Area"
                                        value={newCustomerAddress}
                                        onChange={(e) => setNewCustomerAddress(e.target.value)}
                                    />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCustomerModal(false)}
                                        className="flex-1 py-3 rounded-none-none bg-black/5 font-bold text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreatingCustomer}
                                        className="flex-1 py-3 rounded-none-none bg-primary text-white font-bold text-sm shadow-md"
                                    >
                                        {isCreatingCustomer ? "Saving..." : "Save Customer"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Receipt Modal */}
            <AnimatePresence>
                {showReceipt && (lastSale || lastReturn) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReceipt(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white text-black p-8 rounded-none-none shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-lg z-10"
                        >
                            <div className="text-center space-y-1 mb-4 border-b border-dashed border-black/20 pb-4">
                                <img src="/libertycollection.png" alt="Liberty Kollection" className="h-16 mx-auto object-contain mb-1" />
                                <p className="text-xs text-black/70 font-medium">Chapai wali gali, Committe Bazar, Mandi Bahauddin</p>
                                <p className="text-xs text-black/70 font-medium">0345 5754717 | 0546-506717</p>
                                <div className="mt-2 inline-block px-3 py-1 rounded-none-none text-xs font-black uppercase bg-black/5">
                                    {lastReturn ? "RETURN CREDIT VOUCHER" : (lastSale?.type || "SALE RECEIPT")}
                                </div>
                            </div>

                            {/* Summary Details */}
                            <div className="space-y-1.5 text-xs mb-4">
                                <div className="flex justify-between">
                                    <span className="text-black/60">Receipt #:</span>
                                    <span className="font-bold">{lastReturn ? lastReturn.returnNumber : lastSale.billNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black/60">Date:</span>
                                    <span className="font-bold">{new Date((lastReturn || lastSale).date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black/60">Customer:</span>
                                    <span className="font-bold">{(lastReturn || lastSale).customer?.name || "Walk-in"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black/60">Cashier:</span>
                                    <span className="font-bold">Admin</span>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="border-t border-b border-black/20 py-3 my-3">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-black/10 text-black/60 font-bold uppercase text-[10px]">
                                            <th className="text-left pb-2">Item</th>
                                            <th className="text-center pb-2 w-10">Qty</th>
                                            <th className="text-right pb-2 w-16">Price</th>
                                            <th className="text-right pb-2 w-14">Disc</th>
                                            <th className="text-right pb-2 w-20">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {(lastReturn || lastSale).items.map((item: any, i: number) => {
                                            const qty = Number(item.quantity || 0);
                                            const price = Number(item.price || 0);
                                            const discount = Number(item.discount || 0);
                                            const total = (price * qty) - discount;
                                            return (
                                                <tr key={i} className="align-middle">
                                                    <td className="py-2 text-left font-semibold text-black pr-1">
                                                        {item.name}
                                                    </td>
                                                    <td className="py-2 text-center text-black/70">
                                                        {qty}
                                                    </td>
                                                    <td className="py-2 text-right text-black/70 whitespace-nowrap">
                                                        {price.toFixed(2)}
                                                    </td>
                                                    <td className="py-2 text-right text-black/70 whitespace-nowrap">
                                                        {discount.toFixed(2)}
                                                    </td>
                                                    <td className="py-2 text-right font-bold text-black whitespace-nowrap">
                                                        {total.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="space-y-1.5 text-xs">
                                {(() => {
                                    if (lastSale) {
                                        const itemsGross = lastSale.items?.reduce((sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)), 0) || Number(lastSale.total || 0);
                                        const itemDisc = lastSale.items?.reduce((sum: number, it: any) => sum + (Number(it.discount || 0)), 0) || 0;
                                        const totalSaleDisc = Number(lastSale.discount || 0);
                                        const billDiscVal = Math.max(0, totalSaleDisc - itemDisc);
                                        const billDiscPct = itemsGross > 0 ? (billDiscVal / itemsGross) * 100 : 0;
                                        const paymentMethod = Number(lastSale.paidAmount) >= Number(lastSale.netTotal) ? 'Cash' : (Number(lastSale.paidAmount) > 0 ? 'Partial' : 'Credit');

                                        return (
                                            <>
                                                <div className="flex justify-between text-black/70">
                                                    <span>Subtotal:</span>
                                                    <span>RS {itemsGross.toFixed(2)}</span>
                                                </div>
                                                {itemDisc > 0 && billDiscVal > 0 ? (
                                                    <>
                                                        <div className="flex justify-between text-red-600 font-semibold">
                                                            <span>Item Discount:</span>
                                                            <span>- RS {itemDisc.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-red-600 font-semibold">
                                                            <span>Bill Discount {billDiscPct > 0 ? `(${billDiscPct.toFixed(0)}%)` : ''}:</span>
                                                            <span>- RS {billDiscVal.toFixed(2)}</span>
                                                        </div>
                                                    </>
                                                ) : billDiscVal > 0 ? (
                                                    <div className="flex justify-between text-red-600 font-semibold">
                                                        <span>Bill Discount {billDiscPct > 0 ? `(${billDiscPct.toFixed(0)}%)` : ''}:</span>
                                                        <span>- RS {billDiscVal.toFixed(2)}</span>
                                                    </div>
                                                ) : itemDisc > 0 ? (
                                                    <div className="flex justify-between text-red-600 font-semibold">
                                                        <span>Bill Discount:</span>
                                                        <span>- RS {itemDisc.toFixed(2)}</span>
                                                    </div>
                                                ) : null}
                                                <div className="flex justify-between text-sm font-black pt-2 border-t-2 border-dashed border-black">
                                                    <span>TOTAL:</span>
                                                    <span>RS {Number(lastSale.netTotal).toFixed(2)}</span>
                                                </div>
                                                {lastSale.type !== 'QUOTATION' && (
                                                    <div className="pt-2 border-t border-black/10 space-y-1">
                                                        <div className="flex justify-between text-black/70">
                                                            <span>Payment Method:</span>
                                                            <span className="font-semibold">{paymentMethod}</span>
                                                        </div>
                                                        <div className="flex justify-between text-black/70">
                                                            <span>Amount Received:</span>
                                                            <span className="font-semibold">RS {Number(lastSale.paidAmount || 0).toFixed(2)}</span>
                                                        </div>
                                                        {Number(lastSale.balance || 0) > 0 && (
                                                            <div className="flex justify-between text-red-600 font-bold">
                                                                <span>Balance Due:</span>
                                                                <span>RS {Number(lastSale.balance).toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    } else if (lastReturn) {
                                        return (
                                            <div className="flex justify-between text-sm font-black pt-2 border-t border-black">
                                                <span>TOTAL RETURN VALUE:</span>
                                                <span>RS {Number(lastReturn.totalAmount).toFixed(2)}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            {/* Footer Instructions */}
                            <div className="border-t border-dashed border-black/20 pt-3 mt-4 text-center text-[10px] text-black/75 space-y-1">
                                <p className="font-bold text-black">No item can be returned after sale.</p>
                                <p>Items can be exchanged only within 3 days of purchase.</p>
                                <p>Receipt must be presented for exchange.</p>
                                <div className="border-t border-black/10 pt-2 mt-2 text-[9px] text-black/60">
                                    <p>For queries: 0345 5754717 | 0546-506717</p>
                                    <p className="text-[8px] mt-0.5 opacity-75">Powered By RapidTechPro</p>
                                </div>
                            </div>

                            {/* Print / Action Buttons */}
                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 py-3 rounded-none-none bg-black text-white font-bold flex items-center justify-center gap-2 hover:bg-black/80 transition-all"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Receipt
                                </button>
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    className="flex-1 py-3 rounded-none-none bg-black/10 text-black font-bold hover:bg-black/20 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
