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

            const basePath = requestPath.split("/")[1]; // Extract the base path
            switch (basePath) {
                case "":
                    // Respond with OK
                    socket.write(Buffer.from(HTTP_OK + CLRF));
                    break;

                case "echo":
                    // Respond with the path after "/echo/"
                    const echoResponseBody = requestPath.slice("/echo/".length);
                    const echoResponseHeaders = [
                        HTTP_OK,
                        CONTENT_TYPE + "text/plain" + CLRF,
                        CONTENT_LENGTH + Buffer.byteLength(echoResponseBody) + CLRF,
                        CLRF
                    ].join("");
                    console.log("Response Headers:", echoResponseHeaders);
                    console.log("Response Body:", echoResponseBody);
                    socket.write(Buffer.from(echoResponseHeaders + echoResponseBody));
                    break;

                case "user-agent":
                    // Respond with the User-Agent header
                    const userAgentHeader = requestLines.find(line => line.startsWith("User-Agent:"));
                    const userAgent = userAgentHeader ? userAgentHeader.split(": ")[1] : "Unknown";
                    const userAgentResponseBody = userAgent;
                    const userAgentResponseHeaders = [
                        HTTP_OK,
                        CONTENT_TYPE + "text/plain" + CLRF,
                        CONTENT_LENGTH + Buffer.byteLength(userAgentResponseBody) + CLRF,
                        CLRF
                    ].join("");
                    console.log("Response Headers:", userAgentResponseHeaders);
                    console.log("Response Body:", userAgentResponseBody);
                    socket.write(Buffer.from(userAgentResponseHeaders + userAgentResponseBody));
                    break;
                case "files":
                    // extract the file name from the request path
                    const fileName = requestPath.split("/")[2];
                    switch (fileName) {
                        // if not blank, respond with the file name
                        case "":
                            // Respond with the file as an octent-stream after "/files/"
                            const filePath = requestPath.slice("/files/".length);
                            const fileResponseHeaders = [
                                HTTP_OK,
                                CONTENT_TYPE + "application/octet-stream" + CLRF,
                                CONTENT_LENGTH + Buffer.byteLength(filePath) + CLRF,
                                CLRF
                            ].join("");
                            console.log("Response Headers:", fileResponseHeaders);
                            console.log("Response Body:", filePath);
                            socket.write(Buffer.from(fileResponseHeaders + filePath));
                            break;
                        default:
                            // Respond with 404 Not Found
                            const notFoundResponseHeaders = [
                                HTTP_NOT_FOUND,
                                CONTENT_TYPE + "text/plain" + CLRF,
                                CONTENT_LENGTH + Buffer.byteLength("Not Found") + CLRF,
                                CLRF
                            ].join("");
                            console.log("Response Headers:", notFoundResponseHeaders);
                            console.log("Response Body:", "Not Found");
                            socket.write(Buffer.from(notFoundResponseHeaders + "Not Found"));
                            break; 
                    }
                    break;
                default:
                    // Respond with 404 Not Found
                    const notFoundResponseHeaders = [
                        HTTP_NOT_FOUND,
                        CONTENT_TYPE + "text/plain" + CLRF,
                        CONTENT_LENGTH + Buffer.byteLength("Not Found") + CLRF,
                        CLRF
                    ].join("");
                    console.log("Response Headers:", notFoundResponseHeaders);
                    console.log("Response Body:", "Not Found");
                    socket.write(Buffer.from(notFoundResponseHeaders + "Not Found"));
                    break;
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