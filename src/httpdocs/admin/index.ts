import { io } from "socket.io-client";

type PushMessageDatum = {
    text: string
};

const socket = io("ws://localhost:3000");
const pushMessages: HTMLUListElement = document.getElementById("push-messages") as HTMLUListElement;

function sendPushMessage (event: SubmitEvent)
{
    event.preventDefault();
    const pushMessageInput: HTMLInputElement = document.getElementById("push-message-input") as HTMLInputElement;

    if (pushMessageInput.value)
    {
        const newPushMessage: PushMessageDatum = {
            text: pushMessageInput.value
        };
        socket.emit("push-message", newPushMessage);

        // reset the message input
        pushMessageInput.value = "";
    }

    // makes it easy to type multiple messages without having to re-activate the input field
    pushMessageInput.focus();
}

function deletePushMessage ()
{

}

function constructPushMessageHistory (history: PushMessageDatum[])
{
    for (const message of history)
    {
        buildPushMessage(message);
    }
}

function buildPushMessage (message: PushMessageDatum)
{
    const messageElement : HTMLLIElement = document.createElement("li");
    messageElement.className = "push-message";
    messageElement.textContent = message.text;

    pushMessages.insertBefore(messageElement, pushMessages.firstChild);
}

async function initialise ()
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

    // send a message if the form is submitted via the button
    document.getElementById("push-message-creation")!.addEventListener("submit", sendPushMessage);
}

initialise();
