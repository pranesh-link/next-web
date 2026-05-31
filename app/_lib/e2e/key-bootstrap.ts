/**
 * Eager E2E key bootstrap for LuvVerse couple chat.
 *
 * Ensures the local ECDH key pair exists, the public key is uploaded to the
 * server, and the partner's public key has been fetched and combined into a
 * shared AES-256-GCM key. Caches the result at module scope so subsequent
 * callers (chat hook, send handlers) reuse the same key without redoing the
 * IndexedDB / network round-trip.
 *
 * Client-only — every export throws if invoked on the server.
 */

import {
  getOrGenerateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
} from "@/_lib/crypto";

/** Result of an `ensureKeysBootstrapped()` call. */
export interface KeyBootstrapResult {
  /** Derived AES-256-GCM shared key, or `null` when partner key not yet available. */
  sharedKey: CryptoKey | null;
  /** Outcome category — drives UI messaging. */
  status: "ready" | "no-partner" | "error";
  /** Error captured when `status === "error"`. */
  error?: Error;
}

let sharedKeyCache: CryptoKey | null = null;
let inFlight: Promise<CryptoKey | null> | null = null;

function assertClient(): void {
  if (typeof window === "undefined") {
    throw new Error("[e2e] key-bootstrap must run on the client");
  }
}

async function bootstrap(): Promise<CryptoKey | null> {
  const keyPair = await getOrGenerateKeyPair();
  const publicKeyB64 = await exportPublicKey(keyPair.publicKey);

  // Upload our public key — server is idempotent (returns existing if present).
  // Don't fail the whole bootstrap on non-2xx; partner-key fetch is the gate.
  try {
    await fetch("/api/v1/user/public-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ publicKey: publicKeyB64 }),
    });
  } catch {
    // Best-effort upload — continue.
  }

  const partnerRes = await fetch("/api/v1/couple/partner-public-key", {
    credentials: "same-origin",
  });
  if (!partnerRes.ok) {
    throw new Error(`partner-public-key responded ${partnerRes.status}`);
  }
  const { publicKey: partnerB64 } = (await partnerRes.json()) as {
    publicKey: string | null;
  };
  if (!partnerB64) return null;

  const partnerKey = await importPublicKey(partnerB64);
  return deriveSharedKey(keyPair.privateKey, partnerKey);
}

/**
 * Bootstraps the E2E key stack if not already done, returning the cached
 * shared key on subsequent calls. Concurrent callers share a single in-flight
 * promise. Never throws — errors are returned in the result.
 *
 * @returns Result describing the shared key (or `null`) and a status.
 */
export async function ensureKeysBootstrapped(): Promise<KeyBootstrapResult> {
  try {
    assertClient();

    if (sharedKeyCache) {
      return { sharedKey: sharedKeyCache, status: "ready" };
    }
    if (!inFlight) {
      inFlight = bootstrap()
        .then((key) => {
          if (key) sharedKeyCache = key;
          return key;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    const sharedKey = await inFlight;
    if (!sharedKey) return { sharedKey: null, status: "no-partner" };
    return { sharedKey, status: "ready" };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.warn("[e2e] key bootstrap failed", error);
    return { sharedKey: null, status: "error", error };
  }
}

/**
 * Returns the cached shared key without triggering a bootstrap.
 *
 * @returns The cached `CryptoKey`, or `null` if bootstrap has not completed.
 */
export function getCachedSharedKey(): CryptoKey | null {
  return sharedKeyCache;
}

/**
 * Returns the in-flight bootstrap promise, if one is currently running.
 * Useful for callers that want to await an existing bootstrap without
 * starting a new one.
 *
 * @returns The pending promise resolving to the shared key (or `null`), or
 *   `null` when no bootstrap is in progress.
 */
export function getKeyBootstrapPromise(): Promise<CryptoKey | null> | null {
  return inFlight;
}

/**
 * Clears the module-scope cache. Test-only — production code must not call
 * this; it would force every consumer to re-derive the shared key.
 */
export function resetKeyBootstrapForTests(): void {
  sharedKeyCache = null;
  inFlight = null;
}
