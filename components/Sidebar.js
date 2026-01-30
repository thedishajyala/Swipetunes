'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import {
    HiOutlineLogout,
    HiOutlineUserGroup,
    HiOutlineFire, // Added for Feed icon
    HiOutlineChatAlt2, // Added for Chat icon
    HiOutlineBookOpen // Added for Journal icon
} from "react-icons/hi";
import { HiOutlineMusicNote, HiOutlineUserCircle, HiOutlineLightningBolt, HiOutlineClock, HiOutlineTicket } from "react-icons/hi";


export default function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (session?.user?.id) {
            fetchUnreadCount();

            const channel = supabase
                .channel('global_notifications')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${session.user.id}`
                }, (payload) => {
                    setUnreadCount(prev => prev + 1);
                    toast(`New message from a curator!`, { icon: '💬' });
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); }
        }
    }, [session]);

    async function fetchUnreadCount() {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', session.user.id)
            .eq('read_status', false);

        if (!error) setUnreadCount(count || 0);
    }

    const navItems = [
        { name: "Swipe", path: "/", icon: <HiOutlineMusicNote size={24} /> },
        { name: "My Identity", path: "/profile", icon: <HiOutlineUserCircle size={24} /> },
        { name: "Feed", path: "/feed", icon: <HiOutlineFire size={24} /> },
        { name: "Messages", path: "/chat", icon: <HiOutlineChatAlt2 size={24} /> },
        { name: "Journal", path: "/journal", icon: <HiOutlineBookOpen size={24} /> },
        { name: "Trends", path: "/trends", icon: <HiOutlineFire size={24} /> },
        { name: "Discover", path: "/discover", icon: <HiOutlineUserGroup size={24} /> },
        { name: "Events", path: "/events", icon: <HiOutlineTicket size={24} /> },
        { name: "Matches", path: "/recommendations", icon: <HiOutlineLightningBolt size={24} /> },
        { name: "History", path: "/history", icon: <HiOutlineClock size={24} /> },
    ];

    return (
        <div className="fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col z-50">
            {/* Grainy Texture Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Brand */}
            <div className="mb-12 flex items-center gap-3 px-2 relative">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#1DB954] to-[#1ed760] rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <HiOutlineMusicNote className="text-black text-xl" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-white">Swipetunes</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-3 relative">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                                ? "bg-white text-black shadow-xl shadow-white/10 scale-[1.02]"
                                : "text-gray-500 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                                {item.icon}
                            </span>
                            <span className="font-bold tracking-tight">{item.name}</span>
                            {item.name === "Messages" && unreadCount > 0 && (
                                <span className="ml-auto w-5 h-5 bg-[#1DB954] text-black text-[10px] font-black rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Logout */}
            <div className="mt-auto relative">
                {session?.user && (
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={session.user.image}
                                alt={session.user.name}
                                className="w-10 h-10 rounded-full border border-white/10"
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-white truncate">{session.user.name}</span>
                                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Premium Plan</span>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 text-xs font-bold rounded-xl transition-all duration-300"
                        >
                            <HiOutlineLogout />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
