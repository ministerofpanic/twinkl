# Notes

## Setup / process

- Set up git, publish as private GitHub repo until ready to expose
- Requirements are very clear, which suits TDD

## Decisions

- Existing deps left as-is: provided scaffold lint stack (airbnb configs cap eslint 8 / typescript-eslint 7) blocks "all latest", and Twinkl may be constrained to these versions. `npm audit` reports 20 known vulnerabilities (1 critical, proxy-addr) in scaffold deps, left as-is
- New deps (zod, express-zod-api) pinned exact, past cooling period; `.npmrc` sets `min-release-age=5` (5 day cooling period guards against unknown/malicious releases) and `save-exact=true`
- express-zod-api glues express and zod (typed endpoints, input parsing, error responses)
- express-zod-api 23+ requires express 5, scaffold is express 4, so used v22.14.1 (last express 4 support); it needs zod 3, so zod 3.25.76 (latest 3.x) not 4. Trade-off: older majors
- Using npm (explicitly called out in the task README), not pnpm
- Linting: scaffold's `lint` script had no config, so `npm run lint` failed. Added `.eslintrc.json` (airbnb-base + airbnb-typescript/base, the scaffold's stack) and `tsconfig.eslint.json` so test files (excluded from the build) are linted too. Style follows airbnb (single quotes, 100 col)
- Lint rule changes: `@typescript-eslint/no-redeclare` off (zod idiom of a schema const and inferred type sharing a name, `tsc` still catches real redeclarations); `import/prefer-default-export` off (named exports compose with `import * as User`); `func-style: declaration` (functions are declarations, e.g. `export function clear() { ... }`, which also flags arrow functions assigned to variables; inline callbacks stay arrows)
- Test runner: Vitest, pinned 4.1.11. Vitest 5 needs Node 22.12+ and `@types/node` 22+, scaffold has `@types/node` 20 and express-zod-api 22 supports Node 20, so 4.x is latest compatible. `npm test` runs `vitest run`
- `*.test.ts` excluded in `tsconfig.json` so tests don't compile into `dist`
- `createdDate`: client-supplied, keeping to the requirements (server-set would be safer, noted as tradeoff). Date only, `yyyy-mm-dd`, no time part to avoid additional complexity later related to timezones
- Duplicate emails prevented (case-insensitive, email lowercased when parsed). Returned as `validation_failed` (400) on the email path, not a distinct `email_taken` (409), so the response doesn't state the email is registered. Residual leak: 400 vs 201 still reveals it
- Passwords hashed, never stored as cleartext: Argon2id (OWASP recommended) via `hash-wasm` (WASM, no native binaries, CJS build, no deps). Would naturally choose `@node-rs/argon2` (native, faster) but chose `hash-wasm` to reduce risk of install failure on a reviewer's platform; hashing sits behind one small module so swapping is a one-file change
- Data store: in-memory over SQLite or equivalent - pragmatic, avoids extra libraries/complexity
- uuid ids: unguessable, mitigates enumeration; Broken Object Level Authorisation (BOLA) (OWASP API1:2019) not solved without auth (fix: see Future work)

## AI usage

- Grace confirmed AI use is ok at this stage
- Initially planned to lean on it less (note taking and skeleton tests only) to stay in control and refresh coding skills
- Changed at implementation: using Claude Code to implement, with TDD and minimal changes; design decisions, scope and review stay with me
- Process: small steps, each reviewed and committed by me. Skeleton tests first, implement to green, rigour check on subtle tests (break implementation, confirm test fails for the right reason, restore)

## Design

- Validation: "parse, don't validate" - parse shape at the boundary with zod
- Control flow via Result type, avoid relying on exceptions (can throw anything)
- Error structure: `{ code, context }`, a strict zod schema (`AppError`) in `core/errors.ts`, discriminated union by `code` so `context` is typed per code (`validation_failed`: issues with path and message; `user_not_found`: id; `not_found` for unknown routes and `internal_error` for unexpected exceptions, both with an empty strict context so nothing internal can leak)
- Error schema is the `negative` of the express-zod-api result handler, not an endpoint `output` (output is success only)
- `api/factories.ts`: express-zod-api endpoints factory with a custom result handler so every endpoint emits `{ code, context }` errors; endpoints build from it (verify v22 API when implementing). Later gains an authenticated factory (see Future work)

## Structure

- SST-inspired, flattened to one package: `src/core` (domain logic) and `src/api` (thin HTTP layer)
- Single package, not a monorepo: one deployable, nothing shared, simpler to run locally

```
src/
  core/
    result.ts
    errors.ts
    user/
      user.ts         # UserInput/UserOutput schemas, create(), fromId()
      password.ts     # hash()
      store.ts        # in-memory Map
      user.test.ts
  api/
    config.ts
    factories.ts      # endpoints factory, custom result handler
    routing.ts
    endpoints/
      signup.ts       # POST /users
      get-user.ts     # GET /users/:id
    api.test.ts
  index.ts
```

- `core` never imports `api`: one-way dependency, domain testable without HTTP
- Handlers only map Result to HTTP status, no business rules
- Two schemas defined with the domain: `UserInput` (signup, includes password) and `UserOutput` (never contains `password` or `passwordHash`); endpoints reuse them for input/output. Stored record additionally holds `passwordHash`
- Domain accessed as `User.create(...)` via `import * as User from '.../core/user/user'`, no barrel file (SST's namespace pattern without the extra module) and no TS `namespace` keyword (non-erasable syntax)
- Alternative considered: feature folder at top level (fewer folders now, scales less well with a second domain)

## Code style

- Return early pattern
- Small single-purpose functions, easier to reason about in review
- Single function argument (object): avoids inconsistent max-args advice, simpler to modify from callsites

## Approach

- POST endpoint (in progress): schema as input, returns user id (uuid) with 201, or error object
- GET endpoint: uuid as input, returns user object or error object
- Refine documentation last

## Future work

- Auth, split by concern:
  - Authentication in `api`: `api/middleware/auth.ts` (express-zod-api middleware, provides `{ requesterId }` or 401) and `api/factories.ts` (authenticated endpoints factory; `signup` stays public)
  - Authorisation in `core`: `User.fromId({ id, requesterId })` returns forbidden/not_found unless requester matches (or has role); resolves the BOLA tradeoff, testable without HTTP
  - New `core/auth/` domain (`session.ts`, `passkey.ts`, `store.ts`), middleware calls `Auth.verifySession({ token })`
- Auth file layout:

```
src/
  core/
    auth/                   # new
      session.ts            # verifySession({ token })
      passkey.ts            # credential registration/verification
      store.ts
    user/
      user.ts               # fromId({ id, requesterId }) enforces ownership
      password.ts
  api/
    middleware/
      auth.ts               # calls Auth.verifySession, provides { requesterId } or 401
    factories.ts            # authenticated endpoints factory
    endpoints/
      signup.ts             # stays on public factory
      get-user.ts           # moves to authenticated factory
```

- Passkeys replace passwords: `core/user/password.ts` goes away or shrinks
- Upgrade path for deps: express 5 + zod 4 + latest express-zod-api, and review scaffold vulnerabilities from `npm audit`
- Generate Swagger/OpenAPI docs from the zod schemas (express-zod-api `Documentation`), including the `AppError` negative responses per status code
