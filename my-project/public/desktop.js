// ================= BASE QR + WebRTC =================
const socket = io("/");

// DOM elements
const $qr = document.querySelector("#qr");
const $qrCode = document.querySelector("#qrCode");
const $gameCanvas = document.querySelector("#gameCanvas");

// WebRTC peer
let peer = null;

// Show / hide QR and Game
const showQr = () => {
    $qr.style.display = "block";
    $gameCanvas.style.display = "none";
};
const showGame = () => {
    $qr.style.display = "none";
    $gameCanvas.style.display = "block";
};

// Build QR URL
const buildJoinUrl = () =>
    window.location.origin + "/phone.html?host=" + encodeURIComponent(socket.id);

// Render QR code
const renderQr = url => {
    if (!$qrCode) return;
    const qr = qrcode(4, "L");
    qr.addData(url);
    qr.make();
    $qrCode.innerHTML = qr.createImgTag(5);
};

// Create peer
const createPeer = (initiator, remoteId) => {
    peer = new SimplePeer({ initiator, trickle: false });

    peer.on("signal", data => socket.emit("signal", remoteId, data));

    peer.on("connect", () => {
        console.log("[desktop] peer connected");
        showGame();
        startGame();
    });

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());

            // Movement from phone
            if (msg.type === "move" && gameStarted && !gameOver) {
                const speed = 2;
                scaredPos.x += msg.dx * window.innerWidth * speed;
                scaredPos.y += msg.dy * window.innerHeight * speed;

                // Keep inside screen
                scaredPos.x = Math.max(0, Math.min(window.innerWidth, scaredPos.x));
                scaredPos.y = Math.max(0, Math.min(window.innerHeight, scaredPos.y));
            }

            // Restart game from phone
            if (msg.type === "restart") restartGame();

        } catch (err) {
            console.error("[desktop] invalid peer data", err);
        }
    });

    peer.on("close", () => {
        console.log("[desktop] peer closed");
        peer = null;
        showQr();
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

// Send to peer
const sendToPeer = msg => {
    if (!peer || !peer.connected) return;
    peer.send(JSON.stringify(msg));
};

// ================= GAME =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scared = document.getElementById("scaredPerson");
const ghost = document.getElementById("ghost");
const coin = document.getElementById("coin");
const coinNumber = document.getElementById("coinNumber");

let scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
let ghostSpeed = 3;

let gameStarted = false;
let gameOver = false;
let trail = [];
const maxTrail = 80;

canvas.style.display = scared.style.display = ghost.style.display = "none";
document.getElementById("coinCounter").style.display = "none";

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ---------------- COINS ----------------
let coinsCollected = 0;
const maxCoins = 5;
let coinActive = false;

function spawnCoin() {
    if (coinsCollected >= maxCoins) return;

    const padding = 50;
    const x = Math.random() * (window.innerWidth - padding);
    const y = Math.random() * (window.innerHeight - padding);

    coin.style.left = `${x}px`;
    coin.style.top = `${y}px`;
    coin.style.display = "block";
    coinActive = true;
}

function checkCoinCollision() {
    if (!coinActive) return;

    const scaredRect = scared.getBoundingClientRect();
    const coinRect = coin.getBoundingClientRect();

    if (
        scaredRect.left < coinRect.right &&
        scaredRect.right > coinRect.left &&
        scaredRect.top < coinRect.bottom &&
        scaredRect.bottom > coinRect.top
    ) {
        coinCollectedFn();
    }
}

function coinCollectedFn() {
    coinsCollected++;
    coinNumber.textContent = coinsCollected;

    coin.style.display = "none";
    coinActive = false;

    if (coinsCollected < maxCoins) {
        setTimeout(spawnCoin, 3000);
    }
}

function coinLoop() {
    if (!gameStarted || gameOver) return;
    checkCoinCollision();
    requestAnimationFrame(coinLoop);
}

// ---------------- START GAME ----------------
function startGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.style.display = scared.style.display = ghost.style.display = "block";

    // Show coin counter when game starts
    document.getElementById("coinCounter").style.display = "flex";

    gameStarted = true;
    gameOver = false;
    trail = [];

    scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

    // Coins setup
    coinsCollected = 0;
    coinNumber.textContent = coinsCollected;
    spawnCoin();
    coinLoop();

    drawTrail();
    moveGhost();
}

// ---------------- RESTART GAME ----------------
function restartGame() {
    if (gameOverOverlay) document.body.removeChild(gameOverOverlay);
    startGame();
    sendToPeer({ type: "restartAck" });
}

// ---------------- DRAW TRAIL ----------------
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

// ---------------- MOVE GHOST ----------------
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

// ---------------- GAME OVER ----------------
let gameOverOverlay = null;
function endGame() {
    gameOver = true;
    gameStarted = false;

    canvas.style.display = scared.style.display = ghost.style.display = "none";
    coin.style.display = "none";

    // Hide coin counter on game over
    document.getElementById("coinCounter").style.display = "none";

    showGameOver();
}

function showGameOver() {
    gameOverOverlay = document.createElement("div");
    gameOverOverlay.id = "gameOverOverlay";

    const msg = document.createElement("h1");
    msg.textContent = "Game Over";
    gameOverOverlay.appendChild(msg);

    document.body.appendChild(gameOverOverlay);

    sendToPeer({ type: "showRestart" });
}