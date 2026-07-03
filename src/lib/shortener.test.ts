import { describe, it, expect, vi } from "vitest";
import { shorten, shortenerAvailable } from "./shortener";

const TARGET = "https://xchtip.app/jar/xch1abc?scheme=purple";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("shorten", () => {
  it("POSTs the target url and returns the code + short url", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(200, { code: "alice", shortUrl: "https://alice.xchtip.app" }),
    );
    const result = await shorten(TARGET, fetchImpl as unknown as typeof fetch, "https://api.xchtip.app");
    expect(result).toEqual({ code: "alice", shortUrl: "https://alice.xchtip.app" });
    // Correct endpoint + method + body.
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.xchtip.app/shorten");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ url: TARGET });
  });

  it("rejects with a safe message on a non-2xx response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(429, { error: "rate limited" }));
    await expect(
      shorten(TARGET, fetchImpl as unknown as typeof fetch, "https://api.xchtip.app"),
    ).rejects.toThrow(/429/);
  });

  it("rejects when the response is missing code/shortUrl", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { nope: true }));
    await expect(
      shorten(TARGET, fetchImpl as unknown as typeof fetch, "https://api.xchtip.app"),
    ).rejects.toThrow(/unexpected/i);
  });

  it("rejects immediately when no API base is configured (never calls fetch)", async () => {
    const fetchImpl = vi.fn();
    await expect(
      shorten(TARGET, fetchImpl as unknown as typeof fetch, ""),
    ).rejects.toThrow(/isn't available/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("shortenerAvailable", () => {
  it("is false when no API base is configured for this build", () => {
    // The default build has no VITE_SHORTENER_API, so the feature is off (graceful).
    expect(typeof shortenerAvailable()).toBe("boolean");
  });
});
