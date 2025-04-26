# Custom TCP HTTP Server – What I Learned

> _“If you can’t explain it simply, you don’t understand it well enough.” – Albert Einstein_

Over the past week I built a **bare‑metal HTTP/1.1 server** in TypeScript using **Node’s `net` module**, _without_ relying on the built‑in `http` package.  
This README captures **what I learned**, **how the code is organised**, and **how you can run & test it yourself**.

---

## Key Learning Outcomes

| # | Topic | Take‑away |
|---|-------|-----------|
| 1 | **TCP vs HTTP** | A TCP socket is just a byte stream. HTTP is a text protocol I had to **parse manually** (status‑line, headers, body). |
| 2 | **Buffers** | Learned to accumulate chunks, search for `\r\n\r\n`, slice, and convert them safely without data loss. |
| 3 | **Streaming parser** | Built `parseRequest()` that handles partial packets and multiple pipelined requests. |
| 4 | **Routing** | Implemented a tiny router by mapping `"<METHOD> /<base>"` to handler functions. |
| 5 | **Response building** | Wrote my own `ResponseWriter` abstraction for status, headers, gzip encoding, and connection management. |
| 6 | **Static file I/O** | Practiced secure path resolution (`path.join`) and async FS APIs for upload (POST) & download (GET). |
| 7 | **Content‑Negotiation** | Added gzip compression when the client sends `Accept-Encoding: gzip`. |
| 8 | **Keep‑Alive vs Close** | Honoured the `Connection` header and gracefully closed sockets when requested. |
| 9 | **CLI flags** | Introduced `--directory <path>` so the server can serve files from any folder. |
| 10 | **Defensive coding** | Logged every step, validated input, and returned proper HTTP status codes (400, 404, 500). |

---

## Project Structure

```
codecrafters-http-server-typescript/
├── app/
│   └── main.ts         # Main entry – TCP server, routing loop, all logic
├── README.md           # This file
├── package.json        # Project metadata and scripts
├── tsconfig.json       # TypeScript configuration
├── codecrafters.yml    # Codecrafters platform config
├── your_program.sh     # Local run script
├── .gitignore
├── .gitattributes
├── bun.lockb
└── (uploaded files)    # Served via /files endpoints
```

### Core Functions

| Function | Responsibility |
|----------|----------------|
| **`parseRequest`** | Converts a raw Buffer into `{ method, path, headers, body }` while handling partial data. |
| **`makeWriter`**   | Wraps the socket; guarantees headers end once, supports optional gzip & graceful close. |
| **Route handlers** | `GET /`, `GET /echo/:text`, `GET /user-agent`, `GET /files/:name`, `POST /files/:name`. |

---

## Running the Server

```bash
# 1. Install deps (TypeScript & ts-node if you don't have them)
npm i -g typescript ts-node

# 2. Start the server (default root is /)
ts-node app/main.ts --directory ./public
```

Server listens on **http://localhost:4221**

### Example Requests

```bash
# Plain echo
curl http://localhost:4221/echo/hello

# Gzipped echo
curl -H "Accept-Encoding: gzip" http://localhost:4221/echo/hello --compressed

# Upload a file
curl -X POST --data-binary @photo.jpg http://localhost:4221/files/photo.jpg

# Download a file
curl http://localhost:4221/files/photo.jpg --output photo.jpg
```

---

## Internals Walk‑Through

1. **Connection accepted** → `buffer` accumulates chunks.  
2. `parseRequest()` returns only when headers **and** declared body length are present.  
3. Router key is computed as `"<METHOD> /<basePath>"`.  
4. Matching handler builds a response via `ResponseWriter`.  
5. If `Connection: close` → socket ends after `.end()`.

---

## Security & Limitations

* **Directory Traversal** – Currently prevents `../` by using `path.join`, but extra validation would be safer.  
* **No MIME Detection** – Always sends `application/octet-stream`. Could integrate `mime` package.  
* **No Chunked Transfer** – Only `Content-Length` bodies are supported.  
* **Single‑threaded** – Heavy file transfers block the event loop; moving to worker threads or streams would help.

---

## Where I’ll Go Next

- Support **HTTP/1.1 keep‑alive** with persistent connection pooling.  
- Implement **streaming uploads/downloads** to avoid loading entire files in memory.  
- Add **TLS (HTTPS)** using `tls.createServer`.  
- Integrate a minimal **middleware** system for logging, auth, etc.  
- Write **unit tests** for parser edge‑cases & route handlers.
- Eventually I want to sclale this into a flexible **custom server** that can host **multiple services** at once.

---

## 🤝 Acknowledgements

Huge thanks to the [Codecrafters](https://codecrafters.io) platform for the challenge and learning experience, and to ChatGPT for rubber‑ducky debugging sessions.

---

_“Building it from scratch gave me x‑ray vision into every HTTP header flowing across the wire.”_ Enjoy exploring the code!

