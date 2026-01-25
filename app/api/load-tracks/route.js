import { supabaseAdmin } from "../../../lib/supabase";

export async function GET() {
    try {
        const res = await fetch("http://localhost:3000/api/deezer");
        const tracks = await res.json();

        // Bulk upsert is more efficient
        const { error } = await supabaseAdmin
            .from('tracks')
            .upsert(tracks, { onConflict: 'spotifyId', ignoreDuplicates: true });

        if (error) throw error;

        return Response.json({ message: "Tracks loaded from Deezer!" });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
