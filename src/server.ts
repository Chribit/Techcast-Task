import { genSaltSync, hashSync, compareSync } from "bcrypt";
import bodyParser from "body-parser";
import express, { Express, Request, Response } from "express";
import { join } from "path";
import { Server, Socket } from "socket.io";

type Author = {
    initials : string,
    hexColor : string
}

type MessageDatum = {
    author : Author,
    text : string
};

type PushMessageDatum = {
    timestamp : number,
    text : string
};

type AdminActionDatum = {
    token : number,
    message : PushMessageDatum
}

const expressServer : Express = express();
const jsonParser = bodyParser.json();
const port : number = 3000;
const messageHistory : MessageDatum[] = [];
const pushMessages : PushMessageDatum[] = [];
const adminTokens : Set<number> = new Set();

// This is OBVIOUSLY not how it should be done in production, but for a proof of concept this suffices
const passwordString : string = "techcastadmin";
const passwordSalt : string = genSaltSync(10);
const adminPassword : string = hashSync(passwordString, passwordSalt);

expressServer.use("/", express.static(
    join(__dirname, "httpdocs")
));

expressServer.post("/admin-login", jsonParser, (request : Request, response : Response) => {

    const password : string = request.body.password || "";
    const isCorrect = compareSync(password, adminPassword);

    if (isCorrect)
    {
        // A random number isn't really secure here, but it does the job for this demo
        const accessToken = Math.floor(Math.random() * 1000000000);
        adminTokens.add(accessToken);

        response.send({
            success: true,
            token: accessToken
        });
    }
    else
    {
        response.send({
            success: false,
            token: 0
        });
    }

});

const httpServer = expressServer.listen(port, () => {
    console.log(`\nTechcast-Task server started successfully on port ${port}!\n`);
});

const io = new Server(httpServer);

io.on("connection", (socket : Socket) => {

    console.log(`User ${socket.id} has connected to the service.`);

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

    socket.on("message", (message : MessageDatum) => {

        // store message data for all clients
        messageHistory.push(message);

        // send message to all connected clients
        io.emit("message", message);
    });

    socket.on("pushMessage", (action : AdminActionDatum) => {

        // check if push message is coming from an authorized connection
        const validAction : boolean = adminTokens.has(action.token);

        if (validAction)
        {
            // store message data for all clients
            pushMessages.push(action.message);

            // send message to all connected clients
            io.emit("pushMessage", action.message);
        }
        else
        {
            socket.emit("adminReset");
        }
    });

    socket.on("pushMessageDeletion", (action : AdminActionDatum) => {

        // check if deletion request is coming from an authorized connection
        const validAction : boolean = adminTokens.has(action.token);

        if (validAction)
        {
            // a binary search could be employed here to arrive at the to-be-deleted item more rapidly
            // or a map data structure may be used for push messages, however ordering then becomes an issue
            for (let index = 0; index < pushMessages.length; index++)
            {
                const pushMessage : PushMessageDatum = pushMessages[index];
                if (pushMessage.timestamp === action.message.timestamp)
                {
                    pushMessages.splice(index, 1);
                    break;
                }
            }

            // send deletion request to all connected clients
            io.emit("pushMessageDeletion", action.message.timestamp);
        }
        else
        {
            socket.emit("adminReset");
        }
    });
});
