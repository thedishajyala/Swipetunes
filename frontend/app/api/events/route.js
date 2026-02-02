import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTopArtists } from "@/lib/spotify";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    try {
        // 1. Fetch user's top artists to know what to search for
        const artistsData = await getTopArtists(session.accessToken, 'medium_term', 5);
        const artistNames = artistsData.items.map(a => a.name);

        if (artistNames.length === 0) return NextResponse.json([]);

        // 2. CHECK CACHE FIRST
        const { data: cachedEvents, error: cacheError } = await supabaseAdmin
            .from('artist_events_cache')
            .select('*')
            .in('artist_name', artistNames)
            .eq('city', city || 'Global')
            .gt('event_date', new Date().toISOString());

        // If cache is fresh (fetched in last 24h), return it
        if (cachedEvents?.length > 0 && new Date(cachedEvents[0].fetched_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            return NextResponse.json(cachedEvents);
        }

        // 3. FETCH FROM EVENTS API (MOCKED FOR DEMO)
        // In a real app, you'd call Ticketmaster or Songkick here.
        // We simulate a successful fetch for the demo experience.
        const mockEvents = artistNames.map(name => ({
            artist_name: name,
            city: city || 'Global',
            venue: `${name} Arena`,
            event_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            ticket_url: `https://www.ticketmaster.com/search?q=${encodeURIComponent(name)}`,
            fetched_at: new Date().toISOString()
        }));

        // 4. Update Cache
        if (mockEvents.length > 0) {
            await supabaseAdmin
                .from('artist_events_cache')
                .upsert(mockEvents, { onConflict: 'artist_name,city,event_date' });
        }

        return NextResponse.json(mockEvents);
    } catch (error) {
        console.error("Events Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { event_id, status } = await request.json(); // status: 'going' or 'interested'

    try {
        const { data, error } = await supabaseAdmin
            .from('event_attendance')
            .upsert({
                user_id: userId,
                event_id,
                status
            });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
