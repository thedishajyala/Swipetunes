import { supabaseAdmin } from '../../lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id ? session.user.id : null;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { data: likedSwipes, error } = await supabaseAdmin
            .from('swipes')
            .select(`
                *,
                track:tracks (*)
            `)
            .eq('userId', userId)
            .eq('liked', true)
            .order('id', { ascending: false });

        if (error) throw error;

        const tracks = likedSwipes.map(swipe => swipe.track);

        res.status(200).json({ tracks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
