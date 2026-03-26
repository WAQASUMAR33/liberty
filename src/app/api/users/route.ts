import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createHash } from "crypto";

// GET all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// POST create new user
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, name, role } = body;

        // Check if username already exists
        const existing = await prisma.user.findUnique({
            where: { username },
        });

        if (existing) {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }

        // Hash password (simple hash for demo - use bcrypt in production)
        const hashedPassword = createHash("sha256").update(password).digest("hex");

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                role: role || "CASHIER",
            },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
