/**
 * testSubagentesRuntimeSpec023.js
 *
 * Suite Automatizada de Verificación para Spec 023:
 * Adopción de Arquitectura de Orquestación Multiagente SDD, Catálogo de Skills,
 * Compuertas Fail-Fast y Homologación de Plantilla Universal (`samples/`).
 */

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../../');
const WORKSPACE_AGENTS_DIR = path.join(ROOT_DIR, '.agents', 'agents');
const WORKSPACE_SKILLS_DIR = path.join(ROOT_DIR, '.agents', 'skills');
const SAMPLES_DIR = path.resolve(ROOT_DIR, '..', 'samples');
const SAMPLES_AGENTS_DIR = path.join(SAMPLES_DIR, '.agents', 'agents');
const SAMPLES_SKILLS_DIR = path.join(SAMPLES_DIR, '.agents', 'skills');

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const yamlText = match[1];
  const result = { tools: [], skills: [] };
  let currentKey = null;
  let inList = null;

  for (const rawLine of yamlText.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('  - ')) {
      const item = line.replace(/^\s*-\s*/, '').trim();
      if (inList === 'tools') result.tools.push(item);
      else if (inList === 'skills') result.skills.push(item);
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !line.startsWith(' ')) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      if (key === 'tools' || key === 'skills') {
        inList = key;
        currentKey = key;
        continue;
      } else {
        inList = null;
      }

      currentKey = key;
      if (val === '>-' || val === '>' || val === '|') {
        val = '';
      }
      result[key] = val;
    } else if (currentKey && line.startsWith('  ') && !line.startsWith('  - ')) {
      const continuation = line.trim();
      result[currentKey] = result[currentKey] ? result[currentKey] + ' ' + continuation : continuation;
    }
  }
  return result;
}

function walkAllFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAllFiles(full, acc);
    } else if (entry.isFile()) {
      acc.push(full);
    }
  }
  return acc;
}

test('Spec 023 - CA-01 (RF-1, RF-2, RF-3): Regla orchestrator.md, 4 subagentes en .agents/agents/ y spec-generator como Skill pura', () => {
  const orchestratorPath = path.join(ROOT_DIR, '.agents', 'rules', 'orchestrator.md');
  assert.ok(fs.existsSync(orchestratorPath), 'Debe existir .agents/rules/orchestrator.md');

  const expectedAgents = ['builder-frontend', 'builder-backend', 'auditor-calidad', 'devops'];
  assert.ok(fs.existsSync(WORKSPACE_AGENTS_DIR), 'Debe existir .agents/agents/');

  for (const agentName of expectedAgents) {
    const agentFilePath = path.join(WORKSPACE_AGENTS_DIR, agentName, 'agent.md');
    assert.ok(fs.existsSync(agentFilePath), `Debe existir ${agentName}/agent.md`);
  }

  assert.ok(!fs.existsSync(path.join(WORKSPACE_AGENTS_DIR, 'spec-generator')), 'spec-generator no debe ser subagente en .agents/agents/');
  assert.ok(fs.existsSync(path.join(WORKSPACE_SKILLS_DIR, 'spec-generator', 'SKILL.md')), 'spec-generator debe residir como Skill en .agents/skills/spec-generator/SKILL.md');
  assert.ok(fs.existsSync(path.join(WORKSPACE_SKILLS_DIR, 'spec-generator', 'spec-template.md')), 'spec-generator debe contener spec-template.md');
});

test('Spec 023 - CA-02 (RF-3): Frontmatter YAML canónico en los 4 subagentes de Web PsicoLau', () => {
  const expectedAgents = ['builder-frontend', 'builder-backend', 'auditor-calidad', 'devops'];

  for (const agentName of expectedAgents) {
    const agentFilePath = path.join(WORKSPACE_AGENTS_DIR, agentName, 'agent.md');
    const content = fs.readFileSync(agentFilePath, 'utf-8');
    const fm = parseYamlFrontmatter(content);

    assert.ok(fm, `${agentName}/agent.md debe contener frontmatter YAML válido`);
    assert.strictEqual(fm.name, agentName, `El nombre en frontmatter debe ser ${agentName}`);
    assert.ok(fm.description && fm.description.length >= 15, `Descripción informativa en ${agentName}`);
    assert.strictEqual(String(fm.subagent), 'true', `${agentName} debe tener subagent: true`);
    assert.strictEqual(String(fm.mainAgent), 'true', `${agentName} debe tener mainAgent: true`);
    assert.strictEqual(fm.model, 'flash', `${agentName} debe tener model: flash`);
    assert.ok(Array.isArray(fm.tools) && fm.tools.length > 0, `${agentName} debe declarar tools`);
    assert.ok(fm.skills.some(s => s.includes(agentName)), `${agentName} debe vincular su skill correspondiente`);
    assert.ok(content.includes('# Rol'), `${agentName} debe tener instrucciones de rol en Markdown`);
  }
});

test('Spec 023 - CA-03 (RF-4): Candado estricto de solo lectura para auditor-calidad', () => {
  const agentFilePath = path.join(WORKSPACE_AGENTS_DIR, 'auditor-calidad', 'agent.md');
  const content = fs.readFileSync(agentFilePath, 'utf-8');
  const fm = parseYamlFrontmatter(content);

  const forbiddenWritingTools = ['replace_file_content', 'multi_replace_file_content', 'write_to_file'];
  for (const forbiddenTool of forbiddenWritingTools) {
    assert.ok(!fm.tools.includes(forbiddenTool), `auditor-calidad NO debe tener '${forbiddenTool}'`);
  }

  assert.ok(fm.tools.includes('view_file'), 'auditor-calidad debe incluir view_file');
  assert.ok(fm.tools.includes('grep_search'), 'auditor-calidad debe incluir grep_search');
  assert.ok(fm.tools.includes('run_command'), 'auditor-calidad debe incluir run_command');
});

test('Spec 023 - CA-04 (RF-5, RF-6, RF-7): Catálogo de 14 skills en Web PsicoLau y fidelidad de marca (#EC5E86 / #1E94A8)', () => {
  const expectedSkills = [
    'auditor-calidad',
    'builder-backend',
    'builder-frontend',
    'code-audit',
    'cognitive-walkthrough',
    'devops',
    'don-norman-principles-audit',
    'sdd-compliance',
    'spec-generator',
    'supabase',
    'supabase-postgres-best-practices',
    'ui-design-review',
    'ux-audit-rethink',
    'wcag-accessibility-audit'
  ];

  for (const skillName of expectedSkills) {
    const skillPath = path.join(WORKSPACE_SKILLS_DIR, skillName, 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), `Debe existir la skill ${skillName}/SKILL.md en Web PsicoLau`);
  }

  const bfAgent = fs.readFileSync(path.join(WORKSPACE_AGENTS_DIR, 'builder-frontend', 'agent.md'), 'utf-8');
  const bfSkill = fs.readFileSync(path.join(WORKSPACE_SKILLS_DIR, 'builder-frontend', 'SKILL.md'), 'utf-8');
  assert.ok(bfAgent.includes('#EC5E86') && bfAgent.includes('#1E94A8'), 'builder-frontend/agent.md debe declarar la paleta oficial de Laura');
  assert.ok(bfSkill.includes('#EC5E86') && bfSkill.includes('#1E94A8'), 'builder-frontend/SKILL.md debe declarar la paleta oficial de Laura');
  assert.ok(!/sofia/i.test(bfAgent) && !/sofia/i.test(bfSkill), 'Cero referencias a Sofía Ramos en builder-frontend de PsicoLau');
});

test('Spec 023 - CA-05 (RF-8, RF-9): Compuerta fail-fast hooks.json, quickCheck.js y validadores ESM', () => {
  const hooksPath = path.join(ROOT_DIR, '.agents', 'hooks.json');
  assert.ok(fs.existsSync(hooksPath), 'Debe existir .agents/hooks.json');
  const hooksConfig = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
  assert.ok(hooksConfig['quick-syntax-check'], 'hooks.json debe declarar quick-syntax-check');

  const hookOut = execSync('node scripts/hooks/quickCheck.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
  assert.strictEqual(hookOut.trim(), '{}', 'quickCheck.js debe emitir {} por stdout');

  const syntaxOut = execSync('node scripts/testFrontendSyntax.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
  assert.ok(syntaxOut.includes('0 errores de sintaxis'), 'testFrontendSyntax.js debe aprobar con 0 errores');

  const importsOut = execSync('node scripts/testModuleImports.js', { cwd: ROOT_DIR, encoding: 'utf-8' });
  assert.ok(importsOut.includes('0 enlaces rotos'), 'testModuleImports.js debe aprobar con 0 enlaces rotos');
});

test('Spec 023 - CA-06 (RF-10, RF-11): Gobernanza en AGENTS.md, GEMINI.md y rotación de memoria en overview/archive/', () => {
  const agentsMd = fs.readFileSync(path.join(ROOT_DIR, 'AGENTS.md'), 'utf-8');
  const geminiMd = fs.readFileSync(path.join(ROOT_DIR, 'GEMINI.md'), 'utf-8');

  assert.ok(agentsMd.includes('2.1. Arquitectura de Orquestación Multiagente'), 'AGENTS.md debe incluir §2.1');
  assert.ok(agentsMd.includes('8. Eficiencia de Contexto y Gestión de Tokens'), 'AGENTS.md debe incluir §8');
  assert.ok(geminiMd.includes('Orquestación Multiagente Especializada'), 'GEMINI.md debe incluir reglas de Orquestación Multiagente');

  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'overview', 'archive', 'session-history.md')), 'Debe existir overview/archive/session-history.md');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'overview', 'archive', 'tasks-history.md')), 'Debe existir overview/archive/tasks-history.md');

  const sessionLines = fs.readFileSync(path.join(ROOT_DIR, 'overview', 'session.md'), 'utf-8').split(/\r?\n/).length;
  const tasksLines = fs.readFileSync(path.join(ROOT_DIR, 'overview', 'tasks.md'), 'utf-8').split(/\r?\n/).length;
  assert.ok(sessionLines < 120, `overview/session.md debe mantenerse compacto (< 120 líneas, actual: ${sessionLines})`);
  assert.ok(tasksLines < 120, `overview/tasks.md debe mantenerse compacto (< 120 líneas, actual: ${tasksLines})`);
});

test('Spec 023 - CA-07 (RF-12, RF-13, RF-14): Homologación de plantilla universal samples/ y pureza anti-fugas', () => {
  assert.ok(fs.existsSync(SAMPLES_DIR), 'Debe existir el directorio /home/cris/Documentos/Proyectos/samples');
  assert.ok(fs.existsSync(SAMPLES_AGENTS_DIR), 'Debe existir samples/.agents/agents/');

  const expectedSampleAgents = ['builder-frontend', 'builder-backend', 'auditor-calidad', 'devops'];
  for (const agentName of expectedSampleAgents) {
    assert.ok(
      fs.existsSync(path.join(SAMPLES_AGENTS_DIR, agentName, 'agent.md')),
      `Debe existir ${agentName}/agent.md en samples/.agents/agents/`
    );
  }

  const expectedSampleSkills = [
    'auditor-calidad',
    'builder-backend',
    'builder-frontend',
    'code-audit',
    'cognitive-walkthrough',
    'devops',
    'don-norman-principles-audit',
    'sdd-compliance',
    'spec-generator',
    'supabase',
    'supabase-postgres-best-practices',
    'ui-design-review',
    'ux-audit-rethink',
    'wcag-accessibility-audit'
  ];

  for (const skillName of expectedSampleSkills) {
    assert.ok(
      fs.existsSync(path.join(SAMPLES_SKILLS_DIR, skillName, 'SKILL.md')),
      `Debe existir la skill ${skillName}/SKILL.md en samples/.agents/skills/`
    );
  }

  assert.ok(fs.existsSync(path.join(SAMPLES_DIR, 'overview', 'archive', 'session-history.md')), 'Debe existir samples/overview/archive/session-history.md');
  assert.ok(fs.existsSync(path.join(SAMPLES_DIR, 'overview', 'archive', 'tasks-history.md')), 'Debe existir samples/overview/archive/tasks-history.md');

  const samplesReadme = fs.readFileSync(path.join(SAMPLES_DIR, 'README.md'), 'utf-8');
  const samplesAgents = fs.readFileSync(path.join(SAMPLES_DIR, 'AGENTS.md'), 'utf-8');
  assert.ok(samplesReadme.includes('agents/'), 'samples/README.md debe documentar .agents/agents/');
  assert.ok(samplesAgents.includes('.agents/agents/'), 'samples/AGENTS.md debe documentar .agents/agents/');

  const forbiddenPatterns = [
    /\bsofia\b/i,
    /\blaura\b/i,
    /\bpsicolau\b/i,
    /\bpsicotemplate\b/i,
    /\bpsicoclinica\b/i,
    /\bfrida\b/i,
    /\belena\b/i,
    /\bcesar\b/i,
    /\bviviana\b/i,
    /\bhetzner\b/i
  ];

  const allSampleFiles = walkAllFiles(SAMPLES_DIR);
  for (const filePath of allSampleFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of forbiddenPatterns) {
      assert.ok(
        !pattern.test(content),
        `El archivo samples/${path.relative(SAMPLES_DIR, filePath)} no debe contener coincidencias con ${pattern}`
      );
    }
  }
});
