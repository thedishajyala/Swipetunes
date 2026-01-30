'use client';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineChatAlt2, HiOutlinePaperAirplane, HiOutlineMusicNote, HiOutlineArrowLeft } from "react-icons/hi";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ChatPage() {
    const { data: session } = useSession();
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeTarget, setActiveTarget] = useState(null); // { id, type: 'dm' | 'group', name, pic }
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const handleShare = (e) => {
            const { trackId, track } = e.detail;
            if (activeTarget) {
                sendTrackMessage(trackId, track);
            } else {
                toast("Select a curator first to share this track!", { icon: '🎧' });
            }
        };

        window.addEventListener('share-track', handleShare);
        return () => window.removeEventListener('share-track', handleShare);
    }, [activeTarget]);

    async function sendTrackMessage(trackId, track) {
        if (!session?.user?.id) return;
        const newMessage = {
            message_text: `Hey, check out this track: ${track.name || track.title}`,
            track_shared: trackId
        };
        if (activeTarget.type === 'dm') newMessage.receiver_id = activeTarget.id;
        else newMessage.group_id = activeTarget.id;

        // Optimistic update
        const tempMsg = { ...newMessage, id: Date.now(), sender_id: session.user.id, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, tempMsg]);

        await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify(newMessage)
        });
        toast.success("Track shared!");
    }

    useEffect(() => {
        if (!session?.user?.id) return;

        fetchSidebarData();

        const channel = supabase
            .channel('messages_realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const isNewDM = payload.new.receiver_id === session.user.id && activeTarget?.id === payload.new.sender_id;
                const isNewGroupMsg = payload.new.group_id === activeTarget?.id;

                if (isNewDM || isNewGroupMsg) {
                    setMessages(prev => [...prev, payload.new]);
                }
                fetchSidebarData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, [session, activeTarget]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    async function addReaction(msgId, emoji) {
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
                const newReactions = [...(m.reactions || []), { emoji, user_id: session.user.id }];
                return { ...m, reactions: newReactions };
            }
            return m;
        }));

        await fetch('/api/reactions', {
            method: 'POST',
            body: JSON.stringify({ track_id: msgId, emoji })
        });

        // Add to Journal
        fetch('/api/journal', {
            method: 'POST',
            body: JSON.stringify({ track_id: msgId, action: 'reacted' })
        });
    }

    async function fetchSidebarData() {
        if (!session?.user?.id) return;

        // Fetch friends through followers table (accepted status)
        const { data: friendsData } = await supabase
            .from('followers')
            .select(`
                user_id,
                friend_id,
                users!friend_id(id, display_name, profile_pic_url),
                initiator:users!user_id(id, display_name, profile_pic_url)
            `)
            .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
            .eq('status', 'accepted');

        // Fetch User's Groups
        const { data: groupData } = await supabase
            .from('group_members')
            .select('groups(*)')
            .eq('user_id', session.user.id);

        if (friendsData) {
            const friendList = friendsData.map(f => {
                const target = f.user_id === session.user.id ? f.users : f.initiator;
                return { ...target, type: 'dm' };
            });
            setFriends(friendList);
        }
        if (groupData) {
            setGroups(groupData.map(g => ({ ...g.groups, type: 'group' })));
        }
        setLoading(false);
    }

    async function fetchConversation(target) {
        setActiveTarget(target);
        const endpoint = target.type === 'dm' ? `?friendId=${target.id}` : `?groupId=${target.id}`;
        const res = await fetch(`/api/messages${endpoint}`);
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!input.trim() || !activeTarget) return;

        const newMessage = {
            message_text: input
        };
        if (activeTarget.type === 'dm') newMessage.receiver_id = activeTarget.id;
        else newMessage.group_id = activeTarget.id;

        // Optimistic update
        const tempMsg = { ...newMessage, id: Date.now(), sender_id: session.user.id, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, tempMsg]);
        setInput("");

        await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify(newMessage)
        });
    }

    if (loading) return <div className="p-12 text-center text-gray-500 font-black uppercase tracking-widest animate-pulse">Establishing Connection...</div>;

    return (
        <div className="h-[calc(100vh-80px)] max-w-7xl mx-auto flex gap-6 p-6 overflow-hidden">
            {/* Conversations Sidebar */}
            <div className={`w-full lg:w-96 flex flex-col bg-white/[0.03] border border-white/5 rounded-[40px] overflow-hidden ${activeTarget ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-8 border-b border-white/5">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {/* Friends Section */}
                    <div className="space-y-2">
                        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Soulmates</p>
                        {friends.map(friend => (
                            <button
                                key={friend.id}
                                onClick={() => fetchConversation(friend)}
                                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${activeTarget?.id === friend.id && activeTarget.type === 'dm' ? 'bg-[#1DB954] text-black shadow-xl' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                <img src={friend.profile_pic_url || "https://www.gravatar.com/avatar?d=mp"} className="w-10 h-10 rounded-full" />
                                <span className="font-bold truncate text-sm">{friend.display_name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Groups Section */}
                    <div className="space-y-2">
                        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">Collaboration Hubs</p>
                        {groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => fetchConversation(group)}
                                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${activeTarget?.id === group.id && activeTarget.type === 'group' ? 'bg-[#1DB954] text-black shadow-xl' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                <div className="w-10 h-10 rounded-3xl bg-white/10 flex items-center justify-center text-xl">🤝</div>
                                <span className="font-bold truncate text-sm">{group.name}</span>
                            </button>
                        ))}
                    </div>

                    {friends.length === 0 && groups.length === 0 && (
                        <div className="p-12 text-center text-xs font-bold text-gray-600 uppercase tracking-widest">No signals yet.</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white/[0.03] border border-white/5 rounded-[40px] overflow-hidden ${!activeTarget ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
                {activeTarget ? (
                    <>
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveTarget(null)} className="lg:hidden text-white text-2xl p-2"><HiOutlineArrowLeft /></button>
                                {activeTarget.type === 'dm' ? (
                                    <img src={activeTarget.profile_pic_url || "https://www.gravatar.com/avatar?d=mp"} className="w-10 h-10 rounded-full border border-white/10" />
                                ) : (
                                    <div className="w-10 h-10 rounded-3xl bg-white/10 flex items-center justify-center">🤝</div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-white tracking-tighter">{activeTarget.display_name || activeTarget.name}</span>
                                    <span className="text-[10px] text-[#1DB954] font-black uppercase tracking-tighter">
                                        {activeTarget.type === 'dm' ? 'Vibing together' : 'Collaborative Rotation'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_id === session.user.id;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.id || i}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                                    >
                                        <div className={`max-w-[70%] p-5 rounded-[30px] relative ${isMe ? 'bg-[#1DB954] text-black rounded-tr-none shadow-lg' : 'bg-white/5 text-white rounded-tl-none border border-white/5'}`}>
                                            {/* Reactions Popover */}
                                            <div className={`absolute bottom-full mb-2 flex gap-1 bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 ${isMe ? 'right-0' : 'left-0'}`}>
                                                {['❤️', '🔥', '🎵', '💯'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => addReaction(msg.id, emoji)}
                                                        className="hover:scale-125 transition-transform p-1 text-xs"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>

                                            {msg.track_shared && (
                                                <div className="mb-4 bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center gap-4 p-3 pr-6">
                                                    <div className="w-16 h-16 bg-gray-900 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        <HiOutlineMusicNote className="text-white/20 text-3xl" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-[#1DB954] mb-1">Shared Track</span>
                                                        <span className="text-xs font-black truncate leading-tight">{msg.message_text.split(': ')[1] || 'New Find'}</span>
                                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Tap to Open</span>
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-sm font-medium leading-relaxed">{msg.message_text}</p>
                                            <div className="mt-2 text-[8px] font-black opacity-40 uppercase tracking-tighter flex items-center justify-between">
                                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.reactions?.length > 0 && (
                                                    <div className="flex gap-1 ml-4 bg-black/20 px-2 py-0.5 rounded-full">
                                                        {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(e => <span key={e}>{e}</span>)}
                                                        <span className="ml-1 opacity-60">{msg.reactions.length}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <form onSubmit={sendMessage} className="p-8 bg-black/40 border-t border-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={`Message ${activeTarget.display_name || activeTarget.name}...`}
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-[#1DB954] transition-all"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1DB954] rounded-2xl flex items-center justify-center text-black disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <HiOutlinePaperAirplane className="rotate-90" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto">
                            <HiOutlineChatAlt2 className="text-4xl text-gray-500" />
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">Select a Curator</h3>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Connect through the conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
