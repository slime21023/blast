import { BunRequest } from "bun";

export type Middleware = (req: BunRequest, next: () =>  Promise<Response>) => Response | Promise<Response>;

export interface MiddlewareChain {
    use(middleware: Middleware): MiddlewareChain;
    execute(req: BunRequest, finalHandler: () => Promise<Response>): Promise<Response>;
}
