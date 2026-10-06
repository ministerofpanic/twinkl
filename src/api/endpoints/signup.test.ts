import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createConfig, createServer } from 'express-zod-api';
import {
  afterAll, beforeAll, beforeEach, describe, expect, it,
} from 'vitest';
import { clear, findByEmail } from '../../core/user/store';
import { config } from '../config';
import { routing } from '../routing';

const validSignup = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Passw0rdOk',
  createdDate: '2024-07-09',
  userType: 'teacher',
};

let servers: Server[];
let baseUrl: string;

function signup(body: unknown) {
  return fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function close(server: Server) {
  return new Promise((resolve) => { server.close(resolve); });
}

// Integration: real server on a random port using the real routing
beforeAll(async () => {
  const testConfig = createConfig({ ...config, http: { listen: 0 }, logger: { level: 'silent' } });
  ({ servers } = await createServer(testConfig, routing));
  baseUrl = `http://localhost:${(servers[0].address() as AddressInfo).port}`;
});

afterAll(() => Promise.all(servers.map(close)));

beforeEach(clear);

describe('POST /users', () => {
  it('creates a user: 201 with { id } (uuid) and nothing else', async () => {
    const response = await signup(validSignup);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
    });
  });

  it('stores the user with a hashed password', async () => {
    const { id } = await (await signup(validSignup)).json();
    const stored = findByEmail({ email: validSignup.email });
    expect(stored?.id).toBe(id);
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(JSON.stringify(stored)).not.toContain(validSignup.password);
  });

  it('invalid input: 400 validation_failed listing every failed field, including all password rules', async () => {
    const response = await signup({
      fullName: '',
      email: 'not-an-email',
      password: '!',
      createdDate: '09/07/2024',
      userType: 'admin',
    });
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.code).toBe('validation_failed');
    expect(body.context.issues.map(({ path }: { path: string[] }) => path.join('.'))).toEqual([
      'fullName', 'email', 'password', 'password', 'password', 'password', 'createdDate', 'userType',
    ]);
    expect(
      body.context.issues
        .filter(({ path }: { path: string[] }) => path[0] === 'password')
        .map(({ message }: { message: string }) => message),
    ).toEqual([
      'Password must be at least 8 characters',
      'Password must contain a digit',
      'Password must contain a lowercase letter',
      'Password must contain an uppercase letter',
    ]);
  });
  it.todo('duplicate email: 400 validation_failed on email, without saying it is registered');
  it.todo('duplicate email ignores upper or lower case');
});
