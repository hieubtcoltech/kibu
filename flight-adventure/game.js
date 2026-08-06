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
    var PPM = R.PPM, VPM = R.VPM, GROUND_Y = R.GROUND_Y;

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
        blip: function () { this.tone(660, 880, 0.09, 'triangle', 0.05); }
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
        pitchHeld: false, thrUp: 0, thrDn: 0
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
        P.throttle = 0;
        P.pitch = 0;
        P.vs = 0; P.bank = 0;
        P.onGround = true;
        P.gear = true;

        /* Tên hai thành phố lấy từ chính tuyến, không chép tay vào HTML —
         * tuyến thứ hai thêm vào là thanh hành trình tự nói đúng tên. */
        el('pg-from').textContent = name(G.route.fromCity);
        el('pg-to').textContent = name(G.route.toCity);

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
        P.x += P.spd * dt;

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
            /* Chạm đất. Trên đường băng thì là hạ cánh; ngoài đường băng thì
             * KHÔNG rơi — trò chơi nâng lên và nói một câu. */
            if (onRunway && (G.leg === 'final' || G.leg === 'ready' || G.leg === 'roll' || G.leg === 'rollout')) {
                P.alt = gnd;
                if (!P.onGround) touchDown(gnd);
                P.onGround = true;
                P.vs = 0;
            } else {
                P.alt = gnd + 2;
                assistLift();
            }
        } else if (P.alt < gnd) {
            P.alt = gnd;
        } else if (P.alt > gnd + 6) {
            P.onGround = false;
        }

        /* ---- bàn tay đỡ khi bay quá thấp ----
         *
         * Chỉ đỡ khi máy bay ĐANG KHÔNG TỰ LO ĐƯỢC. Máy soát bắt được chỗ này:
         * bản đầu đỡ hễ thấy thấp, nên đúng bốn giây sau khi cất cánh — lúc
         * máy bay mới rời đường băng bảy mét và đang lao lên — trò chơi đã kêu
         * "cẩn thận, để chúng tôi nâng con lên" và ghi vào sổ là bé cần giúp.
         * Bé bay đúng cách hoàn hảo vẫn chỉ được tấm huy hiệu hạng ba, mà
         * không bao giờ biết vì sao.
         *
         * Máy bay đang leo lên thì nó đã tự giải bài của nó rồi. Đỡ một người
         * đang tự đứng dậy không phải là giúp, là cản. */
        if (!P.onGround && G.leg !== 'final' && G.leg !== 'climb' && G.leg !== 'roll') {
            var floor = R.floorAt(rt, P.x);
            if (P.alt < floor && P.vs < 2) {
                P.alt += R.RESCUE_LIFT * dt;
                if (P.vs < 0) P.vs = 0;
                assistLift();
            }
        }
        if (P.alt > R.ALT_MAX) { P.alt = R.ALT_MAX; if (P.vs > 0) P.vs = 0; }

        stepLeg(dt, dep, arr);
        stepPickups();
        stepParticles(dt);

        /* ---- tiếng động cơ ---- */
        var f = clamp(P.spd / R.SPD_MAX, 0, 1);
        Sfx.engine(0.02 + 0.055 * f, 280 + 620 * f, 52 + 46 * f);

        /* độ nghiêng vẽ ra: suy từ tốc độ lên xuống, không phải một biến riêng */
        P.bank = lerp(P.bank, clamp(P.vs / R.CLIMB_RATE, -1, 1), clamp(dt * 4, 0, 1));

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
        } else {
            wantAlt = R.groundAt(rt, P.x) + R.ALT_CRUISE * 0.62;
            wantAlt = clamp(wantAlt, 700, R.ALT_MAX - 500);
            P.throttle = 0.62;
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
        burst(W * R.PLANE_SX, GROUND_Y - gnd * VPM, 14, 'rgba(255,255,255,0.8)', 130);
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
            if (R.hitPx(o.x - P.x, o.alt - P.alt, R.RING_PX)) {
                G.ringDone[i] = 1;
                G.rings++;
                Sfx.ring();
                burst(W * R.PLANE_SX, GROUND_Y - P.alt * VPM, 16, 'rgba(150,230,255,0.9)', 150);
            }
        }
        for (i = 0; i < R.starCount(rt); i++) {
            if (G.starDone[i]) continue;
            o = R.starAt(rt, i);
            if (!o || Math.abs(o.x - P.x) > 300) continue;
            if (R.hitPx(o.x - P.x, o.alt - P.alt, R.STAR_PX)) {
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
     *  8. TOẠ ĐỘ MÀN HÌNH
     * ======================================================================*/
    function sx(x) { return (x - P.x) * PPM + W * R.PLANE_SX; }
    function sy(alt) { return GROUND_Y - alt * VPM; }

    /* ========================================================================
     *  9. VẼ
     * ======================================================================*/

    /* Bảng màu của bầu trời theo giờ trong ngày. Buổi sáng cho tuyến đầu —
     * bản mô tả đòi "bright and friendly", mà sáng sớm là thứ ánh sáng duy
     * nhất vừa sáng vừa dịu. */
    var SKIES = {
        morning: { top: '#3ea8e5', mid: '#9fd8f2', low: '#ffe6c2', sun: '#fff3c4', sunY: 0.42 },
        sunset: { top: '#3a3d7a', mid: '#e8756b', low: '#ffc978', sun: '#fff0b0', sunY: 0.62 }
    };

    function skyOf() { return SKIES[G.route ? G.route.sky : 'morning'] || SKIES.morning; }

    function drawSky() {
        var s = skyOf();
        var g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        g.addColorStop(0, s.top);
        g.addColorStop(0.55, s.mid);
        g.addColorStop(1, s.low);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, GROUND_Y + 4);

        /* Mặt trời đứng gần yên một chỗ — nó ở xa hàng trăm cây số, nên bay
         * hai mươi sáu cây số thì nó nhích được đúng một tí. */
        var sunX = W * 0.78 - (P.x / G.route.len) * 90;
        var sunY = GROUND_Y * s.sunY;
        var gg = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 190);
        gg.addColorStop(0, 'rgba(255,247,214,0.95)');
        gg.addColorStop(0.3, 'rgba(255,240,180,0.35)');
        gg.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = gg;
        ctx.fillRect(sunX - 190, sunY - 190, 380, 380);
        ctx.fillStyle = s.sun;
        ctx.beginPath(); ctx.arc(sunX, sunY, 30, 0, 6.284); ctx.fill();
    }

    /* Mây ba lớp. Lớp xa gần như đứng im, lớp gần lướt qua nhanh — cùng một
     * cơn gió, khác nhau ở khoảng cách. Đây là thứ duy nhất nói cho mắt biết
     * bầu trời có CHIỀU SÂU, mà không có chiều sâu thì bay như trượt trên
     * một tấm giấy dán tường. */
    function drawClouds(layer) {
        var par = [0.10, 0.28, 0.62][layer];
        var n = [7, 6, 4][layer];
        var scale = [0.55, 0.85, 1.35][layer];
        var alpha = [0.42, 0.62, 0.9][layer];
        var band = 15000;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        for (var i = 0; i < n * 3; i++) {
            var cx0 = hash(i, layer * 7 + 1) * band;
            var wx = ((cx0 - P.x * par) % band + band) % band;
            var px = (wx - band / 2) * PPM * 0.55 + W / 2;
            if (px < -320 || px > W + 320) continue;
            var alt = 900 + hash(i, layer * 7 + 2) * 2300;
            var py = sy(alt) - layer * 6;
            if (py < -160 || py > GROUND_Y) continue;
            ctx.globalAlpha = alpha;
            puff(px, py, 46 * scale * (0.7 + hash(i, layer + 5) * 0.7));
        }
        ctx.restore();
    }

    function puff(x, y, r) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.52);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.62, 0, 6.284);
        ctx.arc(r * 0.6, 8, r * 0.46, 0, 6.284);
        ctx.arc(-r * 0.62, 10, r * 0.42, 0, 6.284);
        ctx.arc(r * 0.08, -r * 0.34, r * 0.46, 0, 6.284);
        ctx.fill();
        ctx.restore();
    }

    /* ---- MẶT ĐẤT ----
     * Vẽ theo cột, mỗi cột rộng 10 điểm ảnh, hỏi thẳng groundAt(). Không giữ
     * mảng đỉnh núi nào cả: cùng một hàm sinh ra hình vẽ và cùng hàm ấy quyết
     * định máy bay có va không, nên mắt và mã không bao giờ lệch nhau. */
    var TERRAIN_COL = 10;

    /* Màu mặt đất từng vùng: đỉnh sáng, chân tối. Thành phố KHÔNG phải màu
     * xám bê-tông — nhìn từ trên cao xuống một thành phố Việt Nam thì thứ
     * chiếm gần hết mặt đất vẫn là cây và ruộng, nhà chỉ là mấy chấm mọc lên
     * giữa đó. Bản đầu em tô xám cả dải, và trên máy thật nó ra một tấm bê-tông
     * trải dài từ Hà Nội tới Đà Nẵng. */
    function terrainColour(kind) {
        return {
            city: ['#a9c19a', '#6d8f68'],
            fields: ['#a8dc7c', '#5fa246'],
            hills: ['#7cc667', '#3f8a44'],
            mountains: ['#94a58f', '#4d5b4b'],
            coast: ['#f0dfb0', '#cfae7c'],
            sea: ['#3fa9d8', '#1f7fae']
        }[kind] || ['#a8dc7c', '#5fa246'];
    }

    function drawTerrain() {
        var rt = G.route;
        var x0 = P.x - (W * R.PLANE_SX) / PPM - 40;
        var cols = Math.ceil(W / TERRAIN_COL) + 3;

        /* dải sau (mờ, lệch lên) tạo chiều sâu cho dãy núi */
        for (var pass = 0; pass < 2; pass++) {
            var back = pass === 0;
            var topY = H;
            ctx.beginPath();
            ctx.moveTo(-20, H + 20);
            for (var i = 0; i <= cols; i++) {
                var wx = x0 + i * TERRAIN_COL / PPM;
                var g = R.groundAt(rt, wx);
                if (back) g = g * 1.28 + 60;
                var py = sy(g);
                if (py < topY) topY = py;
                ctx.lineTo(i * TERRAIN_COL - 20, py);
            }
            ctx.lineTo(W + 40, H + 20);
            ctx.closePath();

            var seg = R.segmentAt(rt, P.x);
            var c = terrainColour(seg.seg.kind);
            var cn = terrainColour(seg.next.kind);
            var top = seg.k > 0 ? mix(c[0], cn[0], seg.k) : c[0];
            var bot = seg.k > 0 ? mix(c[1], cn[1], seg.k) : c[1];
            /* Dải màu chạy từ ĐỈNH THẬT của mặt đất trong khung hình này xuống
             * đáy màn. Bản đầu em neo nó ở độ cao 2 200 m cố định, nên lúc bay
             * qua đồng bằng — nơi mặt đất chỉ cao vài chục mét — cả dải nằm ở
             * mãi đuôi màu và mặt đất ra một mảng tối đều tịt, không còn thấy
             * đâu là sườn đâu là chân. */
            var grad = ctx.createLinearGradient(0, topY - 6, 0, GROUND_Y + 80);
            grad.addColorStop(0, back ? fade(top, 0.55) : top);
            grad.addColorStop(1, back ? fade(bot, 0.55) : bot);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        drawGroundDetail();
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
    function fade(hexc, t) {
        return mix(hexc, '#cfe6f5', t);
    }

    /* Chi tiết trên mặt đất: nhà, cây, sóng, thuyền. Chọn theo vùng, đặt theo
     * toạ độ nên đứng yên. Đây là thứ trả lời câu "dưới kia là chỗ nào" — mà
     * cả trò chơi này là để trả lời đúng câu ấy. */
    function drawGroundDetail() {
        var rt = G.route;
        var x0 = P.x - (W * R.PLANE_SX) / PPM;
        var span = W / PPM;
        var step = 90;                       // mét giữa hai chi tiết
        var i0 = Math.floor(x0 / step) - 1;
        var n = Math.ceil(span / step) + 3;

        for (var k = 0; k < n; k++) {
            var idx = i0 + k;
            var wx = idx * step + hash(idx, 1) * 60;
            var kind = R.segmentAt(rt, wx).seg.kind;
            var g = R.groundAt(rt, wx);
            var px = sx(wx), py = sy(g);
            if (px < -60 || px > W + 60) continue;
            var r1 = hash(idx, 2), r2 = hash(idx, 3);

            if (kind === 'city') {
                /* Ba khối nhà một cụm, cao thấp khác nhau, có mái sẫm và một
                 * vệt bóng dưới chân. Bản đầu mỗi chỗ đúng một khối chữ nhật
                 * xám nhạt, và trên máy thật chúng ra mấy cái cọc cắm rời rạc
                 * chứ không ra một thành phố. */
                var nb = 2 + (r1 > 0.6 ? 1 : 0);
                for (var bI = 0; bI < nb; bI++) {
                    var bw = 8 + hash(idx, bI + 21) * 7;
                    var bh = 16 + hash(idx, bI + 31) * 52;
                    var bx = px - 14 + bI * 13;
                    ctx.fillStyle = 'rgba(40,55,70,0.22)';
                    ctx.fillRect(bx - 2, py - 1, bw + 5, 4);
                    ctx.fillStyle = hash(idx, bI + 41) > 0.5 ? '#dfe7ee' : '#c3cfda';
                    ctx.fillRect(bx, py - bh, bw, bh);
                    ctx.fillStyle = '#8a97a6';
                    ctx.fillRect(bx, py - bh, bw, 3);
                    ctx.fillStyle = 'rgba(120,150,180,0.55)';
                    for (var wI = 0; wI < 4; wI++) {
                        var wy2 = py - bh + 8 + wI * 11;
                        if (wy2 > py - 5) break;
                        if (hash(idx, bI * 7 + wI + 9) > 0.6) continue;
                        ctx.fillRect(bx + 2, wy2, bw - 4, 3);
                    }
                }
            } else if (kind === 'fields') {
                ctx.fillStyle = r1 > 0.5 ? '#79bd52' : '#96d76e';
                ctx.fillRect(px - 26, py, 52, 7);
                if (r2 > 0.78) {
                    ctx.fillStyle = '#d9694a';
                    ctx.fillRect(px - 4, py - 7, 9, 7);
                }
            } else if (kind === 'hills' || kind === 'mountains') {
                if (r1 > 0.42) {
                    ctx.fillStyle = kind === 'mountains' ? '#3d6b46' : '#2f7a3d';
                    ctx.beginPath();
                    ctx.moveTo(px, py - 12 - r2 * 8);
                    ctx.lineTo(px + 6, py + 1);
                    ctx.lineTo(px - 6, py + 1);
                    ctx.closePath(); ctx.fill();
                }
                if (kind === 'mountains' && g > 1250 && r2 > 0.6) {
                    ctx.fillStyle = 'rgba(255,255,255,0.75)';
                    ctx.fillRect(px - 9, py, 18, 4);
                }
            } else if (kind === 'coast') {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillRect(px - 16, py + 2 + Math.sin(G.t * 1.6 + idx) * 1.5, 30, 2.5);
            }
        }
    }

    /* ---- ĐƯỜNG BĂNG ---- */
    function drawRunway(rw, arriving) {
        var y = sy(rw.y);
        var a = sx(rw.x0), b = sx(rw.x1);
        if (b < -80 || a > W + 80) return;
        /* Bãi cỏ sân bay quanh đường băng: không có nó thì dải bê-tông trôi lơ
         * lửng trên nền đồng ruộng và mắt không đọc ra "đây là một sân bay". */
        ctx.fillStyle = '#8fae7c';
        ctx.fillRect(a - 40, y - 2, b - a + 80, 20);
        ctx.fillStyle = '#565c66';
        ctx.fillRect(a, y - 5, b - a, 15);
        ctx.fillStyle = '#6d747f';
        ctx.fillRect(a, y - 5, b - a, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        for (var x = a + 24; x < b - 24; x += 46) ctx.fillRect(x, y + 1, 24, 2.6);
        /* Đèn đầu đường băng: bốn chấm sáng nhấp nháy so le. Bản mô tả gọi
         * chúng là thứ dẫn đường, nên chúng phải là thứ SÁNG NHẤT trong khung
         * hình lúc hạ cánh — mắt trẻ con đi theo chỗ sáng nhất. */
        if (arriving) {
            for (var i = 0; i < 5; i++) {
                var lx = a + i * 15;
                var blink = Math.sin(G.t * 7 - i * 0.7) > -0.2;
                ctx.fillStyle = blink ? '#fff3a8' : 'rgba(255,243,168,0.25)';
                ctx.beginPath(); ctx.arc(lx, y - 8, 3.4, 0, 6.284); ctx.fill();
            }
        }
    }

    /* ---- ĐƯỜNG TRƯỢT HẠ CÁNH ----
     * Một vệt chấm sáng chỉ thẳng xuống đầu đường băng. Trẻ con không đọc
     * được góc chúc, nhưng "bay men theo mấy chấm sáng" thì đứa nào cũng làm
     * được — và đó là toàn bộ phần dạy hạ cánh của trò chơi này. */
    function drawGlide() {
        if (G.leg !== 'approach' && G.leg !== 'final') return;
        var rt = G.route;
        ctx.save();
        for (var i = 0; i < 26; i++) {
            var wx = P.x + 260 + i * 420;
            if (wx > rt.len) break;
            var a = R.glideAlt(rt, wx);
            var px = sx(wx), py = sy(a);
            if (px < -30 || px > W + 30) continue;
            var tw = 0.45 + 0.55 * Math.abs(Math.sin(G.t * 3 - i * 0.5));
            ctx.fillStyle = 'rgba(255,255,255,' + (tw * 0.85) + ')';
            ctx.beginPath(); ctx.arc(px, py, 3.6, 0, 6.284); ctx.fill();
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
            var px = sx(lm.at);
            if (px < -220 || px > W + 220) continue;
            var g = R.groundAt(rt, lm.at);
            var py = sy(g);
            var shot = G.shots.indexOf(lm.en) >= 0;

            ctx.save();
            if (lm.kind === 'lake') {
                ctx.fillStyle = '#3fa9d8';
                ctx.beginPath(); ctx.ellipse(px, py - 3, 44, 9, 0, 0, 6.284); ctx.fill();
                ctx.fillStyle = '#2f8f4a';
                ctx.beginPath(); ctx.arc(px + 6, py - 4, 5, 0, 6.284); ctx.fill();
                ctx.fillStyle = '#c8963e';
                ctx.fillRect(px + 4, py - 14, 5, 10);
            } else if (lm.kind === 'river') {
                ctx.strokeStyle = '#4fb6e0';
                ctx.lineWidth = 7; ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(px - 70, py + 2);
                ctx.quadraticCurveTo(px - 20, py - 9, px + 14, py + 1);
                ctx.quadraticCurveTo(px + 46, py + 9, px + 82, py - 2);
                ctx.stroke();
            } else if (lm.kind === 'pass') {
                ctx.strokeStyle = '#e6dcc4';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(px - 58, py + 12);
                ctx.quadraticCurveTo(px, py - 16, px + 58, py + 10);
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.beginPath(); ctx.ellipse(px, py + 4, 52, 8, 0, 0, 6.284); ctx.fill();
            } else if (lm.kind === 'beach') {
                ctx.fillStyle = '#f2e2b6';
                ctx.fillRect(px - 80, py - 2, 160, 8);
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.fillRect(px - 80, py + 5 + Math.sin(G.t * 2) * 1.5, 160, 2.5);
                for (var u = 0; u < 4; u++) {
                    ctx.fillStyle = '#ff7a59';
                    ctx.beginPath(); ctx.arc(px - 50 + u * 32, py - 6, 4, Math.PI, 0); ctx.fill();
                }
            } else if (lm.kind === 'bridge') {
                ctx.strokeStyle = '#f0a03c';
                ctx.lineWidth = 5; ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(px - 62, py - 2);
                for (var s = 0; s < 3; s++) {
                    ctx.quadraticCurveTo(px - 42 + s * 42, py - 24, px - 20 + s * 42, py - 2);
                }
                ctx.stroke();
                ctx.fillStyle = '#f0a03c';
                ctx.beginPath();
                ctx.arc(px + 66, py - 8, 6, 0, 6.284); ctx.fill();
                ctx.fillStyle = '#4fb6e0';
                ctx.fillRect(px - 80, py + 4, 170, 6);
            }

            /* Nhãn tên. Chỉ hiện khi đã tới gần — hiện từ xa thì cả bầu trời
             * đầy chữ, mà chữ thì đứa bé sáu tuổi bỏ qua hết. */
            var near = Math.abs(lm.at - P.x) < R.PHOTO_RANGE;
            if (near || shot) {
                var label = name(lm);
                ctx.font = '700 15px Baloo 2, Nunito, sans-serif';
                ctx.textAlign = 'center';
                var tw = ctx.measureText(label).width;
                var ly = py - 44;
                ctx.fillStyle = shot ? 'rgba(60,160,90,0.92)' : 'rgba(20,32,50,0.75)';
                roundRect(ctx, px - tw / 2 - 12, ly - 15, tw + 24, 24, 12);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText((shot ? '📷 ' : '') + label, px, ly + 2);
                ctx.strokeStyle = shot ? 'rgba(60,160,90,0.6)' : 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(px, ly + 9); ctx.lineTo(px, py - 12); ctx.stroke();
            }
            ctx.restore();
        }
    }

    /* ---- VÒNG MÂY VÀ SAO ---- */
    function drawPickups() {
        var rt = G.route, i, o, px, py;
        for (i = 0; i < R.ringCount(rt); i++) {
            if (G.ringDone[i]) continue;
            o = R.ringAt(rt, i);
            if (!o) continue;
            px = sx(o.x);
            if (px < -100 || px > W + 100) continue;
            py = sy(o.alt);
            var pulse = 1 + Math.sin(G.t * 3 + i) * 0.05;
            ctx.save();
            ctx.strokeStyle = 'rgba(150,235,255,0.95)';
            ctx.lineWidth = 7;
            ctx.beginPath(); ctx.arc(px, py, R.RING_PX * pulse, 0, 6.284); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(px, py, R.RING_PX * pulse - 5, 0, 6.284); ctx.stroke();
            ctx.restore();
        }
        for (i = 0; i < R.starCount(rt); i++) {
            if (G.starDone[i]) continue;
            o = R.starAt(rt, i);
            if (!o) continue;
            px = sx(o.x);
            if (px < -40 || px > W + 40) continue;
            py = sy(o.alt) + Math.sin(G.t * 2 + i) * 4;
            drawStar(px, py, 15, '#ffd75e');
        }
    }

    function drawStar(x, y, r, col) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(G.t * 1.3 + x) * 0.15);
        ctx.fillStyle = col;
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var rad = i % 2 ? r * 0.44 : r;
            var a = (i / 10) * 6.284 - 1.571;
            ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }

    /* ---- MÁY BAY ----
     * Nhìn nghiêng, mũi sang phải, thân tròn và ngắn — càng tròn càng thân
     * thiện. Có cả ô cửa buồng lái để bé thấy "có người ngồi trong ấy", và
     * người ấy là mình. */
    function drawPlane() {
        var px = W * R.PLANE_SX;
        var py = sy(P.alt);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-P.bank * 0.22);

        /* vệt khói mảnh phía sau khi bay nhanh */
        if (P.spd > R.SPD_CRUISE * 0.8 && !P.onGround) {
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-34, 2);
            ctx.lineTo(-34 - (P.spd - R.SPD_CRUISE * 0.8) * 0.5, 2);
            ctx.stroke();
        }

        /* cánh sau */
        ctx.fillStyle = '#e05a4a';
        ctx.beginPath();
        ctx.moveTo(-26, -1); ctx.lineTo(-34, -17); ctx.lineTo(-20, -2);
        ctx.closePath(); ctx.fill();

        /* thân */
        ctx.fillStyle = '#f4f7fb';
        roundRect(ctx, -32, -8, 62, 16, 8); ctx.fill();
        /* mũi */
        ctx.beginPath();
        ctx.moveTo(26, -8); ctx.quadraticCurveTo(40, 0, 26, 8); ctx.closePath();
        ctx.fill();

        /* dải màu dọc thân */
        ctx.fillStyle = '#3aa7e0';
        roundRect(ctx, -30, -1, 58, 5, 3); ctx.fill();

        /* cánh chính, vẽ SAU thân nên nó nằm phía trước — nhìn nghiêng thì
         * cánh gần mắt hơn thân */
        ctx.fillStyle = '#d94f42';
        ctx.beginPath();
        ctx.moveTo(6, 0); ctx.lineTo(-14, 20); ctx.lineTo(4, 21); ctx.lineTo(16, 2);
        ctx.closePath(); ctx.fill();

        /* buồng lái */
        ctx.fillStyle = '#2b4a68';
        ctx.beginPath();
        ctx.moveTo(14, -7); ctx.quadraticCurveTo(25, -7, 27, -1); ctx.lineTo(14, -1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(190,235,255,0.9)';
        ctx.fillRect(16, -6, 8, 4);

        /* càng: chỉ thò ra lúc còn thấp — mắt đọc được "sắp chạm đất rồi" */
        if (P.gear) {
            ctx.strokeStyle = '#4a5666'; ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(14, 7); ctx.lineTo(14, 14);
            ctx.moveTo(-14, 7); ctx.lineTo(-14, 14);
            ctx.stroke();
            ctx.fillStyle = '#2b3441';
            ctx.beginPath(); ctx.arc(14, 15, 3.2, 0, 6.284); ctx.fill();
            ctx.beginPath(); ctx.arc(-14, 15, 3.2, 0, 6.284); ctx.fill();
        }
        ctx.restore();

        /* Bóng đổ trên mặt đất. Nó làm được một việc mà không con số nào làm
         * nổi: cho mắt thấy máy bay đang ở CÁCH mặt đất bao xa. Càng thấp
         * bóng càng nhỏ và càng đậm. */
        var gy = sy(R.groundAt(G.route, P.x));
        var h = clamp((P.alt - R.groundAt(G.route, P.x)) / 2200, 0, 1);
        ctx.save();
        ctx.globalAlpha = 0.35 * (1 - h);
        ctx.fillStyle = '#123';
        ctx.beginPath();
        ctx.ellipse(px, gy + 3, 30 - h * 16, 5 - h * 3, 0, 0, 6.284);
        ctx.fill();
        ctx.restore();
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

    function draw() {
        ctx.save();
        if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);

        drawSky();
        drawClouds(0);
        if (G.route) {
            drawTerrain();
            drawRunway(R.departRunway(G.route), false);
            drawRunway(R.arriveRunway(G.route), true);
            drawLandmarks();
            drawClouds(1);
            drawGlide();
            drawPickups();
            if (G.phase === 'fly' || G.phase === 'pause') drawPlane();
            drawParticles();
            drawClouds(2);
        }
        ctx.restore();

        if (G.flash > 0) {
            ctx.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.75) + ')';
            ctx.fillRect(0, 0, W, H);
        }
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

    function setAutoBtn() {
        el('btn-auto').classList.toggle('is-on', G.auto);
    }

    function wireInput() {
        holdBtn('btn-up', function () { setPitch(1); }, function () { setPitch(0); });
        holdBtn('btn-down', function () { setPitch(-1); }, function () { setPitch(0); });
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
            if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); Sfx.wake(); setPitch(1); }
            else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); Sfx.wake(); setPitch(-1); }
            else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); Sfx.wake(); P.thrUp = 1; }
            else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); P.thrDn = 1; }
            else if (k === ' ') { e.preventDefault(); Sfx.wake(); takePhoto(); }
            else if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
        });
        window.addEventListener('keyup', function (e) {
            var k = e.key;
            if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'ArrowDown' || k === 's' || k === 'S') setPitch(0);
            if (k === 'ArrowRight' || k === 'd' || k === 'D') P.thrUp = 0;
            if (k === 'ArrowLeft' || k === 'a' || k === 'A') P.thrDn = 0;
        });
        window.addEventListener('blur', function () {
            setPitch(0); P.thrUp = 0; P.thrDn = 0;
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

        G.route = R.ROUTES[0];
        P.x = 2000; P.alt = 1400; P.spd = R.SPD_CRUISE;
        renderRoutes();
        showScreen('menu-overlay');

        window.FlightDebug = {
            G: G, P: P, R: R, start: startFlight, update: update, draw: draw,
            photo: takePhoto, hud: syncHud, Sfx: Sfx, store: store,
            setPitch: setPitch, backToMenu: backToMenu
        };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
