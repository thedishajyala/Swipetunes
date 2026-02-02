export default function CircleCard({ image, title, subtitle, badge, onClick }) {
    return (
        <div
            className="flex flex-col items-center cursor-pointer group w-full"
            onClick={onClick}
        >
            <div className="relative w-32 h-32 mb-3">
                <img
                    src={image || "https://placehold.co/128x128/1a1a1a/white?text=?"}
                    alt={title}
                    className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300 border-2 border-transparent group-hover:border-green-500 shadow-lg group-hover:shadow-green-500/20"
                />
                {badge && (
                    <span className="absolute bottom-0 right-0 bg-green-500 text-black font-bold text-[10px] px-2 py-0.5 rounded-full border border-black shadow-sm">
                        {badge}
                    </span>
                )}
            </div>

            <h3 className="font-bold text-base text-center text-white leading-tight px-1 truncate w-full">
                {title}
            </h3>

            {subtitle && (
                <p className="text-xs text-gray-400 text-center mt-1 px-1 truncate w-full">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
