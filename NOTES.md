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
- Error structure: `{ code, context }`
- Data store: in-memory over SQLite or equivalent - pragmatic, avoids extra libraries/complexity

## Code style

- Return early pattern
- Small single-purpose functions, easier to reason about in review
- Single function argument (object): avoids inconsistent max-args advice, simpler to modify from callsites

## Approach

- Add zod, define user schema
- POST endpoint: schema as input, returns user id (uuid) with 201, or error object
- GET endpoint: uuid as input, returns user object or error object
- Refine documentation last
- uuid ids: unguessable, mitigates enumeration; Broken Object Level Authorisation (BOLA) (OWASP API1:2019) not solved without auth
