import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export default function SwipeCard({ track, swipeDirection, dragHandlers, controls }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = (e) => {
        e.stopPropagation(); // Prevent drag interference
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Reset audio state when track changes
    useEffect(() => {
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [track]);

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            {...dragHandlers}
            animate={controls}
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative w-[360px] h-[600px] rounded-[48px] overflow-hidden cursor-grab active:cursor-grabbing group border border-white/10"
            style={{
                boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255,255,255,0.1)"
            }}
        >
            {/* Full Bleed Album Art */}
            <div className="absolute inset-0 bg-black">
                {track.coverImage ? (
                    <img
                        src={track.coverImage}
                        alt={track.name}
                        className={`w-full h-full object-cover transition-transform duration-[800ms] ${isPlaying ? "scale-110" : "scale-100"}`}
                        draggable="false"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
                        <span className="text-white/30 font-medium">No Cover Art</span>
                    </div>
                )}

                {/* Cinematic Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 pointer-events-none" />
            </div>

            {/* Swipe Feedback Indicators */}
            {swipeDirection === "right" && (
                <div className="absolute top-12 left-8 border-[6px] border-green-400 rounded-2xl px-6 py-2 transform -rotate-12 z-20 backdrop-blur-md bg-green-500/20 shadow-[0_0_50px_rgba(74,222,128,0.5)]">
                    <span className="text-green-400 text-6xl font-black tracking-widest drop-shadow-lg uppercase">LIKE</span>
                </div>
            )}

            {swipeDirection === "left" && (
                <div className="absolute top-12 right-8 border-[6px] border-red-500 rounded-2xl px-6 py-2 transform rotate-12 z-20 backdrop-blur-md bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                    <span className="text-red-500 text-6xl font-black tracking-widest drop-shadow-lg uppercase">NOPE</span>
                </div>
            )}

            {/* Super Like Indicator (Optional future feature placeholder) */}
            {swipeDirection === "up" && (
                <div className="absolute bottom-40 left-1/2 -translate-x-1/2 border-[6px] border-blue-400 rounded-2xl px-4 py-2 rotate-0 z-20 backdrop-blur-md bg-blue-500/20 shadow-[0_0_50px_rgba(96,165,250,0.5)]">
                    <span className="text-blue-400 text-4xl font-black tracking-widest drop-shadow-lg uppercase">SUPER</span>
                </div>
            )}

            {/* Glassmorphism Info Card */}
            <div className="absolute bottom-0 w-full z-10 flex flex-col justify-end pb-8 px-6 pt-24 bg-gradient-to-t from-black via-black/80 to-transparent">

                <div className="relative">
                    {/* Genre Tag */}
                    {track.genre && (
                        <div className="mb-4">
                            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-sm uppercase tracking-widest">
                                {track.genre.split(',')[0]}
                            </span>
                        </div>
                    )}

                    {/* Track Details */}
                    <div>
                        <h1 className="text-4xl font-black text-white leading-none line-clamp-2 drop-shadow-2xl tracking-tighter mb-2">
                            {track.name}
                        </h1>
                        <p className="text-xl text-white/80 font-medium tracking-wide">
                            {track.artist}
                        </p>
                    </div>

                    {/* Custom Audio Player */}
                    {track.previewUrl && (
                        <div className="flex items-center gap-4 mt-6">
                            <button
                                onClick={togglePlay}
                                onPointerDown={(e) => e.stopPropagation()} // Stop drag when clicking button
                                className="relative w-14 h-14 flex-shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] z-30 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                            >
                                {isPlaying ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>

                            {/* Visualizer / Waveform placeholder */}
                            <div className="flex-1 h-12 flex items-center gap-1 opacity-70">
                                {[...Array(16)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full bg-white/80 transition-all duration-300 ${isPlaying ? "animate-pulse" : "h-1 bg-white/30"}`}
                                        style={{
                                            height: isPlaying ? `${Math.random() * 24 + 4}px` : "4px",
                                            animationDelay: `${i * 0.05}s`
                                        }}
                                    />
                                ))}
                            </div>

                            <audio ref={audioRef} src={track.previewUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
