"use client";
import CircleGrid from "@/components/CircleGrid";

// Dummy Data for Demonstration
const dummyArtists = [
    { title: "The Weeknd", subtitle: "Global Pop Star", image: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb", badge: "Your #1" },
    { title: "Daft Punk", subtitle: "Electronic Legends", image: "https://i.scdn.co/image/ab6761610000e5ebb33472353d42054238779998", badge: "Legend" },
    { title: "SZA", subtitle: "R&B Queen", image: "https://i.scdn.co/image/ab6761610000e5eb70272946c59b21659a85040e" },
    { title: "Kendrick Lamar", subtitle: "Lyrical Genius", image: "https://i.scdn.co/image/ab6761610000e5eb437b9e2a82505b3d93ac1d58", badge: "Trending" },
    { title: "Ariana Grande", subtitle: "Pop Vocalist", image: "https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a70a6679b69" },
    { title: "Drake", subtitle: "Hip-Hop Icon", image: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9" },
    { title: "Taylor Swift", subtitle: "Songwriter", image: "https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0", badge: "Hot" },
    { title: "Bad Bunny", subtitle: "Latin Trap", image: "https://i.scdn.co/image/ab6761610000e5eb9ad50820f17105cb2243e86c" },
];

export default function ArtistsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 pl-10 pt-10">
            <header className="mb-10">
                <h1 className="text-4xl font-black mb-2 tracking-tight">Your Music Identity</h1>
                <p className="text-gray-400 text-lg">The artists that define your sound.</p>
            </header>

            <section>
                <CircleGrid items={dummyArtists} />
            </section>
        </div>
    );
}
