/**
 * THÁP KHỐI — luật chơi
 * ----------------------------------------------------------------------------
 * Tệp này KHÔNG biết gì về Phaser lẫn việc vẽ. Nó chỉ giữ cái giếng, bảy quân
 * khối, phép xoay, phép ăn hàng và bảng tốc độ. Nhờ vậy máy soát nạp thẳng nó
 * vào Node, chơi hàng vạn quân và soát được những chuyện mà mắt không soát nổi:
 * xoay sát tường có kẹt không, ăn hàng có sót ô nào không, đến bàn thứ mấy thì
 * quân rơi nhanh quá tay trẻ con.
 *
 * VÌ SAO PHẢI TÁCH — bài học đã trả giá ba lần trong dự án này
 * Bên Cỗ Máy Kỳ Quặc, luật với phần vẽ dính vào nhau nên máy soát chạy xanh mà
 * bé không phá nổi màn 3. Bên Bắn Vịt, tách ra từ đầu nên thêm năm kiểu vịt bay
 * mà máy soát công bằng không phải sửa một dòng. Lần này tách ngay từ dòng đầu.
 *
 * HAI CHỖ EM CỐ Ý LÀM KHÁC XẾP HÌNH CỔ ĐIỂN, VÌ NGƯỜI CHƠI LÀ TRẺ CON
 *
 * 1. CÓ ĐƯỜNG BÓNG chỉ sẵn chỗ quân sẽ rơi xuống. Xếp hình cổ điển không có,
 *    và người lớn quen tay thì không cần. Nhưng bé bảy tuổi nhìn cái giếng
 *    dựng nghiêng thì rất khó đoán quân sẽ đáp vào cột nào — không có đường
 *    bóng là bé xếp trượt liên tục rồi bỏ chơi. Đây là chỗ chiều sâu 2.5D lấy
 *    đi của bé, nên phải trả lại.
 *
 * 2. CÓ MẤY NHỊP ÂN HUỆ: quân chạm đáy rồi vẫn còn nửa giây để xoay hay đẩy
 *    ngang. Không có thì mỗi lần bé chậm tay một chút là hỏng cả cột.
 *
 * Còn lại giữ đúng luật cổ điển, kể cả bảng đá tường khi xoay (wall kick) —
 * bỏ nó đi thì quân không xoay được ở sát mép, mà bé không hiểu vì sao.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.TowerRules = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Giếng 10 cột × 18 hàng. Xếp hình cổ điển là 10×20, nhưng dựng nghiêng thì
     * mỗi hàng ăn thêm chiều cao cho mặt trên khối, nên 20 hàng làm cái giếng
     * cao lêu nghêu, trên điện thoại phải thu nhỏ tới mức không nhìn ra chất
     * liệu khối nữa — mà chất liệu chính là thứ anh Hiếu muốn khoe. */
    var COLS = 10, ROWS = 18;

    /* Bảy quân khối cổ điển. Mỗi quân cho sẵn bốn tư thế xoay viết thẳng ra —
     * xoay bằng phép quay ma trận lúc chạy thì I và O bị lệch tâm, mà chữa cái
     * lệch ấy còn rối hơn là viết sẵn. */
    var SHAPES = {
        I: [
            [[0, 1], [1, 1], [2, 1], [3, 1]],
            [[2, 0], [2, 1], [2, 2], [2, 3]],
            [[0, 2], [1, 2], [2, 2], [3, 2]],
            [[1, 0], [1, 1], [1, 2], [1, 3]]
        ],
        J: [
            [[0, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [2, 2]],
            [[1, 0], [1, 1], [0, 2], [1, 2]]
        ],
        L: [
            [[2, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [1, 2], [2, 2]],
            [[0, 1], [1, 1], [2, 1], [0, 2]],
            [[0, 0], [1, 0], [1, 1], [1, 2]]
        ],
        O: [
            [[1, 0], [2, 0], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [2, 1]]
        ],
        S: [
            [[1, 0], [2, 0], [0, 1], [1, 1]],
            [[1, 0], [1, 1], [2, 1], [2, 2]],
            [[1, 1], [2, 1], [0, 2], [1, 2]],
            [[0, 0], [0, 1], [1, 1], [1, 2]]
        ],
        T: [
            [[1, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [2, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [1, 2]],
            [[1, 0], [0, 1], [1, 1], [1, 2]]
        ],
        Z: [
            [[0, 0], [1, 0], [1, 1], [2, 1]],
            [[2, 0], [1, 1], [2, 1], [1, 2]],
            [[0, 1], [1, 1], [1, 2], [2, 2]],
            [[1, 0], [0, 1], [1, 1], [0, 2]]
        ]
    };
    var PIECES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

    /* ------------------------------------------------------------------ *
     * CHẤT LIỆU KHỐI
     *
     * Anh Hiếu nói: viên gạch, khối kim loại, khối vàng trông thật giá trị.
     * Nên chất liệu KHÔNG gắn cứng vào hình quân — cùng một quân chữ T có lần
     * là gạch, có lần là vàng. Nhờ vậy bé thấy khối vàng rơi xuống là mắt sáng
     * lên, chứ không phải "à lại quân T".
     *
     * weight là tần suất bốc. Vàng hiếm nhất và đáng điểm gấp ba.
     * ------------------------------------------------------------------ */
    var MATS = [
        { key: 'brick', vi: 'gạch nung', en: 'brick', weight: 34, mult: 1 },
        { key: 'stone', vi: 'đá xám', en: 'stone', weight: 26, mult: 1 },
        { key: 'wood', vi: 'gỗ', en: 'wood', weight: 18, mult: 1 },
        { key: 'metal', vi: 'kim loại', en: 'metal', weight: 14, mult: 2 },
        { key: 'gold', vi: 'vàng', en: 'gold', weight: 8, mult: 3 }
    ];
    var MAT_TOTAL = MATS.reduce(function (a, m) { return a + m.weight; }, 0);

    function matAt(r) {
        var acc = 0, x = r * MAT_TOTAL;
        for (var i = 0; i < MATS.length; i++) {
            acc += MATS[i].weight;
            if (x < acc) return MATS[i].key;
        }
        return 'brick';
    }
    function matOf(key) {
        for (var i = 0; i < MATS.length; i++) if (MATS[i].key === key) return MATS[i];
        return MATS[0];
    }

    /* ------------------------------------------------------------------ *
     * BẢNG ĐÁ TƯỜNG (wall kick)
     *
     * Xoay mà đụng tường hay đụng khối thì thử đẩy sang vài chỗ gần đó trước
     * khi kết luận là không xoay được. Không có bảng này thì quân sát mép
     * không xoay nổi, bé bấm mãi không thấy gì và nghĩ là game đơ.
     *
     * Em dùng bảng rút gọn thay cho bảng SRS đầy đủ: bốn chỗ thử, đủ để xoay
     * được ở mọi mép và ở hầu hết khe hẹp, mà lại dễ soát bằng máy.
     * ------------------------------------------------------------------ */
    var KICKS = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];

    /* ------------------------------------------------------------------ *
     * TỐC ĐỘ RƠI THEO BÀN
     *
     * Con số là GIÂY cho mỗi bước rơi một hàng. Bàn 1 chậm hẳn: một giây mới
     * xuống một hàng, bé kịp nhìn kịp nghĩ. Chặn dưới ở 0,22 giây — nhanh hơn
     * nữa thì tay trẻ con không theo kịp, mà xếp hình dành cho bé không nên là
     * cuộc thi bấm nhanh.
     * ------------------------------------------------------------------ */
    function dropDelay(level) {
        var d = 1.0 - (level - 1) * 0.075;
        return Math.max(0.22, +d.toFixed(3));
    }

    /* Cứ ăn đủ 8 hàng thì lên một bàn. */
    function levelFor(lines) { return 1 + Math.floor(lines / 8); }

    /* Điểm ăn hàng: càng nhiều hàng một lúc càng lời, để bé có lý do chờ chứ
     * không phải ăn từng hàng một. Nhân thêm theo chất liệu của những ô bị
     * xoá — dồn được một hàng toàn vàng là đáng nhớ cả buổi. */
    var LINE_SCORE = [0, 100, 300, 600, 1000];

    function scoreLines(n, level, matMult) {
        return Math.round(LINE_SCORE[Math.min(n, 4)] * level * matMult);
    }

    /* ------------------------------------------------------------------ *
     * SỐ NGẪU NHIÊN GIEO HẠT — cùng hạt thì cùng một ván, máy soát mới đo được
     * ------------------------------------------------------------------ */
    function rng(seed) {
        var s = seed | 0;
        return function () {
            s = (s + 0x6D2B79F5) | 0;
            var t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* ------------------------------------------------------------------ *
     * TÚI BẢY QUÂN
     *
     * Bốc ngẫu nhiên thuần thì có ván bé chờ quân I dài suốt hai phút không
     * thấy, hàng chất đầy rồi thua mà không hiểu vì sao. Túi bảy quân xáo đều
     * bảo đảm bảy quân khác nhau mới hết một lượt — vẫn bất ngờ, nhưng không
     * bao giờ bỏ đói.
     * ------------------------------------------------------------------ */
    function makeBag(rnd) {
        var bag = PIECES.slice();
        for (var i = bag.length - 1; i > 0; i--) {
            var j = Math.floor(rnd() * (i + 1));
            var t = bag[i]; bag[i] = bag[j]; bag[j] = t;
        }
        return bag;
    }

    /* ------------------------------------------------------------------ *
     * CÁI GIẾNG
     * ------------------------------------------------------------------ */
    function newBoard() {
        var b = [];
        for (var y = 0; y < ROWS; y++) {
            var row = [];
            for (var x = 0; x < COLS; x++) row.push(null);
            b.push(row);
        }
        return b;
    }

    function cellsOf(piece) {
        var s = SHAPES[piece.type][piece.rot & 3];
        var out = [];
        for (var i = 0; i < s.length; i++) out.push([piece.x + s[i][0], piece.y + s[i][1]]);
        return out;
    }

    /* Quân đặt được ở chỗ này không: không lọt ra ngoài, không đè lên khối cũ.
     * Cho phép nhô LÊN TRÊN mép giếng (y âm) vì quân mới sinh ra ở đó. */
    function fits(board, piece) {
        var c = cellsOf(piece);
        for (var i = 0; i < c.length; i++) {
            var x = c[i][0], y = c[i][1];
            if (x < 0 || x >= COLS || y >= ROWS) return false;
            if (y >= 0 && board[y][x]) return false;
        }
        return true;
    }

    function spawn(type, mat) {
        return { type: type, mat: mat, x: 3, y: -1, rot: 0 };
    }

    function moved(piece, dx, dy) {
        return { type: piece.type, mat: piece.mat, x: piece.x + dx, y: piece.y + dy, rot: piece.rot };
    }

    /* Xoay có thử đá tường. Trả về quân mới, hoặc null nếu không chỗ nào đặt
     * được. dir = +1 xoay phải, −1 xoay trái. */
    function rotated(board, piece, dir) {
        var base = { type: piece.type, mat: piece.mat, x: piece.x, y: piece.y, rot: (piece.rot + (dir > 0 ? 1 : 3)) & 3 };
        for (var i = 0; i < KICKS.length; i++) {
            var t = { type: base.type, mat: base.mat, x: base.x + KICKS[i][0], y: base.y + KICKS[i][1], rot: base.rot };
            if (fits(board, t)) return t;
        }
        return null;
    }

    /* Quân sẽ đáp xuống đâu — dùng cho đường bóng và cho cú thả nhanh. */
    function dropTo(board, piece) {
        var p = piece;
        while (fits(board, moved(p, 0, 1))) p = moved(p, 0, 1);
        return p;
    }

    /* Gắn quân vào giếng. Trả về true nếu có ô nào nằm trên mép — nghĩa là
     * chất quá cao, thua. */
    function lock(board, piece) {
        var c = cellsOf(piece), over = false;
        for (var i = 0; i < c.length; i++) {
            var x = c[i][0], y = c[i][1];
            if (y < 0) { over = true; continue; }
            board[y][x] = piece.mat;
        }
        return over;
    }

    /* Tìm những hàng đã đầy. Trả về danh sách chỉ số hàng, KHÔNG xoá — phần vẽ
     * cần biết trước để chớp sáng mấy hàng ấy rồi mới cho sập xuống. */
    function fullRows(board) {
        var out = [];
        for (var y = 0; y < ROWS; y++) {
            var full = true;
            for (var x = 0; x < COLS; x++) if (!board[y][x]) { full = false; break; }
            if (full) out.push(y);
        }
        return out;
    }

    /* Xoá những hàng ấy và dồn phần trên xuống. Trả về hệ số chất liệu trung
     * bình của những ô vừa xoá, để tính điểm. */
    function clearRows(board, rows) {
        var sum = 0, n = 0, i, x;
        for (i = 0; i < rows.length; i++) {
            for (x = 0; x < COLS; x++) {
                var m = board[rows[i]][x];
                if (m) { sum += matOf(m).mult; n++; }
            }
        }
        var mark = {};
        for (i = 0; i < rows.length; i++) mark[rows[i]] = 1;

        var kept = [];
        for (var y = 0; y < ROWS; y++) if (!mark[y]) kept.push(board[y]);
        while (kept.length < ROWS) {
            var blank = [];
            for (x = 0; x < COLS; x++) blank.push(null);
            kept.unshift(blank);
        }
        for (y = 0; y < ROWS; y++) board[y] = kept[y];

        return n ? sum / n : 1;
    }

    /* Chiều cao đống khối — phần vẽ dùng để lia máy quay, máy soát dùng để
     * biết ván có đang thua dần hay không. */
    function stackHeight(board) {
        for (var y = 0; y < ROWS; y++) {
            for (var x = 0; x < COLS; x++) if (board[y][x]) return ROWS - y;
        }
        return 0;
    }

    /* Số ô trống bị khối khác nhốt bên trên — con số này nói lên bé xếp khéo
     * hay ẩu, và máy soát dùng nó để biết con rô-bốt có chơi ra hồn không. */
    function holes(board) {
        var n = 0;
        for (var x = 0; x < COLS; x++) {
            var seen = false;
            for (var y = 0; y < ROWS; y++) {
                if (board[y][x]) seen = true;
                else if (seen) n++;
            }
        }
        return n;
    }

    return {
        COLS: COLS, ROWS: ROWS,
        SHAPES: SHAPES, PIECES: PIECES,
        MATS: MATS, matAt: matAt, matOf: matOf,
        KICKS: KICKS,
        LINE_SCORE: LINE_SCORE,
        dropDelay: dropDelay, levelFor: levelFor, scoreLines: scoreLines,
        rng: rng, makeBag: makeBag,
        newBoard: newBoard, cellsOf: cellsOf, fits: fits, spawn: spawn,
        moved: moved, rotated: rotated, dropTo: dropTo, lock: lock,
        fullRows: fullRows, clearRows: clearRows,
        stackHeight: stackHeight, holes: holes
    };
}));
