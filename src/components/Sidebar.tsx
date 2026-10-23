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
    ChevronDown,
    ChevronLeft,
    Store,
    Truck,
    Building2,
    BookMarked,
    Receipt,
    FileText,
    Search,
    PanelLeftClose,
    PanelLeftOpen,
    Command
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
    icon: any;
    label: string;
    href: string;
    badge?: string;
    adminOnly?: boolean;
    shortcut?: string;
}

interface MenuSection {
    id: string;
    title: string;
    items: MenuItem[];
}

const menuSections: MenuSection[] = [
    {
        id: "operations",
        title: "OPERATIONS",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", shortcut: "D" },
            { icon: ShoppingCart, label: "POS / Billing", href: "/dashboard/pos", badge: "POS", shortcut: "P" },
            { icon: Truck, label: "Purchases (Stock In)", href: "/dashboard/purchases", badge: "NEW" },
        ],
    },
    {
        id: "catalog",
        title: "CATALOG & STOCK",
        items: [
            { icon: Package, label: "Products", href: "/dashboard/products" },
            { icon: Layers, label: "Categories", href: "/dashboard/categories" },
            { icon: Tag, label: "Brands", href: "/dashboard/brands" },
        ],
    },
    {
        id: "finance",
        title: "FINANCE & ACCOUNTS",
        items: [
            { icon: Users, label: "Customers", href: "/dashboard/customers" },
            { icon: BookOpen, label: "Customer Ledger", href: "/dashboard/ledger" },
            { icon: Wallet, label: "Customer Payments", href: "/dashboard/payments" },
            { icon: Building2, label: "Suppliers", href: "/dashboard/suppliers" },
            { icon: BookMarked, label: "Supplier Ledger", href: "/dashboard/supplier-ledger" },
            { icon: Receipt, label: "Expenses", href: "/dashboard/expenses" },
            { icon: Printer, label: "Sales History", href: "/dashboard/sales" },
            { icon: FileText, label: "Quotations", href: "/dashboard/quotations" },
        ],
    },
    {
        id: "system",
        title: "SYSTEM",
        items: [
            { icon: ShieldCheck, label: "Admin Control", href: "/dashboard/admin", adminOnly: true },
        ],
    },
];

interface SidebarContentProps {
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onNavigate?: () => void;
    isMobile?: boolean;
}

function SidebarContent({
    collapsed = false,
    onToggleCollapse,
    onNavigate,
    isMobile = false,
}: SidebarContentProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [loggingOut, setLoggingOut] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // Fetch authenticated session
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

    // Keyboard shortcuts: Ctrl+B or Cmd+B to toggle sidebar collapse
    useEffect(() => {
        if (isMobile) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                e.preventDefault();
                onToggleCollapse?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isMobile, onToggleCollapse]);

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

    const toggleSection = (sectionId: string) => {
        if (collapsed) return;
        setCollapsedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    // Filter menu items by search query
    const filteredSections = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return menuSections
            .map((section) => {
                const visibleItems = section.items.filter((item) => {
                    const isAdminAllowed = !item.adminOnly || user?.role === "ADMIN";
                    if (!isAdminAllowed) return false;
                    if (!query) return true;
                    return (
                        item.label.toLowerCase().includes(query) ||
                        section.title.toLowerCase().includes(query) ||
                        (item.badge && item.badge.toLowerCase().includes(query))
                    );
                });
                return {
                    ...section,
                    items: visibleItems,
                };
            })
            .filter((section) => section.items.length > 0);
    }, [searchQuery, user]);

    return (
        <div className="flex flex-col h-full text-foreground select-none overflow-hidden bg-white/80 backdrop-blur-md">
            {/* Header: Brand & Collapse Toggle */}
            <div className={cn(
                "p-4 border-b border-black/5 flex items-center justify-between shrink-0 transition-all",
                collapsed ? "px-3 justify-center" : "px-4"
            )}>
                <Link
                    href="/dashboard"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center gap-3 group transition-transform",
                        collapsed ? "justify-center" : "min-w-0"
                    )}
                    title="Liberty Kollection Dashboard"
                >
                    <div className="w-10 h-10 rounded-none bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0 flex flex-col animate-fade-in">
                            <span className="text-sm font-black tracking-wider uppercase text-foreground truncate group-hover:text-primary transition-colors">
                                Liberty Kollection
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-foreground/50 tracking-wider uppercase">
                                    POS Node Online
                                </span>
                            </div>
                        </div>
                    )}
                </Link>

                {/* Desktop Collapse Toggle Button */}
                {!isMobile && onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className={cn(
                            "p-1.5 text-foreground/40 hover:text-foreground hover:bg-black/5 rounded-none transition-colors cursor-pointer",
                            collapsed && "hidden"
                        )}
                        title="Collapse sidebar (Ctrl+B)"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Quick POS Action CTA Button */}
            <div className={cn("p-3 pb-2 shrink-0", collapsed ? "px-2" : "px-3")}>
                <Link
                    href="/dashboard/pos"
                    onClick={onNavigate}
                    className={cn(
                        "w-full py-2.5 rounded-none bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all group relative overflow-hidden",
                        collapsed ? "justify-center px-0 h-10" : "justify-between px-3"
                    )}
                    title={collapsed ? "Open POS Billing (P)" : undefined}
                >
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform shrink-0" />
                        {!collapsed && <span>Open POS Billing</span>}
                    </div>
                    {!collapsed && (
                        <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:translate-x-1 transition-transform" />
                    )}
                </Link>
            </div>

            {/* Interactive Search Bar (When Expanded) */}
            {!collapsed ? (
                <div className="px-3 pb-2 shrink-0">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Quick jump..."
                            className="w-full pl-8 pr-7 py-1.5 text-xs bg-black/[0.03] hover:bg-black/[0.05] focus:bg-white border border-black/5 focus:border-primary/50 focus:outline-none transition-all placeholder:text-foreground/40 font-medium"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5 cursor-pointer"
                                title="Clear search"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* Collapsed Search Icon to Expand */
                <div className="px-2 pb-2 shrink-0 flex justify-center">
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="w-10 h-8 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-black/5 rounded-none transition-colors"
                        title="Search / Expand (Ctrl+B)"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Navigation Menu List */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 custom-scrollbar">
                {filteredSections.length === 0 ? (
                    <div className="text-center py-8 text-xs text-foreground/40 px-3">
                        No pages match &ldquo;{searchQuery}&rdquo;
                    </div>
                ) : (
                    filteredSections.map((section) => {
                        const isSectionCollapsed = !!collapsedSections[section.id];

                        return (
                            <div key={section.id} className="space-y-1">
                                {/* Section Header (Collapsible Accordion when expanded) */}
                                {!collapsed ? (
                                    <button
                                        type="button"
                                        onClick={() => toggleSection(section.id)}
                                        className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors text-left group cursor-pointer"
                                    >
                                        <span>{section.title}</span>
                                        <ChevronDown
                                            className={cn(
                                                "w-3 h-3 transition-transform duration-200 text-foreground/30 group-hover:text-foreground/60",
                                                isSectionCollapsed && "-rotate-90"
                                            )}
                                        />
                                    </button>
                                ) : (
                                    <div className="my-2 border-t border-black/5 mx-2" />
                                )}

                                {/* Menu Items */}
                                {(!isSectionCollapsed || collapsed) && (
                                    <div className="space-y-0.5">
                                        {section.items.map((item) => {
                                            const isActive = pathname === item.href;
                                            const Icon = item.icon;

                                            return (
                                                <div
                                                    key={item.href}
                                                    className="relative"
                                                    onMouseEnter={() => setHoveredItem(item.href)}
                                                    onMouseLeave={() => setHoveredItem(null)}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        onClick={onNavigate}
                                                        className={cn(
                                                            "relative flex items-center py-2 text-xs font-semibold transition-all duration-150 rounded-none group cursor-pointer",
                                                            collapsed
                                                                ? "justify-center px-0 h-10 w-full"
                                                                : "justify-between px-3",
                                                            isActive
                                                                ? "bg-primary/10 text-primary font-bold shadow-xs border-l-2 border-primary"
                                                                : "text-foreground/65 hover:text-foreground hover:bg-black/[0.04]"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "flex items-center gap-2.5",
                                                            collapsed && "justify-center"
                                                        )}>
                                                            <div
                                                                className={cn(
                                                                    "p-1.5 rounded-none transition-colors shrink-0",
                                                                    isActive
                                                                        ? "bg-primary text-white shadow-xs"
                                                                        : "bg-transparent text-foreground/50 group-hover:text-primary group-hover:bg-primary/5"
                                                                )}
                                                            >
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            {!collapsed && (
                                                                <span className="truncate">{item.label}</span>
                                                            )}
                                                        </div>

                                                        {/* Badges / Shortcuts when expanded */}
                                                        {!collapsed && (
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {item.badge && (
                                                                    <span
                                                                        className={cn(
                                                                            "text-[9px] font-black px-1.5 py-0.5 rounded-none uppercase tracking-wider",
                                                                            isActive
                                                                                ? "bg-primary text-white"
                                                                                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"
                                                                        )}
                                                                    >
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Link>

                                                    {/* Floating Flyout Tooltip when Collapsed */}
                                                    {collapsed && hoveredItem === item.href && (
                                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#0f172a] text-white text-xs font-semibold z-50 whitespace-nowrap shadow-xl border border-white/10 pointer-events-none flex items-center gap-2 animate-fade-in">
                                                            <span>{item.label}</span>
                                                            {item.badge && (
                                                                <span className="text-[9px] px-1 py-0.2 bg-primary text-white font-black">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0f172a]" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sidebar User Footer & Attribution */}
            <div className="p-3 border-t border-black/5 bg-black/[0.01] shrink-0">
                {!collapsed ? (
                    <>
                        {/* User Profile Card */}
                        <div className="flex items-center justify-between p-2.5 rounded-none bg-white border border-black/5 shadow-xs mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-none bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                                        {user?.name || "System User"}
                                    </p>
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-none text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary mt-0.5">
                                        {user?.role || "CASHIER"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-none text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loggingOut ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-red-500/20 border-t-red-500 rounded-none animate-spin" />
                                    <span>Signing out...</span>
                                </>
                            ) : (
                                <>
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Sign Out</span>
                                </>
                            )}
                        </button>

                        {/* Developer Attribution Line */}
                        <div className="mt-2 pt-2 border-t border-black/5 text-center text-[10px] text-foreground/45 font-medium tracking-wide">
                            Developed By : <span className="text-foreground/75 font-bold">RAPIDTECHPRO</span>
                        </div>
                    </>
                ) : (
                    /* Collapsed User & Logout Tooltips */
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-9 h-9 rounded-none bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-xs"
                            title={`${user?.name || "User"} (${user?.role || "CASHIER"})`}
                        >
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-none transition-colors cursor-pointer"
                            title="Sign Out"
                        >
                            {loggingOut ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-500/20 border-t-red-500 rounded-none animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                        </button>

                        {/* Expand toggle at bottom when collapsed */}
                        {!isMobile && onToggleCollapse && (
                            <button
                                type="button"
                                onClick={onToggleCollapse}
                                className="w-9 h-9 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-black/5 rounded-none transition-colors cursor-pointer mt-1"
                                title="Expand sidebar (Ctrl+B)"
                            >
                                <PanelLeftOpen className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);

    // Load persisted collapse state on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("liberty_sidebar_collapsed");
            if (saved !== null) {
                setCollapsed(saved === "true");
            }
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem("liberty_sidebar_collapsed", String(next));
            } catch {
                // Ignore localStorage errors
            }
            return next;
        });
    };

    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col h-full glass border-r border-black/5 z-30 shrink-0 transition-all duration-300 ease-in-out relative",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <SidebarContent
                collapsed={collapsed}
                onToggleCollapse={toggleCollapse}
            />
        </aside>
    );
}

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="lg:hidden p-2.5 rounded-none bg-black/5 hover:bg-black/10 text-foreground transition-colors cursor-pointer"
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
                    type="button"
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-none bg-black/5 hover:bg-black/10 text-foreground transition-colors z-10 cursor-pointer"
                    title="Close Navigation"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent
                    onNavigate={() => setOpen(false)}
                    isMobile={true}
                />
            </div>
        </>
    );
}
