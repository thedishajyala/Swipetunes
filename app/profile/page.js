'use client';

import { useSession } from "next-auth/react";
import { HiOutlineSparkles, HiOutlineGlobe, HiOutlineUserGroup, HiOutlineFire } from "react-icons/hi";
import ArtistGrid from "@/components/ArtistGrid";
import SpotifyLogin from "@/components/SpotifyLogin";

// Mock Data for "Music Identity"
const TOP_ARTISTS = [
    { name: "The Weeknd", image: "https://i.scdn.co/image/ab6761610000e5eb214f30c68726591244415891" },
    { name: "SZA", image: "https://i.scdn.co/image/ab6761610000e5eb703816998fa632ed68615c32" }, // SZA still seems okay sometimes but I'll use a better one if needed. Actually SZA ab6761610000e5eb703816998fa632ed68615c32 is valid.
    { name: "Drake", image: "https://i.scdn.co/image/ab6761610000e5eb42da6707328df8f2603f9012" }, // If this 404s, I'll update it.
    { name: "Lana Del Rey", image: "https://i.scdn.co/image/ab67616d0000b273b796b334bc0e0081079bc081" },
    { name: "Metro Boomin", image: "https://i.scdn.co/image/ab6761610000e5eb051ae8df8643806a72e7372b" },
];

const RECENT_LIKES = [
    { id: 1, title: "Starboy", author: "The Weeknd", cover: "https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png" },
    { id: 2, title: "Kill Bill", author: "SZA", cover: "https://upload.wikimedia.org/wikipedia/en/2/2c/SZA_-_SOS.png" },
    { id: 3, title: "As It Was", author: "Harry Styles", cover: "https://upload.wikimedia.org/wikipedia/en/d/d5/Harry_Styles_-_As_It_Was.png" },
];

export default function ProfilePage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-8 text-center max-w-2xl mx-auto px-6">
                <div className="w-24 h-24 bg-gradient-to-tr from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center animate-bounce">
                    <HiOutlineSparkles className="text-4xl text-[#1DB954]" />
                </div>
                <div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4 text-white">Your Music Identity</h1>
                    <p className="text-xl text-gray-400 font-medium">Join the community to visualize your taste, track your stats, and see what the world is listening to.</p>
                </div>
                <SpotifyLogin />
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Identity Header */}
            <header className="relative py-12 flex flex-col items-center text-center overflow-hidden rounded-[40px] bg-white/[0.02] border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-[#1DB954]/10 to-transparent pointer-events-none" />

                <div className="relative mb-6">
                    <div className="w-40 h-40 rounded-full p-2 bg-gradient-to-tr from-[#1DB954] to-[#1ed760] shadow-2xl">
                        <img
                            src={session.user.image}
                            alt={session.user.name}
                            className="w-full h-full rounded-full border-4 border-black object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-xl">
                        Verified Taste
                    </div>
                </div>

                <h1 className="text-6xl font-black tracking-tighter text-white mb-2">{session.user.name}</h1>
                <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">Aesthetic Curator</p>

                {/* Quick Stats Banner */}
                <div className="flex gap-12 mt-10 p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-white">1.2k</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Swipes</span>
                    </div>
                    <div className="w-px h-full bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-white">45</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Matches</span>
                    </div>
                    <div className="w-px h-full bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-white">Top 1%</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Taste</span>
                    </div>
                </div>
            </header>

            {/* Top Artists (The "Circle Grid" Look) */}
            <section className="relative">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Soulmates in Sound</h2>
                        <p className="text-gray-500 font-medium">Artists that define your current aesthetic path.</p>
                    </div>
                    <HiOutlineFire className="text-3xl text-orange-500 animate-pulse" />
                </div>
                <ArtistGrid artists={TOP_ARTISTS} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Community Pulse */}
                <section className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                            <HiOutlineGlobe className="text-blue-500 text-xl" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Community Pulse</h2>
                    </div>

                    <div className="space-y-4">
                        {RECENT_LIKES.map((song) => (
                            <div key={song.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                                <img src={song.cover} className="w-16 h-16 rounded-xl shadow-lg group-hover:scale-105 transition-transform" />
                                <div className="flex-1">
                                    <h3 className="font-black text-white">{song.title}</h3>
                                    <p className="text-xs text-gray-500 font-bold">{song.author}</p>
                                </div>
                                <div className="text-[10px] font-black text-[#1DB954] bg-green-500/10 px-2 py-1 rounded-md uppercase">
                                    98% Match
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Vibe Profile */}
                <section className="p-8 rounded-[40px] bg-gradient-to-br from-[#1DB954]/20 to-blue-500/20 border border-white/10 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/10 blur-[60px] rounded-full" />

                    <HiOutlineSparkles className="text-5xl text-white mb-6 animate-spin-slow" />
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Hypnotic & Cinematic</h2>
                    <p className="text-gray-300 font-medium leading-relaxed">
                        Your taste leans towards rich textures and atmospheric production. You prefer music that tells a story through soundscapes.
                    </p>

                    <button className="mt-8 px-8 py-3 bg-white text-black font-black rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                        Share Identity
                    </button>
                </section>
            </div>
        </div>
    );
}
