/**
 * FLIGHT ADVENTURE KIDS — máy soát chuyến bay
 * ----------------------------------------------------------------------------
 * Chạy:  node flight-adventure/check-flight.js
 *
 * MÁY NÀY TRẢ LỜI ĐÚNG MỘT CÂU, và cả trò chơi đứng lên trên câu ấy:
 *
 *     "Một đứa bé năm tuổi bấm loạn xạ thì có bay tới nơi và hạ cánh được
 *      không, hay có kiểu bấm nào làm nó kẹt lại giữa đường?"
 *
 * Không soát được câu này bằng cách ngồi chơi thử. Ngồi chơi thử thì mình chơi
 * như người biết chơi — giữ ga đều, kéo lên đúng lúc, nhìn thanh hành trình.
 * Đứa bé thì không. Nó giữ nút chúc mũi suốt ba phút để xem cái gì xảy ra. Nó
 * buông hết tay ra rồi đi lấy sữa. Nó bấm hai nút ngược nhau cùng lúc.
 *
 * Nên ở đây có BẢY CON BỌ, mỗi con dở một kiểu, và cả bảy đều phải tới được
 * Đà Nẵng. Con nào kẹt lại là một đứa bé thật sẽ kẹt lại.
 *
 * Dựng đủ một bộ DOM giả để game.js chạy thật — cố ý KHÔNG dùng jsdom, thêm
 * một gói phụ thuộc cho một máy soát thì lần sau ai chạy cũng phải cài, mà cái
 * giá trị nhất của máy soát là chạy được ngay.
 */
'use strict';

const path = require('path');

/* ------------------------------------------------------------------ *
 * 1. SÂN GIẢ
 * ------------------------------------------------------------------ */
let drawCalls = 0;

function makeCtx() {
    const grad = { addColorStop() { } };
    const noop = () => { };
    return {
        canvas: null,
        globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
        font: '', textAlign: '', textBaseline: '', lineCap: '', globalCompositeOperation: '',
        setTransform: noop, save: noop, restore: noop, translate: noop, scale: noop, rotate: noop,
        beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop,
        bezierCurveTo: noop, arc: noop, arcTo: noop, ellipse: noop, rect: noop, clip: noop,
        fill() { drawCalls++; }, stroke() { drawCalls++; },
        fillRect() { drawCalls++; }, strokeRect() { drawCalls++; }, clearRect: noop,
        fillText() { drawCalls++; }, strokeText() { drawCalls++; },
        measureText: () => ({ width: 60 }),
        setLineDash: noop, getLineDash: () => [],
        createLinearGradient: () => grad, createRadialGradient: () => grad,
        drawImage: noop
    };
}

function makeEl(tag, id) {
    const listeners = {};
    const e = {
        tagName: (tag || 'div').toUpperCase(),
        id: id || '',
        textContent: '', innerHTML: '', className: '', hidden: false, title: '',
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
        getBoundingClientRect: () => ({ width: 960, height: 600, top: 0, left: 0 }),
        getAttribute() { return null; },
        focus() { }, blur() { }
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

global.document = {
    readyState: 'complete',
    hidden: false,
    documentElement: { getAttribute: () => 'en' },
    getElementById: getEl,
    createElement: (t) => makeEl(t),
    querySelector: (sel) => (sel === '.stage' ? stage : makeEl('div')),
    querySelectorAll: () => [],
    addEventListener() { },
    body: makeEl('body'),
    activeElement: null
};

const winListeners = {};
global.window = {
    addEventListener(t, fn) { (winListeners[t] = winListeners[t] || []).push(fn); },
    removeEventListener() { },
    devicePixelRatio: 1,
    /* Cố ý KHÔNG có AudioContext: Sfx.wake() bỏ cuộc êm ả và mọi lời gọi tiếng
     * sau đó phải tự thoát ra ở ready(). Đây chính là đường mà trình duyệt nào
     * chặn âm thanh cũng đi, nên soát luôn thể. */
    FlightRules: require(path.join(__dirname, 'rules.js'))
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

const D = global.window.FlightDebug;
const R = global.window.FlightRules;

const fails = [];
function ok(cond, msg) { if (!cond) fails.push(msg); return !!cond; }
function fail(msg) { fails.push(msg); }

if (!ok(D && D.G && D.P, 'game.js không mở cửa sổ FlightDebug — máy soát không nhìn được vào trong')) {
    console.log('KHÔNG ĐẠT:\n  · ' + fails.join('\n  · '));
    process.exit(1);
}

const G = D.G, P = D.P;
const FPS = 60, DT = 1 / FPS;

let frameErrors = 0, firstError = null;
function step(n) {
    for (let i = 0; i < (n || 1); i++) {
        try {
            /* Đúng thứ tự mà frame() thật chạy: ga đổi theo nút đang giữ,
             * rồi mới cập nhật. Chép lại một dòng ấy ở đây là cố ý — máy soát
             * phải đi đúng con đường người chơi đi, không phải một con đường
             * tắt riêng của nó. */
            const d = (P.thrUp ? 1 : 0) - (P.thrDn ? 1 : 0);
            if (d && !G.auto) P.throttle = R.clamp(P.throttle + d * DT * 0.85, 0, 1);
            D.update(DT);
            D.draw();
        } catch (e) {
            frameErrors++;
            if (!firstError) firstError = e;
            return false;
        }
    }
    return true;
}

console.log('soát tuyến ' + R.ROUTES.length + ' — mỗi tuyến bảy kiểu bé bấm\n');

/* ------------------------------------------------------------------ *
 * 3. DỮ LIỆU TUYẾN CÓ HỢP LỆ KHÔNG
 *
 *    Soát trước khi bay: dữ liệu sai thì con bọ nào cũng chết, mà lời báo
 *    lỗi sẽ nói về chuyện bay chứ không nói về chuyện dữ liệu.
 * ------------------------------------------------------------------ */
for (const rt of R.ROUTES) {
    const tag = rt.id;
    ok(rt.segments.length >= 3, `${tag}: mới có ${rt.segments.length} đoạn — chuyến bay sẽ đơn điệu`);
    ok(rt.segments[rt.segments.length - 1].to === rt.len,
        `${tag}: đoạn cuối kết thúc ở ${rt.segments[rt.segments.length - 1].to} mà tuyến dài ${rt.len}`);
    let prev = 0;
    for (const s of rt.segments) {
        ok(s.to > prev, `${tag}: đoạn "${s.kind}" kết thúc ở ${s.to}, không sau đoạn trước`);
        prev = s.to;
    }
    ok(rt.landmarks.length >= 3, `${tag}: mới có ${rt.landmarks.length} thắng cảnh`);

    const arr = R.arriveRunway(rt), dep = R.departRunway(rt);
    /* HAI ĐẦU ĐƯỜNG BĂNG PHẢI PHẲNG. Đường băng đặt trúng sườn núi thì máy
     * bay chạm đất trước khi tới nơi, và không có kiểu bấm nào cứu được. */
    for (const rw of [dep, arr]) {
        let lo = Infinity, hi = -Infinity;
        for (let x = rw.x0; x <= rw.x1; x += 50) {
            const g = R.groundAt(rt, x);
            lo = Math.min(lo, g); hi = Math.max(hi, g);
        }
        ok(hi - lo < 40, `${tag}: đường băng ${rw.x0}–${rw.x1} chênh ${Math.round(hi - lo)} m, không đủ phẳng`);
    }

    /* Thắng cảnh phải rải đều, không dồn cục — bản mô tả đòi "the flight
     * should never feel empty for too long". */
    const lms = rt.landmarks.slice().sort((a, b) => a.at - b.at);
    ok(lms[0].at < rt.len * 0.25, `${tag}: thắng cảnh đầu tiên mãi ở ${lms[0].at} m, đầu chuyến trống trải`);
    for (let i = 1; i < lms.length; i++) {
        const gap = lms[i].at - lms[i - 1].at;
        ok(gap < rt.len * 0.42,
            `${tag}: giữa "${lms[i - 1].en}" và "${lms[i].en}" trống ${Math.round(gap)} m — quãng ấy chẳng có gì để nhìn`);
    }

    /* Đường trượt hạ cánh phải LUÔN Ở TRÊN mặt đất. Cắm xuyên qua một quả đồi
     * thì vệt sáng dẫn bé đâm thẳng vào sườn núi, mà bé thì tin vệt sáng. */
    let worst = Infinity, worstX = 0;
    for (let x = rt.landStart; x <= rt.len; x += 60) {
        const clear = R.glideAlt(rt, x) - R.groundAt(rt, x);
        if (clear < worst) { worst = clear; worstX = x; }
    }
    ok(worst > -3, `${tag}: đường trượt hạ cánh chui xuống dưới mặt đất ${Math.round(-worst)} m ở quãng ${worstX}`);

    /* Vòng mây và sao phải VỚI TỚI ĐƯỢC: trong tầm cao, trên mặt đất, và
     * nằm trong dải ngang mà trò chơi cho phép bay. Cái thứ ba là cái mới,
     * và là cái dễ sai nhất — đặt một vòng ở 3 000 m lệch sang bên trong khi
     * trò chơi kéo về ở 2 600 thì nó treo đó cả đời, nhìn thấy mà không bao
     * giờ chạm được. Không có gì làm hỏng một trò chơi cho trẻ con nhanh hơn
     * một phần thưởng cố tình bày ra ngoài tầm với. */
    let ringsBad = 0, starsBad = 0;
    for (let i = 0; i < R.ringCount(rt); i++) {
        const o = R.ringAt(rt, i);
        if (!o) continue;
        if (o.alt > R.ALT_MAX - 60 || o.alt < R.floorAt(rt, o.x)) ringsBad++;
        else if (Math.abs(o.z) > R.LAT_MAX - R.RING_R) ringsBad++;
    }
    for (let i = 0; i < R.starCount(rt); i++) {
        const o = R.starAt(rt, i);
        if (!o) continue;
        if (Math.abs(o.z) > R.LAT_MAX - R.STAR_PICK) starsBad++;
    }
    ok(ringsBad === 0, `${tag}: ${ringsBad} vòng mây nằm ngoài tầm với`);
    ok(starsBad === 0, `${tag}: ${starsBad} ngôi sao nằm ngoài tầm với`);
}

/* ------------------------------------------------------------------ *
 * 4. SÁU CON BỌ
 *
 *    Mỗi con là một kiểu bé thật. Không con nào "chơi giỏi" cả — chơi giỏi
 *    thì soát được đúng một đường, mà đường ấy là đường duy nhất chắc chắn
 *    chạy được.
 * ------------------------------------------------------------------ */
const BOTS = [
    {
        id: 'ngoan',
        what: 'bé ngoan: giữ ga, kéo lên lúc cần, nghe lời nhắc',
        think(t) {
            P.thrUp = P.throttle < (G.leg === 'approach' || G.leg === 'final' ? 0.22 : 0.62) ? 1 : 0;
            P.thrDn = P.throttle > (G.leg === 'approach' || G.leg === 'final' ? 0.3 : 0.72) ? 1 : 0;
            if (G.leg === 'ready' || G.leg === 'roll') {
                D.setPitch(P.spd >= R.ROTATE_SPD ? 1 : 0);
            } else if (G.leg === 'approach' || G.leg === 'final') {
                const want = R.glideAlt(G.route, P.x);
                D.setPitch(R.clamp((want - P.alt) / 200, -1, 1));
            } else {
                const want = R.groundAt(G.route, P.x) + 1000;
                D.setPitch(R.clamp((want - P.alt) / 260, -1, 1));
            }
        }
    },
    {
        id: 'buong-tay',
        what: 'bé buông hết tay ra sau khi cất cánh rồi đi lấy sữa',
        think(t) {
            if (G.leg === 'ready' || G.leg === 'roll') {
                P.thrUp = 1;
                D.setPitch(P.spd >= R.ROTATE_SPD ? 1 : 0);
                return;
            }
            /* buông sạch: không ga, không cần lái, không bấm gì nữa */
            P.thrUp = 0; P.thrDn = 0;
            D.setPitch(0);
        }
    },
    {
        id: 'chuc-mui',
        what: 'bé giữ nút chúc mũi suốt cả chuyến để xem cái gì xảy ra',
        think(t) {
            P.thrUp = 1;
            D.setPitch(G.leg === 'ready' || G.leg === 'roll'
                ? (P.spd >= R.ROTATE_SPD ? 1 : 0) : -1);
        }
    },
    {
        id: 'keo-het-len',
        what: 'bé kéo hết cần lên và giữ nguyên, muốn bay lên tận trời',
        think(t) {
            P.thrUp = 1;
            D.setPitch(1);
        }
    },
    {
        id: 'bam-loan',
        what: 'bé bấm loạn xạ, đổi nút mấy lần một giây',
        think(t) {
            const r = R.hash(Math.floor(t * 3), 7);
            P.thrUp = r > 0.5 ? 1 : 0;
            P.thrDn = r < 0.18 ? 1 : 0;
            D.setPitch(r > 0.66 ? 1 : (r < 0.33 ? -1 : 0));
        }
    },
    {
        id: 'be-lai-mai',
        what: 'bé giữ nút bẻ trái suốt chuyến, muốn xem bay ra khỏi bản đồ thì sao',
        think(t) {
            P.thrUp = 1;
            D.setTurn(-1);
            D.setPitch(G.leg === 'ready' || G.leg === 'roll'
                ? (P.spd >= R.ROTATE_SPD ? 1 : 0) : 0);
        }
    },
    {
        id: 'nut-phep',
        what: 'bé bấm nút phép rồi ngồi xem, chỉ thỉnh thoảng chụp ảnh',
        think(t) {
            if (!G.auto) getEl('btn-auto').dispatch('click');
            if (G.photoHint) D.photo();
        }
    }
];

const MAX_SECS = 600;                    // trần: mười phút thật là quá thừa
const report = [];

for (const rt of R.ROUTES) {
    for (const bot of BOTS) {
        for (const k in storeMem) delete storeMem[k];
        D.store.data.flights = 0;
        D.store.data.stamps = {};
        D.store.data.photos = {};
        D.store.data.best = {};

        D.start(rt.id);
        P.thrUp = 0; P.thrDn = 0;
        bot._h = 0; bot._leg = '';
        let t = 0, landed = false, stuck = 0, lastX = -1, maxZ = 0;
        const legsSeen = {};

        for (let f = 0; f < MAX_SECS * FPS; f++) {
            bot.think(t);
            if (!step(1)) break;
            t += DT;
            legsSeen[G.leg] = 1;

            if (!Number.isFinite(P.x) || !Number.isFinite(P.alt) ||
                !Number.isFinite(P.spd) || !Number.isFinite(P.z)) {
                fail(`${rt.id}/${bot.id}: có NaN chui vào (x=${P.x} alt=${P.alt} spd=${P.spd} z=${P.z})`);
                break;
            }
            /* KHÔNG ĐƯỢC BAY MẤT HÚT SANG BÊN. Bản mô tả hứa trò chơi sẽ nhẹ
             * nhàng đưa về; hứa mà không giữ thì bé giữ nút bẻ trái ba mươi
             * giây là mặt đất trống trơn và không còn gì để nhìn nữa. */
            if (Math.abs(P.z) > R.LAT_MAX + 260) {
                fail(`${rt.id}/${bot.id}: bay lệch ${Math.round(Math.abs(P.z))} m khỏi trục tuyến, quá xa hơn mức trò chơi hứa kéo về (${R.LAT_MAX})`);
                break;
            }
            if (Math.abs(P.z) > maxZ) maxZ = Math.abs(P.z);
            /* Mặt đất là SÀN, không phải thứ đi xuyên qua được. */
            if (P.alt < R.groundAt(G.route, P.x) - 4) {
                fail(`${rt.id}/${bot.id}: máy bay chui xuống dưới mặt đất ${Math.round(R.groundAt(G.route, P.x) - P.alt)} m ở quãng ${Math.round(P.x)}`);
                break;
            }
            /* Đứng yên một chỗ quá lâu = kẹt. Trừ lúc còn đang chờ trên đường
             * băng, vì lúc ấy đứng yên là đúng. */
            if (G.leg !== 'ready') {
                if (Math.abs(P.x - lastX) < 0.2) stuck++; else stuck = 0;
                if (stuck > FPS * 12) {
                    fail(`${rt.id}/${bot.id}: kẹt tại chỗ ${Math.round(P.x)} m suốt 12 giây ở chặng "${G.leg}"`);
                    break;
                }
            }
            lastX = P.x;

            /* NHẬT KÝ MỘT CON BỌ:  FDBG=ngoan node check-flight.js
             *
             * Máy soát chỉ nói được "con này không hạ cánh nổi". Muốn biết VÌ
             * SAO thì phải nhìn nó bay. Cả bốn lỗi nặng của bản đầu đều tìm ra
             * bằng đúng mấy dòng này, và lỗi nào cũng lộ ra ở một chỗ mà lời
             * báo lỗi không hề trỏ tới. */
            if (process.env.FDBG === bot.id) {
                if (G.helped && !bot._h) {
                    bot._h = 1;
                    console.log(`   [đỡ tay] ${Math.round(t)}s chặng=${G.leg} x=${Math.round(P.x)}` +
                        ` alt=${Math.round(P.alt)} đất=${Math.round(R.groundAt(G.route, P.x))}` +
                        ` sàn=${Math.round(R.floorAt(G.route, P.x))} · "${G.msg}"`);
                }
                if (G.leg !== bot._leg) {
                    console.log(`   [${bot.id}] ${Math.round(t)}s ${G.leg} x=${Math.round(P.x)}` +
                        ` alt=${Math.round(P.alt)} vệt=${Math.round(R.glideAlt(G.route, P.x))}` +
                        ` tốc=${Math.round(P.spd)} đỡtay=${G.helped} lượnlại=${G.circled}`);
                    bot._leg = G.leg;
                }
            }
            if (G.phase === 'done') { landed = true; break; }
        }

        if (frameErrors) {
            fail(`${rt.id}/${bot.id}: ${frameErrors} khung hình ném lỗi — cái đầu: ${firstError && firstError.message}`);
            if (firstError) console.log(firstError.stack.split('\n').slice(0, 5).join('\n') + '\n');
            frameErrors = 0; firstError = null;
        }

        ok(landed, `${rt.id}/${bot.id} (${bot.what}) — KHÔNG hạ cánh nổi trong ${MAX_SECS} giây, dừng ở chặng "${G.leg}" quãng ${Math.round(P.x)}/${rt.len} m`);

        if (landed) {
            /* Hạ cánh xong thì phải có con dấu và phải sang được màn kết quả.
             * Bay tới nơi mà không được thưởng gì thì chuyến đi hụt mất cái
             * kết — mà cái kết mới là thứ khiến bé muốn bay chuyến nữa. */
            ok(D.store.data.stamps[rt.toAirport.code] > 0,
                `${rt.id}/${bot.id}: hạ cánh rồi mà không có con dấu ${rt.toAirport.code}`);
            ok(['great', 'nice', 'assisted'].indexOf(G.rating) >= 0,
                `${rt.id}/${bot.id}: hạng hạ cánh là "${G.rating}", không nằm trong ba hạng đã khai`);
            ok(getEl('done-overlay').classList.contains('hidden') === false,
                `${rt.id}/${bot.id}: hạ cánh xong mà màn kết quả không hiện ra`);
            /* Hạ cánh xong phải ở gần trục đường băng. Chạm đất cách tim
             * đường băng một cây số thì đấy là chạm xuống ruộng, không phải
             * hạ cánh — mà mã vẫn vui vẻ ghi là hạ cánh. */
            ok(Math.abs(P.z) < 120,
                `${rt.id}/${bot.id}: chạm đất lệch ${Math.round(Math.abs(P.z))} m khỏi tim đường băng`);
            report.push({
                bot: bot.id, secs: t, rating: G.rating, circled: G.circled,
                stars: G.stars, rings: G.rings, shots: G.shots.length,
                legs: Object.keys(legsSeen).length, maxZ: maxZ
            });
        }
        D.backToMenu();
    }
}

/* ------------------------------------------------------------------ *
 * 5. BÉ NGOAN PHẢI ĐƯỢC HẠNG TỐT
 *
 *    "Không bao giờ thua" mà thành "làm gì cũng như nhau" thì hỏng mất phần
 *    thưởng: bé chịu khó lượn theo vệt sáng phải được nhiều hơn bé ngồi xem.
 * ------------------------------------------------------------------ */
{
    const good = report.find(r => r.bot === 'ngoan');
    const lazy = report.find(r => r.bot === 'nut-phep');
    if (good) {
        ok(good.rating !== 'assisted',
            `bé ngoan bay đúng cách mà vẫn chỉ được hạng "có giúp" — phần thưởng không phân biệt được ai chịu khó`);
        ok(good.circled === 0, `bé ngoan mà vẫn phải lượn lại ${good.circled} vòng — đường trượt chưa đủ dễ theo`);
    }
    if (lazy) ok(lazy.rating === 'assisted', `bé bấm nút phép mà được hạng "${lazy.rating}" — nút phép phải ghi là có giúp`);
}

/* ------------------------------------------------------------------ *
 * 6. CHỤP ẢNH CÓ CHẠY KHÔNG
 *
 *    Bay ngang từng thắng cảnh rồi bấm máy — cả năm cái phải chụp được. Một
 *    cái không chụp được là một trang an-bum không bao giờ đầy, mà an-bum
 *    đầy chính là lý do bé quay lại bay chuyến nữa.
 * ------------------------------------------------------------------ */
{
    const rt = R.ROUTES[0];
    D.start(rt.id);
    G.auto = true;
    let got = 0;
    for (let f = 0; f < MAX_SECS * FPS; f++) {
        if (!step(1)) break;
        if (G.photoHint) { D.photo(); got++; }
        if (G.phase === 'done') break;
    }
    ok(got === rt.landmarks.length,
        `bay hết tuyến mà chỉ chụp được ${got}/${rt.landmarks.length} thắng cảnh — có cái không bao giờ vào tầm máy ảnh`);
    ok(G.shots.length === rt.landmarks.length,
        `chụp ${got} lần mà chỉ ${G.shots.length} tấm vào sổ`);
    console.log(`  chụp ảnh: ${got}/${rt.landmarks.length} thắng cảnh vào được an-bum`);
    D.backToMenu();
}

/* ------------------------------------------------------------------ *
 * 6b. VÒNG MÂY CÓ CHUI QUA ĐƯỢC KHÔNG
 *
 *    Sang phối cảnh thì vòng mây nằm rải cả sang hai bên, nên muốn xuyên qua
 *    là phải BẺ LÁI — đó chính là lý do có chiều thứ ba. Nhưng "phải bẻ lái"
 *    và "bẻ lái tới nơi kịp" là hai chuyện: vòng đặt lệch quá hoặc cách nhau
 *    quá gần thì dù lái đúng vẫn không tới. Con bọ này lái thẳng tới vòng gần
 *    nhất và đếm xem qua được mấy cái.
 * ------------------------------------------------------------------ */
{
    const rt = R.ROUTES[0];
    D.start(rt.id);
    let got = 0; const near = {}, nearS = {};
    for (let f = 0; f < MAX_SECS * FPS; f++) {
        P.thrUp = P.throttle < 0.55 ? 1 : 0;
        P.thrDn = P.throttle > 0.72 ? 1 : 0;
        if (G.leg === 'ready' || G.leg === 'roll') {
            D.setPitch(P.spd >= R.ROTATE_SPD ? 1 : 0);
        } else {
            /* nhắm vòng chưa lấy gần nhất còn ở phía trước */
            let tgt = null;
            for (let i = 0; i < R.ringCount(rt); i++) {
                if (G.ringDone[i]) continue;
                const o = R.ringAt(rt, i);
                if (!o || o.x < P.x + 120) continue;
                tgt = o; break;
            }
            if (tgt && G.leg !== 'approach' && G.leg !== 'final') {
                D.setPitch(R.clamp((tgt.alt - P.alt) / 220, -1, 1));
                D.setTurn(R.clamp((tgt.z - P.z) / 300, -1, 1));
            } else {
                D.setTurn(R.clamp(-P.z / 400, -1, 1));
                const want = G.leg === 'approach' || G.leg === 'final'
                    ? R.glideAlt(G.route, P.x) : R.groundAt(G.route, P.x) + 1000;
                D.setPitch(R.clamp((want - P.alt) / 220, -1, 1));
            }
        }
        if (!step(1)) break;
        if (process.env.RINGDBG) {
            for (let i = 0; i < R.ringCount(rt); i++) {
                if (G.ringDone[i]) continue;
                const o = R.ringAt(rt, i);
                if (!o) continue;
                const d = Math.hypot(o.x - P.x, o.alt - P.alt, o.z - P.z);
                near[i] = Math.min(near[i] == null ? 1e9 : near[i], d);
            }
            for (let i = 0; i < R.starCount(rt); i++) {
                if (G.starDone[i]) continue;
                const o = R.starAt(rt, i);
                if (!o) continue;
                const d = Math.hypot(o.x - P.x, o.alt - P.alt, o.z - P.z);
                nearS[i] = Math.min(nearS[i] == null ? 1e9 : nearS[i], d);
            }
        }
        if (G.phase === 'done') break;
    }
    if (process.env.RINGDBG) {
        for (let i = 0; i < R.ringCount(rt); i++) {
            const o = R.ringAt(rt, i);
            if (!o) { console.log(`   vòng ${i}: bỏ (địa hình)`); continue; }
            console.log(`   vòng ${i}: ${G.ringDone[i] ? 'QUA' : 'trượt, gần nhất ' + Math.round(near[i]) + ' m'}` +
                ` (alt ${Math.round(o.alt)} z ${Math.round(o.z)})`);
        }
        for (let i = 0; i < R.starCount(rt); i++) {
            if (!R.starAt(rt, i)) continue;
            console.log(`   sao ${i}: ${G.starDone[i] ? 'NHẶT' : 'trượt, gần nhất ' + Math.round(nearS[i]) + ' m'}`);
        }
    }
    got = G.rings;
    const total = R.ringReal(rt);
    let starTotal = 0;
    for (let i = 0; i < R.starCount(rt); i++) if (R.starAt(rt, i)) starTotal++;
    ok(got >= total - 1,
        `lái thẳng tới từng vòng mà chỉ qua được ${got}/${total} — có vòng đặt lệch quá hoặc quá sát vòng trước`);
    /* Sao treo trên đường vào vòng, nên bay đúng vòng là phải lượm được gần
     * hết. Trượt nhiều tức là sao đang treo ở chỗ không ai bay qua — nhìn
     * thấy suốt mà chẳng bao giờ chạm, và bé không hiểu tại sao. */
    ok(G.stars >= starTotal - 1,
        `bay đúng đường vòng mà chỉ nhặt được ${G.stars}/${starTotal} sao — sao đang treo lệch khỏi lối bay`);
    console.log(`  vòng mây: lái thẳng tới thì qua được ${got}/${total}, và nhặt ${G.stars}/${starTotal} sao trên đường`);
    D.backToMenu();
}

/* ------------------------------------------------------------------ *
 * 7. VỆT SÁNG DẪN ĐƯỜNG CÓ THẬT SỰ DẪN TỚI ĐƯỜNG BĂNG KHÔNG
 * ------------------------------------------------------------------ */
{
    const rt = R.ROUTES[0];
    const arr = R.arriveRunway(rt);
    const endAlt = R.glideAlt(rt, arr.x0 + 300);
    ok(Math.abs(endAlt - arr.y) < 2,
        `vệt sáng kết thúc ở độ cao ${Math.round(endAlt)} m mà đường băng ở ${Math.round(arr.y)} m — bay theo nó thì hụt`);
    const startAlt = R.glideAlt(rt, rt.landStart);
    ok(startAlt > arr.y + 400, 'vệt sáng bắt đầu quá thấp — không còn gì để chúc xuống');
    console.log(`  vệt sáng hạ cánh: ${Math.round(startAlt)} m → ${Math.round(arr.y)} m trên ${((arr.x0 + 300 - rt.landStart) / 1000).toFixed(1)} km`);
}

/* ------------------------------------------------------------------ *
 * KẾT QUẢ
 * ------------------------------------------------------------------ */
console.log('');
for (const r of report) {
    console.log(`  ${r.bot.padEnd(12)} ${Math.round(r.secs).toString().padStart(3)} giây · ${r.rating.padEnd(8)}` +
        ` · lượn lại ${r.circled} · lệch ${Math.round(r.maxZ).toString().padStart(4)} m` +
        ` · ⭐${r.stars} 💍${r.rings} 📷${r.shots} · qua ${r.legs} chặng`);
}
/* ------------------------------------------------------------------ *
 * 8. CÓ VẼ NỔI SÁU MƯƠI KHUNG HÌNH MỘT GIÂY KHÔNG
 *
 *    Phối cảnh tốn hơn hẳn kiểu vẽ ngang: mặt đất chia dải, lưới ruộng, nhà
 *    cửa rải theo chiều sâu — mỗi thứ một ít, cộng lại thì máy tính của
 *    người lớn vẫn mượt còn máy tính bảng của bé thì giật. Đếm số nét vẽ mỗi
 *    khung là cách rẻ nhất để biết trước, thay vì đợi ai đó than.
 * ------------------------------------------------------------------ */
{
    const rt = R.ROUTES[0];
    D.start(rt.id);
    G.auto = true;
    for (let i = 0; i < 240; i++) step(1);        // bay lên đã, khỏi đo lúc còn trên đường băng
    const before = drawCalls;
    for (let i = 0; i < 120; i++) step(1);
    const perFrame = (drawCalls - before) / 120;
    ok(perFrame < 1400,
        `mỗi khung hình vẽ ${Math.round(perFrame)} nét — quá dày, máy yếu sẽ giật`);
    console.log(`  nét vẽ mỗi khung hình: ${Math.round(perFrame)}`);
    D.backToMenu();
}

console.log(`\n  ${drawCalls} lời gọi vẽ\n`);

if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    fails.forEach(f => console.log('  · ' + f));
    process.exit(1);
}
console.log('ĐẠT — mọi kiểu bấm đều tới được nơi, hạ cánh được, và nhận được thưởng.');
