import { describe, expect, it } from 'vitest';
import { err, ok } from './result';

describe('Result', () => {
  it('ok wraps a value', () => {
    expect(ok('value')).toEqual({ ok: true, value: 'value' });
  });

  it('err wraps an error', () => {
    expect(err('failure')).toEqual({ ok: false, error: 'failure' });
  });
});
