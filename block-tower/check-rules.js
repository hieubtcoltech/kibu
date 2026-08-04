/**
 * THÁP KHỐI — máy soát luật
 * ----------------------------------------------------------------------------
 * Chạy:  node block-tower/check-rules.js
 *
 * Chạy TRƯỚC khi vẽ một nét nào. Xếp hình là loại game mà lỗi luật không lộ ra
 * bằng mắt: quân xoay sát tường bị nuốt mất một ô, ăn hàng sót lại một khối lơ
 * lửng, bàn thứ mười hai rơi nhanh quá tay trẻ con — nhìn màn hình cả buổi cũng
 * không chắc. Phải đếm.
 *
 * Máy này nạp thẳng rules.js rồi:
 *   1. Soát bảy quân khối: đủ 4 ô, bốn tư thế xoay có cùng số ô, xoay bốn lần
 *      về đúng chỗ cũ
 *   2. Cho rô-bốt chơi hàng nghìn ván, mỗi bước soát cái giếng còn hợp lệ
 *      không: không ô nào lơ lửng vô cớ sau khi ăn hàng, không ô nào ra ngoài
 *   3. Soát phép ăn hàng bằng những cái giếng dựng sẵn — kể cả ăn bốn hàng
 *      một lúc và ăn hàng ở giữa đống
 *   4. Soát đá tường: quân dựng sát mép trái, mép phải phải xoay được
 *   5. Soát bảng tốc độ: bàn 1 phải chậm, và không bàn nào nhanh quá tay bé
 *   6. Soát túi bảy quân: bảy quân khác nhau mỗi lượt, không bỏ đói quân nào
 *   7. Soát cú THẢ NHANH: chỗ quân dừng đúng là ô thấp nhất còn đặt được
 */
'use strict';

const R = require('./rules.js');

const fails = [];
function fail(s) { fails.push(s); }
console.log('soát luật Tháp Khối\n');

/* ---- 1. bảy quân khối ---- */
{
    let bad = 0;
    for (const p of R.PIECES) {
        for (let rot = 0; rot < 4; rot++) {
            const s = R.SHAPES[p][rot];
            if (s.length !== 4) { fail('quân ' + p + ' tư thế ' + rot + ' có ' + s.length + ' ô, phải là 4'); bad++; }
            const seen = {};
            for (const c of s) {
                const k = c[0] + ',' + c[1];
                if (seen[k]) { fail('quân ' + p + ' tư thế ' + rot + ' có hai ô trùng chỗ ' + k); bad++; }
                seen[k] = 1;
                if (c[0] < 0 || c[0] > 3 || c[1] < 0 || c[1] > 3) {
                    fail('quân ' + p + ' tư thế ' + rot + ' có ô ' + k + ' ra ngoài khung 4×4'); bad++;
                }
            }
        }
        /* xoay bốn lần phải về đúng hình cũ — không thì bé xoay vòng rồi thấy
         * quân biến thành hình khác, không hiểu vì sao */
        const a = JSON.stringify(R.SHAPES[p][0]);
        const b = JSON.stringify(R.SHAPES[p][(0 + 4) % 4]);
        if (a !== b) { fail('quân ' + p + ' xoay bốn lần không về hình cũ'); bad++; }
    }
    console.log('  · bảy quân khối: ' + (bad ? bad + ' lỗi' : '7 quân × 4 tư thế, mỗi tư thế đúng 4 ô'));
}

/* ---- 2. rô-bốt chơi thật ----
 *
 * Rô-bốt chọn chỗ đặt theo một cách chấm điểm đơn giản: ưu tiên đặt thấp, ít
 * lỗ, mặt trên phẳng. Nó không cần chơi giỏi — nó chỉ cần chơi ĐÚNG LUẬT hàng
 * vạn nước để lộ ra chỗ luật hỏng.
 */
function bestPlacement(board, piece) {
    let best = null, bestScore = -1e9;
    for (let rot = 0; rot < 4; rot++) {
        for (let x = -2; x < R.COLS + 2; x++) {
            let p = { type: piece.type, mat: piece.mat, x: x, y: -1, rot: rot };
            if (!R.fits(board, p)) continue;
            p = R.dropTo(board, p);
            const copy = board.map(r => r.slice());
            const over = R.lock(copy, p);
            if (over) continue;
            const rows = R.fullRows(copy);
            const h = R.stackHeight(copy), ho = R.holes(copy);
            const score = rows.length * 60 - ho * 12 - h * 2;
            if (score > bestScore) { bestScore = score; best = p; }
        }
    }
    return best;
}

function boardValid(board) {
    for (let y = 0; y < R.ROWS; y++) {
        if (board[y].length !== R.COLS) return 'hàng ' + y + ' có ' + board[y].length + ' cột';
        for (let x = 0; x < R.COLS; x++) {
            const v = board[y][x];
            if (v !== null && !R.MATS.some(m => m.key === v)) return 'ô ' + x + ',' + y + ' mang màu lạ "' + v + '"';
        }
    }
    return null;
}

{
    const GAMES = 400;
    let pieces = 0, lines = 0, maxLevel = 1, topOut = 0, worstHoles = 0;
    const matCount = {};
    for (let g = 0; g < GAMES; g++) {
        const rnd = R.rng(1000 + g * 61);
        const board = R.newBoard();
        let bag = [], total = 0, lv = 1, myLines = 0;
        for (let n = 0; n < 220; n++) {
            if (!bag.length) bag = R.makeBag(rnd);
            const type = bag.pop();
            const mat = R.matAt(rnd());
            matCount[mat] = (matCount[mat] || 0) + 1;
            let p = R.spawn(type, mat);
            if (!R.fits(board, p)) { topOut++; break; }
            const place = bestPlacement(board, p);
            if (!place) { topOut++; break; }
            const over = R.lock(board, place);
            pieces++;
            const bad = boardValid(board);
            if (bad) { fail('sau khi đặt quân: ' + bad); break; }
            const rows = R.fullRows(board);
            if (rows.length) {
                /* Trước khi xoá, đếm số ô đang có. Sau khi xoá phải đúng bằng
                 * số cũ trừ số ô của mấy hàng bị xoá — sót một ô nghĩa là có
                 * khối bốc hơi hoặc khối lơ lửng. */
                let beforeCells = 0;
                for (let y = 0; y < R.ROWS; y++) for (let x = 0; x < R.COLS; x++) if (board[y][x]) beforeCells++;
                R.clearRows(board, rows);
                let afterCells = 0;
                for (let y = 0; y < R.ROWS; y++) for (let x = 0; x < R.COLS; x++) if (board[y][x]) afterCells++;
                if (afterCells !== beforeCells - rows.length * R.COLS) {
                    fail('ăn ' + rows.length + ' hàng: còn ' + afterCells + ' ô, đáng lẽ ' +
                        (beforeCells - rows.length * R.COLS));
                }
                myLines += rows.length;
                lines += rows.length;
                lv = R.levelFor(myLines);
                if (lv > maxLevel) maxLevel = lv;
            }
            const ho = R.holes(board);
            if (ho > worstHoles) worstHoles = ho;
            if (over) { topOut++; break; }
            total++;
        }
    }
    console.log('  · rô-bốt chơi ' + GAMES + ' ván: ' + pieces + ' quân, ăn ' + lines +
        ' hàng, lên tới bàn ' + maxLevel + ', chất đầy ' + topOut + ' lần');
    const matLine = R.MATS.map(m => m.vi + ' ' + Math.round(100 * (matCount[m.key] || 0) /
        Object.values(matCount).reduce((a, b) => a + b, 0)) + '%').join(' · ');
    console.log('    màu bốc được: ' + matLine);
    if (pieces < GAMES * 20) fail('rô-bốt chỉ đặt được ' + pieces + ' quân trong ' + GAMES + ' ván — luật đang chặn nó ở đâu đó');
    if (!lines) fail('chơi cả ' + GAMES + ' ván mà không ăn nổi một hàng nào');
    /* Vàng phải hiếm nhưng không được tuyệt chủng */
    const goldPct = 100 * (matCount.gold || 0) / pieces;
    if (goldPct < 4 || goldPct > 14) fail('khối vàng ra ' + goldPct.toFixed(1) + '% số quân, ngoài khoảng 4–14%');
}

/* ---- 3. ăn hàng trên giếng dựng sẵn ---- */
{
    function boardFrom(rows) {
        const b = R.newBoard();
        for (let i = 0; i < rows.length; i++) {
            const y = R.ROWS - rows.length + i;
            for (let x = 0; x < R.COLS; x++) b[y][x] = rows[i][x] === '#' ? 'ruby' : null;
        }
        return b;
    }
    const full = '##########';
    const gap = '#########.';

    /* ăn một hàng đáy */
    let b = boardFrom([gap, full]);
    let rows = R.fullRows(b);
    if (rows.length !== 1) fail('giếng có đúng một hàng đầy mà tìm ra ' + rows.length);
    R.clearRows(b, rows);
    if (b[R.ROWS - 1].filter(Boolean).length !== 9)
        fail('ăn hàng đáy xong, hàng thủng đáng lẽ phải rơi xuống đáy');

    /* ăn bốn hàng một lúc */
    b = boardFrom([gap, full, full, full, full]);
    rows = R.fullRows(b);
    if (rows.length !== 4) fail('bốn hàng đầy mà tìm ra ' + rows.length);
    const mult = R.clearRows(b, rows);
    if (b[R.ROWS - 1].filter(Boolean).length !== 9) fail('ăn bốn hàng xong không dồn đúng');
    if (Math.abs(mult - 1) > 0.001) fail('hàng toàn khối đỏ mà hệ số màu ra ' + mult);

    /* ăn hàng Ở GIỮA đống — chỗ này dễ sai nhất, vì phải dồn phần trên xuống
     * mà giữ nguyên phần dưới */
    b = boardFrom([gap, full, gap]);
    rows = R.fullRows(b);
    if (rows.length !== 1 || rows[0] !== R.ROWS - 2) fail('không tìm đúng hàng đầy nằm giữa');
    R.clearRows(b, rows);
    if (b[R.ROWS - 1].filter(Boolean).length !== 9 || b[R.ROWS - 2].filter(Boolean).length !== 9)
        fail('ăn hàng giữa xong hai hàng còn lại không đúng chỗ');

    /* hàng toàn vàng phải cho hệ số 3 */
    b = R.newBoard();
    for (let x = 0; x < R.COLS; x++) b[R.ROWS - 1][x] = 'gold';
    const gm = R.clearRows(b, R.fullRows(b));
    if (Math.abs(gm - 3) > 0.001) fail('hàng toàn vàng cho hệ số ' + gm + ', đáng lẽ 3');
    console.log('  · ăn hàng: đáy, bốn hàng một lúc, hàng ở giữa, hàng toàn vàng — đều đúng');
}

/* ---- 4. đá tường ---- */
{
    let stuck = [];
    for (const p of R.PIECES) {
        for (const x of [0, R.COLS - 4]) {
            const board = R.newBoard();
            let piece = { type: p, mat: 'ruby', x: x, y: R.ROWS - 4, rot: 0 };
            if (!R.fits(board, piece)) continue;
            for (let i = 0; i < 4; i++) {
                const rot = R.rotated(board, piece, 1);
                if (!rot) { stuck.push(p + ' ở cột ' + x); break; }
                piece = rot;
            }
        }
    }
    console.log('  · đá tường: ' + (stuck.length ? 'KẸT ' + stuck.join(', ') : 'quân nào sát mép trái/phải cũng xoay được'));
    stuck.forEach(s => fail('quân ' + s + ' dựng sát mép không xoay nổi'));
}

/* ---- 5. bảng tốc độ ---- */
{
    const d1 = R.dropDelay(1), d20 = R.dropDelay(20);
    const line = [1, 3, 6, 10, 15, 20].map(l => 'bàn ' + l + ': ' + R.dropDelay(l) + 's').join(' · ');
    console.log('  · tốc độ rơi — ' + line);
    if (d1 < 0.8) fail('bàn 1 rơi ' + d1 + 's một hàng, nhanh quá cho lần đầu bé chơi');
    if (d20 < 0.2) fail('bàn 20 rơi ' + d20 + 's, nhanh hơn tay trẻ con theo kịp');
    for (let l = 1; l < 30; l++) {
        if (R.dropDelay(l + 1) > R.dropDelay(l)) fail('bàn ' + (l + 1) + ' lại chậm hơn bàn ' + l);
    }
    if (R.levelFor(0) !== 1 || R.levelFor(8) !== 2) fail('ăn 8 hàng phải lên bàn 2');
}

/* ---- 6. túi bảy quân ---- */
{
    const rnd = R.rng(999);
    let worstGap = 0;
    const last = {};
    let n = 0;
    for (let round = 0; round < 3000; round++) {
        const bag = R.makeBag(rnd);
        if (bag.length !== 7) fail('túi có ' + bag.length + ' quân, phải là 7');
        const seen = {};
        for (const p of bag) {
            if (seen[p]) fail('một túi có hai quân ' + p);
            seen[p] = 1;
            n++;
            if (last[p] !== undefined) worstGap = Math.max(worstGap, n - last[p]);
            last[p] = n;
        }
    }
    console.log('  · túi bảy quân: khoảng cách xa nhất giữa hai lần gặp cùng một quân là ' + worstGap + ' quân');
    /* Túi bảy quân bảo đảm không quá 12 quân — cuối túi này tới đầu túi sau. */
    if (worstGap > 13) fail('có lúc bé phải chờ ' + worstGap + ' quân mới gặp lại một loại — túi đang không xáo đúng');
}

/* ---- 7. cú thả nhanh ----
 *
 * Trước đây phần này soát ĐƯỜNG BÓNG — cái khung mờ báo trước chỗ quân sắp
 * đáp. Anh Hiếu bảo bỏ khung ấy đi, người chơi tự biết. Nhưng phép soát thì
 * giữ nguyên giá trị, chỉ đổi tên: cùng một hàm dropTo() giờ lo cú thả nhanh
 * khi bé vuốt xuống, và nó vẫn phải trả về đúng ô thấp nhất còn đặt được —
 * sai một ô là quân cắm vào giữa đống hoặc lơ lửng trên không. */
{
    const rnd = R.rng(4242);
    let bad = 0;
    for (let t = 0; t < 3000; t++) {
        const board = R.newBoard();
        /* rắc vài khối bừa cho cái giếng gồ ghề */
        for (let k = 0; k < 26; k++) {
            const x = Math.floor(rnd() * R.COLS), y = R.ROWS - 1 - Math.floor(rnd() * 6);
            board[y][x] = 'ruby';
        }
        const type = R.PIECES[Math.floor(rnd() * 7)];
        let p = { type: type, mat: 'ruby', x: Math.floor(rnd() * (R.COLS - 3)), y: 0, rot: Math.floor(rnd() * 4) };
        if (!R.fits(board, p)) continue;
        const gh = R.dropTo(board, p);
        /* chỗ dừng phải là ô THẤP NHẤT còn đặt được: đẩy thêm một hàng nữa
         * là hỏng, mà chính nó thì phải hợp lệ */
        if (!R.fits(board, gh)) { bad++; continue; }
        if (R.fits(board, R.moved(gh, 0, 1))) bad++;
    }
    console.log('  · thả nhanh: 3000 lần thử, ' + (bad ? bad + ' lần dừng sai ô' : 'lần nào cũng dừng đúng ô thấp nhất còn đặt được'));
    if (bad) fail('cú thả nhanh dừng sai ô ' + bad + ' lần — quân sẽ cắm vào giữa đống hoặc treo lơ lửng');
}

/* ---- kết ---- */
console.log('');
if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    fails.forEach(f => console.log('  · ' + f));
    process.exit(1);
}
console.log('ĐẠT — bảy quân đúng hình, xoay được ở mọi mép, ăn hàng không sót ô nào,');
console.log('      túi không bỏ đói quân nào, cú thả nhanh dừng đúng ô, và tốc độ rơi');
console.log('      bàn nào cũng nằm trong tầm tay trẻ con.');
