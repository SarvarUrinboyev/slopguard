// SPDX-License-Identifier: MIT
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { s5License, hasSpdxHeader, isLicenseFilename } from '../src/checks/s5-license.js';

const here = path.dirname(fileURLToPath(import.meta.url));

test('hasSpdxHeader detects a header in the first lines', () => {
  assert.equal(hasSpdxHeader('// SPDX-License-Identifier: MIT\ncode'), true);
  assert.equal(hasSpdxHeader('no header here\njust code'), false);
});

test('hasSpdxHeader ignores headers buried past the header window', () => {
  const buried = Array(20).fill('x').join('\n') + '\n// SPDX-License-Identifier: MIT';
  assert.equal(hasSpdxHeader(buried), false);
});

test('isLicenseFilename recognizes common names', () => {
  assert.equal(isLicenseFilename('LICENSE'), true);
  assert.equal(isLicenseFilename('license.md'), true);
  assert.equal(isLicenseFilename('COPYING'), true);
  assert.equal(isLicenseFilename('readme.md'), false);
});

test('S5 passes a well-formed project', async () => {
  const root = path.join(here, 'fixtures', 'ok');
  const findings = await s5License({ root, srcDir: 'src' });
  assert.equal(findings.length, 0, JSON.stringify(findings));
});

test('S5 flags a missing license and missing SPDX headers', async () => {
  const root = path.join(here, 'fixtures', 'bad');
  const findings = await s5License({ root, srcDir: 'src' });
  assert.ok(findings.some((f) => f.rule === 'missing-license-file'));
  assert.ok(findings.some((f) => f.rule === 'missing-spdx-header'));
});
