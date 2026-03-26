import { PrismaClient } from "@prisma/client";

// Bootstrap DATABASE_URL from db-config.json if not already set (local/Electron only)
if (!process.env.DATABASE_URL) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require("fs");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require("path");
        const configPath = path.join(process.env.CONFIG_DIR || process.cwd(), "db-config.json");
        if (fs.existsSync(configPath)) {
            const c = JSON.parse(fs.readFileSync(configPath, "utf8"));
            const pass = c.password ? `:${c.password}` : "";
            process.env.DATABASE_URL = `mysql://${c.username}${pass}@${c.server}:${c.port}/${c.database}`;
        }
    } catch {
        // ignore — on Vercel, DATABASE_URL must be set as an environment variable
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
