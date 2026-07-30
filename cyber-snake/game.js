/**
 * Cyber Snake - Game Engine Logic
 */

// --- Web Audio Synth Sound Engine ---
class CyberSynth {
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
                this.master.gain.value = 0.4;
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

    tone(freq, type = 'sine', duration = 0.1, volume = 0.1, sweepTo = null) {
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

        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gainNode);
        gainNode.connect(this.master);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    }

    noise(duration = 0.1, volume = 0.08) {
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

        noiseNode.connect(gainNode);
        gainNode.connect(this.master);
        
        noiseNode.start();
        noiseNode.stop(this.ctx.currentTime + duration + 0.05);
    }

    playEat(coreType) {
        if (coreType === 'NANO') {
            this.tone(600, 'sine', 0.08, 0.12, 1200);
        } else if (coreType === 'OVERDRIVE') {
            this.tone(440, 'triangle', 0.2, 0.15, 1800);
        } else if (coreType === 'CRYO') {
            this.tone(1000, 'sine', 0.25, 0.1, 400); // falling pitch
        } else if (coreType === 'EMP') {
            this.noise(0.15, 0.2);
            this.tone(300, 'sawtooth', 0.15, 0.15, 100);
        } else if (coreType === 'GLITCH') {
            // Glitchy quick chord tones
            this.tone(900, 'square', 0.05, 0.1);
            setTimeout(() => this.tone(1300, 'square', 0.05, 0.1), 40);
            setTimeout(() => this.tone(1100, 'square', 0.05, 0.1), 80);
            setTimeout(() => this.tone(1500, 'square', 0.08, 0.1), 120);
        }
    }

    playDeath() {
        this.noise(0.5, 0.35);
        this.tone(180, 'sawtooth', 0.4, 0.3, 40);
    }

    playLevelUp() {
        const chord = [261.63, 329.63, 392.00, 523.25];
        chord.forEach((freq, idx) => {
            setTimeout(() => {
                this.tone(freq * 2, 'triangle', 0.25, 0.12);
            }, idx * 70);
        });
    }

    startMusic() {
        this.stopMusic();
        this.init();
        if (!this.ctx) return;

        // Cyberpunk synthwave bass rhythm
        const bass = [
            55, 55, 55, 55, 55, 55, 55, 55,
            48.99, 48.99, 48.99, 48.99, 65.41, 65.41, 65.41, 65.41
        ];

        this.musicStep = 0;
        this.musicInterval = setInterval(() => {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            // Synth bass line
            const bFreq = bass[this.musicStep % bass.length];
            this.tone(bFreq, 'sawtooth', 0.18, 0.07, bFreq * 0.95);

            // Occasional click rhythm
            if (this.musicStep % 4 === 2) {
                this.noise(0.02, 0.01);
            }

            this.musicStep++;
        }, 160); // fast tempo 187 BPM
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

const sound = new CyberSynth();

// --- Configuration & Constants ---
const GRID = 22; // 22x22 cells matrix board

// Cores core categories
const CORES = {
    NANO: { color: '#39ff14', name: 'NANO CORE' },
    OVERDRIVE: { color: '#ffd700', name: 'OVERDRIVE CORE' },
    CRYO: { color: '#00f0ff', name: 'CRYO CORE' },
    EMP: { color: '#ff3366', name: 'EMP SHIELD' },
    GLITCH: { color: '#b06cff', name: 'GLITCH CORE' }
};

// --- Particles System ---
class Spark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5.0;
        this.vy = (Math.random() - 0.5) * 5.0;
        this.color = color;
        this.size = 1.5 + Math.random() * 2.0;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // friction
        this.vy *= 0.95;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let sparks = [];

// --- Game Engine Variables ---
let canvas = document.getElementById('game-canvas');
let ctx = canvas.getContext('2d');
let cellSize = 0;

let snake = [];
let dir = { x: 1, y: 0 };
let nextDirs = []; // queue to store turns to prevent double presses

let food = { x: 0, y: 0, type: 'NANO' };
let obstacles = [];

let score = 0;
let highScore = 0;
let level = 1;
let inGame = false;
let gameLoopTimer = null;
let baseSpeed = 160; // ms
let currentSpeed = 160;

// Powerup states
let powerupType = null; // 'OVERDRIVE' or 'CRYO'
let powerupEndTime = 0;
let powerupDurationTotal = 5000; // 5s

// Swipe Touch inputs
let touchStartX = 0;
let touchStartY = 0;

// HUD Elements
const scoreVal = document.getElementById('score-val');
const highScoreVal = document.getElementById('high-score-val');
const levelVal = document.getElementById('level-val');
const sizeVal = document.getElementById('size-val');
const powerupBar = document.getElementById('powerup-bar-container');
const powerupLabel = document.getElementById('powerup-label');
const powerupTimer = document.getElementById('powerup-timer');
const powerupFill = document.getElementById('powerup-progress-fill');

const menuOverlay = document.getElementById('menu-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const hud = document.getElementById('hud');
const finalScore = document.getElementById('final-score');
const finalLevel = document.getElementById('final-level');
const newHighBadge = document.getElementById('new-high-badge');

// Events
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', showMainMenu);

// LocalStorage score load
try {
    const saved = localStorage.getItem('cyberSnakeHighScore');
    if (saved) {
        highScore = parseInt(saved);
        highScoreVal.innerText = highScore;
    }
} catch (e) {}

// Canvas metrics setup
function setupCanvasSize() {
    const size = Math.min(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
    canvas.width = size;
    canvas.height = size;
    cellSize = size / GRID;
}
window.addEventListener('resize', setupCanvasSize);
setupCanvasSize();

// Controls Listener
window.addEventListener('keydown', e => {
    let newDir = null;
    switch(e.code) {
        case 'KeyW':
        case 'ArrowUp':
            newDir = { x: 0, y: -1 };
            break;
        case 'KeyS':
        case 'ArrowDown':
            newDir = { x: 0, y: 1 };
            break;
        case 'KeyA':
        case 'ArrowLeft':
            newDir = { x: -1, y: 0 };
            break;
        case 'KeyD':
        case 'ArrowRight':
            newDir = { x: 1, y: 0 };
            break;
    }

    if (newDir && inGame) {
        e.preventDefault();
        const lastDir = nextDirs.length > 0 ? nextDirs[nextDirs.length - 1] : dir;
        // Don't turn back directly into tail
        if (newDir.x !== -lastDir.x || newDir.y !== -lastDir.y) {
            nextDirs.push(newDir);
        }
    }
    sound.unlock();
});

// Mobile swipe control
canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    sound.unlock();
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
    if (!inGame) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    
    // Determine major swipe angle
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        let newDir = null;
        if (Math.abs(dx) > Math.abs(dy)) {
            newDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else {
            newDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }

        const lastDir = nextDirs.length > 0 ? nextDirs[nextDirs.length - 1] : dir;
        if (newDir && (newDir.x !== -lastDir.x || newDir.y !== -lastDir.y)) {
            nextDirs.push(newDir);
        }
    }
    e.preventDefault();
});

// --- Gameplay Loops ---
function startGame() {
    menuOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    hud.classList.remove('hidden');

    // Init snake facing right at middle
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    dir = { x: 1, y: 0 };
    nextDirs = [];

    score = 0;
    level = 1;
    baseSpeed = 150;
    currentSpeed = 150;
    
    powerupType = null;
    powerupBar.classList.add('hidden');

    generateObstacles();
    spawnFood();
    inGame = true;
    
    sound.unlock();
    sound.startMusic();
    updateUI();
    
    if (gameLoopTimer) clearTimeout(gameLoopTimer);
    tick();
}

function showMainMenu() {
    gameoverOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
    hud.classList.add('hidden');
    inGame = false;
    sound.stopMusic();
    if (gameLoopTimer) clearTimeout(gameLoopTimer);
}

function gameOver() {
    inGame = false;
    sound.stopMusic();
    sound.playDeath();

    let newHigh = false;
    if (score > highScore) {
        highScore = score;
        highScoreVal.innerText = highScore;
        try {
            localStorage.setItem('cyberSnakeHighScore', score);
        } catch (e) {}
        newHigh = true;
    }

    finalScore.innerText = score;
    finalLevel.innerText = level;
    newHighBadge.classList.toggle('hidden', !newHigh);
    gameoverOverlay.classList.remove('hidden');
}

function updateUI() {
    scoreVal.innerText = score;
    levelVal.innerText = level;
    sizeVal.innerText = snake.length;
}

// Generate light barriers obstacles by Level config
function generateObstacles() {
    obstacles = [];
    if (level === 1) return; // grid is empty
    
    // Level 2: Small border nodes
    if (level >= 2) {
        obstacles.push({ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 6 });
        obstacles.push({ x: GRID - 6, y: 5 }, { x: GRID - 7, y: 5 }, { x: GRID - 6, y: 6 });
        obstacles.push({ x: 5, y: GRID - 6 }, { x: 6, y: GRID - 6 }, { x: 5, y: GRID - 7 });
        obstacles.push({ x: GRID - 6, y: GRID - 6 }, { x: GRID - 7, y: GRID - 6 }, { x: GRID - 6, y: GRID - 7 });
    }
    
    // Level 3+: Extra cross lines in center
    if (level >= 3) {
        const mid = Math.floor(GRID / 2);
        obstacles.push({ x: mid, y: mid - 2 }, { x: mid, y: mid - 1 }, { x: mid, y: mid }, { x: mid, y: mid + 1 }, { x: mid, y: mid + 2 });
    }
}

// Spawns power-up cores safely on grid
function spawnFood() {
    let valid = false;
    let fx = 0, fy = 0;
    while (!valid) {
        fx = Math.floor(Math.random() * (GRID - 2)) + 1;
        fy = Math.floor(Math.random() * (GRID - 2)) + 1;
        
        // Ensure not on snake body or obstacles
        const onSnake = snake.some(seg => seg.x === fx && seg.y === fy);
        const onObstacle = obstacles.some(obs => obs.x === fx && obs.y === fy);
        
        if (!onSnake && !onObstacle) {
            valid = true;
        }
    }

    // Determine food core category probability
    let type = 'NANO';
    const rand = Math.random();
    if (rand < 0.08) type = 'GLITCH';
    else if (rand < 0.16) type = 'EMP';
    else if (rand < 0.24) type = 'CRYO';
    else if (rand < 0.32) type = 'OVERDRIVE';

    food = { x: fx, y: fy, type };
}

// Core physics engine cycles
function tick() {
    if (!inGame) return;

    // 1. Get next turn from inputs queue
    if (nextDirs.length > 0) {
        dir = nextDirs.shift();
    }

    // 2. Compute next head coordinates
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // 3. Collision: Check walls bounds
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
        gameOver();
        return;
    }

    // 4. Collision: Check self body
    const hitSelf = snake.some(seg => seg.x === head.x && seg.y === head.y);
    if (hitSelf) {
        gameOver();
        return;
    }

    // 5. Collision: Check obstacles light walls
    const hitObstacle = obstacles.some(obs => obs.x === head.x && obs.y === head.y);
    if (hitObstacle) {
        gameOver();
        return;
    }

    // 6. Insert new head segment
    snake.unshift(head);

    // 7. Check if head is eating Core
    if (head.x === food.x && head.y === food.y) {
        // Trigger explosion spark particles
        const center = cellCenter(food.x, food.y);
        const coreColor = CORES[food.type].color;
        for (let i = 0; i < 15; i++) {
            sparks.push(new Spark(center.x, center.y, coreColor));
        }

        sound.playEat(food.type);

        // Apply Core rules
        let scoreInc = 100;
        if (powerupType === 'OVERDRIVE') scoreInc = 200; // double points

        if (food.type === 'OVERDRIVE') {
            powerupType = 'OVERDRIVE';
            powerupEndTime = Date.now() + powerupDurationTotal;
            powerupBar.classList.remove('hidden');
            powerupLabel.innerText = 'OVERDRIVE CORES: 2X POINTS + SPEED';
        } else if (food.type === 'CRYO') {
            powerupType = 'CRYO';
            powerupEndTime = Date.now() + powerupDurationTotal;
            powerupBar.classList.remove('hidden');
            powerupLabel.innerText = 'CRYO CORE: SNAKE DE-VELOCITY';
        } else if (food.type === 'EMP') {
            // Cut tail by 2 segments
            if (snake.length > 3) {
                snake.pop();
                snake.pop();
            }
        } else if (food.type === 'GLITCH') {
            scoreInc += 400; // glitch core gives massive base point
        }

        score += scoreInc;

        // Check level up (every 1000 points triggers level up & spawns obstacles)
        const oldLvl = level;
        level = Math.floor(score / 1000) + 1;
        if (level > oldLvl) {
            sound.playLevelUp();
            generateObstacles();
        }

        updateUI();
        spawnFood();
    } else {
        // Normal move: remove tail to maintain same length
        snake.pop();
    }

    // 8. Update active powerups timer durations
    const now = Date.now();
    if (powerupType) {
        if (now > powerupEndTime) {
            powerupType = null;
            powerupBar.classList.add('hidden');
        } else {
            const left = Math.max(0, (powerupEndTime - now) / 1000);
            powerupTimer.innerText = `${left.toFixed(1)}s`;
            powerupFill.style.width = `${(left / 5.0) * 100}%`;
            powerupFill.style.background = powerupType === 'CRYO' ? 'var(--neon-blue)' : 'var(--neon-yellow)';
        }
    }

    // Calculate current speed
    baseSpeed = Math.max(70, 160 - level * 8); // scales speed
    if (powerupType === 'OVERDRIVE') {
        currentSpeed = baseSpeed * 0.65; // goes faster
    } else if (powerupType === 'CRYO') {
        currentSpeed = baseSpeed * 1.6; // goes slower
    } else {
        currentSpeed = baseSpeed;
    }

    // Loop game speed tick
    gameLoopTimer = setTimeout(tick, currentSpeed);
}

// Helpers
function cellCenter(cx, cy) {
    return {
        x: cx * cellSize + cellSize / 2,
        y: cy * cellSize + cellSize / 2
    };
}

// Radar scanline position
let radarAngle = 0;

// --- Canvas Render Logic ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Grid Lines with Neon Glow
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i <= GRID; i++) {
        const p = i * cellSize;
        // Verticals
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.stroke();

        // Horizontals
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
        ctx.stroke();
    }

    // 2. Draw Radar scan line sweeping
    ctx.restore();
    ctx.save();
    radarAngle += 0.015;
    const radCenter = canvas.width / 2;
    const grad = ctx.createRadialGradient(radCenter, radCenter, 10, radCenter, radCenter, radCenter);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
    grad.addColorStop(1, 'rgba(2, 2, 8, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw radar sweeping line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radCenter, radCenter);
    ctx.lineTo(radCenter + Math.cos(radarAngle) * radCenter, radCenter + Math.sin(radarAngle) * radCenter);
    ctx.stroke();
    ctx.restore();

    // 3. Draw Obstacles (Light walls barriers)
    for (const obs of obstacles) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.0;
        ctx.fillRect(obs.x * cellSize + 2, obs.y * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.strokeRect(obs.x * cellSize + 2, obs.y * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.restore();
    }

    // 4. Draw Core Food Item
    if (inGame) {
        ctx.save();
        const coreColor = CORES[food.type].color;
        const center = cellCenter(food.x, food.y);
        const radius = (cellSize / 2.5) * (1.0 + Math.sin(Date.now() * 0.01) * 0.1); // pulsate mồi

        ctx.shadowBlur = 15;
        ctx.shadowColor = coreColor;
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // White inner code glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 5. Draw Cyber Snake laser trail (Realistic Organic Slithering Snake)
    if (inGame && snake.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw body connections with glowing gradients
        for (let i = snake.length - 1; i >= 0; i--) {
            const seg = snake[i];
            const originalCenter = cellCenter(seg.x, seg.y);
            
            // Calculate a slithering wriggle offset (perpendicular to direction)
            // It runs a sine wave down the body. i is segment index, Date.now() * speed controls movement
            let wriggleOffset = 0;
            if (i > 0) {
                // Perpendicular offset based on current direction
                wriggleOffset = Math.sin(Date.now() * 0.012 - i * 0.65) * (cellSize * 0.16) * (1.0 - i / snake.length * 0.4);
            }
            
            let center = { x: originalCenter.x, y: originalCenter.y };
            if (dir.x !== 0) { // Moving horizontally, wriggle offset is vertical (y)
                center.y += wriggleOffset;
            } else { // Moving vertically, wriggle offset is horizontal (x)
                center.x += wriggleOffset;
            }

            // Core style parameters
            const opacity = 1.0 - (i / snake.length) * 0.65;
            // Taper body segments size smoothly to the tail
            const size = (cellSize * 0.88) * (1.0 - (i / snake.length) * 0.7);
            
            // Realistic Snake Color Scheme: Python / Green Viper style
            // Base color: Forest/Leaf Green (#2ecc71), with light yellow patches (#f1c40f) and dark spots (#27ae60)
            let baseColor = '#2ecc71';
            let patternColor = '#f1c40f';
            let shadowColor = '#27ae60';
            
            if (powerupType === 'OVERDRIVE') {
                baseColor = '#ffa502'; // fiery golden python
                patternColor = '#ff4757';
                shadowColor = '#d35400';
            } else if (powerupType === 'CRYO') {
                baseColor = '#3498db'; // ice blue viper
                patternColor = '#ffffff';
                shadowColor = '#2980b9';
            }

            ctx.shadowBlur = i === 0 ? 12 : 5;
            ctx.shadowColor = shadowColor;
            ctx.fillStyle = baseColor;
            ctx.strokeStyle = patternColor;
            ctx.globalAlpha = opacity;

            if (i === 0) {
                // HEAD: Draw a detailed realistic triangular snake head (like a viper/python)
                ctx.save();
                ctx.translate(center.x, center.y);
                
                // Rotate head to align with current direction
                let angle = 0;
                if (dir.x === 1) angle = 0;
                else if (dir.x === -1) angle = Math.PI;
                else if (dir.y === 1) angle = Math.PI / 2;
                else if (dir.y === -1) angle = -Math.PI / 2;
                ctx.rotate(angle);

                // Draw triangular flared viper head shape
                ctx.beginPath();
                ctx.moveTo(cellSize * 0.45, 0); // Nose tip
                ctx.quadraticCurveTo(cellSize * 0.15, -cellSize * 0.38, -cellSize * 0.15, -cellSize * 0.42); // Left cheek flared
                ctx.lineTo(-cellSize * 0.35, -cellSize * 0.25); // Back left neck
                ctx.lineTo(-cellSize * 0.35, cellSize * 0.25); // Back right neck
                ctx.lineTo(-cellSize * 0.15, cellSize * 0.42); // Right cheek flared
                ctx.quadraticCurveTo(cellSize * 0.15, cellSize * 0.38, cellSize * 0.45, 0); // Nose tip
                ctx.closePath();
                ctx.fill();
                
                // Draw scales texture on head
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cellSize * 0.2, 0);
                ctx.lineTo(-cellSize * 0.2, -cellSize * 0.25);
                ctx.moveTo(cellSize * 0.2, 0);
                ctx.lineTo(-cellSize * 0.2, cellSize * 0.25);
                ctx.stroke();

                // Draw glowing realistic slitted snake eyes (cat eyes)
                ctx.fillStyle = '#ff3300'; // fiery red eyes for realism
                if (powerupType === 'OVERDRIVE') ctx.fillStyle = '#ffffff';
                else if (powerupType === 'CRYO') ctx.fillStyle = '#f1c40f';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8;
                
                // Left eye
                ctx.beginPath();
                ctx.ellipse(cellSize * 0.12, -cellSize * 0.18, 4, 2, Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();
                // Right eye
                ctx.beginPath();
                ctx.ellipse(cellSize * 0.12, cellSize * 0.18, 4, 2, -Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();

                // Black slitted pupil in eyes
                ctx.fillStyle = '#000000';
                ctx.shadowBlur = 0;
                ctx.fillRect(cellSize * 0.12 - 1, -cellSize * 0.18 - 3, 2, 6);
                ctx.fillRect(cellSize * 0.12 - 1, cellSize * 0.18 - 3, 2, 6);

                // Draw detailed flicking long red bifurcated tongue
                ctx.strokeStyle = '#ff2e63';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(cellSize * 0.45, 0);
                ctx.lineTo(cellSize * 0.72, 0); // tongue main stem
                ctx.lineTo(cellSize * 0.85, -4); // fork left
                ctx.moveTo(cellSize * 0.72, 0);
                ctx.lineTo(cellSize * 0.85, 4); // fork right
                ctx.stroke();
                
                ctx.restore();
            } else {
                // BODY: Draw rounded organic scaly segments
                ctx.beginPath();
                ctx.arc(center.x, center.y, size / 2, 0, Math.PI * 2);
                ctx.fill();

                // Draw detailed python diamond camouflage markings/scales
                ctx.strokeStyle = patternColor;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                // diamond shape in middle of scale segment
                ctx.moveTo(center.x, center.y - size * 0.45);
                ctx.lineTo(center.x + size * 0.35, center.y);
                ctx.lineTo(center.x, center.y + size * 0.45);
                ctx.lineTo(center.x - size * 0.35, center.y);
                ctx.closePath();
                ctx.stroke();
                
                // Small black/dark spot in the center of scale
                ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
                ctx.beginPath();
                ctx.arc(center.x, center.y, size * 0.16, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // 6. Draw Spark particles explosion
    for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.update();
        sp.draw(ctx);
        if (sp.life <= 0) {
            sparks.splice(i, 1);
        }
    }

    requestAnimationFrame(draw);
}

// Start frame animations drawing
requestAnimationFrame(draw);
