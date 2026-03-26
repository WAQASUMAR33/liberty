import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const { name } = json;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { id },
            data: { name },
        });

        return NextResponse.json(category);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Category already exists" }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
