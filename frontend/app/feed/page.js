'use client';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HiOutlineUserGroup,
    HiOutlineGlobeAlt,
    HiOutlineLightningBolt,
    HiHeart,
    HiOutlineHeart,
    HiOutlineChatAlt,
    HiOutlinePaperAirplane
} from "react-icons/hi";
import { supabase } from "@/lib/supabase";
import SwipeCard from "@/components/SwipeCard";
import SkeletonCard from "@/components/SkeletonCard";

export default function FeedPage() {
    const { data: session } = useSession();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Social States
    const [likes, setLikes] = useState({}); // { track_id: count }
    const [userLikes, setUserLikes] = useState(new Set()); // Tracks current user liked
    const [comments, setComments] = useState({}); // { track_id: [comments] }
    const [commentInput, setCommentInput] = useState("");
    const [posts, setPosts] = useState([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [postCaption, setPostCaption] = useState("");
    const [postHashtags, setPostHashtags] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchFeed();

            // Realtime subscription for everything
            const channel = supabase
                .channel('feed_interactions')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => fetchFeed())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload) => {
                    handleLikeRealtime(payload);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
                    handleCommentRealtime(payload);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            }
        }
    }, [session]);

    async function fetchFeed() {
        try {
            const res = await fetch('/api/feed');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTracks(data);

                // Fetch initial likes and comments for the loaded tracks
                const trackIds = data.map(t => t.track_id);
                if (trackIds.length > 0) {
                    fetchInteractions(trackIds);
                }

                // Fetch User Posts
                const postsRes = await fetch('/api/posts');
                const postsData = await postsRes.json();
                if (Array.isArray(postsData)) {
                    setPosts(postsData);
                }
            }
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchInteractions(trackIds) {
        try {
            // 1. Fetch Like Counts
            const { data: likesData } = await supabase
                .from('likes')
                .select('track_id')
                .in('track_id', trackIds);

            const counts = {};
            likesData?.forEach(l => {
                counts[l.track_id] = (counts[l.track_id] || 0) + 1;
            });
            setLikes(counts);

            // 2. Fetch Current User's Likes
            const { data: myLikes } = await supabase
                .from('likes')
                .select('track_id')
                .eq('user_id', session.user.id)
                .in('track_id', trackIds);

            setUserLikes(new Set(myLikes?.map(l => l.track_id)));

            // 3. Fetch Comments
            const { data: commentsData } = await supabase
                .from('comments')
                .select('*, users(display_name, profile_pic_url)')
                .in('track_id', trackIds)
                .order('created_at', { ascending: true });

            const commentsMap = {};
            commentsData?.forEach(c => {
                if (!commentsMap[c.track_id]) commentsMap[c.track_id] = [];
                commentsMap[c.track_id].push(c);
            });
            setComments(commentsMap);

        } catch (error) {
            console.error("Error fetching interactions:", error);
        }
    }

    function handleLikeRealtime(payload) {
        if (payload.eventType === 'INSERT') {
            setLikes(prev => ({
                ...prev,
                [payload.new.track_id]: (prev[payload.new.track_id] || 0) + 1
            }));
            if (payload.new.user_id === session.user.id) {
                setUserLikes(prev => new Set([...prev, payload.new.track_id]));
            }
        } else if (payload.eventType === 'DELETE') {
            // Note: Old payload might not have track_id depending on setup, 
            // but usually we'd need to re-fetch counts or handle better if not.
            // For simplicity, we can re-fetch for the current track.
            if (tracks[currentIndex]) fetchInteractions([tracks[currentIndex].track_id]);
        }
    }

    async function handleCommentRealtime(payload) {
        if (payload.eventType === 'INSERT') {
            // Fetch users for the new comment
            const { data: newComment } = await supabase
                .from('comments')
                .select('*, users(display_name, profile_pic_url)')
                .eq('id', payload.new.id)
                .single();

            setComments(prev => ({
                ...prev,
                [payload.new.track_id]: [...(prev[payload.new.track_id] || []), newComment]
            }));
        }
    }

    async function toggleLike(trackId) {
        const isLiked = userLikes.has(trackId);
        try {
            if (isLiked) {
                await supabase.from('likes').delete().eq('user_id', session.user.id).eq('track_id', trackId);
                setUserLikes(prev => {
                    const next = new Set(prev);
                    next.delete(trackId);
                    return next;
                });
                setLikes(prev => ({ ...prev, [trackId]: Math.max(0, (prev[trackId] || 0) - 1) }));
            } else {
                await supabase.from('likes').insert({ user_id: session.user.id, track_id: trackId });
                setUserLikes(prev => new Set([...prev, trackId]));
                setLikes(prev => ({ ...prev, [trackId]: (prev[trackId] || 0) + 1 }));
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }

    async function postComment(e) {
        e.preventDefault();
        if (!commentInput.trim() || isSubmitting) return;

        const trackId = tracks[currentIndex].track_id;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('comments').insert({
                user_id: session.user.id,
                track_id: trackId,
                comment_text: commentInput
            });
            if (!error) setCommentInput("");
        } catch (error) {
            console.error("Error posting comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function createPost() {
        if (!postCaption.trim() || isSubmitting) return;
        setIsSubmitting(true);
        const trackId = tracks[currentIndex].track_id;
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify({
                    track_id: trackId,
                    caption: postCaption,
                    hashtags: postHashtags.split(' ').filter(h => h.startsWith('#'))
                })
            });
            if (res.ok) {
                setPostCaption("");
                setPostHashtags("");
                setShowPostModal(false);
                fetchFeed();
            }
        } catch (error) {
            console.error("Post creation error:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <SkeletonCard />
                <p className="mt-8 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Scanning the airwaves...</p>
            </div>
        );
    }

    if (tracks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8">
                    <HiOutlineGlobeAlt className="text-4xl text-gray-400" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Feed is Quiet</h2>
                <p className="text-gray-400 font-medium mb-10">Follow more curators to see what's trending in your circle.</p>
                <div className="flex gap-4">
                    <a
                        href="/discover"
                        className="px-8 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform"
                    >
                        Find Friends
                    </a>
                </div>
            </div>
        );
    }

    const track = tracks[currentIndex];
    const currentComments = comments[track.track_id] || [];

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-2">Social Feed</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <HiOutlineUserGroup className="text-[#1DB954]" /> Friends' latest rotations
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowPostModal(true)}
                        className="px-6 py-3 bg-[#1DB954] text-black font-black rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-green-500/20"
                    >
                        <HiOutlineLightningBolt /> Create Post
                    </button>
                    <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md flex items-center gap-2">
                        <HiOutlineLightningBolt className="text-[#1DB954]" />
                        <span className="text-xs font-black text-white uppercase tracking-tighter">Live Activity</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
                {/* Track Section */}
                <div className="flex flex-col items-center relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={track.track_id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg"
                        >
                            <SwipeCard
                                track={{
                                    id: track.track_id,
                                    name: track.title,
                                    artists: [{ name: track.artist }],
                                    album: { images: [{ url: track.cover_url }] },
                                    social: true
                                }}
                                isFeed={true}
                            />

                            <div className="mt-8 flex justify-between items-center px-4">
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => toggleLike(track.track_id)}
                                        className="flex items-center gap-2 text-2xl group transition-all"
                                    >
                                        {userLikes.has(track.track_id) ? (
                                            <HiHeart className="text-red-500 scale-125 transition-transform" />
                                        ) : (
                                            <HiOutlineHeart className="text-white hover:text-red-500 hover:scale-110 transition-all" />
                                        )}
                                        <span className="text-sm font-black text-white">{likes[track.track_id] || 0}</span>
                                    </button>
                                    <div className="flex items-center gap-2 text-2xl text-white">
                                        <HiOutlineChatAlt />
                                        <span className="text-sm font-black">{currentComments.length}</span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))}
                                        disabled={currentIndex === 0}
                                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white disabled:opacity-20 hover:bg-white/5 transition-all"
                                    >
                                        ←
                                    </button>
                                    <button
                                        onClick={() => setCurrentIndex((prev) => (prev < tracks.length - 1 ? prev + 1 : prev))}
                                        disabled={currentIndex === tracks.length - 1}
                                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-black disabled:opacity-20 hover:scale-105 transition-all"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Interaction Section (Comments) */}
                <div className="h-[600px] flex flex-col bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-lg font-black text-white uppercase tracking-tighter">Curator Dialogue</h2>
                        <span className="text-[10px] bg-[#1DB954]/20 text-[#1DB954] font-black px-2 py-1 rounded-md uppercase">Realtime</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {currentComments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                                <HiOutlineChatAlt className="text-4xl opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No signals yet. Start the conversation.</p>
                            </div>
                        ) : (
                            currentComments.map(comment => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={comment.id}
                                    className="flex gap-4"
                                >
                                    <img
                                        src={comment.users?.profile_pic_url || "https://www.gravatar.com/avatar?d=mp"}
                                        className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"
                                    />
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-white truncate">{comment.users?.display_name}</span>
                                            <span className="text-[8px] text-gray-600 font-bold uppercase">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 font-medium leading-relaxed break-words">{comment.comment_text}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <form onSubmit={postComment} className="p-6 border-t border-white/5 bg-black/20">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#1DB954] transition-all"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!commentInput.trim() || isSubmitting}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1DB954] rounded-xl flex items-center justify-center text-black disabled:opacity-50 disabled:bg-gray-700 transition-all hover:scale-105 active:scale-95"
                            >
                                <HiOutlinePaperAirplane className="rotate-90 translate-x-[1px]" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* User Posts Thread */}
            <section className="mt-20 space-y-12">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-white tracking-tighter">Identity Thread</h2>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Live Post Stream</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            key={post.id}
                            className="bg-white/[0.03] border border-white/10 p-6 rounded-[40px] space-y-4 hover:bg-white/[0.06] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <img src={post.users?.profile_pic_url || "https://www.gravatar.com/avatar?d=mp"} className="w-8 h-8 rounded-full" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white">{post.users?.display_name}</span>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {post.track && (
                                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5">
                                    <img src={post.track.album.images[0]?.url} className="w-12 h-12 rounded-xl" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-white truncate">{post.track.name}</div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-[#1DB954] truncate">{post.track.artists[0]?.name}</div>
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-gray-300 font-medium leading-relaxed italic">"{post.caption}"</p>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {post.hashtags?.map(h => (
                                    <span key={h} className="text-[10px] font-black text-[#1DB954] hover:underline cursor-pointer">{h}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Create Post Modal */}
            <AnimatePresence>
                {showPostModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[50px] p-10 relative shadow-2xl"
                        >
                            <button onClick={() => setShowPostModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">✕</button>

                            <h2 className="text-4xl font-black text-white tracking-tighter mb-8">Share Discovery</h2>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <img src={track.cover_url} className="w-16 h-16 rounded-2xl" />
                                    <div className="flex-1">
                                        <div className="font-bold text-white">{track.title}</div>
                                        <div className="text-xs font-black uppercase tracking-widest text-[#1DB954]">{track.artist}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Your Thoughts</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#1DB954] focus:outline-none transition-all resize-none h-32"
                                        placeholder="Why should the world hear this?"
                                        value={postCaption}
                                        onChange={(e) => setPostCaption(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Hashtags</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-[#1DB954] focus:outline-none transition-all"
                                        placeholder="#ChillVibes #IndieRock"
                                        value={postHashtags}
                                        onChange={(e) => setPostHashtags(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={createPost}
                                    disabled={isSubmitting || !postCaption.trim()}
                                    className="w-full py-5 bg-[#1DB954] text-black font-black rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-green-500/20"
                                >
                                    {isSubmitting ? "Broadcasting..." : "Post to Identity Thread"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
