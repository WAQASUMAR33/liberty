"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Filter,
    BarChart3,
    Box,
    ScanBarcode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import Barcode from "react-barcode";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [barcodeProduct, setBarcodeProduct] = useState<any>(null);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/products${search ? `?query=${search}` : ""}`);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await fetch(`/api/products/${id}`, { method: "DELETE" });
            fetchProducts();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-foreground/60">Inventory management and pricing controls.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setBarcodeProduct(null); setIsBarcodeModalOpen(true); }}
                        className="px-6 py-3 rounded-2xl bg-white border border-black/5 font-bold flex items-center gap-2 hover:bg-black/5 transition-all text-foreground/80"
                    >
                        <ScanBarcode className="w-5 h-5" />
                        Print Label
                    </button>
                    <button
                        onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                        className="px-6 py-3 rounded-2xl premium-gradient text-white font-bold flex items-center gap-2 group shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all"
                    >
                        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        Add Product
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or code..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl glass border border-black/5 focus:outline-none focus:border-primary/50 transition-all font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="px-6 py-4 rounded-2xl glass border border-black/5 flex items-center gap-2 font-bold hover:bg-black/5 transition-all">
                    <Filter className="w-5 h-5" />
                    Filter
                </button>
            </div>

            <div className="rounded-3xl glass border border-black/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.01]">
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Product Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Cost</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Wholesale</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Retail</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-right">Stock</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            <p className="text-foreground/40 font-medium">Fetching inventory...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-foreground/40 font-medium">
                                        No products found. Add your first product to get started.
                                    </td>
                                </tr>
                            ) : products.map((product: any) => (
                                <tr key={product.id} className="hover:bg-black/[0.02] transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs text-primary">{product.code}</td>
                                    <td className="px-6 py-4 font-bold">{product.name}</td>
                                    <td className="px-6 py-4 text-sm text-foreground/60">{product.category?.name || '-'}</td>
                                    <td className="px-6 py-4 text-foreground/60">{formatCurrency(product.costPrice)}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-medium">{formatCurrency(product.wholesalePrice)}</td>
                                    <td className="px-6 py-4 text-blue-400 font-medium">{formatCurrency(product.retailPrice)}</td>
                                    <td className="px-6 py-4 text-right font-bold">
                                        <span className={product.stock <= 10 ? "text-red-400" : "text-foreground"}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => { setBarcodeProduct(product); setIsBarcodeModalOpen(true); }}
                                                className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-foreground/60 hover:text-foreground transition-all"
                                                title="Print Barcode"
                                            >
                                                <ScanBarcode className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                                className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-foreground/60 hover:text-foreground transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
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
                    <ProductModal
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={() => { setIsModalOpen(false); fetchProducts(); }}
                        initialData={editingProduct}
                        categories={categories}
                    />
                )}
                {isBarcodeModalOpen && (
                    <BarcodeModal
                        onClose={() => setIsBarcodeModalOpen(false)}
                        product={barcodeProduct}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function BarcodeModal({ onClose, product }: { onClose: () => void, product: any }) {
    const [printData, setPrintData] = useState({
        name: product?.name || "",
        code: product?.code || "",
        price: product?.retailPrice || ""
    });

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=600,height=600');
        if (!printWindow) return;

        // Get the SVG content
        const barcodeElement = document.getElementById('barcode-preview')?.querySelector('svg');
        const barcodeSvg = barcodeElement ? barcodeElement.outerHTML : '';

        printWindow.document.write(`
            <html>
            <head>
                <title>Print Barcode</title>
                <style>
                    @page {
                        size: 1.5in 1in;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 5px;
                        width: 1.5in;
                        height: 1in;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: sans-serif;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                    .logo {
                        font-size: 8px;
                        font-weight: bold;
                        margin-bottom: 2px;
                        text-transform: uppercase;
                        text-align: center;
                        line-height: 1;
                    }
                    .name {
                        font-size: 7px;
                        margin-bottom: 2px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 100%;
                        text-align: center;
                    }
                    .price {
                        font-size: 10px;
                        font-weight: bold;
                        margin-top: 2px;
                        text-align: center;
                    }
                    svg {
                        width: 100% !important;
                        height: auto !important;
                        max-height: 35px;
                        display: block;
                    }
                </style>
            </head>
            <body>
                <div class="logo">Liberty Collection</div>
                <div class="name">${printData.name}</div>
                ${barcodeSvg}
                <div class="price">RS ${Number(printData.price).toFixed(2)}</div>
                <script>
                    window.onload = () => {
                        window.print();
                        window.close();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
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
                            <ScanBarcode className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold">Print Barcode</h3>
                    </div>
                    <button onClick={onClose} className="text-foreground/40 hover:text-foreground">
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Product Name</label>
                        <input
                            className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all font-medium"
                            value={printData.name}
                            onChange={e => setPrintData({ ...printData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Barcode</label>
                            <input
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all font-mono"
                                value={printData.code}
                                onChange={e => setPrintData({ ...printData, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Price</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all"
                                value={printData.price}
                                onChange={e => setPrintData({ ...printData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white border border-black/5 flex flex-col items-center justify-center gap-2" id="barcode-preview">
                        <img 
                            src="/libertycollection.png" 
                            alt="Liberty Collection" 
                            className="h-8 object-contain mb-1"
                        />
                        <p className="text-[10px] text-center max-w-[200px] truncate">{printData.name}</p>
                        <Barcode 
                            value={printData.code || "000000"} 
                            width={1.5}
                            height={40}
                            fontSize={12}
                            displayValue={true}
                            margin={0}
                        />
                        <p className="text-sm font-bold">RS {Number(printData.price).toFixed(2)}</p>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="w-full py-4 rounded-2xl premium-gradient text-white font-bold shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        <ScanBarcode className="w-5 h-5" />
                        Print Label (1.5" x 1")
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function ProductModal({ onClose, onSubmit, initialData, categories }: { onClose: () => void, onSubmit: () => void, initialData: any, categories: any[] }) {
    const [formData, setFormData] = useState(initialData || {
        code: "",
        name: "",
        costPrice: "",
        wholesalePrice: "",
        retailPrice: "",
        stock: "0",
        categoryId: ""
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const url = initialData ? `/api/products/${initialData.id}` : "/api/products";
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
                className="relative w-full max-w-2xl rounded-3xl glass border border-black/5 p-8 overflow-hidden shadow-2xl"
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Box className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold">{initialData ? "Edit Product" : "New Product"}</h3>
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
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Product Code</label>
                            <input
                                required
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all font-mono"
                                placeholder="PROD-001"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Name</label>
                            <input
                                required
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all font-medium"
                                placeholder="Widget Ultra Pro"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Category</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all font-medium appearance-none"
                                value={formData.categoryId || ""}
                                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Select Category...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Initial Stock</label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Cost Price</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all"
                                placeholder="0.00"
                                value={formData.costPrice}
                                onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Wholesale</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all"
                                placeholder="0.00"
                                value={formData.wholesalePrice}
                                onChange={e => setFormData({ ...formData, wholesalePrice: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground/40 uppercase tracking-widest pl-1">Retail</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:outline-none focus:border-primary transition-all"
                                placeholder="0.00"
                                value={formData.retailPrice}
                                onChange={e => setFormData({ ...formData, retailPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-4 rounded-2xl premium-gradient text-white font-bold shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            {initialData ? "Update Product" : "Create Product"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
