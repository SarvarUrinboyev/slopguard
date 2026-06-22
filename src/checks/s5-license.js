// SPDX-License-Identifier: MIT
// S5 — License / SPDX check. Requires a root LICENSE file and SPDX headers in source.
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { walkFiles, isBinaryPath, readTextFile } from '../lib/scan.js';

const LICENSE_FILENAMES = new Set([
  'license', 'license.md', 'license.txt', 'license.rst',
  'copying', 'copying.md', 'copying.txt', 'unlicense'
]);

const DEFAULT_SRC_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx']);
const SPDX_RE = /SPDX-License-Identifier:\s*\S+/;
const HEADER_LINES = 15;

export function isLicenseFilename(name) {
  return LICENSE_FILENAMES.has(name.toLowerCase());
}

export function hasSpdxHeader(text, headerLines = HEADER_LINES) {
  const head = text.split(/\r?\n/).slice(0, headerLines).join('\n');
  return SPDX_RE.test(head);
}

/**
 * Run S5: (1) a LICENSE file must exist at `root`; (2) every source file under
 * `root/srcDir` must carry an SPDX-License-Identifier header.
 */
export async function s5License({ root = '.', srcDir = 'src' } = {}) {
  const findings = [];

  // (1) Root LICENSE file present?
  let rootEntries = [];
  try {
    rootEntries = await readdir(root);
  } catch {
    /* unreadable root -> treated as missing license below */
  }
  if (!rootEntries.some(isLicenseFilename)) {
    findings.push({
      check: 'S5',
      rule: 'missing-license-file',
      severity: 'error',
      file: '.',
      line: 0,
      message: 'No LICENSE file found at repository root (expected LICENSE, LICENSE.md, COPYING, ...).'
    });
  }

  // (2) SPDX headers in source files under srcDir.
  const srcPath = path.join(root, srcDir);
  const files = await walkFiles(srcPath);
  for (const file of files) {
    if (isBinaryPath(file)) continue;
    if (!DEFAULT_SRC_EXT.has(path.extname(file).toLowerCase())) continue;
    const text = await readTextFile(file);
    if (text == null) continue;
    if (!hasSpdxHeader(text)) {
      const rel = path.relative(root, file) || path.basename(file);
      findings.push({
        check: 'S5',
        rule: 'missing-spdx-header',
        severity: 'error',
        file: rel.split(path.sep).join('/'),
        line: 1,
        message: `Missing "SPDX-License-Identifier:" header in first ${HEADER_LINES} lines.`
      });
    }
  }

  return findings;
}
