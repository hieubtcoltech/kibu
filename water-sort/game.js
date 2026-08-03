/**
 * Rót Màu (Water Sort) — KIBU Games
 * ----------------------------------------------------------------------------
 * Mấy ống nghiệm đựng nước màu lộn xộn. Bé rót qua rót lại cho tới khi mỗi ống
 * chỉ còn đúng một màu. Chỉ được rót màu lên đúng màu ấy, hoặc rót vào ống
 * trống. Không tính giờ, không mạng, không thua — bé ngồi nghĩ bao lâu cũng
 * được, sai thì lùi lại.
 *
 * BẢY CHỖ LÀM KHÁC MẤY GAME XẾP MÀU NGOÀI KIA
 *   1. Màn nào cũng chắc chắn giải được. Máy đã giải thử từng màn trước khi
 *      đóng gói (xem make-levels.js), màn nào máy không giải nổi thì vứt.
 *   2. Gợi ý miễn phí và luôn đúng — bấm là chạy máy giải thật ngay tại chỗ,
 *      không phải mách nước bừa, cũng không đòi xem quảng cáo.
 *   3. Lùi lại không giới hạn.
 *   4. Bé mù màu chơi được: mỗi màu gắn thêm một ký hiệu riêng.
 *   5. Hai bé thi nhau trên một máy, cùng một màn, ai xong trước thắng.
 *   6. Không tính giờ, không mạng, không thua.
 *   7. Không quảng cáo, không mua bán gì cả.
 *
 * Cả sân vẽ bằng canvas 2D, không thư viện ngoài. Chữ để bên HTML cho /i18n.js
 * lo phần dịch.
 *
 * Bố cục file:
 *   1. Cấu hình     2. Màu và ký hiệu   3. Tiến trình   4. Âm thanh
 *   5. Luật chơi    6. Máy giải         7. Trạng thái   8. Hình học
 *   9. Điều khiển  10. Hiệu ứng        11. Vẽ          12. Giao diện  13. Vòng lặp
 */
(function () {
    'use strict';

    /* ========================================================================
     *  1. CẤU HÌNH
     * ======================================================================*/

    const CAP = 4;               // mỗi ống chứa được 4 phần
    const POUR_T = 0.34;         // giây cho một lượt rót chảy xong
    const LIFT = 0.22;           // phần nước được chọn nhô lên khỏi miệng ống
    const ASPECT = 3.5;          // ống cao gấp mấy lần bề ngang

    const STORE_KEY = 'kibu_water_sort_progress';
    const SOUND_KEY = 'kibu_water_sort_sound';
    const MARK_KEY = 'kibu_water_sort_marks';

    const LEVELS = (typeof window !== 'undefined' && window.WATER_SORT_LEVELS) || [];

    const WORLDS = [
        { name: 'Splash Pool', from: 0, sky: ['#8ad8ff', '#4dabf7'], ink: '#0b3a5d' },
        { name: 'Rainbow Lab', from: 15, sky: ['#b197fc', '#7048e8'], ink: '#2a1560' },
        { name: 'Tight Squeeze', from: 30, sky: ['#ffc078', '#fd7e14'], ink: '#5c2c00' },
        { name: 'One Spare Tube', from: 45, sky: ['#63e6be', '#0ca678'], ink: '#04382a' }
    ];

    /* Màn nào ít ống thì hai bé mới thi được: chia đôi màn hình rồi mà mười ba
     * ống thì mỗi ống bé bằng que tăm. */
    const RACE_MAX_TUBES = 9;

    /* ========================================================================
     *  2. MÀU VÀ KÝ HIỆU
     * ------------------------------------------------------------------------
     *  Mỗi màu mang thêm một ký hiệu riêng vẽ chìm trên mặt nước. Cứ mười hai
     *  bé trai thì có một bé khó phân biệt màu — với bé ấy, một giàn ống đỏ
     *  xanh lá cạnh nhau là một giàn ống xam xám như nhau, chơi kiểu gì cũng
     *  thua. Thêm ký hiệu vào thì bé nhìn hình mà xếp, không cần nhìn màu.
     *  Bé nào không cần thì tắt đi trong bảng chào.
     *
     *  Màu xếp theo thứ tự dùng dần: mười hai màu đầu phải khác nhau thật rõ,
     *  không để hai màu cùng họ đứng cạnh nhau trong danh sách.
     * ======================================================================*/

    const COLORS = [
        { c: '#e03131', d: '#a51111', mark: 'circle' },
        { c: '#1c7ed6', d: '#0b5394', mark: 'star' },
        { c: '#f59f00', d: '#b36d00', mark: 'triangle' },
        { c: '#2f9e44', d: '#1a6b2a', mark: 'square' },
        { c: '#ae3ec9', d: '#7a1e91', mark: 'diamond' },
        { c: '#f06595', d: '#b83a68', mark: 'heart' },
        { c: '#0ca678', d: '#047453', mark: 'plus' },
        { c: '#fab005', d: '#c08800', mark: 'ring' },
        { c: '#4dabf7', d: '#1c7ed6', mark: 'wave' },
        { c: '#94d82d', d: '#5c9210', mark: 'leaf' },
        { c: '#8d6e63', d: '#5d4037', mark: 'bar' },
        { c: '#495057', d: '#212529', mark: 'cross' }
    ];

    /* ========================================================================
     *  3. TIẾN TRÌNH
     * ======================================================================*/

    const store = {
        data: { stars: {}, moves: {}, done: 0 },

        load() {
            try {
                const raw = localStorage.getItem(STORE_KEY);
                if (raw) Object.assign(this.data, JSON.parse(raw));
            } catch (e) { /* chế độ riêng tư: chơi được nhưng không nhớ */ }
        },
        save() {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        starsOf(i) { return this.data.stars[i] || 0; },
        bestOf(i) { return this.data.moves[i] || 0; },
        totalStars() {
            let n = 0;
            for (const k in this.data.stars) n += this.data.stars[k];
            return n;
        },
        unlocked(i) { return i === 0 || (this.data.stars[i - 1] || 0) > 0; },
        record(i, stars, moves) {
            if (stars > this.starsOf(i)) this.data.stars[i] = stars;
            const old = this.bestOf(i);
            if (!old || moves < old) this.data.moves[i] = moves;
            if (i + 1 > this.data.done) this.data.done = i + 1;
            this.save();
        },
        reset() { this.data = { stars: {}, moves: {}, done: 0 }; this.save(); }
    };

    /* ========================================================================
     *  4. ÂM THANH
     * ------------------------------------------------------------------------
     *  Tổng hợp bằng Web Audio, không tải tệp nào — giống mọi game khác của nhà
     *  mình. Cách này iOS coi là tiếng của trang chứ không phải một phiên phát
     *  nhạc, nên không sinh ra nút điều khiển ở màn hình khoá.
     * ======================================================================*/

    const sfx = {
        on: true,
        ctx: null,

        init() {
            try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { }
        },
        wake() {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        },
        toggle() {
            this.on = !this.on;
            try { localStorage.setItem(SOUND_KEY, this.on ? '1' : '0'); } catch (e) { }
            return this.on;
        },
        tone(freq, dur, type, vol, slideTo) {
            if (!this.on || !this.ctx) return;
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type || 'sine';
            o.frequency.setValueAtTime(freq, t);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
            g.gain.setValueAtTime(vol == null ? 0.12 : vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g).connect(this.ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        },
        noise(dur, vol, hp) {
            if (!this.on || !this.ctx) return;
            const ac = this.ctx;
            const len = Math.max(1, Math.floor(ac.sampleRate * (dur || 0.1)));
            const buf = ac.createBuffer(1, len, ac.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
            const src = ac.createBufferSource(); src.buffer = buf;
            const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hp || 900;
            const g = ac.createGain(); g.gain.value = vol == null ? 0.1 : vol;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },

        pick() { this.tone(520, 0.06, 'sine', 0.06, 720); },
        /* Tiếng nước chảy: rót càng nhiều phần thì tiếng càng dài và càng trầm
         * dần — tai nghe cũng biết vừa rót được nhiều hay ít. */
        pour(n) {
            this.noise(0.1 + n * 0.05, 0.05, 1400);
            this.tone(600 - n * 60, 0.12 + n * 0.04, 'sine', 0.05, 320 - n * 30);
        },
        nope() { this.tone(180, 0.12, 'square', 0.05, 120); },
        tubeDone() {
            [784, 988].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, 'triangle', 0.09), i * 70));
        },
        hint() { this.tone(880, 0.1, 'triangle', 0.07, 1320); },
        undo() { this.tone(320, 0.08, 'sine', 0.05, 240); },
        win() {
            [523, 659, 784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.24, 'triangle', 0.13), i * 110));
        }
    };

    /* ========================================================================
     *  5. LUẬT CHƠI
     * ------------------------------------------------------------------------
     *  Phần này KHÔNG đụng gì tới màn hình: chỉ có mấy ống và nước trong ống.
     *  Nhờ vậy máy giải ở mục sau dùng lại được y nguyên, và máy soát ở
     *  check-levels.js cũng gọi thẳng vào đây — ba nơi cùng một luật, không
     *  nơi nào chép lại của nơi nào.
     * ======================================================================*/

    /* Đầu ống có mấy phần cùng màu liền nhau */
    function topRun(tube) {
        if (!tube.length) return 0;
        const c = tube[tube.length - 1];
        let n = 1;
        while (n < tube.length && tube[tube.length - 1 - n] === c) n++;
        return n;
    }

    function tubeDone(tube) {
        return !tube.length || (tube.length === CAP && tube.every(c => c === tube[0]));
    }

    function allDone(tubes) { return tubes.every(tubeDone); }

    /* Rót được từ i sang j không, và rót được mấy phần */
    function canPour(tubes, i, j) {
        if (i === j) return 0;
        const a = tubes[i], b = tubes[j];
        if (!a.length || b.length === CAP) return 0;
        const c = a[a.length - 1];
        if (b.length && b[b.length - 1] !== c) return 0;
        return Math.min(topRun(a), CAP - b.length);
    }

    /* Mọi nước đi hợp lệ. Bỏ hai nước chắc chắn vô ích để máy giải khỏi lạc:
     *   · đụng vào ống đã xong;
     *   · dời nguyên một cụm sang ống trống — bày ra y như cũ, chỉ đổi chỗ. */
    function legalMoves(tubes) {
        const out = [];
        for (let i = 0; i < tubes.length; i++) {
            const a = tubes[i];
            if (!a.length) continue;
            const n = topRun(a);
            if (n === a.length && a.length === CAP) continue;
            for (let j = 0; j < tubes.length; j++) {
                if (i === j) continue;
                const b = tubes[j];
                if (b.length === CAP) continue;
                if (b.length && b[b.length - 1] !== a[a.length - 1]) continue;
                if (!b.length && n === a.length) continue;
                out.push([i, j, Math.min(n, CAP - b.length)]);
            }
        }
        return out;
    }

    function applyMove(tubes, m) {
        const u = tubes.map(x => x.slice());
        for (let k = 0; k < m[2]; k++) u[m[1]].push(u[m[0]].pop());
        return u;
    }

    /* ========================================================================
     *  6. MÁY GIẢI — dùng cho nút mách nước
     * ------------------------------------------------------------------------
     *  Chạy ngay trong máy của bé, không hỏi máy chủ nào cả. Ưu tiên nước rót
     *  được nhiều phần nhất trước; mẹo ấy đưa tới lời giải rất nhanh, phần lớn
     *  màn chỉ ngó qua vài chục trạng thái nên bấm là có ngay, không kịp giật.
     *
     *  Có trần số trạng thái để không bao giờ treo máy: hết trần thì thà nói
     *  "chưa nghĩ ra" còn hơn để bé ngồi nhìn màn hình đơ.
     * ======================================================================*/

    function stateKey(tubes) { return tubes.map(x => x.join(',')).sort().join('|'); }

    function findSolution(tubes, nodeCap) {
        const seen = new Set();
        let nodes = 0;
        function dfs(s, depth, path) {
            if (allDone(s)) return path;
            if (depth <= 0) return null;
            if (++nodes > nodeCap) return null;
            const k = stateKey(s);
            if (seen.has(k)) return null;
            seen.add(k);
            const ms = legalMoves(s);
            ms.sort((a, b) => b[2] - a[2]);
            for (const m of ms) {
                const r = dfs(applyMove(s, m), depth - 1, path.concat([m]));
                if (r) return r;
            }
            return null;
        }
        return dfs(tubes, 220, []);
    }

    /* ========================================================================
     *  7. TRẠNG THÁI
     * ======================================================================*/

    function makeBoard(kid) {
        return {
            kid: kid,
            tubes: [],
            level: 0,
            moves: 0,
            sel: -1,              // ống đang được chọn, -1 là chưa chọn
            undo: [],
            pour: null,           // lượt rót đang chảy
            hint: null,           // nước máy vừa mách, [i, j]
            hintAt: -9,
            won: false,
            justDone: [],         // ống vừa xong, để nhấp nháy một cái
            fx: [],
            time: 0
        };
    }

    const G = {
        mode: 'menu',       // menu | play | levels | won | duo
        kids: 1,
        boards: [],
        marks: true,        // có vẽ ký hiệu cho bé mù màu không
        winner: 0,
        time: 0
    };

    function loadLevel(board, idx) {
        const L = LEVELS[idx];
        if (!L) return;
        board.level = idx;
        board.tubes = L.t.map(x => x.slice());
        board.moves = 0;
        board.sel = -1;
        board.undo.length = 0;
        board.pour = null;
        board.hint = null;
        board.won = false;
        board.justDone.length = 0;
        board.fx.length = 0;
    }

    function newGame(kids, level) {
        G.kids = kids;
        G.boards = [];
        for (let i = 0; i < kids; i++) {
            const b = makeBoard(i + 1);
            loadLevel(b, level);
            G.boards.push(b);
        }
        G.winner = 0;
        G.mode = 'play';
        layout();
    }

    /* ========================================================================
     *  8. HÌNH HỌC
     * ------------------------------------------------------------------------
     *  Mỗi bé một khoảng chữ nhật trên màn hình, giàn ống tự co cho vừa. Giàn
     *  nhiều hơn bảy ống thì xếp hai hàng — mười ba ống trên một hàng thì ống
     *  nào cũng bé tí, mà bé cầm điện thoại là hết nhìn thấy nước bên trong.
     * ======================================================================*/

    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');

    const V = { w: 0, h: 0 };
    const rects = [];            // mỗi bé một khung {x, y, w, h}
    const PAD_TOP = 34;          // chừa chỗ cho thẻ tên phía trên

    function resize() {
        const host = canvas.parentElement;
        const w = host.clientWidth, h = host.clientHeight;
        if (!w || !h) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        V.w = w; V.h = h;
        layout();
    }

    function layout() {
        rects.length = 0;
        const n = Math.max(1, G.boards.length || G.kids);
        const gap = n > 1 ? Math.max(10, V.w * 0.02) : 0;
        const cw = (V.w - gap * (n - 1) - 16) / n;
        const ch = V.h - PAD_TOP - 10;
        for (let i = 0; i < n; i++) {
            rects.push({ x: 8 + i * (cw + gap), y: PAD_TOP, w: cw, h: ch });
        }
        placeChips();
    }

    /* Chỗ đứng của từng ống trong khung của bé ấy */
    function tubeBoxes(bi) {
        const b = G.boards[bi], r = rects[bi];
        if (!b || !r) return [];
        const n = b.tubes.length;

        /* Xếp một hàng hay hai hàng? Không quy định cứng, mà thử cả hai rồi
         * lấy cách nào cho ỐNG TO NHẤT.
         *
         * Cứ hễ quá bảy ống là xuống hai hàng — đó là cách em làm lúc đầu, và
         * nó cho ra một giàn ống gầy như que tăm trên máy tính: hai hàng thì
         * chiều cao chia đôi, mà ống cao gấp ba lần rưỡi bề ngang nên ống hẹp
         * theo. Trong khi màn hình rộng thênh thang, mười hai ống xếp một hàng
         * vẫn thừa chỗ và ống to hơn hẳn. Trên điện thoại thì ngược lại, hai
         * hàng mới cho ống to. Cứ đo rồi chọn thì máy nào cũng đúng. */
        let rows = 1, w = 0, per = n;
        for (let tryRows = 1; tryRows <= 3; tryRows++) {
            const p = Math.ceil(n / tryRows);
            const cand = Math.min(r.w / (p * 1.32), r.h / (tryRows * ASPECT * 1.28));
            if (cand > w) { w = cand; rows = tryRows; per = p; }
        }

        const h = w * ASPECT;
        const stepX = w * 1.32, stepY = h * 1.28;
        const totalH = h + (rows - 1) * stepY;
        const y0 = r.y + (r.h - totalH) / 2;

        const out = [];
        for (let k = 0; k < n; k++) {
            const row = Math.floor(k / per);
            const inRow = Math.min(per, n - row * per);
            const x0 = r.x + (r.w - (inRow * w + (inRow - 1) * (stepX - w))) / 2;
            const col = k - row * per;
            out.push({ x: x0 + col * stepX, y: y0 + row * stepY, w: w, h: h });
        }
        return out;
    }

    function tubeAt(bi, px, py) {
        const boxes = tubeBoxes(bi);
        for (let k = 0; k < boxes.length; k++) {
            const t = boxes[k];
            /* Nới vùng chạm ra quanh ống: ngón tay bé đặt hụt vài chục điểm ảnh
             * là chuyện thường, mà chạm hụt thì bé tưởng game đơ. */
            if (px >= t.x - t.w * 0.35 && px <= t.x + t.w * 1.35 &&
                py >= t.y - t.h * 0.12 && py <= t.y + t.h * 1.12) return k;
        }
        return -1;
    }

    function boardAt(px, py) {
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            if (px >= r.x - 20 && px <= r.x + r.w + 20) return i;
        }
        return -1;
    }

    /* ========================================================================
     *  9. ĐIỀU KHIỂN
     * ======================================================================*/

    function tapTube(bi, k) {
        const b = G.boards[bi];
        if (!b || b.won || b.pour || G.mode !== 'play') return;

        if (b.sel < 0) {
            if (!b.tubes[k].length) { sfx.nope(); return; }
            if (tubeDone(b.tubes[k])) { sfx.nope(); return; }   // ống xong rồi, để yên
            b.sel = k;
            b.hint = null;
            sfx.pick();
            return;
        }
        if (b.sel === k) { b.sel = -1; sfx.pick(); return; }

        const n = canPour(b.tubes, b.sel, k);
        if (!n) {
            /* Rót không được thì chọn luôn ống vừa chạm, đỡ phải bấm hai lần */
            if (b.tubes[k].length && !tubeDone(b.tubes[k])) { b.sel = k; sfx.pick(); }
            else { sfx.nope(); shake(b, k); }
            return;
        }
        startPour(b, b.sel, k, n);
        b.sel = -1;
    }

    function startPour(b, from, to, n) {
        b.undo.push({ from: from, to: to, n: n });
        b.pour = { from: from, to: to, n: n, t: 0, color: b.tubes[from][b.tubes[from].length - 1] };
        b.hint = null;
        sfx.pour(n);
    }

    /* Lượt rót chảy xong thì mới thật sự đổi nước trong ống — nhờ vậy hình vẽ
     * và số liệu lúc nào cũng khớp nhau, không có cảnh nước đã nhảy sang ống
     * bên kia mà dòng nước còn đang bay giữa trời. */
    function finishPour(b) {
        const p = b.pour;
        b.pour = null;
        for (let k = 0; k < p.n; k++) b.tubes[p.to].push(b.tubes[p.from].pop());
        b.moves++;

        if (tubeDone(b.tubes[p.to]) && b.tubes[p.to].length === CAP) {
            b.justDone.push({ k: p.to, t: 0 });
            splash(b, p.to, b.tubes[p.to][0]);
            sfx.tubeDone();
        }
        if (allDone(b.tubes)) onWin(b);
        paintChips();
    }

    function undoMove(bi) {
        const b = G.boards[bi];
        if (!b || b.pour || !b.undo.length || b.won) return;
        const m = b.undo.pop();
        for (let k = 0; k < m.n; k++) b.tubes[m.from].push(b.tubes[m.to].pop());
        /* Lùi lại thì SỐ NƯỚC TRẢ VỀ NHƯ CŨ, chứ không cộng thêm. Đầu tiên em
         * cho lùi cũng tính một nước, nghĩ là để bé chịu khó nghĩ trước. Nhưng
         * mốc ba sao là đi không quá số nước ít nhất, mà bé nào chẳng phải thử
         * vài lần — tính kiểu ấy thì bé thử một cái là mất luôn cơ hội ba sao,
         * hoá ra phạt bé vì dám thử. Lùi là quay lại đúng lúc trước đó, cả bàn
         * lẫn con số. */
        if (b.moves > 0) b.moves--;
        b.sel = -1;
        b.hint = null;
        b.justDone.length = 0;
        sfx.undo();
        paintChips();
    }

    function askHint(bi) {
        const b = G.boards[bi];
        if (!b || b.pour || b.won) return;
        const sol = findSolution(b.tubes, 120000);
        if (!sol || !sol.length) {
            showTip('No way from here — try Undo!', 2600);
            sfx.nope();
            return;
        }
        b.hint = [sol[0][0], sol[0][1]];
        b.hintAt = b.time;
        b.sel = -1;
        sfx.hint();
    }

    function wireInput() {
        const host = canvas.parentElement;

        host.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            sfx.wake();
            if (G.mode !== 'play') return;
            const r = canvas.getBoundingClientRect();
            const px = ev.clientX - r.left, py = ev.clientY - r.top;
            const bi = boardAt(px, py);
            if (bi < 0) return;
            const k = tubeAt(bi, px, py);
            if (k >= 0) tapTube(bi, k);
            else { const b = G.boards[bi]; if (b) b.sel = -1; }
        }, { passive: false });

        /* Bàn phím: một bé thì mấy phím số chọn ống, Z lùi, H mách nước.
         * Hai bé thì bé nào cũng chạm màn hình cho tiện, khỏi tranh bàn phím. */
        window.addEventListener('keydown', ev => {
            if (G.mode !== 'play') return;
            const k = ev.key;
            if (k === 'z' || k === 'Z') { undoMove(0); ev.preventDefault(); }
            else if (k === 'h' || k === 'H') { askHint(0); ev.preventDefault(); }
            else if (k >= '1' && k <= '9') { tapTube(0, +k - 1); ev.preventDefault(); }
            else if (k === '0') { tapTube(0, 9); ev.preventDefault(); }
        });
    }

    /* ========================================================================
     *  10. HIỆU ỨNG
     * ======================================================================*/

    function splash(b, k, color) {
        for (let i = 0; i < 14; i++) {
            const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
            const sp = 60 + Math.random() * 150;
            b.fx.push({
                kind: 'drop', tube: k, x: 0.5, y: 0,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                life: 0.5 + Math.random() * 0.3, t: 0, c: COLORS[color].c
            });
        }
    }

    function shake(b, k) {
        b.fx.push({ kind: 'shake', tube: k, t: 0, life: 0.26 });
    }

    function stepFx(b, dt) {
        for (let i = b.fx.length - 1; i >= 0; i--) {
            const f = b.fx[i];
            f.t += dt;
            if (f.t >= f.life) { b.fx.splice(i, 1); continue; }
            if (f.kind === 'drop') {
                f.vy += 900 * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
            }
        }
        for (let i = b.justDone.length - 1; i >= 0; i--) {
            b.justDone[i].t += dt;
            if (b.justDone[i].t > 0.7) b.justDone.splice(i, 1);
        }
    }

    function shakeOf(b, k) {
        for (const f of b.fx) {
            if (f.kind === 'shake' && f.tube === k) {
                const p = 1 - f.t / f.life;
                return Math.sin(f.t * 60) * 6 * p;
            }
        }
        return 0;
    }

    /* ========================================================================
     *  11. VẼ
     * ======================================================================*/

    /* Dáng cái ống nghiệm: miệng trên chỉ bo nhẹ, đáy dưới bo tròn hẳn. Bo
     * tròn đều bốn góc thì ra viên con nhộng, nhìn không ra cái ống. */
    function tubePath(x, y, w, h) {
        const rt = w * 0.13, rb = w * 0.46;
        ctx.beginPath();
        ctx.moveTo(x + rt, y);
        ctx.lineTo(x + w - rt, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rt);
        ctx.lineTo(x + w, y + h - rb);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rb, y + h);
        ctx.lineTo(x + rb, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rb);
        ctx.lineTo(x, y + rt);
        ctx.quadraticCurveTo(x, y, x + rt, y);
        ctx.closePath();
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function world() {
        const b = G.boards[0];
        const i = b ? worldOf(b.level) : 0;
        return WORLDS[i];
    }

    function worldOf(i) {
        let w = 0;
        for (let k = 0; k < WORLDS.length; k++) if (i >= WORLDS[k].from) w = k;
        return w;
    }

    function draw() {
        const W = world();
        const g = ctx.createLinearGradient(0, 0, 0, V.h);
        g.addColorStop(0, W.sky[0]);
        g.addColorStop(1, W.sky[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, V.w, V.h);
        drawBubbles(W);

        for (let i = 0; i < G.boards.length && i < rects.length; i++) drawBoard(i, W);
    }

    /* Mấy bọt nước lững lờ phía sau cho đỡ trống, trôi rất chậm để không cướp
     * mắt bé khỏi giàn ống. */
    function drawBubbles(W) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        for (let i = 0; i < 14; i++) {
            const s = 12 + (i % 5) * 9;
            const x = ((i * 137) % 100) / 100 * V.w;
            const y = V.h - ((G.time * (8 + i % 4) + i * 90) % (V.h + 120));
            ctx.beginPath();
            ctx.arc(x, y, s, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawBoard(bi, W) {
        const b = G.boards[bi];
        const boxes = tubeBoxes(bi);
        for (let k = 0; k < boxes.length; k++) drawTube(b, k, boxes[k], W);
        if (b.pour) drawStream(b, boxes);
        drawDrops(b, boxes);
    }

    /* Một ống: thân kính, nước bên trong, và cái ánh sáng dọc thân cho ra vẻ
     * thuỷ tinh. Nước vẽ từ đáy lên, mỗi phần một khối bo tròn nhẹ. */
    function drawTube(b, k, box, W) {
        const tube = b.tubes[k];
        const sh = shakeOf(b, k);
        const lift = (b.sel === k) ? box.h * LIFT : 0;
        const hinted = b.hint && (b.hint[0] === k || b.hint[1] === k) && (b.time - b.hintAt) < 3;

        ctx.save();
        ctx.translate(box.x + sh, box.y);

        const inset = box.w * 0.06;
        const iw = box.w - inset * 2;

        /* lòng ống */
        ctx.save();
        tubePath(inset, 0, iw, box.h);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(0, 0, box.w, box.h);

        const unit = (box.h - box.w * 0.16) / CAP;
        const bottom = box.h - box.w * 0.08;
        let shown = tube.length;
        /* Phần đang bay giữa trời thì đừng vẽ trong ống nữa */
        if (b.pour && b.pour.from === k) shown -= b.pour.n;

        for (let i = 0; i < shown; i++) {
            const col = COLORS[tube[i]];
            const y = bottom - (i + 1) * unit;
            const raise = (b.sel === k && i >= shown - topRun(tube)) ? -lift : 0;
            ctx.fillStyle = col.c;
            ctx.fillRect(0, y + raise, box.w, unit + 1);
            /* vệt sẫm dưới đáy mỗi phần cho thấy ranh giới hai lớp nước */
            ctx.fillStyle = 'rgba(0,0,0,0.13)';
            ctx.fillRect(0, y + raise + unit - unit * 0.1, box.w, unit * 0.1);
            if (G.marks) drawMark(col.mark, box.w / 2, y + raise + unit / 2, unit * 0.3);
        }
        ctx.restore();

        /* thành ống */
        ctx.lineWidth = Math.max(2, box.w * 0.075);
        ctx.strokeStyle = hinted ? '#fff' : 'rgba(255,255,255,0.8)';
        if (hinted) {
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = box.w * 0.5;
        }
        tubePath(inset, 0, iw, box.h);
        ctx.stroke();
        ctx.shadowBlur = 0;

        /* ánh sáng dọc thân kính */
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        roundRect(box.w * 0.24, box.h * 0.08, box.w * 0.11, box.h * 0.76, box.w * 0.055);
        ctx.fill();

        /* ống vừa xong thì có một vòng sáng nở ra */
        for (const d of b.justDone) {
            if (d.k !== k) continue;
            const p = d.t / 0.7;
            ctx.strokeStyle = 'rgba(255,255,255,' + (1 - p) + ')';
            ctx.lineWidth = Math.max(2, box.w * 0.12 * (1 - p));
            tubePath(inset - p * box.w * 0.3, -p * box.w * 0.3,
                iw + p * box.w * 0.6, box.h + p * box.w * 0.6);
            ctx.stroke();
        }

        ctx.restore();
    }

    /* Dòng nước đang chảy từ ống này sang ống kia: một dải cong nối miệng hai
     * ống, dày lên rồi mảnh dần đúng nhịp lượt rót. */
    function drawStream(b, boxes) {
        const p = b.pour;
        const a = boxes[p.from], c = boxes[p.to];
        if (!a || !c) return;
        const k = p.t / POUR_T;
        const x1 = a.x + a.w / 2, y1 = a.y - a.h * 0.04;
        const x2 = c.x + c.w / 2, y2 = c.y + c.h * 0.1;
        const top = Math.min(y1, y2) - a.h * 0.22;

        ctx.save();
        ctx.strokeStyle = COLORS[p.color].c;
        ctx.lineCap = 'round';
        ctx.lineWidth = a.w * 0.3 * Math.sin(Math.min(1, k) * Math.PI);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2, top, x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function drawDrops(b, boxes) {
        for (const f of b.fx) {
            if (f.kind !== 'drop') continue;
            const box = boxes[f.tube];
            if (!box) continue;
            const p = 1 - f.t / f.life;
            ctx.globalAlpha = p;
            ctx.fillStyle = f.c;
            ctx.beginPath();
            ctx.arc(box.x + box.w * f.x + f.x * 0, box.y + f.y, Math.max(1.5, box.w * 0.09 * p), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /* Ký hiệu riêng của từng màu, vẽ chìm trên mặt nước cho bé mù màu phân
     * biệt được. Vẽ bằng nét trắng mờ nên bé không cần tới nó cũng không thấy
     * chói mắt. */
    function drawMark(kind, x, y, r) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.78)';
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.lineWidth = Math.max(1, r * 0.34);
        ctx.lineJoin = 'round';
        ctx.beginPath();
        switch (kind) {
            case 'circle':
                ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke(); break;
            case 'star':
                for (let i = 0; i < 5; i++) {
                    const a1 = -Math.PI / 2 + i * Math.PI * 2 / 5;
                    const a2 = a1 + Math.PI / 5;
                    ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
                    ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
                }
                ctx.closePath(); ctx.fill(); break;
            case 'triangle':
                ctx.moveTo(0, -r * 0.8); ctx.lineTo(r * 0.75, r * 0.55);
                ctx.lineTo(-r * 0.75, r * 0.55); ctx.closePath(); ctx.stroke(); break;
            case 'square':
                ctx.rect(-r * 0.58, -r * 0.58, r * 1.16, r * 1.16); ctx.stroke(); break;
            case 'diamond':
                ctx.moveTo(0, -r * 0.85); ctx.lineTo(r * 0.7, 0);
                ctx.lineTo(0, r * 0.85); ctx.lineTo(-r * 0.7, 0);
                ctx.closePath(); ctx.stroke(); break;
            case 'heart':
                ctx.moveTo(0, r * 0.7);
                ctx.bezierCurveTo(-r * 1.3, -r * 0.2, -r * 0.45, -r * 1.1, 0, -r * 0.35);
                ctx.bezierCurveTo(r * 0.45, -r * 1.1, r * 1.3, -r * 0.2, 0, r * 0.7);
                ctx.fill(); break;
            case 'plus':
                ctx.moveTo(-r * 0.7, 0); ctx.lineTo(r * 0.7, 0);
                ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke(); break;
            case 'ring':
                ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.stroke(); break;
            case 'wave':
                ctx.moveTo(-r * 0.85, r * 0.2);
                ctx.quadraticCurveTo(-r * 0.42, -r * 0.55, 0, r * 0.2);
                ctx.quadraticCurveTo(r * 0.42, r * 0.95, r * 0.85, r * 0.2);
                ctx.stroke(); break;
            case 'leaf':
                ctx.moveTo(0, r * 0.8);
                ctx.quadraticCurveTo(-r, 0, 0, -r * 0.8);
                ctx.quadraticCurveTo(r, 0, 0, r * 0.8);
                ctx.stroke(); break;
            case 'bar':
                ctx.rect(-r * 0.85, -r * 0.26, r * 1.7, r * 0.52); ctx.fill(); break;
            case 'cross':
                ctx.moveTo(-r * 0.6, -r * 0.6); ctx.lineTo(r * 0.6, r * 0.6);
                ctx.moveTo(r * 0.6, -r * 0.6); ctx.lineTo(-r * 0.6, r * 0.6);
                ctx.stroke(); break;
        }
        ctx.restore();
    }

    /* ========================================================================
     *  12. GIAO DIỆN
     * ======================================================================*/

    const el = id => document.getElementById(id);
    const ui = {
        chips: [el('chip-1'), el('chip-2')],
        chipName: [el('chip-1-name'), el('chip-2-name')],
        chipMoves: [el('chip-1-moves'), el('chip-2-moves')],
        tip: el('tip'),
        menu: el('menu-overlay'), levels: el('levels-overlay'),
        win: el('win-overlay'), duo: el('duo-overlay'),
        levelGrid: el('level-grid'), worldTabs: el('world-tabs'),
        winStars: el('win-stars'), winMoves: el('win-moves'),
        winPar: el('win-par'), winBest: el('win-best'),
        btnNext: el('btn-next'), btnFinish: el('btn-finish'),
        duoTitle: el('duo-title'),
        markBtn: el('btn-marks'),
        kidBtns: Array.prototype.slice.call(document.querySelectorAll('[data-kids]'))
    };

    function show(n) { if (n) n.classList.remove('hidden'); }
    function hide(n) { if (n) n.classList.add('hidden'); }
    function hideAll() { [ui.menu, ui.levels, ui.win, ui.duo].forEach(hide); }

    const chipShown = [{}, {}];

    function paintChips() {
        for (let i = 0; i < G.boards.length && i < ui.chips.length; i++) {
            const b = G.boards[i], seen = chipShown[i];
            if (ui.chipMoves[i] && seen.moves !== b.moves) {
                ui.chipMoves[i].textContent = b.moves;
                seen.moves = b.moves;
            }
            if (ui.chipName[i] && G.kids === 1 && seen.level !== b.level) {
                ui.chipName[i].textContent = 'Level ' + (b.level + 1);
                seen.level = b.level;
            }
        }
    }

    function placeChips() {
        for (let i = 0; i < ui.chips.length; i++) {
            const chip = ui.chips[i], r = rects[i];
            if (!chip) continue;
            if (G.mode !== 'play' || !r || i >= G.kids) { chip.hidden = true; continue; }
            chip.hidden = false;
            chip.style.left = r.x + 'px';
            chip.style.top = '4px';
            chip.style.width = r.w + 'px';
        }
    }

    function showTip(text, ms) {
        if (!text) return;
        ui.tip.textContent = text;
        show(ui.tip);
        clearTimeout(showTip.t);
        showTip.t = setTimeout(() => hide(ui.tip), ms || 2600);
    }

    function startLevel(i, kids) {
        newGame(kids == null ? G.kids : kids, i);
        hideAll();
        /* Hai bé thi thì giấu nút Lùi và Mách Nước đi. Hai nút ấy chỉ có một
         * cái cho cả hai bé, mà thi nhau thì bấm hộ nhau là hỏng cuộc đua —
         * chưa kể mách nước trong lúc đua thì còn gì để đua. */
        document.body.classList.toggle('duo-race', G.kids > 1);
        for (const c of chipShown) { c.moves = -1; c.level = -1; }
        paintChips();
        placeChips();
    }

    function openMenu() {
        G.mode = 'menu';
        hideAll();
        for (const c of ui.chips) if (c) c.hidden = true;
        show(ui.menu);
    }

    /* Ba sao khi đi không quá số nước ít nhất, hai sao khi còn trong khoảng
     * rộng tay, một sao là qua màn. Không có mức nào làm bé trượt cả — chấm sao
     * ở đây là để bé muốn quay lại chơi hay hơn, không phải để chặn đường. */
    function starsFor(moves, par) {
        if (moves <= par) return 3;
        if (moves <= Math.ceil(par * 1.5) + 2) return 2;
        return 1;
    }

    function onWin(b) {
        b.won = true;
        b.sel = -1;
        sfx.win();

        if (G.kids > 1) {
            if (!G.winner) {
                G.winner = b.kid;
                G.mode = 'won';
                ui.duoTitle.textContent = 'Kid ' + b.kid + ' wins!';
                show(ui.duo);
            }
            return;
        }

        const L = LEVELS[b.level];
        const stars = starsFor(b.moves, L.p);
        store.record(b.level, stars, b.moves);
        G.mode = 'won';

        ui.winStars.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const s = document.createElement('i');
            s.className = 'fa-solid fa-star star' + (i < stars ? ' lit' : '');
            ui.winStars.appendChild(s);
        }
        ui.winMoves.textContent = b.moves;
        ui.winPar.textContent = L.p;
        ui.winBest.textContent = store.bestOf(b.level) || b.moves;
        const last = b.level >= LEVELS.length - 1;
        ui.btnNext.hidden = last;
        ui.btnFinish.hidden = !last;
        show(ui.win);
    }

    let tabWorld = 0;

    function buildLevelsPanel() {
        ui.worldTabs.innerHTML = '';
        WORLDS.forEach((c, i) => {
            const b = document.createElement('button');
            const locked = !store.unlocked(c.from);
            b.className = 'ch-tab' + (i === tabWorld ? ' is-on' : '') + (locked ? ' locked' : '');
            const st = worldStars(i);
            b.innerHTML = (locked ? '<i class="ch-lock">🔒</i>' : '') + c.name +
                '<span class="ch-stars">' + st.got + '/' + st.max + '⭐</span>';
            if (!locked) b.addEventListener('click', () => { tabWorld = i; buildLevelsPanel(); });
            ui.worldTabs.appendChild(b);
        });

        const from = WORLDS[tabWorld].from;
        const to = (tabWorld + 1 < WORLDS.length ? WORLDS[tabWorld + 1].from : LEVELS.length) - 1;
        ui.levelGrid.innerHTML = '';
        for (let i = from; i <= to; i++) {
            const open = store.unlocked(i);
            const got = store.starsOf(i);
            const b = document.createElement('button');
            b.className = 'lv' + (open ? '' : ' locked') + (got ? ' done' : '');
            b.innerHTML = '<span class="lv-num">' + (open ? (i + 1) : '🔒') + '</span>' +
                '<span class="lv-stars">' +
                [0, 1, 2].map(k => '<i class="lv-star' + (k < got ? ' lit' : '') + '">★</i>').join('') +
                '</span>';
            if (open) b.addEventListener('click', () => startLevel(i, 1));
            ui.levelGrid.appendChild(b);
        }
    }

    function worldStars(i) {
        const from = WORLDS[i].from;
        const to = (i + 1 < WORLDS.length ? WORLDS[i + 1].from : LEVELS.length) - 1;
        let got = 0;
        for (let k = from; k <= to; k++) got += store.starsOf(k);
        return { got, max: (to - from + 1) * 3 };
    }

    function openLevels() {
        G.mode = 'levels';
        if (G.boards.length) tabWorld = worldOf(G.boards[0].level);
        buildLevelsPanel();
        hideAll();
        for (const c of ui.chips) if (c) c.hidden = true;
        show(ui.levels);
    }

    /* Màn để hai bé thi: chọn trong đám màn ít ống, và hai bé nhận ĐÚNG một
     * màn giống nhau — thi mà mỗi bé một đề thì thắng thua chẳng nói lên gì. */
    function raceLevel() {
        const pool = [];
        for (let i = 0; i < LEVELS.length; i++) {
            if (LEVELS[i].t.length <= RACE_MAX_TUBES) pool.push(i);
        }
        if (!pool.length) return 0;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function wireButtons() {
        ui.kidBtns.forEach(b => {
            b.addEventListener('click', () => {
                ui.kidBtns.forEach(x => x.classList.remove('is-on'));
                b.classList.add('is-on');
                G.kids = +b.dataset.kids;
            });
        });

        el('btn-play').addEventListener('click', () => {
            sfx.wake();
            if (G.kids > 1) startLevel(raceLevel(), 2);
            else startLevel(Math.min(store.data.done, LEVELS.length - 1), 1);
        });
        el('btn-menu-levels').addEventListener('click', openLevels);
        el('btn-nav-levels').addEventListener('click', openLevels);
        el('btn-nav-menu').addEventListener('click', openMenu);
        el('btn-nav-undo').addEventListener('click', () => undoMove(0));
        el('btn-nav-hint').addEventListener('click', () => askHint(0));
        el('btn-nav-restart').addEventListener('click', () => {
            if (G.boards.length) startLevel(G.boards[0].level);
        });
        el('btn-levels-back').addEventListener('click', () => {
            if (G.boards.length) startLevel(G.boards[0].level);
            else openMenu();
        });
        el('btn-reset-progress').addEventListener('click', () => { store.reset(); buildLevelsPanel(); });
        ui.btnNext.addEventListener('click', () =>
            startLevel(Math.min(G.boards[0].level + 1, LEVELS.length - 1), 1));
        ui.btnFinish.addEventListener('click', openLevels);
        el('btn-replay').addEventListener('click', () => startLevel(G.boards[0].level));
        el('btn-win-levels').addEventListener('click', openLevels);
        el('btn-duo-again').addEventListener('click', () => startLevel(raceLevel(), 2));
        el('btn-duo-menu').addEventListener('click', openMenu);

        /* Nút bật tắt ký hiệu cho bé mù màu */
        function paintMarks() {
            ui.markBtn.classList.toggle('is-on', G.marks);
            ui.markBtn.textContent = G.marks ? 'Colour marks: ON' : 'Colour marks: OFF';
        }
        ui.markBtn.addEventListener('click', () => {
            G.marks = !G.marks;
            try { localStorage.setItem(MARK_KEY, G.marks ? '1' : '0'); } catch (e) { }
            paintMarks();
        });
        paintMarks();

        const soundBtn = el('btn-sound');
        const soundIcon = el('sound-icon');
        function paintSound() {
            soundIcon.className = 'fa-solid ' + (sfx.on ? 'fa-volume-high' : 'fa-volume-xmark');
            soundBtn.classList.toggle('is-off', !sfx.on);
        }
        soundBtn.addEventListener('click', () => { sfx.wake(); sfx.toggle(); paintSound(); });
        paintSound();
    }

    /* ========================================================================
     *  13. VÒNG LẶP
     * ======================================================================*/

    let last = 0;

    function frame(now) {
        const t = now / 1000;
        let dt = last ? t - last : 0;
        last = t;
        if (dt > 0.05) dt = 0.05;
        G.time += dt;

        for (const b of G.boards) {
            b.time += dt;
            stepFx(b, dt);
            if (b.pour) {
                b.pour.t += dt;
                if (b.pour.t >= POUR_T) finishPour(b);
            }
        }
        draw();
        requestAnimationFrame(frame);
    }

    function init() {
        store.load();
        sfx.init();
        try { G.marks = localStorage.getItem(MARK_KEY) !== '0'; } catch (e) { }

        G.boards = [makeBoard(1)];
        loadLevel(G.boards[0], 0);
        resize();
        openMenu();
        wireInput();
        wireButtons();

        window.addEventListener('resize', resize);
        if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
        window.addEventListener('orientationchange', () => setTimeout(resize, 200));

        const q = new URLSearchParams(location.search);
        const wantLevel = +(q.get('level') || 0);
        const wantKids = +(q.get('kids') || 0);
        if (wantKids === 2) setTimeout(() => startLevel(raceLevel(), 2), 0);
        else if (wantLevel >= 1 && wantLevel <= LEVELS.length) setTimeout(() => startLevel(wantLevel - 1, 1), 0);

        window.waterSort = {
            G, LEVELS, WORLDS, COLORS, CAP, store,
            topRun, tubeDone, allDone, canPour, legalMoves, applyMove, findSolution,
            start: (n, kids) => startLevel(Math.max(0, Math.min(LEVELS.length - 1, n - 1)), kids || 1),
            tap: (bi, k) => tapTube(bi, k),
            /* Chơi hộ một nước, dùng cho máy soát giao diện */
            play: (bi, m) => {
                const b = G.boards[bi || 0];
                if (!b || b.pour || b.won) return false;
                startPour(b, m[0], m[1], m[2]);
                b.pour.t = POUR_T;
                finishPour(b);
                return true;
            },
            state: () => ({
                mode: G.mode, kids: G.kids,
                boards: G.boards.map(b => ({
                    level: b.level + 1, moves: b.moves, won: b.won,
                    tubes: b.tubes.map(x => x.slice())
                }))
            })
        };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
