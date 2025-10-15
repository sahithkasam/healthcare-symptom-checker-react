// This file explicitly disables any authentication for React app
// No authentication required for this public healthcare app

// Simple function to disable any auth middleware
export function middleware(request) {
  // Always allow all requests - no authentication
  return null
}

// Configuration to match all paths
export const config = {
  matcher: [
    /*
     * Match all request paths - allow public access
     */
    '/(.*)',
  ],
}

// Runtime configuration
export const runtime = 'edge'