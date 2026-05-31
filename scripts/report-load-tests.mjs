import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const reportsDir = path.resolve('reports/load-tests');
const frontendReportsDir = path.resolve('reports/frontend-user-actions');
const outputDir = path.join(reportsDir, 'comparison');
const graphvizDir = path.resolve('docs/graphviz');
const timezone = 'America/New_York';

const requestRateByRunId = new Map([
  [7653800, 60],
  [7653715, 40],
  [7653610, 30],
  [7653496, 25],
  [7653359, 15],
  [7653277, 10],
  [7653107, 5],
  [7652889, 8],
  [7651472, 8]
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function latestFile(prefix) {
  const files = readdirSync(reportsDir)
    .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
    .sort();
  return files.at(-1) ? path.join(reportsDir, files.at(-1)) : null;
}

function latestFileIn(dir, prefix) {
  try {
    const files = readdirSync(dir)
      .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
      .sort();
    return files.at(-1) ? path.join(dir, files.at(-1)) : null;
  } catch {
    return null;
  }
}

function filesWithPrefix(prefix) {
  return readdirSync(reportsDir)
    .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
    .sort()
    .map(file => path.join(reportsDir, file));
}

function formatDate(value, options = {}) {
  if (!value) return 'n/a';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  }).format(new Date(value));
}

function dayKey(value) {
  if (!value) return 'n/a';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

function number(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}

function wholeNumber(value) {
  return Number.isFinite(value) ? String(Math.round(value)) : 'n/a';
}

function percent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : 'n/a';
}

function resultIcon(result) {
  if (result === 'passed') return '✅';
  if (result === 'failed') return '❌';
  if (result === 'error') return '⚠️';
  return '•';
}

function resultText(result) {
  if (result === 'passed') return 'PASS';
  if (result === 'failed') return 'FAIL';
  if (result === 'error') return 'ERROR';
  return 'UNKNOWN';
}

function resultColor(result) {
  if (result === 'passed') return '#166534';
  if (result === 'failed') return '#7f1d1d';
  if (result === 'error') return '#854d0e';
  return '#334155';
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function allRunsFrom(rawRuns) {
  const rows = [];
  for (const test of rawRuns.loadTests || []) {
    for (const run of test.runs || []) {
      rows.push({
        testId: test.id,
        testName: test.name,
        runId: run.id,
        created: run.created,
        date: dayKey(run.created),
        ended: run.ended,
        durationSeconds: run.execution_duration ?? run.durationSeconds ?? secondsBetween(run.created, run.ended),
        status: run.status,
        result: run.result,
        totalVuh: run.cost?.total_vuh ?? null,
        protocolVuh: run.cost?.breakdown?.protocol_vuh ?? null,
        browserVuh: run.cost?.breakdown?.browser_vuh ?? null,
        url: `https://orenlion.grafana.net/a/k6-app/runs/${run.id}`,
        maxVus: run.max_vus ?? null,
        maxBrowserVus: run.max_browser_vus ?? null,
        requestRatePerSecond: requestRateByRunId.get(Number(run.id ?? run.runId)) ?? null
      });
    }
  }
  return rows.sort((a, b) => new Date(a.created) - new Date(b.created));
}

function secondsBetween(start, end) {
  if (!start || !end) return null;
  return Math.round((new Date(end) - new Date(start)) / 1000);
}

function latestByTest(summary) {
  return (summary.loadTests || []).map(test => ({
    testId: test.id,
    testName: test.name,
    latest: test.latest,
    recentRuns: test.recentRuns || [],
    error: test.error
  }));
}

function localSummariesFrom(files) {
  return files.map(file => {
    const summary = readJson(file);
    const metricValues = name => summary.metrics?.[name]?.values || {};
    const metricCount = name => metricValues(name).count ?? (
      Number.isFinite(metricValues(name).passes) && Number.isFinite(metricValues(name).fails)
        ? metricValues(name).passes + metricValues(name).fails
        : null
    );
    const metricFailures = name => metricValues(name).passes ?? null;
    const httpFailureMetric = summary.metrics?.http_req_failed ? 'http_req_failed' : 'browser_http_req_failed';
    const httpDurationMetric = summary.metrics?.http_req_duration ? 'http_req_duration' : 'browser_http_req_duration';
    return {
      file,
      generatedAt: summary.generatedAt,
      date: dayKey(summary.generatedAt),
      testName: summary.testName || 'Local k6 run',
      source: summary.source || 'k6-local',
      totals: {
        ...(summary.totals || {}),
        httpRequests: summary.totals?.httpRequests ?? metricCount('http_reqs') ?? metricCount(httpFailureMetric),
        httpFailures: summary.totals?.httpFailures ?? metricFailures(httpFailureMetric),
        httpFailureRate: summary.totals?.httpFailureRate ?? metricValues(httpFailureMetric).rate ?? null,
        httpDurationP95Ms: summary.totals?.httpDurationP95Ms ?? metricValues(httpDurationMetric)['p(95)'] ?? null,
        checksTotal: summary.totals?.checksTotal ?? metricCount('checks'),
        checksPassRate: summary.totals?.checksPassRate ?? metricValues('checks').rate ?? null
      },
      userActions: summary.userActions || {},
      businessCounters: summary.businessCounters || {}
    };
  }).sort((a, b) => new Date(a.generatedAt) - new Date(b.generatedAt));
}

function faroTotalsFrom(file) {
  if (!file) return null;
  const report = readJson(file);
  return {
    file,
    generatedAt: report.generatedAt,
    since: report.since,
    totalExecutions: report.totalExecutions,
    rows: report.rows || []
  };
}

function writeBarChart(file, title, rows, options = {}) {
  const width = 1100;
  const rowHeight = 38;
  const top = 70;
  const left = 260;
  const right = 80;
  const height = top + rows.length * rowHeight + 40;
  const max = Math.max(...rows.map(row => row.value || 0), 1);
  const unit = options.unit || '';
  const colorFor = options.colorFor || (() => '#2563eb');
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">`,
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    `<text x="24" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>`
  ];
  rows.forEach((row, index) => {
    const y = top + index * rowHeight;
    const barWidth = Math.max(2, ((row.value || 0) / max) * (width - left - right));
    parts.push(`<text x="24" y="${y + 22}" font-family="Arial, sans-serif" font-size="14" fill="#374151">${escapeXml(row.label)}</text>`);
    parts.push(`<rect x="${left}" y="${y + 5}" width="${barWidth}" height="22" rx="4" fill="${colorFor(row)}"/>`);
    parts.push(`<text x="${left + barWidth + 8}" y="${y + 22}" font-family="Arial, sans-serif" font-size="14" fill="#111827">${escapeXml(row.display ?? `${number(row.value)}${unit}`)}</text>`);
  });
  parts.push('</svg>');
  writeFileSync(path.join(outputDir, file), `${parts.join('\n')}\n`);
}

function writeTimelineChart(file, title, rows, metric, options = {}) {
  const width = 1200;
  const height = 520;
  const margin = { top: 70, right: 260, bottom: 80, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const dates = [...new Set(rows.map(row => row.date))].sort();
  const tests = [...new Set(rows.map(row => row.testName))].sort();
  const max = Math.max(...rows.map(row => Number(row[metric]) || 0), 1);
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c'];
  const xFor = date => margin.left + (dates.length <= 1 ? plotWidth / 2 : (dates.indexOf(date) / (dates.length - 1)) * plotWidth);
  const yFor = value => margin.top + plotHeight - ((Number(value) || 0) / max) * plotHeight;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">`,
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    `<text x="24" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">${escapeXml(title)}</text>`,
    `<line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#9ca3af"/>`,
    `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#9ca3af"/>`
  ];
  for (let i = 0; i <= 4; i += 1) {
    const value = (max / 4) * i;
    const y = yFor(value);
    parts.push(`<line x1="${margin.left}" y1="${y}" x2="${margin.left + plotWidth}" y2="${y}" stroke="#e5e7eb"/>`);
    parts.push(`<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${escapeXml(options.format ? options.format(value) : number(value))}</text>`);
  }
  dates.forEach(date => {
    const x = xFor(date);
    parts.push(`<text x="${x}" y="${height - 35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151">${escapeXml(date)}</text>`);
  });
  tests.forEach((test, testIndex) => {
    const color = colors[testIndex % colors.length];
    const points = rows.filter(row => row.testName === test && Number.isFinite(Number(row[metric]))).map(row => `${xFor(row.date)},${yFor(row[metric])}`);
    if (points.length) {
      parts.push(`<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`);
    }
    rows.filter(row => row.testName === test && Number.isFinite(Number(row[metric]))).forEach(row => {
      parts.push(`<circle cx="${xFor(row.date)}" cy="${yFor(row[metric])}" r="5" fill="${color}"/>`);
    });
    const legendY = margin.top + testIndex * 24;
    parts.push(`<rect x="${margin.left + plotWidth + 36}" y="${legendY - 11}" width="14" height="14" fill="${color}"/>`);
    parts.push(`<text x="${margin.left + plotWidth + 58}" y="${legendY}" font-family="Arial, sans-serif" font-size="13" fill="#374151">${escapeXml(test)}</text>`);
  });
  parts.push('</svg>');
  writeFileSync(path.join(outputDir, file), `${parts.join('\n')}\n`);
}

function writeResultHeatmap(file, rows) {
  const tests = [...new Set(rows.map(row => row.testName))].sort();
  const dates = [...new Set(rows.map(row => row.date))].sort();
  const cell = 56;
  const left = 260;
  const top = 70;
  const width = left + dates.length * cell + 60;
  const height = top + tests.length * cell + 70;
  const color = result => result === 'passed' ? '#16a34a' : result === 'failed' ? '#dc2626' : result === 'error' ? '#f59e0b' : '#d1d5db';
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Load test result heatmap">`,
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    '<text x="24" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111827">Load Test Result By Date</text>'
  ];
  dates.forEach((date, index) => {
    parts.push(`<text x="${left + index * cell + cell / 2}" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#374151">${escapeXml(date.slice(5))}</text>`);
  });
  tests.forEach((test, testIndex) => {
    const y = top + testIndex * cell;
    parts.push(`<text x="24" y="${y + 32}" font-family="Arial, sans-serif" font-size="14" fill="#374151">${escapeXml(test)}</text>`);
    dates.forEach((date, dateIndex) => {
      const run = rows.filter(row => row.testName === test && row.date === date).at(-1);
      const x = left + dateIndex * cell;
      parts.push(`<rect x="${x + 8}" y="${y + 8}" width="40" height="40" rx="6" fill="${color(run?.result)}"/>`);
      parts.push(`<text x="${x + 28}" y="${y + 33}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ffffff">${escapeXml(resultIcon(run?.result).replace('✅', '✓').replace('❌', '×').replace('⚠️', '!'))}</text>`);
    });
  });
  parts.push('</svg>');
  writeFileSync(path.join(outputDir, file), `${parts.join('\n')}\n`);
}

function writeCsv(file, rows) {
  const headers = ['date', 'created', 'testName', 'testId', 'runId', 'result', 'status', 'durationSeconds', 'requestRatePerSecond', 'totalVuh', 'protocolVuh', 'browserVuh', 'maxVus', 'maxBrowserVus', 'url'];
  const lines = [headers.join(',')];
  rows.forEach(row => {
    lines.push(headers.map(header => {
      const value = row[header] ?? '';
      return `"${String(value).replaceAll('"', '""')}"`;
    }).join(','));
  });
  writeFileSync(path.join(outputDir, file), `${lines.join('\n')}\n`);
}

function writeLocalCounterCsv(file, rows) {
  const headers = [
    'date',
    'generatedAt',
    'testName',
    'httpRequests',
    'httpFailures',
    'httpFailureRate',
    'checksTotal',
    'checksPassRate',
    'storefrontUserActions',
    'shoppingCartAddItems',
    'shoppingCartAddDetailItems',
    'shoppingCartAddSaleItems',
    'shoppingCartRemoveItems',
    'shoppingCartCheckout',
    'cartUpdates',
    'checkoutAttempts',
    'regionChanges',
    'sourceFile'
  ];
  const valueFor = (row, header) => ({
    date: row.date,
    generatedAt: row.generatedAt,
    testName: row.testName,
    httpRequests: row.totals.httpRequests,
    httpFailures: row.totals.httpFailures,
    httpFailureRate: row.totals.httpFailureRate,
    checksTotal: row.totals.checksTotal,
    checksPassRate: row.totals.checksPassRate,
    storefrontUserActions: row.userActions.total,
    shoppingCartAddItems: row.userActions.shoppingCartAddItems,
    shoppingCartAddDetailItems: row.userActions.shoppingCartAddDetailItems,
    shoppingCartAddSaleItems: row.userActions.shoppingCartAddSaleItems,
    shoppingCartRemoveItems: row.userActions.shoppingCartRemoveItems,
    shoppingCartCheckout: row.userActions.shoppingCartCheckout,
    cartUpdates: row.businessCounters.cartUpdates,
    checkoutAttempts: row.businessCounters.checkoutAttempts,
    regionChanges: row.businessCounters.regionChanges,
    sourceFile: path.relative('.', row.file)
  })[header] ?? '';
  const lines = [headers.join(',')];
  rows.forEach(row => {
    lines.push(headers.map(header => `"${String(valueFor(row, header)).replaceAll('"', '""')}"`).join(','));
  });
  writeFileSync(path.join(outputDir, file), `${lines.join('\n')}\n`);
}

function graphvizCell(value, color = '#111827', options = {}) {
  const align = options.align ? ` ALIGN="${options.align}"` : '';
  const width = options.width ? ` WIDTH="${options.width}"` : '';
  const fontColor = options.fontColor || '#f8fafc';
  const text = options.bold ? `<B>${escapeXml(value)}</B>` : escapeXml(value);
  return `<TD BGCOLOR="${color}"${align}${width}><FONT COLOR="${fontColor}">${text}</FONT></TD>`;
}

function loadRunTableDot(rows) {
  const history = rows.slice().reverse().slice(0, 20);
  const passed = rows.filter(row => row.result === 'passed').length;
  const failed = rows.filter(row => row.result === 'failed').length;
  const errors = rows.filter(row => row.result === 'error').length;
  const total = passed + failed + errors;
  const latestPassing400 = rows.slice().reverse().find(row => row.result === 'passed' && Number(row.maxVus) >= 400);
  const latestRun = history[0];
  const rowMarkup = history.map((run, index) => {
    const base = index % 2 === 0 ? '#111827' : '#182235';
    const metric = index % 2 === 0 ? '#1e293b' : '#243044';
    return [
      '        <TR>',
      `          ${graphvizCell(formatDate(run.created), base, { width: 175 })}`,
      `          ${graphvizCell(run.runId, base, { fontColor: '#bfdbfe', width: 80 })}`,
      `          ${graphvizCell(resultText(run.result), resultColor(run.result), { bold: true, width: 70 })}`,
      `          ${graphvizCell(`${number((run.durationSeconds || 0) / 60, 1)}m`, base, { width: 85 })}`,
      `          ${graphvizCell(wholeNumber(run.requestRatePerSecond), metric, { width: 105 })}`,
      `          ${graphvizCell(number(run.totalVuh), metric, { width: 85 })}`,
      `          ${graphvizCell(number(run.protocolVuh), metric, { width: 85 })}`,
      `          ${graphvizCell(number(run.browserVuh), metric, { width: 85 })}`,
      '        </TR>'
    ].join('\n');
  }).join('\n');

  return `digraph load_run_table {
  graph [
    rankdir=TB,
    bgcolor="#0b1220",
    fontcolor="#f8fafc",
    pad="0.35",
    nodesep="0.35",
    ranksep="0.45",
    fontname="Helvetica",
    fontsize=22,
    labelloc="t",
    label="Ensemble-Grafana k6 Traffic Spike Run History"
  ];

  node [
    shape=plain,
    fontname="Helvetica",
    fontcolor="#f8fafc"
  ];

  runs [
    label=<
      <TABLE BORDER="1" CELLBORDER="1" CELLSPACING="0" CELLPADDING="7" COLOR="#475569">
        <TR>
          ${graphvizCell('Started', '#1e3a5f', { bold: true, width: 175 })}
          ${graphvizCell('Run', '#1e3a5f', { bold: true, width: 80 })}
          ${graphvizCell('Result', '#1e3a5f', { bold: true, width: 70 })}
          ${graphvizCell('Duration', '#1e3a5f', { bold: true, width: 85 })}
          ${graphvizCell('Request/sec', '#1e3a5f', { bold: true, width: 105 })}
          ${graphvizCell('Total VUH', '#1e3a5f', { bold: true, width: 85 })}
          ${graphvizCell('Protocol', '#1e3a5f', { bold: true, width: 85 })}
          ${graphvizCell('Browser', '#1e3a5f', { bold: true, width: 85 })}
        </TR>
${rowMarkup}
      </TABLE>
    >
  ];

  summary [
    label=<
      <TABLE BORDER="1" CELLBORDER="1" CELLSPACING="0" CELLPADDING="8" COLOR="#475569">
        <TR>${graphvizCell('Summary', '#1e3a5f', { bold: true })}</TR>
        <TR>${graphvizCell(`Runs: ${total}`, '#111827', { align: 'LEFT' })}</TR>
        <TR>${graphvizCell(`Passed: ${passed}`, '#111827', { align: 'LEFT', fontColor: '#dcfce7' })}</TR>
        <TR>${graphvizCell(`Failed: ${failed}`, '#111827', { align: 'LEFT', fontColor: '#fecaca' })}</TR>
        <TR>${graphvizCell(`Errors: ${errors}`, '#111827', { align: 'LEFT', fontColor: '#fde68a' })}</TR>
        <TR>${graphvizCell(`Pass rate: ${total ? Math.round((passed / total) * 100) : 0}%`, '#111827', { align: 'LEFT' })}</TR>
        <TR>${graphvizCell(`Latest run: ${latestRun ? `${latestRun.runId} ${resultText(latestRun.result)}` : 'n/a'}`, '#111827', { align: 'LEFT', fontColor: '#bfdbfe' })}</TR>
        <TR>${graphvizCell(`Latest passing 400-VU run: ${latestPassing400?.runId || 'n/a'}`, '#111827', { align: 'LEFT', fontColor: '#bfdbfe' })}</TR>
      </TABLE>
    >
  ];

  summary -> runs [
    style=invis,
    weight=2
  ];
}
`;
}

function writeLoadRunGraphviz(rows) {
  mkdirSync(graphvizDir, { recursive: true });
  const dotFile = path.join(graphvizDir, 'load-run-table.dot');
  const svgFile = path.join(graphvizDir, 'load-run-table.svg');
  const pngFile = path.join(graphvizDir, 'load-run-table.png');
  writeFileSync(dotFile, loadRunTableDot(rows));
  execFileSync('dot', ['-Tsvg', dotFile, '-o', svgFile], { stdio: 'inherit' });
  execFileSync('dot', ['-Tpng', dotFile, '-o', pngFile], { stdio: 'inherit' });
}

const summaryFile = latestFile('k6-summary-');
const rawRunsFile = latestFile('k6-runs-');
const localSummaryFiles = filesWithPrefix('k6-local-summary-');
const faroTotalsFile = latestFileIn(frontendReportsDir, 'faro-user-action-totals-');

if (!summaryFile) {
  console.error('No reports/load-tests/k6-summary-*.json file found.');
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });

const summary = readJson(summaryFile);
const rawRuns = rawRunsFile ? readJson(rawRunsFile) : { loadTests: [] };
const runs = allRunsFrom(rawRuns);
const latestTests = latestByTest(summary);
const localSummaries = localSummariesFrom(localSummaryFiles);
const faroTotals = faroTotalsFrom(faroTotalsFile);
const generatedAt = new Date().toISOString();

writeCsv('load-test-runs.csv', runs);
writeLocalCounterCsv('load-test-counters.csv', localSummaries);
writeLoadRunGraphviz(runs);
writeResultHeatmap('load-test-results-by-date.svg', runs);
writeTimelineChart('load-test-duration-by-date.svg', 'Run Duration By Date', runs, 'durationSeconds', {
  format: value => `${Math.round(value / 60)}m`
});
writeTimelineChart('load-test-vuh-by-date.svg', 'VUH Cost By Date', runs, 'totalVuh');
writeBarChart('latest-http-failure-rate.svg', 'Latest HTTP Failure Rate', latestTests
  .filter(test => Number.isFinite(test.latest?.aggregates?.httpFailureRate))
  .map(test => ({
    label: `${test.testName} (${dayKey(test.latest.created)})`,
    value: test.latest.aggregates.httpFailureRate * 100,
    display: `${(test.latest.aggregates.httpFailureRate * 100).toFixed(2)}%`
  })), {
    colorFor: row => row.value === 0 ? '#16a34a' : row.value < 1 ? '#f59e0b' : '#dc2626'
  });
writeBarChart('latest-check-pass-rate.svg', 'Latest Check Pass Rate', latestTests
  .filter(test => Number.isFinite(test.latest?.aggregates?.checksPassRate))
  .map(test => ({
    label: `${test.testName} (${dayKey(test.latest.created)})`,
    value: test.latest.aggregates.checksPassRate * 100,
    display: `${(test.latest.aggregates.checksPassRate * 100).toFixed(2)}%`
  })), {
    colorFor: row => row.value >= 99 ? '#16a34a' : row.value >= 90 ? '#f59e0b' : '#dc2626'
  });
writeBarChart('latest-http-p95.svg', 'Latest HTTP Duration p95', latestTests
  .filter(test => Number.isFinite(test.latest?.aggregates?.httpDurationP95Ms))
  .map(test => ({
    label: `${test.testName} (${dayKey(test.latest.created)})`,
    value: test.latest.aggregates.httpDurationP95Ms,
    display: `${number(test.latest.aggregates.httpDurationP95Ms, 1)} ms`
  })), {
    colorFor: () => '#2563eb'
  });
writeBarChart('latest-user-action-totals.svg', 'Latest User Action And Cart Totals', localSummaries.slice(-8).flatMap(summary => [
  {
    label: `${summary.testName} cart add (${summary.date})`,
    value: (summary.userActions.shoppingCartAddItems || 0) + (summary.userActions.shoppingCartAddDetailItems || 0) + (summary.userActions.shoppingCartAddSaleItems || 0),
    display: String((summary.userActions.shoppingCartAddItems || 0) + (summary.userActions.shoppingCartAddDetailItems || 0) + (summary.userActions.shoppingCartAddSaleItems || 0))
  },
  {
    label: `${summary.testName} cart remove (${summary.date})`,
    value: summary.userActions.shoppingCartRemoveItems || 0,
    display: String(summary.userActions.shoppingCartRemoveItems || 0)
  },
  {
    label: `${summary.testName} API cart updates (${summary.date})`,
    value: summary.businessCounters.cartUpdates || 0,
    display: String(summary.businessCounters.cartUpdates || 0)
  }
]).filter(row => row.value > 0), {
  colorFor: row => row.label.includes('remove') ? '#dc2626' : row.label.includes('API') ? '#9333ea' : '#16a34a'
});

const latestRows = latestTests.map(test => {
  const latest = test.latest;
  if (!latest) {
    return `| ${test.testId} | ${test.testName} | n/a | n/a | n/a | n/a | n/a | n/a | n/a | ${test.error || 'No runs found'} |`;
  }
  return [
    `| ${test.testId}`,
    test.testName,
    `[${latest.runId}](${latest.url})`,
    formatDate(latest.created),
    resultIcon(latest.result),
    `${number((latest.durationSeconds || 0) / 60, 1)}m`,
    latest.aggregates?.httpRequests ?? 'n/a',
    percent(latest.aggregates?.httpFailureRate),
    latest.aggregates?.httpDurationP95Ms ? `${number(latest.aggregates.httpDurationP95Ms, 1)} ms` : 'n/a',
    percent(latest.aggregates?.checksPassRate)
  ].join(' | ') + ' |';
});

const historyRows = runs.slice().reverse().map(run => [
  `| ${run.date}`,
  formatDate(run.created),
  run.testName,
  `[${run.runId}](${run.url})`,
  resultIcon(run.result),
  `${number((run.durationSeconds || 0) / 60, 1)}m`,
  wholeNumber(run.requestRatePerSecond),
  number(run.totalVuh),
  number(run.protocolVuh),
  number(run.browserVuh)
].join(' | ') + ' |');

const resultCounts = runs.reduce((acc, run) => {
  const key = `${run.testName}::${run.result || 'unknown'}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
const resultSummaryRows = [...new Set(runs.map(run => run.testName))].sort().map(testName => {
  const passed = resultCounts[`${testName}::passed`] || 0;
  const failed = resultCounts[`${testName}::failed`] || 0;
  const errors = resultCounts[`${testName}::error`] || 0;
  const total = passed + failed + errors;
  return `| ${testName} | ${total} | ${passed} | ${failed} | ${errors} | ${total ? percent(passed / total) : 'n/a'} |`;
});

const localCounterRows = localSummaries.slice().reverse().map(summary => {
  const totalCartAdds = (summary.userActions.shoppingCartAddItems || 0)
    + (summary.userActions.shoppingCartAddDetailItems || 0)
    + (summary.userActions.shoppingCartAddSaleItems || 0);
  return [
    `| ${summary.date}`,
    formatDate(summary.generatedAt),
    summary.testName,
    summary.totals.httpRequests ?? 'n/a',
    summary.totals.httpFailures ?? 'n/a',
    percent(summary.totals.httpFailureRate),
    summary.userActions.total ?? 'n/a',
    totalCartAdds || 'n/a',
    summary.userActions.shoppingCartAddItems ?? 'n/a',
    summary.userActions.shoppingCartAddDetailItems ?? 'n/a',
    summary.userActions.shoppingCartAddSaleItems ?? 'n/a',
    summary.userActions.shoppingCartRemoveItems ?? 'n/a',
    summary.userActions.shoppingCartCheckout ?? 'n/a',
    summary.businessCounters.cartUpdates ?? 'n/a',
    summary.businessCounters.checkoutAttempts ?? 'n/a',
    summary.businessCounters.regionChanges ?? 'n/a'
  ].join(' | ') + ' |';
});

const faroExecutionRows = faroTotals?.rows?.map(row => [
  `| ${row.actionName}`,
  row.importance,
  row.severity,
  row.executions
].join(' | ') + ' |') || [];

const markdown = `# k6 Load Test Comparison

Generated: ${generatedAt}

Source summary: \`${path.relative('.', summaryFile)}\`

Source run history: \`${rawRunsFile ? path.relative('.', rawRunsFile) : 'n/a'}\`

Source Faro action totals: \`${faroTotalsFile ? path.relative('.', faroTotalsFile) : 'n/a'}\`

## Latest Runs

| Test ID | Test | Latest Run | Date | Result | Duration | HTTP Requests | HTTP Failure Rate | HTTP p95 | Check Pass Rate |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|
${latestRows.join('\n')}

## Visual Comparison

### Result By Date

![Load test result by date](comparison/load-test-results-by-date.svg)

### Duration By Date

![Run duration by date](comparison/load-test-duration-by-date.svg)

### VUH Cost By Date

![VUH cost by date](comparison/load-test-vuh-by-date.svg)

### Latest HTTP Failure Rate

![Latest HTTP failure rate](comparison/latest-http-failure-rate.svg)

### Latest Check Pass Rate

![Latest check pass rate](comparison/latest-check-pass-rate.svg)

### Latest HTTP p95

![Latest HTTP p95](comparison/latest-http-p95.svg)

### Latest User Action And Cart Totals

![Latest user action and cart totals](comparison/latest-user-action-totals.svg)

## Result Summary

| Test | Runs | Passed | Failed | Errors | Pass Rate |
|---|---:|---:|---:|---:|---:|
${resultSummaryRows.join('\n')}

## Request And User Action Totals

These totals come from local k6 summary files named \`reports/load-tests/k6-local-summary-*.json\`. Cloud run history still provides total HTTP requests for latest runs, but per-action counters such as shopping cart add/remove require these local summaries or equivalent exported metric data.

| Date | Generated | Test | HTTP Requests | HTTP Failures | HTTP Failure Rate | User Actions | Cart Adds Total | Add Item | Add Detail | Add Sale | Remove Item | Checkout | API Cart Updates | Checkout Attempts | Region Changes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${localCounterRows.length ? localCounterRows.join('\n') : '| n/a | n/a | No local k6 summary files found | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |'}

## Grafana Faro User Action Executions

These totals come from the latest \`gcx logs query\` output under \`reports/frontend-user-actions/faro-user-action-totals-*.json\`. They use the latest sample from a rolling \`${faroTotals?.since || '6h'}\` \`count_over_time\` query to show what Grafana Cloud received after k6 browser-action runs.

Total executions: ${faroTotals?.totalExecutions ?? 'n/a'}

| Action | Importance | Severity | Executions |
|---|---|---|---:|
${faroExecutionRows.length ? faroExecutionRows.join('\n') : '| n/a | n/a | n/a | n/a |'}

## Run History

| Date | Started | Test | Run | Result | Duration | Request/sec | Total VUH | Protocol VUH | Browser VUH |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
${historyRows.join('\n')}

## Machine-Readable Comparison

- CSV: [comparison/load-test-runs.csv](comparison/load-test-runs.csv)
- Counter CSV: [comparison/load-test-counters.csv](comparison/load-test-counters.csv)
- SVG charts are stored under [comparison/](comparison/).
`;

writeFileSync(path.join(reportsDir, 'load-test-comparison.md'), markdown);
console.log(path.join(reportsDir, 'load-test-comparison.md'));
