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
const qrContainer = document.getElementById('qr');

// --- Generate QR code using qrcode-generator library ---
socket.on('connect', () => {
    const url = `${new URL(`/phone.html?id=${socket.id}`, window.location)}`;
    const typeNumber = 4;
    const errorCorrectionLevel = 'L';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(url);
    qr.make();
    qrContainer.innerHTML = qr.createImgTag(4);
    console.log('Desktop connected. Scan QR to control:', url);
});

// --- Receive phone input ---
socket.on('move', data => {
    scaredPos.x = data.x * window.innerWidth;
    scaredPos.y = data.y * window.innerHeight;
});

// --- Draw trail ---
let trail = [];
const maxTrail = 80;

function drawTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    trail.push({ x: scaredPos.x, y: scaredPos.y, alpha: 1 });
    if (trail.length > maxTrail) trail.shift();

    for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
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
drawTrail();

// --- Ghost follows scared person ---
function moveGhost() {
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
moveGhost();