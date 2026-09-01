import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const purchases = await prisma.purchase.findMany({
            orderBy: { date: "desc" },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        return NextResponse.json(purchases);
    } catch (error) {
        console.error("Error fetching purchases:", error);
        return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const {
            supplierId,
            date,
            items,
            discount = 0,
            paidAmount = 0,
            notes,
            customInvoiceNumber,
        } = json;

        if (!supplierId) {
            return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "At least one product item is required for purchase" }, { status: 400 });
        }

        // Validate supplier
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
        });
        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        // Calculate totals
        let totalGross = 0;
        for (const item of items) {
            const qty = Number(item.quantity) || 0;
            const cost = Number(item.costPrice) || 0;
            if (qty <= 0) {
                return NextResponse.json({ error: `Quantity must be greater than 0 for product ${item.name || item.productId}` }, { status: 400 });
            }
            totalGross += qty * cost;
        }

        const disc = Math.max(0, Number(discount) || 0);
        const netTotal = Math.max(0, totalGross - disc);
        const paid = Math.max(0, Number(paidAmount) || 0);
        const unpaidBalance = Math.max(0, netTotal - paid);

        const result = await prisma.$transaction(async (tx: any) => {
            // Generate Invoice Number
            let invoiceNumber = customInvoiceNumber ? customInvoiceNumber.trim() : "";
            if (!invoiceNumber) {
                const count = await tx.purchase.count();
                invoiceNumber = `PUR-${String(count + 1).padStart(6, "0")}`;
            }

            // Create Purchase record
            const purchase = await tx.purchase.create({
                data: {
                    invoiceNumber,
                    date: date ? new Date(date) : new Date(),
                    supplierId,
                    total: totalGross,
                    discount: disc,
                    netTotal,
                    paidAmount: paid,
                    balance: unpaidBalance,
                    notes: notes ? notes.trim() : null,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            name: item.name || "",
                            quantity: Number(item.quantity),
                            costPrice: Number(item.costPrice),
                            retailPrice: item.retailPrice ? Number(item.retailPrice) : null,
                            subtotal: Number(item.quantity) * Number(item.costPrice),
                        })),
                    },
                },
                include: {
                    items: true,
                    supplier: true,
                },
            });

            // Update Product Stocks and Cost Prices
            for (const item of items) {
                const updateData: any = {
                    stock: { increment: Number(item.quantity) },
                    costPrice: Number(item.costPrice),
                };
                if (item.retailPrice && Number(item.retailPrice) > 0) {
                    updateData.retailPrice = Number(item.retailPrice);
                }

                await tx.product.update({
                    where: { id: item.productId },
                    data: updateData,
                });
            }

            // Supplier Ledger updates
            const currentBalance = Number(supplier.balance);
            const balanceAfterInvoice = currentBalance + netTotal;

            // 1. Credit entry for purchase invoice (increases payable)
            await tx.supplierLedger.create({
                data: {
                    supplierId,
                    purchaseId: purchase.id,
                    date: date ? new Date(date) : new Date(),
                    description: `Purchase Stock In #${invoiceNumber}`,
                    debit: 0,
                    credit: netTotal,
                    balance: balanceAfterInvoice,
                },
            });

            // 2. If immediate payment was made, add debit entry and payment record
            let finalBalance = balanceAfterInvoice;
            if (paid > 0) {
                finalBalance = balanceAfterInvoice - paid;

                const payment = await tx.supplierPayment.create({
                    data: {
                        supplierId,
                        amount: paid,
                        date: date ? new Date(date) : new Date(),
                        method: "CASH",
                        remarks: `Immediate payment on Purchase #${invoiceNumber}`,
                    },
                });

                await tx.supplierLedger.create({
                    data: {
                        supplierId,
                        purchaseId: purchase.id,
                        paymentId: payment.id,
                        date: date ? new Date(date) : new Date(),
                        description: `Payment for Purchase #${invoiceNumber}`,
                        debit: paid,
                        credit: 0,
                        balance: finalBalance,
                    },
                });
            }

            // Update Supplier current balance
            await tx.supplier.update({
                where: { id: supplierId },
                data: {
                    balance: finalBalance,
                },
            });

            return purchase;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error creating purchase:", error);
        return NextResponse.json({ error: error.message || "Failed to create purchase" }, { status: 500 });
    }
}
