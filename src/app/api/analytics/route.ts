import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    // Count the total number of vibes in the database
    const { count, error } = await supabase
      .from('vibes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting vibe count:', error);
      return NextResponse.json({ count: 0 });
    }
    
    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    return NextResponse.json({ count: 0 });
  }
} 