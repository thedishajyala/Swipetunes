import { useState, useRef } from "react";

export default function TrackListItem({ track, rank }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                // Stop others? (Optional improvement)
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
            {/* Rank */}
            <span className={`font-bold w-6 text-center ${rank <= 3 ? 'text-green-400 text-lg' : 'text-gray-500'}`}>
                {rank}
            </span>

            {/* Album Art (Thumbnail) */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                <img src={track.coverImage} alt={track.name} className="w-full h-full object-cover" />

                {/* Play Overlay */}
                {track.previewUrl && (
                    <button
                        onClick={togglePlay}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                        )}
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
                <h3 className={`font-semibold truncate ${isPlaying ? 'text-green-400' : 'text-white'}`}>{track.name}</h3>
                <p className="text-sm text-gray-400 truncate">{track.artist}</p>
            </div>

            {/* Popularity / Metric */}
            <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Pop</span>
                <div className="w-16 h-1 bg-gray-700 rounded-full mt-1">
                    <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(track.popularity || 0, 100)}%` }}
                    />
                </div>
            </div>

            <audio ref={audioRef} src={track.previewUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
    );
}
