#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const inputPath = resolve(root, process.env.INCIDENT_INPUT_PATH || 'observability/irm/generated/incidents-to-push.json');
const outputPath = resolve(
  root,
  process.env.INCIDENT_OUTPUT_PATH || 'observability/irm/generated/incident-push-results.json'
);
const summaryPath = resolve(
  root,
  process.env.INCIDENT_SUMMARY_PATH || 'observability/irm/generated/incident-push-summary.md'
);
const gcx = process.env.GCX_BIN || 'gcx';
const firstExistingIncidentID = process.env.FIRST_EXISTING_INCIDENT_ID || '';

const incidents = JSON.parse(readFileSync(inputPath, 'utf8'));
const results = [];

function run(args, options = {}) {
  return execFileSync(gcx, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function api(method, payload) {
  return run([
    'api',
    `/api/plugins/grafana-irm-app/resources/api/v1/${method}`,
    '-d',
    JSON.stringify(payload),
    '-o',
    'json',
  ]);
}

function parseIncidentID(output) {
  const jsonStart = output.indexOf('{');
  if (jsonStart === -1) {
    throw new Error(`Unable to parse gcx incident create response:\n${output}`);
  }
  const parsed = JSON.parse(output.slice(jsonStart));
  return parsed?.metadata?.name || parsed?.spec?.incidentID || parsed?.incident?.incidentID;
}

function createIncident(incident) {
  const output = run(['irm', 'incidents', 'create', '-f', incident.file, '-o', 'json']);
  const id = parseIncidentID(output);
  if (!id) {
    throw new Error(`Create response did not contain an incident ID for ${incident.title}`);
  }
  return id;
}

function updateEventTimes(incidentID, incident) {
  api('IncidentsService.UpdateIncidentEventTime', {
    incidentID,
    eventName: 'incidentStart',
    activityItemKind: 'incidentStart',
    eventTime: incident.start,
  });
  api('IncidentsService.UpdateIncidentEventTime', {
    incidentID,
    eventName: 'incidentEnd',
    activityItemKind: 'incidentEnd',
    eventTime: incident.end,
  });
}

function configureIncident(incidentID, incident) {
  api('IncidentsService.UpdateSeverity', {
    incidentID,
    severity: incident.severity,
  });

  for (const [key, label] of Object.entries(incident.labels)) {
    api('IncidentsService.AddLabel', {
      incidentID,
      label: { key, label },
    });
  }

  updateEventTimes(incidentID, incident);
  run(['irm', 'incidents', 'activity', 'add', incidentID, '--body', `Resolution summary: ${incident.resolution}`]);
  run(['irm', 'incidents', 'close', incidentID]);
  updateEventTimes(incidentID, incident);
}

function getIncident(incidentID) {
  return JSON.parse(run(['irm', 'incidents', 'get', incidentID, '-o', 'json']));
}

function validateIncident(remote, incident) {
  const spec = remote.spec;
  const labels = new Map((spec.labels || []).map((label) => [label.key, label.label]));
  const missingLabels = Object.entries(incident.labels)
    .filter(([key, value]) => labels.get(key) !== value)
    .map(([key, value]) => `${key}:${value}`);

  const errors = [];
  if (spec.status !== 'resolved') errors.push(`status=${spec.status}`);
  if (spec.severity !== incident.severity) errors.push(`severity=${spec.severity}`);
  if (spec.incidentStart !== incident.start) errors.push(`start=${spec.incidentStart}`);
  if (spec.incidentEnd !== incident.end) errors.push(`end=${spec.incidentEnd}`);
  if (missingLabels.length > 0) errors.push(`missing labels=${missingLabels.join(', ')}`);

  return errors;
}

for (const incident of incidents) {
  const incidentID =
    firstExistingIncidentID && incident.sequence === 1 ? firstExistingIncidentID : createIncident(incident);

  configureIncident(incidentID, incident);
  const remote = getIncident(incidentID);
  const validationErrors = validateIncident(remote, incident);
  const result = {
    sequence: incident.sequence,
    type: incident.type,
    date: incident.date,
    title: incident.title,
    id: incidentID,
    status: remote.spec.status,
    severity: remote.spec.severity,
    start: remote.spec.incidentStart,
    end: remote.spec.incidentEnd,
    labels: Object.fromEntries((remote.spec.labels || []).map((label) => [label.key, label.label])),
    validation: validationErrors.length === 0 ? 'passed' : 'failed',
    validationErrors,
  };
  results.push(result);
  console.log(`${result.validation}: ${incidentID} ${incident.title}`);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);

const counts = results.reduce((acc, result) => {
  acc[result.type] = (acc[result.type] || 0) + 1;
  return acc;
}, {});
const lines = [
  '# Grafana IRM Incident Push Results',
  '',
  `Pushed at: ${new Date().toISOString()}`,
  '',
  `Total incidents: ${results.length}`,
  `Holiday incidents: ${counts.holiday || 0}`,
  `Monthly placeholder incidents: ${counts.placeholder || 0}`,
  '',
  '| ID | Type | Date | Title | Validation |',
  '| --- | --- | --- | --- | --- |',
  ...results.map((result) =>
    `| ${result.id} | ${result.type} | ${result.date} | ${result.title.replaceAll('|', '\\|')} | ${result.validation} |`
  ),
  '',
];
writeFileSync(summaryPath, `${lines.join('\n')}\n`);

const failures = results.filter((result) => result.validation !== 'passed');
if (failures.length > 0) {
  console.error(`Validation failed for ${failures.length} incidents. See ${outputPath}`);
  process.exit(1);
}
