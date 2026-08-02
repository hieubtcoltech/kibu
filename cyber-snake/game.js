/* ============================================================================
 * KIBU Games — Cyber Snake, dựng trên Phaser 3
 * ----------------------------------------------------------------------------
 * Vì sao chuyển sang Phaser: bản cũ tự chạy setTimeout rồi vẽ thẳng toạ độ ô,
 * nên con rắn NHẢY từng ô một — đó chính là chỗ "không mượt". Ở đây nhịp logic
 * (bao giờ rắn sang ô mới) tách hẳn khỏi nhịp vẽ (60 khung/giây), và mỗi khung
 * hình thân rắn được nội suy giữa ô cũ và ô mới. Rắn trườn liên tục thay vì
 * giật cục, mà luật chơi vẫn là luật rắn cổ điển trên lưới.
 *
 * Phaser lo giúp: vòng lặp có delta chuẩn, hệ hạt, rung camera, chớp màn hình,
 * co giãn canvas theo khung. Engine nạp từ cdnjs — máy chủ đang không bật gzip
 * cho .js nên tự host sẽ bắt bé tải 1,2 MB thô, còn CDN trả 253 KB đã nén.
 * ==========================================================================*/
(function () {
    'use strict';

    const GRID = 23;                 // lẻ để có đúng một ô chính giữa
    const BOARD = 690;               // cạnh bàn cờ, đơn vị nội bộ của Phaser
    const CELL = BOARD / GRID;
    const MID = (GRID - 1) / 2;      // 11
    const KEY = 'cyberSnakeHighScore';

    const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));

    /* ---------------------------------------------------------------- *
     * 1. Các màn chơi
     * ---------------------------------------------------------------- *
     * Mỗi màn là một bố cục tường thiết kế sẵn chứ không rải ngẫu nhiên: bé
     * nhìn ra hình dạng, nhớ được đường đi, và thấy rõ mình đang tiến bộ.
     * need = số lõi phải ăn để qua màn; wrap = mép bàn thông sang bên kia.
     */
    function rect(x0, y0, x1, y1) {
        const out = [];
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push({ x: x, y: y });
        return out;
    }
    function block(cx, cy, s) { return rect(cx - s, cy - s, cx + s, cy + s); }

    const STAGES = [
        {
            vi: 'KHỞI ĐỘNG', en: 'BOOT UP', tint: 0x00e5ff, need: 5, step: 155, wrap: false,
            walls: function () { return []; }
        },
        {
            vi: 'BỐN TRỤ', en: 'FOUR PILLARS', tint: 0x39ff14, need: 6, step: 146, wrap: false,
            walls: function () {
                return [].concat(block(6, 6, 1), block(GRID - 7, 6, 1),
                    block(6, GRID - 7, 1), block(GRID - 7, GRID - 7, 1));
            }
        },
        {
            vi: 'THẬP TỰ', en: 'THE CROSS', tint: 0xffd700, need: 7, step: 138, wrap: false,
            walls: function () {
                return [].concat(
                    rect(MID, 4, MID, MID - 3), rect(MID, MID + 3, MID, GRID - 5),
                    rect(4, MID, MID - 3, MID), rect(MID + 3, MID, GRID - 5, MID));
            }
        },
        {
            /* Mép thông hai bên: đi thẳng ra rìa là hiện lại ở rìa đối diện,
               đổi hẳn cách nghĩ đường đi so với các màn có tường chết. */
            vi: 'CỔNG DỊCH CHUYỂN', en: 'PORTAL GRID', tint: 0xff00ff, need: 8, step: 132, wrap: true,
            walls: function () {
                return [].concat(rect(MID - 4, MID, MID + 4, MID), rect(MID, MID - 4, MID, MID + 4));
            }
        },
        {
            vi: 'HÀNH LANG', en: 'CORRIDORS', tint: 0xff9e5c, need: 9, step: 126, wrap: false,
            walls: function () {
                return [].concat(rect(6, 1, 6, GRID - 8), rect(11, 7, 11, GRID - 2),
                    rect(16, 1, 16, GRID - 8));
            }
        },
        {
            vi: 'MÊ CUNG', en: 'THE MAZE', tint: 0xa855f7, need: 10, step: 118, wrap: false,
            walls: function () {
                const out = [];
                for (let gx = 4; gx <= GRID - 5; gx += 5)
                    for (let gy = 4; gy <= GRID - 5; gy += 5) out.push.apply(out, block(gx, gy, 1));
                return out;
            }
        },
        {
            vi: 'ĐẤU TRƯỜNG', en: 'THE ARENA', tint: 0x00ffb3, need: 11, step: 110, wrap: true,
            walls: function () {
                const out = [], seen = {}, r = 7;
                for (let a = 0; a < 360; a += 2) {
                    const x = Math.round(MID + Math.cos(a * Math.PI / 180) * r);
                    const y = Math.round(MID + Math.sin(a * Math.PI / 180) * r);
                    /* Bốn cửa ở bốn hướng chính — bịt kín thì vào được là kẹt
                       luôn bên trong, không có đường ra. */
                    if (Math.abs(x - MID) < 2 || Math.abs(y - MID) < 2) continue;
                    const k = x + ',' + y;
                    if (!seen[k]) { seen[k] = 1; out.push({ x: x, y: y }); }
                }
                return out;
            }
        },
        {
            vi: 'LÕI NGUY HIỂM', en: 'DANGER CORE', tint: 0xff2d55, need: 12, step: 100, wrap: false,
            walls: function () {
                return [].concat(
                    block(MID, MID, 2),
                    rect(3, 3, 5, 3), rect(3, 4, 3, 5),
                    rect(GRID - 6, 3, GRID - 4, 3), rect(GRID - 4, 4, GRID - 4, 5),
                    rect(3, GRID - 4, 5, GRID - 4), rect(3, GRID - 6, 3, GRID - 5),
                    rect(GRID - 6, GRID - 4, GRID - 4, GRID - 4), rect(GRID - 4, GRID - 6, GRID - 4, GRID - 5));
            }
        }
    ];

    /* Loại lõi ăn được. w = trọng số bốc ngẫu nhiên. */
    const CORES = {
        NANO: { color: 0x39ff14, pts: 100, w: 62, grow: 1 },
        OVERDRIVE: { color: 0xffd700, pts: 150, w: 12, grow: 1, power: 'OVERDRIVE' },
        CRYO: { color: 0x00e5ff, pts: 120, w: 12, grow: 1, power: 'CRYO' },
        EMP: { color: 0xff2d55, pts: 80, w: 8, grow: -2 },
        GLITCH: { color: 0xc77dff, pts: 500, w: 6, grow: 1 }
    };
    const CORE_KEYS = Object.keys(CORES);
    const POWER_MS = 5200;

    /* ---------------------------------------------------------------- *
     * 2. Âm thanh — tổng hợp bằng WebAudio, không tải tệp
     * ---------------------------------------------------------------- */
    const Sfx = {
        on: true, ac: null,
        ctx: function () {
            if (!this.ac) {
                try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); }
                catch (e) { return null; }
            }
            if (this.ac.state === 'suspended') this.ac.resume();
            return this.ac;
        },
        tone: function (f, d, type, vol, slide) {
            if (!this.on) return;
            const ac = this.ctx(); if (!ac) return;
            const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
            o.type = type || 'square';
            o.frequency.setValueAtTime(f, t);
            if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + d);
            o.connect(g); g.connect(ac.destination);
            o.start(t); o.stop(t + d + 0.02);
        },
        eat: function (type) {
            const self = this;
            if (type === 'GLITCH') { [660, 880, 1320].forEach(function (f, i) { setTimeout(function () { self.tone(f, 0.12, 'square', 0.09); }, i * 60); }); return; }
            if (type === 'EMP') { this.tone(180, 0.18, 'sawtooth', 0.08, 90); return; }
            this.tone(type === 'OVERDRIVE' ? 880 : 620, 0.09, 'square', 0.07, type === 'CRYO' ? 420 : 940);
        },
        turn: function () { this.tone(300, 0.03, 'square', 0.022); },
        stage: function () { const s = this; [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.22, 'triangle', 0.1); }, i * 90); }); },
        die: function () { const s = this; [420, 330, 240, 160].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.3, 'sawtooth', 0.09, f * 0.6); }, i * 120); }); }
    };

    /* ---------------------------------------------------------------- *
     * 3. Scene chính
     * ---------------------------------------------------------------- */
    class GameScene extends Phaser.Scene {
        constructor() { super('game'); }

        create() {
            /* Chấm trắng 12px làm hạt — vẽ bằng Graphics rồi nướng thành
               texture, khỏi phải tải tệp ảnh nào. */
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1).fillCircle(6, 6, 6);
            g.generateTexture('dot', 12, 12);
            g.destroy();

            this.gGrid = this.add.graphics();
            this.gWall = this.add.graphics();
            this.gFood = this.add.graphics();
            this.gSnake = this.add.graphics();

            this.emitter = this.add.particles(0, 0, 'dot', {
                lifespan: 620, speed: { min: 40, max: 200 }, scale: { start: 0.6, end: 0 },
                alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false
            });

            this.input.keyboard.on('keydown', this.onKey, this);
            this.wireSwipe();
            this.reset();
        }

        reset() {
            this.score = 0;
            this.combo = 0;
            this.lastEatAt = -9999;
            this.dead = false;
            this.power = null;
            this.powerUntil = 0;
            this.loops = 0;
            this.loadStage(0, true);
            UI.hideBanner();
            UI.power(null);
            UI.sync(this);
        }

        loadStage(i, fresh) {
            this.stageIdx = i;
            this.stage = STAGES[i % STAGES.length];
            this.eaten = 0;
            let walls = this.stage.walls();

            if (fresh) {
                /* Ván mới: rắn xuất phát ở hàng giữa, sát mép trái, hướng sang
                   phải — vùng này được mọi bố cục tường chừa trống. */
                this.snake = [{ x: 3, y: MID }, { x: 2, y: MID }, { x: 1, y: MID }];
                this.dir = { x: 1, y: 0 };
            } else {
                /* Qua màn thì GIỮ NGUYÊN con rắn đang có — cả vị trí lẫn chiều
                   dài. Cho rắn ngắn lại về 3 đốt mỗi màn thì mất sạch cái căng
                   thẳng cốt lõi của trò này: thân càng dài, chỗ xoay càng hẹp.
                   Đổi lại phải dọn tường ở chỗ rắn đang nằm và ở mấy ô ngay
                   trước mũi, nếu không bé chết oan ngay giây đầu của màn mới. */
                const block = {};
                for (const s of this.snake) block[s.x + ',' + s.y] = 1;
                const h = this.snake[0];
                for (let k = 1; k <= 4; k++) {
                    let nx = h.x + this.dir.x * k, ny = h.y + this.dir.y * k;
                    if (this.stage.wrap) { nx = (nx + GRID) % GRID; ny = (ny + GRID) % GRID; }
                    block[nx + ',' + ny] = 1;
                }
                walls = walls.filter(function (w) { return !block[w.x + ',' + w.y]; });
            }

            this.walls = walls;
            this.wallSet = {};
            for (const w of this.walls) this.wallSet[w.x + ',' + w.y] = 1;

            this.prev = this.snake.map(function (s) { return { x: s.x, y: s.y }; });
            this.queue = [];
            this.acc = 0;
            this.spawnFood();
            this.drawWalls();

            if (!fresh) { Sfx.stage(); UI.banner(this.stage, this.stageIdx + 1); }
            UI.sync(this);
        }

        stepMs() {
            let ms = Math.max(62, this.stage.step - this.loops * 9);
            if (this.power === 'OVERDRIVE') ms *= 0.66;
            else if (this.power === 'CRYO') ms *= 1.55;
            return ms;
        }

        /* ---------- Nhập liệu ---------- */
        onKey(e) {
            const m = {
                ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
                ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0]
            }[e.code];
            if (!m) return;
            if (e.preventDefault) e.preventDefault();
            this.turn(m[0], m[1]);
        }

        /* Hàng đợi tối đa 2 lệnh: bé bấm nhanh hai phím liền (lên rồi trái) thì
           cả hai đều được thực hiện ở hai bước kế tiếp, thay vì lệnh sau đè mất
           lệnh trước — đây là chỗ khiến rắn có vẻ "không nghe lời". */
        turn(dx, dy) {
            if (this.dead) return;
            const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
            if (last.x === -dx && last.y === -dy) return;    // cấm quay ngoắt 180°
            if (last.x === dx && last.y === dy) return;
            if (this.queue.length < 2) { this.queue.push({ x: dx, y: dy }); Sfx.turn(); }
        }

        wireSwipe() {
            const el = this.game.canvas, self = this;
            let sx = 0, sy = 0;
            el.addEventListener('touchstart', function (e) {
                sx = e.touches[0].clientX; sy = e.touches[0].clientY;
            }, { passive: true });
            el.addEventListener('touchend', function (e) {
                const t = e.changedTouches[0];
                const dx = t.clientX - sx, dy = t.clientY - sy;
                if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return;
                if (Math.abs(dx) > Math.abs(dy)) self.turn(dx > 0 ? 1 : -1, 0);
                else self.turn(0, dy > 0 ? 1 : -1);
            }, { passive: true });
        }

        /* ---------- Một bước logic ---------- */
        step() {
            if (this.queue.length) this.dir = this.queue.shift();

            this.prev = this.snake.map(function (s) { return { x: s.x, y: s.y }; });
            let hx = this.snake[0].x + this.dir.x;
            let hy = this.snake[0].y + this.dir.y;

            if (this.stage.wrap) {
                hx = (hx + GRID) % GRID;
                hy = (hy + GRID) % GRID;
            } else if (hx < 0 || hy < 0 || hx >= GRID || hy >= GRID) {
                return this.die();
            }
            if (this.wallSet[hx + ',' + hy]) return this.die();
            /* Đốt đuôi cuối sẽ rời đi ngay bước này nên đâm vào đó không chết —
               đúng như rắn cổ điển, nếu không thì đi sát đuôi là chết oan. */
            for (let i = 0; i < this.snake.length - 1; i++) {
                if (this.snake[i].x === hx && this.snake[i].y === hy) return this.die();
            }

            this.snake.unshift({ x: hx, y: hy });
            if (hx === this.food.x && hy === this.food.y) this.eat();
            else this.snake.pop();

            if (this.power && this.time.now > this.powerUntil) { this.power = null; UI.power(null); }
        }

        eat() {
            const core = CORES[this.food.type];
            const now = this.time.now;

            /* Chuỗi ăn nhanh: ăn tiếp trong 3 giây thì hệ số nhân tăng dần, tối
               đa x5 — thưởng cho bé dám đi đường tắt thay vì bò an toàn. */
            this.combo = (now - this.lastEatAt < 3000) ? Math.min(5, this.combo + 1) : 1;
            this.lastEatAt = now;

            const mult = this.combo * (this.power === 'OVERDRIVE' ? 2 : 1);
            this.score += core.pts * mult;
            this.eaten++;

            if (core.grow < 0) {
                for (let i = 0; i < -core.grow && this.snake.length > 4; i++) this.snake.pop();
            }

            if (core.power) { this.power = core.power; this.powerUntil = now + POWER_MS; UI.power(core.power); }

            const p = this.cell(this.food.x, this.food.y);
            this.emitter.setParticleTint(core.color);
            this.emitter.emitParticleAt(p.x, p.y, 18);
            this.cameras.main.flash(90, (core.color >> 16) & 255, (core.color >> 8) & 255, core.color & 255, false);
            Sfx.eat(this.food.type);
            if (this.combo >= 2) UI.combo(this.combo);

            if (this.eaten >= this.stage.need) {
                const next = this.stageIdx + 1;
                if (next % STAGES.length === 0) this.loops++;
                this.loadStage(next);
            } else {
                this.spawnFood();
            }
            UI.sync(this);
        }

        die() {
            if (this.dead) return;
            this.dead = true;
            this.cameras.main.shake(320, 0.016);
            this.emitter.setParticleTint(0xff2d55);
            const h = this.cell(this.snake[0].x, this.snake[0].y);
            this.emitter.emitParticleAt(h.x, h.y, 34);
            Sfx.die();
            this.time.delayedCall(640, function () { UI.gameOver(this); }, [], this);
        }

        spawnFood() {
            const free = [];
            for (let x = 0; x < GRID; x++) {
                for (let y = 0; y < GRID; y++) {
                    if (this.wallSet[x + ',' + y]) continue;
                    let on = false;
                    for (const s of this.snake) if (s.x === x && s.y === y) { on = true; break; }
                    if (!on) free.push({ x: x, y: y });
                }
            }
            const spot = free.length ? free[(Math.random() * free.length) | 0] : { x: MID, y: MID };
            let total = 0;
            for (const k of CORE_KEYS) total += CORES[k].w;
            let roll = Math.random() * total, type = 'NANO';
            for (const k of CORE_KEYS) { roll -= CORES[k].w; if (roll <= 0) { type = k; break; } }
            this.food = { x: spot.x, y: spot.y, type: type };
        }

        cell(cx, cy) { return { x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 }; }

        /* ---------- Vòng lặp ---------- */
        update(time, delta) {
            if (!this.dead) {
                this.acc += delta;
                const ms = this.stepMs();
                let guard = 0;
                while (this.acc >= ms && !this.dead && guard++ < 4) { this.step(); this.acc -= ms; }
            }
            this.render(this.dead ? 1 : clamp(this.acc / this.stepMs(), 0, 1));
            if (this.power) UI.powerTick((this.powerUntil - this.time.now) / POWER_MS);
        }

        /* Nội suy: mỗi đốt được vẽ ở đâu đó GIỮA ô cũ và ô mới. Đây chính là
           thứ biến chuyển động giật cục thành trườn mượt. */
        lerpSeg(i, t) {
            const to = this.snake[i];
            const from = this.prev[Math.min(i, this.prev.length - 1)] || to;
            const dx = to.x - from.x, dy = to.y - from.y;
            /* Ở màn có cổng dịch chuyển, đốt vừa nhảy từ mép này sang mép kia
               nên hiệu số toạ độ vọt lên hơn 1 ô — nội suy thẳng sẽ thành một
               vệt quét ngang cả màn hình. Gặp trường hợp đó thì đặt luôn ở ô
               mới, không nội suy. */
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) return this.cell(to.x, to.y);
            return this.cell(from.x + dx * t, from.y + dy * t);
        }

        render(t) {
            const st = this.stage;

            // lưới nền
            const gg = this.gGrid;
            gg.clear();
            gg.lineStyle(1, st.tint, 0.07);
            for (let i = 0; i <= GRID; i++) {
                gg.lineBetween(i * CELL, 0, i * CELL, BOARD);
                gg.lineBetween(0, i * CELL, BOARD, i * CELL);
            }
            /* Viền mờ và đứt nét khi mép thông — dấu hiệu nhìn là biết màn này
               đi xuyên mép được. */
            gg.lineStyle(3, st.tint, st.wrap ? 0.2 : 0.62);
            /* Bo góc ngay trong canvas thay vì bo góc thẻ canvas bằng CSS:
               bo bằng CSS thì bốn góc của khung vuông vẽ bên trong bị xén cụt.
               Lùi vào 3px để nét vẽ nằm trọn trong canvas, không bị mép cắt. */
            gg.strokeRoundedRect(3, 3, BOARD - 6, BOARD - 6, 12);

            // lõi
            const f = this.gFood;
            f.clear();
            const core = CORES[this.food.type];
            const c = this.cell(this.food.x, this.food.y);
            const pulse = 1 + Math.sin(this.time.now / 160) * 0.14;
            f.fillStyle(core.color, 0.16).fillCircle(c.x, c.y, CELL * 0.85 * pulse);
            f.fillStyle(core.color, 0.40).fillCircle(c.x, c.y, CELL * 0.56 * pulse);
            f.fillStyle(core.color, 1).fillCircle(c.x, c.y, CELL * 0.30 * pulse);
            f.fillStyle(0xffffff, 0.85).fillCircle(c.x - CELL * 0.08, c.y - CELL * 0.09, CELL * 0.09);

            // thân rắn
            const s = this.gSnake;
            s.clear();
            const pts = [];
            for (let i = 0; i < this.snake.length; i++) pts.push(this.lerpSeg(i, t));

            const body = this.power === 'CRYO' ? 0x00e5ff
                : (this.power === 'OVERDRIVE' ? 0xffd700 : st.tint);

            /* Ba lớp chồng lên nhau: quầng sáng mờ, thân chính, rồi lõi trắng ở
               giữa — cho ra vẻ phát quang mà không cần bộ lọc nào. */
            const layers = [[CELL * 1.04, 0.12, body], [CELL * 0.80, 1, body], [CELL * 0.34, 0.9, 0xffffff]];
            for (const L of layers) {
                const w = L[0], a = L[1], col = L[2];
                s.lineStyle(w, col, a);
                for (let i = 1; i < pts.length; i++) {
                    const A = pts[i - 1], B = pts[i];
                    if (Math.abs(A.x - B.x) > CELL * 1.6 || Math.abs(A.y - B.y) > CELL * 1.6) continue;
                    s.lineBetween(A.x, A.y, B.x, B.y);
                }
                /* Chấm tròn ở mỗi khớp để chỗ rẽ không bị khuyết góc */
                s.fillStyle(col, a);
                for (const p of pts) s.fillCircle(p.x, p.y, w / 2);
            }

            // đầu rắn + hai mắt nhìn theo hướng đi
            const h = pts[0];
            s.fillStyle(body, 1).fillCircle(h.x, h.y, CELL * 0.48);
            const ex = -this.dir.y * CELL * 0.19, ey = this.dir.x * CELL * 0.19;
            const fx = this.dir.x * CELL * 0.16, fy = this.dir.y * CELL * 0.16;
            s.fillStyle(0x05070f, 1);
            s.fillCircle(h.x + fx + ex, h.y + fy + ey, CELL * 0.115);
            s.fillCircle(h.x + fx - ex, h.y + fy - ey, CELL * 0.115);
        }

        drawWalls() {
            const w = this.gWall;
            w.clear();
            for (const p of this.walls) {
                const x = p.x * CELL, y = p.y * CELL;
                w.fillStyle(this.stage.tint, 0.16).fillRoundedRect(x + 1, y + 1, CELL - 2, CELL - 2, 4);
                w.lineStyle(2, this.stage.tint, 0.75).strokeRoundedRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3, 4);
            }
        }
    }

    /* ---------------------------------------------------------------- *
     * 4. Cầu nối sang giao diện HTML
     * ---------------------------------------------------------------- *
     * Menu, bảng điểm, màn kết thúc vẫn là HTML như cũ — chúng đã có sẵn kiểu
     * dáng và đi qua bộ dịch chung của site, nên không có lý do vẽ lại bằng
     * canvas rồi phải tự dịch lấy.
     */
    const $ = function (id) { return document.getElementById(id); };
    const vn = function () { return window.KibuI18n && window.KibuI18n.lang === 'vi'; };

    const UI = {
        high: 0,
        init: function () {
            try { this.high = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { this.high = 0; }
            $('high-score-val').innerText = this.high;
        },
        sync: function (sc) {
            $('score-val').innerText = sc.score;
            $('level-val').innerText = sc.stageIdx + 1;
            $('size-val').innerText = sc.snake.length;
            const nm = $('stage-name');
            if (nm) nm.innerText = vn() ? sc.stage.vi : sc.stage.en;
            const pr = $('stage-progress');
            if (pr) pr.innerText = sc.eaten + '/' + sc.stage.need;
        },
        power: function (kind) {
            const bar = $('powerup-bar-container');
            if (!kind) { bar.classList.add('hidden'); return; }
            bar.classList.remove('hidden');
            $('powerup-label').innerText = kind === 'OVERDRIVE'
                ? 'OVERDRIVE: double points and double speed'
                : 'CRYO CORE: everything slows down';
            $('powerup-progress-fill').style.background = kind === 'CRYO' ? 'var(--neon-blue)' : 'var(--neon-yellow)';
        },
        powerTick: function (frac) {
            const f = clamp(frac, 0, 1);
            $('powerup-timer').innerText = (f * POWER_MS / 1000).toFixed(1) + 's';
            $('powerup-progress-fill').style.width = (f * 100) + '%';
        },
        banner: function (st, n) {
            const b = $('stage-banner');
            if (!b) return;
            b.querySelector('.sb-num').innerText = (vn() ? 'MÀN ' : 'STAGE ') + n;
            b.querySelector('.sb-name').innerText = vn() ? st.vi : st.en;
            b.classList.remove('hidden');
            clearTimeout(this._bt);
            this._bt = setTimeout(function () { UI.hideBanner(); }, 1700);
        },
        hideBanner: function () {
            const b = $('stage-banner');
            if (b) b.classList.add('hidden');
        },
        combo: function (n) {
            const c = $('combo-badge');
            if (!c) return;
            c.innerText = 'COMBO x' + n;
            c.classList.remove('hidden');
            c.classList.remove('pop');
            void c.offsetWidth;              // ép trình duyệt chạy lại animation
            c.classList.add('pop');
            clearTimeout(this._ct);
            this._ct = setTimeout(function () { c.classList.add('hidden'); }, 1200);
        },
        gameOver: function (sc) {
            $('final-score').innerText = sc.score;
            $('final-level').innerText = sc.stageIdx + 1;
            const isNew = sc.score > this.high;
            if (isNew) {
                this.high = sc.score;
                try { localStorage.setItem(KEY, String(sc.score)); } catch (e) { /* chế độ riêng tư */ }
                $('high-score-val').innerText = this.high;
            }
            $('new-high-badge').classList.toggle('hidden', !isNew);
            $('gameover-overlay').classList.remove('hidden');
            $('powerup-bar-container').classList.add('hidden');
            UI.hideBanner();
        }
    };

    /* ---------------------------------------------------------------- *
     * 5. Khởi động
     * ---------------------------------------------------------------- */
    let game = null;

    function launch() {
        $('menu-overlay').classList.add('hidden');
        $('gameover-overlay').classList.add('hidden');
        $('hud').classList.remove('hidden');
        Sfx.ctx();

        if (!game) {
            game = new Phaser.Game({
                type: Phaser.AUTO,
                parent: 'game-canvas',
                width: BOARD, height: BOARD,
                backgroundColor: '#05070f',
                /* KHÔNG dùng autoCenter của Phaser: nó tự đặt lề cho canvas theo
                   kích thước khung mà nó đo được, trong khi .board-host đã là
                   flex căn giữa rồi — hai cơ chế cùng căn thì lệch nhau. Để
                   một mình CSS lo việc căn. */
                scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
                scene: [GameScene],
                banner: false
            });
        } else {
            const sc = game.scene.getScene('game');
            if (sc) sc.reset();
        }
    }

    /* Cổng gỡ lỗi, chỉ mở khi địa chỉ có ?debug=1 — dùng để kiểm thử tự động
       và để soi trạng thái khi có báo lỗi. Người chơi bình thường không bao
       giờ chạm tới, và nó không phơi gì cho phép gian lận điểm. */
    function exposeDebug() {
        if (!/[?&]debug=1/.test(location.search)) return;
        window.__cs = {
            get scene() { return game && game.scene ? game.scene.getScene('game') : null; },
            get state() {
                const s = this.scene;
                if (!s) return null;
                return {
                    score: s.score, stage: s.stageIdx + 1, eaten: s.eaten, need: s.stage.need,
                    len: s.snake.length, dead: s.dead, food: s.food,
                    head: s.snake[0], dir: s.dir, wrap: s.stage.wrap,
                    snake: s.snake, walls: Object.keys(s.wallSet), grid: GRID
                };
            },
            /* Toạ độ đầu rắn ĐÃ NỘI SUY (đơn vị ô, có phần thập phân) — dùng để
               chứng minh rắn trườn liên tục chứ không nhảy từng ô. */
            get headPx() {
                const s = this.scene;
                if (!s || s.dead) return null;
                const p = s.lerpSeg(0, clamp(s.acc / s.stepMs(), 0, 1));
                return { x: p.x / CELL, y: p.y / CELL };
            }
        };
    }

    function boot() {
        UI.init();
        exposeDebug();
        $('btn-start').addEventListener('click', launch);
        $('btn-retry').addEventListener('click', launch);
        $('btn-menu').addEventListener('click', function () {
            $('gameover-overlay').classList.add('hidden');
            $('hud').classList.add('hidden');
            $('menu-overlay').classList.remove('hidden');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
}());
