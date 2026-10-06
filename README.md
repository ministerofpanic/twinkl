# Twinkl signup API 👋

A small backend API for signing up users and looking them up again. It is my answer to the Twinkl TypeScript technical test (the original brief is in [REQUIREMENTS.md](REQUIREMENTS.md)).

> 📝 **Want to know what I was thinking?** Read [NOTES.md](NOTES.md). It covers the decisions I made, the trade-offs, how I used AI, and what I would do next. It was written before and during the build.

## What it does

- ✅ **Sign up** a user (`POST /users`) and get back their new id
- 🔎 **Look up** a user by id (`GET /users/:id`) and get back their details
- 🔐 Passwords are **never stored as typed and never sent back**. They are scrambled with Argon2id (a slow, one-way hash)
- 🧠 Users are kept **in memory**, so everything is forgotten when the server stops
- 🚦 Every error comes back in the same shape, so a client always knows what to expect

It is built with TypeScript, Express, [zod](https://zod.dev) (checks the incoming data) and [express-zod-api](https://github.com/RobinTail/express-zod-api) (joins the two together). Tests use [Vitest](https://vitest.dev).

## Running it 🚀

You need [Node.js](https://nodejs.org/) 20.19 or newer.

```bash
npm install
npm run dev
```

The server starts at <http://localhost:3000> and restarts when you change a file. To use another port, run `PORT=4000 npm run dev`.

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Runs all the tests |
| `npm run lint` | Checks the code style |
| `npm run build` then `npm start` | Builds to `dist/` and runs the built version |

## Trying it out 🧪

Start the server in one terminal, then run these in another.

### The happy path 😊

**1. Sign up a user** (returns `201` and the new id):

```bash
curl -i -X POST http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{
    "fullName": "Ada Lovelace",
    "email": "ada@example.com",
    "password": "Passw0rdOk",
    "createdDate": "2024-07-09",
    "userType": "teacher"
  }'
```

```json
{ "id": "0cdabd07-447a-424d-8096-63fb00bc89db" }
```

**2. Look the user up** (returns `200`). Swap in the id you got back:

```bash
curl -i http://localhost:3000/users/0cdabd07-447a-424d-8096-63fb00bc89db
```

```json
{
  "id": "0cdabd07-447a-424d-8096-63fb00bc89db",
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "createdDate": "2024-07-09",
  "userType": "teacher"
}
```

Note there is no password in the response, on purpose.

**Shortcut:** sign up and look up in one go, without copying the id by hand:

```bash
ID=$(curl -s -X POST http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{"fullName":"Grace Hopper","email":"grace@example.com","password":"Passw0rdOk","createdDate":"2024-07-09","userType":"parent"}' \
  | sed -E 's/.*"id":"([^"]+)".*/\1/')

curl -i http://localhost:3000/users/$ID
```

### What a signup needs

| Field | Rule |
| --- | --- |
| `fullName` | Not empty |
| `email` | A valid email. Upper and lower case count as the same email |
| `password` | 8 to 64 characters, with at least one digit, one lowercase letter and one uppercase letter |
| `createdDate` | A date like `2024-07-09` (year-month-day, no time) |
| `userType` | One of `student`, `teacher`, `parent` or `private tutor` |

### The unhappy paths 😬

All errors look like this:

```json
{ "code": "some_code", "context": { } }
```

`code` says what kind of error it is, and `context` has the details. The codes are `validation_failed`, `user_not_found`, `not_found` and `internal_error`.

**Several things wrong at once** (`400`). Every problem is reported together, not just the first one. Each one names the field (`path`) and says what is wrong (`message`):

```bash
curl -i -X POST http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{"fullName":"","email":"nope","password":"!","createdDate":"9/7/24","userType":"admin"}'
```

**A weak password** (`400`). The response lists each password rule that was broken (here: too short, no digit, no lowercase, no uppercase):

```bash
curl -i -X POST http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{"fullName":"Ada Lovelace","email":"ada@example.com","password":"!","createdDate":"2024-07-09","userType":"teacher"}'
```

**Missing fields** (`400`). This one only sends a name, so each of the four missing fields is reported as `Required`:

```bash
curl -i -X POST http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{"fullName":"Ada Lovelace"}'
```

**The same email twice** (`400`). Run the happy path signup twice. The second one fails with the message `Unable to use this email`. This is deliberately vague: it does not say the email is already registered, so someone can't use signup to find out who has an account.

**Broken JSON** (`400`):

```bash
curl -i -X POST http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{oops'
```

Gives `validation_failed` with the message `Malformed request body`.

**A user that doesn't exist** (`404`). The id is valid but nobody has it:

```bash
curl -i http://localhost:3000/users/00000000-0000-4000-8000-000000000000
```

Gives `user_not_found`, and the id you asked for is in `context`.

**An id that isn't an id** (`400`):

```bash
curl -i http://localhost:3000/users/123
```

Gives `validation_failed` on the field `id` (it must be a UUID).

**An address that doesn't exist** (`404`):

```bash
curl -i http://localhost:3000/nope
```

Gives `not_found`.

**Something unexpected** (`500`). There is no way to trigger this on purpose. If a bug or an unexpected failure happens, the response is always `internal_error` with an empty `context`, so internal details never leak. The real error is written to the server's log.

## Good to know ⚠️

- 🧠 Data lives in memory, so restarting the server removes every user
- 🔓 There is no login yet: anyone with a user's id can read that user. The ids are random UUIDs, so they can't be guessed, but this is not real security
- 📋 Other things I thought about but did not build (rate limiting, retries, logging and metrics, API versioning) are listed in [NOTES.md](NOTES.md)

## How the code is laid out 🗂️

```
src/
  core/        The business logic: checking users, hashing passwords, storing them
  api/         The web layer: the two endpoints and how errors are turned into responses
  index.ts     Starts the server
```

The business logic never depends on the web layer, so it can be tested without a server. Tests sit next to the code they check (`*.test.ts`).
