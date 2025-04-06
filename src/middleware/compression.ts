// src/middleware/compression.ts
import { Middleware } from './types';
import { BunRequest } from 'bun';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';

export interface CompressionOptions {
  level?: number;
  types?: string[];
}


export function compression(options: CompressionOptions = {}): Middleware {
  const {
    level = 6,
    types = [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'application/xml',
      'image/svg+xml'
    ]
  } = options;

  return async (req: BunRequest, next: () => Promise<Response>) => {

    // 獲取接受的壓縮格式
    const acceptEncoding = req.headers.get('Accept-Encoding') || '';

    // 繼續處理請求
    const response = await next();

    // 檢查是否需要壓縮
    const contentType = response.headers.get('Content-Type') || '';
    const shouldCompress = types.some(type => contentType.includes(type));

    if (!shouldCompress) {
      return response;
    }

    // 獲取回應內容
    const body = await response.arrayBuffer();

    // 根據接受的編碼選擇壓縮方法
    if (acceptEncoding.includes('br')) {
      const compressed = brotliCompressSync(Buffer.from(body), {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: level
        }
      });

      const headers = new Headers(response.headers);
      headers.set('Content-Encoding', 'br');
      headers.delete('Content-Length');

      return new Response(compressed, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    if (acceptEncoding.includes('gzip')) {
      const compressed = gzipSync(Buffer.from(body), {
        level
      });

      const headers = new Headers(response.headers);
      headers.set('Content-Encoding', 'gzip');
      headers.delete('Content-Length');

      return new Response(compressed, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;
  };
}