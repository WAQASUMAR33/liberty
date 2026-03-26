import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query");

        const customers = await prisma.customer.findMany({
            where: query ? {
                OR: [
                    { name: { contains: query } },
                    { contact: { contains: query } },
                    { cnic: { contains: query } },
                ],
            } : {},
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(customers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const customer = await prisma.customer.create({
            data: {
                name: json.name,
                contact: json.contact,
                cnic: json.cnic,
                balance: json.balance || 0,
                address: json.address,
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
