import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
    
    // Store the vibe data in database (will implement later)
    // await storeVibeData(twitterHandle, vibeResponse);
    
    return NextResponse.json({ vibe: vibeResponse });
  } catch (error) {
    console.error('Error generating vibe:', error);
    return NextResponse.json({ error: 'Failed to generate vibe' }, { status: 500 });
  }
}

async function generateAdvancedVibe(twitterHandle: string) {
  // Define prompt for the AI
  const prompt = `Generate a creative, fun "vibe" for Twitter/X user @${twitterHandle}. 
  Return a JSON object with the following properties:
  - quote: A unique, chaotic or fun quote that represents their vibe (witty, absurd, or philosophical)
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
      model: "gpt-4o-mini", // or other appropriate model
      messages: [
        { role: "system", content: "You are a creative vibe generator that creates fun, chaotic digital aesthetics." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
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
function getMockVibeData(twitterHandle: string) {
  const vibeTypes = ["chaotic", "chill", "retro", "cyberpunk", "vaporwave", "cottagecore", "hyper-digital", "cosmic", "goth", "dreamcore", "ethereal", "absurdist"];
  
  const quotes = [
    "Living in a perpetual state of 'I'll deal with it tomorrow'",
    "My personality is just recycled memes and coffee",
    "Exists in the space between cringe and iconic",
    "Just vibing at a frequency only dogs can hear",
    "Collecting moments like they're going out of style",
    "Professional overthinker with a side of existential dread",
    "Trying to be the person my dog thinks I am",
    "Spiritually aligned with my chaotic Spotify playlists",
    "Too many tabs open in my brain browser",
    "Embracing my main character energy through continuous plot twists",
    "Living life through a nostalgic filter that doesn't exist",
    "Manifesting while simultaneously doubting everything",
  ];
  
  const musicRecommendations = [
    "Slowed & reverb remixes of early 2000s pop hits",
    "Hyperpop with existential lyrics",
    "Lo-fi hip hop but it's recorded in an abandoned mall",
    "Vaporwave remixes of classical music",
    "That one song that was playing during your core memory",
    "Dark academia playlist but with trap beats",
    "Music that sounds like how Wes Anderson films look",
    "Y2K pop played through a broken cassette player",
    "Video game soundtracks but it's the underwater levels",
    "Songs that make you feel like you're in a coming-of-age film",
    "Shoegaze with ambient nature sounds",
    "Bedroom pop with cryptic sampling",
  ];
  
  const emojiSets = [
    ["✨", "🪐", "🔮", "🧠", "💭"],
    ["🌊", "🧿", "🌙", "✌️", "🫧"],
    ["🌈", "🦄", "🌟", "🍭", "⚡"],
    ["💾", "👾", "🤖", "🦾", "📡"],
    ["🖤", "🥀", "🦇", "🕸️", "🔪"],
    ["🌷", "🦋", "🍄", "🌿", "🧁"],
    ["📱", "💫", "🧩", "🎮", "💡"],
    ["👽", "🛸", "💫", "🌌", "🔭"],
    ["⏳", "📻", "🕯️", "📜", "🪞"],
    ["🎭", "🎪", "🎟️", "🎨", "🎬"],
    ["🧵", "🪄", "🎐", "🌊", "🕊️"],
    ["🌩️", "🎢", "🧪", "🌀", "🔥"],
  ];
  
  const backgroundDescriptions = [
    "Gradient waves rippling between pastel colors with subtle glitter effects",
    "Cyberpunk cityscape with neon grid lines and digital rain",
    "Retro VHS static with glitching patterns and analog distortion",
    "Soft cottagecore watercolor landscape with delicate floral patterns",
    "Vaporwave grid landscape with sunset colors and floating geometric shapes",
    "Cosmic nebula swirls with stardust and celestial bodies",
    "Glitched digital landscape with corrupted pixels and data mosaics",
    "Ethereal clouds with prismatic light refractions and soft bokeh",
    "Dark academia textures with vintage paper and subtle ink blotches",
    "Dreamcore surrealist landscape with impossible architecture",
    "Y2K inspired patterns with bubble shapes and metallic textures",
    "Minimalist zen patterns with subtle movement and texture",
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