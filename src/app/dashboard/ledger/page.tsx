"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import {
    BookOpen,
    Search,
    User,
    Printer,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Filter,
    X,
    ChevronDown,
    ChevronUp,
    Phone,
    CreditCard,
    CheckCircle2,
    Clock,
    Tag,
    Download,
    Eye,
    RotateCcw,
    Layers,
    FileText,
    Sparkles,
    SlidersHorizontal,
    Building2,
    MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function LedgerPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-none animate-spin" />
                <p className="text-sm font-semibold text-foreground/50">Loading Customer Ledger...</p>
            </div>
        }>
            <LedgerContent />
        </Suspense>
    );
}

function LedgerContent() {
    const searchParams = useSearchParams();
    const queryCustomerId = searchParams.get("customerId");
    const querySearch = searchParams.get("search");

    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState(queryCustomerId || "");
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [ledger, setLedger] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Sorting & Filtering
    const [sortBy, setSortBy] = useState<"createdAt" | "date">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterType, setFilterType] = useState<"ALL" | "SALE" | "PAYMENT" | "RETURN">("ALL");
    const [tableSearch, setTableSearch] = useState("");
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const customerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/customers")
            .then((res) => res.json())
            .then((data) => {
                const list = Array.isArray(data) ? data : [];
                setCustomers(list);

                // Auto-select if specified in query or if querySearch matches
                if (queryCustomerId) {
                    const match = list.find((c: any) => c.id === queryCustomerId);
                    if (match) {
                        setSelectedCustomerId(match.id);
                        setCustomerSearch(match.name);
                    }
                } else if (querySearch) {
                    const match = list.find((c: any) => c.name.toLowerCase().includes(querySearch.toLowerCase()));
                    if (match) {
                        setSelectedCustomerId(match.id);
                        setCustomerSearch(match.name);
                    }
                }
            })
            .catch(console.error);
    }, [queryCustomerId, querySearch]);

    // Close customer dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                customerContainerRef.current &&
                !customerContainerRef.current.contains(e.target as Node)
            ) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchLedger = async (id: string, sort: "createdAt" | "date", order: "asc" | "desc") => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/ledger?customerId=${id}&sortBy=${sort}&sortOrder=${order}`);
            const data = await res.json();
            setLedger(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load ledger:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCustomerId) {
            fetchLedger(selectedCustomerId, sortBy, sortOrder);
        } else {
            setLedger([]);
        }
    }, [selectedCustomerId, sortBy, sortOrder]);

    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

    const filteredCustomers = useMemo(() => {
        const query = customerSearch.toLowerCase().trim();
        if (!query) return customers;
        return customers.filter((c) =>
            c.name.toLowerCase().includes(query) ||
            (c.contact && c.contact.toLowerCase().includes(query)) ||
            (c.cnic && c.cnic.toLowerCase().includes(query)) ||
            (c.address && c.address.toLowerCase().includes(query))
        );
    }, [customers, customerSearch]);

    const handleSelectCustomer = (customer: any) => {
        setSelectedCustomerId(customer.id);
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
    };

    const handleClearCustomer = () => {
        setSelectedCustomerId("");
        setCustomerSearch("");
        setLedger([]);
        setShowCustomerDropdown(false);
    };

    // Filter ledger entries on client side for date range, search text, and type
    const processedLedger = useMemo(() => {
        return ledger.filter((entry: any) => {
            // Type filter
            if (filterType === "SALE" && !entry.saleId) return false;
            if (filterType === "RETURN" && !entry.saleReturnId) return false;
            if (filterType === "PAYMENT" && !entry.paymentId && !entry.description.toLowerCase().includes("payment")) return false;

            // Date filter (based on active sort mode or invoice date)
            const targetDateStr = sortBy === "createdAt" ? entry.createdAt : entry.date;
            const targetDate = new Date(targetDateStr);

            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (targetDate < sDate) return false;
            }

            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (targetDate > eDate) return false;
            }

            // Text search
            if (tableSearch.trim()) {
                const q = tableSearch.toLowerCase().trim();
                const desc = (entry.description || "").toLowerCase();
                const saleRef = (entry.sale?.billNumber || "").toLowerCase();
                const retRef = (entry.saleReturn?.returnNumber || "").toLowerCase();
                const deb = String(entry.debit || "");
                const cred = String(entry.credit || "");

                if (!desc.includes(q) && !saleRef.includes(q) && !retRef.includes(q) && !deb.includes(q) && !cred.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [ledger, filterType, startDate, endDate, tableSearch, sortBy]);

    // Financial calculations
    const totalCredits = useMemo(() => {
        return processedLedger.reduce((sum, e) => sum + Number(e.credit || 0), 0);
    }, [processedLedger]);

    const totalDebits = useMemo(() => {
        return processedLedger.reduce((sum, e) => sum + Number(e.debit || 0), 0);
    }, [processedLedger]);

    const printLedger = () => {
        if (!selectedCustomer || processedLedger.length === 0) return;

        const printWindow = window.open("", "_blank", "width=900,height=1000");
        if (!printWindow) return;

        const ledgerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Customer Ledger - ${selectedCustomer.name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        font-size: 11px;
                        line-height: 1.4;
                        color: #111;
                        margin: 0;
                        padding: 15px;
                        background: white;
                        -webkit-print-color-adjust: exact;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #000;
                        padding-bottom: 12px;
                        margin-bottom: 16px;
                    }
                    .header-left h1 {
                        font-size: 24px;
                        margin: 0 0 2px 0;
                        font-weight: 900;
                        letter-spacing: 0.5px;
                    }
                    .header-left p {
                        margin: 2px 0;
                        font-size: 11px;
                        color: #444;
                        font-weight: 500;
                    }
                    .header-right {
                        text-align: right;
                    }
                    .header-right h2 {
                        font-size: 18px;
                        margin: 0;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .header-right p {
                        margin: 3px 0 0 0;
                        font-size: 10px;
                        color: #555;
                    }
                    .customer-box {
                        background: #f8fafc;
                        border: 1px solid #cbd5e1;
                        padding: 12px 16px;
                        margin-bottom: 16px;
                        display: grid;
                        grid-template-columns: 2fr 1.5fr;
                        gap: 15px;
                    }
                    .customer-box h3 {
                        margin: 0 0 6px 0;
                        font-size: 15px;
                        font-weight: 900;
                        color: #0f172a;
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 3px;
                        font-size: 11px;
                    }
                    .info-label {
                        width: 110px;
                        color: #64748b;
                        font-weight: 600;
                    }
                    .info-value {
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .summary-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 16px;
                    }
                    .summary-card {
                        border: 1px solid #e2e8f0;
                        padding: 8px 12px;
                        background: #fff;
                    }
                    .summary-card.accent {
                        border-color: #0f172a;
                        background: #f1f5f9;
                    }
                    .summary-card .label {
                        font-size: 9px;
                        text-transform: uppercase;
                        font-weight: 800;
                        letter-spacing: 0.5px;
                        color: #64748b;
                        margin-bottom: 2px;
                    }
                    .summary-card .val {
                        font-size: 15px;
                        font-weight: 900;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    th {
                        background: #e2e8f0 !important;
                        color: #0f172a;
                        padding: 7px 8px;
                        font-size: 9.5px;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border: 1px solid #cbd5e1;
                        text-align: left;
                    }
                    td {
                        padding: 6px 8px;
                        border: 1px solid #e2e8f0;
                        font-size: 10.5px;
                    }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .debit { color: #047857; font-weight: 800; }
                    .credit { color: #b91c1c; font-weight: 800; }
                    .bal-badge { font-weight: 900; }
                    .footer-note {
                        margin-top: 30px;
                        display: flex;
                        justify-content: space-between;
                        padding-top: 15px;
                        border-top: 1px solid #cbd5e1;
                        font-size: 10px;
                        color: #64748b;
                    }
                    .signature-box {
                        text-align: center;
                        margin-top: 40px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .sig-line {
                        width: 180px;
                        border-top: 1px solid #000;
                        padding-top: 4px;
                        font-size: 10px;
                        font-weight: 700;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <h1>Liberty Kollection</h1>
                        <p>Chapai wali gali, Committee Bazar, Mandi Bahauddin</p>
                        <p>Phone: 0345 5754717 | 0546-506717</p>
                    </div>
                    <div class="header-right">
                        <h2>Account Statement</h2>
                        <p>Statement Date: <strong>${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
                        <p>Audit Sequence: <strong>Chronological (Created Date)</strong></p>
                    </div>
                </div>

                <div class="customer-box">
                    <div>
                        <h3>${selectedCustomer.name}</h3>
                        <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${selectedCustomer.contact || "N/A"}</span></div>
                        <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${selectedCustomer.address || "N/A"}</span></div>
                        ${selectedCustomer.cnic ? `<div class="info-row"><span class="info-label">CNIC:</span><span class="info-value">${selectedCustomer.cnic}</span></div>` : ''}
                    </div>
                    <div>
                        <div class="info-row"><span class="info-label">Total Transactions:</span><span class="info-value">${processedLedger.length}</span></div>
                        <div class="info-row"><span class="info-label">Closing Balance:</span><span class="info-value" style="color: #b91c1c; font-size: 13px;">RS ${Number(selectedCustomer.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div class="info-row"><span class="info-label">Account Status:</span><span class="info-value">${Number(selectedCustomer.balance) > 0 ? 'PAYABLE OUTSTANDING' : 'SETTLED'}</span></div>
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="label">Total Invoiced / Due (Credit)</div>
                        <div class="val" style="color: #b91c1c;">RS ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">Total Received / Paid (Debit)</div>
                        <div class="val" style="color: #047857;">RS ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div class="summary-card accent">
                        <div class="label">Current Outstanding Balance</div>
                        <div class="val">RS ${Number(selectedCustomer.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 4%;" class="text-center">Sr</th>
                            <th style="width: 17%;">Created Date (Entry)</th>
                            <th style="width: 13%;">Invoice Date</th>
                            <th>Description / Reference</th>
                            <th style="width: 14%;" class="text-right">Debit (Paid)</th>
                            <th style="width: 14%;" class="text-right">Credit (Due)</th>
                            <th style="width: 15%;" class="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processedLedger.map((entry: any, idx: number) => {
                            const createdDate = new Date(entry.createdAt);
                            const formattedCreated = createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                            const invoiceDate = new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            return `
                                <tr>
                                    <td class="text-center" style="font-weight: 700; color: #64748b;">${idx + 1}</td>
                                    <td><strong>${formattedCreated}</strong></td>
                                    <td>${invoiceDate}</td>
                                    <td>
                                        <strong>${entry.description}</strong>
                                        ${entry.sale ? `<div style="font-size: 9px; color: #475569;">Ref: ${entry.sale.billNumber}</div>` : ''}
                                        ${entry.saleReturn ? `<div style="font-size: 9px; color: #b91c1c;">Return Ref: ${entry.saleReturn.returnNumber}</div>` : ''}
                                    </td>
                                    <td class="text-right debit">${Number(entry.debit) > 0 ? 'RS ' + Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}</td>
                                    <td class="text-right credit">${Number(entry.credit) > 0 ? 'RS ' + Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}</td>
                                    <td class="text-right bal-badge">RS ${Number(entry.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #000;">
                            <td colspan="4" class="text-right" style="text-transform: uppercase; font-size: 11px;">Total Statement Summary:</td>
                            <td class="text-right debit">RS ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td class="text-right credit">RS ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td class="text-right" style="font-size: 12px; color: #000;">RS ${Number(selectedCustomer.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="signature-box">
                    <div class="sig-line">Prepared By</div>
                    <div class="sig-line">Customer Signature</div>
                    <div class="sig-line">Authorized Signatory</div>
                </div>

                <div class="footer-note">
                    <span>Generated from Liberty POS & Inventory Management System</span>
                    <span>Powered by RapidTechPro</span>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(ledgerHTML);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            {/* Top Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-none bg-primary/10 text-primary flex items-center justify-center">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                                Customer Ledger
                            </h2>
                            <p className="text-foreground/60 text-xs mt-0.5 font-medium">
                                Real-time transaction audit, entry timestamps, invoice dates & verified running balances
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Quick Deplux Shortcut Chip */}
                    <button
                        onClick={() => {
                            const deplux = customers.find(c => c.name.toLowerCase().includes("deplux"));
                            if (deplux) handleSelectCustomer(deplux);
                            else setCustomerSearch("Deplux");
                        }}
                        className="px-3.5 py-2 text-xs font-bold rounded-none bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Quick View Deplux (Phalia Road) ledger"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Deplux (Phalia Road)</span>
                    </button>

                    <button
                        onClick={printLedger}
                        disabled={!selectedCustomerId || processedLedger.length === 0}
                        className="px-5 py-2.5 rounded-none bg-black text-white hover:bg-black/80 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 shadow-xs cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print Statement</span>
                    </button>
                </div>
            </div>

            {/* Customer Search & Selector Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-8 relative" ref={customerContainerRef}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search customer by name, contact, CNIC or address..."
                            className="w-full pl-11 pr-24 py-3 rounded-none bg-white border border-black/10 focus:outline-none focus:border-primary font-bold text-sm text-foreground placeholder:text-foreground/40 shadow-xs transition-colors"
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setShowCustomerDropdown(true);
                            }}
                            onFocus={() => setShowCustomerDropdown(true)}
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {customerSearch && (
                                <button
                                    onClick={handleClearCustomer}
                                    className="p-1 text-foreground/40 hover:text-foreground cursor-pointer rounded-none hover:bg-black/5"
                                    title="Clear"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                                className="p-1 text-foreground/40 hover:text-foreground cursor-pointer"
                            >
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showCustomerDropdown && "rotate-180")} />
                            </button>
                        </div>
                    </div>

                    {/* Customer Dropdown Popover */}
                    <AnimatePresence>
                        {showCustomerDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-black/10 shadow-2xl max-h-80 overflow-y-auto divide-y divide-black/5 custom-scrollbar"
                            >
                                {filteredCustomers.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-foreground/40 font-medium">
                                        No customer found matching "{customerSearch}"
                                    </div>
                                ) : (
                                    filteredCustomers.map((c) => {
                                        const isSelected = c.id === selectedCustomerId;
                                        const bal = Number(c.balance || 0);
                                        return (
                                            <div
                                                key={c.id}
                                                onClick={() => handleSelectCustomer(c)}
                                                className={cn(
                                                    "p-3.5 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors group",
                                                    isSelected && "bg-primary/10 font-bold"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-none bg-black/5 text-foreground flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                                        {c.name?.[0]?.toUpperCase() || "C"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                            {c.name}
                                                        </p>
                                                        <p className="text-xs text-foreground/40 truncate">
                                                            {c.contact && c.contact !== "-" ? c.contact : "No contact"} {c.address ? `• ${c.address}` : ""}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0 ml-3">
                                                    <span
                                                        className={cn(
                                                            "text-xs font-black px-2.5 py-1 inline-block",
                                                            bal > 0
                                                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                        )}
                                                    >
                                                        {formatCurrency(bal)}
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

                {/* Quick Shortcuts */}
                <div className="lg:col-span-4 flex items-center justify-start lg:justify-end gap-2 text-xs text-foreground/50 font-medium overflow-x-auto py-1">
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-foreground/40">Quick Accounts:</span>
                    {customers.slice(0, 3).map((c) => (
                        <button
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className={cn(
                                "px-2.5 py-1 rounded-none border text-xs font-bold transition-all shrink-0 cursor-pointer",
                                c.id === selectedCustomerId
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white hover:bg-black/5 border-black/10 text-foreground/70"
                            )}
                        >
                            {c.name.split(" ")[0]}
                        </button>
                    ))}
                </div>
            </div>

            {selectedCustomer ? (
                <div className="space-y-6">
                    {/* Customer Profile Banner */}
                    <div className="bg-white border border-black/10 p-6 shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-none bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-2xl shrink-0">
                                    {selectedCustomer.name?.[0]?.toUpperCase() || "C"}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">
                                            {selectedCustomer.name}
                                        </h3>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-none tracking-widest",
                                            Number(selectedCustomer.balance) > 0
                                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                        )}>
                                            {Number(selectedCustomer.balance) > 0 ? "Debit Account / Outstanding" : "Settled Account"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-foreground/60 flex-wrap font-medium pt-0.5">
                                        {selectedCustomer.contact && selectedCustomer.contact !== "-" && (
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-foreground/40" />
                                                {selectedCustomer.contact}
                                            </span>
                                        )}
                                        {selectedCustomer.address && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-foreground/40" />
                                                {selectedCustomer.address}
                                            </span>
                                        )}
                                        {selectedCustomer.cnic && (
                                            <span className="flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5 text-foreground/40" />
                                                CNIC: {selectedCustomer.cnic}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleClearCustomer}
                                    className="px-3 py-2 text-xs font-bold text-foreground/50 hover:text-foreground border border-black/10 hover:bg-black/5 rounded-none transition-all cursor-pointer"
                                >
                                    Switch Customer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4 Financial Stat KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Net Current Balance */}
                        <div className="p-5 bg-white border border-black/10 shadow-xs relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                                    Current Net Balance
                                </span>
                                <div className={cn(
                                    "w-7 h-7 rounded-none flex items-center justify-center",
                                    Number(selectedCustomer.balance) > 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                                )}>
                                    <CreditCard className="w-4 h-4" />
                                </div>
                            </div>
                            <h4 className={cn(
                                "text-2xl lg:text-3xl font-black tracking-tight",
                                Number(selectedCustomer.balance) > 0 ? "text-red-600" : "text-emerald-600"
                            )}>
                                {formatCurrency(selectedCustomer.balance || 0)}
                            </h4>
                            <p className="text-[10px] font-bold text-foreground/40 uppercase mt-1">
                                {Number(selectedCustomer.balance) > 0 ? "Payable to shop" : "Cleared / No pending balance"}
                            </p>
                        </div>

                        {/* Total Invoiced (Credit) */}
                        <div className="p-5 bg-white border border-black/10 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                    Total Credit (Sales Due)
                                </span>
                                <div className="w-7 h-7 rounded-none bg-red-500/10 text-red-600 flex items-center justify-center">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>
                            <h4 className="text-2xl lg:text-3xl font-black text-red-600 tracking-tight">
                                {formatCurrency(totalCredits)}
                            </h4>
                            <p className="text-[10px] font-bold text-red-600/60 uppercase mt-1">
                                Cumulative credit charges
                            </p>
                        </div>

                        {/* Total Paid (Debit) */}
                        <div className="p-5 bg-white border border-black/10 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    Total Debit (Received)
                                </span>
                                <div className="w-7 h-7 rounded-none bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                    <ArrowDownLeft className="w-4 h-4" />
                                </div>
                            </div>
                            <h4 className="text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight">
                                {formatCurrency(totalDebits)}
                            </h4>
                            <p className="text-[10px] font-bold text-emerald-600/60 uppercase mt-1">
                                Cash paid & returns credited
                            </p>
                        </div>

                        {/* Total Records Count */}
                        <div className="p-5 bg-white border border-black/10 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                    Total Transactions
                                </span>
                                <div className="w-7 h-7 rounded-none bg-primary/10 text-primary flex items-center justify-center">
                                    <Layers className="w-4 h-4" />
                                </div>
                            </div>
                            <h4 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
                                {processedLedger.length} <span className="text-sm font-semibold text-foreground/40">entries</span>
                            </h4>
                            <p className="text-[10px] font-bold text-foreground/40 uppercase mt-1">
                                {sortBy === "createdAt" ? "Sorted chronologically by entry date" : "Sorted by document invoice date"}
                            </p>
                        </div>
                    </div>

                    {/* Filter & Sort Control Toolbar */}
                    <div className="bg-white border border-black/10 p-5 shadow-xs space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Sort Mode Controls (Created Date vs Invoice Date) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40 flex items-center gap-1.5 mr-1">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    Sort Sequence:
                                </span>
                                <div className="inline-flex rounded-none p-0.5 bg-black/5 border border-black/5">
                                    <button
                                        onClick={() => setSortBy("createdAt")}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                                            sortBy === "createdAt"
                                                ? "bg-white text-black shadow-xs font-black"
                                                : "text-foreground/50 hover:text-foreground"
                                        )}
                                    >
                                        Created Date (Entry Order)
                                    </button>
                                    <button
                                        onClick={() => setSortBy("date")}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                                            sortBy === "date"
                                                ? "bg-white text-black shadow-xs font-black"
                                                : "text-foreground/50 hover:text-foreground"
                                        )}
                                    >
                                        Invoice Date (Doc Date)
                                    </button>
                                </div>

                                <button
                                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                    className="px-3 py-1.5 text-xs font-bold border border-black/10 bg-white hover:bg-black/5 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
                                    title="Toggle Sort Order"
                                >
                                    <span>{sortOrder === "asc" ? "Oldest First (Asc)" : "Newest First (Desc)"}</span>
                                    {sortOrder === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                            </div>

                            {/* Type Filter Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40 mr-1">
                                    Type:
                                </span>
                                {(["ALL", "SALE", "PAYMENT", "RETURN"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={cn(
                                            "px-2.5 py-1 text-xs font-bold border transition-all cursor-pointer",
                                            filterType === type
                                                ? "bg-black text-white border-black font-black"
                                                : "bg-white text-foreground/60 border-black/10 hover:bg-black/5"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search & Date Range Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-black/5 items-center">
                            {/* Search inside statement */}
                            <div className="lg:col-span-5 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40" />
                                <input
                                    type="text"
                                    placeholder="Filter by description, bill #, return # or amount..."
                                    className="w-full pl-9 pr-8 py-2 rounded-none bg-black/5 border border-black/5 text-xs font-bold text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50"
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                />
                                {tableSearch && (
                                    <button
                                        onClick={() => setTableSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Date range pickers */}
                            <div className="lg:col-span-3 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase shrink-0">From:</span>
                                <input
                                    type="date"
                                    className="w-full px-2.5 py-1.5 rounded-none bg-black/5 border border-black/5 text-xs font-bold text-foreground focus:outline-none focus:border-primary/50"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            <div className="lg:col-span-3 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase shrink-0">To:</span>
                                <input
                                    type="date"
                                    className="w-full px-2.5 py-1.5 rounded-none bg-black/5 border border-black/5 text-xs font-bold text-foreground focus:outline-none focus:border-primary/50"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>

                            {/* Reset button */}
                            <div className="lg:col-span-1 flex justify-end">
                                {(startDate || endDate || tableSearch || filterType !== "ALL") && (
                                    <button
                                        onClick={() => {
                                            setStartDate("");
                                            setEndDate("");
                                            setTableSearch("");
                                            setFilterType("ALL");
                                        }}
                                        className="p-2 text-foreground/50 hover:text-foreground hover:bg-black/5 rounded-none transition-all cursor-pointer"
                                        title="Reset filters"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Redesigned Ledger Transactions Statement Table */}
                    <div className="bg-white border border-black/10 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-black/5 bg-black/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <h3 className="font-black uppercase tracking-widest text-xs text-foreground">
                                    Statement of Account
                                </h3>
                                <span className="text-[10px] font-black px-2 py-0.5 bg-black/5 text-foreground/60 rounded-none">
                                    {processedLedger.length} Records
                                </span>
                            </div>
                            <div className="text-[11px] font-medium text-foreground/40 flex items-center gap-2">
                                <span>Sorted by: <strong className="text-foreground">{sortBy === "createdAt" ? "Created Date & Time" : "Invoice Document Date"}</strong></span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-black/10 bg-black/[0.02]">
                                        <th className="px-4 py-3.5 font-black text-foreground/50 uppercase tracking-widest text-[10px] w-12 text-center">
                                            Sr #
                                        </th>
                                        <th className="px-4 py-3.5 font-black text-primary uppercase tracking-widest text-[10px] min-w-[170px]">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>Created Date (Entry)</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3.5 font-black text-foreground/50 uppercase tracking-widest text-[10px] min-w-[120px]">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>Invoice Date</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3.5 font-black text-foreground/50 uppercase tracking-widest text-[10px]">
                                            Description & Reference
                                        </th>
                                        <th className="px-4 py-3.5 font-black text-emerald-600 uppercase tracking-widest text-[10px] text-right min-w-[130px]">
                                            Debit (Received)
                                        </th>
                                        <th className="px-4 py-3.5 font-black text-red-600 uppercase tracking-widest text-[10px] text-right min-w-[130px]">
                                            Credit (Invoiced)
                                        </th>
                                        <th className="px-4 py-3.5 font-black text-foreground uppercase tracking-widest text-[10px] text-right min-w-[140px]">
                                            Running Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-none animate-spin" />
                                                    <p className="text-xs font-bold text-foreground/50">Fetching ledger entries...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : processedLedger.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-20 text-center text-foreground/40 font-medium">
                                                No ledger transactions match the selected criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        processedLedger.map((entry: any, idx: number) => {
                                            const createdDate = new Date(entry.createdAt);
                                            const createdFormattedDate = createdDate.toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            });
                                            const createdFormattedTime = createdDate.toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: true
                                            });

                                            const invoiceFormattedDate = new Date(entry.date).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            });

                                            const isExpanded = expandedRowId === entry.id;
                                            const hasItems = entry.sale?.items?.length > 0 || entry.saleReturn?.items?.length > 0;
                                            const itemsList = entry.sale?.items || entry.saleReturn?.items || [];

                                            return (
                                                <div key={entry.id} className="contents">
                                                    <tr className={cn(
                                                        "hover:bg-primary/[0.02] transition-colors group",
                                                        isExpanded && "bg-primary/[0.04]"
                                                    )}>
                                                        {/* Sr # */}
                                                        <td className="px-4 py-3.5 text-center font-bold text-foreground/40 text-xs">
                                                            {idx + 1}
                                                        </td>

                                                        {/* Created Date (Entry Date & Time) */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="font-black text-foreground">
                                                                {createdFormattedDate}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-primary flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {createdFormattedTime}
                                                            </div>
                                                        </td>

                                                        {/* Invoice Date */}
                                                        <td className="px-4 py-3.5 font-bold text-foreground/70">
                                                            {invoiceFormattedDate}
                                                        </td>

                                                        {/* Description */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-bold text-foreground">
                                                                    {entry.description}
                                                                </p>
                                                                {entry.sale && (
                                                                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase tracking-wider">
                                                                        {entry.sale.billNumber}
                                                                    </span>
                                                                )}
                                                                {entry.saleReturn && (
                                                                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 uppercase tracking-wider">
                                                                        {entry.saleReturn.returnNumber}
                                                                    </span>
                                                                )}
                                                                {hasItems && (
                                                                    <button
                                                                        onClick={() => setExpandedRowId(isExpanded ? null : entry.id)}
                                                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                        <span>{itemsList.length} items</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Debit */}
                                                        <td className="px-4 py-3.5 text-right font-black text-emerald-600">
                                                            {Number(entry.debit) > 0 ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span>{formatCurrency(entry.debit)}</span>
                                                                    <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
                                                                </div>
                                                            ) : (
                                                                <span className="text-foreground/20 font-normal">—</span>
                                                            )}
                                                        </td>

                                                        {/* Credit */}
                                                        <td className="px-4 py-3.5 text-right font-black text-red-600">
                                                            {Number(entry.credit) > 0 ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span>{formatCurrency(entry.credit)}</span>
                                                                    <ArrowUpRight className="w-3 h-3 text-red-500" />
                                                                </div>
                                                            ) : (
                                                                <span className="text-foreground/20 font-normal">—</span>
                                                            )}
                                                        </td>

                                                        {/* Balance */}
                                                        <td className="px-4 py-3.5 text-right">
                                                            <span className="inline-block px-2.5 py-1 rounded-none font-black text-foreground bg-black/5 border border-black/5">
                                                                {formatCurrency(entry.balance)}
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Items Drawer Row */}
                                                    {isExpanded && hasItems && (
                                                        <tr className="bg-primary/[0.03] border-b border-black/10">
                                                            <td colSpan={7} className="px-6 py-4">
                                                                <div className="bg-white border border-primary/20 p-4 shadow-xs">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <p className="text-[11px] font-black uppercase text-primary tracking-wider">
                                                                            Itemized Breakdown ({itemsList.length} Products)
                                                                        </p>
                                                                        <button
                                                                            onClick={() => setExpandedRowId(null)}
                                                                            className="text-[10px] font-bold text-foreground/40 hover:text-foreground"
                                                                        >
                                                                            Close
                                                                        </button>
                                                                    </div>
                                                                    <div className="divide-y divide-black/5 text-xs">
                                                                        {itemsList.map((item: any, i: number) => (
                                                                            <div key={i} className="py-2 flex justify-between items-center font-medium">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-bold text-foreground/40">{i + 1}.</span>
                                                                                    <span className="font-bold text-foreground">{item.name || "Product"}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-4 text-xs">
                                                                                    <span className="text-foreground/60">{item.quantity} Qty × {formatCurrency(item.price)}</span>
                                                                                    {Number(item.discount || 0) > 0 && (
                                                                                        <span className="text-red-500 font-bold">Disc: -{formatCurrency(item.discount)}</span>
                                                                                    )}
                                                                                    <span className="font-black text-foreground">{formatCurrency(item.subtotal)}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </tbody>
                                {processedLedger.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-black bg-black/[0.03] font-black text-xs">
                                            <td colSpan={4} className="px-4 py-3.5 text-right uppercase tracking-wider text-foreground">
                                                Statement Totals:
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-emerald-600 font-black">
                                                {formatCurrency(totalDebits)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-red-600 font-black">
                                                {formatCurrency(totalCredits)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-black text-foreground">
                                                <span className="px-2.5 py-1 bg-black text-white rounded-none">
                                                    {formatCurrency(selectedCustomer.balance || 0)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty / Search Prompt State */
                <div className="flex flex-col items-center justify-center py-28 border border-dashed border-black/15 bg-white text-center p-6 space-y-4 shadow-xs">
                    <div className="w-16 h-16 rounded-none bg-primary/10 text-primary flex items-center justify-center">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                        <h3 className="text-xl font-black text-foreground tracking-tight">Select Customer Account</h3>
                        <p className="text-xs text-foreground/60 leading-relaxed font-medium">
                            Choose or search any customer above to inspect their audit trail, check entry timestamps, and print account statements.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => {
                                const deplux = customers.find(c => c.name.toLowerCase().includes("deplux"));
                                if (deplux) handleSelectCustomer(deplux);
                                else setCustomerSearch("Deplux");
                            }}
                            className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-none hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>View Deplux (Phalia Road) Ledger</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
