// src/middleware/security.ts
import { Middleware } from './types';
import { BunRequest } from 'bun';

export interface SecurityOptions {
  xssProtection?: boolean;
  noSniff?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN' | false;
  hsts?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  } | false;
}

// src/middleware/security.ts:security

export function security(options: SecurityOptions = {}): Middleware {
  const {
    xssProtection = true,
    noSniff = true,
    frameOptions = 'DENY',
    hsts = {
      maxAge: 15552000, // 180 天
      includeSubDomains: true,
      preload: false
    }
  } = options;

  const headers: Record<string, string> = {};

  if (xssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block';
  }

  if (noSniff) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  if (frameOptions) {
    headers['X-Frame-Options'] = frameOptions;
  }

  if (hsts) {
    let hstsValue = `max-age=${hsts.maxAge}`;
    if (hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    if (hsts.preload) {
      hstsValue += '; preload';
    }
    headers['Strict-Transport-Security'] = hstsValue;
  }

  return async (request: BunRequest, next: () => Promise<Response>) => {
    const response = await next();

    // 只在 HTTPS 響應上設置標頭
    if (request.url.startsWith('https:')) {
      for (const [key, value] of Object.entries(headers)) {
        if (value) {
          response.headers.set(key, value);
        }
      }
    }

    return response;
  };
}
