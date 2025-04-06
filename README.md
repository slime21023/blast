# Blast - High Performance Static File Server for Bun

Blast is a lightweight static file server built specifically for the Bun JavaScript runtime.

## Features

- 🧩 **Middleware Support**: Extensible with middleware
- 🔒 **Security**: Built-in security features
- 📦 **Compression**: Automatic content compression
- 🌐 **CORS Support**: Configurable CORS settings
- 📂 **Directory Listings**: Clean directory browsing interface
- 📱 **SPA Support**: Optional Single Page Application mode

## Quick Start

```typescript
import { createServer } from 'blast';

// Create and start a server with default options
const server = createServer();
server.start();
```

## Configuration
```typescript
import { createServer, cors, cache, compression, security } from 'blast';

const server = createServer({
  // Server configuration
  port: 8080,
  host: 'localhost',
  
  // Static file serving
  root: './public',
  handlerOptions: {
    enableSPA: true,
    enableDirectoryListing: true
  },
  
  // Middleware stack
  middleware: [
    cors(),
    cache(),
    compression(),
    security()
  ]
});

server.start();
```

## Available Middleware
* cors(): Configure Cross-Origin Resource Sharing
* cache(): Enable response caching
* compression(): Compress responses
* security(): Add security headers

