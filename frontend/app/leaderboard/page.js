"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineTrendingUp } from "react-icons/hi";
import { useSession } from "next-auth/react";

const PERIODS = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "alltime", label: "All Time" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
    const { data: session } = useSession();
    const [period, setPeriod] = useState("week");
    const [board, setBoard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/leaderboard?period=${period}`)
            .then(r => r.json())
            .then(data => { setBoard(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [period]);

    const myEntry = board.find(e => e.user_id === session?.user?.id);

    return (
        <div className="max-w-3xl mx-auto py-12 px-6 space-y-10">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/30 rounded-2xl flex items-center justify-center">
                        <HiOutlineTrendingUp className="text-yellow-300 text-xl" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">Leaderboard</h1>
                    </div>
                </div>
                <p className="text-gray-500 font-medium text-sm ml-1">Top SwipeTunes listeners ranked by likes</p>
            </motion.div>

            {/* Period tabs */}
            <div className="flex gap-2">
                {PERIODS.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${period === p.key
                                ? "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-20 animate-pulse">Loading...</p>
                </div>
            ) : (
                <>
                    {/* Podium — top 3 */}
                    {board.length >= 3 && (
                        <div className="grid grid-cols-3 gap-4 items-end">
                            {[board[1], board[0], board[2]].map((entry, idx) => {
                                const actualRank = [2, 1, 3][idx];
                                const isMe = entry.user_id === session?.user?.id;
                                return (
                                    <motion.div
                                        key={entry.user_id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`flex flex-col items-center gap-3 ${actualRank === 1 ? "pb-4" : ""}`}
                                    >
                                        <div className="relative">
                                            {entry.avatar
                                                ? <img src={entry.avatar} className={`${actualRank === 1 ? "w-20 h-20" : "w-16 h-16"} rounded-full object-cover border-2 ${isMe ? "border-[#1DB954]" : "border-white/20"}`} />
                                                : <div className={`${actualRank === 1 ? "w-20 h-20" : "w-16 h-16"} rounded-full bg-white/10 flex items-center justify-center text-2xl font-black text-white`}>{entry.display_name?.[0] || "?"}</div>
                                            }
                                            <span className="absolute -top-2 -right-1 text-xl">{MEDAL[actualRank - 1]}</span>
                                        </div>
                                        <p className={`${actualRank === 1 ? "text-sm" : "text-xs"} font-black text-white truncate max-w-[100px] text-center`}>{entry.display_name}</p>
                                        <p className="text-[11px] text-[#1DB954] font-black">❤️ {entry.likes}</p>
                                        <div className={`w-full ${actualRank === 1 ? "h-24" : "h-16"} bg-gradient-to-t ${actualRank === 1 ? "from-yellow-500/15" : "from-white/5"} to-transparent rounded-t-2xl border-t ${actualRank === 1 ? "border-yellow-500/20" : "border-white/10"}`} />
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Full ranked list */}
                    <div className="space-y-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 pb-1">Full Rankings</h2>
                        {board.map((entry, i) => {
                            const isMe = entry.user_id === session?.user?.id;
                            return (
                                <motion.div
                                    key={entry.user_id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all ${isMe
                                            ? "bg-[#1DB954]/10 border-[#1DB954]/30"
                                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                                        }`}
                                >
                                    <span className="w-7 text-center text-sm font-black text-gray-500 shrink-0">
                                        {entry.rank <= 3 ? MEDAL[entry.rank - 1] : entry.rank}
                                    </span>
                                    {entry.avatar
                                        ? <img src={entry.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                        : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-black text-white shrink-0">{entry.display_name?.[0] || "?"}</div>
                                    }
                                    <span className={`flex-1 font-bold text-sm truncate ${isMe ? "text-[#1DB954]" : "text-white"}`}>
                                        {entry.display_name} {isMe && <span className="text-[10px] ml-1 opacity-60">(you)</span>}
                                    </span>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className="text-xs font-black text-white">❤️ {entry.likes}</span>
                                        <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(entry.likes / (board[0]?.likes || 1)) * 100}%` }}
                                                transition={{ delay: i * 0.02 + 0.2, duration: 0.5 }}
                                                className="h-full bg-gradient-to-r from-[#1DB954] to-[#19e68c] rounded-full"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {board.length === 0 && (
                            <div className="text-center py-20 text-gray-600 font-medium">
                                No data yet for this period. Start swiping! 🎵
                            </div>
                        )}
                    </div>

                    {/* Your rank if not in top 25 */}
                    {myEntry === undefined && session && (
                        <div className="text-center text-xs text-gray-600 font-medium pt-2">
                            You're not in the top 25 yet. Keep swiping to climb! 🚀
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
