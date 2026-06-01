#!/usr/bin/env node
//
// Mavra MCP Skill installer.
//
// Copies the `mavra` skill into the directory Claude Code actually reads:
//   - project (default): <cwd>/.claude/skills/mavra
//   - global (--global):  ~/.claude/skills/mavra
//
// Cross-platform (macOS, Windows, Linux). No dependencies. Run via:
//   npx github:DinastIA-UK/mavra-mcp-skill            # into this project
//   npx github:DinastIA-UK/mavra-mcp-skill --global   # for every project
//
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'skills', 'mavra');

const args = process.argv.slice(2);
const isGlobal = args.includes('--global') || args.includes('-g');

if (!existsSync(join(src, 'SKILL.md'))) {
  console.error(`Could not find the skill at ${src}. Is the package intact?`);
  process.exit(1);
}

const baseDir = isGlobal
  ? join(homedir(), '.claude', 'skills')
  : join(process.cwd(), '.claude', 'skills');
const dest = join(baseDir, 'mavra');

mkdirSync(baseDir, { recursive: true });
cpSync(src, dest, { recursive: true });

const scope = isGlobal ? 'globally (all projects)' : 'into this project';
console.log(`✓ Installed the Mavra skill ${scope}:`);
console.log(`    ${dest}`);
console.log('');
console.log('Next steps:');
console.log('  1. Restart Claude Code so it picks up the new skill.');
console.log('  2. Run /mavra (or ask to "manage my Mavra account").');
console.log('  3. Connect the MCP server:');
console.log(`     node "${join(dest, 'scripts', 'connect.mjs')}"        # production`);
console.log(`     node "${join(dest, 'scripts', 'connect.mjs')}" --dev  # development`);
