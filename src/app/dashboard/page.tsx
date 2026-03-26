"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    Users,
    Package,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";

const iconMap: any = {
    DollarSign,
    Users,
    Package,
    TrendingUp
};

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/stats")
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Overview</h2>
                <p className="text-foreground/60">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data?.stats?.map((stat: any, i: number) => {
                    const Icon = iconMap[stat.icon];
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-3xl glass border border-black/5 hover:bg-black/[0.02] transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-2xl bg-black/5", stat.color)}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground/40">{stat.label}</p>
                                <h3 className="text-2xl font-bold mt-1">
                                    {stat.label.includes("Sales") || stat.label.includes("Revenue")
                                        ? formatCurrency(stat.value)
                                        : stat.value}
                                </h3>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-3xl glass border border-black/5 p-8 min-h-[400px]">
                    <h3 className="text-xl font-bold mb-6">Recent Sales</h3>
                    <div className="space-y-4">
                        {data?.recentSales?.map((sale: any, i: number) => (
                            <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {sale.customer.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{sale.customer.name}</p>
                                        <p className="text-xs text-foreground/40">{sale.billNumber} • {sale.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">{formatCurrency(sale.netTotal)}</p>
                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{sale.balance > 0 ? "Credit" : "Paid"}</p>
                                </div>
                            </div>
                        ))}
                        {data?.recentSales?.length === 0 && (
                            <div className="py-20 text-center text-foreground/20 italic">No recent sales found.</div>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl glass border border-black/5 p-8">
                    <h3 className="text-xl font-bold mb-6">Top Products</h3>
                    <div className="space-y-6">
                        {data?.topProducts?.map((product: any, i: number) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-xl">
                                    📦
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{product.name}</p>
                                    <div className="w-full bg-black/5 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full premium-gradient"
                                            style={{ width: `${Math.min(100, (product.sold / 100) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-foreground/40">{product.sold} Sold</p>
                                </div>
                            </div>
                        ))}
                        {data?.topProducts?.length === 0 && (
                            <div className="py-20 text-center text-foreground/20 italic">No product data.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
