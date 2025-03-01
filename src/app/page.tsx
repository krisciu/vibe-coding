"use client";

import { useState, useEffect } from "react";
import { VibeEntry } from "@/utils/supabase";

// Vibe types and data
type VibeType =
  | "chaotic"
  | "chill"
  | "retro"
  | "cyberpunk"
  | "vaporwave"
  | "cottagecore"
  | "hyper-digital"
  | "cosmic"
  | "goth"
  | "dreamcore"
  | "ethereal"
  | "absurdist";

type MoodMash = {
  quote: string;
  vibeType: VibeType;
  colorPalette: string[];
  music: string;
  emojiSet: string[];
  background: string;
};

// Background patterns based on vibeType description
const getBackgroundStyle = (background: string) => {
  // This is a simplified version that could be enhanced with more pattern logic
  if (background.includes("gradient")) {
    return "linear-gradient(45deg, var(--vibe-sunset-orange), var(--vibe-sunset-purple))";
  }
  if (background.includes("cyberpunk")) {
    return "linear-gradient(to bottom right, var(--vibe-cyberpunk-yellow), var(--vibe-cyberpunk-purple))";
  }
  if (background.includes("vaporwave")) {
    return "linear-gradient(to right, var(--vibe-vaporwave-blue), var(--vibe-vaporwave-pink))";
  }
  if (background.includes("retro")) {
    return "repeating-linear-gradient(45deg, var(--vibe-retro-teal), var(--vibe-retro-teal) 10px, var(--vibe-retro-pink) 10px, var(--vibe-retro-pink) 20px)";
  }
  if (background.includes("cosmic") || background.includes("nebula")) {
    return "radial-gradient(circle, var(--vibe-neon-pink), var(--vibe-neon-blue))";
  }
  if (background.includes("glitch")) {
    return "repeating-radial-gradient(circle at 25% 25%, var(--vibe-neon-green) 0px, var(--vibe-neon-blue) 40px)";
  }

  // Default fallback
  return "linear-gradient(45deg, var(--vibe-sunset-orange), var(--vibe-sunset-purple))";
};

// Font selection based on vibeType
const getFontFamily = (vibeType: VibeType) => {
  switch (vibeType.toLowerCase()) {
    case "chaotic":
    case "absurdist":
      return "var(--font-cherry)";
    case "cyberpunk":
    case "hyper-digital":
      return "var(--font-mono)";
    case "retro":
    case "vaporwave":
      return "var(--font-paytone)";
    case "cottagecore":
    case "dreamcore":
    case "ethereal":
      return "var(--font-marker)";
    default:
      return "var(--font-cherry)";
  }
};

export default function Home() {
  const [twitterHandle, setTwitterHandle] = useState("");
  const [moodMash, setMoodMash] = useState<MoodMash | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [popularVibes, setPopularVibes] = useState<VibeEntry[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsCount, setAnalyticsCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"recent" | "likes">("recent");

  // Fetch popular vibes on component mount
  useEffect(() => {
    fetchPopularVibes();
    fetchGenerationCount();
  }, [sortBy]);

  const fetchGenerationCount = async () => {
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      if (data.count) {
        setAnalyticsCount(data.count);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchPopularVibes = async () => {
    try {
      setIsLoadingPopular(true);
      const response = await fetch(`/api/popular-vibes?limit=6&sort=${sortBy}`);
      const data = await response.json();
      if (data.vibes) {
        setPopularVibes(data.vibes);
      }
    } catch (err) {
      console.error("Error fetching popular vibes:", err);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  const generateMoodMash = async () => {
    if (!twitterHandle.trim()) {
      setError("Please enter a Twitter/X handle");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Call our API route to generate a vibe
      const response = await fetch("/api/generate-vibe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ twitterHandle }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMoodMash(data.vibe);

      // Refresh popular vibes and analytics after generating a new one
      fetchPopularVibes();
      fetchGenerationCount();
    } catch (err) {
      console.error("Error generating vibe:", err);
      setError("Failed to generate vibe. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Display a popular vibe
  const displayPopularVibe = (vibe: VibeEntry) => {
    // Type cast to ensure compatibility
    const vibeData = vibe.vibe_data as unknown as MoodMash;
    setMoodMash(vibeData);
    setTwitterHandle(vibe.twitter_handle);
  };

  // Like a vibe
  const likeVibe = async (id: number | undefined) => {
    if (!id) return;

    try {
      await fetch(`/api/like-vibe/${id}`, { method: "POST" });
      // Update the liked vibe in the list
      setPopularVibes((vibes) =>
        vibes.map((vibe) => {
          if (vibe.id === id) {
            return {
              ...vibe,
              likes: (vibe.likes || 0) + 1,
            };
          }
          return vibe;
        })
      );
    } catch (err) {
      console.error("Error liking vibe:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl text-center mb-8 mt-8">
        <h1
          className="text-4xl md:text-6xl font-bold mb-2"
          style={{ fontFamily: "var(--font-cherry)" }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            MOOD MASH
          </span>
        </h1>
        <p className="text-lg" style={{ fontFamily: "var(--font-marker)" }}>
          Your chaotic vibe generator ✨🌈🔮
        </p>
        {analyticsCount > 0 && (
          <p className="text-sm mt-2 opacity-70">
            {analyticsCount.toLocaleString()} vibes generated and counting!
          </p>
        )}
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center">
        <div className="w-full max-w-md mb-8 p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-lg">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="twitter-handle"
              className="font-bold"
              style={{ fontFamily: "var(--font-marker)" }}
            >
              Enter your Twitter/X handle:
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md">
                @
              </span>
              <input
                id="twitter-handle"
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="yourhandle"
                className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-r-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <button
              onClick={generateMoodMash}
              disabled={isGenerating}
              className={`py-3 px-4 font-bold rounded-lg transition-all ${
                isGenerating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              }`}
              style={{ fontFamily: "var(--font-paytone)" }}
            >
              {isGenerating ? "Generating..." : "Generate My Vibe!"}
            </button>
          </div>
        </div>

        {moodMash && (
          <div
            className="w-full p-8 rounded-xl shadow-2xl mb-12 transition-all relative overflow-hidden"
            style={{
              background: moodMash.background
                ? getBackgroundStyle(moodMash.background)
                : moodMash.background,
              fontFamily: getFontFamily(moodMash.vibeType),
            }}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
                  @{twitterHandle}&apos;s Vibe
                </h2>
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
                  <p className="text-xl font-bold text-white">
                    {moodMash.vibeType.toUpperCase()} ENERGY
                  </p>
                </div>
              </div>

              <p className="text-2xl md:text-3xl mb-6 text-white drop-shadow-md float">
                &quot;{moodMash.quote}&quot;
              </p>

              <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg mb-4 pulse">
                <p className="text-lg font-bold text-white mb-1">
                  Current Soundtrack:
                </p>
                <p className="text-white text-xl">{moodMash.music}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {moodMash.emojiSet.map((emoji, i) => (
                  <span
                    key={i}
                    className="text-4xl float"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 mt-6 flex-wrap">
                <button
                  className="bg-black/40 text-white px-4 py-2 rounded-full hover:bg-black/60 transition-all"
                  onClick={() => generateMoodMash()}
                >
                  Regenerate
                </button>
                <button
                  className="bg-[#1DA1F2]/90 text-white px-4 py-2 rounded-full hover:bg-[#1DA1F2] transition-all"
                  onClick={() => {
                    window.open(
                      `https://twitter.com/intent/tweet?text=I just generated my vibe with Mood Mash! My energy is ${moodMash.vibeType.toUpperCase()} and my quote is "${
                        moodMash.quote
                      }" %0A%0AGenerate yours at moodmash.vercel.app`,
                      "_blank"
                    );
                  }}
                >
                  Share on Twitter
                </button>
              </div>
            </div>

            {/* Decorative elements */}
            {moodMash.colorPalette.map((color, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-70 spin"
                style={{
                  backgroundColor: color,
                  width: `${100 + i * 50}px`,
                  height: `${100 + i * 50}px`,
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 80}%`,
                  animationDuration: `${15 + i * 5}s`,
                  animationDirection: i % 2 === 0 ? "normal" : "reverse",
                  zIndex: 1,
                }}
              />
            ))}
          </div>
        )}

        {/* Popular Vibes Section */}
        <section className="w-full max-w-4xl mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "var(--font-paytone)" }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Vibe Hall of Fame
              </span>
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("recent")}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  sortBy === "recent"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy("likes")}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  sortBy === "likes"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                Most Liked
              </button>
            </div>
          </div>

          {isLoadingPopular ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : popularVibes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularVibes.map((entry, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg overflow-hidden shadow-md transition-all hover:shadow-xl bg-white/10 backdrop-blur-md"
                >
                  <div
                    className="h-24 mb-3 rounded overflow-hidden cursor-pointer"
                    style={{
                      background: entry.vibe_data.background
                        ? getBackgroundStyle(entry.vibe_data.background)
                        : "linear-gradient(45deg, var(--vibe-sunset-orange), var(--vibe-sunset-purple))",
                    }}
                    onClick={() => displayPopularVibe(entry)}
                  />
                  <h3
                    className="font-bold mb-1 cursor-pointer"
                    onClick={() => displayPopularVibe(entry)}
                  >
                    @{entry.twitter_handle}
                  </h3>
                  <p className="text-sm mb-2">
                    {entry.vibe_data.vibeType.toUpperCase()} ENERGY
                  </p>
                  <p className="text-xs opacity-70 truncate mb-3">
                    &quot;{entry.vibe_data.quote}&quot;
                  </p>
                  <div className="flex justify-between items-center">
                    <button
                      className="text-xs px-2 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-all flex items-center gap-1"
                      onClick={() => likeVibe(entry.id)}
                    >
                      <span>❤️</span> {entry.likes || 0}
                    </button>
                    <span className="text-xs opacity-50">
                      {new Date(entry.created_at || "").toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center opacity-70 py-8">
              No vibes have been created yet. Be the first!
            </p>
          )}
        </section>
      </main>

      <footer className="mt-auto py-4 text-center opacity-80">
        <p>Made with chaotic energy ✨ Vibe Coding Project</p>
        <button
          className="mt-2 text-xs underline opacity-50 hover:opacity-100"
          onClick={() => window.open("/api/setup", "_blank")}
        >
          Setup Database
        </button>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <p className="text-xs mt-1 opacity-50">
            Vibes are being stored for future viewing
          </p>
        )}
      </footer>
    </div>
  );
}
