"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HiOutlineArrowLeft, HiOutlinePlay, HiOutlineMusicNote, HiOutlineUsers, HiOutlineGlobeAlt } from "react-icons/hi";

export default function ArtistPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [artist, setArtist] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playing, setPlaying] = useState(null);
    const [audioRef, setAudioRef] = useState(null);

    useEffect(() => {
        if (!session?.accessToken || !id) return;
        async function fetchArtist() {
            const token = session.accessToken;
            const [artistRes, tracksRes, relatedRes] = await Promise.all([
                fetch(`https://api.spotify.com/v1/artists/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (artistRes.ok) setArtist(await artistRes.json());
            if (tracksRes.ok) {
                const d = await tracksRes.json();
                setTopTracks((d.tracks || []).slice(0, 10));
            }
            if (relatedRes.ok) {
                const d = await relatedRes.json();
                setRelated((d.artists || []).slice(0, 8));
            }
            setLoading(false);
        }
        fetchArtist();
    }, [session, id]);

    function togglePreview(track) {
        if (playing === track.id) { audioRef?.pause(); setPlaying(null); setAudioRef(null); return; }
        audioRef?.pause();
        if (!track.preview_url) return;
        const audio = new Audio(track.preview_url);
        audio.volume = 0.6;
        audio.play();
        audio.onended = () => { setPlaying(null); setAudioRef(null); };
        setPlaying(track.id);
        setAudioRef(audio);
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Loading Artist...</p>
        </div>
    );
    if (!artist) return <div className="p-12 text-gray-500 text-center">Artist not found.</div>;

    const fmtNum = n => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n;

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 space-y-12">

            {/* Back */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-black uppercase tracking-wider transition-colors">
                <HiOutlineArrowLeft /> Back
            </button>

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center md:items-end gap-8">
                {/* Artist image */}
                <div className="relative shrink-0">
                    {artist.images?.[0]?.url
                        ? <img src={artist.images[0].url} alt={artist.name} className="w-48 h-48 rounded-[32px] object-cover shadow-2xl" />
                        : <div className="w-48 h-48 rounded-[32px] bg-white/5 flex items-center justify-center"><HiOutlineMusicNote className="text-5xl text-gray-600" /></div>
                    }
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-[32px] shadow-[0_0_80px_rgba(29,185,84,0.15)] pointer-events-none" />
                </div>
                <div className="text-center md:text-left space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1DB954]">Artist</p>
                    <h1 className="text-6xl font-black text-white tracking-tighter leading-none">{artist.name}</h1>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {(artist.genres || []).slice(0, 4).map(g => (
                            <span key={g} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-wider text-gray-400">{g}</span>
                        ))}
                    </div>
                    <div className="flex gap-6 justify-center md:justify-start text-sm font-black text-white mt-2">
                        <span className="flex items-center gap-1.5 text-gray-400"><HiOutlineUsers className="text-[#1DB954]" />{fmtNum(artist.followers?.total || 0)} followers</span>
                        <span className="flex items-center gap-1.5 text-gray-400"><HiOutlineGlobeAlt className="text-[#1DB954]" />Popularity {artist.popularity}/100</span>
                    </div>
                </div>
            </motion.div>

            {/* Top Tracks */}
            <section className="space-y-4">
                <h2 className="text-2xl font-black text-white tracking-tighter">Top Tracks</h2>
                <div className="space-y-2">
                    {topTracks.map((track, i) => (
                        <motion.div
                            key={track.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => togglePreview(track)}
                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 cursor-pointer transition-all group"
                        >
                            <span className="w-5 text-xs font-black text-gray-600 text-right shrink-0">{i + 1}</span>
                            <div className="relative w-12 h-12 shrink-0">
                                {track.album?.images?.[0]?.url
                                    ? <img src={track.album.images[0].url} className="w-full h-full object-cover rounded-xl" />
                                    : <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center"><HiOutlineMusicNote className="text-gray-600 text-sm" /></div>
                                }
                                {playing === track.id && (
                                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-[2px]">
                                        {[1, 2, 3].map(b => <span key={b} className="w-0.5 bg-[#1DB954] rounded-full animate-bounce" style={{ height: `${b * 3 + 3}px`, animationDelay: `${b * 0.1}s` }} />)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{track.name}</p>
                                <p className="text-[11px] text-gray-500 truncate">{track.album?.name}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-gray-600">{Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0")}</span>
                                {track.preview_url && (
                                    <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#1DB954]/20 flex items-center justify-center transition-all">
                                        <HiOutlinePlay className="text-gray-500 group-hover:text-[#1DB954] text-xs ml-0.5" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Related Artists */}
            {related.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-2xl font-black text-white tracking-tighter">Fans Also Like</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {related.map((a, i) => (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => router.push(`/artist/${a.id}`)}
                                className="flex flex-col items-center gap-3 p-4 rounded-[24px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 cursor-pointer group transition-all"
                            >
                                {a.images?.[0]?.url
                                    ? <img src={a.images[0].url} className="w-16 h-16 rounded-full object-cover group-hover:scale-105 transition-transform" />
                                    : <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl">{a.name[0]}</div>
                                }
                                <p className="text-xs font-black text-white text-center truncate w-full">{a.name}</p>
                                <p className="text-[10px] text-gray-600 uppercase tracking-wider truncate w-full text-center">{a.genres?.[0] || ""}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
