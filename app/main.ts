import * as net from "net";

console.log("Hi Tolu");

const CLRF = "\r\n";
const HTTP_OK = "HTTP/1.1 200 OK" + CLRF;
const HTTP_NOT_FOUND = "HTTP/1.1 404 Not Found" + CLRF;
const CONTENT_TYPE = "Content-Type: " ;
const CONTENT_LENGTH = "Content-Length: " ;


const HTTP_BAD_REQUEST = "HTTP/1.1 400 Bad Request" + CLRF;



const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        console.log("Received data from client");
    
        const request = data.toString();
        const requestLines = request.split(CLRF);
        const requestLine = requestLines[0];
        const requestMethod = requestLine.split(" ")[0];
        const requestPath = requestLine.split(" ")[1];
    
        if (requestMethod === "GET") {
            console.log("GET request received");
            
            // Log the request path
            console.log("Request Path:", requestPath);
            if (requestPath === "/") {
                // Respond with OK
                socket.write(Buffer.from(HTTP_OK + CLRF));
            } else if (requestPath.startsWith("/echo/")) {
                // Respond with the path after "/echo/"
                const responseBody = requestPath.slice("/echo/".length);
                const responseHeaders = [
                    HTTP_OK,
                    CONTENT_TYPE + "text/plain" + CLRF,
                    CONTENT_LENGTH + Buffer.byteLength(responseBody) + CLRF,
                    CLRF
                ].join("");
                console.log("Response Headers:", responseHeaders);
                console.log("Response Body:", responseBody);
                socket.write(Buffer.from(responseHeaders + responseBody));

            } else if (requestPath.startsWith("/user-agent")) {
                // Respond with the User-Agent header
                const userAgentHeader = requestLines.find(line => line.startsWith("User-Agent:"));
                const userAgent = userAgentHeader ? userAgentHeader.split(": ")[1] : "Unknown";
                const responseBody = userAgent;
                const responseHeaders = [
                    HTTP_OK,
                    CONTENT_TYPE + "text/plain" + CLRF,
                    CONTENT_LENGTH + Buffer.byteLength(responseBody) + CLRF,
                    CLRF
                ].join("");
                console.log("Response Headers:", responseHeaders);
                console.log("Response Body:", responseBody);
                socket.write(Buffer.from(responseHeaders + responseBody));
            } else {
                // Respond with 404 Not Found
                const responseHeaders = [
                    HTTP_NOT_FOUND,
                    CONTENT_TYPE + "text/plain" + CLRF,
                    CONTENT_LENGTH + Buffer.byteLength("Not Found") + CLRF,
                    CLRF
                ].join("");
                console.log("Response Headers:", responseHeaders);
                console.log("Response Body:", "Not Found");
                socket.write(Buffer.from(responseHeaders + "Not Found"));
            }
        } else {
            // Respond with 400 Bad Request
            socket.write(Buffer.from(HTTP_BAD_REQUEST + CLRF));
        }
    
        socket.end();
    });
    

    socket.on("close", () => {
        console.log("Client disconnected");
        socket.end();
    });
});


server.listen(4221, 'localhost');