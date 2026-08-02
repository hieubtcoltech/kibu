/* ============================================================================
 * Magic Coloring — game logic
 * ----------------------------------------------------------------------------
 * Tap a colour, tap a region, the region fills. That is the whole game, and
 * everything below exists to keep it that simple for a 4-5 year old:
 *
 *   · no timer, no score, no failure state — nothing can be "wrong"
 *   · every change is undoable, so a wrong tap is never upsetting
 *   · work saves itself to localStorage on every tap; closing the tab mid
 *     picture and coming back tomorrow picks up exactly where they left off
 *   · the picture names come from art.js in the current language rather than
 *     going through the shared dictionary, because they are data, not markup
 *
 * The PNG export re-draws the same path strings through Path2D on a canvas
 * instead of rasterising the live SVG. That avoids the tainted-canvas problem
 * and gives a clean 1200px file regardless of the screen it was coloured on.
 * ==========================================================================*/
(function () {
    'use strict';

    var ART = window.KibuArt;
    if (!ART) return;

    var DRAWINGS = ART.DRAWINGS;
    var INK = ART.INK;
    var STORE_KEY = 'kibu_coloring_v1';
    var SOUND_KEY = 'kibu_coloring_sound';
    var VIEW = 400;                 // artwork coordinate space
    var STROKE = 4.5;

    function lang() { return (window.KibuI18n && window.KibuI18n.lang) || 'en'; }
    function nameOf(d) { return lang() === 'vi' ? d.vi : d.en; }
    function T(vi, en) { return lang() === 'vi' ? vi : en; }

    /* ------------------------------------------------------------------ *
     * Palette
     * ------------------------------------------------------------------ */
    var COLORS = [
        '#ff5fa2', '#ff8fb0', '#ffb3c7', '#ff6b6b', '#ff9e5c', '#ffb703',
        '#ffd166', '#fff0b8', '#7ec86a', '#9ada86', '#4fd1c5', '#7ee0d0',
        '#7ec8ff', '#4aa8ff', '#bfe9ff', '#b8a4ff', '#8f7bd6', '#e9dcff',
        '#c98a5b', '#f0cba6', '#ffe0c6', '#5c5470', '#b9b3c7', '#ffffff'
    ];

    /* Gradients and the glitter pattern. Kept as data so the SVG <defs> and the
     * canvas exporter can be generated from the same source and never drift. */
    var SPECIALS = [
        { id: 'rainbow', stops: [[0, '#ff6b6b'], [0.25, '#ffd166'], [0.5, '#7ec86a'], [0.75, '#7ec8ff'], [1, '#b8a4ff']] },
        { id: 'candy', stops: [[0, '#ffd6e7'], [0.5, '#ff8fc4'], [1, '#b06bff']] },
        { id: 'mint', stops: [[0, '#d6fff2'], [0.5, '#7ee0d0'], [1, '#4aa8ff']] },
        { id: 'sunset', stops: [[0, '#fff0b8'], [0.5, '#ffb703'], [1, '#ff6b6b']] }
    ];
    var GLITTER = {
        base: '#ffe9f6', tile: 26,
        dots: [[6, 7, 2.4, '#ffd166'], [19, 16, 1.9, '#ff9ec4'], [12, 22, 1.5, '#b8a4ff'], [23, 4, 1.3, '#7ec8ff']]
    };

    /* 72 hình dán chia làm 6 rổ. Đổ hết vào một danh sách phẳng thì bé phải
     * cuộn mãi mới thấy hình mình muốn; chia rổ thì mỗi rổ vừa đúng hai hàng,
     * nhìn một cái là thấy hết, và cái thẻ rổ cũng chỉ là một emoji to nên bé
     * chưa đọc chữ vẫn chọn được.
     *
     * Chỉ dùng emoji đã phổ biến từ lâu (Unicode ≤ 13) để máy cũ của ông bà
     * cũng hiện ra hình chứ không phải ô vuông rỗng. */
    var STICKER_GROUPS = [
        { icon: '💖', vi: 'Tim và sao', en: 'Hearts and stars',
          items: ['💖', '💕', '💗', '💓', '❤️', '💛', '⭐', '🌟', '✨', '💫', '🌠', '💝'] },
        { icon: '🌸', vi: 'Hoa và lá', en: 'Flowers and leaves',
          items: ['🌸', '🌺', '🌷', '🌹', '🌻', '🌼', '🍀', '🍃', '🌿', '🌱', '🌵', '💐'] },
        { icon: '🦋', vi: 'Con vật', en: 'Animals',
          items: ['🦋', '🐝', '🐞', '🐰', '🐱', '🐶', '🦄', '🐥', '🐧', '🐢', '🐠', '🦉'] },
        { icon: '🍰', vi: 'Đồ ngọt', en: 'Sweet things',
          items: ['🍰', '🧁', '🍭', '🍬', '🍩', '🍪', '🍦', '🍓', '🍒', '🍎', '🍇', '🍯'] },
        { icon: '👑', vi: 'Công chúa', en: 'Princess',
          items: ['👑', '💎', '🪄', '🔮', '💍', '👗', '👠', '🎀', '🧚', '🏰', '🦢', '🎠'] },
        { icon: '🌈', vi: 'Trời và mây', en: 'Sky and clouds',
          items: ['🌈', '☁️', '☀️', '🌙', '⛅', '❄️', '⛄', '🎈', '🪁', '🎉', '🎊', '🌊'] }
    ];
    var stGroup = 0;

    function isSpecial(c) { return typeof c === 'string' && c.indexOf('url(') === 0; }

    /* ------------------------------------------------------------------ *
     * Saved work
     * ------------------------------------------------------------------ */
    var store = load();

    function load() {
        try {
            var raw = localStorage.getItem(STORE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* private mode */ }
    }

    function slotFor(id) {
        if (!store[id]) store[id] = { f: {}, s: [] };
        if (!store[id].f) store[id].f = {};
        if (!store[id].s) store[id].s = [];
        return store[id];
    }

    /* ------------------------------------------------------------------ *
     * Sound — short WebAudio blips, no asset files
     * ------------------------------------------------------------------ */
    var soundOn = true;
    try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { /* ignore */ }
    var ac = null;

    function tone(freq, dur, type, vol, delay) {
        if (!soundOn) return;
        try {
            if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
            if (ac.state === 'suspended') ac.resume();
            var t0 = ac.currentTime + (delay || 0);
            var osc = ac.createOscillator(), g = ac.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            osc.connect(g); g.connect(ac.destination);
            osc.start(t0); osc.stop(t0 + dur + 0.02);
        } catch (e) { /* audio blocked */ }
    }

    /* Pitch climbs with how much of the picture is done — the picture literally
     * sounds like it is getting closer to finished. */
    function popSound(progress) {
        tone(440 + progress * 420, 0.16, 'sine', 0.17);
        tone(880 + progress * 500, 0.09, 'triangle', 0.06, 0.02);
    }

    function sparkleSound() {
        tone(1180, 0.09, 'triangle', 0.12);
        tone(1560, 0.10, 'triangle', 0.10, 0.06);
    }

    function fanfare() {
        [523, 659, 784, 1047].forEach(function (f, i) {
            tone(f, 0.34, 'triangle', 0.15, i * 0.11);
        });
    }

    /* ------------------------------------------------------------------ *
     * DOM
     * ------------------------------------------------------------------ */
    var $ = function (id) { return document.getElementById(id); };
    var svg = $('art');
    var fx = $('fx');
    var swatchBox = $('swatches');
    var stickerBox = $('stickers');
    var gallery = $('gallery');
    var galleryGrid = $('galleryGrid');
    var winBox = $('win');
    var helpBox = $('help');
    var toastEl = $('toast');

    var curIdx = 0;
    var color = COLORS[0];
    var sticker = null;          // non-null ⇒ sticker mode
    var selSticker = -1;         // index of the sticker being edited, -1 = none
    var drag = null;             // in-flight drag of a sticker
    var undoStack = [];
    var idleTimer = null;
    var busy = false;            // true while "surprise" is animating

    var ST_MIN = 22, ST_MAX = 130, ST_STEP = 1.25;

    /* ------------------------------------------------------------------ *
     * Building the picture
     * ------------------------------------------------------------------ */
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function defsMarkup() {
        var out = '<defs>';
        SPECIALS.forEach(function (sp) {
            out += '<linearGradient id="g-' + sp.id + '" x1="0" y1="0" x2="0.4" y2="1">';
            sp.stops.forEach(function (s) { out += '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; });
            out += '</linearGradient>';
        });
        out += '<pattern id="g-glitter" width="' + GLITTER.tile + '" height="' + GLITTER.tile + '" patternUnits="userSpaceOnUse">'
             + '<rect width="' + GLITTER.tile + '" height="' + GLITTER.tile + '" fill="' + GLITTER.base + '"/>';
        GLITTER.dots.forEach(function (d) {
            out += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="' + d[3] + '"/>';
        });
        return out + '</pattern></defs>';
    }

    /* ------------------------------------------------------------------ *
     * Canh tranh vào giữa khung
     * --------------------------------------------------------------------
     * Toạ độ trong art.js là do người vẽ đặt tay, nên bức thì lệch xuống dưới,
     * bức thì nhỏ hơn bức khác, thậm chí có bức thò ra ngoài khung 400x400 và
     * bị cắt mất chân. Thay vì đi sửa 16 bộ toạ độ — và lại lệch tiếp mỗi lần
     * thêm tranh mới — ở đây đo kích thước thật của từng bức rồi dịch vào giữa
     * và phóng cho vừa khung.
     *
     * Hình dán KHÔNG nằm trong phép biến đổi này: chúng vẫn ở hệ toạ độ gốc
     * 0..400, nên vị trí hình dán bé đã lưu từ trước vẫn đúng nguyên.
     * ------------------------------------------------------------------ */
    var FILL = 0.94;             // phần khung mà bức tranh chiếm
    var fitCache = {};

    function fitOf(i) {
        var d = DRAWINGS[i];
        if (fitCache[d.id]) return fitCache[d.id];

        var m = $('measure');
        m.innerHTML = '<g id="mR">' + d.regions.map(function (r) {
            return '<path d="' + r.d + '"/>';
        }).join('') + '</g><g id="mD">' + (d.deco || []).map(function (o) {
            return '<path d="' + o.d + '"/>';
        }).join('') + '</g>';

        var boxes = [];
        ['mR', 'mD'].forEach(function (id) {
            var g = m.querySelector('#' + id);
            if (!g || !g.childNodes.length) return;
            try {
                var b = g.getBBox();
                if (b.width > 0 && b.height > 0) boxes.push(b);
            } catch (e) { /* not rendered */ }
        });
        m.innerHTML = '';

        var fit = { t: '', k: 1, tx: 0, ty: 0 };
        if (boxes.length) {
            var x0 = Math.min.apply(null, boxes.map(function (b) { return b.x; }));
            var y0 = Math.min.apply(null, boxes.map(function (b) { return b.y; }));
            var x1 = Math.max.apply(null, boxes.map(function (b) { return b.x + b.width; }));
            var y1 = Math.max.apply(null, boxes.map(function (b) { return b.y + b.height; }));
            /* getBBox không tính nét viền, mà nét viền vẽ lệch ra ngoài đường
               path đúng một nửa bề dày. */
            var pad = STROKE / 2 + 1;
            x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;

            var side = Math.max(x1 - x0, y1 - y0);
            var k = side > 0 ? (VIEW * FILL) / side : 1;
            var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
            fit.k = k;
            fit.tx = VIEW / 2 - cx * k;
            fit.ty = VIEW / 2 - cy * k;
            fit.t = 'translate(' + r2(fit.tx) + ',' + r2(fit.ty) + ') scale(' + r2(k) + ')';
        }
        fitCache[d.id] = fit;
        return fit;
    }

    function r2(v) { return Math.round(v * 1000) / 1000; }

    function decoMarkup(d) {
        return (d.deco || []).map(function (o) {
            return o.fill
                ? '<path d="' + o.d + '" fill="' + o.fill + '"/>'
                : '<path d="' + o.d + '" fill="none" stroke="' + o.stroke + '" stroke-width="' + o.w
                    + '" stroke-linecap="round" stroke-linejoin="round"/>';
        }).join('');
    }

    /* Mỗi hình dán là một <g> có sẵn vòng tròn trong suốt phía sau: chữ emoji
     * bắt chạm rất khó trúng, còn vòng tròn thì cho bé cả một vùng rộng để
     * chạm và kéo. `sel` là chỉ số hình đang được chọn (-1 = không chọn). */
    function stickerMarkup(list, sel) {
        return list.map(function (s, i) {
            var hit = s.r * 0.62;
            return '<g class="st' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"'
                 + ' transform="translate(' + s.x + ',' + s.y + ')">'
                 + (i === sel ? '<circle class="st-ring" r="' + (s.r * 0.72) + '"/>' : '')
                 + '<circle class="st-hit" r="' + hit + '" fill="transparent"/>'
                 + '<text font-size="' + s.r + '" text-anchor="middle" dominant-baseline="central">'
                 + esc(s.e) + '</text></g>';
        }).join('');
    }

    function render() {
        var d = DRAWINGS[curIdx];
        var slot = slotFor(d.id);
        var regions = d.regions.map(function (r, i) {
            var f = slot.f[i] || '#ffffff';
            return '<path class="region" data-i="' + i + '" d="' + r.d + '" fill="' + f + '" stroke="' + INK
                 + '" stroke-width="' + STROKE + '" stroke-linejoin="round" stroke-linecap="round"/>';
        }).join('');

        var t = fitOf(curIdx).t;
        svg.innerHTML = defsMarkup()
            + '<g class="regions" transform="' + t + '">' + regions + '</g>'
            + '<g class="deco" transform="' + t + '" style="pointer-events:none">' + decoMarkup(d) + '</g>'
            + '<g class="stickers">' + stickerMarkup(slot.s, selSticker) + '</g>';

        $('artName').textContent = nameOf(d);
        updateProgress();
        scheduleNudge();
    }

    function filledCount() {
        var slot = slotFor(DRAWINGS[curIdx].id), n = 0;
        for (var i = 0; i < DRAWINGS[curIdx].regions.length; i++) if (slot.f[i]) n++;
        return n;
    }

    function updateProgress() {
        var total = DRAWINGS[curIdx].regions.length;
        $('artProgress').textContent = filledCount() + '/' + total;
        $('btnUndo').disabled = undoStack.length === 0;
    }

    /* ------------------------------------------------------------------ *
     * Painting
     * ------------------------------------------------------------------ */
    function svgPoint(evt) {
        var r = svg.getBoundingClientRect();
        return {
            x: (evt.clientX - r.left) / r.width * VIEW,
            y: (evt.clientY - r.top) / r.height * VIEW
        };
    }

    function burst(x, y, chars) {
        var r = svg.getBoundingClientRect(), box = fx.getBoundingClientRect();
        var px = (x / VIEW) * r.width + (r.left - box.left);
        var py = (y / VIEW) * r.height + (r.top - box.top);
        for (var i = 0; i < chars.length; i++) {
            var el = document.createElement('span');
            el.className = 'spark';
            el.textContent = chars[i];
            el.style.left = (px + (i - (chars.length - 1) / 2) * 22) + 'px';
            el.style.top = py + 'px';
            fx.appendChild(el);
            /* jshint -W083 */
            (function (node) { setTimeout(function () { node.remove(); }, 800); }(el));
        }
    }

    function paint(idx, value, quiet) {
        var d = DRAWINGS[curIdx], slot = slotFor(d.id);
        var prev = slot.f[idx] || null;
        if (prev === value) return false;

        undoStack.push({ t: 'fill', i: idx, prev: prev });
        if (value) slot.f[idx] = value; else delete slot.f[idx];
        save();

        var node = svg.querySelector('.region[data-i="' + idx + '"]');
        if (node) {
            node.setAttribute('fill', value || '#ffffff');
            node.classList.remove('nudge');
        }
        updateProgress();
        if (!quiet) popSound(filledCount() / d.regions.length);
        return true;
    }

    function stickers() { return slotFor(DRAWINGS[curIdx].id).s; }

    function drawStickers() {
        var g = svg.querySelector('.stickers');
        if (g) g.innerHTML = stickerMarkup(stickers(), selSticker);
    }

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    /* Giữ trọn hình dán trong khung. Hình bị cắt mất một nửa ở mép trông như
     * lỗi chứ không như dụng ý, và bé thì không hiểu vì sao hình mình vừa dán
     * lại bị mất một góc. Gọi cả lúc kéo lẫn lúc phóng to. */
    function clampSticker(s) {
        var half = s.r * 0.56;
        s.x = Math.round(clamp(s.x, half, VIEW - half));
        s.y = Math.round(clamp(s.y, half, VIEW - half));
    }

    /* Chọn hình dán nào thì hiện thanh sửa của hình đó; bỏ chọn thì thanh biến
     * mất. Thanh nằm im một chỗ dưới đáy khung tranh nên bé luôn tìm thấy nó ở
     * cùng chỗ, không phải rê theo hình dán. */
    function selectSticker(i) {
        selSticker = i;
        drawStickers();
        $('stBar').hidden = i < 0;
        if (i >= 0) {
            var s = stickers()[i];
            $('stBigger').disabled = s.r >= ST_MAX;
            $('stSmaller').disabled = s.r <= ST_MIN;
        }
    }

    function placeSticker(x, y) {
        var list = stickers();
        var s = { e: sticker, x: Math.round(x), y: Math.round(y), r: 46 };
        clampSticker(s);
        list.push(s);
        undoStack.push({ t: 'st-add' });
        save();
        selectSticker(list.length - 1);
        sparkleSound();
        burst(x, y, ['✨']);
        updateProgress();
    }

    function resizeSticker(mul) {
        if (selSticker < 0) return;
        var s = stickers()[selSticker];
        var next = clamp(Math.round(s.r * mul), ST_MIN, ST_MAX);
        if (next === s.r) return;
        undoStack.push({ t: 'st-size', i: selSticker, r: s.r, x: s.x, y: s.y });
        s.r = next;
        clampSticker(s);   /* phóng to sát mép thì đẩy hình vào trong cho vừa */
        save();
        selectSticker(selSticker);
        updateProgress();
        tone(mul > 1 ? 880 : 520, 0.08, 'sine', 0.11);
    }

    function deleteSticker() {
        if (selSticker < 0) return;
        var list = stickers();
        var s = list[selSticker];
        undoStack.push({ t: 'st-del', i: selSticker, s: s });
        list.splice(selSticker, 1);
        save();
        selectSticker(-1);
        updateProgress();
        tone(300, 0.14, 'sine', 0.12);
    }

    $('stBigger').addEventListener('click', function () { resizeSticker(ST_STEP); });
    $('stSmaller').addEventListener('click', function () { resizeSticker(1 / ST_STEP); });
    $('stDelete').addEventListener('click', deleteSticker);
    $('stDone').addEventListener('click', function () { selectSticker(-1); });

    svg.addEventListener('pointerdown', function (evt) {
        if (busy) return;
        clearNudge();

        var p = svgPoint(evt);

        if (sticker) {
            var g = evt.target.closest ? evt.target.closest('.st') : null;
            if (g) { startDrag(+g.dataset.i, p, evt); return; }
            /* Chạm ra chỗ trống: đang chọn hình nào thì bỏ chọn hình đó trước.
               Nếu dán luôn hình mới thì mỗi lần bé chạm hụt lại thêm một hình. */
            if (selSticker >= 0) { selectSticker(-1); scheduleNudge(); return; }
            placeSticker(p.x, p.y);
            scheduleNudge();
            return;
        }

        var node = evt.target.closest ? evt.target.closest('.region') : null;
        if (!node) return;
        var idx = +node.dataset.i;
        if (paint(idx, color)) {
            burst(p.x, p.y, ['✨']);
            checkWin();
        }
        scheduleNudge();
    });

    function startDrag(i, p, evt) {
        selectSticker(i);
        var s = stickers()[i];
        drag = { i: i, dx: s.x - p.x, dy: s.y - p.y, x0: s.x, y0: s.y, moved: false };
        /* Bắt con trỏ ở cấp <svg>: mỗi lần vẽ lại là thẻ <g> của hình dán bị
           thay mới, nên không thể bắt con trỏ ở chính nó. */
        try { svg.setPointerCapture(evt.pointerId); } catch (e) { /* older browsers */ }
    }

    svg.addEventListener('pointermove', function (evt) {
        if (!drag) return;
        var p = svgPoint(evt);
        var s = stickers()[drag.i];
        if (!s) { drag = null; return; }
        s.x = p.x + drag.dx;
        s.y = p.y + drag.dy;
        clampSticker(s);
        if (Math.abs(s.x - drag.x0) + Math.abs(s.y - drag.y0) > 2) drag.moved = true;
        var g = svg.querySelector('.st[data-i="' + drag.i + '"]');
        if (g) g.setAttribute('transform', 'translate(' + s.x + ',' + s.y + ')');
    });

    function endDrag(evt) {
        if (!drag) return;
        if (drag.moved) {
            undoStack.push({ t: 'st-move', i: drag.i, x: drag.x0, y: drag.y0 });
            save();
            updateProgress();
        }
        try { svg.releasePointerCapture(evt.pointerId); } catch (e) { /* ignore */ }
        drag = null;
    }

    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    /* A single unfilled region breathes after a while. One, not all of them —
     * fifteen pulsing shapes reads as an error state, one reads as a hint. */
    function clearNudge() {
        var n = svg.querySelectorAll('.region.nudge');
        for (var i = 0; i < n.length; i++) n[i].classList.remove('nudge');
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    }

    function scheduleNudge() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(function () {
            var slot = slotFor(DRAWINGS[curIdx].id), open = [];
            DRAWINGS[curIdx].regions.forEach(function (r, i) { if (!slot.f[i]) open.push(i); });
            if (!open.length) return;
            var pick = open[Math.floor(Math.random() * open.length)];
            var node = svg.querySelector('.region[data-i="' + pick + '"]');
            if (node) node.classList.add('nudge');
        }, 7000);
    }

    /* ------------------------------------------------------------------ *
     * Finishing a picture
     * ------------------------------------------------------------------ */
    function checkWin() {
        var d = DRAWINGS[curIdx];
        if (filledCount() < d.regions.length) return;
        if (!store._done) store._done = [];
        if (store._done.indexOf(d.id) < 0) store._done.push(d.id);
        save();
        fanfare();
        confetti();
        $('winArt').innerHTML = thumbSvg(curIdx, 300);
        setTimeout(function () { winBox.classList.remove('hidden'); }, 420);
    }

    function confetti() {
        var colors = ['#ff5fa2', '#ffd166', '#7ec86a', '#7ec8ff', '#b8a4ff', '#ff9e5c'];
        for (var i = 0; i < 60; i++) {
            var el = document.createElement('div');
            el.className = 'confetti';
            el.style.left = Math.random() * 100 + 'vw';
            el.style.background = colors[i % colors.length];
            el.style.animationDuration = (2 + Math.random() * 1.6) + 's';
            el.style.animationDelay = (Math.random() * 0.5) + 's';
            document.body.appendChild(el);
            /* jshint -W083 */
            (function (node) { setTimeout(function () { node.remove(); }, 4200); }(el));
        }
    }

    /* ------------------------------------------------------------------ *
     * Thumbnails — show the child's own colours, so the gallery doubles as
     * "the pictures I have made".
     * ------------------------------------------------------------------ */
    function thumbSvg(i, size) {
        var d = DRAWINGS[i], slot = store[d.id] || { f: {}, s: [] };
        var regions = d.regions.map(function (r, k) {
            return '<path d="' + r.d + '" fill="' + ((slot.f && slot.f[k]) || '#ffffff') + '" stroke="' + INK
                 + '" stroke-width="' + STROKE + '" stroke-linejoin="round"/>';
        }).join('');
        var t = fitOf(i).t;
        return '<svg viewBox="0 0 400 400" width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg">'
             + defsMarkup() + '<rect width="400" height="400" fill="#fff"/>'
             + '<g transform="' + t + '">' + regions + decoMarkup(d) + '</g>'
             + stickerMarkup((slot.s) || []) + '</svg>';
    }

    function buildGallery() {
        var done = store._done || [];
        galleryGrid.innerHTML = DRAWINGS.map(function (d, i) {
            return '<div class="gal-item' + (i === curIdx ? ' sel' : '') + (done.indexOf(d.id) >= 0 ? ' gal-done' : '')
                 + '" data-i="' + i + '" role="button" tabindex="0" title="' + esc(nameOf(d)) + '">'
                 + thumbSvg(i, 150)
                 + '<div class="gal-name">' + esc(d.emoji + ' ' + nameOf(d)) + '</div></div>';
        }).join('');
    }

    galleryGrid.addEventListener('click', function (evt) {
        var item = evt.target.closest ? evt.target.closest('.gal-item') : null;
        if (!item) return;
        openDrawing(+item.dataset.i);
        gallery.classList.add('hidden');
        sparkleSound();
    });

    function openDrawing(i) {
        curIdx = ((i % DRAWINGS.length) + DRAWINGS.length) % DRAWINGS.length;
        undoStack = [];
        drag = null;
        selSticker = -1;
        $('stBar').hidden = true;
        store._last = DRAWINGS[curIdx].id;
        save();
        render();
    }

    /* ------------------------------------------------------------------ *
     * Swatches and stickers
     * ------------------------------------------------------------------ */
    function buildSwatches() {
        var html = COLORS.map(function (c) {
            return '<button class="swatch" data-c="' + c + '" style="background:' + c + '"'
                 + ' aria-label="' + c + '"></button>';
        }).join('');
        html += SPECIALS.map(function (sp) {
            var css = 'linear-gradient(160deg,' + sp.stops.map(function (s) { return s[1] + ' ' + (s[0] * 100) + '%'; }).join(',') + ')';
            return '<button class="swatch" data-c="url(#g-' + sp.id + ')" style="background:' + css + '"'
                 + ' aria-label="' + sp.id + '"></button>';
        }).join('');
        html += '<button class="swatch" data-c="url(#g-glitter)" aria-label="glitter" style="background:'
             + GLITTER.base + ';background-image:radial-gradient(#ffd166 22%,transparent 24%),radial-gradient(#ff9ec4 20%,transparent 22%);'
             + 'background-size:14px 14px,10px 10px;background-position:0 0,7px 7px"></button>';
        swatchBox.innerHTML = html;
        markSwatch();
    }

    function markSwatch() {
        var all = swatchBox.querySelectorAll('.swatch');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('sel', all[i].dataset.c === color);
    }

    swatchBox.addEventListener('click', function (evt) {
        var b = evt.target.closest ? evt.target.closest('.swatch') : null;
        if (!b) return;
        color = b.dataset.c;
        markSwatch();
        setStickerMode(false);
        tone(660, 0.07, 'sine', 0.10);
    });

    function buildStickers() {
        $('stTabs').innerHTML = STICKER_GROUPS.map(function (g, i) {
            return '<button class="st-tab' + (i === stGroup ? ' sel' : '') + '" data-g="' + i + '"'
                 + ' title="' + esc(T(g.vi, g.en)) + '" aria-label="' + esc(T(g.vi, g.en)) + '">'
                 + g.icon + '</button>';
        }).join('');
        drawStickerGrid();
    }

    function drawStickerGrid() {
        $('stGrid').innerHTML = STICKER_GROUPS[stGroup].items.map(function (e) {
            return '<button class="sticker-btn' + (e === sticker ? ' sel' : '') + '" data-e="' + esc(e) + '">'
                 + esc(e) + '</button>';
        }).join('');
    }

    stickerBox.addEventListener('click', function (evt) {
        var tab = evt.target.closest ? evt.target.closest('.st-tab') : null;
        if (tab) {
            stGroup = +tab.dataset.g;
            buildStickers();
            tone(700, 0.07, 'sine', 0.10);
            return;
        }

        var b = evt.target.closest ? evt.target.closest('.sticker-btn') : null;
        if (!b) return;
        sticker = b.dataset.e;
        var all = $('stGrid').querySelectorAll('.sticker-btn');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('sel', all[i] === b);
        sparkleSound();
    });

    function setStickerMode(on) {
        stickerBox.hidden = !on;
        swatchBox.hidden = on;
        $('btnSticker').classList.toggle('on', on);
        /* Chỉ ở chế độ hình dán thì hình dán mới bắt chạm — ngoài ra chúng phải
           "trong suốt" để bé tô được vùng nằm ngay dưới chúng. */
        svg.classList.toggle('sticker-mode', on);
        if (on) {
            if (!sticker) {
                sticker = STICKER_GROUPS[stGroup].items[0];
                drawStickerGrid();
            }
        } else {
            sticker = null;
            selectSticker(-1);
        }
    }

    /* ------------------------------------------------------------------ *
     * Tools
     * ------------------------------------------------------------------ */
    $('btnGallery').addEventListener('click', function () {
        buildGallery();
        gallery.classList.remove('hidden');
    });
    $('btnCloseGallery').addEventListener('click', function () { gallery.classList.add('hidden'); });

    $('btnUndo').addEventListener('click', function () {
        if (busy) return;
        var act = undoStack.pop();
        if (!act) return;
        var slot = slotFor(DRAWINGS[curIdx].id);

        if (act.t === 'fill') {
            if (act.prev) slot.f[act.i] = act.prev; else delete slot.f[act.i];
            var node = svg.querySelector('.region[data-i="' + act.i + '"]');
            if (node) node.setAttribute('fill', act.prev || '#ffffff');
        } else {
            /* Các thao tác hình dán được hoàn tác theo thứ tự ngược, nên một
               lần xoá luôn được trả lại trước những thao tác cũ hơn — chỉ số i
               trong các mục cũ vì thế vẫn trỏ đúng hình. */
            if (act.t === 'st-add') slot.s.pop();
            else if (act.t === 'st-del') slot.s.splice(act.i, 0, act.s);
            else if (act.t === 'st-move' && slot.s[act.i]) { slot.s[act.i].x = act.x; slot.s[act.i].y = act.y; }
            else if (act.t === 'st-size' && slot.s[act.i]) {
                slot.s[act.i].r = act.r;
                slot.s[act.i].x = act.x;   /* phóng to có thể đã đẩy hình vào trong */
                slot.s[act.i].y = act.y;
            }
            selectSticker(-1);
        }

        save();
        updateProgress();
        tone(330, 0.12, 'sine', 0.12);
    });

    $('btnSticker').addEventListener('click', function () {
        setStickerMode(stickerBox.hidden);
    });

    /* "Surprise" paints the remaining regions one at a time with the artwork's
     * own suggested colours. Little kids who freeze at a blank picture get an
     * instant beautiful result, and they can still recolour every part after. */
    $('btnSurprise').addEventListener('click', function () {
        if (busy) return;
        var d = DRAWINGS[curIdx], slot = slotFor(d.id);
        var todo = [];
        d.regions.forEach(function (r, i) { if (!slot.f[i]) todo.push(i); });
        if (!todo.length) { toast(T('Tranh đã tô kín rồi!', 'This picture is already full!')); return; }

        busy = true;
        clearNudge();
        var step = 0;
        var timer = setInterval(function () {
            if (step >= todo.length) {
                clearInterval(timer);
                busy = false;
                checkWin();
                return;
            }
            var i = todo[step++];
            paint(i, d.regions[i].hint);
        }, 110);
    });

    $('btnClear').addEventListener('click', function () {
        if (busy) return;
        var d = DRAWINGS[curIdx];
        if (!filledCount() && !slotFor(d.id).s.length) return;
        /* Bước xác nhận duy nhất của cả game: đây là thao tác chỉ có nó mới xoá
           được công sức của bé, nên phải hỏi lại. */
        if (!window.confirm(T('Xoá hết màu của tranh này và tô lại từ đầu nhé?',
                              'Clear all the colours on this picture and start again?'))) return;
        store[d.id] = { f: {}, s: [] };
        undoStack = [];
        drag = null;
        selectSticker(-1);
        save();
        render();
        tone(300, 0.2, 'sine', 0.12);
    });

    $('btnSave').addEventListener('click', function () { exportPng(); });
    $('btnWinSave').addEventListener('click', function () { exportPng(); });
    $('btnWinStay').addEventListener('click', function () { winBox.classList.add('hidden'); });
    $('btnWinNext').addEventListener('click', function () {
        winBox.classList.add('hidden');
        openDrawing(curIdx + 1);
    });

    $('btn-help').addEventListener('click', function () { helpBox.classList.remove('hidden'); });
    $('btnCloseHelp').addEventListener('click', function () { helpBox.classList.add('hidden'); });

    $('btn-sound').addEventListener('click', function () {
        soundOn = !soundOn;
        try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (e) { /* ignore */ }
        $('sound-icon').className = 'fa-solid ' + (soundOn ? 'fa-volume-high' : 'fa-volume-xmark');
        $('btn-sound').classList.toggle('muted', !soundOn);
        if (soundOn) tone(760, 0.12, 'sine', 0.14);
    });

    /* Chạm ra ngoài tấm thẻ thì đóng lớp phủ — trừ thư viện tranh lúc mới vào,
       vì đó là bước chọn tranh đầu tiên. */
    [gallery, winBox, helpBox].forEach(function (ov) {
        ov.addEventListener('click', function (evt) {
            if (evt.target === ov) ov.classList.add('hidden');
        });
    });

    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
    }

    /* ------------------------------------------------------------------ *
     * PNG export — redraw through Path2D rather than rasterising the SVG,
     * so the file is clean, crisp and never tainted.
     * ------------------------------------------------------------------ */
    function canvasPaint(ctx, path, value, bbox) {
        if (!isSpecial(value)) { ctx.fillStyle = value || '#ffffff'; ctx.fill(path); return; }

        var id = value.slice(6, -1);   // url(#g-xxx) → g-xxx
        if (id === 'g-glitter') {
            ctx.save();
            ctx.clip(path);
            ctx.fillStyle = GLITTER.base;
            ctx.fill(path);
            var t = GLITTER.tile;
            for (var gx = Math.floor(bbox.x / t) * t; gx < bbox.x + bbox.width; gx += t) {
                for (var gy = Math.floor(bbox.y / t) * t; gy < bbox.y + bbox.height; gy += t) {
                    GLITTER.dots.forEach(function (dt) {
                        ctx.beginPath();
                        ctx.arc(gx + dt[0], gy + dt[1], dt[2], 0, Math.PI * 2);
                        ctx.fillStyle = dt[3];
                        ctx.fill();
                    });
                }
            }
            ctx.restore();
            return;
        }

        var sp = SPECIALS.filter(function (s) { return 'g-' + s.id === id; })[0];
        if (!sp) { ctx.fillStyle = '#ffffff'; ctx.fill(path); return; }
        /* Khớp với x1/y1/x2/y2 của gradient trong <defs> (objectBoundingBox). */
        var grad = ctx.createLinearGradient(bbox.x, bbox.y, bbox.x + bbox.width * 0.4, bbox.y + bbox.height);
        sp.stops.forEach(function (s) { grad.addColorStop(s[0], s[1]); });
        ctx.fillStyle = grad;
        ctx.fill(path);
    }

    function exportPng() {
        var d = DRAWINGS[curIdx], slot = slotFor(d.id);
        var SIZE = 1200, k = SIZE / VIEW;
        var cv = document.createElement('canvas');
        cv.width = cv.height = SIZE;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        /* Cùng phép canh giữa với trên màn hình, để file lưu ra giống hệt bức
           bé nhìn thấy. Hình dán vẽ sau khi restore vì chúng ở hệ toạ độ gốc. */
        var fit = fitOf(curIdx);
        ctx.save();
        ctx.translate(fit.tx, fit.ty);
        ctx.scale(fit.k, fit.k);

        d.regions.forEach(function (r, i) {
            var p = new Path2D(r.d);
            var node = svg.querySelector('.region[data-i="' + i + '"]');
            var bbox = node ? node.getBBox() : { x: 0, y: 0, width: VIEW, height: VIEW };
            canvasPaint(ctx, p, slot.f[i], bbox);
            ctx.strokeStyle = INK;
            ctx.lineWidth = STROKE;
            ctx.stroke(p);
        });

        (d.deco || []).forEach(function (o) {
            var p = new Path2D(o.d);
            if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(p); }
            else { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.w; ctx.stroke(p); }
        });

        ctx.restore();

        slot.s.forEach(function (s) {
            ctx.font = s.r + 'px "Apple Color Emoji","Noto Color Emoji","Segoe UI Emoji",sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.e, s.x, s.y);
        });

        var fname = 'kibu-' + d.id + '.png';
        if (cv.toBlob) {
            cv.toBlob(function (blob) { download(URL.createObjectURL(blob), fname, true); }, 'image/png');
        } else {
            download(cv.toDataURL('image/png'), fname, false);
        }
        sparkleSound();
        toast(T('Đã lưu tranh vào máy 💾', 'Picture saved to your device 💾'));
    }

    function download(url, name, revoke) {
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (revoke) setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }

    /* ------------------------------------------------------------------ *
     * Start
     * ------------------------------------------------------------------ */
    function boot() {
        buildSwatches();
        buildStickers();

        $('sound-icon').className = 'fa-solid ' + (soundOn ? 'fa-volume-high' : 'fa-volume-xmark');
        $('btn-sound').classList.toggle('muted', !soundOn);

        var last = store._last ? DRAWINGS.map(function (d) { return d.id; }).indexOf(store._last) : -1;
        openDrawing(last >= 0 ? last : 0);

        buildGallery();
        /* Lần đầu vào thì mở sẵn thư viện để bé tự chọn tranh; những lần sau
           vào thẳng tranh đang tô dở. */
        if (last < 0) gallery.classList.remove('hidden');
        else gallery.classList.add('hidden');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
}());
