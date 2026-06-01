#!/usr/bin/env node
//
// Registers the Mavra MCP server in the local AI client.
// Cross-platform (macOS, Windows, Linux) — runs on Node, no shell required.
//
// Usage:
//   node connect.mjs            # production
//   node connect.mjs --dev      # development
//   node connect.mjs --print    # print the URL + command without executing
//
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

let url = 'https://api.maiacompany.io/mcp';
let envName = 'production';
let printOnly = false;

for (const arg of args) {
  if (arg === '--dev') {
    url = 'https://dev.api.maiacompany.io/mcp';
    envName = 'development';
  } else if (arg === '--print') {
    printOnly = true;
  } else {
    console.error(`Unknown option: ${arg}`);
    console.error('Usage: node connect.mjs [--dev] [--print]');
    process.exit(2);
  }
}

const cmdArgs = ['mcp', 'add', '--transport', 'http', 'mavra', url];
const cmdStr = `claude ${cmdArgs.join(' ')}`;

console.log(`Mavra MCP server (${envName}): ${url}`);

if (printOnly) {
  console.log(`Command: ${cmdStr}`);
  process.exit(0);
}

// `shell: true` lets Windows resolve `claude.cmd`/`claude.ps1` and POSIX resolve
// `claude` on PATH without us hard-coding an extension.
const result = spawnSync('claude', cmdArgs, { stdio: 'inherit', shell: true });

if (result.error && result.error.code === 'ENOENT') {
  console.log("The 'claude' CLI was not found. Add the server manually in your client:");
  console.log(`  - Claude Desktop / Cursor: add a remote (HTTP) MCP server with URL ${url}`);
  console.log(`  - Or install Claude Code and run: ${cmdStr}`);
  process.exit(0);
}

if (result.status === 0) {
  console.log("Connected. Next: ask your AI to log in to Mavra (the 'login' tool).");
} else {
  console.error("Could not add the server. If 'mavra' already exists, remove it first:");
  console.error('  claude mcp remove mavra');
  console.error('then re-run this script.');
  process.exit(1);
}
