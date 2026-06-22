// SPDX-License-Identifier: MIT
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSecretsInText, findSecretsInLine } from '../src/checks/s1-secrets.js';

// Keys are split so slopguard's own self-scan never flags this test file's source.
const fakeAwsKey = 'AKIA' + 'ABCDEFGHIJ123456';

test('S1 detects an AWS access key id', () => {
  const hits = findSecretsInText(`const k = "${fakeAwsKey}";`);
  assert.ok(hits.some((h) => h.rule === 'aws-access-key-id'), 'should flag AWS key');
});

test('S1 detects a private key block', () => {
  const hits = findSecretsInLine('-----BEGIN RSA PRIVATE KEY-----'); // slopguard-ignore
  assert.ok(hits.some((h) => h.rule === 'private-key-block'));
});

test('S1 reports correct 1-based line numbers', () => {
  const hits = findSecretsInText(`line one\nline two\nconst k = "${fakeAwsKey}";`);
  assert.equal(hits[0].line, 3);
});

test('S1 ignores documented EXAMPLE placeholders', () => {
  const hits = findSecretsInLine('AWS key AKIAIOSFODNN7EXAMPLE here');
  assert.equal(hits.length, 0);
});

test('S1 respects the slopguard-ignore marker', () => {
  const hits = findSecretsInLine(`const k = "${fakeAwsKey}"; // slopguard-ignore`);
  assert.equal(hits.length, 0);
});

test('S1 does not flag ordinary code', () => {
  const hits = findSecretsInText('export function add(a, b) {\n  return a + b;\n}\n');
  assert.equal(hits.length, 0);
});
