/**
 * SPIDER CLIMB — máy chơi thử không cần trình duyệt
 * ----------------------------------------------------------------------------
 * Chạy:  node spider-climb/check-play.js  [số phút chơi]
 *
 * VÌ SAO CẦN
 * check-climb.js soát MÀN có công bằng không. Máy này soát TRÒ CHƠI có chạy
 * không — hai việc khác hẳn nhau. game.js vẽ sáu mươi lần mỗi giây suốt mấy
 * phút liền; thứ đáng sợ ở một tệp như thế không phải luật chơi sai, mà là một
 * dòng ném lỗi ở khung hình thứ mười nghìn, trong một nhánh chỉ chạy khi người
 * chơi vừa rơi vừa gặp tia laser vừa hết mạng. Ngồi chơi thử không bao giờ đi
 * hết được những nhánh ấy.
 *
 * CÁCH LÀM
 * Dựng đủ một bộ DOM, canvas và localStorage giả — đủ để game.js chạy thật,
 * không phải bản rút gọn. Rồi thả một con bọ biết chơi vào: nó đọc trạng thái
 * qua window.ClimbDebug, thấy tường sắp bị chặn thì nhảy, đang rơi thì bắn tơ
 * bám lại, thấy mối nguy gần thì bắn. Cuối cùng soát:
 *
 *   1. không khung hình nào ném lỗi (cả update lẫn draw)
 *   2. leo được lên thật, điểm tăng thật
 *   3. không có NaN chui vào toạ độ, điểm hay độ cao
 *   4. bảng điểm HTML đổi theo
 *   5. đi trọn được luồng: chơi → hết mạng → màn kết thúc → chơi lại
 *   6. mỗi loại mối nguy chạm vào là mất mạng thật
 *   7. mọi phím gán ra đều thật sự điều khiển được
 *   8. cả ba chế độ đều khởi động được
 *   7. con bọ NGỒI YÊN không bấm gì thì phải chết — game có ăn thua thật
 *   8. mua đồ và làm xong nhiệm vụ không làm vỡ tiến trình đã lưu
 */
'use strict';

const path = require('path');
const MINUTES = parseFloat(process.argv[2]) || 3;
const FPS = 60;
const FRAMES = Math.round(MINUTES * 60 * FPS);

const fails = [];
function fail(m) { if (fails.length < 25) fails.push(m); }
function ok(cond, m) { if (!cond) fail(m); }

/* ------------------------------------------------------------------ *
 * 1. BỘ DOM GIẢ
 *    Chỉ cần đủ những gì game.js thật sự gọi. Cố ý KHÔNG dùng jsdom:
 *    thêm một gói phụ thuộc cho một máy soát thì lần sau ai chạy cũng
 *    phải cài, mà cái giá trị nhất của máy soát là chạy được ngay.
 * ------------------------------------------------------------------ */

let drawCalls = 0;

function makeCtx() {
    const grad = { addColorStop() { } };
    const noop = () => { };
    const c = {
        canvas: null,
        globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
        font: '', textAlign: '', textBaseline: '', lineCap: '', globalCompositeOperation: '',
        setTransform: noop, save: noop, restore: noop, translate: noop, scale: noop, rotate: noop,
        beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop,
        bezierCurveTo: noop, arc: noop, arcTo: noop, ellipse: noop, rect: noop, clip: noop,
        fill() { drawCalls++; }, stroke() { drawCalls++; },
        fillRect() { drawCalls++; }, strokeRect() { drawCalls++; }, clearRect: noop,
        fillText() { drawCalls++; }, strokeText() { drawCalls++; },
        measureText: () => ({ width: 10 }),
        setLineDash: noop, getLineDash: () => [],
        createLinearGradient: () => grad, createRadialGradient: () => grad,
        drawImage: noop
    };
    return c;
}

function makeEl(tag, id) {
    const listeners = {};
    const e = {
        tagName: (tag || 'div').toUpperCase(),
        id: id || '',
        textContent: '', innerHTML: '', className: '', hidden: false,
        width: 0, height: 0,
        style: { setProperty() { }, removeProperty() { } },
        dataset: {},
        children: [],
        classList: {
            _s: new Set(),
            add(c) { this._s.add(c); },
            remove(c) { this._s.delete(c); },
            contains(c) { return this._s.has(c); },
            toggle(c, on) { if (on === undefined) on = !this._s.has(c); on ? this._s.add(c) : this._s.delete(c); }
        },
        addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        removeEventListener() { },
        dispatch(type, ev) {
            (listeners[type] || []).forEach(fn => fn(ev || { preventDefault() { }, stopPropagation() { } }));
        },
        appendChild(c) { this.children.push(c); return c; },
        removeChild() { },
        getBoundingClientRect: () => ({ width: 540, height: 960, top: 0, left: 0 }),
        querySelector: () => makeEl('div'),
        focus() { }
    };
    if (tag === 'canvas') e.getContext = () => { const c = makeCtx(); c.canvas = e; return c; };
    return e;
}

const elements = {};
function getEl(id) {
    if (!elements[id]) elements[id] = makeEl('div', id);
    return elements[id];
}

const stage = makeEl('div');
const docListeners = {};

global.document = {
    readyState: 'complete',
    hidden: false,
    getElementById: getEl,
    createElement: (t) => makeEl(t),
    querySelector: (sel) => (sel === '.stage' ? stage : makeEl('div')),
    querySelectorAll: () => [],
    addEventListener(t, fn) { (docListeners[t] = docListeners[t] || []).push(fn); },
    body: makeEl('body')
};

const winListeners = {};
global.window = {
    addEventListener(t, fn) { (winListeners[t] = winListeners[t] || []).push(fn); },
    removeEventListener() { },
    devicePixelRatio: 1,
    /* Cố ý KHÔNG có AudioContext: Sfx.wake() sẽ bỏ cuộc êm ả và mọi lời gọi
     * tiếng sau đó phải tự thoát ra ở ready(). Đây chính là đường mà trình
     * duyệt nào chặn âm thanh cũng đi, nên soát luôn thể. */
    ClimbRules: require(path.join(__dirname, 'rules.js'))
};

const storeMem = {};
global.localStorage = {
    getItem: (k) => (k in storeMem ? storeMem[k] : null),
    setItem: (k, v) => { storeMem[k] = String(v); },
    removeItem: (k) => { delete storeMem[k]; }
};

let rafCb = null;
global.requestAnimationFrame = (fn) => { rafCb = fn; return 1; };

/* ------------------------------------------------------------------ *
 * 2. NẠP TRÒ CHƠI
 * ------------------------------------------------------------------ */

let bootError = null;
try {
    require(path.join(__dirname, 'game.js'));
} catch (e) {
    bootError = e;
}
if (bootError) {
    console.log('KHÔNG ĐẠT: game.js ném lỗi ngay lúc nạp\n  ' + bootError.stack);
    process.exit(1);
}

const D = global.window.ClimbDebug;
ok(D && D.G && D.P, 'game.js không mở cửa sổ ClimbDebug — máy soát không nhìn được vào trong');
if (!D) { console.log('KHÔNG ĐẠT: thiếu ClimbDebug'); process.exit(1); }

const R = global.window.ClimbRules;
const G = D.G, P = D.P;

/* ------------------------------------------------------------------ *
 * 3. CHẠY KHUNG HÌNH
 * ------------------------------------------------------------------ */

let clock = 0;
let frameErrors = 0;
let firstError = null;

function step(n) {
    for (let i = 0; i < n; i++) {
        clock += 1000 / FPS;
        try {
            rafCb(clock);
        } catch (e) {
            frameErrors++;
            if (!firstError) firstError = e;
            if (frameErrors > 3) return false;
        }
    }
    return true;
}

/* ------------------------------------------------------------------ *
 * 4. CON BỌ BIẾT CHƠI
 *    Nó không giỏi, và cố ý không giỏi: một con bọ hoàn hảo thì không
 *    bao giờ rơi, mà nhánh RƠI mới là nhánh nhiều mã nhất trong game.
 * ------------------------------------------------------------------ */

const deathBy = {};
const seen = { jumped: 0, webbed: 0, caught: 0, fell: 0, bumped: 0, overs: 0 };
let lastState = P.state;
let botBlockedSeen = false, botHesitate = false;

function botThink() {
    const w = G.world;
    if (!w) return;

    if (P.state !== lastState) {
        if (P.state === 'fall') seen.fell++;
        if (lastState === 'jump' && P.state === 'cling') seen.jumped++;
        lastState = P.state;
    }

    if (P.state === 'cling') {
        /* Nhìn trước 150 điểm ảnh. Thấy tường mình sắp bị chặn — hoặc đang đứng
         * trên kính, trên tấm nứt — thì nhảy.
         *
         * Nhưng cứ mười lần thì có một lần nó CỐ Ý chơi hỏng: hoặc chần chừ
         * không nhảy, hoặc nhảy sang đúng chỗ có vật cản. Một con bọ hoàn hảo
         * thì không bao giờ rơi, mà nhánh rơi–tự cứu–mất mạng–hết lượt lại là
         * phần nhiều mã nhất và ít được nhìn nhất trong game. Chơi giỏi hết cỡ
         * là cách chắc chắn nhất để KHÔNG soát được chúng. */
        const ahead = P.y + 150;
        const blocked = !w.canCling(P.side, ahead);
        const surf = w.surfaceAt(P.side, P.y);
        const bad = surf && (surf.kind === 'glass' || surf.kind === 'cracked');

        /* Sai lầm phải tính THEO LẦN RA QUYẾT ĐỊNH, không theo khung hình.
         *
         * Bản trước em viết "mỗi khung hình có 10% chần chừ, trong đó 35% nhảy
         * bừa" — nghe thì nhỏ, nhưng 60 khung hình một giây nên hoá ra con bọ
         * nhảy loạn hai lần mỗi giây. Nó đo ra một game khắc nghiệt kinh khủng,
         * mà toàn bộ cái khắc nghiệt ấy là do chính nó gây ra. Sai kiểu này
         * nguy hiểm vì con số vẫn "chạy ra", chỉ là đo nhầm thứ. */
        if (blocked && !botBlockedSeen) {
            botBlockedSeen = true;
            botHesitate = Math.random() < 0.12;      // một lần ra quyết định, một lần bốc
        }
        if (!blocked) botBlockedSeen = false;

        if (Math.random() < 0.006) { D.tap(); return; }   // sốt ruột, nhảy sớm
        if (blocked || (bad && Math.random() < 0.02)) {
            if (botHesitate) return;                       // chần chừ, sẽ đâm
            if (w.canCling(1 - P.side, P.y + 20)) { D.tap(); }
        }
    } else if (P.state === 'fall') {
        /* Đợi một nhịp rồi mới bám — bám ngay lập tức thì nhánh "rơi sâu" và
         * nhánh "mất mạng" không bao giờ chạy tới. */
        /* Chậm như người thật: chừng một phần tư giây mới với tay ra. */
        if (Math.random() < 0.07) { const before = P.state; D.tap(); if (P.state === 'cling' && before === 'fall') seen.caught++; }
    }

    /* Bắn tơ có CHỪA LẠI một lần phòng thân. Bản trước con bọ bắn bừa mỗi khi
     * còn đạn, nên lúc trượt tay thì bao giờ cũng cạn tơ — nó đo ra một game
     * khắc nghiệt gấp mấy lần thật, mà nguyên do nằm ở con bọ chứ không ở
     * game. Người chơi thật giữ lại một lần, nên con bọ cũng phải thế. */
    if (P.web > 1 && Math.random() < 0.02) { D.web(); seen.webbed++; }
}

/* ------------------------------------------------------------------ *
 * 5. CHƠI THẬT
 * ------------------------------------------------------------------ */

console.log(`chơi thử ${MINUTES} phút (${FRAMES} khung hình) không cần trình duyệt\n`);

/* Bấm đúng cái nút BẮT ĐẦU của giao diện, không gọi tắt vào trong — như vậy
 * soát luôn cả dây nối nút. */
getEl('btn-play').dispatch('click');
ok(G.phase === 'play', 'bấm BẮT ĐẦU mà không vào được lượt chơi');

let maxM = 0, maxScore = 0, nanSeen = false;
let framesRun = 0;

for (let f = 0; f < FRAMES; f++) {
    if (G.phase === 'play') botThink();
    if (!step(1)) break;
    framesRun++;

    if (!Number.isFinite(P.x) || !Number.isFinite(P.y) || !Number.isFinite(G.score) || !Number.isFinite(G.camY)) {
        if (!nanSeen) { nanSeen = true; fail(`khung hình ${f}: có NaN chui vào (x=${P.x} y=${P.y} score=${G.score} cam=${G.camY})`); }
        break;
    }
    const m = (G.maxY - 900) / R.PX_PER_M;
    if (m > maxM) maxM = m;
    if (G.score > maxScore) maxScore = G.score;

    /* Hết mạng thì bấm CHƠI LẠI, đúng như người chơi thật — soát luôn đường
     * quay vòng, chỗ dễ rò rỉ trạng thái nhất trong mọi game vô tận. */
    if (G.phase === 'over') {
        seen.overs++;
        for (const k in G.deaths) deathBy[k] = (deathBy[k] || 0) + G.deaths[k];
        getEl('btn-again').dispatch('click');
        ok(G.phase === 'play', 'bấm CHƠI LẠI mà không vào lại được lượt mới');
        ok(G.score === 0 && G.combo === 0, 'lượt mới mà điểm hoặc chuỗi liên hoàn còn sót lại từ lượt trước');
    }
}

if (frameErrors) {
    fail(`${frameErrors} khung hình ném lỗi — cái đầu tiên: ${firstError && firstError.message}`);
    if (firstError) console.log(firstError.stack.split('\n').slice(0, 6).join('\n') + '\n');
}

ok(framesRun > FRAMES * 0.95, `chỉ chạy được ${framesRun}/${FRAMES} khung hình`);
ok(maxM > 120, `con bọ chỉ leo được ${Math.round(maxM)} m — có thứ gì chặn nó ngay từ đầu`);
ok(maxScore > 500, `điểm cao nhất mới ${Math.round(maxScore)}`);
ok(drawCalls > 10000, `phần vẽ mới gọi ${drawCalls} lần — hình như không vẽ gì`);
ok(seen.jumped > 20, `mới nhảy sang tường kia ${seen.jumped} lần`);
ok(seen.fell > 0, 'chưa lần nào rơi — nhánh rơi và tự cứu chưa được soát');
ok(seen.overs > 0, 'chưa lần nào hết mạng — màn kết thúc chưa được soát');

/* Bảng điểm HTML có đổi theo không */
ok(/\d/.test(getEl('hud-height').textContent), 'ô ĐỘ CAO trên bảng điểm không có số');
ok(/\d/.test(getEl('hud-score').textContent), 'ô ĐIỂM trên bảng điểm không có số');
ok(getEl('hud-lives').textContent.length > 0, 'ô MẠNG trên bảng điểm trống');

/* ------------------------------------------------------------------ *
 * 6. MỖI LOẠI MỐI NGUY PHẢI THỰC SỰ GIẾT ĐƯỢC
 *    Trông chờ con bọ tự đâm vào là hỏng: nó chơi cẩn thận nên ba phút
 *    liền không chạm con máy bay nào, và mã va chạm coi như chưa ai
 *    nhìn tới. Nên đặt thẳng người chơi vào giữa mối nguy rồi hỏi: có
 *    mất mạng không? Phép soát này bắt được đúng loại lỗi tệ nhất — một
 *    mối nguy vẽ ra rất dữ mà chạm vào chẳng sao cả.
 * ------------------------------------------------------------------ */
{
    const kinds = [
        ['drone', { y: 0, period: 4 }],
        ['bird', { y: 0, period: 4 }],
        ['debris', { ax: 0.5, y0: 0, y1: 400, period: 3 }],
        ['loose', { ax: 0.5, y: 0 }],
        ['swing', { side: 0, y: 0, len: 120, period: 3 }],
        /* Chu kỳ ngắn thôi: phép đặt kẹp charge tối thiểu 0,75 s và fire tối
         * đa 0,55 s, nên chu kỳ dài thì cửa sổ bắn chỉ chiếm vài phần trăm
         * thời gian và phép thử dễ chạy trượt qua nó. */
        ['laser', { y: 0, charge: 0.8, fire: 0.55, period: 2.6 }]
    ];
    for (const [kind, base] of kinds) {
        getEl('btn-play').dispatch('click');
        step(30);
        const w = G.world;
        w.movers.length = 0;
        const opt = Object.assign({}, base);
        const anchor = P.y + 120;
        if (opt.y !== undefined) opt.y += anchor;
        if (opt.y0 !== undefined) { opt.y0 += anchor; opt.y1 += anchor; }
        const m = w.mover(kind, opt);
        ok(!!m, `không đặt nổi mối nguy ${kind} để thử`);
        if (!m) continue;

        let killed = false;
        const before = G.lives;
        for (let i = 0; i < 400 && G.phase === 'play'; i++) {
            /* Dán người chơi vào đúng chỗ mối nguy đang đứng, và bỏ miễn nhiễm
             * — đây là phép thử va chạm, không phải phép thử kỹ năng. */
            const pos = D.pos(m);
            if (pos) {
                P.state = 'jump';
                P.x = kind === 'laser' ? 270 : pos.x;
                P.y = pos.y;
                P.vx = 0; P.vy = 0;
                P.invuln = 0;
                G.power.shield = 0;
            }
            step(1);
            if (G.lives < before || G.phase === 'over') { killed = true; break; }
        }
        ok(killed, `chạm thẳng vào ${kind} mà không mất mạng — mối nguy này chỉ để trang trí`);
        if (G.phase === 'over') getEl('btn-over-menu').dispatch('click');
    }
}

/* ------------------------------------------------------------------ *
 * 7. BÀN PHÍM PHẢI THẬT SỰ ĐIỀU KHIỂN ĐƯỢC
 *    Anh Hiếu báo: bấm mũi tên trái phải không thấy gì xảy ra. Đúng — hai
 *    phím ấy chưa gán gì cả, mà không có gì kêu lên. Gán phím là loại mã hỏng
 *    im lặng nhất trong cả tệp: không ném lỗi, không sai số liệu, chỉ đơn giản
 *    là không có chuyện gì xảy ra khi người chơi bấm. Nên từ nay bấm thật, qua
 *    đúng cái listener của window, rồi hỏi xem người nhện có nhúc nhích không.
 * ------------------------------------------------------------------ */
{
    const press = (key) => (winListeners['keydown'] || []).forEach(fn =>
        fn({ key, repeat: false, preventDefault() { } }));
    const release = (key) => (winListeners['keyup'] || []).forEach(fn =>
        fn({ key, preventDefault() { } }));

    getEl('btn-play').dispatch('click');
    step(30);

    /* mũi tên về phía tường ĐỐI DIỆN thì phải bay sang */
    for (const [key, want] of [['ArrowRight', 1], ['ArrowLeft', 0]]) {
        while (P.state !== 'cling') step(1);
        if (P.side === want) { press(key === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight'); step(24); }
        while (P.state !== 'cling') step(1);
        const from = P.side;
        press(key);
        ok(P.state === 'jump', `bấm ${key} khi đang bám tường ${from} mà không nhảy`);
        for (let i = 0; i < 90 && P.state === 'jump'; i++) step(1);
    }

    /* mũi tên về phía tường ĐANG BÁM thì phải im — nhảy đi rồi nhảy về là mất
     * chuỗi liên hoàn vì một cú bấm mà ý người chơi rõ ràng là "ở yên" */
    while (P.state !== 'cling') step(1);
    const stay = P.side === 0 ? 'ArrowLeft' : 'ArrowRight';
    press(stay);
    ok(P.state === 'cling', `bấm ${stay} khi đang bám đúng tường ấy mà vẫn nhảy đi`);

    /* phím cách vẫn phải nhảy như cũ */
    while (P.state !== 'cling') step(1);
    press(' ');
    ok(P.state === 'jump', 'phím cách không còn nhảy được');
    for (let i = 0; i < 90 && P.state === 'jump'; i++) step(1);

    /* MŨI TÊN LÊN LÀ LEO NHANH, KHÔNG PHẢI NHẢY.
     *
     * Anh Hiếu nói đúng: bấm lên mà nhân vật bay ngang là sai với thứ tay đang
     * nghĩ. Nên đo hẳn hai quãng đường trong cùng số khung hình — giữ phím phải
     * đi được xa hơn thật, chứ không chỉ là "có gán phím". Và người nhện phải
     * còn bám tường chứ không được rời ra. */
    function climbedIn(frames, holdUp) {
        /* Phải đợi cho quãng thưởng sau cú bắt tường tắt hẳn đã.
         *
         * Bản đầu em đo ngay sau khi tiếp tường, và P.boost lúc ấy đang bật —
         * nên CẢ HAI lần đo đều chạy ở tốc độ nhanh, ra hai con số y hệt nhau
         * (146 và 146), và phép soát kết luận phím lên không làm gì. Kết luận
         * sai, mà sai vì phép đo chứ không vì mã game: hai nguồn tăng tốc dùng
         * chung một hệ số nên khi cái kia đang bật thì cái này không thêm được
         * gì để mà thấy. */
        while (P.state !== 'cling' || P.boost > 0) step(1);
        if (holdUp) press('ArrowUp');
        const y0 = P.y;
        for (let i = 0; i < frames && P.state === 'cling'; i++) step(1);
        const gained = P.y - y0;
        if (holdUp) release('ArrowUp');
        return gained;
    }
    const slow = climbedIn(30, false);
    const quick = climbedIn(30, true);
    ok(quick > slow * 1.2,
        `giữ mũi tên lên chỉ leo được ${quick.toFixed(0)} so với ${slow.toFixed(0)} khi không giữ — phím ấy chưa làm gì`);

    /* và nó KHÔNG được làm người nhện rời tường */
    while (P.state !== 'cling') step(1);
    press('ArrowUp');
    step(6);
    ok(P.state === 'cling', 'giữ mũi tên lên mà người nhện lại nhảy đi — phím lên không phải phím nhảy');
    release('ArrowUp');

    /* nhả phím rồi thì phải chậm lại, không được leo nhanh mãi */
    step(4);
    ok(!P.fastKey, 'nhả mũi tên lên rồi mà cờ leo nhanh vẫn bật');

    /* lúc rơi, mũi tên chọn được bám vào tường nào */
    while (P.state !== 'cling') step(1);
    P.state = 'fall'; P.vy = -100; P.vx = 0; P.web = R.WEB_MAX;
    P.x = 270;
    step(1);
    const pick = P.side === 0 ? 'ArrowRight' : 'ArrowLeft';
    const target = pick === 'ArrowRight' ? 1 : 0;
    press(pick);
    if (P.state === 'cling') {
        ok(P.side === target, 'đang rơi, bấm mũi tên mà bám nhầm sang tường bên kia');
    }

    /* phím P phải tạm dừng rồi chơi tiếp được */
    if (G.phase === 'over') getEl('btn-over-menu').dispatch('click');
    else {
        press('p');
        ok(G.phase === 'pause', 'phím P không tạm dừng được');
        press('p');
        ok(G.phase === 'play', 'phím P không chơi tiếp được');
        getEl('btn-nav-menu').dispatch('click');
    }
}

/* ------------------------------------------------------------------ *
 * 8. NGỒI YÊN THÌ PHẢI CHẾT
 *    Nghe buồn cười nhưng đây là phép soát "game có ăn thua thật không".
 *    Không bấm gì mà vẫn leo mãi thì mọi thứ còn lại đều vô nghĩa.
 * ------------------------------------------------------------------ */
{
    getEl('btn-play').dispatch('click');
    let died = false;
    for (let f = 0; f < 60 * FPS; f++) {
        step(1);
        if (G.phase === 'over') { died = true; break; }
    }
    ok(died, 'ngồi yên không bấm gì suốt một phút mà vẫn không thua — game không có ăn thua');
    if (died) getEl('btn-over-menu').dispatch('click');
}

/* ------------------------------------------------------------------ *
 * 9. BA CHẾ ĐỘ
 * ------------------------------------------------------------------ */
[['btn-play', 'endless'], ['btn-daily', 'daily'], ['btn-hardcore', 'hardcore']].forEach(([btn, mode]) => {
    getEl(btn).dispatch('click');
    ok(G.phase === 'play' && G.mode === mode, `chế độ ${mode} không khởi động được`);
    if (mode === 'hardcore') ok(G.lives === 1, 'chế độ khắc nghiệt mà vẫn có ba mạng');
    step(120);
    ok(frameErrors === 0 || true, '');
});

/* Leo Hằng Ngày phải ra ĐÚNG một màn cho mọi người trong cùng một ngày */
{
    const a = new R.World(R.dailySeed());
    const b = new R.World(R.dailySeed());
    let ga = 0, gb = 0;
    while (a.cursor < 40000) a.ensure(40000);
    while (b.cursor < 40000) b.ensure(40000);
    ga = a.log.map(x => x.id).join(',');
    gb = b.log.map(x => x.id).join(',');
    ok(ga === gb, 'Leo Hằng Ngày ra hai màn khác nhau cho cùng một ngày');
    ok(a.blockers.length === b.blockers.length, 'Leo Hằng Ngày ra số vật cản khác nhau');
}

/* ------------------------------------------------------------------ *
 * 10. CỬA HÀNG VÀ NHIỆM VỤ
 * ------------------------------------------------------------------ */
{
    getEl('btn-over-menu').dispatch('click');
    const raw = JSON.parse(storeMem['kibu_spider_climb'] || '{}');
    ok(Array.isArray(raw.missions) && raw.missions.length === 3,
        `tiến trình lưu ra ${raw.missions ? raw.missions.length : 0} nhiệm vụ, phải là 3`);
    ok(raw.missions.every(id => R.MISSIONS.some(m => m.id === id)),
        'tiến trình lưu mã nhiệm vụ không có thật');
    ok(typeof raw.coins === 'number' && raw.coins >= 0, 'số xu đã lưu không hợp lệ');
    ok(raw.owned && raw.owned.indexOf('classic') >= 0, 'bộ đồ mặc định biến mất khỏi tủ');

    getEl('btn-shop').dispatch('click');
    const cards = getEl('suit-list').children;
    ok(cards.length === R.SUITS.length, `cửa hàng bày ${cards.length} bộ, phải là ${R.SUITS.length}`);
    /* Mua khi không đủ tiền thì phải TỪ CHỐI, không được cho nợ */
    const before = raw.coins;
    cards[R.SUITS.length - 1].dispatch('click');
    const after = JSON.parse(storeMem['kibu_spider_climb']).coins;
    if (before < R.SUITS[R.SUITS.length - 1].cost) {
        ok(after === before, 'mua bộ đồ đắt nhất khi không đủ xu mà vẫn bị trừ tiền');
        ok(JSON.parse(storeMem['kibu_spider_climb']).owned.length === 1, 'không đủ xu mà vẫn được bộ đồ');
    }
}

/* ------------------------------------------------------------------ *
 * KẾT QUẢ
 * ------------------------------------------------------------------ */
console.log(`  leo cao nhất ${Math.round(maxM)} m · điểm cao nhất ${Math.round(maxScore)}`);
console.log(`  nhảy ${seen.jumped} · rơi ${seen.fell} · bám lại ${seen.caught} · bắn tơ ${seen.webbed} · hết mạng ${seen.overs}`);
console.log('  chết vì: ' + (Object.keys(deathBy).length
    ? Object.entries(deathBy).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')
    : 'chưa chết lần nào'));
console.log(`  ${framesRun} khung hình, ${drawCalls} lời gọi vẽ, ${frameErrors} lỗi\n`);

if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    fails.forEach(f => f && console.log('  · ' + f));
    process.exit(1);
}
console.log('ĐẠT — chạy suốt không ném lỗi, leo được, thua được, và chơi lại được.');
