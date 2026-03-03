const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
});

const PORT = 3000;
http.listen(PORT, '0.0.0.0', () => {  // <--- '0.0.0.0' allows other devices
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});