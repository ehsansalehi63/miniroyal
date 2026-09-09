// Mock AI edit provider for functional testing of /api/ai-tryon.
// Endpoints:
//   POST /mode        {mode:"ok"|"echo"|"invent"} — switch behavior
//   POST /native      — AIHubMix native predictions protocol (JSON)
//   POST /edits       — Pollinations/OpenAI images/edits protocol (multipart)
// Modes:
//   ok     → simulates a REAL edit: composites a garment-colored patch onto
//            the received person photo (identity preserved → must be accepted)
//   echo   → returns the person photo byte-identical (→ must be rejected)
//   invent → returns an unrelated solid image, like a text-to-image model
//            that ignored the photos (→ must be rejected by identity guard)
// Requests are appended as JSON lines to /tmp/mock-ai.log for assertions.
import http from "node:http";
import fs from "node:fs";
import sharp from "sharp";

const LOG = "/tmp/mock-ai.log";
fs.writeFileSync(LOG, "");
let mode = "ok";

const inventedBuf = await sharp({
  create: { width: 96, height: 96, channels: 3, background: { r: 210, g: 40, b: 40 } },
})
  .png()
  .toBuffer();

/** Simulate a faithful try-on edit: keep the person photo, change only the
 *  torso area (as if the garment was put on). */
async function simulateRealEdit(personBuf) {
  const meta = await sharp(personBuf).metadata();
  const w = meta.width || 480;
  const h = meta.height || 640;
  const patchW = Math.round(w * 0.4);
  const patchH = Math.round(h * 0.3);
  const left = Math.round((w - patchW) / 2);
  const top = Math.round(h * 0.35);
  const patch = await sharp({
    create: { width: patchW, height: patchH, channels: 4, background: { r: 240, g: 200, b: 60, alpha: 1 } },
  })
    .png()
    .toBuffer();
  return sharp(personBuf)
    .composite([{ input: patch, left, top }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(boundaryBuf);
  while (start !== -1) {
    start += boundaryBuf.length;
    if (buffer.slice(start, start + 2).toString() === "--") break;
    start += 2; // skip CRLF
    const end = buffer.indexOf(boundaryBuf, start);
    if (end === -1) break;
    let chunk = buffer.slice(start, end);
    if (chunk.slice(-2).toString() === "\r\n") chunk = chunk.slice(0, -2);
    const headerEnd = chunk.indexOf("\r\n\r\n");
    if (headerEnd === -1) { start = end; continue; }
    const headers = chunk.slice(0, headerEnd).toString();
    const body = chunk.slice(headerEnd + 4);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const fileMatch = headers.match(/filename="([^"]+)"/);
    parts.push({ name: nameMatch?.[1], filename: fileMatch?.[1], body });
    start = end;
  }
  return parts;
}

function log(entry) {
  fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const raw = await readBody(req);

  if (url.pathname === "/mode" && req.method === "POST") {
    const requested = JSON.parse(raw.toString()).mode;
    mode = ["ok", "echo", "invent"].includes(requested) ? requested : "ok";
    return sendJson(res, 200, { mode });
  }

  // AIHubMix native predictions protocol: JSON with input.image = [person, garment]
  if (url.pathname === "/native") {
    const body = JSON.parse(raw.toString());
    const images = body?.input?.image || [];
    const personDataUri = images[0] || "";
    log({ endpoint: "native", mode, prompt: body?.input?.prompt || "", images: images.length, model: body?.input?.model });
    if (mode === "echo") return sendJson(res, 200, { output: [personDataUri] });
    if (mode === "invent") {
      return sendJson(res, 200, { output: [`data:image/png;base64,${inventedBuf.toString("base64")}`] });
    }
    const personMatch = personDataUri.match(/^data:[^;]+;base64,(.+)$/);
    if (!personMatch) return sendJson(res, 400, { error: "no person image" });
    const edited = await simulateRealEdit(Buffer.from(personMatch[1], "base64"));
    return sendJson(res, 200, { output: [`data:image/jpeg;base64,${edited.toString("base64")}`] });
  }

  // Pollinations /v1/images/edits protocol: multipart with image parts + prompt + model + size
  if (url.pathname === "/edits") {
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];
    const parts = boundary ? parseMultipart(raw, boundary) : [];
    const images = parts.filter((p) => p.name === "image");
    const prompt = parts.find((p) => p.name === "prompt")?.body.toString() || "";
    const model = parts.find((p) => p.name === "model")?.body.toString() || "";
    const size = parts.find((p) => p.name === "size")?.body.toString() || "";
    log({ endpoint: "edits", mode, prompt, model, size, files: images.map((p) => p.filename), images: images.length });

    if (mode === "echo" && images[0]) {
      const personB64 = images[0].body.toString("base64");
      return sendJson(res, 200, { data: [{ b64_json: `data:image/jpeg;base64,${personB64}` }] });
    }
    if (mode === "invent") {
      return sendJson(res, 200, { data: [{ b64_json: inventedBuf.toString("base64") }] });
    }
    if (!images[0]) return sendJson(res, 400, { error: "no image parts" });
    const edited = await simulateRealEdit(images[0].body);
    return sendJson(res, 200, { data: [{ b64_json: edited.toString("base64") }] });
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(9911, () => console.log("mock AI provider ready on :9911"));
