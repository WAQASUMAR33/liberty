import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");

        if (!customerId) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }

        const ledgerEntries = await prisma.ledger.findMany({
            where: { customerId },
            orderBy: { date: "asc" },
            include: {
                sale: true,
                payment: true,
            },
        });

        return NextResponse.json(ledgerEntries);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
    }
}
