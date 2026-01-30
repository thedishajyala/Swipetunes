'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineLightningBolt, HiOutlineSparkles, HiOutlineFire,
    HiOutlineStatusOnline, HiOutlineClock, HiOutlineShare,
    HiOutlineHeart, HiOutlineMusicNote
} from "react-icons/hi";
import toast from "react-hot-toast";

const MOODS = [
    { id: 'vibe', name: 'Standard Vibe', icon: <HiOutlineLightningBolt />, color: '#1DB954' },
    { id: 'morning', name: 'Morning Chill', icon: <HiOutlineSparkles />, color: '#7bbcfd' },
    { id: 'workout', name: 'High Energy', icon: <HiOutlineFire />, color: '#ff6b6b' },
    { id: 'focus', name: 'Deep Focus', icon: <HiOutlineClock />, color: '#a29bfe' }
];

export default function RecommendationsPage() {
    const { data: session } = useSession();
    const [mode, setMode] = useState('vibe');
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.accessToken) {
            fetchAIRecommendations();
        }
    }, [session, mode]);

    async function fetchAIRecommendations() {
        setLoading(true);
        try {
            const res = await fetch(`/api/ai-recommendations?mode=${mode}`);
            const data = await res.json();
            if (Array.isArray(data)) setTracks(data);
            else toast.error("Algorithm is recalibrating...");
        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleShare(track) {
        window.dispatchEvent(new CustomEvent('share-track', { detail: { trackId: track.id, track } }));
        toast.success("Ready to share with curators!");
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-12">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white tracking-tighter">AI Discovery</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Neural suggestions based on your swipes & social activity.</p>
                </div>

                <div className="flex flex-wrap gap-2 bg-white/[0.03] border border-white/5 p-2 rounded-[30px]">
                    {MOODS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m.id ? 'bg-[#1DB954] text-black shadow-xl' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
                        >
                            {m.icon} {m.name}
                        </button>
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-24 text-center"
                    >
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[40px] flex items-center justify-center mx-auto mb-6 animate-spin">
                            <HiOutlineStatusOnline className="text-3xl text-[#1DB954]" />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tighter animate-pulse">Running Neural Models...</h3>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {tracks.map((track, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={track.id}
                                className="group relative bg-white/[0.03] border border-white/5 rounded-[40px] p-6 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-2xl"
                            >
                                <div className="relative aspect-square mb-6 rounded-3xl overflow-hidden shadow-xl">
                                    <img src={track.album?.images[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                        <button
                                            onClick={() => handleShare(track)}
                                            className="w-full py-3 bg-[#1DB954] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineShare /> Share with Curators
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-lg font-black text-white truncate tracking-tight">{track.name}</span>
                                        <span className="text-[10px] font-black uppercase text-[#1DB954] tracking-widest mt-1">{track.artists[0]?.name}</span>
                                    </div>

                                    {/* AI Reasoning Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[7px] font-black uppercase text-gray-500">Neural Pick</span>
                                        {track.popularity > 70 && <span className="px-2 py-1 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-lg text-[7px] font-black uppercase text-[#ff6b6b]">Trending</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {tracks.length === 0 && !loading && (
                <div className="p-24 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[60px]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <HiOutlineMusicNote className="text-4xl text-gray-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter">Algorithm is silent.</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">Interact more with the feed and curators to train your personal model.</p>
                </div>
            )}
        </div>
    );
}
