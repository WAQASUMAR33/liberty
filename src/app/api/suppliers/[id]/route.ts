import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                purchases: {
                    orderBy: { date: "desc" },
                    take: 10,
                },
                _count: {
                    select: { purchases: true }
                }
            },
        });

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error fetching supplier:", error);
        return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const { name, companyName, contact, email, address, cnic } = json;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
        }

        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name: name.trim(),
                companyName: companyName ? companyName.trim() : null,
                contact: contact ? contact.trim() : "",
                email: email ? email.trim() : null,
                address: address ? address.trim() : null,
                cnic: cnic ? cnic.trim() : null,
            },
        });

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error updating supplier:", error);
        return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if purchases exist
        const purchaseCount = await prisma.purchase.count({
            where: { supplierId: id },
        });

        if (purchaseCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete supplier with ${purchaseCount} existing purchase invoices.` },
                { status: 400 }
            );
        }

        // Delete ledgers and supplier
        await prisma.supplierLedger.deleteMany({
            where: { supplierId: id },
        });

        await prisma.supplierPayment.deleteMany({
            where: { supplierId: id },
        });

        await prisma.supplier.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
    }
}
