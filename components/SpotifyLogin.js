'use client';

import { signIn } from "next-auth/react";
import { FaSpotify } from "react-icons/fa";

export default function SpotifyLogin() {
    return (
        <button
            onClick={() => signIn('spotify')}
            className="flex items-center gap-3 px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-[#1DB954]/40 hover:scale-105"
        >
            <FaSpotify className="text-2xl" />
            <span>Continue with Spotify</span>
        </button>
    );
}
