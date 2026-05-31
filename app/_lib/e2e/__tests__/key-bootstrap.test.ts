/**
 * Tests for the eager E2E key bootstrap module.
 *
 * `@/_lib/crypto` is fully mocked because the real module touches IndexedDB
 * and WebCrypto APIs that are not available in jsdom.
 */

jest.mock("@/_lib/crypto", () => ({
  getOrGenerateKeyPair: jest.fn(),
  exportPublicKey: jest.fn(),
  importPublicKey: jest.fn(),
  deriveSharedKey: jest.fn(),
}));

import {
  getOrGenerateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
} from "@/_lib/crypto";
import {
  ensureKeysBootstrapped,
  getCachedSharedKey,
  resetKeyBootstrapForTests,
} from "../key-bootstrap";

const mockGetOrGenerateKeyPair = getOrGenerateKeyPair as jest.Mock;
const mockExportPublicKey = exportPublicKey as jest.Mock;
const mockImportPublicKey = importPublicKey as jest.Mock;
const mockDeriveSharedKey = deriveSharedKey as jest.Mock;

const fakeKeyPair = {
  privateKey: { __tag: "priv" } as unknown as CryptoKey,
  publicKey: { __tag: "pub" } as unknown as CryptoKey,
};
const fakeSharedKey = { __tag: "shared" } as unknown as CryptoKey;
const fakePartnerKey = { __tag: "partnerPub" } as unknown as CryptoKey;

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

function fakeRes(body: unknown, ok = true, status = 200): FakeResponse {
  return { ok, status, json: async () => body };
}

function mockFetchSequence(
  handlers: Array<() => FakeResponse | Promise<FakeResponse>>,
) {
  const fn = jest.fn();
  handlers.forEach((h) => fn.mockImplementationOnce(async () => h()));
  fn.mockImplementation(async () => fakeRes({}));
  (global as unknown as { fetch: jest.Mock }).fetch = fn;
  return fn;
}

describe("ensureKeysBootstrapped", () => {
  beforeEach(() => {
    resetKeyBootstrapForTests();
    jest.clearAllMocks();
    mockGetOrGenerateKeyPair.mockResolvedValue(fakeKeyPair);
    mockExportPublicKey.mockResolvedValue("pub-b64");
    mockImportPublicKey.mockResolvedValue(fakePartnerKey);
    mockDeriveSharedKey.mockResolvedValue(fakeSharedKey);
  });

  it("returns the same shared key on a second call without re-fetching", async () => {
    const fetchMock = mockFetchSequence([
      () => fakeRes({ ok: true }),
      () => fakeRes({ publicKey: "partner-b64" }),
    ]);

    const first = await ensureKeysBootstrapped();
    expect(first.status).toBe("ready");
    expect(first.sharedKey).toBe(fakeSharedKey);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getCachedSharedKey()).toBe(fakeSharedKey);

    const second = await ensureKeysBootstrapped();
    expect(second.status).toBe("ready");
    expect(second.sharedKey).toBe(fakeSharedKey);
    // No additional fetches on second call.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockGetOrGenerateKeyPair).toHaveBeenCalledTimes(1);
  });

  it('returns "no-partner" when partner-key endpoint returns null', async () => {
    mockFetchSequence([
      () => fakeRes({ ok: true }),
      () => fakeRes({ publicKey: null }),
    ]);

    const result = await ensureKeysBootstrapped();
    expect(result.status).toBe("no-partner");
    expect(result.sharedKey).toBeNull();
    expect(getCachedSharedKey()).toBeNull();
    expect(mockDeriveSharedKey).not.toHaveBeenCalled();
  });

  it('returns "error" when partner-key endpoint throws', async () => {
    mockFetchSequence([
      () => fakeRes({ ok: true }),
      () => {
        throw new Error("network down");
      },
    ]);

    const result = await ensureKeysBootstrapped();
    expect(result.status).toBe("error");
    expect(result.sharedKey).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(getCachedSharedKey()).toBeNull();
  });
});
