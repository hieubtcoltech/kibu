/**
 * CỖ MÁY KỲ QUẶC — bảng màn chơi
 * ----------------------------------------------------------------------------
 * KHÔNG SỬA TAY TỆP NÀY. Nó do /marble-machine/make-levels.html sinh ra, và
 * mỗi màn trong đây đã được CHẠY THỬ bằng đúng vật lý bé sẽ chơi.
 *
 * Mỗi màn chỉ là bốn con số:
 *   b   dãy tầng, mỗi chữ một loại:
 *         r dốc trượt   s bập bênh   p bàn nhún   f quạt gió
 *         b băng chuyền u đệm nảy    m nam châm
 *   m   bit nào bật thì tầng ấy lật ngang thêm (0 = zíc-zắc đều)
 *   g   bit nào bật thì MẢNH CHÍNH của tầng ấy bị tháo ra khay
 *   d   số mảnh mồi nhử thêm vào khay
 *
 * Máy sinh màn bốc ngẫu nhiên rồi chỉ giữ lại những cỗ máy thoả CẢ HAI điều:
 *   1. lắp đủ mảnh đúng chiều thì viên bi về tới giỏ;
 *   2. để trống BẤT KỲ ô nào thì viên bi không về được.
 * Điều thứ hai là điều đắt: nó vứt sạch những màn mà bé không lắp gì cũng
 * thắng. Mở /marble-machine/check-levels.html để máy chạy lại toàn bộ.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.MarbleLevels = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    return [
        /* ---- Máy tập (màn 1–10) ---- */
        { b: 'srr', m: 0, g: 2, d: 0 },
        { b: 'rrs', m: 0, g: 2, d: 0 },
        { b: 'rbb', m: 0, g: 4, d: 0 },
        { b: 'bbs', m: 0, g: 4, d: 0 },
        { b: 'srb', m: 0, g: 2, d: 0 },
        { b: 'rrs', m: 0, g: 1, d: 0 },
        { b: 'brb', m: 0, g: 1, d: 0 },
        { b: 'sbr', m: 0, g: 1, d: 0 },
        { b: 'sbb', m: 0, g: 1, d: 0 },
        { b: 'sbr', m: 0, g: 2, d: 0 },

        /* ---- Chạy đà (màn 11–20) ---- */
        { b: 'fbp', m: 0, g: 3, d: 1 },
        { b: 'bpb', m: 0, g: 6, d: 1 },
        { b: 'fpr', m: 0, g: 5, d: 1 },
        { b: 'rrb', m: 0, g: 5, d: 1 },
        { b: 'prp', m: 0, g: 5, d: 1 },
        { b: 'spf', m: 0, g: 6, d: 1 },
        { b: 'sbr', m: 0, g: 5, d: 1 },
        { b: 'pps', m: 0, g: 3, d: 1 },
        { b: 'pbf', m: 0, g: 6, d: 1 },
        { b: 'bpf', m: 0, g: 3, d: 1 },

        /* ---- Rối rắm (màn 21–30) ---- */
        { b: 'puur', m: 0, g: 3, d: 1 },
        { b: 'brbm', m: 0, g: 6, d: 1 },
        { b: 'uuru', m: 0, g: 12, d: 1 },
        { b: 'rffm', m: 0, g: 12, d: 1 },
        { b: 'upsr', m: 0, g: 10, d: 1 },
        { b: 'rpbm', m: 0, g: 3, d: 1 },
        { b: 'puub', m: 0, g: 10, d: 1 },
        { b: 'pubm', m: 0, g: 9, d: 1 },
        { b: 'bbur', m: 0, g: 12, d: 1 },
        { b: 'fubm', m: 0, g: 5, d: 1 },

        /* ---- Đau đầu (màn 31–40) ---- */
        { b: 'fufp', m: 0, g: 13, d: 2 },
        { b: 'rfbm', m: 0, g: 13, d: 2 },
        { b: 'uubf', m: 0, g: 7, d: 2 },
        { b: 'prfm', m: 0, g: 7, d: 2 },
        { b: 'uuub', m: 0, g: 13, d: 2 },
        { b: 'frbm', m: 0, g: 14, d: 2 },
        { b: 'urbm', m: 0, g: 11, d: 2 },
        { b: 'ufbm', m: 0, g: 7, d: 2 },
        { b: 'brsu', m: 0, g: 7, d: 2 },
        { b: 'fffm', m: 0, g: 7, d: 2 }
    ];
}));
