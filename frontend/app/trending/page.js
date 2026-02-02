'use client';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { HiOutlineFire } from 'react-icons/hi';

export default function TrendingPage() {
    const [playlists, setPlaylists] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/playlists/trending`)
            .then(res => res.json())
            .then(data => setPlaylists(data || []))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="p-8 min-h-screen">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter flex items-center gap-3">
                <HiOutlineFire className="text-[#1DB954]" /> Trending Playlists
            </h1>
            <p className="text-gray-400 mb-8">Hottest daily vibes from the community.</p>

            <div className="space-y-4">
                {playlists.map((playlist, i) => (
                    <div key={playlist.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6 hover:bg-white/10 transition-all group">
                        <div className="text-4xl font-black text-white/20 w-12 text-center group-hover:text-[#1DB954]">
                            #{i + 1}
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center text-2xl font-bold text-black shadow-lg">
                            🎵
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">{playlist.title}</h3>
                            <p className="text-sm text-gray-400">
                                Curated by <span className="text-white font-medium">{playlist.users?.name || 'Unknown'}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Date</span>
                            <span className="text-white font-mono">{playlist.date}</span>
                        </div>
                    </div>
                ))}

                {playlists.length === 0 && (
                    <div className="text-gray-500 text-center py-20">
                        No trending playlists yet. Be the first to create a vibe!
                    </div>
                )}
            </div>
        </div>
    );
}
