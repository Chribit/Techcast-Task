import express, { Express, Request, Response } from "express";
import { join } from "path";
import { Server, Socket } from "socket.io";

type Author = {
    initials: string,
    hexColor: string
}

type MessageDatum = {
    author: Author,
    text: string
};

type PushMessageDatum = {
    text : string
};

const expressServer : Express = express();
const port : number = 3000;
const messageHistory : MessageDatum[] = [];
const pushMessages : PushMessageDatum[] = [{text: "this is one test message!"}, {text: "this is another test push message and so on!"}];

expressServer.use("/", express.static(
    join(__dirname, "httpdocs")
));

const httpServer = expressServer.listen(port, () => {
    console.log(`\nTechcast-Task server started successfully on port ${port}!\n`);
});

const io = new Server(httpServer);

io.on("connection", (socket: Socket) => {

    socket.on("author", () => {

        const authorId : string = socket.id;

        // generate random number for author of messages on current socket
        const red : string = Math.floor(Math.random() * 255).toString(16);
        const green : string = Math.floor(Math.random() * 255).toString(16);
        const blue : string = Math.floor(Math.random() * 255).toString(16);

        const socketAuthor : Author = {
            initials: (authorId.charAt(0) + authorId.charAt(10)).toUpperCase(),
            hexColor: `#${red}${green}${blue}`
        };

        socket.emit(
            "author",
            JSON.stringify(socketAuthor)
        );
    });

    socket.on("history", () => {
        socket.emit(
            "history",
            JSON.stringify(messageHistory.slice(-10))
        );
    });

    socket.on("pushHistory", () => {
        socket.emit(
            "pushHistory",
            JSON.stringify(pushMessages)
        );
    });

    socket.on("message", (message: MessageDatum) => {

        // store message data for all clients
        messageHistory.push(message);

        // send message to all connected clients
        io.emit("message", message);
    });

    socket.on("push-message", (message: MessageDatum) => {

        // store message data for all clients
        messageHistory.push(message);

        // send message to all connected clients
        io.emit("message", message);
    });
});
