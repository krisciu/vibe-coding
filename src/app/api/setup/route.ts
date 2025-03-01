import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// This is a setup endpoint to initialize our database
// In a real production app, this would be done through migrations
export async function GET(request: NextRequest) {
  try {
    // Run SQL to create the vibes table and necessary functions
    const { error: sqlError } = await supabase.rpc('exec_sql', { 
      sql_query: `
        -- Create the vibes table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.vibes (
          id SERIAL PRIMARY KEY,
          twitter_handle TEXT NOT NULL,
          vibe_data JSONB NOT NULL,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create index on twitter_handle for faster lookups
        CREATE INDEX IF NOT EXISTS idx_vibes_twitter_handle ON public.vibes(twitter_handle);
        
        -- Create a function to increment a number (for likes)
        CREATE OR REPLACE FUNCTION increment(x integer)
        RETURNS integer AS $$
        BEGIN
          RETURN x + 1;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Create a function to create the vibes table (for use in the client)
        CREATE OR REPLACE FUNCTION create_vibes_table()
        RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS public.vibes (
            id SERIAL PRIMARY KEY,
            twitter_handle TEXT NOT NULL,
            vibe_data JSONB NOT NULL,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_vibes_twitter_handle ON public.vibes(twitter_handle);
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (sqlError) {
      return NextResponse.json({ error: sqlError.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup complete. Tables and functions created.' 
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup database', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 