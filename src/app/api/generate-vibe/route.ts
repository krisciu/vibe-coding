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
  // Define prompt for the AI - make it more deranged
  const prompt = `Generate a creative, DERANGED "vibe" for Twitter/X user @${twitterHandle}.
  
  Make the quote unsettling, darkly funny, and existentially disturbing - think of a mix between Adult Swim at 3AM, David Lynch, and a fever dream. It should make people do a double-take.
  
  The quote should feel like an intrusive thought that's both humorous and slightly uncomfortable - the kind of thing someone might think but never say out loud.
  
  Return a JSON object with the following properties:
  - quote: A unique, disturbing quote that represents their vibe (unsettling humor, weird existentialism, slightly unhinged energy)
  - vibeType: "${getVibeTypeFromHandle(twitterHandle)}" (do not change this value)
  - colorPalette: Array of 3 hex color codes that match the vibe
  - music: A bizarre, specific music recommendation that matches the vibe (can be genre, artist, or specific song - the more strange and specific, the better)
  - emojiSet: Array of 5 emojis that represent the vibe (use unusual combinations that feel off-putting)
  - background: A text description of a visual background pattern that is dreamlike, unsettling, or liminal space-adjacent

  Make it creative, unsettling, and deeply weird. DO NOT include any explanation, ONLY return the valid JSON.`;

  try {
    // If no API key is available, return mock data
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key found, using mock data");
      return getMockVibeData(twitterHandle);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a creative vibe generator that creates unhinged, deranged, surreal digital aesthetics. Think of late-night Adult Swim, dreamcore, David Lynch, and internet horror. You create content that is deliberately weird, unsettling, and makes people uncomfortable in an interesting way." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.95, // Higher temperature for more creative/weird outputs
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
  
  // Updated quotes to be more deranged and unsettling
  const quotes = [
    "Sometimes I wonder if my reflection is happier in its universe than I am in mine",
    "It's weird how we're all just skeletons piloting meat suits, tricking each other into thinking we're normal",
    "Every time I use the microwave I apologize to it in my head just in case machines become sentient and remember who was nice to them",
    "I'm not sure if I'm a person who dreams or a dream that thinks it's a person",
    "My therapist says I catastrophize but what does she know about the tiny cameras in all the puddles",
    "I keep all my memories in a shoebox under my bed, I just can't remember which one",
    "The skin is the only thing keeping all your organs from meeting each other",
    "Sometimes I lie awake wondering if my furniture moves around when I'm not looking",
    "I'm not avoiding my problems, I'm just letting them ripen to perfection",
    "I'm not paranoid, I've just noticed the same bird outside my window for three consecutive years",
    "Often I think about how we're just meat puppets dancing on a cosmic string in a universe that doesn't care",
    "Every night I have the same dream where I'm explaining to a table full of ducks why I don't have any bread",
    "I think my shadow is plotting something against me, it's always one step behind",
    "The walls aren't just listening, they're taking notes and comparing stories",
    "Sometimes I make eye contact with myself in the mirror just to make sure it's still me in there",
    "I keep having this recurring dream where I'm normal and that scares me more than anything",
    "The void is calling but I've put it on spam because its energy is too clingy",
    "I check under my bed for monsters then apologize for not having snacks ready for them",
  ];
  
  // Updated music recommendations to be weirder
  const musicRecommendations = [
    "The sound of a lonely shopping cart rolling through an abandoned mall parking lot at 3AM, slowed down and reverbed",
    "A playlist of ice cream truck music played backward through a broken speaker in an empty playground",
    "Recordings of whales singing but pitch-shifted to sound like they're screaming",
    "The Windows 95 startup sound stretched to 45 minutes with occasional whispers",
    "Field recordings of an empty office building's HVAC system with occasional typewriter sounds",
    "Muzak versions of death metal songs played on a slightly out-of-tune music box",
    "The Seinfeld theme but every note is replaced with a different David Lynch character laughing",
    "ASMR recordings of someone eating soup but the microphone is underwater",
    "A compilation of every notification sound you've ever had, played simultaneously in different rooms",
    "The sound of dial-up internet slowed down 800% and set to the rhythm of your childhood home's creaking floorboards",
    "The exact noise a VHS tape makes when it's eaten by the machine, looped for 2 hours with subtle variations",
    "A playlist of every doorbell you've ever heard, but they're all slightly wrong",
    "The ambient soundscape of a liminal space where time doesn't exist properly",
    "Recordings of someone typing very aggressively but every 13th keystroke is missing",
    "The exact song that was playing in that dream you can't quite remember from 7 years ago",
    "A choir of people humming different commercial jingles from the 90s while a theremin plays in the background",
  ];
  
  // Updated emojis to be weirder combinations
  const emojiSets = [
    ["👁️", "🥄", "📞", "🦷", "🧠"],
    ["🕳️", "🧿", "🥩", "🧊", "🎭"],
    ["🧸", "🔪", "🥛", "🚪", "🔍"],
    ["📼", "⏰", "🎪", "🧩", "🩸"],
    ["🪞", "👥", "🧵", "📡", "🕯️"],
    ["⚰️", "🎠", "🧃", "🪑", "🌡️"],
    ["👁️‍🗨️", "🫀", "🎲", "🧪", "🪓"],
    ["🧿", "🔭", "🧠", "🧶", "📺"],
    ["🩹", "💉", "📟", "🔌", "🪟"],
    ["🎬", "🧮", "🎙️", "🖲️", "📱"],
    ["🔬", "🪶", "🧫", "👣", "🧬"],
    ["🕰️", "📓", "🔎", "🧯", "🩹"],
  ];
  
  // Updated backgrounds to be more unsettling
  const backgroundDescriptions = [
    "An infinite hallway of identical doors that seem to breathe slightly",
    "A children's birthday party frozen in time, with all colors gradually shifting to unnatural hues",
    "Static television snow that occasionally forms patterns that look like faces for a split second",
    "A familiar bedroom where all the furniture is 3% larger than it should be",
    "An endless staircase that appears to go down but somehow you keep going up",
    "A corporate office with fluorescent lights that flicker in a pattern that seems intentional",
    "The backrooms wallpaper but every few seconds it shifts slightly when you're not looking directly at it",
    "Windows that should show outside but instead show the same room from impossible angles",
    "A swimming pool at night with lights that create shadows that don't match what's casting them",
    "A school hallway that's slightly too long with lockers that occasionally make sounds when no one is near",
    "An old photograph where people in the background seem to be looking directly at the viewer",
    "The corner of your eye - everything you almost see but don't quite catch",
    "The space between mirror reflections where something might be watching",
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