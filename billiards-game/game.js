/* =========================================================
   POOL MASTERS — Bi-a 8 bi cho 2 người chơi luân phiên
   Điều khiển: kéo lùi từ bi trắng rồi thả (chuột / chạm),
   phím ← → chỉnh hướng, giữ Space lấy lực rồi thả để đánh.
   ========================================================= */
(() => {
    'use strict';

    // ---------- Kích thước bàn (toạ độ logic) ----------
    const W = 1160, H = 764;        // chừa dải điều khiển phía dưới bàn
    const LEFT = 76, RIGHT = 1084, TOP = 68, BOTTOM = 572;   // mặt nỉ: 1008 x 504 (đúng tỉ lệ 2:1)
    const MID_X = (LEFT + RIGHT) / 2, MID_Y = (TOP + BOTTOM) / 2;

    const R = 12.5;                 // bán kính bi
    const POCKET_R = 24;            // bán kính bắt bi của lỗ
    const POCKETS = [
        { x: LEFT, y: TOP }, { x: MID_X, y: TOP - 4 }, { x: RIGHT, y: TOP },
        { x: LEFT, y: BOTTOM }, { x: MID_X, y: BOTTOM + 4 }, { x: RIGHT, y: BOTTOM }
    ];

    // --- Ma sát: mô phỏng đúng bi thật, bám theo VẬN TỐC QUAY của từng quả bi ---
    // Bàn 9 feet: mặt nỉ 2,54m ứng với 1008px  =>  1 mét ≈ 397px.
    // Mỗi bi giữ riêng vận tốc quay ω. Điểm chạm nỉ trượt với vận tốc
    //     u = v + ω × (-R·ẑ) = (vx - R·ωy , vy + R·ωx)
    // Còn u ≠ 0 thì bi TRƯỢT: nỉ hãm bi theo chiều ngược u (μ≈0,2 → 780 px/s²) đồng thời
    // vặn cho bi quay nhanh dần; u tự triệt tiêu với gia tốc 7/2·A_SLIDE. Khi u = 0 bi đã
    // LĂN ĐỀU, ma sát nhỏ hơn ~20 lần (μ≈0,010) nên bi còn trôi rất xa — đó là quán tính.
    // Nhờ giữ ω riêng, bi cái đâm bi xong vẫn còn xoáy tới nên tự chạy tiếp, không khựng.
    const A_SLIDE = 780;            // giảm tốc lúc bi còn trượt (px/s²)
    const A_ROLL = 38;              // giảm tốc khi bi đã lăn đều (px/s², ứng với μ≈0,010)
    const SPIN_DECEL = 25;          // xoáy ngang (quanh trục dọc) tắt dần (rad/s²)
    const STOP_V = 6;               // dưới ngưỡng này (cả vận tốc lẫn trượt) bi mới đứng yên
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
    // ---------- Hình học 6 lỗ, lấy theo bàn 9 feet tiêu chuẩn ----------
    // Miệng lỗ đo giữa hai MŨI BĂNG: lỗ góc 4½" = 2,0 đường kính bi; lỗ giữa 5" = 2,2.
    const C_NOSE = 2 * Math.SQRT2 * R;  // mũi băng cách điểm lỗ góc dọc mỗi cạnh (miệng = 4R)
    const S_NOSE = 2.2 * R;             // nửa miệng lỗ giữa (miệng = 4,4R)
    // Hai đầu băng được cắt vát (facing) để mở miệng lỗ. Góc cắt chuẩn: lỗ góc 142°,
    // lỗ giữa 104° — quy ra là mặt vát nghiêng 26° (góc) và 38° (giữa) so với phương
    // vuông góc với băng, nên khi đi hết bề dày băng thì chân vát lùi ra:
    const C_FACE = CUSH * Math.tan(26 * Math.PI / 180);   // ≈ 10,7 px
    const S_FACE = CUSH * Math.tan(38 * Math.PI / 180);   // ≈ 17,2 px
    // Miệng lỗ là hốc TRÒN nằm ngay sau hàm băng, ăn lấn cả vào khung gỗ.
    // Bán kính lấy vừa đủ để cung tròn chạy sát hai mũi băng, không để hở nêm gỗ ở hàm lỗ.
    const C_HOLE = 29, C_OFF = -4;      // lỗ góc: bán kính; tâm lùi VÀO trong theo đường chéo
    const S_HOLE = 2.05 * R, S_OFF = 8; // lỗ giữa: bán kính; tâm lệch RA phía thành bàn
    // Lỗ giữa không có "đường chéo" như lỗ góc, nên bi rơi khi tâm vào trong bề ngang
    // miệng lỗ và áp sát đường mũi băng. Lấy R + 5 để bi chạm băng là rơi ngay, không lọt.
    const S_CATCH = R + 5;

    // ---------- Bảng chọn điểm chạm trên bi cái (9 vị trí) ----------
    // Bảng điều khiển nằm hẳn dưới bàn, không đè lên mặt nỉ
    const PANEL = { w: 720, y: 642, h: 108, x: 0 };
    PANEL.x = MID_X - PANEL.w / 2;                  // canh giữa theo bàn
    const SPIN_CX = PANEL.x + 62, SPIN_CY = PANEL.y + PANEL.h / 2, SPIN_R = 40;
    // Khoảng cách từ tâm bi tới các chấm chọn. Hàng trên/dưới (đánh cao/thấp) đặt xa
    // tâm hơn cột trái/phải cho dễ nhắm và đúng thói quen cầm cơ.
    const SPIN_STEP_X = SPIN_R * 0.52;
    const SPIN_STEP_Y = SPIN_R * 0.66;
    // Hướng đèn chiếu lên quả bi cái trong bảng (dùng để tô khối và làm mờ chấm khuất)
    const SPIN_LIGHT = (() => {
        const v = [-0.42, -0.52, 0.74], n = Math.hypot(...v);
        return v.map(c => c / n);
    })();
    // Điểm chạm của đầu cơ lệch tâm bao nhiêu thì bi nhận xoáy bấy nhiêu:
    //     ω = 5 · (độ lệch) · (lực đánh) / (2R²)
    // Lệch 0,4R là bi lăn đều ngay từ đầu; quá 0,5R thì cơ trượt (miscue) nên lấy 0,48R
    // làm mức tối đa — đánh cao/thấp hết cỡ cho xoáy 1,2 lần mức lăn đều.
    const TIP_MAX = R * 0.48;
    const SPIN_K = 5 * TIP_MAX / (2 * R * R);   // hệ số quy đổi lực đánh -> ω (rad/s trên mỗi px/s)
    const CUSH_GRIP = 0.11;     // băng "bám" xoáy ngang mạnh cỡ nào khi bi ăn băng
    const CUSH_GRIP_MAX = 0.5;  // độ bạt tối đa, tính theo tốc độ đâm vào băng
    const CUSH_SPIN_KEEP = 0.45;// phần xoáy ngang còn lại sau mỗi lần ăn băng

    // Mô tả cho từng điểm chạm, tra theo `${x},${y}`
    const SPIN_HINT = {
        '0,0': 'CENTRE hit — natural roll, the cue keeps drifting after contact',
        '0,1': 'TOP spin — the cue follows the object ball',
        '0,-1': 'BOTTOM spin — the cue draws back',
        '-1,0': 'LEFT english — the cue kicks left off the cushion',
        '1,0': 'RIGHT english — the cue kicks right off the cushion',
        '-1,1': 'TOP + LEFT — follows through and veers left',
        '1,1': 'TOP + RIGHT — follows through and veers right',
        '-1,-1': 'BOTTOM + LEFT — draws back and veers left',
        '1,-1': 'BOTTOM + RIGHT — draws back and veers right'
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
        { name: 'PLAYER 1', emoji: '🦊', color: '#ff6b3d' },
        { name: 'PLAYER 2', emoji: '🐧', color: '#3da5ff' }
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

    // Tô lại ảnh bề mặt bi theo hướng quay hiện tại.
    // `size` cho phép tô ở độ phân giải cao hơn khi cần ảnh bi to (danh sách bi ở HUD).
    function renderBallTex(b, size = TEX) {
        if (!b.tex || b.tex.width !== size) {
            b.tex = document.createElement('canvas');
            b.tex.width = b.tex.height = size;
            b.texCtx = b.tex.getContext('2d');
            b.texImg = b.texCtx.createImageData(size, size);
        }
        orthonormalize(b.ori);
        const m = b.ori, d = b.texImg.data;
        const stripe = isStripe(b.num);
        const col = b.num === 0 ? CUE_RGB : BALL_RGB[b.num];
        let p = 0;

        for (let j = 0; j < size; j++) {
            const ny = (j + 0.5) / size * 2 - 1;
            for (let i = 0; i < size; i++, p += 4) {
                const nx = (i + 0.5) / size * 2 - 1;
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
                    // Dải sọc quanh xích đạo; số bi in trong vòng tròn trắng NẰM TRÊN dải sọc
                    // (đúng như bi thật), tức là ở hai đầu trục x của quả bi.
                    base = Math.abs(lz) < 0.52 && Math.abs(lx) < 0.90 ? col : WHITE_RGB;
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
                const edge = (1 - Math.sqrt(d2)) * (size * 0.5);     // làm mịn viền bi
                d[p + 3] = edge >= 1 ? 255 : edge * 255;
            }
        }
        b.texCtx.putImageData(b.texImg, 0, 0);
        b.texAge = 0;
    }

    /* Số bi in trong vòng tròn trắng trên mặt cầu: bi trơn in ở hai cực (trục z của bi),
       bi sọc in ngay trên dải sọc (trục x). Theo bi lăn, chữ số trượt dần ra mép, dẹt lại
       rồi khuất hẳn, sau đó mặt bên kia hiện ra. Gốc toạ độ ctx phải ở tâm quả bi. */
    function drawBallNumber(ctx, ori, num, r) {
        if (num === 0) return;
        const st = isStripe(num);
        let px = st ? ori[0] : ori[2];              // hướng của mặt in số
        let py = st ? ori[3] : ori[5];
        let pz = st ? ori[6] : ori[8];
        let ax = st ? ori[1] : ori[0];              // trục "ngang" của chữ số
        let ay = st ? ori[4] : ori[3];
        if (pz < 0) { px = -px; py = -py; pz = -pz; ax = -ax; }

        const fade = clamp((pz - 0.12) / 0.28, 0, 1);
        if (fade <= 0) return;
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
        ctx.fillText(String(num), 0, 0);
        ctx.restore();
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
            // Vận tốc quay (rad/s) trong hệ trục màn hình: x sang phải, y xuống dưới,
            // z hướng về phía người xem (tức là hướng thẳng đứng lên khỏi mặt bàn).
            // wx, wy là xoáy "lăn"; wz là xoáy ngang quanh trục dọc (xoáy trái/phải).
            this.wx = 0; this.wy = 0; this.wz = 0;
            // Hướng quay 3D của quả bi (ma trận 3x3, hàng = 3 trục gắn với bi)
            this.ori = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            this.texAge = 99;         // góc đã quay kể từ lần vẽ lại bề mặt gần nhất
            this.tex = null;

            // Mỗi bi nằm sẵn trên bàn ở một tư thế khác nhau cho tự nhiên
            rotateOri(this.ori, 1, 0, 0, (num * 37 % 360) * Math.PI / 180);
            rotateOri(this.ori, 0, 1, 0, (num * 73 % 360) * Math.PI / 180);
            this.dropT = 0;           // hiệu ứng rơi vào lỗ
            this.dropX = 0; this.dropY = 0;
        }
        get speed() { return Math.hypot(this.vx, this.vy); }
        // Bi còn "sống" khi còn chạy HOẶC còn xoáy lăn — bi lùi (đờ-mi) có lúc vận tốc
        // bằng 0 giữa chừng nhưng xoáy ngược vẫn kéo nó quay lại, không được coi là đã dừng.
        get moving() { return this.vx !== 0 || this.vy !== 0 || this.wx !== 0 || this.wy !== 0; }
        // Vận tốc trượt của điểm bi chạm nỉ
        get slipX() { return this.vx - R * this.wy; }
        get slipY() { return this.vy + R * this.wx; }

        // Đặt bi về trạng thái lăn đều với vận tốc hiện tại (hết trượt)
        setRolling() { this.wy = this.vx / R; this.wx = -this.vy / R; }
        rest() { this.vx = this.vy = 0; this.wx = this.wy = this.wz = 0; }
    }

    // ---------- Ảnh quả bi cho danh sách bi ở thanh người chơi ----------
    // Vẫn là quả bi 3D y hệt trên bàn, chỉ quay sẵn về tư thế dễ đọc nhất:
    // bi trơn nhìn thẳng vào cực (vòng tròn trắng có số ở giữa, xung quanh là màu bi),
    // bi sọc quay ngang để dải sọc nằm vắt ngang giữa quả, số nằm giữa dải.
    const ICON_PX = 128;
    const BALL_ICON = {};
    function ballIcon(num) {
        if (BALL_ICON[num]) return BALL_ICON[num];
        const b = new Ball(num, 0, 0);
        b.ori = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        if (isStripe(num)) {
            rotateOri(b.ori, 0, 1, 0, -Math.PI / 2);    // đưa mặt in số ra trước
            rotateOri(b.ori, 0, 0, 1, -Math.PI / 2);    // xoay cho dải sọc nằm ngang, số dựng đứng
        }
        renderBallTex(b, ICON_PX);

        const cv = document.createElement('canvas');
        cv.width = cv.height = ICON_PX;
        const c = cv.getContext('2d');
        const r = ICON_PX / 2;
        c.translate(r, r);
        c.drawImage(b.tex, -r, -r, r * 2, r * 2);
        drawBallNumber(c, b.ori, num, r);
        BALL_ICON[num] = cv.toDataURL();
        return BALL_ICON[num];
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
                    'Aim Line:' + (this.helpMode ? 'ON' : 'OFF');
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
            this.cue.rest();
            this.ghostCue = null;
            this.state = 'aim';
            this.syncHUD();
        },

        // ---------- Bảng chọn điểm chạm bi cái ----------
        spinDotPos(x, y) {
            return { x: SPIN_CX + x * SPIN_STEP_X, y: SPIN_CY - y * SPIN_STEP_Y };
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
            const dx = Math.cos(this.aimAngle), dy = Math.sin(this.aimAngle);
            const cb = this.cue;
            cb.vx = dx * speed;
            cb.vy = dy * speed;

            // Xoáy ban đầu do đầu cơ chạm lệch tâm bi.
            // Lệch DỌC (cao/thấp): trục quay vuông góc hướng đi, cùng chiều với lúc bi lăn.
            const wRoll = this.spin.y * SPIN_K * speed;
            cb.wx = -dy * wRoll;
            cb.wy = dx * wRoll;
            // Lệch NGANG: mô-men quanh trục dọc, chạm bên phải -> wz âm (ngược chiều kim đồng hồ trên màn hình)
            cb.wz = -this.spin.x * SPIN_K * speed;
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
            // Bi đang trượt tại chỗ (vận tốc 0 nhưng còn xoáy) vẫn sắp chuyển động,
            // nên lấy cả tốc độ trượt vào mức chia nhỏ bước thời gian.
            let maxV = 0, active = false;
            for (const b of this.balls) {
                if (b.potted) continue;
                if (b.moving) active = true;
                const v = Math.max(b.speed, Math.hypot(b.slipX, b.slipY) * 0.5);
                if (v > maxV) maxV = v;
            }
            if (!active) return false;

            const steps = clamp(Math.ceil(maxV * dt / (R * 0.4)), 1, 48);
            const h = dt / steps;

            for (let s = 0; s < steps; s++) {
                // Di chuyển + ma sát
                for (const b of this.balls) {
                    if (b.potted) continue;
                    if (!b.moving && b.wz === 0) continue;

                    // --- Giai đoạn TRƯỢT: nỉ hãm bi ngược chiều trượt và vặn cho bi quay ---
                    const ux = b.slipX, uy = b.slipY;
                    const us = Math.hypot(ux, uy);
                    let left = h;
                    if (us > 1e-6) {
                        // Trượt tự triệt tiêu với gia tốc 7/2·A_SLIDE; không cho vượt quá mức 0
                        const tSlide = Math.min(h, us / (3.5 * A_SLIDE));
                        const ax = -A_SLIDE * ux / us, ay = -A_SLIDE * uy / us;
                        b.vx += ax * tSlide; b.vy += ay * tSlide;
                        // dω/dt = 5/(2R)·(a_y, -a_x): mô-men của lực ma sát đặt ở đáy bi
                        b.wx += (2.5 / R) * ay * tSlide;
                        b.wy += -(2.5 / R) * ax * tSlide;
                        left = h - tSlide;                // > 0 nghĩa là bi vừa hết trượt giữa bước
                    }

                    // --- Giai đoạn LĂN ĐỀU: ma sát lăn rất nhỏ, bi trôi theo quán tính ---
                    if (left > 0) {
                        const sp = b.speed;
                        if (sp > 0) {
                            const ns = Math.max(0, sp - A_ROLL * left);
                            b.vx *= ns / sp; b.vy *= ns / sp;
                        }
                        b.setRolling();
                    }

                    // Xoáy ngang quanh trục dọc tắt dần riêng
                    if (b.wz !== 0) {
                        const nz = Math.max(0, Math.abs(b.wz) - SPIN_DECEL * h);
                        b.wz = nz === 0 ? 0 : Math.sign(b.wz) * nz;
                    }

                    // Chỉ dừng hẳn khi vừa gần đứng yên vừa hết trượt — còn trượt là còn
                    // bị nỉ đẩy đi tiếp (cú đờ-mi kéo bi cái quay ngược lại chính là lúc này).
                    if (b.speed < STOP_V && Math.hypot(b.slipX, b.slipY) < STOP_V) {
                        b.rest();
                        continue;
                    }

                    b.x += b.vx * h; b.y += b.vy * h;

                    // Quay quả bi quanh đúng trục ω hiện tại (thấy được cả xoáy lùi lẫn xoáy ngang)
                    const w = Math.hypot(b.wx, b.wy, b.wz);
                    if (w > 1e-6) {
                        const ang = w * h;
                        rotateOri(b.ori, b.wx / w, b.wy / w, b.wz / w, ang);
                        b.texAge += ang;
                    }
                }

                // Rơi lỗ (kiểm tra trước băng để bi không bị dội ra khỏi miệng lỗ)
                for (const b of this.balls) {
                    if (b.potted) continue;
                    const pi = this.pocketAt(b.x, b.y);
                    if (pi >= 0) this.potBall(b, pi);
                }

                // Băng bàn
                for (const b of this.balls) {
                    if (b.potted) continue;
                    // Ở ngay hàm lỗ giữa thì băng bị cắt đứt — không có gì để bi dội vào
                    const openMid = Math.abs(b.x - MID_X) < S_NOSE;
                    // Pháp tuyến n hướng từ tâm bi ra phía băng vừa chạm
                    let nx = 0, ny = 0, hit = 0;
                    if (b.x < LEFT + R) { b.x = LEFT + R; hit = Math.abs(b.vx); b.vx = -b.vx * CUSHION_E; nx = -1; }
                    else if (b.x > RIGHT - R) { b.x = RIGHT - R; hit = Math.abs(b.vx); b.vx = -b.vx * CUSHION_E; nx = 1; }
                    if (!openMid) {
                        if (b.y < TOP + R) { b.y = TOP + R; hit = Math.max(hit, Math.abs(b.vy)); b.vy = -b.vy * CUSHION_E; ny = -1; }
                        else if (b.y > BOTTOM - R) { b.y = BOTTOM - R; hit = Math.max(hit, Math.abs(b.vy)); b.vy = -b.vy * CUSHION_E; ny = 1; }
                    }
                    if (hit <= 0) continue;

                    // Xoáy ngang: mặt bi ở chỗ chạm băng trượt với vận tốc -wz·R·(-n_y, n_x),
                    // băng ma sát ngược lại nên đẩy bi lệch sang bên theo đúng chiều xoáy.
                    if (b.wz !== 0) {
                        const kick = clamp(-b.wz * R * CUSH_GRIP, -CUSH_GRIP_MAX * hit, CUSH_GRIP_MAX * hit);
                        b.vx += -ny * kick;
                        b.vy += nx * kick;
                        b.wz *= CUSH_SPIN_KEEP;
                    }
                    // Xoáy lăn (wx, wy) giữ nguyên: bi vừa dội ra thì xoáy đang ngược với
                    // hướng đi mới nên nó trượt lại một đoạn rồi mới bám lăn — đúng như bi thật.
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
                        // Va chạm chỉ đổi vận tốc tịnh tiến; xoáy của mỗi bi được GIỮ NGUYÊN.
                        // Nhờ vậy bi cái đang lăn tới mà đâm đầy bi thì tuy vận tốc bị triệt gần
                        // hết, xoáy tới vẫn còn nên nỉ đẩy nó chạy tiếp — không dừng khựng nữa.
                        // Bi mục tiêu đứng yên nên xoáy = 0, nó trượt một đoạn rồi mới lăn đều.

                        if (a.num === 0 || b.num === 0) {
                            if (this.firstContact === null) this.firstContact = a.num === 0 ? b.num : a.num;
                        }
                        Sfx.click(Math.abs(rvn));
                    }
                }
            }

            for (const b of this.balls) if (!b.potted && b.moving) return true;
            return false;
        },

        /* Bi rơi lỗ khi tâm nó lọt qua HÀM LỖ — tức là qua khỏi đường nối hai mũi băng,
           chỗ băng đã bị cắt đi. Đây cũng đúng là vùng mà vòng lặp băng ở trên bỏ qua,
           nên không có kẽ hở: hoặc bi bị băng dội lại, hoặc bi rơi lỗ, không có chuyện
           bi nằm giữa miệng lỗ mà vẫn bị "băng ma" đánh bật ra.
           Trả về chỉ số lỗ, hoặc -1 nếu bi vẫn còn trên bàn. */
        pocketAt(x, y) {
            // Lỗ góc: tâm bi đã vượt qua đường chéo nối hai mũi băng
            for (const i of [0, 2, 3, 5]) {
                const p = POCKETS[i];
                const sx = p.x < MID_X ? -1 : 1, sy = p.y < MID_Y ? -1 : 1;
                if (-sx * (x - p.x) - sy * (y - p.y) < C_NOSE) return i;
            }
            // Lỗ giữa: nằm trong bề ngang miệng lỗ và đã áp sát đường mũi băng
            if (Math.abs(x - MID_X) < S_NOSE) {
                if (y < TOP + S_CATCH) return 1;
                if (y > BOTTOM - S_CATCH) return 4;
            }
            return -1;
        },

        potBall(b, pocketIndex) {
            b.potted = true;
            b.rest();
            b.dropT = 0.45;
            const h = this.pocketHole(pocketIndex);      // rơi vào đúng tâm hốc đang vẽ
            b.dropX = h.x;
            b.dropY = h.y;
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
                this.cue.rest();
            }

            // --- Bi số 8 ---
            if (potted8) {
                const legal = this.canShootEight(cur) && !this.cueScratched;
                this.declareWinner(legal ? cur : other,
                    legal ? 'A perfect finish on the 8 ball!'
                        : (this.cueScratched ? 'Cue ball potted with the 8 — instant loss!'
                            : 'Potted the 8 ball too early — instant loss!'));
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
                    assignedMsg = `${PLAYERS[cur].emoji} takes ${g === 'solid' ? 'SOLIDS 1-7' : 'STRIPES 9-15'}!`;
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
                let why = 'Cue ball potted!';
                if (!this.cueScratched && this.firstContact === null) why = 'No ball was hit!';
                else if (!this.cueScratched && badHit) {
                    why = this.canShootEight(cur) ? 'You must hit the 8 ball first!' : 'Hit the opponent\'s ball first!';
                }
                this.turn = other;
                this.state = 'ballinhand';
                this.ghostCue = null;
                Sfx.foul();
                this.showToast(`⚠️ ${why} ${PLAYERS[other].emoji} gets ball in hand.`, 'bad');
            } else if (ownPotted) {
                this.state = 'aim';
                this.showToast(`${assignedMsg}✅ Nice pot — ${PLAYERS[cur].emoji} shoots again!`, 'good');
            } else {
                this.turn = other;
                this.state = 'aim';
                this.showToast(assignedMsg ? `${assignedMsg}${PLAYERS[other].emoji}'s turn` :
                    `Nothing potted — ${PLAYERS[other].emoji} ${PLAYERS[other].name}'s turn`, 'info');
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
                `${PLAYERS[player].emoji} ${PLAYERS[player].name} WINS!`;
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
            const label = g => g === 'solid' ? 'SOLIDS 1-7' : g === 'stripe' ? 'STRIPES 9-15' : 'No group assigned yet';
            [0, 1].forEach(i => {
                const gEl = i === 0 ? this.el.p1group : this.el.p2group;
                const g = this.groups[i];
                gEl.textContent = this.canShootEight(i) ? '🎱 SHOOT THE 8 BALL!' : label(g);
                gEl.className = 'p-group' + (g ? ' ' + g : '');

                const holder = i === 0 ? this.el.p1balls : this.el.p2balls;
                const nums = g === 'solid' ? [1, 2, 3, 4, 5, 6, 7]
                    : g === 'stripe' ? [9, 10, 11, 12, 13, 14, 15] : [];
                const html = nums.map(n => {
                    const done = !this.balls.some(b => b.num === n && !b.potted);
                    return `<div class="mini-ball${done ? ' done' : ''}" title="Bi ${n}" ` +
                        `style="background-image:url(${ballIcon(n)})"></div>`;
                }).join('');
                if (holder.innerHTML !== html) holder.innerHTML = html;
            });

            this.el.panel1.classList.toggle('active', this.turn === 0 && this.state !== 'over');
            this.el.panel2.classList.toggle('active', this.turn === 1 && this.state !== 'over');

            if (this.state === 'over') {
                this.el.turnText.textContent = 'FRAME OVER';
                this.el.turnSub.textContent = 'Press PLAY AGAIN for a new frame';
            } else {
                this.el.turnText.textContent = `${PLAYERS[this.turn].emoji} KID ${this.turn + 1}'S TURN`;
                this.el.turnSub.textContent =
                    this.state === 'ballinhand' ? 'Drag the cue ball to a good spot' :
                        this.state === 'rolling' ? 'Balls are rolling...' :
                            this.isBreak ? 'Time to break!' : 'Drag back from the cue ball and release';
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

        /* Bảng chọn điểm chạm: nằm hẳn dưới bàn trong khung riêng, không đè lên mặt nỉ.
           Bi cái vẽ như khối cầu thật — 9 điểm đánh nằm ĐÚNG trên mặt cầu nên càng ra
           rìa càng bị nhìn nghiêng: dẹt lại theo phương xuyên tâm và tối dần đi. */
        drawSpinWidget(ctx) {
            const active = this.state === 'aim' || this.state === 'ballinhand';
            ctx.save();
            ctx.globalAlpha = active ? 1 : 0.45;

            // Khung bảng điều khiển
            ctx.fillStyle = 'rgba(6, 14, 9, 0.82)';
            ctx.strokeStyle = 'rgba(255,255,255,0.13)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 18);
            ctx.fill();
            ctx.stroke();

            // Bóng đổ dưới quả bi
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.ellipse(SPIN_CX + 3, SPIN_CY + SPIN_R * 0.94, SPIN_R * 0.86, SPIN_R * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Khối cầu bi cái
            const g = ctx.createRadialGradient(
                SPIN_CX + SPIN_LIGHT[0] * SPIN_R * 0.55, SPIN_CY + SPIN_LIGHT[1] * SPIN_R * 0.55, SPIN_R * 0.06,
                SPIN_CX, SPIN_CY, SPIN_R);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.42, '#f3eee1');
            g.addColorStop(0.78, '#cfc7b4');
            g.addColorStop(1, '#8d8677');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(SPIN_CX, SPIN_CY, SPIN_R, 0, Math.PI * 2);
            ctx.fill();

            // Viền tối phía khuất sáng cho quả bi nổi khối
            const rim = ctx.createRadialGradient(SPIN_CX, SPIN_CY, SPIN_R * 0.72, SPIN_CX, SPIN_CY, SPIN_R);
            rim.addColorStop(0, 'rgba(0,0,0,0)');
            rim.addColorStop(1, 'rgba(40,34,24,0.45)');
            ctx.fillStyle = rim;
            ctx.beginPath();
            ctx.arc(SPIN_CX, SPIN_CY, SPIN_R, 0, Math.PI * 2);
            ctx.fill();

            // Hai đường kinh tuyến mờ gợi mặt cong của quả cầu, đi đúng qua các chấm chọn
            ctx.strokeStyle = 'rgba(96,86,68,0.20)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(SPIN_CX, SPIN_CY, SPIN_STEP_X, SPIN_R * 0.97, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(SPIN_CX, SPIN_CY, SPIN_R * 0.97, SPIN_STEP_Y, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Đốm sáng
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.ellipse(SPIN_CX + SPIN_LIGHT[0] * SPIN_R * 0.5, SPIN_CY + SPIN_LIGHT[1] * SPIN_R * 0.5,
                SPIN_R * 0.2, SPIN_R * 0.13, -0.7, 0, Math.PI * 2);
            ctx.fill();

            // 9 điểm đánh nằm trên mặt cầu
            for (let gy = 1; gy >= -1; gy--) {
                for (let gx = -1; gx <= 1; gx++) {
                    const sel = this.spin.x === gx && this.spin.y === gy;
                    const dot = this.spinDotPos(gx, gy);
                    const px = dot.x, py = dot.y;
                    // Pháp tuyến mặt cầu tại điểm đó -> độ nhìn nghiêng và độ sáng
                    const nx = (px - SPIN_CX) / SPIN_R, ny = (py - SPIN_CY) / SPIN_R;
                    const nz = Math.sqrt(Math.max(0.04, 1 - nx * nx - ny * ny));
                    const lit = Math.max(0, nx * SPIN_LIGHT[0] + ny * SPIN_LIGHT[1] + nz * SPIN_LIGHT[2]);
                    const rDot = sel ? SPIN_R * 0.2 : SPIN_R * 0.115;

                    ctx.save();
                    ctx.translate(px, py);
                    if (nx !== 0 || ny !== 0) ctx.rotate(Math.atan2(ny, nx));
                    ctx.scale(nz, 1);          // dẹt lại đúng như một chấm sơn trên mặt cầu
                    ctx.beginPath();
                    ctx.arc(0, 0, rDot, 0, Math.PI * 2);
                    if (sel) {
                        ctx.fillStyle = `rgb(${Math.round(148 + 92 * lit)},${Math.round(18 + 28 * lit)},${Math.round(32 + 32 * lit)})`;
                        ctx.shadowColor = 'rgba(224,30,55,0.85)';
                        ctx.shadowBlur = 14;
                    } else {
                        ctx.fillStyle = `rgba(86,78,68,${0.28 + 0.36 * lit})`;
                    }
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Chữ hướng dẫn bên phải quả bi — tự thu nhỏ nếu dài quá khung
            const hint = SPIN_HINT[`${this.spin.x},${this.spin.y}`] || SPIN_HINT['0,0'];
            const tx = SPIN_CX + SPIN_R + 30;
            const maxW = PANEL.x + PANEL.w - 20 - tx;
            const line = (text, size, weight, family, y) => {
                ctx.font = `${weight} ${size}px ${family}`;
                const w = ctx.measureText(text).width;
                if (w > maxW) ctx.font = `${weight} ${(size * maxW / w).toFixed(1)}px ${family}`;
                ctx.fillText(text, tx, y);
            };
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            line('CUE BALL CONTACT POINT', 13, 'bold', '"Baloo 2", sans-serif', SPIN_CY - 22);
            ctx.fillStyle = this.spin.x === 0 && this.spin.y === 0 ? 'rgba(255,255,255,0.78)' : '#ffe08a';
            line(hint, 18, 'bold', '"Baloo 2", sans-serif', SPIN_CY + 4);
            ctx.fillStyle = 'rgba(255,255,255,0.42)';
            line('Tap the cue ball to pick a spot — it resets to centre after the shot', 13, '', '"Nunito", sans-serif', SPIN_CY + 26);
            ctx.restore();
        },

        drawTable(ctx) {
            this.drawRails(ctx);
            this.drawCloth(ctx);
            this.drawPocketBeds(ctx);   // nỉ quanh lỗ bị khoét, lộ khung gỗ
            this.drawCushions(ctx);     // băng với hai đầu vát ôm lấy hàm lỗ
            this.drawPockets(ctx);      // miệng lỗ tròn nằm trên cùng
        },

        // --- Khung gỗ + các chấm định vị trên thành bàn ---
        drawRails(ctx) {
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 32;
            ctx.shadowOffsetY = 12;

            const g = ctx.createLinearGradient(0, OY0, 0, OY1);
            g.addColorStop(0, '#d2a161');
            g.addColorStop(0.06, '#b8813f');
            g.addColorStop(0.5, '#8f5c26');
            g.addColorStop(0.94, '#6d4319');
            g.addColorStop(1, '#4e2f10');
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
            ctx.strokeStyle = 'rgba(74,40,10,0.22)';
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

            // Viền tối ôm sát mép nỉ, tách hẳn khung gỗ khỏi mặt bàn
            ctx.strokeStyle = 'rgba(46,24,6,0.55)';
            ctx.lineWidth = 3;
            ctx.strokeRect(CX0 - 1.5, CY0 - 1.5, CX1 - CX0 + 3, CY1 - CY0 + 3);

            // Nạm định vị trên thành bàn: khảm tròn xà cừ viền gỗ sẫm
            const stud = (x, y, r) => {
                ctx.beginPath();
                ctx.arc(x, y + 1, r + 1.6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(48,24,6,0.6)';
                ctx.fill();
                const dg = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.15, x, y, r);
                dg.addColorStop(0, '#fffdf3');
                dg.addColorStop(0.6, '#eadfc4');
                dg.addColorStop(1, '#b9ab8a');
                ctx.fillStyle = dg;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            };
            const railTopY = (OY0 + CY0) / 2, railBotY = (OY1 + CY1) / 2;
            const railLeftX = (OX0 + CX0) / 2, railRightX = (OX1 + CX1) / 2;
            // Mốc chuẩn (1/8 chiều dài, 1/4 chiều rộng) to hơn, xen giữa là chấm nhỏ trang trí
            for (let k = 1; k <= 15; k++) {
                if (k === 8) continue;                      // ngay lỗ giữa
                const x = LEFT + (RIGHT - LEFT) * k / 16;
                const r = k % 2 === 0 ? 3.6 : 1.8;
                stud(x, railTopY, r); stud(x, railBotY, r);
            }
            for (let k = 1; k <= 7; k++) {
                const y = TOP + (BOTTOM - TOP) * k / 8;
                const r = k % 2 === 0 ? 3.6 : 1.8;
                stud(railLeftX, y, r); stud(railRightX, y, r);
            }
        },

        // --- Mặt nỉ: xanh tươi, mịn, sáng giữa bàn và tối dần ra bốn phía ---
        drawCloth(ctx) {
            // Nền nỉ. Đèn treo giữa bàn nên vùng sáng nhất hơi lệch lên trên.
            const felt = ctx.createRadialGradient(MID_X, MID_Y - 30, 60, MID_X, MID_Y, 620);
            felt.addColorStop(0, '#27b155');
            felt.addColorStop(0.42, '#1ea149');
            felt.addColorStop(0.72, '#158d3d');
            felt.addColorStop(1, '#0c6b2c');
            ctx.fillStyle = felt;
            ctx.fillRect(CX0, CY0, CX1 - CX0, CY1 - CY0);

            // Bóng tối ép vào sát bốn cạnh cho mặt bàn có chiều sâu
            ctx.save();
            const edge = 46;
            const sides = [
                [CX0, CY0, CX0 + edge, CY0, CX0, CY0, edge, CY1 - CY0],           // trái
                [CX1, CY0, CX1 - edge, CY0, CX1 - edge, CY0, edge, CY1 - CY0],    // phải
                [CX0, CY0, CX0, CY0 + edge, CX0, CY0, CX1 - CX0, edge],           // trên
                [CX0, CY1, CX0, CY1 - edge, CX0, CY1 - edge, CX1 - CX0, edge]     // dưới
            ];
            for (const [gx0, gy0, gx1, gy1, rx, ry, rw, rh] of sides) {
                const sg = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
                sg.addColorStop(0, 'rgba(4,48,20,0.22)');
                sg.addColorStop(1, 'rgba(4,48,20,0)');
                ctx.fillStyle = sg;
                ctx.fillRect(rx, ry, rw, rh);
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
                [LEFT + C_NOSE, TOP, MID_X - S_NOSE, TOP, 0, -1, C_FACE, S_FACE],
                [MID_X + S_NOSE, TOP, RIGHT - C_NOSE, TOP, 0, -1, S_FACE, C_FACE],
                // Băng dưới
                [MID_X - S_NOSE, BOTTOM, LEFT + C_NOSE, BOTTOM, 0, 1, S_FACE, C_FACE],
                [RIGHT - C_NOSE, BOTTOM, MID_X + S_NOSE, BOTTOM, 0, 1, C_FACE, S_FACE],
                // Băng trái & phải (không có lỗ giữa)
                [LEFT, BOTTOM - C_NOSE, LEFT, TOP + C_NOSE, -1, 0, C_FACE, C_FACE],
                [RIGHT, TOP + C_NOSE, RIGHT, BOTTOM - C_NOSE, 1, 0, C_FACE, C_FACE]
            ];

            for (const [x1, y1, x2, y2, nx, ny, cut1, cut2] of segs) {
                const len = Math.hypot(x2 - x1, y2 - y1);
                const ux = (x2 - x1) / len, uy = (y2 - y1) / len;   // dọc theo băng
                // Mặt vát: chân băng LÙI RA XA lỗ so với mũi băng, nên hàm lỗ loe rộng
                // dần về phía sau — đúng chiều mở của "jaw" trên bàn thật.
                const bx1 = x1 + nx * CUSH + ux * cut1, by1 = y1 + ny * CUSH + uy * cut1;
                const bx2 = x2 + nx * CUSH - ux * cut2, by2 = y2 + ny * CUSH - uy * cut2;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(bx2, by2);
                ctx.lineTo(bx1, by1);
                ctx.closePath();

                const g = ctx.createLinearGradient(x1, y1, x1 + nx * CUSH, y1 + ny * CUSH);
                g.addColorStop(0, '#3ac763');      // mũi băng hứng sáng
                g.addColorStop(0.22, '#2aad50');
                g.addColorStop(1, '#127a34');      // chân băng chìm trong bóng
                ctx.fillStyle = g;
                ctx.fill();

                // Gờ sáng ngay trên mũi băng
                ctx.strokeStyle = 'rgba(255,255,255,0.28)';
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

        /* --- Lỗ bi ---
           Dựng theo đúng cách bàn thật (và các game bi-a nhìn từ trên xuống): hai đầu
           băng được CẮT VÁT (facing) để mở hàm lỗ — lỗ góc cắt 142°, lỗ giữa cắt 104° —
           còn miệng lỗ là một hốc TRÒN nằm ngay sau hàm băng, khoét lấn cả vào khung gỗ
           và được bọc một vành da sáng màu. Phần mặt bàn quanh lỗ bị khoét đi để lộ gỗ. */

        // Tâm và bán kính hốc tròn của lỗ thứ i
        pocketHole(i) {
            const p = POCKETS[i];
            if (i === 1 || i === 4) {
                const sy = p.y < MID_Y ? -1 : 1;
                return { x: MID_X, y: (p.y < MID_Y ? TOP : BOTTOM) + sy * S_OFF, r: S_HOLE };
            }
            const sx = p.x < MID_X ? -1 : 1, sy = p.y < MID_Y ? -1 : 1;
            return { x: p.x + sx * C_OFF, y: p.y + sy * C_OFF, r: C_HOLE };
        },

        // Nền quanh lỗ: phần nỉ trong hàm lỗ bị khoét đi để lộ gỗ. Vẽ sau nỉ, trước băng.
        // Chỉ cần phủ đúng dải rộng bằng bề dày băng — ra ngoài nữa đã là khung gỗ sẵn.
        drawPocketBeds(ctx) {
            const W = CUSH;
            for (let i = 0; i < POCKETS.length; i++) {
                const p = POCKETS[i];
                ctx.save();
                ctx.beginPath();
                if (i === 1 || i === 4) {
                    const sy = p.y < MID_Y ? -1 : 1;
                    const y0 = p.y < MID_Y ? TOP : BOTTOM, w = S_NOSE + S_FACE;
                    ctx.moveTo(MID_X - S_NOSE, y0);
                    ctx.lineTo(MID_X + S_NOSE, y0);
                    ctx.lineTo(MID_X + w, y0 + sy * W);
                    ctx.lineTo(MID_X - w, y0 + sy * W);
                } else {
                    const sx = p.x < MID_X ? -1 : 1, sy = p.y < MID_Y ? -1 : 1;
                    ctx.moveTo(p.x - sx * C_NOSE, p.y);                 // mũi băng ngang
                    ctx.lineTo(p.x, p.y - sy * C_NOSE);                 // mũi băng dọc
                    ctx.lineTo(p.x + sx * W, p.y - sy * C_NOSE);
                    ctx.lineTo(p.x + sx * W, p.y + sy * W);
                    ctx.lineTo(p.x - sx * C_NOSE, p.y + sy * W);
                }
                ctx.closePath();
                const h = this.pocketHole(i);
                const g = ctx.createRadialGradient(h.x, h.y, h.r * 0.5, h.x, h.y, h.r * 2.6);
                g.addColorStop(0, '#7a4c21');
                g.addColorStop(0.55, '#5a3416');
                g.addColorStop(1, '#43250f');
                ctx.fillStyle = g;
                ctx.fill();
                ctx.restore();
            }
        },

        // Miệng lỗ — vẽ sau cùng nên đè lên cả nỉ, băng lẫn khung gỗ
        drawPockets(ctx) {
            for (let i = 0; i < POCKETS.length; i++) {
                const h = this.pocketHole(i), flash = this.pocketFlash[i];
                ctx.save();

                // Vành gỗ sáng ôm quanh miệng lỗ (chi tiết trang trí trên khung bàn)
                const rim = ctx.createRadialGradient(h.x - 3, h.y - 4, h.r, h.x, h.y, h.r + 9);
                rim.addColorStop(0, '#c79a5e');
                rim.addColorStop(0.55, '#8d5f2e');
                rim.addColorStop(1, 'rgba(58,31,12,0)');
                ctx.fillStyle = rim;
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.r + 9, 0, Math.PI * 2);
                ctx.fill();

                // Vành da bọc miệng lỗ
                ctx.strokeStyle = '#2a1b0d';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.r + 1.5, 0, Math.PI * 2);
                ctx.stroke();

                // Lòng lỗ hun hút
                const hole = ctx.createRadialGradient(h.x - h.r * 0.25, h.y - h.r * 0.3, 1, h.x, h.y, h.r);
                hole.addColorStop(0, '#000000');
                hole.addColorStop(0.55, '#070505');
                hole.addColorStop(0.88, '#17110c');
                hole.addColorStop(1, '#33251a');
                ctx.fillStyle = hole;
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
                ctx.fill();

                // Ánh sáng hắt vào thành lỗ phía trên
                ctx.strokeStyle = 'rgba(255,230,190,0.22)';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.r - 1, Math.PI * 1.08, Math.PI * 1.92);
                ctx.stroke();

                if (flash > 0) {
                    ctx.strokeStyle = `rgba(255,215,0,${flash})`;
                    ctx.lineWidth = 4;
                    ctx.shadowColor = 'rgba(255,215,0,0.9)';
                    ctx.shadowBlur = 26 * flash;
                    ctx.beginPath();
                    ctx.arc(h.x, h.y, h.r + 4, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }
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
            drawBallNumber(ctx, b.ori, b.num, r);
            ctx.restore();
        },

        /* Mũi tên mảnh, đầu nhọn có đuôi lõm — trông sắc nét hơn hai gạch chéo.
           (ex, ey) là mũi nhọn, (ux, uy) là hướng bay. */
        arrowHead(ctx, ex, ey, ux, uy, len = 13, half = 5.5) {
            const px = -uy, py = ux;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex - ux * len + px * half, ey - uy * len + py * half);
            ctx.lineTo(ex - ux * len * 0.68, ey - uy * len * 0.68);
            ctx.lineTo(ex - ux * len - px * half, ey - uy * len - py * half);
            ctx.closePath();
            ctx.fill();
        },

        // Đường dự đoán: một nét mảnh nằm trên một quầng sáng mờ cùng màu
        guideLine(ctx, x1, y1, x2, y2, rgb, a0, a1, width = 2, dash = null) {
            const g = ctx.createLinearGradient(x1, y1, x2, y2);
            g.addColorStop(0, `rgba(${rgb},${a0})`);
            g.addColorStop(1, `rgba(${rgb},${a1})`);
            ctx.save();
            if (dash) ctx.setLineDash(dash);
            ctx.strokeStyle = `rgba(${rgb},0.16)`;
            ctx.lineWidth = width + 4;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.strokeStyle = g;
            ctx.lineWidth = width;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.restore();
        },

        drawAim(ctx) {
            if (this.cue.potted) return;
            const pr = this.predict();
            const cx = this.cue.x, cy = this.cue.y;
            const d = pr.dir;
            const WHITE = '255,255,255', AMBER = '255,206,74', CYAN = '124,214,255';

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // --- Đường ngắm: từ mép bi cái tới sát bi ma, nhạt dần về phía trước ---
            const sx = cx + d.x * R, sy = cy + d.y * R;
            const ex = pr.hit ? pr.gx - d.x * R : pr.gx;
            const ey = pr.hit ? pr.gy - d.y * R : pr.gy;
            this.guideLine(ctx, sx, sy, ex, ey, WHITE, 0.85, 0.4, 2);

            if (this.helpMode) {
                if (pr.hit) {
                    // Bi ma tại điểm chạm: viền mảnh + ruột mờ, có tâm ngắm
                    ctx.fillStyle = `rgba(${WHITE},0.10)`;
                    ctx.beginPath(); ctx.arc(pr.gx, pr.gy, R, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = `rgba(${WHITE},0.9)`;
                    ctx.lineWidth = 1.4;
                    ctx.setLineDash([4, 3.5]);
                    ctx.beginPath(); ctx.arc(pr.gx, pr.gy, R, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = `rgba(${WHITE},0.75)`;
                    ctx.beginPath(); ctx.arc(pr.gx, pr.gy, 1.8, 0, Math.PI * 2); ctx.fill();

                    // Hướng bi mục tiêu sẽ chạy — bắt đầu từ mép bi cho khỏi đè lên số
                    const L = 104;
                    const ax = pr.ball.x + pr.ox * R, ay = pr.ball.y + pr.oy * R;
                    const bx = pr.ball.x + pr.ox * L, by = pr.ball.y + pr.oy * L;
                    this.guideLine(ctx, ax, ay, bx, by, AMBER, 0.95, 0.55, 2.4);
                    ctx.fillStyle = `rgba(${AMBER},0.9)`;
                    this.arrowHead(ctx, bx, by, pr.ox, pr.oy);

                    // Đường tiếp tuyến: hướng bi CÁI trôi đi sau khi chạm.
                    // Đây là thành phần vận tốc vuông góc với đường tâm — càng cắt mỏng
                    // thì bi cái càng đi xa theo hướng này, nên độ dài tỉ lệ với độ cắt.
                    const dn = d.x * pr.ox + d.y * pr.oy;
                    let tx = d.x - dn * pr.ox, ty = d.y - dn * pr.oy;
                    const tl = Math.hypot(tx, ty);
                    if (tl > 0.06) {
                        tx /= tl; ty /= tl;
                        const TL = 26 + 74 * tl;
                        const ex2 = pr.gx + tx * TL, ey2 = pr.gy + ty * TL;
                        this.guideLine(ctx, pr.gx + tx * R, pr.gy + ty * R, ex2, ey2,
                            CYAN, 0.8, 0.3, 1.8, [6, 5]);
                        ctx.fillStyle = `rgba(${CYAN},0.75)`;
                        this.arrowHead(ctx, ex2, ey2, tx, ty, 10, 4.2);
                    }
                } else {
                    // Không chạm bi nào: đánh dấu chỗ ăn băng và hướng dội ra
                    let rx = d.x, ry = d.y;
                    if (pr.gx < LEFT + R + 0.5 || pr.gx > RIGHT - R - 0.5) rx = -rx;
                    if (pr.gy < TOP + R + 0.5 || pr.gy > BOTTOM - R - 0.5) ry = -ry;
                    ctx.strokeStyle = `rgba(${WHITE},0.55)`;
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    ctx.arc(pr.gx, pr.gy, R * 0.62, 0, Math.PI * 2);
                    ctx.stroke();
                    const RL = 78;
                    this.guideLine(ctx, pr.gx + rx * R * 0.62, pr.gy + ry * R * 0.62,
                        pr.gx + rx * RL, pr.gy + ry * RL, CYAN, 0.6, 0.16, 1.8, [6, 5]);
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
                ctx.strokeStyle = PLAYERS[this.turn].color;
                ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.roundRect(bxx - 3, byy - 3, barW + 6, barH + 6, 9); ctx.stroke();
                ctx.restore();
            }
        },

        // Gậy cơ thật: thon dần từ chuôi ra đầu, đủ đầu da, đai ngà,
        // khớp nối đồng, thân gỗ trắc và phần quấn cán.
        // Kích thước lấy đúng tỉ lệ cơ 58 inch (1,473 m) trên bàn 9 feet:
        // mặt nỉ dài 2,54 m = 1008 px  =>  1 inch ≈ 10,08 px, cả cây cơ ≈ 585 px,
        // tức là dài hơn nửa chiều dài mặt bàn — đúng như nhìn từ trên xuống ngoài đời.
        drawCueStick(ctx, tipX, tipY, ang) {
            const IN = (RIGHT - LEFT) / 100;                 // 1 inch theo toạ độ bàn (mặt nỉ dài 100 inch)
            const SEGS = [
                // [dài (inch), bán kính đầu, bán kính cuối (px), 3 màu tô khối]
                [0.55, 2.50, 2.52, '#7ba9dd', '#3f7fbd', '#22506f'],   // đầu da (đã chuốt lơ), Ø 12,7 mm
                [1.00, 2.52, 2.62, '#fffdf6', '#ece4d0', '#b7ae95'],   // đai ngà
                [27.45, 2.62, 4.10, '#fbeaca', '#e2c48a', '#a67c45'],  // thân ngọn gỗ thích, thon dần
                [0.35, 4.10, 4.20, '#ffeeae', '#c9a53f', '#7d611a'],   // vòng đồng
                [0.60, 4.20, 4.30, '#5a5a62', '#26262b', '#0e0e11'],   // cổ khớp nối
                [12.50, 4.30, 5.50, '#a9603a', '#6b3720', '#341a0e'],  // thân gỗ trắc
                [11.00, 5.50, 5.80, '#5c5c66', '#2e2e35', '#131317'],  // phần quấn cán
                [4.00, 5.80, 6.10, '#a9603a', '#6b3720', '#341a0e'],   // ống cán
                [0.55, 6.10, 5.70, '#4a4a52', '#1c1c20', '#08080a']    // nắp chuôi cao su, Ø 31 mm
            ].map(([inch, r0, r1, a, b, c]) => [inch * IN, r0, r1, a, b, c]);

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

            // Hoa văn quấn cán
            let wrapStart = 0;
            for (let i = 0; i < 6; i++) wrapStart += SEGS[i][0];
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.10)';
            ctx.lineWidth = 1;
            for (let sgm = 4; sgm < SEGS[6][0]; sgm += 7) {
                const px = tipX + dx * (wrapStart + sgm), py = tipY + dy * (wrapStart + sgm);
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
