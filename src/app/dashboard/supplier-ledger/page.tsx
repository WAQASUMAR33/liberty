"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    BookOpen,
    Search,
    Building2,
    Printer,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Filter,
    X,
    ChevronDown,
    Phone,
    CreditCard,
    DollarSign,
    CheckCircle2,
    PlusCircle,
    Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";

export default function SupplierLedgerPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-foreground/40 font-bold">Loading supplier ledger...</div>}>
            <SupplierLedgerContent />
        </Suspense>
    );
}

function SupplierLedgerContent() {
    const searchParams = useSearchParams();
    const initialSupplierId = searchParams.get("supplierId") || "";

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupplierId);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Payment modal state
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
    const [paymentRemarks, setPaymentRemarks] = useState("");
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const supplierContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/suppliers")
            .then((res) => res.json())
            .then((data) => {
                const list = Array.isArray(data) ? data : [];
                setSuppliers(list);
                if (initialSupplierId) {
                    const match = list.find((s) => s.id === initialSupplierId);
                    if (match) {
                        setSelectedSupplierId(match.id);
                        setSupplierSearch(match.name);
                    }
                }
            });
    }, [initialSupplierId]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                supplierContainerRef.current &&
                !supplierContainerRef.current.contains(e.target as Node)
            ) {
                setShowSupplierDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchLedger = async (id: string) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/supplier-ledger?supplierId=${id}`);
            const data = await res.json();
            setLedger(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSupplierId) {
            fetchLedger(selectedSupplierId);
        } else {
            setLedger([]);
        }
    }, [selectedSupplierId]);

    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

    const filteredSuppliers = suppliers.filter((s) => {
        const query = supplierSearch.toLowerCase().trim();
        if (!query) return true;
        return (
            s.name.toLowerCase().includes(query) ||
            (s.companyName && s.companyName.toLowerCase().includes(query)) ||
            s.contact.toLowerCase().includes(query)
        );
    });

    const handleSelectSupplier = (supplier: any) => {
        setSelectedSupplierId(supplier.id);
        setSupplierSearch(supplier.name);
        setShowSupplierDropdown(false);
    };

    const handleClearSupplier = () => {
        setSelectedSupplierId("");
        setSupplierSearch("");
        setLedger([]);
        setShowSupplierDropdown(false);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplierId) return;

        const amt = Number(paymentAmount);
        if (!amt || amt <= 0) {
            alert("Please enter a valid payment amount");
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const res = await fetch("/api/supplier-payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplierId: selectedSupplierId,
                    amount: amt,
                    date: paymentDate,
                    method: paymentMethod,
                    remarks: paymentRemarks,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to process payment");
            }

            setFeedback({
                type: "success",
                message: `Payment of ${formatCurrency(amt)} to "${selectedSupplier?.name}" recorded.`,
            });

            setIsPaymentModalOpen(false);
            setPaymentAmount("");
            setPaymentRemarks("");

            // Refresh ledger & supplier
            fetchLedger(selectedSupplierId);
            fetch("/api/suppliers")
                .then((r) => r.json())
                .then((d) => setSuppliers(Array.isArray(d) ? d : []));
        } catch (err: any) {
            alert(err.message || "Failed to save payment");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const printLedger = () => {
        if (!selectedSupplier || ledger.length === 0) return;

        const printWindow = window.open("", "_blank", "width=850,height=1100");
        if (!printWindow) return;

        const ledgerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Supplier Ledger - ${selectedSupplier.name}</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    body { font-family: Arial, sans-serif; font-size: 11px; color: black; margin: 0; padding: 20px; background: white; }
                    .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #000; padding-bottom: 12px; }
                    .header h1 { font-size: 26px; margin: 0 0 5px 0; font-weight: bold; }
                    .header p { margin: 0; font-size: 13px; color: #555; }
                    .supplier-info { background: #f8f8f8; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; }
                    .supplier-info h2 { margin: 0 0 8px 0; font-size: 18px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                    .info-row { display: flex; justify-content: space-between; }
                    .info-row .label { font-weight: 600; color: #555; }
                    .info-row .value { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    thead { background: #f0f0f0; }
                    th { padding: 10px 8px; text-align: left; font-weight: bold; font-size: 11px; border: 1px solid #000; }
                    td { padding: 8px 8px; border: 1px solid #000; font-size: 11px; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .debit { color: #059669; font-weight: bold; }
                    .credit { color: #dc2626; font-weight: bold; }
                    .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #000; text-align: center; font-size: 10px; color: #777; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SUPPLIER LEDGER STATEMENT</h1>
                    <p>Liberty Kollection • Chapai wali gali, Committee Bazar, Mandi Bahauddin</p>
                </div>

                <div class="supplier-info">
                    <h2>${selectedSupplier.name} ${selectedSupplier.companyName ? `(${selectedSupplier.companyName})` : ""}</h2>
                    <div class="info-grid">
                        <div class="info-row">
                            <span class="label">Contact Phone:</span>
                            <span class="value">${selectedSupplier.contact || "N/A"}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Current Payable Balance:</span>
                            <span class="value ${Number(selectedSupplier.balance) > 0 ? "credit" : "debit"}">
                                RS ${Number(selectedSupplier.balance).toFixed(2)}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="label">Address:</span>
                            <span class="value">${selectedSupplier.address || "N/A"}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Statement Date:</span>
                            <span class="value">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 12%;">Date</th>
                            <th style="width: 44%;">Description / Ref</th>
                            <th style="width: 14%;" class="text-right">Debit (Paid)</th>
                            <th style="width: 14%;" class="text-right">Credit (Billed)</th>
                            <th style="width: 16%;" class="text-right">Running Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ledger
                            .map(
                                (entry: any) => `
                            <tr>
                                <td>${new Date(entry.date).toLocaleDateString()}</td>
                                <td>${entry.description}</td>
                                <td class="text-right debit">${Number(entry.debit) > 0 ? "RS " + Number(entry.debit).toFixed(2) : "—"}</td>
                                <td class="text-right credit">${Number(entry.credit) > 0 ? "RS " + Number(entry.credit).toFixed(2) : "—"}</td>
                                <td class="text-right font-bold">
                                    RS ${Number(entry.balance).toFixed(2)}
                                </td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>

                <div class="footer">
                    <p>This is a computer-generated supplier ledger statement from Liberty POS</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() { window.close(); };
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(ledgerHTML);
        printWindow.document.close();
    };

    const totalPaid = ledger.reduce((sum, e) => sum + Number(e.debit || 0), 0);
    const totalBilled = ledger.reduce((sum, e) => sum + Number(e.credit || 0), 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Supplier Ledger
                    </h2>
                    <p className="text-foreground/60 text-sm mt-0.5">
                        Audit supplier purchasing, payments, and payable statements.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedSupplierId && (
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Wallet className="w-4 h-4" />
                            <span>Record Payment</span>
                        </button>
                    )}
                    <button
                        onClick={printLedger}
                        disabled={!selectedSupplierId || ledger.length === 0}
                        className="px-5 py-2.5 glass border border-black/10 text-foreground font-bold text-xs flex items-center gap-2 hover:bg-black/5 transition-all disabled:opacity-40 shadow-xs cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print Statement</span>
                    </button>
                </div>
            </div>

            {/* Notification Feedback */}
            <AnimatePresence>
                {feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "p-4 border flex items-center justify-between shadow-xs",
                            feedback.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800"
                                : "bg-red-500/10 border-red-500/30 text-red-800"
                        )}
                    >
                        <div className="flex items-center gap-2.5 font-medium text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{feedback.message}</span>
                        </div>
                        <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100 p-1 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filterable Supplier Selector */}
            <div className="flex flex-col sm:flex-row gap-4 no-print" ref={supplierContainerRef}>
                <div className="relative flex-1 max-w-xl">
                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] block mb-1 pl-0.5">
                        Filter & Select Supplier
                    </label>

                    <div className="relative flex items-center">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Type supplier name, company, or contact phone..."
                            className="w-full pl-11 pr-20 py-3.5 glass border border-black/10 focus:outline-none focus:border-primary font-bold text-sm bg-white text-foreground placeholder:text-foreground/40 shadow-xs"
                            value={supplierSearch}
                            onChange={(e) => {
                                setSupplierSearch(e.target.value);
                                setShowSupplierDropdown(true);
                            }}
                            onFocus={() => setShowSupplierDropdown(true)}
                        />

                        <div className="absolute right-3 flex items-center gap-1.5">
                            {supplierSearch && (
                                <button
                                    onClick={handleClearSupplier}
                                    className="p-1 text-foreground/40 hover:text-foreground cursor-pointer"
                                    title="Clear supplier"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                                className="p-1 text-foreground/40 hover:text-foreground cursor-pointer"
                            >
                                <ChevronDown className={cn("w-4 h-4 transition-transform", showSupplierDropdown && "rotate-180")} />
                            </button>
                        </div>
                    </div>

                    {/* Popover Dropdown */}
                    <AnimatePresence>
                        {showSupplierDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-40 left-0 right-0 top-full mt-1.5 bg-white border border-black/10 shadow-2xl max-h-72 overflow-y-auto divide-y divide-black/5 custom-scrollbar"
                            >
                                {filteredSuppliers.length === 0 ? (
                                    <div className="p-5 text-center text-xs text-foreground/40 font-medium">
                                        No supplier found matching "{supplierSearch}"
                                    </div>
                                ) : (
                                    filteredSuppliers.map((s) => {
                                        const isSelected = s.id === selectedSupplierId;
                                        const hasPayable = Number(s.balance) > 0;
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSelectSupplier(s)}
                                                className={cn(
                                                    "p-3.5 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group",
                                                    isSelected && "bg-primary/10 font-bold"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                            {s.name}
                                                        </p>
                                                        <p className="text-xs text-foreground/40 truncate">
                                                            {s.companyName ? `${s.companyName} • ` : ""}{s.contact}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 ml-3">
                                                    <span
                                                        className={cn(
                                                            "text-xs font-black px-2.5 py-1 inline-block",
                                                            hasPayable
                                                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        )}
                                                    >
                                                        {formatCurrency(s.balance || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Selected Supplier Ledger Content */}
            {selectedSupplierId ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="p-6 glass border border-black/5 bg-white shadow-xs">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1">
                                Supplier Profile
                            </p>
                            <h3 className="text-lg font-black text-foreground">{selectedSupplier?.name}</h3>
                            {selectedSupplier?.companyName && (
                                <p className="text-xs text-primary font-bold">{selectedSupplier.companyName}</p>
                            )}
                            <p className="text-xs text-foreground/60 mt-1">{selectedSupplier?.contact}</p>
                        </div>

                        <div className="p-6 glass border border-red-500/15 bg-white shadow-xs">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">
                                Total Purchases (Credit)
                            </p>
                            <h3 className="text-2xl font-black text-red-600">{formatCurrency(totalBilled)}</h3>
                            <p className="text-[10px] text-red-600/60 mt-1 uppercase font-bold">Invoiced Stock</p>
                        </div>

                        <div className="p-6 glass border border-emerald-500/15 bg-white shadow-xs">
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                                Total Paid (Debit)
                            </p>
                            <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(totalPaid)}</h3>
                            <p className="text-[10px] text-emerald-600/60 mt-1 uppercase font-bold">Payments Cleared</p>
                        </div>

                        <div className="p-6 glass border border-blue-500/15 bg-white shadow-xs">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                                        Current Payable Balance
                                    </p>
                                    <h3 className="text-2xl font-black text-foreground">
                                        {formatCurrency(selectedSupplier?.balance || 0)}
                                    </h3>
                                    <p className="text-[10px] text-primary/70 mt-1 uppercase font-bold">
                                        Net Pending Payment
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                                    title="Pay Supplier"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Statement Table */}
                    <div className="glass border border-black/5 overflow-hidden shadow-xs bg-white">
                        <div className="p-6 border-b border-black/5 bg-black/[0.01] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-primary" />
                                <h3 className="font-bold uppercase tracking-widest text-xs text-foreground">
                                    Statement of Account
                                </h3>
                            </div>
                            <div className="text-[10px] font-black text-foreground/40 italic">
                                Generated on {new Date().toLocaleString()}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-black/5 bg-black/[0.01]">
                                        <th className="px-6 py-4 font-black text-foreground/40 uppercase tracking-widest">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 font-black text-foreground/40 uppercase tracking-widest">
                                            Description / Ref
                                        </th>
                                        <th className="px-6 py-4 font-black text-foreground/40 uppercase tracking-widest text-right">
                                            Debit (Paid)
                                        </th>
                                        <th className="px-6 py-4 font-black text-foreground/40 uppercase tracking-widest text-right">
                                            Credit (Purchased)
                                        </th>
                                        <th className="px-6 py-4 font-black text-foreground/40 uppercase tracking-widest text-right">
                                            Running Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-foreground/40 italic">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-none animate-spin" />
                                                    <span>Loading supplier ledger...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : ledger.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-foreground/40">
                                                No ledger transactions found for this supplier.
                                            </td>
                                        </tr>
                                    ) : (
                                        ledger.map((entry: any) => (
                                            <tr key={entry.id} className="hover:bg-black/[0.01] transition-colors">
                                                <td className="px-6 py-4 text-foreground/60 font-medium">
                                                    {new Date(entry.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-foreground">{entry.description}</p>
                                                    {entry.purchase && (
                                                        <span className="text-[10px] text-primary uppercase font-bold mt-0.5 block">
                                                            Invoice: {entry.purchase.invoiceNumber}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {Number(entry.debit) > 0 ? (
                                                        <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold">
                                                            <span>{formatCurrency(entry.debit)}</span>
                                                            <ArrowDownLeft className="w-3 h-3" />
                                                        </div>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {Number(entry.credit) > 0 ? (
                                                        <div className="flex items-center justify-end gap-1.5 text-red-600 font-bold">
                                                            <span>{formatCurrency(entry.credit)}</span>
                                                            <ArrowUpRight className="w-3 h-3" />
                                                        </div>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-black text-foreground px-3 py-1 bg-black/5 border border-black/5">
                                                        {formatCurrency(entry.balance)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-black/10 bg-black/[0.01] text-foreground/40">
                    <BookOpen className="w-14 h-14 mb-4 stroke-[1.5]" />
                    <p className="text-base font-bold">Select a supplier above to view their financial statement & transaction history.</p>
                </div>
            )}

            {/* Record Supplier Payment Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative w-full max-w-md glass border border-black/5 p-6 md:p-8 shadow-2xl bg-white space-y-4"
                        >
                            <div className="flex justify-between items-center border-b border-black/5 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-600">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">Record Supplier Payment</h3>
                                        <p className="text-xs text-foreground/50">{selectedSupplier?.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-foreground/40 hover:text-foreground cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-3 bg-red-500/5 border border-red-500/10 flex justify-between items-center text-xs">
                                <span className="font-medium text-foreground/60">Current Outstanding Payable:</span>
                                <span className="font-black text-red-600">{formatCurrency(selectedSupplier?.balance || 0)}</span>
                            </div>

                            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                                <div>
                                    <label className="font-bold text-foreground/70 block mb-1">
                                        Payment Amount (RS) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Enter amount to pay..."
                                        className="w-full px-3 py-2.5 text-sm font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-bold text-foreground/70 block mb-1">
                                            Payment Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-foreground/70 block mb-1">
                                            Payment Method
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="BANK">Bank Transfer</option>
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="ONLINE">Online</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-foreground/70 block mb-1">
                                        Payment Remarks / Note
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. Paid via Meezan Bank Cheque #4421..."
                                        className="w-full px-3 py-2 font-bold border border-black/10 focus:outline-none focus:border-primary bg-white text-foreground"
                                        value={paymentRemarks}
                                        onChange={(e) => setPaymentRemarks(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsPaymentModalOpen(false)}
                                        className="px-4 py-2 bg-black/5 hover:bg-black/10 font-bold text-foreground/70 transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingPayment}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isSubmittingPayment ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-none animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Confirm Payment</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
