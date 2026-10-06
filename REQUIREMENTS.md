# Twinkl TypeScript Test

- [Task](#task)
- [Development Environment Setup](#setup)
- [What we are looking for](#what-we-are-looking-for)

## Task

Your task is to implement a backend API (no front-end is required).

These are the requirements for the system:

1. User Signup Endpoint
    1. A `POST` endpoint, that accepts JSON, containing the user full name, password, email address, created date, and the user type (one of a student, teacher, parent or private tutor).
    1. Validation. The app should check that the fields submitted are not empty. The app should also check that the password matches the following rules:
        1. Between 8 and 64 characters
        1. Must contain at least one digit (0-9)
        1. Must contain at least one lowercase letter (a-z)
        1. Must contain at least one uppercase letter (A-Z)
    1. When validation fails the app should return an appropriate status code with error/s that can be used by the client
1. Save the signup information to a data store. We recommend an in-memory data store (i.e an array) or a lightweight file database like SQLLite.
1. User Signup Details
    1. A `GET` endpoint that takes a user ID and returns the user details as JSON.
1. Create whatever level of testing and documentation you consider appropriate

## What we are looking for

* Submit something that we can run locally
* Commiting changes with good messages as you go is very helpful
* You can update the README or add a NOTES.md detailing any decisions/tradeoffs you made, or changes you would make with more time
* Clean, secure, modular code written to your own standards of what good looks like. Add concise comments in the code if you want to explain a decision. 
* Pragmatism. We are not looking for complex solutions, and there is no hidden trick requirement in our task ;) 
* Feel free to install and use additional packages

## Setup

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/): Ensure that Node.js, preferably version 16 or higher, is installed on your system, as this project utilizes the latest versions of TypeScript and Nodemon.
- [npm](https://www.npmjs.com/): npm is the package manager for Node.js and comes with the Node.js installation.

### Installation

This will install a basic [Express](https://expressjs.com/) app with Typescript.

If you have been provided with a Github URL, clone the repository to your local machine:

```
git clone https://github.com/twinkltech/twinkl-typescript-tech-test.git
```

If you have been provided with a zip file, download to your computer and unzip.

Navigate to the directory:

```
cd twinkl-typescript-tech-test
```

Install the dependencies:

```
npm i
```

### Usage

In development the following command will start the server and use `nodemon` to auto-reload the server based on file changes

```
npm run dev
```

The server will start at `http://localhost:3000` by default. You can change the port in `src/index.ts` 

There are no tests in the project at the moment, but a command is available to run:

```
npm run test
```

There are also commands to build and start a server without nodemon:

```
npm run build
npm start
```

