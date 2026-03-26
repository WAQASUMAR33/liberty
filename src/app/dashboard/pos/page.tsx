"use client";

import { useState, useEffect, Suspense } from "react";
import {
    ShoppingCart,
    Trash2,
    Plus,
    Printer,
    CreditCard,
    CheckCircle2,
    User,
    Percent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function POSPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading POS...</div>}>
            <POSContent />
        </Suspense>
    );
}

function POSContent() {
    const searchParams = useSearchParams();
    const quotationId = searchParams.get("quotationId");
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [billType, setBillType] = useState("RETAIL");
    const [cart, setCart] = useState<any[]>([]);
    const [billDiscount, setBillDiscount] = useState<any>(0);
    const [paidAmount, setPaidAmount] = useState<any>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);

    // Product selection form
    const [selectedProductId, setSelectedProductId] = useState("");
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [itemDiscount, setItemDiscount] = useState(0);

    useEffect(() => {
        fetch("/api/products").then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));
        fetch("/api/customers").then(res => res.json()).then(data => setCustomers(Array.isArray(data) ? data : []));
    }, []);

    useEffect(() => {
        if (quotationId) {
            fetchQuotation(quotationId);
        }
    }, [quotationId]);

    const fetchQuotation = async (id: string) => {
        try {
            const res = await fetch(`/api/sales/${id}`);
            const data = await res.json();
            if (data && !data.error) {
                if (data.customer) {
                    setSelectedCustomer(data.customer);
                }
                setBillType(data.type === 'QUOTATION' ? 'RETAIL' : data.type);

                const cartItems = data.items.map((item: any) => ({
                    id: `${item.productId}-${Date.now()}-${Math.random()}`,
                    productId: item.productId,
                    code: item.product.code,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: Number(item.price),
                    itemDiscount: Number(item.discount),
                    subtotal: Number(item.subtotal),
                }));
                setCart(cartItems);

                const totalItemDiscounts = cartItems.reduce((sum: number, item: any) => sum + Number(item.itemDiscount), 0);
                const totalDiscount = Number(data.discount);
                const billDiscountVal = totalDiscount - totalItemDiscounts;

                const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
                const subtotalAfter = totalAmount - totalItemDiscounts;

                if (subtotalAfter > 0 && billDiscountVal > 0) {
                    const percent = Math.round((billDiscountVal * 100) / subtotalAfter);
                    setBillDiscount(percent);
                } else {
                    setBillDiscount(0);
                }
            }
        } catch (error) {
            console.error("Failed to load quotation", error);
        }
    };

    const handleProductSelect = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setSelectedProductId(productId);
            setProductName(product.name);
            setPrice(billType === "WHOLESALE" ? Number(product.wholesalePrice) : Number(product.retailPrice));
            setQuantity(1);
            setItemDiscount(0);
        }
    };

    const addToCart = () => {
        if (!selectedProductId) return;

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const subtotal = (price * quantity) - Number(itemDiscount);

        const newItem = {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            code: product.code,
            name: productName, // Use custom name
            quantity,
            price,
            itemDiscount: Number(itemDiscount),
            subtotal,
        };

        setCart([...cart, newItem]);

        // Reset form
        setSelectedProductId("");
        setProductName("");
        setPrice(0);
        setQuantity(1);
        setItemDiscount(0);
    };

    const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

    const updateCartItem = (id: string, field: string, value: any) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Recalculate subtotal
                updated.subtotal = (updated.price * updated.quantity) - Number(updated.itemDiscount);
                return updated;
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const itemDiscounts = cart.reduce((sum, item) => sum + Number(item.itemDiscount), 0);
    // Bill discount is now a percentage
    const subtotalAfterItemDisc = total - itemDiscounts;
    const billDiscountAmount = (subtotalAfterItemDisc * Number(billDiscount)) / 100;
    const netTotal = subtotalAfterItemDisc - billDiscountAmount;
    const balance = Math.max(0, netTotal - Number(paidAmount));

    const printReceipt = () => {
        if (!lastSale) return;

        // Calculate discounts breakdown
        const totalItemDiscounts = lastSale.items.reduce((sum: number, item: any) => sum + (Number(item.discount) || 0), 0);
        const billDiscountValue = Number(lastSale.discount) - totalItemDiscounts;
        const subtotalAfterItemDiscounts = Number(lastSale.total) - totalItemDiscounts;
        const billDiscountPercentage = subtotalAfterItemDiscounts > 0 ? (billDiscountValue / subtotalAfterItemDiscounts) * 100 : 0;

        const printWindow = window.open('', '_blank', lastSale.type === 'WHOLESALE' ? 'width=800,height=1000' : 'width=300,height=600');
        if (!printWindow) return;

        // A4 Format for Wholesale (Custom Design)
        if (lastSale.type === 'WHOLESALE') {
            const getWords = (n: number) => {
                if (n === 0) return "Zero";
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
                res += sr(Math.floor(n / 1000000), "Million");
                res += sr(Math.floor((n % 1000000) / 1000), "Thousand");
                res += sr(n % 1000, "");
                return res.trim() + " Rupees Only";
            };
            const receiptHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Invoice - ${lastSale.billNumber}</title>
                    <style>
                        @page { size: A4; margin: 10mm; }
                        body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: black; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
                        .container { padding: 20px; border: 1px solid #000; min-height: 275mm; position: relative; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                        .store-info h1 { font-size: 28px; margin: 0; font-weight: 800; letter-spacing: 1px; }
                        .store-info p { margin: 2px 0; font-size: 12px; }
                        .invoice-title-box { text-align: right; }
                        .invoice-title-box h2 { font-size: 22px; margin: 0; text-decoration: underline; letter-spacing: 2px; }
                        .customer-info { margin-bottom: 15px; font-size: 13px; }
                        .info-row { display: flex; margin-bottom: 4px; }
                        .info-label { width: 120px; font-weight: 500; }
                        .info-value { font-weight: 400; text-transform: uppercase; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        th, td { border: 1px solid #000; padding: 8px; font-weight: 400; }
                        th { background: #f0f0f0 !important; font-size: 11px; text-transform: uppercase; font-weight: 700; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .footer-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
                        .footer-left { flex: 1; }
                        .footer-right { width: 320px; }
                        .sum-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; border-bottom: 1px solid #eee; }
                        .sum-row.grand { border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 8px; padding: 8px 0; font-size: 18px; }
                        .urdu-note { font-size: 18px; font-weight: 800; text-align: right; margin: 15px 0; font-family: 'Urdu Typesetting', 'Jameel Noori Nastaleeq', Arial; }
                        .amount-words { font-size: 14px; font-weight: 800; text-decoration: underline; margin-top: 10px; }
                        .barcode-box { margin-top: 5px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div style="display: flex; gap: 20px; align-items: center;">
                                <img src="/libertycollection.png" alt="Logo" style="height: 100px;" />
                                <div class="store-info">
                                    <h1>Liberty Kollection</h1>
                                    <p>Chapai wali gali ,Committe Bazar , Mandi Bahauddin</p>
                                    <p>0345 5754717 | 0546-506717</p>
                                </div>
                            </div>
                            <div class="invoice-title-box">
                                <h2>SALE INVOICE</h2>
                                <div style="margin-top: 10px;">
                                    <div>Invoice #: <strong>${lastSale.billNumber}</strong></div>
                                    <div class="barcode-box">|||||||||||||||||||||||||</div>
                                    <div>Date: <strong>${new Date(lastSale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                                </div>
                            </div>
                        </div>

                        <div class="customer-info">
                            <div class="info-row"><span class="info-label">Customer Name:</span> <span class="info-value">${lastSale.customer.name}</span></div>
                            <div class="info-row"><span class="info-label">Operator:</span> <span class="info-value">Admin</span></div>
                            <div class="info-row"><span class="info-label">Location:</span> <span class="info-value">M.B.D</span></div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 5%;">Sr. #</th>
                                    <th>Product Name</th>
                                    <th style="width: 15%;" class="text-right">Price</th>
                                    <th style="width: 10%;" class="text-center">Quantity</th>
                                    <th style="width: 15%;" class="text-right">Discount</th>
                                    <th style="width: 20%;" class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lastSale.items.map((item: any, i: number) => `
                                    <tr>
                                        <td class="text-center">${i + 1}</td>
                                        <td>${item.name}</td>
                                        <td class="text-right">${Number(item.price).toFixed(2)}</td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-right">${Number(item.discount || 0).toFixed(2)}</td>
                                        <td class="text-right font-bold">${(Number(item.price) * item.quantity - Number(item.discount || 0)).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="footer-flex">
                            <div class="footer-left">
                                <div class="urdu-note" dir="rtl">
                                    نوٹ: امپورٹڈ، ایکسپائرڈ اور ٹوٹی ہوئی آئٹمز کی واپسی یا تبدیلی نہیں ہوگی۔
                                </div>
                                <div class="amount-words">
                                    ${getWords(Number(lastSale.netTotal))}
                                </div>
                            </div>
                            <div class="footer-right">
                                <div class="sum-row">
                                    <span>Gross Amount:</span>
                                    <strong>${subtotalAfterItemDiscounts.toLocaleString()}</strong>
                                </div>
                                <div class="sum-row">
                                    <span>Bill Discount:</span>
                                    <strong>${billDiscountValue.toLocaleString()}</strong>
                                </div>
                                <div class="sum-row grand">
                                    <span>Total Bill Amount:</span>
                                    <strong>${Number(lastSale.netTotal).toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        <div style="position: absolute; bottom: 10px; left: 20px; font-size: 10px; color: #666;">
                            powered by RapidTechPro
                        </div>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        };
                    </script>
                </body>
                </html>
            `;
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            return;
        }

        // Thermal Receipt for Retail (existing code)
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Receipt - ${lastSale.billNumber}</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 5mm;
                    }
                    body {
                        font-family: 'Arial', 'Helvetica', sans-serif;
                        font-size: 12px;
                        line-height: 1.3;
                        color: black;
                        font-weight: bold;
                        margin: 0;
                        padding: 8px;
                        background: white;
                    }
                    * {
                        color: black !important;
                        font-weight: bold !important;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 8px;
                    }
                    .header h1 {
                        font-size: 16px;
                        margin: 0 0 2px 0;
                        font-weight: bold;
                        letter-spacing: 2px;
                    }
                    .header p {
                        margin: 0;
                        font-size: 9px;
                    }
                    .divider {
                        border-top: 1px dashed black;
                        margin: 6px 0;
                    }
                    .divider-double {
                        border-top: 3px double black;
                        margin: 6px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 9px;
                        margin: 1px 0;
                    }
                    .info-row .label {
                        font-weight: normal;
                    }
                    .info-row .value {
                        font-weight: bold;
                    }
                    .items-header {
                        display: grid;
                        grid-template-columns: 3fr 1fr 1.5fr 1.5fr 2fr;
                        gap: 2px;
                        font-size: 10px;
                        font-weight: bold;
                        margin: 6px 0 3px 0;
                        text-transform: uppercase;
                    }
                    .item {
                        margin-bottom: 6px;
                        font-size: 9px;
                    }
                    .item-name {
                        font-weight: bold;
                        margin-bottom: 1px;
                    }
                    .item-sku {
                        font-size: 10px;
                        color: black;
                        margin-bottom: 2px;
                    }
                    .item-row {
                        display: grid;
                        grid-template-columns: 3fr 1fr 1.5fr 1.5fr 2fr;
                        gap: 2px;
                        font-size: 9px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 10px;
                        margin: 3px 0;
                    }
                    .total-row.grand {
                        font-size: 13px;
                        font-weight: bold;
                        margin: 6px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 10px;
                        font-size: 9px;
                    }
                    .footer p {
                        margin: 2px 0;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .bold {
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${window.location.origin}/libertycollection.png" alt="Logo" style="height: 120px; margin-bottom: 5px;" />
                    <p>Chapai wali gali ,Committe Bazar , Mandi Bahauddin</p>
                    <p>0345 5754717 | 0546-506717</p>
                </div>

                <div class="divider"></div>

                <div class="info-row">
                    <span class="label">Receipt #:</span>
                    <span class="value">${lastSale.billNumber}</span>
                </div>
                <div class="info-row">
                    <span class="label">Date:</span>
                    <span class="value">${new Date(lastSale.date).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</span>
                </div>
                <div class="info-row">
                    <span class="label">Customer:</span>
                    <span class="value">${lastSale.customer.name}</span>
                </div>
                <div class="info-row">
                    <span class="label">Cashier:</span>
                    <span class="value">Admin</span>
                </div>

                <div class="divider"></div>

                <div class="items-header">
                    <div>Item</div>
                    <div class="text-center">Qty</div>
                    <div class="text-right">Price</div>
                    <div class="text-right">Disc</div>
                    <div class="text-right">Total</div>
                </div>

                ${lastSale.items.map((item: any) => {
            const itemTotal = Number(item.price) * Number(item.quantity);
            const itemDiscount = Number(item.discount) || 0;
            const itemAmount = itemTotal - itemDiscount;
            return `
                    <div class="item">
                        <div class="item-name">${item.name}</div>
                        <div class="item-row">
                            <div></div>
                            <div class="text-center">${item.quantity}</div>
                            <div class="text-right">${Number(item.price).toFixed(2)}</div>
                            <div class="text-right">${itemDiscount.toFixed(2)}</div>
                            <div class="text-right bold">${itemAmount.toFixed(2)}</div>
                        </div>
                    </div>
                `}).join('')}

                <div class="divider"></div>

                <div class="total-row">
                    <span>Subtotal:</span>
                    <span class="bold">${subtotalAfterItemDiscounts.toFixed(2)}</span>
                </div>

                ${billDiscountValue > 0 ? `
                    <div class="total-row">
                        <span>Bill Disc (${billDiscountPercentage.toFixed(0)}%):</span>
                        <span>- ${billDiscountValue.toFixed(2)}</span>
                    </div>
                ` : ''}

                <div class="divider-double"></div>

                <div class="total-row grand">
                    <span>TOTAL:</span>
                    <span>${Number(lastSale.netTotal).toFixed(2)}</span>
                </div>

                <div class="divider-double"></div>

                <div class="total-row">
                    <span>Payment Method:</span>
                    <span class="bold">${Number(lastSale.paidAmount) >= Number(lastSale.netTotal) ? 'Cash' : 'Credit'}</span>
                </div>
                <div class="total-row">
                    <span>Amount Received:</span>
                    <span class="bold">${Number(lastSale.paidAmount).toFixed(2)}</span>
                </div>

                ${Number(lastSale.balance) > 0 ? `
                    <div class="total-row" style="color: #c00;">
                        <span class="bold">Balance Due:</span>
                        <span class="bold">${Number(lastSale.balance).toFixed(2)}</span>
                    </div>
                ` : ''}

                <div class="divider"></div>

                <div class="footer">
                    <p style="margin-bottom: 5px; line-height: 1.4;">No item can be returned after sale.<br>Items can be exchanged only within 3 days of purchase.<br>Receipt must be presented for exchange.</p>
                    <div class="divider"></div>
                    <p style="color: #666;">For queries: 0345 5754717 | 0546-506717</p>
                    <p style="font-size: 7px; color: #999; margin-top: 6px;">Powered By RapidTechPro</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    };


    const handleCheckout = async () => {
        if (!selectedCustomer) return alert("Please select a customer");
        if (cart.length === 0) return alert("Cart is empty");

        setIsProcessing(true);
        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                body: JSON.stringify({
                    customerId: selectedCustomer.id,
                    date,
                    type: billType,
                    items: cart,
                    total,
                    discount: itemDiscounts + Number(billDiscountAmount),
                    netTotal,
                    paidAmount: Number(paidAmount),
                    balance,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setLastSale(data);
            setShowReceipt(true);
            setCart([]);
            setPaidAmount(0);
            setBillDiscount(0);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
                    <p className="text-foreground/60">Create new sales and manage billing</p>
                </div>
                <div className="flex bg-black/5 rounded-2xl p-1 border border-black/5">
                    <button
                        onClick={() => setBillType("RETAIL")}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                            billType === "RETAIL" ? "bg-primary text-white shadow-lg" : "text-foreground/40 hover:text-foreground"
                        )}
                    >
                        Retail
                    </button>
                    <button
                        onClick={() => setBillType("WHOLESALE")}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                            billType === "WHOLESALE" ? "bg-secondary text-white shadow-lg" : "text-foreground/40 hover:text-foreground"
                        )}
                    >
                        Wholesale
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Section - Product Selection & Cart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Selection */}
                    <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            Add Product
                        </h3>

                        <div className="grid grid-cols-12 gap-4">
                            {/* Product Dropdown */}
                            <div className="col-span-12 md:col-span-3">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Product</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium appearance-none"
                                    value={selectedProductId}
                                    onChange={(e) => handleProductSelect(e.target.value)}
                                >
                                    <option value="">Select Product...</option>
                                    {products.map((p: any) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} - {p.name} (Stock: {p.stock})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Product Name (Editable) */}
                            <div className="col-span-12 md:col-span-3">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                                    placeholder="Product name"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                />
                            </div>

                            {/* Price (Editable) */}
                            <div className="col-span-6 md:col-span-2">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Price</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold text-center"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                />
                            </div>

                            {/* Quantity */}
                            <div className="col-span-6 md:col-span-2">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold text-center"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                />
                            </div>

                            {/* Item Discount */}
                            <div className="col-span-6 md:col-span-1">
                                <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Disc</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-2 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium text-center"
                                    placeholder="0"
                                    value={itemDiscount}
                                    onChange={(e) => setItemDiscount(Number(e.target.value))}
                                />
                            </div>

                            {/* Add Button */}
                            <div className="col-span-6 md:col-span-1 flex items-end">
                                <button
                                    onClick={addToCart}
                                    disabled={!selectedProductId}
                                    className="w-full px-2 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="rounded-3xl glass border border-black/5 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-black/5 bg-black/[0.01] flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                Bill Items ({cart.length})
                            </h3>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {cart.length === 0 ? (
                                <div className="p-12 text-center text-foreground/40">
                                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium">No items added yet</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-black/[0.01] sticky top-0">
                                        <tr className="border-b border-black/5">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-foreground/40 uppercase">Item</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-foreground/40 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-foreground/40 uppercase">Price</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-foreground/40 uppercase">Disc.</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-foreground/40 uppercase">Total</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-foreground/40 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {cart.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-black/[0.01] group">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent border-none focus:outline-none font-medium text-sm"
                                                        value={item.name}
                                                        onChange={(e) => updateCartItem(item.id, 'name', e.target.value)}
                                                    />
                                                    <p className="text-xs text-foreground/40 font-mono">{item.code}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-16 px-2 py-1 rounded bg-black/5 border border-black/5 text-center font-bold text-sm"
                                                        value={item.quantity}
                                                        onChange={(e) => updateCartItem(item.id, 'quantity', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-sm">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-20 px-2 py-1 rounded bg-black/5 border border-black/5 text-right font-medium text-sm"
                                                        value={item.price}
                                                        onChange={(e) => updateCartItem(item.id, 'price', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-20 px-2 py-1 rounded bg-black/5 border border-black/5 text-right font-medium text-sm"
                                                        value={item.itemDiscount}
                                                        onChange={(e) => updateCartItem(item.id, 'itemDiscount', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-2 rounded-lg hover:bg-red-500/10 text-foreground/40 hover:text-red-500 transition-all"
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

                {/* Right Section - Payment & Customer */}
                <div className="space-y-6">
                    {/* Customer Selection */}
                    <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground/60 uppercase tracking-widest">
                            <User className="w-4 h-4" />
                            Customer
                        </h3>
                        <select
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold appearance-none"
                            value={selectedCustomer?.id || ""}
                            onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
                        >
                            <option value="">Select Customer...</option>
                            {customers.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({formatCurrency(c.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Payment Details */}
                    <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground/60 uppercase tracking-widest">
                            <CreditCard className="w-4 h-4" />
                            Payment
                        </h3>

                        {/* Date Picker */}
                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-foreground/60 font-medium">Total Amount</span>
                            <span className="font-bold">{formatCurrency(total)}</span>
                        </div>

                        {/* Bill Discount */}
                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Bill Discount (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold"
                                    placeholder="0%"
                                    value={billDiscount}
                                    onChange={e => setBillDiscount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Net Total */}
                        <div className="flex justify-between items-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <span className="text-sm font-bold text-primary uppercase">Net Total</span>
                            <span className="text-xl font-black text-foreground">{formatCurrency(netTotal)}</span>
                        </div>

                        {/* Paid Amount */}
                        <div>
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Paid Amount</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-bold text-lg"
                                placeholder="0.00"
                                value={paidAmount}
                                onChange={e => setPaidAmount(e.target.value)}
                            />
                        </div>

                        {/* Balance Due */}
                        <div className="flex justify-between items-center p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                            <span className="text-sm font-bold text-red-600 uppercase">Balance Due</span>
                            <span className="text-xl font-black text-red-600">{formatCurrency(balance)}</span>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing || cart.length === 0 || !selectedCustomer}
                                className="flex-[2] py-4 rounded-2xl premium-gradient text-white font-bold text-lg shadow-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Complete Sale
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            <AnimatePresence>
                {showReceipt && lastSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReceipt(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white text-black p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-xl"
                        >
                            <div id="receipt-content" className={lastSale.type === 'WHOLESALE' ? '' : 'font-mono'}>
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <p className="text-xs">Point of Sale System</p>
                                </div>

                                {/* Dashed Line */}
                                <div className="border-t-2 border-dashed border-black my-3"></div>

                                {/* Receipt Info */}
                                <div className="space-y-1 text-xs mb-3">
                                    <div className="flex justify-between">
                                        <span>Receipt #:</span>
                                        <span className="font-bold">{lastSale.billNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span>{new Date(lastSale.date).toLocaleString('en-US', {
                                            month: '2-digit',
                                            day: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Customer:</span>
                                        <span className="font-bold">{lastSale.customer.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cashier:</span>
                                        <span>Admin</span>
                                    </div>
                                </div>

                                {/* Dashed Line */}
                                <div className="border-t-2 border-dashed border-black my-3"></div>

                                {/* Items Table Header */}
                                <div className="grid grid-cols-12 gap-1 text-xs font-bold mb-2">
                                    <div className="col-span-4">Item</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-2 text-right">Price</div>
                                    <div className="col-span-2 text-right">Disc</div>
                                    <div className="col-span-2 text-right">Total</div>
                                </div>

                                {/* Items */}
                                {lastSale.items.map((item: any, i: number) => (
                                    <div key={i} className="mb-3">
                                        <div className="grid grid-cols-12 gap-1 text-xs">
                                            <div className="col-span-4 font-medium leading-tight">{item.name}</div>
                                            <div className="col-span-2 text-center">{item.quantity}</div>
                                            <div className="col-span-2 text-right">RS {Number(item.price).toFixed(2)}</div>
                                            <div className="col-span-2 text-right">RS {Number(item.discount || 0).toFixed(2)}</div>
                                            <div className="col-span-2 text-right font-bold">RS {(Number(item.price) * item.quantity - (Number(item.discount) || 0)).toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}

                                {/* Dashed Line */}
                                <div className="border-t-2 border-dashed border-black my-3"></div>

                                {/* Subtotal */}
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Subtotal:</span>
                                    <span className="font-bold">RS {(Number(lastSale.total) - lastSale.items.reduce((acc: number, item: any) => acc + (Number(item.discount) || 0), 0)).toFixed(2)}</span>
                                </div>

                                {/* Discount if any */}
                                {(Number(lastSale.discount) - lastSale.items.reduce((acc: number, item: any) => acc + (Number(item.discount) || 0), 0)) > 0 && (
                                    <div className="flex justify-between text-sm mb-2 text-red-600">
                                        <span>Bill Discount ({((Number(lastSale.discount) - lastSale.items.reduce((acc: number, item: any) => acc + (Number(item.discount) || 0), 0)) / (Number(lastSale.total) - lastSale.items.reduce((acc: number, item: any) => acc + (Number(item.discount) || 0), 0)) * 100).toFixed(0)}%):</span>
                                        <span className="font-bold">- RS {(Number(lastSale.discount) - lastSale.items.reduce((acc: number, item: any) => acc + (Number(item.discount) || 0), 0)).toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Double Line */}
                                <div className="border-t-4 border-double border-black my-2"></div>

                                {/* Total */}
                                <div className="flex justify-between text-lg font-black mb-3">
                                    <span>TOTAL:</span>
                                    <span>RS {Number(lastSale.netTotal).toFixed(2)}</span>
                                </div>

                                {/* Double Line */}
                                <div className="border-t-4 border-double border-black my-2"></div>

                                {/* Payment Details */}
                                <div className="space-y-1 text-xs mb-3">
                                    <div className="flex justify-between">
                                        <span>Payment Method:</span>
                                        <span className="font-bold">{Number(lastSale.paidAmount) >= Number(lastSale.netTotal) ? 'Cash' : 'Credit'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Amount Received:</span>
                                        <span className="font-bold">RS {Number(lastSale.paidAmount).toFixed(2)}</span>
                                    </div>
                                    {Number(lastSale.balance) > 0 && (
                                        <div className="flex justify-between text-red-600 font-bold">
                                            <span>Balance Due:</span>
                                            <span>RS {Number(lastSale.balance).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Dashed Line */}
                                <div className="border-t-2 border-dashed border-black my-3"></div>

                                {/* Footer */}
                                <div className="text-center text-xs space-y-1 mt-4">
                                    <p className="text-[10px] text-black/50">For queries: 0345 5754717</p>
                                    <p className="text-[9px] text-black/40 mt-2">Powered By RapidTechPro</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 no-print">
                                <button
                                    onClick={printReceipt}
                                    className="flex-1 py-3 rounded-xl bg-black text-white font-bold flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                                <button
                                    onClick={() => setShowReceipt(false)}
                                    className="flex-1 py-3 rounded-xl bg-black/10 text-black font-bold"
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
