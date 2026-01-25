export async function GET() {
    try {
        const res = await fetch("https://api.deezer.com/search?q=top", {
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();

        const tracks = data.data.slice(0, 25).map((song) => ({
            spotifyId: song.id.toString(), // keep same field name
            name: song.title,
            artist: song.artist.name,
            coverImage: song.album.cover_big,
            previewUrl: song.preview,
            energy: Math.random(),     // fake for now
            valence: Math.random(),
            tempo: 80 + Math.random() * 100,
            popularity: song.rank,
        }));

        return Response.json(tracks);
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
