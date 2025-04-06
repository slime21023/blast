// src/utils/mime.ts

// 常用的 MIME 類型映射
const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.jsx': 'text/jsx',
    '.tsx': 'application/typescript',
    '.md': 'text/markdown',
    '.webmanifest': 'application/manifest+json',
  };
  
  /**
   * 根據檔案副檔名獲取 MIME 類型
   * @param ext 檔案副檔名，包含前導點 (如 '.html')
   * @returns MIME 類型，如果未知則返回 'application/octet-stream'
   */
  export function getMimeType(ext: string): string {
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
  
  /**
   * 檢查 MIME 類型是否為文字類型
   * @param mimeType MIME 類型
   * @returns 是否為文字類型
   */
  export function isTextMime(mimeType: string): boolean {
    return mimeType.startsWith('text/') || 
           ['application/json', 'application/xml', 'application/javascript', 'application/typescript'].includes(mimeType);
  }
  
  /**
   * 檢查 MIME 類型是否為二進位類型
   * @param mimeType MIME 類型
   * @returns 是否為二進位類型
   */
  export function isBinaryMime(mimeType: string): boolean {
    return !isTextMime(mimeType);
  }
  
  /**
   * 註冊自定義 MIME 類型
   * @param ext 檔案副檔名，包含前導點 (如 '.custom')
   * @param mimeType MIME 類型
   */
  export function registerMimeType(ext: string, mimeType: string): void {
    mimeTypes[ext.toLowerCase()] = mimeType;
  }