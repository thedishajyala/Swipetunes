'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineBookOpen, HiOutlineCalendar, HiOutlineFire, HiOutlineSparkles, HiOutlineHeart, HiOutlinePaperAirplane, HiOutlineChatAlt2 } from "react-icons/hi";
import { getTrack } from "@/lib/spotify";

export default function MusicJournalPage() {
    const { data: session } = useSession();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, topAction: '', topActionCount: 0 });

    useEffect(() => {
        async function fetchJournal() {
            if (session?.accessToken) {
                try {
                    const res = await fetch('/api/journal');
                    const data = await res.json();

                    if (Array.isArray(data)) {
                        // Fetch track details for each entry
                        const detailedEntries = await Promise.all(
                            data.map(async (entry) => {
                                try {
                                    const trackData = await getTrack(session.accessToken, entry.track_id);
                                    return { ...entry, track: trackData };
                                } catch (e) {
                                    return entry;
                                }
                            })
                        );
                        setEntries(detailedEntries);

                        // Compute basic stats
                        const actionCounts = data.reduce((acc, curr) => {
                            acc[curr.action] = (acc[curr.action] || 0) + 1;
                            return acc;
                        }, {});

                        const topAction = Object.keys(actionCounts).reduce((a, b) => actionCounts[a] > actionCounts[b] ? a : b, '');

                        setStats({
                            total: data.length,
                            topAction,
                            topActionCount: actionCounts[topAction] || 0
                        });
                    }
                } catch (error) {
                    console.error("Journal fetch error:", error);
                } finally {
                    setLoading(false);
                }
            }
        }
        fetchJournal();
    }, [session]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Retracing your sonic journey...</div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-16 py-12 px-6">
            <header className="space-y-4">
                <div className="flex items-center gap-4 text-[#1DB954]">
                    <HiOutlineBookOpen className="text-4xl" />
                    <h1 className="text-6xl font-black text-white tracking-tighter">Music Journal</h1>
                </div>
                <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
                    Your sonic diary. Every swipe, reaction, and shared gem is archived here to build your musical legacy.
                </p>
            </header>

            {/* Journal Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#1DB954] opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>
                    <div className="text-4xl font-black text-white mb-2">{stats.total}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]">Total Signals</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500 opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>
                    <div className="text-4xl font-black text-white mb-2 capitalize">{stats.topAction || 'N/A'}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">Peak Expression</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500 opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>
                    <div className="text-4xl font-black text-white mb-2">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-500">Current Chapter</div>
                </div>
            </section>

            {/* Timeline */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                        <HiOutlineCalendar className="text-[#1DB954]" /> Recent Entries
                    </h3>
                </div>

                <div className="space-y-4 relative">
                    <div className="absolute left-6 top-4 bottom-4 w-px bg-white/10"></div>

                    {entries.map((entry, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={entry.id}
                            className="flex gap-8 group"
                        >
                            <div className="relative z-10 w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center shrink-0">
                                {entry.action === 'liked' && <HiOutlineHeart className="text-pink-500" />}
                                {entry.action === 'shared' && <HiOutlinePaperAirplane className="text-blue-500 rotate-45" />}
                                {entry.action === 'reacted' && <HiOutlineSparkles className="text-yellow-500" />}
                            </div>

                            <div className="flex-1 bg-white/[0.03] border border-white/5 p-6 rounded-[30px] hover:bg-white/[0.06] transition-all flex flex-col md:flex-row items-center gap-6">
                                {entry.track && (
                                    <>
                                        <img src={entry.track.album.images[0]?.url} className="w-16 h-16 rounded-xl shadow-lg" />
                                        <div className="flex-1 min-w-0 text-center md:text-left">
                                            <div className="text-sm font-black text-white truncate">{entry.track.name}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{entry.track.artists[0].name}</div>
                                        </div>
                                    </>
                                )}
                                <div className="px-4 py-2 bg-black/40 rounded-2xl border border-white/5 shrink-0">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {entries.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-[40px] border border-white/5 border-dashed">
                            <p className="text-gray-500 font-bold">Your diary is empty. Go discover some magic.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
