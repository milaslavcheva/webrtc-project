// ================= BASE PHONE QR + WebRTC (UNCHANGED) =================
const params = new URLSearchParams(window.location.search);
const hostId = params.get("host");

if (!hostId) {
    document.body.innerHTML = "Bad link. Scan desktop QR again.";
    throw new Error("Missing host");
}

const socket = io("/");
let peer = null;

// Badge (optional UI)
const $badge = document.querySelector("#badge");
const setBadge = text => { if ($badge) $badge.textContent = text; };

// Create WebRTC peer
const createPeer = () => {
    if (peer) peer.destroy();

    peer = new SimplePeer({
        initiator: true,
        trickle: false
    });

    peer.on("signal", data => socket.emit("signal", hostId, data));

    peer.on("connect", () => {
        console.log("[phone] peer connected");
        setBadge("Connected to desktop");
    });

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());
            console.log("[phone] received from desktop:", msg);
        } catch (err) {
            console.error("[phone] invalid peer data", err);
        }
    });

    peer.on("close", () => {
        console.log("[phone] peer closed");
        peer = null;
        setBadge("Disconnected. Refresh to reconnect.");
    });

    peer.on("error", err => console.error("[phone] peer error", err));
};

// Socket events
socket.on("connect", () => {
    console.log("[phone] socket connected");
    createPeer();
});

socket.on("signal", (peerId, signal) => {
    if (!peer) createPeer();
    peer.signal(signal);
});

// Send data to desktop
const sendToPeer = msg => {
    if (!peer || !peer.connected) return;
    peer.send(JSON.stringify(msg));
};

// ================= PHONE INPUT MAPPING =================
document.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX / window.innerWidth;
    const y = touch.clientY / window.innerHeight;
    sendToPeer({ type: 'move', x, y });
}, { passive: false });

document.addEventListener('mousemove', e => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    sendToPeer({ type: 'move', x, y });
});