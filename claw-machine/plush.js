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

    /* Ba bộ màu cho mỗi loài. Bộ nào cũng phải nổi trên nền kính xanh nhạt của
     * tủ, nên không có màu nào quá nhạt. */
    var PALETTES = [
        { body: 0xffb4a2, dark: 0xe08b7a, belly: 0xfff0e6, ink: 0x5b3a34 },
        { body: 0x9ad9ea, dark: 0x63b2c9, belly: 0xeafaff, ink: 0x24505c },
        { body: 0xffd97d, dark: 0xe0b155, belly: 0xfff6e0, ink: 0x6b4a13 },
        { body: 0xc3b1e1, dark: 0x9b86c4, belly: 0xf4eeff, ink: 0x453263 },
        { body: 0xa8e6a3, dark: 0x7cc077, belly: 0xf0ffee, ink: 0x2f5c2c },
        { body: 0xffffff, dark: 0xd9d9e3, belly: 0xffffff, ink: 0x3a3a48 }
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
            for (var m = 0; m < 12; m++) {
                var a = (Math.PI * 2 * m) / 12;
                g.fillCircle(Math.cos(a) * headR * 0.95, headY + Math.sin(a) * headR * 0.95, headR * 0.34);
            }
        }
        if (sp.ear === 'round') {
            ear(g, p, -headR * 0.72, headY - headR * 0.66, headR * 0.42, 0);
            ear(g, p, headR * 0.72, headY - headR * 0.66, headR * 0.42, 0);
        } else if (sp.ear === 'long') {
            longEar(g, p, -headR * 0.42, headY - headR * 0.75, headR * 0.3, headR * 1.15, -0.18);
            longEar(g, p, headR * 0.42, headY - headR * 0.75, headR * 0.3, headR * 1.15, 0.18);
        } else if (sp.ear === 'point') {
            pointEar(g, p, -headR * 0.66, headY - headR * 0.5, headR * 0.5, -1);
            pointEar(g, p, headR * 0.66, headY - headR * 0.5, headR * 0.5, 1);
        } else if (sp.ear === 'flop') {
            flopEar(g, p, -headR * 0.86, headY - headR * 0.18, headR * 0.36, headR * 0.86, -0.35);
            flopEar(g, p, headR * 0.86, headY - headR * 0.18, headR * 0.36, headR * 0.86, 0.35);
        } else if (sp.ear === 'eyestalk') {
            g.fillStyle(p.body, 1);
            g.fillCircle(-headR * 0.55, headY - headR * 0.72, headR * 0.38);
            g.fillCircle(headR * 0.55, headY - headR * 0.72, headR * 0.38);
        }
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

        /* ---- thân ---- */
        g.fillStyle(p.body, 1);
        g.fillCircle(0, bodyY, bodyR);
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
        g.fillStyle(p.body, 1);
        g.fillCircle(0, headY, headR);
        if (sp.wide) g.fillEllipse(0, headY, headR * 2.3, headR * 1.85);

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
            g.fillStyle(p.ink, 1);
            g.fillEllipse(-eyeX, eyeY, headR * 0.26, headR * 0.32);
            g.fillEllipse(eyeX, eyeY, headR * 0.26, headR * 0.32);
        }
        /* đốm sáng trong mắt — bỏ cái này là mắt đờ ra ngay */
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(-eyeX + headR * 0.09, eyeY - headR * 0.1, headR * 0.075);
        g.fillCircle(eyeX + headR * 0.09, eyeY - headR * 0.1, headR * 0.075);

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
        g.fillStyle(0xff8fae, 0.5);
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

        /* viền ngoài để con thú tách khỏi nền và khỏi mấy con phía sau */
        g.lineStyle(Math.max(1.5, r * 0.075), p.dark, 0.85);
        g.strokeCircle(0, headY, headR);
        g.strokeCircle(0, bodyY, bodyR);
    }

    /* ---- mấy nét dùng lại ---- */

    function ear(g, p, x, y, r2) {
        g.fillStyle(p.body, 1);
        g.fillCircle(x, y, r2);
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
    var FEET = 1.48, TOP = -2.15;

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
