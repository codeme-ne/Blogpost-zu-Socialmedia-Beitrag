import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContentGeneration } from '@/hooks/useContentGeneration';

// Mock the Claude API
vi.mock('@/api/claude', () => ({
  linkedInPostsFromNewsletter: vi.fn(),
  xTweetsFromBlog: vi.fn(),
  instagramPostsFromBlog: vi.fn(),
  batchedPostsFromContent: vi.fn(),
}));

// Mock the subscription hook
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    decrementUsage: vi.fn(),
    hasUsageRemaining: () => true,
  })
}));

// Mock libs
vi.mock('@/libs/promptBuilder', () => ({
  buildSinglePostPrompt: vi.fn(() => 'test prompt'),
  validatePost: vi.fn(),
  normalizeSinglePostResponse: vi.fn((text) => text),
}));

vi.mock('@/libs/api-client', () => ({
  generateOpenRouterMessage: vi.fn(),
  generateClaudeMessage: vi.fn(),
}));

describe('useContentGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize with empty posts', () => {
    const { result } = renderHook(() => useContentGeneration());
    
    expect(result.current.postsByPlatform).toEqual({
      linkedin: [],
      x: [],
      instagram: [],
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.generatedPosts).toEqual({});
  });

  test('should handle empty input gracefully', async () => {
    const { result } = renderHook(() => useContentGeneration());
    
    await act(async () => {
      const success = await result.current.generateContent('', ['linkedin']);
      expect(success).toBe(false);
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  test('should handle whitespace-only input', async () => {
    const { result } = renderHook(() => useContentGeneration());
    
    await act(async () => {
      const success = await result.current.generateContent('   \n   ', ['linkedin']);
      expect(success).toBe(false);
    });
  });

  test('should generate content for single platform', async () => {
    const { linkedInPostsFromNewsletter } = await import('@/api/claude');
    vi.mocked(linkedInPostsFromNewsletter).mockResolvedValue(['Generated LinkedIn post']);
    
    const { result } = renderHook(() => useContentGeneration());
    
    await act(async () => {
      const success = await result.current.generateContent(
        'Test newsletter content',
        ['linkedin']
      );
      expect(success).toBe(true);
    });
    
    expect(result.current.postsByPlatform.linkedin).toEqual(['Generated LinkedIn post']);
    expect(result.current.isLoading).toBe(false);
  });

  test('should generate content for multiple platforms', async () => {
    const { batchedPostsFromContent } = await import('@/api/claude');
    // Mock batched generation (used for multi-platform)
    vi.mocked(batchedPostsFromContent).mockResolvedValue({
      linkedin: ['LinkedIn post'],
      x: ['X tweet'],
      instagram: [],
    });

    const { result } = renderHook(() => useContentGeneration());

    await act(async () => {
      const success = await result.current.generateContent(
        'Test content',
        ['linkedin', 'x']
      );
      expect(success).toBe(true);
    });

    expect(result.current.postsByPlatform.linkedin).toEqual(['LinkedIn post']);
    expect(result.current.postsByPlatform.x).toEqual(['X tweet']);
  });

  test('should handle API errors gracefully', async () => {
    const { linkedInPostsFromNewsletter } = await import('@/api/claude');
    vi.mocked(linkedInPostsFromNewsletter).mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useContentGeneration());
    
    await act(async () => {
      const success = await result.current.generateContent(
        'Test content',
        ['linkedin']
      );
      expect(success).toBe(true); // Should still return true even if one platform fails
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  test('should update post content', () => {
    const { result } = renderHook(() => useContentGeneration());
    
    // Set initial posts
    act(() => {
      result.current.setPostsByPlatform({
        linkedin: ['Original post'],
        x: [],
        instagram: [],
      });
    });
    
    // Update post
    act(() => {
      result.current.updatePost('linkedin', 0, 'Updated post');
    });
    
    expect(result.current.postsByPlatform.linkedin[0]).toBe('Updated post');
  });

  test('should clear all posts', () => {
    const { result } = renderHook(() => useContentGeneration());
    
    // Set some posts
    act(() => {
      result.current.setPostsByPlatform({
        linkedin: ['Post 1'],
        x: ['Tweet 1'],
        instagram: ['Insta 1'],
      });
    });
    
    // Clear posts
    act(() => {
      result.current.clearPosts();
    });
    
    expect(result.current.postsByPlatform).toEqual({
      linkedin: [],
      x: [],
      instagram: [],
    });
  });

  test('should generate single post', async () => {
    const { generateOpenRouterMessage } = await import('@/libs/api-client');
    vi.mocked(generateOpenRouterMessage).mockResolvedValue({
      content: [{ text: 'Generated single post' }]
    });
    
    const { result } = renderHook(() => useContentGeneration());
    
    await act(async () => {
      const post = await result.current.generateSinglePost(
        'Test content',
        'linkedin'
      );
      expect(post).toBe('Generated single post');
    });
    
    expect(result.current.generatedPosts.linkedin).toEqual({
      post: 'Generated single post',
      regenerationCount: 0,
      isEdited: false
    });
  });

  test('should handle single post generation errors', async () => {
    const { generateOpenRouterMessage } = await import('@/libs/api-client');
    vi.mocked(generateOpenRouterMessage).mockRejectedValue(new Error('Generation failed'));
    
    const { result } = renderHook(() => useContentGeneration());
    
    await act(async () => {
      await expect(
        result.current.generateSinglePost('Test content', 'linkedin')
      ).rejects.toThrow('Generation failed');
    });
  });

  test('should check platform generation status', () => {
    const { result } = renderHook(() => useContentGeneration());
    
    expect(result.current.isGenerating('linkedin')).toBe(false);
    expect(result.current.isGenerating('x')).toBe(false);
    expect(result.current.isGenerating('instagram')).toBe(false);
  });
});
