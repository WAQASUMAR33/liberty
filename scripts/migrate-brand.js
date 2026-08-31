const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const configPath = path.join(process.cwd(), "db-config.json");
if (!process.env.DATABASE_URL && fs.existsSync(configPath)) {
    try {
        const c = JSON.parse(fs.readFileSync(configPath, "utf8"));
        const pass = c.password ? `:${c.password}` : "";
        process.env.DATABASE_URL = `mysql://${c.username}${pass}@${c.server}:${c.port}/${c.database}`;
    } catch (e) {}
}

const prisma = new PrismaClient();

async function migrate() {
    console.log("Connecting to database to apply Brand migration...");
    try {
        // 1. Create Brand table
        console.log("1. Creating Brand table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`Brand\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`name\` VARCHAR(191) NOT NULL,
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                UNIQUE INDEX \`Brand_name_key\`(\`name\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ Brand table created or already exists.");

        // 2. Check if brandId column exists on Product table
        console.log("2. Checking brandId column on Product table...");
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE \`Product\` ADD COLUMN \`brandId\` VARCHAR(191) NULL;
            `);
            console.log("✓ Added brandId column to Product table.");
        } catch (e) {
            if (e.message && (e.message.includes("Duplicate column name") || e.message.includes("already exists"))) {
                console.log("✓ brandId column already exists on Product table.");
            } else {
                console.log("Notice on brandId column:", e.message);
            }
        }

        // 3. Add foreign key constraint if not exists
        console.log("3. Adding foreign key constraint for brandId...");
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE \`Product\` ADD CONSTRAINT \`Product_brandId_fkey\` FOREIGN KEY (\`brandId\`) REFERENCES \`Brand\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
            `);
            console.log("✓ Added foreign key constraint Product_brandId_fkey.");
        } catch (e) {
            if (e.message && (e.message.includes("Duplicate foreign key") || e.message.includes("already exists") || e.message.includes("Error 1826") || e.message.includes("Error 1061"))) {
                console.log("✓ Foreign key constraint already exists.");
            } else {
                console.log("Notice on foreign key constraint:", e.message);
            }
        }

        console.log("\nTesting Brand creation...");
        const testBrand = await prisma.brand.create({
            data: { name: "Default Brand" },
        });
        console.log("✓ Successfully created brand:", testBrand);

        const allBrands = await prisma.brand.findMany({
            include: { _count: { select: { products: true } } }
        });
        console.log("✓ Current brands count in DB:", allBrands.length);

    } catch (error) {
        console.error("Migration Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
