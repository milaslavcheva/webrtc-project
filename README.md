# Remote Cursor Ghost Project

## Project Description

The goal of this project is to create a ghost cursor that follows the user's mouse movement and leaves a temporary trail behind it. The trail fades over time to create a magical visual effect. The project is built using HTML, CSS, JavaScript, and Node.js.

---

# Week 1

## What I did

During the first week I mainly focused on setting up the project and creating the basic ghost cursor movement.

### Project setup

First I created the main project structure:

* `server.js`
* `package.json`
* `README.md`
* `public/` folder

Inside the `public` folder I created:

* `index.html`
* `desktop.js`
* `phone.js`

The `public` folder contains the files that are sent to the browser.

### Installing dependencies

I installed the required dependencies using npm:

```bash id="y5fj9g"
npm install express socket.io simple-peer
```

This installed the following libraries:

* **express** – used to create a simple web server
* **socket.io** – allows communication between devices
* **simple-peer** – used later for peer-to-peer connections

This command also generated the `node_modules` folder and the `package-lock.json` file.

### Creating the basic HTML page

I created the main HTML structure in `index.html`.

```html id="5h17i8"
<canvas id="trailCanvas"></canvas>
<img id="ghost" src="ghost.png" alt="Ghost">
<script src="/desktop.js"></script>
```

Explanation:

* The **canvas** element is used to draw the ghost trail.
* The **image** element represents the ghost cursor.
* The JavaScript file controls the movement and trail effects.

### Styling the page

I added CSS to control the layout and positioning of the ghost and canvas.

```css id="faj3q6"
body {
    margin: 0;
    overflow: hidden;
    background: black;
}

#ghost {
    position: absolute;
    width: 50px;
    height: 50px;
    pointer-events: none;
}

#trailCanvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
}
```

Explanation:

* `margin: 0` removes default browser spacing.
* `overflow: hidden` prevents scrollbars when the ghost moves.
* `background: black` creates the dark background.
* `position: absolute` allows the ghost to move anywhere on the screen.
* `pointer-events: none` ensures the ghost does not block mouse input.

### Implementing ghost movement

In `desktop.js` I implemented basic cursor tracking.

```javascript id="19z80q"
const ghost = document.getElementById('ghost');
```

This selects the ghost element from the HTML so it can be moved using JavaScript.

Then I added a mouse movement listener:

```javascript id="y0b41g"
document.addEventListener('mousemove', (e) => {
    ghost.style.transform = `translate(${e.clientX - 25}px, ${e.clientY - 25}px)`;
});
```

Explanation:

* `mousemove` listens for mouse movement.
* `e.clientX` and `e.clientY` give the cursor position.
* The ghost image is moved using a CSS transform.
* `-25` centers the ghost image on the cursor.

After implementing this, I tested the page and confirmed that the ghost moves correctly on the screen.

### Results of Week 1

At the end of week 1:

* Installed dependencies: `express`, `socket.io`, `simple-peer`
* Made a basic ghost appear on the desktop when moving the mouse
* Tested that the ghost moves correctly on screen

---

## AI Usage

AI was used mainly as a support tool during development.

I used AI to:

* understand how to structure the project properly
* get help writing the basic cursor movement code
* learn how JavaScript can track mouse movement
* get suggestions for implementing the ghost trail effect

I also modified the AI-generated code myself:

* adjusted trail length and speed
* changed the glow effect to make it look more magical
* made sure the ghost stays centered on the cursor

AI helped with suggestions, but I still had to test and adjust the code manually.

---

## Plan for Next Week

For the next stage of the project I plan to:

* improve the trail effect so it looks smoother and fades faster
* work on the phone version so another device can see the ghost
* test interaction between multiple devices

---

# Week 2

## What I did

During the second week I focused on improving the visual effect of the ghost by implementing a fading trail system.

### Canvas setup

First I selected the canvas element and the drawing context.

```javascript id="3mlc3a"
const canvas = document.getElementById('trailCanvas');
const ctx = canvas.getContext('2d');
```

Explanation:

* The canvas element is used for drawing graphics.
* `getContext('2d')` provides the drawing tools for the canvas.

### Canvas size

```javascript id="v9hcld"
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
```

This makes the canvas the same size as the browser window so the trail can appear anywhere on the screen.

I also added a resize listener so the canvas updates when the window size changes.

```javascript id="g1ep0l"
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
```

### Trail data structure

To store the previous cursor positions I created an array.

```javascript id="g4wclc"
let trail = [];
const maxTrail = 80;
const segmentLength = 1;
const fadeSpeed = 0.05;
```

Explanation:

* `trail` stores previous cursor positions
* `maxTrail` limits how long the trail can be
* `segmentLength` controls how often new trail points are added
* `fadeSpeed` determines how fast the trail disappears

### Adding trail points

```javascript id="og5y63"
const last = trail[trail.length - 1];

if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) > segmentLength) {
    trail.push({ x: e.clientX, y: e.clientY, alpha: 1 });
}
```

Explanation:

This checks the distance between the current cursor position and the last trail point.

If the cursor moved far enough, a new trail point is added.

Each point contains:

* `x` coordinate
* `y` coordinate
* `alpha` value (opacity)

### Limiting the trail length

```javascript id="9v1h1o"
if (trail.length > maxTrail) {
    trail.shift();
}
```

This removes the oldest trail point when the maximum trail length is reached.

### Drawing the trail

The trail is drawn inside a draw function that runs continuously.

```javascript id="u7qk5o"
ctx.clearRect(0, 0, canvas.width, canvas.height);
```

This clears the canvas each frame before redrawing the trail.

Each trail point is drawn as a glowing circle:

```javascript id="v1f65n"
ctx.beginPath();
ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
ctx.fillStyle = `rgba(0, 255, 255, ${t.alpha})`;
ctx.shadowColor = 'cyan';
ctx.shadowBlur = 20;
ctx.fill();
```

This creates a glowing cyan trail behind the ghost.

### Fading the trail

To create the fading effect I gradually decrease the opacity.

```javascript id="gbr0m1"
t.alpha -= 0.02;

if (t.alpha <= 0) {
    trail.splice(i, 1);
}
```

When the opacity reaches zero, the trail point is removed.

### Continuous animation

```javascript id="qnjhzz"
requestAnimationFrame(draw);
```

This repeatedly calls the draw function so the animation runs smoothly.

### Testing

I tested the trail effect several times on the desktop to make sure:

* the ghost moves correctly
* the trail appears smoothly
* the trail fades naturally

### Results of Week 2

* Implemented smoother magical trails using fading circles
* Adjusted trail fade speed so it doesn’t feel like drawing on the screen
* Tested multiple visual variations of the trail
* Started thinking about connecting the ghost between multiple devices

---

## AI Usage

AI helped during this stage mainly with:

* rewriting the trail system
* suggesting smoother visual effects
* explaining how fading animations work
* debugging issues where the trail did not disappear correctly

I modified several parts of the code:

* changed how trails are drawn (circle size and spacing)
* adjusted fade timing and trail length
* changed color and glow intensity to create a more magical effect

---

## Plan for Next Week

Next week I plan to:

* complete the phone-side ghost implementation
* test live communication between devices
* allow multiple ghosts to appear from different devices
* potentially add additional visual effects to the trail
