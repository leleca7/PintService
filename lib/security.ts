import 'server-only';
import crypto from 'node:crypto';

export function safeStringEqual(value: string | null | undefined, expected: string | null | undefined) {
  if (!value || !expected) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
