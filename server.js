const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

// Catch all global exceptions
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception:", err.message || err);
});

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Rejection:", reason);
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
