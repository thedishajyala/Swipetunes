export default function SkeletonCard() {
    return (
        <div className="relative w-[360px] h-[600px] rounded-[40px] overflow-hidden bg-gray-900 shadow-2xl animate-pulse border border-gray-800">
            {/* Image Placeholder */}
            <div className="absolute inset-0 bg-gray-800"></div>

            {/* Info Card Placeholder */}
            <div className="absolute bottom-0 w-full z-10 p-8 flex flex-col gap-4">
                {/* Title Lines */}
                <div className="h-8 bg-gray-700 rounded-md w-3/4"></div>
                <div className="h-6 bg-gray-700 rounded-md w-1/2"></div>

                {/* Button Placeholder */}
                <div className="mt-4 flex gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-700"></div>
                    <div className="h-4 bg-gray-700 rounded-full w-full self-center"></div>
                </div>
            </div>
        </div>
    );
}
