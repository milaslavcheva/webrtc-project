const params = new URLSearchParams(window.location.search);
const hostId = params.get("host");
if (!hostId) {
    document.body.innerHTML = "Bad link.";
    throw new Error("Missing host");
}

const socket = io("/");
let peer = null;

const gameOverOverlay = document.getElementById("gameOverPhone");
const restartBtn = document.getElementById("restartBtn");

const youWonOverlay = document.getElementById("youWonPhone");
const restartBtnWon = document.getElementById("restartBtnWon");

const getSafeBtn = document.getElementById("getSafeBtn");
const getOutBtn = document.getElementById("getOutBtn");

gameOverOverlay.style.display = "none";
youWonOverlay.style.display = "none";
getSafeBtn.style.display = "none";
getOutBtn.style.display = "none";

const createPeer = () => {
    if (peer) peer.destroy();
    peer = new SimplePeer({ initiator: true, trickle: false });

    peer.on("signal", data => socket.emit("signal", hostId, data));

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());

            if (msg.type === "showRestart") gameOverOverlay.style.display = "flex";
            if (msg.type === "youWon") youWonOverlay.style.display = "flex";
            if (msg.type === "restartAck") {
                gameOverOverlay.style.display = "none";
                youWonOverlay.style.display = "none";
            }

            if (msg.type === "showGetSafeButton") getSafeBtn.style.display = "block";
            if (msg.type === "hideGetSafeButton") getSafeBtn.style.display = "none";
            if (msg.type === "showGetOutButton") getOutBtn.style.display = "block";
            if (msg.type === "hideShelterButtons") {
                getSafeBtn.style.display = "none";
                getOutBtn.style.display = "none";
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

restartBtn.onclick = () => {
    gameOverOverlay.style.display = "none";
    sendToPeer({ type: "restart" });
};
restartBtnWon.onclick = () => {
    youWonOverlay.style.display = "none";
    sendToPeer({ type: "restart" });
};
getSafeBtn.onclick = () => sendToPeer({ type: "getSafe" });
getOutBtn.onclick = () => sendToPeer({ type: "getOut" });