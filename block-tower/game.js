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
     *
     * ĐẶT LỊCH THEO ĐỒNG HỒ CỦA CARD ÂM THANH, KHÔNG DÙNG setTimeout.
     *
     * Bản đầu em rải mấy nốt của một hợp âm bằng setTimeout. Chạy thì nghe
     * cũng được, nhưng setTimeout là đồng hồ của trình duyệt: máy bận một nhịp
     * là nó trễ hàng chục mili-giây, và mấy nốt lệch nhau nghe rõ. Đặt lịch
     * bằng ctx.currentTime + delay thì card âm thanh tự lo, đúng từng mẫu.
     *
     * CÓ MỘT KHỐI TRỘN CHUNG (master) và một bộ nén: lúc ăn bốn hàng thì năm
     * sáu tiếng chồng lên nhau, không nén thì vỡ tiếng.
     * ======================================================================*/

    var sfx = {
        ctx: null, master: null, noiseBuf: null, on: true,
        /* máy soát bật cờ này để ghi lại từng tiếng phát ra lúc nào */
        trace: false, log: [],

        init: function () { try { this.on = localStorage.getItem(KEY + '_sound') !== 'off'; } catch (e) { } },

        wake: function () {
            if (!this.ctx) {
                var C = window.AudioContext || window.webkitAudioContext;
                if (!C) return;
                this.ctx = new C({ latencyHint: 'interactive' });
                /* KHÔNG dùng bộ nén.
                 *
                 * Em thêm nó để lúc ăn bốn hàng nhiều tiếng chồng nhau khỏi vỡ.
                 * Nhưng bộ nén của trình duyệt có một quãng "nhìn trước" và nó
                 * bào mòn đúng cái đầu tiếng — mà đầu tiếng mới là thứ tai dùng
                 * để biết âm thanh xảy ra lúc nào. Tiếng vì thế nghe nhũn và
                 * như tới muộn, dù đặt lịch đúng. Bỏ nén đi, hạ âm lượng từng
                 * tiếng xuống cho khỏi vỡ là xong, mà đầu tiếng thì sắc lại. */
                this.master = this.ctx.createGain();
                this.master.gain.setValueAtTime(0.75, this.ctx.currentTime);
                this.master.connect(this.ctx.destination);
                this.makeNoise();
            }
            if (this.ctx.state === 'suspended') this.ctx.resume();
        },

        toggle: function () {
            this.on = !this.on;
            try { localStorage.setItem(KEY + '_sound', this.on ? 'on' : 'off'); } catch (e) { }
        },

        /* Một giây tiếng ồn trắng, dựng sẵn một lần. Tiếng va chạm phải có ồn
         * mới ra "cộp"; chỉ dùng sóng thuần thì nghe như tiếng đàn, không ra
         * tiếng khối gạch đặt xuống. */
        makeNoise: function () {
            var n = this.ctx.sampleRate;
            var buf = this.ctx.createBuffer(1, n, n);
            var d = buf.getChannelData(0);
            for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            this.noiseBuf = buf;
        },

        mark: function (name) { if (this.trace) this.log.push({ name: name, t: Date.now() }); },

        /* Máy âm thanh có đang CHẠY không. Đây là chỗ em suýt bỏ sót.
         *
         * Khi trình duyệt còn treo máy âm thanh — chưa có cú chạm nào, hoặc bé
         * chuyển sang tab khác — thì ctx.currentTime ĐỨNG YÊN. Mọi tiếng đặt
         * lịch trong lúc ấy đều rơi vào cùng một mốc trong quá khứ, và tới lúc
         * máy chạy lại thì chúng nổ ra một loạt. Tai nghe thành "tiếng chạy sau
         * hình", mà thật ra là tiếng của mấy giây trước dồn lại.
         *
         * Nên thà bỏ hẳn tiếng ấy còn hơn để nó kêu sai lúc. */
        ready: function () {
            if (!this.on || !this.ctx) return false;
            if (this.ctx.state !== 'running') { this.ctx.resume(); return false; }
            return true;
        },

        /* delay tính bằng GIÂY, đặt lịch trên đồng hồ âm thanh */
        tone: function (f0, f1, dur, type, vol, delay) {
            if (!this.ready()) return;
            var t = this.ctx.currentTime + (delay || 0);
            var o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(f0, t);
            if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            /* Vào trong 1,5 mili-giây rồi tắt dần. Bản trước em cho vào trong
             * 6ms bằng đường cong mũ — đủ để đầu tiếng mềm đi và tai thấy nó
             * "đến sau" cú bấm. 1,5ms thì vừa đủ không kêu "tạch", mà vẫn sắc. */
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol || 0.05, t + 0.0015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(this.master);
            o.start(t); o.stop(t + dur + 0.02);
        },

        /* tiếng ồn đã lọc — dùng cho va chạm và tiếng gió */
        hit: function (dur, vol, freq, type, delay) {
            if (!this.ready() || !this.noiseBuf) return;
            var t = this.ctx.currentTime + (delay || 0);
            var src = this.ctx.createBufferSource();
            src.buffer = this.noiseBuf;
            var f = this.ctx.createBiquadFilter();
            f.type = type || 'lowpass';
            f.frequency.setValueAtTime(freq, t);
            var g = this.ctx.createGain();
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(f); f.connect(g); g.connect(this.master);
            src.start(t); src.stop(t + dur + 0.02);
        },

        /* ---- những tiếng của trò chơi ---- */

        move: function () { this.mark('move'); this.tone(760, 700, 0.035, 'triangle', 0.030); },

        turn: function () {
            this.mark('turn');
            this.tone(520, 880, 0.055, 'triangle', 0.038);
        },

        /* CHẠM ĐÁY — phát ngay lúc quân vừa đặt chân lên đống, KHÔNG đợi tới
         * lúc nó gắn vào giếng.
         *
         * Đây đúng là lỗi anh Hiếu nghe ra: em chỉ có một tiếng và đặt nó ở chỗ
         * gắn, mà giữa lúc chạm với lúc gắn còn 0,45 giây ân huệ cho bé xoay
         * nốt. Mắt thấy khối nằm im rồi, tai nửa giây sau mới nghe. Tách làm
         * hai tiếng thì cả hai đều đúng lúc: "cộp" khi chạm, "cạch" khi gắn. */
        touch: function () {
            this.mark('touch');
            this.tone(190, 96, 0.09, 'square', 0.055);
            this.hit(0.07, 0.11, 900, 'lowpass');
        },

        /* GẮN VÀO GIẾNG — tiếng nhẹ hơn, chỉ để đóng lại một nhịp */
        lock: function () {
            this.mark('lock');
            this.tone(320, 240, 0.05, 'square', 0.028);
            this.hit(0.04, 0.05, 2200, 'highpass');
        },

        /* THẢ NHANH — tiếng gió rơi rồi mới tới cú va */
        drop: function () {
            this.mark('drop');
            this.hit(0.13, 0.09, 1400, 'lowpass');
            this.tone(420, 90, 0.13, 'sawtooth', 0.045);
        },

        /* ĂN HÀNG — càng nhiều hàng càng lên cao và càng dài. Bốn hàng một lúc
         * được thêm một nốt chót vót, để bé nghe là biết mình vừa làm được cái
         * khó nhất. */
        line: function (n) {
            this.mark('line' + n);
            var scale = [523, 659, 784, 1047, 1319];
            var k = Math.min(n, 4);
            for (var i = 0; i < k + 1; i++) {
                this.tone(scale[i] * (1 + (k - 1) * 0.06), 0, 0.16, 'triangle', 0.055, i * 0.055);
            }
            this.hit(0.10, 0.07, 3000, 'highpass');
            if (k >= 4) this.tone(2093, 2093, 0.30, 'triangle', 0.05, 0.24);
        },

        /* HÀNG TOÀN VÀNG — tiếng lấp lánh, khác hẳn tiếng ăn hàng thường */
        gold: function () {
            this.mark('gold');
            var f = [1047, 1319, 1568, 2093, 2637];
            for (var i = 0; i < f.length; i++) this.tone(f[i], f[i], 0.13, 'triangle', 0.042, i * 0.05);
        },

        level: function () {
            this.mark('level');
            var f = [392, 523, 659, 784, 1047];
            for (var i = 0; i < f.length; i++) this.tone(f[i], f[i], 0.20, 'triangle', 0.05, i * 0.09);
        },

        over: function () {
            this.mark('over');
            var f = [523, 440, 349, 262];
            for (var i = 0; i < f.length; i++) this.tone(f[i], f[i] * 0.94, 0.34, 'sawtooth', 0.05, i * 0.17);
            this.hit(0.5, 0.05, 500, 'lowpass', 0.5);
        },

        /* TIẾNG TÍCH KHI KHỐI TỰ TRÔI XUỐNG MỘT HÀNG.
         *
         * Anh Hiếu nhắc: "các khối gạch tự trôi cũng đều có các âm thanh tick
         * tick đi kèm cơ mà". Đúng, và nó không chỉ để cho vui: tiếng tích là
         * cái đồng hồ của ván chơi. Nghe nhịp tích nhanh dần là bé biết mình
         * đã lên bàn cao mà không cần liếc lên bảng điểm.
         *
         * Phải RẤT khẽ. To bằng tiếng đẩy ngang thì mỗi giây kêu một cái, chơi
         * mười phút là inh tai. */
        tick: function (soft) {
            this.mark('tick');
            this.tone(soft ? 1600 : 1200, 0, 0.018, 'square', soft ? 0.008 : 0.016);
        }
    };

    /* ========================================================================
     *  3b. NHẠC NỀN
     *
     * Anh Hiếu: "các game kiểu này có nhạc nền vui tươi khi chơi mà sao em
     * không có". Đúng, thiếu hẳn. Nhưng game của mình không tải tệp âm thanh
     * nào, nên nhạc phải DỰNG BẰNG MÃ: một bản tám ô nhịp, ba bè — bè giai
     * điệu, bè trầm, và tiếng gõ nhịp.
     *
     * ĐẶT LỊCH TRƯỚC MỘT KHOẢNG, KHÔNG PHÁT TỪNG NỐT ĐÚNG LÚC.
     * Cứ 25 mili-giây ngó một lần, và đặt lịch sẵn mọi nốt rơi vào 120 mili
     * giây tới. setInterval có trễ vài chục mili-giây cũng không sao, vì nốt
     * đã nằm sẵn trên đồng hồ của card âm thanh rồi. Phát đúng lúc gọi thì chỉ
     * cần máy khựng một nhịp là nhạc vấp — mà lúc ăn bốn hàng là lúc máy bận
     * nhất, đúng lúc không được vấp nhất.
     *
     * NHỊP NHANH DẦN THEO BÀN: 120 nhịp một phút ở bàn 1, mỗi bàn thêm 4, chặn
     * ở 168. Bé lên bàn cao thì nhạc cũng gấp gáp theo, không cần nói cũng
     * thấy căng.
     * ======================================================================*/

    var music = {
        playing: false, timer: null, step: 0, nextT: 0, bpm: 120, gain: null,

        /* KHÔNG PHẢI MỘT BÀI HÁT — chỉ là một vòng nền.
         *
         * Bản đầu em viết hẳn một giai điệu tám ô nhịp có câu có nhịp. Anh Hiếu
         * nghe rồi bảo: nhạc nền không cần bài hát gì đâu, chỉ cần một đoạn lặp
         * đi lặp lại nghe vui tươi là được. Anh đúng — giai điệu có câu thì tai
         * bám theo nó, mà tai đang phải để dành cho tiếng khối chạm đáy và
         * nhịp tích. Nhạc nền hay là nhạc nền mình quên mất là nó đang chạy.
         *
         * Nên giờ chỉ còn bốn ô nhịp RẢI HỢP ÂM lên xuống: gốc – ba – năm –
         * tám – năm – ba – gốc – năm. Không câu, không cao trào, cứ thế quay
         * vòng. Vòng hoà thanh La thứ – Fa – Đô – Sol giữ nguyên vì nó sáng và
         * đi tới. */
        MELODY: [
            69, 72, 76, 81, 76, 72, 69, 76,
            65, 69, 72, 77, 72, 69, 65, 72,
            72, 76, 79, 84, 79, 76, 72, 79,
            67, 71, 74, 79, 74, 71, 67, 74
        ],
        /* nốt trầm mỗi ô nhịp: La – Fa – Đô – Sol */
        BASS: [45, 41, 48, 43],

        freq: function (midi) { return 440 * Math.pow(2, (midi - 69) / 12); },

        start: function () {
            if (this.playing) return;
            sfx.wake();
            if (!sfx.ctx) return;
            if (!this.gain) {
                this.gain = sfx.ctx.createGain();
                /* Nhạc nền phải NHỎ hơn hẳn tiếng game. Nó là nền, không được
                 * át tiếng khối chạm đáy — mà tiếng ấy mới là thứ bé cần nghe
                 * để biết chuyện gì vừa xảy ra. */
                this.gain.gain.setValueAtTime(0.13, sfx.ctx.currentTime);
                this.gain.connect(sfx.master);
            }
            this.playing = true;
            this.step = 0;
            this.nextT = sfx.ctx.currentTime + 0.08;
            var self = this;
            this.timer = setInterval(function () { self.pump(); }, 25);
        },

        stop: function () {
            this.playing = false;
            if (this.timer) { clearInterval(this.timer); this.timer = null; }
        },

        setLevel: function (lv) { this.bpm = Math.min(168, 120 + (lv - 1) * 4); },

        /* Đặt lịch sẵn mọi nốt rơi vào 120 mili-giây tới */
        pump: function () {
            if (!this.playing || !sfx.on || !sfx.ctx || sfx.ctx.state !== 'running') return;
            var spb = 60 / this.bpm / 2;              // một nốt móc đơn

            /* BẮT NHỊP LẠI nếu đã tụt lại quá xa.
             *
             * Cùng một lớp lỗi với tiếng game vừa sửa. Bé chuyển sang tab khác
             * thì trình duyệt hãm setInterval xuống một lần mỗi giây, còn máy
             * âm thanh vẫn chạy. Quay lại, mốc nốt kế tiếp đã nằm mấy giây
             * trong quá khứ, và vòng lặp dưới sẽ đặt lịch một lúc mấy chục nốt
             * — nhạc nổ ra một tràng rồi mới trở lại bình thường. Thà bỏ đoạn
             * đã lỡ, bắt vào nhịp từ bây giờ. */
            if (this.nextT < sfx.ctx.currentTime - 0.2) {
                this.nextT = sfx.ctx.currentTime + 0.05;
            }

            while (this.nextT < sfx.ctx.currentTime + 0.12) {
                this.emit(this.step, this.nextT, spb);
                this.nextT += spb;
                this.step = (this.step + 1) % this.MELODY.length;
            }
        },

        emit: function (i, t, spb) {
            var c = sfx.ctx, m = this.MELODY[i];

            /* bè giai điệu */
            /* Sóng tam giác chứ không phải vuông: vuông nghe chói và nổi lên
             * trước, mà đây là bè NỀN, nó phải chịu nằm dưới. */
            if (m) this.note(this.freq(m), t, spb * 0.85, 'triangle', 0.045);

            /* bè trầm: gõ ở phách 1 và 3 của mỗi ô nhịp */
            var inBar = i % 8, bar = Math.floor(i / 8);
            if (inBar === 0 || inBar === 4) {
                this.note(this.freq(this.BASS[bar]), t, spb * 1.5, 'triangle', 0.075);
            }
            if (inBar === 2 || inBar === 6) {
                this.note(this.freq(this.BASS[bar] + 7), t, spb * 0.8, 'triangle', 0.045);
            }

            /* tiếng gõ nhịp: nhẹ ở mọi nốt, nhấn ở phách chẵn */
            if (sfx.noiseBuf) {
                var src = c.createBufferSource();
                src.buffer = sfx.noiseBuf;
                var f = c.createBiquadFilter();
                f.type = 'highpass';
                f.frequency.setValueAtTime(7000, t);
                var g = c.createGain();
                var v = (inBar % 2 === 0) ? 0.030 : 0.014;
                g.gain.setValueAtTime(v, t);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
                src.connect(f); f.connect(g); g.connect(this.gain);
                src.start(t); src.stop(t + 0.05);
            }
        },

        note: function (freq, t, dur, type, vol) {
            var c = sfx.ctx;
            var o = c.createOscillator(), g = c.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(this.gain);
            o.start(t); o.stop(t + dur + 0.02);
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
                /* Giếng ăn 76% chiều cao chứ không phải 70%: đo lại thấy dưới
                 * đáy còn thừa cả một dải trống, mà ô to thêm được vài pixel là
                 * ngón tay bé chạm dễ hơn hẳn. Chừa 13% trên cho bảng điểm và
                 * chừng 11% dưới cho hàng nút bấm. */
                var wantW = W * 0.62, wantH = H * 0.76;
                CELL = Math.floor(Math.min(wantW / R.COLS, wantH / R.ROWS));
                var bw = CELL * R.COLS, bh = CELL * R.ROWS;
                OX = Math.round((W - bw) / 2 - CELL * A.DEPTH * 0.5);
                OY = Math.round(H * 0.13);

                /* Báo cho phần HTML biết miệng giếng nằm ở đâu, tính theo phần
                 * trăm mặt tranh. Nhờ vậy ô NEXT dán được sát ngay cạnh giếng
                 * thay vì nằm chết ở góc — mà chỗ ấy thì đúng như anh Hiếu nói,
                 * xa quá không ai để ý. */
                var st = document.querySelector('.stage');
                if (st) {
                    st.style.setProperty('--well-right', (100 * (OX + bw) / W).toFixed(2) + '%');
                    st.style.setProperty('--well-left', (100 * OX / W).toFixed(2) + '%');
                    st.style.setProperty('--well-top', (100 * OY / H).toFixed(2) + '%');
                }
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

                /* Chạm thì LÀM NGAY lúc ngón tay đặt xuống, không đợi nhấc lên.
                 *
                 * Bản đầu em xử lý ở pointerup vì cần phân biệt "chạm" với
                 * "vuốt". Nhưng như thế thì khối chỉ nhúc nhích lúc bé NHẤC
                 * NGÓN TAY — mà khoảng cách giữa đặt xuống và nhấc lên của trẻ
                 * con là một hai phần mười giây. Cả hình lẫn tiếng đều đến muộn
                 * bằng đúng chừng ấy. Giờ đẩy và xoay làm ngay ở pointerdown,
                 * còn vuốt xuống vẫn nhận ra được ở pointermove. */
                this.input.on('pointerdown', function (p) {
                    if (G.mode !== 'play') return;
                    sfx.wake();
                    self.touchX = p.x; self.touchY = p.y; self.swiped = false;
                    var bw = CELL * R.COLS;
                    if (p.x < OX + bw * 0.28) self.tryMove(-1);
                    else if (p.x > OX + bw * 0.72) self.tryMove(1);
                    else self.tryRotate(1);
                });
                this.input.on('pointermove', function (p) {
                    if (G.mode !== 'play' || self.touchX === undefined || self.swiped) return;
                    var dy = p.y - self.touchY;
                    /* Vuốt xuống một quãng bằng hai ô là thả rơi thẳng. Ngưỡng
                     * tính theo cạnh ô chứ không phải theo pixel: cùng một cú
                     * vuốt phải cho cùng một kết quả trên máy to lẫn máy nhỏ. */
                    if (dy > CELL * 1.8) { self.hardDrop(); self.swiped = true; }
                });
                this.input.on('pointerup', function () { self.touchX = undefined; });

                window.addEventListener('keydown', function (ev) {
                    if (G.mode === 'play') {
                        /* Bật máy âm thanh TRƯỚC khi làm gì.
                         *
                         * Trước đây dòng này nằm ở CUỐI, sau cả tryMove/tryRotate.
                         * Nghĩa là ở lần bấm đầu tiên, hàm phát tiếng chạy lúc máy
                         * âm thanh còn chưa dựng nên nó lặng thinh — bé bấm phát
                         * đầu không nghe gì, và cảm giác "tiếng chạy sau tay" bắt
                         * đầu từ đúng chỗ ấy. */
                        sfx.wake();
                        var used = true;
                        if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') self.tryMove(-1);
                        else if (ev.code === 'ArrowRight' || ev.code === 'KeyD') self.tryMove(1);
                        else if (ev.code === 'ArrowUp' || ev.code === 'KeyW' || ev.code === 'KeyX') self.tryRotate(1);
                        else if (ev.code === 'KeyZ') self.tryRotate(-1);
                        else if (ev.code === 'ArrowDown' || ev.code === 'KeyS') G.soft = true;
                        else if (ev.code === 'Space') self.hardDrop();
                        else used = false;
                        if (used) ev.preventDefault();
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
                sfx.touch();
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
                music.setLevel(1);
                music.start();
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
                    music.stop();
                    UI.finish();
                    return;
                }
                UI.paintNext();
            },

            lockPiece: function () {
                var over = R.lock(G.board, G.piece);
                sfx.lock();
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
                if (over) { G.mode = 'over'; music.stop(); UI.finish(); return; }
                this.nextPiece();
            },

            finishClear: function () {
                var n = G.clearRows.length;
                var mult = R.clearRows(G.board, G.clearRows);
                G.score += R.scoreLines(n, G.level, mult);
                G.lines += n;
                var lv = R.levelFor(G.lines);
                if (lv !== G.level) { G.level = lv; sfx.level(); music.setLevel(lv); UI.paintRoom(); }
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
                    if (G.grace === 0) { G.grace = LOCK_GRACE; sfx.touch(); }
                    G.grace -= dt;
                    if (G.grace <= 0) { this.lockPiece(); return; }
                } else {
                    G.grace = 0;
                    while (G.fall >= delay) {
                        G.fall -= delay;
                        if (R.fits(G.board, R.moved(G.piece, 0, 1))) {
                            G.piece = R.moved(G.piece, 0, 1);
                            sfx.tick(G.soft);
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
            if (G.mode === 'play') { G.mode = 'pause'; music.stop(); show(el('pause-overlay')); }
            else if (G.mode === 'pause') { G.mode = 'play'; music.start(); hide(el('pause-overlay')); }
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
        music.stop();
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
        soundBtn.addEventListener('click', function () {
            sfx.wake();
            sfx.toggle();
            /* Tắt tiếng là tắt CẢ nhạc nền. Để nhạc chạy tiếp lúc bé đã bấm
             * tắt tiếng thì bé bấm thêm mấy lần nữa rồi kết luận là nút hỏng. */
            if (sfx.on) { if (G.mode === 'play') music.start(); }
            else music.stop();
            paintSound();
        });
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
            },
            sfx: sfx, music: music
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
