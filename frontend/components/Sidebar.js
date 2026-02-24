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
    HiOutlineFire,
    HiOutlineMusicNote,
    HiOutlineUserCircle,
    HiOutlineClock,
    HiOutlineCalendar,
    HiOutlineTrendingUp,
} from "react-icons/hi";


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
                }, () => {
                    setUnreadCount(prev => prev + 1);
                    toast(`New message from a curator!`, { icon: '💬' });
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
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
        { name: "Swipe", path: "/", icon: <HiOutlineMusicNote size={20} /> },
        { name: "People", path: "/people", icon: <HiOutlineUserGroup size={20} /> },
        { name: "Trending", path: "/trending", icon: <HiOutlineFire size={20} /> },
        { name: "Leaderboard", path: "/leaderboard", icon: <HiOutlineTrendingUp size={20} /> },
        { name: "My Identity", path: "/profile", icon: <HiOutlineUserCircle size={20} /> },
        { name: "Liked Songs", path: "/history", icon: <HiOutlineClock size={20} /> },
        { name: "Swipe History", path: "/swipe-history", icon: <HiOutlineCalendar size={20} /> },
    ];


    return (
        <div className="fixed left-0 top-0 h-full w-64 flex flex-col z-50"
            style={{
                background: 'linear-gradient(180deg, rgba(10,10,10,0.97) 0%, rgba(5,5,5,0.98) 100%)',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
            }}
        >
            {/* Subtle top accent line */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(29,185,84,0.4), transparent)'
            }} />

            {/* Brand */}
            <div style={{ padding: '28px 24px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '38px', height: '38px',
                        background: 'linear-gradient(135deg, #1DB954, #15a041)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(29,185,84,0.35)',
                        transform: 'rotate(3deg)',
                        flexShrink: 0,
                    }}>
                        <HiOutlineMusicNote style={{ color: '#000', fontSize: '18px' }} />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px', lineHeight: 1 }}>SwipeTunes</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', marginTop: '3px', textTransform: 'uppercase' }}>Music Discovery</div>
                    </div>
                </div>
            </div>

            {/* Nav label */}
            <div style={{ padding: '0 24px 12px', color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Menu
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px', flex: 1 }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '11px 14px',
                                borderRadius: '14px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                                letterSpacing: '-0.2px',
                                position: 'relative',
                                ...(isActive ? {
                                    background: 'rgba(29,185,84,0.12)',
                                    color: '#1DB954',
                                    boxShadow: 'inset 0 0 0 1px rgba(29,185,84,0.2)',
                                } : {
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.45)',
                                })
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                                }
                            }}
                        >
                            {isActive && (
                                <div style={{
                                    position: 'absolute', left: 0, top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '3px', height: '20px',
                                    background: '#1DB954',
                                    borderRadius: '0 4px 4px 0',
                                    boxShadow: '0 0 8px rgba(29,185,84,0.6)',
                                }} />
                            )}
                            <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                            <span>{item.name}</span>
                            {item.name === "Messages" && unreadCount > 0 && (
                                <span style={{
                                    marginLeft: 'auto',
                                    width: '20px', height: '20px',
                                    background: '#1DB954',
                                    color: '#000',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile / Logout */}
            <div style={{ padding: '12px', marginTop: 'auto' }}>
                {session?.user && (
                    <div style={{
                        padding: '14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <img
                                    src={session.user.image}
                                    alt={session.user.name}
                                    style={{
                                        width: '36px', height: '36px',
                                        borderRadius: '50%',
                                        border: '2px solid rgba(29,185,84,0.4)',
                                        display: 'block',
                                    }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    width: '9px', height: '9px',
                                    background: '#1DB954',
                                    borderRadius: '50%',
                                    border: '2px solid #050505',
                                }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {session.user.name}
                                </div>
                                <div style={{ color: 'rgba(29,185,84,0.8)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', marginTop: '1px' }}>
                                    ● Connected
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut()}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                width: '100%', padding: '9px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '12px', fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                                e.currentTarget.style.color = 'rgba(239,68,68,0.9)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                            }}
                        >
                            <HiOutlineLogout size={14} />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
