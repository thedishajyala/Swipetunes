"use client";
import { useState, useEffect } from "react";
import { useAnimation } from "framer-motion";
import { supabase } from "@/lib/supabase";
import SwipeCard from "../components/SwipeCard";
import SkeletonCard from "../components/SkeletonCard";
import UserProfile from "../components/UserProfile";

export default function Home() {
  const [session, setSession] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const controls = useAnimation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ swipes: 0 });

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleProfileUpsert(session.user);
        fetchStats(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleProfileUpsert(session.user);
        fetchStats(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStats = async (userId) => {
    const { count } = await supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('liked', true)
      .eq('user_id', userId);
    setStats({ swipes: count || 0 });
  };
  // Since 'api/swipe' is gone, we fetch from Supabase if 'tracks' table exists.
  // Previous migration created 'tracks'.
  useEffect(() => {
    if (session) {
      async function fetchTracks() {
        const { data, error } = await supabase.from('tracks').select('*').limit(20);
        if (data) setTracks(data);
      }
      fetchTracks();
    }
  }, [session]);

  const handleProfileUpsert = async (user) => {
    // Step 7: Create profile
    await supabase.from('profiles').upsert({
      id: user.id,
      name: user.user_metadata.full_name,
      avatar: user.user_metadata.avatar_url,
    });
  }

  const loginWithSpotify = async () => {
    // Step 4: Login with Spotify
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  }

  const handleSwipe = async (liked) => {
    const track = tracks[currentIndex];

    // Optimistic UI update
    setSwipeDirection(null);
    setCurrentIndex((prev) => prev + 1);

    // Step 6: Store swipe in Supabase 'swipes' table
    if (session?.user && track) {
      await supabase.from('swipes').insert({
        user_id: session.user.id,
        track_id: track.id, // Assuming track.id is a string/int stored in track_id
        liked
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <SkeletonCard />
        <p className="mt-8 text-gray-500 font-medium animate-pulse">Curating your vibe...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden">
        {/* Background noise texture */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] "></div>

        {/* Ambient Background Spotlights */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="z-10 flex flex-col items-center text-center max-w-lg">
          <div className="mb-8 p-4 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl">
            <span className="text-6xl">🎵</span>
          </div>
          <h1 className="text-5xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
            Swipetunes
          </h1>
          <p className="text-xl text-gray-400 mb-10 font-medium">
            Discover music by swiping. Connect with friends. Compare tastes.
          </p>
          <button
            onClick={loginWithSpotify}
            className="group relative px-8 py-4 bg-[#1DB954] text-black font-bold rounded-full text-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(29,185,84,0.4)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
              Login with Spotify
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>
        </div>
      </div>
    );
  }

  const track = tracks[currentIndex];

  if (!tracks.length) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-400">Loading Tracks...</p>
    </div>
  );

  if (!track) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative overflow-hidden">
      {/* Background noise texture */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] "></div>

      <div className="z-10 text-center max-w-md">
        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">All Caught Up!</h2>
        <p className="text-gray-400 mb-8 text-lg">You've swiped through all available tracks for now.</p>

        <div className="flex gap-4 justify-center">
          <button
            className="px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            onClick={() => window.location.href = "/recommendations"}
          >
            View Matches
          </button>
          <button
            className="px-8 py-4 bg-gray-900 border border-gray-700 rounded-full font-bold hover:bg-gray-800 transition-colors"
            onClick={() => window.location.href = "/history"}
          >
            History
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden relative">

      {/* Dynamic Ambient Background */}
      {track.coverImage && (
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center blur-[100px] opacity-40 scale-125 transition-all duration-[1000ms]"
            style={{ backgroundImage: `url(${track.coverImage})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Header Info */}
      <div className="absolute top-0 w-full p-6 flex flex-col items-center z-20 pointer-events-none">

        {/* User Stats Display */}
        <div className="pointer-events-auto w-full flex justify-center">
          <UserProfile session={session} stats={stats} />
        </div>
      </div>

      {/* Card Container */},
      <div className="relative z-10 w-full max-w-md flex justify-center items-center h-[700px]">
        <SwipeCard
          track={track}
          swipeDirection={swipeDirection}
          dragHandlers={{ onDrag: handleDrag, onDragEnd: handleDragEnd }}
          controls={controls}
        />
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-10 z-20 flex gap-8">
        <button
          onClick={() => { controls.start({ x: -500, opacity: 0, rotate: -20, transition: { duration: 0.4 } }); handleSwipe(false); }}
          className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-red-500/30 text-red-500 flex items-center justify-center text-3xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-red-500/50"
        >
          ✕
        </button>
        <button
          onClick={() => { controls.start({ x: 500, opacity: 0, rotate: 20, transition: { duration: 0.4 } }); handleSwipe(true); }}
          className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-green-500/30 text-green-500 flex items-center justify-center text-3xl hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300 shadow-lg hover:shadow-green-500/50"
        >
          ♥
        </button>
      </div>

    </div>
  );
}
