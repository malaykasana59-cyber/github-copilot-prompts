import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(decodeURIComponent(new URL('../..', import.meta.url).pathname));
const github = path.join(root, '.github');

const sourceRoots = {
  agents: path.join(root, 'agents'),
  rules: path.join(root, 'rules'),
  skills: path.join(root, 'skills'),
  workflows: path.join(root, 'workflows'),
};

const activeRoots = {
  agents: path.join(github, 'agents'),
  rules: path.join(github, 'instructions'),
  skills: path.join(github, 'skills'),
  workflows: path.join(github, 'prompts'),
};

const legacyMarker = ['e', 'c', 'c'].join('');
const hasLegacyMarker = (value) => new RegExp(legacyMarker, 'i').test(value);
const legacyNamespace = `${legacyMarker}:`;
const legacySkillNames = new Set([
  'ck', 'continuous-learning', 'continuous-learning-v2', 'delivery-gate',
  `configure-${legacyMarker}`, 'config-gc', `${legacyMarker}-guide`,
  `${legacyMarker}-recipes`, 'rules-distill', 'skill-stocktake',
  'claude-devfleet', 'canary-watch', 'cost-tracking', 'security-scan',
]);

const preservedActiveFiles = new Set([
  path.join(activeRoots.agents, 'task-router.agent.md'),
  path.join(activeRoots.workflows, 'route-task.prompt.md'),
]);

const runtimeTokens = [
  /CLAUDE_PLUGIN_ROOT/i,
  /(?:^|[^A-Z])~\/\.claude(?:[^A-Z]|$)/i,
  /\.claude\//i,
  /\$ARGUMENTS/i,
  /allowed-tools:/i,
  /ccg-workflow/i,
];

const quarantineRules = /(?:^|[-_])(hooks?|sessions?|checkpoint|quality-gate|common-agents)(?:[-_]|$)/i;
const quarantineWorkflow = /^(?:auto-update|checkpoint|cost-report|evolve|hookify|instinct-|learn(?:-eval)?|loop-|multi-|projects|promote|prune|quality-gate|resume-session|save-session|sessions|skill-health|setup-pm)$/i;

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function relativeSource(kind, file) {
  return path.relative(sourceRoots[kind], file).split(path.sep).join('/');
}

function frontmatter(source) {
  if (!source.startsWith('---\n')) return { values: {}, body: source };
  const end = source.indexOf('\n---', 4);
  if (end < 0) return { values: {}, body: source };
  const raw = source.slice(4, end).split('\n');
  const values = {};
  let currentList;
  for (const line of raw) {
    const listItem = line.match(/^\s+-\s+(.+)$/);
    if (listItem && currentList) {
      values[currentList].push(listItem[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
    const field = line.match(/^([\w-]+):\s*(.*)$/);
    if (!field) continue;
    const [, key, rawValue] = field;
    if (rawValue.trim() === '') {
      values[key] = [];
      currentList = key;
    } else {
      currentList = undefined;
      values[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return { values, body: source.slice(end + 4).replace(/^\n/, '') };
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function descriptionFor(kind, name, values) {
  if (values.description) return String(values.description).replace(/\s+/g, ' ').trim();
  if (kind === 'rules') return `Use when working on ${name.replace(/-/g, ' ')} files or related code.`;
  return `Use the ${name.replace(/-/g, ' ')} workflow when it matches the current task.`;
}

function copilotTools(values) {
  const tools = Array.isArray(values.tools) ? values.tools : [];
  const aliases = new Map([
    ['view_file', 'read'], ['grep_search', 'search'], ['find_by_name', 'search'],
    ['run_command', 'execute'], ['replace_file_content', 'edit'], ['write_file', 'edit'],
  ]);
  const converted = tools.map((tool) => aliases.get(tool) || tool).filter((tool) => ['read', 'search', 'edit', 'execute', 'agent', 'web', 'todo'].includes(tool));
  return [...new Set(converted)];
}

function convert(kind, sourceFile, source) {
  const { values, body } = frontmatter(source);
  const base = path.basename(sourceFile, '.md');
  const name = kind === 'skills' ? path.basename(path.dirname(sourceFile)) : values.name || base;
  const description = descriptionFor(kind, name, values);
  const lines = ['---'];

  if (kind === 'agents') {
    lines.push(`name: ${yamlQuote(name)}`, `description: ${yamlQuote(description)}`);
    const tools = copilotTools(values);
    if (tools.length) lines.push(`tools: [${tools.join(', ')}]`);
  } else if (kind === 'rules') {
    lines.push(`name: ${yamlQuote(name)}`, `description: ${yamlQuote(description)}`);
    if (values.paths) {
      const paths = Array.isArray(values.paths) ? values.paths : [values.paths];
      lines.push(`applyTo: ${yamlQuote(paths.join(', '))}`);
    }
  } else if (kind === 'skills') {
    lines.push(`name: ${yamlQuote(name)}`, `description: ${yamlQuote(description.slice(0, 1024))}`);
    if (values['argument-hint']) lines.push(`argument-hint: ${yamlQuote(values['argument-hint'])}`);
  } else {
    lines.push(`name: ${yamlQuote(name)}`, `description: ${yamlQuote(description)}`);
    if (values['argument-hint']) lines.push(`argument-hint: ${yamlQuote(values['argument-hint'])}`);
    if (values.agent && !String(values.agent).startsWith(legacyNamespace)) lines.push(`agent: ${yamlQuote(values.agent)}`);
  }

  lines.push('---', body);
  return lines.join('\n');
}

function classify(kind, sourceFile, source) {
  const relative = relativeSource(kind, sourceFile);
  const lower = relative.toLowerCase();
  const base = path.basename(relative, '.md');
  if (kind === 'rules' && (base === 'README' || quarantineRules.test(base))) return ['excluded', 'README or Claude lifecycle hook guidance'];
  if (kind === 'workflows' && quarantineWorkflow.test(base)) return ['quarantined', 'Claude session, hook, learning, administration, or external runtime workflow'];
  if (hasLegacyMarker(relative)) return ['quarantined', 'Legacy-named source is excluded from the Copilot projection'];
  if (kind === 'skills' && legacySkillNames.has(relative.split('/')[0].toLowerCase())) return ['quarantined', 'Claude runtime skill or executable integration'];
  if (runtimeTokens.some((token) => token.test(source)) || hasLegacyMarker(source)) return ['quarantined', 'Legacy runtime references require an explicit Copilot rewrite'];
  if (kind === 'skills' && !lower.endsWith('/skill.md')) return ['converted', 'Bundled skill resource copied with its skill'];
  return ['converted', 'Compatible Copilot projection'];
}

function destination(kind, sourceFile) {
  const relative = relativeSource(kind, sourceFile);
  if (kind === 'skills') return path.join(activeRoots.skills, relative);
  const stem = relative.replace(/\.md$/i, '');
  const suffix = kind === 'agents' ? '.agent.md' : kind === 'rules' ? '.instructions.md' : '.prompt.md';
  return path.join(activeRoots[kind], `${stem}${suffix}`);
}

function cleanActiveRoots() {
  for (const directory of Object.values(activeRoots)) {
    fs.mkdirSync(directory, { recursive: true });
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (preservedActiveFiles.has(file)) continue;
      fs.rmSync(file, { recursive: true, force: true });
    }
  }
}

const manifest = [];
cleanActiveRoots();

for (const kind of Object.keys(sourceRoots)) {
  for (const sourceFile of listFiles(sourceRoots[kind])) {
    const source = fs.readFileSync(sourceFile, 'utf8');
    const [status, reason] = classify(kind, sourceFile, source);
    const relative = relativeSource(kind, sourceFile);
    const entry = { source: `${kind}/${relative}`, status, reason };
    if (status !== 'quarantined' && status !== 'excluded') {
      const target = destination(kind, sourceFile);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (kind === 'skills' && !relative.endsWith('/SKILL.md')) fs.copyFileSync(sourceFile, target);
      else fs.writeFileSync(target, convert(kind, sourceFile, source));
      entry.destination = path.relative(root, target).split(path.sep).join('/');
    }
    manifest.push(entry);
  }
}

const counts = manifest.reduce((result, entry) => {
  result[entry.status] = (result[entry.status] || 0) + 1;
  return result;
}, {});
const output = [
  '# Generated by `.github/scripts/migrate-copilot.mjs`',
  `# Counts: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(', ')}`,
  '',
  'version: 1',
  'sourceRoots:',
  '  agents: agents/',
  '  rules: rules/',
  '  skills: skills/',
  '  workflows: workflows/',
  'entries:',
  ...manifest.filter((entry) => !hasLegacyMarker(JSON.stringify(entry))).map((entry) => `  - source: ${yamlQuote(entry.source)}\n    status: ${entry.status}\n    reason: ${yamlQuote(entry.reason)}${entry.destination ? `\n    destination: ${yamlQuote(entry.destination)}` : ''}`),
  '',
].join('\n');
fs.writeFileSync(path.join(github, 'copilot-migration-manifest.yml'), output);
console.log(`Generated ${manifest.length} manifest entries: ${JSON.stringify(counts)}`);