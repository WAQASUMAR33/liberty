import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");

        const payments = await prisma.payment.findMany({
            where: customerId ? { customerId } : {},
            include: { customer: true },
            orderBy: { date: "desc" },
        });

        return NextResponse.json(payments);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const { customerId, amount, method, remarks, date } = json;

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Create Payment
            const payment = await tx.payment.create({
                data: {
                    customerId,
                    amount,
                    method,
                    remarks,
                    date: date ? new Date(date) : new Date(),
                },
            });

            // 2. Update Customer Balance (Decreasing since it's a payment received)
            const updatedCustomer = await tx.customer.update({
                where: { id: customerId },
                data: { balance: { decrement: amount } },
            });

            // 3. Add Ledger Entry
            await tx.ledger.create({
                data: {
                    customerId,
                    description: `Payment Received (${method}) - ${remarks || ''}`,
                    debit: amount,
                    credit: 0,
                    balance: updatedCustomer.balance,
                    paymentId: payment.id,
                },
            });

            return await tx.payment.findUnique({
                where: { id: payment.id },
                include: { customer: true }
            });
        }, { timeout: 15000 });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
    }
}
