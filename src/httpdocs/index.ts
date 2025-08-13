import { io } from "socket.io-client";

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

const socket = io("ws://localhost:3000");
const messages : HTMLUListElement = document.getElementById("messages") as HTMLUListElement;
const pushMessages : HTMLUListElement = document.getElementById("push-messages") as HTMLUListElement;
let author : Author;

function constructMessageHistory (history : MessageDatum[])
{
    // clear old history if tab hasn't been refreshed
    messages.innerHTML = "";

    for (const message of history)
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
            author: author,
            text: messageInput.value
        };
        socket.send(newMessage);

        // reset the message input
        messageInput.value = "";
    }

    // makes it easy to type multiple messages without having to re-activate the input field
    messageInput.focus();
}

function buildMessage (message : MessageDatum)
{
    const authorsMatch : boolean = message.author.initials === author.initials;

    const messageElement : HTMLLIElement = document.createElement("li");
    messageElement.className = "message" + (authorsMatch ? " me" : "");

    const messageTextElement : HTMLSpanElement = document.createElement("span");
    messageTextElement.textContent = message.text;

    // the colour of the message author icon is determined by a inline css colour variable --> the one generated for the author
    const messageIconElement : HTMLDivElement = document.createElement("div");
    messageIconElement.style = "--c:" + message.author.hexColor;
    messageIconElement.textContent = message.author.initials;

    // the message text and icon are appended in the order appropriate based on whether or not the message is viewed by the original author
    messageElement.appendChild(authorsMatch ? messageTextElement : messageIconElement);
    messageElement.appendChild(authorsMatch ? messageIconElement : messageTextElement);

    messages.appendChild(messageElement);
}

function constructPushMessageHistory (history : PushMessageDatum[])
{
    // clear old history if tab hasn't been refreshed
    pushMessages.innerHTML = "";

    for (const message of history)
    {
        buildPushMessage(message);
    }
}

function buildPushMessage (message : PushMessageDatum)
{
    const messageElement : HTMLLIElement = document.createElement("li");
    messageElement.className = "push-message";
    messageElement.dataset.timestamp = "" + message.timestamp;
    messageElement.textContent = message.text;

    pushMessages.insertBefore(messageElement, pushMessages.firstChild);
}

function initialise ()
{
    // request author data from server
    socket.on("author", (authorData : string) => {
        author = JSON.parse(authorData);
    });
    socket.emit("author");

    // request history data from server
    socket.on("history", (historyData : string) => {

        constructMessageHistory(JSON.parse(historyData));

        // scroll to bottom of chat, to make newest message visible
        messages.parentElement.scrollTop = messages.parentElement.scrollHeight;
    });
    socket.emit("history");

    // request push message data from server
    socket.on("pushHistory", (pushHistoryData : string) => {
        constructPushMessageHistory(JSON.parse(pushHistoryData))
    });
    socket.emit("pushHistory");

    // listen for new messages in the global chatroom
    socket.on("message", (data : MessageDatum) => {

        buildMessage(data);

        // scroll to bottom of chat, to make new message visible
        messages.parentElement.scrollTop = messages.parentElement.scrollHeight;
    });

    // listen for new messages in the global chatroom
    socket.on("pushMessage", (data : PushMessageDatum) => {
        
        buildPushMessage(data);

        // scroll to top of push messages, to make new push message visible
        pushMessages.parentElement!.scrollTop = 0;
    });

    // listen for push message deletion requests
    socket.on("pushMessageDeletion", (pushMessageTimestamp : number) => {
        document.querySelector(`[data-timestamp="${pushMessageTimestamp}"]`)?.remove();
    });

    // send a message if the form is submitted via the button
    document.getElementById("message-creation").addEventListener("submit", sendMessage);
}

initialise();
