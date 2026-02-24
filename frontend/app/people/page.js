'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
    HiOutlineUserAdd, HiOutlineCheck, HiOutlineMusicNote,
    HiOutlineUserGroup, HiOutlineLightningBolt
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function PeoplePage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [matches, setMatches] = useState({});          // userId → match data
    const [loading, setLoading] = useState(true);
    const [followed, setFollowed] = useState(new Set());

    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from('users')
                .select('id, display_name, profile_pic_url, spotify_id')
                .neq('id', session?.user?.id || '')
                .limit(30);
            setUsers(data || []);
            setLoading(false);

            // Pre-load match % for each user
            (data || []).forEach(user => fetchMatch(user.id));
        }
        if (session) load();
    }, [session]);

    const fetchMatch = useCallback(async (userId) => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/taste-match?userId=${userId}`);
            const data = await res.json();
            if (data.matchPct !== undefined) {
                setMatches(prev => ({ ...prev, [userId]: data }));
            }
        } catch { }
    }, []);

    const handleFollow = async (userId) => {
        if (followed.has(userId)) return;
        setFollowed(prev => new Set([...prev, userId]));
        await supabase.from('followers').upsert({
            user_id: session.user.id,
            friend_id: userId,
            status: 'pending',
        });
        toast.success('Follow request sent! 🎵');
    };

    const getMatchColor = (pct) => {
        if (pct >= 70) return 'text-[#1DB954]';
        if (pct >= 40) return 'text-yellow-400';
        return 'text-gray-500';
    };

    const getBarColor = (pct) => {
        if (pct >= 70) return 'from-[#1DB954] to-emerald-400';
        if (pct >= 40) return 'from-yellow-400 to-orange-400';
        return 'from-gray-600 to-gray-500';
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-6 space-y-10">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/20 rounded-2xl flex items-center justify-center">
                        <HiOutlineUserGroup className="text-purple-300 text-xl" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">Discover People</h1>
                    </div>
                </div>
                <p className="text-gray-500 font-medium text-sm ml-1">Find listeners who share your taste</p>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Finding music people...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {users.map((user, i) => {
                        const match = matches[user.id];
                        const isFollowed = followed.has(user.id);
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-[28px] p-6 flex flex-col gap-4 transition-all"
                            >
                                {/* Top row */}
                                <div className="flex items-center gap-4">
                                    {user.profile_pic_url
                                        ? <img src={user.profile_pic_url} className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shrink-0" />
                                        : <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-black text-white shrink-0">{user.display_name?.[0] || '?'}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-white text-base truncate">{user.display_name || 'Anonymous'}</h3>
                                        {match && (
                                            <p className={`text-xs font-black mt-0.5 flex items-center gap-1.5 ${getMatchColor(match.matchPct)}`}>
                                                <span>{match.emoji}</span> {match.label}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleFollow(user.id)}
                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all border ${isFollowed
                                                ? 'bg-[#1DB954]/10 border-[#1DB954]/30 text-[#1DB954]'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {isFollowed ? <HiOutlineCheck size={16} /> : <HiOutlineUserAdd size={16} />}
                                    </button>
                                </div>

                                {/* Match bar */}
                                {match !== undefined ? (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Taste Match</span>
                                            <span className={`text-sm font-black ${getMatchColor(match.matchPct)}`}>{match.matchPct}%</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${match.matchPct}%` }}
                                                transition={{ duration: 0.7, delay: i * 0.04 + 0.2 }}
                                                className={`h-full rounded-full bg-gradient-to-r ${getBarColor(match.matchPct)}`}
                                            />
                                        </div>
                                        <div className="flex gap-4 pt-1">
                                            <span className="text-[10px] text-gray-600 font-medium flex items-center gap-1">
                                                <HiOutlineMusicNote className="text-gray-700" />
                                                {match.sharedSongs} shared songs
                                            </span>
                                            <span className="text-[10px] text-gray-600 font-medium flex items-center gap-1">
                                                <HiOutlineLightningBolt className="text-gray-700" />
                                                {match.sharedArtists?.length || 0} artists
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-1.5 rounded-full bg-white/5 animate-pulse" />
                                )}
                            </motion.div>
                        );
                    })}

                    {users.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-600">
                            No other listeners yet. Invite your friends! 🎵
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
