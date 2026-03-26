import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!sale) {
            return NextResponse.json(
                { error: "Sale not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(sale);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch sale" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const sale = await prisma.sale.findUnique({
            where: { id },
        });

        if (!sale) {
            return NextResponse.json(
                { error: "Sale not found" },
                { status: 404 }
            );
        }

        if (sale.type !== 'QUOTATION') {
            return NextResponse.json(
                { error: "Only quotations can be deleted" },
                { status: 403 }
            );
        }

        await prisma.$transaction([
            prisma.saleItem.deleteMany({
                where: { saleId: id },
            }),
            prisma.sale.delete({
                where: { id },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete sale" },
            { status: 500 }
        );
    }
}
