/**
 * Melon Drop — máy soát đống trái cây
 * ----------------------------------------------------------------------------
 * Chạy:  node melon-drop/check-physics.js
 *
 * VÌ SAO CẦN CÁI NÀY
 * Cả game chỉ đứng trên đúng một thứ: một đống hình tròn chồng lên nhau phải
 * nằm YÊN và không quả nào chui lọt ra ngoài thùng. Hai lỗi ấy không nhìn mắt
 * thường mà bắt được:
 *
 *   · Đống quả rung li ti. Nhìn màn hình thì tưởng nó đứng im, nhưng mỗi khung
 *     hình nó nhích 0,002 ô. Rung thì hai quả cạnh nhau chạm nhau lúc bé không
 *     ngờ rồi TỰ NHẬP — bé mất trắng cái chỗ vừa tính, mà chẳng hiểu vì sao.
 *   · Quả lọt qua vách. Chỉ xảy ra khi thùng chật cứng và một quả to bị ép
 *     mạnh, tức là đúng vào phút bé sắp thua — chơi tay hai chục ván chưa chắc
 *     gặp một lần, mà gặp thì hỏng cả ván.
 *
 * Máy này chơi hộ vài trăm ván, mỗi ván vài trăm lượt thả, rồi đo bốn con số:
 * quả lọt ra ngoài, đống quả còn rung bao nhiêu, chuỗi nhập leo tới bậc nào,
 * và cùng một hạt giống thì hai lần chạy có ra y hệt nhau không.
 *
 * Máy gọi thẳng stepBox() của game.js, không chép lại công thức — chép tay là
 * sớm muộn cũng lệch, mà lệch thì máy báo một đằng game chạy một nẻo, còn tệ
 * hơn là không có máy.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------------------------------------------------------------------------
 * 1. Bộ DOM giả + bộ sinh số ngẫu nhiên có hạt giống
 * game.js là mã chạy trong trình duyệt, đụng vào canvas, localStorage, sự kiện
 * chuột. Ở đây dựng đủ mấy thứ đó để nó nạp được, còn phần vẽ cho chạy không.
 *
 * Math.random bị thay bằng bộ sinh có hạt giống: không có nó thì hai lần chạy
 * ra hai kết quả khác nhau, mà khác nhau thì chẳng bao giờ biết được lỗi vừa
 * sửa đã hết hay chỉ là lần này gặp may.
 * -------------------------------------------------------------------------*/

let rng = mulberry32(1);

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function fakeEl() {
    const e = {
        textContent: '', innerHTML: '', hidden: false, style: {}, className: '',
        clientWidth: 0, clientHeight: 0, dataset: {},
        classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } },
        addEventListener() { }, removeEventListener() { }, appendChild() { },
        setPointerCapture() { },
        getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
        getContext() { return fakeCtx(); }
    };
    e.parentElement = e;
    return e;
}

function fakeCtx() {
    const noop = () => { };
    return new Proxy({
        createLinearGradient: () => ({ addColorStop: noop }),
        createRadialGradient: () => ({ addColorStop: noop }),
        measureText: () => ({ width: 0 })
    }, {
        get: (t, k) => (k in t ? t[k] : noop),
        set: (t, k, v) => { t[k] = v; return true; }
    });
}

function loadGame() {
    const file = path.join(__dirname, 'game.js');
    const mem = {};
    const M = Object.create(Math);
    M.random = () => rng();

    const box = {
        console, Math: M, Date, JSON, URLSearchParams, Set, Map,
        setTimeout: () => 0, clearTimeout: () => { },
        requestAnimationFrame: () => 0,
        addEventListener() { }, removeEventListener() { },
        devicePixelRatio: 1, ResizeObserver: null,
        location: { search: '' },
        localStorage: {
            getItem: k => (k in mem ? mem[k] : null),
            setItem: (k, v) => { mem[k] = String(v); },
            removeItem: k => { delete mem[k]; }
        },
        document: {
            readyState: 'complete',
            getElementById: fakeEl, createElement: fakeEl,
            querySelectorAll: () => [],
            addEventListener() { }
        }
    };
    box.window = box;
    vm.createContext(box);
    vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
    if (!box.melonDrop) throw new Error('game.js không lộ ra window.melonDrop');
    return box.melonDrop;
}

const md = loadGame();
const { FRUITS, BW, BH, DANGER_Y, HOLD_Y, TOP_TIER, STEP, makeBox, addFruit, stepBox, overLine, pickTier } = md;

/* ---------------------------------------------------------------------------
 * 2. Chơi hộ một ván
 * Bé thật không thả bừa: thấy quả nào cùng bậc thì thả chồng lên, không thấy
 * thì tìm chỗ trũng nhất mà đặt. Máy chơi đúng kiểu ấy, vì đống quả xếp theo
 * lối chơi thật mới là đống cần soát — thả bừa thì thùng đầy quá nhanh, chẳng
 * bao giờ chạm tới cảnh chật cứng vốn là chỗ hay sinh lỗi.
 * -------------------------------------------------------------------------*/

const DROP_EVERY = 0.5;      // giây giữa hai lượt thả, hơi rộng hơn DROP_CD của game
const QUIET_DOWN = 2;        // cuối ván, chờ bằng này giây cho đống quả lắng xuống
const SETTLE_TAIL = 3;       // rồi soi tiếp bằng này giây xem nó có còn trôi không
const PAUSE_EVERY = 40;      // cứ ngần này lượt thả thì cho bé ngồi nghĩ một lát

function columnTop(box, x, r) {
    /* Mặt trên cao nhất của đống quả trong khoảng bề ngang quả sắp thả */
    let top = BH;
    for (const f of box.fruits) {
        if (Math.abs(f.x - x) > f.r + r) continue;
        if (f.y - f.r < top) top = f.y - f.r;
    }
    return top;
}

function chooseX(box) {
    const r = FRUITS[box.held].r;
    const lo = r + 0.05, hi = BW - r - 0.05;

    /* 1. Có quả cùng bậc đang lộ mặt ra thì thả ngay lên đầu nó */
    let best = null;
    for (const f of box.fruits) {
        if (f.tier !== box.held) continue;
        if (columnTop(box, f.x, r) < f.y - f.r - 0.05) continue;   // bị quả khác đè
        if (!best || f.y < best.y) best = f;
    }
    if (best) return Math.max(lo, Math.min(hi, best.x));

    /* 2. Không thì tìm chỗ trũng nhất, nghiêng nhẹ về giữa thùng */
    let px = BW / 2, deep = -1;
    for (let k = 0; k <= 24; k++) {
        const x = lo + (hi - lo) * (k / 24);
        const d = columnTop(box, x, r) - Math.abs(x - BW / 2) * 0.12;
        if (d > deep) { deep = d; px = x; }
    }
    return px;
}

function playRound(seed, maxDrops) {
    rng = mulberry32(seed);
    const box = makeBox(1);
    box.held = pickTier();
    box.next = pickTier();

    const bad = { escaped: 0, sunk: 0, nan: 0, flew: 0 };
    let drops = 0, t = 0, nextDrop = 0, dangerT = 0, over = false;

    /* Đếm quả to nhất làm ra được bao nhiêu quả. Đây là con số quan trọng
     * nhất của cả máy soát: cái đích treo trước mặt bé mà chính máy chơi cả
     * ván không với tới nổi thì đó không phải cái đích. Bản mười một bậc đầu
     * tiên chết đúng ở chỗ này — mười bốn ván, không quả dưa hấu nào. */
    let tops = 0;
    const count = kind => { if (kind === 'merge' || kind === 'pop') tops++; };
    const cb = (kind, tier) => { if (tier === TOP_TIER) count(kind); };

    let lateMerges = 0, maxV = 0, moved = 0, checks = 0;

    while (drops < maxDrops && !over) {
        if (t >= nextDrop) {
            box.aimX = chooseX(box);
            addFruit(box, box.held, box.aimX, HOLD_Y, 0, 0.6);
            box.held = box.next;
            box.next = pickTier();
            drops++;
            nextDrop = t + DROP_EVERY;

            /* Cứ vài chục lượt lại cho bé "ngồi nghĩ" một lát rồi soi đống quả.
             * Đo ở GIỮA VÁN chứ không đo lúc ván đã tàn: cuối ván đống quả trào
             * lên khỏi miệng thùng, mấy quả chót vót trên đỉnh còn lăn xuống là
             * chuyện vật lý bình thường, tính cả vào thì lần nào cũng báo động
             * oan. Giữa ván mới đúng là lúc bé ngồi tính nước tiếp theo. */
            if (drops % PAUSE_EVERY === 0) {
                const r = settleAudit(box, bad);
                lateMerges += r.lateMerges;
                moved += r.moved;
                maxV = Math.max(maxV, r.maxV);
                t += QUIET_DOWN + SETTLE_TAIL;
                nextDrop = t + DROP_EVERY;
                checks++;
            }
        }

        stepBox(box, STEP, cb);
        t += STEP;
        audit(box, bad);

        if (overLine(box)) {
            dangerT += STEP;
            if (dangerT >= 2.0) over = true;
        } else if (dangerT > 0) {
            dangerT = Math.max(0, dangerT - STEP * 1.6);
        }
    }

    return {
        drops, score: box.score, bestTier: box.bestTier, tops, lateMerges, checks,
        fruits: box.fruits.length, sleeping: box.fruits.filter(f => f.sleeping).length,
        maxV, moved, over, bad
    };
}

/* Bé buông tay ra ngồi nghĩ: đống quả phải lắng xuống rồi đứng im tuyệt đối,
 * và tuyệt đối không được có quả nào tự nhập. */
function settleAudit(box, bad) {
    for (let k = 0; k < QUIET_DOWN / STEP; k++) {
        stepBox(box, STEP, null);
        audit(box, bad);
    }
    const before = new Map(box.fruits.map(f => [f.id, { x: f.x, y: f.y }]));

    let lateMerges = 0;
    for (let k = 0; k < SETTLE_TAIL / STEP; k++) {
        stepBox(box, STEP, kind => { if (kind === 'merge' || kind === 'pop') lateMerges++; });
        audit(box, bad);
    }

    let maxV = 0, moved = 0;
    for (const f of box.fruits) {
        maxV = Math.max(maxV, Math.hypot(f.vx, f.vy));
        const b = before.get(f.id);
        /* Quả nào sinh ra trong lúc lắng thì bỏ qua, nó chưa có chỗ để so */
        if (b && Math.hypot(f.x - b.x, f.y - b.y) > 0.05) moved++;
    }
    return { lateMerges, maxV, moved };
}

/* Soát từng khung hình: quả nào ra ngoài thùng, tụt xuống dưới sàn, bay vọt
 * lên trời hay hoá thành NaN. */
function audit(box, bad) {
    for (const f of box.fruits) {
        if (!isFinite(f.x) || !isFinite(f.y) || !isFinite(f.vx) || !isFinite(f.vy)) { bad.nan++; f.x = BW / 2; f.y = 1; f.vx = 0; f.vy = 0; continue; }
        if (f.x - f.r < -0.08 || f.x + f.r > BW + 0.08) bad.escaped++;
        if (f.y + f.r > BH + 0.08) bad.sunk++;
        if (f.y < -3) bad.flew++;
    }
}

/* ---------------------------------------------------------------------------
 * 3. Chạy và chấm
 * -------------------------------------------------------------------------*/

const ROUNDS = +(process.argv[2] || 40);
const MAX_DROPS = +(process.argv[3] || 400);

console.log('Melon Drop — soát ' + ROUNDS + ' ván, tối đa ' + MAX_DROPS + ' lượt thả mỗi ván\n');

const t0 = Date.now();
const all = [];
let steps = 0;

for (let s = 1; s <= ROUNDS; s++) {
    const r = playRound(s * 7919, MAX_DROPS);
    all.push(r);
    steps += (r.drops * DROP_EVERY + r.checks * (QUIET_DOWN + SETTLE_TAIL)) / STEP;
}

const sum = (k, f) => all.reduce((a, r) => a + (f ? f(r) : r[k]), 0);
const worst = k => all.reduce((a, r) => Math.max(a, r[k]), 0);

const escaped = sum(null, r => r.bad.escaped);
const sunk = sum(null, r => r.bad.sunk);
const flew = sum(null, r => r.bad.flew);
const nan = sum(null, r => r.bad.nan);
const restless = sum('moved');
const avgScore = Math.round(sum('score') / ROUNDS);
const bestTier = worst('bestTier');
const tops = sum('tops');
const avgTier = (sum('bestTier') / ROUNDS).toFixed(1);
const maxV = worst('maxV');
const sleptPct = Math.round(100 * sum('sleeping') / Math.max(1, sum('fruits')));

/* Cùng hạt giống chạy lại lần nữa: phải ra ĐÚNG một kết quả. Lệch một điểm
 * thôi cũng có nghĩa là đâu đó còn phụ thuộc thứ tự hay số ngẫu nhiên ngoài
 * luồng, mà thế thì hai bé thi nhau trên hai máy không còn công bằng. */
const again = playRound(7919, MAX_DROPS);
const deterministic = again.score === all[0].score && again.drops === all[0].drops &&
    again.bestTier === all[0].bestTier;

console.log('  quả lọt ra ngoài vách   ' + escaped);
console.log('  quả tụt xuống dưới sàn  ' + sunk);
console.log('  quả bay vọt khỏi thùng  ' + flew);
console.log('  toạ độ hoá NaN          ' + nan);
console.log('  lần ngồi nghỉ đã soi    ' + sum('checks'));
console.log('  quả còn trôi lúc nghỉ   ' + restless);
console.log('  tự nhập lúc bé ngồi im  ' + sum('lateMerges'));
console.log('  vận tốc lớn nhất lúc nghỉ ' + maxV.toFixed(4) + ' ô/giây');
console.log('  đã ngủ                  ' + sleptPct + '% số quả');
console.log('');
console.log('  điểm trung bình         ' + avgScore);
console.log('  bậc cao nhất chạm tới   ' + bestTier + ' (' + FRUITS[bestTier].name + '), trung bình ' + avgTier);
console.log('  ván kết thúc vì đầy     ' + all.filter(r => r.over).length + '/' + ROUNDS);
console.log('  quả ' + FRUITS[TOP_TIER].name + ' làm ra được  ' + tops + ' quả / ' + ROUNDS + ' ván');
console.log('  chạy lại cùng hạt giống ' + (deterministic ? 'ra y hệt' : 'LỆCH'));
console.log('');

const dt = (Date.now() - t0) / 1000;
console.log('  ' + Math.round(steps / 1000) + 'k bước vật lý trong ' + dt.toFixed(1) + 's  (' +
    Math.round(steps / dt / 1000) + 'k bước/giây)');
console.log('');

/* Ngưỡng đỗ. Ba cái đầu là lỗi thật, không có ngưỡng nào cả — một lần lọt vách
 * cũng là hỏng. Hai cái sau là chất lượng: đống quả phải ngủ và chuỗi nhập
 * phải leo được tới quả dứa (bậc 8) thì bé mới có cái để mà đuổi theo. */
const fails = [];
if (escaped) fails.push(escaped + ' lần quả lọt ra ngoài vách');
if (sunk) fails.push(sunk + ' lần quả tụt xuống dưới sàn');
if (flew) fails.push(flew + ' lần quả bay vọt khỏi thùng');
if (nan) fails.push(nan + ' lần toạ độ hoá NaN');
if (!deterministic) fails.push('chạy lại cùng hạt giống ra kết quả khác');
if (restless > ROUNDS * 0.5) fails.push(restless + ' quả còn trôi trong lúc đáng lẽ phải đứng im');
if (maxV > 0.4) fails.push('đống quả vẫn rung, vận tốc còn ' + maxV.toFixed(3));
if (bestTier < TOP_TIER - 1) fails.push('chưa ván nào leo nổi lên quả dưa lưới, chuỗi nhập quá chặt');
if (tops < ROUNDS * 0.15) fails.push('chỉ ' + tops + ' quả ' + FRUITS[TOP_TIER].name + ' trong ' + ROUNDS + ' ván — cái đích xa quá tầm với');

if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    for (const f of fails) console.log('  · ' + f);
    process.exit(1);
}
console.log('ĐẠT — đống quả nằm yên, không quả nào lọt ra ngoài, chuỗi nhập leo tới nơi.');
