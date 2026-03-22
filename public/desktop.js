// ================= BASE QR + WebRTC =================
const socket = io("/");

const $qr = document.querySelector("#qr");
const $qrCode = document.querySelector("#qrCode");
const $gameCanvas = document.querySelector("#gameCanvas");

const scared = document.getElementById("scaredPerson");
const ghost = document.getElementById("ghost");
const coin = document.getElementById("coin");
const coinNumber = document.getElementById("coinNumber");
const shelter1 = document.getElementById("shelter1");
const shelter2 = document.getElementById("shelter2");

let peer = null;

const showQr = () => {
    $qr.style.display = "block";
    $gameCanvas.style.display = "none";
};
const showGame = () => {
    $qr.style.display = "none";
    $gameCanvas.style.display = "block";
};

const buildJoinUrl = () =>
    window.location.origin + "/phone.html?host=" + encodeURIComponent(socket.id);

const renderQr = url => {
    if (!$qrCode) return;
    const qr = qrcode(4, "L");
    qr.addData(url);
    qr.make();
    $qrCode.innerHTML = qr.createImgTag(5);
};

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

            if (msg.type === "move" && gameStarted && !gameOver && !inShelter) {
                const speed = 2;
                scaredPos.x += msg.dx * window.innerWidth * speed;
                scaredPos.y += msg.dy * window.innerHeight * speed;

                scaredPos.x = Math.max(0, Math.min(window.innerWidth, scaredPos.x));
                scaredPos.y = Math.max(0, Math.min(window.innerHeight, scaredPos.y));
            }

            if (msg.type === "restart") restartGame();
            if (msg.type === "getSafe") enterShelter();
            if (msg.type === "getOut") exitShelter();

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

let scaredPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };

let ghostSpeed = 3;
const speedIncrease = 0.7;

let gameStarted = false;
let gameOver = false;
let inShelter = false;
let trail = [];
const maxTrail = 80;

canvas.style.display = scared.style.display = ghost.style.display = "none";
coin.style.display = "none";
shelter1.style.display = shelter2.style.display = "none";
document.getElementById("coinCounter").style.display = "none";

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    positionShelters();
});

// ================= SHELTER POSITIONS =================
function positionShelters() {
    const padding = 20;
    shelter1.style.left = `${padding}px`;
    shelter1.style.top = `${padding}px`;

    shelter2.style.left = `${window.innerWidth - 100 - padding}px`;
    shelter2.style.top = `${window.innerHeight - 100 - padding}px`;
}
positionShelters();

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
    if (!coinActive || inShelter) return;

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

    ghostSpeed += speedIncrease;

    coin.style.display = "none";
    coinActive = false;

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

    canvas.style.display = scared.style.display = ghost.style.display =
        shelter1.style.display = shelter2.style.display = "block";
    document.getElementById("coinCounter").style.display = "flex";

    gameStarted = true;
    gameOver = false;
    inShelter = false;
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

// ================= RESTART =================
function restartGame() {
    const go = document.getElementById("gameOverOverlay");
    if (go) go.remove();

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
let ghostRandomTarget = null;

function moveGhost() {
    if (!gameStarted || gameOver) return;

    if (inShelter) {
        if (!ghostRandomTarget || Math.hypot(ghostRandomTarget.x - ghostPos.x, ghostRandomTarget.y - ghostPos.y) < 10) {
            ghostRandomTarget = {
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight
            };
        }
        const dx = ghostRandomTarget.x - ghostPos.x;
        const dy = ghostRandomTarget.y - ghostPos.y;
        const dist = Math.hypot(dx, dy);
        ghostPos.x += (dx / dist) * ghostSpeed;
        ghostPos.y += (dy / dist) * ghostSpeed;
    } else {
        const dx = scaredPos.x - ghostPos.x;
        const dy = scaredPos.y - ghostPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
            ghostPos.x += (dx / dist) * ghostSpeed;
            ghostPos.y += (dy / dist) * ghostSpeed;
        }
        if (dist < 50) endGame();
    }

    ghost.style.left = `${ghostPos.x}px`;
    ghost.style.top = `${ghostPos.y}px`;

    requestAnimationFrame(moveGhost);
}

// ================= GAME OVER =================
function endGame() {
    gameOver = true;
    gameStarted = false;

    canvas.style.display = scared.style.display = ghost.style.display = "none";
    coin.style.display = "none";
    shelter1.style.display = shelter2.style.display = "none";
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
    shelter1.style.display = shelter2.style.display = "none";
    document.getElementById("coinCounter").style.display = "none";

    const overlay = document.createElement("div");
    overlay.id = "youWonOverlay";

    const msg = document.createElement("h1");
    msg.textContent = "You Won!";
    overlay.appendChild(msg);

    document.body.appendChild(overlay);

    sendToPeer({ type: "youWon" });
}

// ================= SHELTER LOGIC =================
function checkShelterProximity() {
    if (inShelter || !gameStarted || gameOver) {
        sendToPeer({ type: "hideGetSafeButton" });
        return;
    }

    const scaredRect = scared.getBoundingClientRect();
    const shelters = [shelter1, shelter2];
    let nearShelter = false;

    for (let s of shelters) {
        const sRect = s.getBoundingClientRect();
        const dist = Math.hypot(
            (scaredRect.left + 25) - (sRect.left + 40),
            (scaredRect.top + 25) - (sRect.top + 40)
        );
        if (dist < 80) {
            nearShelter = true;
            break;
        }
    }

    if (nearShelter) {
        sendToPeer({ type: "showGetSafeButton" });
    } else {
        sendToPeer({ type: "hideGetSafeButton" });
    }
}
setInterval(checkShelterProximity, 100);

function enterShelter() {
    const shelters = [shelter1, shelter2];
    let closest = shelters[0];
    let minDist = Infinity;
    const scaredRect = scared.getBoundingClientRect();
    for (let s of shelters) {
        const sRect = s.getBoundingClientRect();
        const dist = Math.hypot(
            (scaredRect.left + 25) - (sRect.left + 40),
            (scaredRect.top + 25) - (sRect.top + 40)
        );
        if (dist < minDist) {
            minDist = dist;
            closest = s;
        }
    }
    scaredPos.x = parseFloat(closest.style.left) + 40;
    scaredPos.y = parseFloat(closest.style.top) + 40;

    inShelter = true;
    sendToPeer({ type: "showGetOutButton" });
}

function exitShelter() {
    inShelter = false;
    sendToPeer({ type: "hideShelterButtons" });
}