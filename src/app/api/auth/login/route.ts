import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createHash } from "crypto";

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Find user
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Hash password and compare
        const hashedPassword = createHash("sha256").update(password).digest("hex");

        if (user.password !== hashedPassword) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Return user data (without password)
        const response = NextResponse.json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
        });

        // Set session cookie
        response.cookies.set("session", JSON.stringify({
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
