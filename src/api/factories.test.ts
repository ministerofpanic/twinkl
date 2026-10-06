import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createConfig, createServer } from 'express-zod-api';
import {
  afterAll, beforeAll, describe, expect, it,
} from 'vitest';
import { z } from 'zod';
import { AppError } from '../core/errors';
import { factory } from './factories';

const echo = factory.build({
  method: 'post',
  input: z.object({ name: z.string(), count: z.number() }),
  output: z.object({ greeting: z.string() }),
  handler: async ({ input }) => ({ greeting: `Hello ${input.name}` }),
});

let servers: Awaited<ReturnType<typeof createServer>>['servers'];
let baseUrl: string;

function post({ path, body }: { path: string; body: unknown }) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Integration: real server on a random port, throwaway endpoints built from the factory
beforeAll(async () => {
  const config = createConfig({ http: { listen: 0 }, cors: false, logger: { level: 'silent' } });
  ({ servers } = await createServer(config, { echo }));
  baseUrl = `http://localhost:${(servers[0].address() as AddressInfo).port}`;
});

function close(server: Server) {
  return new Promise((resolve) => { server.close(resolve); });
}

afterAll(() => Promise.all(servers.map(close)));

describe('endpoints factory result handler', () => {
  it('success: responds with the endpoint output as JSON, no envelope', async () => {
    const response = await post({ path: '/echo', body: { name: 'Ada', count: 1 } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ greeting: 'Hello Ada' });
  });

  it('invalid input: 400 validation_failed listing every issue with path and message', async () => {
    const response = await post({ path: '/echo', body: {} });
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(AppError.safeParse(body).success).toBe(true);
    expect(body.code).toBe('validation_failed');
    expect(body.context.issues.map(({ path }: { path: string[] }) => path)).toEqual([['name'], ['count']]);
  });

  it.todo('domain error from the endpoint: body is { code, context }, status mapped from code (validation_failed 400, user_not_found 404)');
  it.todo('unexpected exception: 500 with a generic body and no internal details leaked');
  it.todo('errors outside endpoints (unknown route, malformed JSON) use the same { code, context } body');
});
