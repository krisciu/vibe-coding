import { createClient } from '@supabase/supabase-js';

// Note: You'll need to add your Supabase URL and anon key to your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types for our database
export type VibeEntry = {
  id?: number;
  twitter_handle: string;
  vibe_data: any;
  created_at?: string;
};

// Function to store a new vibe
export async function storeVibeData(twitterHandle: string, vibeData: any): Promise<VibeEntry | null> {
  try {
    const { data, error } = await supabase
      .from('vibes')
      .insert([
        { twitter_handle: twitterHandle, vibe_data: vibeData }
      ])
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error storing vibe data:', error);
    return null;
  }
}

// Function to get popular vibes
export async function getPopularVibes(limit: number = 10): Promise<VibeEntry[]> {
  try {
    const { data, error } = await supabase
      .from('vibes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting popular vibes:', error);
    return [];
  }
}

// Function to get a user's previous vibes
export async function getUserVibes(twitterHandle: string, limit: number = 5): Promise<VibeEntry[]> {
  try {
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