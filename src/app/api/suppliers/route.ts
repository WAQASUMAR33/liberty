import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { purchases: true }
                }
            }
        });
        return NextResponse.json(suppliers);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const { name, companyName, contact, email, address, cnic, openingBalance } = json;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
        }
        if (!contact || !contact.trim()) {
            return NextResponse.json({ error: "Contact number is required" }, { status: 400 });
        }

        const initialBalance = Number(openingBalance) || 0;

        const supplier = await prisma.$transaction(async (tx: any) => {
            const created = await tx.supplier.create({
                data: {
                    name: name.trim(),
                    companyName: companyName ? companyName.trim() : null,
                    contact: contact.trim(),
                    email: email ? email.trim() : null,
                    address: address ? address.trim() : null,
                    cnic: cnic ? cnic.trim() : null,
                    balance: initialBalance,
                },
            });

            if (initialBalance !== 0) {
                await tx.supplierLedger.create({
                    data: {
                        supplierId: created.id,
                        description: "Opening Balance",
                        debit: initialBalance < 0 ? Math.abs(initialBalance) : 0,
                        credit: initialBalance > 0 ? initialBalance : 0,
                        balance: initialBalance,
                    },
                });
            }

            return created;
        });

        return NextResponse.json(supplier);
    } catch (error: any) {
        console.error("Error creating supplier:", error);
        return NextResponse.json({ error: error.message || "Failed to create supplier" }, { status: 500 });
    }
}
