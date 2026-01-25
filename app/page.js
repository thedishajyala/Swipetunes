"use client";
import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    fetch("/api/swipe")
      .then((res) => res.json())
      .then((data) => setTracks(data))
      .catch((err) => console.error("Failed to fetch tracks:", err));
  }, []);

  const handleSwipe = async (liked) => {
    const track = tracks[currentIndex];

    // Assuming a test user ID of 1 for now (since we don't have auth session yet)
    // You would typically get this from your session
    await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: track.id, liked }),
    });

    setCurrentIndex((prev) => prev + 1);
  };

  const handleDragEnd = async (event, info) => {
    if (info.offset.x > 100) {
      // Swiped Right (Like)
      await controls.start({ x: 500, opacity: 0 });
      handleSwipe(true);
    } else if (info.offset.x < -100) {
      // Swiped Left (Dislike)
      await controls.start({ x: -500, opacity: 0 });
      handleSwipe(false);
    } else {
      // Reset
      controls.start({ x: 0 });
    }
  };

  useEffect(() => {
    controls.set({ x: 0, opacity: 1 });
  }, [currentIndex, controls]);

  if (!tracks.length) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <p>Loading tracks...</p>
    </div>
  );

  if (currentIndex >= tracks.length) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <p className="text-xl mb-4">No more tracks!</p>
      <div className="flex gap-4">
        <button
          className="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
          onClick={() => window.location.href = "/recommendations"}
        >
          See Recommendations
        </button>
        <button
          className="px-6 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          onClick={() => window.location.href = "/history"}
        >
          History
        </button>
      </div>
    </div>
  );

  const track = tracks[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ scale: 0.9, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center border border-gray-700 cursor-grab active:cursor-grabbing"
      >
        {track.coverImage && (
          <img
            src={track.coverImage}
            alt={track.name}
            className="w-full h-64 object-cover rounded-lg mb-6 shadow-md"
          />
        )}
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{track.name}</h1>
        <p className="mb-4 text-gray-400 text-lg">{track.artist}</p>

        {track.previewUrl && (
          <audio controls className="w-full mb-6" src={track.previewUrl}>
            Your browser does not support the audio element.
          </audio>
        )}

        <div className="flex gap-6 justify-center mt-8">
          <button
            className="w-16 h-16 flex items-center justify-center bg-red-500/20 text-red-500 border-2 border-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 text-2xl"
            onClick={() => handleSwipe(false)}
            aria-label="Dislike"
          >
            ✕
          </button>
          <button
            className="w-16 h-16 flex items-center justify-center bg-green-500/20 text-green-500 border-2 border-green-500 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300 text-2xl"
            onClick={() => handleSwipe(true)}
            aria-label="Like"
          >
            ✓
          </button>
        </div>

        <div className="mt-8 flex gap-3 justify-center">
          <button
            className="px-6 py-2 bg-blue-500/10 text-blue-400 text-sm rounded-full hover:bg-blue-500 hover:text-white transition-colors"
            onClick={() => window.location.href = "/recommendations"}
          >
            Recommendations
          </button>
          <button
            className="px-6 py-2 bg-gray-700/50 text-gray-400 text-sm rounded-full hover:bg-gray-700 hover:text-white transition-colors"
            onClick={() => window.location.href = "/history"}
          >
            History
          </button>
        </div>
      </motion.div>
    </div>
  );
}
