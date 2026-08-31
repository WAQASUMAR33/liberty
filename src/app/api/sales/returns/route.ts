import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get("customerId");
        const saleId = searchParams.get("saleId");

        const where: any = {};
        if (customerId) where.customerId = customerId;
        if (saleId) where.saleId = saleId;

        const returns = await prisma.saleReturn.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        contact: true,
                    },
                },
                sale: {
                    select: {
                        id: true,
                        billNumber: true,
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                },
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json(returns);
    } catch (error) {
        console.error("Fetch returns error:", error);
        return NextResponse.json({ error: "Failed to fetch sale returns" }, { status: 500 });
    }
}
