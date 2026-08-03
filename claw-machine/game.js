/**
 * MÁY GẮP THÚ (Claw Machine) — KIBU Games
 * ----------------------------------------------------------------------------
 * Cái càng sắt treo lơ lửng trong tủ kính. Bé lái nó chạy ngang, bấm thả, càng
 * hạ xuống rồi khép lại quắp con thú bông và kéo lên. Trên đường về con thú
 * tuột dần... tuột dần... đó chính là cái hay của trò này.
 *
 * CHẠY TRÊN PHASER 3 + MATTER
 * Đây là game đầu tiên của nhà mình mà VẬT LÝ CHÍNH LÀ TRÒ CHƠI, không phải
 * phần trang trí: đống thú đè lên nhau, càng quắp trúng chỗ nào thì giữ được
 * chỗ ấy, ma sát quyết định con thú có tuột hay không, và con thú rơi xuống
 * lại xô cả đống. Không có gì dựng sẵn.
 *
 * CHỖ KHÁC MÁY GẮP THÚ NGOÀI ĐỜI: MÁY NÀY KHÔNG ĂN GIAN
 * Máy thật gian lận có hệ thống — nhà sản xuất chỉnh lực càng yếu đi, cứ vài
 * chục lượt mới cho một lượt đủ lực quắp chặt. Trẻ con tưởng mình dở, thật ra
 * máy không cho thắng.
 *
 * Ở đây lực càng là MỘT HẰNG SỐ, không có lượt xui lượt hên, không có bộ đếm
 * nào rình cho bé trượt. Gắp trượt chỉ vì bé ngắm lệch hoặc con thú nằm khó.
 * Chứng minh được: mở /claw-machine/check-grab.html, máy gắp thử vài trăm lượt
 * ở mọi vị trí rồi in ra tỉ lệ trúng.
 *
 * Bố cục file:
 *   1. Cấu hình   2. Tiến trình   3. Âm thanh   4. Trạng thái
 *   5. Scene Phaser (tủ, đống thú, càng gắp)    6. Giao diện   7. Khởi động
 */
(function () {
    'use strict';

    var M = Phaser.Physics.Matter.Matter;
    var P = window.Plush;

    /* ========================================================================
     *  1. CẤU HÌNH
     * ------------------------------------------------------------------------
     *  Thế giới cố định 720×1000 rồi co cho vừa khung (Scale.FIT). Khác Vặn Ốc
     *  ở chỗ này là có lý do: đây là game vật lý, mà đổi kích thước thế giới
     *  giữa chừng thì phải dựng lại toàn bộ vật thể — đống thú đang xếp thế nào
     *  sẽ đổ hết. Cái tủ vốn cao hơn rộng nên tỉ lệ này hợp cả máy tính lẫn
     *  điện thoại dựng đứng.
     * ======================================================================*/

    var W = 720, H = 1000;

    /* Lòng tủ */
    var BOX = { x: 46, y: 150, w: 628, h: 690 };
    var FLOOR_Y = BOX.y + BOX.h;
    var RAIL_Y = BOX.y + 34;              // thanh ray càng chạy trên đó

    /* Cửa trả thưởng nằm góc trái, thú rơi vào đây là ăn */
    var CHUTE = { x: BOX.x + 6, w: 132, top: FLOOR_Y - 150 };

    var CLAW = {
        homeX: CHUTE.x + CHUTE.w / 2,
        minX: BOX.x + 70,
        maxX: BOX.x + BOX.w - 70,
        topY: RAIL_Y + 46,
        /* Càng hạ tới đây thì dừng. Chọn sao cho hai gọng kẹp vào KHOẢNG GIỮA
         * con thú chứ không kẹp vào mép dưới sát sàn — kẹp mép dưới thì con thú
         * chỉ bị đẩy trượt đi, không có chỗ nào để giữ. */
        maxDropY: FLOOR_Y - 112,
        speed: 300,                        // ô/giây khi bé giữ nút
        dropSpeed: 330,
        liftSpeed: 260,
        travelSpeed: 300,
        armLen: 74,
        armW: 15,
        openAngle: 0.66,                   // radian, lúc mở
        closeAngle: 0.08,                  // radian, lúc khép hết
        closeTime: 0.42
    };

    /* LỰC CÀNG LÀ HẰNG SỐ — xem ghi chú đầu tệp. Ba con số dưới đây là tất cả
     * những gì quyết định giữ được hay tuột, và không dòng nào trong game được
     * phép đổi chúng theo lượt chơi, theo số lần thắng, hay theo bất cứ thứ gì
     * khác. Ai sửa chỗ này thì sửa cho cả game, không sửa lén cho một bé. */
    var GRIP = {
        friction: 0.92,        // ma sát mặt trong càng
        plushFriction: 0.78,
        plushDensity: 0.0016
    };

    var PLUSH_R = 40;                      // nửa bề ngang con thú
    var DRAW_R = PLUSH_R * 0.86;           // cỡ vẽ (hình vẽ nhỏ hơn khối vật lý một chút)
    var TEX_W = PLUSH_R * 3.4, TEX_H = PLUSH_R * 3.6;
    var DRAW_Y = PLUSH_R * 2.05;           // gốc vẽ nằm đâu trong tấm texture
    var PILE_COUNT = 12;                   /* Số thú trong tủ — đây là nút vặn ĐỘ KHÓ
                                            mạnh nhất, không phải chuyện trang trí.
                                            Máy đo nói rõ: 12 con → gắp trúng 66%,
                                            14 con → 83%, 18 con → 98% (tủ chật tới
                                            mức thò càng xuống đâu cũng dính). Chọn
                                            12 để bé vẫn thắng nhiều mà vẫn hồi hộp. */
    var TURNS_SOLO = 10;
    var TURNS_EACH = 5;                    // chế độ nhiều bé: mỗi bé mấy lượt

    var STORE_KEY = 'kibu_claw_shelf';
    var SOUND_KEY = 'kibu_claw_sound';

    /* ========================================================================
     *  2. TIẾN TRÌNH — cái tủ trưng bày
     * ======================================================================*/

    var store = {
        data: { got: {}, best: 0, plays: 0 },

        load: function () {
            try {
                var raw = localStorage.getItem(STORE_KEY);
                if (raw) {
                    var d = JSON.parse(raw);
                    for (var k in d) this.data[k] = d[k];
                }
            } catch (e) { }
        },
        save: function () {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        add: function (id) {
            this.data.got[id] = (this.data.got[id] || 0) + 1;
            this.save();
        },
        countKinds: function () {
            var n = 0;
            for (var k in this.data.got) if (this.data.got[k]) n++;
            return n;
        },
        record: function (n) {
            this.data.plays++;
            if (n > (this.data.best || 0)) { this.data.best = n; this.save(); return true; }
            this.save();
            return false;
        },
        reset: function () { this.data = { got: {}, best: 0, plays: 0 }; this.save(); }
    };

    /* ========================================================================
     *  3. ÂM THANH
     * ------------------------------------------------------------------------
     *  Tổng hợp bằng Web Audio, không tải tệp nào — giống mọi game khác của nhà
     *  mình. Tiếng máy gắp phải nghe ra kim loại: mô-tơ è è lúc chạy, tiếng
     *  "cạch" lúc càng khép, tiếng dây kéo lúc lên.
     * ======================================================================*/

    var sfx = {
        on: true, ctx: null, motorOsc: null, motorGain: null,

        init: function () { try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { } },
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
            if (!this.on) this.motor(false);
            return this.on;
        },
        tone: function (f, dur, type, vol, to) {
            if (!this.on || !this.ctx) return;
            var t = this.ctx.currentTime;
            var o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(f, t);
            if (to) o.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
            g.gain.setValueAtTime(vol == null ? 0.1 : vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g).connect(this.ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        },
        noise: function (dur, vol, band) {
            if (!this.on || !this.ctx) return;
            var ac = this.ctx, len = Math.max(1, Math.floor(ac.sampleRate * dur));
            var buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
            for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            var s = ac.createBufferSource(); s.buffer = buf;
            var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = band || 1200;
            var g = ac.createGain(); g.gain.value = vol == null ? 0.08 : vol;
            s.connect(f); f.connect(g); g.connect(ac.destination);
            s.start();
        },
        /* Mô-tơ kêu è è suốt lúc càng chạy — bật tắt theo chuyển động */
        motor: function (on) {
            if (!this.ctx || !this.on) return;
            if (on && !this.motorOsc) {
                var o = this.ctx.createOscillator(), g = this.ctx.createGain();
                o.type = 'sawtooth';
                o.frequency.value = 62;
                g.gain.value = 0.028;
                o.connect(g).connect(this.ctx.destination);
                o.start();
                this.motorOsc = o; this.motorGain = g;
            } else if (!on && this.motorOsc) {
                try { this.motorOsc.stop(); } catch (e) { }
                this.motorOsc = null;
            }
        },
        clack: function () { this.noise(0.09, 0.09, 2400); this.tone(220, 0.08, 'square', 0.05, 140); },
        winch: function () { this.tone(150, 0.5, 'sawtooth', 0.03, 230); },
        thud: function () { this.noise(0.16, 0.07, 300); this.tone(120, 0.16, 'sine', 0.06, 70); },
        prize: function () {
            [660, 880, 1170, 1320].forEach(function (f, i) {
                setTimeout(function () { sfx.tone(f, 0.2, 'triangle', 0.12); }, i * 90);
            });
        },
        miss: function () { this.tone(300, 0.22, 'sine', 0.06, 150); },
        finish: function () {
            [523, 659, 784, 1046, 1318].forEach(function (f, i) {
                setTimeout(function () { sfx.tone(f, 0.26, 'triangle', 0.13); }, i * 120);
            });
        }
    };

    /* ========================================================================
     *  4. TRẠNG THÁI
     * ======================================================================*/

    var G = {
        mode: 'menu',          // menu | play | over
        kids: 1,
        turn: 0,               // lượt của bé nào (0-based)
        left: [],              // mỗi bé còn mấy lượt
        won: [],               // mỗi bé gắp được mấy con
        phase: 'idle',         // idle | drop | close | lift | travel | open | settle
        phaseT: 0,
        moveDir: 0,
        caught: null
    };

    function totalLeft() {
        var n = 0;
        for (var i = 0; i < G.left.length; i++) n += G.left[i];
        return n;
    }

    /* ========================================================================
     *  5. SCENE
     * ======================================================================*/

    var PlayScene = null;

    function definePlayScene() {
        PlayScene = new Phaser.Class({
            Extends: Phaser.Scene,
            initialize: function PlayScene() { Phaser.Scene.call(this, { key: 'play' }); },

            /* ---- nướng sẵn ảnh thú, một lần cho cả ván ---- */
            makePlushTextures: function () {
                var g = this.add.graphics();
                for (var si = 0; si < P.SPECIES.length; si++) {
                    for (var vi = 0; vi < 3; vi++) {
                        var key = 'plush_' + si + '_' + vi;
                        if (this.textures.exists(key)) continue;
                        g.clear();
                        /* vẽ với gốc ở giữa khung, chừa lề cho tai và bờm */
                        g.translateCanvas(TEX_W / 2, DRAW_Y);
                        P.draw(g, si, vi, DRAW_R);
                        g.translateCanvas(-TEX_W / 2, -DRAW_Y);
                        g.generateTexture(key, TEX_W, TEX_H);
                    }
                }
                g.destroy();
            },

            create: function () {
                this.makePlushTextures();

                this.matter.world.setBounds(0, -400, W, H + 400, 60, true, true, false, true);
                this.matter.world.setGravity(0, 1.15);

                this.back = this.add.graphics();
                this.paintCabinetBack();

                this.plushGroup = [];
                this.buildWalls();
                this.buildClaw();
                this.fillPile();

                this.front = this.add.graphics();      // kính và khung tủ, vẽ đè lên trên
                this.front.setDepth(20);
                this.paintCabinetFront();

                this.dust = this.add.graphics();
                this.dust.setDepth(19);

                UI.sceneReady(this);
            },

            /* ---- nền tủ: tường sau, đèn, cửa trả thưởng ---- */
            paintCabinetBack: function () {
                var g = this.back;
                g.clear();
                g.setDepth(0);

                /* thành tủ */
                g.fillStyle(0x2b1f6b, 1);
                g.fillRoundedRect(BOX.x - 26, BOX.y - 30, BOX.w + 52, BOX.h + 90, 28);
                g.fillStyle(0x3b2a8f, 1);
                g.fillRoundedRect(BOX.x - 14, BOX.y - 18, BOX.w + 28, BOX.h + 62, 20);

                /* lòng tủ */
                g.fillStyle(0x6fd3f7, 1);
                g.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
                g.fillStyle(0x9ee7ff, 0.55);
                g.fillEllipse(BOX.x + BOX.w / 2, BOX.y + 60, BOX.w * 1.1, 220);

                /* sàn tủ */
                g.fillStyle(0x2f8fd8, 1);
                g.fillRect(BOX.x, FLOOR_Y - 16, BOX.w, 16);
                g.fillStyle(0x1c6fb0, 1);
                g.fillRect(BOX.x, FLOOR_Y - 6, BOX.w, 6);

                /* thanh ray trên nóc */
                g.fillStyle(0x1a1440, 1);
                g.fillRoundedRect(BOX.x + 8, RAIL_Y - 9, BOX.w - 16, 18, 9);
                g.fillStyle(0x5a4ec9, 1);
                g.fillRoundedRect(BOX.x + 8, RAIL_Y - 9, BOX.w - 16, 7, 4);

                /* cửa trả thưởng */
                g.fillStyle(0x161036, 1);
                g.fillRoundedRect(CHUTE.x, CHUTE.top, CHUTE.w, FLOOR_Y - CHUTE.top, 12);
                g.fillStyle(0x0d0a24, 1);
                g.fillRoundedRect(CHUTE.x + 8, CHUTE.top + 10, CHUTE.w - 16, FLOOR_Y - CHUTE.top - 10, 10);
                g.lineStyle(5, 0xffd43b, 1);
                g.strokeRoundedRect(CHUTE.x, CHUTE.top, CHUTE.w, FLOOR_Y - CHUTE.top, 12);
            },

            /* ---- kính trước: phản chiếu, khung, bóng đèn ---- */
            paintCabinetFront: function () {
                var g = this.front;
                g.clear();
                /* vệt sáng chéo trên kính */
                g.fillStyle(0xffffff, 0.1);
                g.beginPath();
                g.moveTo(BOX.x + 40, BOX.y);
                g.lineTo(BOX.x + 170, BOX.y);
                g.lineTo(BOX.x + 60, BOX.y + BOX.h);
                g.lineTo(BOX.x, BOX.y + BOX.h);
                g.closePath();
                g.fillPath();
                g.fillStyle(0xffffff, 0.06);
                g.beginPath();
                g.moveTo(BOX.x + 250, BOX.y);
                g.lineTo(BOX.x + 300, BOX.y);
                g.lineTo(BOX.x + 190, BOX.y + BOX.h);
                g.lineTo(BOX.x + 140, BOX.y + BOX.h);
                g.closePath();
                g.fillPath();

                /* khung kính */
                g.lineStyle(10, 0x3b2a8f, 1);
                g.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h);
                g.lineStyle(4, 0x8f7bff, 0.8);
                g.strokeRect(BOX.x + 6, BOX.y + 6, BOX.w - 12, BOX.h - 12);

                /* Biển hiệu trên nóc để cho bảng số HTML ngồi lên: chỉ vẽ cái
                 * đế và dãy bóng đèn, còn chữ thì để bên HTML cho /i18n.js dịch
                 * được. Vẽ chữ vào canvas là mất luôn bản tiếng Việt. */
                g.fillStyle(0xff4d8d, 1);
                g.fillRoundedRect(BOX.x + 40, 40, BOX.w - 80, 76, 24);
                g.fillStyle(0xff7fae, 1);
                g.fillRoundedRect(BOX.x + 52, 48, BOX.w - 104, 24, 12);
                for (var i = 0; i <= 11; i++) {
                    var bx = BOX.x + 50 + (BOX.w - 100) * (i / 11);
                    g.fillStyle(0xffe066, 1);
                    g.fillCircle(bx, 30, 7);
                    g.fillStyle(0xfff7c2, 0.9);
                    g.fillCircle(bx - 2, 28, 3);
                }
            },

            /* ---- tường vô hình giữ đống thú trong tủ ---- */
            buildWalls: function () {
                var t = 60;
                var opts = { isStatic: true, friction: 0.4, restitution: 0 };
                this.matter.world.add([
                    M.Bodies.rectangle(BOX.x - t / 2, BOX.y + BOX.h / 2, t, BOX.h * 2, opts),
                    M.Bodies.rectangle(BOX.x + BOX.w + t / 2, BOX.y + BOX.h / 2, t, BOX.h * 2, opts),
                    M.Bodies.rectangle(BOX.x + BOX.w / 2, FLOOR_Y + t / 2, BOX.w, t, opts)
                ]);

                /* Gờ chắn cửa trả thưởng: thú trong đống không tự lăn vào được,
                 * phải có càng mang tới thả từ trên xuống. Gờ này CỐ TÌNH thấp
                 * (chỉ hơn nửa thân con thú) — cao quá thì chính cái càng cũng
                 * không thả lọt, mà thấp quá thì bé chỉ cần đẩy đống thú sang
                 * trái là ăn, chẳng cần gắp. */
                this.matter.world.add(
                    M.Bodies.rectangle(CHUTE.x + CHUTE.w + 7, FLOOR_Y - 46, 14, 92, opts)
                );
            },

            /* ---- càng gắp ----
             * Hai gọng là vật thể TĨNH nhưng em tự đặt vị trí và góc mỗi khung
             * hình (kiểu "kinematic"). Làm vậy thì càng không bị đống thú đẩy
             * ngược, mà vẫn va chạm thật với chúng: con thú nằm lọt vào lòng hai
             * gọng thì được nâng lên, nằm hớ hênh thì trượt ra. Không có phép
             * "dính" nào cả — giữ được hay không là do hình dáng và ma sát. */
            buildClaw: function () {
                var L = CLAW.armLen, w = CLAW.armW;
                this.arms = [];
                for (var s = -1; s <= 1; s += 2) {
                    var upper = M.Bodies.rectangle(0, L * 0.42, w, L * 0.95, { friction: GRIP.friction });
                    var lower = M.Bodies.rectangle(s * L * 0.3, L * 0.95, w, L * 0.62, {
                        friction: GRIP.friction, angle: s * 0.95
                    });
                    var arm = M.Body.create({
                        parts: [upper, lower],
                        isStatic: true,
                        friction: GRIP.friction,
                        frictionStatic: 1.2
                    });
                    arm.plugin = { side: s };
                    this.matter.world.add(arm);
                    this.arms.push(arm);
                }

                this.claw = { x: CLAW.homeX, y: CLAW.topY, angle: CLAW.openAngle };
                this.clawGfx = this.add.graphics();
                this.clawGfx.setDepth(12);
                this.syncClaw();
            },

            /* Đặt hai gọng theo vị trí và độ mở hiện tại.
             *
             * Tham số thứ ba (true) mới là chỗ quyết định cả trò chơi: nó bảo
             * Matter CẬP NHẬT LUÔN VẬN TỐC của gọng theo quãng vừa dời. Thiếu
             * nó thì gọng dời chỗ kiểu nhảy cóc, Matter nhìn vào thấy vận tốc
             * bằng không, nên ma sát giữa gọng và con thú chỉ biết HÃM con thú
             * lại chứ không biết KÉO nó đi theo. Máy đo bắt được đúng chuyện
             * đó: càng khép rất chặt mà nhấc lên thì không con nào nhúc nhích,
             * tỉ lệ gắp tròn trĩnh 0% ở cả tám vị trí. */
            syncClaw: function () {
                for (var i = 0; i < this.arms.length; i++) {
                    var arm = this.arms[i];
                    var s = arm.plugin.side;
                    M.Body.setPosition(arm, { x: this.claw.x + s * 6, y: this.claw.y }, true);
                    M.Body.setAngle(arm, -s * this.claw.angle, true);
                }
            },

            /* ---- đống thú ---- */
            fillPile: function () {
                for (var i = 0; i < PILE_COUNT; i++) this.addPlush();
            },

            addPlush: function (atX, atY) {
                var id = Math.floor(Math.random() * P.COUNT);
                var si = P.speciesOf(id), vi = P.variantOf(id);
                /* Thả bên PHẢI cửa trả thưởng thôi. Thả tràn cả bề ngang thì có
                 * con rơi thẳng vào cửa ngay từ lúc dựng tủ — bé mở game ra đã
                 * thấy một con nằm sẵn trong máng, trông như máy hỏng. */
                var lo = CHUTE.x + CHUTE.w + 60;
                var x = atX == null ? (lo + Math.random() * (BOX.x + BOX.w - 60 - lo)) : atX;
                var y = atY == null ? (BOX.y + 60 + Math.random() * 120) : atY;

                var body = M.Bodies.rectangle(x, y, PLUSH_R * 1.75, PLUSH_R * 2.0, {
                    chamfer: { radius: PLUSH_R * 0.7 },
                    friction: GRIP.plushFriction,
                    frictionStatic: 0.9,
                    restitution: 0.02,
                    density: GRIP.plushDensity,
                    /* Đồ bông thì nặng nề, không lăn lông lốc như quả bóng */
                    frictionAir: 0.02
                });
                M.Body.setAngle(body, (Math.random() - 0.5) * 0.8);
                this.matter.world.add(body);

                var img = this.add.image(x, y, 'plush_' + si + '_' + vi);
                img.setDepth(8);
                img.setDisplaySize(TEX_W, TEX_H);
                /* Đặt gốc ảnh sao cho CHÂN con thú trùng đáy khối vật lý. Bản
                 * đầu em để gốc giữa tấm texture, thế là con thú nằm trên sàn
                 * mà chân thò hẳn xuống dưới đáy tủ — trong ảnh chụp thấy rõ
                 * một hàng chân lòi ra ngoài khung kính. */
                img.setOrigin(0.5, (DRAW_Y + P.FEET * DRAW_R - PLUSH_R) / TEX_H);

                var item = { body: body, img: img, id: id, taken: false };
                this.plushGroup.push(item);
                return item;
            },

            /* ---- vẽ càng gắp: dây cáp, đầu càng, hai gọng ---- */
            drawClaw: function () {
                var g = this.clawGfx;
                var c = this.claw;
                g.clear();

                /* dây cáp từ ray xuống */
                g.lineStyle(5, 0x2b2660, 1);
                g.beginPath();
                g.moveTo(c.x, RAIL_Y);
                g.lineTo(c.x, c.y - 26);
                g.strokePath();
                g.lineStyle(2, 0x8f7bff, 0.9);
                g.beginPath();
                g.moveTo(c.x - 1.5, RAIL_Y);
                g.lineTo(c.x - 1.5, c.y - 26);
                g.strokePath();

                /* con trượt trên ray */
                g.fillStyle(0x2b2660, 1);
                g.fillRoundedRect(c.x - 34, RAIL_Y - 16, 68, 30, 10);
                g.fillStyle(0x6c5ce7, 1);
                g.fillRoundedRect(c.x - 28, RAIL_Y - 12, 56, 12, 6);

                /* đầu càng */
                g.fillStyle(0x3b2a8f, 1);
                g.fillRoundedRect(c.x - 30, c.y - 34, 60, 34, 12);
                g.fillStyle(0x8f7bff, 1);
                g.fillRoundedRect(c.x - 24, c.y - 30, 48, 12, 6);
                g.fillStyle(0xffd43b, 1);
                g.fillCircle(c.x, c.y - 17, 7);

                /* hai gọng, vẽ theo đúng chỗ Matter đang để chúng */
                for (var i = 0; i < this.arms.length; i++) {
                    var arm = this.arms[i];
                    g.fillStyle(0xc9d1e6, 1);
                    g.lineStyle(3, 0x5a6480, 1);
                    for (var k = 0; k < arm.parts.length; k++) {
                        var part = arm.parts[k];
                        if (part === arm && arm.parts.length > 1) continue;
                        var v = part.vertices;
                        g.beginPath();
                        g.moveTo(v[0].x, v[0].y);
                        for (var q = 1; q < v.length; q++) g.lineTo(v[q].x, v[q].y);
                        g.closePath();
                        g.fillPath();
                        g.strokePath();
                    }
                    /* khớp nối ở gốc gọng */
                    g.fillStyle(0x5a6480, 1);
                    g.fillCircle(c.x + arm.plugin.side * 6, c.y, 7);
                }
            },

            /* ---- vòng đời một lượt gắp ---- */
            startDrop: function () {
                if (G.phase !== 'idle') return;
                G.phase = 'drop';
                G.phaseT = 0;
                sfx.motor(false);
                sfx.winch();
            },

            update: function (time, delta) {
                var dt = Math.min(0.05, delta / 1000);
                this.stepClaw(dt);
                this.syncPlush();
                this.drawClaw();
            },

            /* Trạng thái của càng, tách riêng để máy đo tỉ lệ gắp gọi thẳng */
            stepClaw: function (dt) {
                var c = this.claw;
                G.phaseT += dt;

                if (G.phase === 'idle') {
                    if (G.moveDir) {
                        c.x = Phaser.Math.Clamp(c.x + G.moveDir * CLAW.speed * dt, CLAW.minX, CLAW.maxX);
                    }
                } else if (G.phase === 'drop') {
                    c.y += CLAW.dropSpeed * dt;
                    if (c.y >= CLAW.maxDropY) { c.y = CLAW.maxDropY; this.setPhase('close'); }
                } else if (G.phase === 'close') {
                    var k = Math.min(1, G.phaseT / CLAW.closeTime);
                    c.angle = CLAW.openAngle + (CLAW.closeAngle - CLAW.openAngle) * k;
                    if (k >= 1) { sfx.clack(); this.setPhase('lift'); }
                } else if (G.phase === 'lift') {
                    c.y -= CLAW.liftSpeed * dt;
                    if (c.y <= CLAW.topY) { c.y = CLAW.topY; this.setPhase('travel'); }
                } else if (G.phase === 'travel') {
                    var dx = CLAW.homeX - c.x;
                    var step = CLAW.travelSpeed * dt;
                    if (Math.abs(dx) <= step) { c.x = CLAW.homeX; this.setPhase('open'); }
                    else c.x += Math.sign(dx) * step;
                } else if (G.phase === 'open') {
                    var k2 = Math.min(1, G.phaseT / 0.3);
                    c.angle = CLAW.closeAngle + (CLAW.openAngle - CLAW.closeAngle) * k2;
                    if (k2 >= 1) this.setPhase('settle');
                } else if (G.phase === 'settle') {
                    if (G.phaseT > 0.9) this.endTurn();
                }

                this.syncClaw();
            },

            setPhase: function (p) {
                G.phase = p;
                G.phaseT = 0;
                if (p === 'lift') sfx.winch();
                if (p === 'travel') sfx.motor(true);
                if (p === 'open') { sfx.motor(false); sfx.clack(); }
            },

            syncPlush: function () {
                for (var i = 0; i < this.plushGroup.length; i++) {
                    var it = this.plushGroup[i];
                    if (it.taken) continue;
                    it.img.setPosition(it.body.position.x, it.body.position.y);
                    it.img.setRotation(it.body.angle);
                }
            },

            /* Hết lượt: con nào rơi vào cửa trả thưởng thì tính là gắp được */
            endTurn: function () {
                var got = 0;
                for (var i = 0; i < this.plushGroup.length; i++) {
                    var it = this.plushGroup[i];
                    if (it.taken) continue;
                    var p = it.body.position;
                    if (p.x < CHUTE.x + CHUTE.w && p.y > CHUTE.top + 30) {
                        it.taken = true;
                        this.matter.world.remove(it.body);
                        this.prizeFly(it);
                        store.add(it.id);
                        got++;
                    }
                }

                if (got) { sfx.prize(); G.won[G.turn] += got; }
                else sfx.miss();

                /* thả bù cho đống luôn đầy đặn */
                for (var k = 0; k < got; k++) this.addPlush(BOX.x + BOX.w * 0.45 + Math.random() * 120, BOX.y - 40);

                G.left[G.turn]--;
                G.phase = 'idle';
                G.phaseT = 0;
                UI.afterTurn(got);
            },

            /* Con thú gắp được bay lên tủ trưng bày */
            prizeFly: function (it) {
                var img = it.img;
                img.setDepth(25);
                this.tweens.add({
                    targets: img,
                    x: CHUTE.x + CHUTE.w / 2,
                    y: FLOOR_Y - 40,
                    scale: img.scale * 0.7,
                    angle: 0,
                    duration: 320,
                    ease: 'Quad.easeOut',
                    onComplete: function () {
                        img.scene.tweens.add({
                            targets: img, y: H + 120, alpha: 0.2, duration: 420,
                            ease: 'Quad.easeIn',
                            onComplete: function () { img.destroy(); }
                        });
                    }
                });
                this.confetti(CHUTE.x + CHUTE.w / 2, CHUTE.top);
            },

            confetti: function (x, y) {
                for (var i = 0; i < 18; i++) {
                    var g = this.add.graphics();
                    g.fillStyle([0xffd43b, 0xff6b8a, 0x63e6be, 0x8f7bff][i % 4], 1);
                    g.fillRect(-4, -7, 8, 14);
                    g.setPosition(x, y);
                    g.setDepth(26);
                    var a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
                    var d = 90 + Math.random() * 130;
                    this.tweens.add({
                        targets: g,
                        x: x + Math.cos(a) * d,
                        y: y + Math.sin(a) * d + 120,
                        angle: 360 * (Math.random() < 0.5 ? 1 : -1),
                        alpha: 0,
                        duration: 900 + Math.random() * 400,
                        ease: 'Quad.easeIn',
                        onComplete: function () { g.destroy(); }
                    });
                }
            },

            /* ---- cửa cho máy đo tỉ lệ gắp (check-grab.html) ----
             * Chạy trọn một lượt gắp ở toạ độ x, tự quay bánh vật lý chứ không
             * chờ nhịp vẽ — nhờ vậy đo được vài trăm lượt trong vài giây, và đo
             * đúng cái vật lý bé đang chơi chứ không phải một bản chép. */
            /* Quay bánh vật lý n giây mà không đụng tới càng — dùng để chờ
             * đống thú nằm yên trước khi đo. */
            settle: function (seconds) {
                var n = Math.round((seconds || 1) * 60);
                for (var i = 0; i < n; i++) M.Engine.update(this.matter.world.engine, 1000 / 60);
                this.syncPlush();
            },

            simulateGrab: function (x, maxSteps) {
                var steps = 0, cap = maxSteps || 1400;
                this.claw.x = Phaser.Math.Clamp(x, CLAW.minX, CLAW.maxX);
                G.phase = 'drop';
                G.phaseT = 0;
                var soundWas = sfx.on;
                sfx.on = false;
                while (G.phase !== 'idle' && steps++ < cap) {
                    this.stepClaw(1 / 60);
                    /* Quay bánh vật lý bằng tay qua Matter gốc, không mượn nhịp
                     * vẽ của Phaser: máy đo phải chạy được cả trong trình duyệt
                     * không cửa sổ, nơi nhịp vẽ gần như đứng im. */
                    M.Engine.update(this.matter.world.engine, 1000 / 60);
                }
                sfx.on = soundWas;
                return steps < cap;
            }
        });
    }

    /* ========================================================================
     *  6. GIAO DIỆN
     * ======================================================================*/

    var el = function (id) { return document.getElementById(id); };

    var UI = {
        game: null, scene: null, pending: false,

        sceneReady: function (scene) {
            this.scene = scene;
            if (this.pending) { this.pending = false; this.begin(); }
            this.paintHud();
        },

        start: function (kids) {
            G.kids = kids;
            G.turn = 0;
            G.left = [];
            G.won = [];
            for (var i = 0; i < kids; i++) {
                G.left.push(kids === 1 ? TURNS_SOLO : TURNS_EACH);
                G.won.push(0);
            }
            G.mode = 'play';
            G.phase = 'idle';
            hideAll();
            document.body.classList.add('playing');

            if (!this.game) {
                this.pending = true;
                definePlayScene();
                this.game = new Phaser.Game({
                    type: Phaser.AUTO,
                    parent: 'game-canvas',
                    width: W, height: H,
                    transparent: true,
                    /* KHÔNG dùng autoCenter: .board-host đã là flex căn giữa rồi */
                    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
                    physics: { default: 'matter', matter: { gravity: { y: 1.15 }, debug: false } },
                    scene: [PlayScene],
                    banner: false
                });
            } else {
                this.begin();
            }
        },

        begin: function () {
            var s = this.scene;
            if (!s) { this.pending = true; return; }
            /* dọn tủ rồi xếp lại đống thú cho ván mới */
            for (var i = 0; i < s.plushGroup.length; i++) {
                var it = s.plushGroup[i];
                if (!it.taken) s.matter.world.remove(it.body);
                it.img.destroy();
            }
            s.plushGroup.length = 0;
            s.claw.x = CLAW.homeX;
            s.claw.y = CLAW.topY;
            s.claw.angle = CLAW.openAngle;
            s.syncClaw();
            s.fillPile();
            this.paintHud();
        },

        afterTurn: function (got) {
            this.paintHud();
            if (got) showTip(got > 1 ? 'Two at once!' : 'Got one!', 1600);

            if (totalLeft() <= 0) { this.finish(); return; }
            /* nhiều bé thì chuyền tay sang bé kế còn lượt */
            if (G.kids > 1) {
                var guard = 0;
                do { G.turn = (G.turn + 1) % G.kids; } while (G.left[G.turn] <= 0 && guard++ < 8);
                showTip('Kid ' + (G.turn + 1) + "'s turn", 1500);
                this.paintHud();
            }
        },

        finish: function () {
            G.mode = 'over';
            sfx.finish();
            document.body.classList.remove('playing');

            if (G.kids === 1) {
                var n = G.won[0];
                var fresh = store.record(n);
                el('win-title').textContent = n > 0 ? 'Nice haul!' : 'So close!';
                el('win-count').textContent = n;
                el('win-best').textContent = store.data.best;
                el('win-kinds').textContent = store.countKinds() + ' / ' + P.COUNT;
                el('win-new').hidden = !fresh;
                show(el('win-overlay'));
            } else {
                var best = -1, who = [];
                for (var i = 0; i < G.kids; i++) {
                    if (G.won[i] > best) { best = G.won[i]; who = [i]; }
                    else if (G.won[i] === best) who.push(i);
                }
                el('duo-title').textContent = who.length > 1
                    ? "It's a tie!"
                    : 'Kid ' + (who[0] + 1) + ' wins!';
                var rows = el('duo-rows');
                rows.innerHTML = '';
                for (var k = 0; k < G.kids; k++) {
                    var row = document.createElement('div');
                    row.className = 'score-row';
                    row.innerHTML = '<span>Kid ' + (k + 1) + '</span><span>' + G.won[k] + '</span>';
                    rows.appendChild(row);
                }
                show(el('duo-overlay'));
            }
            this.paintShelf();
        },

        /* Bảng số là thẻ HTML thật (để /i18n.js dịch), nên phải tự tay đặt nó
         * lên đúng cái biển hiệu mà Phaser vẽ. Canvas co theo khung nên phải
         * quy từ toạ độ thế giới 720×1000 về điểm ảnh thật. */
        placeHud: function () {
            var host = el('game-canvas');
            var wrap = host ? host.querySelector('canvas') : null;
            var outer = el('board-wrap');
            if (!wrap || !outer) return;
            var r = wrap.getBoundingClientRect(), base = outer.getBoundingClientRect();
            var k = r.width / W;
            var hud = el('hud');
            hud.style.left = (r.left - base.left + (W / 2) * k) + 'px';
            hud.style.top = (r.top - base.top + 62 * k) + 'px';
            hud.style.transform = 'translate(-50%, -50%) scale(' + Math.max(0.62, Math.min(1, k * 1.25)) + ')';
        },

        paintHud: function () {
            var turnBox = el('hud-turn'), leftBox = el('hud-left'), gotBox = el('hud-got');
            if (!turnBox) return;
            turnBox.textContent = G.kids > 1 ? 'Kid ' + (G.turn + 1) : 'Your turn';
            leftBox.textContent = G.left[G.turn] || 0;
            gotBox.textContent = G.won[G.turn] || 0;
            el('hud').hidden = (G.mode !== 'play');
            el('pad').hidden = (G.mode !== 'play');
            if (G.mode === 'play') this.placeHud();
        },

        /* Tủ trưng bày: con nào gắp được thì sáng, chưa có thì để bóng mờ */
        paintShelf: function () {
            var box = el('shelf-grid');
            if (!box || !this.scene) return;
            box.innerHTML = '';
            for (var id = 0; id < P.COUNT; id++) {
                var got = store.data.got[id] || 0;
                var cell = document.createElement('div');
                cell.className = 'shelf-cell' + (got ? ' got' : '');
                var si = P.speciesOf(id), vi = P.variantOf(id);
                var tex = this.scene.textures.get('plush_' + si + '_' + vi);
                if (tex && tex.getSourceImage) {
                    var src = tex.getSourceImage();
                    if (src && src.toDataURL) {
                        var im = document.createElement('img');
                        im.src = src.toDataURL();
                        cell.appendChild(im);
                    }
                }
                if (got > 1) {
                    var b = document.createElement('span');
                    b.className = 'shelf-n';
                    b.textContent = '×' + got;
                    cell.appendChild(b);
                }
                box.appendChild(cell);
            }
            el('shelf-count').textContent = store.countKinds() + ' / ' + P.COUNT;
        }
    };

    function show(n) { if (n) n.classList.remove('hidden'); }
    function hide(n) { if (n) n.classList.add('hidden'); }
    function hideAll() {
        [el('menu-overlay'), el('win-overlay'), el('duo-overlay'), el('shelf-overlay')].forEach(hide);
    }

    var tipT = null;
    function showTip(text, ms) {
        var t = el('tip');
        if (!t) return;
        t.textContent = text;
        show(t);
        clearTimeout(tipT);
        tipT = setTimeout(function () { hide(t); }, ms || 1600);
    }

    function openMenu() {
        G.mode = 'menu';
        hideAll();
        document.body.classList.remove('playing');
        if (el('hud')) el('hud').hidden = true;
        if (el('pad')) el('pad').hidden = true;
        show(el('menu-overlay'));
    }

    function openShelf() {
        UI.paintShelf();
        hideAll();
        show(el('shelf-overlay'));
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

        el('btn-play').addEventListener('click', function () { sfx.wake(); UI.start(G.kids); });
        el('btn-menu-shelf').addEventListener('click', openShelf);
        el('btn-shelf-back').addEventListener('click', openMenu);
        el('btn-nav-menu').addEventListener('click', openMenu);
        el('btn-nav-shelf').addEventListener('click', openShelf);
        el('btn-again').addEventListener('click', function () { UI.start(G.kids); });
        el('btn-win-menu').addEventListener('click', openMenu);
        el('btn-duo-again').addEventListener('click', function () { UI.start(G.kids); });
        el('btn-duo-menu').addEventListener('click', openMenu);
        el('btn-reset-shelf').addEventListener('click', function () { store.reset(); UI.paintShelf(); });

        /* ---- bàn điều khiển ----
         * Nút to, giữ là chạy, nhả là dừng. Ngón tay bé trượt ra khỏi nút giữa
         * chừng là chuyện thường nên bắt cả pointerleave và pointercancel, kẻo
         * càng chạy hoài không ai dừng. */
        function holdBtn(id, dir) {
            var b = el(id);
            var press = function (ev) {
                ev.preventDefault();
                sfx.wake();
                if (G.mode !== 'play' || G.phase !== 'idle') return;
                G.moveDir = dir;
                sfx.motor(true);
            };
            var release = function () {
                if (G.moveDir === dir) { G.moveDir = 0; sfx.motor(false); }
            };
            b.addEventListener('pointerdown', press);
            b.addEventListener('pointerup', release);
            b.addEventListener('pointerleave', release);
            b.addEventListener('pointercancel', release);
        }
        holdBtn('btn-left', -1);
        holdBtn('btn-right', 1);

        el('btn-drop').addEventListener('click', function () {
            sfx.wake();
            if (G.mode === 'play' && UI.scene) UI.scene.startDrop();
        });

        window.addEventListener('keydown', function (ev) {
            if (G.mode !== 'play') return;
            if (ev.key === 'ArrowLeft') { G.moveDir = -1; sfx.motor(true); ev.preventDefault(); }
            else if (ev.key === 'ArrowRight') { G.moveDir = 1; sfx.motor(true); ev.preventDefault(); }
            else if (ev.key === ' ' || ev.key === 'ArrowDown') {
                if (UI.scene) UI.scene.startDrop();
                ev.preventDefault();
            }
        });
        window.addEventListener('keyup', function (ev) {
            if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { G.moveDir = 0; sfx.motor(false); }
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

        var q = new URLSearchParams(location.search);
        var kids = +(q.get('kids') || 0);
        if (kids >= 1 && kids <= 4) setTimeout(function () { UI.start(kids); }, 0);

        window.addEventListener('resize', function () {
            if (G.mode === 'play') UI.placeHud();
        });

        window.clawMachine = {
            G: G, UI: UI, store: store, CLAW: CLAW, BOX: BOX, CHUTE: CHUTE, GRIP: GRIP, P: P,
            start: function (kids) { UI.start(kids || 1); },
            move: function (x) { if (UI.scene) UI.scene.claw.x = x; },
            settle: function (sec) { if (UI.scene) UI.scene.settle(sec); },
            grabAt: function (x) { return UI.scene ? UI.scene.simulateGrab(x) : false; },
            pile: function () {
                if (!UI.scene) return [];
                return UI.scene.plushGroup.filter(function (p) { return !p.taken; })
                    .map(function (p) { return { x: Math.round(p.body.position.x), y: Math.round(p.body.position.y) }; });
            },
            drop: function () { if (UI.scene) UI.scene.startDrop(); },
            state: function () {
                return {
                    mode: G.mode, kids: G.kids, turn: G.turn,
                    left: G.left.slice(), won: G.won.slice(), phase: G.phase,
                    inBox: UI.scene ? UI.scene.plushGroup.filter(function (p) { return !p.taken; }).length : 0
                };
            }
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
