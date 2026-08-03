/**
 * Rót Màu — máy soát bảng màn chơi
 * ----------------------------------------------------------------------------
 * Chạy:  node water-sort/check-levels.js
 *
 * VÌ SAO CẦN CÁI NÀY
 * Cả lời hứa của game nằm ở một câu: "màn nào cũng chắc chắn giải được". Câu ấy
 * mà sai một lần thôi là bé ngồi mò cả buổi rồi tự trách mình dốt, chứ đâu biết
 * màn ấy hỏng. Máy sinh màn đã giải thử rồi, nhưng máy sinh và game là hai tệp
 * khác nhau — nhỡ luật chơi bên game lệch đi một chút (chẳng hạn cấm rót cả cụm
 * sang ống trống) thì màn "giải được" theo máy sinh lại thành tắc trong tay bé.
 * Nên máy này nạp THẲNG game.js rồi giải bằng đúng luật mà bé đang chơi.
 *
 * Nó soát năm điều:
 *   1. màn nào cũng giải được, bằng đúng luật trong game;
 *   2. mốc ba sao có đạt nổi không — tồn tại lời giải đúng bằng ngần ấy nước;
 *   3. mỗi màu đúng bốn phần, không thừa không thiếu;
 *   4. đường khó có tăng dần thật không;
 *   5. nút mách nước có kịp trả lời trong tay bé không, kể cả ở màn khó nhất
 *      và ở giữa chừng ván.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------------------------------------------------------------------------
 * 1. Bộ DOM giả để nạp game.js
 * -------------------------------------------------------------------------*/

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
    const mem = {};
    const box = {
        console, Math, Date, JSON, URLSearchParams, Set, Map,
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
    for (const f of ['levels.js', 'game.js']) {
        const file = path.join(__dirname, f);
        vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
    }
    if (!box.waterSort) throw new Error('game.js không lộ ra window.waterSort');
    return box.waterSort;
}

const ws = loadGame();
const { LEVELS, WORLDS, COLORS, CAP, allDone, legalMoves, applyMove, findSolution } = ws;

/* ---------------------------------------------------------------------------
 * 2. Mấy phép đo
 * -------------------------------------------------------------------------*/

/* Có lời giải dài đúng bằng hoặc ngắn hơn `limit` nước không? Dùng để soát mốc
 * ba sao: mốc mà không ai đạt nổi thì là mốc treo cho vui. */
function solvableWithin(tubes, limit, budget) {
    const seen = new Map();
    let nodes = 0;
    function dfs(s, left) {
        if (allDone(s)) return true;
        if (left <= 0) return false;
        if (++nodes > budget) return null;
        const k = s.map(x => x.join(',')).sort().join('|');
        const was = seen.get(k);
        if (was !== undefined && was >= left) return false;
        seen.set(k, left);
        const ms = legalMoves(s);
        ms.sort((a, b) => b[2] - a[2]);
        for (const m of ms) {
            const r = dfs(applyMove(s, m), left - 1);
            if (r === null) return null;
            if (r) return true;
        }
        return false;
    }
    return dfs(tubes, limit);
}

function blindRate(tubes, tries, rnd) {
    let win = 0;
    for (let k = 0; k < tries; k++) {
        let s = tubes.map(x => x.slice());
        for (let step = 0; step < 220; step++) {
            if (allDone(s)) { win++; break; }
            const ms = legalMoves(s);
            if (!ms.length) break;
            s = applyMove(s, ms[Math.floor(rnd() * ms.length)]);
        }
    }
    return win / tries;
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
 * 3. Chạy
 * -------------------------------------------------------------------------*/

console.log('Rót Màu — soát ' + LEVELS.length + ' màn bằng đúng luật trong game.js\n');

const fails = [];
const rnd = mulberry32(4242);
let worstHint = 0, worstHintLevel = 0, hintChecks = 0;
const blinds = [];

for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i];
    const name = 'màn ' + (i + 1);
    const tubes = L.t.map(x => x.slice());

    /* --- mỗi màu đúng bốn phần --- */
    const count = {};
    let cells = 0;
    for (const t of tubes) {
        if (t.length > CAP) fails.push(name + ': có ống chứa quá ' + CAP + ' phần');
        for (const c of t) { count[c] = (count[c] || 0) + 1; cells++; }
    }
    const colors = Object.keys(count).map(Number).sort((a, b) => a - b);
    for (const c of colors) {
        if (count[c] !== CAP) fails.push(name + ': màu ' + c + ' có ' + count[c] + ' phần, đáng lẽ ' + CAP);
    }
    for (let k = 0; k < colors.length; k++) {
        if (colors[k] !== k) { fails.push(name + ': số hiệu màu nhảy cóc, không liền từ 0'); break; }
    }
    if (colors.length > COLORS.length) fails.push(name + ': dùng ' + colors.length + ' màu, bảng màu chỉ có ' + COLORS.length);
    if (tubes.length - colors.length < 1) fails.push(name + ': không còn ống trống nào');
    if (cells !== colors.length * CAP) fails.push(name + ': tổng số phần nước không khớp');

    /* --- giải được không, và mốc ba sao có đạt nổi không --- */
    const sol = findSolution(tubes, 400000);
    if (!sol) {
        fails.push(name + ': KHÔNG GIẢI ĐƯỢC — màn này không được phép có mặt');
    } else {
        const within = solvableWithin(tubes, L.p, 400000);
        if (within === false) {
            fails.push(name + ': mốc ba sao ' + L.p + ' nước không ai đạt nổi (ngắn nhất tìm được là ' + sol.length + ')');
        }
    }

    /* --- máy mách nước có kịp trả lời không ---
     * Đo cả lúc mới vào màn lẫn lúc bé đã đi được nửa chừng: giữa ván thế cờ
     * rối hơn hẳn, mà đó mới đúng là lúc bé bấm xin mách nước. */
    const spots = [tubes];
    if (sol) {
        let s = tubes;
        for (let k = 0; k < Math.floor(sol.length / 2); k++) s = applyMove(s, sol[k]);
        spots.push(s);
    }
    for (const spot of spots) {
        const t0 = Date.now();
        findSolution(spot.map(x => x.slice()), 120000);
        const ms = Date.now() - t0;
        hintChecks++;
        if (ms > worstHint) { worstHint = ms; worstHintLevel = i + 1; }
    }

    blinds.push(blindRate(tubes, 40, rnd));
}

/* --- không có hai màn trùng nhau --- */
const seen = new Set();
for (let i = 0; i < LEVELS.length; i++) {
    const k = LEVELS[i].t.map(x => x.join(',')).sort().join('|');
    if (seen.has(k)) fails.push('màn ' + (i + 1) + ': trùng hệt một màn trước đó');
    seen.add(k);
}

/* --- đường khó có tăng dần không --- */
console.log('  đường khó theo từng thế giới (rô-bốt chơi bừa thắng bao nhiêu phần):');
const worldBlind = [];
for (let w = 0; w < WORLDS.length; w++) {
    const from = WORLDS[w].from;
    const to = (w + 1 < WORLDS.length ? WORLDS[w + 1].from : LEVELS.length) - 1;
    const part = blinds.slice(from, to + 1);
    const avg = part.reduce((a, b) => a + b, 0) / part.length;
    worldBlind.push(avg);
    const tubes = LEVELS[to].t.length;
    console.log('    ' + WORLDS[w].name.padEnd(16) + ' màn ' + (from + 1) + '–' + (to + 1) +
        '  chơi bừa thắng ' + (100 * avg).toFixed(0) + '%   (tới ' + tubes + ' ống)');
}
for (let w = 1; w < worldBlind.length - 1; w++) {
    if (worldBlind[w] > worldBlind[w - 1] + 0.02) {
        fails.push('thế giới ' + (w + 1) + ' lại DỄ hơn thế giới ' + w + ' — đường khó đi giật lùi');
    }
}

/* --- màn cho hai bé thi: phải có đủ để bốc, và phải ít ống --- */
const race = LEVELS.filter(L => L.t.length <= 9).length;
console.log('\n  màn hợp cho hai bé thi (≤ 9 ống): ' + race + '/' + LEVELS.length);
if (race < 10) fails.push('chỉ có ' + race + ' màn đủ nhỏ cho hai bé thi, ít quá');

console.log('  mách nước lâu nhất: ' + worstHint + 'ms (màn ' + worstHintLevel + ', đo ' + hintChecks + ' lần)');
/* Ngưỡng 250ms: bấm xong mà chờ lâu hơn thế thì bé tưởng nút hỏng, bấm loạn lên.
 * Máy của bé chậm hơn máy này chừng ba tới năm lần, nên chừa sẵn khoảng ấy. */
if (worstHint > 250) fails.push('mách nước mất tới ' + worstHint + 'ms, lâu quá — bé bấm xong ngồi chờ');

console.log('');
if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    for (const f of fails) console.log('  · ' + f);
    process.exit(1);
}
console.log('ĐẠT — ' + LEVELS.length + ' màn đều giải được bằng đúng luật trong game, mốc ba sao đều với tới,');
console.log('      đường khó tăng dần, và nút mách nước trả lời trong ' + worstHint + 'ms.');
