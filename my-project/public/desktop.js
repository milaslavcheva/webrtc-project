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
        showGame();
        startGame();
    });

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());

            if (msg.type === "move" && gameStarted && !gameOver) {
                const speed = 2;
                scaredPos.x += msg.dx * window.innerWidth * speed;
                scaredPos.y += msg.dy * window.innerHeight * speed;

                scaredPos.x = Math.max(0, Math.min(window.innerWidth, scaredPos.x));
                scaredPos.y = Math.max(0, Math.min(window.innerHeight, scaredPos.y));
            }

            if (msg.type === "restart") restartGame();

        } catch (err) {
            console.error(err);
        }
    });

    peer.on("close", () => {
        peer = null;
        showQr();
        if (socket.connected) renderQr(buildJoinUrl());
    });

    return peer;
};

socket.on("connect", () => {
    showQr();
    renderQr(buildJoinUrl());
});

socket.on("signal", (peerId, signal, fromId) => {
    if (!peer) createPeer(false, fromId);
    peer.signal(signal);
});

const sendToPeer = msg => {
    if (peer && peer.connected) {
        peer.send(JSON.stringify(msg));
    }
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

// ================= COINS =================
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

    // WIN CONDITION
    if (coinsCollected === maxCoins) {
        winGame();
        return;
    }

    setTimeout(spawnCoin, 3000);
}

function coinLoop() {
    if (!gameStarted || gameOver) return;
    checkCoinCollision();
    requestAnimationFrame(coinLoop);
}

// ================= START GAME =================
function startGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.style.display = scared.style.display = ghost.style.display = "block";
    document.getElementById("coinCounter").style.display = "flex";

    gameStarted = true;
    gameOver = false;
    trail = [];

    ghostSpeed = 3;

    scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

    coinsCollected = 0;
    coinNumber.textContent = coinsCollected;

    spawnCoin();
    coinLoop();

    drawTrail();
    moveGhost();
}

// ================= RESTART (FIXED) =================
function restartGame() {
    // Remove Game Over overlay safely
    const go = document.getElementById("gameOverOverlay");
    if (go) go.remove();

    // Remove You Won overlay safely
    const yw = document.getElementById("youWonOverlay");
    if (yw) yw.remove();

    startGame();

    sendToPeer({ type: "restartAck" });
}

// ================= DRAW =================
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

// ================= GHOST =================
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

// ================= GAME OVER =================
function endGame() {
    gameOver = true;
    gameStarted = false;

    canvas.style.display = scared.style.display = ghost.style.display = "none";
    coin.style.display = "none";
    document.getElementById("coinCounter").style.display = "none";

    showGameOver();
}

function showGameOver() {
    const overlay = document.createElement("div");
    overlay.id = "gameOverOverlay";

    const msg = document.createElement("h1");
    msg.textContent = "Game Over";
    overlay.appendChild(msg);

    document.body.appendChild(overlay);

    sendToPeer({ type: "showRestart" });
}

// ================= YOU WON =================
function winGame() {
    gameOver = true;
    gameStarted = false;

    canvas.style.display = scared.style.display = ghost.style.display = "none";
    coin.style.display = "none";
    document.getElementById("coinCounter").style.display = "none";

    const overlay = document.createElement("div");
    overlay.id = "youWonOverlay";

    const msg = document.createElement("h1");
    msg.textContent = "You Won!";
    overlay.appendChild(msg);

    document.body.appendChild(overlay);

    sendToPeer({ type: "youWon" });
}