/**
 * SPIDER CLIMB — máy soát độ công bằng của màn
 * ----------------------------------------------------------------------------
 * Chạy:  node spider-climb/check-climb.js  [số hạt giống]
 *
 * VÌ SAO CẦN
 * Màn leo vô tận sinh bằng máy có một kiểu hỏng rất khó bắt bằng cách ngồi
 * chơi thử: cứ một trăm lượt mới có một lượt gặp chỗ hai tường cùng bị chặn.
 * Người chơi gặp thì chết mà không hiểu vì sao, còn em ngồi chơi ba mươi lượt
 * thì không gặp lần nào, nên đinh ninh là không sao.
 *
 * Máy này sinh 40 hạt giống × 12 000 mét mỗi hạt — dài hơn mọi lượt chơi thật
 * mấy chục lần — rồi soát từng điều luật của bản thiết kế:
 *
 *   1. LÚC NÀO CŨNG CÒN ĐƯỜNG: quét từng 8 điểm ảnh một, phải có ít nhất một
 *      tường bám được. Đây là điều luật quan trọng nhất.
 *   2. Vật cản hai tường phải cách nhau đủ để kịp nhìn và nhảy.
 *   3. Vật cản cùng tường phải thưa.
 *   4. Mặt tường xấu không được phủ cả hai bên một lúc.
 *   5. Khe không bao giờ hẹp hơn hay rộng hơn mức đã định.
 *   6. Mối nguy tuần hoàn luôn hở một cửa sổ ≥ MIN_WINDOW giây.
 *   7. Vật phẩm không nằm trong lòng vật cản.
 *   8. Nhịp: không được căng hết cỡ ba đoạn liền, và phải có chỗ nghỉ đều đặn.
 *   9. Luật giới thiệu dần: khuôn khó không được ló ra dưới mốc mét của nó.
 *  10. Một con bọ tự động leo thử: mô phỏng leo–nhảy suốt 12 000 mét, không
 *      được có lúc nào bí đường.
 */
'use strict';

const R = require('./rules.js');

const SEEDS = parseInt(process.argv[2], 10) || 40;
const UP_TO_M = 12000;
const UP_TO_Y = UP_TO_M * R.PX_PER_M;

const fails = [];
const warn = [];
const stats = {
    patterns: {}, blockers: 0, surfaces: 0, movers: 0, pickups: 0,
    minGap: Infinity, maxGap: -Infinity, restEvery: []
};

function fail(msg) { if (fails.length < 40) fails.push(msg); }

console.log(`soát ${SEEDS} hạt giống × ${UP_TO_M} mét\n`);

for (let s = 1; s <= SEEDS; s++) {
    const w = new R.World(s * 7919 + 13);
    /* Sinh trọn màn, KHÔNG dọn rác — máy soát cần nhìn thấy toàn bộ, còn game
     * thật thì dọn phần đã trôi khỏi màn hình.
     *
     * ensure() chỉ đẻ tối đa 60 khuôn mỗi lượt gọi (chốt chặn phòng vòng lặp
     * vô tận). Trong game điều ấy vô hại vì mỗi khung hình gọi một lần, nhưng
     * gọi ĐÚNG MỘT LẦN ở đây thì màn dừng ở khoảng 1 500 m — và máy soát vừa
     * báo "đạt" cho phần trên 1 500 m mà nó chưa hề nhìn thấy. Kiểu mù im lặng
     * đúng như thứ máy soát này sinh ra để chặn. */
    let guard = 0;
    while (w.cursor < UP_TO_Y && guard++ < 4000) w.ensure(UP_TO_Y);
    if (w.cursor < UP_TO_Y) fail(`hạt ${s}: bộ sinh không leo nổi tới ${UP_TO_M} m`);

    /* ---- 1. lúc nào cũng còn đường ---- */
    let stuckAt = -1;
    for (let y = 900; y < UP_TO_Y; y += 8) {
        if (!w.canCling(0, y) && !w.canCling(1, y)) { stuckAt = y; break; }
    }
    if (stuckAt >= 0) {
        fail(`hạt ${s}: bí đường ở ${Math.round(stuckAt / R.PX_PER_M)} m — cả hai tường đều không bám được`);
    }

    /* ---- 2 & 3. khoảng cách vật cản ---- */
    for (let i = 0; i < w.blockers.length; i++) {
        for (let j = i + 1; j < w.blockers.length; j++) {
            const a = w.blockers[i], b = w.blockers[j];
            if (a.side === b.side) {
                if (R.overlap(a.y0 - R.SAME_SIDE_MIN, a.y1 + R.SAME_SIDE_MIN, b.y0, b.y1)) {
                    fail(`hạt ${s}: hai vật cản cùng tường sát nhau ở ${Math.round(a.y0 / R.PX_PER_M)} m`);
                }
            } else if (R.overlap(a.y0 - R.CLEAR, a.y1 + R.CLEAR, b.y0 - R.CLEAR, b.y1 + R.CLEAR)) {
                fail(`hạt ${s}: hai tường cùng bị chặn quanh ${Math.round(a.y0 / R.PX_PER_M)} m`);
            }
        }
    }

    /* ---- 4. mặt tường xấu ---- */
    for (let i = 0; i < w.surfaces.length; i++) {
        const a = w.surfaces[i];
        for (let j = i + 1; j < w.surfaces.length; j++) {
            const b = w.surfaces[j];
            if (a.side !== b.side && R.overlap(a.y0 - R.SURFACE_CLEAR, a.y1 + R.SURFACE_CLEAR, b.y0, b.y1)) {
                fail(`hạt ${s}: hai tường cùng xấu quanh ${Math.round(a.y0 / R.PX_PER_M)} m`);
            }
        }
        for (const b of w.blockers) {
            if (b.side !== a.side && R.overlap(a.y0 - R.CLEAR, a.y1 + R.CLEAR, b.y0, b.y1)) {
                fail(`hạt ${s}: mặt xấu ${a.kind} đối diện vật cản ở ${Math.round(a.y0 / R.PX_PER_M)} m`);
            }
        }
    }

    /* ---- 5. bề rộng khe ---- */
    for (let y = 900; y < UP_TO_Y; y += 40) {
        const g = w.gapAt(y);
        if (g < R.GAP_MIN - 0.5 || g > R.GAP_MAX + 0.5) {
            fail(`hạt ${s}: khe rộng ${Math.round(g)} ở ${Math.round(y / R.PX_PER_M)} m, ngoài khoảng cho phép`);
            break;
        }
        if (g < stats.minGap) stats.minGap = g;
        if (g > stats.maxGap) stats.maxGap = g;
    }

    /* ---- 6. cửa sổ an toàn của mối nguy tuần hoàn ---- */
    for (const m of w.movers) {
        const open = R.moverWindow(m);
        if (open < R.MIN_WINDOW - 1e-6) {
            const at = Math.round((m.y != null ? m.y : m.y0) / R.PX_PER_M);
            fail(`hạt ${s}: ${m.kind} ở ${at} m chỉ hở ${open.toFixed(2)} s, cần ${R.MIN_WINDOW} s`);
        }
    }

    /* ---- 7. vật phẩm không nằm trong vật cản ---- */
    for (const p of w.pickups) {
        const side = p.ax < 0.16 ? 0 : (p.ax > 0.84 ? 1 : -1);
        if (side >= 0 && w.blockerAt(side, p.y)) {
            fail(`hạt ${s}: ${p.type} nằm trong vật cản ở ${Math.round(p.y / R.PX_PER_M)} m`);
        }
    }

    /* ---- 8. nhịp căng–nghỉ ---- */
    let run = 0, sinceRest = 0, worstRun = 0, worstRest = 0;
    for (const e of w.log) {
        stats.patterns[e.id] = (stats.patterns[e.id] || 0) + 1;
        if (e.i >= 3) { run++; if (run > worstRun) worstRun = run; } else run = 0;
        if (e.i === 0) { stats.restEvery.push(sinceRest); sinceRest = 0; }
        else { sinceRest++; if (sinceRest > worstRest) worstRest = sinceRest; }
    }
    if (worstRun >= 3) fail(`hạt ${s}: ${worstRun} đoạn gắt liền nhau — không còn chỗ thở`);
    if (worstRest > 9) fail(`hạt ${s}: ${worstRest} đoạn liền không có chỗ nghỉ`);

    /* ---- 9. luật giới thiệu dần ---- */
    const byId = {};
    R.PATTERNS.forEach(p => { byId[p.id] = p; });
    for (const e of w.log) {
        const p = byId[e.id];
        if (p && e.m < p.minM - 1) {
            fail(`hạt ${s}: khuôn "${e.id}" ló ra ở ${e.m} m nhưng chỉ được phép từ ${p.minM} m`);
        }
    }

    /* ---- 10. con bọ tự động leo thử ----
     * Mô phỏng thô nhưng đúng chỗ cần: nó leo lên, thấy tường mình sắp bị chặn
     * thì nhảy sang bên kia. Nếu có lúc nào cả hai bên đều không đi tiếp được
     * thì màn ấy bí thật, không phải em tưởng tượng. */
    {
        let side = 0, y = 950, jumps = 0, blocked = -1;
        const LOOK = 120;                       // nhìn trước bấy nhiêu điểm ảnh
        while (y < UP_TO_Y) {
            const ahead = y + LOOK;
            const mineOk = w.canCling(side, ahead);
            if (!mineOk) {
                if (w.canCling(1 - side, y + 30) && w.canCling(1 - side, ahead)) {
                    side = 1 - side; jumps++; y += 30;
                } else if (w.canCling(side, y + 6)) {
                    /* đứng yên không được, mà bên kia cũng không nhận — bí */
                    blocked = y; break;
                } else { blocked = y; break; }
            } else {
                y += 40;
            }
        }
        if (blocked >= 0) {
            fail(`hạt ${s}: con bọ tự động tắc ở ${Math.round(blocked / R.PX_PER_M)} m`);
        }
        if (jumps < UP_TO_M / 400) {
            warn.push(`hạt ${s}: chỉ phải nhảy ${jumps} lần trong ${UP_TO_M} m — màn hơi thoáng`);
        }
    }

    stats.blockers += w.blockers.length;
    stats.surfaces += w.surfaces.length;
    stats.movers += w.movers.length;
    stats.pickups += w.pickups.length;
}

/* ---- 11. đường cong khó phải chỉ đi lên ---- */
{
    let prev = R.difficulty(0);
    for (let m = 50; m <= 12000; m += 50) {
        const d = R.difficulty(m);
        if (d.climb < prev.climb - 1e-9) { fail(`tốc độ leo tụt ở ${m} m`); break; }
        if (d.density < prev.density - 1e-9) { fail(`mật độ tụt ở ${m} m`); break; }
        if (d.window > prev.window + 1e-9) { fail(`cửa sổ phản ứng giãn ra ở ${m} m`); break; }
        prev = d;
    }
    const d0 = R.difficulty(0), dEnd = R.difficulty(12000);
    if (d0.climb > R.CLIMB_BASE + 1) fail('tốc độ leo lúc xuất phát không đúng mức đã định');
    if (dEnd.climb > R.CLIMB_MAX + 1) fail('tốc độ leo vượt trần');
    /* Cửa sổ laser hẹp nhất vẫn phải trên MIN_WINDOW — phép đặt ép, nhưng nếu
     * ai đó chỉnh d.window quá tay thì mọi tia laser thành 3,2 s cứng và khuôn
     * mất hết ý nghĩa. Cảnh báo cho biết. */
    if (3.4 * dEnd.window - 1.1 * dEnd.window - 0.45 < R.MIN_WINDOW) {
        warn.push('trên 12 000 m, cửa sổ laser đã chạm sàn MIN_WINDOW — chỉnh window nữa là vô ích');
    }
}

/* ---- 12. hàng nội dung tối thiểu của bản thiết kế ---- */
{
    const statics = new Set(), unsafe = new Set(), moving = new Set(), picks = new Set();
    const w = new R.World(4242);
    const top = 11000 * R.PX_PER_M;
    let g = 0;
    while (w.cursor < top && g++ < 4000) w.ensure(top);
    w.blockers.forEach(b => statics.add(b.type));
    w.surfaces.forEach(s => unsafe.add(s.kind));
    w.movers.forEach(m => moving.add(m.kind));
    w.pickups.forEach(p => picks.add(p.type));

    const need = [
        ['vật cản đứng yên', statics, 4],
        ['mặt tường xấu', unsafe, 3],
        ['mối nguy di động', moving, 3],
        ['loại vật phẩm', picks, 6]
    ];
    for (const [name, set, n] of need) {
        if (set.size < n) fail(`${name}: mới có ${set.size} loại, bản thiết kế đòi ${n} (${[...set].join(', ')})`);
    }
    const total = statics.size + unsafe.size + moving.size;
    if (total < 12) fail(`tổng cộng mới ${total} loại chướng ngại, bản thiết kế đòi 12`);
    console.log(`  chướng ngại: ${statics.size} đứng yên · ${unsafe.size} mặt xấu · ${moving.size} di động = ${total} loại`);
    console.log(`  vật phẩm: ${[...picks].join(', ')}`);
    if (R.ZONES.length < 6) fail(`mới có ${R.ZONES.length} vùng cao độ, bản thiết kế đòi 6`);
    if (R.MISSIONS.length < 30) fail(`mới có ${R.MISSIONS.length} nhiệm vụ, bản thiết kế đòi 30`);
    if (R.SUITS.length < 3) fail(`mới có ${R.SUITS.length} bộ đồ, bản thiết kế đòi 3`);
    console.log(`  ${R.ZONES.length} vùng · ${R.MISSIONS.length} nhiệm vụ · ${R.SUITS.length} bộ đồ · ${R.PATTERNS.length} khuôn màn`);
}

/* ---- 13. nhiệm vụ phải bốc ra ba cái khác nhau ---- */
{
    for (let i = 0; i < 200; i++) {
        const r = R.makeRng(i + 1);
        const three = R.rollMissions([], r, 3);
        if (new Set(three).size !== 3) { fail('bốc nhiệm vụ ra trùng nhau'); break; }
    }
    const seen = new Set(R.MISSIONS.map(m => m.id));
    if (seen.size !== R.MISSIONS.length) fail('có hai nhiệm vụ trùng mã');
    for (const ms of R.MISSIONS) {
        if (R.missionText(ms).indexOf('{0}') >= 0 && ms.tpl.indexOf('{0}') < 0) fail(`nhiệm vụ ${ms.id}: chỗ trống không được thay`);
        if (!ms.coins && !ms.gems) fail(`nhiệm vụ ${ms.id}: xong mà không được gì`);
    }
}

/* ---- kết quả ---- */
const used = Object.keys(stats.patterns).length;
const unused = R.PATTERNS.filter(p => !stats.patterns[p.id]).map(p => p.id);
const restAvg = stats.restEvery.length
    ? (stats.restEvery.reduce((a, b) => a + b, 0) / stats.restEvery.length).toFixed(1) : '-';

console.log(`  mỗi hạt trung bình: ${Math.round(stats.blockers / SEEDS)} vật cản · ` +
    `${Math.round(stats.surfaces / SEEDS)} mặt xấu · ${Math.round(stats.movers / SEEDS)} mối nguy động · ` +
    `${Math.round(stats.pickups / SEEDS)} vật phẩm`);
console.log(`  khe: hẹp nhất ${Math.round(stats.minGap)} · rộng nhất ${Math.round(stats.maxGap)}`);
console.log(`  khuôn dùng tới: ${used}/${R.PATTERNS.length}${unused.length ? ' — chưa dùng: ' + unused.join(', ') : ''}`);
console.log(`  cứ ${restAvg} đoạn lại có một đoạn nghỉ`);
console.log('');

if (unused.length) warn.push(`${unused.length} khuôn không bao giờ được chọn: ${unused.join(', ')}`);

if (warn.length) {
    console.log('nhắc nhở (không chặn):');
    warn.slice(0, 12).forEach(x => console.log('  · ' + x));
    if (warn.length > 12) console.log(`  · … và ${warn.length - 12} nhắc nhở nữa`);
    console.log('');
}
if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    fails.forEach(f => console.log('  · ' + f));
    process.exit(1);
}
console.log('ĐẠT — lúc nào cũng còn đường leo, nhịp căng–nghỉ đúng, nội dung đủ hàng.');
