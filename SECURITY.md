# Security Policy

## Supported versions

Security fixes are applied to the current `main` branch and future tagged releases.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub to the repository owner. Avoid posting public issues that include working exploit details, private tokens, or bypass payloads.

## Scope

In scope:

- false negatives for supported secret patterns;
- unsafe handling of file paths or repository contents;
- GitHub Action behavior that could expose secrets in logs;
- dependency or packaging issues affecting CLI/action execution.

Out of scope:

- unsupported secret formats not documented by the project;
- intentionally suppressed findings using `slopguard-ignore`;
- missing SPDX warnings in generated files unless they affect the scanner itself.

## Disclosure posture

SlopGuard is a defensive tool. Reports should include a minimal reproduction and avoid sharing real credentials.
