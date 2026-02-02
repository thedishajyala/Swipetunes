"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Keep for auth session, or use NextAuth hook
import { useSession } from "next-auth/react";
import { getHistory } from "@/lib/api";

export default function History() {
    const { data: session } = useSession();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            if (session?.user) {
                const spotifyId = session.user.spotify_id || session.user.id;
                console.log("History: Fetching from backend for:", spotifyId);

                const historyData = await getHistory(spotifyId);
                if (historyData) {
                    setTracks(historyData);
                }
            } else {
                // Try to get session from supabase if next-auth not ready (fallback, though next-auth is main)
                // Actually, let's just wait for session
            }
            if (session !== undefined) setLoading(false);
        }

        if (session) {
            fetchHistory();
        } else if (session === null) {
            setLoading(false);
        }
    }, [session]);

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
                {tracks.map((action, index) => (
                    <div key={`${action.songId}-${index}`} className="flex items-center bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 hover:bg-gray-750 transition-colors">
                        {action.image && (
                            <img
                                src={action.image}
                                alt={action.songName}
                                className="w-16 h-16 object-cover rounded-md mr-4"
                            />
                        )}
                        <div className="flex-grow">
                            <h2 className="text-xl font-semibold text-white">{action.songName}</h2>
                            <p className="text-gray-400">{action.artist}</p>
                        </div>

                        <div className="text-right text-sm text-gray-500 mr-4 hidden sm:block">
                            <p>{new Date(action.timestamp).toLocaleDateString()}</p>
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
