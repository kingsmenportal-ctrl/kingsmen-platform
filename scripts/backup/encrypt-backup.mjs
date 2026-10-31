#!/usr/bin/env node
import { createReadStream, createWriteStream } from 'node:fs';
import { open, link, rm, stat } from 'node:fs/promises';
import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream/promises';
import { once } from 'node:events';

const scrypt = promisify(scryptCallback);
const MAGIC = Buffer.from('KMBACK01');
const HEADER_LENGTH = 8 + 16 + 12;
const TAG_LENGTH = 16;

function passphrase() {
  const value = process.env.KINGSMEN_BACKUP_PASSPHRASE;
  if (!value || value.length < 20) throw new Error('KINGSMEN_BACKUP_PASSPHRASE must contain at least 20 characters; secret value is never printed.');
  return value;
}
async function keyFor(secret, salt) {
  return await scrypt(secret, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}
async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
function temporaryPath(path, suffix) {
  return path + '.' + randomBytes(12).toString('hex') + suffix;
}

async function encrypt(input, output) {
  const secret = passphrase();
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const key = await keyFor(secret, salt);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const outputTmp = temporaryPath(output, '.partial');
  const ciphertextTmp = temporaryPath(output, '.ciphertext.partial');
  let published = false;
  try {
    await pipeline(createReadStream(input), cipher, createWriteStream(ciphertextTmp, { flags: 'wx', mode: 0o600 }));
    const writer = createWriteStream(outputTmp, { flags: 'wx', mode: 0o600 });
    writer.write(Buffer.concat([MAGIC, salt, nonce]));
    for await (const chunk of createReadStream(ciphertextTmp)) {
      if (!writer.write(chunk)) await once(writer, 'drain');
    }
    writer.end(cipher.getAuthTag());
    await once(writer, 'finish');
    // link() publishes atomically and fails with EEXIST instead of replacing a file.
    await link(outputTmp, output);
    published = true;
    await rm(outputTmp);
    process.stdout.write(JSON.stringify({ status: 'ENCRYPTED', sha256: await digest(output), bytes: (await stat(output)).size }) + '\n');
  } catch (error) {
    await rm(outputTmp, { force: true }).catch(() => {});
    if (published) await rm(output, { force: true }).catch(() => {});
    if (error?.code === 'EEXIST') throw new Error('Refusing to overwrite an existing backup or temporary file.');
    throw error;
  } finally {
    key.fill(0);
    await rm(ciphertextTmp, { force: true }).catch(() => {});
  }
}

async function decrypt(input, output) {
  const secret = passphrase();
  const info = await stat(input);
  if (info.size < HEADER_LENGTH + TAG_LENGTH) throw new Error('Encrypted backup container is truncated.');
  const handle = await open(input, 'r');
  let header;
  let tag;
  try {
    header = Buffer.alloc(HEADER_LENGTH);
    tag = Buffer.alloc(TAG_LENGTH);
    await handle.read(header, 0, HEADER_LENGTH, 0);
    await handle.read(tag, 0, TAG_LENGTH, info.size - TAG_LENGTH);
  } finally {
    await handle.close();
  }
  if (!header.subarray(0, 8).equals(MAGIC)) throw new Error('Encrypted backup container header is invalid.');
  const key = await keyFor(secret, header.subarray(8, 24));
  const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(24, 36));
  decipher.setAuthTag(tag);
  const tmp = temporaryPath(output, '.partial');
  let published = false;
  try {
    await pipeline(createReadStream(input, { start: HEADER_LENGTH, end: info.size - TAG_LENGTH - 1 }), decipher, createWriteStream(tmp, { flags: 'wx', mode: 0o600 }));
    await link(tmp, output);
    published = true;
    await rm(tmp);
    process.stdout.write(JSON.stringify({ status: 'DECRYPTED_AND_AUTHENTICATED', sha256: await digest(output), bytes: (await stat(output)).size }) + '\n');
  } catch (error) {
    await rm(tmp, { force: true }).catch(() => {});
    if (published) await rm(output, { force: true }).catch(() => {});
    if (error?.code === 'EEXIST') throw new Error('Refusing to overwrite an existing restore output file.');
    throw new Error('Encrypted backup authentication/decryption failed or output could not be safely published; output rejected.');
  } finally {
    key.fill(0);
  }
}

const [mode, input, output] = process.argv.slice(2);
if (!['encrypt', 'decrypt'].includes(mode) || !input || !output) {
  process.stderr.write('Usage: node encrypt-backup.mjs <encrypt|decrypt> <input-file> <output-file>\n');
  process.exitCode = 2;
} else {
  try {
    if (mode === 'encrypt') await encrypt(input, output);
    else await decrypt(input, output);
  } catch (error) {
    process.stderr.write((error?.message || 'Backup encryption operation failed.') + '\n');
    process.exitCode = 1;
  }
}
