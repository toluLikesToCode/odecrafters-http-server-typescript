import * as net from "net";

console.log("Hi Tolu");

const server = net.createServer((socket) => {
    socket.on("clsoe", () => {
        socket.end();
        console.log("Client disconnected");
    });
});

server.listen(4221, 'localhost');