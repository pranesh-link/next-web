"use client";

import { useState, useEffect, useRef } from "react";
import { decryptBytes } from "@/_lib/crypto";
import { getCachedSharedKey } from "@/_lib/e2e/key-bootstrap";

interface EncryptedMediaProps {
  /** Firebase Storage path (e.g. "chat/userId/uuid.jpg.enc") */
  filePath: string;
  /** Original MIME type from payload (e.g. "image/jpeg", "audio/mp4") */
  contentType: string;
  /** Render type */
  type: "image" | "audio";
}

/**
 * Fetches an encrypted file from Firebase Storage via a signed URL,
 * decrypts it client-side, and renders as an image or audio element.
 */
export default function EncryptedMedia({ filePath, contentType, type }: EncryptedMediaProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAndDecrypt() {
      try {
        const sharedKey = getCachedSharedKey();
        if (!sharedKey) {
          setError(true);
          setLoading(false);
          return;
        }

        // Get a signed URL from our API
        const res = await fetch(
          `/api/v1/files/signed-url?path=${encodeURIComponent(filePath)}`,
          { credentials: "same-origin" },
        );
        if (!res.ok || cancelled) {
          if (!cancelled) { setError(true); setLoading(false); }
          return;
        }
        const { url } = (await res.json()) as { url: string };

        // Download encrypted bytes
        const fileRes = await fetch(url);
        if (!fileRes.ok || cancelled) {
          if (!cancelled) { setError(true); setLoading(false); }
          return;
        }
        const encryptedBuf = await fileRes.arrayBuffer();

        // Decrypt
        const decrypted = await decryptBytes(encryptedBuf, sharedKey);
        if (!decrypted || cancelled) {
          if (!cancelled) { setError(true); setLoading(false); }
          return;
        }

        // Create blob URL
        const blob = new Blob([decrypted], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);
        blobUrlRef.current = objectUrl;
        if (!cancelled) {
          setBlobUrl(objectUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    }

    void loadAndDecrypt();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [filePath, contentType]);

  if (loading) {
    return (
      <div style={{ width: 200, height: type === "image" ? 150 : 50, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0", borderRadius: 12 }}>
        <span style={{ fontSize: 12, color: "#999" }}>Decrypting…</span>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div style={{ width: 200, height: type === "image" ? 100 : 50, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: 12 }}>
        <span style={{ fontSize: 12, color: "#999" }}>🔒 Cannot decrypt</span>
      </div>
    );
  }

  if (type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={blobUrl}
        alt="Encrypted image"
        style={{ maxWidth: 240, maxHeight: 300, borderRadius: 12, objectFit: "cover" }}
      />
    );
  }

  return (
    <audio controls src={blobUrl} style={{ maxWidth: 240 }}>
      Your browser does not support audio playback.
    </audio>
  );
}
