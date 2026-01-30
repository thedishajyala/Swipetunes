import { useState, useRef, useEffect } from "react";
import { HiOutlinePlay, HiOutlinePause, HiOutlineShare, HiVolumeUp, HiVolumeOff } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

export default function SwipeCard({ track, swipeDirection, dragHandlers, controls }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [showInteractionPrompt, setShowInteractionPrompt] = useState(false);

    const togglePlay = async (e) => {
        if (e) e.stopPropagation();
        if (audioRef.current) {
            try {
                if (isPlaying) {
                    audioRef.current.pause();
                } else {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        await playPromise;
                    }
                }
                setIsPlaying(!isPlaying);
                setShowInteractionPrompt(false);
            } catch (err) {
                console.error("Playback failed:", err);
                setIsPlaying(false);
            }
        }
    };

    const previewSrc = track.previewUrl || track.preview_url;
    const hasAudio = !!previewSrc;

    useEffect(() => {
        setIsPlaying(false);
        setShowInteractionPrompt(false);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;

            if (previewSrc) {
                const playTimeout = setTimeout(() => {
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                setIsPlaying(true);
                            })
                            .catch(err => {
                                console.log("Autoplay blocked. Showing prompt.", err);
                                setIsPlaying(false);
                                setShowInteractionPrompt(true);
                            });
                    }
                }, 600);
                return () => clearTimeout(playTimeout);
            }
        }
    }, [track, previewSrc]);

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            {...dragHandlers}
            animate={controls}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative w-full aspect-[3/4] max-h-[600px] rounded-[50px] overflow-hidden cursor-grab active:cursor-grabbing group shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10"
        >
            {/* Grainy Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Album Art */}
            <div className="absolute inset-0 bg-gray-900">
                {(track.coverImage || track.cover_url || (track.album?.images && track.album.images[0]?.url)) ? (
                    <img
                        src={track.coverImage || track.cover_url || track.album?.images[0]?.url}
                        alt={track.name || track.title}
                        className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${isPlaying ? "scale-110" : "scale-100"}`}
                        draggable="false"
                        onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        <span className="text-white/20 font-black uppercase tracking-widest text-xs">No Cover</span>
                    </div>
                )}
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 z-0" />
            </div>

            {/* Tap to Listen Overlay (If Autoplay Blocked AND Audio Exists) */}
            <AnimatePresence>
                {showInteractionPrompt && hasAudio && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={togglePlay}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                            <HiOutlinePlay className="text-4xl text-white ml-1" />
                        </div>
                        <p className="mt-4 text-xs font-black uppercase tracking-widest text-white">Tap to Listen</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Swipe Indicators */}
            {swipeDirection === "right" && (
                <div className="absolute top-10 left-10 border-4 border-[#1DB954] rounded-2xl px-6 py-2 -rotate-12 z-20 bg-[#1DB954]/20 backdrop-blur-md">
                    <span className="text-[#1DB954] text-5xl font-black uppercase tracking-tighter">Like</span>
                </div>
            )}
            {swipeDirection === "left" && (
                <div className="absolute top-10 right-10 border-4 border-red-500 rounded-2xl px-6 py-2 rotate-12 z-20 bg-red-500/20 backdrop-blur-md">
                    <span className="text-red-500 text-5xl font-black uppercase tracking-tighter">Nope</span>
                </div>
            )}

            {/* Content Bottom */}
            <div className="absolute bottom-0 inset-x-0 p-8 z-20 flex flex-col gap-6 bg-gradient-to-t from-black via-black/60 to-transparent pt-24">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tighter line-clamp-1 group-hover:tracking-tight transition-all duration-500">
                        {track.name || track.title}
                    </h1>
                    <p className="text-lg text-gray-300 font-bold uppercase tracking-widest text-xs opacity-80">
                        {track.artist || (track.artists && track.artists[0]?.name)}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={hasAudio ? togglePlay : undefined}
                        onPointerDown={(e) => e.stopPropagation()}
                        disabled={!hasAudio}
                        className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl transition-all shadow-xl ${hasAudio
                            ? "bg-white text-black hover:scale-105 active:scale-95 cursor-pointer"
                            : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                            }`}
                    >
                        {!hasAudio ? <HiVolumeOff /> : (isPlaying ? <HiOutlinePause /> : <HiOutlinePlay className="ml-1" />)}
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const trackId = track.id || track.track_id;
                            window.dispatchEvent(new CustomEvent('share-track', { detail: { trackId, track } }));
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl transition-all"
                        title="Share with curator"
                    >
                        <HiOutlineShare />
                    </button>

                    <div className="flex-1 h-1 flex items-center gap-1">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-500 ${isPlaying ? "animate-pulse bg-[#1DB954]" : "h-1 bg-white/20"}`}
                                style={{
                                    height: isPlaying ? `${Math.random() * 24 + 4}px` : "2px",
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-center mt-4">
                    <a
                        href={`https://open.spotify.com/track/${track.id || track.track_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-bold uppercase tracking-widest text-[#1DB954] hover:text-white transition-colors flex items-center gap-2"
                    >
                        <span>▶ Play Full Song on Spotify</span>
                    </a>
                </div>

                {hasAudio && (
                    <audio ref={audioRef} src={previewSrc} onEnded={() => setIsPlaying(false)} className="hidden" />
                )}
            </div>
        </motion.div>
    );
}
