import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // 1. Get total sales (netTotal)
        const salesData = await prisma.sale.aggregate({
            _sum: {
                netTotal: true
            }
        });

        // 2. Get total customers count
        const customerCount = await prisma.customer.count();

        // 3. Get total products count
        const productCount = await prisma.product.count();

        // 4. Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySales = await prisma.sale.aggregate({
            where: {
                date: {
                    gte: today
                }
            },
            _sum: {
                paidAmount: true
            }
        });

        // 5. Get recent sales with customer names
        const recentSales = await prisma.sale.findMany({
            take: 5,
            orderBy: {
                date: 'desc'
            },
            include: {
                customer: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // 6. Get top products based on sale items
        const topProducts = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true
            },
            take: 3,
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            }
        });

        // Enrich top products with names
        const topProductsEnriched = await Promise.all(
            topProducts.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true }
                });
                return {
                    name: product?.name || 'Unknown',
                    sold: item._sum.quantity || 0
                };
            })
        );

        return NextResponse.json({
            stats: [
                {
                    label: "Total Sales",
                    value: salesData._sum.netTotal || 0,
                    icon: "DollarSign",
                    color: "text-emerald-500"
                },
                {
                    label: "Customers",
                    value: customerCount,
                    icon: "Users",
                    color: "text-blue-500"
                },
                {
                    label: "Products",
                    value: productCount,
                    icon: "Package",
                    color: "text-purple-500"
                },
                {
                    label: "Daily Revenue",
                    value: todaySales._sum.paidAmount || 0,
                    icon: "TrendingUp",
                    color: "text-orange-500"
                }
            ],
            recentSales,
            topProducts: topProductsEnriched
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
