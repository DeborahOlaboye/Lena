import { NextResponse } from 'next/server';

type SecurityHeaders = {
  [key: string]: string | boolean | string[];
};

export function setSecurityHeaders(response: NextResponse) {
  // Default security headers
  const securityHeaders: SecurityHeaders = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS filtering (cross-site scripting)
    'X-XSS-Protection': '1; mode=block',
    
    // Control frame embedding
    'X-Frame-Options': 'DENY',
    
    // Restrict browser features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'fullscreen=()',
    ].join(', '),
    
    // Enable HSTS (HTTP Strict Transport Security)
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    
    // Enable CSP (Content Security Policy)
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: http:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; '),
    
    // Prevent clickjacking
    'X-Permitted-Cross-Domain-Policies': 'none',
    
    // Disable caching for sensitive pages
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // Add headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      response.headers.set(key, Array.isArray(value) ? value.join('; ') : String(value));
    }
  });

  return response;
}

// Helper function to generate nonce for CSP
let nonce: string | null = null;

export function generateNonce(): string {
  if (!nonce) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    nonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return nonce;
}

// Function to get CSP header with nonce
export function getCspHeader() {
  const nonce = generateNonce();
  return {
    key: 'Content-Security-Policy',
    value: [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}'`,
      `img-src 'self' data: https:`,
      `font-src 'self'`,
      `connect-src 'self'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; '),
  };
}
