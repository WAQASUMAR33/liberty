"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    ArrowRight,
    Clock,
    AlertCircle,
    Store,
    Zap,
    KeyRound
} from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({ username: "", password: "" });
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [currentTime, setCurrentTime] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    // Live Clock for Terminal Experience
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                })
            );
            setCurrentDate(
                now.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })
            );
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Caps Lock Detector
    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.getModifierState) {
            setCapsLockActive(e.getModifierState("CapsLock"));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Invalid username or password");

            router.push("/dashboard");
            router.refresh();
        } catch (err: unknown) {
            setLoginError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] text-[#0f172a] selection:bg-primary selection:text-white relative overflow-hidden">
            {/* LEFT PANEL: Brand Showcase & Terminal Status (Hidden on small screens, gorgeous on lg+) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 xl:p-16 bg-[#090d16] text-white overflow-hidden border-r border-white/10">
                {/* Ambient glow effects & grid lines */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/25 blur-[140px] pointer-events-none" />
                    <div className="absolute top-1/2 -right-32 w-96 h-96 bg-purple-600/20 blur-[150px] pointer-events-none" />
                    <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-sky-500/15 blur-[140px] pointer-events-none" />
                    <div
                        className="absolute inset-0 opacity-[0.035]"
                        style={{
                            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
                            backgroundSize: "48px 48px",
                        }}
                    />
                </div>

                {/* Top Brand Bar */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/10">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-black tracking-wider uppercase text-white block">
                                Liberty Kollection
                            </span>
                            <span className="text-xs tracking-widest text-white/50 uppercase font-semibold">
                                Retail POS & Inventory Suite
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-xs font-medium text-white/70">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 bg-emerald-500"></span>
                        </span>
                        System Online
                    </div>
                </div>

                {/* Middle Showcase Content */}
                <div className="relative z-10 my-auto py-12 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-widest uppercase mb-6">
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        Next-Generation Point of Sale
                    </div>

                    <div className="mb-6 p-4 bg-white/5 border border-white/10 backdrop-blur-sm inline-block">
                        <Image
                            src="/libertycollection.png"
                            alt="Liberty Kollection"
                            width={280}
                            height={120}
                            className="object-contain brightness-105 contrast-110 drop-shadow-md"
                            priority
                        />
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
                        Seamless precision for your retail operations.
                    </h1>

                    <p className="text-base xl:text-lg text-slate-300 font-normal leading-relaxed mb-8">
                        Unified point of sale, supplier purchase procurement, real-time customer ledgers, and inventory controls designed for speed and reliability.
                    </p>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-2 gap-3.5">
                        <div className="p-4 bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-blue-500/40 transition-colors">
                            <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm mb-1.5">
                                <Zap className="w-4 h-4" />
                                Instant Checkout
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">
                                High-speed barcode scanning, multi-item invoicing & instant thermal receipts.
                            </p>
                        </div>

                        <div className="p-4 bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
                            <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm mb-1.5">
                                <ShieldCheck className="w-4 h-4" />
                                Financial Ledger
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">
                                Complete customer and supplier debit/credit tracking with verified audit trails.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Terminal Live Telemetry */}
                <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <div>
                            <span className="font-mono text-white font-semibold">{currentTime || "--:--:--"}</span>
                            <span className="mx-2 text-white/30">•</span>
                            <span>{currentDate || "Loading date..."}</span>
                        </div>
                    </div>
                    <div className="font-mono text-white/60 text-[11px] tracking-wide">
                        Developed By : <span className="text-white font-bold">RAPIDTECHPRO</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Sign-in Interface */}
            <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 md:p-12 xl:p-16 relative z-10">
                {/* Mobile / Tablet Header (Hidden on lg+) */}
                <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                            <Store className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-base font-black tracking-tight uppercase text-slate-900 block">
                                Liberty Kollection
                            </span>
                            <span className="text-[11px] tracking-wider text-slate-500 uppercase font-semibold">
                                Point of Sale
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Ready
                    </div>
                </div>

                {/* Form Wrapper Container */}
                <div className="my-auto max-w-md w-full mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Title Header */}
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-primary uppercase mb-2">
                                <KeyRound className="w-3.5 h-3.5" />
                                Secure Authentication
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
                                Sign In to Terminal
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600">
                                Enter your credentials to access inventory, sales, and accounts.
                            </p>
                        </div>

                        {/* Error Notification */}
                        <AnimatePresence mode="wait">
                            {loginError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                    className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-sm">Authentication Failed</div>
                                        <div className="text-xs mt-0.5 text-red-600">{loginError}</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Username Field */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Username or Staff ID
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        id="login-username"
                                        required
                                        autoFocus
                                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-base shadow-sm"
                                        placeholder="e.g. admin"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Password
                                    </label>
                                    {capsLockActive && (
                                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1 animate-pulse">
                                            Caps Lock ON
                                        </span>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="login-password"
                                        required
                                        onKeyUp={handleKeyUp}
                                        className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-base shadow-sm"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Checkbox */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-primary border-slate-300 focus:ring-primary cursor-pointer accent-primary"
                                    />
                                    <span className="text-xs font-medium text-slate-600">
                                        Keep terminal session active
                                    </span>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                id="login-submit-button"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 group cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In to Terminal</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Security Disclaimer */}
                        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <span>Encrypted Session • POS Node</span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">Liberty POS</span>
                        </div>
                    </motion.div>
                </div>

                {/* Footer copyright */}
                <div className="mt-8 pt-4 text-center lg:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                    <p>© 2026 Liberty Kollection. All rights reserved.</p>
                    <p className="text-xs font-medium text-slate-500">
                        Developed By : <span className="text-slate-800 font-bold tracking-wide">RAPIDTECHPRO</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
