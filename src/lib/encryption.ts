// Re-export AES-256-GCM encrypt/decrypt from the canonical location.
// Aliased here so external modules can import from either path.
export { encrypt, decrypt, getApiKeyHint } from './utils/crypto';
