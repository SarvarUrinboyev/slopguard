#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// slopguard CLI — local entry point. Mirrors the GitHub Action behavior.
import process from 'node:process';
import { runChecks, shouldFail } from '../src/index.js';
import { formatReport } from '../src/lib/report.js';

const HELP = `slopguard — guard your repo against AI slop

Usage: slopguard [options]

Options:
  -p, --path <dir>      Root directory to scan (default ".")
      --src-dir <dir>   Directory checked for SPDX headers (default "src")
      --fail-on <lvl>   error | warning | never (default "error")
  -h, --help            Show this help

Checks:
  S1  secret scan    AWS / GitHub / OpenAI / Anthropic / Slack / Google / Stripe
                     keys and private-key blocks
  S5  license/SPDX   root LICENSE file + SPDX-License-Identifier headers in src/

Exit code: 1 if any finding meets --fail-on, else 0.
`;

function parseArgs(argv) {
  const opts = { root: '.', srcDir: 'src', failOn: 'error', help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--path' || a === '-p') opts.root = argv[++i];
    else if (a === '--src-dir') opts.srcDir = argv[++i];
    else if (a === '--fail-on') opts.failOn = argv[++i];
    else if (a === '--help' || a === '-h') opts.help = true;
    else {
      process.stderr.write(`slopguard: unknown argument "${a}"\n`);
      process.exit(2);
    }
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

const result = await runChecks(opts);
process.stdout.write(formatReport(result) + '\n');
process.exit(shouldFail(result.findings, opts.failOn) ? 1 : 0);
