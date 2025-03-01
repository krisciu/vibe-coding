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
    
    // If table doesn't exist, we'll get a specific error code
    if (error && error.code === '42P01') {
      console.log('Creating vibes table...');
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('create_vibes_table');
      
      if (createError) {
        console.error('Error creating table:', createError);
        return false;
      }
      
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking/creating table:', error);
    return false;
  }
}

// Function to store a new vibe
export async function storeVibeData(twitterHandle: string, vibeData: MoodMashData): Promise<VibeEntry | null> {
  try {
    // Ensure table exists before inserting
    await ensureVibesTableExists();
    
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
    const { error } = await supabase
      .from('vibes')
      .update({ likes: supabase.rpc('increment', { x: 1 }) })
      .eq('id', vibeId);
      
    return !error;
  } catch (error) {
    console.error('Error liking vibe:', error);
    return false;
  }
} 