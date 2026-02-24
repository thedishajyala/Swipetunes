"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { HiOutlineHeart, HiOutlineMusicNote, HiOutlineCalendar } from "react-icons/hi";

export default function SwipeHistoryPage() {
    const { data: session } = useSession();
    const [grouped, setGrouped] = useState([]); // [{ date, tracks[] }]
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(null);
    const [audioRef, setAudioRef] = useState(null);

    useEffect(() => {
        async function fetchHistory() {
            if (!session?.user) return;

            const lookupId = session.user.spotify_id || session.user.id;
            const { data: profile } = await supabase
                .from("users").select("id").eq("spotify_id", lookupId).maybeSingle();
            const internalId = profile ? profile.id : session.user.id;

            const { data: likes, error } = await supabase
                .from("likes")
                .select("track_id, created_at, songs(title, artist, album, cover_url, preview_url)")
                .eq("user_id", internalId)
                .order("created_at", { ascending: false });

            if (error) { console.error("SwipeHistory fetch error:", error); setLoading(false); return; }

            // Group by date
            const map = {};
            (likes || []).forEach(l => {
                const date = new Date(l.created_at).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric"
                });
                if (!map[date]) map[date] = [];
                map[date].push({
                    track_id: l.track_id,
                    liked_at: l.created_at,
                    title: l.songs?.title || "Unknown Track",
                    artist: l.songs?.artist || "Unknown Artist",
                    album: l.songs?.album || "",
                    cover_url: l.songs?.cover_url || null,
                    preview_url: l.songs?.preview_url || null,
                });
            });

            setGrouped(Object.entries(map).map(([date, tracks]) => ({ date, tracks })));
            setLoading(false);
        }

        if (session) fetchHistory();
        else if (session === null) setLoading(false);
    }, [session]);

    function togglePreview(track) {
        if (playing === track.track_id) {
            audioRef?.pause(); setPlaying(null); setAudioRef(null); return;
        }
        audioRef?.pause();
        if (!track.preview_url) return;
        const audio = new Audio(track.preview_url);
        audio.volume = 0.6;
        audio.play();
        audio.onended = () => { setPlaying(null); setAudioRef(null); };
        setPlaying(track.track_id);
        setAudioRef(audio);
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Loading History...</div>
        </div>
    );

    if (!session) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <HiOutlineHeart className="text-5xl text-[#1DB954] mb-4" />
            <h2 className="text-2xl font-black text-white">Sign in to see your history</h2>
        </div>
    );

    const totalLikes = grouped.reduce((acc, g) => acc + g.tracks.length, 0);

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-12">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/40 to-pink-500/40 border border-purple-500/30 rounded-2xl flex items-center justify-center">
                        <HiOutlineCalendar className="text-purple-300 text-xl" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Swipe History</h1>
                </div>
                <p className="text-gray-500 font-medium text-sm ml-1">
                    {totalLikes} song{totalLikes !== 1 ? "s" : ""} liked across {grouped.length} day{grouped.length !== 1 ? "s" : ""}
                </p>
            </motion.div>

            {/* Empty state */}
            {grouped.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                        <HiOutlineMusicNote className="text-4xl text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter mb-3">No history yet</h2>
                    <p className="text-gray-500 font-medium mb-8">Go swipe right on some tracks!</p>
                    <a href="/" className="px-8 py-3 bg-[#1DB954] text-black font-black rounded-full hover:scale-105 transition-transform">
                        Start Swiping
                    </a>
                </div>
            )}

            {/* Timeline */}
            <div className="relative space-y-12">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-white/5 hidden md:block" />

                {grouped.map(({ date, tracks }, gi) => (
                    <motion.div
                        key={date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: gi * 0.05 }}
                        className="relative"
                    >
                        {/* Date badge */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative z-10 w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 hidden md:flex">
                                <HiOutlineHeart className="text-[#1DB954] text-sm" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-white tracking-tight">{date}</span>
                                <span className="px-2 py-0.5 bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-full text-[10px] font-black text-[#1DB954] uppercase tracking-widest">
                                    {tracks.length} liked
                                </span>
                            </div>
                        </div>

                        {/* Tracks for this day */}
                        <div className="md:ml-14 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {tracks.map((track, ti) => (
                                <motion.div
                                    key={track.track_id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: ti * 0.03 }}
                                    onClick={() => togglePreview(track)}
                                    className="group flex flex-col gap-2 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                                >
                                    {/* Cover */}
                                    <div className="relative aspect-square overflow-hidden rounded-xl">
                                        {track.cover_url
                                            ? <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            : <div className="w-full h-full bg-white/5 flex items-center justify-center"><HiOutlineMusicNote className="text-gray-600 text-2xl" /></div>
                                        }
                                        {/* Playing indicator */}
                                        {playing === track.track_id && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-[3px]">
                                                {[1, 2, 3].map(b => (
                                                    <span key={b} className="w-1 bg-[#1DB954] rounded-full animate-bounce" style={{ height: `${b * 4 + 4}px`, animationDelay: `${b * 0.1}s` }} />
                                                ))}
                                            </div>
                                        )}
                                        {/* Heart badge */}
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500/80 rounded-lg flex items-center justify-center">
                                            <HiOutlineHeart className="text-white text-xs" />
                                        </div>
                                        {/* Time */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                                            <span className="text-[9px] font-bold text-gray-400">
                                                {new Date(track.liked_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[#1DB954] truncate mt-0.5">{track.artist}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
