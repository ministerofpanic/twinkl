import { randomBytes } from 'node:crypto';
import { argon2id } from 'hash-wasm';

// OWASP minimum for Argon2id: 19 MiB memory, 2 iterations, 1 degree of parallelism
export function hash({ password }: { password: string }) {
  return argon2id({
    password,
    salt: randomBytes(16),
    memorySize: 19456,
    iterations: 2,
    parallelism: 1,
    hashLength: 32,
    outputType: 'encoded',
  });
}
