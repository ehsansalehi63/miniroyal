const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Catch all global unhandled promise rejections & uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("⚠️ Global Uncaught Exception:", err.message || err);
});

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Global Unhandled Rejection:", reason);
});

const dev = false;
const hostname = "0.0.0.0";
const port = process.env.PORT ? (isNaN(Number(process.env.PORT)) ? process.env.PORT : Number(process.env.PORT)) : 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log("⏳ Initializing MiniRoyal Official Production Server...");

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", req.url, err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 MiniRoyal Production Server Listening on port/socket: ${port}`);
  });
}).catch((err) => {
  console.error("❌ Failed to prepare Next.js server:", err);
});
