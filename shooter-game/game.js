/* =========================================================
   BOT ARENA BLASTER - JS ENGINE
   ========================================================= */

(function () {
    'use strict';

    // --- Web Audio API Sound Synthesizer ---
    class SoundFX {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playShoot(type) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            if (type === 'pistol') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'shotgun') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(250, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'plasma') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'rocket') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'freeze') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.12);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            }
        }

        playExplosion(isBig = false) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';

            const startFreq = isBig ? 120 : 180;
            const duration = isBig ? 0.45 : 0.25;

            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + duration);

            gain.gain.setValueAtTime(isBig ? 0.4 : 0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + duration);
        }

        playPowerup() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';

            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        }

        playHit() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        }

        playWin() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
                gain.gain.setValueAtTime(0.2, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.3);
            });
        }
    }

    const soundFX = new SoundFX();

    // --- Weapon Specs ---
    const WEAPONS = {
        pistol: { name: 'Súng Ngắn', icon: 'fa-gun', ammo: Infinity, speed: 12, cooldown: 220, damage: 25, color: '#00f0ff', count: 1, spread: 0 },
        shotgun: { name: 'Súng Săn', icon: 'fa-burst', ammo: 40, speed: 10, cooldown: 550, damage: 18, color: '#ff9900', count: 5, spread: 0.35 },
        plasma: { name: 'Súng Laser', icon: 'fa-bolt', ammo: 60, speed: 18, cooldown: 140, damage: 30, color: '#39ff14', count: 1, spread: 0.05 },
        rocket: { name: 'Tên Lửa', icon: 'fa-rocket', ammo: 15, speed: 8, cooldown: 800, damage: 120, color: '#ff3366', count: 1, spread: 0, isRocket: true },
        freeze: { name: 'Súng Băng', icon: 'fa-snowflake', ammo: 50, speed: 11, cooldown: 250, damage: 20, color: '#00d2ff', count: 1, spread: 0.1, isFreeze: true },
        flame: { name: 'Phun Lửa', icon: 'fa-fire-flame-curved', ammo: 80, speed: 9, cooldown: 80, damage: 12, color: '#ff4500', count: 3, spread: 0.3, isFlame: true },
        tesla: { name: 'Súng Sấm Sét', icon: 'fa-cloud-bolt', ammo: 45, speed: 22, cooldown: 300, damage: 45, color: '#ffd700', count: 1, spread: 0.02, isTesla: true },
        katana: { name: 'Kiếm Laser', icon: 'fa-wand-magic-sparkles', ammo: 60, speed: 6, cooldown: 350, damage: 95, color: '#ff007f', count: 1, spread: 0.8, isMelee: true }
    };

    // Equipment Loadout Options
    const LOADOUTS = {
        armor: 'tactical', // 'tactical', 'heavy', 'cyber'
        helmet: 'bandana'  // 'bandana', 'helmet', 'goggles'
    };

    // --- Game Engine Variables ---
    let canvas, ctx;
    let viewportWidth = 0, viewportHeight = 0;

    // Game state: 'MENU', 'PLAYING', 'GAMEOVER', 'VICTORY'
    let gameState = 'MENU';
    let gameMode = 'survival'; // 'survival' or 'team'
    let difficulty = 'easy';   // 'easy', 'normal', 'hard'
    let autoAim = true;

    // Arena dimensions
    const ARENA = { width: 1400, height: 900 };

    // Player State
    let player = null;
    let keys = {};
    let mousePos = { x: 0, y: 0 };
    let isMouseDown = false;

    // Entities
    let bots = [];
    let bullets = [];
    let powerups = [];
    let particles = [];
    let floatingTexts = [];
    let traps = [];
    let barrels = [];
    let jumpPads = [];

    // --- Explosive Barrel Class ---
    class ExplosiveBarrel {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 20;
            this.hp = 30;
            this.maxHp = 30;
            this.destroyed = false;
        }

        takeDamage(amount) {
            this.hp -= amount;
            if (this.hp <= 0 && !this.destroyed) {
                this.destroyed = true;
                createExplosion(this.x, this.y, '#ff4500', true);
                floatingTexts.push(new FloatingText(this.x, this.y - 20, '💥 BOOM!', '#ff4500'));

                // Explode damage to nearby bots & traps & player
                bots.forEach(bot => {
                    if (distance(this.x, this.y, bot.x, bot.y) < 140) {
                        bot.takeDamage(160);
                    }
                });
                traps.forEach(trap => {
                    if (distance(this.x, this.y, trap.x, trap.y) < 120) {
                        trap.destroyed = true;
                    }
                });
                if (player && distance(this.x, this.y, player.x, player.y) < 120) {
                    player.takeDamage(20);
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#dc2626';
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff4500';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-12, -4, 24, 8);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔥', 0, 0);
            ctx.restore();
        }
    }

    // --- Jump Pad Class ---
    class JumpPad {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 22;
            this.cooldown = 0;
        }

        update(dt) {
            if (this.cooldown > 0) this.cooldown -= dt;

            if (this.cooldown <= 0 && player && distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
                this.cooldown = 1200;
                soundFX.playPowerup();
                showToast('🌀 LÒ XO BẮN SIÊU TỐC!');

                const boostDist = 220;
                player.x = clamp(player.x + Math.cos(player.angle) * boostDist, player.radius, ARENA.width - player.radius);
                player.y = clamp(player.y + Math.sin(player.angle) * boostDist, player.radius, ARENA.height - player.radius);

                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle({
                        x: this.x, y: this.y,
                        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                        radius: 5, color: '#00f0ff', life: 0.3
                    }));
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00f0ff';
            ctx.font = '16px "Font Awesome 6 Free"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌀', 0, 0);
            ctx.restore();
        }
    }

    // --- Trap Class ---
    class Trap {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'electric', 'sawblade', 'landmine', 'vortex'
            this.radius = type === 'sawblade' ? 24 : 20;
            this.timer = Math.random() * 1000;
            this.moveDir = 1;
            this.startX = x;
        }

        update(dt) {
            this.timer += dt;

            if (this.type === 'sawblade') {
                // Move back and forth along 150px range
                this.x += this.moveDir * 1.8;
                if (Math.abs(this.x - this.startX) > 120) this.moveDir *= -1;
            }

            // Check collision with Player
            if (player && distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
                if (this.type === 'landmine') {
                    createExplosion(this.x, this.y, '#ff3366', true);
                    player.takeDamage(45);
                    this.destroyed = true;
                } else if (this.type === 'sawblade') {
                    player.takeDamage(0.6);
                } else if (this.type === 'electric' && Math.floor(this.timer / 1500) % 2 === 0) {
                    player.takeDamage(1.5);
                }
            }

            // Check collision with Enemy Bots
            bots.forEach(bot => {
                if (distance(this.x, this.y, bot.x, bot.y) < this.radius + bot.radius) {
                    if (this.type === 'landmine') {
                        createExplosion(this.x, this.y, '#ff3366', true);
                        bot.takeDamage(120);
                        this.destroyed = true;
                    } else if (this.type === 'sawblade') {
                        bot.takeDamage(2.0);
                    } else if (this.type === 'electric') {
                        bot.takeDamage(1.8);
                    }
                }
            });
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            if (this.type === 'electric') {
                const active = Math.floor(this.timer / 1500) % 2 === 0;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = active ? 'rgba(0, 240, 255, 0.4)' : 'rgba(100, 116, 139, 0.3)';
                ctx.strokeStyle = active ? '#00f0ff' : '#64748b';
                ctx.lineWidth = 3;
                if (active) {
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 15;
                }
                ctx.fill();
                ctx.stroke();

                // Lightning bolts icon
                ctx.fillStyle = active ? '#ffd700' : '#475569';
                ctx.font = '16px "Font Awesome 6 Free"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚡', 0, 0);
            } else if (this.type === 'sawblade') {
                const angle = Date.now() * 0.01;
                ctx.rotate(angle);

                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#475569';
                ctx.fill();

                // Teeth
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                for (let i = 0; i < 8; i++) {
                    const a = (i * Math.PI / 4);
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a) * (this.radius - 4), Math.sin(a) * (this.radius - 4));
                    ctx.lineTo(Math.cos(a) * (this.radius + 6), Math.sin(a) * (this.radius + 6));
                    ctx.stroke();
                }
            } else if (this.type === 'landmine') {
                const blink = Math.floor(Date.now() / 300) % 2 === 0;
                ctx.beginPath();
                ctx.arc(0, 0, 14, 0, Math.PI * 2);
                ctx.fillStyle = '#1e293b';
                ctx.strokeStyle = blink ? '#ff0055' : '#64748b';
                ctx.lineWidth = 3;
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = blink ? '#ff0055' : '#000';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // Wave & Progression
    let wave = 1;
    let botsToSpawnInWave = 0;
    let spawnTimer = 0;
    let score = 0;
    let coins = parseInt(localStorage.getItem('bot_arena_coins') || '0', 10);
    
    // Upgrades
    let upgrades = JSON.parse(localStorage.getItem('bot_arena_upgrades') || '{"hp":1,"speed":1,"damage":1}');

    // Camera & Effects
    let camera = { x: 0, y: 0 };
    let screenShake = 0;

    // Touch Joystick State
    let touchJoystick = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0 };

    // --- Helper Functions ---
    function distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // --- Entity Classes ---

    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 22;
            
            let hpBonus = LOADOUTS.armor === 'heavy' ? 50 : 0;
            let speedBonus = LOADOUTS.armor === 'tactical' ? 0.6 : (LOADOUTS.armor === 'heavy' ? -0.4 : 0);
            let dmgBonus = LOADOUTS.helmet === 'bandana' ? 0.2 : 0;

            this.hp = 100 + (upgrades.hp - 1) * 20 + hpBonus;
            this.maxHp = this.hp;
            this.speed = 4.5 + (upgrades.speed - 1) * 0.45 + speedBonus;
            this.damageMultiplier = 1 + (upgrades.damage - 1) * 0.15 + dmgBonus;
            this.angle = 0;
            this.team = 'blue';

            // 4 Equipped Weapon Slots
            this.equippedSlots = ['pistol', 'shotgun', 'rocket', 'plasma'];
            this.ammos = {
                pistol: Infinity,
                shotgun: 40,
                rocket: 15,
                plasma: 60,
                freeze: 50,
                flame: 80,
                tesla: 45,
                katana: 60
            };
            this.activeSlotIndex = 0;
            this.weaponKey = this.equippedSlots[0];
            this.lastShotTime = 0;

            // Power-up durations (ms)
            this.buffs = {
                shield: 0,
                speed: 0,
                damage: 0
            };
        }

        update(dt) {
            // Update buff timers
            for (let b in this.buffs) {
                if (this.buffs[b] > 0) this.buffs[b] -= dt;
            }

            // Movement logic (Support both e.key and e.code for Mac Vietnamese Telex IME)
            let moveX = 0, moveY = 0;
            if (keys['w'] || keys['W'] || keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
            if (keys['s'] || keys['S'] || keys['KeyS'] || keys['ArrowDown']) moveY += 1;
            if (keys['a'] || keys['A'] || keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
            if (keys['d'] || keys['D'] || keys['KeyD'] || keys['ArrowRight']) moveX += 1;

            if (touchJoystick.active) {
                moveX = touchJoystick.moveX;
                moveY = touchJoystick.moveY;
            }

            if (moveX !== 0 || moveY !== 0) {
                const len = Math.hypot(moveX, moveY);
                if (len > 0) {
                    moveX /= len;
                    moveY /= len;
                }
                const currentSpeed = this.buffs.speed > 0 ? this.speed * 1.5 : this.speed;
                this.x += moveX * currentSpeed;
                this.y += moveY * currentSpeed;
            }

            // Keep in Arena bounds
            this.x = clamp(this.x, this.radius, ARENA.width - this.radius);
            this.y = clamp(this.y, this.radius, ARENA.height - this.radius);

            // Aiming angle
            if (autoAim && bots.length > 0) {
                // Find closest enemy bot
                let closest = null;
                let minDist = Infinity;
                bots.forEach(bot => {
                    if (bot.team !== this.team) {
                        const d = distance(this.x, this.y, bot.x, bot.y);
                        if (d < minDist) {
                            minDist = d;
                            closest = bot;
                        }
                    }
                });
                if (closest && minDist < 600) {
                    this.angle = Math.atan2(closest.y - this.y, closest.x - this.x);
                } else {
                    const worldMouseX = mousePos.x + camera.x;
                    const worldMouseY = mousePos.y + camera.y;
                    this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);
                }
            } else {
                const worldMouseX = mousePos.x + camera.x;
                const worldMouseY = mousePos.y + camera.y;
                this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);
            }

            // Auto-fire or click fire
            if (isMouseDown || keys[' ']) {
                this.shoot();
            }
        }

        shoot() {
            const now = Date.now();
            const w = WEAPONS[this.weaponKey] || WEAPONS.pistol;
            if (now - this.lastShotTime < w.cooldown) return;

            if (this.weaponKey !== 'pistol') {
                const currentAmmo = this.ammos[this.weaponKey] || 0;
                if (currentAmmo <= 0) {
                    showToast('❌ HẾT ĐẠN! TỰ ĐỔI SÚNG NGẮN!');
                    this.activeSlotIndex = 0;
                    this.weaponKey = 'pistol';
                    updateHUDWeapon();
                    return;
                }
                this.ammos[this.weaponKey]--;
                updateHUDWeapon();
            }

            this.lastShotTime = now;
            soundFX.playShoot(this.weaponKey);

            const dmg = w.damage * this.damageMultiplier * (this.buffs.damage > 0 ? 2 : 1);

            for (let i = 0; i < w.count; i++) {
                const spreadAngle = (Math.random() - 0.5) * w.spread;
                const finalAngle = this.angle + spreadAngle;

                const vx = Math.cos(finalAngle) * w.speed;
                const vy = Math.sin(finalAngle) * w.speed;

                bullets.push(new Bullet({
                    x: this.x + Math.cos(this.angle) * (this.radius + 6),
                    y: this.y + Math.sin(this.angle) * (this.radius + 6),
                    vx: vx,
                    vy: vy,
                    radius: w.isRocket ? 7 : 5,
                    damage: dmg,
                    color: w.color,
                    team: this.team,
                    isRocket: w.isRocket,
                    isFreeze: w.isFreeze
                }));
            }

            // Muzzle flash particle
            particles.push(new Particle({
                x: this.x + Math.cos(this.angle) * (this.radius + 10),
                y: this.y + Math.sin(this.angle) * (this.radius + 10),
                vx: Math.cos(this.angle) * 2,
                vy: Math.sin(this.angle) * 2,
                radius: 8,
                color: w.color,
                life: 0.1
            }));
        }

        takeDamage(amount) {
            if (this.buffs.shield > 0) {
                // Shield absorbs hit
                particles.push(new Particle({
                    x: this.x, y: this.y, vx: 0, vy: 0, radius: 30, color: '#00f0ff', life: 0.25
                }));
                return;
            }

            this.hp -= amount;
            screenShake = Math.max(screenShake, 8);
            soundFX.playHit();

            floatingTexts.push(new FloatingText(this.x, this.y - 20, `-${Math.round(amount)}`, '#ff3366'));

            if (this.hp <= 0) {
                this.hp = 0;
                endGame(false);
            }
            updateHUDHealth();
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Draw shield glow if active
            if (this.buffs.shield > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 18;
                ctx.stroke();
            }

            ctx.rotate(this.angle);

            // --- HUMAN PLAYER CHARACTER DRAWING ---
            
            // 1. Human Feet / Boots
            const walkCycle = Math.sin(Date.now() * 0.015) * 6;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(-6, -14 + walkCycle, 6, 0, Math.PI * 2); // Left boot
            ctx.arc(-6, 14 - walkCycle, 6, 0, Math.PI * 2);  // Right boot
            ctx.fill();

            // 2. Body / Armor (Tactical Vest)
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
            ctx.fillStyle = '#0284c7'; // Hero Blue Uniform
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.fill();

            // Tactical Armor Plate
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-8, -10, 14, 20);

            // 3. Human Head & Face
            ctx.beginPath();
            ctx.arc(-2, 0, 11, 0, Math.PI * 2);
            ctx.fillStyle = '#f1c27d'; // Human Skin tone
            ctx.shadowBlur = 0;
            ctx.fill();

            // Hair / Hero Bandana
            ctx.fillStyle = '#ff007f'; // Vibrant Hero Bandana
            ctx.beginPath();
            ctx.arc(-4, 0, 11, Math.PI * 0.5, Math.PI * 1.5);
            ctx.fill();

            // Human Eyes
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(3, -4, 2, 0, Math.PI * 2); // Left eye
            ctx.arc(3, 4, 2, 0, Math.PI * 2);  // Right eye
            ctx.fill();

            // 4. Human Arms & Hands holding Gun
            ctx.fillStyle = '#f1c27d';
            ctx.beginPath();
            ctx.arc(10, -8, 4, 0, Math.PI * 2); // Left Hand
            ctx.arc(14, 4, 4, 0, Math.PI * 2);  // Right Hand
            ctx.fill();

            // 5. Weapon Barrel
            const wColor = WEAPONS[this.weaponKey].color;
            ctx.fillStyle = wColor;
            ctx.fillRect(12, -3, 20, 7);
            ctx.fillStyle = '#475569';
            ctx.fillRect(8, -2, 6, 5);

            ctx.restore();
        }
    }

    class Bot {
        constructor(x, y, type = 'gunner', team = 'red') {
            this.x = x;
            this.y = y;
            this.type = type; // 'speedy', 'gunner', 'tank', 'sniper', 'boss'
            this.team = team;
            this.angle = 0;

            this.frozenTimer = 0;

            if (type === 'speedy') {
                this.radius = 16;
                this.maxHp = 40;
                this.speed = 3.8;
                this.color = '#ff9900';
                this.shootCooldown = 99999;
                this.damage = 30; // Contact explosion damage
            } else if (type === 'gunner') {
                this.radius = 20;
                this.maxHp = 75;
                this.speed = 2.4;
                this.color = '#ff3366';
                this.shootCooldown = 1200;
                this.damage = 15;
            } else if (type === 'tank') {
                this.radius = 30;
                this.maxHp = 220;
                this.speed = 1.4;
                this.color = '#9d4edd';
                this.shootCooldown = 1800;
                this.damage = 30;
            } else if (type === 'sniper') {
                this.radius = 18;
                this.maxHp = 60;
                this.speed = 2.0;
                this.color = '#39ff14';
                this.shootCooldown = 2500;
                this.damage = 45;
                this.aimingTimer = 0;
            } else if (type === 'boss') {
                this.radius = 50;
                this.maxHp = 800 + wave * 200;
                this.speed = 1.0;
                this.color = '#ffd700';
                this.shootCooldown = 900;
                this.damage = 25;
            }

            // Adjust stats by difficulty
            if (difficulty === 'easy') this.maxHp *= 0.7;
            if (difficulty === 'hard') this.maxHp *= 1.3;

            this.hp = this.maxHp;
            this.lastShotTime = Date.now() + Math.random() * 500;
        }

        update(dt) {
            if (this.frozenTimer > 0) {
                this.frozenTimer -= dt;
            }

            // Find target (Player or opposing team bots)
            let target = null;
            if (this.team === 'red') {
                target = player;
            } else {
                // Friendly blue bot targets closest red bot
                let minDist = Infinity;
                bots.forEach(b => {
                    if (b.team === 'red') {
                        const d = distance(this.x, this.y, b.x, b.y);
                        if (d < minDist) {
                            minDist = d;
                            target = b;
                        }
                    }
                });
            }

            if (!target) return;

            const dist = distance(this.x, this.y, target.x, target.y);
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);

            const speedMultiplier = this.frozenTimer > 0 ? 0.4 : 1.0;
            const effSpeed = this.speed * speedMultiplier;

            // AI Behavior by Type
            if (this.type === 'speedy') {
                // Charge straight into target
                this.x += Math.cos(this.angle) * effSpeed;
                this.y += Math.sin(this.angle) * effSpeed;

                if (dist < this.radius + target.radius) {
                    // Explode on contact
                    target.takeDamage(this.damage);
                    this.hp = 0;
                    createExplosion(this.x, this.y, '#ff9900', false);
                }
            } else if (this.type === 'gunner' || this.type === 'boss') {
                // Keep distance ~220px
                if (dist > 220) {
                    this.x += Math.cos(this.angle) * effSpeed;
                    this.y += Math.sin(this.angle) * effSpeed;
                } else if (dist < 160) {
                    this.x -= Math.cos(this.angle) * effSpeed;
                    this.y -= Math.sin(this.angle) * effSpeed;
                }
            } else if (this.type === 'tank') {
                // Slowly advance
                this.x += Math.cos(this.angle) * effSpeed;
                this.y += Math.sin(this.angle) * effSpeed;
            } else if (this.type === 'sniper') {
                // Stay far
                if (dist > 350) {
                    this.x += Math.cos(this.angle) * effSpeed;
                    this.y += Math.sin(this.angle) * effSpeed;
                }
            }

            // Keep inside arena
            this.x = clamp(this.x, this.radius, ARENA.width - this.radius);
            this.y = clamp(this.y, this.radius, ARENA.height - this.radius);

            // Shooting logic
            const now = Date.now();
            if (now - this.lastShotTime > this.shootCooldown) {
                this.shoot(target);
                this.lastShotTime = now;
            }
        }

        shoot(target) {
            if (this.type === 'speedy') return;

            if (this.type === 'boss') {
                // Boss shoots 8-directional bullet ring
                for (let i = 0; i < 8; i++) {
                    const ringAngle = this.angle + (i * Math.PI / 4);
                    bullets.push(new Bullet({
                        x: this.x + Math.cos(ringAngle) * (this.radius + 5),
                        y: this.y + Math.sin(ringAngle) * (this.radius + 5),
                        vx: Math.cos(ringAngle) * 7,
                        vy: Math.sin(ringAngle) * 7,
                        radius: 7,
                        damage: 20,
                        color: '#ffd700',
                        team: this.team
                    }));
                }
                soundFX.playShoot('shotgun');
            } else if (this.type === 'tank') {
                bullets.push(new Bullet({
                    x: this.x + Math.cos(this.angle) * (this.radius + 5),
                    y: this.y + Math.sin(this.angle) * (this.radius + 5),
                    vx: Math.cos(this.angle) * 5,
                    vy: Math.sin(this.angle) * 5,
                    radius: 10,
                    damage: this.damage,
                    color: '#9d4edd',
                    team: this.team
                }));
                soundFX.playShoot('plasma');
            } else {
                // Gunner / Sniper
                bullets.push(new Bullet({
                    x: this.x + Math.cos(this.angle) * (this.radius + 5),
                    y: this.y + Math.sin(this.angle) * (this.radius + 5),
                    vx: Math.cos(this.angle) * 9,
                    vy: Math.sin(this.angle) * 9,
                    radius: 5,
                    damage: this.damage,
                    color: this.color,
                    team: this.team
                }));
                soundFX.playShoot('pistol');
            }
        }

        takeDamage(amount, isFreeze = false) {
            this.hp -= amount;
            if (isFreeze) this.frozenTimer = 2500;

            soundFX.playHit();
            floatingTexts.push(new FloatingText(this.x, this.y - 15, `-${Math.round(amount)}`, '#00f0ff'));

            if (this.hp <= 0) {
                this.hp = 0;
                createExplosion(this.x, this.y, this.color, this.type === 'boss');

                // Reward score & coins
                const coinEarned = this.type === 'boss' ? 25 : (this.type === 'tank' ? 5 : 2);
                score += this.type === 'boss' ? 500 : 100;
                coins += coinEarned;
                saveUserData();
                updateHUDStats();

                // Drop powerup randomly
                if (Math.random() < (this.type === 'boss' ? 1.0 : 0.2)) {
                    spawnRandomPowerUp(this.x, this.y);
                }
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            // Frozen effect
            if (this.frozenTimer > 0) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 210, 255, 0.45)';
                ctx.fill();
            }

            ctx.rotate(this.angle);

            // --- CYBER ROBOT OPPONENT DRAWING (ROBOT CƠ KHÍ ĐẤU VỚI CON NGƯỜI) ---

            // 1. Robot Metal Treads / Mechanical Legs
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-this.radius, -this.radius * 0.85, this.radius * 0.7, 5); // Upper Tread
            ctx.fillRect(-this.radius, this.radius * 0.85 - 5, this.radius * 0.7, 5); // Lower Tread

            // 2. Main Metallic Robot Body Core
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
            ctx.fillStyle = this.team === 'blue' ? '#2563eb' : '#334155'; // Dark Steel Body
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
            ctx.fill();

            // Steel Armor Plate Overlay
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.radius * 0.5, -this.radius * 0.6, this.radius, this.radius * 1.2);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-this.radius * 0.5, -this.radius * 0.6, this.radius, this.radius * 1.2);

            // 3. Glowing Robot Sensor Eye / Laser Visor
            ctx.fillStyle = this.team === 'blue' ? '#00f0ff' : '#ff0055'; // Red Glowing Eye
            ctx.shadowColor = this.team === 'blue' ? '#00f0ff' : '#ff0055';
            ctx.shadowBlur = 10;
            ctx.fillRect(2, -4, 8, 8);
            ctx.shadowBlur = 0;

            // Antenna Spike for Robot
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(-this.radius - 4, 0);
            ctx.stroke();
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.arc(-this.radius - 4, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            // 4. Robot Mechanical Turret Gun
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(6, -4, 16, 8);
            ctx.fillStyle = this.color;
            ctx.fillRect(10, -2, 14, 4);

            ctx.restore();

            // Floating HP bar
            if (this.hp < this.maxHp) {
                const barWidth = this.radius * 2.2;
                const pct = Math.max(0, this.hp / this.maxHp);
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 14, barWidth, 6);
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 14, barWidth * pct, 6);
            }
        }
    }

    class Bullet {
        constructor({ x, y, vx, vy, radius, damage, color, team, isRocket = false, isFreeze = false }) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.radius = radius;
            this.damage = damage;
            this.color = color;
            this.team = team;
            this.isRocket = isRocket;
            this.isFreeze = isFreeze;
            this.life = 2.5; // seconds
        }

        update(dt) {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= dt / 1000;

            // Rocket smoke trail
            if (this.isRocket && Math.random() < 0.6) {
                particles.push(new Particle({
                    x: this.x, y: this.y,
                    vx: (Math.random() - 0.5) * 1, vy: (Math.random() - 0.5) * 1,
                    radius: 4, color: '#ff6b00', life: 0.2
                }));
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
        }
    }

    class PowerUp {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'shield', 'health', 'speed', 'nuke', 'damage', 'shotgun', 'rocket', 'laser', 'freeze'
            this.radius = 16;
            this.pulse = 0;
        }

        update(dt) {
            this.pulse += dt * 0.005;
        }

        draw(ctx) {
            const floatOffsetY = Math.sin(this.pulse) * 4;
            ctx.save();
            ctx.translate(this.x, this.y + floatOffsetY);

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.stroke();

            // Icon
            ctx.fillStyle = '#fff';
            ctx.font = '14px "Font Awesome 6 Free"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let symbol = '🎁';
            if (this.type === 'shield') symbol = '🛡️';
            if (this.type === 'health') symbol = '❤️';
            if (this.type === 'speed') symbol = '⚡';
            if (this.type === 'nuke') symbol = '💣';
            if (this.type === 'damage') symbol = '🔥';
            if (this.type === 'shotgun') symbol = '💥';
            if (this.type === 'rocket') symbol = '🚀';
            if (this.type === 'laser') symbol = '⚡';
            if (this.type === 'freeze') symbol = '❄️';

            ctx.fillText(symbol, 0, 1);
            ctx.restore();
        }
    }

    class Particle {
        constructor({ x, y, vx, vy, radius, color, life }) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.radius = radius;
            this.color = color;
            this.maxLife = life;
            this.life = life;
        }

        update(dt) {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= dt / 1000;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(x, y, text, color) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.life = 0.8; // seconds
        }

        update(dt) {
            this.y -= 0.6;
            this.life -= dt / 1000;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life / 0.8);
            ctx.font = 'bold 16px "Baloo 2", sans-serif';
            ctx.fillStyle = this.color;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    // --- Core Systems & Event Handlers ---

    function createExplosion(x, y, color, isBig = false) {
        soundFX.playExplosion(isBig);
        screenShake = isBig ? 18 : 6;
        const count = isBig ? 30 : 12;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = (Math.random() * 4 + 1) * (isBig ? 2 : 1);
            particles.push(new Particle({
                x: x, y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: Math.random() * 4 + 2,
                color: color,
                life: Math.random() * 0.4 + 0.2
            }));
        }
    }

    function spawnRandomPowerUp(x, y) {
        const types = ['shield', 'health', 'speed', 'nuke', 'damage', 'shotgun', 'rocket', 'laser', 'freeze', 'flame', 'tesla', 'katana'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push(new PowerUp(x, y, type));
    }

    function triggerNuke() {
        soundFX.playExplosion(true);
        screenShake = 25;
        bots.forEach(b => {
            if (b.team === 'red') b.takeDamage(500);
        });
        showToast('💣 BOM HẠT NHÂN DỌN SẠCH BẮN TOÀN BỘ BOT!');
    }

    function initGame() {
        score = 0;
        wave = 1;
        player = new Player(ARENA.width / 2, ARENA.height / 2);
        bots = [];
        bullets = [];
        powerups = [];
        particles = [];
        floatingTexts = [];
        traps = [];
        barrels = [];
        jumpPads = [];

        updateHUDStats();
        updateHUDHealth();
        updateHUDWeapon();
        startWave(1);
    }

    function startWave(w) {
        wave = w;
        botsToSpawnInWave = 4 + wave * 3;
        spawnTimer = 0;

        // Spawn Arena Traps, Barrels & Jump Pads
        traps = [];
        barrels = [];
        jumpPads = [];

        const trapTypes = ['electric', 'sawblade', 'landmine'];
        for (let i = 0; i < 4 + Math.min(6, wave); i++) {
            const tx = 150 + Math.random() * (ARENA.width - 300);
            const ty = 150 + Math.random() * (ARENA.height - 300);
            const tType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
            traps.push(new Trap(tx, ty, tType));
        }

        // Spawn Explosive Barrels
        for (let i = 0; i < 4; i++) {
            const bx = 120 + Math.random() * (ARENA.width - 240);
            const by = 120 + Math.random() * (ARENA.height - 240);
            barrels.push(new ExplosiveBarrel(bx, by));
        }

        // Spawn Jump Pads
        for (let i = 0; i < 3; i++) {
            const jx = 180 + Math.random() * (ARENA.width - 360);
            const jy = 180 + Math.random() * (ARENA.height - 360);
            jumpPads.push(new JumpPad(jx, jy));
        }

        const waveTitle = document.getElementById('wave-hud');
        if (waveTitle) waveTitle.textContent = `ĐỢT ${wave}`;

        showToast(`🌊 ĐỢT ${wave}: CÓ THÙNG DẦU NỔ 🛢️ & LÒ XO NHẢY 🌀!`);

        // If Team mode, spawn 2 friendly blue bots
        if (gameMode === 'team' && bots.filter(b => b.team === 'blue').length < 2) {
            bots.push(new Bot(player.x + 40, player.y + 40, 'gunner', 'blue'));
            bots.push(new Bot(player.x - 40, player.y - 40, 'gunner', 'blue'));
        }
    }

    function spawnBotLogic(dt) {
        if (botsToSpawnInWave <= 0) return;

        spawnTimer += dt;
        if (spawnTimer > 1000) {
            spawnTimer = 0;
            botsToSpawnInWave--;

            // Pick spawn edge
            let sx, sy;
            if (Math.random() < 0.5) {
                sx = Math.random() < 0.5 ? 20 : ARENA.width - 20;
                sy = Math.random() * ARENA.height;
            } else {
                sx = Math.random() * ARENA.width;
                sy = Math.random() < 0.5 ? 20 : ARENA.height - 20;
            }

            // Pick type
            let type = 'gunner';
            if (wave % 5 === 0 && botsToSpawnInWave === 0) {
                type = 'boss';
                showToast('👑 CẢNH BÁO: TRÙM ROBOT KHỔNG LỒ XUẤT HIỆN!');
            } else {
                const rand = Math.random();
                if (rand < 0.3) type = 'speedy';
                else if (rand < 0.6) type = 'gunner';
                else if (rand < 0.85) type = 'tank';
                else type = 'sniper';
            }

            bots.push(new Bot(sx, sy, type, 'red'));
        }
    }

    function endGame(isVictory) {
        gameState = isVictory ? 'VICTORY' : 'GAMEOVER';

        const modalEnd = document.getElementById('modal-end');
        const endIcon = document.getElementById('end-icon');
        const endTitle = document.getElementById('end-title');
        const endSub = document.getElementById('end-sub');
        const endScore = document.getElementById('end-score');
        const endCoins = document.getElementById('end-coins');

        if (isVictory) {
            soundFX.playWin();
            endIcon.innerHTML = '<i class="fa-solid fa-crown text-yellow"></i>';
            endTitle.textContent = 'CHIẾN THẮNG!';
            endSub.textContent = 'Bé đã xuất sắc đánh bại toàn bộ các đợt Bot!';
        } else {
            endIcon.innerHTML = '<i class="fa-solid fa-face-frown text-red"></i>';
            endTitle.textContent = 'THẤT BẠI!';
            endSub.textContent = 'Đừng nản lòng, hãy thử lại để bắn gục Bot nhé!';
        }

        endScore.textContent = score;
        endCoins.textContent = Math.floor(score / 10);
        coins += Math.floor(score / 10);
        saveUserData();

        if (modalEnd) modalEnd.classList.add('active');
    }

    function updateHUDStats() {
        document.getElementById('score-hud').textContent = score;
        document.getElementById('coins-hud').innerHTML = `<i class="fa-solid fa-coins"></i> ${coins}`;
        const remainingRed = bots.filter(b => b.team === 'red').length + botsToSpawnInWave;
        document.getElementById('bots-left-hud').innerHTML = `<i class="fa-solid fa-skull"></i> Bot Còn Lại: ${remainingRed}`;
    }

    function updateHUDHealth() {
        if (!player) return;
        const pct = Math.max(0, (player.hp / player.maxHp) * 100);
        document.getElementById('hp-fill').style.width = `${pct}%`;
        document.getElementById('hp-text').textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
    }

    function selectWeaponSlot(idx) {
        if (!player) return;
        player.activeSlotIndex = (idx + 4) % 4;
        player.weaponKey = player.equippedSlots[player.activeSlotIndex];
        updateHUDWeapon();
        soundFX.playPowerup();
        const w = WEAPONS[player.weaponKey];
        showToast(`🔫 ĐÃ ĐỔI SÚNG: ${w.name.toUpperCase()}`);
    }

    function updateHUDWeapon() {
        if (!player) return;
        const slots = document.querySelectorAll('.weapon-slot');
        slots.forEach((slot, i) => {
            const isSel = i === player.activeSlotIndex;
            slot.classList.toggle('active', isSel);
            const key = player.equippedSlots[i];
            const ammoEl = document.getElementById(`ammo-${i}`);
            if (ammoEl) {
                const count = player.ammos[key];
                ammoEl.textContent = count === Infinity ? '∞' : count;
            }
        });
    }

    function saveUserData() {
        localStorage.setItem('bot_arena_coins', coins.toString());
        localStorage.setItem('bot_arena_upgrades', JSON.stringify(upgrades));
    }

    // --- Main Game Loop ---
    let lastTime = 0;

    function gameLoop(timestamp) {
        const dt = lastTime ? Math.min(100, timestamp - lastTime) : 16;
        lastTime = timestamp;

        try {
            if (gameState === 'PLAYING' && player) {
                // 1. Logic Update
                player.update(dt);
                spawnBotLogic(dt);

                // Update Bots
                for (let i = bots.length - 1; i >= 0; i--) {
                    bots[i].update(dt);
                    if (bots[i].hp <= 0) {
                        bots.splice(i, 1);
                    }
                }

                // Wave completion check
                if (botsToSpawnInWave <= 0 && bots.filter(b => b.team === 'red').length === 0) {
                    if (wave >= 10) {
                        endGame(true);
                    } else {
                        startWave(wave + 1);
                    }
                }

                // Update Bullets & Collisions
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const b = bullets[i];
                    b.update(dt);

                    if (b.life <= 0 || b.x < 0 || b.x > ARENA.width || b.y < 0 || b.y > ARENA.height) {
                        bullets.splice(i, 1);
                        continue;
                    }

                    // Check collision with Player
                    if (b.team !== player.team && distance(b.x, b.y, player.x, player.y) < b.radius + player.radius) {
                        player.takeDamage(b.damage);
                        bullets.splice(i, 1);
                        continue;
                    }

                    // Check collision with Bots
                    let hitBot = false;
                    for (let j = 0; j < bots.length; j++) {
                        const bot = bots[j];
                        if (b.team !== bot.team && distance(b.x, b.y, bot.x, bot.y) < b.radius + bot.radius) {
                            bot.takeDamage(b.damage, b.isFreeze);

                            if (b.isRocket) {
                                createExplosion(b.x, b.y, '#ff3366', true);
                                // Splash damage to nearby bots
                                bots.forEach(other => {
                                    if (other !== bot && distance(b.x, b.y, other.x, other.y) < 100) {
                                        other.takeDamage(b.damage * 0.6);
                                    }
                                });
                            }

                            hitBot = true;
                            bullets.splice(i, 1);
                            break;
                        }
                    }
                    // Check collision with Explosive Barrels
                    for (let k = 0; k < barrels.length; k++) {
                        const br = barrels[k];
                        if (!br.destroyed && distance(b.x, b.y, br.x, br.y) < b.radius + br.radius) {
                            br.takeDamage(b.damage);
                            bullets.splice(i, 1);
                            break;
                        }
                    }
                }

                // Update Powerups pickup
                for (let i = powerups.length - 1; i >= 0; i--) {
                    const p = powerups[i];
                    p.update(dt);
                    if (distance(player.x, player.y, p.x, p.y) < player.radius + p.radius) {
                        soundFX.playPowerup();
                        if (p.type === 'shield') {
                            player.buffs.shield = 6000;
                            showToast('🛡️ ĐÃ BẬT KHIÊN NĂNG LƯỢNG!');
                        } else if (p.type === 'health') {
                            player.hp = Math.min(player.maxHp, player.hp + 40);
                            updateHUDHealth();
                            showToast('❤️ HỒI MÁU CẤP TỐC!');
                        } else if (p.type === 'speed') {
                            player.buffs.speed = 5000;
                            showToast('⚡ TĂNG TỐC ĐỘ DI CHUYỂN!');
                        } else if (p.type === 'nuke') {
                            triggerNuke();
                        } else if (p.type === 'damage') {
                            player.buffs.damage = 5000;
                            showToast('🔥 SIÊU SÁT THƯƠNG GẤP ĐÔI!');
                        } else if (WEAPONS[p.type]) {
                            player.equippedSlots[player.activeSlotIndex] = p.type;
                            player.weaponKey = p.type;
                            player.ammos[p.type] = (player.ammos[p.type] || 0) + WEAPONS[p.type].ammo;
                            updateHUDWeapon();
                            showToast(`🔫 ĐÃ TRANG BỊ & NẠP ĐẠN: ${WEAPONS[p.type].name.toUpperCase()}!`);
                        }
                        powerups.splice(i, 1);
                    }
                }

                // Update Particles & Floating Text
                for (let i = particles.length - 1; i >= 0; i--) {
                    particles[i].update(dt);
                    if (particles[i].life <= 0) particles.splice(i, 1);
                }
                for (let i = floatingTexts.length - 1; i >= 0; i--) {
                    floatingTexts[i].update(dt);
                    if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
                }

                // Update Camera follow Player
                camera.x = player.x - viewportWidth / 2;
                camera.y = player.y - viewportHeight / 2;
                camera.x = clamp(camera.x, 0, ARENA.width - viewportWidth);
                camera.y = clamp(camera.y, 0, ARENA.height - viewportHeight);

                // Update Traps, Barrels & JumpPads
                for (let i = traps.length - 1; i >= 0; i--) {
                    traps[i].update(dt);
                    if (traps[i].destroyed) traps.splice(i, 1);
                }
                for (let i = barrels.length - 1; i >= 0; i--) {
                    if (barrels[i].destroyed) barrels.splice(i, 1);
                }
                for (let i = jumpPads.length - 1; i >= 0; i--) {
                    jumpPads[i].update(dt);
                }

                // Screen Shake decay
                if (screenShake > 0) screenShake *= 0.9;
                updateHUDStats();
            }

        // 2. Render Phase
        ctx.clearRect(0, 0, viewportWidth, viewportHeight);
        ctx.save();

        // Apply Screen Shake
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

        // Draw Arena Grid Boundary
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.strokeRect(0, 0, ARENA.width, ARENA.height);
        ctx.shadowBlur = 0;

        // Draw Environment & Interactive Objects
        jumpPads.forEach(j => j.draw(ctx));
        barrels.forEach(b => b.draw(ctx));
        traps.forEach(t => t.draw(ctx));
        powerups.forEach(p => p.draw(ctx));

        // Draw Entities
        if (player) player.draw(ctx);
        bots.forEach(b => b.draw(ctx));
        bullets.forEach(b => b.draw(ctx));
        particles.forEach(p => p.draw(ctx));
        floatingTexts.forEach(t => t.draw(ctx));

        ctx.restore();
        } catch (err) {
            console.error("Game loop error handled:", err);
        }

        requestAnimationFrame(gameLoop);
    }

    // --- Initialization & UI Binding ---

    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);

        window.addEventListener('keydown', e => {
            keys[e.key] = true;
            if (e.code) keys[e.code] = true;
            soundFX.init();

            // Prevent default browser scrolling when playing
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', '1', '2', '3', '4'].includes(e.key) ||
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
                if (gameState === 'PLAYING') e.preventDefault();
            }

            // Quick weapon switch shortcuts during combat
            if (e.key === '1' || e.code === 'Digit1') selectWeaponSlot(0);
            if (e.key === '2' || e.code === 'Digit2') selectWeaponSlot(1);
            if (e.key === '3' || e.code === 'Digit3') selectWeaponSlot(2);
            if (e.key === '4' || e.code === 'Digit4') selectWeaponSlot(3);
            if (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ') selectWeaponSlot(player ? player.activeSlotIndex - 1 : 0);
            if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') selectWeaponSlot(player ? player.activeSlotIndex + 1 : 0);
        });
        window.addEventListener('keyup', e => {
            keys[e.key] = false;
            if (e.code) keys[e.code] = false;
        });

        window.addEventListener('blur', () => {
            keys = {};
        });

        // Mouse wheel weapon switch
        window.addEventListener('wheel', e => {
            if (gameState === 'PLAYING' && player) {
                if (e.deltaY > 0) selectWeaponSlot(player.activeSlotIndex + 1);
                else if (e.deltaY < 0) selectWeaponSlot(player.activeSlotIndex - 1);
            }
        });

        // Click weapon slot HUD to switch
        document.querySelectorAll('.weapon-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const idx = parseInt(slot.dataset.slot, 10);
                selectWeaponSlot(idx);
            });
        });

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            mousePos.x = e.clientX - rect.left;
            mousePos.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', () => {
            isMouseDown = true;
            soundFX.init();
        });
        canvas.addEventListener('mouseup', () => isMouseDown = false);

        // Toggle Auto-Aim Button
        const btnAutoAim = document.getElementById('btn-auto-aim');
        if (btnAutoAim) {
            btnAutoAim.addEventListener('click', () => {
                autoAim = !autoAim;
                btnAutoAim.classList.toggle('active', autoAim);
                document.getElementById('auto-aim-label').textContent = autoAim ? 'Tự Ngắm: BẬT' : 'Tự Ngắm: TẮT';
                showToast(autoAim ? '🎯 Đã BẬT Tự Động Ngắm Bắn' : '🎯 Đã TẮT Tự Động Ngắm Bắn');
            });
        }

        // Sound Toggle Button
        const btnSound = document.getElementById('btn-sound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                soundFX.enabled = !soundFX.enabled;
                const icon = document.getElementById('sound-icon');
                if (icon) icon.className = soundFX.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            });
        }

        // Shop Buttons
        const btnShop = document.getElementById('btn-shop');
        const modalShop = document.getElementById('modal-shop');
        const btnCloseShop = document.getElementById('btn-close-shop');

        if (btnShop && modalShop) {
            btnShop.addEventListener('click', () => {
                document.getElementById('shop-coins-val').textContent = coins;
                updateShopUI();
                modalShop.classList.add('active');
            });
        }
        if (btnCloseShop && modalShop) {
            btnCloseShop.addEventListener('click', () => modalShop.classList.remove('active'));
        }

        // Shop Buy Buttons
        document.getElementById('btn-buy-hp')?.addEventListener('click', () => buyUpgrade('hp', 50));
        document.getElementById('btn-buy-speed')?.addEventListener('click', () => buyUpgrade('speed', 50));
        document.getElementById('btn-buy-damage')?.addEventListener('click', () => buyUpgrade('damage', 75));

        // Start Game Play Button
        document.getElementById('btn-play-game')?.addEventListener('click', () => {
            document.getElementById('modal-start').classList.remove('active');
            gameState = 'PLAYING';
            initGame();
        });

        // Mode Card selection
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                gameMode = card.dataset.mode;
            });
        });

        // Loadout Equipment buttons
        document.querySelectorAll('.loadout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                document.querySelectorAll(`.loadout-btn[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                LOADOUTS[type] = btn.dataset.val;
                showToast(`🛡️ Đã trang bị ${btn.textContent}`);
            });
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                difficulty = btn.dataset.diff;
            });
        });

        // Restart / Menu Buttons
        document.getElementById('btn-restart-game')?.addEventListener('click', () => {
            document.getElementById('modal-end').classList.remove('active');
            gameState = 'PLAYING';
            initGame();
        });
        document.getElementById('btn-menu-game')?.addEventListener('click', () => {
            document.getElementById('modal-end').classList.remove('active');
            document.getElementById('modal-start').classList.add('active');
            gameState = 'MENU';
        });

        // Touch Joystick Binding
        setupTouchControls();
    }

    function buyUpgrade(type, cost) {
        if (coins >= cost) {
            coins -= cost;
            upgrades[type]++;
            saveUserData();
            updateShopUI();
            showToast('🎉 NÂNG CẤP THÀNH CÔNG!');
        } else {
            showToast('❌ BẠN KHÔNG ĐỦ XU!');
        }
    }

    function updateShopUI() {
        document.getElementById('shop-coins-val').textContent = coins;
        document.getElementById('shop-hp-lvl').textContent = `Cấp ${upgrades.hp} (+${(upgrades.hp - 1) * 20} Máu)`;
        document.getElementById('shop-speed-lvl').textContent = `Cấp ${upgrades.speed} (+${(upgrades.speed - 1) * 10}% Tốc)`;
        document.getElementById('shop-damage-lvl').textContent = `Cấp ${upgrades.damage} (+${(upgrades.damage - 1) * 15}% ST)`;
    }

    function setupTouchControls() {
        const touchZone = document.getElementById('touch-controls');
        const joystickZone = document.getElementById('joystick-zone');
        const knob = document.getElementById('joystick-knob');
        const fireBtn = document.getElementById('fire-btn');

        if ('ontouchstart' in window) {
            if (touchZone) touchZone.style.display = 'block';
        }

        if (!joystickZone) return;

        joystickZone.addEventListener('touchstart', e => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joystickZone.getBoundingClientRect();
            touchJoystick.active = true;
            touchJoystick.startX = rect.left + rect.width / 2;
            touchJoystick.startY = rect.top + rect.height / 2;
        });

        window.addEventListener('touchmove', e => {
            if (!touchJoystick.active) return;
            const touch = e.touches[0];
            const dx = touch.clientX - touchJoystick.startX;
            const dy = touch.clientY - touchJoystick.startY;
            const dist = Math.hypot(dx, dy);
            const maxDist = 45;
            const angle = Math.atan2(dy, dx);

            const knobX = Math.cos(angle) * Math.min(dist, maxDist);
            const knobY = Math.sin(angle) * Math.min(dist, maxDist);

            knob.style.transform = `translate(${knobX}px, ${knobY}px)`;
            touchJoystick.moveX = knobX / maxDist;
            touchJoystick.moveY = knobY / maxDist;
        });

        window.addEventListener('touchend', () => {
            touchJoystick.active = false;
            touchJoystick.moveX = 0;
            touchJoystick.moveY = 0;
            knob.style.transform = 'translate(0px, 0px)';
        });

        fireBtn.addEventListener('touchstart', e => {
            e.preventDefault();
            isMouseDown = true;
        });
        fireBtn.addEventListener('touchend', () => isMouseDown = false);
    }

    function resizeCanvas() {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight - 60; // subtract top navbar height
        if (canvas) {
            canvas.width = viewportWidth;
            canvas.height = viewportHeight;
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();
        setupEventListeners();
        requestAnimationFrame(gameLoop);
    });

})();
