/**
 * Bounce Hoops — máy dò lời giải cho 24 màn
 * ----------------------------------------------------------------------------
 * Chạy:  node bounce-hoops/check-levels.js
 *
 * VÌ SAO CẦN CÁI NÀY
 * Nhìn màn hình thì không biết được một màn có giải nổi hay không. Sửa một bức
 * tường lệch nửa ô, hạ cái rổ xuống một ô — trông vẫn y như cũ, mà đường bóng
 * duy nhất đi lọt đã biến mất. Cả hai lần trước phải sửa lại màn đều là vì
 * chuyện đó, và lần nào cũng phải chơi tay hàng chục lần mới mò ra.
 *
 * Máy này ném thử vài nghìn cú mỗi màn — mọi hướng, mọi mức lực, và với màn có
 * khối trượt thì thử ở nhiều thời điểm khác nhau — rồi báo lại hai con số:
 *
 *   dải  góc ném liền mạch rộng nhất ở một mức lực. Đây mới là thứ ngón tay
 *        bé cảm được: bé kéo tay liên tục chứ không nhảy cóc từng độ một.
 *        Dải 2° nghĩa là chỉ đúng một hướng duy nhất mới vào — với bé thì
 *        coi như không giải được, dù trên giấy tờ vẫn là "giải được".
 *   %    tỉ lệ cú ném trúng trên tổng số cú thử, cho biết màn rộng cỡ nào.
 *
 * Ngưỡng đặt ở dải ≥ 8° và ≥ 0,4%: mấy màn đầu vốn dễ đo được 12–22°, mấy màn
 * cuối khó nhất cũng phải giữ được 8° thì tay bé mới với tới.
 *
 * Máy dò gọi thẳng hàm step() và crossedHoop() của game.js, không chép lại
 * công thức — chép tay là sớm muộn cũng lệch, mà lệch thì máy báo một đằng
 * game chạy một nẻo, còn tệ hơn là không có máy.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------------------------------------------------------------------------
 * 1. Bộ DOM giả
 * game.js là mã chạy trong trình duyệt, đụng vào canvas, localStorage, sự kiện
 * chuột. Ở đây dựng đủ mấy thứ đó để nó nạp được, còn phần vẽ thì cho chạy
 * không — máy dò chỉ cần phần vật lý.
 * -------------------------------------------------------------------------*/

function fakeEl() {
    const e = {
        textContent: '', innerHTML: '', hidden: false, style: {}, className: '',
        clientWidth: 0, clientHeight: 0, dataset: {},
        classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } },
        addEventListener() { }, removeEventListener() { }, appendChild() { },
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
    const box = {
        console, Math, Date, JSON, URLSearchParams,
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
            getElementById: fakeEl, createElement: fakeEl, addEventListener() { }
        }
    };
    box.window = box;
    vm.createContext(box);
    vm.runInContext(fs.readFileSync(file, 'utf8'), box, { filename: file });
    if (!box.bounceHoops) throw new Error('game.js không lộ ra window.bounceHoops');
    return box.bounceHoops;
}

const bh = loadGame();
const { G, LEVELS, step, crossedHoop, BALL_R, ROWS, STEP, MAX_POWER } = bh;

/* ---------------------------------------------------------------------------
 * 2. Ném thử một cú
 * Chép đúng vòng đời một lượt ném của stepBall(): trúng rổ, dính gai, rơi ra
 * ngoài sân, hay nằm im một chỗ.
 * -------------------------------------------------------------------------*/

const TTL = 10;          // ngắn hơn SHOT_TTL của game một chút cho nhanh
const STILL_D = 0.12;    // giống hằng số cùng tên trong game
const STILL_T = 0.7;

function shoot(t0, angle, power) {
    const p = G.level.ball;
    const b = {
        x: p[0], y: p[1] - 0.6,
        vx: Math.cos(angle) * power, vy: Math.sin(angle) * power, spin: 0, rot: 0
    };
    let t = t0, flown = 0, still = { x: b.x, y: b.y, t: 0 };

    while (flown < TTL) {
        const prevY = b.y;
        step(b, t, STEP);
        t += STEP;
        flown += STEP;

        if (crossedHoop(prevY, b, G.hoop)) return true;
        for (const s of G.spikes) {
            if (b.x > s.x - BALL_R && b.x < s.x + s.w + BALL_R &&
                b.y > s.y - BALL_R && b.y < s.y + s.h + BALL_R) return false;
        }
        if (b.y > ROWS + 3) return false;

        if (Math.hypot(b.x - still.x, b.y - still.y) > STILL_D) still = { x: b.x, y: b.y, t: flown };
        else if (flown - still.t > STILL_T) return false;
    }
    return false;
}

/* ---------------------------------------------------------------------------
 * 3. Quét một màn
 * -------------------------------------------------------------------------*/

const DEG = 2;                       // quét góc, mỗi 2 độ một cú
const POWERS = [];
for (let k = 0.3; k <= 1.0001; k += 0.1) POWERS.push(k * MAX_POWER);

/* Màn có khối trượt thì ném sớm hay muộn ra kết quả khác hẳn. Bé chờ được bao
 * lâu cũng được, nên màn nào cũng phải thử ở nhiều pha rồi lấy pha dễ nhất. */
function phasesOf(lv) {
    if (!lv.movers || !lv.movers.length) return [0];
    const per = Math.max(...lv.movers.map(m => m[5]));
    return [0, per / 6, per / 3, per / 2, (2 * per) / 3, (5 * per) / 6];
}

/* Chấm theo PHA DỄ NHẤT chứ không lấy trung bình mọi pha. Bé đứng chờ bao lâu
 * cũng được, nên cái đáng đo là "canh đúng lúc rồi thì cửa ném rộng bao nhiêu",
 * chứ không phải "ném đại vào lúc nào cũng trúng". Lấy trung bình thì màn có
 * khối trượt bị chia điểm cho số pha, hoá ra khắt khe hơn màn đứng yên một
 * cách vô lý. */
function scan(i) {
    bh.start(i + 1);
    const lv = LEVELS[i];
    const nA = Math.round(360 / DEG);
    let best = { win: 0, pct: 0, hits: 0 };

    for (const t0 of phasesOf(lv)) {
        let hits = 0, tries = 0, widest = 0;
        for (const pw of POWERS) {
            let run = 0;
            for (let k = 0; k < nA; k++) {
                tries++;
                if (shoot(t0, -Math.PI + k * DEG * Math.PI / 180, pw)) {
                    hits++;
                    if (++run > widest) widest = run;
                } else run = 0;
            }
        }
        const r = { win: widest * DEG, pct: (hits / tries) * 100, hits };
        if (r.win > best.win || (r.win === best.win && r.pct > best.pct)) best = r;
    }
    return best;
}

/* ---------------------------------------------------------------------------
 * 4. Chạy và báo cáo
 * -------------------------------------------------------------------------*/

const MIN_WIN = 8;       // dải góc hẹp nhất còn chấp nhận được, tính bằng độ
const MIN_PCT = 0.4;

console.log('Bounce Hoops — dò lời giải ' + LEVELS.length + ' màn\n');
console.log('  #  tên màn            dải       %   trúng');
console.log('  ' + '-'.repeat(46));

let bad = 0;
LEVELS.forEach((lv, i) => {
    const r = scan(i);
    const ok = r.win >= MIN_WIN && r.pct >= MIN_PCT;
    if (!ok) bad++;
    console.log(
        String(i + 1).padStart(3) + '. ' + lv.name.padEnd(16) +
        (r.win + '°').padStart(6) + r.pct.toFixed(2).padStart(8) + '%' +
        String(r.hits).padStart(8) + (ok ? '' : '   ← HẸP QUÁ'));
});

console.log('');
if (bad) {
    console.log(bad + ' màn quá hẹp so với ngưỡng (dải ≥ ' + MIN_WIN + '°, ≥ ' + MIN_PCT + '%).');
    process.exit(1);
}
console.log('Cả ' + LEVELS.length + ' màn đều giải được và đủ rộng tay.');
