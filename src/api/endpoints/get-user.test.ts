import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createConfig, createServer } from 'express-zod-api';
import {
  afterAll, beforeAll, beforeEach, describe, expect, it,
} from 'vitest';
import { clear } from '../../core/user/store';
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

async function signup(body: unknown) {
  const response = await fetch(`${baseUrl}/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

function getUser({ id }: { id: string }) {
  return fetch(`${baseUrl}/users/${id}`);
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

describe('GET /users/:id', () => {
  it('returns 200 with the public user, never the password or its hash', async () => {
    const { id } = await signup(validSignup);
    const response = await getUser({ id });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id,
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      createdDate: '2024-07-09',
      userType: 'teacher',
    });
  });

  it.todo('unknown id: 404 user_not_found with the id');
  it.todo('id that is not a uuid: 400 validation_failed on path id');
});
