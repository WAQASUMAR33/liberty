import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const { supplierId, amount, date, method = "CASH", remarks, description } = json;

        if (!supplierId) {
            return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
        }

        const payAmount = Number(amount);
        if (!payAmount || payAmount <= 0) {
            return NextResponse.json({ error: "Payment amount must be greater than 0" }, { status: 400 });
        }

        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
        });

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const currentBalance = Number(supplier.balance);
            const newBalance = currentBalance - payAmount;

            const payment = await tx.supplierPayment.create({
                data: {
                    supplierId,
                    amount: payAmount,
                    date: date ? new Date(date) : new Date(),
                    method: method || "CASH",
                    remarks: remarks ? remarks.trim() : null,
                    description: description ? description.trim() : null,
                },
            });

            const ledgerEntry = await tx.supplierLedger.create({
                data: {
                    supplierId,
                    paymentId: payment.id,
                    date: date ? new Date(date) : new Date(),
                    description: description?.trim() || remarks?.trim() || `Payment to Supplier (${method || "CASH"})`,
                    debit: payAmount,
                    credit: 0,
                    balance: newBalance,
                },
            });

            await tx.supplier.update({
                where: { id: supplierId },
                data: {
                    balance: newBalance,
                },
            });

            return { payment, ledgerEntry, newBalance };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error creating supplier payment:", error);
        return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
    }
}
