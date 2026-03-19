const params = new URLSearchParams(window.location.search);
const hostId = params.get("host");
if (!hostId) throw new Error("Missing host ID!");

const socket = io("/");
let peer = new SimplePeer({ initiator: true, trickle: false });

// 🔁 Send signaling data to desktop
peer.on("signal", data => socket.emit("signal", hostId, data));

// 🔥 Receive signaling data from desktop
socket.on("signal", (peerId, signal) => {
    peer.signal(signal);
});

// ✅ When connection is established
peer.on("connect", () => {
    console.log("Connected to desktop!");
});

// 🎮 Send touch input to desktop
window.addEventListener("touchmove", e => {
    e.preventDefault();

    const t = e.touches[0];

    const x = t.clientX / window.innerWidth;
    const y = t.clientY / window.innerHeight;

    if (peer.connected) {
        peer.send(JSON.stringify({ x, y }));
    }
});