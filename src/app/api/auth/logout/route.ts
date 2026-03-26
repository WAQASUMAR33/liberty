import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ message: "Logged out successfully" });

    // Clear session cookie
    response.cookies.delete("session");

    return response;
}

export async function GET() {
    const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));
    response.cookies.delete("session");
    return response;
}
