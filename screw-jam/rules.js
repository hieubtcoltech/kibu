/**
 * Vặn Ốc — LUẬT CHƠI
 * ----------------------------------------------------------------------------
 * Tệp này chỉ có luật, không có một dòng nào đụng tới màn hình hay Phaser. Nhờ
 * vậy ba nơi cùng dùng chung đúng một bộ luật:
 *
 *   · game.js       — bé chơi trong trình duyệt (chạy trên Phaser 3)
 *   · make-levels.js — máy sinh màn, chạy trong Node
 *   · check-levels.js — máy soát màn, chạy trong Node
 *
 * VÌ SAO PHẢI TÁCH RA
 * Cả lời hứa của game nằm ở câu "màn nào cũng chắc chắn tháo hết được". Muốn
 * hứa được thì máy phải giải thử từng màn — mà máy chạy trong Node thì không
 * nạp nổi Phaser. Nếu để luật nằm lẫn trong game.js thì buộc phải chép luật
 * sang một tệp riêng cho máy soát, và chép tay là sớm muộn cũng lệch: máy soát
 * bảo giải được, bé chơi thật lại tắc. Tách ra thế này thì không có bản chép
 * nào để mà lệch.
 *
 * LUẬT
 *   · Bàn có mấy tấm ván xếp chồng, tấm sau đè lên tấm trước.
 *   · Mỗi con ốc ghim vào một tấm ván. Ốc chỉ vặn ra được khi KHÔNG có tấm ván
 *     nào ở trên đè lên chỗ nó.
 *   · Ốc vặn ra bay vào khay. Khay có mấy chỗ; đủ ba con cùng màu là cả ba biến
 *     mất, trả lại chỗ trống.
 *   · Tấm ván nào rút hết ốc thì rơi xuống, để lộ lớp nằm dưới.
 *   · Khay đầy mà không còn chỗ đặt thì tắc — nhưng chuyện đó chỉ xảy ra khi bé
 *     tháo sai thứ tự, vì mọi màn đóng gói đều đã có máy giải thử với ĐÚNG số
 *     chỗ khay ấy, không cần mua thêm chỗ nào.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.ScrewRules = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var TRIPLE = 3;          // đủ mấy con cùng màu thì biến mất

    /* Tấm ván nào đã rụng: rút hết ốc là rụng, và ván rụng có thể làm lộ ra ván
     * khác cũng đã hết ốc — nên phải quét đi quét lại tới khi không đổi nữa. */
    function fallenPlates(level, removed) {
        var gone = {}, changed = true, i, k;
        while (changed) {
            changed = false;
            for (i = 0; i < level.plates.length; i++) {
                if (gone[i]) continue;
                var any = false;
                for (k = 0; k < level.screws.length; k++) {
                    if (level.screws[k].p === i && !removed[k]) { any = true; break; }
                }
                if (!any) { gone[i] = 1; changed = true; }
            }
        }
        return gone;
    }

    /* Có tấm ván nào còn nằm ĐÈ LÊN chỗ con ốc này không */
    function isCovered(level, si, gone) {
        var s = level.screws[si];
        var mine = s.p;
        for (var i = 0; i < level.plates.length; i++) {
            if (i === mine || gone[i]) continue;
            if (i < mine) continue;                 // ván nằm dưới, không che được
            var p = level.plates[i];
            if (s.x > p.x && s.x < p.x + p.w && s.y > p.y && s.y < p.y + p.h) return true;
        }
        return false;
    }

    /* Những con ốc bé vặn ra được ngay lúc này */
    function freeScrews(level, removed) {
        var gone = fallenPlates(level, removed), out = [];
        for (var k = 0; k < level.screws.length; k++) {
            if (removed[k]) continue;
            if (gone[level.screws[k].p]) continue;
            if (!isCovered(level, k, gone)) out.push(k);
        }
        return out;
    }

    /* Đặt một con ốc vào khay. Trả về khay mới và ba con vừa biến mất (nếu có),
     * hoặc null khi khay không còn chỗ. Khay giữ theo thứ tự màu cho dễ nhìn:
     * ba con cùng màu nằm rời rạc thì mắt bé không nhận ra là sắp đủ bộ. */
    function place(hold, color, slots) {
        if (hold.length >= slots) return null;
        var out = hold.slice();
        var at = out.length;
        for (var i = 0; i < out.length; i++) {
            if (out[i] === color) { at = i + 1; while (at < out.length && out[at] === color) at++; break; }
        }
        out.splice(at, 0, color);

        var n = 0, i2;
        for (i2 = 0; i2 < out.length; i2++) if (out[i2] === color) n++;
        /* at = chỗ con ốc vừa đặt nằm trong khay TRƯỚC khi nổ bộ ba. Phần vẽ
         * cần đúng con số này để cho con ốc bay tới đúng ô; tự đoán lại bằng
         * indexOf ở bên ngoài là sai, vì trong khay có thể đã có sẵn mấy con
         * cùng màu đứng trước nó. */
        if (n < TRIPLE) return { hold: out, cleared: null, at: at };

        var kept = [], popped = [], left = TRIPLE;
        for (i2 = 0; i2 < out.length; i2++) {
            if (out[i2] === color && left > 0) { popped.push(i2); left--; }
            else kept.push(out[i2]);
        }
        return { hold: kept, cleared: { color: color, at: popped }, at: at };
    }

    function isWon(level, removed) {
        for (var k = 0; k < level.screws.length; k++) if (!removed[k]) return false;
        return true;
    }

    /* Còn nước đi nào không: hết ốc vặn được, hoặc khay đã đầy */
    function isStuck(level, removed, hold) {
        if (isWon(level, removed)) return false;
        if (hold.length >= level.slots) return true;
        return freeScrews(level, removed).length === 0;
    }

    function keyOf(removed, hold) {
        var a = [];
        for (var k in removed) if (removed[k]) a.push(k);
        a.sort(function (x, y) { return x - y; });
        return a.join(',') + '|' + hold.slice().sort().join('');
    }

    /* Máy giải. Trả về thứ tự vặn ốc, hoặc null nếu không tháo hết nổi.
     *
     * Mẹo sắp thứ tự thử: ưu tiên con ốc nào làm ĐỦ BỘ BA ngay, rồi tới màu đã
     * có sẵn trên khay, cuối cùng mới tới màu mới. Nhờ mẹo này máy tìm ra lời
     * giải trong vài chục nghìn trạng thái thay vì hàng triệu, đủ nhanh để bấm
     * nút mách nước là có ngay.
     *
     * nodeCap để không bao giờ treo máy của bé: hết trần thì thà nói "chưa nghĩ
     * ra" còn hơn để bé ngồi nhìn màn hình đơ.
     */
    function solve(level, nodeCap) {
        var seen = {}, nodes = 0;
        var cap = nodeCap || 300000;

        function dfs(removed, hold) {
            if (isWon(level, removed)) return [];
            if (++nodes > cap) return null;
            var key = keyOf(removed, hold);
            if (seen[key]) return null;
            seen[key] = 1;

            var free = freeScrews(level, removed);
            free.sort(function (a, b) {
                return score(level.screws[b].c, hold) - score(level.screws[a].c, hold);
            });

            for (var i = 0; i < free.length; i++) {
                var k = free[i];
                var r = place(hold, level.screws[k].c, level.slots);
                if (!r) continue;
                removed[k] = 1;
                var sub = dfs(removed, r.hold);
                removed[k] = 0;
                if (sub) return [k].concat(sub);
            }
            return null;
        }

        function score(color, hold) {
            var n = 0;
            for (var i = 0; i < hold.length; i++) if (hold[i] === color) n++;
            return n === 2 ? 100 : n === 1 ? 50 : 0;
        }

        return dfs({}, []);
    }

    /* Nước đi tiếp theo cho nút mách nước */
    function hint(level, removed, hold, nodeCap) {
        var seen = {}, nodes = 0;
        var cap = nodeCap || 120000;

        function dfs(rem, hd) {
            if (isWon(level, rem)) return [];
            if (++nodes > cap) return null;
            var key = keyOf(rem, hd);
            if (seen[key]) return null;
            seen[key] = 1;
            var free = freeScrews(level, rem);
            free.sort(function (a, b) {
                var na = 0, nb = 0, i;
                for (i = 0; i < hd.length; i++) {
                    if (hd[i] === level.screws[a].c) na++;
                    if (hd[i] === level.screws[b].c) nb++;
                }
                return (nb === 2 ? 100 : nb === 1 ? 50 : 0) - (na === 2 ? 100 : na === 1 ? 50 : 0);
            });
            for (var i = 0; i < free.length; i++) {
                var k = free[i];
                var r = place(hd, level.screws[k].c, level.slots);
                if (!r) continue;
                rem[k] = 1;
                var sub = dfs(rem, r.hold);
                rem[k] = 0;
                if (sub) return [k].concat(sub);
            }
            return null;
        }

        var copy = {};
        for (var k in removed) if (removed[k]) copy[k] = 1;
        var path = dfs(copy, hold.slice());
        return path && path.length ? path[0] : -1;
    }

    /* ---- hai con rô-bốt để ĐO ĐỘ KHÓ ----
     * Số nước đi không nói lên độ khó của thể loại này; cái quyết định là bé có
     * dễ tháo nhầm thứ tự rồi tắc hay không. Nên đo bằng cách cho rô-bốt chơi:
     *   · rô-bốt bấm bừa   → màn dễ tới đâu với đứa bé chưa biết gì;
     *   · rô-bốt biết nghĩ → màn có đòi hỏi tính trước không. Nó chơi đúng cách
     *     một đứa trẻ tử tế sẽ chơi: thấy con nào làm đủ bộ ba thì lấy, không
     *     thì lấy màu đã có trên khay, cùng đường mới mở màu mới.
     */
    function playout(level, rnd, smart) {
        var removed = {}, hold = [], step;
        for (step = 0; step < 500; step++) {
            if (isWon(level, removed)) return true;
            var free = freeScrews(level, removed);
            if (!free.length || hold.length >= level.slots) return false;

            var pick;
            if (!smart) pick = free[Math.floor(rnd() * free.length)];
            else {
                var best = -1, bestScore = -9;
                for (var i = 0; i < free.length; i++) {
                    var c = level.screws[free[i]].c, n = 0;
                    for (var j = 0; j < hold.length; j++) if (hold[j] === c) n++;
                    var sc = (n === 2 ? 100 : n === 1 ? 50 : 0) + rnd();
                    if (sc > bestScore) { bestScore = sc; best = free[i]; }
                }
                pick = best;
            }
            var r = place(hold, level.screws[pick].c, level.slots);
            if (!r) return false;
            hold = r.hold;
            removed[pick] = 1;
        }
        return false;
    }

    function winRate(level, tries, rnd, smart) {
        var win = 0;
        for (var i = 0; i < tries; i++) if (playout(level, rnd, smart)) win++;
        return win / tries;
    }

    /* Dựng một màn từ dạng gọn đóng gói trong levels.js.
     * Ốc để ở khoá w2 chứ không phải w, vì w đã dùng cho số hiệu thế giới. */
    function inflate(raw) {
        return {
            slots: raw.s,
            plates: raw.p.map(function (a) { return { x: a[0], y: a[1], w: a[2], h: a[3] }; }),
            screws: raw.w2.map(function (a) { return { x: a[0], y: a[1], p: a[2], c: a[3] }; })
        };
    }

    return {
        TRIPLE: TRIPLE,
        fallenPlates: fallenPlates,
        isCovered: isCovered,
        freeScrews: freeScrews,
        place: place,
        isWon: isWon,
        isStuck: isStuck,
        solve: solve,
        hint: hint,
        winRate: winRate,
        inflate: inflate
    };
}));
