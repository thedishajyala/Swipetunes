'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineTicket, HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineLightningBolt } from "react-icons/hi";
import toast from "react-hot-toast";

export default function EventsPage() {
    const { data: session } = useSession();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userCity, setUserCity] = useState("");
    const [isUpdatingCity, setIsUpdatingCity] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchUserCity();
        }
    }, [session]);

    async function fetchUserCity() {
        const { data } = await fetch(`/api/users/${session.user.id}`).then(r => r.json());
        if (data?.city) {
            setUserCity(data.city);
            fetchEvents(data.city);
        } else {
            fetchEvents(); // Global
        }
    }

    async function fetchEvents(city = "") {
        setLoading(true);
        try {
            const res = await fetch(`/api/events?city=${city}`);
            const data = await res.json();
            if (Array.isArray(data)) setEvents(data);
        } catch (e) {
            console.error("Events error:", e);
        } finally {
            setLoading(false);
        }
    }

    async function updateCity() {
        if (!userCity.trim()) return;
        setIsUpdatingCity(true);
        try {
            await fetch(`/api/users/${session.user.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ city: userCity })
            });
            toast.success(`Identity localized to ${userCity}`);
            fetchEvents(userCity);
        } catch (e) {
            toast.error("Failed to update location.");
        } finally {
            setIsUpdatingCity(false);
        }
    }

    async function handleAttendance(eventId, status) {
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                body: JSON.stringify({ event_id: eventId, status })
            });
            if (res.ok) {
                toast.success(status === 'going' ? "You're on the list! 🎉" : "Added to interest list.");
                // Update local state or re-fetch
            }
        } catch (e) {
            toast.error("Signal failed.");
        }
    }

    if (loading && events.length === 0) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Scanning the local stage...</div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-16 py-12 px-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 text-[#1DB954]">
                        <HiOutlineTicket className="text-4xl" />
                        <h1 className="text-6xl font-black text-white tracking-tighter">Live Events</h1>
                    </div>
                    <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
                        Where your digital taste hits the real world. Discover upcoming shows for your favorite artists near you.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Your Location</label>
                    <div className="flex gap-2">
                        <div className="relative">
                            <HiOutlineLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={userCity}
                                onChange={(e) => setUserCity(e.target.value)}
                                placeholder="Enter City..."
                                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-[#1DB954] focus:outline-none transition-all w-48"
                            />
                        </div>
                        <button
                            onClick={updateCity}
                            disabled={isUpdatingCity}
                            className="px-6 py-3 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm"
                        >
                            Sync
                        </button>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={event.id}
                        className="bg-white/[0.03] border border-white/10 rounded-[40px] overflow-hidden flex flex-col group hover:bg-white/[0.06] transition-all"
                    >
                        <div className="p-8 space-y-6 flex-1">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]">Artist in Rotation</span>
                                    <h3 className="text-2xl font-black text-white tracking-tight">{event.artist_name}</h3>
                                </div>
                                <div className="w-12 h-12 bg-[#1DB954]/10 rounded-2xl flex items-center justify-center text-[#1DB954]">
                                    <HiOutlineLightningBolt className="text-2xl" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <HiOutlineCalendar className="text-lg text-[#1DB954]" />
                                    <span className="text-sm font-bold">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <HiOutlineLocationMarker className="text-lg text-[#1DB954]" />
                                    <span className="text-sm font-bold">{event.venue}, {event.city}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleAttendance(event.id, 'going')}
                                    className="flex-1 bg-white/[0.05] border border-white/10 hover:bg-[#1DB954] hover:text-black hover:border-[#1DB954] py-3 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all"
                                >
                                    I'm Going
                                </button>
                                <button
                                    onClick={() => handleAttendance(event.id, 'interested')}
                                    className="flex-1 bg-white/[0.05] border border-white/10 hover:bg-white/10 py-3 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all"
                                >
                                    Interested
                                </button>
                            </div>
                        </div>

                        <a
                            href={event.ticket_url}
                            target="_blank"
                            className="bg-white/5 border-t border-white/10 p-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-[#1DB954]/20 transition-all flex items-center justify-center gap-2"
                        >
                            Secure Tickets <HiOutlineCheckCircle className="text-lg" />
                        </a>
                    </motion.div>
                ))}

                {events.length === 0 && !loading && (
                    <div className="col-span-full py-20 bg-white/5 rounded-[50px] border border-white/5 border-dashed flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center">
                            <HiOutlineLocationMarker className="text-3xl text-gray-500" />
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest">No rotations detected in this sector.</p>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest">Try updating your location or exploring more artists.</p>
                    </div>
                )}
            </section>
        </div>
    );
}

