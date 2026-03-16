const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve everything inside the "public" folder
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // When phone sends movement
    socket.on('move', (data) => {
        console.log('Received move from phone:', data);

        // Send movement to all other clients (desktop)
        socket.broadcast.emit('move', data);
    });
});

const PORT = 3000;

// IMPORTANT: listen on 0.0.0.0 so phone can connect
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});