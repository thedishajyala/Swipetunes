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
            className="relative w-[360px] h-[600px] rounded-[40px] overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing bg-gray-900 group"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
        >
            {/* Full Bleed Album Art */}
            <div className="absolute inset-0">
                {track.coverImage ? (
                    <img
                        src={track.coverImage}
                        alt={track.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? "scale-110" : "scale-100"}`}
                        draggable="false"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                        <span className="text-gray-500 font-medium">No Image</span>
                    </div>
                )}
                {/* Cinematic Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
            </div>

            {/* Swipe Feedback Indicators */}
            {swipeDirection === "right" && (
                <div className="absolute top-12 left-8 border-4 border-green-400 rounded-xl px-4 py-2 transform -rotate-12 z-20 backdrop-blur-sm bg-green-500/10 shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                    <span className="text-green-400 text-5xl font-black tracking-widest drop-shadow-md">LIKE</span>
                </div>
            )}

            {swipeDirection === "left" && (
                <div className="absolute top-12 right-8 border-4 border-red-500 rounded-xl px-4 py-2 transform rotate-12 z-20 backdrop-blur-sm bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                    <span className="text-red-500 text-5xl font-black tracking-widest drop-shadow-md">NOPE</span>
                </div>
            )}

            {/* Glassmorphism Info Card */}
            <div className="absolute bottom-0 w-full z-10">
                {/* Blurred Glass container */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border-t border-white/10" style={{ borderTopLeftRadius: "30px", borderTopRightRadius: "30px" }} />

                <div className="relative p-8 flex flex-col gap-4">
                    {/* Track Details */}
                    <div>
                        <h1 className="text-3xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg tracking-tight">
                            {track.name}
                        </h1>
                        <p className="text-lg text-white/70 font-medium tracking-wide mt-1">
                            {track.artist}
                        </p>
                    </div>

                    {/* Custom Audio Player */}
                    {track.previewUrl && (
                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={togglePlay}
                                onPointerDown={(e) => e.stopPropagation()} // Stop drag when clicking button
                                className="relative w-16 h-16 flex-shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] z-30"
                            >
                                {isPlaying ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>

                            {/* Visualizer / Waveform placeholder */}
                            <div className="flex-1 h-12 flex items-center gap-1 opacity-60">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full bg-white transition-all duration-300 ${isPlaying ? "animate-pulse" : "h-1"}`}
                                        style={{
                                            height: isPlaying ? `${Math.random() * 24 + 4}px` : "4px",
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                            </div>

                            <audio ref={audioRef} src={track.previewUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                        </div>
                    )}

                    {/* Genre Tag */}
                    {track.genre && (
                        <div className="absolute top-0 right-6 -translate-y-1/2 ">
                            <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-lg uppercase tracking-wider">
                                {track.genre.split(',')[0]}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
