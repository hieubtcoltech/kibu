/**
 * BẮN VỊT (Duck Shoot) — KIBU Games
 * ----------------------------------------------------------------------------
 * Một tới bốn bé ngồi cạnh nhau trước cùng một màn hình. Màn hình chia làm
 * từng làn, mỗi bé một làn. Đàn vịt bật lên từ bụi cỏ ở khắp nơi rồi lượn vòng
 * bay lên cao — bé chỉ bắn được con vịt đang ở trong làn của mình. Con vịt bật
 * lên ở làn bé 2 mà bé 2 trượt thì nó dạt sang làn bé 3, rồi bé 4. Cả bàn cùng
 * nín thở nhìn một con vịt trôi dần sang phía mình.
 *
 * KHÔNG PHẢI CON NÀO BAY QUA CŨNG NÊN BẮN
 * Thỉnh thoảng có con chim lạ — thân đen, ức đỏ, mỏ nhọn — bay lẫn vào đàn.
 * Bắn nhầm là trừ 3 điểm và mất chuỗi. Đây là ý anh Hiếu, và nó chữa đúng chỗ
 * yếu nhất: không có nó thì bé chỉ việc bấm liên tục vào chỗ nào có động,
 * mắt không cần làm gì. Có nó thì mỗi phát bắn là một quyết định.
 *
 * SÁU VÒNG, MỖI VÒNG MỘT CẢNH KHÁC HẲN
 * Bình minh đồng cỏ → hoàng hôn mặt hồ → đêm đom đóm → trời nổi bão → đàn vịt
 * kéo về → vòng vàng. Không chỉ đổi màu nền: vịt bay kiểu khác, nhanh chậm
 * khác, và đêm thì tối om chỉ thấy vịt lúc nó lướt qua vệt trăng.
 *
 * CÔNG BẰNG NẰM TRONG CÁCH DỰNG, KHÔNG PHẢI LỜI HỨA
 * Luật chơi để riêng ở rules.js, và duck-shoot/check-fair.js chạy 400 ván cho
 * mỗi cỡ bàn rồi đếm cho từng làn: số lần gặp vịt trước, số giây được ngắm, và
 * cơ hội ăn điểm. Cả ba phải chênh nhau dưới 6%. Máy ấy đã bắt được hai lỗi
 * thiết kế thật của em, ghi đủ trong hai tệp kia.
 *
 * Bố cục file:
 *   1. Cấu hình   2. Tiến trình   3. Âm thanh   4. Trạng thái
 *   5. Scene Phaser (cảnh, đàn vịt, bắn, chú chó)   6. Giao diện   7. Khởi động
 */
(function () {
    'use strict';

    var A = window.DuckArt;
    var R = window.DuckRules;
    var TAU = Math.PI * 2;

    /* ========================================================================
     *  1. CẤU HÌNH
     * ======================================================================*/

    /* KHỔ THẾ GIỚI ĐỔI THEO MÁY — không ép một khổ ngang duy nhất.
     *
     * Bản đầu em cố định 1280×720 rồi để Phaser co cho vừa. Trên máy tính thì
     * đẹp, nhưng anh Hiếu mở bằng điện thoại cầm dựng thì cả bầu trời co thành
     * một dải mỏng kẹp giữa hai vùng đen — gần như không còn chỗ chơi. Ảnh anh
     * gửi cho thấy vùng chơi chỉ chiếm khoảng một phần tư màn hình.
     *
     * Chữa bằng cách chọn khổ theo khung thật:
     *   · khung nằm ngang  → 1280 ô ngang, cao suy ra từ tỉ lệ
     *   · khung dựng đứng  →  720 ô ngang, cao suy ra từ tỉ lệ
     * Bề ngang nhỏ đi ở khổ dựng để con vịt vẫn to bằng chừng ấy ngón tay trên
     * màn hẹp; nếu giữ 1280 thì con vịt chỉ còn 9px trên máy rộng 390px.
     *
     * Tốc độ bay được nhân theo khổ ở rules.js, nên khổ nào cũng bay "nhanh
     * như nhau" theo cảm nhận, và máy soát công bằng chạy cả hai khổ. */
    var W = 1280, H = 720;
    var GROUND = H * 0.80;          // vịt bật lên từ đây (R.groundOf tính lại)
    var TOP = 70;                   // cao hơn đây là khuất tầm bắn

    /* Chọn khổ từ bề ngang và bề cao thật của khung chơi. Trả về {W, H}. */
    function pickSize(cw, ch) {
        if (!(cw > 0) || !(ch > 0)) return { W: 1280, H: 720 };
        var ar = cw / ch;
        var w = ar >= 1.15 ? 1280 : 720;
        /* Chặn hai đầu để cảnh không bị dẹt hay dài quá mức: dưới 0.52 thì bầu
         * trời cao lêu nghêu, vịt bay mãi không tới đỉnh; trên 2.1 thì đồi và
         * mặt trời bị kéo bẹp. */
        var a = Math.max(0.52, Math.min(2.8, ar));
        return { W: w, H: Math.round(w / a) };
    }

    /* Đặt khổ và tính lại những mốc suy ra từ nó. TOP giữ đúng tỉ lệ 70/720 vì
     * nó là mép dưới của dải bảng điểm, mà dải ấy cũng co theo khung. */
    function applySize(size) {
        W = size.W;
        H = size.H;
        GROUND = R.groundOf(H);
        TOP = R.topOf(H);
        var st = document.querySelector('.stage');
        if (st) {
            st.style.setProperty('--stage-w', W);
            st.style.setProperty('--stage-h', H);
        }
    }

    var KIDS = [
        { vi: 'BÉ 1', en: 'KID 1', emoji: '🦆', color: 0x38bdf8, css: '#38bdf8' },
        { vi: 'BÉ 2', en: 'KID 2', emoji: '🐤', color: 0xffd43b, css: '#ffd43b' },
        { vi: 'BÉ 3', en: 'KID 3', emoji: '🐣', color: 0x8ce99a, css: '#8ce99a' },
        { vi: 'BÉ 4', en: 'KID 4', emoji: '🦉', color: 0xff8fae, css: '#ff8fae' }
    ];
    /* Phím cho bé nào không dùng chạm: bắn con vịt gần tâm làn mình nhất. */
    var KEYSETS = { 1: ['Space'], 2: ['KeyA', 'KeyL'], 3: ['KeyA', 'KeyG', 'KeyL'], 4: ['KeyA', 'KeyF', 'KeyJ', 'KeyL'] };
    var KEYLABEL = { Space: 'SPACE', KeyA: 'A', KeyF: 'F', KeyG: 'G', KeyJ: 'J', KeyL: 'L' };

    var SHOT_COOL = 0.30;           // giây giữa hai phát của cùng một bé

    /* ========================================================================
     *  2. TIẾN TRÌNH
     * ======================================================================*/

    var KEY = 'kibu_duck_shoot';
    var store = {
        data: { best: 0, plays: 0 },
        load: function () {
            try {
                var raw = localStorage.getItem(KEY);
                if (raw) { var d = JSON.parse(raw); if (d && typeof d === 'object') this.data = d; }
            } catch (e) { }
        },
        save: function () { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
        record: function (score) {
            this.data.plays = (this.data.plays || 0) + 1;
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
            g.gain.setValueAtTime(vol || 0.06, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        },
        shot: function () { this.tone(520, 90, 0.10, 'square', 0.05); },
        hit: function () { this.tone(760, 1180, 0.13, 'triangle', 0.07); },
        gold: function () {
            var s = this;
            [880, 1174, 1568].forEach(function (f, i) { setTimeout(function () { s.tone(f, f, 0.12, 'triangle', 0.07); }, i * 70); });
        },
        miss: function () { this.tone(200, 130, 0.11, 'sawtooth', 0.035); },
        /* bắn nhầm chim lạ: hai nốt tụt xuống, nghe là biết mình vừa làm hỏng */
        wrong: function () {
            var s = this;
            this.tone(330, 240, 0.16, 'square', 0.055);
            setTimeout(function () { s.tone(190, 120, 0.24, 'square', 0.05); }, 110);
        },
        quack: function () { this.tone(340, 250, 0.14, 'sawtooth', 0.05); },
        caw: function () { this.tone(720, 430, 0.18, 'square', 0.045); },
        splash: function () { this.tone(1200, 320, 0.16, 'sine', 0.05); },
        rustle: function () { this.tone(260, 190, 0.12, 'sawtooth', 0.03); },
        away: function () { this.tone(300, 180, 0.28, 'sine', 0.045); },
        round: function () {
            var s = this;
            [523, 659, 784].forEach(function (f, i) { setTimeout(function () { s.tone(f, f, 0.15, 'triangle', 0.06); }, i * 110); });
        },
        win: function () {
            var s = this;
            [523, 659, 784, 1047, 1319].forEach(function (f, i) { setTimeout(function () { s.tone(f, f, 0.18, 'triangle', 0.075); }, i * 120); });
        }
    };

    /* ========================================================================
     *  4. TRẠNG THÁI
     * ======================================================================*/

    var G = {
        mode: 'menu',        // menu | intro | play | tally | over
        kids: 2,
        seed: 1,
        round: 0,
        scores: [], streaks: [], hits: [], shots: [], wrong: [],
        roundScores: [],
        ducks: [],           // con đang bay
        queue: [],           // con chưa tới lượt bật lên
        t: 0,                // giây trong vòng
        cool: []             // hồi phát bắn của từng bé
    };

    /* Trộn hai màu theo tỉ lệ k. Dùng cho mấy lớp cỏ tiền cảnh: mỗi lớp một
     * sắc độ giữa màu cỏ và màu lá tối, không phải phủ đen lên. */
    function mixHex(a, b, k) {
        var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
        var br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
        return (Math.round(ar + (br - ar) * k) << 16)
            | (Math.round(ag + (bg - ag) * k) << 8)
            | Math.round(ab + (bb - ab) * k);
    }

    function laneW() { return W / G.kids; }
    function laneOf(x) {
        var i = Math.floor(x / laneW());
        return i < 0 ? 0 : (i >= G.kids ? G.kids - 1 : i);
    }
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
                this.bakeDucks();

                this.gSky = this.add.graphics().setDepth(1);
                this.gScene = this.add.graphics().setDepth(2);
                this.gLane = this.add.graphics().setDepth(3);
                this.gDuck = this.add.graphics().setDepth(6);   // bóng và vệt
                this.duckImgs = [];
                this.gFx = this.add.graphics().setDepth(9);
                this.gDog = this.add.graphics().setDepth(10);

                this.puffs = [];
                this.pops = [];
                this.lanePulse = [0, 0, 0, 0];
                this.splashes = [];
                this.dusts = [];
                this.bushes = [];
                this.dog = { t: 99, mood: 'tease', lane: 0, kind: 'big' };
                this.reseedScenery();

                this.acc = 0;
                this.frozen = false;

                this.input.on('pointerdown', this.onTap, this);
                this.buildKeys();

                UI.sceneReady(this);
            },

            /* Sao, hạt mưa và đom đóm rải theo khổ thế giới. Phải rải lại mỗi
             * khi đổi khổ, không thì xoay máy xong nửa bầu trời trống trơn còn
             * nửa kia mưa dồn cục. */
            reseedScenery: function () {
                this.stars = [];
                this.rain = [];
                this.flies = [];
                for (var i = 0; i < 60; i++) {
                    this.stars.push({ x: Math.random() * W, y: TOP + Math.random() * (GROUND - TOP) * 0.7, r: 0.6 + Math.random() * 1.5, p: Math.random() * TAU });
                }
                for (var j = 0; j < 70; j++) this.rain.push({ x: Math.random() * W, y: Math.random() * GROUND, v: 620 + Math.random() * 420 });
                for (var k = 0; k < 24; k++) this.flies.push({ x: Math.random() * W, y: TOP + Math.random() * (GROUND - TOP), p: Math.random() * TAU, s: 0.6 + Math.random() });
            },

            /* Nướng sẵn 3 loài × 3 tư thế cánh. Nướng ở gấp ba rồi thu lại —
             * màn nét đôi mà nướng đúng cỡ thì viền răng cưa, mặt vịt nhoè. */
            bakeDucks: function () {
                var S = A.TEX_SCALE, g = this.add.graphics();
                for (var kind in R.KINDS) {
                    var box = this.texBox(kind);
                    var r = R.KINDS[kind].r;
                    var tw = box.w, th = box.h;
                    /* Ba tư thế bay + hai bước chân + một dáng bơi. Dáng chạy
                     * và dáng bơi là hình khác hẳn chứ không phải hình bay
                     * xoay đi — con vịt chạy có chân, con vịt bơi thì chìm
                     * nửa dưới và không thấy chân. */
                    var poses = [
                        ['_0', function (gg, k, rr) { A.drawDuck(gg, k, 0, rr); }],
                        ['_1', function (gg, k, rr) { A.drawDuck(gg, k, 1, rr); }],
                        ['_2', function (gg, k, rr) { A.drawDuck(gg, k, 2, rr); }],
                        ['_w0', function (gg, k, rr) { A.drawDuckWalk(gg, k, 0, rr); }],
                        ['_w1', function (gg, k, rr) { A.drawDuckWalk(gg, k, 1, rr); }],
                        ['_s', function (gg, k, rr) { A.drawDuckSwim(gg, k, rr); }]
                    ];
                    for (var w = 0; w < poses.length; w++) {
                        var key = 'duck_' + kind + poses[w][0];
                        if (this.textures.exists(key)) continue;
                        g.clear();
                        g.scaleCanvas(S, S);
                        g.translateCanvas(tw * box.ax, th * box.ay);
                        poses[w][1](g, kind, r);
                        g.translateCanvas(-tw * box.ax, -th * box.ay);
                        g.scaleCanvas(1 / S, 1 / S);
                        g.generateTexture(key, tw * S, th * S);
                    }
                }
                g.destroy();
                this.duckTex = {};
                for (var kd in R.KINDS) this.duckTex[kd] = this.texBox(kd);
            },

            /* Khổ tấm ảnh và chỗ đặt tâm, tính theo bán kính từng loài.
             * Chim lạ cần khổ rộng hơn: mỏ nhọn vươn xa và đuôi xoè ba nan
             * đều thò ra ngoài khổ của con vịt, nướng vừa khổ vịt là cụt mỏ. */
            texBox: function (kind) {
                var r = R.KINDS[kind].r;
                if (kind === 'crow') return { w: r * 4.9, h: r * 3.7, ax: 0.45, ay: 0.55 };
                return { w: r * 4.2, h: r * 3.4, ax: 0.42, ay: 0.58 };
            },

            buildKeys: function () {
                var self = this;
                window.addEventListener('keydown', function (ev) {
                    if (G.mode !== 'play') return;
                    var set = KEYSETS[G.kids] || [];
                    var i = set.indexOf(ev.code);
                    if (i < 0) return;
                    ev.preventDefault();
                    sfx.wake();
                    self.keyShot(i);
                });
            },

            /* ---------------------------------------------------------------
             * VÒNG ĐẤU
             * -------------------------------------------------------------*/
            /* seed để trống thì lấy theo đồng hồ. Máy soát truyền hạt vào để
             * chạy nhiều ván KHÁC NHAU — chạy trăm ván cùng một hạt thì chỉ là
             * đo đúng một ván trăm lần, mà em đã mắc đúng lỗi ấy lần đầu. */
            startGame: function (kids, seed) {
                G.kids = kids;
                G.seed = (seed === undefined) ? ((Date.now() % 100000) | 0) : (seed | 0);
                G.round = 0;
                G.scores = []; G.streaks = []; G.hits = []; G.shots = []; G.wrong = []; G.cool = [];
                for (var i = 0; i < kids; i++) { G.scores.push(0); G.streaks.push(0); G.hits.push(0); G.shots.push(0); G.wrong.push(0); G.cool.push(0); }
                G.roundScores = [];
                this.startRound(0);
            },

            startRound: function (n) {
                UI.takePendingSize();          // bé vừa xoay máy giữa vòng trước
                G.round = n;
                G.t = 0;
                G.ducks = [];
                G.queue = R.flock(n, G.seed, W, H).slice();
                this.duckImgs.forEach(function (im) { im.destroy(); });
                this.duckImgs = [];
                this.puffs = []; this.pops = [];
                this.lanePulse = [0, 0, 0, 0];
                this.splashes = []; this.dusts = [];
                /* Bụi cây mọc sẵn từ đầu vòng, ở đúng những chỗ rules.js đã
                 * định — kể cả mấy bụi trống không giấu con nào. */
                var below = H - GROUND;
                this.bushes = R.bushes(n, G.seed, W, H).map(function (b) {
                    /* Bụi giấu vịt phải nằm ĐÚNG trên đường chạy của nó, không
                     * xê dịch được. Bụi trống thì kéo xuống gần ống kính và vẽ
                     * to ra — đó là chỗ tạo chiều sâu. */
                    if (!b.decoy) return { x: b.x, y: GROUND + 10, r: 34 + (b.x % 15), shake: 0 };
                    var dp = b.depth;
                    return { x: b.x, y: GROUND + 14 + dp * below * 0.62, r: 38 + dp * 44, shake: 0 };
                });
                this.dog.t = 99;
                G.roundStart = G.scores.slice();
                G.mode = 'intro';
                this.introT = 0;
                sfx.round();
                UI.paintRound();
            },

            endRound: function () {
                G.mode = 'tally';
                this.tallyT = 0;
                var gained = [];
                for (var i = 0; i < G.kids; i++) gained.push(G.scores[i] - G.roundStart[i]);
                G.roundScores.push(gained);
                UI.paintTally(gained);
            },

            nextRound: function () {
                if (G.round + 1 >= R.ROUNDS.length) { UI.finish(); return; }
                this.startRound(G.round + 1);
            },

            /* ---------------------------------------------------------------
             * BẮN
             * -------------------------------------------------------------*/
            onTap: function (p) {
                if (G.mode !== 'play') return;
                sfx.wake();
                var lane = laneOf(p.worldX);
                this.fire(lane, p.worldX, p.worldY);
            },

            /* Bấm phím thì bắn con vịt gần tâm làn mình nhất — bé dùng bàn
             * phím không ngắm được bằng ngón tay, nên máy ngắm hộ. Vẫn phải có
             * vịt trong làn mới trúng, nên không phải là bắn tự động. */
            keyShot: function (lane) {
                var cx = (lane + 0.5) * laneW(), best = null, bd = 1e9;
                for (var i = 0; i < G.ducks.length; i++) {
                    var d = G.ducks[i];
                    if (d.dead || d.hidden || laneOf(d.x) !== lane) continue;
                    /* Bé chơi bằng phím thì máy ngắm hộ, nên máy KHÔNG được
                     * ngắm vào chim lạ — bắt bé chịu phạt vì cái máy ngắm hộ
                     * bắn nhầm thì oan quá. Bé chạm bằng tay vẫn tự chịu. */
                    if (R.isDecoy(d.kind)) continue;
                    var dist = Math.abs(d.x - cx);
                    if (dist < bd) { bd = dist; best = d; }
                }
                this.fire(lane, best ? best.x : cx, best ? best.y : GROUND - 200);
            },

            fire: function (lane, x, y) {
                if (G.cool[lane] > 0) return;
                G.cool[lane] = SHOT_COOL;
                G.shots[lane]++;
                sfx.shot();
                this.puffs.push({ x: x, y: y, t: 0, lane: lane, kind: 'shot' });

                /* trúng con nào: gần nhất trong tầm, và PHẢI đang ở làn mình */
                var hit = null, hd = 1e9;
                for (var i = 0; i < G.ducks.length; i++) {
                    var d = G.ducks[i];
                    if (d.dead) continue;
                    /* Con đang trong bụi hay đang lặn thì KHÔNG bắn được. Cho
                     * bắn xuyên qua chỗ nấp thì cả cái hay của việc nấp mất
                     * sạch, mà bé bắn trúng thứ mình không nhìn thấy cũng chẳng
                     * hiểu vì sao mình trúng. */
                    if (d.hidden) continue;
                    if (laneOf(d.x) !== lane) continue;
                    var r = R.KINDS[d.kind].r * 1.45;
                    var dist = Math.hypot(d.x - x, d.y - y);
                    if (dist < r && dist < hd) { hd = dist; hit = d; }
                }

                if (!hit) {
                    G.streaks[lane] = 0;
                    sfx.miss();
                    UI.paintHud();
                    return;
                }

                hit.dead = true;
                hit.fallV = 0;
                hit.by = lane;

                /* BẮN NHẦM CHIM LẠ */
                if (R.isDecoy(hit.kind)) {
                    var pen = R.score(hit.kind, 0);            // −3, không nhân chuỗi
                    /* Không cho điểm tụt xuống âm. Bé nhìn thấy số âm là nghĩ
                     * mình thua hẳn rồi và buông tay, trong khi ý của cái phạt
                     * chỉ là bắt nhìn cho kỹ. */
                    G.scores[lane] = Math.max(0, G.scores[lane] + pen);
                    G.streaks[lane] = 0;
                    G.wrong[lane]++;
                    this.pops.push({
                        x: hit.x, y: hit.y, t: 0, pts: pen, lane: lane, bad: true,
                        seed: Math.random() * TAU, bits: this.makeFeathers()
                    });
                    this.lanePulse[lane] = 0.55;
                    sfx.wrong();
                    this.dogSay('tease', lane);
                    UI.paintHud();
                    return;
                }

                G.hits[lane]++;
                G.streaks[lane]++;
                var pts = R.score(hit.kind, G.streaks[lane]);
                G.scores[lane] += pts;
                this.pops.push({
                    x: hit.x, y: hit.y, t: 0, pts: pts, lane: lane,
                    gold: hit.kind === 'gold', seed: Math.random() * TAU
                });
                if (hit.kind === 'gold') sfx.gold(); else sfx.hit();
                if (G.streaks[lane] >= 3) this.dogSay('proud', lane, hit.kind);
                UI.paintHud();
            },

            /* Con vịt vừa đổi cách xử sự — đây là chỗ đặt hiệu ứng, vì bé cần
             * một dấu hiệu để hiểu chuyện gì vừa xảy ra:
             *   xuống nước / ngoi lên  → nước bắn tung
             *   chui vào bụi / vọt ra  → bụi rung
             *   rời mặt đất bay lên    → bụi đất tung
             * Thiếu mấy dấu hiệu này thì con vịt cứ biến mất rồi hiện ra một
             * cách vô cớ, bé không đoán được gì và chỉ thấy game giật cục. */
            onStateChange: function (k) {
                if (k.state === 'under' || (k.was === 'under' && k.state === 'water')) {
                    this.splashes.push({ x: k.x, y: k.y, t: 0, up: k.state !== 'under' });
                    sfx.splash();
                } else if (k.state === 'bush' || k.was === 'bush') {
                    this.shakeBush(k.x);
                    sfx.rustle();
                } else if ((k.was === 'ground' || k.was === 'water') && k.state === 'air') {
                    this.dusts.push({ x: k.x, y: k.was === 'water' ? k.y : GROUND, t: 0, wet: k.was === 'water' });
                }
            },

            shakeBush: function (x) {
                var best = -1, bd = 1e9;
                for (var i = 0; i < this.bushes.length; i++) {
                    var d = Math.abs(this.bushes[i].x - x);
                    if (d < bd) { bd = d; best = i; }
                }
                if (best >= 0 && bd < 90) this.bushes[best].shake = 0.5;
            },

            /* Một búi lông tối màu: mỗi cọng một hướng, một tốc độ, một kiểu
             * xoay. Trộn hai màu của con chim lạ để búi lông đúng là lông CỦA
             * NÓ chứ không phải mấy hạt xám chung chung. */
            makeFeathers: function () {
                var out = [], n = 11;
                for (var i = 0; i < n; i++) {
                    var a = (i / n) * TAU + Math.random() * 0.5;
                    out.push({
                        a: a,
                        v: 130 + Math.random() * 210,
                        spin: (Math.random() - 0.5) * 9,
                        len: 7 + Math.random() * 7,
                        col: [0x2b2f45, 0x1b1e30, 0xff5a36][i % 3]
                    });
                }
                return out;
            },

            dogSay: function (mood, lane, kind) {
                this.dog = { t: 0, mood: mood, lane: lane, kind: kind || 'big' };
            },

            /* ---------------------------------------------------------------
             * MỘT NHỊP MÁY
             * -------------------------------------------------------------*/
            stepAll: function (dt) {
                var i;
                for (i = 0; i < G.cool.length; i++) if (G.cool[i] > 0) G.cool[i] -= dt;

                if (G.mode === 'intro') {
                    this.introT += dt;
                    if (this.introT > 2.1) {
                        G.mode = 'play';
                        /* PHẢI dọn bảng chữ đi ở đây. Bản đầu em chỉ viết đường
                         * bay VÀO cho nó rồi tưởng thế là xong, nên tên vòng và
                         * câu mách nước nằm lì giữa màn suốt cả vòng, che mất
                         * đàn vịt. Anh Hiếu bắn được 3 với 11 điểm rồi mà chữ
                         * "Sunset Lake" vẫn còn đó. */
                        UI.hideFlash();
                        UI.paintHud();
                    }
                    return;
                }
                if (G.mode === 'tally') {
                    this.tallyT += dt;
                    if (this.tallyT > 2.6) this.nextRound();
                    return;
                }
                if (G.mode !== 'play') return;

                G.t += dt;

                /* thả vịt tới lượt */
                while (G.queue.length && G.queue[0].t <= G.t) {
                    var d = G.queue.shift();
                    G.ducks.push({
                        spec: d, kind: d.kind, born: G.t, x: d.x0, y: GROUND,
                        dead: false, fallV: 0, wing: 0, wingT: 0, face: d.dir, gone: false,
                        state: 'air', was: 'air'
                    });
                    /* chim lạ kêu khác hẳn — thêm một manh mối nữa cho bé, vì
                     * nó bật lên từ bụi cỏ trước khi bé kịp nhìn rõ hình */
                    if (R.isDecoy(d.kind)) sfx.caw(); else sfx.quack();
                }

                /* bay */
                for (i = G.ducks.length - 1; i >= 0; i--) {
                    var k = G.ducks[i];
                    k.wingT += dt;
                    if (k.wingT > 0.09) { k.wingT = 0; k.wing = (k.wing + 1) % 3; }

                    if (k.dead) {
                        /* rơi xuống cỏ */
                        k.fallV += 1500 * dt;
                        k.y += k.fallV * dt;
                        if (k.y > GROUND + 40) {
                            G.ducks.splice(i, 1);
                            if (!R.isDecoy(k.kind)) this.dogSay('proud', k.by, k.kind);
                        }
                        continue;
                    }

                    var age = G.t - k.born;
                    var p = R.duckAt(k.spec, age, GROUND, W, H);
                    k.face = p.turn;
                    k.x = p.x; k.y = p.y;
                    k.was = k.state;
                    k.state = p.state;
                    k.hidden = p.hidden;
                    if (k.state !== k.was) this.onStateChange(k);
                    if (!R.inView(p, W, TOP)) {
                        /* thoát mất — không ai được điểm, chó ra trêu */
                        G.ducks.splice(i, 1);
                        k.gone = true;
                        /* Chim lạ bay thoát là chuyện ĐÚNG, không ai làm hỏng
                         * việc gì cả — cho chó ra trêu thì hoá ra dạy bé rằng
                         * đáng lẽ phải bắn nó. */
                        if (!R.isDecoy(k.kind)) {
                            sfx.away();
                            this.dogSay('tease', laneOf(k.x));
                        }
                    }
                }

                /* hết vịt và hết hàng chờ thì đóng vòng */
                if (!G.queue.length && !G.ducks.length) this.endRound();

                /* hiệu ứng */
                for (i = this.puffs.length - 1; i >= 0; i--) {
                    this.puffs[i].t += dt;
                    if (this.puffs[i].t > 0.35) this.puffs.splice(i, 1);
                }
                for (i = this.pops.length - 1; i >= 0; i--) {
                    this.pops[i].t += dt;
                    if (this.pops[i].t > 1.1) this.pops.splice(i, 1);
                }
                for (i = 0; i < this.lanePulse.length; i++) {
                    if (this.lanePulse[i] > 0) this.lanePulse[i] -= dt;
                }
                for (i = this.splashes.length - 1; i >= 0; i--) {
                    this.splashes[i].t += dt;
                    if (this.splashes[i].t > 0.65) this.splashes.splice(i, 1);
                }
                for (i = this.dusts.length - 1; i >= 0; i--) {
                    this.dusts[i].t += dt;
                    if (this.dusts[i].t > 0.55) this.dusts.splice(i, 1);
                }
                for (i = 0; i < this.bushes.length; i++) {
                    if (this.bushes[i].shake > 0) this.bushes[i].shake -= dt;
                }
                if (this.dog.t < 99) this.dog.t += dt;
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
                var R0 = R.ROUNDS[G.round] || R.ROUNDS[0];
                var sc = A.SCENES[R0.key] || A.SCENES.dawn;
                this.paintSky(sc);
                this.paintScenery(sc, R0);
                this.paintLanes();
                this.paintDucks(sc);
                this.paintFx();
                this.paintDog();
            },

            paintSky: function (sc) {
                var g = this.gSky;
                g.clear();
                /* trời chuyển màu bằng nhiều dải ngang — Phaser vẽ gradient chỉ
                 * chạy khi có WebGL, mà máy cũ của bé thì hay rơi về canvas
                 * thường, nên em xếp dải cho chắc ăn (bài học từ Vặn Ốc). */
                var bands = 26;
                for (var i = 0; i < bands; i++) {
                    var t = i / (bands - 1);
                    var col = t < 0.5
                        ? Phaser.Display.Color.Interpolate.ColorWithColor(
                            Phaser.Display.Color.ValueToColor(sc.sky[0]),
                            Phaser.Display.Color.ValueToColor(sc.sky[1]), 100, t * 200)
                        : Phaser.Display.Color.Interpolate.ColorWithColor(
                            Phaser.Display.Color.ValueToColor(sc.sky[1]),
                            Phaser.Display.Color.ValueToColor(sc.sky[2]), 100, (t - 0.5) * 200);
                    g.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), 1);
                    g.fillRect(0, (H * t) - 2, W, H / bands + 4);
                }
            },

            paintScenery: function (sc, R0) {
                var g = this.gScene;
                g.clear();
                var tt = this.time.now / 1000;

                /* sao đêm */
                if (sc.stars) {
                    for (var i = 0; i < this.stars.length; i++) {
                        var s = this.stars[i];
                        g.fillStyle(0xffffff, 0.35 + 0.45 * Math.abs(Math.sin(tt * 1.4 + s.p)));
                        g.fillCircle(s.x, s.y, s.r);
                    }
                }

                /* mặt trời hoặc mặt trăng */
                if (!sc.noSun) {
                    var sx = W * 0.74, sy = H * (1 - sc.sunY);
                    for (var q = 4; q >= 1; q--) {
                        g.fillStyle(sc.glow, 0.05 * q);
                        g.fillCircle(sx, sy, 52 + q * 26);
                    }
                    g.fillStyle(sc.sun, 1);
                    g.fillCircle(sx, sy, 52);
                }

                /* đồi xa và đồi gần */
                g.fillStyle(sc.hill[0], 1);
                this.hillPath(g, GROUND - 96, 150, 0.9, 0);
                g.fillStyle(sc.hill[1], 1);
                this.hillPath(g, GROUND - 46, 118, 1.35, 220);

                /* mặt hồ */
                if (sc.water) {
                    g.fillStyle(0x2b3f6b, 0.55);
                    g.fillRect(0, GROUND - 30, W, 30);
                    for (var wv = 0; wv < 14; wv++) {
                        g.fillStyle(0x9fd0ff, 0.16);
                        g.fillRect((wv * 97 + Math.sin(tt + wv) * 22) % W, GROUND - 24 + (wv % 3) * 7, 54, 2);
                    }
                }

                /* cỏ */
                var below = H - GROUND;
                g.fillStyle(sc.grass, 1);
                g.fillRect(0, GROUND, W, below);
                g.fillStyle(sc.tree, 0.55);
                for (var b = 0; b < 46; b++) {
                    var bx = (b * 29 + 11) % W;
                    var bh = 16 + ((b * 37) % 22);
                    g.fillTriangle(bx, GROUND + 6, bx + 7, GROUND + 6 - bh, bx + 14, GROUND + 6);
                }

                /* AO TRƯỚC MẶT — chỉ có ở vòng nào có vịt lặn. Ao vẽ ĐÈ lên cỏ
                 * chứ không thay cỏ: bờ cỏ còn lại ở trên làm cái mép ao, không
                 * thì mặt nước dán thẳng vào chân màn hình, trông như một dải
                 * màu chứ không phải cái ao. */
                if (sc.pond) {
                    var pondTop = GROUND + (H - GROUND) * 0.16;
                    g.fillStyle(sc.pond.deep, 1);
                    g.fillRect(0, pondTop, W, H - pondTop);
                    g.fillStyle(sc.pond.top, 0.55);
                    g.fillRect(0, pondTop, W, (H - pondTop) * 0.42);
                    /* gợn sóng chạy ngang, lệch pha nhau cho khỏi thành hàng kẻ */
                    for (var q2 = 0; q2 < 22; q2++) {
                        var wy = pondTop + ((q2 * 37) % Math.max(1, (H - pondTop) - 8)) + 4;
                        var wx = (q2 * 113 + Math.sin(tt * 0.9 + q2) * 26) % W;
                        g.fillStyle(sc.pond.foam, 0.16);
                        g.fillRect(wx, wy, 42 + (q2 % 3) * 22, 2);
                    }
                    g.fillStyle(sc.pond.foam, 0.22);
                    g.fillRect(0, pondTop - 2, W, 3);
                }

                /* BỤI CÂY — chỗ con vịt chui vào trốn. Vẽ sau cỏ, trước ao,
                 * và bụi nào cũng mọc từ đầu vòng kể cả bụi trống. */
                for (var bi = 0; bi < this.bushes.length; bi++) {
                    var bu = this.bushes[bi];
                    var sq = bu.shake > 0 ? Math.sin(bu.shake * 34) * (bu.shake / 0.5) : 0;
                    g.save();
                    g.translateCanvas(bu.x, bu.y);
                    A.drawBush(g, bu.r, sc.bush || { dark: 0x24523a, light: 0x357a45 }, sq);
                    g.restore();
                }

                /* CỎ TIỀN CẢNH BA LỚP — càng gần ống kính càng cao, càng thưa
                 * và càng tối. Đây là thứ làm dải đất dưới cùng có chiều sâu
                 * thay vì phẳng lì như một dải màu.
                 *
                 * Bản đầu em vẽ dày và đều tăm tắp, trông ra hàng rào chứ không
                 * ra cỏ, lại còn phủ thêm mấy dải tối đè lên nhau thành những
                 * vạch ngang rõ mồn một. Thưa ra, cao thấp lệch nhau, và chỉ
                 * làm tối bằng MÀU của lá cỏ chứ không phủ dải đen. */
                for (var lay = 0; lay < 3; lay++) {
                    var ly = GROUND + below * (0.26 + lay * 0.30);
                    var step2 = 52 - lay * 12;
                    var dark = lay / 2;
                    g.fillStyle(mixHex(sc.grass, sc.tree, 0.35 + dark * 0.65), 1);
                    for (var gx = -30; gx < W + 30; gx += step2) {
                        var jx = ((gx * 37 + lay * 91) % 23) - 11;
                        var lh = (12 + lay * 13) * (0.6 + (((gx * 13 + lay * 7) % 9) / 9));
                        var lean = (((gx * 17 + lay * 5) % 7) - 3) * 1.6;
                        g.fillTriangle(gx + jx - 4 - lay, ly + 8,
                            gx + jx + lean, ly - lh,
                            gx + jx + 4 + lay, ly + 8);
                    }
                }

                /* tối dần về đáy màn — tám dải mảnh thay cho gradient, vì
                 * Phaser chỉ vẽ được gradient khi có WebGL */
                for (var vg = 0; vg < 8; vg++) {
                    g.fillStyle(0x000000, 0.035 * (vg + 1));
                    g.fillRect(0, H - (8 - vg) * below * 0.075, W, below * 0.075 + 1);
                }

                /* mưa bão */
                if (sc.rain) {
                    g.lineStyle(2, 0xbcd6f0, 0.35);
                    for (var r2 = 0; r2 < this.rain.length; r2++) {
                        var d = this.rain[r2];
                        d.y += d.v / 60;
                        d.x -= 90 / 60;
                        if (d.y > GROUND) { d.y = -20; d.x = Math.random() * W; }
                        g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - 7, d.y + 18); g.strokePath();
                    }
                }

                /* đom đóm */
                if (sc.dark) {
                    for (var f = 0; f < this.flies.length; f++) {
                        var fl = this.flies[f];
                        var fy = fl.y + Math.sin(tt * fl.s + fl.p) * 16;
                        var fx = fl.x + Math.cos(tt * fl.s * 0.7 + fl.p) * 22;
                        g.fillStyle(0xfff3a0, 0.25 + 0.5 * Math.abs(Math.sin(tt * 2 + fl.p)));
                        g.fillCircle(fx, fy, 3.2);
                    }
                    /* vệt trăng: dải sáng quét ngang, chỗ nào có vệt mới rõ vịt */
                    g.fillStyle(0xbcd0ff, 0.10);
                    var mx = (tt * 90) % (W + 460) - 230;
                    g.fillTriangle(mx, TOP, mx + 260, TOP, mx - 120, GROUND);
                }

                void R0;
            },

            hillPath: function (g, baseY, amp, freq, off) {
                g.beginPath();
                g.moveTo(0, H);
                for (var x = 0; x <= W; x += 24) {
                    var y = baseY - Math.sin((x + off) / W * Math.PI * freq) * amp;
                    g.lineTo(x, y);
                }
                g.lineTo(W, H);
                g.closePath();
                g.fillPath();
            },

            /* Vạch chia làn: mảnh thôi, nhưng phải có — bé cần biết đâu là
             * phần trời của mình, không thì bắn sang làn bạn rồi kêu oan. */
            paintLanes: function () {
                var g = this.gLane;
                g.clear();
                if (G.kids < 2 || G.mode === 'menu') return;
                var lw = laneW();
                for (var i = 1; i < G.kids; i++) {
                    g.lineStyle(2, 0xffffff, 0.16);
                    g.beginPath(); g.moveTo(i * lw, TOP - 30); g.lineTo(i * lw, GROUND + 30); g.strokePath();
                }
                /* nền mờ theo màu của bé, để nhìn một cái là biết làn ai */
                for (var k = 0; k < G.kids; k++) {
                    g.fillStyle(KIDS[k].color, G.mode === 'play' ? 0.055 : 0.03);
                    g.fillRect(k * lw, TOP - 30, lw, GROUND + 60 - TOP + 30);
                }
            },

            paintDucks: function (sc) {
                var g = this.gDuck;
                g.clear();

                /* đủ ảnh cho từng con */
                while (this.duckImgs.length < G.ducks.length) {
                    var im = this.add.image(0, 0, 'duck_big_0').setDepth(7);
                    this.duckImgs.push(im);
                }
                for (var i = 0; i < this.duckImgs.length; i++) this.duckImgs[i].setVisible(false);

                for (var j = 0; j < G.ducks.length; j++) {
                    var d = G.ducks[j], img = this.duckImgs[j];
                    /* Con đang trong bụi hay đang lặn thì không vẽ. Vẽ mờ mờ
                     * cho "biết là nó ở đấy" nghe thì tử tế, nhưng hoá ra bé
                     * cứ nhè cái bóng mà bắn, mà bắn lại không trúng — bực hơn
                     * là không thấy gì. */
                    if (d.hidden && !d.dead) { img.setVisible(false); continue; }
                    var tex = this.duckTex[d.kind];
                    var pose = d.dead ? '_2'
                        : (d.state === 'ground' ? (d.wing % 2 ? '_w1' : '_w0')
                            : (d.state === 'water' ? '_s' : '_' + d.wing));
                    img.setTexture('duck_' + d.kind + pose);
                    img.setDisplaySize(tex.w, tex.h);
                    img.setOrigin(tex.ax, tex.ay);
                    img.setPosition(d.x, d.y);
                    img.setFlipX(d.face < 0);
                    var airborne = d.state === 'air';
                    img.setAngle(d.dead ? 180
                        : (airborne && d.spec.amp ? Math.sin((G.t - d.born) * 3.1 + d.spec.phase) * 8 : 0));
                    img.setVisible(true);
                    /* Đêm tối: vịt chỉ rõ khi nằm trong vệt trăng — nhưng CHIM
                     * LẠ thì luôn hiện rõ. Bắn nhầm nó là mất điểm, mà bắt bé
                     * chịu phạt vì một con em cố tình vẽ mờ đi thì là chơi
                     * xấu. Khó ở chỗ tìm ra con vịt, không phải ở chỗ giấu cái
                     * bẫy. */
                    img.setAlpha(sc.dark && !R.isDecoy(d.kind) ? 0.34 + 0.66 * this.moonLit(d.x) : 1);

                    /* Bóng trên cỏ — cho thấy con vịt đang ở đâu theo bề ngang.
                     * Con đang bơi thì thay bằng gợn nước quanh mình nó. */
                    if (d.state === 'water') {
                        /* gợn nước vẽ ở lớp TRÊN (paintFx), xem chú thích ở đó */
                    } else {
                        g.fillStyle(0x000000, 0.13);
                        g.fillEllipse(d.x, GROUND + 14, R.KINDS[d.kind].r * 1.7, R.KINDS[d.kind].r * 0.42);
                    }
                }
            },

            moonLit: function (x) {
                var tt = this.time.now / 1000;
                var mx = (tt * 90) % (W + 460) - 230;
                var d = Math.abs(x - (mx + 70));
                return Math.max(0, 1 - d / 200);
            },

            /* ---------------------------------------------------------------
             * HIỆU ỨNG
             *
             * Bản đầu em báo "bắn nhầm" bằng hai nét gạch chéo thành chữ X.
             * Anh Hiếu nói thẳng: đấy là làm cho có. Anh đúng — chữ X là ký
             * hiệu của người lập trình, không phải hình của trò chơi. Nó không
             * kể chuyện gì cả: bé không thấy chuyện gì vừa xảy ra, chỉ thấy
             * một dấu gạch báo lỗi.
             *
             * Làm lại theo lối kể chuyện bằng hình. Bắn nhầm con chim lạ thì
             * cái phải thấy là: một búi lông tối bung ra và rơi xuống, một
             * vòng sóng đỏ lan ra rồi tắt, con số −3 nảy lên rồi trôi đi, và
             * làn của bé ấy loé đỏ ở hai mép. Bốn thứ ấy cùng kể một câu:
             * "bé vừa bắn trúng con không nên bắn, và mất 3 điểm".
             *
             * Bắn trúng vịt cũng được vẽ lại cho cùng một ngôn ngữ — nổ ra
             * chùm tia sáng và con số +N — chứ không để cái sai được chăm
             * chút hơn cái đúng.
             * -------------------------------------------------------------*/
            paintFx: function () {
                var g = this.gFx;
                g.clear();
                var i, s, a;

                /* --- vệt đạn: vòng loe ra rồi tắt --- */
                for (i = 0; i < this.puffs.length; i++) {
                    var p = this.puffs[i], k = p.t / 0.35;
                    g.lineStyle(3, KIDS[p.lane].color, (1 - k) * 0.9);
                    g.strokeCircle(p.x, p.y, 10 + k * 40);
                    g.lineStyle(1.5, 0xffffff, (1 - k) * 0.55);
                    g.strokeCircle(p.x, p.y, 4 + k * 20);
                }

                /* --- làn loé đỏ khi bé làn ấy bắn nhầm --- */
                var lw = laneW();
                for (i = 0; i < G.kids; i++) {
                    var lp = this.lanePulse[i];
                    if (!lp || lp <= 0) continue;
                    var lk = lp / 0.55;                       // 1 → 0
                    /* Vẽ hai dải sáng ở HAI MÉP làn chứ không phủ đỏ cả làn:
                     * phủ kín thì che mất đàn vịt đúng lúc bé cần nhìn nhất. */
                    for (s = 0; s < 7; s++) {
                        var fade = lk * 0.30 * (1 - s / 7);
                        g.fillStyle(0xff3b30, fade);
                        g.fillRect(i * lw + s * 7, TOP, 7, GROUND - TOP + 30);
                        g.fillRect((i + 1) * lw - (s + 1) * 7, TOP, 7, GROUND - TOP + 30);
                    }
                }

                for (i = 0; i < this.pops.length; i++) {
                    var q = this.pops[i], t = Math.min(1, q.t / 1.1);
                    var ease = 1 - Math.pow(1 - t, 3);        // nhanh lúc đầu, chậm dần

                    if (q.bad) {
                        /* sóng đỏ lan ra, mảnh dần */
                        g.lineStyle(7 * (1 - t), 0xff3b30, (1 - t) * 0.85);
                        g.strokeCircle(q.x, q.y, 12 + ease * 78);
                        g.lineStyle(2.5 * (1 - t), 0xffd0cc, (1 - t) * 0.6);
                        g.strokeCircle(q.x, q.y, 6 + ease * 46);

                        /* búi lông bung ra rồi rơi xuống — cái này mới là hình
                         * KỂ được chuyện: bé bắn trúng một con chim thật */
                        for (s = 0; s < q.bits.length; s++) {
                            var b = q.bits[s];
                            var bt = q.t;
                            var bx = q.x + Math.cos(b.a) * b.v * bt;
                            var by = q.y + Math.sin(b.a) * b.v * bt + 240 * bt * bt;
                            var spin = b.a + b.spin * bt;
                            var al = Math.max(0, 1 - t * 1.15);
                            g.fillStyle(b.col, al);
                            /* mỗi cọng lông là một hình thoi mảnh, xoay theo
                             * đường bay — vẽ tròn thì thành hạt bụi vô nghĩa */
                            var cx = Math.cos(spin), cy = Math.sin(spin);
                            var L = b.len * (1 - t * 0.3), Wd = b.len * 0.30;
                            g.beginPath();
                            g.moveTo(bx + cx * L, by + cy * L);
                            g.lineTo(bx - cy * Wd, by + cx * Wd);
                            g.lineTo(bx - cx * L * 0.55, by - cy * L * 0.55);
                            g.lineTo(bx + cy * Wd, by - cx * Wd);
                            g.closePath();
                            g.fillPath();
                        }
                    } else {
                        /* bắn trúng: chùm tia sáng toả ra, dài ngắn xen kẽ */
                        var col = q.gold ? 0xffd43b : KIDS[q.lane].color;
                        for (s = 0; s < 10; s++) {
                            a = s / 10 * TAU + q.seed;
                            var r0 = 10 + ease * 26;
                            var r1 = r0 + (s % 2 ? 14 : 26) * (1 - t);
                            g.lineStyle(3 * (1 - t) + 0.5, col, (1 - t) * 0.95);
                            g.beginPath();
                            g.moveTo(q.x + Math.cos(a) * r0, q.y + Math.sin(a) * r0);
                            g.lineTo(q.x + Math.cos(a) * r1, q.y + Math.sin(a) * r1);
                            g.strokePath();
                        }
                        g.lineStyle(2.5 * (1 - t), 0xffffff, (1 - t) * 0.7);
                        g.strokeCircle(q.x, q.y, 8 + ease * 40);
                    }
                }

                /* --- gợn nước quanh con vịt đang bơi ---
                 * Vẽ ĐÈ LÊN con vịt chứ không vẽ dưới. Vòng nước cắt ngang bụng
                 * nó là thứ duy nhất nói được "nửa dưới đang chìm"; vẽ ở lớp
                 * dưới thì con vịt trông như đặt lên mặt nước như một món đồ
                 * chơi nhựa. */
                var sc0 = A.SCENES[(R.ROUNDS[G.round] || R.ROUNDS[0]).key] || A.SCENES.dawn;
                var foam = sc0.pond ? sc0.pond.foam : 0xffffff;
                for (i = 0; i < G.ducks.length; i++) {
                    var wd = G.ducks[i];
                    if (wd.dead || wd.hidden || wd.state !== 'water') continue;
                    var wr = R.KINDS[wd.kind].r;
                    for (s = 0; s < 3; s++) {
                        g.lineStyle(2.4 - s * 0.5, foam, 0.42 - s * 0.11);
                        g.strokeEllipse(wd.x, wd.y + wr * 0.44, wr * (2.1 + s * 1.0), wr * (0.46 + s * 0.22));
                    }
                }

                /* --- nước bắn khi lặn xuống hoặc ngoi lên --- */
                for (i = 0; i < this.splashes.length; i++) {
                    var sp2 = this.splashes[i], sk = sp2.t / 0.65;
                    g.lineStyle(3 * (1 - sk), 0xd8ecff, (1 - sk) * 0.85);
                    g.strokeEllipse(sp2.x, sp2.y + 10, 24 + sk * 96, 8 + sk * 26);
                    for (s = 0; s < 9; s++) {
                        a = -Math.PI * (0.15 + 0.7 * (s / 8));
                        var sv = 120 + (s % 3) * 60;
                        var dx = Math.cos(a) * sv * sp2.t * (s % 2 ? 1 : -1);
                        var dy = Math.sin(a) * sv * sp2.t + 420 * sp2.t * sp2.t;
                        g.fillStyle(0xeaf6ff, Math.max(0, 1 - sk * 1.2));
                        g.fillCircle(sp2.x + dx, sp2.y + dy, 3.4 * (1 - sk) + 1);
                    }
                }

                /* --- bụi tung lên lúc cất cánh khỏi mặt đất --- */
                for (i = 0; i < this.dusts.length; i++) {
                    var du = this.dusts[i], dk = du.t / 0.55;
                    for (s = 0; s < 6; s++) {
                        a = s / 6 * TAU;
                        g.fillStyle(du.wet ? 0xd8ecff : 0xd9c9a8, (1 - dk) * 0.5);
                        g.fillCircle(du.x + Math.cos(a) * (14 + dk * 52),
                            du.y - 6 - dk * 16 + Math.sin(a) * 6, (7 - s * 0.6) * (1 - dk) + 1);
                    }
                }

                this.paintPopNumbers();
            },

            /* Con số điểm bay lên. Dùng thẻ chữ thật của Phaser chứ không vẽ
             * số bằng nét: số vẽ tay ở cỡ này trông ngay ra đồ chắp vá, mà đây
             * lại là thứ bé nhìn nhiều nhất sau con vịt. */
            paintPopNumbers: function () {
                if (!this.popTexts) this.popTexts = [];
                var need = this.pops.length;
                while (this.popTexts.length < need) {
                    this.popTexts.push(this.add.text(0, 0, '', {
                        fontFamily: '"Baloo 2", Nunito, system-ui, sans-serif',
                        fontSize: '46px', fontStyle: '800',
                        color: '#ffffff', stroke: '#0b1220', strokeThickness: 7
                    }).setOrigin(0.5).setDepth(11));
                }
                for (var i = 0; i < this.popTexts.length; i++) {
                    var tx = this.popTexts[i];
                    if (i >= need) { tx.setVisible(false); continue; }
                    var q = this.pops[i], t = Math.min(1, q.t / 1.1);
                    /* nảy lên rồi trôi: to vọt ra ở nhịp đầu, sau đó nhỏ dần */
                    var pop = t < 0.18 ? (t / 0.18) * 1.25 : 1.25 - (t - 0.18) / 0.82 * 0.45;
                    tx.setText((q.pts > 0 ? '+' : '') + q.pts);
                    tx.setColor(q.bad ? '#ff5c52' : (q.gold ? '#ffd43b' : KIDS[q.lane].css));
                    tx.setPosition(q.x, q.y - 26 - t * 54);
                    tx.setScale(pop * (H / 720));
                    tx.setAlpha(t < 0.75 ? 1 : (1 - t) / 0.25);
                    tx.setVisible(true);
                }
            },

            /* Chú chó nhô lên từ bụi cỏ, đúng làn vừa có chuyện. */
            paintDog: function () {
                var g = this.gDog;
                g.clear();
                if (this.dog.t > 1.6) return;
                var R0 = R.ROUNDS[G.round] || R.ROUNDS[0];
                var sc = A.SCENES[R0.key] || A.SCENES.dawn;
                var k = this.dog.t / 1.6;
                var up = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 92;   // nhô lên rồi thụt xuống
                var x = (this.dog.lane + 0.5) * laneW();
                g.save();
                g.translateCanvas(x, GROUND + 54 - up);
                A.drawDog(g, 34, this.dog.mood, this.dog.kind);
                g.restore();

                /* Che chân chó lại, không thì nó trôi lơ lửng như bị dán vào
                 * nền. Vòng có ao thì che bằng GỢN NƯỚC chứ không phải bụi cỏ:
                 * vẽ một bụi cỏ xanh giữa mặt ao thì thành mảng xanh lù lù
                 * trên nước, ảnh chụp thử lộ ngay. Chú chó lội nước đi nhặt vịt
                 * cũng đúng cảnh hơn. */
                if (sc.pond) {
                    for (var w2 = 0; w2 < 4; w2++) {
                        g.lineStyle(3 - w2 * 0.5, sc.pond.foam, 0.42 - w2 * 0.09);
                        g.strokeEllipse(x, GROUND + 34, 90 + w2 * 52, 20 + w2 * 12);
                    }
                    g.fillStyle(sc.pond.deep, 1);
                    g.fillEllipse(x, GROUND + 52, 150, 46);
                } else {
                    /* Bụi vẽ bằng hình bầu chứ không phải hình chữ nhật — hình
                     * chữ nhật xoá mất đám cỏ nền và để lại một vệt vuông. */
                    g.fillStyle(sc.grass, 1);
                    g.fillEllipse(x, GROUND + 26, 210, 68);
                    g.fillStyle(sc.tree, 0.6);
                    for (var i = -5; i <= 5; i++) {
                        var bx = x + i * 17 + (i % 2) * 5;
                        var bh = 22 + ((i * 37) % 15);
                        g.fillTriangle(bx - 7, GROUND + 14, bx, GROUND + 14 - bh, bx + 7, GROUND + 14);
                    }
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
    function hideAll() { ['menu-overlay', 'win-overlay', 'help-overlay'].forEach(function (i) { hide(el(i)); }); }

    var UI = {
        game: null, scene: null, pending: false,

        sceneReady: function (s) {
            this.scene = s;
            if (this.pending) { this.pending = false; this.start(G.kids); }
        },

        boot: function () {
            if (this.game) return;
            definePlayScene();
            applySize(this.wanted());
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

        /* Khổ mà khung chơi đang muốn. Đo thẻ .game-viewport chứ không đo cửa
         * sổ: thanh trên và chân trang ăn mất một phần chiều cao, đo cửa sổ thì
         * ra khổ dẹt hơn thực tế. */
        wanted: function () {
            var box = document.querySelector('.game-viewport');
            if (!box) return { W: 1280, H: 720 };
            var r = box.getBoundingClientRect();
            return pickSize(r.width, r.height);
        },

        /* Xoay máy, hoặc bàn phím ảo đóng lại, thì khổ đổi. Đổi giữa lúc đang
         * bắn thì đàn vịt phải dựng lại từ đầu vòng, nên chỉ đổi ngay khi bé
         * chưa vào trận; đang chơi thì hẹn tới đầu vòng sau. */
        resize: function () {
            if (!this.scene || !this.game) return;
            var s = this.wanted();
            if (Math.abs(s.W - W) < 1 && Math.abs(s.H - H) < 24) return;
            if (G.mode === 'play' || G.mode === 'intro') { this.pendingSize = s; return; }
            this.pendingSize = null;
            applySize(s);
            this.game.scale.resize(W, H);
            this.scene.reseedScenery();
        },

        /* Gọi ở đầu mỗi vòng: nếu có khổ đang chờ thì lúc này áp vào là gọn,
         * đàn vịt của vòng mới vốn dĩ dựng lại từ đầu. */
        takePendingSize: function () {
            if (!this.pendingSize || !this.game) return;
            applySize(this.pendingSize);
            this.pendingSize = null;
            this.game.scale.resize(W, H);
            this.scene.reseedScenery();
        },

        start: function (kids) {
            G.kids = kids;
            hideAll();
            document.body.classList.add('playing');
            if (!this.scene) { this.pending = true; this.boot(); return; }
            this.scene.frozen = false;
            this.scene.startGame(kids);
            this.paintCards();
            this.paintHud();
        },

        /* Thẻ điểm của từng bé, xếp theo làn để bé nhìn xuống dưới là thấy
         * đúng thẻ của mình. */
        paintCards: function () {
            var box = el('cards');
            if (!box) return;
            /* Mặt biểu tượng để RIÊNG một thẻ, không dính vào tên bé.
             *
             * Bản đầu em gộp "🦆 BÉ 1" vào một thẻ rồi trên màn hẹp thì thu tên
             * còn 0 và phóng ::first-letter lên để giữ lại cái mặt. Anh Hiếu
             * chụp ảnh bàn 4 bé: bốn cái mặt đều bị cắt mất một nửa. ::first-
             * letter vốn không dành cho emoji — một emoji là nhiều mã ký tự
             * ghép lại, trình duyệt cắt ngay giữa cụm ấy. Tách ra hai thẻ thì
             * muốn giấu tên chỉ việc giấu, không phải mẹo mực gì. */
            var html = '';
            for (var i = 0; i < G.kids; i++) {
                var k = KIDS[i];
                html += '<div class="pcard" id="pcard' + i + '" style="--kid:' + k.css + '">' +
                    '<span class="pc-emoji">' + k.emoji + '</span>' +
                    '<span class="pc-name">' + (lang() === 'vi' ? k.vi : k.en) + '</span>' +
                    '<b class="pc-score" id="pscore' + i + '">0</b>' +
                    '<span class="pc-combo" id="pcombo' + i + '"></span>' +
                    '</div>';
            }
            box.innerHTML = html;
            box.className = 'cards kids-' + G.kids;
            box.style.setProperty('--kids', G.kids);
        },

        paintHud: function () {
            for (var i = 0; i < G.kids; i++) {
                var s = el('pscore' + i), c = el('pcombo' + i), card = el('pcard' + i);
                if (s) s.textContent = G.scores[i];
                if (c) {
                    var m = R.comboMult(G.streaks[i]);
                    c.textContent = m > 1 ? ('×' + m) : '';
                    c.classList.toggle('hot', m >= 2);
                }
                if (card) card.classList.toggle('lead', G.scores[i] === Math.max.apply(null, G.scores) && G.scores[i] > 0);
            }
            el('cards').hidden = (G.mode === 'menu' || G.mode === 'over');
            var r = R.ROUNDS[G.round];
            var rb = el('round-badge');
            if (rb) {
                rb.hidden = (G.mode === 'menu' || G.mode === 'over');
                rb.innerHTML = '<span>' + (lang() === 'vi' ? 'VÒNG' : 'ROUND') + ' ' + (G.round + 1) + '/' + R.ROUNDS.length +
                    '</span><b>' + (lang() === 'vi' ? r.vi : r.en) + '</b>';
            }
        },

        /* Cho bảng chữ mờ dần rồi mới ẩn hẳn. Ẩn phựt một cái thì mắt bé giật
         * mình, mà đúng lúc ấy con vịt đầu tiên đang bật lên. */
        hideFlash: function () {
            var box = el('flash');
            if (!box || box.classList.contains('hidden')) return;
            box.classList.remove('go');
            box.classList.add('out');
            clearTimeout(this.flashT);
            this.flashT = setTimeout(function () {
                box.classList.add('hidden');
                box.classList.remove('out');
            }, 420);
        },

        paintRound: function () {
            var r = R.ROUNDS[G.round];
            var box = el('flash');
            if (!box) return;
            box.innerHTML = '<span class="fl-no">' + (lang() === 'vi' ? 'VÒNG' : 'ROUND') + ' ' + (G.round + 1) + '</span>' +
                '<b class="fl-name">' + (lang() === 'vi' ? r.vi : r.en) + '</b>' +
                '<span class="fl-hint">' + (lang() === 'vi' ? r.hint_vi : r.hint_en) + '</span>';
            clearTimeout(this.flashT);        // đang mờ dần dở thì huỷ
            box.classList.remove('hidden');
            box.classList.remove('out');
            box.classList.remove('go');
            void box.offsetWidth;
            box.classList.add('go');
            this.paintHud();
        },

        paintTally: function (gained) {
            var box = el('flash');
            if (!box) return;
            var rows = '';
            for (var i = 0; i < G.kids; i++) {
                rows += '<div class="tally-row" style="--kid:' + KIDS[i].css + '">' +
                    '<span>' + KIDS[i].emoji + ' ' + (lang() === 'vi' ? KIDS[i].vi : KIDS[i].en) + '</span>' +
                    '<b>+' + gained[i] + '</b></div>';
            }
            box.innerHTML = '<span class="fl-no">' + (lang() === 'vi' ? 'HẾT VÒNG' : 'ROUND OVER') + '</span>' +
                '<div class="tally">' + rows + '</div>';
            clearTimeout(this.flashT);        // đang mờ dần dở thì huỷ
            box.classList.remove('hidden');
            box.classList.remove('out');
            box.classList.remove('go');
            void box.offsetWidth;
            box.classList.add('go');
        },

        finish: function () {
            G.mode = 'over';
            document.body.classList.remove('playing');
            sfx.win();
            var best = Math.max.apply(null, G.scores);
            var winners = [];
            for (var i = 0; i < G.kids; i++) if (G.scores[i] === best) winners.push(i);
            el('flash').classList.add('hidden');

            var title = winners.length > 1
                ? (lang() === 'vi' ? 'Hoà nhau rồi!' : "It's a tie!")
                : (lang() === 'vi' ? KIDS[winners[0]].vi + ' thắng!' : KIDS[winners[0]].en + ' wins!');
            el('win-title').textContent = title;

            var rows = '';
            for (var j = 0; j < G.kids; j++) {
                var acc = G.shots[j] ? Math.round(100 * G.hits[j] / G.shots[j]) : 0;
                var oops = G.wrong[j] ? ' · ' + (lang() === 'vi' ? 'nhầm ' : 'oops ') + G.wrong[j] : '';
                rows += '<div class="score-row" style="--kid:' + KIDS[j].css + '">' +
                    '<span>' + KIDS[j].emoji + ' ' + (lang() === 'vi' ? KIDS[j].vi : KIDS[j].en) + '</span>' +
                    '<span>' + G.scores[j] + ' · ' + G.hits[j] + '/' + G.shots[j] + ' (' + acc + '%)' + oops + '</span></div>';
            }
            el('win-rows').innerHTML = rows;

            var fresh = store.record(best);
            el('win-best').textContent = store.data.best;
            el('win-new').hidden = !fresh;
            show(el('win-overlay'));
            this.paintHud();
        }
    };

    function openMenu() {
        G.mode = 'menu';
        document.body.classList.remove('playing');
        hideAll();
        el('flash').classList.add('hidden');
        show(el('menu-overlay'));
        el('menu-best').textContent = store.data.best || 0;
        UI.paintHud();
    }

    function wireButtons() {
        var picked = 2;
        var row = el('pick-row');
        row.addEventListener('click', function (ev) {
            var b = ev.target.closest('.kid-btn');
            if (!b) return;
            picked = +b.getAttribute('data-kids');
            row.querySelectorAll('.kid-btn').forEach(function (x) {
                x.classList.toggle('is-on', +x.getAttribute('data-kids') === picked);
            });
        });
        el('btn-play').addEventListener('click', function () { sfx.wake(); UI.start(picked); });
        el('btn-again').addEventListener('click', function () { sfx.wake(); UI.start(G.kids); });
        el('btn-win-menu').addEventListener('click', openMenu);
        el('btn-nav-menu').addEventListener('click', openMenu);
        el('btn-help').addEventListener('click', function () { hideAll(); show(el('help-overlay')); });
        el('btn-help-back').addEventListener('click', function () {
            hideAll();
            if (G.mode === 'menu') show(el('menu-overlay'));
            else document.body.classList.add('playing');
        });

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

        /* Xoay máy hay đổi cỡ cửa sổ thì chọn lại khổ bầu trời. Chờ một nhịp
         * rồi mới đo: lúc sự kiện bắn ra, trình duyệt trên điện thoại vẫn còn
         * đang trả về khổ cũ. */
        var rt = null;
        function onResize() {
            clearTimeout(rt);
            rt = setTimeout(function () { UI.resize(); }, 220);
        }
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);

        window.duckShoot = {
            G: G, UI: UI, R: R, store: store, W: W, H: H, GROUND: GROUND, TOP: TOP,
            start: function (kids) { UI.start(kids || 2); },
            laneOf: laneOf,
            /* khổ thế giới hiện tại — máy soát và máy đo giao diện đọc ở đây,
               vì W/H không còn cố định nữa */
            size: function () { return { W: W, H: H, GROUND: GROUND, TOP: TOP }; },
            state: function () {
                return { mode: G.mode, kids: G.kids, round: G.round, scores: G.scores.slice(), ducks: G.ducks.length };
            }
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
