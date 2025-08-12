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

const expressServer : Express = express();
const port : number = 3000;
const authors : Author[] = [];
const messageHistory : MessageDatum[] = [];

expressServer.use("/", express.static(
    join(__dirname, "httpdocs")
));

expressServer.get("/fetchHistory", (request: Request, response: Response) => {
    // send entire message history to client - obviously doesn't scale well but is enough for this demonstration
    // probably could do a lazy loading system here and send message history in batches of 10 or so
    response.send(
        JSON.stringify(messageHistory.slice(-10))
    );
});

const httpServer = expressServer.listen(port, () => {
    console.log(`\nTechcast-Task server started successfully on port ${port}!\n`);
});

const io = new Server(httpServer);

io.on("connection", (socket: Socket) => {

    console.log(`User ${socket.id} connected to the server.`);

    socket.on("author", () => {

        const authorId : string = socket.id;

        // generate random number for author of messages on current socket
        const red : string = Math.floor(Math.random() * 255).toString(16);
        const green : string = Math.floor(Math.random() * 255).toString(16);
        const blue : string = Math.floor(Math.random() * 255).toString(16);

        const socketAuthor : Author = {
            initials: authorId.charAt(0) + authorId.charAt(10),
            hexColor: `#${red}${green}${blue}`
        };

        socket.emit(
            "author",
            JSON.stringify(socketAuthor)
        );
    });

    socket.on("message", (message: MessageDatum) => {

        // store message data for all clients
        messageHistory.push(message);

        // send message to all connected clients
        io.emit("message", message);
    });
});
