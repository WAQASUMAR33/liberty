import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                products: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        stock: true,
                        retailPrice: true,
                    },
                },
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json(brand);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const { name } = json;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
        }

        const brand = await prisma.brand.update({
            where: { id },
            data: { name: name.trim() },
        });

        return NextResponse.json(brand);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Brand name already exists" }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Unlink brand from existing products before deleting or let Prisma handle if configured
        await prisma.product.updateMany({
            where: { brandId: id },
            data: { brandId: null },
        });

        await prisma.brand.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 });
    }
}
