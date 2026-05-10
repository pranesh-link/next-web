import { compressImage } from "../image-compression";

describe("compressImage", () => {
  it("should be a function with arity 1 (file required, options optional)", () => {
    expect(typeof compressImage).toBe("function");
    expect(compressImage.length).toBe(1);
  });

  it("should return the original file unchanged when type is not an image", async () => {
    const file = new File(["hello world"], "note.txt", { type: "text/plain" });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("should return the original file when size is below maxBytes", async () => {
    // Tiny image file (below default 200_000 byte threshold).
    const file = new File([new Uint8Array(100)], "tiny.png", {
      type: "image/png",
    });
    const result = await compressImage(file);
    expect(result).toBe(file);
  });

  it("should return the original file when Image fails to load (img.onerror)", async () => {
    const big = new File([new Uint8Array(300_000)], "big.png", {
      type: "image/png",
    });
    // jsdom's Image will not actually decode bytes — onerror fires async,
    // but our helper also handles onload. To force the error path
    // deterministically, stub URL.createObjectURL to a value that triggers
    // onerror via the Image constructor below.
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:mock");

    // Patch Image so onerror always fires.
    const OriginalImage = global.Image;
    // @ts-expect-error - assigning to global.Image for test
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    };

    try {
      const result = await compressImage(big);
      expect(result).toBe(big);
    } finally {
      global.Image = OriginalImage;
      URL.createObjectURL = originalCreateObjectURL;
    }
  });
});
