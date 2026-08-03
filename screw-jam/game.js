/**
 * VẶN ỐC (Screw Jam) — KIBU Games
 * ----------------------------------------------------------------------------
 * Trên bàn có mấy tấm ván xếp chồng đè lên nhau, ghim bằng những con ốc đủ màu.
 * Bé chạm vào con ốc, nó tự vặn ra rồi bay vào khay. Đủ ba con cùng màu trên
 * khay là cả ba biến mất. Tấm ván nào rút hết ốc thì rơi xuống, để lộ lớp ốc
 * nằm dưới. Tháo sạch cả bàn là xong màn.
 *
 * CHẠY TRÊN PHASER 3
 * Khác Melon Drop với Rót Màu (canvas thuần), game này dùng Phaser vì phần
 * nhìn của nó gần như toàn là chuyển động: ốc xoay tít rồi bay theo đường
 * cong vào khay, khay dồn chỗ lại, ván lảo đảo rồi rơi. Hệ tween của Phaser
 * làm mấy việc ấy gọn hơn hẳn tự viết, mà lại mượt vì nó nội suy theo đồng hồ
 * thật chứ không theo số khung hình.
 *
 * LUẬT CHƠI KHÔNG NẰM Ở ĐÂY
 * Toàn bộ luật ở /screw-jam/rules.js — một tệp thuần, không đụng Phaser, không
 * đụng màn hình. Máy sinh màn và máy soát màn chạy trong Node nạp đúng tệp ấy.
 * Nhờ vậy máy soát và bé chơi dùng chung một bộ luật, không có bản chép nào để
 * mà lệch nhau. Đây là điều kiện để hứa được câu "màn nào cũng tháo hết được".
 *
 * Bố cục file:
 *   1. Cấu hình   2. Màu và ký hiệu   3. Tiến trình   4. Âm thanh
 *   5. Trạng thái 6. Scene Phaser     7. Giao diện    8. Khởi động
 */
(function () {
    'use strict';

    var R = window.ScrewRules;
    var RAW = window.SCREW_LEVELS || [];

    /* ========================================================================
     *  1. CẤU HÌNH
     * ======================================================================*/

    /* Sân chơi KHÔNG cố định 1280×720. Phaser chạy ở chế độ RESIZE: thế giới
     * rộng đúng bằng cái khung đang có, và bàn ván tự dựng lại theo.
     *
     * Lúc đầu em để cố định 1280×720 với Scale.FIT như hai game Phaser cũ của
     * nhà mình. Trên máy tính thì đẹp, nhưng cầm điện thoại dựng đứng lên là
     * hỏng: khung 390×844 mà thế giới tỉ lệ 16:9 thì Phaser co canvas xuống còn
     * một dải 390×219 nằm giữa màn hình, bàn ván bé tí, trên dưới trống hoác.
     * Chế độ RESIZE thì dùng hết chỗ, máy nào cũng vừa. */
    var GW = 8, GH = 8;               // lưới đặt ván, khớp với máy sinh màn

    var TOP = 54;                     // chừa chỗ cho thẻ tên phía trên
    var TRAY_H = 118;                 // chiều cao khay đựng ốc

    var STORE_KEY = 'kibu_screw_jam_progress';
    var SOUND_KEY = 'kibu_screw_jam_sound';
    var MARK_KEY = 'kibu_screw_jam_marks';

    var WORLDS = [
        { name: 'First Turns', from: 0, sky: [0x8ad8ff, 0x4dabf7] },
        { name: 'Stacked Up', from: 15, sky: [0xffd8a8, 0xff922b] },
        { name: 'Colour Crowd', from: 30, sky: [0xd0bfff, 0x7048e8] },
        { name: 'Tight Tray', from: 45, sky: [0x96f2d7, 0x0ca678] }
    ];

    /* Màn ít ván mới đem cho hai bé thi: chia đôi màn hình rồi mà mười hai tấm
     * ván thì mỗi con ốc bé bằng hạt đỗ. */
    var RACE_MAX_PLATES = 8;

    /* ========================================================================
     *  2. MÀU VÀ KÝ HIỆU
     * ------------------------------------------------------------------------
     *  Rãnh trên đầu mỗi con ốc KHÔNG phải cái rãnh chữ thập thường thấy, mà
     *  mỗi màu một hình riêng: tròn, sao, tam giác, vuông... Cứ mười hai bé
     *  trai thì có một bé khó phân biệt màu — với bé ấy, mấy con ốc đỏ với
     *  xanh lá nằm cạnh nhau là một đám xam xám như nhau. Cho cái rãnh mang
     *  luôn nhiệm vụ phân biệt thì bé nhìn hình mà tháo, không cần nhìn màu,
     *  và bé nào không cần cũng chẳng thấy vướng vì cái rãnh vốn phải có.
     * ======================================================================*/

    var COLORS = [
        { c: 0xe03131, d: 0x8f1616, mark: 'circle' },
        { c: 0x1c7ed6, d: 0x0b4a7d, mark: 'star' },
        { c: 0xf59f00, d: 0x9c6500, mark: 'triangle' },
        { c: 0x2f9e44, d: 0x18602a, mark: 'square' },
        { c: 0xae3ec9, d: 0x6b1f80, mark: 'diamond' },
        { c: 0xf06595, d: 0xa8325c, mark: 'heart' },
        { c: 0x0ca678, d: 0x05614a, mark: 'plus' },
        { c: 0x868e96, d: 0x40484f, mark: 'cross' }
    ];

    /* Ba tông gỗ cho ván, đổi vòng theo thứ tự tấm — hai tấm chồng nhau mà cùng
     * màu thì bé không thấy đường ranh. */
    var WOOD = [
        { top: 0xe0a86a, side: 0xa97340, line: 0xc08d52 },
        { top: 0xd0904f, side: 0x94612f, line: 0xb07a40 },
        { top: 0xecc08a, side: 0xb98d55, line: 0xd6a970 }
    ];

    /* ========================================================================
     *  3. TIẾN TRÌNH
     * ======================================================================*/

    var store = {
        data: { stars: {}, moves: {}, done: 0 },

        load: function () {
            try {
                var raw = localStorage.getItem(STORE_KEY);
                if (raw) {
                    var d = JSON.parse(raw);
                    for (var k in d) this.data[k] = d[k];
                }
            } catch (e) { /* chế độ riêng tư: chơi được nhưng không nhớ */ }
        },
        save: function () {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        starsOf: function (i) { return this.data.stars[i] || 0; },
        bestOf: function (i) { return this.data.moves[i] || 0; },
        unlocked: function (i) { return i === 0 || (this.data.stars[i - 1] || 0) > 0; },
        record: function (i, stars, moves) {
            if (stars > this.starsOf(i)) this.data.stars[i] = stars;
            var old = this.bestOf(i);
            if (!old || moves < old) this.data.moves[i] = moves;
            if (i + 1 > this.data.done) this.data.done = i + 1;
            this.save();
        },
        reset: function () { this.data = { stars: {}, moves: {}, done: 0 }; this.save(); }
    };

    /* ========================================================================
     *  4. ÂM THANH
     * ------------------------------------------------------------------------
     *  Tổng hợp bằng Web Audio, không tải tệp nào — giống mọi game khác của nhà
     *  mình. Cách này iOS coi là tiếng của trang chứ không phải một phiên phát
     *  nhạc, nên không sinh ra nút điều khiển ở màn hình khoá.
     * ======================================================================*/

    var sfx = {
        on: true,
        ctx: null,

        init: function () {
            try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { }
        },
        wake: function () {
            if (!this.ctx) {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        },
        toggle: function () {
            this.on = !this.on;
            try { localStorage.setItem(SOUND_KEY, this.on ? '1' : '0'); } catch (e) { }
            return this.on;
        },
        tone: function (freq, dur, type, vol, slideTo) {
            if (!this.on || !this.ctx) return;
            var t = this.ctx.currentTime;
            var o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(freq, t);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
            g.gain.setValueAtTime(vol == null ? 0.12 : vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g).connect(this.ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        },
        noise: function (dur, vol, band) {
            if (!this.on || !this.ctx) return;
            var ac = this.ctx;
            var len = Math.max(1, Math.floor(ac.sampleRate * (dur || 0.1)));
            var buf = ac.createBuffer(1, len, ac.sampleRate);
            var d = buf.getChannelData(0);
            for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            var src = ac.createBufferSource(); src.buffer = buf;
            var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = band || 1200;
            var g = ac.createGain(); g.gain.value = vol == null ? 0.1 : vol;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },

        /* Tiếng vặn: một dải nhiễu ngắn kêu rẹt rẹt như ren ốc miết vào gỗ */
        unscrew: function () { this.noise(0.16, 0.05, 2600); this.tone(420, 0.14, 'sawtooth', 0.03, 700); },
        drop: function () { this.tone(300, 0.07, 'triangle', 0.06, 200); },
        pop: function () {
            [660, 880, 1180].forEach(function (f, i) {
                setTimeout(function () { sfx.tone(f, 0.13, 'triangle', 0.1); }, i * 60);
            });
        },
        plate: function () { this.noise(0.22, 0.07, 500); this.tone(180, 0.24, 'sine', 0.07, 90); },
        nope: function () { this.tone(180, 0.12, 'square', 0.05, 120); },
        hint: function () { this.tone(880, 0.1, 'triangle', 0.07, 1320); },
        undo: function () { this.tone(320, 0.08, 'sine', 0.05, 240); },
        win: function () {
            [523, 659, 784, 1046, 1318].forEach(function (f, i) {
                setTimeout(function () { sfx.tone(f, 0.24, 'triangle', 0.13); }, i * 110);
            });
        }
    };

    /* ========================================================================
     *  5. TRẠNG THÁI
     * ======================================================================*/

    var G = {
        mode: 'menu',       // menu | play | levels | over
        kids: 1,
        marks: true,
        level: 0,
        winner: 0,
        boards: []          // mỗi bé một bàn, xem makeBoard()
    };

    function makeBoard(kid) {
        return {
            kid: kid,
            level: null,        // dạng đã dựng từ rules.inflate
            removed: {},
            hold: [],
            moves: 0,
            undo: [],
            won: false,
            busy: false,        // đang chạy hoạt cảnh, chặn tay bé
            view: null          // phần hình ảnh, do scene dựng
        };
    }

    function worldOf(i) {
        var w = 0;
        for (var k = 0; k < WORLDS.length; k++) if (i >= WORLDS[k].from) w = k;
        return w;
    }

    /* ========================================================================
     *  6. SCENE PHASER
     * ======================================================================*/

    var PlayScene = null;

    function definePlayScene() {
        PlayScene = new Phaser.Class({
            Extends: Phaser.Scene,

            initialize: function PlayScene() {
                Phaser.Scene.call(this, { key: 'play' });
            },

            create: function () {
                this.layer = this.add.container(0, 0);
                var self = this;
                this.scale.on('resize', function () {
                    clearTimeout(self._reflowT);
                    self._reflowT = setTimeout(function () { UI.relayout(); }, 90);
                });
                UI.sceneReady(this);
            },

            vw: function () { return this.scale.width || 1280; },
            vh: function () { return this.scale.height || 720; },

            /* ---- dựng lại toàn bộ hình ảnh cho một ván mới ---- */
            build: function () {
                this.layer.removeAll(true);
                this.tweens.killAll();
                this.paintSky();

                var n = G.boards.length;
                for (var i = 0; i < n; i++) {
                    var half = this.vw() / n;
                    var box = { x: half * i, y: 0, w: half, h: this.vh() };
                    G.boards[i].view = this.buildBoard(G.boards[i], box);
                }
                UI.placeChips(this.boardRects());
            },

            boardRects: function () {
                var n = Math.max(1, G.boards.length), out = [];
                for (var i = 0; i < n; i++) {
                    var half = this.vw() / n;
                    out.push({ x: half * i, w: half });
                }
                return out;
            },

            /* Nền trời giao cho CSS chứ không vẽ bằng Graphics của Phaser.
             * Phaser chỉ tô được dải màu chuyển (gradient) khi máy có WebGL;
             * máy nào rơi về chế độ canvas thường thì lệnh ấy im lặng không vẽ
             * gì cả, và bé nhận được một cái nền đen thui. Nền CSS thì máy nào
             * cũng hiện, mà canvas để trong suốt là xong. */
            paintSky: function () {
                var w = WORLDS[worldOf(G.level)];
                var wrap = document.getElementById('board-wrap');
                if (wrap) {
                    wrap.style.background = 'linear-gradient(180deg, ' +
                        hex(w.sky[0]) + ' 0%, ' + hex(w.sky[1]) + ' 100%)';
                }
            },

            /* Một bàn: mấy tấm ván, mấy con ốc, và cái khay bên dưới */
            buildBoard: function (b, box) {
                var lv = b.level;
                var availW = box.w - (G.boards.length > 1 ? 26 : 60);
                var availH = this.vh() - TOP - TRAY_H - 30;

                /* Ôm sát đám ván chứ không lấy cả lưới 8×8. Máy sinh thả ván
                 * ngẫu nhiên nên bàn nào cũng thừa một hai hàng trống ở rìa;
                 * lấy cả lưới thì ván bị co nhỏ vô cớ và bàn trông lệch hẳn về
                 * một góc. Ôm sát thì ván to hơn và lúc nào cũng nằm giữa. */
                var minX = GW, minY = GH, maxX = 0, maxY = 0;
                for (var q = 0; q < lv.plates.length; q++) {
                    var pp = lv.plates[q];
                    if (pp.x < minX) minX = pp.x;
                    if (pp.y < minY) minY = pp.y;
                    if (pp.x + pp.w > maxX) maxX = pp.x + pp.w;
                    if (pp.y + pp.h > maxY) maxY = pp.y + pp.h;
                }
                var useW = Math.max(1, maxX - minX), useH = Math.max(1, maxY - minY);
                var cell = Math.min(availW / useW, availH / useH);
                var ox = box.x + (box.w - cell * useW) / 2 - minX * cell;
                var oy = TOP + (availH - cell * useH) / 2 + 10 - minY * cell;

                var view = {
                    cell: cell, ox: ox, oy: oy, box: box,
                    plates: [], screws: [], slots: [], trayY: 0,
                    root: this.add.container(0, 0)
                };
                this.layer.add(view.root);

                /* ---- ván ---- */
                for (var i = 0; i < lv.plates.length; i++) {
                    var p = lv.plates[i];
                    var g = this.add.container(ox + (p.x + p.w / 2) * cell, oy + (p.y + p.h / 2) * cell);
                    var gfx = this.add.graphics();
                    this.drawPlate(gfx, p.w * cell, p.h * cell, WOOD[i % WOOD.length]);
                    g.add(gfx);
                    view.root.add(g);
                    view.plates.push(g);
                }

                /* ---- ốc ---- */
                for (var k = 0; k < lv.screws.length; k++) {
                    var s = lv.screws[k];
                    var sc = this.makeScrew(s.c, cell * 0.3);
                    sc.setPosition(ox + s.x * cell, oy + s.y * cell);
                    sc.setData('idx', k);
                    sc.setData('board', b.kid - 1);
                    sc.setSize(cell * 0.72, cell * 0.72);
                    sc.setInteractive({ useHandCursor: true });
                    view.root.add(sc);
                    view.screws.push(sc);
                }

                /* ---- khay ---- */
                view.trayY = this.vh() - TRAY_H / 2 - 14;
                var trayW = Math.min(box.w - 50, lv.slots * cell * 0.9 + 40);
                var tray = this.add.graphics();
                tray.fillStyle(0x000000, 0.18);
                tray.fillRoundedRect(box.x + (box.w - trayW) / 2, view.trayY - 42, trayW, 84, 26);
                tray.lineStyle(4, 0xffffff, 0.5);
                tray.strokeRoundedRect(box.x + (box.w - trayW) / 2, view.trayY - 42, trayW, 84, 26);
                view.root.add(tray);

                var slotStep = trayW / lv.slots;
                for (var t = 0; t < lv.slots; t++) {
                    var cx = box.x + (box.w - trayW) / 2 + slotStep * (t + 0.5);
                    var hole = this.add.graphics();
                    hole.fillStyle(0x000000, 0.22);
                    hole.fillCircle(cx, view.trayY, cell * 0.31);
                    view.root.add(hole);
                    view.slots.push({ x: cx, y: view.trayY, chip: null });
                }
                return view;
            },

            drawPlate: function (g, w, h, wood) {
                var r = Math.min(18, h * 0.4);
                /* mặt bên tối hơn nằm dưới, lệch xuống vài điểm ảnh — đủ để mắt
                 * thấy tấm ván có bề dày chứ không phải hình dán phẳng */
                g.fillStyle(wood.side, 1);
                g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, r);
                g.fillStyle(wood.top, 1);
                g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
                g.lineStyle(3, wood.side, 0.85);
                g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
                /* vân gỗ */
                g.lineStyle(2, wood.line, 0.55);
                for (var i = 1; i <= 2; i++) {
                    var y = -h / 2 + (h * i) / 3;
                    g.beginPath();
                    g.moveTo(-w / 2 + 10, y);
                    g.lineTo(w / 2 - 10, y);
                    g.strokePath();
                }
            },

            /* Con ốc: vòng ngoài màu, viền tối, và cái rãnh mang hình riêng của
             * màu ấy (xem ghi chú ở mục 2). */
            makeScrew: function (color, r) {
                var col = COLORS[color % COLORS.length];
                var c = this.add.container(0, 0);
                var g = this.add.graphics();

                g.fillStyle(0x000000, 0.18);
                g.fillCircle(0, r * 0.16, r);
                g.fillStyle(col.c, 1);
                g.fillCircle(0, 0, r);
                g.lineStyle(Math.max(2, r * 0.16), col.d, 1);
                g.strokeCircle(0, 0, r * 0.92);
                /* ánh kim loại chếch một bên */
                g.fillStyle(0xffffff, 0.22);
                g.slice(0, 0, r * 0.86, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(320), false);
                g.fillPath();
                c.add(g);

                var m = this.add.graphics();
                this.drawMark(m, G.marks ? col.mark : 'cross', r * 0.56, col.d);
                c.add(m);
                c.setData('mark', m);
                c.setData('r', r);
                return c;
            },

            drawMark: function (g, kind, r, color) {
                g.clear();
                g.lineStyle(Math.max(2.5, r * 0.42), color, 1);
                g.fillStyle(color, 1);
                var i, a;
                switch (kind) {
                    case 'circle':
                        g.strokeCircle(0, 0, r * 0.62); break;
                    case 'star':
                        g.beginPath();
                        for (i = 0; i < 5; i++) {
                            a = -Math.PI / 2 + i * Math.PI * 2 / 5;
                            var a2 = a + Math.PI / 5;
                            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                            g.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
                        }
                        g.closePath(); g.fillPath(); break;
                    case 'triangle':
                        g.beginPath();
                        g.moveTo(0, -r * 0.85); g.lineTo(r * 0.8, r * 0.6); g.lineTo(-r * 0.8, r * 0.6);
                        g.closePath(); g.strokePath(); break;
                    case 'square':
                        g.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2); break;
                    case 'diamond':
                        g.beginPath();
                        g.moveTo(0, -r * 0.9); g.lineTo(r * 0.72, 0); g.lineTo(0, r * 0.9); g.lineTo(-r * 0.72, 0);
                        g.closePath(); g.strokePath(); break;
                    case 'heart':
                        g.beginPath();
                        g.moveTo(0, r * 0.75);
                        g.lineTo(-r * 0.9, -r * 0.15);
                        g.lineTo(-r * 0.35, -r * 0.8);
                        g.lineTo(0, -r * 0.3);
                        g.lineTo(r * 0.35, -r * 0.8);
                        g.lineTo(r * 0.9, -r * 0.15);
                        g.closePath(); g.fillPath(); break;
                    case 'plus':
                        g.beginPath();
                        g.moveTo(-r * 0.75, 0); g.lineTo(r * 0.75, 0);
                        g.moveTo(0, -r * 0.75); g.lineTo(0, r * 0.75);
                        g.strokePath(); break;
                    default:   /* rãnh chữ thập thường, dùng khi bé tắt ký hiệu */
                        g.beginPath();
                        g.moveTo(-r * 0.7, -r * 0.7); g.lineTo(r * 0.7, r * 0.7);
                        g.moveTo(r * 0.7, -r * 0.7); g.lineTo(-r * 0.7, r * 0.7);
                        g.strokePath(); break;
                }
            },

            /* ---- hoạt cảnh: vặn một con ốc ra rồi bay vào khay ---- */
            playUnscrew: function (b, k, slotIdx, cleared) {
                var view = b.view;
                var sc = view.screws[k];
                var slot = view.slots[slotIdx];
                var self = this;
                if (!sc || !slot) return;

                sfx.unscrew();

                /* nhấc lên và xoay tít — vặn ra thì phải thấy nó quay */
                this.tweens.add({
                    targets: sc,
                    y: sc.y - view.cell * 0.42,
                    scale: 1.18,
                    angle: 720,
                    duration: 260,
                    ease: 'Sine.easeOut',
                    onComplete: function () {
                        /* rồi bay theo đường cong xuống khay */
                        self.tweens.add({
                            targets: sc,
                            x: slot.x,
                            y: slot.y,
                            scale: 1,
                            angle: 1080,
                            duration: 330,
                            ease: 'Back.easeIn',
                            onComplete: function () {
                                sc.setAngle(0);
                                sfx.drop();
                                self.bounce(sc, 1);
                                if (cleared) self.playPop(b, cleared);
                            }
                        });
                    }
                });
            },

            bounce: function (obj, scale) {
                this.tweens.add({
                    targets: obj, scale: scale * 1.22, duration: 90, yoyo: true, ease: 'Quad.easeOut'
                });
            },

            /* Ba con cùng màu đủ bộ: phồng lên rồi nổ tung */
            playPop: function (b, cleared) {
                var view = b.view, self = this;
                var objs = cleared.map(function (s) { return s.obj; });
                sfx.pop();

                this.tweens.add({
                    targets: objs, scale: 1.5, duration: 130, ease: 'Quad.easeOut',
                    onComplete: function () {
                        objs.forEach(function (o) { self.burst(o.x, o.y, cleared[0].color); o.destroy(); });
                        self.reflow(b);
                    }
                });
                void view;
            },

            burst: function (x, y, color) {
                var col = COLORS[color % COLORS.length].c;
                for (var i = 0; i < 10; i++) {
                    var g = this.add.graphics();
                    g.fillStyle(col, 1);
                    g.fillCircle(0, 0, 5);
                    g.setPosition(x, y);
                    this.layer.add(g);
                    var a = Math.PI * 2 * i / 10 + Math.random();
                    var d = 40 + Math.random() * 50;
                    this.tweens.add({
                        targets: g,
                        x: x + Math.cos(a) * d,
                        y: y + Math.sin(a) * d,
                        alpha: 0, scale: 0.2,
                        duration: 420, ease: 'Quad.easeOut',
                        onComplete: function () { g.destroy(); }
                    });
                }
            },

            /* Khay dồn chỗ: mấy con còn lại trượt sang cho khít */
            reflow: function (b) {
                var view = b.view;
                for (var i = 0; i < b.hold.length; i++) {
                    var chip = view.slots[i].chip;
                    var want = view.slots[i];
                    if (!chip) continue;
                    if (Math.abs(chip.x - want.x) < 1) continue;
                    this.tweens.add({
                        targets: chip, x: want.x, y: want.y, duration: 220, ease: 'Cubic.easeInOut'
                    });
                }
            },

            /* Tấm ván rút hết ốc: lảo đảo một nhịp rồi rơi khỏi màn */
            playPlateFall: function (b, plateIdx, delay) {
                var g = b.view.plates[plateIdx];
                if (!g || g.getData('falling')) return;
                g.setData('falling', 1);
                var self = this;
                this.time.delayedCall(delay || 0, function () {
                    sfx.plate();
                    self.tweens.add({
                        targets: g, angle: (Math.random() < 0.5 ? -6 : 6), duration: 130, ease: 'Sine.easeOut',
                        onComplete: function () {
                            self.tweens.add({
                                targets: g,
                                y: self.vh() + 260,
                                angle: g.angle * 6,
                                alpha: 0.85,
                                duration: 620,
                                ease: 'Quad.easeIn',
                                onComplete: function () { g.destroy(); }
                            });
                        }
                    });
                });
            },

            /* Ốc bị đè thì mờ đi và không bấm được — bé nhìn là biết ngay con
             * nào đụng được, khỏi phải bấm thử rồi nghe tiếng chối tai. */
            refreshReach: function (b) {
                var free = {}, list = R.freeScrews(b.level, b.removed);
                for (var i = 0; i < list.length; i++) free[list[i]] = 1;
                for (var k = 0; k < b.view.screws.length; k++) {
                    var sc = b.view.screws[k];
                    if (!sc || !sc.scene || b.removed[k]) continue;
                    var want = free[k] ? 1 : 0.42;
                    if (sc.alpha !== want) {
                        this.tweens.add({ targets: sc, alpha: want, duration: 180 });
                    }
                    if (free[k]) sc.setInteractive({ useHandCursor: true });
                    else sc.disableInteractive();
                }
            },

            /* Vòng sáng nhấp nháy quanh con ốc máy vừa mách */
            flashHint: function (b, k) {
                var sc = b.view.screws[k];
                if (!sc) return;
                var ring = this.add.graphics();
                ring.lineStyle(5, 0xffffff, 1);
                ring.strokeCircle(0, 0, sc.getData('r') * 1.5);
                ring.setPosition(sc.x, sc.y);
                this.layer.add(ring);
                this.tweens.add({
                    targets: ring, scale: 1.9, alpha: 0, duration: 780, repeat: 1,
                    onComplete: function () { ring.destroy(); }
                });
            },

            shakeScrew: function (b, k) {
                var sc = b.view.screws[k];
                if (!sc) return;
                var x0 = sc.x;
                this.tweens.add({
                    targets: sc, x: x0 - 7, duration: 55, yoyo: true, repeat: 2,
                    onComplete: function () { sc.setX(x0); }
                });
            },

            winParty: function (b) {
                var view = b.view, self = this;
                for (var i = 0; i < 26; i++) {
                    var g = this.add.graphics();
                    g.fillStyle(COLORS[i % COLORS.length].c, 1);
                    g.fillRect(-6, -9, 12, 18);
                    g.setPosition(view.box.x + Math.random() * view.box.w, -30);
                    this.layer.add(g);
                    (function (obj) {
                        self.tweens.add({
                            targets: obj,
                            y: self.vh() + 40,
                            angle: 360 * (Math.random() < 0.5 ? 1 : -1),
                            duration: 1400 + Math.random() * 900,
                            ease: 'Quad.easeIn',
                            onComplete: function () { obj.destroy(); }
                        });
                    })(g);
                }
            }
        });
    }

    /* ========================================================================
     *  7. GIAO DIỆN + LUỒNG CHƠI
     * ======================================================================*/

    /* 0x1c7ed6 → "#1c7ed6", để đưa màu của Phaser sang cho CSS */
    function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }

    var el = function (id) { return document.getElementById(id); };

    var UI = {
        game: null,
        scene: null,
        pending: false,

        chips: [el('chip-1'), el('chip-2')],
        chipName: [el('chip-1-name'), el('chip-2-name')],
        chipMoves: [el('chip-1-moves'), el('chip-2-moves')],

        sceneReady: function (scene) {
            this.scene = scene;
            if (this.pending) { this.pending = false; this.rebuild(); }
            scene.input.on('gameobjectdown', function (pointer, obj) {
                var k = obj.getData ? obj.getData('idx') : null;
                if (k == null) return;
                UI.tapScrew(obj.getData('board'), k);
            });
        },

        start: function (levelIdx, kids) {
            G.level = levelIdx;
            G.kids = kids || G.kids;
            G.winner = 0;
            G.mode = 'play';
            G.boards = [];
            for (var i = 0; i < G.kids; i++) {
                var b = makeBoard(i + 1);
                b.level = R.inflate(RAW[levelIdx]);
                G.boards.push(b);
            }
            hideAll();
            document.body.classList.toggle('duo-race', G.kids > 1);
            this.paintChips();

            if (!this.game) {
                this.pending = true;
                definePlayScene();
                this.game = new Phaser.Game({
                    type: Phaser.AUTO,
                    parent: 'game-canvas',
                    transparent: true,
                    /* RESIZE: thế giới rộng đúng bằng khung đang có. KHÔNG dùng
                       autoCenter — .board-host đã là flex căn giữa rồi, hai cơ
                       chế cùng căn thì lệch nhau. */
                    scale: {
                        mode: Phaser.Scale.RESIZE,
                        autoCenter: Phaser.Scale.NO_CENTER,
                        width: '100%', height: '100%'
                    },
                    scene: [PlayScene],
                    banner: false
                });
            } else {
                this.rebuild();
            }
        },

        rebuild: function () {
            if (!this.scene) { this.pending = true; return; }
            this.scene.build();
            for (var i = 0; i < G.boards.length; i++) this.scene.refreshReach(G.boards[i]);
            this.paintChips();
        },

        /* ---- một cú chạm vào con ốc ---- */
        tapScrew: function (bi, k) {
            var b = G.boards[bi];
            if (!b || b.busy || b.won || G.mode !== 'play') return;
            if (b.removed[k]) return;

            var free = R.freeScrews(b.level, b.removed);
            if (free.indexOf(k) < 0) { sfx.nope(); this.scene.shakeScrew(b, k); return; }

            var res = R.place(b.hold, b.level.screws[k].c, b.level.slots);
            if (!res) { sfx.nope(); this.scene.shakeScrew(b, k); showTip('Tray is full — undo a move!', 2400); return; }

            /* ghi sổ để lùi lại được */
            b.undo.push({ k: k, hold: b.hold.slice(), chips: b.view.slots.map(function (s) { return s.chip; }) });

            var view = b.view;
            var sc = view.screws[k];
            b.removed[k] = 1;
            b.moves++;

            /* chỗ con ốc này sẽ nằm trên khay, tính TRƯỚC khi nổ bộ ba */
            var landing = res.hold.indexOf(b.level.screws[k].c);
            var slotIdx = b.hold.length;
            var cleared = null;

            if (res.cleared) {
                /* dựng lại khay: ba con cùng màu (kể cả con vừa tới) sẽ nổ */
                var all = b.hold.slice();
                all.splice(landing, 0, b.level.screws[k].c);
                var objs = [];
                for (var i = 0; i < view.slots.length; i++) objs.push(view.slots[i].chip);
                objs.splice(landing, 0, sc);
                cleared = res.cleared.at.map(function (pos) {
                    return { obj: objs[pos], color: res.cleared.color };
                });
                /* mấy con còn lại dồn về đầu khay */
                var kept = [];
                for (var j = 0; j < objs.length; j++) {
                    if (res.cleared.at.indexOf(j) < 0 && objs[j]) kept.push(objs[j]);
                }
                for (var t = 0; t < view.slots.length; t++) view.slots[t].chip = kept[t] || null;
                slotIdx = Math.min(landing, view.slots.length - 1);
            } else {
                /* chèn con mới vào đúng chỗ, đẩy mấy con sau lùi một nhịp */
                var chips = [];
                for (var q = 0; q < view.slots.length; q++) chips.push(view.slots[q].chip);
                chips.splice(landing, 0, sc);
                chips.pop();
                for (var z = 0; z < view.slots.length; z++) view.slots[z].chip = chips[z] || null;
                slotIdx = landing;
            }

            b.hold = res.hold;

            /* LUẬT CHẠY NGAY, HOẠT CẢNH CHẠY SONG SONG.
             *
             * Bản đầu em để phần tiếp theo nằm trong onComplete của tween —
             * nghĩa là trạng thái ván cờ phải CHỜ hoạt cảnh chạy xong mới đi
             * tiếp. Nghe thì gọn, nhưng nó buộc luật chơi vào nhịp vẽ: máy nào
             * tụt khung hình là bé bấm mà game đứng im, mà máy soát chạy Chrome
             * không cửa sổ (không có nhịp vẽ) thì đơ hẳn, không soát nổi một
             * nước nào. Nay luật chạy ngay khi bé chạm, hoạt cảnh chỉ là phần
             * nhìn đuổi theo sau. Chặn tay bé bằng một cái hẹn giờ ngắn cho
             * khỏi bấm dồn, chứ không chặn bằng hoạt cảnh. */
            this.scene.playUnscrew(b, k, slotIdx, cleared);
            this.scene.reflow(b);
            this.paintChips();
            this.afterMove(b);

            b.busy = true;
            setTimeout(function () { b.busy = false; }, 240);
        },

        afterMove: function (b) {
            var scene = this.scene;

            /* ván nào vừa hết ốc thì cho rơi */
            var gone = R.fallenPlates(b.level, b.removed);
            var delay = 0;
            for (var i = 0; i < b.level.plates.length; i++) {
                if (gone[i]) { scene.playPlateFall(b, i, delay); delay += 90; }
            }
            setTimeout(function () { scene.refreshReach(b); }, delay + 120);

            if (R.isWon(b.level, b.removed)) { this.onWin(b); return; }
            if (R.isStuck(b.level, b.removed, b.hold)) {
                showTip('No room left — undo or try again!', 3200);
                sfx.nope();
            }
        },

        undo: function (bi) {
            var b = G.boards[bi || 0];
            if (!b || b.busy || b.won || !b.undo.length) return;
            /* Lùi lại thì dựng lại cả bàn cho chắc: hoạt cảnh rơi ván, nổ bộ ba
             * và dồn khay đan vào nhau, gỡ ngược từng cái là chỗ dễ sai nhất. */
            var steps = b.undo.slice(0, b.undo.length - 1);
            this.replay(b, steps);
            sfx.undo();
        },

        replay: function (b, steps) {
            b.removed = {};
            b.hold = [];
            b.moves = 0;
            b.undo = [];
            b.won = false;
            var lv = b.level;
            for (var i = 0; i < steps.length; i++) {
                var k = steps[i].k;
                var res = R.place(b.hold, lv.screws[k].c, lv.slots);
                if (!res) break;
                b.removed[k] = 1;
                b.hold = res.hold;
                b.moves++;
                b.undo.push({ k: k, hold: b.hold.slice() });
            }
            this.rebuild();
            this.restoreView(b);
        },

        /* Sau khi tua lại, dựng hình cho khớp: ốc đã tháo thì bỏ đi, ốc trên
         * khay thì đặt vào chỗ, ván hết ốc thì cất luôn. */
        restoreView: function (b) {
            var view = b.view, scene = this.scene;
            var gone = R.fallenPlates(b.level, b.removed);
            for (var i = 0; i < b.level.plates.length; i++) {
                if (gone[i] && view.plates[i]) { view.plates[i].destroy(); view.plates[i] = null; }
            }
            for (var k = 0; k < view.screws.length; k++) {
                if (b.removed[k] && view.screws[k]) { view.screws[k].destroy(); view.screws[k] = null; }
            }
            for (var s = 0; s < b.hold.length; s++) {
                var chip = scene.makeScrew(b.hold[s], view.cell * 0.3);
                chip.setPosition(view.slots[s].x, view.slots[s].y);
                view.root.add(chip);
                view.slots[s].chip = chip;
            }
            scene.refreshReach(b);
            this.paintChips();
        },

        hint: function (bi) {
            var b = G.boards[bi || 0];
            if (!b || b.busy || b.won) return;
            var k = R.hint(b.level, b.removed, b.hold, 120000);
            if (k < 0) {
                showTip('No way from here — try Undo!', 2600);
                sfx.nope();
                return;
            }
            sfx.hint();
            this.scene.flashHint(b, k);
        },

        onWin: function (b) {
            b.won = true;
            sfx.win();
            this.scene.winParty(b);

            if (G.kids > 1) {
                if (!G.winner) {
                    G.winner = b.kid;
                    G.mode = 'over';
                    el('duo-title').textContent = 'Kid ' + b.kid + ' wins!';
                    show(el('duo-overlay'));
                }
                return;
            }

            var raw = RAW[G.level];
            var stars = b.moves <= raw.n ? 3 : (b.moves <= Math.ceil(raw.n * 1.35) ? 2 : 1);
            store.record(G.level, stars, b.moves);
            G.mode = 'over';

            var box = el('win-stars');
            box.innerHTML = '';
            for (var i = 0; i < 3; i++) {
                var s = document.createElement('i');
                s.className = 'fa-solid fa-star star' + (i < stars ? ' lit' : '');
                box.appendChild(s);
            }
            el('win-moves').textContent = b.moves;
            el('win-par').textContent = raw.n;
            el('win-best').textContent = store.bestOf(G.level) || b.moves;
            var last = G.level >= RAW.length - 1;
            el('btn-next').hidden = last;
            el('btn-finish').hidden = !last;

            setTimeout(function () { show(el('win-overlay')); }, 700);
        },

        paintChips: function () {
            for (var i = 0; i < G.boards.length && i < this.chips.length; i++) {
                var b = G.boards[i];
                if (this.chipMoves[i]) this.chipMoves[i].textContent = b.moves;
                if (this.chipName[i] && G.kids === 1) this.chipName[i].textContent = 'Level ' + (G.level + 1);
            }
        },

        /* Thẻ tên là thẻ HTML thật (để /i18n.js dịch được), nên phải tự tay đặt
         * lên đúng đầu bàn của từng bé. Toạ độ Phaser là toạ độ trong thế giới
         * 1280×720, phải quy về điểm ảnh thật của khung canvas. */
        /* Ở chế độ RESIZE, toạ độ trong thế giới Phaser CHÍNH LÀ điểm ảnh CSS
         * của khung canvas, nên chỉ cần cộng thêm chỗ khung ấy nằm trong thẻ
         * bao ngoài là xong. */
        placeChips: function (rects) {
            var host = el('game-canvas');
            var wrap = host ? host.getBoundingClientRect() : null;
            var outer = el('board-wrap');
            var base = outer ? outer.getBoundingClientRect() : null;
            for (var i = 0; i < this.chips.length; i++) {
                var chip = this.chips[i];
                if (!chip) continue;
                if (G.mode !== 'play' || !rects || i >= rects.length || !wrap || !base) {
                    chip.hidden = true;
                    continue;
                }
                chip.hidden = false;
                chip.style.left = (wrap.left - base.left + rects[i].x + 6) + 'px';
                chip.style.top = (wrap.top - base.top + 8) + 'px';
                chip.style.width = (rects[i].w - 12) + 'px';
            }
        },

        /* Đổi cỡ cửa sổ hay xoay ngang máy: dựng lại hình rồi đặt lại đúng thế
         * cờ đang chơi dở — trạng thái nằm ở phần luật nên không mất gì. */
        relayout: function () {
            if (!this.scene || G.mode !== 'play' || !G.boards.length) return;
            this.scene.build();
            for (var i = 0; i < G.boards.length; i++) this.restoreView(G.boards[i]);
        }
    };

    function show(n) { if (n) n.classList.remove('hidden'); }
    function hide(n) { if (n) n.classList.add('hidden'); }
    function hideAll() {
        [el('menu-overlay'), el('levels-overlay'), el('win-overlay'), el('duo-overlay')].forEach(hide);
    }

    var tipTimer = null;
    function showTip(text, ms) {
        var t = el('tip');
        if (!t) return;
        t.textContent = text;
        show(t);
        clearTimeout(tipTimer);
        tipTimer = setTimeout(function () { hide(t); }, ms || 2600);
    }

    function openMenu() {
        G.mode = 'menu';
        hideAll();
        UI.chips.forEach(function (c) { if (c) c.hidden = true; });
        show(el('menu-overlay'));
    }

    var tabWorld = 0;

    function worldStars(i) {
        var from = WORLDS[i].from;
        var to = (i + 1 < WORLDS.length ? WORLDS[i + 1].from : RAW.length) - 1;
        var got = 0;
        for (var k = from; k <= to; k++) got += store.starsOf(k);
        return { got: got, max: (to - from + 1) * 3 };
    }

    function buildLevelsPanel() {
        var tabs = el('world-tabs'), grid = el('level-grid');
        tabs.innerHTML = '';
        WORLDS.forEach(function (c, i) {
            var b = document.createElement('button');
            var locked = !store.unlocked(c.from);
            b.className = 'ch-tab' + (i === tabWorld ? ' is-on' : '') + (locked ? ' locked' : '');
            var st = worldStars(i);
            b.innerHTML = (locked ? '<i class="ch-lock">🔒</i>' : '') + c.name +
                '<span class="ch-stars">' + st.got + '/' + st.max + '⭐</span>';
            if (!locked) b.addEventListener('click', function () { tabWorld = i; buildLevelsPanel(); });
            tabs.appendChild(b);
        });

        var from = WORLDS[tabWorld].from;
        var to = (tabWorld + 1 < WORLDS.length ? WORLDS[tabWorld + 1].from : RAW.length) - 1;
        grid.innerHTML = '';
        for (var i = from; i <= to; i++) {
            (function (idx) {
                var open = store.unlocked(idx);
                var got = store.starsOf(idx);
                var b = document.createElement('button');
                b.className = 'lv' + (open ? '' : ' locked') + (got ? ' done' : '');
                b.innerHTML = '<span class="lv-num">' + (open ? (idx + 1) : '🔒') + '</span>' +
                    '<span class="lv-stars">' +
                    [0, 1, 2].map(function (k) {
                        return '<i class="lv-star' + (k < got ? ' lit' : '') + '">★</i>';
                    }).join('') + '</span>';
                if (open) b.addEventListener('click', function () { UI.start(idx, 1); });
                grid.appendChild(b);
            })(i);
        }
    }

    function openLevels() {
        G.mode = 'levels';
        tabWorld = worldOf(G.level);
        buildLevelsPanel();
        hideAll();
        UI.chips.forEach(function (c) { if (c) c.hidden = true; });
        show(el('levels-overlay'));
    }

    /* Màn cho hai bé thi: chọn trong đám màn ít ván, và hai bé nhận ĐÚNG một
     * màn giống nhau — thi mà mỗi bé một đề thì thắng thua chẳng nói lên gì. */
    function raceLevel() {
        var pool = [];
        for (var i = 0; i < RAW.length; i++) if (RAW[i].p.length <= RACE_MAX_PLATES) pool.push(i);
        if (!pool.length) return 0;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function wireButtons() {
        var kidBtns = Array.prototype.slice.call(document.querySelectorAll('[data-kids]'));
        kidBtns.forEach(function (b) {
            b.addEventListener('click', function () {
                kidBtns.forEach(function (x) { x.classList.remove('is-on'); });
                b.classList.add('is-on');
                G.kids = +b.dataset.kids;
            });
        });

        el('btn-play').addEventListener('click', function () {
            sfx.wake();
            if (G.kids > 1) UI.start(raceLevel(), 2);
            else UI.start(Math.min(store.data.done, RAW.length - 1), 1);
        });
        el('btn-menu-levels').addEventListener('click', openLevels);
        el('btn-nav-levels').addEventListener('click', openLevels);
        el('btn-nav-menu').addEventListener('click', openMenu);
        el('btn-nav-undo').addEventListener('click', function () { UI.undo(0); });
        el('btn-nav-hint').addEventListener('click', function () { UI.hint(0); });
        el('btn-nav-restart').addEventListener('click', function () { UI.start(G.level, G.kids); });
        el('btn-levels-back').addEventListener('click', function () {
            if (G.boards.length) UI.start(G.level, G.kids); else openMenu();
        });
        el('btn-reset-progress').addEventListener('click', function () { store.reset(); buildLevelsPanel(); });
        el('btn-next').addEventListener('click', function () {
            UI.start(Math.min(G.level + 1, RAW.length - 1), 1);
        });
        el('btn-finish').addEventListener('click', openLevels);
        el('btn-replay').addEventListener('click', function () { UI.start(G.level, 1); });
        el('btn-win-levels').addEventListener('click', openLevels);
        el('btn-duo-again').addEventListener('click', function () { UI.start(raceLevel(), 2); });
        el('btn-duo-menu').addEventListener('click', openMenu);

        var markBtn = el('btn-marks');
        function paintMarks() {
            markBtn.classList.toggle('is-on', G.marks);
            markBtn.textContent = G.marks ? 'Colour marks: ON' : 'Colour marks: OFF';
        }
        markBtn.addEventListener('click', function () {
            G.marks = !G.marks;
            try { localStorage.setItem(MARK_KEY, G.marks ? '1' : '0'); } catch (e) { }
            paintMarks();
            if (G.mode === 'play') UI.rebuild();
        });
        paintMarks();

        var soundBtn = el('btn-sound'), soundIcon = el('sound-icon');
        function paintSound() {
            soundIcon.className = 'fa-solid ' + (sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
            soundBtn.classList.toggle('is-off', !sfx.on);
        }
        soundBtn.addEventListener('click', function () { sfx.wake(); sfx.toggle(); paintSound(); });
        paintSound();
    }

    /* ========================================================================
     *  8. KHỞI ĐỘNG
     * ======================================================================*/

    function init() {
        store.load();
        sfx.init();
        try { G.marks = localStorage.getItem(MARK_KEY) !== '0'; } catch (e) { }

        wireButtons();
        openMenu();

        window.addEventListener('resize', function () {
            if (UI.scene && G.mode === 'play') UI.placeChips(UI.scene.boardRects());
        });
        window.addEventListener('orientationchange', function () {
            setTimeout(function () { UI.relayout(); }, 220);
        });

        var q = new URLSearchParams(location.search);
        var wantLevel = +(q.get('level') || 0);
        var wantKids = +(q.get('kids') || 0);
        if (wantKids === 2) setTimeout(function () { UI.start(raceLevel(), 2); }, 0);
        else if (wantLevel >= 1 && wantLevel <= RAW.length) {
            setTimeout(function () { UI.start(wantLevel - 1, 1); }, 0);
        }

        window.screwJam = {
            G: G, RAW: RAW, R: R, store: store, UI: UI, WORLDS: WORLDS,
            start: function (n, kids) { UI.start(Math.max(0, Math.min(RAW.length - 1, n - 1)), kids || 1); },
            tap: function (bi, k) { UI.tapScrew(bi || 0, k); },
            /* Chơi hộ một nước, dùng cho máy soát giao diện */
            state: function () {
                return {
                    mode: G.mode, kids: G.kids, level: G.level + 1,
                    boards: G.boards.map(function (b) {
                        var left = 0;
                        for (var k = 0; k < b.level.screws.length; k++) if (!b.removed[k]) left++;
                        return { moves: b.moves, left: left, hold: b.hold.slice(), won: b.won };
                    })
                };
            }
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
