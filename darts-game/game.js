/* =========================================================
   PHI TIÊU BONG BÓNG — 2 tới 4 bé thi tài trên cùng một máy
   Mỗi bé một gian hàng hội chợ riêng. Bóng bay bay lên liên tục,
   bé ngắm rồi phi tiêu cho nổ thật nhiều để ăn điểm.
   ========================================================= */
(() => {
    'use strict';

    const W = 1240, H = 720;

    /* ---------- Đơn vị đo ----------
       Mọi thứ tính theo mét thật rồi đổi ra pixel, nhờ vậy trọng lực,
       sức cản không khí và tốc độ ném đều là số liệu ngoài đời.
       Riêng QUẢ BÓNG và MŨI TIÊU được phóng to lên như một "bộ đồ chơi
       trong nhà" cho bé dễ nhìn — nhưng vẫn giữ đúng tỉ lệ giữa chúng
       với nhau, y hệt cách quả bóng rổ được phóng to ở trò bóng rổ. */
    const PPM = 110;                       // pixel trên mỗi mét
    const M = m => m * PPM;
    const SIZE_UP = 1.7;                   // hệ số phóng to đồ chơi
    const MS = m => m * PPM * SIZE_UP;

    const G = M(9.81);                     // trọng lực 9,81 m/s²

    // ---------- Mũi phi tiêu thi đấu: dài 16cm, nặng 20g ----------
    const DART_L = MS(0.16);
    const DART_W = MS(0.021);
    /* Sức cản không khí: a = ½·ρ·Cd·A/m · v²  ≈ 0,032·v² (v tính bằng m/s).
       Ném 10 m/s thì bị hãm khoảng 3,2 m/s² — mất chừng 12% tốc độ
       trên cả đường bay, đúng như phi tiêu thật. */
    const DRAG_K = 0.032;
    const ALIGN_RATE = 26;                 // đuôi có cánh nên mũi tự quay về hướng bay
    const SPEED_MIN = M(6.5), SPEED_MAX = M(13);

    // ---------- Vị trí trong gian hàng ----------
    const GROUND_Y = 656;                  // mặt đất bé đứng
    const THROW_Y = 546;                   // khớp vai
    const ARM = M(0.55);                   // tầm với của cánh tay
    const BAL_TOP = 88;                    // bóng bay cao quá đây là thoát mất
    const BAL_BOT = 500;                   // bóng bay xuất hiện từ đây

    /* ---------- Các loại bóng bay ----------
       Bóng bay hội chợ đường kính thật 21 - 38cm. Tốc độ bay lên đã được
       giảm xuống so với bóng bơm khí heli thật (1-2 m/s) để bé kịp ngắm. */
    const KINDS = [
        { key: 'big',   name: 'BÓNG TO',   r: MS(0.19),  pts: 1,  vy: [34, 56],   w: 28 },
        { key: 'mid',   name: 'BÓNG VỪA',  r: MS(0.145), pts: 2,  vy: [48, 76],   w: 32 },
        { key: 'small', name: 'BÓNG NHỎ',  r: MS(0.105), pts: 3,  vy: [66, 100],  w: 24 },
        { key: 'gold',  name: 'BÓNG VÀNG', r: MS(0.098), pts: 5,  vy: [98, 132],  w: 7,  gold: true },
        { key: 'bomb',  name: 'BÓNG BOM',  r: MS(0.155), pts: -3, vy: [44, 70],   w: 9,  bomb: true },
        /* Bóng thần kỳ: hiếm gặp, nổ được thì 5 giây tiếp theo mỗi lần phi ra
           một chùm ba mũi toả về ba hướng. */
        { key: 'magic', name: 'BÓNG THẦN KỲ', r: MS(0.13), pts: 3, vy: [76, 112], w: 5, magic: true }
    ];

    const TRIPLE_TIME = 5;            // giây được bắn chùm
    const TRIPLE_SPREAD = 0.20;       // độ toả của hai mũi bên (radian)
    const KIND = Object.fromEntries(KINDS.map(k => [k.key, k]));

    const BAL_COLORS = [
        { main: '#ff4d5e', dark: '#9d1228', light: '#ffb9c0' },
        { main: '#4dabff', dark: '#12508f', light: '#bcdfff' },
        { main: '#5ee06a', dark: '#177a2b', light: '#c2f6c8' },
        { main: '#ffd93b', dark: '#a97f00', light: '#fff2ae' },
        { main: '#ff7ad9', dark: '#a01d84', light: '#ffcdf0' },
        { main: '#a98cff', dark: '#4e2cb5', light: '#e0d4ff' }
    ];
    const GOLD_COLOR = { main: '#ffc93b', dark: '#9c6500', light: '#fff4c8' };
    const BOMB_COLOR = { main: '#39404f', dark: '#12141b', light: '#727a8b' };

    // ---------- Người chơi ----------
    const PLAYERS = [
        { name: 'BÉ 1', emoji: '🐯', color: '#ff8a3d', dark: '#a8430c', light: '#ffcda3', glow: '255,138,61' },
        { name: 'BÉ 2', emoji: '🐼', color: '#4dd2ff', dark: '#0d5f80', light: '#bceaff', glow: '77,210,255' },
        { name: 'BÉ 3', emoji: '🐸', color: '#5ee06a', dark: '#1a7a2c', light: '#c2f6c8', glow: '94,224,106' },
        { name: 'BÉ 4', emoji: '🦊', color: '#c77dff', dark: '#6a2ba8', light: '#e7ccff', glow: '199,125,255' }
    ];
    const KEYSETS = {
        2: ['KeyA', 'KeyL'],
        3: ['KeyA', 'KeyG', 'KeyL'],
        4: ['KeyA', 'KeyF', 'KeyJ', 'KeyL']
    };
    const KEYLABEL = { KeyA: 'A', KeyF: 'F', KeyG: 'G', KeyJ: 'J', KeyL: 'L' };

    const MODES = {
        versus:   { key: 'versus',   name: 'ĐỐI KHÁNG',      time: 90, mult: 1, alive: 5 },
        sniper:   { key: 'sniper',   name: 'SĂN BÓNG VÀNG',  time: 60, mult: 2, alive: 4, small: true },
        practice: { key: 'practice', name: 'LUYỆN TẬP',      time: 0,  mult: 1, alive: 5 }
    };

    const DIFFS = {
        easy:   { key: 'easy',   name: 'DỄ',       sweep: 0.55, power: 1.00, guide: true,  wind: 0,    rise: 0.85 },
        normal: { key: 'normal', name: 'VỪA',      sweep: 0.85, power: 1.45, guide: true,  wind: 0.28, rise: 1.00 },
        hard:   { key: 'hard',   name: 'KHÓ',      sweep: 1.15, power: 1.90, guide: false, wind: 0.60, rise: 1.15 },
        insane: { key: 'insane', name: 'SIÊU KHÓ', sweep: 1.35, power: 2.20, guide: false, wind: 1.15, rise: 1.30, gust: true }
    };

    const WIND_BAL = 46;                   // gió thổi bóng bay lệch bao nhiêu px/giây
    const WIND_DART = 58;                  // gió đẩy mũi tiêu bao nhiêu px/giây²

    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[(Math.random() * arr.length) | 0];
    const TAU = Math.PI * 2;
    // Xoay góc theo đường ngắn nhất, tránh nhảy vọt khi vượt qua ±180°
    const angDelta = (a, b) => {
        let d = (b - a) % TAU;
        if (d > Math.PI) d -= TAU;
        if (d < -Math.PI) d += TAU;
        return d;
    };

    // =========================================================
    //  Âm thanh
    // =========================================================
    const Sfx = {
        actx: null, on: true,
        ensure() {
            if (!this.actx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.actx = new AC();
            }
            if (this.actx && this.actx.state === 'suspended') this.actx.resume();
            return this.actx;
        },
        tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null) {
            if (!this.on) return;
            const ac = this.ensure();
            if (!ac) return;
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, ac.currentTime);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), ac.currentTime + dur);
            g.gain.setValueAtTime(0.0001, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), ac.currentTime + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
            o.connect(g); g.connect(ac.destination);
            o.start(); o.stop(ac.currentTime + dur + 0.02);
        },
        noise(dur = 0.16, vol = 0.14, hp = 900) {
            if (!this.on) return;
            const ac = this.ensure();
            if (!ac) return;
            const len = Math.max(1, Math.floor(ac.sampleRate * dur));
            const buf = ac.createBuffer(1, len, ac.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            const src = ac.createBufferSource(); src.buffer = buf;
            const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
            const g = ac.createGain(); g.gain.value = vol;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },
        charge(t) { this.tone(300 + t * 560, 0.05, 'square', 0.045); },
        throwDart() { this.noise(0.07, 0.05, 2400); this.tone(760, 0.1, 'triangle', 0.07, 320); },
        /* Tiếng bóng bay nổ: một cú "bụp" cực gắt rồi tắt ngay.
           Quả càng nhỏ vỏ càng căng nên tiếng càng cao. */
        pop(r) {
            const p = clamp(1 - r / MS(0.2), 0, 1);
            this.noise(0.055, 0.24, 900 + p * 1500);
            this.tone(180 + p * 240, 0.07, 'square', 0.11, 70);
        },
        gold() {
            [880, 1174, 1568, 2093].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.16, 'triangle', 0.12), i * 62));
        },
        bomb() { this.noise(0.4, 0.26, 120); this.tone(120, 0.42, 'sawtooth', 0.16, 44); },
        stick() { this.tone(180, 0.09, 'sine', 0.09, 110); this.noise(0.05, 0.05, 600); },
        miss() { this.tone(230, 0.14, 'sine', 0.06, 150); },
        fire() {
            [523, 659, 784, 1046].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.14, 'square', 0.09), i * 52));
        },
        tick() { this.tone(880, 0.07, 'square', 0.07); },
        win() {
            [523, 659, 784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.26, 'triangle', 0.15), i * 118));
        },
        lose() {
            [420, 356, 300, 240].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.3, 'sine', 0.12), i * 150));
        }
    };

    // =========================================================
    //  Quả bóng bay
    // =========================================================
    class Balloon {
        constructor(kind, x, y, diff) {
            this.kind = kind;
            this.r = kind.r;
            this.x = x; this.baseX = x; this.y = y;
            this.vy = rnd(kind.vy[0], kind.vy[1]) * diff.rise;
            this.swayA = rnd(8, 22);            // biên độ đung đưa sang hai bên
            this.swayW = rnd(0.7, 1.5);         // nhịp đung đưa
            this.swayP = rnd(0, TAU);
            this.t = 0;
            this.alive = true;
            this.col = kind.magic ? '#6ad2ff' : kind.gold ? GOLD_COLOR : kind.bomb ? BOMB_COLOR : pick(BAL_COLORS);
            this.tilt = 0;
            this.squash = 0;                    // nhún nhẹ lúc mới thả ra
            this.fuse = 0;
        }

        update(dt, wind, x0, x1) {
            this.t += dt;
            this.y -= this.vy * dt;
            this.baseX += wind * WIND_BAL * dt;
            const sway = Math.sin(this.t * this.swayW + this.swayP) * this.swayA;
            const nx = this.baseX + sway;
            this.tilt = lerp(this.tilt, clamp((nx - this.x) * 0.06, -0.3, 0.3), dt * 6);
            this.x = nx;
            // chạm mép gian hàng thì nảy nhẹ trở vào
            if (this.x - this.r < x0) this.baseX += (x0 + this.r - this.x);
            if (this.x + this.r > x1) this.baseX -= (this.x - (x1 - this.r));
            this.squash = Math.max(0, this.squash - dt * 2.4);
            if (this.kind.bomb) this.fuse += dt;
            if (this.y + this.r < BAL_TOP) this.alive = false;   // bay thoát mất
        }

        draw(ctx, time) {
            const r = this.r, c = this.col;
            const sq = 1 + Math.sin(this.t * 3.1) * 0.018 + this.squash * 0.12;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.tilt);

            // --- Sợi dây buộc lượn sóng bên dưới ---
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(0, r * 1.16);
            const wob = Math.sin(this.t * 2.2) * 7;
            ctx.bezierCurveTo(wob, r * 1.16 + 22, -wob, r * 1.16 + 44, wob * 0.6, r * 1.16 + 64);
            ctx.stroke();

            // --- Nút thắt ---
            ctx.fillStyle = c.dark;
            ctx.beginPath();
            ctx.moveTo(-4.2, r * 1.06);
            ctx.lineTo(4.2, r * 1.06);
            ctx.lineTo(0, r * 1.22);
            ctx.closePath();
            ctx.fill();

            // --- Thân bóng: hơi nhọn phía dưới như bóng bay thật ---
            const g = ctx.createRadialGradient(-r * 0.34, -r * 0.42, r * 0.1, 0, 0, r * 1.25);
            g.addColorStop(0, c.light);
            g.addColorStop(0.45, c.main);
            g.addColorStop(1, c.dark);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(0, -r * 1.02 / sq);
            ctx.bezierCurveTo(r * 1.34, -r * 0.92, r * 1.18, r * 0.72, 0, r * 1.08 * sq);
            ctx.bezierCurveTo(-r * 1.18, r * 0.72, -r * 1.34, -r * 0.92, 0, -r * 1.02 / sq);
            ctx.closePath();
            ctx.fill();

            // --- Vệt sáng bóng loáng ---
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.36, -r * 0.44, r * 0.19, r * 0.32, -0.5, 0, TAU);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.beginPath();
            ctx.ellipse(r * 0.4, r * 0.16, r * 0.12, r * 0.3, 0.4, 0, TAU);
            ctx.fill();

            if (this.kind.gold) {
                // Bóng vàng: viền lấp lánh cho nổi bật
                ctx.strokeStyle = `rgba(255,255,255,${(0.5 + Math.sin(time * 8) * 0.3).toFixed(2)})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 1.06, r * 1.14, 0, 0, TAU);
                ctx.stroke();
                ctx.fillStyle = '#fff6cf';
                ctx.font = `bold ${(r * 0.9).toFixed(0)}px "Baloo 2", sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('★', 0, r * 0.06);
            }
            if (this.kind.magic) {
                // Bóng thần kỳ: ba mũi tên nhỏ toả ra, nhìn là đoán được công dụng
                ctx.save();
                ctx.strokeStyle = '#eaffff';
                ctx.lineWidth = Math.max(2, r * 0.11);
                ctx.lineCap = 'round';
                for (const a of [-0.55, 0, 0.55]) {
                    ctx.save();
                    ctx.rotate(a);
                    ctx.beginPath();
                    ctx.moveTo(0, r * 0.34); ctx.lineTo(0, -r * 0.46);
                    ctx.moveTo(-r * 0.17, -r * 0.24); ctx.lineTo(0, -r * 0.5);
                    ctx.lineTo(r * 0.17, -r * 0.24);
                    ctx.stroke();
                    ctx.restore();
                }
                // lấp lánh cho nổi giữa đám bóng thường
                const tw = 0.5 + 0.5 * Math.sin(this.t * 6);
                ctx.globalAlpha = 0.55 + 0.45 * tw;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.55, r * 0.12 * (0.7 + tw * 0.6), 0, TAU); ctx.fill();
                ctx.restore();
            }
            if (this.kind.bomb) {
                // Bóng bom: mặt cau có + ngòi nổ xì lửa
                ctx.strokeStyle = '#8a6b3a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -r * 1.0);
                ctx.quadraticCurveTo(r * 0.34, -r * 1.4, r * 0.1, -r * 1.62);
                ctx.stroke();
                const fl = 3 + Math.sin(this.fuse * 22) * 1.6;
                ctx.fillStyle = '#ffb03a';
                ctx.beginPath(); ctx.arc(r * 0.1, -r * 1.66, fl, 0, TAU); ctx.fill();
                ctx.fillStyle = '#fff0a8';
                ctx.beginPath(); ctx.arc(r * 0.1, -r * 1.66, fl * 0.5, 0, TAU); ctx.fill();

                ctx.strokeStyle = 'rgba(255,255,255,0.75)';
                ctx.lineWidth = 2.4;
                ctx.lineCap = 'round';
                ctx.beginPath();                       // hai con mắt cau
                ctx.moveTo(-r * 0.42, -r * 0.3); ctx.lineTo(-r * 0.14, -r * 0.16);
                ctx.moveTo(r * 0.42, -r * 0.3); ctx.lineTo(r * 0.14, -r * 0.16);
                ctx.stroke();
                ctx.beginPath();                       // miệng méo
                ctx.arc(0, r * 0.5, r * 0.3, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // =========================================================
    //  Hiệu ứng nổ bóng
    // =========================================================

    /* Mảnh vỏ cao su: bay ra, lộn nhào, rung phần phật rồi rơi xuống */
    class Shred {
        constructor(x, y, col, r) {
            const a = rnd(0, TAU), sp = rnd(130, 430);
            this.x = x; this.y = y;
            this.vx = Math.cos(a) * sp;
            this.vy = Math.sin(a) * sp - 70;
            this.rot = rnd(0, TAU); this.rotV = rnd(-17, 17);
            this.len = rnd(r * 0.5, r * 1.15);
            this.wide = rnd(0.25, 0.6);
            this.flut = rnd(0, TAU);
            this.col = col;
            this.life = rnd(0.6, 1.2); this.max = this.life;
        }
        update(dt) {
            this.vy += G * 0.6 * dt;
            this.vx *= Math.pow(0.12, dt);          // cao su nhẹ nên cản gió rất mạnh
            this.vy *= Math.pow(0.5, dt);
            this.x += this.vx * dt; this.y += this.vy * dt;
            this.rot += this.rotV * dt;
            this.rotV *= Math.pow(0.6, dt);
            this.flut += dt * 15;
            this.life -= dt;
        }
        draw(ctx) {
            const wob = this.wide * (0.35 + 0.65 * Math.abs(Math.sin(this.flut)));
            ctx.save();
            ctx.globalAlpha = clamp(this.life / this.max, 0, 1);
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.fillStyle = this.col.main;
            ctx.beginPath();
            ctx.moveTo(-this.len / 2, 0);
            ctx.quadraticCurveTo(0, -this.len * wob, this.len / 2, 0);
            ctx.quadraticCurveTo(0, -this.len * wob * 0.45, -this.len / 2, 0);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(-this.len / 2, 0);
            ctx.quadraticCurveTo(0, -this.len * wob, 0, -this.len * wob * 0.5);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    /* Giọt cao su li ti bắn ra cùng lúc */
    class Droplet {
        constructor(x, y, col) {
            const a = rnd(0, TAU), sp = rnd(190, 640);
            this.x = x; this.y = y;
            this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp;
            this.r = rnd(1.2, 3.4);
            this.col = col;
            this.life = rnd(0.25, 0.6); this.max = this.life;
        }
        update(dt) {
            this.vy += G * 0.8 * dt;
            this.vx *= Math.pow(0.1, dt); this.vy *= Math.pow(0.35, dt);
            this.x += this.vx * dt; this.y += this.vy * dt;
            this.life -= dt;
        }
        draw(ctx) {
            ctx.globalAlpha = clamp(this.life / this.max, 0, 1);
            ctx.fillStyle = this.col;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    /* Vòng sóng: hơi bên trong quả bóng bung ra trong tích tắc */
    class Shock {
        constructor(x, y, r, col) {
            this.x = x; this.y = y; this.r0 = r; this.col = col;
            this.life = 0.26; this.max = 0.26;
        }
        update(dt) { this.life -= dt; }
        draw(ctx) {
            const t = 1 - clamp(this.life / this.max, 0, 1);
            const r = this.r0 * (1 + t * 2.1);
            ctx.save();
            ctx.globalAlpha = (1 - t) * 0.55;
            ctx.strokeStyle = this.col;
            ctx.lineWidth = Math.max(1, this.r0 * 0.28 * (1 - t));
            ctx.beginPath(); ctx.ellipse(this.x, this.y, r, r * 0.94, 0, 0, TAU); ctx.stroke();
            ctx.globalAlpha = (1 - t) * 0.22;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(this.x, this.y, r * 0.72, 0, TAU); ctx.fill();
            ctx.restore();
        }
    }

    /* Phần cổ bóng còn nguyên nút thắt và sợi dây, rơi lả tả xuống đất —
       chi tiết này mới làm cú nổ trông thật, vì bóng bay thật nổ xong đúng
       là còn lại cái cổ. */
    class Neck {
        constructor(x, y, col, r) {
            this.x = x; this.y = y;
            this.vx = rnd(-70, 70); this.vy = rnd(-60, 20);
            this.rot = rnd(0, TAU); this.rotV = rnd(-7, 7);
            this.col = col; this.r = r * 0.3;
            this.sway = rnd(0, TAU);
            this.life = 1.6; this.max = 1.6;
        }
        update(dt) {
            this.vy += G * 0.5 * dt;
            this.vx *= Math.pow(0.3, dt);
            this.vy = Math.min(this.vy, 220);       // sợi dây kéo lê làm nó rơi chậm
            this.x += this.vx * dt; this.y += this.vy * dt;
            this.rot += this.rotV * dt;
            this.rotV *= Math.pow(0.5, dt);
            this.sway += dt * 6;
            this.life -= dt;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = clamp(this.life / this.max, 0, 1);
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.fillStyle = this.col.dark;
            ctx.beginPath();
            ctx.moveTo(-this.r * 0.7, 0);
            ctx.lineTo(this.r * 0.7, 0);
            ctx.lineTo(0, this.r * 1.5);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.2;
            const w = Math.sin(this.sway) * 8;
            ctx.beginPath();
            ctx.moveTo(0, this.r * 1.4);
            ctx.bezierCurveTo(w, this.r * 1.4 + 18, -w, this.r * 1.4 + 36, w * 0.6, this.r * 1.4 + 52);
            ctx.stroke();
            ctx.restore();
        }
    }

    // =========================================================
    //  Mũi phi tiêu
    // =========================================================
    class Dart {
        constructor(x, y, vx, vy, cfg) {
            this.x = x; this.y = y;
            this.vx = vx; this.vy = vy;
            // Rời tay hơi lệch một chút, đuôi cánh sẽ tự chỉnh lại — y như thật
            this.ang = Math.atan2(vy, vx) + rnd(-0.16, 0.16);
            this.cfg = cfg;
            this.alive = true;
            this.stuck = false;
            this.stuckT = 0;
            this.trail = [];
        }

        get tipX() { return this.x + Math.cos(this.ang) * DART_L * 0.5; }
        get tipY() { return this.y + Math.sin(this.ang) * DART_L * 0.5; }

        /* Trả về danh sách quả bóng bị đâm trúng trong bước này. */
        step(dt, wind, balloons, x0, x1) {
            if (this.stuck) {
                this.stuckT += dt;
                if (this.stuckT > 1.5) this.alive = false;
                return [];
            }
            const hit = [];
            const sp0 = Math.hypot(this.vx, this.vy);
            const steps = clamp(Math.ceil(sp0 * dt / 6), 1, 16);
            const h = dt / steps;

            for (let s = 0; s < steps; s++) {
                const px = this.tipX, py = this.tipY;

                const sp = Math.hypot(this.vx, this.vy);
                if (sp > 1) {
                    // Cản không khí: a = 0,032 · v²  (v tính bằng m/s)
                    const a = DRAG_K * sp * sp / PPM;
                    this.vx -= this.vx / sp * a * h;
                    this.vy -= this.vy / sp * a * h;
                }
                this.vy += G * h;
                this.vx += wind * WIND_DART * h;
                this.x += this.vx * h;
                this.y += this.vy * h;

                // Đuôi cánh kéo mũi tiêu quay về đúng hướng đang bay
                const want = Math.atan2(this.vy, this.vx);
                this.ang += angDelta(this.ang, want) * (1 - Math.exp(-ALIGN_RATE * h));

                // Đầu mũi quét qua quả bóng nào thì nổ quả đó
                const nx = this.tipX, ny = this.tipY;
                for (const b of balloons) {
                    if (!b.alive) continue;
                    if (segHitsCircle(px, py, nx, ny, b.x, b.y, b.r)) {
                        b.alive = false;
                        hit.push(b);
                        // Xuyên qua thì chậm lại, còn đủ đà thì nổ tiếp quả nữa
                        this.vx *= 0.62; this.vy *= 0.62;
                    }
                }

                if (ny >= GROUND_Y - 4) {                 // cắm xuống đất
                    this.y += GROUND_Y - 4 - ny;
                    this.stuck = true; this.vx = 0; this.vy = 0;
                    Sfx.stick();
                    break;
                }
                if (nx < x0 - 40 || nx > x1 + 40 || ny < -60) { this.alive = false; break; }
            }

            this.trail.push({ x: this.x, y: this.y, life: 0.16 });
            if (this.trail.length > 10) this.trail.shift();
            for (let i = this.trail.length - 1; i >= 0; i--) {
                this.trail[i].life -= dt;
                if (this.trail[i].life <= 0) this.trail.splice(i, 1);
            }
            return hit;
        }

        draw(ctx) {
            const c = this.cfg;
            // vệt gió sau đuôi
            for (const t of this.trail) {
                ctx.globalAlpha = clamp(t.life / 0.16, 0, 1) * 0.2;
                ctx.strokeStyle = c.light;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(t.x, t.y);
                ctx.lineTo(t.x - Math.cos(this.ang) * 9, t.y - Math.sin(this.ang) * 9);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.ang);
            const L = DART_L, w = DART_W;

            // Cánh đuôi: bốn lá xoè ra
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.moveTo(-L * 0.5, 0);
            ctx.lineTo(-L * 0.2, -w * 1.5);
            ctx.lineTo(-L * 0.08, -w * 0.35);
            ctx.lineTo(-L * 0.08, w * 0.35);
            ctx.lineTo(-L * 0.2, w * 1.5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = c.light;
            ctx.beginPath();
            ctx.moveTo(-L * 0.5, 0);
            ctx.lineTo(-L * 0.2, -w * 1.5);
            ctx.lineTo(-L * 0.14, -w * 0.5);
            ctx.closePath();
            ctx.fill();

            // Cán thép có khía chống trượt
            const bg = ctx.createLinearGradient(0, -w, 0, w);
            bg.addColorStop(0, '#f2f6fb');
            bg.addColorStop(0.45, '#aab5c4');
            bg.addColorStop(1, '#5d6675');
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.roundRect(-L * 0.16, -w * 0.55, L * 0.5, w * 1.1, w * 0.4);
            ctx.fill();
            ctx.fillStyle = 'rgba(30,36,48,0.55)';
            for (let i = 0; i < 4; i++) ctx.fillRect(-L * 0.06 + i * L * 0.09, -w * 0.55, 1.4, w * 1.1);

            // Mũi nhọn
            ctx.fillStyle = '#e9edf4';
            ctx.beginPath();
            ctx.moveTo(L * 0.34, -w * 0.34);
            ctx.lineTo(L * 0.5, 0);
            ctx.lineTo(L * 0.34, w * 0.34);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    /* Đoạn thẳng (đường đi của đầu mũi) có cắt qua hình tròn (quả bóng) không.
       Phải xét cả đoạn thẳng chứ không chỉ điểm cuối, vì mũi tiêu bay rất
       nhanh — nếu chỉ xét điểm cuối thì nó sẽ xuyên thẳng qua bóng mà không nổ. */
    function segHitsCircle(ax, ay, bx, by, cx, cy, r) {
        const dx = bx - ax, dy = by - ay;
        const fx = ax - cx, fy = ay - cy;
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-6) return fx * fx + fy * fy <= r * r;
        const t = clamp(-(fx * dx + fy * dy) / len2, 0, 1);
        const px = ax + dx * t - cx, py = ay + dy * t - cy;
        return px * px + py * py <= r * r;
    }

    // =========================================================
    //  Một gian hàng = một bé
    // =========================================================
    class Booth {
        constructor(idx, x0, w) {
            this.idx = idx;
            this.cfg = PLAYERS[idx];
            this.x0 = x0; this.w = w;
            this.x1 = x0 + w;
            this.cx = x0 + w / 2;

            /* Tầm quét của mũi tên ngắm vừa đủ phủ hết bề ngang gian hàng —
               gian càng hẹp thì quét càng ngắn, ngắm càng dễ. */
            const halfW = Math.max(60, w / 2 - 40);
            const span = Math.atan2(halfW, THROW_Y - 250) + 0.14;
            this.aMin = Math.PI / 2 - span;
            this.aMax = Math.PI / 2 + span;

            this.reset();
        }

        reset() {
            this.state = 'aim';
            this.angle = this.aMin;
            this.angleDir = 1;
            this.power = 0;
            this.powerDir = 1;
            this.armed = true;
            this.chargeHold = 0;
            this.chargeBeep = 0;

            this.balloons = [];
            this.darts = [];
            this.shreds = []; this.drops = []; this.shocks = []; this.necks = [];
            this.fx = [];
            this.spawnT = 0;

            this.score = 0;
            this.throws = 0;
            this.hits = 0;                  // số MŨI phi có trúng bóng
            this.pops = 0;                  // số QUẢ nổ được (một mũi có thể nổ nhiều quả)
            this.tripleT = 0;               // còn mấy giây được bắn chùm ba mũi
            this.streak = 0;
            this.bestStreak = 0;
            this.onFire = false;
            this.golds = 0;
            this.bombs = 0;

            this.pendingHits = 0;           // lượt ném này đã nổ được mấy quả
            this.throwT = 0;
            this.armWind = 0;               // 0 = duỗi tay, 1 = kéo hết ra sau
            this.bodyBob = 0;
            this.flash = 0;
            this.shake = 0;
            this.outcome = null;
            this.celebT = 0;
            this.tears = [];
            this.confetti = [];
        }

        // ---------- Bóng bay ----------
        spawnBalloon(mode, diff, first) {
            let k;
            if (mode.small) k = pick([KIND.small, KIND.small, KIND.gold, KIND.mid, KIND.bomb]);
            else {
                const total = KINDS.reduce((s, v) => s + v.w, 0);
                let r = Math.random() * total;
                k = KINDS[0];
                for (const v of KINDS) { r -= v.w; if (r <= 0) { k = v; break; } }
            }
            const pad = k.r + 18;
            const x = rnd(this.x0 + pad, this.x1 - pad);
            const y = first ? rnd(BAL_TOP + 80, BAL_BOT) : BAL_BOT + k.r + rnd(10, 60);
            const b = new Balloon(k, x, y, diff);
            b.squash = 1;
            this.balloons.push(b);
        }

        // ---------- Điều khiển ----------
        press() {
            if (this.state !== 'aim' || !this.armed) return;
            this.state = 'charge';
            this.power = 0;
            this.powerDir = 1;
            this.chargeHold = 0;
            this.chargeBeep = 0;
        }

        release() { if (this.state === 'charge') this.doThrow(); }

        // Kiểu kéo-thả cho màn hình cảm ứng: kéo lùi như bắn ná
        dragAim(dx, dy) {
            if (this.state === 'fly') return;
            const d = Math.hypot(dx, dy);
            if (d < 8) return;
            this.state = 'charge';
            this.angle = clamp(Math.atan2(dy, dx), this.aMin, this.aMax);
            this.power = clamp(d / 190, 0, 1);
        }

        doThrow() {
            const speed = lerp(SPEED_MIN, SPEED_MAX, this.power);
            // Đang có phép thì ba mũi toả ra, hết phép về lại một mũi
            const angles = this.tripleT > 0
                ? [this.angle - TRIPLE_SPREAD, this.angle, this.angle + TRIPLE_SPREAD]
                : [this.angle];
            for (const a of angles) {
                const dx = Math.cos(a), dy = -Math.sin(a);
                this.darts.push(new Dart(
                    this.cx + dx * ARM, THROW_Y - Math.sin(a) * ARM,
                    dx * speed, dy * speed, this.cfg));
            }
            const dx = Math.cos(this.angle), dy = -Math.sin(this.angle);
            this.state = 'fly';
            this.throwT = 0;
            this.pendingHits = 0;
            this.throws++;
            this.armed = false;
            this.armWind = -1;              // vung tay ra trước
            Sfx.throwDart();
        }

        // ---------- Cập nhật ----------
        update(dt, held, mode, diff, wind, playing) {
            // Nạp lại chỉ khi bé đã nhả phím, tránh giữ mãi thành phi liên tục
            if (!held) this.armed = true;
            this.flash = Math.max(0, this.flash - dt * 2.2);
            this.shake *= Math.pow(0.02, dt);

            if (this.tripleT > 0) {
                this.tripleT = Math.max(0, this.tripleT - dt);
                if (this.tripleT === 0) this.addFx('Hết phép chùm', '#9fb3c8', this.cx, THROW_Y - 170, 18);
            }

            if (this.outcome) this.updateCelebration(dt);

            // Bóng bay vẫn bay lên kể cả lúc đếm ngược cho sinh động
            for (const b of this.balloons) b.update(dt, wind, this.x0 + 6, this.x1 - 6);
            this.balloons = this.balloons.filter(b => b.alive);

            if (playing) {
                this.spawnT -= dt;
                const want = mode.alive + (this.w > 500 ? 2 : this.w > 380 ? 1 : 0);
                if (this.spawnT <= 0 && this.balloons.length < want) {
                    this.spawnBalloon(mode, diff, false);
                    this.spawnT = rnd(0.35, 0.9);
                }
            }

            // Mũi tiêu đang bay
            for (const d of this.darts) {
                const popped = d.step(dt, wind, this.balloons, this.x0, this.x1);
                for (const b of popped) this.onPop(b, mode);
            }
            this.darts = this.darts.filter(d => d.alive);

            for (const a of this.shreds) a.update(dt);
            for (const a of this.drops) a.update(dt);
            for (const a of this.shocks) a.update(dt);
            for (const a of this.necks) a.update(dt);
            this.shreds = this.shreds.filter(a => a.life > 0);
            this.drops = this.drops.filter(a => a.life > 0);
            this.shocks = this.shocks.filter(a => a.life > 0);
            this.necks = this.necks.filter(a => a.life > 0 && a.y < H + 40);

            for (let i = this.fx.length - 1; i >= 0; i--) {
                const f = this.fx[i];
                f.life -= dt; f.y -= 42 * dt;
                if (f.life <= 0) this.fx.splice(i, 1);
            }

            if (this.outcome) return;

            switch (this.state) {
                case 'aim': {
                    if (Game.control === 'sweep') {
                        // Mũi tên tự lắc qua lắc lại, bé canh đúng lúc mà bấm
                        this.angle += this.angleDir * diff.sweep * dt;
                        if (this.angle > this.aMax) { this.angle = this.aMax; this.angleDir = -1; }
                        if (this.angle < this.aMin) { this.angle = this.aMin; this.angleDir = 1; }
                        if (held) this.press();
                    }
                    this.armWind = lerp(this.armWind, 0, dt * 8);
                    this.bodyBob = lerp(this.bodyBob, 0, dt * 8);
                    break;
                }
                case 'charge': {
                    this.chargeHold += dt;
                    if (Game.control === 'sweep') {
                        this.power += this.powerDir * diff.power * dt;
                        if (this.power > 1) { this.power = 1; this.powerDir = -1; }
                        if (this.power < 0) { this.power = 0; this.powerDir = 1; }
                        this.chargeBeep -= dt;
                        if (this.chargeBeep <= 0) { Sfx.charge(this.power); this.chargeBeep = 0.09; }
                        if (!held) this.release();
                        else if (this.chargeHold > 4) this.doThrow();
                    }
                    this.armWind = lerp(this.armWind, this.power, dt * 12);
                    this.bodyBob = lerp(this.bodyBob, this.power * 7, dt * 12);
                    break;
                }
                case 'fly': {
                    this.throwT += dt;
                    this.armWind = lerp(this.armWind, -0.35, dt * 9);
                    this.bodyBob = lerp(this.bodyBob, -5, dt * 8);
                    /* Mũi tiêu đã cắm xuống đất hoặc bay ra khỏi gian hàng thì
                       cho bé ngắm lượt mới ngay, khỏi phải chờ. */
                    const flying = this.darts.some(d => !d.stuck);
                    if (!flying || this.throwT > 2.2) this.finishThrow();
                    break;
                }
            }
        }

        finishThrow() {
            if (this.pendingHits > 0) this.hits++;      // mũi này có chạm bóng
            else {
                // Mũi tiêu vừa rồi không trúng quả nào -> đứt chuỗi
                this.streak = 0;
                this.onFire = false;
                this.addFx('TRƯỢT', '#ffb3b3', this.cx, THROW_Y - 130, 20);
                Sfx.miss();
            }
            this.pendingHits = 0;
            this.state = 'aim';
        }

        /* Một quả bóng vừa bị đâm trúng: dựng cả chùm hiệu ứng nổ */
        onPop(b, mode) {
            const k = b.kind, r = b.r;
            this.pendingHits++;

            const nShred = Math.round(11 + r / 4);
            for (let i = 0; i < nShred; i++) this.shreds.push(new Shred(b.x, b.y, b.col, r));
            for (let i = 0; i < 16; i++) this.drops.push(new Droplet(b.x, b.y, b.col.light));
            this.shocks.push(new Shock(b.x, b.y, r, k.bomb ? '#ffb03a' : b.col.light));
            this.necks.push(new Neck(b.x, b.y + r, b.col, r));

            if (k.bomb) {
                this.score += k.pts;
                this.bombs++;
                this.streak = 0;
                this.onFire = false;
                this.shake = 18;
                this.addFx('💣 -3', '#ff8080', b.x, b.y, 26);
                Sfx.bomb();
                Game.bumpCard(this.idx);
                return;
            }

            this.pops++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
            let pts = k.pts * mode.mult;
            let label = `+${pts}`;

            if (k.magic) {
                this.tripleT = TRIPLE_TIME;
                label = `✨ CHÙM 3 MŨI! +${pts}`;
                this.addFx('✨ CHÙM 3 MŨI — 5 GIÂY!', '#7bdcff', this.cx, THROW_Y - 200, 26);
                Sfx.gold();
            }
            else if (k.gold) { this.golds++; Sfx.gold(); label = `🥇 +${pts}`; }
            else Sfx.pop(r);

            if (this.streak === 3 && !this.onFire) {
                this.onFire = true;
                this.addFx('🔥 BỐC LỬA!', '#ffb347', this.cx, THROW_Y - 170, 24);
                Sfx.fire();
            }
            if (this.onFire) { pts += 1; label += ' 🔥'; }

            this.score += pts;
            this.flash = 1;
            this.shake = Math.max(this.shake, 5);
            this.addFx(label, k.gold ? '#ffe58a' : this.cfg.light, b.x, b.y, k.gold ? 26 : 21);
            Game.bumpCard(this.idx);
        }

        addFx(text, color, x, y, size) {
            this.fx.push({ text, color, x, y, size: size || 20, life: 0.95, max: 0.95 });
        }

        // ---------- Ăn mừng / khóc ----------
        setOutcome(o) {
            this.outcome = o;
            this.celebT = 0;
            if (o === 'win') {
                for (let i = 0; i < 40; i++) {
                    this.confetti.push({
                        x: rnd(this.x0, this.x1), y: rnd(-160, -10),
                        vx: rnd(-40, 40), vy: rnd(70, 190),
                        size: rnd(6, 13), rot: rnd(0, TAU), rotV: rnd(-6, 6),
                        color: pick(['#ffd700', '#ff6b6b', '#4dd2ff', '#5ee06a', '#ff7ad9']),
                        life: rnd(2.6, 5)
                    });
                }
            }
        }

        updateCelebration(dt) {
            this.celebT += dt;
            if (this.outcome === 'lose') {
                if (Math.random() < dt * 5) {
                    this.tears.push({ x: rnd(-9, 9), y: 0, vy: rnd(45, 90), life: 1 });
                }
                for (let i = this.tears.length - 1; i >= 0; i--) {
                    const t = this.tears[i];
                    t.y += t.vy * dt; t.vy += 240 * dt; t.life -= dt;
                    if (t.life <= 0) this.tears.splice(i, 1);
                }
            }
            for (let i = this.confetti.length - 1; i >= 0; i--) {
                const c = this.confetti[i];
                c.life -= dt; c.vy += 42 * dt;
                c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.rotV * dt;
                if (c.life <= 0 || c.y > H + 40) this.confetti.splice(i, 1);
            }
        }

        // =============== VẼ ===============
        draw(ctx, time) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(this.x0, 0, this.w, H);
            ctx.clip();
            if (this.shake > 0.4) ctx.translate(rnd(-this.shake, this.shake), rnd(-this.shake, this.shake));

            this.drawBooth(ctx, time);
            for (const b of this.balloons) b.draw(ctx, time);
            for (const a of this.necks) a.draw(ctx);
            for (const a of this.shreds) a.draw(ctx);
            for (const a of this.drops) a.draw(ctx);
            for (const a of this.shocks) a.draw(ctx);
            this.drawThrower(ctx, time);
            for (const d of this.darts) d.draw(ctx);
            if (this.state !== 'fly' && !this.outcome) this.drawAim(ctx, time);
            this.drawFx(ctx);
            this.drawConfetti(ctx);
            ctx.restore();
        }

        /* Gian hàng hội chợ: mái vải sọc, tường gỗ, dãy bóng đèn nhấp nháy */
        drawBooth(ctx, time) {
            const x0 = this.x0, x1 = this.x1, w = this.w;

            // --- Tường gỗ phía sau ---
            const wall = ctx.createLinearGradient(0, 60, 0, GROUND_Y);
            wall.addColorStop(0, '#2b1c33');
            wall.addColorStop(0.55, '#3a2540');
            wall.addColorStop(1, '#241730');
            ctx.fillStyle = wall;
            ctx.fillRect(x0, 0, w, GROUND_Y);
            ctx.strokeStyle = 'rgba(0,0,0,0.22)';
            ctx.lineWidth = 2;
            for (let y = 96; y < GROUND_Y; y += 42) {
                ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
            }
            // đèn sân khấu rọi từ trên xuống
            const beam = ctx.createRadialGradient(this.cx, 70, 30, this.cx, 320, w * 0.95);
            beam.addColorStop(0, 'rgba(255,231,178,0.16)');
            beam.addColorStop(1, 'rgba(0,0,0,0.34)');
            ctx.fillStyle = beam;
            ctx.fillRect(x0, 0, w, GROUND_Y);

            // --- Mái vải sọc hình vỏ sò ---
            const scallops = Math.max(5, Math.round(w / 62));
            const sw = w / scallops;
            for (let i = 0; i < scallops; i++) {
                ctx.fillStyle = i % 2 ? '#e8455f' : '#fff2e6';
                ctx.beginPath();
                ctx.moveTo(x0 + i * sw, 0);
                ctx.lineTo(x0 + (i + 1) * sw, 0);
                ctx.lineTo(x0 + (i + 1) * sw, 44);
                ctx.quadraticCurveTo(x0 + (i + 0.5) * sw, 74, x0 + i * sw, 44);
                ctx.closePath();
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(x0, 60, w, 8);

            // --- Dãy bóng đèn chạy quanh mép gian ---
            const bulbs = Math.max(6, Math.round(w / 46));
            for (let i = 0; i < bulbs; i++) {
                const bx = x0 + 16 + i * ((w - 32) / (bulbs - 1));
                const glow = 0.55 + 0.45 * Math.sin(time * 4 + i * 0.9);
                ctx.fillStyle = `rgba(255,214,120,${(0.16 * glow).toFixed(3)})`;
                ctx.beginPath(); ctx.arc(bx, 78, 13, 0, TAU); ctx.fill();
                ctx.fillStyle = `rgb(255,${(200 + 40 * glow) | 0},${(120 + 90 * glow) | 0})`;
                ctx.beginPath(); ctx.arc(bx, 78, 4.4, 0, TAU); ctx.fill();
            }

            // --- Cột hai bên ---
            ctx.fillStyle = '#1a1024';
            ctx.fillRect(x0, 68, 7, GROUND_Y - 68);
            ctx.fillRect(x1 - 7, 68, 7, GROUND_Y - 68);

            // --- Nền đất + quầy ---
            const gr = ctx.createLinearGradient(0, GROUND_Y, 0, H);
            gr.addColorStop(0, '#3b2a1c');
            gr.addColorStop(1, '#20160f');
            ctx.fillStyle = gr;
            ctx.fillRect(x0, GROUND_Y, w, H - GROUND_Y);
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.fillRect(x0, GROUND_Y, w, 4);

            // --- Biển tên bé treo trên quầy ---
            const c = this.cfg;
            ctx.save();
            ctx.translate(this.cx, GROUND_Y + 34);
            ctx.fillStyle = 'rgba(10,6,18,0.8)';
            ctx.strokeStyle = c.color;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(-84, -17, 168, 34, 12); ctx.fill(); ctx.stroke();
            ctx.fillStyle = c.light;
            ctx.font = 'bold 17px "Baloo 2", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`${c.emoji} ${c.name}`, -12, 1);
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            ctx.font = 'bold 14px "Nunito", sans-serif';
            ctx.fillText(Game.keyLabel(this.idx), 58, 1);
            ctx.restore();
        }

        /* Bé đứng ném: thân người, cánh tay vung theo lực, mặt vui hay buồn */
        drawThrower(ctx, time) {
            const c = this.cfg;
            const win = this.outcome === 'win';
            const lose = this.outcome === 'lose';
            const jump = win ? Math.abs(Math.sin(this.celebT * 6)) * 13 : 0;
            const x = this.cx, y = GROUND_Y - jump + (lose ? 4 : 0);
            const skin = '#f2c89c', skinDark = '#c9975f';

            // bóng đổ
            ctx.fillStyle = 'rgba(0,0,0,0.34)';
            ctx.beginPath();
            ctx.ellipse(x, GROUND_Y + 3, 32, 8, 0, 0, TAU);
            ctx.fill();

            ctx.save();
            ctx.translate(x, y);
            if (lose) ctx.scale(1, 0.93);

            // --- hai chân ---
            for (const sd of [-1, 1]) {
                ctx.fillStyle = c.dark;
                ctx.beginPath(); ctx.roundRect(sd * 5 - 6, -40, 12, 26, 5); ctx.fill();
                ctx.fillStyle = '#e8edf5';
                ctx.beginPath(); ctx.roundRect(sd * 5 - 8, -16, 17, 12, 5); ctx.fill();
            }

            // --- tay không ném (giữ thăng bằng) ---
            ctx.save();
            ctx.translate(-13, -74);
            ctx.rotate(win ? -2.5 : lose ? 0.5 : -0.5 - this.bodyBob * 0.02);
            ctx.fillStyle = c.color;
            ctx.beginPath(); ctx.roundRect(-4.5, -3, 9, 20, 4.5); ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath(); ctx.roundRect(-4, 15, 8, 15, 4); ctx.fill();
            ctx.restore();

            // --- thân áo ---
            const tg = ctx.createLinearGradient(0, -92, 0, -38);
            tg.addColorStop(0, c.light);
            tg.addColorStop(0.5, c.color);
            tg.addColorStop(1, c.dark);
            ctx.fillStyle = tg;
            ctx.beginPath();
            ctx.moveTo(-17, -88);
            ctx.quadraticCurveTo(0, -95, 17, -88);
            ctx.quadraticCurveTo(19, -60, 13, -38);
            ctx.lineTo(-13, -38);
            ctx.quadraticCurveTo(-19, -60, -17, -88);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.beginPath(); ctx.roundRect(-2.5, -86, 5, 46, 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.font = 'bold 15px "Baloo 2", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(this.idx + 1), 0, -64);

            // --- tay ném: kéo về sau khi lấy lực, vung ra khi phi ---
            const armA = win ? -Math.PI * 0.72
                : lose ? Math.PI * 0.12
                    : -this.angle + this.armWind * 1.15;   // càng lấy nhiều lực càng ngửa ra sau
            ctx.save();
            ctx.translate(13, -80);
            ctx.rotate(armA + Math.PI / 2);
            ctx.fillStyle = c.color;
            ctx.beginPath(); ctx.roundRect(-5, -3.5, 10, 21, 5); ctx.fill();
            ctx.fillStyle = skin;
            ctx.beginPath(); ctx.roundRect(-4.4, 16, 8.8, 17, 4.4); ctx.fill();
            ctx.restore();

            // --- đầu ---
            ctx.fillStyle = skin;
            ctx.beginPath(); ctx.arc(0, -104, 15, 0, TAU); ctx.fill();
            ctx.fillStyle = skinDark;
            ctx.beginPath(); ctx.arc(0, -104, 15, Math.PI * 0.15, Math.PI * 0.85); ctx.fill();
            ctx.fillStyle = '#2c1c12';                       // tóc
            ctx.beginPath(); ctx.arc(0, -105.5, 15, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
            // mắt
            ctx.fillStyle = '#241608';
            if (lose) {
                ctx.strokeStyle = '#241608'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-8, -107); ctx.lineTo(-3, -103);
                ctx.moveTo(8, -107); ctx.lineTo(3, -103);
                ctx.stroke();
            } else {
                for (const ex of [-5.2, 5.2]) {
                    ctx.beginPath(); ctx.ellipse(ex, -105, 1.7, 2.3, 0, 0, TAU); ctx.fill();
                }
            }
            // miệng
            ctx.strokeStyle = 'rgba(140,70,50,0.85)';
            ctx.lineWidth = 1.7; ctx.lineCap = 'round';
            ctx.beginPath();
            if (lose) ctx.arc(0, -95, 4.6, Math.PI * 1.15, Math.PI * 1.85);
            else ctx.arc(0, -99, 4.6, Math.PI * 0.12, Math.PI * 0.88);
            ctx.stroke();
            ctx.restore();

            // nước mắt
            for (const t of this.tears) {
                ctx.save();
                ctx.globalAlpha = clamp(t.life, 0, 1);
                ctx.fillStyle = '#8fd8ff';
                ctx.beginPath();
                ctx.ellipse(x + t.x, y - 100 + t.y, 2.6, 4.2, 0, 0, TAU);
                ctx.fill();
                ctx.restore();
            }
        }

        /* Mũi tên ngắm + thanh lực + đường bay dự đoán */
        drawAim(ctx, time) {
            const c = this.cfg;
            const dx = Math.cos(this.angle), dy = -Math.sin(this.angle);
            const hx = this.cx + dx * ARM, hy = THROW_Y + dy * ARM;

            // --- Đường bay dự đoán (chế độ Dễ / Vừa) ---
            if (Game.diffCfg.guide) {
                const speed = lerp(SPEED_MIN, SPEED_MAX, this.state === 'charge' ? this.power : 0.62);
                let px = hx, py = hy, pvx = dx * speed, pvy = dy * speed;
                ctx.save();
                ctx.fillStyle = `rgba(${c.glow},0.5)`;
                const h = 1 / 90;
                for (let i = 0; i < 78; i++) {
                    const sp = Math.hypot(pvx, pvy);
                    if (sp > 1) {
                        const a = DRAG_K * sp * sp / PPM;
                        pvx -= pvx / sp * a * h; pvy -= pvy / sp * a * h;
                    }
                    pvy += G * h;
                    pvx += Game.wind * WIND_DART * h;
                    px += pvx * h; py += pvy * h;
                    if (py > GROUND_Y || px < this.x0 || px > this.x1 || py < 0) break;
                    if (i % 6 === 0) {
                        ctx.globalAlpha = 0.55 * (1 - i / 78);
                        ctx.beginPath(); ctx.arc(px, py, 3.1, 0, TAU); ctx.fill();
                    }
                }
                ctx.restore();
            }

            /* --- Mũi tên ngắm ---
               Vẽ sát người hơn hẳn tầm với của cánh tay: để đúng ở bàn tay thì
               mũi tên trông rời khỏi nhân vật, bé khó thấy nó gắn với ai. Điểm
               ném thật (hx, hy) không đổi nên đường bay vẫn y nguyên. */
            const AIM_GAP = ARM * 0.35;
            const len = 42 + this.power * 34;

            if (this.tripleT > 0) {
                for (const off of [-TRIPLE_SPREAD, TRIPLE_SPREAD]) {
                    const a = this.angle + off;
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.translate(this.cx + Math.cos(a) * AIM_GAP, THROW_Y - Math.sin(a) * AIM_GAP);
                    ctx.rotate(-a);
                    ctx.strokeStyle = c.color;
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(len * 0.82, 0); ctx.stroke();
                    ctx.restore();
                }
                ctx.save();
                ctx.fillStyle = '#7bdcff';
                ctx.font = '800 15px "Baloo 2", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✨ ' + this.tripleT.toFixed(1) + 's', this.cx, THROW_Y - 186);
                ctx.restore();
            }

            const ax = this.cx + dx * AIM_GAP, ay = THROW_Y + dy * AIM_GAP;
            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(-this.angle);
            ctx.strokeStyle = c.color;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowColor = `rgba(${c.glow},0.9)`;
            ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(len, 0); ctx.stroke();
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.moveTo(len + 13, 0);
            ctx.lineTo(len - 3, -7.5);
            ctx.lineTo(len - 3, 7.5);
            ctx.closePath(); ctx.fill();
            ctx.restore();

            // --- Thanh lực ---
            if (this.state === 'charge') {
                const bw = 92, bh = 11;
                const bx = this.cx - bw / 2, by = THROW_Y - 150;
                ctx.fillStyle = 'rgba(6,4,14,0.82)';
                ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 7); ctx.fill();
                const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
                pg.addColorStop(0, '#7bed9f');
                pg.addColorStop(0.55, '#ffd700');
                pg.addColorStop(1, '#ff3b3b');
                ctx.fillStyle = pg;
                ctx.beginPath(); ctx.roundRect(bx, by, bw * this.power, bh, 5); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.4;
                ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 5); ctx.stroke();
            }
        }

        drawFx(ctx) {
            for (const f of this.fx) {
                ctx.save();
                ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
                ctx.font = `bold ${f.size}px "Baloo 2", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.75)';
                ctx.fillText(f.text, f.x + 1.6, f.y + 1.6);
                ctx.fillStyle = f.color;
                ctx.fillText(f.text, f.x, f.y);
                ctx.restore();
            }
        }

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
    }

    // =========================================================
    //  Trò chơi
    // =========================================================
    const Game = {
        canvas: null, ctx: null, viewport: null,
        dpr: 1, scale: 1, ox: 0, oy: 0, cssW: 0, cssH: 0,

        state: 'menu',              // menu | countdown | playing | over | paused
        playerCount: 2,
        mode: 'versus',
        diff: 'normal',
        control: 'sweep',
        guideOn: true,
        booths: [],
        held: [],
        time: 0,
        timeLeft: 0,
        countdown: 3,
        lastTick: -1,
        wind: 0, windTarget: 0, windT: 0,

        get diffCfg() {
            const d = DIFFS[this.diff];
            return this.guideOn ? d : Object.assign({}, d, { guide: false });
        },
        get modeCfg() { return MODES[this.mode]; },

        keyLabel(i) { return KEYLABEL[KEYSETS[this.playerCount][i]] || '?'; },

        init() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.viewport = document.querySelector('.game-viewport');
            this.el = {
                clock: document.getElementById('clock'),
                clockLabel: document.getElementById('clock-label'),
                stripL: document.getElementById('score-left'),
                stripR: document.getElementById('score-right'),
                finals: document.getElementById('final-grid'),
                menu: document.getElementById('screen-menu'),
                pause: document.getElementById('screen-pause'),
                over: document.getElementById('screen-over'),
                hint: document.getElementById('control-hint'),
                overTitle: document.getElementById('over-title'),
                overDesc: document.getElementById('over-desc'),
                overEmoji: document.getElementById('over-emoji'),
                helpLabel: document.getElementById('help-label'),
                helpBtn: document.getElementById('btn-help'),
                soundIcon: document.getElementById('sound-icon')
            };

            this.build(this.playerCount);
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

        // Dựng lại gian hàng + bảng điểm theo số bé
        build(n) {
            this.playerCount = n;
            const w = W / n;
            this.booths = [];
            for (let i = 0; i < n; i++) this.booths.push(new Booth(i, i * w, w));
            this.held = new Array(n).fill(false);

            /* Bảng điểm chia đều hai bên đồng hồ để đồng hồ luôn nằm chính giữa,
               bé nào ngồi đâu cũng liếc thấy giờ. */
            const half = Math.ceil(n / 2);
            const card = (b, i) => `
                <div class="score-card card-p${i + 1}${i >= half ? ' flip' : ''}" data-card="${i}">
                    <div class="score-avatar">${b.cfg.emoji}</div>
                    <div class="score-info">
                        <div class="score-name">${b.cfg.name} <span class="key-tag">${this.keyLabel(i)}</span></div>
                        <div class="score-sub">
                            <span class="streak-tag" data-streak="${i}">Chuỗi: 0</span>
                            <span class="streak-tag" data-acc="${i}">0/0</span>
                        </div>
                    </div>
                    <div class="score-number" data-score="${i}">0</div>
                </div>`;
            this.el.stripL.innerHTML = this.booths.slice(0, half).map((b, i) => card(b, i)).join('');
            this.el.stripR.innerHTML = this.booths.slice(half).map((b, i) => card(b, i + half)).join('');
            const box = i => i < half ? this.el.stripL : this.el.stripR;
            const q = (attr, i) => box(i).querySelector(`[data-${attr}="${i}"]`);
            this.cards = this.booths.map((_, i) => q('card', i));
            this.scoreEls = this.booths.map((_, i) => q('score', i));
            this.streakEls = this.booths.map((_, i) => q('streak', i));
            this.accEls = this.booths.map((_, i) => q('acc', i));

            this.el.finals.className = 'final-grid cols-' + Math.min(n, 4);
            this.el.finals.innerHTML = this.booths.map((b, i) => `
                <div class="final-box final-p${i + 1}" data-final="${i}">
                    <div class="final-avatar">${b.cfg.emoji}</div>
                    <div class="final-name">${b.cfg.name}</div>
                    <div class="final-score" data-fscore="${i}">0</div>
                    <div class="final-stats">
                        <div><span data-fhit="${i}">0/0</span> mũi phi trúng</div>
                        <div><span data-fpop="${i}">0</span> quả bóng nổ</div>
                        <div>Chuỗi dài nhất: <span data-fstreak="${i}">0</span> quả</div>
                        <div>Bóng vàng: <span data-fgold="${i}">0</span> · Bom: <span data-fbomb="${i}">0</span></div>
                    </div>
                </div>`).join('');
            this.finalEls = this.booths.map((_, i) => ({
                box: this.el.finals.querySelector(`[data-final="${i}"]`),
                score: this.el.finals.querySelector(`[data-fscore="${i}"]`),
                hit: this.el.finals.querySelector(`[data-fhit="${i}"]`),
                pop: this.el.finals.querySelector(`[data-fpop="${i}"]`),
                streak: this.el.finals.querySelector(`[data-fstreak="${i}"]`),
                gold: this.el.finals.querySelector(`[data-fgold="${i}"]`),
                bomb: this.el.finals.querySelector(`[data-fbomb="${i}"]`)
            }));

            this.updateHint();
        },

        updateHint() {
            const keys = this.booths.map((b, i) => `${b.cfg.emoji} ${this.keyLabel(i)}`).join(' · ');
            this.el.hint.textContent = this.control === 'sweep'
                ? `${keys} — Mũi tên tự lắc, giữ phím lấy lực rồi thả để phi`
                : `${keys} — Kéo lùi trong gian hàng của mình rồi thả, như bắn ná`;
        },

        bindUI() {
            const sel = (list, attr, fn) => {
                document.querySelectorAll(list).forEach(el => {
                    el.onclick = () => {
                        document.querySelectorAll(list).forEach(o => o.classList.remove('sel'));
                        el.classList.add('sel');
                        fn(el.dataset[attr]);
                    };
                });
            };
            sel('[data-players]', 'players', v => this.build(+v));
            sel('[data-mode]', 'mode', v => { this.mode = v; });
            sel('[data-diff]', 'diff', v => { this.diff = v; });
            sel('[data-ctrl]', 'ctrl', v => { this.control = v; this.updateHint(); });

            document.getElementById('btn-start').onclick = () => this.start();
            document.getElementById('btn-again').onclick = () => this.start();
            document.getElementById('btn-restart').onclick = () => this.start();
            document.getElementById('btn-menu').onclick = () => this.toMenu();
            document.getElementById('btn-back-menu').onclick = () => this.toMenu();
            document.getElementById('btn-resume').onclick = () => this.resume();
            document.getElementById('btn-help').onclick = () => {
                this.guideOn = !this.guideOn;
                this.el.helpLabel.textContent = 'Trợ Giúp Bé: ' + (this.guideOn ? 'BẬT' : 'TẮT');
                this.el.helpBtn.classList.toggle('active', this.guideOn);
            };
            document.getElementById('btn-sound').onclick = () => {
                Sfx.on = !Sfx.on;
                this.el.soundIcon.className = 'fa-solid ' + (Sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
                if (Sfx.on) Sfx.tick();
            };
        },

        bindInput() {
            const codeToIdx = code => KEYSETS[this.playerCount].indexOf(code);
            window.addEventListener('keydown', e => {
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
                if (e.code === 'Escape') { this.togglePause(); return; }
                if (e.repeat) return;
                const i = codeToIdx(e.code);
                if (i >= 0) { this.held[i] = true; Sfx.ensure(); }
            });
            window.addEventListener('keyup', e => {
                const i = codeToIdx(e.code);
                if (i >= 0) this.held[i] = false;
            });

            // Cảm ứng / chuột: mỗi bé chạm vào gian hàng của mình
            const drags = new Map();
            const toGame = e => {
                const r = this.canvas.getBoundingClientRect();
                return {
                    x: (e.clientX - r.left - this.ox * (r.width / this.cssW)) / (this.scale * (r.width / this.cssW)),
                    y: (e.clientY - r.top - this.oy * (r.height / this.cssH)) / (this.scale * (r.height / this.cssH))
                };
            };
            this.canvas.addEventListener('pointerdown', e => {
                if (this.state !== 'playing') return;
                Sfx.ensure();
                const p = toGame(e);
                const i = clamp(Math.floor(p.x / (W / this.playerCount)), 0, this.playerCount - 1);
                drags.set(e.pointerId, { i, x: p.x, y: p.y });
                this.held[i] = true;
                this.canvas.setPointerCapture(e.pointerId);
            });
            this.canvas.addEventListener('pointermove', e => {
                const d = drags.get(e.pointerId);
                if (!d || this.control !== 'drag') return;
                const p = toGame(e);
                const b = this.booths[d.i];
                if (b) b.dragAim(p.x - d.x, p.y - d.y);
            });
            const up = e => {
                const d = drags.get(e.pointerId);
                if (!d) return;
                drags.delete(e.pointerId);
                this.held[d.i] = false;
                const b = this.booths[d.i];
                if (b && this.control === 'drag') b.release();
            };
            this.canvas.addEventListener('pointerup', up);
            this.canvas.addEventListener('pointercancel', up);
        },

        // ---------- Vòng đời ván đấu ----------
        start() {
            this.build(this.playerCount);
            const m = this.modeCfg, d = this.diffCfg;
            this.booths.forEach(b => {
                b.reset();
                for (let i = 0; i < m.alive; i++) b.spawnBalloon(m, d, true);
            });
            this.timeLeft = m.time;
            this.countdown = 3;
            this.lastTick = -1;
            this.wind = this.windTarget = 0;
            this.windT = 2;
            this.state = 'countdown';
            this.el.menu.classList.add('hidden');
            this.el.over.classList.add('hidden');
            this.el.pause.classList.add('hidden');
            this.el.clockLabel.textContent = m.name;
            this.syncHud();
            Sfx.ensure();
        },

        toMenu() {
            this.state = 'menu';
            this.el.menu.classList.remove('hidden');
            this.el.over.classList.add('hidden');
            this.el.pause.classList.add('hidden');
        },

        togglePause() {
            if (this.state === 'playing') {
                this.state = 'paused';
                this.el.pause.classList.remove('hidden');
            } else if (this.state === 'paused') this.resume();
        },

        resume() {
            if (this.state !== 'paused') return;
            this.state = 'playing';
            this.el.pause.classList.add('hidden');
        },

        finish() {
            this.state = 'over';
            const best = Math.max(...this.booths.map(b => b.score));
            const winners = this.booths.filter(b => b.score === best);
            this.booths.forEach(b => b.setOutcome(
                winners.length === this.booths.length ? 'draw'
                    : b.score === best ? 'win' : 'lose'));

            this.finalEls.forEach((e, i) => {
                const b = this.booths[i];
                e.score.textContent = b.score;
                e.hit.textContent = `${b.hits}/${b.throws}`;
                e.pop.textContent = b.pops;
                e.streak.textContent = b.bestStreak;
                e.gold.textContent = b.golds;
                e.bomb.textContent = b.bombs;
                e.box.classList.toggle('winner', b.score === best);
            });

            if (winners.length === this.booths.length) {
                this.el.overEmoji.textContent = '🤝';
                this.el.overTitle.textContent = 'HOÀ RỒI!';
                this.el.overDesc.textContent = `Cả nhà cùng được ${best} điểm — thi lại một ván nữa nhé!`;
            } else {
                const w = winners[0];
                const parts = [`${w.score} điểm`, `nổ ${w.pops} quả bóng`, `${w.hits}/${w.throws} mũi phi trúng`];
                if (w.bestStreak >= 3) parts.push(`chuỗi ${w.bestStreak} quả liên tiếp`);
                if (w.golds > 0) parts.push(`${w.golds} quả bóng vàng`);
                this.el.overEmoji.textContent = '🏆';
                this.el.overTitle.textContent = `${w.cfg.emoji} ${w.cfg.name} THẮNG!`;
                this.el.overDesc.textContent = parts.join(' · ') + ' — tay phi tiêu cừ khôi của gian hàng!';
            }
            this.el.over.classList.remove('hidden');
            Sfx.win();
            if (winners.length < this.booths.length) setTimeout(() => Sfx.lose(), 750);
        },

        bumpCard(i) {
            const card = this.cards[i];
            if (!card) return;
            card.classList.add('pop');
            setTimeout(() => card.classList.remove('pop'), 320);
        },

        syncHud() {
            this.booths.forEach((b, i) => {
                if (this.scoreEls[i]) this.scoreEls[i].textContent = b.score;
                if (this.streakEls[i]) {
                    this.streakEls[i].textContent = b.onFire ? `🔥 Chuỗi: ${b.streak}` : `Chuỗi: ${b.streak}`;
                }
                if (this.accEls[i]) this.accEls[i].textContent = `${b.hits}/${b.throws}`;
            });
            const t = Math.max(0, this.timeLeft);
            this.el.clock.textContent = this.modeCfg.time > 0
                ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
                : '∞';
        },

        // ---------- Vòng lặp ----------
        update(dt) {
            this.time += dt;
            const m = this.modeCfg, d = this.diffCfg;

            // Gió đổi hướng từ từ, chế độ siêu khó thì giật từng cơn
            this.windT -= dt;
            if (this.windT <= 0) {
                this.windTarget = rnd(-1, 1) * d.wind;
                this.windT = d.gust ? rnd(1.1, 2.4) : rnd(2.5, 5);
            }
            this.wind = lerp(this.wind, this.windTarget, clamp(dt * (d.gust ? 2.4 : 0.9), 0, 1));

            if (this.state === 'countdown') {
                const prev = Math.ceil(this.countdown);
                this.countdown -= dt;
                const now = Math.ceil(this.countdown);
                if (now !== prev && now >= 0) {
                    if (now > 0) Sfx.tick(); else Sfx.tone(1046, 0.35, 'triangle', 0.2);
                }
                this.booths.forEach(b => b.update(dt, false, m, d, this.wind, false));
                if (this.countdown <= 0) this.state = 'playing';

            } else if (this.state === 'playing') {
                if (m.time > 0) {
                    this.timeLeft -= dt;
                    const sec = Math.ceil(this.timeLeft);
                    if (sec <= 10 && sec !== this.lastTick && sec > 0) { this.lastTick = sec; Sfx.tick(); }
                    if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish(); }
                }
                this.booths.forEach((b, i) => b.update(dt, this.held[i], m, d, this.wind, true));
                this.syncHud();

            } else if (this.state === 'over') {
                this.booths.forEach(b => b.update(dt, false, m, d, this.wind, false));
            }
        },

        render() {
            const ctx = this.ctx;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.fillStyle = '#0a0616';
            ctx.fillRect(0, 0, this.cssW, this.cssH);

            ctx.save();
            ctx.translate(this.ox, this.oy);
            ctx.scale(this.scale, this.scale);

            this.booths.forEach(b => b.draw(ctx, this.time));

            // Vách ngăn giữa các gian hàng
            for (let i = 1; i < this.playerCount; i++) {
                const x = i * (W / this.playerCount);
                ctx.strokeStyle = 'rgba(255,255,255,0.13)';
                ctx.lineWidth = 2;
                ctx.setLineDash([12, 10]);
                ctx.beginPath(); ctx.moveTo(x, 68); ctx.lineTo(x, GROUND_Y); ctx.stroke();
                ctx.setLineDash([]);
            }

            this.drawWindFlag(ctx);
            if (this.state === 'countdown') this.drawCountdown(ctx);

            ctx.restore();
        },

        /* Lá cờ báo gió: nghiêng theo chiều gió, gió mạnh thì bay căng hơn */
        drawWindFlag(ctx) {
            if (Math.abs(this.wind) < 0.02 && this.diffCfg.wind === 0) return;
            const w = this.wind;
            ctx.save();
            ctx.translate(W / 2, 96);
            ctx.fillStyle = 'rgba(8,5,16,0.7)';
            ctx.beginPath(); ctx.roundRect(-74, -16, 148, 32, 11); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = 'bold 13px "Nunito", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('GIÓ', -50, 0);
            // mũi tên gió
            const dir = w >= 0 ? 1 : -1;
            const len = 18 + Math.abs(w) * 34;
            ctx.strokeStyle = Math.abs(w) > 0.6 ? '#ff8a8a' : '#9fe8ff';
            ctx.fillStyle = ctx.strokeStyle;
            ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-24 * dir + 12, 0); ctx.lineTo(-24 * dir + 12 + len * dir, 0); ctx.stroke();
            const tx = -24 * dir + 12 + len * dir;
            ctx.beginPath();
            ctx.moveTo(tx + 9 * dir, 0);
            ctx.lineTo(tx - 2 * dir, -6);
            ctx.lineTo(tx - 2 * dir, 6);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        },

        drawCountdown(ctx) {
            const n = Math.ceil(this.countdown);
            const f = 1 - (this.countdown - Math.floor(this.countdown));
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = clamp(1.15 - f, 0, 1);
            ctx.translate(W / 2, H / 2 - 40);
            const s = 1 + f * 0.5;
            ctx.scale(s, s);
            ctx.font = 'bold 132px "Baloo 2", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 22;
            ctx.fillText(n > 0 ? String(n) : 'PHI!', 0, 0);
            ctx.restore();
        },

        resize() {
            const r = this.viewport.getBoundingClientRect();
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.cssW = r.width; this.cssH = r.height;
            this.canvas.width = Math.round(r.width * this.dpr);
            this.canvas.height = Math.round(r.height * this.dpr);
            this.canvas.style.width = r.width + 'px';
            this.canvas.style.height = r.height + 'px';
            this.scale = Math.min(r.width / W, r.height / H);
            this.ox = (r.width - W * this.scale) / 2;
            this.oy = (r.height - H * this.scale) / 2;
        }
    };

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
