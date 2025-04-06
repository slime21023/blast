// src/middleware/cors.ts
import { Middleware } from './types';
import { BunRequest } from 'bun';

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}


export function cors(options: CorsOptions = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = [],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400 // 24 hours
  } = options;

  // Pre-compute values that don't change between requests
  const methodsString = methods.join(', ');
  const exposedHeadersString = exposedHeaders.length ? exposedHeaders.join(', ') : '';
  const allowedHeadersString = allowedHeaders.length ? allowedHeaders.join(', ') : '';

  return async (req: BunRequest, next: () => Promise<Response>) => {
    const requestOrigin = req.headers.get('Origin') || '';

    // Determine the appropriate origin value
    const originValue = Array.isArray(origin)
      ? (origin.includes(requestOrigin) ? requestOrigin : origin[0])
      : origin;

    // Handle preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
      const headers = new Headers();

      // Set CORS headers
      headers.set('Access-Control-Allow-Origin', originValue);

      if (credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }

      if (exposedHeadersString) {
        headers.set('Access-Control-Expose-Headers', exposedHeadersString);
      }

      headers.set('Access-Control-Allow-Methods', methodsString);

      const requestHeaders = req.headers.get('Access-Control-Request-Headers');
      if (requestHeaders) {
        headers.set('Access-Control-Allow-Headers',
          allowedHeadersString || requestHeaders);
      }

      headers.set('Access-Control-Max-Age', maxAge.toString());

      return new Response(null, {
        status: 204,
        headers
      });
    }

    // Handle actual requests
    const response = await next();
    const headers = new Headers(response.headers);

    // Set CORS headers
    headers.set('Access-Control-Allow-Origin', originValue);

    if (credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (exposedHeadersString) {
      headers.set('Access-Control-Expose-Headers', exposedHeadersString);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };
}