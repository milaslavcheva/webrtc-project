const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('phone-connected', desktopId => {
        console.log('Phone connected to desktop:', desktopId);
        io.to(desktopId).emit('phone-connected');
    });

    socket.on('move', data => {
        const desktopId = data.desktopId;
        if (desktopId) {
            io.to(desktopId).emit('move', data);
        }
    });
});

http.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});