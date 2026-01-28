export default function ArtistCircle({ artist, image, rank, size = 'md' }) {
    const sizeClasses = {
        sm: "w-12 h-12",
        md: "w-20 h-20",
        lg: "w-32 h-32"
    };

    const containerClasses = {
        sm: "min-w-[60px]",
        md: "min-w-[80px]",
        lg: "min-w-[140px]"
    };

    const textSize = {
        sm: "text-[10px]",
        md: "text-xs",
        lg: "text-sm"
    };

    return (
        <div className={`flex flex-col items-center gap-2 group cursor-pointer ${containerClasses[size]}`}>
            <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-transparent group-hover:border-green-500 transition-all shadow-lg group-hover:shadow-green-500/30 group-hover:scale-105`}>
                {image ? (
                    <img src={image} alt={artist} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white">
                        {artist[0]}
                    </div>
                )}
                {/* Rank Badge for Top 3 */}
                {rank && rank <= 3 && (
                    <div className={`absolute top-0 right-0 ${size === 'sm' ? 'w-4 h-4 text-[8px]' : 'w-6 h-6 text-xs'} rounded-full flex items-center justify-center font-bold text-black border border-white
                ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : 'bg-amber-600'}
            `}>
                        {rank}
                    </div>
                )}
            </div>
            <span className={`${textSize[size]} text-center text-gray-300 font-medium truncate w-full group-hover:text-white transition-colors`}>
                {artist}
            </span>
        </div>
    );
}
