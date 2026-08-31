import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const { name, description } = json;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        const category = await prisma.expenseCategory.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
            },
        });

        return NextResponse.json(category);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Expense category with this name already exists" }, { status: 400 });
        }
        console.error("Error updating expense category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const count = await prisma.expense.count({
            where: { categoryId: id },
        });

        if (count > 0) {
            return NextResponse.json(
                { error: `Cannot delete category with ${count} linked expense voucher(s).` },
                { status: 400 }
            );
        }

        await prisma.expenseCategory.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting expense category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
