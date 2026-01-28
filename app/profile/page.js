'use client';

import { useSession } from "next-auth/react";
import ProfileHeader from "@/components/ProfileHeader";
import SpotifyLogin from "@/components/SpotifyLogin";

// Mock Data for "Loved by Community"
const TRENDING_SONGS = [
    { id: 1, title: "Starboy", author: "The Weeknd", cover: "https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png" },
    { id: 2, title: "Die For You", author: "The Weeknd", cover: "https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png" },
    { id: 3, title: "Kill Bill", author: "SZA", cover: "https://upload.wikimedia.org/wikipedia/en/2/2c/SZA_-_SOS.png" },
    { id: 4, title: "As It Was", author: "Harry Styles", cover: "https://upload.wikimedia.org/wikipedia/en/d/d5/Harry_Styles_-_As_It_Was.png" },
    { id: 5, title: "Anti-Hero", author: "Taylor Swift", cover: "https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Midnights.png" },
];

export default function ProfilePage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
    }

    if (!session) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 text-white text-center p-4">
                <h1 className="text-4xl font-bold">Join the Community</h1>
                <p className="text-gray-400 max-w-md">Connect your Spotify to discover music, track your stats, and see what's trending.</p>
                <SpotifyLogin />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20">
            <ProfileHeader user={session.user} stats={{ followers: 12, following: 45 }} />

            <div className="px-12 space-y-12 mt-20">

                {/* Loved by Community Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-red-500 text-2xl">❤️</span>
                        <h2 className="text-2xl font-bold text-white">Loved by the Community</h2>
                    </div>

                    {/* Horizontal Scroll / Grid */}
                    {/* Horizontal Scroll / Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {TRENDING_SONGS.map((song) => (
                            <div key={song.id} className="group relative aspect-[2/3] bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl">
                                <img src={song.cover} alt={song.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold leading-tight">{song.title}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{song.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Just Reviewed / Your Playlists */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-blue-500 text-2xl">💬</span>
                        <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Create New Card */}
                        <div className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer group">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20">
                                <span className="text-2xl">+</span>
                            </div>
                            <span className="font-medium">Create New</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
