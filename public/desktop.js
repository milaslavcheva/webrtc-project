// --- Canvas setup ---
const canvas = document.getElementById('trailCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- Elements ---
const scared = document.getElementById('scaredPerson');
const ghost = document.getElementById('ghost');
let scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
let ghostSpeed = 3;

// --- Socket.io ---
const socket = io();
const qrContainer = document.getElementById('qrContainer');
const qrDiv = document.getElementById('qr');

let gameStarted = false;

// --- Hide game elements initially ---
canvas.style.display = 'none';
scared.style.display = 'none';
ghost.style.display = 'none';

// --- Generate QR code ---
socket.on('connect', () => {
    const url = `${new URL(`/phone.html?id=${socket.id}`, window.location)}`;
    const qr = qrcode(4, 'L');
    qr.addData(url);
    qr.make();
    qrDiv.innerHTML = qr.createImgTag(4);
    console.log('Desktop connected. Scan QR to control:', url);
});

// --- Start game when phone connects ---
socket.on('phone-connected', () => {
    qrContainer.style.display = 'none';
    canvas.style.display = 'block';
    scared.style.display = 'block';
    ghost.style.display = 'block';
    gameStarted = true;
    drawTrail();
    moveGhost();
});

// --- Receive phone input ---
socket.on('move', data => {
    if (!gameStarted) return;
    scaredPos.x = data.x * window.innerWidth;
    scaredPos.y = data.y * window.innerHeight;
});

// --- Draw trail ---
let trail = [];
const maxTrail = 80;

function drawTrail() {
    if (!gameStarted) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    trail.push({ x: scaredPos.x, y: scaredPos.y, alpha: 1 });
    if (trail.length > maxTrail) trail.shift();

    for (let t of trail) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,255,${t.alpha})`;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 20;
        ctx.fill();
        t.alpha -= 0.02;
    }

    scared.style.transform = `translate(${scaredPos.x - 25}px, ${scaredPos.y - 25}px)`;
    requestAnimationFrame(drawTrail);
}

// --- Ghost follows scared person ---
function moveGhost() {
    if (!gameStarted) return;
    const dx = scaredPos.x - ghostPos.x;
    const dy = scaredPos.y - ghostPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
        ghostPos.x += (dx / dist) * ghostSpeed;
        ghostPos.y += (dy / dist) * ghostSpeed;
    }
    ghost.style.transform = `translate(${ghostPos.x}px, ${ghostPos.y}px)`;
    requestAnimationFrame(moveGhost);
}