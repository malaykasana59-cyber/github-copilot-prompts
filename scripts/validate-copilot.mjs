import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(decodeURIComponent(new URL('../..', import.meta.url).pathname));
const activeRoots = [
  path.join(root, '.github', 'agents'),
  path.join(root, '.github', 'instructions'),
  path.join(root, '.github', 'prompts'),
  path.join(root, '.github', 'skills'),
];
const legacyMarker = ['e', 'c', 'c'].join('');
const runtimeTokens = /CLAUDE_PLUGIN_ROOT|~\/\.claude|\.claude\/|\$ARGUMENTS|allowed-tools:|ccg-workflow/i;
const files = [];
const errors = [];
const names = new Map();

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push(file);
  }
}

for (const directory of activeRoots) walk(directory);

for (const file of files) {
  const isCustomization = file.endsWith('.agent.md') || file.endsWith('.instructions.md') || file.endsWith('.prompt.md') || path.basename(file) === 'SKILL.md';
  if (!isCustomization) continue;
  const kind = file.endsWith('.agent.md') ? 'agent' : file.endsWith('.instructions.md') ? 'instruction' : file.endsWith('.prompt.md') ? 'prompt' : 'skill';
  const source = fs.readFileSync(file, 'utf8');
  const end = source.indexOf('\n---', 4);
  if (!source.startsWith('---\n') || end < 0) {
    errors.push(`${path.relative(root, file)}: malformed frontmatter`);
    continue;
  }
  const header = source.slice(4, end);
  const nameMatch = header.match(/^name:\s*["']?([^"'\n]+)["']?$/m);
  if (!nameMatch || !/^description:\s*/m.test(header)) errors.push(`${path.relative(root, file)}: missing name or description`);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    const key = `${kind}:${name}`;
    if (names.has(key)) errors.push(`${path.relative(root, file)}: duplicate ${kind} name with ${path.relative(root, names.get(key))}`);
    else names.set(key, file);
    if (path.basename(file) === 'SKILL.md' && path.basename(path.dirname(file)) !== name) errors.push(`${path.relative(root, file)}: skill name does not match directory`);
  }
  if (runtimeTokens.test(source) || new RegExp(legacyMarker, 'i').test(source)) errors.push(`${path.relative(root, file)}: legacy runtime marker remains in active content`);
}

console.log(JSON.stringify({ files: files.length, customizationFiles: names.size, errors }, null, 2));
if (errors.length) process.exitCode = 1;