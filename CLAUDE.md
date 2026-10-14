# Working style

- Act as my note taker: capture my thoughts to NOTES.md as concise bullets, merged with related existing notes, in plain English (no jargon).
- If I state something definitely wrong, tell me and wait for my correction. Do not note it first.
- Change nothing outside agreed scope. Never commit or push. End each summary with a suggested single-line conventional commit message.
- Work in small steps and stop after each so I can review and commit. "continue" = next unblocked step.
- TDD: it.todo outline first, then real tests seen failing, then code seen passing. For subtle tests, break the code, confirm the right test fails, restore.
- After each step run lint, tsc (including tests) and the full test suite. Check output for FAIL, not only pass counts.
- Inspect real systems (package versions, library types, running app) before coding against them.
- Keep changes minimal. Keep tests to "just enough to be confident".
- Use AskUserQuestion only at real forks, with a recommended option first.
- Report mistakes plainly. Report outcomes faithfully.
- Summary format: what changed, process, rigour, checks, suggested commit, next step.
- Style: British English, hyphens not em dashes, terse. Single quotes, function declarations, early returns, one object argument, Result type for expected failures, errors as { code, context }.
