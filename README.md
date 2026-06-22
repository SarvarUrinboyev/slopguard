# SlopGuard

[![CI](https://github.com/SarvarUrinboyev/slopguard/actions/workflows/slopguard.yml/badge.svg)](https://github.com/SarvarUrinboyev/slopguard/actions/workflows/slopguard.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Guard your repository against **AI slop** in CI. A zero-dependency GitHub
Action (and CLI) that runs two checks and fails the build on violations.

| Check | Name | What it flags |
| ----- | ---- | ------------- |
| **S1** | Secret scan | AWS / GitHub / OpenAI / Anthropic / Slack / Google / Stripe keys and private-key blocks committed to source. |
| **S5** | License / SPDX | A missing root `LICENSE` file, and source files under `src/` lacking an `SPDX-License-Identifier:` header. |

This is the MVP skeleton: **S1 + S5 + log output**, exit `1` on findings.

## Use as a GitHub Action

```yaml
# .github/workflows/slopguard.yml
name: slopguard
on: [pull_request]
permissions:
  contents: read
jobs:
  slopguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: SarvarUrinboyev/slopguard@v0
        with:
          path: '.'         # root to scan
          src-dir: 'src'     # dir checked for SPDX headers
          fail-on: 'error'   # error | warning | never
```

Findings appear three ways: in the step **log**, as inline **annotations**
(`::error file=...,line=...::`), and in the **job summary**.

## Use locally (CLI)

```bash
node bin/slopguard.js --path . --src-dir src --fail-on error
# or, once published:
npx slopguard --path .
```

```
slopguard — AI slop guard
==========================================
x  [S1 secret scan] config.js:12 — Possible AWS Access Key ID committed to source (rule aws-access-key-id). ...
x  [S5 license/SPDX] src/util.js:1 — Missing "SPDX-License-Identifier:" header in first 15 lines.
------------------------------------------
Total: 2 issue(s) [S1=1, S5=1]
```

## Options

| Option | Default | Meaning |
| ------ | ------- | ------- |
| `--path` / `path` | `.` | Root directory to scan. |
| `--src-dir` / `src-dir` | `src` | Directory checked for SPDX headers (S5). |
| `--fail-on` / `fail-on` | `error` | Severity that fails the run: `error`, `warning`, or `never`. |

## Suppressing false positives

Add `slopguard-ignore` anywhere on a line to skip it for the secret scan.
Obvious placeholders (`EXAMPLE`, `YOUR_…`, `<your-…>`, `xxxx`, `redacted`) are
skipped automatically.

## Develop

```bash
npm test   # node --test
```

## License

MIT — see [LICENSE](LICENSE).
