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
            // Check if the request path is "/"
            if (requestPath.startsWith("/echo/")) {
                // Send a response
                const responseBody = requestPath.split('/')[1];
                const responseHeaders = [
                    HTTP_OK,
                    CONTENT_TYPE + "text/plain" + CLRF,
                    CONTENT_LENGTH + Buffer.byteLength(responseBody) + CLRF,
                    CLRF
                ].join("");
                console.log("Response Headers: ", responseHeaders);
                console.log("Response Body: ", responseBody);
                socket.write(Buffer.from(responseHeaders + responseBody));
            };
            
             
        }
    });

    socket.on("clsoe", () => {
        console.log("Client disconnected");
        socket.end();
    });
});


server.listen(4221, 'localhost');