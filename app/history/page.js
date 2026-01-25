"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function History() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // 1. Get liked swipes
                const { data: swipes, error: swipesError } = await supabase
                    .from('swipes')
                    .select('track_id')
                    .eq('user_id', session.user.id)
                    .eq('liked', true);

                if (swipes && swipes.length > 0) {
                    // 2. Get tracks
                    const trackIds = swipes.map(s => s.track_id);
                    // Use 'in' filter. Note: if trackIds is huge, this might break. For demo it's fine.
                    const { data: tracksData, error: tracksError } = await supabase
                        .from('tracks')
                        .select('*')
                        .in('id', trackIds);

                    if (tracksData) setTracks(tracksData);
                } else {
                    setTracks([]);
                }
            }
            setLoading(false);
        }
        fetchHistory();
    }, []);

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    if (!tracks || !tracks.length) return (
        // ... (Keep existing UI for empty state)
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <p className="text-xl">No liked songs yet! Go swipe right on some tracks.</p>
            <button
                className="mt-6 px-6 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                onClick={() => window.location.href = "/"}
            >
                Back to Swiping
            </button>
        </div>
    );

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">Liked Songs</h1>

            <div className="w-full max-w-4xl space-y-4">
                {tracks.map((track) => (
                    <div key={track.id} className="flex items-center bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 hover:bg-gray-750 transition-colors">
                        {track.coverImage && (
                            <img
                                src={track.coverImage}
                                alt={track.name}
                                className="w-16 h-16 object-cover rounded-md mr-4"
                            />
                        )}
                        <div className="flex-grow">
                            <h2 className="text-xl font-semibold text-white">{track.name}</h2>
                            {/* Handle legacy 'artist' field (string) vs joined artist. Previously I upserte 'artist' string. */}
                            <p className="text-gray-400">{track.artist}</p>
                        </div>

                        <div className="text-right text-sm text-gray-500 mr-4 hidden sm:block">
                            <p>{track.tempo ? Math.round(track.tempo) : 0} BPM</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="mt-12 px-8 py-3 bg-blue-600 rounded-full hover:bg-blue-700 font-semibold shadow-lg"
                onClick={() => window.location.href = "/"}
            >
                Back to Swiping
            </button>
        </div>
    );
}
