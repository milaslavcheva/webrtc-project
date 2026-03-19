# Remote Cursor Ghost Project
# Project Description

This project creates a ghost cursor that follows the user's mouse movement and leaves a magical fading trail behind it. The trail is smooth and dynamic, and the project supports connecting a phone to see the ghost in real-time.

Technologies used: HTML, CSS, JavaScript, Node.js, Express, Socket.io, Simple-Peer.

# Week 1
## What I did

In Week 1, I set up the project structure, installed dependencies, and implemented the basic ghost cursor movement on the desktop.

### Project setup

Project structure:

>server.js
package.json
package-lock.json
README.md
public/
  ├─ index.html
  ├─ desktop.js
  ├─ phone.html
  ├─ phone.js
  └─ ghost.png

Installed dependencies:

* npm install express socket.io simple-peer

### Libraries installed:

+ express - simple web server

+ socket.io - real-time communication between devices

+ simple-peer - manage peer-to-peer WebRTC connections

### Desktop HTML (index.html)
<canvas id="trailCanvas"></canvas>
<img id="ghost" src="ghost.png" alt="Ghost">
<script src="/desktop.js"></script>

Explanation:

+ <canvas> – used to draw the ghost trail

+ <img> – represents the ghost cursor

+ <script> – loads the desktop JavaScript logic

### CSS for layout:

>body {
    margin: 0; /* remove default spacing */
    overflow: hidden; /* prevent scrollbars */
    background: black; /* dark background */
}

>#ghost {
    position: absolute; /* allows free movement */
    width: 50px;
    height: 50px;
    pointer-events: none; /* allows clicking through the ghost */
}

>#trailCanvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none; /* ignore mouse input */
}
### Desktop JS (desktop.js) – Week 1

- Step 1: Select ghost element

const ghost = document.getElementById('ghost');

Selects the ghost image from the HTML.

- Step 2: Move ghost with mouse

document.addEventListener('mousemove', (e) => {
    ghost.style.transform = `translate(${e.clientX - 25}px, ${e.clientY - 25}px)`;
});

Listens to mouse movement

e.clientX / e.clientY – cursor coordinates

-25 centers the 50px ghost image

Uses transform for smoother animation

### Results Week 1:

- Ghost moves correctly on desktop
- Basic structure and dependencies installed

## AI Usage:

- Suggested project structure
- Helped write initial mouse movement code
- Explained how CSS affects ghost positioning

## Plan for Week 2:

- Implement fading trail
- Improve visual effects
- Start phone connection



# Week 2
## What I did

In Week 2, I implemented the magical fading trail and started building the phone-side ghost.

### Canvas setup

```javascript
const canvas = document.getElementById('trailCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
```

### Explanation:

Get canvas and drawing context

Set canvas size to window dimensions

Update canvas size dynamically on window resize

- Trail data structure

```javascript
let trail = [];
const maxTrail = 80; // maximum points
const segmentLength = 1; // minimum distance between points
const fadeSpeed = 0.05; // fading rate
```
trail stores cursor history

maxTrail – limits trail length

segmentLength – avoids points being too close

fadeSpeed – opacity decrease per frame

+ Add trail points on mouse move
```javascript
document.addEventListener('mousemove', (e) => {
    ghost.style.transform = `translate(${e.clientX - 25}px, ${e.clientY - 25}px)`;

    const last = trail[trail.length - 1];
    if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) > segmentLength) {
        trail.push({ x: e.clientX, y: e.clientY, alpha: 1 });
    }

    if (trail.length > maxTrail) {
        trail.shift();
    }
});
```

Moves ghost (as in Week 1)

Adds new trail point if distance > segmentLength

Removes oldest point if trail.length > maxTrail

+ Draw the trail
```javascript
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        ctx.beginPath();
        ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${t.alpha})`;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 20;
        ctx.fill();

        t.alpha -= 0.02;
        if (t.alpha <= 0) {
            trail.splice(i, 1);
            i--;
        }
    }

    requestAnimationFrame(draw);
}

draw();
``` 

### Explanation:

>Clear canvas each frame

>Draw each point as glowing cyan circle

>Decrease opacity gradually (t.alpha -= 0.02)

>Remove fully faded points (t.alpha <= 0)

>Use requestAnimationFrame for smooth animation

>Phone-side ghost (phone.html + phone.js)

- HTML:

```HTML
<script src="/socket.io/socket.io.js"></script>
<body></body>
```
Loads socket.io

Body will contain ghost div

- JS:

```javascript
const socket = io();

const ghost = document.createElement('div');
ghost.classList.add('ghost');
document.body.appendChild(ghost);

socket.on('cursorMove', (data) => {
    ghost.style.left = data.x + 'px';
    ghost.style.top = data.y + 'px';
});
```
Connect to socket.io server

Create ghost div dynamically

Update ghost position from desktop cursor

- CSS:

```CSS
.ghost {
    position: absolute;
    width: 50px;
    height: 50px;
    background: cyan;
    border-radius: 50%;
    pointer-events: none;
    box-shadow: 0 0 20px cyan;
}
```
Shows glowing cyan ghost for phone

>pointer-events: none ensures it doesn’t block touch

### Results Week 2

- Implemented smooth fading trail
- Ghost moves naturally with mouse
- Phone-side ghost receives desktop cursor data
- Tested on multiple windows

## AI Usage:

- Helped rewrite trail system for smoother fading
- Suggested visual effects (glow, trail length, fade speed)
- Explained how to animate the trail and remove points

## Plan for Week 3:

- Add QR code so users can join the ghost game via phone
- Connect phone to desktop in real-time to see the cursor
- Start implementing multi-device interactions

# Week 3

## What I did

* In Week 3, I focused on replacing the ghost cursor with a new image (scared_person.png), making it follow the cursor with a controlled speed, adding random movement when idle, and re-adding the QR code for phone connections.

### Replacing the ghost cursor with scared_person.png

> Step 1: Update HTML

<img id="scaredPerson" src="scared_person.png" alt="Scared Person">

- Replaces the original ghost image with scared_person.png.
- Allows the new character to follow the cursor while keeping the trail effect.

> Step 2: Update JS to select new cursor

const scaredPerson = document.getElementById('scaredPerson');

This selects the new image in JavaScript for movement.

Making the cursor follow the mouse with controlled speed

> Step 1: Create a position object

```javascript
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let current = { x: mouse.x, y: mouse.y };
const speed = 0.15; // controls how fast the scared person follows
```
- mouse stores the latest cursor position.
- current stores the current position of the scared person.
- speed determines movement smoothness (not too fast, not too slow).

> Step 2: Update mouse on movement

```javascript
document.addEventListener('mousemove', e => {
    mouse.x = e.clientX - 25;
    mouse.y = e.clientY - 25;
});
```
Subtract 25 to center the 50px image on the cursor.

> Step 3: Animate movement

```javascript
function moveCursor() {
    current.x += (mouse.x - current.x) * speed;
    current.y += (mouse.y - current.y) * speed;
    scaredPerson.style.transform = `translate(${current.x}px, ${current.y}px)`;
    requestAnimationFrame(moveCursor);
}

moveCursor();
```
- Gradually moves the scared person toward the mouse.
- Creates a smooth following effect using interpolation.
- Adding random movement when idle

> Step 1: Detect idle movement
```javascript
let idleTimer = 0;

document.addEventListener('mousemove', () => idleTimer = 0);

function randomMove() {
    idleTimer++;
    if (idleTimer > 200) { // after ~200 frames of inactivity
        mouse.x = Math.random() * window.innerWidth;
        mouse.y = Math.random() * window.innerHeight;
        idleTimer = 0;
    }
    requestAnimationFrame(randomMove);
}

randomMove();
```

- Moves the scared person randomly if the user does not move the mouse.
- Makes the animation more dynamic.
- Trail effect with scared person

> Step 1: Keep the existing trail logic from Week 2

```javascript
let trail = [];
const maxTrail = 80;
const segmentLength = 1;
const fadeSpeed = 0.05;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        ctx.beginPath();
        ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 255, ${t.alpha})`;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 20;
        ctx.fill();
        t.alpha -= 0.02;
        if (t.alpha <= 0) {
            trail.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(draw);
}

draw();
```
- The trail now follows scaredPerson instead of the old ghost.
- Gives a magical glowing effect as the character moves.

> Step 2: Push trail points

```javascript
function updateTrail() {
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(current.x - last.x, current.y - last.y) > segmentLength) {
        trail.push({ x: current.x + 25, y: current.y + 25, alpha: 1 });
    }
    if (trail.length > maxTrail) trail.shift();
    requestAnimationFrame(updateTrail);
}

updateTrail();
```

- Ensures the trail is added at the cursor center.
- Smooth fading follows the scared person’s path.
- Re-adding QR code

> Step 1: HTML

<div id="qrContainer">
    <h3>Scan to Join</h3>
    <img id="qrCode" alt="QR Code">
</div>

Fixed container with QR code for phone connection.

> Step 2: JS to generate QR

const qrImg = document.getElementById('qrCode');
const phoneUrl = "http://YOUR_COMPUTER_IP:3000/phone.html";

QRCode.toDataURL(phoneUrl)
    .then(url => { qrImg.src = url; })
    .catch(err => console.error(err));

+ Replace YOUR_COMPUTER_IP with your local IP address.
+ Generates the QR code dynamically so phones can join.

### Results Week 3

- Replaced ghost with scared_person.png.
- Cursor follows mouse smoothly at controlled speed.
- Random movement implemented when idle.
- Trail effect works with scared person.
- QR code added for phone connection.

## AI Usage:

- Suggested how to interpolate cursor position for smooth movement.
- Helped implement idle random movement.
- Explained how to integrate trail with new image.
- Guided adding QR code back correctly.

## Plan for Week 4:

- Test phone connection with QR code.
- Improve trail visuals and speed tuning.
- Add more interactive effects when multiple devices are connected.



