import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_PASSWORD_LENGTH = 1024;

type ScryptCallback = (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
  callback: (error: Error | null, derivedKey: Buffer) => void
) => void;

const scrypt = scryptCallback as ScryptCallback;

/**
 * Password storage primitives only. They do not authenticate an account,
 * apply rate limits, or decide account status. Those checks belong in the
 * credential repository and HTTP authentication flow.
 */
export async function hashCandidatePassword(password: string): Promise<string> {
  validatePasswordForHashing(password);
  const salt = randomBytes(SALT_BYTES);
  const derived = await deriveKey(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);
  return [
    "scrypt",
    SCRYPT_N.toString(10),
    SCRYPT_R.toString(10),
    SCRYPT_P.toString(10),
    salt.toString("base64url"),
    derived.toString("base64url")
  ].join("$");
}

export async function verifyCandidatePassword(password: string, encodedHash: string): Promise<boolean> {
  if (typeof password !== "string" || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }
  if (typeof encodedHash !== "string" || encodedHash.length > 512) return false;

  const parts = encodedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = parseCanonicalInteger(parts[1]);
  const r = parseCanonicalInteger(parts[2]);
  const p = parseCanonicalInteger(parts[3]);
  if (N !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length !== SALT_BYTES || expected.length !== KEY_LENGTH) return false;

  try {
    const actual = await deriveKey(password, salt, N, r, p);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function validatePasswordForHashing(password: string): void {
  if (typeof password !== "string" || password.length < 12 || password.length > MAX_PASSWORD_LENGTH) {
    throw new Error("Password must be between 12 and 1024 characters.");
  }
  if (password.trim().length === 0) throw new Error("Password must not be blank.");
}

function parseCanonicalInteger(value: string | undefined): number {
  if (!value || !/^(0|[1-9][0-9]*)$/.test(value)) return -1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : -1;
}

function deriveKey(
  password: string,
  salt: Buffer,
  N: number,
  r: number,
  p: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, {
      N, r, p,
      maxmem: 64 * 1024 * 1024
    }, (error, derivedKey) => error ? reject(error) : resolve(derivedKey));
  });
}
