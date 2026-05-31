import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const stackUrl = process.env.K6_STACK_URL || process.env.GRAFANA_STACK_URL || 'https://orenlion.grafana.net';
const stackId = process.env.K6_STACK_ID || process.env.GRAFANA_STACK_ID || '1665320';
const token = process.env.K6_CLOUD_TOKEN;
const reportsDir = path.resolve('reports/load-tests');
const top = Number(process.env.K6_RUNS_TOP || 20);
const loadTests = [
  { id: 1228494, name: 'API flow load test' },
  { id: 1228490, name: '20-user regional load test' },
  { id: 1228496, name: 'Traffic spike benchmark' },
  { id: 1233226, name: 'Browser action synthetic check' }
];

if (!token) {
  console.error('K6_CLOUD_TOKEN is required. Source .env or export it before running this script.');
  process.exit(1);
}

function secondsBetween(start, end) {
  if (!start || !end) return null;
  return Math.round((new Date(end) - new Date(start)) / 1000);
}

function maxProtocolVus(options) {
  const scenarios = Object.values(options?.scenarios || {});
  const scenarioMax = scenarios.map(scenario => {
    if (Number.isFinite(scenario.vus)) return scenario.vus;
    if (Number.isFinite(scenario.target)) return scenario.target;
    if (Array.isArray(scenario.stages)) {
      return Math.max(...scenario.stages.map(stage => Number(stage.target) || 0), 0);
    }
    return 0;
  });
  return Math.max(...scenarioMax, 0);
}

function maxBrowserVus(options) {
  const scenarios = Object.values(options?.scenarios || {});
  return scenarios
    .filter(scenario => scenario.options?.browser?.type)
    .reduce((total, scenario) => total + (Number(scenario.vus) || 0), 0);
}

function normalizeRun(run) {
  const durationSeconds = run.execution_duration ?? run.durationSeconds ?? secondsBetween(run.created, run.ended);
  return {
    id: run.id,
    runId: run.id,
    test_id: run.test_id,
    project_id: run.project_id,
    created: run.created,
    ended: run.ended,
    durationSeconds,
    status: run.status,
    result: run.result,
    cost: run.cost,
    max_vus: maxProtocolVus(run.options),
    max_browser_vus: maxBrowserVus(run.options),
    url: `https://orenlion.grafana.net/a/k6-app/runs/${run.id}`
  };
}

async function api(pathname) {
  const response = await fetch(`https://api.k6.io${pathname}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Stack-Id': String(stackId),
      Accept: 'application/json'
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`k6 API ${response.status} for ${pathname}: ${text}`);
  }
  return JSON.parse(text);
}

const pulledAt = new Date().toISOString();
const authResponse = await fetch('https://api.k6.io/cloud/v6/auth', {
  headers: {
    Authorization: `Bearer ${token}`,
    'X-Stack-Url': stackUrl,
    Accept: 'application/json'
  }
});
const auth = await authResponse.json();
if (!authResponse.ok) {
  throw new Error(`k6 auth failed: ${JSON.stringify(auth)}`);
}

const withRuns = [];
for (const test of loadTests) {
  try {
    const params = new URLSearchParams({
      $top: String(top),
      $orderby: 'created desc'
    });
    const payload = await api(`/cloud/v6/load_tests/${test.id}/test_runs?${params}`);
    const runs = (payload.value || []).map(normalizeRun);
    const latest = runs[0] || null;
    withRuns.push({
      ...test,
      latest,
      recentRuns: runs,
      runs
    });
  } catch (error) {
    withRuns.push({
      ...test,
      latest: null,
      recentRuns: [],
      runs: [],
      error: error.message
    });
  }
}

mkdirSync(reportsDir, { recursive: true });
const stamp = pulledAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const summaryFile = path.join(reportsDir, `k6-summary-${stamp}.json`);
const runsFile = path.join(reportsDir, `k6-runs-${stamp}.json`);

writeFileSync(summaryFile, `${JSON.stringify({
  pulledAt,
  stackId: Number(stackId),
  auth,
  source: 'k6-cloud-v6-direct-api',
  loadTests: withRuns.map(({ runs, ...test }) => test)
}, null, 2)}\n`);

writeFileSync(runsFile, `${JSON.stringify({
  pulledAt,
  stackId: Number(stackId),
  auth,
  source: 'k6-cloud-v6-direct-api',
  loadTests: withRuns.map(({ latest, recentRuns, ...test }) => test)
}, null, 2)}\n`);

console.log(summaryFile);
console.log(runsFile);
for (const test of withRuns) {
  const latest = test.latest;
  const result = latest ? `${latest.result || 'unknown'} run ${latest.id}` : 'no runs';
  console.log(`${test.name}: ${result}`);
}
