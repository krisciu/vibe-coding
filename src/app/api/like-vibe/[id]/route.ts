import { NextRequest, NextResponse } from 'next/server';
import { likeVibe } from '@/utils/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const success = await likeVibe(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to like vibe' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking vibe:', error);
    return NextResponse.json({ error: 'Failed to like vibe' }, { status: 500 });
  }
} 