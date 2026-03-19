const socket = io("/");

// DOM elements
const $qr = document.querySelector("#qr");
const $gameCanvas = document.querySelector("#gameCanvas");

// WebRTC peer
let peer = null;

// Helper to show/hide elements
const showQr = () => {
    $qr.style.display = "block";
    $gameCanvas.style.display = "none";
};

const showGame = () => {
    $qr.style.display = "none";
    $gameCanvas.style.display = "block";
};

// Build URL for QR code
const buildJoinUrl = () => window.location.origin + "/phone.html?host=" + encodeURIComponent(socket.id);

// Render QR code
const renderQr = url => {
    if (!$qr) return; // safety check
    const qr = qrcode(4, "L");
    qr.addData(url);
    qr.make();
    $qr.innerHTML = qr.createImgTag(5);
};

// Create WebRTC peer
const createPeer = (initiator, remoteId) => {
    peer = new SimplePeer({ initiator, trickle: false });

    peer.on("signal", data => socket.emit("signal", remoteId, data));

    peer.on("connect", () => {
        console.log("[desktop] peer connected");
        showGame(); // hide QR and show game canvas
    });

    peer.on("data", raw => {
        try {
            const msg = JSON.parse(raw.toString());
            console.log("[desktop] received from phone:", msg);
        } catch (err) {
            console.error("[desktop] invalid peer data", err);
        }
    });

    peer.on("close", () => {
        console.log("[desktop] peer closed");
        peer = null;
        showQr(); // show QR again if phone disconnects
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

// Send data to phone
const sendToPeer = msg => {
    if (!peer || !peer.connected) return;
    peer.send(JSON.stringify(msg));
};