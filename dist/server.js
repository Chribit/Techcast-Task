"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = require("bcrypt");
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const path_1 = require("path");
const socket_io_1 = require("socket.io");
const expressServer = (0, express_1.default)();
const jsonParser = body_parser_1.default.json();
const port = 3000;
const messageHistory = [];
const pushMessages = [];
const adminTokens = new Set();
// This is OBVIOUSLY not how it should be done in production, but for a proof of concept this suffices
const passwordString = "techcastadmin";
const passwordSalt = (0, bcrypt_1.genSaltSync)(10);
const adminPassword = (0, bcrypt_1.hashSync)(passwordString, passwordSalt);
expressServer.use("/", express_1.default.static((0, path_1.join)(__dirname, "httpdocs")));
expressServer.post("/admin-login", jsonParser, (request, response) => {
    const password = request.body.password || "";
    const isCorrect = (0, bcrypt_1.compareSync)(password, adminPassword);
    if (isCorrect) {
        // A random number isn't really secure here, but it does the job for this demo
        const accessToken = Math.floor(Math.random() * 1000000000);
        adminTokens.add(accessToken);
        response.send({
            success: true,
            token: accessToken
        });
    }
    else {
        response.send({
            success: false,
            token: 0
        });
    }
});
const httpServer = expressServer.listen(port, () => {
    console.log(`\nTechcast-Task server started successfully on port ${port}!\n`);
});
const io = new socket_io_1.Server(httpServer);
io.on("connection", (socket) => {
    console.log(`User ${socket.id} has connected to the service.`);
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
    socket.on("pushMessage", (action) => {
        // check if push message is coming from an authorized connection
        const validAction = adminTokens.has(action.token);
        if (validAction) {
            // store message data for all clients
            pushMessages.push(action.message);
            // send message to all connected clients
            io.emit("pushMessage", action.message);
        }
        else {
            socket.emit("adminReset");
        }
    });
    socket.on("pushMessageDeletion", (action) => {
        // check if deletion request is coming from an authorized connection
        const validAction = adminTokens.has(action.token);
        if (validAction) {
            // a binary search could be employed here to arrive at the to-be-deleted item more rapidly
            // or a map data structure may be used for push messages, however ordering then becomes an issue
            for (let index = 0; index < pushMessages.length; index++) {
                const pushMessage = pushMessages[index];
                if (pushMessage.timestamp === action.message.timestamp) {
                    pushMessages.splice(index, 1);
                    break;
                }
            }
            // send deletion request to all connected clients
            io.emit("pushMessageDeletion", action.message.timestamp);
        }
        else {
            socket.emit("adminReset");
        }
    });
});
