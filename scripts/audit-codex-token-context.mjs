#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

function usage() {
  console.error(
    [
      'Usage: node scripts/audit-codex-token-context.mjs <session-jsonl> [options]',
      '',
      'Options:',
      '  --top <n>                    Number of largest entries to show (default: 10)',
      '  --warn-output-chars <n>      Warn when a tool output exceeds this size (default: 20000)',
      '  --warn-input-tokens <n>      Warn when a model call exceeds this input size (default: 120000)',
      '  --fail-on-warning            Exit non-zero when warnings are found',
      '  --json                       Emit JSON instead of Markdown',
    ].join('\n')
  );
}

const args = process.argv.slice(2);
const sessionPath = args.find((arg) => !arg.startsWith('--'));

if (!sessionPath || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(sessionPath ? 0 : 2);
}

function optionNumber(name, defaultValue) {
  const index = args.indexOf(name);
  if (index === -1) return defaultValue;
  const raw = args[index + 1];
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    console.error(`Invalid ${name}: ${raw}`);
    process.exit(2);
  }
  return value;
}

const topN = optionNumber('--top', 10);
const warnOutputChars = optionNumber('--warn-output-chars', 20_000);
const warnInputTokens = optionNumber('--warn-input-tokens', 120_000);
const emitJson = args.includes('--json');
const failOnWarning = args.includes('--fail-on-warning');

const lines = readFileSync(sessionPath, 'utf8')
  .split('\n')
  .filter((line) => line.trim().length > 0);

const records = lines.map((line, index) => {
  try {
    return { line: index + 1, ...JSON.parse(line) };
  } catch (error) {
    throw new Error(`Unable to parse ${sessionPath}:${index + 1}: ${error.message}`);
  }
});

function contentTextLength(content) {
  if (!content) return 0;
  if (typeof content === 'string') return content.length;
  if (Array.isArray(content)) {
    return content.reduce((total, item) => total + (item.text || item.input_text || item.output_text || '').length, 0);
  }
  return JSON.stringify(content).length;
}

function payloadTextLength(record) {
  const payload = record.payload || {};
  if (payload.type === 'message') return contentTextLength(payload.content);
  if (payload.type === 'function_call_output') return (payload.output || '').length;
  if (payload.type === 'function_call') return (payload.name || '').length + (payload.arguments || '').length;
  if (payload.type === 'reasoning') return (payload.encrypted_content || '').length;
  return JSON.stringify(payload).length;
}

function preview(text, max = 160) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .slice(0, max);
}

const tokenEvents = records
  .filter((record) => record.type === 'event_msg' && record.payload?.type === 'token_count')
  .map((record, index) => {
    const last = record.payload.info.last_token_usage;
    const total = record.payload.info.total_token_usage;
    return {
      line: record.line,
      timestamp: record.timestamp,
      turn: index + 1,
      input_tokens: last.input_tokens,
      cached_input_tokens: last.cached_input_tokens,
      uncached_input_tokens: last.input_tokens - last.cached_input_tokens,
      output_tokens: last.output_tokens,
      reasoning_output_tokens: last.reasoning_output_tokens,
      total_tokens: last.total_tokens,
      cumulative_input_tokens: total.input_tokens,
      cumulative_output_tokens: total.output_tokens,
      model_context_window: record.payload.info.model_context_window,
    };
  });

const toolOutputs = records
  .filter((record) => record.payload?.type === 'function_call_output')
  .map((record) => {
    const output = record.payload.output || '';
    const tokenMatch = output.match(/Original token count: (\d+)/);
    return {
      line: record.line,
      timestamp: record.timestamp,
      call_id: record.payload.call_id,
      chars: output.length,
      original_tool_tokens: tokenMatch ? Number(tokenMatch[1]) : null,
      preview: preview(output),
    };
  })
  .sort((left, right) => right.chars - left.chars);

const messages = records
  .filter((record) => record.payload?.type === 'message')
  .map((record) => ({
    line: record.line,
    timestamp: record.timestamp,
    role: record.payload.role,
    phase: record.payload.phase || '',
    chars: payloadTextLength(record),
    preview: preview(JSON.stringify(record.payload.content)),
  }))
  .sort((left, right) => right.chars - left.chars);

const byType = {};
const byRole = {};
for (const record of records) {
  const payload = record.payload || {};
  const key = payload.type || record.type;
  byType[key] = (byType[key] || 0) + payloadTextLength(record);

  if (payload.type === 'message') {
    const roleKey = `${payload.role}${payload.phase ? `:${payload.phase}` : ''}`;
    byRole[roleKey] = (byRole[roleKey] || 0) + payloadTextLength(record);
  }
}

const first = tokenEvents[0] || null;
const latest = tokenEvents[tokenEvents.length - 1] || null;
const warnings = [
  ...tokenEvents
    .filter((event) => event.input_tokens >= warnInputTokens)
    .map((event) => ({
      type: 'model_input_tokens',
      line: event.line,
      value: event.input_tokens,
      threshold: warnInputTokens,
    })),
  ...toolOutputs
    .filter((output) => output.chars >= warnOutputChars)
    .map((output) => ({
      type: 'tool_output_chars',
      line: output.line,
      call_id: output.call_id,
      value: output.chars,
      threshold: warnOutputChars,
    })),
];

const report = {
  session: sessionPath,
  file: basename(sessionPath),
  lines: lines.length,
  token_event_count: tokenEvents.length,
  first,
  latest,
  input_growth: first && latest ? latest.input_tokens / first.input_tokens : null,
  output_growth: first && latest ? latest.output_tokens / first.output_tokens : null,
  latest_input_output_ratio: latest && latest.output_tokens ? latest.input_tokens / latest.output_tokens : null,
  latest_cached_input_share: latest && latest.input_tokens ? latest.cached_input_tokens / latest.input_tokens : null,
  byType,
  byRole,
  top_tool_outputs: toolOutputs.slice(0, topN),
  top_messages: messages.slice(0, topN),
  warnings,
};

if (emitJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(failOnWarning && warnings.length > 0 ? 1 : 0);
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

console.log(`# Codex Context Audit: ${basename(sessionPath)}`);
console.log('');
console.log(`Lines: ${formatNumber(lines.length)}`);
console.log(`Token count events: ${formatNumber(tokenEvents.length)}`);

if (first && latest) {
  console.log('');
  console.log('## Token Trend');
  console.log('');
  console.log(`First input tokens: ${formatNumber(first.input_tokens)}`);
  console.log(`Latest input tokens: ${formatNumber(latest.input_tokens)}`);
  console.log(`Input growth: ${formatNumber(report.input_growth)}x`);
  console.log(`Latest output tokens: ${formatNumber(latest.output_tokens)}`);
  console.log(`Latest input/output ratio: ${formatNumber(report.latest_input_output_ratio)}:1`);
  console.log(`Latest cached input share: ${formatNumber(report.latest_cached_input_share * 100)}%`);
  console.log(`Latest uncached input tokens: ${formatNumber(latest.uncached_input_tokens)}`);
  console.log(`Cumulative input tokens: ${formatNumber(latest.cumulative_input_tokens)}`);
  console.log(`Cumulative output tokens: ${formatNumber(latest.cumulative_output_tokens)}`);
}

console.log('');
console.log('## Largest Tool Outputs');
console.log('');
console.log('| Line | Chars | Original tool tokens | Call ID | Preview |');
console.log('| --- | ---: | ---: | --- | --- |');
for (const output of report.top_tool_outputs) {
  console.log(
    `| ${output.line} | ${formatNumber(output.chars)} | ${formatNumber(output.original_tool_tokens)} | ${output.call_id || ''} | ${output.preview.replaceAll('|', '\\|')} |`
  );
}

console.log('');
console.log('## Largest Messages');
console.log('');
console.log('| Line | Role | Phase | Chars | Preview |');
console.log('| --- | --- | --- | ---: | --- |');
for (const message of report.top_messages) {
  console.log(
    `| ${message.line} | ${message.role || ''} | ${message.phase || ''} | ${formatNumber(message.chars)} | ${message.preview.replaceAll('|', '\\|')} |`
  );
}

console.log('');
console.log('## Warnings');
console.log('');
if (warnings.length === 0) {
  console.log('No configured thresholds were exceeded.');
} else {
  for (const warning of warnings) {
    const call = warning.call_id ? ` (${warning.call_id})` : '';
    console.log(`- ${warning.type} at line ${warning.line}${call}: ${formatNumber(warning.value)} >= ${formatNumber(warning.threshold)}`);
  }
}

process.exit(failOnWarning && warnings.length > 0 ? 1 : 0);
