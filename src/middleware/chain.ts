// src/middleware/chain.ts
import { Middleware, MiddlewareChain } from './types';
import { BunRequest } from 'bun';

export function createMiddlewareChain(): MiddlewareChain {
  const middlewares: Middleware[] = [];

  return {
    use(middleware: Middleware) {
      middlewares.push(middleware);
      return this;
    },

    async execute(req: BunRequest, finalHandler: () => Promise<Response>) {
      let index = 0;

      const next = async (): Promise<Response> => {
        if (index >= middlewares.length) {
          return finalHandler();
        }

        const middleware = middlewares[index++];
        return middleware(req, next);
      };

      return next();
    }
  };
}
