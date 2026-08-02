/* ============================================================================
 * FLIP FRENZY — lật hai lá, giống nhau là của mình
 * ----------------------------------------------------------------------------
 * Trò lật hình tìm cặp kinh điển, làm cho 1-4 bé chơi chung một máy. Luật chỉ
 * có một câu nên bé 4 tuổi vào là chơi được ngay; phần ganh đua nằm ở chỗ tìm
 * trúng cặp thì được đi tiếp, và ở hai lá đặc biệt:
 *      ⭐ cặp vàng   → ăn 2 điểm
 *      🎁 cặp quà    → ăn 1 điểm VÀ cướp 1 điểm của bé đang dẫn đầu
 *
 * Chạy trên Phaser 3 ở chế độ Scale.RESIZE chứ không phải FIT: bàn bài tự xếp
 * lại theo đúng khung đang có, nên cầm điện thoại dọc thì lưới cao và hẹp, cầm
 * ngang thì thấp và rộng — lá bài lúc nào cũng to hết mức. Với một trò phải
 * nhìn rõ hình thì điều đó quan trọng hơn là giữ khung hình cố định.
 *
 * Bố cục file:
 *   1. Hằng số: bộ hình, cỡ bàn, màu người chơi
 *   2. Âm thanh tổng hợp bằng WebAudio
 *   3. Scene Phaser: dựng bài, xếp lưới, lật, chấm điểm, máy đi
 *   4. Nối với các bảng HTML bao quanh
 * ==========================================================================*/
(function () {
    'use strict';

    /* ================================================================== *
     * 1. HẰNG SỐ
     * ================================================================== */

    /* Dùng emoji làm mặt bài: không phải tải ảnh nào, nét lúc nào cũng sắc ở
       mọi cỡ màn, và bé nhận ra con vật ngay không cần biết chữ. */
    var THEMES = [
        { name: 'Animals',       cards: ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐷', '🐔', '🐧', '🦄'] },
        { name: 'Fruit',         cards: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍑', '🍍', '🥝', '🍒', '🥥', '🍋', '🍊', '🥕', '🌽', '🍄'] },
        { name: 'Vehicles',      cards: ['🚗', '🚕', '🚌', '🚓', '🚑', '🚒', '🚚', '🚜', '🏎️', '🚲', '🛵', '✈️', '🚁', '🚂', '🚀'] },
        { name: 'Under the sea', cards: ['🐠', '🐟', '🐬', '🐳', '🦈', '🐙', '🦀', '🦞', '🐚', '🐢', '🦑', '🐊', '🦭', '🪸', '🐡'] },
        { name: 'Silly faces',   cards: ['😀', '😂', '😍', '😎', '🤪', '😴', '🤩', '😜', '🥳', '🤠', '😇', '🙃', '😱', '🤗', '😺'] }
    ];

    var GOLD = '⭐', GIFT = '🎁';

    /* [số cặp, nhãn] — số lá luôn chẵn vì mỗi hình có đúng hai lá */
    var SIZES = [6, 8, 12, 15];

    var COLORS = [0xff6b6b, 0x4dabf7, 0x51cf66, 0xffd43b];
    var COLORS_CSS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b'];

    /* Cặp đã ăn được nhuộm màu của bé giành được nó, nhưng nhuộm nhạt thôi —
       tint của Phaser là phép nhân, tô đậm quá thì hình trên lá tối sầm. */
    function pastel(c, k) {
        var r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
        r = Math.round(r + (255 - r) * k);
        g = Math.round(g + (255 - g) * k);
        b = Math.round(b + (255 - b) * k);
        return (r << 16) | (g << 8) | b;
    }
    var OWNER_TINT = COLORS.map(function (c) { return pastel(c, 0.58); });

    /* Máy nhớ được bao nhiêu phần lá đã lật qua. Mức dễ để rất thấp: máy nhớ
       được cái gì thì nhớ chính xác tuyệt đối, nên chỉ cần nhớ một phần ba là
       nó đã chơi hơn hẳn bé bốn tuổi rồi. */
    var AI_MEMORY = { easy: 0.18, normal: 0.55, hard: 0.95 };

    var BACK_KEY = 'ff-back', FACE_KEY = 'ff-face';

    /* ================================================================== *
     * 2. ÂM THANH
     * ================================================================== */

    var Sfx = {
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
            var ac = this.ctx(); if (!ac) return;
            var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(f, t);
            if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol || 0.07, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + d);
            o.connect(g); g.connect(ac.destination);
            o.start(t); o.stop(t + d + 0.02);
        },
        flip: function () { this.tone(520, 0.07, 'triangle', 0.05, 780); },
        match: function () { var s = this; [660, 880].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.13, 'triangle', 0.08); }, i * 80); }); },
        miss: function () { this.tone(300, 0.14, 'sine', 0.05, 180); },
        gold: function () { var s = this; [784, 988, 1319].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.16, 'triangle', 0.09); }, i * 70); }); },
        gift: function () { var s = this; [880, 660, 1046].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.14, 'square', 0.06); }, i * 75); }); },
        tick: function () { this.tone(900, 0.04, 'square', 0.03); },
        turn: function () { this.tone(440, 0.09, 'sine', 0.045, 620); },
        win: function () { var s = this; [523, 659, 784, 1046, 1318].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.24, 'triangle', 0.09); }, i * 95); }); }
    };

    /* ================================================================== *
     * 3. SCENE
     * ================================================================== */

    function $(id) { return document.getElementById(id); }

    function shuffle(a) {
        var i, j, t;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    class TableScene extends Phaser.Scene {
        constructor() { super('table'); }

        create() {
            var self = this;
            this.cards = [];
            this.flipped = [];
            this.busy = true;
            this.cardW = 0; this.cardH = 0;

            this.bg = this.add.graphics().setDepth(0);

            var g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8);
            g.generateTexture('ff-px', 8, 8);
            g.destroy();

            /* Dựng sẵn hai texture mặt bài: thẻ được tạo trước khi layout chạy,
               mà tạo Image trỏ vào texture chưa có thì Phaser gắn ảnh "thiếu". */
            this.makeCardTextures(100, 132);
            this.cardW = 100; this.cardH = 132;

            this.scale.on('resize', function () { self.layout(); });
            UI.sceneReady(this);
        }

        /* ---------------- dựng bộ bài ---------------- */
        deal(cfg) {
            var i, faces, pool, deck = [], self = this;

            this.cards.forEach(function (c) { c.obj.destroy(); });
            this.cards = [];
            this.flipped = [];
            this.busy = false;

            pool = THEMES[cfg.theme].cards.slice();
            faces = shuffle(pool).slice(0, cfg.pairs);

            /* Từ 8 cặp trở lên mới cài lá đặc biệt: bàn 6 cặp mà có tới hai lá
               phép thì gần như cặp nào cũng đặc biệt, mất hết bất ngờ. */
            if (cfg.pairs >= 8) {
                faces[0] = GOLD;
                faces[1] = GIFT;
            } else if (cfg.pairs >= 6) {
                faces[0] = GOLD;
            }

            for (i = 0; i < faces.length; i++) {
                deck.push({ face: faces[i], pair: i });
                deck.push({ face: faces[i], pair: i });
            }
            shuffle(deck);

            for (i = 0; i < deck.length; i++) {
                this.cards.push(this.makeCard(deck[i].face, deck[i].pair, i));
            }

            this.layout();

            /* Cho xem trước cả bàn một nhịp ngắn: bé nào cũng thích, và nó biến
               ván đầu từ đoán mò thành có trí nhớ thật để dùng. */
            this.busy = true;
            this.cards.forEach(function (c, k) {
                self.time.delayedCall(k * 12, function () { self.setFace(c, true, true); });
            });
            this.time.delayedCall(deck.length * 12 + 1100, function () {
                self.cards.forEach(function (c, k) {
                    self.time.delayedCall(k * 10, function () { self.setFace(c, false, true); });
                });
                self.time.delayedCall(deck.length * 10 + 320, function () {
                    self.busy = false;
                    UI.startTurn();
                });
            });
        }

        makeCard(face, pair, index) {
            var self = this;
            var bg = this.add.image(0, 0, BACK_KEY);
            var txt = this.add.text(0, 0, face, {
                fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
                fontSize: '48px'
            }).setOrigin(0.5).setVisible(false);
            var cont = this.add.container(0, 0, [bg, txt]).setDepth(2);
            var card = { face: face, pair: pair, index: index, up: false, done: false, obj: cont, bg: bg, txt: txt };

            cont.setSize(10, 10);
            cont.setInteractive(new Phaser.Geom.Rectangle(-5, -5, 10, 10), Phaser.Geom.Rectangle.Contains);
            cont.on('pointerdown', function () { self.tap(card); });
            return card;
        }

        /* ---------------- xếp lưới ----------------
           Chọn số cột sao cho lá bài to nhất có thể trong khung đang có. Khung
           dọc sẽ tự ra ít cột nhiều hàng, khung ngang thì ngược lại. */
        layout() {
            var W = this.scale.width, H = this.scale.height;
            if (!this.cards.length || W < 60 || H < 60) return;

            var n = this.cards.length, pad = Math.max(6, Math.min(W, H) * 0.02);
            var ratio = 0.76;                       /* rộng / cao của một lá */
            var best = null, cols, rows, cw, ch, size;

            for (cols = 1; cols <= n; cols++) {
                rows = Math.ceil(n / cols);
                cw = (W - pad * (cols + 1)) / cols;
                ch = (H - pad * (rows + 1)) / rows;
                if (cw <= 0 || ch <= 0) continue;
                size = Math.min(cw, ch * ratio);
                if (!best || size > best.size) best = { cols: cols, rows: rows, size: size };
            }
            if (!best) return;

            var w = Math.floor(best.size), h = Math.floor(best.size / ratio);
            var gridW = best.cols * w + pad * (best.cols - 1);
            var gridH = best.rows * h + pad * (best.rows - 1);
            var x0 = (W - gridW) / 2 + w / 2, y0 = (H - gridH) / 2 + h / 2;

            this.gridCols = best.cols; this.gridRows = best.rows;

            if (w !== this.cardW || h !== this.cardH) {
                this.makeCardTextures(w, h);
                this.cardW = w; this.cardH = h;
            }

            this.drawTable(W, H);

            for (var i = 0; i < n; i++) {
                var c = this.cards[i];
                var r = Math.floor(i / best.cols), cc = i % best.cols;
                /* hàng cuối thiếu lá thì căn giữa cho khỏi lệch hẳn sang trái */
                var inRow = Math.min(best.cols, n - r * best.cols);
                var offset = (best.cols - inRow) * (w + pad) / 2;
                c.obj.x = x0 + cc * (w + pad) + offset;
                c.obj.y = y0 + r * (h + pad);
                c.bg.setTexture(c.up || c.done ? FACE_KEY : BACK_KEY);
                c.bg.setDisplaySize(w, h);
                if (c.owner !== undefined) c.bg.setTint(OWNER_TINT[c.owner]);
                else c.bg.clearTint();
                c.txt.setFontSize(Math.floor(h * 0.46));
                c.txt.setVisible(c.up || c.done);
                c.obj.setSize(w, h);
                c.obj.input.hitArea.setTo(-w / 2, -h / 2, w, h);
            }
        }

        /* Vẽ lại hai texture đúng bằng cỡ lá bài đang dùng. Nếu vẽ một lần rồi
           kéo giãn thì góc bo và đường viền méo theo. */
        makeCardTextures(w, h) {
            var g = this.make.graphics({ x: 0, y: 0, add: false });
            var r = Math.max(6, Math.min(w, h) * 0.14);

            if (this.textures.exists(BACK_KEY)) this.textures.remove(BACK_KEY);
            if (this.textures.exists(FACE_KEY)) this.textures.remove(FACE_KEY);

            /* mặt úp: nền tím, viền sáng, hoa văn dấu hỏi mờ */
            g.fillStyle(0x6d4bd8, 1); g.fillRoundedRect(0, 0, w, h, r);
            g.fillStyle(0x8b6bf0, 1); g.fillRoundedRect(w * 0.07, h * 0.05, w * 0.86, h * 0.9, r * 0.8);
            g.lineStyle(Math.max(2, w * 0.035), 0xd9c9ff, 1);
            g.strokeRoundedRect(w * 0.07, h * 0.05, w * 0.86, h * 0.9, r * 0.8);
            g.fillStyle(0xffffff, 0.18);
            g.fillCircle(w * 0.5, h * 0.42, Math.min(w, h) * 0.17);
            g.fillStyle(0xffffff, 0.28);
            g.fillCircle(w * 0.5, h * 0.68, Math.max(2, Math.min(w, h) * 0.05));
            g.generateTexture(BACK_KEY, w, h);

            /* mặt ngửa: nền trắng ngà cho emoji nổi lên */
            g.clear();
            g.fillStyle(0x120a2a, 0.35); g.fillRoundedRect(0, h * 0.03, w, h, r);
            g.fillStyle(0xfff8ee, 1); g.fillRoundedRect(0, 0, w, h, r);
            g.lineStyle(Math.max(2, w * 0.03), 0xffd9a8, 1);
            g.strokeRoundedRect(1, 1, w - 2, h - 2, r);
            g.generateTexture(FACE_KEY, w, h);

            g.destroy();
        }

        drawTable(W, H) {
            var g = this.bg;
            g.clear();
            g.fillStyle(0x241552, 1); g.fillRect(0, 0, W, H);
            /* vài đốm sáng mờ cho nền đỡ phẳng */
            for (var i = 0; i < 12; i++) {
                var x = ((i * 137) % 100) / 100 * W, y = ((i * 71) % 100) / 100 * H;
                g.fillStyle(0xffffff, 0.03);
                g.fillCircle(x, y, Math.min(W, H) * (0.04 + (i % 4) * 0.02));
            }
        }

        /* ---------------- lật bài ---------------- */
        setFace(card, up, silent) {
            var self = this;
            if (card.done && !up) return;
            card.up = up;
            if (!silent) Sfx.flip();
            this.tweens.add({
                targets: card.obj, scaleX: 0, duration: 110, ease: 'Quad.In',
                onComplete: function () {
                    card.bg.setTexture(up ? FACE_KEY : BACK_KEY);
                    card.bg.setDisplaySize(self.cardW, self.cardH);
                    if (card.owner !== undefined) card.bg.setTint(OWNER_TINT[card.owner]);
                    else card.bg.clearTint();
                    card.txt.setVisible(up);
                    self.tweens.add({ targets: card.obj, scaleX: 1, duration: 130, ease: 'Quad.Out' });
                }
            });
        }

        tap(card) {
            if (this.busy || card.up || card.done) return;
            if (UI.current().isAI) return;             /* lượt của máy, bé đừng chen */
            this.pick(card);
        }

        /* Cửa vào duy nhất để lật một lá. Trước đây chỉ có tap() và FF.flip()
           kiểm tra điều kiện, còn máy gọi thẳng pick() qua hẹn giờ — nên máy
           lật được lá thứ ba lúc cặp trước đang chờ so, judge() lấy nhầm cặp,
           một lá kẹt ngửa vĩnh viễn và busy không ai gỡ. */
        pick(card) {
            var self = this;
            if (this.busy || card.up || card.done || this.flipped.length >= 2) return false;
            this.setFace(card, true);
            this.flipped.push(card);
            UI.remember(card);

            if (this.flipped.length === 2) {
                this.busy = true;
                UI.stopClock();
                this.time.delayedCall(420, function () { self.judge(); });
            }
            return true;
        }

        judge() {
            var self = this;
            var a = this.flipped[0], b = this.flipped[1];
            this.flipped = [];

            if (a.pair === b.pair) {
                a.done = b.done = true;
                a.owner = b.owner = UI.turn;
                a.bg.setTint(OWNER_TINT[a.owner]);
                b.bg.setTint(OWNER_TINT[b.owner]);
                this.celebrate(a); this.celebrate(b);
                UI.scored(a.face);
                this.time.delayedCall(520, function () {
                    if (self.remaining() === 0) { UI.finish(); return; }
                    self.busy = false;
                    UI.startTurn();                     /* ăn được thì đi tiếp */
                });
            } else {
                Sfx.miss();
                this.shake(a); this.shake(b);
                this.time.delayedCall(680, function () {
                    self.setFace(a, false); self.setFace(b, false);
                    self.time.delayedCall(260, function () {
                        self.busy = false;
                        UI.nextPlayer();
                    });
                });
            }
        }

        remaining() {
            var n = 0;
            for (var i = 0; i < this.cards.length; i++) if (!this.cards[i].done) n++;
            return n;
        }

        celebrate(card) {
            var color = card.face === GOLD ? 0xffd43b : (card.face === GIFT ? 0xff9de2 : 0x7ee081);
            var em = this.add.particles(card.obj.x, card.obj.y, 'ff-px', {
                speed: { min: 60, max: 260 }, angle: { min: 0, max: 360 },
                lifespan: { min: 300, max: 700 }, scale: { start: 1.1, end: 0 },
                gravityY: 260, tint: color, emitting: false
            }).setDepth(6);
            em.explode(card.face === GOLD || card.face === GIFT ? 26 : 14);
            this.time.delayedCall(1000, function () { em.destroy(); });

            this.tweens.add({
                targets: card.obj, scaleX: 1.16, scaleY: 1.16, duration: 160,
                yoyo: true, ease: 'Quad.Out'
            });
        }

        shake(card) {
            var x = card.obj.x;
            this.tweens.add({
                targets: card.obj, x: x - 7, duration: 60, yoyo: true, repeat: 2,
                onComplete: function () { card.obj.x = x; }
            });
        }

        confetti() {
            var W = this.scale.width;
            var em = this.add.particles(W / 2, -20, 'ff-px', {
                x: { min: 0, max: W }, speedY: { min: 120, max: 340 },
                speedX: { min: -70, max: 70 }, lifespan: 2600,
                scale: { start: 1.5, end: 0.4 }, rotate: { min: 0, max: 360 },
                tint: [0xffd43b, 0xff6b6b, 0x4dabf7, 0x51cf66, 0xff9de2],
                quantity: 4, frequency: 40
            }).setDepth(9);
            this.time.delayedCall(1500, function () { em.stop(); });
            this.time.delayedCall(4500, function () { em.destroy(); });
        }

        /* ---------------- lượt của máy ----------------
           Mỗi lượt mang một mã (token). Hẹn giờ của máy kiểm tra mã trước khi
           lật: hết giờ, bé bấm chia lại bài hay lượt đã sang người khác thì
           nước đi cũ tự huỷ chứ không lật bừa vào ván đang chạy. */
        aiTurn(mem, token) {
            var self = this;
            this.time.delayedCall(700, function () {
                if (UI.token !== token) return;
                var first = self.aiFirst(mem);
                if (!first || !self.pick(first)) return;
                self.time.delayedCall(750, function () {
                    if (UI.token !== token) return;
                    /* Chọn lá thứ hai SAU khi đã thấy lá đầu, y như bé chơi
                       thật: nhớ chỗ lá cùng hình thì lật trúng luôn. */
                    var second = self.aiSecond(mem, first);
                    if (second) self.pick(second);
                });
            });
        }

        aiFirst(mem) {
            var byFace = {}, unknown = [], i, c, k;
            for (i = 0; i < this.cards.length; i++) {
                c = this.cards[i];
                if (c.done || c.up) continue;
                if (mem[c.index] !== undefined) (byFace[mem[c.index]] = byFace[mem[c.index]] || []).push(c);
                else unknown.push(c);
            }
            /* nhớ được nguyên một cặp thì mở lá đầu của cặp đó */
            for (k in byFace) if (byFace.hasOwnProperty(k) && byFace[k].length >= 2) return byFace[k][0];
            if (unknown.length) return unknown[Math.floor(Math.random() * unknown.length)];
            for (k in byFace) if (byFace.hasOwnProperty(k)) return byFace[k][0];
            return null;
        }

        aiSecond(mem, first) {
            var i, c, rest = [], unknown = [];
            for (i = 0; i < this.cards.length; i++) {
                c = this.cards[i];
                if (c === first || c.done || c.up) continue;
                if (mem[c.index] === first.face) return c;      /* nhớ đúng chỗ */
                if (mem[c.index] === undefined) unknown.push(c);
                rest.push(c);
            }
            if (unknown.length) return unknown[Math.floor(Math.random() * unknown.length)];
            return rest.length ? rest[Math.floor(Math.random() * rest.length)] : null;
        }
    }

    /* ================================================================== *
     * 4. NỐI VỚI CÁC BẢNG HTML
     * ================================================================== */

    var UI = {
        game: null, scene: null, pending: false,
        cfg: { players: 2, ai: 'easy', size: 1, theme: 0, clock: 12 },
        players: [], turn: 0, streak: 0, token: 0,
        clockEnd: 0, clockOn: false,

        init: function () {
            var self = this;

            this.wireChips('chips-players', 'players', function (v) { return parseInt(v, 10); }, function () { self.syncRows(); });
            this.wireChips('chips-ai', 'ai', function (v) { return v; });
            this.wireChips('chips-size', 'size', function (v) { return parseInt(v, 10); });
            this.wireChips('chips-theme', 'theme', function (v) { return parseInt(v, 10); });
            this.wireChips('chips-clock', 'clock', function (v) { return parseInt(v, 10); });

            $('btn-start').addEventListener('click', function () { self.start(); });
            $('btn-again').addEventListener('click', function () { self.hideOverlays(); self.start(); });
            $('btn-menu').addEventListener('click', function () { self.showMenu(); });
            $('btn-nav-menu').addEventListener('click', function () { self.showMenu(); });
            $('btn-nav-again').addEventListener('click', function () {
                if (self.scene) { self.hideOverlays(); self.start(); }
            });

            this.syncRows();
        },

        wireChips: function (boxId, key, parse, after) {
            var self = this, box = $(boxId);
            box.addEventListener('click', function (ev) {
                var b = ev.target.closest('.chip');
                if (!b) return;
                [].slice.call(box.querySelectorAll('.chip')).forEach(function (c) { c.classList.remove('is-on'); });
                b.classList.add('is-on');
                self.cfg[key] = parse(b.dataset[key] !== undefined ? b.dataset[key] : b.dataset[Object.keys(b.dataset)[0]]);
                Sfx.ctx();
                if (after) after();
            });
        },

        /* Hàng chọn trí nhớ của máy chỉ có nghĩa khi chơi một mình với máy */
        syncRows: function () {
            $('row-ai').classList.toggle('hidden', this.cfg.players !== 1);
        },

        hideOverlays: function () {
            $('menu-overlay').classList.add('hidden');
            $('end-overlay').classList.add('hidden');
        },

        showMenu: function () {
            this.stopClock();
            $('end-overlay').classList.add('hidden');
            $('menu-overlay').classList.remove('hidden');
            $('scoreboard').classList.add('hidden');
            $('turnbar').classList.add('hidden');
        },

        start: function () {
            var i, n = this.cfg.players;
            Sfx.ctx();
            this.hideOverlays();

            this.players = [];
            if (n === 1) {
                this.players.push({ name: 'Me', color: COLORS_CSS[0], score: 0, isAI: false, mem: {} });
                this.players.push({ name: 'Robot', color: COLORS_CSS[1], score: 0, isAI: true, mem: {} });
            } else {
                for (i = 0; i < n; i++) {
                    this.players.push({ name: 'Kid ' + (i + 1), color: COLORS_CSS[i], score: 0, isAI: false, mem: {} });
                }
            }
            this.turn = 0;
            this.streak = 0;
            this.token++;   /* huỷ mọi nước máy còn treo từ ván trước */

            $('scoreboard').classList.remove('hidden');
            $('turnbar').classList.toggle('hidden', !this.cfg.clock);
            this.renderScores();

            if (!this.game) {
                this.pending = true;
                this.game = new Phaser.Game({
                    type: Phaser.AUTO,
                    parent: 'game-canvas',
                    backgroundColor: '#241552',
                    /* RESIZE chứ không phải FIT: bàn bài xếp lại theo khung thật
                       nên không bao giờ có dải đen, và lá bài to hết cỡ. */
                    scale: {
                        mode: Phaser.Scale.RESIZE,
                        autoCenter: Phaser.Scale.NO_CENTER,
                        width: '100%', height: '100%'
                    },
                    scene: [TableScene],
                    banner: false
                });
            } else {
                this.scene.deal({ pairs: SIZES[this.cfg.size], theme: this.cfg.theme });
            }
        },

        sceneReady: function (scene) {
            this.scene = scene;
            if (this.pending) {
                this.pending = false;
                scene.deal({ pairs: SIZES[this.cfg.size], theme: this.cfg.theme });
            }
            exposeDebug();
        },

        current: function () { return this.players[this.turn] || { isAI: false }; },

        leader: function () {
            var best = 0, i;
            for (i = 1; i < this.players.length; i++) {
                if (this.players[i].score > this.players[best].score) best = i;
            }
            return best;
        },

        /* Mọi người chơi đều "nhìn thấy" lá vừa lật; máy chỉ nhớ được một phần
           tuỳ mức đã chọn, nên mức dễ đúng là hay quên thật. */
        remember: function (card) {
            var i, p;
            for (i = 0; i < this.players.length; i++) {
                p = this.players[i];
                if (!p.isAI) continue;
                if (Math.random() < AI_MEMORY[this.cfg.ai]) p.mem[card.index] = card.face;
            }
        },

        renderScores: function () {
            var box = $('scoreboard'), i, p, el, lead = this.leader();
            box.innerHTML = '';
            for (i = 0; i < this.players.length; i++) {
                p = this.players[i];
                el = document.createElement('div');
                el.className = 'pl' + (i === this.turn ? ' is-turn' : '');
                el.style.borderColor = i === this.turn ? p.color : 'transparent';
                el.innerHTML = '<span class="pl-dot" style="background:' + p.color + '">'
                    + (p.isAI ? '🤖' : '') + '</span>'
                    + '<span class="pl-name"></span>'
                    + (this.players[i].score === this.players[lead].score && this.players[lead].score > 0
                        ? '<span class="pl-crown">👑</span>' : '')
                    + '<span class="pl-score">' + p.score + '</span>';
                el.querySelector('.pl-name').textContent = p.name;
                box.appendChild(el);
            }
        },

        banner: function (txt) {
            var b = $('banner');
            b.textContent = txt;
            b.classList.remove('hidden');
            b.style.animation = 'none';
            void b.offsetWidth;
            b.style.animation = '';
            clearTimeout(this.bannerTimer);
            this.bannerTimer = setTimeout(function () { b.classList.add('hidden'); }, 1400);
        },

        scored: function (face) {
            var p = this.players[this.turn], gain = 1, lead;
            this.streak++;

            if (face === GOLD) { gain = 2; Sfx.gold(); this.banner('GOLDEN PAIR! +2'); }
            else if (face === GIFT) {
                Sfx.gift();
                lead = this.leader();
                if (lead !== this.turn && this.players[lead].score > 0) {
                    this.players[lead].score--;
                    this.banner('GIFT PAIR! You stole a point');
                } else {
                    this.banner('GIFT PAIR! +1');
                }
            } else {
                Sfx.match();
                if (this.streak >= 2) { gain = 2; this.banner('STREAK x' + this.streak + '! +1 bonus'); }
            }

            p.score += gain;
            this.renderScores();
        },

        nextPlayer: function () {
            this.streak = 0;
            this.turn = (this.turn + 1) % this.players.length;
            Sfx.turn();
            this.renderScores();
            this.startTurn();
        },

        startTurn: function () {
            var p = this.current();
            this.token++;
            this.renderScores();
            if (p.isAI) {
                this.stopClock();
                this.scene.aiTurn(p.mem, this.token);
            } else {
                this.beginClock();
            }
        },

        beginClock: function () {
            if (!this.cfg.clock) { this.clockOn = false; return; }
            this.clockOn = true;
            this.clockEnd = Date.now() + this.cfg.clock * 1000;
            this.lastTick = 99;
        },

        stopClock: function () {
            this.clockOn = false;
            $('turnbar-fill').style.width = '100%';
            $('turnbar-fill').classList.remove('low');
        },

        /* Gọi mỗi khung hình từ scene: hết giờ thì úp lá đang mở và mất lượt */
        tickClock: function () {
            if (!this.clockOn) return;
            var left = this.clockEnd - Date.now();
            var pct = Math.max(0, left / (this.cfg.clock * 1000));
            var fill = $('turnbar-fill');
            fill.style.width = (pct * 100).toFixed(1) + '%';
            fill.classList.toggle('low', pct < 0.3);

            var secs = Math.ceil(left / 1000);
            if (secs <= 3 && secs !== this.lastTick && secs > 0) { Sfx.tick(); this.lastTick = secs; }

            if (left <= 0) {
                this.clockOn = false;
                this.timeUp();
            }
        },

        timeUp: function () {
            var sc = this.scene;
            this.banner("Time's up!");
            sc.busy = true;
            sc.flipped.forEach(function (c) { sc.setFace(c, false); });
            sc.flipped = [];
            sc.time.delayedCall(420, function () {
                sc.busy = false;
                UI.nextPlayer();
            });
        },

        finish: function () {
            var self = this;
            this.stopClock();
            $('turnbar').classList.add('hidden');
            Sfx.win();
            this.scene.confetti();

            var order = this.players.map(function (p, i) { return { p: p, i: i }; });
            order.sort(function (a, b) { return b.p.score - a.p.score; });

            var top = order[0].p.score;
            var winners = order.filter(function (o) { return o.p.score === top; });

            $('end-title').textContent = winners.length > 1 ? "IT'S A TIE!" : 'WINNER!';

            var box = $('podium'), i, row, medal = ['🥇', '🥈', '🥉', '4️⃣'];
            box.innerHTML = '';
            for (i = 0; i < order.length; i++) {
                row = document.createElement('div');
                row.className = 'pod' + (order[i].p.score === top ? ' first' : '');
                row.innerHTML = '<span class="pod-rank">' + medal[i] + '</span>'
                    + '<span class="pod-name"></span>'
                    + '<span class="pod-score">' + order[i].p.score + '</span>';
                row.querySelector('.pod-name').textContent = order[i].p.name;
                box.appendChild(row);
            }

            setTimeout(function () { $('end-overlay').classList.remove('hidden'); }, 900);
        }
    };

    /* Scene gọi ra mỗi khung hình để đồng hồ lượt chạy */
    TableScene.prototype.update = function () { UI.tickClock(); };

    /* Cổng gỡ lỗi cho kiểm thử tự động, chỉ mở khi địa chỉ có ?debug=1 */
    function exposeDebug() {
        if (!/[?&]debug=1/.test(location.search)) return;
        window.FF = {
            scene: function () { return UI.scene; },
            state: function () {
                var s = UI.scene;
                return {
                    conLai: s.remaining(), tongLa: s.cards.length,
                    luot: UI.turn, ban: s.busy, dangLat: s.flipped.length,
                    diem: UI.players.map(function (p) { return p.score; }),
                    ten: UI.players.map(function (p) { return p.name; }),
                    may: UI.players.map(function (p) { return !!p.isAI; })
                };
            },
            /* toạ độ tâm từng lá, để bấm chuột thật vào đúng chỗ */
            spots: function () {
                var c = document.querySelector('#game-canvas canvas').getBoundingClientRect();
                return UI.scene.cards.map(function (k) {
                    return { i: k.index, face: k.face, done: k.done, up: k.up,
                             x: c.left + k.obj.x, y: c.top + k.obj.y };
                });
            },
            /* lật thẳng một lá, bỏ qua chuột — dùng để chạy nhanh cả ván */
            flip: function (i) {
                var s = UI.scene, k = s.cards[i];
                if (s.busy || k.up || k.done) return false;
                s.pick(k); return true;
            },
            cfg: function () { return UI.cfg; },
            /* Lấy thẳng số cột/hàng mà layout đã chọn. Đếm số toạ độ x khác
               nhau là sai: hàng cuối thiếu lá được căn giữa nên nó sinh ra một
               bộ x riêng, làm số cột đếm được phồng lên. */
            grid: function () {
                return { cot: UI.scene.gridCols, hang: UI.scene.gridRows,
                         rongLa: UI.scene.cardW, caoLa: UI.scene.cardH,
                         khung: Math.round(UI.scene.scale.width) + 'x' + Math.round(UI.scene.scale.height) };
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { UI.init(); });
    } else {
        UI.init();
    }
}());
