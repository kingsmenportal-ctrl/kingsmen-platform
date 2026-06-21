import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function resolveRepoRoot(importMetaUrl = import.meta.url) {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) return cwd;

  const here = path.dirname(fileURLToPath(importMetaUrl));
  let cursor = here;
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(cursor, 'package.json'))) return cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  return cwd;
}

export function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function decodeTextBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) return String(buffer ?? '');
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf8');
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.alloc(Math.max(buffer.length - 2, 0));
    for (let i = 2; i + 1 < buffer.length; i += 2) {
      swapped[i - 2] = buffer[i + 1];
      swapped[i - 1] = buffer[i];
    }
    return swapped.toString('utf16le');
  }

  const sampleLength = Math.min(buffer.length, 512);
  let oddNulls = 0;
  let evenNulls = 0;
  for (let i = 0; i < sampleLength; i += 1) {
    if (buffer[i] === 0) {
      if (i % 2 === 0) evenNulls += 1;
      else oddNulls += 1;
    }
  }
  if (oddNulls > evenNulls + 8) return buffer.toString('utf16le');

  return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

export function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const text = decodeTextBuffer(fs.readFileSync(filePath));
  if (!text.trim()) return null;
  return JSON.parse(text);
}

export function readJsonFileSafe(filePath) {
  try {
    return { ok: true, value: readJsonFile(filePath), error: null };
  } catch (error) {
    return { ok: false, value: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export function writeJsonFile(filePath, value) {
  ensureDirForFile(filePath);
  const json = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, json, 'utf8');
  return json;
}

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function utcNowIso() {
  return new Date().toISOString();
}

export function parseFlags(argv = process.argv.slice(2)) {
  const flags = new Set();
  const values = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('-')) continue;

    const stripped = raw.replace(/^--?/, '');
    const eqIndex = stripped.indexOf('=');
    if (eqIndex >= 0) {
      const key = stripped.slice(0, eqIndex).toLowerCase();
      const value = stripped.slice(eqIndex + 1);
      flags.add(key);
      values.set(key, value);
      continue;
    }

    const key = stripped.toLowerCase();
    const next = argv[index + 1];
    flags.add(key);
    if (next && !next.startsWith('-')) {
      values.set(key, next);
      index += 1;
    }
  }

  return {
    has(name) {
      return flags.has(String(name).toLowerCase());
    },
    get(name, fallback = '') {
      const key = String(name).toLowerCase();
      return values.has(key) ? values.get(key) : fallback;
    },
    getAll(names, fallback = '') {
      for (const name of names) {
        const value = this.get(name, undefined);
        if (value !== undefined) return value;
      }
      return fallback;
    },
  };
}

export function isPlaceholderValue(value) {
  if (value === null || value === undefined) return true;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return true;
  const compact = normalized.replace(/[\s_-]+/g, '');

  const badExact = new Set([
    '...',
    'todo',
    'tbd',
    'placeholder',
    'changeme',
    'change_me',
    'replace_me',
    'your_value_here',
    'real',
    'real_value',
    'real_bucket',
    'real_host',
    'real_user',
    'real_password',
    'real_secret',
    'real_key',
    'real_token',
    'dummy',
    'dummy_value',
    'fake',
    'fake_value',
  ]);
  if (badExact.has(normalized)) return true;

  const badFragments = [
    'placeholder',
    'changeme',
    'replaceme',
    'yourvaluehere',
    'youractual',
    'yourreal',
    'actualsmtp',
    'realsandboxvalue',
    'realinternal',
    'realprovider',
    'dummyvalue',
    'fakevalue',
    'examplecom',
  ];
  if (badFragments.some((fragment) => compact.includes(fragment))) return true;

  const badPrefixes = ['your_', 'your-', 'your ', 'replace_', 'replace-', 'replace ', 'real_', 'real-', 'dummy_', 'dummy-', 'fake_', 'fake-'];
  if (badPrefixes.some((prefix) => normalized.startsWith(prefix))) return true;

  return normalized.includes('example.com');
}

export function redactedPreview(value) {
  if (isPlaceholderValue(value)) return 'missing_or_placeholder';
  const raw = String(value);
  if (raw.length <= 8) return 'present_redacted';
  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

export function assertNoSecretLikeText(text, label = 'output') {
  const unsafePatterns = [
    /postgres(?:ql)?:\/\//i,
    /redis:\/\//i,
    /BEGIN PRIVATE KEY/i,
    /github_pat_/i,
    /sk-[A-Za-z0-9_-]{8,}/,
    /SMTP_PASSWORD[^\n]*(value|secret|password)/i,
  ];
  if (unsafePatterns.some((pattern) => pattern.test(text))) {
    throw new Error(`Secret-like value detected in ${label}.`);
  }
}
