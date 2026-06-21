import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const neutralColor = '#437d9e';

const thresholdColors = {
  meetsGoal: '#1eb16a',
  closeToGoal: '#f27d05',
  outsideGoal: '#bd362f',
  textOutsideGoal: '#ff3a3a'
};

const thresholdColorMap = new Map([
  ['green', thresholdColors.meetsGoal],
  ['dark-green', thresholdColors.meetsGoal],
  ['semi-dark-green', thresholdColors.meetsGoal],
  ['light-green', thresholdColors.meetsGoal],
  ['#299c46', thresholdColors.meetsGoal],
  ['#37872d', thresholdColors.meetsGoal],
  ['#56a64b', thresholdColors.meetsGoal],
  ['rgba(50, 172, 45, 0.97)', thresholdColors.meetsGoal],
  ['orange', thresholdColors.closeToGoal],
  ['yellow', thresholdColors.closeToGoal],
  ['dark-orange', thresholdColors.closeToGoal],
  ['semi-dark-orange', thresholdColors.closeToGoal],
  ['light-orange', thresholdColors.closeToGoal],
  ['super-light-orange', thresholdColors.closeToGoal],
  ['#eab839', thresholdColors.closeToGoal],
  ['#e5ac0e', thresholdColors.closeToGoal],
  ['#f2c306', thresholdColors.closeToGoal],
  ['#fa6400', thresholdColors.closeToGoal],
  ['rgba(237, 129, 40, 0.89)', thresholdColors.closeToGoal],
  ['red', thresholdColors.outsideGoal],
  ['dark-red', thresholdColors.outsideGoal],
  ['semi-dark-red', thresholdColors.outsideGoal],
  ['light-red', thresholdColors.textOutsideGoal],
  ['#d44a3a', thresholdColors.outsideGoal],
  ['#bf1b00', thresholdColors.outsideGoal],
  ['#c4162a', thresholdColors.outsideGoal],
  ['rgba(245, 54, 54, 0.9)', thresholdColors.outsideGoal]
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
    throw new Error('Usage: node scripts/standardize-grafana-neutral-colors.mjs --input <dashboard-list-or-dashboard.json> [--output-dir <dir>] [--report <file>] [--write-input]');
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

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isThresholdStepsObject(value) {
  return isObject(value)
    && Array.isArray(value.steps)
    && value.steps.length > 0
    && value.steps.every(step => isObject(step) && 'color' in step && 'value' in step);
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

function recordChange(changes, type, pathParts, before, after) {
  if (JSON.stringify(before) === JSON.stringify(after)) return false;
  changes.push({
    type,
    path: pathParts.join('.'),
    before,
    after
  });
  return true;
}

function standardizeColorObject(value, pathParts, changes) {
  if (!isObject(value)) return;
  if (!('mode' in value) && !('fixedColor' in value)) return;

  const before = structuredClone(value);
  if (value.mode === 'thresholds') {
    if (value.fixedColor && value.fixedColor !== neutralColor) value.fixedColor = neutralColor;
  } else {
    value.mode = 'fixed';
    value.fixedColor = neutralColor;
    delete value.seriesBy;
  }
  recordChange(changes, 'neutral-default-color', pathParts, before, structuredClone(value));
}

function standardizeThresholdSteps(value, pathParts, changes) {
  if (!isThresholdStepsObject(value)) return;

  value.steps.forEach((step, stepIndex) => {
    const before = step.color;
    const after = step.value == null ? neutralColor : (mappedThresholdColor(step.color) || step.color);
    if (before === after) return;
    step.color = after;
    recordChange(
      changes,
      step.value == null ? 'neutral-default-threshold' : 'semantic-threshold-color',
      pathParts.concat('steps', stepIndex, 'color'),
      before,
      after
    );
  });
}

function standardizePanel(panel, pathParts, changes) {
  const options = panel.spec?.vizConfig?.spec?.options;
  if (!isObject(options)) return;

  if (options.colorMode === 'background' || options.colorMode === 'background_solid') {
    const before = options.colorMode;
    options.colorMode = 'none';
    recordChange(changes, 'stat-background-color-off', pathParts.concat('spec', 'vizConfig', 'spec', 'options', 'colorMode'), before, options.colorMode);
  }
}

function standardizeDashboard(dashboard) {
  const changes = [];
  const changed = structuredClone(dashboard);

  walk(changed, (value, pathParts) => {
    if (value?.kind === 'Panel') standardizePanel(value, pathParts, changes);

    const lastPart = pathParts.at(-1);
    if (lastPart === 'color') standardizeColorObject(value, pathParts, changes);

    const isNamedThreshold = pathParts.includes('thresholds')
      || pathParts.at(-1) === 'value'
      || pathParts.at(-2) === 'thresholds';
    if (isNamedThreshold) standardizeThresholdSteps(value, pathParts, changes);
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
      changeCounts: {},
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
    for (const change of standardized.changes) {
      result.changeCounts[change.type] = (result.changeCounts[change.type] || 0) + 1;
    }
    totalChanges += standardized.changes.length;

    if (result.changed && options.outputDir) {
      writeFileSync(dashboardPath(options.outputDir, dashboard), `${JSON.stringify(standardized.dashboard, null, 2)}\n`);
    }

    if (result.changed && options.writeInput && dashboards.length === 1) {
      writeFileSync(options.input, `${JSON.stringify(standardized.dashboard, null, 2)}\n`);
    }

    results.push(result);
  }

  const aggregateChangeCounts = {};
  for (const result of results) {
    for (const [type, count] of Object.entries(result.changeCounts || {})) {
      aggregateChangeCounts[type] = (aggregateChangeCounts[type] || 0) + count;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    standard: {
      source: 'The Tufte Aesthetic for Grafana Dashboard Design.pdf, section 2 Strategic Use of Color',
      neutralColor,
      thresholdColors,
      statBackgroundColorMode: 'none'
    },
    dashboardsScanned: dashboards.length,
    dashboardsChanged: results.filter(result => result.changed).length,
    dashboardStyleChanges: totalChanges,
    aggregateChangeCounts,
    results
  };

  if (options.report) {
    writeFileSync(options.report, `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(JSON.stringify({
    dashboardsScanned: report.dashboardsScanned,
    dashboardsChanged: report.dashboardsChanged,
    dashboardStyleChanges: report.dashboardStyleChanges,
    aggregateChangeCounts,
    report: options.report || null,
    outputDir: options.outputDir || null
  }, null, 2));
}

main();
