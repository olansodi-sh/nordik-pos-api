import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// Deriva una clave AES-256 fija a partir de TENANT_DB_ENCRYPTION_KEY (o un
// valor de desarrollo) — solo protege credenciales en reposo dentro de la
// BD central, no reemplaza gestión de secretos en producción.
function getKey(): Buffer {
  const secret = process.env.TENANT_DB_ENCRYPTION_KEY ?? 'nordikhat-dev-insecure-key';
  return createHash('sha256').update(secret).digest();
}

export function encryptCredential(plain: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptCredential(payload: string): string {
  const [ivHex, dataHex] = payload.split(':');
  const decipher = createDecipheriv('aes-256-cbc', getKey(), Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
