/** Unambiguous lowercase alphabet (no 0/o, 1/l) for readable session ids. */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function newSessionId(): string {
  return randomString(10);
}

export function newUserId(): string {
  return randomString(16);
}

export function newStoryId(): string {
  return randomString(12);
}
