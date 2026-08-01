/* =========================================================
   AQUA DASH — CUỘC ĐUA ĐÁY BIỂN
   ---------------------------------------------------------
   Game đua ngang dưới nước cho 1–4 bé trên cùng một màn hình. Khung hình tự
   trôi từ trái sang phải; bé nào tụt khỏi mép trái là bị loại. Hết giờ, ai
   nhiều điểm nhất thắng (điểm = kho báu + quãng đường bơi được).

   Bố cục tệp:
     1. Hằng số & dữ liệu
     2. Tiện ích, bộ sinh ngẫu nhiên có hạt giống
     3. Lưu trữ hồ sơ
     4. Âm thanh
     5. Nhân vật thợ lặn — vẽ tay bằng đường cong, không dùng emoji
     6. Sinh địa hình theo từng mảnh (chunk)
     7. Người chơi & vật lý
     8. Bẫy, cá cưỡi, bảo bối, sự kiện
     9. Vẽ
    10. HUD, bảng chọn, nhập liệu, khởi động
   ========================================================= */

(function () {
    'use strict';

    /* =====================================================
       1. HẰNG SỐ & DỮ LIỆU
       ===================================================== */

    const TILE = 50;                  // 1 ô = 1 mét
    const ROWS = 18;                  // chiều cao thế giới: 18m
    const WORLD_H = ROWS * TILE;      // 900px
    const CHUNK_COLS = 28;            // mỗi mảnh dài 28m — đúng khoảng 20–30m
    const CHUNK_W = CHUNK_COLS * TILE;

    const T_WATER = 0, T_ROCK = 1, T_CORAL = 2;

    /* Bốn bộ phím trải đều bàn phím, giống các game nhiều bé khác của KIBU */
    const CONTROLS = [
        { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', dash: ['KeyQ', 'Space'], label: 'W A S D', dashLabel: 'Q' },
        { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH', dash: ['KeyR'], label: 'T F G H', dashLabel: 'R' },
        { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', dash: ['KeyU'], label: 'I J K L', dashLabel: 'U' },
        { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', dash: ['Slash', 'ShiftRight'], label: '↑ ← ↓ →', dashLabel: '/' }
    ];
    const SLOTS = { 1: [0], 2: [0, 3], 3: [0, 1, 3], 4: [0, 1, 2, 3] };

    /* Bộ đồ lặn: đúng dải màu trong bảng thiết kế nhân vật (xanh dương, đỏ,
       xanh lá, tím, đen, trắng). Bé 1 được chọn, các bé sau lấy màu còn lại. */
    const SUITS = [
        { id: 'blue', name: 'Xanh Biển', body: '#2f6fd0', dark: '#1d4a94', light: '#5b9df0', trim: '#ffc247', fin: '#ff8c1a' },
        { id: 'red', name: 'Đỏ Lửa', body: '#d93b3b', dark: '#9b2020', light: '#ff7676', trim: '#ffd76b', fin: '#ff8c1a' },
        { id: 'green', name: 'Xanh Lá', body: '#4aa832', dark: '#2f7020', light: '#84d95f', trim: '#ffe07a', fin: '#ff9f2e' },
        { id: 'purple', name: 'Tím Mộng', body: '#8c4ad4', dark: '#5f2c96', light: '#bb8bff', trim: '#ffd76b', fin: '#ff8c1a' },
        { id: 'dark', name: 'Đen Bí Ẩn', body: '#3b4250', dark: '#232833', light: '#69748a', trim: '#ffb545', fin: '#ff8c1a' },
        { id: 'white', name: 'Trắng Băng', body: '#e6edf5', dark: '#b3c0d1', light: '#ffffff', trim: '#57c9ff', fin: '#7fd8ff' }
    ];

    const PLAYER_NAMES = ['BÉ 1', 'BÉ 2', 'BÉ 3', 'BÉ 4'];
    const RING_COLORS = ['#ff6b6b', '#4dc3ff', '#6bf178', '#ffd93d'];

    /* ---------- Tám vùng biển ----------
       speed = hệ số tốc độ trôi màn hình, dense = mật độ chướng ngại,
       dark = độ tối, cur = độ mạnh dòng nước. */
    const WORLDS = [
        {
            id: 'reef', emoji: '🪸', name: 'RẠN SAN HÔ', diff: 1,
            speed: 0.92, dense: 0.75, dark: 0, cur: 0.6,
            hazards: ['jelly', 'urchin', 'crab', 'weed'],
            pal: { far: '#0a5f86', mid: '#0d7ba6', near: '#16a2c4', rock: '#04202f', rockLit: '#2a86a0', plant: '#3fd8a0', accent: '#ff8fa3' }
        },
        {
            id: 'kelp', emoji: '🌿', name: 'RỪNG TẢO BIỂN', diff: 2,
            speed: 0.99, dense: 0.9, dark: 0.12, cur: 0.8,
            hazards: ['jelly', 'urchin', 'crab', 'weed', 'eel'],
            pal: { far: '#0a5340', mid: '#0d7355', near: '#19a878', rock: '#03180f', rockLit: '#2e7a58', plant: '#7ceb86', accent: '#ffd76b' }
        },
        {
            id: 'wreck', emoji: '🏴‍☠️', name: 'TÀU CƯỚP BIỂN ĐẮM', diff: 3,
            speed: 1.05, dense: 1.0, dark: 0.26, cur: 0.85,
            hazards: ['jelly', 'urchin', 'eel', 'octo', 'mine', 'clam'],
            pal: { far: '#4a3418', mid: '#6b4a22', near: '#9c6f34', rock: '#180f06', rockLit: '#6f5837', plant: '#8fbf6a', accent: '#ffd76b' }
        },
        {
            id: 'crystal', emoji: '💎', name: 'HANG PHA LÊ', diff: 4,
            speed: 1.11, dense: 1.12, dark: 0.4, cur: 0.95,
            hazards: ['jelly', 'urchin', 'eel', 'rock', 'clam', 'mine'],
            pal: { far: '#2b2470', mid: '#3d349b', near: '#6a5fd0', rock: '#0c0929', rockLit: '#5b50b4', plant: '#8fd7ff', accent: '#ff9df0' }
        },
        {
            id: 'frozen', emoji: '🧊', name: 'BIỂN BĂNG GIÁ', diff: 5,
            speed: 1.16, dense: 1.2, dark: 0.2, cur: 1.1,
            hazards: ['urchin', 'weed', 'rock', 'clam', 'jelly', 'eel'],
            pal: { far: '#2c6b8f', mid: '#4a9ec0', near: '#8fd8ef', rock: '#0d2f45', rockLit: '#79b8d4', plant: '#c9f4ff', accent: '#ffffff' }
        },
        {
            id: 'volcano', emoji: '🌋', name: 'NÚI LỬA ĐÁY BIỂN', diff: 6,
            speed: 1.21, dense: 1.3, dark: 0.3, cur: 1.2,
            hazards: ['urchin', 'crab', 'eel', 'rock', 'mine', 'shark'],
            pal: { far: '#5c1a12', mid: '#8a2c17', near: '#c9552a', rock: '#20080a', rockLit: '#8c3c23', plant: '#ffb648', accent: '#ff5d3d' }
        },
        {
            id: 'abyss', emoji: '🕳️', name: 'VỰC THẲM', diff: 7,
            speed: 1.26, dense: 1.4, dark: 0.66, cur: 1.25,
            hazards: ['jelly', 'eel', 'octo', 'shark', 'mine', 'clam'],
            pal: { far: '#04101e', mid: '#0a2138', near: '#17527a', rock: '#020a12', rockLit: '#1e4257', plant: '#37d0ff', accent: '#9d7dff' }
        },
        {
            id: 'atlantis', emoji: '🏛️', name: 'ATLANTIS CỔ ĐẠI', diff: 8,
            speed: 1.32, dense: 1.5, dark: 0.42, cur: 1.35,
            hazards: ['jelly', 'urchin', 'eel', 'octo', 'shark', 'mine', 'clam', 'rock'],
            pal: { far: '#0d3b4f', mid: '#186b83', near: '#3fb4b0', rock: '#04161f', rockLit: '#5f9a93', plant: '#9ff7d8', accent: '#ffe08a' }
        }
    ];

    /* ---------- Kho báu ---------- */
    const PICKUPS = {
        coin: { emoji: '🪙', score: 20, r: 13 },
        pearl: { emoji: '🫧', score: 35, r: 13 },
        star: { emoji: '⭐', score: 60, r: 15 },
        gem: { emoji: '💎', score: 150, r: 16 },
        chest: { emoji: '🧰', score: 280, r: 21 }
    };

    /* ---------- Cá cho cưỡi ---------- */
    const MOUNTS = {
        dolphin: { emoji: '🐬', name: 'Cá Heo', dur: 10, speed: 1.75, accel: 1.6, note: 'Nhanh như tên lửa!' },
        turtle: { emoji: '🐢', name: 'Rùa Biển', dur: 13, speed: 1.0, accel: 1.05, invuln: true, note: 'Mai rùa chắn hết bẫy!' },
        sword: { emoji: '🗡️', name: 'Cá Kiếm', dur: 10, speed: 1.6, accel: 1.5, breaks: true, note: 'Húc thủng san hô!' },
        octo: { emoji: '🐙', name: 'Bạch Tuộc', dur: 11, speed: 1.15, accel: 1.2, ability: 'ink', note: 'Bấm lướt để phun mực!' },
        puffer: { emoji: '🐡', name: 'Cá Nóc', dur: 11, speed: 1.05, accel: 1.15, ability: 'push', note: 'Bấm lướt để hất bạn ra!' },
        manta: { emoji: '🐟', name: 'Cá Đuối', dur: 12, speed: 1.4, accel: 1.15, ignoreCurrent: true, note: 'Dòng nước chịu thua!' }
    };
    const MOUNT_KEYS = Object.keys(MOUNTS);

    /* ---------- Bảo bối ---------- */
    const POWERS = {
        speed: { emoji: '⚡', name: 'Bong Bóng Tốc Độ', dur: 7 },
        magnet: { emoji: '🧲', name: 'Nam Châm Kho Báu', dur: 8 },
        shield: { emoji: '🛡️', name: 'Khiên San Hô', dur: 9 },
        double: { emoji: '✨', name: 'Nhân Đôi Điểm', dur: 8 },
        combo: { emoji: '🔥', name: 'Giữ Chuỗi Lâu Hơn', dur: 11 },
        radar: { emoji: '📡', name: 'Ra-đa Kho Báu', dur: 11 },
        time: { emoji: '⏱️', name: 'Thêm 15 Giây', dur: 0 }
    };
    const POWER_KEYS = Object.keys(POWERS);

    /* ---------- Bẫy ---------- */
    const HAZARDS = {
        jelly: { emoji: '🪼', name: 'Sứa', r: 20, pen: 25, stun: 0.9, move: 'drift', speed: 26 },
        urchin: { emoji: '🦔', name: 'Nhím Biển', r: 17, pen: 30, knock: 300, move: 'static' },
        coral: { emoji: '☠️', name: 'San Hô Độc', r: 18, pen: 40, slow: 3, move: 'static' },
        weed: { emoji: '🌿', name: 'Rong Dính', r: 26, pen: 0, slow: 2.4, move: 'static' },
        eel: { emoji: '⚡', name: 'Lươn Điện', r: 19, pen: 35, stun: 0.8, knock: 240, move: 'patrolY', speed: 96 },
        crab: { emoji: '🦀', name: 'Cua Cáu Kỉnh', r: 18, pen: 28, knock: 280, move: 'chase', speed: 92, range: 230 },
        rock: { emoji: '🪨', name: 'Đá Rơi', r: 19, pen: 32, stun: 0.6, move: 'fall', speed: 170 },
        octo: { emoji: '🦑', name: 'Mực Phun', r: 20, pen: 20, blind: 4, move: 'patrolY', speed: 54 },
        mine: { emoji: '💣', name: 'Mìn Biển', r: 20, pen: 55, knock: 420, drop: true, move: 'static' },
        clam: { emoji: '🐚', name: 'Sò Khổng Lồ', r: 22, pen: 20, trap: 1.4, move: 'static' },
        shark: { emoji: '🦈', name: 'Cá Mập', r: 30, pen: 60, knock: 360, stun: 0.5, drop: true, move: 'hunt', speed: 150 }
    };

    const SCORE_PER_METER = 2;
    const COMBO_WINDOW = 2.6;
    const COMBO_MAX_MULT = 5;

    /* Loại mảnh địa hình — trộn ngẫu nhiên nên không ván nào giống ván nào */
    const CHUNK_KINDS = ['treasure', 'obstacle', 'cave', 'current', 'chase', 'event', 'open'];

    const EVENTS = ['treasureRush', 'jellyStorm', 'sharkFrenzy', 'bubbleBoost',
        'darkness', 'goldRain', 'reverse', 'whale', 'kraken'];

    /* =====================================================
       2. TIỆN ÍCH
       ===================================================== */

    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
    const rpick = arr => arr[Math.floor(Math.random() * arr.length)];

    function makeRng(seed) {
        let s = seed >>> 0;
        return function () {
            s |= 0; s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* =====================================================
       3. LƯU TRỮ
       ===================================================== */

    const STORE_KEY = 'kibuAquaDash';
    const Store = {
        data: { best: {}, suit: 'blue', sound: true, races: 0 },
        load() {
            try {
                const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
                Object.keys(this.data).forEach(k => {
                    if (raw[k] != null && typeof raw[k] === typeof this.data[k]) this.data[k] = raw[k];
                });
            } catch (e) { /* chế độ riêng tư */ }
        },
        save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { } }
    };

    /* =====================================================
       4. ÂM THANH
       ===================================================== */

    class Sfx {
        constructor() { this.ctx = null; this.enabled = true; this.music = null; this.step = 0; this.hot = false; }

        init() {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.5;
                this.master.connect(this.ctx.destination);
                this.mGain = this.ctx.createGain();
                this.mGain.gain.value = 0.2;
                this.mGain.connect(this.master);
            }
            if (this.ctx.state === 'suspended') this.ctx.resume();
        }

        tone(type, f0, f1, dur, vol, dest) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(f0, t);
            if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3));
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(dest || this.master);
            o.start(t); o.stop(t + dur + 0.02);
        }

        noise(dur, vol, freq) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const len = Math.floor(this.ctx.sampleRate * dur);
            const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            const src = this.ctx.createBufferSource(); src.buffer = buf;
            const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 900;
            const g = this.ctx.createGain(); g.gain.value = vol;
            src.connect(f); f.connect(g); g.connect(this.master);
            src.start(t);
        }

        coin(combo) { const k = Math.min(combo || 0, 12); this.tone('square', 760 * Math.pow(1.05, k), 1140 * Math.pow(1.05, k), 0.1, 0.13); }
        pearl(combo) { const k = Math.min(combo || 0, 12); this.tone('sine', 660 * Math.pow(1.06, k), 1040 * Math.pow(1.06, k), 0.13, 0.16); }
        big() { [523, 659, 880, 1174].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f * 1.4, 0.2, 0.16), i * 70)); }
        chest() { this.noise(0.24, 0.15, 480); this.big(); }
        dash() { this.noise(0.16, 0.12, 1600); this.tone('sawtooth', 220, 660, 0.15, 0.08); }
        hurt() { this.tone('sawtooth', 250, 70, 0.3, 0.19); this.noise(0.18, 0.11, 300); }
        bump() { this.tone('square', 180, 120, 0.1, 0.1); }
        power() { [659, 880, 1174].forEach((f, i) => setTimeout(() => this.tone('sine', f, f * 1.4, 0.15, 0.15), i * 55)); }
        mount() { [392, 587, 784].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f * 1.3, 0.18, 0.14), i * 65)); }
        event() { [523, 440, 659, 880].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.18, 0.13), i * 100)); }
        beep(hi) { this.tone('square', hi ? 1046 : 660, hi ? 1400 : 660, 0.15, 0.17); }
        out() { this.tone('sawtooth', 400, 80, 0.6, 0.2); }
        fanfare() {
            [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => setTimeout(() => {
                this.tone('triangle', f, f, 0.26, 0.19);
                this.tone('sine', f * 2, f * 2, 0.18, 0.07);
            }, i * 125));
        }

        // Nhạc nền chạy nhanh dần: 30 giây cuối đổi sang quãng gấp gáp
        start() {
            this.stop();
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const calm = [196, 247, 294, 247, 220, 262, 330, 262];
            const rush = [294, 370, 440, 370, 330, 392, 494, 392];
            const tick = () => {
                if (!this.enabled || !this.ctx) return;
                const seq = this.hot ? rush : calm;
                const f = seq[this.step % seq.length];
                this.tone('sine', f, f, this.hot ? 0.22 : 0.42, 0.09, this.mGain);
                if (this.step % 4 === 0) this.tone('triangle', f / 2, f / 2, 0.5, 0.06, this.mGain);
                this.step++;
            };
            tick();
            this.music = setInterval(tick, 460);
        }
        setHot(on) { if (this.hot !== on) { this.hot = on; if (this.music) { clearInterval(this.music); this.music = null; this.start(); } } }
        stop() { if (this.music) { clearInterval(this.music); this.music = null; } this.hot = false; }
    }

    const audio = new Sfx();

    /* Kho ảnh emoji dựng sẵn: vẽ fillText mỗi khung hình vừa chậm vừa đi qua lớp
       dịch của i18n (nó vá CanvasRenderingContext2D.fillText). */
    const spriteCache = new Map();

    function emojiSprite(ch, size) {
        const key = ch + '@' + size;
        let c = spriteCache.get(key);
        if (c) return c;
        c = document.createElement('canvas');
        const pad = Math.ceil(size * 0.2);
        c.width = c.height = size + pad * 2;
        const g = c.getContext('2d');
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        CanvasRenderingContext2D.prototype.fillText.call(g, ch, c.width / 2, c.height / 2 + size * 0.04);
        spriteCache.set(key, c);
        return c;
    }

    function drawEmoji(ctx, ch, x, y, size, alpha) {
        const q = clamp(Math.ceil(pixelRatio * G.camera.zoom * 2) / 2, 1, 3);
        const px = Math.max(8, Math.ceil(size * q / 4) * 4);
        const s = emojiSprite(ch, px);
        const dw = s.width / q, dh = s.height / q;
        if (alpha != null && alpha < 1) {
            ctx.save(); ctx.globalAlpha *= alpha;
            ctx.drawImage(s, x - dw / 2, y - dh / 2, dw, dh);
            ctx.restore();
        } else {
            ctx.drawImage(s, x - dw / 2, y - dh / 2, dw, dh);
        }
    }

    /* =====================================================
       5. NHÂN VẬT THỢ LẶN
       ---------------------------------------------------
       Vẽ tay bằng đường cong chứ không dùng emoji: bé cần một nhân vật riêng,
       có mặt mũi, có tóc, có chân vịt đạp nước và đổi màu theo từng bé.

       Hệ toạ độ nội bộ: nhân vật nằm ngang, mặt quay sang phải, gốc toạ độ ở
       giữa thân. Dài khoảng 78 đơn vị từ mũi chân vịt tới chóp mũi.
       ===================================================== */

    const SKIN = '#ffd2a8', SKIN_DARK = '#e8ae7d';
    const HAIR = '#7b4a24', HAIR_LIGHT = '#a26a37';

    function rr(ctx, x, y, w, h, r) {
        const k = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
        ctx.beginPath();
        ctx.moveTo(x + k, y);
        ctx.arcTo(x + w, y, x + w, y + h, k);
        ctx.arcTo(x + w, y + h, x, y + h, k);
        ctx.arcTo(x, y + h, x, y, k);
        ctx.arcTo(x, y, x + w, y, k);
        ctx.closePath();
    }

    function ellipse(ctx, x, y, rx, ry, rot) {
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832);
    }

    /* Chân vịt: bàn chân cam to bản, hơi cong theo nhịp đạp */
    function drawFin(ctx, suit, ang, len, wid, shade) {
        ctx.save();
        ctx.rotate(ang);
        ctx.fillStyle = shade ? '#d9701a' : suit.fin;
        ctx.beginPath();
        ctx.moveTo(0, -wid * 0.42);
        ctx.quadraticCurveTo(-len * 0.6, -wid * 0.72, -len, -wid * 0.2);
        ctx.quadraticCurveTo(-len * 1.06, 0, -len, wid * 0.2);
        ctx.quadraticCurveTo(-len * 0.6, wid * 0.72, 0, wid * 0.42);
        ctx.closePath();
        ctx.fill();
        // gân chân vịt
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-4, 0); ctx.lineTo(-len * 0.86, 0);
        ctx.stroke();
        ctx.restore();
    }

    /* Chân: đùi + cẳng + chân vịt, xoay quanh hông theo nhịp đạp nước */
    function drawLegFin(ctx, suit, hipX, hipY, ang, shade) {
        ctx.save();
        ctx.translate(hipX, hipY);
        ctx.rotate(ang);
        ctx.fillStyle = shade ? suit.dark : suit.body;
        rr(ctx, -24, -7, 26, 14, 7);
        ctx.fill();
        ctx.fillStyle = shade ? 'rgba(0,0,0,0.15)' : suit.trim;
        rr(ctx, -14, -7, 4, 14, 2);
        ctx.fill();
        ctx.translate(-24, 0);
        ctx.rotate(-ang * 0.35);
        drawFin(ctx, suit, 0, 26, 19, shade);
        ctx.restore();
    }

    /* Vẽ nhân vật.
       p: { suit, kick, tilt, face, state, alpha }

       Sơ đồ (mặt quay sang phải, gốc ở giữa thân):
         chân vịt  -70 ── hông -26 ── thân ── vai +14 ── đầu +30 ── tay với tới +48
       Thứ tự vẽ đi từ lớp sau ra lớp trước để tay trước và tóc luôn nổi lên trên. */
    function drawDiver(ctx, x, y, scale, p) {
        const suit = p.suit;
        const st = p.state || 'swim';
        const kick = p.kick || 0;
        const dashing = st === 'dash';
        const out = st === 'out';

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale * (p.face < 0 ? -1 : 1), scale);
        if (p.alpha != null) ctx.globalAlpha *= p.alpha;
        ctx.rotate(out ? Math.PI * 0.93 + Math.sin(kick * 0.5) * 0.1 : (p.tilt || 0));

        if (dashing) {
            ctx.save();
            ctx.strokeStyle = 'rgba(215,248,255,0.8)';
            ctx.lineCap = 'round';
            for (let i = 0; i < 4; i++) {
                ctx.lineWidth = 3.4 - i * 0.6;
                const ox = -74 - i * 15;
                ctx.beginPath();
                ctx.moveTo(ox, -18 + i * 11);
                ctx.lineTo(ox - 26 - i * 8, -18 + i * 11);
                ctx.stroke();
            }
            ctx.restore();
        }

        const kickA = Math.sin(kick) * (dashing ? 0.18 : 0.46);
        const armSwing = dashing ? 0.02 : Math.sin(kick * 0.9) * 0.16 + 0.06;

        // ---- Tay sau (ép sát thân) ----
        ctx.save();
        ctx.translate(2, 7);
        ctx.rotate(2.95 + Math.sin(kick * 0.9) * 0.08);
        ctx.fillStyle = suit.dark;
        rr(ctx, 0, -4.5, 17, 9, 4.5);
        ctx.fill();
        ctx.fillStyle = SKIN_DARK;
        ctx.beginPath(); ctx.arc(18, 0, 4.5, 0, 6.2832); ctx.fill();
        ctx.restore();

        // ---- Bình dưỡng khí ----
        ctx.save();
        ctx.translate(-12, -16);
        ctx.rotate(-0.12);
        ctx.fillStyle = '#e8ad2e';
        rr(ctx, -14, -8, 30, 16, 8);
        ctx.fill();
        ctx.fillStyle = '#b7811a';
        rr(ctx, -14, -8, 30, 6, 5);
        ctx.fill();
        ctx.fillStyle = '#8d949e';
        rr(ctx, 12, -5, 7, 10, 3);
        ctx.fill();
        ctx.strokeStyle = '#c9d2dc';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(17, -2);
        ctx.quadraticCurveTo(30, -10, 34, -2);
        ctx.stroke();
        ctx.restore();

        // ---- Chân sau ----
        drawLegFin(ctx, suit, -22, 8, -kickA * 1.1 + 0.18, true);

        // ---- Thân người ----
        ctx.fillStyle = suit.body;
        ctx.beginPath();
        ctx.moveTo(-28, -8);
        ctx.quadraticCurveTo(-12, -17, 6, -14);
        ctx.quadraticCurveTo(17, -12, 18, -3);
        ctx.quadraticCurveTo(19, 6, 8, 12);
        ctx.quadraticCurveTo(-10, 18, -28, 9);
        ctx.quadraticCurveTo(-32, 0, -28, -8);
        ctx.closePath();
        ctx.fill();

        // ngực sáng màu
        ctx.save();
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = suit.light;
        ctx.beginPath();
        ctx.moveTo(-14, 4);
        ctx.quadraticCurveTo(0, 14, 14, 6);
        ctx.quadraticCurveTo(2, 17, -16, 11);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // dây đai + huy hiệu ngực
        ctx.fillStyle = suit.trim;
        rr(ctx, -8, -14, 7, 29, 3.5);
        ctx.fill();
        ctx.beginPath(); ctx.arc(8, -3, 5, 0, 6.2832); ctx.fill();
        ctx.fillStyle = suit.dark;
        ctx.beginPath(); ctx.arc(8, -3, 2.4, 0, 6.2832); ctx.fill();

        // ---- Chân trước ----
        drawLegFin(ctx, suit, -22, -1, kickA + 0.05, false);

        // ---- Tay trước ----
        // Vẽ TRƯỚC cái đầu và vươn ngang tầm vai: bản trước để tay quét qua đỉnh
        // đầu nên ống tay xanh phủ kín mái tóc.
        ctx.save();
        ctx.translate(10, 3);
        ctx.rotate(armSwing);
        ctx.fillStyle = suit.body;
        rr(ctx, 0, -5, 26, 10, 5);
        ctx.fill();
        ctx.fillStyle = suit.trim;
        rr(ctx, 20, -5, 4, 10, 2);
        ctx.fill();
        ctx.fillStyle = SKIN;
        ctx.beginPath(); ctx.arc(28, 0, 5.6, 0, 6.2832); ctx.fill();
        ctx.restore();

        // ---- Đầu ----
        ctx.save();
        ctx.translate(31, -10);
        ctx.rotate(out ? 0 : Math.sin(kick * 0.5) * 0.07 - 0.1);

        // tóc sau gáy
        ctx.fillStyle = HAIR;
        ctx.beginPath();
        ctx.moveTo(-4, -10);
        ctx.quadraticCurveTo(-17, -6, -13, 8);
        ctx.quadraticCurveTo(-8, 2, -3, 3);
        ctx.closePath();
        ctx.fill();

        // mặt
        ctx.fillStyle = SKIN;
        ellipse(ctx, 0, 0, 12.5, 12);
        ctx.fill();

        // tai
        ctx.fillStyle = SKIN_DARK;
        ellipse(ctx, -7, 2, 3, 3.6);
        ctx.fill();

        // tóc chỏm bù xù — vẽ SAU khuôn mặt để luôn nổi lên
        ctx.fillStyle = HAIR;
        ctx.beginPath();
        ctx.moveTo(-12, -3);
        ctx.quadraticCurveTo(-13.5, -13, -4, -13.5);
        ctx.lineTo(-7, -19);
        ctx.lineTo(0, -14.5);
        ctx.lineTo(1.5, -20);
        ctx.lineTo(7, -13);
        ctx.lineTo(11, -16.5);
        ctx.lineTo(11.5, -7.5);
        ctx.quadraticCurveTo(2, -12, -12, -3);
        ctx.closePath();
        ctx.fill();
        ctx.save();
        ctx.globalAlpha *= 0.45;
        ctx.fillStyle = HAIR_LIGHT;
        ctx.beginPath();
        ctx.moveTo(-7, -10.5);
        ctx.quadraticCurveTo(1, -14.5, 8, -11);
        ctx.quadraticCurveTo(0, -10.5, -7, -10.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // dây kính vòng qua tóc — mảnh thôi, đừng nuốt mất tóc như bản trước
        ctx.strokeStyle = suit.trim;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, -1, 12, Math.PI * 0.82, Math.PI * 1.42);
        ctx.stroke();

        // kính lặn nằm trên mặt
        ctx.fillStyle = suit.trim;
        rr(ctx, -1, -9, 14.5, 11.5, 5);
        ctx.fill();
        ctx.fillStyle = 'rgba(160, 232, 255, 0.95)';
        rr(ctx, 0.4, -7.6, 11.6, 8.7, 4);
        ctx.fill();
        ctx.save();
        ctx.globalAlpha *= 0.65;
        ctx.fillStyle = '#ffffff';
        rr(ctx, 1.6, -6.8, 4.5, 3, 1.6);
        ctx.fill();
        ctx.restore();

        // mắt
        if (out) {
            ctx.strokeStyle = '#3a2a1a';
            ctx.lineWidth = 1.9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(5, -6.5); ctx.lineTo(9.5, -2);
            ctx.moveTo(9.5, -6.5); ctx.lineTo(5, -2);
            ctx.stroke();
        } else if (st === 'hurt') {
            ctx.strokeStyle = '#2b1c10';
            ctx.lineWidth = 1.9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(4.5, -4.5); ctx.quadraticCurveTo(7.5, -7, 10.5, -4.5);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#ffffff';
            ellipse(ctx, 7.4, -3.6, 4, 4.3);
            ctx.fill();
            ctx.fillStyle = '#2a7fd0';
            ellipse(ctx, 8.4, -3.5, 2.6, 2.9);
            ctx.fill();
            ctx.fillStyle = '#10243c';
            ellipse(ctx, 8.9, -3.4, 1.3, 1.5);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ellipse(ctx, 7.6, -4.9, 1.1, 1.1);
            ctx.fill();
        }

        // miệng + má
        ctx.strokeStyle = '#a8543c';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (out) ctx.arc(7, 7, 3, Math.PI, 0);
        else if (st === 'hurt') ellipse(ctx, 7, 6.5, 3, 3.2);
        else ctx.arc(6.5, 4, 4, 0.2, Math.PI - 0.25);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,130,130,0.32)';
        ellipse(ctx, 2, 5.5, 3.4, 2.2);
        ctx.fill();

        ctx.restore();

        // Sao bay quanh đầu khi trúng bẫy
        if (st === 'hurt') {
            ctx.fillStyle = '#ffd76b';
            for (let i = 0; i < 3; i++) {
                const a = kick * 2 + i * 2.1;
                ctx.save();
                ctx.translate(30 + Math.cos(a) * 20, -28 + Math.sin(a * 1.3) * 6);
                ctx.rotate(a);
                ctx.beginPath();
                for (let k = 0; k < 5; k++) {
                    const ang = -Math.PI / 2 + k * Math.PI * 0.8;
                    ctx.lineTo(Math.cos(ang) * 5, Math.sin(ang) * 5);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        ctx.restore();
    }

    /* =====================================================
       6. SINH ĐỊA HÌNH THEO MẢNH
       Mỗi mảnh dài 28m, bốc ngẫu nhiên trong bảy kiểu rồi ghép lại, nên không
       ván nào giống ván nào mà độ khó vẫn tăng đều.
       ===================================================== */

    function newChunk(index, world, rng) {
        const grid = new Uint8Array(CHUNK_COLS * ROWS);
        const c = {
            index, x: index * CHUNK_W, grid,
            pickups: [], hazards: [], mounts: [], powers: [], fields: [], plants: [], kind: 'open'
        };
        const at = (col, row, v) => { if (col >= 0 && col < CHUNK_COLS && row >= 0 && row < ROWS) grid[row * CHUNK_COLS + col] = v; };
        const wx = col => c.x + (col + 0.5) * TILE;
        const wy = row => (row + 0.5) * TILE;

        // Mảnh mở đầu luôn thoáng để bé kịp làm quen
        c.kind = index < 2 ? 'open' : rpick(CHUNK_KINDS);
        const d = world.dense * (1 + Math.min(1, index / 26) * 0.55);

        // --- Trần và đáy: luôn có, độ dày thay đổi cho địa hình gợn sóng ---
        const topBase = 1 + Math.round(rng() * 1.5);
        const botBase = 1 + Math.round(rng() * 1.5);
        for (let col = 0; col < CHUNK_COLS; col++) {
            const t = topBase + Math.round(Math.sin((index * 3 + col) * 0.32) * 1.4 + rng() * 0.8);
            const b = botBase + Math.round(Math.cos((index * 5 + col) * 0.28) * 1.4 + rng() * 0.8);
            for (let r = 0; r < Math.max(1, t); r++) at(col, r, T_ROCK);
            for (let r = 0; r < Math.max(1, b); r++) at(col, ROWS - 1 - r, T_ROCK);
        }

        // Ba làn: trên / giữa / dưới. Làn khó hơn thì thưởng đậm hơn.
        const LANES = [
            { row: 5, risk: 1.35 },
            { row: 9, risk: 1.0 },
            { row: 13, risk: 1.2 }
        ];

        function treasureLine(lane, col0, len, kind) {
            for (let i = 0; i < len; i++) {
                const col = col0 + i;
                if (col >= CHUNK_COLS) break;
                const row = lane.row + Math.round(Math.sin(i * 0.6) * 1.2);
                if (grid[row * CHUNK_COLS + col] !== T_WATER) continue;
                c.pickups.push({ kind, x: wx(col), y: wy(row), r: PICKUPS[kind].r, alive: true, t: rng() * 6 });
            }
        }

        function putHazard(kind, col, row) {
            const meta = HAZARDS[kind];
            if (!meta) return;
            const h = {
                kind, meta, x: wx(col), y: wy(row), r: meta.r, t: rng() * 6,
                vx: 0, vy: 0, homeY: wy(row), alive: true, angle: rng() * 6.28, dir: rng() < 0.5 ? -1 : 1
            };
            if (meta.move === 'patrolY') h.vy = h.dir * meta.speed;
            if (meta.move === 'fall') { h.ceil = wy(row); h.wait = rng() * 2.5; }
            c.hazards.push(h);
        }

        function wall(col, from, to) { for (let r = from; r <= to; r++) at(col, r, T_ROCK); }

        switch (c.kind) {
            case 'treasure': {
                LANES.forEach((lane, li) => {
                    const kind = li === 1 ? 'coin' : (rng() < 0.5 ? 'pearl' : 'coin');
                    treasureLine(lane, 2 + Math.floor(rng() * 4), 8 + Math.floor(rng() * 8), kind);
                });
                const rich = LANES[rng() < 0.5 ? 0 : 2];
                c.pickups.push({ kind: 'chest', x: wx(14 + Math.floor(rng() * 8)), y: wy(rich.row), r: PICKUPS.chest.r, alive: true, t: 0 });
                for (let i = 0; i < Math.round(2 * d); i++) putHazard(rpick(world.hazards), 6 + Math.floor(rng() * 20), 4 + Math.floor(rng() * 10));
                break;
            }

            case 'obstacle': {
                // Cột đá chừa khe: bé phải chọn khe nào mà lách
                const cols = 3 + Math.round(d);
                for (let k = 0; k < cols; k++) {
                    const col = 3 + k * Math.floor((CHUNK_COLS - 6) / cols) + Math.floor(rng() * 2);
                    const gap = 1 + Math.floor(rng() * 3);       // khe ở làn nào
                    const gapRow = LANES[Math.min(2, gap - 1 + Math.floor(rng() * 2))].row;
                    wall(col, 3, Math.max(3, gapRow - 2));
                    wall(col, Math.min(ROWS - 4, gapRow + 2), ROWS - 4);
                    at(col, gapRow - 2, T_CORAL);
                    at(col, gapRow + 2, T_CORAL);
                    if (rng() < 0.6 * d) putHazard(rpick(world.hazards), col + 1, gapRow + (rng() < 0.5 ? -1 : 1));
                    c.pickups.push({ kind: rng() < 0.3 ? 'star' : 'coin', x: wx(col), y: wy(gapRow), r: 14, alive: true, t: 0 });
                }
                break;
            }

            case 'cave': {
                // Đường hầm hẹp lượn sóng, thưởng đậm cho bé dám chui
                let row = 6 + Math.floor(rng() * 6);
                for (let col = 0; col < CHUNK_COLS; col++) {
                    row = clamp(row + (rng() < 0.5 ? -1 : 1), 4, ROWS - 6);
                    for (let r = 3; r < ROWS - 3; r++) {
                        if (r < row - 1 || r > row + 1) at(col, r, T_ROCK);
                    }
                    if (col % 3 === 0) c.pickups.push({ kind: rng() < 0.25 ? 'gem' : 'pearl', x: wx(col), y: wy(row), r: 14, alive: true, t: 0 });
                }
                break;
            }

            case 'current': {
                const bands = 2 + Math.round(rng() * 2);
                for (let k = 0; k < bands; k++) {
                    const row = 4 + Math.floor(rng() * (ROWS - 9));
                    const h = (1 + Math.floor(rng() * 2)) * TILE;
                    const vertical = rng() < 0.4;
                    c.fields.push({
                        kind: 'current', x: c.x + rng() * CHUNK_W * 0.3, y: wy(row) - h / 2,
                        w: CHUNK_W * (0.6 + rng() * 0.4), h,
                        fx: vertical ? 0 : (rng() < 0.72 ? 1 : -1) * rnd(120, 220) * world.cur,
                        fy: vertical ? (rng() < 0.5 ? -1 : 1) * rnd(110, 190) * world.cur : 0
                    });
                }
                if (rng() < 0.6) c.fields.push({ kind: 'whirl', x: c.x + rnd(CHUNK_W * 0.2, CHUNK_W * 0.8), y: wy(4 + rng() * (ROWS - 8)), r: rnd(90, 150), power: rnd(170, 260) * world.cur, spin: rng() < 0.5 ? -1 : 1 });
                if (rng() < 0.5) c.fields.push({ kind: 'vent', x: c.x + rnd(CHUNK_W * 0.2, CHUNK_W * 0.8), y: (ROWS - 4) * TILE, r: rnd(80, 130), power: rnd(300, 460) });
                if (rng() < 0.4) c.fields.push({ kind: 'cold', x: c.x + rnd(CHUNK_W * 0.2, CHUNK_W * 0.8), y: wy(4 + rng() * (ROWS - 8)), r: rnd(90, 140) });
                LANES.forEach(lane => { if (rng() < 0.7) treasureLine(lane, 3 + Math.floor(rng() * 6), 6, 'coin'); });
                break;
            }

            case 'chase': {
                // Đoạn trống trải cho cá mập và lươn phóng thẳng
                for (let i = 0; i < Math.round(3 * d); i++) putHazard(rng() < 0.4 ? 'eel' : rpick(world.hazards), 4 + Math.floor(rng() * 22), 4 + Math.floor(rng() * 10));
                LANES.forEach(lane => treasureLine(lane, 2 + Math.floor(rng() * 4), 10, 'coin'));
                c.pickups.push({ kind: 'star', x: wx(10 + Math.floor(rng() * 10)), y: wy(4 + Math.floor(rng() * 10)), r: 15, alive: true, t: 0 });
                break;
            }

            case 'event': {
                // Khoảng sân rộng để sự kiện lớn diễn ra thoải mái
                c.pickups.push({ kind: 'gem', x: wx(8 + Math.floor(rng() * 12)), y: wy(4 + Math.floor(rng() * 10)), r: 16, alive: true, t: 0 });
                LANES.forEach(lane => { if (rng() < 0.5) treasureLine(lane, 4, 6, 'pearl'); });
                break;
            }

            default: {           // 'open'
                LANES.forEach(lane => { if (rng() < 0.8) treasureLine(lane, 2 + Math.floor(rng() * 6), 6 + Math.floor(rng() * 6), rng() < 0.3 ? 'pearl' : 'coin'); });
                for (let i = 0; i < Math.round(1.5 * d); i++) putHazard(rpick(world.hazards), 6 + Math.floor(rng() * 20), 4 + Math.floor(rng() * 10));
            }
        }

        // Bảo bối và cá cưỡi rải đều mọi kiểu mảnh
        if (index > 1 && rng() < 0.55) {
            c.powers.push({ type: rpick(POWER_KEYS), x: wx(4 + Math.floor(rng() * 20)), y: wy(4 + Math.floor(rng() * 10)), r: 18, alive: true, t: rng() * 6 });
        }
        if (index > 1 && rng() < 0.4) {
            c.mounts.push({ type: rpick(MOUNT_KEYS), x: wx(4 + Math.floor(rng() * 20)), y: wy(4 + Math.floor(rng() * 10)), r: 22, alive: true, t: rng() * 6 });
        }

        // Rong biển mọc từ đáy & trần cho sinh động
        for (let col = 0; col < CHUNK_COLS; col++) {
            for (let r = 1; r < ROWS - 1; r++) {
                if (grid[r * CHUNK_COLS + col] !== T_WATER) continue;
                const below = grid[(r + 1) * CHUNK_COLS + col];
                if (below !== T_WATER && rng() < 0.32) {
                    c.plants.push({ x: wx(col) + rnd(-10, 10), y: (r + 1) * TILE, h: rnd(30, 95), w: rnd(4, 9), ph: rng() * 6.28, up: true });
                }
                const above = r > 0 ? grid[(r - 1) * CHUNK_COLS + col] : 1;
                if (above !== T_WATER && rng() < 0.16) {
                    c.plants.push({ x: wx(col) + rnd(-10, 10), y: r * TILE, h: rnd(20, 60), w: rnd(3, 7), ph: rng() * 6.28, up: false });
                }
                break;
            }
        }

        return c;
    }

    /* =====================================================
       7. TRẠNG THÁI TRẬN ĐUA
       ===================================================== */

    const G = {
        state: 'MENU',                // MENU | COUNTDOWN | RACING | END
        playerCount: 1,
        worldIdx: 0,
        raceTime: 180,
        time: 0,
        countdown: 0,
        world: null,
        level: null,
        players: [],
        particles: [], texts: [], bubbles: [], drops: [],
        event: null, eventData: null, eventTimer: 22,
        darkBoost: 0, currentFlip: 1, boost: 0,
        shake: 0,
        scroll: 0,                    // tốc độ trôi hiện tại (px/giây)
        camera: { x: 0, y: 0, zoom: 1 },
        rng: Math.random
    };

    let keys = {};
    const touch = { active: false, dx: 0, dy: 0, dash: false };

    const BASE_SCROLL = 138;
    const BASE_ACCEL = 1400;
    const BASE_DRAG = 3.2;
    const SINK = 26;
    const DASH_IMPULSE = 430;
    const DASH_CD = 0.95;
    const DASH_TIME = 0.3;

    /* ---------- Dòng chảy mảnh: cấp phát / thu hồi ---------- */
    function makeLevel(world, seed) {
        return { world, rng: makeRng(seed), chunks: new Map(), seed };
    }

    function ensureChunks(level, camX, viewW) {
        const first = Math.floor(camX / CHUNK_W) - 1;
        const last = Math.floor((camX + viewW) / CHUNK_W) + 2;
        for (let i = first; i <= last; i++) {
            if (i < 0 || level.chunks.has(i)) continue;
            level.chunks.set(i, newChunk(i, level.world, makeRng((level.seed + i * 2654435761) >>> 0)));
        }
        // Dọn mảnh đã trôi qua từ lâu để bộ nhớ không phình theo độ dài cuộc đua
        for (const [i, ch] of level.chunks) {
            if (ch.x + CHUNK_W < camX - CHUNK_W * 2) level.chunks.delete(i);
        }
    }

    function chunkAt(level, x) { return level.chunks.get(Math.floor(x / CHUNK_W)); }

    function tileAt(level, x, y) {
        if (x < 0) return T_ROCK;
        if (y < 0 || y >= WORLD_H) return T_ROCK;
        const ch = chunkAt(level, x);
        if (!ch) return T_WATER;
        const col = Math.floor((x - ch.x) / TILE);
        const row = Math.floor(y / TILE);
        if (col < 0 || col >= CHUNK_COLS || row < 0 || row >= ROWS) return T_WATER;
        return ch.grid[row * CHUNK_COLS + col];
    }

    function breakTile(level, x, y) {
        const ch = chunkAt(level, x);
        if (!ch) return;
        const col = Math.floor((x - ch.x) / TILE), row = Math.floor(y / TILE);
        if (col < 0 || col >= CHUNK_COLS || row < 0 || row >= ROWS) return;
        ch.grid[row * CHUNK_COLS + col] = T_WATER;
        audio.noise(0.16, 0.11, 700);
        burst(ch.x + (col + 0.5) * TILE, (row + 0.5) * TILE, '#ff8fa3', 10);
    }

    /* Duyệt qua các mảnh đang hiện trên màn hình */
    function visibleChunks(level, camX, viewW) {
        const out = [];
        const first = Math.floor(camX / CHUNK_W) - 1;
        const last = Math.floor((camX + viewW) / CHUNK_W) + 1;
        for (let i = first; i <= last; i++) {
            const ch = level.chunks.get(i);
            if (ch) out.push(ch);
        }
        return out;
    }

    /* =====================================================
       8. NGƯỜI CHƠI
       ===================================================== */

    class Racer {
        constructor(index, slot, suit, x, y) {
            this.index = index;
            this.ctrl = CONTROLS[slot];
            this.suit = suit;
            this.ring = RING_COLORS[index];
            this.name = PLAYER_NAMES[index];
            this.x = x; this.y = y;
            this.vx = 0; this.vy = 0;
            this.r = 19;
            this.face = 1;
            this.tilt = 0;
            this.kick = Math.random() * 6;
            this.score = 0;
            this.maxX = x;
            this.combo = 0; this.comboT = 0; this.bestCombo = 0;
            this.dashCd = 0; this.dashT = 0;
            this.stun = 0; this.slow = 0; this.blind = 0; this.trap = 0;
            this.invuln = 1.5;
            this.mount = null; this.mountT = 0;
            this.buffs = { speed: 0, magnet: 0, shield: 0, double: 0, combo: 0, radar: 0 };
            this.stats = { coins: 0, pearls: 0, stars: 0, gems: 0, chests: 0, hits: 0, rides: 0, bumps: 0 };
            this.out = false;
            this.outAt = 0;
            this.warn = 0;
            this.behind = 0;
            this.hurtT = 0;
            this.trailT = 0;
        }

        get mult() {
            const m = 1 + Math.min(COMBO_MAX_MULT - 1, Math.floor(this.combo / 4));
            return this.buffs.double > 0 ? m * 2 : m;
        }

        get meters() { return Math.max(0, Math.floor(this.maxX / TILE)); }

        input() {
            const c = this.ctrl;
            let dx = 0, dy = 0, dash = false;
            if (keys[c.left]) dx -= 1;
            if (keys[c.right]) dx += 1;
            if (keys[c.up]) dy -= 1;
            if (keys[c.down]) dy += 1;
            if (c.dash.some(k => keys[k])) dash = true;
            if (this.index === 0 && touch.active) {
                dx += touch.dx; dy += touch.dy;
                if (touch.dash) dash = true;
            }
            const len = Math.hypot(dx, dy);
            if (len > 1) { dx /= len; dy /= len; }
            return { dx, dy, dash };
        }

        update(dt, level) {
            if (this.out) { this.kick += dt * 2; this.y += Math.sin(this.kick) * 6 * dt; return; }

            const inp = this.input();

            this.invuln = Math.max(0, this.invuln - dt);
            this.stun = Math.max(0, this.stun - dt);
            this.slow = Math.max(0, this.slow - dt);
            this.blind = Math.max(0, this.blind - dt);
            this.trap = Math.max(0, this.trap - dt);
            this.dashCd = Math.max(0, this.dashCd - dt);
            this.dashT = Math.max(0, this.dashT - dt);
            this.hurtT = Math.max(0, this.hurtT - dt);
            this.warn = Math.max(0, this.warn - dt);
            for (const k in this.buffs) this.buffs[k] = Math.max(0, this.buffs[k] - dt);

            if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }

            if (this.mount) {
                this.mountT -= dt;
                if (this.mountT <= 0) {
                    floatText(this.x, this.y - 30, MOUNTS[this.mount].emoji + ' tạm biệt!', '#8fd7ff');
                    this.mount = null;
                }
            }

            const m = this.mount ? MOUNTS[this.mount] : null;
            const frozen = this.stun > 0 || this.trap > 0;

            let accel = BASE_ACCEL * (m ? m.accel : 1);
            if (this.buffs.speed > 0) accel *= 1.34;
            if (G.boost > 0) accel *= 1.25;
            if (this.slow > 0) accel *= 0.5;
            if (frozen) accel = 0;

            if (!frozen && (inp.dx || inp.dy)) this.kick += dt * 9;
            else this.kick += dt * 3;
            const stroke = 0.8 + 0.3 * Math.sin(this.kick);

            this.vx += inp.dx * accel * stroke * dt;
            this.vy += inp.dy * accel * stroke * dt;
            this.vy += SINK * (m ? 0.4 : 1) * dt;

            if (inp.dash && this.dashCd <= 0 && !frozen) {
                let dx = inp.dx, dy = inp.dy;
                if (!dx && !dy) { dx = 1; dy = 0; }
                const len = Math.hypot(dx, dy) || 1;
                const pw = DASH_IMPULSE * (m ? m.speed : 1);
                this.vx += (dx / len) * pw;
                this.vy += (dy / len) * pw;
                this.dashCd = DASH_CD;
                this.dashT = DASH_TIME;
                audio.dash();
                for (let i = 0; i < 8; i++) spark(this.x, this.y, -(dx / len) * rnd(40, 150), -(dy / len) * rnd(40, 150), 'rgba(200,245,255,0.85)', rnd(3, 6), 0.45);
                if (m && m.ability === 'ink') this.ink();
                if (m && m.ability === 'push') this.puff();
            }

            // Dòng chảy
            let cold = false;
            if (!(m && m.ignoreCurrent)) {
                const ch = chunkAt(level, this.x);
                const around = [ch, chunkAt(level, this.x - CHUNK_W), chunkAt(level, this.x + CHUNK_W)];
                for (const c of around) {
                    if (!c) continue;
                    for (const f of c.fields) {
                        if (f.kind === 'current') {
                            if (this.x > f.x && this.x < f.x + f.w && this.y > f.y && this.y < f.y + f.h) {
                                this.vx += f.fx * G.currentFlip * dt;
                                this.vy += f.fy * G.currentFlip * dt;
                            }
                        } else {
                            const dd = dist(this.x, this.y, f.x, f.y);
                            if (dd > f.r) continue;
                            const fall = 1 - dd / f.r;
                            if (f.kind === 'whirl') {
                                const a = Math.atan2(f.y - this.y, f.x - this.x);
                                this.vx += (Math.cos(a) * 0.7 + Math.cos(a + Math.PI / 2) * f.spin) * f.power * fall * dt;
                                this.vy += (Math.sin(a) * 0.7 + Math.sin(a + Math.PI / 2) * f.spin) * f.power * fall * dt;
                            } else if (f.kind === 'vent') {
                                this.vy -= f.power * fall * dt;
                            } else if (f.kind === 'cold') cold = true;
                        }
                    }
                }
            }
            if (G.event === 'bubbleBoost') this.vy -= 200 * dt;

            /* Dây chun: bé nào rơi vào 32% bên trái màn hình được dòng nước đẩy
               theo, càng tụt xa càng đẩy mạnh — sát mép thì nhanh hơn cả tốc độ
               trôi nên luôn bò lại được. Đặt thành SÀN tốc độ chứ không cộng gia
               tốc: cộng gia tốc bị lực cản nước ăn hết, thử 48 giây thì cả bốn
               bé vẫn rớt. */
            const zone = worldViewW() * 0.32;
            const behindBy = (G.camera.x + zone) - this.x;
            if (behindBy > 0 && !frozen) {
                const k = Math.min(1, behindBy / zone);
                const floor = G.scroll * (0.3 + 0.85 * k);
                if (this.vx < floor) this.vx = lerp(this.vx, floor, Math.min(1, dt * 6));
            }

            let drag = BASE_DRAG;
            if (cold) drag *= 2.2;
            if (this.slow > 0) drag *= 1.8;
            if (frozen) drag *= 2.4;
            if (this.dashT > 0) drag *= 0.45;
            const damp = Math.exp(-drag * dt);
            this.vx *= damp; this.vy *= damp;

            const sp = Math.hypot(this.vx, this.vy);
            const cap = 780 * (m ? m.speed : 1);
            if (sp > cap) { this.vx *= cap / sp; this.vy *= cap / sp; }

            this.moveAndCollide(this.vx * dt, this.vy * dt, level);

            if (Math.abs(this.vx) > 15) this.face = this.vx > 0 ? 1 : -1;
            this.tilt = lerp(this.tilt, clamp(this.vy / 500, -0.45, 0.45), Math.min(1, dt * 8));

            // Điểm thưởng theo quãng đường: chỉ tính phần xa nhất từng tới
            if (this.x > this.maxX) {
                const gained = (this.x - this.maxX) / TILE * SCORE_PER_METER;
                this.maxX = this.x;
                this.score += gained;
            }

            this.trailT -= dt;
            if (this.trailT <= 0 && sp > 60) {
                this.trailT = 0.1;
                G.bubbles.push({ x: this.x - this.face * 14, y: this.y - 4, r: rnd(2, 5), vy: -rnd(20, 50), life: rnd(0.6, 1.3), t: 0 });
            }

            this.collect(level);
        }

        moveAndCollide(dx, dy, level) {
            const canBreak = this.dashT > 0 || (this.mount && MOUNTS[this.mount].breaks);
            this.x += dx;
            this.resolve(level, true, canBreak, dx);
            this.y += dy;
            this.resolve(level, false, canBreak, dy);
            this.y = clamp(this.y, this.r, WORLD_H - this.r);
        }

        /* Đẩy ra theo đúng chiều vừa đi tới — so với tâm ô sẽ làm bé kẹt ở góc lõm */
        resolve(level, horizontal, canBreak, delta) {
            const rr2 = this.r * 0.82;
            const c0 = Math.floor((this.x - rr2) / TILE), c1 = Math.floor((this.x + rr2) / TILE);
            const r0 = Math.floor((this.y - rr2) / TILE), r1 = Math.floor((this.y + rr2) / TILE);
            for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                    const tx = c * TILE, ty = r * TILE;
                    const t = tileAt(level, tx + 1, ty + 1);
                    if (t === T_WATER) continue;
                    if (t === T_CORAL && canBreak) { breakTile(level, tx + 1, ty + 1); continue; }
                    if (horizontal) {
                        if (delta > 0) this.x = tx - rr2;
                        else if (delta < 0) this.x = tx + TILE + rr2;
                        else this.x = this.x > tx + TILE / 2 ? tx + TILE + rr2 : tx - rr2;
                        this.vx = 0;
                    } else {
                        if (delta > 0) this.y = ty - rr2;
                        else if (delta < 0) this.y = ty + TILE + rr2;
                        else this.y = this.y > ty + TILE / 2 ? ty + TILE + rr2 : ty - rr2;
                        this.vy = 0;
                    }
                }
            }
        }

        collect(level) {
            const reach = this.buffs.magnet > 0 ? 165 : 30;
            const chs = [chunkAt(level, this.x - CHUNK_W), chunkAt(level, this.x), chunkAt(level, this.x + CHUNK_W)];
            for (const ch of chs) {
                if (!ch) continue;
                for (const p of ch.pickups) {
                    if (!p.alive) continue;
                    const d = dist(this.x, this.y, p.x, p.y);
                    if (this.buffs.magnet > 0 && d < reach && d > this.r) {
                        const a = Math.atan2(this.y - p.y, this.x - p.x);
                        p.x += Math.cos(a) * 300 * (1 - d / reach) * 0.016;
                        p.y += Math.sin(a) * 300 * (1 - d / reach) * 0.016;
                    }
                    if (d < this.r + p.r) this.take(p);
                }
                for (const pod of ch.powers) {
                    if (pod.alive && dist(this.x, this.y, pod.x, pod.y) < this.r + pod.r) this.takePower(pod);
                }
                for (const pod of ch.mounts) {
                    if (pod.alive && dist(this.x, this.y, pod.x, pod.y) < this.r + pod.r) this.takeMount(pod);
                }
            }
            for (const d of G.drops) {
                if (d.alive && dist(this.x, this.y, d.x, d.y) < this.r + d.r) this.take(d);
            }
        }

        take(p) {
            p.alive = false;
            const meta = PICKUPS[p.kind];
            const gain = meta.score * this.mult;
            this.score += gain;
            this.combo++;
            this.comboT = COMBO_WINDOW * (this.buffs.combo > 0 ? 2 : 1);
            if (this.combo > this.bestCombo) this.bestCombo = this.combo;

            if (p.kind === 'chest') {
                this.stats.chests++;
                audio.chest();
                floatText(p.x, p.y - 24, 'RƯƠNG KHO BÁU!', '#ffd76b');
                burst(p.x, p.y, '#ffd76b', 20);
                G.shake = Math.max(G.shake, 7);
                for (let i = 0; i < 6; i++) {
                    const a = rnd(0, 6.28), s = rnd(90, 220);
                    G.drops.push({ kind: 'coin', x: p.x, y: p.y, r: 13, alive: true, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 12, t: 0 });
                }
            } else if (p.kind === 'gem') {
                this.stats.gems++; audio.big(); burst(p.x, p.y, '#b79bff', 14);
            } else if (p.kind === 'star') {
                this.stats.stars++; audio.big(); burst(p.x, p.y, '#ffd76b', 12);
            } else if (p.kind === 'pearl') {
                this.stats.pearls++; audio.pearl(this.combo); burst(p.x, p.y, '#bff4ff', 6);
            } else {
                this.stats.coins++; audio.coin(this.combo); burst(p.x, p.y, '#ffd76b', 5);
            }
            floatText(this.x, this.y - 32, '+' + Math.round(gain), this.ring);
        }

        takePower(pod) {
            pod.alive = false;
            audio.power();
            burst(pod.x, pod.y, '#5cf0c0', 12);
            if (pod.type === 'time') {
                G.time = Math.min(G.raceTime, G.time + 15);
                floatText(this.x, this.y - 32, '+15 GIÂY!', '#5cf0c0');
            } else {
                this.buffs[pod.type] = POWERS[pod.type].dur;
                floatText(this.x, this.y - 32, POWERS[pod.type].emoji + ' ' + POWERS[pod.type].name, '#5cf0c0');
            }
        }

        takeMount(pod) {
            pod.alive = false;
            this.mount = pod.type;
            this.mountT = MOUNTS[pod.type].dur;
            this.stats.rides++;
            audio.mount();
            burst(pod.x, pod.y, '#4fd8ff', 16);
            floatText(this.x, this.y - 34, MOUNTS[pod.type].note, '#4fd8ff');
        }

        ink() {
            for (let i = 0; i < 3; i++) {
                G.particles.push({ x: this.x, y: this.y, vx: -rnd(60, 180), vy: rnd(-50, 50), life: 2.6, t: 0, color: 'rgba(18,8,36,0.75)', size: rnd(26, 44), ink: true });
            }
            G.players.forEach(o => {
                if (o !== this && !o.out && o.x < this.x && dist(o.x, o.y, this.x, this.y) < 200) {
                    o.blind = Math.max(o.blind, 3);
                    floatText(o.x, o.y - 28, 'MÙ MỰC!', '#b79bff');
                }
            });
        }

        puff() {
            G.players.forEach(o => {
                if (o === this || o.out) return;
                const d = dist(o.x, o.y, this.x, this.y);
                if (d < 140) {
                    const a = Math.atan2(o.y - this.y, o.x - this.x);
                    o.vx += Math.cos(a) * 480;
                    o.vy += Math.sin(a) * 480;
                    o.combo = 0;
                    floatText(o.x, o.y - 28, 'VĂNG!', '#ff8fa3');
                }
            });
            burst(this.x, this.y, '#ffd76b', 16);
        }

        hit(h) {
            if (this.out || this.invuln > 0 || this.stun > 0) return;
            const meta = h.meta;
            const m = this.mount ? MOUNTS[this.mount] : null;

            if (m && m.invuln) { floatText(this.x, this.y - 28, '🐢 MAI RÙA CHẶN!', '#5cf0c0'); this.invuln = 0.5; return; }
            if (this.buffs.shield > 0) {
                floatText(this.x, this.y - 28, '🛡️ KHIÊN ĐỠ!', '#5cf0c0');
                this.invuln = 0.6; burst(this.x, this.y, '#5cf0c0', 10);
                return;
            }

            this.stats.hits++;
            this.invuln = 1.1;
            this.hurtT = 0.7;
            this.combo = 0; this.comboT = 0;
            audio.hurt();
            G.shake = Math.max(G.shake, 6);

            if (meta.pen) {
                this.score = Math.max(0, this.score - meta.pen);
                floatText(this.x, this.y - 30, '-' + meta.pen, '#ff7676');
            }
            if (meta.stun) this.stun = meta.stun;
            if (meta.slow) this.slow = meta.slow;
            if (meta.blind) this.blind = meta.blind;
            if (meta.trap) { this.trap = meta.trap; floatText(this.x, this.y - 44, '🐚 BỊ KẸP!', '#ff7676'); }
            if (meta.knock) {
                const a = Math.atan2(this.y - h.y, this.x - h.x);
                this.vx += Math.cos(a) * meta.knock - 60;      // luôn đẩy lùi một chút
                this.vy += Math.sin(a) * meta.knock;
            }
            if (meta.drop) this.dropLoot();
            if (this.mount) { floatText(this.x, this.y - 40, MOUNTS[this.mount].emoji + ' chạy mất!', '#ff7676'); this.mount = null; }
            burst(this.x, this.y, '#ff7676', 12);
        }

        /* Rơi kho báu — bé khác bơi qua nhặt được, đúng tinh thần đua tranh */
        dropLoot() {
            const n = Math.min(3, Math.floor(this.score / 120));
            if (n <= 0) return;
            this.score = Math.max(0, this.score - n * PICKUPS.coin.score);
            for (let i = 0; i < n; i++) {
                const a = rnd(0, 6.28), s = rnd(110, 230);
                G.drops.push({ kind: 'coin', x: this.x, y: this.y, r: 13, alive: true, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 10, t: 0 });
            }
            floatText(this.x, this.y - 44, 'RƠI MẤT KHO BÁU!', '#ff7676');
        }

        eliminate() {
            if (this.out) return;
            this.out = true;
            this.outAt = G.time;
            this.vx = 0; this.vy = -20;
            audio.out();
            showEvent('💨 ' + this.name + ' BỊ TỤT LẠI PHÍA SAU!');
            floatText(this.x, this.y - 40, 'BỊ LOẠI!', '#ff7676');
        }
    }

    /* Huých nhau: đẩy ra hai phía, không ai mất máu — chỉ giành đường */
    function resolveBumps() {
        for (let i = 0; i < G.players.length; i++) {
            for (let j = i + 1; j < G.players.length; j++) {
                const a = G.players[i], b = G.players[j];
                if (a.out || b.out) continue;
                const d = dist(a.x, a.y, b.x, b.y);
                const min = a.r + b.r;
                if (d >= min || d === 0) continue;
                const ang = Math.atan2(b.y - a.y, b.x - a.x);
                const push = (min - d) * 0.5;
                a.x -= Math.cos(ang) * push; a.y -= Math.sin(ang) * push;
                b.x += Math.cos(ang) * push; b.y += Math.sin(ang) * push;
                const f = 210;
                a.vx -= Math.cos(ang) * f; a.vy -= Math.sin(ang) * f;
                b.vx += Math.cos(ang) * f; b.vy += Math.sin(ang) * f;
                if (a.bumpCd == null || a.bumpCd <= 0) {
                    audio.bump();
                    a.stats.bumps++; b.stats.bumps++;
                    a.bumpCd = 0.4; b.bumpCd = 0.4;
                    burst((a.x + b.x) / 2, (a.y + b.y) / 2, '#ffffff', 6);
                }
            }
        }
        G.players.forEach(p => { if (p.bumpCd > 0) p.bumpCd -= 0.016; });
    }

    /* =====================================================
       9. BẪY
       ===================================================== */

    function updateHazards(dt, level, camX, viewW) {
        const chs = visibleChunks(level, camX, viewW);
        for (const ch of chs) {
            for (const h of ch.hazards) {
                if (!h.alive) continue;
                h.t += dt;
                const meta = h.meta;

                switch (meta.move) {
                    case 'drift':
                        h.y = h.homeY + Math.sin(h.t * 1.4) * 42;
                        h.x -= 14 * dt;
                        break;
                    case 'patrolY':
                        h.y += h.vy * dt;
                        if (h.y < TILE * 2 || h.y > WORLD_H - TILE * 2 ||
                            tileAt(level, h.x, h.y + Math.sign(h.vy) * 24) !== T_WATER) h.vy *= -1;
                        break;
                    case 'chase': {
                        const p = nearestPlayer(h.x, h.y);
                        if (p && dist(p.x, p.y, h.x, h.y) < meta.range) {
                            const a = Math.atan2(p.y - h.y, p.x - h.x);
                            h.x += Math.cos(a) * meta.speed * dt;
                            h.y += Math.sin(a) * meta.speed * dt;
                        }
                        break;
                    }
                    case 'fall':
                        if (h.wait > 0) { h.wait -= dt; break; }
                        h.y += meta.speed * dt;
                        if (h.y > WORLD_H - TILE * 2 || tileAt(level, h.x, h.y + 20) !== T_WATER) {
                            burst(h.x, h.y, '#b08968', 8);
                            h.y = h.ceil; h.wait = rnd(1.2, 3);
                        }
                        break;
                    case 'hunt': {
                        /* Cá mập luôn nhắm bé đang ĐỨNG CHÓT — bé dẫn đầu được yên,
                           bé tụt lại bị dí, nên khoảng cách giữa các bé không doãng
                           ra quá xa. */
                        const target = lastPlaceRacer();
                        if (target) {
                            const a = Math.atan2(target.y - h.y, target.x - h.x);
                            h.x += Math.cos(a) * meta.speed * dt;
                            h.y += Math.sin(a) * meta.speed * dt;
                            h.angle = a;
                        }
                        break;
                    }
                }

                if (h.kind === 'octo' && h.t % 3 < dt) {
                    G.particles.push({ x: h.x, y: h.y, vx: -rnd(20, 60), vy: rnd(-25, 25), life: 3, t: 0, color: 'rgba(18,8,36,0.55)', size: rnd(28, 48), ink: true });
                }

                for (const p of G.players) {
                    if (p.out) continue;
                    if (dist(p.x, p.y, h.x, h.y) < p.r + h.r) {
                        p.hit(h);
                        if (h.kind === 'mine') {
                            h.alive = false;
                            burst(h.x, h.y, '#ff8b3d', 26);
                            G.shake = Math.max(G.shake, 12);
                            audio.noise(0.4, 0.22, 220);
                        }
                    }
                }
            }
        }
    }

    function nearestPlayer(x, y) {
        let best = null, bd = Infinity;
        for (const p of G.players) {
            if (p.out) continue;
            const d = dist(p.x, p.y, x, y);
            if (d < bd) { bd = d; best = p; }
        }
        return best;
    }

    function lastPlaceRacer() {
        let best = null;
        for (const p of G.players) {
            if (p.out) continue;
            if (!best || p.x < best.x) best = p;
        }
        return best;
    }

    /* =====================================================
       10. SỰ KIỆN NGẪU NHIÊN
       ===================================================== */

    function updateEvents(dt, level, camX, viewW) {
        G.eventTimer -= dt;
        if (G.eventTimer <= 0 && G.time < G.raceTime - 8) {
            triggerEvent(level, camX, viewW);
            G.eventTimer = rnd(20, 30);
        }

        const e = G.eventData;
        if (!e) return;
        e.t -= dt;

        if (G.event === 'whale' || G.event === 'sharkFrenzy') {
            e.x += e.vx * dt;
            if (G.event === 'whale') {
                G.players.forEach(p => {
                    if (!p.out && Math.abs(p.x - e.x) < 110 && Math.abs(p.y - e.y) < 70) {
                        p.vx += 260 * dt * 6;
                        p.vy -= 70 * dt * 6;
                    }
                });
            } else {
                G.players.forEach(p => {
                    if (p.out) return;
                    e.fins.forEach(f => {
                        const fx = e.x + f.ox, fy = e.y + f.oy;
                        if (dist(p.x, p.y, fx, fy) < 40) p.hit({ x: fx, y: fy, meta: HAZARDS.shark });
                    });
                });
            }
        }

        if (G.event === 'kraken') {
            e.strikeT -= dt;
            if (e.strikeT <= 0) {
                e.strikeT = 0.85;
                e.arms.push({ x: camX + rnd(viewW * 0.2, viewW * 0.95), y: rnd(TILE * 3, WORLD_H - TILE * 3), t: 0 });
                audio.noise(0.3, 0.15, 180);
                G.shake = Math.max(G.shake, 7);
            }
            e.arms.forEach(a => {
                a.t += dt;
                if (a.t > 0.45 && a.t < 0.72) {
                    G.players.forEach(p => {
                        if (!p.out && dist(p.x, p.y, a.x, a.y) < 66) p.hit({ x: a.x, y: a.y, meta: { pen: 35, stun: 0.7, knock: 300 } });
                    });
                }
            });
            e.arms = e.arms.filter(a => a.t < 1.4);
        }

        if (e.t <= 0) {
            if (G.event === 'reverse') G.currentFlip = 1;
            if (G.event === 'darkness') G.darkBoost = 0;
            if (G.event === 'bubbleBoost') G.boost = 0;
            G.event = null; G.eventData = null;
        }
    }

    function triggerEvent(level, camX, viewW) {
        const kind = rpick(EVENTS);
        G.event = kind;
        audio.event();
        const aheadX = () => camX + rnd(viewW * 0.3, viewW * 1.1);

        switch (kind) {
            case 'treasureRush':
                showEvent('💰 CƠN LŨ KHO BÁU!');
                for (let i = 0; i < 26; i++) {
                    G.drops.push({
                        kind: i % 5 === 0 ? 'pearl' : 'coin', x: aheadX(), y: rnd(TILE * 3, WORLD_H - TILE * 3),
                        r: 13, alive: true, vx: rnd(-30, 10), vy: rnd(-20, 20), life: 22, t: 0, float: true
                    });
                }
                G.eventData = { t: 8 };
                break;

            case 'goldRain':
                showEvent('🪙 MƯA VÀNG!');
                for (let i = 0; i < 30; i++) {
                    G.drops.push({ kind: 'coin', x: aheadX(), y: rnd(TILE, TILE * 4), r: 13, alive: true, vx: rnd(-20, 20), vy: rnd(60, 140), life: 18, t: 0 });
                }
                G.eventData = { t: 8 };
                break;

            case 'jellyStorm': {
                showEvent('🪼 BÃO SỨA TRÀN TỚI!');
                const ch = chunkAt(level, camX + viewW);
                if (ch) {
                    for (let i = 0; i < 9; i++) {
                        const y = rnd(TILE * 3, WORLD_H - TILE * 3);
                        ch.hazards.push({
                            kind: 'jelly', meta: HAZARDS.jelly, x: camX + viewW + rnd(0, 700), y,
                            homeY: y, r: HAZARDS.jelly.r, t: rnd(0, 6), vx: 0, vy: 0, alive: true, angle: 0, dir: 1
                        });
                    }
                }
                G.eventData = { t: 10 };
                break;
            }

            case 'sharkFrenzy':
                showEvent('🦈 ĐÀN CÁ MẬP LAO TỚI!');
                G.eventData = {
                    t: 9, x: camX + viewW + 200, y: rnd(WORLD_H * 0.2, WORLD_H * 0.8), vx: -190,
                    fins: Array.from({ length: 4 }, (_, i) => ({ ox: i * 130, oy: rnd(-120, 120) }))
                };
                break;

            case 'bubbleBoost':
                showEvent('🫧 BONG BÓNG NÂNG CẢ NHÀ LÊN!');
                G.boost = 1;
                G.eventData = { t: 6 };
                break;

            case 'darkness':
                showEvent('🌑 BIỂN TỐI SẦM LẠI!');
                G.darkBoost = 0.78;
                G.eventData = { t: 7 };
                break;

            case 'reverse':
                showEvent('🔄 DÒNG NƯỚC ĐỔI CHIỀU!');
                G.currentFlip = -1;
                G.eventData = { t: 9 };
                break;

            case 'whale':
                showEvent('🐋 CÁ VOI KHỔNG LỒ BƠI QUA!');
                G.eventData = { t: 11, x: camX + viewW + 260, y: rnd(WORLD_H * 0.25, WORLD_H * 0.75), vx: -150 };
                break;

            case 'kraken':
                showEvent('🦑 KRAKEN QUẬT VÒI KHẮP NƠI!');
                G.eventData = { t: 8, strikeT: 0.4, arms: [] };
                break;
        }
    }

    /* =====================================================
       11. HIỆU ỨNG NHỎ
       ===================================================== */

    function spark(x, y, vx, vy, color, size, life) { G.particles.push({ x, y, vx, vy, color, size, life, t: 0 }); }

    function burst(x, y, color, n) {
        for (let i = 0; i < n; i++) {
            const a = rnd(0, 6.28), s = rnd(40, 200);
            spark(x, y, Math.cos(a) * s, Math.sin(a) * s, color, rnd(2, 5.5), rnd(0.3, 0.75));
        }
    }

    function floatText(x, y, text, color) { G.texts.push({ x, y, text, color, life: 1.1, t: 0 }); }

    function updateEffects(dt, level, camX) {
        for (let i = G.particles.length - 1; i >= 0; i--) {
            const p = G.particles[i];
            p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= 0.94; p.vy = p.vy * 0.94 - (p.ink ? 0 : 12 * dt);
            if (p.t >= p.life || p.x < camX - 400) G.particles.splice(i, 1);
        }
        for (let i = G.texts.length - 1; i >= 0; i--) {
            const t = G.texts[i];
            t.t += dt; t.y -= 34 * dt;
            if (t.t >= t.life) G.texts.splice(i, 1);
        }
        for (let i = G.bubbles.length - 1; i >= 0; i--) {
            const b = G.bubbles[i];
            b.t += dt; b.y += b.vy * dt; b.x += Math.sin(b.t * 4) * 8 * dt;
            if (b.t >= b.life || b.x < camX - 300) G.bubbles.splice(i, 1);
        }
        for (let i = G.drops.length - 1; i >= 0; i--) {
            const d = G.drops[i];
            d.life -= dt;
            if (!d.alive || d.life <= 0 || d.x < camX - 300) { G.drops.splice(i, 1); continue; }
            if (!d.float) {
                d.vy += 130 * dt;
                d.vx *= 0.98; d.vy *= 0.98;
                const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
                if (tileAt(level, nx, d.y) === T_WATER) d.x = nx; else d.vx *= -0.4;
                if (tileAt(level, d.x, ny) === T_WATER) d.y = ny; else { d.vy *= -0.3; d.vx *= 0.85; }
            } else {
                d.x += d.vx * dt;
                d.y += Math.sin(d.life * 2) * 12 * dt;
            }
            d.y = clamp(d.y, 14, WORLD_H - 14);
        }
        if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 24);
    }

    /* =====================================================
       12. MÀN HÌNH & MÁY QUAY
       ===================================================== */

    let canvas, ctx, darkCanvas, darkCtx;
    let viewW = 0, viewH = 0, pixelRatio = 1;

    function resizeCanvas() {
        if (!canvas) return;
        const box = canvas.parentElement;
        const rect = box ? box.getBoundingClientRect() : null;
        const w = Math.max(1, Math.round(rect ? rect.width : window.innerWidth));
        const h = Math.max(1, Math.round(rect ? rect.height : window.innerHeight));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (w === viewW && h === viewH && dpr === pixelRatio) return;
        viewW = w; viewH = h; pixelRatio = dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
    }

    const worldViewW = () => viewW / G.camera.zoom;
    const worldViewH = () => viewH / G.camera.zoom;

    function updateCamera(dt) {
        const cam = G.camera;
        // Vừa đủ thấy trọn chiều cao đường đua; màn hình quá thấp thì bám theo bé
        cam.zoom = clamp(viewH / WORLD_H, 0.4, 1.15);

        if (G.state === 'RACING') cam.x += G.scroll * dt;

        const vh = worldViewH();
        if (vh >= WORLD_H) {
            cam.y = (WORLD_H - vh) / 2;
        } else {
            let sum = 0, n = 0;
            G.players.forEach(p => { if (!p.out) { sum += p.y; n++; } });
            const target = n ? sum / n - vh / 2 : cam.y;
            cam.y = clamp(lerp(cam.y, target, Math.min(1, dt * 4)), 0, WORLD_H - vh);
        }
    }

    const sx = x => (x - G.camera.x) * G.camera.zoom;
    const sy = y => (y - G.camera.y) * G.camera.zoom;

    /* =====================================================
       13. VẼ
       ===================================================== */

    function draw() {
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, viewW, viewH);

        const level = G.level;
        if (!level) {
            const g = ctx.createLinearGradient(0, 0, 0, viewH);
            g.addColorStop(0, '#0d7ba6'); g.addColorStop(1, '#04182c');
            ctx.fillStyle = g; ctx.fillRect(0, 0, viewW, viewH);
            return;
        }
        const pal = G.world.pal;

        drawBackdrop(pal);

        const shx = G.shake ? (Math.random() - 0.5) * G.shake : 0;
        const shy = G.shake ? (Math.random() - 0.5) * G.shake : 0;

        ctx.save();
        ctx.translate(shx, shy);
        ctx.scale(G.camera.zoom, G.camera.zoom);
        ctx.translate(-G.camera.x, -G.camera.y);

        const chs = visibleChunks(level, G.camera.x, worldViewW());
        drawFields(chs);
        drawTiles(chs, pal);
        drawPlants(chs, pal);
        drawPickups(chs);
        drawPods(chs);
        drawHazards(chs);
        drawBubbles();
        drawParticles();
        drawPlayers();
        drawEventLayer();
        drawTexts();

        ctx.restore();

        drawDarkness();
        drawEdgeWarning();
    }

    /* Nền nhiều lớp trôi chậm hơn máy quay -> cảm giác lao về phía trước */
    function drawBackdrop(pal) {
        const g = ctx.createLinearGradient(0, 0, 0, viewH);
        g.addColorStop(0, pal.near);
        g.addColorStop(0.45, pal.mid);
        g.addColorStop(1, '#01060f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, viewW, viewH);

        const t = performance.now() / 1000;

        // Tia nắng
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 8; i++) {
            const x = ((i * 240 - G.camera.x * 0.12) % (viewW + 480) + viewW + 480) % (viewW + 480) - 240;
            const sw = Math.sin(t * 0.4 + i) * 26;
            ctx.beginPath();
            ctx.moveTo(x + sw, -30);
            ctx.lineTo(x + 80 + sw, -30);
            ctx.lineTo(x + 190 + sw * 2, viewH + 30);
            ctx.lineTo(x + 20 + sw * 2, viewH + 30);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Rặng núi xa
        for (let layer = 0; layer < 2; layer++) {
            ctx.save();
            ctx.globalAlpha = 0.17 - layer * 0.07;
            ctx.fillStyle = layer ? pal.far : pal.rock;
            const par = 0.2 + layer * 0.16;
            const off = -(G.camera.x * par) % 400;
            ctx.beginPath();
            ctx.moveTo(-100, viewH);
            for (let i = 0; i <= 14; i++) {
                const x = -100 + i * ((viewW + 300) / 14) + off;
                const hgt = viewH * (0.45 + 0.2 * Math.sin(i * 1.9 + layer));
                ctx.lineTo(x, hgt);
            }
            ctx.lineTo(viewW + 200, viewH);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function drawTiles(chs, pal) {
        for (const ch of chs) {
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < CHUNK_COLS; c++) {
                    const t = ch.grid[r * CHUNK_COLS + c];
                    if (t === T_WATER) continue;
                    const x = ch.x + c * TILE, y = r * TILE;
                    if (t === T_CORAL) {
                        ctx.fillStyle = pal.accent;
                        rr(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 10);
                        ctx.fill();
                        ctx.fillStyle = 'rgba(255,255,255,0.22)';
                        rr(ctx, x + 6, y + 5, TILE - 12, 7, 4);
                        ctx.fill();
                        continue;
                    }
                    ctx.fillStyle = pal.rock;
                    rr(ctx, x, y, TILE, TILE, 8);
                    ctx.fill();
                    const above = r > 0 ? ch.grid[(r - 1) * CHUNK_COLS + c] : 1;
                    if (above === T_WATER) {
                        ctx.fillStyle = pal.rockLit;
                        rr(ctx, x + 1, y, TILE - 2, TILE * 0.3, 7);
                        ctx.fill();
                    }
                }
            }
        }
    }

    function drawFields(chs) {
        const t = performance.now() / 1000;
        for (const ch of chs) {
            for (const f of ch.fields) {
                ctx.save();
                if (f.kind === 'current') {
                    ctx.globalAlpha = 0.13;
                    ctx.fillStyle = '#9ceaff';
                    ctx.fillRect(f.x, f.y, f.w, f.h);
                    ctx.globalAlpha = 0.55;
                    ctx.strokeStyle = 'rgba(190,245,255,0.6)';
                    ctx.lineWidth = 2.5;
                    const dx = Math.sign(f.fx) * G.currentFlip, dy = Math.sign(f.fy) * G.currentFlip;
                    for (let k = 0; k < 16; k++) {
                        const prog = ((k / 16) + t * 0.25 * (dx || dy)) % 1;
                        const px = f.fx ? f.x + prog * f.w : f.x + f.w * ((k * 37) % 10) / 10;
                        const py = f.fx ? f.y + f.h * ((k * 53) % 10) / 10 : f.y + prog * f.h;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px + dx * 24, py + dy * 24);
                        ctx.stroke();
                    }
                } else if (f.kind === 'whirl') {
                    ctx.globalAlpha = 0.35;
                    ctx.strokeStyle = 'rgba(170,235,255,0.7)';
                    ctx.lineWidth = 3;
                    for (let k = 0; k < 3; k++) {
                        ctx.beginPath();
                        ctx.arc(f.x, f.y, f.r * (0.35 + k * 0.3), t * f.spin * (1 + k) + k, t * f.spin * (1 + k) + k + 4.2);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                    drawEmoji(ctx, '🌀', f.x, f.y, f.r * 0.8, 0.85);
                } else if (f.kind === 'vent') {
                    ctx.globalAlpha = 0.25;
                    const grd = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.r);
                    grd.addColorStop(0, 'rgba(255,180,90,0.9)');
                    grd.addColorStop(1, 'rgba(255,120,40,0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill();
                    ctx.globalAlpha = 1;
                    drawEmoji(ctx, '♨️', f.x, f.y - 10, 28, 0.9);
                } else if (f.kind === 'cold') {
                    ctx.globalAlpha = 0.2;
                    ctx.fillStyle = '#a8dcff';
                    ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill();
                    ctx.globalAlpha = 1;
                    drawEmoji(ctx, '❄️', f.x, f.y, 26, 0.8);
                }
                ctx.restore();
            }
        }
    }

    function drawPlants(chs, pal) {
        const t = performance.now() / 1000;
        ctx.save();
        ctx.lineCap = 'round';
        for (const ch of chs) {
            for (const pl of ch.plants) {
                const sw = Math.sin(t * 1.4 + pl.ph) * 10;
                ctx.strokeStyle = pal.plant;
                ctx.globalAlpha = 0.8;
                ctx.lineWidth = pl.w;
                ctx.beginPath();
                ctx.moveTo(pl.x, pl.y);
                const dir = pl.up ? -1 : 1;
                ctx.quadraticCurveTo(pl.x + sw, pl.y + dir * pl.h * 0.6, pl.x + sw * 1.7, pl.y + dir * pl.h);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    function drawPickups(chs) {
        const t = performance.now() / 1000;
        for (const ch of chs) {
            for (const p of ch.pickups) {
                if (!p.alive) continue;
                const bob = Math.sin(t * 2 + (p.t || 0)) * 4;
                const size = p.kind === 'chest' ? 42 : (p.kind === 'gem' ? 32 : (p.kind === 'star' ? 30 : 24));
                if (p.kind === 'chest' || p.kind === 'gem' || p.kind === 'star') {
                    ctx.save();
                    ctx.globalAlpha = 0.32;
                    const grd = ctx.createRadialGradient(p.x, p.y + bob, 2, p.x, p.y + bob, size);
                    grd.addColorStop(0, p.kind === 'gem' ? 'rgba(183,155,255,0.9)' : 'rgba(255,215,107,0.9)');
                    grd.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath(); ctx.arc(p.x, p.y + bob, size, 0, 6.28); ctx.fill();
                    ctx.restore();
                }
                drawEmoji(ctx, PICKUPS[p.kind].emoji, p.x, p.y + bob, size);
            }
        }
        for (const d of G.drops) {
            if (!d.alive) continue;
            const flash = d.life < 3 && Math.floor(d.life * 8) % 2 === 0 ? 0.4 : 1;
            drawEmoji(ctx, PICKUPS[d.kind].emoji, d.x, d.y, 24, flash);
        }
    }

    function drawPods(chs) {
        const t = performance.now() / 1000;
        for (const ch of chs) {
            for (const pod of ch.powers) {
                if (!pod.alive) continue;
                const bob = Math.sin(t * 2.4 + pod.t) * 5;
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#5cf0c0';
                ctx.beginPath(); ctx.arc(pod.x, pod.y + bob, 26, 0, 6.28); ctx.fill();
                ctx.restore();
                ctx.save();
                ctx.strokeStyle = 'rgba(200,255,240,0.85)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(pod.x, pod.y + bob, 22, 0, 6.28); ctx.stroke();
                ctx.restore();
                drawEmoji(ctx, POWERS[pod.type].emoji, pod.x, pod.y + bob, 26);
            }
            for (const pod of ch.mounts) {
                if (!pod.alive) continue;
                const bob = Math.sin(t * 1.7 + pod.t) * 6;
                ctx.save();
                ctx.globalAlpha = 0.28;
                ctx.fillStyle = '#4fd8ff';
                ctx.beginPath(); ctx.ellipse(pod.x, pod.y + bob, 36, 24, 0, 0, 6.28); ctx.fill();
                ctx.restore();
                drawEmoji(ctx, MOUNTS[pod.type].emoji, pod.x, pod.y + bob, 44);
            }
        }
    }

    function drawHazards(chs) {
        const t = performance.now() / 1000;
        for (const ch of chs) {
            for (const h of ch.hazards) {
                if (!h.alive) continue;
                if (h.kind === 'weed') {
                    ctx.save();
                    ctx.globalAlpha = 0.8;
                    ctx.strokeStyle = '#2fa36a';
                    ctx.lineWidth = 9;
                    ctx.lineCap = 'round';
                    for (let k = -1; k <= 1; k++) {
                        ctx.beginPath();
                        ctx.moveTo(h.x + k * 11, h.y + 28);
                        ctx.quadraticCurveTo(h.x + k * 11 + Math.sin(t * 2 + k) * 13, h.y, h.x + k * 13, h.y - 28);
                        ctx.stroke();
                    }
                    ctx.restore();
                    continue;
                }
                if (h.kind === 'shark') {
                    ctx.save();
                    ctx.translate(h.x, h.y);
                    ctx.scale(Math.cos(h.angle || Math.PI) < 0 ? 1 : -1, 1);
                    drawEmoji(ctx, '🦈', 0, 0, 66);
                    ctx.restore();
                    continue;
                }
                if (h.kind === 'mine') {
                    ctx.save();
                    ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(t * 3));
                    ctx.fillStyle = '#ff5d3d';
                    ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 8, 0, 6.28); ctx.fill();
                    ctx.restore();
                }
                drawEmoji(ctx, h.meta.emoji, h.x, h.y + Math.sin(t * 2 + h.t) * 3, h.r * 2.1);
            }
        }
    }

    function drawBubbles() {
        ctx.save();
        ctx.strokeStyle = 'rgba(220,250,255,0.85)';
        ctx.lineWidth = 1.4;
        for (const b of G.bubbles) {
            ctx.globalAlpha = (1 - b.t / b.life) * 0.5;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.stroke();
        }
        ctx.restore();
    }

    function drawParticles() {
        ctx.save();
        for (const p of G.particles) {
            const a = 1 - p.t / p.life;
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.ink ? (1 + p.t * 0.6) : a), 0, 6.28);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawTexts() {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '800 20px "Baloo 2", sans-serif';
        ctx.lineWidth = 4;
        for (const t of G.texts) {
            ctx.globalAlpha = 1 - t.t / t.life;
            ctx.strokeStyle = 'rgba(0,18,32,0.8)';
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.restore();
    }

    function drawPlayers() {
        const t = performance.now() / 1000;
        for (const p of G.players) {
            // Vòng màu nhận dạng từng bé
            ctx.save();
            ctx.globalAlpha = p.out ? 0.25 : 0.5 + 0.15 * Math.sin(t * 3 + p.index);
            ctx.strokeStyle = p.ring;
            ctx.lineWidth = 3.5;
            ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, p.r + 26, p.r + 15, 0, 0, 6.28); ctx.stroke();
            ctx.restore();

            if (p.buffs.shield > 0) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#5cf0c0';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 20, 0, 6.28); ctx.fill();
                ctx.restore();
            }

            if (p.mount) drawEmoji(ctx, MOUNTS[p.mount].emoji, p.x - 6, p.y + 16, 56);

            let state = 'swim';
            if (p.out) state = 'out';
            else if (p.hurtT > 0) state = 'hurt';
            else if (p.dashT > 0) state = 'dash';

            const blink = p.invuln > 0 && p.hurtT <= 0 && Math.floor(p.invuln * 12) % 2 === 0;
            drawDiver(ctx, p.x, p.y, 0.82, {
                suit: p.suit, kick: p.kick, tilt: p.tilt, face: p.face,
                state, alpha: p.out ? 0.75 : (blink ? 0.5 : 1)
            });

            // Trạng thái xấu hiện trên đầu
            let icon = null;
            if (p.trap > 0) icon = '🐚';
            else if (p.stun > 0) icon = '💫';
            else if (p.slow > 0) icon = '🐌';
            else if (p.blind > 0) icon = '🌑';
            if (icon) drawEmoji(ctx, icon, p.x, p.y - 40, 26);

            if (p.blind > 0) {
                ctx.save();
                ctx.globalAlpha = Math.min(0.7, p.blind * 0.3);
                const grd = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 160);
                grd.addColorStop(0, 'rgba(8,3,20,0.95)');
                grd.addColorStop(1, 'rgba(8,3,20,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(p.x, p.y, 160, 0, 6.28); ctx.fill();
                ctx.restore();
            }

            // Thanh hồi chiêu lướt
            if (!p.out && p.dashCd > 0) {
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                ctx.fillRect(p.x - 18, p.y + 30, 36, 4);
                ctx.fillStyle = p.ring;
                ctx.fillRect(p.x - 18, p.y + 30, 36 * (1 - p.dashCd / DASH_CD), 4);
                ctx.restore();
            }
        }
    }

    function drawEventLayer() {
        const e = G.eventData;
        if (!e) return;
        if (G.event === 'whale') drawEmoji(ctx, '🐋', e.x, e.y, 210, 0.95);
        else if (G.event === 'sharkFrenzy') {
            e.fins.forEach(f => drawEmoji(ctx, '🦈', e.x + f.ox, e.y + f.oy, 70, 0.95));
        } else if (G.event === 'kraken') {
            e.arms.forEach(a => {
                ctx.save();
                if (a.t < 0.45) {
                    ctx.globalAlpha = 0.55;
                    ctx.strokeStyle = '#ff5d3d';
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(a.x, a.y, 66 * clamp(a.t / 0.45, 0, 1), 0, 6.28); ctx.stroke();
                } else {
                    ctx.globalAlpha = Math.max(0, 1 - (a.t - 0.45) / 0.95);
                    drawEmoji(ctx, '🦑', a.x, a.y, 130);
                }
                ctx.restore();
            });
        }
    }

    function drawDarkness() {
        const darkness = clamp((G.world ? G.world.dark : 0) + G.darkBoost, 0, 0.93);
        if (darkness < 0.03) return;
        if (!darkCanvas) { darkCanvas = document.createElement('canvas'); darkCtx = darkCanvas.getContext('2d'); }
        if (darkCanvas.width !== viewW || darkCanvas.height !== viewH) { darkCanvas.width = viewW; darkCanvas.height = viewH; }
        const d = darkCtx;
        d.setTransform(1, 0, 0, 1, 0, 0);
        d.clearRect(0, 0, viewW, viewH);
        d.fillStyle = 'rgba(1,6,14,' + darkness + ')';
        d.fillRect(0, 0, viewW, viewH);
        d.globalCompositeOperation = 'destination-out';
        for (const p of G.players) {
            if (p.out) continue;
            const px = sx(p.x), py = sy(p.y);
            const rad = (p.buffs.radar > 0 ? 340 : 230) * G.camera.zoom;
            const grd = d.createRadialGradient(px, py, rad * 0.15, px, py, rad);
            grd.addColorStop(0, 'rgba(0,0,0,1)');
            grd.addColorStop(0.6, 'rgba(0,0,0,0.7)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            d.fillStyle = grd;
            d.beginPath(); d.arc(px, py, rad, 0, 6.28); d.fill();
        }
        d.globalCompositeOperation = 'source-over';
        ctx.drawImage(darkCanvas, 0, 0);
    }

    /* Mép trái đỏ rực khi có bé sắp bị bỏ lại */
    function drawEdgeWarning() {
        let worst = 0;
        G.players.forEach(p => { if (!p.out) worst = Math.max(worst, p.warn); });
        if (worst <= 0) return;
        const a = Math.min(0.55, worst) * (0.6 + 0.4 * Math.sin(performance.now() / 90));
        const grd = ctx.createLinearGradient(0, 0, viewW * 0.22, 0);
        grd.addColorStop(0, 'rgba(255,60,60,' + a + ')');
        grd.addColorStop(1, 'rgba(255,60,60,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, viewW * 0.22, viewH);
    }

    /* =====================================================
       14. HUD
       ===================================================== */

    const el = {};
    let hudTimer = 0;

    function cacheDom() {
        ['hud-world', 'hud-distance', 'hud-speed', 'hud-timer', 'hud-clock', 'hud-lead-name',
            'event-banner', 'event-text', 'player-cards', 'countdown-overlay', 'countdown-text',
            'modal-start', 'modal-help', 'modal-end', 'toast', 'world-grid', 'skin-row',
            'count-row', 'time-row', 'setup-hint', 'rank-list', 'award-row', 'end-title',
            'end-sub', 'end-emoji', 'help-controls', 'touch-controls', 'joystick-zone',
            'joystick-knob', 'dash-btn', 'suit-preview'].forEach(id => { el[id] = document.getElementById(id); });
    }

    function tr(s) {
        if (window.KibuI18n && window.KibuI18n.t) { try { return window.KibuI18n.t(s); } catch (e) { return s; } }
        return s;
    }
    function setText(node, str) {
        if (!node) return;
        const out = tr(str);
        if (node.textContent !== out) node.textContent = out;
    }

    function buildCards() {
        el['player-cards'].innerHTML = '';
        G.players.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pcard';
            card.style.setProperty('--pc', p.ring);
            card.innerHTML =
                '<div class="pcard-head"><span class="pcard-dot"></span><span>' + p.name + '</span></div>' +
                '<div class="pcard-score">0</div>' +
                '<div class="pcard-row"><span class="combo-tag" hidden>x1</span><span class="pcard-buffs"></span></div>' +
                '<div class="pcard-state"></div>';
            const dot = card.querySelector('.pcard-dot');
            dot.style.cssText = 'width:11px;height:11px;border-radius:50%;background:' + p.suit.body +
                ';border:2px solid ' + p.ring + ';display:inline-block';
            el['player-cards'].appendChild(card);
            p.dom = {
                card, score: card.querySelector('.pcard-score'),
                combo: card.querySelector('.combo-tag'),
                buffs: card.querySelector('.pcard-buffs'),
                state: card.querySelector('.pcard-state')
            };
        });
    }

    function updateHud(dt) {
        hudTimer -= dt;
        if (hudTimer > 0) return;
        hudTimer = 0.1;

        const secs = Math.max(0, Math.ceil(G.time));
        const clock = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
        if (el['hud-timer'].textContent !== clock) el['hud-timer'].textContent = clock;
        el['hud-clock'].classList.toggle('hurry', secs <= 30 && G.state === 'RACING');

        let lead = null;
        G.players.forEach(p => { if (!lead || p.score > lead.score) lead = p; });
        if (lead) {
            setText(el['hud-lead-name'], lead.name);
            el['hud-lead-name'].style.color = lead.ring;
        }

        const front = G.players.reduce((a, p) => Math.max(a, p.meters), 0);
        setText(el['hud-distance'], front + 'm');
        setText(el['hud-speed'], 'Tốc độ x' + (G.scroll / BASE_SCROLL).toFixed(1));

        G.players.forEach(p => {
            if (!p.dom) return;
            const s = Math.floor(p.score).toLocaleString('vi-VN');
            if (p.dom.score.textContent !== s) p.dom.score.textContent = s;
            const m = p.mult;
            p.dom.combo.hidden = m <= 1 || p.out;
            const cb = 'x' + m;
            if (p.dom.combo.textContent !== cb) p.dom.combo.textContent = cb;
            p.dom.card.classList.toggle('leader', p === lead && G.playerCount > 1);
            p.dom.card.classList.toggle('is-out', p.out);

            let buffs = '';
            for (const k in p.buffs) if (p.buffs[k] > 0) buffs += POWERS[k].emoji;
            if (p.mount) buffs += MOUNTS[p.mount].emoji;
            if (p.dom.buffs.textContent !== buffs) p.dom.buffs.textContent = buffs;

            let state = '';
            if (p.out) state = 'Bị loại';
            else if (p.trap > 0) state = 'Bị kẹp!';
            else if (p.stun > 0) state = 'Choáng!';
            else if (p.slow > 0) state = 'Bơi chậm';
            else if (p.blind > 0) state = 'Mù mực';
            else if (p.warn > 0) state = 'Sắp bị bỏ lại!';
            setText(p.dom.state, state);
        });
    }

    let evTimeout = null;
    function showEvent(text) {
        el['event-text'].textContent = text;
        el['event-banner'].classList.add('show');
        clearTimeout(evTimeout);
        evTimeout = setTimeout(() => el['event-banner'].classList.remove('show'), 3200);
    }

    let toastTimeout = null;
    function toast(msg) {
        const t = el['toast'];
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => t.classList.remove('show'), 2600);
    }

    /* =====================================================
       15. VÒNG ĐỜI TRẬN ĐUA
       ===================================================== */

    function startRace() {
        const world = WORLDS[clamp(G.worldIdx, 0, WORLDS.length - 1)];
        G.world = world;
        G.level = makeLevel(world, (Math.random() * 1e9) >>> 0);
        G.time = G.raceTime;
        G.scroll = BASE_SCROLL * world.speed;
        G.camera.x = 0; G.camera.y = 0;
        G.particles.length = 0; G.texts.length = 0; G.bubbles.length = 0; G.drops.length = 0;
        G.event = null; G.eventData = null; G.eventTimer = rnd(18, 26);
        G.darkBoost = 0; G.currentFlip = 1; G.boost = 0; G.shake = 0;
        G.grace = 4;                  // 4 giây đầu chưa loại ai

        resizeCanvas();
        updateCamera(0);
        ensureChunks(G.level, 0, worldViewW() + CHUNK_W);

        const slots = SLOTS[G.playerCount] || SLOTS[1];
        const chosen = SUITS.findIndex(s => s.id === Store.data.suit);
        /* Đứng ở khoảng 1/3 khung nhìn: sát mép trái quá thì màn hình vừa trôi
           là bé đã bị bỏ lại, còn ra giữa quá thì không thấy đường phía trước. */
        const startX = Math.max(420, worldViewW() * 0.45);
        G.players = slots.map((slot, i) => {
            const suit = SUITS[(Math.max(0, chosen) + i) % SUITS.length];
            const y = WORLD_H / 2 + (i - (slots.length - 1) / 2) * 90;
            return new Racer(i, slot, suit, startX - i * 26, clamp(y, TILE * 3, WORLD_H - TILE * 3));
        });

        setText(el['hud-world'], world.name);
        buildCards();
        closeModals();

        G.state = 'COUNTDOWN';
        G.countdown = 3.2;
        lastCount = null;
        el['countdown-overlay'].classList.add('show');
        audio.init();
        audio.start();
        Store.data.races++;
        Store.save();
    }

    function endRace() {
        G.state = 'END';
        audio.stop();
        audio.fanfare();

        const ranked = G.players.slice().sort((a, b) => b.score - a.score);
        const wid = G.world.id;
        const mine = Math.floor(G.players[0].score);
        if (mine > (Store.data.best[wid] || 0)) {
            Store.data.best[wid] = mine;
            Store.save();
        }

        const medals = ['🥇', '🥈', '🥉', '🏅'];
        el['rank-list'].innerHTML = '';
        ranked.forEach((p, i) => {
            const row = document.createElement('div');
            row.className = 'rank-row' + (i === 0 ? ' first' : '');
            row.style.setProperty('--pc', p.ring);
            row.style.animationDelay = (i * 0.12) + 's';
            row.innerHTML =
                '<div class="rank-medal' + (i === 0 ? ' dance' : '') + '">' + medals[Math.min(i, 3)] + '</div>' +
                '<div class="rank-face"><span class="rank-suit" style="background:' + p.suit.body + ';border-color:' + p.ring + '"></span></div>' +
                '<div class="rank-info"><div class="rank-name">' + p.name + '</div>' +
                '<div class="rank-detail">🏁 ' + p.meters + 'm · 🧰 ' + p.stats.chests + ' rương · 💎 ' + p.stats.gems +
                ' đá quý · 🔥 chuỗi ' + p.bestCombo + (p.out ? ' · bị loại' : '') + '</div></div>' +
                '<div class="rank-score">' + Math.floor(p.score).toLocaleString('vi-VN') + '</div>';
            el['rank-list'].appendChild(row);
        });

        const awards = [];
        const best = fn => G.players.slice().sort((a, b) => fn(b) - fn(a))[0];
        const far = best(p => p.meters);
        if (far) awards.push('🏁 Bơi xa nhất: ' + far.name + ' (' + far.meters + 'm)');
        const cb = best(p => p.bestCombo);
        if (cb && cb.bestCombo >= 4) awards.push('🔥 Chuỗi dài nhất: ' + cb.name + ' (' + cb.bestCombo + ')');
        const rd = best(p => p.stats.rides);
        if (rd && rd.stats.rides > 0) awards.push('🐬 Nài cá cừ nhất: ' + rd.name);
        const clean = G.players.slice().sort((a, b) => a.stats.hits - b.stats.hits)[0];
        if (clean && clean.stats.hits === 0 && G.playerCount > 1) awards.push('🛡️ Không dính bẫy nào: ' + clean.name);
        el['award-row'].innerHTML = awards.map(a => '<span class="award-chip">' + a + '</span>').join('');

        const champ = ranked[0];
        el['end-emoji'].textContent = G.playerCount === 1 ? '🤿' : '🏆';
        el['end-title'].textContent = G.playerCount === 1 ? 'VỀ ĐÍCH!' : champ.name + ' VÔ ĐỊCH!';
        el['end-sub'].textContent = G.playerCount === 1
            ? 'Bé bơi được ' + champ.meters + 'm và gom ' + Math.floor(champ.score).toLocaleString('vi-VN') + ' điểm!'
            : 'Cùng vỗ tay cho nhà vô địch nào!';

        el['modal-end'].classList.add('active');
    }

    function closeModals() {
        ['modal-start', 'modal-help', 'modal-end'].forEach(id => el[id] && el[id].classList.remove('active'));
    }

    function backToMenu() {
        G.state = 'MENU';
        audio.stop();
        closeModals();
        el['countdown-overlay'].classList.remove('show');
        el['modal-start'].classList.add('active');
        refreshMenu();
    }

    /* =====================================================
       16. VÒNG LẶP
       ===================================================== */

    let lastTime = 0, lastCount = null;

    function loop(ts) {
        const dt = Math.min(0.05, lastTime ? (ts - lastTime) / 1000 : 0.016);
        lastTime = ts;

        try {
            if (G.state === 'COUNTDOWN') {
                G.countdown -= dt;
                const n = Math.ceil(G.countdown - 0.2);
                el['countdown-text'].textContent = n > 0 ? String(n) : 'BƠI!';
                if (n !== lastCount) { lastCount = n; audio.beep(n <= 0); }
                if (G.countdown <= 0) { G.state = 'RACING'; el['countdown-overlay'].classList.remove('show'); }
                G.players.forEach(p => { p.kick += dt * 3; });
                updateCamera(dt);
                updateEffects(dt, G.level, G.camera.x);
            } else if (G.state === 'RACING') {
                G.time -= dt;
                audio.setHot(G.time <= 30);

                // Màn hình trôi nhanh dần theo thời gian
                const prog = 1 - G.time / G.raceTime;
                G.scroll = BASE_SCROLL * G.world.speed * (1 + prog * 0.35);

                updateCamera(dt);
                ensureChunks(G.level, G.camera.x, worldViewW() + CHUNK_W);

                G.players.forEach(p => p.update(dt, G.level));
                resolveBumps();
                updateHazards(dt, G.level, G.camera.x, worldViewW());
                updateEvents(dt, G.level, G.camera.x, worldViewW());
                updateEffects(dt, G.level, G.camera.x);

                // Ai tụt khỏi mép trái thì bị loại
                G.grace = Math.max(0, G.grace - dt);
                let alive = 0;
                G.players.forEach(p => {
                    if (p.out) return;
                    const edge = G.camera.x;
                    if (p.x < edge + 200) p.warn = 1;
                    // Phải nằm ngoài mép liên tục 1,5 giây mới bị loại — chạm hụt
                    // một nhịp rồi bơi lại kịp thì vẫn được đua tiếp
                    if (p.x < edge + 10 && G.grace <= 0) {
                        p.behind += dt;
                        if (p.behind > 1.5) p.eliminate(); else alive++;
                    } else {
                        p.behind = Math.max(0, p.behind - dt * 1.5);
                        alive++;
                    }
                });

                if (G.time <= 0 || alive === 0) { G.time = Math.max(0, G.time); endRace(); }
            } else if (G.state === 'END' && G.level) {
                updateCamera(dt);
                updateEffects(dt, G.level, G.camera.x);
            }

            if (G.state !== 'MENU') updateHud(dt);
            else drawPreview(dt);
            draw();
        } catch (err) {
            console.error('Aqua Dash loop error:', err);
        }

        requestAnimationFrame(loop);
    }

    /* =====================================================
       17. NHẬP LIỆU
       ===================================================== */

    const GAME_CODES = new Set();
    CONTROLS.forEach(c => {
        [c.up, c.down, c.left, c.right].forEach(k => GAME_CODES.add(k));
        c.dash.forEach(k => GAME_CODES.add(k));
    });

    function setupInput() {
        window.addEventListener('keydown', e => {
            keys[e.code] = true;
            audio.init();
            if (GAME_CODES.has(e.code) && G.state !== 'MENU') e.preventDefault();
        });
        window.addEventListener('keyup', e => { keys[e.code] = false; });
        window.addEventListener('blur', () => { keys = {}; });

        const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
            window.matchMedia('(pointer: coarse)').matches;
        if (isTouch) {
            document.body.classList.add('is-touch');
            el['touch-controls'].style.display = 'block';
        }

        const zone = el['joystick-zone'], knob = el['joystick-knob'], dash = el['dash-btn'];
        let joyId = null, dashId = null;
        const find = (list, id) => { for (let i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i]; return null; };

        zone.addEventListener('touchstart', e => {
            e.preventDefault();
            if (joyId !== null) return;
            joyId = e.changedTouches[0].identifier;
            touch.active = true;
            audio.init();
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (joyId === null) return;
            const t = find(e.touches, joyId);
            if (!t) return;
            const r = zone.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const max = r.width / 2 - 18;
            let dx = t.clientX - cx, dy = t.clientY - cy;
            const len = Math.hypot(dx, dy) || 1;
            const cl = Math.min(len, max);
            dx = dx / len * cl; dy = dy / len * cl;
            knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            touch.dx = dx / max; touch.dy = dy / max;
        }, { passive: true });

        function endTouch(e) {
            if (joyId !== null && find(e.changedTouches, joyId)) {
                joyId = null; touch.active = false; touch.dx = touch.dy = 0;
                knob.style.transform = 'translate(0,0)';
            }
            if (dashId !== null && find(e.changedTouches, dashId)) { dashId = null; touch.dash = false; }
        }
        window.addEventListener('touchend', endTouch);
        window.addEventListener('touchcancel', endTouch);

        dash.addEventListener('touchstart', e => {
            e.preventDefault();
            dashId = e.changedTouches[0].identifier;
            touch.dash = true; touch.active = true;
            audio.init();
        }, { passive: false });
        dash.addEventListener('mousedown', () => { touch.dash = true; touch.active = true; });
        window.addEventListener('mouseup', () => { touch.dash = false; });
    }

    /* =====================================================
       18. BẢNG CHỌN
       ===================================================== */

    function buildWorlds() {
        const grid = el['world-grid'];
        grid.innerHTML = '';
        WORLDS.forEach((w, i) => {
            const card = document.createElement('div');
            card.className = 'world-card' + (i === G.worldIdx ? ' active' : '');
            const best = Store.data.best[w.id];
            card.innerHTML =
                '<div class="world-emoji">' + w.emoji + '</div>' +
                '<div class="world-label">' + w.name + '</div>' +
                '<div class="world-diff">' + '★'.repeat(Math.min(5, Math.ceil(w.diff * 5 / 8))) + '</div>' +
                (best ? '<div class="world-best">' + best.toLocaleString('vi-VN') + '</div>' : '');
            card.addEventListener('click', () => { G.worldIdx = i; buildWorlds(); audio.beep(true); });
            grid.appendChild(card);
        });
    }

    function buildSuits() {
        const row = el['skin-row'];
        row.innerHTML = '';
        SUITS.forEach(s => {
            const b = document.createElement('button');
            b.className = 'skin-swatch' + (s.id === Store.data.suit ? ' active' : '');
            b.title = s.name;
            b.style.background = 'linear-gradient(140deg,' + s.light + ',' + s.body + ' 55%,' + s.dark + ')';
            b.addEventListener('click', () => {
                Store.data.suit = s.id;
                Store.save();
                buildSuits();
                audio.beep(true);
            });
            row.appendChild(b);
        });
    }

    /* Nhân vật nhỏ bơi tại chỗ trong màn hình chọn */
    let previewKick = 0;
    function drawPreview(dt) {
        const cv = el['suit-preview'];
        if (!cv) return;
        const g = cv.getContext('2d');
        previewKick += dt * 7;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, cv.width, cv.height);
        const suit = SUITS.find(s => s.id === Store.data.suit) || SUITS[0];
        // vài bọt nước cho đỡ trống
        g.fillStyle = 'rgba(200,240,255,0.25)';
        for (let i = 0; i < 7; i++) {
            const bx = (i * 47 + (previewKick * 9) % 320) % 320;
            const by = 130 - ((previewKick * 22 + i * 40) % 150);
            g.beginPath(); g.arc(bx, by, 2 + (i % 3), 0, 6.28); g.fill();
        }
        drawDiver(g, cv.width / 2 - 6, cv.height / 2, 1.05, {
            suit, kick: previewKick, tilt: Math.sin(previewKick * 0.4) * 0.12, face: 1, state: 'swim'
        });
    }

    function refreshMenu() {
        buildWorlds();
        buildSuits();
        const slots = SLOTS[G.playerCount] || SLOTS[1];
        el['setup-hint'].innerHTML = slots.map((s, i) =>
            '<b>' + PLAYER_NAMES[i] + '</b>: ' + CONTROLS[s].label + ' · lướt <b>' + CONTROLS[s].dashLabel + '</b>'
        ).join(' &nbsp;|&nbsp; ');
    }

    function buildHelp() {
        el['help-controls'].innerHTML = SLOTS[4].map((s, i) =>
            '<li>' + PLAYER_NAMES[i] + ': <b>' + CONTROLS[s].label + '</b> · lướt <b>' + CONTROLS[s].dashLabel + '</b></li>'
        ).join('') + '<li>Trên điện thoại: cần gạt bên trái, nút ⚡ bên phải</li>';
    }

    function pillGroup(rowId, attr, onPick) {
        const row = el[rowId];
        if (!row) return;
        row.addEventListener('click', e => {
            const btn = e.target.closest('.pill');
            if (!btn || !row.contains(btn)) return;
            row.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            audio.beep(true);
            onPick(btn.dataset[attr]);
        });
    }

    function setupMenu() {
        pillGroup('count-row', 'count', v => { G.playerCount = +v; refreshMenu(); });
        pillGroup('time-row', 'time', v => { G.raceTime = +v; });

        document.getElementById('btn-start-race').addEventListener('click', () => { audio.init(); startRace(); });
        document.getElementById('btn-replay').addEventListener('click', startRace);
        document.getElementById('btn-menu-race').addEventListener('click', backToMenu);
        document.getElementById('btn-menu-nav').addEventListener('click', backToMenu);

        const openHelp = () => { buildHelp(); el['modal-help'].classList.add('active'); };
        document.getElementById('btn-help').addEventListener('click', openHelp);
        document.getElementById('btn-help-2').addEventListener('click', openHelp);
        document.getElementById('btn-close-help').addEventListener('click', () => el['modal-help'].classList.remove('active'));

        const btnSound = document.getElementById('btn-sound');
        btnSound.addEventListener('click', () => {
            audio.enabled = !audio.enabled;
            Store.data.sound = audio.enabled;
            Store.save();
            document.getElementById('sound-icon').className = audio.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            btnSound.classList.toggle('muted', !audio.enabled);
            if (!audio.enabled) audio.stop();
            else if (G.state === 'RACING' || G.state === 'COUNTDOWN') { audio.init(); audio.start(); }
        });
        if (!Store.data.sound) {
            audio.enabled = false;
            document.getElementById('sound-icon').className = 'fa-solid fa-volume-xmark';
            btnSound.classList.add('muted');
        }
    }

    /* =====================================================
       19. KHỞI ĐỘNG
       ===================================================== */

    function boot() {
        cacheDom();
        Store.load();
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 250));
        if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeCanvas);
        if (typeof ResizeObserver === 'function') new ResizeObserver(resizeCanvas).observe(canvas.parentElement);

        setupInput();
        setupMenu();
        refreshMenu();
        requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

})();
