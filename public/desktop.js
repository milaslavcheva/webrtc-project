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
const qrContainer = document.getElementById('qrContainer');
const qrDiv = document.getElementById('qr');

let scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
let ghostSpeed = 3;

let gameStarted = false;
let gameOver = false;

// --- Hide game elements initially ---
canvas.style.display = 'none';
scared.style.display = 'none';
ghost.style.display = 'none';

// --- Generate QR code ---
const socket = io();
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
    console.log('Phone connected, starting game...');
    startGame();
});

// --- Start game function ---
function startGame() {
    qrContainer.style.display = 'none';
    canvas.style.display = 'block';
    scared.style.display = 'block';
    ghost.style.display = 'block';

    scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

    // Use left/top to ensure images appear correctly
    scared.style.left = `${scaredPos.x - 25}px`;
    scared.style.top = `${scaredPos.y - 25}px`;
    ghost.style.left = `${ghostPos.x}px`;
    ghost.style.top = `${ghostPos.y}px`;

    gameStarted = true;
    gameOver = false;
    trail = [];

    drawTrail();
    moveGhost();
}

// --- Receive phone input ---
socket.on('move', data => {
    if (!gameStarted || gameOver) return;
    scaredPos.x = data.x * window.innerWidth;
    scaredPos.y = data.y * window.innerHeight;
});

// --- Draw trail ---
let trail = [];
const maxTrail = 80;

function drawTrail() {
    if (!gameStarted || gameOver) return;
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

    // Update scared person position
    scared.style.left = `${scaredPos.x - 25}px`;
    scared.style.top = `${scaredPos.y - 25}px`;

    requestAnimationFrame(drawTrail);
}

// --- Ghost follows scared person ---
function moveGhost() {
    if (!gameStarted || gameOver) return;

    const dx = scaredPos.x - ghostPos.x;
    const dy = scaredPos.y - ghostPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
        ghostPos.x += (dx / dist) * ghostSpeed;
        ghostPos.y += (dy / dist) * ghostSpeed;
    }

    // Update ghost position
    ghost.style.left = `${ghostPos.x}px`;
    ghost.style.top = `${ghostPos.y}px`;

    // Check collision
    if (dist < 50) {
        endGame();
    }

    requestAnimationFrame(moveGhost);
}

// --- End game ---
function endGame() {
    gameOver = true;
    gameStarted = false;

    canvas.style.display = 'none';
    scared.style.display = 'none';
    ghost.style.display = 'none';

    showGameOver();
}

// --- Game Over Screen ---
function showGameOver() {
    let overlay = document.createElement('div');
    overlay.id = 'gameOverOverlay';

    let msg = document.createElement('h1');
    msg.textContent = 'Game Over';
    overlay.appendChild(msg);

    let btn = document.createElement('button');
    btn.textContent = 'Restart';
    btn.onclick = () => {
        document.body.removeChild(overlay);
        qrContainer.style.display = 'flex';
        trail = [];
    };
    overlay.appendChild(btn);

    document.body.appendChild(overlay);
}