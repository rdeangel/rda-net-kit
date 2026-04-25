#!/usr/bin/env node
// extract-components.js — Extract React components from the monolithic HTML into separate .jsx files
// Usage: node extract-components.js

const fs = require('fs');
const path = require('path');

const htmlFile = path.join(__dirname, 'ipv4-ipv6-tools.html');
const outDir = path.join(__dirname, 'components');

const html = fs.readFileSync(htmlFile, 'utf8');
const lines = html.split('\n');

// Component definitions: [startLine (1-based), componentName, extraGlobals]
// extraGlobals: array of top-level const/function declarations that belong WITH this component
const components = [
  // Shared helpers already extracted manually — skip lines 862-941
  { start: 943, name: 'SubnetCalc' },
  { start: 1033, name: 'RangeCIDR' },
  { start: 1134, name: 'SupernetCalc' },
  { start: 1198, name: 'IPv6Tools' },
  { start: 1260, name: 'IPClassifier' },
  { start: 1338, name: 'VLSMPlanner', includes: [1366] }, // PALETTE const
  { start: 1462, name: 'WildcardTool' },
  { start: 1586, name: 'IPConverter' },
  { start: 1683, name: 'SubnetMap', includes: [1707] }, // COLORS const
  { start: 1779, name: 'RemoteDiagnostics' },
  { start: 1856, name: 'DNSLookup' },
  { start: 1943, name: 'SSLInspector' },
  { start: 2125, name: 'HTTPHeaderAnalyzer' },
  { start: 2317, name: 'SelfSignedCertGen' },
  { start: 2580, name: 'CheatSheet' },
  { start: 2686, name: 'InterfaceConfigGen' },
  { start: 3001, name: 'ACLGenerator' },
  { start: 3221, name: 'GeoLookup' },
  { start: 3384, name: 'MACTools' },
  { start: 3478, name: 'IPv6SubnetCalc' },
  { start: 3567, name: 'OverlapDetector' },
  { start: 3656, name: 'SplitMerge' },
  { start: 3909, name: 'PortReference' },
  { start: 4024, name: 'ASNLookup' },
  { start: 4175, name: 'PingSweep' },
  { start: 4280, name: 'McastIpMacMap' },
  { start: 4569, name: 'McastAnalyzer' },
  { start: 4694, name: 'GlopCalc' },
  { start: 4828, name: 'McastReference' },
  { start: 5005, name: 'McastPlanner', includes: [5054] }, // PALETTE const
  { start: 5135, name: 'McastSolicited' },
  { start: 5218, name: 'McastCollision' },
  { start: 5391, name: 'McastBuilder' },
  { start: 5507, name: 'OSIModel' },
  { start: 5616, name: 'PacketHeaders' },
  { start: 5901, name: 'RoutingReference' },
  { start: 6083, name: 'VPNArchitect' },
  { start: 6226, name: 'QoSDSCPTool' },
  { start: 6496, name: 'WifiQRCode' },
  { start: 6614, name: 'WLANPlanner' },
  { start: 6770, name: 'IPv6Transition' },
  { start: 6921, name: 'BGPLookingGlass' },
  { start: 7065, name: 'LACPSimulator' },
  { start: 7274, name: 'WiresharkTools' },
  { start: 7971, name: 'IPFMRef' },
  { start: 8335, name: 'MPLSRef' },
  { start: 8518, name: 'VXLANRef' },
  { start: 8598, name: 'SwitchingRef' },
  { start: 9173, name: 'ArcadeHub', includes: [9176] }, // GAMES array
  { start: 9276, name: 'SubnetSprint' },
  { start: 9662, name: 'IPv6Gauntlet', includes: [9719] }, // ROUNDS const
  { start: 9952, name: 'NetworkArcade' },
  { start: 10255, name: 'BandwidthCalc' },
  { start: 10657, name: 'MTUCalc' },
  { start: 10788, name: 'DHCPPlanner' },
  { start: 11000, name: 'CLIReference', includes: [11006] }, // CLI data object
  { start: 11328, name: 'SysToolBuilder' },
  { start: 11853, name: 'CypherDeck', includes: [12023] }, // JwtTimeClaim sub-component
  { start: 12423, name: 'ShareModal' },
  { start: 12530, name: 'CommandPalette' },
];

// Determine end line for each component (start of next component, or end of babel block at 12872)
const allBoundaries = components.map(c => c.start).concat([12362, 12586, 12872]).sort((a, b) => a - b);

// For each component, find its end: the next boundary line that's strictly after its start
for (const comp of components) {
  const idx = allBoundaries.indexOf(comp.start);
  comp.end = allBoundaries[idx + 1] - 1;
}

// Extract each component
for (const comp of components) {
  const { start, end, name } = comp;
  // Lines are 1-based in our data, 0-based in the array
  const slice = lines.slice(start - 1, end);

  // Find the common leading whitespace (minimum indentation of non-empty lines)
  let minIndent = Infinity;
  for (const line of slice) {
    if (line.trim().length === 0) continue;
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent === Infinity) minIndent = 0;

  // De-indent
  const deindented = slice.map(line => {
    if (line.trim().length === 0) return line.trim();
    return line.substring(minIndent);
  });

  // Add React destructuring at top and window assignment at bottom
  const content = `const { useState, useEffect, useCallback, useRef, useMemo } = React;\n\n` +
    deindented.join('\n') +
    `\nwindow.${name} = ${name};\n`;

  const outPath = path.join(outDir, `${name}.jsx`);
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`Wrote ${outPath} (${slice.length} lines)`);
}

// Now extract app.jsx (TOOLS + TWEAK_DEFAULTS + App + ReactDOM.createRoot)
// TOOLS array: lines 12362-12421
// TWEAK_DEFAULTS: lines 12586-12589
// App: lines 12591-12869
// ReactDOM: line 12871

const toolsSlice = lines.slice(12361, 12421); // lines 12362-12421
const tweakSlice = lines.slice(12585, 12589); // lines 12586-12589
const appSlice = lines.slice(12590, 12871);   // lines 12591-12871

// De-indent all slices
function deIndent(slice) {
  let minIndent = Infinity;
  for (const line of slice) {
    if (line.trim().length === 0) continue;
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent === Infinity) minIndent = 0;
  return slice.map(line => {
    if (line.trim().length === 0) return line.trim();
    return line.substring(minIndent);
  });
}

// Get the ReactDOM line
const reactDOMLine = lines[12870]; // line 12871 (0-indexed 12870)

const appContent = `const { useState, useEffect, useCallback, useRef, useMemo } = React;\n\n` +
  deIndent(toolsSlice).join('\n') +
  '\n\n' +
  deIndent(tweakSlice).join('\n') +
  '\n\n' +
  deIndent(appSlice).join('\n') +
  '\n' + reactDOMLine.trim() +
  '\n';

fs.writeFileSync(path.join(outDir, 'app.jsx'), appContent, 'utf8');
console.log(`Wrote components/app.jsx`);
