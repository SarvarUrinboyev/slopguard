// SPDX-License-Identifier: MIT
// Human-readable console report.
const CHECK_NAMES = {
  S1: 'secret scan',
  S5: 'license/SPDX'
};

export function formatReport({ findings, summary }) {
  const lines = [];
  lines.push('slopguard — AI slop guard');
  lines.push('='.repeat(42));

  if (findings.length === 0) {
    lines.push('OK  No issues found (S1 secrets, S5 license).');
    return lines.join('\n');
  }

  for (const f of findings) {
    const loc = f.line ? `${f.file}:${f.line}` : f.file;
    lines.push(`x  [${f.check} ${CHECK_NAMES[f.check] ?? ''}] ${loc} — ${f.message}`);
  }

  lines.push('-'.repeat(42));
  const byCheck = Object.entries(summary.byCheck)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  lines.push(`Total: ${summary.total} issue(s) [${byCheck}]`);
  return lines.join('\n');
}
