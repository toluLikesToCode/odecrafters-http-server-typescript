import * as net from "net";

console.log("Hi Tolu");

const server = net.createServer((socket) => {
    socket.on("clsoe", () => {
        socket.end();
    });
});

server.listen(4221, 'localhost');