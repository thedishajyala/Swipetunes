'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { getTopTracks, getTopArtists, getCurrentlyPlaying } from "@/lib/spotify";
import ArtistGrid from "@/components/ArtistGrid";
import {
    HiOutlineUserCircle, HiOutlineUsers, HiOutlineUserAdd, HiOutlineCheck,
    HiOutlineX, HiOutlineGlobeAlt, HiOutlineLightningBolt, HiOutlineHeart,
    HiOutlineFire, HiOutlineSparkles, HiOutlineStar, HiOutlineUserGroup,
    HiOutlineMusicNote
} from "react-icons/hi";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState({ xp: 0, level: 1, streak_count: 0 });
    const [achievements, setAchievements] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [requests, setRequests] = useState([]);
    const [tasteProfile, setTasteProfile] = useState(null);
    const [challenges, setChallenges] = useState([]);
    const [recalculating, setRecalculating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfileData() {
            if (session?.accessToken && session.user?.id) {
                try {
                    const [tracksData, artistsData, playingData] = await Promise.all([
                        getTopTracks(session.accessToken, 'medium_term', 5),
                        getTopArtists(session.accessToken, 'medium_term', 5),
                        getCurrentlyPlaying(session.accessToken)
                    ]);

                    const gamificationRes = await fetch('/api/gamification');
                    const gamificationData = await gamificationRes.json();
                    if (gamificationData.stats) setStats(gamificationData.stats);
                    if (gamificationData.achievements) setAchievements(gamificationData.achievements);

                    setTopTracks(tracksData.items || []);
                    setTopArtists(artistsData.items.map(a => ({
                        name: a.name,
                        image: a.images[0]?.url,
                        genres: a.genres
                    })));
                    setCurrentlyPlaying(playingData);

                    const [followersData, followingData, requestsData] = await Promise.all([
                        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('friend_id', session.user.id).eq('status', 'accepted'),
                        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('status', 'accepted'),
                        supabase.from('followers').select('*, users!user_id(id, display_name, profile_pic_url)').eq('friend_id', session.user.id).eq('status', 'pending')
                    ]);

                    setFollowersCount(followersData.count || 0);
                    setFollowingCount(followingData.count || 0);
                    setRequests(requestsData.data || []);

                    const { data: tasteData } = await supabase
                        .from('user_taste_profile')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single();
                    if (tasteData) setTasteProfile(tasteData);

                    const challengesRes = await fetch('/api/challenges');
                    const challengesData = await challengesRes.json();
                    if (Array.isArray(challengesData)) setChallenges(challengesData);
                } catch (error) {
                    console.error("Error fetching profile data:", error);
                } finally {
                    setLoading(false);
                }
            }
        }
        fetchProfileData();

        const channel = supabase
            .channel('profile_requests')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'followers',
                filter: `friend_id=eq.${session?.user?.id}`
            }, () => fetchProfileData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [session, status]);

    async function recalculateVibe() {
        setRecalculating(true);
        try {
            const res = await fetch('/api/profile/recalculate', { method: 'POST' });
            const data = await res.json();
            if (data.mood_tag) {
                setTasteProfile(data);
                toast.success(`Identity Updated: ${data.mood_tag}`);
                // Add XP for updating identity
                fetch('/api/gamification', { method: 'POST', body: JSON.stringify({ action: 'daily_streak' }) });
            } else if (data.message) {
                toast(data.message, { icon: '🔍' });
            }
        } catch (e) {
            toast.error("Vibe recalibration failed.");
        } finally {
            setRecalculating(false);
        }
    }

    async function handleRequest(requestId, status) {
        try {
            if (status === 'accepted') {
                await supabase.from('followers').update({ status: 'accepted' }).eq('id', requestId);
                toast.success("Request accepted!");
            } else {
                await supabase.from('followers').delete().eq('id', requestId);
                toast.error("Request rejected.");
            }
            setRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error("Error handling request:", error);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Scanning Identity...</div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-16 py-12 px-6">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#1DB954] to-[#19e68c] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <img
                            src={session?.user?.image || "https://www.gravatar.com/avatar?d=mp"}
                            className="w-48 h-48 rounded-full object-cover border-4 border-white/5 relative z-10"
                        />
                        <div className="absolute bottom-2 right-2 bg-[#1DB954] p-3 rounded-2xl shadow-xl z-20">
                            <HiOutlineGlobeAlt className="text-black text-xl" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <h1 className="text-7xl font-black text-white tracking-tighter mb-2">
                            {session?.user?.name}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-8">
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-white">{followersCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]">Followers</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-white">{followingCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]">Following</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-white">{requests.length}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Pending</span>
                            </div>
                        </div>

                        {/* AI Vibe Badge */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md"
                            >
                                <div className="text-xl">
                                    {tasteProfile?.mood_tag?.includes('🌙') ? '🌙' :
                                        tasteProfile?.mood_tag?.includes('⚡') ? '⚡' :
                                            tasteProfile?.mood_tag?.includes('✨') ? '✨' :
                                                tasteProfile?.mood_tag?.includes('☕') ? '☕' : '🎧'}
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Current AI Vibe</span>
                                    <span className="text-sm font-black text-[#1DB954] tracking-tight truncate max-w-[150px]">
                                        {tasteProfile?.mood_tag || "Scanning Identity..."}
                                    </span>
                                </div>
                            </motion.div>

                            <button
                                onClick={recalculateVibe}
                                disabled={recalculating}
                                className={`p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all ${recalculating ? 'animate-spin' : ''}`}
                                title="Recalculate Vibe"
                            >
                                <HiOutlineLightningBolt />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Follow Requests Portal */}
                <AnimatePresence>
                    {requests.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mt-12 bg-white/[0.03] border border-white/10 rounded-[40px] p-8"
                        >
                            <h3 className="text-xl font-black text-white tracking-tighter mb-6 flex items-center gap-3">
                                <HiOutlineUsers className="text-[#1DB954]" /> Pending Connections
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {requests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between bg-black/40 p-4 rounded-3xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <img src={req.users.profile_pic_url || "https://www.gravatar.com/avatar?d=mp"} className="w-10 h-10 rounded-full" />
                                            <span className="font-bold text-sm text-white truncate max-w-[100px]">{req.users.display_name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRequest(req.id, 'accepted')} className="p-2 bg-[#1DB954] text-black rounded-xl hover:scale-105 transition-all"><HiOutlineCheck /></button>
                                            <button onClick={() => handleRequest(req.id, 'rejected')} className="p-2 bg-white/10 text-white rounded-xl hover:scale-105 transition-all"><HiOutlineX /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>

            {/* Gamification Dashboard */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#1DB954] text-black rounded-3xl flex items-center justify-center text-3xl font-black mb-4 shadow-xl shadow-[#1DB954]/20">
                        {stats.level}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Identity Level</span>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.xp % 500) / 5}%` }}
                            className="h-full bg-gradient-to-r from-[#1DB954] to-[#19e68c]"
                        />
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-400 opacity-60">{stats.xp % 500} / 500 XP to next level</span>
                </div>
            </section>

            {/* Weekly Challenges Portal */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                        <HiOutlineLightningBolt className="text-[#1DB954]" /> Weekly Rotations
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Resets in 4 Days</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {challenges.map((challenge, i) => (
                        <div key={challenge.id} className="relative bg-white/5 border border-white/10 p-6 rounded-3xl overflow-hidden group">
                            {challenge.is_completed && (
                                <div className="absolute inset-0 bg-[#1DB954]/10 backdrop-blur-sm flex items-center justify-center z-10">
                                    <div className="bg-[#1DB954] text-black px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg rotate-3">Mission Complete</div>
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{challenge.title}</h4>
                                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">Goal: {challenge.target} {challenge.type}s</p>
                                </div>
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl">
                                    {challenge.type === 'liked' ? '❤️' : challenge.type === 'shared' ? '🔗' : '🔥'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-500">Progress</span>
                                    <span className="text-[#1DB954]">{challenge.progress} / {challenge.target}</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                                        className="h-full bg-[#1DB954]"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {challenges.length === 0 && (
                        <div className="col-span-full py-12 bg-white/5 rounded-3xl border border-white/5 border-dashed flex flex-col items-center justify-center text-gray-500">
                            <span className="text-sm font-bold">No active challenges.</span>
                            <span className="text-[10px] uppercase tracking-widest mt-2">Check back during the next peak cycle.</span>
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-12">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-white tracking-tighter">Current Rotations</h2>
                    <HiOutlineFire className="text-[#1DB954] text-4xl" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {topTracks.map((track, i) => (
                        <div key={track.id} className="flex flex-col gap-4 p-5 rounded-[30px] bg-white/[0.03] hover:bg-white/10 transition-all group cursor-pointer border border-white/5 shadow-xl">
                            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
                                <img src={track.album?.images[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <HiOutlineHeart className="text-white text-3xl" />
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-white truncate">{track.name}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954] truncate mt-1">{track.artists[0]?.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-12">
                <h2 className="text-4xl font-black text-white tracking-tighter">Aesthetic Influences</h2>
                <ArtistGrid artists={topArtists} />
            </section>
        </div>
    );
}
