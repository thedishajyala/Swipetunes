export default function ArtistCircle({ artist, image, rank, size = 'md' }) {
    const sizeClasses = {
        sm: "w-16 h-16",
        md: "w-28 h-28",
        lg: "w-40 h-40",
        xl: "w-56 h-56"
    };

    const textSize = {
        sm: "text-[10px]",
        md: "text-xs",
        lg: "text-sm",
        xl: "text-lg"
    };

    return (
        <div className="flex flex-col items-center gap-4 group cursor-pointer perspective-1000">
            <div className={`relative ${sizeClasses[size] || sizeClasses.md} rounded-full overflow-hidden p-1.5 bg-gradient-to-tr from-white/10 to-transparent transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 shadow-2xl group-hover:shadow-[#1DB954]/20`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 border border-white/10">
                    {image ? (
                        <img src={image} alt={artist} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-4xl font-black text-white/20">
                            {artist[0]}
                        </div>
                    )}
                </div>

                {/* Rank Badge for Top 3 */}
                {rank && rank <= 10 && (
                    <div className={`absolute bottom-0 right-2 ${size === 'sm' ? 'w-5 h-5 text-[8px]' : 'w-8 h-8 text-xs'} bg-[#1DB954] rounded-full flex items-center justify-center font-black text-black border-2 border-black/80 shadow-lg transform group-hover:scale-110 transition-transform`}>
                        {rank}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center">
                <span className={`${textSize[size]} text-center text-white font-black tracking-tight uppercase truncate max-w-full opacity-80 group-hover:opacity-100 transition-opacity`}>
                    {artist}
                </span>
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Artist</span>
            </div>
        </div>
    );
}
