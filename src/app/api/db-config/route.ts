import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface DbConfig {
    server: string;
    port: string;
    database: string;
    username: string;
    password: string;
}

function getConfigPath() {
    // CONFIG_DIR is set by Electron main process; fallback to cwd for dev
    const dir = process.env.CONFIG_DIR || process.cwd();
    return path.join(dir, "db-config.json");
}

function buildDatabaseUrl(config: DbConfig) {
    const pass = config.password ? `:${config.password}` : "";
    return `mysql://${config.username}${pass}@${config.server}:${config.port}/${config.database}`;
}

export function readDbConfig(): DbConfig | null {
    try {
        const configPath = getConfigPath();
        if (!fs.existsSync(configPath)) return null;
        return JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
        return null;
    }
}

export async function GET() {
    const config = readDbConfig();
    if (!config) {
        return NextResponse.json({
            server: "",
            port: "3306",
            database: "liberty",
            username: "root",
            password: "",
        });
    }
    return NextResponse.json(config);
}

export async function POST(request: Request) {
    try {
        const body: DbConfig = await request.json();

        const config: DbConfig = {
            server: body.server?.trim() || "",
            port: body.port?.trim() || "3306",
            database: body.database?.trim() || "liberty",
            username: body.username?.trim() || "root",
            password: body.password ?? "",
        };

        if (!config.server) {
            return NextResponse.json({ error: "Server IP is required" }, { status: 400 });
        }

        // Save to file
        const configPath = getConfigPath();
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        // Update DATABASE_URL in process.env so Prisma picks it up on next instantiation
        const url = buildDatabaseUrl(config);
        process.env.DATABASE_URL = url;

        // Reset the Prisma singleton so the next DB call reconnects with new URL
        const globalForPrisma = globalThis as unknown as { prisma: unknown };
        if (globalForPrisma.prisma) {
            try {
                const { default: prisma } = await import("@/lib/prisma");
                await prisma.$disconnect();
            } catch {
                // ignore disconnect errors
            }
            globalForPrisma.prisma = undefined;
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save config";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
