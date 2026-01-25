import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
        },
    });

    console.log("Mock User upserted!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
