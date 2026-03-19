const params = new URLSearchParams(window.location.search);
const hostId = params.get("host");
if (!hostId) throw new Error("Missing host ID!");

const socket = io("/");
let peer = new SimplePeer({
    initiator: true,
    trickle: false,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
});

// Send signaling data to desktop
peer.on("signal", data => socket.emit("signal", hostId, data));

// Receive signaling data from desktop
socket.on("signal", (fromId, signal) => {
    peer.signal(signal);
});

// Connection established
peer.on("connect", () => {
    console.log("Connected to desktop!");
});

// Live touch tracking
const coordsDiv = document.getElementById("coords");

// Track both touchstart and touchmove for smoother input
["touchstart", "touchmove"].forEach(evt =>
    window.addEventListener(evt, e => {
        e.preventDefault();
        const t = e.touches[0];
        const x = t.clientX / window.innerWidth;
        const y = t.clientY / window.innerHeight;
        coordsDiv.textContent = `x: ${x.toFixed(2)}, y: ${y.toFixed(2)}`;
        if (peer && peer.connected) peer.send(JSON.stringify({ x, y }));
    })
);