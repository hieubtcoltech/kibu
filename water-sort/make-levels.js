/**
 * Rót Màu — máy sinh màn chơi
 * ----------------------------------------------------------------------------
 * Chạy:  node water-sort/make-levels.js        (ghi đè water-sort/levels.js)
 *
 * VÌ SAO SINH SẴN RỒI ĐÓNG GÓI, KHÔNG SINH LÚC BÉ CHƠI
 * Sinh lúc chơi thì mỗi bé một màn khác nhau, không ai so điểm với ai được, mà
 * quan trọng hơn: không kịp soát. Ở đây mỗi màn sinh ra đều bị đem giải thử,
 * màn nào máy không giải nổi thì vứt — nên trong tệp đóng gói không thể có một
 * màn tắc nào lọt tới tay bé. Mấy game xếp màu ngoài kia thỉnh thoảng vẫn quăng
 * cho người chơi một màn không có lời giải; bé ngồi mò cả buổi rồi tự trách
 * mình dốt, chứ đâu biết là màn ấy hỏng.
 *
 * ĐO ĐỘ KHÓ BẰNG "CHƠI BỪA THẮNG BAO NHIÊU PHẦN TRĂM"
 * Số nước đi ít nhất KHÔNG phải là độ khó: màn hai mươi nước dễ ợt vẫn dài hơn
 * màn mười nước hóc búa. Cái làm nên độ khó của thể loại này là chuyện có dễ đi
 * vào ngõ cụt hay không. Nên máy cho một con rô-bốt chơi bừa sáu chục lượt: nó
 * thắng 100% thì màn ấy chỉ để bé làm quen, còn nó thắng 5% thì là màn phải
 * ngồi tính. Xếp màn theo con số ấy thì đường khó tăng dần là đo được, không
 * phải đoán.
 *
 * Ba nút xoay độ khó: số màu, số ống trống, và bao nhiêu màu bị xáo lẫn vào
 * nhau. Ống trống là nút mạnh nhất — bớt một ống trống là màn khó hẳn lên.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CAP = 4;                 // mỗi ống chứa được 4 phần

/* ---------------------------------------------------------------------------
 * 1. Luật chơi (bản gọn, chỉ đủ cho máy sinh và máy giải)
 * -------------------------------------------------------------------------*/

function key(t) { return t.map(x => x.join(',')).sort().join('|'); }

function done(t) {
    return t.every(x => !x.length || (x.length === CAP && x.every(c => c === x[0])));
}

/* Mọi nước rót hợp lệ. Hai nước bị loại thẳng vì chắc chắn vô ích:
 *   · đụng vào ống đã xong (bốn phần cùng màu) — chỉ tổ làm hỏng;
 *   · dời nguyên một cụm sang ống trống — bày ra y như cũ, chỉ đổi chỗ. */
function moves(t) {
    const out = [];
    for (let i = 0; i < t.length; i++) {
        const a = t[i];
        if (!a.length) continue;
        const c = a[a.length - 1];
        let n = 1;
        while (n < a.length && a[a.length - 1 - n] === c) n++;
        if (n === a.length && a.length === CAP) continue;
        for (let j = 0; j < t.length; j++) {
            if (i === j) continue;
            const b = t[j];
            if (b.length === CAP) continue;
            if (b.length && b[b.length - 1] !== c) continue;
            if (!b.length && n === a.length) continue;
            out.push([i, j, Math.min(n, CAP - b.length)]);
        }
    }
    return out;
}

function apply(t, m) {
    const u = t.map(x => x.slice());
    for (let k = 0; k < m[2]; k++) u[m[1]].push(u[m[0]].pop());
    return u;
}

/* Tìm MỘT lời giải. Ưu tiên nước rót được nhiều phần nhất trước — mẹo ấy đưa
 * máy tới lời giải rất nhanh, phần lớn màn chỉ ngó qua vài chục trạng thái. */
function solve(t, cap) {
    const seen = new Set();
    let nodes = 0;
    function dfs(s, d, path) {
        if (done(s)) return path;
        if (d <= 0) return null;
        if (++nodes > cap) return null;
        const k = key(s);
        if (seen.has(k)) return null;
        seen.add(k);
        const ms = moves(s);
        ms.sort((a, b) => b[2] - a[2]);
        for (const m of ms) {
            const r = dfs(apply(s, m), d - 1, path.concat([m]));
            if (r) return r;
        }
        return null;
    }
    return dfs(t, 220, []);
}

/* Số nước đi ít nhất, tìm bằng cách nới dần độ sâu (IDA*). Dùng làm mốc chấm
 * sao: đi đúng bằng chừng này nước là ba sao. */
function shortest(t, limit, budget) {
    let nodes = 0;
    for (let d = 1; d <= limit; d++) {
        const seen = new Map();
        const hit = (function dfs(s, left) {
            if (done(s)) return true;
            if (left <= 0) return false;
            if (++nodes > budget) return null;      // hết ngân sách
            const k = key(s);
            const was = seen.get(k);
            if (was !== undefined && was >= left) return false;
            seen.set(k, left);
            const ms = moves(s);
            ms.sort((a, b) => b[2] - a[2]);
            for (const m of ms) {
                const r = dfs(apply(s, m), left - 1);
                if (r === null) return null;
                if (r) return true;
            }
            return false;
        })(t, d);
        if (hit === null) return 0;                 // không đủ sức tìm, bỏ qua
        if (hit) return d;
    }
    return 0;
}

/* Rô-bốt chơi bừa: đo xem màn này có dễ đi vào ngõ cụt không */
function blindRate(t, tries, rnd) {
    let win = 0;
    for (let k = 0; k < tries; k++) {
        let s = t.map(x => x.slice());
        for (let step = 0; step < 220; step++) {
            if (done(s)) { win++; break; }
            const ms = moves(s);
            if (!ms.length) break;
            s = apply(s, ms[Math.floor(rnd() * ms.length)]);
        }
    }
    return win / tries;
}

/* ---------------------------------------------------------------------------
 * 2. Sinh một màn
 * -------------------------------------------------------------------------*/

function shuffleInto(colors, empties, rnd) {
    const pool = [];
    for (let c = 0; c < colors; c++) for (let k = 0; k < CAP; k++) pool.push(c);
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    const t = [];
    for (let i = 0; i < colors; i++) t.push(pool.slice(i * CAP, i * CAP + CAP));
    for (let e = 0; e < empties; e++) t.push([]);
    return t;
}

/* Màn dễ nhất cũng phải có việc để làm: ống nào ngay từ đầu đã một màu thì
 * xáo lại, không thì bé mở màn ra đã thấy xong sẵn mấy ống. */
function trivialTubes(t) {
    let n = 0;
    for (const x of t) if (x.length === CAP && x.every(c => c === x[0])) n++;
    return n;
}

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ---------------------------------------------------------------------------
 * 3. Đường khó tăng dần
 * ------------------------------------------------------------------------- */

/* Mỗi bậc: [số màu, số ống trống, dải "chơi bừa thắng" mong muốn].
 * Dải ấy mới là thứ quyết định màn khó tới đâu; số màu và số ống trống chỉ là
 * cách để chạm tới nó. Màn đầu để rô-bốt chơi bừa cũng thắng — bé nào bấm loạn
 * cũng qua, cốt cho quen tay. Về cuối chỉ còn dưới một phần mười, tức là phải
 * nghĩ thật mới đi được. */
const CURVE = [
    /* ---- Thế giới 1: TẬP RÓT — bé nào bấm loạn cũng qua, cốt cho quen tay ---- */
    { w: 0, n: 3, colors: 3, empties: 2, lo: 0.90, hi: 1.00 },
    { w: 0, n: 4, colors: 4, empties: 2, lo: 0.85, hi: 1.00 },
    { w: 0, n: 4, colors: 5, empties: 2, lo: 0.70, hi: 0.99 },
    { w: 0, n: 4, colors: 6, empties: 2, lo: 0.50, hi: 0.85 },

    /* ---- Thế giới 2: NHIỀU MÀU — bắt đầu phải ngó trước một nước ---- */
    { w: 1, n: 5, colors: 7, empties: 2, lo: 0.35, hi: 0.70 },
    { w: 1, n: 5, colors: 8, empties: 2, lo: 0.20, hi: 0.45 },
    { w: 1, n: 5, colors: 9, empties: 2, lo: 0.10, hi: 0.30 },

    /* ---- Thế giới 3: CHẬT CHỖ — mười một màu, chỉ hai ống để xoay xở ---- */
    { w: 2, n: 7, colors: 10, empties: 2, lo: 0.06, hi: 0.20 },
    { w: 2, n: 8, colors: 11, empties: 2, lo: 0.02, hi: 0.13 },

    /* ---- Thế giới 4: MỘT ỐNG TRỐNG — cái khó khác hẳn ----
       Ít màu hơn hẳn mà vẫn hóc, vì chỉ còn đúng một chỗ để xoay. Đa số cách
       xếp kiểu này còn KHÔNG có lời giải (máy thử bốn màu thì hai phần năm số
       màn phải vứt, tám màu thì vứt sạch), nên chỗ này máy sàng nặng tay nhất
       — và cũng là chỗ chứng minh rõ nhất vì sao phải giải thử từng màn. */
    { w: 3, n: 4, colors: 4, empties: 1, lo: 0.25, hi: 0.60 },
    { w: 3, n: 5, colors: 5, empties: 1, lo: 0.08, hi: 0.35 },
    { w: 3, n: 6, colors: 6, empties: 1, lo: 0.02, hi: 0.22 }
];

const WORLDS = ['Tập Rót', 'Nhiều Màu', 'Chật Chỗ', 'Một Ống Trống'];

const TRIES = 4000;            // số lần thử mỗi màn trước khi chịu thua

function build() {
    const rnd = mulberry32(20260804);
    const levels = [];
    const seen = new Set();

    for (const band of CURVE) {
        let made = 0, tries = 0;
        while (made < band.n && tries < TRIES) {
            tries++;
            const t = shuffleInto(band.colors, band.empties, rnd);
            if (trivialTubes(t) > (band.colors > 8 ? 1 : 0)) continue;
            const k = key(t);
            if (seen.has(k)) continue;

            const sol = solve(t, 400000);
            if (!sol) continue;                       // không giải nổi thì bỏ

            const blind = blindRate(t, 60, rnd);
            if (blind < band.lo || blind > band.hi) continue;

            /* Mốc ba sao: số nước ít nhất nếu tìm nổi, không thì lấy lời giải
             * máy vừa tìm được rồi nới ra một chút cho bé dễ thở. */
            const best = shortest(t, sol.length, 300000);
            const par = best || sol.length;

            seen.add(k);
            levels.push({
                w: band.w, tubes: t, colors: band.colors, empties: band.empties,
                par: par, exact: best > 0, blind: +blind.toFixed(3)
            });
            made++;
        }
        if (made < band.n) {
            console.error('CHỈ SINH ĐƯỢC ' + made + '/' + band.n + ' màn cho bậc ' +
                band.colors + ' màu / ' + band.empties + ' ống trống');
        }
    }
    return levels;
}

/* ---------------------------------------------------------------------------
 * 4. Ghi ra tệp
 * -------------------------------------------------------------------------*/

const levels = build();

const lines = levels.map((L, i) => {
    const tubes = L.tubes.map(x => '[' + x.join(',') + ']').join(',');
    return '    /* ' + String(i + 1).padStart(2) + ' */ ' +
        '{ w: ' + L.w + ', p: ' + L.par + ', b: ' + L.blind + ', t: [' + tubes + '] }';
});

const out = `/**
 * Rót Màu — bảng màn chơi
 * ----------------------------------------------------------------------------
 * TỆP NÀY DO MÁY SINH RA, ĐỪNG SỬA TAY.
 * Sinh lại bằng:  node water-sort/make-levels.js
 *
 * Mỗi màn đã được máy giải thử trước khi lọt vào đây, nên không màn nào tắc.
 *   w  thế giới (0..3)
 *   t  các ống lúc bắt đầu, tính từ đáy lên miệng; ống rỗng là []
 *   p  số nước đi ít nhất (mốc ba sao)
 *   b  rô-bốt chơi bừa thắng bao nhiêu phần — càng nhỏ càng phải nghĩ
 */
(function (root) {
    var LEVELS = [
${lines.join(',\n')}
    ];
    if (typeof module === 'object' && module.exports) module.exports = LEVELS;
    else root.WATER_SORT_LEVELS = LEVELS;
}(typeof self !== 'undefined' ? self : this));
`;

fs.writeFileSync(path.join(__dirname, 'levels.js'), out);

console.log('Đã sinh ' + levels.length + ' màn → water-sort/levels.js\n');
let i = 0;
for (const band of CURVE) {
    const part = levels.slice(i, i + band.n);
    i += band.n;
    if (!part.length) continue;
    const b = part.reduce((s, L) => s + L.blind, 0) / part.length;
    const p = part.reduce((s, L) => s + L.par, 0) / part.length;
    const exact = part.filter(L => L.exact).length;
    console.log('  [' + WORLDS[band.w] + '] ' + String(band.colors).padStart(2) + ' màu, ' +
        band.empties + ' ống trống → ' + part.length + ' màn, chơi bừa thắng ' +
        (100 * b).toFixed(0) + '%, trung bình ' + p.toFixed(1) + ' nước, ' +
        exact + '/' + part.length + ' màn biết chắc số nước ít nhất');
}
