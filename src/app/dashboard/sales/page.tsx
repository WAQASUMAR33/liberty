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
            <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm">
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
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Customer Filter */}
                    <div>
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">Customer</label>
                        <select
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
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
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest block mb-2">End Date</label>
                        <input
                            type="date"
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary font-medium"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Total Sales</span>
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-3xl font-black">{formatCurrency(totalSales)}</p>
                    <p className="text-xs text-foreground/40 mt-1">{filteredSales.length} transactions</p>
                </div>

                <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Total Paid</span>
                        <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-black text-green-600">{formatCurrency(totalPaid)}</p>
                </div>

                <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Total Balance</span>
                        <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-black text-red-600">{formatCurrency(totalBalance)}</p>
                </div>
            </div>

            {/* Sales Table */}
            <div className="rounded-3xl glass border border-black/5 overflow-hidden shadow-sm">
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
                                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${sale.type === 'WHOLESALE'
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
                                            className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-foreground/60 hover:text-foreground transition-all"
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
                className="relative w-full max-w-3xl rounded-3xl glass border border-black/5 p-8 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold">Sale Details</h3>
                        <p className="text-foreground/60">{sale.billNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/5">
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
                        <div className="rounded-xl border border-black/5 overflow-hidden">
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
                                                <p className="font-bold">{item.name || item.product?.name}</p>
                                                <p className="text-xs text-foreground/40 font-mono">{item.product?.code}</p>
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
                        onClick={() => window.print()}
                        className="px-6 py-3 rounded-xl bg-black/5 hover:bg-black/10 font-bold flex items-center gap-2 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl premium-gradient text-white font-bold hover:shadow-lg transition-all"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
