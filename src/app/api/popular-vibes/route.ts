import { NextRequest, NextResponse } from 'next/server';
import { getPopularVibes, ensureVibesTableExists } from '@/utils/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'recent'; // 'recent' or 'likes'
    
    // Validate the limit parameter
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    
    console.log(`Fetching popular vibes with limit=${limit}, sort=${sort}`);
    
    // First check if the table exists
    const tableExists = await ensureVibesTableExists();
    if (!tableExists) {
      return NextResponse.json({ 
        error: 'Vibes table does not exist. Please create it using the Supabase dashboard or visit /api/setup for instructions.' 
      }, { status: 404 });
    }
    
    // Get popular vibes from database
    const vibes = await getPopularVibes(limit, sort === 'likes');
    
    console.log(`Retrieved ${vibes.length} vibes`);
    
    return NextResponse.json({ vibes });
  } catch (error) {
    console.error('Error fetching popular vibes:', error);
    return NextResponse.json({ error: 'Failed to fetch popular vibes' }, { status: 500 });
  }
} 