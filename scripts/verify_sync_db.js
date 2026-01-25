const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { topTracks: true, topArtists: true }
    });

    console.log(`Total Users: ${users.length}`);
    users.forEach(user => {
        console.log(`User: ${user.name} (${user.email})`);
        console.log(`  Top Tracks: ${user.topTracks.length}`);
        console.log(`  Top Artists: ${user.topArtists.length}`);
        if (user.topTracks.length > 0) {
            console.log(`  Sample Track: ${user.topTracks[0].name} by ${user.topTracks[0].artist}`);
        }
        if (user.topArtists.length > 0) {
            console.log(`  Sample Artist: ${user.topArtists[0].name}`);
        }
    });

    const tracks = await prisma.track.count();
    const artists = await prisma.artist.count();
    console.log(`Total Tracks in DB: ${tracks}`);
    console.log(`Total Artists in DB: ${artists}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
