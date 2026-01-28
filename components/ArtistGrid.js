"use client";
import ArtistCircle from "./ArtistCircle";

export default function ArtistGrid({ artists, title }) {
    return (
        <section className="w-full">
            {title && <h2 className="text-3xl font-black text-white mb-8 tracking-tight">{title}</h2>}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {artists.map((artist, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <ArtistCircle
                            artist={artist.name}
                            image={artist.image}
                            rank={i + 1}
                            size="lg" // Pass a size prop if we want bigger ones here
                        />
                        <div className="mt-2 text-center">
                            {/* Optional: Add compatibility score or genre tag here later */}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
