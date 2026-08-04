/**
 * THÁP KHỐI (Block Tower) — KIBU Games
 * ----------------------------------------------------------------------------
 * Xếp hình dựng nghiêng 2.5D. Cái giếng lơ lửng giữa phòng khách, đổ bóng
 * xuống sàn. Mỗi ô là một khối lập phương thật — gạch nung, đá xám, gỗ, kim
 * loại, và thỉnh thoảng một quân toàn khối VÀNG đáng gấp ba điểm.
 *
 * Ba tệp, ba việc:
 *   rules.js  cái giếng, bảy quân, phép xoay, ăn hàng, tốc độ — không biết gì
 *             về Phaser, nên node chạy thẳng được và máy soát chơi được hàng
 *             vạn quân trước khi ai vẽ một nét nào
 *   art.js    khối lập phương, năm chất liệu, bốn căn phòng
 *   game.js   tệp này: cảnh Phaser, ngón tay, bàn phím, luồng ván chơi
 *
 * ĐIỀU KHIỂN — phải chạm được bằng ngón tay trước đã
 * Trẻ con chơi bằng điện thoại nhiều hơn bàn phím. Nên: chạm nửa trái/phải để
 * đẩy ngang, chạm giữa để xoay, vuốt xuống để thả nhanh. Bàn phím vẫn đủ mũi
 * tên cho ai ngồi máy tính.
 */
(function () {
    'use strict';

    var A = window.TowerArt;
    var R = window.TowerRules;

    /* ========================================================================
     *  1. CẤU HÌNH
     * ======================================================================*/

    var W = 900, H = 1000;          // khổ thế giới, tính lại theo khung thật
    var CELL = 44;                  // cạnh một ô, tính lại khi dựng giếng
    var OX = 0, OY = 0;             // góc trên-trái của giếng trên màn

    var LOCK_GRACE = 0.45;          // giây ân huệ khi quân đã chạm đáy
    var SOFT_MUL = 12;              // giữ nút xuống thì rơi nhanh gấp bấy nhiêu

    /* ========================================================================
     *  2. TIẾN TRÌNH
     * ======================================================================*/

    var KEY = 'kibu_block_tower';
    var store = {
        data: { best: 0, lines: 0, plays: 0 },
        load: function () {
            try {
                var raw = localStorage.getItem(KEY);
                if (raw) { var d = JSON.parse(raw); if (d && typeof d === 'object') this.data = d; }
            } catch (e) { }
        },
        save: function () { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
        record: function (score, lines) {
            this.data.plays = (this.data.plays || 0) + 1;
            this.data.lines = (this.data.lines || 0) + lines;
            var fresh = score > (this.data.best || 0);
            if (fresh) this.data.best = score;
            this.save();
            return fresh;
        }
    };

    /* ========================================================================
     *  3. ÂM THANH — dựng bằng WebAudio, không tải tệp nào
     * ======================================================================*/

    var sfx = {
        ctx: null, on: true,
        init: function () { try { this.on = localStorage.getItem(KEY + '_sound') !== 'off'; } catch (e) { } },
        wake: function () {
            if (!this.ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        },
        toggle: function () {
            this.on = !this.on;
            try { localStorage.setItem(KEY + '_sound', this.on ? 'on' : 'off'); } catch (e) { }
        },
        tone: function (f0, f1, dur, type, vol) {
            if (!this.on || !this.ctx) return;
            var t = this.ctx.currentTime;
            var o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(f0, t);
            if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            g.gain.setValueAtTime(vol || 0.05, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        },
        move: function () { this.tone(320, 300, 0.04, 'square', 0.025); },
        turn: function () { this.tone(520, 640, 0.06, 'triangle', 0.035); },
        land: function () { this.tone(180, 90, 0.12, 'square', 0.05); },
        drop: function () { this.tone(240, 70, 0.16, 'sawtooth', 0.05); },
        line: function (n) {
            var s = this, base = [0, 523, 659, 784, 1047];
            for (var i = 0; i < n; i++) {
                (function (k) { setTimeout(function () { s.tone(base[Math.min(n, 4)] * (1 + k * 0.16), 0, 0.16, 'triangle', 0.06); }, k * 80); })(i);
            }
        },
        gold: function () {
            var s = this;
            [880, 1174, 1568, 2093].forEach(function (f, i) {
                setTimeout(function () { s.tone(f, f, 0.13, 'triangle', 0.055); }, i * 65);
            });
        },
        level: function () {
            var s = this;
            [523, 659, 784, 1047].forEach(function (f, i) {
                setTimeout(function () { s.tone(f, f, 0.18, 'triangle', 0.06); }, i * 110);
            });
        },
        over: function () {
            var s = this;
            [392, 330, 262, 196].forEach(function (f, i) {
                setTimeout(function () { s.tone(f, f * 0.9, 0.3, 'sawtooth', 0.05); }, i * 160);
            });
        }
    };

    /* ========================================================================
     *  4. TRẠNG THÁI
     * ======================================================================*/

    var G = {
        mode: 'menu',        // menu | play | pause | clearing | over
        board: null,
        piece: null,
        next: [],
        bag: [],
        rnd: null,
        seed: 1,
        score: 0, lines: 0, level: 1,
        fall: 0,             // đồng hồ rơi
        grace: 0,            // ân huệ khi đã chạm đáy
        soft: false,
        clearT: 0,
        clearRows: [],
        goldRun: 0
    };

    function lang() { return (document.documentElement.lang === 'vi') ? 'vi' : 'en'; }

    /* ========================================================================
     *  5. SCENE PHASER
     * ======================================================================*/

    var PlayScene;

    function definePlayScene() {
        if (PlayScene) return;

        PlayScene = new Phaser.Class({
            Extends: Phaser.Scene,
            initialize: function PlayScene() { Phaser.Scene.call(this, { key: 'play' }); },

            create: function () {
                this.gRoom = this.add.graphics().setDepth(1);
                this.gWell = this.add.graphics().setDepth(2);
                this.gGhost = this.add.graphics().setDepth(3);
                this.blocks = this.add.group();
                this.gFx = this.add.graphics().setDepth(8);

                this.sparks = [];
                this.shake = 0;
                this.acc = 0;
                this.frozen = false;
                this.imgs = [];

                this.layout();
                this.bakeCubes();
                this.wireInput();

                UI.sceneReady(this);
            },

            /* Tính cạnh ô và chỗ đặt giếng cho vừa khung. Giếng chiếm chừng 62%
             * bề ngang, chừa hai bên cho căn phòng thở — cái giếng dán sát mép
             * thì mất hẳn cảm giác "lơ lửng giữa phòng". */
            layout: function () {
                var wantW = W * 0.62, wantH = H * 0.70;
                CELL = Math.floor(Math.min(wantW / R.COLS, wantH / R.ROWS));
                var bw = CELL * R.COLS, bh = CELL * R.ROWS;
                OX = Math.round((W - bw) / 2 - CELL * A.DEPTH * 0.5);
                OY = Math.round(H * 0.16);
            },

            /* Nướng năm chất liệu thành ảnh. Tấm ảnh rộng và cao hơn cạnh ô một
             * khoảng đúng bằng độ lùi, vì mặt trên và mặt phải thò ra ngoài. */
            bakeCubes: function () {
                var S = A.TEX_SCALE, g = this.add.graphics();
                this.cubeW = CELL;
                this.cubeH = CELL;
                /* MỘT ảnh cho mỗi màu. Khối phẳng thì không còn mặt nào bị ô
                 * bên cạnh che, nên cũng không cần tám biến thể theo hàng xóm
                 * như hồi làm khối lập phương. Đơn giản đi hẳn một tầng. */
                for (var key in A.MATS) {
                    var tex = 'cube_' + key + '_' + CELL;
                    if (this.textures.exists(tex)) continue;
                    g.clear();
                    g.scaleCanvas(S, S);
                    A.drawCube(g, key, CELL);
                    g.scaleCanvas(1 / S, 1 / S);
                    g.generateTexture(tex, this.cubeW * S, this.cubeH * S);
                }
                g.destroy();
            },

            /* ---------------------------------------------------------------
             * ĐIỀU KHIỂN
             * -------------------------------------------------------------*/
            wireInput: function () {
                var self = this;

                this.input.on('pointerdown', function (p) {
                    if (G.mode !== 'play') return;
                    sfx.wake();
                    self.touchX = p.x; self.touchY = p.y; self.touchT = 0; self.swiped = false;
                });
                this.input.on('pointermove', function (p) {
                    if (G.mode !== 'play' || self.touchX === undefined || self.swiped) return;
                    var dy = p.y - self.touchY;
                    /* Vuốt xuống một quãng bằng hai ô là thả rơi thẳng. Ngưỡng
                     * tính theo cạnh ô chứ không phải theo pixel: cùng một cú
                     * vuốt phải cho cùng một kết quả trên máy to lẫn máy nhỏ. */
                    if (dy > CELL * 1.8) { self.hardDrop(); self.swiped = true; }
                });
                this.input.on('pointerup', function (p) {
                    if (G.mode !== 'play' || self.touchX === undefined) return;
                    var moved = Math.abs(p.x - self.touchX) + Math.abs(p.y - self.touchY);
                    if (!self.swiped && moved < CELL * 0.8) {
                        /* Chạm nhanh: nửa trái đẩy trái, nửa phải đẩy phải,
                         * khoảng giữa thì xoay. Vùng xoay rộng đúng bằng bề
                         * ngang cái giếng, để bé nhắm vào giếng mà bấm là xoay
                         * — đấy là chỗ mắt bé đang nhìn. */
                        var bw = CELL * R.COLS;
                        if (p.x < OX + bw * 0.28) self.tryMove(-1);
                        else if (p.x > OX + bw * 0.72) self.tryMove(1);
                        else self.tryRotate(1);
                    }
                    self.touchX = undefined;
                });

                window.addEventListener('keydown', function (ev) {
                    if (G.mode === 'play') {
                        var used = true;
                        if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') self.tryMove(-1);
                        else if (ev.code === 'ArrowRight' || ev.code === 'KeyD') self.tryMove(1);
                        else if (ev.code === 'ArrowUp' || ev.code === 'KeyW' || ev.code === 'KeyX') self.tryRotate(1);
                        else if (ev.code === 'KeyZ') self.tryRotate(-1);
                        else if (ev.code === 'ArrowDown' || ev.code === 'KeyS') G.soft = true;
                        else if (ev.code === 'Space') self.hardDrop();
                        else used = false;
                        if (used) { sfx.wake(); ev.preventDefault(); }
                    }
                    if (ev.code === 'KeyP' || ev.code === 'Escape') UI.togglePause();
                });
                window.addEventListener('keyup', function (ev) {
                    if (ev.code === 'ArrowDown' || ev.code === 'KeyS') G.soft = false;
                });
            },

            tryMove: function (dx) {
                var p = R.moved(G.piece, dx, 0);
                if (!R.fits(G.board, p)) return false;
                G.piece = p;
                if (G.grace > 0) G.grace = LOCK_GRACE;   // còn cựa được thì gia hạn
                sfx.move();
                return true;
            },

            tryRotate: function (dir) {
                var p = R.rotated(G.board, G.piece, dir);
                if (!p) return false;
                G.piece = p;
                if (G.grace > 0) G.grace = LOCK_GRACE;
                sfx.turn();
                return true;
            },

            hardDrop: function () {
                var land = R.dropTo(G.board, G.piece);
                var dist = land.y - G.piece.y;
                G.piece = land;
                G.score += dist * 2;
                sfx.drop();
                this.shake = Math.min(0.28, 0.06 + dist * 0.012);
                this.lockPiece();
            },

            /* ---------------------------------------------------------------
             * VÒNG ĐỜI QUÂN KHỐI
             * -------------------------------------------------------------*/
            startGame: function (seed) {
                G.seed = (seed === undefined) ? ((Date.now() % 100000) | 0) : (seed | 0);
                G.rnd = R.rng(G.seed);
                G.board = R.newBoard();
                G.bag = [];
                G.next = [];
                G.score = 0; G.lines = 0; G.level = 1;
                G.fall = 0; G.grace = 0; G.soft = false;
                G.clearRows = []; G.clearT = 0; G.goldRun = 0;
                this.sparks = [];
                for (var i = 0; i < 3; i++) G.next.push(this.drawPiece());
                this.nextPiece();
                G.mode = 'play';
                UI.paintHud();
            },

            drawPiece: function () {
                if (!G.bag.length) G.bag = R.makeBag(G.rnd);
                return { type: G.bag.pop(), mat: R.matAt(G.rnd()) };
            },

            nextPiece: function () {
                var spec = G.next.shift();
                G.next.push(this.drawPiece());
                G.piece = R.spawn(spec.type, spec.mat);
                G.fall = 0;
                G.grace = 0;
                if (!R.fits(G.board, G.piece)) {
                    G.mode = 'over';
                    UI.finish();
                    return;
                }
                UI.paintNext();
            },

            lockPiece: function () {
                var over = R.lock(G.board, G.piece);
                sfx.land();
                var rows = R.fullRows(G.board);
                if (rows.length) {
                    G.clearRows = rows;
                    G.clearT = 0;
                    G.mode = 'clearing';
                    sfx.line(rows.length);
                    /* hàng nào toàn vàng thì reo thêm một tiếng riêng */
                    for (var i = 0; i < rows.length; i++) {
                        var allGold = true;
                        for (var x = 0; x < R.COLS; x++) if (G.board[rows[i]][x] !== 'gold') { allGold = false; break; }
                        if (allGold) { sfx.gold(); break; }
                    }
                    this.shake = Math.max(this.shake, 0.10 + rows.length * 0.05);
                    return;
                }
                if (over) { G.mode = 'over'; UI.finish(); return; }
                this.nextPiece();
            },

            finishClear: function () {
                var n = G.clearRows.length;
                var mult = R.clearRows(G.board, G.clearRows);
                G.score += R.scoreLines(n, G.level, mult);
                G.lines += n;
                var lv = R.levelFor(G.lines);
                if (lv !== G.level) { G.level = lv; sfx.level(); UI.paintRoom(); }
                G.clearRows = [];
                G.mode = 'play';
                UI.paintHud();
                this.nextPiece();
            },

            /* ---------------------------------------------------------------
             * MỘT NHỊP MÁY
             * -------------------------------------------------------------*/
            stepAll: function (dt) {
                if (this.shake > 0) this.shake -= dt;

                for (var i = this.sparks.length - 1; i >= 0; i--) {
                    var s = this.sparks[i];
                    s.t += dt;
                    if (s.t > 0.7) this.sparks.splice(i, 1);
                }

                if (G.mode === 'clearing') {
                    G.clearT += dt;
                    if (G.clearT > 0.42) this.finishClear();
                    return;
                }
                if (G.mode !== 'play') return;

                var delay = R.dropDelay(G.level) / (G.soft ? SOFT_MUL : 1);
                G.fall += dt;

                var onFloor = !R.fits(G.board, R.moved(G.piece, 0, 1));
                if (onFloor) {
                    /* MẤY NHỊP ÂN HUỆ: chạm đáy rồi vẫn còn nửa giây để xoay
                     * hay đẩy ngang. Thiếu nó thì mỗi lần bé chậm tay một chút
                     * là hỏng cả cột, mà bé thì chưa quen tay. */
                    if (G.grace === 0) G.grace = LOCK_GRACE;
                    G.grace -= dt;
                    if (G.grace <= 0) { this.lockPiece(); return; }
                } else {
                    G.grace = 0;
                    while (G.fall >= delay) {
                        G.fall -= delay;
                        if (R.fits(G.board, R.moved(G.piece, 0, 1))) {
                            G.piece = R.moved(G.piece, 0, 1);
                            if (G.soft) G.score += 1;
                        } else break;
                    }
                }
            },

            update: function (time, delta) {
                if (this.frozen) return;
                this.acc = Math.min(this.acc + delta / 1000, 5 / 60);
                while (this.acc >= 1 / 60) { this.acc -= 1 / 60; this.stepAll(1 / 60); }
                this.paintAll();
            },

            /* ---------------------------------------------------------------
             * VẼ
             * -------------------------------------------------------------*/
            paintAll: function () {
                var room = A.roomFor(G.level);
                var sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 26 : 0;
                var sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 26 : 0;
                this.paintRoom(room);
                this.paintWell(room, sx, sy);
                this.paintBlocks(sx, sy);
                this.paintFx(room, sx, sy);
            },

            /* ---------------------------------------------------------------
             * CĂN PHÒNG
             *
             * Anh Hiếu muốn cái giếng lơ lửng "giữa phòng khách gia đình". Nên
             * căn phòng phải RA CĂN PHÒNG: có cửa sổ, có ghế dài, có cây cảnh,
             * có khung ảnh treo tường. Một bức tường trơn với cái sàn thì không
             * nói lên được gì, và cái giếng lơ lửng giữa hư không thì cũng
             * chẳng có gì để mà lơ lửng ở giữa.
             *
             * Đồ đạc vẽ bằng bóng tối màu, cố ý cho chìm: chúng là bối cảnh,
             * không được tranh mắt với đống khối. Chỗ sáng nhất màn hình phải
             * là cái giếng.
             * -------------------------------------------------------------*/
            paintRoom: function (room) {
                var g = this.gRoom;
                g.clear();
                var i, floorY = H * 0.78;

                /* tường: dải màu chuyển dần, xếp bằng nhiều dải ngang vì Phaser
                 * chỉ vẽ được gradient khi có WebGL */
                var bands = 30;
                for (i = 0; i < bands; i++) {
                    var t = i / (bands - 1);
                    var col = Phaser.Display.Color.Interpolate.ColorWithColor(
                        Phaser.Display.Color.ValueToColor(room.wall[0]),
                        Phaser.Display.Color.ValueToColor(room.wall[1]), 100, t * 100);
                    g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
                    g.fillRect(0, (floorY * t) - 2, W, floorY / bands + 4);
                }

                /* Quầng đèn từ trần: hình NÓN toả xuống, không phải mấy vòng
                 * tròn đồng tâm. Bản đầu em vẽ năm vòng tròn to chồng lên nhau,
                 * ảnh chụp ra thành mấy vành cung như cái bia bắn — nhìn là biết
                 * ngay đồ vẽ ẩu. Nón thì đúng cách ánh sáng đi, mà lại đúng chỗ
                 * cần sáng: ngay trên cái giếng. */
                var lampX = W * 0.5;
                for (i = 14; i >= 1; i--) {
                    var k = i / 14;
                    g.fillStyle(room.light, 0.020 * (1 - k) + 0.006);
                    g.beginPath();
                    g.moveTo(lampX - W * 0.05, 0);
                    g.lineTo(lampX + W * 0.05, 0);
                    g.lineTo(lampX + W * 0.10 + W * 0.42 * k, floorY);
                    g.lineTo(lampX - W * 0.10 - W * 0.42 * k, floorY);
                    g.closePath();
                    g.fillPath();
                }

                /* --- cửa sổ bên trái --- */
                var wx = W * 0.055, wy = H * 0.17, ww = W * 0.19, wh = H * 0.30;
                g.fillStyle(0x000000, 0.22);
                g.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);
                g.fillStyle(room.stars ? 0x0a1330 : 0x6d86a8, 1);
                g.fillRect(wx, wy, ww, wh);
                if (room.stars) {
                    for (i = 0; i < 16; i++) {
                        g.fillStyle(0xffffff, 0.30 + ((i * 29) % 5) * 0.12);
                        g.fillCircle(wx + ((i * 53) % 100) / 100 * ww, wy + ((i * 37) % 100) / 100 * wh, 1.4);
                    }
                    g.fillStyle(0xfff3c4, 0.9);
                    g.fillCircle(wx + ww * 0.7, wy + wh * 0.24, ww * 0.10);
                } else {
                    /* Ban ngày: đồi xa và một đám mây. Vẽ nhỏ lại cho NẰM GỌN
                     * trong khung cửa — bản đầu em cho đồi rộng gấp rưỡi khung,
                     * ảnh chụp ra một vệt xanh lá loang cả ra tường phòng
                     * khách, trông như vết bẩn. Phaser không cắt theo khung nên
                     * vẽ gì cũng phải tự canh cho vừa. */
                    g.fillStyle(0x8fb4c9, 0.6);
                    g.fillEllipse(wx + ww * 0.35, wy + wh * 0.26, ww * 0.42, wh * 0.13);
                    g.fillStyle(0x5f7f63, 1);
                    g.fillEllipse(wx + ww * 0.28, wy + wh * 0.94, ww * 0.66, wh * 0.26);
                    g.fillEllipse(wx + ww * 0.74, wy + wh * 0.97, ww * 0.56, wh * 0.20);
                    g.fillStyle(0x4c6b52, 1);
                    g.fillRect(wx, wy + wh * 0.90, ww, wh * 0.10);
                }
                /* nan cửa */
                g.lineStyle(Math.max(3, W * 0.006), room.accent, 0.55);
                g.strokeRect(wx, wy, ww, wh);
                g.beginPath();
                g.moveTo(wx + ww * 0.5, wy); g.lineTo(wx + ww * 0.5, wy + wh);
                g.moveTo(wx, wy + wh * 0.5); g.lineTo(wx + ww, wy + wh * 0.5);
                g.strokePath();
                /* vệt nắng hắt vào từ cửa sổ — nói cho mắt biết nguồn sáng thứ hai */
                g.fillStyle(room.light, 0.05);
                g.beginPath();
                g.moveTo(wx, wy + wh);
                g.lineTo(wx + ww, wy + wh);
                g.lineTo(wx + ww * 2.3, floorY);
                g.lineTo(wx + ww * 0.4, floorY);
                g.closePath();
                g.fillPath();

                /* --- khung ảnh treo tường bên phải --- */
                var px = W * 0.80, py = H * 0.20, pw = W * 0.13, ph = H * 0.16;
                g.fillStyle(0x000000, 0.24);
                g.fillRect(px + 5, py + 6, pw, ph);
                g.fillStyle(room.accent, 0.55);
                g.fillRect(px, py, pw, ph);
                g.fillStyle(room.wall[1], 1);
                g.fillRect(px + pw * 0.09, py + ph * 0.09, pw * 0.82, ph * 0.82);
                /* trong ảnh vẽ đúng một cái tháp khối nhỏ — đùa một chút, và
                 * cũng để bé biết cả nhà này mê xếp hình */
                var bs = pw * 0.14;
                var tower = [[1, 3], [2, 3], [3, 3], [1, 2], [2, 2], [2, 1]];
                for (i = 0; i < tower.length; i++) {
                    g.fillStyle(i % 3 === 2 ? 0xffc93c : room.accent, 0.85);
                    g.fillRect(px + pw * 0.22 + tower[i][0] * bs, py + ph * 0.22 + tower[i][1] * bs, bs * 0.9, bs * 0.9);
                }

                /* --- sàn --- */
                g.fillStyle(room.floor, 1);
                g.fillRect(0, floorY, W, H - floorY);
                g.fillStyle(0x000000, 0.16);
                g.fillRect(0, floorY, W, H * 0.012);
                g.lineStyle(2, 0x000000, 0.12);
                for (i = -7; i <= 7; i++) {
                    g.beginPath();
                    g.moveTo(W * 0.5 + i * W * 0.05, floorY);
                    g.lineTo(W * 0.5 + i * W * 0.30, H);
                    g.strokePath();
                }

                /* --- thảm --- */
                g.fillStyle(room.rug, 1);
                g.fillEllipse(W * 0.5, floorY + (H - floorY) * 0.46, W * 0.70, (H - floorY) * 0.70);
                g.lineStyle(3, room.rugEdge, 0.7);
                g.strokeEllipse(W * 0.5, floorY + (H - floorY) * 0.46, W * 0.60, (H - floorY) * 0.58);

                /* --- ghế dài bên trái, chỉ thấy lưng ghế --- */
                var sofaY = floorY - H * 0.012;
                g.fillStyle(0x000000, 0.30);
                g.fillRoundedRect(W * 0.015, sofaY - H * 0.075, W * 0.26, H * 0.085, H * 0.014);
                g.fillStyle(room.rugEdge, 0.75);
                g.fillRoundedRect(W * 0.02, sofaY - H * 0.082, W * 0.25, H * 0.085, H * 0.014);
                g.fillStyle(0x000000, 0.16);
                g.fillRoundedRect(W * 0.045, sofaY - H * 0.070, W * 0.085, H * 0.030, H * 0.008);
                g.fillRoundedRect(W * 0.150, sofaY - H * 0.070, W * 0.085, H * 0.030, H * 0.008);

                /* --- cây cảnh góc phải --- */
                var tx = W * 0.90, ty = floorY;
                g.fillStyle(0x000000, 0.28);
                g.fillEllipse(tx, ty + H * 0.006, W * 0.075, H * 0.014);
                g.fillStyle(room.rugEdge, 0.9);
                g.beginPath();
                g.moveTo(tx - W * 0.035, ty - H * 0.045);
                g.lineTo(tx + W * 0.035, ty - H * 0.045);
                g.lineTo(tx + W * 0.026, ty);
                g.lineTo(tx - W * 0.026, ty);
                g.closePath();
                g.fillPath();
                g.fillStyle(0x2f6b46, 0.85);
                for (i = 0; i < 6; i++) {
                    var a = -Math.PI * (0.18 + i * 0.13);
                    g.fillEllipse(tx + Math.cos(a) * W * 0.036, ty - H * 0.055 + Math.sin(a) * H * 0.038,
                        W * 0.055, H * 0.020);
                }

                /* --- đèn cây bên phải, ngay dưới khung ảnh --- */
                var lx = W * 0.735;
                g.fillStyle(0x000000, 0.26);
                g.fillEllipse(lx, floorY + H * 0.004, W * 0.035, H * 0.008);
                g.lineStyle(Math.max(2, W * 0.006), room.rugEdge, 0.9);
                g.beginPath();
                g.moveTo(lx, floorY); g.lineTo(lx, floorY - H * 0.12);
                g.strokePath();
                g.fillStyle(room.light, 0.85);
                g.beginPath();
                g.moveTo(lx - W * 0.035, floorY - H * 0.12);
                g.lineTo(lx + W * 0.035, floorY - H * 0.12);
                g.lineTo(lx + W * 0.024, floorY - H * 0.165);
                g.lineTo(lx - W * 0.024, floorY - H * 0.165);
                g.closePath();
                g.fillPath();
                /* Quầng đèn: nhiều lớp rất mờ thay vì ba vòng đậm. Ba vòng thì
                 * hiện rõ ba đường viền tròn — mắt đọc ra ngay là mấy hình tròn
                 * xếp chồng, không phải ánh sáng. */
                for (i = 9; i >= 1; i--) {
                    g.fillStyle(room.light, 0.016);
                    g.fillEllipse(lx, floorY - H * 0.10 + i * H * 0.004,
                        W * (0.05 + i * 0.020), H * (0.03 + i * 0.014));
                }

                /* --- BÓNG CỦA CÁI GIẾNG đổ xuống thảm ---
                 * Đây mới là thứ nói cho mắt biết giếng đang lơ lửng. Bỏ nó đi
                 * thì giếng chỉ là một cái khung dán lên tường. */
                var bw = CELL * R.COLS;
                for (i = 3; i >= 1; i--) {
                    g.fillStyle(0x000000, 0.11 * i);
                    g.fillEllipse(OX + bw * 0.5 + CELL * A.DEPTH * 0.5,
                        floorY + (H - floorY) * 0.46,
                        bw * (0.50 + i * 0.06), (H - floorY) * (0.15 + i * 0.05));
                }
            },

            paintWell: function (room, sx, sy) {
                var g = this.gWell;
                g.clear();
                var bw = CELL * R.COLS, bh = CELL * R.ROWS;
                var D = CELL * A.DEPTH;
                var x0 = OX + sx, y0 = OY + sy;

                /* Lòng giếng: mặt sau lùi vào, hai vách hai bên nghiêng theo —
                 * cùng một phép chiếu xiên với khối, nếu không thì khối nằm
                 * trong một cái hộp vẽ theo luật khác và mắt thấy sai ngay. */
                g.fillStyle(0x000000, 0.34);
                g.beginPath();
                g.moveTo(x0 + D, y0 - D);
                g.lineTo(x0 + bw + D, y0 - D);
                g.lineTo(x0 + bw + D, y0 + bh - D);
                g.lineTo(x0 + D, y0 + bh - D);
                g.closePath();
                g.fillPath();

                /* vách trái và vách đáy nối mặt trước với mặt sau */
                g.fillStyle(0x000000, 0.20);
                g.beginPath();
                g.moveTo(x0, y0); g.lineTo(x0 + D, y0 - D);
                g.lineTo(x0 + D, y0 + bh - D); g.lineTo(x0, y0 + bh);
                g.closePath();
                g.fillPath();
                g.beginPath();
                g.moveTo(x0, y0 + bh); g.lineTo(x0 + D, y0 + bh - D);
                g.lineTo(x0 + bw + D, y0 + bh - D); g.lineTo(x0 + bw, y0 + bh);
                g.closePath();
                g.fillPath();

                /* lưới mờ trên mặt sau — giúp bé đếm cột mà không làm rối mắt */
                g.lineStyle(1, room.dust, 0.07);
                for (var c = 1; c < R.COLS; c++) {
                    g.beginPath();
                    g.moveTo(x0 + D + c * CELL, y0 - D);
                    g.lineTo(x0 + D + c * CELL, y0 + bh - D);
                    g.strokePath();
                }

                /* khung miệng giếng */
                g.lineStyle(Math.max(2, CELL * 0.09), room.accent, 0.85);
                g.strokeRect(x0, y0, bw, bh);
                g.lineStyle(Math.max(1, CELL * 0.05), room.accent, 0.45);
                g.beginPath();
                g.moveTo(x0, y0); g.lineTo(x0 + D, y0 - D);
                g.moveTo(x0 + bw, y0); g.lineTo(x0 + bw + D, y0 - D);
                g.moveTo(x0 + bw, y0 + bh); g.lineTo(x0 + bw + D, y0 + bh - D);
                g.lineTo(x0 + D, y0 + bh - D); g.lineTo(x0 + D, y0 - D);
                g.lineTo(x0 + bw + D, y0 - D); g.lineTo(x0 + bw + D, y0 + bh - D);
                g.strokePath();
            },

            /* Chỗ đặt một ô trên màn. Cộng thêm phần lùi vì gốc ảnh nằm ở góc
             * trên-trái của MẶT TRƯỚC, mà ảnh thì có cả mặt trên nhô lên. */
            cellXY: function (cx, cy, sx, sy) {
                return { x: OX + cx * CELL + sx, y: OY + cy * CELL + sy };
            },

            paintBlocks: function (sx, sy) {
                var need = [], i, x, y;
                /* Vòng vẽ chạy từ lúc mở trang, trước cả khi bé bấm bắt đầu —
                 * lúc ấy chưa có cái giếng nào. Thiếu dòng này là màn chào ném
                 * lỗi ngay và cả trang đứng im. */
                if (!G.board) {
                    for (i = 0; i < this.imgs.length; i++) this.imgs[i].setVisible(false);
                    return;
                }

                /* Xếp thứ tự vẽ từ XA tới GẦN. Mặt trên và mặt phải lùi lên
                 * phía trên-phải, nên khối ở trên-phải là khối ở xa: vẽ trước,
                 * rồi khối gần đè lên. Vẽ sai thứ tự thì các mặt cắt nhau lộn
                 * xộn và cả cái tường mất hẳn khối. */
                for (y = 0; y < R.ROWS; y++) {
                    for (x = R.COLS - 1; x >= 0; x--) {
                        var m = G.board[y][x];
                        if (!m) continue;
                        var fade = 1;
                        if (G.mode === 'clearing' && G.clearRows.indexOf(y) >= 0) {
                            /* hàng sắp biến: chớp sáng rồi mờ đi */
                            var k = G.clearT / 0.42;
                            fade = (Math.floor(G.clearT * 22) % 2) ? 0.25 : 1;
                            fade *= (1 - k * 0.7);
                        }
                        need.push({ m: m, x: x, y: y, a: fade });
                    }
                }

                /* quân đang rơi vẽ sau cùng để luôn nằm trên */
                if (G.piece && (G.mode === 'play')) {
                    var cells = R.cellsOf(G.piece);
                    cells.sort(function (a, b) { return (a[1] - b[1]) || (b[0] - a[0]); });
                    for (i = 0; i < cells.length; i++) {
                        if (cells[i][1] < 0) continue;
                        need.push({ m: G.piece.mat, x: cells[i][0], y: cells[i][1], a: 1 });
                    }
                }

                while (this.imgs.length < need.length) {
                    this.imgs.push(this.add.image(0, 0, 'cube_ruby_' + CELL).setOrigin(0, 0).setDepth(5));
                }
                for (i = 0; i < this.imgs.length; i++) {
                    if (i >= need.length) { this.imgs[i].setVisible(false); continue; }
                    var n = need[i];
                    var p = this.cellXY(n.x, n.y, sx, sy);
                    var im = this.imgs[i];
                    im.setTexture('cube_' + n.m + '_' + CELL);
                    im.setDisplaySize(this.cubeW, this.cubeH);
                    im.setPosition(p.x, p.y);
                    im.setAlpha(n.a);
                    im.setDepth(5 + i * 0.001);
                    im.setVisible(true);
                }
            },

            paintFx: function (room, sx, sy) {
                if (!G.board) { this.gGhost.clear(); this.gFx.clear(); return; }

                var g2 = this.gFx;
                g2.clear();
                for (var s = 0; s < this.sparks.length; s++) {
                    var sp = this.sparks[s], t = sp.t / 0.7;
                    g2.fillStyle(sp.col, (1 - t) * 0.9);
                    var px = sp.x + sp.vx * sp.t;
                    var py = sp.y + sp.vy * sp.t + 520 * sp.t * sp.t;
                    g2.fillRect(px, py, sp.r * (1 - t * 0.5), sp.r * (1 - t * 0.5));
                }
            },

            /* Tia vụn bắn ra khi ăn hàng — gọi từ finishClear qua UI */
            burst: function (rowY, matKey) {
                var col = A.matOf(matKey).top;
                for (var i = 0; i < 14; i++) {
                    this.sparks.push({
                        x: OX + Math.random() * CELL * R.COLS,
                        y: OY + rowY * CELL + CELL * 0.5,
                        vx: (Math.random() - 0.5) * 420,
                        vy: -120 - Math.random() * 220,
                        r: CELL * (0.12 + Math.random() * 0.16),
                        col: col, t: 0
                    });
                }
            }
        });
    }

    /* ========================================================================
     *  6. GIAO DIỆN
     * ======================================================================*/

    var el = function (id) { return document.getElementById(id); };
    function show(n) { if (n) n.classList.remove('hidden'); }
    function hide(n) { if (n) n.classList.add('hidden'); }
    function hideAll() { ['menu-overlay', 'over-overlay', 'help-overlay', 'pause-overlay'].forEach(function (i) { hide(el(i)); }); }

    var UI = {
        game: null, scene: null, pending: false,

        sceneReady: function (s) {
            this.scene = s;
            if (this.pending) { this.pending = false; this.start(); }
        },

        boot: function () {
            if (this.game) return;
            definePlayScene();
            var box = document.querySelector('.game-viewport');
            var r = box ? box.getBoundingClientRect() : { width: 900, height: 1000 };
            var ar = (r.width > 0 && r.height > 0) ? r.width / r.height : 0.9;
            /* Khổ thế giới theo khung thật, chặn hai đầu để cái giếng không bị
             * kéo dẹt hay kéo dài quá mức. */
            ar = Math.max(0.52, Math.min(1.6, ar));
            H = 1000;
            W = Math.round(H * ar);
            var st = document.querySelector('.stage');
            if (st) { st.style.setProperty('--stage-w', W); st.style.setProperty('--stage-h', H); }

            this.game = new Phaser.Game({
                type: Phaser.AUTO,
                parent: 'game-canvas',
                width: W, height: H,
                transparent: true,
                scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
                scene: [PlayScene],
                banner: false
            });
        },

        start: function () {
            hideAll();
            document.body.classList.add('playing');
            if (!this.scene) { this.pending = true; this.boot(); return; }
            this.scene.frozen = false;
            this.scene.startGame();
            this.paintRoom();
            this.paintHud();
            this.paintNext();
        },

        togglePause: function () {
            if (G.mode === 'play') { G.mode = 'pause'; show(el('pause-overlay')); }
            else if (G.mode === 'pause') { G.mode = 'play'; hide(el('pause-overlay')); }
        },

        paintHud: function () {
            var s = el('hud-score'), l = el('hud-lines'), v = el('hud-level');
            if (s) s.textContent = G.score;
            if (l) l.textContent = G.lines;
            if (v) v.textContent = G.level;
            var box = el('hud');
            if (box) box.hidden = (G.mode === 'menu' || G.mode === 'over');
        },

        paintRoom: function () {
            var r = A.roomFor(G.level);
            var n = el('hud-room');
            if (n) n.textContent = lang() === 'vi' ? r.vi : r.en;
        },

        /* Ba quân sắp tới, vẽ bằng ô vuông nhỏ — đủ để bé biết mà tính trước,
         * không cần dựng khối 3D cho một cái ô bé xíu. */
        paintNext: function () {
            var box = el('next-list');
            if (!box) return;
            var html = '';
            for (var i = 0; i < G.next.length; i++) {
                var spec = G.next[i];
                var cells = R.SHAPES[spec.type][0];
                var grid = '';
                for (var y = 0; y < 2; y++) {
                    for (var x = 0; x < 4; x++) {
                        var on = cells.some(function (c) { return c[0] === x && c[1] === y; });
                        grid += '<i class="' + (on ? 'on m-' + spec.mat : '') + '"></i>';
                    }
                }
                html += '<div class="next-piece' + (i === 0 ? ' up' : '') + '">' + grid + '</div>';
            }
            box.innerHTML = html;
        },

        finish: function () {
            document.body.classList.remove('playing');
            sfx.over();
            var fresh = store.record(G.score, G.lines);
            el('over-score').textContent = G.score;
            el('over-lines').textContent = G.lines;
            el('over-level').textContent = G.level;
            el('over-best').textContent = store.data.best;
            el('over-new').hidden = !fresh;
            show(el('over-overlay'));
            this.paintHud();
        }
    };

    function openMenu() {
        G.mode = 'menu';
        document.body.classList.remove('playing');
        hideAll();
        show(el('menu-overlay'));
        el('menu-best').textContent = store.data.best || 0;
        UI.paintHud();
    }

    function wireButtons() {
        el('btn-play').addEventListener('click', function () { sfx.wake(); UI.start(); });
        el('btn-again').addEventListener('click', function () { sfx.wake(); UI.start(); });
        el('btn-over-menu').addEventListener('click', openMenu);
        el('btn-nav-menu').addEventListener('click', openMenu);
        el('btn-pause').addEventListener('click', function () { sfx.wake(); UI.togglePause(); });
        el('btn-resume').addEventListener('click', function () { UI.togglePause(); });
        el('btn-help').addEventListener('click', function () { hideAll(); show(el('help-overlay')); });
        el('btn-help-back').addEventListener('click', function () {
            hideAll();
            if (G.mode === 'menu') show(el('menu-overlay'));
            else document.body.classList.add('playing');
        });

        /* Nút bấm to dưới màn cho bé chơi bằng điện thoại — ngón cái với tới
         * được, và không che mất cái giếng. */
        var pad = el('touchpad');
        if (pad) {
            pad.addEventListener('pointerdown', function (ev) {
                var b = ev.target.closest('.pad-btn');
                if (!b || G.mode !== 'play' || !UI.scene) return;
                sfx.wake();
                var act = b.getAttribute('data-act');
                if (act === 'left') UI.scene.tryMove(-1);
                else if (act === 'right') UI.scene.tryMove(1);
                else if (act === 'turn') UI.scene.tryRotate(1);
                else if (act === 'drop') UI.scene.hardDrop();
                else if (act === 'soft') G.soft = true;
                ev.preventDefault();
            });
            pad.addEventListener('pointerup', function () { G.soft = false; });
            pad.addEventListener('pointerleave', function () { G.soft = false; });
        }

        var soundBtn = el('btn-sound'), icon = el('sound-icon');
        function paintSound() {
            icon.className = 'fa-solid ' + (sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
            soundBtn.classList.toggle('is-off', !sfx.on);
        }
        soundBtn.addEventListener('click', function () { sfx.wake(); sfx.toggle(); paintSound(); });
        paintSound();
    }

    /* ========================================================================
     *  7. KHỞI ĐỘNG
     * ======================================================================*/

    function init() {
        store.load();
        sfx.init();
        wireButtons();
        openMenu();
        UI.boot();

        window.blockTower = {
            G: G, UI: UI, R: R, A: A, store: store,
            size: function () { return { W: W, H: H, CELL: CELL, OX: OX, OY: OY }; },
            start: function (seed) {
                UI.start();
                if (seed !== undefined && UI.scene) UI.scene.startGame(seed);
            },
            state: function () {
                return { mode: G.mode, score: G.score, lines: G.lines, level: G.level };
            }
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
