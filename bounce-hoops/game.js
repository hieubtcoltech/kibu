/**
 * Bounce Hoops — KIBU Games
 * ----------------------------------------------------------------------------
 * Ném quả bóng sao cho nó nảy qua mấy bức tường gạch rồi rơi lọt vào rổ.
 *
 * Đây là game giải đố chứ không phải game phản xạ: bé có bao nhiêu thời gian
 * cũng được, ném lại bao nhiêu lần cũng được. Cái khó nằm ở chỗ NGHĨ RA đường
 * bóng, không nằm ở tay nhanh hay chậm. Số sao chấm theo số lần ném, nên bé
 * nào tìm ra đường đi đẹp nhất thì được thưởng, còn bé nào phải mò thì vẫn qua
 * màn — không đứa nào bị chặn lại.
 *
 * VÌ SAO TỰ VIẾT PHẦN VẬT LÝ THAY VÌ DÙNG THƯ VIỆN
 * Đường chấm ngắm phải trùng khít với đường bóng bay thật. Lệch một chút thôi
 * là bé mất lòng tin vào game — ngắm trúng mà bóng đi chỗ khác thì còn gì để
 * tính toán nữa. Tự viết thì đường ngắm và quả bóng dùng CHUNG một hàm tính,
 * không có cách nào lệch được. Dùng thư viện thì phải chép lại công thức của
 * nó sang bên vẽ, mà chép tay là sớm muộn cũng sai.
 *
 * Cả sân vẽ bằng canvas 2D, không thư viện ngoài. Chữ để bên HTML cho /i18n.js
 * lo phần dịch.
 *
 * Bố cục file:
 *   1. Cấu hình     2. Màn chơi     3. Tiến trình   4. Âm thanh
 *   5. Trạng thái   6. Hình học     7. Vật lý       8. Ngắm và ném
 *   9. Hiệu ứng    10. Vẽ          11. Giao diện   12. Vòng lặp
 */
(function () {
    'use strict';

    /* ========================================================================
     *  1. CẤU HÌNH
     * ------------------------------------------------------------------------
     *  Sân chơi luôn rộng đúng 20 ô và cao 12 ô, bất kể màn hình to nhỏ ra sao.
     *  Nhờ vậy một màn chơi xếp bằng toạ độ ô sẽ giống hệt nhau trên mọi máy —
     *  điều bắt buộc với game giải đố, vì lời giải phụ thuộc vào từng khoảng
     *  cách một.
     * ======================================================================*/

    const COLS = 20;
    const ROWS = 12;

    /* Trọng lực và lực ném đi thành một cặp: tầm xa nhất của một cú ném là
     * v²/g. Với 22 và 20 thì tầm xa ≈ 18 ô, tức là ném hết sức ở góc 45° gần
     * như băng hết bề ngang sân 20 ô. Đặt trọng lực nặng hơn (hồi đầu em để
     * 26) thì tầm xa chỉ còn 8,6 ô — nửa số màn không tài nào giải nổi, mà
     * nhìn màn hình thì không thấy được, phải chạy máy dò mới lòi ra. */
    const GRAV = 22;             // trọng lực, ô/giây²
    const BALL_R = 0.34;         // bán kính quả bóng, tính theo ô
    const BOUNCE = 0.62;         // nảy lại bao nhiêu phần vận tốc khi đập tường
    const RUB = 0.86;            // ma sát trượt dọc mặt tường
    const STOP_V = 0.9;          // chậm hơn mức này và đang nằm đất thì cho dừng
    const MAX_POWER = 20;        // lực ném mạnh nhất, ô/giây
    const AIM_MAX_DRAG = 3.4;    // kéo xa hơn bằng này ô cũng không mạnh thêm

    const SHOT_TTL = 12;         // bóng lăn lóc quá lâu thì tính là hỏng, cho ném lại
    const STEP = 1 / 240;        // bước tính vật lý, cố định để mọi máy ra một kết quả

    const T = {
        BRICK: 'brick',          // tường gạch, bóng nảy lại
        PAD: 'pad',              // bàn nhún, nảy mạnh gấp rưỡi
        MOVER: 'mover',          // khối trượt qua lại
        SPIKE: 'spike'           // bụi gai, chạm vào là hỏng lượt ném
    };

    const STORE_KEY = 'kibu_bounce_hoops_progress';
    const SOUND_KEY = 'kibu_bounce_hoops_sound';

    const WORLDS = [
        { name: 'Sunny Yard', from: 0, sky: ['#ffd93b', '#ffc93b'], ink: '#2b2118' },
        { name: 'Blue Lagoon', from: 6, sky: ['#4dc3ff', '#2f8fd8'], ink: '#0b2a3d' },
        { name: 'Purple Peak', from: 12, sky: ['#b06cff', '#7a3fd0'], ink: '#25103f' },
        { name: 'Night Court', from: 18, sky: ['#2c3e66', '#16213f'], ink: '#0a1020' }
    ];

    /* ========================================================================
     *  2. MÀN CHƠI
     * ------------------------------------------------------------------------
     *  Toạ độ tính bằng ô, gốc ở góc trái trên. Mỗi màn khai báo:
     *      ball  chỗ đứng của bé và quả bóng
     *      hoop  {x, y} tâm vành rổ
     *      walls [x, y, rộng, cao] các bức tường gạch
     *      pads  [x, y, rộng] bàn nhún
     *      movers [x, y, rộng, cao, biên độ, chu kỳ] khối trượt ngang
     *      spikes [x, y, rộng] bụi gai
     *      par   ném bao nhiêu lần thì vẫn được ba sao
     *
     *  Mỗi màn phải giải được — có kiểm tự động bằng máy, xem phần kiểm thử.
     * ======================================================================*/

    /* Quy ước dựng màn, giữ đúng cho cả 24 màn để bé không phải học lại:
     *   · nền nhà là khối [0, 11, 20, 1], mặt trên ở y = 11
     *   · ball[1] là mặt sàn bé đang đứng, tâm bóng nằm cao hơn 0,6 ô
     *   · rổ đặt trên một bệ thì hoop.y = mặt bệ trừ 0,34 (đúng chiều cao cọc)
     *   · gai luôn mọc từ dưới lên, nên spike[1] = mặt sàn trừ 0,42 */
    const LEVELS = [
        /* ---------- Thế giới 1: Sunny Yard — dạy tay ---------- */
        {
            name: 'First Shot', tip: 'Drag back from the ball, then let go.',
            ball: [3, 11], hoop: { x: 14, y: 9 }, par: 1,
            walls: [[0, 11, 20, 1]]
        },
        {
            name: 'Over The Wall', tip: 'Throw high to clear the wall.',
            ball: [3, 11], hoop: { x: 16, y: 9 }, par: 1,
            walls: [[0, 11, 20, 1], [9, 7, 1, 4]]
        },
        {
            name: 'Under The Roof', tip: 'A flat throw fits under the roof.',
            ball: [3, 11], hoop: { x: 16, y: 10 }, par: 1,
            walls: [[0, 11, 20, 1], [9, 0, 1, 7]]
        },
        {
            name: 'Off The Ledge', tip: 'Over the tall pillar, then down.',
            ball: [2, 5], hoop: { x: 17, y: 10 }, par: 2,
            walls: [[0, 11, 20, 1], [0, 5, 5, 1], [11, 4, 1, 7]]
        },
        {
            name: 'The Gap', tip: 'Squeeze the ball through the gap.',
            ball: [3, 11], hoop: { x: 16, y: 9 }, par: 2,
            walls: [[0, 11, 20, 1], [10, 0, 1, 5], [10, 8, 1, 3]]
        },
        {
            name: 'Two Walls', tip: 'Over the first, under the second.',
            ball: [2, 11], hoop: { x: 17, y: 9 }, par: 2,
            walls: [[0, 11, 20, 1], [7, 6, 1, 5], [13, 0, 1, 7]]
        },

        /* ---------- Thế giới 2: Blue Lagoon — bàn nhún ---------- */
        {
            name: 'Springboard', tip: 'The orange pad throws the ball high.',
            ball: [2, 11], hoop: { x: 17, y: 5 }, par: 2,
            walls: [[0, 11, 20, 1]], pads: [[9, 10.6, 3]]
        },
        {
            name: 'Double Bounce', tip: 'Use both pads to climb.',
            ball: [2, 11], hoop: { x: 17, y: 3 }, par: 3,
            walls: [[0, 11, 20, 1], [11, 6, 3, 1]],
            pads: [[7, 10.6, 2], [12, 5.6, 2]]
        },
        {
            name: 'Ceiling Drop', tip: 'Fall below the roof before you cross.',
            ball: [2, 5], hoop: { x: 15, y: 10 }, par: 2,
            walls: [[0, 11, 20, 1], [0, 5, 4, 1], [9, 0, 1, 6]]
        },
        {
            name: 'Zigzag', tip: 'Land on the shelf, then roll off the end.',
            ball: [2, 3], hoop: { x: 17, y: 10 }, par: 3,
            walls: [[0, 11, 20, 1], [0, 3, 6, 1], [8, 6, 6, 1], [13, 0, 1, 4]]
        },
        {
            name: 'The Well', tip: 'Drop the ball straight down the well.',
            ball: [3, 11], hoop: { x: 12, y: 10 }, par: 3,
            walls: [[0, 11, 20, 1], [9, 3, 1, 8], [14, 3, 1, 8]],
            pads: [[5, 10.6, 2]]
        },
        {
            name: 'Pinball', tip: 'Let it rattle around the shelves.',
            ball: [2, 11], hoop: { x: 17, y: 4.5 }, par: 3,
            walls: [[0, 11, 20, 1], [6, 8, 4, 1], [11, 4, 4, 1], [15, 7, 5, 1]]
        },

        /* ---------- Thế giới 3: Purple Peak — khối trượt và gai ---------- */
        {
            name: 'Moving Wall', tip: 'Wait for the wall to slide away.',
            ball: [3, 11], hoop: { x: 17, y: 9 }, par: 2,
            walls: [[0, 11, 20, 1]], movers: [[10, 6, 1, 5, 2.5, 3.2]]
        },
        {
            name: 'Sliding Roof', tip: 'The roof keeps moving. Time it.',
            ball: [3, 11], hoop: { x: 16, y: 10 }, par: 2,
            walls: [[0, 11, 20, 1], [7, 0, 1, 6]], movers: [[10, 6, 4, 1, 2, 4]]
        },
        {
            name: 'Spike Alley', tip: 'Keep away from the green spikes.',
            ball: [2, 11], hoop: { x: 17, y: 9 }, par: 2,
            walls: [[0, 11, 20, 1], [8, 6, 1, 5]], spikes: [[10, 10.58, 5]]
        },
        {
            name: 'Narrow Escape', tip: 'One gap, and a block guarding it.',
            ball: [2, 6], hoop: { x: 17, y: 10 }, par: 3,
            walls: [[0, 11, 20, 1], [0, 6, 4, 1], [11, 0, 1, 5], [11, 8, 1, 3]],
            movers: [[14, 4, 1, 3, 1.6, 2.6]]
        },
        {
            name: 'Bounce Gate', tip: 'Pad up, then through the gate.',
            ball: [2, 11], hoop: { x: 17, y: 1.5 }, par: 3,
            walls: [[0, 11, 20, 1], [13, 4, 7, 1]],
            pads: [[6, 10.6, 3]], movers: [[11, 0, 1, 3, 1.4, 3]]
        },
        {
            name: 'The Tunnel', tip: 'Fly flat through the tunnel.',
            ball: [2, 11], hoop: { x: 18, y: 9.5 }, par: 2,
            walls: [[0, 11, 20, 1], [6, 0, 1, 8], [11, 0, 1, 8]],
            spikes: [[7, 10.58, 4]]
        },

        /* ---------- Thế giới 4: Night Court — tổng hợp ---------- */
        {
            name: 'High Climb', tip: 'Climb the ledges to the top shelf.',
            ball: [2, 11], hoop: { x: 17, y: 2.5 }, par: 3,
            walls: [[0, 11, 20, 1], [6, 8, 3, 1], [11, 5, 3, 1]],
            pads: [[4, 10.6, 2], [12, 4.6, 2]]
        },
        {
            name: 'Crossfire', tip: 'Two movers, one window.',
            ball: [2, 11], hoop: { x: 17, y: 5 }, par: 4,
            walls: [[0, 11, 20, 1], [14, 7, 6, 1]],
            movers: [[8, 3, 1, 4, 2.2, 2.8], [11, 7, 1, 4, 2, 3.6]]
        },
        {
            name: 'Spike Bridge', tip: 'Over the spikes or under the bridge.',
            ball: [2, 11], hoop: { x: 17, y: 10 }, par: 2,
            walls: [[0, 11, 20, 1], [8, 7, 5, 1]], spikes: [[8, 6.58, 5]]
        },
        {
            name: 'Rooftop', tip: 'Up to the roof, past the hanging block.',
            ball: [2, 11], hoop: { x: 16, y: 2.5 }, par: 3,
            walls: [[0, 11, 20, 1], [13, 4, 7, 1], [11, 0, 1, 3]],
            pads: [[9, 10.6, 2]]
        },
        {
            name: 'Bank Shot', tip: 'Use the wall on the right.',
            ball: [3, 11], hoop: { x: 12, y: 9 }, par: 2,
            walls: [[0, 11, 20, 1], [8, 0, 1, 7], [16, 2, 1, 9], [10, 5, 7, 1]]
        },
        {
            name: 'Grand Finale', tip: 'Everything at once. Good luck!',
            ball: [2, 11], hoop: { x: 18, y: 1.8 }, par: 4,
            walls: [[0, 11, 20, 1], [7, 5, 3, 1], [15, 4, 5, 1], [12, 0, 1, 4]],
            pads: [[5, 10.6, 2], [8, 4.6, 2]], movers: [[13, 6, 1, 5, 1.8, 3]],
            spikes: [[10, 10.58, 3]]
        }
    ];

    /* ========================================================================
     *  3. TIẾN TRÌNH
     * ======================================================================*/

    const store = {
        data: { stars: {}, shots: {}, done: 0 },

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
        bestOf(i) { return this.data.shots[i] || 0; },
        totalStars() {
            let n = 0;
            for (const k in this.data.stars) n += this.data.stars[k];
            return n;
        },
        /* Màn 1 luôn mở; màn sau mở khi màn ngay trước đã qua. */
        unlocked(i) { return i === 0 || (this.data.stars[i - 1] || 0) > 0; },
        record(i, stars, shots) {
            if (stars > this.starsOf(i)) this.data.stars[i] = stars;
            const old = this.bestOf(i);
            if (!old || shots < old) this.data.shots[i] = shots;
            if (i + 1 > this.data.done) this.data.done = i + 1;
            this.save();
        },
        reset() {
            this.data = { stars: {}, shots: {}, done: 0 };
            this.save();
        }
    };

    /* ========================================================================
     *  4. ÂM THANH
     * ------------------------------------------------------------------------
     *  Tổng hợp bằng Web Audio, không tải tệp nào — giống mọi game khác của
     *  nhà mình. Cách này iOS coi là tiếng của trang chứ không phải một phiên
     *  phát nhạc, nên không sinh ra nút điều khiển ở màn hình khoá.
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
            const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 900;
            const g = ac.createGain(); g.gain.value = vol == null ? 0.1 : vol;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },

        throwBall() { this.noise(0.05, 0.05, 1800); this.tone(300, 0.1, 'triangle', 0.08, 620); },
        /* Tiếng đập tường cao thấp theo lực đập — đập mạnh nghe đanh, chạm nhẹ
         * nghe cụt. Một tiếng dùng chung cho mọi cú thì tai chóng chán. */
        bump(v) {
            const k = Math.min(1, v / 12);
            this.tone(120 + k * 180, 0.06 + k * 0.05, 'sine', 0.04 + k * 0.07, 70);
            if (k > 0.35) this.noise(0.04, 0.03 * k, 1200);
        },
        pad() { this.tone(420, 0.14, 'square', 0.1, 940); },
        rim() { this.tone(760, 0.07, 'square', 0.06, 520); },
        score() {
            [660, 880, 1320, 1760].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.18, 'triangle', 0.13), i * 70));
        },
        fail() { this.noise(0.16, 0.08, 300); this.tone(200, 0.2, 'sawtooth', 0.08, 90); },
        win() {
            [523, 659, 784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.24, 'triangle', 0.14), i * 110));
        }
    };

    /* ========================================================================
     *  5. TRẠNG THÁI
     * ======================================================================*/

    const G = {
        mode: 'menu',        // menu | aim | fly | won | levels | all
        levelIndex: 0,
        level: null,

        ball: { x: 0, y: 0, vx: 0, vy: 0, spin: 0, rot: 0 },
        rest: true,          // bóng đang nằm yên chờ ném
        shots: 0,
        flyT: 0,

        walls: [],           // mọi khối cứng, kể cả khối trượt đã tính vị trí
        pads: [],
        movers: [],
        spikes: [],
        hoop: { x: 0, y: 0 },
        scoredAt: -9,

        aiming: false,
        aimFrom: null,       // điểm bắt đầu kéo
        aimTo: null,
        preview: [],         // các chấm của đường ngắm

        parts: [],
        rings: [],
        floats: [],
        shakeUntil: 0,
        shakeMag: 0,
        time: 0
    };

    /* ========================================================================
     *  6. HÌNH HỌC
     * ======================================================================*/

    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');

    const V = { w: 0, h: 0, u: 40, ox: 0, oy: 0 };

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
        /* Cả sân 20×12 ô phải nằm trọn trong khung, canh giữa. Màn hình nào
         * cũng thấy đúng bấy nhiêu — lời giải của một màn giải đố không được
         * phụ thuộc vào cỡ máy. */
        V.u = Math.min(w / COLS, h / ROWS);
        V.ox = (w - COLS * V.u) / 2;
        V.oy = (h - ROWS * V.u) / 2;
    }

    function sx(x) { return V.ox + x * V.u; }
    function sy(y) { return V.oy + y * V.u; }

    /* ========================================================================
     *  7. VẬT LÝ
     * ------------------------------------------------------------------------
     *  Quả bóng là một hình tròn, mọi thứ nó đập vào đều là hình chữ nhật nằm
     *  ngang. Bài toán tròn-chạm-chữ-nhật giải bằng cách tìm điểm trên hình
     *  chữ nhật gần tâm bóng nhất, rồi đẩy bóng ra theo hướng nối hai điểm đó.
     * ======================================================================*/

    function rectsNow(t) {
        /* Khối trượt đổi chỗ theo thời gian, nên danh sách vật cản phải dựng
         * lại mỗi bước tính. Trả về cả loại để bên va chạm biết đường xử lý. */
        const out = G.walls.slice();
        for (const m of G.movers) {
            const off = Math.sin((t / m.period) * Math.PI * 2) * m.amp;
            out.push({ x: m.x0 + off, y: m.y, w: m.w, h: m.h, kind: T.MOVER });
        }
        return out;
    }

    function hitOne(b, r) {
        /* Điểm gần nhất trên hình chữ nhật so với tâm bóng. */
        const cx = Math.max(r.x, Math.min(b.x, r.x + r.w));
        const cy = Math.max(r.y, Math.min(b.y, r.y + r.h));
        let dx = b.x - cx, dy = b.y - cy;
        let d = Math.hypot(dx, dy);

        if (d > BALL_R) return null;

        if (d < 1e-6) {
            /* Tâm bóng nằm lọt trong hình: đẩy ra theo mặt gần nhất. Trường hợp
             * này hiếm nhưng bỏ qua thì bóng kẹt cứng trong tường. */
            const left = b.x - r.x, right = r.x + r.w - b.x;
            const top = b.y - r.y, bot = r.y + r.h - b.y;
            const m = Math.min(left, right, top, bot);
            if (m === left) { dx = -1; dy = 0; }
            else if (m === right) { dx = 1; dy = 0; }
            else if (m === top) { dx = 0; dy = -1; }
            else { dx = 0; dy = 1; }
            d = 1;
        }
        return { nx: dx / d, ny: dy / d, push: BALL_R - d };
    }

    /* Một bước tính vật lý. Tách riêng ra để đường ngắm gọi lại được đúng hàm
     * này — đó là toàn bộ lý do đường chấm không bao giờ lệch khỏi đường bay. */
    function step(b, t, dt, onHit) {
        b.vy += GRAV * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.spin * dt;

        /* tường bao quanh sân */
        if (b.x < BALL_R) { b.x = BALL_R; b.vx = -b.vx * BOUNCE; if (onHit) onHit('wall', Math.abs(b.vx)); }
        if (b.x > COLS - BALL_R) { b.x = COLS - BALL_R; b.vx = -b.vx * BOUNCE; if (onHit) onHit('wall', Math.abs(b.vx)); }
        if (b.y < BALL_R) { b.y = BALL_R; b.vy = -b.vy * BOUNCE; if (onHit) onHit('wall', Math.abs(b.vy)); }

        for (const r of rectsNow(t)) {
            const h = hitOne(b, r);
            if (!h) continue;
            b.x += h.nx * h.push;
            b.y += h.ny * h.push;
            const vn = b.vx * h.nx + b.vy * h.ny;
            if (vn < 0) {
                const speed = Math.abs(vn);
                const k = r.kind === T.PAD ? 1.55 : BOUNCE;
                /* Tách vận tốc thành phần đâm vuông góc và phần trượt dọc mặt:
                 * phần vuông góc bật ngược lại, phần dọc chỉ hao đi vì ma sát. */
                const tx = b.vx - vn * h.nx, ty = b.vy - vn * h.ny;
                b.vx = tx * RUB - vn * h.nx * k;
                b.vy = ty * RUB - vn * h.ny * k;
                b.spin = -b.vx * 0.5;
                if (onHit) onHit(r.kind === T.PAD ? 'pad' : 'brick', speed, b.x, b.y);
            }
        }
        return b;
    }

    /* ---- vành rổ ----
     * Vành gồm hai cọc cứng hai bên; ghi bàn khi tâm bóng đi TỪ TRÊN XUỐNG qua
     * đoạn nằm giữa hai cọc. Bắt buộc phải đi từ trên xuống: hất ngược từ dưới
     * lên mà tính điểm thì bé lách luật bằng cách ném thẳng vào đáy rổ. */
    function hoopRects(h) {
        const w = 0.28, half = 0.95;
        return [
            { x: h.x - half - w, y: h.y, w: w, h: 0.34, kind: T.BRICK },
            { x: h.x + half, y: h.y, w: w, h: 0.34, kind: T.BRICK }
        ];
    }

    /* Mốc ghi điểm nằm ĐÚNG mép vành (h.y), không thấp hơn.
     *
     * Ban đầu em lấy mốc thấp hơn mép vành 0,12 ô cho chắc ăn, và nó làm hỏng
     * mọi cái rổ đặt trên bệ: bóng rơi vào rổ thì mặt bệ đỡ nó lại ở đúng
     * h.y, tâm bóng không bao giờ xuống nổi h.y + 0,12, nên vào rổ rồi mà
     * không tính điểm. Nằm ở mép vành thì đúng nghĩa hơn: hai cọc chặn hai
     * bên, tâm bóng đi từ trên xuống qua mép vành trong khoảng giữa hai cọc
     * thì chỉ còn đường rơi tiếp vào lưới. */
    function crossedHoop(prevY, b, h) {
        if (b.vy <= 0) return false;                       // phải đang rơi xuống
        if (prevY >= h.y || b.y < h.y) return false;
        return Math.abs(b.x - h.x) < 0.92;
    }

    /* ========================================================================
     *  8. NGẮM VÀ NÉM
     * ======================================================================*/

    function buildLevel(i) {
        const lv = LEVELS[i];
        G.levelIndex = i;
        G.level = lv;
        G.shots = 0;
        G.walls = [];
        G.pads = [];
        G.movers = [];
        G.spikes = [];
        G.hoop = { x: lv.hoop.x, y: lv.hoop.y };
        G.scoredAt = -9;

        (lv.walls || []).forEach(w =>
            G.walls.push({ x: w[0], y: w[1], w: w[2], h: w[3], kind: T.BRICK }));
        (lv.pads || []).forEach(p => {
            const r = { x: p[0], y: p[1], w: p[2], h: 0.4, kind: T.PAD };
            G.walls.push(r);
            G.pads.push(r);
        });
        (lv.movers || []).forEach(m =>
            G.movers.push({ x0: m[0], y: m[1], w: m[2], h: m[3], amp: m[4], period: m[5] }));
        (lv.spikes || []).forEach(s =>
            G.spikes.push({ x: s[0], y: s[1], w: s[2], h: 0.42 }));
        hoopRects(G.hoop).forEach(r => G.walls.push(r));

        resetBall();
        G.parts = [];
        G.rings = [];
        G.floats = [];
        G.preview = [];
        G.mode = 'aim';
        updateHud();
    }

    function resetBall() {
        const p = G.level.ball;
        G.ball = { x: p[0], y: p[1] - 0.6, vx: 0, vy: 0, spin: 0, rot: 0 };
        G.rest = true;
        G.flyT = 0;
        G.mode = G.mode === 'won' ? 'won' : 'aim';
    }

    /* Đường ngắm: chạy thử đúng phép tính của quả bóng thật, chấm một điểm sau
     * mỗi vài bước. Vì dùng chung hàm step nên chấm nằm ĐÚNG chỗ bóng sẽ đi
     * qua, không phải một đường parabol vẽ xấp xỉ.
     *
     * Chỉ vẽ tới cú đập tường đầu tiên: vẽ hết cả đường thì màn giải đố chẳng
     * còn gì để nghĩ, bé chỉ việc dò theo vạch. */
    function previewPath(vx, vy) {
        const b = { x: G.ball.x, y: G.ball.y, vx: vx, vy: vy, spin: 0, rot: 0 };
        const pts = [];
        let hit = false;
        for (let i = 0; i < 240 && !hit; i++) {
            step(b, G.time, STEP * 4, () => { hit = true; });
            if (i % 4 === 0) pts.push({ x: b.x, y: b.y });
            if (b.y > ROWS + 2) break;
        }
        return pts;
    }

    function aimVector() {
        if (!G.aimFrom || !G.aimTo) return null;
        /* Kéo NGƯỢC hướng ném, như kéo dây ná — bé kéo về sau, bóng bay về
         * trước. Kéo xuôi thì ngón tay che mất chỗ bóng sắp bay tới. */
        let dx = G.aimFrom.x - G.aimTo.x;
        let dy = G.aimFrom.y - G.aimTo.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.25) return null;
        const k = Math.min(1, d / AIM_MAX_DRAG);
        return { vx: (dx / d) * k * MAX_POWER, vy: (dy / d) * k * MAX_POWER, power: k };
    }

    function throwBall() {
        const a = aimVector();
        if (!a || G.mode !== 'aim') return;
        G.ball.vx = a.vx;
        G.ball.vy = a.vy;
        G.ball.spin = -a.vx * 0.4;
        G.rest = false;
        G.mode = 'fly';
        G.flyT = 0;
        G.shots++;
        G.preview = [];
        sfx.wake();
        sfx.throwBall();
        puff(G.ball.x, G.ball.y, 8);
        updateHud();
    }

    function stepBall(dt) {
        const b = G.ball;
        let left = dt;
        while (left > 0) {
            const h = Math.min(STEP, left);
            left -= h;
            const prevY = b.y;
            step(b, G.time, h, (kind, v, hx, hy) => {
                if (kind === 'pad') {
                    sfx.pad();
                    ring(hx, hy, '#ffd43b');
                } else if (v > 1.2) {
                    sfx.bump(v);
                    if (v > 5) puff(b.x, b.y, 4);
                }
            });

            if (crossedHoop(prevY, b, G.hoop)) { onScore(); return; }

            for (const s of G.spikes) {
                if (b.x > s.x - BALL_R && b.x < s.x + s.w + BALL_R &&
                    b.y > s.y - BALL_R && b.y < s.y + s.h + BALL_R) { onMiss('spike'); return; }
            }
            if (b.y > ROWS + 3) { onMiss('fall'); return; }
        }

        G.flyT += dt;
        /* Bóng đã nằm im dưới đất thì kết thúc lượt ngay, không bắt bé ngồi chờ
         * hết mười hai giây mới được ném lại. */
        const slow = Math.hypot(b.vx, b.vy) < STOP_V;
        const onFloor = b.y > ROWS - 1 - BALL_R - 0.15;
        if ((slow && onFloor) || G.flyT > SHOT_TTL) onMiss('stop');
    }

    function onScore() {
        G.mode = 'won';
        G.scoredAt = G.time;
        sfx.score();
        shake(0.4, 0.35);
        for (let i = 0; i < 26; i++) {
            const a = Math.random() * 6.283;
            const sp = 3 + Math.random() * 9;
            G.parts.push({
                x: G.hoop.x, y: G.hoop.y + 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
                r: 0.05 + Math.random() * 0.1, life: 0.6 + Math.random() * 0.5, age: 0,
                col: ['#ffd43b', '#ff922b', '#ffffff', '#8ce99a'][i % 4]
            });
        }
        ring(G.hoop.x, G.hoop.y + 0.3, '#ffffff');
        const stars = starsEarned();
        store.record(G.levelIndex, stars, G.shots);
        setTimeout(() => { sfx.win(); showWin(stars); }, 600);
    }

    function onMiss(why) {
        if (why !== 'stop') {
            sfx.fail();
            puff(G.ball.x, G.ball.y, 10);
        }
        resetBall();
        updateHud();
    }

    function starsEarned() {
        const par = G.level.par || 1;
        if (G.shots <= par) return 3;
        if (G.shots <= par + 2) return 2;
        return 1;
    }

    /* ========================================================================
     *  9. HIỆU ỨNG
     * ======================================================================*/

    function shake(mag, dur) {
        G.shakeMag = Math.max(G.time < G.shakeUntil ? G.shakeMag : 0, mag);
        G.shakeUntil = Math.max(G.shakeUntil, G.time + dur);
    }

    function puff(x, y, n) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * 6.283;
            const sp = 1 + Math.random() * 4;
            G.parts.push({
                x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                r: 0.04 + Math.random() * 0.08,
                life: 0.25 + Math.random() * 0.25, age: 0, col: '#ffffff'
            });
        }
    }

    function ring(x, y, col) {
        G.rings.push({ x, y, r0: 0.4, grow: 3, life: 0.35, age: 0, col: col });
    }

    function stepFx(dt) {
        for (let i = G.parts.length - 1; i >= 0; i--) {
            const p = G.parts[i];
            p.age += dt;
            if (p.age >= p.life) { G.parts.splice(i, 1); continue; }
            p.vy += GRAV * 0.4 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
        for (let i = G.rings.length - 1; i >= 0; i--) {
            G.rings[i].age += dt;
            if (G.rings[i].age >= G.rings[i].life) G.rings.splice(i, 1);
        }
        for (let i = G.floats.length - 1; i >= 0; i--) {
            if (G.time - G.floats[i].born > 1.1) G.floats.splice(i, 1);
        }
    }

    /* ========================================================================
     *  10. VẼ
     * ======================================================================*/

    function world() { return WORLDS[Math.min(worldOf(G.levelIndex), WORLDS.length - 1)]; }

    function worldOf(i) {
        let w = 0;
        WORLDS.forEach((c, k) => { if (i >= c.from) w = k; });
        return w;
    }

    function draw() {
        const W = world();

        ctx.save();
        if (G.time < G.shakeUntil) {
            const left = G.shakeUntil - G.time;
            const k = V.u * G.shakeMag * 0.7 * Math.min(1, left * 3.2);
            ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
        }

        drawSky(W);
        drawGrid(W);
        drawWalls(W);
        drawSpikes();
        drawHoop(W);
        drawThrower(W);
        drawPreview();
        drawBall();
        drawParts();
        drawRings();

        ctx.restore();
    }

    /* Trời chỉ tô trong đúng khung 20×12 ô, phần thừa hai bên để tối và có
     * viền bo. Trên máy để bàn khung game rộng gấp rưỡi sân chơi, tô trời ra
     * hết mép thì bé không biết đâu là bờ tường vô hình mà bóng sẽ nảy vào. */
    function drawSky(W) {
        ctx.fillStyle = '#150e07';
        ctx.fillRect(0, 0, V.w, V.h);

        const x0 = sx(0), y0 = sy(0), fw = COLS * V.u, fh = ROWS * V.u;
        ctx.save();
        roundRect(x0, y0, fw, fh, V.u * 0.35);
        ctx.clip();

        const g = ctx.createLinearGradient(0, y0, 0, y0 + fh);
        g.addColorStop(0, W.sky[0]);
        g.addColorStop(1, W.sky[1]);
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, fw, fh);

        /* Mấy vòng tròn to mờ cho nền đỡ phẳng. Vị trí tính từ số màn nên mỗi
         * màn một khác, mà vẫn đứng yên chứ không nhấp nháy theo khung hình. */
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        for (let i = 0; i < 5; i++) {
            const k = (G.levelIndex * 7 + i * 13) % 20;
            const cx = sx(1 + k), cy = sy(1.5 + ((i * 5 + G.levelIndex) % 7));
            ctx.beginPath();
            ctx.arc(cx, cy, V.u * (1.1 + (i % 3) * 0.6), 0, 6.283);
            ctx.fill();
        }
        ctx.restore();

        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = Math.max(2, V.u * 0.06);
        roundRect(x0, y0, fw, fh, V.u * 0.35);
        ctx.stroke();
    }

    /* Lưới ô mờ phía sau — bé đếm ô mà ước lượng đường bóng, đó là công cụ suy
     * nghĩ của một game giải đố. Không có lưới thì mọi khoảng cách đều là đoán. */
    function drawGrid(W) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= COLS; x++) { ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x), sy(ROWS)); }
        for (let y = 0; y <= ROWS; y++) { ctx.moveTo(sx(0), sy(y)); ctx.lineTo(sx(COLS), sy(y)); }
        ctx.stroke();
        ctx.restore();
    }

    function brick(x, y, w, h, W, isPad) {
        const px = sx(x), py = sy(y), pw = w * V.u, ph = h * V.u;
        ctx.fillStyle = isPad ? '#ff922b' : '#ffffff';
        roundRect(px, py, pw, ph, Math.min(pw, ph) * 0.18);
        ctx.fill();
        ctx.strokeStyle = W.ink;
        ctx.lineWidth = Math.max(2, V.u * 0.075);
        ctx.stroke();
        /* Ô vuông nhỏ bên trong cho khối gạch có kết cấu, không phải mảng trắng
         * trơn — đúng kiểu trong bản mẫu. */
        ctx.fillStyle = isPad ? 'rgba(255,255,255,0.5)' : '#ffc93b';
        const cell = V.u * 0.52, gap = (V.u - cell) / 2;
        for (let gx = 0; gx < w; gx++) {
            for (let gy = 0; gy < h; gy++) {
                ctx.fillRect(px + gx * V.u + gap, py + gy * V.u + gap, cell, cell);
            }
        }
    }

    function drawWalls(W) {
        for (const r of G.walls) {
            if (r.h < 0.5 && r.kind === T.BRICK) continue;   // cọc vành rổ vẽ riêng
            brick(r.x, r.y, r.w, r.h, W, r.kind === T.PAD);
        }
        for (const m of G.movers) {
            const off = Math.sin((G.time / m.period) * Math.PI * 2) * m.amp;
            brick(m.x0 + off, m.y, m.w, m.h, W, false);
            /* Mũi tên hai chiều cho biết khối này còn trượt qua lại. */
            ctx.fillStyle = W.ink;
            ctx.font = '700 ' + Math.round(V.u * 0.5) + 'px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('↔', sx(m.x0 + off + m.w / 2), sy(m.y + m.h / 2));
        }
    }

    function drawSpikes() {
        for (const s of G.spikes) {
            const px = sx(s.x), py = sy(s.y + s.h), pw = s.w * V.u, ph = s.h * V.u;
            ctx.fillStyle = '#2f9e44';
            ctx.beginPath();
            const n = Math.max(2, Math.round(s.w * 2));
            for (let i = 0; i < n; i++) {
                const bx = px + (i * pw) / n;
                ctx.moveTo(bx, py);
                ctx.lineTo(bx + pw / n / 2, py - ph);
                ctx.lineTo(bx + pw / n, py);
            }
            ctx.fill();
        }
    }

    function drawHoop(W) {
        const h = G.hoop;
        const x = sx(h.x), y = sy(h.y);
        const half = 0.95 * V.u;

        /* Bảng rổ quay ra phía bờ sân gần nhất, đúng như cái rổ thật treo trên
         * cột. Không có nó thì cái vành trông như đang lơ lửng giữa trời. */
        const side = h.x > COLS / 2 ? 1 : -1;
        const bx = x + side * (half + V.u * 0.42);
        ctx.fillStyle = '#fff3c4';
        roundRect(bx - V.u * 0.13, y - V.u * 1.15, V.u * 0.26, V.u * 1.7, V.u * 0.1);
        ctx.fill();
        ctx.strokeStyle = W.ink;
        ctx.lineWidth = Math.max(2, V.u * 0.07);
        ctx.stroke();

        /* Lưới rổ */
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = Math.max(1.5, V.u * 0.05);
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            const t = i / 4;
            ctx.moveTo(x - half + t * half * 2, y + V.u * 0.1);
            ctx.lineTo(x - half * 0.45 + t * half * 0.9, y + V.u * 0.75);
        }
        ctx.moveTo(x - half * 0.45, y + V.u * 0.75);
        ctx.lineTo(x + half * 0.45, y + V.u * 0.75);
        ctx.stroke();

        /* Vành: hai cọc đỏ hai bên, chính là hai khối cứng bóng có thể đập vào */
        ctx.fillStyle = '#e8443c';
        roundRect(x - half - V.u * 0.28, y, V.u * 0.28, V.u * 0.34, V.u * 0.1); ctx.fill();
        roundRect(x + half, y, V.u * 0.28, V.u * 0.34, V.u * 0.1); ctx.fill();
        ctx.strokeStyle = W.ink;
        ctx.lineWidth = Math.max(1.5, V.u * 0.05);
        roundRect(x - half - V.u * 0.28, y, V.u * 0.28, V.u * 0.34, V.u * 0.1); ctx.stroke();
        roundRect(x + half, y, V.u * 0.28, V.u * 0.34, V.u * 0.1); ctx.stroke();

        /* Mũi tên chỉ xuống: nhắc bóng phải RƠI TỪ TRÊN vào mới tính điểm. */
        const bob = Math.sin(G.time * 3) * V.u * 0.06;
        ctx.fillStyle = W.ink;
        ctx.beginPath();
        ctx.moveTo(x - V.u * 0.3, y - V.u * 0.75 + bob);
        ctx.lineTo(x + V.u * 0.3, y - V.u * 0.75 + bob);
        ctx.lineTo(x, y - V.u * 0.35 + bob);
        ctx.closePath();
        ctx.fill();
    }

    /* Bé đứng ném: một khối tròn có mặt. Đứng lệch sang trái quả bóng chứ
     * không đứng ngay dưới — chồng lên nhau thì nhìn ra một cục, không biết
     * đâu là bóng để mà kéo. */
    function drawThrower(W) {
        const p = G.level.ball;
        const x = sx(p[0] - 0.62), y = sy(p[1]);
        const r = V.u * 0.42;
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.5, r, r * 0.9, 0, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = W.ink;
        ctx.lineWidth = Math.max(2, V.u * 0.07);
        ctx.stroke();
        ctx.fillStyle = W.ink;
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.65, r * 0.11, 0, 6.283);
        ctx.arc(x + r * 0.3, y - r * 0.65, r * 0.11, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,120,150,0.45)';
        ctx.beginPath();
        ctx.arc(x - r * 0.6, y - r * 0.35, r * 0.16, 0, 6.283);
        ctx.arc(x + r * 0.6, y - r * 0.35, r * 0.16, 0, 6.283);
        ctx.fill();
    }

    function drawPreview() {
        if (G.mode !== 'aim' || !G.preview.length) return;
        ctx.save();
        /* Chấm to dần rồi nhỏ lại thì khó nhìn; ở đây chấm đều nhau, có viền
         * tối, mờ dần về cuối để bé biết đâu là đầu đâu là đuôi đường bay. */
        G.preview.forEach((p, i) => {
            ctx.globalAlpha = Math.max(0.2, 1 - i / G.preview.length);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.lineWidth = Math.max(1, V.u * 0.03);
            ctx.beginPath();
            ctx.arc(sx(p.x), sy(p.y), V.u * 0.11, 0, 6.283);
            ctx.fill();
            ctx.stroke();
        });
        ctx.restore();
    }

    function drawBall() {
        const b = G.ball;
        const x = sx(b.x), y = sy(b.y), r = BALL_R * V.u;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(b.rot);
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#8ed0ff');
        g.addColorStop(0.6, '#4dabf7');
        g.addColorStop(1, '#1971c2');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = '#0b2a3d';
        ctx.lineWidth = Math.max(1.5, r * 0.14);
        ctx.stroke();
        /* Hai đường cong kiểu quả bóng rổ, nhờ nó mà thấy được bóng đang xoay. */
        ctx.beginPath();
        ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
        ctx.moveTo(0, -r); ctx.lineTo(0, r);
        ctx.stroke();
        ctx.restore();
    }

    function drawParts() {
        G.parts.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
            ctx.fillStyle = p.col;
            ctx.beginPath();
            ctx.arc(sx(p.x), sy(p.y), p.r * V.u, 0, 6.283);
            ctx.fill();
            ctx.restore();
        });
    }

    function drawRings() {
        G.rings.forEach(g => {
            const k = g.age / g.life;
            ctx.save();
            ctx.globalAlpha = (1 - k) * 0.8;
            ctx.strokeStyle = g.col;
            ctx.lineWidth = Math.max(1, V.u * 0.1 * (1 - k));
            ctx.beginPath();
            ctx.arc(sx(g.x), sy(g.y), g.r0 * (1 + k * g.grow) * V.u, 0, 6.283);
            ctx.stroke();
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
        hud: el('hud'), level: el('hud-level'), worldName: el('hud-world'),
        shots: el('hud-shots'), tip: el('tip'),
        menu: el('menu-overlay'), levels: el('levels-overlay'),
        win: el('win-overlay'), all: el('all-overlay'),
        levelGrid: el('level-grid'), worldTabs: el('world-tabs'),
        winStars: el('win-stars'), winShots: el('win-shots'), winBest: el('win-best'),
        allStars: el('all-stars'),
        btnNext: el('btn-next'), btnFinish: el('btn-finish')
    };

    function show(n) { if (n) n.classList.remove('hidden'); }
    function hide(n) { if (n) n.classList.add('hidden'); }
    function hideAll() { [ui.menu, ui.levels, ui.win, ui.all].forEach(hide); }

    function updateHud() {
        if (!G.level || !ui.level) return;
        ui.level.textContent = 'Level ' + (G.levelIndex + 1);
        ui.worldName.textContent = WORLDS[worldOf(G.levelIndex)].name;
        ui.shots.textContent = G.shots;
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
        hideAll();
        show(ui.hud);
        showTip(LEVELS[i].tip);
    }

    function showWin(stars) {
        ui.winStars.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const s = document.createElement('i');
            s.className = 'fa-solid fa-star star' + (i < stars ? ' lit' : '');
            ui.winStars.appendChild(s);
        }
        ui.winShots.textContent = G.shots;
        ui.winBest.textContent = store.bestOf(G.levelIndex) || G.shots;
        const last = G.levelIndex >= LEVELS.length - 1;
        ui.btnNext.hidden = last;
        ui.btnFinish.hidden = !last;
        show(ui.win);
    }

    function showAllDone() {
        ui.allStars.textContent = '⭐ ' + store.totalStars() + ' / ' + (LEVELS.length * 3);
        show(ui.all);
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
            if (open) b.addEventListener('click', () => startLevel(i));
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
        tabWorld = worldOf(G.levelIndex);
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
        const r = canvas.getBoundingClientRect();
        return {
            x: ((ev.clientX - r.left) - V.ox) / V.u,
            y: ((ev.clientY - r.top) - V.oy) / V.u
        };
    }

    function wireInput() {
        const host = canvas.parentElement;

        host.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            sfx.wake();
            if (G.mode !== 'aim') return;
            G.aiming = true;
            G.aimFrom = pointAt(ev);
            G.aimTo = G.aimFrom;
        });

        host.addEventListener('pointermove', ev => {
            if (!G.aiming || G.mode !== 'aim') return;
            G.aimTo = pointAt(ev);
            const a = aimVector();
            G.preview = a ? previewPath(a.vx, a.vy) : [];
        });

        const end = ev => {
            if (!G.aiming) return;
            G.aiming = false;
            if (ev) G.aimTo = pointAt(ev);
            throwBall();
            G.aimFrom = G.aimTo = null;
            G.preview = [];
        };
        host.addEventListener('pointerup', ev => { ev.preventDefault(); end(ev); });
        host.addEventListener('pointercancel', () => { G.aiming = false; G.preview = []; });
        host.addEventListener('contextmenu', ev => ev.preventDefault());

        window.addEventListener('keydown', ev => {
            if (ev.key === 'r' || ev.key === 'R') { if (G.level) startLevel(G.levelIndex); }
        });
    }

    function wireButtons() {
        el('btn-play').addEventListener('click', () => {
            sfx.wake();
            startLevel(Math.min(store.data.done, LEVELS.length - 1));
        });
        el('btn-menu-levels').addEventListener('click', openLevels);
        el('btn-nav-levels').addEventListener('click', openLevels);
        el('btn-nav-retry').addEventListener('click', () => { if (G.level) startLevel(G.levelIndex); });
        el('btn-levels-back').addEventListener('click', () => {
            if (G.level && G.mode === 'levels') startLevel(G.levelIndex);
            else openMenu();
        });
        el('btn-reset-progress').addEventListener('click', () => { store.reset(); buildLevelsPanel(); });
        ui.btnNext.addEventListener('click', () => startLevel(Math.min(G.levelIndex + 1, LEVELS.length - 1)));
        ui.btnFinish.addEventListener('click', () => { hideAll(); showAllDone(); });
        el('btn-replay').addEventListener('click', () => startLevel(G.levelIndex));
        el('btn-win-levels').addEventListener('click', openLevels);
        el('btn-all-levels').addEventListener('click', openLevels);

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
        if (dt > 0.05) dt = 0.05;
        G.time += dt;

        if (G.mode === 'fly') stepBall(dt);
        stepFx(dt);
        draw();
        requestAnimationFrame(frame);
    }

    function init() {
        store.load();
        sfx.init();
        resize();
        buildLevel(0);
        openMenu();
        wireInput();
        wireButtons();

        window.addEventListener('resize', resize);
        if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
        window.addEventListener('orientationchange', () => setTimeout(resize, 200));

        const want = +(new URLSearchParams(location.search).get('level') || 0);
        if (want >= 1 && want <= LEVELS.length) setTimeout(() => startLevel(want - 1), 0);

        window.bounceHoops = {
            G, V, LEVELS, WORLDS, store, step, hitOne, rectsNow, crossedHoop,
            BALL_R, GRAV, COLS, ROWS, STEP, MAX_POWER,
            start: n => startLevel(Math.max(0, Math.min(LEVELS.length - 1, n - 1))),
            aimAt: (vx, vy) => {
                if (G.mode !== 'aim') return false;
                G.ball.vx = vx; G.ball.vy = vy; G.rest = false;
                G.mode = 'fly'; G.flyT = 0; G.shots++;
                return true;
            },
            state: () => ({
                mode: G.mode, level: G.levelIndex + 1, shots: G.shots,
                ball: { x: +G.ball.x.toFixed(2), y: +G.ball.y.toFixed(2) }
            })
        };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
