// SPDX-License-Identifier: MIT
// S1 — Secret scan. Flags high-confidence credential patterns committed to source.
import path from 'node:path';
import { walkFiles, isBinaryPath, readTextFile } from '../lib/scan.js';

// High-confidence rules only (kept deliberately tight to avoid false positives).
export const SECRET_RULES = [
  { id: 'aws-access-key-id', label: 'AWS Access Key ID', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'aws-secret-access-key', label: 'AWS Secret Access Key', re: /\baws_secret_access_key\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/i },
  { id: 'github-pat', label: 'GitHub Personal Access Token', re: /\bghp_[A-Za-z0-9]{36}\b/ },
  { id: 'github-fine-grained-pat', label: 'GitHub Fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}\b/ },
  { id: 'github-oauth', label: 'GitHub OAuth token', re: /\bgho_[A-Za-z0-9]{36}\b/ },
  { id: 'anthropic-key', label: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { id: 'openai-key', label: 'OpenAI API key', re: /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { id: 'slack-token', label: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'google-api-key', label: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'stripe-secret-key', label: 'Stripe secret key', re: /\bsk_live_[0-9a-zA-Z]{24,}\b/ },
  { id: 'private-key-block', label: 'private key block', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ }
];

// Lines containing any of these are skipped (inline opt-out + obvious placeholders).
const IGNORE_MARKERS = [/slopguard-ignore/i, /slopguard:ignore/i];
const PLACEHOLDER_MARKERS = [/EXAMPLE/, /\bplaceholder\b/i, /<your-/i, /YOUR_[A-Z]/, /\bxxxx+\b/i, /\bredacted\b/i];

export function lineShouldIgnore(line) {
  return IGNORE_MARKERS.some((re) => re.test(line)) ||
         PLACEHOLDER_MARKERS.some((re) => re.test(line));
}

/** Scan a single line; returns an array of { rule, label, column } hits. */
export function findSecretsInLine(line) {
  if (lineShouldIgnore(line)) return [];
  const hits = [];
  for (const rule of SECRET_RULES) {
    const m = rule.re.exec(line);
    if (m) hits.push({ rule: rule.id, label: rule.label, column: (m.index ?? 0) + 1 });
  }
  return hits;
}

/** Scan multi-line text; returns hits with 1-based line numbers. */
export function findSecretsInText(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const hit of findSecretsInLine(lines[i])) {
      out.push({ ...hit, line: i + 1 });
    }
  }
  return out;
}

/**
 * Run S1 across every text file under `root`.
 * Returns an array of finding objects.
 */
export async function s1Secrets({ root = '.' } = {}) {
  const findings = [];
  const files = await walkFiles(root);
  for (const file of files) {
    if (isBinaryPath(file)) continue;
    const text = await readTextFile(file);
    if (text == null) continue;
    const rel = path.relative(root, file) || path.basename(file);
    for (const hit of findSecretsInText(text)) {
      findings.push({
        check: 'S1',
        rule: hit.rule,
        severity: 'error',
        file: rel.split(path.sep).join('/'),
        line: hit.line,
        column: hit.column,
        message: `Possible ${hit.label} committed to source (rule ${hit.rule}). Add "slopguard-ignore" if intentional.`
      });
    }
  }
  return findings;
}
