# Static analysis comparison — injected errors

This report summarises which static analyzers detected the intentionally injected issues (file: `analysis/injected_errors/static_errors.js`).

## Run artifacts
- ESLint (full project): `analysis/reports/eslint_all.json`
- ESLint (injected file): `analysis/reports/eslint_injected.json`
- JSHint (full project): `analysis/reports/jshint_all.txt`
- JSHint (injected file): `analysis/reports/jshint_injected.txt`
- Original ESLint report: `analysis/reports/eslint.json`

## Injected issues and detection

1) Use of eval()
  - Description: `eval(code)` in `useEvalExample` — security/bad-practice.
  - Detected by:
    - ESLint: NO (no `no-eval` warning in `eslint_all.json`)
    - JSHint: YES (`eval can be harmful.` in `jshint_all.txt`)

2) SQL string concatenation
  - Description: string concatenation in `vulnerableSql(orderBy)`.
  - Detected by:
    - ESLint: NO
    - JSHint: NO

3) Assignment in condition
  - Description: `if (a = 1)` — logical error.
  - Detected by:
    - ESLint: NO
    - JSHint: YES (`Expected a conditional expression and instead saw an assignment.`)

4) Empty catch (swallowing errors)
  - Description: empty `catch (e) {}` block.
  - Detected by:
    - ESLint: NO
    - JSHint: NO

5) Memory accumulation (leak pattern)
  - Description: appending large arrays to module-global `_leakArray`.
  - Detected by:
    - ESLint: NO
    - JSHint: NO

## Notes and interpretation
- JSHint detected two of the injected issues (eval usage and assignment-in-condition). ESLint (with the current config) did not flag these security/logic patterns — ESLint configuration may not include security-focused plugins (e.g. eslint-plugin-security) or specific rules like `no-eval` or `no-cond-assign`.
- Some patterns (SQL concatenation, empty catch, memory growth) are better found by specialized tools (Semgrep, security scanners, or dynamic memory analysers) rather than basic linters.
- Recommendation: add `eslint-plugin-security` or include Semgrep with rules for SQL injection/empty-catch patterns to improve static detection coverage.

## Raw reports (kept in `analysis/reports/`)
- `eslint_all.json`, `eslint_injected.json`, `jshint_all.txt`, `jshint_injected.txt`, `npm_audit.json`
