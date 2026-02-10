
// Use edge runtime for better performance
export const config = {
  runtime: 'edge',
};

import { createCorsResponse, handlePreflight } from '../utils/cors.js';
import { verifyJWT } from '../utils/appwrite.js';

export default async function handler(req: Request) {
  const origin = req.headers.get('origin');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return handlePreflight(origin);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createCorsResponse({ error: 'Method not allowed' }, { status: 405, origin });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return createCorsResponse({ error: 'Authentication required' }, { status: 401, origin });
    }
    const token = authHeader.split(' ')[1];
    const user = await verifyJWT(token);
    if (!user) {
      return createCorsResponse({ error: 'Invalid or expired token' }, { status: 401, origin });
    }

    // Parse request body
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return createCorsResponse({ error: 'Invalid content provided' }, { status: 400, origin });
    }

    // Get LinkedIn credentials from environment variables
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const authorUrn = process.env.LINKEDIN_AUTHOR_URN;

    // Check if credentials are configured
    if (!accessToken || !authorUrn ||
        accessToken.includes('YOUR_') ||
        authorUrn.includes('YOUR_')) {

      // Return a response that tells frontend to use fallback
      return createCorsResponse({
        fallback: true,
        message: 'LinkedIn API not configured, use share dialog'
      }, { status: 200, origin });
    }

    // Create LinkedIn draft post using the API
    const linkedinApiUrl = 'https://api.linkedin.com/v2/ugcPosts';

    const postData = {
      author: authorUrn,
      lifecycleState: 'DRAFT', // Create as draft
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const linkedinResponse = await fetch(linkedinApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    });

    if (!linkedinResponse.ok) {
      const errorData = await linkedinResponse.text();
      console.error('LinkedIn API error:', errorData);

      // Return fallback with proper error status
      return createCorsResponse({
        fallback: true,
        message: 'Could not create draft, use share dialog'
      }, { status: 502, origin });
    }

    // Parse the response to get the draft ID
    const responseData = await linkedinResponse.json();
    const draftId = responseData.id;

    return createCorsResponse({
      success: true,
      draftId: draftId,
      message: 'Draft created successfully on LinkedIn',
      linkedinUrl: 'https://www.linkedin.com/in/me/recent-activity/shares/'
    }, { status: 200, origin });

  } catch (error) {
    console.error('Error in LinkedIn share handler:', error);

    // Return fallback with error status
    return createCorsResponse({
      fallback: true,
      message: 'Service temporarily unavailable, use share dialog'
    }, { status: 503, origin });
  }
}
