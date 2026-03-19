const socket = io();
const coords = document.getElementById('coords');

const params = new URLSearchParams(window.location.search);
const desktopId = params.get('id');

socket.emit('phone-connected', desktopId);

function sendMove(x, y) {
    socket.emit('move', { x, y, desktopId });
    coords.textContent = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
}


document.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX / window.innerWidth;
    const y = touch.clientY / window.innerHeight;
    sendMove(x, y);
}, { passive: false });

document.addEventListener('mousemove', e => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    sendMove(x, y);
});