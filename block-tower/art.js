/**
 * THÁP KHỐI — phần vẽ
 * ----------------------------------------------------------------------------
 * VÌ SAO CHỌN PHÉP CHIẾU XIÊN, KHÔNG PHẢI ISOMETRIC THẬT
 *
 * Anh Hiếu muốn "chiều sâu rõ ràng để ăn đứt các game xếp hình cũ". Cách hiển
 * nhiên là dựng nghiêng kiểu isometric — nhưng thử trên giấy là thấy hỏng: xoay
 * cả cái giếng đi 45° thì các CỘT không còn thẳng đứng nữa, mà cả lối chơi xếp
 * hình nằm ở chỗ bé nhìn một cột rồi biết quân sẽ rơi vào đâu. Đẹp mà không
 * chơi được thì thà đừng.
 *
 * Nên em dùng phép chiếu XIÊN: mặt trước vẫn là hình vuông và cột vẫn thẳng
 * đứng đúng như xếp hình cổ điển, nhưng mỗi ô mọc thêm MẶT TRÊN và MẶT PHẢI
 * lùi về phía sau. Khối thành khối lập phương thật, tường gạch có bề dày thật,
 * mà bé vẫn đọc được cái giếng y như cũ. Chiều sâu lấy được mà không mất gì.
 *
 * NĂM CHẤT LIỆU, mỗi thứ một cách bắt sáng
 * Gạch nung có mạch vữa. Đá xám lỗ rỗ. Gỗ có thớ. Kim loại có vệt xước chéo.
 * Vàng thì mặt trên chói, cạnh đổ sâu, và có một vệt loé chạy qua — đây là con
 * đáng giá nhất nên nó phải trông ra tiền ngay từ xa.
 *
 * KHỐI ĐƯỢC NƯỚNG SẴN thành ảnh, mỗi chất liệu một lần lúc vào game. Một cái
 * giếng đầy là 180 khối; vẽ nét trực tiếp từng khung hình thì máy của bé tụt
 * khung ngay. Bài học từ Bắn Vịt, và nướng ở GẤP BA cho khỏi nhoè trên màn nét
 * đôi — bài học từ Máy Gắp Thú.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.TowerArt = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var TEX_SCALE = 3;

    /* Không còn chiều sâu: khối là ô PHẲNG. Giữ hằng số bằng 0 để chỗ nào còn
     * cộng độ lùi thì vẫn chạy đúng. */
    var DEPTH = 0;

    /* ------------------------------------------------------------------ *
     * NĂM MÀU KHỐI
     *
     * Anh Hiếu xem bản khối lập phương 2.5D rồi bảo: làm thành hình khối 2D
     * nhưng màu sắc bắt mắt hơn. Nên bỏ hết mặt trên, mặt phải, đường bao —
     * giờ mỗi ô là một hình vuông bo góc, một màu tươi, có dải sáng trên và
     * dải tối dưới.
     *
     * Vì sao vẫn giữ dải sáng và dải tối dù là 2D: hoàn toàn phẳng một màu thì
     * cả bức tường thành một mảng bẹt, mắt không tách được hàng nào với hàng
     * nào. Hai dải mỏng ấy đủ cho mỗi ô có mép trên mép dưới, mà vẫn là hình
     * phẳng chứ không phải khối lập phương.
     *
     * fill là màu chính, hi là dải trên, lo là dải dưới, edge là viền.
     * ------------------------------------------------------------------ */
    /* Năm màu này KHÔNG chọn bằng mắt mà chọn bằng số. Máy soát đo hai thứ:
     * khoảng cách màu giữa từng cặp, và chênh lệch ĐỘ SÁNG. Bản đầu em chọn
     * theo cảm giác và máy bắt ngay: xanh biển với tím chênh độ sáng đúng 1 —
     * nhìn thường thì khác hẳn, nhưng bé mù màu chỉ còn độ sáng để tách hai màu
     * ra, mà độ sáng thì y hệt nhau. Giãn ra cho năm bậc sáng cách đều:
     *     tím 99 · đỏ 121 · xanh biển 141 · xanh lá 178 · vàng 208
     * Bậc nào cũng cách bậc kề nó ít nhất 20. */
    var MATS = {
        ruby: { fill: 0xff3b57, hi: 0xff8496, lo: 0xcf2140, edge: 0x7d0d22, spec: 0xffd3d8 },
        azure: { fill: 0x2ea8ff, hi: 0x7cc9ff, lo: 0x1077c9, edge: 0x0a4880, spec: 0xd6ecff },
        lime: { fill: 0x5ce68a, hi: 0xa5f5c0, lo: 0x2bb35e, edge: 0x14683a, spec: 0xd9ffe6 },
        violet: { fill: 0x7c3fd6, hi: 0xac82f0, lo: 0x5a24a8, edge: 0x2f0f63, spec: 0xeadcff },
        gold: { fill: 0xffd24a, hi: 0xfff0a8, lo: 0xe0a410, edge: 0x8a5f00, spec: 0xfffbe0 }
    };

    function matOf(key) { return MATS[key] || MATS.ruby; }

    /* ------------------------------------------------------------------ *
     * MỘT Ô KHỐI PHẲNG
     *
     * Bo góc và chừa một khe hở nhỏ quanh ô. Khe hở là chỗ quan trọng: không có
     * nó thì hai ô cùng màu nằm sát nhau dính thành một mảng, bé không đếm được
     * mình còn mấy ô. Có khe thì mỗi ô là một viên rõ ràng, mà cả hàng vẫn đọc
     * ra là một hàng.
     * ------------------------------------------------------------------ */
    /* Kích thước một ô, dùng CHUNG cho viên khối và cho lưới nền.
     *
     * Anh Hiếu: "background của trò chơi để dạng grid để khớp với khối vuông".
     * Chữ "khớp" là chỗ mấu chốt — ô lưới phải cùng khe hở, cùng bo góc, cùng
     * cỡ với viên khối, không thì nhìn ra hai hệ thống chồng lên nhau. Nên hai
     * bên hỏi chung một hàm này chứ không bên nào tự nhân lấy con số. */
    function slot(S) {
        var pad = Math.max(1, S * 0.035);
        var w = S - pad * 2;
        return { pad: pad, w: w, r: w * 0.24 };
    }

    /* LƯỚI KẺ Ô VUÔNG cho cả cái giếng.
     *
     * Bản trước em vẽ mỗi ô một cái hốc bo góc y hệt viên khối. Anh Hiếu xem
     * rồi bảo: vẽ dạng lưới ô vuông thôi, không cần hình bo góc. Anh đúng —
     * hốc bo góc là một hình KHỐI thứ hai nằm sẵn trong giếng, mắt phải phân
     * biệt "cái này là khối thật hay là hốc", mất một nhịp. Lưới kẻ thì không
     * ai nhầm được: nét kẻ không bao giờ bị tưởng là viên khối.
     *
     * Nét kẻ đúng ở ranh giới ô, nên vẫn khớp tuyệt đối với chỗ khối đáp
     * xuống — mà lại nhẹ hơn hẳn về mặt hình.
     */
    function drawGrid(g, S, cols, rows) {
        var w = S * cols, h = S * rows;
        var lw = Math.max(1, S * 0.03);
        g.lineStyle(lw, 0xffffff, 0.085);
        g.beginPath();
        for (var c = 1; c < cols; c++) { g.moveTo(c * S, 0); g.lineTo(c * S, h); }
        for (var r = 1; r < rows; r++) { g.moveTo(0, r * S); g.lineTo(w, r * S); }
        g.strokePath();
    }

    function drawCube(g, matKey, S) {
        var c = matOf(matKey);
        var m0 = slot(S);
        var pad = m0.pad, w = m0.w, r = m0.r;

        /* bóng đổ nhẹ xuống dưới cho ô có chỗ đứng, không bồng bềnh */
        g.fillStyle(0x000000, 0.22);
        g.fillRoundedRect(pad, pad + w * 0.06, w, w, r);

        /* thân ô */
        g.fillStyle(c.fill, 1);
        g.fillRoundedRect(pad, pad, w, w, r);

        /* dải sáng trên và dải tối dưới */
        g.fillStyle(c.hi, 0.85);
        g.fillRoundedRect(pad + w * 0.10, pad + w * 0.09, w * 0.80, w * 0.20, r * 0.6);
        g.fillStyle(c.lo, 0.75);
        g.fillRoundedRect(pad + w * 0.10, pad + w * 0.72, w * 0.80, w * 0.18, r * 0.6);

        /* đốm sáng góc trên-trái — cái làm màu trông "bóng" chứ không bệt */
        g.fillStyle(c.spec, 0.55);
        g.fillCircle(pad + w * 0.26, pad + w * 0.24, w * 0.09);

        /* Khối vàng: thêm một vệt loé chéo và viền sáng. Đây là con đáng gấp ba,
         * phải nhận ra ngay từ xa giữa cả một bức tường. */
        if (matKey === 'gold') {
            g.fillStyle(0xffffff, 0.34);
            g.beginPath();
            g.moveTo(pad + w * 0.16, pad + w);
            g.lineTo(pad + w * 0.52, pad);
            g.lineTo(pad + w * 0.70, pad);
            g.lineTo(pad + w * 0.34, pad + w);
            g.closePath();
            g.fillPath();
            g.lineStyle(Math.max(1.4, w * 0.055), 0xfff3b0, 0.9);
            g.strokeRoundedRect(pad, pad, w, w, r);
        }

        /* viền */
        g.lineStyle(Math.max(1.2, w * 0.05), c.edge, 0.75);
        g.strokeRoundedRect(pad, pad, w, w, r);
    }

    /* ------------------------------------------------------------------ *
     * CHÚ MÈO NGỦ TRÊN GHẾ
     *
     * Anh Hiếu: "trang trí thêm 1 chú mèo ở ghế sofa thỉnh thoảng vẫy đuôi,
     * liếm lông cho game background sinh động".
     *
     * Mèo nằm cuộn tròn, mắt nhắm. Hai việc nó làm:
     *   · vẫy đuôi — cái đuôi phe phẩy chậm, gần như lúc nào cũng có
     *   · liếm lông — thỉnh thoảng ngóc đầu dậy liếm mấy cái rồi nằm xuống
     *
     * Vẽ bằng hình khối phẳng cùng ngôn ngữ với khối gạch, và tông màu lấy
     * theo căn phòng để nó THUỘC VỀ chỗ ấy chứ không phải dán vào.
     *
     *   t     giây trôi từ đầu ván, dùng cho nhịp đuôi
     *   lick  0…1, khác 0 là đang ngóc đầu liếm lông
     * ------------------------------------------------------------------ */
    function drawCat(g, r, pal, t, lick) {
        var body = pal.cat || 0x8a6a52;
        var dark = pal.catDark || 0x5e4636;
        var pink = 0xff9ab0;

        /* ĐUÔI vẽ trước, nằm sau thân. Phe phẩy chậm — nhanh quá thì trông
         * như con mèo đang bực, mà đây là con mèo đang ngủ trên ghế. */
        var sw = Math.sin(t * 1.15) * 0.55;
        g.fillStyle(dark, 1);
        var tx = -r * 1.15, ty = r * 0.30;
        for (var i = 0; i < 7; i++) {
            var k = i / 6;
            var a2 = -0.35 + sw * k * 1.5;
            g.fillCircle(tx - Math.cos(a2) * r * 0.95 * k,
                ty - Math.sin(a2) * r * 0.95 * k - k * r * 0.20,
                r * (0.20 - k * 0.075));
        }

        /* thân cuộn tròn */
        g.fillStyle(body, 1);
        g.fillEllipse(0, r * 0.16, r * 2.30, r * 1.30);
        g.fillStyle(dark, 0.28);
        g.fillEllipse(-r * 0.30, r * 0.42, r * 1.40, r * 0.50);

        /* đầu: nằm im thì gục xuống, liếm lông thì ngóc lên */
        var hx = r * 0.86, hy = r * (lick ? -0.42 - lick * 0.22 : -0.16);
        g.fillStyle(body, 1);
        g.fillCircle(hx, hy, r * 0.62);
        /* tai */
        g.fillTriangle(hx - r * 0.52, hy - r * 0.28, hx - r * 0.20, hy - r * 0.78, hx - r * 0.06, hy - r * 0.34);
        g.fillTriangle(hx + r * 0.10, hy - r * 0.34, hx + r * 0.36, hy - r * 0.76, hx + r * 0.52, hy - r * 0.24);
        g.fillStyle(pink, 0.55);
        g.fillTriangle(hx - r * 0.40, hy - r * 0.32, hx - r * 0.22, hy - r * 0.62, hx - r * 0.12, hy - r * 0.34);
        g.fillTriangle(hx + r * 0.16, hy - r * 0.32, hx + r * 0.32, hy - r * 0.60, hx + r * 0.44, hy - r * 0.26);

        /* mắt nhắm: hai nét cong. Mèo ngủ thì mắt phải nhắm — vẽ mắt mở là nó
         * thành con mèo đang nhìn bé chơi, mất hẳn cái yên ả. */
        g.lineStyle(Math.max(1.5, r * 0.08), dark, 0.9);
        g.beginPath();
        g.arc(hx - r * 0.22, hy - r * 0.02, r * 0.16, Math.PI * 0.15, Math.PI * 0.85, false);
        g.strokePath();
        g.beginPath();
        g.arc(hx + r * 0.24, hy - r * 0.02, r * 0.16, Math.PI * 0.15, Math.PI * 0.85, false);
        g.strokePath();

        /* mũi và ria */
        g.fillStyle(pink, 1);
        g.fillTriangle(hx - r * 0.08, hy + r * 0.18, hx + r * 0.08, hy + r * 0.18, hx, hy + r * 0.30);
        g.lineStyle(Math.max(1, r * 0.045), dark, 0.55);
        g.beginPath();
        for (var w2 = -1; w2 <= 1; w2 += 2) {
            g.moveTo(hx + w2 * r * 0.14, hy + r * 0.22);
            g.lineTo(hx + w2 * r * 0.72, hy + r * (0.12 + 0.10));
            g.moveTo(hx + w2 * r * 0.14, hy + r * 0.26);
            g.lineTo(hx + w2 * r * 0.70, hy + r * 0.34);
        }
        g.strokePath();

        /* ĐANG LIẾM LÔNG: thè lưỡi và giơ một chân trước lên */
        if (lick > 0.05) {
            g.fillStyle(pink, 1);
            g.fillEllipse(hx - r * 0.04, hy + r * (0.36 + lick * 0.10), r * 0.22, r * 0.26);
            g.fillStyle(body, 1);
            g.fillEllipse(hx - r * 0.30, hy + r * 0.62, r * 0.36, r * 0.62);
        }
    }

    /* ------------------------------------------------------------------ *
     * ĐỒNG HỒ TREO TƯỜNG — chạy đúng giờ thật
     *
     * Anh Hiếu: "ở góc phải treo đồng hồ thể hiện thời gian thực".
     *
     * Kim giờ và kim phút lấy thẳng từ đồng hồ máy, kim giây nhích từng nhịp
     * chứ không trôi mượt — đồng hồ treo tường thật là thế, và cái nhích ấy
     * chính là thứ làm căn phòng có nhịp thở.
     * ------------------------------------------------------------------ */
    /* Góc ba cây kim, tách riêng để MÁY SOÁT kiểm được.
     *
     * Nếu tính góc ngay trong hàm vẽ thì không có cách nào hỏi "12h15 thì kim
     * phút chỉ đâu" ngoài việc nhìn màn hình — mà nhìn thì không phân biệt nổi
     * lệch vài độ. Tách ra thì máy hỏi thẳng bằng số.
     *
     * 0 radian là hướng 3 giờ, nên trừ π/2 để đưa gốc về hướng 12 giờ. */
    function clockHands(date) {
        var h = date.getHours() % 12, m = date.getMinutes(), sec = date.getSeconds();
        return {
            /* kim giờ nhích dần theo phút, không nhảy cóc từng giờ */
            h: ((h + m / 60) / 12) * Math.PI * 2 - Math.PI / 2,
            m: (m / 60) * Math.PI * 2 - Math.PI / 2,
            s: (sec / 60) * Math.PI * 2 - Math.PI / 2
        };
    }

    function drawClock(g, r, pal, date) {
        var rim = pal.accent || 0xffb46b;
        var face = 0xf3ece0, ink = 0x2b2118;

        g.fillStyle(0x000000, 0.28);
        g.fillCircle(r * 0.10, r * 0.12, r);
        g.fillStyle(rim, 1);
        g.fillCircle(0, 0, r);
        g.fillStyle(face, 1);
        g.fillCircle(0, 0, r * 0.86);

        /* mười hai vạch giờ, vạch 12-3-6-9 dài hơn */
        for (var i = 0; i < 12; i++) {
            var a2 = i / 12 * Math.PI * 2 - Math.PI / 2;
            var long = (i % 3 === 0);
            g.lineStyle(Math.max(1, r * (long ? 0.09 : 0.05)), ink, long ? 0.85 : 0.45);
            g.beginPath();
            g.moveTo(Math.cos(a2) * r * (long ? 0.62 : 0.68), Math.sin(a2) * r * (long ? 0.62 : 0.68));
            g.lineTo(Math.cos(a2) * r * 0.78, Math.sin(a2) * r * 0.78);
            g.strokePath();
        }

        var A2 = clockHands(date);
        var ah = A2.h, am = A2.m, as = A2.s;

        g.lineStyle(Math.max(2, r * 0.11), ink, 1);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(Math.cos(ah) * r * 0.42, Math.sin(ah) * r * 0.42);
        g.strokePath();
        g.lineStyle(Math.max(1.5, r * 0.075), ink, 1);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(Math.cos(am) * r * 0.62, Math.sin(am) * r * 0.62);
        g.strokePath();
        g.lineStyle(Math.max(1, r * 0.035), 0xd94f3d, 1);
        g.beginPath();
        g.moveTo(-Math.cos(as) * r * 0.14, -Math.sin(as) * r * 0.14);
        g.lineTo(Math.cos(as) * r * 0.70, Math.sin(as) * r * 0.70);
        g.strokePath();
        g.fillStyle(ink, 1);
        g.fillCircle(0, 0, r * 0.07);
    }

    /* ------------------------------------------------------------------ *
     * CÁC CĂN PHÒNG
     *
     * Cái giếng LƠ LỬNG GIỮA PHÒNG, đúng như anh Hiếu tả. Phòng vẽ bằng hình
     * khối phẳng nhưng có một nguồn sáng rõ ràng, và cái giếng đổ bóng xuống
     * sàn — cái bóng ấy mới là thứ nói cho mắt biết nó đang lơ lửng, chứ không
     * phải cái viền quanh giếng.
     * ------------------------------------------------------------------ */
    var ROOMS = [
        {
            key: 'living', vi: 'Phòng khách', en: 'Living Room',
            wall: [0x3b4a63, 0x2a3549], floor: 0x4a3a2e, rug: 0x7a4a3a, rugEdge: 0xa9673f,
            light: 0xffd9a0, accent: 0xffb46b, dust: 0xffe7c2, cat: 0xc79a68, catDark: 0x8a6a44
        },
        {
            key: 'attic', vi: 'Gác xép', en: 'The Attic',
            wall: [0x53433a, 0x3a2f28], floor: 0x6b533c, rug: 0x8a6a44, rugEdge: 0xb08a5e,
            light: 0xfff0c2, accent: 0xffc98a, dust: 0xfff3d4, cat: 0x9a9a9a, catDark: 0x6b6b6b
        },
        {
            key: 'night', vi: 'Ban công đêm', en: 'Night Balcony',
            wall: [0x1b2340, 0x0f1526], floor: 0x252d44, rug: 0x2f3a58, rugEdge: 0x4a5a80,
            light: 0x9fc4ff, accent: 0x7aa8ff, dust: 0xcfe0ff, stars: true, cat: 0x4a5570, catDark: 0x333c52
        },
        {
            key: 'vault', vi: 'Hầm vàng', en: 'The Vault',
            wall: [0x4a3a1e, 0x2e2413], floor: 0x3a2e18, rug: 0x6b5220, rugEdge: 0xa8811f,
            light: 0xffe07a, accent: 0xffc93c, dust: 0xfff3c4, gilded: true, cat: 0xc9a45e, catDark: 0x8a6f34
        }
    ];

    function roomFor(level) { return ROOMS[Math.floor((level - 1) / 4) % ROOMS.length]; }

    return {
        TEX_SCALE: TEX_SCALE,
        DEPTH: DEPTH,
        MATS: MATS,
        matOf: matOf,
        slot: slot,
        drawGrid: drawGrid,
        drawCat: drawCat,
        drawClock: drawClock,
        clockHands: clockHands,
        drawCube: drawCube,
        ROOMS: ROOMS,
        roomFor: roomFor
    };
}));
