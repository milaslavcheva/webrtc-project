const socket = io();
const coords = document.getElementById('coords');

// Get desktop ID from URL
const params = new URLSearchParams(window.location.search);
const desktopId = params.get('id');

// Tell desktop we connected
socket.emit('phone-connected', desktopId);

function sendMove(x, y) {
    socket.emit('move', { x, y, desktopId });
    coords.textContent = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
}

// Touch input
document.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX / window.innerWidth;
    const y = touch.clientY / window.innerHeight;
    sendMove(x, y);
}, { passive: false });

// Optional mouse input for testing
document.addEventListener('mousemove', e => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    sendMove(x, y);
});