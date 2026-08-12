import { decryptCredential, encryptCredential } from './credential-crypto.util';

describe('credential-crypto', () => {
  it('descifra exactamente lo que se cifró', () => {
    const original = 'super-secret-password-123!';
    const encrypted = encryptCredential(original);
    expect(encrypted).not.toEqual(original);
    expect(decryptCredential(encrypted)).toEqual(original);
  });

  it('produce un IV distinto en cada llamada (no determinístico)', () => {
    const a = encryptCredential('same-input');
    const b = encryptCredential('same-input');
    expect(a).not.toEqual(b);
    expect(decryptCredential(a)).toEqual('same-input');
    expect(decryptCredential(b)).toEqual('same-input');
  });
});
