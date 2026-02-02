import { supabase } from "@/lib/supabase";

export default function UserProfile({ session, stats }) {
    if (!session?.user) return null;

    const avatar = session.user.image;
    const name = session.user.name || "Music Lover";

    return (
        <div className="w-full max-w-md mb-6 flex items-center justify-between bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/5 transition-all hover:bg-white/15">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        {avatar ? (
                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                {name[0]}
                            </div>
                        )}
                    </div>
                    {/* Online/Active Indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black"></div>
                </div>

                {/* Info */}
                <div className="leading-tight">
                    <h2 className="text-white font-bold text-lg tracking-tight">{name}</h2>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {stats?.swipes || 0} Matches Found
                    </p>
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
                title="Sign Out"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
            </button>
        </div>
    );
}
