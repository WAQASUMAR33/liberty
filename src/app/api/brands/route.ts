import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });
        return NextResponse.json(brands);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const { name } = json;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
        }

        const brand = await prisma.brand.create({
            data: { name: name.trim() },
        });

        return NextResponse.json(brand);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Brand already exists" }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
    }
}
