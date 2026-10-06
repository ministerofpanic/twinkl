# Notes

## Setup / process

- Set up git, publish as private GitHub repo until ready to expose
- Check deps for known vulnerabilities (audit); cooling period guards against unknown/malicious releases
- Update all dependencies to latest, with 5 day cooling period to avoid freshly published malicious releases
- Requirements are very clear, which suits TDD

## Decisions

- Existing deps left as-is: provided scaffold lint stack (airbnb configs cap eslint 8 / typescript-eslint 7) blocks "all latest", and Twinkl may be constrained to these versions
- New deps (zod, express-zod-api) pinned exact, past cooling period; `.npmrc` sets `min-release-age=5` and `save-exact=true`
- express-zod-api glues express and zod (typed endpoints, input parsing, error responses)
- express-zod-api 23+ requires express 5, scaffold is express 4, so used v22.14.1 (last express 4 support); it needs zod 3, so zod 3.25.76 (latest 3.x) not 4. Trade-off: older majors, upgrade path is express 5 + zod 4 + express-zod-api latest
- Using npm (explicitly called out in the task README), not pnpm
- Data store: in-memory over SQLite or equivalent - pragmatic, avoids extra libraries/complexity
- uuid ids: unguessable, mitigates enumeration; Broken Object Level Authorisation (BOLA) (OWASP API1:2019) not solved without auth

## AI usage

- Grace confirmed AI use is ok at this stage
- Want to stay in control and refresh coding skills, so leaning on it less
- AI used for: note taking (documenting thinking process) and skeleton tests only

## Design

- Validation: "parse, don't validate" - parse shape at the boundary with zod
- Control flow via Result type, avoid relying on exceptions (can throw anything)
- Error structure: `{ code, context }`

## Code style

- Return early pattern
- Small single-purpose functions, easier to reason about in review
- Single function argument (object): avoids inconsistent max-args advice, simpler to modify from callsites

## Approach

- Add zod, define user schema
- POST endpoint: schema as input, returns user id (uuid) with 201, or error object
- GET endpoint: uuid as input, returns user object or error object
- Refine documentation last
