import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("decodeObfuscatedText", () => {
  it("retries a transient font download failure within the same decode request", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);
    vi.doMock("fontkit", () => ({
      create: () => ({
        characterSet: [65],
        glyphForCodePoint: () => ({ name: "one" }),
      }),
    }));

    const { decodeObfuscatedText } = await import("./font-decoder");

    await expect(decodeObfuscatedText("A", "font-1")).resolves.toBe("1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
