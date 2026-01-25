import prisma from '../../lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { mockTracks } from "../../mockData"; // Fallback/dev helper if needed

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    // Use session user ID if available, otherwise default to 1 (for testing without login if desired, or strictly require login)
    // For now, let's strictly require it but fallback to 1 only if MOCK_MODE dictates or for ease of testing
    // Better: Default to 1 if no session for continuity with previous steps, but use session if present.
    const userId = session?.user?.id ? parseInt(session.user.id) : 1;

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
