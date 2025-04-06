// src/utils/path.ts
import { resolve, join, normalize, sep } from 'path';

/**
 * Normalizes a URL path to ensure it starts with a slash and doesn't have duplicate slashes
 * @param urlPath The URL path to normalize
 * @returns Normalized URL path
 */
export function normalizeUrlPath(urlPath: string): string {
  // Bun's string operations are very fast, so we can use direct string manipulations
  if (!urlPath || urlPath === '/') return '/';

  // Remove duplicate slashes and ensure starts with slash
  let normalized = '/' + urlPath.replace(/^\/+/, '').replace(/\/+/g, '/');

  // Remove trailing slash unless it's the root path
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Resolves a URL path against a root directory to get the file system path
 * @param rootDir The root directory to serve files from
 * @param urlPath The URL path to resolve
 * @returns Resolved file system path
 */
export function resolveStaticPath(rootDir: string, urlPath: string): string {
  // Bun optimizes for path operations, so we can use the path module directly
  // Remove leading slash for joining
  const normalizedPath = urlPath.replace(/^\/+/, '');

  // Join with root directory and normalize
  return normalize(join(rootDir, normalizedPath));
}

/**
 * Checks if a file system path is under the root directory
 * @param filePath The file system path to check
 * @param rootDir The root directory
 * @returns True if the path is within the root directory
 */
export function isPathUnderRoot(filePath: string, rootDir: string): boolean {
  // Normalize paths - Bun optimizes these operations
  const normalizedPath = resolve(filePath);
  const normalizedRoot = resolve(rootDir);

  // Simple string prefix check is very fast in Bun
  return normalizedPath === normalizedRoot ||
    (normalizedPath.startsWith(normalizedRoot) &&
      (normalizedRoot.endsWith(sep) || normalizedPath[normalizedRoot.length] === sep));
}

/**
 * Safely resolves a URL path against a root directory, ensuring it stays within the root
 * @param rootDir The root directory to serve files from
 * @param urlPath The URL path to resolve
 * @returns Resolved file system path if safe
 * @throws Error if the path attempts to traverse outside the root directory
 */
export function safeResolveStaticPath(rootDir: string, urlPath: string): string {
  // Use faster path resolution
  const filePath = resolveStaticPath(rootDir, urlPath);

  // Security check
  if (!isPathUnderRoot(filePath, rootDir)) {
    throw new Error('Path traversal attack detected');
  }

  return filePath;
}

/**
 * Gets the URL path from a file system path relative to the root directory
 * @param rootDir The root directory
 * @param filePath The file system path
 * @returns URL path or null if the file is not under the root
 */
export function getUrlPathFromFilePath(rootDir: string, filePath: string): string | null {
  // Normalize paths
  const normalizedRoot = resolve(rootDir);
  const normalizedPath = resolve(filePath);

  // Check if the file is under the root
  if (!isPathUnderRoot(normalizedPath, normalizedRoot)) {
    return null;
  }

  // Get the relative path - Bun has efficient string operations
  let relativePath = normalizedPath.slice(normalizedRoot.length);

  // Ensure path starts with slash and normalize
  return normalizeUrlPath(relativePath);
}

/**
 * Creates a URL path for a directory listing
 * @param currentUrlPath The current URL path
 * @param dirName The directory name
 * @returns URL path for the directory
 */
export function createDirectoryUrl(currentUrlPath: string, dirName: string): string {
  // Bun's string operations are optimized
  const base = currentUrlPath.endsWith('/') ? currentUrlPath : `${currentUrlPath}/`;
  return `${base}${encodeURIComponent(dirName)}/`;
}

/**
 * Creates a URL path for a file
 * @param currentUrlPath The current URL path
 * @param fileName The file name
 * @returns URL path for the file
 */
export function createFileUrl(currentUrlPath: string, fileName: string): string {
  // Template literals are fast in Bun
  const base = currentUrlPath.endsWith('/') ? currentUrlPath : `${currentUrlPath}/`;
  return `${base}${encodeURIComponent(fileName)}`;
}

/**
 * Gets the parent directory URL path
 * @param urlPath The current URL path
 * @returns Parent directory URL path or null if at root
 */
export function getParentDirectoryUrl(urlPath: string): string | null {
  if (urlPath === '/' || urlPath === '') {
    return null;
  }

  // Remove trailing slash if present
  const path = urlPath.endsWith('/') ? urlPath.slice(0, -1) : urlPath;

  // Find the last slash - Bun optimizes string operations
  const lastSlashIndex = path.lastIndexOf('/');

  // If no slash found or at root level, return root
  if (lastSlashIndex <= 0) {
    return '/';
  }

  // Return everything up to the last slash
  return `${path.slice(0, lastSlashIndex)}/`;
}

/**
 * Checks if a URL path points to a hidden file or directory (starting with .)
 * @param urlPath The URL path to check
 * @returns True if the path contains a hidden segment
 */
export function isHiddenPath(urlPath: string): boolean {
  // Use Bun's optimized string and array operations
  return urlPath.split('/').some(segment =>
    segment.length > 0 && segment[0] === '.' && segment !== '.' && segment !== '..'
  );
}

/**
 * Fast check if a URL path might contain path traversal attempts
 * @param urlPath The URL path to check
 * @returns True if the path might contain traversal attempts
 */
export function mightContainPathTraversal(urlPath: string): boolean {
  // Quick check for suspicious patterns
  return urlPath.includes('../') || urlPath.includes('..\\') ||
    urlPath.includes('/.') || urlPath.includes('\\.') ||
    urlPath.includes('~');
}

/**
 * Get file extension from path (optimized for Bun)
 * @param path The file path
 * @returns The file extension (lowercase) or empty string
 */
export function getExtension(path: string): string {
  const lastDotIndex = path.lastIndexOf('.');
  return lastDotIndex > 0 ? path.slice(lastDotIndex).toLowerCase() : '';
}

/**
 * Check if path ends with a specific extension (case insensitive)
 * @param path The file path
 * @param extension The extension to check for (with or without dot)
 * @returns True if the path ends with the extension
 */
export function hasExtension(path: string, extension: string): boolean {
  // Ensure extension starts with dot
  const ext = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  return path.toLowerCase().endsWith(ext);
}