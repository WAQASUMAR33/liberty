"use client";

import { useState, useEffect } from "react";
import {
    BookOpen,
    Search,
    User,
    Printer,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";

export default function LedgerPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/customers").then(res => res.json()).then(setCustomers);
    }, []);

    const fetchLedger = async (id: string) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/ledger?customerId=${id}`);
            const data = await res.json();
            setLedger(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCustomerId) fetchLedger(selectedCustomerId);
    }, [selectedCustomerId]);

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    const printLedger = () => {
        if (!selectedCustomer || ledger.length === 0) return;

        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        if (!printWindow) return;

        const ledgerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Customer Ledger - ${selectedCustomer.name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        line-height: 1.5;
                        color: black;
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 3px solid #000;
                        padding-bottom: 15px;
                    }
                    .header h1 {
                        font-size: 28px;
                        margin: 0 0 5px 0;
                        font-weight: bold;
                    }
                    .header p {
                        margin: 0;
                        font-size: 14px;
                        color: #666;
                    }
                    .customer-info {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .customer-info h2 {
                        margin: 0 0 10px 0;
                        font-size: 18px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                    }
                    .info-row .label {
                        font-weight: 600;
                        color: #666;
                    }
                    .info-row .value {
                        font-weight: bold;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    thead {
                        background: #f5f5f5;
                    }
                    th {
                        padding: 12px 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 11px;
                        text-transform: uppercase;
                        border: 1px solid #ddd;
                    }
                    td {
                        padding: 10px 8px;
                        border: 1px solid #ddd;
                        font-size: 12px;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .debit {
                        color: #059669;
                        font-weight: bold;
                    }
                    .credit {
                        color: #dc2626;
                        font-weight: bold;
                    }
                    .balance-positive {
                        color: #059669;
                    }
                    .balance-negative {
                        color: #dc2626;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 2px solid #000;
                        text-align: center;
                        font-size: 11px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CUSTOMER LEDGER</h1>
                    <p>Chapai wali gali ,Committe Bazar , Mandi Bahauddin</p>
                </div>

                <div class="customer-info">
                    <h2>${selectedCustomer.name}</h2>
                    <div class="info-grid">
                        <div class="info-row">
                            <span class="label">Contact:</span>
                            <span class="value">${selectedCustomer.contact || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Current Balance:</span>
                            <span class="value ${selectedCustomer.balance >= 0 ? 'balance-negative' : 'balance-positive'}">
                                ${Number(selectedCustomer.balance).toFixed(2)}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="label">Address:</span>
                            <span class="value">${selectedCustomer.address || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Print Date:</span>
                            <span class="value">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 12%;">Date</th>
                            <th style="width: 40%;">Description</th>
                            <th style="width: 12%;" class="text-right">Debit</th>
                            <th style="width: 12%;" class="text-right">Credit</th>
                            <th style="width: 12%;" class="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ledger.map((entry: any) => `
                            <tr>
                                <td>${new Date(entry.date).toLocaleDateString()}</td>
                                <td>${entry.description}</td>
                                <td class="text-right debit">${Number(entry.debit) > 0 ? Number(entry.debit).toFixed(2) : '-'}</td>
                                <td class="text-right credit">${Number(entry.credit) > 0 ? Number(entry.credit).toFixed(2) : '-'}</td>
                                <td class="text-right ${Number(entry.balance) >= 0 ? 'balance-negative' : 'balance-positive'}">
                                    ${Number(entry.balance).toFixed(2)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>This is a computer-generated ledger statement</p>
                    <p>Powered by Liberty POS</p>
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

        printWindow.document.write(ledgerHTML);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customer Ledger</h2>
                    <p className="text-foreground/60">Comprehensive financial history and balance tracking.</p>
                </div>
                <button
                    onClick={printLedger}
                    disabled={!selectedCustomerId || ledger.length === 0}
                    className="px-6 py-3 rounded-2xl glass border border-black/10 text-foreground font-bold flex items-center gap-2 hover:bg-black/5 transition-all disabled:opacity-50 shadow-sm"
                >
                    <Printer className="w-5 h-5" />
                    Print Ledger
                </button>
            </div>

            <div className="flex gap-4 no-print">
                <div className="relative flex-1 max-w-md group">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] pl-1 absolute -top-4 left-0">Select Customer</label>
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <select
                        className="w-full pl-12 pr-4 py-4 rounded-2xl glass border border-black/5 focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="" disabled className="bg-[#f8fafc]">Choose a customer to view ledger...</option>
                        {customers.map((c: any) => (
                            <option key={c.id} value={c.id} className="bg-[#f8fafc] text-foreground">{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCustomerId ? (
                <div id="ledger-content" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl glass border border-black/5 bg-black/[0.01] shadow-sm">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1">Customer Details</p>
                            <h3 className="text-xl font-black">{selectedCustomer?.name}</h3>
                            <p className="text-sm text-foreground/60 mt-1">{selectedCustomer?.contact}</p>
                            <p className="text-[10px] text-foreground/40 mt-4 leading-relaxed uppercase font-medium">{selectedCustomer?.address}</p>
                        </div>
                        <div className="p-6 rounded-3xl glass border border-red-500/10 bg-red-500/[0.02] shadow-sm">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Total Credit</p>
                            <h3 className="text-3xl font-black text-red-600">
                                {formatCurrency(ledger.reduce((sum, e) => sum + Number(e.credit), 0))}
                            </h3>
                            <p className="text-[10px] text-red-600/40 mt-1 uppercase font-black">Sales on Credit</p>
                        </div>
                        <div className="p-6 rounded-3xl glass border border-blue-500/10 bg-blue-500/[0.02] shadow-sm">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Current Balance</p>
                            <h3 className="text-3xl font-black text-foreground">
                                {formatCurrency(selectedCustomer?.balance)}
                            </h3>
                            <p className="text-[10px] text-blue-600/40 mt-1 uppercase font-black">Net Outstanding Amount</p>
                        </div>
                    </div>

                    <div className="rounded-3xl glass border border-black/5 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-black/5 bg-black/[0.01] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-primary" />
                                <h3 className="font-bold uppercase tracking-widest text-xs">Statement of Account</h3>
                            </div>
                            <div className="text-[10px] font-black text-foreground/20 italic">
                                Generated on {new Date().toLocaleString()}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-black/5 bg-black/[0.01]">
                                        <th className="px-6 py-4 text-xs font-black text-foreground/40 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-xs font-black text-foreground/40 uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 text-xs font-black text-foreground/40 uppercase tracking-widest text-right">Debit</th>
                                        <th className="px-6 py-4 text-xs font-black text-foreground/40 uppercase tracking-widest text-right">Credit</th>
                                        <th className="px-6 py-4 text-xs font-black text-foreground/40 uppercase tracking-widest text-right">Running Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-20 text-center text-foreground/40 italic">Loading ledger records...</td></tr>
                                    ) : ledger.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-20 text-center text-foreground/40">No transactions found for this customer.</td></tr>
                                    ) : (
                                        <>
                                            {/* Initial Balance Row */}
                                            <tr className="bg-black/[0.01]">
                                                <td className="px-6 py-4 text-xs opacity-40">Initial</td>
                                                <td className="px-6 py-4 font-bold text-xs uppercase opacity-40 tracking-widest">Opening Balance</td>
                                                <td className="px-6 py-4 text-right">—</td>
                                                <td className="px-6 py-4 text-right">—</td>
                                                <td className="px-6 py-4 text-right font-black opacity-40 tracking-tighter">
                                                    {formatCurrency(ledger[0]?.balance - ledger[0]?.credit + ledger[0]?.debit)}
                                                </td>
                                            </tr>
                                            {ledger.map((entry: any) => (
                                                <tr key={entry.id} className="hover:bg-black/[0.01] transition-colors relative group">
                                                    <td className="px-6 py-4 text-xs text-foreground/60 font-medium">{new Date(entry.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-sm text-foreground">{entry.description}</p>
                                                        {entry.sale && <p className="text-[10px] text-primary uppercase font-black mt-1">Ref: {entry.sale.billNumber}</p>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {Number(entry.debit) > 0 ? (
                                                            <div className="flex items-center justify-end gap-2 text-emerald-600 font-bold">
                                                                {formatCurrency(entry.debit)}
                                                                <ArrowDownLeft className="w-3 h-3 group-hover:-translate-x-1 group-hover:translate-y-1 transition-transform" />
                                                            </div>
                                                        ) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {Number(entry.credit) > 0 ? (
                                                            <div className="flex items-center justify-end gap-2 text-red-600 font-bold">
                                                                {formatCurrency(entry.credit)}
                                                                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                            </div>
                                                        ) : "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-black text-foreground px-3 py-1 rounded-lg bg-black/5 border border-black/5">
                                                            {formatCurrency(entry.balance)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 rounded-3xl border-2 border-dashed border-black/5 opacity-40">
                    <BookOpen className="w-16 h-16 mb-6" />
                    <p className="text-xl font-bold italic tracking-tighter">Choose a customer to reveal their financial story.</p>
                </div>
            )}

            <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .glass { background: transparent !important; border-color: #eee !important; box-shadow: none !important; }
          .text-white { color: black !important; }
          .text-foreground\/60 { color: #666 !important; }
          .text-foreground\/40 { color: #999 !important; }
          #ledger-content { position: absolute; left: 0; top: 0; width: 100%; }
          table { width: 100% !important; border: 1px solid #eee !important; }
          th { background: #f9f9f9 !important; border-bottom: 2px solid #000 !important; }
          td { border-bottom: 1px solid #eee !important; }
        }
      `}</style>
        </div>
    );
}
