/* =========================================================
   OCEAN PARTY — ĐẠI TIỆC ĐÁY BIỂN
   ---------------------------------------------------------
   Game đua kho báu dưới nước cho 1–4 bé trên cùng một màn hình.
   Hết giờ, ai nhiều điểm nhất thắng — không phải ai về đích trước.

   Bố cục tệp:
     1. Hằng số & dữ liệu (vùng biển, cá cưỡi, bảo bối, bẫy, thành tích)
     2. Tiện ích toán học & bộ sinh số ngẫu nhiên có hạt giống
     3. Lưu trữ hồ sơ (localStorage)
     4. Âm thanh tổng hợp bằng Web Audio
     5. Kho ảnh emoji dựng sẵn
     6. Sinh màn chơi (hang động, phòng bí mật, kho báu)
     7. Thực thể (người chơi, vật phẩm, bẫy, dòng chảy)
     8. Vòng đời trận đấu & sự kiện ngẫu nhiên
     9. Vẽ
    10. HUD, các bảng chọn, nhập liệu, khởi động
   ========================================================= */

(function () {
    'use strict';

    /* =====================================================
       1. HẰNG SỐ & DỮ LIỆU
       ===================================================== */

    const TILE = 44;                 // cạnh một ô lưới, đơn vị pixel thế giới

    // Mã ô: 0 nước, 1 đá, 2 tường san hô phá được, 3 đá viền ngoài (không phá)
    const T_WATER = 0, T_ROCK = 1, T_CORAL = 2, T_EDGE = 3;

    /* Bốn bộ phím trải đều bàn phím, trùng cách bố trí của Super Striker để bé
       nào quen game kia là chơi được ngay. */
    const CONTROLS = [
        { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', dash: ['KeyQ', 'Space'], label: 'W A S D', dashLabel: 'Q' },
        { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH', dash: ['KeyR'], label: 'T F G H', dashLabel: 'R' },
        { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', dash: ['KeyU'], label: 'I J K L', dashLabel: 'U' },
        { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', dash: ['Slash', 'ShiftRight'], label: '↑ ← ↓ →', dashLabel: '/' }
    ];

    // Bé nào cầm bộ phím nào: 2 bé thì ngồi hai đầu bàn phím cho thoải mái
    const SLOTS = { 1: [0], 2: [0, 3], 3: [0, 1, 3], 4: [0, 1, 2, 3] };

    const PLAYER_STYLE = [
        { name: 'KID 1', color: '#ff6b6b', glow: '255,107,107', face: '🐣' },
        { name: 'KID 2', color: '#4dc3ff', glow: '77,195,255', face: '🐧' },
        { name: 'KID 3', color: '#6bf178', glow: '107,241,120', face: '🐢' },
        { name: 'KID 4', color: '#ffd93d', glow: '255,217,61', face: '🦆' }
    ];

    /* ---------- Bảy vùng biển ----------
       Càng về sau: bản đồ rộng hơn, dòng chảy mạnh hơn, tối hơn, nhiều bẫy hơn.
       "wall" là tỉ lệ đá lúc gieo nhiễu ban đầu — số càng lớn hang càng chật. */
    const WORLDS = [
        {
            id: 'reef', emoji: '🪸', name: 'CORAL REEF', diff: 1, unlock: 0,
            cols: 40, rows: 24, wall: 0.40, dark: 0, current: 0.5, hazards: 0.7, mines: 0,
            hazardKinds: ['jelly', 'urchin', 'crab', 'seaweed'],
            palette: { deep: '#03395c', mid: '#0a6e96', top: '#3fc7d8', rock: '#07293a', rockLit: '#2f8496', plant: '#41dda6', accent: '#ff8fa3' }
        },
        {
            id: 'kelp', emoji: '🌿', name: 'KELP FOREST', diff: 2, unlock: 1500,
            cols: 44, rows: 26, wall: 0.44, dark: 0.15, current: 0.75, hazards: 0.95, mines: 0,
            hazardKinds: ['jelly', 'urchin', 'crab', 'seaweed', 'eel'],
            palette: { deep: '#052f2a', mid: '#0a6b52', top: '#48c98d', rock: '#04211c', rockLit: '#33805f', plant: '#7de88a', accent: '#ffd76b' }
        },
        {
            id: 'wreck', emoji: '🏴‍☠️', name: 'SUNKEN PIRATE SHIP', diff: 3, unlock: 4000,
            cols: 46, rows: 28, wall: 0.46, dark: 0.3, current: 0.8, hazards: 1.1, mines: 3,
            hazardKinds: ['jelly', 'urchin', 'crab', 'eel', 'octo', 'mine', 'clam'],
            palette: { deep: '#2a1e12', mid: '#5c3f22', top: '#a8763c', rock: '#1d1409', rockLit: '#6f5837', plant: '#8fbf6a', accent: '#ffd76b' }
        },
        {
            id: 'crystal', emoji: '💎', name: 'CRYSTAL CAVE', diff: 4, unlock: 8000,
            cols: 48, rows: 30, wall: 0.49, dark: 0.45, current: 0.9, hazards: 1.25, mines: 4,
            hazardKinds: ['jelly', 'urchin', 'eel', 'rock', 'clam', 'mine', 'seaweed'],
            palette: { deep: '#1a1440', mid: '#3b2f8f', top: '#8f7dff', rock: '#120e2e', rockLit: '#5b50b4', plant: '#8fd7ff', accent: '#ff9df0' }
        },
        {
            id: 'volcano', emoji: '🌋', name: 'UNDERWATER VOLCANO', diff: 5, unlock: 14000,
            cols: 50, rows: 30, wall: 0.50, dark: 0.35, current: 1.15, hazards: 1.4, mines: 5,
            hazardKinds: ['urchin', 'crab', 'eel', 'rock', 'mine', 'shark', 'coral'],
            palette: { deep: '#3a0f10', mid: '#7d2418', top: '#ff8b3d', rock: '#25090a', rockLit: '#8c3c23', plant: '#ffb648', accent: '#ff5d3d' }
        },
        {
            id: 'abyss', emoji: '🕳️', name: 'THE DEEP ABYSS', diff: 6, unlock: 22000,
            cols: 52, rows: 32, wall: 0.52, dark: 0.72, current: 1.2, hazards: 1.55, mines: 6,
            hazardKinds: ['jelly', 'eel', 'octo', 'shark', 'mine', 'clam', 'coral'],
            palette: { deep: '#01060f', mid: '#062038', top: '#1f6f9c', rock: '#040c16', rockLit: '#1e4257', plant: '#37d0ff', accent: '#9d7dff' }
        },
        {
            id: 'atlantis', emoji: '🏛️', name: 'ANCIENT ATLANTIS', diff: 7, unlock: 32000,
            cols: 54, rows: 34, wall: 0.53, dark: 0.5, current: 1.35, hazards: 1.75, mines: 7,
            hazardKinds: ['jelly', 'urchin', 'eel', 'octo', 'shark', 'mine', 'clam', 'rock', 'coral'],
            palette: { deep: '#0d2a3f', mid: '#1f6a86', top: '#6fe3d6', rock: '#08202f', rockLit: '#5f9a93', plant: '#9ff7d8', accent: '#ffe08a' }
        }
    ];

    /* ---------- Cá cho cưỡi ----------
       Mỗi con chỉ chở bé một lúc rồi bơi đi mất. */
    const MOUNTS = {
        dolphin: { emoji: '🐬', name: 'Dolphin', dur: 12, speed: 1.9, accel: 1.7, note: 'Fast as a rocket!' },
        turtle: { emoji: '🐢', name: 'Sea Turtle', dur: 16, speed: 0.9, accel: 1.0, invuln: true, note: 'The shell blocks every hazard!' },
        sword: { emoji: '🗡️', name: 'Swordfish', dur: 12, speed: 1.55, accel: 1.5, breaks: true, note: 'Smash right through coral walls!' },
        octo: { emoji: '🐙', name: 'Octopus', dur: 13, speed: 1.15, accel: 1.2, ability: 'ink', note: 'Press dash to squirt ink!' },
        puffer: { emoji: '🐡', name: 'Puffer Fish', dur: 13, speed: 1.0, accel: 1.1, ability: 'push', note: 'Press dash to blast rivals away!' },
        manta: { emoji: '🐟', name: 'Manta Ray', dur: 15, speed: 1.45, accel: 1.15, ignoreCurrent: true, note: 'Glide smooth — currents can\'t touch you!' }
    };
    const MOUNT_KEYS = Object.keys(MOUNTS);

    /* ---------- Bảo bối ---------- */
    const POWERS = {
        speed: { emoji: '🫧', name: 'Speed Bubble', dur: 8 },
        magnet: { emoji: '🧲', name: 'Treasure Magnet', dur: 9 },
        shield: { emoji: '🛡️', name: 'Coral Shield', dur: 10 },
        double: { emoji: '✨', name: 'Double Score', dur: 9 },
        radar: { emoji: '📡', name: 'Treasure Radar', dur: 12 },
        combo: { emoji: '🔥', name: 'Combo Booster', dur: 12 },
        bubble: { emoji: '🎈', name: 'Guard Bubble', dur: 20 },
        time: { emoji: '⏱️', name: 'Plus 10 Seconds', dur: 0 }
    };
    const POWER_KEYS = Object.keys(POWERS);

    /* ---------- Bẫy & sinh vật nguy hiểm ----------
       pen: điểm bị trừ. Mỗi loại còn một tác dụng phụ riêng xử lý trong hit(). */
    const HAZARDS = {
        jelly: { emoji: '🪼', name: 'Sứa', r: 20, pen: 25, stun: 1.1, speed: 26, move: 'drift' },
        urchin: { emoji: '🦔', name: 'Nhím Biển', r: 17, pen: 30, knock: 320, speed: 0, move: 'static' },
        coral: { emoji: '☠️', name: 'San Hô Độc', r: 18, pen: 45, slow: 3.5, speed: 0, move: 'static' },
        eel: { emoji: '⚡', name: 'Lươn Điện', r: 19, pen: 35, stun: 0.9, knock: 260, speed: 74, move: 'patrol' },
        seaweed: { emoji: '🌿', name: 'Rong Dính', r: 26, pen: 0, slow: 2.6, speed: 0, move: 'static' },
        crab: { emoji: '🦀', name: 'Cua Cáu Kỉnh', r: 18, pen: 30, knock: 300, speed: 96, move: 'chase', range: 240 },
        rock: { emoji: '🪨', name: 'Đá Rơi', r: 19, pen: 35, stun: 0.7, speed: 150, move: 'fall' },
        octo: { emoji: '🦑', name: 'Mực Phun', r: 20, pen: 20, blind: 4.5, speed: 52, move: 'patrol' },
        mine: { emoji: '💣', name: 'Mìn Biển', r: 20, pen: 60, knock: 460, drop: true, speed: 0, move: 'static' },
        shark: { emoji: '🦈', name: 'Cá Mập', r: 30, pen: 70, knock: 380, stun: 0.6, drop: true, speed: 132, move: 'hunt' },
        clam: { emoji: '🐚', name: 'Sò Khổng Lồ', r: 22, pen: 20, trap: 1.6, speed: 0, move: 'static' }
    };

    /* ---------- Điểm ---------- */
    const SCORE = {
        pearl: 10, coin: 25, gem: 120, chest: 250,
        cave: 300, objective: 220, mountPerSec: 6, ride: 60
    };

    const COMBO_WINDOW = 3.0;        // giây, không ăn gì thêm là đứt chuỗi
    const COMBO_MAX_MULT = 5;

    /* ---------- Đồ mở khoá ---------- */
    const SKINS = [
        { id: 'diver', emoji: '🐣', name: 'Little Diver', req: 0 },
        { id: 'mermaid', emoji: '🧜‍♀️', name: 'Mermaid', req: 2500 },
        { id: 'seal', emoji: '🦭', name: 'Seal', req: 6000 },
        { id: 'penguin', emoji: '🐧', name: 'Penguin', req: 10000 },
        { id: 'squid', emoji: '🦑', name: 'Baby Squid', req: 16000 },
        { id: 'shark', emoji: '🦈', name: 'Baby Shark', req: 24000 },
        { id: 'octo', emoji: '🐙', name: 'Baby Octopus', req: 32000 },
        { id: 'lobster', emoji: '🦞', name: 'Lobster', req: 45000 }
    ];

    const HATS = [
        { id: 'none', emoji: '🚫', name: 'No Hat', req: 0 },
        { id: 'crown', emoji: '👑', name: 'Crown', req: 3000 },
        { id: 'straw', emoji: '👒', name: 'Straw Hat', req: 7000 },
        { id: 'pirate', emoji: '🏴‍☠️', name: 'Pirate Hat', req: 12000 },
        { id: 'flower', emoji: '🌺', name: 'Sea Flower', req: 18000 },
        { id: 'party', emoji: '🎉', name: 'Party Hat', req: 26000 }
    ];

    const TRAILS = [
        { id: 'bubble', emoji: '🫧', name: 'Bubbles', req: 0 },
        { id: 'star', emoji: '⭐', name: 'Stars', req: 4000 },
        { id: 'heart', emoji: '💗', name: 'Hearts', req: 9000 },
        { id: 'spark', emoji: '✨', name: 'Sparkles', req: 15000 },
        { id: 'rainbow', emoji: '🌈', name: 'Rainbow', req: 22000 },
        { id: 'fire', emoji: '🔥', name: 'Sea Fire', req: 30000 }
    ];

    const ACHIEVEMENTS = [
        { id: 'firstDive', emoji: '🤿', name: 'First Dive', desc: 'Finish one round' },
        { id: 'combo5', emoji: '🔥', name: 'Combo Master', desc: 'Reach a x5 combo' },
        { id: 'chest3', emoji: '🧰', name: 'Chest Hunter', desc: 'Open 3 chests in one round' },
        { id: 'cave2', emoji: '🕳️', name: 'Explorer', desc: 'Find 2 hidden caves in one round' },
        { id: 'score1500', emoji: '💰', name: 'Small Fortune', desc: 'Score 1500 in one round' },
        { id: 'score3000', emoji: '👑', name: 'King Of The Deep', desc: 'Score 3000 in one round' },
        { id: 'rider', emoji: '🐬', name: 'Sea Rider', desc: 'Ride all 6 sea creatures' },
        { id: 'untouched', emoji: '🛡️', name: 'Untouched', desc: 'Finish a round without a single hit' },
        { id: 'sharkRun', emoji: '🦈', name: 'Shark Dodger', desc: 'Survive 10 seconds of shark chase' },
        { id: 'daily', emoji: '📅', name: 'Daily Diver', desc: 'Finish the Daily Challenge' },
        { id: 'atlantis', emoji: '🏛️', name: 'Reach Atlantis', desc: 'Unlock the final sea' }
    ];

    /* Mục tiêu phụ bốc ngẫu nhiên mỗi màn — thưởng thêm cho bé làm xong đầu tiên */
    const OBJECTIVES = [
        { id: 'gems', text: 'Collect 3 rare gems 💎', need: 3, track: 'gems' },
        { id: 'chests', text: 'Open 2 treasure chests 🧰', need: 2, track: 'chests' },
        { id: 'caves', text: 'Find 1 hidden cave 🕳️', need: 1, track: 'caves' },
        { id: 'rides', text: 'Ride 2 sea creatures 🐬', need: 2, track: 'rides' },
        { id: 'pearls', text: 'Collect 25 pearls 🫧', need: 25, track: 'pearls' }
    ];

    /* Sự kiện bất ngờ giữa trận */
    const EVENTS = ['whale', 'treasureRain', 'bigBubble', 'reverse', 'darkness', 'fishSchool', 'kraken'];

    /* =====================================================
       2. TIỆN ÍCH
       ===================================================== */

    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

    /* Bộ sinh ngẫu nhiên có hạt giống: cùng một hạt cho ra cùng một bản đồ, nhờ
       vậy Thử Thách Hôm Nay giống hệt nhau với mọi người chơi trong ngày. */
    function makeRng(seed) {
        let s = seed >>> 0;
        return function () {
            s |= 0; s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hashStr(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    function todayKey() {
        const d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    // Trợ giúp cho rng: số thực, số nguyên, chọn phần tử
    const rf = (rng, a, b) => a + rng() * (b - a);
    const ri = (rng, a, b) => Math.floor(a + rng() * (b - a + 1));
    const rpick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

    /* =====================================================
       3. LƯU TRỮ HỒ SƠ
       ===================================================== */

    const STORE_KEY = 'kibuOceanParty';

    const Store = {
        data: {
            total: 0,            // tổng điểm đã gom từ trước tới nay -> mở khoá
            equipped: { skin: 'diver', hat: 'none', trail: 'bubble' },
            achv: {},            // id -> true
            best: {},            // id vùng biển -> điểm cao nhất
            mounted: {},         // id loài đã từng cưỡi -> true
            daily: { day: '', score: 0 },
            sound: true
        },

        load() {
            try {
                const raw = localStorage.getItem(STORE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // Gộp nông là đủ: cấu trúc chỉ sâu một tầng
                    Object.keys(this.data).forEach(k => {
                        if (parsed[k] != null && typeof parsed[k] === typeof this.data[k]) {
                            this.data[k] = (typeof parsed[k] === 'object' && !Array.isArray(parsed[k]))
                                ? Object.assign({}, this.data[k], parsed[k])
                                : parsed[k];
                        }
                    });
                }
            } catch (e) { /* chế độ riêng tư hoặc dữ liệu hỏng: chơi với hồ sơ mới */ }
        },

        save() {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },

        addScore(n) {
            this.data.total += Math.max(0, Math.round(n));
            this.save();
        },

        unlockedWorlds() {
            return WORLDS.filter(w => this.data.total >= w.unlock).length;
        },

        owns(list, id) {
            const item = list.find(x => x.id === id);
            return !!item && this.data.total >= item.req;
        },

        award(id) {
            if (this.data.achv[id]) return false;
            this.data.achv[id] = true;
            this.save();
            return true;                    // true = vừa mới đạt, để còn khoe
        }
    };

    /* =====================================================
       4. ÂM THANH
       Tổng hợp bằng Web Audio, không tải tệp nhạc nào.
       ===================================================== */

    class OceanAudio {
        constructor() {
            this.ctx = null;
            this.enabled = true;
            this.master = null;
            this.musicGain = null;
            this.musicTimer = null;
            this.step = 0;
            this.tension = false;
        }

        init() {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.5;
                this.master.connect(this.ctx.destination);
                this.musicGain = this.ctx.createGain();
                this.musicGain.gain.value = 0.22;
                this.musicGain.connect(this.master);
            }
            if (this.ctx.state === 'suspended') this.ctx.resume();
        }

        // Một nốt đơn giản: dạng sóng, tần số đầu/cuối, độ dài, âm lượng
        tone(type, f0, f1, dur, vol, dest) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(f0, t);
            if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3));
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            g.connect(dest || this.master);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        }

        // Tiếng ồn trắng ngắn: dùng cho bọt nước, nổ, cát
        noise(dur, vol, freq) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const len = Math.floor(this.ctx.sampleRate * dur);
            const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const filt = this.ctx.createBiquadFilter();
            filt.type = 'bandpass';
            filt.frequency.value = freq || 900;
            const g = this.ctx.createGain();
            g.gain.value = vol;
            src.connect(filt); filt.connect(g); g.connect(this.master);
            src.start(t);
        }

        pearl(combo) {
            const step = Math.min(combo || 0, 12);
            this.tone('sine', 660 * Math.pow(1.06, step), 990 * Math.pow(1.06, step), 0.12, 0.18);
        }
        coin() { this.tone('square', 880, 1320, 0.1, 0.13); this.tone('square', 1320, 1760, 0.09, 0.09); }
        gem() {
            this.tone('triangle', 880, 1400, 0.18, 0.2);
            setTimeout(() => this.tone('triangle', 1320, 1980, 0.2, 0.16), 70);
        }
        chest() {
            this.noise(0.25, 0.16, 500);
            [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f * 1.5, 0.22, 0.16), i * 80));
        }
        cave() {
            [392, 523, 659, 880, 1174].forEach((f, i) => setTimeout(() => this.tone('sine', f, f * 1.2, 0.3, 0.15), i * 90));
        }
        dash() { this.noise(0.18, 0.13, 1500); this.tone('sawtooth', 200, 620, 0.16, 0.08); }
        hurt() { this.tone('sawtooth', 260, 70, 0.32, 0.2); this.noise(0.2, 0.12, 300); }
        stun() { this.tone('square', 140, 90, 0.4, 0.14); }
        power() { [659, 880, 1174].forEach((f, i) => setTimeout(() => this.tone('sine', f, f * 1.4, 0.16, 0.16), i * 60)); }
        mount() { [392, 587, 784].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f * 1.3, 0.2, 0.15), i * 70)); }
        bubble() { this.tone('sine', 300 + Math.random() * 300, 900, 0.09, 0.05); }
        event() { [523, 440, 659, 880].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.2, 0.14), i * 110)); }
        beep(hi) { this.tone('square', hi ? 1046 : 660, hi ? 1400 : 660, 0.16, 0.18); }

        fanfare() {
            const notes = [523, 659, 784, 1046, 784, 1046, 1318];
            notes.forEach((f, i) => setTimeout(() => {
                this.tone('triangle', f, f * 1.01, 0.28, 0.2);
                this.tone('sine', f * 2, f * 2, 0.2, 0.08);
            }, i * 130));
        }

        /* Nhạc nền: vòng hợp âm chậm rãi kiểu dưới nước. Hai mươi giây cuối
           chuyển sang quãng gấp gáp hơn cho hồi hộp. */
        startMusic() {
            this.stopMusic();
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.step = 0;
            const calm = [220, 262, 330, 262, 196, 247, 294, 247];
            const rush = [294, 349, 440, 349, 330, 392, 494, 392];
            const tick = () => {
                if (!this.enabled || !this.ctx) return;
                const seq = this.tension ? rush : calm;
                const f = seq[this.step % seq.length];
                this.tone('sine', f, f, this.tension ? 0.26 : 0.5, 0.1, this.musicGain);
                if (this.step % 4 === 0) this.tone('triangle', f / 2, f / 2, 0.6, 0.07, this.musicGain);
                this.step++;
            };
            tick();
            this.musicTimer = setInterval(tick, 520);
        }

        setTension(on) {
            if (this.tension === on) return;
            this.tension = on;
            if (this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
                this.startMusic();
            }
        }

        stopMusic() {
            if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
            this.tension = false;
        }
    }

    const audio = new OceanAudio();

    /* =====================================================
       5. KHO ẢNH EMOJI
       Vẽ emoji bằng fillText mỗi khung hình vừa chậm vừa đi qua bộ dịch của
       i18n (nó vá CanvasRenderingContext2D.fillText). Dựng sẵn một lần vào
       canvas nhỏ rồi drawImage cho nhẹ.
       ===================================================== */

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
        // fillText gốc: tránh lớp dịch của i18n xen vào giữa vòng vẽ
        const orig = CanvasRenderingContext2D.prototype.fillText;
        orig.call(g, ch, c.width / 2, c.height / 2 + size * 0.04);
        spriteCache.set(key, c);
        return c;
    }

    /* Ảnh phải được dựng ở đúng số pixel vật lý mà nó sẽ chiếm trên màn hình:
       kích thước truyền vào là đơn vị THẾ GIỚI, còn lúc vẽ nó còn bị nhân thêm
       zoom của máy quay và devicePixelRatio. Bản đầu dựng theo cỡ CSS rồi phóng
       to gấp 2–2.5 lần khi vẽ, nên nhân vật trông nhoè. Làm tròn hệ số theo nấc
       0,5 để số ảnh trong kho không phình ra vô hạn khi zoom thay đổi liên tục. */
    function spriteScale() {
        const raw = pixelRatio * (G.camera ? G.camera.zoom : 1);
        return clamp(Math.ceil(raw * 2) / 2, 1, 3);
    }

    function drawEmoji(ctx, ch, x, y, size, alpha) {
        const q = spriteScale();
        const px = Math.max(8, Math.ceil(size * q / 4) * 4);
        const s = emojiSprite(ch, px);
        const dw = s.width / q, dh = s.height / q;
        if (alpha != null && alpha < 1) {
            ctx.save();
            ctx.globalAlpha *= alpha;
            ctx.drawImage(s, x - dw / 2, y - dh / 2, dw, dh);
            ctx.restore();
        } else {
            ctx.drawImage(s, x - dw / 2, y - dh / 2, dw, dh);
        }
    }

    /* =====================================================
       6. SINH MÀN CHƠI
       Hang động kiểu "cellular automata": gieo nhiễu rồi làm mượt vài lần là ra
       những khoang nước nối nhau tự nhiên. Khoang nào bị tách rời khỏi khoang
       chính thì không lấp đi mà biến thành PHÒNG BÍ MẬT, nối vào bằng một đoạn
       tường san hô phá được — đó chính là cơ chế "hang bí mật" của game.
       ===================================================== */

    function generateLevel(world, rng, playerCount) {
        const cols = world.cols, rows = world.rows;
        const n = cols * rows;
        const idx = (c, r) => r * cols + c;

        let grid = null, regions = null, main = null;

        // Thỉnh thoảng nhiễu cho ra bản đồ quá chật; thử lại tối đa 12 lần.
        for (let attempt = 0; attempt < 12; attempt++) {
            grid = new Uint8Array(n);
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const edge = (c < 2 || r < 2 || c >= cols - 2 || r >= rows - 2);
                    grid[idx(c, r)] = edge ? T_EDGE : (rng() < world.wall ? T_ROCK : T_WATER);
                }
            }

            for (let pass = 0; pass < 5; pass++) {
                const next = grid.slice();
                for (let r = 2; r < rows - 2; r++) {
                    for (let c = 2; c < cols - 2; c++) {
                        let walls = 0;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                if (!dr && !dc) continue;
                                if (grid[idx(c + dc, r + dr)] !== T_WATER) walls++;
                            }
                        }
                        next[idx(c, r)] = walls > 4 ? T_ROCK : (walls < 4 ? T_WATER : grid[idx(c, r)]);
                    }
                }
                grid = next;
            }

            regions = labelRegions(grid, cols, rows);
            main = regions.list.length ? regions.list.reduce((a, b) => a.cells.length >= b.cells.length ? a : b) : null;
            if (main && main.cells.length > n * 0.30) break;
        }

        /* Khoang phụ: đủ rộng thì thành phòng bí mật, bé quá thì lấp lại.
           secret = cả phòng lẫn đoạn hành lang san hô (dùng để tính công tìm ra
           hang); fog = chỉ riêng lòng phòng, phần bị che kín cho tới khi có bé
           đục tường chui vào. Nhờ vậy tường san hô vẫn nhìn thấy được — nó là
           gợi ý "có gì đó phía sau" — còn kho báu bên trong thì không. */
        const secret = new Uint8Array(n);
        const fog = new Uint8Array(n);
        const caveOfCell = new Int32Array(n).fill(-1);
        const caves = [];
        regions.list.forEach(reg => {
            if (reg === main) return;
            if (reg.cells.length < 8) {
                reg.cells.forEach(i => { grid[i] = T_ROCK; });
                return;
            }
            const caveId = caves.length;
            reg.cells.forEach(i => { secret[i] = 1; fog[i] = 1; caveOfCell[i] = caveId; });
            carveCoralLink(grid, secret, cols, rows, reg, main, rng);
            let sx = 0, sy = 0;
            reg.cells.forEach(i => { sx += (i % cols); sy += Math.floor(i / cols); });
            caves.push({
                id: caves.length,
                x: (sx / reg.cells.length + 0.5) * TILE,
                y: (sy / reg.cells.length + 0.5) * TILE,
                cells: reg.cells.length,
                found: false,
                finder: -1,
                glow: 0
            });
        });

        const level = {
            world, cols, rows, grid, secret, fog, caveOfCell, caves,
            w: cols * TILE, h: rows * TILE,
            spawns: [], pickups: [], hazards: [], mountPods: [], powerPods: [],
            fields: [], plants: [], bubblers: [], ruins: []
        };

        const openCells = [];
        for (let i = 0; i < n; i++) if (grid[i] === T_WATER) openCells.push(i);

        // Chỗ xuất phát: giữa khoang chính, các bé đứng cách nhau ra
        const mainCells = main.cells.filter(i => grid[i] === T_WATER);
        level.spawns = pickSpread(mainCells, cols, playerCount, rng, 4);

        // Bản đồ khoảng cách tính từ chỗ xuất phát: càng xa càng đặt đồ quý
        const depth = bfsDepth(grid, cols, rows, level.spawns.map(s => idx(
            clamp(Math.floor(s.x / TILE), 0, cols - 1),
            clamp(Math.floor(s.y / TILE), 0, rows - 1))));
        let maxDepth = 1;
        for (let i = 0; i < n; i++) if (depth[i] < 1e8 && depth[i] > maxDepth) maxDepth = depth[i];
        level.depth = depth;
        level.maxDepth = maxDepth;

        const far = openCells.filter(i => depth[i] > maxDepth * 0.55);
        const secretCells = openCells.filter(i => secret[i]);
        const near = openCells.filter(i => depth[i] <= maxDepth * 0.55);

        const cellPos = i => ({ x: ((i % cols) + 0.5) * TILE, y: (Math.floor(i / cols) + 0.5) * TILE });
        const used = new Set();

        function take(pool, count, fn) {
            let placed = 0, guard = 0;
            while (placed < count && guard++ < count * 40 && pool.length) {
                const i = pool[Math.floor(rng() * pool.length)];
                if (used.has(i)) continue;
                used.add(i);
                fn(cellPos(i), i);
                placed++;
            }
        }

        // --- Ngọc trai: rải khắp nơi, thành từng chuỗi để bé ăn combo ---
        const pearlLines = 10 + Math.round(world.diff * 1.5);
        for (let k = 0; k < pearlLines; k++) {
            const start = openCells[Math.floor(rng() * openCells.length)];
            const horiz = rng() < 0.5;
            const len = ri(rng, 4, 8);
            let c = start % cols, r = Math.floor(start / cols);
            for (let s = 0; s < len; s++) {
                const i = idx(c, r);
                if (c < 1 || r < 1 || c >= cols || r >= rows || grid[i] !== T_WATER) break;
                if (!used.has(i)) {
                    used.add(i);
                    const p = cellPos(i);
                    level.pickups.push(makePickup('pearl', p.x, p.y, secret[i] === 1));
                }
                if (horiz) c++; else r++;
            }
        }

        take(openCells, 14 + world.diff * 2, p => level.pickups.push(makePickup('coin', p.x, p.y, false)));
        take(far, 8 + world.diff, p => level.pickups.push(makePickup('coin', p.x, p.y, false)));
        take(far, 3 + Math.round(world.diff * 0.7), p => level.pickups.push(makePickup('gem', p.x, p.y, false)));
        take(secretCells, 4, p => level.pickups.push(makePickup('gem', p.x, p.y, true)));
        take(far, 2 + Math.round(world.diff * 0.4), p => level.pickups.push(makePickup('chest', p.x, p.y, false)));
        take(secretCells, 2, p => level.pickups.push(makePickup('chest', p.x, p.y, true)));

        // --- Bảo bối & cá cưỡi ---
        take(openCells, 5 + Math.round(world.diff * 0.6), p =>
            level.powerPods.push(makePowerPod(p.x, p.y, rpick(rng, POWER_KEYS))));
        take(openCells, 4 + Math.round(world.diff * 0.5), p =>
            level.mountPods.push(makeMountPod(p.x, p.y, rpick(rng, MOUNT_KEYS))));

        // --- Bẫy: tránh đặt sát chỗ xuất phát để bé chưa kịp bơi đã dính ---
        const spawnSafe = i => {
            const p = cellPos(i);
            return level.spawns.every(s => dist(p.x, p.y, s.x, s.y) > TILE * 5);
        };
        const hazardPool = openCells.filter(spawnSafe);
        const hazardCount = Math.round((9 + world.diff * 2.2) * world.hazards) + playerCount;
        take(hazardPool, hazardCount, p => {
            const kind = rpick(rng, world.hazardKinds);
            level.hazards.push(makeHazard(kind, p.x, p.y, rng, level));
        });
        take(hazardPool, world.mines, p => level.hazards.push(makeHazard('mine', p.x, p.y, rng, level)));

        // Cá mập: mỗi màn khó chỉ một con, tự đi săn bé đang bơi nhanh nhất
        if (world.hazardKinds.indexOf('shark') >= 0) {
            const p = cellPos(hazardPool[Math.floor(rng() * hazardPool.length)] || openCells[0]);
            level.hazards.push(makeHazard('shark', p.x, p.y, rng, level));
        }

        // --- Dòng chảy, xoáy nước, miệng phun, vùng nước lạnh ---
        buildFields(level, rng);

        // --- Trang trí: rong biển mọc từ đáy, cột bọt, phế tích ---
        for (let i = 0; i < n; i++) {
            if (grid[i] !== T_WATER) continue;
            const c = i % cols, r = Math.floor(i / cols);
            if (r + 1 < rows && grid[idx(c, r + 1)] !== T_WATER && rng() < 0.4) {
                level.plants.push({
                    x: (c + 0.5) * TILE + rf(rng, -8, 8),
                    y: (r + 1) * TILE,
                    h: rf(rng, TILE * 0.7, TILE * 2.1),
                    w: rf(rng, 5, 11),
                    phase: rng() * 6.28,
                    kind: rng() < 0.25 ? 'fan' : 'weed'
                });
            }
            if (rng() < 0.012) level.bubblers.push({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE, t: rng() * 2 });
        }
        for (let k = 0; k < 4 + world.diff; k++) {
            const i = openCells[Math.floor(rng() * openCells.length)];
            const p = cellPos(i);
            level.ruins.push({ x: p.x, y: p.y, s: rf(rng, 0.7, 1.4), rot: rf(rng, -0.3, 0.3), kind: Math.floor(rng() * 3) });
        }

        // --- Mục tiêu phụ của màn ---
        level.objective = Object.assign({}, rpick(rng, OBJECTIVES), { done: false, winner: -1 });

        return level;
    }

    /* Gán nhãn từng khoang nước rời nhau (loang 4 hướng). */
    function labelRegions(grid, cols, rows) {
        const n = cols * rows;
        const label = new Int32Array(n).fill(-1);
        const list = [];
        const stack = [];
        for (let start = 0; start < n; start++) {
            if (grid[start] !== T_WATER || label[start] >= 0) continue;
            const id = list.length;
            const cells = [];
            stack.length = 0;
            stack.push(start);
            label[start] = id;
            while (stack.length) {
                const i = stack.pop();
                cells.push(i);
                const c = i % cols, r = (i / cols) | 0;
                if (c > 0) pushIf(i - 1);
                if (c < cols - 1) pushIf(i + 1);
                if (r > 0) pushIf(i - cols);
                if (r < rows - 1) pushIf(i + cols);
            }
            list.push({ id, cells });

            function pushIf(j) {
                if (grid[j] === T_WATER && label[j] < 0) { label[j] = id; stack.push(j); }
            }
        }
        return { label, list };
    }

    /* Nối một phòng bí mật vào khoang chính bằng đoạn tường san hô phá được.
       Chọn cặp ô gần nhau nhất giữa hai khoang rồi đục thẳng một đường. */
    function carveCoralLink(grid, secret, cols, rows, reg, main, rng) {
        const mainSet = new Set(main.cells);
        let best = null, bestD = Infinity;
        // Duyệt thưa cho nhanh: phòng bí mật thường nhỏ, khoang chính thì rất to
        const stepMain = Math.max(1, Math.floor(main.cells.length / 900));
        for (let a = 0; a < reg.cells.length; a++) {
            const ia = reg.cells[a];
            const ca = ia % cols, ra = (ia / cols) | 0;
            for (let b = 0; b < main.cells.length; b += stepMain) {
                const ib = main.cells[b];
                const cb = ib % cols, rb = (ib / cols) | 0;
                const d = (ca - cb) * (ca - cb) + (ra - rb) * (ra - rb);
                if (d < bestD) { bestD = d; best = [ca, ra, cb, rb]; }
            }
        }
        if (!best) return;

        let [c0, r0, c1, r1] = best;
        let guard = 0;
        while ((c0 !== c1 || r0 !== r1) && guard++ < 200) {
            if (c0 !== c1 && (r0 === r1 || rng() < 0.5)) c0 += Math.sign(c1 - c0);
            else r0 += Math.sign(r1 - r0);
            const i = r0 * cols + c0;
            if (grid[i] === T_ROCK) { grid[i] = T_CORAL; secret[i] = 1; }
            if (mainSet.has(i)) break;
        }
    }

    /* Khoảng cách (số ô) từ các điểm xuất phát tới mọi ô nước. */
    function bfsDepth(grid, cols, rows, starts) {
        const n = cols * rows;
        const depth = new Int32Array(n).fill(1e9);
        const queue = [];
        starts.forEach(i => { if (grid[i] === T_WATER) { depth[i] = 0; queue.push(i); } });
        for (let head = 0; head < queue.length; head++) {
            const i = queue[head];
            const c = i % cols, r = (i / cols) | 0;
            const d = depth[i] + 1;
            if (c > 0) step(i - 1);
            if (c < cols - 1) step(i + 1);
            if (r > 0) step(i - cols);
            if (r < rows - 1) step(i + cols);

            function step(j) {
                // Tường san hô vẫn đi qua được (phá ra), nên tính như đường đi
                if ((grid[j] === T_WATER || grid[j] === T_CORAL) && depth[j] > d) {
                    depth[j] = d;
                    queue.push(j);
                }
            }
        }
        return depth;
    }

    /* Chọn vài ô cách xa nhau làm chỗ xuất phát cho các bé. */
    function pickSpread(cells, cols, count, rng, minTiles) {
        const out = [];
        let guard = 0;
        while (out.length < count && guard++ < 900) {
            const i = cells[Math.floor(rng() * cells.length)];
            const x = ((i % cols) + 0.5) * TILE, y = (((i / cols) | 0) + 0.5) * TILE;
            if (out.every(p => dist(p.x, p.y, x, y) > minTiles * TILE)) out.push({ x, y });
        }
        // Bản đồ chật quá thì cho phép đứng gần nhau, miễn là có chỗ
        while (out.length < count) {
            const i = cells[Math.floor(rng() * cells.length)];
            out.push({ x: ((i % cols) + 0.5) * TILE, y: (((i / cols) | 0) + 0.5) * TILE });
        }
        return out;
    }

    /* ---------- Dòng chảy và các vùng nước đặc biệt ---------- */
    function buildFields(level, rng) {
        const w = level.w, h = level.h, d = level.world.diff;
        const s = level.world.current;

        // Dải chảy ngang: cuốn bé đi rất xa nếu biết thả trôi đúng chiều
        for (let k = 0; k < 2 + Math.round(d * 0.5); k++) {
            const y = rf(rng, h * 0.15, h * 0.85);
            level.fields.push({
                kind: 'current', x: 0, y: y - TILE, w: w, h: TILE * rf(rng, 1.6, 3),
                fx: (rng() < 0.5 ? -1 : 1) * rf(rng, 90, 170) * s, fy: 0, t: rng() * 6
            });
        }
        // Dải chảy dọc
        for (let k = 0; k < 1 + Math.round(d * 0.4); k++) {
            const x = rf(rng, w * 0.15, w * 0.85);
            level.fields.push({
                kind: 'current', x: x - TILE, y: 0, w: TILE * rf(rng, 1.5, 2.6), h: h,
                fx: 0, fy: (rng() < 0.5 ? -1 : 1) * rf(rng, 80, 150) * s, t: rng() * 6
            });
        }
        // Xoáy nước: hút vào tâm và quay tròn
        for (let k = 0; k < 1 + Math.round(d * 0.6); k++) {
            level.fields.push({
                kind: 'whirl', x: rf(rng, w * 0.1, w * 0.9), y: rf(rng, h * 0.1, h * 0.9),
                r: rf(rng, TILE * 2.4, TILE * 4), power: rf(rng, 150, 260) * s, spin: rng() < 0.5 ? -1 : 1, t: rng() * 6
            });
        }
        // Miệng phun nóng: đẩy bé vọt lên trên
        for (let k = 0; k < 1 + Math.round(d * 0.5); k++) {
            level.fields.push({
                kind: 'vent', x: rf(rng, w * 0.1, w * 0.9), y: rf(rng, h * 0.35, h * 0.95),
                r: rf(rng, TILE * 1.6, TILE * 2.6), power: rf(rng, 260, 430), t: rng() * 6
            });
        }
        // Vùng nước lạnh: bơi ì ạch hẳn
        for (let k = 0; k < 1 + Math.round(d * 0.4); k++) {
            level.fields.push({
                kind: 'cold', x: rf(rng, w * 0.1, w * 0.9), y: rf(rng, h * 0.1, h * 0.9),
                r: rf(rng, TILE * 2.2, TILE * 3.6), t: rng() * 6
            });
        }
        // Vòi nước: cú đẩy mạnh theo một hướng cố định
        for (let k = 0; k < Math.round(d * 0.6); k++) {
            const dir = rf(rng, 0, Math.PI * 2);
            level.fields.push({
                kind: 'jet', x: rf(rng, w * 0.1, w * 0.9), y: rf(rng, h * 0.1, h * 0.9),
                r: TILE * 1.9, fx: Math.cos(dir) * 420, fy: Math.sin(dir) * 420, t: rng() * 6
            });
        }
    }

    /* ---------- Nhà máy thực thể ---------- */
    function makePickup(kind, x, y, inSecret) {
        return {
            kind, x, y, inSecret,
            r: kind === 'chest' ? 20 : (kind === 'gem' ? 15 : 12),
            alive: true, t: Math.random() * 6, vx: 0, vy: 0, loose: false, life: 0,
            baseY: y
        };
    }

    function makePowerPod(x, y, type) {
        return { x, y, type, r: 17, alive: true, t: Math.random() * 6, respawn: 0 };
    }

    function makeMountPod(x, y, type) {
        return { x, y, type, r: 20, alive: true, t: Math.random() * 6, respawn: 0, dir: Math.random() < 0.5 ? -1 : 1 };
    }

    function makeHazard(kind, x, y, rng, level) {
        const meta = HAZARDS[kind];
        const h = {
            kind, meta, x, y, r: meta.r, t: rng() * 6,
            vx: 0, vy: 0, home: { x, y }, angle: rf(rng, 0, 6.28),
            cool: 0, target: -1, alive: true
        };
        if (meta.move === 'patrol' || meta.move === 'drift') {
            h.vx = Math.cos(h.angle) * meta.speed;
            h.vy = Math.sin(h.angle) * meta.speed;
        }
        if (meta.move === 'fall') {
            h.ceil = y;                                  // rơi xuống rồi quay lại trần
            h.wait = rf(rng, 0, 2.5);
        }
        return h;
    }

    /* =====================================================
       7. TRẠNG THÁI TRẬN ĐẤU
       ===================================================== */

    const G = {
        state: 'MENU',                 // MENU | COUNTDOWN | PLAYING | END
        mode: 'party',                 // party | tournament | daily
        playerCount: 1,
        worldIdx: 0,
        matchTime: 120,
        time: 0,
        countdown: 0,
        level: null,
        players: [],
        particles: [],
        texts: [],
        bubbles: [],
        drops: [],                     // vật phẩm rơi ra / mưa kho báu
        event: null,
        eventTimer: 14,
        darkBoost: 0,
        currentFlip: 1,
        shake: 0,
        camera: { x: 0, y: 0, zoom: 1 },
        round: 0,
        rounds: 1,
        totals: [],
        roundWorlds: [],
        seedBase: 0
    };

    let keys = {};
    const touch = { active: false, dx: 0, dy: 0, dash: false, dashEdge: false };

    /* =====================================================
       8. NGƯỜI CHƠI
       ===================================================== */

    const BASE_ACCEL = 1180;
    const BASE_DRAG = 3.3;             // hệ số cản của nước (1/giây)
    const SINK = 34;                   // bé hơi chìm khi thả tay — cảm giác dưới nước
    const DASH_IMPULSE = 460;
    const DASH_CD = 1.05;
    const DASH_TIME = 0.3;

    class Player {
        constructor(index, slot, spawn) {
            this.index = index;
            this.ctrl = CONTROLS[slot];
            this.style = PLAYER_STYLE[index];
            this.x = spawn.x;
            this.y = spawn.y;
            this.vx = 0; this.vy = 0;
            this.r = 15;
            this.face = 1;              // hướng mặt: 1 phải, -1 trái
            this.tilt = 0;
            this.stroke = 0;            // pha quạt tay, tạo nhịp bơi nhấp nhô
            this.score = 0;
            this.combo = 0;
            this.comboT = 0;
            this.bestCombo = 0;
            this.dashCd = 0;
            this.dashT = 0;
            this.stun = 0;
            this.slow = 0;
            this.blind = 0;
            this.trap = 0;
            this.invuln = 1.2;          // vài giây đầu không dính bẫy
            this.mount = null;
            this.mountT = 0;
            this.buffs = { speed: 0, magnet: 0, shield: 0, double: 0, radar: 0, combo: 0, bubble: 0 };
            this.stats = { pearls: 0, coins: 0, gems: 0, chests: 0, caves: 0, rides: 0, hits: 0, treasures: 0, rideTime: 0 };
            this.ridden = {};
            this.sharkTime = 0;
            this.trailT = 0;
            this.hurtFlash = 0;
            this.emote = null;
            this.emoteT = 0;
        }

        get skin() {
            // Bé 1 dùng nhân vật đang chọn trong bộ sưu tập, các bé khác dùng mặc định
            if (this.index === 0) {
                const s = SKINS.find(x => x.id === Store.data.equipped.skin);
                if (s && Store.data.total >= s.req) return s.emoji;
            }
            return this.style.face;
        }

        get hat() {
            if (this.index !== 0) return null;
            const h = HATS.find(x => x.id === Store.data.equipped.hat);
            return (h && h.id !== 'none' && Store.data.total >= h.req) ? h.emoji : null;
        }

        get trailEmoji() {
            const t = TRAILS.find(x => x.id === Store.data.equipped.trail);
            return (this.index === 0 && t && Store.data.total >= t.req) ? t.emoji : '🫧';
        }

        get mult() {
            const m = 1 + Math.min(COMBO_MAX_MULT - 1, Math.floor(this.combo / 4));
            return this.buffs.double > 0 ? m * 2 : m;
        }

        input() {
            const c = this.ctrl;
            let dx = 0, dy = 0, dash = false;
            if (keys[c.left]) dx -= 1;
            if (keys[c.right]) dx += 1;
            if (keys[c.up]) dy -= 1;
            if (keys[c.down]) dy += 1;
            if (c.dash.some(k => keys[k])) dash = true;
            // Cảm ứng chỉ lái bé số 1 (điện thoại thì chơi một mình)
            if (this.index === 0 && touch.active) {
                dx += touch.dx; dy += touch.dy;
                if (touch.dash) dash = true;
            }
            const len = Math.hypot(dx, dy);
            if (len > 1) { dx /= len; dy /= len; }
            return { dx, dy, dash };
        }

        update(dt, level) {
            const inp = this.input();

            // Bộ đếm ngược các trạng thái
            this.invuln = Math.max(0, this.invuln - dt);
            this.stun = Math.max(0, this.stun - dt);
            this.slow = Math.max(0, this.slow - dt);
            this.blind = Math.max(0, this.blind - dt);
            this.trap = Math.max(0, this.trap - dt);
            this.dashCd = Math.max(0, this.dashCd - dt);
            this.dashT = Math.max(0, this.dashT - dt);
            this.hurtFlash = Math.max(0, this.hurtFlash - dt);
            this.emoteT = Math.max(0, this.emoteT - dt);
            for (const k in this.buffs) this.buffs[k] = Math.max(0, this.buffs[k] - dt);

            if (this.comboT > 0) {
                this.comboT -= dt;
                if (this.comboT <= 0) this.combo = 0;
            }

            if (this.mount) {
                this.mountT -= dt;
                this.stats.rideTime += dt;
                this.addScore(SCORE.mountPerSec * dt, null, true);
                if (this.mountT <= 0) {
                    floatText(this.x, this.y - 26, MOUNTS[this.mount].emoji + ' tạm biệt!', '#8fd7ff');
                    this.mount = null;
                }
            }

            const m = this.mount ? MOUNTS[this.mount] : null;
            const frozen = this.stun > 0 || this.trap > 0;

            // --- Lực bơi ---
            let accel = BASE_ACCEL * (m ? m.accel : 1);
            if (this.buffs.speed > 0) accel *= 1.35;
            if (this.slow > 0) accel *= 0.5;
            if (frozen) accel = 0;

            // Nhịp quạt tay: lực mạnh yếu theo chu kỳ cho dáng bơi nhấp nhô
            if (!frozen && (inp.dx || inp.dy)) this.stroke += dt * 7.5;
            const strokeK = 0.78 + 0.34 * Math.sin(this.stroke);

            this.vx += inp.dx * accel * strokeK * dt;
            this.vy += inp.dy * accel * strokeK * dt;

            // Người chìm nhẹ, cưỡi cá thì nổi hơn
            this.vy += SINK * (m ? 0.35 : 1) * dt;

            // --- Lướt nhanh ---
            if (inp.dash && this.dashCd <= 0 && !frozen) {
                let dx = inp.dx, dy = inp.dy;
                if (!dx && !dy) { dx = this.face; dy = 0; }
                const len = Math.hypot(dx, dy) || 1;
                const power = DASH_IMPULSE * (m ? m.speed : 1);
                this.vx += (dx / len) * power;
                this.vy += (dy / len) * power;
                this.dashCd = DASH_CD;
                this.dashT = DASH_TIME;
                audio.dash();
                for (let i = 0; i < 10; i++) {
                    spawnParticle(this.x, this.y, -(dx / len) * rnd(40, 160), -(dy / len) * rnd(40, 160), 'rgba(190,240,255,0.85)', rnd(3, 7), 0.5);
                }
                if (m && m.ability === 'ink') this.shootInk();
                if (m && m.ability === 'push') this.pufferPush();
            }

            // --- Dòng chảy và các vùng nước đặc biệt ---
            let coldZone = false;
            if (!(m && m.ignoreCurrent)) {
                for (const f of level.fields) {
                    if (f.kind === 'current') {
                        if (this.x > f.x && this.x < f.x + f.w && this.y > f.y && this.y < f.y + f.h) {
                            this.vx += f.fx * G.currentFlip * dt;
                            this.vy += f.fy * G.currentFlip * dt;
                        }
                    } else {
                        const d = dist(this.x, this.y, f.x, f.y);
                        if (d > f.r) continue;
                        const fall = 1 - d / f.r;
                        if (f.kind === 'whirl') {
                            const ang = Math.atan2(f.y - this.y, f.x - this.x);
                            this.vx += (Math.cos(ang) * 0.7 + Math.cos(ang + Math.PI / 2) * f.spin) * f.power * fall * dt;
                            this.vy += (Math.sin(ang) * 0.7 + Math.sin(ang + Math.PI / 2) * f.spin) * f.power * fall * dt;
                        } else if (f.kind === 'vent') {
                            this.vy -= f.power * fall * dt;
                        } else if (f.kind === 'jet') {
                            this.vx += f.fx * fall * dt;
                            this.vy += f.fy * fall * dt;
                        } else if (f.kind === 'cold') {
                            coldZone = true;
                        }
                    }
                }
            }
            if (G.event === 'bigBubble') this.vy -= 260 * dt;

            // --- Cản nước ---
            let drag = BASE_DRAG;
            if (coldZone) drag *= 2.1;
            if (this.slow > 0) drag *= 1.8;
            if (frozen) drag *= 2.4;
            if (this.dashT > 0) drag *= 0.45;      // lúc lướt thì trôi xa hơn
            const damp = Math.exp(-drag * dt);
            this.vx *= damp;
            this.vy *= damp;

            // Chặn trần tốc độ để xoáy nước không bắn bé đi mất hút
            const sp = Math.hypot(this.vx, this.vy);
            const maxSp = 720 * (m ? m.speed : 1);
            if (sp > maxSp) { this.vx *= maxSp / sp; this.vy *= maxSp / sp; }

            // --- Di chuyển & va chạm ---
            this.moveAndCollide(this.vx * dt, this.vy * dt, level);

            if (Math.abs(this.vx) > 12) this.face = this.vx > 0 ? 1 : -1;
            this.tilt = lerp(this.tilt, clamp(this.vy / 420, -0.5, 0.5), Math.min(1, dt * 8));

            // Bọt khí theo sau
            this.trailT -= dt;
            if (this.trailT <= 0 && sp > 60) {
                this.trailT = 0.09;
                G.bubbles.push({ x: this.x - this.face * 10, y: this.y + 6, r: rnd(2, 5), vy: -rnd(20, 46), life: rnd(0.7, 1.4), t: 0, emoji: null });
                if (this.buffs.speed > 0 || this.dashT > 0) {
                    G.bubbles.push({ x: this.x, y: this.y, r: 8, vy: -18, life: 0.7, t: 0, emoji: this.trailEmoji });
                }
            }

            this.pickUp(level);
            this.checkCave(level);
        }

        /* Đi từng trục một rồi mới xử lý va chạm — cách này khiến bé trượt dọc
           theo vách đá thay vì dính cứng vào góc. */
        moveAndCollide(dx, dy, level) {
            const canBreak = this.dashT > 0 || (this.mount && MOUNTS[this.mount].breaks);
            this.x += dx;
            this.resolveAxis(level, true, canBreak, dx);
            this.y += dy;
            this.resolveAxis(level, false, canBreak, dy);
            this.unstick(level);
            this.x = clamp(this.x, this.r, level.w - this.r);
            this.y = clamp(this.y, this.r, level.h - this.r);
        }

        /* Đẩy bé ra theo đúng chiều vừa đi tới, KHÔNG đoán theo tâm ô đá.
           Bản trước so sánh với tâm ô: khi bé lọt vào góc lõm, cú đẩy ngang lại
           tống bé vào khối đá bên dưới rồi cú đẩy dọc tống ngược lên — hai bên
           đá qua đá lại nên bé kẹt cứng ở góc, đúng như trong ảnh. */
        resolveAxis(level, horizontal, canBreak, delta) {
            const rr = this.r * 0.86;
            const c0 = Math.floor((this.x - rr) / TILE), c1 = Math.floor((this.x + rr) / TILE);
            const r0 = Math.floor((this.y - rr) / TILE), r1 = Math.floor((this.y + rr) / TILE);
            for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                    if (c < 0 || r < 0 || c >= level.cols || r >= level.rows) continue;
                    const i = r * level.cols + c;
                    const t = level.grid[i];
                    if (t === T_WATER) continue;
                    if (t === T_CORAL && canBreak) {
                        breakCoral(level, i, c, r);
                        continue;
                    }
                    const tx = c * TILE, ty = r * TILE;
                    /* Vị trí đã đổi sau cú đẩy của ô trước đó — phải đo lại xem
                       còn chạm ô này không. Bản cũ lấy khung bao một lần rồi đẩy
                       cho mọi ô trong khung, nên đứng sát tường mà có tảng đá
                       chéo phía trên là bé bị hất lên/xuống một ô. */
                    if (this.x + rr <= tx || this.x - rr >= tx + TILE ||
                        this.y + rr <= ty || this.y - rr >= ty + TILE) continue;
                    if (horizontal) {
                        if (delta > 0) this.x = tx - rr;
                        else if (delta < 0) this.x = tx + TILE + rr;
                        else this.x = this.x > tx + TILE / 2 ? tx + TILE + rr : tx - rr;
                        this.vx = 0;
                    } else {
                        if (delta > 0) this.y = ty - rr;
                        else if (delta < 0) this.y = ty + TILE + rr;
                        else this.y = this.y > ty + TILE / 2 ? ty + TILE + rr : ty - rr;
                        this.vy = 0;
                    }
                }
            }
        }

        /* Lưới sinh ngẫu nhiên vẫn có thể tạo ra ngách một ô; nếu vì lý do gì đó
           bé lọt hẳn vào trong đá thì tìm ô nước gần nhất mà đẩy ra, để không
           bao giờ có chuyện đứng im chịu trận tới hết giờ. */
        unstick(level) {
            if (!solidAt(level, this.x, this.y)) return;
            const c = Math.floor(this.x / TILE), r = Math.floor(this.y / TILE);
            for (let rad = 1; rad <= 5; rad++) {
                for (let dr = -rad; dr <= rad; dr++) {
                    for (let dc = -rad; dc <= rad; dc++) {
                        if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue;
                        const nc = c + dc, nr = r + dr;
                        if (nc < 0 || nr < 0 || nc >= level.cols || nr >= level.rows) continue;
                        if (level.grid[nr * level.cols + nc] !== T_WATER) continue;
                        this.x = (nc + 0.5) * TILE;
                        this.y = (nr + 0.5) * TILE;
                        this.vx = this.vy = 0;
                        return;
                    }
                }
            }
        }

        addScore(n, kind, silent) {
            const before = Math.floor(this.score);
            this.score = Math.max(0, this.score + n);
            if (!silent && n > 0 && Math.floor(this.score) !== before) {
                floatText(this.x, this.y - 30, '+' + Math.round(n), this.style.color);
            }
        }

        bumpCombo() {
            this.combo++;
            this.comboT = COMBO_WINDOW * (this.buffs.combo > 0 ? 2 : 1);
            if (this.combo > this.bestCombo) this.bestCombo = this.combo;
            if (this.mult >= COMBO_MAX_MULT && Store.award('combo5')) toast('🏅 New achievement: Combo Master!');
        }

        pickUp(level) {
            const magnet = this.buffs.magnet > 0 ? 170 : 34;
            const lists = [level.pickups, G.drops];
            for (const list of lists) {
                for (const p of list) {
                    if (!p.alive) continue;
                    const d = dist(this.x, this.y, p.x, p.y);
                    if (d < magnet && d > this.r + p.r * 0.6 && this.buffs.magnet > 0) {
                        // Nam châm kéo vật phẩm về phía bé
                        const a = Math.atan2(this.y - p.y, this.x - p.x);
                        p.x += Math.cos(a) * 260 * (1 - d / magnet) * 0.016;
                        p.y += Math.sin(a) * 260 * (1 - d / magnet) * 0.016;
                    }
                    if (d < this.r + p.r) this.collect(p, level);
                }
            }

            for (const pod of level.powerPods) {
                if (!pod.alive) continue;
                if (dist(this.x, this.y, pod.x, pod.y) < this.r + pod.r) this.takePower(pod);
            }
            for (const pod of level.mountPods) {
                if (!pod.alive) continue;
                if (dist(this.x, this.y, pod.x, pod.y) < this.r + pod.r) this.takeMount(pod);
            }
        }

        collect(p, level) {
            p.alive = false;
            const base = SCORE[p.kind] || 10;

            if (p.kind === 'chest') {
                this.stats.chests++;
                this.stats.treasures++;
                audio.chest();
                this.addScore(base * this.mult);
                this.bumpCombo();
                floatText(p.x, p.y - 24, 'TREASURE CHEST!', '#ffd76b');
                // Rương bật ra một tràng tiền vàng
                for (let i = 0; i < 8; i++) {
                    const a = rnd(0, 6.28), s = rnd(90, 240);
                    const d = makePickup('coin', p.x, p.y, false);
                    d.loose = true; d.vx = Math.cos(a) * s; d.vy = Math.sin(a) * s; d.life = 14;
                    G.drops.push(d);
                }
                G.shake = Math.max(G.shake, 8);
                spawnBurst(p.x, p.y, '#ffd76b', 22);
                if (this.stats.chests >= 3 && Store.award('chest3')) toast('🏅 New achievement: Chest Hunter!');
            } else if (p.kind === 'gem') {
                this.stats.gems++;
                this.stats.treasures++;
                audio.gem();
                this.addScore(base * this.mult);
                this.bumpCombo();
                spawnBurst(p.x, p.y, '#a98bff', 16);
            } else if (p.kind === 'coin') {
                this.stats.coins++;
                audio.coin();
                this.addScore(base * this.mult);
                this.bumpCombo();
                spawnBurst(p.x, p.y, '#ffd76b', 7);
            } else {
                this.stats.pearls++;
                audio.pearl(this.combo);
                this.addScore(base * this.mult);
                this.bumpCombo();
                spawnBurst(p.x, p.y, '#bff4ff', 5);
            }

            checkObjective(this, level);
        }

        takePower(pod) {
            pod.alive = false;
            pod.respawn = 14;
            const type = pod.type;
            audio.power();
            spawnBurst(pod.x, pod.y, '#4ef2b0', 14);
            if (type === 'time') {
                G.time = Math.min(G.matchTime, G.time + 10);
                floatText(this.x, this.y - 30, '+10 SECONDS!', '#4ef2b0');
            } else {
                this.buffs[type] = POWERS[type].dur;
                floatText(this.x, this.y - 30, POWERS[type].emoji + ' ' + POWERS[type].name, '#4ef2b0');
            }
        }

        takeMount(pod) {
            pod.alive = false;
            pod.respawn = 16;
            this.mount = pod.type;
            this.mountT = MOUNTS[pod.type].dur;
            this.stats.rides++;
            this.addScore(SCORE.ride * this.mult);
            this.ridden[pod.type] = true;
            Store.data.mounted[pod.type] = true;
            Store.save();
            audio.mount();
            spawnBurst(pod.x, pod.y, '#35e0ff', 18);
            floatText(this.x, this.y - 32, MOUNTS[pod.type].note, '#35e0ff');
            if (Object.keys(Store.data.mounted).length >= MOUNT_KEYS.length && Store.award('rider')) {
                toast('🏅 New achievement: Sea Rider!');
            }
            checkObjective(this, G.level);
        }

        shootInk() {
            for (let i = 0; i < 3; i++) {
                G.particles.push({
                    x: this.x, y: this.y,
                    vx: this.face * rnd(120, 240), vy: rnd(-60, 60),
                    life: 2.6, t: 0, color: 'rgba(20,10,40,0.75)', size: rnd(26, 46), ink: true
                });
            }
            // Bé nào bơi ngay phía trước thì bị mực che mắt
            G.players.forEach(o => {
                if (o === this) return;
                if (dist(o.x, o.y, this.x, this.y) < 180 && (o.x - this.x) * this.face > 0) {
                    o.blind = Math.max(o.blind, 3);
                    floatText(o.x, o.y - 28, 'INKED!', '#a98bff');
                }
            });
        }

        pufferPush() {
            G.players.forEach(o => {
                if (o === this) return;
                const d = dist(o.x, o.y, this.x, this.y);
                if (d < 130) {
                    const a = Math.atan2(o.y - this.y, o.x - this.x);
                    o.vx += Math.cos(a) * 520;
                    o.vy += Math.sin(a) * 520;
                    o.combo = 0;
                    floatText(o.x, o.y - 28, 'BLASTED!', '#ff8fa3');
                }
            });
            spawnBurst(this.x, this.y, '#ffd76b', 18);
        }

        checkCave(level) {
            const c = Math.floor(this.x / TILE), r = Math.floor(this.y / TILE);
            if (c < 0 || r < 0 || c >= level.cols || r >= level.rows) return;
            if (!level.secret[r * level.cols + c]) return;
            // Đứng trong khu bí mật: nhận công cho hang gần nhất chưa ai tìm ra
            let best = null, bd = Infinity;
            for (const cave of level.caves) {
                if (cave.found) continue;
                const d = dist(this.x, this.y, cave.x, cave.y);
                if (d < bd) { bd = d; best = cave; }
            }
            if (!best || bd > TILE * 7) return;
            best.found = true;
            best.finder = this.index;
            best.glow = 1.6;
            this.stats.caves++;
            this.addScore(SCORE.cave * this.mult);
            this.bumpCombo();
            audio.cave();
            G.shake = Math.max(G.shake, 6);
            floatText(this.x, this.y - 34, '🕳️ HANG BÍ MẬT! +' + SCORE.cave, '#ffd76b');
            showEvent('🕳️ ' + this.style.name + ' FIND A HIDDEN CAVE!');
            if (this.stats.caves >= 2 && Store.award('cave2')) toast('🏅 New achievement: Explorer!');
            checkObjective(this, level);
        }

        hit(h) {
            if (this.invuln > 0 || this.stun > 0) return;
            const meta = h.meta;
            const m = this.mount ? MOUNTS[this.mount] : null;

            if (m && m.invuln) {
                floatText(this.x, this.y - 28, '🐢 SHELL BLOCKED IT!', '#4ef2b0');
                this.invuln = 0.5;
                return;
            }
            if (this.buffs.shield > 0) {
                floatText(this.x, this.y - 28, '🛡️ SHIELD HELD!', '#4ef2b0');
                this.invuln = 0.6;
                spawnBurst(this.x, this.y, '#4ef2b0', 12);
                return;
            }
            if (this.buffs.bubble > 0) {
                this.buffs.bubble = 0;
                this.invuln = 1;
                floatText(this.x, this.y - 28, '🎈 POP!', '#ffd76b');
                spawnBurst(this.x, this.y, '#ffd76b', 14);
                return;
            }

            this.stats.hits++;
            this.invuln = 1.1;
            this.hurtFlash = 0.5;
            this.combo = 0;
            this.comboT = 0;
            audio.hurt();
            G.shake = Math.max(G.shake, 7);

            if (meta.pen) {
                this.score = Math.max(0, this.score - meta.pen);
                floatText(this.x, this.y - 30, '-' + meta.pen, '#ff7676');
            }
            if (meta.stun) { this.stun = meta.stun; audio.stun(); }
            if (meta.slow) this.slow = meta.slow;
            if (meta.blind) this.blind = meta.blind;
            if (meta.trap) {
                this.trap = meta.trap;
                floatText(this.x, this.y - 44, '🐚 CLAMPED!', '#ff7676');
            }
            if (meta.knock) {
                const a = Math.atan2(this.y - h.y, this.x - h.x);
                this.vx += Math.cos(a) * meta.knock;
                this.vy += Math.sin(a) * meta.knock;
            }
            if (meta.drop) this.dropTreasure();
            if (this.mount) {
                floatText(this.x, this.y - 40, MOUNTS[this.mount].emoji + ' chạy mất!', '#ff7676');
                this.mount = null;
            }
            spawnBurst(this.x, this.y, '#ff7676', 14);
        }

        /* Bị đớp mạnh thì rơi mất một ít kho báu — ai nhanh chân nhặt lại được */
        dropTreasure() {
            const drop = Math.min(4, Math.floor(this.score / 60));
            if (drop <= 0) return;
            this.score = Math.max(0, this.score - drop * SCORE.pearl);
            for (let i = 0; i < drop; i++) {
                const a = rnd(0, 6.28), s = rnd(120, 250);
                const d = makePickup('pearl', this.x, this.y, false);
                d.loose = true; d.vx = Math.cos(a) * s; d.vy = Math.sin(a) * s; d.life = 12;
                G.drops.push(d);
            }
            floatText(this.x, this.y - 44, 'DROPPED SOME TREASURE!', '#ff7676');
        }
    }

    /* =====================================================
       9. BẪY & SINH VẬT NGUY HIỂM
       ===================================================== */

    function updateHazards(dt, level) {
        for (const h of level.hazards) {
            if (!h.alive) continue;
            h.t += dt;
            const meta = h.meta;

            switch (meta.move) {
                case 'drift':
                    // Sứa trôi bồng bềnh theo hình sin
                    h.x += Math.cos(h.angle) * meta.speed * dt;
                    h.y += (Math.sin(h.t * 1.6) * 26 - 8) * dt;
                    if (solidAt(level, h.x + Math.cos(h.angle) * 20, h.y)) h.angle = Math.PI - h.angle;
                    break;

                case 'patrol':
                    h.x += h.vx * dt;
                    h.y += h.vy * dt;
                    if (solidAt(level, h.x + Math.sign(h.vx) * 22, h.y)) h.vx *= -1;
                    if (solidAt(level, h.x, h.y + Math.sign(h.vy) * 22)) h.vy *= -1;
                    if (dist(h.x, h.y, h.home.x, h.home.y) > TILE * 5) {
                        const a = Math.atan2(h.home.y - h.y, h.home.x - h.x);
                        h.vx = Math.cos(a) * meta.speed;
                        h.vy = Math.sin(a) * meta.speed;
                    }
                    break;

                case 'chase': {
                    // Cua chỉ đuổi khi bé lại gần tổ của nó
                    const p = nearestPlayer(h.x, h.y);
                    if (p && dist(p.x, p.y, h.x, h.y) < meta.range) {
                        const a = Math.atan2(p.y - h.y, p.x - h.x);
                        h.x += Math.cos(a) * meta.speed * dt;
                        h.y += Math.sin(a) * meta.speed * dt;
                    } else {
                        const a = Math.atan2(h.home.y - h.y, h.home.x - h.x);
                        if (dist(h.x, h.y, h.home.x, h.home.y) > 6) {
                            h.x += Math.cos(a) * meta.speed * 0.5 * dt;
                            h.y += Math.sin(a) * meta.speed * 0.5 * dt;
                        }
                    }
                    break;
                }

                case 'hunt': {
                    /* Cá mập luôn nhắm vào bé đang bơi nhanh nhất — bé nào ham
                       lướt liên tục là bị để ý ngay. */
                    let target = null, bestScore = -1;
                    G.players.forEach(p => {
                        const sp = Math.hypot(p.vx, p.vy);
                        const d = dist(p.x, p.y, h.x, h.y);
                        const s = sp - d * 0.35;
                        if (s > bestScore) { bestScore = s; target = p; }
                    });
                    if (target) {
                        h.target = target.index;
                        const a = Math.atan2(target.y - h.y, target.x - h.x);
                        const speed = meta.speed * (G.time < 20 ? 1.25 : 1);
                        h.x += Math.cos(a) * speed * dt;
                        h.y += Math.sin(a) * speed * dt;
                        h.angle = a;
                        if (dist(target.x, target.y, h.x, h.y) < 240) {
                            target.sharkTime += dt;
                            if (target.sharkTime > 10 && Store.award('sharkRun')) toast('🏅 New achievement: Shark Dodger!');
                        }
                    }
                    // Cá mập bơi xuyên đá cho khỏi kẹt, nhưng bị đẩy ra khỏi tường
                    if (solidAt(level, h.x, h.y)) {
                        h.x += Math.cos(h.angle) * meta.speed * dt * 1.5;
                        h.y += Math.sin(h.angle) * meta.speed * dt * 1.5;
                    }
                    break;
                }

                case 'fall':
                    // Đá rơi: chờ một nhịp rồi lao xuống, chạm đáy thì về trần
                    if (h.wait > 0) { h.wait -= dt; break; }
                    h.y += meta.speed * dt;
                    if (solidAt(level, h.x, h.y + 18) || h.y > level.h - 20) {
                        spawnBurst(h.x, h.y, '#b08968', 10);
                        h.y = h.ceil;
                        h.wait = rnd(1.4, 3.4);
                    }
                    break;
            }

            h.x = clamp(h.x, 20, level.w - 20);
            h.y = clamp(h.y, 20, level.h - 20);

            // Mực nhả mực theo chu kỳ
            if (h.kind === 'octo' && h.t % 3 < dt) {
                G.particles.push({
                    x: h.x, y: h.y, vx: rnd(-40, 40), vy: rnd(-30, 10),
                    life: 3.2, t: 0, color: 'rgba(20,10,40,0.6)', size: rnd(30, 52), ink: true
                });
            }

            for (const p of G.players) {
                if (dist(p.x, p.y, h.x, h.y) < p.r + h.r) {
                    p.hit(h);
                    if (h.kind === 'mine') {
                        h.alive = false;
                        spawnBurst(h.x, h.y, '#ff8b3d', 30);
                        G.shake = Math.max(G.shake, 14);
                        audio.noise(0.4, 0.24, 220);
                    }
                }
            }
        }
    }

    function nearestPlayer(x, y) {
        let best = null, bd = Infinity;
        for (const p of G.players) {
            const d = dist2(p.x, p.y, x, y);
            if (d < bd) { bd = d; best = p; }
        }
        return best;
    }

    /* Ô này còn nằm trong phòng bí mật chưa ai tìm ra? Dùng cho cả việc vẽ đá
       che lấp lẫn việc giấu kho báu bên trong. */
    function isHidden(level, x, y) {
        const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
        if (c < 0 || r < 0 || c >= level.cols || r >= level.rows) return false;
        const i = r * level.cols + c;
        if (!level.fog[i]) return false;
        const cave = level.caves[level.caveOfCell[i]];
        return !!cave && !cave.found;
    }

    function solidAt(level, x, y) {
        const c = Math.floor(x / TILE), r = Math.floor(y / TILE);
        if (c < 0 || r < 0 || c >= level.cols || r >= level.rows) return true;
        return level.grid[r * level.cols + c] !== T_WATER;
    }

    function breakCoral(level, i, c, r) {
        level.grid[i] = T_WATER;
        audio.noise(0.18, 0.12, 700);
        spawnBurst((c + 0.5) * TILE, (r + 0.5) * TILE, '#ff8fa3', 12);
        G.shake = Math.max(G.shake, 4);
    }

    /* =====================================================
       10. SỰ KIỆN NGẪU NHIÊN
       ===================================================== */

    function updateEvents(dt, level) {
        G.eventTimer -= dt;
        if (G.eventTimer <= 0 && G.time > 6) {
            triggerEvent(level);
            G.eventTimer = rnd(13, 21);
        }

        if (G.eventData) {
            G.eventData.t -= dt;
            const e = G.eventData;

            if (G.event === 'whale' || G.event === 'fishSchool') {
                e.x += e.vx * dt;
                if (G.event === 'whale') {
                    // Ai chạm vào cá voi thì được nó hất đi một đoạn thật xa
                    G.players.forEach(p => {
                        if (Math.abs(p.x - e.x) < 90 && Math.abs(p.y - e.y) < 60) {
                            p.vx += e.vx * 0.9 * dt * 8;
                            p.vy -= 90 * dt * 8;
                        }
                    });
                }
            }

            if (G.event === 'kraken') {
                e.strikeT -= dt;
                if (e.strikeT <= 0) {
                    e.strikeT = 0.9;
                    const arm = { x: rnd(0, level.w), y: rnd(0, level.h), t: 0 };
                    e.arms.push(arm);
                    audio.noise(0.3, 0.16, 180);
                    G.shake = Math.max(G.shake, 8);
                }
                e.arms.forEach(a => {
                    a.t += dt;
                    if (a.t > 0.45 && a.t < 0.75) {
                        G.players.forEach(p => {
                            if (dist(p.x, p.y, a.x, a.y) < 70) p.hit({ x: a.x, y: a.y, meta: { pen: 40, stun: 0.8, knock: 320 } });
                        });
                    }
                });
                e.arms = e.arms.filter(a => a.t < 1.4);
            }

            if (e.t <= 0) {
                if (G.event === 'reverse') G.currentFlip = 1;
                if (G.event === 'darkness') G.darkBoost = 0;
                G.event = null;
                G.eventData = null;
            }
        }
    }

    function triggerEvent(level) {
        const kind = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        G.event = kind;
        audio.event();

        switch (kind) {
            case 'whale':
                G.eventData = { t: 9, x: -160, y: rnd(level.h * 0.2, level.h * 0.8), vx: level.w / 8.5 };
                showEvent('🐋 A GIANT WHALE SWIMS BY!');
                break;

            case 'treasureRain': {
                showEvent('🪙 TREASURE RAIN!');
                const n = 26 + G.playerCount * 6;
                for (let i = 0; i < n; i++) {
                    const kind2 = Math.random() < 0.25 ? 'coin' : 'pearl';
                    const d = makePickup(kind2, rnd(TILE * 2, level.w - TILE * 2), rnd(TILE, TILE * 3), false);
                    d.loose = true; d.vx = rnd(-40, 40); d.vy = rnd(40, 120); d.life = 18;
                    G.drops.push(d);
                }
                G.eventData = { t: 6 };
                break;
            }

            case 'bigBubble':
                G.eventData = { t: 5 };
                showEvent('🫧 A HUGE BUBBLE LIFTS EVERYONE UP!');
                break;

            case 'reverse':
                G.currentFlip = -1;
                G.eventData = { t: 8 };
                showEvent('🔄 THE CURRENTS REVERSE!');
                break;

            case 'darkness':
                G.darkBoost = 0.8;
                G.eventData = { t: 6 };
                showEvent('🌑 THE SEA GOES DARK!');
                break;

            case 'fishSchool':
                G.eventData = {
                    t: 8, x: -200, y: rnd(level.h * 0.15, level.h * 0.85), vx: level.w / 7,
                    fish: Array.from({ length: 26 }, () => ({ ox: rnd(-160, 160), oy: rnd(-90, 90), ph: rnd(0, 6.3) }))
                };
                showEvent('🐟 A FISH SCHOOL BLOCKS YOUR VIEW!');
                break;

            case 'kraken':
                G.eventData = { t: 7, strikeT: 0.5, arms: [] };
                showEvent('🦑 THE KRAKEN IS SMASHING EVERYWHERE!');
                break;
        }
    }

    /* =====================================================
       11. MỤC TIÊU PHỤ
       ===================================================== */

    function checkObjective(player, level) {
        const o = level && level.objective;
        if (!o || o.done) return;
        if (player.stats[o.track] >= o.need) {
            o.done = true;
            o.winner = player.index;
            player.addScore(SCORE.objective * player.mult);
            audio.power();
            showEvent('🎯 ' + player.style.name + ' XONG NHIỆM VỤ! +' + SCORE.objective);
        }
    }

    /* =====================================================
       12. HIỆU ỨNG NHỎ
       ===================================================== */

    const rnd = (a, b) => a + Math.random() * (b - a);

    function spawnParticle(x, y, vx, vy, color, size, life) {
        G.particles.push({ x, y, vx, vy, color, size, life, t: 0 });
    }

    function spawnBurst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = rnd(0, 6.28), s = rnd(40, 210);
            spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, color, rnd(2, 6), rnd(0.3, 0.8));
        }
    }

    function floatText(x, y, text, color) {
        G.texts.push({ x, y, text, color, life: 1.1, t: 0 });
    }

    function updateEffects(dt, level) {
        for (let i = G.particles.length - 1; i >= 0; i--) {
            const p = G.particles[i];
            p.t += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.94;
            p.vy = p.vy * 0.94 - (p.ink ? 0 : 14 * dt);
            if (p.t >= p.life) G.particles.splice(i, 1);
        }
        for (let i = G.texts.length - 1; i >= 0; i--) {
            const t = G.texts[i];
            t.t += dt;
            t.y -= 34 * dt;
            if (t.t >= t.life) G.texts.splice(i, 1);
        }
        for (let i = G.bubbles.length - 1; i >= 0; i--) {
            const b = G.bubbles[i];
            b.t += dt;
            b.y += b.vy * dt;
            b.x += Math.sin(b.t * 4) * 8 * dt;
            if (b.t >= b.life) G.bubbles.splice(i, 1);
        }
        // Cột bọt mọc lên từ đáy biển
        for (const em of level.bubblers) {
            em.t -= dt;
            if (em.t <= 0) {
                em.t = rnd(0.3, 1.1);
                G.bubbles.push({ x: em.x + rnd(-6, 6), y: em.y, r: rnd(2, 6), vy: -rnd(30, 70), life: rnd(1.4, 2.6), t: 0, emoji: null });
            }
        }
        // Vật phẩm rơi tự do rồi nằm yên
        for (let i = G.drops.length - 1; i >= 0; i--) {
            const d = G.drops[i];
            if (!d.alive) { G.drops.splice(i, 1); continue; }
            d.life -= dt;
            if (d.life <= 0) { G.drops.splice(i, 1); continue; }
            d.vy += 120 * dt;
            d.vx *= 0.97;
            d.vy *= 0.97;
            const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
            if (!solidAt(level, nx, d.y)) d.x = nx; else d.vx *= -0.4;
            if (!solidAt(level, d.x, ny)) d.y = ny; else { d.vy *= -0.3; d.vx *= 0.8; }
            d.x = clamp(d.x, 12, level.w - 12);
            d.y = clamp(d.y, 12, level.h - 12);
        }
        // Bảo bối và cá cưỡi mọc lại sau một lúc
        [].concat(level.powerPods, level.mountPods).forEach(pod => {
            if (pod.alive) { pod.t += dt; return; }
            pod.respawn -= dt;
            if (pod.respawn <= 0) {
                pod.alive = true;
                if (pod.type in POWERS) pod.type = POWER_KEYS[Math.floor(Math.random() * POWER_KEYS.length)];
                else pod.type = MOUNT_KEYS[Math.floor(Math.random() * MOUNT_KEYS.length)];
            }
        });
        for (const c of level.caves) if (c.glow > 0) c.glow -= dt;
        for (const f of level.fields) f.t += dt;
        if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);
    }

    /* =====================================================
       13. MÀN HÌNH & MÁY QUAY
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
        if (darkCanvas) { darkCanvas.width = w; darkCanvas.height = h; }
    }

    /* Máy quay ôm trọn tất cả các bé: bé nào cũng luôn nhìn thấy được, và khi
       cả nhà bơi sát nhau thì tự phóng to lại cho rõ mặt. */
    function updateCamera(dt, level) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of G.players) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        }
        if (!isFinite(minX)) { minX = maxX = level.w / 2; minY = maxY = level.h / 2; }

        const bw = (maxX - minX) + 460;
        const bh = (maxY - minY) + 380;
        const fitAll = Math.min(viewW / level.w, viewH / level.h);
        const want = clamp(Math.min(viewW / bw, viewH / bh), Math.max(fitAll, 0.28), 1.25);

        const cam = G.camera;
        cam.zoom = lerp(cam.zoom, want, Math.min(1, dt * 3.2));

        const tx = (minX + maxX) / 2, ty = (minY + maxY) / 2;
        cam.x = lerp(cam.x, tx, Math.min(1, dt * 6));
        cam.y = lerp(cam.y, ty, Math.min(1, dt * 6));

        // Không để lộ vùng ngoài bản đồ, trừ khi bản đồ nhỏ hơn khung nhìn
        const halfW = viewW / (2 * cam.zoom), halfH = viewH / (2 * cam.zoom);
        cam.x = halfW * 2 >= level.w ? level.w / 2 : clamp(cam.x, halfW, level.w - halfW);
        cam.y = halfH * 2 >= level.h ? level.h / 2 : clamp(cam.y, halfH, level.h - halfH);
    }

    const toScreenX = x => (x - G.camera.x) * G.camera.zoom + viewW / 2;
    const toScreenY = y => (y - G.camera.y) * G.camera.zoom + viewH / 2;

    /* =====================================================
       14. VẼ
       ===================================================== */

    function draw() {
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, viewW, viewH);

        const level = G.level;
        if (!level) { drawIdleSea(); return; }
        const pal = level.world.palette;

        drawBackdrop(pal, level);

        const cam = G.camera;
        const shakeX = G.shake ? (Math.random() - 0.5) * G.shake : 0;
        const shakeY = G.shake ? (Math.random() - 0.5) * G.shake : 0;

        ctx.save();
        ctx.translate(viewW / 2 + shakeX, viewH / 2 + shakeY);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-cam.x, -cam.y);

        drawFields(level);
        drawTiles(level, pal);
        drawPlants(level, pal);
        drawRuins(level, pal);
        drawCaves(level);
        drawPickups(level);
        drawPods(level);
        drawDrops();
        drawHazards(level);
        drawBubbles();
        drawParticles();
        drawPlayers();
        drawEventLayer(level);
        drawRadar();
        drawTexts();

        ctx.restore();

        drawDarkness(level);
    }

    function drawIdleSea() {
        const g = ctx.createLinearGradient(0, 0, 0, viewH);
        g.addColorStop(0, '#0a6e96');
        g.addColorStop(1, '#03253d');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, viewW, viewH);
    }

    /* Nền nhiều lớp trôi chậm hơn máy quay -> cảm giác chiều sâu */
    function drawBackdrop(pal, level) {
        const g = ctx.createLinearGradient(0, 0, 0, viewH);
        g.addColorStop(0, pal.mid);
        g.addColorStop(0.55, pal.deep);
        g.addColorStop(1, '#01060f');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, viewW, viewH);

        const t = performance.now() / 1000;

        // Tia nắng xuyên nước
        ctx.save();
        ctx.globalAlpha = 0.13;
        ctx.fillStyle = pal.top;
        for (let i = 0; i < 7; i++) {
            const x = ((i * 260 - G.camera.x * 0.25) % (viewW + 520)) - 260;
            const sway = Math.sin(t * 0.4 + i) * 34;
            ctx.beginPath();
            ctx.moveTo(x + sway, -40);
            ctx.lineTo(x + 90 + sway, -40);
            ctx.lineTo(x + 220 + sway * 2, viewH + 40);
            ctx.lineTo(x + 30 + sway * 2, viewH + 40);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Bóng núi đá xa xa
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = pal.rock;
        const off = -G.camera.x * 0.12;
        ctx.beginPath();
        ctx.moveTo(-100, viewH);
        for (let i = 0; i <= 12; i++) {
            const x = -100 + i * ((viewW + 200) / 12) + (off % 200);
            const h = viewH * (0.55 + 0.22 * Math.sin(i * 1.7));
            ctx.lineTo(x, h);
        }
        ctx.lineTo(viewW + 100, viewH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawTiles(level, pal) {
        const cam = G.camera;
        const halfW = viewW / (2 * cam.zoom), halfH = viewH / (2 * cam.zoom);
        const c0 = clamp(Math.floor((cam.x - halfW) / TILE) - 1, 0, level.cols - 1);
        const c1 = clamp(Math.ceil((cam.x + halfW) / TILE) + 1, 0, level.cols - 1);
        const r0 = clamp(Math.floor((cam.y - halfH) / TILE) - 1, 0, level.rows - 1);
        const r1 = clamp(Math.ceil((cam.y + halfH) / TILE) + 1, 0, level.rows - 1);

        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const i = r * level.cols + c;
                let t = level.grid[i];
                const x = c * TILE, y = r * TILE;

                // Lòng phòng bí mật chưa ai vào: vẽ như một khối đá đặc
                if (level.fog[i]) {
                    const cave = level.caves[level.caveOfCell[i]];
                    if (cave && !cave.found) t = T_ROCK;
                }
                if (t === T_WATER) continue;

                if (t === T_CORAL) {
                    // Tường san hô: màu tươi, nhìn là biết phá được
                    ctx.fillStyle = pal.accent;
                    roundRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 9);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.22)';
                    roundRect(ctx, x + 5, y + 4, TILE - 10, 7, 4);
                    ctx.fill();
                    drawEmoji(ctx, '🪸', x + TILE / 2, y + TILE / 2, TILE * 0.62, 0.85);
                    continue;
                }

                ctx.fillStyle = pal.rock;
                roundRect(ctx, x, y, TILE, TILE, 7);
                ctx.fill();

                // Viền sáng ở mặt trên khi phía trên là nước
                if (r > 0 && level.grid[i - level.cols] === T_WATER) {
                    ctx.fillStyle = pal.rockLit;
                    roundRect(ctx, x + 1, y, TILE - 2, TILE * 0.28, 6);
                    ctx.fill();
                }
                // Vài đốm rêu cho đỡ phẳng
                if (((c * 7 + r * 13) % 11) === 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.07)';
                    ctx.beginPath();
                    ctx.arc(x + TILE * 0.66, y + TILE * 0.68, TILE * 0.15, 0, 6.28);
                    ctx.fill();
                }
            }
        }
    }

    function drawFields(level) {
        const t = performance.now() / 1000;
        for (const f of level.fields) {
            ctx.save();
            if (f.kind === 'current') {
                ctx.globalAlpha = 0.14;
                ctx.fillStyle = '#8fe8ff';
                ctx.fillRect(f.x, f.y, f.w, f.h);
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = 'rgba(180,240,255,0.55)';
                ctx.lineWidth = 2.5;
                const dirX = Math.sign(f.fx) * G.currentFlip, dirY = Math.sign(f.fy) * G.currentFlip;
                const span = f.fx ? f.w : f.h;
                for (let k = 0; k < 22; k++) {
                    const prog = ((k / 22) + (t * 0.22 * (dirX || dirY))) % 1;
                    const px = f.fx ? f.x + prog * span : f.x + f.w * (0.25 + 0.5 * ((k * 37) % 10) / 10);
                    const py = f.fx ? f.y + f.h * (0.2 + 0.6 * ((k * 53) % 10) / 10) : f.y + prog * span;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + (dirX * 22), py + (dirY * 22));
                    ctx.stroke();
                }
            } else if (f.kind === 'whirl') {
                ctx.globalAlpha = 0.3;
                for (let k = 0; k < 3; k++) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(160,230,255,0.6)';
                    ctx.lineWidth = 3;
                    const rr = f.r * (0.35 + k * 0.3);
                    ctx.arc(f.x, f.y, rr, t * f.spin * (1 + k) + k, t * f.spin * (1 + k) + k + 4.2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                drawEmoji(ctx, '🌀', f.x, f.y, f.r * 0.9, 0.8);
            } else if (f.kind === 'vent') {
                ctx.globalAlpha = 0.22;
                const grd = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.r);
                grd.addColorStop(0, 'rgba(255,180,90,0.9)');
                grd.addColorStop(1, 'rgba(255,120,40,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill();
                ctx.globalAlpha = 1;
                drawEmoji(ctx, '♨️', f.x, f.y + f.r * 0.35, 26, 0.9);
            } else if (f.kind === 'cold') {
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = '#9fd8ff';
                ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill();
                ctx.globalAlpha = 0.85;
                drawEmoji(ctx, '❄️', f.x, f.y, 24, 0.7);
            } else if (f.kind === 'jet') {
                ctx.globalAlpha = 0.25;
                ctx.fillStyle = '#bff4ff';
                ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.28); ctx.fill();
                ctx.globalAlpha = 1;
                drawEmoji(ctx, '💨', f.x, f.y, 26, 0.9);
            }
            ctx.restore();
        }
    }

    function drawPlants(level, pal) {
        const t = performance.now() / 1000;
        ctx.save();
        for (const pl of level.plants) {
            const sway = Math.sin(t * 1.3 + pl.phase) * 9;
            if (pl.kind === 'fan') {
                ctx.fillStyle = pal.accent;
                ctx.globalAlpha = 0.75;
                ctx.beginPath();
                ctx.ellipse(pl.x + sway * 0.4, pl.y - pl.h * 0.5, pl.w * 1.6, pl.h * 0.5, sway * 0.02, 0, 6.28);
                ctx.fill();
            } else {
                ctx.strokeStyle = pal.plant;
                ctx.globalAlpha = 0.85;
                ctx.lineWidth = pl.w;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(pl.x, pl.y);
                ctx.quadraticCurveTo(pl.x + sway, pl.y - pl.h * 0.6, pl.x + sway * 1.8, pl.y - pl.h);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    function drawRuins(level, pal) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        for (const ru of level.ruins) {
            ctx.save();
            ctx.translate(ru.x, ru.y);
            ctx.rotate(ru.rot);
            ctx.scale(ru.s, ru.s);
            ctx.fillStyle = pal.rockLit;
            if (ru.kind === 0) {
                ctx.fillRect(-9, -34, 18, 68);
                ctx.fillRect(-16, -40, 32, 9);
            } else if (ru.kind === 1) {
                ctx.fillRect(-30, -8, 60, 12);
                ctx.fillRect(-24, 4, 10, 26);
                ctx.fillRect(14, 4, 10, 26);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, 22, Math.PI, 0);
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.restore();
    }

    function drawCaves(level) {
        for (const c of level.caves) {
            if (c.found) {
                ctx.save();
                ctx.globalAlpha = 0.35 + (c.glow > 0 ? 0.4 : 0);
                const grd = ctx.createRadialGradient(c.x, c.y, 6, c.x, c.y, 90);
                grd.addColorStop(0, 'rgba(255,215,107,0.5)');
                grd.addColorStop(1, 'rgba(255,215,107,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(c.x, c.y, 90, 0, 6.28); ctx.fill();
                ctx.restore();
                drawEmoji(ctx, '🕳️', c.x, c.y, 26, 0.8);
            }
        }
    }

    const PICK_EMOJI = { pearl: '🫧', coin: '🪙', gem: '💎', chest: '🧰' };

    function drawPickups(level) {
        const t = performance.now() / 1000;
        for (const p of level.pickups) {
            if (!p.alive) continue;
            if (p.inSecret && isHidden(level, p.x, p.y)) continue;
            const bob = Math.sin(t * 2 + p.t) * 4;
            const size = p.kind === 'chest' ? 40 : (p.kind === 'gem' ? 30 : (p.kind === 'coin' ? 26 : 21));
            if (p.kind === 'gem' || p.kind === 'chest') {
                ctx.save();
                ctx.globalAlpha = 0.35;
                const grd = ctx.createRadialGradient(p.x, p.y + bob, 2, p.x, p.y + bob, size);
                grd.addColorStop(0, p.kind === 'gem' ? 'rgba(169,139,255,0.8)' : 'rgba(255,215,107,0.8)');
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(p.x, p.y + bob, size, 0, 6.28); ctx.fill();
                ctx.restore();
            }
            drawEmoji(ctx, PICK_EMOJI[p.kind], p.x, p.y + bob, size);
        }
    }

    function drawDrops() {
        for (const d of G.drops) {
            if (!d.alive) continue;
            const flash = d.life < 3 && Math.floor(d.life * 8) % 2 === 0 ? 0.4 : 1;
            drawEmoji(ctx, PICK_EMOJI[d.kind], d.x, d.y, d.kind === 'coin' ? 24 : 19, flash);
        }
    }

    function drawPods(level) {
        const t = performance.now() / 1000;
        for (const pod of level.powerPods) {
            if (!pod.alive) continue;
            if (isHidden(level, pod.x, pod.y)) continue;
            const bob = Math.sin(t * 2.4 + pod.t) * 5;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#4ef2b0';
            ctx.beginPath(); ctx.arc(pod.x, pod.y + bob, 24, 0, 6.28); ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = 'rgba(190,255,235,0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(pod.x, pod.y + bob, 21, 0, 6.28); ctx.stroke();
            ctx.restore();
            drawEmoji(ctx, POWERS[pod.type].emoji, pod.x, pod.y + bob, 26);
        }
        for (const pod of level.mountPods) {
            if (!pod.alive) continue;
            if (isHidden(level, pod.x, pod.y)) continue;
            const bob = Math.sin(t * 1.7 + pod.t) * 6;
            ctx.save();
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = '#35e0ff';
            ctx.beginPath(); ctx.ellipse(pod.x, pod.y + bob, 34, 22, 0, 0, 6.28); ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.translate(pod.x, pod.y + bob);
            ctx.scale(pod.dir, 1);
            drawEmoji(ctx, MOUNTS[pod.type].emoji, 0, 0, 40);
            ctx.restore();
        }
    }

    function drawHazards(level) {
        const t = performance.now() / 1000;
        for (const h of level.hazards) {
            if (!h.alive) continue;
            if (isHidden(level, h.x, h.y)) continue;
            const size = h.r * 2.1;
            if (h.kind === 'seaweed') {
                ctx.save();
                ctx.globalAlpha = 0.75;
                ctx.strokeStyle = '#2fa36a';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                for (let k = -1; k <= 1; k++) {
                    ctx.beginPath();
                    ctx.moveTo(h.x + k * 10, h.y + 26);
                    ctx.quadraticCurveTo(h.x + k * 10 + Math.sin(t * 2 + k) * 12, h.y, h.x + k * 12, h.y - 26);
                    ctx.stroke();
                }
                ctx.restore();
                continue;
            }
            if (h.kind === 'shark') {
                ctx.save();
                ctx.translate(h.x, h.y);
                ctx.scale(Math.cos(h.angle) < 0 ? -1 : 1, 1);
                drawEmoji(ctx, '🦈', 0, 0, 62);
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
            drawEmoji(ctx, h.meta.emoji, h.x, h.y + Math.sin(t * 2 + h.t) * 3, size);
        }
    }

    function drawBubbles() {
        ctx.save();
        for (const b of G.bubbles) {
            const a = 1 - b.t / b.life;
            if (b.emoji) {
                drawEmoji(ctx, b.emoji, b.x, b.y, 16, a * 0.9);
            } else {
                ctx.globalAlpha = a * 0.5;
                ctx.strokeStyle = 'rgba(220,250,255,0.9)';
                ctx.lineWidth = 1.4;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.stroke();
            }
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
        ctx.font = '800 19px "Baloo 2", sans-serif';
        for (const t of G.texts) {
            const a = 1 - t.t / t.life;
            ctx.globalAlpha = a;
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0,20,35,0.8)';
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.restore();
    }

    function drawPlayers() {
        const t = performance.now() / 1000;
        for (const p of G.players) {
            ctx.save();
            ctx.translate(p.x, p.y);

            // Vòng sáng màu của bé để giữa 4 bé không ai nhầm mình là ai
            ctx.save();
            ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t * 3 + p.index);
            ctx.strokeStyle = p.style.color;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, p.r + 9, 0, 6.28); ctx.stroke();
            ctx.restore();

            if (p.buffs.shield > 0 || p.buffs.bubble > 0) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = p.buffs.shield > 0 ? '#4ef2b0' : '#ffd76b';
                ctx.beginPath(); ctx.arc(0, 0, p.r + 17, 0, 6.28); ctx.fill();
                ctx.restore();
            }

            ctx.rotate(p.tilt * p.face);
            ctx.scale(p.face, 1);

            if (p.mount) drawEmoji(ctx, MOUNTS[p.mount].emoji, -6, 10, 52);

            const squish = 1 + Math.sin(p.stroke) * 0.07;
            ctx.save();
            ctx.scale(1 / squish, squish);
            if (p.hurtFlash > 0 && Math.floor(p.hurtFlash * 12) % 2 === 0) ctx.globalAlpha = 0.45;
            if (p.invuln > 0 && p.hurtFlash <= 0) ctx.globalAlpha = 0.75;
            drawEmoji(ctx, p.skin, 0, 0, 38);
            const hat = p.hat;
            if (hat) drawEmoji(ctx, hat, 0, -22, 22);
            ctx.restore();

            ctx.restore();

            // Trạng thái xấu hiện ngay trên đầu cho dễ hiểu
            let icon = null;
            if (p.trap > 0) icon = '🐚';
            else if (p.stun > 0) icon = '💫';
            else if (p.slow > 0) icon = '🐌';
            else if (p.blind > 0) icon = '🌑';
            if (icon) drawEmoji(ctx, icon, p.x, p.y - 36, 24);

            // Bị mực: quầng tối bám quanh bé đó
            if (p.blind > 0) {
                ctx.save();
                ctx.globalAlpha = Math.min(0.72, p.blind * 0.3);
                const grd = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 150);
                grd.addColorStop(0, 'rgba(10,4,24,0.95)');
                grd.addColorStop(1, 'rgba(10,4,24,0)');
                ctx.fillStyle = grd;
                ctx.beginPath(); ctx.arc(p.x, p.y, 150, 0, 6.28); ctx.fill();
                ctx.restore();
            }

            // Thanh hồi chiêu lướt
            if (p.dashCd > 0) {
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                ctx.fillRect(p.x - 16, p.y + 24, 32, 4);
                ctx.fillStyle = p.style.color;
                ctx.fillRect(p.x - 16, p.y + 24, 32 * (1 - p.dashCd / DASH_CD), 4);
                ctx.restore();
            }
        }
    }

    /* Ra-đa: chỉ đường tới rương và đá quý gần nhất */
    function drawRadar() {
        for (const p of G.players) {
            if (p.buffs.radar <= 0) continue;
            const targets = G.level.pickups
                .filter(x => x.alive && (x.kind === 'chest' || x.kind === 'gem') && !isHidden(G.level, x.x, x.y))
                .sort((a, b) => dist2(a.x, a.y, p.x, p.y) - dist2(b.x, b.y, p.x, p.y))
                .slice(0, 3);
            ctx.save();
            for (const tg of targets) {
                const a = Math.atan2(tg.y - p.y, tg.x - p.x);
                ctx.globalAlpha = 0.75;
                ctx.strokeStyle = p.style.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(p.x + Math.cos(a) * 34, p.y + Math.sin(a) * 34);
                ctx.lineTo(p.x + Math.cos(a) * 58, p.y + Math.sin(a) * 58);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    function drawEventLayer(level) {
        const e = G.eventData;
        if (!e) return;
        if (G.event === 'whale') {
            drawEmoji(ctx, '🐋', e.x, e.y, 190, 0.95);
        } else if (G.event === 'fishSchool') {
            const t = performance.now() / 1000;
            for (const f of e.fish) {
                drawEmoji(ctx, '🐟', e.x + f.ox, e.y + f.oy + Math.sin(t * 3 + f.ph) * 16, 30, 0.9);
            }
        } else if (G.event === 'kraken') {
            for (const a of e.arms) {
                const grow = clamp(a.t / 0.45, 0, 1);
                ctx.save();
                ctx.globalAlpha = a.t < 0.45 ? 0.5 : (a.t < 0.75 ? 1 : Math.max(0, 1 - (a.t - 0.75) / 0.65));
                if (a.t < 0.45) {
                    ctx.strokeStyle = '#ff5d3d';
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(a.x, a.y, 70 * grow, 0, 6.28); ctx.stroke();
                } else {
                    drawEmoji(ctx, '🦑', a.x, a.y, 120);
                }
                ctx.restore();
            }
        } else if (G.event === 'bigBubble') {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = '#bff4ff';
            ctx.lineWidth = 3;
            for (let i = 0; i < 16; i++) {
                const x = (i * 173 + (performance.now() / 12)) % level.w;
                const y = level.h - ((performance.now() / 6 + i * 220) % level.h);
                ctx.beginPath(); ctx.arc(x, y, 22 + (i % 4) * 9, 0, 6.28); ctx.stroke();
            }
            ctx.restore();
        }
    }

    /* Bóng tối vẽ trên một canvas phụ rồi khoét lỗ quanh từng bé; làm trực tiếp
       trên canvas chính sẽ khoét thủng cả khung hình. */
    function drawDarkness(level) {
        const darkness = clamp(level.world.dark + G.darkBoost, 0, 0.94);
        if (darkness < 0.03) return;
        if (!darkCanvas) {
            darkCanvas = document.createElement('canvas');
            darkCtx = darkCanvas.getContext('2d');
        }
        if (darkCanvas.width !== viewW || darkCanvas.height !== viewH) {
            darkCanvas.width = viewW;
            darkCanvas.height = viewH;
        }
        const d = darkCtx;
        d.setTransform(1, 0, 0, 1, 0, 0);
        d.clearRect(0, 0, viewW, viewH);
        d.fillStyle = 'rgba(1,6,14,' + darkness + ')';
        d.fillRect(0, 0, viewW, viewH);
        d.globalCompositeOperation = 'destination-out';
        for (const p of G.players) {
            const sx = toScreenX(p.x), sy = toScreenY(p.y);
            const rad = (p.buffs.radar > 0 ? 320 : 210) * G.camera.zoom;
            const grd = d.createRadialGradient(sx, sy, rad * 0.18, sx, sy, rad);
            grd.addColorStop(0, 'rgba(0,0,0,1)');
            grd.addColorStop(0.65, 'rgba(0,0,0,0.75)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            d.fillStyle = grd;
            d.beginPath(); d.arc(sx, sy, rad, 0, 6.28); d.fill();
        }
        // Miệng phun núi lửa cũng hắt sáng
        for (const f of level.fields) {
            if (f.kind !== 'vent') continue;
            const sx = toScreenX(f.x), sy = toScreenY(f.y);
            const rad = f.r * 1.6 * G.camera.zoom;
            const grd = d.createRadialGradient(sx, sy, 2, sx, sy, rad);
            grd.addColorStop(0, 'rgba(0,0,0,0.8)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            d.fillStyle = grd;
            d.beginPath(); d.arc(sx, sy, rad, 0, 6.28); d.fill();
        }
        d.globalCompositeOperation = 'source-over';
        ctx.drawImage(darkCanvas, 0, 0);
    }

    function roundRect(c, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        c.beginPath();
        c.moveTo(x + rr, y);
        c.arcTo(x + w, y, x + w, y + h, rr);
        c.arcTo(x + w, y + h, x, y + h, rr);
        c.arcTo(x, y + h, x, y, rr);
        c.arcTo(x, y, x + w, y, rr);
        c.closePath();
    }

    /* =====================================================
       15. HUD
       ===================================================== */

    const el = {};
    let hudTimer = 0;

    /* i18n dịch DOM qua MutationObserver. Nếu cứ 100ms lại ghi đè chuỗi tiếng
       Việt vào một ô chữ thì trên bản tiếng Anh nó bị dịch đi dịch lại liên tục
       -> chữ nhấp nháy Việt/Anh, nhìn như giật. Vì vậy: dịch sẵn tại đây rồi
       chỉ ghi khi nội dung thật sự đổi. */
    function tr(s) {
        if (window.KibuI18n && window.KibuI18n.t) {
            try { return window.KibuI18n.t(s); } catch (e) { return s; }
        }
        return s;
    }

    function setText(node, str) {
        if (!node) return;
        const out = tr(str);
        if (node.textContent !== out) node.textContent = out;
    }

    function cacheDom() {
        [
            'hud-world', 'hud-objective', 'hud-timer', 'hud-clock', 'hud-lead-name',
            'event-banner', 'event-text', 'player-cards', 'countdown-overlay', 'countdown-text',
            'modal-start', 'modal-help', 'modal-collection', 'modal-end', 'toast',
            'world-grid', 'count-row', 'mode-row', 'time-row', 'setup-hint', 'world-section',
            'rank-list', 'award-row', 'end-title', 'end-sub', 'end-emoji', 'unlock-toast',
            'btn-next-round', 'total-score', 'worlds-open', 'help-controls',
            'tab-skins', 'tab-hats', 'tab-achv', 'touch-controls', 'joystick-zone',
            'joystick-knob', 'dash-btn'
        ].forEach(id => { el[id] = document.getElementById(id); });
    }

    function buildPlayerCards() {
        const box = el['player-cards'];
        box.innerHTML = '';
        G.players.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pcard';
            card.style.setProperty('--pc', p.style.color);
            card.style.setProperty('--pcGlow', 'rgba(' + p.style.glow + ',0.55)');
            card.innerHTML =
                '<div class="pcard-head"><span class="pcard-emoji">' + p.skin + '</span>' +
                '<span>' + p.style.name + '</span></div>' +
                '<div class="pcard-score">0</div>' +
                '<div class="pcard-row"><span class="combo-tag" hidden>x1</span><span class="pcard-buffs"></span></div>' +
                '<div class="pcard-state"></div>';
            box.appendChild(card);
            p.dom = {
                card,
                score: card.querySelector('.pcard-score'),
                combo: card.querySelector('.combo-tag'),
                buffs: card.querySelector('.pcard-buffs'),
                state: card.querySelector('.pcard-state')
            };
        });
    }

    function updateHud(dt) {
        hudTimer -= dt;
        if (hudTimer > 0) return;
        hudTimer = 0.1;                       // 10 lần/giây là đủ mượt mắt

        const secs = Math.max(0, Math.ceil(G.time));
        const clock = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
        if (el['hud-timer'].textContent !== clock) el['hud-timer'].textContent = clock;
        el['hud-clock'].classList.toggle('hurry', secs <= 20 && G.state === 'PLAYING');

        let lead = null;
        G.players.forEach(p => { if (!lead || p.score > lead.score) lead = p; });
        if (lead) {
            setText(el['hud-lead-name'], lead.style.name);
            el['hud-lead-name'].style.color = lead.style.color;
        }

        G.players.forEach(p => {
            if (!p.dom) return;
            const sc = Math.floor(p.score).toLocaleString('vi-VN');
            if (p.dom.score.textContent !== sc) p.dom.score.textContent = sc;

            const m = p.mult;
            p.dom.combo.hidden = m <= 1;
            const cb = 'x' + m;
            if (p.dom.combo.textContent !== cb) p.dom.combo.textContent = cb;
            p.dom.card.classList.toggle('leader', p === lead && G.playerCount > 1);

            let buffs = '';
            for (const k in p.buffs) if (p.buffs[k] > 0) buffs += POWERS[k].emoji;
            if (p.mount) buffs += MOUNTS[p.mount].emoji;
            if (p.dom.buffs.textContent !== buffs) p.dom.buffs.textContent = buffs;

            let state = '';
            if (p.trap > 0) state = 'Trapped!';
            else if (p.stun > 0) state = 'Dizzy!';
            else if (p.slow > 0) state = 'Slowed';
            else if (p.blind > 0) state = 'Inked';
            setText(p.dom.state, state);
        });
    }

    let eventTimeout = null;
    function showEvent(text) {
        el['event-text'].textContent = text;
        el['event-banner'].classList.add('show');
        clearTimeout(eventTimeout);
        eventTimeout = setTimeout(() => el['event-banner'].classList.remove('show'), 3200);
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
       16. VÒNG ĐỜI TRẬN ĐẤU
       ===================================================== */

    function worldForRound(round) {
        if (G.mode !== 'tournament') return G.worldIdx;
        const open = Store.unlockedWorlds();
        return (G.worldIdx + round) % Math.max(1, open);
    }

    function startMatch() {
        const wi = worldForRound(G.round);
        const world = WORLDS[clamp(wi, 0, WORLDS.length - 1)];

        // Thử Thách Hôm Nay: mọi người cùng ngày nhận đúng một bản đồ
        const seed = G.mode === 'daily'
            ? hashStr('kibu-ocean-' + todayKey())
            : (G.seedBase + G.round * 7919 + Math.floor(Math.random() * 1e9)) >>> 0;
        const rng = makeRng(seed);

        G.level = generateLevel(world, rng, G.playerCount);
        G.time = G.matchTime;
        G.particles.length = 0;
        G.texts.length = 0;
        G.bubbles.length = 0;
        G.drops.length = 0;
        G.event = null;
        G.eventData = null;
        G.eventTimer = rnd(10, 16);
        G.darkBoost = 0;
        G.currentFlip = 1;
        G.shake = 0;

        const slots = SLOTS[G.playerCount] || SLOTS[1];
        G.players = slots.map((slot, i) => new Player(i, slot, G.level.spawns[i] || G.level.spawns[0]));

        G.camera.x = G.players[0].x;
        G.camera.y = G.players[0].y;
        G.camera.zoom = 0.8;

        el['hud-world'].textContent = world.name + (G.mode === 'tournament' ? ' — MÀN ' + (G.round + 1) + '/' + G.rounds : '');
        el['hud-objective'].textContent = G.level.objective.text;

        buildPlayerCards();
        closeAllModals();

        G.state = 'COUNTDOWN';
        G.countdown = 3.2;
        el['countdown-overlay'].classList.add('show');
        audio.init();
        audio.startMusic();
    }

    function endMatch() {
        G.state = 'END';
        audio.stopMusic();
        audio.fanfare();

        const ranked = G.players.slice().sort((a, b) => b.score - a.score);

        // Cộng dồn cho chế độ giải đấu
        G.players.forEach(p => {
            G.totals[p.index] = (G.totals[p.index] || 0) + Math.floor(p.score);
        });

        // Điểm của bé 1 mới tính vào hồ sơ mở khoá — hồ sơ là của máy này
        const before = Store.data.total;
        Store.addScore(G.players[0].score);
        const world = G.level.world;
        Store.data.best[world.id] = Math.max(Store.data.best[world.id] || 0, Math.floor(G.players[0].score));
        if (G.mode === 'daily') {
            Store.data.daily = { day: todayKey(), score: Math.floor(G.players[0].score) };
            Store.award('daily');
        }
        Store.save();

        // Thành tích
        const p0 = G.players[0];
        Store.award('firstDive');
        if (p0.score >= 1500) Store.award('score1500');
        if (p0.score >= 3000) Store.award('score3000');
        if (p0.stats.hits === 0) Store.award('untouched');
        if (Store.unlockedWorlds() >= WORLDS.length) Store.award('atlantis');

        renderResults(ranked, before);
        el['modal-end'].classList.add('active');
    }

    function renderResults(ranked, scoreBefore) {
        const medals = ['🥇', '🥈', '🥉', '🏅'];
        const list = el['rank-list'];
        list.innerHTML = '';

        const useTotals = G.mode === 'tournament' && G.round + 1 >= G.rounds;
        const rows = useTotals
            ? G.players.slice().sort((a, b) => (G.totals[b.index] || 0) - (G.totals[a.index] || 0))
            : ranked;

        rows.forEach((p, i) => {
            const row = document.createElement('div');
            row.className = 'rank-row' + (i === 0 ? ' first' : '');
            row.style.setProperty('--pc', p.style.color);
            row.style.animationDelay = (i * 0.12) + 's';
            const shown = useTotals ? (G.totals[p.index] || 0) : Math.floor(p.score);
            row.innerHTML =
                '<div class="rank-medal' + (i === 0 ? ' dance' : '') + '">' + medals[Math.min(i, 3)] + '</div>' +
                '<div class="rank-face">' + p.skin + '</div>' +
                '<div class="rank-info">' +
                '<div class="rank-name">' + p.style.name + '</div>' +
                '<div class="rank-detail">🧰 ' + p.stats.chests + ' rương · 💎 ' + p.stats.gems +
                ' đá quý · 🕳️ ' + p.stats.caves + ' hang · 🔥 chuỗi ' + p.bestCombo + '</div>' +
                '</div>' +
                '<div class="rank-score">' + shown.toLocaleString('vi-VN') + '</div>';
            list.appendChild(row);
        });

        // Danh hiệu phụ cho vui
        const awards = [];
        const best = (fn) => G.players.slice().sort((a, b) => fn(b) - fn(a))[0];
        const t = best(p => p.stats.treasures);
        if (t && t.stats.treasures > 0) awards.push('🧰 Săn kho báu giỏi nhất: ' + t.style.name);
        const c = best(p => p.bestCombo);
        if (c && c.bestCombo >= 4) awards.push('🔥 Longest streak: ' + c.style.name + ' (' + c.bestCombo + ')');
        const r = best(p => p.stats.rides);
        if (r && r.stats.rides > 0) awards.push('🐬 Nài cá cừ nhất: ' + r.style.name);
        const ca = best(p => p.stats.caves);
        if (ca && ca.stats.caves > 0) awards.push('🕳️ Explorer: ' + ca.style.name);
        const h = G.players.slice().sort((a, b) => a.stats.hits - b.stats.hits)[0];
        if (h && h.stats.hits === 0 && G.playerCount > 1) awards.push('🛡️ Không dính bẫy nào: ' + h.style.name);

        el['award-row'].innerHTML = awards.map(a => '<span class="award-chip">' + a + '</span>').join('');

        const champ = rows[0];
        el['end-emoji'].textContent = G.playerCount === 1 ? '🐠' : '🏆';
        el['end-title'].textContent = G.playerCount === 1
            ? 'OUT OF TIME!'
            : champ.style.name + ' VÔ ĐỊCH!';
        el['end-sub'].textContent = G.playerCount === 1
            ? 'Bé gom được ' + Math.floor(champ.score).toLocaleString('vi-VN') + ' điểm kho báu!'
            : 'Give it up for the champion of the deep!';

        // Vừa mở khoá được gì mới?
        const opened = [];
        const after = Store.data.total;
        WORLDS.forEach(w => { if (scoreBefore < w.unlock && after >= w.unlock) opened.push(w.emoji + ' ' + w.name); });
        SKINS.forEach(s => { if (s.req && scoreBefore < s.req && after >= s.req) opened.push(s.emoji + ' ' + s.name); });
        HATS.forEach(s => { if (s.req && scoreBefore < s.req && after >= s.req) opened.push(s.emoji + ' ' + s.name); });
        TRAILS.forEach(s => { if (s.req && scoreBefore < s.req && after >= s.req) opened.push(s.emoji + ' ' + s.name); });
        const ut = el['unlock-toast'];
        if (opened.length) {
            ut.hidden = false;
            ut.textContent = '🎁 Vừa mở khoá: ' + opened.join(' · ');
        } else {
            ut.hidden = true;
        }

        el['btn-next-round'].hidden = !(G.mode === 'tournament' && G.round + 1 < G.rounds);
    }

    function closeAllModals() {
        ['modal-start', 'modal-help', 'modal-collection', 'modal-end'].forEach(id => {
            if (el[id]) el[id].classList.remove('active');
        });
    }

    function backToMenu() {
        G.state = 'MENU';
        G.round = 0;
        G.totals = [];
        audio.stopMusic();
        closeAllModals();
        el['modal-start'].classList.add('active');
        el['countdown-overlay'].classList.remove('show');
        refreshMenu();
    }

    /* =====================================================
       17. VÒNG LẶP CHÍNH
       ===================================================== */

    let lastTime = 0;

    function loop(ts) {
        const dt = Math.min(0.05, lastTime ? (ts - lastTime) / 1000 : 0.016);
        lastTime = ts;

        try {
            if (G.state === 'COUNTDOWN') {
                G.countdown -= dt;
                const n = Math.ceil(G.countdown - 0.2);
                el['countdown-text'].textContent = n > 0 ? String(n) : 'LẶN!';
                if (n !== lastCount) {
                    lastCount = n;
                    audio.beep(n <= 0);
                }
                if (G.countdown <= 0) {
                    G.state = 'PLAYING';
                    el['countdown-overlay'].classList.remove('show');
                }
                updateCamera(dt, G.level);
                updateEffects(dt, G.level);
            } else if (G.state === 'PLAYING') {
                G.time -= dt;
                audio.setTension(G.time <= 20);
                for (const p of G.players) p.update(dt, G.level);
                updateHazards(dt, G.level);
                updateEvents(dt, G.level);
                updateEffects(dt, G.level);
                updateCamera(dt, G.level);
                if (G.time <= 0) { G.time = 0; endMatch(); }
            } else if (G.state === 'END' && G.level) {
                updateEffects(dt, G.level);
                updateCamera(dt, G.level);
            }

            if (G.state !== 'MENU') updateHud(dt);
            draw();
        } catch (err) {
            console.error('Ocean Party loop error:', err);
        }

        requestAnimationFrame(loop);
    }

    let lastCount = null;

    /* =====================================================
       18. NHẬP LIỆU
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

        // ----- Cảm ứng -----
        const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
            window.matchMedia('(pointer: coarse)').matches;
        if (isTouch) {
            document.body.classList.add('is-touch');
            el['touch-controls'].style.display = 'block';
        }

        const zone = el['joystick-zone'], knob = el['joystick-knob'], dash = el['dash-btn'];
        let joyId = null, dashId = null;

        const findTouch = (list, id) => {
            for (let i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
            return null;
        };

        zone.addEventListener('touchstart', e => {
            e.preventDefault();
            if (joyId !== null) return;
            joyId = e.changedTouches[0].identifier;
            touch.active = true;
            audio.init();
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (joyId === null) return;
            const t = findTouch(e.touches, joyId);
            if (!t) return;
            const rect = zone.getBoundingClientRect();
            const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
            const max = rect.width / 2 - 18;
            let dx = t.clientX - cx, dy = t.clientY - cy;
            const len = Math.hypot(dx, dy) || 1;
            const cl = Math.min(len, max);
            dx = dx / len * cl; dy = dy / len * cl;
            knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            touch.dx = dx / max;
            touch.dy = dy / max;
        }, { passive: true });

        function endTouch(e) {
            if (joyId !== null && findTouch(e.changedTouches, joyId)) {
                joyId = null;
                touch.active = false;
                touch.dx = touch.dy = 0;
                knob.style.transform = 'translate(0,0)';
            }
            if (dashId !== null && findTouch(e.changedTouches, dashId)) {
                dashId = null;
                touch.dash = false;
            }
        }
        window.addEventListener('touchend', endTouch);
        window.addEventListener('touchcancel', endTouch);

        dash.addEventListener('touchstart', e => {
            e.preventDefault();
            dashId = e.changedTouches[0].identifier;
            touch.dash = true;
            touch.active = true;
            audio.init();
        }, { passive: false });

        // Chuột trên máy tính bảng lai: bấm nút lướt vẫn chạy
        dash.addEventListener('mousedown', () => { touch.dash = true; touch.active = true; });
        window.addEventListener('mouseup', () => { touch.dash = false; });
    }

    /* =====================================================
       19. CÁC BẢNG CHỌN
       ===================================================== */

    function buildWorldGrid() {
        const grid = el['world-grid'];
        grid.innerHTML = '';
        const open = Store.unlockedWorlds();
        WORLDS.forEach((w, i) => {
            const locked = i >= open;
            const card = document.createElement('div');
            card.className = 'world-card' + (i === G.worldIdx && !locked ? ' active' : '') + (locked ? ' locked' : '');
            card.dataset.world = i;
            card.innerHTML =
                '<div class="world-emoji">' + w.emoji + '</div>' +
                '<div class="world-label">' + w.name + '</div>' +
                '<div class="world-diff">' + '★'.repeat(Math.min(5, Math.ceil(w.diff * 5 / 7))) + '</div>' +
                (locked ? '<div class="world-lock">🔒<span>' + w.unlock.toLocaleString('vi-VN') + '</span></div>' : '');
            if (!locked) {
                card.addEventListener('click', () => {
                    G.worldIdx = i;
                    buildWorldGrid();
                    audio.beep(true);
                });
            }
            grid.appendChild(card);
        });
    }

    function refreshMenu() {
        buildWorldGrid();
        el['total-score'].textContent = Store.data.total.toLocaleString('vi-VN');
        el['worlds-open'].textContent = Store.unlockedWorlds();

        const slots = SLOTS[G.playerCount] || SLOTS[1];
        // Gợi ý phím: chip ngắn thay vì một dòng chữ dài, điện thoại không vỡ dòng
        el['setup-hint'].innerHTML = slots.map((s, i) =>
            '<span class="hint-chip"><b>' + PLAYER_STYLE[i].name + '</b>' +
            CONTROLS[s].label.split(/\s+/).map(k => '<span class="kbd">' + k + '</span>').join('') +
            '<span class="kbd">' + CONTROLS[s].dashLabel + '</span></span>'
        ).join('');

        el['world-section'].style.display = G.mode === 'daily' ? 'none' : '';
        const done = Store.data.daily.day === todayKey();
        if (G.mode === 'daily' && done) {
            toast('📅 Hôm nay bé đã chơi rồi: ' + Store.data.daily.score + ' điểm. Chơi lại vẫn được nhé!');
        }
    }

    function buildCollection() {
        const mk = (list, kind, equippedId) => list.map(item => {
            const owned = Store.data.total >= item.req;
            const eq = item.id === equippedId;
            return '<div class="unlock-item ' + (owned ? 'owned' : 'locked') + (eq ? ' equipped' : '') +
                '" data-kind="' + kind + '" data-id="' + item.id + '">' +
                '<div class="unlock-emoji">' + (owned ? item.emoji : '🔒') + '</div>' +
                '<div class="unlock-name">' + item.name + '</div>' +
                '<div class="unlock-req">' + (owned ? (eq ? 'In use' : 'Tap to use') : item.req + 'score') + '</div>' +
                '</div>';
        }).join('');

        el['tab-skins'].innerHTML = mk(SKINS, 'skin', Store.data.equipped.skin);
        el['tab-hats'].innerHTML = mk(HATS, 'hat', Store.data.equipped.hat) + mk(TRAILS, 'trail', Store.data.equipped.trail);

        el['tab-achv'].innerHTML = ACHIEVEMENTS.map(a => {
            const done = !!Store.data.achv[a.id];
            return '<div class="achv-item' + (done ? ' done' : '') + '">' +
                '<div class="achv-emoji">' + (done ? a.emoji : '🔒') + '</div>' +
                '<div><div class="achv-name">' + a.name + '</div>' +
                '<div class="achv-desc">' + a.desc + '</div></div></div>';
        }).join('');

        el['total-score'].textContent = Store.data.total.toLocaleString('vi-VN');
        el['worlds-open'].textContent = Store.unlockedWorlds();

        el['modal-collection'].querySelectorAll('.unlock-item.owned').forEach(node => {
            node.addEventListener('click', () => {
                Store.data.equipped[node.dataset.kind] = node.dataset.id;
                Store.save();
                audio.power();
                buildCollection();
            });
        });
    }

    function buildHelp() {
        // Chip phím thay cho câu chữ: nhìn phát biết ngay, và tự xuống dòng gọn
        // trên điện thoại thay vì thành một đoạn văn dài.
        el['help-controls'].innerHTML = SLOTS[4].map((s, i) => {
            const c = CONTROLS[s];
            const keys = c.label.split(/\s+/).map(k => '<span class="kbd">' + k + '</span>').join('');
            return '<div class="key-line"><span class="who">' + PLAYER_STYLE[i].name + '</span>' + keys +
                '<span class="kbd">' + c.dashLabel + '</span></div>';
        }).join('') + '<div class="key-line"><span class="who">📱</span>' +
            '<span class="kbd">joystick</span><span class="kbd">⚡</span></div>';
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
            onPick(btn.dataset[attr], btn);
        });
    }

    function setupMenu() {
        pillGroup('count-row', 'count', v => { G.playerCount = +v; refreshMenu(); });
        pillGroup('time-row', 'time', v => { G.matchTime = +v; });
        pillGroup('mode-row', 'mode', v => {
            G.mode = v;
            G.rounds = v === 'tournament' ? 3 : 1;
            if (v === 'daily') G.matchTime = 120;
            refreshMenu();
        });

        document.getElementById('btn-start-dive').addEventListener('click', () => {
            audio.init();
            G.round = 0;
            G.totals = [];
            G.seedBase = (Math.random() * 1e9) >>> 0;
            if (G.mode === 'daily') {
                // Bản đồ trong ngày do ngày quyết định, kể cả vùng biển
                const open = Store.unlockedWorlds();
                G.worldIdx = hashStr(todayKey()) % Math.max(1, open);
            }
            startMatch();
        });

        const openHelp = () => { buildHelp(); el['modal-help'].classList.add('active'); };
        const openCollection = () => { buildCollection(); el['modal-collection'].classList.add('active'); };
        document.getElementById('btn-help').addEventListener('click', openHelp);
        document.getElementById('btn-help-2').addEventListener('click', openHelp);
        document.getElementById('btn-collection-2').addEventListener('click', openCollection);
        document.getElementById('btn-close-help').addEventListener('click', () => {
            el['modal-help'].classList.remove('active');
        });

        document.getElementById('btn-collection').addEventListener('click', openCollection);
        document.getElementById('btn-close-collection').addEventListener('click', () => {
            el['modal-collection'].classList.remove('active');
            refreshMenu();
        });

        el['modal-collection'].querySelector('.collection-tabs').addEventListener('click', e => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;
            el['modal-collection'].querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            el['tab-skins'].hidden = btn.dataset.tab !== 'skins';
            el['tab-hats'].hidden = btn.dataset.tab !== 'hats';
            el['tab-achv'].hidden = btn.dataset.tab !== 'achv';
        });

        document.getElementById('btn-menu-nav').addEventListener('click', backToMenu);
        document.getElementById('btn-menu-dive').addEventListener('click', backToMenu);
        document.getElementById('btn-replay').addEventListener('click', () => {
            G.round = 0;
            G.totals = [];
            startMatch();
        });
        document.getElementById('btn-next-round').addEventListener('click', () => {
            G.round++;
            startMatch();
        });

        const btnSound = document.getElementById('btn-sound');
        btnSound.addEventListener('click', () => {
            audio.enabled = !audio.enabled;
            Store.data.sound = audio.enabled;
            Store.save();
            const icon = document.getElementById('sound-icon');
            icon.className = audio.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            btnSound.classList.toggle('muted', !audio.enabled);
            if (!audio.enabled) audio.stopMusic();
            else if (G.state === 'PLAYING' || G.state === 'COUNTDOWN') { audio.init(); audio.startMusic(); }
        });
        if (!Store.data.sound) {
            audio.enabled = false;
            document.getElementById('sound-icon').className = 'fa-solid fa-volume-xmark';
            btnSound.classList.add('muted');
        }
    }

    /* =====================================================
       20. KHỞI ĐỘNG
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
