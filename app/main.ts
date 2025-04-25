import * as net from "net";

console.log("Hi Tolu");

const CLRF = "\r\n";
const HTTP_OK = "HTTP/1.1 200 OK" + CLRF;
const HTTP_NOT_FOUND = "HTTP/1.1 404 Not Found" + CLRF;
const HTTP_BAD_REQUEST = "HTTP/1.1 400 Bad Request" + CLRF;
const CONTENT_TYPE = "Content-Type: text/html" + CLRF;
const CONTENT_LENGTH = "Content-Length: 13" + CLRF;
const HTML = "<h1>Hello</h1>" + CLRF;
const HTTP_RESPONSE = HTTP_OK + CONTENT_TYPE + CONTENT_LENGTH + CLRF + HTML;
const HTTP_RESPONSE_LENGTH = HTTP_RESPONSE.length;
const HTTP_RESPONSE_HEADER = HTTP_OK + CONTENT_TYPE + CONTENT_LENGTH;
const HTTP_RESPONSE_BODY = HTML;
const HTTP_RESPONSE_END = CLRF + CLRF;
const HTTP_RESPONSE_FULL = HTTP_RESPONSE_HEADER + HTTP_RESPONSE_BODY + HTTP_RESPONSE_END;
const HTTP_RESPONSE_FULL_LENGTH = HTTP_RESPONSE.length;
const HTTP_RESPONSE_END_LENGTH = HTTP_RESPONSE_END.length;
const HTTP_RESPONSE_HEADER_LENGTH = HTTP_RESPONSE_HEADER.length;
const HTTP_RESPONSE_BODY_LENGTH = HTTP_RESPONSE_BODY.length;
const HTTP_RESPONSE_HEADER_END = HTTP_RESPONSE_HEADER + CLRF;
const HTTP_RESPONSE_BODY_END = HTTP_RESPONSE_BODY + CLRF;
const HTTP_RESPONSE_END_HEADER = HTTP_RESPONSE_END + CLRF;
const HTTP_RESPONSE_END_BODY = HTTP_RESPONSE_END + CLRF;


const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        console.log("Received data from client");
        console.log(data.toString());
        // Parse the request
        const request = data.toString();
        // Split the request into lines
        const requestLines = request.split(CLRF);
        // Get the request method and path
        const requestLine = requestLines[0];
        const requestMethod = requestLine.split(" ")[0];
        const requestPath = requestLine.split(" ")[1];
        if (requestMethod === "GET") {
            console.log("GET request received");
            const requestPath = requestLine.split(" ")[1];
            // Check if the request path is "/"
            const response = requestPath === '/' ? HTTP_OK + CLRF : HTTP_NOT_FOUND+ CLRF;
            console.log("Request path", requestPath);
            socket.write(Buffer.from(response));  
        }
    });

    socket.on("clsoe", () => {
        console.log("Client disconnected");
        socket.end();
    });
});


server.listen(4221, 'localhost');