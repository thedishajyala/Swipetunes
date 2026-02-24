"use client";
import { useState, useEffect } from "react";
import { useAnimation, motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { HiOutlineMusicNote, HiOutlineSparkles, HiOutlineArrowRight } from "react-icons/hi";
import SwipeCard from "../components/SwipeCard";
import SkeletonCard from "../components/SkeletonCard";
import { saveAction } from "@/lib/api";

export default function Home() {
  const { data: session, status } = useSession();
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const controls = useAnimation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ swipes: 0 });
  const [userId, setUserId] = useState(null);

  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [allGenres, setAllGenres] = useState([]);
  const [selectedDecade, setSelectedDecade] = useState("All");

  useEffect(() => {
    async function initUser() {
      if (session?.user && session.accessToken) {
        console.log("Home: Session ready, figuring out internal ID...");

        // --- UUID RESOLVER ---
        const lookupId = session.user.spotify_id || session.user.id;
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('spotify_id', lookupId)
          .maybeSingle();

        const internalId = profile ? profile.id : session.user.id;
        console.log("Home: Using internal UUID:", internalId);

        setUserId(internalId);
        fetchStats(internalId);
        fetchTracks();
      }
    }
    if (session?.error === "RefreshAccessTokenError") {
      signIn(); // Force sign-in to get new refresh token
      return;
    }
    initUser();
    if (status !== "loading") setLoading(false);
  }, [session, status]);

  // Infinite Scroll / Refill Logic
  useEffect(() => {
    if (tracks.length > 0 && tracks.length - currentIndex < 5 && !loadingMore) {
      console.log("Home: Refilling track queue...");
      fetchTracks(true);
    }
  }, [tracks.length, currentIndex]);

  const fetchStats = async (userId) => {
    try {
      const { count, error: statsError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (statsError) {
        console.error("Home: Fetch Stats Error:", statsError);
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

    if (!session?.accessToken) {
      console.warn("Home: No access token available for fetching tracks.");
      setLoadingMore(false);
      return;
    }

    try {
      const spotifyToken = session.accessToken;

      // NOTE: Spotify deprecated /v1/recommendations in Nov 2024 (returns 404).
      // We now use a multi-source strategy with working endpoints only.

      // Fetch from all 3 working sources in parallel
      const [
        shortTermRes,
        mediumTermRes,
        longTermRes,
        recentRes,
        savedRes,
      ] = await Promise.allSettled([
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50', {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        }),
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50', {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        }),
        fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50', {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        }),
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        }),
        fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        }),
      ]);

      let allTracks = [];

      // Helper to parse fulfilled JSON responses
      const parseJson = async (settled) => {
        if (settled.status === 'fulfilled' && settled.value.ok) {
          return await settled.value.json();
        }
        return null;
      };

      const [shortData, mediumData, longData, recentData, savedData] = await Promise.all([
        parseJson(shortTermRes),
        parseJson(mediumTermRes),
        parseJson(longTermRes),
        parseJson(recentRes),
        parseJson(savedRes),
      ]);

      if (shortData?.items) allTracks.push(...shortData.items);
      if (mediumData?.items) allTracks.push(...mediumData.items);
      if (longData?.items) allTracks.push(...longData.items);
      if (recentData?.items) allTracks.push(...recentData.items.map(i => i.track).filter(Boolean));
      if (savedData?.items) allTracks.push(...savedData.items.map(i => i.track).filter(Boolean));

      // Deduplicate by track ID
      const seen = new Set();
      const uniqueTracks = allTracks.filter(t => {
        if (!t?.id || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      // Shuffle for variety on each load
      const shuffled = uniqueTracks.sort(() => Math.random() - 0.5);

      // Prefer tracks with preview_url but include all if needed
      const withPreview = shuffled.filter(t => t.preview_url);
      const finalTracks = withPreview.length >= 5 ? withPreview : shuffled;

      // Enrich with artist genres (batch artist IDs, max 50 per call)
      const artistIds = [...new Set(finalTracks
        .map(t => t.artists?.[0]?.id).filter(Boolean))].slice(0, 50);
      let genreMap = {};
      if (artistIds.length > 0 && session?.accessToken) {
        try {
          const artistRes = await fetch(
            `https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`,
            { headers: { Authorization: `Bearer ${spotifyToken}` } }
          );
          if (artistRes.ok) {
            const artistData = await artistRes.json();
            (artistData.artists || []).forEach(a => { genreMap[a.id] = a.genres || []; });
          }
        } catch { /* genre enrichment is optional */ }
      }
      const enriched = finalTracks.map(t => ({
        ...t,
        genres: genreMap[t.artists?.[0]?.id] || []
      }));

      // Collect unique genres for filter pills
      const genreSet = new Set();
      enriched.forEach(t => t.genres.slice(0, 2).forEach(g => genreSet.add(g)));
      const topGenres = [...genreSet].slice(0, 10);
      setAllGenres(topGenres);

      console.log(`Home: Found ${enriched.length} tracks (${withPreview.length} with previews).`);

      if (enriched.length === 0) {
        setError("No tracks found. Try listening to more music on Spotify first, then come back!");
      } else {
        setTracks(prev => isMore ? [...prev, ...enriched] : enriched);
      }

    } catch (err) {
      console.error("Home: Failed to fetch tracks", err);
      setError({ details: err.message || "Unable to curate feed. Please try again." });
    }
    setLoadingMore(false);
  }

  const handleSwipe = async (liked) => {
    const track = tracks[currentIndex];

    // Check if we need more tracks

    setSwipeDirection(null);
    setCurrentIndex((prev) => prev + 1);

    if ((userId || session?.user?.id) && track) {
      const targetId = userId || session.user.id;
      const spotifyId = session.user.spotify_id || session.user.id; // Use raw Spotify ID for external backend

      if (liked) {
        setStats(prev => ({ ...prev, swipes: prev.swipes + 1 }));

        try {
          // --- NEW NODE.JS BACKEND CALL ---
          await saveAction({
            spotifyId: spotifyId,
            songId: track.id,
            songName: track.name,
            artist: track.artists ? track.artists[0].name : track.artist,
            action: "like",
            image: (track.album && track.album.images && track.album.images[0]) ? track.album.images[0].url : track.coverImage
          });

          // 0. Persist Track Data (Critical for History/Feeds)
          const { error: songError } = await supabase.from('songs').upsert({
            track_id: track.id,
            title: track.name,
            artist: track.artists ? track.artists[0].name : track.artist,
            album: track.album ? track.album.name : "Single",
            cover_url: (track.album && track.album.images && track.album.images[0]) ? track.album.images[0].url : track.coverImage,
            preview_url: track.preview_url
          }, { onConflict: 'track_id' });

          if (songError) console.error("Home: Failed to persist song data:", songError);

          // 1. Record the Like
          await supabase.from('likes').upsert({
            user_id: targetId,
            track_id: track.id
          });

          // 2. Reward XP for liking a song
          fetch('/api/gamification', {
            method: 'POST',
            body: JSON.stringify({ action: 'swipe_like' })
          });

          // 3. Add to Music Journal
          fetch('/api/journal', {
            method: 'POST',
            body: JSON.stringify({ track_id: track.id, action: 'liked' })
          });
        } catch (e) {
          console.error("Home: Failed to sync social signal:", e);
        }
      } else {
        // Log swipe/nope to backend as well (optional but good for data)
        await saveAction({
          spotifyId: spotifyId,
          songId: track.id,
          songName: track.name,
          artist: track.artists ? track.artists[0].name : track.artist,
          action: "swipe", // swipe left
          image: (track.album && track.album.images && track.album.images[0]) ? track.album.images[0].url : track.coverImage
        });
      }
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center relative">
        {/* Mesh background */}
        <div className="mesh-bg absolute inset-0 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            maxWidth: '580px', width: '100%',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '56px 48px',
            borderRadius: '48px',
            backdropFilter: 'blur(24px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(29,185,84,0.6), transparent)',
          }} />

          {/* Logo mark */}
          <motion.div
            animate={{ rotate: [0, 5, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
            style={{
              display: 'inline-flex', padding: '18px',
              background: 'rgba(29,185,84,0.1)',
              borderRadius: '28px',
              border: '1px solid rgba(29,185,84,0.2)',
              marginBottom: '32px',
            }}
          >
            <HiOutlineSparkles style={{ fontSize: '36px', color: '#1DB954' }} />
          </motion.div>

          <h1 style={{
            fontSize: '60px', fontWeight: 900, letterSpacing: '-2px',
            lineHeight: 1.0, marginBottom: '20px', color: '#fff',
          }}>
            Swipe.{' '}
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Listen.</span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #1DB954, #4ade80)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Repeat.</span>
          </h1>

          <p style={{
            fontSize: '17px', color: 'rgba(255,255,255,0.45)',
            fontWeight: 500, lineHeight: 1.65, marginBottom: '44px',
          }}>
            The next generation of music discovery. Connect Spotify and start swiping through your personal sonic universe.
          </p>

          <button
            onClick={() => signIn('spotify')}
            className="glow-green"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '18px 40px',
              background: '#1DB954',
              color: '#000',
              fontWeight: 800, fontSize: '16px',
              borderRadius: '9999px',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              letterSpacing: '-0.2px',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
          >
            Connect Spotify
            <HiOutlineArrowRight style={{ fontSize: '18px' }} />
          </button>

          {/* Subtle hint */}
          <p style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
            Free to use · No credit card required
          </p>
        </motion.div>
      </div>
    );
  }

  const filteredTracks = tracks.filter(t => {
    const genreOk = selectedGenre === "All" || (t.genres || []).some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()));
    const year = parseInt((t.album?.release_date || t.release_date || "").slice(0, 4));
    const decadeOk = selectedDecade === "All" || (!isNaN(year) && year >= parseInt(selectedDecade) && year < parseInt(selectedDecade) + 10);
    return genreOk && decadeOk;
  });
  const track = filteredTracks[currentIndex];


  if (!tracks.length && !loading) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      {error ? (
        <div className="max-w-md p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
          <p className="text-red-400 font-bold mb-2">Couldn’t fetch tracks. Retry.</p>
          <p className="text-red-300/60 text-xs mb-6 font-medium leading-relaxed">
            {typeof error === 'string' ? error : (error.details || "The cosmic signal is weak. Try again in a moment.")}
          </p>
          <button
            onClick={() => fetchTracks()}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors font-bold"
          >
            Retry Discovery
          </button>
        </div>
      ) : (
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 mx-auto">
            <HiOutlineMusicNote className="text-4xl text-gray-400" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Silence in the Void</h2>
          <p className="text-gray-400 font-medium mb-8">We couldn't find any tracks matching your vibe right now.</p>
          <button
            onClick={() => fetchTracks()}
            className="px-8 py-3 bg-[#1DB954] text-black font-black rounded-full hover:scale-105 transition-transform"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );

  if (loading && tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <SkeletonCard />
        <p className="mt-8 text-gray-500 font-bold uppercase tracking-widest animate-pulse">Curating your vibe...</p>
      </div>
    );
  }

  if (!track) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8">
        <HiOutlineMusicNote className="text-4xl text-gray-400" />
      </div>
      <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Sonic Horizon Reached</h2>
      <p className="text-gray-400 font-medium mb-10">You've explored everything we have for now. Check back soon for fresh rotations.</p>

      <div className="flex gap-4">
        {/* Matches removed for focused MVP */}
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
        {/* Genre filter pills + Decade dropdown */}
        {(allGenres.length > 0) && (
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex flex-wrap gap-2 justify-center px-2">
              {["All", ...allGenres].map(genre => (
                <button
                  key={genre}
                  onClick={() => { setSelectedGenre(genre); setCurrentIndex(0); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${selectedGenre === genre
                      ? "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            {/* Decade dropdown */}
            <div className="flex justify-center">
              <select
                value={selectedDecade}
                onChange={e => { setSelectedDecade(e.target.value); setCurrentIndex(0); }}
                className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white focus:outline-none focus:border-[#1DB954]/50 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <option value="All">🗓 All Eras</option>
                {["1960", "1970", "1980", "1990", "2000", "2010", "2020"].map(d => (
                  <option key={d} value={d}>{d}s</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <SwipeCard
          track={track}
          swipeDirection={swipeDirection}
          dragHandlers={{ onDrag: handleDrag, onDragEnd: handleDragEnd }}
          controls={controls}
        />
      </div>

      {/* Floating Action Buttons */}
      <div style={{ marginTop: '40px', display: 'flex', gap: '28px', zIndex: 20, alignItems: 'center' }}>
        {/* Nope */}
        <button
          onClick={() => { controls.start({ x: -500, opacity: 0, rotate: -20, transition: { duration: 0.4 } }); handleSwipe(false); }}
          style={{
            width: '68px', height: '68px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.08)',
            border: '1.5px solid rgba(239,68,68,0.25)',
            color: '#ef4444', fontSize: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.25s ease',
            backdropFilter: 'blur(12px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(239,68,68,0.3)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>

        {/* Like */}
        <button
          onClick={() => { controls.start({ x: 500, opacity: 0, rotate: 20, transition: { duration: 0.4 } }); handleSwipe(true); }}
          className="glow-green"
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1DB954, #15a041)',
            border: 'none',
            color: '#000', fontSize: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1.1)'}
        >
          ♥
        </button>
      </div>
    </div>
  );
}
