// src/server.ts
import { PathLike, Server, BunRequest } from 'bun';
import { Middleware } from './middleware';
import { createMiddlewareChain } from './middleware/chain';
import { handler, HandlerOptions } from './handler';

// Define the ServerOptions interface - optimized for Bun
export interface ServerOptions {
  // Server configuration
  port?: number;
  host?: string;

  // Static file serving
  root?: PathLike;
  handlerOptions?: HandlerOptions;

  // Middleware
  middleware?: Middleware[];
}

export function createServer(options: ServerOptions = {}): { start: () => Server } {
  const {
    port = 3000,
    host = 'localhost',
    root = process.cwd(),
    handlerOptions = { enableSPA: false, enableDirectoryListing: true },
    middleware = []
  } = options;

  // Create middleware chain once during server initialization
  const middlewareChain = createMiddlewareChain();
  middleware.forEach(m => middlewareChain.use(m));

  // Optimize the request handler for Bun
  async function handleRequest(req: Request): Promise<Response> {
    try {
      // Execute middleware chain with the static file handler as the final callback
      return await middlewareChain.execute(req as BunRequest, async () => {
        const url = new URL(req.url);
        // Direct call to the optimized handler
        return await handler(
          root,
          url.pathname,
          req.method,
          handlerOptions
        );
      });
    } catch (error) {
      // Efficient error handling
      console.error('[Server Error]:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }

  // Return a server object with start method
  return {
    start() {
      console.log(`🚀 Server starting on http://${host}:${port}`);

      // Use Bun.serve for optimal performance
      return Bun.serve({
        port,
        hostname: host,
        fetch: handleRequest,
        // Add error handling for the server itself
        error(error) {
          console.error('[Server Error]:', error);
          return new Response('Internal Server Error', { status: 500 });
        }
      });
    }
  };
}