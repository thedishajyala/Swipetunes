'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { HiOutlineUserAdd, HiOutlineUser } from 'react-icons/hi';
import { API_BASE_URL } from '@/lib/api';

export default function PeoplePage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/users`)
            .then(res => res.json())
            .then(data => setUsers(data || []))
            .catch(err => console.error("Failed to fetch users", err));
    }, []);

    const handleFollow = async (targetId) => {
        // Optimistic UI updates could go here

        // Use internal UUID or spotify ID 
        const followerId = session?.user?.spotify_id || session?.user?.id;

        await fetch(`${API_BASE_URL}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followerId, followingId: targetId })
        });
        alert(`Followed!`);
    };

    return (
        <div className="p-8 min-h-screen">
            <h1 className="text-4xl font-black text-white mb-8 tracking-tighter">Discover People</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4 hover:bg-white/10 transition-colors">
                        <img
                            src={user.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                            alt={user.name}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white truncate">{user.name}</h3>
                            <Link href={`/profile/${user.spotify_id}`} className="text-[#1DB954] text-sm font-bold hover:underline">
                                View Profile
                            </Link>
                        </div>
                        <button
                            onClick={() => handleFollow(user.spotify_id)}
                            className="p-3 bg-white/10 rounded-full hover:bg-[#1DB954] hover:text-black transition-colors text-white"
                        >
                            <HiOutlineUserAdd size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
