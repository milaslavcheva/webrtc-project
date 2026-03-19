// --- Canvas setup ---
const canvas = document.getElementById('trailCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const scared = document.getElementById('scaredPerson');
const ghost = document.getElementById('ghost');
const qrContainer = document.getElementById('qrContainer');
const qrDiv = document.getElementById('qr');

let scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
let ghostSpeed = 3;

let gameStarted = false;
let gameOver = false;

// Hide game elements at first
canvas.style.display = 'none';
scared.style.display = 'none';
ghost.style.display = 'none';

// --- Socket.io and WebRTC setup ---
const socket = io("/");
let peer = null;

// --- QR + signaling ---
const buildJoinUrl = () => window.location.origin + "/phone.html?host=" + encodeURIComponent(socket.id);

const renderQr = url => {
    const qr = qrcode(4, "L");
    qr.addData(url);
    qr.make();
    qrDiv.innerHTML = qr.createImgTag(5);
};

// Create peer function
function createPeer(initiator, remoteId) {
    peer = new SimplePeer({ initiator, trickle: false });

    peer.on("signal", data => {
        if (remoteId) socket.emit("signal", remoteId, data);
    });

    peer.on("connect", () => {
        console.log("Phone connected!");

        // Hide QR code and show game elements
        qrContainer.style.display = "none";
        canvas.style.display = "block";
        scared.style.display = "block";
        ghost.style.display = "block";

        // Start the game
        startGame();
    });

    peer.on("data", data => {
        try {
            const msg = JSON.parse(data.toString());
            handleControls(msg);
        } catch (e) {
            console.error(e);
        }
    });

    peer.on("close", () => peer = null);
    peer.on("error", err => console.error("[desktop] peer error", err));
}

// Socket events
socket.on("connect", () => {
    console.log("Socket connected. Scan QR to control.");
    qrContainer.style.display = "flex";
    canvas.style.display = "none";
    renderQr(buildJoinUrl());
});

socket.on("signal", (peerId, signal, fromId) => {
    if (!peer) createPeer(false, fromId);
    peer.signal(signal);
});

// --- Handle incoming phone controls ---
function handleControls({ x, y }) {
    if (!gameStarted || gameOver) return;
    scaredPos.x = x * window.innerWidth;
    scaredPos.y = y * window.innerHeight;
}

// --- Game Loop (your existing logic) ---
let trail = [];
const maxTrail = 80;

function startGame() {
    qrContainer.style.display = "none";
    canvas.style.display = "block";
    scared.style.display = "block";
    ghost.style.display = "block";

    scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

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

function drawTrail() {
    if (!gameStarted || gameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    trail.push({ x: scaredPos.x, y: scaredPos.y, alpha: 1 });
    if (trail.length > maxTrail) trail.shift();

    for (let t of trail) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,255,${t.alpha})`;
        ctx.shadowColor = "cyan";
        ctx.shadowBlur = 20;
        ctx.fill();
        t.alpha -= 0.02;
    }

    scared.style.left = `${scaredPos.x - 25}px`;
    scared.style.top = `${scaredPos.y - 25}px`;

    requestAnimationFrame(drawTrail);
}

function moveGhost() {
    if (!gameStarted || gameOver) return;
    const dx = scaredPos.x - ghostPos.x;
    const dy = scaredPos.y - ghostPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
        ghostPos.x += (dx / dist) * ghostSpeed;
        ghostPos.y += (dy / dist) * ghostSpeed;
    }

    ghost.style.left = `${ghostPos.x}px`;
    ghost.style.top = `${ghostPos.y}px`;

    if (dist < 50) endGame();

    requestAnimationFrame(moveGhost);
}

function endGame() {
    gameOver = true;
    gameStarted = false;

    canvas.style.display = "none";
    scared.style.display = "none";
    ghost.style.display = "none";

    showGameOver();
}

function showGameOver() {
    let overlay = document.createElement("div");
    overlay.id = "gameOverOverlay";

    let msg = document.createElement("h1");
    msg.textContent = "Game Over";
    overlay.appendChild(msg);

    let btn = document.createElement("button");
    btn.textContent = "Restart";
    btn.onclick = () => {
        document.body.removeChild(overlay);
        qrContainer.style.display = "flex";
        trail = [];
        if (peer && peer.connected) startGame();
    };
    overlay.appendChild(btn);

    document.body.appendChild(overlay);
}