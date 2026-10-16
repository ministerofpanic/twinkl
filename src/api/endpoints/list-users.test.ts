import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createConfig, createServer } from 'express-zod-api';
import {
  afterAll, beforeAll, beforeEach, describe, expect, it,
} from 'vitest';
import { clear } from '../../core/user/store';
import { config } from '../config';
import { routing } from '../routing';

let servers: Server[];
let baseUrl: string;

function signup({ n }: { n: number }) {
  return fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fullName: `User ${n}`,
      email: `user${n}@example.com`,
      password: 'Passw0rdOk',
      createdDate: '2024-07-09',
      userType: 'teacher',
    }),
  });
}

function listUsers({ query = '' }: { query?: string } = {}) {
  return fetch(`${baseUrl}/users${query}`);
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

describe('GET /users', () => {
  it('first page: 200 with the first users, no password or hash, and a next cursor', async () => {
    await signup({ n: 1 });
    await signup({ n: 2 });
    await signup({ n: 3 });
    const response = await listUsers({ query: '?limit=2' });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items.map(({ email }: { email: string }) => email)).toEqual([
      'user1@example.com', 'user2@example.com',
    ]);
    expect(JSON.stringify(body)).not.toMatch(/password/i);
    expect(typeof body.nextCursor).toBe('string');
  });

  it('following nextCursor with after returns the rest, then nextCursor is null', async () => {
    await signup({ n: 1 });
    await signup({ n: 2 });
    await signup({ n: 3 });
    const first = await (await listUsers({ query: '?limit=2' })).json();
    const response = await listUsers({ query: `?limit=2&after=${first.nextCursor}` });
    const second = await response.json();
    expect(response.status).toBe(200);
    expect(second.items.map(({ email }: { email: string }) => email)).toEqual(['user3@example.com']);
    expect(second.nextCursor).toBeNull();
  });

  it.todo('no limit given: uses the default page size');
  it.todo('limit over the maximum, below 1 or not a number: 400 validation_failed on limit');
  it.todo('a cursor that is not valid: 400 validation_failed on after');
  it.todo('no users: 200 with an empty items list and a null nextCursor');
});
