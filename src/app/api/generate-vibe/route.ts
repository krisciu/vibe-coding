import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { storeVibeData, MoodMashData } from '@/utils/supabase';

// Initialize OpenAI client
// Note: You'll need to add your API key to your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Twitter handle validation regex - strictly enforce alphanumeric + underscore only
const TWITTER_HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { twitterHandle } = body;
    
    // Sanitize the input by removing any non-alphanumeric/underscore characters
    if (twitterHandle) {
      // Remove @ if present
      if (twitterHandle.startsWith('@')) {
        twitterHandle = twitterHandle.substring(1);
      }
      
      // Strip any disallowed characters (keeping only letters, numbers, underscores)
      twitterHandle = twitterHandle.replace(/[^A-Za-z0-9_]/g, '');
    }
    
    // Validate Twitter handle format
    if (!twitterHandle || !TWITTER_HANDLE_REGEX.test(twitterHandle)) {
      return NextResponse.json(
        { error: 'Invalid Twitter handle. Handles must be 1-15 characters and can only contain letters, numbers, and underscores.' }, 
        { status: 400 }
      );
    }

    // Generate advanced vibe using OpenAI
    const vibeResponse = await generateAdvancedVibe(twitterHandle);
    
    // Log the vibe type to help debug
    console.log(`Final vibe type: ${vibeResponse.vibeType} for handle: ${twitterHandle}`);
    
    // Store the vibe data in database
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      await storeVibeData(twitterHandle, vibeResponse);
    }
    
    return NextResponse.json({ vibe: vibeResponse });
  } catch (error) {
    console.error('Error generating vibe:', error);
    return NextResponse.json({ error: 'Failed to generate vibe' }, { status: 500 });
  }
}

// Get vibe type based on Twitter handle characteristics
function getVibeTypeFromHandle(handle: string): string {
  const vibeTypes = [
    "chaotic", "chill", "retro", "cyberpunk", 
    "vaporwave", "cottagecore", "hyper-digital", 
    "cosmic", "goth", "dreamcore", "ethereal"
  ];
  
  // Create a score for each vibe type based on handle characteristics
  const scores = new Map<string, number>();
  
  // Initialize all scores to 1
  vibeTypes.forEach(type => scores.set(type, 1));
  
  // Length-based scoring
  if (handle.length <= 5) {
    scores.set("chill", scores.get("chill")! + 3);
    scores.set("retro", scores.get("retro")! + 2);
  } else if (handle.length > 10) {
    scores.set("chaotic", scores.get("chaotic")! + 3);
    scores.set("hyper-digital", scores.get("hyper-digital")! + 2);
  }
  
  // Character-based scoring
  const hasUppercase = /[A-Z]/.test(handle);
  const hasNumbers = /[0-9]/.test(handle);
  const hasUnderscores = handle.includes('_');
  
  if (hasUppercase) {
    scores.set("vaporwave", scores.get("vaporwave")! + 2);
    scores.set("cyberpunk", scores.get("cyberpunk")! + 2);
  }
  
  if (hasNumbers) {
    scores.set("cyberpunk", scores.get("cyberpunk")! + 3);
    scores.set("hyper-digital", scores.get("hyper-digital")! + 2);
  }
  
  if (hasUnderscores) {
    scores.set("goth", scores.get("goth")! + 2);
    scores.set("dreamcore", scores.get("dreamcore")! + 3);
  }
  
  // First letter-based scoring
  const firstChar = handle.charAt(0).toLowerCase();
  if ('abcde'.includes(firstChar)) {
    scores.set("ethereal", scores.get("ethereal")! + 3);
  } else if ('fghij'.includes(firstChar)) {
    scores.set("cottagecore", scores.get("cottagecore")! + 3);
  } else if ('klmno'.includes(firstChar)) {
    scores.set("cosmic", scores.get("cosmic")! + 3);
  } else if ('pqrst'.includes(firstChar)) {
    scores.set("retro", scores.get("retro")! + 3);
  } else {
    scores.set("vaporwave", scores.get("vaporwave")! + 3);
  }
  
  // Add some randomness - 1 to 5 additional points
  vibeTypes.forEach(type => {
    const randomBoost = Math.floor(Math.random() * 5) + 1;
    scores.set(type, scores.get(type)! + randomBoost);
  });
  
  // Convert scores to probability distribution
  const totalScore = Array.from(scores.values()).reduce((sum, score) => sum + score, 0);
  const probabilities: [string, number][] = [];
  
  scores.forEach((score, type) => {
    probabilities.push([type, score / totalScore]);
  });
  
  // Weighted random selection
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const [type, probability] of probabilities) {
    cumulativeProbability += probability;
    if (random <= cumulativeProbability) {
      console.log(`Selected vibe type '${type}' based on handle characteristics with probability ${probability.toFixed(2)}`);
      return type;
    }
  }
  
  // Fallback (should never reach here, but just in case)
  return vibeTypes[Math.floor(Math.random() * vibeTypes.length)];
}

async function generateAdvancedVibe(twitterHandle: string): Promise<MoodMashData> {
  // Define prompt for the AI - make it more deranged but thematically consistent
  const vibeType = getVibeTypeFromHandle(twitterHandle);
  
  const prompt = `Generate a creative, slightly DERANGED "vibe" for Twitter/X user @${twitterHandle} with a vibe type of "${vibeType}".
  
  The vibe should be thematically consistent - ALL elements should clearly reflect the "${vibeType}" aesthetic.
  
  Make the quote unsettling but not horrifying - think of a mix between Adult Swim at 3AM, existential dread, and internet weird-core. It should be memorable, slightly disturbing, but not traumatizing or offensive.
  
  Return a JSON object with the following properties:
  - quote: A unique, slightly deranged quote that reflects the "${vibeType}" vibe (dark humor, existential thoughts, or bizarre observations that match this specific aesthetic)
  - vibeType: "${vibeType}" (do not change this value)
  - colorPalette: Array of 3 hex color codes that specifically match the "${vibeType}" aesthetic
  - music: A specific music recommendation that perfectly matches the "${vibeType}" vibe (specific artist/song with a slightly unsettling listening scenario)
  - emojiSet: Array of 5 emojis that specifically represent the "${vibeType}" vibe (unusual combinations that feel thematically linked)
  - background: A text description of a visual background pattern that matches the "${vibeType}" aesthetic with a slightly unsettling twist

  Make it thematically consistent, slightly unnerving, but not extremely disturbing. DO NOT include any explanation, ONLY return the valid JSON.`;

  try {
    // If no API key is available, return mock data
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key found, using mock data");
      return getMockVibeData(twitterHandle);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a creative vibe generator that creates unsettling, thematically consistent digital aesthetics. You create content that feels slightly off, a bit unsettling, but not horrifying or traumatizing. Each element you create should align with the specified vibe type." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.85, // High but not extreme temperature for creative outputs
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.log("No content returned from OpenAI, using mock data");
      return getMockVibeData(twitterHandle);
    }
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Ensure the vibe type matches what we specified (in case OpenAI didn't follow instructions)
      if (parsedContent.vibeType !== vibeType) {
        console.log(`OpenAI changed vibe type from '${vibeType}' to '${parsedContent.vibeType}'. Correcting.`);
        parsedContent.vibeType = vibeType;
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return getMockVibeData(twitterHandle);
    }
    
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to mock data if API fails
    return getMockVibeData(twitterHandle);
  }
}

// Fallback function to get mock vibe data if API call fails
function getMockVibeData(twitterHandle: string): MoodMashData {
  const vibeType = getVibeTypeFromHandle(twitterHandle);
  
  // Create a set of thematically linked content based on vibe type
  const vibeContent: Record<string, {
    quotes: string[],
    backgrounds: string[],
    music: string[],
    emojiSets: string[][],
    colors: string[]
  }> = {
    // Chaotic vibe content - erratic and unpredictable
    'chaotic': {
      quotes: [
        "My thoughts are a browser with 74 tabs open and I can hear each one screaming",
        "Sometimes I set alarms for 3:47 AM just to confuse my future self",
        "The void stares back and occasionally it winks",
        "I alphabetize my intrusive thoughts just to keep them organized"
      ],
      backgrounds: [
        "Glitching pixels that occasionally form recognizable shapes before dissolving",
        "Static noise with random flashes of neon colors that form patterns only visible from the corner of your eye",
        "Rapidly shifting geometric shapes that seem to be trying to escape the screen"
      ],
      music: [
        "100 gecs '745 sticky' played simultaneously from three different devices slightly out of sync",
        "Death Grips 'Guillotine' but every bass drop makes your room temperature drop 1 degree",
        "Aphex Twin's 'Come To Daddy' listened to while organizing your sock drawer at 2AM"
      ],
      emojiSets: [
        ["🔥", "🤪", "🌀", "👁️", "⚡"],
        ["🌪️", "🤯", "🎭", "🧠", "🔮"],
        ["💥", "🥴", "🎪", "🧿", "💫"]
      ],
      colors: ['#FF00FF', '#00FFFF', '#FF0000', '#FFFF00', '#00FF00']
    },
    
    // Chill vibe content - relaxed but slightly off
    'chill': {
      quotes: [
        "I'm so relaxed I might just dissolve into the couch and become one with the universe",
        "Sometimes I think about how plants are just silently judging our life choices",
        "The best naps happen when you're supposed to be doing something important",
        "Time isn't real when you're staring at clouds that look like your childhood memories"
      ],
      backgrounds: [
        "Slow-moving pastel clouds that occasionally form faces when you're not looking directly at them",
        "Gently rippling water with mysterious shadows passing underneath",
        "Lo-fi pixel art of a rainy window with occasional lightning flashes that illuminate strange silhouettes"
      ],
      music: [
        "Tycho's 'Dive' played at half speed while watching ice cubes melt in real time",
        "Mac DeMarco's 'Chamber of Reflection' but it sounds like it's playing from an empty apartment next door",
        "Nujabes' 'Aruarian Dance' listened to while watching dust particles float in sunbeams"
      ],
      emojiSets: [
        ["🌊", "💭", "🌿", "👁️", "✨"],
        ["🍃", "🧘", "🌙", "🔮", "🪐"],
        ["☁️", "🧊", "🧿", "🪷", "🌌"]
      ],
      colors: ['#87CEEB', '#B0E0E6', '#AFEEEE', '#E0FFFF', '#F0F8FF']
    },
    
    // Retro vibe content - nostalgic with a twist
    'retro': {
      quotes: [
        "The static between TV channels at 3AM knows more about you than your therapist",
        "VHS tapes remember every moment you've forgotten",
        "Looking at old photos of yourself feels like recognizing a stranger who's wearing your skin",
        "Nostalgia is just the brain's way of making you homesick for places that never existed"
      ],
      backgrounds: [
        "VHS tracking errors that occasionally reveal frames from videos you don't remember watching",
        "80s grid patterns with glowing lines that seem to lead somewhere just out of frame",
        "Vintage wallpaper patterns that shift and change when viewed in reflective surfaces"
      ],
      music: [
        "The Cure's 'Pictures of You' played on a Walkman with dying batteries while looking through old yearbooks",
        "Talking Heads' 'This Must Be The Place' but it sounds like it's coming from a neighbor's pool party in 1986",
        "New Order's 'Blue Monday' on vinyl that keeps skipping at the exact same moment every time"
      ],
      emojiSets: [
        ["📺", "📼", "🕹️", "👾", "💾"],
        ["🎮", "📻", "🧩", "🪩", "📟"],
        ["📸", "🪓", "🧠", "👁️", "📠"]
      ],
      colors: ['#FF6347', '#FFD700', '#40E0D0', '#FF7F50', '#00CED1']
    },
    
    // More vibe types with thematically consistent content
    'cyberpunk': {
      quotes: [
        "My digital footprint is probably more interesting than my actual personality",
        "Sometimes I feel like I'm just a glitch in someone else's simulation",
        "The line between my online self and real self isn't just blurred—it's been deleted",
        "Every time my phone dies I experience an existential crisis"
      ],
      backgrounds: [
        "A neon-lit cityscape where advertisements occasionally display your private thoughts",
        "Digital rain of code that, if you look closely, contains fragments of your search history",
        "Circuit board patterns that pulse with electricity, forming neural network-like structures"
      ],
      music: [
        "Perturbator's 'Future Club' played through malfunctioning earbuds that whisper subliminal messages",
        "Gesaffelstein's 'Pursuit' listened to while watching security camera footage of empty streets",
        "Crystal Castles' 'Not In Love' blasting from a car with tinted windows that's been parked outside your house for days"
      ],
      emojiSets: [
        ["🤖", "👁️", "🔌", "💊", "⚠️"],
        ["🧠", "💉", "📡", "👾", "🔬"],
        ["🧿", "💾", "📱", "🧪", "🔋"]
      ],
      colors: ['#FF00FF', '#00FFFF', '#FF0000', '#0000FF', '#FFFF00']
    },
    
    'vaporwave': {
      quotes: [
        "If you listen closely to mall muzak, you can hear the hidden frequencies of nostalgia",
        "Every abandoned shopping mall is a monument to forgotten dreams",
        "Sometimes I feel like a Windows 95 screensaver just bouncing endlessly against the edges of reality",
        "Time is just a construct made by people who were uncomfortable with eternity"
      ],
      backgrounds: [
        "Endless rows of Roman columns against a sunset gradient that never quite feels natural",
        "Glitchy VHS-quality footage of empty shopping malls with occasional glimpses of figures standing perfectly still",
        "Pixelated palm trees swaying in digital wind against a gradient sky that cycles through unnatural colors"
      ],
      music: [
        "Macintosh Plus's 'リサフランク420 / 現代のコンピュー' played in an empty food court at an abandoned mall",
        "Saint Pepsi's 'Private Caller' but every time the sample repeats you notice a new detail in your surroundings",
        "Chuck Person's 'Eccojams Vol. 1' listened to while driving through a city that doesn't appear on any map"
      ],
      emojiSets: [
        ["🗿", "🌴", "💾", "🏛️", "🌇"],
        ["🐬", "📺", "💎", "👁️", "🌊"],
        ["☕", "👤", "🖥️", "🏙️", "🕰️"]
      ],
      colors: ['#FF6AD5', '#C774E8', '#AD8CFF', '#8795E8', '#94D0FF']
    },
    
    'goth': {
      quotes: [
        "I water my plants with my tears—they're thriving",
        "I don't fear the darkness; I am what hides within it",
        "Every cemetery is just a library where no one can read the stories anymore",
        "My shadow sometimes stays in place when I walk away"
      ],
      backgrounds: [
        "Victorian wallpaper patterns that seem to form faces when viewed from peripheral vision",
        "Foggy graveyard with stone angels that appear to be in different positions when you look back at them",
        "Dark fabric textures with subtle movements like something is crawling underneath"
      ],
      music: [
        "The Cure's 'Lullaby' listened to while arranging dried flowers at midnight",
        "Bauhaus's 'Bela Lugosi's Dead' played on a record player that started on its own",
        "Sisters of Mercy's 'Temple of Love' heard while wandering through an old cemetery during a light rain"
      ],
      emojiSets: [
        ["🖤", "🕸️", "🥀", "👁️", "🦇"],
        ["⚰️", "🔮", "🕯️", "🪦", "🌑"],
        ["🧛", "🧠", "⛓️", "🩸", "🐈‍⬛"]
      ],
      colors: ['#000000', '#4A0000', '#6D6D6D', '#27003F', '#0F0F0F']
    },
    
    // Default fallback for any other vibe types
    'default': {
      quotes: [
        "Sometimes I can feel my skeleton trying to escape",
        "My brain plays elevator music 24/7 but occasionally it's reversed",
        "Reality is just a collective hallucination we've all agreed to participate in",
        "I organize my thoughts alphabetically but the alphabet keeps changing"
      ],
      backgrounds: [
        "Subtle patterns that shift and change when you're not looking directly at them",
        "Layers of translucent colors that seem to be hiding messages or faces",
        "Abstract shapes that almost form recognizable objects but never quite resolve"
      ],
      music: [
        "Radiohead's 'Everything In Its Right Place' but it sounds like it's coming from inside your walls",
        "Björk's 'Army of Me' listened to while standing perfectly still in an empty elevator",
        "David Bowie's 'Space Oddity' playing from a radio that you're sure was unplugged"
      ],
      emojiSets: [
        ["👁️", "🧠", "🪞", "🕰️", "🌀"],
        ["🔮", "👄", "⏳", "🧿", "🎭"],
        ["🧩", "⚠️", "💭", "🪄", "🔍"]
      ],
      colors: ['#FF00FF', '#00FFFF', '#FF7700', '#00FF00', '#0000FF']
    }
  };
  
  // Use vibe type to get appropriate content or fall back to default
  const content = vibeContent[vibeType] || vibeContent['default'];
  
  // Create hash from handle for somewhat consistent results for the same handle
  const hashCode = twitterHandle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Deterministic selection based on hash
  const quoteIndex = hashCode % content.quotes.length;
  const bgIndex = (hashCode * 2) % content.backgrounds.length;
  const musicIndex = (hashCode * 3) % content.music.length;
  const emojiIndex = (hashCode * 4) % content.emojiSets.length;
  
  // Get color palette based on vibe type
  const colorCount = content.colors.length;
  const randomColors = [
    content.colors[hashCode % colorCount],
    content.colors[(hashCode * 2) % colorCount],
    content.colors[(hashCode * 3) % colorCount]
  ];
  
  return {
    quote: content.quotes[quoteIndex],
    vibeType,
    colorPalette: randomColors,
    music: content.music[musicIndex],
    emojiSet: content.emojiSets[emojiIndex],
    background: content.backgrounds[bgIndex]
  };
} 