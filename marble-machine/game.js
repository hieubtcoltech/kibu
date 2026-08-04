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
    var SNAP = 96;                 // thả mảnh cách ô trống trong ngần này thì hít vào
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
    function dirOf(s) { return s.x < P.BAY_W / 2 ? 1 : -1; }

    function definePlayScene() {
        if (PlayScene) return;

        PlayScene = new Phaser.Class({
            Extends: Phaser.Scene,
            initialize: function PlayScene() { Phaser.Scene.call(this, { key: 'play' }); },

            create: function () {
                this.matter.world.setGravity(0, 1.0);

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
                this.puffs = [];         // hạt gió, bụi nảy — chỉ để nhìn
                this.beltPhase = 0;

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

            clearWorld: function () {
                M.Composite.clear(this.matter.world.localWorld, false);
                this.bodies = [];
                this.movers = [];
                this.ball = null;
                this.puffs = [];
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
                        kick: { vx: (s.kick ? s.kick.vx : 300) * dirOf(s), vy: s.kick ? s.kick.vy : -400 }
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
                    var dir2 = s.x < P.BAY_W / 2 ? 1 : -1;
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
                this.ball = M.Bodies.circle(bx, BOARD.y - 40, BALL_R, {
                    friction: 0.03, frictionAir: 0.004, restitution: 0.22,
                    density: 0.0022, label: 'ball'
                });
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
                var base = bay.slot;
                var s = {};
                for (var k in base) s[k] = base[k];
                s.kind = put.kind;
                var wantFlip = (put.flip === true);
                if (wantFlip !== bay.flipped) {
                    s.x = P.BAY_W - s.x;
                    if (s.angle) s.angle = -s.angle;
                    if (s.speed) s.speed = -s.speed;
                }
                return s;
            },

            /* MỘT nhịp máy trọn vẹn — mọi nơi cần quay bánh đều gọi hàm này */
            stepAll: function (dt) {
                if (G.running) {
                    this.applyForces();
                    M.Engine.update(this.matter.world.engine, dt * 1000);
                    this.checkBall(dt);
                } else {
                    M.Engine.update(this.matter.world.engine, dt * 1000);
                }
                this.beltPhase += dt;
                this.stepPuffs(dt);
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
                            M.Body.setVelocity(b, { x: m.kick.vx / 60, y: m.kick.vy / 60 });
                            this.puff(m.at.x, m.at.y - 14, 0);
                            sfx.bounce();
                        }
                    } else if (m.kind === 'bumper') {
                        var bdx = b.position.x - m.at.x, bdy = b.position.y - m.at.y;
                        var bd = Math.sqrt(bdx * bdx + bdy * bdy);
                        if (!m.fired && bd < m.r + BALL_R + 3 && bd > 1) {
                            m.fired = true;
                            M.Body.setVelocity(b, {
                                x: (m.speed / 60) * bdx / bd,
                                y: (m.speed / 60) * bdy / bd
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
                        if (onTop) M.Body.setVelocity(b, { x: m.speed, y: b.velocity.y });
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

            onDown: function (p) {
                if (G.mode !== 'play' || G.running) return;
                sfx.wake();
                var wx = p.worldX, wy = p.worldY;

                /* chạm vào mảnh đã đặt trên máy → quay chiều, chạm lâu → gỡ ra */
                var slots = this.emptySlots();
                for (var i = 0; i < slots.length; i++) {
                    var s = slots[i];
                    if (!s.filled) continue;
                    if (Math.abs(wx - s.x) < Math.max(60, s.w / 2) && Math.abs(wy - s.y) < 54) {
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
                if (this.grab.from === 'board' && this.grab.moved > 18) {
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
                    }
                    this.paintAll();
                    return;
                }

                /* thả mảnh: tìm ô trống gần nhất */
                var slots = this.emptySlots(), best = null, bd = SNAP;
                for (var i = 0; i < slots.length; i++) {
                    var s = slots[i];
                    if (s.filled) continue;
                    var d = Math.hypot(g.x - s.x, g.y - s.y);
                    if (d < bd) { bd = d; best = s; }
                }
                if (best) {
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

            paintBack: function () {
                var g = this.gBack;
                g.clear();
                /* khung máy */
                g.fillStyle(0x241c58, 1);
                g.fillRoundedRect(BOARD.x - 26, BOARD.y - 60, BOARD.w + 52, BOARD.h + 168, 22);
                g.fillStyle(0x1a1442, 1);
                g.fillRoundedRect(BOARD.x - 16, BOARD.y - 50, BOARD.w + 32, BOARD.h + 148, 16);
                /* vạch chia tầng cho dễ nhìn */
                g.lineStyle(2, 0x342a72, 0.7);
                for (var i = 1; i < this.level.bays.length; i++) {
                    var y = BOARD.y + i * P.BAY_H;
                    g.beginPath(); g.moveTo(BOARD.x - 10, y); g.lineTo(BOARD.x + BOARD.w + 10, y); g.strokePath();
                }
                /* ống thả bi trên nóc */
                g.fillStyle(0x3b2a8f, 1);
                var bx = BOARD.x + this.level.bays[0].enter.x;
                g.fillRoundedRect(bx - 30, BOARD.y - 84, 60, 46, 10);
                g.fillStyle(0x8f7bff, 1);
                g.fillRoundedRect(bx - 22, BOARD.y - 76, 44, 10, 5);
                /* giỏ */
                var b = this.basket;
                g.fillStyle(0x2b2660, 1);
                g.fillRoundedRect(b.x - BASKET.w / 2 - 8, this.floorY - BASKET.h - 8, BASKET.w + 16, BASKET.h + 12, 12);
                g.fillStyle(0x63e6be, 0.16);
                g.fillRoundedRect(b.x - BASKET.w / 2 + 2, this.floorY - BASKET.h, BASKET.w - 4, BASKET.h, 8);
                g.lineStyle(4, 0x63e6be, 0.85);
                g.strokeRoundedRect(b.x - BASKET.w / 2 - 8, this.floorY - BASKET.h - 8, BASKET.w + 16, BASKET.h + 12, 12);
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
                this.paintBeltArrows(g);
            },

            paintFixed: function (g, body, info) {
                g.fillStyle(0x4a3f8f, 1);
                this.polyFill(g, body);
                g.lineStyle(3, 0x6a5cc0, 1);
                this.polyStroke(g, body);
            },

            paintPart: function (g, body, info) {
                var col = P.KIND[info.kind] ? P.KIND[info.kind].color : 0x8f7bff;
                g.fillStyle(col, 1);
                this.polyFill(g, body);
                g.lineStyle(3, 0x1a1442, 0.55);
                this.polyStroke(g, body);

                /* dấu riêng của từng kiểu để bé nhận ra ngay */
                var c = body.position;
                if (info.kind === 'fan') {
                    g.fillStyle(0xffffff, 0.9);
                    var t = this.beltPhase * 9;
                    for (var k = 0; k < 3; k++) {
                        var a = t + k * 2.094;
                        g.fillCircle(c.x + Math.cos(a) * 16, c.y + Math.sin(a) * 16, 6);
                    }
                    g.fillCircle(c.x, c.y, 7);
                } else if (info.kind === 'magnet') {
                    g.fillStyle(0xffffff, 0.9);
                    g.fillRect(c.x - 16, c.y - 6, 12, 12);
                    g.fillRect(c.x + 4, c.y - 6, 12, 12);
                } else if (info.kind === 'bumper') {
                    g.fillStyle(0xffffff, 0.55);
                    g.fillCircle(c.x, c.y, info.w / 2 - 12);
                } else if (info.kind === 'spring') {
                    g.lineStyle(3, 0xffffff, 0.7);
                    g.beginPath();
                    for (var s = 0; s <= 10; s++) {
                        var px = c.x - info.w / 2 + (info.w / 10) * s;
                        var py = c.y + (s % 2 ? -5 : 5);
                        if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
                    }
                    g.strokePath();
                }
            },

            paintBeltArrows: function (g) {
                for (var i = 0; i < this.movers.length; i++) {
                    var m = this.movers[i];
                    if (m.kind !== 'belt') continue;
                    var b = m.body, w = b.plugin.paint.w, dir = m.speed > 0 ? 1 : -1;
                    g.fillStyle(0x1a1442, 0.55);
                    var span = w - 30, step = 46;
                    var off = ((this.beltPhase * 90 * dir) % step + step) % step;
                    for (var x = -span / 2 + off - step; x < span / 2; x += step) {
                        var cx = b.position.x + x;
                        if (cx < b.position.x - span / 2 || cx > b.position.x + span / 2) continue;
                        g.beginPath();
                        g.moveTo(cx - 7 * dir, b.position.y - 6);
                        g.lineTo(cx + 7 * dir, b.position.y);
                        g.lineTo(cx - 7 * dir, b.position.y + 6);
                        g.closePath();
                        g.fillPath();
                    }
                }
            },

            /* Ô trống: vẽ viền đứt và cái bóng mờ của mảnh cần lắp */
            paintGhosts: function () {
                var g = this.gGhost;
                g.clear();
                if (G.mode !== 'play') return;
                var slots = this.emptySlots();
                for (var i = 0; i < slots.length; i++) {
                    var s = slots[i];
                    if (s.filled) continue;
                    var w = Math.max(96, s.w * 0.5), h = 54;
                    g.lineStyle(3, 0x8f7bff, 0.85);
                    this.dashRect(g, s.x - w / 2, s.y - h / 2, w, h, 12);
                    g.fillStyle(0x8f7bff, 0.10);
                    g.fillRoundedRect(s.x - w / 2, s.y - h / 2, w, h, 10);
                }
            },

            paintBallAndPuffs: function () {
                var g = this.gBall;
                g.clear();
                for (var i = 0; i < this.puffs.length; i++) {
                    var p = this.puffs[i];
                    g.fillStyle(0xffffff, 0.35 * p.life);
                    g.fillCircle(p.x, p.y, 4 + (1 - p.life) * 7);
                }
                if (!this.ball) {
                    /* Viên bi nằm chờ sẵn trong ống trên nóc máy. Không vẽ nó
                     * thì lúc chưa bấm CHẠY cả cỗ máy trông như thiếu nhân
                     * vật chính — bé không biết cái gì sắp chạy xuống. */
                    var bx = BOARD.x + this.level.bays[0].enter.x;
                    g.fillStyle(0xffd43b, 0.9);
                    g.fillCircle(bx, BOARD.y - 62, BALL_R);
                    g.fillStyle(0xfff3bf, 0.9);
                    g.fillCircle(bx - BALL_R * 0.32, BOARD.y - 62 - BALL_R * 0.34, BALL_R * 0.36);
                    return;
                }
                var c = this.ball.position;
                g.fillStyle(0x121026, 0.28);
                g.fillCircle(c.x + 3, c.y + 4, BALL_R);
                g.fillStyle(0xffd43b, 1);
                g.fillCircle(c.x, c.y, BALL_R);
                g.fillStyle(0xfff3bf, 1);
                g.fillCircle(c.x - BALL_R * 0.32, c.y - BALL_R * 0.34, BALL_R * 0.36);
            },

            paintTray: function () {
                var g = this.gTray;
                g.clear();
                if (G.mode !== 'play') return;
                g.fillStyle(0x241c58, 1);
                g.fillRoundedRect(24, TRAY.y, W - 48, TRAY.h, 18);
                var rects = this.trayRects();
                for (var i = 0; i < rects.length; i++) {
                    var r = rects[i], t = G.tray[r.i];
                    g.fillStyle(0x1a1442, 1);
                    g.fillRoundedRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h, 12);
                    if (t.used) continue;
                    if (this.grab && this.grab.from === 'tray' && this.grab.idx === r.i) continue;
                    this.paintChip(g, r.x, r.y, t.kind, false);
                }
            },

            paintDrag: function () {
                var g = this.gDrag;
                g.clear();
                if (!this.grab || this.grab.from !== 'tray') return;
                this.paintChip(g, this.grab.x, this.grab.y, G.tray[this.grab.idx].kind, this.grab.flip);
            },

            /* Con chip trong khay: vẽ mảnh thu nhỏ cho bé nhận ra hình dáng */
            paintChip: function (g, x, y, kind, flip) {
                var col = P.KIND[kind].color;
                var d = flip ? -1 : 1;
                g.fillStyle(col, 1);
                if (kind === 'ramp') {
                    g.save && g.save();
                    g.fillRoundedRect(x - 34, y - 6, 68, 12, 6);
                } else if (kind === 'domino') {
                    for (var i = 0; i < 3; i++) g.fillRoundedRect(x - 30 + i * 22, y - 20, 10, 40, 3);
                } else if (kind === 'seesaw') {
                    g.fillRoundedRect(x - 34, y - 5, 68, 10, 5);
                    g.fillTriangle(x - 10, y + 18, x + 10, y + 18, x, y + 4);
                } else if (kind === 'spring') {
                    g.fillRoundedRect(x - 30, y + 2, 60, 12, 6);
                    g.lineStyle(3, col, 1);
                    g.beginPath();
                    for (var s = 0; s <= 8; s++) {
                        var px = x - 24 + 6 * s, py = y - 6 + (s % 2 ? -6 : 6);
                        if (s === 0) g.moveTo(px, py); else g.lineTo(px, py);
                    }
                    g.strokePath();
                } else if (kind === 'fan') {
                    g.fillCircle(x, y, 22);
                    g.fillStyle(0x1a1442, 0.85);
                    for (var k = 0; k < 3; k++) {
                        var a = k * 2.094;
                        g.fillCircle(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 5);
                    }
                } else if (kind === 'belt') {
                    g.fillRoundedRect(x - 34, y - 8, 68, 16, 8);
                    g.fillStyle(0x1a1442, 0.7);
                    g.fillTriangle(x - 6 * d, y - 6, x + 8 * d, y, x - 6 * d, y + 6);
                } else if (kind === 'bumper') {
                    g.fillCircle(x, y, 24);
                    g.fillStyle(0xffffff, 0.5);
                    g.fillCircle(x, y, 12);
                } else if (kind === 'magnet') {
                    g.fillRoundedRect(x - 20, y - 18, 40, 36, 6);
                    g.fillStyle(0xffffff, 0.9);
                    g.fillRect(x - 14, y + 4, 10, 12);
                    g.fillRect(x + 4, y + 4, 10, 12);
                }
            },

            /* ---- mấy hàm vẽ vặt ---- */
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
                this.puffs.push({ x: x, y: y, vx: dir * 130, life: 1 });
                if (this.puffs.length > 40) this.puffs.shift();
            },
            stepPuffs: function (dt) {
                for (var i = this.puffs.length - 1; i >= 0; i--) {
                    var p = this.puffs[i];
                    p.x += p.vx * dt;
                    p.life -= dt * 1.6;
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
                physics: { default: 'matter', matter: { gravity: { y: 1.0 }, debug: false } },
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
        el('btn-retry').addEventListener('click', function () {
            if (UI.scene) { UI.scene.rebuildFromPlacement(); UI.scene.paintAll(); }
            G.running = false;
            UI.paintHud();
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
