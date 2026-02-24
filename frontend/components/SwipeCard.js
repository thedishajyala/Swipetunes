import { useState, useRef, useEffect } from "react";
import { HiOutlinePlay, HiOutlinePause, HiOutlineShare, HiVolumeOff } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Deterministic waveform heights to avoid hydration mismatch
const WAVE_HEIGHTS = [
    6, 14, 22, 10, 28, 16, 8, 24, 18, 12,
    26, 8, 20, 14, 28, 10, 22, 16, 8, 18
];

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
                    await audioRef.current.play();
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
                const t = setTimeout(() => {
                    audioRef.current?.play()
                        .then(() => setIsPlaying(true))
                        .catch(() => { setIsPlaying(false); setShowInteractionPrompt(true); });
                }, 600);
                return () => clearTimeout(t);
            }
        }
    }, [track, previewSrc]);

    const coverSrc = track.coverImage || track.cover_url || track.album?.images?.[0]?.url;
    const trackName = track.name || track.title;
    const artistName = track.artist || track.artists?.[0]?.name;
    const artistId = track.artists?.[0]?.id || null;
    const trackId = track.id || track.track_id;

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            {...dragHandlers}
            animate={controls}
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            whileInView={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '3/4',
                maxHeight: '600px',
                borderRadius: '40px',
                overflow: 'hidden',
                cursor: 'grab',
                boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)',
                userSelect: 'none',
            }}
            whileDrag={{ cursor: 'grabbing' }}
        >
            {/* Album Art */}
            <div style={{ position: 'absolute', inset: 0, background: '#111' }}>
                {coverSrc ? (
                    <img
                        src={coverSrc}
                        alt={trackName}
                        style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 2s ease-out',
                            transform: isPlaying ? 'scale(1.08)' : 'scale(1.01)',
                        }}
                        draggable="false"
                        onError={e => {
                            e.target.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #111 0%, #1a1a2e 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.1)', fontWeight: 800, fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase' }}>No Cover</span>
                    </div>
                )}

                {/* Gradient overlays */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.97) 100%)',
                }} />
            </div>

            {/* Tap to Listen */}
            <AnimatePresence>
                {showInteractionPrompt && hasAudio && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={togglePlay}
                        style={{
                            position: 'absolute', inset: 0, zIndex: 30,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{
                            position: 'relative',
                            width: '72px', height: '72px',
                            borderRadius: '50%',
                            background: 'rgba(29,185,84,0.15)',
                            border: '1.5px solid rgba(29,185,84,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <HiOutlinePlay style={{ fontSize: '28px', color: '#1DB954', marginLeft: '3px' }} />
                            <div className="pulse-ring" />
                        </div>
                        <p style={{ marginTop: '14px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                            Tap to Listen
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Swipe Indicators */}
            <AnimatePresence>
                {swipeDirection === "right" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
                        animate={{ opacity: 1, scale: 1, rotate: -12 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', top: '36px', left: '28px', zIndex: 20,
                            border: '3px solid #1DB954',
                            borderRadius: '12px',
                            padding: '4px 16px',
                            background: 'rgba(29,185,84,0.15)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <span style={{ color: '#1DB954', fontSize: '36px', fontWeight: 900, letterSpacing: '-1px', textTransform: 'uppercase', lineHeight: 1.2 }}>Like</span>
                    </motion.div>
                )}
                {swipeDirection === "left" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7, rotate: 20 }}
                        animate={{ opacity: 1, scale: 1, rotate: 12 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', top: '36px', right: '28px', zIndex: 20,
                            border: '3px solid #ef4444',
                            borderRadius: '12px',
                            padding: '4px 16px',
                            background: 'rgba(239,68,68,0.15)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <span style={{ color: '#ef4444', fontSize: '36px', fontWeight: 900, letterSpacing: '-1px', textTransform: 'uppercase', lineHeight: 1.2 }}>Nope</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Content */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '32px 28px 28px',
                zIndex: 20,
            }}>
                {/* Track info */}
                <div style={{ marginBottom: '20px' }}>
                    <h1 style={{
                        fontSize: '28px', fontWeight: 800, color: '#fff',
                        letterSpacing: '-0.5px',
                        marginBottom: '6px',
                        lineHeight: 1.1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {trackName}
                    </h1>
                    <p style={{
                        fontSize: '13px', fontWeight: 600,
                        color: 'rgba(255,255,255,0.55)',
                        letterSpacing: '1px', textTransform: 'uppercase',
                    }}>
                        {artistId ? (
                            <Link
                                href={`/artist/${artistId}`}
                                onPointerDown={e => e.stopPropagation()}
                                onClick={e => e.stopPropagation()}
                                style={{ color: 'inherit', textDecoration: 'none' }}
                            >
                                {artistName}
                            </Link>
                        ) : artistName}
                    </p>
                </div>

                {/* Controls row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Play button */}
                    <button
                        onClick={hasAudio ? togglePlay : undefined}
                        onPointerDown={e => e.stopPropagation()}
                        disabled={!hasAudio}
                        style={{
                            width: '56px', height: '56px', borderRadius: '18px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '22px', cursor: hasAudio ? 'pointer' : 'not-allowed',
                            border: 'none', transition: 'all 0.2s ease',
                            ...(hasAudio ? {
                                background: '#1DB954',
                                color: '#000',
                                boxShadow: '0 4px 20px rgba(29,185,84,0.45)',
                            } : {
                                background: 'rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.3)',
                            }),
                        }}
                    >
                        {!hasAudio ? <HiVolumeOff /> : (isPlaying ? <HiOutlinePause /> : <HiOutlinePlay style={{ marginLeft: '2px' }} />)}
                    </button>

                    {/* Share button */}
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('share-track', { detail: { trackId, track } }));
                        }}
                        onPointerDown={e => e.stopPropagation()}
                        style={{
                            width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.6)',
                            transition: 'all 0.2s ease',
                        }}
                        title="Share with curator"
                    >
                        <HiOutlineShare />
                    </button>

                    {/* Waveform */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', height: '32px' }}>
                        {WAVE_HEIGHTS.map((h, i) => (
                            <div
                                key={i}
                                className={isPlaying ? "wave-bar" : ""}
                                style={{
                                    flex: 1,
                                    height: isPlaying ? `${h}px` : '3px',
                                    background: isPlaying ? '#1DB954' : 'rgba(255,255,255,0.15)',
                                    borderRadius: '9999px',
                                    transition: 'height 0.3s ease',
                                    animationDelay: isPlaying ? `${i * 0.06}s` : '0s',
                                    animationDuration: isPlaying ? `${0.6 + (i % 5) * 0.1}s` : '0s',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Spotify link */}
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <a
                        href={`https://open.spotify.com/track/${trackId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        style={{
                            fontSize: '11px', fontWeight: 700,
                            letterSpacing: '1.5px', textTransform: 'uppercase',
                            color: 'rgba(29,185,84,0.8)',
                            textDecoration: 'none',
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        <span>▶</span> Open on Spotify
                    </a>
                </div>

                {hasAudio && <audio ref={audioRef} src={previewSrc} onEnded={() => setIsPlaying(false)} className="hidden" />}
            </div>
        </motion.div>
    );
}
