# Week 1 – Setup, Server & WebRTC Connection (MVP)
- Goal

The goal for the first week was to build the foundation of the project, focusing on establishing a connection between the desktop and the smartphone using WebRTC data channels. At the end of this week, I wanted a minimal working prototype where both devices could successfully connect.

1. Project Setup

I started by setting up the project using Node.js and Express to serve my frontend files.

> In server.js, I:

*Created an Express server to host the project:*
```javascript
app.use(express.static('public'));
```

*Configured the server to run on HTTP or HTTPS depending on the environment:*
```javascript
const server = require(isDevelopment ? 'https' : 'http').Server(options, app);
```

*Added SSL certificates (localhost.key and localhost.crt) for development, because WebRTC requires a secure connection (HTTPS).*

*Used a .env file to manage environment variables like development mode and port.*

This ensured that the project could be started with:

* npm install
* npm start

2. WebSocket Signalling (Socket.IO)

Because WebRTC cannot establish connections on its own, I implemented a signalling layer using Socket.IO.

> In server.js:

*I initialized Socket.IO:*
```javascript
const io = new Server(server);
```

*I kept track of connected clients:*
```javascript
const clients = {};
```
*When a client connects:*
```javascript
clients[socket.id] = { id: socket.id };
```

*I implemented signalling so peers can exchange connection data:*
```javascript
socket.on('signal', (peerId, signal) => {
    io.to(peerId).emit('signal', peerId, signal, socket.id);
});
```
This allows the desktop and phone to exchange WebRTC signals through the server.

3. QR Code Connection System

To make the connection simple and user-friendly, I created a QR code system.

> In desktop.js:

*When the desktop connects:*
```javascript
socket.on("connect", () => {
    showQr();
    renderQr(buildJoinUrl());
});
```

*A unique connection URL is generated:*
```javascript
const buildJoinUrl = () =>
    window.location.origin + "/phone.html?host=" + encodeURIComponent(socket.id);
```

*This URL is turned into a QR code and displayed in index.html:*
<div id="qrCode"></div>

*In style.css, I styled the QR screen to be centered and clear:*
```css
#qr {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

The phone scans the QR code and automatically connects to the correct desktop session.

4. WebRTC Data Channel Setup

After setting up signalling, I implemented the peer-to-peer connection using WebRTC with the SimplePeer library.

> Desktop Side (desktop.js)
*Created a peer connection:*
```javascript
peer = new SimplePeer({ initiator, trickle: false });
```

*Sent signalling data through Socket.IO:*
```javascript
peer.on("signal", data => socket.emit("signal", remoteId, data));
```

*When the connection is established:*
```javascript
peer.on("connect", () => {
    showGame();
    startGame();
});
```

At this stage, the connection triggers the transition from QR screen to game screen.

> Phone Side (phone.js)
*Retrieved the host ID from the QR code:*
```javascript
const hostId = params.get("host");
```
*Created the peer as initiator:*
```javascript
peer = new SimplePeer({ initiator: true, trickle: false });
```

*Sent signalling data back to the desktop:*
```javascript
peer.on("signal", data => socket.emit("signal", hostId, data));
```
> Signal Exchange

Both devices listen for incoming signals:

*Desktop:*
```javascript
socket.on("signal", (peerId, signal, fromId) => {
    if (!peer) createPeer(false, fromId);
    peer.signal(signal);
});
```

*Phone:*
```javascript
socket.on("signal", (id, signal) => {
    if (!peer) createPeer();
    peer.signal(signal);
});
```

This completes the WebRTC handshake and establishes a direct data channel between devices.

5. Interface Setup (Desktop)

In index.html, I created two main states:

> QR Screen
<div id="qr">
    <div class="qr-container">
        <h1>Ghost Chasing</h1>
        <div id="qrCode"></div>
        <p>Scan the QR code to start the game</p>
    </div>
</div>

> Game Canvas (hidden initially)
<canvas id="gameCanvas"></canvas>

The QR screen is shown first, and the game is only displayed after a successful connection.

6. Interface Setup (Phone)

>In phone.html, I created a simple interface:
* Title
* Instructions for the user
* Hidden UI elements (restart buttons, win/lose screens, shelter buttons)

Example:
<p id="instructionText">
    Move your finger on the screen to control the player.
</p>

>In phone.js, I:

* Initialized the connection logic
* Prepared UI elements (hidden by default)
* Set up the structure for receiving messages from the desktop

## End of Week 1 Result (MVP)

* At the end of the first week, I had a working foundation:

*A running Express server*
*A secure WebRTC setup (HTTPS + certificates)*
*A Socket.IO signalling system*
*A QR code connection flow*
*A working peer-to-peer connection between phone and desktop*

At this point, the devices were connected, but no full gameplay was implemented yet.

- AI Usage & Reflection – Week 1
During the first week, I mainly focused on setting up the WebRTC connection and signalling system, which was one of the most technical parts of the project. I used AI as a support tool to better understand and implement these concepts.

*How I used AI*
- Understand how WebRTC data channels work
- Get help with Socket.IO signalling
- Troubleshoot connection issues
- Generate example code for SimplePeer setup

*What I did myself*
- Designed the system (desktop = host, phone = controller)
- Built the QR connection flow
- Integrated server + frontend + WebRTC
- Managed connection states (QR → game)

*AI-generated code & modifications*
- AI helped generate:
- SimplePeer setup
- Signalling structure
- I modified it to:
- Fit my project structure
- Work with the QR system
- Handle connection states properly

*Reflection*
AI helped me speed up development and understand complex networking concepts, but I made sure to:
- Test everything myself
- Adapt the code
- Understand how everything works

This allowed me to build a solid foundation for the rest of the project.


# Week 2 – Phone Controls & Player Movement
- Goal

The goal for the second week was to transform the smartphone into a functional controller and allow the user to move a character on the desktop screen using touch input.

*At the end of this week, I wanted a working prototype where:*
- The phone sends input data
- The desktop receives it
- The player can move in real time

1. Implementing Touch Input (Phone)

I started by handling touch events in phone.js to detect finger movement.

*When the user touches the screen:*
```javascript
document.addEventListener("touchstart", e => {
    const t = e.touches[0];
    lastTouch = { x: t.clientX, y: t.clientY };
});
```

*When the user moves their finger:*
```javascript
document.addEventListener("touchmove", e => {
    e.preventDefault();

    const t = e.touches[0];
    if (!lastTouch) return;

    const dx = (t.clientX - lastTouch.x) / window.innerWidth;
    const dy = (t.clientY - lastTouch.y) / window.innerHeight;

    lastTouch = { x: t.clientX, y: t.clientY };

    sendToPeer({ type: "move", dx, dy });
}, { passive: false });
```

This calculates movement as relative values (dx, dy) instead of absolute positions, making movement smoother and resolution-independent.

2. Sending Data via WebRTC

*To send movement data to the desktop, I used the WebRTC data channel:*
```javascript
const sendToPeer = msg => {
    if (peer && peer.connected) {
        peer.send(JSON.stringify(msg));
    }
};
```
This ensures that every movement is transmitted in real time.

3. Receiving Input on Desktop

*On the desktop side (desktop.js), I handled incoming data:*
```javascript
peer.on("data", raw => {
    const msg = JSON.parse(raw.toString());

    if (msg.type === "move" && gameStarted && !gameOver && !inShelter) {
        const speed = 2;

        scaredPos.x += msg.dx * window.innerWidth * speed;
        scaredPos.y += msg.dy * window.innerHeight * speed;
    }
});
```

The desktop updates the player’s position based on the received input.

4. Player Representation

> In index.html, I added the player image:
<img id="scaredPerson" src="images/scared_person.png">

>In style.css, I positioned it:
```css
#scaredPerson {
    position: absolute;
    width: 50px;
    height: 50px;
}
```

The player is visually represented as an image that moves across the screen.

5. Rendering Movement

*To display movement, I updated the player’s position dynamically:*
```javascript
scared.style.left = `${scaredPos.x - 25}px`;
scared.style.top = `${scaredPos.y - 25}px`;
```

This keeps the image centered on its position.

6. Screen Boundaries

*To prevent the player from going off-screen, I added limits:*
```javascript
scaredPos.x = Math.max(0, Math.min(window.innerWidth, scaredPos.x));
scaredPos.y = Math.max(0, Math.min(window.innerHeight, scaredPos.y));
```

This keeps the player within the visible area.

7. Basic Game Canvas Setup

*I also initialized a canvas for future visual effects:*
```javascript
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
```

*And made sure it resizes with the window:*
```javascript
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
```

This prepared the project for later visual features like trails and effects.

8. Starting the Game After Connection

*Once the phone connects, the game starts automatically:*
```javascript
peer.on("connect", () => {
    showGame();
    startGame();
});
```
> In startGame():
* The player position is initialized
* The game state is reset
* The player becomes visible

9. Improving Phone UI

>In phone.html, I added simple instructions:
<p id="instructionText">
    Move your finger on the screen to control the player.
</p>

This ensures the user understands how to interact with the system.

## End of Week 2 Result (MVP)

* At the end of this week, I had:

*A working touch input system on the phone*
*Real-time data transfer via WebRTC*
*A controllable player on the desktop*
*Movement constrained within screen boundaries*
*A basic game loop foundation*

At this point, the project evolved from a connection demo into an interactive experience.

- AI Usage & Reflection – Week 2
During this week, I focused on implementing real-time interaction between devices, especially handling touch input and movement logic.

*How I used AI*
- Helped with understanding touch event handling (touchstart, touchmove)
- Suggested ways to calculate relative movement (dx, dy)
- Assisted in debugging movement issues and responsiveness

*What I did myself*
- Designed the control system (phone → movement input → desktop)
- Implemented the full data flow using WebRTC
- Connected input to visual movement on screen
- Structured the logic for player positioning and boundaries

*AI-generated code & modifications*
>Some initial movement logic was inspired by AI examples, but I:
- Adjusted movement scaling using screen size
- Added boundary constraints
- Integrated movement with my existing WebRTC system

*Reflection*
>AI helped me refine the interaction and improve responsiveness, but I made sure to:
- Adapt the logic to fit my game
- Test different movement behaviors
- Understand how input translates into motion

This resulted in a smooth and responsive control system.


# Week 3 – Game Mechanics: Ghost, Coins, Win/Lose, Shelters
- Goal

>The goal for Week 3 was to implement the core gameplay mechanics:

* Add a ghost that chases the player
* Introduce collectible coins
* Implement win and game over logic
* Add shelters where the player can hide

By the end of this week, the game should feel like a playable MVP, even if some polish or visual effects are added later.

1. Ghost Chasing Logic

>In desktop.js, I implemented a ghost that follows the player.
```javascript
let ghostPos = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
let ghostSpeed = 3;

function moveGhost() {
    if (!gameStarted || gameOver) return;

    // Chase the player unless in shelter
    if (!inShelter) {
        const dx = scaredPos.x - ghostPos.x;
        const dy = scaredPos.y - ghostPos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
            ghostPos.x += (dx / dist) * ghostSpeed;
            ghostPos.y += (dy / dist) * ghostSpeed;
        }
        if (dist < 50) endGame();
    } else {
        // Ghost moves randomly if player is safe
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
    }

    ghost.style.left = `${ghostPos.x}px`;
    ghost.style.top = `${ghostPos.y}px`;

    requestAnimationFrame(moveGhost);
}
```

*ghostPos tracks the ghost’s location*
*ghostSpeed gradually increases as the player collects coins*
*moveGhost() runs in a loop using requestAnimationFrame()*
*The ghost chases the player unless they are in a shelter*

2. Coins

*Coins are collectibles that the player must gather to win.*
```javascript
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
```

*Collision detection:*
```javascript
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
```

> Player must collect 5 coins to win
> Each coin collected makes the ghost faster

3. Win & Game Over Logic

>Game Over (Ghost catches player)
```javascript
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
```

> Win (Player collects all coins)
```javascript
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
```
Both win and lose screens send signals to the phone to show restart buttons

4. Shelters

*Shelters are safe zones where the player can hide from the ghost.*

> Position Shelters
```javascript
function positionShelters() {
    const padding = 20;
    shelter1.style.left = `${padding}px`;
    shelter1.style.top = `${padding}px`;

    shelter2.style.left = `${window.innerWidth - 100 - padding}px`;
    shelter2.style.top = `${window.innerHeight - 100 - padding}px`;
}
positionShelters();
```

>Shelter Logic
```javascript
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
```

>Enter & Exit Shelter
```javascript
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

    // Snap player to shelter
    scaredPos.x = parseFloat(closest.style.left) + 40;
    scaredPos.y = parseFloat(closest.style.top) + 40;

    inShelter = true;
    sendToPeer({ type: "showGetOutButton" });
}

function exitShelter() {
    inShelter = false;
    sendToPeer({ type: "hideShelterButtons" });
}
```

*Shelters appear as images in index.html:*
<img id="shelter1" src="images/shelter.png">
<img id="shelter2" src="images/shelter.png">

*Styled in style.css:*
```css
#shelter1,
#shelter2 {
    position: absolute;
    width: 80px;
    height: 80px;
}
```

## End of Week 3 Result (Playable Game)

* By the end of this week, the game included:

*A ghost chasing mechanic*
*Coins to collect to win*
*Win & lose screens*
*Shelters for hiding*
*Signals between desktop & phone for restart / safe actions*
*Dynamic movement with touch input from Week 2*

This made the game fully playable as an MVP.

*AI Usage & Reflection - Week 3*
- How AI helped
- Suggested collision detection logic for coins and shelters
- Provided examples of smooth chasing movement for the ghost
- Helped structure win/lose overlay logic

*What I did myself*
- Integrated all mechanics with my WebRTC system
- Customized ghost speed, coin spawning, and shelter proximity
- Linked desktop logic to phone UI buttons
- Tested gameplay balance

*Reflection*
>AI gave guidance and examples, but I adapted all logic to fit my specific game.
>This week was crucial to making the experience interactive and fun.

# Week 4 – Polishing, Restart, Trails, and Finishing Touches
- Goal

The goal for Week 4 was to polish the gameplay, add visual effects, ensure restart functionality works seamlessly, and finalize the user experience.

1. Restart Logic

*Players can restart the game without rescanning the QR code.*

>Desktop Side (desktop.js)
```javascript
function restartGame() {
    const go = document.getElementById("gameOverOverlay");
    if (go) go.remove();

    const yw = document.getElementById("youWonOverlay");
    if (yw) yw.remove();

    startGame();
    sendToPeer({ type: "restartAck" });
}
```

* Removes overlays (Game Over / You Won)
* Resets all game variables
* Sends a signal to the phone to hide buttons

2. Phone Side (phone.js)
```javascript
restartBtn.onclick = () => {
    gameOverOverlay.style.display = "none";
    sendToPeer({ type: "restart" });
};

restartBtnWon.onclick = () => {
    youWonOverlay.style.display = "none";
    sendToPeer({ type: "restart" });
};
```

* Hides phone overlays
* Sends restart signal back to desktop

3. Player Trail Effect

*To enhance the visual experience, I added a trailing effect behind the player.*
```javascript
let trail = [];
const maxTrail = 80;

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
```

* Trail fades over time (t.alpha -= 0.02)
* Uses canvas to draw smooth glowing circles behind the player

4. Polishing the UI
> Coin Counter
<div id="coinCounter">
    <span id="coinNumber">0</span>
    <img src="images/coin.png">
</div>

```css
#coinCounter {
    position: fixed;
    top: 20px;
    right: 20px;
    display: none;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    color: white;
}
```
* Dynamically updates as the player collects coins

5. Shelters Buttons
```javascript
getSafeBtn.onclick = () => sendToPeer({ type: "getSafe" });
getOutBtn.onclick = () => sendToPeer({ type: "getOut" });
```
```css
#getSafeBtn, #getOutBtn {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 15px 30px;
    font-size: 24px;
    cursor: pointer;
    background: cyan;
    border: none;
    border-radius: 10px;
    color: black;
    display: none;
}
```

* Buttons appear when player is near shelter
* Buttons hide automatically when leaving or entering

6. Final Adjustments
> Canvas Resize
```javascript
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    positionShelters();
});
```

* Ensures all elements stay within the screen
* Shelters reposition dynamically on window resize

7. Ghost Speed Adjustment
```javascript
ghostSpeed = 3; 
const speedIncrease = 0.7;
```
* Difficulty increases as player collects coins
* Adds progressive challenge

8. Hiding / Showing Game Elements
```javascript
canvas.style.display = scared.style.display = ghost.style.display =
    shelter1.style.display = shelter2.style.display = "block";
document.getElementById("coinCounter").style.display = "flex";
```
* Manages visibility of all game elements
* Smooth transition between QR screen and game

## End of Week 4 Result (Polished Game)
*Fully functional restart system*
*Trail effect behind player*
*Coin counter dynamically updates*
*Shelters interact properly with ghost*
*Ghost speeds up with difficulty*
*Responsive to window resizing*
*Phone ↔ desktop interaction fully polished*

The game is now ready for final submission as a fully playable WebRTC-controlled experience.

>AI Usage & Reflection – Week 4
*How AI helped*
- Suggested trail effect implementation
- Provided best practices for responsive canvas resizing
- Helped structure restart signal logic and shelter button visibility

*What I did myself*
- Integrated all AI suggestions into the existing game logic
- Linked the desktop and phone UI buttons
- Tested gameplay to balance ghost speed and coin difficulty
- Fine-tuned CSS for overlays, shelters, and counters

*Reflection*
>AI supported me with examples and optimizations, but the final game logic, interactions, and experience design are fully adapted and customized by me.
