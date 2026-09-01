import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total sales metrics
        const salesData = await prisma.sale.aggregate({
            _sum: {
                netTotal: true,
                paidAmount: true,
                balance: true,
            },
            _count: {
                id: true,
            },
        });

        // 2. Total customers count and total customer balances (receivables)
        const customerStats = await prisma.customer.aggregate({
            _count: { id: true },
            _sum: { balance: true },
        });

        // 3. Total products count & low stock count (< 10 units)
        const productCount = await prisma.product.count();
        const lowStockCount = await prisma.product.count({
            where: {
                stock: { lte: 10 },
            },
        });

        // 4. Low stock products list (top 5 lowest stock)
        const lowStockProducts = await prisma.product.findMany({
            where: {
                stock: { lte: 10 },
            },
            orderBy: { stock: "asc" },
            take: 5,
            select: {
                id: true,
                code: true,
                name: true,
                stock: true,
                retailPrice: true,
                category: { select: { name: true } },
            },
        });

        // 5. Total Categories & Brands count
        const categoryCount = await prisma.category.count();
        const brandCount = await prisma.brand.count();

        // 6. Today's collections
        const todaySales = await prisma.sale.aggregate({
            where: {
                date: { gte: today },
            },
            _sum: {
                paidAmount: true,
                netTotal: true,
            },
            _count: {
                id: true,
            },
        });

        // 7. Recent sales with customer details
        const recentSales = await prisma.sale.findMany({
            take: 6,
            orderBy: { date: "desc" },
            include: {
                customer: {
                    select: {
                        name: true,
                        contact: true,
                    },
                },
            },
        });

        // 8. Top selling products based on sale items
        const topProducts = await prisma.saleItem.groupBy({
            by: ["productId"],
            _sum: {
                quantity: true,
                subtotal: true,
            },
            take: 5,
            orderBy: {
                _sum: {
                    quantity: "desc",
                },
            },
        });

        // Enrich top products with names and prices
        const topProductsEnriched = await Promise.all(
            topProducts.map(async (item: any) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: {
                        name: true,
                        code: true,
                        retailPrice: true,
                        category: { select: { name: true } },
                    },
                });
                return {
                    id: item.productId,
                    name: product?.name || "Unknown Product",
                    code: product?.code || "",
                    category: product?.category?.name || "General",
                    sold: item._sum.quantity || 0,
                    revenue: Number(item._sum.subtotal || 0),
                };
            })
        );

        return NextResponse.json({
            stats: {
                totalSales: Number(salesData._sum.netTotal || 0),
                totalInvoices: salesData._count.id || 0,
                todayRevenue: Number(todaySales._sum.paidAmount || 0),
                todaySalesTotal: Number(todaySales._sum.netTotal || 0),
                todayInvoices: todaySales._count.id || 0,
                customerCount: customerStats._count.id || 0,
                totalReceivables: Number(customerStats._sum.balance || 0),
                productCount,
                lowStockCount,
                categoryCount,
                brandCount,
            },
            recentSales,
            topProducts: topProductsEnriched,
            lowStockProducts,
        });
    } catch (error: any) {
        console.error("Failed to fetch dashboard stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
