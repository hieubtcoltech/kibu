/**
 * BẮN VỊT (Duck Shoot) — KIBU Games
 * ----------------------------------------------------------------------------
 * Một tới bốn bé ngồi cạnh nhau trước cùng một màn hình. Màn hình chia làm
 * từng làn, mỗi bé một làn. Đàn vịt bật lên từ bụi cỏ ở khắp nơi rồi lượn vòng
 * bay lên cao — bé chỉ bắn được con vịt đang ở trong làn của mình. Con vịt bật
 * lên ở làn bé 2 mà bé 2 trượt thì nó dạt sang làn bé 3, rồi bé 4. Cả bàn cùng
 * nín thở nhìn một con vịt trôi dần sang phía mình.
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
    var GROUND = H * 0.86;          // vịt bật lên từ đây
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
        GROUND = H * 0.86;
        TOP = Math.round(H * 0.097);
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
        quack: function () { this.tone(340, 250, 0.14, 'sawtooth', 0.05); },
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
        scores: [], streaks: [], hits: [], shots: [],
        roundScores: [],
        ducks: [],           // con đang bay
        queue: [],           // con chưa tới lượt bật lên
        t: 0,                // giây trong vòng
        cool: []             // hồi phát bắn của từng bé
    };

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
                    var r = R.KINDS[kind].r;
                    var tw = r * 4.2, th = r * 3.4;
                    for (var w = 0; w < 3; w++) {
                        var key = 'duck_' + kind + '_' + w;
                        if (this.textures.exists(key)) continue;
                        g.clear();
                        g.scaleCanvas(S, S);
                        g.translateCanvas(tw * 0.42, th * 0.58);
                        A.drawDuck(g, kind, w, r);
                        g.translateCanvas(-tw * 0.42, -th * 0.58);
                        g.scaleCanvas(1 / S, 1 / S);
                        g.generateTexture(key, tw * S, th * S);
                    }
                }
                g.destroy();
                this.duckTex = {};
                for (var kd in R.KINDS) {
                    this.duckTex[kd] = { w: R.KINDS[kd].r * 4.2, h: R.KINDS[kd].r * 3.4, ax: 0.42, ay: 0.58 };
                }
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
                G.scores = []; G.streaks = []; G.hits = []; G.shots = []; G.cool = [];
                for (var i = 0; i < kids; i++) { G.scores.push(0); G.streaks.push(0); G.hits.push(0); G.shots.push(0); G.cool.push(0); }
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
                    if (d.dead || laneOf(d.x) !== lane) continue;
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
                G.hits[lane]++;
                G.streaks[lane]++;
                var pts = R.score(hit.kind, G.streaks[lane]);
                G.scores[lane] += pts;
                hit.by = lane;
                this.pops.push({ x: hit.x, y: hit.y, t: 0, pts: pts, lane: lane, gold: hit.kind === 'gold' });
                if (hit.kind === 'gold') sfx.gold(); else sfx.hit();
                if (G.streaks[lane] >= 3) this.dogSay('proud', lane, hit.kind);
                UI.paintHud();
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
                    if (this.introT > 2.1) { G.mode = 'play'; UI.paintHud(); }
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
                        dead: false, fallV: 0, wing: 0, wingT: 0, face: d.dir, gone: false
                    });
                    sfx.quack();
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
                            this.dogSay('proud', k.by, k.kind);
                        }
                        continue;
                    }

                    var age = G.t - k.born;
                    var p = R.duckAt(k.spec, age, GROUND, W);
                    k.face = p.turn;
                    k.x = p.x; k.y = p.y;
                    if (!R.inView(p, W, TOP)) {
                        /* thoát mất — không ai được điểm, chó ra trêu */
                        G.ducks.splice(i, 1);
                        k.gone = true;
                        sfx.away();
                        this.dogSay('tease', laneOf(k.x));
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
                    this.pops[i].y -= 42 * dt;
                    if (this.pops[i].t > 1.1) this.pops.splice(i, 1);
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
                g.fillStyle(sc.grass, 1);
                g.fillRect(0, GROUND, W, H - GROUND);
                g.fillStyle(sc.tree, 0.55);
                for (var b = 0; b < 46; b++) {
                    var bx = (b * 29 + 11) % W;
                    var bh = 16 + ((b * 37) % 22);
                    g.fillTriangle(bx, GROUND + 6, bx + 7, GROUND + 6 - bh, bx + 14, GROUND + 6);
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
                    var tex = this.duckTex[d.kind];
                    img.setTexture('duck_' + d.kind + '_' + (d.dead ? 2 : d.wing));
                    img.setDisplaySize(tex.w, tex.h);
                    img.setOrigin(tex.ax, tex.ay);
                    img.setPosition(d.x, d.y);
                    img.setFlipX(d.face < 0);
                    img.setAngle(d.dead ? 180 : (d.spec.amp ? Math.sin((G.t - d.born) * 3.1 + d.spec.phase) * 8 : 0));
                    img.setVisible(true);
                    /* đêm tối: vịt chỉ rõ khi nằm trong vệt trăng */
                    img.setAlpha(sc.dark ? 0.34 + 0.66 * this.moonLit(d.x) : 1);

                    /* bóng trên cỏ — cho thấy con vịt đang ở đâu theo bề ngang */
                    g.fillStyle(0x000000, 0.13);
                    g.fillEllipse(d.x, GROUND + 14, R.KINDS[d.kind].r * 1.7, R.KINDS[d.kind].r * 0.42);
                }
            },

            moonLit: function (x) {
                var tt = this.time.now / 1000;
                var mx = (tt * 90) % (W + 460) - 230;
                var d = Math.abs(x - (mx + 70));
                return Math.max(0, 1 - d / 200);
            },

            paintFx: function () {
                var g = this.gFx;
                g.clear();
                var i;
                for (i = 0; i < this.puffs.length; i++) {
                    var p = this.puffs[i], k = p.t / 0.35;
                    g.lineStyle(3, KIDS[p.lane].color, 1 - k);
                    g.strokeCircle(p.x, p.y, 10 + k * 40);
                    g.lineStyle(2, 0xffffff, (1 - k) * 0.8);
                    g.beginPath();
                    g.moveTo(p.x - 16, p.y); g.lineTo(p.x + 16, p.y);
                    g.moveTo(p.x, p.y - 16); g.lineTo(p.x, p.y + 16);
                    g.strokePath();
                }
                for (i = 0; i < this.pops.length; i++) {
                    var q = this.pops[i], t = q.t / 1.1;
                    g.fillStyle(q.gold ? 0xffd43b : KIDS[q.lane].color, (1 - t) * 0.9);
                    for (var s = 0; s < 8; s++) {
                        var a = s / 8 * TAU + t * 2;
                        g.fillCircle(q.x + Math.cos(a) * (16 + t * 46), q.y + Math.sin(a) * (16 + t * 46), 4 * (1 - t) + 1);
                    }
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

                /* Bụi cỏ vẽ ĐÈ LÊN chân chó. Thiếu nó thì chú chó trôi lơ lửng
                 * trên mặt cỏ như bị dán vào, chứ không phải nhô lên từ bụi.
                 * Bụi vẽ bằng hình bầu chứ không phải hình chữ nhật — hình chữ
                 * nhật xoá mất đám cỏ nền bên dưới và để lại một vệt vuông rõ
                 * mồn một, ảnh chụp thử lộ ngay. */
                g.fillStyle(sc.grass, 1);
                g.fillEllipse(x, GROUND + 26, 210, 68);
                g.fillStyle(sc.tree, 0.6);
                for (var i = -5; i <= 5; i++) {
                    var bx = x + i * 17 + (i % 2) * 5;
                    var bh = 22 + ((i * 37) % 15);
                    g.fillTriangle(bx - 7, GROUND + 14, bx, GROUND + 14 - bh, bx + 7, GROUND + 14);
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
            var html = '';
            for (var i = 0; i < G.kids; i++) {
                var k = KIDS[i];
                html += '<div class="pcard" id="pcard' + i + '" style="--kid:' + k.css + '">' +
                    '<span class="pc-name">' + k.emoji + ' ' + (lang() === 'vi' ? k.vi : k.en) + '</span>' +
                    '<b class="pc-score" id="pscore' + i + '">0</b>' +
                    '<span class="pc-combo" id="pcombo' + i + '"></span>' +
                    '</div>';
            }
            box.innerHTML = html;
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

        paintRound: function () {
            var r = R.ROUNDS[G.round];
            var box = el('flash');
            if (!box) return;
            box.innerHTML = '<span class="fl-no">' + (lang() === 'vi' ? 'VÒNG' : 'ROUND') + ' ' + (G.round + 1) + '</span>' +
                '<b class="fl-name">' + (lang() === 'vi' ? r.vi : r.en) + '</b>' +
                '<span class="fl-hint">' + (lang() === 'vi' ? r.hint_vi : r.hint_en) + '</span>';
            box.classList.remove('hidden');
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
            box.classList.remove('hidden');
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
                rows += '<div class="score-row" style="--kid:' + KIDS[j].css + '">' +
                    '<span>' + KIDS[j].emoji + ' ' + (lang() === 'vi' ? KIDS[j].vi : KIDS[j].en) + '</span>' +
                    '<span>' + G.scores[j] + ' · ' + G.hits[j] + '/' + G.shots[j] + ' (' + acc + '%)</span></div>';
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
