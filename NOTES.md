# Notes

## Setup / process

- Set up git, publish as private GitHub repo until ready to expose
- Check deps for known vulnerabilities (audit); cooling period guards against unknown/malicious releases
- Update all dependencies to latest, with 5 day cooling period to avoid freshly published malicious releases
- Using npm (explicitly called out in the task README), not pnpm
- Requirements are very clear, which suits TDD

## AI usage

- Grace confirmed AI use is ok at this stage
- Want to stay in control and refresh coding skills, so leaning on it less
- AI used for: note taking (documenting thinking process) and skeleton tests only

## Design

- Validation: "parse, don't validate" - parse shape at the boundary with zod
- Control flow via Result type, avoid relying on exceptions (can throw anything)
