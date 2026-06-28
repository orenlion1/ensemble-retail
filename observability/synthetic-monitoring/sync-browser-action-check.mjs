#!/usr/bin/env node
// The load-tested browser journey lives in load-tests/synthetic-browser-actions.js.
// This generator creates the standalone Synthetic Monitoring browser-check script
// and manifest from that source so Synthetic coverage stays aligned with k6 load
// test user-action coverage.
//
// Usage:
//   node observability/synthetic-monitoring/sync-browser-action-check.mjs
//   node observability/synthetic-monitoring/sync-browser-action-check.mjs --check

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const sourcePath = join(repoRoot, 'load-tests', 'synthetic-browser-actions.js');
const scriptPath = join(here, 'ensemble-grafana-browser-action-check.js');
const manifestPath = join(here, 'check-browser-user-actions.yaml');
const SCRIPT_INDENT = ' '.repeat(8);

function stripExportedFunction(source, functionName) {
  const start = source.indexOf(`export function ${functionName}`);
  if (start === -1) return source;

  const openBrace = source.indexOf('{', start);
  if (openBrace === -1) {
    throw new Error(`Could not find opening brace for ${functionName}`);
  }

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return `${source.slice(0, start).trimEnd()}\n${source.slice(index + 1).trimStart()}`;
      }
    }
  }

  throw new Error(`Could not find closing brace for ${functionName}`);
}

function buildSyntheticScript() {
  let script = readFileSync(sourcePath, 'utf8').replace(/\n+$/, '\n');
  script = script.replace("import { summaryOutput } from './summary.js';\n", '');
  script = script.replace(/\n  cloud: \{\n    name: 'ensemble-grafana-faro-user-actions-browser'\n  \},/, '');
  script = script.replace(/,\n  thresholds: \{\n    checks: \['rate==1\.0'\],\n    browser_web_vital_lcp: \['p\(95\)<4000'\],\n    browser_web_vital_cls: \['p\(95\)<0\.1'\]\n  \},/, '');
  script = script.replace(/\n  tags: \{/, ',\n  tags: {');
  script = stripExportedFunction(script, 'handleSummary');

  return `// Generated from ../../load-tests/synthetic-browser-actions.js.\n` +
    `// Regenerate with: node observability/synthetic-monitoring/sync-browser-action-check.mjs\n` +
    `${script.trim()}\n`;
}

function buildManifest(script) {
  const indented = script
    .split('\n')
    .map((line) => (line.length === 0 ? '' : SCRIPT_INDENT + line))
    .join('\n')
    .replace(/\n+$/, '');

  return `# The settings.browser.script block below is generated from
# load-tests/synthetic-browser-actions.js. Do not edit it by hand.
# Regenerate with: node observability/synthetic-monitoring/sync-browser-action-check.mjs
apiVersion: syntheticmonitoring.ext.grafana.app/v1alpha1
kind: Check
metadata:
  name: "ensemble-grafana-browser-user-actions"
spec:
  job: ensemble-grafana-browser-user-actions
  target: https://ensemble-retail.com
  frequency: 300000
  timeout: 180000
  enabled: false
  labels:
    - name: environment
      value: production
    - name: service
      value: storefront
    - name: check_type
      value: browser
    - name: coverage
      value: user-actions
  probes:
    - Oregon
    - Montreal
    - London
  alertSensitivity: none
  basicMetricsOnly: false
  settings:
    browser:
      script: |
${indented}
`;
}

const script = buildSyntheticScript();
const manifest = buildManifest(script);

if (process.argv.includes('--check')) {
  const currentScript = readFileSync(scriptPath, 'utf8');
  const currentManifest = readFileSync(manifestPath, 'utf8');
  const mismatches = [];
  if (currentScript !== script) mismatches.push(scriptPath);
  if (currentManifest !== manifest) mismatches.push(manifestPath);

  if (mismatches.length > 0) {
    console.error(
      'Synthetic browser action check artifacts are out of sync.\n' +
        `Out of sync:\n${mismatches.map((path) => `- ${path}`).join('\n')}\n` +
        'Run: node observability/synthetic-monitoring/sync-browser-action-check.mjs'
    );
    process.exit(1);
  }

  console.log('Synthetic browser action check artifacts are in sync.');
  process.exit(0);
}

writeFileSync(scriptPath, script);
writeFileSync(manifestPath, manifest);
console.log(`Regenerated ${scriptPath}`);
console.log(`Regenerated ${manifestPath}`);
