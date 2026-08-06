/**
 * SPIDER CLIMB — KIBU Games
 * ----------------------------------------------------------------------------
 * Một người nhện leo mãi lên giữa hai toà nhà chọc trời. Bám tường thì tự leo,
 * chạm màn hình là bay sang tường bên kia, và ba lần bắn tơ để gỡ những thứ
 * chắn đường. Càng lên cao thành phố càng đổi: sáng sớm ngoài phố, khu cao ốc
 * kính, tầng mây, công trường lúc hoàng hôn, đêm giông, rồi bầu trời lạ.
 *
 * HAI TỆP, HAI VIỆC
 *   rules.js  khổ sân, vật lý, sáu vùng cao độ, 22 khuôn màn và PHÉP ĐẶT VẬT
 *             CẢN CÓ KIỂM LUẬT. Không biết gì về canvas, nên node chạy thẳng
 *             được — check-climb.js sinh 60 hạt giống × 12 000 mét rồi soát
 *             từng điều luật công bằng trước khi có ai vẽ một nét nào.
 *   game.js   tệp này: ngón tay, máy quay, vẽ, âm thanh, luồng lượt chơi.
 *
 * ĐIỀU KHIỂN — ĐÚNG HAI THỨ, chơi được bằng một ngón
 *   chạm bất kỳ đâu   nhảy sang tường đối diện (và lúc đang rơi thì bắn tơ
 *                     bám lại vào tường — đây là cách tự cứu mình)
 *   nút tơ góc phải   bắn tơ hạ mối nguy đang bay
 *
 * VÌ SAO NHẢY NỔ RA NGAY LÚC BẤM chứ không đợi nhả tay: bản đầu em định làm
 * "chạm nhanh thì nhảy, giữ lâu thì leo nhanh" — nghe thì được hai việc bằng
 * một ngón, nhưng muốn phân biệt nhanh với lâu thì phải ĐỢI xem tay có nhả
 * không, tức là mọi cú nhảy trễ thêm hai phần mười giây. Ở game phản xạ, hai
 * phần mười giây ấy là khoảng cách giữa "mình bấm hụt" và "game không nghe
 * mình". Nên bỏ hẳn, đổi lại phần thưởng cho cú bắt tường đẹp là một quãng leo
 * nhanh tự động.
 *
 * BỐ CỤC
 *   1. Tiện ích       5. Nhập liệu     9. Vẽ nền và toà nhà
 *   2. Tiến trình     6. Lượt chơi    10. Vẽ vật thể
 *   3. Âm thanh       7. Người chơi   11. Vẽ người nhện
 *   4. Sân và máy quay 8. Va chạm     12. Giao diện HTML & vòng lặp
 */
(function () {
    'use strict';

    var R = window.ClimbRules;

    /* ========================================================================
     *  1. TIỆN ÍCH
     * ======================================================================*/

    var W = R.W, H = R.H;
    var SIDE_L = R.SIDE_L, SIDE_R = R.SIDE_R;

    function el(id) { return document.getElementById(id); }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

    /* Băm số nguyên ra một số 0..1 ổn định. Dùng để quyết định ô cửa sổ nào
     * sáng: phải ổn định theo toạ độ chứ không theo lượt vẽ, không thì cả toà
     * nhà nhấp nháy loạn lên mỗi khung hình. */
    function hash2(a, b) {
        var h = (a * 374761393 + b * 668265263) | 0;
        h = (h ^ (h >>> 13)) * 1274126177;
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }

    function mixHex(c1, c2, t) {
        var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
        var r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
        var g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
        var l = Math.round(lerp(a & 255, b & 255, t));
        return 'rgb(' + r + ',' + g + ',' + l + ')';
    }

    function roundRect(c, x, y, w, h, r) {
        r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
    }

    /* ========================================================================
     *  2. TIẾN TRÌNH — giữ trong máy người chơi
     * ======================================================================*/

    var KEY = 'kibu_spider_climb';
    var SOUND_KEY = 'kibu_spider_climb_sound';

    var store = {
        data: {
            coins: 0, gems: 0, suit: 'classic', owned: ['classic'],
            best: { endless: 0, daily: 0, hardcore: 0 },
            bestM: { endless: 0, daily: 0, hardcore: 0 },
            rec: { combo: 0, drones: 0, sprint: 0 },
            missions: null, done: [], dailyDay: 0, dailyBestDay: 0,
            plays: 0, seenHelp: false
        },
        load: function () {
            try {
                var raw = localStorage.getItem(KEY);
                if (raw) {
                    var d = JSON.parse(raw);
                    if (d && typeof d === 'object') {
                        for (var k in this.data) {
                            if (d[k] !== undefined && d[k] !== null) this.data[k] = d[k];
                        }
                    }
                }
            } catch (e) { }
            /* Nhiệm vụ: ba cái mở cùng lúc. Chưa có thì bốc mới. */
            if (!this.data.missions || !this.data.missions.length) {
                this.data.missions = R.rollMissions(this.data.done, R.makeRng(R.dailySeed()), 3);
                this.save();
            }
        },
        save: function () {
            try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { }
        }
    };

    /* ========================================================================
     *  3. ÂM THANH
     * ------------------------------------------------------------------------
     *  Tổng hợp bằng WebAudio, không tải tệp nào. Bản thiết kế đòi tiếng phải
     *  GIÚP PHẢN XẠ chứ không chỉ trang trí, nên mỗi mối nguy có tiếng báo
     *  riêng: laser rít lên lúc nạp, dây điện lách tách trước khi phóng, gió rít
     *  trước khi thổi. Nghe tiếng là biết ngẩng lên nhìn đâu.
     * ======================================================================*/

    var Sfx = {
        on: true, ctx: null, master: null, noise: null,

        init: function () {
            try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { }
        },
        /* Máy âm thanh chỉ dựng sau cú chạm đầu tiên — trình duyệt chặn tiếng
         * tự phát, dựng sớm thì nó nằm treo và mọi tiếng đặt lịch vào đó rơi
         * vào hư không. */
        wake: function () {
            if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
            try {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = this.on ? 0.5 : 0;
                this.master.connect(this.ctx.destination);
                var n = Math.floor(this.ctx.sampleRate * 0.6);
                var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
                var d = buf.getChannelData(0);
                for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
                this.noise = buf;
            } catch (e) { this.ctx = null; }
        },
        toggle: function () {
            this.on = !this.on;
            /* Vặn cả núm tổng, không chỉ đặt cờ. Nền gió là một nguồn chạy liên
             * tục, nó không đi qua ready() như mấy tiếng bắn một phát — chỉ đặt
             * cờ thì tắt tiếng xong gió vẫn thổi. */
            if (this.master) this.master.gain.value = this.on ? 0.5 : 0;
            try { localStorage.setItem(SOUND_KEY, this.on ? '1' : '0'); } catch (e) { }
            return this.on;
        },

        /* NỀN GIÓ — một nguồn ồn chạy vòng, và cả game chỉ có một cái.
         *
         * Nó lo luôn ba việc mà bản thiết kế đòi: hơi thở của thành phố lúc
         * đang leo, tiếng rít khi bò nhanh, và tiếng gió ù lên lúc rơi. Làm ba
         * tiếng riêng thì chúng chồng lên nhau nghe đục; một nguồn rồi vặn độ
         * to với tần số theo trạng thái thì nghe liền mạch như một luồng gió
         * thật đang đổi. */
        ambient: function (level, bright) {
            if (!this.ctx || this.ctx.state !== 'running') return;
            if (!this.amb) {
                var src = this.ctx.createBufferSource();
                src.buffer = this.noise;
                src.loop = true;
                var f = this.ctx.createBiquadFilter();
                f.type = 'bandpass';
                f.frequency.value = 420;
                f.Q.value = 0.6;
                var g = this.ctx.createGain();
                g.gain.value = 0;
                src.connect(f); f.connect(g); g.connect(this.master);
                src.start();
                this.amb = { g: g, f: f };
            }
            var t = this.ctx.currentTime;
            /* Chuyển dần trong 0,15 giây. Đặt thẳng giá trị thì mỗi khung hình
             * là một bước nhảy, và tai nghe ra tiếng rẹt rẹt — đúng thứ vừa đi
             * chữa ở tiếng bám tay. */
            this.amb.g.gain.setTargetAtTime(this.on ? level : 0, t, 0.15);
            this.amb.f.frequency.setTargetAtTime(bright, t, 0.2);
        },
        /* Máy có ĐANG CHẠY không. Lúc trình duyệt treo nó thì currentTime đứng
         * yên, mọi tiếng đặt lịch trong quãng ấy dồn về một mốc quá khứ rồi nổ
         * ra cùng lúc khi máy chạy lại — tai nghe thành "tiếng chạy sau hình".
         * Thà bỏ hẳn tiếng ấy. */
        ready: function () {
            if (!this.on || !this.ctx) return false;
            if (this.ctx.state !== 'running') { this.ctx.resume(); return false; }
            return true;
        },
        tone: function (f0, f1, dur, type, vol, delay) {
            if (!this.ready()) return;
            var t = this.ctx.currentTime + (delay || 0);
            var o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(f0, t);
            if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol || 0.05, t + 0.0015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(this.master);
            o.start(t); o.stop(t + dur + 0.02);
        },
        hit: function (dur, vol, freq, type, delay) {
            if (!this.ready() || !this.noise) return;
            var t = this.ctx.currentTime + (delay || 0);
            var src = this.ctx.createBufferSource();
            src.buffer = this.noise;
            var f = this.ctx.createBiquadFilter();
            f.type = type || 'lowpass';
            f.frequency.setValueAtTime(freq, t);
            var g = this.ctx.createGain();
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(f); f.connect(g); g.connect(this.master);
            src.start(t); src.stop(t + dur + 0.02);
        },

        jump: function () { this.tone(340, 620, 0.11, 'triangle', 0.05); },
        land: function () { this.hit(0.09, 0.10, 1400, 'lowpass'); this.tone(520, 300, 0.07, 'sine', 0.035); },

        /* TIẾNG BÁM TAY.
         *
         * Bản trước là tiếng ồn trắng bắn ra ngẫu nhiên năm tới chín lần mỗi
         * giây. Hai chỗ sai, và cộng lại thành đúng cái tiếng lạo xạo anh Hiếu
         * nghe thấy: một, ồn trắng lọc dải cao nghe y như nhiễu radio chứ không
         * giống bàn tay chạm tường; hai, RẢI NGẪU NHIÊN nên không có nhịp, mà
         * tai người bắt nhịp trước khi bắt được âm sắc — cái gì đều đặn thì
         * nghe ra hành động, cái gì lộn xộn thì nghe ra tạp âm.
         *
         * Nay mỗi lần bám là một tiếng, đếm theo QUÃNG ĐƯỜNG leo chứ không theo
         * đồng hồ: nhịp tự khớp với dáng bò, và leo nhanh thì nhịp dồn lên
         * đúng như thật. Âm sắc là một cú "bụp" trầm lọc thấp cộng một chút
         * dính tay, hai tay so le nhau nửa cung. */
        step: function (right) {
            if (!this.ready()) return;
            var f = right ? 132 : 108;
            this.tone(f, f * 0.72, 0.055, 'sine', 0.030);
            this.hit(0.045, 0.020, 620, 'lowpass');
        },
        web: function () { this.tone(1500, 260, 0.16, 'sawtooth', 0.035); this.hit(0.1, 0.05, 2600, 'highpass'); },
        webHit: function () { this.hit(0.14, 0.11, 900, 'lowpass'); this.tone(300, 90, 0.16, 'square', 0.04); },
        coin: function (n) { this.tone(880 + Math.min(9, n || 0) * 46, 1320, 0.075, 'triangle', 0.042); },
        gem: function () { this.tone(880, 1760, 0.12, 'sine', 0.055); this.tone(1320, 2200, 0.16, 'sine', 0.035, 0.05); },
        power: function () { this.tone(520, 1040, 0.14, 'square', 0.04); this.tone(780, 1560, 0.16, 'sine', 0.03, 0.06); },
        bump: function () { this.hit(0.16, 0.14, 380, 'lowpass'); this.tone(180, 70, 0.18, 'square', 0.05); },
        glassTick: function () { this.hit(0.05, 0.05, 5200, 'highpass'); },
        glassBreak: function () {
            this.hit(0.42, 0.14, 4200, 'highpass');
            this.tone(2400, 500, 0.3, 'triangle', 0.045);
        },
        shock: function () { this.hit(0.22, 0.10, 3200, 'highpass'); this.tone(120, 60, 0.2, 'sawtooth', 0.045); },
        lose: function () { this.tone(400, 90, 0.42, 'sawtooth', 0.06); this.hit(0.35, 0.09, 500, 'lowpass'); },
        over: function () { this.tone(420, 110, 0.55, 'triangle', 0.06); this.tone(300, 80, 0.7, 'sine', 0.04, 0.1); },
        save: function () { this.tone(300, 900, 0.15, 'triangle', 0.05); },
        laserCharge: function () { this.tone(600, 1700, 0.55, 'sawtooth', 0.02); },
        laserFire: function () { this.hit(0.2, 0.09, 2400, 'bandpass'); this.tone(1800, 400, 0.16, 'square', 0.035); },
        gust: function () { this.hit(0.85, 0.07, 700, 'bandpass'); },
        thunder: function () { this.hit(0.9, 0.13, 260, 'lowpass'); },
        /* Tiếng nạp của tia nhắm vào mình: rít lên dần, nghe là biết ngẩng lên
         * tìm vòng sáng. Khác hẳn tiếng ục ục của sấm xa, để hai thứ không lẫn
         * vào nhau — mà không lẫn mới là điều quan trọng nhất ở đây. */
        boltCharge: function () {
            this.tone(320, 1500, 1.0, 'sawtooth', 0.022);
            this.hit(0.9, 0.03, 3000, 'highpass');
        },
        boltStrike: function () {
            this.hit(0.16, 0.20, 6000, 'highpass');
            this.hit(1.1, 0.16, 220, 'lowpass', 0.04);
            this.tone(180, 50, 0.5, 'sawtooth', 0.06);
        },
        zone: function () {
            var f = [523, 659, 784, 1047];
            for (var i = 0; i < f.length; i++) this.tone(f[i], f[i] * 1.5, 0.2, 'triangle', 0.045, i * 0.09);
        },
        record: function () {
            var f = [659, 784, 988, 1319];
            for (var i = 0; i < f.length; i++) this.tone(f[i], f[i], 0.16, 'square', 0.04, i * 0.07);
        }
    };

    /* ========================================================================
     *  4. SÂN VÀ MÁY QUAY
     * ======================================================================*/

    var canvas, ctx, dpr = 1;

    function buildCanvas() {
        var host = el('game-canvas');
        canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        host.appendChild(canvas);
        ctx = canvas.getContext('2d');
        var stage = document.querySelector('.stage');
        stage.style.setProperty('--stage-w', W);
        stage.style.setProperty('--stage-h', H);
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        var host = el('game-canvas');
        var r = host.getBoundingClientRect();
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.max(1, Math.round(r.width * dpr));
        canvas.height = Math.max(1, Math.round(r.height * dpr));
        /* Vẽ luôn bằng toạ độ lô-gic 540×960, còn tỉ lệ thì để ma trận lo. Khung
         * .stage đã giữ đúng tỉ lệ ấy nên không bao giờ méo. */
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }

    /* ========================================================================
     *  5. TRẠNG THÁI LƯỢT CHƠI
     * ======================================================================*/

    var START_Y = 900;

    /* Leo được bấy nhiêu điểm ảnh thì đổi tay một lần. 44 ra chừng bốn nhịp mỗi
     * giây lúc mới xuất phát — đủ để nghe ra là đang bò, chưa tới mức lách
     * cách. */
    var STEP_PX = 44;

    var G = {
        phase: 'menu',        // menu | play | pause | over
        mode: 'endless',
        world: null,
        t: 0,                 // đồng hồ thật của lượt
        hz: 0,                // đồng hồ của mối nguy — chậm lại khi ăn đồng hồ cát
        camY: 0,
        shake: 0,
        flash: 0,             // chớp sáng (sét, mất mạng)
        score: 0, coins: 0, gems: 0,
        combo: 0, maxCombo: 0,
        lives: R.LIVES, livesLost: 0,
        maxY: START_Y,
        zone: 0, zoneBannerT: 0,
        revived: false,
        freeze: 0,            // đóng băng ngắn lúc mất mạng
        stats: null,
        power: { shield: 0, magnet: 0, x2: 0, slow: 0 },
        sprint300: 0,
        gustSeen: null,
        deaths: {},
        bolt: null, boltT: 0, farBolt: null, farBoltT: 0,
        fws: [], fwT: 0
    };

    var P = {
        side: SIDE_L, x: 0, y: START_Y, vx: 0, vy: 0,
        state: 'cling', face: 1, anim: 0,
        crack: 0, glassOn: null, glassT: 0, invuln: 0, boost: 0,
        flight: 0, flightMax: 0.35,
        stepPhase: 0, stepRight: false,
        fastKey: false, fastTouch: false,
        web: R.WEB_MAX, webT: 0, webShot: null, catchFail: 0
    };

    var parts = [];
    var pops = [];

    function addPart(x, y, vx, vy, life, col, size, kind) {
        if (parts.length > 260) return;
        parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, col: col, s: size, kind: kind || 'dot' });
    }
    function burst(x, y, n, col, spd, kind) {
        for (var i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, v = spd * (0.4 + Math.random() * 0.8);
            addPart(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.3 + Math.random() * 0.45, col, 2 + Math.random() * 2.6, kind);
        }
    }
    function pop(x, y, text, col) {
        pops.push({ x: x, y: y, text: text, col: col || '#fff', life: 0.9 });
    }

    /* ========================================================================
     *  6. BẮT ĐẦU / KẾT THÚC MỘT LƯỢT
     * ======================================================================*/

    function seedFor(mode) {
        if (mode === 'daily') return R.dailySeed();
        return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    }

    function startRun(mode) {
        G.mode = mode || 'endless';
        G.world = new R.World(seedFor(G.mode));
        /* Khắc nghiệt: một mạng, và KHÔNG có khiên. Bản thiết kế đòi chế độ này
         * bớt cả đồ cứu trợ chứ không chỉ bớt mạng — còn khiên thì nó vẫn là
         * chế độ thường, chỉ ngắn hơn. */
        G.world.noShields = G.mode === 'hardcore';
        G.t = 0; G.hz = 0; G.score = 0; G.coins = 0; G.gems = 0;
        G.combo = 0; G.maxCombo = 0;
        G.lives = G.mode === 'hardcore' ? 1 : R.LIVES;
        G.livesLost = 0;
        G.maxY = START_Y; G.zone = 0; G.zoneBannerT = 0;
        G.revived = false; G.freeze = 0; G.shake = 0; G.flash = 0;
        G.sprint300 = 0; G.gustSeen = null; G.deaths = {};
        G.bolt = null; G.boltT = R.BOLT_GRACE; G.farBolt = null; G.farBoltT = 0;
        G.fws.length = 0; G.fwT = 1.5;
        G.power = { shield: 0, magnet: 0, x2: 0, slow: 0 };
        G.stats = {
            metres: 0, coins: 0, gems: 0, jumps: 0, drones: 0, foes: 0, gusts: 0,
            combo: 0, near: 0, catches: 0, powers: 0, cracks: 0, webs: 0, cleanMetres: 0
        };

        P.side = SIDE_L; P.y = START_Y; P.vx = 0; P.vy = 0;
        P.state = 'cling'; P.face = 1; P.anim = 0;
        P.crack = 0; P.glassOn = null; P.glassT = 0; P.invuln = 1.2; P.boost = 0;
        P.fastKey = false; P.fastTouch = false;
        P.web = R.WEB_MAX; P.webT = 0; P.webShot = null; P.catchFail = 0;
        P.x = G.world.wallX(SIDE_L, P.y) + R.PLAYER_R;

        G.camY = P.y + H * R.CAM_ANCHOR;
        G.world.ensure(G.camY + H);
        parts.length = 0; pops.length = 0;

        G.phase = 'play';
        /* Nhả tiêu điểm khỏi cái nút vừa bấm.
         *
         * Trình duyệt để phím cách "bấm lại" phần tử đang có tiêu điểm. Bấm
         * chuột vào BẮT ĐẦU LEO xong, cái nút ấy vẫn đang được chọn — nên phát
         * bắn tơ đầu tiên bằng phím cách sẽ bấm trúng nút BẮT ĐẦU và khởi động
         * lại cả lượt chơi. Chỉ xảy ra khi vào bằng chuột rồi chơi bằng bàn
         * phím, nên rất dễ lọt qua mọi lần thử. */
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        showScreen(null);
        el('hud').hidden = false;
        touchButtons(true);
        syncHud(true);
        Sfx.wake();
    }

    function metresNow() { return Math.max(0, (G.maxY - START_Y) / R.PX_PER_M); }

    function endRun() {
        G.phase = 'over';
        Sfx.ambient(0, 300);
        Sfx.over();
        touchButtons(false);

        var m = Math.floor(metresNow());
        var s = Math.floor(G.score);
        G.stats.metres = m;
        G.stats.combo = G.maxCombo;
        G.stats.cleanMetres = G.livesLost ? 0 : m;

        var d = store.data;
        d.plays = (d.plays || 0) + 1;
        d.coins += G.coins;
        d.gems += G.gems;

        var freshScore = s > (d.best[G.mode] || 0);
        var freshHeight = m > (d.bestM[G.mode] || 0);
        if (freshScore) d.best[G.mode] = s;
        if (freshHeight) d.bestM[G.mode] = m;
        if (G.maxCombo > (d.rec.combo || 0)) d.rec.combo = G.maxCombo;
        if (G.stats.drones > (d.rec.drones || 0)) d.rec.drones = G.stats.drones;
        if (G.sprint300 > 0 && (!d.rec.sprint || G.sprint300 < d.rec.sprint)) d.rec.sprint = G.sprint300;

        var finished = checkMissions();
        store.save();

        el('over-height').textContent = fmt(m) + ' m';
        el('over-score').textContent = fmt(s);
        el('over-coins').textContent = fmt(G.coins);
        el('over-combo').textContent = 'x' + G.maxCombo;
        el('over-zone').textContent = R.ZONES[G.zone].icon + ' ' + R.ZONES[G.zone].name;
        el('over-best').textContent = fmt(d.best[G.mode] || 0);
        el('over-new').hidden = !(freshScore || freshHeight);
        if (freshScore || freshHeight) Sfx.record();

        var box = el('over-missions');
        box.innerHTML = '';
        if (finished.length) {
            finished.forEach(function (f) {
                var row = document.createElement('div');
                row.className = 'mission-done';
                row.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + f.text +
                    ' <b>+' + f.coins + ' 🪙' + (f.gems ? ' +' + f.gems + ' 💎' : '') + '</b>';
                box.appendChild(row);
            });
        }

        /* Hồi sinh: chỉ mời khi CÒN đủ ngọc, chưa dùng lượt nào, và không phải
         * chế độ khắc nghiệt. Bản thiết kế cấm mọi thứ làm phiền giữa chừng nên
         * đây là lời mời im lặng ở màn kết thúc, không phải cửa sổ bật ra. */
        var canRevive = !G.revived && G.mode !== 'hardcore' && d.gems >= 2;
        el('btn-revive').hidden = !canRevive;
        showScreen('over-overlay');
        syncMenu();
    }

    function revive() {
        if (store.data.gems < 2) return;
        store.data.gems -= 2;
        store.save();
        G.revived = true;
        G.lives = 2;
        G.phase = 'play';
        /* Nhả tiêu điểm khỏi cái nút vừa bấm.
         *
         * Trình duyệt để phím cách "bấm lại" phần tử đang có tiêu điểm. Bấm
         * chuột vào BẮT ĐẦU LEO xong, cái nút ấy vẫn đang được chọn — nên phát
         * bắn tơ đầu tiên bằng phím cách sẽ bấm trúng nút BẮT ĐẦU và khởi động
         * lại cả lượt chơi. Chỉ xảy ra khi vào bằng chuột rồi chơi bằng bàn
         * phím, nên rất dễ lọt qua mọi lần thử. */
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        showScreen(null);
        touchButtons(true);
        respawn(true);
        Sfx.save();
        toast('Back on the wall!');
    }

    /* ========================================================================
     *  7. NGƯỜI CHƠI
     * ======================================================================*/

    /* Hai cái nút cảm ứng luôn hiện và ẩn CÙNG NHAU, và ẩn đi thì phải thả tay
     * hộ luôn. Bản trước em bật tắt từng cái ở bảy chỗ rời rạc — kiểu ấy chỉ
     * cần quên một chỗ là nút LEO nằm lại trên màn kết thúc, giữ nguyên trạng
     * thái đang bấm, rồi lượt sau bắt đầu bằng việc leo nhanh mà không ai bảo. */
    function touchButtons(on) {
        el('btn-web').hidden = !on;
        el('btn-boost').hidden = !on;
        if (!on) {
            P.fastTouch = false;
            P.fastKey = false;
            el('btn-boost').classList.remove('is-on');
        }
    }

    function wallHold(side, y) {
        return G.world.wallX(side, y) + (side === SIDE_L ? R.PLAYER_R : -R.PLAYER_R);
    }

    function doJump() {
        if (P.state === 'cling') {
            var dir = P.side === SIDE_L ? 1 : -1;
            P.vx = dir * R.JUMP_VX;
            P.vy = 0;
            P.state = 'jump';
            P.flight = 0;
            /* Bay hết bao lâu — dùng để vẽ vòng cung cho đúng nhịp. Khe rộng
             * thì bay lâu hơn, và đó vẫn là chỗ khó của khe rộng: hở sườn lâu
             * hơn giữa không trung. */
            P.flightMax = Math.max(0.12, gapEdges(P.y).g / R.JUMP_VX);
            P.face = dir;
            P.crack = 0;
            G.stats.jumps++;
            Sfx.jump();
            burst(P.x, P.y, 6, 'rgba(255,255,255,0.7)', 90, 'dust');
            return;
        }
        if (P.state === 'fall') tryWallCatch();
    }

    /* Nhảy CÓ HƯỚNG, dành cho bàn phím.
     *
     * Trên điện thoại chỉ có một cú chạm và nó luôn có nghĩa "sang tường bên
     * kia" — không cần hướng, vì bao giờ cũng chỉ có một chỗ để sang. Nhưng
     * ngồi bàn phím trước hai toà tháp thì tay tự tìm phím trái phải, và để
     * trống hai phím ấy là bắt người chơi học một quy ước mà màn hình không hề
     * gợi ý gì. Nay bấm về phía tường kia thì nhảy, còn bấm về phía tường mình
     * ĐANG BÁM thì không làm gì cả — chứ không phải nhảy đi rồi nhảy về, mất
     * toi cả chuỗi liên hoàn vì một cú bấm mà ý người chơi rõ ràng là "ở yên".
     *
     * Lúc đang rơi, hai phím ấy còn chọn được bám vào tường nào — thứ mà cú
     * chạm trên điện thoại phải đoán hộ. */
    function doJumpTo(dir) {
        var target = dir > 0 ? SIDE_R : SIDE_L;
        if (P.state === 'cling') {
            if (P.side === target) return;
            doJump();
        } else if (P.state === 'fall') {
            tryWallCatch(target);
        }
    }

    /* Bắn tơ bám lại vào tường lúc đang rơi. Đây là cách TỰ CỨU, và nó TIÊU
     * MỘT LẦN BẮN TƠ.
     *
     * Bản đầu em cho bám miễn phí. Máy chơi thử đo ra ngay hậu quả: hai phút
     * chơi, rơi 93 lần và bám lại được 416 lần — rơi chẳng mất gì cả, nên
     * chẳng còn đáng sợ, nên cả cái sức căng của game bay mất. Bắt trả bằng
     * tơ thì mọi thứ vào đúng chỗ: tơ thành thứ tài nguyên phải cân nhắc (bắn
     * hạ con máy bay kia hay để dành phòng lúc trượt tay?), và bảng điểm đã
     * hiện sẵn số lần bắn còn lại nên không ai bị bất ngờ.
     *
     * Nó vẫn phải THẤT BẠI được: bám vào chỗ có vật cản hay dây điện thì trượt
     * tay — và lần trượt ấy không tính tiền, vì người chơi có làm gì sai đâu
     * ngoài việc chọn nhầm chỗ. */
    function tryWallCatch(prefer) {
        /* prefer là bên người chơi CHỈ ĐỊNH bằng phím trái/phải. Không chỉ định
         * thì bám vào tường gần hơn — đúng thứ ngón tay trên điện thoại muốn,
         * vì ở đó chỉ có một cú chạm chứ không có hướng nào để nói. */
        var side = prefer != null ? prefer : (P.x < W / 2 ? SIDE_L : SIDE_R);
        if (P.web <= 0) {
            P.catchFail = 0.35;
            Sfx.bump();
            pop(P.x, P.y - 26, 'NO WEB!', '#ff8a8a');
            return;
        }
        if (spotFree(side, P.y)) {
            P.web--;
            P.side = side;
            P.state = 'cling';
            P.vx = 0; P.vy = 0; P.crack = 0;
            P.x = wallHold(side, P.y);
            P.face = side === SIDE_L ? 1 : -1;
            P.boost = 0.5;
            G.stats.catches++;
            addCombo(1);
            Sfx.save();
            pop(P.x, P.y - 26, 'WALL CATCH', '#7ee0ff');
            burst(P.x, P.y, 10, 'rgba(180,230,255,0.9)', 130, 'dust');
        } else {
            P.catchFail = 0.35;
            Sfx.bump();
        }
    }

    function bumpOff(msg) {
        P.state = 'fall';
        P.vy = -60;
        P.vx = (P.side === SIDE_L ? 1 : -1) * 210;
        P.crack = 0;
        breakCombo();
        G.shake = Math.max(G.shake, 8);
        Sfx.bump();
        if (msg) pop(P.x, P.y - 24, msg, '#ff8a8a');
        burst(P.x, P.y, 12, 'rgba(255,190,120,0.9)', 150, 'dust');
    }

    function addCombo(n) {
        G.combo += n;
        if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    }
    function breakCombo() { G.combo = 0; }

    function loseLife(reason) {
        if (P.invuln > 0) return;
        if (G.power.shield > 0) {
            G.power.shield = 0;
            P.invuln = 1.4;
            G.shake = 12; G.flash = 0.35;
            Sfx.shock();
            pop(P.x, P.y - 26, 'SHIELD!', '#8ef0ff');
            burst(P.x, P.y, 20, 'rgba(140,240,255,0.9)', 210, 'spark');
            return;
        }
        G.lives--;
        G.livesLost++;
        /* Đếm chết theo lý do. Nhẹ như không, mà không có nó thì chỉnh độ khó
         * là đoán mò: biết "lượt chơi ngắn quá" không nói được gì, biết "chết
         * vì máy bay không người lái khi đang bám tường" thì sửa được ngay. */
        G.deaths[reason || '?'] = (G.deaths[reason || '?'] || 0) + 1;
        breakCombo();
        G.freeze = 0.55;
        G.shake = 18; G.flash = 0.5;
        Sfx.lose();
        burst(P.x, P.y, 26, 'rgba(255,120,120,0.9)', 240, 'spark');
        if (G.lives <= 0) { endRun(); return; }
        respawn(false);
        toast(reason || 'Careful!');
    }

    /* Leo lên từ (side, y) thì đi được bao xa mới vướng? Trả về tối đa
     * RESPAWN_CLEAR — quá ngần ấy là đủ rồi, không cần đo tiếp.
     *
     * Tính cả mấy thứ không phải "vật cản" theo nghĩa hẹp nhưng vẫn chặn một
     * quãng leo yên ổn: dây điện đang sống, gã đang thò ra, và MÉP TRÊN ô kính
     * — hồi sinh ngay dưới mép kính thì leo hai bước là kính vỡ. */
    function headroom(side, y) {
        var w = G.world;
        for (var d = 0; d <= R.RESPAWN_CLEAR; d += 12) {
            var yy = y + d;
            if (!spotFree(side, yy)) return d;
            var sf = w.surfaceAt(side, yy);
            if (sf && sf.kind === 'glass' && sf.y1 - yy < R.GLASS_WARN) return d;
            if (sf && sf.kind === 'cracked' && d > 40) return d;
        }
        return R.RESPAWN_CLEAR;
    }

    /* Đặt lại người chơi sau khi mất một mạng.
     *
     * Đây là chỗ anh Hiếu lo, và lo đúng: bản trước chỉ hỏi "điểm này có bám
     * được không" rồi lấy điểm đầu tiên hợp lệ. Bám được ≠ đi tiếp được — nó
     * có thể là chỗ ngay dưới một cục điều hoà, và người chơi leo một cái là
     * đâm, rơi tiếp, mất mạng tiếp. Ba mạng bay trong sáu giây mà chẳng làm gì
     * sai cả.
     *
     * Nay chỗ hồi sinh phải có ĐƯỜNG ĐI: quang ít nhất RESPAWN_CLEAR phía
     * trên, không mối nguy nào lảng vảng gần. Quét cả hai tường, chấm điểm,
     * lấy chỗ tốt nhất — và nếu cả màn không có chỗ nào đủ tốt thì vẫn lấy chỗ
     * tốt nhất trong số đã xét, chứ không thả bừa lên tường trái như trước. */
    function respawn(soft) {
        var base = G.camY - H * R.CAM_ANCHOR;
        var best = null;
        for (var dy = -60; dy < H * 0.72; dy += 12) {
            for (var s = 0; s < 2; s++) {
                var side = s === 0 ? SIDE_L : SIDE_R;
                var y = base + dy;
                if (!spotFree(side, y)) continue;
                var room = headroom(side, y);
                var danger = hazardNear(side, y);
                /* Điểm: đường đi là chính, mối nguy trừ nặng, và hơi nghiêng về
                 * chỗ thấp để người chơi còn thấy đường phía trên mình. */
                var score = room - danger * 260 - Math.abs(dy) * 0.12;
                if (!best || score > best.score) {
                    best = { side: side, y: y, score: score, room: room };
                }
                /* đủ tốt rồi thì thôi, khỏi quét nốt màn hình */
                if (room >= R.RESPAWN_CLEAR && !danger) { best.done = true; break; }
            }
            if (best && best.done) break;
        }
        if (!best) best = { side: SIDE_L, y: base + 60, room: 0 };

        P.side = best.side;
        P.y = best.y;
        P.x = wallHold(best.side, P.y);
        P.state = 'cling'; P.vx = 0; P.vy = 0; P.crack = 0;
        P.glassOn = null; P.glassT = 0;
        P.face = best.side === SIDE_L ? 1 : -1;
        /* Chỗ càng chật thì càng cho thêm thời gian miễn nhiễm */
        P.invuln = (soft ? 2.6 : 2.2) + (best.room < R.RESPAWN_CLEAR ? 1.2 : 0);
        /* Luôn còn ít nhất một lần bắn tơ để tự cứu. Hết tơ mà vừa hồi sinh
         * xong lại rơi thì không còn cách nào thoát, và đó đúng là cái vòng
         * lặp cần chặn. */
        P.web = Math.max(P.web, 1);
        P.webT = 0;
        /* Huỷ tia sét đang nhắm và dời tia kế tiếp ra xa: vừa đứng dậy đã bị
         * sét đón sẵn thì oan quá. */
        G.bolt = null;
        G.boltT = Math.max(G.boltT, R.BOLT_GRACE);
    }

    /* Có mối nguy nào lảng vảng quanh chỗ này không. Rộng tay hơn hẳn phép va
     * chạm — ở đây thà bỏ qua một chỗ đứng tốt còn hơn thả người chơi xuống
     * ngay trước mũi một con máy bay. */
    function hazardNear(side, y) {
        var mv = G.world.movers, n = 0;
        for (var i = 0; i < mv.length; i++) {
            var m = mv[i];
            if (m.dead) continue;
            var my = m.y != null ? m.y : (m.ry != null ? m.ry : (m.y0 + m.y1) / 2);
            if (Math.abs(my - y) > 200) continue;
            /* mấy đứa bám tường chỉ đáng ngại nếu ở cùng bên */
            if ((m.kind === 'thug' || m.kind === 'sentry' || m.kind === 'platform' ||
                 m.kind === 'rival' || m.kind === 'swing') && m.side !== side) continue;
            n++;
        }
        return n;
    }

    /* ---- bắn tơ ---- */

    function bestWebTarget() {
        var best = null, bestD = R.WEB_RANGE;
        var mv = G.world.movers, i, m, mx, my, d;
        for (i = 0; i < mv.length; i++) {
            m = mv[i];
            if (m.dead || !m.hp) continue;
            var pos = moverPos(m);
            if (!pos) continue;
            mx = pos.x; my = pos.y;
            if (my < P.y - 120) continue;             // đã trôi qua thì thôi
            d = Math.hypot(mx - P.x, my - P.y);
            if (d < bestD) { bestD = d; best = { kind: 'mover', m: m, x: mx, y: my }; }
        }
        /* Dây điện cắt được — chỗ duy nhất tơ MỞ RA đường mới */
        var sf = G.world.surfaces;
        for (i = 0; i < sf.length; i++) {
            var s = sf[i];
            if (s.kind !== 'electric' || s.cut) continue;
            var sy0 = clamp(P.y, s.y0, s.y1);
            var sx = G.world.wallX(s.side, sy0);
            d = Math.hypot(sx - P.x, sy0 - P.y);
            if (d < bestD) { bestD = d; best = { kind: 'wire', s: s, x: sx, y: sy0 }; }
        }
        if (best) return best;
        /* Không có mối nguy nào thì tơ đi gom xu — bản thiết kế cho phép, và nó
         * biến lần bắn thừa thành một phần thưởng nhỏ thay vì phí. */
        var pk = G.world.pickups, near = null, nd = R.WEB_RANGE * 0.75;
        for (i = 0; i < pk.length; i++) {
            var p = pk[i];
            if (p.taken || p.y < P.y - 40) continue;
            var px = pickupX(p);
            d = Math.hypot(px - P.x, p.y - P.y);
            if (d < nd) { nd = d; near = { kind: 'loot', p: p, x: px, y: p.y }; }
        }
        return near;
    }

    function fireWeb() {
        if (G.phase !== 'play' || P.web <= 0) {
            if (G.phase === 'play') Sfx.bump();
            return;
        }
        var tgt = bestWebTarget();
        if (!tgt) { Sfx.bump(); return; }
        P.web--;
        G.stats.webs++;
        Sfx.web();
        P.webShot = { x: tgt.x, y: tgt.y, life: 0.22 };

        if (tgt.kind === 'mover') {
            tgt.m.dead = true;
            Sfx.webHit();
            burst(tgt.x, tgt.y, 16, '#ffffff', 190, 'spark');
            var pts = R.SCORE.webKill * mul();
            G.score += pts;
            addCombo(1);
            if (tgt.m.kind === 'drone' || tgt.m.kind === 'bird') G.stats.drones++;
            /* Hạ được một kẻ cản đường đáng giá hơn hẳn bắn rụng cái quạt bay:
             * chúng hiếm hơn, dai hơn, và bắn trúng lúc đang bị dồn thì đó là
             * khoảnh khắc đáng nhớ nhất của cả lượt chơi. */
            if (tgt.m.kind === 'thug' || tgt.m.kind === 'rival' || tgt.m.kind === 'sentry') {
                G.stats.foes++;
                var extra = R.SCORE.webKill * 2 * mul();
                G.score += extra;
                pts += extra;
                addCombo(2);
                G.shake = Math.max(G.shake, 7);
                burst(tgt.x, tgt.y, 22, '#ffd75e', 240, 'spark');
            }
            pop(tgt.x, tgt.y - 20, '+' + Math.round(pts), '#ffe27a');
        } else if (tgt.kind === 'wire') {
            tgt.s.cut = true;
            Sfx.webHit();
            burst(tgt.x, tgt.y, 18, '#8ef0ff', 200, 'spark');
            G.score += R.SCORE.webKill * mul();
            addCombo(1);
            pop(tgt.x, tgt.y - 20, 'CUT!', '#8ef0ff');
        } else {
            /* Kéo cả chùm xu quanh chỗ ấy về, không chỉ một đồng */
            var got = 0, pk = G.world.pickups;
            for (var i = 0; i < pk.length; i++) {
                var p = pk[i];
                if (p.taken) continue;
                if (Math.hypot(pickupX(p) - tgt.x, p.y - tgt.y) < 110) { collect(p); got++; }
            }
            if (!got) collect(tgt.p);
        }
    }

    function mul() {
        return R.comboMul(G.combo) * (G.power.x2 > 0 ? 2 : 1);
    }

    /* ========================================================================
     *  8. VỊ TRÍ MỐI NGUY & VA CHẠM
     * ------------------------------------------------------------------------
     *  Mọi mối nguy tuần hoàn suy vị trí từ MỘT đồng hồ G.hz. Nhờ vậy vật phẩm
     *  "chậm thời gian" chỉ cần làm đồng hồ ấy chạy chậm lại là mọi thứ chậm
     *  theo, khỏi phải sửa từng loại.
     * ======================================================================*/

    function gapEdges(y) {
        var g = G.world.gapAt(y);
        return { l: (W - g) / 2, r: (W + g) / 2, g: g };
    }

    function pickupX(p) {
        var e = gapEdges(p.y);
        return e.l + p.ax * (e.r - e.l);
    }

    /* Vị trí và bán kính đụng của một mối nguy ở thời điểm hiện tại. */
    function moverPos(m) {
        if (m.dead) return null;
        var e, ph;
        if (m.kind === 'drone' || m.kind === 'bird') {
            e = gapEdges(m.y);
            ph = (G.hz / m.period + m.phase) * Math.PI * 2;
            var mid = (e.l + e.r) / 2, half = (e.r - e.l) / 2 * m.span;
            return { x: mid + Math.sin(ph) * half, y: m.y + Math.cos(ph * 2) * 8, r: m.kind === 'bird' ? 13 : 17 };
        }
        if (m.kind === 'loose') {
            e = gapEdges(m.y);
            return { x: e.l + m.ax * (e.r - e.l), y: m.y, r: 19 };
        }
        if (m.kind === 'debris') {
            e = gapEdges(m.y0);
            var f = ((G.hz / m.period) + m.phase) % 1;
            return { x: e.l + m.ax * (e.r - e.l), y: m.y1 - f * (m.y1 - m.y0), r: 15 };
        }
        if (m.kind === 'swing') {
            /* Biển quảng cáo treo trên một cái tay đòn chìa ra khe, đu qua đu
             * lại BÊN DƯỚI chỗ treo.
             *
             * Hai chỗ phải cẩn thận. Một: bản đầu em viết lộn hàm lượng giác
             * nên quả biển có lúc nằm cao hơn chính chỗ nó treo — sai kiểu chỉ
             * lộ ra khi nhìn nó động đậy. Hai: quãng đu phải đo bằng ax chứ
             * không bằng điểm ảnh, vì khe có lúc hẹp còn 190. Đo bằng điểm ảnh
             * thì ở khe hẹp cái biển quét sát mặt tường và giết người đang bám
             * leo — mà leo là tự động, họ không tránh vào đâu được. */
            e = gapEdges(m.y);
            ph = Math.sin((G.hz / m.period + m.phase) * Math.PI * 2);
            var dir = m.side === SIDE_L ? 1 : -1;
            var ax = (m.side === SIDE_L ? 0.46 : 0.54) + dir * ph * 0.16;
            return {
                x: e.l + ax * (e.r - e.l),
                y: m.y - m.len * (0.72 + 0.28 * Math.cos(ph * 1.2)),
                r: 20
            };
        }
        if (m.kind === 'platform') {
            var f2 = 0.5 - 0.5 * Math.cos((G.hz / m.period + m.phase) * Math.PI * 2);
            var py = m.y0 + f2 * (m.y1 - m.y0);
            var px = G.world.wallX(m.side, py) + (m.side === SIDE_L ? 22 : -22);
            return { x: px, y: py, r: 26 };
        }
        if (m.kind === 'laser') {
            e = gapEdges(m.y);
            return { x: (e.l + e.r) / 2, y: m.y, r: 0 };
        }
        if (m.kind === 'thug') {
            /* Chỉ CÓ MẶT lúc đã thò hẳn ra. Lúc còn trong nhà thì hắn không
             * phải là mối nguy, mà cũng không được là mục tiêu cho tơ — bắn
             * xuyên tường vào một cái cửa sổ đóng thì vô lý. */
            if (thugPhase(m) !== 'out') return null;
            var tx = G.world.wallX(m.side, m.y + R.THUG_H / 2);
            return { x: tx + (m.side === SIDE_L ? 17 : -17), y: m.y + R.THUG_H / 2, r: 16 };
        }
        if (m.kind === 'rival') {
            var rx = G.world.wallX(m.side, m.ry);
            return { x: rx + (m.side === SIDE_L ? R.PLAYER_R : -R.PLAYER_R), y: m.ry, r: 19 };
        }
        if (m.kind === 'sentry') {
            var sx = G.world.wallX(m.side, m.y);
            return { x: sx + (m.side === SIDE_L ? 18 : -18), y: m.y, r: 18 };
        }
        return null;
    }

    /* Gã cửa sổ đang ở pha nào: 'in' | 'warn' | 'out' */
    function thugPhase(m) {
        var t = (((G.hz / m.period) + m.phase) % 1) * m.period;
        if (t < m.period - m.warn - m.out) return 'in';
        if (t < m.period - m.out) return 'warn';
        return 'out';
    }

    /* Chỗ này có gã nào đang chắn không. Tách riêng khỏi world.canCling() vì
     * rules.js cố ý không biết gì về đồng hồ — nó lo hình dạng của màn, còn
     * chuyện lúc này ai đang thò ra là việc của phần chơi. */
    function thugAt(side, y) {
        var mv = G.world.movers;
        for (var i = 0; i < mv.length; i++) {
            var m = mv[i];
            if (m.kind !== 'thug' || m.dead || m.side !== side) continue;
            if (thugPhase(m) === 'out' && y >= m.y - 6 && y <= m.y + R.THUG_H + 6) return m;
        }
        return null;
    }

    /* Bám được ở đây không, tính cả gã đang thò ra. */
    function spotFree(side, y) {
        return G.world.canCling(side, y) && !thugAt(side, y);
    }

    /* ------------------------------------------------------------------
     *  Mấy đứa có TRÍ NHỚ
     *
     *  Máy bay, chim, laser đều suy vị trí thẳng từ đồng hồ — không nhớ gì cả,
     *  nên dọn rác hay tua lại đều không sao. Nhưng đối thủ thì phải nhớ hắn
     *  đang ở đâu và đã dùng lượt nhảy chưa, còn rô-bốt gác phải nhớ đã ngắm
     *  vào đâu. Hai đứa ấy bước theo dt ở đây, và dt đã nhân sẵn hệ số chậm
     *  của đồng hồ cát nên vật phẩm ấy vẫn ăn vào chúng như mọi thứ khác.
     * ------------------------------------------------------------------ */
    function stepMovers(dt) {
        var mv = G.world.movers, i, m;
        for (i = 0; i < mv.length; i++) {
            m = mv[i];
            if (m.dead) continue;

            if (m.kind === 'rival') {
                m.ry -= m.speed * dt;
                if (m.ry < G.camY - H - 120) { m.dead = true; continue; }

                /* Mình đổi tường thì hắn nhảy theo — nhưng rùn người trước đã,
                 * và chỉ được đúng một lần. */
                var near = Math.abs(m.ry - P.y) < 320;
                if (near && m.jumps > 0 && P.side !== m.side && P.state === 'cling') {
                    m.windup += dt;
                    if (m.windup >= R.RIVAL_WINDUP) {
                        m.side = 1 - m.side;
                        m.jumps--;
                        m.windup = 0;
                        Sfx.jump();
                        burst(moverPos(m).x, m.ry, 10, '#c08bff', 160, 'dust');
                    }
                } else m.windup = 0;

            } else if (m.kind === 'sentry') {
                m.t += dt;
                if (m.t >= m.period) {
                    m.t -= m.period;
                    /* Hết quãng ngắm là bắn, theo đúng độ cao đã khoá */
                    var sp = moverPos(m);
                    if (sp && m.aimY != null && Math.abs(m.aimY - P.y) < H) {
                        m.shot = {
                            x: sp.x, y: m.aimY,
                            vx: (m.side === SIDE_L ? 1 : -1) * R.SHOT_SPEED,
                            life: R.SHOT_LIVE
                        };
                        Sfx.laserFire();
                    }
                }
                /* KHOÁ độ cao ngay khi bắt đầu ngắm, rồi giữ nguyên tới lúc bắn.
                 *
                 * Bản đầu em cho chấm đỏ bám theo người chơi suốt quãng ngắm —
                 * nghe thì "thông minh" hơn, nhưng như thế viên đạn luôn trúng
                 * dù chạy đằng nào, và cả con rô-bốt thành ra một cái thuế đánh
                 * vào thời gian chứ không phải một mối nguy né được. Khoá lại
                 * thì "đừng đứng yên" mới là câu trả lời đúng, và đó chính là
                 * điều nó nên dạy người chơi. */
                var inCharge = m.t > m.period - m.charge;
                if (inCharge && !m.charging) {
                    m.charging = 1;
                    m.aimY = P.y;
                    if (Math.abs(m.y - P.y) < 460) Sfx.laserCharge();
                }
                if (!inCharge) m.charging = 0;

                if (m.shot) {
                    m.shot.x += m.shot.vx * dt;
                    m.shot.life -= dt;
                    var ge = gapEdges(m.shot.y);
                    if (m.shot.life <= 0 || m.shot.x < ge.l - 20 || m.shot.x > ge.r + 20) m.shot = null;
                }
            }
        }
    }

    /* Tia laser đang ở pha nào: 'off' | 'charge' | 'fire' */
    function laserPhase(m) {
        var t = ((G.hz / m.period) + m.phase) % 1;
        var tt = t * m.period;
        if (tt < m.charge) return 'charge';
        if (tt < m.charge + m.fire) return 'fire';
        return 'off';
    }

    function collect(p) {
        if (p.taken) return;
        p.taken = true;
        var px = pickupX(p);
        if (p.type === 'coin') {
            G.coins++; G.stats.coins++;
            G.score += R.SCORE.coin * mul();
            addCombo(1);
            Sfx.coin(G.combo);
            burst(px, p.y, 5, '#ffd75e', 90);
        } else if (p.type === 'gem') {
            G.gems++; G.stats.gems++;
            G.score += R.SCORE.gem * mul();
            addCombo(2);
            Sfx.gem();
            burst(px, p.y, 12, '#7ef0ff', 150, 'spark');
            pop(px, p.y - 22, '+' + R.SCORE.gem, '#7ef0ff');
        } else if (p.type === 'web') {
            P.web = Math.min(R.WEB_MAX, P.web + 2);
            G.stats.powers++;
            Sfx.power();
            pop(px, p.y - 22, 'WEB +2', '#ffffff');
        } else {
            G.power[p.type] = p.type === 'shield' ? 1 : (p.type === 'x2' ? 10 : (p.type === 'slow' ? 5 : 8));
            G.stats.powers++;
            Sfx.power();
            pop(px, p.y - 22, p.type.toUpperCase(), '#b9ffb0');
            burst(px, p.y, 10, '#b9ffb0', 130, 'spark');
        }
    }

    /* ========================================================================
     *  CẬP NHẬT
     * ======================================================================*/

    function update(dt) {
        G.t += dt;
        G.hz += dt * (G.power.slow > 0 ? 0.42 : 1);

        if (G.freeze > 0) { G.freeze -= dt; dt = Math.min(dt, 0.004); }

        var w = G.world;
        var m = metresNow();
        var d = R.difficulty(m);
        /* Tính một lần cho cả khung hình: lúc bay cũng cần biết có đang giữ
         * nút leo nhanh không, để tốc độ lên cao không đổi giữa chừng. */
        var fastNow = P.fastKey || P.fastTouch || P.boost > 0;

        /* ---- vật phẩm tạm thời ---- */
        ['magnet', 'x2', 'slow'].forEach(function (k) {
            if (G.power[k] > 0) G.power[k] = Math.max(0, G.power[k] - dt);
        });

        /* ---- tơ nạp lại ---- */
        if (P.web < R.WEB_MAX) {
            P.webT += dt;
            if (P.webT >= R.WEB_RECHARGE) { P.webT = 0; P.web++; }
        } else P.webT = 0;
        if (P.webShot) { P.webShot.life -= dt; if (P.webShot.life <= 0) P.webShot = null; }
        if (P.catchFail > 0) P.catchFail -= dt;
        if (P.invuln > 0) P.invuln -= dt;
        if (P.boost > 0) P.boost -= dt;

        /* ---- người chơi ---- */
        var wind = w.windAt(P.y);
        if (wind && G.gustSeen !== wind) {
            G.gustSeen = wind;
            G.stats.gusts++;
            Sfx.gust();
        }

        if (P.state === 'cling') {
            /* Leo nhanh đến từ hai nguồn và cùng một hệ số: người chơi tự
             * giữ phím, hoặc quãng thưởng ngắn sau một cú bắt tường đẹp. */
            var fast = fastNow;
            var speed = d.climb * (fast ? R.CLIMB_BOOST : 1) * (G.power.slow > 0 ? 0.82 : 1);
            var surf = w.surfaceAt(P.side, P.y);
            if (surf && surf.kind === 'glass') {
                /* Leo qua kính nhanh như tường thường — cái phải trả không phải
                 * tốc độ mà là HẠN CHÓT: mép trên ô kính. Bò tới sát mép là cả
                 * tấm vỡ. */
                if (P.glassOn !== surf) { P.glassOn = surf; P.glassT = 0; }
                P.glassT += dt;
                var toTop = surf.y1 - P.y;
                /* surf.warn để phần vẽ biết rạn tới đâu — 0 là còn lành, 1 là
                 * sắp vỡ. Vết rạn lan ra chính là lời báo trước. */
                surf.warn = clamp(1 - toTop / R.GLASS_WARN, 0, 1);
                if (surf.warn > 0) {
                    if (Math.random() < dt * (6 + surf.warn * 26)) {
                        addPart(P.x, P.y + 8, (Math.random() - 0.5) * 60, -70,
                            0.35, 'rgba(210,245,255,0.9)', 2, 'dot');
                    }
                    if (Math.random() < dt * (2 + surf.warn * 9)) Sfx.glassTick();
                }
                /* Ân huệ ngắn tính từ lúc VỪA BÁM VÀO: nhảy trúng ô kính sát
                 * mép trên thì vẫn phải có một nhịp để phản ứng, chứ vỡ ngay
                 * lúc chạm tay là chết mà không kịp làm gì. */
                if (toTop <= 10 && P.glassT > R.GLASS_GRACE) {
                    surf.dead = true;
                    P.glassOn = null;
                    Sfx.glassBreak();
                    burst(P.x, P.y, 22, 'rgba(200,240,255,0.95)', 240, 'spark');
                    bumpOff('GLASS!');
                }
            } else if (surf && surf.kind === 'cracked') {
                P.crack += dt;
                if (P.crack > R.CRACK_HOLD) {
                    surf.dead = true;
                    G.stats.cracks++;
                    bumpOff('CRACK!');
                    burst(P.x, P.y, 16, '#d8c9a8', 180, 'dust');
                }
            } else { P.crack = 0; P.glassOn = null; }

            P.y += speed * dt;
            P.anim += dt * (speed > 0 ? 7 : 3) * (fast ? 1.6 : 1);
            /* Một tiếng bám tay cho mỗi STEP_PX leo được — nhịp theo quãng
             * đường, không theo đồng hồ, nên nó tự khớp với dáng bò và tự dồn
             * lên khi leo nhanh. */
            P.stepPhase += Math.abs(speed) * dt;
            if (P.stepPhase >= STEP_PX) {
                P.stepPhase -= STEP_PX;
                P.stepRight = !P.stepRight;
                Sfx.step(P.stepRight);
            }
            /* Vệt gió tuôn xuống sau lưng. Không có nó thì "đang leo nhanh" chỉ
             * là một con số thay đổi ở đâu đó — mà người chơi đang nhìn lên
             * phía trước tìm vật cản, không nhìn bảng điểm. */
            if (fast && Math.random() < dt * 30) {
                addPart(P.x + (Math.random() - 0.5) * 22, P.y - 6,
                    (Math.random() - 0.5) * 20, -260, 0.28, 'rgba(255,255,255,0.55)', 2, 'dust');
            }

            /* Đầu chạm vật cản hoặc dây điện phía trên ⇒ bật ra */
            var ahead = P.y + R.PLAYER_R;
            if (w.blockerAt(P.side, ahead) || thugAt(P.side, ahead)) {
                bumpOff('BLOCKED');
            } else {
                var up = w.surfaceAt(P.side, ahead);
                if (up && up.kind === 'electric' && !up.cut) {
                    Sfx.shock();
                    burst(P.x, P.y + 10, 14, '#9fe8ff', 200, 'spark');
                    bumpOff('ZAP!');
                }
            }
            P.x = wallHold(P.side, P.y);
            P.face = P.side === SIDE_L ? 1 : -1;

        } else if (P.state === 'jump') {
            /* ĐANG BAY THÌ VẪN ĐI LÊN ĐÚNG TỐC ĐỘ ĐANG LEO.
             *
             * Anh Hiếu nói đúng: bản trước cú nhảy chịu trọng lực như một vật
             * ném xiên, nên trong 0,34 giây bay ngang, người nhện chỉ lên được
             * chừng 24 điểm ảnh trong khi bám tường leo thì được 68 — và đoạn
             * cuối cú bay còn đang TỤT xuống. Máy quay bám theo độ cao ấy, nên
             * mỗi lần nhảy là cả màn hình khựng một nhịp.
             *
             * Chỗ sai không nằm ở con số nào cả, mà ở chỗ để cú nhảy quyết định
             * độ cao. Nhảy là chuyện ĐI NGANG — đổi tường. Đi lên là việc khác,
             * và nó phải chạy liên tục không đứt đoạn thì máy quay mới trôi
             * mượt. Nay hai việc tách hẳn: bay ngang theo vx, còn lên cao vẫn
             * đúng tốc độ leo, y như lúc đang bám tường.
             *
             * Cái vòng cung của cú nhảy không mất — nó chuyển thành phần VẼ
             * (xem P.arc), lệch nhiều nhất mười mấy điểm ảnh, đủ để mắt thấy
             * một cú bay chứ không phải một cú trượt ngang. */
            if (wind) P.vx += wind.dir * wind.str * dt;
            P.x += P.vx * dt;
            P.y += d.climb * (fastNow ? R.CLIMB_BOOST : 1) * (G.power.slow > 0 ? 0.82 : 1) * dt;
            P.flight += dt;
            P.anim += dt * 10;

            var target = P.vx > 0 ? SIDE_R : SIDE_L;
            var face = w.wallX(target, P.y);
            var reached = target === SIDE_R ? (P.x + R.PLAYER_R >= face) : (P.x - R.PLAYER_R <= face);
            if (reached) {
                if (spotFree(target, P.y)) {
                    P.side = target;
                    P.state = 'cling';
                    P.x = wallHold(target, P.y);
                    P.vx = 0; P.vy = 0; P.crack = 0;
                    /* Thưởng cho cú bắt tường đẹp. Rút từ 0,75 xuống 0,45 giây kể
                     * từ khi cú nhảy thôi ăn mất độ cao: nhảy đã không còn phải
                     * trả giá gì, thưởng dài nữa thì cách chơi tối ưu thành nhảy
                     * loạn xạ, mà thế là mất luôn phần CHỌN ĐƯỜNG. */
                    P.boost = 0.45;
                    addCombo(1);
                    G.score += R.SCORE.cleanJump * mul();
                    Sfx.land();
                    burst(P.x, P.y, 8, 'rgba(255,255,255,0.75)', 110, 'dust');
                    if (G.combo > 0 && G.combo % 5 === 0) {
                        pop(P.x, P.y - 30, 'COMBO x' + R.comboMul(G.combo), '#ffe27a');
                    }
                } else {
                    P.x = target === SIDE_R ? face - R.PLAYER_R : face + R.PLAYER_R;
                    bumpOff('NO GRIP');
                }
            }
            /* Bay quá lâu mà chưa chạm tường nào — gió ngược đủ mạnh thì đẩy
             * ngược lại được. Trước chốt bằng vận tốc rơi, nay không còn trọng
             * lực trong cú nhảy nữa nên phải chốt bằng thời gian. */
            if (P.flight > 1.3) P.state = 'fall';

        } else if (P.state === 'fall') {
            if (wind) P.vx += wind.dir * wind.str * dt * 0.6;
            P.vy = Math.max(-R.FALL_MAX_V, P.vy - R.FALL_GRAVITY * dt);
            P.y += P.vy * dt;
            P.x += P.vx * dt;
            /* trôi nhẹ về giữa khe để không dính lì vào mặt tường */
            var e = gapEdges(P.y);
            var mid = (e.l + e.r) / 2;
            P.vx += (P.x < mid ? 1 : -1) * R.FALL_DRIFT * dt;
            P.x = clamp(P.x, e.l + R.PLAYER_R * 0.4, e.r - R.PLAYER_R * 0.4);
            P.anim += dt * 6;
            if (Math.random() < dt * 20) {
                addPart(P.x, P.y, (Math.random() - 0.5) * 30, 120, 0.35, 'rgba(255,255,255,0.5)', 2);
            }
        }

        if (P.y > G.maxY) {
            var gained = (P.y - G.maxY) / R.PX_PER_M;
            G.maxY = P.y;
            G.score += gained * R.SCORE.perMetre * mul();
        }

        /* Mốc 300 m để so kỷ lục leo nhanh */
        if (!G.sprint300 && metresNow() >= 300) G.sprint300 = Math.round(G.t * 10) / 10;

        /* ---- máy quay: chỉ đi lên, không bao giờ lùi ---- */
        var want = P.y + H * R.CAM_ANCHOR;
        if (want > G.camY) G.camY += (want - G.camY) * Math.min(1, dt * 7);
        if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 34);
        if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);

        /* Rơi khỏi đáy màn hình ⇒ mất một mạng */
        if (P.y < G.camY - H - 30) { loseLife('You fell!'); }

        /* ---- sinh thêm màn và dọn phần đã trôi ---- */
        w.ensure(G.camY + H * 0.6);
        if (Math.random() < dt * 2) w.prune(G.camY - H * 1.8);

        /* ---- đổi vùng ---- */
        var zi = R.zoneIndexAt(metresNow());
        if (zi !== G.zone) {
            G.zone = zi;
            G.zoneBannerT = 2.4;
            G.score += R.SCORE.zone * mul();
            Sfx.zone();
            el('zone-banner').innerHTML = '<span>' + R.ZONES[zi].icon + '</span> ' + R.ZONES[zi].name;
            el('zone-banner').classList.add('show');
        }
        if (G.zoneBannerT > 0) {
            G.zoneBannerT -= dt;
            if (G.zoneBannerT <= 0) el('zone-banner').classList.remove('show');
        }

        stepStorm(dt, d);

        stepMovers(dt * (G.power.slow > 0 ? 0.42 : 1));
        /* Nền gió đổi theo việc đang làm: bám tường thì chỉ là hơi thở của thành
         * phố, bò nhanh thì rít lên, còn rơi thì ù hẳn — và đó cũng chính là
         * TIẾNG BÁO RƠI mà bản thiết kế đòi, khỏi cần thêm tiếng nào nữa. */
        var high = R.curve(metresNow(), 4000);
        if (P.state === 'fall') {
            var vv = Math.min(1, Math.abs(P.vy) / R.FALL_MAX_V);
            Sfx.ambient(0.05 + 0.10 * vv, 700 + 900 * vv);
        } else if (P.state === 'jump') {
            Sfx.ambient(0.035, 620);
        } else {
            Sfx.ambient(0.012 + 0.022 * (fastNow ? 1 : 0) + 0.012 * high, 330 + 160 * high);
        }

        collide(dt);
        stepParticles(dt);
        syncHud(false);
    }

    /* ========================================================================
     *  CƠN GIÔNG
     * ------------------------------------------------------------------------
     *  Hai thứ khác hẳn nhau, cố ý để chung một chỗ vì chúng kể chung một câu
     *  chuyện: chớp xa ngoài chân trời chỉ để nhìn, còn tia giáng xuống người
     *  nhện thì phải né. Cái thứ nhất làm cái thứ hai đáng tin — mắt đã quen
     *  thấy sét loé ngoài xa rồi thì lúc nó nhắm vào mình, người chơi hiểu
     *  ngay chuyện gì đang tới.
     * ======================================================================*/
    function stepStorm(dt, d) {
        var stormy = R.ZONES[G.zone].weather === 'rain';

        /* ---- chớp xa: chỉ có hình và tiếng ---- */
        if (stormy) {
            G.farBoltT -= dt;
            if (G.farBoltT <= 0) {
                G.farBoltT = 2.2 + Math.random() * 4.5;
                G.farBolt = { life: 0.5, x: 40 + Math.random() * (W - 80), seed: Math.random() * 1000 };
                G.flash = 0.4;
                Sfx.thunder();
            }
        }
        if (G.farBolt) {
            G.farBolt.life -= dt;
            if (G.farBolt.life <= 0) G.farBolt = null;
        }

        if (!stormy) { G.bolt = null; return; }

        /* ---- tia nhắm vào người nhện ---- */
        if (!G.bolt) {
            G.boltT -= dt;
            /* Không giáng lúc người chơi đang rơi hay vừa hồi sinh: lúc ấy họ
             * đã trả giá rồi, đánh thêm chỉ là dồn người ta vào chân tường. */
            if (G.boltT <= 0 && P.state === 'cling' && P.invuln <= 0) {
                var fastNow2 = P.fastKey || P.fastTouch || P.boost > 0;
                var sp = d.climb * (fastNow2 ? R.CLIMB_BOOST : 1);
                G.bolt = {
                    t: 0,
                    side: P.side,
                    /* nhắm vào chỗ SẼ tới nếu cứ leo đều như thế */
                    y: P.y + sp * R.BOLT_WARN,
                    seed: Math.random() * 1000,
                    done: false
                };
                Sfx.boltCharge();
            }
        } else {
            var b = G.bolt;
            b.t += dt;
            if (b.t > R.BOLT_WARN && !b.done) {
                b.done = true;
                var bx = G.world.wallX(b.side, b.y) + (b.side === SIDE_L ? 20 : -20);
                G.flash = 0.85;
                G.shake = Math.max(G.shake, 16);
                Sfx.boltStrike();
                burst(bx, b.y, 26, '#dff2ff', 300, 'spark');
                if (Math.hypot(bx - P.x, b.y - P.y) < R.BOLT_R + R.PLAYER_R * 0.5) {
                    if (G.power.shield > 0) {
                        G.power.shield = 0;
                        P.invuln = 1.4;
                        pop(P.x, P.y - 26, 'SHIELD!', '#8ef0ff');
                    } else if (P.invuln <= 0 && P.state !== 'fall') {
                        /* Không giết ngay — hất văng khỏi tường. Rơi vẫn cứu
                         * được bằng tơ, nên cái mất là độ cao với chuỗi liên
                         * hoàn. Sét mà giết luôn thì vùng này thành ra thi xem
                         * ai may, chứ không phải ai né giỏi.
                         *
                         * Và ĐANG RƠI thì tha. Không phải vì luật vật lý — tia
                         * sét thì cần gì biết ai đang rơi — mà vì đánh người
                         * vừa ngã là dồn người ta vào chân tường: mất tường,
                         * mất độ cao, rồi mất thêm một cú hất nữa. Cùng lý do
                         * mà tia không bao giờ khởi động lúc người chơi đang
                         * rơi, chỉ là ở đầu bên kia của một giây rưỡi. */
                        bumpOff('LIGHTNING!');
                        P.vy = -280;
                        G.deaths['zap'] = (G.deaths['zap'] || 0) + 1;
                    }
                }
            }
            if (b.t > R.BOLT_WARN + R.BOLT_HIT) {
                G.bolt = null;
                G.boltT = R.BOLT_GAP_MIN + Math.random() * (R.BOLT_GAP_MAX - R.BOLT_GAP_MIN);
            }
        }
    }

    /* Một đường sét gãy khúc từ (x0,y0) xuống (x1,y1). Dùng chung cho cả chớp
     * xa lẫn tia giáng, chỉ khác bề dày và độ lệch. */
    function boltPath(x0, y0, x1, y1, seg, spread, seed) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        for (var i = 1; i < seg; i++) {
            var t = i / seg;
            var jx = (hash2(Math.round(seed) + i, i * 13) - 0.5) * spread;
            ctx.lineTo(x0 + (x1 - x0) * t + jx, y0 + (y1 - y0) * t);
        }
        ctx.lineTo(x1, y1);
        ctx.stroke();
    }

    function drawStorm() {
        /* chớp xa — vẽ sau hàng nhà nền, nên nó nằm phía sau hai toà tháp */
        if (G.farBolt) {
            var a = clamp(G.farBolt.life / 0.5, 0, 1);
            ctx.save();
            ctx.globalAlpha = a * 0.85;
            ctx.strokeStyle = '#dff2ff';
            ctx.lineWidth = 2.5;
            boltPath(G.farBolt.x, 0, G.farBolt.x + 40, H * 0.68, 9, 46, G.farBolt.seed);
            ctx.globalAlpha = a * 0.3;
            ctx.lineWidth = 8;
            boltPath(G.farBolt.x, 0, G.farBolt.x + 40, H * 0.68, 9, 46, G.farBolt.seed);
            ctx.restore();
        }
    }

    /* Tia nhắm vào người nhện. Vẽ SAU hai toà tháp và sau người nhện, vì nó
     * phải là thứ nổi nhất trên màn lúc ấy. */
    function drawBolt() {
        var b = G.bolt;
        if (!b) return;
        var bx = G.world.wallX(b.side, b.y) + (b.side === SIDE_L ? 20 : -20);
        var by = sy(b.y);
        if (by < -200 || by > H + 200) return;

        if (b.t <= R.BOLT_WARN) {
            /* BÁO TRƯỚC. Vòng sáng co dần vào đúng chỗ sắp bị đánh, cộng một
             * vạch dẫn từ trên trời xuống — nhìn một cái là biết nó nhắm đâu,
             * và biết mình còn bao lâu. */
            var k = b.t / R.BOLT_WARN;
            ctx.save();
            ctx.globalAlpha = 0.35 + 0.45 * Math.abs(Math.sin(G.t * 26));
            ctx.strokeStyle = '#8fe4ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 10]);
            ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, by); ctx.stroke();
            ctx.setLineDash([]);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(bx, by, R.BOLT_R * (1.9 - 0.9 * k), 0, 6.284);
            ctx.stroke();
            ctx.globalAlpha = 0.22 + 0.3 * k;
            ctx.fillStyle = '#8fe4ff';
            ctx.beginPath(); ctx.arc(bx, by, R.BOLT_R * 0.5, 0, 6.284); ctx.fill();
            ctx.restore();
            if (Math.random() < 0.3) {
                addPart(bx + (Math.random() - 0.5) * 60, b.y + (Math.random() - 0.5) * 60,
                    0, 60, 0.3, '#bfeaff', 2, 'spark');
            }
        } else {
            /* GIÁNG XUỐNG */
            var a2 = clamp(1 - (b.t - R.BOLT_WARN) / R.BOLT_HIT, 0, 1);
            ctx.save();
            ctx.globalAlpha = a2;
            ctx.strokeStyle = 'rgba(150,220,255,0.8)';
            ctx.lineWidth = 20;
            boltPath(bx - 10, 0, bx, by, 11, 60, b.seed);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 7;
            boltPath(bx - 10, 0, bx, by, 11, 60, b.seed);
            ctx.restore();
        }
    }

    function collide(dt) {
        var w = G.world, i;

        /* ---- vật phẩm ---- */
        var magnet = G.power.magnet > 0 ? 150 : 30;
        for (i = 0; i < w.pickups.length; i++) {
            var p = w.pickups[i];
            if (p.taken) continue;
            if (Math.abs(p.y - P.y) > 220) continue;
            var px = pickupX(p);
            var dd = Math.hypot(px - P.x, p.y - P.y);
            if (dd < R.PLAYER_R + 14) { collect(p); continue; }
            if (dd < magnet && G.power.magnet > 0) {
                /* Nam châm kéo xu chứ không nhặt hộ — nhìn thấy chúng bay lại
                 * mới sướng, biến mất đánh cái là mất hết cảm giác. */
                var k = Math.min(1, dt * 5);
                var e = gapEdges(p.y);
                p.ax += ((P.x - px) / Math.max(1, e.r - e.l)) * k * 2.2;
                p.ax = clamp(p.ax, 0.03, 0.97);
                p.y += (P.y - p.y) * k;
            }
        }

        /* ---- mối nguy ---- */
        for (i = 0; i < w.movers.length; i++) {
            var m = w.movers[i];
            if (m.dead) continue;

            if (m.kind === 'laser') {
                var ph = laserPhase(m);
                if (!m.sang && ph === 'charge' && Math.abs(m.y - P.y) < 420) { m.sang = 1; Sfx.laserCharge(); }
                if (ph !== 'charge') m.sang = 0;
                if (ph === 'fire') {
                    if (!m.fired) { m.fired = 1; if (Math.abs(m.y - P.y) < 460) Sfx.laserFire(); }
                    if (Math.abs(P.y - m.y) < 13 + R.PLAYER_R * 0.5) loseLife('Laser!');
                } else m.fired = 0;
                if (ph === 'off' && Math.abs(P.y - m.y) < R.NEAR_MISS_PX * 1.4 && !m.near) {
                    m.near = 1; nearMiss(P.x, P.y);
                }
                continue;
            }

            /* Đạn của rô-bốt gác đi riêng: nó là thứ duy nhất trong game bay
             * ngang khe theo đường thẳng, và nó GIẾT chứ không xô. Ngắm gần
             * một giây rồi mới bắn, đạn lại bay chậm, nên trả giá bằng một
             * mạng là công bằng. */
            if (m.kind === 'sentry' && m.shot) {
                if (Math.hypot(m.shot.x - P.x, m.shot.y - P.y) < 12 + R.PLAYER_R * 0.75) {
                    m.shot = null;
                    loseLife('Sentry shot!');
                }
            }

            var pos = moverPos(m);
            if (!pos) continue;
            if (Math.abs(pos.y - P.y) > 240) { m.near = 0; continue; }
            var dist = Math.hypot(pos.x - P.x, pos.y - P.y);
            if (dist < pos.r + R.PLAYER_R * 0.75) {
                if (m.kind === 'thug' || m.kind === 'rival' || m.kind === 'bird') {
                    /* Hai đứa này XÔ chứ không giết. Chúng là kẻ cản đường, và
                     * cản đường thì cái mất phải là độ cao với chuỗi liên hoàn
                     * — mất luôn cả mạng thì mỗi lần gặp là một lần cụt hứng
                     * chứ không phải một lần thót tim. */
                    if (P.state !== 'fall') {
                        bumpOff(m.kind === 'rival' ? 'SHOVED!' :
                            (m.kind === 'bird' ? 'BIRD!' : 'GET BACK!'));
                    }
                } else if (m.kind === 'sentry') {
                    /* thân rô-bốt bắt vào tường, đụng phải thì bật ra */
                    if (P.state === 'cling') bumpOff('WATCH OUT');
                } else if (m.kind === 'platform') {
                    /* Giàn lau kính không giết — nó ĐẨY người chơi ra khỏi
                     * tường. Mối nguy nào cũng chết ngay thì lượt chơi ngắn và
                     * cay, mà bản thiết kế đòi thua phải hiểu được vì sao. */
                    if (P.state === 'cling') bumpOff('WATCH OUT');
                } else {
                    loseLife(m.kind === 'debris' ? 'Falling debris!' : 'Hit!');
                    if (m.hp) m.dead = true;
                }
            } else if (dist < pos.r + R.PLAYER_R + R.NEAR_MISS_PX && !m.near) {
                m.near = 1;
                nearMiss(pos.x, pos.y);
            } else if (dist > pos.r + R.PLAYER_R + R.NEAR_MISS_PX * 1.6) {
                m.near = 0;
            }
        }
    }

    function nearMiss(x, y) {
        if (P.state !== 'jump' && P.state !== 'fall') return;
        G.stats.near++;
        addCombo(1);
        G.score += R.SCORE.nearMiss * mul();
        pop((x + P.x) / 2, (y + P.y) / 2 - 20, 'NEAR MISS', '#ffe27a');
        Sfx.coin(2);
    }

    function stepParticles(dt) {
        for (var i = parts.length - 1; i >= 0; i--) {
            var p = parts[i];
            p.life -= dt;
            if (p.life <= 0) { parts.splice(i, 1); continue; }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.kind !== 'dust') p.vy -= 340 * dt;
            p.vx *= 0.97;
        }
        for (var j = pops.length - 1; j >= 0; j--) {
            pops[j].life -= dt;
            pops[j].y += 46 * dt;
            if (pops[j].life <= 0) pops.splice(j, 1);
        }
    }

    /* ========================================================================
     *  9. VẼ NỀN VÀ TOÀ NHÀ
     * ======================================================================*/

    function sy(y) { return G.camY - y; }

    /* Màu vùng, pha trộn ở 12% cuối mỗi vùng để cảnh đổi dần chứ không nhảy
     * cóc — nhảy cóc thì đúng lúc người chơi đang căng mắt tránh mối nguy, cả
     * màn hình đổi màu một phát, mất dấu hết. */
    function zoneMix() {
        var m = metresNow();
        var i = R.zoneIndexAt(m);
        var z = R.ZONES[i], nz = R.ZONES[Math.min(R.ZONES.length - 1, i + 1)];
        var span = (z.to === Infinity ? 4000 : z.to - z.from);
        var t = clamp((m - z.from) / span, 0, 1);
        var k = t > 0.88 ? (t - 0.88) / 0.12 : 0;
        return { z: z, n: nz, k: k, idx: i };
    }

    function zc(key, i) {
        var zm = zoneMix();
        var a = zm.z[key], b = zm.n[key];
        if (i != null) return mixHex(a[i], b[i], zm.k);
        return mixHex(a, b, zm.k);
    }

    /* Một CON SỐ của vùng, pha trộn ở đoạn giao.
     *
     * Cần riêng hàm này cho tỉ lệ ô cửa sáng đèn, và nó cho ra một hiệu ứng đẹp
     * ngoài dự tính: hàm băm quyết định ô nào sáng là cố định theo toạ độ, nên
     * khi ngưỡng nhích lên trong quãng giao vùng, các ô cửa lần lượt BẬT SÁNG
     * chứ không đổi một loạt. Leo vào ranh giới hoàng hôn – phố đêm thì đúng
     * là nhìn thấy thành phố lên đèn. */
    function zn(key, dflt) {
        var zm = zoneMix();
        var a = zm.z[key] != null ? zm.z[key] : dflt;
        var b = zm.n[key] != null ? zm.n[key] : dflt;
        return a + (b - a) * zm.k;
    }

    function drawSky() {
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, zc('sky', 0));
        g.addColorStop(0.55, zc('sky', 1));
        g.addColorStop(1, zc('sky', 2));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        var zm = zoneMix();
        var idx = zm.idx;

        /* Sao — chỉ ở hai vùng cao nhất, và mờ dần theo độ pha trộn để lúc
         * chuyển vùng chúng hiện ra từ từ */
        if (idx >= 4) {
            var a = idx === 4 ? clamp((metresNow() - 5000) / 700, 0, 1) : 1;
            ctx.save();
            for (var i = 0; i < 70; i++) {
                var hx = hash2(i, 1) * W;
                var hy = ((hash2(i, 2) * 2400 - G.camY * 0.06) % 2400 + 2400) % 2400;
                if (hy > H) continue;
                var tw = 0.4 + 0.6 * Math.abs(Math.sin(G.t * 1.4 + i));
                ctx.globalAlpha = a * tw * 0.9;
                ctx.fillStyle = '#fff';
                ctx.fillRect(hx, hy, 2, 2);
            }
            ctx.restore();
        }

        /* Cực quang ở vùng trời lạ */
        if (idx >= 5) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (var b = 0; b < 3; b++) {
                var grd = ctx.createLinearGradient(0, 0, W, 0);
                grd.addColorStop(0, 'rgba(120,255,220,0)');
                grd.addColorStop(0.5, b % 2 ? 'rgba(255,120,230,0.18)' : 'rgba(110,255,210,0.16)');
                grd.addColorStop(1, 'rgba(120,180,255,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                for (var x = 0; x <= W; x += 18) {
                    var yy = 120 + b * 70 + Math.sin(x * 0.011 + G.t * 0.5 + b) * 34 - G.camY * 0.02 % 200;
                    if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
                }
                for (var x2 = W; x2 >= 0; x2 -= 18) {
                    var yy2 = 200 + b * 70 + Math.sin(x2 * 0.011 + G.t * 0.5 + b) * 34 - G.camY * 0.02 % 200;
                    ctx.lineTo(x2, yy2);
                }
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        /* Quầng sáng đô thị hắt lên từ dưới. Nhỏ thôi, nhưng thiếu nó thì
         * thành phố đêm trông như một tấm bìa đen dán chấm vàng — thứ làm nó
         * ra đêm THẬT là khoảng trời bị đèn dưới đất nhuộm hồng lên. */
        var zmg = zoneMix();
        var glow = (zmg.z.cityLights ? 1 - zmg.k : 0) + (zmg.n.cityLights ? zmg.k : 0);
        if (glow > 0.01) {
            var gg = ctx.createLinearGradient(0, H, 0, H * 0.42);
            gg.addColorStop(0, 'rgba(255,170,90,' + (0.34 * glow) + ')');
            gg.addColorStop(0.5, 'rgba(255,120,180,' + (0.12 * glow) + ')');
            gg.addColorStop(1, 'rgba(255,120,180,0)');
            ctx.fillStyle = gg;
            ctx.fillRect(0, H * 0.42, W, H * 0.58);
        }

        drawSkyBody();
        drawFarSkyline();
        drawTraffic();
        drawSkyLife();
        drawStorm();
        drawClouds();
    }

    /* Hàng nhà xa, trôi chậm hơn hẳn — đây là thứ làm người chơi TIN là mình
     * đang lên cao thật, chứ không phải hai bức tường trượt xuống. */
    /* ========================================================================
     *  NHỮNG THỨ SỐNG TRÊN TRỜI
     * ------------------------------------------------------------------------
     *  Không thứ nào dưới đây đụng vào người chơi, và tất cả đều vẽ SAU LƯNG
     *  hai toà tháp. Đó là điều kiện để chúng được phép tồn tại: bản thiết kế
     *  cấm để đồ trang trí làm chìm mất mối nguy, mà khe giữa hai tháp là chỗ
     *  duy nhất mối nguy đi qua — nên khe phải sạch. Mọi thứ đẹp đẽ ở đây đều
     *  nằm ngoài khe.
     * ======================================================================*/

    /* Mặt trời hay mặt trăng. Trôi CỰC chậm (0,015) — chậm hơn hẳn mọi lớp
     * khác, vì thứ ở xa thật thì gần như đứng yên khi mình leo. Chính chỗ gần
     * như đứng yên ấy nói với mắt rằng nó ở rất xa. */
    function drawSkyBody() {
        var zm = zoneMix();
        var kind = zm.k > 0.5 ? zm.n.body : zm.z.body;
        if (!kind) return;
        /* mờ dần ở quãng giao vùng nếu hai bên khác nhau */
        var a = zm.z.body === zm.n.body ? 1 : (zm.k > 0.5 ? (zm.k - 0.5) * 2 : 1 - zm.k * 2);
        if (a < 0.02) return;

        var bx = W * 0.74;
        var by = 150 - (G.camY * 0.015) % 320;
        if (by < -120) by += 320;

        ctx.save();
        ctx.globalAlpha = a;
        if (kind === 'sun') {
            var g = ctx.createRadialGradient(bx, by, 10, bx, by, 130);
            g.addColorStop(0, 'rgba(255,236,170,0.85)');
            g.addColorStop(0.35, 'rgba(255,196,120,0.28)');
            g.addColorStop(1, 'rgba(255,180,110,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(bx, by, 130, 0, 6.284); ctx.fill();
            ctx.fillStyle = '#fff3c4';
            ctx.beginPath(); ctx.arc(bx, by, 34, 0, 6.284); ctx.fill();
        } else {
            var g2 = ctx.createRadialGradient(bx, by, 12, bx, by, 120);
            g2.addColorStop(0, 'rgba(226,238,255,0.55)');
            g2.addColorStop(0.4, 'rgba(190,215,255,0.16)');
            g2.addColorStop(1, 'rgba(190,215,255,0)');
            ctx.fillStyle = g2;
            ctx.beginPath(); ctx.arc(bx, by, 120, 0, 6.284); ctx.fill();
            ctx.fillStyle = '#eef4ff';
            ctx.beginPath(); ctx.arc(bx, by, 32, 0, 6.284); ctx.fill();
            /* mấy hố trăng — không có thì nó chỉ là một chấm trắng */
            ctx.fillStyle = 'rgba(180,196,225,0.55)';
            ctx.beginPath(); ctx.arc(bx - 10, by - 8, 7, 0, 6.284); ctx.fill();
            ctx.beginPath(); ctx.arc(bx + 9, by + 5, 5, 0, 6.284); ctx.fill();
            ctx.beginPath(); ctx.arc(bx - 2, by + 13, 4, 0, 6.284); ctx.fill();
        }
        ctx.restore();
    }

    /* Một con chim hình chữ V, vẽ bằng hai nét cong. Cánh vỗ theo pha riêng
     * của từng con nên cả đàn không đập cánh cùng nhịp — đàn chim đập cùng
     * nhịp trông như một cái máy. */
    function birdMark(x, y, sz, flap) {
        ctx.beginPath();
        ctx.moveTo(x - sz, y);
        ctx.quadraticCurveTo(x - sz * 0.5, y - sz * flap, x, y);
        ctx.quadraticCurveTo(x + sz * 0.5, y - sz * flap, x + sz, y);
        ctx.stroke();
    }

    /* Đàn chim, máy bay đêm, và pháo hoa. Tất cả suy từ đồng hồ chứ không giữ
     * trạng thái — trừ pháo hoa, thứ duy nhất cần nhớ mình nổ lúc nào. */
    function drawSkyLife() {
        var zm = zoneMix();
        var birds = zn('birds', 0), air = zn('air', 0);

        /* ---- đàn chim ---- */
        if (birds > 0.02) {
            ctx.save();
            ctx.strokeStyle = 'rgba(40,52,70,0.55)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            for (var f = 0; f < 3; f++) {
                /* mỗi đàn có chu kỳ riêng, lệch nhau, nên chúng không bao giờ
                 * bay thành hàng ngang cùng lúc */
                var per = 15 + f * 7;
                var t = ((G.t / per) + hash2(f, 91)) % 1;
                if (t > 0.55) continue;                 // phần lớn thời gian trời trống
                if (hash2(Math.floor(G.t / per) + f, 3) > birds) continue;
                var dir = hash2(f, 5) > 0.5 ? 1 : -1;
                var fx = dir > 0 ? -80 + t / 0.55 * (W + 160) : W + 80 - t / 0.55 * (W + 160);
                var fy = 90 + hash2(f, 7) * 320 - (G.camY * 0.05) % 420;
                if (fy < -60) fy += 420;
                if (fy > H) continue;
                var n = 3 + Math.floor(hash2(f, 11) * 3);
                for (var i = 0; i < n; i++) {
                    var ox = -dir * i * 22 - dir * (i % 2) * 6;
                    var oy = i * 9 + Math.sin(G.t * 1.6 + i) * 3;
                    var sz = 7 + hash2(f, i) * 3;
                    birdMark(fx + ox, fy + oy, sz, 0.5 + 0.5 * Math.sin(G.t * 7 + i * 1.3));
                }
            }
            ctx.restore();
        }

        /* ---- máy bay, chỉ hai đèn nhấp nháy và một thân mảnh ---- */
        if (air > 0.02) {
            var ap = 26;
            var at = ((G.t / ap) + 0.3) % 1;
            if (at < 0.6 && hash2(Math.floor(G.t / ap), 17) < air) {
                var ax = -60 + (at / 0.6) * (W + 120);
                var ay = 60 + hash2(Math.floor(G.t / ap), 23) * 160 - (G.camY * 0.03) % 240;
                if (ay < -40) ay += 240;
                if (ay < H) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(210,225,250,0.5)';
                    ctx.beginPath();
                    ctx.ellipse(ax, ay, 15, 2.6, 0, 0, 6.284);
                    ctx.fill();
                    ctx.fillRect(ax - 2, ay - 6, 4, 12);
                    var blink = Math.sin(G.t * 6) > 0;
                    ctx.fillStyle = blink ? '#ff5a6e' : 'rgba(255,90,110,0.2)';
                    ctx.beginPath(); ctx.arc(ax - 15, ay, 2.4, 0, 6.284); ctx.fill();
                    ctx.fillStyle = blink ? 'rgba(120,255,160,0.25)' : '#78ffa0';
                    ctx.beginPath(); ctx.arc(ax + 15, ay, 2.4, 0, 6.284); ctx.fill();
                    ctx.restore();
                }
            }
        }

        /* ---- pháo hoa trên phố đêm ---- */
        var fw = zn('fw', 0);
        if (fw > 0.3) {
            G.fwT -= 1 / 60;
            if (G.fwT <= 0) {
                G.fwT = 2.2 + Math.random() * 3.5;
                G.fws.push({
                    x: 60 + Math.random() * (W - 120),
                    y: 110 + Math.random() * 260,
                    t: 0,
                    hue: Math.floor(Math.random() * 360),
                    n: 14 + Math.floor(Math.random() * 10)
                });
                if (G.fws.length > 4) G.fws.shift();
            }
        }
        for (var k = G.fws.length - 1; k >= 0; k--) {
            var b = G.fws[k];
            b.t += 1 / 60;
            if (b.t > 1.5) { G.fws.splice(k, 1); continue; }
            var kk = b.t / 1.5;
            ctx.save();
            ctx.globalAlpha = (1 - kk) * 0.75;
            ctx.strokeStyle = 'hsl(' + b.hue + ',95%,70%)';
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            for (var r = 0; r < b.n; r++) {
                var ang = (r / b.n) * 6.284;
                var rad = 8 + kk * 70;
                ctx.beginPath();
                ctx.moveTo(b.x + Math.cos(ang) * rad * 0.72, b.y + Math.sin(ang) * rad * 0.72 + kk * 14);
                ctx.lineTo(b.x + Math.cos(ang) * rad, b.y + Math.sin(ang) * rad + kk * 16);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    /* Đèn xe chạy dưới phố. Chỉ là mấy vệt sáng nhỏ trườn ngang đáy màn, nhưng
     * nó trả lời được câu "dưới kia có gì" — mà leo cao thì câu ấy quan trọng. */
    function drawTraffic() {
        var tr = zn('traffic', 0);
        if (tr < 0.05) return;
        /* chỉ thấy được khi còn thấp; lên cao thì đường phố khuất sau nhà */
        var vis = clamp(1 - metresNow() / 1400, 0, 1) * tr;
        if (vis < 0.04) return;
        var base = H * 0.965 - (G.camY * 0.008) % 40;
        ctx.save();
        ctx.globalAlpha = vis;
        for (var i = 0; i < 10; i++) {
            var dir = i % 2 ? 1 : -1;
            var sp = 40 + hash2(i, 31) * 70;
            var x = ((hash2(i, 33) * W + G.t * sp * dir) % (W + 60) + W + 60) % (W + 60) - 30;
            var y = base + (i % 2) * 9;
            ctx.fillStyle = dir > 0 ? 'rgba(255,226,150,0.9)' : 'rgba(255,90,90,0.85)';
            ctx.fillRect(x, y, 9, 3);
            ctx.globalAlpha = vis * 0.3;
            ctx.fillRect(x - dir * 14, y, 14, 3);
            ctx.globalAlpha = vis;
        }
        ctx.restore();
    }

    function drawFarSkyline() {
        var base = H * 0.72 + (G.camY * 0.055) % 240;
        var zm = zoneMix();
        /* Thành phố xa có sáng đèn không, và sáng tới mức nào. Đi từ 0 lên 1
         * trong quãng giao vùng nên đèn dưới phố cũng lên dần theo bầu trời. */
        var lights = (zm.z.cityLights ? 1 - zm.k : 0) + (zm.n.cityLights ? zm.k : 0);
        ctx.save();
        ctx.fillStyle = zc('far');
        ctx.globalAlpha = 0.55;
        for (var i = -1; i < 14; i++) {
            var hx = ((i * 78) - (G.camY * 0.012) % 78);
            var bw = 44 + hash2(i, 7) * 40;
            var bh = 120 + hash2(i, 8) * 260;
            ctx.fillRect(hx, base - bh, bw, bh + 400);
        }

        /* ĐÈN CỦA THÀNH PHỐ PHÍA DƯỚI.
         *
         * Chỉ là những chấm nhỏ, nhưng chính chúng biến hai hàng khối xám thành
         * một thành phố đang thức. Vẽ sau phần khối và cắt gọn trong lòng từng
         * toà, để đèn không lơ lửng ngoài trời. */
        if (lights > 0.01) {
            ctx.globalAlpha = lights * 0.85;
            for (var j = -1; j < 14; j++) {
                var bx = ((j * 78) - (G.camY * 0.012) % 78);
                var bw2 = 44 + hash2(j, 7) * 40;
                var bh2 = 120 + hash2(j, 8) * 260;
                var top = base - bh2;
                for (var r = 0; r < 26; r++) {
                    var ly = top + 10 + r * 13;
                    if (ly > base + 300) break;
                    /* Bỏ qua hàng nằm ngoài màn. Mỗi toà có 26 hàng × 3 ô, mười
                     * bốn toà là hơn nghìn ô mỗi khung hình — mà quá nửa nằm
                     * ngoài tầm nhìn. Hỏi một câu trước khi vẽ thì rẻ hơn nhiều
                     * so với vẽ rồi để trình duyệt tự cắt. */
                    if (ly < -12 || ly > H + 12) continue;
                    for (var c2 = 0; c2 < 3; c2++) {
                        var hh2 = hash2(j * 71 + r, c2 * 17);
                        if (hh2 > 0.55) continue;
                        /* vài chấm nhấp nháy rất chậm, đủ để thành phố thở */
                        var tw = hh2 < 0.06 ? (0.45 + 0.55 * Math.abs(Math.sin(G.t * 0.9 + j + r))) : 1;
                        ctx.globalAlpha = lights * 0.85 * tw;
                        ctx.fillStyle = hh2 < 0.1 ? '#9fe4ff' : '#ffd98a';
                        ctx.fillRect(bx + 7 + c2 * (bw2 - 20) / 2.4, ly, 4, 5);
                    }
                }
            }
        }
        ctx.restore();
    }

    function drawClouds() {
        var zm = zoneMix();
        var misty = zm.z.weather === 'mist' || zm.n.weather === 'mist';
        ctx.save();
        for (var i = 0; i < 9; i++) {
            var band = 900;
            var wy = ((hash2(i, 3) * band * 6) - G.camY * 0.35) % (band * 6);
            wy = ((wy % (band * 6)) + band * 6) % (band * 6);
            if (wy > H + 160) continue;
            var cx = hash2(i, 4) * (W + 200) - 100 + Math.sin(G.t * 0.12 + i) * 22;
            var s = 0.6 + hash2(i, 5) * 1.1;
            ctx.globalAlpha = misty ? 0.5 : 0.26;
            ctx.fillStyle = '#ffffff';
            puff(cx, wy, 62 * s);
        }
        ctx.restore();
    }

    function puff(x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r * 0.62, 0, 6.284);
        ctx.arc(x + r * 0.55, y + 6, r * 0.48, 0, 6.284);
        ctx.arc(x - r * 0.58, y + 8, r * 0.42, 0, 6.284);
        ctx.arc(x + r * 0.1, y - r * 0.32, r * 0.44, 0, 6.284);
        ctx.fill();
    }

    function drawWeather() {
        var zm = zoneMix();
        var w = zm.z.weather;
        if (w === 'rain' || (zm.n.weather === 'rain' && zm.k > 0.2)) {
            ctx.save();
            ctx.strokeStyle = 'rgba(190,220,255,0.45)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            for (var i = 0; i < 90; i++) {
                var rx = (hash2(i, 11) * W + G.t * 40) % W;
                var ry = ((hash2(i, 12) * H + G.t * 900 + G.camY * 0.6) % H);
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 5, ry + 22);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    /* Hai toà nhà. Mặt trong bám theo đường khe nên tường phình ra thu vào —
     * vẽ bằng đa giác lấy mẫu mỗi 24 điểm ảnh chiều cao. */
    function drawTowers() {
        var i, y, x;
        var top = G.camY, bottom = G.camY - H;
        var faceL = [], faceR = [];
        for (y = top + 40; y >= bottom - 40; y -= 24) {
            faceL.push({ y: y, x: G.world.wallX(SIDE_L, y) });
            faceR.push({ y: y, x: G.world.wallX(SIDE_R, y) });
        }

        var body = zc('tower'), dark = zc('towerDark');

        for (var s = 0; s < 2; s++) {
            var face = s === 0 ? faceL : faceR;
            var edge = s === 0 ? 0 : W;
            ctx.beginPath();
            ctx.moveTo(edge, sy(face[0].y));
            for (i = 0; i < face.length; i++) ctx.lineTo(face[i].x, sy(face[i].y));
            ctx.lineTo(edge, sy(face[face.length - 1].y));
            ctx.closePath();

            var g = ctx.createLinearGradient(s === 0 ? 0 : W, 0, s === 0 ? W / 2 : W / 2, 0);
            g.addColorStop(0, dark);
            g.addColorStop(1, body);
            ctx.fillStyle = g;
            ctx.fill();

            /* Gờ sáng ở mép trong — vạch này là thứ mắt bám vào khi nhảy */
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.34)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (i = 0; i < face.length; i++) {
                if (i === 0) ctx.moveTo(face[i].x, sy(face[i].y));
                else ctx.lineTo(face[i].x, sy(face[i].y));
            }
            ctx.stroke();
            ctx.restore();
        }

        drawWindows();
    }

    function drawWindows() {
        var ROW = 62, on = zc('win'), off = zc('winOff');
        var litRate = zn('winLit', 0.42);
        var zm = zoneMix();
        var neon = zm.z.neon || zm.n.neon || null;
        var neonMix = zm.z.neon ? 1 : zm.k;      // đèn màu hiện dần khi vào vùng
        var y0 = Math.floor((G.camY - H) / ROW) * ROW;
        var y1 = G.camY + ROW;
        ctx.save();
        for (var y = y0; y <= y1; y += ROW) {
            var row = Math.round(y / ROW);
            var syy = sy(y);
            for (var s = 0; s < 2; s++) {
                var side = s === 0 ? SIDE_L : SIDE_R;
                var fx = G.world.wallX(side, y);
                for (var c = 0; c < 3; c++) {
                    var h = hash2(row, c * 31 + s * 977);
                    var lit = h < litRate;
                    var wx = side === SIDE_L ? fx - 34 - c * 32 : fx + 8 + c * 32;
                    if (wx < -30 || wx > W + 30) continue;
                    var col = on;
                    /* Một phần nhỏ ô cửa mang màu đèn neon. Ít thôi — cả toà
                     * nhà bảy sắc cầu vồng thì loè loẹt, mà quan trọng hơn là
                     * mối nguy sẽ chìm nghỉm trong đống màu ấy. */
                    if (lit && neon && h < litRate * 0.16 * neonMix) {
                        col = neon[Math.floor(hash2(row + 7, c + s * 13) * neon.length) % neon.length];
                    }
                    ctx.fillStyle = lit ? col : off;
                    ctx.globalAlpha = lit ? 0.9 : 0.5;
                    ctx.fillRect(wx, syy - 30, 24, 34);
                    if (lit) {
                        ctx.globalAlpha = col === on ? 0.16 : 0.3;
                        ctx.fillRect(wx - 4, syy - 34, 32, 42);
                    }
                }
                /* Đường gờ ngang mỗi tầng */
                ctx.globalAlpha = 0.16;
                ctx.fillStyle = '#000';
                if (side === SIDE_L) ctx.fillRect(0, syy + 5, fx, 3);
                else ctx.fillRect(fx, syy + 5, W - fx, 3);
            }
        }
        ctx.restore();
    }

    /* ========================================================================
     * 10. VẼ VẬT THỂ
     * ======================================================================*/

    function drawSurfaces() {
        var sf = G.world.surfaces;
        for (var i = 0; i < sf.length; i++) {
            var s = sf[i];
            if (s.dead) continue;
            var yA = sy(s.y1), yB = sy(s.y0);
            if (yB < -60 || yA > H + 60) continue;
            var fx = G.world.wallX(s.side, (s.y0 + s.y1) / 2);
            var x = s.side === SIDE_L ? fx - 92 : fx;
            var wdt = 92;
            ctx.save();
            if (s.kind === 'glass') {
                ctx.fillStyle = 'rgba(150,225,255,0.5)';
                ctx.fillRect(x, yA, wdt, yB - yA);
                ctx.strokeStyle = 'rgba(255,255,255,0.75)';
                ctx.lineWidth = 2;
                for (var g = yA; g < yB; g += 26) {
                    ctx.beginPath();
                    ctx.moveTo(x + 6, g + 20); ctx.lineTo(x + wdt - 6, g);
                    ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.strokeRect(x, yA, wdt, yB - yA);

                /* VẠCH HẠN CHÓT ở mép trên. Đây là phần bắt buộc, không phải
                 * trang trí: mối nguy nào cũng phải báo trước, mà hạn chót của
                 * ô kính lại vô hình — không vẽ ra thì nó thành cái bẫy đúng
                 * kiểu bản thiết kế cấm. Sọc chéo vàng đen đọc được từ xa, và
                 * nhìn một cái là biết còn bao nhiêu chỗ để leo. */
                var warnH = Math.min(R.GLASS_WARN, s.y1 - s.y0);
                var wTop = sy(s.y1), wBot = sy(s.y1 - warnH);
                ctx.save();
                ctx.beginPath(); ctx.rect(x, wTop, wdt, wBot - wTop); ctx.clip();
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#f2b616';
                ctx.fillRect(x, wTop, wdt, wBot - wTop);
                ctx.fillStyle = '#22262e';
                for (var d3 = -(wBot - wTop); d3 < wdt + 20; d3 += 22) {
                    ctx.beginPath();
                    ctx.moveTo(x + d3, wTop); ctx.lineTo(x + d3 + 10, wTop);
                    ctx.lineTo(x + d3 + 10 + (wBot - wTop), wBot);
                    ctx.lineTo(x + d3 + (wBot - wTop), wBot);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();

                /* Vết rạn lan ra khi người nhện vào quãng báo động */
                if (s.warn > 0.02) {
                    ctx.save();
                    ctx.globalAlpha = Math.min(1, s.warn * 1.3);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    var cx = x + wdt / 2, cy = sy(s.y1 - warnH * 0.5);
                    for (var r2 = 0; r2 < 9; r2++) {
                        var ang = (r2 / 9) * 6.284 + hash2(Math.round(s.y0), r2) * 0.6;
                        var len = 12 + s.warn * (36 + hash2(r2, 2) * 30);
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(cx + Math.cos(ang) * len * 0.5, cy + Math.sin(ang) * len * 0.5);
                        ctx.lineTo(cx + Math.cos(ang + 0.25) * len, cy + Math.sin(ang + 0.25) * len);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            } else if (s.kind === 'cracked') {
                ctx.fillStyle = 'rgba(210,190,150,0.55)';
                ctx.fillRect(x, yA, wdt, yB - yA);
                ctx.strokeStyle = 'rgba(60,40,20,0.75)';
                ctx.lineWidth = 2;
                for (var k = 0; k < 9; k++) {
                    var cy = yA + hash2(Math.round(s.y0), k) * (yB - yA);
                    ctx.beginPath();
                    ctx.moveTo(x + 8, cy);
                    ctx.lineTo(x + 30 + hash2(k, 3) * 30, cy + 16);
                    ctx.lineTo(x + wdt - 8, cy - 8);
                    ctx.stroke();
                }
            } else if (s.kind === 'electric') {
                var live = !s.cut;
                var flick = live ? (0.55 + 0.45 * Math.abs(Math.sin(G.hz * 9))) : 0.16;
                ctx.strokeStyle = live ? 'rgba(140,230,255,' + flick + ')' : 'rgba(90,90,110,0.5)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                var mx = s.side === SIDE_L ? fx - 16 : fx + 16;
                for (var yy = yA; yy < yB; yy += 12) {
                    var jag = ((yy / 12) | 0) % 2 ? 9 : -9;
                    ctx.lineTo(mx + jag, yy);
                }
                ctx.stroke();
                if (live) {
                    ctx.fillStyle = 'rgba(140,230,255,' + (flick * 0.28) + ')';
                    ctx.fillRect(x, yA, wdt, yB - yA);
                }
                /* Hai cái kẹp giữ dây, để nhìn ra ngay đây là dây điện */
                ctx.fillStyle = '#3b4a5e';
                ctx.fillRect(mx - 9, yA - 6, 18, 10);
                ctx.fillRect(mx - 9, yB - 4, 18, 10);
            }
            ctx.restore();
        }
    }

    function drawBlockers() {
        var bs = G.world.blockers;
        for (var i = 0; i < bs.length; i++) {
            var b = bs[i];
            var yA = sy(b.y1), yB = sy(b.y0);
            if (yB < -80 || yA > H + 80) continue;
            var fx = G.world.wallX(b.side, (b.y0 + b.y1) / 2);
            var dir = b.side === SIDE_L ? 1 : -1;
            var hh = yB - yA;

            /* CHIM BỒ CÂU ĐẬU TRÊN GỜ, và bay tán loạn khi người nhện tới gần.
             *
             * Chi tiết nhỏ nhất trong cả game, mà em nghĩ là đáng nhất: nó biến
             * cục điều hoà từ một khối chắn đường thành một chỗ có ai đó đang
             * sống. Và nó phản ứng với người chơi — thứ trang trí nào cũng đẹp,
             * nhưng thứ trang trí BIẾT có mình mới làm thành phố thành thật.
             *
             * Con nào đậu ở đâu suy từ toạ độ nên không nhấp nháy, còn lúc bay
             * đi thì nhớ vào chính vật cản ấy. Chúng không đụng vào ai. */
            if ((b.type === 'ac' || b.type === 'balcony') && hash2(Math.round(b.y0), 41) < 0.4) {
                if (b.pij == null) b.pij = 0;
                if (!b.pij && Math.abs(P.y - b.y1) < 150 && Math.abs(P.x - fx) < 190) b.pij = G.t;
                ctx.save();
                ctx.strokeStyle = 'rgba(52,64,84,0.8)';
                ctx.fillStyle = 'rgba(72,86,110,0.9)';
                ctx.lineWidth = 2;
                var np = 2 + Math.floor(hash2(Math.round(b.y0), 43) * 2);
                for (var pI = 0; pI < np; pI++) {
                    var pox = fx + dir * (14 + pI * 15);
                    var poy = yA - 5;
                    if (b.pij) {
                        /* bay vọt lên và tản ra */
                        var fT = G.t - b.pij;
                        if (fT > 2.2) continue;
                        pox += dir * fT * (60 + pI * 26);
                        poy -= fT * (90 + pI * 20);
                        ctx.globalAlpha = clamp(1 - fT / 2.2, 0, 1) * 0.85;
                        birdMark(pox, poy, 7, 0.4 + 0.6 * Math.abs(Math.sin(G.t * 16 + pI)));
                    } else {
                        ctx.globalAlpha = 0.9;
                        ctx.beginPath();
                        ctx.ellipse(pox, poy, 5, 4, 0, 0, 6.284);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(pox + dir * 4, poy - 4, 2.4, 0, 6.284);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }

            ctx.save();
            ctx.translate(fx, yA);
            ctx.scale(dir, 1);

            if (b.type === 'ac') {
                ctx.fillStyle = '#5b6472';
                roundRect(ctx, -6, 6, 46, hh - 12, 6); ctx.fill();
                ctx.fillStyle = '#8b95a6';
                roundRect(ctx, -2, 12, 38, hh - 24, 5); ctx.fill();
                ctx.strokeStyle = '#3c434e'; ctx.lineWidth = 2;
                for (var v = 18; v < hh - 18; v += 9) {
                    ctx.beginPath(); ctx.moveTo(2, v); ctx.lineTo(32, v); ctx.stroke();
                }
                ctx.fillStyle = '#2f3742';
                ctx.fillRect(-6, hh - 12, 50, 8);
            } else if (b.type === 'balcony') {
                ctx.fillStyle = '#6d6357';
                ctx.fillRect(-4, hh - 18, 62, 14);
                ctx.strokeStyle = '#4a423a'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(56, hh - 18); ctx.lineTo(56, 8); ctx.stroke();
                ctx.lineWidth = 3;
                for (var r = 0; r < 5; r++) {
                    ctx.beginPath(); ctx.moveTo(4 + r * 13, hh - 18); ctx.lineTo(4 + r * 13, 10); ctx.stroke();
                }
                ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(58, 10); ctx.stroke();
            } else if (b.type === 'sign') {
                ctx.fillStyle = '#3a3f4d';
                ctx.fillRect(0, hh / 2 - 4, 16, 8);
                var g = ctx.createLinearGradient(0, 0, 0, hh);
                g.addColorStop(0, '#ff5470'); g.addColorStop(1, '#ffa640');
                ctx.fillStyle = g;
                roundRect(ctx, 14, 4, 46, hh - 8, 6); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
                roundRect(ctx, 14, 4, 46, hh - 8, 6); ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                for (var t = 0; t < 3; t++) ctx.fillRect(22, 16 + t * 14, 30, 5);
            } else {
                /* rào công trường: sọc chéo vàng đen, đọc được từ xa */
                ctx.fillStyle = '#f2b616';
                ctx.fillRect(0, 4, 44, hh - 8);
                ctx.save();
                ctx.beginPath(); ctx.rect(0, 4, 44, hh - 8); ctx.clip();
                ctx.fillStyle = '#22262e';
                for (var d2 = -hh; d2 < 60; d2 += 22) {
                    ctx.beginPath();
                    ctx.moveTo(d2, 4); ctx.lineTo(d2 + 11, 4);
                    ctx.lineTo(d2 + 11 + hh, hh); ctx.lineTo(d2 + hh, hh);
                    ctx.closePath(); ctx.fill();
                }
                ctx.restore();
                ctx.strokeStyle = '#8a6a08'; ctx.lineWidth = 3;
                ctx.strokeRect(0, 4, 44, hh - 8);
            }
            ctx.restore();
        }
    }

    function drawMovers() {
        var mv = G.world.movers;
        for (var i = 0; i < mv.length; i++) {
            var m = mv[i];
            if (m.dead) continue;

            if (m.kind === 'laser') {
                var yy = sy(m.y);
                if (yy < -40 || yy > H + 40) continue;
                var e = gapEdges(m.y);
                var ph = laserPhase(m);
                ctx.save();
                /* Hai hộp phát ở hai đầu — mắt phải nhận ra nguồn tia trước khi
                 * nó bắn, không thì tia hiện ra như từ hư không */
                ctx.fillStyle = '#39414f';
                ctx.fillRect(e.l - 4, yy - 12, 16, 24);
                ctx.fillRect(e.r - 12, yy - 12, 16, 24);
                if (ph === 'charge') {
                    var t = 0.35 + 0.65 * Math.abs(Math.sin(G.hz * 16));
                    ctx.strokeStyle = 'rgba(255,90,110,' + (t * 0.75) + ')';
                    ctx.setLineDash([10, 9]);
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(e.l + 10, yy); ctx.lineTo(e.r - 10, yy); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = 'rgba(255,90,110,' + t + ')';
                    ctx.beginPath(); ctx.arc(e.l + 4, yy, 5, 0, 6.284); ctx.fill();
                    ctx.beginPath(); ctx.arc(e.r - 4, yy, 5, 0, 6.284); ctx.fill();
                } else if (ph === 'fire') {
                    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                    ctx.lineWidth = 6;
                    ctx.beginPath(); ctx.moveTo(e.l + 8, yy); ctx.lineTo(e.r - 8, yy); ctx.stroke();
                    ctx.strokeStyle = 'rgba(255,60,90,0.85)';
                    ctx.lineWidth = 14;
                    ctx.beginPath(); ctx.moveTo(e.l + 8, yy); ctx.lineTo(e.r - 8, yy); ctx.stroke();
                }
                ctx.restore();
                continue;
            }

            if (m.kind === 'thug') { drawThug(m); continue; }
            if (m.kind === 'sentry') { drawSentry(m); continue; }
            if (m.kind === 'rival') { drawRival(m); continue; }

            var pos = moverPos(m);
            if (!pos) continue;
            var py = sy(pos.y);
            if (py < -70 || py > H + 70) continue;

            ctx.save();
            if (m.kind === 'drone') {
                /* Bóng đổ chạy trước — báo hiệu bắt buộc của bản thiết kế */
                ctx.fillStyle = 'rgba(0,0,0,0.18)';
                ctx.beginPath(); ctx.ellipse(pos.x, py + 30, 20, 6, 0, 0, 6.284); ctx.fill();
                ctx.fillStyle = '#33405a';
                roundRect(ctx, pos.x - 17, py - 9, 34, 18, 7); ctx.fill();
                ctx.fillStyle = '#4d5f85';
                roundRect(ctx, pos.x - 11, py - 6, 22, 11, 5); ctx.fill();
                var blink = Math.sin(G.hz * 9) > 0;
                ctx.fillStyle = blink ? '#ff4b5c' : '#7a2530';
                ctx.beginPath(); ctx.arc(pos.x, py + 6, 4, 0, 6.284); ctx.fill();
                ctx.strokeStyle = 'rgba(220,235,255,0.75)';
                ctx.lineWidth = 2.4;
                var spin = (G.hz * 26) % 1;
                for (var a = 0; a < 2; a++) {
                    var ox = a ? 15 : -15;
                    ctx.beginPath();
                    ctx.ellipse(pos.x + ox, py - 10, 13, 3 + spin * 2, 0, 0, 6.284);
                    ctx.stroke();
                }
            } else if (m.kind === 'bird') {
                ctx.fillStyle = '#2c3444';
                var flap = Math.sin(G.hz * 12) * 0.6;
                ctx.beginPath();
                ctx.moveTo(pos.x, py);
                ctx.quadraticCurveTo(pos.x - 15, py - 12 - flap * 8, pos.x - 26, py - 2);
                ctx.quadraticCurveTo(pos.x - 14, py + 3, pos.x, py + 4);
                ctx.quadraticCurveTo(pos.x + 14, py + 3, pos.x + 26, py - 2);
                ctx.quadraticCurveTo(pos.x + 15, py - 12 - flap * 8, pos.x, py);
                ctx.fill();
                ctx.fillStyle = '#ffb03a';
                ctx.beginPath(); ctx.arc(pos.x, py + 1, 5, 0, 6.284); ctx.fill();
            } else if (m.kind === 'debris') {
                ctx.save();
                ctx.translate(pos.x, py);
                ctx.rotate(G.hz * 4 + m.phase * 6);
                ctx.fillStyle = '#8a7a63';
                ctx.beginPath();
                ctx.moveTo(-14, -10); ctx.lineTo(13, -13); ctx.lineTo(15, 9); ctx.lineTo(-9, 14);
                ctx.closePath(); ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.restore();
                /* vệt bụi phía sau để thấy nó đang rơi nhanh cỡ nào */
                ctx.strokeStyle = 'rgba(255,255,255,0.28)';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(pos.x, py - 20); ctx.lineTo(pos.x, py - 52); ctx.stroke();
            } else if (m.kind === 'swing') {
                /* Tay đòn bắt vào tường, rồi sợi dây thả xuống quả biển. Vẽ đủ
                 * cả hai đoạn thì mắt hiểu ngay cái gì treo vào đâu — thiếu tay
                 * đòn thì cái biển trông như đang lơ lửng giữa trời. */
                var wx = G.world.wallX(m.side, m.y);
                var armX = wx + (m.side === SIDE_L ? 30 : -30);
                ctx.strokeStyle = '#39414f'; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(wx, sy(m.y)); ctx.lineTo(armX, sy(m.y)); ctx.stroke();
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(armX, sy(m.y)); ctx.lineTo(pos.x, py); ctx.stroke();
                ctx.fillStyle = '#ff6b3d';
                roundRect(ctx, pos.x - 20, py - 14, 40, 28, 5); ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
                roundRect(ctx, pos.x - 20, py - 14, 40, 28, 5); ctx.stroke();
            } else if (m.kind === 'platform') {
                var wx2 = G.world.wallX(m.side, pos.y);
                ctx.strokeStyle = 'rgba(60,66,80,0.9)'; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(wx2 + (m.side === SIDE_L ? 8 : -8), sy(m.y1) - 200);
                ctx.lineTo(pos.x, py - 14);
                ctx.stroke();
                ctx.fillStyle = '#c9ab5d';
                roundRect(ctx, pos.x - 26, py - 14, 52, 26, 4); ctx.fill();
                ctx.fillStyle = '#7d6733';
                ctx.fillRect(pos.x - 26, py + 8, 52, 5);
                ctx.fillStyle = '#3d4757';
                ctx.fillRect(pos.x - 8, py - 26, 16, 14);
            } else if (m.kind === 'loose') {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath(); ctx.ellipse(pos.x, py + 24, 18, 5, 0, 0, 6.284); ctx.fill();
                var sway = Math.sin(G.hz * 1.6 + m.y) * 3;
                ctx.translate(pos.x + sway, py);
                ctx.fillStyle = '#6a7382';
                roundRect(ctx, -20, -16, 40, 32, 5); ctx.fill();
                ctx.fillStyle = '#98a3b3';
                roundRect(ctx, -15, -11, 30, 22, 4); ctx.fill();
                ctx.strokeStyle = '#39414f'; ctx.lineWidth = 2;
                for (var vv = -8; vv < 10; vv += 6) {
                    ctx.beginPath(); ctx.moveTo(-12, vv); ctx.lineTo(12, vv); ctx.stroke();
                }
                /* sợi cáp còn treo — nói ngay "cái này sắp rụng" */
                ctx.strokeStyle = 'rgba(200,210,225,0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(-8, -34); ctx.stroke();
            }
            ctx.restore();
        }
    }

    /* CỬA SỔ CÓ NGƯỜI.
     *
     * Vẽ cả ba pha, kể cả lúc hắn còn trong nhà — và đó mới là phần quan
     * trọng: cái cửa sổ phải NẰM SẴN trên tường từ xa. Chỉ vẽ lúc hắn thò ra
     * thì đúng là bất ngờ thật, nhưng là kiểu bất ngờ của một cái bẫy hiện ra
     * từ hư không. Ở đây bất ngờ nằm ở chỗ không biết cửa sổ NÀO sẽ mở. */
    function drawThug(m) {
        var yy = sy(m.y + R.THUG_H / 2);
        if (yy < -90 || yy > H + 90) return;
        var fx = G.world.wallX(m.side, m.y + R.THUG_H / 2);
        var dir = m.side === SIDE_L ? 1 : -1;
        var ph = thugPhase(m);
        var shake = ph === 'warn' ? Math.sin(G.hz * 40) * 2.5 : 0;

        ctx.save();
        ctx.translate(fx, yy + shake);
        ctx.scale(dir, 1);

        /* Khung cửa sổ và gã bên trong đều dựng theo R.THUG_H, nên chỉnh một
         * con số là cả hai co giãn theo. Anh Hiếu nói đúng: bản trước hắn to
         * gấp rưỡi người nhện, nhìn cứ như người thường đứng cạnh trẻ con — mà
         * ở game này người nhện mới là thước đo mọi thứ. */
        var hh = R.THUG_H, hw = hh * 0.62;

        ctx.fillStyle = '#1d2431';
        roundRect(ctx, -hw, -hh / 2, hw, hh, 4); ctx.fill();
        ctx.strokeStyle = '#68758c'; ctx.lineWidth = 2.5;
        roundRect(ctx, -hw, -hh / 2, hw, hh, 4); ctx.stroke();

        if (ph === 'in') {
            /* bóng người mờ mờ sau kính — đủ để đoán, không đủ để chắc */
            ctx.fillStyle = 'rgba(120,150,190,0.30)';
            ctx.beginPath(); ctx.arc(-hw * 0.5, -hh * 0.1, hh * 0.16, 0, 6.284); ctx.fill();
            ctx.fillRect(-hw * 0.72, hh * 0.04, hw * 0.46, hh * 0.4);
        } else {
            var open = ph === 'warn' ? 0.5 : 1;
            var leafW = hw * 0.46 * (1 - open) + 3;
            ctx.fillStyle = '#33465e';
            ctx.fillRect(-hw, -hh / 2, leafW, hh);
            ctx.fillRect(-leafW, -hh / 2, leafW, hh);
        }

        if (ph === 'warn') {
            ctx.save();
            ctx.scale(dir, 1);                      // chữ không được lộn ngược
            ctx.fillStyle = '#ffd75e';
            ctx.font = 'bold 22px Baloo 2, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', dir * -hw * 0.5, -hh * 0.62);
            ctx.restore();
        }

        if (ph === 'out') {
            /* Thò hẳn ra khe: vai, đầu, một cánh tay chìa ra chắn đường. Cỡ
             * ngang người nhện — hơn một chút ở bờ vai, thế thôi. */
            ctx.fillStyle = '#2f3a4e';
            roundRect(ctx, -20, -4, 38, 28, 9); ctx.fill();       // thân
            ctx.fillStyle = '#e8b48c';
            ctx.beginPath(); ctx.arc(-1, -13, 10.5, 0, 6.284); ctx.fill();   // đầu
            ctx.fillStyle = '#22303f';
            roundRect(ctx, -12, -24, 23, 9, 4); ctx.fill();       // mũ
            ctx.fillStyle = '#1b2430';
            ctx.beginPath(); ctx.arc(2.5, -14, 1.8, 0, 6.284); ctx.fill();
            ctx.beginPath(); ctx.arc(-5.5, -14, 1.8, 0, 6.284); ctx.fill();
            ctx.strokeStyle = '#e8b48c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(9, 4); ctx.lineTo(28, -4); ctx.stroke();
        }
        ctx.restore();
    }

    /* NGƯỜI NHỆN ĐỐI THỦ — tụt xuống ngược chiều, đầu chúc xuống.
     * Cùng dáng với người chơi nhưng lộn đầu và đổi màu, để một cái nhìn là
     * hiểu ngay: cùng loài, khác phe, và đang đi ngược đường mình. */
    function drawRival(m) {
        var pos = moverPos(m);
        if (!pos) return;
        var py = sy(pos.y);
        if (py < -80 || py > H + 80) return;
        var dir = m.side === SIDE_L ? 1 : -1;

        ctx.save();
        ctx.translate(pos.x, py);

        /* rùn người chuẩn bị nhảy sang — báo trước, nếu không thì cú nhảy của
         * hắn là một cú đánh lén */
        if (m.windup > 0) {
            var k = m.windup / R.RIVAL_WINDUP;
            ctx.strokeStyle = 'rgba(255,215,94,' + (0.4 + 0.6 * Math.abs(Math.sin(G.t * 22))) + ')';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, 24 + k * 12, 0, 6.284); ctx.stroke();
        }

        ctx.scale(dir, -1);                        // lộn ngược: hắn đi xuống

        ctx.strokeStyle = '#1a0f2e'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
        var sw = Math.sin(G.t * 8);
        var limbs = [[-6, -8, -20, -18 - sw * 6], [-6, 6, -21, 14 + sw * 6],
                     [6, -8, 19, -16 + sw * 6], [6, 6, 20, 15 - sw * 6]];
        for (var i = 0; i < limbs.length; i++) {
            var L = limbs[i];
            ctx.beginPath();
            ctx.moveTo(L[0], L[1]);
            ctx.quadraticCurveTo(L[2] * 0.6, L[1] + (L[3] - L[1]) * 0.2, L[2], L[3]);
            ctx.stroke();
        }
        ctx.fillStyle = '#6b2fb5';
        roundRect(ctx, -11, -12, 22, 26, 9); ctx.fill();
        ctx.strokeStyle = '#1a0f2e'; ctx.lineWidth = 2.4;
        roundRect(ctx, -11, -12, 22, 26, 9); ctx.stroke();
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(0, 12);
        ctx.moveTo(-9, 0); ctx.lineTo(9, 0);
        ctx.stroke();
        ctx.fillStyle = '#6b2fb5';
        ctx.beginPath(); ctx.arc(2, -18, 11, 0, 6.284); ctx.fill();
        ctx.strokeStyle = '#1a0f2e'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(2, -18, 11, 0, 6.284); ctx.stroke();
        /* mắt đỏ — dấu hiệu duy nhất cần để biết đây không phải bạn */
        ctx.fillStyle = '#ff3b52';
        ctx.beginPath(); ctx.ellipse(6, -20, 6, 4.4, -0.35, 0, 6.284); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-3, -20, 4.6, 3.6, 0.35, 0, 6.284); ctx.fill();
        ctx.restore();
    }

    /* RÔ-BỐT GÁC — bắt vào tường, ngắm rồi bắn ngang khe. */
    function drawSentry(m) {
        var yy = sy(m.y);
        if (yy < -90 || yy > H + 90) {
            if (!m.shot) return;
        }
        var fx = G.world.wallX(m.side, m.y);
        var dir = m.side === SIDE_L ? 1 : -1;
        var aiming = m.t > m.period - m.charge;

        ctx.save();
        ctx.translate(fx, yy);
        ctx.scale(dir, 1);
        ctx.fillStyle = '#2b3444';
        roundRect(ctx, -8, -18, 26, 36, 6); ctx.fill();
        ctx.fillStyle = '#4a5668';
        roundRect(ctx, 12, -11, 22, 22, 6); ctx.fill();
        /* nòng chĩa ra khe, hơi ngóc theo mục tiêu */
        ctx.strokeStyle = '#8b97ab'; ctx.lineWidth = 7; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(44, 0); ctx.stroke();
        var eye = aiming ? (0.5 + 0.5 * Math.abs(Math.sin(G.t * 18))) : 0.35;
        ctx.fillStyle = 'rgba(255,60,80,' + eye + ')';
        ctx.beginPath(); ctx.arc(22, 0, 6, 0, 6.284); ctx.fill();
        ctx.restore();

        /* vạch ngắm và chấm đỏ trên người chơi */
        if (aiming && m.aimY != null) {
            var ay = sy(m.aimY);
            var e = gapEdges(m.aimY);
            ctx.save();
            ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(G.t * 16));
            ctx.strokeStyle = '#ff3c50';
            ctx.lineWidth = 2;
            ctx.setLineDash([7, 7]);
            ctx.beginPath();
            ctx.moveTo(fx + dir * 44, sy(m.y));
            ctx.lineTo(dir > 0 ? e.r : e.l, ay);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ff3c50';
            ctx.beginPath(); ctx.arc(P.x, ay, 5, 0, 6.284); ctx.fill();
            ctx.restore();
        }

        /* viên đạn */
        if (m.shot) {
            var shy = sy(m.shot.y);
            ctx.save();
            ctx.strokeStyle = 'rgba(255,140,90,0.55)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(m.shot.x, shy);
            ctx.lineTo(m.shot.x - Math.sign(m.shot.vx) * 34, shy);
            ctx.stroke();
            ctx.fillStyle = '#fff2c8';
            ctx.beginPath(); ctx.arc(m.shot.x, shy, 7, 0, 6.284); ctx.fill();
            ctx.fillStyle = '#ff7a3c';
            ctx.beginPath(); ctx.arc(m.shot.x, shy, 4, 0, 6.284); ctx.fill();
            ctx.restore();
        }
    }

    function drawPickups() {
        var pk = G.world.pickups;
        for (var i = 0; i < pk.length; i++) {
            var p = pk[i];
            if (p.taken) continue;
            var py = sy(p.y);
            if (py < -40 || py > H + 40) continue;
            var px = pickupX(p);
            ctx.save();
            ctx.translate(px, py + Math.sin(G.t * 3 + p.y * 0.02) * 3);

            if (p.type === 'coin') {
                var sw = Math.abs(Math.cos(G.t * 3.2 + p.y * 0.01));
                ctx.fillStyle = '#c98a12';
                ctx.beginPath(); ctx.ellipse(0, 0, 11 * sw + 1.5, 11, 0, 0, 6.284); ctx.fill();
                ctx.fillStyle = '#ffd75e';
                ctx.beginPath(); ctx.ellipse(0, 0, 9 * sw + 1, 9, 0, 0, 6.284); ctx.fill();
                if (sw > 0.55) {
                    ctx.fillStyle = '#c98a12';
                    ctx.font = 'bold 11px Baloo 2, sans-serif';
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText('$', 0, 1);
                }
            } else if (p.type === 'gem') {
                ctx.rotate(Math.sin(G.t * 2 + p.y) * 0.2);
                ctx.fillStyle = '#39d6ff';
                ctx.beginPath();
                ctx.moveTo(0, -14); ctx.lineTo(12, -2); ctx.lineTo(0, 15); ctx.lineTo(-12, -2);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.65)';
                ctx.beginPath();
                ctx.moveTo(0, -14); ctx.lineTo(6, -3); ctx.lineTo(0, 4); ctx.lineTo(-6, -3);
                ctx.closePath(); ctx.fill();
            } else {
                var col = { web: '#ffffff', shield: '#7ee0ff', magnet: '#ff7ab8', x2: '#ffd75e', slow: '#b0ff9c' }[p.type] || '#fff';
                var ico = { web: '🕸', shield: '🛡', magnet: '🧲', x2: '✖2', slow: '⏳' }[p.type] || '?';
                ctx.fillStyle = 'rgba(12,18,32,0.85)';
                ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.284); ctx.fill();
                ctx.strokeStyle = col; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.284); ctx.stroke();
                ctx.font = '15px system-ui, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = col;
                ctx.fillText(ico, 0, 1);
            }
            ctx.restore();
        }
    }

    function drawWind() {
        var ws = G.world.winds;
        for (var i = 0; i < ws.length; i++) {
            var w = ws[i];
            var yA = sy(w.y1), yB = sy(w.y0);
            if (yB < 0 || yA > H) continue;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.32)';
            ctx.lineWidth = 2;
            for (var k = 0; k < 22; k++) {
                var ly = yA + hash2(i * 31 + k, 5) * (yB - yA);
                var speed = 200 + hash2(k, 9) * 260;
                var lx = ((hash2(k, 6) * W + G.t * speed * w.dir) % (W + 120) + W + 120) % (W + 120) - 60;
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(lx + 34 * w.dir, ly);
                ctx.stroke();
            }
            /* mũi tên nhỏ ở mép để biết gió thổi về đâu, không chỉ là "có gió" */
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 16px Baloo 2, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(w.dir > 0 ? '»»' : '««', W / 2, (yA + yB) / 2);
            ctx.restore();
        }
    }

    /* ========================================================================
     * 11. NGƯỜI NHỆN
     * ======================================================================*/

    function suit() {
        var id = store.data.suit;
        for (var i = 0; i < R.SUITS.length; i++) if (R.SUITS[i].id === id) return R.SUITS[i];
        return R.SUITS[0];
    }

    function drawPlayer() {
        var s = suit();
        /* VÒNG CUNG CỦA CÚ NHẢY, thuần phần nhìn.
         *
         * Độ cao thật của người nhện đi lên đều đặn không đứt đoạn — máy quay
         * bám vào đó nên nó phải mượt. Còn cái vẻ "bay vọt lên rồi hạ xuống"
         * thì vẽ riêng ở đây: nhấc hình lên vài chục điểm ảnh giữa cú bay rồi
         * hạ về, cộng nghiêng người theo hướng bay. Va chạm vẫn tính theo độ
         * cao thật, nên lệch phải nhỏ — 18 điểm ảnh, trong khoảng mà mắt đọc
         * là "một cú nhảy" chứ chưa tới mức thấy hình một đằng ăn đòn một nẻo. */
        var arc = 0, tilt = 0;
        if (P.state === 'jump' && P.flightMax > 0) {
            var k = clamp(P.flight / P.flightMax, 0, 1);
            arc = -Math.sin(k * Math.PI) * 18;
            tilt = (P.vx > 0 ? 1 : -1) * Math.sin(k * Math.PI) * 0.22;
        }
        var px = P.x, py = sy(P.y) + arc;
        ctx.save();
        ctx.translate(px, py);
        if (tilt) ctx.rotate(tilt);

        if (P.invuln > 0 && Math.floor(P.invuln * 12) % 2) ctx.globalAlpha = 0.42;

        /* Khiên bọc ngoài */
        if (G.power.shield > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(130,230,255,' + (0.55 + 0.35 * Math.sin(G.t * 6)) + ')';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, 27, 0, 6.284); ctx.stroke();
            ctx.restore();
        }

        ctx.scale(P.face, 1);

        var climbing = P.state === 'cling';
        var ph = P.anim;
        var swing = climbing ? Math.sin(ph) : (P.state === 'jump' ? 0.9 : -0.5);

        /* Bốn chi. Vẽ trước thân để thân đè lên gốc chi, nhìn liền khối hơn. */
        ctx.strokeStyle = s.trim;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        var limbs = [
            [-6, -8, -20, -18 - swing * 6],
            [-6, 6, -21, 14 + swing * 6],
            [6, -8, 19, -16 + swing * 6],
            [6, 6, 20, 15 - swing * 6]
        ];
        for (var i = 0; i < limbs.length; i++) {
            var L = limbs[i];
            ctx.beginPath();
            ctx.moveTo(L[0], L[1]);
            ctx.quadraticCurveTo(L[2] * 0.6, L[1] + (L[3] - L[1]) * 0.2, L[2], L[3]);
            ctx.stroke();
        }

        /* Thân */
        ctx.fillStyle = s.body;
        roundRect(ctx, -11, -12, 22, 26, 9);
        ctx.fill();
        ctx.strokeStyle = s.trim; ctx.lineWidth = 2.4;
        roundRect(ctx, -11, -12, 22, 26, 9); ctx.stroke();

        /* Vạch mạng nhện trên ngực — dấu hiệu nhận ra nhân vật ở cỡ nhỏ */
        ctx.strokeStyle = s.trim; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -10); ctx.lineTo(0, 12);
        ctx.moveTo(-9, 0); ctx.lineTo(9, 0);
        ctx.moveTo(-7, -7); ctx.lineTo(7, 7);
        ctx.moveTo(7, -7); ctx.lineTo(-7, 7);
        ctx.stroke();

        /* Đầu và hai con mắt to — silhouette phải đọc được trên mọi nền */
        ctx.fillStyle = s.body;
        ctx.beginPath(); ctx.arc(2, -18, 11, 0, 6.284); ctx.fill();
        ctx.strokeStyle = s.trim; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(2, -18, 11, 0, 6.284); ctx.stroke();
        ctx.fillStyle = s.eye;
        ctx.beginPath();
        ctx.ellipse(6, -20, 6, 4.4, -0.35, 0, 6.284); ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-3, -20, 4.6, 3.6, 0.35, 0, 6.284); ctx.fill();
        ctx.strokeStyle = s.trim; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(6, -20, 6, 4.4, -0.35, 0, 6.284); ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-3, -20, 4.6, 3.6, 0.35, 0, 6.284); ctx.stroke();

        ctx.restore();

        /* Sợi tơ đang bắn — bắn ra từ chỗ NHÌN THẤY, không phải chỗ tính toán,
         * không thì lúc đang bay sợi tơ mọc ra từ khoảng không dưới bụng. */
        if (P.webShot) {
            ctx.save();
            ctx.strokeStyle = s.web;
            ctx.globalAlpha = clamp(P.webShot.life / 0.22, 0, 1);
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(P.webShot.x, sy(P.webShot.y));
            ctx.stroke();
            ctx.restore();
        }
        /* Bám hụt: chớp đỏ ngắn ngay chỗ tay với tới */
        if (P.catchFail > 0) {
            ctx.save();
            ctx.globalAlpha = P.catchFail / 0.35;
            ctx.strokeStyle = '#ff5470';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(px, py, 26, 0, 6.284); ctx.stroke();
            ctx.restore();
        }

        /* Vòng ngắm của tơ — cho biết bắn ra sẽ trúng cái gì. Không có nó thì
         * nút tơ thành ra bấm hú hoạ. */
        if (G.phase === 'play' && P.web > 0) {
            var t = bestWebTarget();
            if (t && t.kind !== 'loot') {
                var ty = sy(t.y);
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.arc(t.x, ty, 26, 0, 6.284); ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    }

    function drawParticles() {
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            var a = clamp(p.life / p.max, 0, 1);
            ctx.globalAlpha = a;
            ctx.fillStyle = p.col;
            if (p.kind === 'spark') {
                ctx.fillRect(p.x - p.s / 2, sy(p.y) - p.s / 2, p.s, p.s * 2);
            } else {
                ctx.beginPath(); ctx.arc(p.x, sy(p.y), p.s * a, 0, 6.284); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.font = 'bold 19px Baloo 2, Nunito, sans-serif';
        for (var j = 0; j < pops.length; j++) {
            var q = pops[j];
            ctx.globalAlpha = clamp(q.life / 0.9, 0, 1);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0,0,0,0.55)';
            ctx.strokeText(q.text, q.x, sy(q.y));
            ctx.fillStyle = q.col;
            ctx.fillText(q.text, q.x, sy(q.y));
        }
        ctx.globalAlpha = 1;
    }

    /* Vệt đỏ ở đáy màn: đây là "ngưỡng rơi". Bản thiết kế đòi rơi phải đáng sợ,
     * mà đáng sợ thì phải NHÌN THẤY ranh giới, không phải đoán. */
    function drawDangerEdge() {
        var depth = clamp((P.y - (G.camY - H)) / (H * 0.34), 0, 1);
        var a = (1 - depth) * 0.6;
        if (a <= 0.01) return;
        var g = ctx.createLinearGradient(0, H, 0, H - 190);
        g.addColorStop(0, 'rgba(255,40,60,' + a + ')');
        g.addColorStop(1, 'rgba(255,40,60,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, H - 190, W, 190);
    }

    function draw() {
        ctx.save();
        if (G.shake > 0) {
            ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
        }
        drawSky();
        drawTowers();
        drawSurfaces();
        drawWind();
        drawBlockers();
        drawPickups();
        drawMovers();
        if (G.phase !== 'menu') drawPlayer();
        drawBolt();
        drawParticles();
        drawWeather();
        drawDangerEdge();
        ctx.restore();

        if (G.flash > 0) {
            ctx.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.5) + ')';
            ctx.fillRect(0, 0, W, H);
        }
    }

    /* ========================================================================
     * 12. GIAO DIỆN HTML
     * ======================================================================*/

    var hudCache = {};

    function setHtml(id, v) {
        if (hudCache['#' + id] === v) return;
        hudCache['#' + id] = v;
        var e = el(id);
        if (e) e.innerHTML = v;
    }

    function setText(id, v) {
        if (hudCache[id] === v) return;
        hudCache[id] = v;
        var e = el(id);
        if (e) e.textContent = v;
    }

    function syncHud(force) {
        if (force) hudCache = {};
        /* Đơn vị "m" nằm sẵn trong HTML, không ghép vào số. Ghép vào thì lúc
         * số dài ra, chuỗi "1,389 m" xuống dòng và ô cao gấp đôi — đúng cái
         * giật anh Hiếu chụp được. */
        setText('hud-height', fmt(metresNow()));
        setText('hud-score', fmt(G.score));
        setText('hud-coins', fmt(G.coins));

        /* Mạng và tơ vẽ bằng những ô <span> CÙNG MỘT BIỂU TƯỢNG, cái đã mất
         * thì mờ đi — chứ không đổi sang biểu tượng khác.
         *
         * Bản trước dùng ❤️ cho mạng còn và 🖤 cho mạng đã mất. Trông thì
         * được, nhưng ❤️ là HAI điểm mã (quả tim cộng dấu báo "vẽ kiểu emoji")
         * còn 🖤 chỉ một — nên mỗi lần mất một mạng là chuỗi ngắn đi, ô hẹp
         * lại, và hai ô bên cạnh dịch theo. Đúng kiểu lỗi không ai ngờ tới cho
         * tới lúc nhìn thấy nó giật. Cùng một biểu tượng thì bề ngang không có
         * cách nào đổi được nữa. */
        var lives = '', nLives = G.mode === 'hardcore' ? 1 : R.LIVES;
        for (var i = 0; i < nLives; i++) {
            lives += '<span class="pip' + (i < G.lives ? ' on' : '') + '">❤️</span>';
        }
        setHtml('hud-lives', lives);

        var web = '';
        for (var j = 0; j < R.WEB_MAX; j++) {
            web += '<span class="pip' + (j < P.web ? ' on' : '') + '">🕸</span>';
        }
        setHtml('hud-web', web);

        var cbox = el('hud-combo');
        var on = G.combo >= 3;
        if (cbox.classList.contains('on') !== on) cbox.classList.toggle('on', on);
        if (on) setText('hud-combo-val', 'x' + R.comboMul(G.combo));

        /* Vật phẩm: chỉ biểu tượng và số giây, không chữ. Ba cái cùng lúc là
         * nhiều nhất có thể gặp, vừa đúng một dòng. */
        var chips = [];
        if (G.power.shield > 0) chips.push('🛡');
        if (G.power.magnet > 0) chips.push('🧲' + Math.ceil(G.power.magnet));
        if (G.power.x2 > 0) chips.push('✖2·' + Math.ceil(G.power.x2));
        if (G.power.slow > 0) chips.push('⏳' + Math.ceil(G.power.slow));
        setText('hud-power', chips.join(' '));
    }

    var screens = ['menu-overlay', 'help-overlay', 'pause-overlay', 'over-overlay', 'shop-overlay', 'missions-overlay'];
    function showScreen(id) {
        screens.forEach(function (s) {
            var e = el(s);
            if (e) e.classList.toggle('hidden', s !== id);
        });
        el('hud').hidden = !(id === null || id === 'pause-overlay');
    }

    var toastT = null;
    function toast(msg) {
        var t = el('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastT);
        toastT = setTimeout(function () { t.classList.remove('show'); }, 1500);
    }

    /* ---- nhiệm vụ ---- */

    function missionById(id) {
        for (var i = 0; i < R.MISSIONS.length; i++) if (R.MISSIONS[i].id === id) return R.MISSIONS[i];
        return null;
    }

    function checkMissions() {
        var d = store.data, out = [];
        var left = [];
        d.missions.forEach(function (id) {
            var ms = missionById(id);
            if (!ms) return;
            var got = G.stats[ms.stat] || 0;
            if (got >= ms.n) {
                d.coins += ms.coins || 0;
                d.gems += ms.gems || 0;
                if (d.done.indexOf(id) < 0) d.done.push(id);
                out.push({ text: R.missionText(ms), coins: ms.coins || 0, gems: ms.gems || 0 });
            } else left.push(id);
        });
        while (left.length < 3) {
            var fresh = R.rollMissions(d.done.concat(left), R.makeRng(R.dailySeed() + d.plays + left.length), 1);
            if (!fresh.length || left.indexOf(fresh[0]) >= 0) break;
            left.push(fresh[0]);
        }
        d.missions = left;
        return out;
    }

    function renderMissions(host) {
        host.innerHTML = '';
        store.data.missions.forEach(function (id) {
            var ms = missionById(id);
            if (!ms) return;
            var row = document.createElement('div');
            row.className = 'mission';
            row.innerHTML = '<span class="mission-text">' + R.missionText(ms) + '</span>' +
                '<b class="mission-prize">+' + (ms.coins || 0) + ' 🪙' +
                (ms.gems ? ' +' + ms.gems + ' 💎' : '') + '</b>';
            host.appendChild(row);
        });
    }

    /* ---- cửa hàng trang phục ---- */

    function renderShop() {
        var host = el('suit-list');
        host.innerHTML = '';
        R.SUITS.forEach(function (s) {
            var owned = store.data.owned.indexOf(s.id) >= 0;
            var on = store.data.suit === s.id;
            var card = document.createElement('button');
            card.className = 'suit' + (on ? ' is-on' : '') + (owned ? '' : ' is-locked');
            card.innerHTML =
                '<span class="suit-dot" style="background:' + s.body + ';border-color:' + s.trim + '"></span>' +
                '<span class="suit-name">' + s.name + '</span>' +
                '<span class="suit-tag">' + (on ? 'WEARING' : (owned ? 'WEAR' : s.cost + ' 🪙')) + '</span>';
            card.addEventListener('click', function () {
                if (owned) {
                    store.data.suit = s.id;
                    Sfx.power();
                } else if (store.data.coins >= s.cost) {
                    store.data.coins -= s.cost;
                    store.data.owned.push(s.id);
                    store.data.suit = s.id;
                    Sfx.gem();
                    toast('Unlocked!');
                } else {
                    Sfx.bump();
                    toast('Not enough coins');
                    return;
                }
                store.save();
                renderShop();
                syncMenu();
            });
            host.appendChild(card);
        });
    }

    function syncMenu() {
        var d = store.data;
        setText('menu-best', fmt(d.best.endless || 0));
        setText('menu-bestm', fmt(d.bestM.endless || 0) + ' m');
        setText('menu-coins', fmt(d.coins));
        setText('menu-gems', fmt(d.gems));
        setText('shop-coins', fmt(d.coins));
        setText('rec-combo', 'x' + (d.rec.combo || 0));
        setText('rec-drones', fmt(d.rec.drones || 0));
        setText('rec-sprint', d.rec.sprint ? d.rec.sprint.toFixed(1) + ' s' : '—');
        setText('rec-daily', fmt(d.bestM.daily || 0) + ' m');
        setText('rec-hard', fmt(d.bestM.hardcore || 0) + ' m');
        renderMissions(el('menu-missions'));
    }

    /* ========================================================================
     *  NHẬP LIỆU
     * ======================================================================*/

    function wireInput() {
        var stage = document.querySelector('.stage');

        function tap(e) {
            if (G.phase !== 'play') return;
            e.preventDefault();
            Sfx.wake();
            doJump();
        }
        stage.addEventListener('pointerdown', tap);

        var webBtn = el('btn-web');
        webBtn.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            e.stopPropagation();          // đừng để cú bấm này nhảy luôn
            Sfx.wake();
            fireWeb();
        });

        /* Nút LEO cho màn cảm ứng, đặt đối xứng với nút TƠ ở góc bên kia.
         *
         * Phải có nó thì bàn phím và ngón tay mới làm được đúng những việc như
         * nhau — cùng một bảng vàng mà một bên leo nhanh được còn bên kia thì
         * không là hỏng bảng vàng. Vẫn chơi được bằng MỘT ngón như cũ: chạm
         * giữa sân để nhảy là đủ, hai cái nút góc chỉ là phần thêm. */
        var boostBtn = el('btn-boost');
        boostBtn.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            Sfx.wake();
            P.fastTouch = true;
            boostBtn.classList.add('is-on');
        });
        /* Bắt cả bốn cách ngón tay rời ra. Thiếu pointercancel là kiểu treo
         * kinh điển trên điện thoại: hệ điều hành cướp cú chạm giữa chừng
         * (thông báo kéo xuống, cuộc gọi tới) thì pointerup không bao giờ tới,
         * và nút kẹt ở trạng thái đang giữ. */
        ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(function (ev) {
            boostBtn.addEventListener(ev, function () {
                P.fastTouch = false;
                boostBtn.classList.remove('is-on');
            });
        });

        window.addEventListener('keydown', function (e) {
            if (e.repeat) return;
            var k = e.key;
            /* MŨI TÊN LÊN LÀ LEO LÊN, không phải nhảy ngang.
             *
             * Bản trước em gán ↑ thành nhảy, vì gán theo mạch của ngón tay trên
             * điện thoại: ở đó chỉ có một cú chạm và nó luôn có nghĩa "sang
             * tường bên kia". Nhưng trên bàn phím thì mỗi phím mang đúng nghĩa
             * hình học của nó — bấm lên mà nhân vật bay ngang là sai với thứ
             * tay đang nghĩ. Nay: lên là leo nhanh, trái phải là nhảy, phím
             * cách là nhảy sang tường đối diện. */
            if (k === 'ArrowUp' || k === 'w' || k === 'W') {
                if (G.phase === 'play') { e.preventDefault(); Sfx.wake(); P.fastKey = true; }
                else if (G.phase === 'menu') { e.preventDefault(); startRun('endless'); }
            } else if (k === ' ') {
                /* Phím cách: NHẢY sang tường đối diện — và lúc đang rơi thì
                 * chính nó bắn tơ bám lại tường, vì doJump() phân biệt hai
                 * trạng thái. Nên cú bấm cần gấp nhất (trượt tay, phải bám lại
                 * ngay) nằm đúng trên phím to nhất bàn phím, không phải nhớ đổi
                 * ngón sang phím khác giữa lúc đang rơi. */
                if (G.phase === 'play') { e.preventDefault(); Sfx.wake(); doJump(); }
                else if (G.phase === 'menu') { e.preventDefault(); startRun('endless'); }
            } else if (k === 'f' || k === 'F') {
                /* Bắn tơ CHỦ ĐỘNG: hạ máy bay, cắt dây điện, gom xu. */
                if (G.phase === 'play') { e.preventDefault(); Sfx.wake(); fireWeb(); }
            } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
                if (G.phase === 'play') { e.preventDefault(); Sfx.wake(); doJumpTo(-1); }
            } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
                if (G.phase === 'play') { e.preventDefault(); Sfx.wake(); doJumpTo(1); }
            } else if (k === 'p' || k === 'P' || k === 'Escape') {
                togglePause();
            }
        });

        window.addEventListener('keyup', function (e) {
            var k = e.key;
            if (k === 'ArrowUp' || k === 'w' || k === 'W') P.fastKey = false;
        });

        /* Rời khỏi cửa sổ mà còn đang giữ phím thì trình duyệt KHÔNG gửi keyup
         * — quay lại là người nhện leo nhanh mãi không thôi, và không có cách
         * nào tắt ngoài bấm lại rồi nhả ra. Lỗi nhỏ mà bực, nên thả tay hộ. */
        window.addEventListener('blur', function () { P.fastKey = false; });

        /* Chuyển tab giữa lượt thì dừng lại — quay về thấy mình đã rơi mất hai
         * mạng là kiểu bực nhất, mà lỗi hoàn toàn không phải của người chơi. */
        document.addEventListener('visibilitychange', function () {
            if (document.hidden && G.phase === 'play') togglePause();
        });
    }

    function togglePause() {
        if (G.phase === 'play') {
            G.phase = 'pause';
            Sfx.ambient(0, 300);
            showScreen('pause-overlay');
            touchButtons(false);
        } else if (G.phase === 'pause') {
            G.phase = 'play';
            showScreen(null);
            touchButtons(true);
        }
    }

    function wireButtons() {
        el('btn-play').addEventListener('click', function () { startRun('endless'); });
        el('btn-daily').addEventListener('click', function () { startRun('daily'); });
        el('btn-hardcore').addEventListener('click', function () { startRun('hardcore'); });
        el('btn-again').addEventListener('click', function () { startRun(G.mode); });
        el('btn-revive').addEventListener('click', revive);
        el('btn-over-menu').addEventListener('click', backToMenu);
        el('btn-nav-menu').addEventListener('click', backToMenu);
        el('btn-resume').addEventListener('click', togglePause);
        el('btn-pause').addEventListener('click', togglePause);
        el('btn-help').addEventListener('click', function () {
            if (G.phase === 'play') togglePause();
            showScreen('help-overlay');
        });
        el('btn-help-back').addEventListener('click', function () {
            showScreen(G.phase === 'pause' ? 'pause-overlay' : 'menu-overlay');
        });
        el('btn-shop').addEventListener('click', function () { renderShop(); showScreen('shop-overlay'); });
        el('btn-shop-back').addEventListener('click', function () { showScreen('menu-overlay'); });
        el('btn-missions').addEventListener('click', function () {
            renderMissions(el('mission-list'));
            showScreen('missions-overlay');
        });
        el('btn-missions-back').addEventListener('click', function () { showScreen('menu-overlay'); });

        var sb = el('btn-sound');
        sb.addEventListener('click', function () {
            var on = Sfx.toggle();
            el('sound-icon').className = 'fa-solid ' + (on ? 'fa-volume-high' : 'fa-volume-xmark');
            sb.classList.toggle('is-off', !on);
        });
        el('sound-icon').className = 'fa-solid ' + (Sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
        sb.classList.toggle('is-off', !Sfx.on);
    }

    function backToMenu() {
        G.phase = 'menu';
        Sfx.ambient(0, 300);
        touchButtons(false);
        el('zone-banner').classList.remove('show');
        syncMenu();
        showScreen('menu-overlay');
    }

    /* ========================================================================
     *  VÒNG LẶP
     * ======================================================================*/

    var last = 0;

    function frame(now) {
        requestAnimationFrame(frame);
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
        last = now;

        if (G.phase === 'play') update(dt);
        else if (G.phase === 'menu') {
            /* Màn chờ vẫn chạy cảnh — thành phố sống thì người ta muốn bấm chơi
             * hơn hẳn một tấm hình đứng im. */
            G.t += dt; G.hz += dt;
            G.camY += dt * 26;
            G.world.ensure(G.camY + H * 0.6);
            if (Math.random() < dt * 2) G.world.prune(G.camY - H * 1.8);
            stepParticles(dt);
        } else {
            stepParticles(dt);
        }
        draw();
    }

    /* ========================================================================
     *  KHỞI ĐỘNG
     * ======================================================================*/

    function boot() {
        store.load();
        Sfx.init();
        buildCanvas();
        wireInput();
        wireButtons();

        /* Thế giới của màn chờ: cùng bộ sinh, nên nền màn chờ đúng là một đoạn
         * màn thật chứ không phải hình vẽ riêng. */
        G.world = new R.World(R.dailySeed());
        G.camY = START_Y + H * 0.5;
        G.world.ensure(G.camY + H);

        syncMenu();
        showScreen('menu-overlay');
        touchButtons(false);

        /* Cửa sổ nhỏ cho check-play.js nhìn vào. Không có nó thì máy chơi thử
         * chỉ bấm mò được, mà bấm mò thì không bao giờ đi qua nổi những đoạn
         * đáng soát nhất — chỗ ép đổi tường, chỗ bám hụt lúc rơi. Một tệp
         * 1 900 dòng vẽ mỗi giây sáu mươi lần thì thứ đáng sợ không phải luật
         * chơi sai, mà là một dòng ném lỗi ở khung hình thứ mười nghìn. */
        window.ClimbDebug = { G: G, P: P, tap: doJump, tapDir: doJumpTo, web: fireWeb,
            start: startRun, R: R, pos: moverPos, hud: syncHud };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
