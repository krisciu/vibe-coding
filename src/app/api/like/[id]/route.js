import { NextResponse } from 'next/server';
import { likeVibe } from '@/utils/supabase';

export async function POST(request, { params }) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await likeVibe(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking vibe:', error);
    return NextResponse.json({ error: 'Failed to like vibe' }, { status: 500 });
  }
} 