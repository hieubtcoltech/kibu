/**
 * Vặn Ốc — máy sinh màn chơi
 * ----------------------------------------------------------------------------
 * Chạy:  node screw-jam/make-levels.js        (ghi đè screw-jam/levels.js)
 *
 * VÌ SAO SINH SẴN RỒI ĐÓNG GÓI
 * Mỗi màn sinh ra đều bị đem giải thử bằng ĐÚNG số chỗ khay của màn ấy. Màn nào
 * máy không tháo hết nổi thì vứt. Đây chính là chỗ mấy game vặn ốc ngoài kia
 * làm ngược: họ CỐ TÌNH thả người chơi vào thế tắc rồi bán chỗ khay thêm —
 * "hết chỗ rồi, xem quảng cáo để mở thêm ô nhé". Nhà mình không bán gì cả, nên
 * bắt buộc phải bảo đảm màn nào cũng tháo hết được bằng số chỗ có sẵn.
 *
 * ĐO ĐỘ KHÓ BẰNG HAI CON RÔ-BỐT (xem ghi chú ở rules.js)
 * Rô-bốt bấm bừa cho biết màn dễ tới đâu với bé chưa biết gì; rô-bốt biết nghĩ
 * cho biết màn có bắt bé tính trước hay không. Màn đầu để cả hai cùng thắng
 * 100%; màn cuối thì ngay cả rô-bốt biết nghĩ cũng chỉ thắng vài phần trăm.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const R = require('./rules.js');

const GW = 8, GH = 8;          // lưới đặt ván

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/* ---------------------------------------------------------------------------
 * Dựng một bàn ván
 * ------------------------------------------------------------------------- */

function overlapArea(a, b) {
    const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return x * y;
}

/* Tấm ván bị đè kín thì bé không nhìn thấy nó đâu mà chơi — bàn trông rối mà
 * chẳng thêm gì. Đòi mỗi tấm phải hở ra ít nhất một phần ba. */
function visibleEnough(plates) {
    for (let i = 0; i < plates.length; i++) {
        const p = plates[i];
        let covered = 0;
        for (let j = i + 1; j < plates.length; j++) covered += overlapArea(p, plates[j]);
        if (covered > p.w * p.h * 0.66) return false;
    }
    return true;
}

function touches(a, b) {
    /* chạm nhau hoặc đè lên nhau: nới mỗi cạnh nửa ô rồi xem có giao nhau không */
    return a.x < b.x + b.w + 0.5 && b.x < a.x + a.w + 0.5 &&
        a.y < b.y + b.h + 0.5 && b.y < a.y + a.h + 0.5;
}

/* Ván phải DÍNH VÀO NHAU thành một khối.
 *
 * Bản đầu em thả ván ngẫu nhiên khắp lưới. Máy giải thì vẫn giải được, nhưng
 * nhìn ra một bàn rời rạc: hai tấm dính nhau ở góc trên, một tấm lẻ loi tít
 * dưới đáy, ở giữa trống hoác. Trông như ai làm rơi mấy miếng gỗ chứ không
 * phải một cái gì được bắt vít lại. Bắt mỗi tấm mới phải chạm ít nhất một tấm
 * cũ thì bàn ra hình một khối liền, và chuyện tháo theo thứ tự cũng rõ hơn hẳn
 * vì tấm nào cũng thật sự đè lên tấm nào. */
function makePlates(n, rnd) {
    const plates = [];
    let guard = 0;
    while (plates.length < n && guard++ < 400) {
        const w = 2 + Math.floor(rnd() * 3);
        const h = 1 + Math.floor(rnd() * 2);
        const p = {
            x: Math.floor(rnd() * (GW - w + 1)),
            y: Math.floor(rnd() * (GH - h + 1)),
            w: w, h: h
        };
        if (plates.length && !plates.some(q => touches(p, q))) continue;
        plates.push(p);
    }
    return plates.length === n ? plates : null;
}

/* Khối ván phải gọn, không kéo dài loằng ngoằng: diện tích khung bao không
 * được lớn hơn hai lần rưỡi tổng diện tích ván. */
function compact(plates) {
    let minX = 99, minY = 99, maxX = 0, maxY = 0, area = 0;
    for (const p of plates) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x + p.w > maxX) maxX = p.x + p.w;
        if (p.y + p.h > maxY) maxY = p.y + p.h;
        area += p.w * p.h;
    }
    return (maxX - minX) * (maxY - minY) <= area * 3.0;
}

/* Ốc đặt ở tâm mấy ô lưới trong lòng tấm ván, ưu tiên hai đầu — ván thật cũng
 * bắt vít ở hai đầu chứ không bắt giữa. */
function placeScrews(plates, rnd) {
    const screws = [];
    for (let i = 0; i < plates.length; i++) {
        const p = plates[i];
        const spots = [];
        for (let dx = 0; dx < p.w; dx++) {
            for (let dy = 0; dy < p.h; dy++) {
                const edge = (dx === 0 || dx === p.w - 1) ? 0 : 1;
                spots.push({ x: p.x + dx + 0.5, y: p.y + dy + 0.5, edge: edge });
            }
        }
        spots.sort((a, b) => (a.edge - b.edge) || (rnd() - 0.5));
        const want = Math.min(spots.length, 2 + (rnd() < 0.35 ? 1 : 0));
        for (let k = 0; k < want; k++) screws.push({ x: spots[k].x, y: spots[k].y, p: i, c: 0 });
    }
    return screws;
}

/* Số ốc phải chia hết cho ba, và tấm ván nào cũng phải còn ít nhất một con —
 * ván không ốc là ván rụng ngay từ giây đầu, bé chưa kịp nhìn đã mất. */
function trimToTriples(screws, plates) {
    const byPlate = plates.map(() => []);
    screws.forEach((s, i) => byPlate[s.p].push(i));
    const drop = {};
    let extra = screws.length % 3;
    for (let i = plates.length - 1; i >= 0 && extra > 0; i--) {
        while (byPlate[i].length > 1 && extra > 0) { drop[byPlate[i].pop()] = 1; extra--; }
    }
    if (extra > 0) return null;
    const out = screws.filter((s, i) => !drop[i]);
    for (let i = 0; i < plates.length; i++) {
        if (!out.some(s => s.p === i)) return null;
    }
    return out;
}

function paintColors(screws, colors, rnd) {
    const bag = [];
    const groups = screws.length / 3;
    for (let g = 0; g < groups; g++) { const c = g % colors; bag.push(c, c, c); }
    for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
    }
    screws.forEach((s, i) => { s.c = bag[i]; });
    /* Dùng đủ số màu đã định, không thì màn "năm màu" hoá ra chỉ có ba */
    const used = {};
    screws.forEach(s => { used[s.c] = 1; });
    return Object.keys(used).length === colors;
}

function build(band, rnd) {
    const plates = makePlates(band.plates, rnd);
    if (!plates) return null;
    if (!compact(plates)) return null;
    if (!visibleEnough(plates)) return null;
    let screws = placeScrews(plates, rnd);
    screws = trimToTriples(screws, plates);
    if (!screws || screws.length < 6) return null;
    if (screws.length / 3 < band.colors) return null;
    if (!paintColors(screws, band.colors, rnd)) return null;

    const level = { slots: band.slots, plates: plates, screws: screws };

    /* Không được có con ốc nào bị đè vĩnh viễn: ván đè nó phải tháo được trước.
     * Máy giải bên dưới bắt hết, nhưng loại sớm ở đây thì đỡ tốn công giải. */
    if (!R.freeScrews(level, {}).length) return null;

    const sol = R.solve(level, 400000);
    if (!sol) return null;

    const blind = R.winRate(level, 40, rnd, false);
    const smart = R.winRate(level, 40, rnd, true);
    if (smart < band.lo || smart > band.hi) return null;

    return { level: level, sol: sol.length, blind: +blind.toFixed(3), smart: +smart.toFixed(3) };
}

/* ---------------------------------------------------------------------------
 * Đường khó tăng dần
 * ------------------------------------------------------------------------- */

const WORLDS = ['Tập Vặn', 'Chồng Ván', 'Nhiều Màu', 'Khay Chật'];

const CURVE = [
    /* ---- Tập Vặn: bấm đâu cũng qua, cốt cho bé hiểu luật ---- */
    { w: 0, n: 4, plates: 3, colors: 2, slots: 6, lo: 0.95, hi: 1.00 },
    { w: 0, n: 4, plates: 4, colors: 2, slots: 6, lo: 0.90, hi: 1.00 },
    { w: 0, n: 4, plates: 5, colors: 3, slots: 6, lo: 0.80, hi: 1.00 },
    { w: 0, n: 3, plates: 6, colors: 3, slots: 6, lo: 0.70, hi: 0.95 },

    /* ---- Chồng Ván: ván bắt đầu đè nhau nhiều, phải nhìn thứ tự ---- */
    { w: 1, n: 5, plates: 7, colors: 3, slots: 5, lo: 0.55, hi: 0.85 },
    { w: 1, n: 5, plates: 8, colors: 3, slots: 5, lo: 0.40, hi: 0.70 },
    { w: 1, n: 5, plates: 9, colors: 4, slots: 5, lo: 0.28, hi: 0.55 },

    /* ---- Nhiều Màu: khay năm chỗ mà tới sáu màu chen nhau ---- */
    { w: 2, n: 5, plates: 10, colors: 4, slots: 5, lo: 0.18, hi: 0.40 },
    { w: 2, n: 5, plates: 11, colors: 5, slots: 5, lo: 0.10, hi: 0.30 },
    { w: 2, n: 5, plates: 12, colors: 5, slots: 5, lo: 0.05, hi: 0.20 },

    /* ---- Khay Chật: bớt chỗ khay đi, cái khó đổi hẳn kiểu ----
       Ít ván hơn thế giới trước mà vẫn hóc, vì khay chỉ còn bốn chỗ: đặt sai
       một con là hết đường lùi. */
    { w: 3, n: 5, plates: 9, colors: 4, slots: 4, lo: 0.10, hi: 0.45 },
    { w: 3, n: 5, plates: 10, colors: 5, slots: 4, lo: 0.04, hi: 0.25 },
    { w: 3, n: 5, plates: 12, colors: 6, slots: 5, lo: 0.00, hi: 0.12 }
];

const TRIES = 150000;

function main() {
    const rnd = mulberry32(20260805);
    const levels = [];
    const seen = {};

    for (const band of CURVE) {
        let made = 0, tries = 0;
        while (made < band.n && tries < TRIES) {
            tries++;
            const r = build(band, rnd);
            if (!r) continue;
            const key = JSON.stringify(r.level.plates) + '#' + JSON.stringify(r.level.screws);
            if (seen[key]) continue;
            seen[key] = 1;
            levels.push({ w: band.w, band: band, r: r });
            made++;
        }
        if (made < band.n) {
            console.error('CHỈ SINH ĐƯỢC ' + made + '/' + band.n + ' màn cho bậc ' +
                band.plates + ' ván / ' + band.colors + ' màu / ' + band.slots + ' chỗ khay');
        }
    }

    const lines = levels.map((L, i) => {
        const lv = L.r.level;
        const p = lv.plates.map(a => '[' + a.x + ',' + a.y + ',' + a.w + ',' + a.h + ']').join(',');
        const w = lv.screws.map(a => '[' + a.x + ',' + a.y + ',' + a.p + ',' + a.c + ']').join(',');
        return '    /* ' + String(i + 1).padStart(2) + ' */ { w: ' + L.w + ', s: ' + lv.slots +
            ', n: ' + L.r.sol + ', b: ' + L.r.blind + ', k: ' + L.r.smart +
            ',\n              p: [' + p + '],\n              w2: [' + w + '] }';
    });

    const out = `/**
 * Vặn Ốc — bảng màn chơi
 * ----------------------------------------------------------------------------
 * TỆP NÀY DO MÁY SINH RA, ĐỪNG SỬA TAY.
 * Sinh lại bằng:  node screw-jam/make-levels.js
 *
 * Mỗi màn đã được máy tháo thử hết bằng ĐÚNG số chỗ khay ghi ở đây, nên không
 * màn nào tắc và không bao giờ phải mua thêm chỗ.
 *   w   thế giới (0..3)
 *   s   số chỗ trên khay
 *   n   số nước máy tháo hết
 *   b   rô-bốt bấm bừa thắng bao nhiêu phần
 *   k   rô-bốt biết nghĩ thắng bao nhiêu phần — càng nhỏ càng phải tính trước
 *   p   các tấm ván [x, y, rộng, cao], tấm sau đè lên tấm trước
 *   w2  các con ốc [x, y, tấm ván, màu]
 */
(function (root) {
    var LEVELS = [
${lines.join(',\n')}
    ];
    if (typeof module === 'object' && module.exports) module.exports = LEVELS;
    else root.SCREW_LEVELS = LEVELS;
}(typeof self !== 'undefined' ? self : this));
`;

    fs.writeFileSync(path.join(__dirname, 'levels.js'), out);

    console.log('Đã sinh ' + levels.length + ' màn → screw-jam/levels.js\n');
    let i = 0;
    for (const band of CURVE) {
        const part = levels.slice(i, i + band.n);
        i += band.n;
        if (!part.length) continue;
        const b = part.reduce((s, L) => s + L.r.blind, 0) / part.length;
        const k = part.reduce((s, L) => s + L.r.smart, 0) / part.length;
        const n = part.reduce((s, L) => s + L.r.sol, 0) / part.length;
        console.log('  [' + WORLDS[band.w] + '] ' + String(band.plates).padStart(2) + ' ván, ' +
            band.colors + ' màu, khay ' + band.slots + ' chỗ → ' + part.length + ' màn, ' +
            'bấm bừa ' + (100 * b).toFixed(0) + '%, biết nghĩ ' + (100 * k).toFixed(0) + '%, ' +
            n.toFixed(0) + ' ốc');
    }
}

main();
