'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { HiOutlineUser, HiOutlineChartBar, HiOutlineMusicNote } from 'react-icons/hi';

export default function PublicProfilePage() {
    const { id } = useParams(); // This is the spotify_id or user_id from URL
    const { data: session } = useSession();
    const [playlists, setPlaylists] = useState([]);
    const [tasteMatch, setTasteMatch] = useState(null);
    const [profileUser, setProfileUser] = useState(null);

    useEffect(() => {
        // Fetch User Playlists
        fetch(`${API_BASE_URL}/playlist/user/${id}`)
            .then(res => res.json())
            .then(data => setPlaylists(data || []))
            .catch(err => console.error(err));

        // Calculate Taste Match if logged in and not viewing self
        if (session?.user?.id && session?.user?.spotify_id !== id) {
            const myId = session.user.spotify_id || session.user.id;
            fetch(`${API_BASE_URL}/taste-match?me=${myId}&other=${id}`)
                .then(res => res.json())
                .then(data => setTasteMatch(data))
                .catch(err => console.error(err));
        }

        // Fetch basic user info (mock or real if endpoint exists)
        // For now, we might rely on the playlist data to infer user name if available, 
        // or add a specific user endpoint. The /users endpoint returns all, we could filter.
        // For MVP speed, let's just use the ID as title or fetch from /users
        fetch(`${API_BASE_URL}/users`)
            .then(res => res.json())
            .then(users => {
                const found = users.find(u => u.spotify_id === id || u.id === id);
                if (found) setProfileUser(found);
            });

    }, [id, session]);

    return (
        <div className="p-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                <div className="w-32 h-32 rounded-full border-4 border-[#1DB954] p-1">
                    <img
                        src={profileUser?.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black text-white mb-2">{profileUser?.name || id}</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Music Curator</p>

                    {tasteMatch && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                            <HiOutlineChartBar className="text-[#1DB954]" />
                            <span className="text-white font-bold">{tasteMatch.match}% Taste Match</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Playlists */}
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <HiOutlineMusicNote /> Public Playlists
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {playlists.map(playlist => (
                    <div key={playlist.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{playlist.date}</div>
                        <h3 className="text-xl font-bold text-white mb-4">{playlist.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-[#1DB954] font-bold">
                            View Playlist →
                        </div>
                    </div>
                ))}

                {playlists.length === 0 && (
                    <p className="text-gray-500 italic">No public playlists yet.</p>
                )}
            </div>
        </div>
    );
}
