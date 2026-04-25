#!/usr/bin/env node
// build-dev.js — Produces a file://-compatible HTML by inlining all JSX components
// as a single <script type="text/babel"> block, avoiding Babel Standalone's XHR
// (which fails on the file:// protocol in modern browsers).
//
// Source HTML and component files remain unchanged and editable.
//
// Usage:
//   node scripts/build-dev.js                        # writes rda-net-kit-file.html
//   node scripts/build-dev.js -o path/to/out.html    # custom output path

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT     = path.join(__dirname, '..');
const SRC_HTML = path.join(ROOT, 'rda-net-kit.html');

const args   = process.argv.slice(2);
const oFlag  = args.indexOf('-o');
const OUT_HTML = oFlag !== -1 && args[oFlag + 1]
  ? path.resolve(args[oFlag + 1])
  : path.join(ROOT, 'rda-net-kit-file.html');

// ---------------------------------------------------------------------------
// Parse ordered JSX file list from <script type="text/babel" src="..."> tags
// ---------------------------------------------------------------------------

const html = fs.readFileSync(SRC_HTML, 'utf8');

const babelScriptRe = /<script\s+type="text\/babel"\s+src="([^"]+)"\s*><\/script>/g;
const jsxFiles = [];
let m;
while ((m = babelScriptRe.exec(html)) !== null) {
  jsxFiles.push(m[1]); // e.g. "components/shared.jsx"
}

if (jsxFiles.length === 0) {
  console.error('No <script type="text/babel" src="..."> tags found in source HTML.');
  process.exit(1);
}

console.log(`Found ${jsxFiles.length} JSX files to inline.`);

// ---------------------------------------------------------------------------
// Read and concatenate JSX files, stripping duplicate React destructuring
// ---------------------------------------------------------------------------

// shared.jsx (first file) owns the one canonical React destructuring line.
// All subsequent files have an identical line that would cause a const
// redeclaration error when everything runs in the same Babel scope.
const REACT_DESTRUCTURE_RE = /^const\s+\{[^}]+\}\s*=\s*React\s*;?\s*$/m;

const parts = jsxFiles.map((rel, i) => {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) {
    console.warn(`  WARNING: missing file ${rel} — skipping`);
    return `// [build-dev] MISSING: ${rel}`;
  }

  let src = fs.readFileSync(filePath, 'utf8');

  // Strip the React destructuring from every file except the first (shared.jsx)
  if (i > 0 && REACT_DESTRUCTURE_RE.test(src)) {
    src = src.replace(REACT_DESTRUCTURE_RE, '').replace(/^\n/, '');
  }

  return `// ─── ${rel} ${'─'.repeat(Math.max(0, 60 - rel.length))}\n${src}`;
});

const combined = parts.join('\n\n');

// ---------------------------------------------------------------------------
// Replace the 62-tag script block with one inline <script type="text/babel">
// ---------------------------------------------------------------------------

// Match from the shared-helpers comment through the app.jsx closing tag.
// No capture groups — replacement uses a function to avoid $ backreference
// interpretation when JSX source contains regex substitution strings like $1.
const BLOCK_RE = /[ \t]*<!-- Shared helpers[\s\S]*?<!-- App shell[^<]*<script[^>]*><\/script>/;

const inlineBlock =
  `    <!-- Components inlined by scripts/build-dev.js for file:// compatibility -->\n` +
  `    <script type="text/babel">\n` +
  combined.split('\n').map(l => `      ${l}`).join('\n') +
  `\n    </script>`;

if (!BLOCK_RE.test(html)) {
  console.error('Could not locate the babel script block in the source HTML.');
  console.error('The source HTML structure may have changed — update BLOCK_RE in build-dev.js.');
  process.exit(1);
}

// Use a replacement function so that $ characters in the JSX source are not
// treated as regex backreference patterns by String.replace.
const outHtml = html.replace(BLOCK_RE, () => inlineBlock);

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

fs.writeFileSync(OUT_HTML, outHtml, 'utf8');

const kb = (fs.statSync(OUT_HTML).size / 1024).toFixed(1);
console.log(`Written: ${path.relative(ROOT, OUT_HTML)} (${kb} KB)`);
console.log('Open with:  open ' + OUT_HTML + '  # or drag into browser');
