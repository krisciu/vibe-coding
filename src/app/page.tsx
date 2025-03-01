"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Vibe types and data
type VibeType =
  | "chaotic"
  | "chill"
  | "retro"
  | "cyberpunk"
  | "vaporwave"
  | "cottagecore";

type MoodMash = {
  colors: string[];
  fontFamily: string;
  quote: string;
  music: string;
  emoji: string[];
  background: string;
  vibe: VibeType;
};

// Random vibe quotes
const QUOTES = [
  "Vibing so hard the universe can't handle it",
  "Not a mood, a lifestyle",
  "Embracing the chaos one glitter bomb at a time",
  "Too busy being iconic to care",
  "Living life on airplane mode",
  "Sorry I can't hear you over my own fabulousness",
  "Just out here collecting vibes like Pokémon",
  "Chaotic good with a sprinkle of sparkle",
  "My personality is 80% song lyrics and 20% movie quotes",
  "Slightly unhinged, but in a cute way",
  "Existing somewhere between 'got my life together' and 'total mess'",
  "Powered by chaos and caffeine",
  "Professional daydreamer, amateur everything else",
  "More issues than Vogue but twice as entertaining",
];

// Random music suggestions
const MUSIC = [
  "Lo-fi beats to chill/study to",
  "Hyperpop playlist that will blow your speakers",
  "80s synthwave driving at midnight",
  "That one song you had on repeat in 2016",
  "Coffee shop jazz but make it chaotic",
  "Phonk remixes of classical music",
  "Songs that make you feel like the main character",
  "Nostalgic hits from your childhood",
  "Cottagecore folk with a hint of witchcraft",
  "Glitchcore to question your reality",
  "Dreamy bedroom pop for stargazing",
  "Ambient sounds of a shopping mall in 1992",
];

// Random emoji sets for different vibes
const EMOJI_SETS = [
  ["✨", "🔮", "🌙", "💫", "🪐"],
  ["🌈", "🦄", "🍭", "🧁", "🫧"],
  ["🔥", "💯", "🤪", "💅", "🎭"],
  ["🌊", "🧿", "🦋", "🌸", "🕊️"],
  ["🖤", "🥀", "🩸", "🗡️", "🕸️"],
  ["🤖", "👾", "🎮", "💾", "📡"],
  ["🌿", "🍄", "🌻", "🐝", "🍯"],
];

// Background patterns
const BACKGROUNDS = [
  "radial-gradient(circle, var(--vibe-neon-pink), var(--vibe-neon-blue))",
  "linear-gradient(45deg, var(--vibe-sunset-orange), var(--vibe-sunset-purple))",
  "repeating-linear-gradient(45deg, var(--vibe-retro-teal), var(--vibe-retro-teal) 10px, var(--vibe-retro-pink) 10px, var(--vibe-retro-pink) 20px)",
  "linear-gradient(to right, var(--vibe-vaporwave-blue), var(--vibe-vaporwave-pink))",
  "linear-gradient(to bottom right, var(--vibe-cyberpunk-yellow), var(--vibe-cyberpunk-purple))",
  "repeating-radial-gradient(circle at 25% 25%, var(--vibe-neon-green) 0px, var(--vibe-neon-blue) 40px)",
];

// Font options
const FONTS = [
  "var(--font-paytone)",
  "var(--font-cherry)",
  "var(--font-marker)",
  "var(--font-mono)",
];

// Function to generate a random mood mash
const generateRandomMoodMash = (twitterHandle: string): MoodMash => {
  // We're just doing random generation for now
  // Later we could use the Twitter handle to fetch real data

  const randomColors = [
    `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  ];

  return {
    colors: randomColors,
    fontFamily: FONTS[Math.floor(Math.random() * FONTS.length)],
    quote: QUOTES[Math.floor(Math.random() * QUOTES.length)],
    music: MUSIC[Math.floor(Math.random() * MUSIC.length)],
    emoji: EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)],
    background: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)],
    vibe: [
      "chaotic",
      "chill",
      "retro",
      "cyberpunk",
      "vaporwave",
      "cottagecore",
    ][Math.floor(Math.random() * 6)] as VibeType,
  };
};

export default function Home() {
  const [twitterHandle, setTwitterHandle] = useState("");
  const [moodMash, setMoodMash] = useState<MoodMash | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMoodMash = () => {
    setIsGenerating(true);

    // Simulate loading for effect
    setTimeout(() => {
      const newMoodMash = generateRandomMoodMash(twitterHandle);
      setMoodMash(newMoodMash);
      setIsGenerating(false);
    }, 1200);
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
              background: moodMash.background,
              fontFamily: moodMash.fontFamily,
            }}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
                  @{twitterHandle}'s Vibe
                </h2>
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
                  <p className="text-xl font-bold text-white">
                    {moodMash.vibe.toUpperCase()} ENERGY
                  </p>
                </div>
              </div>

              <p className="text-2xl md:text-3xl mb-6 text-white drop-shadow-md float">
                "{moodMash.quote}"
              </p>

              <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg mb-4 pulse">
                <p className="text-lg font-bold text-white mb-1">
                  Current Soundtrack:
                </p>
                <p className="text-white text-xl">{moodMash.music}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {moodMash.emoji.map((emoji, i) => (
                  <span
                    key={i}
                    className="text-4xl float"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
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
                      `https://twitter.com/intent/tweet?text=I just generated my vibe with Mood Mash! My energy is ${moodMash.vibe.toUpperCase()} and my quote is "${
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
            {moodMash.colors.map((color, i) => (
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
      </main>

      <footer className="mt-auto py-4 text-center opacity-80">
        <p>Made with chaotic energy ✨ Vibe Coding Project</p>
      </footer>
    </div>
  );
}
