import { POST } from '../[id]/route';
import { likeVibe } from '@/utils/supabase';

// Mock the likeVibe function from supabase utils
jest.mock('@/utils/supabase', () => ({
  likeVibe: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe('Like Vibe API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if no ID is provided', async () => {
    const request = {};
    const params = { params: { id: '' } };
    
    const response = await POST(request, params);
    
    expect(response.data.error).toBe('Invalid ID');
    expect(response.options.status).toBe(400);
    expect(likeVibe).not.toHaveBeenCalled();
  });

  it('should like a vibe successfully', async () => {
    const request = {};
    const params = { params: { id: '123' } };
    
    likeVibe.mockResolvedValueOnce(true);
    
    const response = await POST(request, params);
    
    expect(response.data.success).toBe(true);
    expect(likeVibe).toHaveBeenCalledWith('123');
  });

  it('should handle errors when liking a vibe fails', async () => {
    const request = {};
    const params = { params: { id: '123' } };
    
    likeVibe.mockRejectedValueOnce(new Error('Database error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const response = await POST(request, params);
    
    expect(response.data.error).toBe('Failed to like vibe');
    expect(response.options.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 