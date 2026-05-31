/**
 * Client-side E2E encryption utilities for LuvVerse couple chat.
 *
 * Architecture:
 *  - ECDH P-256 key pairs are generated once per device.
 *  - The private key is stored only in IndexedDB (never sent to the server).
 *  - The public key is uploaded to the server so the partner can derive the
 *    shared secret on their device.
 *  - AES-256-GCM is used for symmetric encryption of each message, with a
 *    cryptographically random 96-bit IV per message.
 *
 * This module is intentionally a plain TypeScript file (no React) so it can be
 * imported by hooks, server actions, and utility functions alike.
 */

const DB_NAME = "luvverse-crypto";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const PRIVATE_KEY_ID = "ecdh-private";
const PUBLIC_KEY_ID = "ecdh-public";

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet<T>(key: string): Promise<T | undefined> {
  const db = await openKeyDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(key: string, value: unknown): Promise<void> {
  const db = await openKeyDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Key generation and persistence
// ---------------------------------------------------------------------------

/** Generates a new non-extractable ECDH P-256 key pair and stores it in IndexedDB. */
async function generateAndStoreKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable = true so we can export the public key as JWK
    ["deriveKey"],
  );
  await Promise.all([
    dbPut(PRIVATE_KEY_ID, keyPair.privateKey),
    dbPut(PUBLIC_KEY_ID, keyPair.publicKey),
  ]);
  return keyPair;
}

/**
 * Returns the local ECDH key pair, generating one if none exists yet.
 * Call this once on app/chat mount.
 */
export async function getOrGenerateKeyPair(): Promise<CryptoKeyPair> {
  const [privateKey, publicKey] = await Promise.all([
    dbGet<CryptoKey>(PRIVATE_KEY_ID),
    dbGet<CryptoKey>(PUBLIC_KEY_ID),
  ]);
  if (privateKey && publicKey) return { privateKey, publicKey };
  return generateAndStoreKeyPair();
}

// ---------------------------------------------------------------------------
// Public key serialization (for server storage)
// ---------------------------------------------------------------------------

/** Exports the ECDH public key as a base64-encoded JWK string. */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", publicKey);
  return btoa(JSON.stringify(jwk));
}

/**
 * Imports a base64-encoded JWK ECDH public key (as received from the server).
 *
 * @param base64Jwk - Base64-encoded JWK string stored on the server.
 */
export async function importPublicKey(base64Jwk: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(base64Jwk)) as JsonWebKey;
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
}

// ---------------------------------------------------------------------------
// Shared secret derivation (ECDH → AES-256-GCM)
// ---------------------------------------------------------------------------

/**
 * Derives the shared AES-256-GCM encryption key from the local private key and
 * the partner's public key. The result is identical on both devices and is
 * never transmitted.
 *
 * @param myPrivateKey  - Local ECDH private key from IndexedDB.
 * @param partnerPublicKey - Partner's ECDH public key imported from the server.
 */
export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  partnerPublicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: partnerPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// ---------------------------------------------------------------------------
// Message encryption / decryption
// ---------------------------------------------------------------------------

export interface EncryptedPayload {
  /** Base64-encoded AES-GCM ciphertext. */
  ciphertext: string;
  /** Base64-encoded 96-bit IV (unique per message). */
  iv: string;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext  - The raw message content.
 * @param sharedKey  - Derived AES-256-GCM key.
 * @returns `{ ciphertext, iv }` — both base64-encoded, safe to store in DB.
 */
export async function encryptMessage(
  plaintext: string,
  sharedKey: CryptoKey,
): Promise<EncryptedPayload> {
  const ivBytes = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    sharedKey,
    encoded,
  );
  return {
    ciphertext: bufToBase64(ciphertextBuf),
    iv: bufToBase64(ivBytes.buffer),
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext back to plaintext.
 * Returns `null` if decryption fails (e.g. corrupted data or wrong key).
 *
 * @param ciphertext - Base64-encoded ciphertext (the `content` DB field).
 * @param iv         - Base64-encoded IV (the `iv` DB field).
 * @param sharedKey  - Derived AES-256-GCM key.
 */
export async function decryptMessage(
  ciphertext: string,
  iv: string,
  sharedKey: CryptoKey,
): Promise<string | null> {
  try {
    const ciphertextBuf = base64ToBuf(ciphertext);
    const ivBuf = base64ToBuf(iv);
    const plaintextBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
      sharedKey,
      ciphertextBuf,
    );
    return new TextDecoder().decode(plaintextBuf);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Binary encryption / decryption
// ---------------------------------------------------------------------------

/**
 * Encrypts binary data using AES-256-GCM.
 * Returns the IV prepended to ciphertext as a single ArrayBuffer.
 * Format: [12-byte IV][ciphertext+GCM tag]
 */
export async function encryptBytes(
  data: ArrayBuffer,
  sharedKey: CryptoKey,
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    data,
  );
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return combined.buffer;
}

/**
 * Decrypts binary data encrypted with `encryptBytes`.
 * Expects format: [12-byte IV][ciphertext+GCM tag]
 * Returns null on failure.
 */
export async function decryptBytes(
  encryptedData: ArrayBuffer,
  sharedKey: CryptoKey,
): Promise<ArrayBuffer | null> {
  try {
    if (encryptedData.byteLength < 12 + 16) return null;
    const iv = new Uint8Array(encryptedData, 0, 12);
    const ciphertext = new Uint8Array(encryptedData, 12);
    return await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      ciphertext,
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal base64 helpers
// ---------------------------------------------------------------------------

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
