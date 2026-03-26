"use client";

import { Sidebar, MobileNav } from "@/components/Sidebar";
import { useEffect, useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetch("/api/auth/session")
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user);
                }
            });
    }, []);

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 bg-white/50">
                <header className="h-16 border-b border-black/5 glass flex items-center justify-between px-4 md:px-8 z-20">
                    <div className="flex items-center gap-3">
                        <MobileNav />
                        <h1 className="text-sm md:text-lg font-semibold text-foreground/80 lowercase tracking-widest">
                            / dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-bold">{user?.name || "Loading..."}</span>
                            <span className="text-[10px] text-foreground/40">{user?.role?.toLowerCase() || "..."}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full premium-gradient p-[1px]">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-black/5 flex items-center justify-center text-white font-bold text-sm">
                                    {user?.name?.[0]?.toUpperCase() || "?"}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
                    <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    <div className="relative z-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
