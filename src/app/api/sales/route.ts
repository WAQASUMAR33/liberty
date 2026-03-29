import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all sales
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        const where = type ? { type: type as any } : {};

        const sales = await prisma.sale.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        contact: true,
                    },
                },
                items: true,
            },
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(sales);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const {
            customerId,
            date,
            type,
            items,
            total,
            discount,
            netTotal,
            paidAmount,
            balance
        } = json;

        // 1. Transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx: any) => {
            // 2. Generate bill number
            const billCount = await tx.sale.count();
            const prefix = type === 'QUOTATION' ? 'QT' : 'INV';
            const billNumber = `${prefix}-${String(billCount + 1).padStart(6, '0')}`;

            // 3. Create Sale
            const sale = await tx.sale.create({
                data: {
                    billNumber,
                    date: date ? new Date(date) : undefined,
                    type,
                    customerId,
                    total,
                    discount,
                    netTotal,
                    paidAmount: type === 'QUOTATION' ? 0 : paidAmount,
                    balance: type === 'QUOTATION' ? 0 : balance,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            discount: item.itemDiscount || 0,
                            subtotal: item.subtotal,
                        })),
                    },
                },
            });

            // Skip stock and ledger updates for QUOTATION
            if (type === 'QUOTATION') {
                return sale;
            }

            // 4. Update Product Stock
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            // 5. Update Customer Balance
            const updatedCustomer = await tx.customer.update({
                where: { id: customerId },
                data: { balance: { increment: balance } },
            });

            // 6. Add Ledger Entry
            await tx.ledger.create({
                data: {
                    customerId,
                    date: date ? new Date(date) : undefined,
                    description: `Sale ${billNumber} (${type})`,
                    credit: balance > 0 ? balance : 0,
                    debit: paidAmount,
                    balance: updatedCustomer.balance,
                    saleId: sale.id,
                },
            });

            return sale;
        }, { timeout: 15000 });

        // Fetch complete sale data with relations
        const completeSale = await prisma.sale.findUnique({
            where: { id: result.id },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        contact: true,
                    },
                },
                items: true,
            },
        });

        return NextResponse.json(completeSale);
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Failed to process sale" }, { status: 500 });
    }
}
