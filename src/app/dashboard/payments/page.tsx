"use client";

import { useState, useEffect } from "react";
import {
    Wallet,
    Calendar,
    User,
    DollarSign,
    CreditCard,
    MessageSquare,
    History,
    TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [payRes, custRes] = await Promise.all([
                fetch("/api/payments"),
                fetch("/api/customers")
            ]);
            const paymentsData = await payRes.json();
            const customersData = await custRes.json();
            setPayments(Array.isArray(paymentsData) ? paymentsData : []);
            setCustomers(Array.isArray(customersData) ? customersData : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Payments & Receipts</h2>
                    <p className="text-foreground/60">Manage incoming payments and cash flow.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 rounded-2xl premium-gradient text-white font-bold flex items-center gap-2 group shadow-xl transition-all"
                >
                    <Wallet className="w-5 h-5" />
                    Collect Payment
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 rounded-3xl glass border border-black/5 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-black/5 flex items-center gap-3 bg-black/[0.01]">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Payment History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-black/5">
                                    <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Method</th>
                                    <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Remarks</th>
                                    <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-foreground/40">Loading history...</td></tr>
                                ) : payments.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-foreground/40 font-medium">No payments recorded yet.</td></tr>
                                ) : payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-black/[0.01] transition-colors group">
                                        <td className="px-6 py-4 text-xs text-foreground/60 font-medium">{new Date(payment.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-bold">{payment.customer.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-lg bg-black/5 text-[10px] font-black uppercase tracking-widest text-primary border border-black/5">
                                                {payment.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-foreground/40">{payment.remarks || "—"}</td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600 font-mono tracking-tighter">{formatCurrency(payment.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-8 rounded-3xl glass border border-emerald-500/10 bg-emerald-500/5 relative overflow-hidden group hover:bg-emerald-500/10 transition-all shadow-sm">
                        <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 text-emerald-600" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Total Collections</p>
                        <h3 className="text-3xl font-black text-foreground">
                            {formatCurrency(payments.reduce((sum, p) => sum + Number(p.amount), 0))}
                        </h3>
                        <p className="text-xs text-emerald-600/60 mt-4 font-medium italic">Cash flow is positive</p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <PaymentModal
                        customers={customers}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={() => { setIsModalOpen(false); fetchData(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function PaymentModal({ customers, onClose, onSubmit }: { customers: any[], onClose: () => void, onSubmit: () => void }) {
    const [formData, setFormData] = useState<any>({
        customerId: "",
        amount: "",
        method: "Cash",
        remarks: "",
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    const printReceipt = (payment: any) => {
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (!printWindow) return;

        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Payment Receipt - ${payment.id}</title>
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
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 3px 0;
                        font-size: 11px;
                    }
                    .label {
                        font-weight: normal;
                    }
                    .value {
                        text-align: right;
                        font-weight: bold;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 8px;
                        padding-top: 8px;
                        border-top: 2px solid black;
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 15px;
                        font-size: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${window.location.origin}/libertycollection.png" alt="Logo" style="height: 120px; margin-bottom: 5px;" />
                    <p>Chapai wali gali ,Committe Bazar , Mandi Bahauddin</p>
                    <p>0345 5754717 | 0546-506717</p>
                    <div class="divider"></div>
                    <h2 style="font-size: 14px; margin: 5px 0;">PAYMENT RECEIPT</h2>
                </div>

                <div class="info-row">
                    <span class="label">Date:</span>
                    <span class="value">${new Date(payment.date).toLocaleString('en-US', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    })}</span>
                </div>
                <div class="info-row">
                    <span class="label">Receipt #:</span>
                    <span class="value">${payment.id.slice(-6).toUpperCase()}</span>
                </div>
                <div class="info-row">
                    <span class="label">Customer:</span>
                    <span class="value">${payment.customer.name}</span>
                </div>
                <div class="info-row">
                    <span class="label">Method:</span>
                    <span class="value">${payment.method}</span>
                </div>
                ${payment.remarks ? `
                <div class="info-row">
                    <span class="label">Remarks:</span>
                    <span class="value">${payment.remarks}</span>
                </div>
                ` : ''}

                <div class="divider"></div>

                <div class="total-row">
                    <span>AMOUNT RECEIVED:</span>
                    <span>${Number(payment.amount).toFixed(2)}</span>
                </div>
                
                <div class="info-row" style="margin-top: 5px;">
                    <span class="label">Balance Due:</span>
                    <span class="value">${Number(payment.customer.balance).toFixed(2)}</span>
                </div>

                <div class="footer">
                    <p>Powered By RapidTechPro</p>
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

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!formData.customerId || !formData.amount) return alert("Please fill all fields");

        setLoading(true);
        try {
            const res = await fetch("/api/payments", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error("Failed to process payment");
            const payment = await res.json();
            printReceipt(payment);
            onSubmit();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg rounded-3xl glass border border-black/5 p-8 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold italic">New Receipt</h3>
                    </div>
                    <button onClick={onClose} className="text-foreground/40 hover:text-foreground">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] pl-1">Select Customer</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                            <select
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-emerald-500 focus:outline-none transition-all appearance-none font-bold"
                                value={formData.customerId}
                                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                            >
                                <option value="" disabled className="bg-[#f8fafc]">Choose a customer...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#f8fafc]">
                                        {c.name} (Balance: {formatCurrency(c.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] pl-1">Amount Received</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-emerald-500 focus:outline-none transition-all font-black text-xl text-emerald-600"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] pl-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-emerald-500 focus:outline-none transition-all font-medium"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] pl-1">Payment Method</label>
                        <div className="flex gap-3">
                            {["Cash", "Bank", "Cheque"].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, method: m })}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2",
                                        formData.method === m ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "bg-black/5 border-black/5 text-foreground/40 hover:bg-black/10"
                                    )}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] pl-1">Remarks</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-foreground/40" />
                            <textarea
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/5 border border-black/5 focus:border-emerald-500 focus:outline-none transition-all h-24 resize-none"
                                placeholder="Payment for invoice #..."
                                value={formData.remarks}
                                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl premium-gradient text-white font-black shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Wallet className="w-5 h-5" />}
                        Confirm Receipt
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
