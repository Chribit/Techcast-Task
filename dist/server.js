"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = require("path");
const socket_io_1 = require("socket.io");
const expressServer = (0, express_1.default)();
const port = 3000;
const authors = [];
const messageHistory = [];
expressServer.use("/", express_1.default.static((0, path_1.join)(__dirname, "httpdocs")));
expressServer.get("/fetchHistory", (request, response) => {
    // send entire message history to client - obviously doesn't scale well but is enough for this demonstration
    // probably could do a lazy loading system here and send message history in batches of 10 or so
    response.send(JSON.stringify(messageHistory.slice(-10)));
});
const httpServer = expressServer.listen(port, () => {
    console.log(`\nTechcast-Task server started successfully on port ${port}!\n`);
});
const io = new socket_io_1.Server(httpServer);
io.on("connection", (socket) => {
    console.log(`User ${socket.id} connected to the server.`);
    socket.on("author", () => {
        const authorId = socket.id;
        const red = Math.floor(Math.random() * 255).toString(16);
        const green = Math.floor(Math.random() * 255).toString(16);
        const blue = Math.floor(Math.random() * 255).toString(16);
        const socketAuthor = {
            initials: "AA",
            hexColor: `#${red}${green}${blue}`
        };
        console.log(socketAuthor);
        socket.emit("author", JSON.stringify(socketAuthor));
    });
    socket.on("message", (message) => {
        // store message data for all clients
        messageHistory.push(message);
        // send message to all connected clients
        io.emit("message", message);
    });
});
