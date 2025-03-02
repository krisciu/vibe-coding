import { NextRequest, NextResponse } from 'next/server';
import { likeVibe } from '@/utils/supabase';

// Next.js 15 route handler pattern for dynamic segments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Make sure the ID is a number
    const id = parseInt(params.id, 10);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await likeVibe(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking vibe:', error);
    return NextResponse.json({ error: 'Failed to like vibe' }, { status: 500 });
  }
} 