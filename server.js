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

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Serve static files from .next/static directly for max performance and zero missing CSS
    if (pathname.startsWith("/_next/static/")) {
      const filePath = path.join(__dirname, ".next", "static", pathname.replace("/_next/static/", ""));
      if (fs.existsSync(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Serve static files from public/ directly
    if (pathname.startsWith("/fonts/") || pathname.startsWith("/file.svg") || pathname.startsWith("/globe.svg")) {
      const filePath = path.join(__dirname, "public", pathname);
      if (fs.existsSync(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // Pass all other requests to Next.js handler
    handle(req, res, parsedUrl).catch((err) => {
      console.error("Error handling request:", pathname, err.message || err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 MiniRoyal Production Server Ready & Listening on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("❌ Failed to prepare Next.js server:", err);
});
