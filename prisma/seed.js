import { PrismaClient } from "@prisma/client";
import { mockTracks } from "../mockData.js";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    for (const track of mockTracks) {
        await prisma.track.upsert({
            where: { spotifyId: track.spotifyId },
            update: {},
            create: track,
        });
    }
    console.log("Mock tracks inserted successfully!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
