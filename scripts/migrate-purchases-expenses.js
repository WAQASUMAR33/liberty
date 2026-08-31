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
    console.log("Applying database migrations for Suppliers, Purchases, and Expenses...");
    try {
        // 1. Supplier Table
        console.log("1. Creating Supplier table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`Supplier\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`name\` VARCHAR(191) NOT NULL,
                \`companyName\` VARCHAR(191) NULL,
                \`contact\` VARCHAR(191) NOT NULL,
                \`email\` VARCHAR(191) NULL,
                \`address\` VARCHAR(191) NULL,
                \`cnic\` VARCHAR(191) NULL,
                \`balance\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ Supplier table ready.");

        // 2. Purchase Table
        console.log("2. Creating Purchase table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`Purchase\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`invoiceNumber\` VARCHAR(191) NOT NULL,
                \`date\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`supplierId\` VARCHAR(191) NOT NULL,
                \`total\` DECIMAL(15, 2) NOT NULL,
                \`discount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                \`netTotal\` DECIMAL(15, 2) NOT NULL,
                \`paidAmount\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                \`balance\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                \`notes\` VARCHAR(191) NULL,
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                UNIQUE INDEX \`Purchase_invoiceNumber_key\`(\`invoiceNumber\`),
                INDEX \`Purchase_supplierId_idx\`(\`supplierId\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ Purchase table ready.");

        // 3. PurchaseItem Table
        console.log("3. Creating PurchaseItem table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`PurchaseItem\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`purchaseId\` VARCHAR(191) NOT NULL,
                \`productId\` VARCHAR(191) NOT NULL,
                \`name\` VARCHAR(191) NOT NULL DEFAULT '',
                \`quantity\` INT NOT NULL,
                \`costPrice\` DECIMAL(10, 2) NOT NULL,
                \`retailPrice\` DECIMAL(10, 2) NULL,
                \`subtotal\` DECIMAL(15, 2) NOT NULL,
                INDEX \`PurchaseItem_purchaseId_idx\`(\`purchaseId\`),
                INDEX \`PurchaseItem_productId_idx\`(\`productId\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ PurchaseItem table ready.");

        // 4. SupplierPayment Table
        console.log("4. Creating SupplierPayment table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`SupplierPayment\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`supplierId\` VARCHAR(191) NOT NULL,
                \`amount\` DECIMAL(15, 2) NOT NULL,
                \`date\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`method\` VARCHAR(191) NULL DEFAULT 'CASH',
                \`remarks\` VARCHAR(191) NULL,
                \`description\` VARCHAR(191) NULL,
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                INDEX \`SupplierPayment_supplierId_idx\`(\`supplierId\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ SupplierPayment table ready.");

        // 5. SupplierLedger Table
        console.log("5. Creating SupplierLedger table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`SupplierLedger\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`supplierId\` VARCHAR(191) NOT NULL,
                \`date\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`description\` VARCHAR(191) NOT NULL,
                \`debit\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                \`credit\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                \`balance\` DECIMAL(15, 2) NOT NULL,
                \`purchaseId\` VARCHAR(191) NULL,
                \`paymentId\` VARCHAR(191) NULL,
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                INDEX \`SupplierLedger_supplierId_idx\`(\`supplierId\`),
                INDEX \`SupplierLedger_purchaseId_idx\`(\`purchaseId\`),
                INDEX \`SupplierLedger_paymentId_idx\`(\`paymentId\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ SupplierLedger table ready.");

        // 6. ExpenseCategory Table (Dynamic Headers)
        console.log("6. Creating ExpenseCategory table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`ExpenseCategory\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`name\` VARCHAR(191) NOT NULL,
                \`description\` VARCHAR(191) NULL,
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                UNIQUE INDEX \`ExpenseCategory_name_key\`(\`name\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ ExpenseCategory table ready.");

        // Seed default expense categories if empty
        const defaultCategories = [
            "Rent & Lease",
            "Electricity & Utilities",
            "Staff Salaries & Wages",
            "Tea & Refreshments",
            "Transportation & Delivery",
            "Shop Maintenance & Repairs",
            "Packaging & Supplies",
            "Marketing & Promotion",
            "Miscellaneous Expenses"
        ];
        for (const cat of defaultCategories) {
            try {
                await prisma.$executeRawUnsafe(`
                    INSERT IGNORE INTO \`ExpenseCategory\` (\`id\`, \`name\`, \`createdAt\`, \`updatedAt\`)
                    VALUES (UUID(), '${cat}', NOW(3), NOW(3));
                `);
            } catch (e) {}
        }
        console.log("✓ Default expense categories seeded.");

        // 7. Expense Table
        console.log("7. Creating Expense table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS \`Expense\` (
                \`id\` VARCHAR(191) NOT NULL,
                \`voucherNumber\` VARCHAR(191) NOT NULL,
                \`categoryId\` VARCHAR(191) NOT NULL,
                \`title\` VARCHAR(191) NOT NULL,
                \`amount\` DECIMAL(15, 2) NOT NULL,
                \`date\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`paymentMethod\` VARCHAR(191) NOT NULL DEFAULT 'CASH',
                \`paidTo\` VARCHAR(191) NULL,
                \`notes\` VARCHAR(191) NULL,
                \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                UNIQUE INDEX \`Expense_voucherNumber_key\`(\`voucherNumber\`),
                INDEX \`Expense_categoryId_idx\`(\`categoryId\`),
                PRIMARY KEY (\`id\`)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        console.log("✓ Expense table ready.");

        console.log("\nAll tables and schemas successfully created in database!");
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
