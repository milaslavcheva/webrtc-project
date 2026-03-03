const canvas = document.getElementById('trailCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ghost = document.getElementById('ghost');
let trail = [];
const maxTrail = 80; // longer trail
const segmentLength = 1; // space between trail points
const fadeSpeed = 0.05; // faster fade

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

document.addEventListener('mousemove', (e) => {
    ghost.style.transform = `translate(${e.clientX - 25}px, ${e.clientY - 25}px)`;

    // Only add a new point if far enough from last one
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) > segmentLength) {
        trail.push({ x: e.clientX, y: e.clientY, alpha: 1 });
    }

    if (trail.length > maxTrail) {
        trail.shift();
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each segment with fading alpha
    for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        ctx.beginPath();
        ctx.arc(t.x, t.y, 12, 0, Math.PI * 2); // soft glowing dot
        ctx.fillStyle = `rgba(0, 255, 255, ${t.alpha})`;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 20;
        ctx.fill();

        // Gradually fade
        t.alpha -= 0.02;
        if (t.alpha <= 0) {
            trail.splice(i, 1);
            i--;
        }
    }

    requestAnimationFrame(draw);
}

draw();