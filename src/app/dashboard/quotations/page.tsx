"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function QuotationsPage() {
    const router = useRouter();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            const res = await fetch("/api/sales?type=QUOTATION");
            const data = await res.json();
            setQuotations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this quotation?")) return;
        try {
            const res = await fetch(`/api/sales/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchQuotations();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenInPOS = (id: string) => {
        router.push(`/dashboard/pos?quotationId=${id}`);
    };

    const filteredQuotations = quotations.filter((q: any) =>
        q.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Quotations</h2>
                    <p className="text-foreground/60">Manage and convert quotations to bills</p>
                </div>
            </div>

            <div className="rounded-3xl glass border border-black/5 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <Search className="w-5 h-5 text-foreground/40" />
                    <input
                        type="text"
                        placeholder="Search quotations..."
                        className="w-full bg-transparent focus:outline-none font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-3xl glass border border-black/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.01]">
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Quote #</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-foreground/40">Loading...</td>
                                </tr>
                            ) : filteredQuotations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-foreground/40">No quotations found.</td>
                                </tr>
                            ) : filteredQuotations.map((q: any) => (
                                <tr key={q.id} className="hover:bg-black/[0.02]">
                                    <td className="px-6 py-4 font-mono font-bold">{q.billNumber}</td>
                                    <td className="px-6 py-4 text-sm">{new Date(q.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">{q.customer?.name}</td>
                                    <td className="px-6 py-4 text-right font-bold">{formatCurrency(q.netTotal)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenInPOS(q.id)}
                                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                title="Open in POS"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(q.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
