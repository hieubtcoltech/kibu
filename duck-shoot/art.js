/**
 * BẮN VỊT — phần vẽ
 * ----------------------------------------------------------------------------
 * Vẽ bằng mã, không tải một tấm ảnh nào: cả bộ vịt, chó và sáu cảnh trời nặng
 * đúng bằng mấy trăm dòng chữ này. Đổi màu là ra con vịt khác, đổi vài con số
 * là ra cảnh khác.
 *
 * VỊT ĐƯỢC NƯỚNG SẴN THÀNH TEXTURE
 * Mỗi loài × mỗi tư thế cánh nướng một lần lúc vào game rồi dán lên, chứ không
 * vẽ lại từng nét mỗi khung hình. Một vòng có tới mười bốn con vịt cùng bay;
 * vẽ nét trực tiếp thì máy của bé tụt khung hình ngay.
 *
 * NƯỚNG Ở ĐỘ PHÂN GIẢI GẤP BA — bài học từ Máy Gắp Thú: màn hình điện thoại là
 * màn nét đôi, texture nướng đúng cỡ hiển thị thì bị phóng to gấp đôi, viền
 * răng cưa và mặt mũi nhoè hết. Anh Hiếu nhìn ra ngay từ xa.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.DuckArt = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var TAU = Math.PI * 2;
    var TEX_SCALE = 3;

    /* Ba bộ màu vịt. Con vàng phải khác hẳn hai con kia để bé nhận ra ngay là
     * "con đáng giá" — nó chỉ ở trong màn có vài giây. */
    var SKIN = {
        big: { body: 0x7ea86b, belly: 0xd9e8c4, head: 0x2f6b46, wing: 0x5c8a4e, beak: 0xf0a63c, eye: 0x1d2a1f, edge: 0x1b3524 },
        small: { body: 0xb08a5e, belly: 0xf0e0c4, head: 0x6b4a2c, wing: 0x8a6a42, beak: 0xf0a63c, eye: 0x2a1f16, edge: 0x3a2614 },
        gold: { body: 0xffc93c, belly: 0xfff3c4, head: 0xe89b12, wing: 0xffb020, beak: 0xff7a1a, eye: 0x4a2f06, edge: 0x6b3d05 }
    };

    /* Chim lạ: thân đen tuyền, ức đỏ cam, mỏ nhọn dài, cánh nhọn xuôi về sau.
     * Đỏ ở ức là chỗ cố ý — trời đêm mà cho nó đen thui thì bé không phân biệt
     * nổi, thành cái bẫy bẩn chứ không phải thử thách. */
    var CROW = { body: 0x2b2f45, belly: 0x3a3f5c, head: 0x1b1e30, wing: 0x22263a, beak: 0xffb020, eye: 0xff3b30, edge: 0xf05a3c, mark: 0xff5a36 };

    /* ------------------------------------------------------------------ *
     * MỘT CON VỊT
     * Ba tư thế cánh: giơ cao, ngang, hạ thấp. Ba hình luân phiên là đủ cho
     * mắt đọc ra nhịp vỗ cánh; nhiều hơn cũng không thấy khác, mà tốn bộ nhớ.
     * ------------------------------------------------------------------ */
    function drawDuck(g, kind, wing, r) {
        if (kind === 'crow') return drawCrow(g, wing, r);
        var c = SKIN[kind];

        /* VIỀN LÓT: vẽ trước một cái bóng đậm to hơn con vịt một chút.
         *
         * Không có nó thì vòng vàng hỏng hẳn — con vịt vàng bay trên nền trời
         * vàng chóe là chìm nghỉm, mà đó lại đúng là con đáng 5 điểm bé phải
         * nhìn ra ngay. Con xanh lá cũng lẫn vào đồi cỏ y như thế.
         *
         * Vẽ BÓNG LÓT chứ không kẻ viền quanh từng hình: đầu chồng lên thân
         * nên kẻ viền sẽ có nét chạy xuyên ngang mặt con vịt — đúng cái lỗi em
         * mắc với thú bông bên Máy Gắp Thú, sửa một lần rồi thì không mắc lại. */
        g.save();
        g.scaleCanvas(1.11, 1.11);
        duckShapes(g, c, r, wing, kind, c.edge);
        g.restore();

        duckShapes(g, c, r, wing, kind, null);
    }

    /* Hình khối con vịt. flat khác null thì vẽ tất cả bằng đúng một màu —
     * dùng cho lượt vẽ bóng lót. */
    function duckShapes(g, c, r, wing, kind, flat) {
        var bodyRX = r * 1.05, bodyRY = r * 0.72;
        var col = function (x) { return flat === null ? x : flat; };

        /* --- cánh XA, vẽ trước thân --- */
        wingShape(g, col(c.head), -r * 0.10, -r * 0.16, r, wing, 0.86);

        /* --- thân --- */
        g.fillStyle(col(c.body), 1);
        g.fillEllipse(0, 0, bodyRX * 2, bodyRY * 2);
        g.fillStyle(col(c.belly), 1);
        g.fillEllipse(-r * 0.06, r * 0.22, bodyRX * 1.5, bodyRY * 1.05);

        /* --- đuôi --- */
        g.fillStyle(col(c.body), 1);
        g.beginPath();
        g.moveTo(-bodyRX * 0.86, -r * 0.10);
        g.lineTo(-bodyRX * 1.62, -r * 0.42);
        g.lineTo(-bodyRX * 1.48, r * 0.16);
        g.closePath();
        g.fillPath();

        /* --- cổ và đầu --- */
        g.fillStyle(col(c.head), 1);
        g.fillEllipse(r * 0.62, -r * 0.30, r * 0.72, r * 0.66);
        g.fillEllipse(r * 0.95, -r * 0.56, r * 0.86, r * 0.80);
        /* vành cổ trắng — nét làm con vịt ra vịt chứ không phải con chim chung
         * chung; con vàng thì bỏ vành cho nó liền một khối vàng chóe */
        if (kind !== 'gold') {
            g.fillStyle(col(0xf4f6ee), 1);
            g.fillEllipse(r * 0.70, -r * 0.24, r * 0.62, r * 0.16);
        }

        /* --- mỏ --- */
        g.fillStyle(col(c.beak), 1);
        g.beginPath();
        g.moveTo(r * 1.28, -r * 0.62);
        g.lineTo(r * 2.02, -r * 0.50);
        g.lineTo(r * 1.28, -r * 0.34);
        g.closePath();
        g.fillPath();

        /* --- cánh GẦN, vẽ đè lên thân. Phải nằm trước chỗ dừng của lượt bóng
         * lót, không thì cái cánh giơ cao là phần thò ra xa nhất lại thành
         * phần duy nhất không có viền. --- */
        wingShape(g, col(c.wing), r * 0.02, -r * 0.06, r, wing, 1);

        /* Lượt vẽ bóng lót dừng ở đây: mắt mà phóng to theo thì thành hai chấm
         * đen loang ra ngoài đầu. */
        if (flat !== null) return;

        /* --- mắt: tròng đen to, một đốm sáng. Bỏ đốm sáng là mắt đờ ra ngay,
         * và con vịt hết đáng yêu. --- */
        g.fillStyle(0xffffff, 1);
        g.fillCircle(r * 1.14, -r * 0.70, r * 0.20);
        g.fillStyle(c.eye, 1);
        g.fillCircle(r * 1.18, -r * 0.70, r * 0.13);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(r * 1.14, -r * 0.75, r * 0.055);
    }

    /* ------------------------------------------------------------------ *
     * DÁNG CHẠY TRÊN BỜ
     *
     * Không phải con vịt bay bị xoay ngang. Con vịt đang chạy thì thân dựng
     * đứng hơn, cổ vươn ra trước, cánh cụp sát người và có HAI CÁI CHÂN — mà
     * chân mới là thứ mắt đọc ra "đang chạy". Bỏ chân đi thì dù có nhấp nhô
     * bao nhiêu, nó vẫn chỉ là con vịt bay là là mặt đất.
     * ------------------------------------------------------------------ */
    function drawDuckWalk(g, kind, step, r) {
        var c = kind === 'crow' ? CROW : SKIN[kind];

        g.save();
        g.scaleCanvas(1.11, 1.11);
        walkShapes(g, c, r, step, kind, c.edge);
        g.restore();

        walkShapes(g, c, r, step, kind, null);

        /* mắt */
        var ex = r * 0.96, ey = -r * 0.74;
        g.fillStyle(kind === 'crow' ? 0xffe9c8 : 0xffffff, 1);
        g.fillCircle(ex, ey, r * 0.19);
        g.fillStyle(c.eye, 1);
        g.fillCircle(ex + r * 0.04, ey, r * 0.12);
        if (kind !== 'crow') {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(ex, ey - r * 0.05, r * 0.05);
        }
    }

    function walkShapes(g, c, r, step, kind, flat) {
        var col = function (x) { return flat === null ? x : flat; };
        /* Hai bước chân ngược pha. Chân trước duỗi, chân sau co — dáng chạy
         * chứ không phải dáng đi thong thả. */
        var legs = [[0.55, -0.35], [-0.30, 0.50]][step];

        g.fillStyle(col(0xf0a63c), 1);
        for (var i = 0; i < 2; i++) {
            var lx = r * (0.05 + legs[i] * 0.55);
            g.fillRect(lx - r * 0.06, r * 0.42, r * 0.12, r * 0.46);
            /* bàn chân màng, hướng theo chiều chân đang bước */
            g.beginPath();
            g.moveTo(lx - r * 0.06, r * 0.86);
            g.lineTo(lx + r * (legs[i] > 0 ? 0.34 : -0.30), r * 0.94);
            g.lineTo(lx - r * 0.06, r * 0.98);
            g.closePath();
            g.fillPath();
        }

        /* thân hơi dựng, không nằm ngang như lúc bay */
        g.fillStyle(col(c.body), 1);
        g.fillEllipse(0, 0, r * 1.86, r * 1.42);
        g.fillStyle(col(c.belly), 1);
        g.fillEllipse(-r * 0.04, r * 0.20, r * 1.32, r * 0.86);

        /* đuôi hếch lên */
        g.fillStyle(col(c.body), 1);
        g.beginPath();
        g.moveTo(-r * 0.78, -r * 0.10);
        g.lineTo(-r * 1.46, -r * 0.52);
        g.lineTo(-r * 1.30, r * 0.06);
        g.closePath();
        g.fillPath();

        /* cổ vươn ra trước */
        g.fillStyle(col(c.head), 1);
        g.fillEllipse(r * 0.52, -r * 0.36, r * 0.60, r * 0.74);
        g.fillEllipse(r * 0.80, -r * 0.66, r * 0.80, r * 0.74);
        if (kind !== 'gold' && kind !== 'crow') {
            g.fillStyle(col(0xf4f6ee), 1);
            g.fillEllipse(r * 0.60, -r * 0.30, r * 0.56, r * 0.15);
        }
        if (kind === 'crow') {
            g.fillStyle(col(c.mark), 1);
            g.fillEllipse(r * 0.28, r * 0.02, r * 0.72, r * 0.60);
        }

        /* mỏ */
        g.fillStyle(col(c.beak), 1);
        g.beginPath();
        g.moveTo(r * 1.10, -r * 0.74);
        g.lineTo(r * (kind === 'crow' ? 1.98 : 1.78), -r * 0.62);
        g.lineTo(r * 1.10, -r * 0.46);
        g.closePath();
        g.fillPath();

        /* cánh cụp sát người */
        g.fillStyle(col(c.wing), 1);
        g.fillEllipse(-r * 0.10, -r * 0.06, r * 1.10, r * 0.66);
    }

    /* ------------------------------------------------------------------ *
     * DÁNG BƠI TRÊN AO
     *
     * Nửa dưới chìm nên không vẽ chân. Thân bầu tròn hơn, cổ dựng cao —
     * đúng dáng con vịt trôi trên mặt nước. Phần vẽ trong game sẽ phủ một
     * đường nước lên ngang bụng cho khớp.
     * ------------------------------------------------------------------ */
    function drawDuckSwim(g, kind, r) {
        var c = kind === 'crow' ? CROW : SKIN[kind];

        g.save();
        g.scaleCanvas(1.10, 1.10);
        swimShapes(g, c, r, kind, c.edge);
        g.restore();

        swimShapes(g, c, r, kind, null);

        var ex = r * 0.80, ey = -r * 0.92;
        g.fillStyle(kind === 'crow' ? 0xffe9c8 : 0xffffff, 1);
        g.fillCircle(ex, ey, r * 0.19);
        g.fillStyle(c.eye, 1);
        g.fillCircle(ex + r * 0.04, ey, r * 0.12);
        if (kind !== 'crow') {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(ex, ey - r * 0.05, r * 0.05);
        }
    }

    function swimShapes(g, c, r, kind, flat) {
        var col = function (x) { return flat === null ? x : flat; };

        g.fillStyle(col(c.body), 1);
        g.fillEllipse(0, r * 0.10, r * 2.05, r * 1.20);

        g.fillStyle(col(c.body), 1);
        g.beginPath();
        g.moveTo(-r * 0.86, -r * 0.06);
        g.lineTo(-r * 1.52, -r * 0.56);
        g.lineTo(-r * 1.34, r * 0.06);
        g.closePath();
        g.fillPath();

        g.fillStyle(col(c.head), 1);
        g.fillEllipse(r * 0.44, -r * 0.46, r * 0.54, r * 0.86);
        g.fillEllipse(r * 0.64, -r * 0.86, r * 0.78, r * 0.74);
        if (kind !== 'gold' && kind !== 'crow') {
            g.fillStyle(col(0xf4f6ee), 1);
            g.fillEllipse(r * 0.50, -r * 0.40, r * 0.52, r * 0.14);
        }
        if (kind === 'crow') {
            g.fillStyle(col(c.mark), 1);
            g.fillEllipse(r * 0.30, r * 0.06, r * 0.78, r * 0.56);
        }

        g.fillStyle(col(c.beak), 1);
        g.beginPath();
        g.moveTo(r * 0.94, -r * 0.94);
        g.lineTo(r * (kind === 'crow' ? 1.86 : 1.62), -r * 0.82);
        g.lineTo(r * 0.94, -r * 0.66);
        g.closePath();
        g.fillPath();

        g.fillStyle(col(c.wing), 1);
        g.fillEllipse(-r * 0.14, -r * 0.02, r * 1.14, r * 0.60);
    }

    /* ------------------------------------------------------------------ *
     * BỤI CÂY — chỗ con vịt chui vào trốn
     *
     * Ba khối tròn chồng nhau, khối giữa cao nhất. squash 0…1 là lúc bụi rung
     * lên vì có con vịt vừa chui vào hay vừa vọt ra — bé phải THẤY bụi rung
     * thì mới đoán được con vịt đang ở trong đó, không thì nó biến mất một
     * cách vô cớ.
     * ------------------------------------------------------------------ */
    function drawBush(g, r, pal, squash) {
        var s = 1 + (squash || 0) * 0.16;
        var q = 1 - (squash || 0) * 0.12;
        var lobes = [[-0.62, -0.10, 0.72], [0, -0.34, 1.0], [0.62, -0.06, 0.78]];
        /* nền tối vẽ trước, rồi mảng sáng đè lên — hai lớp là đủ cho bụi cây
         * có khối, ba lớp trở lên chỉ tốn nét mà mắt không đọc thêm được gì */
        for (var pass = 0; pass < 2; pass++) {
            g.fillStyle(pass === 0 ? pal.dark : pal.light, 1);
            for (var i = 0; i < lobes.length; i++) {
                var L = lobes[i];
                var off = pass === 0 ? 0 : -r * 0.14;
                g.fillEllipse(L[0] * r * s, L[1] * r + off, L[2] * r * 1.5 * s, L[2] * r * 1.25 * q);
            }
        }
    }

    /* ------------------------------------------------------------------ *
     * CON CHIM LẠ — bắn nhầm là trừ điểm
     *
     * Phải khác con vịt ngay từ cái BÓNG, không chỉ khác màu. Bé không có thì
     * giờ soi chi tiết: con vịt đang lao tới, tay đã giơ lên rồi. Nên em đổi
     * hẳn dáng chứ không tô đen con vịt:
     *   · thân thon và nhỏ hơn, không phải khối bầu tròn
     *   · mỏ nhọn dài và thẳng, không phải cái mỏ bẹt
     *   · cánh nhọn xuôi hẳn về sau như chim ưng, không phải cánh lá tròn
     *   · đuôi xoè ba nan
     *   · viền đỏ cam và mảng ức đỏ, khác hẳn viền tối của vịt
     * ------------------------------------------------------------------ */
    function drawCrow(g, wing, r) {
        var c = CROW;

        g.save();
        g.scaleCanvas(1.13, 1.13);
        crowShapes(g, c, r, wing, c.edge);
        g.restore();

        crowShapes(g, c, r, wing, null);

        /* mắt đỏ, tròn, nhỏ — con vịt mắt đen tròng to hiền lành, con này thì
         * không */
        g.fillStyle(0xffe9c8, 1);
        g.fillCircle(r * 1.02, -r * 0.52, r * 0.17);
        g.fillStyle(c.eye, 1);
        g.fillCircle(r * 1.05, -r * 0.52, r * 0.11);
    }

    function crowShapes(g, c, r, wing, flat) {
        var col = function (x) { return flat === null ? x : flat; };
        var bodyRX = r * 0.94, bodyRY = r * 0.52;

        /* cánh xa */
        crowWing(g, col(c.head), -r * 0.06, -r * 0.14, r, wing, 0.88);

        /* thân thon */
        g.fillStyle(col(c.body), 1);
        g.fillEllipse(0, 0, bodyRX * 2, bodyRY * 2);
        /* mảng ức đỏ — dấu nhận biết ở mọi cảnh trời, kể cả vòng đêm */
        g.fillStyle(col(c.mark), 1);
        g.fillEllipse(r * 0.34, r * 0.06, r * 0.80, r * 0.52);

        /* đuôi xoè ba nan */
        g.fillStyle(col(c.body), 1);
        for (var f = -1; f <= 1; f++) {
            g.beginPath();
            g.moveTo(-bodyRX * 0.72, -r * 0.04);
            g.lineTo(-bodyRX * 1.86, -r * 0.30 + f * r * 0.30);
            g.lineTo(-bodyRX * 1.72, -r * 0.10 + f * r * 0.30);
            g.closePath();
            g.fillPath();
        }

        /* cổ ngắn và đầu nhỏ */
        g.fillStyle(col(c.head), 1);
        g.fillEllipse(r * 0.60, -r * 0.22, r * 0.60, r * 0.52);
        g.fillEllipse(r * 0.88, -r * 0.44, r * 0.68, r * 0.62);

        /* mỏ nhọn dài, thẳng */
        g.fillStyle(col(c.beak), 1);
        g.beginPath();
        g.moveTo(r * 1.14, -r * 0.56);
        g.lineTo(r * 2.16, -r * 0.40);
        g.lineTo(r * 1.14, -r * 0.28);
        g.closePath();
        g.fillPath();

        /* cánh gần */
        crowWing(g, col(c.wing), r * 0.06, -r * 0.04, r, wing, 1);
    }

    /* Cánh chim: một mũi nhọn xuôi về sau, khác hẳn cái lá tròn của vịt. */
    function crowWing(g, col, ox, oy, r, wing, scale) {
        var lift = [-1.05, -0.20, 0.72][wing];
        var L = r * 1.65 * scale, Wd = r * 0.42 * scale;
        g.fillStyle(col, 1);
        g.beginPath();
        g.moveTo(ox, oy);
        g.lineTo(ox - L * 0.24, oy + L * lift);
        g.lineTo(ox - L * 1.10, oy + L * lift * 0.30 + Wd * 0.5);
        g.lineTo(ox - L * 0.30, oy + Wd * 0.5);
        g.closePath();
        g.fillPath();
    }

    /* Cánh: một cái lá cong, ba tư thế khác nhau ở góc ngẩng và độ cong. */
    function wingShape(g, col, ox, oy, r, wing, scale) {
        var lift = [-0.85, -0.10, 0.62][wing];      // ngẩng cao / ngang / hạ
        var bend = [0.55, 0.28, 0.10][wing];
        var L = r * 1.35 * scale, Wd = r * 0.62 * scale;
        g.fillStyle(col, 1);
        g.beginPath();
        g.moveTo(ox, oy);
        g.lineTo(ox - L * Math.cos(lift * 0.6) * 0.30, oy + L * lift * 0.92);
        g.lineTo(ox - L * 0.92, oy + L * lift * 0.62 + Wd * bend);
        g.lineTo(ox - L * 0.36, oy + Wd * 0.55);
        g.closePath();
        g.fillPath();
    }

    /* ------------------------------------------------------------------ *
     * CHÚ CHÓ NHẶT VỊT
     * Nó nhô lên từ bụi cỏ: cười nhăn nhở khi có bé bắn trượt, giơ con vịt
     * lên khoe khi có bé bắn trúng. Đây là thứ làm ván đấu có "người thứ
     * năm" chọc ghẹo, chứ không chỉ là mấy con số nhảy.
     * ------------------------------------------------------------------ */
    function drawDog(g, r, mood, holdKind) {
        var brown = 0xa9713f, dark = 0x7c4f27, cream = 0xf3ddba, ink = 0x2b1c10;

        /* tai cụp hai bên, vẽ trước đầu */
        g.fillStyle(dark, 1);
        g.fillEllipse(-r * 0.86, r * 0.10, r * 0.52, r * 1.05);
        g.fillEllipse(r * 0.86, r * 0.10, r * 0.52, r * 1.05);

        /* đầu */
        g.fillStyle(brown, 1);
        g.fillCircle(0, 0, r);
        g.fillStyle(cream, 1);
        g.fillEllipse(0, r * 0.42, r * 1.05, r * 0.72);

        /* mắt: cười tít khi khoe vịt, mở to khi trêu */
        g.fillStyle(ink, 1);
        if (mood === 'proud') {
            g.lineStyle(Math.max(2, r * 0.09), ink, 1);
            [-1, 1].forEach(function (s) {
                g.beginPath();
                g.arc(s * r * 0.36, -r * 0.16, r * 0.20, Math.PI * 1.15, Math.PI * 1.85, false);
                g.strokePath();
            });
        } else {
            g.fillCircle(-r * 0.36, -r * 0.14, r * 0.15);
            g.fillCircle(r * 0.36, -r * 0.14, r * 0.15);
            g.fillStyle(0xffffff, 1);
            g.fillCircle(-r * 0.40, -r * 0.19, r * 0.06);
            g.fillCircle(r * 0.32, -r * 0.19, r * 0.06);
        }

        /* mũi và miệng */
        g.fillStyle(ink, 1);
        g.fillEllipse(0, r * 0.26, r * 0.26, r * 0.19);
        /* Miệng cười vẽ bằng cung tròn chứ không phải quadraticCurveTo — hàm ấy
         * là của canvas 2D thường, Phaser.Graphics không có. Em vấp đúng chỗ
         * này lúc chạy thử lần đầu, cả chú chó biến mất không báo lỗi gì rõ. */
        g.lineStyle(Math.max(2, r * 0.075), ink, 1);
        g.beginPath();
        g.arc(0, r * 0.40, r * 0.28, Math.PI * 0.18, Math.PI * 0.82, false);
        g.strokePath();
        /* lưỡi thè ra khi trêu — chi tiết nhỏ mà bé nào cũng cười */
        if (mood === 'tease') {
            g.fillStyle(0xff8fae, 1);
            g.fillEllipse(r * 0.08, r * 0.66, r * 0.22, r * 0.26);
        }

        /* con vịt giơ lên khoe */
        if (mood === 'proud' && holdKind) {
            g.save();
            g.translateCanvas(r * 1.15, -r * 0.95);
            g.rotateCanvas(-0.5);
            drawDuck(g, holdKind, 1, r * 0.42);
            g.restore();
        }
    }

    /* ------------------------------------------------------------------ *
     * CẢNH TRỜI
     * Mỗi vòng một bảng màu và một bộ đồ trang trí. Vẽ bằng hình khối phẳng,
     * xếp lớp từ xa tới gần: trời → mặt trời/trăng → núi → cây → cỏ.
     * ------------------------------------------------------------------ */
    var SCENES = {
        dawn: {
            sky: [0xffd9a0, 0xffb3c1, 0x8ecae6], sun: 0xfff3b0, sunY: 0.62,
            hill: [0x3f7d4e, 0x2f5f3c], grass: 0x2f6b3a, tree: 0x24523a, glow: 0xffe9b5,
            bush: { dark: 0x10321f, light: 0x1e5a33 }
        },
        lake: {
            sky: [0xff9e5e, 0xff6f61, 0x4a3f7a], sun: 0xffd166, sunY: 0.70,
            hill: [0x3a3f6b, 0x272a4d], grass: 0x2b4a46, tree: 0x1e3630, glow: 0xffb86b,
            /* Ao phải TƯƠNG PHẢN hẳn với bờ, không thì cả dải dưới thành một
             * mảng tối và bé không biết con vịt đang bơi hay đang đứng. Bờ ngả
             * xanh rêu, mặt nước ngả xanh lam sáng. */
            water: true, pond: { deep: 0x123a72, top: 0x2f7fd0, foam: 0xcfeaff },
            bush: { dark: 0x102822, light: 0x1e433a }
        },
        /* sunY là độ cao mặt trời/trăng tính từ đáy màn. Phải để trên 0.55, vì
         * đồi được vẽ đè lên sau — đặt thấp hơn là mặt trăng khuất sau đồi,
         * chỉ còn lại một vệt sáng lửng lơ trông như lỗi vẽ. Em đặt 0.30 cho
         * vòng đêm ở bản đầu và ảnh chụp ra đúng như vậy. */
        night: {
            sky: [0x0f1a3c, 0x16244f, 0x24356b], sun: 0xf2f6ff, sunY: 0.76,
            hill: [0x121c3a, 0x0d1530], grass: 0x101a33, tree: 0x0b1128, glow: 0x9db8ff,
            dark: true, stars: true, bush: { dark: 0x060c1a, light: 0x111d38 }
        },
        /* Bão thì không vẽ mặt trời — mây dày kín, mà cái quầng sáng lửng lơ
         * giữa trời xám trông như vết bẩn trên màn hình. */
        storm: {
            sky: [0x4a5568, 0x2d3748, 0x1a202c], sun: 0x8fa3bf, sunY: 0.34,
            hill: [0x2b3a4a, 0x1f2b36], grass: 0x24333f, tree: 0x1a2630, glow: 0xc3d3e8,
            rain: true, noSun: true, bush: { dark: 0x0e1820, light: 0x1d2c38 }
        },
        flock: {
            sky: [0x9be7ff, 0x63c7f0, 0x2f9bd4], sun: 0xfff6c2, sunY: 0.58,
            hill: [0x4a9e5c, 0x36794a], grass: 0x3a8a4a, tree: 0x2b6b40, glow: 0xfff3b0,
            bush: { dark: 0x1a4a2c, light: 0x2c6b3d }
        },
        /* Vòng vàng: trời phải TỐI, không được vàng.
         *
         * Bản đầu em cho trời vàng chóe cho hợp tên vòng, chụp ảnh ra mới thấy
         * hỏng: con vịt vàng — đúng con đáng 5 điểm bé phải nhìn ra ngay — chìm
         * nghỉm vào nền. Đổi sang hoàng hôn tím đỏ thì con vàng nổi bật lên như
         * một đốm lửa, mà vẫn giữ được cái không khí "vòng cuối". */
        golden: {
            sky: [0xff7a3c, 0xc03a5e, 0x3b1f56], sun: 0xfff0b0, sunY: 0.64,
            hill: [0x5a2f52, 0x3b1f3c], grass: 0x33203a, tree: 0x241428, glow: 0xffb86b,
            pond: { deep: 0x3a1a4e, top: 0x8a4a86, foam: 0xffd0b8 },
            bush: { dark: 0x180c1c, light: 0x301936 }
        }
    };

    return {
        TAU: TAU,
        TEX_SCALE: TEX_SCALE,
        SKIN: SKIN,
        SCENES: SCENES,
        drawDuck: drawDuck,
        drawDuckWalk: drawDuckWalk,
        drawDuckSwim: drawDuckSwim,
        drawBush: drawBush,
        drawDog: drawDog
    };
}));
