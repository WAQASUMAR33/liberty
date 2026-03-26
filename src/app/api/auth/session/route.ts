import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session");

        if (!sessionCookie) {
            return NextResponse.json({ authenticated: false });
        }

        const session = JSON.parse(sessionCookie.value);

        return NextResponse.json({
            authenticated: true,
            user: session,
        });
    } catch (error) {
        return NextResponse.json({ authenticated: false });
    }
}
