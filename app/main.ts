import * as net from "net";

import * as fs from 'fs';
import * as path from 'path';


console.log("Hi Tolu");

const CLRF = "\r\n";
const HTTP_OK = "HTTP/1.1 200 OK" + CLRF;
const HTTP_NOT_FOUND = "HTTP/1.1 404 Not Found" + CLRF;
const CONTENT_TYPE = "Content-Type: " ;
const CONTENT_LENGTH = "Content-Length: " ;


const HTTP_BAD_REQUEST = "HTTP/1.1 400 Bad Request" + CLRF;

const baseDirectory = process.argv[2] === '--directory' ? process.argv[3] : '.';

const server = net.createServer((socket) => {
    socket.on("data", (data) => {
        console.log("Received data from client");
    
        const request = data.toString();
        const requestLines = request.split(CLRF);
        const requestLine = requestLines[0];
        const requestMethod = requestLine.split(" ")[0];
        const requestPath = requestLine.split(" ")[1];
        const basePath = requestPath.split("/")[1]; // Extract the base path
    
        switch (requestMethod) {
            

            case "GET":
                console.log("GET request received");
                
                // Log the request path
                console.log("Request Path:", requestPath);

                
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
                        const filePath = requestPath.slice("/files/".length);
                        const fullPath = path.join(baseDirectory, filePath);
                    
                        fs.readFile(fullPath, (err, fileData) => {
                            if (err) {
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
                            } else {
                                // Respond with the file data
                                const fileResponseHeaders = [
                                    HTTP_OK,
                                    CONTENT_TYPE + "application/octet-stream" + CLRF,
                                    CONTENT_LENGTH + fileData.length + CLRF,
                                    CLRF
                                ].join("");
                                console.log("Response Headers:", fileResponseHeaders);
                                console.log("Response Body: [binary data]");
                                socket.write(Buffer.from(fileResponseHeaders));
                                socket.write(fileData, () => {
                                    console.log("File data sent successfully");
                                });
                            }
                        });
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
            
            case "POST":
                console.log("POST request received");
                // Log the request path
                console.log("Request Path:", requestPath);
                
                switch (basePath) {
                    case "":
                        // Respond with OK
                        socket.write(Buffer.from(HTTP_OK + CLRF));
                        break;
                    case "files":
                        // Get content length from headers
                        const contentLengthHeader = requestLines.find(line => line.toLowerCase().startsWith("content-length:"));
                        const contentLength = contentLengthHeader ? parseInt(contentLengthHeader.split(":")[1].trim()) : 0;

                        // Find start of body (after the first empty line)
                        const headerSectionEnd = request.indexOf(CLRF + CLRF); // double CRLF separates headers from body
                        const bodyStartIndex = headerSectionEnd + (CLRF + CLRF).length;

                        // Get raw buffer
                        const rawBuffer = Buffer.from(data);

                        // Extract the actual body content
                        const requestBody = rawBuffer.slice(bodyStartIndex, bodyStartIndex + contentLength).toString();
                        const filePath = path.join(baseDirectory, requestPath.split("/")[2]);
                        console.log("File Path:", filePath);
                        console.log("Request Body:", requestBody);
                        fs.writeFile(filePath, requestBody, (err) => {
                            if (err) {
                                // Respond with 500 Internal Server Error
                                const internalServerErrorResponseHeaders = [
                                    "HTTP/1.1 500 Internal Server Error" + CLRF,
                                    CONTENT_TYPE + "text/plain" + CLRF,
                                    CONTENT_LENGTH + Buffer.byteLength("Internal Server Error") + CLRF,
                                    CLRF
                                ].join("");
                                console.log("Response Headers:", internalServerErrorResponseHeaders);
                                console.log("Response Body:", "Internal Server Error");
                                socket.write(Buffer.from(internalServerErrorResponseHeaders + "Internal Server Error"));
                            } else {
                                // Respond with 201 Created
                                const createdResponseHeaders = [
                                    "HTTP/1.1 201 Created" + CLRF,
                                    CONTENT_TYPE + "text/plain" + CLRF,
                                    CONTENT_LENGTH + Buffer.byteLength("File Created") + CLRF,
                                    CLRF
                                ].join("");
                                console.log("Response Headers:", createdResponseHeaders);
                                console.log("Response Body:", "File Created");
                                socket.write(Buffer.from(createdResponseHeaders + "File Created")); // Append body after headers
                            }
                        });
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
            case "PUT":
                console.log("PUT request received");
                // Log the request path
                console.log("Request Path:", requestPath);
                // Respond with 200 OK
                socket.write(Buffer.from(HTTP_OK + CLRF));
                break;
            case "DELETE":
                console.log("DELETE request received");
                // Log the request path
                console.log("Request Path:", requestPath);
                // Respond with 200 OK
                socket.write(Buffer.from(HTTP_OK + CLRF));
                break;
            default:
                // Respond with 400 Bad Request
                socket.write(Buffer.from(HTTP_BAD_REQUEST + CLRF));
                break;
        }
        
    });
    

    socket.on("close", () => {
        socket.end();
        console.log("Client disconnected");
    });
});


server.listen(4221, 'localhost');