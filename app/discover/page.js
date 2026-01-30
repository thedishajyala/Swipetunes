'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { HiOutlineSearch, HiOutlineUserAdd, HiOutlineCheck } from "react-icons/hi";
import { supabase } from "@/lib/supabase";

export default function DiscoverPage() {
    const { data: session } = useSession();
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followingIds, setFollowingIds] = useState(new Set());
    const [pendingIds, setPendingIds] = useState(new Set());

    useEffect(() => {
        if (session?.user?.id) {
            fetchUsers("");
            fetchFollowingStatus();
        }
    }, [session]);

    async function fetchFollowingStatus() {
        const { data: following } = await supabase
            .from('followers')
            .select('friend_id, status')
            .eq('user_id', session.user.id);

        const followingSet = new Set();
        const pendingSet = new Set();

        following?.forEach(f => {
            if (f.status === 'accepted') followingSet.add(f.friend_id);
            else pendingSet.add(f.friend_id);
        });

        setFollowingIds(followingSet);
        setPendingIds(pendingSet);
    }

    async function fetchUsers(query) {
        setLoading(true);
        try {
            const res = await fetch(`/api/users${query ? `?q=${query}` : ""}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error("Error searching users:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleFollow(targetId) {
        if (!session?.user?.id) return;

        try {
            const { error } = await supabase
                .from('followers')
                .insert({
                    user_id: session.user.id,
                    friend_id: targetId,
                    status: 'pending'
                });

            if (!error) {
                setPendingIds(prev => new Set([...prev, targetId]));
            }
        } catch (error) {
            console.error("Error following user:", error);
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-5xl font-black text-white tracking-tighter mb-8">Discover curators</h1>

            <div className="relative mb-12">
                <HiOutlineSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-2xl" />
                <input
                    type="text"
                    placeholder="Search by name..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-full py-5 pl-16 pr-8 text-white font-medium focus:outline-none focus:border-[#1DB954] transition-colors"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        fetchUsers(e.target.value);
                    }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {users.map(user => (
                    <div key={user.id} className="flex items-center gap-6 p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                        <img
                            src={user.profile_pic_url || "https://www.gravatar.com/avatar?d=mp"}
                            className="w-20 h-20 rounded-full border-2 border-white/10 object-cover"
                            alt={user.display_name}
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-white truncate">{user.display_name}</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Aesthetic User</p>
                        </div>

                        {followingIds.has(user.id) ? (
                            <button className="px-6 py-3 bg-white/5 text-gray-400 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-default">
                                <HiOutlineCheck /> Following
                            </button>
                        ) : pendingIds.has(user.id) ? (
                            <button className="px-6 py-3 bg-white/10 text-[#1DB954] rounded-full text-xs font-black uppercase tracking-widest cursor-default">
                                Sent
                            </button>
                        ) : (
                            <button
                                onClick={() => handleFollow(user.id)}
                                className="px-6 py-3 bg-[#1DB954] text-black rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_10px_20px_rgba(29,185,84,0.2)]"
                            >
                                <HiOutlineUserAdd /> Follow
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {!loading && users.length === 0 && (
                <div className="text-center py-24">
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No curators found</p>
                </div>
            )}
        </div>
    );
}
