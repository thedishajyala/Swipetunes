'use client';

export default function Error({ error, reset }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
            <h2 className="text-4xl font-black text-[#ff0000] mb-4">CRITICAL SYSTEM FAILURE</h2>
            <p className="text-gray-400 mb-8 max-w-md">
                {error.message || "An unexpected error occurred."}
            </p>
            <button
                onClick={() => reset()}
                className="px-8 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform"
            >
                REBOOT SYSTEM
            </button>
        </div>
    );
}
