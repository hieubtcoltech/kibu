/**
 * Vặn Ốc — máy soát bảng màn chơi
 * ----------------------------------------------------------------------------
 * Chạy:  node screw-jam/check-levels.js
 *
 * VÌ SAO CẦN CÁI NÀY
 * Cả lời hứa của game nằm ở một câu: "màn nào cũng tháo hết được bằng đúng số
 * chỗ khay có sẵn, không phải mua thêm chỗ nào". Mấy game vặn ốc ngoài kia sống
 * bằng cách làm ngược lại — thả người chơi vào thế tắc rồi bán chỗ khay. Đã hứa
 * thì phải chứng minh được, và đây là chỗ chứng minh.
 *
 * Máy này nạp THẲNG /screw-jam/rules.js — đúng tệp luật mà game chạy trên
 * Phaser cũng nạp. Không có bản chép nào để mà lệch nhau: máy soát bảo tháo
 * được thì trong tay bé cũng tháo được.
 *
 * Nó soát sáu điều:
 *   1. màn nào cũng tháo hết được, với đúng số chỗ khay của màn ấy;
 *   2. mỗi màu đúng bội của ba, không con ốc nào lẻ ra không ai ghép;
 *   3. tấm ván nào cũng có ít nhất một con ốc (ván không ốc là ván rụng ngay
 *      từ giây đầu, bé chưa kịp nhìn đã mất);
 *   4. không có hai màn trùng nhau;
 *   5. đường khó có tăng dần thật không;
 *   6. nút mách nước có kịp trả lời trong tay bé không, kể cả ở giữa chừng ván.
 */
'use strict';

const path = require('path');
const R = require('./rules.js');
const RAW = require('./levels.js');

const WORLDS = [
    { name: 'First Turns', from: 0 },
    { name: 'Stacked Up', from: 15 },
    { name: 'Colour Crowd', from: 30 },
    { name: 'Tight Tray', from: 45 }
];

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

console.log('Vặn Ốc — soát ' + RAW.length + ' màn bằng đúng tệp luật game đang chạy\n');

const fails = [];
const rnd = mulberry32(20260805);
const smart = [];
let worstHint = 0, worstHintLevel = 0, hintChecks = 0;

for (let i = 0; i < RAW.length; i++) {
    const raw = RAW[i];
    const name = 'màn ' + (i + 1);
    const lv = R.inflate(raw);

    /* --- mỗi màu bội của ba --- */
    const cnt = {};
    for (const s of lv.screws) cnt[s.c] = (cnt[s.c] || 0) + 1;
    for (const c in cnt) {
        if (cnt[c] % R.TRIPLE) fails.push(name + ': màu ' + c + ' có ' + cnt[c] + ' con, không chia hết cho ' + R.TRIPLE);
    }
    if (lv.screws.length % R.TRIPLE) fails.push(name + ': tổng số ốc không chia hết cho ' + R.TRIPLE);

    /* --- ván nào cũng phải có ốc --- */
    for (let p = 0; p < lv.plates.length; p++) {
        if (!lv.screws.some(s => s.p === p)) fails.push(name + ': tấm ván ' + p + ' không có con ốc nào');
    }

    /* --- khay phải đủ chỗ để bắt đầu --- */
    if (lv.slots < 3) fails.push(name + ': khay chỉ có ' + lv.slots + ' chỗ, không đủ chứa nổi một bộ ba');

    /* --- tháo hết được không --- */
    const sol = R.solve(lv, 500000);
    if (!sol) {
        fails.push(name + ': KHÔNG THÁO HẾT ĐƯỢC với ' + lv.slots + ' chỗ khay — màn này không được phép có mặt');
    } else if (sol.length !== lv.screws.length) {
        fails.push(name + ': máy tháo được ' + sol.length + '/' + lv.screws.length + ' con, sót lại');
    }
    if (raw.n !== lv.screws.length) {
        fails.push(name + ': số nước ghi trong bảng (' + raw.n + ') khác số ốc thật (' + lv.screws.length + ')');
    }

    /* --- mách nước có kịp trả lời không ---
     * Đo cả lúc mới vào màn lẫn lúc bé đã tháo được nửa bàn: giữa ván thế cờ
     * rối hơn hẳn, mà đó mới đúng là lúc bé bấm xin mách nước. */
    const spots = [{ removed: {}, hold: [] }];
    if (sol) {
        const removed = {};
        let hold = [];
        for (let k = 0; k < Math.floor(sol.length / 2); k++) {
            const res = R.place(hold, lv.screws[sol[k]].c, lv.slots);
            if (!res) break;
            hold = res.hold;
            removed[sol[k]] = 1;
        }
        spots.push({ removed: removed, hold: hold });
    }
    for (const spot of spots) {
        const t0 = Date.now();
        const k = R.hint(lv, spot.removed, spot.hold, 120000);
        const ms = Date.now() - t0;
        hintChecks++;
        if (ms > worstHint) { worstHint = ms; worstHintLevel = i + 1; }
        if (k < 0) fails.push(name + ': máy mách nước bó tay ở một thế còn tháo được');
    }

    smart.push(R.winRate(lv, 40, rnd, true));
}

/* --- không có hai màn trùng nhau --- */
const seen = new Set();
for (let i = 0; i < RAW.length; i++) {
    const key = JSON.stringify(RAW[i].p) + '#' + JSON.stringify(RAW[i].w2);
    if (seen.has(key)) fails.push('màn ' + (i + 1) + ': trùng hệt một màn trước đó');
    seen.add(key);
}

/* --- đường khó --- */
console.log('  đường khó theo từng thế giới (rô-bốt BIẾT NGHĨ thắng bao nhiêu phần):');
const worldSmart = [];
for (let w = 0; w < WORLDS.length; w++) {
    const from = WORLDS[w].from;
    const to = (w + 1 < WORLDS.length ? WORLDS[w + 1].from : RAW.length) - 1;
    const part = smart.slice(from, to + 1);
    const avg = part.reduce((a, b) => a + b, 0) / part.length;
    worldSmart.push(avg);
    const plates = RAW[to].p.length, slots = RAW[to].s;
    console.log('    ' + WORLDS[w].name.padEnd(14) + ' màn ' + (from + 1) + '–' + (to + 1) +
        '  biết nghĩ thắng ' + (100 * avg).toFixed(0) + '%   (tới ' + plates + ' ván, khay ' + slots + ' chỗ)');
}
/* Thế giới cuối đổi hẳn kiểu khó (bớt chỗ khay) nên không bắt nó phải khó hơn
 * thế giới trước theo cùng một thước đo; ba thế giới đầu thì phải đi xuống. */
for (let w = 1; w < worldSmart.length - 1; w++) {
    if (worldSmart[w] > worldSmart[w - 1] + 0.02) {
        fails.push('thế giới ' + (w + 1) + ' lại DỄ hơn thế giới ' + w + ' — đường khó đi giật lùi');
    }
}

const race = RAW.filter(r => r.p.length <= 8).length;
console.log('\n  màn hợp cho hai bé thi (≤ 8 ván): ' + race + '/' + RAW.length);
if (race < 10) fails.push('chỉ có ' + race + ' màn đủ nhỏ cho hai bé thi, ít quá');

console.log('  mách nước lâu nhất: ' + worstHint + 'ms (màn ' + worstHintLevel + ', đo ' + hintChecks + ' lần)');
/* Ngưỡng 250ms: bấm xong mà chờ lâu hơn thế thì bé tưởng nút hỏng rồi bấm loạn.
 * Máy của bé chậm hơn máy này chừng ba tới năm lần nên chừa sẵn khoảng ấy. */
if (worstHint > 250) fails.push('mách nước mất tới ' + worstHint + 'ms, lâu quá — bé bấm xong ngồi chờ');

console.log('');
if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    for (const f of fails) console.log('  · ' + f);
    process.exit(1);
}
console.log('ĐẠT — ' + RAW.length + ' màn đều tháo hết được bằng đúng số chỗ khay của màn ấy,');
console.log('      không màn nào cần mua thêm chỗ, và mách nước trả lời trong ' + worstHint + 'ms.');
void path;
