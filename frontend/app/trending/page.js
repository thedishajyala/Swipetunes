"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineFire, HiOutlineMusicNote, HiOutlinePlay } from "react-icons/hi";

export default function TrendingPage() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(null);
    const [audioRef, setAudioRef] = useState(null);

    useEffect(() => {
        fetch("/api/trending")
            .then(r => r.json())
            .then(data => { setTracks(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

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

    const rankColor = r => r === 1 ? "text-yellow-400" : r === 2 ? "text-gray-300" : r === 3 ? "text-orange-400" : "text-gray-600";
    const rankBg = r => r === 1 ? "from-yellow-500/10 to-orange-500/5 border-yellow-500/20" : r === 2 ? "from-gray-400/10 to-gray-500/5 border-gray-400/20" : r === 3 ? "from-orange-500/10 to-red-500/5 border-orange-500/20" : "from-white/[0.02] to-transparent border-white/5";

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Loading Charts...</div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-10">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/40 to-red-500/40 border border-orange-500/30 rounded-2xl flex items-center justify-center">
                        <HiOutlineFire className="text-orange-300 text-xl" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">Global Trending</h1>
                    </div>
                </div>
                <p className="text-gray-500 font-medium text-sm ml-1">
                    Most liked tracks across all SwipeTunes users · updated live
                </p>
            </motion.div>

            {/* Podium — top 3 */}
            {tracks.length >= 3 && (
                <div className="grid grid-cols-3 gap-4">
                    {[tracks[1], tracks[0], tracks[2]].map((track, idx) => {
                        const actualRank = [2, 1, 3][idx];
                        const height = actualRank === 1 ? "h-44" : "h-36";
                        return (
                            <motion.div
                                key={track.track_id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => togglePreview(track)}
                                className={`flex flex-col items-center gap-3 cursor-pointer group ${actualRank === 1 ? "mt-0" : "mt-8"}`}
                            >
                                <div className="relative">
                                    {track.cover_url
                                        ? <img src={track.cover_url} alt={track.title} className={`${actualRank === 1 ? "w-24 h-24" : "w-20 h-20"} rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform`} />
                                        : <div className={`${actualRank === 1 ? "w-24 h-24" : "w-20 h-20"} bg-white/5 rounded-2xl flex items-center justify-center`}><HiOutlineMusicNote className="text-gray-500 text-2xl" /></div>
                                    }
                                    {playing === track.track_id && (
                                        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center gap-[3px]">
                                            {[1, 2, 3].map(b => <span key={b} className="w-1 bg-[#1DB954] rounded-full animate-bounce" style={{ height: `${b * 4 + 4}px`, animationDelay: `${b * 0.1}s` }} />)}
                                        </div>
                                    )}
                                    <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${actualRank === 1 ? "bg-yellow-400 text-black" : actualRank === 2 ? "bg-gray-300 text-black" : "bg-orange-400 text-black"}`}>
                                        {actualRank}
                                    </div>
                                </div>
                                <div className="text-center min-w-0 w-full px-1">
                                    <p className="text-sm font-black text-white truncate">{track.title}</p>
                                    <p className="text-[11px] font-black uppercase tracking-wider text-[#1DB954] truncate">{track.artist}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">❤️ {track.like_count} likes</p>
                                </div>
                                <div className={`w-full ${height} bg-gradient-to-t ${actualRank === 1 ? "from-yellow-500/20" : actualRank === 2 ? "from-gray-400/10" : "from-orange-500/10"} to-transparent rounded-t-2xl border-t ${actualRank === 1 ? "border-yellow-500/30" : "border-white/10"}`} />
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Full ranked list */}
            <div className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 pb-2">Full Chart</h2>
                {tracks.map((track, i) => (
                    <motion.div
                        key={track.track_id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => togglePreview(track)}
                        className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${rankBg(track.rank)} border cursor-pointer hover:scale-[1.01] transition-all group`}
                    >
                        {/* Rank */}
                        <span className={`w-8 text-center font-black text-lg shrink-0 ${rankColor(track.rank)}`}>
                            {track.rank <= 3 ? ["🥇", "🥈", "🥉"][track.rank - 1] : track.rank}
                        </span>

                        {/* Cover */}
                        <div className="relative w-12 h-12 shrink-0">
                            {track.cover_url
                                ? <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform" />
                                : <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center"><HiOutlineMusicNote className="text-gray-600" /></div>
                            }
                            {playing === track.track_id && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-[2px]">
                                    {[1, 2, 3].map(b => <span key={b} className="w-0.5 bg-[#1DB954] rounded-full animate-bounce" style={{ height: `${b * 3 + 3}px`, animationDelay: `${b * 0.1}s` }} />)}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{track.title}</p>
                            <p className="text-[11px] font-black uppercase tracking-wider text-[#1DB954] truncate">{track.artist}</p>
                        </div>

                        {/* Like count bar */}
                        <div className="hidden md:flex flex-col items-end gap-1">
                            <span className="text-xs font-black text-white">❤️ {track.like_count}</span>
                            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(track.like_count / (tracks[0]?.like_count || 1)) * 100}%` }}
                                    transition={{ delay: i * 0.02 + 0.3, duration: 0.6 }}
                                    className="h-full bg-gradient-to-r from-[#1DB954] to-[#19e68c] rounded-full"
                                />
                            </div>
                        </div>

                        {/* Play button */}
                        {track.preview_url && (
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#1DB954]/20 transition-all">
                                <HiOutlinePlay className="text-gray-400 group-hover:text-[#1DB954] text-sm ml-0.5" />
                            </div>
                        )}
                    </motion.div>
                ))}

                {tracks.length === 0 && (
                    <div className="text-center py-20 text-gray-600 font-medium">
                        No trending data yet — start swiping to build the charts! 🎵
                    </div>
                )}
            </div>
        </div>
    );
}
