import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: { category: true },
        });

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Error fetching expense:", error);
        return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const { categoryId, title, amount, date, paymentMethod, paidTo, notes } = json;

        if (!categoryId) {
            return NextResponse.json({ error: "Expense category is required" }, { status: 400 });
        }
        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        const expAmount = Number(amount);
        if (!expAmount || expAmount <= 0) {
            return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                categoryId,
                title: title.trim(),
                amount: expAmount,
                date: date ? new Date(date) : new Date(),
                paymentMethod: paymentMethod || "CASH",
                paidTo: paidTo ? paidTo.trim() : null,
                notes: notes ? notes.trim() : null,
            },
            include: { category: true },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Error updating expense:", error);
        return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.expense.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting expense:", error);
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }
}
