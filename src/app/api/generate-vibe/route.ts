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
  // Define prompt for the AI - make it quirky but not too extreme
  const prompt = `Generate a creative, QUIRKY "vibe" for Twitter/X user @${twitterHandle}.
  
  Make the quote witty, unexpected, and a bit strange - think of a mix between Adult Swim, surrealist humor, and internet meme culture. It should be memorable but not disturbing.
  
  The quote should feel like an amusing shower thought or an unexpected observation that makes people smile - weird but not unsettling.
  
  Return a JSON object with the following properties:
  - quote: A unique, quirky quote that represents their vibe (offbeat humor, weird observations, memorable lines)
  - vibeType: "${getVibeTypeFromHandle(twitterHandle)}" (do not change this value)
  - colorPalette: Array of 3 hex color codes that match the vibe
  - music: A specific music recommendation that matches the vibe (specific artist/song with a quirky listening scenario)
  - emojiSet: Array of 5 emojis that represent the vibe (use unusual but fun combinations)
  - background: A text description of a visual background pattern that is dreamlike or unusual but not disturbing

  Make it creative and weird, but fun. DO NOT include any explanation, ONLY return the valid JSON.`;

  try {
    // If no API key is available, return mock data
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key found, using mock data");
      return getMockVibeData(twitterHandle);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a creative vibe generator that creates quirky, unusual digital aesthetics. Think of Adult Swim bumpers, internet culture, and surrealist humor. You create content that is weird and memorable, but fun rather than disturbing." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9, // High but not extreme temperature for creative outputs
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
  
  // Updated quotes to be quirky but not disturbing
  const quotes = [
    "I don't always understand my life choices, but neither does my FBI agent",
    "If trees could use social media, they'd just post pictures of themselves standing around",
    "My brain has too many tabs open and I can't find where the music is coming from",
    "I wish my grass was emo so it would cut itself",
    "I'm not saying I'm Batman, but no one has ever seen me and Batman in the same room",
    "Sometimes I talk to myself, then we both laugh at what I said",
    "My bed is a magical place where I suddenly remember everything I was supposed to do",
    "I put the 'pro' in procrastination and the 'nap' in inappropriate times to sleep",
    "People say nothing is impossible, but I do nothing every day",
    "Life is soup, I am fork",
    "My room isn't messy, it's an interactive art installation titled 'Who Needs Floor Space Anyway?'",
    "Every time I check the time it's always a different number",
    "Sometimes I wonder if clouds look down and think those humans look like ants",
    "If Plan A doesn't work, don't worry. The alphabet has 25 more letters",
    "Some people want to watch the world burn. I just want to know if you've tried turning it off and back on again",
    "My passwords are protected by amnesia",
    "Life hack: You can't lose your keys if you never leave your house",
    "My playlist is a mystery novel where every song is a suspect",
  ];
  
  // Updated backgrounds to be less unsettling
  const backgroundDescriptions = [
    "A gradient of sunset colors with tiny animated shooting stars",
    "Retro grid lines that occasionally wiggle like they're dancing to music",
    "Slow-moving bubbles that shimmer with rainbow colors when they overlap",
    "A pattern of tiny geometric shapes that slowly rotate in different directions",
    "Watercolor splotches that gently pulse to an invisible beat",
    "A desktop wallpaper that looks like it escaped from Windows 98",
    "Floating digital confetti that never quite lands anywhere",
    "Pastel clouds that drift by as if in a time-lapse video",
    "A field of digital flowers that bloom when you look at them too long",
    "Pixel art waves that ripple across the background",
    "A star field where occasionally one star winks at you",
    "A collection of tiny doodles that seem to be playing hide and seek",
    "Gentle neon outlines that trace invisible objects",
  ];
  
  // Updated music recommendations to be quirky but not too extreme
  const musicRecommendations = [
    "Beach House's 'Space Song' slowed down 20% and listened to through a broken cassette player",
    "Radiohead's 'Pyramid Song' but each instrument is replaced with the sound of different kitchen appliances",
    "Frank Ocean's 'Nights' played backwards while sitting in an empty bathtub",
    "Boards of Canada's 'Music Has The Right To Children' but it's playing from another room in an abandoned mall",
    "Tyler, the Creator's 'EARFQUAKE' but every bass hit causes your room's lights to flicker slightly",
    "Björk's 'Hyperballad' listened to while staring at yourself in a mirror for exactly 7 minutes",
    "Tame Impala's 'The Less I Know The Better' but the bass is replaced with a purring cat",
    "The Weeknd's 'After Hours' slowed down and echoed as if playing from the bottom of an empty swimming pool",
    "Childish Gambino's 'Redbone' but it sounds like it's playing from another dimension",
    "Portishead's 'Roads' but it's playing on a record player that's slowly melting",
    "Joy Division's 'Love Will Tear Us Apart' performed by a choir of elderly people who've never heard the song",
    "David Bowie's 'Space Oddity' listened to while floating face-up in a sensory deprivation tank",
    "Billie Eilish's 'when the party's over' but every time she whispers, something moves in your peripheral vision",
    "Thom Yorke's 'Dawn Chorus' played at exactly sunrise while standing in an empty field",
    "Frank Sinatra's 'Fly Me To The Moon' but it's echoing through the halls of an abandoned space station",
  ];
  
  // Updated emojis to be unusual but fun combinations
  const emojiSets = [
    ["🌮", "🦄", "🔮", "🧠", "🌈"],
    ["🍕", "🪐", "🌵", "🧩", "✨"],
    ["🤖", "🦋", "🍦", "🎯", "🎨"],
    ["🦕", "🧿", "🧸", "🔍", "🌊"],
    ["🐸", "🍄", "🪄", "🎭", "🌙"],
    ["🦝", "🍩", "📚", "🧶", "🪩"],
    ["🦜", "🧠", "🍹", "🎪", "🌴"],
    ["🦢", "🎲", "🧁", "🔭", "🎠"],
    ["🐙", "🍭", "🧿", "🎡", "🔔"],
    ["🦉", "🍉", "🧩", "🪅", "🎪"],
    ["🦊", "🍰", "🎮", "🧵", "🔮"],
    ["🐢", "🧊", "🎨", "🧪", "🌌"],
  ];
  
  // Create hash from handle for consistent results for the same handle
  const hashCode = twitterHandle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Deterministic selection based on hash, but add variety based on vibe type
  const quoteIndex = (hashCode + vibeType.length) % quotes.length;
  const musicIndex = (hashCode * 2 + vibeType.charCodeAt(0)) % musicRecommendations.length;
  const emojiIndex = (hashCode * 3 + vibeType.length) % emojiSets.length;
  const bgIndex = (hashCode * 4 + vibeType.charCodeAt(0)) % backgroundDescriptions.length;
  
  // Generate colors that match the vibe type but make them more unsettling
  const generateVibeColor = () => {
    // Map vibe types to color palettes - slightly more unsettling versions
    const colorMappings: Record<string, string[]> = {
      'chaotic': ['#FF0000', '#FF00FF', '#00FFFF', '#FF8800', '#00FF00'],  // Bright neons
      'chill': ['#87CEEB', '#B0E0E6', '#AFEEEE', '#E0FFFF', '#F0F8FF'].map(c => makeUnsettling(c)),
      'retro': ['#FF6347', '#FFD700', '#40E0D0', '#FF7F50', '#00CED1'].map(c => makeUnsettling(c)),
      'cyberpunk': ['#FF00FF', '#00FFFF', '#FF0000', '#0000FF', '#FFFF00'], // Neon
      'vaporwave': ['#FF6AD5', '#C774E8', '#AD8CFF', '#8795E8', '#94D0FF'].map(c => makeUnsettling(c)),
      'cottagecore': ['#8FBC8F', '#F0E68C', '#FFB6C1', '#FFDAB9', '#98FB98'].map(c => makeUnsettling(c)),
      'hyper-digital': ['#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF'], // Digital
      'cosmic': ['#9370DB', '#8A2BE2', '#7B68EE', '#6A5ACD', '#483D8B'].map(c => makeUnsettling(c)),
      'goth': ['#000000', '#696969', '#800000', '#4B0082', '#2F4F4F'], // Dark
      'dreamcore': ['#FF69B4', '#00BFFF', '#FF1493', '#1E90FF', '#FFFF54'].map(c => makeUnsettling(c)),
      'ethereal': ['#E6E6FA', '#D8BFD8', '#DDA0DD', '#DA70D6', '#EE82EE'].map(c => makeUnsettling(c)),
    };
    
    const palette = colorMappings[vibeType] || ['#FF00FF', '#00FFFF', '#FF7700'];
    return palette[Math.floor(Math.random() * palette.length)];
  };
  
  // Function to make colors slightly "off" or unsettling
  function makeUnsettling(hexColor: string): string {
    // Parse the hex color
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Slightly shift one channel to make it feel "off"
    const shiftAmount = Math.floor(Math.random() * 30) + 10;
    const channelToShift = Math.floor(Math.random() * 3);
    
    let newR = r, newG = g, newB = b;
    
    if (channelToShift === 0) newR = Math.min(255, Math.max(0, r + shiftAmount));
    else if (channelToShift === 1) newG = Math.min(255, Math.max(0, g + shiftAmount));
    else newB = Math.min(255, Math.max(0, b + shiftAmount));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
  
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