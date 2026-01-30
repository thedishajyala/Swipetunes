import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopTracks, getRecommendations } from "@/lib/spotify";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Fetch seeds (Top Tracks)
        let seedTrackIds = [];
        try {
            const topTracksData = await getTopTracks(session.accessToken, 'short_term', 5);
            seedTrackIds = topTracksData.items?.map(t => t.id) || [];
        } catch (err) {
            console.warn("Recs API: Spotify fetch failed, using fallbacks.");
        }

        if (seedTrackIds.length === 0) {
            seedTrackIds.push('4iJyoBOLtHqaGxP12qzhQI'); // Fallback seed
        }

        // 2. Get recommendations
        const recs = await getRecommendations(session.accessToken, seedTrackIds.slice(0, 5));

        // 3. Format with ultra-resilience
        const tracks = (recs || []).map(track => {
            if (!track) return null;
            return {
                track_id: track.id,
                title: track.name || "Unknown Track",
                artist: track.artists?.map(a => a.name).join(', ') || "Unknown Artist",
                album: track.album?.name || "Unknown Album",
                cover_url: track.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format",
                preview_url: track.preview_url || null,
                color: '#1DB954'
            };
        }).filter(Boolean);

        // 4. Update catalog for Social Feed
        if (tracks.length > 0 && supabaseAdmin) {
            try {
                await supabaseAdmin
                    .from('songs')
                    .upsert(
                        tracks.map(t => ({
                            track_id: t.track_id,
                            title: t.title,
                            artist: t.artist,
                            album: t.album,
                            cover_url: t.cover_url
                        })),
                        { onConflict: 'track_id' }
                    );
            } catch (catalogErr) {
                console.error("Recs API Catalog Sync Error:", catalogErr.message);
            }
        }

        return NextResponse.json(tracks);
    } catch (err) {
        console.error('Recs API Critical Failure:', err);
        return NextResponse.json({ error: 'Failed to manifest tracks', details: err.message }, { status: 500 });
    }
}
