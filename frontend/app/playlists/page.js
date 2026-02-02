'use client';

export default function PlaylistsPage() {
    const playlists = [
        { id: 1, name: "Liked Songs", count: 124, cover: "https://misc.scdn.co/liked-songs/liked-songs-300.png" },
        { id: 2, name: "Gym Hype", count: 45, cover: "https://i.scdn.co/image/ab67706c0000bebb8d0ce13d55f634e290f744ba" },
    ];

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
                <button className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-all">
                    + Create Playlist
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {playlists.map((pl) => (
                    <div key={pl.id} className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                        <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden relative shadow-lg">
                            <img src={pl.cover} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <h3 className="text-white font-bold">{pl.name}</h3>
                        <p className="text-gray-400 text-sm">By You • {pl.count} tracks</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
