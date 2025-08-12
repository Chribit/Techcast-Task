import { io } from "socket.io-client";

type Author = {
    initials: string,
    hexColor: string
}

type MessageDatum = {
    author : string,
    text : string
};

const socket = io("ws://localhost:3000");
const messages : HTMLUListElement = document.getElementById("messages") as HTMLUListElement;
let author : Author;

async function constructMessageHistory ()
{
    const response : Response = await fetch("/fetchHistory");
    const messageHistory : MessageDatum[] = await response.json();

    for (const message of messageHistory)
    {
        buildMessage(message);
    }
}

function sendMessage (event : SubmitEvent)
{
    event.preventDefault();
    const messageInput : HTMLInputElement = document.getElementById("message-input") as HTMLInputElement;

    if (messageInput.value)
    {
        const newMessage : MessageDatum = {
            author: "0",
            text: messageInput.value
        };
        socket.send(newMessage);

        messageInput.value = "";
    }

    // makes it easy to type multiple messages without having to re-activate the input field
    messageInput.focus();
}

function buildMessage (message : MessageDatum)
{
    const messageElement : HTMLLIElement = document.createElement("li");

    messageElement.className = "message";
    messageElement.textContent = message.text;

    messages.appendChild(messageElement);
}

async function initialise ()
{
    // request message history of the global chatroom
    await constructMessageHistory();

    // listen for author data from server
    socket.on("author", (data : Author) => {
        author = data;
    });

    // request author data
    socket.emit("author");

    // listen for new messages in the global chatroom
    socket.on("message", (data : MessageDatum) => {
        buildMessage(data);
    });

    // send a message if the form is submitted via the button
    document.getElementById("message-creation").addEventListener("submit", sendMessage);
}

initialise();
