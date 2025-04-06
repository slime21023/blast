import { PathLike } from 'bun';
import { existsSync } from 'fs';
import { stat, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { getMimeType } from './utils/mime';
import { resolveStaticPath as resolvePath, isPathUnderRoot as isPathInside, normalizeUrlPath, createDirectoryUrl, createFileUrl, getParentDirectoryUrl } from './utils/path';

export interface HandlerOptions {
    enableSPA?: boolean
    enableDirectoryListing?: boolean
}

// Helper function to serve a file - optimized for Bun
export async function serveFile(
    filePath: string,
    stats: any,
    options: { method: string }
): Promise<Response> {
    const { method } = options;
    const headers = new Headers();

    // Set content type based on file extension
    const ext = extname(filePath).toLowerCase();
    const contentType = getMimeType(ext) || 'application/octet-stream';
    headers.set('Content-Type', contentType);

    // Set Last-Modified header
    headers.set('Last-Modified', stats.mtime.toUTCString());

    // Create ETag
    const etag = `W/"${stats.size.toString(16)}-${stats.mtime.getTime().toString(16)}"`;
    headers.set('ETag', etag);

    // Handle HEAD request
    if (method === 'HEAD') {
        headers.set('Content-Length', stats.size.toString());
        return new Response(null, { headers });
    }

    // Use Bun.file for optimal performance
    return new Response(Bun.file(filePath), { headers });
}

// Helper function to format file size
export function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// Helper function to generate directory listing HTML
export function generateDirectoryListing(
    path: string,
    files: Array<{
        name: string;
        path: string;
        size: string;
        mtime: string;
        type: string;
        isDirectory: boolean;
    }>,
    parent: string | null
): string {
    // Helper function to generate HTML head
    const generateHead = (title: string): string => `
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        a { text-decoration: none; color: #0066cc; }
        a:hover { text-decoration: underline; }
        .size, .date { text-align: right; }
        .icon { padding-right: 8px; }
        h1 { margin-bottom: 1rem; }
    </style>
</head>`;

    // Helper function to generate table header
    const generateTableHeader = (): string => `
<thead>
    <tr>
        <th>Name</th>
        <th class="size">Size</th>
        <th class="date">Modified</th>
    </tr>
</thead>`;

    // Helper function to generate parent directory row
    const generateParentRow = (parentPath: string): string => `
<tr>
    <td><a href="${parentPath}"><span class="icon">📁</span>..</a></td>
    <td class="size">-</td>
    <td class="date">-</td>
</tr>`;

    // Helper function to generate file or directory row
    const generateFileRow = (file: {
        name: string;
        path: string;
        size: string;
        mtime: string;
        type: string;
        isDirectory: boolean;
    }): string => {
        const icon = getFileIcon(file.type);
        const date = new Date(file.mtime).toLocaleString();
        return `
<tr>
    <td><a href="${file.path}"><span class="icon">${icon}</span>${file.name}</a></td>
    <td class="size">${file.isDirectory ? '-' : file.size}</td>
    <td class="date">${date}</td>
</tr>`;
    };

    // Helper function to get file icon based on type
    const getFileIcon = (type: string): string => {
        if (type === 'directory') return '📁';
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('text/')) return '📄';
        if (type.startsWith('audio/')) return '🎵';
        if (type.startsWith('video/')) return '🎬';
        return '📎';
    };

    // Build the HTML content using the helper functions
    const html = `<!DOCTYPE html>
<html>
${generateHead(`Directory: ${path}`)}
<body>
    <h1>Directory: ${path}</h1>
    <table>
        ${generateTableHeader()}
        <tbody>
            ${parent ? generateParentRow(parent) : ''}
            ${files.map(file => generateFileRow(file)).join('')}
        </tbody>
    </table>
</body>
</html>`;

    return html;
}

// Helper function to serve a directory listing - optimized
export async function serveDirectory(dirPath: string, urlPath: string): Promise<Response> {
    try {
        const entries = await readdir(dirPath);
        const filePromises = entries.map(async entry => {
            try {
                const entryPath = join(dirPath, entry);
                const entryStat = await stat(entryPath);
                const isDir = entryStat.isDirectory();

                return {
                    name: entry,
                    path: isDir ? createDirectoryUrl(urlPath, entry) : createFileUrl(urlPath, entry),
                    size: formatSize(entryStat.size),
                    mtime: entryStat.mtime.toISOString(),
                    type: isDir ? 'directory' : getMimeType(extname(entry)) || 'application/octet-stream',
                    isDirectory: isDir
                };
            } catch {
                return null;
            }
        });

        // Use Promise.all for concurrent processing
        const fileResults = await Promise.all(filePromises);
        // Use type assertion to fix the type issue
        const files = fileResults.filter(Boolean) as Array<{
            name: string;
            path: string;
            size: string;
            mtime: string;
            type: string;
            isDirectory: boolean;
        }>;

        // Sort directories first, then files alphabetically
        files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        const parent = getParentDirectoryUrl(urlPath);
        const html = generateDirectoryListing(urlPath, files, parent);

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    } catch (error) {
        console.error("Directory listing error:", error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

// Main handler function - optimized for Bun
export async function handler(
    rootDir: PathLike,
    requestPath: string,
    method: string = 'GET',
    options?: HandlerOptions
): Promise<Response> {
    const { enableSPA = false, enableDirectoryListing = false } = options || {};
    const rootDirStr = rootDir.toString();

    // Only handle GET and HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { 'Allow': 'GET, HEAD' }
        });
    }

    // Normalize the requested path
    requestPath = normalizeUrlPath(requestPath);

    // Resolve the file system path
    const filePath = resolvePath(rootDirStr, requestPath);

    // Security check: ensure the path is inside the root directory
    if (!isPathInside(filePath, rootDirStr)) {
        return new Response('Forbidden', { status: 403 });
    }

    try {
        // Check if the path exists and get its stats
        const stats = await stat(filePath);

        // Handle file request
        if (stats.isFile()) {
            return await serveFile(filePath, stats, { method });
        }

        // Handle directory request
        if (stats.isDirectory()) {
            // Redirect if the URL doesn't end with a slash
            if (!requestPath.endsWith('/')) {
                const redirectUrl = `${requestPath}/`;
                return new Response(null, {
                    status: 301,
                    headers: {
                        'Location': redirectUrl,
                        'Content-Type': 'text/plain',
                        'Content-Length': '0'
                    }
                });
            }

            // Try to serve index.html from the directory
            const indexPath = join(filePath, 'index.html');

            // Use existsSync for better performance when checking file existence
            if (existsSync(indexPath)) {
                try {
                    const indexStats = await stat(indexPath);
                    return await serveFile(indexPath, indexStats, { method });
                } catch {
                    // Continue to directory listing or 404 if index.html exists but can't be served
                }
            }

            // If directory listing is enabled, show directory contents
            if (enableDirectoryListing) {
                return await serveDirectory(filePath, requestPath);
            }

            // Otherwise return 404
            return new Response('Not Found', {
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        // Neither file nor directory
        return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error) {
        // If the file doesn't exist and SPA mode is enabled, try to serve the index.html
        if (enableSPA && error.code === 'ENOENT') {
            const indexPath = join(rootDirStr, 'index.html');

            // Use existsSync for better performance
            if (existsSync(indexPath)) {
                try {
                    const indexStats = await stat(indexPath);
                    return await serveFile(indexPath, indexStats, { method });
                } catch (indexError) {
                    console.error("SPA index.html not found:", indexError);
                }
            }
        }

        // Handle all errors with a 404 response
        return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}