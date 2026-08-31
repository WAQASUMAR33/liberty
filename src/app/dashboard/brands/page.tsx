"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Tag,
    Layers,
    Sparkles,
    Package,
    AlertCircle,
    X,
    CheckCircle2,
    Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BrandItem {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        products: number;
    };
}

export default function BrandsPage() {
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const fetchBrands = async () => {
        try {
            const res = await fetch("/api/brands");
            const data = await res.json();
            setBrands(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch brands:", error);
            setFeedback({ type: "error", message: "Failed to load brands" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    // Auto-clear feedback after 4 seconds
    useEffect(() => {
        if (!feedback) return;
        const timer = setTimeout(() => setFeedback(null), 4000);
        return () => clearTimeout(timer);
    }, [feedback]);

    const handleDelete = async () => {
        if (!deletingBrand) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/brands/${deletingBrand.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete brand");
            }
            setFeedback({ type: "success", message: `Brand "${deletingBrand.name}" was deleted successfully.` });
            setDeletingBrand(null);
            fetchBrands();
        } catch (error: any) {
            setFeedback({ type: "error", message: error.message || "Failed to delete brand" });
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredBrands = brands.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalProducts = brands.reduce((sum, b) => sum + (b._count?.products || 0), 0);
    const activeBrandsCount = brands.filter(b => (b._count?.products || 0) > 0).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 rounded-none-none bg-primary/10 text-primary">
                            <Tag className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold tracking-widest text-primary uppercase">Inventory Master</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Brand Management</h2>
                    <p className="text-foreground/60 text-sm mt-0.5">Organize and manage your product brands and manufacturers.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBrand(null);
                        setIsModalOpen(true);
                    }}
                    className="px-6 py-3.5 rounded-none-none premium-gradient text-white font-bold flex items-center gap-2.5 group shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto cursor-pointer"
                >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    <span>Add Brand</span>
                </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-none-none glass border border-black/5 flex items-center justify-between shadow-sm hover:border-primary/20 transition-all">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Total Brands</p>
                        <h3 className="text-2xl font-black mt-1 text-foreground">{loading ? "..." : brands.length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-none-none bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <Tag className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-5 rounded-none-none glass border border-black/5 flex items-center justify-between shadow-sm hover:border-primary/20 transition-all">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Active in Inventory</p>
                        <h3 className="text-2xl font-black mt-1 text-foreground">{loading ? "..." : activeBrandsCount}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-none-none bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="p-5 rounded-none-none glass border border-black/5 flex items-center justify-between shadow-sm hover:border-primary/20 transition-all">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Linked Products</p>
                        <h3 className="text-2xl font-black mt-1 text-foreground">{loading ? "..." : totalProducts}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-none-none bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <Package className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Feedback Alert */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-none-none flex items-center gap-3 border text-sm font-medium ${
                            feedback.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                                : "bg-red-500/10 border-red-500/20 text-red-700"
                        }`}
                    >
                        {feedback.type === "success" ? (
                            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                        )}
                        <span className="flex-1">{feedback.message}</span>
                        <button onClick={() => setFeedback(null)} className="opacity-50 hover:opacity-100 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Bar */}
            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search brands by name..."
                        className="w-full pl-12 pr-10 py-4 rounded-none-none glass border border-black/5 focus:outline-none focus:border-primary/50 transition-all font-medium text-foreground placeholder:text-foreground/40"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Brands Table */}
            <div className="rounded-none-none glass border border-black/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.01]">
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Brand</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Products</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest hidden md:table-cell">Created Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-none-none animate-spin" />
                                            <p className="text-foreground/40 font-medium">Fetching brands...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBrands.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-foreground/40">
                                            <Tag className="w-10 h-10 stroke-[1.5]" />
                                            <p className="font-semibold text-foreground/60">
                                                {search ? "No brands match your search query." : "No brands added yet."}
                                            </p>
                                            {!search && (
                                                <button
                                                    onClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
                                                    className="mt-2 text-sm text-primary font-bold hover:underline"
                                                >
                                                    + Add your first brand
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBrands.map((brand) => (
                                    <tr key={brand.id} className="hover:bg-black/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-none-none bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {brand.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{brand.name}</p>
                                                    <p className="text-xs text-foreground/40 font-mono">ID: {brand.id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none-none text-xs font-semibold bg-black/5 text-foreground/70">
                                                <Package className="w-3.5 h-3.5 text-primary" />
                                                {brand._count?.products || 0} {brand._count?.products === 1 ? "product" : "products"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-sm text-foreground/60">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-foreground/40" />
                                                {new Date(brand.createdAt).toLocaleDateString(undefined, {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingBrand(brand);
                                                        setIsModalOpen(true);
                                                    }}
                                                    title="Edit Brand"
                                                    className="p-2.5 rounded-none-none bg-black/5 hover:bg-primary/10 text-foreground/60 hover:text-primary transition-all cursor-pointer"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingBrand(brand)}
                                                    title="Delete Brand"
                                                    className="p-2.5 rounded-none-none bg-black/5 hover:bg-red-500/10 text-foreground/60 hover:text-red-500 transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <BrandModal
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingBrand(null);
                        }}
                        onSuccess={(message) => {
                            setIsModalOpen(false);
                            setEditingBrand(null);
                            fetchBrands();
                            setFeedback({ type: "success", message });
                        }}
                        initialData={editingBrand}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingBrand && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setDeletingBrand(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md rounded-none-none glass border border-black/5 p-6 md:p-8 overflow-hidden shadow-2xl bg-white"
                        >
                            <div className="flex items-center gap-3 mb-4 text-red-500">
                                <div className="w-10 h-10 rounded-none-none bg-red-500/10 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Confirm Delete</h3>
                            </div>

                            <p className="text-foreground/70 text-sm mb-4">
                                Are you sure you want to delete brand <strong className="text-foreground">"{deletingBrand.name}"</strong>?
                            </p>

                            {(deletingBrand._count?.products || 0) > 0 && (
                                <div className="mb-6 p-3.5 rounded-none-none bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-medium flex gap-2.5 items-start">
                                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                    <span>
                                        This brand has <strong>{deletingBrand._count?.products}</strong> linked product(s). Deleting it will keep the products but detach their brand reference.
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingBrand(null)}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-none-none bg-black/5 hover:bg-black/10 font-bold text-foreground/70 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-none-none bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-none-none animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete Brand</span>
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

function BrandModal({
    onClose,
    onSuccess,
    initialData,
}: {
    onClose: () => void;
    onSuccess: (msg: string) => void;
    initialData: BrandItem | null;
}) {
    const [name, setName] = useState(initialData?.name || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Brand name is required.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const url = initialData ? `/api/brands/${initialData.id}` : "/api/brands";
            const method = initialData ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong saving the brand.");
            }

            onSuccess(initialData ? `Brand updated to "${data.name}".` : `Brand "${data.name}" created.`);
        } catch (err: any) {
            setError(err.message || "Failed to save brand");
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
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md rounded-none-none glass border border-black/5 p-8 overflow-hidden shadow-2xl bg-white"
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none-none bg-primary/20 flex items-center justify-center text-primary">
                            <Tag className="w-5 h-5" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">
                            {initialData ? "Edit Brand" : "New Brand"}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-foreground/40 hover:text-foreground p-1.5 rounded-none-none hover:bg-black/5 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-none-none bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/50 uppercase tracking-widest pl-1">
                            Brand Name <span className="text-primary">*</span>
                        </label>
                        <input
                            required
                            autoFocus
                            className="w-full px-4 py-3.5 rounded-none-none bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all font-medium text-foreground placeholder:text-foreground/40"
                            placeholder="e.g. Nike, Apple, Sony, Khaadi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-none-none premium-gradient text-white font-bold shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-none-none animate-spin" />
                                    <span>Saving Brand...</span>
                                </>
                            ) : (
                                <span>{initialData ? "Update Brand" : "Create Brand"}</span>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
