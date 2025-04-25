import * as net from "net";

console.log("Hi Tolu");
console.log("Goodbye\rClient disconnected \n");

const server = net.createServer((socket) => {
    socket.on("clsoe", () => {
        console.log("Goodly\nClient disconnected\r");
        socket.end();
    });
});

server.listen(4221, 'localhost');