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

    /* Độ lùi của mặt sau, tính theo phần của cạnh ô. 0.34 là chỗ em dừng lại
     * sau khi thử: nhỏ hơn thì khối trông như hình vuông có viền, lớn hơn thì
     * mặt trên chiếm chỗ quá nhiều và cái giếng trông như nhìn từ trên xuống. */
    var DEPTH = 0.34;

    /* Mỗi chất liệu ba mặt: trước, trên, phải. Mặt trên sáng nhất vì đèn ở trên
     * cao, mặt phải tối hơn mặt trước — quy ước ánh sáng phải nhất quán khắp
     * màn hình, lệch một khối là mắt nhận ra ngay dù không nói được vì sao. */
    var MATS = {
        brick: { front: 0xb4553a, top: 0xd9704f, right: 0x8a3c28, edge: 0x5e2718, spec: 0xe89a7a },
        stone: { front: 0x8d8f96, top: 0xb4b7bd, right: 0x686a70, edge: 0x44464b, spec: 0xd6d8dc },
        wood: { front: 0xa9763f, top: 0xc9955a, right: 0x7d5529, edge: 0x53381a, spec: 0xdcb27e },
        metal: { front: 0x8fa3b8, top: 0xc2d4e6, right: 0x63748a, edge: 0x3d4a5c, spec: 0xffffff },
        gold: { front: 0xf0b429, top: 0xffe07a, right: 0xc08213, edge: 0x7a4f06, spec: 0xfffbe0 }
    };

    function matOf(key) { return MATS[key] || MATS.brick; }

    /* ------------------------------------------------------------------ *
     * MỘT KHỐI LẬP PHƯƠNG
     *
     * Gốc toạ độ đặt ở góc trên-trái của MẶT TRƯỚC. Mặt trên và mặt phải mọc
     * lên trên và sang phải, nên tấm ảnh nướng ra rộng và cao hơn cạnh ô một
     * khoảng đúng bằng độ lùi.
     * ------------------------------------------------------------------ */
    function drawCube(g, matKey, S) {
        var c = matOf(matKey);
        var D = S * DEPTH;

        /* --- mặt trên --- */
        g.fillStyle(c.top, 1);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(D, -D);
        g.lineTo(S + D, -D);
        g.lineTo(S, 0);
        g.closePath();
        g.fillPath();

        /* --- mặt phải --- */
        g.fillStyle(c.right, 1);
        g.beginPath();
        g.moveTo(S, 0);
        g.lineTo(S + D, -D);
        g.lineTo(S + D, S - D);
        g.lineTo(S, S);
        g.closePath();
        g.fillPath();

        /* --- mặt trước --- */
        g.fillStyle(c.front, 1);
        g.fillRect(0, 0, S, S);

        /* --- vân từng chất liệu, vẽ trước khi kẻ cạnh --- */
        detail(g, matKey, c, S, D);

        /* --- cạnh khối --- */
        g.lineStyle(Math.max(1, S * 0.035), c.edge, 0.85);
        g.strokeRect(0, 0, S, S);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(D, -D);
        g.moveTo(S, 0); g.lineTo(S + D, -D);
        g.moveTo(S + D, -D); g.lineTo(S + D, S - D);
        g.moveTo(S, S); g.lineTo(S + D, S - D);
        g.moveTo(D, -D); g.lineTo(S + D, -D);
        g.strokePath();
    }

    function detail(g, key, c, S, D) {
        var i;
        if (key === 'brick') {
            /* mạch vữa: hai hàng gạch so le — đủ để mắt đọc ra "gạch", nhiều
             * hơn thì ở cỡ hiển thị thật chỉ thành mấy vệt rối */
            g.lineStyle(Math.max(1, S * 0.045), c.edge, 0.42);
            g.beginPath();
            g.moveTo(0, S * 0.5); g.lineTo(S, S * 0.5);
            g.moveTo(S * 0.5, 0); g.lineTo(S * 0.5, S * 0.5);
            g.moveTo(S * 0.25, S * 0.5); g.lineTo(S * 0.25, S);
            g.moveTo(S * 0.75, S * 0.5); g.lineTo(S * 0.75, S);
            g.strokePath();
        } else if (key === 'stone') {
            /* lỗ rỗ, đặt tay chứ không ngẫu nhiên: ngẫu nhiên thì mỗi lần nướng
             * lại ra một viên khác, mà khối đá phải giống nhau cả giếng */
            var pits = [[0.24, 0.30, 0.10], [0.62, 0.22, 0.07], [0.42, 0.58, 0.12],
                [0.74, 0.66, 0.08], [0.18, 0.74, 0.06]];
            for (i = 0; i < pits.length; i++) {
                g.fillStyle(c.edge, 0.22);
                g.fillCircle(S * pits[i][0], S * pits[i][1], S * pits[i][2]);
            }
        } else if (key === 'wood') {
            g.lineStyle(Math.max(1, S * 0.03), c.edge, 0.30);
            for (i = 1; i <= 3; i++) {
                g.beginPath();
                g.moveTo(0, S * i * 0.25);
                g.lineTo(S, S * i * 0.25 + (i % 2 ? S * 0.05 : -S * 0.04));
                g.strokePath();
            }
        } else if (key === 'metal') {
            /* vệt xước chéo + một dải loé — kim loại nhận ra bằng phản chiếu
             * chứ không phải bằng màu */
            g.fillStyle(c.spec, 0.22);
            g.beginPath();
            g.moveTo(S * 0.12, S); g.lineTo(S * 0.42, 0);
            g.lineTo(S * 0.60, 0); g.lineTo(S * 0.30, S);
            g.closePath();
            g.fillPath();
            g.lineStyle(Math.max(1, S * 0.02), c.edge, 0.25);
            for (i = 0; i < 3; i++) {
                g.beginPath();
                g.moveTo(S * (0.55 + i * 0.12), S);
                g.lineTo(S * (0.75 + i * 0.12), 0);
                g.strokePath();
            }
        } else if (key === 'gold') {
            /* Vàng phải trông ra TIỀN ngay từ xa: mặt trên chói thêm một lớp,
             * mặt trước có vệt loé chạy chéo, và một chấm sáng ở góc. Bỏ vệt
             * loé đi thì nó chỉ còn là ô màu vàng — mà anh Hiếu nói rõ là muốn
             * "khối vàng trông thật giá trị". */
            g.fillStyle(c.spec, 0.42);
            g.beginPath();
            g.moveTo(0, 0); g.lineTo(D, -D); g.lineTo(S * 0.55 + D, -D); g.lineTo(S * 0.55, 0);
            g.closePath();
            g.fillPath();

            g.fillStyle(c.spec, 0.34);
            g.beginPath();
            g.moveTo(S * 0.06, S); g.lineTo(S * 0.40, 0);
            g.lineTo(S * 0.56, 0); g.lineTo(S * 0.22, S);
            g.closePath();
            g.fillPath();

            g.fillStyle(0xffffff, 0.55);
            g.fillCircle(S * 0.74, S * 0.24, S * 0.07);
            g.fillStyle(c.edge, 0.20);
            g.fillRect(0, S * 0.82, S, S * 0.18);
        }
    }

    /* Khối mờ dùng cho đường bóng — chỉ có khung, không có ruột, để bé phân
     * biệt được ngay đâu là quân thật đâu là chỗ nó sắp đáp. */
    function drawGhost(g, S, colour) {
        var D = S * DEPTH;
        g.lineStyle(Math.max(1.5, S * 0.06), colour, 0.75);
        g.strokeRect(0, 0, S, S);
        g.lineStyle(Math.max(1, S * 0.04), colour, 0.38);
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(D, -D);
        g.lineTo(S + D, -D); g.lineTo(S, 0);
        g.moveTo(S + D, -D); g.lineTo(S + D, S - D);
        g.lineTo(S, S);
        g.strokePath();
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
        drawGhost: drawGhost,
        ROOMS: ROOMS,
        roomFor: roomFor
    };
}));
