#!/usr/bin/env node
// Single source of truth for the scripted storefront check is
// ensemble-retail-scripted-check.js. This script regenerates the inline
// `script:` block of check-scripted-storefront-api.yaml from that file so the
// k6 source, the YAML manifest, and the Terraform `file()` reference never drift.
//
// Usage:
//   node observability/synthetic-monitoring/sync-scripted-check.mjs          # write
//   node observability/synthetic-monitoring/sync-scripted-check.mjs --check  # verify only (CI)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(here, 'ensemble-retail-scripted-check.js');
const manifestPath = join(here, 'check-scripted-storefront-api.yaml');
const SCRIPT_INDENT = ' '.repeat(8);
const MARKER = '      script: |';

const script = readFileSync(scriptPath, 'utf8').replace(/\n+$/, '\n');
const manifest = readFileSync(manifestPath, 'utf8');

const markerIndex = manifest.indexOf(MARKER);
if (markerIndex === -1) {
  console.error(`Could not find "${MARKER}" in ${manifestPath}`);
  process.exit(1);
}

const header = manifest.slice(0, markerIndex + MARKER.length);
const indented = script
  .split('\n')
  .map((line) => (line.length === 0 ? '' : SCRIPT_INDENT + line))
  .join('\n');
const next = `${header}\n${indented.replace(/\n+$/, '')}\n`;

if (process.argv.includes('--check')) {
  if (next !== manifest) {
    console.error(
      'check-scripted-storefront-api.yaml is out of sync with ensemble-retail-scripted-check.js.\n' +
        'Run: node observability/synthetic-monitoring/sync-scripted-check.mjs'
    );
    process.exit(1);
  }
  console.log('Scripted check manifest is in sync.');
  process.exit(0);
}

writeFileSync(manifestPath, next);
console.log(`Regenerated ${manifestPath} from ${scriptPath}`);
