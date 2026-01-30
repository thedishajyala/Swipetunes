'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { HiOutlineUserAdd, HiOutlineChatAlt, HiOutlineHeart, HiOutlineChartBar, HiOutlineFire } from "react-icons/hi";
import Sidebar from "@/components/Sidebar";

export default function DiscoverTrendsPage() {
    const { data: session } = useSession();
    const [trending, setTrending] = useState([]);
    const [friendsActivity, setFriendsActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            fetchTrends();
        }
    }, [session]);

    async function fetchTrends() {
        const res = await fetch('/api/feed');
        const data = await res.json();
        if (data.trending) setTrending(data.trending);
        if (data.friends) setFriendsActivity(data.friends);
        setLoading(false);
    }

    if (loading) return <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Scanning Global Signals...</div>;

    return (
        <div className="max-w-7xl mx-auto p-8 flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-12">
                <header className="space-y-4">
                    <h1 className="text-6xl font-black text-white tracking-tighter">Exploration</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Trending tracks and social highlights.</p>
                </header>

                <section className="space-y-8">
                    <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                        <HiOutlineFire className="text-orange-500" /> Viral on Swipetunes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trending.map((track, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={track.id}
                                className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                                    <img src={track.album_art} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white truncate">{track.title}</h3>
                                    <p className="text-[10px] font-black uppercase text-[#1DB954] mt-1">{track.artist}</p>
                                </div>
                                <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <HiOutlineHeart className="text-red-500" />
                                    <span className="text-[10px] font-black">{track.liked_by?.length || 0}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>

            <aside className="w-full lg:w-96 space-y-12">
                <section className="bg-gradient-to-br from-[#1DB954]/20 to-transparent border border-[#1DB954]/20 p-8 rounded-[40px]">
                    <h3 className="text-xl font-black text-white tracking-tighter mb-4 flex items-center gap-2">
                        <HiOutlineChartBar className="text-[#1DB954]" /> Swipetunes Insight
                    </h3>
                    <p className="text-xs font-medium text-gray-400 leading-relaxed mb-6">Curators are currently obsessed with high-energy tracks. Join the rotation to earn the <b>"Mood Master"</b> badge.</p>
                    <button className="w-full py-4 bg-[#1DB954] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#1DB954]/20">
                        View Analytics
                    </button>
                </section>

                <section className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600">Active Curators</h4>
                    <div className="space-y-4">
                        {friendsActivity.slice(0, 5).map((activity, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                <img src={activity.likers?.profile_pic_url || "https://www.gravatar.com/avatar?d=mp"} className="w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all border border-white/5" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{activity.likers?.display_name}</span>
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-[#1DB954]">Listening to {activity.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </aside>
        </div>
    );
}
