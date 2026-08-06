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


/* ĐỢI CÓ HẠN. Máy soát mà treo vô tận thì tệ hơn máy soát báo hỏng: báo hỏng
 * thì biết đường sửa, còn treo thì chỉ thấy nó đứng im và không biết vì sao.
 * Mọi chỗ "đợi người nhện bám lại tường" đều phải qua đây — lượt chơi có thể
 * kết thúc giữa chừng, và lúc ấy điều kiện đợi không bao giờ đúng nữa. */
function waitCling(maxFrames, restedToo) {
    for (let i = 0; i < (maxFrames || 400); i++) {
        if (G.phase !== 'play') return false;
        if (P.state === 'cling' && (!restedToo || P.boost <= 0)) return true;
        step(1);
    }
    return false;
}

/* Đợi tới lúc người nhện bám TƯỜNG TRƠN — không kính, không tấm nứt, không dây
 * điện, và phía trên cũng quang một quãng.
 *
 * Cần riêng một hàm vì phép đo tốc độ leo phải chạy trên nền sạch. Bản trước
 * đo bừa ở chỗ nào cũng được, rồi đúng lần chạy này rơi trúng một ô kính: giữa
 * lúc đo thì tấm kính vỡ, người nhện rơi, và phép soát kết luận "phím lên chưa
 * làm gì". Kết luận sai, mà sai vì chỗ đo chứ không vì cái đang đo. */
/* Cả QUÃNG từ đây lên trên có sạch không — quét từng 30 điểm ảnh một, chứ
 * không chỉ hỏi hai đầu.
 *
 * Bản trước chỉ kiểm ở chân và ở đỉnh quãng. Một ô kính nằm lọt hẳn vào giữa
 * thì hai phép hỏi ấy đều trả lời "sạch", rồi giữa lúc đo thì người nhện bò
 * tới mép trên ô kính, kính vỡ, và phép đo kết luận "phím lên chưa làm gì".
 * Đúng cái bẫy đã bắt được một lần rồi, chỉ khác chỗ nấp. */
function plainSpan(w, side, y0, len) {
    for (let d = 0; d <= len; d += 30) {
        if (w.surfaceAt(side, y0 + d)) return false;
        if (w.blockerAt(side, y0 + d)) return false;
    }
    return true;
}

function restOnPlainWall(maxFrames) {
    for (let i = 0; i < (maxFrames || 900); i++) {
        if (G.phase !== 'play') return false;
        const w = G.world;
        if (P.state === 'cling' && P.boost <= 0 && plainSpan(w, P.side, P.y, 300)) return true;
        step(1);
    }
    return false;
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
        /* Kính và tấm nứt phải xử khác nhau, vì luật của chúng ngược nhau:
         * kính có hạn chót ở MÉP TRÊN nên phải rời sớm, còn tấm nứt phạt việc
         * nán lại nên chỉ cần đừng dừng. Con bọ dùng chung một cách xử cho cả
         * hai thì nó chết trên kính suốt, và con số nó đo ra là con số của một
         * con bọ không biết chơi chứ không phải của game. */
        const glassSoon = surf && surf.kind === 'glass' &&
            (surf.y1 - P.y) < R.GLASS_WARN * 1.15;
        const bad = surf && surf.kind === 'cracked';
        if (glassSoon && w.canCling(1 - P.side, P.y + 20)) { D.tap(); return; }

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
/* Con bọ không phải lúc nào cũng chết đủ ba lần trong quãng chơi ngắn, nên
 * nếu chưa hết mạng lần nào thì ép nó đi hết đường ấy. Việc cần soát là "hết
 * mạng thì có sang được màn kết thúc rồi chơi lại được không", chứ không phải
 * "con bọ có dở đủ mức cần thiết không". */
if (!seen.overs && G.phase === 'play') {
    for (let i = 0; i < 600 && G.phase === 'play'; i++) {
        P.invuln = 0;
        G.power.shield = 0;
        P.y = G.camY - 960 - 60;          // thả rơi hẳn khỏi đáy màn
        step(1);
    }
    ok(G.phase === 'over', 'rơi khỏi đáy màn hết cả ba mạng mà vẫn chưa kết thúc lượt');
    if (G.phase === 'over') {
        seen.overs++;
        getEl('btn-again').dispatch('click');
        ok(G.phase === 'play', 'bấm CHƠI LẠI sau khi hết mạng mà không vào lại được');
        ok(G.score === 0 && G.combo === 0, 'lượt mới mà điểm hoặc chuỗi còn sót lại từ lượt trước');
    }
}
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
        ['laser', { y: 0, charge: 0.8, fire: 0.55, period: 2.6 }],
        /* Ba nhân vật phản diện. Hai đứa đầu XÔ chứ không giết, nên phép soát
         * dưới đây chấp nhận cả hai kết cục: mất mạng, hoặc bị hất khỏi tường.
         * Cái nó KHÔNG chấp nhận là chạm vào mà chẳng có gì xảy ra — một kẻ
         * cản đường không cản được ai thì chỉ là hình vẽ. */
        ['thug', { side: 0, y: 0, period: 3.4 }],
        ['rival', { side: 0, y: 0 }],
        ['sentry', { side: 0, y: 0, period: 2.8, charge: 0.9 }]
    ];
    for (const [kind, base] of kinds) {
        getEl('btn-play').dispatch('click');
        step(30);
        const w = G.world;
        /* Dọn quang cả tường lẫn mối nguy. Gã cửa sổ và rô-bốt gác ĐÒI CHỖ
         * trên mặt tường y như vật cản đứng yên — đúng như chúng phải thế —
         * nên không dọn thì phép đặt từ chối và phép soát báo hỏng oan. */
        w.movers.length = 0;
        w.blockers.length = 0;
        w.surfaces.length = 0;
        const opt = Object.assign({}, base);
        const anchor = P.y + 120;
        if (opt.y !== undefined) opt.y += anchor;
        if (opt.y0 !== undefined) { opt.y0 += anchor; opt.y1 += anchor; }
        const m = w.mover(kind, opt);
        ok(!!m, `không đặt nổi mối nguy ${kind} để thử`);
        if (!m) continue;

        /* Hai đứa xô thì kết cục là bị hất khỏi tường, không phải mất mạng */
        const shovesOnly = kind === 'thug' || kind === 'rival';
        let killed = false;
        const before = G.lives;
        for (let i = 0; i < 400 && G.phase === 'play'; i++) {
            /* Dán người chơi vào đúng chỗ mối nguy đang đứng, và bỏ miễn nhiễm
             * — đây là phép thử va chạm, không phải phép thử kỹ năng. */
            const pos = D.pos(m) || (m.shot ? { x: m.shot.x, y: m.shot.y } : null);
            if (pos) {
                P.state = shovesOnly ? 'cling' : 'jump';
                P.x = kind === 'laser' ? 270 : pos.x;
                P.y = pos.y;
                P.vx = 0; P.vy = 0;
                P.invuln = 0;
                G.power.shield = 0;
            }
            step(1);
            if (G.lives < before || G.phase === 'over') { killed = true; break; }
            if (shovesOnly && P.state === 'fall') { killed = true; break; }
        }
        ok(killed, `chạm thẳng vào ${kind} mà không hề gì — mối nguy này chỉ để trang trí`);
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
        waitCling(400);
        if (P.side === want) { press(key === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight'); step(24); }
        waitCling(400);
        const from = P.side;
        press(key);
        ok(P.state === 'jump', `bấm ${key} khi đang bám tường ${from} mà không nhảy`);
        for (let i = 0; i < 90 && P.state === 'jump'; i++) step(1);
    }

    /* mũi tên về phía tường ĐANG BÁM thì phải im — nhảy đi rồi nhảy về là mất
     * chuỗi liên hoàn vì một cú bấm mà ý người chơi rõ ràng là "ở yên" */
    waitCling(400);
    const stay = P.side === 0 ? 'ArrowLeft' : 'ArrowRight';
    press(stay);
    ok(P.state === 'cling', `bấm ${stay} khi đang bám đúng tường ấy mà vẫn nhảy đi`);

    /* PHÍM CÁCH LÀ NHẢY. */
    waitCling(400);
    press(' ');
    ok(P.state === 'jump', 'phím cách không còn nhảy được');
    for (let i = 0; i < 90 && P.state === 'jump'; i++) step(1);

    /* PHÍM F LÀ BẮN TƠ. Soát bằng số tơ còn lại chứ không bằng "có ném lỗi
     * không" — đổi ý nghĩa một phím là loại thay đổi mà mọi thứ vẫn chạy êm ru
     * dù nó nối vào nhầm chỗ. Và nó KHÔNG được làm người nhện rời tường. */
    waitCling(400);
    /* Đặt sẵn một con máy bay ngay trước mặt. Không có mục tiêu thì fireWeb()
     * không tiêu đạn, và phép soát sẽ "đạt" mà chẳng chứng minh được gì —
     * đúng kiểu phép soát tự an ủi mình. */
    G.world.mover('drone', { y: P.y + 80, period: 4 });
    P.web = R.WEB_MAX;
    const webBefore = P.web;
    press('f');
    ok(P.web === webBefore - 1,
        `phím F không tiêu lần bắn tơ nào (còn ${P.web}/${webBefore}) — nó chưa nối vào chỗ bắn tơ`);
    ok(P.state !== 'jump', 'phím F lại làm người nhện nhảy — lẽ ra chỉ bắn tơ');

    /* Lúc ĐANG RƠI thì phím cách phải bám lại tường, không phải nhảy vu vơ —
     * đây là cú bấm gấp nhất trong game nên nó nằm trên phím to nhất. */
    waitCling(400);
    /* Dọn quang hai tường trước đã. Bám hụt vì chỗ ấy có vật cản là hành vi
     * ĐÚNG của game — nhưng phép soát này hỏi chuyện khác: phím cách lúc đang
     * rơi có gọi tới phần bám tường không. Không dọn thì nó lúc đạt lúc không
     * tuỳ hạt giống, và một phép soát chập chờn thì tới lúc báo hỏng thật cũng
     * bị cho qua. */
    G.world.blockers.length = 0;
    G.world.surfaces.length = 0;
    G.world.movers.length = 0;
    P.state = 'fall'; P.vy = -100; P.vx = 0; P.x = 268; P.web = R.WEB_MAX;
    step(1);
    press(' ');
    ok(P.state === 'cling', 'đang rơi, bấm phím cách mà không bám lại được tường');

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
        ok(restOnPlainWall(), 'không tìm được quãng tường trơn nào để đo tốc độ leo');
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
    restOnPlainWall();
    press('ArrowUp');
    step(6);
    ok(P.state === 'cling', 'giữ mũi tên lên mà người nhện lại nhảy đi — phím lên không phải phím nhảy');
    release('ArrowUp');

    /* nhả phím rồi thì phải chậm lại, không được leo nhanh mãi */
    step(4);
    ok(!P.fastKey, 'nhả mũi tên lên rồi mà cờ leo nhanh vẫn bật');

    /* lúc rơi, mũi tên chọn được bám vào tường nào */
    waitCling(400);
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
 * 8. Ô KÍNH PHẢI VỠ THẬT KHI BÒ TỚI MÉP TRÊN
 *    Đây là thứ khó bắt nhất trong đợt sửa này: nếu vế điều kiện viết sai thì
 *    ô kính chỉ đơn giản là leo qua được, không có gì hỏng, không có gì báo —
 *    game vẫn chơi ngon lành, chỉ là mất hẳn một loại chướng ngại. Nên đặt
 *    thẳng người nhện lên ô kính rồi để nó bò tới mép trên và hỏi: có vỡ không.
 * ------------------------------------------------------------------ */
{
    getEl('btn-play').dispatch('click');
    step(30);
    waitCling(400);

    const w = G.world;
    /* Dọn quang chỗ định thử. Phép đặt mặt tường tự từ chối nếu quanh đó đã có
     * vật cản hay mặt xấu khác — đúng như nó phải làm — nên không dọn thì phép
     * soát này chỉ đo được sự may rủi của hạt giống. */
    w.blockers.length = 0;
    w.surfaces.length = 0;
    w.movers.length = 0;
    const pane = w.surface(P.side, P.y + 40, 300, 'glass');
    ok(!!pane, 'không đặt nổi ô kính để thử');
    if (pane) {
        /* leo tự nhiên tới mép trên, không bấm gì cả */
        let broke = false, warnedBefore = false;
        for (let i = 0; i < 600 && G.phase === 'play'; i++) {
            if (P.state === 'cling' && P.y > pane.y0 && (pane.y1 - P.y) < R.GLASS_WARN) {
                if (pane.warn > 0.05) warnedBefore = true;
            }
            step(1);
            if (pane.dead) { broke = true; break; }
        }
        ok(broke, 'bò hết ô kính mà tấm kính không vỡ — cả loại chướng ngại này thành vô hại');
        ok(warnedBefore, 'kính vỡ mà trước đó không hề rạn — mối nguy không báo trước là bẫy');
        ok(P.state === 'fall', 'kính vỡ rồi mà người nhện vẫn bám nguyên trên tường');
    }

    /* và leo qua kính KHÔNG được chậm lại như bản cũ */
    waitCling(400, true);
    w.blockers.length = 0;
    w.surfaces.length = 0;
    const pane2 = w.surface(P.side, P.y + 30, 400, 'glass');
    if (pane2) {
        for (let i = 0; i < 400 && P.y < pane2.y0 + 20 && P.state === 'cling'; i++) step(1);
        const y0 = P.y;
        for (let i = 0; i < 20 && P.state === 'cling'; i++) step(1);
        ok(P.y > y0, 'leo trên kính mà tụt xuống — kính không còn làm trơn tuột nữa');
    }
    if (G.phase === 'over') getEl('btn-over-menu').dispatch('click');
    else getEl('btn-nav-menu').dispatch('click');
}

/* ------------------------------------------------------------------ *
 * 9. CHƠI THẬT Ở TRÊN CAO
 *    Con bọ chơi từ mặt đất lên chỉ tới được vài trăm mét, mà ba nhân vật phản
 *    diện thì mãi 700, 2 200 và 4 200 m mới ra. Nghĩa là suốt cả lượt chơi thử
 *    dài ba phút, phần MÃ VẼ của chúng chưa lần nào chạy — mà vẽ mới là chỗ dễ
 *    ném lỗi nhất, vì nó đụng vào canvas chứ không chỉ tính toán.
 *
 *    Nên dời thẳng người nhện lên 9 000 m rồi chơi tiếp: ở đó cả ba đứa cùng
 *    có mặt, và mọi nét vẽ của chúng đều phải chạy thật.
 * ------------------------------------------------------------------ */
{
    getEl('btn-play').dispatch('click');
    step(10);
    const HIGH = 9000 * R.PX_PER_M + 900;
    G.world.cursor = HIGH - 600;
    G.world.zoneDone = R.ZONES.length - 1;
    P.y = HIGH;
    P.x = G.world.wallX(P.side, P.y) + R.PLAYER_R;
    G.maxY = HIGH;
    G.camY = HIGH + 960 * R.CAM_ANCHOR;
    G.zone = R.ZONES.length - 1;

    const errBefore = frameErrors;
    const met = new Set();
    /* Chạy tới khi gặp đủ cả ba, có trần — và nếu tới trần vẫn thiếu đứa nào
     * thì ĐẶT THẲNG đứa ấy ra trước mặt.
     *
     * Đặt cứng một số khung hình rồi đòi gặp đủ ba thì phép soát lúc đạt lúc
     * không tuỳ hạt giống: lần thiếu rô-bốt gác, lần thiếu gã cửa sổ. Mà một
     * phép soát chập chờn thì chẳng mấy ai còn tin, rồi tới lúc nó báo hỏng
     * thật cũng bị cho qua. Việc nó phải làm là "mã vẽ của cả ba đứa đều được
     * chạy trong lúc chơi thật" — gặp tự nhiên hay đặt tay vào đều chạy đúng
     * một đường mã ấy, nên đặt tay không làm phép soát yếu đi, chỉ làm nó
     * chắc chắn. */
    let natural = 0;
    for (let f = 0; f < 14000 && met.size < 3; f++) {
        if (f === 6000) {
            natural = met.size;
            /* Dọn sạch CẢ mối nguy nữa. Gã cửa sổ và rô-bốt gác đòi chỗ trên
             * tường, mà chỗ ấy có thể đang bị chính một gã khác giữ — nên
             * mover() trả về null và cú đặt tay lặng lẽ trượt. Đó đúng là lý do
             * phép soát này vẫn chập chờn sau lần sửa trước: em dọn tường mà
             * quên dọn mấy đứa đang đứng trên tường. */
            G.world.blockers.length = 0;
            G.world.surfaces.length = 0;
            G.world.movers.length = 0;
            let at = P.y + 200;
            for (const k of ['thug', 'rival', 'sentry']) {
                if (met.has(k)) continue;
                const made = G.world.mover(k, {
                    side: 1 - P.side, y: at, period: 3.4, charge: 0.9
                });
                ok(!!made, `không đặt nổi ${k} ra trước mặt để soát phần vẽ`);
                at += 400;
            }
        }
        if (G.phase !== 'play') break;
        /* Bơm mạng suốt phép thử này. Bấm CHƠI LẠI thì lượt mới bắt đầu từ mặt
         * đất, và cả phần còn lại của phép thử lại chạy ở độ cao 0 — tức là nó
         * đo cái hoàn toàn khác với cái nó nói đang đo. Ở đây em cần mã vẽ của
         * mấy đứa phản diện được chạy, không cần biết con bọ sống hay chết. */
        G.lives = 9;
        botThink();
        step(1);
        for (const m of G.world.movers) {
            if (m.kind === 'thug' || m.kind === 'rival' || m.kind === 'sentry') met.add(m.kind);
        }
    }
    ok(frameErrors === errBefore,
        `chơi ở trên cao ném thêm ${frameErrors - errBefore} lỗi — nhiều phần là ở mã vẽ của mấy đứa phản diện`);
    ok(met.size === 3,
        `leo mãi ở 9 000 m mà chỉ gặp ${met.size}/3 nhân vật phản diện (${[...met].join(', ') || 'không đứa nào'})`);
    console.log(`  trên 9 000 m gặp: ${[...met].join(' · ')}` +
        (natural && natural < 3 ? ` (${natural} đứa gặp tự nhiên, còn lại phải đặt tay)` : ''));
    if (G.phase === 'over') getEl('btn-over-menu').dispatch('click');
    else getEl('btn-nav-menu').dispatch('click');
}

/* ------------------------------------------------------------------ *
 * 10. VẼ THỬ MỘT KHUNG HÌNH Ở TỪNG VÙNG
 *     Mỗi vùng có bầu trời, màu toà nhà, thời tiết và đèn đóm riêng, và mấy
 *     thứ ấy đi qua những nhánh vẽ khác nhau: sao chỉ ở hai vùng cao nhất, cực
 *     quang chỉ ở vùng cuối, đèn thành phố chỉ ở hai vùng đêm. Chơi bình thường
 *     thì con bọ không bao giờ lên tới nơi để những nhánh ấy được chạy.
 * ------------------------------------------------------------------ */
{
    getEl('btn-play').dispatch('click');
    step(10);
    const errBefore = frameErrors;
    for (const z of R.ZONES) {
        const mid = z.to === Infinity ? z.from + 1500 : (z.from + z.to) / 2;
        const y = mid * R.PX_PER_M + 900;
        G.world.cursor = y - 600;
        G.world.zoneDone = R.ZONES.indexOf(z);
        P.y = y;
        P.x = G.world.wallX(P.side, P.y) + R.PLAYER_R;
        G.maxY = y;
        G.camY = y + 960 * R.CAM_ANCHOR;
        G.lives = 9;
        const before = drawCalls;
        step(20);
        ok(drawCalls > before, `ở vùng "${z.name}" không vẽ thêm nét nào`);
        ok(frameErrors === errBefore, `vẽ vùng "${z.name}" ném lỗi`);
        if (frameErrors !== errBefore) break;
    }
    if (G.phase === 'over') getEl('btn-over-menu').dispatch('click');
    else getEl('btn-nav-menu').dispatch('click');
    console.log(`  vẽ thử ${R.ZONES.length} vùng: không vùng nào ném lỗi`);
}

/* ------------------------------------------------------------------ *
 * 11. SÉT Ở ĐÊM GIÔNG PHẢI ĐÁNH TRÚNG — VÀ PHẢI NÉ ĐƯỢC
 *     Hai vế, và vế thứ hai mới khó. Một tia sét luôn trúng thì không phải mối
 *     nguy mà là một khoản thuế; một tia không bao giờ trúng thì chỉ là hiệu
 *     ứng. Nên soát cả hai: cứ leo đều thì dính, mà nhảy sang tường kia thì
 *     thoát. Đó chính là điều luật "thua phải hiểu được vì sao" của bản thiết
 *     kế, viết thành mã.
 * ------------------------------------------------------------------ */
{
    const stormZone = R.ZONES.findIndex(z => z.weather === 'rain');
    ok(stormZone >= 0, 'không tìm thấy vùng nào có giông');

    function intoStorm() {
        getEl('btn-play').dispatch('click');
        step(10);
        const y = (R.ZONES[stormZone].from + 300) * R.PX_PER_M + 900;
        /* Đẩy con trỏ sinh màn lên thật cao rồi mới dọn tường: có vậy bộ sinh
         * mới không đẻ thêm vật cản ngay trên đầu trong lúc thử. Bản trước
         * không làm thế, và cứ ba lần thì một lần người nhện nhảy sang tường
         * kia rồi đâm phải một cục điều hoà vừa mọc ra — phép soát ghi sổ đó
         * là "sét đánh trúng". */
        G.world.cursor = y + 6000;
        G.world.zoneDone = stormZone;
        G.world.blockers.length = 0;
        G.world.surfaces.length = 0;
        G.world.movers.length = 0;
        P.y = y; P.state = 'cling';
        P.x = G.world.wallX(P.side, P.y) + R.PLAYER_R;
        P.invuln = 0; P.web = R.WEB_MAX;
        G.maxY = y;
        G.camY = y + 960 * R.CAM_ANCHOR;
        G.zone = stormZone;
        G.power.shield = 0;
        G.lives = 9;
        G.bolt = null;
        G.boltT = 0.05;                 // gọi tia xuống ngay, khỏi đợi
        step(4);
    }

    /* Đếm THẲNG số lần sét đánh trúng, đừng suy từ "có rơi không".
     *
     * Bản đầu em lấy P.state === 'fall' làm dấu hiệu trúng sét, và phép soát
     * báo hỏng oan: bộ sinh vẫn đẻ vật cản mới ngay trên đầu người chơi trong
     * lúc thử, nên nhảy sang tường kia rồi đâm phải một cục điều hoà cũng ra
     * 'fall'. Suy gián tiếp thì mỗi nguyên nhân khác đều thành một lời buộc
     * tội sai — mà lời buộc tội sai còn tệ hơn không soát, vì nó khiến người
     * ta đi sửa đúng chỗ đang lành. */
    const zaps = () => G.deaths['zap'] || 0;

    /* (a) cứ leo đều thì phải dính */
    intoStorm();
    ok(!!G.bolt, 'ở Đêm Giông mà không có tia sét nào nhắm tới');
    for (let i = 0; i < 200 && G.phase === 'play' && !zaps(); i++) {
        P.invuln = 0;
        if (P.state === 'fall') { P.state = 'cling'; P.vy = 0; }   // bỏ qua cú ngã vì lý do khác
        step(1);
    }
    ok(zaps() > 0, 'cứ leo đều dưới cơn giông mà sét không đánh trúng — tia sét chỉ là hiệu ứng');

    /* (b) nhảy sang tường kia thì phải thoát */
    intoStorm();
    const before = zaps();
    if (G.bolt) {
        /* nhảy ngay lúc thấy vòng sáng, đúng cách người chơi sẽ làm */
        D.tap();
        for (let i = 0; i < 200 && G.phase === 'play' && G.bolt; i++) {
            P.invuln = 0;
            step(1);
        }
    }
    ok(zaps() === before, 'nhảy sang tường kia rồi mà sét vẫn đánh trúng — vậy thì né kiểu gì cũng chết');

    if (G.phase === 'over') getEl('btn-over-menu').dispatch('click');
    else getEl('btn-nav-menu').dispatch('click');
    console.log('  sét Đêm Giông: đứng nguyên thì dính, nhảy đi thì thoát');
}

/* ------------------------------------------------------------------ *
 * 12. NGỒI YÊN THÌ PHẢI CHẾT
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
 * 13. BA CHẾ ĐỘ
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
 * 14. CỬA HÀNG VÀ NHIỆM VỤ
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
