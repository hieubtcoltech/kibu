/* ============================================================================
 * CỜ TƯỚNG — BỘ LUẬT DÙNG CHUNG
 * ----------------------------------------------------------------------------
 * Cùng một tệp chạy được ở hai nơi:
 *   - Trên máy chủ (require) để trọng tài mọi nước đi — đây mới là bản có
 *     thẩm quyền, người chơi không sửa được.
 *   - Trên trình duyệt để tô sáng ô đi được cho mượt tay, không phải hỏi máy chủ
 *     từng lần. Máy chủ vẫn kiểm lại, nên client có bị sửa cũng vô ích.
 *
 * Bàn cờ: 9 cột (0..8, trái sang phải) x 10 hàng (0..9, trên xuống dưới).
 *   Hàng 0..4 là nửa sân ĐEN, hàng 5..9 là nửa sân ĐỎ. Đỏ đi trước.
 *   Ô lưu theo chỉ số: idx = row * 9 + col.
 *
 * Quân: K tướng, A sĩ, B tượng, N mã, R xe, C pháo, P tốt.
 *   CHỮ HOA = Đỏ, chữ thường = Đen.
 * ==========================================================================*/
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.Xiangqi = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var COLS = 9, ROWS = 10, SIZE = COLS * ROWS;

    var START =
        'rnbakabnr' +
        '.........' +
        '.c.....c.' +
        'p.p.p.p.p' +
        '.........' +
        '.........' +
        'P.P.P.P.P' +
        '.C.....C.' +
        '.........' +
        'RNBAKABNR';

    function initial() { return START.split(''); }

    var isRed = function (p) { return p !== '.' && p === p.toUpperCase(); };
    var isBlack = function (p) { return p !== '.' && p === p.toLowerCase(); };
    var sideOf = function (p) { return p === '.' ? null : (isRed(p) ? 'red' : 'black'); };
    var rowOf = function (i) { return Math.floor(i / COLS); };
    var colOf = function (i) { return i % COLS; };
    var idx = function (r, c) { return r * COLS + c; };
    var inBoard = function (r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; };

    /* Cung của mỗi bên: 3 cột giữa, 3 hàng cuối sân mình */
    function inPalace(side, r, c) {
        if (c < 3 || c > 5) return false;
        return side === 'red' ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2);
    }

    // Bên nào ở nửa sân nào — tượng không được qua sông
    function ownHalf(side, r) { return side === 'red' ? r >= 5 : r <= 4; }

    /* ---------- Sinh nước đi thô (chưa xét tướng bị chiếu) ---------- */
    function pseudoMoves(board, from) {
        var p = board[from];
        if (p === '.') return [];
        var side = sideOf(p);
        var r = rowOf(from), c = colOf(from);
        var out = [];
        var kind = p.toUpperCase();

        function tryPush(nr, nc) {
            if (!inBoard(nr, nc)) return false;
            var t = board[idx(nr, nc)];
            if (t !== '.' && sideOf(t) === side) return false;
            out.push(idx(nr, nc));
            return t === '.';
        }

        if (kind === 'K') {
            // Tướng: đi 1 ô ngang dọc, không ra khỏi cung
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
                var nr = r + d[0], nc = c + d[1];
                if (inPalace(side, nr, nc)) tryPush(nr, nc);
            });
        } else if (kind === 'A') {
            // Sĩ: đi chéo 1 ô, quanh quẩn trong cung
            [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) {
                var nr = r + d[0], nc = c + d[1];
                if (inPalace(side, nr, nc)) tryPush(nr, nc);
            });
        } else if (kind === 'B') {
            // Tượng: đi chéo 2 ô, bị cản ở "mắt tượng", không qua sông
            [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(function (d) {
                var nr = r + d[0], nc = c + d[1];
                if (!inBoard(nr, nc) || !ownHalf(side, nr)) return;
                var eye = idx(r + d[0] / 2, c + d[1] / 2);
                if (board[eye] !== '.') return;                 // mắt tượng bị chặn
                tryPush(nr, nc);
            });
        } else if (kind === 'N') {
            // Mã: đi chữ nhật, bị cản chân mã
            var legs = [
                [-2, -1, -1, 0], [-2, 1, -1, 0],
                [2, -1, 1, 0], [2, 1, 1, 0],
                [-1, -2, 0, -1], [1, -2, 0, -1],
                [-1, 2, 0, 1], [1, 2, 0, 1]
            ];
            legs.forEach(function (m) {
                var nr = r + m[0], nc = c + m[1];
                if (!inBoard(nr, nc)) return;
                var leg = idx(r + m[2], c + m[3]);
                if (board[leg] !== '.') return;                 // chân mã bị chặn
                tryPush(nr, nc);
            });
        } else if (kind === 'R') {
            // Xe: đi thẳng đến khi vướng
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
                var nr = r + d[0], nc = c + d[1];
                while (inBoard(nr, nc)) {
                    if (!tryPush(nr, nc)) break;
                    nr += d[0]; nc += d[1];
                }
            });
        } else if (kind === 'C') {
            // Pháo: đi như xe, nhưng ăn quân thì phải có đúng một ngòi
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
                var nr = r + d[0], nc = c + d[1], jumped = false;
                while (inBoard(nr, nc)) {
                    var t = board[idx(nr, nc)];
                    if (!jumped) {
                        if (t === '.') out.push(idx(nr, nc));
                        else jumped = true;                      // gặp ngòi
                    } else if (t !== '.') {
                        if (sideOf(t) !== side) out.push(idx(nr, nc));
                        break;                                   // sau ngòi chỉ ăn được 1 quân
                    }
                    nr += d[0]; nc += d[1];
                }
            });
        } else if (kind === 'P') {
            // Tốt: tiến 1 ô; qua sông rồi mới được đi ngang
            var fwd = side === 'red' ? -1 : 1;
            tryPush(r + fwd, c);
            var crossed = side === 'red' ? r <= 4 : r >= 5;
            if (crossed) { tryPush(r, c - 1); tryPush(r, c + 1); }
        }

        return out;
    }

    function findGeneral(board, side) {
        var want = side === 'red' ? 'K' : 'k';
        for (var i = 0; i < SIZE; i++) if (board[i] === want) return i;
        return -1;
    }

    /* Lộ mặt tướng: hai tướng cùng cột, giữa không còn quân nào */
    function generalsFacing(board) {
        var a = findGeneral(board, 'red'), b = findGeneral(board, 'black');
        if (a < 0 || b < 0) return false;
        if (colOf(a) !== colOf(b)) return false;
        var c = colOf(a);
        var r1 = Math.min(rowOf(a), rowOf(b)), r2 = Math.max(rowOf(a), rowOf(b));
        for (var r = r1 + 1; r < r2; r++) if (board[idx(r, c)] !== '.') return false;
        return true;
    }

    function isAttacked(board, target, bySide) {
        for (var i = 0; i < SIZE; i++) {
            var p = board[i];
            if (p === '.' || sideOf(p) !== bySide) continue;
            var mv = pseudoMoves(board, i);
            for (var k = 0; k < mv.length; k++) if (mv[k] === target) return true;
        }
        return false;
    }

    function inCheck(board, side) {
        var g = findGeneral(board, side);
        if (g < 0) return true;                                  // mất tướng coi như thua
        var enemy = side === 'red' ? 'black' : 'red';
        return isAttacked(board, g, enemy) || generalsFacing(board);
    }

    function applyMove(board, from, to) {
        var b = board.slice();
        b[to] = b[from];
        b[from] = '.';
        return b;
    }

    /* Nước đi hợp lệ: đi xong tướng nhà không được bị chiếu, cũng không được
       để lộ mặt tướng. */
    function movesFrom(board, from) {
        var p = board[from];
        if (p === '.') return [];
        var side = sideOf(p);
        return pseudoMoves(board, from).filter(function (to) {
            return !inCheck(applyMove(board, from, to), side);
        });
    }

    function allMoves(board, side) {
        var out = [];
        for (var i = 0; i < SIZE; i++) {
            if (board[i] === '.' || sideOf(board[i]) !== side) continue;
            movesFrom(board, i).forEach(function (to) { out.push({ from: i, to: to }); });
        }
        return out;
    }

    function isLegal(board, side, from, to) {
        if (from < 0 || from >= SIZE || to < 0 || to >= SIZE || from === to) return false;
        var p = board[from];
        if (p === '.' || sideOf(p) !== side) return false;
        return movesFrom(board, from).indexOf(to) >= 0;
    }

    /* Khoá vị trí để đếm lặp — gồm cả bên đang đi */
    function positionKey(board, side) { return board.join('') + '|' + side; }

    /* ---------- Kết cục ván đấu ----------
       Cờ tướng khác cờ vua: hết nước đi (bí) cũng là THUA chứ không hoà.
       Chiếu bí và bị vây hết nước đều xử thua cho bên tới lượt. */
    function status(board, side, history) {
        if (allMoves(board, side).length === 0) {
            return { over: true, winner: side === 'red' ? 'black' : 'red', reason: inCheck(board, side) ? 'checkmate' : 'stalemate' };
        }

        if (history && history.length) {
            var key = positionKey(board, side);
            var count = 0;
            for (var i = 0; i < history.length; i++) if (history[i].key === key) count++;
            if (count >= 3) {
                /* Lặp 3 lần. Nếu một bên cứ chiếu liên tục để ép hoà thì bên đó
                   xử thua theo luật cấm chiếu mãi; còn lại tính hoà. */
                var reds = 0, blacks = 0, redChecks = 0, blackChecks = 0;
                for (var j = history.length - 1; j >= 0 && (reds + blacks) < 6; j--) {
                    var h = history[j];
                    if (h.mover === 'red') { reds++; if (h.check) redChecks++; }
                    else { blacks++; if (h.check) blackChecks++; }
                }
                if (reds >= 3 && redChecks === reds && blackChecks < blacks) {
                    return { over: true, winner: 'black', reason: 'perpetual' };
                }
                if (blacks >= 3 && blackChecks === blacks && redChecks < reds) {
                    return { over: true, winner: 'red', reason: 'perpetual' };
                }
                return { over: true, winner: null, reason: 'repetition' };
            }
        }
        return { over: false };
    }

    /* Số nước liên tiếp không ăn quân -> hoà (luật 60 nước) */
    function drawByIdle(idlePlies) { return idlePlies >= 120; }

    /* ---------- Tên quân để hiện trên bàn ---------- */
    var GLYPH = {
        K: '帥', A: '仕', B: '相', N: '傌', R: '俥', C: '炮', P: '兵',
        k: '將', a: '士', b: '象', n: '馬', r: '車', c: '砲', p: '卒'
    };

    var NAME_VI = {
        K: 'Tướng', A: 'Sĩ', B: 'Tượng', N: 'Mã', R: 'Xe', C: 'Pháo', P: 'Tốt',
        k: 'Tướng', a: 'Sĩ', b: 'Tượng', n: 'Mã', r: 'Xe', c: 'Pháo', p: 'Tốt'
    };

    return {
        COLS: COLS, ROWS: ROWS, SIZE: SIZE, START: START,
        initial: initial,
        idx: idx, rowOf: rowOf, colOf: colOf,
        sideOf: sideOf, isRed: isRed, isBlack: isBlack,
        inPalace: inPalace,
        pseudoMoves: pseudoMoves,
        movesFrom: movesFrom,
        allMoves: allMoves,
        isLegal: isLegal,
        applyMove: applyMove,
        inCheck: inCheck,
        generalsFacing: generalsFacing,
        findGeneral: findGeneral,
        positionKey: positionKey,
        status: status,
        drawByIdle: drawByIdle,
        GLYPH: GLYPH,
        NAME_VI: NAME_VI
    };
}));
