/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { appendFile } = require("fs/promises");
const { join } = require("path");
const { parse } = require("url");
const { randomUUID } = require("crypto");
const next = require("next");

const APP_LOG_FILE = process.env.APP_LOG_FILE || join(process.cwd(), ".application.log");
async function logRequest(record) {
  try { await appendFile(APP_LOG_FILE, `${JSON.stringify({ timestamp: new Date().toISOString(), ...record })}\n`, "utf8"); } catch (error) { console.error("Failed to write request log:", error.message || error); }
}

// Catch all global exceptions
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception:", err.message || err);
  void logRequest({ level: "error", event: "uncaught_exception", message: err.message || String(err) });
});

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Rejection:", reason);
  void logRequest({ level: "error", event: "unhandled_rejection", message: reason instanceof Error ? reason.message : String(reason) });
});

const dev = false;
const hostname = "0.0.0.0";
const port = process.env.PORT
  ? isNaN(Number(process.env.PORT))
    ? process.env.PORT
    : Number(process.env.PORT)
  : 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let isReady = false;

console.log("⏳ Initializing MiniRoyal Production Server...");

app.prepare()
  .then(() => {
    isReady = true;
    console.log("✅ Next.js App prepared and ready for production requests.");
  })
  .catch((err) => {
    console.error("❌ Next.js prepare failed:", err);
  });

const server = createServer(async (req, res) => {
  const startedAt = Date.now();
  const requestId = req.headers["x-request-id"] || randomUUID();
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  res.on("finish", () => { void logRequest({ level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info", event: "http_request", route: req.url, method: req.method, statusCode: res.statusCode, requestId, ip, context: { durationMs: Date.now() - startedAt } }); });
  if (req.url === "/_health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ status: "ok", ready: isReady, timestamp: new Date().toISOString() }));
    return;
  }
  // If request arrives during initial 1-2s startup, wait briefly until Next.js is ready
  if (!isReady) {
    let waitChecks = 0;
    while (!isReady && waitChecks < 30) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitChecks++;
    }
  }

  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error("Error handling request:", req.url, err.message || err);
    void logRequest({ level: "error", event: "request_exception", route: req.url, method: req.method, statusCode: 500, requestId, ip, message: err.message || String(err) });
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }
});

// Bind HTTP server immediately to prevent 502 Bad Gateway / Connection Refused on Nginx
server.listen(port, (err) => {
  if (err) throw err;
  console.log(`🚀 MiniRoyal HTTP Server bound immediately to port/socket: ${port}`);
});
