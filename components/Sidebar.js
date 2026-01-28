"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Swipe", path: "/", icon: "🎵" },
        { name: "My Identity", path: "/artists", icon: "👤" },
        { name: "Matches", path: "/recommendations", icon: "💞" },
        { name: "History", path: "/history", icon: "📜" },
    ];

    return (
        <div className="fixed left-0 top-0 h-full w-64 bg-black border-r border-white/10 p-6 flex flex-col z-50">
            {/* Brand */}
            <div className="mb-10 flex items-center gap-3 px-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full animate-pulse" />
                <span className="text-2xl font-black tracking-tighter text-white">Swipetunes</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${isActive
                                    ? "bg-white text-black shadow-lg scale-105"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Info could go here */}
            <div className="mt-auto px-4 py-4 border-t border-white/5 text-gray-500 text-xs text-center">
                © 2026 Swipetunes
            </div>
        </div>
    );
}
