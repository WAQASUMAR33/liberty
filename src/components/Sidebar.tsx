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
    Layers,
    Tag,
    X,
    Menu,
    Sparkles,
    Zap,
    ChevronRight,
    Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MenuItem {
    icon: any;
    label: string;
    href: string;
    badge?: string;
    adminOnly?: boolean;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

const menuSections: MenuSection[] = [
    {
        title: "OPERATIONS",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
            { icon: ShoppingCart, label: "POS / Billing", href: "/dashboard/pos", badge: "POS" },
        ],
    },
    {
        title: "CATALOG & STOCK",
        items: [
            { icon: Package, label: "Products", href: "/dashboard/products" },
            { icon: Layers, label: "Categories", href: "/dashboard/categories" },
            { icon: Tag, label: "Brands", href: "/dashboard/brands" },
        ],
    },
    {
        title: "FINANCE & SALES",
        items: [
            { icon: Users, label: "Customers", href: "/dashboard/customers" },
            { icon: BookOpen, label: "Ledger", href: "/dashboard/ledger" },
            { icon: Wallet, label: "Payments", href: "/dashboard/payments" },
            { icon: Printer, label: "Sales History", href: "/dashboard/sales" },
        ],
    },
    {
        title: "SYSTEM",
        items: [
            { icon: ShieldCheck, label: "Admin Control", href: "/dashboard/admin", adminOnly: true },
        ],
    },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch("/api/auth/session")
            .then((res) => res.json())
            .then((data) => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(() => {});
    }, []);

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
        <div className="flex flex-col h-full text-foreground select-none">
            {/* Branding Header */}
            <div className="p-5 pb-3">
                <Link
                    href="/dashboard"
                    onClick={onNavigate}
                    className="flex items-center gap-3.5 p-2 rounded-none-none hover:bg-black/[0.03] transition-all group"
                >
                    <div className="w-11 h-11 rounded-none-none premium-gradient flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-base font-black tracking-tight leading-tight text-foreground group-hover:text-primary transition-colors">
                            Liberty Kollection
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-none-none bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-semibold text-foreground/50 tracking-wide uppercase">
                                POS Terminal
                            </span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick POS Action CTA Button */}
            <div className="px-5 mb-2">
                <Link
                    href="/dashboard/pos"
                    onClick={onNavigate}
                    className="w-full py-3 px-4 rounded-none-none bg-gradient-to-r from-primary to-accent text-white font-bold text-sm flex items-center justify-between shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                >
                    <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 fill-white text-white group-hover:rotate-12 transition-transform" />
                        <span>Open POS Billing</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 custom-scrollbar">
                {menuSections.map((section) => {
                    // Filter admin-only if user is not admin
                    const visibleItems = section.items.filter(
                        (item) => !item.adminOnly || user?.role === "ADMIN"
                    );

                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={section.title} className="space-y-1">
                            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-foreground/40">
                                {section.title}
                            </div>
                            {visibleItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "relative flex items-center justify-between px-3.5 py-2.5 rounded-none-none text-sm font-semibold transition-all duration-200 group",
                                            isActive
                                                ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5"
                                                : "text-foreground/60 hover:text-foreground hover:bg-black/[0.03]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    "p-1.5 rounded-none-none transition-colors",
                                                    isActive
                                                        ? "bg-primary text-white shadow-sm"
                                                        : "bg-transparent text-foreground/50 group-hover:text-foreground group-hover:bg-black/5"
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span>{item.label}</span>
                                        </div>

                                        {item.badge && (
                                            <span
                                                className={cn(
                                                    "text-[10px] font-extrabold px-2 py-0.5 rounded-none-none uppercase tracking-wider",
                                                    isActive
                                                        ? "bg-primary text-white"
                                                        : "bg-primary/10 text-primary"
                                                )}
                                            >
                                                {item.badge}
                                            </span>
                                        )}

                                        {isActive && (
                                            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-none-none" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Sidebar User Footer */}
            <div className="p-4 border-t border-black/5 bg-black/[0.01]">
                <div className="flex items-center justify-between p-2.5 rounded-none-none bg-white border border-black/5 shadow-xs mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-none-none premium-gradient flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate leading-tight">
                                {user?.name || "System User"}
                            </p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary mt-0.5">
                                {user?.role || "CASHIER"}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-none-none text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                    {loggingOut ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-red-500/20 border-t-red-500 rounded-none-none animate-spin" />
                            <span>Signing out...</span>
                        </>
                    ) : (
                        <>
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="hidden lg:flex flex-col h-full w-64 glass border-r border-black/5 z-30 shrink-0">
            <SidebarContent />
        </aside>
    );
}

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="lg:hidden p-2.5 rounded-none-none bg-black/5 hover:bg-black/10 text-foreground transition-colors cursor-pointer"
                title="Open Navigation"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden animate-fade-in"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <div
                className={cn(
                    "fixed top-0 left-0 z-50 h-full w-72 glass border-r border-black/5 transform transition-transform duration-300 ease-in-out lg:hidden bg-white shadow-2xl flex flex-col",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-none-none bg-black/5 hover:bg-black/10 text-foreground transition-colors z-10 cursor-pointer"
                    title="Close Navigation"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent onNavigate={() => setOpen(false)} />
            </div>
        </>
    );
}
