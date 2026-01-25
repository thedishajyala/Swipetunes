"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Recommendations() {
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecs() {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // 1. Get all swiped tracks (liked or disliked) to exclude
                const { data: swipes } = await supabase
                    .from('swipes')
                    .select('track_id')
                    .eq('user_id', session.user.id);

                const swipedIds = swipes ? swipes.map(s => s.track_id) : [];

                // 2. Fetch tracks NOT in swipedIds
                let query = supabase.from('tracks').select('*').limit(20);

                if (swipedIds.length > 0) {
                    // Supabase .not instruction
                    query = query.not('id', 'in', `(${swipedIds.join(',')})`);
                }

                // Simple 'random' or popularity based recommendation for now
                // Since we removed the complex API logic, we just show unswiped tracks.
                // We can order by popularity if available
                query = query.order('popularity', { ascending: false });

                const { data: tracks } = await query;
                if (tracks) setRecs(tracks);
            }
            setLoading(false);
        }
        fetchRecs();
    }, []);

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    if (!recs || !recs.length) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <p className="text-xl">No recommendations yet or we ran out! Swipe to verify.</p>
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
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Your Recommended Tracks</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl">
                {recs.map((track) => (
                    <div key={track.id} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1">
                        {track.coverImage && (
                            <img
                                src={track.coverImage}
                                alt={track.name}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                        )}
                        <h2 className="text-xl font-semibold mb-1 text-white truncate">{track.name}</h2>
                        <p className="text-gray-400 mb-4 truncate">{track.artist}</p>

                        <div className="space-y-1 text-sm text-gray-500">
                            {/* Audio features visualization */}
                            {track.energy !== undefined && (
                                <div className="flex justify-between">
                                    <span>Energy</span>
                                    <div className="w-24 bg-gray-700 rounded-full h-2 mt-1">
                                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${track.energy * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                            {track.valence !== undefined && (
                                <div className="flex justify-between">
                                    <span>Valence</span>
                                    <div className="w-24 bg-gray-700 rounded-full h-2 mt-1">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${track.valence * 100}%` }}></div>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Tempo</span>
                                <span>{track.tempo ? Math.round(track.tempo) : 0} BPM</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="mt-12 px-8 py-3 bg-blue-600 rounded-full hover:bg-blue-700 font-semibold shadow-lg transition-transform transform hover:scale-105"
                onClick={() => window.location.href = "/"}
            >
                Back to Swiping
            </button>
        </div>
    );
}
