import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customer = await prisma.customer.findUnique({
            where: { id },
        });
        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name: json.name,
                contact: json.contact,
                cnic: json.cnic,
                balance: json.balance,
                address: json.address,
            },
        });
        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.customer.delete({
            where: { id },
        });
        return NextResponse.json({ message: "Customer deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}
