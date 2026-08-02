/**
 * Bubble Pop — KIBU Games
 * ----------------------------------------------------------------------------
 * Bắn bóng lên lưới tổ ong: ba quả cùng màu chạm nhau là nổ, cụm nào mất chỗ
 * bám vào trần thì rơi xuống theo.
 *
 * Cả sân vẽ bằng canvas 2D, không dùng thư viện ngoài. Chữ trong game để bên
 * HTML để /i18n.js lo phần dịch; canvas chỉ vẽ hình và vài dòng hiệu ứng ngắn.
 *
 * Bố cục file:
 *   1. Cấu hình      2. Màn chơi     3. Tiến trình    4. Âm thanh
 *   5. Trạng thái    6. Hình học     7. Lưới bóng     8. Bắn & va chạm
 *   9. Hiệu ứng     10. Vẽ          11. Giao diện    12. Vòng lặp
 */
(function () {
    'use strict';

    /* ========================================================================
     *  1. CẤU HÌNH
     * ======================================================================*/

    const COLS = 11;            // số ô của hàng rộng; hàng lệch có 10 ô
    const MAX_ROWS = 22;        // trần trên của mảng lưới, sân thật thấp hơn nhiều

    /* Mỗi màu kèm một ký hiệu riêng ở giữa quả bóng. Bé phân biệt được cả khi
     * không nhận ra màu (khoảng 1/12 bé trai bị rối loạn sắc giác đỏ–lục). */
    const COLORS = [
        { key: '1', light: '#ff8fa3', main: '#ff4d6d', dark: '#c9184a', sym: 'circle' },
        { key: '2', light: '#ffe98a', main: '#ffd43b', dark: '#e8a800', sym: 'ring' },
        { key: '3', light: '#8ed0ff', main: '#4dabf7', dark: '#1971c2', sym: 'triangle' },
        { key: '4', light: '#a9f0b5', main: '#51cf66', dark: '#2b8a3e', sym: 'square' },
        { key: '5', light: '#d3b0ff', main: '#b06cff', dark: '#7048b6', sym: 'diamond' },
        { key: '6', light: '#ffc38f', main: '#ff922b', dark: '#d9480f', sym: 'hexagon' }
    ];

    const KIND = {
        NORMAL: 'normal',   // quả thường, ghép màu được
        ICE: 'ice',         // bọc băng: phải có quả nổ ngay cạnh mới nứt ra
        STONE: 'stone',     // đá: không ghép được, chỉ rơi hoặc bị bom thổi
        STAR: 'star'        // ngôi sao: cứu được khi nó rơi khỏi trần
    };

    const AMMO = {
        NORMAL: 'normal',
        BOMB: 'bomb',       // nổ tung cả vùng quanh chỗ chạm
        RAINBOW: 'rainbow'  // ăn theo màu của quả nó chạm vào
    };

    const OBJ = {
        CLEAR: 'clear',     // dọn sạch bóng thường + bóng băng
        RESCUE: 'rescue',   // thả hết ngôi sao xuống
        COLLECT: 'collect', // nổ đủ N quả một màu
        ICE: 'ice'          // phá hết băng
    };

    const SPEED = 20;           // tốc độ bay, tính theo đường kính bóng mỗi giây
    const POWER_PER_POP = 7;    // mỗi quả nổ nạp bao nhiêu % cho thanh phép
    const SNAP_GAP = 0.86;      // chạm nhau ở khoảng cách này thì dính vào lưới
    /* Không cho bắn sát phương ngang: quả bóng sẽ nảy qua nảy lại giữa hai
     * tường hàng giây đồng hồ mới lên tới trần, bé ngồi chờ mòn mỏi. */
    const AIM_EDGE = 0.30;
    const AIM_MAX = -AIM_EDGE;
    const AIM_MIN = -Math.PI + AIM_EDGE;
    const SHOT_TTL = 3.5;       // bay quá lâu thì cho dính luôn tại chỗ

    const STORE_KEY = 'kibu_bubble_pop_progress';
    const SOUND_KEY = 'kibu_bubble_pop_sound';

    /* ========================================================================
     *  2. MÀN CHƠI
     * ------------------------------------------------------------------------
     *  Mỗi ô trong sơ đồ là một ký tự:
     *      .        ô trống
     *      1 … 6    bóng màu
     *      a … f    bóng màu đó nhưng bọc băng
     *      S        đá        *  ngôi sao        ?  màu ngẫu nhiên
     *
     *  Hàng chẵn có 11 ô, hàng lẻ có 10 ô và lệch sang phải nửa quả. Viết thiếu
     *  ký tự cũng không sao — phần thiếu coi như ô trống.
     * ======================================================================*/

    const CHAPTERS = [
        { name: 'Bubble Beach', from: 0 },
        { name: 'Frozen Cave', from: 6 },
        { name: 'Jungle Party', from: 12 },
        { name: 'Space Bubbles', from: 18 }
    ];

    const LEVELS = [
        /* ---------- Chương 1 — Bubble Beach ---------- */
        {
            name: 'First Pop', tip: 'Three bubbles of the same colour pop!',
            shots: 32, par: 14, colors: 3, obj: { type: OBJ.CLEAR },
            rows: [
                '11233112331',
                '2331122331',
                '31122331122'
            ]
        },
        {
            name: 'Colour Bands', tip: 'Aim at a band of the same colour.',
            shots: 30, par: 18, colors: 3, obj: { type: OBJ.CLEAR },
            rows: [
                '11122233311',
                '2223331112',
                '33311122233',
                '1112223331'
            ]
        },
        {
            name: 'Twin Towers', tip: 'Bounce off the side walls to reach the far tower.',
            shots: 34, par: 18, colors: 3, obj: { type: OBJ.CLEAR },
            rows: [
                '.11.....22.',
                '.33.....33',
                '.22.....11.',
                '.11.....33',
                '.33.....22.',
                '.22.....11'
            ]
        },
        {
            name: 'The Bridge', tip: 'Knock out a pillar and the whole bridge falls.',
            shots: 26, par: 13, colors: 3, obj: { type: OBJ.CLEAR },
            rows: [
                '11111111111',
                '1........1',
                '2.........2',
                '1........1',
                '22333222332'
            ]
        },
        {
            name: 'Big Heart', tip: 'Clear the middle first, the sides drop by themselves.',
            shots: 38, par: 22, colors: 5, obj: { type: OBJ.CLEAR },
            rows: [
                '.115...511.',
                '1155115511',
                '.155111551.',
                '.15511551.',
                '..1155115..',
                '...11551..',
                '....115....',
                '.....1....'
            ]
        },
        {
            name: 'Beach Ball', tip: 'A big ball of four colours. Pop 14 blue ones.',
            shots: 36, par: 24, colors: 4, obj: { type: OBJ.COLLECT, color: 2, count: 14 },
            rows: [
                '...11111...',
                '.22222222.',
                '.333333333.',
                '1111111111',
                '.222222222.',
                '.33333333.',
                '...44444...'
            ]
        },

        /* ---------- Chương 2 — Frozen Cave ---------- */
        {
            name: 'First Ice', tip: 'Ice cracks when a bubble pops right next to it.',
            shots: 36, par: 20, colors: 4, obj: { type: OBJ.CLEAR },
            rows: [
                '11223344112',
                'aabbccddaa',
                '33441122334'
            ]
        },
        {
            name: 'Ice Wall', tip: 'Pop the free rows to melt the frozen ones.',
            shots: 38, par: 24, colors: 4, obj: { type: OBJ.ICE },
            rows: [
                '33441122334',
                'aabbccddaa',
                '11223344112',
                'ccddaabbcc',
                '22114433221'
            ]
        },
        {
            name: 'Stone Gate', tip: 'Stone never pops. Squeeze your shots between them.',
            shots: 36, par: 22, colors: 3, obj: { type: OBJ.CLEAR },
            rows: [
                '1S2S3S1S2S3',
                '1122331122',
                'S3S1S2S3S1S',
                '3311223311'
            ]
        },
        {
            name: 'Frozen Smile', tip: 'Melt every piece of ice on this face.',
            shots: 36, par: 20, colors: 4, obj: { type: OBJ.ICE },
            rows: [
                '..1121211..',
                '1111111111',
                '.1aa111aa1.',
                '1111111111',
                '.111111111.',
                '.13333331.',
                '...11111...'
            ]
        },
        {
            name: 'Icicles', tip: 'Long thin spikes - one good hit drops a whole one.',
            shots: 38, par: 22, colors: 4, obj: { type: OBJ.CLEAR },
            rows: [
                '11223344112',
                'a.b.c.d.a.',
                'b.c.d.a.b..',
                'c.d.a.b.c.'
            ]
        },
        {
            name: 'Snow Fortress', tip: 'The whole cave at once. Take your time.',
            shots: 48, par: 32, colors: 5, obj: { type: OBJ.CLEAR },
            rows: [
                '1S1S1S1S1S1',
                '1122331122',
                'aabbccddaab',
                'SS223311SS',
                '11223311223',
                'aabbccddaa'
            ]
        },

        /* ---------- Chương 3 — Jungle Party ---------- */
        {
            name: 'Caged Star', tip: 'Break what holds the star and it falls free.',
            shots: 28, par: 14, colors: 4, obj: { type: OBJ.RESCUE },
            rows: [
                '11223344112',
                '1122*22331',
                '33441122334'
            ]
        },
        {
            name: 'Three Stars', tip: 'A star only counts once it drops all the way down.',
            shots: 36, par: 20, colors: 4, obj: { type: OBJ.RESCUE },
            rows: [
                '11223344112',
                '1*223*4411',
                '2233*112234',
                '1122334411'
            ]
        },
        {
            name: 'Butterfly', tip: 'Two wings and three stars down the middle.',
            shots: 38, par: 22, colors: 4, obj: { type: OBJ.RESCUE },
            rows: [
                '1133...3311',
                '1122*.2211',
                '11122*22111',
                '1122.*2211',
                '1133...3311'
            ]
        },
        {
            name: 'Tall Tree', tip: 'Two stars are hidden down in the trunk.',
            shots: 34, par: 18, colors: 6, obj: { type: OBJ.RESCUE },
            rows: [
                '....444....',
                '...44444..',
                '..4444444..',
                '.44444444.',
                '....6*6....',
                '....6*6...',
                '....666....'
            ]
        },
        {
            name: 'Star Ladder', tip: 'Four stars, one on each side of the ladder.',
            shots: 42, par: 26, colors: 5, obj: { type: OBJ.RESCUE },
            rows: [
                '11223344112',
                '*11223344*',
                '22334411223',
                '*22334411*',
                '33441122334'
            ]
        },
        {
            name: 'Jungle King', tip: 'Stone, ice and stars all in one. Good luck!',
            shots: 44, par: 30, colors: 5, obj: { type: OBJ.RESCUE },
            rows: [
                'S231132132S',
                '2aa1111aa2',
                '32*13312*23',
                '2231133122',
                '.225555522.',
                '.22*..*22.',
                '..2233222..'
            ]
        },

        /* ---------- Chương 4 — Space Bubbles ---------- */
        {
            name: 'Lift Off', tip: 'Watch out - the sky pushes down every few shots!',
            shots: 40, par: 24, colors: 4, push: 10, obj: { type: OBJ.CLEAR },
            rows: [
                '....444....',
                '...44444..',
                '..4411144..',
                '..44111444',
                '.444111444.',
                '.33.444.33',
                '.33..2..33.'
            ]
        },
        {
            name: 'Meteor Rain', tip: 'Small clumps everywhere. Pick them off fast.',
            shots: 42, par: 26, colors: 5, push: 11, obj: { type: OBJ.CLEAR },
            rows: [
                '111.222.333',
                '11..22..33',
                '.44.555.44.',
                '.4..55..4.',
                '.55.111.55.'
            ]
        },
        {
            name: 'Little Alien', tip: 'Two icy eyes and a stone antenna.',
            shots: 38, par: 24, colors: 5, push: 12, obj: { type: OBJ.ICE },
            rows: [
                '..5.5S5.5..',
                '..555555..',
                '.555555555.',
                '.5aa55aa5.',
                '.555555555.',
                '.55333555.',
                '...55555...'
            ]
        },
        {
            name: 'Ringed Planet', tip: 'The stone ring stays. Clear everything around it.',
            shots: 52, par: 34, colors: 6, push: 11, obj: { type: OBJ.CLEAR },
            rows: [
                '...66666...',
                '.66666666.',
                '.666666666.',
                'SSSSSSSSSS',
                '.333333333.',
                '.33333333.',
                '...33333...'
            ]
        },
        {
            name: 'Black Hole', tip: 'Bounce your shots around the stones in the middle.',
            shots: 46, par: 30, colors: 5, push: 11, obj: { type: OBJ.CLEAR },
            rows: [
                '55111222333',
                '5S11222334',
                '11SSSSS3344',
                '1122SS3344',
                '.223344551.',
                '.22334455.'
            ]
        },
        {
            name: 'Galaxy Boss', tip: 'The last one. Everything you have learned, all at once.',
            shots: 56, par: 38, colors: 6, push: 15, obj: { type: OBJ.RESCUE },
            rows: [
                'S16161616S1',
                '1aa2bb3cc1',
                '16*161*16*1',
                'SS2233445S',
                '11223344556',
                '1a2b3c4d5e',
                '.1*22334*1.',
                '..112233..'
            ]
        }
    ];

    /* ========================================================================
     *  3. TIẾN TRÌNH
     * ======================================================================*/

    const store = {
        data: { stars: {}, best: {}, done: 0 },

        load() {
            try {
                const raw = localStorage.getItem(STORE_KEY);
                if (raw) Object.assign(this.data, JSON.parse(raw));
            } catch (e) { /* chế độ riêng tư, chơi được nhưng không nhớ */ }
        },
        save() {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        starsOf(i) { return this.data.stars[i] || 0; },
        bestOf(i) { return this.data.best[i] || 0; },
        totalStars() {
            let n = 0;
            for (const k in this.data.stars) n += this.data.stars[k];
            return n;
        },
        /* Màn 1 luôn mở; các màn sau mở khi màn ngay trước đã qua. */
        unlocked(i) { return i === 0 || (this.data.stars[i - 1] || 0) > 0; },
        record(i, stars, score) {
            if (stars > this.starsOf(i)) this.data.stars[i] = stars;
            if (score > this.bestOf(i)) this.data.best[i] = score;
            if (i + 1 > this.data.done) this.data.done = i + 1;
            this.save();
        },
        reset() {
            this.data = { stars: {}, best: {}, done: 0 };
            this.save();
        }
    };

    /* ========================================================================
     *  4. ÂM THANH
     * ------------------------------------------------------------------------
     *  Vài tiếng "bụp" tổng hợp bằng Web Audio, không tải file nào cả.
     * ======================================================================*/

    const sfx = {
        on: true,
        ctx: null,

        init() {
            try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { }
        },
        /* AudioContext chỉ được tạo sau cú chạm đầu tiên — trình duyệt chặn
         * âm thanh tự phát, tạo sớm thì nó nằm im ở trạng thái "suspended". */
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
        blip(freq, dur, type, vol) {
            if (!this.on || !this.ctx) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol || 0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        },
        shoot() { this.blip(320, 0.09, 'triangle', 0.09); },
        stick() { this.blip(200, 0.07, 'sine', 0.08); },
        pop(n) { this.blip(420 + Math.min(n, 8) * 55, 0.12, 'sine', 0.13); },
        crack() { this.blip(900, 0.08, 'square', 0.05); },
        drop() { this.blip(160, 0.18, 'sine', 0.1); },
        star() { this.blip(1050, 0.16, 'triangle', 0.12); },
        boom() { this.blip(90, 0.3, 'sawtooth', 0.16); },
        win() {
            [523, 659, 784, 1046].forEach((f, i) =>
                setTimeout(() => this.blip(f, 0.22, 'triangle', 0.13), i * 110));
        },
        lose() {
            [392, 330, 262].forEach((f, i) =>
                setTimeout(() => this.blip(f, 0.26, 'sine', 0.12), i * 140));
        }
    };

    /* ========================================================================
     *  5. TRẠNG THÁI
     * ======================================================================*/

    const G = {
        mode: 'menu',        // menu | play | win | lose | levels | all
        levelIndex: 0,
        level: null,

        grid: [],            // grid[r][c] = quả bóng hoặc null
        parity: 0,           // 0 → hàng 0 là hàng rộng; đảo mỗi lần trần tụt
        palette: [],         // các chỉ số màu màn này dùng

        shotsLeft: 0,
        shotsUsed: 0,
        score: 0,
        power: 0,            // 0…100, đầy thì đổi được đạn phép
        pushIn: 0,           // còn mấy phát nữa thì trần tụt xuống

        collected: 0,        // đếm cho mục tiêu COLLECT
        rescued: 0,          // số sao đã cứu
        starsTotal: 0,       // số sao có trong màn
        iceTotal: 0,

        current: null,       // đạn đang nằm trên bệ
        next: null,          // đạn chờ
        shot: null,          // đạn đang bay
        aim: -Math.PI / 2,   // góc nòng, âm là hướng lên
        aiming: false,

        falling: [],
        particles: [],
        popping: [],
        floats: [],          // chữ điểm bay lên
        settleAt: 0,         // mốc thời gian chờ bàn lắng xuống rồi mới kết luận
        shakeUntil: 0,
        time: 0
    };

    /* ========================================================================
     *  6. HÌNH HỌC
     * ======================================================================*/

    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');

    const V = {              // các số đo tính lại mỗi lần đổi cỡ màn hình
        w: 0, h: 0,          // cỡ canvas theo CSS pixel
        playX: 0, playW: 0,
        d: 40, r: 20, rowH: 34,
        topY: 0, deadY: 0, gunY: 0,
        maxRows: 12
    };

    function isWide(r) { return ((r + G.parity) % 2) === 0; }
    function colsIn(r) { return isWide(r) ? COLS : COLS - 1; }

    function cellX(r, c) { return V.playX + V.r + c * V.d + (isWide(r) ? 0 : V.r); }
    function cellY(r) { return V.topY + V.r + r * V.rowH; }

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
        /* Cột chơi luôn cao gấp rưỡi bề ngang trở lên: sân bè ngang thì quả bóng
         * to đến mức chỉ còn bốn hàng nằm lọt phía trên nòng súng. */
        V.playW = Math.min(w, h * 0.68, 640);
        V.playX = (w - V.playW) / 2;
        V.d = V.playW / COLS;
        V.r = V.d / 2;
        V.rowH = V.d * 0.866;
        /* Trần lưới phải nằm DƯỚI thanh thông tin đang nổi ở trên: để sát mép
           canvas thì hàng bóng đầu tiên chui vào sau mấy thẻ HUD. */
        V.topY = Math.max(44, Math.min(70, h * 0.075));
        V.gunY = h - V.d * 1.15;
        V.deadY = V.gunY - V.d * 0.75;
        V.maxRows = Math.max(6, Math.floor((V.deadY - V.topY) / V.rowH));

        syncPositions();
    }

    function syncPositions() {
        eachBubble(b => { b.x = cellX(b.r, b.c); b.y = cellY(b.r); });
    }

    /* ========================================================================
     *  7. LƯỚI BÓNG
     * ======================================================================*/

    function eachBubble(fn) {
        for (let r = 0; r < G.grid.length; r++) {
            const row = G.grid[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) if (row[c]) fn(row[c], r, c);
        }
    }

    function at(r, c) {
        if (r < 0 || r >= G.grid.length) return null;
        const row = G.grid[r];
        if (!row || c < 0 || c >= row.length) return null;
        return row[c];
    }

    function put(r, c, b) {
        if (r < 0 || r >= G.grid.length) return;
        const row = G.grid[r];
        if (!row || c < 0 || c >= row.length) return;
        row[c] = b;
        if (b) { b.r = r; b.c = c; b.x = cellX(r, c); b.y = cellY(r); }
    }

    /* Sáu ô kề nhau trong lưới tổ ong. Hàng rộng và hàng lẹp lệch nhau nửa quả
     * nên hai ô chéo ở trên/dưới đổi chỉ số theo chính chẵn lẻ của hàng. */
    function neighbors(r, c) {
        const out = [];
        const odd = !isWide(r);           // hàng lệch sang phải
        const around = odd
            ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
            : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
        for (const [dr, dc] of around) {
            const b = at(r + dr, c + dc);
            if (b) out.push(b);
        }
        return out;
    }

    function emptyNeighborCells(r, c) {
        const out = [];
        const odd = !isWide(r);
        const around = odd
            ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
            : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
        for (const [dr, dc] of around) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || rr >= G.grid.length) continue;
            if (cc < 0 || cc >= colsIn(rr)) continue;
            if (!at(rr, cc)) out.push({ r: rr, c: cc });
        }
        return out;
    }

    function makeRow(r) {
        return new Array(colsIn(r)).fill(null);
    }

    function newBubble(kind, color) {
        return { kind, color, r: 0, c: 0, x: 0, y: 0, born: G.time, wob: Math.random() * 6.28 };
    }

    /* ---- nạp một màn từ sơ đồ ký tự ---- */
    function buildLevel(index) {
        const lv = LEVELS[index];
        G.levelIndex = index;
        G.level = lv;
        G.parity = 0;
        G.grid = [];
        for (let r = 0; r < MAX_ROWS; r++) G.grid.push(makeRow(r));

        G.palette = [];
        for (let i = 0; i < (lv.colors || 4); i++) G.palette.push(i);

        G.starsTotal = 0;
        G.iceTotal = 0;

        lv.rows.forEach((line, r) => {
            const n = colsIn(r);
            for (let c = 0; c < n && c < line.length; c++) {
                const ch = line[c];
                if (ch === '.' || ch === ' ') continue;
                let b = null;
                if (ch >= '1' && ch <= '6') {
                    b = newBubble(KIND.NORMAL, +ch - 1);
                } else if (ch >= 'a' && ch <= 'f') {
                    b = newBubble(KIND.ICE, ch.charCodeAt(0) - 97);
                    G.iceTotal++;
                } else if (ch === 'S') {
                    b = newBubble(KIND.STONE, -1);
                } else if (ch === '*') {
                    b = newBubble(KIND.STAR, -1);
                    G.starsTotal++;
                } else if (ch === '?') {
                    b = newBubble(KIND.NORMAL, pick(G.palette));
                }
                if (b) put(r, c, b);
            }
        });

        G.shotsLeft = lv.shots;
        G.shotsUsed = 0;
        G.score = 0;
        G.power = 0;
        G.pushIn = lv.push || 0;
        G.collected = 0;
        G.rescued = 0;
        G.falling = [];
        G.particles = [];
        G.popping = [];
        G.floats = [];
        G.shot = null;
        G.settleAt = 0;
        G.aim = -Math.PI / 2;

        G.current = rollAmmo();
        G.next = rollAmmo();
        syncPositions();
    }

    /* Chỉ nạp những màu còn trên bàn, không thì bé cầm quả tím trong khi bàn
     * chỉ còn xanh với đỏ — bắn kiểu gì cũng không nổ được. */
    function liveColors() {
        const seen = [];
        eachBubble(b => {
            if ((b.kind === KIND.NORMAL || b.kind === KIND.ICE) && seen.indexOf(b.color) < 0) {
                seen.push(b.color);
            }
        });
        return seen.length ? seen : G.palette.slice();
    }

    function rollAmmo() {
        return { type: AMMO.NORMAL, color: pick(liveColors()) };
    }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    /* ---- tìm ô trống để quả đạn dính vào ---- */
    function snapCell(x, y) {
        let best = null, bestD = Infinity;
        const rGuess = Math.round((y - V.topY - V.r) / V.rowH);

        for (let r = Math.max(0, rGuess - 2); r <= Math.min(G.grid.length - 1, rGuess + 2); r++) {
            const n = colsIn(r);
            for (let c = 0; c < n; c++) {
                if (at(r, c)) continue;
                /* Ô hợp lệ phải chạm trần hoặc dính vào một quả đã có; nếu không
                 * quả đạn sẽ treo lơ lửng giữa khoảng trống. */
                if (r > 0 && neighbors(r, c).length === 0) continue;
                const dx = cellX(r, c) - x, dy = cellY(r) - y;
                const d = dx * dx + dy * dy;
                if (d < bestD) { bestD = d; best = { r, c }; }
            }
        }
        return best;
    }

    /* ---- cụm cùng màu ---- */
    function sameColorCluster(start) {
        const seen = new Set([start]);
        const stack = [start], out = [start];
        while (stack.length) {
            const b = stack.pop();
            for (const n of neighbors(b.r, b.c)) {
                if (seen.has(n)) continue;
                if (n.kind !== KIND.NORMAL) continue;      // băng, đá, sao không tính
                if (n.color !== start.color) continue;
                seen.add(n); out.push(n); stack.push(n);
            }
        }
        return out;
    }

    /* ---- những quả mất chỗ bám vào trần ---- */
    function floatingBubbles() {
        const safe = new Set();
        const stack = [];
        const top = G.grid[0] || [];
        for (let c = 0; c < top.length; c++) {
            if (top[c]) { safe.add(top[c]); stack.push(top[c]); }
        }
        while (stack.length) {
            const b = stack.pop();
            for (const n of neighbors(b.r, b.c)) {
                if (!safe.has(n)) { safe.add(n); stack.push(n); }
            }
        }
        const out = [];
        eachBubble(b => { if (!safe.has(b)) out.push(b); });
        return out;
    }

    /* ========================================================================
     *  8. BẮN & VA CHẠM
     * ======================================================================*/

    function gunX() { return V.playX + V.playW / 2; }

    function fire() {
        if (G.mode !== 'play' || G.shot || !G.current) return;
        if (G.shotsLeft <= 0) return;
        if (G.aim > AIM_MAX || G.aim < AIM_MIN) return;

        sfx.wake();
        sfx.shoot();
        const speed = V.d * SPEED;
        G.shot = {
            type: G.current.type,
            color: G.current.color,
            x: gunX(), y: V.gunY,
            vx: Math.cos(G.aim) * speed,
            vy: Math.sin(G.aim) * speed,
            born: G.time,
            trail: []
        };
        G.current = G.next;
        G.next = rollAmmo();
        G.shotsLeft--;
        G.shotsUsed++;
        updateHud();
    }

    function swapAmmo() {
        if (G.mode !== 'play' || G.shot) return;
        const t = G.current; G.current = G.next; G.next = t;
        sfx.blip(560, 0.06, 'sine', 0.07);
    }

    function usePower() {
        if (G.mode !== 'play' || G.shot || G.power < 100) return;
        G.power = 0;
        /* Đạn phép đổi luân phiên để bé nào cũng gặp cả hai loại. */
        G.current = (Math.random() < 0.5)
            ? { type: AMMO.BOMB, color: -1 }
            : { type: AMMO.RAINBOW, color: -1 };
        sfx.blip(880, 0.18, 'triangle', 0.14);
        updateHud();
    }

    function moveShot(dt) {
        const s = G.shot;
        if (!s) return;
        /* Lưới thưa quá thì có đường bay chẳng gặp gì hàng giây; chốt lại cho
         * chắc, không thì phần kiểm tra thắng/thua bị treo theo quả bóng. */
        if (G.time - s.born > SHOT_TTL) { land(s, false); return; }
        const dist = Math.hypot(s.vx, s.vy) * dt;
        const steps = Math.max(1, Math.ceil(dist / (V.r * 0.4)));
        const h = dt / steps;

        for (let i = 0; i < steps; i++) {
            s.x += s.vx * h;
            s.y += s.vy * h;

            const left = V.playX + V.r, right = V.playX + V.playW - V.r;
            if (s.x < left) { s.x = left; s.vx = -s.vx; sfx.blip(500, 0.04, 'sine', 0.05); }
            if (s.x > right) { s.x = right; s.vx = -s.vx; sfx.blip(500, 0.04, 'sine', 0.05); }

            if (s.y - V.r <= V.topY) { land(s, true); return; }

            const hit = hitTest(s.x, s.y);
            if (hit) { land(s, false, hit); return; }
        }

        s.trail.push({ x: s.x, y: s.y, t: G.time });
        if (s.trail.length > 12) s.trail.shift();
    }

    function hitTest(x, y) {
        const lim = (V.d * SNAP_GAP) * (V.d * SNAP_GAP);
        let found = null, bestD = Infinity;
        const rGuess = Math.round((y - V.topY - V.r) / V.rowH);
        for (let r = Math.max(0, rGuess - 2); r <= Math.min(G.grid.length - 1, rGuess + 2); r++) {
            const row = G.grid[r];
            if (!row) continue;
            for (let c = 0; c < row.length; c++) {
                const b = row[c];
                if (!b) continue;
                const dx = b.x - x, dy = b.y - y;
                const d = dx * dx + dy * dy;
                if (d < lim && d < bestD) { bestD = d; found = b; }
            }
        }
        return found;
    }

    function land(s, onCeiling, hitBubble) {
        G.shot = null;

        if (s.type === AMMO.BOMB) {
            explode(s.x, s.y);
            afterMove();
            return;
        }

        const cell = snapCell(s.x, s.y);
        if (!cell) { afterMove(); return; }

        let color = s.color;
        if (s.type === AMMO.RAINBOW) {
            /* Ăn theo màu đông nhất quanh chỗ nó dính vào, thế mới nổ được cụm
             * to nhất — cầu vồng mà lấy màu ngẫu nhiên thì chẳng khác đạn thường. */
            const tally = {};
            let bestColor = hitBubble && hitBubble.kind === KIND.NORMAL ? hitBubble.color : -1;
            let bestN = 0;
            for (const n of neighbors(cell.r, cell.c)) {
                if (n.kind !== KIND.NORMAL) continue;
                tally[n.color] = (tally[n.color] || 0) + 1;
                if (tally[n.color] > bestN) { bestN = tally[n.color]; bestColor = n.color; }
            }
            color = bestColor >= 0 ? bestColor : pick(liveColors());
        }

        const b = newBubble(KIND.NORMAL, color);
        put(cell.r, cell.c, b);
        sfx.stick();

        const cluster = sameColorCluster(b);
        if (cluster.length >= 3) {
            popCluster(cluster);
        } else {
            /* Bắn trượt vẫn nạp chút phép, không thì bé kẹt màn khó mãi. */
            addPower(2);
        }
        afterMove();
    }

    function explode(x, y) {
        sfx.boom();
        G.shakeUntil = G.time + 0.35;
        const rad = V.d * 1.75;
        const hitList = [];
        eachBubble(b => {
            if (Math.hypot(b.x - x, b.y - y) <= rad) hitList.push(b);
        });
        boom(x, y);
        removeBubbles(hitList, true);
        addScore(hitList.length * 15, x, y);
    }

    function popCluster(list) {
        sfx.pop(list.length);
        const bonus = list.length > 3 ? (list.length - 3) * 5 : 0;
        addScore(list.length * 10 + bonus, list[0].x, list[0].y);
        addPower(list.length * POWER_PER_POP);

        if (list.length >= 5) {
            const label = list.length >= 8 ? 'AMAZING!' : 'GREAT!';
            G.floats.push({ text: label, x: list[0].x, y: list[0].y - V.d, born: G.time, big: true });
        }

        removeBubbles(list, true);
    }

    function removeBubbles(list, crackAround) {
        const touched = [];
        list.forEach(b => {
            if (at(b.r, b.c) !== b) return;
            put(b.r, b.c, null);
            G.popping.push({ b, x: b.x, y: b.y, born: G.time });
            burst(b.x, b.y, colorOf(b));
            if (crackAround) touched.push(...neighbors(b.r, b.c));

            if (b.kind === KIND.STAR) {
                G.rescued++;
                sfx.star();
                G.floats.push({ text: '+100', x: b.x, y: b.y, born: G.time });
            }
            if (G.level.obj.type === OBJ.COLLECT && b.kind === KIND.NORMAL && b.color === G.level.obj.color) {
                G.collected++;
            }
        });

        /* Băng chỉ nứt nhờ một quả nổ ngay cạnh; nứt rồi thì thành quả thường
         * và ghép màu được như mọi quả khác. */
        let cracked = 0;
        touched.forEach(n => {
            if (n.kind === KIND.ICE && at(n.r, n.c) === n) {
                n.kind = KIND.NORMAL;
                n.crackedAt = G.time;
                cracked++;
            }
        });
        if (cracked) sfx.crack();
    }

    function afterMove() {
        const loose = floatingBubbles();
        if (loose.length) {
            sfx.drop();
            loose.forEach((b, i) => {
                put(b.r, b.c, null);
                G.falling.push({
                    b, x: b.x, y: b.y,
                    vx: (Math.random() - 0.5) * V.d * 1.6,
                    vy: -V.d * (0.6 + Math.random() * 0.5),
                    rot: 0, spin: (Math.random() - 0.5) * 6, born: G.time + i * 0.01
                });
                if (b.kind === KIND.STAR) {
                    G.rescued++;
                    sfx.star();
                    G.floats.push({ text: '+100', x: b.x, y: b.y, born: G.time });
                }
                if (G.level.obj.type === OBJ.COLLECT && b.kind === KIND.NORMAL && b.color === G.level.obj.color) {
                    G.collected++;
                }
            });
            addScore(loose.length * 20 + G.rescued * 0, loose[0].x, loose[0].y);
        }

        /* Trần tụt xuống sau mỗi vài phát — chỉ những màn có khai báo push. */
        if (G.level.push) {
            G.pushIn--;
            if (G.pushIn <= 0) {
                G.pushIn = G.level.push;
                pushDown();
            }
        }

        G.current = G.current || rollAmmo();
        recolorAmmo();
        updateHud();
        G.settleAt = G.time + 0.45;      // chờ hiệu ứng rơi xong mới phán thắng thua
    }

    /* Màu trên bàn thay đổi liên tục; quả đạn đang cầm mà mang màu đã biến mất
     * thì thành quả vô dụng, đổi sang màu còn sống. */
    function recolorAmmo() {
        const live = liveColors();
        [G.current, G.next].forEach(a => {
            if (a && a.type === AMMO.NORMAL && live.indexOf(a.color) < 0) a.color = pick(live);
        });
    }

    function pushDown() {
        G.parity ^= 1;
        eachBubble(b => b.r++);
        G.grid.unshift(makeRow(0));
        G.grid.length = Math.min(G.grid.length, MAX_ROWS + 4);

        const live = liveColors();
        const row = G.grid[0];
        for (let c = 0; c < row.length; c++) {
            /* Hàng mới có lỗ: hàng kín mít vừa dồn bé quá nhanh vừa bịt hết
             * đường bắn lên trần, mà trần là chỗ dễ ghép nhất. */
            row[c] = Math.random() < 0.3 ? null : newBubble(KIND.NORMAL, pick(live));
        }
        /* Ô mới chỉ đúng chỗ sau khi cả lưới đã dịch — gán lại toạ độ một lượt. */
        for (let c = 0; c < row.length; c++) put(0, c, row[c]);
        syncPositions();
        sfx.blip(140, 0.22, 'sawtooth', 0.1);
        G.shakeUntil = G.time + 0.3;
    }

    function addScore(n, x, y) {
        G.score += n;
        if (n >= 40 && x != null) G.floats.push({ text: '+' + n, x, y, born: G.time });
    }

    function addPower(n) {
        G.power = Math.min(100, G.power + n);
        updateHud();
    }

    function colorOf(b) {
        if (b.kind === KIND.STONE) return { light: '#c7cdd6', main: '#8a94a6', dark: '#5b6472' };
        if (b.kind === KIND.STAR) return { light: '#ffffff', main: '#e8f1ff', dark: '#9fb4d0' };
        return COLORS[b.color] || COLORS[0];
    }

    /* ---- điều kiện thắng / thua ---- */
    function poppableLeft() {
        let n = 0;
        eachBubble(b => { if (b.kind === KIND.NORMAL || b.kind === KIND.ICE) n++; });
        return n;
    }

    function iceLeft() {
        let n = 0;
        eachBubble(b => { if (b.kind === KIND.ICE) n++; });
        return n;
    }

    function objectiveDone() {
        const o = G.level.obj;
        if (o.type === OBJ.CLEAR) return poppableLeft() === 0;
        if (o.type === OBJ.RESCUE) return G.rescued >= G.starsTotal;
        if (o.type === OBJ.COLLECT) return G.collected >= o.count;
        if (o.type === OBJ.ICE) return iceLeft() === 0;
        return false;
    }

    function reachedBottom() {
        let bad = false;
        eachBubble(b => { if (b.y + V.r > V.deadY) bad = true; });
        return bad;
    }

    function checkEnd() {
        if (G.mode !== 'play') return;
        if (G.shot || G.falling.length || G.popping.length) return;
        if (G.time < G.settleAt) return;

        if (objectiveDone()) return win();
        if (reachedBottom()) return lose('bottom');
        if (poppableLeft() === 0) return lose('shots');
        if (G.shotsLeft <= 0) return lose('shots');
    }

    function starsEarned() {
        const par = G.level.par || Math.round(G.level.shots * 0.7);
        if (G.shotsUsed <= par) return 3;
        if (G.shotsUsed <= par + 5) return 2;
        return 1;
    }

    function win() {
        G.mode = 'win';
        sfx.win();
        const stars = starsEarned();
        const bonus = G.shotsLeft * 25;
        G.score += bonus;
        store.record(G.levelIndex, stars, G.score);
        showWin(stars, bonus);
    }

    function lose(why) {
        G.mode = 'lose';
        sfx.lose();
        showLose(why);
    }

    /* ---- đường ngắm, có tính cả cú nảy tường ---- */
    function aimPath() {
        const pts = [{ x: gunX(), y: V.gunY }];
        let x = gunX(), y = V.gunY;
        let dx = Math.cos(G.aim), dy = Math.sin(G.aim);
        const step = V.r * 0.5;
        const left = V.playX + V.r, right = V.playX + V.playW - V.r;
        let bounces = 0;

        for (let i = 0; i < 900; i++) {
            x += dx * step; y += dy * step;
            if (x < left) { x = left; dx = -dx; bounces++; pts.push({ x, y }); }
            else if (x > right) { x = right; dx = -dx; bounces++; pts.push({ x, y }); }
            if (bounces > 3) break;
            if (y - V.r <= V.topY) { pts.push({ x, y }); break; }
            if (hitTest(x, y)) { pts.push({ x, y }); break; }
        }
        pts.push({ x, y });
        return pts;
    }

    /* ========================================================================
     *  9. HIỆU ỨNG
     * ======================================================================*/

    function burst(x, y, col) {
        for (let i = 0; i < 9; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = V.d * (0.8 + Math.random() * 2.2);
            G.particles.push({
                x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                r: V.r * (0.12 + Math.random() * 0.22),
                life: 0.5 + Math.random() * 0.35, age: 0, col: col.main
            });
        }
    }

    function boom(x, y) {
        for (let i = 0; i < 34; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = V.d * (1.5 + Math.random() * 4);
            G.particles.push({
                x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                r: V.r * (0.15 + Math.random() * 0.35),
                life: 0.6 + Math.random() * 0.5, age: 0,
                col: pick(['#ffd43b', '#ff922b', '#ff6b35', '#fff3bf'])
            });
        }
    }

    function stepEffects(dt) {
        const g = V.d * 22;

        for (let i = G.particles.length - 1; i >= 0; i--) {
            const p = G.particles[i];
            p.age += dt;
            if (p.age >= p.life) { G.particles.splice(i, 1); continue; }
            p.vy += g * 0.4 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        for (let i = G.falling.length - 1; i >= 0; i--) {
            const f = G.falling[i];
            f.vy += g * dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.rot += f.spin * dt;
            if (f.y - V.r > V.h) G.falling.splice(i, 1);
        }

        for (let i = G.popping.length - 1; i >= 0; i--) {
            if (G.time - G.popping[i].born > 0.22) G.popping.splice(i, 1);
        }

        for (let i = G.floats.length - 1; i >= 0; i--) {
            if (G.time - G.floats[i].born > 1.0) G.floats.splice(i, 1);
        }
    }

    /* ========================================================================
     *  10. VẼ
     * ======================================================================*/

    const SKY = [
        ['#0d3b66', '#1b6ca8', '#48b8d0'],   // Bubble Beach
        ['#0b2545', '#13315c', '#3c6e9a'],   // Frozen Cave
        ['#0b2b1e', '#14532d', '#3f8f52'],   // Jungle Party
        ['#150a2e', '#2a1055', '#5b2a86']    // Space Bubbles
    ];

    const deco = [];
    function seedDeco() {
        deco.length = 0;
        for (let i = 0; i < 26; i++) {
            deco.push({
                x: Math.random(), y: Math.random(),
                r: 0.004 + Math.random() * 0.02,
                s: 0.2 + Math.random() * 0.8
            });
        }
    }

    function chapterOf(i) {
        let ch = 0;
        CHAPTERS.forEach((c, k) => { if (i >= c.from) ch = k; });
        return ch;
    }

    function draw() {
        const ch = chapterOf(G.levelIndex);
        const sky = SKY[ch];

        ctx.save();
        if (G.time < G.shakeUntil) {
            const k = (G.shakeUntil - G.time) * 12;
            ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
        }

        const bg = ctx.createLinearGradient(0, 0, 0, V.h);
        bg.addColorStop(0, sky[0]);
        bg.addColorStop(0.55, sky[1]);
        bg.addColorStop(1, sky[2]);
        ctx.fillStyle = bg;
        ctx.fillRect(-20, -20, V.w + 40, V.h + 40);

        /* Bọt nền trôi lên chậm cho sân đỡ tĩnh. */
        ctx.globalAlpha = 0.13;
        ctx.fillStyle = '#ffffff';
        deco.forEach(d => {
            const y = ((d.y - (G.time * 0.02 * d.s)) % 1 + 1) % 1;
            ctx.beginPath();
            ctx.arc(d.x * V.w, y * V.h, d.r * V.w, 0, 6.283);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        drawColumn();
        drawGrid();
        drawFalling();
        drawShot();
        if (G.mode === 'play' && !G.shot) drawAim();
        drawGun();
        drawParticles();
        drawFloats();

        ctx.restore();
    }

    function drawColumn() {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(V.playX, 0, V.playW, V.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(V.playX + 1, 0); ctx.lineTo(V.playX + 1, V.h);
        ctx.moveTo(V.playX + V.playW - 1, 0); ctx.lineTo(V.playX + V.playW - 1, V.h);
        ctx.stroke();

        /* Vạch đỏ: bóng chạm tới đây là thua. */
        ctx.setLineDash([10, 8]);
        ctx.strokeStyle = 'rgba(255,90,110,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(V.playX + 4, V.deadY);
        ctx.lineTo(V.playX + V.playW - 4, V.deadY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    function drawGrid() {
        eachBubble(b => drawBubble(b.x, b.y, V.r, b, 1));
        G.popping.forEach(p => {
            const k = (G.time - p.born) / 0.22;
            ctx.save();
            ctx.globalAlpha = 1 - k;
            drawBubble(p.x, p.y, V.r * (1 + k * 0.6), p.b, 1);
            ctx.restore();
        });
    }

    function drawFalling() {
        G.falling.forEach(f => {
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rot);
            drawBubble(0, 0, V.r, f.b, 1);
            ctx.restore();
        });
    }

    function drawShot() {
        const s = G.shot;
        if (!s) return;
        ctx.save();
        s.trail.forEach((t, i) => {
            ctx.globalAlpha = (i / s.trail.length) * 0.28;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, V.r * 0.5, 0, 6.283);
            ctx.fill();
        });
        ctx.restore();
        drawAmmo(s.x, s.y, V.r, s);
    }

    function drawAim() {
        const pts = aimPath();
        ctx.save();
        ctx.setLineDash([7, 9]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.setLineDash([]);

        const end = pts[pts.length - 1];
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(end.x, end.y, V.r * 0.9, 0, 6.283);
        ctx.stroke();
        ctx.restore();
    }

    function drawGun() {
        const x = gunX(), y = V.gunY;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(G.aim + Math.PI / 2);
        const bl = V.d * 0.95;
        const grad = ctx.createLinearGradient(0, 0, 0, -bl);
        grad.addColorStop(0, '#8ea9c4');
        grad.addColorStop(1, '#d7e5f3');
        ctx.fillStyle = grad;
        roundRect(-V.r * 0.42, -bl, V.r * 0.84, bl, V.r * 0.3);
        ctx.fill();
        ctx.restore();

        ctx.save();
        const base = ctx.createRadialGradient(x - V.r * 0.3, y - V.r * 0.3, V.r * 0.1, x, y, V.d * 0.9);
        base.addColorStop(0, '#f2f7ff');
        base.addColorStop(1, '#6c86a5');
        ctx.fillStyle = base;
        ctx.beginPath();
        ctx.arc(x, y, V.d * 0.72, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        if (G.current) drawAmmo(x, y, V.r * 0.95, G.current);

        /* Quả chờ nằm chếch bên phải bệ, chạm vào là đổi chỗ cho quả đang nạp. */
        if (G.next) {
            const nx = x + V.d * 1.5, ny = y + V.d * 0.1;
            ctx.save();
            ctx.globalAlpha = 0.95;
            drawAmmo(nx, ny, V.r * 0.68, G.next);
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(nx, ny, V.r * 0.92, 0, 6.283);
            ctx.stroke();
            ctx.restore();
        }
    }

    function drawAmmo(x, y, r, a) {
        if (a.type === AMMO.BOMB) {
            drawBubble(x, y, r, { kind: 'bombAmmo', color: -1 }, 1);
        } else if (a.type === AMMO.RAINBOW) {
            drawBubble(x, y, r, { kind: 'rainbowAmmo', color: -1 }, 1);
        } else {
            drawBubble(x, y, r, { kind: KIND.NORMAL, color: a.color }, 1);
        }
    }

    function drawBubble(x, y, r, b, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha == null ? 1 : alpha;

        let col;
        if (b.kind === 'bombAmmo') col = { light: '#ffb3a7', main: '#ff5b3b', dark: '#a3200c' };
        else if (b.kind === 'rainbowAmmo') col = { light: '#ffffff', main: '#7cf', dark: '#59f' };
        else col = colorOf(b);

        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.12, x, y, r);
        if (b.kind === 'rainbowAmmo') {
            /* Cầu vồng: vẽ sáu múi màu rồi phủ bóng sáng lên trên. */
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r * 0.94, 0, 6.283);
            ctx.clip();
            COLORS.forEach((c, i) => {
                ctx.fillStyle = c.main;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.arc(x, y, r, (i / 6) * 6.283 + G.time * 1.2, ((i + 1) / 6) * 6.283 + G.time * 1.2);
                ctx.closePath();
                ctx.fill();
            });
            ctx.restore();
        } else {
            g.addColorStop(0, col.light);
            g.addColorStop(0.62, col.main);
            g.addColorStop(1, col.dark);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.94, 0, 6.283);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = Math.max(1, r * 0.07);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.94, 0, 6.283);
        ctx.stroke();

        /* Đốm sáng nhỏ phía trên trái cho quả bóng trông tròn và bóng. */
        ctx.globalAlpha = (alpha == null ? 1 : alpha) * 0.55;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.32, y - r * 0.36, r * 0.26, r * 0.18, -0.6, 0, 6.283);
        ctx.fill();
        ctx.globalAlpha = alpha == null ? 1 : alpha;

        if (b.kind === KIND.NORMAL && b.color >= 0) {
            drawSymbol(COLORS[b.color].sym, x, y, r * 0.42);
        } else if (b.kind === KIND.ICE) {
            drawSymbol(COLORS[b.color] ? COLORS[b.color].sym : 'circle', x, y, r * 0.38);
            drawIce(x, y, r);
        } else if (b.kind === KIND.STONE) {
            drawStone(x, y, r);
        } else if (b.kind === KIND.STAR) {
            drawStar(x, y, r * 0.66, '#ffb703');
        } else if (b.kind === 'bombAmmo') {
            drawFuse(x, y, r);
        }

        ctx.restore();
    }

    function drawSymbol(sym, x, y, s) {
        ctx.save();
        ctx.globalAlpha *= 0.42;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (sym === 'circle') {
            ctx.arc(x, y, s * 0.72, 0, 6.283);
        } else if (sym === 'ring') {
            /* Vành khuyên: vẽ hai cung ngược chiều, phần giữa thành lỗ. */
            ctx.arc(x, y, s * 0.8, 0, 6.283);
            ctx.arc(x, y, s * 0.42, 0, 6.283, true);
        } else if (sym === 'star') {
            starPath(x, y, s, s * 0.45, 5);
        } else if (sym === 'triangle') {
            ctx.moveTo(x, y - s * 0.85);
            ctx.lineTo(x + s * 0.8, y + s * 0.6);
            ctx.lineTo(x - s * 0.8, y + s * 0.6);
            ctx.closePath();
        } else if (sym === 'square') {
            ctx.rect(x - s * 0.62, y - s * 0.62, s * 1.24, s * 1.24);
        } else if (sym === 'diamond') {
            ctx.moveTo(x, y - s * 0.9);
            ctx.lineTo(x + s * 0.75, y);
            ctx.lineTo(x, y + s * 0.9);
            ctx.lineTo(x - s * 0.75, y);
            ctx.closePath();
        } else if (sym === 'hexagon') {
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * 6.283 - Math.PI / 2;
                const px = x + Math.cos(a) * s * 0.82, py = y + Math.sin(a) * s * 0.82;
                i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            }
            ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
    }

    function starPath(x, y, outer, inner, points) {
        for (let i = 0; i < points * 2; i++) {
            const rr = i % 2 ? inner : outer;
            const a = (i / (points * 2)) * 6.283 - Math.PI / 2;
            const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
    }

    function drawStar(x, y, r, fill) {
        ctx.save();
        ctx.fillStyle = fill;
        ctx.shadowColor = 'rgba(255,183,3,0.95)';
        ctx.shadowBlur = r * 0.8;
        ctx.beginPath();
        starPath(x, y, r, r * 0.44, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#a86400';
        ctx.lineWidth = Math.max(1, r * 0.12);
        ctx.stroke();
        ctx.restore();
    }

    function drawIce(x, y, r) {
        ctx.save();
        ctx.globalAlpha *= 0.85;
        const g = ctx.createRadialGradient(x, y - r * 0.2, r * 0.2, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.72)');
        g.addColorStop(1, 'rgba(175,225,255,0.5)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.94, 0, 6.283);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(1, r * 0.08);
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI;
            ctx.moveTo(x - Math.cos(a) * r * 0.7, y - Math.sin(a) * r * 0.7);
            ctx.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7);
        }
        ctx.stroke();
        ctx.restore();
    }

    function drawStone(x, y, r) {
        ctx.save();
        ctx.globalAlpha *= 0.55;
        ctx.strokeStyle = '#3b414d';
        ctx.lineWidth = Math.max(1, r * 0.1);
        ctx.beginPath();
        ctx.moveTo(x - r * 0.5, y - r * 0.15);
        ctx.lineTo(x - r * 0.05, y + r * 0.1);
        ctx.lineTo(x + r * 0.2, y - r * 0.35);
        ctx.moveTo(x + r * 0.05, y + r * 0.45);
        ctx.lineTo(x + r * 0.45, y + r * 0.15);
        ctx.stroke();
        ctx.restore();
    }

    function drawFuse(x, y, r) {
        ctx.save();
        ctx.strokeStyle = '#ffe08a';
        ctx.lineWidth = Math.max(1.5, r * 0.14);
        ctx.beginPath();
        ctx.moveTo(x + r * 0.25, y - r * 0.7);
        ctx.quadraticCurveTo(x + r * 0.85, y - r * 1.1, x + r * 0.5, y - r * 1.35);
        ctx.stroke();
        ctx.fillStyle = '#fff3bf';
        ctx.beginPath();
        ctx.arc(x + r * 0.5, y - r * 1.35, r * (0.16 + 0.05 * Math.sin(G.time * 22)), 0, 6.283);
        ctx.fill();
        ctx.restore();
    }

    function drawParticles() {
        G.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
            ctx.fillStyle = p.col;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, 6.283);
            ctx.fill();
            ctx.restore();
        });
    }

    function drawFloats() {
        G.floats.forEach(f => {
            const k = (G.time - f.born) / 1.0;
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - k);
            ctx.textAlign = 'center';
            ctx.font = (f.big ? 800 : 700) + ' ' + Math.round(V.d * (f.big ? 0.62 : 0.46)) +
                'px "Baloo 2", Fredoka, system-ui, sans-serif';
            ctx.fillStyle = f.big ? '#ffe066' : '#ffffff';
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.lineWidth = Math.max(2, V.d * 0.07);
            const y = f.y - k * V.d * 1.6;
            ctx.strokeText(f.text, f.x, y);
            ctx.fillText(f.text, f.x, y);
            ctx.restore();
        });
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

    /* ========================================================================
     *  11. GIAO DIỆN
     * ======================================================================*/

    const el = id => document.getElementById(id);
    const ui = {
        hud: el('hud'), level: el('hud-level'), chapter: el('hud-chapter'),
        goal: el('hud-goal'), goalNum: el('hud-goal-num'), shots: el('hud-shots'),
        score: el('hud-score'), power: el('power-fill'), powerBtn: el('btn-power'),
        tip: el('tip'),
        menu: el('menu-overlay'), levels: el('levels-overlay'),
        win: el('win-overlay'), lose: el('lose-overlay'), all: el('all-overlay'),
        levelGrid: el('level-grid'), chapterTabs: el('chapter-tabs'),
        winStars: el('win-stars'), winScore: el('win-score'), winBest: el('win-best'),
        winBonus: el('win-bonus'),
        loseNote: el('lose-note'), allStars: el('all-stars'),
        btnNext: el('btn-next'), btnFinish: el('btn-finish')
    };

    function show(node) { if (node) node.classList.remove('hidden'); }
    function hide(node) { if (node) node.classList.add('hidden'); }
    function hideAll() {
        [ui.menu, ui.levels, ui.win, ui.lose, ui.all].forEach(hide);
    }

    const GOAL_TEXT = {
        [OBJ.CLEAR]: 'Bubbles left',
        [OBJ.RESCUE]: 'Stars to free',
        [OBJ.COLLECT]: 'Colour left',
        [OBJ.ICE]: 'Ice left'
    };

    function goalValue() {
        const o = G.level.obj;
        if (o.type === OBJ.CLEAR) return poppableLeft();
        if (o.type === OBJ.RESCUE) return Math.max(0, G.starsTotal - G.rescued);
        if (o.type === OBJ.COLLECT) return Math.max(0, o.count - G.collected);
        if (o.type === OBJ.ICE) return iceLeft();
        return 0;
    }

    function updateHud() {
        if (!G.level) return;
        ui.level.textContent = 'Level ' + (G.levelIndex + 1);
        ui.chapter.textContent = CHAPTERS[chapterOf(G.levelIndex)].name;
        ui.goal.textContent = GOAL_TEXT[G.level.obj.type];
        ui.goalNum.textContent = goalValue();
        ui.shots.textContent = G.shotsLeft;
        ui.score.textContent = G.score;
        ui.power.style.width = G.power + '%';
        ui.powerBtn.classList.toggle('ready', G.power >= 100);
        ui.powerBtn.disabled = G.power < 100;
    }

    function showTip(text) {
        if (!text) return;
        ui.tip.textContent = text;
        show(ui.tip);
        clearTimeout(showTip.t);
        showTip.t = setTimeout(() => hide(ui.tip), 4200);
    }

    function startLevel(i) {
        buildLevel(i);
        G.mode = 'play';
        hideAll();
        show(ui.hud);
        updateHud();
        showTip(LEVELS[i].tip);
    }

    function showWin(stars, bonus) {
        ui.winStars.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const s = document.createElement('i');
            s.className = 'fa-solid fa-star star' + (i < stars ? ' lit' : '');
            ui.winStars.appendChild(s);
        }
        ui.winScore.textContent = G.score;
        ui.winBonus.textContent = '+' + bonus;
        ui.winBest.textContent = store.bestOf(G.levelIndex);

        const last = G.levelIndex >= LEVELS.length - 1;
        ui.btnNext.hidden = last;
        ui.btnFinish.hidden = !last;
        show(ui.win);
    }

    function showLose(why) {
        ui.loseNote.textContent = why === 'bottom'
            ? 'The bubbles reached the red line! Clear them faster next time.'
            : 'Out of bubbles! Try popping bigger groups.';
        show(ui.lose);
    }

    function showAllDone() {
        ui.allStars.textContent = '⭐ ' + store.totalStars() + ' / ' + (LEVELS.length * 3);
        show(ui.all);
    }

    /* ---- bảng chọn màn ---- */
    let tabChapter = 0;

    function buildLevelsPanel() {
        ui.chapterTabs.innerHTML = '';
        CHAPTERS.forEach((c, i) => {
            const b = document.createElement('button');
            const locked = !store.unlocked(c.from);
            b.className = 'ch-tab' + (i === tabChapter ? ' is-on' : '') + (locked ? ' locked' : '');
            const stars = chapterStars(i);
            b.innerHTML = (locked ? '<i class="ch-lock">🔒</i>' : '') + c.name +
                '<span class="ch-stars">' + stars.got + '/' + stars.max + '⭐</span>';
            if (!locked) b.addEventListener('click', () => { tabChapter = i; buildLevelsPanel(); });
            ui.chapterTabs.appendChild(b);
        });

        const from = CHAPTERS[tabChapter].from;
        const to = (tabChapter + 1 < CHAPTERS.length ? CHAPTERS[tabChapter + 1].from : LEVELS.length) - 1;

        ui.levelGrid.innerHTML = '';
        for (let i = from; i <= to; i++) {
            const open = store.unlocked(i);
            const got = store.starsOf(i);
            const b = document.createElement('button');
            b.className = 'lv' + (open ? '' : ' locked') + (got ? ' done' : '');
            b.innerHTML =
                '<span class="lv-num">' + (open ? (i + 1) : '🔒') + '</span>' +
                '<span class="lv-stars">' +
                [0, 1, 2].map(k => '<i class="lv-star' + (k < got ? ' lit' : '') + '">★</i>').join('') +
                '</span>';
            if (open) b.addEventListener('click', () => startLevel(i));
            ui.levelGrid.appendChild(b);
        }
    }

    function chapterStars(i) {
        const from = CHAPTERS[i].from;
        const to = (i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].from : LEVELS.length) - 1;
        let got = 0;
        for (let k = from; k <= to; k++) got += store.starsOf(k);
        return { got, max: (to - from + 1) * 3 };
    }

    function openLevels() {
        G.mode = 'levels';
        tabChapter = chapterOf(G.levelIndex);
        buildLevelsPanel();
        hideAll();
        show(ui.levels);
    }

    function openMenu() {
        G.mode = 'menu';
        hideAll();
        hide(ui.hud);
        show(ui.menu);
    }

    /* ---- điều khiển ---- */
    function pointAt(ev) {
        const rect = canvas.getBoundingClientRect();
        const x = (ev.clientX - rect.left);
        const y = (ev.clientY - rect.top);
        return { x, y };
    }

    function aimTo(p) {
        const dx = p.x - gunX(), dy = p.y - V.gunY;
        let a = Math.atan2(dy, dx);
        /* Chỉ cho bắn lên: kẹp góc vào khoảng -172° … -8°. */
        const min = AIM_MIN, max = AIM_MAX;
        if (a > 0) a = (p.x >= gunX()) ? max : min;
        a = Math.max(min, Math.min(max, a));
        G.aim = a;
    }

    function nextHit(p) {
        if (!G.next) return false;
        const nx = gunX() + V.d * 1.5, ny = V.gunY + V.d * 0.1;
        return Math.hypot(p.x - nx, p.y - ny) < V.d * 0.8;
    }

    function onDown(ev) {
        if (G.mode !== 'play') return;
        sfx.wake();
        const p = pointAt(ev);
        if (nextHit(p)) { swapAmmo(); return; }
        G.aiming = true;
        aimTo(p);
    }

    function onMove(ev) {
        if (G.mode !== 'play') return;
        const p = pointAt(ev);
        /* Chuột thì rê tới đâu ngắm tới đó; cảm ứng chỉ ngắm khi đang chạm. */
        if (G.aiming || ev.pointerType === 'mouse') aimTo(p);
    }

    function onUp(ev) {
        if (G.mode !== 'play') return;
        if (!G.aiming) return;
        G.aiming = false;
        const p = pointAt(ev);
        if (nextHit(p)) return;
        aimTo(p);
        fire();
    }

    function wireInput() {
        canvas.addEventListener('pointerdown', ev => { ev.preventDefault(); onDown(ev); });
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', ev => { ev.preventDefault(); onUp(ev); });
        canvas.addEventListener('pointercancel', () => { G.aiming = false; });
        canvas.addEventListener('contextmenu', ev => ev.preventDefault());

        window.addEventListener('keydown', ev => {
            if (G.mode !== 'play') return;
            if (ev.key === 'ArrowLeft') { G.aim = Math.max(AIM_MIN, G.aim - 0.05); ev.preventDefault(); }
            if (ev.key === 'ArrowRight') { G.aim = Math.min(AIM_MAX, G.aim + 0.05); ev.preventDefault(); }
            if (ev.key === ' ' || ev.key === 'Enter') { fire(); ev.preventDefault(); }
            if (ev.key.toLowerCase() === 's') swapAmmo();
            if (ev.key.toLowerCase() === 'b') usePower();
        });
    }

    function wireButtons() {
        el('btn-play').addEventListener('click', () => {
            sfx.wake();
            /* Vào thẳng màn đang chơi dở, không bắt bé bấm lại từ màn 1. */
            const next = Math.min(store.data.done, LEVELS.length - 1);
            startLevel(next);
        });
        el('btn-menu-levels').addEventListener('click', openLevels);
        el('btn-nav-levels').addEventListener('click', openLevels);
        el('btn-nav-retry').addEventListener('click', () => {
            if (G.level) startLevel(G.levelIndex);
        });
        el('btn-levels-back').addEventListener('click', () => {
            if (G.level && G.mode === 'levels') startLevel(G.levelIndex);
            else openMenu();
        });
        el('btn-reset-progress').addEventListener('click', () => {
            store.reset();
            buildLevelsPanel();
        });
        ui.btnNext.addEventListener('click', () => startLevel(Math.min(G.levelIndex + 1, LEVELS.length - 1)));
        ui.btnFinish.addEventListener('click', () => { hideAll(); showAllDone(); });
        el('btn-replay').addEventListener('click', () => startLevel(G.levelIndex));
        el('btn-win-levels').addEventListener('click', openLevels);
        el('btn-lose-retry').addEventListener('click', () => startLevel(G.levelIndex));
        el('btn-lose-levels').addEventListener('click', openLevels);
        el('btn-all-levels').addEventListener('click', openLevels);
        ui.powerBtn.addEventListener('click', usePower);

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
     *  12. VÒNG LẶP
     * ======================================================================*/

    let last = 0;
    function frame(now) {
        const t = now / 1000;
        let dt = last ? t - last : 0;
        last = t;
        if (dt > 0.05) dt = 0.05;          // tab bị ẩn quay lại: đừng nhảy cóc
        G.time += dt;

        if (G.mode === 'play') {
            moveShot(dt);
            checkEnd();
        }
        stepEffects(dt);
        draw();
        requestAnimationFrame(frame);
    }

    function init() {
        store.load();
        sfx.init();
        seedDeco();
        buildLevel(0);
        G.mode = 'menu';

        wireInput();
        wireButtons();

        /* Cửa sau để thử màn: /bubble-pop/?level=17 vào thẳng màn 17, khỏi phải
         * chơi hết mười sáu màn trước mỗi lần sửa một con số. */
        const want = +(new URLSearchParams(location.search).get('level') || 0);
        if (want >= 1 && want <= LEVELS.length) {
            setTimeout(() => startLevel(want - 1), 0);
        }
        window.bubblePop = {
            G, V, LEVELS, CHAPTERS, store,
            start: n => startLevel(Math.max(0, Math.min(LEVELS.length - 1, n - 1))),
            fireAt: a => { G.aim = a; fire(); },
            state: () => ({
                level: G.levelIndex + 1, shots: G.shotsLeft, score: G.score,
                left: poppableLeft(), ice: iceLeft(), rescued: G.rescued,
                stars: G.starsTotal, mode: G.mode
            })
        };

        window.addEventListener('resize', resize);
        if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
        window.addEventListener('orientationchange', () => setTimeout(resize, 200));
        resize();

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
