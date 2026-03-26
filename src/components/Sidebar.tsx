"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingCart,
    BookOpen,
    Wallet,
    Printer,
    Settings,
    LogOut,
    ShieldCheck,
    Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: ShoppingCart, label: "POS / Billing", href: "/dashboard/pos" },
    { icon: Package, label: "Products", href: "/dashboard/products" },
    { icon: Layers, label: "Categories", href: "/dashboard/categories" },
    { icon: Users, label: "Customers", href: "/dashboard/customers" },
    { icon: BookOpen, label: "Ledger", href: "/dashboard/ledger" },
    { icon: Wallet, label: "Payments", href: "/dashboard/payments" },
    { icon: Printer, label: "Sales", href: "/dashboard/sales" },
    { icon: ShieldCheck, label: "Admin", href: "/dashboard/admin", adminOnly: true },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            setLoggingOut(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-64 glass border-r border-black/5 text-foreground">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tighter">Liberty Kollection</span>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]"
                                    : "text-foreground/60 hover:text-foreground hover:bg-black/5"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                pathname === item.href ? "text-primary" : "group-hover:text-foreground"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 space-y-1 border-t border-black/5">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-foreground/60 hover:text-foreground hover:bg-black/5 transition-all">
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                </button>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50"
                >
                    {loggingOut ? (
                        <>
                            <div className="w-5 h-5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                            <span className="font-medium">Logging out...</span>
                        </>
                    ) : (
                        <>
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
