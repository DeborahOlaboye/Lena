import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './rate-limit';
import { validateInput } from './input-validation';
import { setSecurityHeaders } from './security-headers';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max users per interval
});

export async function securityMiddleware(request: NextRequest) {
  try {
    const requestPath = request.nextUrl.pathname;
    const ip = request.ip ?? '127.0.0.1';

    // Skip security checks for static files and API routes
    if (
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.includes('/api/') ||
      request.nextUrl.pathname.includes('.') // Files with extensions
    ) {
      return NextResponse.next();
    }

    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, ip);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate input
    const validationResponse = validateInput(request);
    if (validationResponse) return validationResponse;

    // Set security headers
    const response = NextResponse.next();
    setSecurityHeaders(response);

    return response;
  } catch (error) {
    console.error('Security middleware error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function applyRateLimit(request: NextRequest, ip: string) {
  try {
    // Skip rate limiting for certain paths
    const skipPaths = ['/api/health', '/_next/static', '/favicon.ico'];
    if (skipPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      return null;
    }

    // Apply rate limiting
    await limiter.check(10, ip); // 10 requests per minute per IP
    return null;
  } catch (error) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
}

// Export the middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};

export default securityMiddleware;
