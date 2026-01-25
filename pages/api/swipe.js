import prisma from '../../lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = session.user.id;

    if (req.method === "POST") {
        const { trackId, liked } = req.body;

        try {
            const swipe = await prisma.swipe.create({
                data: {
                    userId,
                    trackId,
                    liked,
                },
            });
            res.status(200).json({ success: true, swipe });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    } else if (req.method === "GET") {
        try {
            // Return tracks to swipe
            const tracks = await prisma.track.findMany();
            res.status(200).json(tracks);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
