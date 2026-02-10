import {
  buildStructuredPostPrompt,
  parseStructuredResponse,
  type PostGenerationOptions,
  type PostGenerationResponse
} from '@/libs/promptBuilder.v2';
import { generateOpenRouterMessage } from '@/libs/api-client';
import { OPENROUTER_MODEL } from '@/config/ai';

/**
 * Core generation logic shared by all platform-specific functions
 * Consolidates duplicate code for better maintainability
 */
async function _generate(options: PostGenerationOptions, max_tokens: number): Promise<PostGenerationResponse> {
  const prompt = buildStructuredPostPrompt(options);

  const response = await generateOpenRouterMessage({
    model: OPENROUTER_MODEL,
    max_tokens,
    temperature: options.regenerationSeed ? Math.min(1.0, 0.8 + (options.regenerationSeed * 0.05)) : 0.7,
    messages: [
      { role: 'user', content: prompt }
    ]
  }, { timeout: 25000 });

  const firstBlock = response.content?.[0];
  if (!firstBlock || typeof firstBlock !== 'object' || !('text' in firstBlock) || typeof firstBlock.text !== 'string') {
    throw new Error('Invalid AI response: expected text block');
  }
  return parseStructuredResponse(firstBlock.text);
}

/**
 * Enhanced LinkedIn post generation using structured prompts
 * Generates single high-quality post with metadata tracking
 */
export async function generateEnhancedLinkedInPost(options: PostGenerationOptions): Promise<PostGenerationResponse> {
  try {
    return await _generate(options, 2048);
  } catch (error) {
    if (import.meta.env.DEV) console.error('Enhanced LinkedIn generation failed:', error);
    throw new Error('Failed to generate enhanced LinkedIn post');
  }
}

/**
 * Enhanced Twitter/X post generation using structured prompts
 */
export async function generateEnhancedTwitterPost(options: PostGenerationOptions): Promise<PostGenerationResponse> {
  try {
    return await _generate(options, 1024);
  } catch (error) {
    if (import.meta.env.DEV) console.error('Enhanced Twitter generation failed:', error);
    throw new Error('Failed to generate enhanced Twitter post');
  }
}

/**
 * Enhanced Instagram post generation using structured prompts
 */
export async function generateEnhancedInstagramPost(options: PostGenerationOptions): Promise<PostGenerationResponse> {
  try {
    return await _generate(options, 2048);
  } catch (error) {
    if (import.meta.env.DEV) console.error('Enhanced Instagram generation failed:', error);
    throw new Error('Failed to generate enhanced Instagram post');
  }
}

/**
 * Unified enhanced post generation function
 * Routes to appropriate platform-specific enhanced generator
 */
export async function generateEnhancedPost(options: PostGenerationOptions): Promise<PostGenerationResponse> {
  switch (options.platform) {
    case 'linkedin':
      return generateEnhancedLinkedInPost(options);
    case 'x':
      return generateEnhancedTwitterPost(options);
    case 'instagram':
      return generateEnhancedInstagramPost(options);
    default: {
      const _exhaustive: never = options.platform;
      throw new Error(`Unknown platform: ${_exhaustive}`);
    }
  }
}

/**
 * Comparison utility to test old vs new approach
 * Generates both old and new versions for A/B testing
 */
export async function generateComparison(
  content: string,
  platform: 'linkedin' | 'x' | 'instagram',
  postGoal: PostGenerationOptions['postGoal'] = 'thought_leadership'
) {
  // Import old functions dynamically to avoid circular dependencies
  const { linkedInPostsFromNewsletter, xTweetsFromBlog, instagramPostsFromBlog } = await import('@/api/claude');

  try {
    // Generate with old system
    let oldResult: string[] = [];
    switch (platform) {
      case 'linkedin':
        oldResult = await linkedInPostsFromNewsletter(content);
        break;
      case 'x':
        oldResult = await xTweetsFromBlog(content);
        break;
      case 'instagram':
        oldResult = await instagramPostsFromBlog(content);
        break;
    }

    // Generate with new enhanced system
    const newResult = await generateEnhancedPost({
      content,
      platform,
      postGoal
    });

    return {
      old: {
        posts: oldResult,
        count: oldResult.length,
        system: 'legacy'
      },
      new: {
        post: newResult.post_text,
        metadata: newResult.generation_metadata,
        hashtags: newResult.suggested_hashtags,
        system: 'enhanced'
      }
    };

  } catch (error) {
    if (import.meta.env.DEV) console.error('Comparison generation failed:', error);
    throw new Error('Failed to generate comparison');
  }
}
