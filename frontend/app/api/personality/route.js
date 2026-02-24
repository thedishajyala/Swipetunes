import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Archetypes derived from listening patterns
const ARCHETYPES = [
    {
        id: "night_owl",
        name: "Night Owl",
        emoji: "🦉",
        tagline: "You're a late-night sonic explorer",
        desc: "Most of your listening happens after midnight. You chase vibes when the world goes quiet.",
        gradient: "from-indigo-600/30 to-purple-900/30",
        border: "border-indigo-500/20",
        match: (d) => d.nightRatio > 0.4,
    },
    {
        id: "hype_beast",
        name: "Hype Beast",
        emoji: "🔥",
        tagline: "You live for the drop",
        desc: "Your likes skew Hype and high-energy. You're always chasing that next rush.",
        gradient: "from-orange-600/30 to-red-900/30",
        border: "border-orange-500/20",
        match: (d) => d.hypeMoodRatio > 0.35,
    },
    {
        id: "chill_curator",
        name: "Chill Curator",
        emoji: "😌",
        tagline: "You set the mood, effortlessly",
        desc: "Chill is your language. Your playlist is the one everyone asks for at a dinner party.",
        gradient: "from-teal-600/30 to-cyan-900/30",
        border: "border-teal-500/20",
        match: (d) => d.chillMoodRatio > 0.35,
    },
    {
        id: "nostalgia_trip",
        name: "Nostalgia Tripper",
        emoji: "📼",
        tagline: "Why fix what isn't broken?",
        desc: "You gravitate toward tracks from the 80s-90s. Gold eras deserve gold ears.",
        gradient: "from-amber-600/30 to-yellow-900/30",
        border: "border-amber-500/20",
        match: (d) => d.retroRatio > 0.4,
    },
    {
        id: "genre_jumper",
        name: "Genre Jumper",
        emoji: "🌍",
        tagline: "Genres? You've heard of them.",
        desc: "You refuse to be put in a box. Your taste spans continents and decades.",
        gradient: "from-pink-600/30 to-fuchsia-900/30",
        border: "border-pink-500/20",
        match: (d) => d.uniqueGenres >= 5,
    },
    {
        id: "focus_mode",
        name: "Deep Focus",
        emoji: "🎯",
        tagline: "Music is your productivity stack",
        desc: "You tag songs as Focus more than anything else. Beats per minute = productivity per hour.",
        gradient: "from-blue-600/30 to-sky-900/30",
        border: "border-blue-500/20",
        match: (d) => d.focusMoodRatio > 0.3,
    },
    {
        id: "sad_boi",
        name: "Sad Boi Hours",
        emoji: "😢",
        tagline: "Feeling everything, all at once",
        desc: "You lean into melancholy and emotional depth. Every song is a catharsis.",
        gradient: "from-slate-600/30 to-gray-900/30",
        border: "border-slate-500/20",
        match: (d) => d.sadMoodRatio > 0.3,
    },
    {
        id: "default",
        name: "Sonic Wanderer",
        emoji: "🎵",
        tagline: "Always discovering, never settling",
        desc: "You're a true music explorer — open to everything, loyal to nothing but the vibe.",
        gradient: "from-[#1DB954]/20 to-emerald-900/30",
        border: "border-[#1DB954]/20",
        match: () => true, // fallback
    },
];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    try {
        const { data: likes } = await supabaseAdmin
            .from("likes")
            .select("created_at, mood, songs(artist)")
            .eq("user_id", userId);

        const total = (likes || []).length;
        if (total === 0) {
            return NextResponse.json(ARCHETYPES.find(a => a.id === "default"));
        }

        // Time of day
        const nightLikes = (likes || []).filter(l => {
            const h = new Date(l.created_at).getHours();
            return h >= 22 || h < 5;
        }).length;

        // Mood ratios
        const moodCounts = {};
        (likes || []).forEach(l => { if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; });

        // Artist diversity (rough genre proxy)
        const artists = new Set((likes || []).map(l => l.songs?.artist).filter(Boolean));

        // Decade from liked timestamps as a rough proxy
        const decadeBuckets = {};
        (likes || []).forEach(l => {
            // We don't have release_year in likes/songs yet — proxy by oldest tracks liked
        });

        const data = {
            nightRatio: nightLikes / total,
            hypeMoodRatio: (moodCounts["Hype"] || 0) / total,
            chillMoodRatio: (moodCounts["Chill"] || 0) / total,
            sadMoodRatio: (moodCounts["Sad"] || 0) / total,
            focusMoodRatio: (moodCounts["Focus"] || 0) / total,
            retroRatio: 0, // needs release_year in songs table
            uniqueGenres: artists.size, // proxy: unique artists ≈ broad taste
        };

        const archetype = ARCHETYPES.find(a => a.match(data)) || ARCHETYPES.at(-1);
        return NextResponse.json({ ...archetype, stats: { total, nightRatio: data.nightRatio, uniqueArtists: artists.size } });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
