const STORAGE_KEY = 'simm-plantao-vault-v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function hasVault() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export function readEncryptedVault() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function importEncryptedVault(serialized) {
  const parsed = JSON.parse(serialized);
  if (!parsed?.salt || !parsed?.iv || !parsed?.ciphertext || parsed?.version !== 1) {
    throw new Error('Backup de cofre inválido.');
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}

export function resetVault() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function saveVault(passphrase, payload) {
  if (!passphrase || passphrase.length < 6) throw new Error('Use uma senha com pelo menos 6 caracteres.');
  let salt;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      salt = base64ToBytes(JSON.parse(existing).salt);
    } catch {
      salt = crypto.getRandomValues(new Uint8Array(16));
    }
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
  }
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plain = encoder.encode(JSON.stringify(payload));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const envelope = {
    version: 1,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256-250000',
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  return envelope;
}

export async function loadVault(passphrase) {
  const serialized = localStorage.getItem(STORAGE_KEY);
  if (!serialized) throw new Error('Nenhum cofre encontrado.');
  try {
    const envelope = JSON.parse(serialized);
    const salt = base64ToBytes(envelope.salt);
    const iv = base64ToBytes(envelope.iv);
    const ciphertext = base64ToBytes(envelope.ciphertext);
    const key = await deriveKey(passphrase, salt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(decoder.decode(decrypted));
  } catch {
    throw new Error('Senha incorreta ou cofre corrompido.');
  }
}
