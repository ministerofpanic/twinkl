import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createConfig, createServer } from 'express-zod-api';
import {
  afterAll, beforeAll, describe, expect, it, vi,
} from 'vitest';
import { z } from 'zod';
import { AppError } from '../core/errors';
import { config } from './config';
import { ApiError, factory } from './factories';

const echo = factory.build({
  method: 'post',
  input: z.object({ name: z.string(), count: z.number() }),
  output: z.object({ greeting: z.string() }),
  handler: async ({ input }) => ({ greeting: `Hello ${input.name}` }),
});

const domainErrors = [
  {
    name: 'validationFailed',
    status: 400,
    error: {
      code: 'validation_failed',
      context: { issues: [{ path: ['email'], message: 'Unable to use this email' }] },
    },
  },
  {
    name: 'userNotFound',
    status: 404,
    error: { code: 'user_not_found', context: { id: '6f1f3a52-0f1e-4f56-9d5b-0f0c8f3b1d11' } },
  },
] satisfies { name: string; status: number; error: AppError }[];

function failWith(appError: AppError) {
  return factory.build({
    method: 'post',
    input: z.object({}),
    output: z.object({}),
    handler: async () => { throw new ApiError(appError); },
  });
}

const boom = factory.build({
  method: 'post',
  input: z.object({}),
  output: z.object({}),
  handler: async () => { throw new Error('secret db password'); },
});

const logger = {
  debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
};

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
  const testConfig = createConfig({ ...config, http: { listen: 0 }, logger });
  ({ servers } = await createServer(testConfig, {
    echo,
    boom,
    ...Object.fromEntries(domainErrors.map(({ name, error }) => [name, failWith(error)])),
  }));
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

  it.each(domainErrors)('domain error $error.code: body is { code, context }, status $status', async ({ name, status, error }) => {
    const response = await post({ path: `/${name}`, body: {} });
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual(error);
  });

  it('unexpected exception: 500 with a generic body, real error logged server-side only', async () => {
    const response = await post({ path: '/boom', body: {} });
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(JSON.parse(text)).toEqual({ code: 'internal_error', context: {} });
    expect(text).not.toContain('secret');
    expect(logger.error.mock.calls.some(([, logged]) => logged?.message === 'secret db password')).toBe(true);
  });

  it('unknown route: 404 not_found', async () => {
    const response = await post({ path: '/nope', body: {} });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ code: 'not_found', context: {} });
  });

  it('malformed JSON: 400 validation_failed', async () => {
    const response = await fetch(`${baseUrl}/echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 'validation_failed',
      context: { issues: [{ path: [], message: 'Malformed request body' }] },
    });
  });
});
