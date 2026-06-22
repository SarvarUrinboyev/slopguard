// SPDX-License-Identifier: MIT
// slopguard orchestrator — runs the enabled checks and aggregates findings.
import { s1Secrets } from './checks/s1-secrets.js';
import { s5License } from './checks/s5-license.js';

const SEVERITY_RANK = { warning: 1, error: 2 };

export async function runChecks({ root = '.', srcDir = 'src' } = {}) {
  const [s1, s5] = await Promise.all([
    s1Secrets({ root }),
    s5License({ root, srcDir })
  ]);

  const findings = [...s1, ...s5];
  const summary = {
    total: findings.length,
    bySeverity: countBy(findings, 'severity'),
    byCheck: countBy(findings, 'check')
  };
  return { findings, summary };
}

/** True if any finding meets/exceeds the configured fail threshold. */
export function shouldFail(findings, failOn = 'error') {
  if (failOn === 'never') return false;
  const threshold = failOn === 'warning' ? SEVERITY_RANK.warning : SEVERITY_RANK.error;
  return findings.some((f) => (SEVERITY_RANK[f.severity] ?? SEVERITY_RANK.error) >= threshold);
}

function countBy(arr, key) {
  const out = {};
  for (const item of arr) out[item[key]] = (out[item[key]] ?? 0) + 1;
  return out;
}

export { s1Secrets, s5License };
