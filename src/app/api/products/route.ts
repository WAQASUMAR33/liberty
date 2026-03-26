import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query");

        const products = await prisma.product.findMany({
            where: query ? {
                OR: [
                    { name: { contains: query } },
                    { code: { contains: query } },
                ],
            } : {},
            include: {
                category: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const product = await prisma.product.create({
            data: {
                code: json.code,
                name: json.name,
                costPrice: json.costPrice,
                wholesalePrice: json.wholesalePrice,
                retailPrice: json.retailPrice,
                stock: parseInt(json.stock) || 0,
                categoryId: json.categoryId || null,
            },
        });

        return NextResponse.json(product);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Product code already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}
