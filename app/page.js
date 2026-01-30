"use client";
import { useState, useEffect } from "react";
import { useAnimation, motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { HiOutlineMusicNote, HiOutlineSparkles, HiOutlineArrowRight } from "react-icons/hi";
import SwipeCard from "../components/SwipeCard";
import SkeletonCard from "../components/SkeletonCard";

export default function Home() {
  const { data: session, status } = useSession();
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const controls = useAnimation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ swipes: 0 });

  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user && session.accessToken) {
      console.log("Home: Session ready, fetching data for user:", session.user.id);
      fetchStats(session.user.id);
      fetchTracks();
    }
    if (status !== "loading") setLoading(false);
  }, [session, status]);

  const fetchStats = async (userId) => {
    try {
      const { count, error: statsError } = await supabase
        .from('swipes')
        .select('*', { count: 'exact', head: true })
        .eq('liked', true)
        .eq('user_id', userId);

      if (statsError) {
        console.error("Home: Fetch Stats Error:", statsError);
        // Don't set global error yet, just log it
      } else {
        setStats({ swipes: count || 0 });
      }
    } catch (e) {
      console.error("Home: Stats Critical Failure:", e);
    }
  };

  async function fetchTracks(isMore = false) {
    if (isMore) setLoadingMore(true);
    setError(null);
    try {
      console.log("Home: Requesting recommendations...");
      const response = await fetch('/api/recommendations');
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setTracks(prev => isMore ? [...prev, ...data] : data);
        console.log(`Home: Successfully loaded ${data.length} tracks`);
      } else {
        setError(data.error || "Failed to load curation");
        console.error("Home: Recommendation API Error:", data);
      }
    } catch (err) {
      console.error("Home: Failed to fetch tracks", err);
      setError("Network error curating tracks");
    }
    setLoadingMore(false);
  }

  const handleSwipe = async (liked) => {
    const track = tracks[currentIndex];

    // Check if we need more tracks
    if (currentIndex >= tracks.length - 5 && !loadingMore) {
      fetchTracks(true);
    }

    setSwipeDirection(null);
    setCurrentIndex((prev) => prev + 1);

    if (session?.user?.id && track) {
      await supabase.from('swipes').insert({
        user_id: session.user.id,
        track_id: track.id,
        liked: liked
      });
      if (liked) setStats(prev => ({ ...prev, swipes: prev.swipes + 1 }));
    }
  };

  const handleDrag = (event, info) => {
    if (info.offset.x > 50) setSwipeDirection("right");
    else if (info.offset.x < -50) setSwipeDirection("left");
    else setSwipeDirection(null);
  }

  const handleDragEnd = async (event, info) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      await controls.start({ x: 500, opacity: 0, rotate: 20, transition: { duration: 0.4 } });
      handleSwipe(true);
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -500, opacity: 0, rotate: -20, transition: { duration: 0.4 } });
      handleSwipe(false);
    } else {
      controls.start({ x: 0, opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      setSwipeDirection(null);
    }
  };

  useEffect(() => {
    controls.set({ x: 0, opacity: 1, rotate: 0 });
    setSwipeDirection(null);
  }, [currentIndex, controls]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <SkeletonCard />
        <p className="mt-8 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Curating your vibe...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl bg-white/[0.03] border border-white/5 p-12 rounded-[50px] backdrop-blur-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1DB954] to-transparent opacity-50" />

          <div className="mb-10 inline-flex p-5 bg-[#1DB954]/10 rounded-3xl">
            <HiOutlineSparkles className="text-4xl text-[#1DB954]" />
          </div>

          <h1 className="text-7xl font-black tracking-tighter text-white mb-6">
            Swipe. <span className="text-gray-500">Listen.</span> <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] to-[#1ed760]">Repeat.</span>
          </h1>

          <p className="text-xl text-gray-400 font-medium mb-12 leading-relaxed">
            The next generation of music discovery. Connect your Spotify to start swiping through your personal sonic universe.
          </p>

          <button
            onClick={() => signIn('spotify')}
            className="group relative px-10 py-5 bg-[#1DB954] text-black font-black rounded-full text-xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_20px_40px_rgba(29,185,84,0.3)] flex items-center gap-3 mx-auto"
          >
            Connect Spotify
            <HiOutlineArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  const track = tracks[currentIndex];

  if (!tracks.length) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      {error ? (
        <div className="max-w-md p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
          <p className="text-red-400 font-bold mb-4">Error: {error}</p>
          <button
            onClick={() => fetchTracks()}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors font-bold"
          >
            Retry Discovery
          </button>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-6 text-gray-500 font-bold uppercase tracking-tighter">Manifesting Tracks...</p>
        </>
      )}
    </div>
  );

  if (!track) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8">
        <HiOutlineMusicNote className="text-4xl text-gray-400" />
      </div>
      <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Sonic Horizon Reached</h2>
      <p className="text-gray-400 font-medium mb-10">You've explored everything we have for now. Check back soon for fresh rotations.</p>

      <div className="flex gap-4">
        <button
          onClick={() => window.location.href = "/recommendations"}
          className="px-8 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform"
        >
          View Matches
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative">

      {/* Dynamic Background logic is handled in RootLayout/Ambient backgrounds, 
          but we can add a subtle page-specific glow based on track cover */}
      <AnimatePresence mode="wait">
        <motion.div
          key={track.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-0 blur-[150px]"
          style={{ background: `radial-gradient(circle at 50% 50%, ${track.color || '#1DB954'}44, transparent)` }}
        />
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-lg">
        <SwipeCard
          track={track}
          swipeDirection={swipeDirection}
          dragHandlers={{ onDrag: handleDrag, onDragEnd: handleDragEnd }}
          controls={controls}
        />
      </div>

      {/* Floating Action Buttons */}
      <div className="mt-12 flex gap-8 z-20">
        <button
          onClick={() => { controls.start({ x: -500, opacity: 0, rotate: -20, transition: { duration: 0.4 } }); handleSwipe(false); }}
          className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center text-3xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-500 group shadow-2xl"
        >
          <span className="group-hover:scale-125 transition-transform duration-500">✕</span>
        </button>
        <button
          onClick={() => { controls.start({ x: 500, opacity: 0, rotate: 20, transition: { duration: 0.4 } }); handleSwipe(true); }}
          className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center text-3xl hover:bg-[#1DB954] hover:text-black hover:border-[#1DB954] transition-all duration-500 group shadow-2xl"
        >
          <span className="group-hover:scale-125 transition-transform duration-500">♥</span>
        </button>
      </div>
    </div>
  );
}
