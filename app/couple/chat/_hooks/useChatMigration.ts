"use client";

import { useEffect, useRef } from "react";
import { encryptMessage } from "@/_lib/crypto";

const STORAGE_KEY = "chat-encryption-migration-done";

/**
 * Hook that silently migrates unencrypted chat messages to E2E encryption.
 *
 * Runs once per browser after encryption becomes ready. Fetches all plaintext
 * messages sent by the current user, encrypts each with the shared ECDH key,
 * then batch-updates them on the server. Stores a flag in localStorage to
 * avoid re-running.
 *
 * @param sharedKey - The derived AES-256-GCM key (null if not ready).
 * @param encryptionReady - Whether the crypto stack is fully initialised.
 */
export function useChatMigration(
  sharedKey: CryptoKey | null,
  encryptionReady: boolean,
) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (!encryptionReady || !sharedKey) return;
    if (ranRef.current) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    ranRef.current = true;
    void migrateMessages(sharedKey);
  }, [encryptionReady, sharedKey]);
}

async function migrateMessages(sharedKey: CryptoKey) {
  try {
    // 1. Fetch unencrypted messages from server
    const res = await fetch("/api/v1/couple/chat/encrypt-batch", {
      cache: "no-store",
    });
    if (!res.ok) return;

    const { data } = (await res.json()) as {
      data: { id: string; content: string }[];
    };
    if (!data || data.length === 0) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      return;
    }

    // 2. Encrypt each message client-side
    const batch: { id: string; content: string; iv: string }[] = [];
    for (const msg of data) {
      const { ciphertext, iv } = await encryptMessage(msg.content, sharedKey);
      batch.push({ id: msg.id, content: ciphertext, iv });
    }

    // 3. Send encrypted batch to server (chunks of 100)
    for (let i = 0; i < batch.length; i += 100) {
      const chunk = batch.slice(i, i + 100);
      await fetch("/api/v1/couple/chat/encrypt-batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: chunk }),
      });
    }

    // 4. Mark migration complete
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // Non-fatal — will retry on next session (ranRef prevents retry within same mount)
  }
}
