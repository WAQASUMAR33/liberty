"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, User, FileText, Printer, Eye, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSale, setSelectedSale] = useState<any>(null);

    useEffect(() => {
        fetchSales();
        fetchCustomers();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await fetch("/api/sales");
            const data = await res.json();
            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/customers");
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredSales = sales.filter((sale: any) => {
        const matchesCustomer = !selectedCustomer || sale.customerId === selectedCustomer;
        const matchesSearch = !searchTerm ||
            sale.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

        const saleDate = new Date(sale.date);
        const matchesStartDate = !startDate || saleDate >= new Date(startDate);
        const matchesEndDate = !endDate || saleDate <= new Date(endDate + "T23:59:59");

        return matchesCustomer && matchesSearch && matchesStartDate && matchesEndDate;
    });

    const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.netTotal), 0);
    const totalPaid = filteredSales.reduce((sum, sale) => sum + Number(sale.paidAmount), 0);
    const totalBalance = filteredSales.reduce((sum, sale) => sum + Number(sale.balance), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Sales Records</h2>
                    <p className="text-foreground/60">View and filter all sales transactions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground/60 uppercase tracking-widest">
                    <Search className="w-4 h-4" />
                    Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Search</label>
                        <input
                            type="text"
                            placeholder="Bill # or Customer..."
                            className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Customer Filter */}
                    <div>
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Customer</label>
                        <select
                            className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                        >
                            <option value="">All Customers</option>
                            {customers.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Start Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">End Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Total Sales</span>
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(totalSales)}</p>
                    <p className="text-xs text-foreground/40 mt-1">{filteredSales.length} transactions</p>
                </div>

                <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Total Paid</span>
                        <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-black text-green-600">{formatCurrency(totalPaid)}</p>
                </div>

                <div className="rounded-none-none glass border border-black/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Total Balance</span>
                        <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-black text-red-600">{formatCurrency(totalBalance)}</p>
                </div>
            </div>

            {/* Sales Table */}
            <div className="rounded-none-none glass border border-black/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.01]">
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Bill #</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Paid</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Balance</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-none-none animate-spin" />
                                            <p className="text-foreground/40 font-medium">Loading sales...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-foreground/40 font-medium">
                                        No sales records found.
                                    </td>
                                </tr>
                            ) : filteredSales.map((sale: any) => (
                                <tr key={sale.id} className="hover:bg-black/[0.02] transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold">{sale.billNumber}</td>
                                    <td className="px-6 py-4 text-sm">{new Date(sale.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{sale.customer?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-none-none text-xs font-black uppercase tracking-widest ${sale.type === 'WHOLESALE'
                                                ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                            }`}>
                                            {sale.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold">{formatCurrency(sale.netTotal)}</td>
                                    <td className="px-6 py-4 text-right text-green-600 font-bold">{formatCurrency(sale.paidAmount)}</td>
                                    <td className="px-6 py-4 text-right text-red-600 font-bold">{formatCurrency(sale.balance)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedSale(sale)}
                                            className="p-2 rounded-none-none bg-black/5 hover:bg-black/10 text-foreground/60 hover:text-foreground transition-all"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedSale && (
                    <SaleDetailsModal
                        sale={selectedSale}
                        onClose={() => setSelectedSale(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function reprintReceipt(sale: any) {
    const totalItemDiscounts = sale.items.reduce((sum: number, item: any) => sum + (Number(item.discount) || 0), 0);
    const billDiscountValue = Number(sale.discount) - totalItemDiscounts;
    const subtotalAfterItemDiscounts = Number(sale.total) - totalItemDiscounts;
    const billDiscountPercentage = subtotalAfterItemDiscounts > 0 ? (billDiscountValue / subtotalAfterItemDiscounts) * 100 : 0;

    const printWindow = window.open('', '_blank', sale.type === 'WHOLESALE' ? 'width=800,height=1000' : 'width=300,height=600');
    if (!printWindow) return;

    if (sale.type === 'WHOLESALE') {
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

        printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${sale.billNumber}</title>
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
                    <div>Invoice #: <strong>${sale.billNumber}</strong></div>
                    <div class="barcode-box">|||||||||||||||||||||||||</div>
                    <div>Date: <strong>${new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                </div>
            </div>
        </div>
        <div class="customer-info">
            <div class="info-row"><span class="info-label">Customer Name:</span> <span class="info-value">${sale.customer?.name || 'Walk-in'}</span></div>
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
                ${sale.items.map((item: any, i: number) => `
                    <tr>
                        <td class="text-center">${i + 1}</td>
                        <td>${item.name}</td>
                        <td class="text-right">${Number(item.price).toFixed(2)}</td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-right">${Number(item.discount || 0).toFixed(2)}</td>
                        <td class="text-right">${(Number(item.price) * item.quantity - Number(item.discount || 0)).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="footer-flex">
            <div class="footer-left">
                <div class="urdu-note" dir="rtl">نوٹ: امپورٹڈ، ایکسپائرڈ اور ٹوٹی ہوئی آئٹمز کی واپسی یا تبدیلی نہیں ہوگی۔</div>
                <div class="amount-words">${getWords(Number(sale.netTotal))}</div>
            </div>
            <div class="footer-right">
                <div class="sum-row"><span>Gross Amount:</span><strong>${subtotalAfterItemDiscounts.toLocaleString()}</strong></div>
                <div class="sum-row"><span>Bill Discount:</span><strong>${billDiscountValue.toLocaleString()}</strong></div>
                <div class="sum-row grand"><span>Total Bill Amount:</span><strong>${Number(sale.netTotal).toLocaleString()}</strong></div>
            </div>
        </div>
        <div style="position: absolute; bottom: 10px; left: 20px; font-size: 10px; color: #666;">powered by RapidTechPro</div>
    </div>
    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body>
</html>`);
        printWindow.document.close();
        return;
    }

    // Thermal receipt for RETAIL
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt - ${sale.billNumber}</title>
    <style>
        @page { size: 80mm auto; margin: 5mm; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 12px; line-height: 1.3; color: black; font-weight: bold; margin: 0; padding: 8px; background: white; }
        * { color: black !important; font-weight: bold !important; }
        .header { text-align: center; margin-bottom: 8px; }
        .header h1 { font-size: 16px; margin: 0 0 2px 0; letter-spacing: 2px; }
        .header p { margin: 0; font-size: 9px; }
        .divider { border-top: 1px dashed black; margin: 6px 0; }
        .divider-double { border-top: 3px double black; margin: 6px 0; }
        .info-row { display: flex; justify-content: space-between; font-size: 9px; margin: 1px 0; }
        .items-header { display: grid; grid-template-columns: 3fr 1fr 1.5fr 1.5fr 2fr; gap: 2px; font-size: 10px; margin: 6px 0 3px 0; text-transform: uppercase; }
        .item { margin-bottom: 6px; font-size: 9px; }
        .item-name { margin-bottom: 1px; }
        .item-row { display: grid; grid-template-columns: 3fr 1fr 1.5fr 1.5fr 2fr; gap: 2px; font-size: 9px; }
        .total-row { display: flex; justify-content: space-between; font-size: 10px; margin: 3px 0; }
        .total-row.grand { font-size: 13px; margin: 6px 0; }
        .footer { text-align: center; margin-top: 10px; font-size: 9px; }
        .footer p { margin: 2px 0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <img src="${window.location.origin}/libertycollection.png" alt="Logo" style="height: 120px; margin-bottom: 5px;" />
        <p>Chapai wali gali ,Committe Bazar , Mandi Bahauddin</p>
        <p>0345 5754717 | 0546-506717</p>
    </div>
    <div class="divider"></div>
    <div class="info-row"><span>Receipt #:</span><span>${sale.billNumber}</span></div>
    <div class="info-row"><span>Date:</span><span>${new Date(sale.date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
    <div class="info-row"><span>Customer:</span><span>${sale.customer?.name || 'Walk-in'}</span></div>
    <div class="info-row"><span>Cashier:</span><span>Admin</span></div>
    <div class="divider"></div>
    <div class="items-header">
        <div>Item</div><div class="text-center">Qty</div><div class="text-right">Price</div><div class="text-right">Disc</div><div class="text-right">Total</div>
    </div>
    ${sale.items.map((item: any) => {
        const itemTotal = Number(item.price) * Number(item.quantity);
        const itemDiscount = Number(item.discount) || 0;
        const itemAmount = itemTotal - itemDiscount;
        return `<div class="item">
            <div class="item-name">${item.name}</div>
            <div class="item-row">
                <div></div>
                <div class="text-center">${item.quantity}</div>
                <div class="text-right">${Number(item.price).toFixed(2)}</div>
                <div class="text-right">${itemDiscount.toFixed(2)}</div>
                <div class="text-right">${itemAmount.toFixed(2)}</div>
            </div>
        </div>`;
    }).join('')}
    <div class="divider"></div>
    <div class="total-row"><span>Subtotal:</span><span>${subtotalAfterItemDiscounts.toFixed(2)}</span></div>
    ${billDiscountValue > 0 ? `<div class="total-row"><span>Bill Disc (${billDiscountPercentage.toFixed(0)}%):</span><span>- ${billDiscountValue.toFixed(2)}</span></div>` : ''}
    <div class="divider-double"></div>
    <div class="total-row grand"><span>TOTAL:</span><span>${Number(sale.netTotal).toFixed(2)}</span></div>
    <div class="divider-double"></div>
    <div class="total-row"><span>Payment Method:</span><span>${Number(sale.paidAmount) >= Number(sale.netTotal) ? 'Cash' : 'Credit'}</span></div>
    <div class="total-row"><span>Amount Received:</span><span>${Number(sale.paidAmount).toFixed(2)}</span></div>
    ${Number(sale.balance) > 0 ? `<div class="total-row" style="color: #c00;"><span>Balance Due:</span><span>${Number(sale.balance).toFixed(2)}</span></div>` : ''}
    <div class="divider"></div>
    <div class="footer">
        <p style="margin-bottom: 5px; line-height: 1.4;">No item can be returned after sale.<br>Items can be exchanged only within 3 days of purchase.<br>Receipt must be presented for exchange.</p>
        <div class="divider"></div>
        <p>For queries: 0345 5754717 | 0546-506717</p>
        <p style="font-size: 7px; margin-top: 6px;">Powered By RapidTechPro</p>
    </div>
    <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body>
</html>`);
    printWindow.document.close();
}

function SaleDetailsModal({ sale, onClose }: { sale: any, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-3xl rounded-none-none glass border border-black/5 p-8 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold">Sale Details</h3>
                        <p className="text-foreground/60">{sale.billNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-none-none hover:bg-black/5 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-none-none bg-black/5">
                        <div>
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Date</p>
                            <p className="font-bold">{new Date(sale.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Customer</p>
                            <p className="font-bold">{sale.customer?.name || 'Walk-in'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Type</p>
                            <p className="font-bold capitalize">{sale.type.toLowerCase()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Status</p>
                            <p className={`font-bold ${sale.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {sale.balance > 0 ? 'Partial' : 'Paid'}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="font-bold mb-4">Items</h4>
                        <div className="rounded-none-none border border-black/5 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-black/5">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-foreground/60">Product</th>
                                        <th className="px-4 py-3 font-bold text-foreground/60 text-center">Qty</th>
                                        <th className="px-4 py-3 font-bold text-foreground/60 text-right">Price</th>
                                        <th className="px-4 py-3 font-bold text-foreground/60 text-right">Disc</th>
                                        <th className="px-4 py-3 font-bold text-foreground/60 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {sale.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <p className="font-bold">{item.name}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                                            <td className="px-4 py-3 text-right text-red-500">
                                                {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-foreground/60">Subtotal</span>
                                <span className="font-bold">{formatCurrency(sale.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500">
                                <span>Bill Discount</span>
                                <span>-{formatCurrency(sale.discount)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-black border-t border-black/10 pt-2 mt-2">
                                <span>Net Total</span>
                                <span>{formatCurrency(sale.netTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 font-bold">
                                <span>Paid Amount</span>
                                <span>{formatCurrency(sale.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-600 font-bold">
                                <span>Balance</span>
                                <span>{formatCurrency(sale.balance)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-black/5 flex justify-end gap-3">
                    <button
                        onClick={() => reprintReceipt(sale)}
                        className="px-6 py-3 rounded-none-none bg-black/5 hover:bg-black/10 font-bold flex items-center gap-2 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Reprint Receipt
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-none-none premium-gradient text-white font-bold hover:shadow-lg transition-all"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
