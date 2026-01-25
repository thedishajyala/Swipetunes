import prisma from '../../lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : 1;

    try {
        const likedSwipes = await prisma.swipe.findMany({
            where: {
                userId,
                liked: true,
            },
            include: {
                track: true,
            },
            orderBy: {
                id: 'desc', // Show most recent first
            },
        });

        const tracks = likedSwipes.map(swipe => swipe.track);

        res.status(200).json({ tracks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
