import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Bootstrap DATABASE_URL from db-config.json if not already set
if (!process.env.DATABASE_URL) {
    try {
        const configPath = path.join(process.env.CONFIG_DIR || process.cwd(), "db-config.json");
        if (fs.existsSync(configPath)) {
            const c = JSON.parse(fs.readFileSync(configPath, "utf8"));
            const pass = c.password ? `:${c.password}` : "";
            process.env.DATABASE_URL = `mysql://${c.username}${pass}@${c.server}:${c.port}/${c.database}`;
        }
    } catch {
        // ignore — DATABASE_URL will remain unset and Prisma will error naturally
    }
}

const prismaClientSingleton = () => {
    return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
