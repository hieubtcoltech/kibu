/**
 * BẮN VỊT — máy soát công bằng
 * ----------------------------------------------------------------------------
 * Chạy:  node duck-shoot/check-fair.js
 *
 * VÌ SAO CẦN
 * Bốn bé ngồi cạnh nhau, mỗi bé một làn trên cùng một màn hình, và đàn vịt bay
 * chung. Cả trò chơi đứng hay đổ ở một câu: BÉ NGỒI CHỖ NÀO CŨNG CÓ CƠ HỘI NHƯ
 * NHAU CHỨ? Nếu làn số 1 gặp vịt trước nhiều hơn, hoặc vịt nằm trong tầm bắn
 * của làn giữa lâu hơn, thì bé thắng bằng chỗ ngồi chứ không phải bằng tay —
 * mà chuyện ấy trẻ con phát hiện ra rất nhanh và bỏ chơi luôn.
 *
 * Máy này nạp THẲNG duck-shoot/rules.js — đúng tệp luật game đang chạy — rồi
 * chạy hàng nghìn ván, bay từng con vịt theo đúng hàm duckAt() mà phần vẽ
 * dùng, và đếm cho từng làn:
 *
 *   1. GẶP TRƯỚC   con vịt bật lên trong làn nào thì làn ấy được gặp đầu tiên
 *   2. THỜI GIAN NGẮM   tổng số giây vịt nằm trong tầm bắn của làn ấy
 *   3. CƠ HỘI ĂN ĐIỂM   tổng của (điểm con vịt × số giây nó nằm trong làn ấy)
 *
 * Con số thứ ba từng được em đo sai. Lúc đầu em đếm "bao nhiêu CON vịt từng
 * ghé qua làn này", và nó lệch tới 25%: làn giữa thấy nhiều con hơn thật, vì
 * con vịt bật lên ở mép chỉ dạt được sang một phía còn con bật lên ở giữa dạt
 * được cả hai. Nhưng đếm đầu con không phải là đếm cơ hội — bắn được hay không
 * phụ thuộc con vịt Ở TRONG LÀN BAO LÂU chứ không phải nó có tạt qua hay
 * không. Đo bằng điểm-nhân-thời-gian mới ra đúng cái bé thật sự tranh nhau.
 *
 * Em ghi lại chỗ này vì suýt nữa em đi sửa thiết kế cho vừa một phép đo sai.
 *
 * Cả ba con số phải gần bằng nhau giữa các làn. Ngưỡng đặt ở 6%: dưới mức ấy
 * thì kể cả bé tinh ý nhất chơi cả buổi cũng không nhận ra chênh lệch, mà vẫn
 * đủ chặt để bắt được lỗi thiết kế thật.
 *
 * MỘT LỖI THIẾT KẾ MÁY NÀY ĐÃ BẮT ĐƯỢC
 * Bản đầu em cho vịt bay ngang xuyên qua cả bốn làn, đổi chiều mỗi vòng. Chạy
 * thử thì lòi ra: ba bé chơi thì bé Ở GIỮA không bao giờ được gặp vịt đầu tiên
 * — con nào tới tay bé ấy cũng là con hai bé kia đã bắn trượt. Phải đổi hẳn
 * cách vịt xuất hiện (bật lên từ bụi cỏ ở chỗ bất kỳ) mới chữa được.
 */
'use strict';

const R = require('./rules.js');

/* Hai khổ thế giới, đúng hai khổ game chọn lúc chạy: máy tính nằm ngang và
 * điện thoại cầm dựng. Phải soát cả hai — trò chơi công bằng ở khổ ngang mà
 * lệch ở khổ dựng thì vẫn là trò chơi không công bằng, vì bé chơi bằng điện
 * thoại nhiều hơn bằng máy tính. */
const WORLDS = [
    { name: 'máy tính nằm ngang', W: 1280, H: 720 },
    { name: 'điện thoại cầm dựng', W: 720, H: 1380 },
    /* Hai khổ dẹt nhất và cao nhất mà pickSize() còn cho phép. Soát ở hai đầu
     * chặn là đủ: mọi khổ thật đều nằm giữa hai cái này. */
    { name: 'điện thoại xoay ngang (dẹt nhất)', W: 1280, H: 457 },
    { name: 'màn hình cao nhất', W: 720, H: 1385 }
];
const GAMES = 400;            // số ván chạy thử cho mỗi cỡ bàn
const STEP = 1 / 30;          // bước thời gian khi bay thử

const fails = [];
console.log('soát công bằng: ' + GAMES + ' ván cho mỗi cỡ bàn, bay từng con vịt theo đúng hàm của game\n');

for (const world of WORLDS) {
const W = world.W, H = world.H;
const GROUND = H * 0.86;      // vịt bật lên từ đây
const TOP = Math.round(H * 0.097);   // trên nữa là ra khỏi vùng bắn

function laneOf(x, kids) {
    const i = Math.floor(x / (W / kids));
    return i < 0 ? 0 : (i >= kids ? kids - 1 : i);
}

console.log('  ── ' + world.name + ' (' + W + '×' + H + ')');

for (const kids of [2, 3, 4]) {
    const first = new Array(kids).fill(0);   // số lần được gặp vịt đầu tiên
    const aim = new Array(kids).fill(0);     // tổng giây vịt nằm trong tầm
    const pts = new Array(kids).fill(0);     // Σ(điểm × giây nằm trong làn)
    let ducks = 0, escaped = 0;

    for (let g = 0; g < GAMES; g++) {
        const seed = 1000 + g * 37;
        for (let r = 0; r < R.ROUNDS.length; r++) {
            for (const d of R.flock(r, seed, W, H)) {
                ducks++;
                /* con vịt bật lên ở làn nào thì làn ấy gặp trước */
                first[laneOf(d.x0, kids)]++;

                /* bay thử con vịt, mỗi bước cộng thời gian cho làn nó đang ở */
                const val = R.KINDS[d.kind].pts;
                let t = 0, alive = true;
                while (alive && t < 12) {
                    const p = R.duckAt(d, t, GROUND, W);
                    if (!R.inView(p, W, TOP)) { alive = false; break; }
                    const ln = laneOf(p.x, kids);
                    aim[ln] += STEP;
                    pts[ln] += val * STEP;
                    t += STEP;
                }
                if (t >= 12) escaped++;
            }
        }
    }

    const spread = a => {
        const lo = Math.min.apply(null, a), hi = Math.max.apply(null, a);
        const avg = a.reduce((x, y) => x + y, 0) / a.length;
        return avg > 0 ? (hi - lo) / avg : 0;
    };

    const sf = spread(first), sa = spread(aim), sp = spread(pts);
    const tag = world.name + ', ' + kids + ' bé';
    console.log('     ' + kids + ' bé:');
    console.log('     gặp trước      ' + first.map(n => Math.round(n)).join('  ') +
        '   lệch ' + (sf * 100).toFixed(1) + '%');
    console.log('     giây được ngắm ' + aim.map(n => Math.round(n)).join('  ') +
        '   lệch ' + (sa * 100).toFixed(1) + '%');
    console.log('     cơ hội ăn điểm ' + pts.map(n => Math.round(n)).join('  ') +
        '   lệch ' + (sp * 100).toFixed(1) + '%');

    if (sf > 0.06) fails.push(tag + ': số lần gặp vịt trước lệch ' + (sf * 100).toFixed(1) + '% giữa các làn');
    if (sa > 0.06) fails.push(tag + ': thời gian được ngắm lệch ' + (sa * 100).toFixed(1) + '% giữa các làn');
    if (sp > 0.06) fails.push(tag + ': cơ hội ăn điểm lệch ' + (sp * 100).toFixed(1) + '% giữa các làn');

    /* Không làn nào được phép TRẮNG cơ hội gặp trước — đây đúng là lỗi bản đầu:
     * bé ở giữa không bao giờ thấy vịt trước. */
    for (let i = 0; i < kids; i++) {
        if (first[i] === 0) fails.push(tag + ': làn ' + (i + 1) + ' KHÔNG BAO GIỜ được gặp vịt đầu tiên');
    }
}

/* Một vòng phải dài xấp xỉ nhau ở cả hai khổ. Đây là phép soát cho chỗ nhân
 * tốc độ theo khổ: quên nhân thì ở khổ dựng con vịt bay lên ì ạch và vòng dài
 * gấp đôi, bé chờ mãi mới hết vòng. */
for (let r = 0; r < R.ROUNDS.length; r++) {
    const t = R.roundTime(r, 777, W, H);
    if (t < 8 || t > 26) fails.push(world.name + ': vòng ' + (r + 1) + ' dài ' +
        t.toFixed(1) + ' giây, ngoài khoảng 8–26');
}
console.log('     một vòng dài ' +
    R.ROUNDS.map((_, r) => R.roundTime(r, 777, W, H).toFixed(0)).join('/') + ' giây');
console.log('');

}   /* hết một khổ thế giới */

/* ---- vài phép soát luật khác, không phụ thuộc khổ ---- */
const seenRound = {};
for (let r = 0; r < R.ROUNDS.length; r++) {
    const c = R.ROUNDS[r];
    if (seenRound[c.key]) fails.push('hai vòng trùng mã "' + c.key + '"');
    seenRound[c.key] = 1;
    if (!c.vi || !c.en) fails.push('vòng ' + (r + 1) + ' thiếu tên hai thứ tiếng');
}

/* Cùng một hạt phải ra cùng một đàn vịt, không thì máy soát đo một đằng bé
 * chơi một nẻo. */
const a1 = JSON.stringify(R.flock(2, 555, 1280, 720));
const a2 = JSON.stringify(R.flock(2, 555, 1280, 720));
if (a1 !== a2) fails.push('cùng một hạt mà hai lần dựng ra hai đàn vịt khác nhau');

/* Chuỗi bắn trúng không được nhân vô hạn: một bé đang dẫn mà điểm phi mã thì
 * mấy bé kia buông tay. */
if (R.comboMult(99) > 3.01) fails.push('hệ số chuỗi bắn trúng vượt trần 3');

console.log('');
if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    fails.forEach(f => console.log('  · ' + f));
    process.exit(1);
}
console.log('ĐẠT — mọi làn đều có cơ hội gặp vịt trước, thời gian được ngắm và cơ hội');
console.log('      ăn điểm chênh nhau dưới 6%, dù bàn có 2, 3 hay 4 bé.');
