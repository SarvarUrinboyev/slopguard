// SPDX-License-Identifier: MIT
// GitHub Action entry point. Reads INPUT_* env vars, runs checks, emits
// annotations + a job summary, and fails the job on violations.
import process from 'node:process';
import { appendFileSync } from 'node:fs';
import { runChecks, shouldFail } from './index.js';
import { formatReport } from './lib/report.js';

// Minimal stand-in for @actions/core getInput (keeps the action dependency-free).
function getInput(name, fallback = '') {
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const val = process.env[key];
  return val === undefined || val === '' ? fallback : val.trim();
}

function annotate(f) {
  const level = f.severity === 'warning' ? 'warning' : 'error';
  const props = [`file=${f.file}`];
  if (f.line) props.push(`line=${f.line}`);
  if (f.column) props.push(`col=${f.column}`);
  const msg = String(f.message).replace(/\r?\n/g, ' ');
  process.stdout.write(`::${level} ${props.join(',')}::${msg}\n`);
}

function writeSummary(result) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  const lines = ['## slopguard', ''];
  if (result.findings.length === 0) {
    lines.push('No issues found (S1 secrets, S5 license).');
  } else {
    lines.push(`Found **${result.summary.total}** issue(s).`, '');
    lines.push('| Check | Location | Message |', '| --- | --- | --- |');
    for (const f of result.findings) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      const msg = String(f.message).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
      lines.push(`| ${f.check} | \`${loc}\` | ${msg} |`);
    }
  }
  try {
    appendFileSync(file, lines.join('\n') + '\n');
  } catch {
    /* summary is best-effort */
  }
}

const opts = {
  root: getInput('path', '.'),
  srcDir: getInput('src-dir', 'src'),
  failOn: getInput('fail-on', 'error')
};

const result = await runChecks(opts);

process.stdout.write(formatReport(result) + '\n');
for (const f of result.findings) annotate(f);
writeSummary(result);

process.exit(shouldFail(result.findings, opts.failOn) ? 1 : 0);
