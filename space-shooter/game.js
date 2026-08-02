/**
 * Neon Nebula - Space Shooter Game Engine
 */

// --- Web Audio API Synth Sound Engine ---
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.unlocked = false;
        this.musicInterval = null;
        this.musicStep = 0;
    }

    init() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) {
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.5;
                this.master.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    unlock() {
        this.init();
        if (this.ctx && !this.unlocked) {
            const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.master);
            source.start(0);
            this.unlocked = true;
        }
    }

    tone(freq, type = 'sine', duration = 0.1, startVolume = 0.1, sweepTo = null) {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (sweepTo) {
            osc.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
        }

        gainNode.gain.setValueAtTime(startVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gainNode);
        gainNode.connect(this.master);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    }

    noise(duration = 0.2, volume = 0.1, highpass = false) {
        this.init();
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        let finalNode = gainNode;

        if (highpass) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
            noiseNode.connect(filter);
            filter.connect(gainNode);
        } else {
            noiseNode.connect(gainNode);
        }

        gainNode.connect(this.master);
        noiseNode.start();
        noiseNode.stop(this.ctx.currentTime + duration + 0.05);
    }

    playLaser() {
        this.tone(880, 'triangle', 0.12, 0.1, 110);
    }

    playEnemyLaser() {
        this.tone(330, 'sawtooth', 0.15, 0.05, 55);
    }

    playExplosion(isLarge = false) {
        if (isLarge) {
            this.noise(0.6, 0.35);
            this.tone(100, 'sawtooth', 0.5, 0.3, 20);
        } else {
            this.noise(0.25, 0.15);
            this.tone(180, 'sine', 0.25, 0.2, 40);
        }
    }

    playPowerup() {
        const now = this.ctx ? this.ctx.currentTime : 0;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            setTimeout(() => {
                this.tone(freq, 'sine', 0.15, 0.15);
            }, idx * 60);
        });
    }

    playHit() {
        this.tone(150, 'sawtooth', 0.1, 0.2, 80);
    }

    playWarning() {
        this.tone(120, 'square', 0.3, 0.2, 100);
        setTimeout(() => this.tone(120, 'square', 0.3, 0.2, 100), 400);
    }

    // Modern Sci-Fi background loop synthesizer
    startMusic() {
        this.stopMusic();
        this.init();
        if (!this.ctx) return;
        
        const melody = [
            220, 220, 261, 261, 293, 293, 329, 392,
            220, 220, 261, 261, 392, 392, 329, 293
        ];
        const bass = [
            55, 55, 55, 55, 65, 65, 65, 65,
            73, 73, 73, 73, 55, 55, 82, 82
        ];
        
        this.musicStep = 0;
        this.musicInterval = setInterval(() => {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            
            // Bass line every beat
            const bFreq = bass[this.musicStep % bass.length];
            this.tone(bFreq, 'sawtooth', 0.25, 0.08, bFreq * 0.9);

            // Lead synth every second beat
            if (this.musicStep % 2 === 0) {
                const mFreq = melody[Math.floor(this.musicStep / 2) % melody.length];
                this.tone(mFreq, 'triangle', 0.4, 0.04, mFreq * 1.05);
            }

            // High hat noise on alternate beats
            if (this.musicStep % 4 === 2) {
                this.noise(0.04, 0.015, true);
            }

            this.musicStep++;
        }, 220); // 136 BPM
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

const sound = new SoundSynth();

// --- Vector Math and Configs ---
const CONFIG = {
    PLAYER_SPEED: 6,
    PLAYER_HP: 100,
    PLAYER_SHIELD: 100,
    SHIELD_REGEN: 0.08,
    STAR_COUNT: 120,
    POWERUP_DURATION: 7000 // 7 seconds
};

// --- Particles System ---
class Particle {
    constructor(x, y, vx, vy, color, size, life, decay, isExhaust = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life; // 1.0 to 0.0
        this.decay = decay;
        this.isExhaust = isExhaust;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        if (this.isExhaust) {
            this.size *= 0.96;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleEngine {
    constructor() {
        this.list = [];
    }

    add(p) {
        this.list.push(p);
    }

    burst(x, y, color, count = 10, speedPower = 1) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (0.5 + Math.random() * 2.5) * speedPower;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 1.5 + Math.random() * 2.5;
            const decay = 0.015 + Math.random() * 0.02;
            this.add(new Particle(x, y, vx, vy, color, size, 1.0, decay));
        }
    }

    exhaust(x, y, color) {
        // Tail exhaust trail
        const vx = (Math.random() - 0.5) * 0.8;
        const vy = 1.5 + Math.random() * 2.0; // moves downward
        const size = 3.0 + Math.random() * 2.0;
        const decay = 0.03 + Math.random() * 0.04;
        this.add(new Particle(x, y, vx, vy, color, size, 1.0, decay, true));
    }

    update() {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.update();
            if (p.life <= 0 || p.size <= 0.1) {
                this.list.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.list) {
            p.draw(ctx);
        }
    }
}

const particles = new ParticleEngine();

// --- Starfield background ---
class Star {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.reset(true);
    }

    reset(randomY = false) {
        this.x = Math.random() * this.w;
        this.y = randomY ? Math.random() * this.h : -10;
        this.speed = 0.5 + Math.random() * 2.5;
        this.size = 0.5 + this.speed * 0.5; // faster stars are larger/closer
        this.color = this.speed > 2.0 ? '#00f0ff' : (this.speed > 1.2 ? '#ffffff' : '#444477');
    }

    update() {
        this.y += this.speed;
        if (this.y > this.h) {
            this.reset(false);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// --- Player Ship class ---
class Player {
    constructor(canvasWidth, canvasHeight, type = 0) {
        this.cw = canvasWidth;
        this.ch = canvasHeight;
        this.type = type; // 0: Red (balanced), 1: Blue (tank), 2: Green (agile)
        this.reset();
    }

    reset() {
        this.r = 18;
        this.x = this.cw / 2;
        this.y = this.ch - 80;
        this.hp = CONFIG.PLAYER_HP;
        this.shield = CONFIG.PLAYER_SHIELD;
        this.score = 0;
        
        // Ship specs by type
        if (this.type === 0) {
            this.maxSpeed = CONFIG.PLAYER_SPEED;
            this.color = '#ff3366'; // neon red
            this.baseFireRate = 220; // ms
        } else if (this.type === 1) {
            this.maxSpeed = CONFIG.PLAYER_SPEED * 0.8;
            this.color = '#00f0ff'; // neon blue
            this.baseFireRate = 320;
            this.shield = CONFIG.PLAYER_SHIELD * 1.5;
        } else {
            this.maxSpeed = CONFIG.PLAYER_SPEED * 1.25;
            this.color = '#39ff14'; // neon green
            this.baseFireRate = 160;
        }

        this.fireRate = this.baseFireRate;
        this.lastShot = 0;
        
        // Powerups states
        this.powerups = {
            shield: false,
            spread: false,
            rapid: false
        };
        this.powerupTimers = {
            shield: 0,
            spread: 0,
            rapid: 0
        };
    }

    move(dx, dy) {
        this.x += dx * this.maxSpeed;
        this.y += dy * this.maxSpeed;
        
        // Constrain to canvas
        this.x = Math.max(this.r, Math.min(this.cw - this.r, this.x));
        this.y = Math.max(this.r, Math.min(this.ch - this.r - 20, this.y));
    }

    moveTo(x, y) {
        // Linear interpolation for mouse/touch smooth lag
        this.x += (x - this.x) * 0.12;
        this.y += (y - this.y) * 0.12;
        
        this.x = Math.max(this.r, Math.min(this.cw - this.r, this.x));
        this.y = Math.max(this.r, Math.min(this.ch - this.r - 20, this.y));
    }

    damage(amount) {
        if (this.powerups.shield) {
            this.shield -= amount * 0.4; // 60% shield absorption
        } else {
            this.shield -= amount;
        }

        if (this.shield < 0) {
            this.hp += this.shield; // overflow damage to health
            this.shield = 0;
        }
        if (this.hp < 0) this.hp = 0;
        sound.playHit();
    }

    addPowerup(type) {
        sound.playPowerup();
        const now = Date.now();
        if (type === 'HEAL') {
            this.hp = Math.min(CONFIG.PLAYER_HP, this.hp + 30);
        } else if (type === 'SHIELD') {
            this.powerups.shield = true;
            this.powerupTimers.shield = now + CONFIG.POWERUP_DURATION;
            this.shield = Math.min(CONFIG.PLAYER_SHIELD * (this.type === 1 ? 1.5 : 1.0), this.shield + 50);
        } else if (type === 'SPREAD') {
            this.powerups.spread = true;
            this.powerupTimers.spread = now + CONFIG.POWERUP_DURATION;
        } else if (type === 'RAPID') {
            this.powerups.rapid = true;
            this.powerupTimers.rapid = now + CONFIG.POWERUP_DURATION;
        }
        updatePowerupsHUD();
    }

    updatePowerups(now) {
        // Regenerate shield slowly when alive
        if (this.shield < CONFIG.PLAYER_SHIELD * (this.type === 1 ? 1.5 : 1.0)) {
            this.shield += CONFIG.SHIELD_REGEN;
        }

        let updated = false;
        for (const [key, value] of Object.entries(this.powerupTimers)) {
            if (this.powerups[key] && now > value) {
                this.powerups[key] = false;
                updated = true;
            }
        }
        if (updated) {
            updatePowerupsHUD();
        }

        // Apply rapid fire rate changes
        this.fireRate = this.powerups.rapid ? this.baseFireRate * 0.5 : this.baseFireRate;
        
        // Spawn exhaust particles from engine
        particles.exhaust(this.x, this.y + 16, this.color);
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#050518';

        // Draw futuristic fighter jet path
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 18); // Nose
        ctx.lineTo(this.x - 14, this.y + 10); // Left wing outer
        ctx.lineTo(this.x - 7, this.y + 7); // Left wing inner
        ctx.lineTo(this.x - 4, this.y + 15); // Left thruster
        ctx.lineTo(this.x + 4, this.y + 15); // Right thruster
        ctx.lineTo(this.x + 7, this.y + 7); // Right wing inner
        ctx.lineTo(this.x + 14, this.y + 10); // Right wing outer
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw cockpit glass
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x - 4, this.y + 2);
        ctx.lineTo(this.x + 4, this.y + 2);
        ctx.closePath();
        ctx.fill();

        // Shield Bubble overlay if active
        if (this.powerups.shield) {
            ctx.shadowColor = '#00f0ff';
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}

// --- Bullet Entity ---
class Bullet {
    constructor(x, y, vx, vy, color, radius, isPlayerOwned = true, damage = 10) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.r = radius;
        this.isPlayerOwned = isPlayerOwned;
        this.damage = damage;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- Enemy Ships classes ---
class Enemy {
    constructor(x, y, type = 0) {
        this.x = x;
        this.y = y;
        this.type = type; // 0: Scout, 1: Shooter, 2: Charger, 3: Boss
        this.isDead = false;
        
        // Define stats by type
        if (type === 0) {
            this.r = 14;
            this.hp = 15;
            this.scoreVal = 100;
            this.color = '#ffd700'; // gold
            this.vy = 2.0;
            this.vx = 0;
        } else if (type === 1) {
            this.r = 16;
            this.hp = 25;
            this.scoreVal = 200;
            this.color = '#ff9f43'; // orange-red
            this.vy = 1.2;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.lastShot = 0;
            this.fireRate = 1800; // ms
        } else if (type === 2) {
            this.r = 12;
            this.hp = 10;
            this.scoreVal = 150;
            this.color = '#b06cff'; // purple
            this.vy = 4.2; // very fast
            this.vx = 0;
        } else {
            // Boss type
            this.r = 45;
            this.hp = 500;
            this.maxHp = 500;
            this.scoreVal = 5000;
            this.color = '#39ff14'; // neon green
            this.vy = 0.5;
            this.vx = 1.5;
            this.lastShot = 0;
            this.fireRate = 800;
            this.shootPhase = 0;
        }
    }

    update(cw, ch, playerX, playerY) {
        this.y += this.vy;
        this.x += this.vx;

        // Boss movement boundaries
        if (this.type === 3) {
            if (this.y > 100) this.vy = 0; // stop moving down after arriving
            if (this.x - this.r < 10 || this.x + this.r > cw - 10) {
                this.vx = -this.vx; // bounce off walls
            }
        } else if (this.type === 2) {
            // Charger homes slightly towards player column
            this.x += (playerX - this.x) * 0.015;
        } else if (this.type === 1) {
            // Shooters bounce slightly on walls
            if (this.x - this.r < 10 || this.x + this.r > cw - 10) {
                this.vx = -this.vx;
            }
        }
    }

    shoot(bullets, now) {
        if (this.type === 0 || this.type === 2) return;

        if (this.type === 1 && now - this.lastShot > this.fireRate) {
            bullets.push(new Bullet(this.x, this.y + this.r, 0, 4.5, this.color, 4, false, 15));
            this.lastShot = now;
            sound.playEnemyLaser();
        }

        if (this.type === 3 && now - this.lastShot > this.fireRate) {
            // Boss shoot patterns
            if (this.shootPhase % 3 === 0) {
                // Triple shot
                bullets.push(new Bullet(this.x - 20, this.y + 20, -1, 4, this.color, 5, false, 10));
                bullets.push(new Bullet(this.x, this.y + 25, 0, 4, this.color, 6, false, 15));
                bullets.push(new Bullet(this.x + 20, this.y + 20, 1, 4, this.color, 5, false, 10));
            } else if (this.shootPhase % 3 === 1) {
                // Targeted shot
                const dx = playerX - this.x;
                const dy = playerY - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const vx = (dx / dist) * 5;
                const vy = (dy / dist) * 5;
                bullets.push(new Bullet(this.x, this.y + 30, vx, vy, this.color, 6, false, 20));
            } else {
                // Wide circle spray
                for (let i = -2; i <= 2; i++) {
                    const angle = Math.PI / 2 + (i * 0.25);
                    bullets.push(new Bullet(this.x, this.y + 30, Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, this.color, 4.5, false, 10));
                }
            }
            this.lastShot = now;
            this.shootPhase++;
            sound.playEnemyLaser();
        }
    }

    damage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
            sound.playExplosion(this.type === 3);
            particles.burst(this.x, this.y, this.color, this.type === 3 ? 60 : 18, this.type === 3 ? 2.5 : 1);
        } else {
            particles.burst(this.x, this.y, '#ffffff', 3, 0.5); // white spark hit
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.0;
        ctx.fillStyle = '#0a050f';

        if (this.type === 0) {
            // Scout: diamond shape
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.r);
            ctx.lineTo(this.x - this.r, this.y);
            ctx.lineTo(this.x, this.y + this.r);
            ctx.lineTo(this.x + this.r, this.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 1) {
            // Shooter: Arrowhead shape pointing down
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.r);
            ctx.lineTo(this.x - this.r, this.y - this.r);
            ctx.lineTo(this.x, this.y - this.r + 6);
            ctx.lineTo(this.x + this.r, this.y - this.r);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 2) {
            // Charger: Spike oval shape
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.r);
            ctx.quadraticCurveTo(this.x - this.r * 0.7, this.y, this.x - this.r * 0.3, this.y - this.r);
            ctx.quadraticCurveTo(this.x, this.y - this.r + 2, this.x + this.r * 0.3, this.y - this.r);
            ctx.quadraticCurveTo(this.x + this.r * 0.7, this.y, this.x, this.y + this.r);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Boss: Massive fortress ship
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.r);
            ctx.lineTo(this.x - this.r * 0.8, this.y + 10);
            ctx.lineTo(this.x - this.r, this.y - this.r * 0.5);
            ctx.lineTo(this.x - this.r * 0.4, this.y - this.r);
            ctx.lineTo(this.x + this.r * 0.4, this.y - this.r);
            ctx.lineTo(this.x + this.r, this.y - this.r * 0.5);
            ctx.lineTo(this.x + this.r * 0.8, this.y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Boss health bar overlay on top of boss
            const barW = this.r * 1.5;
            const barH = 5;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.x - barW / 2, this.y - this.r - 15, barW, barH);
            ctx.fillStyle = '#39ff14';
            ctx.fillRect(this.x - barW / 2, this.y - this.r - 15, barW * (this.hp / this.maxHp), barH);
        }

        ctx.restore();
    }
}

// --- Powerup Dropped Item class ---
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // HEAL, SHIELD, SPREAD, RAPID
        this.r = 13;
        this.vy = 1.5;
    }

    update() {
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.lineWidth = 1.5;
        let color = '#ffffff';
        let icon = '+';
        if (this.type === 'HEAL') { color = '#ff3366'; icon = '♥'; }
        else if (this.type === 'SHIELD') { color = '#00f0ff'; icon = '⛨'; }
        else if (this.type === 'SPREAD') { color = '#ffd700'; icon = '▲'; }
        else if (this.type === 'RAPID') { color = '#39ff14'; icon = '⚡'; }

        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, this.x, this.y);
        ctx.restore();
    }
}

// --- Core Engine Engine States ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let player = null;
let stars = [];
let bullets = [];
let enemies = [];
let powerups = [];

let score = 0;
let wave = 1;
let inGame = false;
let waveTimer = 0;
let lastSpawn = 0;
let spawnRate = 2000; // ms
let enemiesLeftInWave = 0;
let isBossWave = false;
let isBossSpawned = false;

// Controller inputs
let keys = {};
let touchX = null;
let touchY = null;
let isUsingPointer = false;
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let screenShake = 0;

// Ship selections
let selectedShipType = 0;

// Elements
const menuOverlay = document.getElementById('menu-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const hud = document.getElementById('hud');
const hpBar = document.getElementById('hp-bar');
const shieldBar = document.getElementById('shield-bar');
const scoreVal = document.getElementById('score-val');
const waveDisplay = document.getElementById('wave-display');
const alertBanner = document.getElementById('alert-banner');
const finalScore = document.getElementById('final-score');
const finalWave = document.getElementById('final-wave');
const activePowerupsList = document.getElementById('active-powerups');

// Start Button / Retry Button bindings
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', showMainMenu);

// Ship select option listener
document.querySelectorAll('.ship-option').forEach(el => {
    el.addEventListener('click', (e) => {
        document.querySelectorAll('.ship-option').forEach(item => item.classList.remove('active'));
        const opt = e.currentTarget;
        opt.classList.add('active');
        selectedShipType = parseInt(opt.dataset.ship);
        sound.playPowerup();
    });
});

// Window resize
function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    // Reset stars coordinates bounds
    stars = [];
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        stars.push(new Star(canvas.width, canvas.height));
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Inputs listeners
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault(); // prevent scrolling
    sound.unlock();
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Mouse coordinates
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    isUsingPointer = true;
});
canvas.addEventListener('mousedown', () => {
    isMouseDown = true;
    sound.unlock();
});
canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});
canvas.addEventListener('mouseleave', () => {
    isMouseDown = false;
    isUsingPointer = false;
});

// Touch controls for mobile
canvas.addEventListener('touchstart', e => {
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    touchY = e.touches[0].clientY - rect.top;
    mouseX = touchX;
    mouseY = touchY;
    isUsingPointer = true;
    isMouseDown = true;
    sound.unlock();
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    touchY = e.touches[0].clientY - rect.top;
    mouseX = touchX;
    mouseY = touchY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
    isMouseDown = false;
    isUsingPointer = false;
    touchX = null;
    touchY = null;
    e.preventDefault();
});

// --- Gameplay actions ---
function startGame() {
    menuOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    hud.classList.remove('hidden');
    
    player = new Player(canvas.width, canvas.height, selectedShipType);
    bullets = [];
    enemies = [];
    powerups = [];
    particles.list = [];
    
    score = 0;
    wave = 1;
    waveTimer = Date.now() + 2000;
    enemiesLeftInWave = 8;
    isBossWave = false;
    isBossSpawned = false;
    inGame = true;

    sound.unlock();
    sound.startMusic();
    updateUI();
}

function showMainMenu() {
    gameoverOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
    hud.classList.add('hidden');
    inGame = false;
    sound.stopMusic();
}

function gameOver() {
    inGame = false;
    sound.stopMusic();
    sound.playExplosion(true);
    
    finalScore.innerText = score;
    finalWave.innerText = wave;
    gameoverOverlay.classList.remove('hidden');
}

function startNextWave() {
    wave++;
    waveTimer = Date.now() + 3000; // time before enemies spawn
    isBossWave = (wave % 5 === 0);
    isBossSpawned = false;

    if (isBossWave) {
        enemiesLeftInWave = 1;
        sound.playWarning();
        showAlert('WARNING: BOSS INCOMING');
    } else {
        enemiesLeftInWave = 6 + wave * 3;
        spawnRate = Math.max(800, 2500 - wave * 150);
        showAlert(`WAVE ${wave} INITIATED`);
    }
    
    waveDisplay.innerText = `WAVE ${wave}`;
}

function showAlert(msg) {
    alertBanner.innerText = msg;
    alertBanner.classList.remove('hidden');
    setTimeout(() => {
        alertBanner.classList.add('hidden');
    }, 2500);
}

function updateUI() {
    if (!player) return;
    hpBar.style.width = `${Math.max(0, player.hp)}%`;
    shieldBar.style.width = `${Math.max(0, player.shield / (player.type === 1 ? 1.5 : 1.0))}%`;
    scoreVal.innerText = score.toString().padStart(6, '0');
}

/* Nhớ tập powerup đang bật, để biết khi nào PHẢI dựng lại thẻ. */
let powerupHudKey = '';

/* Bản cũ xoá sạch rồi dựng lại thẻ mỗi lần được gọi — mà nó được gọi khoảng
   10-20 lần mỗi giây từ vòng lặp game. Thẻ badge lại có animation slideIn
   0,3s trong CSS, nên nó bị tạo mới trước khi kịp chạy hết animation, lần nào
   cũng vậy: chữ rung liên tục không đứng yên nổi.
   Giờ chỉ dựng lại thẻ khi TẬP powerup thay đổi (nhận thêm hoặc hết hạn), còn
   lại chỉ sửa đúng mấy chữ số đếm ngược bên trong. */
function updatePowerupsHUD() {
    if (!player) { activePowerupsList.innerHTML = ''; powerupHudKey = ''; return; }
    const now = Date.now();
    const active = Object.keys(player.powerups).filter(k => player.powerups[k]);
    const key = active.join(',');

    if (key !== powerupHudKey) {
        powerupHudKey = key;
        activePowerupsList.innerHTML = '';
        for (const k of active) {
            const badge = document.createElement('div');
            badge.className = `powerup-badge text-${k === 'shield' ? 'blue' : (k === 'rapid' ? 'green' : 'yellow')}`;
            badge.dataset.pk = k;
            let label = 'SHIELD', icon = '⛨';
            if (k === 'spread') { label = 'SPREAD SHOT'; icon = '▲'; }
            if (k === 'rapid') { label = 'RAPID FIRE'; icon = '⚡'; }
            /* Bỏ biểu tượng tia sét của Font Awesome đứng trước: mỗi powerup đã
               có biểu tượng riêng rồi, để cả hai thành ra hai tia sét cạnh nhau. */
            badge.innerHTML = '<span class="pb-icon">' + icon + '</span>'
                + '<span class="pb-label">' + label + '</span>'
                + '<span class="pb-time"></span>';
            activePowerupsList.appendChild(badge);
        }
    }

    for (const badge of activePowerupsList.children) {
        const left = Math.max(0, Math.ceil((player.powerupTimers[badge.dataset.pk] - now) / 1000));
        const t = badge.querySelector('.pb-time');
        const txt = '(' + left + 's)';
        if (t && t.textContent !== txt) t.textContent = txt;
    }
}

// Global scope coordinate access
let playerX = 0;
let playerY = 0;

// --- Engine Core Game Loop ---
function loop() {
    // 1. Draw Starfield (always rendering)
    ctx.fillStyle = CONFIG.PLAYER_HP === 0 ? '#100000' : '#030310';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (const s of stars) {
        s.update();
        s.draw(ctx);
    }

    if (inGame && player) {
        // Cache coordinates
        playerX = player.x;
        playerY = player.y;

        const now = Date.now();

        // 2. Shake screen logic
        if (screenShake > 0) {
            ctx.save();
            const dx = (Math.random() - 0.5) * screenShake;
            const dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
            screenShake *= 0.88;
            if (screenShake < 0.2) screenShake = 0;
        }

        // 3. Update Player input & powerups
        player.updatePowerups(now);

        if (isUsingPointer) {
            player.moveTo(mouseX, mouseY);
        } else {
            let dx = 0;
            let dy = 0;
            if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
            if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
            if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
            if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
            
            player.move(dx, dy);
        }

        // 4. Autoshot / manual shot laser weapons
        if ((keys['Space'] || isMouseDown) && now - player.lastShot > player.fireRate) {
            const bSpeed = 10;
            const bulletDmg = player.type === 2 ? 8 : 12; // agile ship shoots faster but weaker bullets

            if (player.powerups.spread) {
                // Triple bullet spread
                bullets.push(new Bullet(player.x - 10, player.y - 10, -2, -bSpeed, player.color, 4, true, bulletDmg));
                bullets.push(new Bullet(player.x, player.y - 15, 0, -bSpeed, player.color, 5, true, bulletDmg));
                bullets.push(new Bullet(player.x + 10, player.y - 10, 2, -bSpeed, player.color, 4, true, bulletDmg));
            } else {
                bullets.push(new Bullet(player.x, player.y - 15, 0, -bSpeed, player.color, 5, true, bulletDmg));
            }
            player.lastShot = now;
            sound.playLaser();
        }

        // 5. Spawning enemies wave waves
        if (now > waveTimer) {
            if (isBossWave && !isBossSpawned) {
                enemies.push(new Enemy(canvas.width / 2, -50, 3));
                isBossSpawned = true;
                /* Trùm là con địch DUY NHẤT của wave này, nên sinh nó ra là bộ
                   đếm phải về 0. Thiếu dòng này thì enemiesLeftInWave đứng mãi
                   ở 1, điều kiện qua wave không bao giờ đúng, và giết trùm
                   xong là game treo vĩnh viễn — không còn địch nào sinh ra,
                   cũng không sang wave mới. Đây chính là chỗ chết ở wave 5. */
                enemiesLeftInWave = 0;
            } else if (!isBossWave && enemiesLeftInWave > 0 && now - lastSpawn > spawnRate) {
                const spawnX = 25 + Math.random() * (canvas.width - 50);
                // Enemy type distribution based on current wave level
                let eType = 0;
                const rand = Math.random();
                if (wave >= 4 && rand < 0.25) eType = 2; // Charger
                else if (wave >= 2 && rand < 0.50) eType = 1; // Shooter

                enemies.push(new Enemy(spawnX, -20, eType));
                enemiesLeftInWave--;
                lastSpawn = now;
            }
        }

        /* Kiểm tra hết wave mỗi khung hình, KHÔNG nhét trong nhánh bắn chết.
           Địch bị xoá khỏi mảng ở hai chỗ: bị bắn chết, và bay lọt qua đáy màn
           hình. Đặt phép kiểm tra trong nhánh bắn chết thì con cuối cùng mà bay
           lọt là game đứng im luôn, vì không còn địch nào chết để chạy lại phép
           kiểm tra ấy. Kiểm mỗi khung hình thì mọi đường xoá địch đều được phủ,
           kể cả những đường thêm về sau. */
        if (enemiesLeftInWave === 0 && enemies.length === 0) {
            startNextWave();
        }

        // 6. Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.update();
            b.draw(ctx);

            // Offscreen removal
            if (b.y < -10 || b.y > canvas.height + 10 || b.x < -10 || b.x > canvas.width + 10) {
                bullets.splice(i, 1);
            }
        }

        // 7. Update enemy ships
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            e.update(canvas.width, canvas.height, player.x, player.y);
            e.shoot(bullets, now);
            e.draw(ctx);

            // Collision check: Enemy vs Player ship
            const distToPlayer = Math.sqrt((e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y));
            if (distToPlayer < e.r + player.r) {
                // Crash collision
                player.damage(e.type === 3 ? 50 : 25);
                screenShake = 12;
                e.damage(1000); // instantly kill normal enemy
                
                if (player.hp <= 0) {
                    gameOver();
                }
                updateUI();
                continue;
            }

            // Offscreen bounds check (normal enemies passing down)
            if (e.y > canvas.height + e.r) {
                // Penalize health a tiny bit if they pass through unkilled
                if (e.type !== 3) {
                    player.damage(5);
                    updateUI();
                }
                enemies.splice(i, 1);
            }
        }

        // 8. Collisions: Player bullets vs Enemy ships
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (!b.isPlayerOwned) continue;

            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < b.r + e.r) {
                    // Hit!
                    e.damage(b.damage);
                    bullets.splice(i, 1);

                    if (e.isDead) {
                        score += e.scoreVal;
                        updateUI();
                        enemies.splice(j, 1);

                        // Random powerup spawn drop chance
                        if (Math.random() < 0.18) {
                            const pTypes = ['HEAL', 'SHIELD', 'SPREAD', 'RAPID'];
                            const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
                            powerups.push(new Powerup(e.x, e.y, pType));
                        }

                    }
                    break; // break out of inner loop since bullet is gone
                }
            }
        }

        // 9. Collisions: Enemy bullets vs Player ship
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (b.isPlayerOwned) continue;

            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < b.r + player.r) {
                // Player ship Hit!
                player.damage(b.damage);
                bullets.splice(i, 1);
                screenShake = 6;
                updateUI();

                if (player.hp <= 0) {
                    gameOver();
                }
            }
        }

        // 10. Update & Collide powerups items
        for (let i = powerups.length - 1; i >= 0; i--) {
            const p = powerups[i];
            p.update();
            p.draw(ctx);

            const dx = p.x - player.x;
            const dy = p.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < p.r + player.r) {
                player.addPowerup(p.type);
                powerups.splice(i, 1);
                updateUI();
            } else if (p.y > canvas.height + p.r) {
                powerups.splice(i, 1);
            }
        }

        // Periodic UI update for active powerup countdowns
        if (now % 100 < 20) {
            updatePowerupsHUD();
        }

        // 11. Draw Player ship
        player.draw(ctx);

        if (screenShake > 0) {
            ctx.restore();
        }
    }

    // 12. Particles system updates
    particles.update();
    particles.draw(ctx);

    requestAnimationFrame(loop);
}

// Start loop engine running
requestAnimationFrame(loop);
