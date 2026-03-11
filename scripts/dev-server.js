"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const START_PORT = Number(process.env.PORT || 5173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^([.][.][/\\])+/, "");
  return path.join(ROOT, normalized);
}

function serveFile(res, filePath, statusCode = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    res.writeHead(statusCode, {
      "Content-Type": type,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const reqPath = req.url === "/" ? "/index.html" : req.url;
  const target = safePath(reqPath);

  if (!target.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(target, (err, stat) => {
    if (!err && stat.isFile()) {
      serveFile(res, target);
      return;
    }
    // SPA fallback
    serveFile(res, path.join(ROOT, "index.html"));
  });
});

function listenWithFallback(port) {
  server.once("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      listenWithFallback(port + 1);
      return;
    }
    throw err;
  });

  server.listen(port, () => {
    console.log(`Deep Signal dev server running at http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.");
  });
}

listenWithFallback(START_PORT);
