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
const messageHistory = [];
const pushMessages = [];
expressServer.use("/", express_1.default.static((0, path_1.join)(__dirname, "httpdocs")));
const httpServer = expressServer.listen(port, () => {
    console.log(`\nTechcast-Task server started successfully on port ${port}!\n`);
});
const io = new socket_io_1.Server(httpServer);
io.on("connection", (socket) => {
    socket.on("author", () => {
        const authorId = socket.id;
        // generate random number for author of messages on current socket
        const red = Math.floor(Math.random() * 255).toString(16);
        const green = Math.floor(Math.random() * 255).toString(16);
        const blue = Math.floor(Math.random() * 255).toString(16);
        const socketAuthor = {
            initials: (authorId.charAt(0) + authorId.charAt(10)).toUpperCase(),
            hexColor: `#${red}${green}${blue}`
        };
        socket.emit("author", JSON.stringify(socketAuthor));
    });
    socket.on("history", () => {
        socket.emit("history", JSON.stringify(messageHistory.slice(-10)));
    });
    socket.on("pushHistory", () => {
        socket.emit("pushHistory", JSON.stringify(pushMessages));
    });
    socket.on("message", (message) => {
        // store message data for all clients
        messageHistory.push(message);
        // send message to all connected clients
        io.emit("message", message);
    });
    socket.on("push-message", (pushMessage) => {
        // store message data for all clients
        pushMessages.push(pushMessage);
        // send message to all connected clients
        io.emit("push-message", pushMessage);
    });
    socket.on("push-message-deletion", (pushMessageTimestamp) => {
        // a binary search could be employed here to arrive at the to-be-deleted item more rapidly
        // or a map data structure may be used for push messages, however ordering then becomes an issue
        for (let index = 0; index < pushMessages.length; index++) {
            const pushMessage = pushMessages[index];
            if (pushMessage.timestamp === pushMessageTimestamp) {
                pushMessages.splice(index, 1);
                break;
            }
        }
        // send deletion request to all connected clients
        io.emit("push-message-deletion", pushMessageTimestamp);
    });
});
