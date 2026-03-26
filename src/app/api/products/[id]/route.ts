import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
        });
        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const product = await prisma.product.update({
            where: { id },
            data: {
                code: json.code,
                name: json.name,
                costPrice: json.costPrice,
                wholesalePrice: json.wholesalePrice,
                retailPrice: json.retailPrice,
                stock: parseInt(json.stock),
                categoryId: json.categoryId || null,
            },
        });
        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.product.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Product deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
