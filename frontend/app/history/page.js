"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineHeart, HiOutlineMusicNote, HiOutlineSearch, HiOutlinePlay, HiOutlineExternalLink } from "react-icons/hi";

export default function LikedSongsPage() {
    const { data: session } = useSession();
    const [tracks, setTracks] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [playing, setPlaying] = useState(null); // track_id of currently playing preview
    const [audioRef, setAudioRef] = useState(null);
    const [view, setView] = useState("grid"); // "grid" | "list"
    const [exporting, setExporting] = useState(false);
    const [exportResult, setExportResult] = useState(null); // { playlistUrl, trackCount }

    useEffect(() => {
        async function fetchLikes() {
            if (!session?.user) return;

            const lookupId = session.user.spotify_id || session.user.id;

            // Resolve internal UUID
            const { data: profile } = await supabase
                .from("users")
                .select("id")
                .eq("spotify_id", lookupId)
                .maybeSingle();

            const internalId = profile ? profile.id : session.user.id;

            // Fetch likes joined with songs
            const { data: likes, error } = await supabase
                .from("likes")
                .select("track_id, created_at, songs(title, artist, album, cover_url, preview_url)")
                .eq("user_id", internalId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("LikedSongs: fetch error:", error);
            } else {
                const formatted = (likes || []).map(l => ({
                    track_id: l.track_id,
                    liked_at: l.created_at,
                    title: l.songs?.title || "Unknown Track",
                    artist: l.songs?.artist || "Unknown Artist",
                    album: l.songs?.album || "",
                    cover_url: l.songs?.cover_url || null,
                    preview_url: l.songs?.preview_url || null,
                }));
                setTracks(formatted);
                setFiltered(formatted);
            }
            setLoading(false);
        }

        if (session) fetchLikes();
        else if (session === null) setLoading(false);
    }, [session]);

    // Search filter
    useEffect(() => {
        const q = search.toLowerCase();
        if (!q) { setFiltered(tracks); return; }
        setFiltered(tracks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            t.album.toLowerCase().includes(q)
        ));
    }, [search, tracks]);

    // Audio preview
    function togglePreview(track) {
        if (playing === track.track_id) {
            audioRef?.pause();
            setPlaying(null);
            setAudioRef(null);
            return;
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

    async function exportToSpotify() {
        setExporting(true);
        setExportResult(null);
        try {
            const res = await fetch("/api/export-playlist", { method: "POST" });
            const data = await res.json();
            if (data.playlistUrl) {
                setExportResult(data);
                window.open(data.playlistUrl, "_blank");
            } else {
                setExportResult({ error: data.error || "Export failed." });
            }
        } catch (e) {
            setExportResult({ error: "Something went wrong." });
        }
        setExporting(false);
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Loading Liked Songs...</div>
        </div>
    );

    if (!session) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <HiOutlineHeart className="text-5xl text-[#1DB954] mb-4" />
            <h2 className="text-2xl font-black text-white">Sign in to see your liked songs</h2>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-12 px-6 space-y-10">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#1DB954] to-[#19e68c] rounded-2xl flex items-center justify-center shadow-xl shadow-[#1DB954]/30">
                            <HiOutlineHeart className="text-black text-xl" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">Liked Songs</h1>
                    </div>
                    <p className="text-gray-500 font-medium text-sm ml-1">
                        {tracks.length} track{tracks.length !== 1 ? "s" : ""} saved
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    {/* Export button */}
                    {tracks.length > 0 && (
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={exportToSpotify}
                                disabled={exporting}
                                className="flex items-center gap-2 px-5 py-3 bg-[#1DB954] text-black font-black text-sm rounded-2xl hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1DB954]/20"
                            >
                                {exporting ? (
                                    <><span className="animate-spin">↻</span> Exporting...</>
                                ) : (
                                    <><HiOutlineExternalLink className="text-base" /> Export to Spotify</>
                                )}
                            </button>
                            {exportResult && (
                                <p className={`text-xs font-bold ${exportResult.error ? "text-red-400" : "text-[#1DB954]"}`}>
                                    {exportResult.error
                                        ? `⚠ ${exportResult.error}`
                                        : `✓ Playlist created with ${exportResult.trackCount} tracks!`
                                    }
                                </p>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-64">
                            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search songs, artists..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 text-sm font-medium focus:outline-none focus:border-[#1DB954]/50 transition-colors"
                            />
                        </div>
                        {/* View toggle */}
                        <div className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            {["grid", "list"].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${view === v ? "bg-[#1DB954] text-black" : "text-gray-500 hover:text-white"}`}
                                >
                                    {v === "grid" ? "⊞" : "≡"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Empty state */}
            {tracks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                        <HiOutlineMusicNote className="text-4xl text-gray-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter mb-3">No liked songs yet</h2>
                    <p className="text-gray-500 font-medium mb-8">Go swipe right on some tracks to fill this up!</p>
                    <a href="/" className="px-8 py-3 bg-[#1DB954] text-black font-black rounded-full hover:scale-105 transition-transform">
                        Start Swiping
                    </a>
                </div>
            )}

            {/* No results from search */}
            {tracks.length > 0 && filtered.length === 0 && (
                <div className="text-center py-16 text-gray-500 font-medium">
                    No results for &ldquo;{search}&rdquo;
                </div>
            )}

            {/* Grid View */}
            <AnimatePresence mode="wait">
                {view === "grid" && filtered.length > 0 && (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
                    >
                        {filtered.map((track, i) => (
                            <motion.div
                                key={track.track_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="group flex flex-col gap-3 p-4 rounded-[24px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                                onClick={() => togglePreview(track)}
                            >
                                <div className="relative aspect-square overflow-hidden rounded-xl shadow-lg">
                                    {track.cover_url
                                        ? <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        : <div className="w-full h-full bg-white/5 flex items-center justify-center"><HiOutlineMusicNote className="text-gray-600 text-3xl" /></div>
                                    }
                                    {/* Play overlay */}
                                    <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${playing === track.track_id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                        {track.preview_url && (
                                            <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl">
                                                {playing === track.track_id
                                                    ? <span className="w-3 h-3 bg-black rounded-sm" />
                                                    : <HiOutlinePlay className="text-black text-lg ml-0.5" />
                                                }
                                            </div>
                                        )}
                                    </div>
                                    {/* Playing indicator */}
                                    {playing === track.track_id && (
                                        <div className="absolute top-2 right-2 flex gap-[3px] items-end h-4">
                                            {[1, 2, 3].map(b => (
                                                <span key={b} className="w-1 bg-[#1DB954] rounded-full animate-bounce" style={{ height: `${b * 4 + 4}px`, animationDelay: `${b * 0.1}s` }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{track.title}</p>
                                    <p className="text-[11px] font-black uppercase tracking-wider text-[#1DB954] truncate mt-0.5">{track.artist}</p>
                                </div>
                                <p className="text-[10px] text-gray-600 font-medium">
                                    {new Date(track.liked_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* List View */}
                {view === "list" && filtered.length > 0 && (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                    >
                        {filtered.map((track, i) => (
                            <motion.div
                                key={track.track_id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                                onClick={() => togglePreview(track)}
                            >
                                {/* Index */}
                                <span className="text-xs font-black text-gray-600 w-5 text-right shrink-0 group-hover:hidden">
                                    {i + 1}
                                </span>
                                <div className="hidden group-hover:flex w-5 items-center justify-center shrink-0">
                                    {track.preview_url
                                        ? (playing === track.track_id
                                            ? <span className="w-3 h-3 bg-[#1DB954] rounded-sm" />
                                            : <HiOutlinePlay className="text-[#1DB954] text-base" />)
                                        : <HiOutlineMusicNote className="text-gray-600 text-base" />
                                    }
                                </div>

                                {/* Cover */}
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                    {track.cover_url
                                        ? <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full bg-white/5 flex items-center justify-center"><HiOutlineMusicNote className="text-gray-600 text-lg" /></div>
                                    }
                                    {playing === track.track_id && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-[2px]">
                                            {[1, 2, 3].map(b => (
                                                <span key={b} className="w-1 bg-[#1DB954] rounded-full animate-bounce" style={{ height: `${b * 3 + 3}px`, animationDelay: `${b * 0.1}s` }} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{track.title}</p>
                                    <p className="text-xs text-gray-500 truncate font-medium">{track.artist} {track.album ? `· ${track.album}` : ""}</p>
                                </div>

                                {/* Date */}
                                <span className="text-xs text-gray-600 font-medium shrink-0 hidden sm:block">
                                    {new Date(track.liked_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>

                                {/* Heart */}
                                <HiOutlineHeart className="text-[#1DB954] text-lg shrink-0" />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
