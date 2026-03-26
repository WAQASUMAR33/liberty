"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Filter,
    Tags,
    Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            await fetch(`/api/categories/${id}`, { method: "DELETE" });
            fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Categories</h2>
                    <p className="text-foreground/60">Manage product categories.</p>
                </div>
                <button
                    onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                    className="px-6 py-3 rounded-2xl premium-gradient text-white font-bold flex items-center gap-2 group shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all"
                >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    Add Category
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search categories..."
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
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Products Count</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            <p className="text-foreground/40 font-medium">Fetching categories...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center text-foreground/40 font-medium">
                                        No categories found. Add your first category.
                                    </td>
                                </tr>
                            ) : filteredCategories.map((category: any) => (
                                <tr key={category.id} className="hover:bg-black/[0.02] transition-colors group">
                                    <td className="px-6 py-4 font-bold">{category.name}</td>
                                    <td className="px-6 py-4 text-foreground/60">{category._count?.products || 0} Products</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                                                className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-foreground/60 hover:text-foreground transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 rounded-xl bg-black/5 hover:bg-red-500/10 text-foreground/60 hover:text-red-400 transition-all"
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

            <AnimatePresence>
                {isModalOpen && (
                    <CategoryModal
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={() => { setIsModalOpen(false); fetchCategories(); }}
                        initialData={editingCategory}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function CategoryModal({ onClose, onSubmit, initialData }: { onClose: () => void, onSubmit: () => void, initialData: any }) {
    const [formData, setFormData] = useState(initialData || {
        name: "",
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const url = initialData ? `/api/categories/${initialData.id}` : "/api/categories";
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
                className="relative w-full max-w-md rounded-3xl glass border border-black/5 p-8 overflow-hidden shadow-2xl"
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold">{initialData ? "Edit Category" : "New Category"}</h3>
                    </div>
                    <button onClick={onClose} className="text-foreground/40 hover:text-foreground">
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Category Name</label>
                        <input
                            required
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all font-medium"
                            placeholder="e.g. Electronics"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-4 rounded-2xl premium-gradient text-white font-bold shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            {initialData ? "Update Category" : "Create Category"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
