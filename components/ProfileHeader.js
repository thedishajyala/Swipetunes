'use client';

import { motion } from "framer-motion";
import { FaBookOpen, FaFilm, FaTv, FaEdit, FaCog } from "react-icons/fa"; // Using generalized icons or similar to the screenshot
import { BiStats } from "react-icons/bi";

export default function ProfileHeader({ user, stats }) {
    if (!user) return null;

    return (
        <div className="relative mb-12">
            {/* Banner - Using a gradient or pattern if no banner image is provided */}
            <div className="h-64 w-full bg-gradient-to-r from-gray-900 to-black rounded-b-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
            </div>

            {/* Profile Info */}
            <div className="absolute -bottom-16 left-12 flex items-end gap-6">
                {/* Avatar */}
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full p-1 bg-black">
                        <img
                            src={user.image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                </div>

                {/* Text Info */}
                <div className="mb-4">
                    <h1 className="text-4xl font-bold text-white tracking-tight">{user.name}</h1>
                    <p className="text-gray-400 font-medium">Music Enthusiast</p>
                    <div className="flex gap-6 mt-2 text-sm text-gray-400">
                        <span><strong className="text-white">{stats?.followers || 0}</strong> Followers</span>
                        <span><strong className="text-white">{stats?.following || 0}</strong> Following</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-4 right-12 flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-sm font-medium transition-all backdrop-blur-md">
                    <BiStats /> Match Recommendations
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-sm font-medium transition-all backdrop-blur-md">
                    <FaCog /> Settings
                </button>
            </div>
        </div>
    );
}
