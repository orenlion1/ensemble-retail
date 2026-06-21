import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const tufteThresholdColors = {
  meetsGoal: '#1eb16a',
  closeToGoal: '#f27d05',
  outsideGoal: '#bd362f',
  textOutsideGoal: '#ff3a3a'
};

const thresholdColorMap = new Map([
  ['green', tufteThresholdColors.meetsGoal],
  ['dark-green', tufteThresholdColors.meetsGoal],
  ['semi-dark-green', tufteThresholdColors.meetsGoal],
  ['light-green', tufteThresholdColors.meetsGoal],
  ['#299c46', tufteThresholdColors.meetsGoal],
  ['#37872d', tufteThresholdColors.meetsGoal],
  ['#56a64b', tufteThresholdColors.meetsGoal],
  ['rgba(50, 172, 45, 0.97)', tufteThresholdColors.meetsGoal],

  ['orange', tufteThresholdColors.closeToGoal],
  ['yellow', tufteThresholdColors.closeToGoal],
  ['dark-orange', tufteThresholdColors.closeToGoal],
  ['semi-dark-orange', tufteThresholdColors.closeToGoal],
  ['light-orange', tufteThresholdColors.closeToGoal],
  ['super-light-orange', tufteThresholdColors.closeToGoal],
  ['#eab839', tufteThresholdColors.closeToGoal],
  ['#e5ac0e', tufteThresholdColors.closeToGoal],
  ['#f2c306', tufteThresholdColors.closeToGoal],
  ['#fa6400', tufteThresholdColors.closeToGoal],
  ['rgba(237, 129, 40, 0.89)', tufteThresholdColors.closeToGoal],

  ['red', tufteThresholdColors.outsideGoal],
  ['dark-red', tufteThresholdColors.outsideGoal],
  ['semi-dark-red', tufteThresholdColors.outsideGoal],
  ['light-red', tufteThresholdColors.textOutsideGoal],
  ['#d44a3a', tufteThresholdColors.outsideGoal],
  ['#bf1b00', tufteThresholdColors.outsideGoal],
  ['#c4162a', tufteThresholdColors.outsideGoal],
  ['rgba(245, 54, 54, 0.9)', tufteThresholdColors.outsideGoal]
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    outputDir: null,
    report: null,
    includeNonEditable: false,
    writeInput: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') options.input = args[++index];
    else if (arg === '--output-dir') options.outputDir = args[++index];
    else if (arg === '--report') options.report = args[++index];
    else if (arg === '--include-non-editable') options.includeNonEditable = true;
    else if (arg === '--write-input') options.writeInput = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.input) {
    throw new Error('Usage: node scripts/standardize-grafana-threshold-colors.mjs --input <dashboard-list-or-dashboard.json> [--output-dir <dir>] [--report <file>] [--write-input]');
  }

  return options;
}

function dashboardItems(input) {
  if (input?.kind === 'DashboardList' || Array.isArray(input?.items)) return input.items;
  if (input?.kind === 'Dashboard' && input?.metadata?.name) return [input];
  if (Array.isArray(input)) return input;
  throw new Error('Input must be a Grafana Dashboard, DashboardList, or dashboard array.');
}

function normalizeColor(color) {
  return typeof color === 'string' ? color.trim().toLowerCase() : color;
}

function mappedThresholdColor(color) {
  return thresholdColorMap.get(normalizeColor(color));
}

function isThresholdStepsObject(value) {
  return value
    && typeof value === 'object'
    && Array.isArray(value.steps)
    && value.steps.length > 0
    && value.steps.every(step => step && typeof step === 'object' && 'color' in step && 'value' in step);
}

function walk(value, visit, pathParts = []) {
  if (!value || typeof value !== 'object') return;
  visit(value, pathParts);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visit, pathParts.concat(index)));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    walk(entry, visit, pathParts.concat(key));
  }
}

function standardizeDashboard(dashboard) {
  const changes = [];
  const changed = structuredClone(dashboard);

  walk(changed, (value, pathParts) => {
    if (!isThresholdStepsObject(value)) return;
    const isNamedThreshold = pathParts.includes('thresholds')
      || pathParts.at(-1) === 'value'
      || pathParts.at(-2) === 'thresholds';
    if (!isNamedThreshold) return;

    value.steps.forEach((step, stepIndex) => {
      const nextColor = mappedThresholdColor(step.color);
      if (!nextColor || step.color === nextColor) return;
      changes.push({
        path: pathParts.concat('steps', stepIndex, 'color').join('.'),
        before: step.color,
        after: nextColor,
        value: step.value ?? null
      });
      step.color = nextColor;
    });
  });

  return { dashboard: changed, changes };
}

function dashboardPath(outputDir, dashboard) {
  return path.join(outputDir, `${dashboard.metadata.name}.json`);
}

function main() {
  const options = parseArgs();
  const input = JSON.parse(readFileSync(options.input, 'utf8'));
  const dashboards = dashboardItems(input);
  if (options.outputDir) mkdirSync(options.outputDir, { recursive: true });
  if (options.report) mkdirSync(path.dirname(options.report), { recursive: true });

  const results = [];
  let totalChanges = 0;

  for (const dashboard of dashboards) {
    const editable = dashboard.spec?.editable !== false;
    const managedBy = dashboard.metadata?.annotations?.['grafana.app/managedBy'] || '';
    const result = {
      name: dashboard.metadata?.name,
      title: dashboard.spec?.title || '',
      editable,
      managedBy,
      changed: false,
      skipped: false,
      skipReason: '',
      changes: []
    };

    if (!editable && !options.includeNonEditable) {
      result.skipped = true;
      result.skipReason = 'non-editable dashboard';
      results.push(result);
      continue;
    }

    const standardized = standardizeDashboard(dashboard);
    result.changes = standardized.changes;
    result.changed = standardized.changes.length > 0;
    totalChanges += standardized.changes.length;

    if (result.changed && options.outputDir) {
      writeFileSync(dashboardPath(options.outputDir, dashboard), `${JSON.stringify(standardized.dashboard, null, 2)}\n`);
    }

    if (result.changed && options.writeInput && dashboards.length === 1) {
      writeFileSync(options.input, `${JSON.stringify(standardized.dashboard, null, 2)}\n`);
    }

    results.push(result);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    standard: {
      source: 'The Tufte Aesthetic for Grafana Dashboard Design.pdf, section 2 Strategic Use of Color',
      thresholdColors: tufteThresholdColors
    },
    dashboardsScanned: dashboards.length,
    dashboardsChanged: results.filter(result => result.changed).length,
    thresholdColorChanges: totalChanges,
    results
  };

  if (options.report) {
    writeFileSync(options.report, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(JSON.stringify({
    dashboardsScanned: report.dashboardsScanned,
    dashboardsChanged: report.dashboardsChanged,
    thresholdColorChanges: report.thresholdColorChanges,
    report: options.report || null,
    outputDir: options.outputDir || null
  }, null, 2));
}

main();
