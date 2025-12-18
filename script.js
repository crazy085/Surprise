document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    const cakeContainer = document.getElementById('cake-container');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

    let fireworks = [];
    let particles = [];
    let backgroundFireworkInterval;

    // --- ENHANCED FIREWORK CLASSES ---

    class Particle {
        constructor(x, y, color, velocity, isSecondary = false) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.velocity = velocity;
            this.alpha = 1;
            // Slower decay for longer-lasting, brighter trails
            this.decay = isSecondary ? Math.random() * 0.008 + 0.005 : Math.random() * 0.015 + 0.008;
            this.gravity = 0.05;
            // Add a slight random size for texture
            this.size = isSecondary ? Math.random() * 2 + 1 : Math.random() * 3 + 1;
        }

        update() {
            this.velocity.x *= 0.99; // Air friction
            this.velocity.y *= 0.99;
            this.velocity.y += this.gravity;
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.alpha -= this.decay;
        }

        draw() {
            ctx.save();
            // --- KEY CHANGE: Add a glowing effect ---
            ctx.globalAlpha = this.alpha;
            ctx.shadowBlur = 20; // The glow
            ctx.shadowColor = this.color;
            
            ctx.beginPath();
            // Use the random size
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            
            // Add a bright white core
            if (this.alpha > 0.8) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    class Firework {
        constructor(sx, sy, tx, ty, isGrandFinale = false) {
            this.x = sx;
            this.y = sy;
            this.sx = sx;
            this.sy = sy;
            this.tx = tx;
            this.ty = ty;
            this.distanceToTarget = this.calculateDistance(sx, sy, tx, ty);
            this.distanceTraveled = 0;
            this.trail = [];
            this.trailLength = 15; // Longer trail
            this.angle = Math.atan2(ty - sy, tx - sx);
            this.speed = isGrandFinale ? 25 : 18;
            this.acceleration = 1.02;
            this.brightness = Math.random() * 50 + 50;
            this.targetRadius = 2;
            this.isGrandFinale = isGrandFinale;
        }

        calculateDistance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }

        update(index) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }
            this.speed *= this.acceleration;
            const vx = Math.cos(this.angle) * this.speed;
            const vy = Math.sin(this.angle) * this.speed;

            this.distanceTraveled = this.calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

            if (this.distanceTraveled >= this.distanceToTarget) {
                this.explode();
                fireworks.splice(index, 1);
            } else {
                this.x += vx;
                this.y += vy;
            }
        }

        explode() {
            // --- KEY CHANGE: More particles and a two-stage explosion ---
            const particleCount = this.isGrandFinale ? 150 : 80;
            const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#98FB98', '#DDA0DD', '#FFFFFF', '#87CEEB'];
            
            // Stage 1: Fast, bright, white/yellow core
            for (let i = 0; i < particleCount / 2; i++) {
                const angle = (Math.PI * 2 / (particleCount / 2)) * i;
                const velocity = {
                    x: Math.cos(angle) * (Math.random() * 8 + 4),
                    y: Math.sin(angle) * (Math.random() * 8 + 4)
                };
                // Use a bright white or yellow for the core
                const coreColor = Math.random() > 0.5 ? '#FFFFFF' : '#FFD700';
                particles.push(new Particle(this.tx, this.ty, coreColor, velocity));
            }

            // Stage 2: Slower, larger, colored outer shell
            for (let i = 0; i < particleCount / 2; i++) {
                const angle = (Math.PI * 2 / (particleCount / 2)) * i + Math.random() * 0.5;
                const velocity = {
                    x: Math.cos(angle) * (Math.random() * 6 + 2),
                    y: Math.sin(angle) * (Math.random() * 6 + 2)
                };
                const color = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(this.tx, this.ty, color, velocity, true));
            }
        }

        draw() {
            // --- KEY CHANGE: Brighter, thicker launch trail ---
            ctx.beginPath();
            ctx.moveTo(this.trail[0]?.x || this.x, this.trail[0]?.y || this.y);
            for (let i = 0; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            // Thicker line and a glow effect
            ctx.strokeStyle = `hsl(60, 100%, ${this.brightness}%)`; // Yellowish trail
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
            ctx.stroke();

            // Brighter launch head
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.targetRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFFFFF';
            ctx.fill();
        }
    }

    // --- ANIMATION & LOGIC (Unchanged) ---

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        fireworks.forEach((firework, index) => {
            firework.update(index);
            firework.draw();
        });

        particles.forEach((particle, index) => {
            if (particle.alpha <= 0) {
                particles.splice(index, 1);
            } else {
                particle.update();
                particle.draw();
            }
        });
    }

    function launchBackgroundFirework() {
        const startX = Math.random() * canvas.width;
        const startY = canvas.height;
        const endX = Math.random() * canvas.width;
        const endY = Math.random() * (canvas.height / 2);
        fireworks.push(new Firework(startX, startY, endX, endY));
    }
    
    function launchGrandFinale() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const startX = Math.random() * canvas.width;
                const startY = canvas.height;
                const endX = Math.random() * canvas.width;
                const endY = Math.random() * (canvas.height / 2) + 50;
                fireworks.push(new Firework(startX, startY, endX, endY, true));
            }, i * 200);
        }
    }

    // --- INITIALIZATION ---
    animate();
    backgroundFireworkInterval = setInterval(launchBackgroundFirework, 1500);

    cakeContainer.addEventListener('click', () => {
        clearInterval(backgroundFireworkInterval);
        
        let finaleCount = 0;
        const finaleInterval = setInterval(() => {
            launchGrandFinale();
            finaleCount++;
            if (finaleCount > 5) {
                clearInterval(finaleInterval);
                setTimeout(() => { 
                    backgroundFireworkInterval = setInterval(launchBackgroundFirework, 1500); 
                }, 3000);
            }
        }, 800);
    });
});
