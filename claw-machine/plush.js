/**
 * Máy Gắp Thú — BỘ THÚ BÔNG
 * ----------------------------------------------------------------------------
 * Mười con thú, mỗi con vẽ bằng đường nét chứ không dùng ảnh. Vẽ một lần lúc
 * vào game rồi nướng thành texture, nên trong lúc chơi chỉ còn việc dán ảnh
 * lên — máy của bé không phải vẽ lại từng nét mỗi khung hình.
 *
 * VÌ SAO VẼ CHỨ KHÔNG DÙNG ẢNH
 *   · Không phải tải tệp nào: cả bộ thú nặng đúng bằng mấy trăm dòng chữ này.
 *   · Đổi màu là ra con mới. Mười loài × ba bộ màu = ba mươi con thú khác nhau
 *     cho bé sưu tầm, mà không thêm một byte ảnh nào.
 *   · Nét vẽ sắc ở mọi cỡ màn hình, không bị rỗ như ảnh phóng to.
 *
 * CÁCH VẼ CHO RA "THÚ BÔNG" CHỨ KHÔNG PHẢI "HÌNH TRÒN CÓ MẶT"
 * Bốn thứ làm nên cảm giác bông xù, thiếu cái nào là ra ngay đồ hoạ rẻ tiền:
 *   1. Bụng sáng màu hơn thân — đồ bông bao giờ cũng may miếng bụng khác vải.
 *   2. Đường chỉ khâu chạy dọc giữa mặt, mảnh và cùng tông với vải.
 *   3. Má hồng và đốm sáng trong mắt: hai thứ này quyết định con thú trông
 *      "đáng yêu" hay "đờ đẫn".
 *   4. Viền ngoài đậm hơn thân một chút, để con thú tách khỏi nền kính và khỏi
 *      chồng thú phía sau.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.Plush = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Mỗi loài: tên, dáng tai, và mấy nét riêng. Kích thước tính theo r = nửa
     * bề ngang thân, để đổi cỡ chỉ cần đổi một số. */
    var SPECIES = [
        { key: 'bear', ear: 'round', muzzle: 1, name: 'Bear' },
        { key: 'bunny', ear: 'long', muzzle: 1, name: 'Bunny' },
        { key: 'cat', ear: 'point', muzzle: 1, whisker: 1, name: 'Cat' },
        { key: 'panda', ear: 'round', muzzle: 1, patch: 1, name: 'Panda' },
        { key: 'frog', ear: 'eyestalk', muzzle: 0, wide: 1, name: 'Frog' },
        { key: 'pig', ear: 'point', snout: 1, name: 'Pig' },
        { key: 'dog', ear: 'flop', muzzle: 1, name: 'Puppy' },
        { key: 'penguin', ear: 'none', beak: 1, name: 'Penguin' },
        { key: 'lion', ear: 'round', mane: 1, muzzle: 1, name: 'Lion' },
        { key: 'unicorn', ear: 'point', horn: 1, mane2: 1, name: 'Unicorn' }
    ];

    /* Ba bộ màu cho mỗi loài.
     *
     * Anh Hiếu chơi thử rồi nói "mấy con thú sao mờ quá". Đúng: bộ màu cũ toàn
     * pastel nhạt đặt trên nền kính xanh nhạt, con trắng thì gần như tan vào
     * nền. Nay mỗi bộ có bốn nấc chứ không phải hai:
     *   body   màu vải chính, đã đậm hẳn lên
     *   dark   vùng khuất, dùng để đánh khối cho ra hình cầu
     *   belly  miếng bụng và trong tai, sáng hơn thân
     *   edge   VIỀN NGOÀI, đậm hẳn — đây là thứ tách con thú khỏi nền kính và
     *          khỏi mấy con chồng phía sau. Thiếu nó thì cả tủ trông như một
     *          đống bột màu nhoè vào nhau.
     *   ink    mắt mũi
     */
    var PALETTES = [
        { body: 0xff9d86, dark: 0xe0705c, belly: 0xffe8dc, ink: 0x4a2a24, edge: 0xb04a3a },
        { body: 0x6ec9e8, dark: 0x3f9fc4, belly: 0xe0f7ff, ink: 0x143f4c, edge: 0x276f8c },
        { body: 0xffc94d, dark: 0xe0a02a, belly: 0xfff2cc, ink: 0x5b3a08, edge: 0xb87a0e },
        { body: 0xab93e0, dark: 0x8168c0, belly: 0xeee6ff, ink: 0x35245a, edge: 0x63489f },
        { body: 0x86dd80, dark: 0x5cb356, belly: 0xe8ffe4, ink: 0x224a20, edge: 0x3a8535 },
        { body: 0xf4f4fa, dark: 0xd2d2e0, belly: 0xffffff, ink: 0x2e2e3c, edge: 0x8f8fa8 }
    ];

    /* Con nào cũng phải có một bộ màu "đúng loài" ở biến thể đầu — gấu trúc mà
     * hồng lòe thì bé không nhận ra nữa. */
    var NATURAL = {
        panda: 5, penguin: 5, frog: 4, pig: 0, lion: 2, unicorn: 3,
        bear: 2, bunny: 5, cat: 2, dog: 2
    };

    function paletteFor(speciesIdx, variant) {
        var sp = SPECIES[speciesIdx];
        if (variant === 0 && NATURAL[sp.key] != null) return PALETTES[NATURAL[sp.key]];
        var pick = (speciesIdx * 3 + variant * 2 + 1) % PALETTES.length;
        if (NATURAL[sp.key] === pick) pick = (pick + 1) % PALETTES.length;
        return PALETTES[pick];
    }

    /* Vẽ một con thú vào Graphics của Phaser. Gốc toạ độ ở TÂM con thú.
     *   g   Phaser.GameObjects.Graphics
     *   si  loài, vi  bộ màu, r  nửa bề ngang thân (cỡ vẽ) */
    function draw(g, si, vi, r) {
        var sp = SPECIES[si % SPECIES.length];
        var p = paletteFor(si % SPECIES.length, vi % 3);

        var headR = r * 0.78;
        var headY = -r * 0.62;
        var bodyR = r;
        var bodyY = r * 0.42;

        /* ---- tai / bờm / sừng: vẽ TRƯỚC để nằm sau đầu ---- */
        if (sp.mane) {
            g.fillStyle(p.dark, 1);
            for (var m = 0; m < 14; m++) {
                var a = (Math.PI * 2 * m) / 14;
                g.fillCircle(Math.cos(a) * headR * 1.06, headY + Math.sin(a) * headR * 1.06, headR * 0.42);
            }
        }
        if (sp.ear === 'round') {
            ear(g, p, -headR * 0.80, headY - headR * 0.74, headR * 0.50, 0);
            ear(g, p, headR * 0.80, headY - headR * 0.74, headR * 0.50, 0);
        } else if (sp.ear === 'long') {
            longEar(g, p, -headR * 0.44, headY - headR * 0.86, headR * 0.34, headR * 1.30, -0.18);
            longEar(g, p, headR * 0.44, headY - headR * 0.86, headR * 0.34, headR * 1.30, 0.18);
        } else if (sp.ear === 'point') {
            pointEar(g, p, -headR * 0.78, headY - headR * 0.58, headR * 0.60, -1);
            pointEar(g, p, headR * 0.78, headY - headR * 0.58, headR * 0.60, 1);
        } else if (sp.ear === 'flop') {
            flopEar(g, p, -headR * 0.98, headY - headR * 0.14, headR * 0.42, headR * 0.98, -0.35);
            flopEar(g, p, headR * 0.98, headY - headR * 0.14, headR * 0.42, headR * 0.98, 0.35);
        } else if (sp.ear === 'eyestalk') {
            g.fillStyle(p.body, 1);
            g.fillCircle(-headR * 0.55, headY - headR * 0.72, headR * 0.38);
            g.fillCircle(headR * 0.55, headY - headR * 0.72, headR * 0.38);
        }
        /* ---- thân ----
         *
         * VIỀN VẼ BẰNG CÁCH ĐẮP MỘT LỚP ĐẬM TO HƠN Ở DƯỚI, không phải stroke
         * từng hình tròn. Bản trước em stroke vòng đầu và vòng thân, và vì đầu
         * chồng lên thân nên đường viền chạy XUYÊN QUA MẶT con thú — phóng to
         * ra thấy rõ một vòng nâu cắt ngang mõm, trông như con thú đeo cái
         * vòng. Đắp bóng dưới thì chỉ còn đúng đường bao ngoài. */
        var lw = r * 0.11;
        var furN = (sp.key === 'frog' || sp.key === 'penguin') ? -1 : 15;
        fluff(g, 0, bodyY, bodyR + lw, p.edge, furN);
        g.fillStyle(p.edge, 1);
        g.fillCircle(-bodyR * 0.58, bodyY + bodyR * 0.72, bodyR * 0.33 + lw);
        g.fillCircle(bodyR * 0.58, bodyY + bodyR * 0.72, bodyR * 0.33 + lw);
        g.fillCircle(-bodyR * 0.92, bodyY - bodyR * 0.05, bodyR * 0.3 + lw);
        g.fillCircle(bodyR * 0.92, bodyY - bodyR * 0.05, bodyR * 0.3 + lw);
        fluff(g, 0, bodyY, bodyR, p.body, furN);
        g.fillStyle(p.body, 1);
        /* chân: hai cục tròn thò ra dưới thân */
        g.fillCircle(-bodyR * 0.58, bodyY + bodyR * 0.72, bodyR * 0.33);
        g.fillCircle(bodyR * 0.58, bodyY + bodyR * 0.72, bodyR * 0.33);
        /* tay ôm phía trước */
        g.fillCircle(-bodyR * 0.92, bodyY - bodyR * 0.05, bodyR * 0.3);
        g.fillCircle(bodyR * 0.92, bodyY - bodyR * 0.05, bodyR * 0.3);

        /* bụng sáng màu — thứ làm nó ra dáng đồ bông may bằng hai loại vải */
        g.fillStyle(p.belly, 1);
        g.fillEllipse(0, bodyY + bodyR * 0.18, bodyR * 1.06, bodyR * 1.12);
        if (sp.key === 'penguin') {
            g.fillStyle(p.belly, 1);
            g.fillEllipse(0, bodyY + bodyR * 0.1, bodyR * 1.2, bodyR * 1.4);
        }

        /* ---- đầu ---- */
        volume(g, 0, bodyY, bodyR, p);
        fluff(g, 0, headY, headR + lw, p.edge, furN < 0 ? -1 : 13);
        if (sp.wide) { g.fillStyle(p.edge, 1); g.fillEllipse(0, headY, headR * 2.3 + lw * 2, headR * 1.85 + lw * 2); }
        fluff(g, 0, headY, headR, p.body, furN < 0 ? -1 : 13);
        if (sp.wide) { g.fillStyle(p.body, 1); g.fillEllipse(0, headY, headR * 2.3, headR * 1.85); }
        volume(g, 0, headY, headR, p);

        if (sp.horn) {
            g.fillStyle(0xffe08a, 1);
            tri(g, 0, headY - headR * 1.5, headR * 0.26, headR * 0.72);
            g.lineStyle(Math.max(1, r * 0.05), 0xe0b155, 1);
            g.beginPath();
            g.moveTo(-headR * 0.16, headY - headR * 1.02);
            g.lineTo(headR * 0.16, headY - headR * 1.16);
            g.strokePath();
        }
        if (sp.mane2) {          /* bờm kỳ lân, mấy lọn tóc màu khác */
            g.fillStyle(0xff9ecb, 1);
            g.fillCircle(-headR * 0.2, headY - headR * 0.95, headR * 0.3);
            g.fillCircle(headR * 0.26, headY - headR * 0.86, headR * 0.26);
            g.fillStyle(0x9ad9ea, 1);
            g.fillCircle(headR * 0.02, headY - headR * 1.12, headR * 0.24);
        }


        if (sp.patch) {           /* gấu trúc: hai vòng đen quanh mắt */
            g.fillStyle(0x3a3a48, 1);
            g.fillEllipse(-headR * 0.4, headY - headR * 0.05, headR * 0.62, headR * 0.72);
            g.fillEllipse(headR * 0.4, headY - headR * 0.05, headR * 0.62, headR * 0.72);
        }

        if (sp.muzzle) {
            g.fillStyle(p.belly, 1);
            g.fillEllipse(0, headY + headR * 0.34, headR * 1.02, headR * 0.72);
        }
        if (sp.snout) {           /* lợn: cái mũi to có hai lỗ */
            g.fillStyle(p.dark, 1);
            g.fillEllipse(0, headY + headR * 0.32, headR * 0.86, headR * 0.6);
            g.fillStyle(p.ink, 1);
            g.fillEllipse(-headR * 0.18, headY + headR * 0.32, headR * 0.16, headR * 0.24);
            g.fillEllipse(headR * 0.18, headY + headR * 0.32, headR * 0.16, headR * 0.24);
        }
        if (sp.beak) {
            g.fillStyle(0xffb020, 1);
            tri(g, 0, headY + headR * 0.62, headR * 0.34, headR * 0.42);
        }

        /* ---- mặt ---- */
        var eyeY = headY - headR * 0.02;
        var eyeX = headR * 0.4;
        if (sp.ear === 'eyestalk') { eyeY = headY - headR * 0.72; eyeX = headR * 0.55; }

        g.fillStyle(sp.patch ? 0xffffff : p.ink, 1);
        if (sp.ear === 'eyestalk') {
            g.fillCircle(-eyeX, eyeY, headR * 0.22);
            g.fillCircle(eyeX, eyeY, headR * 0.22);
            g.fillStyle(p.ink, 1);
            g.fillCircle(-eyeX, eyeY + headR * 0.03, headR * 0.12);
            g.fillCircle(eyeX, eyeY + headR * 0.03, headR * 0.12);
        } else {
            /* tròng mắt có viền sáng quanh cho nổi khỏi lông */
            g.fillStyle(0xffffff, 0.55);
            g.fillEllipse(-eyeX, eyeY, headR * 0.40, headR * 0.46);
            g.fillEllipse(eyeX, eyeY, headR * 0.40, headR * 0.46);
            g.fillStyle(p.ink, 1);
            g.fillEllipse(-eyeX, eyeY, headR * 0.32, headR * 0.38);
            g.fillEllipse(eyeX, eyeY, headR * 0.32, headR * 0.38);
        }
        /* HAI đốm sáng trong mắt: một to trên trái, một nhỏ dưới phải. Một đốm
         * thì mắt mới chỉ "không đờ"; hai đốm mới ra mắt thuỷ tinh long lanh —
         * và đây là chi tiết bé nhìn đầu tiên. */
        g.fillStyle(0xffffff, 0.98);
        g.fillCircle(-eyeX + headR * 0.10, eyeY - headR * 0.12, headR * 0.10);
        g.fillCircle(eyeX + headR * 0.10, eyeY - headR * 0.12, headR * 0.10);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(-eyeX - headR * 0.09, eyeY + headR * 0.10, headR * 0.05);
        g.fillCircle(eyeX - headR * 0.09, eyeY + headR * 0.10, headR * 0.05);

        /* mũi và miệng */
        if (!sp.beak && !sp.snout) {
            g.fillStyle(p.ink, 1);
            tri(g, 0, headY + headR * 0.24, headR * 0.15, headR * 0.16);
            g.lineStyle(Math.max(1.2, r * 0.055), p.ink, 1);
            g.beginPath();
            g.moveTo(0, headY + headR * 0.3);
            g.lineTo(0, headY + headR * 0.42);
            g.strokePath();
            arcSmile(g, -headR * 0.17, headY + headR * 0.44, headR * 0.17);
            arcSmile(g, headR * 0.17, headY + headR * 0.44, headR * 0.17);
        }
        if (sp.whisker) {
            g.lineStyle(Math.max(1, r * 0.04), p.ink, 0.7);
            for (var s = -1; s <= 1; s += 2) {
                for (var w = 0; w < 2; w++) {
                    g.beginPath();
                    g.moveTo(s * headR * 0.42, headY + headR * (0.3 + w * 0.14));
                    g.lineTo(s * headR * 1.15, headY + headR * (0.16 + w * 0.24));
                    g.strokePath();
                }
            }
        }

        /* má hồng */
        g.fillStyle(0xff7aa0, 0.72);
        g.fillEllipse(-headR * 0.72, headY + headR * 0.26, headR * 0.34, headR * 0.22);
        g.fillEllipse(headR * 0.72, headY + headR * 0.26, headR * 0.34, headR * 0.22);

        /* đường chỉ khâu giữa mặt */
        g.lineStyle(Math.max(1, r * 0.035), p.dark, 0.5);
        for (var st = 0; st < 4; st++) {
            var sy = headY + headR * (0.52 + st * 0.12);
            if (sy > bodyY - bodyR * 0.85) break;
            g.beginPath();
            g.moveTo(-r * 0.03, sy);
            g.lineTo(r * 0.03, sy + r * 0.04);
            g.strokePath();
        }

    }

    /* ---- mấy nét dùng lại ---- */

    /* Một khối tròn có VỎ BÔNG: mép lượn sóng chứ không tròn vo, có vùng khuất
     * bên dưới phải và vệt sáng trên trái. Ba thứ ấy là toàn bộ khác biệt giữa
     * "hình tròn tô màu" với "cục bông". */
    function fluff(g, x, y, r, col, bumps) {
        var n = bumps || 11;
        if (n < 0) { g.fillStyle(col, 1); g.fillCircle(x, y, r); return; }   /* loài da trơn */
        g.fillStyle(col, 1);
        for (var i = 0; i < n; i++) {
            var a = (Math.PI * 2 * i) / n;
            g.fillCircle(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, r * 0.12);
        }
        g.fillCircle(x, y, r);
    }

    /* Vùng khuất + vệt sáng, đánh lên một khối đã vẽ xong */
    function volume(g, x, y, r, p) {
        g.fillStyle(p.dark, 0.38);
        g.beginPath();
        g.arc(x, y, r, -0.30, 2.20, false);
        g.arc(x - r * 0.26, y - r * 0.20, r * 1.02, 2.20, -0.30, true);
        g.closePath();
        g.fillPath();
        g.fillStyle(0xffffff, 0.26);
        g.fillEllipse(x - r * 0.36, y - r * 0.42, r * 0.72, r * 0.46);
    }


    function ear(g, p, x, y, r2) {
        g.fillStyle(p.body, 1);
        g.fillCircle(x, y, r2);
        g.lineStyle(Math.max(1.5, r2 * 0.2), p.edge, 1);
        g.strokeCircle(x, y, r2);
        g.fillStyle(p.belly, 1);
        g.fillCircle(x, y, r2 * 0.52);
    }

    function longEar(g, p, x, y, w, h, tilt) {
        g.fillStyle(p.body, 1);
        g.save();
        g.translateCanvas(x, y);
        g.rotateCanvas(tilt);
        g.fillEllipse(0, 0, w * 2, h * 2);
        g.fillStyle(p.belly, 1);
        g.fillEllipse(0, h * 0.1, w * 1.05, h * 1.35);
        g.restore();
    }

    function pointEar(g, p, x, y, r2, dir) {
        g.fillStyle(p.body, 1);
        g.beginPath();
        g.moveTo(x - r2 * 0.6 * dir, y + r2 * 0.5);
        g.lineTo(x + r2 * 0.35 * dir, y - r2 * 0.95);
        g.lineTo(x + r2 * 0.72 * dir, y + r2 * 0.42);
        g.closePath();
        g.fillPath();
        g.fillStyle(p.belly, 1);
        g.beginPath();
        g.moveTo(x - r2 * 0.22 * dir, y + r2 * 0.34);
        g.lineTo(x + r2 * 0.3 * dir, y - r2 * 0.5);
        g.lineTo(x + r2 * 0.48 * dir, y + r2 * 0.3);
        g.closePath();
        g.fillPath();
    }

    function flopEar(g, p, x, y, w, h, tilt) {
        g.fillStyle(p.dark, 1);
        g.save();
        g.translateCanvas(x, y);
        g.rotateCanvas(tilt);
        g.fillEllipse(0, h * 0.35, w * 2, h * 1.7);
        g.restore();
    }

    function tri(g, x, y, w, h) {
        g.beginPath();
        g.moveTo(x, y - h * 0.5);
        g.lineTo(x + w, y + h * 0.5);
        g.lineTo(x - w, y + h * 0.5);
        g.closePath();
        g.fillPath();
    }

    function arcSmile(g, x, y, r2) {
        g.beginPath();
        g.arc(x, y, r2, 0, Math.PI, false);
        g.strokePath();
    }

    /* Khung hình một con thú, tính theo r (nửa bề ngang thân):
     *   FEET  chân chạm tới đâu tính từ gốc vẽ
     *   TOP   đỉnh tai/sừng cao tới đâu
     * Bên game cần hai số này để đặt ảnh sao cho CHÂN CON THÚ trùng với đáy
     * khối vật lý. Không có nó thì con thú nằm trên sàn mà chân thò xuyên qua
     * đáy tủ — nhìn là thấy sai ngay. */
    /* Đổi từ 1,48 lên 1,61 khi thêm viền lông xù: mép bông giờ phình ra thêm
     * chừng một phần tám bán kính so với hình tròn trơn, nên nếu vẫn lấy 1,48
     * thì cả đàn thú bị vẽ thấp hơn khối vật lý — ảnh chụp thấy rõ một hàng
     * chân lún xuống dưới mặt sàn tủ. */
    var FEET = 1.61, TOP = -2.32;

    return {
        FEET: FEET,
        TOP: TOP,
        SPECIES: SPECIES,
        PALETTES: PALETTES,
        COUNT: SPECIES.length * 3,
        paletteFor: paletteFor,
        draw: draw,
        /* mã gọn của một con: loài × 3 + bộ màu */
        idOf: function (si, vi) { return si * 3 + vi; },
        speciesOf: function (id) { return Math.floor(id / 3) % SPECIES.length; },
        variantOf: function (id) { return id % 3; },
        nameOf: function (id) { return SPECIES[Math.floor(id / 3) % SPECIES.length].name; }
    };
}));
