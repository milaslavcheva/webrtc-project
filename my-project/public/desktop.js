// ================= BASE QR + WebRTC (UNCHANGED) =================
const socket = io("/");

// DOM elements
const $qr = document.querySelector("#qr");
const $gameCanvas = document.querySelector("#gameCanvas");

// WebRTC peer
let peer = null;

// Helper to show/hide elements
const showQr = () => {
    $qr.style.display = "block";
    $gameCanvas.style.display = "none";
};

const showGame = () => {
    $qr.style.display = "none";
    $gameCanvas.style.display = "block";
};

// Build URL for QR code
const buildJoinUrl = () => window.location.origin + "/phone.html?host=" + encodeURIComponent(socket.id);

// Render QR code
const renderQr = url => {
    if (!$qr) return;
    const qr = qrcode(4, "L");
    qr.addData(url);
    qr.make();
    $qr.innerHTML = qr.createImgTag(5);
};

// Create WebRTC peer
const createPeer = (initiator, remoteId) => {
    peer = new SimplePeer({ initiator, trickle: false });

    peer.on("signal", data => socket.emit("signal", remoteId, data));

    peer.on("connect", () => {
        console.log("[desktop] peer connected");
        showGame(); // hide QR and show game canvas
        startGame(); // <-- start the game animations
    });

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());
            console.log("[desktop] received from phone:", msg);

            // ===== CORRECTED: Update scared position from phone =====
            if (msg.type === "move" && gameStarted && !gameOver) {
                scaredPos.x = msg.x * window.innerWidth;
                scaredPos.y = msg.y * window.innerHeight;
            }
        } catch (err) {
            console.error("[desktop] invalid peer data", err);
        }
    });

    peer.on("close", () => {
        console.log("[desktop] peer closed");
        peer = null;
        showQr(); // show QR again if phone disconnects
        if (socket.connected) renderQr(buildJoinUrl());
    });

    peer.on("error", err => console.error("[desktop] peer error", err));

    return peer;
};

// Socket events
socket.on("connect", () => {
    console.log("[desktop] socket connected");
    showQr();
    renderQr(buildJoinUrl());
});

socket.on("signal", (peerId, signal, fromId) => {
    if (!peer) createPeer(false, fromId);
    peer.signal(signal);
});

// Send data to phone
const sendToPeer = msg => {
    if (!peer || !peer.connected) return;
    peer.send(JSON.stringify(msg));
};

// ==================== GHOST GAME LOGIC ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scared = document.getElementById('scaredPerson');
const ghost = document.getElementById('ghost');

let scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
let ghostSpeed = 3;

let gameStarted = false;
let gameOver = false;

let trail = [];
const maxTrail = 80;

// Initial hides
canvas.style.display = 'none';
scared.style.display = 'none';
ghost.style.display = 'none';

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- Start Game ---
function startGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    scared.style.display = 'block';
    ghost.style.display = 'block';
    gameStarted = true;
    gameOver = false;
    trail = [];

    scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

    scared.style.left = `${scaredPos.x - 25}px`;
    scared.style.top = `${scaredPos.y - 25}px`;
    ghost.style.left = `${ghostPos.x}px`;
    ghost.style.top = `${ghostPos.y}px`;

    drawTrail();
    moveGhost();
}

// --- Draw Trail ---
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

    scared.style.left = `${scaredPos.x - 25}px`;
    scared.style.top = `${scaredPos.y - 25}px`;

    requestAnimationFrame(drawTrail);
}

// --- Move Ghost ---
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

// --- End Game ---
function endGame() {
    gameOver = true;
    gameStarted = false;

    canvas.style.display = 'none';
    scared.style.display = 'none';
    ghost.style.display = 'none';

    showGameOver();
}

// --- Game Over Overlay ---
function showGameOver() {
    const overlay = document.createElement('div');
    overlay.id = 'gameOverOverlay';

    const msg = document.createElement('h1');
    msg.textContent = 'Game Over';
    overlay.appendChild(msg);

    const btn = document.createElement('button');
    btn.textContent = 'Restart';
    btn.onclick = () => {
        document.body.removeChild(overlay);
        showQr();
        trail = [];
    };
    overlay.appendChild(btn);

    document.body.appendChild(overlay);
}