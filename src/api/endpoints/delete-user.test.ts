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

function deleteUser({ id }: { id: string }) {
  return fetch(`${baseUrl}/users/${id}`, { method: 'DELETE' });
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

describe('DELETE /users/:id', () => {
  it('deletes the user: 204 with an empty body, and the user can no longer be found', async () => {
    const { id } = await signup(validSignup);
    const response = await deleteUser({ id });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect((await getUser({ id })).status).toBe(404);
  });

  it.todo('unknown id: 204, since the user is gone either way');
  it.todo('id that is not a uuid: 400 validation_failed on path id');
});
