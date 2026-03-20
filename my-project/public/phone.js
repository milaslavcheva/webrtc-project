const params = new URLSearchParams(window.location.search);
const hostId = params.get("host");
if (!hostId) {
    document.body.innerHTML = "Bad link.";
    throw new Error("Missing host");
}

const socket = io("/");
let peer = null;

// UI
const gameOverOverlay = document.getElementById("gameOverPhone");
const restartBtn = document.getElementById("restartBtn");

const youWonOverlay = document.getElementById("youWonPhone");
const restartBtnWon = document.getElementById("restartBtnWon");

// hide both initially
gameOverOverlay.style.display = "none";
youWonOverlay.style.display = "none";

// Peer
const createPeer = () => {
    if (peer) peer.destroy();
    peer = new SimplePeer({ initiator: true, trickle: false });

    peer.on("signal", data => socket.emit("signal", hostId, data));

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());

            if (msg.type === "showRestart") showGameOver();
            if (msg.type === "youWon") showYouWon();
            if (msg.type === "restartAck") {
                gameOverOverlay.style.display = "none";
                youWonOverlay.style.display = "none";
            }

        } catch { }
    });
};

socket.on("connect", createPeer);
socket.on("signal", (id, signal) => {
    if (!peer) createPeer();
    peer.signal(signal);
});

const sendToPeer = msg => {
    if (peer && peer.connected) {
        peer.send(JSON.stringify(msg));
    }
};

// CONTROLS
let lastTouch = null;

document.addEventListener("touchstart", e => {
    const t = e.touches[0];
    lastTouch = { x: t.clientX, y: t.clientY };
});

document.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];
    if (!lastTouch) return;

    const dx = (t.clientX - lastTouch.x) / window.innerWidth;
    const dy = (t.clientY - lastTouch.y) / window.innerHeight;

    lastTouch = { x: t.clientX, y: t.clientY };
    sendToPeer({ type: "move", dx, dy });
}, { passive: false });

document.addEventListener("touchend", () => lastTouch = null);

// UI FUNCTIONS
function showGameOver() {
    gameOverOverlay.style.display = "flex";
    youWonOverlay.style.display = "none";
}

function showYouWon() {
    youWonOverlay.style.display = "flex";
    gameOverOverlay.style.display = "none";
}

// Restart buttons
restartBtn.onclick = () => {
    gameOverOverlay.style.display = "none";
    sendToPeer({ type: "restart" });
};

restartBtnWon.onclick = () => {
    youWonOverlay.style.display = "none";
    sendToPeer({ type: "restart" });
};