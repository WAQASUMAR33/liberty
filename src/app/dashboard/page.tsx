"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    TrendingUp,
    Users,
    Package,
    DollarSign,
    ArrowUpRight,
    ShoppingCart,
    Clock,
    Sparkles,
    AlertTriangle,
    Tag,
    Layers,
    Receipt,
    Wallet,
    Plus,
    RefreshCw,
    ChevronRight,
    ArrowRight,
    CheckCircle2,
    Calendar,
    Phone
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, sessionRes] = await Promise.all([
                fetch("/api/stats"),
                fetch("/api/auth/session"),
            ]);
            const stats = await statsRes.json();
            const session = await sessionRes.json();

            setData(stats);
            if (session.authenticated) {
                setUser(session.user);
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    // Time of day greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-foreground/50 animate-pulse">
                    Loading Liberty POS dashboard...
                </p>
            </div>
        );
    }

    const stats = data?.stats || {};
    const recentSales = data?.recentSales || [];
    const topProducts = data?.topProducts || [];
    const lowStockProducts = data?.lowStockProducts || [];

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Overview
                    </h2>
                    <p className="text-foreground/60 text-sm mt-0.5">
                        Real-time operational status, sales volume, and inventory metrics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2.5 rounded-xl glass border border-black/5 hover:bg-black/5 text-foreground/70 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        title="Refresh statistics"
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                        <span>Refresh</span>
                    </button>
                    <Link
                        href="/dashboard/pos"
                        className="px-4 py-2.5 rounded-xl premium-gradient text-white font-bold text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Open POS</span>
                    </Link>
                </div>
            </div>

            {/* Executive KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Sales */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-6 rounded-3xl glass border border-black/5 bg-white shadow-xs hover:shadow-md hover:border-primary/20 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700">
                            {stats.totalInvoices || 0} Invoices
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Total Sales Volume</p>
                        <h3 className="text-2xl font-black text-foreground mt-1 tracking-tight">
                            {formatCurrency(stats.totalSales || 0)}
                        </h3>
                        <p className="text-xs text-foreground/50 mt-1 font-medium">
                            Lifetime net revenue generated
                        </p>
                    </div>
                </motion.div>

                {/* 2. Today's Collections */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-3xl glass border border-black/5 bg-white shadow-xs hover:shadow-md hover:border-emerald-500/20 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                            Today ({stats.todayInvoices || 0})
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Today's Collections</p>
                        <h3 className="text-2xl font-black text-foreground mt-1 tracking-tight text-emerald-600">
                            {formatCurrency(stats.todayRevenue || 0)}
                        </h3>
                        <p className="text-xs text-foreground/50 mt-1 font-medium">
                            Billed today: {formatCurrency(stats.todaySalesTotal || 0)}
                        </p>
                    </div>
                </motion.div>

                {/* 3. Catalog & Low Stock */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-6 rounded-3xl glass border border-black/5 bg-white shadow-xs hover:shadow-md hover:border-purple-500/20 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                            <Package className="w-6 h-6" />
                        </div>
                        {stats.lowStockCount > 0 ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {stats.lowStockCount} Low
                            </span>
                        ) : (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                                Stock Good
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Active Inventory</p>
                        <h3 className="text-2xl font-black text-foreground mt-1 tracking-tight">
                            {stats.productCount || 0}{" "}
                            <span className="text-sm font-semibold text-foreground/50">Items</span>
                        </h3>
                        <p className="text-xs text-foreground/50 mt-1 font-medium">
                            Across {stats.categoryCount || 0} categories & {stats.brandCount || 0} brands
                        </p>
                    </div>
                </motion.div>

                {/* 4. Customer Receivables */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-3xl glass border border-black/5 bg-white shadow-xs hover:shadow-md hover:border-amber-500/20 transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700">
                            {stats.customerCount || 0} Accounts
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Customer Receivables</p>
                        <h3 className="text-2xl font-black text-foreground mt-1 tracking-tight text-amber-600">
                            {formatCurrency(stats.totalReceivables || 0)}
                        </h3>
                        <p className="text-xs text-foreground/50 mt-1 font-medium">
                            Total outstanding credit balance
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Middle Section: Recent Sales & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Sales Feed (2 Columns) */}
                <div className="lg:col-span-2 rounded-3xl glass border border-black/5 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Recent Invoices</h3>
                                <p className="text-xs text-foreground/50 mt-0.5">Latest sales transactions and point-of-sale bills</p>
                            </div>
                            <Link
                                href="/dashboard/sales"
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
                            >
                                <span>View all sales</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {recentSales.length === 0 ? (
                                <div className="py-16 text-center text-foreground/30 font-medium">
                                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50 stroke-[1.5]" />
                                    <p>No sales recorded yet.</p>
                                </div>
                            ) : (
                                recentSales.map((sale: any) => {
                                    const isPaid = Number(sale.balance) <= 0;
                                    return (
                                        <div
                                            key={sale.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-black/[0.015] hover:bg-black/[0.035] border border-black/5 transition-all gap-3"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                                    {sale.customer?.name?.[0]?.toUpperCase() || "C"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">
                                                        {sale.customer?.name || "Walk-in Customer"}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-foreground/50 mt-0.5">
                                                        <span className="font-mono font-semibold text-primary">{sale.billNumber}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{sale.type?.toLowerCase()}</span>
                                                        <span>•</span>
                                                        <span>{new Date(sale.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-black/5">
                                                <span className="font-black text-sm text-foreground">
                                                    {formatCurrency(sale.netTotal)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5",
                                                        isPaid
                                                            ? "bg-emerald-500/10 text-emerald-600"
                                                            : "bg-red-500/10 text-red-500"
                                                    )}
                                                >
                                                    {isPaid ? "Paid in Full" : `Credit (${formatCurrency(sale.balance)})`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-black/5 flex items-center justify-between">
                        <span className="text-xs text-foreground/50 font-medium">
                            Showing latest {recentSales.length} invoices
                        </span>
                        <Link
                            href="/dashboard/pos"
                            className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create New Bill</span>
                        </Link>
                    </div>
                </div>

                {/* Top Selling Products (1 Column) */}
                <div className="rounded-3xl glass border border-black/5 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Top Products</h3>
                                <p className="text-xs text-foreground/50 mt-0.5">Most popular by units sold</p>
                            </div>
                            <span className="p-2 rounded-xl bg-primary/10 text-primary">
                                <TrendingUp className="w-4 h-4" />
                            </span>
                        </div>

                        <div className="space-y-5">
                            {topProducts.length === 0 ? (
                                <div className="py-16 text-center text-foreground/30 font-medium">
                                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50 stroke-[1.5]" />
                                    <p>No product sales data yet.</p>
                                </div>
                            ) : (
                                topProducts.map((prod: any, i: number) => {
                                    const maxSold = topProducts[0]?.sold || 1;
                                    const percentage = Math.round((prod.sold / maxSold) * 100);

                                    return (
                                        <div key={prod.id || i} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-5 h-5 rounded-lg bg-black/5 text-[10px] font-black flex items-center justify-center text-foreground/60 shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <p className="font-bold text-foreground truncate text-xs sm:text-sm">
                                                        {prod.name}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-black text-primary shrink-0 ml-2">
                                                    {prod.sold} sold
                                                </span>
                                            </div>

                                            {/* Progress Meter */}
                                            <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                                    className="h-full premium-gradient rounded-full"
                                                />
                                            </div>

                                            <div className="flex justify-between text-[10px] text-foreground/40">
                                                <span>Category: {prod.category}</span>
                                                <span>Revenue: {formatCurrency(prod.revenue)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-black/5 text-center">
                        <Link
                            href="/dashboard/products"
                            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                            <span>Browse Product Inventory</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Low Stock Alert & Store Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Low Stock Alerts (2 Columns) */}
                <div className="lg:col-span-2 rounded-3xl glass border border-black/5 bg-white p-6 sm:p-8 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">Inventory Alerts</h3>
                                <p className="text-xs text-foreground/50 mt-0.5">Products with low stock (10 units or less)</p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/products"
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            <span>Manage stock</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {lowStockProducts.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm font-bold text-emerald-800">All Products are Well-Stocked!</p>
                            <p className="text-xs text-emerald-600 mt-0.5">No items are currently below the low-stock threshold.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {lowStockProducts.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-2xl bg-red-500/[0.03] border border-red-500/15 flex items-center justify-between hover:bg-red-500/[0.06] transition-colors"
                                >
                                    <div className="min-w-0 pr-3">
                                        <p className="font-bold text-xs text-foreground truncate">{item.name}</p>
                                        <p className="text-[11px] text-foreground/40 font-mono mt-0.5">{item.code}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={cn(
                                            "inline-block px-2.5 py-1 rounded-full text-xs font-black",
                                            item.stock <= 0
                                                ? "bg-red-500 text-white shadow-xs"
                                                : "bg-red-500/10 text-red-600"
                                        )}>
                                            {item.stock <= 0 ? "Out of Stock" : `${item.stock} left`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Access Store Stats */}
                <div className="rounded-3xl glass border border-black/5 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Catalog Overview</h3>
                        <p className="text-xs text-foreground/50 mb-6">Key catalog distribution breakdown</p>

                        <div className="space-y-4">
                            <Link
                                href="/dashboard/products"
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] hover:bg-black/[0.04] border border-black/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Products Catalog</span>
                                </div>
                                <span className="font-mono text-xs font-black text-foreground/70">{stats.productCount || 0}</span>
                            </Link>

                            <Link
                                href="/dashboard/brands"
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] hover:bg-black/[0.04] border border-black/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Registered Brands</span>
                                </div>
                                <span className="font-mono text-xs font-black text-foreground/70">{stats.brandCount || 0}</span>
                            </Link>

                            <Link
                                href="/dashboard/categories"
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] hover:bg-black/[0.04] border border-black/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Categories</span>
                                </div>
                                <span className="font-mono text-xs font-black text-foreground/70">{stats.categoryCount || 0}</span>
                            </Link>

                            <Link
                                href="/dashboard/customers"
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] hover:bg-black/[0.04] border border-black/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Customers</span>
                                </div>
                                <span className="font-mono text-xs font-black text-foreground/70">{stats.customerCount || 0}</span>
                            </Link>
                        </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-black/5 text-center">
                        <Link
                            href="/dashboard/admin"
                            className="text-xs font-bold text-foreground/60 hover:text-foreground inline-flex items-center gap-1.5"
                        >
                            <span>Open Admin Controls</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
