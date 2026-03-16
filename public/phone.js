const socket = io();
const coords = document.getElementById('coords');

function sendMove(x, y) {
    socket.emit('move', { x, y });
    coords.textContent = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
}

// Touch input
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX / window.innerWidth;
    const y = touch.clientY / window.innerHeight;
    sendMove(x, y);
}, { passive: false });

// Optional: mouse input (for testing on desktop)
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    sendMove(x, y);
});