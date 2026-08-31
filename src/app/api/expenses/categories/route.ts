import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const categories = await prisma.expenseCategory.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { expenses: true }
                },
                expenses: {
                    select: { amount: true }
                }
            }
        });

        const enriched = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            createdAt: cat.createdAt,
            expenseCount: cat._count.expenses,
            totalSpent: cat.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        }));

        return NextResponse.json(enriched);
    } catch (error) {
        console.error("Error fetching expense categories:", error);
        return NextResponse.json({ error: "Failed to fetch expense categories" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const { name, description } = json;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        const category = await prisma.expenseCategory.create({
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
        console.error("Error creating expense category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
