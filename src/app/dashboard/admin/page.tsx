"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    ShieldCheck,
    User,
    Lock,
    UserCircle,
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await fetch(`/api/users/${id}`, { method: "DELETE" });
            fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredUsers = users.filter((u: any) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-foreground/60">Manage system users and access control.</p>
                </div>
                <button
                    onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                    className="px-6 py-3 rounded-2xl premium-gradient text-white font-bold flex items-center gap-2 group shadow-xl transition-all"
                >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                    Add User
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or username..."
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
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Username</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest">Created</th>
                                <th className="px-6 py-4 text-xs font-bold text-foreground/40 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                            <p className="text-foreground/40 font-medium">Loading users...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-foreground/40 font-medium">
                                        No users found. Add your first user to get started.
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user: any) => (
                                <tr key={user.id} className="hover:bg-black/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                                                user.role === "ADMIN" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-blue-500 to-cyan-500"
                                            )}>
                                                {user.name[0].toUpperCase()}
                                            </div>
                                            <span className="font-bold">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground/60 font-mono text-sm">@{user.username}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border",
                                            user.role === "ADMIN"
                                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        )}>
                                            {user.role === "ADMIN" && <ShieldCheck className="w-3 h-3 inline mr-1" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-foreground/60 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                                className="p-2 rounded-xl bg-black/5 hover:bg-black/10 text-foreground/60 hover:text-foreground transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
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
                    <UserModal
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={() => { setIsModalOpen(false); fetchUsers(); }}
                        initialData={editingUser}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function UserModal({ onClose, onSubmit, initialData }: { onClose: () => void, onSubmit: () => void, initialData: any }) {
    const [formData, setFormData] = useState(initialData || {
        username: "",
        password: "",
        name: "",
        role: "CASHIER"
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const url = initialData ? `/api/users/${initialData.id}` : "/api/users";
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
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-600">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold">{initialData ? "Edit User" : "New User"}</h3>
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
                        <div className="relative">
                            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                            <input
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all font-medium"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all font-mono"
                                    placeholder="johndoe"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">
                                Password {initialData && "(leave blank to keep)"}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                                <input
                                    type="password"
                                    required={!initialData}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/5 border border-black/5 focus:border-primary focus:outline-none transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em] pl-1">Role</label>
                        <div className="flex gap-3">
                            {["CASHIER", "ADMIN"].map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role })}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2",
                                        formData.role === role
                                            ? role === "ADMIN"
                                                ? "bg-purple-500 border-purple-500 text-white shadow-lg"
                                                : "bg-blue-500 border-blue-500 text-white shadow-lg"
                                            : "bg-black/5 border-black/5 text-foreground/40 hover:bg-black/10"
                                    )}
                                >
                                    {role === "ADMIN" ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-2xl premium-gradient text-white font-bold shadow-xl hover:opacity-90 transition-all"
                    >
                        {initialData ? "Update User" : "Create User"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
