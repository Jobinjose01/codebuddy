// build.js
const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: ['./src/extension.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/extension.js',
  external: ['vscode'], // Let VS Code provide its own API
  sourcemap: true,
  target: ['node18'],
}).catch(() => process.exit(1));
