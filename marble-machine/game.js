/**
 * CỖ MÁY KỲ QUẶC (Marble Machine) — KIBU Games
 * ----------------------------------------------------------------------------
 * Một cỗ máy dở hơi cao bằng cả màn hình: viên bi thả từ trên nóc, lăn qua dốc
 * trượt, húc đổ hàng domino, lật ván bập bênh, nảy trên bàn nhún, bị quạt thổi
 * bạt sang bên, được băng chuyền chở đi, nam châm hút qua khe — rồi rơi tõm vào
 * cái giỏ ở đáy.
 *
 * Chỉ có điều cỗ máy bị THÁO MẤT vài mảnh. Bé nhặt mảnh trong khay lắp lại cho
 * đúng chỗ đúng chiều, bấm CHẠY, rồi ngồi xem cả dây chuyền chạy một lượt.
 *
 * VÌ SAO LÀM GAME NÀY
 * Anh Hiếu bảo mấy game trước "đơn giản quá", và đúng: mỗi game chỉ có một kiểu
 * vật lý. Ở đây một màn có tới sáu bảy kiểu chuyển động khác nhau chạy nối
 * nhau, mà đồ hoạ vẫn nhẹ vì toàn hình khối.
 *
 * MÀN NÀO CŨNG CHẮC CHẮN LẮP LẠI ĐƯỢC
 * Không màn nào được bịa ra rồi mới đi tìm lời giải. Máy dựng cỗ máy hoàn chỉnh
 * trước, chạy thử cho viên bi về đích thật, rồi mới tháo mảnh ra làm đề bài —
 * lời giải có trước, đề bài có sau. Mở /marble-machine/check-levels.html là
 * thấy máy chạy lại toàn bộ từng màn ngay trước mắt.
 *
 * MỘT BÀI HỌC ĐÃ TRẢ GIÁ Ở GAME TRƯỚC
 * Vật lý phải quay bằng ĐÚNG MỘT đường: stepAll(), nhịp cố định 1/60, và tắt
 * hẳn autoUpdate của Phaser. Ở Máy Gắp Thú em để nhịp vẽ và máy đo cùng quay
 * một cái bánh, thế là cùng một tệp đo ba lần ra ba số khác nhau mà không biết.
 * Ở đây chuyện ấy còn nặng hơn: cả trò chơi là một chuỗi phản ứng, chỉ cần
 * lệch một nhịp là viên bi trượt khỏi mép ván và cả dây chuyền hỏng theo.
 *
 * Bố cục file:
 *   1. Cấu hình   2. Tiến trình   3. Âm thanh   4. Trạng thái
 *   5. Scene Phaser (dựng máy, kéo thả, chạy thử)   6. Giao diện   7. Khởi động
 */
(function () {
    'use strict';

    var M = Phaser.Physics.Matter.Matter;
    var P = window.MarbleParts;
    var LEVELS = window.MarbleLevels || [];

    /* ========================================================================
     *  1. CẤU HÌNH
     * ------------------------------------------------------------------------
     *  Thế giới cố định 720×1220 rồi co cho vừa khung (Scale.FIT). Cỗ máy vốn
     *  cao nên khổ dựng đứng là đúng dáng; điện thoại cầm dọc xem vừa đẹp, máy
     *  tính thì co lại theo chiều cao.
     *
     *  Chiều cao chia làm bốn khoang, và phải chia đủ cho cả bốn:
     *      0…150      bảng số (thẻ HTML nổi bên trên canvas)
     *    150…854      cỗ máy, tối đa bốn tầng
     *    854…946      cái giỏ ở đáy
     *    956…1060     khay mảnh
     *   1060…1220     hàng nút CHẠY (cũng là thẻ HTML)
     *  Hai khoang HTML không co theo canvas nên phải chừa chỗ thật cho chúng;
     *  lần đầu em chừa thiếu, nút CHẠY đè thẳng lên khay mảnh và bé không nhặt
     *  được mảnh nào — ảnh chụp mới thấy.
     * ======================================================================*/

    var W = 720, H = 1220;

    /* Khung máy: bàn chơi nằm giữa, khay mảnh nằm dưới đáy.
     * y và h tính lại theo số tầng của màn, để màn ít tầng vẫn nằm giữa khung
     * chứ không dính lên nóc. */
    var BAYS_MAX = 4;
    var BOARD = { x: 40, y: 150, w: P.BAY_W, h: 0 };
    var TRAY = { y: 956, h: 104 };
    var BASKET = { w: 150, h: 78 };

    var BALL_R = P.BALL_R;
    var SNAP = 110;                // thả mảnh cách ô trống trong ngần này thì hít vào
    /* Ngưỡng phân biệt CHẠM với KÉO, tính bằng đơn vị thế giới.
     *
     * Đây là lỗi anh Hiếu gặp ở màn 3 — màn đầu tiên bắt phải quay ngược chiều
     * mảnh. Em để ngưỡng 18, mà trên điện thoại 720 đơn vị thế giới chỉ trải
     * trên chừng 390 điểm ảnh: một điểm ảnh ngón tay bằng 1,85 đơn vị. Ngón
     * tay rung 10 điểm ảnh khi chạm là đã 18,5 đơn vị — vượt ngưỡng. Thế là
     * bé chạm để quay mảnh, máy hiểu thành kéo, mảnh bật khỏi ô nhảy về khay.
     * Chạm kiểu gì cũng không quay được, màn 3 thành bất khả thi.
     *
     * Em chỉ thử bằng máy nên không bao giờ gặp: máy bấm thì không rung tay.
     * Nay để 46 đơn vị ≈ 25 điểm ảnh ngón tay — rộng hơn cả cỡ rung tay của
     * trẻ con, mà vẫn nhỏ hơn nhiều so với quãng kéo thật. */
    var TAP_SLOP = 46;

    /* Nhịp vật lý: mỗi khung hình chia làm SUB nhịp nhỏ, nên một "đơn vị vận
     * tốc" của Matter là quãng đi trong 1/(60·SUB) giây.
     *
     * Mọi chỗ ĐẶT THẲNG vận tốc cho viên bi (băng chuyền, bàn nhún, đệm nảy)
     * phải quy đổi qua PHYS_HZ, không được chia 60. Em quên đúng chỗ này lúc
     * thêm chia nhịp, thế là ba mảnh ấy mạnh gấp ba: băng chuyền bắn viên bi
     * đi 1.500 ô/giây, mỗi nhịp nhảy 25 ô — xuyên thẳng qua gờ chặn rồi bay ra
     * khỏi thế giới. Anh Hiếu gặp ở màn 11 và tả đúng y: "bi lăn bị biến mất
     * luôn". Bi không biến mất, nó xuyên tường. */
    var SUB = 3;
    var PHYS_HZ = 60 * SUB;
    var RUN_CAP = 22 * 60;         // chạy quá 22 giây thì coi như hỏng
    var STALL_T = 1.4;             // bi nằm im ngần này giây thì coi như tắc

    /* ========================================================================
     *  2. TIẾN TRÌNH
     * ======================================================================*/

    var KEY = 'kibu_marble_machine';

    var store = {
        data: { done: 0, stars: {} },
        load: function () {
            try {
                var raw = localStorage.getItem(KEY);
                if (raw) {
                    var d = JSON.parse(raw);
                    if (d && typeof d === 'object') {
                        this.data.done = d.done || 0;
                        this.data.stars = d.stars || {};
                    }
                }
            } catch (e) { /* trình duyệt khoá localStorage thì chơi vẫn được */ }
        },
        save: function () {
            try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        /* Mở tới màn nào: luôn cho chơi lại màn cũ, và mở sẵn màn kế tiếp */
        unlocked: function (i) { return i <= this.data.done; },
        finish: function (i, tries) {
            if (i >= this.data.done) this.data.done = i + 1;
            /* Ba sao: chạy một phát ăn ngay. Hai sao: sửa một lần. Một sao: về
             * đích là được — không có màn nào bị khoá vì bé chưa đủ giỏi. */
            var s = tries <= 1 ? 3 : (tries <= 3 ? 2 : 1);
            if (!this.data.stars[i] || this.data.stars[i] < s) this.data.stars[i] = s;
            this.save();
            return s;
        },
        totalStars: function () {
            var n = 0;
            for (var k in this.data.stars) n += this.data.stars[k];
            return n;
        },
        reset: function () { this.data = { done: 0, stars: {} }; this.save(); }
    };

    /* ========================================================================
     *  3. ÂM THANH — dựng thẳng bằng WebAudio, không tải tệp nào
     * ======================================================================*/

    var sfx = {
        ctx: null, on: true,
        init: function () {
            try { this.on = localStorage.getItem(KEY + '_sound') !== 'off'; } catch (e) { }
        },
        wake: function () {
            if (!this.ctx) {
                var C = window.AudioContext || window.webkitAudioContext;
                if (C) this.ctx = new C();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        },
        toggle: function () {
            this.on = !this.on;
            try { localStorage.setItem(KEY + '_sound', this.on ? 'on' : 'off'); } catch (e) { }
        },
        blip: function (freq, dur, type, vol) {
            if (!this.on || !this.ctx) return;
            var t = this.ctx.currentTime;
            var o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(vol || 0.06, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        },
        pick: function () { this.blip(660, 0.07, 'triangle', 0.05); },
        drop: function () { this.blip(420, 0.09, 'triangle', 0.06); },
        flip: function () { this.blip(520, 0.06, 'square', 0.035); },
        tick: function () { this.blip(880, 0.04, 'square', 0.03); },
        bounce: function () { this.blip(300, 0.08, 'sine', 0.05); },
        win: function () {
            var self = this;
            [523, 659, 784, 1047].forEach(function (f, i) {
                setTimeout(function () { self.blip(f, 0.16, 'triangle', 0.07); }, i * 105);
            });
        },
        fail: function () { this.blip(180, 0.25, 'sawtooth', 0.045); }
    };

    /* ========================================================================
     *  4. TRẠNG THÁI
     * ======================================================================*/

    var G = {
        mode: 'menu',        // menu | play | won
        level: 0,
        tries: 0,            // số lần bấm CHẠY ở màn này, để tính sao
        running: false,
        placed: {},          // bayIndex → {kind, flip, trayIdx}
        tray: [],            // [{kind, from, used}]
        result: ''           // '' | 'win' | 'stall' | 'timeout' | 'lost'
    };

    /* ========================================================================
     *  5. SCENE PHASER
     * ======================================================================*/

    var PlayScene;

    /* Mảnh nằm nửa trái tầng thì tác động sang PHẢI, nằm nửa phải thì sang
     * TRÁI — tức là luôn cùng chiều viên bi đang chạy. Nhờ vậy lật ngang tầng
     * là mọi lực tự đảo chiều theo, không phải khai lại. */
    function dirOf(s) {
        if (s.dir != null) return s.dir;            // mảnh bé vừa đặt, có chiều rõ ràng
        return s.x < P.BAY_W / 2 ? 1 : -1;          // mảnh gắn sẵn: suy từ chỗ nó nằm
    }

    function definePlayScene() {
        if (PlayScene) return;

        PlayScene = new Phaser.Class({
            Extends: Phaser.Scene,
            initialize: function PlayScene() { Phaser.Scene.call(this, { key: 'play' }); },

            create: function () {
                this.matter.world.setGravity(0, 3.4);

                /* MỘT đường quay bánh duy nhất — xem ghi chú đầu tệp. */
                this.matter.world.autoUpdate = false;
                this.frozen = false;
                this.acc = 0;

                this.gBack = this.add.graphics().setDepth(1);
                this.gMachine = this.add.graphics().setDepth(4);
                this.gGhost = this.add.graphics().setDepth(5);
                this.gBall = this.add.graphics().setDepth(9);
                this.gTray = this.add.graphics().setDepth(12);
                this.gDrag = this.add.graphics().setDepth(20);

                this.bodies = [];        // vật thể của cỗ máy (dựng lại mỗi lần)
                this.movers = [];        // mảnh có tác động lực: quạt, băng, nam châm
                this.ball = null;
                this.puffs = [];         // hạt gió, bụi nảy, tia lửa — chỉ để nhìn
                this.trail = [];         // vệt lăn phía sau viên bi
                this.beltPhase = 0;

                /* Va mạnh thì bung tia lửa và kêu một tiếng. Nghe thì thừa,
                 * nhưng đây chính là thứ làm cỗ máy có "sức nặng": không có nó
                 * viên bi trôi qua mọi thứ êm ru như trong phim câm. */
                M.Events.on(this.matter.world.engine, 'collisionStart', this.onHit.bind(this));

                this.input.on('pointerdown', this.onDown, this);
                this.input.on('pointermove', this.onMove, this);
                this.input.on('pointerup', this.onUp, this);

                UI.sceneReady(this);
            },

            /* ---------------------------------------------------------------
             * DỰNG CỖ MÁY
             * -------------------------------------------------------------*/
            buildLevel: function (idx) {
                this.clearWorld();

                var lv = P.inflate(LEVELS[idx]);
                this.level = lv;
                BOARD.h = lv.bays.length * P.BAY_H;
                BOARD.y = 150 + (BAYS_MAX - lv.bays.length) * P.BAY_H / 2;

                G.tray = P.trayOf(lv);
                G.tray.forEach(function (t) { t.used = false; });
                G.placed = {};
                G.tries = 0;
                G.result = '';
                G.running = false;

                this.buildFrame();
                for (var i = 0; i < lv.bays.length; i++) {
                    var bay = lv.bays[i];
                    this.buildShapes(bay.fixed, bay.top);
                    if (!bay.gone) this.buildSlot(bay, bay.slot);
                }
                this.paintAll();
            },

            onHit: function (ev) {
                if (!this.ball || !G.running) return;
                for (var i = 0; i < ev.pairs.length; i++) {
                    var pr = ev.pairs[i];
                    var other = pr.bodyA === this.ball ? pr.bodyB : (pr.bodyB === this.ball ? pr.bodyA : null);
                    if (!other) continue;
                    var v = Math.hypot(this.ball.velocity.x, this.ball.velocity.y);
                    if (v < 3) continue;
                    var n = Math.min(5, Math.round(v / 2));
                    for (var k = 0; k < n; k++) {
                        this.puffs.push({
                            x: this.ball.position.x, y: this.ball.position.y,
                            vx: (k - n / 2) * 40, vy: -30 - k * 18,
                            life: 1, r: 2.5, grow: 1, col: 0xffe9b5
                        });
                    }
                    if (v > 6) sfx.tick();
                }
            },

            clearWorld: function () {
                M.Composite.clear(this.matter.world.localWorld, false);
                this.bodies = [];
                this.movers = [];
                this.ball = null;
                this.puffs = [];
                this.trail = [];
            },

            /* Tường hai bên, sàn đáy và cái giỏ.
             *
             * Sàn để PHẲNG chứ không hứng bi: bi rơi trượt giỏ thì nằm chỏng
             * chơ trên sàn cho bé nhìn thấy nó lẽ ra phải đi đường nào. Hồi đầu
             * em làm sàn dốc gom bi về giỏ, hoá ra màn nào cũng thắng dù lắp
             * sai — thắng kiểu ấy thì còn gì là câu đố. */
            buildFrame: function () {
                var opts = { isStatic: true, friction: 0.4, restitution: 0.02, label: 'frame' };
                var y0 = BOARD.y, y1 = BOARD.y + BOARD.h + 92;
                var add = [
                    M.Bodies.rectangle(BOARD.x - 14, (y0 + y1) / 2, 20, y1 - y0 + 40, opts),
                    M.Bodies.rectangle(BOARD.x + BOARD.w + 14, (y0 + y1) / 2, 20, y1 - y0 + 40, opts),
                    M.Bodies.rectangle(BOARD.x + BOARD.w / 2, y1 + 10, BOARD.w + 60, 20, opts)
                ];
                this.floorY = y1;

                /* Giỏ đặt ngay dưới CỬA RƠI của tầng cuối.
                 *
                 * Không phải dưới điểm exit: viên bi rời tầng cuối là rơi trong
                 * cả một khoảng rộng 71 ô giữa mép mảnh và gờ chặn, chứ không
                 * rơi trúng một điểm. Đặt giỏ đúng điểm exit thì bi hay rơi
                 * sát mép ngoài rồi đậu lên chính THÀNH GIỎ — nhìn ảnh chụp
                 * thấy nó nằm chỏng chơ ngay cạnh giỏ, hụt vài ô. */
                var last = this.level.bays[this.level.bays.length - 1];
                var bx = BOARD.x + last.exit.x + (last.flipped ? -20 : 20);
                bx = Math.max(BOARD.x + BASKET.w / 2 + 10, Math.min(BOARD.x + BOARD.w - BASKET.w / 2 - 10, bx));
                this.basket = { x: bx, y: y1 - BASKET.h / 2 };
                add.push(M.Bodies.rectangle(bx - BASKET.w / 2, y1 - BASKET.h / 2, 12, BASKET.h, opts));
                add.push(M.Bodies.rectangle(bx + BASKET.w / 2, y1 - BASKET.h / 2, 12, BASKET.h, opts));

                this.matter.world.add(add);
                this.bodies = this.bodies.concat(add);
            },

            /* Dựng mấy mảnh gắn chết của một tầng */
            buildShapes: function (shapes, top) {
                for (var i = 0; i < shapes.length; i++) {
                    var s = shapes[i];
                    var x = BOARD.x + s.x, y = BOARD.y + top + s.y;
                    var b;
                    if (s.shape === 'tri') {
                        b = M.Bodies.polygon(x, y, 3, s.w * 0.7, {
                            isStatic: true, angle: Math.PI, friction: 0.5, label: 'fixed'
                        });
                    } else {
                        b = M.Bodies.rectangle(x, y, s.w, s.h, {
                            isStatic: true, angle: s.angle || 0,
                            /* mảnh nào tự khai ma sát riêng thì theo nó — máng
                             * trượt phải trơn, kệ đỡ thì bám */
                            friction: s.fric == null ? 0.42 : s.fric,
                            restitution: 0.03, label: 'fixed'
                        });
                    }
                    b.plugin = { paint: { kind: 'fixed', role: s.role, w: s.w, h: s.h } };
                    this.matter.world.add(b);
                    this.bodies.push(b);
                }
            },

            /* Mảnh nằm nửa trái tầng thì đẩy sang phải, nằm nửa phải thì đẩy
             * sang trái — đúng chiều viên bi đang đi. */
            /* Dựng MẢNH CHÍNH của một tầng. Mỗi kiểu một cách dựng riêng — đây
             * là chỗ tám kiểu vật lý khác nhau thật sự nằm. */
            buildSlot: function (bay, s) {
                var x = BOARD.x + s.x, y = BOARD.y + bay.top + s.y;
                var made = [];

                if (s.kind === 'ramp') {
                    made.push(M.Bodies.rectangle(x, y, s.w, s.h, {
                        isStatic: true, angle: s.angle, friction: 0.16, restitution: 0.05,
                        label: 'part', chamfer: { radius: 6 }
                    }));

                } else if (s.kind === 'domino') {
                    /* Hàng domino đứng phải NHẸ.
                     *
                     * Lần đầu em cho chúng nặng gần bằng viên bi, nghĩ thế mới
                     * "chắc". Chạy thử thì viên bi lăn tới con thứ nhất rồi
                     * đứng khựng lại luôn — nó không đủ sức đẩy đổ, mà con
                     * domino cũng không đủ sức đẩy nó lùi. Cả hai đứng chết
                     * trân với nhau. Domino thật cũng vậy: mảnh và nhẹ, đổ
                     * bằng cú chạm chứ không bằng sức. */
                    var n = s.count || 4, gap = s.w / (n - 1);
                    var dir = s.angle < 0 ? -1 : 1;
                    /* Kệ đỡ hàng domino có độ dốc, nên chân mỗi con phải hạ
                     * theo đúng độ dốc ấy. Đặt tất cả cùng một cao độ thì con
                     * đầu treo lơ lửng còn con cuối cắm ngập vào kệ, và cả hàng
                     * bật tung ngay lúc dựng màn. */
                    var tilt = Math.tan(s.tilt || 0);
                    for (var i = 0; i < n; i++) {
                        var dx = x - s.w / 2 + gap * i;
                        var d = M.Bodies.rectangle(dx, y + (dx - x) * tilt, s.thick || 14, s.h, {
                            friction: 0.32, frictionAir: 0.004, restitution: 0.02,
                            density: 0.00035, label: 'domino'
                        });
                        /* Đứng THẲNG trên bệ của nó, không nghiêng mồi.
                         *
                         * Em từng cho chúng nghiêng sẵn 0,12 cho dễ đổ. Trên
                         * một cái kệ liền thì được, nhưng ở đây mỗi con đứng
                         * trên một cái bệ hẹp: nghiêng sẵn làm nó chòng chành
                         * rồi đổ NGƯỢC về phía sau ngay lúc dựng màn, chưa cần
                         * viên bi nào. Trace thấy góc chạy từ +0,12 xuống −0,78
                         * trong lúc viên bi còn đang ở tít trên máng hứng.
                         *
                         * Con domino cũng phải MỎNG (14 ô). Cho dày 22 thì mặt
                         * trên rộng gần bằng viên bi, và bi rơi xuống lại ĐẬU
                         * NGAY TRÊN ĐỈNH nó như đậu trên cái cột, rồi lăn qua
                         * đỉnh cả ba con mà không con nào đổ. */
                        M.Body.setAngle(d, (s.tilt || 0) + dir * (s.lean || 0));
                        made.push(d);
                    }

                } else if (s.kind === 'seesaw') {
                    var plank = M.Bodies.rectangle(x, y, s.w, s.h, {
                        friction: 0.5, frictionAir: 0.02, restitution: 0.02,
                        density: 0.0011, label: 'part', chamfer: { radius: 6 }
                    });
                    M.Body.setAngle(plank, s.angle);
                    var pin = M.Constraint.create({
                        pointA: { x: x, y: y }, bodyB: plank, pointB: { x: 0, y: 0 },
                        length: 0, stiffness: 1
                    });
                    this.matter.world.add(pin);
                    made.push(plank);

                } else if (s.kind === 'spring') {
                    /* BÀN NHÚN VÀ ĐỆM NẢY LÀ MẢNH CÓ LỰC, không phải mảnh nảy.
                     *
                     * Lúc đầu em làm chúng bằng "độ nảy" (restitution) của
                     * Matter, chỉnh lên 1,22 rồi 1,45 rồi 1,75 mà đường bi
                     * KHÔNG ĐỔI LẤY MỘT Ô. Hoá ra Matter coi cú va chậm là "vật
                     * đang tựa vào nhau" và bỏ qua độ nảy — viên bi tới đệm với
                     * tốc độ ngay sát ngưỡng ấy nên nó trượt trên mặt đệm chứ
                     * không bật. Chỉnh một con số ba lần mà không có gì đổi là
                     * dấu hiệu mình đang vặn nhầm cái núm.
                     *
                     * Nay hai mảnh này TỰ ĐẶT vận tốc cho viên bi lúc chạm —
                     * đúng bản chất của chúng: bàn nhún có lò xo nén sẵn, đệm
                     * pinball có nam châm điện đẩy ra. Chúng cấp năng lượng chứ
                     * không dội lại năng lượng. Được thêm cái lợi: cú bật thành
                     * ra ĐO ĐƯỢC, lần nào cũng như lần nào. */
                    var pad = M.Bodies.rectangle(x, y, s.w, s.h, {
                        isStatic: true, friction: 0.3, angle: s.angle,
                        restitution: 0.1, label: 'part', chamfer: { radius: 8 }
                    });
                    this.movers.push({
                        kind: 'spring', body: pad, at: { x: x, y: y },
                        w: s.w, h: s.h,
                        kick: { vx: (s.kick ? s.kick.vx : 390) * dirOf(s), vy: s.kick ? s.kick.vy : -520 }
                    });
                    made.push(pad);

                } else if (s.kind === 'bumper') {
                    var bump = M.Bodies.circle(x, y, s.w / 2, {
                        isStatic: true, friction: 0.02, restitution: 0.2, label: 'part'
                    });
                    this.movers.push({
                        kind: 'bumper', body: bump, at: { x: x, y: y },
                        r: s.w / 2, speed: s.kick ? s.kick.speed : 400
                    });
                    made.push(bump);

                } else if (s.kind === 'belt') {
                    var belt = M.Bodies.rectangle(x, y, s.w, s.h, {
                        isStatic: true, friction: 1, restitution: 0, label: 'part',
                        chamfer: { radius: 10 }
                    });
                    belt.plugin = { belt: s.speed };
                    this.movers.push({ kind: 'belt', body: belt, speed: s.speed });
                    made.push(belt);

                } else if (s.kind === 'fan') {
                    var fan = M.Bodies.rectangle(x, y, s.w, s.h, {
                        isStatic: true, friction: 0.3, label: 'part', chamfer: { radius: 8 }
                    });
                    var dir2 = dirOf(s);
                    this.movers.push({
                        kind: 'fan', body: fan, dir: dir2,
                        area: {
                            x: x + dir2 * (s.wind.w / 2 + s.w / 2), y: y,
                            w: s.wind.w, h: s.wind.h
                        },
                        force: s.wind.force * dir2
                    });
                    made.push(fan);

                } else if (s.kind === 'magnet') {
                    var mag = M.Bodies.rectangle(x, y, s.w, s.h, {
                        isStatic: true, friction: 0.3, label: 'part', chamfer: { radius: 6 }
                    });
                    this.movers.push({
                        kind: 'magnet', body: mag, at: { x: x, y: y },
                        r: s.pull.r, force: s.pull.force
                    });
                    made.push(mag);
                }

                for (var k = 0; k < made.length; k++) {
                    made[k].plugin = made[k].plugin || {};
                    made[k].plugin.paint = { kind: s.kind, bay: bay.index, w: s.w, h: s.h };
                    this.bodies.push(made[k]);
                }
                this.matter.world.add(made);
                return made;
            },

            /* ---------------------------------------------------------------
             * CHẠY THỬ
             * -------------------------------------------------------------*/
            startRun: function () {
                if (G.running) return;
                /* Lắp lại cỗ máy từ đầu để lần chạy nào cũng y hệt lần trước:
                 * domino đã đổ, ván đã lật đều phải dựng lại. */
                this.rebuildFromPlacement();

                var bay0 = this.level.bays[0];
                var bx = BOARD.x + bay0.enter.x;
                /* HÒN BI THẬT: tính theo tỉ lệ chứ không chỉnh theo cảm giác.
                 *
                 * Viên bi bán kính 15 ô ứng với hòn bi thật đường kính 25 mm,
                 * tức 1 mét ≈ 1200 ô. Trọng lực thật 9,8 m/s² quy ra là 11.760
                 * ô/giây². Bản đầu em để 1.000 ô/giây², bản sau 1.700 — tức chỉ
                 * bằng một phần bảy trọng lực thật. Anh Hiếu nhìn cái dốc rồi
                 * nói ngay "độ nghiêng như vậy thì bi phải lăn nhanh hơn", và
                 * đúng: không phải cảm giác, mà là sai tỉ lệ.
                 *
                 * Nay để 3.400 ô/giây². Vì sao không lấy đủ 11.760: ở tốc độ ấy
                 * viên bi đi hơn 15 ô mỗi khung hình, tức nhảy qua hết bề dày
                 * một tấm ván (14–16 ô) trong một nhịp — nó sẽ xuyên thẳng qua
                 * sàn mà không va chạm gì. 3.400 giữ bước nhảy dưới nửa bán
                 * kính, an toàn tuyệt đối, mà bi đã nhanh gấp đôi bản trước.
                 *
                 * Ma sát cũng phải đúng chất: mặt gỗ nhẵn có bám nhẹ (0,08) —
                 * đủ để viên bi XOAY khi lăn chứ không trượt phăng như trên
                 * băng, mà vẫn không ghì lại. Ma sát không khí hạ xuống một
                 * nửa: hòn bi thuỷ tinh 25 mm gần như không chịu sức cản gió. */
                this.ball = M.Bodies.circle(bx, BOARD.y - 40, BALL_R, {
                    friction: 0.08, frictionAir: 0.0006, restitution: 0.24,
                    density: 0.0028, label: 'ball'
                });
                /* Quán tính quay: Matter dựng viên bi như cái ĐĨA đặc (I = mr²/2),
                 * mà đĩa thì tốn nhiều năng lượng để quay hơn hòn bi cầu thật
                 * (I = 0,4mr²) — lăn xuống dốc chỉ đạt hai phần ba gia tốc lẽ
                 * ra phải có. Hạ quán tính xuống một nửa thì tỉ lệ ấy lên 0,8,
                 * sát hòn bi thật, và cái cảm giác "ì ạch" mất hẳn. */
                M.Body.setInertia(this.ball, this.ball.inertia * 0.5);
                this.matter.world.add(this.ball);

                G.running = true;
                G.result = '';
                G.tries++;
                this.runT = 0;
                this.stallT = 0;
                UI.paintHud();
            },

            /* Dựng lại cỗ máy đúng theo những gì bé đang đặt trong các ô */
            rebuildFromPlacement: function () {
                this.clearWorld();
                this.buildFrame();
                var lv = this.level;
                for (var i = 0; i < lv.bays.length; i++) {
                    var bay = lv.bays[i];
                    this.buildShapes(bay.fixed, bay.top);
                    if (!bay.gone) { this.buildSlot(bay, bay.slot); continue; }
                    var put = G.placed[i];
                    if (!put) continue;                       // ô còn trống
                    this.buildSlot(bay, this.shapeFor(bay, put));
                }
            },

            /* Mảnh bé đặt vào ô: lấy hình gốc của ô, nhưng nếu bé quay ngược
             * chiều thì lật ngang. Đặt sai chiều KHÔNG bị chặn — cứ cho chạy để
             * bé tự thấy viên bi đi lạc đường, đó mới là chỗ học được. */
            shapeFor: function (bay, put) {
                var base = bay.slot, s = {};
                for (var k in base) s[k] = base[k];
                s.kind = put.kind;

                /* Quay mảnh chỉ đổi CHIỀU, không dời CHỖ.
                 *
                 * Bản đầu em cho quay mảnh là soi gương cả toạ độ x trong tầng.
                 * Nó đẻ ra một màn bất khả thi mà máy soát không bắt được: màn
                 * 31 cần quả đệm nảy nằm ở nửa bên kia tầng, tức là phải "quay"
                 * nó — nhưng quả đệm tròn xoe nên em đánh dấu nó là mảnh KHÔNG
                 * CÓ CHIỀU, và nút quay từ chối quay. Máy soát vẫn báo ĐẠT vì
                 * nó đặt mảnh thẳng vào chỗ đúng, không đi qua tay bé.
                 *
                 * Nay quay chỉ đảo góc nghiêng, chiều băng cuốn, chiều gió thổi
                 * và chiều lò xo hất — mảnh luôn nằm đúng cái ô có viền đứt bé
                 * vừa thả vào. Nhờ vậy quả đệm và nam châm thành mảnh thật sự
                 * không có chiều (quay cũng thế), còn dốc trượt, băng chuyền,
                 * quạt, bập bênh, bàn nhún thì quay là thấy khác ngay. */
                var base_dir = bay.flipped ? -1 : 1;
                var turned = (put.flip === true) !== bay.flipped;
                if (turned) {
                    if (s.angle) s.angle = -s.angle;
                    if (s.speed) s.speed = -s.speed;
                    s.dir = -base_dir;
                } else {
                    s.dir = base_dir;
                }
                return s;
            },

            /* MỘT nhịp máy trọn vẹn — mọi nơi cần quay bánh đều gọi hàm này */
            stepAll: function (dt) {
                /* Chia mỗi khung hình thành BA nhịp vật lý nhỏ.
                 *
                 * Bi nhanh lên thì sinh ra một mối nguy mới: ở 780–1270 ô/giây
                 * nó đi 13–21 ô trong một khung hình, mà tấm ván chỉ dày 14–16
                 * ô. Tức là trong một nhịp viên bi nhảy từ phía trên tấm ván
                 * sang hẳn phía dưới — Matter không thấy có va chạm nào cả và
                 * bi XUYÊN THẲNG qua sàn. Lỗi này không báo gì hết, chỉ thấy
                 * viên bi biến mất.
                 *
                 * Chia ba thì bước nhảy còn 4–7 ô, nhỏ hơn nửa bán kính, không
                 * đường nào lọt qua được. Tốn gấp ba phép tính vật lý, nhưng
                 * một màn chỉ có vài chục vật thể nên không hề hấn gì. */
                var sdt = dt / SUB;
                if (G.running) {
                    for (var k = 0; k < SUB; k++) {
                        this.applyForces();
                        M.Engine.update(this.matter.world.engine, sdt * 1000);
                    }
                    this.checkBall(dt);
                } else {
                    for (var k2 = 0; k2 < SUB; k2++) {
                        M.Engine.update(this.matter.world.engine, sdt * 1000);
                    }
                }
                this.beltPhase += dt;
                this.stepPuffs(dt);
                if (this.ball && G.running) {
                    this.trail.push({ x: this.ball.position.x, y: this.ball.position.y });
                    if (this.trail.length > 9) this.trail.shift();
                } else if (this.trail.length) {
                    this.trail.shift();
                }
                for (var mf = 0; mf < this.movers.length; mf++) {
                    if (this.movers[mf].flash > 0) this.movers[mf].flash -= dt * 3.2;
                }
            },

            /* Quạt, băng chuyền, nam châm: ba thứ này không va chạm mà tác động
             * bằng lực, nên phải tự tay áp mỗi nhịp. */
            applyForces: function () {
                var b = this.ball;
                if (!b) return;
                for (var i = 0; i < this.movers.length; i++) {
                    var m = this.movers[i];
                    if (m.kind === 'fan') {
                        var a = m.area;
                        if (Math.abs(b.position.x - a.x) < a.w / 2 &&
                            Math.abs(b.position.y - a.y) < a.h / 2) {
                            M.Body.applyForce(b, b.position, { x: m.force, y: -0.00028 });
                            if (Math.random() < 0.4) this.puff(a.x - m.dir * a.w * 0.4, a.y + (Math.random() - 0.5) * a.h * 0.7, m.dir);
                        }
                    } else if (m.kind === 'magnet') {
                        /* Lực hút ĐỀU trong tầm, và luôn NHỎ HƠN trọng lực.
                         *
                         * Bản đầu em cho lực yếu dần theo khoảng cách, nghe thì
                         * giống nam châm thật, nhưng ở tầm xa nó chỉ còn vài
                         * phần trăm — kéo được đúng 12 ô trong khi cần 40. Vặn
                         * mạnh lên thì lại thành thảm hoạ kiểu khác: lực vượt
                         * trọng lực, viên bi bay dính vào cục nam châm rồi TREO
                         * LƠ LỬNG ở đó tới hết giờ. Để đều và dưới trọng lực
                         * thì bi luôn rơi xuống được, chỉ là rơi chéo sang bên
                         * — đúng cái cảnh cần có. */
                        var dx = m.at.x - b.position.x, dy = m.at.y - b.position.y;
                        var d = Math.sqrt(dx * dx + dy * dy);
                        if (d < m.r && d > 1) {
                            M.Body.applyForce(b, b.position, {
                                x: m.force * dx / d, y: m.force * dy / d
                            });
                        }
                    } else if (m.kind === 'spring') {
                        /* chạm mặt đệm và đang đi xuống thì bật đi, mỗi lượt
                         * chỉ bật một lần để không rung liên hồi */
                        if (!m.fired &&
                            Math.abs(b.position.x - m.at.x) < m.w / 2 + BALL_R &&
                            Math.abs(b.position.y - m.at.y) < m.h / 2 + BALL_R + 6 &&
                            b.velocity.y > -0.5) {
                            m.fired = true;
                            M.Body.setVelocity(b, { x: m.kick.vx / PHYS_HZ, y: m.kick.vy / PHYS_HZ });
                            this.puff(m.at.x, m.at.y - 14, 0);
                            sfx.bounce();
                        }
                    } else if (m.kind === 'bumper') {
                        var bdx = b.position.x - m.at.x, bdy = b.position.y - m.at.y;
                        var bd = Math.sqrt(bdx * bdx + bdy * bdy);
                        if (!m.fired && bd < m.r + BALL_R + 3 && bd > 1) {
                            m.fired = true;
                            m.flash = 1;
                            M.Body.setVelocity(b, {
                                x: (m.speed / PHYS_HZ) * bdx / bd,
                                y: (m.speed / PHYS_HZ) * bdy / bd
                            });
                            this.puff(m.at.x + bdx, m.at.y + bdy, bdx > 0 ? 1 : -1);
                            sfx.bounce();
                        }
                    } else if (m.kind === 'belt') {
                        /* Matter không có "mặt băng chạy", nên em tự đặt vận tốc
                         * ngang cho viên bi khi nó đang nằm trên băng. */
                        var body = m.body;
                        var onTop = Math.abs(b.position.x - body.position.x) < body.plugin.paint.w / 2 + BALL_R &&
                            b.position.y < body.position.y &&
                            b.position.y > body.position.y - body.plugin.paint.h / 2 - BALL_R * 2.4;
                        if (onTop) M.Body.setVelocity(b, { x: m.speed / PHYS_HZ, y: b.velocity.y });
                    }
                }
            },

            /* Thắng, tắc, hay rơi ra ngoài */
            checkBall: function (dt) {
                var b = this.ball;
                if (!b) return;
                this.runT += dt;

                var inBasket = Math.abs(b.position.x - this.basket.x) < BASKET.w / 2 - 4 &&
                    b.position.y > this.floorY - BASKET.h + 6;
                if (inBasket) { this.finishRun('win'); return; }

                /* "Tắc" là CẢ CỖ MÁY đứng im, không phải mỗi viên bi đứng im.
                 *
                 * Bản đầu em chỉ nhìn viên bi, và nó báo tắc oan ngay ở tầng
                 * domino: bi húc con thứ nhất rồi nằm chờ, trong khi hàng domino
                 * đang từ từ đổ để bắc cầu cho chính nó. Đó là lúc ĐẸP NHẤT của
                 * cả trò chơi — chuỗi phản ứng đang chạy mà viên bi thì đứng đợi
                 * — vậy mà máy tuyên bố hỏng và cắt ngang. Cỗ máy dây chuyền thì
                 * phải chờ được cả dây chuyền. */
                var v = Math.sqrt(b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y);
                for (var mi = 0; mi < this.bodies.length && v < 0.35; mi++) {
                    var mb = this.bodies[mi];
                    if (mb.isStatic) continue;
                    v = Math.max(v, Math.abs(mb.angularVelocity) * 30 +
                        Math.sqrt(mb.velocity.x * mb.velocity.x + mb.velocity.y * mb.velocity.y));
                }
                this.stallT = v < 0.35 ? this.stallT + dt : 0;
                if (this.stallT > STALL_T) { this.finishRun('stall'); return; }
                if (this.runT > RUN_CAP / 60) { this.finishRun('timeout'); return; }
                if (b.position.y > H + 200) { this.finishRun('lost'); return; }
            },

            finishRun: function (how) {
                G.running = false;
                G.result = how;
                UI.afterRun(how);
            },

            /* ---------------------------------------------------------------
             * KÉO THẢ
             * -------------------------------------------------------------*/
            trayRects: function () {
                var out = [], n = G.tray.length;
                if (!n) return out;
                var slotW = Math.min(126, (W - 80) / n);
                var x0 = W / 2 - (slotW * n) / 2;
                for (var i = 0; i < n; i++) {
                    out.push({
                        i: i, x: x0 + slotW * i + slotW / 2, y: TRAY.y + 62,
                        w: slotW - 8, h: 92
                    });
                }
                return out;
            },

            emptySlots: function () {
                var out = [];
                for (var i = 0; i < this.level.bays.length; i++) {
                    var bay = this.level.bays[i];
                    if (!bay.gone) continue;
                    out.push({
                        bay: i,
                        x: BOARD.x + bay.slot.x,
                        y: BOARD.y + bay.top + bay.slot.y,
                        w: bay.slot.w, h: bay.slot.h,
                        filled: !!G.placed[i]
                    });
                }
                return out;
            },

            /* Ô gần ngón tay nhất trong tầm hít. Dùng chung cho lúc thả mảnh
             * và lúc vẽ gợi ý trong khi kéo, để hai bên không bao giờ lệch
             * nhau — vẽ sáng ô này mà thả lại vào ô kia là mất tin ngay. */
            slotUnder: function (x, y) {
                var slots = this.emptySlots(), best = null, bd = SNAP;
                for (var i = 0; i < slots.length; i++) {
                    var d = Math.hypot(x - slots[i].x, y - slots[i].y);
                    if (d < bd) { bd = d; best = slots[i]; }
                }
                return best;
            },

            onDown: function (p) {
                if (G.mode !== 'play' || G.running) return;
                sfx.wake();
                var wx = p.worldX, wy = p.worldY;

                /* chạm vào mảnh đã đặt trên máy → quay chiều, chạm lâu → gỡ ra */
                var slots = this.emptySlots();
                for (var i = 0; i < slots.length; i++) {
                    var s = slots[i];
                    if (!s.filled) continue;
                    if (Math.abs(wx - s.x) < Math.max(80, s.w / 2) && Math.abs(wy - s.y) < 62) {
                        this.grab = { from: 'board', bay: s.bay, x: wx, y: wy, moved: 0 };
                        return;
                    }
                }
                /* nhặt mảnh trong khay */
                var rects = this.trayRects();
                for (var k = 0; k < rects.length; k++) {
                    var r = rects[k];
                    if (G.tray[r.i].used) continue;
                    if (Math.abs(wx - r.x) < r.w / 2 && Math.abs(wy - r.y) < r.h / 2) {
                        this.grab = { from: 'tray', idx: r.i, x: wx, y: wy, moved: 0, flip: false };
                        sfx.pick();
                        return;
                    }
                }
            },

            onMove: function (p) {
                if (!this.grab) return;
                var d = Math.abs(p.worldX - this.grab.x) + Math.abs(p.worldY - this.grab.y);
                this.grab.moved = Math.max(this.grab.moved, d);
                this.grab.x = p.worldX;
                this.grab.y = p.worldY;
                if (this.grab.from === 'board' && this.grab.moved > TAP_SLOP) {
                    /* kéo mảnh ra khỏi ô → thành mảnh đang cầm trên tay */
                    var put = G.placed[this.grab.bay];
                    delete G.placed[this.grab.bay];
                    this.grab = { from: 'tray', idx: put.trayIdx, x: p.worldX, y: p.worldY, moved: 99, flip: put.flip };
                    G.tray[put.trayIdx].used = false;
                    this.rebuildFromPlacement();
                }
                this.paintAll();
            },

            onUp: function () {
                var g = this.grab;
                this.grab = null;
                if (!g) return;

                if (g.from === 'board') {
                    /* chạm nhẹ, không kéo đi đâu → quay chiều mảnh */
                    var put = G.placed[g.bay];
                    if (put && P.KIND[put.kind].flip) {
                        put.flip = !put.flip;
                        sfx.flip();
                        this.rebuildFromPlacement();
                    } else if (put) {
                        /* mảnh tròn quay cũng thế — nói ra chứ đừng im lặng,
                         * im lặng thì bé tưởng máy hỏng rồi chạm loạn lên */
                        showTip('This piece works either way', 1200);
                    }
                    this.paintAll();
                    return;
                }

                /* Thả mảnh vào ô gần nhất — KỂ CẢ Ô ĐANG CÓ MẢNH.
                 *
                 * Trước đó ô đã có mảnh thì bị bỏ qua, mảnh thả vào lặng lẽ bay
                 * về khay chẳng nói gì. Anh Hiếu gặp đúng chuyện này: đặt nhầm
                 * rồi muốn đổi mảnh khác vào, thả mãi không được, mà cũng không
                 * có dấu hiệu nào bảo vì sao. Nay thả đè lên là ĐỔI CHỖ: mảnh
                 * cũ tự về khay, mảnh mới vào ô. */
                var best = this.slotUnder(g.x, g.y);
                if (best) {
                    var old = G.placed[best.bay];
                    if (old && old.trayIdx >= 0) G.tray[old.trayIdx].used = false;
                    G.placed[best.bay] = { kind: G.tray[g.idx].kind, flip: !!g.flip, trayIdx: g.idx };
                    G.tray[g.idx].used = true;
                    sfx.drop();
                    this.rebuildFromPlacement();
                } else {
                    G.tray[g.idx].used = false;
                }
                this.paintAll();
                UI.paintHud();
            },

            /* ---------------------------------------------------------------
             * VẼ
             * -------------------------------------------------------------*/
            update: function (time, delta) {
                if (this.frozen) return;
                this.acc = Math.min(this.acc + delta / 1000, 5 / 60);
                while (this.acc >= 1 / 60) { this.acc -= 1 / 60; this.stepAll(1 / 60); }
                this.paintAll();
            },

            paintAll: function () {
                if (!this.level) return;
                this.paintBack();
                this.paintMachine();
                this.paintGhosts();
                this.paintBallAndPuffs();
                this.paintTray();
                this.paintDrag();
            },

            /* ---------------------------------------------------------------
             * PHẦN VẼ
             *
             * Anh Hiếu xem bản đầu và nói thẳng: "đồ hoạ của những năm 1990".
             * Đúng — bản ấy vẽ mỗi mảnh bằng một hình chữ nhật tô một màu
             * phẳng, không bóng đổ, không vát cạnh, không chất liệu gì. Nhìn
             * ra ngay là thứ làm cho có.
             *
             * Nay mỗi mảnh được vẽ thành VẬT LIỆU: ván gỗ có vân và cạnh vát,
             * băng cao su có con lăn quay thật, lò xo có vòng thép, cánh quạt
             * quay, nam châm móng ngựa hai cực. Tất cả vẫn là hình khối do
             * Phaser vẽ nên không nặng thêm tí nào — chỉ là vẽ nhiều lớp hơn:
             * bóng đổ, thân, mép trên sáng, mép dưới tối, rồi chi tiết.
             * ------------------------------------------------------------- */

            /* Vẽ một thanh theo đúng vị trí và góc của vật thể, có bóng đổ và
             * vát cạnh. Đây là khuôn chung cho mọi mảnh dạng thanh. */
            slab: function (g, body, w, h, colDark, colMain, colLight) {
                var c = body.position, a = body.angle;
                var cos = Math.cos(a), sin = Math.sin(a);
                function corner(dx, dy) {
                    return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
                }
                function quad(x0, y0, x1, y1, col, alpha) {
                    var p1 = corner(x0, y0), p2 = corner(x1, y0), p3 = corner(x1, y1), p4 = corner(x0, y1);
                    g.fillStyle(col, alpha == null ? 1 : alpha);
                    g.beginPath();
                    g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y);
                    g.lineTo(p3.x, p3.y); g.lineTo(p4.x, p4.y);
                    g.closePath(); g.fillPath();
                }
                var hw = w / 2, hh = h / 2;
                /* bóng đổ lệch xuống dưới */
                g.fillStyle(0x0a0722, 0.35);
                var s1 = corner(-hw, -hh + 5), s2 = corner(hw, -hh + 5),
                    s3 = corner(hw, hh + 5), s4 = corner(-hw, hh + 5);
                g.beginPath(); g.moveTo(s1.x + 3, s1.y); g.lineTo(s2.x + 3, s2.y);
                g.lineTo(s3.x + 3, s3.y); g.lineTo(s4.x + 3, s4.y); g.closePath(); g.fillPath();
                quad(-hw, -hh, hw, hh, colMain);              // thân
                quad(-hw, -hh, hw, -hh + 3.5, colLight);      // mép trên sáng
                quad(-hw, hh - 3, hw, hh, colDark);           // mép dưới tối
                return { corner: corner, quad: quad, hw: hw, hh: hh };
            },

            paintBack: function () {
                var g = this.gBack;
                g.clear();
                var bx = BOARD.x, by = BOARD.y, bw = BOARD.w, bh = BOARD.h;

                /* Tường xưởng: ván gỗ dựng đứng, tối và ấm */
                g.fillStyle(0x1b1338, 1);
                g.fillRect(0, 0, W, H);
                g.fillStyle(0x231a45, 1);
                for (var px = 0; px < W; px += 84) g.fillRect(px, 0, 78, H);
                /* quầng đèn hắt xuống cỗ máy */
                for (var r = 0; r < 5; r++) {
                    g.fillStyle(0x6c5ce7, 0.05);
                    g.fillCircle(bx + bw / 2, by + 40, 300 + r * 90);
                }

                /* Khung máy: khung gỗ dày, vát cạnh, có đinh ốc bốn góc */
                g.fillStyle(0x0d0a22, 0.5);
                g.fillRoundedRect(bx - 24, by - 52, bw + 48, bh + 168, 26);
                g.fillStyle(0x4a3a12, 1);
                g.fillRoundedRect(bx - 28, by - 58, bw + 56, bh + 168, 26);
                g.fillStyle(0x7a5f1e, 1);
                g.fillRoundedRect(bx - 28, by - 58, bw + 56, bh + 160, 26);
                g.fillStyle(0x8f7024, 1);
                g.fillRoundedRect(bx - 28, by - 58, bw + 56, 10, 6);
                g.fillStyle(0x1d1747, 1);
                g.fillRoundedRect(bx - 14, by - 44, bw + 28, bh + 132, 16);
                /* ánh đèn hắt từ nóc máy xuống, nhạt dần — lòng máy để tối
                 * thui thì mảnh nào cũng chìm, nhìn như cái hang */
                for (var li = 0; li < 7; li++) {
                    g.fillStyle(0x8f7bff, 0.028);
                    g.fillRoundedRect(bx - 14 + li * 4, by - 44, bw + 28 - li * 8, (bh + 132) * (0.3 + li * 0.1), 16);
                }

                var screws = [[bx - 14, by - 44], [bx + bw + 14, by - 44],
                              [bx - 14, by + bh + 78], [bx + bw + 14, by + bh + 78]];
                for (var si = 0; si < screws.length; si++) {
                    g.fillStyle(0xb9a24a, 1); g.fillCircle(screws[si][0], screws[si][1], 7);
                    g.fillStyle(0x6b5a20, 1); g.fillRect(screws[si][0] - 5, screws[si][1] - 1.5, 10, 3);
                }

                /* thanh ray đồng ngăn giữa các tầng */
                for (var i = 1; i < this.level.bays.length; i++) {
                    var y = BOARD.y + i * P.BAY_H;
                    g.fillStyle(0x3a2f70, 0.9); g.fillRect(bx - 10, y - 2, bw + 20, 4);
                    g.fillStyle(0x5b4aa8, 0.55); g.fillRect(bx - 10, y - 2, bw + 20, 1.5);
                }

                /* Ống thả bi trên nóc: phễu kim loại */
                var tx = bx + this.level.bays[0].enter.x;
                g.fillStyle(0x2a2258, 1);
                g.fillRoundedRect(tx - 36, by - 96, 72, 54, 10);
                g.fillStyle(0x4b3f92, 1);
                g.fillRoundedRect(tx - 30, by - 90, 60, 30, 8);
                g.fillStyle(0x8f7bff, 0.8);
                g.fillRoundedRect(tx - 26, by - 88, 52, 7, 4);
                g.fillStyle(0x1a1440, 1);
                g.fillRoundedRect(tx - 17, by - 48, 34, 14, 5);

                /* Giỏ đích: rổ dây có quầng sáng, nhìn là biết phải nhắm vào đâu */
                var b = this.basket, fy = this.floorY;
                for (var q = 0; q < 4; q++) {
                    g.fillStyle(0x63e6be, 0.05);
                    g.fillCircle(b.x, fy - BASKET.h / 2, 70 + q * 22);
                }
                g.fillStyle(0x17224a, 1);
                g.fillRoundedRect(b.x - BASKET.w / 2 - 9, fy - BASKET.h - 10, BASKET.w + 18, BASKET.h + 16, 14);
                g.fillStyle(0x1d3a55, 0.85);
                g.fillRoundedRect(b.x - BASKET.w / 2 + 2, fy - BASKET.h, BASKET.w - 4, BASKET.h, 9);
                g.lineStyle(3, 0x63e6be, 0.5);
                for (var wx = -BASKET.w / 2 + 14; wx < BASKET.w / 2 - 6; wx += 18) {
                    g.beginPath(); g.moveTo(b.x + wx, fy - BASKET.h + 4); g.lineTo(b.x + wx, fy - 6); g.strokePath();
                }
                g.lineStyle(5, 0x63e6be, 0.95);
                g.strokeRoundedRect(b.x - BASKET.w / 2 - 9, fy - BASKET.h - 10, BASKET.w + 18, BASKET.h + 16, 14);
            },

            paintMachine: function () {
                var g = this.gMachine;
                g.clear();
                for (var i = 0; i < this.bodies.length; i++) {
                    var body = this.bodies[i];
                    var info = body.plugin && body.plugin.paint;
                    if (!info) continue;
                    if (info.kind === 'fixed') this.paintFixed(g, body, info);
                    else this.paintPart(g, body, info);
                }
            },

            /* Mảnh gắn chết: kệ và máng là ván gỗ, tường và gờ chặn là cột thép */
            paintFixed: function (g, body, info) {
                if (info.role === 'wall') {
                    this.slab(g, body, info.w, info.h, 0x2b2456, 0x453b7e, 0x6155a3);
                    return;
                }
                var h = this.slab(g, body, info.w, info.h, 0x3a2c10, 0x6b5220, 0x8a6c2c);
                /* vân gỗ */
                for (var k = -1; k <= 1; k++) {
                    h.quad(-h.hw + 8, k * 3.5, h.hw - 8, k * 3.5 + 1.2, 0x54400f, 0.55);
                }
            },

            paintPart: function (g, body, info) {
                var c = body.position;
                if (info.kind === 'ramp') {
                    /* ván gỗ sáng màu, có rãnh giữa cho viên bi chạy */
                    var h = this.slab(g, body, info.w, info.h, 0x4a3a86, 0x8f7bff, 0xb9aaff);
                    h.quad(-h.hw + 10, -1.5, h.hw - 10, 1.5, 0x6a58c8, 0.8);
                    h.quad(-h.hw, -h.hh, -h.hw + 7, h.hh, 0x6a58c8, 1);
                    h.quad(h.hw - 7, -h.hh, h.hw, h.hh, 0x6a58c8, 1);

                } else if (info.kind === 'seesaw') {
                    var h2 = this.slab(g, body, info.w, info.h, 0x1c8f74, 0x63e6be, 0x9df3dc);
                    h2.quad(-h2.hw + 10, -1.5, h2.hw - 10, 1.5, 0x2fae91, 0.75);
                    /* chốt trục bằng đồng ở giữa ván */
                    g.fillStyle(0xb9a24a, 1); g.fillCircle(c.x, c.y, 9);
                    g.fillStyle(0x6b5a20, 1); g.fillCircle(c.x, c.y, 4);

                } else if (info.kind === 'belt') {
                    /* băng cao su tối màu, vân chạy theo chiều cuốn, hai con lăn
                     * đầu băng QUAY THẬT theo tốc độ băng */
                    var mv = this.moverOf(body);
                    var dir = mv && mv.speed < 0 ? -1 : 1;
                    var hb = this.slab(g, body, info.w, info.h, 0x171233, 0x2a2350, 0x3d3470);
                    var step = 34, off = ((this.beltPhase * 210 * dir) % step + step) % step;
                    for (var x = -hb.hw + 12; x < hb.hw - 12; x += step) {
                        var xx = x + off;
                        if (xx > hb.hw - 12) xx -= (hb.hw * 2 - 24);
                        hb.quad(xx - 3, -hb.hh + 3, xx + 3, hb.hh - 3, 0xffd43b, 0.85);
                    }
                    var spin = this.beltPhase * 7 * dir;
                    for (var e = -1; e <= 1; e += 2) {
                        var rp = hb.corner(e * (hb.hw - 4), 0);
                        g.fillStyle(0x4a4487, 1); g.fillCircle(rp.x, rp.y, info.h * 0.62);
                        g.fillStyle(0x7a72c4, 1); g.fillCircle(rp.x, rp.y, info.h * 0.34);
                        g.lineStyle(3, 0x1a1440, 0.9);
                        g.beginPath();
                        g.moveTo(rp.x - Math.cos(spin) * info.h * 0.5, rp.y - Math.sin(spin) * info.h * 0.5);
                        g.lineTo(rp.x + Math.cos(spin) * info.h * 0.5, rp.y + Math.sin(spin) * info.h * 0.5);
                        g.strokePath();
                    }

                } else if (info.kind === 'spring') {
                    /* tấm đệm thép trên bộ lò xo; lò xo NÉN LẠI ngay lúc hất bi */
                    var mvs = this.moverOf(body);
                    var fired = mvs && mvs.fired;
                    var squash = fired ? 0.45 : 1;
                    g.lineStyle(5, 0xff8fae, 1);
                    for (var cxx = -info.w / 2 + 22; cxx <= info.w / 2 - 22; cxx += 34) {
                        g.beginPath();
                        for (var t = 0; t <= 8; t++) {
                            var yy = c.y + 8 + t * 3.4 * squash;
                            var xoff = (t % 2 ? 9 : -9);
                            if (t === 0) g.moveTo(c.x + cxx + xoff, yy); else g.lineTo(c.x + cxx + xoff, yy);
                        }
                        g.strokePath();
                    }
                    var hs = this.slab(g, body, info.w, info.h, 0xb3324f, 0xff6b8a, 0xffa8bd);
                    hs.quad(-hs.hw + 8, -1, hs.hw - 8, 1.5, 0xd94a6c, 0.8);

                } else if (info.kind === 'bumper') {
                    /* nấm nảy: chân tối, mũ sáng, vòng đèn loé lên lúc va */
                    var mvb = this.moverOf(body);
                    var flash = mvb && mvb.flash > 0 ? mvb.flash : 0;
                    var R = info.w / 2;
                    g.fillStyle(0x0a0722, 0.4); g.fillCircle(c.x + 3, c.y + 6, R);
                    g.fillStyle(0x8c2b52, 1); g.fillCircle(c.x, c.y, R);
                    g.fillStyle(0xf783ac, 1); g.fillCircle(c.x, c.y - 2, R - 5);
                    g.fillStyle(0xffd3e3, 1); g.fillCircle(c.x - R * 0.25, c.y - R * 0.3, R * 0.34);
                    g.lineStyle(4, 0xffffff, 0.35 + flash * 0.6);
                    g.strokeCircle(c.x, c.y, R - 2 + flash * 8);

                } else if (info.kind === 'fan') {
                    /* vỏ quạt + ba cánh quay + luồng gió */
                    var mvf = this.moverOf(body);
                    var fdir = mvf ? mvf.dir : 1;
                    g.fillStyle(0x0a0722, 0.4);
                    g.fillRoundedRect(c.x - info.w / 2 + 3, c.y - info.h / 2 + 6, info.w, info.h, 12);
                    g.fillStyle(0x1864ab, 1);
                    g.fillRoundedRect(c.x - info.w / 2, c.y - info.h / 2, info.w, info.h, 12);
                    g.fillStyle(0x4dabf7, 1);
                    g.fillRoundedRect(c.x - info.w / 2 + 4, c.y - info.h / 2 + 4, info.w - 8, info.h - 8, 10);
                    var sp = this.beltPhase * 15 * fdir;
                    for (var bl = 0; bl < 3; bl++) {
                        var ang = sp + bl * 2.094;
                        g.fillStyle(0xd0ebff, 0.95);
                        g.beginPath();
                        g.moveTo(c.x, c.y);
                        g.lineTo(c.x + Math.cos(ang) * info.w * 0.42, c.y + Math.sin(ang) * info.h * 0.42);
                        g.lineTo(c.x + Math.cos(ang + 0.5) * info.w * 0.34, c.y + Math.sin(ang + 0.5) * info.h * 0.34);
                        g.closePath(); g.fillPath();
                    }
                    g.fillStyle(0x1864ab, 1); g.fillCircle(c.x, c.y, 8);
                    /* ba vạch gió thổi ra phía trước */
                    for (var wv = 0; wv < 3; wv++) {
                        var wy2 = c.y - 18 + wv * 18;
                        var ph = ((this.beltPhase * 260 + wv * 40) % 120);
                        g.fillStyle(0xd0ebff, 0.22);
                        g.fillRoundedRect(c.x + fdir * (info.w / 2 + ph), wy2 - 2, fdir * 34, 4, 2);
                    }

                } else if (info.kind === 'magnet') {
                    /* nam châm móng ngựa, hai cực đỏ xanh, có vòng từ trường nhấp nháy */
                    var R2 = info.w / 2;
                    g.fillStyle(0x0a0722, 0.4);
                    g.fillRoundedRect(c.x - R2 + 3, c.y - R2 + 6, info.w, info.h, 10);
                    g.fillStyle(0xc92a2a, 1);
                    g.fillRoundedRect(c.x - R2, c.y - R2, info.w, info.h * 0.62, 10);
                    g.fillStyle(0xff8787, 1);
                    g.fillRoundedRect(c.x - R2 + 4, c.y - R2 + 4, info.w - 8, info.h * 0.4, 8);
                    g.fillStyle(0xdee2e6, 1);
                    g.fillRect(c.x - R2 + 4, c.y + info.h * 0.06, info.w * 0.3, info.h * 0.42);
                    g.fillRect(c.x + R2 - 4 - info.w * 0.3, c.y + info.h * 0.06, info.w * 0.3, info.h * 0.42);
                    g.fillStyle(0x1c7ed6, 1);
                    g.fillRect(c.x - R2 + 4, c.y + info.h * 0.34, info.w * 0.3, info.h * 0.14);
                    g.fillRect(c.x + R2 - 4 - info.w * 0.3, c.y + info.h * 0.34, info.w * 0.3, info.h * 0.14);
                    var pulse = (this.beltPhase * 1.6) % 1;
                    for (var pw = 0; pw < 2; pw++) {
                        var t2 = (pulse + pw * 0.5) % 1;
                        g.lineStyle(3, 0xff8787, 0.35 * (1 - t2));
                        g.strokeCircle(c.x, c.y + info.h * 0.42, 16 + t2 * 90);
                    }
                }
            },

            moverOf: function (body) {
                for (var i = 0; i < this.movers.length; i++) if (this.movers[i].body === body) return this.movers[i];
                return null;
            },

            /* Ô trống: viền đứt CỘNG mũi tên chỉ chiều viên bi sẽ đi qua tầng
             * ấy. Thiếu mũi tên thì bé không có cách nào đoán được mảnh phải
             * quay hướng nào ngoài cách thử — mà thử sai thì phải chạy lại cả
             * cỗ máy, chán ngay. */
            paintGhosts: function () {
                var g = this.gGhost;
                g.clear();
                if (G.mode !== 'play') return;
                var slots = this.emptySlots();
                for (var i = 0; i < slots.length; i++) {
                    var s = slots[i];
                    if (s.filled) continue;
                    var bay = this.level.bays[s.bay];
                    var dir = bay.flipped ? -1 : 1;
                    var w = Math.max(110, s.w * 0.5), h = 58;
                    var pulse = 0.55 + 0.45 * Math.sin(this.beltPhase * 3);
                    g.fillStyle(0x8f7bff, 0.10);
                    g.fillRoundedRect(s.x - w / 2, s.y - h / 2, w, h, 12);
                    g.lineStyle(3, 0x8f7bff, 0.5 + 0.4 * pulse);
                    this.dashRect(g, s.x - w / 2, s.y - h / 2, w, h, 12);
                    /* mũi tên chiều đi */
                    g.fillStyle(0xffd43b, 0.85);
                    var ax = s.x - dir * 24;
                    g.fillRect(ax - dir * 10, s.y - 2.5, dir * 30, 5);
                    g.beginPath();
                    g.moveTo(ax + dir * 30, s.y - 10);
                    g.lineTo(ax + dir * 46, s.y);
                    g.lineTo(ax + dir * 30, s.y + 10);
                    g.closePath(); g.fillPath();
                }
                /* mảnh đã đặt: gắn huy hiệu quay chiều để bé biết chạm được */
                for (var k = 0; k < slots.length; k++) {
                    var f = slots[k];
                    if (!f.filled) continue;
                    var put = G.placed[f.bay];
                    if (!put || !P.KIND[put.kind].flip) continue;
                    var bx2 = f.x + Math.max(60, f.w / 2) - 14, by2 = f.y - 30;
                    g.fillStyle(0x1a1440, 0.9); g.fillCircle(bx2, by2, 15);
                    g.lineStyle(3, 0xffd43b, 0.95);
                    g.beginPath();
                    g.arc(bx2, by2, 8, -0.6, 4.2, false);
                    g.strokePath();
                    g.fillStyle(0xffd43b, 0.95);
                    g.fillTriangle(bx2 + 4, by2 - 11, bx2 + 12, by2 - 7, bx2 + 4, by2 - 2);
                }
            },

            paintBallAndPuffs: function () {
                var g = this.gBall;
                g.clear();

                for (var i = 0; i < this.puffs.length; i++) {
                    var p = this.puffs[i];
                    g.fillStyle(p.col == null ? 0xffffff : p.col, (p.col == null ? 0.32 : 0.9) * p.life);
                    g.fillCircle(p.x, p.y, (p.r || 4) + (1 - p.life) * (p.grow == null ? 7 : p.grow));
                }

                if (!this.ball) {
                    var bx = BOARD.x + this.level.bays[0].enter.x;
                    this.marble(g, bx, BOARD.y - 66, 0);
                    return;
                }
                /* vệt lăn phía sau viên bi — nhìn ra tốc độ ngay */
                for (var t = 0; t < this.trail.length; t++) {
                    var q = this.trail[t], k = (t + 1) / this.trail.length;
                    g.fillStyle(0xffd43b, 0.30 * k);
                    g.fillCircle(q.x, q.y, BALL_R * (0.35 + 0.5 * k));
                }
                this.marble(g, this.ball.position.x, this.ball.position.y, this.ball.angle);
            },

            /* Viên bi: bóng đổ, thân, vòng xoáy QUAY THEO nên nhìn thấy nó lăn,
             * và một chấm sáng phản quang cố định phía trên trái. */
            marble: function (g, x, y, ang) {
                g.fillStyle(0x0a0722, 0.35);
                g.fillCircle(x + 3, y + 5, BALL_R);
                g.fillStyle(0xb8860b, 1);
                g.fillCircle(x, y, BALL_R);
                g.fillStyle(0xffd43b, 1);
                g.fillCircle(x, y - 1, BALL_R - 2);
                g.lineStyle(3.5, 0xa8760a, 0.85);
                g.beginPath();
                g.arc(x, y, BALL_R * 0.55, ang, ang + 2.6, false);
                g.strokePath();
                g.beginPath();
                g.arc(x, y, BALL_R * 0.55, ang + Math.PI, ang + Math.PI + 2.6, false);
                g.strokePath();
                g.fillStyle(0xfffbe6, 0.95);
                g.fillCircle(x - BALL_R * 0.33, y - BALL_R * 0.36, BALL_R * 0.3);
                g.fillStyle(0xffffff, 0.6);
                g.fillCircle(x + BALL_R * 0.3, y + BALL_R * 0.34, BALL_R * 0.14);
            },

            paintTray: function () {
                var g = this.gTray;
                g.clear();
                if (G.mode !== 'play') return;
                /* khay gỗ có gờ nổi */
                g.fillStyle(0x0d0a22, 0.5);
                g.fillRoundedRect(24, TRAY.y + 5, W - 48, TRAY.h, 18);
                g.fillStyle(0x5d4718, 1);
                g.fillRoundedRect(24, TRAY.y, W - 48, TRAY.h, 18);
                g.fillStyle(0x7a5f1e, 1);
                g.fillRoundedRect(24, TRAY.y, W - 48, 8, 5);
                g.fillStyle(0x1a1440, 0.55);
                g.fillRoundedRect(34, TRAY.y + 12, W - 68, TRAY.h - 24, 12);

                var rects = this.trayRects();
                for (var i = 0; i < rects.length; i++) {
                    var r = rects[i], t = G.tray[r.i];
                    g.fillStyle(0x241c58, t.used ? 0.45 : 1);
                    g.fillRoundedRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h, 12);
                    g.lineStyle(2, 0x8f7bff, t.used ? 0.15 : 0.4);
                    g.strokeRoundedRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h, 12);
                    if (t.used) continue;
                    if (this.grab && this.grab.from === 'tray' && this.grab.idx === r.i) continue;
                    this.paintChip(g, r.x, r.y, t.kind, false);
                }
            },

            paintDrag: function () {
                var g = this.gDrag;
                g.clear();
                if (!this.grab || this.grab.from !== 'tray') return;

                /* Trong lúc kéo phải CHỈ RÕ mảnh sắp rơi vào đâu: ô nhận sáng
                 * lên và có đường nối tới ngón tay. Không có nó thì bé thả
                 * xong mới biết trúng hay trượt, mà trượt thì mảnh lặng lẽ bay
                 * về khay — đúng cái cảm giác "kéo mãi không được". */
                var t = this.slotUnder(this.grab.x, this.grab.y);
                if (t) {
                    var w = Math.max(120, t.w * 0.5) + 10, h = 68;
                    g.fillStyle(0xffd43b, 0.16);
                    g.fillRoundedRect(t.x - w / 2, t.y - h / 2, w, h, 14);
                    g.lineStyle(4, 0xffd43b, 0.95);
                    g.strokeRoundedRect(t.x - w / 2, t.y - h / 2, w, h, 14);
                    g.lineStyle(3, 0xffd43b, 0.4);
                    g.beginPath();
                    g.moveTo(this.grab.x, this.grab.y);
                    g.lineTo(t.x, t.y);
                    g.strokePath();
                    if (t.filled) {
                        /* báo trước là sẽ đổi chỗ mảnh đang nằm đó */
                        g.fillStyle(0xffd43b, 0.9);
                        g.fillCircle(t.x, t.y - h / 2 - 12, 11);
                        g.lineStyle(3, 0x1a1440, 1);
                        g.beginPath(); g.arc(t.x, t.y - h / 2 - 12, 5, 0.4, 5.2, false); g.strokePath();
                    }
                } else {
                    /* không trúng ô nào: sáng cái khay lên cho biết mảnh sẽ về đó */
                    g.lineStyle(4, 0x8f7bff, 0.75);
                    g.strokeRoundedRect(26, TRAY.y + 2, W - 52, TRAY.h - 4, 18);
                }

                g.fillStyle(0x0a0722, 0.3);
                g.fillCircle(this.grab.x + 4, this.grab.y + 8, 42);
                this.paintChip(g, this.grab.x, this.grab.y, G.tray[this.grab.idx].kind, this.grab.flip);
            },

            /* Con chip trong khay: vẽ thu nhỏ đúng dáng mảnh thật để bé nhận ra */
            paintChip: function (g, x, y, kind, flip) {
                var d = flip ? -1 : 1;
                if (kind === 'ramp') {
                    g.fillStyle(0x4a3a86, 1); g.fillRoundedRect(x - 34, y - 4, 68, 14, 7);
                    g.fillStyle(0x8f7bff, 1); g.fillRoundedRect(x - 34, y - 7, 68, 12, 6);
                    g.fillStyle(0xb9aaff, 1); g.fillRoundedRect(x - 34, y - 7, 68, 4, 2);
                } else if (kind === 'seesaw') {
                    g.fillStyle(0x1c8f74, 1); g.fillRoundedRect(x - 32, y - 9, 64, 12, 6);
                    g.fillStyle(0x63e6be, 1); g.fillRoundedRect(x - 32, y - 12, 64, 11, 5);
                    g.fillStyle(0xb9a24a, 1); g.fillCircle(x, y - 7, 5);
                    g.fillStyle(0x4a3f8f, 1); g.fillTriangle(x - 12, y + 16, x + 12, y + 16, x, y - 2);
                } else if (kind === 'spring') {
                    g.lineStyle(3, 0xff8fae, 1);
                    for (var c2 = -1; c2 <= 1; c2 += 2) {
                        g.beginPath();
                        for (var t = 0; t <= 6; t++) {
                            var yy = y + 4 + t * 3, xx = x + c2 * 13 + (t % 2 ? 6 : -6);
                            if (t === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
                        }
                        g.strokePath();
                    }
                    g.fillStyle(0xb3324f, 1); g.fillRoundedRect(x - 30, y - 8, 60, 13, 6);
                    g.fillStyle(0xff6b8a, 1); g.fillRoundedRect(x - 30, y - 11, 60, 11, 5);
                } else if (kind === 'fan') {
                    g.fillStyle(0x1864ab, 1); g.fillRoundedRect(x - 24, y - 24, 48, 48, 10);
                    g.fillStyle(0x4dabf7, 1); g.fillRoundedRect(x - 20, y - 20, 40, 40, 8);
                    for (var k = 0; k < 3; k++) {
                        var a = k * 2.094 + this.beltPhase * 6;
                        g.fillStyle(0xd0ebff, 1);
                        g.beginPath(); g.moveTo(x, y);
                        g.lineTo(x + Math.cos(a) * 17, y + Math.sin(a) * 17);
                        g.lineTo(x + Math.cos(a + 0.5) * 13, y + Math.sin(a + 0.5) * 13);
                        g.closePath(); g.fillPath();
                    }
                    g.fillStyle(0x1864ab, 1); g.fillCircle(x, y, 5);
                } else if (kind === 'belt') {
                    g.fillStyle(0x171233, 1); g.fillRoundedRect(x - 34, y - 10, 68, 20, 10);
                    g.fillStyle(0x2a2350, 1); g.fillRoundedRect(x - 34, y - 12, 68, 19, 9);
                    for (var b2 = -1; b2 <= 1; b2++) {
                        g.fillStyle(0xffd43b, 0.9);
                        g.fillRect(x + b2 * 16 - 2, y - 9, 4, 13);
                    }
                    g.fillStyle(0x7a72c4, 1);
                    g.fillCircle(x - 30, y - 2, 7); g.fillCircle(x + 30, y - 2, 7);
                } else if (kind === 'bumper') {
                    g.fillStyle(0x8c2b52, 1); g.fillCircle(x, y + 2, 24);
                    g.fillStyle(0xf783ac, 1); g.fillCircle(x, y, 21);
                    g.fillStyle(0xffd3e3, 1); g.fillCircle(x - 6, y - 7, 7);
                } else if (kind === 'magnet') {
                    g.fillStyle(0xc92a2a, 1); g.fillRoundedRect(x - 20, y - 20, 40, 26, 8);
                    g.fillStyle(0xff8787, 1); g.fillRoundedRect(x - 16, y - 17, 32, 17, 6);
                    g.fillStyle(0xdee2e6, 1);
                    g.fillRect(x - 18, y + 2, 12, 18); g.fillRect(x + 6, y + 2, 12, 18);
                    g.fillStyle(0x1c7ed6, 1);
                    g.fillRect(x - 18, y + 14, 12, 6); g.fillRect(x + 6, y + 14, 12, 6);
                }
                void d;
            },

            polyFill: function (g, body) {
                for (var k = 0; k < body.parts.length; k++) {
                    var part = body.parts[k];
                    if (part === body && body.parts.length > 1) continue;
                    var v = part.vertices;
                    g.beginPath();
                    g.moveTo(v[0].x, v[0].y);
                    for (var q = 1; q < v.length; q++) g.lineTo(v[q].x, v[q].y);
                    g.closePath();
                    g.fillPath();
                }
            },
            polyStroke: function (g, body) {
                for (var k = 0; k < body.parts.length; k++) {
                    var part = body.parts[k];
                    if (part === body && body.parts.length > 1) continue;
                    var v = part.vertices;
                    g.beginPath();
                    g.moveTo(v[0].x, v[0].y);
                    for (var q = 1; q < v.length; q++) g.lineTo(v[q].x, v[q].y);
                    g.closePath();
                    g.strokePath();
                }
            },
            dashRect: function (g, x, y, w, h, dash) {
                var pts = [[x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]];
                for (var i = 0; i < pts.length; i++) {
                    var p = pts[i], len = Math.hypot(p[2] - p[0], p[3] - p[1]);
                    var n = Math.max(1, Math.round(len / (dash * 2)));
                    for (var k = 0; k < n; k++) {
                        var t0 = k / n, t1 = t0 + 0.5 / n;
                        g.beginPath();
                        g.moveTo(p[0] + (p[2] - p[0]) * t0, p[1] + (p[3] - p[1]) * t0);
                        g.lineTo(p[0] + (p[2] - p[0]) * t1, p[1] + (p[3] - p[1]) * t1);
                        g.strokePath();
                    }
                }
            },
            puff: function (x, y, dir) {
                this.puffs.push({ x: x, y: y, vx: dir * 170, vy: 0, life: 1 });
                if (this.puffs.length > 60) this.puffs.shift();
            },
            stepPuffs: function (dt) {
                for (var i = this.puffs.length - 1; i >= 0; i--) {
                    var p = this.puffs[i];
                    p.x += p.vx * dt;
                    p.y += (p.vy || 0) * dt;
                    if (p.vy) p.vy += 320 * dt;      // tia lửa thì rơi xuống
                    p.life -= dt * (p.col ? 2.6 : 1.6);
                    if (p.life <= 0) this.puffs.splice(i, 1);
                }
            },

            /* ---------------------------------------------------------------
             * CỬA CHO MÁY SOÁT (check-levels.html)
             *
             * Máy soát chạy ĐÚNG cỗ máy bé đang chơi, không phải bản chép: nó
             * dựng màn bằng chính buildLevel(), lắp mảnh bằng chính đường bé
             * lắp, rồi quay bánh bằng chính stepAll().
             * -------------------------------------------------------------*/
            simulate: function (idx, assign, cap) {
                this.frozen = true;
                G.mode = 'play';
                this.buildLevel(idx);
                for (var k in assign) G.placed[k] = assign[k];
                var soundWas = sfx.on;
                sfx.on = false;
                this.startRun();
                var steps = 0, lim = cap || RUN_CAP;
                while (G.running && steps++ < lim) this.stepAll(1 / 60);
                sfx.on = soundWas;
                var out = { result: G.result || 'timeout', steps: steps };
                G.running = false;
                return out;
            }
        });
    }

    /* ========================================================================
     *  6. GIAO DIỆN
     * ======================================================================*/

    var el = function (id) { return document.getElementById(id); };
    function show(node) { if (node) node.classList.remove('hidden'); }
    function hide(node) { if (node) node.classList.add('hidden'); }
    function hideAll() {
        ['menu-overlay', 'win-overlay', 'levels-overlay', 'help-overlay'].forEach(function (id) { hide(el(id)); });
    }

    var UI = {
        game: null, scene: null, pending: false,

        sceneReady: function (scene) {
            this.scene = scene;
            if (this.pending) { this.pending = false; this.play(G.level); }
        },

        boot: function () {
            if (this.game) return;
            definePlayScene();
            this.game = new Phaser.Game({
                type: Phaser.AUTO,
                parent: 'game-canvas',
                width: W, height: H,
                transparent: true,
                scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
                physics: { default: 'matter', matter: { gravity: { y: 3.4 }, debug: false } },
                scene: [PlayScene],
                banner: false
            });
        },

        play: function (idx) {
            G.level = Math.max(0, Math.min(LEVELS.length - 1, idx));
            G.mode = 'play';
            hideAll();
            document.body.classList.add('playing');
            if (!this.scene) { this.pending = true; this.boot(); return; }
            this.scene.frozen = false;
            this.scene.buildLevel(G.level);
            this.paintHud();
        },

        afterRun: function (how) {
            if (how === 'win') {
                sfx.win();
                var stars = store.finish(G.level, G.tries);
                G.mode = 'won';
                document.body.classList.remove('playing');
                el('win-level').textContent = (G.level + 1);
                el('win-tries').textContent = G.tries;
                el('win-stars').textContent = '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars);
                el('btn-next').hidden = (G.level + 1 >= LEVELS.length);
                show(el('win-overlay'));
            } else {
                sfx.fail();
                showTip(how === 'stall' ? 'The marble got stuck - try another piece!'
                    : 'The marble missed the basket!', 2100);
                this.paintHud();
            }
        },

        paintHud: function () {
            var lvBox = el('hud-level'), leftBox = el('hud-left');
            if (!lvBox) return;
            lvBox.textContent = (G.level + 1);
            var left = 0;
            G.tray.forEach(function (t) { if (!t.used) left++; });
            leftBox.textContent = left;
            el('hud').hidden = (G.mode !== 'play');
            el('pad').hidden = (G.mode !== 'play');
            var run = el('btn-run');
            if (run) run.disabled = G.running;
            this.placeHud();
        },

        /* Bảng số là thẻ HTML thật (để /i18n.js dịch được), nên phải tự tay đặt
         * nó lên đúng chỗ trên canvas đã co lại. */
        placeHud: function () {
            var host = el('game-canvas');
            var wrap = host ? host.querySelector('canvas') : null;
            var outer = el('board-wrap');
            if (!wrap || !outer) return;
            var r = wrap.getBoundingClientRect(), base = outer.getBoundingClientRect();
            var k = r.width / W;
            var hud = el('hud');
            hud.style.left = (r.left - base.left + (W / 2) * k) + 'px';
            hud.style.top = (r.top - base.top + 74 * k) + 'px';
            hud.style.transform = 'translate(-50%, -50%) scale(' + Math.max(0.62, Math.min(1, k * 1.3)) + ')';
        },

        paintLevels: function () {
            var grid = el('levels-grid');
            if (!grid) return;
            grid.innerHTML = '';
            for (var i = 0; i < LEVELS.length; i++) {
                var b = document.createElement('button');
                var open = store.unlocked(i);
                b.className = 'lv-btn' + (open ? '' : ' is-locked');
                var st = store.data.stars[i] || 0;
                b.innerHTML = '<b>' + (i + 1) + '</b><span>' + (open ? ('★'.repeat(st) || '·') : '🔒') + '</span>';
                if (open) {
                    (function (n) {
                        b.addEventListener('click', function () { UI.play(n); });
                    })(i);
                }
                grid.appendChild(b);
            }
            el('levels-stars').textContent = store.totalStars() + ' / ' + (LEVELS.length * 3);
        }
    };

    var tipTimer = 0;
    function showTip(text, ms) {
        var t = el('tip');
        if (!t) return;
        t.textContent = text;
        t.classList.remove('hidden');
        clearTimeout(tipTimer);
        tipTimer = setTimeout(function () { t.classList.add('hidden'); }, ms || 1600);
    }

    function openMenu() {
        G.mode = 'menu';
        document.body.classList.remove('playing');
        hideAll();
        show(el('menu-overlay'));
        el('menu-progress').textContent = store.data.done + ' / ' + LEVELS.length;
    }

    function wireButtons() {
        el('btn-play').addEventListener('click', function () {
            sfx.wake();
            UI.play(Math.min(store.data.done, LEVELS.length - 1));
        });
        el('btn-menu-levels').addEventListener('click', function () {
            UI.paintLevels(); hideAll(); show(el('levels-overlay'));
        });
        el('btn-levels-back').addEventListener('click', openMenu);
        el('btn-nav-levels').addEventListener('click', function () {
            UI.paintLevels(); hideAll(); show(el('levels-overlay'));
        });
        el('btn-nav-menu').addEventListener('click', openMenu);
        el('btn-help').addEventListener('click', function () { hideAll(); show(el('help-overlay')); });
        el('btn-help-back').addEventListener('click', function () {
            hideAll();
            if (G.mode === 'play') document.body.classList.add('playing');
            else show(el('menu-overlay'));
        });
        el('btn-next').addEventListener('click', function () { UI.play(G.level + 1); });
        el('btn-again').addEventListener('click', function () { UI.play(G.level); });
        el('btn-win-menu').addEventListener('click', openMenu);
        el('btn-reset').addEventListener('click', function () {
            store.reset(); UI.paintLevels(); openMenu();
        });

        el('btn-run').addEventListener('click', function () {
            sfx.wake();
            if (UI.scene) UI.scene.startRun();
            UI.paintHud();
        });
        /* Nút LÀM LẠI trả cả màn về lúc mới vào: mọi mảnh về khay, cỗ máy về
         * đúng hình dạng ban đầu.
         *
         * Trước đó nó chỉ thu viên bi về chỗ cũ, còn mảnh thì vẫn nằm nguyên
         * chỗ bé đã đặt. Anh Hiếu báo: "nhiều lúc anh không kéo được thanh gỗ
         * với băng chuyền về chỗ đặt ban đầu để ghép lại" — đúng, vì muốn xếp
         * lại từ đầu thì phải gỡ từng mảnh một bằng tay, mà gỡ mảnh là một cú
         * kéo khó chịu. Một nút xoá sạch làm lại là xong. */
        el('btn-retry').addEventListener('click', function () {
            sfx.wake();
            if (!UI.scene) return;
            G.running = false;
            G.result = '';
            G.placed = {};
            G.tray.forEach(function (t) { t.used = false; });
            UI.scene.grab = null;
            UI.scene.rebuildFromPlacement();
            UI.scene.paintAll();
            UI.paintHud();
            showTip('Cleared - build it again!', 1400);
        });

        var soundBtn = el('btn-sound'), soundIcon = el('sound-icon');
        function paintSound() {
            soundIcon.className = 'fa-solid ' + (sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
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

        window.addEventListener('resize', function () { if (G.mode === 'play') UI.placeHud(); });

        window.marbleMachine = {
            G: G, UI: UI, store: store, P: P, LEVELS: LEVELS,
            W: W, H: H, BOARD: BOARD,
            play: function (i) { UI.play(i || 0); },
            run: function () { if (UI.scene) UI.scene.startRun(); },
            place: function (bay, kind, flip) {
                G.placed[bay] = { kind: kind, flip: !!flip, trayIdx: -1 };
                if (UI.scene) { UI.scene.rebuildFromPlacement(); UI.scene.paintAll(); }
            },
            /* Lời giải mẫu của một màn: mỗi ô trống lắp đúng mảnh của nó, đúng
             * chiều tầng ấy đang quay. */
            solutionOf: function (idx) {
                var lv = P.inflate(LEVELS[idx]);
                var out = {};
                lv.bays.forEach(function (b) {
                    if (b.gone) out[b.index] = { kind: b.slot.kind, flip: b.flipped, trayIdx: -1 };
                });
                return out;
            },
            simulate: function (idx, assign, cap) {
                return UI.scene ? UI.scene.simulate(idx, assign, cap) : null;
            },
            state: function () {
                return { mode: G.mode, level: G.level, running: G.running, result: G.result, tries: G.tries };
            }
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
