import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getSecret(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) throw new Error('ENCRYPTION_SECRET is not configured');
  return Buffer.from(secret, 'hex');
}

export function encrypt(text: string): string {
  const secret = getSecret();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, secret, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(data: string): string {
  const secret = getSecret();
  const [ivHex, tagHex, encHex] = data.split(':');
  const decipher = createDecipheriv(ALGORITHM, secret, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}

/**
 * Get a hint for an API key (last 4 characters)
 */
export function getApiKeyHint(key: string): string {
  if (key.length <= 8) return '****';
  const prefix = key.substring(0, 7);
  const suffix = key.substring(key.length - 4);
  return `${prefix}...${suffix}`;
}
