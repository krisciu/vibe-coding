import { NextRequest, NextResponse } from 'next/server';
import { getPopularVibes } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'recent'; // 'recent' or 'likes'
    
    // Get popular vibes from database
    const vibes = await getPopularVibes(limit, sort === 'likes');
    
    return NextResponse.json({ vibes });
  } catch (error) {
    console.error('Error fetching popular vibes:', error);
    return NextResponse.json({ error: 'Failed to fetch popular vibes' }, { status: 500 });
  }
} 