"use client";

import { Sidebar, MobileNav } from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Clock,
    ShoppingCart,
    Plus,
    LayoutDashboard,
    Package,
    Users,
    BookOpen,
    Wallet,
    Printer,
    ShieldCheck,
    Layers,
    Tag,
    Sparkles,
    Calendar,
    Search
} from "lucide-react";

const pageMeta: Record<string, { label: string; icon: any; desc: string }> = {
    "/dashboard": { label: "Dashboard", icon: LayoutDashboard, desc: "Executive business summary" },
    "/dashboard/pos": { label: "POS / Billing", icon: ShoppingCart, desc: "Point of sale & invoicing" },
    "/dashboard/products": { label: "Products", icon: Package, desc: "Inventory & catalog" },
    "/dashboard/categories": { label: "Categories", icon: Layers, desc: "Product categorization" },
    "/dashboard/brands": { label: "Brands", icon: Tag, desc: "Manufacturer & brands" },
    "/dashboard/customers": { label: "Customers", icon: Users, desc: "Customer accounts & credits" },
    "/dashboard/ledger": { label: "Ledger", icon: BookOpen, desc: "Financial audit & statements" },
    "/dashboard/payments": { label: "Payments", icon: Wallet, desc: "Cash & credit logs" },
    "/dashboard/sales": { label: "Sales History", icon: Printer, desc: "Invoices & receipts" },
    "/dashboard/admin": { label: "Admin Control", icon: ShieldCheck, desc: "User management & system" },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState<string>("");
    const [currentDate, setCurrentDate] = useState<string>("");
    const pathname = usePathname();

    useEffect(() => {
        // Fetch session
        fetch("/api/auth/session")
            .then((res) => res.json())
            .then((data) => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            })
            .catch(() => {});

        // Clock updater
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
            );
            setCurrentDate(
                now.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                })
            );
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const currentPage = pageMeta[pathname] || {
        label: pathname.split("/").pop() || "Dashboard",
        icon: LayoutDashboard,
        desc: "Management console",
    };
    const PageIcon = currentPage.icon;

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                {/* Top Header */}
                <header className="h-20 border-b border-black/5 glass bg-white/70 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-20 shrink-0">
                    {/* Left: Mobile Toggle & Page Title */}
                    <div className="flex items-center gap-3.5 min-w-0">
                        <MobileNav />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-none-none bg-primary/10 text-primary flex items-center justify-center shrink-0 hidden sm:flex">
                                <PageIcon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground/40 hidden sm:inline">
                                        Liberty /
                                    </span>
                                    <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate capitalize">
                                        {currentPage.label}
                                    </h1>
                                </div>
                                <span className="text-[11px] text-foreground/50 hidden md:block">
                                    {currentPage.desc}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Real-time Date/Time & Quick Links & Profile */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Live Clock & Date */}
                        <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-2 rounded-none-none bg-white border border-black/5 shadow-xs">
                            <span className="w-2 h-2 rounded-none-none bg-emerald-500 animate-ping" />
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground/70">
                                <span>{currentDate}</span>
                                <span className="text-foreground/30">•</span>
                                <span className="font-mono text-primary">{currentTime}</span>
                            </div>
                        </div>

                        {/* POS Quick Button in Header (if not on POS page) */}
                        {pathname !== "/dashboard/pos" && (
                            <Link
                                href="/dashboard/pos"
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-none-none premium-gradient text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span>New Sale (POS)</span>
                            </Link>
                        )}

                        {/* User Profile Pill */}
                        <div className="flex items-center gap-3 pl-2 sm:pl-3 sm:border-l sm:border-black/5">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <span className="text-xs font-extrabold text-foreground leading-tight">
                                    {user?.name || "Loading..."}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.2 rounded-none mt-0.5">
                                    {user?.role || "CASHIER"}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-none-none premium-gradient p-[1.5px] shadow-sm shrink-0">
                                <div className="w-full h-full rounded-none-none bg-white flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Viewport Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
