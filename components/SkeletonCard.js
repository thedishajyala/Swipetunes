export default function SkeletonCard() {
    return (
        <div className="relative w-full aspect-[3/4] max-h-[600px] rounded-[50px] overflow-hidden bg-white/[0.02] border border-white/5 animate-pulse shadow-2xl">
            <div className="absolute inset-0 bg-gray-900/50" />

            <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col gap-6 pt-24">
                <div className="space-y-3">
                    <div className="h-10 bg-white/10 rounded-2xl w-3/4" />
                    <div className="h-4 bg-white/5 rounded-full w-1/4" />
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-white/10" />
                    <div className="flex-1 h-1 bg-white/5 rounded-full" />
                </div>
            </div>
        </div>
    );
}
