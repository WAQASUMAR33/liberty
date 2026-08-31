import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const paymentMethod = searchParams.get("paymentMethod");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const search = searchParams.get("search");

        const where: any = {};

        if (categoryId && categoryId !== "ALL") {
            where.categoryId = categoryId;
        }

        if (paymentMethod && paymentMethod !== "ALL") {
            where.paymentMethod = paymentMethod;
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                const s = new Date(startDate);
                s.setHours(0, 0, 0, 0);
                where.date.gte = s;
            }
            if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59, 999);
                where.date.lte = e;
            }
        }

        if (search && search.trim()) {
            where.OR = [
                { title: { contains: search.trim() } },
                { voucherNumber: { contains: search.trim() } },
                { paidTo: { contains: search.trim() } },
                { notes: { contains: search.trim() } },
            ];
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: "desc" },
            include: {
                category: true,
            },
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const {
            categoryId,
            title,
            amount,
            date,
            paymentMethod = "CASH",
            paidTo,
            notes,
            customVoucherNumber,
        } = json;

        if (!categoryId) {
            return NextResponse.json({ error: "Expense category is required" }, { status: 400 });
        }
        if (!title || !title.trim()) {
            return NextResponse.json({ error: "Expense title/description is required" }, { status: 400 });
        }
        const expAmount = Number(amount);
        if (!expAmount || expAmount <= 0) {
            return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
        }

        // Generate voucher number
        let voucherNumber = customVoucherNumber ? customVoucherNumber.trim() : "";
        if (!voucherNumber) {
            const count = await prisma.expense.count();
            voucherNumber = `EXP-${String(count + 1).padStart(6, "0")}`;
        }

        const expense = await prisma.expense.create({
            data: {
                voucherNumber,
                categoryId,
                title: title.trim(),
                amount: expAmount,
                date: date ? new Date(date) : new Date(),
                paymentMethod: paymentMethod || "CASH",
                paidTo: paidTo ? paidTo.trim() : null,
                notes: notes ? notes.trim() : null,
            },
            include: {
                category: true,
            },
        });

        return NextResponse.json(expense);
    } catch (error: any) {
        console.error("Error creating expense:", error);
        return NextResponse.json({ error: error.message || "Failed to create expense" }, { status: 500 });
    }
}
