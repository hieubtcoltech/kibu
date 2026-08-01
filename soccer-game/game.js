/* =========================================================
   SUPER STRIKER — Bóng đá mini cho 2 đến 4 bé trên cùng 1 máy
   Kĩ năng: rê bóng · chuyền bóng (bấm nhanh) · sút nhẹ / sút mạnh (giữ lâu)
   ========================================================= */
(() => {
    'use strict';

    // ---------- Sân đấu ----------
    // Vẽ theo luật FUTSAL, quy về sân mini 26m x 13m: 1 mét = 40 pixel.
    const W = 1240, H = 720;
    const PPM = 40;                       // pixel trên mét
    const M = m => m * PPM;

    const PITCH = { x: 70, y: 80, w: M(27.5), h: M(14) };
    const PR = PITCH.x + PITCH.w, PB = PITCH.y + PITCH.h;
    const MID_X = PITCH.x + PITCH.w / 2, MID_Y = PITCH.y + PITCH.h / 2;

    const GOAL_H = M(4.8);                // miệng khung thành 4,8m
                                          // (futsal thật 3m — nới rộng cho bé ghi bàn được qua thủ môn)
    const GOAL_D = M(1.1);                // chiều sâu lưới
    const GOAL_T = MID_Y - GOAL_H / 2;
    const GOAL_B = MID_Y + GOAL_H / 2;
    const GOAL_Z = M(2.2);                // xà ngang cao 2,2m
    const GOAL_BZ = M(1.35);              // mép sau lưới thấp hơn -> mái lưới dốc

    // Vạch sân theo futsal
    const PEN_R = M(3.5);                 // vòng cung vòng cấm, tâm ở chân cột dọc
    const PEN_SPOT = M(5);                // chấm phạt đền
    const PEN2_SPOT = M(8);               // chấm phạt đền thứ hai
    const CENTER_R = M(2.5);              // vòng tròn giữa sân
    const CORNER_R = M(0.5);              // cung phạt góc
    const SUB_ZONE = M(2.5);              // khu thay người hai bên vạch giữa

    /* ---------- Góc nhìn 2.5D ----------
       Mọi tính toán bóng lăn, va chạm, cướp bóng… vẫn diễn ra trên mặt sân
       phẳng nhìn từ trên xuống như cũ. Chỉ tới lúc VẼ mới chiếu mặt sân qua
       một máy quay đặt cao phía sau khán đài gần: nửa sân xa co nhỏ lại,
       cầu thủ đứng thẳng như người thật, khung thành thành khối ba chiều.

       Đây là phép chiếu phối cảnh thật (kiểu lỗ kim) nên đường thẳng dưới
       sân vẫn là đường thẳng trên màn hình — chỉ cần chiếu hai đầu mút. */
    const CAM = {
        near: 606,       // biên dọc gần nằm ở dòng này trên màn hình
        far: 0.70,       // biên dọc xa chỉ còn 70% bề ngang
        tilt: 1.15       // độ nén chiều sâu ngay sát máy quay
    };
    CAM.A = CAM.tilt * PITCH.h / (1 / CAM.far - 1);
    CAM.horizon = CAM.near - CAM.A;          // điểm tụ (nằm ngoài màn hình)
    CAM.vx = MID_X;

    // Hệ số thu nhỏ tại chiều sâu y: 1 ở biên gần, CAM.far ở biên xa
    const dscale = y => 1 / (1 + (PB - y) / PITCH.h * (1 / CAM.far - 1));
    // Toạ độ màn hình. h = độ cao so với mặt cỏ (tính bằng pixel lúc ở sát máy quay)
    const sx_ = (x, y) => CAM.vx + (x - CAM.vx) * dscale(y);
    const sy_ = (y, h) => CAM.horizon + (CAM.A - (h || 0)) * dscale(y);

    // Nối các điểm dưới sân thành một đường trên màn hình. Mỗi điểm: [x, y, cao]
    const pPath = (ctx, pts, close) => {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
            const q = pts[i];
            const px = sx_(q[0], q[1]), py = sy_(q[1], q[2]);
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        if (close) ctx.closePath();
    };
    // Cung tròn vẽ dưới sân: lên màn hình thành hình bầu dục nghiêng
    const pArc = (ctx, cx, cy, r, a0, a1, n) => {
        const N = n || 44;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
            const a = a0 + (a1 - a0) * i / N;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            const px = sx_(x, y), py = sy_(y);
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
    };

    // ---------- Cầu thủ & bóng ----------
    const P_R = 20;                       // bán kính cầu thủ (to hơn cho dễ nhìn)
    const K_R = 18;                       // thủ môn
    const B_R = 11;                       // bán kính bóng (to hơn cho dễ nhìn)
    const P_ACC = 1500;                   // gia tốc chạy
    const P_MAX = 240;                    // tốc độ tối đa
    const P_DRAG = 7.5;                   // ma sát chân
    const DRIBBLE_SLOW = 0.9;             // giữ bóng thì chạy chậm hơn chút

    const BALL_DRAG = 175;                // ma sát lăn của bóng trên cỏ
    const BALL_WALL_E = 0.72;             // độ nảy khi đập thành
    const BALL_PLAYER_E = 0.9;            // bóng bật khỏi người

    const PICKUP_R = P_R + B_R + 9;       // tầm với để nhặt bóng tự do
    const STEAL_R = P_R + B_R + 13;       // chạm được vào bóng trong tầm này là cướp được
    const DRIBBLE_LEAD = P_R + B_R + 4;   // bóng nằm trước mũi chân bao xa
    const DRIBBLE_K = 15;                 // độ "dính" của bóng khi rê

    const TAP_TIME = 0.19;                // bấm nhanh hơn ngần này = chuyền
    const CHARGE_TIME = 0.85;             // giữ đủ lâu thì lực sút đạt 100%
    const SOFT_LIMIT = 0.45;              // dưới mức này gọi là sút nhẹ

    const PASS_SPEED = 430;
    const SHOT_MIN = 460, SHOT_MAX = 880;
    const LOSS_LOCK = 0.42;               // mất bóng xong bao lâu mới được nhặt lại

    // Đá xoáy: quả bóng vừa bay vừa bẻ cong dần, đổi lại lực sút yếu hơn một chút
    const CURVE_RATE = 1.25;              // tốc độ bẻ cong lúc đầu (rad/giây)
    const CURVE_DECAY = 1.8;              // độ xoáy tắt dần
    const CURVE_POWER = 0.84;             // sút xoáy thì lực chỉ còn ngần này

    // ---------- Đội & người chơi ----------
    const TEAMS = [
        { name: 'RED TEAM', color: '#ff4d4d', dark: '#a81f1f', light: '#ff9a9a', glow: '255,77,77' },
        { name: 'BLUE TEAM', color: '#3da5ff', dark: '#14538f', light: '#a8d8ff', glow: '61,165,255' }
    ];

    // Bốn bộ phím trải đều bàn phím để 4 bé ngồi cạnh nhau không vướng tay
    const CONTROLS = [
        { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', act: 'KeyQ', curve: 'KeyE', label: 'W A S D', actLabel: 'Q', curveLabel: 'E' },
        { up: 'KeyT', down: 'KeyG', left: 'KeyF', right: 'KeyH', act: 'KeyR', curve: 'KeyY', label: 'T F G H', actLabel: 'R', curveLabel: 'Y' },
        { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', act: 'KeyU', curve: 'KeyO', label: 'I J K L', actLabel: 'U', curveLabel: 'O' },
        { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', act: 'Slash', curve: 'Period', label: '↑ ← ↓ →', actLabel: '/', curveLabel: '.' }
    ];

    // Bé nào dùng bộ phím nào, và thuộc đội nào
    const SLOTS = { 2: [0, 3], 3: [0, 1, 3], 4: [0, 1, 2, 3] };
    const TEAM_OF = { 2: [0, 1], 3: [0, 0, 1], 4: [0, 0, 1, 1] };

    const NAMES = ['KID 1', 'KID 2', 'KID 3', 'KID 4'];
    const EMOJIS = ['🐯', '🐼', '🐸', '🦊'];

    const MATCH_TIMES = { short: 90, normal: 150, long: 240 };

    // ---------- Đá luân lưu khi hai đội hoà ----------
    const PK_ROUNDS = 3;                  // mỗi đội đá 3 quả, hoà tiếp thì đấu súng
    const PK_SWEEP = 1.5;                 // tốc độ vạch ngắm chạy lên xuống (đơn vị/giây)
    const PK_CHARGE = 1.25;               // tốc độ thanh lực
    const PK_MIN = 520, PK_MAX = 900;     // lực sút yếu nhất / mạnh nhất
    const PK_AIM_PAD = M(0.55);           // vạch ngắm quét lố ra ngoài cột dọc chút -> sút hụt được
    const PK_RESULT = 1.7;                // xem kết quả bao lâu rồi tới lượt sau

    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

    // =========================================================
    //  Quả bóng: dựng như một khối cầu thật.
    //  Hoa văn Telstar (12 mảng đen ngũ giác + 20 mảng trắng lục giác) chính là
    //  sơ đồ Voronoi trên mặt cầu của 12 đỉnh khối 20 mặt và 20 đỉnh khối 12 mặt.
    //  Bóng lăn thì cả khối cầu quay, hoa văn trôi qua mặt bóng rồi khuất xuống
    //  dưới — chứ không xoay tròn tại chỗ như bánh xe.
    // =========================================================
    const BALL_TEX = 34;                  // độ phân giải ảnh bề mặt bóng
    const norm3 = v => { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; };

    const PENT_C = [], HEX_C = [];        // tâm các mảng ngũ giác / lục giác
    {
        const P = (1 + Math.sqrt(5)) / 2, IP = 1 / P;
        for (const a of [1, -1]) for (const b of [1, -1]) {
            PENT_C.push(norm3([0, a, b * P]), norm3([a, b * P, 0]), norm3([b * P, 0, a]));
        }
        for (const a of [1, -1]) for (const b of [1, -1]) {
            for (const c of [1, -1]) HEX_C.push(norm3([a, b, c]));
            HEX_C.push(norm3([0, a * IP, b * P]), norm3([a * IP, b * P, 0]), norm3([b * P, 0, a * IP]));
        }
    }
    const BALL_LIGHT = norm3([-0.36, -0.46, 0.81]);
    const BALL_HALF = norm3([BALL_LIGHT[0], BALL_LIGHT[1], BALL_LIGHT[2] + 1]);

    // Quay ma trận hướng quanh trục k một góc ang (Rodrigues), m = R·m
    function rotateOri(m, kx, ky, kz, ang) {
        const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
        const r0 = t * kx * kx + c, r1 = t * kx * ky - s * kz, r2 = t * kx * kz + s * ky;
        const r3 = t * kx * ky + s * kz, r4 = t * ky * ky + c, r5 = t * ky * kz - s * kx;
        const r6 = t * kx * kz - s * ky, r7 = t * ky * kz + s * kx, r8 = t * kz * kz + c;
        const a0 = m[0], a1 = m[1], a2 = m[2], a3 = m[3], a4 = m[4], a5 = m[5], a6 = m[6], a7 = m[7], a8 = m[8];
        m[0] = r0 * a0 + r1 * a3 + r2 * a6; m[1] = r0 * a1 + r1 * a4 + r2 * a7; m[2] = r0 * a2 + r1 * a5 + r2 * a8;
        m[3] = r3 * a0 + r4 * a3 + r5 * a6; m[4] = r3 * a1 + r4 * a4 + r5 * a7; m[5] = r3 * a2 + r4 * a5 + r5 * a8;
        m[6] = r6 * a0 + r7 * a3 + r8 * a6; m[7] = r6 * a1 + r7 * a4 + r8 * a7; m[8] = r6 * a2 + r7 * a5 + r8 * a8;
    }

    function orthonormalize(m) {
        let n = Math.hypot(m[0], m[1], m[2]);
        m[0] /= n; m[1] /= n; m[2] /= n;
        const d = m[3] * m[0] + m[4] * m[1] + m[5] * m[2];
        m[3] -= d * m[0]; m[4] -= d * m[1]; m[5] -= d * m[2];
        n = Math.hypot(m[3], m[4], m[5]);
        m[3] /= n; m[4] /= n; m[5] /= n;
        m[6] = m[1] * m[5] - m[2] * m[4];
        m[7] = m[2] * m[3] - m[0] * m[5];
        m[8] = m[0] * m[4] - m[1] * m[3];
    }

    /* Bóng lăn không trượt: đi được quãng đường d thì quay d/R quanh trục
       nằm ngang vuông góc với hướng đi. */
    function rollBall(b, dx, dy) {
        const d = Math.hypot(dx, dy);
        if (d < 0.0005) return;
        rotateOri(b.ori, -dy / d, dx / d, 0, d / B_R);
        b.texDirty = true;
    }

    function renderBallTex(b) {
        if (!b.tex) {
            b.tex = document.createElement('canvas');
            b.tex.width = b.tex.height = BALL_TEX;
            b.texCtx = b.tex.getContext('2d');
            b.texImg = b.texCtx.createImageData(BALL_TEX, BALL_TEX);
        }
        orthonormalize(b.ori);
        const m = b.ori, data = b.texImg.data;
        let p = 0;
        for (let j = 0; j < BALL_TEX; j++) {
            const ny = (j + 0.5) / BALL_TEX * 2 - 1;
            for (let i = 0; i < BALL_TEX; i++, p += 4) {
                const nx = (i + 0.5) / BALL_TEX * 2 - 1;
                const d2 = nx * nx + ny * ny;
                if (d2 >= 1) { data[p + 3] = 0; continue; }
                const nz = Math.sqrt(1 - d2);

                // Pháp tuyến đổi sang hệ toạ độ gắn với quả bóng
                const lx = m[0] * nx + m[3] * ny + m[6] * nz;
                const ly = m[1] * nx + m[4] * ny + m[7] * nz;
                const lz = m[2] * nx + m[5] * ny + m[8] * nz;

                // Ô Voronoi gần nhất quyết định điểm này thuộc mảng đen hay trắng
                let bestP = -2, bestH = -2, second = -2;
                for (const c of PENT_C) {
                    const dp = lx * c[0] + ly * c[1] + lz * c[2];
                    if (dp > bestP) { second = bestP; bestP = dp; } else if (dp > second) second = dp;
                }
                for (const c of HEX_C) {
                    const dp = lx * c[0] + ly * c[1] + lz * c[2];
                    if (dp > bestH) { second = Math.max(second, bestH); bestH = dp; }
                    else if (dp > second) second = dp;
                }
                const top = Math.max(bestP, bestH);
                const black = bestP > bestH;
                const seam = (top - second) < 0.035;         // đường chỉ khâu giữa hai mảng

                let base = black ? 26 : 244;
                if (seam) base = black ? 12 : 96;

                let diff = nx * BALL_LIGHT[0] + ny * BALL_LIGHT[1] + nz * BALL_LIGHT[2];
                if (diff < 0) diff = 0;
                const shade = 0.32 + 0.74 * diff;
                let spec = 0;
                const sp = nx * BALL_HALF[0] + ny * BALL_HALF[1] + nz * BALL_HALF[2];
                if (sp > 0) { const s2 = sp * sp, s4 = s2 * s2, s8 = s4 * s4; spec = s8 * s8 * s4 * 170; }

                const v = Math.min(255, base * shade + spec);
                data[p] = v; data[p + 1] = v; data[p + 2] = Math.min(255, v * 1.01);
                const edge = (1 - Math.sqrt(d2)) * (BALL_TEX * 0.5);
                data[p + 3] = edge >= 1 ? 255 : edge * 255;
            }
        }
        b.texCtx.putImageData(b.texImg, 0, 0);
        b.texDirty = false;
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
        tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null) {
            if (!this.on) return;
            const ac = this.ensure();
            if (!ac) return;
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, ac.currentTime);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), ac.currentTime + dur);
            g.gain.setValueAtTime(0.0001, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), ac.currentTime + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
            o.connect(g); g.connect(ac.destination);
            o.start(); o.stop(ac.currentTime + dur + 0.02);
        },
        noise(dur = 0.14, vol = 0.12, hp = 800) {
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
        kick(p) { this.tone(180 + p * 160, 0.1, 'triangle', 0.12 + p * 0.14, 90); this.noise(0.06, 0.05 + p * 0.07, 1200); },
        pass() { this.tone(300, 0.08, 'triangle', 0.1, 210); },
        steal() { this.noise(0.1, 0.1, 1800); this.tone(520, 0.07, 'square', 0.07, 320); },
        wall(v) { const p = clamp(v / 700, 0.05, 1); this.tone(150, 0.08, 'sine', 0.03 + p * 0.08, 90); },
        post() { this.tone(880, 0.16, 'square', 0.14, 620); },
        goal() {
            this.noise(1.0, 0.1, 260);
            [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.17), i * 110));
        },
        whistle() { this.tone(2100, 0.22, 'square', 0.1, 2500); setTimeout(() => this.tone(2100, 0.3, 'square', 0.1, 1900), 240); },
        tick() { this.tone(880, 0.07, 'square', 0.09); },
        cheer() { this.noise(1.3, 0.11, 300); [659, 784, 988, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.16), i * 140)); },
        sob() { [420, 350, 290, 240].forEach((f, i) => setTimeout(() => this.tone(f, 0.44, 'sine', 0.1, f * 0.7), i * 270)); }
    };

    // =========================================================
    //  Thủ môn (máy tự điều khiển)
    //  Chạy dọc vạch vôi bám theo bóng, đổ người cứu thua, bắt gọn bóng
    //  chậm rồi phát lên cho đồng đội.
    // =========================================================
    const GK_SPEED = 140;                 // chậm hơn cầu thủ nên bé vẫn ghi bàn được
    const GK_REACT = 0.38;                // độ trễ phản xạ: chưa kịp đổi hướng ngay khi bóng vừa rời chân
    const GK_RANGE = GOAL_H / 2 + M(0.6); // chạy quanh khung thành chừng này
    const GK_CATCH_V = 380;               // bóng chậm hơn ngần này thì bắt gọn
    const GK_HOLD = 1.1;                  // ôm bóng bao lâu rồi phát lên

    /* ---------------------------------------------------------
       Vẽ một người ĐỨNG THẲNG trên sân.
       Gốc toạ độ đặt ở bàn chân, trục y đi lên là số âm. Mọi số đo viết
       theo cỡ lúc người đứng sát máy quay, rồi nhân hệ số xa gần dscale()
       nên càng chạy lên phía trên sân người càng nhỏ đi.
       --------------------------------------------------------- */
    const FIG = {
        headR: 9.4,
        headY: -50,
        shoulderY: -39,
        hipY: -23,
        shoulderW: 11,
        hipW: 8,
        legW: 5.8,
        armW: 4.6
    };
    const SKIN = '#f2c89c', SKIN_DK = '#c9975f';

    /* o = {
         dir     : +1 quay mặt sang phải màn hình, -1 sang trái
         front   : -1 quay lưng lại người xem … +1 quay mặt về phía người xem
         swing   : nhịp sải chân (-1..1)      kick: 0..1 lúc vung chân sút
         armUp   : 0..1 giơ tay ăn mừng       droop: 0..1 gục xuống buồn
         lift    : nhấc khỏi mặt cỏ bao nhiêu (nhảy lên / bay người)
         lean    : nghiêng cả người (thủ môn đổ)
         kit/kitDark/kitLight/shorts/socks/glove/hair : màu
         number  : số áo, vẽ ngửa mặt nên không bị lộn ngược
       } */
    function drawHuman(ctx, wx, wy, o) {
        const s = dscale(wy);
        const px = sx_(wx, wy), py = sy_(wy, o.lift || 0);
        const kick = o.kick || 0, armUp = o.armUp || 0, droop = o.droop || 0;

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(s, s * (1 - droop * 0.12));
        if (o.lean) ctx.rotate(o.lean);

        ctx.save();
        ctx.scale(o.dir, 1);                     // lật trái/phải, chữ vẽ sau khi restore

        const legLen = -FIG.hipY;
        const leg = (side, ang) => {
            ctx.save();
            ctx.translate(side * FIG.hipW * 0.52, FIG.hipY);
            ctx.rotate(ang);
            ctx.fillStyle = SKIN;
            ctx.beginPath(); ctx.roundRect(-FIG.legW / 2, -1, FIG.legW, legLen + 1, FIG.legW / 2); ctx.fill();
            ctx.fillStyle = o.socks;             // tất cao cổ
            ctx.beginPath(); ctx.roundRect(-FIG.legW / 2, legLen * 0.52, FIG.legW, legLen * 0.34, 1.8); ctx.fill();
            ctx.fillStyle = '#f4f7fb';           // giày
            ctx.beginPath(); ctx.roundRect(-FIG.legW / 2, legLen - 3.6, FIG.legW + 4.6, 4.4, 2); ctx.fill();
            ctx.fillStyle = o.kitDark;
            ctx.beginPath(); ctx.roundRect(-FIG.legW / 2, legLen - 1.1, FIG.legW + 4.6, 1.6, 0.8); ctx.fill();
            ctx.restore();
        };
        const arm = (side, ang) => {
            ctx.save();
            ctx.translate(side * FIG.shoulderW * 0.74, FIG.shoulderY + 2.5);
            ctx.rotate(ang);
            ctx.fillStyle = o.kit;               // tay áo
            ctx.beginPath(); ctx.roundRect(-FIG.armW / 2, -1.5, FIG.armW, 8.5, FIG.armW / 2); ctx.fill();
            ctx.fillStyle = SKIN;                // cẳng tay
            ctx.beginPath(); ctx.roundRect(-FIG.armW / 2 + 0.4, 6.5, FIG.armW - 0.8, 9, 1.9); ctx.fill();
            if (o.glove) {                       // găng thủ môn to bản
                ctx.fillStyle = o.glove;
                ctx.beginPath(); ctx.roundRect(-FIG.armW / 2 - 1.4, 14.5, FIG.armW + 2.8, 6.6, 2.6); ctx.fill();
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                ctx.beginPath(); ctx.roundRect(-FIG.armW / 2 - 1.4, 19, FIG.armW + 2.8, 2, 1); ctx.fill();
            }
            ctx.restore();
        };

        // --- tay & chân phía XA vẽ trước cho lọt ra sau thân ---
        const sw = (o.swing || 0) * 0.5;
        ctx.globalAlpha = 0.82;
        leg(-1, -sw - kick * 0.15);
        arm(-1, armUp ? -2.5 : (droop ? 0.35 : sw * 0.8) + (o.spread || 0));
        ctx.globalAlpha = 1;

        // --- thân áo ---
        const sw2 = FIG.shoulderW, hw2 = FIG.hipW;
        const tg = ctx.createLinearGradient(0, FIG.shoulderY, 0, FIG.hipY);
        tg.addColorStop(0, o.kitLight);
        tg.addColorStop(0.5, o.kit);
        tg.addColorStop(1, o.kitDark);
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.moveTo(-sw2, FIG.shoulderY + 3);
        ctx.quadraticCurveTo(0, FIG.shoulderY - 3.5, sw2, FIG.shoulderY + 3);
        ctx.quadraticCurveTo(sw2 + 0.6, FIG.hipY * 0.45, hw2, FIG.hipY + 1);
        ctx.lineTo(-hw2, FIG.hipY + 1);
        ctx.quadraticCurveTo(-sw2 - 0.6, FIG.hipY * 0.45, -sw2, FIG.shoulderY + 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        // sọc áo dọc
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath(); ctx.roundRect(-1.6, FIG.shoulderY + 2, 3.2, FIG.hipY - FIG.shoulderY, 1); ctx.fill();
        // quần đùi
        ctx.fillStyle = o.shorts;
        ctx.beginPath(); ctx.roundRect(-hw2 - 1, FIG.hipY - 1.5, (hw2 + 1) * 2, 9.5, 2.6); ctx.fill();

        // --- tay & chân phía GẦN ---
        leg(1, sw + kick * 1.0);
        arm(1, armUp ? 2.5 : (droop ? -0.35 : -sw * 0.8) - (o.spread || 0));

        // --- đầu ---
        const hx = 0.6 + (o.front || 0) * -0.6;
        ctx.fillStyle = SKIN;
        ctx.beginPath(); ctx.arc(hx, FIG.headY, FIG.headR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = SKIN_DK;                                  // bóng dưới cằm
        ctx.beginPath(); ctx.arc(hx, FIG.headY, FIG.headR, Math.PI * 0.18, Math.PI * 0.82); ctx.fill();
        ctx.fillStyle = o.hair || '#2c1c12';
        ctx.beginPath();
        if ((o.front || 0) < -0.3) ctx.arc(hx, FIG.headY, FIG.headR, 0, Math.PI * 2);   // quay lưng: chỉ thấy tóc
        else ctx.arc(hx, FIG.headY, FIG.headR, Math.PI * 0.62, Math.PI * 1.94);
        ctx.fill();
        if ((o.front || 0) >= -0.3) {                             // mắt + miệng
            ctx.fillStyle = '#241608';
            const eyes = (o.front || 0) > 0.3 ? [-1.6, 3.2] : [2.8];
            for (const ex of eyes) {
                ctx.beginPath(); ctx.ellipse(hx + ex, FIG.headY - 0.5, 0.95, 1.35, 0, 0, Math.PI * 2); ctx.fill();
            }
            ctx.strokeStyle = 'rgba(120,60,40,0.75)';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.arc(hx + 1.4, FIG.headY + 2.6, 2.4, droop ? Math.PI * 1.15 : Math.PI * 0.1, droop ? Math.PI * 1.85 : Math.PI * 0.9);
            ctx.stroke();
        }
        ctx.restore();                       // hết phần bị lật trái/phải

        // --- số áo: vẽ ở hệ toạ độ KHÔNG lật nên không bao giờ bị ngược ---
        if (o.number) {
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = 'bold 11px "Baloo 2", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(o.number), 0, (FIG.shoulderY + FIG.hipY) / 2 + 1);
        }
        ctx.restore();
    }

    class Keeper {
        constructor(team) {
            this.team = team;
            this.cfg = TEAMS[team];
            this.homeX = team === 0 ? PITCH.x + M(0.7) : PR - M(0.7);
            this.reset();
        }

        reset() {
            this.x = this.homeX;
            this.y = MID_Y;
            this.vy = 0;
            this.dive = 0;        // -1 lên, +1 xuống, 0 đứng yên
            this.diveT = 0;
            this.holdT = 0;
            this.saveFlash = 0;
            this.reactT = 0;      // đang trong khoảng "chưa kịp phản xạ"
            this.aimY = MID_Y;    // điểm thủ môn đang nhắm tới
            this.lastVx = 0; this.lastVy = 0;
        }

        get radius() { return K_R + this.diveT * 7; }   // đổ người thì với xa hơn

        update(dt, ball) {
            this.saveFlash = Math.max(0, this.saveFlash - dt * 2);
            this.diveT = Math.max(0, this.diveT - dt * 2.2);

            // Đang ôm bóng: đếm giờ rồi phát lên
            if (this.holdT > 0) {
                this.holdT -= dt;
                ball.x = this.x + (this.team === 0 ? 1 : -1) * (K_R + B_R + 2);
                ball.y = this.y;
                ball.vx = 0; ball.vy = 0;
                if (this.holdT <= 0) Game.keeperClear(this);
                return;
            }

            // Bóng vừa đổi hướng đột ngột (có người sút) -> mất một nhịp mới phản xạ được
            const dv = Math.hypot(ball.vx - this.lastVx, ball.vy - this.lastVy);
            if (dv > 260) this.reactT = GK_REACT;
            this.lastVx = ball.vx; this.lastVy = ball.vy;
            this.reactT = Math.max(0, this.reactT - dt);

            const towardMe = this.team === 0 ? ball.x < MID_X : ball.x > MID_X;

            if (this.reactT <= 0) {
                let targetY = MID_Y;
                const vx = ball.vx;
                const comingIn = this.team === 0 ? vx < -30 : vx > 30;
                const t = comingIn ? Math.abs((this.x - ball.x) / vx) : 99;

                if (comingIn && t < 1.6) {
                    // Bóng đang bay tới: lao ra đúng chỗ nó sẽ cắt vạch vôi
                    targetY = ball.y + ball.vy * t;
                } else if (towardMe) {
                    /* Chưa có cú sút: đứng che GÓC chứ không bám sát toạ độ bóng.
                       Bóng còn xa thì chỉ nhích nhẹ khỏi giữa khung — nhờ vậy bé
                       chạy dạt sang một bên rồi sút vẫn còn khe trống để ghi bàn. */
                    const far = Math.abs(ball.x - this.x);
                    const near = clamp(1 - far / M(13), 0.28, 1);
                    targetY = MID_Y + (ball.y - MID_Y) * near;
                }
                this.aimY = clamp(targetY, MID_Y - GK_RANGE, MID_Y + GK_RANGE);
            }

            const dy = this.aimY - this.y;
            const want = clamp(dy * 4, -GK_SPEED, GK_SPEED);
            this.vy = lerp(this.vy, want, 1 - Math.exp(-7 * dt));
            this.y += this.vy * dt;
            this.y = clamp(this.y, MID_Y - GK_RANGE, MID_Y + GK_RANGE);

            // Bóng tới gần và nhanh -> bung người ra cản
            const d = dist(ball.x, ball.y, this.x, this.y);
            const speed = Math.hypot(ball.vx, ball.vy);
            if (towardMe && d < M(3) && speed > 320 && this.diveT <= 0.01) {
                this.diveT = 1;
                this.dive = Math.sign(ball.y - this.y) || 1;
            }

            // Nhích ra/vào để thu hẹp góc sút
            const closeness = clamp(1 - d / M(6), 0, 1);
            const out = (this.team === 0 ? 1 : -1) * closeness * M(0.5);
            this.x = lerp(this.x, this.homeX + out, 1 - Math.exp(-6 * dt));
        }

        /* Thủ môn vẽ như người thật giống cầu thủ, nhưng mặc áo dài tay màu
           nổi, đeo găng to, đứng tấn hai chân dang rộng. Đổ người thì cả thân
           vươn dài ra theo hướng bay và hai tay với xa hơn hẳn. */
        draw(ctx, time) {
            const dive = this.diveT;
            const s = dscale(this.y);
            const inward = this.team === 0 ? 1 : -1;          // luôn quay mặt vào trong sân

            // Bóng đổ dưới chân
            ctx.fillStyle = 'rgba(0,0,0,0.32)';
            ctx.beginPath();
            ctx.ellipse(sx_(this.x, this.y), sy_(this.y),
                K_R * (0.95 + dive * 0.35) * s, K_R * 0.36 * s, 0, 0, Math.PI * 2);
            ctx.fill();

            // Vòng sáng khi vừa cứu thua
            if (this.saveFlash > 0) {
                ctx.save();
                ctx.strokeStyle = `rgba(255,215,0,${this.saveFlash})`;
                ctx.lineWidth = 3.5 * s;
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 22 * this.saveFlash;
                ctx.beginPath();
                ctx.ellipse(sx_(this.x, this.y), sy_(this.y), (K_R + 11) * s, (K_R + 11) * 0.4 * s, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            drawHuman(ctx, this.x, this.y, {
                dir: inward,
                front: 0.18,                                   // đứng nghiêng, mặt hướng ra sân
                swing: Math.sin(this.y * 0.09) * (1 - dive),
                spread: 0.62 + dive * 0.72,                    // hai tay dang rộng, đổ người thì dang hết cỡ
                lift: dive * M(0.5),                           // bay người khỏi mặt cỏ
                lean: dive * 0.3 * (this.dive || 1) * inward,
                kit: '#f7d84a', kitDark: '#b9931a', kitLight: '#ffef9f',
                shorts: '#2b2b33', socks: '#2b2b33',
                glove: '#2ee06a', hair: '#3a2414',
                number: 1
            });

            // Nhãn
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `bold ${(11 * (0.78 + 0.22 * s)).toFixed(1)}px "Nunito", sans-serif`;
            const ly = sy_(this.y) + 16 * s;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText('GOALIE', sx_(this.x, this.y), ly + 1);
            ctx.fillStyle = '#ffe98a';
            ctx.fillText('GOALIE', sx_(this.x, this.y), ly);
            ctx.restore();
        }
    }

    // =========================================================
    //  Cầu thủ
    // =========================================================
    class Player {
        constructor(idx, slot, team, count) {
            this.idx = idx;
            this.ctrl = CONTROLS[slot];
            this.team = team;
            this.cfg = TEAMS[team];
            this.name = NAMES[idx];
            this.emoji = EMOJIS[idx];
            // 3 bé: bên có một mình được tăng tốc và mạnh chân hơn cho cân sức
            const solo = count === 3 && TEAM_OF[3].filter(t => t === team).length === 1;
            this.solo = solo;
            this.speedMul = solo ? 1.14 : 1;
            this.powerMul = solo ? 1.12 : 1;
            this.reset();
            this.goals = 0;
            this.passes = 0;
            this.steals = 0;
            this.shots = 0;
            this.curves = 0;
        }

        reset(x, y) {
            this.x = x ?? MID_X; this.y = y ?? MID_Y;
            this.vx = 0; this.vy = 0;
            this.fx = this.team === 0 ? 1 : -1; this.fy = 0;   // hướng mặt
            this.charge = 0;
            this.holding = false;
            this.curveMode = false;
            this.holdT = 0;
            this.lockT = 0;        // vừa mất bóng thì chưa nhặt lại được
            this.step = 0;         // pha bước chân
            this.kickAnim = 0;
            this.outcome = null;
            this.celebrate = null;    // 'happy' khi đội mình ghi bàn, 'sad' khi thủng lưới
            this.celebT = 0;
            this.tears = [];
        }

        get maxSpeed() { return P_MAX * this.speedMul * (Game.owner === this.idx ? DRIBBLE_SLOW : 1); }

        update(dt, keys) {
            this.lockT = Math.max(0, this.lockT - dt);
            this.kickAnim = Math.max(0, this.kickAnim - dt * 3);

            if (this.outcome) { this.updateCelebration(dt); return; }

            // Vừa ghi bàn / vừa thủng lưới: đứng lại ăn mừng hoặc tiếc nuối
            if (this.celebrate) {
                this.celebT += dt;
                this.vx *= Math.exp(-6 * dt);
                this.vy *= Math.exp(-6 * dt);
                this.x += this.vx * dt; this.y += this.vy * dt;
                if (this.celebrate === 'sad' && Math.random() < dt * 3) {
                    this.tears.push({ x: this.x + rnd(-6, 6), y: this.y - 4, vy: rnd(40, 80), life: 0.9 });
                }
                for (let i = this.tears.length - 1; i >= 0; i--) {
                    const t = this.tears[i];
                    t.life -= dt; t.vy += 300 * dt; t.y += t.vy * dt;
                    if (t.life <= 0) this.tears.splice(i, 1);
                }
                return;
            }

            let ax = 0, ay = 0;
            if (Game.state === 'playing') {
                if (keys[this.ctrl.left]) ax -= 1;
                if (keys[this.ctrl.right]) ax += 1;
                if (keys[this.ctrl.up]) ay -= 1;
                if (keys[this.ctrl.down]) ay += 1;
            }
            const mag = Math.hypot(ax, ay);
            if (mag > 0) {
                ax /= mag; ay /= mag;
                this.fx = ax; this.fy = ay;               // quay mặt theo hướng chạy
                this.vx += ax * P_ACC * this.speedMul * dt;
                this.vy += ay * P_ACC * this.speedMul * dt;
            }

            // Ma sát chân
            const k = Math.exp(-P_DRAG * dt);
            this.vx *= k; this.vy *= k;

            const sp = Math.hypot(this.vx, this.vy);
            const lim = this.maxSpeed;
            if (sp > lim) { this.vx *= lim / sp; this.vy *= lim / sp; }

            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.step += sp * dt * 0.055;

            // Không cho chạy ra ngoài sân
            this.x = clamp(this.x, PITCH.x + P_R, PR - P_R);
            this.y = clamp(this.y, PITCH.y + P_R, PB - P_R);

            // Nạp lực sút
            if (this.holding) {
                this.holdT += dt;
                this.charge = clamp(this.holdT / CHARGE_TIME, 0, 1);
            }
        }

        /* ----- Bấm / nhả phím hành động -----
           Hai phím: phím thường và phím ĐÁ XOÁY. Cả hai đều bấm nhanh = chuyền,
           giữ rồi thả = sút; khác nhau ở chỗ phím xoáy làm bóng bay cong. */
        pressAct(curve = false) {
            if (Game.state !== 'playing' || this.outcome || this.celebrate) return;
            if (this.holding) return;                     // đang giữ phím kia rồi
            this.holding = true;
            this.curveMode = curve;
            this.holdT = 0;
            this.charge = 0;
        }

        releaseAct(curve = false) {
            if (!this.holding || this.curveMode !== curve) return;
            const held = this.holdT;
            this.holding = false;
            const power = this.charge;
            this.charge = 0;
            if (Game.owner !== this.idx) return;          // không có bóng thì thôi
            if (held < TAP_TIME) this.doPass(curve);
            else this.doShoot(power, curve);
        }

        /* Bóng cong về phía nào: theo hướng bé đang chạy ngang lúc sút;
           đứng yên thì cong về phía giữa sân (tức là vòng vào trong khung thành). */
        curveSign() {
            const m = Math.hypot(this.fx, this.fy) || 1;
            const nx = -this.fy / m, ny = this.fx / m;    // pháp tuyến của hướng sút
            const lat = this.vx * nx + this.vy * ny;
            if (Math.abs(lat) > 40) return Math.sign(lat);
            return (MID_Y - this.y) * ny >= 0 ? 1 : -1;
        }

        // Chuyền cho đồng đội gần nhất; nếu chơi một mình thì đẩy bóng lên trước
        doPass(curve = false) {
            const mate = Game.nearestTeammate(this);
            const b = Game.ball;
            let dx, dy, speed = PASS_SPEED;
            if (mate) {
                // chuyền đón đầu: nhắm tới chỗ đồng đội sắp chạy tới
                const d = dist(this.x, this.y, mate.x, mate.y);
                const lead = clamp(d / PASS_SPEED, 0, 0.45);
                const tx = mate.x + mate.vx * lead, ty = mate.y + mate.vy * lead;
                dx = tx - b.x; dy = ty - b.y;
                speed = clamp(d * 1.7, 300, 620);
                this.passes++;
            } else {
                dx = this.fx; dy = this.fy;
                speed = PASS_SPEED * 0.85;
            }
            const m = Math.hypot(dx, dy) || 1;
            b.vx = dx / m * speed; b.vy = dy / m * speed;
            b.curve = curve ? this.curveSign() * CURVE_RATE * 0.7 : 0;
            Game.releaseBall(this, 0.22);
            this.kickAnim = 1;
            Sfx.pass();
            Game.addFx(b.x, b.y, curve ? '🌀 CURVED PASS!' : (mate ? 'PASS!' : 'DRIBBLE!'),
                curve ? '#c9a7ff' : this.cfg.light, 0.7, 17);
            if (mate) Game.passLine = { x1: this.x, y1: this.y, x2: mate.x, y2: mate.y, t: 0.5, color: this.cfg.light };
        }

        doShoot(power, curve = false) {
            const b = Game.ball;
            const strong = power >= SOFT_LIMIT;
            // Sút xoáy thì chân không dồn hết lực được nên bóng đi nhẹ hơn chút
            const speed = lerp(SHOT_MIN, SHOT_MAX, power) * this.powerMul * (curve ? CURVE_POWER : 1);
            const m = Math.hypot(this.fx, this.fy) || 1;
            b.vx = this.fx / m * speed;
            b.vy = this.fy / m * speed;
            b.curve = curve ? this.curveSign() * CURVE_RATE : 0;
            b.shotBy = this.idx;
            Game.releaseBall(this, 0.26);
            this.kickAnim = 1;
            this.shots++;
            if (curve) this.curves = (this.curves || 0) + 1;
            Sfx.kick(power);
            Game.addFx(this.x, this.y,
                curve ? (strong ? '🌀 POWER CURVE SHOT!' : '🌀 CURVE SHOT!')
                    : (strong ? '💥 POWER SHOT!' : 'SOFT SHOT!'),
                curve ? '#c9a7ff' : (strong ? '#ffd700' : this.cfg.light),
                0.9, strong ? 22 : 18);
            Game.shake = Math.max(Game.shake, strong ? power * 7 : 2);
        }

        // ----- Ăn mừng / khóc -----
        setOutcome(kind) {
            this.outcome = kind;
            this.celebT = 0;
            this.vx = this.vy = 0;
        }

        updateCelebration(dt) {
            this.celebT += dt;
            if (this.outcome === 'lose' && Math.random() < dt * 6) {
                this.tears.push({ x: this.x + rnd(-6, 6), y: this.y - 4, vy: rnd(40, 80), life: 0.9 });
            }
            for (let i = this.tears.length - 1; i >= 0; i--) {
                const t = this.tears[i];
                t.life -= dt; t.vy += 300 * dt; t.y += t.vy * dt;
                if (t.life <= 0) this.tears.splice(i, 1);
            }
        }

        // ================= VẼ =================
        /* Cầu thủ nhìn từ trên xuống: thấy đầu và vai, hai tay hai chân vung
           theo nhịp chạy. Ghi bàn thì giơ tay ăn mừng, thủng lưới thì gục xuống. */
        draw(ctx, time) {
            const owned = Game.owner === this.idx;
            const cheer = this.celebrate === 'happy' || this.outcome === 'win';
            const sad = this.celebrate === 'sad' || this.outcome === 'lose';
            const c = this.cfg;
            const s = dscale(this.y);

            // Quay mặt sang trái hay phải màn hình — nhớ hướng cũ để đứng yên khỏi lật loạn
            if (this.faceDir === undefined) this.faceDir = this.team === 0 ? 1 : -1;
            if (Math.abs(this.fx) > 0.2) this.faceDir = this.fx > 0 ? 1 : -1;
            // fy > 0 là đang hướng xuống phía người xem -> nhìn thấy mặt
            const front = clamp(this.fy * 1.4, -1, 1);

            const bounce = cheer ? Math.abs(Math.sin(this.celebT * 6)) * M(0.45) : 0;

            // Bóng đổ dưới chân (nhạt dần khi nhảy lên)
            ctx.fillStyle = `rgba(0,0,0,${(0.32 - bounce * 0.003).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(sx_(this.x, this.y), sy_(this.y), P_R * 0.92 * s, P_R * 0.36 * s, 0, 0, Math.PI * 2);
            ctx.fill();

            // Vòng sáng dưới chân người đang giữ bóng
            if (owned) {
                ctx.save();
                ctx.strokeStyle = `rgba(${c.glow},0.95)`;
                ctx.lineWidth = 3 * s;
                ctx.shadowColor = `rgba(${c.glow},0.9)`;
                ctx.shadowBlur = 16;
                const rr = (P_R + 8 + Math.sin(time * 7) * 1.8) * s;
                ctx.beginPath();
                ctx.ellipse(sx_(this.x, this.y), sy_(this.y), rr, rr * 0.4, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            drawHuman(ctx, this.x, this.y, {
                dir: this.faceDir,
                front,
                swing: Math.sin(this.step),
                kick: this.kickAnim,
                armUp: cheer ? 1 : 0,
                droop: sad ? 1 : 0,
                lift: bounce,
                kit: c.color, kitDark: c.dark, kitLight: c.light,
                shorts: c.dark, socks: c.dark,
                number: this.idx + 1
            });

            // Nước mắt khi thua
            for (const t of this.tears) {
                ctx.save();
                ctx.globalAlpha = clamp(t.life, 0, 1);
                ctx.fillStyle = '#8fd8ff';
                ctx.beginPath();
                ctx.ellipse(sx_(this.x, this.y) + t.x * s, sy_(this.y, -FIG.headY * 0.9) + t.y * s,
                    2.6 * s, 4.2 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            const headTop = sy_(this.y, bounce - FIG.headY + FIG.headR);

            // Thanh lực khi đang giữ phím sút
            if (this.holding && this.holdT > TAP_TIME * 0.6 && owned) {
                const bw = 48 * s, bh = 8 * s;
                const bx = sx_(this.x, this.y) - bw / 2, by = headTop - 16 * s;
                ctx.fillStyle = 'rgba(4,7,18,0.8)';
                ctx.beginPath(); ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 5); ctx.fill();
                const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
                pg.addColorStop(0, '#7bed9f');
                pg.addColorStop(SOFT_LIMIT, '#ffd700');
                pg.addColorStop(1, '#ff3b3b');
                ctx.fillStyle = pg;
                ctx.beginPath(); ctx.roundRect(bx, by, bw * this.charge, bh, 4); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bx + bw * SOFT_LIMIT, by - 1);
                ctx.lineTo(bx + bw * SOFT_LIMIT, by + bh + 1);
                ctx.stroke();
            }

            // Tên bé, đặt dưới chân cho khỏi che mặt
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = `bold ${(12 * (0.78 + 0.22 * s)).toFixed(1)}px "Nunito", sans-serif`;
            const nx = sx_(this.x, this.y), ny = sy_(this.y) + 16 * s;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillText(this.name, nx, ny + 1);
            ctx.fillStyle = c.light;
            ctx.fillText(this.name, nx, ny);
            if (this.solo) {
                ctx.font = `${(11 * (0.78 + 0.22 * s)).toFixed(1)}px "Nunito", sans-serif`;
                ctx.fillStyle = '#ffd700';
                ctx.fillText('⭐ SUPERSTAR', nx, ny + 13 * s);
            }
            ctx.restore();
        }
    }

    // =========================================================
    //  Trận đấu
    // =========================================================
    const Game = {
        canvas: null, ctx: null, viewport: null,
        dpr: 1, scale: 1, ox: 0, oy: 0, cssW: 0, cssH: 0,

        state: 'menu',            // menu | countdown | playing | goal | celebrate | over | paused
        playerCount: 4,
        matchLen: 'normal',
        players: [],
        keepers: [],
        scores: [0, 0],
        ball: {
            x: MID_X, y: MID_Y, vx: 0, vy: 0, shotBy: -1, inNet: 0,
            ori: [1, 0, 0, 0, 1, 0, 0, 0, 1], tex: null, texDirty: true, curve: 0
        },
        owner: -1,
        ownerLock: 0,
        timeLeft: 150,
        countdown: 3.99,
        lastTick: -1,
        time: 0,
        keys: {},
        fx: [],
        confetti: [],
        trail: [],
        passLine: null,
        shake: 0,
        goalT: 0,
        goalText: '',
        pk: null,                 // dữ liệu loạt luân lưu
        goalTeam: 0,
        celebrateT: 0,

        init() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.viewport = document.querySelector('.game-viewport');
            this.el = {
                strip: document.getElementById('score-strip'),
                clock: document.getElementById('clock'),
                scoreA: document.getElementById('score-a'),
                scoreB: document.getElementById('score-b'),
                nameA: document.getElementById('team-a-name'),
                nameB: document.getElementById('team-b-name'),
                hint: document.getElementById('control-hint'),
                menu: document.getElementById('screen-menu'),
                pause: document.getElementById('screen-pause'),
                over: document.getElementById('screen-over'),
                finals: document.getElementById('final-grid'),
                lineup: document.getElementById('lineup')
            };

            this.buildTeams(this.playerCount);
            this.bindUI();
            this.bindInput();
            window.addEventListener('resize', () => this.resize());
            this.resize();

            let last = performance.now();
            const loop = now => {
                const dt = Math.min(0.045, (now - last) / 1000);
                last = now;
                this.update(dt);
                this.render();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        buildTeams(n) {
            this.playerCount = n;
            const slots = SLOTS[n], teams = TEAM_OF[n];
            this.players = slots.map((slot, i) => new Player(i, slot, teams[i], n));
            this.keepers = [new Keeper(0), new Keeper(1)];
            this.scores = [0, 0];
            this.owner = -1;
            this.kickoff();
            this.renderLineup();
            this.syncHints();
            this.syncHUD();
        },

        // Danh sách đội hình trên màn hình chọn
        renderLineup() {
            if (!this.el.lineup) return;
            const byTeam = [0, 1].map(t => this.players.filter(p => p.team === t));
            this.el.lineup.innerHTML = [0, 1].map(t => `
                <div class="lineup-team lineup-t${t}">
                    <div class="lineup-title">${TEAMS[t].name}</div>
                    ${byTeam[t].map(p => `
                        <div class="lineup-row">
                            <span class="lineup-emoji">${p.emoji}</span>
                            <span class="lineup-name">${p.name}${p.solo ? ' ⭐' : ''}</span>
                            <span class="lineup-keys">${p.ctrl.label}<b>${p.ctrl.actLabel}</b><i>${p.ctrl.curveLabel}</i></span>
                        </div>`).join('')}
                </div>`).join('<div class="lineup-vs">VS</div>');
        },

        syncHints() {
            if (!this.el.hint) return;
            this.el.hint.innerHTML =
                'Tap = <b>PASS</b> · Hold and release = <b>SHOOT</b> · Second key = <b>CURVE SHOT</b> (the ball bends) · Run with the ball = <b>DRIBBLE</b>';
        },

        // ---------- Bố trí lại đội hình khi giao bóng ----------
        kickoff() {
            const b = this.ball;
            b.x = MID_X; b.y = MID_Y; b.vx = 0; b.vy = 0; b.shotBy = -1; b.inNet = 0; b.curve = 0;
            this.owner = -1;
            this.ownerLock = 0;
            this.trail = [];
            this.passLine = null;
            if (this.keepers) this.keepers.forEach(k => k.reset());
            this.players.forEach(p => { p.celebrate = null; p.tears.length = 0; });

            [0, 1].forEach(t => {
                const mates = this.players.filter(p => p.team === t);
                const dir = t === 0 ? -1 : 1;                 // đội 0 đứng nửa sân trái
                mates.forEach((p, i) => {
                    const spread = mates.length === 1 ? 0 : (i === 0 ? -1 : 1);
                    p.reset(MID_X + dir * (CENTER_R + 70), MID_Y + spread * 120);
                    p.fx = -dir; p.fy = 0;
                });
            });
        },

        bindUI() {
            document.getElementById('btn-start').onclick = () => this.startMatch();
            document.getElementById('btn-again').onclick = () => this.startMatch();
            document.getElementById('btn-restart').onclick = () => this.startMatch();
            document.getElementById('btn-menu').onclick = () => this.toMenu();
            document.getElementById('btn-back-menu').onclick = () => this.toMenu();
            document.getElementById('btn-resume').onclick = () => this.setPaused(false);

            document.querySelectorAll('[data-players]').forEach(b => {
                b.onclick = () => {
                    document.querySelectorAll('[data-players]').forEach(o => o.classList.toggle('sel', o === b));
                    this.buildTeams(+b.dataset.players);
                };
            });
            document.querySelectorAll('[data-len]').forEach(b => {
                b.onclick = () => {
                    document.querySelectorAll('[data-len]').forEach(o => o.classList.toggle('sel', o === b));
                    this.matchLen = b.dataset.len;
                    this.syncHUD();
                };
            });

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
            const BLOCK = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Slash', 'Period'];
            window.addEventListener('keydown', e => {
                if (BLOCK.includes(e.code)) e.preventDefault();
                if (e.code === 'Escape' || e.code === 'KeyP') {
                    if (this.state === 'playing') this.setPaused(true);
                    else if (this.state === 'paused') this.setPaused(false);
                    return;
                }
                if (e.code === 'Space' || e.code === 'Enter') {
                    if (this.state === 'menu' || this.state === 'over') { this.startMatch(); return; }
                }
                if (e.repeat) return;
                this.keys[e.code] = true;
                Sfx.ensure();
                if (this.state === 'shootout') {
                    if (this.pk && this.pk.shooter && e.code === this.pk.shooter.ctrl.act) this.pkPress();
                    return;
                }
                for (const p of this.players) {
                    if (e.code === p.ctrl.act) p.pressAct(false);
                    else if (e.code === p.ctrl.curve) p.pressAct(true);
                }
            });

            window.addEventListener('keyup', e => {
                this.keys[e.code] = false;
                if (this.state === 'shootout') {
                    if (this.pk && this.pk.shooter && e.code === this.pk.shooter.ctrl.act) this.pkRelease();
                    return;
                }
                for (const p of this.players) {
                    if (e.code === p.ctrl.act) p.releaseAct(false);
                    else if (e.code === p.ctrl.curve) p.releaseAct(true);
                }
            });

            window.addEventListener('blur', () => {
                this.keys = {};
                this.players.forEach(p => { p.holding = false; p.charge = 0; });
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
            this.buildTeams(this.playerCount);
            this.el.menu.classList.remove('hidden');
            this.el.pause.classList.add('hidden');
            this.el.over.classList.add('hidden');
        },

        startMatch() {
            Sfx.ensure();
            this.buildTeams(this.playerCount);
            this.timeLeft = MATCH_TIMES[this.matchLen];
            this.countdown = 3.99;
            this.lastTick = -1;
            this.celebrateT = 0;
            this.fx = []; this.confetti = []; this.keys = {};
            this.pk = null;
            this.state = 'countdown';
            this.el.menu.classList.add('hidden');
            this.el.pause.classList.add('hidden');
            this.el.over.classList.add('hidden');
            this.syncHUD();
        },

        setPaused(on) {
            if (on && this.state === 'playing') {
                this.state = 'paused';
                this.keys = {};
                this.players.forEach(p => { p.holding = false; p.charge = 0; });
                this.el.pause.classList.remove('hidden');
            } else if (!on && this.state === 'paused') {
                this.state = 'playing';
                this.el.pause.classList.add('hidden');
            }
        },

        // ---------- Tiện ích ----------
        nearestTeammate(p) {
            let best = null, bd = Infinity;
            for (const o of this.players) {
                if (o === p || o.team !== p.team) continue;
                const d = dist(p.x, p.y, o.x, o.y);
                if (d < bd) { bd = d; best = o; }
            }
            return best;
        },

        releaseBall(p, lock) {
            this.owner = -1;
            this.ownerLock = lock;
            p.lockT = lock;
        },

        addFx(x, y, text, color, life, size) {
            this.fx.push({ x, y, z: M(1.9), text, color, life, max: life, size: size || 18 });
        },

        /* Chùm tia bắn lên khỏi mặt cỏ rồi rơi xuống — nhìn từ góc 2.5D mới ra khối */
        burst(x, y, color, n, speed = 260) {
            for (let i = 0; i < n; i++) {
                const a = rnd(0, Math.PI * 2), s = rnd(50, speed);
                this.fx.push({
                    x, y, z: 4, vx: Math.cos(a) * s * 0.55, vy: Math.sin(a) * s * 0.35,
                    vz: rnd(90, 260),
                    life: rnd(0.4, 0.9), max: 0.9, size: rnd(2, 5), color, dot: true
                });
            }
        },

        // ---------- Vòng lặp ----------
        update(dt) {
            this.time += dt;
            this.shake *= Math.pow(0.02, dt);
            if (this.passLine) { this.passLine.t -= dt; if (this.passLine.t <= 0) this.passLine = null; }
            this.updateTrail(dt);
            this.updateFx(dt);

            if (this.state === 'countdown') {
                const prev = Math.ceil(this.countdown);
                this.countdown -= dt;
                const now = Math.ceil(this.countdown);
                if (now !== prev && now >= 0) {
                    if (now > 0) Sfx.tick(); else Sfx.whistle();
                }
                if (this.countdown <= 0) this.state = 'playing';

            } else if (this.state === 'playing') {
                this.timeLeft -= dt;
                const sec = Math.ceil(this.timeLeft);
                if (sec <= 10 && sec !== this.lastTick && sec > 0) { this.lastTick = sec; Sfx.tick(); }
                this.players.forEach(p => p.update(dt, this.keys));
                this.keepers.forEach(k => k.update(dt, this.ball));
                this.stepBall(dt);
                this.resolvePlayers();
                this.updatePossession(dt);
                if (this.timeLeft <= 0) { this.timeLeft = 0; this.endMatch(); }

            } else if (this.state === 'goal') {
                this.goalT -= dt;
                this.players.forEach(p => p.update(dt, {}));
                this.keepers.forEach(k => k.update(dt, this.ball));
                this.stepBall(dt);
                if (this.goalT <= 0) {
                    if (this.timeLeft <= 0) this.endMatch();
                    else { this.kickoff(); this.state = 'playing'; }
                }

            } else if (this.state === 'shootout') {
                this.updateShootout(dt);

            } else if (this.state === 'celebrate') {
                this.celebrateT += dt;
                this.players.forEach(p => p.update(dt, {}));
                this.updateConfetti(dt);
                if (this.celebrateT > 4) this.showResult();

            } else if (this.state === 'over') {
                this.players.forEach(p => p.update(dt, {}));
                this.updateConfetti(dt);
            }

            this.syncHUD();
        },

        // ---------- Bóng ----------
        stepBall(dt) {
            const b = this.ball;
            if (this.keepers.some(k => k.holdT > 0)) return;   // thủ môn đang ôm bóng

            if (this.owner >= 0) {
                // Rê bóng: bóng bị kéo về điểm ngay trước mũi chân, có độ trễ nên
                // khi ngoặt gấp bóng vẫn văng ra một chút như thật.
                const p = this.players[this.owner];
                const m = Math.hypot(p.fx, p.fy) || 1;
                const tx = p.x + p.fx / m * DRIBBLE_LEAD;
                const ty = p.y + p.fy / m * DRIBBLE_LEAD;
                const k = 1 - Math.exp(-DRIBBLE_K * dt);
                const nx = b.x + (tx - b.x) * k;
                const ny = b.y + (ty - b.y) * k;
                b.vx = (nx - b.x) / Math.max(dt, 1e-4);
                b.vy = (ny - b.y) / Math.max(dt, 1e-4);
                rollBall(b, nx - b.x, ny - b.y);
                b.x = nx; b.y = ny;
                return;
            }

            this.ownerLock = Math.max(0, this.ownerLock - dt);

            const steps = clamp(Math.ceil(Math.hypot(b.vx, b.vy) * dt / (B_R * 0.6)), 1, 12);
            const h = dt / steps;
            for (let s = 0; s < steps; s++) {
                // Ma sát lăn
                const sp = Math.hypot(b.vx, b.vy);
                if (sp > 0) {
                    const ns = Math.max(0, sp - BALL_DRAG * h);
                    b.vx *= ns / sp; b.vy *= ns / sp;
                    if (ns < 4) { b.vx = 0; b.vy = 0; }
                }
                // Bóng xoáy thì hướng bay bị bẻ cong dần (hiệu ứng Magnus)
                if (b.curve !== 0) {
                    const a = b.curve * h, ca = Math.cos(a), sa = Math.sin(a);
                    const nvx = b.vx * ca - b.vy * sa;
                    b.vy = b.vx * sa + b.vy * ca;
                    b.vx = nvx;
                    b.curve *= Math.exp(-CURVE_DECAY * h);
                    if (Math.abs(b.curve) < 0.02) b.curve = 0;
                }
                b.x += b.vx * h;
                b.y += b.vy * h;
                rollBall(b, b.vx * h, b.vy * h);

                /* Bóng đã nằm trong lưới: lưới hãm gần hết lực, bóng dội nhẹ vào
                   đáy lưới rồi nằm gọn bên trong chứ không bay xuyên ra ngoài. */
                if (b.inNet !== 0) {
                    const side = b.inNet;                       // -1 lưới trái, +1 lưới phải
                    const damp = Math.pow(0.015, h);
                    b.vx *= damp; b.vy *= damp;
                    if (Math.hypot(b.vx, b.vy) < 6) { b.vx = 0; b.vy = 0; }

                    // Đáy lưới
                    const backX = side < 0 ? PITCH.x - GOAL_D + B_R : PR + GOAL_D - B_R;
                    if ((side < 0 && b.x < backX) || (side > 0 && b.x > backX)) {
                        b.x = backX; b.vx = -b.vx * 0.22;
                    }
                    // Hai bên lưới
                    if (b.y < GOAL_T + B_R) { b.y = GOAL_T + B_R; b.vy = -b.vy * 0.22; }
                    if (b.y > GOAL_B - B_R) { b.y = GOAL_B - B_R; b.vy = -b.vy * 0.22; }
                    // Không cho lăn ngược ra khỏi vạch vôi
                    const lineX = side < 0 ? PITCH.x - B_R : PR + B_R;
                    if ((side < 0 && b.x > lineX) || (side > 0 && b.x < lineX)) {
                        b.x = lineX; b.vx = 0;
                    }
                    continue;
                }

                const inGoalMouth = b.y > GOAL_T && b.y < GOAL_B;

                // Biên trái / phải — bàn thắng chỉ tính khi CẢ QUẢ BÓNG qua vạch vôi
                if (b.x - B_R < PITCH.x) {
                    if (inGoalMouth) {
                        if (b.x + B_R < PITCH.x) { b.inNet = -1; this.scoreGoal(1); }
                    } else { b.x = PITCH.x + B_R; b.vx = -b.vx * BALL_WALL_E; Sfx.wall(Math.abs(b.vx)); }
                } else if (b.x + B_R > PR) {
                    if (inGoalMouth) {
                        if (b.x - B_R > PR) { b.inNet = 1; this.scoreGoal(0); }
                    } else { b.x = PR - B_R; b.vx = -b.vx * BALL_WALL_E; Sfx.wall(Math.abs(b.vx)); }
                }
                // Biên trên / dưới
                if (b.y - B_R < PITCH.y) { b.y = PITCH.y + B_R; b.vy = -b.vy * BALL_WALL_E; Sfx.wall(Math.abs(b.vy)); }
                else if (b.y + B_R > PB) { b.y = PB - B_R; b.vy = -b.vy * BALL_WALL_E; Sfx.wall(Math.abs(b.vy)); }

                // Cột dọc: bóng dội ra kêu "coong"
                for (const gx of [PITCH.x, PR]) {
                    for (const gy of [GOAL_T, GOAL_B]) {
                        const d = dist(b.x, b.y, gx, gy);
                        if (d < B_R + 5 && d > 0.001) {
                            const nx = (b.x - gx) / d, ny = (b.y - gy) / d;
                            b.x = gx + nx * (B_R + 5); b.y = gy + ny * (B_R + 5);
                            const vn = b.vx * nx + b.vy * ny;
                            b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny;
                            Sfx.post();
                            this.addFx(gx, gy, 'OFF THE POST!', '#ffd700', 0.8, 18);
                        }
                    }
                }

                // Thủ môn cản phá
                for (const k of this.keepers) {
                    if (k.holdT > 0 || b.inNet !== 0) continue;
                    const r = k.radius;
                    const d = dist(b.x, b.y, k.x, k.y);
                    if (d >= B_R + r || d < 0.001) continue;
                    const nx = (b.x - k.x) / d, ny = (b.y - k.y) / d;
                    b.x = k.x + nx * (B_R + r);
                    b.y = k.y + ny * (B_R + r);
                    const speed = Math.hypot(b.vx, b.vy);
                    b.savedBy = k.team;
                    if (speed < GK_CATCH_V) {
                        // Bắt dính bóng
                        k.holdT = GK_HOLD;
                        k.saveFlash = 1;
                        this.owner = -1;
                        b.vx = 0; b.vy = 0; b.shotBy = -1;
                        this.addFx(k.x, k.y - 30, 'CAUGHT IT!', '#ffe98a', 1, 20);
                        Sfx.steal();
                    } else {
                        // Đấm bóng ra
                        const vn = b.vx * nx + b.vy * ny;
                        b.vx -= 1.55 * vn * nx; b.vy -= 1.55 * vn * ny;
                        b.vx *= 0.7; b.vy *= 0.7;
                        k.saveFlash = 1;
                        k.diveT = Math.max(k.diveT, 0.8);
                        this.owner = -1;
                        this.shake = Math.max(this.shake, 5);
                        this.addFx(k.x, k.y - 34, '🧤 WHAT A SAVE!', '#ffd700', 1.1, 22);
                        this.burst(b.x, b.y, '#ffe98a', 10, 220);
                        Sfx.post();
                    }
                }

                // Bóng bật khỏi cầu thủ khi chưa ai giữ
                for (const p of this.players) {
                    const d = dist(b.x, b.y, p.x, p.y);
                    const min = B_R + P_R;
                    if (d < min && d > 0.001) {
                        const nx = (b.x - p.x) / d, ny = (b.y - p.y) / d;
                        b.x = p.x + nx * min; b.y = p.y + ny * min;
                        const vn = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
                        if (vn < 0) {
                            b.vx -= (1 + BALL_PLAYER_E) * vn * nx;
                            b.vy -= (1 + BALL_PLAYER_E) * vn * ny;
                        }
                        b.vx += p.vx * 0.35; b.vy += p.vy * 0.35;
                    }
                }
            }

        },

        /* Tranh bóng.
           Người đang giữ bóng để bóng ở phía trước chân, mà hai cầu thủ không thể
           chồng lên nhau, nên nếu chỉ so "ai gần bóng hơn" thì không ai cướp được.
           Vì vậy: chỉ cần chạm được vào bóng (từ phía trước hoặc bên hông) là cướp. */
        updatePossession(dt) {
            const b = this.ball;
            if (b.inNet !== 0) { this.owner = -1; return; }               // bóng đang nằm trong lưới
            if (this.keepers.some(k => k.holdT > 0)) { this.owner = -1; return; }

            if (this.owner >= 0) {
                for (const p of this.players) {
                    if (p.idx === this.owner || p.lockT > 0) continue;
                    if (dist(b.x, b.y, p.x, p.y) < STEAL_R) {
                        const from = this.players[this.owner];
                        from.lockT = LOSS_LOCK;
                        p.steals++;
                        this.owner = p.idx;
                        b.shotBy = -1;
                        Sfx.steal();
                        this.burst(b.x, b.y, '#ffffff', 9, 190);
                        this.addFx(b.x, b.y - 18, 'TACKLE!', '#ffd700', 0.65, 15);
                        return;
                    }
                }
                // Rê hỏng, bóng trôi quá xa thì mất quyền kiểm soát
                const own = this.players[this.owner];
                if (dist(b.x, b.y, own.x, own.y) > PICKUP_R + 12) this.owner = -1;
                return;
            }

            // Bóng đang tự do: ai gần nhất trong tầm với thì nhặt được
            let best = -1, bd = PICKUP_R;
            for (const p of this.players) {
                if (p.lockT > 0) continue;
                const d = dist(b.x, b.y, p.x, p.y);
                if (d < bd) { bd = d; best = p.idx; }
            }
            if (best >= 0) { this.owner = best; b.shotBy = -1; }
        },

        // Hai cầu thủ không được chồng lên nhau, cũng không đứng đè lên thủ môn
        resolvePlayers() {
            for (const p of this.players) {
                for (const k of this.keepers) {
                    const d = dist(p.x, p.y, k.x, k.y);
                    const min = P_R + K_R;
                    if (d < min && d > 0.001) {
                        const nx = (p.x - k.x) / d, ny = (p.y - k.y) / d;
                        p.x = k.x + nx * min; p.y = k.y + ny * min;
                    }
                }
            }
            for (let i = 0; i < this.players.length; i++) {
                for (let j = i + 1; j < this.players.length; j++) {
                    const a = this.players[i], c = this.players[j];
                    const d = dist(a.x, a.y, c.x, c.y);
                    const min = P_R * 2;
                    if (d < min && d > 0.001) {
                        const nx = (c.x - a.x) / d, ny = (c.y - a.y) / d;
                        const push = (min - d) / 2;
                        a.x -= nx * push; a.y -= ny * push;
                        c.x += nx * push; c.y += ny * push;
                        const vn = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
                        if (vn < 0) {
                            a.vx += vn * nx * 0.5; a.vy += vn * ny * 0.5;
                            c.vx -= vn * nx * 0.5; c.vy -= vn * ny * 0.5;
                        }
                    }
                }
            }
        },

        // Thủ môn ôm bóng xong thì phát lên cho đồng đội gần nhất
        keeperClear(k) {
            const b = this.ball;
            const mates = this.players.filter(p => p.team === k.team);
            let tx, ty;
            if (mates.length) {
                const m = mates.reduce((a, c) =>
                    dist(c.x, c.y, MID_X, MID_Y) < dist(a.x, a.y, MID_X, MID_Y) ? c : a);
                tx = m.x; ty = m.y;
            } else {
                tx = MID_X; ty = MID_Y;
            }
            const dx = tx - k.x, dy = ty - k.y;
            const d = Math.hypot(dx, dy) || 1;
            const speed = clamp(d * 1.6, 380, 660);
            b.vx = dx / d * speed;
            b.vy = dy / d * speed;
            b.shotBy = -1;
            this.owner = -1;
            this.ownerLock = 0.2;
            k.holdT = 0;
            Sfx.kick(0.5);
            this.addFx(k.x, k.y - 30, 'GOAL KICK!', '#ffe98a', 0.8, 18);
        },

        scoreGoal(team) {
            if (this.state !== 'playing') return;      // đang ăn mừng thì không tính thêm
            this.scores[team]++;
            this.goalTeam = team;
            this.state = 'goal';
            this.goalT = 2.6;
            this.shake = 12;
            this.owner = -1;
            const scorer = this.ball.shotBy >= 0 ? this.players[this.ball.shotBy] : null;
            if (scorer && scorer.team === team) scorer.goals++;
            this.goalText = scorer && scorer.team === team
                ? `${scorer.emoji} ${scorer.name} SCORES!`
                : `${TEAMS[team].name} SCORES!`;
            // Cả đội ghi bàn cùng ăn mừng, đội thủng lưới thì gục xuống
            this.players.forEach(p => {
                p.celebrate = p.team === team ? 'happy' : 'sad';
                p.celebT = 0;
            });
            Sfx.goal();
            for (let i = 0; i < 90; i++) {
                this.confetti.push({
                    x: rnd(0, W), y: rnd(-200, 0), vx: rnd(-50, 50), vy: rnd(90, 230),
                    size: rnd(4, 9), rot: rnd(0, 6), color: [TEAMS[team].color, '#ffd700', '#ffffff'][i % 3], life: 5
                });
            }
        },

        endMatch() {
            Sfx.whistle();
            // Hoà thì bước vào loạt sút luân lưu để phân định thắng thua
            if (this.scores[0] === this.scores[1]) { this.startShootout(); return; }
            this.state = 'celebrate';
            this.celebrateT = 0;
            const [a, b] = this.scores;
            this.players.forEach(p => {
                if (a === b) p.setOutcome('draw');
                else p.setOutcome((p.team === 0) === (a > b) ? 'win' : 'lose');
            });
            if (a !== b) {
                setTimeout(() => Sfx.cheer(), 500);
                setTimeout(() => Sfx.sob(), 900);
                const winTeam = a > b ? 0 : 1;
                for (let i = 0; i < 120; i++) {
                    this.confetti.push({
                        x: rnd(0, W), y: rnd(-260, 0), vx: rnd(-50, 50), vy: rnd(90, 230),
                        size: rnd(4, 9), rot: rnd(0, 6),
                        color: [TEAMS[winTeam].color, '#ffd700', '#ffffff'][i % 3], life: 8
                    });
                }
            }
        },


        /* =====================================================
           ĐÁ LUÂN LƯU — dùng khi hết giờ mà hai đội hoà.
           Mỗi đội 3 quả, vẫn hoà thì đấu súng từng quả một.
           Cách sút giống hệt lúc thi đấu: vạch ngắm tự chạy dọc khung thành,
           GIỮ phím để lấy lực rồi THẢ đúng lúc. Ngắm lố ra ngoài cột là sút hụt.
           ===================================================== */
        startShootout() {
            this.state = 'shootout';
            this.pk = {
                phase: 'ready',
                team: 0,                    // đội đang sút
                round: 0,
                goals: [0, 0],
                taken: [0, 0],
                history: [[], []],
                shooterOf: [0, 0],          // cầu thủ nào của đội tới lượt
                shooter: null,
                aim: 0, aimDir: 1,          // vạch ngắm: -1 mép trên, +1 mép dưới
                power: 0, powerDir: 1,
                holding: false,
                t: 0, resultT: 0, resultText: '', resultGood: false,
                over: false, winner: -1
            };
            this.confetti = [];
            this.fx = [];
            Sfx.tick();
            this.setupPenalty();
        },

        setupPenalty() {
            const pk = this.pk;
            const mates = this.players.filter(p => p.team === pk.team);
            pk.shooter = mates[pk.shooterOf[pk.team] % mates.length];
            const side = pk.team === 0 ? 1 : 0;          // sút vào khung thành đội kia
            const goalX = side === 0 ? PITCH.x : PR;
            const dir = side === 0 ? -1 : 1;             // hướng bóng bay
            pk.goalX = goalX;
            pk.dir = dir;
            pk.spotX = goalX - dir * PEN_SPOT;

            const b = this.ball;
            b.x = pk.spotX; b.y = MID_Y;
            b.vx = 0; b.vy = 0; b.inNet = 0; b.shotBy = -1; b.savedBy = undefined;
            this.owner = -1;

            // Người sút đứng sau bóng, quay mặt về khung thành
            pk.shooter.reset(pk.spotX - dir * M(1.1), MID_Y);
            pk.shooter.fx = dir; pk.shooter.fy = 0;

            // Những cầu thủ còn lại đứng chờ ở giữa sân
            let n = 0;
            for (const p of this.players) {
                if (p === pk.shooter) continue;
                p.reset(MID_X + (n % 2 ? 1 : -1) * M(1.2), MID_Y + (n < 2 ? -1 : 1) * M(2.4));
                n++;
            }
            this.keepers.forEach(k => k.reset());

            pk.aim = 0; pk.aimDir = 1;
            pk.power = 0; pk.powerDir = 1;
            pk.holding = false;
            pk.phase = 'aim';
            pk.t = 0;
        },

        pkAimY() {
            const half = GOAL_H / 2 + PK_AIM_PAD;
            return MID_Y + this.pk.aim * half;
        },

        pkPress() {
            const pk = this.pk;
            if (pk.phase !== 'aim') return;
            pk.phase = 'charge';
            pk.power = 0; pk.powerDir = 1; pk.holding = true;
        },

        pkRelease() {
            const pk = this.pk;
            if (pk.phase !== 'charge') return;
            pk.holding = false;
            const b = this.ball;
            const ty = this.pkAimY();
            const dx = pk.goalX - b.x, dy = ty - b.y;
            const d = Math.hypot(dx, dy) || 1;
            const speed = lerp(PK_MIN, PK_MAX, pk.power);
            b.vx = dx / d * speed;
            b.vy = dy / d * speed;
            b.shotBy = pk.shooter.idx;
            pk.shooter.kickAnim = 1;
            pk.shooter.shots++;
            pk.phase = 'fly';
            pk.t = 0;
            Sfx.kick(pk.power);

            // Thủ môn đổ người đoán hướng: chọn một trong ba vùng, đúng 1/3 cơ hội
            const gk = this.keepers[pk.team === 0 ? 1 : 0];
            const zone = Math.floor(Math.random() * 3) - 1;      // -1 trên, 0 giữa, 1 dưới
            gk.aimY = clamp(MID_Y + zone * GOAL_H * 0.34, MID_Y - GK_RANGE, MID_Y + GK_RANGE);
            gk.reactT = 99;                                       // khoá lại, không tự bám bóng nữa
            gk.pkGuess = zone;
            gk.pkCorrectT = 0.42;                                 // lát sau mới kịp chỉnh theo bóng
            gk.diveT = 1;
            gk.dive = zone || 1;
        },

        updateShootout(dt) {
            const pk = this.pk;
            const b = this.ball;
            pk.t += dt;

            // Thủ môn: giai đoạn luân lưu tự điều khiển riêng
            const gk = this.keepers[pk.team === 0 ? 1 : 0];
            if (pk.phase === 'fly') {
                gk.pkCorrectT = Math.max(0, (gk.pkCorrectT || 0) - dt);
                if (gk.pkCorrectT <= 0) gk.aimY = clamp(b.y, MID_Y - GK_RANGE, MID_Y + GK_RANGE);
                const dy = gk.aimY - gk.y;
                gk.y += clamp(dy * 7, -GK_SPEED * 1.5, GK_SPEED * 1.5) * dt;
                gk.diveT = Math.max(0, gk.diveT - dt * 1.2);
                gk.saveFlash = Math.max(0, gk.saveFlash - dt * 2);
            } else {
                this.keepers.forEach(k => k.update(dt, b));
            }
            this.players.forEach(p => p.update(dt, {}));

            switch (pk.phase) {
                case 'aim': {
                    pk.aim += pk.aimDir * PK_SWEEP * dt;
                    if (pk.aim > 1) { pk.aim = 1; pk.aimDir = -1; }
                    if (pk.aim < -1) { pk.aim = -1; pk.aimDir = 1; }
                    break;
                }
                case 'charge': {
                    pk.power += pk.powerDir * PK_CHARGE * dt;
                    if (pk.power > 1) { pk.power = 1; pk.powerDir = -1; }
                    if (pk.power < 0) { pk.power = 0; pk.powerDir = 1; }
                    if (pk.t > 6) this.pkRelease();      // giữ mãi thì tự sút
                    break;
                }
                case 'fly': {
                    this.stepBall(dt);
                    const past = pk.dir < 0 ? b.x < pk.goalX - B_R : b.x > pk.goalX + B_R;
                    if (b.inNet !== 0) this.pkFinishShot(true, '⚽ GOAL!');
                    else if (b.savedBy !== undefined || gk.holdT > 0) this.pkFinishShot(false, '🧤 KEEPER SAVES!');
                    else if (past) this.pkFinishShot(false, '😮 MISSED!');
                    else if (pk.t > 3.2 || (Math.hypot(b.vx, b.vy) < 5 && pk.t > 0.6))
                        this.pkFinishShot(false, '😮 NO GOAL!');
                    break;
                }
                case 'result': {
                    pk.resultT -= dt;
                    if (pk.resultT <= 0) this.pkNext();
                    break;
                }
            }
        },

        pkFinishShot(scored, text) {
            const pk = this.pk;
            pk.phase = 'result';
            pk.resultT = PK_RESULT;
            pk.resultText = text;
            pk.resultGood = scored;
            pk.taken[pk.team]++;
            pk.history[pk.team].push(scored);
            if (scored) {
                pk.goals[pk.team]++;
                pk.shooter.goals++;
                Sfx.goal();
                for (let i = 0; i < 40; i++) {
                    this.confetti.push({
                        x: rnd(pk.goalX - 60, pk.goalX + 60), y: rnd(GOAL_T - 40, GOAL_B),
                        vx: rnd(-60, 60), vy: rnd(60, 200), size: rnd(4, 8), rot: rnd(0, 6),
                        color: [TEAMS[pk.team].color, '#ffd700', '#ffffff'][i % 3], life: 3
                    });
                }
            } else {
                Sfx.post();
            }
        },

        /* Xong một lượt: kiểm tra đã phân thắng bại chưa rồi chuyển lượt. */
        pkNext() {
            const pk = this.pk;
            const [ta, tb] = pk.taken, [ga, gb] = pk.goals;
            const done = Math.min(ta, tb);

            // Trong 3 lượt đầu: nếu một bên đã hơn nhiều hơn số quả còn lại thì kết thúc sớm
            if (done < PK_ROUNDS) {
                const leftA = PK_ROUNDS - ta, leftB = PK_ROUNDS - tb;
                if (ga > gb + leftB) return this.pkFinish(0);
                if (gb > ga + leftA) return this.pkFinish(1);
                if (ta >= PK_ROUNDS && tb >= PK_ROUNDS && ga !== gb) return this.pkFinish(ga > gb ? 0 : 1);
            } else if (ta === tb && ga !== gb) {
                // Đấu súng: hai bên đá đủ số quả bằng nhau mà lệch nhau là xong
                return this.pkFinish(ga > gb ? 0 : 1);
            }

            pk.shooterOf[pk.team]++;
            pk.team = pk.team === 0 ? 1 : 0;
            if (pk.team === 0) pk.round++;
            this.setupPenalty();
        },

        pkFinish(winner) {
            const pk = this.pk;
            pk.over = true;
            pk.winner = winner;
            this.state = 'celebrate';
            this.celebrateT = 0;
            this.players.forEach(p => p.setOutcome(p.team === winner ? 'win' : 'lose'));
            setTimeout(() => Sfx.cheer(), 400);
            setTimeout(() => Sfx.sob(), 900);
            for (let i = 0; i < 120; i++) {
                this.confetti.push({
                    x: rnd(0, W), y: rnd(-260, 0), vx: rnd(-50, 50), vy: rnd(90, 230),
                    size: rnd(4, 9), rot: rnd(0, 6),
                    color: [TEAMS[winner].color, '#ffd700', '#ffffff'][i % 3], life: 8
                });
            }
        },

        showResult() {
            this.state = 'over';
            const [a, b] = this.scores;
            const el = id => document.getElementById(id);
            let title, desc, emoji;
            if (this.pk && this.pk.over) {
                const w = this.pk.winner;
                title = `${TEAMS[w].name} WINS THE SHOOTOUT!`;
                desc = `Level at ${a} - ${b} after full time — ${TEAMS[w].name} win` +
                    `${this.pk.goals[w]} - ${this.pk.goals[1 - w]} on penalties. Congratulations` +
                    this.players.filter(p => p.team === w).map(p => p.emoji + ' ' + p.name).join('and') + '!';
                emoji = '🥅';
            } else if (a === b) {
                title = 'IT\'S A DRAW!';
                desc = `It ends ${a} - ${b}. Evenly matched — time for a rematch!`;
                emoji = '🤝';
            } else {
                const w = a > b ? 0 : 1;
                title = `${TEAMS[w].name} WINS!`;
                desc = `Winning ${Math.max(a, b)} - ${Math.min(a, b)}. Congratulations` +
                    this.players.filter(p => p.team === w).map(p => p.emoji + ' ' + p.name).join('and') + '!';
                emoji = '🏆';
            }
            el('over-title').textContent = title;
            el('over-desc').textContent = desc;
            el('over-emoji').textContent = emoji;

            this.el.finals.className = 'final-grid cols-' + this.playerCount;
            this.el.finals.innerHTML = this.players.map(p => `
                <div class="final-box final-t${p.team}${p.outcome !== 'lose' ? ' winner' : ''}">
                    <div class="final-avatar">${p.emoji}</div>
                    <div class="final-name">${p.name}${p.solo ? ' ⭐' : ''}</div>
                    <div class="final-score">${p.goals}</div>
                    <div class="final-sub">goals</div>
                    <div class="final-stats">
                        <div><span>Shots</span><b>${p.shots}</b></div>
                        <div><span>Passes</span><b>${p.passes}</b></div>
                        <div><span>Tackles</span><b>${p.steals}</b></div>
                        <div><span>Curve shots</span><b>${p.curves || 0}</b></div>
                    </div>
                </div>`).join('');
            this.el.over.classList.remove('hidden');
        },

        syncHUD() {
            this.el.scoreA.textContent = this.scores[0];
            this.el.scoreB.textContent = this.scores[1];
            this.el.nameA.textContent = TEAMS[0].name;
            this.el.nameB.textContent = TEAMS[1].name;
            const t = Math.max(0, Math.ceil(this.timeLeft));
            const m = Math.floor(t / 60), s = t % 60;
            this.el.clock.textContent = `${m}:${String(s).padStart(2, '0')}`;
            this.el.clock.classList.toggle('urgent', t <= 10 && this.state === 'playing');
        },

        /* Vệt bóng phải tự mờ đi ở MỌI trạng thái.
           Trước kia đoạn này nằm trong stepBall, mà stepBall lại thoát sớm khi
           có người rê bóng hoặc thủ môn ôm bóng — thế là vệt cũ đứng hình
           giữa sân cho tới lúc bóng lại lăn tự do. */
        updateTrail(dt) {
            const b = this.ball;
            if (this.owner < 0 && !this.keepers.some(k => k.holdT > 0)
                && Math.hypot(b.vx, b.vy) > 300) {
                this.trail.push({ x: b.x, y: b.y, life: 0.28 });
                if (this.trail.length > 24) this.trail.shift();
            }
            for (let i = this.trail.length - 1; i >= 0; i--) {
                this.trail[i].life -= dt;
                if (this.trail[i].life <= 0) this.trail.splice(i, 1);
            }
        },

        updateFx(dt) {
            for (let i = this.fx.length - 1; i >= 0; i--) {
                const f = this.fx[i];
                f.life -= dt;
                if (f.dot) {
                    f.vz -= 620 * dt;
                    f.x += f.vx * dt; f.y += f.vy * dt;
                    f.z += f.vz * dt;
                    if (f.z < 1) { f.z = 1; f.vz *= -0.4; f.vx *= 0.6; f.vy *= 0.6; }
                } else f.z += 34 * dt;
                if (f.life <= 0) this.fx.splice(i, 1);
            }
        },

        updateConfetti(dt) {
            for (let i = this.confetti.length - 1; i >= 0; i--) {
                const c = this.confetti[i];
                c.life -= dt; c.vy += 45 * dt;
                c.x += c.vx * dt; c.y += c.vy * dt; c.rot += dt * 3;
                if (c.y > H + 20) { c.y = -20; c.x = rnd(0, W); }
                if (c.life <= 0) this.confetti.splice(i, 1);
            }
        },

        // ================= VẼ =================
        render() {
            const ctx = this.ctx;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.fillStyle = '#050b06';
            ctx.fillRect(0, 0, this.cssW, this.cssH);

            ctx.save();
            ctx.translate(this.ox, this.oy);
            ctx.scale(this.scale, this.scale);
            if (this.shake > 0.4) {
                ctx.translate(rnd(-this.shake, this.shake), rnd(-this.shake, this.shake));
            }

            this.drawPitch(ctx);
            this.drawGoalNets(ctx);
            this.drawPassLine(ctx);

            /* Ai đứng xa hơn (y nhỏ) thì vẽ trước, nhờ vậy người phía trước
               che được người phía sau đúng như mắt nhìn. */
            const ents = [];
            this.keepers.forEach(k => ents.push([k.y, () => k.draw(ctx, this.time)]));
            this.players.forEach(p => ents.push([p.y, () => p.draw(ctx, this.time)]));
            ents.push([this.ball.y, () => this.drawBall(ctx)]);
            ents.sort((a, b) => a[0] - b[0]);
            ents.forEach(e => e[1]());

            this.drawGoalFrames(ctx);
            this.drawFx(ctx);
            if (this.state === 'shootout') this.drawShootout(ctx);
            if (this.state === 'goal') this.drawGoalBanner(ctx);
            if (this.state === 'countdown') this.drawCountdown(ctx);
            if (this.state === 'celebrate' || this.state === 'over') this.drawEndBanner(ctx);
            this.drawConfetti(ctx);

            ctx.restore();
        },

        drawPitch(ctx) {
            const farY = sy_(PITCH.y), nearY = sy_(PB);

            // ----- Trời đêm -----
            const sky = ctx.createLinearGradient(0, 0, 0, farY);
            sky.addColorStop(0, '#03060c');
            sky.addColorStop(1, '#0d1a24');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, farY + 2);

            // ----- Khán đài phía xa: càng lên cao càng lùi xa nên khán giả càng nhỏ -----
            const rand = (() => { let s2 = 99; return () => (s2 = (s2 * 1664525 + 1013904223) >>> 0) / 4294967296; })();
            const standTop = 26;
            for (let row = 0; row < 16; row++) {
                const t = row / 15;                       // 0 = hàng dưới cùng (gần nhất)
                const ry = farY - 14 - t * (farY - 14 - standTop);
                const half = (W / 2) * (0.98 - t * 0.16);
                const dot = 4.3 - t * 2.3;
                ctx.fillStyle = `rgba(0,0,0,${0.1 + t * 0.12})`;
                ctx.fillRect(W / 2 - half, ry - dot, half * 2, dot * 2.1);
                for (let x = W / 2 - half; x < W / 2 + half; x += dot * 2.6) {
                    ctx.fillStyle = `hsla(${Math.floor(rand() * 360)},48%,${26 + rand() * 20}%,${0.75 + rand() * 0.25})`;
                    ctx.beginPath();
                    ctx.arc(x + rand() * dot, ry + (rand() - 0.5) * dot, dot * (0.75 + rand() * 0.3), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            // Mái che phía trên khán đài
            const roof = ctx.createLinearGradient(0, 0, 0, standTop + 22);
            roof.addColorStop(0, 'rgba(3,6,12,1)');
            roof.addColorStop(1, 'rgba(3,6,12,0)');
            ctx.fillStyle = roof;
            ctx.fillRect(0, 0, W, standTop + 22);

            // ----- Vùng tối bao quanh mặt cỏ -----
            ctx.fillStyle = '#0b1410';
            ctx.fillRect(0, farY, W, H - farY);

            // ----- Bảng quảng cáo dựng đứng: mách cho mắt biết đâu là chiều cao -----
            const BH = M(0.95);
            this.drawBoards(ctx, PITCH.x - M(1.4), PITCH.y - M(1.0), PR + M(1.4), PITCH.y - M(1.0), BH, 13);
            this.drawBoards(ctx, PITCH.x - M(1.6), PITCH.y - M(0.6), PITCH.x - M(1.6), PB + M(0.6), BH, 8);
            this.drawBoards(ctx, PR + M(1.6), PITCH.y - M(0.6), PR + M(1.6), PB + M(0.6), BH, 8);

            // ----- Mặt cỏ: hình thang, xa thì hẹp lại -----
            ctx.save();
            pPath(ctx, [[PITCH.x, PITCH.y], [PR, PITCH.y], [PR, PB], [PITCH.x, PB]], true);
            ctx.clip();

            const g = ctx.createLinearGradient(0, farY, 0, nearY);
            g.addColorStop(0, '#26773a');
            g.addColorStop(0.55, '#2b8a43');
            g.addColorStop(1, '#2f9648');
            ctx.fillStyle = g;
            ctx.fillRect(0, farY - 4, W, nearY - farY + 8);

            // Dải cắt cỏ rộng 2m, chiếu lên thành hình thang
            const sw = M(2);
            for (let i = 0; i * sw < PITCH.w; i += 2) {
                const x0 = PITCH.x + i * sw, x1 = Math.min(x0 + sw, PR);
                pPath(ctx, [[x0, PITCH.y], [x1, PITCH.y], [x1, PB], [x0, PB]], true);
                ctx.fillStyle = 'rgba(255,255,255,0.055)';
                ctx.fill();
            }
            // Đèn sân toả sáng giữa sân, bốn góc tối đi
            const spot = ctx.createRadialGradient(MID_X, (farY + nearY) / 2, 90, MID_X, (farY + nearY) / 2, 700);
            spot.addColorStop(0, 'rgba(255,255,255,0.13)');
            spot.addColorStop(1, 'rgba(0,0,0,0.34)');
            ctx.fillStyle = spot;
            ctx.fillRect(0, farY - 4, W, nearY - farY + 8);
            ctx.restore();

            // ----- Vạch vôi (rộng 8cm), vẽ theo phối cảnh -----
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineCap = 'butt';
            const LW = y => Math.max(1.6, M(0.09) * dscale(y));

            const line = (x0, y0, x1, y1) => {
                ctx.lineWidth = LW((y0 + y1) / 2);
                pPath(ctx, [[x0, y0], [x1, y1]]);
                ctx.stroke();
            };
            line(PITCH.x, PITCH.y, PR, PITCH.y);         // biên ngang xa
            line(PITCH.x, PB, PR, PB);                   // biên ngang gần
            line(PITCH.x, PITCH.y, PITCH.x, PB);         // biên dọc trái
            line(PR, PITCH.y, PR, PB);                   // biên dọc phải
            line(MID_X, PITCH.y, MID_X, PB);             // vạch giữa sân

            ctx.lineWidth = LW(MID_Y);
            pArc(ctx, MID_X, MID_Y, CENTER_R, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            pArc(ctx, MID_X, MID_Y, M(0.12), 0, Math.PI * 2, 12);
            ctx.fill();

            // Khu thay người
            for (const dx of [-SUB_ZONE, SUB_ZONE]) {
                line(MID_X + dx, PITCH.y, MID_X + dx, PITCH.y - M(0.8));
                line(MID_X + dx, PB, MID_X + dx, PB + M(0.8));
            }

            // Vòng cấm futsal: hai cung 1/4 tâm ở chân cột dọc
            [0, 1].forEach(side => {
                const gx = side === 0 ? PITCH.x : PR;
                const inward = side === 0 ? 1 : -1;
                ctx.lineWidth = LW(MID_Y);
                pArc(ctx, gx, GOAL_T, PEN_R, -Math.PI / 2, side === 0 ? 0 : -Math.PI);
                ctx.stroke();
                pArc(ctx, gx, GOAL_B, PEN_R, side === 0 ? 0 : Math.PI, Math.PI / 2);
                ctx.stroke();
                line(gx + inward * PEN_R, GOAL_T, gx + inward * PEN_R, GOAL_B);

                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                for (const d of [PEN_SPOT, PEN2_SPOT]) {
                    pArc(ctx, gx + inward * d, MID_Y, M(0.12), 0, Math.PI * 2, 12);
                    ctx.fill();
                }
                line(gx + inward * PEN2_SPOT, MID_Y - M(0.35), gx + inward * PEN2_SPOT, MID_Y + M(0.35));
            });

            // Cung phạt góc
            [[PITCH.x, PITCH.y, 0], [PR, PITCH.y, Math.PI / 2],
             [PITCH.x, PB, -Math.PI / 2], [PR, PB, Math.PI]]
                .forEach(([cx, cy, a0]) => {
                    ctx.lineWidth = LW(cy);
                    pArc(ctx, cx, cy, CORNER_R, a0, a0 + Math.PI / 2, 14);
                    ctx.stroke();
                });
            ctx.restore();

            // ----- Cột cờ góc: bây giờ là cây cờ dựng đứng thật -----
            [[PITCH.x, PITCH.y], [PR, PITCH.y], [PITCH.x, PB], [PR, PB]].forEach(([cx, cy]) => {
                const d = dscale(cy), poleH = M(1.2);
                ctx.strokeStyle = 'rgba(240,245,255,0.8)';
                ctx.lineWidth = Math.max(1.4, 2.6 * d);
                pPath(ctx, [[cx, cy, 0], [cx, cy, poleH]]);
                ctx.stroke();
                const [fx0, fy0] = [sx_(cx, cy), sy_(cy, poleH)];
                ctx.fillStyle = '#ffd93b';
                ctx.beginPath();
                ctx.moveTo(fx0, fy0);
                ctx.lineTo(fx0 + 13 * d, fy0 + 4 * d);
                ctx.lineTo(fx0, fy0 + 9 * d);
                ctx.closePath(); ctx.fill();
            });
        },

        /* Dãy bảng quảng cáo dựng đứng chạy dọc theo một cạnh sân */
        drawBoards(ctx, x0, y0, x1, y1, h, n) {
            const cols = ['#0f2f5c', '#123f2a', '#4a1030', '#2b2350'];
            for (let i = 0; i < n; i++) {
                const t0 = i / n, t1 = (i + 1) / n;
                const ax = x0 + (x1 - x0) * t0, ay = y0 + (y1 - y0) * t0;
                const bx = x0 + (x1 - x0) * t1, by = y0 + (y1 - y0) * t1;
                pPath(ctx, [[ax, ay, 0], [bx, by, 0], [bx, by, h], [ax, ay, h]], true);
                ctx.fillStyle = cols[i % cols.length];
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.16)';
                ctx.lineWidth = 1;
                ctx.stroke();
                // vệt sáng phản chiếu trên mặt bảng
                pPath(ctx, [[ax, ay, h * 0.62], [bx, by, h * 0.62], [bx, by, h * 0.9], [ax, ay, h * 0.9]], true);
                ctx.fillStyle = 'rgba(255,255,255,0.07)';
                ctx.fill();
            }
        },

        /* Khung thành ba chiều.
           Phần lưới và cột xa vẽ TRƯỚC cầu thủ, cột gần và xà ngang vẽ SAU,
           nhờ vậy thủ môn đứng lọt vào trong khung như thật. */
        drawGoalNets(ctx) {
            [0, 1].forEach(side => {
                const outward = side === 0 ? -1 : 1;
                const gx = side === 0 ? PITCH.x : PR;
                const bx = gx + outward * GOAL_D;
                const b = this.ball;
                const inThisNet = b.inNet === (side === 0 ? -1 : 1);
                // Bóng găm vào lưới thì đẩy các mắt lưới quanh đó phồng ra
                const bulge = (x, y) => {
                    if (!inThisNet) return 0;
                    const d = dist(x, y, b.x, b.y);
                    return d > 52 ? 0 : (1 - d / 52) * 15 * outward;
                };
                // Một tấm lưới: 4 góc theo thứ tự vòng quanh, mỗi góc [x, y, cao]
                const panel = (c, nu, nv) => {
                    ctx.strokeStyle = 'rgba(255,255,255,0.34)';
                    ctx.lineWidth = 1;
                    const at = (u, v) => {
                        const top = [c[0][0] + (c[1][0] - c[0][0]) * u, c[0][1] + (c[1][1] - c[0][1]) * u, c[0][2] + (c[1][2] - c[0][2]) * u];
                        const bot = [c[3][0] + (c[2][0] - c[3][0]) * u, c[3][1] + (c[2][1] - c[3][1]) * u, c[3][2] + (c[2][2] - c[3][2]) * u];
                        const x = top[0] + (bot[0] - top[0]) * v, y = top[1] + (bot[1] - top[1]) * v;
                        return [x + bulge(x, y), y, top[2] + (bot[2] - top[2]) * v];
                    };
                    for (let i = 0; i <= nu; i++) {
                        const pts = [];
                        for (let j = 0; j <= nv; j++) pts.push(at(i / nu, j / nv));
                        pPath(ctx, pts); ctx.stroke();
                    }
                    for (let j = 0; j <= nv; j++) {
                        const pts = [];
                        for (let i = 0; i <= nu; i++) pts.push(at(i / nu, j / nv));
                        pPath(ctx, pts); ctx.stroke();
                    }
                };

                ctx.save();
                // nền mờ bên trong khung cho lưới nổi lên
                pPath(ctx, [[gx, GOAL_T, GOAL_Z], [gx, GOAL_B, GOAL_Z], [gx, GOAL_B, 0], [gx, GOAL_T, 0]], true);
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fill();

                panel([[bx, GOAL_T, GOAL_BZ], [bx, GOAL_B, GOAL_BZ], [bx, GOAL_B, 0], [bx, GOAL_T, 0]], 9, 6);      // lưới sau
                panel([[gx, GOAL_T, GOAL_Z], [bx, GOAL_T, GOAL_BZ], [bx, GOAL_T, 0], [gx, GOAL_T, 0]], 4, 6);        // hông xa
                panel([[gx, GOAL_B, GOAL_Z], [bx, GOAL_B, GOAL_BZ], [bx, GOAL_B, 0], [gx, GOAL_B, 0]], 4, 6);        // hông gần
                panel([[gx, GOAL_T, GOAL_Z], [gx, GOAL_B, GOAL_Z], [bx, GOAL_B, GOAL_BZ], [bx, GOAL_T, GOAL_BZ]], 9, 4); // mái
                ctx.restore();

                // Cột dọc phía XA + khung sau (nằm sau lưng cầu thủ)
                const bar = (a, b2, w, col) => {
                    ctx.strokeStyle = col;
                    ctx.lineWidth = w * dscale((a[1] + b2[1]) / 2);
                    ctx.lineCap = 'round';
                    pPath(ctx, [a, b2]); ctx.stroke();
                };
                bar([bx, GOAL_T, 0], [bx, GOAL_T, GOAL_BZ], 4, '#cfd8e6');
                bar([bx, GOAL_B, 0], [bx, GOAL_B, GOAL_BZ], 4, '#cfd8e6');
                bar([bx, GOAL_T, GOAL_BZ], [bx, GOAL_B, GOAL_BZ], 4, '#cfd8e6');
                bar([gx, GOAL_T, 0], [gx, GOAL_T, GOAL_Z], 8, '#f6f9ff');
            });
        },

        drawGoalFrames(ctx) {
            [0, 1].forEach(side => {
                const gx = side === 0 ? PITCH.x : PR;
                const bar = (a, b2, w, col) => {
                    ctx.strokeStyle = col;
                    ctx.lineWidth = w * dscale((a[1] + b2[1]) / 2);
                    ctx.lineCap = 'round';
                    pPath(ctx, [a, b2]); ctx.stroke();
                };
                bar([gx, GOAL_B, 0], [gx, GOAL_B, GOAL_Z], 8, '#f6f9ff');            // cột gần
                bar([gx, GOAL_T, GOAL_Z], [gx, GOAL_B, GOAL_Z], 7, '#f6f9ff');       // xà ngang
                // Nhãn treo trên xà
                ctx.save();
                ctx.textAlign = 'center';
                ctx.font = 'bold 13px "Baloo 2", sans-serif';
                ctx.fillStyle = TEAMS[side].light;
                ctx.shadowColor = 'rgba(0,0,0,0.85)';
                ctx.shadowBlur = 6;
                ctx.fillText(`${TEAMS[side].name} GOAL`, sx_(gx, MID_Y), sy_(MID_Y, GOAL_Z) - 12);
                ctx.restore();
            });
        },

        drawPassLine(ctx) {
            const p = this.passLine;
            if (!p) return;
            ctx.save();
            ctx.globalAlpha = clamp(p.t / 0.5, 0, 1) * 0.8;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.setLineDash([9, 8]);
            pPath(ctx, [[p.x1, p.y1, B_R], [p.x2, p.y2, B_R]]); ctx.stroke();
            ctx.restore();
        },

        drawBall(ctx) {
            const b = this.ball;
            const s = dscale(b.y);
            const bx = sx_(b.x, b.y), by = sy_(b.y, B_R);   // tâm bóng nằm cách mặt cỏ đúng 1 bán kính

            // Vệt bóng khi đi nhanh
            for (const t of this.trail) {
                const ts = dscale(t.y);
                ctx.globalAlpha = clamp(t.life / 0.28, 0, 1) * 0.32;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(sx_(t.x, t.y), sy_(t.y, B_R), B_R * 0.8 * ts, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Bóng đổ trên cỏ
            ctx.fillStyle = 'rgba(0,0,0,0.34)';
            ctx.beginPath();
            ctx.ellipse(bx + 2 * s, sy_(b.y), B_R * 0.95 * s, B_R * 0.42 * s, 0, 0, Math.PI * 2);
            ctx.fill();

            if (b.texDirty || !b.tex) renderBallTex(b);

            ctx.save();
            ctx.translate(bx, by);
            ctx.drawImage(b.tex, -B_R * s, -B_R * s, B_R * 2 * s, B_R * 2 * s);
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0, 0, B_R * s, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        },

        drawFx(ctx) {
            for (const f of this.fx) {
                const a = clamp(f.life / f.max, 0, 1);
                const sc = dscale(f.y);
                const px = sx_(f.x, f.y), py = sy_(f.y, f.z || 0);
                ctx.save();
                ctx.globalAlpha = a;
                if (f.dot) {
                    ctx.fillStyle = f.color;
                    ctx.beginPath(); ctx.arc(px, py, f.size * sc, 0, Math.PI * 2); ctx.fill();
                } else {
                    ctx.font = `bold ${(f.size * (0.72 + 0.28 * sc)).toFixed(1)}px "Baloo 2", sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillStyle = 'rgba(0,0,0,0.75)';
                    ctx.fillText(f.text, px + 1.5, py + 1.5);
                    ctx.fillStyle = f.color;
                    ctx.fillText(f.text, px, py);
                }
                ctx.restore();
            }
        },

        /* Giao diện loạt luân lưu: băng rôn, bảng đếm quả của hai đội,
           vạch ngắm chạy dọc khung thành và thanh lực. */
        drawShootout(ctx) {
            const pk = this.pk;
            if (!pk) return;

            // Băng rôn trên đầu
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = 'bold 34px "Baloo 2", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 12;
            const extra = Math.min(pk.taken[0], pk.taken[1]) >= PK_ROUNDS;
            ctx.fillText(extra ? '🥅 SUDDEN DEATH!' : '🥅 PENALTY SHOOTOUT', W / 2, 46);

            // Đang tới lượt ai
            ctx.font = 'bold 21px "Baloo 2", sans-serif';
            ctx.fillStyle = TEAMS[pk.team].light;
            ctx.fillText(`${pk.shooter.emoji} ${pk.shooter.name} — ${TEAMS[pk.team].name}`, W / 2, 74);

            // Bảng đếm quả: mỗi lượt một ô, xanh là vào, đỏ là hỏng
            const slots = Math.max(PK_ROUNDS, pk.taken[0], pk.taken[1]);
            for (const t of [0, 1]) {
                const y = 100 + t * 26;
                const total = slots * 24;
                let x = W / 2 - total / 2;
                ctx.textAlign = 'right';
                ctx.font = 'bold 14px "Baloo 2", sans-serif';
                ctx.fillStyle = TEAMS[t].light;
                ctx.fillText(TEAMS[t].name, x - 12, y + 5);
                for (let i = 0; i < slots; i++, x += 24) {
                    const r = pk.history[t][i];
                    ctx.beginPath();
                    ctx.arc(x + 9, y, 8, 0, Math.PI * 2);
                    if (r === true) { ctx.fillStyle = '#39ff14'; }
                    else if (r === false) { ctx.fillStyle = '#ff3b3b'; }
                    else { ctx.fillStyle = 'rgba(255,255,255,0.16)'; }
                    ctx.fill();
                    if (r === false) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(x + 5, y - 4); ctx.lineTo(x + 13, y + 4);
                        ctx.moveTo(x + 13, y - 4); ctx.lineTo(x + 5, y + 4);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();

            // Vạch ngắm chạy dọc khung thành
            if (pk.phase === 'aim' || pk.phase === 'charge') {
                const ay = this.pkAimY();
                const inside = ay > GOAL_T && ay < GOAL_B;
                ctx.save();
                ctx.strokeStyle = inside ? '#ffd700' : '#ff5566';
                ctx.lineWidth = 3;
                ctx.shadowColor = inside ? 'rgba(255,215,0,0.9)' : 'rgba(255,85,102,0.9)';
                ctx.shadowBlur = 14;
                const gx = pk.goalX, mx = gx - pk.dir * 30;
                // vạch ngắm nằm ngay trên vạch vôi, dựng cao bằng quả bóng
                pPath(ctx, [[gx - pk.dir * 26, ay, B_R], [gx + pk.dir * 8, ay, B_R]]);
                ctx.stroke();
                // vòng ngắm vẽ sát mặt cỏ nên bẹt đi theo phối cảnh
                const ms = dscale(ay);
                ctx.beginPath();
                ctx.ellipse(sx_(mx, ay), sy_(ay, B_R), 10 * ms, 10 * ms * 0.55, 0, 0, Math.PI * 2);
                ctx.stroke();
                pPath(ctx, [[mx, ay - M(0.14), B_R], [mx, ay + M(0.14), B_R]]);
                ctx.stroke();
                // đường nối từ bóng tới điểm ngắm
                ctx.globalAlpha = 0.45;
                ctx.setLineDash([8, 8]);
                ctx.lineWidth = 2;
                pPath(ctx, [[this.ball.x, this.ball.y, B_R], [mx, ay, B_R]]);
                ctx.stroke();
                ctx.restore();
            }

            // Thanh lực trên đầu người sút
            if (pk.phase === 'charge') {
                const ps = dscale(pk.shooter.y);
                const bw = 90 * ps, bh = 12 * ps;
                const bx = sx_(pk.shooter.x, pk.shooter.y) - bw / 2;
                const by = sy_(pk.shooter.y, -FIG.headY + FIG.headR) - 20 * ps;
                ctx.save();
                ctx.fillStyle = 'rgba(4,12,8,0.85)';
                ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 7); ctx.fill();
                const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
                g.addColorStop(0, '#7bed9f');
                g.addColorStop(0.6, '#ffd700');
                g.addColorStop(1, '#ff3b3b');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.roundRect(bx, by, bw * pk.power, bh, 6); ctx.fill();
                ctx.restore();
            }

            // Kết quả quả vừa sút
            if (pk.phase === 'result') {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.font = 'bold 44px "Baloo 2", sans-serif';
                ctx.fillStyle = pk.resultGood ? '#39ff14' : '#ff8a8a';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 16;
                ctx.fillText(pk.resultText, W / 2, MID_Y - 60);
                ctx.restore();
            }

            // Nhắc phím
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = 'bold 15px "Nunito", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(
                pk.phase === 'aim' ? `Hold ${pk.shooter.ctrl.actLabel} to charge` :
                    pk.phase === 'charge' ? 'Release to shoot!' : '',
                W / 2, H - 26);
            ctx.restore();
        },

        drawGoalBanner(ctx) {
            const t = 1 - clamp(this.goalT / 2.6, 0, 1);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.translate(W / 2, H / 2 - 40);
            const s = 1 + Math.sin(t * Math.PI) * 0.25;
            ctx.scale(s, s);
            ctx.font = 'bold 86px "Baloo 2", sans-serif';
            ctx.fillStyle = TEAMS[this.goalTeam].color;
            ctx.shadowColor = TEAMS[this.goalTeam].color;
            ctx.shadowBlur = 40;
            ctx.fillText('GOAL!', 0, 0);
            ctx.shadowBlur = 8;
            ctx.font = 'bold 30px "Baloo 2", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.goalText, 0, 48);
            ctx.restore();
        },

        drawEndBanner(ctx) {
            const [a, b] = this.scores;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = 'bold 62px "Baloo 2", sans-serif';
            const pulse = 1 + Math.sin(this.time * 4) * 0.04;
            ctx.translate(W / 2, 128);
            ctx.scale(pulse, pulse);
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 16;
            if (a === b) {
                ctx.fillStyle = '#b9ffb0';
                ctx.fillText('🤝 IT\'S A DRAW!', 0, 0);
            } else {
                const w = a > b ? 0 : 1;
                ctx.fillStyle = TEAMS[w].color;
                ctx.fillText(`🏆 ${TEAMS[w].name} WINS!`, 0, 0);
            }
            ctx.restore();
        },

        drawCountdown(ctx) {
            const n = Math.ceil(this.countdown);
            const frac = this.countdown - Math.floor(this.countdown);
            const label = n > 0 ? String(n) : 'KICK OFF!';
            const s = n > 0 ? 1 + (1 - frac) * 0.5 : 1.2;
            ctx.save();
            ctx.fillStyle = 'rgba(4,10,6,0.55)';
            ctx.fillRect(0, 0, W, H);
            ctx.translate(W / 2, H / 2);
            ctx.scale(s, s);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = 'bold 128px "Baloo 2", sans-serif';
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
