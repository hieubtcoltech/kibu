/* ============================================================================
 * KIBU Games — Strike Party (bowling)
 * ----------------------------------------------------------------------------
 * Vật lý chạy bằng đơn vị SI thật, đúng số liệu thi đấu:
 *
 *   bóng    ø0,2159 m (8,5 in) · 7,26 kg (16 lb)
 *   ki      ø0,1211 m (4,766 in) · 1,53 kg (3,4 lb) · cao 0,381 m
 *   khoảng cách tâm hai ki: 0,3048 m (12 in)
 *   lòng đường 1,0541 m (41,5 in) · rãnh hai bên 0,2350 m
 *
 * Tỉ lệ khối lượng bóng/ki là 4,7:1 — chính con số đó quyết định vì sao một cú
 * vào "pocket" đẩy được cả giàn ki đổ dây chuyền, còn cú đâm thẳng giữa đầu ki
 * lại để sót ki hai bên. Va chạm giải bằng xung lượng dọc pháp tuyến kèm xung
 * ma sát tiếp tuyến, y như game bóng rổ trong cùng bộ này.
 *
 * MỘT điểm rút gọn so với thật, và chỉ một: chiều dài đường chạy lấy 5,4 m thay
 * cho 18,29 m thi đấu, để cả đường lăn lọt vào màn hình mà ki vẫn đủ to cho bé
 * nhìn. Lớp dầu được co lại theo đúng tỉ lệ ấy nên đường cong của bóng vẫn
 * "ăn" ở cuối đường như ngoài đời.
 * ==========================================================================*/
(function () {
    'use strict';

    /* ---------------------------------------------------------------- *
     * 1. Hằng số thế giới thực (mét, kilôgam, giây)
     * ---------------------------------------------------------------- */
    const G = 9.81;

    const BALL_R = 0.10795, BALL_M = 7.26;
    const PIN_R = 0.06055, PIN_M = 1.53, PIN_H = 0.381;
    const PIN_GAP = 0.3048;                        // tâm-tới-tâm
    const ROW_DY = PIN_GAP * Math.sin(Math.PI / 3); // 0,264 m giữa hai hàng

    const LANE_W = 1.0541;                         // lòng đường
    const GUTTER_W = 0.2350;
    const HALF_W = LANE_W / 2;
    const LANE_LEN = 5.4;                          // rút gọn (thi đấu 18,29 m)
    const DECK_END = LANE_LEN + 1.15;              // qua mốc này là ki rơi xuống hố

    /* Hệ số đàn hồi. Ki gỗ phủ nhựa nảy khá tốt vào nhau; bóng nặng nên phần
       lớn động năng của nó truyền sang ki chứ không dội lại. */
    const E_BALL_PIN = 0.52;
    const E_PIN_PIN = 0.62;
    const MU_CONTACT = 0.18;                       // ma sát tiếp tuyến lúc va

    /* Ma sát giữa bóng và mặt đường. Nửa trước đường được tra dầu nên trơn,
       nửa sau khô — đó là lý do bóng đi gần như thẳng rồi mới bẻ cong ở đoạn
       cuối. Đây là "house shot", kiểu tra dầu phổ thông nhất. */
    const OIL_END = 0.62;                          // dầu phủ tới 62% chiều dài
    const MU_OIL = 0.035, MU_DRY = 0.19;
    const MU_PIN_LANE = 0.10;                      // ki trượt trên mặt đường

    /* ---------------------------------------------------------------- *
     * 2. Phép chiếu phối cảnh 2.5D
     * ---------------------------------------------------------------- *
     * Camera đặt sau vạch phạm lỗi CAM_D mét, nhìn dọc theo đường lăn. Mọi thứ
     * đi qua đúng một phép chiếu lỗ kim:
     *
     *      s(y) = CAM_D / (y + CAM_D)
     *
     * s là hệ số thu nhỏ theo khoảng cách. Nhân s vào bề ngang thì đường lăn ra
     * hình thang thu về điểm tụ; nhân s vào bán kính thì quả bóng nhỏ dần khi
     * lăn ra xa; nhân s vào chiều cao thì hàng ki sau thấp hơn hàng trước. Một
     * công thức lo cả ba, nên không có chỗ nào "giả 3D" bằng tay.
     *
     * Vật lý vẫn tính bằng mét trên mặt phẳng 2D — phối cảnh chỉ là cách nhìn.
     */
    const CH = 640;
    const FOUL_Y = 588;                            // vạch phạm lỗi trên màn hình
    const CAM_D = 7.2;                             // camera lùi sau vạch bao nhiêu mét
    let PPMX = 335, CW = 570, W = 1140;
    let SY_A = 900, SY_H = -300;                   // hệ số quy đổi chiều sâu → toạ độ màn

    /* camY = độ sâu đang nằm ở đáy màn hình. Bình thường bằng 0 (nhìn từ vạch
       phạm lỗi). Khi bóng lăn quá nửa đường, camera trườn theo bóng nên giàn ki
       phóng to dần — cú đổ ki diễn ra ngay trước mặt chứ không phải một chấm
       nhỏ tít trên đỉnh màn. */
    let camY = 0;

    function pscale(y) { return CAM_D / (y - camY + CAM_D); }

    /* Neo hai đầu: độ sâu camY rơi đúng FOUL_Y, hàng ki sau cùng rơi đúng
       TOP_PAD. Phải tính lại mỗi khi camera dịch. */
    function anchor() {
        const sEnd = pscale(DECK_BACK);
        SY_A = (FOUL_Y - TOP_PAD) / (1 - sEnd);
        SY_H = FOUL_Y - SY_A;
    }

    const LAYOUTS = {
        1: { cw: 620 }, 2: { cw: 570 }, 3: { cw: 470 }, 4: { cw: 400 }
    };
    const KEYSETS = {
        1: ['Space'],
        2: ['KeyA', 'KeyL'],
        3: ['KeyA', 'KeyG', 'KeyL'],
        4: ['KeyA', 'KeyF', 'KeyJ', 'KeyL']
    };
    const KEYLABEL = { Space: 'SPACE', KeyA: 'A', KeyF: 'F', KeyG: 'G', KeyJ: 'J', KeyL: 'L' };

    /* Hàng ki sau cùng nằm sâu hơn ki đầu 3 hàng — phải tính cả nó khi chọn tỉ
       lệ dọc, nếu không thì bốn ki hàng cuối bị đẩy lên trên mép canvas. */
    const DECK_BACK = LANE_LEN + 3 * ROW_DY;
    const TOP_PAD = 152;                 // chừa chỗ cho bảng điểm ở đầu màn

    function applyLayout(n) {
        CW = LAYOUTS[n].cw;
        W = CW * n;
        PPMX = CW / (LANE_W + GUTTER_W * 2 + 0.16);
        camY = 0;
        anchor();
    }

    /* ---------------------------------------------------------------- *
     * 3. Người chơi, chế độ, độ khó
     * ---------------------------------------------------------------- */
    const PLAYERS = [
        { name: 'KID 1', emoji: '🐯', color: '#ff8a3d', dark: '#a8430c', light: '#ffcda3', glow: '255,138,61' },
        { name: 'KID 2', emoji: '🐼', color: '#4dd2ff', dark: '#0d5f80', light: '#bceaff', glow: '77,210,255' },
        { name: 'KID 3', emoji: '🐸', color: '#5ee06a', dark: '#1a7a2c', light: '#c2f6c8', glow: '94,224,106' },
        { name: 'KID 4', emoji: '🦊', color: '#c77dff', dark: '#6a2ba8', light: '#e7ccff', glow: '199,125,255' }
    ];

    /* frames  = chơi theo hiệp, tính điểm bowling thật
       balls   = chơi theo số bóng, tính điểm đơn giản cho nhanh và gắt
       rack    = 'full'  dựng đủ 10 ki mỗi bóng
                 'leave' bày sẵn một thế ki sót có thật để bé dọn */
    const MODES = {
        versus: { key: 'versus', frames: 10, icon: '⚔️' },
        quick: { key: 'quick', frames: 5, icon: '⚡' },
        strike: { key: 'strike', balls: 8, rack: 'full', icon: '🎯' },
        spare: { key: 'spare', balls: 8, rack: 'leave', icon: '🧩' },
        practice: { key: 'practice', frames: 0, icon: '🧘' }
    };

    /* Các thế ki sót có thật trong bowling, kèm tên dân trong nghề vẫn gọi.
       Xếp từ dễ tới khó — bé càng chơi càng gặp thế hiểm. */
    const LEAVES = [
        { pins: [1, 2, 4, 7], name: 'BUCKET' },
        { pins: [3, 6, 9, 10], name: 'BUCKET' },
        { pins: [2, 4, 5, 8], name: 'BUCKET' },
        { pins: [1, 3], name: 'BABY SPLIT' },
        { pins: [4, 5], name: 'FIT-IN' },
        { pins: [5, 6], name: 'FIT-IN' },
        { pins: [6, 10], name: 'BABY SPLIT' },
        { pins: [4, 7], name: 'BABY SPLIT' },
        { pins: [3, 10], name: 'BABY SPLIT' },
        { pins: [2, 7], name: 'BABY SPLIT' },
        { pins: [5, 7], name: 'SPLIT' },
        { pins: [5, 10], name: 'SPLIT' },
        { pins: [6, 7, 10], name: 'BIG SPLIT' },
        { pins: [4, 6, 7, 10], name: 'BIG FOUR' },
        { pins: [7, 10], name: 'THE 7-10!' }
    ];

    /* Tên chuỗi strike liên tiếp — đúng tiếng lóng bowling. Ba cú liền gọi là
       TURKEY, cái tên vui này bé nào cũng thích. */
    function streakName(n) {
        if (n === 2) return 'DOUBLE!';
        if (n === 3) return 'TURKEY! 🦃';
        if (n === 4) return 'FOUR-BAGGER!';
        if (n === 5) return 'FIVE-BAGGER!';
        if (n >= 6) return n + '-BAGGER! 🔥';
        return null;
    }

    /* sweep = tốc độ mũi ngắm quét ngang, power = tốc độ thanh lực,
       hook = độ xoáy nghiêng lúc rời tay (rad/s), guide = có vẽ đường ngắm không */
    const DIFFS = {
        easy: { key: 'easy', sweep: 0.55, power: 1.05, hook: 3.0, guide: true, bumper: true },
        normal: { key: 'normal', sweep: 0.85, power: 1.45, hook: 5.5, guide: true, bumper: false },
        hard: { key: 'hard', sweep: 1.20, power: 1.90, hook: 8.0, guide: false, bumper: false },
        insane: { key: 'insane', sweep: 1.45, power: 2.20, hook: 11.0, guide: false, bumper: false, oilShift: true }
    };

    const SPEED_MIN = 4.6, SPEED_MAX = 8.8;        // m/s lúc rời tay (thật: 6-9)

    const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const TAU = Math.PI * 2;

    /* ---------------------------------------------------------------- *
     * 4. Âm thanh — tổng hợp bằng WebAudio, không dùng tệp
     * ---------------------------------------------------------------- */
    const Sfx = {
        on: true, ac: null,
        ensure() {
            if (!this.ac) {
                try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
            }
            if (this.ac.state === 'suspended') this.ac.resume();
            return this.ac;
        },
        tone(freq, dur, type, vol, slideTo) {
            if (!this.on) return;
            const ac = this.ensure(); if (!ac) return;
            const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(freq, t);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol || 0.14, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(ac.destination);
            o.start(t); o.stop(t + dur + 0.03);
        },
        noise(dur, vol, hp) {
            if (!this.on) return;
            const ac = this.ensure(); if (!ac) return;
            const n = Math.max(1, Math.floor(ac.sampleRate * dur));
            const buf = ac.createBuffer(1, n, ac.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
            const src = ac.createBufferSource(); src.buffer = buf;
            const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
            const g = ac.createGain(); g.gain.value = vol || 0.12;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },
        roll() { this.noise(0.5, 0.05, 180); },
        release() { this.tone(180, 0.18, 'sine', 0.12, 120); },
        charge(t) { this.tone(260 + t * 460, 0.05, 'square', 0.045); },
        pin(v) { const p = clamp(v / 6, 0.15, 1); this.tone(rnd(700, 1150), 0.09, 'triangle', 0.05 + p * 0.10, 380); this.noise(0.07, 0.04 + p * 0.05, 2200); },
        gutter() { this.tone(150, 0.5, 'sine', 0.09, 80); this.noise(0.4, 0.04, 240); },
        strike() { this.noise(0.7, 0.13, 400); [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.15), i * 105)); },
        spare() { [620, 830].forEach((f, i) => setTimeout(() => this.tone(f, 0.26, 'triangle', 0.13), i * 130)); },
        tick() { this.tone(880, 0.06, 'square', 0.09); },
        win() { this.noise(1.0, 0.09, 300); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.34, 'triangle', 0.16), i * 130)); }
    };

    /* ---------------------------------------------------------------- *
     * 5. Vị trí 10 ki theo tam giác chuẩn
     * ---------------------------------------------------------------- *
     *        7  8  9  10
     *         4  5  6
     *          2  3
     *           1            ← ki đầu, ở y = LANE_LEN
     */
    const PIN_SPOTS = (function () {
        const out = [];
        const rows = [[1], [2, 3], [4, 5, 6], [7, 8, 9, 10]];
        rows.forEach((row, r) => {
            row.forEach((num, i) => {
                out.push({
                    num,
                    x: (i - (row.length - 1) / 2) * PIN_GAP,
                    y: LANE_LEN + r * ROW_DY
                });
            });
        });
        return out;
    }());

    class Pin {
        constructor(spot) {
            this.num = spot.num;
            this.hx = spot.x; this.hy = spot.y;   // chỗ đứng gốc
            this.reset();
        }
        reset() {
            this.x = this.hx; this.y = this.hy;
            this.vx = 0; this.vy = 0;
            this.down = false;      // đã ngã
            this.gone = false;      // đã rơi xuống hố / ra khỏi sàn
            this.tilt = 0;          // góc nghiêng lúc vẽ
            this.spin = 0;
            this.wob = 0;
        }
        get active() { return !this.gone; }
    }

    class Ball {
        constructor() { this.reset(); }
        reset() {
            this.x = 0; this.y = 0;
            this.vx = 0; this.vy = 0;
            this.omega = 0;        // xoáy quanh trục đứng: dương = bẻ sang phải
            this.rot = 0;
            this.live = false;
            this.gutter = false;
            this.trail = [];
        }
    }

    /* ---------------------------------------------------------------- *
     * 6. Một đường bowling của một bé
     * ---------------------------------------------------------------- */
    class Lane {
        constructor(idx) {
            this.idx = idx;
            this.cfg = PLAYERS[idx];
            this.pins = PIN_SPOTS.map(s => new Pin(s));
            this.ball = new Ball();
            this.pops = [];
            this.sparks = [];
            this.streak = 0;      // số strike liên tiếp
            this.best = 0;        // chuỗi dài nhất trong ván
            this.points = 0;      // điểm cho các chế độ tính theo bóng
            this.strikes = 0;
            this.cleared = 0;
            this.full();
        }

        /* Dựng lại cả 10 ki (đầu mỗi hiệp) */
        full() {
            this.pins.forEach(p => p.reset());
            this.rollInFrame = 0;
            this.frameRolls = [];
            this.pinsAtRollStart = 10;
            this.leaveName = null;
        }

        /* Dựng lại đủ 10 ki nhưng KHÔNG mở hiệp mới — chỉ dùng ở hiệp cuối,
           nơi luật cho ném thêm bóng trên giàn ki mới. */
        rerack() {
            this.pins.forEach(p => p.reset());
            this.pinsAtRollStart = 10;
        }

        /* Bày sẵn một thế ki sót: dựng đủ 10 rồi cất đi những ki không thuộc
           thế đó. Dùng cho chế độ Dọn Ki Sót. */
        setLeave(leave) {
            this.pins.forEach(p => {
                p.reset();
                if (leave.pins.indexOf(p.num) < 0) p.gone = true;
            });
            this.leaveName = leave.name;
            this.leaveCount = leave.pins.length;
            this.pinsAtRollStart = leave.pins.length;
            this.rollInFrame = 0;
            this.frameRolls = [];
        }

        /* Chỉ dọn ki đã ngã, giữ nguyên ki còn đứng (cú ném thứ hai) */
        clearFallen() {
            this.pins.forEach(p => { if (p.down) p.gone = true; });
        }

        standing() { return this.pins.filter(p => !p.down && !p.gone).length; }

        /* ---------- Ném ---------- */
        startAim() {
            this.phase = 'aim';               // aim → charge → roll → settle
            this.aim = 0;                     // -1..1 vị trí mũi ngắm ngang
            this.aimDir = 1;
            this.power = 0;
            this.powerDir = 1;
            this.ball.reset();
            this.settle = 0;
            this.knockedThisRoll = 0;
        }

        press() {
            if (this.phase === 'aim') { this.phase = 'charge'; this.power = 0; this.powerDir = 1; }
        }

        release() {
            if (this.phase !== 'charge') return;
            const d = Game.diff;
            const speed = lerp(SPEED_MIN, SPEED_MAX, this.power);
            /* Mũi ngắm cho biết bóng rời tay ở đâu trên bề ngang lòng đường và
               đi chếch bao nhiêu. Xoáy nghiêng luôn cùng dấu với hướng chếch
               nên bóng bẻ ngược trở lại giữa — đúng kiểu ném hook của người
               chơi thuận tay phải. */
            const b = this.ball;
            b.x = this.aim * (HALF_W - BALL_R - 0.02);
            b.y = 0;
            const angle = -this.aim * 0.10;                 // rad, chếch nhẹ vào trong
            b.vx = Math.sin(angle) * speed;
            b.vy = Math.cos(angle) * speed;
            b.omega = -Math.sign(this.aim || 1) * d.hook * lerp(0.75, 1.15, this.power);
            b.live = true;
            b.gutter = false;
            this.phase = 'roll';
            this.pinsAtRollStart = this.standing();
            Sfx.release();
            Sfx.roll();
        }

        /* ---------- Ma sát mặt đường tại vị trí y ---------- */
        muAt(y) {
            let end = OIL_END * LANE_LEN;
            if (Game.diff.oilShift) end *= 0.78 + 0.22 * Math.sin(Game.clock * 0.6 + this.idx);
            if (y >= end) return MU_DRY;
            /* Vào cuối vệt dầu ma sát tăng dần chứ không nhảy bậc */
            const t = clamp((y - end * 0.72) / (end * 0.28), 0, 1);
            return lerp(MU_OIL, MU_DRY * 0.55, t);
        }

        /* ---------- Một bước vật lý ---------- */
        step(h) {
            const b = this.ball;

            if (b.live) {
                const sp = Math.hypot(b.vx, b.vy);

                if (!b.gutter) {
                    /* Điểm tiếp xúc của quả cầu đang vừa lăn tới vừa xoáy quanh
                       trục đứng trượt ngang so với mặt đường. Ma sát động chống
                       lại chỗ trượt đó, và chính nó đẩy bóng cong lại — bóng chỉ
                       bắt đầu ăn khi ra khỏi vệt dầu. */
                    const slip = b.vx + b.omega * BALL_R;
                    const mu = this.muAt(b.y);
                    const aF = mu * G;
                    if (Math.abs(slip) > 1e-4) {
                        const dv = Math.min(Math.abs(slip), aF * h) * Math.sign(slip);
                        b.vx -= dv;
                        /* Phản lực làm xoáy tắt dần: I = 2/5 mR² cho quả cầu đặc */
                        b.omega -= dv / (0.4 * BALL_R);
                    }
                    // ma sát lăn theo phương tới, nhỏ
                    const roll = 0.014 * G * h;
                    if (sp > roll) { b.vx -= b.vx / sp * roll; b.vy -= b.vy / sp * roll; }
                }

                b.x += b.vx * h;
                b.y += b.vy * h;
                b.rot += (sp / BALL_R) * h;

                // Rãnh hai bên
                const edge = HALF_W - BALL_R;
                if (!b.gutter && Math.abs(b.x) > edge) {
                    if (Game.diff.bumper) {
                        /* Chế độ Dễ có thanh chắn rãnh như sân dành cho trẻ em */
                        b.x = Math.sign(b.x) * edge;
                        b.vx = -b.vx * 0.45;
                        b.omega *= 0.6;
                        Sfx.tone(240, 0.1, 'sine', 0.07);
                    } else {
                        b.gutter = true;
                        b.vx = 0;
                        b.x = Math.sign(b.x) * (HALF_W + GUTTER_W * 0.5);
                        Sfx.gutter();
                    }
                }

                if (b.y > DECK_END + 0.5) b.live = false;
                if (sp < 0.25 && b.y > 0.5) b.live = false;
            }

            /* --- Va chạm bóng ↔ ki --- */
            if (b.live && !b.gutter) {
                for (const p of this.pins) {
                    if (!p.active) continue;
                    const dx = p.x - b.x, dy = p.y - b.y;
                    const d2 = dx * dx + dy * dy;
                    const rr = BALL_R + PIN_R;
                    if (d2 < rr * rr && d2 > 1e-9) {
                        const d = Math.sqrt(d2);
                        this.impulse(b, BALL_M, p, PIN_M, dx / d, dy / d, E_BALL_PIN);
                        const push = (rr - d);
                        p.x += dx / d * push; p.y += dy / d * push;
                        this.knock(p, Math.hypot(p.vx, p.vy));
                    }
                }
            }

            /* --- Va chạm ki ↔ ki (phản ứng dây chuyền) --- */
            for (let i = 0; i < this.pins.length; i++) {
                const a = this.pins[i];
                if (!a.active) continue;
                for (let j = i + 1; j < this.pins.length; j++) {
                    const c = this.pins[j];
                    if (!c.active) continue;
                    const dx = c.x - a.x, dy = c.y - a.y;
                    const d2 = dx * dx + dy * dy;
                    const rr = PIN_R * 2;
                    if (d2 < rr * rr && d2 > 1e-9) {
                        const d = Math.sqrt(d2);
                        const nx = dx / d, ny = dy / d;
                        const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
                        if (rel < 0) {
                            this.impulse(a, PIN_M, c, PIN_M, nx, ny, E_PIN_PIN);
                            const v = Math.abs(rel);
                            this.knock(a, v); this.knock(c, v);
                        }
                        const push = (rr - d) * 0.5;
                        a.x -= nx * push; a.y -= ny * push;
                        c.x += nx * push; c.y += ny * push;
                    }
                }
            }

            /* --- Ki trượt rồi dừng, hoặc rơi khỏi sàn --- */
            for (const p of this.pins) {
                if (!p.active) continue;
                const sp = Math.hypot(p.vx, p.vy);
                if (sp > 1e-4) {
                    const dec = MU_PIN_LANE * G * h;
                    if (sp <= dec) { p.vx = 0; p.vy = 0; }
                    else { p.vx -= p.vx / sp * dec; p.vy -= p.vy / sp * dec; }
                    p.x += p.vx * h;
                    p.y += p.vy * h;
                    p.wob = Math.min(1, p.wob + sp * h * 2);
                }
                if (p.down) {
                    p.tilt = Math.min(1, p.tilt + h * 6);
                    p.spin += p.spinV * h;
                }
                if (p.y > DECK_END || Math.abs(p.x) > HALF_W + GUTTER_W * 0.9 || p.y < LANE_LEN - 1.4) {
                    p.gone = true;
                }
            }
        }

        /* Xung lượng giữa hai vật tròn theo pháp tuyến n, kèm xung ma sát tiếp
           tuyến. Cùng công thức game bóng rổ dùng cho bóng va vành. */
        impulse(A, mA, B, mB, nx, ny, e) {
            const rvx = B.vx - A.vx, rvy = B.vy - A.vy;
            const vn = rvx * nx + rvy * ny;
            if (vn > 0) return 0;
            const invA = 1 / mA, invB = 1 / mB;
            const j = -(1 + e) * vn / (invA + invB);
            A.vx -= j * invA * nx; A.vy -= j * invA * ny;
            B.vx += j * invB * nx; B.vy += j * invB * ny;

            const tx = -ny, ty = nx;
            const vt = rvx * tx + rvy * ty;
            let jt = -vt / (invA + invB);
            const lim = MU_CONTACT * Math.abs(j);
            jt = clamp(jt, -lim, lim);
            A.vx -= jt * invA * tx; A.vy -= jt * invA * ty;
            B.vx += jt * invB * tx; B.vy += jt * invB * ty;
            return Math.abs(vn);
        }

        /* Ki thật đổ khi bị hích đủ mạnh hoặc bị đẩy lệch khỏi chỗ đứng. */
        knock(p, v) {
            if (p.down) return;
            const moved = Math.hypot(p.x - p.hx, p.y - p.hy);
            if (v < 0.55 && moved < 0.035) return;
            p.down = true;
            p.spinV = rnd(-9, 9);
            p.tiltDir = Math.sign(p.vx || rnd(-1, 1));
            this.knockedThisRoll++;
            Sfx.pin(v);
            this.burst(p.x, p.y, 6);
        }

        /* ---------- Hiệu ứng ---------- */
        burst(x, y, n) {
            for (let i = 0; i < n; i++) {
                const a = Math.random() * TAU, s = rnd(0.6, 2.4);
                this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.2, 0.45), max: 0.45 });
            }
        }
        pop(x, y, text, color, size) {
            this.pops.push({ x, y, text, color, size: size || 22, life: 1.1, max: 1.1 });
        }
        stepFx(dt) {
            for (let i = this.sparks.length - 1; i >= 0; i--) {
                const s = this.sparks[i];
                s.x += s.vx * dt; s.y += s.vy * dt;
                s.vx *= 0.92; s.vy *= 0.92;
                s.life -= dt;
                if (s.life <= 0) this.sparks.splice(i, 1);
            }
            for (let i = this.pops.length - 1; i >= 0; i--) {
                const p = this.pops[i];
                p.life -= dt;
                p.y += dt * 0.35;
                if (p.life <= 0) this.pops.splice(i, 1);
            }
        }

        /* ---------- Cập nhật mỗi khung hình ---------- */
        update(dt, held) {
            const d = Game.diff;
            this.stepFx(dt);

            if (this.phase === 'aim') {
                this.aim += this.aimDir * d.sweep * dt;
                if (this.aim > 1) { this.aim = 1; this.aimDir = -1; }
                if (this.aim < -1) { this.aim = -1; this.aimDir = 1; }
            } else if (this.phase === 'charge') {
                this.power += this.powerDir * d.power * dt;
                if (this.power > 1) { this.power = 1; this.powerDir = -1; }
                if (this.power < 0) { this.power = 0; this.powerDir = 1; }
                if (!held) this.release();
                else if (Math.random() < 0.25) Sfx.charge(this.power);
            } else if (this.phase === 'roll') {
                /* Bước nhỏ cố định: va chạm nhiều vật cần bước đủ mịn để không
                   có ki nào "xuyên" qua ki khác giữa hai khung hình. */
                const steps = 6;
                const h = Math.min(dt, 0.05) / steps;
                for (let i = 0; i < steps; i++) this.step(h);

                const moving = this.pins.some(p => p.active && Math.hypot(p.vx, p.vy) > 0.05);
                if (!this.ball.live && !moving) {
                    this.settle += dt;
                    if (this.settle > 0.75) this.finishRoll();
                } else this.settle = 0;
            }
        }

        finishRoll() {
            this.phase = 'done';
            Game.onRollDone(this);
        }
    }

    /* ---------------------------------------------------------------- *
     * 7. Tính điểm theo luật 10 ki
     * ---------------------------------------------------------------- *
     * rolls[] là chuỗi số ki đổ của từng cú ném. Strike cộng thêm 2 cú kế,
     * spare cộng thêm 1 cú kế — đúng luật thật, kể cả hiệp 10 được ném thêm.
     */
    function scoreOf(rolls, maxFrames) {
        let total = 0, i = 0;
        const frames = [];
        for (let f = 0; f < maxFrames; f++) {
            if (i >= rolls.length) break;
            if (rolls[i] === 10) {                       // strike
                const b1 = rolls[i + 1], b2 = rolls[i + 2];
                const bonus = (b1 === undefined ? 0 : b1) + (b2 === undefined ? 0 : b2);
                total += 10 + bonus;
                frames.push({ mark: 'X', a: 10, b: null, total, complete: b1 !== undefined && b2 !== undefined });
                i += 1;
            } else {
                const a = rolls[i], b = rolls[i + 1];
                if (b === undefined) {
                    total += a;
                    frames.push({ mark: null, a, b: null, total, complete: false });
                    i += 1;
                } else if (a + b === 10) {               // spare
                    const b1 = rolls[i + 2];
                    total += 10 + (b1 === undefined ? 0 : b1);
                    frames.push({ mark: '/', a, b, total, complete: b1 !== undefined });
                    i += 2;
                } else {
                    total += a + b;
                    frames.push({ mark: null, a, b, total, complete: true });
                    i += 2;
                }
            }
        }
        return { total, frames };
    }

    /* ---------------------------------------------------------------- *
     * 8. Trò chơi
     * ---------------------------------------------------------------- */
    const Game = {
        n: 2, mode: MODES.versus, diff: DIFFS.normal,
        lanes: [], turn: 0, frame: 0, clock: 0,
        running: false, paused: false,
        held: [false, false, false, false],
        rolls: [[], [], [], []],

        init() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.wireInput();
            this.wireButtons();
            this.loop();
        },

        resize() {
            const box = this.canvas.parentElement.getBoundingClientRect();
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.vw = Math.max(320, box.width);
            this.vh = Math.max(260, box.height);
            this.canvas.width = Math.round(this.vw * this.dpr);
            this.canvas.height = Math.round(this.vh * this.dpr);
            this.canvas.style.width = this.vw + 'px';
            this.canvas.style.height = this.vh + 'px';
            this.scale = Math.min(this.vw / W, this.vh / CH);
            this.offX = (this.vw - W * this.scale) / 2;
            this.offY = (this.vh - CH * this.scale) / 2;
        },

        start(n, modeKey, diffKey) {
            this.n = n;
            this.mode = MODES[modeKey];
            this.diff = DIFFS[diffKey];
            applyLayout(n);
            this.lanes = [];
            for (let i = 0; i < n; i++) this.lanes.push(new Lane(i));
            this.rolls = [[], [], [], []];
            this.turn = 0;
            this.frame = 0;
            this.clock = 0;
            this.running = true;
            this.paused = false;
            this.over = false;
            this.resize();
            this.lanes.forEach(l => {
                l.full(); l.phase = 'idle';
                l.points = 0; l.strikes = 0; l.cleared = 0;
                l.streak = 0; l.best = 0; l.ballsUsed = 0;
            });
            this.beginTurn();
            this.syncHud();
        },

        maxFrames() { return this.mode.frames || 99; },

        beginTurn() {
            const l = this.lanes[this.turn];
            if (this.mode.rack === 'full') l.full();
            else if (this.mode.rack === 'leave') {
                /* Thế ki khó dần theo vòng: mở màn bằng mấy thế dễ, càng về
                   sau càng gặp thế hiểm như 7-10. */
                const t = this.frame / Math.max(1, this.mode.balls - 1);
                const base = Math.floor(t * (LEAVES.length - 3));
                l.setLeave(LEAVES[clamp(base + Math.floor(Math.random() * 3), 0, LEAVES.length - 1)]);
            }
            l.startAim();
            this.syncHud();
        },

        /* Điểm hiển thị: chế độ theo hiệp dùng luật bowling thật, chế độ theo
           bóng dùng điểm cộng nhanh. */
        scoreFor(idx) {
            if (this.mode.balls) return this.lanes[idx].points;
            return scoreOf(this.rolls[idx], this.maxFrames()).total;
        },

        onRollDone(lane) {
            const knocked = lane.pinsAtRollStart - lane.standing();
            const cleared = lane.standing() === 0;
            const byBall = !!this.mode.balls;

            if (byBall) { this.finishBallMode(lane, knocked, cleared); return; }

            this.rolls[lane.idx].push(knocked);
            lane.frameRolls.push(knocked);

            const fr = lane.frameRolls;
            const rif = lane.rollInFrame;              // 0, 1 hoặc 2
            const isLast = !!this.mode.frames && this.frame === this.mode.frames - 1;
            const strike = rif === 0 && knocked === 10;

            if (strike) {
                this.onStrike(lane);
            } else if (rif > 0 && cleared && knocked > 0) {
                lane.streak = 0;
                lane.pop(0, LANE_LEN + 0.5, 'SPARE!', '#7bdcff', 30);
                Sfx.spare();
            } else {
                lane.streak = 0;
                if (knocked > 0) lane.pop(0, LANE_LEN + 0.5, '+' + knocked, lane.cfg.color, 26);
                else lane.pop(0, LANE_LEN + 0.5, lane.ball.gutter ? 'GUTTER' : 'MISS', '#9aa4b8', 22);
            }

            /* Còn bóng nữa trong hiệp này không?
               Hiệp thường: hết khi strike, hoặc khi đã ném đủ hai bóng.
               Hiệp cuối: luôn được hai bóng, và được bóng thứ ba nếu bóng đầu
               là strike hoặc hai bóng đầu cộng lại đủ 10 — đúng luật thật. */
            let more;
            if (!isLast) {
                more = !strike && rif < 1;
            } else if (rif === 0) {
                more = true;
            } else if (rif === 1) {
                more = fr[0] === 10 || fr[0] + fr[1] === 10;
            } else {
                more = false;
            }

            setTimeout(() => {
                if (!this.running) return;
                if (!more) {
                    lane.full();
                    this.nextTurn();
                } else {
                    if (cleared) lane.rerack();
                    else {
                        lane.clearFallen();
                        lane.pinsAtRollStart = lane.standing();
                    }
                    lane.rollInFrame = rif + 1;
                    lane.startAim();      /* không đụng tới frameRolls */
                }
                this.syncHud();
            }, 1100);
        },

        /* Chế độ tính theo bóng: mỗi lượt đúng một quả, điểm cộng ngay, sang
           bé kế tiếp luôn — nhịp nhanh và gắt hơn hẳn chơi đủ 10 hiệp. */
        finishBallMode(lane, knocked, cleared) {
            lane.ballsUsed = (lane.ballsUsed || 0) + 1;

            if (this.mode.rack === 'leave') {
                lane.cleared += cleared ? 1 : 0;
                /* Dọn sạch được thưởng đậm, dọn dở vẫn có điểm theo số ki đổ */
                lane.points += knocked + (cleared ? 10 : 0);
                lane.streak = cleared ? lane.streak + 1 : 0;
                if (cleared) {
                    lane.pop(0, LANE_LEN + 0.5, 'CLEARED! +' + (knocked + 10), '#7bdcff', 28);
                    Sfx.spare();
                } else {
                    lane.pop(0, LANE_LEN + 0.5, knocked ? '+' + knocked : 'MISS', knocked ? lane.cfg.color : '#9aa4b8', 24);
                }
            } else {
                const strike = knocked === 10;
                lane.points += knocked + (strike ? 10 : 0);
                if (strike) { lane.strikes++; this.onStrike(lane); }
                else {
                    lane.streak = 0;
                    if (knocked > 0) lane.pop(0, LANE_LEN + 0.5, '+' + knocked, lane.cfg.color, 26);
                    else lane.pop(0, LANE_LEN + 0.5, lane.ball.gutter ? 'GUTTER' : 'MISS', '#9aa4b8', 22);
                }
            }

            setTimeout(() => {
                if (!this.running) return;
                lane.full();
                this.nextTurn();
                this.syncHud();
            }, 1100);
        },

        /* Ăn mừng strike, kèm tên chuỗi theo đúng tiếng lóng bowling */
        onStrike(lane) {
            lane.streak++;
            lane.best = Math.max(lane.best, lane.streak);
            const nm = streakName(lane.streak);
            lane.pop(0, LANE_LEN + 0.5, 'STRIKE!', '#ffd166', 34);
            if (nm) setTimeout(() => lane.pop(0, LANE_LEN + 1.0, nm, '#ff7a3d', 30), 420);
            Sfx.strike();
            for (let i = 0; i < 26; i++) lane.burst(rnd(-0.4, 0.4), LANE_LEN + rnd(0, 0.6), 1);
        },

        nextTurn() {
            this.turn++;
            if (this.turn >= this.n) {
                this.turn = 0;
                this.frame++;
                const limit = this.mode.balls || this.mode.frames;
                if (limit && this.frame >= limit) { this.finish(); return; }
            }
            this.beginTurn();
        },

        finish() {
            this.running = false;
            this.over = true;
            Sfx.win();
            const rows = this.lanes.map(l => ({
                idx: l.idx, cfg: l.cfg, score: this.scoreFor(l.idx),
                extra: this.mode.rack === 'leave' ? (l.cleared + ' 🧩')
                    : (this.mode.rack === 'full' ? (l.strikes + ' ❌')
                        : (l.best >= 2 ? 'chuỗi ' + l.best + ' ❌' : ''))
            })).sort((a, b) => b.score - a.score);
            Screens.showOver(rows);
        },

        /* ---------- Nhập liệu ---------- */
        wireInput() {
            const keyIdx = code => {
                const set = KEYSETS[this.n] || [];
                return set.indexOf(code);
            };
            window.addEventListener('keydown', e => {
                if (e.repeat) return;
                if (e.code === 'Escape') { this.togglePause(); return; }
                const i = keyIdx(e.code);
                if (i < 0 || i !== this.turn || !this.running || this.paused) return;
                e.preventDefault();
                this.held[i] = true;
                this.lanes[i].press();
            });
            window.addEventListener('keyup', e => {
                const i = keyIdx(e.code);
                if (i < 0) return;
                this.held[i] = false;
            });

            /* Cảm ứng: bé chạm vào đúng làn của mình */
            const down = ev => {
                if (!this.running || this.paused) return;
                const t = ev.touches ? ev.touches[0] : ev;
                const r = this.canvas.getBoundingClientRect();
                const lx = (t.clientX - r.left - this.offX) / this.scale;
                const i = clamp(Math.floor(lx / CW), 0, this.n - 1);
                if (i !== this.turn) return;
                ev.preventDefault();
                this.held[i] = true;
                this.lanes[i].press();
            };
            const up = () => { this.held[this.turn] = false; };
            this.canvas.addEventListener('pointerdown', down);
            window.addEventListener('pointerup', up);
            window.addEventListener('pointercancel', up);
        },

        wireButtons() {
            const $ = id => document.getElementById(id);
            $('btn-sound').addEventListener('click', () => {
                Sfx.on = !Sfx.on;
                $('sound-icon').className = 'fa-solid ' + (Sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
                $('btn-sound').classList.toggle('muted', !Sfx.on);
                if (Sfx.on) Sfx.tick();
            });
            $('btn-menu').addEventListener('click', () => { this.running = false; Screens.showMenu(); });
            $('btn-restart').addEventListener('click', () => Screens.restart());
        },

        togglePause() {
            if (!this.running) return;
            this.paused = !this.paused;
            document.getElementById('screen-pause').classList.toggle('hidden', !this.paused);
        },

        /* ---------- HUD ---------- */
        syncHud() {
            /* Một hàng chip nằm ngang thay cho mỗi bé một dòng: cao cố định dù
               có 1 hay 4 bé, nên trên điện thoại nằm ngang bảng điểm không bao
               giờ trùm xuống che mất giàn ki. Dãy ô hiệp chi tiết chỉ hiện cho
               bé đang tới lượt, ở khung bên phải. */
            const maxF = this.maxFrames();
            const wrap = document.getElementById('score-rows');
            if (wrap) {
                wrap.innerHTML = this.lanes.map(l => {
                    const fire = l.streak >= 2 ? '<i class="pc-fire">' + (l.streak >= 3 ? '🔥' : '❌') + l.streak + '</i>' : '';
                    return '<span class="pchip' + (l.idx === this.turn ? ' active' : '') + '" style="--pc:' + l.cfg.color + '">'
                        + '<i class="pc-emoji">' + l.cfg.emoji + '</i>'
                        + '<b class="pc-score">' + this.scoreFor(l.idx) + '</b>' + fire + '</span>';
                }).join('');
            }

            const turnEl = document.getElementById('turn-label');
            const boxEl = document.getElementById('turn-frames');
            const l = this.lanes[this.turn];
            if (turnEl && l) {
                const limit = this.mode.balls || this.mode.frames;
                const f = limit ? ((this.frame + 1) + '/' + limit) : '∞';
                turnEl.innerHTML = l.cfg.emoji + ' <b>' + l.cfg.name + '</b> · ' + f;
                turnEl.style.color = l.cfg.color;
            }

            /* Chế độ theo bóng không có hiệp để bày ô — thay bằng thứ đang đua:
               số strike, hoặc tên thế ki sót đang phải dọn. */
            if (boxEl && l && this.mode.balls) {
                boxEl.innerHTML = this.mode.rack === 'leave'
                    ? '<span class="fbox wide">' + (l.leaveName || '') + '</span><span class="fbox">🧩' + l.cleared + '</span>'
                    : '<span class="fbox">❌' + l.strikes + '</span>';
                boxEl.style.setProperty('--pc', l.cfg.color);
            } else if (boxEl && l) {
                /* Cửa sổ 5 hiệp quanh hiệp đang chơi — đủ để thấy đà, không
                   chiếm hết bề ngang khi chơi đủ 10 hiệp. */
                const sc = scoreOf(this.rolls[l.idx], maxF);
                const total = this.mode.frames || Math.max(5, sc.frames.length + 1);
                const start = clamp(this.frame - 2, 0, Math.max(0, Math.min(total, 10) - 5));
                const out = [];
                for (let f = start; f < Math.min(start + 5, Math.min(total, 10)); f++) {
                    const fr = sc.frames[f];
                    let m = '';
                    if (fr) m = fr.mark === 'X' ? 'X' : (fr.mark === '/' ? (fr.a + '/') : (fr.b === null ? String(fr.a) : fr.a + ' ' + fr.b));
                    out.push('<span class="fbox' + (f === this.frame ? ' cur' : '') + '">' + m + '</span>');
                }
                boxEl.innerHTML = out.join('');
                boxEl.style.setProperty('--pc', l.cfg.color);
            }
        },

        /* ---------- Vòng lặp ---------- */
        loop() {
            let last = performance.now();
            const frame = now => {
                const dt = Math.min(0.05, (now - last) / 1000);
                last = now;
                if (this.running && !this.paused) {
                    this.clock += dt;
                    for (const l of this.lanes) l.update(dt, this.held[l.idx]);
                    this.stepCamera(dt);
                }
                this.draw();
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
        },

        /* ================= VẼ ================= */
        /* Camera trườn theo quả bóng của bé đang ném. Dùng chung cho mọi làn để
           giàn ki các làn luôn nằm cùng một độ cao — mỗi làn một camera riêng
           thì nhìn rất lệch. */
        stepCamera(dt) {
            const l = this.lanes[this.turn];
            const b = l && l.ball;
            let target = 0;
            if (b && (b.live || l.settle > 0) && b.y > LANE_LEN * 0.42) {
                target = clamp(b.y - 2.05, 0, LANE_LEN - 1.75);
            }
            /* Tiến nhanh, lùi chậm: bám kịp quả bóng đang lao tới nhưng lúc trả
               về vạch phạm lỗi thì trôi êm, không giật. */
            const k = target > camY ? 6.5 : 2.2;
            camY += (target - camY) * Math.min(1, k * dt);
            if (Math.abs(camY - target) < 0.002) camY = target;
            anchor();
        },

        /* Ba hàm chiếu — mọi thứ vẽ ra đều đi qua chúng */
        sx(lane, x, y) { return lane.idx * CW + CW / 2 + x * PPMX * pscale(y); },
        sy(y) { return SY_H + SY_A * pscale(y); },
        ss(y) { return PPMX * pscale(y); },        // pixel trên mét ở độ sâu y

        draw() {
            const ctx = this.ctx;
            ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
            ctx.clearRect(0, 0, this.vw, this.vh);
            ctx.fillStyle = '#0b0f1c';
            ctx.fillRect(0, 0, this.vw, this.vh);
            if (!this.lanes.length) return;

            ctx.save();
            ctx.translate(this.offX, this.offY);
            ctx.scale(this.scale, this.scale);

            for (const l of this.lanes) this.drawLane(ctx, l);
            for (const l of this.lanes) this.drawPins(ctx, l);
            for (const l of this.lanes) this.drawBall(ctx, l);
            for (const l of this.lanes) this.drawFx(ctx, l);
            for (const l of this.lanes) this.drawAim(ctx, l);

            ctx.restore();
        },

        /* Một mảng hình thang trải từ độ sâu y0 tới y1, rộng ±hw mét */
        quad(ctx, l, hw, y0, y1) {
            ctx.beginPath();
            ctx.moveTo(this.sx(l, -hw, y0), this.sy(y0));
            ctx.lineTo(this.sx(l, hw, y0), this.sy(y0));
            ctx.lineTo(this.sx(l, hw, y1), this.sy(y1));
            ctx.lineTo(this.sx(l, -hw, y1), this.sy(y1));
            ctx.closePath();
        },

        drawLane(ctx, l) {
            const x0 = l.idx * CW;
            /* Phối cảnh làm mặt sàn loe rộng ra ở phía trước vạch phạm lỗi, quá
               cả bề ngang ô của bé — cắt lại đúng ô, nếu không hai làn cạnh nhau
               sẽ chồng lên nhau. */
            ctx.save();
            ctx.beginPath(); ctx.rect(x0, 0, CW, CH); ctx.clip();
            const yBack = DECK_END + 0.30, yFront = -0.9;   // hụt ra trước vạch một chút
            const GW = HALF_W + GUTTER_W;

            // nền quán
            ctx.fillStyle = '#0d1220';
            ctx.fillRect(x0, 0, CW, CH);

            /* --- Tường cuối và hố ki: mảng tối phía sau giàn ki, cho mắt biết
                   đường lăn kết thúc ở đâu chứ không trôi vào hư không --- */
            const backY = this.sy(yBack);
            ctx.fillStyle = '#070a13';
            ctx.fillRect(x0, 0, CW, backY);
            const pitG = ctx.createLinearGradient(0, backY - 46, 0, backY);
            pitG.addColorStop(0, 'rgba(0,0,0,0)');
            pitG.addColorStop(1, 'rgba(0,0,0,0.75)');
            ctx.fillStyle = pitG;
            ctx.fillRect(x0, backY - 46, CW, 46);

            // --- Rãnh hai bên (hình thang) ---
            const gg = ctx.createLinearGradient(0, backY, 0, FOUL_Y);
            gg.addColorStop(0, '#101626'); gg.addColorStop(1, '#243052');
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.moveTo(this.sx(l, -GW, yFront), this.sy(yFront));
            ctx.lineTo(this.sx(l, -HALF_W, yFront), this.sy(yFront));
            ctx.lineTo(this.sx(l, -HALF_W, yBack), this.sy(yBack));
            ctx.lineTo(this.sx(l, -GW, yBack), this.sy(yBack));
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.sx(l, GW, yFront), this.sy(yFront));
            ctx.lineTo(this.sx(l, HALF_W, yFront), this.sy(yFront));
            ctx.lineTo(this.sx(l, HALF_W, yBack), this.sy(yBack));
            ctx.lineTo(this.sx(l, GW, yBack), this.sy(yBack));
            ctx.closePath(); ctx.fill();

            // --- Mặt gỗ ---
            const wg = ctx.createLinearGradient(0, backY, 0, FOUL_Y);
            wg.addColorStop(0, '#a9752f'); wg.addColorStop(0.5, '#d19d55'); wg.addColorStop(1, '#f3cf93');
            ctx.fillStyle = wg;
            this.quad(ctx, l, HALF_W, yFront, yBack);
            ctx.fill();

            /* Ván dọc: hai đầu chiếu riêng nên các đường tự chụm về điểm tụ —
               đây là thứ khiến mắt đọc ra chiều sâu ngay lập tức. */
            ctx.strokeStyle = 'rgba(86,52,18,0.26)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 24; i++) {
                const bx = -HALF_W + (LANE_W) * i / 24;
                ctx.beginPath();
                ctx.moveTo(this.sx(l, bx, yFront), this.sy(yFront));
                ctx.lineTo(this.sx(l, bx, yBack), this.sy(yBack));
                ctx.stroke();
            }

            // --- Vệt dầu bóng loáng ở nửa trước đường ---
            const oilY = OIL_END * LANE_LEN;
            const og = ctx.createLinearGradient(0, this.sy(oilY), 0, FOUL_Y);
            og.addColorStop(0, 'rgba(190,235,255,0.02)');
            og.addColorStop(1, 'rgba(190,235,255,0.15)');
            ctx.fillStyle = og;
            this.quad(ctx, l, HALF_W * 0.97, 0, oilY);
            ctx.fill();

            // --- 7 mũi tên ngắm, thu nhỏ dần theo chiều sâu ---
            for (let i = -3; i <= 3; i++) {
                const ay = LANE_LEN * 0.30 + Math.abs(i) * 0.10;
                const s = this.ss(ay);
                const ax = this.sx(l, i * (LANE_W / 8), ay), ayy = this.sy(ay);
                ctx.fillStyle = 'rgba(78,44,10,0.6)';
                ctx.beginPath();
                ctx.moveTo(ax, ayy - 0.09 * s);
                ctx.lineTo(ax + 0.05 * s, ayy + 0.04 * s);
                ctx.lineTo(ax - 0.05 * s, ayy + 0.04 * s);
                ctx.closePath(); ctx.fill();
            }

            // --- Sàn để ki: gỗ sáng hơn, có lằn ranh rõ ---
            ctx.fillStyle = 'rgba(255,244,214,0.14)';
            this.quad(ctx, l, HALF_W, LANE_LEN - 0.28, yBack);
            ctx.fill();
            ctx.strokeStyle = 'rgba(60,34,10,0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.sx(l, -HALF_W, LANE_LEN - 0.28), this.sy(LANE_LEN - 0.28));
            ctx.lineTo(this.sx(l, HALF_W, LANE_LEN - 0.28), this.sy(LANE_LEN - 0.28));
            ctx.stroke();

            // --- Vạch phạm lỗi ---
            ctx.strokeStyle = 'rgba(255,86,86,0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.sx(l, -HALF_W, 0), FOUL_Y);
            ctx.lineTo(this.sx(l, HALF_W, 0), FOUL_Y);
            ctx.stroke();

            // vách ngăn giữa các làn
            if (l.idx > 0) {
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, CH); ctx.stroke();
            }

            // viền màu của bé đang tới lượt (đỏ rực khi đang có chuỗi strike)
            if (l.idx === this.turn && this.running) {
                const fire = l.streak >= 3;
                ctx.strokeStyle = fire ? 'rgba(255,140,40,0.85)' : 'rgba(' + l.cfg.glow + ',0.55)';
                ctx.lineWidth = fire ? 5 : 3;
                ctx.strokeRect(x0 + 3, 3, CW - 6, CH - 6);
            }
            ctx.restore();
        },

        drawPins(ctx, l) {
            /* Vẽ từ xa tới gần: ki hàng trước phải che ki hàng sau đúng như mắt
               thấy. Bán kính lẫn chiều cao đều nhân pscale nên hàng sau vừa nhỏ
               vừa thấp hơn — đó là toàn bộ cảm giác chiều sâu của giàn ki, và
               nhờ có phối cảnh nên vẽ được gần đúng chiều cao thật. */
            const list = l.pins.filter(p => p.active).slice().sort((a, b) => b.y - a.y);
            for (const p of list) {
                const s = this.ss(p.y);
                const px = this.sx(l, p.x, p.y), py = this.sy(p.y);
                const r = PIN_R * s;
                const hgt = PIN_H * s * 0.80;

                ctx.save();
                ctx.translate(px, py);

                // bóng đổ trên mặt gỗ
                ctx.fillStyle = 'rgba(20,10,0,0.32)';
                ctx.beginPath();
                ctx.ellipse(0, 0, r * 1.18, r * 0.40, 0, 0, TAU);
                ctx.fill();

                if (p.down) {
                    ctx.rotate((p.tiltDir || 1) * p.tilt * 1.15 + p.spin * 0.06);
                    ctx.globalAlpha = 0.92;
                }

                const t = p.down ? 1 - p.tilt * 0.55 : 1;
                const H = hgt * t;

                // thân ki
                const g = ctx.createLinearGradient(-r, 0, r, 0);
                g.addColorStop(0, '#d8dee9'); g.addColorStop(0.4, '#ffffff'); g.addColorStop(1, '#b9c2d0');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(-r * 0.62, 0);
                ctx.bezierCurveTo(-r * 1.05, -H * 0.22, -r * 0.34, -H * 0.42, -r * 0.40, -H * 0.60);
                ctx.bezierCurveTo(-r * 0.46, -H * 0.86, -r * 0.30, -H, 0, -H);
                ctx.bezierCurveTo(r * 0.30, -H, r * 0.46, -H * 0.86, r * 0.40, -H * 0.60);
                ctx.bezierCurveTo(r * 0.34, -H * 0.42, r * 1.05, -H * 0.22, r * 0.62, 0);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = 'rgba(40,50,70,0.35)';
                ctx.lineWidth = 1.2;
                ctx.stroke();

                // hai vòng đỏ ở cổ ki
                ctx.fillStyle = '#e63946';
                ctx.fillRect(-r * 0.42, -H * 0.68, r * 0.84, H * 0.07);
                ctx.fillRect(-r * 0.40, -H * 0.55, r * 0.80, H * 0.06);

                ctx.restore();
            }
        },

        drawBall(ctx, l) {
            const b = l.ball;
            if (!b.live && l.phase !== 'roll') return;
            const s = this.ss(b.y);
            const bx = this.sx(l, b.x, b.y), by = this.sy(b.y);
            const r = BALL_R * s;                     // bóng nhỏ dần khi lăn ra xa

            ctx.save();

            /* Vệt lửa khi bé đang có chuỗi strike */
            if (l.streak >= 3 && b.live && !b.gutter) {
                for (let i = 1; i <= 5; i++) {
                    const ty = Math.max(0, b.y - i * 0.22);
                    const ts = this.ss(ty);
                    ctx.globalAlpha = 0.30 * (1 - i / 6);
                    ctx.fillStyle = i < 3 ? '#ffd166' : '#ff7a3d';
                    ctx.beginPath();
                    ctx.arc(this.sx(l, b.x, ty), this.sy(ty) - BALL_R * ts * 0.3, BALL_R * ts * (1 - i * 0.11), 0, TAU);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // bóng đổ dưới quả bóng
            ctx.fillStyle = 'rgba(20,10,0,0.34)';
            ctx.beginPath(); ctx.ellipse(bx, by, r * 1.05, r * 0.38, 0, 0, TAU); ctx.fill();

            /* Quả cầu nâng lên đúng một bán kính so với điểm chạm sàn — chi tiết
               nhỏ này mới làm nó "đứng trên" mặt đường thay vì dán bẹp vào. */
            ctx.translate(bx, by - r * 0.72);
            const c = l.cfg;
            const g = ctx.createRadialGradient(-r * 0.38, -r * 0.44, r * 0.12, 0, 0, r * 1.05);
            g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, c.light);
            g.addColorStop(0.55, c.color); g.addColorStop(1, c.dark);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();

            // ba lỗ ngón quay theo bóng
            ctx.rotate(b.rot * 0.45);
            ctx.fillStyle = 'rgba(12,8,20,0.78)';
            [[0, -r * 0.44], [-r * 0.31, r * 0.05], [r * 0.31, r * 0.05]].forEach(h => {
                ctx.beginPath(); ctx.ellipse(h[0], h[1], r * 0.135, r * 0.115, 0, 0, TAU); ctx.fill();
            });
            ctx.restore();

            // đốm sáng cố định để quả bóng trông bóng loáng
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(bx - r * 0.34, by - r * 1.14, r * 0.24, r * 0.15, -0.6, 0, TAU);
            ctx.fill();
            ctx.restore();
        },

        drawFx(ctx, l) {
            for (const s of l.sparks) {
                const a = clamp(s.life / s.max, 0, 1);
                ctx.globalAlpha = a * 0.9;
                ctx.fillStyle = '#ffe9a8';
                const sc = this.ss(s.y) / PPMX;
                const x = this.sx(l, s.x, s.y), y = this.sy(s.y);
                ctx.beginPath(); ctx.arc(x, y, (2.6 * a + 0.9) * sc, 0, TAU); ctx.fill();
            }
            ctx.globalAlpha = 1;
            for (const p of l.pops) {
                const a = clamp(p.life / p.max, 0, 1);
                ctx.globalAlpha = a;
                ctx.fillStyle = p.color;
                ctx.font = '800 ' + p.size + 'px "Baloo 2", sans-serif';
                ctx.textAlign = 'center';
                ctx.strokeStyle = 'rgba(6,8,18,0.85)';
                ctx.lineWidth = 5;
                const x = this.sx(l, p.x, p.y), y = this.sy(p.y) - (1 - a) * 26;
                ctx.strokeText(p.text, x, y);
                ctx.fillText(p.text, x, y);
            }
            ctx.globalAlpha = 1;
        },

        drawAim(ctx, l) {
            if (!this.running || l.idx !== this.turn) return;
            if (l.phase !== 'aim' && l.phase !== 'charge') return;
            const c = l.cfg;
            const x = l.aim * (HALF_W - BALL_R - 0.02);
            const px = this.sx(l, x, 0), py = this.sy(0);

            /* Đường ngắm cũng đi theo phối cảnh: chụm dần về phía giàn ki nên
               bé thấy rõ bóng sẽ tới đâu chứ không phải một vạch thẳng đơ. */
            if (this.diff.guide) {
                ctx.save();
                ctx.strokeStyle = 'rgba(' + c.glow + ',0.5)';
                ctx.setLineDash([8, 10]);
                ctx.lineWidth = 3;
                ctx.beginPath();
                for (let i = 0; i <= 12; i++) {
                    const gy = LANE_LEN * i / 12;
                    const gx = x * (1 - 0.65 * (gy / LANE_LEN));
                    const sxp = this.sx(l, gx, gy), syp = this.sy(gy);
                    if (i === 0) ctx.moveTo(sxp, syp); else ctx.lineTo(sxp, syp);
                }
                ctx.stroke();
                ctx.restore();
            }

            // bóng chờ ném
            const r = BALL_R * this.ss(0);
            ctx.save();
            ctx.globalAlpha = l.phase === 'charge' ? 1 : 0.85;
            ctx.fillStyle = 'rgba(20,10,0,0.34)';
            ctx.beginPath(); ctx.ellipse(px, py, r * 1.05, r * 0.38, 0, 0, TAU); ctx.fill();
            const g = ctx.createRadialGradient(px - r * 0.38, py - r * 1.16, r * 0.12, px, py - r * 0.72, r * 1.05);
            g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, c.light);
            g.addColorStop(0.55, c.color); g.addColorStop(1, c.dark);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(px, py - r * 0.72, r, 0, TAU); ctx.fill();
            ctx.restore();

            // thanh lực
            if (l.phase === 'charge') {
                const bw = 108, bh = 12, bx = this.sx(l, 0, 0) - bw / 2, by = FOUL_Y + 14;
                ctx.fillStyle = 'rgba(6,8,18,0.85)';
                ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bw + 6, bh + 6, 7); ctx.fill();
                const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
                pg.addColorStop(0, '#5ee06a'); pg.addColorStop(0.6, '#ffd166'); pg.addColorStop(1, '#ff5f6d');
                ctx.fillStyle = pg;
                ctx.beginPath(); ctx.roundRect(bx, by, bw * l.power, bh, 6); ctx.fill();
            }
        }
    };

    /* ---------------------------------------------------------------- *
     * 9. Màn hình menu / kết thúc
     * ---------------------------------------------------------------- */
    const Screens = {
        players: 2, mode: 'versus', diff: 'normal',

        init() {
            const menu = document.getElementById('screen-menu');
            menu.addEventListener('click', e => {
                const b = e.target.closest ? e.target.closest('.opt') : null;
                if (!b) return;
                const group = b.dataset.players ? 'players' : (b.dataset.mode ? 'mode' : 'diff');
                const key = b.dataset.players || b.dataset.mode || b.dataset.diff;
                this[group] = group === 'players' ? +key : key;
                [...b.parentElement.children].forEach(x => x.classList.toggle('sel', x === b));
                this.syncKeys();
                Sfx.tick();
            });
            document.getElementById('btn-start').addEventListener('click', () => this.begin());
            document.getElementById('btn-resume').addEventListener('click', () => Game.togglePause());
            document.getElementById('btn-back-menu').addEventListener('click', () => {
                Game.paused = false;
                document.getElementById('screen-pause').classList.add('hidden');
                this.showMenu();
            });
            document.getElementById('btn-again').addEventListener('click', () => this.restart());
            this.syncKeys();
        },

        syncKeys() {
            const list = document.getElementById('keys-list');
            if (!list) return;
            const set = KEYSETS[this.players] || [];
            list.innerHTML = set.map((code, i) =>
                '<div class="key-row"><span class="key-emoji">' + PLAYERS[i].emoji + '</span>'
                + '<b>' + PLAYERS[i].name + '</b>'
                + '<kbd>' + (KEYLABEL[code] || code) + '</kbd></div>').join('');
        },

        begin() {
            document.getElementById('screen-menu').classList.add('hidden');
            document.getElementById('screen-over').classList.add('hidden');
            Sfx.ensure();
            Game.start(this.players, this.mode, this.diff);
        },

        restart() {
            document.getElementById('screen-over').classList.add('hidden');
            Game.start(this.players, this.mode, this.diff);
        },

        showMenu() {
            Game.running = false;
            document.getElementById('screen-over').classList.add('hidden');
            document.getElementById('screen-menu').classList.remove('hidden');
        },

        showOver(rows) {
            const grid = document.getElementById('final-grid');
            grid.innerHTML = rows.map((r, i) =>
                '<div class="final-card' + (i === 0 ? ' win' : '') + '" style="--pc:' + r.cfg.color + '">'
                + '<div class="fc-medal">' + (i === 0 ? '🏆' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '🎳'))) + '</div>'
                + '<div class="fc-name">' + r.cfg.emoji + ' <b>' + r.cfg.name + '</b></div>'
                + '<div class="fc-score">' + r.score + '</div>'
                + (r.extra ? '<div class="fc-extra">' + r.extra + '</div>' : '')
                + '</div>').join('');
            const top = rows[0];
            document.getElementById('over-title').innerHTML = rows.length > 1
                ? (top.cfg.emoji + ' ' + top.cfg.name + ' WINS!')
                : ('FINAL SCORE: ' + top.score);
            document.getElementById('over-emoji').textContent = top.score >= 200 ? '🤩' : (top.score >= 120 ? '🏆' : '🎳');
            document.getElementById('screen-over').classList.remove('hidden');
        }
    };

    function boot() {
        Game.init();
        Screens.init();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
}());
