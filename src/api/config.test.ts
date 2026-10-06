import type { Server } from 'node:http';
import { createConfig, createServer } from 'express-zod-api';
import { describe, expect, it } from 'vitest';

function close(server: Server) {
  return new Promise((resolve) => { server.close(resolve); });
}

describe('server config', () => {
  it('starts without deprecation warnings', async () => {
    const warnings: string[] = [];
    function record(warning: Error) {
      warnings.push(warning.message);
    }
    process.on('deprecation', record);

    // Imported after the listener is attached, because parsers are built when config.ts loads
    const { config } = await import('./config');
    const { routing } = await import('./routing');
    const testConfig = createConfig({ ...config, http: { listen: 0 }, logger: { level: 'silent' } });
    const { servers } = await createServer(testConfig, routing);
    await Promise.all(servers.map(close));
    process.off('deprecation', record);

    expect(warnings).toEqual([]);
  });
});
