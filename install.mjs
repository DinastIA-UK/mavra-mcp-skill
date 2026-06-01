#!/usr/bin/env node
//
// Mavra MCP Skill installer.
//
// Installs the `mavra` skill into the location the chosen AI client actually reads.
// Defaults to Claude Code. Installs to ONE client only — never multiple.
//
// Cross-platform (macOS, Windows, Linux). No dependencies. Run via:
//   npx github:DinastIA-UK/mavra-mcp-skill                 # Claude Code, this project
//   npx github:DinastIA-UK/mavra-mcp-skill --global        # Claude Code, all projects
//   npx github:DinastIA-UK/mavra-mcp-skill --cursor        # Cursor (project rule)
//   npx github:DinastIA-UK/mavra-mcp-skill --codex         # OpenAI Codex CLI
//   npx github:DinastIA-UK/mavra-mcp-skill --windsurf      # Windsurf (project rule)
//   npx github:DinastIA-UK/mavra-mcp-skill --gemini        # Gemini CLI
//
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'skills', 'mavra');
const SKILL_NAME = 'mavra';

const args = process.argv.slice(2);
const isGlobal = args.includes('--global') || args.includes('-g');

const CLIENT_FLAGS = ['--cursor', '--codex', '--windsurf', '--gemini', '--claude'];
const client =
  (args.find((a) => CLIENT_FLAGS.includes(a)) || '--claude').replace('--', '');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Mavra MCP Skill installer

Usage: npx github:DinastIA-UK/mavra-mcp-skill [client] [--global]

Clients (pick one; default --claude):
  --claude     Claude Code        (.claude/skills/mavra)
  --cursor     Cursor             (.cursor/rules/mavra.mdc) — project only
  --codex      OpenAI Codex CLI   (.agents/skills/mavra)
  --windsurf   Windsurf           (.windsurf/rules/mavra.md) — project only
  --gemini     Gemini CLI         (.gemini/skills/mavra)

  --global     Install for all projects (user-level) where the client supports it.
`);
  process.exit(0);
}

if (!existsSync(join(src, 'SKILL.md'))) {
  console.error(`Could not find the skill at ${src}. Is the package intact?`);
  process.exit(1);
}

/** Read the SKILL.md body (everything after the closing frontmatter `---`). */
function readSkillBody() {
  const raw = readFileSync(join(src, 'SKILL.md'), 'utf8');
  const m = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return (m ? m[1] : raw).trim();
}

const DESCRIPTION =
  'Use when managing a Mavra account through an AI client — agents, tools, ' +
  'kanbans, CRM records, channels, webhooks, contacts, sessions, or messages ' +
  'via the Mavra MCP server.';

const projectRoot = process.cwd();
const userRoot = homedir();

/** Copy the whole skill folder (SKILL.md + scripts/ + references/) verbatim. */
function installSkillFolder(baseDirParts) {
  const baseDir = join(...baseDirParts);
  const dest = join(baseDir, SKILL_NAME);
  mkdirSync(baseDir, { recursive: true });
  cpSync(src, dest, { recursive: true });
  return dest;
}

/** Write a single transformed rule file with the given frontmatter. */
function installRuleFile(dirParts, fileName, frontmatter) {
  const dir = join(...dirParts);
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, fileName);
  writeFileSync(dest, `${frontmatter}\n${readSkillBody()}\n`, 'utf8');
  return dest;
}

let dest;
let note = '';

switch (client) {
  case 'claude':
    dest = installSkillFolder(
      isGlobal ? [userRoot, '.claude', 'skills'] : [projectRoot, '.claude', 'skills']
    );
    break;

  case 'codex':
    // Native SKILL.md support via .agents/skills (project) or ~/.agents/skills (user).
    dest = installSkillFolder(
      isGlobal ? [userRoot, '.agents', 'skills'] : [projectRoot, '.agents', 'skills']
    );
    break;

  case 'gemini':
    // Native SKILL.md support via .gemini/skills (project) or ~/.gemini/skills (user).
    dest = installSkillFolder(
      isGlobal ? [userRoot, '.gemini', 'skills'] : [projectRoot, '.gemini', 'skills']
    );
    break;

  case 'cursor': {
    // Cursor uses .cursor/rules/*.mdc — project only (user rules are UI-only).
    if (isGlobal) {
      note =
        'Cursor has no file-based global rules (User Rules are set in the Cursor ' +
        'Settings UI). Installed as a project rule instead.';
    }
    const frontmatter = `---\ndescription: ${DESCRIPTION}\nglobs:\nalwaysApply: true\n---`;
    dest = installRuleFile([projectRoot, '.cursor', 'rules'], `${SKILL_NAME}.mdc`, frontmatter);
    break;
  }

  case 'windsurf': {
    // Windsurf uses .windsurf/rules/*.md — project only (global is a single
    // aggregate file we won't blindly append to).
    if (isGlobal) {
      note =
        'Windsurf global rules live in a single aggregate file ' +
        '(~/.codeium/windsurf/memories/global_rules.md). To avoid clobbering it, ' +
        'this installer writes a project rule instead — paste the content there ' +
        'manually if you want it global.';
    }
    const frontmatter = `---\ntrigger: always_on\n---`;
    dest = installRuleFile([projectRoot, '.windsurf', 'rules'], `${SKILL_NAME}.md`, frontmatter);
    break;
  }

  default:
    console.error(`Unknown client: --${client}`);
    process.exit(2);
}

const scope = isGlobal && client !== 'cursor' && client !== 'windsurf'
  ? 'globally (all projects)'
  : 'into this project';

console.log(`✓ Installed the Mavra skill for ${client} ${scope}:`);
console.log(`    ${dest}`);
if (note) {
  console.log('');
  console.log(`Note: ${note}`);
}
console.log('');
console.log('Next steps:');
console.log(`  1. Restart ${clientLabel(client)} so it picks up the new ${ruleWord(client)}.`);
console.log('  2. Ask it to "manage my Mavra account" (or run /mavra in Claude Code).');
console.log('  3. Connect the MCP server:');
// For skill-folder installs, `dest` IS the skill dir. For rule-file installs,
// the connect script stays in the package source.
const connect = client === 'cursor' || client === 'windsurf'
  ? join(src, 'scripts', 'connect.mjs')
  : join(dest, 'scripts', 'connect.mjs');
console.log(`     node "${connect}"        # production`);
console.log(`     node "${connect}" --dev  # development`);

function clientLabel(c) {
  return {
    claude: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex',
    windsurf: 'Windsurf',
    gemini: 'Gemini CLI',
  }[c];
}
function ruleWord(c) {
  return c === 'cursor' || c === 'windsurf' ? 'rule' : 'skill';
}
