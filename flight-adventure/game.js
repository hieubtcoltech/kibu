/* ============================================================================
 * FLIGHT ADVENTURE KIDS — VÒNG CHƠI VÀ PHẦN VẼ
 * ----------------------------------------------------------------------------
 * Luật bay và dữ liệu tuyến nằm ở rules.js. Tệp này lo ba việc: nhận điều
 * khiển, chạy đồng hồ, và vẽ.
 *
 * ĐIỀU QUAN TRỌNG NHẤT CẦN NHỚ KHI SỬA TỆP NÀY
 * Người chơi là trẻ con năm tới mười tuổi. Nên mọi thứ ở đây đều nghiêng về
 * một phía: thà dễ quá còn hơn khó một tí. Bay thấp thì có bàn tay nâng lên.
 * Chậm quá thì tự lấy đà. Bay quá sân bay thì lượn một vòng quay lại, không
 * mất gì cả. Không có màn "thua", không có mạng, không có đồng hồ đếm ngược.
 *
 * Thứ duy nhất bé có thể làm "chưa tốt" là hạ cánh hơi nặng — và ngay cả cái
 * ấy cũng chỉ đổi tên tấm huy hiệu, chứ không chặn bé đi tiếp.
 * ==========================================================================*/
(function () {
    'use strict';

    var R = window.FlightRules;
    var W = R.W, H = R.H;

    function el(id) { return document.getElementById(id); }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function hash(a, b) { return R.hash(a, b); }
    function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

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
     *  1. SỔ LƯU — cuốn an-bum du lịch
     * ------------------------------------------------------------------------
     *  Phần thưởng của trò chơi này không phải điểm số mà là KỶ NIỆM: con dấu
     *  sân bay, tấm ảnh chụp được, số chuyến đã bay. Nên nó phải sống sót qua
     *  việc đóng trình duyệt, không thì mỗi lần mở lại là mất sạch.
     * ======================================================================*/
    var KEY = 'kibu_flight_adventure';
    var SOUND_KEY = 'kibu_flight_sound';

    var store = {
        data: {
            flights: 0,
            stamps: {},      // mã sân bay -> số lần hạ cánh
            photos: {},      // tuyến:thắng cảnh -> true
            stars: 0,
            rings: 0,
            best: {}         // tuyến -> hạng hạ cánh tốt nhất
        },
        load: function () {
            try {
                var raw = localStorage.getItem(KEY);
                if (raw) {
                    var d = JSON.parse(raw);
                    for (var k in this.data) if (d[k] != null) this.data[k] = d[k];
                }
            } catch (e) { }
        },
        save: function () {
            try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { }
        }
    };

    /* ========================================================================
     *  2. TIẾNG
     * ------------------------------------------------------------------------
     *  Một chuyến bay êm thì phần lớn thời gian chỉ có TIẾNG ĐỘNG CƠ đều đều.
     *  Nó là một nguồn ồn chạy vòng, lọc thấp, và cao độ đi theo ga — nên bé
     *  nghe được mình đang nhanh hay chậm mà không cần nhìn số. Mọi tiếng khác
     *  là chớp ngắn đặt lên trên cái nền ấy.
     * ======================================================================*/
    var MASTER_VOL = 0.8;

    var Sfx = {
        on: true, ctx: null, master: null, noise: null, eng: null,

        init: function () {
            try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { }
        },
        wake: function () {
            if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
            try {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = this.on ? MASTER_VOL : 0;
                /* Cái nén ở đầu ra: tiếng động cơ chạy liên tục, mấy tiếng
                 * chuông thì chớp ngắn. Không nén thì hoặc động cơ át chuông,
                 * hoặc vặn chuông to lên tới mức chói. */
                if (this.ctx.createDynamicsCompressor) {
                    var comp = this.ctx.createDynamicsCompressor();
                    comp.threshold.value = -20;
                    comp.knee.value = 14;
                    comp.ratio.value = 3.2;
                    comp.attack.value = 0.004;
                    comp.release.value = 0.2;
                    this.master.connect(comp);
                    comp.connect(this.ctx.destination);
                } else this.master.connect(this.ctx.destination);

                var n = Math.floor(this.ctx.sampleRate * 0.6);
                var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
                var d = buf.getChannelData(0);
                for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
                this.noise = buf;
            } catch (e) { this.ctx = null; }
        },
        toggle: function () {
            this.on = !this.on;
            if (this.master) this.master.gain.value = this.on ? MASTER_VOL : 0;
            try { localStorage.setItem(SOUND_KEY, this.on ? '1' : '0'); } catch (e) { }
            return this.on;
        },
        ready: function () {
            if (!this.on || !this.ctx) return false;
            if (this.ctx.state !== 'running') { this.ctx.resume(); return false; }
            return true;
        },

        /* Tiếng động cơ: ồn lọc thấp + một cao độ trầm rất nhẹ chồng lên. Chỉ
         * ồn thôi thì ra tiếng gió; thêm cao độ vào mới ra cái máy đang quay. */
        engine: function (level, cut, pitch) {
            if (!this.ctx || this.ctx.state !== 'running') return;
            if (!this.eng) {
                var src = this.ctx.createBufferSource();
                src.buffer = this.noise; src.loop = true;
                var f = this.ctx.createBiquadFilter();
                f.type = 'lowpass'; f.frequency.value = 400; f.Q.value = 0.8;
                var g = this.ctx.createGain(); g.gain.value = 0;
                src.connect(f); f.connect(g); g.connect(this.master);
                src.start();

                var o = this.ctx.createOscillator();
                o.type = 'sawtooth'; o.frequency.value = 70;
                var of = this.ctx.createBiquadFilter();
                of.type = 'lowpass'; of.frequency.value = 260;
                var og = this.ctx.createGain(); og.gain.value = 0;
                o.connect(of); of.connect(og); og.connect(this.master);
                o.start();

                this.eng = { g: g, f: f, o: o, og: og };
            }
            var t = this.ctx.currentTime;
            var on = this.on ? 1 : 0;
            this.eng.g.gain.setTargetAtTime(level * on, t, 0.18);
            this.eng.f.frequency.setTargetAtTime(cut, t, 0.25);
            this.eng.og.gain.setTargetAtTime(level * 0.34 * on, t, 0.18);
            this.eng.o.frequency.setTargetAtTime(pitch, t, 0.25);
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

        star: function (n) { this.tone(880 + Math.min(8, n || 0) * 55, 1320, 0.09, 'triangle', 0.085); },
        ring: function () {
            this.tone(660, 990, 0.13, 'sine', 0.075);
            this.tone(990, 1480, 0.16, 'sine', 0.05, 0.06);
        },
        /* Máy ảnh: một tiếng tách cơ khí, không phải tiếng chuông. Bé phải
         * nghe ra "vừa bấm được một cái gì đó", chứ không phải "vừa ăn điểm". */
        shutter: function () {
            this.hit(0.035, 0.16, 3800, 'highpass');
            this.hit(0.06, 0.10, 1600, 'bandpass', 0.05);
        },
        chime: function () {
            var f = [523, 659, 784, 1047];
            for (var i = 0; i < f.length; i++) this.tone(f[i], f[i] * 1.5, 0.22, 'triangle', 0.075, i * 0.09);
        },
        /* Bánh chạm đường băng: một tiếng "két" ngắn rồi tiếng lăn */
        touchdown: function () {
            this.hit(0.09, 0.16, 2600, 'bandpass');
            this.hit(0.5, 0.09, 500, 'lowpass', 0.03);
            this.tone(180, 120, 0.2, 'sine', 0.06);
        },
        /* Bàn tay đỡ: một nốt trầm ấm, KHÔNG phải tiếng báo lỗi. Báo lỗi thì
         * bé hiểu là mình vừa làm sai; nốt ấm thì bé hiểu là có người giúp. */
        assist: function () { this.tone(392, 523, 0.24, 'sine', 0.07); },
        blip: function () { this.tone(660, 880, 0.09, 'triangle', 0.05); },
        warn: function () { this.tone(880, 880, 0.12, 'square', 0.04); }
    };

    /* ========================================================================
     *  3. SÂN VÀ MÁY QUAY
     * ======================================================================*/
    var canvas, ctx, dpr = 1;

    function buildCanvas() {
        var host = el('game-canvas');
        canvas = document.createElement('canvas');
        canvas.id = 'flight-canvas';
        host.appendChild(canvas);
        ctx = canvas.getContext('2d');
        resize();
    }

    function resize() {
        /* Lấy kích thước thực của vùng chứa canvas để tính tỷ lệ.
         * Giữ H cố định (600) và tính W từ tỷ lệ thật — để game tự nhiên
         * lấp đầy mọi hình dạng màn hình mà không bị méo. */
        var host = canvas.parentElement;
        if (host) {
            var cw = host.clientWidth || 960;
            var ch = host.clientHeight || 600;
            if (cw > 0 && ch > 0) {
                H = R.H;  // giữ chiều cao logic cố định
                W = Math.round(H * (cw / ch));
            }
        }
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var stage = document.querySelector('.stage');
        if (stage) {
            stage.style.setProperty('--stage-w', W);
            stage.style.setProperty('--stage-h', H);
        }
    }

    /* ========================================================================
     *  4. TRẠNG THÁI
     * ======================================================================*/
    var G = {
        phase: 'menu',        // menu | fly | pause | done
        route: null,
        t: 0,
        /* leg: ready → roll → climb → cruise → approach → final → rollout */
        leg: 'ready',
        msg: '', msgT: 0, msgKey: '',
        auto: false,          // nút "bay giúp con"
        helped: false,        // đã phải đỡ một tay lần nào chưa
        circled: 0,
        stars: 0, rings: 0,
        shots: [],            // thắng cảnh đã chụp trong chuyến này
        ringDone: {}, starDone: {},
        flash: 0,             // chớp trắng của máy ảnh
        shake: 0,
        landVS: 0, landSpd: 0, rating: '',
        photoHint: null       // thắng cảnh đang trong tầm chụp
    };

    var P = {
        x: 0,                 // mét dọc tuyến
        z: 0,                 // mét lệch sang hai bên trục tuyến
        vz: 0,                // tốc độ lệch ngang
        turn: 0,              // -1…1, nút trái phải đang giữ
        heading: 0,           // hướng bay (radian), 0 là đi dọc tuyến X dương
        alt: 0,               // mét trên mực nước biển
        spd: 0,               // m/s
        throttle: 0,          // 0…1, ga người chơi đặt
        pitch: 0,             // -1…1, cần lái người chơi giữ
        vs: 0,                // m/s lên xuống, để vẽ độ nghiêng và chấm hạ cánh
        bank: 0,              // độ nghiêng vẽ ra
        onGround: true,
        gear: true,
        /* Nút nào đang được giữ. Khai ở đây chứ không gắn thêm dọc đường —
         * một biến chỉ hiện ra khi ai đó bấm nút là một biến không ai đọc nổi
         * bằng cách nhìn vào chỗ khai trạng thái. */
        pitchHeld: false, turnHeld: false, thrUp: 0, thrDn: 0
    };

    var parts = [];
    function addPart(x, y, vx, vy, life, col, size) {
        if (parts.length > 220) return;
        parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, max: life, col: col, s: size });
    }
    function burst(x, y, n, col, spd) {
        for (var i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, v = spd * (0.35 + Math.random() * 0.9);
            addPart(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.35 + Math.random() * 0.5,
                col, 2 + Math.random() * 3);
        }
    }

    /* ========================================================================
     *  5. LỜI NHẮC
     * ------------------------------------------------------------------------
     *  Câu ngắn, một câu một lúc, và tự tan đi. Bản mô tả cấm "long reading" —
     *  mà một đứa bé sáu tuổi đang lái máy bay thì không đọc nổi câu thứ hai.
     *
     *  Mỗi lời nhắc có một KHOÁ. Cùng khoá thì không nói lại — không có khoá
     *  thì câu "kéo nhẹ lên nào" bắn ra sáu mươi lần mỗi giây.
     * ======================================================================*/
    function say(key, text, secs) {
        if (G.msgKey === key && G.msgT > 0) return;
        G.msgKey = key;
        G.msg = text;
        G.msgT = secs || 3.2;
        var box = el('guide');
        box.textContent = text;
        box.classList.add('show');
    }
    function hushGuide() {
        G.msgT = 0; G.msgKey = '';
        el('guide').classList.remove('show');
    }

    /* ========================================================================
     *  6. BẮT ĐẦU / KẾT THÚC MỘT CHUYẾN
     * ======================================================================*/
    function startFlight(routeId) {
        G.route = R.routeById(routeId);
        G.phase = 'fly';
        G.leg = 'ready';
        G.t = 0;
        G.auto = false; G.helped = false; G.circled = 0;
        G.stars = 0; G.rings = 0;
        G.shots = [];
        G.ringDone = {}; G.starDone = {};
        G.flash = 0; G.shake = 0;
        G.landVS = 0; G.landSpd = 0; G.rating = '';
        G.photoHint = null;
        parts.length = 0;

        var rw = R.departRunway(G.route);
        P.x = rw.x0 + 120;
        P.alt = rw.y;
        P.spd = 0;
        P.z = 0; P.vz = 0; P.turn = 0; P.turnHeld = false; P.heading = 0;
        P.throttle = 0;
        P.pitch = 0;
        P.vs = 0; P.bank = 0;
        P.onGround = true;
        P.gear = true;

        /* Tên hai thành phố lấy từ chính tuyến, không chép tay vào HTML —
         * tuyến thứ hai thêm vào là thanh hành trình tự nói đúng tên. */
        el('pg-from').textContent = name(G.route.fromCity);
        el('pg-to').textContent = name(G.route.toCity);

        snapCam();

        showScreen(null);
        el('hud').hidden = false;
        el('touch-row').hidden = false;
        el('btn-land').hidden = true;
        el('btn-photo').classList.remove('is-hot');
        syncHud(true);
        setAutoBtn();
        Sfx.wake();
        say('ready', T('Ready to fly? Hold the green button!'), 4.5);
        /* Nhả tiêu điểm khỏi nút vừa bấm, không thì phím cách sau đó bấm lại
         * chính cái nút ấy và chuyến bay khởi động lại từ đầu. */
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }

    function finishFlight() {
        G.phase = 'done';
        G.leg = 'rollout';
        Sfx.engine(0, 300, 60);
        el('hud').hidden = true;
        el('touch-row').hidden = true;
        hushGuide();

        var rt = G.route;
        var d = store.data;
        d.flights++;
        d.stamps[rt.toAirport.code] = (d.stamps[rt.toAirport.code] || 0) + 1;
        d.stamps[rt.fromAirport.code] = d.stamps[rt.fromAirport.code] || 0;
        d.stars += G.stars;
        d.rings += G.rings;
        for (var i = 0; i < G.shots.length; i++) d.photos[rt.id + ':' + G.shots[i]] = true;
        var order = { assisted: 1, nice: 2, great: 3 };
        if ((order[G.rating] || 0) > (order[d.best[rt.id]] || 0)) d.best[rt.id] = G.rating;
        store.save();

        renderSummary();
        showScreen('done-overlay');
        Sfx.chime();
    }

    /* ========================================================================
     *  7. VÒNG CHẠY
     * ======================================================================*/

    /* Ga hiện tại quy ra tốc độ mong muốn. Một nguồn sự thật, vì cả phần bay,
     * phần tiếng động cơ và phần bảng điểm đều hỏi nó. */
    function targetSpd() {
        return R.SPD_MIN + (R.SPD_MAX - R.SPD_MIN) * P.throttle;
    }

    function update(dt) {
        if (G.phase !== 'fly') return;
        G.t += dt;
        if (G.msgT > 0) {
            G.msgT -= dt;
            if (G.msgT <= 0) el('guide').classList.remove('show');
        }
        if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3);
        if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);

        // Xử lý các điều kiện thời tiết động (giông bão, rung lắc, còi cảnh báo)
        var w = weatherAt(P.x);
        if (w.storm > 0.05) {
            // Rung lắc máy bay theo cường độ giông bão
            var shakeForce = w.storm * 2.2;
            G.shake = Math.max(G.shake, (Math.random() - 0.5) * shakeForce * 4.5);
            
            // Âm thanh còi cảnh báo bíp bíp ngắt quãng khi bão mạnh (> 0.3)
            if (w.storm > 0.3) {
                if (!G.lastWarnT) G.lastWarnT = 0;
                G.lastWarnT += dt;
                if (G.lastWarnT > 1.25) {
                    Sfx.warn();
                    G.lastWarnT = 0;
                }
            }
        }

        var rt = G.route;
        var dep = R.departRunway(rt), arr = R.arriveRunway(rt);

        /* ---- BAY GIÚP CON ----
         * Không phải chế độ tự động hoàn toàn: nó chỉ đặt hộ cần lái và ga,
         * còn máy ảnh vẫn của bé. Bản mô tả gọi đây là "auto-help", và điều
         * quan trọng là bé vẫn CÓ VIỆC ĐỂ LÀM khi bật nó — không thì bật xong
         * chỉ còn ngồi nhìn. */
        if (G.auto) autopilot(dt, arr);

        /* ---- ga và tốc độ ---- */
        var want = targetSpd();
        if (P.onGround && P.throttle < 0.02) want = 0;
        /* Đã chạm đất rồi thì PHANH, kệ nút ga đang giữ.
         *
         * Máy soát bắt được: bé giữ nút ga sau khi hạ cánh thì máy bay lăn
         * mãi — bốn con bọ chạy tới quãng tám mươi nghìn mét trên một đường
         * băng dài hai nghìn sáu. Hạ cánh xong là xong, cái nút ga không còn
         * quyền gì nữa. */
        if (G.leg === 'rollout') { P.throttle = 0; want = 0; }
        P.spd += clamp(want - P.spd, -R.SPD_ACCEL * dt * 1.6, R.SPD_ACCEL * dt);

        /* ---- lên xuống ---- */
        var canFly = P.spd >= R.ROTATE_SPD;
        var wantVS = 0;
        if (canFly) {
            if (P.pitch >= 0) {
                /* LÊN thì cần đà. Không phải để phạt — để bé hiểu bằng tay
                 * rằng muốn lên cao thì phải có sức, mà hiểu bằng tay thì nhớ
                 * lâu hơn mọi lời giải thích. */
                var power = clamp((P.spd - R.ROTATE_SPD) / (R.SPD_CRUISE - R.ROTATE_SPD), 0.25, 1);
                wantVS = P.pitch * R.CLIMB_RATE * power;
            } else {
                /* XUỐNG thì không cần gì cả, chỉ cần thôi giữ. Đây là chỗ máy
                 * soát bắt được lỗi nặng nhất của bản đầu: em cho lên xuống
                 * chung một hệ số nhân với đà, nên đúng lúc hạ cánh — lúc máy
                 * bay chậm nhất — nó chỉ chúc nổi 8,5 m mỗi giây trong khi vệt
                 * sáng đòi 19. Bé bay đúng cách vẫn không chạm nổi đường băng,
                 * cứ lượn vòng mãi. */
                wantVS = P.pitch * R.DESCEND_RATE;
            }
        }
        if (P.onGround && wantVS <= 0) wantVS = 0;
        P.vs = lerp(P.vs, wantVS, clamp(dt * R.LEVEL_EASE * 1.6, 0, 1));
        P.alt += P.vs * dt;

        /* ---- BẺ SÚ HƯỚNG 360 ĐỘ ----
         * Không còn bị giới hạn bởi trục Z nữa, bé có thể lái máy bay lượn vòng
         * tròn 360 độ tự do, bay ngược về Hà Nội hoặc đi bất cứ đâu. */
        if (!P.onGround) {
            // Trong khi bay, tốc độ đổi hướng tỷ lệ thuận với độ nghiêng cánh nhưng có quán tính lớn (yawRate chậm lại)
            P.heading -= P.bank * 0.45 * dt;
        } else {
            // Khi lăn trên mặt đất, bánh lái mũi dẫn hướng mượt mà
            P.heading += P.turn * 0.45 * dt;
        }
        if (P.heading > Math.PI) P.heading -= Math.PI * 2;
        if (P.heading < -Math.PI) P.heading += Math.PI * 2;

        var vx = P.spd * Math.cos(P.heading);
        var vz = P.spd * Math.sin(P.heading);

        P.x += vx * dt;
        P.z += vz * dt;

        if (!G.auto && !P.turnHeld) P.turn = lerp(P.turn, 0, clamp(dt * R.LEVEL_EASE, 0, 1));

        /* Buông tay thì cần lái tự về giữa */
        if (!G.auto && !P.pitchHeld) P.pitch = lerp(P.pitch, 0, clamp(dt * R.LEVEL_EASE, 0, 1));

        /* ---- mặt đất ---- */
        var gnd = R.groundAt(rt, P.x);
        var onRunway = (P.x >= dep.x0 && P.x <= dep.x1) || (P.x >= arr.x0 && P.x <= arr.x1);

        /* TRÊN ĐƯỜNG BĂNG VÀ ĐÃ XUỐNG THẤP THÌ MÁY BAY TỰ ĐẶT XUỐNG.
         *
         * Đây là chỗ máy soát bắt được cái lỗi khó thấy nhất của bản đầu.
         * Cần lái đi theo sai lệch so với vệt sáng, nên càng tới gần đúng độ
         * cao thì sai lệch càng nhỏ, cần lái càng nhẹ, và tốc độ tụt tiến về
         * không — máy bay bay là là suốt hai cây số đường băng mà KHÔNG BAO
         * GIỜ chạm, rồi bay quá, rồi lượn lại, mãi mãi. Bốn trong sáu con bọ
         * kẹt đúng kiểu ấy, và không kiểu bấm nào thoát ra được.
         *
         * Phi công thật giải bài này bằng một nhịp gọi là flare: về ga, giữ
         * mũi, để máy bay từ từ ngồi xuống. Ở đây cũng thế — một cú tụt đều
         * 2,5 m mỗi giây, đủ chậm để tính là hạ cánh êm. */
        if (G.leg === 'final' && P.x >= arr.x0 && !P.onGround && P.alt < gnd + 200) {
            /* Tụt nhanh khi còn cao, chậm dần khi tới gần — nên bao giờ cũng
             * ngồi xuống êm, dù bắt đầu từ độ cao nào trong tầm bắt. Cửa sổ
             * bắt rộng 200 m là cố ý: máy soát cho thấy bé bay men theo vệt
             * sáng vẫn tới đầu đường băng cao hơn nó chừng 130 m, vì mắt bám
             * theo một vệt sáng bao giờ cũng trễ một nhịp. Cửa hẹp thì đúng
             * những bé chịu khó nhất lại là những bé bị bắt bay lại. */
            var settle = -clamp((P.alt - gnd) / 12, 2.5, 12);
            if (P.vs > settle) {
                P.vs = settle;
                P.alt += P.vs * dt;
            }
        }

        /* ĐANG NHẤC MŨI LÊN thì mặt đất không được giữ chân nữa.
         *
         * Đây là lỗi nặng nhất mà máy soát tìm ra, và nó nặng vì nó nằm đúng ở
         * chỗ AI CŨNG ĐI QUA. Bản đầu: hễ còn sát mặt đất là ghim độ cao lại
         * và đặt tốc độ lên xuống về không — mỗi khung hình một lần. Nên bé
         * giữ ga, kéo cần lên, và KHÔNG CÓ GÌ XẢY RA. Máy bay lăn hết hai cây
         * số sáu đường băng rồi mới bò lên trời, nhờ một nhánh cứu hộ chẳng
         * liên quan gì tới cú cất cánh cả.
         *
         * Trò chơi vẫn "chạy được" — không lỗi, không kẹt, máy soát cũ nào
         * cũng bảo đạt. Chỉ có cú cất cánh, thứ hồi hộp nhất của cả chuyến, là
         * hỏng. Kiểu lỗi ấy chỉ lộ ra khi có ai đó chịu hỏi "bé kéo lên thì
         * cái gì xảy ra?" thay vì "có ai chết không?". */
        var lifting = P.vs > 0.02;

        if (P.alt <= gnd + 1 && !lifting) {
            /* Chạm đất: Cho phép bé hạ cánh tự do ở bất kỳ đâu. */
            var arrRun = R.arriveRunway(rt);
            var onArrRunway = P.x >= arrRun.x0 && P.x <= arrRun.x1 && Math.abs(P.z) < RW_HALF;

            if (onArrRunway && (G.leg === 'final' || G.leg === 'approach')) {
                // Hạ cánh ở sân bay đích để hoàn thành chặng bay
                P.alt = gnd;
                if (!P.onGround) touchDown(gnd);
                P.onGround = true;
                P.vs = 0;
            } else {
                // Hạ cánh tự do trên cỏ, đồi núi, hoặc sân bay xuất phát
                P.alt = gnd;
                if (!P.onGround) {
                    Sfx.touchdown();
                    burst(W / 2, H * 0.62, 14, 'rgba(255,255,255,0.8)', 130);
                    say('down', T('Great! We are on the ground.'), 3);
                }
                P.onGround = true;
                P.vs = 0;
            }
        } else if (P.alt < gnd) {
            P.alt = gnd;
        } else if (P.alt > gnd + 6) {
            P.onGround = false;
        }

        /* ---- bàn tay đỡ khi bay quá thấp ----
         * Chỉ tự động nâng lên nếu bé đang không chủ động điều khiển để hạ cánh hoặc bay sát đất
         * (tức là ga lớn và không giữ nút chúc mũi xuống). */
        if (!P.onGround && G.leg !== 'final' && G.leg !== 'climb' && G.leg !== 'roll') {
            var floor = R.floorAt(rt, P.x);
            if (P.alt < floor && P.vs < 2 && P.throttle > 0.3 && !P.pitchHeld) {
                P.alt += R.RESCUE_LIFT * dt;
                if (P.vs < 0) P.vs = 0;
                assistLift();
            }
        }
        if (P.alt > R.ALT_MAX) { P.alt = R.ALT_MAX; if (P.vs > 0) P.vs = 0; }

        stepLeg(dt, dep, arr);
        stepCam(dt);
        stepPickups();
        stepParticles(dt);

        /* ---- tiếng động cơ ---- */
        var f = clamp(P.spd / R.SPD_MAX, 0, 1);
        Sfx.engine(0.02 + 0.055 * f, 280 + 620 * f, 52 + 46 * f);

        /* Độ nghiêng cánh suy từ tốc độ LỆCH NGANG, không phải một biến riêng.
         * Máy bay thật nghiêng cánh để rẽ, nên cú nghiêng chính là cú rẽ đang
         * diễn ra — vẽ nó bằng một biến riêng thì có ngày hai thứ lệch nhau và
         * mắt thấy máy bay nghiêng sang trái mà nó bay sang phải. */
        P.bank = lerp(P.bank, -P.turn * 0.32, clamp(dt * 1.6, 0, 1));

        syncHud(false);
    }

    /* Đã phải đỡ một tay. Ghi nhớ để hạng hạ cánh ghi đúng là "có giúp", và
     * nói một câu ấm áp — nhưng chỉ thỉnh thoảng, không thì nó thành cái loa. */
    function assistLift() {
        if (!G.helped) Sfx.assist();
        G.helped = true;
        say('low', T('Careful! Let us lift you up a little.'), 2.4);
    }

    function autopilot(dt, arr) {
        var rt = G.route;
        var wantAlt;
        if (G.leg === 'ready' || G.leg === 'roll') {
            P.throttle = 1;
            P.pitch = P.spd >= R.ROTATE_SPD ? 0.85 : 0;
            return;
        }
        if (G.leg === 'approach' || G.leg === 'final') {
            wantAlt = R.glideAlt(rt, P.x);
            /* Ga đặt sao cho tốc độ về đúng dưới ngưỡng chạm êm — không phải
             * một con số chép tay, mà suy ngược từ chính ngưỡng ấy. Sửa ngưỡng
             * ở rules.js là chỗ này tự theo. */
            P.throttle = clamp((R.TOUCHDOWN_SPD - 10 - R.SPD_MIN) / (R.SPD_MAX - R.SPD_MIN), 0, 1);
            
            var targetHeading = 0;
            var headingError = targetHeading - P.heading;
            if (headingError > Math.PI) headingError -= Math.PI * 2;
            if (headingError < -Math.PI) headingError += Math.PI * 2;
            P.turn = clamp(-P.z / 300 + headingError * 1.5, -1, 1);
        } else {
            wantAlt = R.groundAt(rt, P.x) + R.ALT_CRUISE * 0.62;
            wantAlt = clamp(wantAlt, 700, R.ALT_MAX - 500);
            P.throttle = 0.62;

            var targetHeading = clamp(-P.z / 600, -0.6, 0.6);
            var headingError = targetHeading - P.heading;
            if (headingError > Math.PI) headingError -= Math.PI * 2;
            if (headingError < -Math.PI) headingError += Math.PI * 2;
            P.turn = clamp(headingError * 1.5, -1, 1);
        }
        var err = wantAlt - P.alt;
        P.pitch = clamp(err / 260, -1, 1);
    }

    /* ---- các chặng của chuyến bay ---- */
    function stepLeg(dt, dep, arr) {
        var rt = G.route;

        if (G.leg === 'ready') {
            if (P.spd > 6) { G.leg = 'roll'; hushGuide(); }
            return;
        }

        if (G.leg === 'roll') {
            /* Bánh xe nảy nhẹ trên khe bê-tông — không có nó thì cú chạy đà
             * chỉ là một con số tăng dần. */
            G.shake = Math.max(G.shake, 1.6 + P.spd / 40);
            if (P.spd >= R.ROTATE_SPD) say('rotate', T('Now pull up gently!'), 3);
            if (!P.onGround) {
                G.leg = 'climb';
                P.gear = true;
                hushGuide();
                Sfx.blip();
                say('off', T('You are flying! Look at the city below.'), 3.4);
            }
            /* Hết đường băng mà chưa bay lên thì nhấc hộ. Đứa bé năm tuổi giữ
             * nút ga rồi quên mất còn phải kéo lên — và cả chuyến bay không
             * được phép kết thúc ở đó. */
            if (P.x > dep.x1 - 260 && P.onGround && P.spd >= R.ROTATE_SPD) {
                P.pitch = 0.9;
                G.helped = true;
            }
            return;
        }

        if (G.leg === 'climb') {
            if (P.alt > 700) {
                P.gear = false;
                G.leg = 'cruise';
                say('cruise', T('Fly through the glowing rings!'), 3.4);
            }
            return;
        }

        if (G.leg === 'cruise') {
            if (P.x >= rt.landStart) {
                G.leg = 'approach';
                el('btn-land').hidden = false;
                say('near', T('The airport is nearby. Slow down and go down!'), 4.2);
                Sfx.blip();
            }
            return;
        }

        if (G.leg === 'approach' || G.leg === 'final') {
            if (G.leg === 'approach' && P.x > arr.x0 - 2600) {
                G.leg = 'final';
                say('final', T('Follow the light path to the runway.'), 3.6);
            }
            /* BAY QUÁ SÂN BAY THÌ LƯỢN MỘT VÒNG.
             *
             * Đây là chỗ mà một trò chơi cho người lớn sẽ ghi "hạ cánh trượt".
             * Ở đây nó chỉ là một vòng lượn: kéo tuyến lùi lại, nói một câu vui
             * vẻ, thử lại. Bé không mất gì ngoài ba mươi giây được bay thêm —
             * mà bay thêm thì có phải là mất đâu. */
            if (P.x > arr.x1 - 200 && !P.onGround) circleAround(arr);
            return;
        }

        if (G.leg === 'rollout') {
            P.pitch = 0;
            if (P.x > arr.x1 - 60) { P.x = arr.x1 - 60; P.spd = Math.min(P.spd, 12); }
            if (P.spd < 3) finishFlight();
            return;
        }
    }

    function circleAround(arr) {
        G.circled++;
        G.helped = true;
        P.x = G.route.landStart - 600;
        P.alt = R.GLIDE_ALT;
        P.vs = 0;
        G.leg = 'approach';
        Sfx.assist();
        /* SAU HAI VÒNG THÌ CẦM TAY HẲN.
         *
         * "Lượn lại thử tiếp" là một lời hứa tử tế, nhưng lượn mãi thì nó
         * thành một cái bẫy lịch sự: bé không thua, mà cũng không bao giờ
         * xong. Máy soát bắt đúng chỗ này — con bọ giữ nút kéo lên bay vòng
         * suốt mười phút mà không ai dừng nó lại. */
        if (G.circled >= R.CIRCLE_GIVE_UP) {
            G.auto = true;
            G.helped = true;
            setAutoBtn();
            say('takeover', T('Let us land together this time. Hold on!'), 4);
        } else {
            say('circle', T('Let us circle around and try the runway again!'), 4);
        }
    }

    function touchDown(gnd) {
        G.landVS = Math.abs(P.vs);
        G.landSpd = P.spd;
        G.rating = R.landRating(G.landVS, P.spd, G.helped);
        G.leg = 'rollout';
        G.shake = 9;
        P.gear = true;
        Sfx.touchdown();
        burst(W / 2, H * 0.62, 14, 'rgba(255,255,255,0.8)', 130);
        say('down', T('Great! We are on the runway.'), 3);
        el('btn-land').hidden = true;
    }

    /* ---- vòng mây và sao ---- */
    function stepPickups() {
        var rt = G.route, i, o;
        for (i = 0; i < R.ringCount(rt); i++) {
            if (G.ringDone[i]) continue;
            o = R.ringAt(rt, i);
            if (!o || Math.abs(o.x - P.x) > 400) continue;
            if (R.hitBall(o.x - P.x, o.alt - P.alt, o.z - P.z, R.RING_R)) {
                G.ringDone[i] = 1;
                G.rings++;
                Sfx.ring();
                burst(W / 2, H * 0.5, 16, 'rgba(150,230,255,0.9)', 150);
            }
        }
        for (i = 0; i < R.starCount(rt); i++) {
            if (G.starDone[i]) continue;
            o = R.starAt(rt, i);
            if (!o || Math.abs(o.x - P.x) > 300) continue;
            if (R.hitBall(o.x - P.x, o.alt - P.alt, o.z - P.z, R.STAR_PICK)) {
                G.starDone[i] = 1;
                G.stars++;
                Sfx.star(G.stars);
            }
        }

        /* thắng cảnh nào đang trong tầm chụp */
        G.photoHint = null;
        for (i = 0; i < rt.landmarks.length; i++) {
            var lm = rt.landmarks[i];
            if (G.shots.indexOf(lm.en) >= 0) continue;
            if (Math.abs(lm.at - P.x) < R.PHOTO_RANGE) { G.photoHint = lm; break; }
        }
        var cam = el('btn-photo');
        if (G.photoHint) {
            cam.classList.add('is-hot');
            say('look', T('Look, a landmark! Take a photo!'), 2.6);
        } else cam.classList.remove('is-hot');
    }

    function takePhoto() {
        if (G.phase !== 'fly' || !G.photoHint) return;
        var lm = G.photoHint;
        G.shots.push(lm.en);
        G.flash = 1;
        Sfx.shutter();
        say('shot', name(lm) + ' 📸', 2.8);
        el('btn-photo').classList.remove('is-hot');
        G.photoHint = null;
    }

    function stepParticles(dt) {
        for (var i = parts.length - 1; i >= 0; i--) {
            var p = parts[i];
            p.life -= dt;
            if (p.life <= 0) { parts.splice(i, 1); continue; }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 90 * dt;
        }
    }

    /* ========================================================================
     *  8. MÁY QUAY BÁM ĐUÔI VÀ PHÉP CHIẾU
     * ------------------------------------------------------------------------
     *  Máy quay ngồi chếch trên và sau đuôi máy bay, nhìn về phía trước. Cả
     *  trò chơi — mặt đất, nhà cửa, vòng mây, chính chiếc máy bay — đi qua
     *  đúng MỘT phép chiếu ở đây.
     *
     *  Một phép chiếu duy nhất là chuyện sống còn, không phải chuyện gọn gàng:
     *  hai phép thì có ngày vật này trông như ở trước vật kia mà mã lại tính
     *  nó ở sau, và không ai tìm ra vì sao.
     * ======================================================================*/
    var cam = { x: 0, alt: 0, z: 0, pitch: 0, yaw: 0 };

    /* Đặt máy quay đúng chỗ ngay lập tức, không bám mềm. Dùng lúc bắt đầu
     * chuyến và lúc dựng màn chờ — không có nó thì khung hình đầu tiên máy
     * quay còn nằm ở gốc toạ độ và cả thế giới vụt vào chỗ từ hư không. */
    function snapCam() {
        var back = (G.leg === 'ready' || G.leg === 'roll') ? 240 : R.CAM_BACK;
        var up = (G.leg === 'ready' || G.leg === 'roll') ? 56 : R.CAM_UP;
        cam.yaw = P.heading;
        cam.x = P.x - back * Math.cos(cam.yaw);
        cam.z = P.z - back * Math.sin(cam.yaw);
        cam.alt = P.alt + up;
        cam.pitch = 0;
    }

    function stepCam(dt) {
        var back = (G.leg === 'ready' || G.leg === 'roll') ? 240 : R.CAM_BACK;
        var up = (G.leg === 'ready' || G.leg === 'roll') ? 56 : R.CAM_UP;
        
        // Quay camera bám theo hướng bay của máy bay
        var kYaw = clamp(dt * 3.6, 0, 1);
        // Normalize angle difference to interpolate correctly
        var diff = P.heading - cam.yaw;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        cam.yaw += diff * kYaw;
        if (cam.yaw > Math.PI) cam.yaw -= Math.PI * 2;
        if (cam.yaw < -Math.PI) cam.yaw += Math.PI * 2;

        cam.x = P.x - back * Math.cos(cam.yaw);
        cam.z = P.z - back * Math.sin(cam.yaw);

        /* Máy quay bám mềm theo độ cao và độ lệch chứ không dính cứng. Dính
         * cứng thì bẻ lái một cái là cả thế giới giật sang bên; bám mềm thì
         * máy bay nhích ra khỏi giữa màn một chút rồi máy quay đuổi theo, và
         * chính cái nhích ấy mới cho mắt thấy là mình VỪA BẺ LÁI. */
        var k = clamp(dt * 3.2, 0, 1);
        cam.alt = lerp(cam.alt, P.alt + up, k);
        /* Chúc máy quay theo tốc độ lên xuống: leo lên thì thấy nhiều trời
         * hơn, chúc xuống thì thấy nhiều đất hơn. */
        cam.pitch = lerp(cam.pitch, clamp(P.vs / R.CLIMB_RATE, -1, 1) * 46, k);
    }

    function horizonY() { return R.HORIZON + cam.pitch; }

    /* Chiếu một điểm thế giới (x dọc tuyến, alt độ cao, z lệch ngang) lên màn.
     * Trả null nếu nó ở sau lưng máy quay. Hỗ trợ xoay camera 360 độ. */
    function proj(x, alt, z) {
        var dx = x - cam.x;
        var dz = z - cam.z;
        var cos = Math.cos(cam.yaw || 0);
        var sin = Math.sin(cam.yaw || 0);
        var d = dx * cos + dz * sin;
        if (d < R.NEAR) return null;
        var zProj = -dx * sin + dz * cos;
        var s = R.FOCAL / d;
        return {
            x: W / 2 + zProj * s,
            y: horizonY() + (cam.alt - alt) * s,
            s: s, d: d
        };
    }

    /* Sương mù theo khoảng cách: xa thì nhạt dần về màu trời. Không có nó thì
     * ngọn núi cách hai mươi cây số vẫn đậm y như cái nhà ngay dưới cánh, và
     * mắt mất hẳn cảm giác xa gần. */
    function haze(d) { return clamp((d - 2200) / (R.VIEW_FAR - 2200), 0, 1); }

    /* ========================================================================
     *  9. VẼ
     * ======================================================================*/

    /* Bảng màu bầu trời theo giờ trong ngày. Buổi sáng cho tuyến đầu — bản mô
     * tả đòi "bright and friendly", mà sáng sớm là thứ ánh sáng duy nhất vừa
     * sáng vừa dịu. */
    var SKIES = {
        morning: { top: '#2f8fd8', mid: '#8ed2f0', low: '#dff0f7', haze: '#dff0f7', sun: '#fff3c4' },
        sunset: { top: '#3a3d7a', mid: '#e8756b', low: '#ffc978', haze: '#ffd9a8', sun: '#fff0b0' }
    };

    /* Mặt trời cố định trong thế giới (phía trước–phải so với tuyến +X), không
     * gắn vào máy quay bám đuôi — bẻ lái thì chỉ đổi góc nhìn, không kéo mặt trời theo. */
    var SUN_WX = 80000;
    var SUN_WZ = 28000;
    var SUN_ALT = 10000;

    function skyOf() { return SKIES[G.route ? G.route.sky : 'morning'] || SKIES.morning; }

    function weatherAt(x) {
        var rt = G.route;
        if (!rt) return { storm: 0, cloudy: 0 };
        var info = R.segmentAt(rt, x);
        
        function getVal(kind) {
            if (kind === 'fields') return { storm: 0, cloudy: 0.95 };
            if (kind === 'hills' || kind === 'mountains') return { storm: 1.0, cloudy: 0 };
            return { storm: 0, cloudy: 0 };
        }
        
        var v1 = getVal(info.seg.kind);
        var v2 = getVal(info.next.kind);
        var k = info.k;
        
        return {
            storm: v1.storm + (v2.storm - v1.storm) * k,
            cloudy: v1.cloudy + (v2.cloudy - v1.cloudy) * k
        };
    }

    function currentSky() {
        var s = skyOf();
        var w = weatherAt(P.x);
        
        var top = s.top;
        var mid = s.mid;
        var low = s.low;
        var hz = s.haze;
        
        if (w.cloudy > 0) {
            top = mix(top, '#4b5563', w.cloudy);
            mid = mix(mid, '#9ca3af', w.cloudy);
            low = mix(low, '#d1d5db', w.cloudy);
            hz = mix(hz, '#d1d5db', w.cloudy);
        }
        if (w.storm > 0) {
            top = mix(top, '#0d1527', w.storm); // trời tối sầm lại
            mid = mix(mid, '#2d3748', w.storm);
            low = mix(low, '#4a5568', w.storm);
            hz = mix(hz, '#4a5568', w.storm);
        }
        return { top: top, mid: mid, low: low, haze: hz, sun: s.sun };
    }

    function drawSky() {
        var s = currentSky();
        var hz = horizonY();
        var g = ctx.createLinearGradient(0, -60, 0, hz + 30);
        g.addColorStop(0, s.top);
        g.addColorStop(0.62, s.mid);
        g.addColorStop(1, s.low);
        /* Tô kín cả màn chứ không chỉ tới đường chân trời. Mặt đất vẽ sau và
         * đè lên, nên phần dưới không bao giờ lộ ra — còn tô đúng tới chân
         * trời thì hễ máy quay chúc lên là hở một dải chưa tô ở dưới. */
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        var sp = proj(SUN_WX, SUN_ALT, SUN_WZ);
        if (sp && sp.y < hz + 24) {
            var sunX = sp.x;
            var sunY = Math.min(sp.y, hz - 28);
            var gg = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 200);
            gg.addColorStop(0, 'rgba(255,247,214,0.95)');
            gg.addColorStop(0.32, 'rgba(255,240,180,0.32)');
            gg.addColorStop(1, 'rgba(255,240,180,0)');
            ctx.fillStyle = gg;
            ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
            ctx.fillStyle = s.sun;
            ctx.beginPath(); ctx.arc(sunX, sunY, 28, 0, 6.284); ctx.fill();
        }
    }

    function drawDistantRidges() {
        var hz = horizonY();
        ctx.save();
        ctx.fillStyle = 'rgba(62,105,122,0.16)';
        ctx.beginPath();
        ctx.moveTo(0, hz + 18);
        for (var x = 0; x <= W + 80; x += 80) {
            var y = hz + 10 + Math.sin(x * 0.012 + cam.x * 0.0009) * 10 +
                Math.sin(x * 0.027 + 2.1) * 5;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

        ctx.fillStyle = 'rgba(43,85,95,0.14)';
        ctx.beginPath();
        ctx.moveTo(0, hz + 34);
        for (var x2 = 0; x2 <= W + 80; x2 += 70) {
            var y2 = hz + 30 + Math.sin(x2 * 0.018 - cam.x * 0.0011) * 13;
            ctx.lineTo(x2, y2);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    function drawMenuScene() {
        var hz = horizonY();
        drawDistantRidges();
        var g = ctx.createLinearGradient(0, hz, 0, H);
        g.addColorStop(0, '#b7d8ac');
        g.addColorStop(0.48, '#8fb57e');
        g.addColorStop(1, '#5f875c');
        ctx.fillStyle = g;
        ctx.fillRect(0, hz, W, H - hz);

        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.4;
        for (var i = 0; i < 9; i++) {
            var y = hz + 28 + i * 34;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(W * 0.28, y - 20, W * 0.62, y + 20, W, y - 8);
            ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(57,103,64,0.2)';
        ctx.beginPath();
        ctx.moveTo(W * 0.42, H);
        ctx.lineTo(W * 0.49, hz + 44);
        ctx.lineTo(W * 0.51, hz + 44);
        ctx.lineTo(W * 0.64, H);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(54,60,70,0.72)';
        ctx.beginPath();
        ctx.moveTo(W * 0.38, H);
        ctx.lineTo(W * 0.49, hz + 52);
        ctx.lineTo(W * 0.51, hz + 52);
        ctx.lineTo(W * 0.68, H);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.beginPath();
        ctx.moveTo(W * 0.52, H);
        ctx.lineTo(W * 0.5, hz + 56);
        ctx.lineTo(W * 0.505, hz + 56);
        ctx.lineTo(W * 0.56, H);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(W * 0.29, hz - 32 + Math.sin(G.t * 1.4) * 5);
        ctx.rotate(-0.12);
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = 'rgba(18,32,48,0.7)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#f5f8fc';
        roundRect(ctx, -24, -9, 48, 19, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e05a4a';
        ctx.beginPath();
        ctx.moveTo(-54, 3); ctx.lineTo(0, -12); ctx.lineTo(54, 3);
        ctx.lineTo(45, 12); ctx.lineTo(0, 6); ctx.lineTo(-45, 12);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#3aa7e0';
        ctx.fillRect(-15, -4, 30, 7);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-92, 20); ctx.bezierCurveTo(-54, 6, -28, 3, -4, 8);
        ctx.stroke();
        ctx.restore();
    }

    /* ---- MẶT ĐẤT ----
     * Vẽ thành từng dải ngang theo KHOẢNG CÁCH: dải xa mỏng, dải gần dày, đúng
     * như phối cảnh sinh ra. Mỗi dải hỏi thẳng groundAt() ở quãng ấy, nên hình
     * vẽ và chỗ máy bay va chạm là cùng một con số.
     *
     * Đi từ xa về gần để dải gần đè lên dải xa — không có thứ tự ấy thì đỉnh
     * núi phía sau chồng lên sườn đồi phía trước. */
    /* Càng nhiều dải càng mượt, mà mỗi dải chỉ tốn một nét tô chữ nhật. 46 dải
     * để lại mấy bậc thang thấy rõ ở khúc gần; 80 thì hết bậc mà vẫn rẻ. */
    var BANDS = 80;

    function drawGround() {
        var rt = G.route, s = currentSky();
        drawDistantRidges();

        /* THỢ SƠN: đi từ XA VỀ GẦN, mỗi dải tô từ đường chân trời của chính nó
         * XUỐNG HẾT ĐÁY MÀN. Dải gần hơn nằm thấp hơn nên nó phủ lại phần
         * dưới, chừa lại đúng phần trên của dải xa — và thế là đỉnh núi phía
         * sau vẫn nhô lên trên sườn đồi phía trước, không cần bộ đệm chiều sâu
         * nào cả.
         *
         * Bản đầu em tô ngược: chỉ tô khi dải mới CAO HƠN dải trước, mà đi từ
         * xa về gần thì dải sau bao giờ cũng thấp hơn — nên dải xa nhất tô kín
         * cả màn hình rồi mọi dải sau đó bị bỏ qua sạch. Nhìn ra thì mặt đất
         * chiếm nửa trên còn bầu trời nằm dưới đáy: cả thế giới lộn ngược. */
        for (var i = BANDS; i >= 0; i--) {
            /* Chia khoảng cách theo luỹ thừa chứ không đều: gần thì cần dày
             * dải, xa thì mấy chục cây số dồn vào vài dải cũng không ai thấy. */
            var t = i / BANDS;
            var d = R.NEAR + (R.VIEW_FAR - R.NEAR) * t * t;
            var cos = Math.cos(cam.yaw || 0);
            var sin = Math.sin(cam.yaw || 0);
            var wx = cam.x + d * cos;
            var wz = cam.z + d * sin;
            var g = R.groundAt(rt, wx);
            var p = proj(wx, g, wz);
            if (!p || p.y > H) continue;
            var seg = R.segmentAt(rt, wx);
            var c = terrainColour(seg.seg.kind);
            var col = seg.k > 0 ? mix(c[1], terrainColour(seg.next.kind)[1], seg.k) : c[1];
            /* càng xa càng chìm vào màu trời */
            ctx.fillStyle = mix(col, s.haze, haze(d) * 0.92);
            ctx.fillRect(0, p.y, W, H - p.y + 2);
        }

        drawGroundGrid();
        drawGroundProps();
    }

    /* ---- LƯỚI RUỘNG ----
     * Mấy đường bờ ruộng chạy dọc, hội tụ về điểm tụ. Đây là thứ DUY NHẤT nói
     * cho mắt biết mình vừa bẻ lái sang trái hay sang phải — mặt đất trơn thì
     * bẻ lái xong nhìn y hệt lúc chưa bẻ, và cái nút trái phải hoá vô nghĩa.
     * Kẻ ô thế này là cách rẻ nhất để một mặt phẳng khai ra nó là mặt phẳng. */
    function drawGroundGrid() {
        var rt = G.route;
        ctx.save();
        ctx.lineWidth = 1.2;

        /* đường dọc, cách nhau 560 m theo chiều ngang */
        var GZ = 560;
        var z0 = Math.floor((cam.z - 5200) / GZ) * GZ;
        for (var z = z0; z < cam.z + 5200; z += GZ) {
            ctx.beginPath();
            var drawn = 0;
            for (var i = 0; i <= 16; i++) {
                var t = i / 16;
                var d = 120 + (9000 - 120) * t * t;
                var wx = cam.x + d;
                var seg = R.segmentAt(rt, wx).seg;
                // Không kẻ ô trên mặt biển hoặc đồi núi hiểm trở
                if (seg.kind === 'sea' || seg.kind === 'mountains') continue;

                var p = proj(wx, R.groundAt(rt, wx), z);
                if (!p) continue;
                if (drawn++) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.03)'; // Cực kỳ mờ và nhẹ nhàng
            ctx.stroke();
        }

        /* đường ngang, cách nhau 900 m theo chiều bay */
        var GX = 900;
        var x0 = Math.ceil((cam.x + 180) / GX) * GX;
        for (var wx2 = x0; wx2 < cam.x + 9000; wx2 += GX) {
            var seg2 = R.segmentAt(rt, wx2).seg;
            if (seg2.kind === 'sea' || seg2.kind === 'mountains') continue;

            var g = R.groundAt(rt, wx2);
            var a = proj(wx2, g, cam.z - 5200), b = proj(wx2, g, cam.z + 5200);
            if (!a || !b) continue;
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.035 * (1 - haze(wx2 - cam.x))) + ')';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function terrainColour(kind) {
        return {
            city: ['#a9c19a', '#7fa070'],
            fields: ['#a8dc7c', '#74b855'],
            hills: ['#7cc667', '#4f9a4e'],
            mountains: ['#94a58f', '#5d6f58'],
            coast: ['#f0dfb0', '#dcc48c'],
            sea: ['#3fa9d8', '#2a8fc0']
        }[kind] || ['#a8dc7c', '#74b855'];
    }

    function mix(a, b, t) {
        function hx(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
        var A = hx(a), B = hx(b), o = '#';
        for (var i = 0; i < 3; i++) {
            var v = Math.round(A[i] + (B[i] - A[i]) * t).toString(16);
            o += v.length < 2 ? '0' + v : v;
        }
        return o;
    }

    /* ---- ĐỒ VẬT TRÊN MẶT ĐẤT ----
     * Nhà, cây, sóng, thuyền. Chỗ đứng suy từ toạ độ nên chúng không nhấp
     * nháy, và cỡ vẽ suy từ hệ số chiếu nên chúng tự lớn lên khi tới gần —
     * không có một dòng nào chỉnh tay theo khoảng cách. */
    function drawGroundProps() {
        var rt = G.route;
        var STEP = 330;                         // mét giữa hai cụm theo chiều bay
        var x0 = Math.ceil((cam.x + 200) / STEP) * STEP;
        var list = [];

        var dep = R.departRunway(rt), arr = R.arriveRunway(rt);

        for (var wx = x0; wx < cam.x + 8600; wx += STEP) {
            var kind = R.segmentAt(rt, wx).seg.kind;
            var g = R.groundAt(rt, wx);
            /* KHÔNG DỰNG NHÀ TRONG SÂN BAY.
             *
             * Nhìn cảnh vào hạ cánh mới thấy: cả một rừng cao ốc mọc chồng lên
             * đúng dải đường băng, và cái thứ bé cần nhìn thấy nhất trong cả
             * chuyến bay thì lẫn mất trong đó. Sân bay thật quang cả cây số
             * quanh đường băng, đúng vì lý do ấy. */
            var atField = (wx > dep.x0 - 900 && wx < dep.x1 + 900) ||
                (wx > arr.x0 - 900 && wx < arr.x1 + 900);
            if (atField) continue;
            for (var lane = -2; lane <= 2; lane++) {
                var idx = Math.round(wx / STEP) * 8 + lane;
                var z = lane * 1020 + (hash(idx, 1) - 0.5) * 640;
                if (Math.abs(z - cam.z) > 4200) continue;
                var p = proj(wx + hash(idx, 5) * 180, g, z);
                if (!p || p.x < -140 || p.x > W + 140 || p.y > H + 120) continue;
                list.push({ p: p, kind: kind, idx: idx, g: g, wx: wx, z: z });
            }
        }
        /* xa vẽ trước, gần vẽ sau — thứ tự này là tất cả những gì thay cho một
         * bộ đệm chiều sâu thật */
        list.sort(function (a, b) { return b.p.d - a.p.d; });
        for (var i = 0; i < list.length; i++) prop(list[i]);
    }

    function prop(o) {
        var p = o.p, idx = o.idx, s = p.s;
        var fade = 1 - haze(p.d);
        if (fade < 0.06) return;
        ctx.save();
        ctx.globalAlpha = fade;
        var r1 = hash(idx, 2), r2 = hash(idx, 3);

        if (o.kind === 'city') {
            var n = 2 + (r1 > 0.55 ? 1 : 0);
            for (var b = 0; b < n; b++) {
                var bw = (28 + hash(idx, b + 21) * 28) * s;
                var bh = (70 + hash(idx, b + 31) * 220) * s;
                var bx = p.x + (b - 1) * 36 * s;
                if (bh < 0.6) continue;

                // Cửa sổ kính phản quang gradient cho nhà cao tầng hiện đại
                var bGrad = ctx.createLinearGradient(bx, p.y - bh, bx + bw, p.y);
                if (hash(idx, b + 41) > 0.5) {
                    bGrad.addColorStop(0, '#2563eb'); // xanh dương sapphire sang trọng
                    bGrad.addColorStop(0.5, '#1d4ed8');
                    bGrad.addColorStop(1, '#1e3a8a');
                } else {
                    bGrad.addColorStop(0, '#475569'); // màu thép xám hiện đại
                    bGrad.addColorStop(0.5, '#334155');
                    bGrad.addColorStop(1, '#1e293b');
                }
                ctx.fillStyle = bGrad;
                ctx.fillRect(bx, p.y - bh, bw, bh);

                // Đường viền sáng bóng bẩy dọc cạnh trái nhà
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.fillRect(bx, p.y - bh, bw * 0.12, bh);

                // Cột thu lôi / Anten trên đỉnh tòa nhà
                if (hash(idx, b + 51) > 0.62) {
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = Math.max(1, 1.2 * s);
                    ctx.beginPath();
                    ctx.moveTo(bx + bw * 0.5, p.y - bh);
                    ctx.lineTo(bx + bw * 0.5, p.y - bh - 16 * s);
                    ctx.stroke();
                    // Đèn cảnh báo nhấp nháy đỏ trên đỉnh anten
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(bx + bw * 0.5, p.y - bh - 16 * s, Math.max(1.5, 2.5 * s), 0, 6.284);
                    ctx.fill();
                }

                // Vẽ các ô cửa sổ sáng đèn lung linh
                ctx.fillStyle = '#fef08a'; // màu vàng ấm áp
                var rows = Math.floor(bh / (14 * s));
                var cols = Math.floor(bw / (10 * s));
                for (var r = 1; r < rows - 1; r++) {
                    if (hash(idx, b * 3 + r) > 0.45) continue; // chọn ngẫu nhiên các tầng sáng đèn
                    for (var c = 1; c < cols - 1; c++) {
                        if (hash(idx, b * 7 + c + r) > 0.5) continue;
                        ctx.fillRect(bx + c * 10 * s, p.y - bh + r * 14 * s, 3.5 * s, 5 * s);
                    }
                }
            }
        } else if (o.kind === 'fields') {
            // Thảm cỏ ruộng xanh mướt bo tròn
            ctx.fillStyle = r1 > 0.5 ? '#86efac' : '#a7f3d0';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 160 * s, 26 * s, 0, 0, 6.284);
            ctx.fill();

            if (r2 < 0.32) {
                // 1. Ao hồ nước xanh biếc lấp lánh phản chiếu mây trời giữa thung lũng cỏ
                var lw = (55 + r1 * 75) * s;
                var lh = (14 + r2 * 20) * s;
                // Bờ cát vàng bảo vệ quanh hồ nước
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, lw + 2.5 * s, lh + 1.8 * s, 0, 0, 6.284);
                ctx.fill();
                // Mặt hồ phẳng lặng màu ngọc bích
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, lw, lh, 0, 0, 6.284);
                ctx.fill();
                // Vệt nắng chiếu lấp lánh nhẹ nhàng trên mặt nước hồ
                ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
                ctx.beginPath();
                ctx.ellipse(p.x - lw * 0.15, p.y - lh * 0.1, lw * 0.45, lh * 0.15, 0.1, 0, 6.284);
                ctx.fill();
            } else if (r2 >= 0.32 && r2 < 0.62) {
                // 2. Cây cổ thụ (Oak Tree) tán lá tròn xum xuê bóng đổ
                var th = (16 + r1 * 14) * s;
                // Thân cây gỗ nâu sẫm
                ctx.fillStyle = '#78350f';
                ctx.fillRect(p.x - 2.5 * s, p.y - th * 0.36, 5 * s, th * 0.36);
                
                // Tán lá to xum xuê màu xanh cỏ mướt mát có chiều sâu
                var grLeaf = ctx.createRadialGradient(p.x, p.y - th * 0.68, 2 * s, p.x, p.y - th * 0.68, 12 * s);
                grLeaf.addColorStop(0, '#4ade80');
                grLeaf.addColorStop(0.7, '#16a34a');
                grLeaf.addColorStop(1, '#15803d');
                ctx.fillStyle = grLeaf;
                ctx.beginPath();
                ctx.arc(p.x, p.y - th * 0.68, 12 * s, 0, 6.284);
                ctx.fill();
            } else {
                // 3. Cụm làng quê ấm cúng (Clustering cottages) với nhiều nhà cạnh nhau sơn màu phong phú
                var numHouses = r1 > 0.62 ? 2 : 1;
                for (var h = 0; h < numHouses; h++) {
                    var hx = p.x + (h - 0.5 * (numHouses - 1)) * 22 * s;
                    var hy = p.y;
                    var hw = (13 + hash(idx, h + 15) * 7) * s;
                    var hh = (14 + hash(idx, h + 25) * 5) * s;
                    
                    // Thân nhà gạch/gỗ màu trắng sữa hoặc kem nhạt
                    ctx.fillStyle = h === 0 ? '#fef3c7' : '#fafaf9';
                    ctx.fillRect(hx - hw / 2, hy - hh, hw, hh);
                    
                    // Mái ngói dốc tam giác đỏ gạch hoặc xanh lam nổi bật
                    ctx.fillStyle = h === 0 ? '#ef4444' : '#2563eb';
                    ctx.beginPath();
                    ctx.moveTo(hx, hy - hh - 7 * s);
                    ctx.lineTo(hx + hw / 2 + 1.8 * s, hy - hh);
                    ctx.lineTo(hx - hw / 2 - 1.8 * s, hy - hh);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Cửa ra vào màu nâu gỗ
                    ctx.fillStyle = '#b4530f';
                    ctx.fillRect(hx - 3 * s, hy - 8 * s, 6 * s, 8 * s);
                    
                    // Cửa sổ vuông tỏa sáng đèn vàng ấm áp biểu thị có người ở trong nhà
                    ctx.fillStyle = '#fde047';
                    ctx.fillRect(hx - hw / 3.2, hy - hh * 0.72, 3.2 * s, 3.2 * s);
                }
            }
        } else if (o.kind === 'hills' || o.kind === 'mountains') {
            if (r1 > 0.35) {
                var th = (18 + r2 * 16) * s;
                // Thân cây thông bằng gỗ nâu sẫm
                ctx.fillStyle = '#78350f';
                ctx.fillRect(p.x - th * 0.05, p.y - th * 0.16, th * 0.1, th * 0.16);

                // Tán lá thông 3 tầng xếp chồng tuyệt đẹp
                var layers = 3;
                var baseCol = o.kind === 'mountains' ? '#0f5132' : '#15803d';
                var lightCol = o.kind === 'mountains' ? '#146c43' : '#166534';
                
                for (var l = 0; l < layers; l++) {
                    var ly0 = p.y - th * (0.12 + l * 0.28);
                    var ly1 = p.y - th * (0.52 + l * 0.26);
                    var lw = th * (0.38 - l * 0.11);

                    var gr = ctx.createLinearGradient(p.x - lw, ly0, p.x + lw, ly0);
                    gr.addColorStop(0, baseCol);
                    gr.addColorStop(0.5, lightCol);
                    gr.addColorStop(1, baseCol);
                    ctx.fillStyle = gr;

                    ctx.beginPath();
                    ctx.moveTo(p.x, ly1);
                    ctx.lineTo(p.x + lw, ly0);
                    ctx.lineTo(p.x - lw, ly0);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            if (o.kind === 'mountains' && o.g > 1250 && r2 > 0.55) {
                // Đỉnh núi phủ tuyết trắng tinh khôi ở những vùng núi cao
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - th);
                ctx.lineTo(p.x + th * 0.1, p.y - th * 0.72);
                ctx.lineTo(p.x - th * 0.1, p.y - th * 0.72);
                ctx.closePath();
                ctx.fill();
            }
        } else if (o.kind === 'coast') {
            // Con sóng bờ biển cuộn nhẹ nhàng
            ctx.fillStyle = 'rgba(255,255,255,0.72)';
            ctx.fillRect(p.x - 130 * s, p.y + Math.sin(G.t * 1.6 + idx) * 4 * s, 260 * s, 6 * s);
        } else if (o.kind === 'sea') {
            // Vẽ các hòn đảo xanh mướt (emerald green) nhô lên trên biển cả
            if (r1 > 0.42) {
                var iw = (180 + r2 * 260) * s;
                var ih = (40 + hash(idx, 99) * 60) * s;
                ctx.fillStyle = '#10b981'; // màu xanh lục bảo bãi biển
                ctx.beginPath();
                ctx.ellipse(p.x, p.y + 10 * s, iw, ih, 0, 0, 6.284);
                ctx.fill();

                // Viền bờ cát vàng nhạt quanh đảo
                ctx.strokeStyle = '#fef08a';
                ctx.lineWidth = Math.max(1, 2.8 * s);
                ctx.stroke();

                // Đỉnh đồi phủ cây rừng sẫm màu ở giữa đảo
                if (r2 > 0.58) {
                    var th = ih * 0.65;
                    ctx.fillStyle = '#065f46';
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y - th);
                    ctx.lineTo(p.x + th * 0.6, p.y);
                    ctx.lineTo(p.x - th * 0.6, p.y);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }

    /* ---- MÂY ----
     * Mấy khối tròn đặt ở toạ độ thật, chiếu như mọi thứ khác — nên bay xuyên
     * qua một đám mây là bay xuyên qua thật, nó phình to ra rồi trôi vụt qua
     * hai bên. Bản 2D cũ chỉ dán mây lên nền, không bao giờ tới gần được. */
    var CLOUD_GAP = 560;

    function drawClouds() {
        var x0 = Math.ceil((cam.x + 120) / CLOUD_GAP) * CLOUD_GAP;
        var list = [];
        for (var wx = x0; wx < cam.x + 13000; wx += CLOUD_GAP) {
            var idx = Math.round(wx / CLOUD_GAP);
            if (hash(idx, 71) > 0.6) continue;
            var z = (hash(idx, 73) - 0.5) * 7000;
            var alt = 900 + hash(idx, 77) * 2200;
            var p = proj(wx, alt, z);
            if (!p || p.x < -300 || p.x > W + 300) continue;
            list.push({ p: p, r: (150 + hash(idx, 79) * 190) });
        }
        list.sort(function (a, b) { return b.p.d - a.p.d; });
        ctx.save();
        ctx.fillStyle = '#ffffff';
        for (var i = 0; i < list.length; i++) {
            var o = list[i];
            ctx.globalAlpha = 0.42 + 0.4 * (1 - haze(o.p.d));
            puff(o.p.x, o.p.y, o.r * o.p.s);
        }
        ctx.restore();
    }

    function puff(x, y, r) {
        if (r < 1.2) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.56);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.62, 0, 6.284);
        ctx.arc(r * 0.6, r * 0.14, r * 0.46, 0, 6.284);
        ctx.arc(-r * 0.62, r * 0.17, r * 0.42, 0, 6.284);
        ctx.arc(r * 0.08, -r * 0.34, r * 0.46, 0, 6.284);
        ctx.fill();
        ctx.restore();
    }

    /* ---- ĐƯỜNG BĂNG ----
     * Một hình thang, bốn góc chiếu thật. Đây là thứ mà phối cảnh làm được còn
     * bản 2D thì không: nhìn thấy đường băng chạy thẳng về phía mình, biết
     * ngay mình đang lệch sang trái hay sang phải bao nhiêu. */
    var RW_HALF = 34;              // nửa bề rộng đường băng, mét

    function drawRunway(rw, arriving) {
        var pts = [];
        var startX = arriving ? rw.x0 : rw.x0 - 500;
        var visStart = Math.max(startX, cam.x + R.NEAR);
        var endX = rw.x1;
        
        // Đoạn chia vạch cố định 32m để đồng bộ chuẩn xác với vận tốc di chuyển thật của máy bay
        var step = 32; 
        var firstX = Math.ceil(visStart / step) * step;
        var limitX = Math.min(endX, visStart + 1800); // Chỉ vẽ tối đa 1800m phía trước để tối ưu hiệu năng
        
        for (var wx = firstX; wx <= limitX; wx += step) {
            var l = proj(wx, rw.y, -RW_HALF), r = proj(wx, rw.y, RW_HALF);
            if (!l || !r) continue;
            pts.push({ l: l, r: r, wx: wx });
        }
        if (pts.length < 2) return;

        ctx.save();
        /* Runway tự nó là vật thể chính của cảnh cất cánh: bê-tông chạy dài,
         * hai vai đường tối, vạch mép và vạch tim. Không vẽ thêm thảm cỏ nào
         * cùng hệ với runway, vì ở góc camera thấp thảm ấy sẽ chui vào giữa
         * đường băng và nhìn như một mảng xanh lỗi. */
        ctx.fillStyle = '#323946';
        band(pts, RW_HALF + 4);
        ctx.fillStyle = '#5f6875';
        band(pts, RW_HALF);
        ctx.fillStyle = '#747d89';
        band(pts, RW_HALF * 0.84);

        edgeLine(-RW_HALF * 0.9, 'rgba(230,238,245,0.9)', 2.4);
        edgeLine(RW_HALF * 0.9, 'rgba(230,238,245,0.9)', 2.4);
        edgeLine(-RW_HALF * 0.55, 'rgba(255,255,255,0.16)', 1.6);
        edgeLine(RW_HALF * 0.55, 'rgba(255,255,255,0.16)', 1.6);

        /* vạch tim đứt quãng */
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        for (var k = 0; k < pts.length - 1; k++) {
            if (k % 2) continue;
            var a = proj(pts[k].wx, rw.y + 0.2, -2.6), b = proj(pts[k].wx, rw.y + 0.2, 2.6);
            var c = proj(pts[k + 1].wx, rw.y + 0.2, 2.6), d = proj(pts[k + 1].wx, rw.y + 0.2, -2.6);
            if (!a || !b || !c || !d) continue;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
            ctx.closePath(); ctx.fill();
        }

        for (var e = 0; e < pts.length; e += 2) {
            var lp = proj(pts[e].wx, rw.y + 3, -RW_HALF - 8);
            var rp = proj(pts[e].wx, rw.y + 3, RW_HALF + 8);
            if (!lp || !rp) continue;
            if (lp.y > H - 125 || rp.y > H - 125) continue;
            var aEdge = 0.22 + 0.38 * (1 - haze(lp.d));
            ctx.fillStyle = 'rgba(255,245,178,' + aEdge + ')';
            ctx.beginPath(); ctx.arc(lp.x, lp.y, clamp(4.7 * lp.s, 1.1, 3.6), 0, 6.284); ctx.fill();
            ctx.beginPath(); ctx.arc(rp.x, rp.y, clamp(4.7 * rp.s, 1.1, 3.6), 0, 6.284); ctx.fill();
        }
        /* Đèn đầu đường băng nhấp nháy so le — thứ SÁNG NHẤT khung hình lúc hạ
         * cánh, vì mắt trẻ con đi theo chỗ sáng nhất. */
        if (arriving) {
            for (var i2 = 0; i2 < 7; i2++) {
                var lz = -RW_HALF - 30 + i2 * ((RW_HALF + 30) * 2 / 6);
                var p = proj(rw.x0 - 40, rw.y + 8, lz);
                if (!p) continue;
                var blink = Math.sin(G.t * 7 - i2 * 0.6) > -0.2;
                ctx.fillStyle = blink ? '#fff3a8' : 'rgba(255,243,168,0.25)';
                ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1.5, 9 * p.s), 0, 6.284); ctx.fill();
            }
        }
        ctx.restore();

        function band(list, half) {
            ctx.beginPath();
            var started = false, i3;
            for (i3 = 0; i3 < list.length; i3++) {
                var q = proj(list[i3].wx, rw.y, -half);
                if (!q) continue;
                if (started) ctx.lineTo(q.x, q.y); else { ctx.moveTo(q.x, q.y); started = true; }
            }
            for (i3 = list.length - 1; i3 >= 0; i3--) {
                var q2 = proj(list[i3].wx, rw.y, half);
                if (!q2) continue;
                ctx.lineTo(q2.x, q2.y);
            }
            ctx.closePath(); ctx.fill();
        }

        function edgeLine(z, col, w) {
            ctx.strokeStyle = col;
            ctx.lineWidth = w;
            ctx.beginPath();
            var started = false;
            for (var j = 0; j < pts.length; j++) {
                var q = proj(pts[j].wx, rw.y + 0.4, z);
                if (!q) continue;
                if (started) ctx.lineTo(q.x, q.y); else { ctx.moveTo(q.x, q.y); started = true; }
            }
            ctx.stroke();
        }
    }

    /* ---- VỆT SÁNG DẪN HẠ CÁNH ----
     * Mấy vòng sáng treo giữa trời, đúng trên trục đường băng, chúc dần xuống.
     * Trẻ con không đọc được góc chúc, nhưng "chui qua mấy cái vòng sáng" thì
     * đứa nào cũng làm được — và đó là toàn bộ phần dạy hạ cánh của game này. */
    function drawGlide() {
        if (G.leg !== 'approach' && G.leg !== 'final') return;
        var rt = G.route;
        ctx.save();
        /* Bắt đầu từ 700 m phía trước, không phải 300. Gần hơn thế thì mấy
         * vòng chồng lên nhau ngay quanh máy bay và đọc ra một cột khói xám
         * chứ không ra một lối đi. */
        for (var i = 0; i < 20; i++) {
            var wx = Math.ceil((P.x + 700) / 600) * 600 + i * 600;
            if (wx > rt.len) break;
            var p = proj(wx, R.glideAlt(rt, wx), 0);
            if (!p || p.x < -60 || p.x > W + 60) continue;
            var tw = 0.4 + 0.6 * Math.abs(Math.sin(G.t * 3 - i * 0.5));
            ctx.strokeStyle = 'rgba(180,240,255,' + (tw * 0.85 * (1 - haze(p.d))) + ')';
            ctx.lineWidth = Math.max(1.4, 6 * p.s);
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(3, 30 * p.s), 0, 6.284);
            ctx.stroke();
        }
        ctx.restore();
    }

    /* ---- THẮNG CẢNH ----
     * Không phải vật cản, không đụng vào ai. Chúng là phần thưởng cho việc
     * chịu nhìn ra ngoài cửa sổ. */
    function drawLandmarks() {
        var rt = G.route;
        for (var i = 0; i < rt.landmarks.length; i++) {
            var lm = rt.landmarks[i];
            var g = R.groundAt(rt, lm.at);
            var p = proj(lm.at, g, lm.z || 0);
            if (!p || p.x < -320 || p.x > W + 320) continue;
            var s = p.s, fade = 1 - haze(p.d);
            if (fade < 0.05) continue;
            var shot = G.shots.indexOf(lm.en) >= 0;

            ctx.save();
            ctx.globalAlpha = fade;
            if (lm.kind === 'lake') {
                ctx.fillStyle = '#3fa9d8';
                ctx.beginPath(); ctx.ellipse(p.x, p.y, 320 * s, 74 * s, 0, 0, 6.284); ctx.fill();
                ctx.fillStyle = '#2f8f4a';
                ctx.beginPath(); ctx.arc(p.x + 40 * s, p.y - 6 * s, 34 * s, 0, 6.284); ctx.fill();
                ctx.fillStyle = '#c8963e';
                ctx.fillRect(p.x + 28 * s, p.y - 74 * s, 26 * s, 70 * s);
            } else if (lm.kind === 'river') {
                ctx.strokeStyle = '#4fb6e0';
                ctx.lineWidth = Math.max(2, 58 * s);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(p.x - 500 * s, p.y + 20 * s);
                ctx.quadraticCurveTo(p.x - 140 * s, p.y - 60 * s, p.x + 90 * s, p.y + 8 * s);
                ctx.quadraticCurveTo(p.x + 320 * s, p.y + 70 * s, p.x + 600 * s, p.y - 14 * s);
                ctx.stroke();
            } else if (lm.kind === 'pass') {
                ctx.strokeStyle = '#e6dcc4';
                ctx.lineWidth = Math.max(1.6, 26 * s);
                ctx.beginPath();
                ctx.moveTo(p.x - 400 * s, p.y + 80 * s);
                ctx.quadraticCurveTo(p.x, p.y - 110 * s, p.x + 400 * s, p.y + 70 * s);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath(); ctx.ellipse(p.x, p.y + 26 * s, 360 * s, 54 * s, 0, 0, 6.284); ctx.fill();
            } else if (lm.kind === 'beach') {
                ctx.fillStyle = '#f2e2b6';
                ctx.fillRect(p.x - 560 * s, p.y - 14 * s, 1120 * s, 56 * s);
                ctx.fillStyle = 'rgba(255,255,255,0.82)';
                ctx.fillRect(p.x - 560 * s, p.y + 34 * s + Math.sin(G.t * 2) * 6 * s, 1120 * s, 16 * s);
                for (var u = 0; u < 5; u++) {
                    ctx.fillStyle = '#ff7a59';
                    ctx.beginPath();
                    ctx.arc(p.x - 340 * s + u * 170 * s, p.y - 20 * s, 24 * s, Math.PI, 0);
                    ctx.fill();
                }
            } else if (lm.kind === 'bridge') {
                /* CỠ THẬT, KHÔNG PHẢI CỠ CHO ĐẸP.
                 *
                 * Bản đầu em vẽ con sông rộng 1 200 m và ba nhịp cầu mỗi nhịp
                 * 300 m. Nhìn từ xa thì đẹp; bay tới gần thì cả cây cầu tràn
                 * kín màn hình như một vệt sơn cam khổng lồ, che mất cả sân
                 * bay ngay sau nó. Cầu Rồng thật dài 666 m và rộng 37 — vẽ
                 * đúng cỡ ấy thì nó tự lớn dần lên khi bay tới, đúng như mọi
                 * thứ khác, và bé đọc được khoảng cách từ chính cái cầu. */
                ctx.fillStyle = '#4fb6e0';
                ctx.fillRect(p.x - 300 * s, p.y + 2 * s, 600 * s, 26 * s);
                ctx.strokeStyle = '#f0a03c';
                ctx.lineWidth = Math.max(1.5, 11 * s);
                ctx.lineCap = 'round';
                ctx.beginPath();
                for (var b = 0; b < 3; b++) {
                    ctx.moveTo(p.x - 210 * s + b * 150 * s, p.y - 4 * s);
                    ctx.quadraticCurveTo(p.x - 135 * s + b * 150 * s, p.y - 52 * s,
                        p.x - 60 * s + b * 150 * s, p.y - 4 * s);
                }
                ctx.stroke();
                ctx.fillStyle = '#f0a03c';
                ctx.beginPath(); ctx.arc(p.x + 230 * s, p.y - 22 * s, 15 * s, 0, 6.284); ctx.fill();
            }

            /* Nhãn tên. Chỉ hiện khi đã tới gần — hiện từ xa thì cả bầu trời
             * đầy chữ, mà chữ thì đứa bé sáu tuổi bỏ qua hết. */
            var near = Math.abs(lm.at - P.x) < R.PHOTO_RANGE;
            if (near || (shot && p.d < 3000)) {
                var label = name(lm);
                ctx.globalAlpha = 1;
                ctx.font = '700 15px Baloo 2, Nunito, sans-serif';
                ctx.textAlign = 'center';
                var tw = ctx.measureText(label).width;
                var ly = clamp(p.y - Math.max(60, 240 * s), 40, H - 60);
                /* Kéo nhãn về trong màn. Bay sát ngay trên một thắng cảnh thì
                 * chỗ chiếu của nó rơi ra ngoài mép, và bản đầu để nhãn rơi
                 * theo — hiện ra một cái tên dán ở rìa trái chẳng dính vào cái
                 * gì, trông như một lỗi hiển thị. Kéo về thì nó vẫn chỉ đúng
                 * hướng, chỉ là đứng ở mép. */
                var lx = clamp(p.x, tw / 2 + 18, W - tw / 2 - 18);
                ctx.fillStyle = shot ? 'rgba(60,160,90,0.92)' : 'rgba(20,32,50,0.78)';
                roundRect(ctx, lx - tw / 2 - 12, ly - 15, tw + 24, 24, 12);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText((shot ? '📷 ' : '') + label, lx, ly + 2);
                ctx.strokeStyle = shot ? 'rgba(60,160,90,0.6)' : 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(lx, ly + 9); ctx.lineTo(p.x, p.y - 8); ctx.stroke();
            }
            ctx.restore();
        }
    }

    /* ---- VÒNG MÂY VÀ SAO ---- */
    function drawPickups() {
        var rt = G.route, i, o, p;
        var list = [];
        for (i = 0; i < R.ringCount(rt); i++) {
            if (G.ringDone[i]) continue;
            o = R.ringAt(rt, i);
            if (!o) continue;
            p = proj(o.x, o.alt, o.z);
            if (!p || p.d > 7000 || p.x < -200 || p.x > W + 200) continue;
            list.push({ p: p, ring: 1, i: i });
        }
        for (i = 0; i < R.starCount(rt); i++) {
            if (G.starDone[i]) continue;
            o = R.starAt(rt, i);
            if (!o) continue;
            p = proj(o.x, o.alt, o.z);
            if (!p || p.d > 5000 || p.x < -80 || p.x > W + 80) continue;
            list.push({ p: p, ring: 0, i: i });
        }
        list.sort(function (a, b) { return b.p.d - a.p.d; });

        for (i = 0; i < list.length; i++) {
            var it = list[i], q = it.p;
            var fade = 1 - haze(q.d) * 0.7;
            ctx.save();
            ctx.globalAlpha = fade;
            if (it.ring) {
                var rr = R.RING_R * q.s;
                var pulse = 1 + Math.sin(G.t * 3 + it.i) * 0.04;
                ctx.strokeStyle = 'rgba(88,205,255,0.22)';
                ctx.lineWidth = Math.max(5, 34 * q.s);
                ctx.beginPath(); ctx.arc(q.x, q.y, rr * pulse, 0, 6.284); ctx.stroke();
                ctx.strokeStyle = 'rgba(150,235,255,0.95)';
                ctx.lineWidth = Math.max(2, 16 * q.s);
                ctx.beginPath(); ctx.arc(q.x, q.y, rr * pulse, 0, 6.284); ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = Math.max(1, 6 * q.s);
                ctx.beginPath(); ctx.arc(q.x, q.y, rr * pulse - 9 * q.s, 0, 6.284); ctx.stroke();
            } else {
                drawStarOrb(q.x, q.y + Math.sin(G.t * 2 + it.i) * 10 * q.s,
                    Math.max(5, R.STAR_R * q.s), it.i);
            }
            ctx.restore();
        }
    }

    function drawStarOrb(x, y, r, seed) {
        var pulse = 1 + Math.sin(G.t * 3.2 + seed) * 0.07;
        r *= pulse;
        ctx.save();
        ctx.translate(x, y);
        var glow = ctx.createRadialGradient(0, 0, r * 0.18, 0, 0, r * 1.7);
        glow.addColorStop(0, 'rgba(255,246,178,0.58)');
        glow.addColorStop(0.5, 'rgba(255,206,74,0.22)');
        glow.addColorStop(1, 'rgba(255,206,74,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.7, 0, 6.284);
        ctx.fill();

        var body = ctx.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.08, 0, 0, r);
        body.addColorStop(0, '#fff9c8');
        body.addColorStop(0.42, '#ffd75e');
        body.addColorStop(1, '#e49a23');
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.284); ctx.fill();
        ctx.strokeStyle = 'rgba(122,75,10,0.3)';
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.38, r * 0.23, r * 0.15, -0.35, 0, 6.284); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = Math.max(1, r * 0.07);
        ctx.beginPath();
        ctx.moveTo(r * 1.15, 0); ctx.lineTo(r * 1.52, 0);
        ctx.moveTo(r * 1.34, -r * 0.18); ctx.lineTo(r * 1.34, r * 0.18);
        ctx.stroke();
        ctx.restore();
    }

    /* ---- MÁY BAY, NHÌN TỪ SAU ĐUÔI ----
     * Đây là chỗ góc nhìn mới trả công: nhìn từ sau thì hai cánh dang đều hai
     * bên, và cú NGHIÊNG CÁNH lúc bẻ lái hiện ra rõ mồn một. Nhìn nghiêng kiểu
     * 2D thì cú bẻ lái không có hình gì để mà thấy cả.
     */
    function drawPlane() {
        var p = proj(P.x, P.alt, P.z);
        if (!p) return;
        var s = clamp(p.s, 0.4, 3.7) * 29;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(-P.bank * 0.5);




        /* Vệt khói hai đầu cánh khi bay nhanh */
        if (P.spd > R.SPD_CRUISE * 0.85 && !P.onGround) {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = s * 0.06;
            ctx.lineCap = 'round';
            var tl = (P.spd - R.SPD_CRUISE * 0.85) * 0.5;
            ctx.beginPath();
            ctx.moveTo(-s * 1.22, s * 0.02); ctx.lineTo(-s * 1.22, s * 0.02 + tl * 0.12);
            ctx.moveTo(s * 1.22, s * 0.02); ctx.lineTo(s * 1.22, s * 0.02 + tl * 0.12);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(15,28,45,0.22)';
        ctx.lineWidth = Math.max(0.7, s * 0.012);
        ctx.lineJoin = 'round';

        /* Cánh chính: thiết kế khí động học cao cấp với dải sơn trang trí màu xanh đậm */
        ctx.fillStyle = '#f8fbff';
        ctx.beginPath();
        ctx.moveTo(-s * 1.24, s * 0.02);
        ctx.lineTo(-s * 0.24, -s * 0.13);
        ctx.lineTo(s * 0.24, -s * 0.13);
        ctx.lineTo(s * 1.24, s * 0.02);
        ctx.lineTo(s * 1.05, s * 0.16);
        ctx.lineTo(s * 0.18, s * 0.08);
        ctx.lineTo(-s * 0.18, s * 0.08);
        ctx.lineTo(-s * 1.05, s * 0.16);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        /* Viền mép sau cánh & Ailerons (Màu xám kim loại sang trọng) */
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(-s * 0.92, s * 0.12); ctx.lineTo(-s * 0.18, s * 0.04);
        ctx.lineTo(-s * 0.08, s * 0.1); ctx.lineTo(-s * 0.78, s * 0.24);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.92, s * 0.12); ctx.lineTo(s * 0.18, s * 0.04);
        ctx.lineTo(s * 0.08, s * 0.1); ctx.lineTo(s * 0.78, s * 0.24);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        /* Hai động cơ phản lực Turbofan với luồng lửa đỏ cam rực rỡ */
        drawJetEngine(-s * 0.58, s * 0.1, s);
        drawJetEngine(s * 0.58, s * 0.1, s);

        /* Thân máy bay dạng trụ tròn 3D bóng bẩy */
        var fus = ctx.createLinearGradient(-s * 0.22, 0, s * 0.22, 0);
        fus.addColorStop(0, '#b2c2d4');
        fus.addColorStop(0.25, '#ffffff');
        fus.addColorStop(0.75, '#ffffff');
        fus.addColorStop(1, '#97a8bd');
        ctx.fillStyle = fus;
        roundRect(ctx, -s * 0.22, -s * 0.38, s * 0.44, s * 0.72, s * 0.21);
        ctx.fill(); ctx.stroke();

        /* Buồng lái kính phản quang màu xanh dương hiện đại */
        var glass = ctx.createLinearGradient(0, -s * 0.32, 0, -s * 0.2);
        glass.addColorStop(0, '#1a3a60');
        glass.addColorStop(0.5, '#2b78c5');
        glass.addColorStop(1, '#5bb0ff');
        ctx.fillStyle = glass;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.26, s * 0.14, s * 0.07, 0, 0, 6.284);
        ctx.fill();
        ctx.strokeStyle = 'rgba(15,30,55,0.22)';
        ctx.lineWidth = Math.max(0.6, s * 0.01);
        ctx.stroke();

        /* Đuôi đứng & Dải màu nhận diện của KIBU Airlines */
        ctx.fillStyle = '#1e40af'; // Màu xanh Royal Blue cao cấp
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.3);
        ctx.lineTo(-s * 0.12, -s * 0.68);
        ctx.lineTo(s * 0.12, -s * 0.68);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        /* Dải logo vàng Gold mỏng trên đuôi đứng */
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.45);
        ctx.lineTo(-s * 0.09, -s * 0.58);
        ctx.lineTo(s * 0.09, -s * 0.58);
        ctx.closePath(); ctx.fill();

        /* Hai cánh đuôi ngang màu trắng */
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(-s * 0.56, -s * 0.28); ctx.lineTo(-s * 0.1, -s * 0.38); ctx.lineTo(-s * 0.08, -s * 0.27);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.56, -s * 0.28); ctx.lineTo(s * 0.1, -s * 0.38); ctx.lineTo(s * 0.08, -s * 0.27);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        /* Đèn tín hiệu định vị hàng hải (Navigation Lights) nhấp nháy */
        var lit = Math.sin(G.t * 8) > 0;
        ctx.save();
        if (lit) {
            // Đèn xanh lá bên cánh phải (Right Wingtip - Green)
            var gGlow = ctx.createRadialGradient(s * 1.24, s * 0.02, 1, s * 1.24, s * 0.02, s * 0.24);
            gGlow.addColorStop(0, '#ffffff');
            gGlow.addColorStop(0.3, '#22c55e');
            gGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = gGlow;
            ctx.beginPath(); ctx.arc(s * 1.24, s * 0.02, s * 0.24, 0, 6.284); ctx.fill();

            // Đèn đỏ bên cánh trái (Left Wingtip - Red)
            var rGlow = ctx.createRadialGradient(-s * 1.24, s * 0.02, 1, -s * 1.24, s * 0.02, s * 0.24);
            rGlow.addColorStop(0, '#ffffff');
            rGlow.addColorStop(0.3, '#ef4444');
            rGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = rGlow;
            ctx.beginPath(); ctx.arc(-s * 1.24, s * 0.02, s * 0.24, 0, 6.284); ctx.fill();

            // Đèn báo hiệu nhấp nháy đỏ trên đỉnh đuôi (Tail Strobe - Red Beacon)
            var beacon = ctx.createRadialGradient(0, -s * 0.68, 1, 0, -s * 0.68, s * 0.18);
            beacon.addColorStop(0, '#ffffff');
            beacon.addColorStop(0.4, '#ef4444');
            beacon.addColorStop(1, 'transparent');
            ctx.fillStyle = beacon;
            ctx.beginPath(); ctx.arc(0, -s * 0.68, s * 0.18, 0, 6.284); ctx.fill();
        }
        ctx.restore();

        /* Càng đáp (chỉ hạ khi bay thấp hoặc lăn trên đường băng) */
        if (P.gear) {
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = Math.max(1.2, s * 0.05);
            // Càng trái
            ctx.beginPath(); ctx.moveTo(-s * 0.44, s * 0.14); ctx.lineTo(-s * 0.44, s * 0.36); ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.arc(-s * 0.44, s * 0.36, s * 0.06, 0, 6.284); ctx.fill();
            // Càng phải
            ctx.beginPath(); ctx.moveTo(s * 0.44, s * 0.14); ctx.lineTo(s * 0.44, s * 0.36); ctx.stroke();
            ctx.beginPath(); ctx.arc(s * 0.44, s * 0.36, s * 0.06, 0, 6.284); ctx.fill();
            // Càng mũi
            ctx.beginPath(); ctx.moveTo(0, s * 0.2); ctx.lineTo(0, s * 0.38); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, s * 0.38, s * 0.055, 0, 6.284); ctx.fill();
        }
        ctx.restore();

        /* BÓNG ĐỔ TRÊN MẶT ĐẤT.
         * Nó làm được một việc mà không con số nào làm nổi: cho mắt thấy máy
         * bay đang cách mặt đất bao xa, và đang lệch sang bên nào. Càng thấp
         * bóng càng to và càng đậm — lúc sắp chạm đường băng thì bóng chạy tới
         * gặp máy bay, và đó là tín hiệu hạ cánh dễ đọc nhất trong cả game. */
        var gGround = R.groundAt(G.route, P.x);
        var sp = proj(P.x, gGround, P.z);
        if (sp) {
            var h = clamp((P.alt - gGround) / 2000, 0, 1);
            ctx.save();
            ctx.globalAlpha = 0.34 * (1 - h * 0.85);
            ctx.fillStyle = '#123';
            ctx.beginPath();
            ctx.ellipse(sp.x, sp.y, 24 * sp.s, 6 * sp.s, 0, 0, 6.284);
            ctx.fill();
            ctx.restore();
        }

        /* Vẽ động cơ Turbofan */
        function drawJetEngine(x, y, sc) {
            ctx.save();
            ctx.translate(x, y);
            // Thân động cơ (màu vỏ kim loại bóng)
            var engFus = ctx.createLinearGradient(-sc * 0.18, 0, sc * 0.18, 0);
            engFus.addColorStop(0, '#94a3b8');
            engFus.addColorStop(0.3, '#f1f5f9');
            engFus.addColorStop(0.7, '#f1f5f9');
            engFus.addColorStop(1, '#64748b');
            ctx.fillStyle = engFus;
            ctx.beginPath(); ctx.ellipse(0, 0, sc * 0.18, sc * 0.14, 0, 0, 6.284); ctx.fill(); ctx.stroke();

            // Lõi động cơ (Nozzle) màu xám sẫm
            ctx.fillStyle = '#1e293b';
            ctx.beginPath(); ctx.ellipse(0, 0, sc * 0.12, sc * 0.09, 0, 0, 6.284); ctx.fill();

            // Luồng lửa phản lực màu cam hồng rực rỡ
            var jetGlow = ctx.createRadialGradient(0, 0, sc * 0.02, 0, 0, sc * 0.08);
            jetGlow.addColorStop(0, '#ffffff');
            jetGlow.addColorStop(0.2, '#fde047'); // Vàng sáng
            jetGlow.addColorStop(0.5, '#f97316'); // Cam
            jetGlow.addColorStop(0.9, '#ef4444'); // Đỏ
            jetGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = jetGlow;
            ctx.beginPath(); ctx.ellipse(0, 0, sc * 0.09, sc * 0.07, 0, 0, 6.284); ctx.fill();

            // Điểm sáng phản chiếu bên ngoài vỏ động cơ
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath(); ctx.ellipse(-sc * 0.04, -sc * 0.04, sc * 0.04, sc * 0.025, 0, 0, 6.284); ctx.fill();
            ctx.restore();
        }
    }

    function drawParticles() {
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            var a = clamp(p.life / p.max, 0, 1);
            ctx.globalAlpha = a;
            ctx.fillStyle = p.col;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.s * a, 0, 6.284); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawRadarCompass() {
        /* Trên màn dọc (W hẹp), rada thu nhỏ và đẩy xuống dưới thanh progress */
        var isNarrow = W < 500;
        var r = isNarrow ? 26 : 38;
        var mcX = (isNarrow ? 14 : 22) + r;
        var mcY = (isNarrow ? 56 : 22) + r; // portrait: đẩy xuống tránh đè progress
        
        ctx.save();
        
        // 1. Nền tối mờ la bàn (Glassmorphism)
        ctx.fillStyle = 'rgba(7, 18, 30, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mcX, mcY, r, 0, 6.284);
        ctx.fill();
        ctx.stroke();
        
        // 2. Vạch tròn radar đồng tâm mờ
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.16)';
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(mcX, mcY, r * 0.4, 0, 6.284); ctx.stroke();
        ctx.beginPath(); ctx.arc(mcX, mcY, r * 0.72, 0, 6.284); ctx.stroke();
        
        // 3. Vệt quét radar xoay tròn tự động
        var sweepAngle = (G.t * 1.5) % 6.284;
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.38)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mcX, mcY);
        ctx.lineTo(mcX + Math.cos(sweepAngle) * r, mcY + Math.sin(sweepAngle) * r);
        ctx.stroke();
        
        // 4. Nhãn hướng Đông-Tây-Nam-Bắc
        ctx.font = '800 8px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Bắc (North) - 12h màu đỏ nổi bật la bàn
        ctx.fillStyle = '#ef4444';
        ctx.fillText('N', mcX, mcY - r + 7);
        
        // Các hướng còn lại màu trắng sáng
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText('S', mcX, mcY + r - 7); // Nam
        ctx.fillText('E', mcX + r - 7, mcY); // Đông
        ctx.fillText('W', mcX - r + 7, mcY); // Tây
        
        // 5. Vẽ vạch chia 45 độ tinh tế
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 0.8;
        for (var a = 0; a < 360; a += 45) {
            if (a % 90 === 0) continue;
            var rad = a * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(mcX + Math.cos(rad) * (r - 3.5), mcY + Math.sin(rad) * (r - 3.5));
            ctx.lineTo(mcX + Math.cos(rad) * r, mcY + Math.sin(rad) * r);
            ctx.stroke();
        }
        
        // 6. Quy đổi góc bay sang Độ (0 độ là hướng Đông / E)
        var headingDeg = Math.round((P.heading * 180 / Math.PI) % 360);
        if (headingDeg < 0) headingDeg += 360;
        
        // 7. Máy bay chỉ thị hướng bay nằm ở tâm la bàn
        ctx.save();
        ctx.translate(mcX, mcY);
        ctx.rotate(P.heading);
        ctx.fillStyle = '#10b981'; // Màu xanh lá điện tử
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-2, -5.5);
        ctx.lineTo(-1, -1.8);
        ctx.lineTo(-4.5, -2);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-4.5, 2);
        ctx.lineTo(-1, 1.8);
        ctx.lineTo(-2, 5.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        
        // 8. Số đo hướng bay HDG dạng số góc dưới la bàn
        ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
        ctx.font = '800 7.5px Courier New, monospace';
        ctx.fillText('HDG: ' + headingDeg + '°', mcX, mcY + r + 9);
        
        ctx.restore();
    }

    function draw() {
        ctx.save();
        if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);

        drawSky();
        if (G.route) {
            drawGround();
            drawRunway(R.departRunway(G.route), false);
            drawRunway(R.arriveRunway(G.route), true);
            drawLandmarks();
            drawGlide();
            drawPickups();
            drawClouds();
            if (G.phase === 'fly' || G.phase === 'pause') drawPlane();
            drawParticles();
            
            // Vẽ hiệu ứng giông bão nếu có
            var w = weatherAt(P.x);
            if (w.storm > 0.02) drawRain(w.storm);
            if (w.storm > 0.3) drawStormWarning(w.storm);
            
            // Vẽ rada 4 hướng chỉ thị góc bay của máy bay
            if (G.phase === 'fly' || G.phase === 'pause') drawRadarCompass();

            // Vẽ hướng dẫn lệch hướng đường bay hỗ trợ bé tự bẻ lái
            if (G.phase === 'fly') drawNavigationGuidance();
        } else {
            drawMenuScene();
        }
        ctx.restore();

        if (G.flash > 0) {
            ctx.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.75) + ')';
            ctx.fillRect(0, 0, W, H);
        }
    }

    function drawNavigationGuidance() {
        var devZ = P.z;
        var devH = P.heading;
        
        var needTurnLeft = false;
        var needTurnRight = false;
        
        // Nếu lệch quá xa làn đường trung tâm (Z = 0) hoặc góc lái quay quá sâu
        if (devZ < -800 || devH < -0.26) {
            needTurnRight = true;
        } else if (devZ > 800 || devH > 0.26) {
            needTurnLeft = true;
        }
        
        if (!needTurnLeft && !needTurnRight) return;
        
        ctx.save();
        
        // Nhấp nháy nhẹ nhàng, mờ đi một chút (độ đục dao động từ 0.22 đến 0.58)
        var flash = 0.22 + 0.36 * Math.abs(Math.sin(G.t * 4.2));
        
        // Vị trí nằm chính giữa màn hình ngang, ngay phía dưới sát thanh progress (ly = 138)
        var lx = W / 2;
        var ly = 138;
        
        ctx.lineWidth = 4.8; // Nét vẽ dày hơn cho rõ ràng
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = flash;
        ctx.strokeStyle = '#f87171'; // Màu đỏ nhạt cảnh báo lệch hướng (Warning Red)
        
        // Vẽ 3 dấu chevron vector cỡ lớn lồng nhau cách nhau 14px cực kỳ trực quan
        if (needTurnRight) {
            for (var i = 0; i < 3; i++) {
                var cx = lx - 14 + i * 14;
                ctx.beginPath();
                ctx.moveTo(cx - 8, ly - 11);
                ctx.lineTo(cx, ly);
                ctx.lineTo(cx - 8, ly + 11);
                ctx.stroke();
            }
        } else {
            for (var i = 0; i < 3; i++) {
                var cx = lx + 14 - i * 14;
                ctx.beginPath();
                ctx.moveTo(cx + 8, ly - 11);
                ctx.lineTo(cx, ly);
                ctx.lineTo(cx + 8, ly + 11);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }

    function drawRain(stormWeight) {
        if (stormWeight < 0.05) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(156, 163, 175, ' + (0.28 * stormWeight) + ')';
        ctx.lineWidth = 1.2;
        var numStreaks = Math.floor(45 * stormWeight);
        for (var i = 0; i < numStreaks; i++) {
            var rx = Math.random() * W;
            var ry = Math.random() * H;
            var len = 15 + Math.random() * 25;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - len * 0.15, ry + len);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawStormWarning(stormWeight) {
        var flash = Math.abs(Math.sin(G.t * 3.5));
        
        // Khung viền đỏ nhấp nháy ở cạnh màn hình
        ctx.strokeStyle = 'rgba(239, 68, 68, ' + (0.3 * stormWeight * flash) + ')';
        ctx.lineWidth = 14;
        ctx.strokeRect(0, 0, W, H);
        
        // Thể hiện cảnh báo đỏ nhấp nháy
        ctx.save();
        var label = isVi() ? '⚡ CẢNH BÁO: GIÔNG BÃO NHIỄU SẠN ⚡' : '⚡ CAUTION: STORM TURBULENCE ⚡';
        ctx.font = '800 12px Nunito, sans-serif';
        ctx.textAlign = 'center';
        var tw = ctx.measureText(label).width;
        
        var ly = 160; // Dưới radar thông tin một chút
        var lx = W / 2;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(239, 68, 68, ' + (0.4 + flash * 0.5) + ')';
        ctx.lineWidth = 1.5;
        roundRect(ctx, lx - tw / 2 - 14, ly - 14, tw + 28, 20, 6);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = flash > 0.35 ? '#f8fafc' : '#fca5a5';
        ctx.fillText(label, lx, ly + 1);
        ctx.restore();
    }

    /* ========================================================================
     * 10. BẢNG ĐIỀU KHIỂN
     * ------------------------------------------------------------------------
     *  Ba con số, không hơn: nhanh bao nhiêu, cao bao nhiêu, đi được bao xa.
     *  Bản mô tả đòi "the screen should stay clean", và với trẻ con thì mỗi ô
     *  số thêm vào là một thứ nữa để bối rối.
     * ======================================================================*/
    var hudCache = {};
    function setText(id, v) {
        if (hudCache[id] === v) return;
        hudCache[id] = v;
        el(id).textContent = v;
    }

    function syncHud(force) {
        if (force) hudCache = {};
        setText('hud-spd', fmt(P.spd * 3.6));
        setText('hud-alt', fmt(Math.max(0, P.alt)));
        setText('hud-star', String(G.stars));
        setText('hud-photo', G.shots.length + '/' + G.route.landmarks.length);
        var pc = clamp(P.x / G.route.len, 0, 1);
        el('progress-fill').style.width = (pc * 100).toFixed(1) + '%';
        el('progress-plane').style.left = (pc * 100).toFixed(1) + '%';
    }

    /* ========================================================================
     * 11. MÀN HÌNH HTML
     * ======================================================================*/
    var screens = ['menu-overlay', 'help-overlay', 'album-overlay', 'done-overlay', 'pause-overlay'];
    function showScreen(id) {
        for (var i = 0; i < screens.length; i++) {
            el(screens[i]).classList.toggle('hidden', screens[i] !== id);
        }
    }

    /* Dịch một câu ngắn. i18n.js dịch mọi chữ trong DOM, nhưng chữ vẽ lên
     * canvas và chữ đặt bằng textContent giữa chừng thì nó bắt qua
     * MutationObserver — nên chỗ này chỉ cần trả lại nguyên câu tiếng Anh và
     * để bộ dịch chung lo. Giữ hàm T() vì nó đánh dấu rõ "đây là câu người
     * đọc", ai sửa cũng biết phải thêm cặp dịch vào i18n.js. */
    function T(s) { return s; }

    function isVi() {
        return (document.documentElement.getAttribute('lang') || 'en').indexOf('vi') === 0;
    }
    function name(o) { return isVi() && o.vi ? o.vi : o.en; }
    function fact(lm) { return isVi() && lm.factVi ? lm.factVi : lm.factEn; }

    function renderRoutes() {
        var host = el('route-list');
        host.innerHTML = '';
        for (var i = 0; i < R.ROUTES.length; i++) {
            var rt = R.ROUTES[i];
            var done = store.data.best[rt.id];
            var card = document.createElement('button');
            card.className = 'route-card';
            card.innerHTML =
                '<div class="rc-map"><span class="rc-dot"></span><span class="rc-line"></span>' +
                '<span class="rc-plane">✈️</span><span class="rc-dot"></span></div>' +
                '<div class="rc-cities"><b>' + name(rt.fromCity) + '</b>' +
                '<i class="fa-solid fa-arrow-right"></i><b>' + name(rt.toCity) + '</b></div>' +
                '<div class="rc-meta"><span>' + rt.realKm + ' km</span>' +
                '<span>' + rt.landmarks.length + ' 📷</span>' +
                (done ? '<span class="rc-done">✓</span>' : '') + '</div>';
            (function (id) {
                card.addEventListener('click', function () { startFlight(id); });
            }(rt.id));
            host.appendChild(card);
        }
    }

    var RATING_TEXT = {
        great: { icon: '🌟', en: 'Great Landing' },
        nice: { icon: '👍', en: 'Nice Landing' },
        assisted: { icon: '🤝', en: 'Assisted Landing' }
    };

    function renderSummary() {
        var rt = G.route;
        var rat = RATING_TEXT[G.rating] || RATING_TEXT.assisted;
        el('done-route').textContent = name(rt.fromCity) + ' → ' + name(rt.toCity);
        el('done-rating-icon').textContent = rat.icon;
        el('done-rating').textContent = rat.en;
        el('done-stamp').textContent = rt.toAirport.code;
        el('done-stamp-city').textContent = name(rt.toCity);
        el('done-stars').textContent = String(G.stars);
        el('done-rings').textContent = G.rings + '/' + R.ringCount(rt);

        var host = el('done-photos');
        host.innerHTML = '';
        if (!G.shots.length) {
            var p = document.createElement('p');
            p.className = 'no-photo';
            p.textContent = 'No photos this time. Try the camera button next flight!';
            host.appendChild(p);
        }
        for (var i = 0; i < rt.landmarks.length; i++) {
            var lm = rt.landmarks[i];
            if (G.shots.indexOf(lm.en) < 0) continue;
            host.appendChild(photoCard(lm));
        }
    }

    function photoCard(lm) {
        var d = document.createElement('div');
        d.className = 'photo-card';
        d.innerHTML = '<div class="pc-pic pc-' + lm.kind + '"></div>' +
            '<b>' + name(lm) + '</b><span>' + fact(lm) + '</span>';
        return d;
    }

    function renderAlbum() {
        var d = store.data;
        el('album-flights').textContent = String(d.flights);
        el('album-stars').textContent = String(d.stars);

        var st = el('album-stamps');
        st.innerHTML = '';
        var codes = Object.keys(d.stamps);
        if (!codes.length) {
            st.innerHTML = '<p class="no-photo">Land at an airport to earn your first stamp!</p>';
        }
        for (var i = 0; i < codes.length; i++) {
            if (!d.stamps[codes[i]]) continue;
            var s = document.createElement('div');
            s.className = 'stamp';
            s.innerHTML = '<b>' + codes[i] + '</b><span>×' + d.stamps[codes[i]] + '</span>';
            st.appendChild(s);
        }

        var ph = el('album-photos');
        ph.innerHTML = '';
        var any = false;
        for (var r = 0; r < R.ROUTES.length; r++) {
            var rt = R.ROUTES[r];
            for (var k = 0; k < rt.landmarks.length; k++) {
                var lm = rt.landmarks[k];
                if (!d.photos[rt.id + ':' + lm.en]) continue;
                ph.appendChild(photoCard(lm));
                any = true;
            }
        }
        if (!any) ph.innerHTML = '<p class="no-photo">Your album is empty. Take a photo while you fly!</p>';
    }

    /* ========================================================================
     * 12. ĐIỀU KHIỂN
     * ------------------------------------------------------------------------
     *  Hai ngón tay là đủ: một bên lên xuống, một bên ga. Bàn phím làm được
     *  đúng những việc ấy — cùng một trò chơi thì hai cách chơi phải mở ra
     *  cùng những cánh cửa.
     * ======================================================================*/
    function holdBtn(id, down, up) {
        var b = el(id);
        b.addEventListener('pointerdown', function (e) {
            e.preventDefault(); e.stopPropagation();
            Sfx.wake();
            b.classList.add('is-on');
            down();
        });
        /* Bắt cả bốn cách ngón tay rời ra. Thiếu pointercancel là kiểu treo
         * kinh điển trên điện thoại: hệ điều hành cướp cú chạm giữa chừng và
         * pointerup không bao giờ tới, nút kẹt ở trạng thái đang giữ — máy bay
         * chúi mũi mãi mà bé không hiểu vì sao. */
        ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture'].forEach(function (ev) {
            b.addEventListener(ev, function () { b.classList.remove('is-on'); up(); });
        });
    }

    function setPitch(v) { P.pitch = v; P.pitchHeld = v !== 0; }
    function setTurn(v) { P.turn = v; P.turnHeld = v !== 0; }

    function setAutoBtn() {
        el('btn-auto').classList.toggle('is-on', G.auto);
    }

    function wireInput() {
        /* =================== JOYSTICK ẢO ===================
         * Ngón tay chạm vào vùng joystick-zone, kéo theo hướng muốn bay.
         * Knob di chuyển mượt mà theo ngón tay, giá trị pitch/turn được
         * tính từ khoảng cách tương đối so với tâm — giống cần lái thật.
         * Dead-zone 18% ngăn bé vô tình bay lệch khi chạm nhẹ. */
        var jZone = el('joystick-zone');
        var jKnob = el('joystick-knob');
        var jActive = false;
        var jPointerId = null;

        function getJoystickCenter() {
            var rect = jZone.getBoundingClientRect();
            return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, r: rect.width / 2 };
        }

        function updateJoystick(clientX, clientY) {
            var c = getJoystickCenter();
            var dx = clientX - c.cx;
            var dy = clientY - c.cy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var maxR = c.r - 4; // knob stays inside base circle
            if (dist > maxR) { dx = dx / dist * maxR; dy = dy / dist * maxR; dist = maxR; }

            // Move knob visually
            jKnob.style.left = (c.r + dx) + 'px';
            jKnob.style.top = (c.r + dy) + 'px';

            // Normalize to -1..1
            var nx = dx / maxR;
            var ny = -dy / maxR; // invert Y: up = positive pitch

            // Dead-zone 18%
            var DEAD = 0.18;
            var turnVal = Math.abs(nx) > DEAD ? (nx > 0 ? 1 : -1) : 0;
            var pitchVal = Math.abs(ny) > DEAD ? (ny > 0 ? 1 : -1) : 0;

            setTurn(turnVal);
            setPitch(pitchVal);
        }

        function resetJoystick() {
            jActive = false;
            jPointerId = null;
            jKnob.classList.remove('active');
            jKnob.style.left = '50%';
            jKnob.style.top = '50%';
            jKnob.style.transform = 'translate(-50%, -50%)';
            setPitch(0);
            setTurn(0);
        }

        jZone.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            e.stopPropagation();
            Sfx.wake();
            jActive = true;
            jPointerId = e.pointerId;
            jZone.setPointerCapture(e.pointerId);
            jKnob.classList.add('active');
            jKnob.style.transform = 'translate(-50%, -50%)'; // keep centered offset
            updateJoystick(e.clientX, e.clientY);
        });

        jZone.addEventListener('pointermove', function (e) {
            if (!jActive || e.pointerId !== jPointerId) return;
            e.preventDefault();
            jKnob.style.transform = 'translate(-50%, -50%)';
            updateJoystick(e.clientX, e.clientY);
        });

        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
            jZone.addEventListener(ev, function (e) {
                if (e.pointerId !== jPointerId) return;
                resetJoystick();
            });
        });

        // Throttle buttons (right side) — giữ nguyên holdBtn
        holdBtn('btn-fast', function () { P.thrUp = 1; }, function () { P.thrUp = 0; });
        holdBtn('btn-slow', function () { P.thrDn = 1; }, function () { P.thrDn = 0; });

        el('btn-photo').addEventListener('click', function (e) { e.preventDefault(); takePhoto(); });
        el('btn-auto').addEventListener('click', function (e) {
            e.preventDefault();
            G.auto = !G.auto;
            /* Bật nút phép là nhận một bàn tay đỡ, và tấm huy hiệu phải nói
             * đúng như thế — không phải để chê, mà để tấm huy hiệu "tự bay
             * được" còn giữ được giá trị của nó. */
            if (G.auto) G.helped = true;
            setAutoBtn();
            say('auto', G.auto ? T('Auto-help is on. Enjoy the view!') : T('You are flying again!'), 2.6);
        });
        el('btn-land').addEventListener('click', function (e) {
            e.preventDefault();
            G.auto = true;
            G.helped = true;
            setAutoBtn();
            say('landing', T('Landing help is on. Hold on!'), 3);
        });

        window.addEventListener('keydown', function (e) {
            if (e.repeat) return;
            var k = e.key;
            if (G.phase !== 'fly') return;
            /* Bốn mũi tên là BỐN HƯỚNG BAY, đúng như tay đặt lên cần lái. Ga
             * chuyển sang W/S — bản trước gán ga vào mũi tên trái phải, mà giờ
             * trái phải là một hướng đi thật thì cách gán ấy không còn chỗ
             * đứng nào. */
            if (k === 'ArrowUp') { e.preventDefault(); Sfx.wake(); setPitch(1); }
            else if (k === 'ArrowDown') { e.preventDefault(); Sfx.wake(); setPitch(-1); }
            else if (k === 'ArrowLeft') { e.preventDefault(); Sfx.wake(); setTurn(-1); }
            else if (k === 'ArrowRight') { e.preventDefault(); Sfx.wake(); setTurn(1); }
            else if (k === 'w' || k === 'W') { e.preventDefault(); Sfx.wake(); P.thrUp = 1; }
            else if (k === 's' || k === 'S') { e.preventDefault(); P.thrDn = 1; }
            else if (k === ' ') { e.preventDefault(); Sfx.wake(); takePhoto(); }
            else if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
        });
        window.addEventListener('keyup', function (e) {
            var k = e.key;
            if (k === 'ArrowUp' || k === 'ArrowDown') setPitch(0);
            if (k === 'ArrowLeft' || k === 'ArrowRight') setTurn(0);
            if (k === 'w' || k === 'W') P.thrUp = 0;
            if (k === 's' || k === 'S') P.thrDn = 0;
        });
        window.addEventListener('blur', function () {
            setPitch(0); setTurn(0); P.thrUp = 0; P.thrDn = 0;
        });
    }

    function togglePause() {
        if (G.phase === 'fly') {
            G.phase = 'pause';
            Sfx.engine(0, 300, 60);
            showScreen('pause-overlay');
        } else if (G.phase === 'pause') {
            G.phase = 'fly';
            showScreen(null);
        }
    }

    function backToMenu() {
        G.phase = 'menu';
        Sfx.engine(0, 300, 60);
        el('hud').hidden = true;
        el('touch-row').hidden = true;
        el('btn-land').hidden = true;
        hushGuide();
        renderRoutes();
        showScreen('menu-overlay');
    }

    function wireButtons() {
        el('btn-fly').addEventListener('click', function () { startFlight(R.ROUTES[0].id); });
        el('btn-album').addEventListener('click', function () { renderAlbum(); showScreen('album-overlay'); });
        el('btn-album-close').addEventListener('click', function () { showScreen('menu-overlay'); });
        el('btn-help').addEventListener('click', function () {
            if (G.phase === 'fly') togglePause();
            showScreen('help-overlay');
        });
        el('btn-help-close').addEventListener('click', function () {
            showScreen(G.phase === 'menu' ? 'menu-overlay' : 'pause-overlay');
        });
        el('btn-pause').addEventListener('click', togglePause);
        el('btn-resume').addEventListener('click', togglePause);
        el('btn-quit').addEventListener('click', backToMenu);
        el('btn-nav-menu').addEventListener('click', backToMenu);
        el('btn-again').addEventListener('click', function () { startFlight(G.route.id); });
        el('btn-done-menu').addEventListener('click', backToMenu);
        el('btn-done-album').addEventListener('click', function () { renderAlbum(); showScreen('album-overlay'); });

        el('btn-sound').addEventListener('click', function () {
            var on = Sfx.toggle();
            el('sound-icon').className = on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        });
    }

    /* ========================================================================
     * 13. ĐỒNG HỒ
     * ======================================================================*/
    var last = 0;
    function frame(now) {
        requestAnimationFrame(frame);
        if (!last) last = now;
        /* Chặn bước nhảy lớn: chuyển tab đi rồi quay lại thì now nhảy vài
         * giây, và một bước dt vài giây đẩy máy bay xuyên qua nửa quả núi. */
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        if (G.phase === 'fly') {
            /* ga đổi dần theo nút đang giữ, không nhảy phắt — cần ga thật cũng
             * không nhảy phắt, và cái tay bé đang giữ nút cảm nhận được điều đó */
            var d = (P.thrUp ? 1 : 0) - (P.thrDn ? 1 : 0);
            if (d && !G.auto) P.throttle = clamp(P.throttle + d * dt * 0.85, 0, 1);
            update(dt);
        }
        draw();
    }

    /* ========================================================================
     * 14. KHỞI ĐỘNG
     * ======================================================================*/
    function boot() {
        store.load();
        Sfx.init();
        buildCanvas();
        window.addEventListener('resize', resize);

        el('sound-icon').className = Sfx.on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';

        wireInput();
        wireButtons();

        /* Màn chờ có cảnh thật phía sau: đúng tuyến ấy, đúng bộ sinh ấy, chỉ
         * là không ai lái. Bản mô tả đòi màn đầu "immediately show the flying
         * theme" — mà không gì nói đúng chủ đề hơn chính trò chơi. */
        G.route = R.ROUTES[0];
        P.x = 2000; P.alt = 1400; P.spd = R.SPD_CRUISE; P.z = 0;
        snapCam();
        renderRoutes();
        showScreen('menu-overlay');

        window.FlightDebug = {
            G: G, P: P, R: R, start: startFlight, update: update, draw: draw,
            photo: takePhoto, hud: syncHud, Sfx: Sfx, store: store,
            setPitch: setPitch, setTurn: setTurn, backToMenu: backToMenu
        };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
