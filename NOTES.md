# Notes

## Setup / process

- Set up git, publish as a private GitHub repo until ready to share
- Requirements are very clear, so tests can be written first

## Decisions

- Existing packages from the starter project are left as they were. Its linting packages (airbnb) only work with older versions of eslint, so "update everything to latest" would break them, and Twinkl may depend on these versions. `npm audit` reports 20 known security problems (1 critical) in these starter packages, left as they are
- New packages (zod, express-zod-api, vitest, hash-wasm) are fixed to an exact version. `.npmrc` also blocks versions published in the last 5 days (`min-release-age=5`), so a freshly published malicious release can't be installed
- zod checks incoming data. express-zod-api connects Express to zod (input checking, error responses)
- express-zod-api v23 and later need Express 5, but the starter uses Express 4. So the project uses v22.14.1 (the last one for Express 4), which needs zod 3 (3.25.76). Trade-off: not the latest versions
- npm, not pnpm: the task README calls for npm
- Linting: the starter's `lint` command had no configuration, so it failed. Added one using the starter's own rules (airbnb), and it also checks test files. Style: single quotes, 100 characters per line
- Lint rules changed:
  - Off: the rule against a value and a type sharing a name (a common zod pattern; the compiler still catches real clashes)
  - Off: the rule preferring default exports (we use named exports)
  - On: functions are written as `function clear() { ... }`, not as arrow functions stored in variables. Short inline callbacks stay arrows
- Startup warning: `npm run dev` printed a deprecation warning from express-zod-api v22, which leaves a form-handling option unspecified. `api/config.ts` now sets it explicitly (the simple form parser, since this API only expects JSON).
- Test runner: Vitest 4.1.11. Vitest 5 needs a newer Node (22.12 or later) than the starter supports, so 4.x is the latest that fits. Run with `npm test`
- Test files are left out of the build so they don't end up in `dist`
- `createdDate` is supplied by the client, as the requirements say. Server-set would be safer, but that is not what was asked. Date only (`yyyy-mm-dd`), no time, to avoid time zone problems later
- Duplicate emails are rejected, ignoring upper or lower case. The response is a generic validation error (400, "Unable to use this email"), not a specific "already registered" error (409), so it doesn't confirm that an email is registered. This is only a partial fix: a 400 (rejected) versus a 201 (created) still tells someone whether the email exists. A full fix needs an email verification step, not built
- Passwords are never stored as typed. They are stored as a hash (a slow one-way scramble) using Argon2id, the OWASP recommendation. The package is `hash-wasm`: it works on every platform because it has no compiled parts. `@node-rs/argon2` would be my natural choice (faster) but could fail to install on a reviewer's machine. Hashing lives in one small file, so swapping is easy
- Data store: an in-memory list, not a database. Simple, and avoids extra packages
- User ids are random UUIDs, so they can't be guessed and someone can't loop through ids to find users. This does not stop someone who already has an id from reading that user. That needs a login (see Future work)

## AI usage

- Grace confirmed AI use is ok at this stage
- Initially planned to lean on it less (note taking and starter tests only) to stay in control and refresh coding skills
- Changed at implementation: using Claude Code to write the code, with tests first and minimal changes. Design decisions, scope and review stay with me
- Process: small steps, each reviewed and committed by me. Write the test, see it fail, write the code, see it pass. For tests that guard subtle behaviour, deliberately break the code, confirm the test fails for the right reason, then put it back

## Design

- Incoming data is checked and turned into the right shape at the edge (with zod) before any logic runs
- Expected failures (invalid input, duplicate email, user not found) are returned as values, not thrown. Throwing is kept for unexpected problems
- Every error has the same shape: `{ code, context }`. Codes:
  - `validation_failed`: a list of problems, each with the field and a message
  - `user_not_found`: the id
  - `not_found`: unknown web address, no extra data
  - `internal_error`: something unexpected, no extra data
  - The last two carry nothing extra so internal details can't leak. All four are defined once as a zod schema in `core/errors.ts`
- Errors are declared as the error response in express-zod-api, not as an endpoint's success output
- `api/factories.ts` holds the shared starting points for endpoints, and sends all errors in the same shape. There is one per success status we use: `http200Factory` (reads) and `http201Factory` (creates, e.g. signup). Error statuses don't need their own, and a new success status means a new one Later it gains a version that requires login (see Future work)
- Error handling in `api/factories.ts`:
  - An endpoint can only return a success value, so a domain failure is thrown inside a small wrapper at the endpoint and turned into the right status
  - Invalid input or broken JSON gives 400, an unknown address gives 404
  - Anything else gives 500 with a generic message. The real error is written to the server log, never sent to the client
  - The same handler covers errors outside endpoints (in `api/config.ts`)
  - Trade-off: other HTTP errors (413 body too large, 429 too many requests, 501 not implemented) are reported as 500. Keeping their real status needs a new error code for each

## Structure

- Business logic (`src/core`) is kept separate from the web layer (`src/api`), following the SST project layout guidance
- One package, not several: one app, nothing shared, and simpler to run locally

```
src/
  core/
    result.ts
    errors.ts
    user/
      user.ts         # UserInput/UserOutput schemas, create(), fromId()
      password.ts     # hash()
      store.ts        # in-memory list
      user.test.ts
  api/
    config.ts
    factories.ts      # shared endpoint starting point, error handling
    routing.ts
    endpoints/
      signup.ts       # POST /users
      signup.test.ts
      get-user.ts     # GET /users/:id
      get-user.test.ts
    factories.test.ts
  index.ts
```

- `core` never imports from `api`, so the business logic can be tested without a web server
- Endpoints only translate results into HTTP responses, with no business rules
- Two schemas for a user: `UserInput` (signup, includes the password) and `UserOutput` (never contains the password or its hash). Endpoints reuse them. The stored record also holds the password hash
- Used as `User.create(...)` through `import * as User from '.../core/user/user'`. No extra index file, and no TypeScript `namespace` keyword
- Alternative considered: a folder per feature at the top level (fewer folders now, but less tidy once there is a second area such as auth)

## Code style

- Return early: leave a function as soon as the answer is known
- Small functions that do one thing, easier to review
- One function argument (an object): avoids confusion about how many arguments are too many, and is easier to change where it is called

## Approach

- POST endpoint (done): takes a user, returns the new user id (uuid) with 201, or an error
- GET endpoint: takes a uuid, returns the user or an error
- Refine documentation last

## Considering, not tackling yet

Things I am thinking about but not tackling for this task:

- Rate limiting: nothing stops a client calling signup thousands of times, or guessing ids. Limit requests per client
- Idempotency: if a client retries a signup after a network failure, the second attempt is rejected as a duplicate email, which is confusing. Safe retries need a request key the server remembers
- Authentication: anyone can read any user if they have the id (see Future work)
- Observability: only unexpected errors are logged. No request logging, metrics (counts, timings) or alerts, and no way to follow one request through the system
- API versioning: routes have no version (`/users`). Once real clients depend on the request and response shapes, changing them breaks those clients. Options: a version in the path (`/v1/users`) or in a header

## Future work

- Login (authentication) and who may see what (authorisation):
  - Login check in `api`: `api/middleware/auth.ts` works out who is calling, or returns 401. `api/factories.ts` gets a version of the endpoint starting point that requires login. Signup stays public
  - Permission check in `core`: `User.fromId({ id, requesterId })` returns an error unless the caller is that user (or has a role). This closes the gap noted under user ids, and can be tested without a web server
  - New `core/auth/` area (sessions and passkeys). The login check calls `Auth.verifySession({ token })`
- File layout with login:

```
src/
  core/
    auth/                   # new
      session.ts            # verifySession({ token })
      passkey.ts            # passkey registration and checking
      store.ts
    user/
      user.ts               # fromId({ id, requesterId }) checks ownership
      password.ts
  api/
    middleware/
      auth.ts               # works out the caller, or returns 401
    factories.ts            # login-required endpoint starting point
    endpoints/
      signup.ts             # stays public
      get-user.ts           # now requires login
```

- Passkeys replace passwords (no password to store at all), so `core/user/password.ts` goes away or shrinks
- Upgrade packages: Express 5, zod 4 and the latest express-zod-api, and deal with the security problems `npm audit` reports in the starter packages
- Generate API documentation (Swagger/OpenAPI) from the zod schemas using express-zod-api, including the error responses for each status
