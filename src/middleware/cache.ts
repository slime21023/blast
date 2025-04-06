// src/middleware/cache.ts
import { Middleware } from './types';
import { BunRequest } from 'bun';

export interface CacheOptions {
  maxAge?: number;
  maxSize?: number;
}


/**
 * 使用 Map 實現簡單的 LRU 快取
 */
const memoryCache = new Map<string, { data: Response; expires: number }>();

export function cache(options: CacheOptions = {}): Middleware {
  const {
    maxAge = 0, // 預設不快取
    maxSize = 100 // 最大快取項目數
  } = options;

  return async (req: BunRequest, next: () => Promise<Response>) => {

    // 只快取 GET 請求且 maxAge 大於 0
    if (req.method !== 'GET' || maxAge <= 0) {
      return next();
    }

    const cacheKey = req.url.toString();
    const now = Date.now();

    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expires > now) {
      // 快取命中，將項目移到 Map 的末尾以維持 LRU
      memoryCache.delete(cacheKey);
      memoryCache.set(cacheKey, cached);
      return cached.data.clone(); // 克隆響應以避免重複使用
    }

    const response = await next();

    if (response.ok) {
      // 儲存快取，克隆響應以防止響應體被消耗
      memoryCache.set(cacheKey, {
        data: response.clone(),
        expires: now + maxAge * 1000
      });

      // 管理快取大小，刪除最舊的項目
      if (memoryCache.size > maxSize) {
        const oldestKey = memoryCache.keys().next().value;
        memoryCache.delete(oldestKey);
      }
    }

    return response;
  };
}