#!/usr/bin/env node
// proxy.js — Static file server + CORS proxy for Docker / local use.
//
// Serves the app at http://localhost:PORT/ and exposes a server-side CORS
// proxy at /proxy/fetch?url=<encoded> so browser tools can reach APIs that
// don't send Access-Control-Allow-Origin headers (e.g. SSL Labs).
//
// Injects window.LOCAL_PROXY into HTML responses so components automatically
// use the local proxy instead of a public CORS relay like allorigins.win.
//
// Zero npm dependencies — Node built-ins only.
//
// Usage:
//   node scripts/proxy.js            # port 8080
//   PORT=3000 node scripts/proxy.js  # custom port

'use strict';

const http    = require('http');
const https   = require('https');
const fs      = require('fs');
const path    = require('path');
const url     = require('url');

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = path.join(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.jsx':  'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain',
};

// ---------------------------------------------------------------------------
// Upstream fetch (follows one redirect, 15s timeout)
// ---------------------------------------------------------------------------

function fetchUpstream(targetUrl) {
  return new Promise((resolve, reject) => {
    const mod = targetUrl.startsWith('https') ? https : http;
    const req = mod.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 RdaNetKit-Proxy/1.0' },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUpstream(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status:      res.statusCode,
        headers:     res.headers,
        body:        Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Upstream timeout')));
  });
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── CORS proxy ────────────────────────────────────────────────────────────
  if (pathname === '/proxy/fetch') {
    const target = parsed.query.url;
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing ?url= parameter');
      return;
    }
    try {
      const upstream = await fetchUpstream(target);
      const forwardHeaders = { 'Access-Control-Allow-Origin': '*' };
      const skip = new Set(['transfer-encoding', 'connection', 'keep-alive', 'upgrade']);
      for (const [k, v] of Object.entries(upstream.headers)) {
        if (!skip.has(k)) forwardHeaders[k] = v;
      }
      res.writeHead(upstream.status, forwardHeaders);
      res.end(upstream.body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${e.message}`);
    }
    return;
  }

  // ── Static files ──────────────────────────────────────────────────────────
  const rel      = pathname === '/' ? 'rda-net-kit.html' : pathname.slice(1);
  const filePath = path.join(ROOT, rel);

  // Prevent path traversal
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  let   body = fs.readFileSync(filePath);

  // Inject LOCAL_PROXY so components auto-use the local proxy
  if (ext === '.html') {
    body = Buffer.from(
      body.toString('utf8').replace(
        '</head>',
        `  <script>window.LOCAL_PROXY = '/proxy/fetch?url=';</script>\n  </head>`
      )
    );
  }

  res.writeHead(200, { 'Content-Type': mime });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`RDA Net Kit — http://localhost:${PORT}`);
  console.log(`CORS proxy     — http://localhost:${PORT}/proxy/fetch?url=<encoded>`);
});
