import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const {
            customerId,
            saleId,
            date,
            items,
            totalAmount,
            refundAmount = 0,
            creditAmount = 0,
            remarks = ""
        } = json;

        if (!customerId) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "At least one item is required for return" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Generate return number
            const returnCount = await tx.saleReturn.count();
            const returnNumber = `RET-${String(returnCount + 1).padStart(6, '0')}`;

            // Check associated sale if provided
            let refSale = null;
            if (saleId) {
                refSale = await tx.sale.findUnique({ where: { id: saleId } });
            }

            // 2. Create SaleReturn record
            const saleReturn = await tx.saleReturn.create({
                data: {
                    returnNumber,
                    date: date ? new Date(date) : new Date(),
                    saleId: saleId || null,
                    customerId,
                    totalAmount,
                    refundAmount: Number(refundAmount),
                    creditAmount: Number(creditAmount),
                    remarks,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            name: item.name,
                            quantity: Number(item.quantity),
                            price: Number(item.price),
                            subtotal: Number(item.subtotal),
                        })),
                    },
                },
            });

            // 3. Restock returned products
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: Number(item.quantity) } },
                });
            }

            // 4. Update Customer Balance if account credit is given
            let updatedCustomer;
            if (Number(creditAmount) > 0) {
                updatedCustomer = await tx.customer.update({
                    where: { id: customerId },
                    data: { balance: { decrement: Number(creditAmount) } },
                });
            } else {
                updatedCustomer = await tx.customer.findUnique({ where: { id: customerId } });
            }

            // 5. Add Ledger Entry
            const refText = refSale ? ` (Invoice ${refSale.billNumber})` : "";
            const remarkText = remarks ? ` - ${remarks}` : "";
            const payoutInfo = Number(creditAmount) > 0 && Number(refundAmount) > 0
                ? ` [Account Credit: ${creditAmount}, Cash Refund: ${refundAmount}]`
                : Number(refundAmount) > 0 ? ` [Cash Refund: ${refundAmount}]` : ` [Account Credit: ${creditAmount}]`;

            await tx.ledger.create({
                data: {
                    customerId,
                    date: date ? new Date(date) : new Date(),
                    description: `Sale Return ${returnNumber}${refText}${payoutInfo}${remarkText}`,
                    debit: Number(creditAmount), // Debit entry reduces customer debt in ledger
                    credit: 0,
                    balance: updatedCustomer.balance,
                    saleId: saleId || null,
                    saleReturnId: saleReturn.id,
                },
            });

            return saleReturn;
        }, { timeout: 15000 });

        // Fetch complete return record with details
        const completeReturn = await prisma.saleReturn.findUnique({
            where: { id: result.id },
            include: {
                customer: true,
                sale: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return NextResponse.json(completeReturn);
    } catch (error: any) {
        console.error("Sale return error:", error);
        return NextResponse.json({ error: error.message || "Failed to process sale return" }, { status: 500 });
    }
}
