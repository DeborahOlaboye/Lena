import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Common validation schemas
const commonSchemas = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  uuid: z.string().uuid('Invalid UUID format'),
  url: z.string().url('Invalid URL'),
  numeric: z.string().regex(/^\d+$/, 'Must be a number'),
  alphaNumeric: z.string().regex(/^[a-zA-Z0-9]+$/, 'Must be alphanumeric'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'),
};

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate request body against a schema
export function validateRequestBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  return request.json().then((body) => {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new Error(
        `Validation failed: ${result.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    return result.data;
  });
}

// Validate URL parameters
export function validateUrlParams<T extends z.ZodTypeAny>(
  params: Record<string, string | string[] | undefined>,
  schema: T
): z.infer<T> {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new Error(
      `Invalid URL parameters: ${result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')}`
    );
  }
  return result.data;
}

// Validate query parameters
export function validateQueryParams<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);
  
  if (!result.success) {
    throw new Error(
      `Invalid query parameters: ${result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')}`
    );
  }
  
  return result.data;
}

// Middleware to validate input for API routes
export function validateInput(request: NextRequest): NextResponse | null {
  try {
    // Skip validation for certain paths
    if (request.nextUrl.pathname.startsWith('/api/health')) {
      return null;
    }

    // Example of URL parameter validation
    if (request.nextUrl.pathname.startsWith('/api/users/')) {
      const userId = request.nextUrl.pathname.split('/').pop();
      commonSchemas.uuid.parse(userId);
    }

    // Example of query parameter validation
    if (request.nextUrl.searchParams.has('page')) {
      const page = request.nextUrl.searchParams.get('page');
      z.string().regex(/^\d+$/).parse(page);
    }

    // Add more validation rules as needed

    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.error('Input validation error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Invalid input' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Sanitize object properties recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// Validate and sanitize request body
export async function validateAndSanitizeBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  const data = await validateRequestBody(request, schema);
  return sanitizeObject(data);
}
