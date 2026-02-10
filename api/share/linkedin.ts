
// Use edge runtime for better performance
export const config = {
  runtime: 'edge',
};

// CORS headers setup
const setCorsHeaders = (headers: Headers): Headers => {
  const origin = process.env.NODE_ENV === 'production'
    ? 'https://linkedin-posts-one.vercel.app'
    : 'http://localhost:5173';

  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return headers;
};

export default async function handler(req: Request) {
  const headers = setCorsHeaders(new Headers());

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Parse request body
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid content provided' }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get LinkedIn credentials from environment variables
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const authorUrn = process.env.LINKEDIN_AUTHOR_URN;

    // Check if credentials are configured
    if (!accessToken || !authorUrn ||
        accessToken.includes('YOUR_') ||
        authorUrn.includes('YOUR_')) {

      // Return a response that tells frontend to use fallback
      return new Response(
        JSON.stringify({
          fallback: true,
          message: 'LinkedIn API not configured, use share dialog'
        }),
        {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
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

      // Return fallback instead of error to maintain UX
      return new Response(
        JSON.stringify({
          fallback: true,
          message: 'Could not create draft, use share dialog'
        }),
        {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse the response to get the draft ID
    const responseData = await linkedinResponse.json();
    const draftId = responseData.id;

    // Construct the draft URL
    // Note: LinkedIn doesn't provide a direct draft edit URL, so we return success
    // The frontend should show a success message
    const result = {
      success: true,
      draftId: draftId,
      message: 'Draft created successfully on LinkedIn',
      // Provide a general LinkedIn posts URL
      linkedinUrl: 'https://www.linkedin.com/in/me/recent-activity/shares/'
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in LinkedIn share handler:', error);

    // Return fallback instead of error for better UX
    return new Response(
      JSON.stringify({
        fallback: true,
        message: 'Service temporarily unavailable, use share dialog'
      }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  }
}