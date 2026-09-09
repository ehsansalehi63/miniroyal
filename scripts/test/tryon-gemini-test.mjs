/**
 * MiniRoyal Try-On — unit tests for the FREE-FIRST Gemini provider.
 *
 * Runs against a local stub of the Gemini REST API (plain node http
 * server) so no real key or network access is needed.
 *
 * Usage:  node scripts/test/tryon-gemini-test.mjs
 *
 * Requires tsx for the TS import — uses the project's own dependency.
 * Falls back to a clear error if tsx is missing.
 */

import { strict as assert } from "node:assert";
import http from "node:http";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HwAGgwJ/l" +
  "6Bv5QAAAABJRU5ErkJggg==";

const okImageBody = (mime = "image/png") =>
  JSON.stringify({
    candidates: [
      { content: { parts: [{ inlineData: { mimeType: mime, data: "AAAABBBBCCCC" } }] } },
    ],
  });

async function withStub(handler, fn) {
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const out = handler(req, body ? JSON.parse(body) : null);
    res.writeHead(out.status, { "Content-Type": "application/json" });
    res.end(out.body);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    return await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
}

async function loadProvider() {
  try {
    await import("tsx/cjs");
  } catch {
    console.error("tsx is required: run `npm install` first, then retry.");
    process.exit(2);
  }
  return import("../../app/lib/tryon-gemini.ts");
}

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push([name, true, ""]);
    console.log(`ok - ${name}`);
  } catch (error) {
    results.push([name, false, String(error && error.message ? error.message : error)]);
    console.log(`FAIL - ${name}: ${error && error.message ? error.message : error}`);
  }
}

const tests = [
  [
    "key parsing: comma-separated + GEMINI_API_KEY fallback",
    async ({ geminiKeys }) => {
      process.env.GEMINI_API_KEYS = " a1 , ,b2 ";
      delete process.env.GEMINI_API_KEY;
      assert.deepEqual(geminiKeys(), ["a1", "b2"]);
      delete process.env.GEMINI_API_KEYS;
      process.env.GEMINI_API_KEY = " solo ";
      assert.deepEqual(geminiKeys(), ["solo"]);
      delete process.env.GEMINI_API_KEY;
      assert.deepEqual(geminiKeys(), []);
    },
  ],
  [
    "model list: configured first, deduped, sane defaults",
    async ({ geminiModels }) => {
      delete process.env.GEMINI_IMAGE_MODEL;
      assert.deepEqual(geminiModels(), ["gemini-2.5-flash-image", "gemini-3.1-flash-image"]);
      process.env.GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
      assert.deepEqual(geminiModels(), ["gemini-3.1-flash-image", "gemini-2.5-flash-image"]);
      delete process.env.GEMINI_IMAGE_MODEL;
    },
  ],
  [
    "no keys -> null with zero attempts",
    async ({ callGeminiTryon }) => {
      delete process.env.GEMINI_API_KEYS;
      delete process.env.GEMINI_API_KEY;
      const attempts = [];
      assert.equal(await callGeminiTryon(TINY_PNG, TINY_PNG, "p", attempts), null);
      assert.equal(attempts.length, 0);
    },
  ],
  [
    "bad input images -> null with one attempt",
    async ({ callGeminiTryon }) => {
      process.env.GEMINI_API_KEY = "k";
      const attempts = [];
      assert.equal(await callGeminiTryon("nope", TINY_PNG, "p", attempts), null);
      assert.equal(attempts.length, 1);
      assert.equal(attempts[0].provider, "gemini-free");
      delete process.env.GEMINI_API_KEY;
    },
  ],
  [
    "success: parses inlineData + posts prompt + 2 images + modalities",
    async ({ callGeminiTryon }) => {
      process.env.GEMINI_API_KEY = "k";
      let seen;
      await withStub(
        (req, body) => {
          seen = { url: req.url, key: req.headers["x-goog-api-key"], body };
          return { status: 200, body: okImageBody() };
        },
        async (baseUrl) => {
          const out = await callGeminiTryon(TINY_PNG, TINY_PNG, "dress her", [], { baseUrl });
          assert.equal(out, "data:image/png;base64,AAAABBBBCCCC");
        }
      );
      assert.ok(seen.url.includes("/models/gemini-2.5-flash-image:generateContent"));
      assert.equal(seen.key, "k");
      assert.equal(seen.body.generationConfig.responseModalities.join(","), "TEXT,IMAGE");
      assert.equal(seen.body.contents[0].parts.length, 3);
      assert.equal(seen.body.contents[0].parts[0].text, "dress her");
      assert.ok(seen.body.contents[0].parts[1].inlineData.data.length > 10);
      assert.ok(seen.body.contents[0].parts[2].inlineData.data.length > 10);
      delete process.env.GEMINI_API_KEY;
    },
  ],
  [
    "429 rotates to the next key",
    async ({ callGeminiTryon }) => {
      process.env.GEMINI_API_KEYS = "bad,good";
      const seenKeys = [];
      await withStub(
        (req) => {
          const key = req.headers["x-goog-api-key"];
          seenKeys.push(key);
          return key === "good"
            ? { status: 200, body: okImageBody() }
            : { status: 429, body: JSON.stringify({ error: { message: "quota exceeded" } }) };
        },
        async (baseUrl) => {
          const attempts = [];
          const out = await callGeminiTryon(TINY_PNG, TINY_PNG, "p", attempts, { baseUrl });
          assert.equal(out, "data:image/png;base64,AAAABBBBCCCC");
          assert.deepEqual(seenKeys, ["bad", "good"]);
          assert.equal(attempts.length, 1);
          assert.ok(attempts[0].detail.includes("[key 1/2]"));
        }
      );
      delete process.env.GEMINI_API_KEYS;
    },
  ],
  [
    "safety block stops rotation (no second key call)",
    async ({ callGeminiTryon }) => {
      process.env.GEMINI_API_KEYS = "k1,k2";
      let calls = 0;
      await withStub(
        () => {
          calls++;
          return {
            status: 200,
            body: JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }),
          };
        },
        async (baseUrl) => {
          const attempts = [];
          assert.equal(await callGeminiTryon(TINY_PNG, TINY_PNG, "p", attempts, { baseUrl }), null);
          assert.equal(calls, 1);
          assert.ok(attempts[0].detail.includes("blocked"));
        }
      );
      delete process.env.GEMINI_API_KEYS;
    },
  ],
  [
    "404 tries the next model",
    async ({ callGeminiTryon }) => {
      process.env.GEMINI_API_KEY = "k";
      const seenModels = [];
      await withStub(
        (req) => {
          const model = req.url.split("/models/")[1].split(":")[0];
          seenModels.push(model);
          return model === "gemini-2.5-flash-image"
            ? { status: 404, body: JSON.stringify({ error: { message: "not found" } }) }
            : { status: 200, body: okImageBody("image/jpeg") };
        },
        async (baseUrl) => {
          assert.equal(
            await callGeminiTryon(TINY_PNG, TINY_PNG, "p", [], { baseUrl }),
            "data:image/jpeg;base64,AAAABBBBCCCC"
          );
          assert.deepEqual(seenModels, ["gemini-2.5-flash-image", "gemini-3.1-flash-image"]);
        }
      );
      delete process.env.GEMINI_API_KEY;
    },
  ],
  [
    "empty candidates -> null (tries all keys/models)",
    async ({ callGeminiTryon }) => {
      process.env.GEMINI_API_KEY = "k";
      await withStub(
        () => ({ status: 200, body: JSON.stringify({ candidates: [{ content: { parts: [] } }] }) }),
        async (baseUrl) => {
          const attempts = [];
          assert.equal(await callGeminiTryon(TINY_PNG, TINY_PNG, "p", attempts, { baseUrl }), null);
          assert.equal(attempts.length, 2); // 1 key x 2 models
        }
      );
      delete process.env.GEMINI_API_KEY;
    },
  ],
  [
    "fetch throw -> null with attempt (never throws)",
    async ({ callGeminiTryon }) => {
      process.env.GEMINI_API_KEY = "k";
      const attempts = [];
      assert.equal(
        await callGeminiTryon(TINY_PNG, TINY_PNG, "p", attempts, {
          baseUrl: "http://127.0.0.1:1",
          timeoutMs: 2000,
        }),
        null
      );
      assert.ok(attempts.length >= 1);
      delete process.env.GEMINI_API_KEY;
    },
  ],
];

const provider = await loadProvider();
for (const [name, fn] of tests) {
  delete process.env.GEMINI_API_KEYS;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_IMAGE_MODEL;
  await test(name, () => fn(provider));
}
const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} Gemini tests passed`);
process.exit(failed.length ? 1 : 0);
