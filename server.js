const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("move", (data) => {
        socket.broadcast.emit("cursorMove", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

http.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});