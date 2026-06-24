import { describe, it, expect } from 'vitest';
import { generateOtp, hashOtp } from './otp';

describe('otp', () => {
  it('generates a 6-digit zero-padded code', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it('hashes deterministically and never stores the raw code', () => {
    const code = '123456';
    expect(hashOtp(code)).toBe(hashOtp(code));
    expect(hashOtp(code)).not.toBe(code);
    expect(hashOtp(code)).not.toBe(hashOtp('123457'));
    expect(hashOtp(code)).toMatch(/^[a-f0-9]{64}$/); // sha-256 hex
  });
});
