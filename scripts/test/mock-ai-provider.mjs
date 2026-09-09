// Mock AI edit provider for functional testing of /api/ai-tryon.
// Endpoints:
//   POST /mode        {mode:"ok"|"echo"}  — switch behavior
//   POST /native      — AIHubMix native predictions protocol (JSON)
//   POST /edits       — Pollinations/OpenAI images/edits protocol (multipart)
// Requests are appended as JSON lines to /tmp/mock-ai.log for assertions.
import http from "node:http";
import fs from "node:fs";
import sharp from "sharp";

const LOG = "/tmp/mock-ai.log";
fs.writeFileSync(LOG, "");
let mode = "ok";

// A distinct "AI result" image (red square) that differs from any test input.
const aiResultBuf = await sharp({
  create: { width: 64, height: 64, channels: 3, background: { r: 210, g: 40, b: 40 } },
})
  .png()
  .toBuffer();
const aiResultDataUri = `data:image/png;base64,${aiResultBuf.toString("base64")}`;

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
    mode = JSON.parse(raw.toString()).mode === "echo" ? "echo" : "ok";
    return sendJson(res, 200, { mode });
  }

  // AIHubMix native predictions protocol: JSON with input.image = [person, garment]
  if (url.pathname === "/native") {
    const body = JSON.parse(raw.toString());
    const images = body?.input?.image || [];
    log({ endpoint: "native", mode, prompt: body?.input?.prompt || "", images: images.length, model: body?.input?.model });
    if (mode === "echo") return sendJson(res, 200, { output: [images[0]] });
    return sendJson(res, 200, { output: [aiResultDataUri] });
  }

  // Pollinations /v1/images/edits protocol: multipart with image parts + prompt + model
  if (url.pathname === "/edits") {
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];
    const parts = boundary ? parseMultipart(raw, boundary) : [];
    const images = parts.filter((p) => p.name === "image");
    const promptPart = parts.find((p) => p.name === "prompt");
    const modelPart = parts.find((p) => p.name === "model");
    const prompt = promptPart ? promptPart.body.toString() : "";
    log({
      endpoint: "edits",
      mode,
      prompt,
      model: modelPart ? modelPart.body.toString() : "",
      files: images.map((p) => p.filename),
      images: images.length,
    });
    if (mode === "echo" && images[0]) {
      const personB64 = images[0].body.toString("base64");
      return sendJson(res, 200, { data: [{ b64_json: `data:image/jpeg;base64,${personB64}` }] });
    }
    return sendJson(res, 200, { data: [{ b64_json: aiResultBuf.toString("base64") }] });
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(9911, () => console.log("mock AI provider ready on :9911"));
