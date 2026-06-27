const canvas = document.createElement('canvas');
canvas.id = 'plexus-canvas';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);

const ctx = canvas.getContext('2d');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionScale = prefersReducedMotion ? 0.45 : 1;
const pointer = { x: 0, y: 0, active: false };

let width = 0;
let height = 0;
let dpr = 1;
let particles = [];
let lastFrame = performance.now();

function createParticle() {
  const depth = 0.55 + Math.random() * 0.9;
  const angle = Math.random() * Math.PI * 2;
  const speed = (0.62 + Math.random() * 0.9) * depth;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    drawX: 0,
    drawY: 0,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: (0.8 + Math.random() * 1.8) * depth,
    depth,
    drift: 0.45 + Math.random() * 0.9,
    phase: Math.random() * Math.PI * 2
  };
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const nextCount = Math.min(140, Math.max(72, Math.round((width * height) / 15000)));
  particles = Array.from({ length: nextCount }, createParticle);
}

function drawBackground() {
  const glow = ctx.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.48, Math.max(width, height) * 0.75);
  glow.addColorStop(0, 'rgba(60, 160, 255, 0.2)');
  glow.addColorStop(0.45, 'rgba(160, 60, 255, 0.055)');
  glow.addColorStop(1, 'rgba(7, 17, 28, 0)');

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function moveParticle(p, frameScale) {
  const adjustedFrame = frameScale * motionScale;
  const waveX = Math.cos(p.phase * 0.73) * 0.22 * p.drift;
  const waveY = Math.sin(p.phase) * 0.22 * p.drift;

  p.x += (p.vx + waveX) * adjustedFrame;
  p.y += (p.vy + waveY) * adjustedFrame;
  p.phase += 0.024 * p.depth * adjustedFrame;

  let offsetX = 0;
  let offsetY = 0;

  if (pointer.active) {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const distance = Math.hypot(dx, dy);
    const radius = 190;

    if (distance > 0 && distance < radius) {
      const influence = (1 - distance / radius) ** 2;
      const offset = influence * 22 * p.depth;
      offsetX = (dx / distance) * offset;
      offsetY = (dy / distance) * offset;
    }
  }

  if (p.x < -40) p.x = width + 40;
  if (p.x > width + 40) p.x = -40;
  if (p.y < -40) p.y = height + 40;
  if (p.y > height + 40) p.y = -40;

  p.drawX = p.x + offsetX;
  p.drawY = p.y + offsetY;
}

function getLinkedParticles(origin, startIndex, maxDistance) {
  const linked = [];

  for (let i = startIndex; i < particles.length; i += 1) {
    const candidate = particles[i];
    const dx = origin.drawX - candidate.drawX;
    const dy = origin.drawY - candidate.drawY;
    const distance = Math.hypot(dx, dy);

    if (distance < maxDistance) {
      linked.push({ particle: candidate, distance });
    }
  }

  return linked.sort((a, b) => a.distance - b.distance).slice(0, 3);
}

function drawFacets() {
  let filled = 0;
  const fillLimit = Math.min(32, Math.round(particles.length * 0.26));

  for (let i = 0; i < particles.length && filled < fillLimit; i += 1) {
    const p = particles[i];
    const linked = getLinkedParticles(p, i + 1, 118 * p.depth);

    for (let a = 0; a < linked.length && filled < fillLimit; a += 1) {
      for (let b = a + 1; b < linked.length && filled < fillLimit; b += 1) {
        const q = linked[a].particle;
        const r = linked[b].particle;
        const qrDistance = Math.hypot(q.drawX - r.drawX, q.drawY - r.drawY);
        const maxDistance = 126 * Math.min(p.depth, q.depth, r.depth);

        if (qrDistance < maxDistance) {
          const closeness = 1 - ((linked[a].distance + linked[b].distance + qrDistance) / (maxDistance * 3));
          const shimmer = 0.7 + Math.sin((p.phase + q.phase + r.phase) / 3) * 0.3;
          const alpha = Math.max(0.025, closeness * 0.14 * shimmer);
          const gradient = ctx.createLinearGradient(p.drawX, p.drawY, r.drawX, r.drawY);

          gradient.addColorStop(0, `rgba(60, 160, 255, ${alpha})`);
          gradient.addColorStop(1, `rgba(160, 60, 255, ${alpha * 0.45})`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(p.drawX, p.drawY);
          ctx.lineTo(q.drawX, q.drawY);
          ctx.lineTo(r.drawX, r.drawY);
          ctx.closePath();
          ctx.fill();
          filled += 1;
        }
      }
    }
  }
}

function drawConnections() {
  for (let i = 0; i < particles.length; i += 1) {
    const p = particles[i];

    for (let j = i + 1; j < particles.length; j += 1) {
      const q = particles[j];
      const dx = p.drawX - q.drawX;
      const dy = p.drawY - q.drawY;
      const distance = Math.hypot(dx, dy);
      const maxDistance = 132 * Math.min(p.depth, q.depth);

      if (distance < maxDistance) {
        const alpha = (1 - distance / maxDistance) * 0.46;
        const gradient = ctx.createLinearGradient(p.drawX, p.drawY, q.drawX, q.drawY);
        gradient.addColorStop(0, `rgba(60, 160, 255, ${alpha})`);
        gradient.addColorStop(1, `rgba(160, 60, 255, ${alpha * 0.42})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.7 * Math.min(p.depth, q.depth);
        ctx.beginPath();
        ctx.moveTo(p.drawX, p.drawY);
        ctx.lineTo(q.drawX, q.drawY);
        ctx.stroke();
      }
    }
  }
}

function drawParticle(p) {
  const shimmer = 0.65 + Math.sin(p.phase) * 0.35;
  const halo = ctx.createRadialGradient(p.drawX, p.drawY, 0, p.drawX, p.drawY, p.radius * 8);
  halo.addColorStop(0, `rgba(247, 248, 255, ${0.42 * shimmer})`);
  halo.addColorStop(0.28, `rgba(60, 160, 255, ${0.2 * shimmer})`);
  halo.addColorStop(1, 'rgba(60, 160, 255, 0)');

  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(p.drawX, p.drawY, p.radius * 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(247, 248, 255, ${0.82 * shimmer})`;
  ctx.beginPath();
  ctx.arc(p.drawX, p.drawY, p.radius, 0, Math.PI * 2);
  ctx.fill();
}

function animate() {
  window.requestAnimationFrame(animate);
  const now = performance.now();
  const frameScale = Math.min(2.4, (now - lastFrame) / 16.67);
  lastFrame = now;

  ctx.clearRect(0, 0, width, height);

  drawBackground();
  particles.forEach(particle => moveParticle(particle, frameScale));
  drawFacets();
  drawConnections();
  particles.forEach(drawParticle);
}

window.addEventListener('resize', resize);
window.addEventListener('pointermove', event => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener('pointerleave', () => {
  pointer.active = false;
});

resize();
animate();
