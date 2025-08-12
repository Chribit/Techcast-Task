const express = require("express");
const path = require("path");

const server = express();
const port : number = 3000;

server.use("/", express.static(
    path.join(__dirname, "httpdocs")
));

server.listen(port, () => {
    console.log("Techcast-Task server started successfully on port " + port + "!");
});
