import * as net from "net";

console.log("Hi Tolu");

const server = net.createServer((socket) => {
    socket.on("clsoe", () => {
        console.log("Client disconnected");
        socket.end();
    });
});

server.listen(4221, 'localhost');