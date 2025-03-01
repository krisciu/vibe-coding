import { createClient } from '@supabase/supabase-js';

// Define MoodMash type for proper typing
export type MoodMashData = {
  quote: string;
  vibeType: string;
  colorPalette: string[];
  music: string;
  emojiSet: string[];
  background: string;
};

// Note: You'll need to add your Supabase URL and anon key to your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types for our database
export type VibeEntry = {
  id?: number;
  twitter_handle: string;
  vibe_data: MoodMashData;
  created_at?: string;
  likes?: number;
};

// Function to create the vibes table if it doesn't exist
export async function ensureVibesTableExists(): Promise<boolean> {
  try {
    // Check if table exists by trying to select from it
    const { error } = await supabase
      .from('vibes')
      .select('id')
      .limit(1);
    
    // If table doesn't exist, we can't create it through the client API
    if (error && error.code === '42P01') {
      console.error('Vibes table does not exist. Please create it using the Supabase dashboard or visit /api/setup for instructions.');
      return false;
    }
    
    if (error) {
      console.error('Error checking table:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking table existence:', error);
    return false;
  }
}

// Function to store a new vibe
export async function storeVibeData(twitterHandle: string, vibeData: MoodMashData): Promise<VibeEntry | null> {
  try {
    // Ensure table exists before inserting
    const tableExists = await ensureVibesTableExists();
    if (!tableExists) {
      console.error('Cannot store vibe data: vibes table does not exist');
      return null;
    }
    
    // Table exists, proceed with insert
    const { data, error } = await supabase
      .from('vibes')
      .insert([
        { 
          twitter_handle: twitterHandle, 
          vibe_data: vibeData,
          likes: 0 
        }
      ])
      .select();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return null;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Error storing vibe data:', error);
    return null;
  }
}

// Function to get popular vibes
export async function getPopularVibes(limit: number = 10, sortByLikes: boolean = false): Promise<VibeEntry[]> {
  try {
    // Ensure table exists
    const tableExists = await ensureVibesTableExists();
    if (!tableExists) return [];
    
    // Query with dynamic sort column
    const { data, error } = await supabase
      .from('vibes')
      .select('*')
      .order(sortByLikes ? 'likes' : 'created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Supabase select error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting popular vibes:', error);
    return [];
  }
}

// Function to get a user's previous vibes
export async function getUserVibes(twitterHandle: string, limit: number = 5): Promise<VibeEntry[]> {
  try {
    // Ensure table exists
    const tableExists = await ensureVibesTableExists();
    if (!tableExists) return [];
    
    const { data, error } = await supabase
      .from('vibes')
      .select('*')
      .eq('twitter_handle', twitterHandle)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user vibes:', error);
    return [];
  }
}

// Like a vibe
export async function likeVibe(vibeId: number): Promise<boolean> {
  try {
    // First, get the current likes count
    const { data, error: getError } = await supabase
      .from('vibes')
      .select('likes')
      .eq('id', vibeId)
      .single();
      
    if (getError) {
      console.error('Error getting vibe:', getError);
      return false;
    }
    
    // Increment the likes count
    const currentLikes = data?.likes || 0;
    const { error: updateError } = await supabase
      .from('vibes')
      .update({ likes: currentLikes + 1 })
      .eq('id', vibeId);
      
    if (updateError) {
      console.error('Error updating likes:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error liking vibe:', error);
    return false;
  }
} 