import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// This is a setup endpoint to initialize our database
// In a real production app, this would be done through migrations
export async function GET() {
  try {
    // Check if the vibes table already exists
    const { error: checkError } = await supabase
      .from('vibes')
      .select('id')
      .limit(1);
    
    // If the table doesn't exist, we need to notify the user to create it manually
    if (checkError && checkError.code === '42P01') {
      return NextResponse.json({ 
        error: 'Table does not exist', 
        message: 'The vibes table does not exist. Please create it in the Supabase dashboard with the following columns: id (serial), twitter_handle (text), vibe_data (jsonb), likes (integer), created_at (timestamp)',
        details: "Supabase doesn't allow table creation through the client API. You need to create the table in the Supabase dashboard manually."
      }, { status: 404 });
    }
    
    if (checkError) {
      return NextResponse.json({ 
        error: 'Error checking table existence', 
        message: checkError.message 
      }, { status: 500 });
    }
    
    // Table exists, everything is set up properly
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup is complete. Tables exist and are ready to use.' 
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup database', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 