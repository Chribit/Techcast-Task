import { io, Socket } from "socket.io-client";

type PushMessageDatum = {
    timestamp : number,
    text : string
};

type AdminActionDatum = {
    token : number,
    message : PushMessageDatum
}

const pushMessages : HTMLUListElement = document.getElementById("push-messages") as HTMLUListElement;

const tokenName : string = "accessToken";
sessionStorage.setItem(tokenName, "0");

function sendPushMessage (socket : Socket, event : SubmitEvent)
{
    event.preventDefault();
    const pushMessageInput : HTMLInputElement = document.getElementById("push-message-input") as HTMLInputElement;

    if (pushMessageInput.value)
    {
        const newPushMessage : AdminActionDatum = {
            token: parseInt(sessionStorage.getItem(tokenName)!),
            message: {
                timestamp: Date.now(),
                text: pushMessageInput.value
            }
        };
        socket.emit("pushMessage", newPushMessage);

        // reset the message input
        pushMessageInput.value = "";
    }

    // makes it easy to type multiple messages without having to re-activate the input field
    pushMessageInput.focus();
}

function constructPushMessageHistory (socket : Socket, history : PushMessageDatum[])
{
    // clear old history if tab hasn't been refreshed
    pushMessages.innerHTML = "";

    for (const message of history)
    {
        buildPushMessage(socket, message);
    }
}

function buildPushMessage (socket : Socket, message : PushMessageDatum)
{
    const messageElement : HTMLLIElement = document.createElement("li");
    messageElement.className = "push-message";
    messageElement.dataset.timestamp = "" + message.timestamp;

    const messageDeletionButton : HTMLButtonElement = document.createElement("button");
    messageDeletionButton.textContent = "×";

    messageDeletionButton.addEventListener("click", (event : PointerEvent) => {

        // ask the server to delete the push message with provided timestamp --> this ensures that no client-server desync issues can occur as would be possible during high network latency
        socket.emit("pushMessageDeletion", {
            token: parseInt(sessionStorage.getItem(tokenName)!),
            message: message
        });
    });

    messageElement.appendChild(messageDeletionButton);

    const messageTextElement : HTMLSpanElement = document.createElement("span");
    messageTextElement.textContent = message.text;
    messageElement.appendChild(messageTextElement);

    pushMessages.insertBefore(messageElement, pushMessages.firstChild);
}

function initialiseSocket ()
{
    const socket : Socket = io("ws://localhost:3000");

    // request push message data from server
    socket.on("pushHistory", (pushHistoryData : string) => {
        constructPushMessageHistory(socket, JSON.parse(pushHistoryData))
    });
    socket.emit("pushHistory");

    // listen for new messages in the global chatroom
    socket.on("pushMessage", (data : PushMessageDatum) => {

        buildPushMessage(socket, data);

        // scroll to top of push messages, to make new push message visible
        pushMessages.parentElement!.scrollTop = 0;
    });

    // listen for push message deletion requests
    socket.on("pushMessageDeletion", (pushMessageTimestamp : number) => {
        document.querySelector(`[data-timestamp="${pushMessageTimestamp}"]`)?.remove();
    });

    // listen for admin reset requests
    socket.on("adminReset", () => {

        // show login screen and hide push message screen
        document.getElementById("admin-login")!.style.display = "grid";
        document.getElementById("interface")!.style.display = "none";

        // clear existing token
        sessionStorage.setItem(tokenName, "0");
    });

    // send a message if the form is submitted via the button
    document.getElementById("push-message-creation")!.addEventListener("submit", (event : SubmitEvent) => sendPushMessage(socket, event));
}

function initialiseLogin ()
{
    // send a login request if the form is submitted via the button
    document.getElementById("admin-login")!.addEventListener("submit", async (event : SubmitEvent) => {

        // prevents page refresh on submit
        event.preventDefault();

        const adminPasswordInput : HTMLInputElement = document.getElementById("admin-password") as HTMLInputElement;

        if (adminPasswordInput.value)
        {
            const loginResponse = await fetch("/admin-login", {
                method: "post",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: adminPasswordInput.value
                })
            });

            const responseData = await loginResponse.json();

            if (responseData.success)
            {
                // hide login screen and show push message screen
                document.getElementById("admin-login")!.style.display = "none";
                document.getElementById("interface")!.style.display = "grid";

                sessionStorage.setItem(tokenName, responseData.token);

                adminPasswordInput.value = "";

                initialiseSocket();
            }
            else
            {
                console.error("Incorrect Password.");

                // reset the message input on fail
                adminPasswordInput.value = "";
            }
        }

        // makes it easy to type multiple messages without having to re-activate the input field
        adminPasswordInput.focus();
    });
}

initialiseLogin();
