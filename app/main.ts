import * as net from "net";

import * as fs from "fs";
import * as path from "path";
import { gzipSync } from "zlib";

console.log("Hi Tolu");

let baseDirectory = "/"; // Default directory, updated via --directory flag

interface Request {
  method: string;
  path: string; // e.g. "/echo/hello"
  headers: Record<string, string>;
  body: Buffer; // raw bytes of body
}

interface ResponseWriter {
  writeStatus(statusCode: number, statusText: string): void;
  writeHeader(name: string, value: string): void;
  end(body?: Buffer | string): void;
}

function parseRequest(
  buffer: Buffer
): { req: Request; consumed: number } | null {
  const sep = Buffer.from("\r\n\r\n");
  const headerEnd = buffer.indexOf(sep);
  if (headerEnd === -1) return null; // not even headers yet

  const headerText = buffer.subarray(0, headerEnd).toString("utf8");
  const lines = headerText.split("\r\n");
  const [method, fullPath] = lines[0].split(" ");

  // headers map
  const headers: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const name = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      headers[name] = value;
    }
  }

  // body
  const contentLength = headers["content-length"]
    ? parseInt(headers["content-length"], 10)
    : 0;
  const bodyStart = headerEnd + sep.length;
  const totalNeeded = bodyStart + contentLength;
  if (buffer.length < totalNeeded) return null; // wait for full body

  const body = buffer.subarray(bodyStart, totalNeeded);

  return {
    req: { method, path: fullPath, headers, body },
    consumed: totalNeeded,
  };
}

function makeWriter(socket: net.Socket, wantsClose: boolean): ResponseWriter {
  let headersSent = false;

  return {
    writeStatus(code, text) {
      const line = `HTTP/1.1 ${code} ${text}\r\n`;
      socket.write(line);
      headersSent = true;
    },
    writeHeader(name, value) {
      socket.write(`${name}: ${value}\r\n`);
    },
    end(body) {
      // if no status/headers yet, send default 200
      if (!headersSent) {
        this.writeStatus(200, "OK");
      }
      // if client asked to close, echo it
      if (wantsClose) {
        this.writeHeader("Connection", "close");
      }
      // if we never wrote any Content-Length, default to 0
      if (!headersSent) {
        this.writeHeader("Content-Length", "0");
      }
      // end of headers
      socket.write("\r\n");

      if (body !== undefined) {
        const buf = typeof body === "string" ? Buffer.from(body, "utf8") : body;
        socket.write(buf);
      }
      // finally, close if requested
      if (wantsClose) {
        socket.end();
      }
    },
  };
}

type Handler = (req: Request, res: ResponseWriter) => void;

const routes: Record<string, Handler> = {
  "GET /": (_req, res) => {
    res.writeStatus(200, "OK");
    res.end();
  },
  "GET /echo": (req, res) => {
    const pathParts = req.path.split("/");
    if (pathParts.length === 3) {
      const echoString = pathParts[2];
      res.writeStatus(200, "OK");

      // Choose gzip compression if client supports it
      const acceptEnc = req.headers["accept-encoding"] || "";
      const supportsGzip = acceptEnc.includes("gzip");
      let bodyBuffer: Buffer;
      if (supportsGzip) {
        bodyBuffer = gzipSync(Buffer.from(echoString, "utf8"));
        res.writeHeader("Content-Encoding", "gzip");
      } else {
        bodyBuffer = Buffer.from(echoString, "utf8");
      }

      res.writeHeader("Content-Type", "text/plain");
      res.writeHeader("Content-Length", bodyBuffer.length.toString());
      res.end(bodyBuffer);
    } else {
      res.writeStatus(404, "Not Found");
      res.end();
    }
  },
  "GET /user-agent": (req, res) => {
    const userAgent = req.headers["user-agent"];
    if (userAgent) {
      res.writeStatus(200, "OK");
      res.writeHeader("Content-Type", "text/plain");
      res.writeHeader("Content-Length", userAgent.length.toString());
      res.end(userAgent);
    } else {
      res.writeStatus(400, "Bad Request");
      res.end("User-Agent header is missing");
    }
  },
  "GET /files": (req, res) => {
    const pathParts = req.path.split("/");
    if (pathParts.length === 3) {
      const filename = pathParts[2];
      const filePath = path.join(baseDirectory, filename);

      // Check if the file exists
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeStatus(404, "Not Found");
          res.end();
          return;
        }

        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeStatus(500, "Internal Server Error");
            res.end();
            return;
          }

          res.writeStatus(200, "OK");
          res.writeHeader("Content-Type", "application/octet-stream");
          res.writeHeader("Content-Length", data.length.toString());
          res.end(data);
        });
      });
    } else {
      res.writeStatus(404, "Not Found");
      res.end();
    }
  },
  "POST /files": (req, res) => {
    const pathParts = req.path.split("/");
    if (pathParts.length === 3) {
      const filename = pathParts[2];
      const filePath = path.join(baseDirectory, filename);

      // Write the request body to the file
      fs.writeFile(filePath, req.body, (err) => {
        if (err) {
          res.writeStatus(500, "Internal Server Error");
          res.end();
          return;
        }

        res.writeStatus(201, "Created");
        res.end();
      });
    } else {
      res.writeStatus(404, "Not Found");
      res.end();
    }
  },
};

const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);

  socket.on("data", (chunk) => {
    console.log("Received chunk from client");
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      const parsed = parseRequest(buffer);
      if (!parsed) break;

      const { req, consumed } = parsed;
      buffer = buffer.subarray(consumed);

      const wantsClose =
        (req.headers["connection"] || "").toLowerCase() === "close";
      const res = makeWriter(socket, wantsClose);

      const key = `${req.method} /${req.path.split("/")[1]}`;
      const handler = routes[key];

      if (handler) {
        handler(req, res);
      } else {
        // Respond with 404 for any unmatched route
        res.writeStatus(404, "Not Found");
        res.end();
      }
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

// Parse the --directory flag
const args = process.argv.slice(2);
const directoryFlagIndex = args.indexOf("--directory");
if (directoryFlagIndex !== -1 && args[directoryFlagIndex + 1]) {
  baseDirectory = args[directoryFlagIndex + 1];
  console.log(`Serving files from directory: ${baseDirectory}`);
}

server.listen(4221, "localhost");
