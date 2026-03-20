// ================= BASE PHONE =================
const params = new URLSearchParams(window.location.search);
const hostId = params.get("host");
if (!hostId) {
    document.body.innerHTML = "Bad link. Scan QR again.";
    throw new Error("Missing host");
}

const socket = io("/");
let peer = null;

// Create WebRTC peer
const createPeer = () => {
    if (peer) peer.destroy();
    peer = new SimplePeer({ initiator: true, trickle: false });

    peer.on("signal", data => socket.emit("signal", hostId, data));
    peer.on("connect", () => console.log("[phone] connected"));
    peer.on("close", () => (peer = null));

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg.type === "showRestart") showRestartButton();
            if (msg.type === "restartAck") startGameAck();
        } catch (err) { }
    });
};

socket.on("connect", createPeer);
socket.on("signal", (peerId, signal) => { if (!peer) createPeer(); peer.signal(signal); });

// Send data to desktop
const sendToPeer = msg => {
    if (!peer || !peer.connected) return;
    peer.send(JSON.stringify(msg));
};

// ================= CONTROLS =================
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

// Optional mouse controls for testing
let lastMouse = null;
document.addEventListener("mousedown", e => lastMouse = { x: e.clientX, y: e.clientY });
document.addEventListener("mousemove", e => {
    if (!lastMouse) return;
    const dx = (e.clientX - lastMouse.x) / window.innerWidth;
    const dy = (e.clientY - lastMouse.y) / window.innerHeight;
    lastMouse = { x: e.clientX, y: e.clientY };
    sendToPeer({ type: "move", dx, dy });
});
document.addEventListener("mouseup", () => lastMouse = null);

// ================= GAME OVER PHONE =================
const overlay = document.getElementById("gameOverPhone");
const restartBtn = document.getElementById("restartBtn");

const showRestartButton = () => overlay.style.display = "flex";

restartBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    sendToPeer({ type: "restart" });
});

// Optional ack
function startGameAck() {
    console.log("[phone] Game restarted on desktop!");
}