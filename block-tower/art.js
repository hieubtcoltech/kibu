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
    function drawCube(g, matKey, S) {
        var c = matOf(matKey);
        var pad = Math.max(1, S * 0.035);          // khe hở quanh ô
        var w = S - pad * 2;
        var r = w * 0.24;                          // bo góc

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
            light: 0xffd9a0, accent: 0xffb46b, dust: 0xffe7c2
        },
        {
            key: 'attic', vi: 'Gác xép', en: 'The Attic',
            wall: [0x53433a, 0x3a2f28], floor: 0x6b533c, rug: 0x8a6a44, rugEdge: 0xb08a5e,
            light: 0xfff0c2, accent: 0xffc98a, dust: 0xfff3d4
        },
        {
            key: 'night', vi: 'Ban công đêm', en: 'Night Balcony',
            wall: [0x1b2340, 0x0f1526], floor: 0x252d44, rug: 0x2f3a58, rugEdge: 0x4a5a80,
            light: 0x9fc4ff, accent: 0x7aa8ff, dust: 0xcfe0ff, stars: true
        },
        {
            key: 'vault', vi: 'Hầm vàng', en: 'The Vault',
            wall: [0x4a3a1e, 0x2e2413], floor: 0x3a2e18, rug: 0x6b5220, rugEdge: 0xa8811f,
            light: 0xffe07a, accent: 0xffc93c, dust: 0xfff3c4, gilded: true
        }
    ];

    function roomFor(level) { return ROOMS[Math.floor((level - 1) / 4) % ROOMS.length]; }

    return {
        TEX_SCALE: TEX_SCALE,
        DEPTH: DEPTH,
        MATS: MATS,
        matOf: matOf,
        drawCube: drawCube,
        ROOMS: ROOMS,
        roomFor: roomFor
    };
}));
