import { NextResponse } from 'next/server';
import { likeVibe } from '@/utils/supabase';

// @ts-expect-error - Next.js App Router route handler typing issue
export async function POST(request, { params }) {
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