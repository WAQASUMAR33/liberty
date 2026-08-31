const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
require("dotenv").config();

// If DATABASE_URL is in db-config.json, bootstrap it
const fs = require("fs");
const path = require("path");
const configPath = path.join(process.cwd(), "db-config.json");
if (!process.env.DATABASE_URL && fs.existsSync(configPath)) {
    try {
        const c = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const pass = c.password ? `:${c.password}` : "";
        process.env.DATABASE_URL = `mysql://${c.username}${pass}@${c.server}:${c.port}/${c.database}`;
    } catch (e) {
        console.error("Could not load db-config.json", e);
    }
}

const prisma = new PrismaClient();

async function main() {
    const username = process.argv[2] || "admin";
    const password = process.argv[3] || "admin123";
    const name = process.argv[4] || "Administrator";

    console.log(`Setting up Admin user with username: "${username}"...`);

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUser) {
        console.log(`User "${username}" already exists. Updating password and role to ADMIN...`);
        const updated = await prisma.user.update({
            where: { username },
            data: {
                password: hashedPassword,
                role: "ADMIN",
                name,
            },
        });
        console.log("✅ Admin user updated successfully:", {
            id: updated.id,
            username: updated.username,
            name: updated.name,
            role: updated.role,
        });
    } else {
        const created = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                role: "ADMIN",
            },
        });
        console.log("✅ Admin user created successfully:", {
            id: created.id,
            username: created.username,
            name: created.name,
            role: created.role,
        });
    }

    console.log("\n====================================");
    console.log("Admin Login Credentials:");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("Role: ADMIN");
    console.log("====================================\n");
}

main()
    .catch((e) => {
        console.error("Error creating admin user:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
