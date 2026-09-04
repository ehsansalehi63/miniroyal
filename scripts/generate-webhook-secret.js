/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");

console.log(`GITHUB_WEBHOOK_SECRET=${crypto.randomBytes(64).toString("hex")}`);
console.log(`DEPLOY_STATUS_TOKEN=${crypto.randomBytes(32).toString("hex")}`);
