import { supabaseAdmin } from "../../../lib/supabase";

export async function GET() {
    try {
        // 1. Get tracks without genres
        const { data: tracks, error } = await supabaseAdmin
            .from('tracks')
            .select('*')
            .is('genre', null)
            .limit(50);

        if (error) throw error;

        if (!tracks || tracks.length === 0) {
            return Response.json({ message: "No tracks need genre update." });
        }

        const GENRES = ["Pop", "Rock", "Hip-Hop", "R&B", "Indie", "Electronic", "Jazz", "Classical"];

        let updatedCount = 0;

        for (const track of tracks) {
            // Simulate API call delay
            // await new Promise(r => setTimeout(r, 100)); 

            const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];

            await supabaseAdmin
                .from('tracks')
                .update({ genre: randomGenre })
                .eq('id', track.id);

            updatedCount++;
        }

        return Response.json({
            message: `Updated ${updatedCount} tracks with genres.`,
            tracksUpdated: updatedCount
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
