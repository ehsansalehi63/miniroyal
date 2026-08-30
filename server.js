const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

// Global exception safety
process.on("uncaughtException", (err) => {
  console.error("⚠️ Global Uncaught Exception:", err.message || err);
});

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Global Unhandled Rejection:", reason);
});

const dev = false;
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

console.log("⏳ Initializing MiniRoyal Production Server...");

function getMimeType(filePath) {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".ttf")) return "font/ttf";
  if (filePath.endsWith(".woff2")) return "font/woff2";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".ico")) return "image/x-icon";
  return "text/plain; charset=utf-8";
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Serve static files from .next/static with explicit MIME types
    if (pathname.startsWith("/_next/static/")) {
      const relativePath = pathname.replace("/_next/static/", "");
      const filePath = path.join(__dirname, ".next", "static", relativePath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.setHeader("Content-Type", getMimeType(filePath));
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Serve static files from public/ with explicit MIME types
    if (pathname.startsWith("/fonts/") || pathname.startsWith("/public/") || pathname.endsWith(".svg") || pathname.endsWith(".ico")) {
      const cleanPath = pathname.replace(/^\/public\//, "/");
      const filePath = path.join(__dirname, "public", cleanPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.setHeader("Content-Type", getMimeType(filePath));
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Pass all page requests to Next.js handler
    handle(req, res, parsedUrl).catch((err) => {
      console.error("Error handling request:", pathname, err.message || err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 MiniRoyal Production Server Running on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("❌ Failed to prepare Next.js server:", err);
});
