/**
 * Custom server: Next.js handler + Socket.IO on the same HTTP port.
 *
 * Dev:   tsx src/server.ts  (replaces `next dev`)
 * Prod:  node .next/standalone/server.js  (Next.js standalone already wraps this)
 *
 * Socket.IO attaches to the same HTTP server so Nginx only needs one
 * proxy_pass with WebSocket upgrade.
 */

import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { initSocketIO } from "./lib/socket/server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO al mismo HTTP server
  initSocketIO(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Museum Companion running on http://${hostname}:${port}`);
    console.log(`> Socket.IO attached on path /api/socketio`);
    console.log(`> Mode: ${dev ? "development" : "production"}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
