import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { storeVibeData, MoodMashData } from '@/utils/supabase';

// Initialize OpenAI client
// Note: You'll need to add your API key to your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { twitterHandle } = body;
    
    if (!twitterHandle) {
      return NextResponse.json({ error: 'Twitter handle is required' }, { status: 400 });
    }

    // Generate advanced vibe using OpenAI
    const vibeResponse = await generateAdvancedVibe(twitterHandle);
    
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

async function generateAdvancedVibe(twitterHandle: string): Promise<MoodMashData> {
  // Define prompt for the AI
  const prompt = `Generate a creative, absurdist "vibe" for Twitter/X user @${twitterHandle}.
  
  Make the quote dry, subtly funny, and existentially absurd - think of a mix between Daria, Bojack Horseman, and Nathan Fielder.
  The quote should feel like an unexpected thought that's both humorous and slightly philosophical.
  
  Return a JSON object with the following properties:
  - quote: A unique, absurdist quote that represents their vibe (dry humor, understated existentialism)
  - vibeType: One of ["chaotic", "chill", "retro", "cyberpunk", "vaporwave", "cottagecore", "hyper-digital", "cosmic", "goth", "dreamcore", "ethereal", "absurdist"]
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
        { role: "system", content: "You are a creative vibe generator that creates dry, funny, absurdist digital aesthetics. Think of show writers for Adult Swim, but more subtle and nuanced." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : getMockVibeData(twitterHandle);
    
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fallback to mock data if API fails
    return getMockVibeData(twitterHandle);
  }
}

// Fallback function to get mock vibe data if API call fails
function getMockVibeData(twitterHandle: string): MoodMashData {
  const vibeTypes = ["chaotic", "chill", "retro", "cyberpunk", "vaporwave", "cottagecore", "hyper-digital", "cosmic", "goth", "dreamcore", "ethereal", "absurdist"];
  
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
    ["🎭", "🎪", "🎨", "🎪", "🪄"],
    ["🏙️", "🚶", "☕", "📓", "🚥"],
    ["🧶", "🔮", "🧵", "🧪", "🧠"],
    ["🖥️", "💾", "🔌", "📟", "👾"],
    ["🌃", "🚶", "🏮", "🌆", "🌠"],
    ["👁️", "⏳", "🗝️", "🌙", "🪐"],
    ["🎧", "🎹", "📻", "🎷", "🪗"],
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
  
  // Generate random indices based on handle to create semi-deterministic results
  const handleSum = twitterHandle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const vibeIndex = handleSum % vibeTypes.length;
  const quoteIndex = (handleSum * 2) % quotes.length;
  const musicIndex = (handleSum * 3) % musicRecommendations.length;
  const emojiIndex = (handleSum * 4) % emojiSets.length;
  const bgIndex = (handleSum * 5) % backgroundDescriptions.length;
  
  // Generate random hex colors based on vibeType
  const generateColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  
  return {
    quote: quotes[quoteIndex],
    vibeType: vibeTypes[vibeIndex],
    colorPalette: [generateColor(), generateColor(), generateColor()],
    music: musicRecommendations[musicIndex],
    emojiSet: emojiSets[emojiIndex],
    background: backgroundDescriptions[bgIndex]
  };
} 