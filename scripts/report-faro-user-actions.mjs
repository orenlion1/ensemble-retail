import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const datasource = process.env.FARO_LOGS_DATASOURCE || 'grafanacloud-logs';
const since = process.env.FARO_ACTIONS_SINCE || '6h';
const outputDir = path.resolve('reports/frontend-user-actions');
const generatedAt = new Date().toISOString();
const stamp = generatedAt.replaceAll(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const query = `sum by (action_name, event_data_userActionImportance, event_data_userActionSeverity) (
  count_over_time({app_id="464", kind="event"} |= "event_name=faro.user.action" | logfmt | geo_country_iso=~"" or geo_country_iso=~".+" [${since}])
)`;

function csvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function latestValue(values = []) {
  const latest = values.at(-1);
  return latest ? Number(latest[1]) : 0;
}

mkdirSync(outputDir, { recursive: true });

const raw = execFileSync('gcx', [
  'logs',
  'query',
  '-d',
  datasource,
  query,
  '--since',
  since,
  '--limit',
  '0',
  '-o',
  'json'
], {
  encoding: 'utf8',
  maxBuffer: 30 * 1024 * 1024
});

const response = JSON.parse(raw);
const rows = (response.data?.result || [])
  .map(result => ({
    actionName: result.stream?.action_name || 'unknown',
    importance: result.stream?.event_data_userActionImportance || 'unset',
    severity: result.stream?.event_data_userActionSeverity || 'unset',
    executions: latestValue(result.values),
    latestSampleTimeUnixNs: result.values?.at(-1)?.[0] || null
  }))
  .sort((a, b) => b.executions - a.executions || a.actionName.localeCompare(b.actionName));

const totalExecutions = rows.reduce((total, row) => total + row.executions, 0);
const report = {
  generatedAt,
  datasource,
  since,
  query,
  totalExecutions,
  rows
};

const jsonPath = path.join(outputDir, `faro-user-action-totals-${stamp}.json`);
const csvPath = path.join(outputDir, `faro-user-action-totals-${stamp}.csv`);
const mdPath = path.join(outputDir, `faro-user-action-totals-${stamp}.md`);

writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(csvPath, [
  'action_name,importance,severity,executions,latest_sample_time_unix_ns',
  ...rows.map(row => [
    row.actionName,
    row.importance,
    row.severity,
    row.executions,
    row.latestSampleTimeUnixNs
  ].map(csvValue).join(','))
].join('\n') + '\n');
writeFileSync(mdPath, `# Faro User Action Execution Totals

Generated: ${generatedAt}

Datasource: \`${datasource}\`

Window: \`${since}\`

Total executions: ${totalExecutions}

Query:

\`\`\`logql
${query}
\`\`\`

The GCX range query returns a rolling \`${since}\` series. The table uses the latest sample per \`action_name\`, \`event_data_userActionImportance\`, and \`event_data_userActionSeverity\` as the total executions for the window.

| Action | Importance | Severity | Executions |
|---|---|---|---:|
${rows.map(row => `| ${row.actionName} | ${row.importance} | ${row.severity} | ${row.executions} |`).join('\n')}
`);

console.log(mdPath);
console.log(csvPath);
console.log(jsonPath);
console.log(`total executions: ${totalExecutions}`);
