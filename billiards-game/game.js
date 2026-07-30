/* =========================================================
   POOL MASTERS — Bi-a 8 bi cho 2 người chơi luân phiên
   Điều khiển: kéo lùi từ bi trắng rồi thả (chuột / chạm),
   phím ← → chỉnh hướng, giữ Space lấy lực rồi thả để đánh.
   ========================================================= */
(() => {
    'use strict';

    // ---------- Kích thước bàn (toạ độ logic) ----------
    const W = 1160, H = 736;        // chừa dải điều khiển phía dưới bàn
    const LEFT = 76, RIGHT = 1084, TOP = 68, BOTTOM = 572;   // mặt nỉ: 1008 x 504 (đúng tỉ lệ 2:1)
    const MID_X = (LEFT + RIGHT) / 2, MID_Y = (TOP + BOTTOM) / 2;

    const R = 12.5;                 // bán kính bi
    const POCKET_R = 24;            // bán kính bắt bi của lỗ
    const POCKETS = [
        { x: LEFT, y: TOP }, { x: MID_X, y: TOP - 4 }, { x: RIGHT, y: TOP },
        { x: LEFT, y: BOTTOM }, { x: MID_X, y: BOTTOM + 4 }, { x: RIGHT, y: BOTTOM }
    ];

    // --- Ma sát: mô phỏng 2 giai đoạn như bi-a thật ---
    // Bàn 9 feet: mặt nỉ 2,54m ứng với 1008px  =>  1 mét ≈ 397px.
    // Bi vừa bị đánh thì TRƯỢT trên nỉ (ma sát trượt μ≈0,2 → ~780 px/s²), vừa trượt vừa
    // được nỉ "vặn" cho quay. Khi tốc độ tụt còn 5/7 ban đầu thì bi chuyển sang LĂN,
    // lúc này ma sát lăn nhỏ hơn gần 20 lần (μ≈0,010 → ~42 px/s²) nên bi đi rất xa.
    const A_SLIDE = 780;            // giảm tốc lúc bi còn trượt (px/s²)
    const A_ROLL = 42;              // giảm tốc khi bi đã lăn đều (px/s², ứng với μ≈0,010)
    const ROLL_RATIO = 5 / 7;       // tỉ lệ tốc độ lúc bi hết trượt, chuyển sang lăn
    const STOP_V = 12;              // dưới ngưỡng này coi như bi đứng yên
    const CUSHION_E = 0.80;         // độ nảy của băng (bàn tốt: 0,75-0,85)
    const BALL_E = 0.94;            // độ nảy giữa 2 bi
    const MAX_POWER = 2000;         // tốc độ tối đa của bi trắng (~5 m/s, cỡ cú phá bi thật)
    const MAX_PULL = 190;           // kéo lùi tối đa (px) tương ứng lực 100%

    const HEAD_X = LEFT + (RIGHT - LEFT) * 0.25;    // chấm đặt bi trắng
    const FOOT_X = LEFT + (RIGHT - LEFT) * 0.75;    // đỉnh của tam giác xếp bi

    // ---------- Kích thước băng & khung gỗ ----------
    const CUSH = 22;                // bề dày băng cao su (tính từ mặt nỉ ra ngoài)
    const RAIL = 30;                // bề rộng khung gỗ ngoài băng
    const CX0 = LEFT - CUSH, CY0 = TOP - CUSH, CX1 = RIGHT + CUSH, CY1 = BOTTOM + CUSH;
    const OX0 = CX0 - RAIL, OY0 = CY0 - RAIL, OX1 = CX1 + RAIL, OY1 = CY1 + RAIL;
    // Băng được vát chéo ở hai đầu tạo thành "hàm" lỗ: mũi băng thụt vào nhiều hơn chân băng
    // Miệng lỗ góc rộng ~1,9 đường kính bi, lỗ giữa ~2,2 — đúng tỉ lệ bàn thật
    const C_NOSE = 34, C_BASE = 11;     // vát ở lỗ góc
    const S_NOSE = 28, S_BASE = 16;     // vát ở lỗ giữa

    // ---------- Bảng chọn điểm chạm trên bi cái (9 vị trí) ----------
    const SPIN_CX = 300, SPIN_CY = 680, SPIN_R = 36;
    const SPIN_STEP = 18;                           // khoảng cách giữa các chấm
    // Xoáy dọc được quy đổi thành vận tốc bi trắng nhận lại sau khi chạm bi:
    // followV = lực đánh × FOLLOW_K, giảm dần theo quãng đường bi lăn trước lúc chạm.
    const FOLLOW_K = 0.58;      // độ mạnh của cú "chạy tiếp" / "lùi lại"
    const ENGLISH_K = 0.40;     // độ mạnh của xoáy ngang khi ăn băng
    const FOLLOW_FADE = 1400;   // xoáy dọc tắt dần sau bao nhiêu px lăn
    const ENGLISH_FADE = 1600;

    // Mô tả cho từng điểm chạm, tra theo `${x},${y}`
    const SPIN_HINT = {
        '0,0': 'Đánh GIỮA bi — bi trắng khựng lại sau khi chạm',
        '0,1': 'Đánh CAO — bi trắng chạy tiếp theo bi mục tiêu',
        '0,-1': 'Đánh THẤP — bi trắng lùi ngược trở lại',
        '-1,0': 'Xoáy TRÁI — bi trắng ăn băng rồi lệch sang trái',
        '1,0': 'Xoáy PHẢI — bi trắng ăn băng rồi lệch sang phải',
        '-1,1': 'CAO + xoáy TRÁI — chạy tiếp và bạt sang trái',
        '1,1': 'CAO + xoáy PHẢI — chạy tiếp và bạt sang phải',
        '-1,-1': 'THẤP + xoáy TRÁI — lùi lại và bạt sang trái',
        '1,-1': 'THẤP + xoáy PHẢI — lùi lại và bạt sang phải'
    };

    // ---------- Màu bi ----------
    const BALL_COLOR = {
        1: '#f2c018', 2: '#1f5fd0', 3: '#d62828', 4: '#7b2ea3',
        5: '#f57c00', 6: '#12833f', 7: '#8a2b22', 8: '#15171f',
        9: '#f2c018', 10: '#1f5fd0', 11: '#d62828', 12: '#7b2ea3',
        13: '#f57c00', 14: '#12833f', 15: '#8a2b22'
    };

    // Xếp bi chuẩn: bi 8 ở giữa hàng thứ 3, hai góc hàng cuối một trơn một sọc
    const RACK = [
        [1],
        [9, 2],
        [10, 8, 3],
        [11, 4, 12, 5],
        [13, 6, 14, 15, 7]
    ];

    const PLAYERS = [
        { name: 'NGƯỜI CHƠI 1', emoji: '🦊', color: '#ff6b3d' },
        { name: 'NGƯỜI CHƠI 2', emoji: '🐧', color: '#3da5ff' }
    ];

    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
    const isSolid = n => n >= 1 && n <= 7;
    const isStripe = n => n >= 9 && n <= 15;

    // =========================================================
    //  Vẽ mặt cầu của bi: mỗi bi giữ một ma trận hướng quay 3D,
    //  bề mặt được tô từng điểm ảnh nên số và sọc lăn đúng như thật.
    // =========================================================
    const TEX = 48;                     // độ phân giải ảnh bề mặt bi
    const RETEX_ANGLE = 0.04;           // quay ít hơn ngần này thì khỏi vẽ lại

    const norm3 = v => { const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; };
    const LIGHT = norm3([-0.34, -0.44, 0.83]);          // đèn chếch trên-trái
    const HALF = norm3([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);   // vector nửa góc cho đốm sáng

    const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const BALL_RGB = {};
    for (const k in BALL_COLOR) BALL_RGB[k] = hexRgb(BALL_COLOR[k]);
    const WHITE_RGB = [248, 246, 240];
    const CUE_RGB = [246, 244, 238];
    const CUE_DOT_RGB = [200, 40, 50];

    // Quay ma trận hướng quanh trục k một góc ang (công thức Rodrigues), m = R·m
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

    // Chỉnh lại cho 3 trục vuông góc & dài 1 (bù sai số tích luỹ sau nhiều lần quay)
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

    // Tô lại ảnh bề mặt bi theo hướng quay hiện tại
    function renderBallTex(b) {
        if (!b.tex) {
            b.tex = document.createElement('canvas');
            b.tex.width = b.tex.height = TEX;
            b.texCtx = b.tex.getContext('2d');
            b.texImg = b.texCtx.createImageData(TEX, TEX);
        }
        orthonormalize(b.ori);
        const m = b.ori, d = b.texImg.data;
        const stripe = isStripe(b.num);
        const col = b.num === 0 ? CUE_RGB : BALL_RGB[b.num];
        let p = 0;

        for (let j = 0; j < TEX; j++) {
            const ny = (j + 0.5) / TEX * 2 - 1;
            for (let i = 0; i < TEX; i++, p += 4) {
                const nx = (i + 0.5) / TEX * 2 - 1;
                const d2 = nx * nx + ny * ny;
                if (d2 >= 1) { d[p + 3] = 0; continue; }
                const nz = Math.sqrt(1 - d2);

                // Đổi pháp tuyến sang hệ toạ độ gắn với quả bi: local = oriᵀ · n
                const lx = m[0] * nx + m[3] * ny + m[6] * nz;
                const ly = m[1] * nx + m[4] * ny + m[7] * nz;
                const lz = m[2] * nx + m[5] * ny + m[8] * nz;

                let base;
                if (b.num === 0) {
                    // Bi cái kiểu "bi tập": 6 chấm đỏ để nhìn rõ bi đang xoay
                    base = (Math.abs(lx) > 0.985 || Math.abs(ly) > 0.985 || Math.abs(lz) > 0.985)
                        ? CUE_DOT_RGB : col;
                } else if (stripe) {
                    base = Math.abs(lz) < 0.52 ? col : WHITE_RGB;    // dải sọc quanh xích đạo
                } else {
                    base = Math.abs(lz) > 0.90 ? WHITE_RGB : col;    // vòng tròn trắng in số ở 2 cực
                }

                let diff = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
                if (diff < 0) diff = 0;
                const shade = 0.34 + 0.72 * diff;

                let spec = 0;
                const sp = nx * HALF[0] + ny * HALF[1] + nz * HALF[2];
                if (sp > 0) {
                    const s2 = sp * sp, s4 = s2 * s2, s8 = s4 * s4;
                    spec = s8 * s8 * s8 * 215;      // ≈ sp^24
                }

                d[p] = Math.min(255, base[0] * shade + spec);
                d[p + 1] = Math.min(255, base[1] * shade + spec);
                d[p + 2] = Math.min(255, base[2] * shade + spec);
                const edge = (1 - Math.sqrt(d2)) * (TEX * 0.5);      // làm mịn viền bi
                d[p + 3] = edge >= 1 ? 255 : edge * 255;
            }
        }
        b.texCtx.putImageData(b.texImg, 0, 0);
        b.texAge = 0;
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
        tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null) {
            if (!this.on) return;
            const ac = this.ensure();
            if (!ac) return;
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, ac.currentTime);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), ac.currentTime + dur);
            g.gain.setValueAtTime(0.0001, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), ac.currentTime + 0.008);
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
        cueHit(p) { this.tone(300 + p * 220, 0.09, 'triangle', 0.1 + p * 0.12, 160); this.noise(0.05, 0.05 + p * 0.06, 1800); },
        click(v) { const p = clamp(v / 900, 0.05, 1); this.tone(680 + p * 620, 0.055, 'triangle', 0.04 + p * 0.13, 420); },
        cushion(v) { const p = clamp(v / 900, 0.05, 1); this.tone(150, 0.09, 'sine', 0.03 + p * 0.09, 90); },
        pocket() { this.tone(320, 0.16, 'sine', 0.16, 120); setTimeout(() => this.noise(0.16, 0.09, 400), 60); },
        foul() { this.tone(230, 0.3, 'sawtooth', 0.11, 130); },
        win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.32, 'triangle', 0.17), i * 130)); }
    };

    // =========================================================
    //  Bi
    // =========================================================
    class Ball {
        constructor(num, x, y) {
            this.num = num;           // 0 = bi trắng
            this.x = x; this.y = y;
            this.vx = 0; this.vy = 0;
            this.potted = false;
            this.rollAt = 0;          // dưới tốc độ này bi đã lăn đều (hết trượt)
            // Hướng quay 3D của quả bi (ma trận 3x3, hàng = 3 trục gắn với bi)
            this.ori = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            this.texAge = 99;         // góc đã quay kể từ lần vẽ lại bề mặt gần nhất
            this.tex = null;

            // Mỗi bi nằm sẵn trên bàn ở một tư thế khác nhau cho tự nhiên
            rotateOri(this.ori, 1, 0, 0, (num * 37 % 360) * Math.PI / 180);
            rotateOri(this.ori, 0, 1, 0, (num * 73 % 360) * Math.PI / 180);
            this.dropT = 0;           // hiệu ứng rơi vào lỗ
            this.dropX = 0; this.dropY = 0;
            // Xoáy (chỉ dùng cho bi cái)
            this.followV = 0;         // vận tốc bi trắng nhận lại sau khi chạm bi (+ chạy tiếp, - lùi lại)
            this.eng = 0;             // +1 xoáy phải, -1 xoáy trái
            this.shotDx = 0; this.shotDy = 0;
        }
        get speed() { return Math.hypot(this.vx, this.vy); }
        get moving() { return this.vx !== 0 || this.vy !== 0; }

        // Gọi mỗi khi bi vừa được truyền lực mới (cơ đánh, chạm bi khác, dội băng):
        // lúc đó bi chưa quay khớp với đường đi nên bắt đầu bằng giai đoạn trượt.
        struck() { this.rollAt = this.speed * ROLL_RATIO; }
    }

    // =========================================================
    //  Trò chơi
    // =========================================================
    const Game = {
        canvas: null, ctx: null, viewport: null,
        dpr: 1, scale: 1, ox: 0, oy: 0, cssW: 0, cssH: 0,

        balls: [],
        cue: null,
        state: 'menu',          // menu | aim | rolling | ballinhand | over
        turn: 0,
        groups: [null, null],   // 'solid' | 'stripe' | null
        openTable: true,
        isBreak: true,
        helpMode: true,
        winner: null,

        aimAngle: 0,
        power: 0,
        spin: { x: 0, y: 0 },   // điểm chạm trên bi cái: x = trái/phải, y = cao/thấp
        spinPick: null,         // đang chạm bảng chọn, chưa biết là chạm hay kéo
        dragging: false,
        charging: false,
        chargeDir: 1,
        keyLeft: false, keyRight: false,

        pottedThisShot: [],
        firstContact: null,
        cueScratched: false,
        ghostCue: null,         // vị trí bi trắng khi đang cầm đặt
        time: 0,
        pocketFlash: POCKETS.map(() => 0),
        toastT: 0,

        init() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.viewport = document.querySelector('.game-viewport');

            this.el = {
                p1group: document.getElementById('p1-group'),
                p2group: document.getElementById('p2-group'),
                p1balls: document.getElementById('p1-balls'),
                p2balls: document.getElementById('p2-balls'),
                panel1: document.getElementById('panel-p1'),
                panel2: document.getElementById('panel-p2'),
                turnText: document.getElementById('turn-text'),
                turnSub: document.getElementById('turn-sub'),
                toast: document.getElementById('toast'),
                menu: document.getElementById('screen-menu'),
                rules: document.getElementById('screen-rules'),
                over: document.getElementById('screen-over')
            };

            this.bindUI();
            this.bindInput();
            window.addEventListener('resize', () => this.resize());
            this.resize();
            this.newRack();

            let last = performance.now();
            const loop = now => {
                const dt = Math.min(0.04, (now - last) / 1000);
                last = now;
                this.update(dt);
                this.render();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        bindUI() {
            document.getElementById('btn-start').onclick = () => this.startGame();
            document.getElementById('btn-again').onclick = () => this.startGame();
            document.getElementById('btn-restart').onclick = () => this.startGame();
            document.getElementById('btn-rules').onclick = () => this.el.rules.classList.remove('hidden');
            document.getElementById('btn-close-rules').onclick = () => this.el.rules.classList.add('hidden');

            const helpBtn = document.getElementById('btn-help');
            helpBtn.onclick = () => {
                this.helpMode = !this.helpMode;
                helpBtn.classList.toggle('active', this.helpMode);
                document.getElementById('help-label').textContent =
                    'Đường Ngắm: ' + (this.helpMode ? 'BẬT' : 'TẮT');
            };

            const soundBtn = document.getElementById('btn-sound');
            soundBtn.onclick = () => {
                Sfx.on = !Sfx.on;
                soundBtn.classList.toggle('muted', !Sfx.on);
                document.getElementById('sound-icon').className =
                    'fa-solid ' + (Sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
            };
        },

        bindInput() {
            const toWorld = e => {
                const r = this.canvas.getBoundingClientRect();
                return {
                    x: (e.clientX - r.left - this.ox) / this.scale,
                    y: (e.clientY - r.top - this.oy) / this.scale
                };
            };

            // Bảng chọn xoáy nằm ngay dưới bàn nên có thể trùng chỗ người chơi kéo lùi cơ.
            // Phân biệt bằng cử chỉ: CHẠM nhẹ = chọn điểm chạm, KÉO = ngắm bình thường.
            const startAim = p => {
                this.dragging = true;
                if (this.state === 'ballinhand') this.moveCueBall(p);
                else if (this.state === 'aim') this.updateAimFromPointer(p);
            };

            this.canvas.addEventListener('pointerdown', e => {
                Sfx.ensure();
                const p = toWorld(e);
                const dot = this.spinHitTest(p);
                if (dot) this.spinPick = { dot, x: p.x, y: p.y };
                else startAim(p);
                if (this.canvas.setPointerCapture) {
                    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { }
                }
            });

            this.canvas.addEventListener('pointermove', e => {
                const p = toWorld(e);
                if (this.spinPick) {
                    if (Math.hypot(p.x - this.spinPick.x, p.y - this.spinPick.y) <= 10) return;
                    this.spinPick = null;       // đã kéo đi -> coi như đang ngắm
                    startAim(p);
                    return;
                }
                if (!this.dragging) return;
                if (this.state === 'ballinhand') this.moveCueBall(p);
                else if (this.state === 'aim') this.updateAimFromPointer(p);
            });

            const endDrag = () => {
                if (this.spinPick) {
                    this.applySpin(this.spinPick.dot);
                    this.spinPick = null;
                    return;
                }
                if (!this.dragging) return;
                this.dragging = false;
                if (this.state === 'ballinhand') this.placeCueBall();
                else if (this.state === 'aim' && this.power > 0.04) this.shoot();
                else this.power = 0;
            };
            this.canvas.addEventListener('pointerup', endDrag);
            this.canvas.addEventListener('pointercancel', endDrag);

            window.addEventListener('keydown', e => {
                if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
                if (e.code === 'ArrowLeft') this.keyLeft = true;
                if (e.code === 'ArrowRight') this.keyRight = true;
                if (e.code === 'Space') {
                    if (this.state === 'menu' || this.state === 'over') { this.startGame(); return; }
                    if (this.state === 'aim' && !this.dragging && !e.repeat) {
                        Sfx.ensure();
                        this.charging = true;
                        this.power = 0;
                        this.chargeDir = 1;
                    }
                }
            });

            window.addEventListener('keyup', e => {
                if (e.code === 'ArrowLeft') this.keyLeft = false;
                if (e.code === 'ArrowRight') this.keyRight = false;
                if (e.code === 'Space' && this.charging) {
                    this.charging = false;
                    if (this.power > 0.04) this.shoot(); else this.power = 0;
                }
            });

            window.addEventListener('blur', () => {
                this.keyLeft = this.keyRight = false;
                this.charging = false;
                this.dragging = false;
                this.spinPick = null;
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

        // ---------- Chuẩn bị ván mới ----------
        newRack() {
            this.balls = [];
            this.cue = new Ball(0, HEAD_X, MID_Y);
            this.balls.push(this.cue);

            const dx = 2 * R * Math.cos(Math.PI / 6) + 0.6;
            const dy = 2 * R + 0.6;
            for (let i = 0; i < RACK.length; i++) {
                for (let j = 0; j < RACK[i].length; j++) {
                    const x = FOOT_X + i * dx;
                    const y = MID_Y + (j - i / 2) * dy;
                    this.balls.push(new Ball(RACK[i][j], x, y));
                }
            }

            this.turn = 0;
            this.groups = [null, null];
            this.openTable = true;
            this.isBreak = true;
            this.winner = null;
            this.aimAngle = 0;
            this.power = 0;
            this.spin = { x: 0, y: 0 };
            this.pottedThisShot = [];
            this.firstContact = null;
            this.cueScratched = false;
            this.ghostCue = null;
            this.syncHUD();
        },

        startGame() {
            Sfx.ensure();
            this.newRack();
            this.state = 'aim';
            this.el.menu.classList.add('hidden');
            this.el.over.classList.add('hidden');
            this.el.rules.classList.add('hidden');
            this.hideToast();
            this.syncHUD();
        },

        // ---------- Bi trắng cầm tay ----------
        moveCueBall(p) {
            const x = clamp(p.x, LEFT + R, RIGHT - R);
            const y = clamp(p.y, TOP + R, BOTTOM - R);
            this.ghostCue = { x, y, valid: this.cuePlacementValid(x, y) };
        },

        cuePlacementValid(x, y) {
            for (const p of POCKETS) if (Math.hypot(x - p.x, y - p.y) < POCKET_R + R) return false;
            for (const b of this.balls) {
                if (b === this.cue || b.potted) continue;
                if (Math.hypot(x - b.x, y - b.y) < 2 * R + 1) return false;
            }
            return true;
        },

        placeCueBall() {
            if (!this.ghostCue || !this.ghostCue.valid) return;
            this.cue.x = this.ghostCue.x;
            this.cue.y = this.ghostCue.y;
            this.cue.potted = false;
            this.cue.vx = this.cue.vy = 0;
            this.ghostCue = null;
            this.state = 'aim';
            this.syncHUD();
        },

        // ---------- Bảng chọn điểm chạm bi cái ----------
        spinDotPos(x, y) {
            return { x: SPIN_CX + x * SPIN_STEP, y: SPIN_CY - y * SPIN_STEP };
        },

        // Trả về điểm chạm gần con trỏ nhất nếu bấm trúng bảng chọn, ngược lại null
        spinHitTest(p) {
            if (this.state !== 'aim' && this.state !== 'ballinhand') return null;
            if (Math.hypot(p.x - SPIN_CX, p.y - SPIN_CY) > SPIN_R + 14) return null;

            let best = null, bestD = Infinity;
            for (let y = -1; y <= 1; y++) {
                for (let x = -1; x <= 1; x++) {
                    const d = this.spinDotPos(x, y);
                    const dist = Math.hypot(p.x - d.x, p.y - d.y);
                    if (dist < bestD) { bestD = dist; best = { x, y }; }
                }
            }
            return best;
        },

        applySpin(dot) {
            if (!dot) return;
            if (dot.x !== this.spin.x || dot.y !== this.spin.y) {
                this.spin = { x: dot.x, y: dot.y };
                Sfx.tone(760, 0.05, 'triangle', 0.09);
            }
        },

        // ---------- Ngắm & đánh ----------
        updateAimFromPointer(p) {
            const dx = this.cue.x - p.x, dy = this.cue.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 1) return;
            this.aimAngle = Math.atan2(dy, dx);       // kéo lùi -> bi bay ngược lại
            this.power = clamp((d - R) / MAX_PULL, 0, 1);
        },

        shoot() {
            const speed = this.power * MAX_POWER;
            this.cue.vx = Math.cos(this.aimAngle) * speed;
            this.cue.vy = Math.sin(this.aimAngle) * speed;
            this.cue.struck();

            // Xoáy theo điểm chạm đã chọn, rồi trả bảng chọn về giữa bi
            this.cue.followV = this.spin.y * speed * FOLLOW_K;
            this.cue.eng = this.spin.x;
            this.cue.shotDx = Math.cos(this.aimAngle);
            this.cue.shotDy = Math.sin(this.aimAngle);
            this.spin = { x: 0, y: 0 };

            this.pottedThisShot = [];
            this.firstContact = null;
            this.cueScratched = false;
            this.state = 'rolling';
            this.power = 0;
            this.charging = false;
            Sfx.cueHit(Math.min(1, speed / MAX_POWER));
            this.hideToast();
            this.syncHUD();
        },

        // ---------- Vật lý ----------
        stepPhysics(dt) {
            let maxV = 0;
            for (const b of this.balls) if (!b.potted && b.speed > maxV) maxV = b.speed;
            if (maxV === 0) return false;

            const steps = clamp(Math.ceil(maxV * dt / (R * 0.4)), 1, 48);
            const h = dt / steps;

            for (let s = 0; s < steps; s++) {
                // Di chuyển + ma sát
                for (const b of this.balls) {
                    if (b.potted) continue;
                    const sp = b.speed;
                    if (sp === 0) continue;
                    // Còn trượt thì hãm mạnh, đã lăn đều thì hãm rất nhẹ
                    const decel = sp > b.rollAt ? A_SLIDE : A_ROLL;
                    const ns = Math.max(0, sp - decel * h);
                    if (ns < STOP_V) { b.vx = 0; b.vy = 0; continue; }
                    b.vx *= ns / sp; b.vy *= ns / sp;
                    b.x += b.vx * h; b.y += b.vy * h;

                    // Bi lăn: quay quanh trục nằm ngang vuông góc với hướng đi.
                    // Điều kiện lăn không trượt cho ω = (-vy, vx, 0)/R, tức là mặt trên
                    // của bi chạy tới trước nhanh gấp đôi tâm bi — đúng như bi thật.
                    const run = ns * h;
                    const ang = run / R;
                    rotateOri(b.ori, -b.vy / ns, b.vx / ns, 0, ang);
                    b.texAge += ang;

                    // Xoáy tắt dần theo quãng đường bi lăn
                    if (b.num === 0) {
                        if (b.followV !== 0) b.followV *= Math.exp(-run / FOLLOW_FADE);
                        if (b.eng !== 0) b.eng *= Math.exp(-run / ENGLISH_FADE);
                    }
                }

                // Rơi lỗ (kiểm tra trước băng để bi không bị dội ra khỏi miệng lỗ)
                for (const b of this.balls) {
                    if (b.potted) continue;
                    for (let pi = 0; pi < POCKETS.length; pi++) {
                        const p = POCKETS[pi];
                        if (Math.hypot(b.x - p.x, b.y - p.y) < POCKET_R) {
                            this.potBall(b, pi);
                            break;
                        }
                    }
                }

                // Băng bàn
                for (const b of this.balls) {
                    if (b.potted) continue;
                    // Pháp tuyến n hướng từ tâm bi ra phía băng vừa chạm
                    let nx = 0, ny = 0, hit = 0;
                    if (b.x < LEFT + R) { b.x = LEFT + R; hit = Math.abs(b.vx); b.vx = -b.vx * CUSHION_E; nx = -1; }
                    else if (b.x > RIGHT - R) { b.x = RIGHT - R; hit = Math.abs(b.vx); b.vx = -b.vx * CUSHION_E; nx = 1; }
                    if (b.y < TOP + R) { b.y = TOP + R; hit = Math.max(hit, Math.abs(b.vy)); b.vy = -b.vy * CUSHION_E; ny = -1; }
                    else if (b.y > BOTTOM - R) { b.y = BOTTOM - R; hit = Math.max(hit, Math.abs(b.vy)); b.vy = -b.vy * CUSHION_E; ny = 1; }
                    if (hit <= 0) continue;

                    // Xoáy ngang: ma sát ở băng đẩy bi lệch sang bên theo chiều xoáy.
                    // Δv = k · xoáy · (-n_y, n_x)  → xoáy phải luôn đẩy về phía tay phải người đánh.
                    if (b.num === 0 && b.eng !== 0) {
                        const k = ENGLISH_K * b.eng * hit;
                        b.vx += -ny * k;
                        b.vy += nx * k;
                        b.eng *= 0.45;
                    }
                    // Dội băng xong bi quay ngược chiều đường đi -> trượt lại một đoạn
                    b.struck();
                    if (hit > 40) Sfx.cushion(hit);
                }

                // Va chạm giữa các bi
                for (let i = 0; i < this.balls.length; i++) {
                    const a = this.balls[i];
                    if (a.potted) continue;
                    for (let j = i + 1; j < this.balls.length; j++) {
                        const b = this.balls[j];
                        if (b.potted) continue;
                        const dx = b.x - a.x, dy = b.y - a.y;
                        const d = Math.hypot(dx, dy);
                        if (d >= 2 * R || d === 0) continue;

                        const nx = dx / d, ny = dy / d;
                        const overlap = (2 * R - d) / 2 + 0.01;
                        a.x -= nx * overlap; a.y -= ny * overlap;
                        b.x += nx * overlap; b.y += ny * overlap;

                        const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                        if (rvn > 0) continue;                 // đang tách ra
                        const imp = -(1 + BALL_E) * rvn / 2;
                        a.vx -= imp * nx; a.vy -= imp * ny;
                        b.vx += imp * nx; b.vy += imp * ny;
                        a.struck(); b.struck();

                        if (a.num === 0 || b.num === 0) {
                            if (this.firstContact === null) this.firstContact = a.num === 0 ? b.num : a.num;

                            // Đánh cao/thấp: sau khi chạm bi, bi trắng chạy tiếp hoặc lùi lại
                            const cb = a.num === 0 ? a : b;
                            if (cb.followV !== 0) {
                                cb.vx += cb.shotDx * cb.followV;
                                cb.vy += cb.shotDy * cb.followV;
                                cb.followV *= 0.15;
                                // Bi cái đang sẵn xoáy cao/thấp nên lăn luôn, không trượt
                                cb.rollAt = 0;
                            }
                        }
                        Sfx.click(Math.abs(rvn));
                    }
                }
            }

            for (const b of this.balls) if (!b.potted && b.moving) return true;
            return false;
        },

        potBall(b, pocketIndex) {
            b.potted = true;
            b.vx = b.vy = 0;
            b.dropT = 0.45;
            b.dropX = POCKETS[pocketIndex].x;
            b.dropY = POCKETS[pocketIndex].y;
            this.pocketFlash[pocketIndex] = 1;
            this.pottedThisShot.push(b.num);
            if (b.num === 0) this.cueScratched = true;
            Sfx.pocket();
        },

        // ---------- Luật 8 bi ----------
        ballsLeft(group) {
            const test = group === 'solid' ? isSolid : isStripe;
            return this.balls.filter(b => !b.potted && test(b.num)).length;
        },

        canShootEight(player) {
            const g = this.groups[player];
            return g !== null && this.ballsLeft(g) === 0;
        },

        legalFirstHit(player, n) {
            if (n === null) return false;
            if (this.canShootEight(player)) return n === 8;
            if (this.groups[player] === null) return n !== 8;      // bàn còn mở
            const test = this.groups[player] === 'solid' ? isSolid : isStripe;
            return test(n);
        },

        endShot() {
            const cur = this.turn;
            const other = 1 - cur;
            const potted = this.pottedThisShot;
            const potted8 = potted.includes(8);

            // Bi trắng rơi lỗ -> đặt lại để vẽ (sẽ được cầm tay)
            if (this.cueScratched) {
                this.cue.potted = false;
                this.cue.vx = this.cue.vy = 0;
            }

            // --- Bi số 8 ---
            if (potted8) {
                const legal = this.canShootEight(cur) && !this.cueScratched;
                this.declareWinner(legal ? cur : other,
                    legal ? 'Cú kết thúc hoàn hảo với bi số 8!'
                        : (this.cueScratched ? 'Bi trắng rơi lỗ cùng bi số 8 — thua ngay!'
                            : 'Đưa bi số 8 vào lỗ quá sớm — thua ngay!'));
                return;
            }

            const badHit = !this.legalFirstHit(cur, this.firstContact);
            const foul = this.cueScratched || this.firstContact === null || badHit;

            // --- Chia nhóm bi (không chia ở cú phá bi) ---
            let assignedMsg = '';
            if (!foul && this.openTable && !this.isBreak) {
                const first = potted.find(n => n !== 0 && n !== 8);
                if (first !== undefined) {
                    const g = isSolid(first) ? 'solid' : 'stripe';
                    this.groups[cur] = g;
                    this.groups[other] = g === 'solid' ? 'stripe' : 'solid';
                    this.openTable = false;
                    assignedMsg = `${PLAYERS[cur].emoji} nhận ${g === 'solid' ? 'BI TRƠN 1-7' : 'BI SỌC 9-15'}! `;
                }
            }
            this.isBreak = false;

            // --- Có ăn được bi của mình không? ---
            let ownPotted;
            if (this.groups[cur] === null) {
                ownPotted = potted.some(n => n !== 0 && n !== 8);
            } else {
                const test = this.groups[cur] === 'solid' ? isSolid : isStripe;
                ownPotted = potted.some(n => test(n));
            }

            if (foul) {
                let why = 'Bi trắng rơi lỗ!';
                if (!this.cueScratched && this.firstContact === null) why = 'Không chạm được bi nào!';
                else if (!this.cueScratched && badHit) {
                    why = this.canShootEight(cur) ? 'Phải chạm bi số 8 trước!' : 'Chạm nhầm bi của đối thủ!';
                }
                this.turn = other;
                this.state = 'ballinhand';
                this.ghostCue = null;
                Sfx.foul();
                this.showToast(`⚠️ ${why} ${PLAYERS[other].emoji} được cầm bi trắng đặt tự do.`, 'bad');
            } else if (ownPotted) {
                this.state = 'aim';
                this.showToast(`${assignedMsg}✅ Vào lỗ đẹp — ${PLAYERS[cur].emoji} đánh tiếp!`, 'good');
            } else {
                this.turn = other;
                this.state = 'aim';
                this.showToast(assignedMsg ? `${assignedMsg}Đến lượt ${PLAYERS[other].emoji}` :
                    `Chưa ăn được bi — đến lượt ${PLAYERS[other].emoji} ${PLAYERS[other].name}`, 'info');
            }

            // Nếu bi trắng vẫn đang nằm trong lỗ (trường hợp hiếm) thì đưa về chấm đầu bàn
            if (this.cueScratched && this.cuePlacementValid(HEAD_X, MID_Y)) {
                this.cue.x = HEAD_X; this.cue.y = MID_Y;
            }

            this.power = 0;
            this.syncHUD();
        },

        declareWinner(player, reason) {
            this.winner = player;
            this.state = 'over';
            document.getElementById('over-emoji').textContent = '🏆';
            document.getElementById('over-title').textContent =
                `${PLAYERS[player].emoji} ${PLAYERS[player].name} THẮNG!`;
            document.getElementById('over-desc').textContent = reason;
            this.el.over.classList.remove('hidden');
            this.hideToast();
            setTimeout(() => Sfx.win(), 400);
            this.syncHUD();
        },

        // ---------- Thông báo ----------
        showToast(text, kind) {
            this.el.toast.textContent = text;
            this.el.toast.className = 'toast ' + (kind || 'info');
            this.toastT = 3.4;
        },
        hideToast() {
            this.toastT = 0;
            this.el.toast.className = 'toast hidden';
        },

        // ---------- HUD ----------
        syncHUD() {
            const label = g => g === 'solid' ? 'BI TRƠN 1-7' : g === 'stripe' ? 'BI SỌC 9-15' : 'Chưa chọn nhóm bi';
            [0, 1].forEach(i => {
                const gEl = i === 0 ? this.el.p1group : this.el.p2group;
                const g = this.groups[i];
                gEl.textContent = this.canShootEight(i) ? '🎱 ĐÁNH BI SỐ 8!' : label(g);
                gEl.className = 'p-group' + (g ? ' ' + g : '');

                const holder = i === 0 ? this.el.p1balls : this.el.p2balls;
                const nums = g === 'solid' ? [1, 2, 3, 4, 5, 6, 7]
                    : g === 'stripe' ? [9, 10, 11, 12, 13, 14, 15] : [];
                const html = nums.map(n => {
                    const done = !this.balls.some(b => b.num === n && !b.potted);
                    return `<div class="mini-ball${isStripe(n) ? ' striped' : ''}${done ? ' done' : ''}" ` +
                        `style="background:${BALL_COLOR[n]}"><span>${n}</span></div>`;
                }).join('');
                if (holder.innerHTML !== html) holder.innerHTML = html;
            });

            this.el.panel1.classList.toggle('active', this.turn === 0 && this.state !== 'over');
            this.el.panel2.classList.toggle('active', this.turn === 1 && this.state !== 'over');

            if (this.state === 'over') {
                this.el.turnText.textContent = 'KẾT THÚC';
                this.el.turnSub.textContent = 'Bấm ĐẤU LẠI để chơi ván mới';
            } else {
                this.el.turnText.textContent = `LƯỢT CỦA ${PLAYERS[this.turn].emoji} BÉ ${this.turn + 1}`;
                this.el.turnSub.textContent =
                    this.state === 'ballinhand' ? 'Kéo đặt bi trắng vào chỗ đẹp' :
                        this.state === 'rolling' ? 'Bi đang lăn...' :
                            this.isBreak ? 'Phá bi nào!' : 'Kéo lùi từ bi trắng rồi thả';
            }
        },

        // ---------- Vòng lặp ----------
        update(dt) {
            this.time += dt;

            if (this.toastT > 0) {
                this.toastT -= dt;
                if (this.toastT <= 0) this.hideToast();
            }
            for (let i = 0; i < this.pocketFlash.length; i++) {
                this.pocketFlash[i] = Math.max(0, this.pocketFlash[i] - dt * 2);
            }
            for (const b of this.balls) if (b.dropT > 0) b.dropT = Math.max(0, b.dropT - dt);

            if (this.state === 'rolling') {
                const moving = this.stepPhysics(dt);
                if (!moving) this.endShot();
            } else if (this.state === 'aim') {
                // Chỉnh hướng bằng phím mũi tên
                const rotSpeed = 0.9;
                if (this.keyLeft) this.aimAngle -= rotSpeed * dt;
                if (this.keyRight) this.aimAngle += rotSpeed * dt;

                if (this.charging) {
                    this.power += this.chargeDir * 0.9 * dt;
                    if (this.power > 1) { this.power = 1; this.chargeDir = -1; }
                    if (this.power < 0) { this.power = 0; this.chargeDir = 1; }
                }
            }
        },

        // ---------- Dự đoán đường bi ----------
        predict() {
            const dir = { x: Math.cos(this.aimAngle), y: Math.sin(this.aimAngle) };
            let best = null;

            for (const b of this.balls) {
                if (b.potted || b === this.cue) continue;
                const px = b.x - this.cue.x, py = b.y - this.cue.y;
                const t = px * dir.x + py * dir.y;
                if (t <= 0) continue;
                const perp2 = px * px + py * py - t * t;
                const rr = (2 * R) * (2 * R);
                if (perp2 > rr) continue;
                const tHit = t - Math.sqrt(rr - perp2);
                if (tHit < 0) continue;
                if (!best || tHit < best.t) best = { t: tHit, ball: b };
            }

            // Khoảng cách tới băng gần nhất
            let tWall = Infinity;
            if (dir.x > 0) tWall = Math.min(tWall, (RIGHT - R - this.cue.x) / dir.x);
            if (dir.x < 0) tWall = Math.min(tWall, (LEFT + R - this.cue.x) / dir.x);
            if (dir.y > 0) tWall = Math.min(tWall, (BOTTOM - R - this.cue.y) / dir.y);
            if (dir.y < 0) tWall = Math.min(tWall, (TOP + R - this.cue.y) / dir.y);

            if (best && best.t <= tWall) {
                const gx = this.cue.x + dir.x * best.t;
                const gy = this.cue.y + dir.y * best.t;
                const ox = best.ball.x - gx, oy = best.ball.y - gy;
                const od = Math.hypot(ox, oy) || 1;
                return { dir, hit: true, gx, gy, ball: best.ball, ox: ox / od, oy: oy / od };
            }
            return {
                dir, hit: false,
                gx: this.cue.x + dir.x * Math.max(0, tWall),
                gy: this.cue.y + dir.y * Math.max(0, tWall)
            };
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

            this.drawTable(ctx);
            this.drawBalls(ctx);

            if (this.state === 'aim') this.drawAim(ctx);
            if (this.state === 'ballinhand') this.drawBallInHand(ctx);
            this.drawSpinWidget(ctx);

            ctx.restore();
        },

        drawSpinWidget(ctx) {
            const active = this.state === 'aim' || this.state === 'ballinhand';
            ctx.save();
            ctx.globalAlpha = active ? 1 : 0.4;

            // Nhãn
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.font = 'bold 14px "Baloo 2", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText('ĐIỂM CHẠM BI CÁI', SPIN_CX, SPIN_CY - SPIN_R - 14);

            // Bi cái phóng to
            const g = ctx.createRadialGradient(SPIN_CX - SPIN_R * 0.35, SPIN_CY - SPIN_R * 0.4, SPIN_R * 0.1,
                SPIN_CX, SPIN_CY, SPIN_R);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.65, '#e8e4d8');
            g.addColorStop(1, '#b3ada0');
            ctx.beginPath();
            ctx.arc(SPIN_CX, SPIN_CY, SPIN_R, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 9 điểm chạm
            for (let y = -1; y <= 1; y++) {
                for (let x = -1; x <= 1; x++) {
                    const d = this.spinDotPos(x, y);
                    const sel = this.spin.x === x && this.spin.y === y;
                    ctx.beginPath();
                    ctx.arc(d.x, d.y, sel ? 8 : 4.5, 0, Math.PI * 2);
                    if (sel) {
                        ctx.fillStyle = '#e01e37';
                        ctx.shadowColor = 'rgba(224,30,55,0.9)';
                        ctx.shadowBlur = 12;
                    } else {
                        ctx.fillStyle = 'rgba(70,70,80,0.42)';
                        ctx.shadowBlur = 0;
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // Mũi tên gợi ý hiệu ứng + lời giải thích
            const hint = SPIN_HINT[`${this.spin.x},${this.spin.y}`] || SPIN_HINT['0,0'];
            ctx.textAlign = 'left';
            ctx.font = 'bold 17px "Baloo 2", sans-serif';
            ctx.fillStyle = this.spin.x === 0 && this.spin.y === 0 ? 'rgba(255,255,255,0.7)' : '#ffe08a';
            ctx.fillText(hint, SPIN_CX + SPIN_R + 24, SPIN_CY + 1);
            ctx.font = '13px "Nunito", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.42)';
            ctx.fillText('Bấm vào bi cái để chọn — mỗi cú đánh xong tự về giữa',
                SPIN_CX + SPIN_R + 24, SPIN_CY + 21);
            ctx.restore();
        },

        drawTable(ctx) {
            this.drawRails(ctx);
            this.drawCloth(ctx);
            this.drawCushions(ctx);
            this.drawPockets(ctx);
        },

        // --- Khung gỗ + các chấm định vị trên thành bàn ---
        drawRails(ctx) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 32;
            ctx.shadowOffsetY = 12;

            const g = ctx.createLinearGradient(0, OY0, 0, OY1);
            g.addColorStop(0, '#8b5a2c');
            g.addColorStop(0.06, '#6d4320');
            g.addColorStop(0.5, '#4f2d13');
            g.addColorStop(0.94, '#3a1f0c');
            g.addColorStop(1, '#28150a');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.roundRect(OX0, OY0, OX1 - OX0, OY1 - OY0, 20);
            ctx.fill();
            ctx.restore();

            // Vân gỗ chạy dọc thành bàn
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(OX0, OY0, OX1 - OX0, OY1 - OY0, 20);
            ctx.clip();
            ctx.strokeStyle = 'rgba(30,14,4,0.30)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 46; i++) {
                const y = OY0 + (i / 46) * (OY1 - OY0) + Math.sin(i * 2.3) * 2;
                ctx.beginPath();
                ctx.moveTo(OX0, y);
                ctx.bezierCurveTo(OX0 + 340, y + 3, OX1 - 340, y - 3, OX1, y);
                ctx.stroke();
            }
            ctx.restore();

            // Cạnh vát: sáng ở trên, tối ở dưới
            ctx.strokeStyle = 'rgba(255,224,170,0.30)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(OX0 + 1.5, OY0 + 1.5, OX1 - OX0 - 3, OY1 - OY0 - 3, 19);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.roundRect(OX0 + 4, OY0 + 4, OX1 - OX0 - 8, OY1 - OY0 - 8, 17);
            ctx.stroke();

            // Chấm định vị (mother-of-pearl) trên thành bàn
            const diamond = (x, y) => {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                ctx.fillRect(-3.4, -2.6, 6.8, 6.8);
                const dg = ctx.createLinearGradient(-4, -4, 4, 4);
                dg.addColorStop(0, '#fffdf3');
                dg.addColorStop(0.55, '#e6dcc2');
                dg.addColorStop(1, '#b9ab8a');
                ctx.fillStyle = dg;
                ctx.fillRect(-3.4, -3.4, 6.8, 6.8);
                ctx.restore();
            };
            const railTopY = (OY0 + CY0) / 2, railBotY = (OY1 + CY1) / 2;
            const railLeftX = (OX0 + CX0) / 2, railRightX = (OX1 + CX1) / 2;
            for (const k of [1, 2, 3, 5, 6, 7]) {
                const x = LEFT + (RIGHT - LEFT) * k / 8;
                diamond(x, railTopY); diamond(x, railBotY);
            }
            for (const k of [1, 2, 3]) {
                const y = TOP + (BOTTOM - TOP) * k / 4;
                diamond(railLeftX, y); diamond(railRightX, y);
            }
        },

        // --- Mặt nỉ ---
        drawCloth(ctx) {
            const felt = ctx.createRadialGradient(MID_X, MID_Y - 40, 80, MID_X, MID_Y, 700);
            felt.addColorStop(0, '#1aa163');
            felt.addColorStop(0.45, '#128550');
            felt.addColorStop(0.75, '#0d6b41');
            felt.addColorStop(1, '#084a2d');
            ctx.fillStyle = felt;
            ctx.fillRect(CX0, CY0, CX1 - CX0, CY1 - CY0);

            // Sợi nỉ: những vệt sáng rất mờ chạy dọc bàn
            ctx.save();
            ctx.globalAlpha = 0.05;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            for (let y = CY0 + 3; y < CY1; y += 5) {
                ctx.beginPath();
                ctx.moveTo(CX0, y); ctx.lineTo(CX1, y);
                ctx.stroke();
            }
            ctx.restore();

            // Vạch đầu bàn + 3 chấm mốc
            ctx.strokeStyle = 'rgba(255,255,255,0.14)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(HEAD_X, TOP); ctx.lineTo(HEAD_X, BOTTOM);
            ctx.stroke();
            [[HEAD_X, MID_Y], [FOOT_X, MID_Y], [MID_X, MID_Y]].forEach(([x, y]) => {
                ctx.fillStyle = 'rgba(0,0,0,0.28)';
                ctx.beginPath(); ctx.arc(x, y + 1, 3.4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(245,240,225,0.55)';
                ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
            });
        },

        // --- Băng cao su, hai đầu vát chéo tạo hàm lỗ ---
        drawCushions(ctx) {
            // Mỗi băng: [mũi băng x1,y1 -> x2,y2] cùng vector pháp tuyến hướng ra ngoài
            const segs = [
                // Băng trên: từ lỗ góc trái tới lỗ giữa, rồi tới lỗ góc phải
                [LEFT + C_NOSE, TOP, MID_X - S_NOSE, TOP, 0, -1, C_NOSE - C_BASE, S_NOSE - S_BASE],
                [MID_X + S_NOSE, TOP, RIGHT - C_NOSE, TOP, 0, -1, S_NOSE - S_BASE, C_NOSE - C_BASE],
                // Băng dưới
                [MID_X - S_NOSE, BOTTOM, LEFT + C_NOSE, BOTTOM, 0, 1, S_NOSE - S_BASE, C_NOSE - C_BASE],
                [RIGHT - C_NOSE, BOTTOM, MID_X + S_NOSE, BOTTOM, 0, 1, C_NOSE - C_BASE, S_NOSE - S_BASE],
                // Băng trái & phải (không có lỗ giữa)
                [LEFT, BOTTOM - C_NOSE, LEFT, TOP + C_NOSE, -1, 0, C_NOSE - C_BASE, C_NOSE - C_BASE],
                [RIGHT, TOP + C_NOSE, RIGHT, BOTTOM - C_NOSE, 1, 0, C_NOSE - C_BASE, C_NOSE - C_BASE]
            ];

            for (const [x1, y1, x2, y2, nx, ny, cut1, cut2] of segs) {
                const len = Math.hypot(x2 - x1, y2 - y1);
                const ux = (x2 - x1) / len, uy = (y2 - y1) / len;   // dọc theo băng
                // Chân băng thò ra hai phía so với mũi băng -> tạo mặt vát vào lỗ
                const bx1 = x1 + nx * CUSH - ux * cut1, by1 = y1 + ny * CUSH - uy * cut1;
                const bx2 = x2 + nx * CUSH + ux * cut2, by2 = y2 + ny * CUSH + uy * cut2;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(bx2, by2);
                ctx.lineTo(bx1, by1);
                ctx.closePath();

                const g = ctx.createLinearGradient(x1, y1, x1 + nx * CUSH, y1 + ny * CUSH);
                g.addColorStop(0, '#1fae6c');      // mũi băng hứng sáng
                g.addColorStop(0.18, '#159158');
                g.addColorStop(1, '#0a5734');      // chân băng chìm trong bóng
                ctx.fillStyle = g;
                ctx.fill();

                // Gờ sáng ngay trên mũi băng
                ctx.strokeStyle = 'rgba(255,255,255,0.22)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1 + nx * 1.2, y1 + ny * 1.2);
                ctx.lineTo(x2 + nx * 1.2, y2 + ny * 1.2);
                ctx.stroke();

                // Bóng đổ của băng xuống mặt nỉ
                const sg = ctx.createLinearGradient(x1, y1, x1 - nx * 13, y1 - ny * 13);
                sg.addColorStop(0, 'rgba(0,0,0,0.34)');
                sg.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = sg;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x2 - nx * 13, y2 - ny * 13);
                ctx.lineTo(x1 - nx * 13, y1 - ny * 13);
                ctx.closePath();
                ctx.fill();
            }
        },

        // --- Lỗ bi ---
        drawPockets(ctx) {
            POCKETS.forEach((p, i) => {
                const flash = this.pocketFlash[i];
                const rOut = POCKET_R + 9;

                ctx.save();
                // Vành lỗ bằng da/đồng
                const ring = ctx.createRadialGradient(p.x - 3, p.y - 4, rOut * 0.4, p.x, p.y, rOut);
                ring.addColorStop(0, '#5a4326');
                ring.addColorStop(0.7, '#3a2a15');
                ring.addColorStop(1, '#1d1409');
                ctx.fillStyle = ring;
                ctx.beginPath();
                ctx.arc(p.x, p.y, rOut, 0, Math.PI * 2);
                ctx.fill();

                // Miệng lỗ: tối dần vào tâm, hở sáng nhẹ ở mép trên cho có chiều sâu
                const hole = ctx.createRadialGradient(p.x - 2, p.y - 3, 1, p.x, p.y, POCKET_R + 2);
                hole.addColorStop(0, '#000000');
                hole.addColorStop(0.6, '#050505');
                hole.addColorStop(0.88, '#12100d');
                hole.addColorStop(1, '#2b2118');
                ctx.fillStyle = hole;
                ctx.beginPath();
                ctx.arc(p.x, p.y, POCKET_R + 2, 0, Math.PI * 2);
                ctx.fill();

                // Ánh sáng hắt vào thành lỗ phía trên
                ctx.strokeStyle = 'rgba(255,230,190,0.16)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, POCKET_R, Math.PI * 1.12, Math.PI * 1.88);
                ctx.stroke();

                if (flash > 0) {
                    ctx.strokeStyle = `rgba(255,215,0,${flash})`;
                    ctx.lineWidth = 4;
                    ctx.shadowColor = 'rgba(255,215,0,0.9)';
                    ctx.shadowBlur = 24 * flash;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, rOut - 2, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            });
        },

        drawBalls(ctx) {
            for (const b of this.balls) {
                if (b.potted && b.dropT <= 0) continue;
                let x = b.x, y = b.y, r = R;
                if (b.potted) {
                    const t = 1 - b.dropT / 0.45;
                    x = b.x + (b.dropX - b.x) * t;
                    y = b.y + (b.dropY - b.y) * t;
                    r = R * (1 - t * 0.85);
                }
                this.drawBall(ctx, b, x, y, r);
            }
        },

        drawBall(ctx, b, x, y, r) {
            // Bóng đổ
            ctx.fillStyle = 'rgba(0,0,0,0.32)';
            ctx.beginPath();
            ctx.ellipse(x + 2.5, y + 3.5, r, r * 0.92, 0, 0, Math.PI * 2);
            ctx.fill();

            // Vẽ lại bề mặt khi bi đã quay đủ nhiều
            if (!b.tex || b.texAge > RETEX_ANGLE) renderBallTex(b);

            ctx.save();
            ctx.translate(x, y);
            ctx.drawImage(b.tex, -r, -r, r * 2, r * 2);

            // Số bi nằm ở cực của quả cầu: theo bi lăn nên nó trượt dần ra mép,
            // dẹt lại rồi khuất hẳn, sau đó cực bên kia hiện ra.
            if (b.num !== 0) {
                const m = b.ori;
                let px = m[2], py = m[5], pz = m[8];        // trục cực (nơi in số)
                let ax = m[0], ay = m[3];                   // trục ngang của bi -> chữ số nghiêng theo
                if (pz < 0) { px = -px; py = -py; pz = -pz; ax = -ax; }

                const fade = clamp((pz - 0.12) / 0.28, 0, 1);
                const CAP = 0.90;                           // tâm hình chiếu của vòng tròn số
                const th = Math.atan2(py, px);
                ctx.save();
                ctx.globalAlpha = fade;
                ctx.translate(px * r * CAP, py * r * CAP);
                ctx.rotate(th);
                ctx.scale(Math.max(pz, 0.001), 1);          // ép dẹt theo phương xuyên tâm
                ctx.rotate(-th);
                ctx.rotate(Math.atan2(ay, ax));             // chữ số quay theo bi
                ctx.fillStyle = '#15171f';
                ctx.font = `bold ${(r * 0.56).toFixed(1)}px "Nunito", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(b.num), 0, 0);
                ctx.restore();
            }

            ctx.restore();
        },

        drawAim(ctx) {
            if (this.cue.potted) return;
            const pr = this.predict();
            const cx = this.cue.x, cy = this.cue.y;
            const col = PLAYERS[this.turn].color;

            // Đường ngắm
            ctx.save();
            ctx.setLineDash([9, 8]);
            ctx.strokeStyle = 'rgba(255,255,255,0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(pr.gx, pr.gy);
            ctx.stroke();
            ctx.setLineDash([]);

            if (this.helpMode) {
                // Bi ma tại điểm chạm
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.arc(pr.gx, pr.gy, R, 0, Math.PI * 2);
                ctx.stroke();

                // Hướng bi mục tiêu sẽ chạy
                if (pr.hit) {
                    const L = 92;
                    const ex = pr.ball.x + pr.ox * L, ey = pr.ball.y + pr.oy * L;
                    ctx.strokeStyle = 'rgba(255,215,0,0.9)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(pr.ball.x, pr.ball.y);
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                    const a = Math.atan2(pr.oy, pr.ox);
                    ctx.beginPath();
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex - Math.cos(a - 0.42) * 14, ey - Math.sin(a - 0.42) * 14);
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex - Math.cos(a + 0.42) * 14, ey - Math.sin(a + 0.42) * 14);
                    ctx.stroke();
                }
            }
            ctx.restore();

            // Gậy cơ
            const back = 24 + this.power * MAX_PULL * 0.55;
            this.drawCueStick(ctx, cx - Math.cos(this.aimAngle) * back,
                cy - Math.sin(this.aimAngle) * back, this.aimAngle);

            // Thanh lực
            if (this.power > 0.01) {
                const barW = 150, barH = 12;
                const bxx = cx - barW / 2, byy = cy + 40;
                ctx.save();
                ctx.fillStyle = 'rgba(4,7,18,0.8)';
                ctx.beginPath(); ctx.roundRect(bxx - 3, byy - 3, barW + 6, barH + 6, 9); ctx.fill();
                const g = ctx.createLinearGradient(bxx, 0, bxx + barW, 0);
                g.addColorStop(0, '#39ff14');
                g.addColorStop(0.55, '#ffd700');
                g.addColorStop(1, '#ff3366');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.roundRect(bxx, byy, barW * this.power, barH, 6); ctx.fill();
                ctx.strokeStyle = col;
                ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.roundRect(bxx - 3, byy - 3, barW + 6, barH + 6, 9); ctx.stroke();
                ctx.restore();
            }
        },

        // Gậy cơ thật: thon dần từ chuôi ra đầu, đủ đầu da, đai ngà,
        // khớp nối đồng, thân gỗ trắc và phần quấn cán.
        drawCueStick(ctx, tipX, tipY, ang) {
            // Các đoạn: [chiều dài, bán kính đầu, bán kính cuối, màu sáng, màu giữa, màu tối]
            const SEGS = [
                [6, 2.5, 2.7, '#7ba9dd', '#3f7fbd', '#22506f'],     // đầu da (đã chuốt lơ)
                [11, 2.7, 2.9, '#fffdf6', '#ece4d0', '#b7ae95'],    // đai ngà
                [152, 2.9, 4.2, '#fbeaca', '#e2c48a', '#a67c45'],   // thân ngọn gỗ thích
                [5, 4.2, 4.3, '#ffeeae', '#c9a53f', '#7d611a'],     // vòng đồng
                [4, 4.3, 4.35, '#5a5a62', '#26262b', '#0e0e11'],    // cổ khớp
                [78, 4.35, 5.05, '#a9603a', '#6b3720', '#341a0e'],  // thân gỗ trắc
                [64, 5.05, 5.45, '#5c5c66', '#2e2e35', '#131317'],  // phần quấn cán
                [26, 5.45, 5.55, '#a9603a', '#6b3720', '#341a0e'],  // ống cán
                [7, 5.55, 5.2, '#4a4a52', '#1c1c20', '#08080a']     // nắp chuôi
            ];

            const dx = -Math.cos(ang), dy = -Math.sin(ang);   // từ đầu cơ lùi về chuôi
            const nx = -dy, ny = dx;                          // pháp tuyến của gậy

            const total = SEGS.reduce((s, v) => s + v[0], 0);
            ctx.save();

            // Bóng đổ của gậy trên bàn
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(tipX + nx * 2.5 + 4, tipY + ny * 2.5 + 6);
            ctx.lineTo(tipX + dx * total + nx * 5.5 + 4, tipY + dy * total + ny * 5.5 + 6);
            ctx.lineTo(tipX + dx * total - nx * 5.5 + 4, tipY + dy * total - ny * 5.5 + 6);
            ctx.lineTo(tipX - nx * 2.5 + 4, tipY - ny * 2.5 + 6);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;

            let t = 0;
            for (const [len, r0, r1, cLight, cMid, cDark] of SEGS) {
                const ax = tipX + dx * t, ay = tipY + dy * t;
                const bx = tipX + dx * (t + len), by = tipY + dy * (t + len);

                ctx.beginPath();
                ctx.moveTo(ax + nx * r0, ay + ny * r0);
                ctx.lineTo(bx + nx * r1, by + ny * r1);
                ctx.lineTo(bx - nx * r1, by - ny * r1);
                ctx.lineTo(ax - nx * r0, ay - ny * r0);
                ctx.closePath();

                // Chuyển màu ngang thân gậy cho ra khối trụ tròn
                const mx = (ax + bx) / 2, my = (ay + by) / 2, rr = (r0 + r1) / 2;
                const g = ctx.createLinearGradient(mx + nx * rr, my + ny * rr, mx - nx * rr, my - ny * rr);
                g.addColorStop(0, cDark);
                g.addColorStop(0.32, cMid);
                g.addColorStop(0.52, cLight);
                g.addColorStop(0.72, cMid);
                g.addColorStop(1, cDark);
                ctx.fillStyle = g;
                ctx.fill();
                t += len;
            }

            // Hoa văn quấn cán (đoạn thứ 7)
            let wrapStart = 0;
            for (let i = 0; i < 6; i++) wrapStart += SEGS[i][0];
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.10)';
            ctx.lineWidth = 1;
            for (let s = 4; s < SEGS[6][0]; s += 7) {
                const px = tipX + dx * (wrapStart + s), py = tipY + dy * (wrapStart + s);
                ctx.beginPath();
                ctx.moveTo(px + nx * 5.2 - dx * 3, py + ny * 5.2 - dy * 3);
                ctx.lineTo(px - nx * 5.2 + dx * 3, py - ny * 5.2 + dy * 3);
                ctx.stroke();
            }
            ctx.restore();

            // Ánh sáng dọc thân gậy
            ctx.strokeStyle = 'rgba(255,255,255,0.20)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(tipX + nx * 1.1 + dx * 18, tipY + ny * 1.1 + dy * 18);
            ctx.lineTo(tipX + nx * 2.2 + dx * total * 0.92, tipY + ny * 2.2 + dy * total * 0.92);
            ctx.stroke();

            ctx.restore();
        },

        drawBallInHand(ctx) {
            const g = this.ghostCue;
            const col = PLAYERS[this.turn].color;

            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.strokeRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP);
            ctx.setLineDash([]);
            ctx.restore();

            if (!g) {
                // Nhấp nháy chỗ bi trắng hiện tại để bé biết cần kéo
                const pulse = 0.5 + Math.sin(this.time * 6) * 0.5;
                ctx.save();
                ctx.strokeStyle = `rgba(255,255,255,${0.35 + pulse * 0.5})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.cue.x, this.cue.y, R + 8 + pulse * 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                return;
            }

            ctx.save();
            ctx.globalAlpha = 0.85;
            this.drawBall(ctx, this.cue, g.x, g.y, R);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = g.valid ? 'rgba(57,255,20,0.95)' : 'rgba(255,51,102,0.95)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(g.x, g.y, R + 6, 0, Math.PI * 2);
            ctx.stroke();
            if (!g.valid) {
                ctx.beginPath();
                ctx.moveTo(g.x - 9, g.y - 9); ctx.lineTo(g.x + 9, g.y + 9);
                ctx.moveTo(g.x + 9, g.y - 9); ctx.lineTo(g.x - 9, g.y + 9);
                ctx.stroke();
            }
            ctx.restore();
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
