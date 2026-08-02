/* ============================================================================
 * Magic Coloring — the picture library
 * ----------------------------------------------------------------------------
 * Every picture is a list of *regions*: closed SVG paths a child taps to fill.
 * Nothing here is hand-written path soup — the shapes are composed from a few
 * primitives (circle, ellipse, rounded polygon, petal, star…) so the artwork
 * stays symmetric and clean, and a shape can be nudged by editing one number.
 *
 * Why regions instead of a paint brush: a 4-5 year old cannot stay inside the
 * lines, and a flood fill on a bitmap leaks through every gap in the outline.
 * Tapping a whole region means the picture always comes out looking good, which
 * is the entire point at this age.
 *
 * Each region carries a `hint` colour. It is never forced on the child — it
 * only drives the thumbnail preview and the "surprise me" button.
 *
 * Shapes are authored in a 400x400 box. Order matters: earlier = further back.
 * ==========================================================================*/
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.KibuArt = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ---------------------------------------------------------------- *
     * Shape primitives
     * ---------------------------------------------------------------- */
    var r1 = function (v) { return Math.round(v * 10) / 10; };
    var pt = function (x, y) { return r1(x) + ',' + r1(y); };

    function circle(cx, cy, r) {
        return 'M' + pt(cx - r, cy) + 'a' + r1(r) + ',' + r1(r) + ' 0 1,0 ' + r1(2 * r) + ',0'
             + 'a' + r1(r) + ',' + r1(r) + ' 0 1,0 ' + r1(-2 * r) + ',0Z';
    }

    function ellipse(cx, cy, rx, ry) {
        return 'M' + pt(cx - rx, cy) + 'a' + r1(rx) + ',' + r1(ry) + ' 0 1,0 ' + r1(2 * rx) + ',0'
             + 'a' + r1(rx) + ',' + r1(ry) + ' 0 1,0 ' + r1(-2 * rx) + ',0Z';
    }

    function rrect(x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        return 'M' + pt(x + r, y) + 'H' + r1(x + w - r)
             + 'A' + r1(r) + ',' + r1(r) + ' 0 0,1 ' + pt(x + w, y + r) + 'V' + r1(y + h - r)
             + 'A' + r1(r) + ',' + r1(r) + ' 0 0,1 ' + pt(x + w - r, y + h) + 'H' + r1(x + r)
             + 'A' + r1(r) + ',' + r1(r) + ' 0 0,1 ' + pt(x, y + h - r) + 'V' + r1(y + r)
             + 'A' + r1(r) + ',' + r1(r) + ' 0 0,1 ' + pt(x + r, y) + 'Z';
    }

    function poly(points, closed) {
        return 'M' + points.map(function (p) { return pt(p[0], p[1]); }).join('L')
             + (closed === false ? '' : 'Z');
    }

    /* Catmull-Rom through the given points, emitted as cubic beziers. This is
     * what makes hair, manes, clouds and tails look hand-drawn rather than
     * geometric — most organic shapes below are just a ring of points. */
    function smooth(points, closed, tension) {
        if (closed === undefined) closed = true;
        if (tension === undefined) tension = 1;
        var p = points, n = p.length;
        var at = function (i) { return p[((i % n) + n) % n]; };
        var pick = function (i) { return closed ? at(i) : p[Math.min(n - 1, Math.max(0, i))]; };
        var d = 'M' + pt(p[0][0], p[0][1]);
        var last = closed ? n : n - 1;
        for (var i = 0; i < last; i++) {
            var p0 = pick(i - 1), p1 = pick(i), p2 = pick(i + 1), p3 = pick(i + 2);
            var c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
            var c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
            d += 'C' + pt(c1[0], c1[1]) + ' ' + pt(c2[0], c2[1]) + ' ' + pt(p2[0], p2[1]);
        }
        return d + (closed ? 'Z' : '');
    }

    /* A teardrop petal growing from (cx,cy) towards `deg`. */
    function petal(cx, cy, deg, len, wid) {
        var a = deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
        var tipx = cx + ux * len, tipy = cy + uy * len;
        var m = 0.6;
        return 'M' + pt(cx, cy)
             + 'C' + pt(cx + px * wid, cy + py * wid) + ' ' + pt(tipx + px * wid * m, tipy + py * wid * m) + ' ' + pt(tipx, tipy)
             + 'C' + pt(tipx - px * wid * m, tipy - py * wid * m) + ' ' + pt(cx - px * wid, cy - py * wid) + ' ' + pt(cx, cy) + 'Z';
    }

    function star(cx, cy, outer, inner, points, rot) {
        var pts = [], n = points * 2;
        rot = (rot || -90) * Math.PI / 180;
        for (var i = 0; i < n; i++) {
            var a = rot + i * Math.PI / points, r = i % 2 ? inner : outer;
            pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
        }
        return poly(pts);
    }

    function heart(cx, cy, s) {
        return 'M' + pt(cx, cy + s * 0.95)
             + 'C' + pt(cx - s * 1.5, cy - s * 0.2) + ' ' + pt(cx - s * 0.9, cy - s * 1.15) + ' ' + pt(cx, cy - s * 0.42)
             + 'C' + pt(cx + s * 0.9, cy - s * 1.15) + ' ' + pt(cx + s * 1.5, cy - s * 0.2) + ' ' + pt(cx, cy + s * 0.95) + 'Z';
    }

    function drop(cx, cy, w, h) {
        return 'M' + pt(cx, cy - h)
             + 'C' + pt(cx + w, cy - h * 0.1) + ' ' + pt(cx + w, cy + h * 0.7) + ' ' + pt(cx, cy + h * 0.7)
             + 'C' + pt(cx - w, cy + h * 0.7) + ' ' + pt(cx - w, cy - h * 0.1) + ' ' + pt(cx, cy - h) + 'Z';
    }

    /* Half-ring, used for rainbow bands. */
    function band(cx, cy, ro, ri) {
        return 'M' + pt(cx - ro, cy) + 'A' + r1(ro) + ',' + r1(ro) + ' 0 0,1 ' + pt(cx + ro, cy)
             + 'L' + pt(cx + ri, cy) + 'A' + r1(ri) + ',' + r1(ri) + ' 0 0,0 ' + pt(cx - ri, cy) + 'Z';
    }

    function cloud(cx, cy, s) {
        return smooth([
            [cx - 52 * s, cy + 16 * s], [cx - 60 * s, cy - 2 * s], [cx - 42 * s, cy - 18 * s],
            [cx - 16 * s, cy - 30 * s], [cx + 12 * s, cy - 24 * s], [cx + 38 * s, cy - 16 * s],
            [cx + 58 * s, cy - 2 * s], [cx + 52 * s, cy + 16 * s]
        ]);
    }

    /* A vertical slice of an ellipse, bounded by the ellipse itself. Gives
     * stripes that sit exactly on a rounded body (bee, whale, beach ball)
     * instead of a rectangle poking out of the sides. */
    function ellipseBand(cx, cy, rx, ry, x0, x1, steps) {
        steps = steps || 10;
        var pts = [], i, x, dy;
        function edge(x) {
            var u = (x - cx) / rx;
            return ry * Math.sqrt(Math.max(0, 1 - u * u));
        }
        for (i = 0; i <= steps; i++) { x = x0 + (x1 - x0) * i / steps; pts.push([x, cy - edge(x)]); }
        for (i = steps; i >= 0; i--) { x = x0 + (x1 - x0) * i / steps; pts.push([x, cy + edge(x)]); }
        return poly(pts);
    }

    /* Two circles in one path. Region paths are filled with fill-rule="evenodd",
     * so the inner one punches a hole and the result is a ring. */
    function ring(cx, cy, outer, inner) {
        return circle(cx, cy, outer) + circle(cx, cy, inner);
    }

    /* Mirror a point list across x = 200, keeping the winding usable. */
    function flipX(points) {
        return points.map(function (p) { return [400 - p[0], p[1]]; });
    }

    /* ---------------------------------------------------------------- *
     * Shared eye / face parts — every character gets the same friendly
     * face so the whole set reads as one family.
     * ---------------------------------------------------------------- */
    var INK = '#4a3550';

    function eyes(lx, rx, y, r) {
        return [
            { d: circle(lx, y, r), fill: INK },
            { d: circle(rx, y, r), fill: INK },
            { d: circle(lx + r * 0.34, y - r * 0.38, r * 0.36), fill: '#ffffff' },
            { d: circle(rx + r * 0.34, y - r * 0.38, r * 0.36), fill: '#ffffff' }
        ];
    }

    function smile(cx, cy, w, h) {
        return { d: 'M' + pt(cx - w, cy) + 'Q' + pt(cx, cy + h) + ' ' + pt(cx + w, cy), stroke: INK, w: 5 };
    }

    /* ---------------------------------------------------------------- *
     * The pictures
     * ---------------------------------------------------------------- */
    var DRAWINGS = [];

    /* -- 1. Kitty ---------------------------------------------------- */
    DRAWINGS.push({
        id: 'kitty', emoji: '🐱', en: 'Sweet Kitty', vi: 'Mèo Con Dễ Thương',
        regions: [
            { d: smooth([[272, 364], [322, 372], [362, 336], [352, 280], [318, 274], [322, 320], [292, 330], [268, 328]]), hint: '#ffd6e7' },
            { d: ellipse(200, 330, 94, 68), hint: '#ffd6e7' },
            { d: ellipse(200, 348, 54, 44), hint: '#fff4f8' },
            { d: ellipse(158, 388, 30, 19), hint: '#fff4f8' },
            { d: ellipse(242, 388, 30, 19), hint: '#fff4f8' },
            { d: smooth([[126, 172], [110, 92], [188, 134]]), hint: '#ffd6e7' },
            { d: smooth([[274, 172], [290, 92], [212, 134]]), hint: '#ffd6e7' },
            { d: smooth([[140, 158], [132, 116], [176, 138]]), hint: '#ff9ec4' },
            { d: smooth([[260, 158], [268, 116], [224, 138]]), hint: '#ff9ec4' },
            { d: circle(200, 206, 104), hint: '#ffd6e7' },
            { d: ellipse(150, 236, 21, 13), hint: '#ff9ec4' },
            { d: ellipse(250, 236, 21, 13), hint: '#ff9ec4' },
            { d: smooth([[276, 86], [246, 62], [236, 88], [246, 112]]), hint: '#ff5fa2' },
            { d: smooth([[290, 86], [320, 62], [330, 88], [320, 112]]), hint: '#ff5fa2' },
            { d: circle(283, 87, 13), hint: '#ffe066' }
        ],
        deco: eyes(168, 232, 198, 14).concat([
            { d: heart(200, 228, 11), fill: '#ff7aa8' },
            smile(200, 246, 20, 14),
            { d: 'M' + pt(96, 214) + 'L' + pt(52, 202), stroke: INK, w: 4 },
            { d: 'M' + pt(96, 232) + 'L' + pt(50, 234), stroke: INK, w: 4 },
            { d: 'M' + pt(304, 214) + 'L' + pt(348, 202), stroke: INK, w: 4 },
            { d: 'M' + pt(304, 232) + 'L' + pt(350, 234), stroke: INK, w: 4 }
        ])
    });

    /* -- 2. Snow princess -------------------------------------------- */
    DRAWINGS.push({
        id: 'princess', emoji: '👸', en: 'Snow Princess', vi: 'Công Chúa Tuyết',
        regions: [
            { d: smooth([[200, 62], [268, 92], [286, 178], [278, 268], [246, 252], [242, 152], [200, 122], [158, 152], [154, 252], [122, 268], [114, 178], [132, 92]]), hint: '#f3e3ff' },
            { d: smooth([[200, 230], [272, 262], [300, 344], [312, 380], [88, 380], [100, 344], [128, 262]]), hint: '#d8ecff' },
            { d: smooth([[200, 236], [244, 250], [274, 316], [304, 376], [96, 376], [126, 316], [156, 250]]), hint: '#8fd8ff' },
            { d: smooth([[200, 236], [232, 246], [244, 288], [200, 300], [156, 288], [168, 246]]), hint: '#c9ecff' },
            { d: ellipse(154, 268, 25, 42), hint: '#a9e2ff' },
            { d: ellipse(246, 268, 25, 42), hint: '#a9e2ff' },
            { d: circle(146, 312, 17), hint: '#ffe0c6' },
            { d: circle(254, 312, 17), hint: '#ffe0c6' },
            { d: ellipse(200, 166, 52, 58), hint: '#ffe0c6' },
            { d: poly([[156, 108], [170, 68], [185, 96], [200, 56], [215, 96], [230, 68], [244, 108]]), hint: '#ffd166' },
            { d: circle(200, 78, 10), hint: '#7ee0ff' },
            { d: circle(170, 90, 8), hint: '#ff8fc4' },
            { d: circle(230, 90, 8), hint: '#ff8fc4' },
            { d: star(66, 132, 26, 11, 6), hint: '#bfe9ff' },
            { d: star(338, 108, 22, 9, 6), hint: '#bfe9ff' },
            { d: star(320, 226, 18, 8, 6), hint: '#bfe9ff' }
        ],
        deco: eyes(180, 220, 168, 12).concat([
            { d: ellipse(160, 186, 14, 9), fill: '#ffb3c7' },
            { d: ellipse(240, 186, 14, 9), fill: '#ffb3c7' },
            smile(200, 194, 15, 12)
        ])
    });

    /* -- 3. Unicorn --------------------------------------------------- */
    DRAWINGS.push({
        id: 'unicorn', emoji: '🦄', en: 'Rainbow Unicorn', vi: 'Kỳ Lân Cầu Vồng',
        regions: [
            { d: smooth([[164, 122], [120, 96], [98, 134], [132, 160], [162, 152]]), hint: '#b8a4ff' },
            { d: smooth([[236, 122], [280, 96], [302, 134], [268, 160], [238, 152]]), hint: '#ff9ec4' },
            { d: smooth([[126, 190], [74, 186], [62, 234], [98, 256], [132, 232]]), hint: '#ffd166' },
            { d: smooth([[274, 190], [326, 186], [338, 234], [302, 256], [268, 232]]), hint: '#ffd166' },
            { d: smooth([[124, 252], [72, 268], [78, 316], [120, 322], [140, 288]]), hint: '#7ec8ff' },
            { d: smooth([[276, 252], [328, 268], [322, 316], [280, 322], [260, 288]]), hint: '#7ec8ff' },
            { d: smooth([[152, 170], [136, 102], [194, 142]]), hint: '#fff4f8' },
            { d: smooth([[248, 170], [264, 102], [206, 142]]), hint: '#fff4f8' },
            { d: smooth([[159, 161], [151, 122], [186, 142]]), hint: '#ff9ec4' },
            { d: smooth([[241, 161], [249, 122], [214, 142]]), hint: '#ff9ec4' },
            { d: poly([[178, 154], [200, 40], [222, 154]]), hint: '#ffd166' },
            { d: smooth([[200, 146], [266, 178], [282, 248], [248, 316], [200, 334], [152, 316], [118, 248], [134, 178]]), hint: '#fff4f8' },
            { d: ellipse(200, 292, 58, 38), hint: '#ffe6ef' },
            { d: circle(122, 148, 21), hint: '#ff7aa8' }
        ],
        deco: eyes(170, 230, 232, 14).concat([
            { d: ellipse(146, 272, 16, 10), fill: '#ffb3c7' },
            { d: ellipse(254, 272, 16, 10), fill: '#ffb3c7' },
            { d: ellipse(184, 284, 8, 6), fill: INK },
            { d: ellipse(216, 284, 8, 6), fill: INK },
            smile(200, 300, 15, 11),
            { d: 'M' + pt(186, 130) + 'L' + pt(214, 130), stroke: INK, w: 3.5 },
            { d: 'M' + pt(190, 104) + 'L' + pt(210, 104), stroke: INK, w: 3.5 },
            { d: 'M' + pt(194, 78) + 'L' + pt(206, 78), stroke: INK, w: 3.5 },
            { d: circle(122, 148, 7), fill: '#ffd166' }
        ])
    });

    /* -- 4. Butterfly ------------------------------------------------- */
    DRAWINGS.push({
        id: 'butterfly', emoji: '🦋', en: 'Happy Butterfly', vi: 'Bươm Bướm Vui Vẻ',
        regions: [
            { d: smooth([[192, 176], [126, 92], [56, 108], [42, 178], [104, 214], [186, 208]]), hint: '#7ec8ff' },
            { d: smooth(flipX([[192, 176], [126, 92], [56, 108], [42, 178], [104, 214], [186, 208]])), hint: '#7ec8ff' },
            { d: smooth([[192, 214], [130, 232], [74, 282], [92, 344], [156, 336], [190, 276]]), hint: '#ff9ec4' },
            { d: smooth(flipX([[192, 214], [130, 232], [74, 282], [92, 344], [156, 336], [190, 276]])), hint: '#ff9ec4' },
            { d: circle(104, 152, 24), hint: '#ffd166' },
            { d: circle(296, 152, 24), hint: '#ffd166' },
            { d: circle(126, 292, 18), hint: '#b8a4ff' },
            { d: circle(274, 292, 18), hint: '#b8a4ff' },
            { d: circle(62, 168, 12), hint: '#ff7aa8' },
            { d: circle(338, 168, 12), hint: '#ff7aa8' },
            { d: ellipse(200, 236, 22, 86), hint: '#8f7bd6' },
            { d: circle(200, 138, 26), hint: '#8f7bd6' }
        ],
        deco: eyes(190, 212, 134, 8).concat([
            smile(201, 150, 11, 8),
            { d: 'M' + pt(186, 118) + 'Q' + pt(160, 84) + ' ' + pt(146, 62), stroke: INK, w: 5 },
            { d: 'M' + pt(214, 118) + 'Q' + pt(240, 84) + ' ' + pt(254, 62), stroke: INK, w: 5 },
            { d: circle(144, 58, 9), fill: INK },
            { d: circle(256, 58, 9), fill: INK }
        ])
    });

    /* -- 5. Flower ---------------------------------------------------- */
    (function () {
        var petals = [], hints = ['#ff9ec4', '#ffb3d1', '#ff9ec4', '#ffb3d1', '#ff9ec4', '#ffb3d1', '#ff9ec4', '#ffb3d1'];
        for (var i = 0; i < 8; i++) {
            petals.push({ d: petal(200, 158, i * 45 - 90, 104, 46), hint: hints[i] });
        }
        DRAWINGS.push({
            id: 'flower', emoji: '🌸', en: 'Smiling Flower', vi: 'Bông Hoa Tươi Cười',
            regions: petals.concat([
                { d: circle(200, 158, 52), hint: '#ffd166' },
                { d: rrect(190, 200, 20, 150, 10), hint: '#7ec86a' },
                { d: smooth([[196, 262], [150, 236], [110, 252], [126, 296], [180, 292]]), hint: '#7ec86a' },
                { d: smooth(flipX([[196, 296], [150, 270], [110, 286], [126, 330], [180, 326]])), hint: '#9ada86' },
                { d: rrect(126, 348, 148, 44, 16), hint: '#c98a5b' }
            ]),
            deco: eyes(184, 216, 152, 11).concat([
                { d: ellipse(168, 172, 12, 8), fill: '#ff8fb0' },
                { d: ellipse(232, 172, 12, 8), fill: '#ff8fb0' },
                smile(200, 172, 14, 12)
            ])
        });
    }());

    /* -- 6. Bunny ----------------------------------------------------- */
    DRAWINGS.push({
        id: 'bunny', emoji: '🐰', en: 'Fluffy Bunny', vi: 'Thỏ Bông Xinh',
        regions: [
            { d: ellipse(154, 66, 27, 62), hint: '#fff4f8' },
            { d: ellipse(246, 66, 27, 62), hint: '#fff4f8' },
            { d: ellipse(154, 70, 14, 42), hint: '#ffb3d1' },
            { d: ellipse(246, 70, 14, 42), hint: '#ffb3d1' },
            { d: circle(66, 318, 30), hint: '#ffe6ef' },
            { d: ellipse(200, 306, 88, 84), hint: '#fff4f8' },
            { d: ellipse(200, 318, 54, 60), hint: '#ffe6ef' },
            { d: ellipse(124, 296, 26, 42), hint: '#fff4f8' },
            { d: ellipse(276, 296, 26, 42), hint: '#fff4f8' },
            { d: ellipse(154, 374, 34, 22), hint: '#fff4f8' },
            { d: ellipse(246, 374, 34, 22), hint: '#fff4f8' },
            { d: circle(200, 174, 82), hint: '#fff4f8' },
            { d: ellipse(158, 196, 18, 12), hint: '#ffb3d1' },
            { d: ellipse(242, 196, 18, 12), hint: '#ffb3d1' },
            { d: smooth([[186, 246], [162, 230], [154, 250], [166, 268]]), hint: '#ff5fa2' },
            { d: smooth([[214, 246], [238, 230], [246, 250], [234, 268]]), hint: '#ff5fa2' },
            { d: circle(200, 250, 12), hint: '#ffd166' }
        ],
        deco: eyes(174, 226, 166, 12).concat([
            { d: heart(200, 190, 9), fill: '#ff7aa8' },
            smile(200, 204, 16, 12),
            { d: 'M' + pt(200, 204) + 'L' + pt(200, 196), stroke: INK, w: 4 }
        ])
    });

    /* -- 7. Cake ------------------------------------------------------ */
    DRAWINGS.push({
        id: 'cake', emoji: '🎂', en: 'Birthday Cake', vi: 'Bánh Sinh Nhật',
        regions: [
            { d: ellipse(200, 366, 158, 26), hint: '#dfe8ff' },
            { d: rrect(74, 286, 252, 74, 16), hint: '#ffd9a8' },
            { d: rrect(96, 216, 208, 74, 16), hint: '#ffc2dd' },
            { d: rrect(120, 152, 160, 68, 16), hint: '#fff0b8' },
            { d: smooth([[74, 292], [110, 312], [146, 288], [182, 312], [218, 288], [254, 312], [290, 288], [326, 308], [326, 282], [74, 282]]), hint: '#fff4f8' },
            { d: smooth([[96, 222], [130, 242], [166, 218], [202, 242], [238, 218], [274, 242], [304, 220], [304, 212], [96, 212]]), hint: '#fff4f8' },
            { d: rrect(146, 96, 16, 58, 7), hint: '#7ec8ff' },
            { d: rrect(192, 84, 16, 70, 7), hint: '#ff9ec4' },
            { d: rrect(238, 96, 16, 58, 7), hint: '#b8a4ff' },
            { d: drop(154, 84, 13, 22), hint: '#ffb703' },
            { d: drop(200, 72, 13, 22), hint: '#ffb703' },
            { d: drop(246, 84, 13, 22), hint: '#ffb703' },
            { d: circle(140, 254, 13), hint: '#ff5fa2' },
            { d: circle(200, 254, 13), hint: '#7ec86a' },
            { d: circle(260, 254, 13), hint: '#7ec8ff' },
            { d: heart(200, 176, 18), hint: '#ff5fa2' }
        ],
        deco: [
            { d: 'M' + pt(112, 324) + 'L' + pt(112, 348), stroke: INK, w: 4 },
            { d: 'M' + pt(200, 328) + 'L' + pt(200, 350), stroke: INK, w: 4 },
            { d: 'M' + pt(288, 324) + 'L' + pt(288, 348), stroke: INK, w: 4 }
        ]
    });

    /* -- 8. Castle ---------------------------------------------------- */
    DRAWINGS.push({
        id: 'castle', emoji: '🏰', en: 'Fairy Castle', vi: 'Lâu Đài Cổ Tích',
        regions: [
            { d: cloud(78, 82, 0.72), hint: '#e7f3ff' },
            { d: cloud(324, 62, 0.6), hint: '#e7f3ff' },
            { d: circle(340, 148, 30), hint: '#ffe066' },
            { d: rrect(40, 208, 74, 168, 8), hint: '#e9d6ff' },
            { d: rrect(286, 208, 74, 168, 8), hint: '#e9d6ff' },
            { d: rrect(128, 176, 144, 200, 8), hint: '#f6ecff' },
            { d: poly([[30, 210], [77, 122], [124, 210]]), hint: '#ff7aa8' },
            { d: poly([[276, 210], [323, 122], [370, 210]]), hint: '#ff7aa8' },
            { d: poly([[118, 178], [200, 66], [282, 178]]), hint: '#ff5fa2' },
            { d: 'M' + pt(168, 376) + 'V' + r1(300) + 'A32,32 0 0,1 ' + pt(232, 300) + 'V' + r1(376) + 'Z', hint: '#c98a5b' },
            { d: circle(77, 260, 20), hint: '#7ec8ff' },
            { d: circle(323, 260, 20), hint: '#7ec8ff' },
            { d: circle(200, 224, 24), hint: '#7ec8ff' },
            { d: poly([[200, 66], [200, 26], [252, 42], [200, 58]]), hint: '#ffd166' },
            { d: rrect(0, 372, 400, 28, 0), hint: '#9ada86' }
        ],
        deco: [
            { d: 'M' + pt(200, 300) + 'V' + r1(376), stroke: INK, w: 4 },
            { d: circle(216, 340, 6), fill: INK }
        ]
    });

    /* -- 9. Teddy bear ------------------------------------------------ */
    DRAWINGS.push({
        id: 'teddy', emoji: '🧸', en: 'Teddy Bear', vi: 'Gấu Bông',
        regions: [
            { d: circle(126, 116, 38), hint: '#d9a273' },
            { d: circle(274, 116, 38), hint: '#d9a273' },
            { d: circle(126, 116, 21), hint: '#f0cba6' },
            { d: circle(274, 116, 21), hint: '#f0cba6' },
            { d: ellipse(200, 300, 92, 88), hint: '#d9a273' },
            { d: ellipse(200, 310, 58, 62), hint: '#f0cba6' },
            { d: ellipse(112, 286, 30, 46), hint: '#d9a273' },
            { d: ellipse(288, 286, 30, 46), hint: '#d9a273' },
            { d: ellipse(150, 372, 38, 26), hint: '#d9a273' },
            { d: ellipse(250, 372, 38, 26), hint: '#d9a273' },
            { d: ellipse(150, 372, 20, 13), hint: '#f0cba6' },
            { d: ellipse(250, 372, 20, 13), hint: '#f0cba6' },
            { d: circle(200, 168, 86), hint: '#d9a273' },
            { d: ellipse(200, 200, 46, 34), hint: '#f0cba6' },
            { d: smooth([[186, 226], [158, 210], [150, 234], [164, 254]]), hint: '#ff5fa2' },
            { d: smooth([[214, 226], [242, 210], [250, 234], [236, 254]]), hint: '#ff5fa2' },
            { d: circle(200, 230, 13), hint: '#ffd166' }
        ],
        deco: eyes(172, 228, 158, 12).concat([
            { d: ellipse(200, 188, 14, 10), fill: INK },
            smile(200, 206, 16, 12),
            { d: 'M' + pt(200, 198) + 'L' + pt(200, 208), stroke: INK, w: 4 }
        ])
    });

    /* -- 10. Goldfish -------------------------------------------------- */
    DRAWINGS.push({
        id: 'fish', emoji: '🐠', en: 'Happy Fish', vi: 'Cá Vàng Tung Tăng',
        regions: [
            { d: smooth([[300, 208], [368, 148], [376, 268], [304, 234]]), hint: '#ff9e5c' },
            { d: smooth([[196, 148], [232, 118], [246, 160]]), hint: '#ffbe7d' },
            { d: smooth([[188, 268], [216, 306], [246, 264]]), hint: '#ffbe7d' },
            { d: ellipse(190, 214, 118, 84), hint: '#ffa94d' },
            { d: smooth([[136, 172], [172, 214], [136, 258], [108, 214]]), hint: '#ffd9a8' },
            { d: circle(224, 190, 22), hint: '#ffd166' },
            { d: circle(180, 250, 18), hint: '#ffd166' },
            { d: circle(252, 246, 15), hint: '#ffd166' },
            { d: circle(96, 96, 20), hint: '#bfe9ff' },
            { d: circle(140, 62, 14), hint: '#bfe9ff' },
            { d: circle(56, 142, 12), hint: '#bfe9ff' },
            { d: smooth([[38, 396], [26, 322], [58, 280], [76, 320], [58, 372], [72, 396]]), hint: '#7ec86a' },
            { d: smooth([[350, 396], [336, 336], [368, 300], [384, 342], [368, 380], [382, 396]]), hint: '#9ada86' }
        ],
        deco: [
            { d: circle(128, 196, 17), fill: '#ffffff' },
            { d: circle(128, 196, 10), fill: INK },
            { d: circle(132, 190, 4), fill: '#ffffff' },
            smile(126, 228, 14, 11)
        ]
    });

    /* -- 11. Ice cream ------------------------------------------------- */
    DRAWINGS.push({
        id: 'icecream', emoji: '🍦', en: 'Ice Cream', vi: 'Kem Ốc Quế',
        regions: [
            { d: poly([[136, 232], [264, 232], [200, 388]]), hint: '#e0a96d' },
            { d: circle(200, 200, 66), hint: '#ffc2dd' },
            { d: circle(146, 168, 54), hint: '#c9f0d4' },
            { d: circle(254, 168, 54), hint: '#fff0b8' },
            { d: circle(200, 116, 58), hint: '#d8c9ff' },
            { d: smooth([[142, 116], [172, 132], [200, 112], [230, 132], [258, 116], [258, 96], [142, 96]]), hint: '#fff4f8' },
            { d: circle(200, 52, 20), hint: '#ff5fa2' },
            { d: rrect(196, 22, 8, 18, 4), hint: '#7ec86a' },
            { d: circle(120, 250, 13), hint: '#ff9ec4' },
            { d: circle(280, 250, 13), hint: '#7ec8ff' },
            { d: star(72, 128, 24, 10, 5), hint: '#ffd166' },
            { d: star(330, 268, 20, 8, 5), hint: '#ffd166' }
        ],
        deco: eyes(178, 222, 296, 11).concat([
            { d: ellipse(160, 314, 12, 8), fill: '#ffb3c7' },
            { d: ellipse(240, 314, 12, 8), fill: '#ffb3c7' },
            smile(200, 314, 14, 12),
            { d: 'M' + pt(160, 262) + 'L' + pt(226, 262), stroke: INK, w: 3.5 },
            { d: 'M' + pt(150, 292) + 'L' + pt(200, 292), stroke: INK, w: 3.5 }
        ])
    });

    /* -- 12. Rainbow --------------------------------------------------- */
    (function () {
        var colors = ['#ff6b6b', '#ff9e5c', '#ffd166', '#7ec86a', '#7ec8ff', '#b8a4ff'];
        var regions = [];
        for (var i = 0; i < 6; i++) {
            regions.push({ d: band(200, 322, 186 - i * 26, 162 - i * 26), hint: colors[i] });
        }
        DRAWINGS.push({
            id: 'rainbow', emoji: '🌈', en: 'Big Rainbow', vi: 'Cầu Vồng Rực Rỡ',
            regions: regions.concat([
                { d: cloud(70, 300, 1.05), hint: '#e7f3ff' },
                { d: cloud(330, 300, 1.05), hint: '#e7f3ff' },
                { d: circle(200, 96, 42), hint: '#ffe066' },
                { d: drop(112, 366, 13, 22), hint: '#7ec8ff' },
                { d: drop(288, 366, 13, 22), hint: '#7ec8ff' },
                { d: star(46, 118, 24, 10, 5), hint: '#ffd166' },
                { d: star(352, 148, 20, 8, 5), hint: '#ffd166' }
            ]),
            deco: eyes(186, 214, 92, 9).concat([
                { d: ellipse(172, 106, 11, 7), fill: '#ffb3c7' },
                { d: ellipse(228, 106, 11, 7), fill: '#ffb3c7' },
                smile(200, 106, 12, 10)
            ])
        });
    }());

    /* -- 13. Owl ------------------------------------------------------- */
    DRAWINGS.push({
        id: 'owl', emoji: '🦉', en: 'Wise Owl', vi: 'Cú Mèo Thông Thái',
        regions: [
            { d: rrect(20, 340, 360, 26, 13), hint: '#c98a5b' },
            { d: smooth([[196, 68], [268, 106], [286, 218], [246, 320], [200, 336], [154, 320], [114, 218], [132, 106]]), hint: '#b8a4ff' },
            { d: smooth([[200, 186], [246, 216], [250, 288], [200, 322], [150, 288], [154, 216]]), hint: '#e9dcff' },
            { d: smooth([[124, 148], [96, 216], [110, 288], [142, 296], [136, 208]]), hint: '#8f7bd6' },
            { d: smooth([[276, 148], [304, 216], [290, 288], [258, 296], [264, 208]]), hint: '#8f7bd6' },
            { d: poly([[122, 96], [126, 44], [172, 84]]), hint: '#b8a4ff' },
            { d: poly([[278, 96], [274, 44], [228, 84]]), hint: '#b8a4ff' },
            { d: circle(160, 168, 46), hint: '#fff4f8' },
            { d: circle(240, 168, 46), hint: '#fff4f8' },
            { d: poly([[200, 196], [180, 218], [220, 218]]), hint: '#ffb703' },
            { d: ellipse(166, 348, 26, 16), hint: '#ffb703' },
            { d: ellipse(234, 348, 26, 16), hint: '#ffb703' },
            { d: smooth([[64, 320], [30, 292], [50, 268], [78, 292]]), hint: '#7ec86a' },
            { d: smooth([[336, 320], [370, 292], [350, 268], [322, 292]]), hint: '#7ec86a' }
        ],
        deco: [
            { d: circle(160, 168, 24), fill: INK },
            { d: circle(240, 168, 24), fill: INK },
            { d: circle(168, 160, 9), fill: '#ffffff' },
            { d: circle(248, 160, 9), fill: '#ffffff' },
            { d: 'M' + pt(170, 244) + 'Q' + pt(200, 258) + ' ' + pt(230, 244), stroke: INK, w: 4 },
            { d: 'M' + pt(166, 276) + 'Q' + pt(200, 290) + ' ' + pt(234, 276), stroke: INK, w: 4 }
        ]
    });

    /* -- 14. Panda ----------------------------------------------------- */
    DRAWINGS.push({
        id: 'panda', emoji: '🐼', en: 'Baby Panda', vi: 'Gấu Trúc Bé Bỏng',
        regions: [
            { d: circle(122, 108, 40), hint: '#5c5470' },
            { d: circle(278, 108, 40), hint: '#5c5470' },
            { d: ellipse(200, 300, 94, 86), hint: '#fff4f8' },
            { d: ellipse(108, 292, 30, 48), hint: '#5c5470' },
            { d: ellipse(292, 292, 30, 48), hint: '#5c5470' },
            { d: ellipse(152, 374, 36, 24), hint: '#5c5470' },
            { d: ellipse(248, 374, 36, 24), hint: '#5c5470' },
            { d: circle(200, 174, 92), hint: '#fff4f8' },
            { d: ellipse(162, 176, 30, 34), hint: '#5c5470' },
            { d: ellipse(238, 176, 30, 34), hint: '#5c5470' },
            { d: ellipse(152, 216, 16, 10), hint: '#ffb3c7' },
            { d: ellipse(248, 216, 16, 10), hint: '#ffb3c7' },
            { d: rrect(316, 196, 14, 190, 7), hint: '#7ec86a' },
            { d: smooth([[322, 246], [366, 224], [382, 254], [340, 268]]), hint: '#9ada86' },
            { d: smooth([[322, 306], [366, 284], [382, 314], [340, 328]]), hint: '#9ada86' }
        ],
        deco: [
            { d: circle(162, 176, 13), fill: '#ffffff' },
            { d: circle(238, 176, 13), fill: '#ffffff' },
            { d: circle(164, 178, 8), fill: INK },
            { d: circle(240, 178, 8), fill: INK },
            { d: ellipse(200, 216, 15, 11), fill: INK },
            smile(200, 236, 17, 13)
        ]
    });

    /* -- 15. Mermaid --------------------------------------------------- */
    DRAWINGS.push({
        id: 'mermaid', emoji: '🧜‍♀️', en: 'Little Mermaid', vi: 'Nàng Tiên Cá',
        regions: [
            { d: smooth([[200, 52], [270, 86], [286, 176], [274, 250], [244, 236], [242, 140], [200, 112], [158, 140], [156, 236], [126, 250], [114, 176], [130, 86]]), hint: '#ff9e5c' },
            { d: ellipse(200, 156, 50, 56), hint: '#ffe0c6' },
            { d: smooth([[200, 210], [238, 226], [244, 268], [200, 284], [156, 268], [162, 226]]), hint: '#ffe0c6' },
            { d: ellipse(178, 224, 24, 18), hint: '#7ee0d0' },
            { d: ellipse(222, 224, 24, 18), hint: '#7ee0d0' },
            { d: smooth([[200, 276], [244, 300], [246, 348], [206, 372], [162, 350], [156, 300]]), hint: '#4fd1c5' },
            { d: smooth([[196, 360], [252, 380], [300, 348], [312, 392], [232, 398], [174, 396], [104, 398], [116, 350], [156, 382]]), hint: '#7ee0d0' },
            { d: ellipse(128, 262, 22, 34), hint: '#ffe0c6' },
            { d: ellipse(272, 262, 22, 34), hint: '#ffe0c6' },
            { d: star(316, 156, 30, 14, 5), hint: '#ff7aa8' },
            { d: circle(62, 118, 18), hint: '#bfe9ff' },
            { d: circle(96, 74, 12), hint: '#bfe9ff' },
            { d: circle(46, 176, 11), hint: '#bfe9ff' },
            { d: circle(146, 96, 15), hint: '#ffd166' }
        ],
        deco: eyes(180, 220, 158, 12).concat([
            { d: ellipse(160, 178, 13, 9), fill: '#ffb3c7' },
            { d: ellipse(240, 178, 13, 9), fill: '#ffb3c7' },
            smile(200, 184, 14, 12)
        ])
    });

    /* -- 16. Hot air balloon ------------------------------------------- */
    DRAWINGS.push({
        id: 'balloon', emoji: '🎈', en: 'Sky Balloon', vi: 'Khinh Khí Cầu',
        regions: [
            { d: cloud(66, 292, 0.68), hint: '#e7f3ff' },
            { d: cloud(338, 240, 0.62), hint: '#e7f3ff' },
            { d: circle(56, 74, 28), hint: '#ffe066' },
            { d: smooth([[200, 40], [278, 84], [286, 180], [232, 250], [168, 250], [114, 180], [122, 84]]), hint: '#ff7aa8' },
            { d: 'M' + pt(200, 40) + 'C' + pt(168, 78) + ' ' + pt(150, 150) + ' ' + pt(168, 250)
                 + 'L' + pt(200, 250) + 'C' + pt(190, 150) + ' ' + pt(192, 78) + ' ' + pt(200, 40) + 'Z', hint: '#ffd166' },
            { d: 'M' + pt(200, 40) + 'C' + pt(232, 78) + ' ' + pt(250, 150) + ' ' + pt(232, 250)
                 + 'L' + pt(200, 250) + 'C' + pt(210, 150) + ' ' + pt(208, 78) + ' ' + pt(200, 40) + 'Z', hint: '#7ec8ff' },
            { d: rrect(168, 250, 64, 20, 8), hint: '#ffb703' },
            { d: 'M' + pt(158, 318) + 'L' + pt(170, 268) + 'H' + r1(230) + 'L' + pt(242, 318) + 'Z', hint: '#c98a5b' },
            { d: star(340, 92, 22, 9, 5), hint: '#ffd166' },
            { d: star(300, 328, 18, 7, 5), hint: '#ffd166' },
            { d: heart(200, 152, 26), hint: '#fff4f8' }
        ],
        deco: [
            { d: 'M' + pt(176, 270) + 'L' + pt(176, 250), stroke: INK, w: 4 },
            { d: 'M' + pt(224, 270) + 'L' + pt(224, 250), stroke: INK, w: 4 },
            { d: 'M' + pt(322, 148) + 'q13,-12 26,0m0,0q13,-12 26,0', stroke: INK, w: 4 },
            { d: 'M' + pt(46, 186) + 'q11,-10 22,0m0,0q11,-10 22,0', stroke: INK, w: 4 }
        ]
    });

    /* ================================================================ *
     * Bộ thứ hai — nghiêng về cảnh có chuyển động (voi phun nước, tàu bay,
     * cá voi phun vòi) thay vì chân dung đứng yên như bộ đầu.
     * ================================================================ */

    /* -- 17. Elephant -------------------------------------------------- */
    DRAWINGS.push({
        id: 'elephant', emoji: '🐘', en: 'Splashing Elephant', vi: 'Voi Con Tắm Mát',
        regions: [
            { d: ellipse(104, 200, 48, 66), hint: '#b7c4e0' },
            { d: ellipse(296, 200, 48, 66), hint: '#b7c4e0' },
            { d: ellipse(104, 200, 27, 40), hint: '#f0b9cd' },
            { d: ellipse(296, 200, 27, 40), hint: '#f0b9cd' },
            { d: ellipse(200, 318, 112, 74), hint: '#9fb0d4' },
            { d: rrect(126, 362, 58, 38, 17), hint: '#9fb0d4' },
            { d: rrect(216, 362, 58, 38, 17), hint: '#9fb0d4' },
            { d: circle(200, 196, 100), hint: '#b7c4e0' },
            { d: smooth([[176, 256], [168, 318], [186, 364], [226, 380], [246, 352], [224, 340], [204, 332], [198, 306], [210, 260]]), hint: '#b7c4e0' },
            { d: drop(278, 296, 16, 28), hint: '#7ec8ff' },
            { d: drop(312, 256, 13, 22), hint: '#7ec8ff' },
            { d: drop(330, 312, 11, 19), hint: '#bfe9ff' },
            { d: ellipse(142, 244, 21, 14), hint: '#f0b9cd' },
            { d: ellipse(258, 244, 21, 14), hint: '#f0b9cd' }
        ],
        deco: eyes(168, 232, 194, 14)
    });

    /* -- 18. Penguin --------------------------------------------------- */
    DRAWINGS.push({
        id: 'penguin', emoji: '🐧', en: 'Snowy Penguin', vi: 'Chim Cánh Cụt',
        regions: [
            { d: rrect(20, 356, 360, 30, 15), hint: '#e7f3ff' },
            { d: smooth([[200, 92], [270, 146], [282, 256], [244, 340], [200, 352], [156, 340], [118, 256], [130, 146]]), hint: '#5c5470' },
            { d: smooth([[126, 178], [96, 246], [108, 312], [140, 314], [136, 226]]), hint: '#5c5470' },
            { d: smooth([[274, 178], [304, 246], [292, 312], [260, 314], [264, 226]]), hint: '#5c5470' },
            { d: ellipse(200, 254, 66, 90), hint: '#fff8ee' },
            { d: ellipse(200, 158, 56, 50), hint: '#fff8ee' },
            { d: poly([[200, 176], [174, 192], [200, 208], [226, 192]]), hint: '#ffb703' },
            { d: ellipse(168, 366, 30, 16), hint: '#ffb703' },
            { d: ellipse(232, 366, 30, 16), hint: '#ffb703' },
            { d: smooth([[132, 108], [200, 76], [268, 108], [262, 126], [138, 126]]), hint: '#ff5fa2' },
            { d: circle(200, 62, 22), hint: '#ff9ec4' },
            { d: rrect(138, 212, 124, 28, 13), hint: '#7ec8ff' },
            { d: smooth([[250, 232], [292, 248], [286, 308], [258, 302], [260, 254]]), hint: '#7ec8ff' },
            { d: star(58, 128, 22, 9, 6), hint: '#bfe9ff' },
            { d: star(342, 168, 18, 8, 6), hint: '#bfe9ff' }
        ],
        deco: eyes(180, 220, 152, 11).concat([
            { d: ellipse(160, 176, 12, 8), fill: '#ffb3c7' },
            { d: ellipse(240, 176, 12, 8), fill: '#ffb3c7' }
        ])
    });

    /* -- 19. Bee ------------------------------------------------------- */
    DRAWINGS.push({
        id: 'bee', emoji: '🐝', en: 'Busy Bee', vi: 'Ong Chăm Chỉ',
        regions: [
            { d: smooth([[196, 142], [246, 92], [292, 108], [270, 152], [216, 166]]), hint: '#cfefff' },
            { d: smooth([[196, 148], [244, 158], [286, 198], [246, 214], [204, 180]]), hint: '#cfefff' },
            { d: ellipse(186, 208, 88, 66), hint: '#ffd166' },
            { d: ellipseBand(186, 208, 88, 66, 152, 190), hint: '#4a3550' },
            { d: ellipseBand(186, 208, 88, 66, 214, 250), hint: '#4a3550' },
            { d: poly([[268, 190], [312, 208], [268, 226]]), hint: '#5c5470' },
            { d: circle(104, 200, 46), hint: '#5c5470' },
            { d: petal(316, 318, -90, 44, 22), hint: '#ff9ec4' },
            { d: petal(316, 318, -18, 44, 22), hint: '#ff9ec4' },
            { d: petal(316, 318, 54, 44, 22), hint: '#ff9ec4' },
            { d: petal(316, 318, 126, 44, 22), hint: '#ff9ec4' },
            { d: petal(316, 318, 198, 44, 22), hint: '#ff9ec4' },
            { d: circle(316, 318, 22), hint: '#ffd166' },
            { d: rrect(310, 336, 12, 62, 6), hint: '#7ec86a' }
        ],
        deco: [
            { d: circle(90, 192, 11), fill: '#ffffff' },
            { d: circle(90, 192, 7), fill: INK },
            { d: circle(118, 192, 11), fill: '#ffffff' },
            { d: circle(118, 192, 7), fill: INK },
            smile(104, 214, 12, 9),
            { d: 'M' + pt(88, 160) + 'Q' + pt(72, 132) + ' ' + pt(58, 124), stroke: INK, w: 4 },
            { d: 'M' + pt(116, 158) + 'Q' + pt(112, 126) + ' ' + pt(100, 112), stroke: INK, w: 4 },
            { d: circle(56, 120, 8), fill: INK },
            { d: circle(98, 108, 8), fill: INK }
        ]
    });

    /* -- 20. Rocket ---------------------------------------------------- */
    DRAWINGS.push({
        id: 'rocket', emoji: '🚀', en: 'Space Rocket', vi: 'Tàu Vũ Trụ',
        regions: [
            { d: star(62, 92, 26, 11, 5), hint: '#ffd166' },
            { d: star(340, 128, 20, 8, 5), hint: '#ffd166' },
            { d: star(88, 300, 17, 7, 5), hint: '#ffd166' },
            { d: circle(324, 296, 42), hint: '#b8a4ff' },
            { d: smooth([[164, 214], [116, 262], [126, 306], [172, 288]]), hint: '#ff5fa2' },
            { d: smooth([[236, 214], [284, 262], [274, 306], [228, 288]]), hint: '#ff5fa2' },
            { d: smooth([[200, 32], [244, 128], [244, 288], [156, 288], [156, 128]]), hint: '#fff4f8' },
            { d: poly([[200, 32], [244, 132], [156, 132]]), hint: '#ff5fa2' },
            { d: circle(200, 186, 44), hint: '#7ec8ff' },
            { d: rrect(160, 282, 80, 22, 10), hint: '#ffb703' },
            { d: smooth([[168, 302], [232, 302], [222, 348], [200, 384], [178, 348]]), hint: '#ffb703' },
            { d: smooth([[182, 306], [218, 306], [210, 340], [200, 362], [190, 340]]), hint: '#ff6b6b' }
        ],
        deco: eyes(186, 214, 182, 11).concat([
            smile(200, 198, 13, 10),
            { d: circle(200, 186, 30), fill: 'none', stroke: '#ffffff', w: 5 }
        ])
    });

    /* -- 21. Whale ----------------------------------------------------- */
    DRAWINGS.push({
        id: 'whale', emoji: '🐳', en: 'Spouting Whale', vi: 'Cá Voi Phun Nước',
        regions: [
            { d: smooth([[188, 176], [278, 196], [316, 268], [268, 330], [150, 330], [92, 274], [116, 202]]), hint: '#7ec8ff' },
            { d: smooth([[178, 262], [268, 274], [260, 322], [162, 322], [126, 292]]), hint: '#e7f3ff' },
            { d: smooth([[306, 232], [368, 182], [382, 268], [342, 300], [304, 282]]), hint: '#4aa8ff' },
            { d: smooth([[176, 296], [216, 316], [200, 350], [160, 340]]), hint: '#4aa8ff' },
            { d: smooth([[156, 186], [142, 138], [152, 98], [186, 84], [210, 104], [184, 116], [172, 146], [180, 188]]), hint: '#bfe9ff' },
            { d: circle(180, 82, 20), hint: '#bfe9ff' },
            { d: circle(224, 62, 15), hint: '#bfe9ff' },
            { d: circle(146, 54, 12), hint: '#bfe9ff' },
            { d: rrect(16, 356, 368, 34, 17), hint: '#4fd1c5' },
            { d: smooth([[46, 356], [86, 336], [126, 356], [166, 336], [206, 356], [246, 336], [286, 356], [326, 336], [360, 352], [360, 372], [40, 372]]), hint: '#7ee0d0' },
            { d: star(330, 122, 20, 8, 5), hint: '#ffd166' },
            { d: star(76, 132, 16, 7, 5), hint: '#ffd166' }
        ],
        deco: [
            { d: circle(148, 226, 14), fill: '#ffffff' },
            { d: circle(148, 226, 9), fill: INK },
            { d: circle(152, 221, 4), fill: '#ffffff' },
            { d: ellipse(126, 258, 15, 10), fill: '#ffb3c7' },
            smile(150, 254, 14, 11)
        ]
    });

    /* -- 22. Ferris wheel ---------------------------------------------- */
    (function () {
        var cx = 200, cy = 186, R = 138;
        var cabs = [], spokes = [];
        var hints = ['#ff5fa2', '#ffd166', '#7ec86a', '#7ec8ff', '#b8a4ff', '#ff9e5c'];
        /* Ba thanh nan bắc qua tâm cho ra sáu nhánh. Trước đây tôi dùng hai
           tam giác to, nhìn ra hai cánh buồm chứ không ra nan hoa. */
        for (var s = 0; s < 3; s++) {
            var sa = (s * 60) * Math.PI / 180, w = 7;
            var ux = Math.cos(sa), uy = Math.sin(sa), px = -uy, py = ux;
            spokes.push({
                d: poly([
                    [cx + ux * R + px * w, cy + uy * R + py * w],
                    [cx + ux * R - px * w, cy + uy * R - py * w],
                    [cx - ux * R - px * w, cy - uy * R - py * w],
                    [cx - ux * R + px * w, cy - uy * R + py * w]
                ]), hint: '#b8a4ff'
            });
        }
        for (var i = 0; i < 6; i++) {
            var a = (i * 60 - 90) * Math.PI / 180;
            cabs.push({ d: rrect(cx + Math.cos(a) * R - 25, cy + Math.sin(a) * R - 20, 50, 42, 12), hint: hints[i] });
        }
        DRAWINGS.push({
            id: 'ferris', emoji: '🎡', en: 'Ferris Wheel', vi: 'Vòng Đu Quay',
            regions: [
                { d: ring(cx, cy, R, R - 15), hint: '#e9dcff' }
            ].concat(spokes).concat(cabs).concat([
                { d: circle(cx, cy, 26), hint: '#ffd166' },
                { d: poly([[cx - 12, cy], [cx + 12, cy], [cx + 68, cy + 178], [cx + 36, cy + 178]]), hint: '#c98a5b' },
                { d: poly([[cx + 12, cy], [cx - 12, cy], [cx - 68, cy + 178], [cx - 36, cy + 178]]), hint: '#c98a5b' },
                { d: rrect(70, 358, 260, 30, 14), hint: '#9ada86' }
            ]),
            deco: [{ d: circle(cx, cy, 10), fill: INK }]
        });
    }());

    /* -- 23. Carousel horse -------------------------------------------- */
    DRAWINGS.push({
        id: 'carousel', emoji: '🎠', en: 'Carousel Horse', vi: 'Ngựa Đu Quay',
        regions: [
            { d: rrect(190, 30, 20, 344, 10), hint: '#ffd166' },
            { d: poly([[200, 6], [312, 78], [88, 78]]), hint: '#ff5fa2' },
            { d: smooth([[88, 78], [124, 100], [160, 78], [200, 100], [240, 78], [276, 100], [312, 78], [312, 66], [88, 66]]), hint: '#fff4f8' },
            { d: circle(200, 8, 15), hint: '#ffd166' },
            /* Ngựa nhìn nghiêng, quay sang phải: mình — cổ — đầu phải nối liền
               nhau, nếu để rời thì ra một cục tròn chứ không ra con ngựa. */
            { d: smooth([[126, 250], [86, 218], [66, 258], [98, 288]]), hint: '#b8a4ff' },
            { d: rrect(126, 288, 26, 84, 12), hint: '#fff4f8' },
            { d: rrect(238, 288, 26, 84, 12), hint: '#fff4f8' },
            { d: ellipse(188, 254, 88, 56), hint: '#fff4f8' },
            { d: rrect(162, 288, 26, 84, 12), hint: '#fff4f8' },
            { d: rrect(206, 288, 26, 84, 12), hint: '#fff4f8' },
            { d: smooth([[240, 244], [258, 190], [286, 158], [312, 168], [292, 200], [272, 246]]), hint: '#fff4f8' },
            { d: smooth([[286, 156], [322, 144], [344, 162], [340, 188], [312, 194], [288, 184]]), hint: '#fff4f8' },
            { d: poly([[294, 152], [300, 122], [318, 148]]), hint: '#fff4f8' },
            { d: smooth([[262, 176], [290, 130], [312, 142], [292, 186]]), hint: '#b8a4ff' },
            { d: smooth([[168, 220], [216, 226], [220, 262], [172, 258]]), hint: '#ff9ec4' },
            { d: rrect(96, 366, 208, 26, 12), hint: '#7ec8ff' }
        ],
        deco: [
            { d: circle(316, 166, 9), fill: INK },
            { d: circle(319, 162, 3), fill: '#ffffff' },
            { d: ellipse(340, 176, 6, 4), fill: INK },
            { d: 'M' + pt(330, 186) + 'q9,3 12,-3', stroke: INK, w: 3.5 }
        ]
    });

    /* -- 24. Candy house ----------------------------------------------- */
    DRAWINGS.push({
        id: 'candyhouse', emoji: '🍭', en: 'Candy House', vi: 'Nhà Kẹo Ngọt',
        regions: [
            { d: rrect(0, 350, 400, 50, 0), hint: '#c9f0d4' },
            { d: rrect(96, 208, 208, 152, 14), hint: '#ffe3b0' },
            { d: poly([[74, 212], [200, 96], [326, 212]]), hint: '#ff9ec4' },
            { d: smooth([[74, 216], [112, 240], [150, 214], [188, 240], [226, 214], [264, 240], [302, 214], [326, 232], [326, 206], [74, 206]]), hint: '#fff4f8' },
            { d: 'M' + pt(168, 360) + 'V' + r1(288) + 'A32,32 0 0,1 ' + pt(232, 288) + 'V' + r1(360) + 'Z', hint: '#c98a5b' },
            { d: circle(132, 262, 24), hint: '#7ec8ff' },
            { d: circle(268, 262, 24), hint: '#7ec8ff' },
            { d: circle(200, 148, 20), hint: '#ffd166' },
            { d: circle(44, 268, 34), hint: '#ff5fa2' },
            { d: rrect(38, 300, 12, 62, 6), hint: '#fff4f8' },
            { d: circle(356, 288, 28), hint: '#b8a4ff' },
            { d: rrect(350, 314, 11, 50, 5), hint: '#fff4f8' },
            { d: rrect(76, 320, 16, 44, 8), hint: '#ff6b6b' },
            { d: rrect(310, 330, 16, 34, 8), hint: '#7ec86a' },
            { d: cloud(320, 92, 0.66), hint: '#e7f3ff' }
        ],
        deco: [
            { d: circle(214, 326, 6), fill: INK },
            { d: 'M' + pt(200, 288) + 'V' + r1(360), stroke: INK, w: 4 }
        ]
    });

    /* -- 25. Snowman --------------------------------------------------- */
    DRAWINGS.push({
        id: 'snowman', emoji: '⛄', en: 'Happy Snowman', vi: 'Người Tuyết',
        regions: [
            { d: rrect(0, 348, 400, 52, 0), hint: '#e7f3ff' },
            { d: circle(200, 306, 88), hint: '#fff8ee' },
            { d: circle(200, 202, 66), hint: '#fff8ee' },
            { d: circle(200, 118, 50), hint: '#fff8ee' },
            { d: rrect(146, 62, 108, 18, 8), hint: '#5c5470' },
            { d: rrect(162, 12, 76, 54, 10), hint: '#5c5470' },
            { d: rrect(162, 40, 76, 16, 6), hint: '#ff5fa2' },
            { d: smooth([[148, 158], [200, 176], [252, 158], [254, 182], [200, 198], [146, 182]]), hint: '#ff5fa2' },
            { d: smooth([[236, 176], [268, 214], [258, 268], [232, 262], [242, 214]]), hint: '#ff5fa2' },
            { d: poly([[200, 124], [252, 136], [200, 146]]), hint: '#ff9e5c' },
            { d: circle(200, 196, 13), hint: '#5c5470' },
            { d: circle(200, 232, 13), hint: '#5c5470' },
            { d: circle(200, 292, 14), hint: '#5c5470' },
            { d: star(62, 116, 22, 9, 6), hint: '#bfe9ff' },
            { d: star(340, 156, 18, 8, 6), hint: '#bfe9ff' },
            { d: star(84, 262, 15, 6, 6), hint: '#bfe9ff' }
        ],
        deco: [
            { d: circle(180, 108, 9), fill: INK },
            { d: circle(220, 108, 9), fill: INK },
            { d: 'M' + pt(112, 200) + 'L' + pt(58, 168) + 'm14,26l-14,-26l4,-26', stroke: INK, w: 5 },
            { d: 'M' + pt(288, 200) + 'L' + pt(342, 168) + 'm-14,26l14,-26l-4,-26', stroke: INK, w: 5 },
            smile(200, 138, 17, 12)
        ]
    });

    /* -- 26. Little car ------------------------------------------------ */
    DRAWINGS.push({
        id: 'car', emoji: '🚗', en: 'Happy Little Car', vi: 'Xe Hơi Vui Vẻ',
        regions: [
            { d: rrect(0, 330, 400, 40, 0), hint: '#b9b3c7' },
            { d: smooth([[92, 178], [156, 118], [252, 118], [312, 178], [340, 202], [344, 274], [56, 274], [60, 202]]), hint: '#ff6b6b' },
            { d: smooth([[128, 176], [166, 138], [196, 138], [196, 176]]), hint: '#bfe9ff' },
            { d: smooth([[210, 138], [244, 138], [278, 176], [210, 176]]), hint: '#bfe9ff' },
            { d: rrect(56, 224, 288, 30, 14), hint: '#fff4f8' },
            { d: circle(122, 288, 46), hint: '#5c5470' },
            { d: circle(278, 288, 46), hint: '#5c5470' },
            { d: circle(122, 288, 22), hint: '#e9dcff' },
            { d: circle(278, 288, 22), hint: '#e9dcff' },
            { d: circle(64, 212, 15), hint: '#ffd166' },
            { d: circle(336, 212, 15), hint: '#ffd166' },
            { d: cloud(88, 74, 0.62), hint: '#e7f3ff' },
            { d: circle(330, 70, 32), hint: '#ffe066' },
            { d: rrect(30, 344, 60, 12, 6), hint: '#fff4f8' },
            { d: rrect(160, 344, 60, 12, 6), hint: '#fff4f8' },
            { d: rrect(290, 344, 60, 12, 6), hint: '#fff4f8' }
        ],
        deco: [
            { d: circle(166, 196, 13), fill: INK },
            { d: circle(234, 196, 13), fill: INK },
            { d: circle(170, 191, 5), fill: '#ffffff' },
            { d: circle(238, 191, 5), fill: '#ffffff' },
            smile(200, 212, 20, 13)
        ]
    });

    /* -- 27. Apple tree ------------------------------------------------ */
    DRAWINGS.push({
        id: 'appletree', emoji: '🌳', en: 'Apple Tree', vi: 'Cây Táo Có Chim',
        regions: [
            { d: rrect(0, 342, 400, 58, 0), hint: '#9ada86' },
            { d: circle(336, 76, 34), hint: '#ffe066' },
            { d: smooth([[176, 366], [176, 232], [148, 200], [172, 196], [190, 224], [210, 224], [228, 196], [252, 200], [224, 232], [224, 366]]), hint: '#c98a5b' },
            { d: circle(200, 158, 96), hint: '#7ec86a' },
            { d: circle(120, 196, 62), hint: '#9ada86' },
            { d: circle(280, 196, 62), hint: '#9ada86' },
            { d: circle(200, 96, 58), hint: '#9ada86' },
            { d: circle(150, 150, 22), hint: '#ff5fa2' },
            { d: circle(246, 132, 22), hint: '#ff5fa2' },
            { d: circle(206, 200, 22), hint: '#ff6b6b' },
            { d: circle(288, 208, 20), hint: '#ff6b6b' },
            { d: circle(112, 208, 20), hint: '#ff5fa2' },
            { d: ellipse(316, 288, 34, 26), hint: '#7ec8ff' },
            { d: smooth([[338, 274], [368, 262], [356, 292]]), hint: '#4aa8ff' },
            { d: poly([[286, 288], [262, 282], [286, 298]]), hint: '#ffb703' },
            { d: ellipse(76, 356, 26, 14), hint: '#7ec86a' }
        ],
        deco: [
            { d: circle(302, 280, 7), fill: INK },
            { d: 'M' + pt(306, 314) + 'L' + pt(302, 330) + 'm12,-16l4,16', stroke: INK, w: 3.5 }
        ]
    });

    /* -- 28. Turtle ---------------------------------------------------- */
    DRAWINGS.push({
        id: 'turtle', emoji: '🐢', en: 'Little Turtle', vi: 'Rùa Con Bơi',
        regions: [
            { d: ellipse(112, 316, 44, 26), hint: '#9ada86' },
            { d: ellipse(288, 316, 44, 26), hint: '#9ada86' },
            { d: ellipse(112, 200, 42, 27), hint: '#9ada86' },
            { d: ellipse(304, 200, 42, 27), hint: '#9ada86' },
            { d: smooth([[330, 268], [372, 250], [368, 296], [330, 292]]), hint: '#9ada86' },
            { d: circle(96, 232, 52), hint: '#9ada86' },
            { d: ellipse(206, 258, 118, 88), hint: '#7ec86a' },
            { d: circle(206, 224, 30), hint: '#ffd166' },
            { d: circle(146, 274, 28), hint: '#ff9e5c' },
            { d: circle(266, 274, 28), hint: '#ff9e5c' },
            { d: circle(206, 314, 26), hint: '#ffd166' },
            { d: circle(58, 108, 20), hint: '#bfe9ff' },
            { d: circle(104, 68, 14), hint: '#bfe9ff' },
            { d: circle(28, 158, 12), hint: '#bfe9ff' },
            { d: smooth([[352, 396], [340, 330], [372, 296], [388, 340], [370, 380], [384, 396]]), hint: '#4fd1c5' }
        ],
        deco: [
            { d: circle(82, 220, 12), fill: '#ffffff' },
            { d: circle(82, 220, 8), fill: INK },
            { d: circle(112, 220, 12), fill: '#ffffff' },
            { d: circle(112, 220, 8), fill: INK },
            { d: ellipse(66, 250, 13, 9), fill: '#ffb3c7' },
            smile(98, 250, 13, 10)
        ]
    });

    /* -- 29. Flamingo -------------------------------------------------- */
    DRAWINGS.push({
        id: 'flamingo', emoji: '🦩', en: 'Pink Flamingo', vi: 'Chim Hồng Hạc',
        regions: [
            { d: rrect(0, 336, 400, 64, 0), hint: '#bfe9ff' },
            { d: ellipse(96, 352, 54, 20), hint: '#7ec86a' },
            { d: ellipse(322, 344, 44, 17), hint: '#9ada86' },
            { d: rrect(186, 268, 15, 96, 7), hint: '#ff9e5c' },
            { d: rrect(226, 268, 15, 96, 7), hint: '#ff9e5c' },
            { d: ellipse(212, 258, 104, 74), hint: '#ff9ec4' },
            { d: smooth([[186, 200], [176, 132], [200, 88], [244, 82], [268, 108], [244, 112], [216, 136], [214, 200]]), hint: '#ff9ec4' },
            { d: smooth([[236, 84], [286, 96], [292, 126], [252, 122], [234, 106]]), hint: '#ff5fa2' },
            { d: poly([[288, 100], [332, 118], [286, 130]]), hint: '#5c5470' },
            { d: smooth([[196, 232], [252, 226], [286, 258], [240, 288], [196, 272]]), hint: '#ff5fa2' },
            { d: smooth([[124, 246], [80, 232], [66, 274], [110, 288]]), hint: '#ff5fa2' },
            { d: star(64, 128, 22, 9, 5), hint: '#ffd166' },
            { d: cloud(96, 84, 0.6), hint: '#e7f3ff' }
        ],
        deco: [
            { d: circle(268, 106, 9), fill: INK },
            { d: circle(271, 102, 3.5), fill: '#ffffff' },
            { d: ellipse(252, 128, 12, 8), fill: '#ff7aa8' }
        ]
    });

    /* -- 30. Baby dino ------------------------------------------------- */
    DRAWINGS.push({
        id: 'dino', emoji: '🦕', en: 'Baby Dino', vi: 'Khủng Long Bé',
        regions: [
            { d: rrect(0, 348, 400, 52, 0), hint: '#c9f0d4' },
            { d: smooth([[124, 288], [72, 300], [40, 268], [66, 244], [96, 262]]), hint: '#7ec86a' },
            /* Gai lưng phải cắm xuống dưới mép trên của thân, chứ để cao hơn
               một chút là chúng lơ lửng tách khỏi con vật. */
            { d: poly([[158, 196], [178, 144], [200, 194]]), hint: '#ffd166' },
            { d: poly([[200, 190], [222, 136], [244, 188]]), hint: '#ffd166' },
            { d: poly([[242, 196], [264, 150], [284, 202]]), hint: '#ffd166' },
            { d: ellipse(214, 262, 108, 84), hint: '#7ec86a' },
            { d: ellipse(214, 288, 62, 52), hint: '#c9f0d4' },
            { d: rrect(152, 320, 34, 62, 15), hint: '#7ec86a' },
            { d: rrect(244, 320, 34, 62, 15), hint: '#7ec86a' },
            { d: circle(300, 190, 58), hint: '#9ada86' },
            { d: ellipse(330, 214, 30, 22), hint: '#c9f0d4' },
            { d: smooth([[74, 356], [50, 306], [78, 288], [96, 330]]), hint: '#7ec86a' },
            { d: circle(80, 104, 30), hint: '#ffe066' },
            { d: smooth([[356, 344], [344, 296], [372, 276], [386, 312], [372, 336]]), hint: '#7ec86a' }
        ],
        deco: [
            { d: circle(292, 174, 13), fill: '#ffffff' },
            { d: circle(292, 174, 8), fill: INK },
            { d: circle(324, 174, 13), fill: '#ffffff' },
            { d: circle(324, 174, 8), fill: INK },
            { d: ellipse(276, 206, 14, 9), fill: '#ffb3c7' },
            smile(316, 214, 13, 10),
            { d: circle(342, 208, 4), fill: INK }
        ]
    });

    return {
        DRAWINGS: DRAWINGS,
        INK: INK,
        helpers: { circle: circle, ellipse: ellipse, rrect: rrect, poly: poly, smooth: smooth, star: star, heart: heart }
    };
}));
