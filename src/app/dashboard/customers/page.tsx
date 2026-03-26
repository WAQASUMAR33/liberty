"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    User,
    Phone,
    CreditCard,
    MapPin,
    Edit,
    Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`/api/customers${search ? `?query=${search}` : ""}`);
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-foreground/60">Relationship management and credit tracking.</p>
                </div>
                <button
                    onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
                    className="px-6 py-3 rounded-2xl premium-gradient text-white font-bold flex items-center gap-2 group shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all self-start sm:self-auto"
                >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    Add Customer
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, contact or CNIC..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl glass border border-black/5 focus:outline-none focus:border-primary/50 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-3xl glass border border-black/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.01]">
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">CNIC</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Balance</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Address</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-foreground/40">Loading...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-foreground/40 font-medium">
                                        No customers found.
                                    </td>
                                </tr>
                            ) : customers.map((customer: any) => (
                                <tr key={customer.id} className="hover:bg-black/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                                {customer.name[0]}
                                            </div>
                                            <span className="font-bold">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground/60">{customer.contact}</td>
                                    <td className="px-6 py-4 text-foreground/40 font-mono text-xs">{customer.cnic || "—"}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={cn(
                                            "font-bold",
                                            Number(customer.balance) > 0 ? "text-red-400" : "text-emerald-400"
                                        )}>
                                            {formatCurrency(customer.balance)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-foreground/60 max-w-[200px] truncate">{customer.address || "—"}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                                                className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-foreground/60 hover:text-foreground transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <CustomerModal
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={() => { setIsModalOpen(false); fetchCustomers(); }}
                        initialData={editingCustomer}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function CustomerModal({ onClose, onSubmit, initialData }: { onClose: () => void, onSubmit: () => void, initialData: any }) {
    const [formData, setFormData] = useState(initialData || {
        name: "",
        contact: "",
        cnic: "",
        balance: "0",
        address: ""
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const url = initialData ? `/api/customers/${initialData.id}` : "/api/customers";
            const method = initialData ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            onSubmit();
        } catch (err: any) {
            setError(err.message);
        }
    };

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
                className="relative w-full max-w-xl rounded-3xl glass border border-black/5 p-8 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold">{initialData ? "Edit Customer" : "New Customer"}</h3>
                    </div>
                    <button onClick={onClose} className="text-foreground/40 hover:text-foreground">✕</button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">Full Name</label>
                        <div className="relative block">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                            <input
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all"
                                placeholder="Ex: John Smith"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">Contact No.</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all"
                                    placeholder="+1 234 567 890"
                                    value={formData.contact}
                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">CNIC (Optional)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all"
                                    placeholder="35XXX-XXXXXXX-X"
                                    value={formData.cnic}
                                    onChange={e => setFormData({ ...formData, cnic: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">Opening Balance</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all font-bold text-lg"
                            value={formData.balance}
                            onChange={e => setFormData({ ...formData, balance: e.target.value })}
                        />
                        <p className="text-[10px] text-foreground/40 italic mt-1">Positive value means customer owes you money.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-3 w-4 h-4 text-foreground/40" />
                            <textarea
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all h-24 resize-none"
                                placeholder="Street, City, Country"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-2xl premium-gradient text-white font-bold shadow-xl hover:opacity-90 transition-all"
                    >
                        {initialData ? "Update Customer" : "Save Customer"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
