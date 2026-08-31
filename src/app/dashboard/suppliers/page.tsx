"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Building2,
    Phone,
    MapPin,
    CreditCard,
    DollarSign,
    BookOpen,
    AlertCircle,
    X,
    CheckCircle2,
    Truck,
    ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";

interface SupplierItem {
    id: string;
    name: string;
    companyName: string | null;
    contact: string;
    email: string | null;
    address: string | null;
    cnic: string | null;
    balance: number | string;
    createdAt: string;
    _count?: {
        purchases: number;
    };
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const fetchSuppliers = async () => {
        try {
            const res = await fetch("/api/suppliers");
            const data = await res.json();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
            setFeedback({ type: "error", message: "Failed to load suppliers" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (!feedback) return;
        const timer = setTimeout(() => setFeedback(null), 4000);
        return () => clearTimeout(timer);
    }, [feedback]);

    const handleDelete = async () => {
        if (!deletingSupplier) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/suppliers/${deletingSupplier.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete supplier");
            }
            setFeedback({ type: "success", message: `Supplier "${deletingSupplier.name}" deleted successfully.` });
            setDeletingSupplier(null);
            fetchSuppliers();
        } catch (error: any) {
            setFeedback({ type: "error", message: error.message || "Failed to delete supplier" });
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredSuppliers = suppliers.filter((s) => {
        const q = search.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            (s.companyName && s.companyName.toLowerCase().includes(q)) ||
            s.contact.toLowerCase().includes(q) ||
            (s.cnic && s.cnic.toLowerCase().includes(q))
        );
    });

    const totalPayable = suppliers.reduce((sum, s) => sum + Math.max(0, Number(s.balance || 0)), 0);
    const suppliersWithPayables = suppliers.filter((s) => Number(s.balance || 0) > 0).length;

    return (
        <div className="space-y-8">
            {/* Header & Action */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Suppliers & Vendors
                    </h2>
                    <p className="text-foreground/60 text-sm mt-0.5">
                        Manage supplier accounts, purchase history, and payable balances.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/purchases"
                        className="px-4 py-2.5 glass border border-black/10 text-foreground font-bold text-xs hover:bg-black/5 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                        <Truck className="w-4 h-4 text-primary" />
                        <span>Stock In / Purchase</span>
                    </Link>
                    <button
                        onClick={() => {
                            setEditingSupplier(null);
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-2.5 premium-gradient text-white font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Supplier</span>
                    </button>
                </div>
            </div>

            {/* Notification Feedback */}
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

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-6 glass border border-black/5 bg-white shadow-xs">
                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1">
                        Total Suppliers
                    </p>
                    <div className="flex items-baseline justify-between mt-1">
                        <h3 className="text-3xl font-black text-foreground">{suppliers.length}</h3>
                        <span className="text-xs font-bold text-foreground/50">Accounts Registered</span>
                    </div>
                </div>

                <div className="p-6 glass border border-red-500/15 bg-white shadow-xs">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">
                        Total Payables (Pay to Suppliers)
                    </p>
                    <div className="flex items-baseline justify-between mt-1">
                        <h3 className="text-3xl font-black text-red-600">{formatCurrency(totalPayable)}</h3>
                        <span className="text-xs font-bold text-red-600/70">{suppliersWithPayables} suppliers pending</span>
                    </div>
                </div>

                <div className="p-6 glass border border-blue-500/15 bg-white shadow-xs">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        Total Purchase Invoices
                    </p>
                    <div className="flex items-baseline justify-between mt-1">
                        <h3 className="text-3xl font-black text-foreground">
                            {suppliers.reduce((sum, s) => sum + (s._count?.purchases || 0), 0)}
                        </h3>
                        <span className="text-xs font-bold text-primary">Lifetime Invoices</span>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="glass border border-black/5 bg-white shadow-xs overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-4 border-b border-black/5 bg-black/[0.01] flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search suppliers by name, company, or phone..."
                            className="w-full pl-10 pr-4 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground placeholder:text-foreground/40 shadow-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="text-xs font-bold text-foreground/50">
                        Showing {filteredBrandsCount(filteredSuppliers.length, suppliers.length)}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.01]">
                                <th className="px-6 py-3.5 text-xs font-black text-foreground/40 uppercase tracking-widest">
                                    Supplier / Company
                                </th>
                                <th className="px-6 py-3.5 text-xs font-black text-foreground/40 uppercase tracking-widest">
                                    Contact & Address
                                </th>
                                <th className="px-6 py-3.5 text-xs font-black text-foreground/40 uppercase tracking-widest text-center">
                                    Purchases
                                </th>
                                <th className="px-6 py-3.5 text-xs font-black text-foreground/40 uppercase tracking-widest text-right">
                                    Payable Balance
                                </th>
                                <th className="px-6 py-3.5 text-xs font-black text-foreground/40 uppercase tracking-widest text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-foreground/40 text-xs font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-none animate-spin" />
                                            <span>Loading suppliers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-foreground/40 text-xs font-medium">
                                        {search ? `No suppliers match "${search}"` : "No suppliers registered yet."}
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => {
                                    const hasPayable = Number(supplier.balance) > 0;
                                    return (
                                        <tr key={supplier.id} className="hover:bg-black/[0.01] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                            {supplier.name}
                                                        </p>
                                                        {supplier.companyName && (
                                                            <p className="text-xs text-foreground/50 font-medium mt-0.5">
                                                                {supplier.companyName}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <div className="flex items-center gap-1.5 text-foreground/80 font-bold">
                                                    <Phone className="w-3.5 h-3.5 text-foreground/40" />
                                                    <span>{supplier.contact}</span>
                                                </div>
                                                {supplier.address && (
                                                    <div className="flex items-center gap-1.5 text-foreground/50 mt-1 text-[11px]">
                                                        <MapPin className="w-3 h-3 text-foreground/40" />
                                                        <span className="truncate max-w-xs">{supplier.address}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold px-2.5 py-1 bg-black/5 text-foreground/70">
                                                    {supplier._count?.purchases || 0} Bills
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span
                                                    className={cn(
                                                        "text-xs font-black px-3 py-1 inline-block border",
                                                        hasPayable
                                                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                                                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    )}
                                                >
                                                    {formatCurrency(supplier.balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/dashboard/supplier-ledger?supplierId=${supplier.id}`}
                                                        className="p-1.5 glass border border-black/10 hover:bg-primary/10 hover:text-primary text-foreground/60 transition-colors cursor-pointer"
                                                        title="View Supplier Ledger"
                                                    >
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setEditingSupplier(supplier);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="p-1.5 glass border border-black/10 hover:bg-black/10 text-foreground/60 transition-colors cursor-pointer"
                                                        title="Edit Supplier"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingSupplier(supplier)}
                                                        className="p-1.5 glass border border-black/10 hover:bg-red-500/10 hover:text-red-500 text-foreground/40 transition-colors cursor-pointer"
                                                        title="Delete Supplier"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Supplier Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <SupplierModal
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingSupplier(null);
                        }}
                        onSuccess={(message) => {
                            setIsModalOpen(false);
                            setEditingSupplier(null);
                            fetchSuppliers();
                            setFeedback({ type: "success", message });
                        }}
                        initialData={editingSupplier}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingSupplier && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setDeletingSupplier(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative w-full max-w-md glass border border-black/5 p-6 md:p-8 shadow-2xl bg-white"
                        >
                            <div className="flex items-center gap-3 mb-4 text-red-500">
                                <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Confirm Delete</h3>
                            </div>

                            <p className="text-foreground/70 text-sm mb-4">
                                Are you sure you want to delete supplier <strong className="text-foreground">"{deletingSupplier.name}"</strong>?
                            </p>

                            {(deletingSupplier._count?.purchases || 0) > 0 && (
                                <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-medium flex gap-2.5 items-start">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                                    <span>
                                        This supplier has <strong>{deletingSupplier._count?.purchases}</strong> linked purchase invoice(s). You must remove or detach the purchase bills before deleting this supplier.
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingSupplier(null)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-black/5 hover:bg-black/10 font-bold text-xs text-foreground/70 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-none animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete Supplier</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function filteredBrandsCount(filtered: number, total: number) {
    return `${filtered} of ${total} suppliers`;
}

function SupplierModal({
    onClose,
    onSuccess,
    initialData,
}: {
    onClose: () => void;
    onSuccess: (msg: string) => void;
    initialData: SupplierItem | null;
}) {
    const [name, setName] = useState(initialData?.name || "");
    const [companyName, setCompanyName] = useState(initialData?.companyName || "");
    const [contact, setContact] = useState(initialData?.contact || "");
    const [email, setEmail] = useState(initialData?.email || "");
    const [address, setAddress] = useState(initialData?.address || "");
    const [cnic, setCnic] = useState(initialData?.cnic || "");
    const [openingBalance, setOpeningBalance] = useState(
        initialData ? String(initialData.balance) : "0"
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Supplier name is required.");
            return;
        }
        if (!contact.trim()) {
            setError("Contact number is required.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const url = initialData ? `/api/suppliers/${initialData.id}` : "/api/suppliers";
            const method = initialData ? "PUT" : "POST";
            const payload: any = {
                name: name.trim(),
                companyName: companyName.trim() || null,
                contact: contact.trim(),
                email: email.trim() || null,
                address: address.trim() || null,
                cnic: cnic.trim() || null,
            };

            if (!initialData) {
                payload.openingBalance = Number(openingBalance) || 0;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to save supplier.");
            }

            onSuccess(initialData ? `Supplier "${data.name}" updated.` : `Supplier "${data.name}" added successfully.`);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setSubmitting(false);
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
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg glass border border-black/5 p-6 md:p-8 shadow-2xl bg-white"
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">
                                {initialData ? "Edit Supplier" : "Add New Supplier"}
                            </h3>
                            <p className="text-xs text-foreground/50">
                                {initialData ? "Update vendor details" : "Register a new supplier or vendor"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-foreground/40 hover:text-foreground cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-foreground/70 block mb-1">
                                Supplier Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Haji Fabrics"
                                className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-foreground/70 block mb-1">
                                Company / Brand Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Al-Karam Mills"
                                className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-foreground/70 block mb-1">
                                Contact Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="0300-1234567"
                                className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-foreground/70 block mb-1">
                                CNIC (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="34603-XXXXXXX-X"
                                className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                value={cnic}
                                onChange={(e) => setCnic(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-foreground/70 block mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="supplier@example.com"
                                className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {!initialData && (
                            <div>
                                <label className="text-xs font-bold text-foreground/70 block mb-1">
                                    Opening Payable Balance (RS)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-foreground/70 block mb-1">
                            Physical Address / Market Location
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Shop / Factory address..."
                            className="w-full px-3 py-2 text-xs font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-black/5 hover:bg-black/10 font-bold text-xs text-foreground/70 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 premium-gradient text-white font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-none animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>{initialData ? "Update Supplier" : "Create Supplier"}</span>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
