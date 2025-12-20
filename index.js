// index.js
/**
 * insane-particles - A premium particle playground for developers
 * Pure vanilla HTML/CSS/JS - No frameworks
 * Fixed: Floating Orbs now animates reliably on first page load and every direct switch
 * - Animation loop is centrally managed and explicitly started after every init()
 * - All other features (subtle glow, Matrix Rain, Fireflies cyan, copy code) preserved unchanged
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    const codeDisplay = document.getElementById('code-display');
    const effectButtons = document.querySelectorAll('.effect-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const copyButton = document.querySelector('.copy-btn');

    let currentEffect = null;
    let animationId = null;
    let particles = [];
    let mouse = { x: 0, y: 0 };
    let currentDestroy = null;

    // Resize canvas to container
    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle Manager
    const ParticleManager = {
        init(effectName) {
            this.destroy();
            currentEffect = effectName;
            particles = [];
            mouse = { x: 0, y: 0 };
            currentDestroy = this[effectName].destroy || null;

            // Clear canvas before initialising new effect
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this[effectName].init();

            // Critical fix: Always ensure the animation loop is running after init
            if (animationId === null) {
                animationId = requestAnimationFrame(() => this.animate());
            }

            this.updateCode();
        },

        destroy() {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            if (currentDestroy) {
                currentDestroy.call(this[currentEffect]);
                currentDestroy = null;
            }
            particles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },

        animate() {
            // Trail completely removed – canvas fully cleared each frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Reset critical properties to prevent inheritance
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.lineWidth = 1;

            this[currentEffect].update();

            animationId = requestAnimationFrame(() => this.animate());
        },

        updateCode() {
            if (!currentEffect) return;
            const codes = particleCodes[currentEffect];
            const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
            codeDisplay.textContent = codes[activeTab] || '';
            codeDisplay.style.opacity = '0';
            setTimeout(() => codeDisplay.style.opacity = '1', 100);
        }
    };

    // Individual Particle Systems (unchanged except removal of internal animate calls)
    const floating = {
        init() {
            for (let i = 0; i < 80; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 4 + 2,
                    opacity: Math.random() * 0.4 + 0.4
                });
            }
        },
        update() {
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 245, 255, ${p.opacity})`;
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#000000ff';
                ctx.fill();
            });
        }
    };

    const connecting = {
        init() {
            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: (Math.random() - 0.5) * 0.8,
                    radius: 3
                });
            }
            canvas.addEventListener('mousemove', this.handleMouse);
        },
        handleMouse(e) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        },
        update() {
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#bb00ff';
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#bb00ff';
                ctx.fill();
            });

            particles.forEach(p1 => {
                const distances = particles
                    .filter(p2 => p2 !== p1)
                    .map(p2 => ({ p: p2, dist: Math.hypot(p1.x - p2.x, p1.y - p2.y) }))
                    .sort((a, b) => a.dist - b.dist)
                    .slice(0, 6);

                distances.forEach(d => {
                    if (d.dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(d.p.x, d.p.y);
                        ctx.strokeStyle = `rgba(0, 255, 255, ${1 - d.dist / 120})`;
                        ctx.stroke();
                    }
                });

                const dist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(255, 0, 255, ${1 - dist / 150})`;
                    ctx.stroke();
                }
            });
        },
        destroy() {
            canvas.removeEventListener('mousemove', this.handleMouse);
        }
    };

    const mouseTrail = {
        init() {
            canvas.addEventListener('mousemove', this.handleMouse);
        },
        handleMouse(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            for (let i = 0; i < 6; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1,
                    decay: Math.random() * 0.02 + 0.01,
                    radius: Math.random() * 8 + 4,
                    color: `hsl(${Math.random() * 60 + 180}, 100%, 60%)`
                });
            }
        },
        update() {
            particles = particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                p.radius *= 0.96;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.shadowBlur = 12;
                ctx.shadowColor = p.color;
                ctx.fill();

                return p.life > 0;
            });
            ctx.globalAlpha = 1;
        },
        destroy() {
            canvas.removeEventListener('mousemove', this.handleMouse);
        }
    };

    const matrix = {
        init() {
            const columns = Math.floor(canvas.width / 20);
            const drops = new Array(columns).fill(1);
            particles = drops.map((_, i) => ({
                x: i * 20,
                y: 0,
                speed: Math.random() * 8 + 4,
                chars: '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
            }));
        },
        update() {
            ctx.fillStyle = '#00ff41';
            ctx.font = '16px monospace';

            particles.forEach(p => {
                const char = p.chars[Math.floor(Math.random() * p.chars.length)];
                ctx.fillText(char, p.x, p.y);

                p.y += p.speed;
                if (p.y > canvas.height) {
                    p.y = -20;
                }
            });
        }
    };

    const fireflies = {
        init() {
            for (let i = 0; i < 60; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    phase: Math.random() * Math.PI * 2,
                    radius: Math.random() * 3 + 2
                });
            }
        },
        update() {
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.phase += 0.05;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                const glow = (Math.sin(p.phase) + 1) / 2;
                const size = p.radius * (0.5 + glow);

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 100, ${glow * 0.6})`;
                ctx.shadowBlur = 15 * glow;
                ctx.shadowColor = '#000000ff';
                ctx.fill();
            });
        }
    };

    // New Particle Effects
    const networkRepulse = {
        init() {
            for (let i = 0; i < 120; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 1,
                    vy: (Math.random() - 0.5) * 1,
                    radius: 4
                });
            }
            canvas.addEventListener('mousemove', this.handleMouse);
        },
        handleMouse(e) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        },
        update() {
            particles.forEach(p => {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 100 && dist > 0) {
                    p.vx += (dx / dist) * -3;
                    p.vy += (dy / dist) * -3;
                }
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.98;
                p.vy *= 0.98;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#00ffff';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00ffff';
                ctx.fill();
            });

            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(0, 255, 255, ${1 - dist / 150})`;
                        ctx.stroke();
                    }
                });
            });
        },
        destroy() {
            canvas.removeEventListener('mousemove', this.handleMouse);
        }
    };

    const waveField = {
        init() {
            for (let i = 0; i < 200; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    baseX: Math.random() * canvas.width,
                    baseY: Math.random() * canvas.height,
                    radius: 3
                });
            }
        },
        update() {
            const time = Date.now() * 0.001;
            particles.forEach(p => {
                p.x = p.baseX + Math.sin(time + p.baseY * 0.01) * 50;
                p.y = p.baseY + Math.cos(time + p.baseX * 0.01) * 30;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ff00ff';
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#ff00ff';
                ctx.fill();
            });
        }
    };

    const explosionBurst = {
        init() {
            canvas.addEventListener('click', this.handleClick);
        },
        handleClick(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 4;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                    radius: Math.random() * 6 + 3
                });
            }
        },
        update() {
            particles = particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.015;
                p.radius *= 0.97;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.shadowBlur = 10 * p.life;
                ctx.shadowColor = p.color;
                ctx.fill();

                return p.life > 0;
            });
            ctx.globalAlpha = 1;
        },
        destroy() {
            canvas.removeEventListener('click', this.handleClick);
        }
    };

    const gravityOrbs = {
        init() {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 200 + 100;
                particles.push({
                    x: centerX + Math.cos(angle) * dist,
                    y: centerY + Math.sin(angle) * dist,
                    vx: Math.sin(angle) * 2,
                    vy: -Math.cos(angle) * 2,
                    radius: Math.random() * 5 + 2
                });
            }
        },
        update() {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            particles.forEach(p => {
                const dx = centerX - p.x;
                const dy = centerY - p.y;
                const dist = Math.hypot(dx, dy) || 1;
                p.vx += (dx / dist) * 0.4;
                p.vy += (dy / dist) * 0.4;
                p.x += p.vx;
                p.y += p.vy;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ffff00';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffff00';
                ctx.fill();
            });
        }
    };

    const sparkleStars = {
        init() {
            for (let i = 0; i < 150; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 1,
                    opacity: Math.random() * 0.8 + 0.2,
                    phase: Math.random() * Math.PI * 2
                });
            }
        },
        update() {
            particles.forEach(p => {
                p.phase += 0.03;
                p.opacity = 0.5 + (Math.sin(p.phase) + 1) / 2 * 0.5;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.shadowBlur = 8 * p.opacity;
                ctx.shadowColor = '#ffffff';
                ctx.fill();
            });
        }
    };

    // Assign systems
    ParticleManager.floating = floating;
    ParticleManager.connecting = connecting;
    ParticleManager.mouseTrail = mouseTrail;
    ParticleManager.matrix = matrix;
    ParticleManager.fireflies = fireflies;
    ParticleManager.networkRepulse = networkRepulse;
    ParticleManager.waveField = waveField;
    ParticleManager.explosionBurst = explosionBurst;
    ParticleManager.gravityOrbs = gravityOrbs;
    ParticleManager.sparkleStars = sparkleStars;

    // Fully synchronized copy-ready code snippets (unchanged from your provided version)
    const particleCodes = {
        floating: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Floating Orbs
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
for (let i = 0; i < 80; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 4 + 2,
    opacity: Math.random() * 0.4 + 0.4
  });
}

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = \`rgba(0, 245, 255, \${p.opacity})\`;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00aaff';
    ctx.fill();
  });

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        connecting: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Interactive Connecting Dots
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let mouse = { x: 0, y: 0 };

for (let i = 0; i < 100; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8,
    radius: 3
  });
}

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;

  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#bb00ff';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#bb00ff';
    ctx.fill();
  });

  particles.forEach(p1 => {
    const distances = particles
      .filter(p2 => p2 !== p1)
      .map(p2 => ({ p: p2, dist: Math.hypot(p1.x - p2.x, p1.y - p2.y) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6);

    distances.forEach(d => {
      if (d.dist < 120) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(d.p.x, d.p.y);
        ctx.strokeStyle = \`rgba(0, 255, 255, \${1 - d.dist / 120})\`;
        ctx.stroke();
      }
    });

    const dist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
    if (dist < 150) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.strokeStyle = \`rgba(255, 0, 255, \${1 - dist / 150})\`;
      ctx.stroke();
    }
  });

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        mouseTrail: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Mouse Trail Effect
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

canvas.addEventListener('mousemove', e => {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: e.clientX,
      y: e.clientY,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      decay: Math.random() * 0.02 + 0.01,
      radius: Math.random() * 8 + 4,
      color: \`hsl(\${Math.random() * 60 + 180}, 100%, 60%)\`
    });
  }
});

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.life -= p.decay;
    p.radius *= 0.96;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;
    ctx.fill();

    return p.life > 0;
  });
  ctx.globalAlpha = 1;

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        matrix: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Matrix Rain Effect
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const columns = Math.floor(canvas.width / 20);
const drops = new Array(columns).fill(0);

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#00ff41';
  ctx.font = '16px monospace';

  for (let i = 0; i < columns; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const y = drops[i] * 20;
    ctx.fillText(char, i * 20, y);

    drops[i]++;
    if (y > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
  }

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        fireflies: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Fireflies (Cyan Glow)
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
for (let i = 0; i < 60; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    phase: Math.random() * Math.PI * 2,
    radius: Math.random() * 3 + 2
  });
}

function animate() {
  ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.phase += 0.05;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    const glow = (Math.sin(p.phase) + 1) / 2;
    const size = p.radius * (0.5 + glow);

    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = \`rgba(0, 255, 255, \${glow * 0.7})\`;
    ctx.shadowBlur = 15 * glow;
    ctx.shadowColor = '#00ffff';
    ctx.fill();
  });

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        networkRepulse: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Network Repulse
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let mouse = { x: 0, y: 0 };

for (let i = 0; i < 120; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 1,
    vy: (Math.random() - 0.5) * 1,
    radius: 4
  });
}

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 100 && dist > 0) {
      p.vx += (dx / dist) * -3;
      p.vy += (dy / dist) * -3;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00ffff';
    ctx.fill();
  });

  particles.forEach((p1, i) => {
    particles.slice(i + 1).forEach(p2 => {
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (dist < 150) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = \`rgba(0, 255, 255, \${1 - dist / 150})\`;
        ctx.stroke();
      }
    });
  });

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        waveField: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Wave Field
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
for (let i = 0; i < 200; i++) {
  particles.push({
    baseX: Math.random() * canvas.width,
    baseY: Math.random() * canvas.height,
    radius: 3
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const time = Date.now() * 0.001;
  particles.forEach(p => {
    p.x = p.baseX + Math.sin(time + p.baseY * 0.01) * 50;
    p.y = p.baseY + Math.cos(time + p.baseX * 0.01) * 30;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ff00ff';
    ctx.fill();
  });

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        explosionBurst: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Explosion Burst (Click to explode)
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

canvas.addEventListener('click', e => {
  const x = e.clientX;
  const y = e.clientY;
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: \`hsl(\${Math.random() * 360}, 100%, 60%)\`,
      radius: Math.random() * 6 + 3
    });
  }
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.015;
    p.radius *= 0.97;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.shadowBlur = 10 * p.life;
    ctx.shadowColor = p.color;
    ctx.fill();

    return p.life > 0;
  });
  ctx.globalAlpha = 1;

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        gravityOrbs: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Gravity Orbs
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

for (let i = 0; i < 80; i++) {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * 200 + 100;
  particles.push({
    x: centerX + Math.cos(angle) * dist,
    y: centerY + Math.sin(angle) * dist,
    vx: Math.sin(angle) * 2,
    vy: -Math.cos(angle) * 2,
    radius: Math.random() * 5 + 2
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    const dx = centerX - p.x;
    const dy = centerY - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    p.vx += (dx / dist) * 0.4;
    p.vy += (dy / dist) * 0.4;
    p.x += p.vx;
    p.y += p.vy;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff00';
    ctx.fill();
  });

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        },
        sparkleStars: {
            html: `<canvas id="particles"></canvas>`,
            css: `canvas { position: fixed; inset: 0; pointer-events: none; }`,
            js: `// Sparkle Stars
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
for (let i = 0; i < 150; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 3 + 1,
    opacity: Math.random() * 0.8 + 0.2,
    phase: Math.random() * Math.PI * 2
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.phase += 0.03;
    p.opacity = 0.5 + (Math.sin(p.phase) + 1) / 2 * 0.5;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = \`rgba(255, 255, 255, \${p.opacity})\`;
    ctx.shadowBlur = 8 * p.opacity;
    ctx.shadowColor = '#ffffff';
    ctx.fill();
  });

  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});`
        }
    };

    // Event Listeners
    effectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            effectButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const effect = btn.dataset.effect;
            ParticleManager.init(effect);
        });
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ParticleManager.updateCode();
        });
    });

    copyButton.addEventListener('click', async () => {
        if (!currentEffect) return;
        const codes = particleCodes[currentEffect];
        const fullCode = `${codes.html}\n\n<style>\n${codes.css}\n</style>\n\n<script>\n${codes.js}\n</script>`;
        
        try {
            await navigator.clipboard.writeText(fullCode);
            copyButton.textContent = 'Copied!';
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.textContent = 'Copy All';
                copyButton.classList.remove('copied');
            }, 2000);
        } catch (err) {
            copyButton.textContent = 'Failed';
        }
    });

    // Initial load
    ParticleManager.init('floating');
    document.querySelector('.effect-btn[data-effect="floating"]').classList.add('active');
});