/* =========================================================
   BASKETBALL DUEL — Song đấu bóng rổ 2 người trên cùng 1 máy
   Người chơi 1: phím A (hoặc chạm/kéo nửa TRÁI màn hình)
   Người chơi 2: phím L (hoặc chạm/kéo nửa PHẢI màn hình)

   Vật lý dựng theo kích thước thật của sân bóng rổ:
   vành rổ cao 3,05m, đường kính vành 0,45m, bóng 0,24m.
   ========================================================= */
(() => {
    'use strict';

    // ---------- Quy đổi tỉ lệ thật ----------
    const PPM = 114;                      // 1 mét = 114 pixel
    const M = m => m * PPM;

    const CH = 600, H = CH;
    const FLOOR_Y = 545;

    const G = 9.81 * PPM;                 // trọng lực thật (≈1118 px/s²)

    // Bóng và vành được phóng to 1,28 lần so với thi đấu chuyên nghiệp — kiểu bộ rổ
    // mini trong nhà: nhìn rõ hơn nhiều mà TỈ LỆ bóng/vành vẫn giữ đúng như thật.
    const SIZE_UP = 1.28;
    const BALL_R = M(0.12 * SIZE_UP);     // bóng ø0,31m (thi đấu: ø0,24m)
    const RIM_D = M(0.45 * SIZE_UP);      // vành ø0,58m (thi đấu: ø0,45m)

    const BOARD_X = 78;                                 // mặt trước bảng rổ
    const BOARD_TOP = FLOOR_Y - M(3.95);                // mép trên bảng
    const BOARD_BOT = FLOOR_Y - M(2.90);                // mép dưới bảng
    const RIM_Y = FLOOR_Y - M(3.05);                    // vành rổ cao 3,05m
    const RIM_X1 = BOARD_X + M(0.15);                   // vành cách bảng 0,15m
    const RIM_X2 = RIM_X1 + RIM_D;
    const RIM_CX = (RIM_X1 + RIM_X2) / 2;

    // Điểm rời tay phải nằm trong TẦM VỚI thật của cánh tay (vai cao 1,18m,
    // tay dài 0,56m) — nếu đặt cao hơn thì IK sẽ kéo bàn tay và quả bóng tụt
    // xuống trong khi mũi tên vẫn vẽ ở đây, thành ra lệch nhau.
    const REL_Y = FLOOR_Y - M(1.76);      // độ cao điểm rời tay
    const REL_DX = -M(0.22);              // bóng rời tay hơi chếch về phía rổ

    // Càng nhiều người chơi thì mỗi sân càng hẹp, nên chỗ đứng cũng gần rổ hơn
    const LAYOUTS = {
        2: { cw: 570, near: 1.7, far: 3.3 },
        3: { cw: 520, near: 1.6, far: 2.9 },
        4: { cw: 485, near: 1.5, far: 2.6 }
    };
    // Phím của từng người chơi, trải từ trái sang phải bàn phím theo thứ tự sân
    const KEYSETS = {
        2: ['KeyA', 'KeyL'],
        3: ['KeyA', 'KeyG', 'KeyL'],
        4: ['KeyA', 'KeyF', 'KeyJ', 'KeyL']
    };

    let CW = 570, W = 1140;
    let SPOT_MIN = 0, SPOT_MAX = 0, THREE_X = 0, RACK_SPOTS = [];

    function applyLayout(n) {
        const L = LAYOUTS[n];
        CW = L.cw;
        W = CW * n;
        SPOT_MIN = RIM_CX + M(L.near);
        SPOT_MAX = RIM_CX + M(L.far);
        THREE_X = SPOT_MIN + (SPOT_MAX - SPOT_MIN) * 0.6;
        RACK_SPOTS = [0, 0.25, 0.5, 0.75, 1].map(t => SPOT_MIN + (SPOT_MAX - SPOT_MIN) * t);
    }

    // Độ nảy & ma sát (tham chiếu số liệu thật)
    const RIM_E = 0.45;                   // vành thép bọc lưới
    const BOARD_E = 0.62;                 // bảng kính cường lực
    const FLOOR_E = 0.80;                 // bóng bơm đúng chuẩn nảy ~0,8
    const MU = 0.36;                      // ma sát bề mặt
    const ALPHA = 2 / 3;                  // I/(mR²) của quả cầu RỖNG như bóng rổ
    const SPIN0 = 15.5;                   // xoáy ngược lúc rời tay (~2,5 vòng/giây)
    const SPIN_DECAY = 0.35;              // xoáy tắt dần trong không khí
    const MISS_DELAY = 0.5;               // sau cú nảy đầu tiên bao lâu thì sang lượt mới

    const ANGLE_MIN = 38 * Math.PI / 180;
    const ANGLE_MAX = 72 * Math.PI / 180;
    const POWER_MIN = 430, POWER_MAX = 950;
    const MAX_DRAG = 170;                 // kéo-thả: quãng kéo ứng với lực 100%

    // ---------- Chế độ chơi ----------
    const MODES = {
        versus: { key: 'versus', name: 'VERSUS', time: 90, icon: '⚔️' },
        three: { key: 'three', name: '3-POINT CONTEST', time: 60, icon: '🎯' },
        practice: { key: 'practice', name: 'PRACTICE', time: 0, icon: '🧘' }
    };

    // ---------- Độ khó ----------
    // post = bán kính va chạm của ống vành. Vành thật ø18mm (~1px) nên mức DỄ
    // gần đúng thật, mức khó hơn thì ống dày hơn -> cửa lọt hẹp lại.
    const DIFFS = {
        easy: { key: 'easy', name: 'EASY', sweep: 0.30, power: 1.05, post: 1.6, guide: true },
        normal: { key: 'normal', name: 'MEDIUM', sweep: 0.46, power: 1.45, post: 2.6, guide: true },
        hard: { key: 'hard', name: 'HARD', sweep: 0.64, power: 1.85, post: 3.6, guide: false },
        insane: {
            key: 'insane', name: 'INSANE', sweep: 0.72, power: 2.0, post: 3.6, guide: false,
            moveHoop: true, hoopRange: M(0.55), hoopSpeed: 0.85   // rổ trượt lên xuống
        }
    };

    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rnd = (a, b) => a + Math.random() * (b - a);

    // =========================================================
    //  Vẽ chân tay: đốt thon dần + khớp khuỷu tính bằng IK 2 đốt
    //  nên tay gập duỗi trông tự nhiên chứ không gãy khúc như que.
    // =========================================================
    const UPPER_ARM = M(0.29), FORE_ARM = M(0.27);

    // =========================================================
    //  Quả bóng rổ dựng như khối cầu da thật
    //  8 múi da ngăn bởi ba đường may là ba vòng tròn lớn vuông góc nhau,
    //  mặt da sần, có rãnh lõm quanh đường may và đốm sáng bóng.
    //  Vì nhìn ngang nên bóng chỉ xoáy quanh trục vuông góc màn hình → dựng
    //  sẵn 48 bước quay lúc khởi động, khi vẽ chỉ việc chọn đúng bước.
    // =========================================================
    const BB_TEX = 128;                   // độ phân giải ảnh bề mặt
    const BB_STEPS = 48;                  // số bước quay dựng sẵn
    const BB_SEAM = 0.042;                // nửa bề rộng đường may (bóng thật ~2% đường kính)
    const LEATHER = [216, 106, 46];       // màu da cam của quả bóng
    const SEAM_COL = [46, 22, 10];
    const BB_LIGHT = (() => {
        const v = [-0.34, -0.46, 0.82], n = Math.hypot(...v);
        return v.map(c => c / n);
    })();
    const BB_HALF = (() => {
        const v = [BB_LIGHT[0], BB_LIGHT[1], BB_LIGHT[2] + 1], n = Math.hypot(...v);
        return v.map(c => c / n);
    })();
    let ballTex = null;

    function buildBallTex() {
        // Nghiêng quả bóng một góc bất kì để ba đường may không trùng trục nhìn,
        // nhờ vậy nhìn thấy đúng dáng cong đặc trưng của quả bóng rổ.
        const ax = 0.62, ay = 0.42;
        const cx1 = Math.cos(ax), sx1 = Math.sin(ax);
        const cy1 = Math.cos(ay), sy1 = Math.sin(ay);
        // T = Ry(ay) · Rx(ax), lưu theo hàng
        const T = [
            cy1, sy1 * sx1, sy1 * cx1,
            0, cx1, -sx1,
            -sy1, cy1 * sx1, cy1 * cx1
        ];

        ballTex = [];
        for (let k = 0; k < BB_STEPS; k++) {
            const ang = k / BB_STEPS * Math.PI * 2;
            const ca = Math.cos(ang), sa = Math.sin(ang);
            const cv = document.createElement('canvas');
            cv.width = cv.height = BB_TEX;
            const cc = cv.getContext('2d');
            const img = cc.createImageData(BB_TEX, BB_TEX);
            const d = img.data;
            let p = 0;

            for (let j = 0; j < BB_TEX; j++) {
                const ny = (j + 0.5) / BB_TEX * 2 - 1;
                for (let i = 0; i < BB_TEX; i++, p += 4) {
                    const nx = (i + 0.5) / BB_TEX * 2 - 1;
                    const d2 = nx * nx + ny * ny;
                    if (d2 >= 1) { d[p + 3] = 0; continue; }
                    const nz = Math.sqrt(1 - d2);

                    // Gỡ phép xoáy quanh trục vuông góc màn hình, rồi đưa về hệ gắn với bóng
                    const rx = nx * ca + ny * sa, ry = -nx * sa + ny * ca;
                    const lx = T[0] * rx + T[1] * ry + T[2] * nz;
                    const ly = T[3] * rx + T[4] * ry + T[5] * nz;
                    const lz = T[6] * rx + T[7] * ry + T[8] * nz;

                    // Ba vòng tròn lớn vuông góc nhau chia mặt bóng thành 8 múi
                    const sd = Math.min(Math.abs(lx), Math.abs(ly), Math.abs(lz));
                    const seam = sd < BB_SEAM;
                    const groove = sd < BB_SEAM * 2.0;

                    // Da sần: nhiễu tần số cao, chỉ có trên phần da
                    const h = Math.sin(lx * 149.3 + ly * 271.9 + lz * 197.1) * 43758.5453;
                    const pebble = (h - Math.floor(h)) - 0.5;

                    let diff = nx * BB_LIGHT[0] + ny * BB_LIGHT[1] + nz * BB_LIGHT[2];
                    if (diff < 0) diff = 0;
                    let shade = 0.30 + 0.80 * diff;
                    const col = seam ? SEAM_COL : LEATHER;
                    if (!seam) {
                        shade += pebble * 0.11;               // hạt da
                        if (groove) shade *= 0.72;            // rãnh lõm quanh đường may
                    }

                    let spec = 0;
                    if (!seam) {
                        const sp = nx * BB_HALF[0] + ny * BB_HALF[1] + nz * BB_HALF[2];
                        if (sp > 0) { const s2 = sp * sp, s4 = s2 * s2, s8 = s4 * s4; spec = s8 * s4 * 60; }
                    }

                    d[p] = Math.min(255, col[0] * shade + spec);
                    d[p + 1] = Math.min(255, col[1] * shade + spec);
                    d[p + 2] = Math.min(255, col[2] * shade + spec);
                    const edge = (1 - Math.sqrt(d2)) * (BB_TEX * 0.5);
                    d[p + 3] = edge >= 1 ? 255 : edge * 255;
                }
            }
            cc.putImageData(img, 0, 0);
            ballTex.push(cv);
        }
    }

    // Một đốt chi: hình thang bo tròn hai đầu, có mảng sáng dọc theo bắp
    function limb(ctx, x1, y1, x2, y2, w1, w2, skin, shade) {
        const dx = x2 - x1, dy = y2 - y1;
        const d = Math.hypot(dx, dy) || 1;
        const nx = -dy / d, ny = dx / d;
        ctx.beginPath();
        ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
        ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
        ctx.lineTo(x2 - nx * w2, y2 - ny * w2);
        ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
        ctx.closePath();
        const g = ctx.createLinearGradient(x1 + nx * w1, y1 + ny * w1, x1 - nx * w1, y1 - ny * w1);
        g.addColorStop(0, shade);
        g.addColorStop(0.42, skin);
        g.addColorStop(1, shade);
        ctx.fillStyle = g;
        ctx.fill();
        // bo tròn hai khớp
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.arc(x1, y1, w1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y2, w2, 0, Math.PI * 2); ctx.fill();
    }

    /* Vẽ một cánh tay từ vai tới bàn tay.
       bend = +1 / -1 quyết định khuỷu tay gập về phía nào. */
    function drawArm(ctx, sx, sy, hx, hy, bend, skin, shade) {
        let dx = hx - sx, dy = hy - sy;
        let d = Math.hypot(dx, dy);
        const maxD = (UPPER_ARM + FORE_ARM) * 0.985;
        if (d > maxD) {                       // với quá xa thì duỗi thẳng hết cỡ
            const k = maxD / d;
            hx = sx + dx * k; hy = sy + dy * k;
            dx *= k; dy *= k; d = maxD;
        }
        if (d < 2) return { x: hx, y: hy };

        // Vị trí khuỷu tay: giao của hai đường tròn bán kính UPPER_ARM và FORE_ARM
        const a = (d * d + UPPER_ARM * UPPER_ARM - FORE_ARM * FORE_ARM) / (2 * d);
        const hgt = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - a * a));
        const ux = dx / d, uy = dy / d;
        const ex = sx + ux * a - uy * hgt * bend;
        const ey = sy + uy * a + ux * hgt * bend;

        limb(ctx, sx, sy, ex, ey, 7.2, 5.6, skin, shade);     // bắp tay
        limb(ctx, ex, ey, hx, hy, 5.6, 4.4, skin, shade);     // cẳng tay

        // Bàn tay: một khối tròn gọn, hơi to hơn cổ tay
        const fa = Math.atan2(hy - ey, hx - ex);
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(fa);
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(2.6, 0, 6.2, 5.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return { x: hx, y: hy };
    }

    function seeded(seed) {
        let s = seed >>> 0;
        return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }

    // ---------- Âm thanh ----------
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
        tone(freq, dur, type = 'sine', vol = 0.18, slideTo = null) {
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
        charge(t) { this.tone(320 + t * 520, 0.05, 'square', 0.05); },
        shoot() { this.tone(520, 0.16, 'triangle', 0.13, 190); this.noise(0.09, 0.05, 1500); },
        rim() { this.tone(430, 0.12, 'square', 0.1, 240); },
        board() { this.tone(240, 0.13, 'sine', 0.11, 150); },
        floor(v) { const p = clamp(v / 900, 0.1, 1); this.tone(110, 0.14, 'sine', 0.05 + p * 0.12, 62); },
        swish() { this.noise(0.3, 0.13, 2100); this.tone(880, 0.14, 'sine', 0.1, 1320); },
        score(pts) {
            const base = pts >= 3 ? 660 : 560;
            [0, 0.09, 0.18].forEach((d, i) => setTimeout(() => this.tone(base * Math.pow(1.26, i), 0.16, 'triangle', 0.16), d * 1000));
        },
        miss() { this.tone(200, 0.18, 'sawtooth', 0.07, 120); },
        fire() { this.tone(420, 0.3, 'sawtooth', 0.1, 980); },
        tick() { this.tone(880, 0.07, 'square', 0.1); },
        buzzer() { this.tone(180, 0.9, 'square', 0.2, 120); },
        cheer() { this.noise(1.1, 0.1, 300); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.34, 'triangle', 0.16), i * 130)); },
        sob() { [420, 360, 300, 250].forEach((f, i) => setTimeout(() => this.tone(f, 0.42, 'sine', 0.11, f * 0.72), i * 260)); }
    };

    // ---------- Hai người chơi ----------
    const PLAYERS = [
        { name: 'KID 1', emoji: '🐯', jersey: '#ff8a1a', jersey2: '#c4530a', skin: '#f5c396', hair: '#2b1b12', num: '1', accent: '#ffb347' },
        { name: 'KID 2', emoji: '🐼', jersey: '#00d0ff', jersey2: '#0470a0', skin: '#e8b98a', hair: '#1a1a24', num: '2', accent: '#7fe8ff' },
        { name: 'KID 3', emoji: '🐸', jersey: '#39d353', jersey2: '#177a2b', skin: '#f0c9a0', hair: '#3a2414', num: '3', accent: '#9dfba8' },
        { name: 'KID 4', emoji: '🦊', jersey: '#c77dff', jersey2: '#6f2fa8', skin: '#eec2a0', hair: '#241428', num: '4', accent: '#e0b6ff' }
    ];

    // =========================================================
    //  Quả bóng: có xoáy thật, xoáy đổi hướng nảy khi chạm vành
    // =========================================================
    class Ball {
        constructor(x, y, vx, vy, spin) {
            this.x = x; this.y = y;
            this.vx = vx; this.vy = vy;
            this.spin = spin;         // rad/s, dương = quay theo chiều kim đồng hồ trên màn hình
            this.rot = 0;
            this.trail = [];
            this.hitRim = false;
            this.hitBoard = false;
            this.scored = false;
            this.missed = false;
            this.bounces = 0;
            this.alive = true;
            this.life = 0;
            this.fire = false;
        }

        /* Va chạm với một mặt phẳng có pháp tuyến n (hướng ra khỏi mặt).
           Ngoài phản xạ theo pháp tuyến còn tính ma sát tiếp tuyến: chính nó biến
           xoáy ngược thành cú "nảy vào rổ" quen thuộc của các cú ném chuẩn. */
        bounce(nx, ny, e) {
            const vn = this.vx * nx + this.vy * ny;
            if (vn > 0) return 0;                       // đang rời xa mặt
            const tx = -ny, ty = nx;                    // tiếp tuyến
            const vt = this.vx * tx + this.vy * ty;
            const vrel = vt + this.spin * BALL_R;       // vận tốc điểm chạm so với mặt

            // Phản xạ pháp tuyến
            this.vx -= (1 + e) * vn * nx;
            this.vy -= (1 + e) * vn * ny;

            // Xung ma sát tiếp tuyến (giới hạn bởi hệ số ma sát)
            const jMax = MU * (1 + e) * Math.abs(vn);
            let jt = clamp(-vrel * ALPHA / (1 + ALPHA), -jMax, jMax);
            this.vx += jt * tx;
            this.vy += jt * ty;
            this.spin += jt / (ALPHA * BALL_R);
            return Math.abs(vn);
        }
    }

    // =========================================================
    //  Nửa sân của một người chơi
    // =========================================================
    class Court {
        constructor(idx) {
            this.idx = idx;
            this.mirror = idx % 2 === 1;      // sân lẻ lật gương -> hai rổ quay lưng vào nhau
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
            this.px = (SPOT_MIN + SPOT_MAX) / 2;
            this.rackIdx = 0;
            this.angle = ANGLE_MIN;
            this.angleDir = 1;
            this.power = 0;
            this.powerDir = 1;
            this.chargeHold = 0;
            this.chargeBeep = 0;
            this.armed = true;

            this.ball = null;
            this.popups = [];
            this.particles = [];
            this.netBulge = 0;
            this.netBulgeV = 0;
            this.rimShake = 0;
            this.bodyBob = 0;
            this.followThrough = 0;
            this.hoopFlash = 0;
            this.scorePulse = 0;
            this.hoopOff = 0;         // độ lệch cao thấp của rổ ở chế độ siêu khó
            this.hoopT = Math.random() * Math.PI * 2;
            this.outcome = null;      // 'win' | 'lose' | 'draw' khi hết trận
            this.celebT = 0;
            this.tears = [];
            this.newSpot(true);
        }

        get isThree() { return this.px >= THREE_X; }
        get rimY() { return RIM_Y + this.hoopOff; }        // cao độ vành lúc này
        get isMoneyBall() { return Game.mode === 'three' && this.rackIdx % 5 === 4; }
        get relX() { return this.px + REL_DX; }
        get relY() { return REL_Y; }
        get diff() { return DIFFS[Game.difficulty]; }

        newSpot(first) {
            if (Game.mode === 'three') {
                // Thi 3 điểm: đi tuần tự qua 5 vị trí cố định
                if (!first) this.rackIdx++;
                this.px = RACK_SPOTS[this.rackIdx % RACK_SPOTS.length];
            } else {
                let nx, guard = 0;
                do { nx = rnd(SPOT_MIN, SPOT_MAX); guard++; }
                while (Math.abs(nx - this.px) < M(0.6) && guard < 12);
                this.px = nx;
            }
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

        release() { if (this.state === 'charge') this.shoot(); }

        // Kiểu ngắm kéo-thả: vector kéo quyết định cả hướng lẫn lực
        dragAim(dx, dy) {
            if (this.state !== 'aim' && this.state !== 'charge') return;
            const d = Math.hypot(dx, dy);
            if (d < 6) return;
            this.state = 'charge';
            this.angle = clamp(Math.atan2(dy, dx), ANGLE_MIN, ANGLE_MAX);
            this.power = clamp(d / MAX_DRAG, 0, 1);
        }

        shoot() {
            const speed = lerp(POWER_MIN, POWER_MAX, this.power);
            this.ball = new Ball(
                this.relX, this.relY,
                -Math.cos(this.angle) * speed,
                -Math.sin(this.angle) * speed,
                SPIN0                                   // xoáy ngược của cú ném chuẩn
            );
            this.ball.fire = this.onFire;
            this.state = 'fly';
            this.shots++;
            this.armed = false;
            this.followThrough = 0.55;
            Sfx.shoot();
        }

        // ----- Cập nhật -----
        update(dt, held) {
            if (!held) this.armed = true;

            // Chế độ siêu khó: cả bộ rổ trượt lên xuống nhịp nhàng
            if (this.diff.moveHoop) {
                this.hoopT += this.diff.hoopSpeed * dt;
                this.hoopOff = Math.sin(this.hoopT) * this.diff.hoopRange;
            } else this.hoopOff = 0;

            this.netBulgeV += -this.netBulge * 150 * dt;
            this.netBulgeV *= Math.pow(0.015, dt);
            this.netBulge += this.netBulgeV * dt;
            this.rimShake *= Math.pow(0.02, dt);
            this.hoopFlash = Math.max(0, this.hoopFlash - dt * 2.2);
            this.scorePulse = Math.max(0, this.scorePulse - dt * 1.6);
            this.followThrough = Math.max(0, this.followThrough - dt);

            if (this.outcome) { this.updateCelebration(dt); this.updateEffects(dt); return; }

            switch (this.state) {
                case 'aim': {
                    if (Game.control === 'sweep') {
                        this.angle += this.angleDir * this.diff.sweep * dt;
                        if (this.angle > ANGLE_MAX) { this.angle = ANGLE_MAX; this.angleDir = -1; }
                        if (this.angle < ANGLE_MIN) { this.angle = ANGLE_MIN; this.angleDir = 1; }
                    }
                    this.bodyBob = lerp(this.bodyBob, 0, dt * 8);
                    if (held && Game.control === 'sweep') this.press();
                    break;
                }
                case 'charge': {
                    this.chargeHold += dt;
                    if (Game.control === 'sweep') {
                        this.power += this.powerDir * this.diff.power * dt;
                        if (this.power > 1) { this.power = 1; this.powerDir = -1; }
                        if (this.power < 0) { this.power = 0; this.powerDir = 1; }
                        this.chargeBeep -= dt;
                        if (this.chargeBeep <= 0) { Sfx.charge(this.power); this.chargeBeep = 0.09; }
                        if (!held) this.release();
                        else if (this.chargeHold > 4) this.shoot();
                    }
                    this.bodyBob = lerp(this.bodyBob, this.power * 10, dt * 12);
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
                        this.newSpot(false);
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

            const speed = Math.hypot(b.vx, b.vy);
            const steps = clamp(Math.ceil(speed * dt / (BALL_R * 0.35)), 1, 24);
            const h = dt / steps;
            const post = this.diff.post;      // bán kính "cột" vành: dễ thì mảnh hơn

            for (let s = 0; s < steps && b.alive; s++) {
                const prevY = b.y;
                b.vy += G * h;
                b.x += b.vx * h;
                b.y += b.vy * h;
                b.spin *= Math.exp(-SPIN_DECAY * h);
                b.rot += b.spin * h;

                const rimY = this.rimY;                 // vành có thể đang trượt lên xuống

                // --- Hai đầu vành rổ ---
                for (const rx of [RIM_X1, RIM_X2]) {
                    const dx = b.x - rx, dy = b.y - rimY;
                    const d = Math.hypot(dx, dy);
                    const min = BALL_R + post;
                    if (d < min && d > 0.0001) {
                        const nx = dx / d, ny = dy / d;
                        b.x = rx + nx * min;
                        b.y = rimY + ny * min;
                        const imp = b.bounce(nx, ny, RIM_E);
                        if (imp > 20) {
                            if (!b.hitRim) Sfx.rim();
                            this.rimShake = Math.min(1, imp / 500);
                            this.netBulgeV += 30;
                        }
                        b.hitRim = true;
                    }
                }

                // --- Bảng rổ ---
                if (b.x - BALL_R < BOARD_X && b.x > BOARD_X - M(0.5) &&
                    b.y > BOARD_TOP + this.hoopOff - BALL_R && b.y < BOARD_BOT + this.hoopOff && b.vx < 0) {
                    b.x = BOARD_X + BALL_R;
                    const imp = b.bounce(1, 0, BOARD_E);
                    if (imp > 20 && !b.hitBoard) Sfx.board();
                    b.hitBoard = true;
                    this.hoopFlash = 0.5;
                }

                // --- Tường sau ---
                if (b.x - BALL_R < 24) { b.x = 24 + BALL_R; b.bounce(1, 0, 0.5); }

                // --- Bóng lọt rổ ---
                if (!b.scored && b.vy > 0 && prevY <= rimY && b.y > rimY &&
                    b.x > RIM_X1 + post && b.x < RIM_X2 - post) {
                    b.scored = true;
                    this.netBulgeV += 260;
                    this.onScore(b);
                }

                /* --- Sàn ---
                   Ném trượt thì cho bóng nảy đúng MỘT cái rồi kết thúc tình
                   huống: vừa đủ nhịp để bé thấy tiếc, mà không phải ngồi chờ
                   bóng lóc cóc hết trên sàn mới được ném lượt mới. */
                if (b.y + BALL_R > FLOOR_Y && b.vy > 0) {
                    b.y = FLOOR_Y - BALL_R;
                    const imp = b.bounce(0, -1, FLOOR_E);
                    b.bounces++;
                    Sfx.floor(imp);
                    if (!b.scored && !b.missed) { b.missed = true; this.onMiss(); }
                    if (b.bounces >= 2 || imp < 60) this.killBall(b);
                }

                if (b.x > CW - 6 || b.x < -60 || b.y > CH + 120 || b.life > 8) this.killBall(b);
            }

            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 18) b.trail.shift();
        }

        killBall(b) {
            if (!b.alive) return;
            b.alive = false;
            if (!b.scored && !b.missed) { b.missed = true; this.onMiss(); }
        }

        onScore(b) {
            let pts;
            if (Game.mode === 'three') {
                pts = this.isMoneyBall ? 2 : 1;
            } else {
                pts = this.isThree ? 3 : 2;
            }
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

            this.addPopup(RIM_CX, this.rimY - 52, `+${pts}`,
                this.isThree || this.isMoneyBall ? '#d9b3ff' : '#9fe8ff', 1.5, 36);
            if (swish) this.addPopup(RIM_CX, this.rimY - 92, 'SWISH! +1', '#b9ffb0', 1.4, 23);
            if (wasFire) this.addPopup(RIM_CX, this.rimY - 124, '🔥 ON FIRE +1', '#ffca8a', 1.4, 21);
            if (b.hitBoard && !swish) this.addPopup(RIM_CX, this.rimY - 92, 'BANK SHOT!', '#ffd700', 1.2, 21);

            this.burst(RIM_CX, this.rimY + 14, swish ? '#39ff14' : this.cfg.accent, swish ? 36 : 26);

            if (!this.onFire && this.streak >= 3) {
                this.onFire = true;
                this.addPopup(this.px, FLOOR_Y - M(2.6), '🔥 HEATING UP!', '#ff7a1a', 1.6, 23);
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
            this.addPopup(this.px, FLOOR_Y - M(2.4), 'Missed!', '#94a3b8', 0.9, 19);
            Sfx.miss();
            if (this.state !== 'result') { this.state = 'result'; this.resultT = MISS_DELAY; }
            else this.resultT = Math.min(this.resultT, MISS_DELAY);
        }

        addPopup(x, y, text, color, life, size) {
            this.popups.push({ x, y, text, color, life, max: life, size: size || 22 });
        }

        burst(x, y, color, n) {
            for (let i = 0; i < n; i++) {
                const a = rnd(0, Math.PI * 2), sp = rnd(60, 340);
                this.particles.push({
                    x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90,
                    life: rnd(0.5, 1.1), max: 1.1, size: rnd(2.5, 6), color
                });
            }
        }

        updateEffects(dt) {
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const p = this.popups[i];
                p.life -= dt; p.y -= 36 * dt;
                if (p.life <= 0) this.popups.splice(i, 1);
            }
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= dt; p.vy += 640 * dt;
                p.x += p.vx * dt; p.y += p.vy * dt;
                if (p.life <= 0) this.particles.splice(i, 1);
            }
        }

        // ----- Ăn mừng / khóc -----
        setOutcome(kind) {
            this.outcome = kind;
            this.celebT = 0;
            this.ball = null;
            this.state = 'result';
            this.px = (SPOT_MIN + SPOT_MAX) / 2 + (this.mirror ? -M(0.3) : M(0.3));
            if (kind === 'win') {
                for (let i = 0; i < 60; i++) {
                    this.particles.push({
                        x: rnd(60, CW - 60), y: rnd(-160, 0),
                        vx: rnd(-40, 40), vy: rnd(70, 180),
                        life: 6, max: 6, size: rnd(3, 7),
                        color: ['#ff8a1a', '#00d0ff', '#ffd700', '#39ff14', '#ff007f'][i % 5],
                        confetti: true
                    });
                }
            }
        }

        updateCelebration(dt) {
            this.celebT += dt;
            if (this.outcome === 'win') {
                // Nhảy lên nhảy xuống ăn mừng
                this.bodyBob = Math.abs(Math.sin(this.celebT * 4.4)) * 26;
                if (this.particles.length < 90 && Math.random() < dt * 22) {
                    this.particles.push({
                        x: rnd(60, CW - 60), y: -12,
                        vx: rnd(-40, 40), vy: rnd(70, 180),
                        life: 6, max: 6, size: rnd(3, 7),
                        color: ['#ff8a1a', '#00d0ff', '#ffd700', '#39ff14', '#ff007f'][(Math.random() * 5) | 0],
                        confetti: true
                    });
                }
            } else if (this.outcome === 'lose') {
                // Rung vai nức nở + nước mắt rơi
                this.bodyBob = Math.sin(this.celebT * 9) * 2.2;
                if (Math.random() < dt * 7) {
                    const side = Math.random() < 0.5 ? -1 : 1;
                    this.tears.push({
                        x: this.px - M(0.02) + side * 10,
                        y: FLOOR_Y - M(1.62),
                        vy: rnd(60, 110), life: 1.1, side
                    });
                }
            } else {
                this.bodyBob = Math.abs(Math.sin(this.celebT * 2.4)) * 8;
            }

            for (let i = this.tears.length - 1; i >= 0; i--) {
                const t = this.tears[i];
                t.life -= dt; t.vy += 420 * dt;
                t.y += t.vy * dt; t.x += t.side * 6 * dt;
                if (t.life <= 0 || t.y > FLOOR_Y) this.tears.splice(i, 1);
            }
        }

        get x0() { return this.idx * CW; }
        toWorldX(lx) { return this.mirror ? this.x0 + CW - lx : this.x0 + lx; }

        // ================= VẼ =================
        draw(ctx, time) {
            ctx.save();
            if (this.mirror) { ctx.translate(this.x0 + CW, 0); ctx.scale(-1, 1); }
            else ctx.translate(this.x0, 0);
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, CW, CH); ctx.clip();

            this.drawArena(ctx, time);
            this.drawFloor(ctx);
            this.drawHoop(ctx, time);
            this.drawPlayer(ctx, time);
            if ((this.state === 'aim' || this.state === 'charge') && !this.outcome) this.drawAim(ctx, time);
            this.drawBall(ctx);
            this.drawParticles(ctx);
            if (this.state === 'charge' && !this.outcome) this.drawPowerBar(ctx);

            ctx.restore();
            ctx.restore();

            this.drawText(ctx, time);
        }

        // --- Khán đài & không khí nhà thi đấu ---
        drawArena(ctx, time) {
            const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
            g.addColorStop(0, '#080c1c');
            g.addColorStop(0.45, '#111a33');
            g.addColorStop(1, '#1b2748');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, CW, FLOOR_Y);

            // Đèn pha rọi xuống sân
            for (const lx of [CW * 0.24, CW * 0.62]) {
                const spot = ctx.createRadialGradient(lx, -120, 30, lx, 300, 520);
                spot.addColorStop(0, 'rgba(255,255,255,0.15)');
                spot.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = spot;
                ctx.fillRect(0, 0, CW, FLOOR_Y);
            }

            // Khán giả nhiều tầng, nhún nhảy mạnh hơn khi vừa ghi điểm
            const rand = seeded(4021 + this.idx * 53);
            const hype = this.outcome === 'win' ? 8 : (this.scorePulse > 0.2 ? 6 : 1.8);
            for (let row = 0; row < 5; row++) {
                const y = 54 + row * 36;
                const shade = 26 + row * 5;
                for (let i = 0; i < 30; i++) {
                    const x = 8 + i * 24 + rand() * 12;
                    const hue = Math.floor(rand() * 360);
                    const bob = Math.sin(time * 2.6 + i * 0.7 + row) * hype;
                    ctx.fillStyle = `hsla(${hue}, 52%, ${shade}%, 0.8)`;
                    ctx.beginPath();
                    ctx.arc(x, y + bob, 7.6 - row * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillRect(x - 6.6 + row * 0.3, y + bob + 4, 13 - row * 0.7, 17);
                }
            }

            // Lan can + băng rôn quảng cáo
            ctx.fillStyle = 'rgba(6,10,24,0.75)';
            ctx.fillRect(0, 238, CW, 40);
            const bg = ctx.createLinearGradient(0, 238, 0, 278);
            bg.addColorStop(0, this.cfg.jersey + '55');
            bg.addColorStop(1, 'rgba(0,0,0,0.2)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 238, CW, 40);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 238); ctx.lineTo(CW, 238); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 278); ctx.lineTo(CW, 278); ctx.stroke();
        }

        // --- Sàn gỗ ---
        drawFloor(ctx) {
            const g = ctx.createLinearGradient(0, FLOOR_Y, 0, CH);
            g.addColorStop(0, '#d09a4e');
            g.addColorStop(0.25, '#b87c33');
            g.addColorStop(1, '#7a4a17');
            ctx.fillStyle = g;
            ctx.fillRect(0, FLOOR_Y, CW, CH - FLOOR_Y);

            // Ván sàn + vân gỗ
            ctx.strokeStyle = 'rgba(70,38,10,0.35)';
            ctx.lineWidth = 1.2;
            for (let x = -60; x < CW + 60; x += 34) {
                ctx.beginPath();
                ctx.moveTo(x, FLOOR_Y);
                ctx.lineTo(x - 26, CH);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255,220,160,0.10)';
            for (let y = FLOOR_Y + 8; y < CH; y += 13) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
            }

            // Phản chiếu ánh đèn trên mặt sàn bóng
            const sh = ctx.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 60);
            sh.addColorStop(0, 'rgba(255,255,255,0.16)');
            sh.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = sh;
            ctx.fillRect(0, FLOOR_Y, CW, 60);

            // Vạch biên & vạch 3 điểm
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = 3.5;
            ctx.beginPath(); ctx.moveTo(0, FLOOR_Y + 5); ctx.lineTo(CW, FLOOR_Y + 5); ctx.stroke();

            ctx.strokeStyle = 'rgba(157,78,221,0.95)';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.moveTo(THREE_X, FLOOR_Y + 7);
            ctx.lineTo(THREE_X - 16, CH);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0,208,255,0.09)';
            ctx.fillRect(0, FLOOR_Y + 7, THREE_X, CH - FLOOR_Y);
            ctx.fillStyle = 'rgba(157,78,221,0.11)';
            ctx.fillRect(THREE_X, FLOOR_Y + 7, CW - THREE_X, CH - FLOOR_Y);

            // Vòng sáng dưới chân
            if (!this.outcome && (this.state !== 'result' || this.resultT > 0.2)) {
                const c = this.isThree ? '157,78,221' : '0,208,255';
                ctx.save();
                ctx.strokeStyle = `rgba(${c},0.9)`;
                ctx.lineWidth = 3;
                ctx.shadowColor = `rgba(${c},0.9)`;
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.ellipse(this.px, FLOOR_Y + 14, 44, 11, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Các vị trí của vòng thi 3 điểm
            if (Game.mode === 'three' && !this.outcome) {
                RACK_SPOTS.forEach((sx, i) => {
                    const done = i < this.rackIdx % RACK_SPOTS.length;
                    const now = i === this.rackIdx % RACK_SPOTS.length;
                    ctx.strokeStyle = now ? 'rgba(255,215,0,0.95)'
                        : done ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.4)';
                    ctx.lineWidth = now ? 3 : 1.6;
                    ctx.beginPath();
                    ctx.ellipse(sx, FLOOR_Y + 30, 15, 5, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    if (i === 4) {
                        ctx.fillStyle = now ? 'rgba(255,215,0,0.85)' : 'rgba(255,215,0,0.35)';
                        ctx.beginPath();
                        ctx.ellipse(sx, FLOOR_Y + 30, 8, 3, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }
        }

        /* --- Bộ trụ rổ thi đấu ---
           Đế bắt sàn, trụ thép tròn có đệm bảo vệ cao 2m ở phần dưới, và bộ
           tay đỡ hình tam giác (một thanh ngang trên + một thanh chống chéo)
           đỡ bảng rổ — đúng như trụ rổ trong nhà thi đấu. */
        drawStanchion(ctx) {
            const cx = 36, hw = 8;                  // tâm trụ và nửa bề rộng (trụ ø16cm)
            const off = this.hoopOff;               // bộ rổ trượt trên trụ ở chế độ siêu khó
            const topY = 126;                       // đỉnh trụ
            const padTop = FLOOR_Y - M(2.15);       // đệm bảo vệ cao 2,15m theo luật FIBA
            const braceY = padTop - 18;             // chỗ thanh chống bắt vào trụ

            // Thanh kim loại có vệt sáng dọc thân cho ra khối trụ tròn
            const bar = (x1, y1, x2, y2, w, dark, light) => {
                const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
                const nx = -dy / d * w, ny = dx / d * w;
                ctx.beginPath();
                ctx.moveTo(x1 + nx, y1 + ny);
                ctx.lineTo(x2 + nx, y2 + ny);
                ctx.lineTo(x2 - nx, y2 - ny);
                ctx.lineTo(x1 - nx, y1 - ny);
                ctx.closePath();
                const g = ctx.createLinearGradient(x1 + nx, y1 + ny, x1 - nx, y1 - ny);
                g.addColorStop(0, dark);
                g.addColorStop(0.34, light);
                g.addColorStop(0.52, dark === '#141a2c' ? '#4b5779' : dark);
                g.addColorStop(1, '#10141f');
                ctx.fillStyle = g;
                ctx.fill();
            };

            // Bóng đổ dưới chân trụ
            ctx.fillStyle = 'rgba(0,0,0,0.34)';
            ctx.beginPath();
            ctx.ellipse(cx, FLOOR_Y + 6, 46, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            // Thanh chống chéo và thanh ngang đỡ bảng
            bar(cx + 3, braceY + off, BOARD_X - 2, RIM_Y - M(0.18) + off, 6, '#141a2c', '#6d7ca6');
            bar(cx, topY + 8 + off * 0.5, BOARD_X - 2, BOARD_TOP + 26 + off, 7, '#141a2c', '#7a89b4');

            // Trụ chính
            bar(cx, FLOOR_Y, cx, topY, hw, '#141a2c', '#7d8cb8');
            // Chỏm bo tròn trên đỉnh trụ
            ctx.fillStyle = '#39415f';
            ctx.beginPath();
            ctx.ellipse(cx, topY, hw, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Đệm bảo vệ quấn quanh phần dưới trụ
            const padW = hw + 6;
            const pg = ctx.createLinearGradient(cx - padW, 0, cx + padW, 0);
            pg.addColorStop(0, '#101728');
            pg.addColorStop(0.34, this.cfg.jersey2);
            pg.addColorStop(0.52, this.cfg.jersey);
            pg.addColorStop(1, '#0d1220');
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.roundRect(cx - padW, padTop, padW * 2, FLOOR_Y - padTop, 7);
            ctx.fill();
            // Đường chỉ may ngang trên đệm
            ctx.strokeStyle = 'rgba(0,0,0,0.30)';
            ctx.lineWidth = 1.6;
            for (let y = padTop + 26; y < FLOOR_Y - 10; y += 30) {
                ctx.beginPath();
                ctx.moveTo(cx - padW + 2, y); ctx.lineTo(cx + padW - 2, y);
                ctx.stroke();
            }
            // Vệt sáng dọc mép đệm
            ctx.strokeStyle = 'rgba(255,255,255,0.20)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx - padW * 0.45, padTop + 8);
            ctx.lineTo(cx - padW * 0.45, FLOOR_Y - 8);
            ctx.stroke();

            // Đế bắt sàn
            ctx.fillStyle = '#1d2338';
            ctx.beginPath();
            ctx.moveTo(cx - 40, FLOOR_Y);
            ctx.lineTo(cx - 28, FLOOR_Y - 14);
            ctx.lineTo(cx + 28, FLOOR_Y - 14);
            ctx.lineTo(cx + 40, FLOOR_Y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#39415f';
            ctx.fillRect(cx - 40, FLOOR_Y - 4, 80, 4);
            // Bu-lông neo đế
            ctx.fillStyle = '#8d99bd';
            for (const bx of [cx - 32, cx - 21, cx + 21, cx + 32]) {
                ctx.beginPath();
                ctx.arc(bx, FLOOR_Y - 9, 2.6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Bản mã bắt tay đỡ vào bảng rổ
            ctx.fillStyle = '#2b3350';
            ctx.fillRect(BOARD_X - 7, BOARD_TOP + 16 + off, 8, 26);
            ctx.fillRect(BOARD_X - 7, RIM_Y - M(0.3) + off, 8, 26);
            ctx.fillStyle = '#8d99bd';
            for (const [bx, by] of [[BOARD_X - 3, BOARD_TOP + 22 + off], [BOARD_X - 3, BOARD_TOP + 36 + off],
            [BOARD_X - 3, RIM_Y - M(0.3) + 6 + off], [BOARD_X - 3, RIM_Y - M(0.3) + 20 + off]]) {
                ctx.beginPath();
                ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // --- Rổ: trụ, bảng kính, vành, lưới ---
        drawHoop(ctx, time) {
            const flash = this.hoopFlash;
            const vib = this.rimShake * 3;      // rung nhẹ khi bóng đập vành
            const off = this.hoopOff;           // cả bộ rổ trượt lên xuống (chế độ siêu khó)
            const boardY = off + vib * 0.3;     // bảng rung ít hơn vành
            const shake = off + vib;            // vành và lưới

            this.drawStanchion(ctx);

            // Bảng rổ bằng kính
            ctx.save();
            ctx.translate(0, boardY);
            ctx.shadowColor = `rgba(255,215,0,${flash * 0.9})`;
            ctx.shadowBlur = 30 * flash;
            const bw = M(0.32);                       // bề dày nhìn nghiêng của bảng
            const glass = ctx.createLinearGradient(BOARD_X - bw, BOARD_TOP, BOARD_X, BOARD_BOT);
            glass.addColorStop(0, 'rgba(190,225,255,0.30)');
            glass.addColorStop(0.5, 'rgba(150,200,255,0.16)');
            glass.addColorStop(1, 'rgba(120,180,240,0.26)');
            ctx.fillStyle = glass;
            ctx.fillRect(BOARD_X - bw, BOARD_TOP, bw, BOARD_BOT - BOARD_TOP);
            ctx.restore();

            // Khung nhôm quanh bảng
            ctx.strokeStyle = flash > 0.1 ? '#ffe08a' : '#e9f2ff';
            ctx.lineWidth = 5;
            ctx.strokeRect(BOARD_X - bw, BOARD_TOP + boardY, bw, BOARD_BOT - BOARD_TOP);

            // Ô vuông ngắm bảng (0,59m x 0,45m)
            ctx.strokeStyle = flash > 0.1 ? '#ffd700' : '#ffffff';
            ctx.lineWidth = 3.5;
            ctx.strokeRect(BOARD_X - bw + 5, RIM_Y - M(0.45) + boardY, bw - 10, M(0.45));

            // Vành rổ: nhìn nghiêng nên vẽ thành hình bầu dục dẹt
            ctx.save();
            ctx.translate(0, shake);
            ctx.shadowColor = 'rgba(255,90,0,0.85)';
            ctx.shadowBlur = 14 + flash * 26;
            ctx.strokeStyle = flash > 0.1 ? '#ffd08a' : '#ff5c1a';
            ctx.lineWidth = M(0.018) * 2;             // vành thép ø18mm
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.ellipse(RIM_CX, RIM_Y, (RIM_X2 - RIM_X1) / 2, M(0.05), 0, 0, Math.PI * 2);
            ctx.stroke();
            // Móc nối vành vào bảng
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(BOARD_X, RIM_Y);
            ctx.lineTo(RIM_X1, RIM_Y);
            ctx.stroke();
            ctx.restore();

            this.drawNet(ctx, time, shake);
        }

        drawNet(ctx, time, shake) {
            const top = RIM_Y + shake;
            const depth = M(0.42);                    // lưới dài 0,4m
            const bulge = this.netBulge;
            const segs = 10;
            const rTop = (RIM_X2 - RIM_X1) / 2;
            const rBot = rTop * 0.56 + Math.abs(bulge) * 0.05;

            ctx.save();
            ctx.lineWidth = 1.6;

            const topX = t => RIM_CX + Math.cos(Math.PI * t) * rTop;
            const botX = t => RIM_CX + Math.cos(Math.PI * t) * rBot;
            const botY = top + depth + bulge * 0.35;

            // Sợi lưới đan chéo hai chiều
            for (let i = 0; i <= segs; i++) {
                const t = i / segs;
                const sway = Math.sin(time * 1.5 + i) * 1.2;
                ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.45 * Math.abs(Math.cos(Math.PI * t))})`;
                ctx.beginPath();
                ctx.moveTo(topX(t), top);
                ctx.quadraticCurveTo(lerp(topX(t), botX(t), 0.5) + sway,
                    top + depth * 0.55 + bulge * 0.25, botX(t), botY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(topX(1 - t), top);
                ctx.quadraticCurveTo(lerp(topX(1 - t), botX(t), 0.5) - sway,
                    top + depth * 0.55 + bulge * 0.25, botX(t), botY);
                ctx.stroke();
            }

            // Các vòng ngang của lưới
            ctx.strokeStyle = 'rgba(255,255,255,0.42)';
            for (let r = 1; r <= 4; r++) {
                const t = r / 5;
                const y = top + depth * t + bulge * 0.3 * t;
                const rr = lerp(rTop, rBot, t);
                ctx.beginPath();
                ctx.ellipse(RIM_CX, y, rr, M(0.035) * (1 - t * 0.4), 0, 0, Math.PI);
                ctx.stroke();
            }
            ctx.restore();
        }

        // --- Cầu thủ ---
        drawPlayer(ctx, time) {
            const c = this.cfg;
            const x = this.px;
            const bob = this.bodyBob;

            const squat = this.state === 'charge' ? this.power * 13 : 0;
            const jump = this.state === 'fly' && this.ball && this.ball.life < 0.35
                ? Math.sin(this.ball.life / 0.35 * Math.PI) * 20 : 0;

            let baseY = FLOOR_Y - jump;
            let lean = 0, headTilt = 0;

            if (this.outcome === 'win') baseY = FLOOR_Y - bob;
            else if (this.outcome === 'lose') { baseY = FLOOR_Y; lean = 0.22; headTilt = 0.4; }
            else if (this.outcome === 'draw') baseY = FLOOR_Y - bob;

            // Bóng đổ
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(x, FLOOR_Y + 8, 34 - jump * 0.4, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            const hipY = baseY - M(0.72) + squat * 0.6 + lean * 40;
            const shoulderY = hipY - M(0.46) + squat * 0.2 + lean * 16;
            const headY = shoulderY - M(0.21) + headTilt * 12;
            const headX = x - 2 + lean * 14;

            // Chân
            ctx.strokeStyle = c.skin;
            ctx.lineWidth = 14;
            ctx.lineCap = 'round';
            const spread = 13 + squat * 0.5 + (this.outcome === 'win' ? 8 : 0);
            const kneeY = baseY - M(0.34) + squat * 0.3 + lean * 26;
            ctx.beginPath();
            ctx.moveTo(x - 8, hipY); ctx.lineTo(x - spread, kneeY); ctx.lineTo(x - spread - 5, baseY - 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 8, hipY); ctx.lineTo(x + spread - 4, kneeY); ctx.lineTo(x + spread, baseY - 5);
            ctx.stroke();

            // Giày
            ctx.fillStyle = '#f4f7fb';
            ctx.beginPath(); ctx.roundRect(x - spread - 16, baseY - 12, 25, 13, 6); ctx.fill();
            ctx.beginPath(); ctx.roundRect(x + spread - 9, baseY - 12, 25, 13, 6); ctx.fill();
            ctx.fillStyle = c.jersey;
            ctx.fillRect(x - spread - 16, baseY - 3, 25, 3);
            ctx.fillRect(x + spread - 9, baseY - 3, 25, 3);

            // Quần
            ctx.fillStyle = c.jersey2;
            ctx.beginPath(); ctx.roundRect(x - 22, hipY - 18, 44, 38, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, hipY - 2); ctx.lineTo(x, hipY + 18); ctx.stroke();

            // Áo
            ctx.fillStyle = c.jersey;
            ctx.beginPath();
            ctx.roundRect(x - 21, shoulderY - 7, 42, hipY - shoulderY + 18, 11);
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.beginPath(); ctx.roundRect(x - 21, shoulderY - 7, 12, hipY - shoulderY + 18, 11); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 21px "Baloo 2", sans-serif';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.scale(this.mirror ? -1 : 1, 1);
            ctx.fillText(c.num, this.mirror ? -x : x, shoulderY + 26);
            ctx.restore();

            // Tay — dùng IK 2 đốt nên khuỷu tay tự tìm đúng chỗ, gập duỗi mượt.
            // Bàn tay ném luôn đỡ ngay dưới quả bóng, mà quả bóng thì nằm đúng
            // điểm rời tay, nên mũi tên ngắm - quả bóng - điểm xuất phát của cú
            // ném đều trùng khớp nhau.
            const shade = c.skin === '#f5c396' ? '#c78f5e' : '#c08a5c';
            const handX = this.relX + M(0.02);
            const handY = this.relY + BALL_R * 0.55;

            if (this.outcome === 'win') {
                // Hai tay giơ cao chữ V, vẫy vẫy ăn mừng
                const w = Math.sin(this.celebT * 5) * 10;
                drawArm(ctx, x - 14, shoulderY + 2, x - 46 + w, shoulderY - 62, -1, c.skin, shade);
                drawArm(ctx, x + 14, shoulderY + 2, x + 46 + w, shoulderY - 62, 1, c.skin, shade);
            } else if (this.outcome === 'lose') {
                // Hai tay ôm mặt khóc
                drawArm(ctx, x - 14, shoulderY + 4, headX - 11, headY + 7, -1, c.skin, shade);
                drawArm(ctx, x + 14, shoulderY + 4, headX + 9, headY + 9, 1, c.skin, shade);
            } else {
                // Tay đỡ bóng ở dưới, tay ném ở trên — đúng tư thế ném rổ
                drawArm(ctx, x + 14, shoulderY + 3, handX + 13, handY + 9, 1, c.skin, shade);
                drawArm(ctx, x - 14, shoulderY + 1, handX, handY, -1, c.skin, shade);
            }

            // Đầu
            ctx.save();
            ctx.translate(headX, headY);
            ctx.rotate(headTilt * 0.5);
            ctx.fillStyle = c.skin;
            ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = c.hair;
            ctx.beginPath(); ctx.arc(0, -3, 17, Math.PI * 0.95, Math.PI * 2.15); ctx.fill();

            const eyeY = 2;
            if (this.outcome === 'lose') {
                // Mắt nhắm tịt + miệng mếu
                ctx.strokeStyle = '#1b2138';
                ctx.lineWidth = 2.2;
                ctx.beginPath(); ctx.arc(-11, eyeY + 1, 3.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
                ctx.beginPath(); ctx.arc(-3, eyeY + 1, 3.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-13, 10);
                ctx.quadraticCurveTo(-7, 4, -1, 10);
                ctx.stroke();
            } else if (this.outcome === 'win') {
                // Mắt cong hạnh phúc + miệng cười to
                ctx.strokeStyle = '#1b2138';
                ctx.lineWidth = 2.4;
                ctx.beginPath(); ctx.arc(-11, eyeY + 2, 3.6, Math.PI, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(-3, eyeY + 2, 3.6, Math.PI, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#7d2d3a';
                ctx.beginPath();
                ctx.ellipse(-7, 9, 7, 5.2, 0, 0, Math.PI);
                ctx.fill();
            } else {
                ctx.fillStyle = '#1b2138';
                ctx.beginPath(); ctx.arc(-12, eyeY, 2.8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-4, eyeY, 2.8, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#1b2138';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(-8, 7, 5.5, 0.15 * Math.PI, 0.85 * Math.PI);
                ctx.stroke();
            }

            // Băng đô
            ctx.strokeStyle = c.accent;
            ctx.lineWidth = 5.5;
            ctx.beginPath(); ctx.arc(0, 0, 17, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke();
            ctx.restore();

            // Bóng nằm trên bàn tay khi đang ngắm: chỉ đung đưa nhẹ,
            // bóng chỉ thực sự xoay tít sau khi rời tay.
            if (!this.outcome && (this.state === 'aim' || this.state === 'charge')) {
                this.drawBallShape(ctx, this.relX, this.relY, Math.sin(time * 1.3) * 0.13, this.onFire);
            }

            // Hào quang bốc lửa
            if (this.onFire && !this.outcome) {
                ctx.save();
                ctx.globalAlpha = 0.45 + Math.sin(time * 9) * 0.2;
                ctx.strokeStyle = '#ff7a1a';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ff7a1a';
                ctx.shadowBlur = 22;
                ctx.beginPath();
                ctx.ellipse(x, baseY - M(0.62), 44, M(0.82), 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Nước mắt
            for (const t of this.tears) {
                ctx.save();
                ctx.globalAlpha = clamp(t.life, 0, 1);
                ctx.fillStyle = '#8fd8ff';
                ctx.beginPath();
                ctx.ellipse(t.x, t.y, 3.2, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // --- Quả bóng rổ: khối cầu da thật, xoay theo xoáy ngược của cú ném ---
        drawBallShape(ctx, x, y, rot, fire) {
            if (!ballTex) buildBallTex();
            const r = BALL_R;
            let k = Math.round(rot / (Math.PI * 2) * BB_STEPS) % BB_STEPS;
            if (k < 0) k += BB_STEPS;

            ctx.save();
            if (fire) { ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 24; }
            ctx.drawImage(ballTex[k], x - r, y - r, r * 2, r * 2);
            ctx.shadowBlur = 0;

            if (fire) {
                // Đang bốc lửa thì phủ thêm sắc cam nóng lên đúng phần quả bóng
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = 'rgba(255,140,20,0.34)';
                ctx.fillRect(x - r, y - r, r * 2, r * 2);
            }
            ctx.restore();
        }

        drawBall(ctx) {
            const b = this.ball;
            if (!b) return;
            // Sắp sang lượt mới thì quả bóng mờ dần thay vì biến mất đột ngột
            const fade = this.state === 'result' ? clamp(this.resultT / 0.25, 0, 1) : 1;
            ctx.save();
            for (let i = 0; i < b.trail.length; i++) {
                const t = i / b.trail.length;
                ctx.globalAlpha = t * 0.4 * fade;
                ctx.fillStyle = b.fire ? '#ff7a1a' : this.cfg.accent;
                ctx.beginPath();
                ctx.arc(b.trail[i].x, b.trail[i].y, BALL_R * t * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = fade;
            this.drawBallShape(ctx, b.x, b.y, b.rot, b.fire);
            ctx.restore();
        }

        drawAim(ctx, time) {
            const rx = this.relX, ry = this.relY;
            const dx = -Math.cos(this.angle), dy = -Math.sin(this.angle);
            // Mũi tên bắt đầu ở RÌA quả bóng (chừa thêm chút khe) chứ không đâm vào tâm
            const gap = BALL_R + 4;
            const sx = rx + dx * gap, sy = ry + dy * gap;
            const len = 100 + (this.state === 'charge' ? this.power * 56 : Math.sin(time * 4) * 5);
            const ax = rx + dx * len;
            const ay = ry + dy * len;

            ctx.save();
            ctx.strokeStyle = this.cfg.accent;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.shadowColor = this.cfg.accent;
            ctx.shadowBlur = 14;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ax, ay); ctx.stroke();
            const a = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(ax, ay); ctx.lineTo(ax - Math.cos(a - 0.4) * 18, ay - Math.sin(a - 0.4) * 18);
            ctx.moveTo(ax, ay); ctx.lineTo(ax - Math.cos(a + 0.4) * 18, ay - Math.sin(a + 0.4) * 18);
            ctx.stroke();
            ctx.restore();

            if (Game.helpMode && this.diff.guide && this.state === 'charge') {
                const speed = lerp(POWER_MIN, POWER_MAX, this.power);
                let vx = -Math.cos(this.angle) * speed;
                let vy = -Math.sin(this.angle) * speed;
                let px = rx, py = ry;
                ctx.save();
                ctx.setLineDash([7, 9]);
                ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                let started = false;
                for (let i = 0; i < 110; i++) {
                    vy += G * 0.016; px += vx * 0.016; py += vy * 0.016;
                    if (py > FLOOR_Y || px < BOARD_X) break;
                    // Chỉ bắt đầu vẽ khi đã ra khỏi quả bóng, cho khỏi đè lên bóng
                    if (Math.hypot(px - rx, py - ry) < gap) continue;
                    if (!started) { ctx.moveTo(px, py); started = true; }
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }

        drawPowerBar(ctx) {
            const bw = 17, bh = 140;
            const bx = Math.min(this.px + 48, CW - bw - 16), by = FLOOR_Y - M(1.72);
            ctx.save();
            ctx.fillStyle = 'rgba(4,7,18,0.78)';
            ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10); ctx.stroke();
            const g = ctx.createLinearGradient(0, by + bh, 0, by);
            g.addColorStop(0, '#39ff14'); g.addColorStop(0.55, '#ffd700'); g.addColorStop(1, '#ff3366');
            ctx.fillStyle = g;
            const fh = bh * this.power;
            ctx.beginPath(); ctx.roundRect(bx, by + bh - fh, bw, fh, 7); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
                const y = by + bh * i / 5;
                ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke();
            }
            ctx.restore();
        }

        drawParticles(ctx) {
            for (const p of this.particles) {
                ctx.save();
                ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
                ctx.fillStyle = p.color;
                if (p.confetti) {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.x * 0.05 + p.y * 0.03);
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }
            ctx.globalAlpha = 1;
        }

        drawText(ctx, time) {
            ctx.save();
            ctx.textAlign = 'center';
            const zx = this.toWorldX(this.px);
            const cx = this.toWorldX(CW / 2);

            // Tên và phím bấm của người chơi ngay trên sân của mình
            ctx.font = 'bold 15px "Baloo 2", sans-serif';
            ctx.fillStyle = this.cfg.accent;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 6;
            ctx.fillText(`${this.cfg.emoji} ${this.cfg.name}`, cx, CH - 26);
            ctx.font = 'bold 13px "Nunito", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.72)';
            ctx.fillText(`Key ${Game.keyLabel(this.idx)}`, cx, CH - 9);
            ctx.shadowBlur = 0;

            if (!this.outcome && (this.state === 'aim' || this.state === 'charge')) {
                ctx.font = 'bold 18px "Baloo 2", sans-serif';
                ctx.shadowColor = 'rgba(0,0,0,0.85)';
                ctx.shadowBlur = 6;
                if (Game.mode === 'three') {
                    ctx.fillStyle = this.isMoneyBall ? '#ffd700' : '#9fe8ff';
                    ctx.fillText(this.isMoneyBall ? '★ GOLDEN BALL · 2 POINTS' : '1 POINT', zx, FLOOR_Y + 52);
                } else {
                    ctx.fillStyle = this.isThree ? '#d9b3ff' : '#9fe8ff';
                    ctx.fillText(this.isThree ? '3 POINTS' : '2 POINTS', zx, FLOOR_Y + 52);
                }
            }

            if (this.outcome) {
                ctx.font = `bold ${CW > 540 ? 28 : 22}px "Baloo 2", sans-serif`;
                ctx.shadowColor = 'rgba(0,0,0,0.85)';
                ctx.shadowBlur = 10;
                const pulse = 1 + Math.sin(time * 5) * 0.05;
                ctx.save();
                ctx.translate(cx, 128);
                ctx.scale(pulse, pulse);
                if (this.outcome === 'win') {
                    ctx.fillStyle = '#ffd700';
                    ctx.fillText('🏆 VICTORY! 🏆', 0, 0);
                } else if (this.outcome === 'lose') {
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillText('😭 BOO HOO... WE LOST', 0, 0);
                } else {
                    ctx.fillStyle = '#b9ffb0';
                    ctx.fillText('🤝 IT\'S A DRAW!', 0, 0);
                }
                ctx.restore();
            }

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
        state: 'menu',              // menu | countdown | playing | paused | celebrate | over
        mode: 'versus',
        difficulty: 'normal',
        control: 'sweep',           // sweep | drag
        playerCount: 2,
        timeLeft: 90,
        countdown: 3.99,
        lastTick: -1,
        time: 0,
        helpMode: true,
        celebrateT: 0,
        held: [false, false, false, false],
        pointers: new Map(),
        drags: new Map(),
        cards: [],

        keyLabel(i) {
            const c = KEYSETS[this.playerCount][i] || '';
            return c.replace('Key', '');
        },

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
                hint: document.getElementById('control-hint')
            };

            this.buildPlayers(this.playerCount);
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

        // Dựng lại sân và bảng điểm theo số người chơi
        buildPlayers(n) {
            this.playerCount = n;
            applyLayout(n);
            this.courts = [];
            for (let i = 0; i < n; i++) this.courts.push(new Court(i));
            this.held = new Array(n).fill(false);

            /* Bảng điểm chia đều sang hai bên đồng hồ, để đồng hồ luôn nằm
               chính giữa màn hình — cầu thủ nào cũng liếc thấy giờ ngay. */
            const half = Math.ceil(n / 2);
            const card = (c, i) => `
                <div class="score-card card-p${i + 1}${i >= half ? ' flip' : ''}" data-card="${i}">
                    <div class="score-avatar">${c.cfg.emoji}</div>
                    <div class="score-info">
                        <div class="score-name">${c.cfg.name} <span class="key-tag">${this.keyLabel(i)}</span></div>
                        <div class="score-sub">
                            <span class="streak-tag" data-streak="${i}">Streak: 0</span>
                            <span class="streak-tag" data-acc="${i}">0/0</span>
                        </div>
                    </div>
                    <div class="score-number" data-score="${i}">0</div>
                </div>`;
            this.el.stripL.innerHTML = this.courts.slice(0, half).map((c, i) => card(c, i)).join('');
            this.el.stripR.innerHTML = this.courts.slice(half).map((c, i) => card(c, i + half)).join('');
            const box = i => i < half ? this.el.stripL : this.el.stripR;
            const pick = (attr, i) => box(i).querySelector(`[data-${attr}="${i}"]`);
            this.cards = this.courts.map((_, i) => pick('card', i));
            this.scoreEls = this.courts.map((_, i) => pick('score', i));
            this.streakEls = this.courts.map((_, i) => pick('streak', i));
            this.accEls = this.courts.map((_, i) => pick('acc', i));

            // Bảng tổng kết cuối trận
            this.el.finals.className = 'final-grid cols-' + Math.min(n, 4);
            this.el.finals.innerHTML = this.courts.map((c, i) => `
                <div class="final-box final-p${i + 1}" data-final="${i}">
                    <div class="final-avatar">${c.cfg.emoji}</div>
                    <div class="final-name">${c.cfg.name}</div>
                    <div class="final-score" data-fscore="${i}">0</div>
                    <div class="final-stats">
                        <div><span>Made</span><b data-fmade="${i}">0/0</b></div>
                        <div><span>Accuracy</span><b data-facc="${i}">0%</b></div>
                        <div><span>Longest streak</span><b data-fbest="${i}">0</b></div>
                        <div><span>Swish</span><b data-fswish="${i}">0</b></div>
                    </div>
                </div>`).join('');
            this.resize();
            this.syncHUD();
        },

        bindUI() {
            document.getElementById('btn-start').onclick = () => this.startMatch();
            document.getElementById('btn-again').onclick = () => this.startMatch();
            document.getElementById('btn-restart').onclick = () => this.startMatch();
            document.getElementById('btn-menu').onclick = () => this.toMenu();
            document.getElementById('btn-back-menu').onclick = () => this.toMenu();
            document.getElementById('btn-resume').onclick = () => this.setPaused(false);

            // Chọn chế độ chơi
            document.querySelectorAll('[data-mode]').forEach(b => {
                b.onclick = () => {
                    this.mode = b.dataset.mode;
                    document.querySelectorAll('[data-mode]').forEach(o => o.classList.toggle('sel', o === b));
                };
            });
            // Chọn độ khó
            document.querySelectorAll('[data-diff]').forEach(b => {
                b.onclick = () => {
                    this.difficulty = b.dataset.diff;
                    document.querySelectorAll('[data-diff]').forEach(o => o.classList.toggle('sel', o === b));
                };
            });
            // Chọn kiểu điều khiển
            document.querySelectorAll('[data-ctrl]').forEach(b => {
                b.onclick = () => {
                    this.control = b.dataset.ctrl;
                    document.querySelectorAll('[data-ctrl]').forEach(o => o.classList.toggle('sel', o === b));
                    this.syncHints();
                };
            });
            // Chọn số người chơi
            document.querySelectorAll('[data-players]').forEach(b => {
                b.onclick = () => {
                    document.querySelectorAll('[data-players]').forEach(o => o.classList.toggle('sel', o === b));
                    this.buildPlayers(+b.dataset.players);
                    this.syncHints();
                };
            });

            const helpBtn = document.getElementById('btn-help');
            helpBtn.onclick = () => {
                this.helpMode = !this.helpMode;
                helpBtn.classList.toggle('active', this.helpMode);
                document.getElementById('help-label').textContent =
                    'Aim Helper:' + (this.helpMode ? 'ON' : 'OFF');
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

        syncHints() {
            this.buildKeysList();
            const how = this.control === 'sweep'
                ? 'Hold to charge — release at the right moment to shoot'
                : 'Drag back and release like a slingshot (tap your own half)';
            const keys = this.courts.map((c, i) => `${c.cfg.emoji} ${this.keyLabel(i)}`).join('   ·   ');
            if (this.el.hint) this.el.hint.textContent = `${keys}   —   ${how}`;
        },

        /* Bảng phím ở màn hình cấu hình: mỗi bé một dòng, dựng lại mỗi khi đổi
           số bé nên bé chỉ thấy đúng phím của trận sắp chơi. */
        buildKeysList() {
            const box = document.getElementById('keys-list');
            if (!box) return;
            box.innerHTML = this.courts.map((c, i) =>
                `<div class="keyrow" style="--pc:${c.cfg.jersey}">` +
                `<span class="keyrow-emoji">${c.cfg.emoji}</span>` +
                `<span class="keyrow-name">${c.cfg.name}</span>` +
                `<span class="key-cap">${this.keyLabel(i)}</span></div>`).join('');
        },

        bindInput() {
            const keyToPlayer = code => KEYSETS[this.playerCount].indexOf(code);

            window.addEventListener('keydown', e => {
                if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
                if (e.code === 'Escape' || e.code === 'KeyP') {
                    if (this.state === 'playing') this.setPaused(true);
                    else if (this.state === 'paused') this.setPaused(false);
                    return;
                }
                if ((e.code === 'Space' || e.code === 'Enter') &&
                    (this.state === 'menu' || this.state === 'over')) { this.startMatch(); return; }
                if (e.repeat) return;
                const p = keyToPlayer(e.code);
                if (p >= 0) { Sfx.ensure(); this.held[p] = true; }
            });

            window.addEventListener('keyup', e => {
                const p = keyToPlayer(e.code);
                if (p >= 0) this.held[p] = false;
            });

            const toWorld = e => {
                const r = this.canvas.getBoundingClientRect();
                const wx = (e.clientX - r.left - this.ox) / this.scale;
                return {
                    x: wx,
                    y: (e.clientY - r.top - this.oy) / this.scale,
                    half: clamp(Math.floor(wx / CW), 0, this.playerCount - 1)
                };
            };

            this.canvas.addEventListener('pointerdown', e => {
                if (this.state !== 'playing' && this.state !== 'countdown') return;
                e.preventDefault();
                Sfx.ensure();
                const p = toWorld(e);
                this.pointers.set(e.pointerId, p.half);
                if (this.control === 'drag') {
                    this.drags.set(e.pointerId, { half: p.half, x: p.x, y: p.y });
                } else {
                    this.held[p.half] = true;
                }
                if (this.canvas.setPointerCapture) {
                    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { }
                }
            });

            this.canvas.addEventListener('pointermove', e => {
                const d = this.drags.get(e.pointerId);
                if (!d) return;
                const p = toWorld(e);
                const court = this.courts[d.half];
                // Kéo lùi: bóng bay ngược lại hướng kéo (sân lật gương thì đảo trục x)
                let dx = d.x - p.x, dy = d.y - p.y;
                if (court.mirror) dx = -dx;
                court.dragAim(-dx, dy);
            });

            const endPointer = e => {
                const half = this.pointers.get(e.pointerId);
                if (half === undefined) return;
                this.pointers.delete(e.pointerId);
                if (this.control === 'drag') {
                    const d = this.drags.get(e.pointerId);
                    this.drags.delete(e.pointerId);
                    if (d) {
                        const court = this.courts[half];
                        if (court.state === 'charge' && court.power > 0.05) court.shoot();
                        else court.state = 'aim';
                    }
                } else if (![...this.pointers.values()].includes(half)) {
                    this.held[half] = false;
                }
            };
            this.canvas.addEventListener('pointerup', endPointer);
            this.canvas.addEventListener('pointercancel', endPointer);
            this.canvas.addEventListener('pointerleave', endPointer);

            window.addEventListener('blur', () => {
                this.held.fill(false);
                this.pointers.clear();
                this.drags.clear();
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

        toMenu() {
            this.state = 'menu';
            this.courts.forEach(c => c.reset());
            this.el.menu.classList.remove('hidden');
            this.el.pause.classList.add('hidden');
            this.el.over.classList.add('hidden');
            this.syncHUD();
        },

        startMatch() {
            Sfx.ensure();
            this.courts.forEach(c => c.reset());
            this.timeLeft = MODES[this.mode].time;
            this.countdown = 3.99;
            this.lastTick = -1;
            this.celebrateT = 0;
            this.held = new Array(this.playerCount).fill(false);
            this.pointers.clear();
            this.drags.clear();
            this.state = 'countdown';
            this.el.menu.classList.add('hidden');
            this.el.pause.classList.add('hidden');
            this.el.over.classList.add('hidden');
            this.syncHints();
            this.syncHUD();
        },

        setPaused(on) {
            if (on && this.state === 'playing') {
                this.state = 'paused';
                this.held.fill(false);
                this.pointers.clear(); this.drags.clear();
                this.el.pause.classList.remove('hidden');
            } else if (!on && this.state === 'paused') {
                this.state = 'playing';
                this.el.pause.classList.add('hidden');
            }
        },

        flashScoreCard(idx) {
            const card = this.cards[idx];
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
                if (MODES[this.mode].time > 0) {
                    this.timeLeft -= dt;
                    const sec = Math.ceil(this.timeLeft);
                    if (sec <= 10 && sec !== this.lastTick && sec > 0) { this.lastTick = sec; Sfx.tick(); }
                    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endMatch(); }
                }
                this.courts.forEach((c, i) => c.update(dt, this.held[i]));

            } else if (this.state === 'celebrate') {
                this.celebrateT += dt;
                this.courts.forEach(c => c.update(dt, false));
                if (this.celebrateT > 4) this.showResultPanel();

            } else if (this.state === 'over') {
                this.courts.forEach(c => c.update(dt, false));
            }

            this.syncHUD();
        },

        endMatch() {
            this.state = 'celebrate';
            this.celebrateT = 0;
            this.held.fill(false);
            this.pointers.clear(); this.drags.clear();
            Sfx.buzzer();

            // Điểm cao nhất thì thắng; nếu nhiều người cùng cao nhất thì hoà
            const top = Math.max(...this.courts.map(c => c.score));
            const leaders = this.courts.filter(c => c.score === top);
            this.courts.forEach(c => {
                if (c.score !== top) c.setOutcome('lose');
                else c.setOutcome(leaders.length > 1 ? 'draw' : 'win');
            });
            setTimeout(() => Sfx.cheer(), 500);
            if (this.courts.some(c => c.outcome === 'lose')) setTimeout(() => Sfx.sob(), 900);
        },

        showResultPanel() {
            this.state = 'over';
            const q = sel => this.el.finals.querySelector(sel);
            const pct = c => c.shots ? Math.round(c.made / c.shots * 100) : 0;

            this.courts.forEach((c, i) => {
                q(`[data-fscore="${i}"]`).textContent = c.score;
                q(`[data-fmade="${i}"]`).textContent = `${c.made}/${c.shots}`;
                q(`[data-facc="${i}"]`).textContent = pct(c) + '%';
                q(`[data-fbest="${i}"]`).textContent = c.bestStreak;
                q(`[data-fswish="${i}"]`).textContent = c.swishes;
                q(`[data-final="${i}"]`).classList.toggle('winner', c.outcome !== 'lose');
            });

            const top = Math.max(...this.courts.map(c => c.score));
            const leaders = this.courts.filter(c => c.score === top);
            const el = id => document.getElementById(id);
            let title, desc, emoji;
            if (leaders.length > 1) {
                title = 'IT\'S A DRAW!';
                desc = `${leaders.map(c => c.cfg.emoji + ' ' + c.cfg.name).join(' and ')} both scored ${top} — perfectly matched!`;
                emoji = '🤝';
            } else {
                const win = leaders[0];
                const others = this.courts.filter(c => c !== win).map(c => c.score).join(' - ');
                title = `${win.cfg.emoji} ${win.cfg.name} WINS!`;
                desc = `Scored ${win.score} points (the others: ${others}).` +
                    `Longest scoring streak: ${win.bestStreak} in a row!`;
                emoji = '🏆';
            }
            el('over-title').textContent = title;
            el('over-desc').textContent = desc;
            el('over-emoji').textContent = emoji;
            this.el.over.classList.remove('hidden');
        },

        syncHUD() {
            this.courts.forEach((c, i) => {
                this.scoreEls[i].textContent = c.score;
                this.streakEls[i].textContent = (c.onFire ? '🔥 ' : '') + 'Streak:' + c.streak;
                this.streakEls[i].classList.toggle('fire', c.onFire);
                this.accEls[i].textContent = `${c.made}/${c.shots}`;
            });

            if (MODES[this.mode].time > 0) {
                const t = Math.max(0, Math.ceil(this.timeLeft));
                const m = Math.floor(t / 60), s = t % 60;
                this.el.clock.textContent = `${m}:${String(s).padStart(2, '0')}`;
                this.el.clock.classList.toggle('urgent', t <= 10 && this.state === 'playing');
                if (this.el.clockLabel) this.el.clockLabel.textContent = MODES[this.mode].name;
            } else {
                this.el.clock.textContent = '∞';
                this.el.clock.classList.remove('urgent');
                if (this.el.clockLabel) this.el.clockLabel.textContent = 'PRACTICE';
            }
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
            // Vạch chia đôi chỉ có nghĩa khi hai bé đối đầu; từ 3 sân trở lên
            // nó sẽ nằm vắt ngang sân của bé ở giữa nên bỏ hẳn.
            if (this.playerCount === 2) this.drawDivider(ctx);
            if (this.state === 'countdown') this.drawCountdown(ctx);

            ctx.restore();
        },

        drawDivider(ctx) {
            const g = ctx.createLinearGradient(W / 2 - 14, 0, W / 2 + 14, 0);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(0.5, 'rgba(4,7,18,0.95)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(W / 2 - 16, 0, 32, H);

            ctx.save();
            ctx.strokeStyle = 'rgba(255,215,0,0.6)';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255,215,0,0.7)';
            ctx.shadowBlur = 16;
            ctx.setLineDash([14, 12]);
            ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
            ctx.restore();
        },

        drawCountdown(ctx) {
            const n = Math.ceil(this.countdown);
            const frac = this.countdown - Math.floor(this.countdown);
            const label = n > 0 ? String(n) : 'GO!';
            const scale = n > 0 ? 1 + (1 - frac) * 0.5 : 1.2;

            ctx.save();
            ctx.fillStyle = 'rgba(4,7,18,0.55)';
            ctx.fillRect(0, 0, W, H);
            ctx.translate(W / 2, H / 2);
            ctx.scale(scale, scale);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 128px "Baloo 2", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(255,215,0,0.8)';
            ctx.shadowBlur = 40;
            ctx.globalAlpha = clamp(frac * 2.2, 0, 1);
            ctx.fillText(label, 0, 0);
            ctx.restore();
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
