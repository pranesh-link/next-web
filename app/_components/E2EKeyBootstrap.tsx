"use client";

import { useEffect } from "react";
import { ensureKeysBootstrapped } from "@/_lib/e2e/key-bootstrap";

/**
 * Mounted in the `/couple` layout to eagerly bootstrap E2E encryption keys on
 * the user's first authenticated render. Generates / loads the local ECDH key
 * pair, uploads the public key, and derives the shared AES-256-GCM key with
 * the partner — so by the time the user opens chat, encryption is ready and
 * plaintext fallback is impossible.
 *
 * Renders nothing.
 */
export default function E2EKeyBootstrap(): null {
  useEffect(() => {
    void ensureKeysBootstrapped();
  }, []);

  return null;
}
