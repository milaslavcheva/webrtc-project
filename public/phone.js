const socket = io();

const ghost = document.createElement('div');
ghost.classList.add('ghost');
document.body.appendChild(ghost);

socket.on('cursorMove', (data) => {
    ghost.style.left = data.x + 'px';
    ghost.style.top = data.y + 'px';
});