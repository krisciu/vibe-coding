import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { storeVibeData, MoodMashData } from '@/utils/supabase';

// Initialize OpenAI client
// Note: You'll need to add your API key to your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Twitter handle validation regex
const TWITTER_HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { twitterHandle } = body;
    
    // Remove @ if present
    if (twitterHandle && twitterHandle.startsWith('@')) {
      twitterHandle = twitterHandle.substring(1);
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
  // Define prompt for the AI
  const prompt = `Generate a creative, unique "vibe" for Twitter/X user @${twitterHandle}.
  
  Make the quote dry, subtly funny, and existentially interesting - think of a mix between Daria, Bojack Horseman, and Nathan Fielder.
  The quote should feel like an unexpected thought that's both humorous and slightly philosophical.
  
  Return a JSON object with the following properties:
  - quote: A unique, witty quote that represents their vibe (dry humor, understated existentialism)
  - vibeType: "${getVibeTypeFromHandle(twitterHandle)}" (do not change this value)
  - colorPalette: Array of 3 hex color codes that match the vibe
  - music: A specific music recommendation that matches the vibe (can be genre, artist, or specific song)
  - emojiSet: Array of 5 emojis that represent the vibe
  - background: A text description of a visual background pattern that fits the vibe

  Make it creative, unexpected, and shareable. DO NOT include any explanation, ONLY return the valid JSON.`;

  try {
    // If no API key is available, return mock data
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key found, using mock data");
      return getMockVibeData(twitterHandle);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a creative vibe generator that creates dry, funny, digital aesthetics. Think of show writers for Adult Swim, but more subtle and nuanced." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.log("No content returned from OpenAI, using mock data");
      return getMockVibeData(twitterHandle);
    }
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Ensure the vibe type matches what we specified (in case OpenAI didn't follow instructions)
      const expectedVibeType = getVibeTypeFromHandle(twitterHandle);
      if (parsedContent.vibeType !== expectedVibeType) {
        console.log(`OpenAI changed vibe type from '${expectedVibeType}' to '${parsedContent.vibeType}'. Correcting.`);
        parsedContent.vibeType = expectedVibeType;
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
  
  // Use our deterministic but varied function to set the vibe type
  console.log(`Generated mock vibe using type: ${vibeType} for handle: ${twitterHandle}`);
  
  const quotes = [
    "Experiencing the unstoppable passage of time while staring at a loading screen",
    "Living in that specific gray area between 'has their life together' and 'hasn't slept in three days'",
    "Buying houseplants as a substitute for developing a personality",
    "I'm not procrastinating, I'm just giving my future self a sense of urgency",
    "Having the exact energy of a half-deflated balloon at a child's birthday party",
    "Moving through life with the confidence of someone who doesn't know they have spinach in their teeth",
    "I only make bad decisions when I'm awake",
    "Feeling like a conscious glitch in someone else's simulation",
    "Going through existence with the chaotic energy of an untied shoelace",
    "I thought I was having an existential crisis but it was just the caffeine",
    "Turning every minor inconvenience into my villain origin story",
    "My aesthetic is 'abandoned mall with one working fountain'",
    "Faking my own death but just emotionally every time I leave a social gathering",
    "Existing in a perpetual state of 'I'll deal with this tomorrow' since 2018",
    "My personality is just recycled internet humor filtered through sleep deprivation",
    "The only thing consistent about me is my inconsistency",
    "Going through life with the energy of a Wikipedia article that needs citation",
    "I function at the processing speed of a 1998 desktop computer connected to dial-up",
  ];
  
  const musicRecommendations = [
    "That song from a commercial you can't quite remember but it's stuck in your head",
    "Lo-fi beats to dissociate to in a Target at 2 AM",
    "A playlist consisting entirely of songs that sound familiar but you can't place",
    "Elevator music but slowed down 800% with reverb",
    "The exact music that would play if your life were a Wes Anderson film",
    "The sound of dial-up internet but remixed with trap beats",
    "Just the Nintendo Wii theme on repeat but it gets more distorted each time",
    "Shoegaze so dense you could use it as a weighted blanket",
    "Synth music that sounds like what people in the 80s thought the future would sound like",
    "The Seinfeld theme but every bass note is replaced with a different notification sound",
    "The sonic equivalent of staring at a lava lamp for three hours",
    "Music that sounds like what static television feels like",
    "That one song from your middle school dance but played in an empty shopping mall",
    "A playlist titled 'songs to have an existential crisis to while alone in your car'",
    "Ambient sounds of a library where someone keeps whispering just a bit too loudly",
    "Early 2000s ringtones reimagined as classical piano pieces",
  ];
  
  const emojiSets = [
    ["💭", "☕", "📱", "🧠", "🌧️"],
    ["🌌", "🦢", "🧊", "✨", "🪞"],
    ["🥀", "📼", "🕰️", "🍦", "📺"],
    ["🍄", "🧿", "🪐", "🌈", "🧩"],
    ["🦕", "📚", "🔍", "🧸", "🧠"],
    ["🎭", "🎪", "🎨", "🎧", "🪄"],
    ["🏙️", "🚶", "☕", "📓", "🚥"],
    ["🧶", "🔮", "🧵", "🧪", "🧠"],
    ["🖥️", "💾", "🔌", "📟", "👾"],
    ["🌃", "🚶", "🏮", "🌆", "🌠"],
    ["👁️", "⏳", "🗝️", "🌙", "🪐"],
    ["🎧", "🎹", "📻", "🎷", "🎵"],
  ];
  
  const backgroundDescriptions = [
    "Barely moving clouds rendered at 144p against a gradient sunset",
    "A glitched Windows 95 error message repeating infinitely across a pastel void",
    "Static television snow in soft blues and purples with occasional glimpses of clarity",
    "Retro vector grid that seems to stretch toward infinity but never quite gets there",
    "Watercolor coffee stains blending together on old notebook paper",
    "Gentle waves of pixel sorting across a photograph of an empty playground",
    "The textured ceiling of a doctor's waiting room but slightly animated",
    "That one default PowerPoint background everyone used in 2007",
    "Shadows of rain falling on a window but the raindrops never move all the way down",
    "A lightly animated dithered gradient that evokes the feeling of being underwater",
    "A wallpaper pattern that seems normal until you notice all the tiny hidden faces",
    "VHS tracking errors on loop across a pastel sunset",
    "The pattern of light reflections at the bottom of a swimming pool but in slow motion",
  ];
  
  // Create hash from handle for consistent results for the same handle
  const hashCode = twitterHandle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Deterministic selection based on hash, but add variety based on vibe type
  const quoteIndex = (hashCode + vibeType.length) % quotes.length;
  const musicIndex = (hashCode * 2 + vibeType.charCodeAt(0)) % musicRecommendations.length;
  const emojiIndex = (hashCode * 3 + vibeType.length) % emojiSets.length;
  const bgIndex = (hashCode * 4 + vibeType.charCodeAt(0)) % backgroundDescriptions.length;
  
  // Generate colors that match the vibe type
  const generateVibeColor = () => {
    // Map vibe types to color palettes
    const colorMappings: Record<string, string[]> = {
      'chaotic': ['#FF0000', '#FF00FF', '#00FFFF', '#FF8800', '#00FF00'],  // Bright neons
      'chill': ['#87CEEB', '#B0E0E6', '#AFEEEE', '#E0FFFF', '#F0F8FF'],    // Soft blues
      'retro': ['#FF6347', '#FFD700', '#40E0D0', '#FF7F50', '#00CED1'],    // 80s colors
      'cyberpunk': ['#FF00FF', '#00FFFF', '#FF0000', '#0000FF', '#FFFF00'], // Neon
      'vaporwave': ['#FF6AD5', '#C774E8', '#AD8CFF', '#8795E8', '#94D0FF'], // Purple-blues
      'cottagecore': ['#8FBC8F', '#F0E68C', '#FFB6C1', '#FFDAB9', '#98FB98'], // Pastels
      'hyper-digital': ['#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF'], // Digital
      'cosmic': ['#9370DB', '#8A2BE2', '#7B68EE', '#6A5ACD', '#483D8B'],   // Purples
      'goth': ['#000000', '#696969', '#800000', '#4B0082', '#2F4F4F'],     // Dark
      'dreamcore': ['#FF69B4', '#00BFFF', '#FF1493', '#1E90FF', '#FFFF54'], // Dreamlike
      'ethereal': ['#E6E6FA', '#D8BFD8', '#DDA0DD', '#DA70D6', '#EE82EE']  // Lavenders
    };
    
    const palette = colorMappings[vibeType] || ['#FF00FF', '#00FFFF', '#FF7700'];
    return palette[Math.floor(Math.random() * palette.length)];
  };
  
  const result = {
    quote: quotes[quoteIndex],
    vibeType,
    colorPalette: [generateVibeColor(), generateVibeColor(), generateVibeColor()],
    music: musicRecommendations[musicIndex],
    emojiSet: emojiSets[emojiIndex],
    background: backgroundDescriptions[bgIndex]
  };
  
  return result;
} 