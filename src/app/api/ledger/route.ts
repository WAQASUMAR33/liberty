import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

        if (!customerId) {
            return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
        }

        const orderBy = sortBy === "date"
            ? [{ date: sortOrder }, { createdAt: sortOrder }]
            : [{ createdAt: sortOrder }, { date: sortOrder }];

        const ledgerEntries = await prisma.ledger.findMany({
            where: { customerId },
            orderBy,
            include: {
                sale: {
                    include: {
                        items: true,
                    },
                },
                saleReturn: {
                    include: {
                        items: true,
                    },
                },
                payment: true,
            },
        });

        return NextResponse.json(ledgerEntries);
    } catch (error) {
        console.error("Error fetching ledger entries:", error);
        return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
    }
}
