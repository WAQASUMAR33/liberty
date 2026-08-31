import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const supplierId = searchParams.get("supplierId");

        if (!supplierId) {
            return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
        }

        const ledger = await prisma.supplierLedger.findMany({
            where: { supplierId },
            orderBy: { date: "asc" },
            include: {
                purchase: true,
                payment: true,
            },
        });

        return NextResponse.json(ledger);
    } catch (error) {
        console.error("Error fetching supplier ledger:", error);
        return NextResponse.json({ error: "Failed to fetch supplier ledger" }, { status: 500 });
    }
}
