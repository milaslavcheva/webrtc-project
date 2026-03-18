const params = new URLSearchParams(window.location.search);
const hostId = params.get("host");
if (!hostId) throw new Error("Missing host ID!");

const socket = io("/");
let peer = new SimplePeer({ initiator: false, trickle: false });

peer.on("signal", data => socket.emit("signal", hostId, data));

peer.on("connect", () => console.log("Connected to desktop!"));

peer.on("data", data => {
    const msg = JSON.parse(data.toString());
    if (msg.x && msg.y) {
        // Send touch coordinates
        peer.send(JSON.stringify({ x: msg.x, y: msg.y }));
    }
});

window.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];
    peer.send(JSON.stringify({ x: t.clientX / window.innerWidth, y: t.clientY / window.innerHeight }));
});