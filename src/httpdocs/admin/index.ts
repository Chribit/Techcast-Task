import { io } from "socket.io-client";

type PushMessageDatum = {
    timestamp : number,
    text : string
};

const socket = io("ws://localhost:3000");
const pushMessages : HTMLUListElement = document.getElementById("push-messages") as HTMLUListElement;

function sendPushMessage (event : SubmitEvent)
{
    event.preventDefault();
    const pushMessageInput: HTMLInputElement = document.getElementById("push-message-input") as HTMLInputElement;

    if (pushMessageInput.value)
    {
        const newPushMessage: PushMessageDatum = {
            timestamp: Date.now(),
            text: pushMessageInput.value
        };
        socket.emit("push-message", newPushMessage);

        // reset the message input
        pushMessageInput.value = "";
    }

    // makes it easy to type multiple messages without having to re-activate the input field
    pushMessageInput.focus();
}

function constructPushMessageHistory (history : PushMessageDatum[])
{
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

    const messageDeletionButton : HTMLButtonElement = document.createElement("button");
    messageDeletionButton.textContent = "×";

    messageDeletionButton.addEventListener("click", (event : PointerEvent) => {

        // ask the server to delete the push message with provided timestamp --> this ensures that no client-server desync issues can occur as would be possible during high network latency
        socket.emit("push-message-deletion", message.timestamp);
    });

    messageElement.appendChild(messageDeletionButton);

    const messageTextElement : HTMLSpanElement = document.createElement("span");
    messageTextElement.textContent = message.text;
    messageElement.appendChild(messageTextElement);

    pushMessages.insertBefore(messageElement, pushMessages.firstChild);
}

function initialise ()
{
    // request push message data from server
    socket.on("pushHistory", (pushHistoryData : string) => {
        constructPushMessageHistory(JSON.parse(pushHistoryData))
    });
    socket.emit("pushHistory");

    // listen for new messages in the global chatroom
    socket.on("push-message", (data : PushMessageDatum) => {

        buildPushMessage(data);

        // scroll to top of push messages, to make new push message visible
        pushMessages.parentElement!.scrollTop = 0;
    });

    // listen for push message deletion requests
    socket.on("push-message-deletion", (pushMessageTimestamp : number) => {
        document.querySelector(`[data-timestamp="${pushMessageTimestamp}"]`)?.remove();
    });

    // send a message if the form is submitted via the button
    document.getElementById("push-message-creation")!.addEventListener("submit", sendPushMessage);
}

initialise();
