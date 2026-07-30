/* =========================================================
   BASKETBALL DUEL — Song đấu bóng rổ 2 người trên cùng 1 máy
   Người chơi 1: phím A (hoặc chạm nửa TRÁI màn hình)
   Người chơi 2: phím L (hoặc chạm nửa PHẢI màn hình)
   ========================================================= */
(() => {
    'use strict';

    // ---------- Toạ độ thế giới ----------
    // Mỗi người chơi có một nửa sân riêng, dùng chung hệ toạ độ nội bộ
    // (rổ luôn nằm bên TRÁI của nửa sân). Nửa sân của P2 được vẽ lật gương.
    const CW = 600;                 // rộng của một nửa sân
    const CH = 680;                 // cao của sân
    const W = CW * 2, H = CH;       // kích thước canvas logic

    const FLOOR_Y = 600;
    const BOARD_X = 86, BOARD_TOP = 96, BOARD_BOT = 264;
    const RIM_Y = 252, RIM_X1 = 98, RIM_X2 = 170, RIM_R = 5;
    const BALL_R = 15;

    const G = 1100;                                     // trọng lực
    const POWER_MIN = 500, POWER_MAX = 1060;            // lực ném
    // Dải góc đã hiệu chỉnh: mọi góc trong dải này đều ném vào rổ được ở một
    // khoảng cách nào đó (đứng gần cần góc cao, đứng xa cần góc thấp hơn).
    const ANGLE_MIN = 50 * Math.PI / 180;
    const ANGLE_MAX = 84 * Math.PI / 180;
    const ANGLE_SPEED = 0.42;                           // rad/giây
    const POWER_SPEED = 1.55;                           // đơn vị/giây (0..1 rồi quay lại)

    const THREE_LINE = 398;         // đứng xa hơn vạch này => 3 điểm
    const SPOT_MIN = 288, SPOT_MAX = 548;
    const MATCH_TIME = 90;

    const REL_DX = -28, REL_DY = -152;   // điểm rời tay so với chân người chơi

    // ---------- Tiện ích ----------
    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rnd = (a, b) => a + Math.random() * (b - a);

    // Bộ sinh số giả ngẫu nhiên cố định (để khán đài không nhấp nháy mỗi khung hình)
    function seeded(seed) {
        let s = seed >>> 0;
        return () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        };
    }

    // ---------- Âm thanh ----------
    const Sfx = {
        actx: null,
        on: true,
        ensure() {
            if (!this.actx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.actx = new AC();
            }
            if (this.actx && this.actx.state === 'suspended') this.actx.resume();
            return this.actx;
        },
        tone(freq, dur, type = 'sine', vol = 0.18, slideTo = null) {
            if (!this.on) return;
            const ac = this.ensure();
            if (!ac) return;
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, ac.currentTime);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), ac.currentTime + dur);
            g.gain.setValueAtTime(0.0001, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
            o.connect(g); g.connect(ac.destination);
            o.start(); o.stop(ac.currentTime + dur + 0.02);
        },
        noise(dur = 0.16, vol = 0.14, hp = 900) {
            if (!this.on) return;
            const ac = this.ensure();
            if (!ac) return;
            const len = Math.floor(ac.sampleRate * dur);
            const buf = ac.createBuffer(1, len, ac.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            const src = ac.createBufferSource(); src.buffer = buf;
            const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
            const g = ac.createGain(); g.gain.value = vol;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },
        charge(t) { this.tone(320 + t * 520, 0.05, 'square', 0.05); },
        shoot() { this.tone(520, 0.16, 'triangle', 0.14, 180); this.noise(0.1, 0.06, 1400); },
        bounceRim() { this.tone(240, 0.1, 'square', 0.1, 150); },
        bounceFloor() { this.tone(120, 0.12, 'sine', 0.14, 70); },
        swish() { this.noise(0.28, 0.13, 2200); this.tone(880, 0.14, 'sine', 0.1, 1320); },
        score(pts) {
            const base = pts >= 3 ? 660 : 560;
            [0, 0.09, 0.18].forEach((d, i) => setTimeout(() => this.tone(base * Math.pow(1.26, i), 0.16, 'triangle', 0.16), d * 1000));
        },
        miss() { this.tone(200, 0.18, 'sawtooth', 0.07, 120); },
        fire() { this.tone(420, 0.3, 'sawtooth', 0.1, 980); },
        tick() { this.tone(880, 0.07, 'square', 0.1); },
        buzzer() { this.tone(180, 0.9, 'square', 0.2, 120); },
        win() {
            [523, 659, 784, 1046].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.32, 'triangle', 0.18), i * 130));
        }
    };

    // ---------- Cấu hình 2 người chơi ----------
    const PLAYERS = [
        { name: 'NGƯỜI CHƠI 1', emoji: '🐯', jersey: '#ff8a1a', jersey2: '#c4530a', skin: '#f5c396', hair: '#2b1b12', num: '1', accent: '#ffb347' },
        { name: 'NGƯỜI CHƠI 2', emoji: '🐼', jersey: '#00d0ff', jersey2: '#0470a0', skin: '#e8b98a', hair: '#1a1a24', num: '2', accent: '#7fe8ff' }
    ];

    // =========================================================
    //  Nửa sân của một người chơi
    // =========================================================
    class Court {
        constructor(idx) {
            this.idx = idx;
            this.mirror = idx === 1;
            this.cfg = PLAYERS[idx];
            this.reset();
        }

        reset() {
            this.score = 0;
            this.shots = 0;
            this.made = 0;
            this.swishes = 0;
            this.streak = 0;
            this.bestStreak = 0;
            this.onFire = false;

            this.state = 'aim';       // aim | charge | fly | result
            this.resultT = 0;
            this.px = 430;
            this.angle = ANGLE_MIN;
            this.angleDir = 1;
            this.power = 0;
            this.powerDir = 1;
            this.chargeHold = 0;
            this.chargeBeep = 0;
            this.armed = true;        // phải nhả phím rồi bấm lại mới ném tiếp

            this.ball = null;
            this.popups = [];
            this.particles = [];
            this.netSwing = 0;
            this.netSwingV = 0;
            this.bodyBob = 0;
            this.followThrough = 0;
            this.hoopFlash = 0;
            this.scorePulse = 0;
            this.newSpot();
        }

        get isThree() { return this.px >= THREE_LINE; }
        get relX() { return this.px + REL_DX; }
        get relY() { return FLOOR_Y + REL_DY; }

        newSpot() {
            // Đổi chỗ đứng sau mỗi lần ném để trận đấu luôn mới mẻ
            let nx;
            let guard = 0;
            do {
                nx = rnd(SPOT_MIN, SPOT_MAX);
                guard++;
            } while (Math.abs(nx - this.px) < 70 && guard < 12);
            this.px = nx;
            this.angle = ANGLE_MIN;
            this.angleDir = 1;
            this.power = 0;
            this.powerDir = 1;
        }

        // ----- Điều khiển -----
        press() {
            if (this.state !== 'aim' || !this.armed) return;
            this.state = 'charge';
            this.power = 0;
            this.powerDir = 1;
            this.chargeHold = 0;
            this.chargeBeep = 0;
        }

        release() {
            if (this.state !== 'charge') return;
            this.shoot();
        }

        shoot() {
            const speed = lerp(POWER_MIN, POWER_MAX, this.power);
            this.ball = {
                x: this.relX, y: this.relY,
                vx: -Math.cos(this.angle) * speed,
                vy: -Math.sin(this.angle) * speed,
                spin: 0,
                trail: [],
                hitRim: false,
                hitBoard: false,
                scored: false,
                bounces: 0,
                alive: true,
                life: 0,
                fire: this.onFire
            };
            this.state = 'fly';
            this.shots++;
            this.armed = false;
            this.followThrough = 0.55;
            Sfx.shoot();
        }

        // ----- Cập nhật -----
        update(dt, held) {
            if (!held) this.armed = true;

            this.netSwingV += -this.netSwing * 90 * dt;
            this.netSwingV *= Math.pow(0.02, dt);
            this.netSwing += this.netSwingV * dt;
            this.hoopFlash = Math.max(0, this.hoopFlash - dt * 2.2);
            this.scorePulse = Math.max(0, this.scorePulse - dt * 1.6);
            this.followThrough = Math.max(0, this.followThrough - dt);

            switch (this.state) {
                case 'aim': {
                    this.angle += this.angleDir * ANGLE_SPEED * dt;
                    if (this.angle > ANGLE_MAX) { this.angle = ANGLE_MAX; this.angleDir = -1; }
                    if (this.angle < ANGLE_MIN) { this.angle = ANGLE_MIN; this.angleDir = 1; }
                    this.bodyBob = lerp(this.bodyBob, 0, dt * 8);
                    if (held) this.press();
                    break;
                }
                case 'charge': {
                    this.chargeHold += dt;
                    this.power += this.powerDir * POWER_SPEED * dt;
                    if (this.power > 1) { this.power = 1; this.powerDir = -1; }
                    if (this.power < 0) { this.power = 0; this.powerDir = 1; }
                    this.bodyBob = lerp(this.bodyBob, this.power * 10, dt * 12);

                    this.chargeBeep -= dt;
                    if (this.chargeBeep <= 0) { Sfx.charge(this.power); this.chargeBeep = 0.09; }

                    if (!held) this.release();
                    else if (this.chargeHold > 4) this.shoot();   // giữ quá lâu thì tự ném
                    break;
                }
                case 'fly': {
                    this.bodyBob = lerp(this.bodyBob, -6, dt * 10);
                    this.stepBall(dt);
                    break;
                }
                case 'result': {
                    this.bodyBob = lerp(this.bodyBob, 0, dt * 6);
                    if (this.ball && this.ball.alive) this.stepBall(dt);
                    this.resultT -= dt;
                    if (this.resultT <= 0) {
                        this.ball = null;
                        this.newSpot();
                        this.state = 'aim';
                    }
                    break;
                }
            }

            this.updateEffects(dt);
        }

        stepBall(dt) {
            const b = this.ball;
            if (!b || !b.alive) return;
            b.life += dt;

            const steps = 4, h = dt / steps;
            for (let s = 0; s < steps && b.alive; s++) {
                const prevY = b.y;
                b.vy += G * h;
                b.x += b.vx * h;
                b.y += b.vy * h;
                b.spin += b.vx * h * 0.03;

                // --- Vành rổ (2 chấm tròn ở hai đầu) ---
                for (const rx of [RIM_X1, RIM_X2]) {
                    const dx = b.x - rx, dy = b.y - RIM_Y;
                    const d = Math.hypot(dx, dy);
                    const min = BALL_R + RIM_R;
                    if (d < min && d > 0.0001) {
                        const nx = dx / d, ny = dy / d;
                        b.x = rx + nx * min;
                        b.y = RIM_Y + ny * min;
                        const vn = b.vx * nx + b.vy * ny;
                        b.vx -= 1.5 * vn * nx;
                        b.vy -= 1.5 * vn * ny;
                        b.vx *= 0.9; b.vy *= 0.9;
                        if (!b.hitRim) Sfx.bounceRim();
                        b.hitRim = true;
                        this.netSwingV += 40;
                    }
                }

                // --- Bảng rổ ---
                if (b.x - BALL_R < BOARD_X && b.x > BOARD_X - 46 &&
                    b.y > BOARD_TOP - BALL_R && b.y < BOARD_BOT && b.vx < 0) {
                    b.x = BOARD_X + BALL_R;
                    b.vx *= -0.55;
                    b.vy *= 0.94;
                    if (!b.hitBoard) Sfx.bounceRim();
                    b.hitBoard = true;
                    this.hoopFlash = 0.5;
                }

                // --- Tường sau ---
                if (b.x - BALL_R < 24) { b.x = 24 + BALL_R; b.vx *= -0.5; }

                // --- Bóng lọt rổ ---
                if (!b.scored && b.vy > 0 && prevY <= RIM_Y && b.y > RIM_Y &&
                    b.x > RIM_X1 + 6 && b.x < RIM_X2 - 6) {
                    b.scored = true;
                    this.netSwingV += 130;
                    this.onScore(b);
                }

                // --- Sàn đấu ---
                if (b.y + BALL_R > FLOOR_Y && b.vy > 0) {
                    b.y = FLOOR_Y - BALL_R;
                    b.vy *= -0.56;
                    b.vx *= 0.84;
                    b.bounces++;
                    if (b.bounces <= 3) Sfx.bounceFloor();
                    if (b.bounces >= 3 || Math.abs(b.vy) < 60) this.killBall(b);
                }

                // --- Ra ngoài sân ---
                if (b.x > CW - 6 || b.x < -60 || b.y > CH + 120 || b.life > 7) this.killBall(b);
            }

            // Vệt bóng
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 16) b.trail.shift();
        }

        killBall(b) {
            if (!b.alive) return;
            b.alive = false;
            if (!b.scored) this.onMiss(b);
        }

        onScore(b) {
            let pts = this.isThree ? 3 : 2;
            const swish = !b.hitRim && !b.hitBoard;
            const wasFire = this.onFire;

            if (swish) { pts += 1; this.swishes++; }
            if (wasFire) pts += 1;

            this.score += pts;
            this.made++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
            this.scorePulse = 1;
            this.hoopFlash = 1;

            const cx = (RIM_X1 + RIM_X2) / 2;
            this.addPopup(cx, RIM_Y - 46, `+${pts}`, this.isThree ? '#d9b3ff' : '#9fe8ff', 1.5, 34);
            if (swish) this.addPopup(cx, RIM_Y - 86, 'SWISH! +1', '#b9ffb0', 1.4, 22);
            if (wasFire) this.addPopup(cx, RIM_Y - 118, '🔥 BỐC LỬA +1', '#ffca8a', 1.4, 20);
            if (b.hitBoard && !swish) this.addPopup(cx, RIM_Y - 86, 'BANK SHOT!', '#ffd700', 1.2, 20);

            this.burst(cx, RIM_Y + 12, swish ? '#39ff14' : this.cfg.accent, swish ? 34 : 24);

            if (!this.onFire && this.streak >= 3) {
                this.onFire = true;
                this.addPopup(this.px, FLOOR_Y - 210, '🔥 ĐANG NÓNG MÁY!', '#ff7a1a', 1.6, 22);
                Sfx.fire();
            }

            if (swish) Sfx.swish();
            Sfx.score(pts);

            this.state = 'result';
            this.resultT = 1.05;
            Game.flashScoreCard(this.idx);
        }

        onMiss() {
            this.streak = 0;
            this.onFire = false;
            this.addPopup(this.px, FLOOR_Y - 200, 'Trượt rồi!', '#94a3b8', 0.9, 18);
            Sfx.miss();
            if (this.state !== 'result') {
                this.state = 'result';
                this.resultT = 0.5;
            } else {
                this.resultT = Math.min(this.resultT, 0.5);
            }
        }

        addPopup(x, y, text, color, life, size) {
            this.popups.push({ x, y, text, color, life, max: life, size: size || 22 });
        }

        burst(x, y, color, n) {
            for (let i = 0; i < n; i++) {
                const a = rnd(0, Math.PI * 2), sp = rnd(60, 320);
                this.particles.push({
                    x, y,
                    vx: Math.cos(a) * sp,
                    vy: Math.sin(a) * sp - 90,
                    life: rnd(0.5, 1.1), max: 1.1,
                    size: rnd(2.5, 6),
                    color
                });
            }
        }

        updateEffects(dt) {
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const p = this.popups[i];
                p.life -= dt;
                p.y -= 34 * dt;
                if (p.life <= 0) this.popups.splice(i, 1);
            }
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= dt;
                p.vy += 620 * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        }

        // Toạ độ nội bộ -> toạ độ canvas (dùng cho chữ, không được lật gương)
        toWorldX(lx) { return this.mirror ? W - lx : lx; }

        // ================= VẼ =================
        draw(ctx, time) {
            ctx.save();
            if (this.mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, CW, CH);
            ctx.clip();

            this.drawStands(ctx, time);
            this.drawFloor(ctx);
            this.drawHoop(ctx, time);
            this.drawPlayer(ctx, time);
            if (this.state === 'aim' || this.state === 'charge') this.drawAim(ctx, time);
            this.drawBall(ctx);
            this.drawParticles(ctx);
            if (this.state === 'charge') this.drawPowerBar(ctx);

            ctx.restore();
            ctx.restore();

            // Chữ vẽ ở hệ toạ độ chuẩn để không bị lật ngược
            this.drawText(ctx, time);
        }

        drawStands(ctx, time) {
            // Tường phía sau + khán đài
            const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
            g.addColorStop(0, '#0b1024');
            g.addColorStop(0.55, '#131a35');
            g.addColorStop(1, '#1b2445');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, CW, FLOOR_Y);

            // Ánh đèn sân khấu
            const spot = ctx.createRadialGradient(CW * 0.32, -60, 20, CW * 0.32, 260, 460);
            spot.addColorStop(0, 'rgba(255,255,255,0.16)');
            spot.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = spot;
            ctx.fillRect(0, 0, CW, FLOOR_Y);

            // Khán giả (chấm tròn cố định, hơi nhún nhảy)
            const rand = seeded(4021 + this.idx * 53);
            ctx.save();
            for (let row = 0; row < 4; row++) {
                const y = 60 + row * 34;
                for (let i = 0; i < 26; i++) {
                    const x = 12 + i * 23 + rand() * 10;
                    const hue = Math.floor(rand() * 360);
                    const bob = Math.sin(time * 2.4 + i * 0.7 + row) * (this.scorePulse > 0.2 ? 5 : 1.6);
                    ctx.fillStyle = `hsla(${hue}, 55%, ${28 + row * 4}%, 0.75)`;
                    ctx.beginPath();
                    ctx.arc(x, y + bob, 7.5 - row * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(x - 6.5 + row * 0.4, y + bob + 4, 13 - row * 0.8, 16);
                }
            }
            ctx.restore();

            // Băng rôn
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(0, 196, CW, 30);
            ctx.strokeStyle = this.cfg.jersey + '66';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 196); ctx.lineTo(CW, 196); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 226); ctx.lineTo(CW, 226); ctx.stroke();
        }

        drawFloor(ctx) {
            // Sàn gỗ
            const g = ctx.createLinearGradient(0, FLOOR_Y, 0, CH);
            g.addColorStop(0, '#b3762f');
            g.addColorStop(0.35, '#8f5a20');
            g.addColorStop(1, '#5d3a12');
            ctx.fillStyle = g;
            ctx.fillRect(0, FLOOR_Y, CW, CH - FLOOR_Y);

            ctx.strokeStyle = 'rgba(0,0,0,0.18)';
            ctx.lineWidth = 1;
            for (let x = 0; x < CW; x += 26) {
                ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - 10, CH); ctx.stroke();
            }

            // Vạch biên & vạch 3 điểm
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, FLOOR_Y + 4); ctx.lineTo(CW, FLOOR_Y + 4); ctx.stroke();

            ctx.strokeStyle = 'rgba(157,78,221,0.9)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(THREE_LINE, FLOOR_Y + 6);
            ctx.lineTo(THREE_LINE - 12, CH);
            ctx.stroke();

            // Khu vực 2 điểm
            ctx.fillStyle = 'rgba(0,208,255,0.10)';
            ctx.fillRect(0, FLOOR_Y + 6, THREE_LINE, CH - FLOOR_Y);
            ctx.fillStyle = 'rgba(157,78,221,0.12)';
            ctx.fillRect(THREE_LINE, FLOOR_Y + 6, CW - THREE_LINE, CH - FLOOR_Y);

            // Vòng sáng dưới chân người chơi
            if (this.state !== 'result' || this.resultT > 0.2) {
                const c = this.isThree ? '157,78,221' : '0,208,255';
                ctx.save();
                ctx.strokeStyle = `rgba(${c},0.9)`;
                ctx.lineWidth = 3;
                ctx.shadowColor = `rgba(${c},0.9)`;
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.ellipse(this.px, FLOOR_Y + 12, 40, 10, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        drawHoop(ctx, time) {
            const flash = this.hoopFlash;

            // Trụ đỡ
            ctx.fillStyle = '#2a3350';
            ctx.fillRect(30, 70, 14, 300);
            ctx.fillStyle = '#1b2138';
            ctx.fillRect(30, 360, 14, 12);

            // Tay đỡ bảng
            ctx.fillStyle = '#39456b';
            ctx.fillRect(44, 168, 44, 12);

            // Bảng rổ
            ctx.save();
            ctx.shadowColor = `rgba(255,215,0,${flash * 0.9})`;
            ctx.shadowBlur = 30 * flash;
            const bg = ctx.createLinearGradient(BOARD_X - 22, BOARD_TOP, BOARD_X, BOARD_BOT);
            bg.addColorStop(0, 'rgba(226,240,255,0.28)');
            bg.addColorStop(1, 'rgba(160,200,255,0.18)');
            ctx.fillStyle = bg;
            ctx.fillRect(BOARD_X - 22, BOARD_TOP, 22, BOARD_BOT - BOARD_TOP);
            ctx.strokeStyle = '#eaf2ff';
            ctx.lineWidth = 4;
            ctx.strokeRect(BOARD_X - 22, BOARD_TOP, 22, BOARD_BOT - BOARD_TOP);
            ctx.restore();

            // Ô vuông trên bảng
            ctx.strokeStyle = flash > 0.1 ? '#ffd700' : '#eaf2ff';
            ctx.lineWidth = 3;
            ctx.strokeRect(BOARD_X - 18, RIM_Y - 74, 14, 66);

            // Vành rổ
            ctx.save();
            ctx.shadowColor = 'rgba(255,80,0,0.8)';
            ctx.shadowBlur = 14 + flash * 26;
            ctx.strokeStyle = flash > 0.1 ? '#ffe08a' : '#ff5c1a';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(RIM_X1, RIM_Y);
            ctx.lineTo(RIM_X2, RIM_Y);
            ctx.stroke();
            ctx.restore();

            // Lưới
            this.drawNet(ctx, time);
        }

        drawNet(ctx, time) {
            const top = RIM_Y + 3;
            const depth = 62;
            const sway = this.netSwing * 0.4 + Math.sin(time * 1.2) * 1.5;
            const segs = 8;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 1.5;

            const topX = t => RIM_X1 + (RIM_X2 - RIM_X1) * t;
            const botX = t => RIM_X1 + 15 + (RIM_X2 - RIM_X1 - 30) * t + sway;

            for (let i = 0; i <= segs; i++) {
                const t = i / segs;
                ctx.beginPath();
                ctx.moveTo(topX(t), top);
                ctx.quadraticCurveTo(lerp(topX(t), botX(t), 0.5), top + depth * 0.55, botX(t), top + depth);
                ctx.stroke();
                // sợi chéo ngược lại
                ctx.beginPath();
                ctx.moveTo(topX(1 - t), top);
                ctx.quadraticCurveTo(lerp(topX(1 - t), botX(t), 0.5), top + depth * 0.55, botX(t), top + depth);
                ctx.stroke();
            }

            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            for (let r = 1; r <= 3; r++) {
                const t = r / 4;
                const y = top + depth * t;
                const x1 = lerp(RIM_X1, RIM_X1 + 15 + sway, t);
                const x2 = lerp(RIM_X2, RIM_X2 - 15 + sway, t);
                ctx.beginPath();
                ctx.moveTo(x1, y);
                ctx.quadraticCurveTo((x1 + x2) / 2, y + 5, x2, y);
                ctx.stroke();
            }
            ctx.restore();
        }

        drawPlayer(ctx, time) {
            const c = this.cfg;
            const x = this.px;
            const bob = this.bodyBob;
            const y = FLOOR_Y - bob * 0.15;

            // Tay: 0 = ôm bóng trước ngực, 1 = duỗi hết ở điểm rời tay
            let raise = 0.85;
            if (this.state === 'charge') raise = 0.85 - this.power * 0.5;   // lấy đà, hạ bóng xuống
            else if (this.state === 'fly' || this.followThrough > 0) raise = 1;

            const squat = this.state === 'charge' ? this.power * 12 : 0;
            const jump = this.state === 'fly' && this.ball && this.ball.life < 0.35
                ? Math.sin(this.ball.life / 0.35 * Math.PI) * 18 : 0;

            const baseY = y - jump;

            // Bóng đổ
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(x, FLOOR_Y + 6, 30 - jump * 0.4, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            const hipY = baseY - 74 + squat * 0.6;
            const shoulderY = hipY - 46 + squat * 0.2;
            const headY = shoulderY - 22;

            // Chân
            ctx.strokeStyle = c.skin;
            ctx.lineWidth = 13;
            ctx.lineCap = 'round';
            const legSpread = 12 + squat * 0.5;
            ctx.beginPath();
            ctx.moveTo(x - 8, hipY);
            ctx.lineTo(x - legSpread, baseY - 34 + squat * 0.3);
            ctx.lineTo(x - legSpread - 4, baseY - 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 8, hipY);
            ctx.lineTo(x + legSpread - 4, baseY - 34 + squat * 0.3);
            ctx.lineTo(x + legSpread, baseY - 4);
            ctx.stroke();

            // Giày
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath(); ctx.roundRect(x - legSpread - 14, baseY - 10, 22, 11, 5); ctx.fill();
            ctx.beginPath(); ctx.roundRect(x + legSpread - 8, baseY - 10, 22, 11, 5); ctx.fill();

            // Quần
            ctx.fillStyle = c.jersey2;
            ctx.beginPath();
            ctx.roundRect(x - 20, hipY - 16, 40, 34, 9);
            ctx.fill();

            // Áo
            ctx.fillStyle = c.jersey;
            ctx.beginPath();
            ctx.roundRect(x - 19, shoulderY - 6, 38, hipY - shoulderY + 16, 10);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = 'bold 20px "Baloo 2", sans-serif';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.scale(this.mirror ? -1 : 1, 1);
            ctx.fillText(c.num, this.mirror ? -x : x, shoulderY + 24);
            ctx.restore();

            // Tay (2 tay đưa bóng lên phía rổ)
            const handX = lerp(x - 14, this.relX, raise);
            const handY = lerp(shoulderY + 6, FLOOR_Y + REL_DY, raise);
            const elbowX = lerp(x - 26, handX + 14, raise);
            const elbowY = lerp(shoulderY + 26, handY + 20, raise);

            ctx.strokeStyle = c.skin;
            ctx.lineWidth = 11;
            ctx.beginPath();
            ctx.moveTo(x - 12, shoulderY + 2);
            ctx.lineTo(elbowX, elbowY);
            ctx.lineTo(handX, handY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 12, shoulderY + 2);
            ctx.lineTo(elbowX + 16, elbowY + 4);
            ctx.lineTo(handX + 11, handY + 5);
            ctx.stroke();

            // Đầu
            ctx.fillStyle = c.skin;
            ctx.beginPath();
            ctx.arc(x - 2, headY, 16, 0, Math.PI * 2);
            ctx.fill();
            // Tóc
            ctx.fillStyle = c.hair;
            ctx.beginPath();
            ctx.arc(x - 2, headY - 3, 16, Math.PI * 0.95, Math.PI * 2.15);
            ctx.fill();
            // Mắt (nhìn về phía rổ)
            ctx.fillStyle = '#1b2138';
            ctx.beginPath(); ctx.arc(x - 12, headY + 2, 2.6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x - 4, headY + 2, 2.6, 0, Math.PI * 2); ctx.fill();
            // Miệng
            ctx.strokeStyle = '#1b2138';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x - 8, headY + 7, 5, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();

            // Băng đô
            ctx.strokeStyle = c.accent;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(x - 2, headY, 16, Math.PI * 1.08, Math.PI * 1.92);
            ctx.stroke();

            // Bóng trên tay khi đang ngắm / lấy lực
            if (this.state === 'aim' || this.state === 'charge') {
                this.drawBallShape(ctx, handX + 3, handY - 2, time * 0.6, this.onFire);
            }

            // Hào quang khi đang bốc lửa
            if (this.onFire) {
                ctx.save();
                ctx.globalAlpha = 0.5 + Math.sin(time * 9) * 0.2;
                ctx.strokeStyle = '#ff7a1a';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ff7a1a';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.ellipse(x, baseY - 60, 40, 74, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        drawAim(ctx, time) {
            const rx = this.relX, ry = this.relY;
            const len = 96 + (this.state === 'charge' ? this.power * 54 : Math.sin(time * 4) * 5);
            const ax = rx - Math.cos(this.angle) * len;
            const ay = ry - Math.sin(this.angle) * len;

            ctx.save();
            ctx.strokeStyle = this.cfg.accent;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.shadowColor = this.cfg.accent;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(ax, ay);
            ctx.stroke();

            // Đầu mũi tên
            const a = Math.atan2(ay - ry, ax - rx);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - Math.cos(a - 0.4) * 18, ay - Math.sin(a - 0.4) * 18);
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - Math.cos(a + 0.4) * 18, ay - Math.sin(a + 0.4) * 18);
            ctx.stroke();
            ctx.restore();

            // Đường bay dự đoán (chế độ trợ giúp bé)
            if (Game.helpMode && this.state === 'charge') {
                const speed = lerp(POWER_MIN, POWER_MAX, this.power);
                let vx = -Math.cos(this.angle) * speed;
                let vy = -Math.sin(this.angle) * speed;
                let px = rx, py = ry;
                ctx.save();
                ctx.setLineDash([7, 9]);
                ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(px, py);
                for (let i = 0; i < 90; i++) {
                    vy += G * 0.016;
                    px += vx * 0.016;
                    py += vy * 0.016;
                    if (py > FLOOR_Y || px < BOARD_X) break;
                    ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }

        drawPowerBar(ctx) {
            const bw = 16, bh = 130;
            const bx = Math.min(this.px + 42, CW - bw - 14), by = FLOOR_Y - 176;
            ctx.save();
            ctx.fillStyle = 'rgba(4,7,18,0.75)';
            ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10); ctx.stroke();

            const g = ctx.createLinearGradient(0, by + bh, 0, by);
            g.addColorStop(0, '#39ff14');
            g.addColorStop(0.55, '#ffd700');
            g.addColorStop(1, '#ff3366');
            ctx.fillStyle = g;
            const fh = bh * this.power;
            ctx.beginPath(); ctx.roundRect(bx, by + bh - fh, bw, fh, 7); ctx.fill();

            // Vạch mốc
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
                const y = by + bh * i / 5;
                ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke();
            }
            ctx.restore();
        }

        drawBallShape(ctx, x, y, spin, fire) {
            ctx.save();
            if (fire) {
                ctx.shadowColor = '#ff7a1a';
                ctx.shadowBlur = 26;
            }
            ctx.translate(x, y);
            ctx.rotate(spin);
            const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, BALL_R);
            g.addColorStop(0, fire ? '#ffd27a' : '#ff9d4d');
            g.addColorStop(0.6, fire ? '#ff7a1a' : '#e2711d');
            g.addColorStop(1, fire ? '#c43b00' : '#a8480d');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = 'rgba(40,20,8,0.85)';
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-BALL_R, 0); ctx.lineTo(BALL_R, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -BALL_R); ctx.lineTo(0, BALL_R); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(0, 0, BALL_R * 0.55, BALL_R, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        drawBall(ctx) {
            const b = this.ball;
            if (!b) return;

            // Vệt bay
            for (let i = 0; i < b.trail.length; i++) {
                const t = i / b.trail.length;
                ctx.globalAlpha = t * 0.42;
                ctx.fillStyle = b.fire ? '#ff7a1a' : this.cfg.accent;
                ctx.beginPath();
                ctx.arc(b.trail[i].x, b.trail[i].y, BALL_R * t * 0.85, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            this.drawBallShape(ctx, b.x, b.y, b.spin, b.fire);
        }

        drawParticles(ctx) {
            for (const p of this.particles) {
                ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        drawText(ctx, time) {
            ctx.save();
            ctx.textAlign = 'center';

            // Nhãn khu vực điểm dưới chân
            const zx = this.toWorldX(this.px);
            if (this.state === 'aim' || this.state === 'charge') {
                ctx.font = 'bold 17px "Baloo 2", sans-serif';
                ctx.fillStyle = this.isThree ? '#d9b3ff' : '#9fe8ff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 6;
                ctx.fillText(this.isThree ? '3 ĐIỂM' : '2 ĐIỂM', zx, FLOOR_Y + 46);
            }

            // Popup
            for (const p of this.popups) {
                const t = clamp(p.life / p.max, 0, 1);
                ctx.globalAlpha = t > 0.75 ? (1 - t) / 0.25 : t / 0.75;
                ctx.font = `bold ${p.size}px "Baloo 2", sans-serif`;
                ctx.fillStyle = p.color;
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                ctx.shadowBlur = 10;
                ctx.fillText(p.text, this.toWorldX(p.x), p.y);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }

    // =========================================================
    //  Trò chơi
    // =========================================================
    const Game = {
        canvas: null, ctx: null, viewport: null,
        dpr: 1, scale: 1, ox: 0, oy: 0, cssW: 0, cssH: 0,
        courts: [],
        state: 'menu',          // menu | countdown | playing | paused | over
        timeLeft: MATCH_TIME,
        countdown: 3.99,
        lastTick: -1,
        time: 0,
        helpMode: true,
        confetti: [],
        held: [false, false],
        pointers: new Map(),

        init() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.viewport = document.querySelector('.game-viewport');
            this.courts = [new Court(0), new Court(1)];

            this.el = {
                p1score: document.getElementById('p1-score'),
                p2score: document.getElementById('p2-score'),
                p1streak: document.getElementById('p1-streak'),
                p2streak: document.getElementById('p2-streak'),
                p1acc: document.getElementById('p1-acc'),
                p2acc: document.getElementById('p2-acc'),
                clock: document.getElementById('clock'),
                cards: [document.querySelector('.card-p1'), document.querySelector('.card-p2')],
                menu: document.getElementById('screen-menu'),
                pause: document.getElementById('screen-pause'),
                over: document.getElementById('screen-over')
            };

            this.bindUI();
            this.bindInput();
            window.addEventListener('resize', () => this.resize());
            this.resize();

            let last = performance.now();
            const loop = now => {
                const dt = Math.min(0.05, (now - last) / 1000);
                last = now;
                this.update(dt);
                this.render();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        bindUI() {
            document.getElementById('btn-start').onclick = () => this.startMatch();
            document.getElementById('btn-again').onclick = () => this.startMatch();
            document.getElementById('btn-restart').onclick = () => this.startMatch();
            document.getElementById('btn-resume').onclick = () => this.setPaused(false);

            const helpBtn = document.getElementById('btn-help');
            helpBtn.onclick = () => {
                this.helpMode = !this.helpMode;
                helpBtn.classList.toggle('active', this.helpMode);
                document.getElementById('help-label').textContent =
                    'Trợ Giúp Bé: ' + (this.helpMode ? 'BẬT' : 'TẮT');
            };

            const soundBtn = document.getElementById('btn-sound');
            soundBtn.onclick = () => {
                Sfx.on = !Sfx.on;
                soundBtn.classList.toggle('muted', !Sfx.on);
                document.getElementById('sound-icon').className =
                    'fa-solid ' + (Sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
                if (Sfx.on) Sfx.tick();
            };
        },

        bindInput() {
            const keyToPlayer = code => {
                if (code === 'KeyA' || code === 'KeyQ' || code === 'KeyF') return 0;
                if (code === 'KeyL' || code === 'KeyK' || code === 'KeyJ') return 1;
                return -1;
            };

            window.addEventListener('keydown', e => {
                if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();

                if (e.code === 'Escape' || e.code === 'KeyP') {
                    if (this.state === 'playing') this.setPaused(true);
                    else if (this.state === 'paused') this.setPaused(false);
                    return;
                }
                if (e.code === 'Space' || e.code === 'Enter') {
                    if (this.state === 'menu' || this.state === 'over') { this.startMatch(); return; }
                }
                if (e.repeat) return;
                const p = keyToPlayer(e.code);
                if (p >= 0) { Sfx.ensure(); this.held[p] = true; }
            });

            window.addEventListener('keyup', e => {
                const p = keyToPlayer(e.code);
                if (p >= 0) this.held[p] = false;
            });

            // Chạm / chuột: nửa trái = P1, nửa phải = P2
            const half = clientX => {
                const r = this.canvas.getBoundingClientRect();
                return (clientX - r.left) < r.width / 2 ? 0 : 1;
            };

            this.canvas.addEventListener('pointerdown', e => {
                if (this.state !== 'playing' && this.state !== 'countdown') return;
                e.preventDefault();
                Sfx.ensure();
                const p = half(e.clientX);
                this.pointers.set(e.pointerId, p);
                this.held[p] = true;
                if (this.canvas.setPointerCapture) {
                    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { }
                }
            });

            const endPointer = e => {
                const p = this.pointers.get(e.pointerId);
                if (p === undefined) return;
                this.pointers.delete(e.pointerId);
                // Chỉ nhả nếu không còn ngón nào khác đang giữ nửa sân đó
                if (![...this.pointers.values()].includes(p)) this.held[p] = false;
            };
            this.canvas.addEventListener('pointerup', endPointer);
            this.canvas.addEventListener('pointercancel', endPointer);
            this.canvas.addEventListener('pointerleave', endPointer);

            window.addEventListener('blur', () => {
                this.held[0] = this.held[1] = false;
                this.pointers.clear();
            });
        },

        resize() {
            const r = this.viewport.getBoundingClientRect();
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.cssW = r.width; this.cssH = r.height;
            this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
            this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
            this.scale = Math.min(r.width / W, r.height / H);
            this.ox = (r.width - W * this.scale) / 2;
            this.oy = (r.height - H * this.scale) / 2;
        },

        startMatch() {
            Sfx.ensure();
            this.courts.forEach(c => c.reset());
            this.timeLeft = MATCH_TIME;
            this.countdown = 3.99;
            this.lastTick = -1;
            this.confetti = [];
            this.held = [false, false];
            this.pointers.clear();
            this.state = 'countdown';
            this.el.menu.classList.add('hidden');
            this.el.pause.classList.add('hidden');
            this.el.over.classList.add('hidden');
            this.syncHUD();
        },

        setPaused(on) {
            if (on && this.state === 'playing') {
                this.state = 'paused';
                this.held = [false, false];
                this.pointers.clear();
                this.el.pause.classList.remove('hidden');
            } else if (!on && this.state === 'paused') {
                this.state = 'playing';
                this.el.pause.classList.add('hidden');
            }
        },

        flashScoreCard(idx) {
            const card = this.el.cards[idx];
            if (!card) return;
            card.classList.add('pop');
            setTimeout(() => card.classList.remove('pop'), 320);
        },

        update(dt) {
            this.time += dt;

            if (this.state === 'countdown') {
                const prev = Math.ceil(this.countdown);
                this.countdown -= dt;
                const now = Math.ceil(this.countdown);
                if (now !== prev && now >= 0) {
                    if (now > 0) Sfx.tick();
                    else Sfx.tone(1046, 0.35, 'triangle', 0.2);
                }
                this.courts.forEach(c => c.update(dt, false));
                if (this.countdown <= 0) this.state = 'playing';
            } else if (this.state === 'playing') {
                this.timeLeft -= dt;

                // Đếm ngược 10 giây cuối
                const sec = Math.ceil(this.timeLeft);
                if (sec <= 10 && sec !== this.lastTick && sec > 0) {
                    this.lastTick = sec;
                    Sfx.tick();
                }

                this.courts.forEach((c, i) => c.update(dt, this.held[i]));

                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.endMatch();
                }
            } else if (this.state === 'over') {
                // Hết giờ là chốt điểm — không cập nhật sân nữa để quả bóng đang
                // bay không ghi thêm điểm sai lệch với bảng tổng kết.
                this.updateConfetti(dt);
            }

            this.syncHUD();
        },

        endMatch() {
            this.state = 'over';
            this.held = [false, false];
            this.pointers.clear();
            Sfx.buzzer();

            const [a, b] = this.courts;
            const el = id => document.getElementById(id);
            const pct = c => c.shots ? Math.round(c.made / c.shots * 100) : 0;

            el('f1-score').textContent = a.score;
            el('f2-score').textContent = b.score;
            el('f1-made').textContent = `${a.made}/${a.shots}`;
            el('f2-made').textContent = `${b.made}/${b.shots}`;
            el('f1-acc').textContent = pct(a) + '%';
            el('f2-acc').textContent = pct(b) + '%';
            el('f1-best').textContent = a.bestStreak;
            el('f2-best').textContent = b.bestStreak;
            el('f1-swish').textContent = a.swishes;
            el('f2-swish').textContent = b.swishes;

            const box1 = document.querySelector('.final-p1');
            const box2 = document.querySelector('.final-p2');
            box1.classList.remove('winner');
            box2.classList.remove('winner');

            let title, desc, emoji;
            if (a.score === b.score) {
                title = 'HOÀ RỒI!';
                desc = `Cả hai cùng được ${a.score} điểm — ngang tài ngang sức, đấu lại một trận nữa nhé!`;
                emoji = '🤝';
                box1.classList.add('winner');
                box2.classList.add('winner');
            } else {
                const w = a.score > b.score ? 0 : 1;
                const win = this.courts[w], lose = this.courts[1 - w];
                title = `${PLAYERS[w].emoji} ${PLAYERS[w].name} THẮNG!`;
                desc = `Thắng ${win.score} - ${lose.score}. Chuỗi ghi điểm dài nhất: ${win.bestStreak} quả liên tiếp!`;
                emoji = '🏆';
                (w === 0 ? box1 : box2).classList.add('winner');
            }
            el('over-title').textContent = title;
            el('over-desc').textContent = desc;
            el('over-emoji').textContent = emoji;

            this.spawnConfetti();
            setTimeout(() => Sfx.win(), 700);
            this.el.over.classList.remove('hidden');
        },

        spawnConfetti() {
            const colors = ['#ff8a1a', '#00d0ff', '#ffd700', '#39ff14', '#ff007f', '#9d4edd'];
            for (let i = 0; i < 160; i++) {
                this.confetti.push({
                    x: rnd(0, W), y: rnd(-H, 0),
                    vx: rnd(-60, 60), vy: rnd(90, 260),
                    size: rnd(4, 10),
                    rot: rnd(0, Math.PI * 2),
                    vr: rnd(-6, 6),
                    color: colors[i % colors.length]
                });
            }
        },

        updateConfetti(dt) {
            for (const c of this.confetti) {
                c.x += c.vx * dt;
                c.y += c.vy * dt;
                c.rot += c.vr * dt;
                c.vy += 40 * dt;
                if (c.y > H + 20) { c.y = -20; c.x = rnd(0, W); c.vy = rnd(90, 260); }
            }
        },

        syncHUD() {
            const [a, b] = this.courts;
            this.el.p1score.textContent = a.score;
            this.el.p2score.textContent = b.score;
            this.el.p1streak.textContent = (a.onFire ? '🔥 ' : '') + 'Chuỗi: ' + a.streak;
            this.el.p2streak.textContent = (b.onFire ? '🔥 ' : '') + 'Chuỗi: ' + b.streak;
            this.el.p1streak.classList.toggle('fire', a.onFire);
            this.el.p2streak.classList.toggle('fire', b.onFire);
            this.el.p1acc.textContent = `${a.made}/${a.shots}`;
            this.el.p2acc.textContent = `${b.made}/${b.shots}`;

            const t = Math.max(0, Math.ceil(this.timeLeft));
            const m = Math.floor(t / 60), s = t % 60;
            this.el.clock.textContent = `${m}:${String(s).padStart(2, '0')}`;
            this.el.clock.classList.toggle('urgent', t <= 10 && this.state === 'playing');
        },

        // ---------- Vẽ ----------
        render() {
            const ctx = this.ctx;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.fillStyle = '#05070f';
            ctx.fillRect(0, 0, this.cssW, this.cssH);

            ctx.save();
            ctx.translate(this.ox, this.oy);
            ctx.scale(this.scale, this.scale);

            this.courts.forEach(c => c.draw(ctx, this.time));
            this.drawDivider(ctx);

            if (this.state === 'countdown') this.drawCountdown(ctx);
            if (this.state === 'over') this.drawConfetti(ctx);

            ctx.restore();
        },

        drawDivider(ctx) {
            const g = ctx.createLinearGradient(W / 2 - 12, 0, W / 2 + 12, 0);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(0.5, 'rgba(4,7,18,0.95)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(W / 2 - 14, 0, 28, H);

            ctx.save();
            ctx.strokeStyle = 'rgba(255,215,0,0.6)';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255,215,0,0.7)';
            ctx.shadowBlur = 16;
            ctx.setLineDash([14, 12]);
            ctx.beginPath();
            ctx.moveTo(W / 2, 0);
            ctx.lineTo(W / 2, H);
            ctx.stroke();
            ctx.restore();
        },

        drawCountdown(ctx) {
            const n = Math.ceil(this.countdown);
            const frac = this.countdown - Math.floor(this.countdown);
            const label = n > 0 ? String(n) : 'BẮT ĐẦU!';
            const scale = n > 0 ? 1 + (1 - frac) * 0.5 : 1.2;

            ctx.save();
            ctx.fillStyle = 'rgba(4,7,18,0.55)';
            ctx.fillRect(0, 0, W, H);
            ctx.translate(W / 2, H / 2);
            ctx.scale(scale, scale);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 120px "Baloo 2", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(255,215,0,0.8)';
            ctx.shadowBlur = 40;
            ctx.globalAlpha = clamp(frac * 2.2, 0, 1);
            ctx.fillText(label, 0, 0);
            ctx.restore();
        },

        drawConfetti(ctx) {
            for (const c of this.confetti) {
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rot);
                ctx.fillStyle = c.color;
                ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
                ctx.restore();
            }
        }
    };

    // roundRect dự phòng cho trình duyệt cũ
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            const rr = Math.min(r, w / 2, h / 2);
            this.moveTo(x + rr, y);
            this.arcTo(x + w, y, x + w, y + h, rr);
            this.arcTo(x + w, y + h, x, y + h, rr);
            this.arcTo(x, y + h, x, y, rr);
            this.arcTo(x, y, x + w, y, rr);
            this.closePath();
            return this;
        };
    }

    window.addEventListener('DOMContentLoaded', () => Game.init());
})();
