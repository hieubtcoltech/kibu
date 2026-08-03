/**
 * Rescue Run — KIBU Games
 * ----------------------------------------------------------------------------
 * Chạy vô tận, nhưng thứ bé chạy vì không phải điểm số: dọc đường có những
 * người bạn nhỏ bị nhốt trong lồng, cứu được ai thì bạn ấy chạy nối đuôi phía
 * sau. Đoàn càng dài điểm nhân càng cao — và đâm phải chướng ngại thì mất một
 * bạn chứ không chết ngay. Bé chỉ thua khi đoàn đã trống mà còn đâm tiếp.
 *
 * Vì sao làm khác các game chạy ngoài kia:
 *   • Chết ngay lập tức (Temple Run, Dino) hợp người lớn, còn bé 4-8 tuổi vấp
 *     hai lần là bỏ máy. Mất một bạn thì vẫn đau nhưng lượt chơi còn tiếp.
 *   • Đoàn bạn chạy sau lưng cho bé nhìn thấy công sức của mình mọi lúc, khác
 *     hẳn con số xu nằm im trên góc màn hình.
 *   • Màn ghép từ những khối được xếp tay theo nhịp, không rải chướng ngại
 *     ngẫu nhiên — đây là chỗ phần lớn game chạy tự làm nghe thì giống mà chơi
 *     thì nhạt.
 *
 * Cả sân vẽ bằng canvas 2D, không thư viện ngoài. Chữ để bên HTML cho /i18n.js
 * lo phần dịch; canvas chỉ vẽ hình và vài dòng hiệu ứng ngắn.
 *
 * Bố cục file:
 *   1. Cấu hình     2. Khối màn    3. Tiến trình   4. Âm thanh
 *   5. Trạng thái   6. Hình học    7. Sinh màn     8. Người chơi & va chạm
 *   9. Hiệu ứng    10. Vẽ         11. Giao diện   12. Vòng lặp
 */
(function () {
    'use strict';

    /* ========================================================================
     *  1. CẤU HÌNH
     * ------------------------------------------------------------------------
     *  Mọi kích thước tính bằng "u" — một đơn vị bằng 1/12 chiều cao sân. Nhờ
     *  vậy đổi cỡ màn hình chỉ cần tính lại một con số, cả thế giới co giãn
     *  theo mà tương quan không đổi.
     * ======================================================================*/

    /* Chiều cao thế giới đo bằng u. Đặt 10.5 chứ không nhiều hơn: sân càng chia
     * nhỏ thì nhân vật càng bé so với màn hình, mà bé con cần nhìn rõ mặt bạn
     * mình đang chạy sau lưng thì mới thấy tiếc lúc mất. */
    const WORLD_H = 9.6;
    const GROUND_UP = 2.4;       // mặt đất cách mép dưới sân bấy nhiêu u
    /* Bé đứng lùi vào trong chứ không sát mép trái: đoàn bạn chạy sau lưng là
     * thứ đáng xem nhất của game này, đứng sát mép thì cả đoàn nằm ngoài màn
     * hình. Đổi lại tầm nhìn phía trước ngắn đi, nên RUN_MAX phải hạ theo. */
    const PLAYER_X = 5.2;

    const RUN_START = 7;         // tốc độ chạy lúc mới xuất phát (u/giây)
    const RUN_MAX = 16;          // trần tốc độ
    /* Đường cong hình chữ S: đoạn đầu gần như phẳng cho bé làm quen ngón tay,
     * giữa quãng mới dốc lên, cuối lại thoải dần nên chạy nghìn mét vẫn còn chỗ
     * nhanh thêm.
     *
     * Trước dùng hàm bão hoà (1 - e^-m/H), nhưng hàm đó dốc nhất đúng ngay lúc
     * xuất phát — sai hẳn chỗ cần: bé còn chưa biết chạm vào đâu thì màn hình
     * đã trôi mỗi lúc một nhanh. Còn tăng tuyến tính thì hai trăm mét là chạm
     * trần, từ đó lượt chơi phẳng lì. */
    const RUN_MID = 320;         // chạy tới đây thì được nửa quãng tăng tốc

    const GRAV = 52;             // trọng lực (u/giây²)
    const JUMP_V = 15.2;         // vận tốc bật lên
    const HOLD_T = 0.20;         // giữ tay thêm bấy nhiêu giây thì nhảy cao hơn
    const HOLD_G = 0.34;         // lúc đang giữ thì trọng lực chỉ còn bấy nhiêu
    const COYOTE = 0.10;         // vừa rời mép đất, trong ngần này giây vẫn nhảy được
    const BUFFER = 0.14;         // bấm sớm trước khi chạm đất bấy nhiêu vẫn ăn

    const P_W = 1.02;            // bề ngang người chơi
    const P_H = 1.55;            // chiều cao lúc đứng
    const P_H_SLIDE = 0.82;      // chiều cao lúc trượt
    const SLIDE_T = 0.55;        // trượt kéo dài bao lâu

    const TAIL_GAP = 0.78;       // hai bạn trong đoàn cách nhau bấy nhiêu u
    const MAX_TAIL = 8;          // đoàn dài nhất, quá nữa thì tràn khỏi màn hình
    /* Hai bạn đi cùng ngay từ đầu. Xuất phát tay trắng thì hòn đá đầu tiên đã
     * kết thúc lượt chơi, đúng cái kiểu chết ngay mà game này muốn tránh; có
     * sẵn hai bạn nghĩa là bé được vấp hai lần để học đường đi. */
    const START_PALS = 2;
    const HURT_T = 0.9;          // sau khi trúng đòn thì bất tử bấy nhiêu giây

    const MAGNET_T = 7;          // nam châm hút quả trong bao lâu
    const MAGNET_R = 4.2;        // tầm hút
    const SHIELD_HITS = 1;       // khiên đỡ được mấy đòn
    const ROCKET_T = 3.4;        // tên lửa bay bao lâu

    const COMBO_T = 2.6;         // quá bấy nhiêu giây không ăn gì thì tuột combo
    const NEAR_MISS = 0.62;      // lướt sát chướng ngại trong khoảng này được thưởng

    const METER = 1.9;           // chạy bao nhiêu u thì tính là một mét

    const STORE_KEY = 'kibu_rescue_run_progress';
    const SOUND_KEY = 'kibu_rescue_run_sound';

    /* Các loại vật thể trên đường. Xếp riêng thành hằng số cho khỏi gõ nhầm
     * chuỗi ở mấy chục chỗ trong bảng khối màn bên dưới. */
    const T = {
        GAP: 'gap',         // hố, rơi xuống là mất một bạn
        ROCK: 'rock',       // chướng ngại thấp, nhảy qua
        SPIKE: 'spike',     // bụi gai, nhảy qua
        BRANCH: 'branch',   // cành thấp, phải trượt xuống mới chui lọt
        PLAT: 'plat',       // bệ lơ lửng, đứng lên được
        FRUIT: 'fruit',
        FRIEND: 'friend',
        POWER: 'power'
    };

    const POWER = { SHIELD: 'shield', MAGNET: 'magnet', ROCKET: 'rocket' };

    /* Bốn vùng cảnh, đổi sau mỗi ZONE_LEN mét. Đổi cảnh không chỉ cho đẹp: nó
     * là cái mốc để bé biết mình đã đi được xa tới đâu, con số mét trên HUD
     * chạy quá nhanh nên mắt không bám kịp. */
    /* Chạy chậm hơn thì mỗi mét lâu hơn, nên rút ngắn quãng đổi cảnh lại cho
     * lần đổi cảnh đầu tiên vẫn tới trong khoảng nửa phút. */
    const ZONE_LEN = 140;
    const ZONES = [
        {
            key: 'jungle', name: 'Jungle',
            sky: ['#0b3d2e', '#125c3f', '#2f8f5b'],
            far: '#0d4733', mid: '#116b46', ground: '#1f7a4d', dirt: '#134e33',
            accent: '#ffd43b'
        },
        {
            key: 'beach', name: 'Sunny Bay',
            sky: ['#0a3d62', '#1a6fa8', '#4fc3e8'],
            far: '#12547f', mid: '#1b7bb0', ground: '#e6c377', dirt: '#b3894a',
            accent: '#ff922b'
        },
        {
            key: 'cave', name: 'Crystal Cave',
            sky: ['#150a2e', '#2a1055', '#4b2a80'],
            far: '#1d0f3d', mid: '#33195e', ground: '#4a2f7a', dirt: '#2a1750',
            accent: '#8ed0ff'
        },
        {
            key: 'night', name: 'Star Fields',
            sky: ['#06101f', '#0d2140', '#1b3f6b'],
            far: '#0a1a30', mid: '#123055', ground: '#1a4a72', dirt: '#0d2b45',
            accent: '#ffe066'
        }
    ];

    /* Màu lông của các bạn nhỏ — mỗi bạn cứu được nhận một màu khác nhau cho
     * đoàn chạy nhìn ra từng đứa chứ không thành một vệt liền. */
    const PALS = [
        { main: '#ff6b6b', dark: '#c92a2a', ear: '#ffa8a8', face: 'cat' },
        { main: '#ffd43b', dark: '#e8a800', ear: '#fff3bf', face: 'duck' },
        { main: '#69db7c', dark: '#2f9e44', ear: '#b2f2bb', face: 'frog' },
        { main: '#74c0fc', dark: '#1c7ed6', ear: '#a5d8ff', face: 'bunny' },
        { main: '#e599f7', dark: '#9c36b5', ear: '#f3d9fa', face: 'pig' },
        { main: '#ffa94d', dark: '#e8590c', ear: '#ffd8a8', face: 'fox' }
    ];

    /* ========================================================================
     *  2. KHỐI MÀN
     * ------------------------------------------------------------------------
     *  Đường chạy ghép từ những khối xếp sẵn nối đuôi nhau, không rải chướng
     *  ngại ngẫu nhiên. Ngẫu nhiên thì chỗ thưa đến phát chán, chỗ dày lại
     *  không cách nào qua nổi; xếp tay thì mỗi khối là một câu đố nhỏ đã được
     *  cân, cái khó nằm ở thứ tự ghép chứ không ở từng viên đá.
     *
     *  Toạ độ x tính từ đầu khối, y tính từ mặt đất lên (số dương là cao hơn
     *  mặt đất). Trường tier là mốc khó: khối chỉ được rút ra khi bé đã chạy
     *  đủ xa.
     * ======================================================================*/

    /* Dựng một dãy quả theo đường vòng cung — đúng quỹ đạo cú nhảy, nên bé cứ
     * đuổi theo quả là tự khắc nhảy trúng nhịp. */
    function arc(x0, x1, top, step) {
        const out = [];
        const mid = (x0 + x1) / 2;
        const span = (x1 - x0) / 2;
        for (let x = x0; x <= x1 + 0.001; x += (step || 1.1)) {
            const k = span ? (x - mid) / span : 0;
            out.push({ t: T.FRUIT, x: x, y: 1.1 + top * (1 - k * k) });
        }
        return out;
    }

    function line(x0, n, y, step) {
        const out = [];
        for (let i = 0; i < n; i++) out.push({ t: T.FRUIT, x: x0 + i * (step || 1.1), y: y });
        return out;
    }

    const CHUNKS = [
        /* ---------- tier 0: dạy tay, chỉ có một việc mỗi lần ---------- */
        {
            w: 20, tier: 0, items: [].concat(
                [{ t: T.ROCK, x: 9, h: 1.1 }],
                arc(6.4, 11.6, 1.9)
            )
        },
        {
            w: 22, tier: 0, items: [].concat(
                [{ t: T.GAP, x: 9, w: 3.4 }],
                arc(8, 13.4, 1.7)
            )
        },
        {
            w: 22, tier: 0, items: [].concat(
                [{ t: T.BRANCH, x: 10 }],
                line(6, 4, 0.75), line(13, 4, 0.75)
            )
        },
        {
            w: 24, tier: 0, items: [].concat(
                [{ t: T.FRIEND, x: 12, y: 1.75 }],
                line(6, 5, 1.0)
            )
        },
        {
            w: 24, tier: 0, items: [].concat(
                [{ t: T.PLAT, x: 8, y: 2.6, w: 5 }],
                line(8.6, 4, 3.7), [{ t: T.FRIEND, x: 10.5, y: 2.6 }]
            )
        },

        /* ---------- tier 1: hai việc nối nhau ---------- */
        {
            w: 26, tier: 1, items: [].concat(
                [{ t: T.ROCK, x: 8, h: 1.1 }, { t: T.ROCK, x: 15.5, h: 1.4 }],
                arc(5.5, 10.5, 1.9), arc(13, 18, 2.2)
            )
        },
        {
            w: 28, tier: 1, items: [].concat(
                [{ t: T.GAP, x: 8, w: 3.6 }, { t: T.GAP, x: 17, w: 3.8 }],
                arc(7, 12, 1.7), arc(16, 21.4, 1.8),
                [{ t: T.FRIEND, x: 14, y: 1.75 }]
            )
        },
        {
            w: 28, tier: 1, items: [].concat(
                [{ t: T.BRANCH, x: 9 }, { t: T.ROCK, x: 17, h: 1.2 }],
                line(5, 5, 0.75), arc(14.5, 19.5, 2)
            )
        },
        {
            w: 30, tier: 1, items: [].concat(
                [{ t: T.PLAT, x: 7, y: 2.5, w: 4 }, { t: T.PLAT, x: 14, y: 4.2, w: 4 },
                { t: T.PLAT, x: 21, y: 2.5, w: 4 }],
                line(7.5, 3, 3.6), line(14.5, 3, 5.3), line(21.5, 3, 3.6),
                [{ t: T.POWER, x: 16, y: 5.4, kind: POWER.MAGNET }]
            )
        },
        {
            w: 30, tier: 1, items: [].concat(
                [{ t: T.SPIKE, x: 9 }, { t: T.SPIKE, x: 12.4 }, { t: T.SPIKE, x: 15.8 }],
                arc(7.5, 11, 2), arc(11, 14.4, 2), arc(14.4, 18, 2),
                [{ t: T.FRIEND, x: 24, y: 1.75 }]
            )
        },

        /* ---------- tier 2: bắt đầu phải nghĩ trước một nhịp ---------- */
        {
            w: 32, tier: 2, items: [].concat(
                [{ t: T.GAP, x: 8, w: 4.2 }, { t: T.PLAT, x: 9, y: 2.8, w: 3 },
                { t: T.GAP, x: 18, w: 4.4 }, { t: T.PLAT, x: 19, y: 3.4, w: 3 }],
                line(9.4, 3, 3.9), line(19.4, 3, 4.5),
                [{ t: T.FRIEND, x: 26, y: 1.75 }]
            )
        },
        {
            w: 32, tier: 2, items: [].concat(
                [{ t: T.BRANCH, x: 8 }, { t: T.BRANCH, x: 12 },
                { t: T.ROCK, x: 19, h: 1.3 }, { t: T.GAP, x: 24, w: 3.6 }],
                line(5, 8, 0.72), arc(23, 28.4, 1.8)
            )
        },
        {
            w: 34, tier: 2, items: [].concat(
                [{ t: T.ROCK, x: 8, h: 1.1 }, { t: T.ROCK, x: 11.2, h: 1.1 },
                { t: T.ROCK, x: 14.4, h: 1.1 }, { t: T.SPIKE, x: 22 },
                { t: T.PLAT, x: 26, y: 3, w: 4 }],
                arc(6.5, 16, 3, 1.2), line(26.4, 3, 4.1),
                [{ t: T.POWER, x: 28, y: 4.2, kind: POWER.SHIELD }]
            )
        },
        {
            w: 34, tier: 2, items: [].concat(
                [{ t: T.PLAT, x: 7, y: 2.4, w: 3 }, { t: T.BRANCH, x: 13 },
                { t: T.PLAT, x: 17, y: 2.4, w: 3 }, { t: T.GAP, x: 23, w: 4.6 },
                { t: T.FRIEND, x: 18.2, y: 2.4 }],
                line(11, 4, 0.72), arc(22, 28, 2)
            )
        },
        {
            w: 36, tier: 2, items: [].concat(
                [{ t: T.GAP, x: 9, w: 3.4 }, { t: T.GAP, x: 15, w: 3.4 },
                { t: T.GAP, x: 21, w: 3.4 }],
                arc(8, 13, 1.8), arc(14, 19, 1.8), arc(20, 25, 1.8),
                [{ t: T.FRIEND, x: 30, y: 1.75 }]
            )
        },

        /* ---------- tier 3: đoạn thưởng, nhanh và dày ---------- */
        {
            w: 38, tier: 3, items: [].concat(
                /* Bậc thang cao nhất dừng ở 5.3u: đứng trên đó đầu bé còn cách
                 * mép trên sân một khoảng, cao hơn nữa là cụt đầu. */
                [{ t: T.PLAT, x: 8, y: 3.2, w: 3 }, { t: T.PLAT, x: 14, y: 4.3, w: 3 },
                { t: T.PLAT, x: 20, y: 5.3, w: 3 }, { t: T.PLAT, x: 27, y: 3.6, w: 4 },
                { t: T.FRIEND, x: 21, y: 5.3 }, { t: T.POWER, x: 28.5, y: 4.8, kind: POWER.ROCKET }],
                line(8.4, 3, 4.3), line(14.4, 3, 5.4), line(20.4, 3, 6.4)
            )
        },
        {
            w: 38, tier: 3, items: [].concat(
                [{ t: T.SPIKE, x: 8 }, { t: T.BRANCH, x: 12 }, { t: T.SPIKE, x: 16 },
                { t: T.ROCK, x: 21, h: 1.5 }, { t: T.GAP, x: 27, w: 4.8 },
                { t: T.PLAT, x: 28, y: 3.2, w: 3 }],
                line(10, 3, 0.72), arc(19, 24, 2.4), line(28.4, 3, 4.3)
            )
        },
        {
            w: 40, tier: 3, items: [].concat(
                [{ t: T.GAP, x: 8, w: 5 }, { t: T.GAP, x: 16, w: 5.2 },
                { t: T.GAP, x: 24, w: 5.4 }, { t: T.FRIEND, x: 34, y: 1.75 }],
                arc(7, 13.5, 2.2), arc(15, 21.7, 2.2), arc(23, 30, 2.2)
            )
        },
        {
            w: 40, tier: 3, items: [].concat(
                [{ t: T.ROCK, x: 8, h: 1.2 }, { t: T.BRANCH, x: 11.5 },
                { t: T.ROCK, x: 15, h: 1.2 }, { t: T.BRANCH, x: 18.5 },
                { t: T.ROCK, x: 22, h: 1.2 }, { t: T.FRIEND, x: 30, y: 1.75 },
                { t: T.POWER, x: 34, y: 1.4, kind: POWER.SHIELD }],
                line(25, 6, 1.2)
            )
        },

        /* ---------- khối nghỉ, xen vào cho bé thở ---------- */
        {
            w: 18, tier: 0, rest: true, items: [].concat(
                line(6, 8, 1.0)
            )
        },
        {
            w: 20, tier: 0, rest: true, items: [].concat(
                [{ t: T.FRIEND, x: 10, y: 1.75 }],
                line(5, 5, 1.0), line(13, 5, 1.0)
            )
        }
    ];

    /* ========================================================================
     *  3. TIẾN TRÌNH
     * ======================================================================*/

    const store = {
        data: { best: 0, bestPals: 0, fruit: 0, runs: 0 },

        load() {
            try {
                const raw = localStorage.getItem(STORE_KEY);
                if (raw) Object.assign(this.data, JSON.parse(raw));
            } catch (e) { /* chế độ riêng tư: chơi được nhưng không nhớ */ }
        },
        save() {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        record(dist, pals, fruit) {
            let newBest = false;
            if (dist > this.data.best) { this.data.best = dist; newBest = true; }
            if (pals > this.data.bestPals) this.data.bestPals = pals;
            this.data.fruit += fruit;
            this.data.runs++;
            this.save();
            return newBest;
        },
        reset() {
            this.data = { best: 0, bestPals: 0, fruit: 0, runs: 0 };
            this.save();
        }
    };

    /* ========================================================================
     *  4. ÂM THANH
     * ------------------------------------------------------------------------
     *  Tổng hợp bằng Web Audio, không tải file nào. Nhịp trống chạy theo tốc độ
     *  chạy: càng về sau trống càng gấp, tai nghe ra sức ép tăng dần trước cả
     *  khi mắt kịp nhận ra là màn hình đang trôi nhanh hơn.
     * ======================================================================*/

    const NOTES = [523, 587, 659, 784, 880, 1046, 1174, 1318, 1568, 1760, 2093];

    const sfx = {
        on: true,
        ctx: null,

        init() {
            try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { }
        },
        /* AudioContext chỉ dựng sau cú chạm đầu tiên — trình duyệt chặn âm tự
         * phát, dựng sớm thì nó nằm im ở trạng thái suspended. */
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

        jump() { this.tone(420, 0.14, 'triangle', 0.08, 760); },
        land() { this.noise(0.05, 0.05, 300); this.tone(150, 0.07, 'sine', 0.06, 90); },
        slide() { this.noise(0.22, 0.06, 1400); },
        /* Quả ăn liên tiếp leo dần lên theo thang ngũ cung, chuỗi càng dài tai
         * càng nghe ra là mình đang ăn đậm. */
        fruit(i) { this.tone(NOTES[Math.min(i, NOTES.length - 1)], 0.1, 'sine', 0.085); },
        pal() {
            [784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.16, 'triangle', 0.12), i * 65));
        },
        hurt() { this.noise(0.2, 0.14, 200); this.tone(220, 0.26, 'sawtooth', 0.11, 80); },
        power() {
            [660, 880, 1320].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.14, 'square', 0.08), i * 55));
        },
        rocket() { this.noise(0.5, 0.1, 320); this.tone(180, 0.5, 'sawtooth', 0.08, 520); },
        zone() {
            [523, 659, 784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.2, 'triangle', 0.11), i * 80));
        },
        over() {
            [440, 370, 311, 262].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.3, 'sine', 0.12), i * 150));
        },
        kick() { this.tone(120, 0.12, 'sine', 0.09, 48); },
        hat() { this.noise(0.03, 0.028, 6500); }
    };

    /* ========================================================================
     *  5. TRẠNG THÁI
     * ======================================================================*/

    const G = {
        mode: 'menu',        // menu | play | over | paused

        time: 0,
        dist: 0,             // quãng đường tính bằng u
        metres: 0,
        speed: RUN_START,

        x: 0,                // toạ độ người chơi trong thế giới
        y: 0,                // mép dưới người chơi, tính theo u từ trên xuống
        vy: 0,
        onGround: false,
        groundAt: 0,         // mặt đỡ đang đứng
        jumpHold: 0,
        lastGround: -9,      // mốc thời gian rời đất, dùng cho coyote
        wantJump: -9,        // mốc bấm nhảy, dùng cho buffer
        sliding: 0,          // còn bao lâu nữa hết trượt
        hurtUntil: -9,
        runCycle: 0,         // pha chạy, dùng để vẽ chân tay

        tail: [],            // các bạn đã cứu, phần tử là chỉ số màu trong PALS
        trail: [],           // vệt đường đã đi, để đoàn bám theo

        items: [],           // vật thể đang có trên đường
        gaps: [],            // các hố, tra riêng cho nhanh
        plats: [],
        builtTo: 0,          // đã dựng đường tới toạ độ nào
        lastChunk: -1,

        fruit: 0,
        combo: 0,
        comboAt: -9,
        bestCombo: 0,
        pals: 0,             // tổng số bạn đã cứu trong lượt này
        score: 0,

        shield: 0,
        magnetT: 0,
        rocketT: 0,

        zone: 0,
        missions: [],

        parts: [],
        rings: [],
        floats: [],
        shakeUntil: 0,
        shakeMag: 0,
        flashAt: -9,
        flashCol: '#fff',

        beat: 0,             // pha nhịp trống
        beatN: 0
    };

    /* ========================================================================
     *  6. HÌNH HỌC
     * ======================================================================*/

    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');

    const V = { w: 0, h: 0, u: 40, groundY: 0, cols: 0 };

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
        /* Sân bè ngang thì một đơn vị tính theo chiều cao sẽ ra quá to, cả màn
         * chỉ nhìn thấy vài mét đường — chặn thêm theo bề ngang. */
        /* Chọn u sao cho vừa đủ 13 cột đường chạy nằm trong khung. Ép nhiều cột
         * hơn thì trên máy dựng đứng u bé quá, nhân vật thành con kiến giữa một
         * khoảng trời mênh mông; ít cột hơn thì bé không kịp nhìn thấy chướng
         * ngại trước khi đâm vào. */
        V.u = Math.min(h / WORLD_H, w / 13);
        V.groundY = h - GROUND_UP * V.u;
        V.cols = w / V.u;
        V.skyU = V.groundY / V.u;      // bầu trời cao bao nhiêu u, để nền tự lấp
    }

    /* Đổi toạ độ thế giới sang toạ độ màn hình. Người chơi luôn đứng yên tại
     * PLAYER_X, cả thế giới trôi ngược lại. */
    function sx(worldX) { return (worldX - G.x + PLAYER_X) * V.u; }
    function sy(u) { return V.groundY - u * V.u; }

    /* ========================================================================
     *  7. SINH MÀN
     * ======================================================================*/

    function tierNow() {
        if (G.metres < 120) return 0;
        if (G.metres < 320) return 1;
        if (G.metres < 650) return 2;
        return 3;
    }

    function pickChunk() {
        const maxTier = tierNow();
        /* Cứ vài khối lại chèn một khối nghỉ. Dồn liên tục thì đến người lớn
         * cũng đuối, mà bé thì bỏ máy từ lần thua thứ hai. */
        const wantRest = G.chunksSince == null || G.chunksSince >= 3 + Math.floor(Math.random() * 2);
        const pool = CHUNKS.filter(c =>
            c.tier <= maxTier && (wantRest ? c.rest : !c.rest));
        const use = pool.length ? pool : CHUNKS.filter(c => c.tier <= maxTier);

        let idx = Math.floor(Math.random() * use.length);
        /* Không cho lặp ngay khối vừa dùng: gặp hai lần liền là bé nhận ra
         * ngay và mất hết cảm giác đường chạy dài vô tận. */
        if (use.length > 1 && CHUNKS.indexOf(use[idx]) === G.lastChunk) {
            idx = (idx + 1) % use.length;
        }
        const c = use[idx];
        G.lastChunk = CHUNKS.indexOf(c);
        G.chunksSince = c.rest ? 0 : (G.chunksSince || 0) + 1;
        return c;
    }

    function buildAhead() {
        /* Dựng dư ra một màn hình rưỡi: dựng sát quá thì lúc tốc độ cao vật thể
         * hiện ra ngay trước mũi, bé không kịp phản ứng. */
        const want = G.x + V.cols * 1.8;
        let guard = 0;
        while (G.builtTo < want && guard++ < 40) {
            const c = pickChunk();
            const base = G.builtTo;
            c.items.forEach(it => spawn(it, base));
            G.builtTo = base + c.w;
        }
        /* Trong một khối, chướng ngại được viết trước rồi mới tới dãy quả bao
         * quanh nó, nên mảng không tự sắp theo x. Sắp lại sau mỗi lần dựng thêm
         * để vòng quét va chạm dừng đúng chỗ và hàm dọn rác cắt đúng đầu mảng. */
        G.items.sort((a, b) => a.x - b.x);
    }

    function spawn(it, base) {
        const x = base + it.x;
        if (it.t === T.GAP) {
            G.gaps.push({ x0: x, x1: x + it.w });
            return;
        }
        if (it.t === T.PLAT) {
            G.plats.push({ x0: x, x1: x + it.w, y: it.y });
            return;
        }
        G.items.push({
            t: it.t, x: x, y: it.y || 0, h: it.h || 1,
            kind: it.kind, gone: false, born: G.time,
            pal: Math.floor(Math.random() * PALS.length),
            bob: Math.random() * 6.28
        });
    }

    /* Dọn những gì đã trôi khỏi màn hình. Không dọn thì sau vài phút mảng phình
     * lên hàng nghìn phần tử và mỗi khung hình lại quét hết từ đầu. */
    function cullBehind() {
        const back = G.x - PLAYER_X - 4;
        while (G.items.length && G.items[0].x < back) G.items.shift();
        while (G.gaps.length && G.gaps[0].x1 < back) G.gaps.shift();
        while (G.plats.length && G.plats[0].x1 < back) G.plats.shift();
        while (G.trail.length > 2 && G.trail[0].x < G.x - (MAX_TAIL + 1) * TAIL_GAP - 2) {
            G.trail.shift();
        }
    }

    function overGap(x) {
        for (const g of G.gaps) if (x > g.x0 && x < g.x1) return g;
        return null;
    }

    /* ========================================================================
     *  8. NGƯỜI CHƠI & VA CHẠM
     * ======================================================================*/

    function playerH() { return G.sliding > 0 ? P_H_SLIDE : P_H; }

    function startRun() {
        G.mode = 'play';
        G.time = 0;
        G.dist = 0;
        G.metres = 0;
        G.speed = RUN_START;
        G.x = 0;
        G.y = 0;
        G.vy = 0;
        G.onGround = true;
        G.groundAt = 0;
        G.sliding = 0;
        G.hurtUntil = -9;
        G.runCycle = 0;
        G.tail = [];
        for (let i = 0; i < START_PALS; i++) {
            G.tail.push(Math.floor(Math.random() * PALS.length));
        }
        G.trail = [{ x: -30, y: 0 }, { x: 0, y: 0 }];
        G.items = [];
        G.gaps = [];
        G.plats = [];
        G.builtTo = 18;          // chừa một đoạn trống cho bé kịp nhìn
        G.lastChunk = -1;
        /* Ép khối đầu tiên là khối nghỉ: chướng ngại ngay giây thứ hai thì bé
         * còn chưa kịp biết ngón tay mình làm được gì. */
        G.chunksSince = 99;
        G.fruit = 0;
        G.combo = 0;
        G.comboAt = -9;
        G.bestCombo = 0;
        G.pals = 0;
        G.score = 0;
        G.shield = 0;
        G.magnetT = 0;
        G.rocketT = 0;
        G.zone = 0;
        G.parts = [];
        G.rings = [];
        G.floats = [];
        G.shakeUntil = 0;
        G.flashAt = -9;
        G.beat = 0;
        G.beatN = 0;
        rollMissions();
        buildAhead();
        updateHud();
    }

    function jump() {
        if (G.mode !== 'play') return;
        G.wantJump = G.time;
        tryJump();
    }

    function tryJump() {
        if (G.mode !== 'play') return;
        if (G.time - G.wantJump > BUFFER) return;
        const canCoyote = G.onGround || (G.time - G.lastGround < COYOTE);
        if (!canCoyote && G.rocketT <= 0) return;
        if (G.rocketT > 0) return;                 // đang bay thì khỏi nhảy

        G.vy = -JUMP_V;
        G.onGround = false;
        G.jumpHold = HOLD_T;
        G.sliding = 0;
        G.wantJump = -9;
        G.lastGround = -9;
        sfx.jump();
        puff(G.x, G.y, 7, '#ffffff');
    }

    function releaseJump() { G.jumpHold = 0; }

    function slide() {
        if (G.mode !== 'play' || G.rocketT > 0) return;
        if (!G.onGround) {
            /* Trên không bấm trượt thì rơi sập xuống — vừa là đòn né nhanh vừa
             * cứu được cú nhảy lỡ đà. */
            G.vy = Math.max(G.vy, 16);
            G.jumpHold = 0;
            return;
        }
        G.sliding = SLIDE_T;
        sfx.slide();
        puff(G.x - 0.4, G.y, 6, '#ffe9a8');
    }

    /* Mặt đỡ cao nhất nằm dưới chân người chơi tại x. Trả về null nghĩa là
     * đang lơ lửng trên hố. */
    function supportAt(x, feetY, vy, prevY) {
        let best = null;
        for (const p of G.plats) {
            if (x < p.x0 - P_W * 0.35 || x > p.x1 + P_W * 0.35) continue;
            /* Chỉ bám vào bệ khi đang rơi xuống VÀ khung hình trước chân còn ở
             * trên mặt bệ. Thiếu vế sau thì chạy dưới đất qua gầm một cái bệ là
             * bị hút thẳng lên đứng trên nó — vừa vô lý vừa cho không bé mấy cái
             * lồng đặt trên cao. */
            if (vy < 0) continue;
            if (prevY < p.y - 0.02) continue;
            if (feetY > p.y + 0.6) continue;
            if (best == null || p.y > best) best = p.y;
        }
        if (best != null) return best;
        if (overGap(x)) return null;
        return 0;
    }

    function stepPlayer(dt) {
        /* ---- chạy tới ---- */
        const mm = G.metres * G.metres;
        G.speed = RUN_START + (RUN_MAX - RUN_START) * (mm / (mm + RUN_MID * RUN_MID));
        const sp = G.speed * (G.rocketT > 0 ? 1.25 : 1);
        G.x += sp * dt;
        G.dist += sp * dt;
        const wasM = G.metres;
        G.metres = Math.floor(G.dist / METER);
        if (G.metres !== wasM) countMission('dist', 0, G.metres);
        G.runCycle += dt * (G.onGround ? sp * 0.9 : 4);

        /* ---- lên xuống ---- */
        if (G.rocketT > 0) {
            /* Tên lửa: bay ngang ở độ cao dễ chịu, ăn sạch mọi thứ trên đường. */
            const want = 4.6;
            G.vy += (G.y > want ? -34 : 34) * dt;
            G.vy *= Math.pow(0.02, dt);
            G.y += G.vy * dt;
            G.onGround = false;
        } else {
            let g = GRAV;
            if (G.jumpHold > 0 && G.vy < 0) {
                g = GRAV * HOLD_G;
                G.jumpHold -= dt;
            }
            const prevY = G.y;
            G.vy += g * dt;
            G.y -= G.vy * dt;         // y đo từ mặt đất lên nên vy dương là rơi

            const sup = supportAt(G.x, G.y, G.vy, prevY);
            if (sup != null && G.y <= sup && G.vy >= 0) {
                if (!G.onGround) {
                    sfx.land();
                    puff(G.x, sup, 6, '#ffffff');
                    if (G.vy > 12) shake(0.12, 0.12);
                }
                G.y = sup;
                G.vy = 0;
                G.onGround = true;
                G.groundAt = sup;
            } else {
                if (G.onGround) G.lastGround = G.time;
                G.onGround = false;
            }
        }

        if (G.sliding > 0) G.sliding -= dt;
        if (G.time - G.wantJump <= BUFFER) tryJump();

        /* ---- rơi xuống vực ---- */
        if (G.y < -3.2) {
            loseOne('fall');
            /* Đặt thẳng xuống mặt đất ngay sau hố, không thì bé rơi mãi. Thả từ
             * trên cao xuống thì trên đường rơi bé quơ trúng cả lồng bạn treo lơ
             * lửng — hoá ra không bấm gì lại cứu được người, hỏng cả trò. */
            let x = G.x;
            let guard = 0;
            while (overGap(x) && guard++ < 200) x += 0.4;
            G.x = x + 0.6;
            G.y = 0;
            G.vy = 0;
            G.onGround = true;
            puff(G.x, 0, 8, '#ffffff');
        }

        /* ---- vệt đường cho đoàn bám theo ---- */
        const last = G.trail[G.trail.length - 1];
        if (!last || G.x - last.x > 0.14) G.trail.push({ x: G.x, y: G.y });

        /* ---- vùng cảnh ----
         * Quay vòng chứ không dừng ở cảnh cuối: chạy được nghìn mét mà cảnh
         * đứng im thì đúng lúc bé giỏi nhất lại là lúc màn hình chán nhất. */
        const z = Math.floor(G.metres / ZONE_LEN) % ZONES.length;
        if (z !== G.zone) {
            G.zone = z;
            sfx.zone();
            flash(ZONES[z].accent, 0.4);
            G.floats.push({
                text: ZONES[z].name, x: G.x + 4, y: 5.2, born: G.time, big: true,
                col: ZONES[z].accent
            });
        }

        /* ---- vật phẩm hết hạn ---- */
        if (G.magnetT > 0) G.magnetT -= dt;
        if (G.rocketT > 0) {
            G.rocketT -= dt;
            if (G.rocketT <= 0) G.vy = 0;
            if (Math.random() < dt * 60) {
                G.parts.push({
                    x: G.x - 0.6, y: G.y + 0.5, vx: -6 - Math.random() * 5,
                    vy: (Math.random() - 0.5) * 3, r: 0.1 + Math.random() * 0.16,
                    life: 0.3, age: 0, col: Math.random() < 0.5 ? '#ffd43b' : '#ff922b', grav: 0
                });
            }
        }
        if (G.combo > 0 && G.time - G.comboAt > COMBO_T) G.combo = 0;
    }

    /* ---- va chạm với vật thể ---- */
    function playerBox() {
        const h = playerH();
        return { x0: G.x - P_W / 2, x1: G.x + P_W / 2, y0: G.y, y1: G.y + h };
    }

    function hits(a, x0, x1, y0, y1) {
        return a.x1 > x0 && a.x0 < x1 && a.y1 > y0 && a.y0 < y1;
    }

    function stepItems(dt) {
        const box = playerBox();
        const magnet = G.magnetT > 0;

        for (const it of G.items) {
            if (it.gone) continue;
            if (it.x < G.x - 3) continue;
            if (it.x > G.x + V.cols) break;

            if (it.t === T.FRUIT) {
                /* Nam châm kéo quả về phía bé, cả những quả bé không kịp với. */
                if (magnet || G.rocketT > 0) {
                    const d = Math.hypot(it.x - G.x, it.y - (G.y + 0.7));
                    const r = G.rocketT > 0 ? MAGNET_R * 1.8 : MAGNET_R;
                    if (d < r) {
                        const k = 15 * dt;
                        it.x += (G.x - it.x) * k;
                        it.y += (G.y + 0.7 - it.y) * k;
                    }
                }
                if (hits(box, it.x - 0.45, it.x + 0.45, it.y - 0.45, it.y + 0.45)) {
                    it.gone = true;
                    takeFruit(it);
                }
                continue;
            }

            if (it.t === T.FRIEND) {
                if (hits(box, it.x - 0.7, it.x + 0.7, it.y, it.y + 1.6)) {
                    it.gone = true;
                    rescue(it);
                }
                continue;
            }

            if (it.t === T.POWER) {
                if (hits(box, it.x - 0.6, it.x + 0.6, it.y - 0.6, it.y + 0.6)) {
                    it.gone = true;
                    takePower(it);
                }
                continue;
            }

            /* ---- chướng ngại ---- */
            if (G.rocketT > 0) continue;              // đang bay thì xuyên qua tất

            let x0, x1, y0, y1;
            if (it.t === T.ROCK) { x0 = it.x - 0.55; x1 = it.x + 0.55; y0 = 0; y1 = it.h; }
            else if (it.t === T.SPIKE) { x0 = it.x - 0.6; x1 = it.x + 0.6; y0 = 0; y1 = 0.85; }
            else { x0 = it.x - 0.7; x1 = it.x + 0.7; y0 = 1.05; y1 = 3.2; }   // cành

            if (hits(box, x0, x1, y0, y1)) {
                if (G.time < G.hurtUntil) continue;
                loseOne('hit');
                it.hitAt = G.time;
                continue;
            }

            /* Lướt sát mà không chạm: thưởng combo. Đây là chỗ trò chơi thưởng
             * cho bé nào dám nhảy muộn thay vì nhảy sớm cho chắc. */
            if (!it.nearDone && it.x < G.x && it.x > G.x - 1.2) {
                it.nearDone = true;
                const near = (it.t === T.BRANCH)
                    ? (box.y1 > y0 - NEAR_MISS)
                    : (box.y0 < y1 + NEAR_MISS);
                if (near) {
                    bumpCombo();
                    G.floats.push({ text: 'NICE!', x: it.x, y: 3.2, born: G.time, col: '#8ef0a0' });
                    G.score += 15;
                }
            }
        }
    }

    function takeFruit(it) {
        G.fruit++;
        bumpCombo();
        G.score += 10 * mult();
        sfx.fruit(Math.min(G.combo, NOTES.length - 1));
        G.parts.push.apply(G.parts, burst(it.x, it.y, 6, '#ffd43b'));
        G.rings.push({ x: it.x, y: it.y, r0: 0.3, grow: 2.2, life: 0.26, age: 0, col: '#ffe066' });
        countMission('fruit', 1);
    }

    function rescue(it) {
        if (G.tail.length < MAX_TAIL) G.tail.push(it.pal);
        G.pals++;
        bumpCombo();
        G.score += 120 * mult();
        sfx.pal();
        shake(0.16, 0.2);
        flash('#ffe066', 0.3);
        G.parts.push.apply(G.parts, burst(it.x, it.y + 0.8, 18, PALS[it.pal].main));
        G.rings.push({ x: it.x, y: it.y + 0.8, r0: 0.5, grow: 3.4, life: 0.4, age: 0, col: '#ffffff' });
        G.floats.push({
            text: 'RESCUED!', x: it.x, y: it.y + 2.6, born: G.time, big: true, col: '#ffe066'
        });
        countMission('pals', 1);
        updateHud();
    }

    function takePower(it) {
        if (it.kind === POWER.SHIELD) {
            G.shield = SHIELD_HITS;
            sfx.power();
            G.floats.push({ text: 'SHIELD!', x: it.x, y: it.y + 1.6, born: G.time, col: '#8ed0ff' });
        } else if (it.kind === POWER.MAGNET) {
            G.magnetT = MAGNET_T;
            sfx.power();
            G.floats.push({ text: 'MAGNET!', x: it.x, y: it.y + 1.6, born: G.time, col: '#ff9de2' });
        } else {
            G.rocketT = ROCKET_T;
            G.vy = -6;
            sfx.rocket();
            shake(0.3, 0.4);
            G.floats.push({ text: 'BLAST OFF!', x: it.x, y: it.y + 1.6, born: G.time, big: true, col: '#ff922b' });
        }
        G.parts.push.apply(G.parts, burst(it.x, it.y, 14, '#ffffff'));
        updateHud();
    }

    function bumpCombo() {
        G.combo++;
        G.comboAt = G.time;
        if (G.combo > G.bestCombo) G.bestCombo = G.combo;
        if (G.combo === 10 || G.combo === 20 || G.combo === 35) {
            G.floats.push({
                text: 'COMBO x' + G.combo, x: G.x + 2, y: 4.4, born: G.time,
                big: true, col: '#ff9de2'
            });
            flash('#ff9de2', 0.22);
        }
        countMission('combo', 0, G.combo);
    }

    /* Điểm nhân theo số bạn đang có: cứu càng nhiều, mỗi quả càng đáng giá.
     * Đây là chỗ nối cơ chế cứu bạn vào điểm số, không thì đoàn bạn chỉ còn là
     * thứ trang trí chạy sau lưng. */
    function mult() {
        return 1 + G.tail.length * 0.5;
    }

    function loseOne(why) {
        if (G.time < G.hurtUntil) return;

        if (G.shield > 0) {
            G.shield--;
            G.hurtUntil = G.time + HURT_T * 0.6;
            sfx.power();
            shake(0.25, 0.25);
            G.rings.push({ x: G.x, y: G.y + 0.8, r0: 1, grow: 2.6, life: 0.35, age: 0, col: '#8ed0ff' });
            G.floats.push({ text: 'SAVED!', x: G.x, y: G.y + 2.8, born: G.time, col: '#8ed0ff' });
            updateHud();
            return;
        }

        G.combo = 0;
        G.hurtUntil = G.time + HURT_T;
        sfx.hurt();
        shake(0.45, 0.35);
        flash('#ff6b6b', 0.35);

        if (G.tail.length) {
            /* Bạn cuối đoàn bị văng ra và chạy mất — nhìn thấy được thì bé mới
             * xót, mà xót thì lần sau mới né cẩn thận. */
            const pal = G.tail.pop();
            G.parts.push.apply(G.parts, burst(G.x - 1, G.y + 0.6, 14, PALS[pal].main));
            G.floats.push({
                text: '-1 FRIEND', x: G.x, y: G.y + 2.8, born: G.time, big: true, col: '#ff8787'
            });
            G.escapees = G.escapees || [];
            G.escapees.push({ pal: pal, x: G.x - 1, y: G.y + 0.4, vx: -7, vy: -9, born: G.time });
            if (why === 'hit') G.vy = Math.min(G.vy, -6);
            updateHud();
            return;
        }

        gameOver();
    }

    function gameOver() {
        G.mode = 'over';
        sfx.over();
        shake(0.6, 0.5);
        const newBest = store.record(G.metres, G.pals, G.fruit);
        G.score += G.metres * 5;
        showOver(newBest);
    }

    /* ---- nhiệm vụ mỗi lượt ---- */
    const MISSION_POOL = [
        { key: 'pals', text: 'Rescue {n} friends', pick: () => 3 + Math.floor(Math.random() * 3) },
        { key: 'fruit', text: 'Collect {n} fruit', pick: () => 30 + Math.floor(Math.random() * 4) * 10 },
        { key: 'dist', text: 'Run {n} m', pick: () => 250 + Math.floor(Math.random() * 4) * 100 },
        { key: 'combo', text: 'Reach a {n} combo', pick: () => 12 + Math.floor(Math.random() * 3) * 6 }
    ];

    function rollMissions() {
        const pool = MISSION_POOL.slice();
        G.missions = [];
        for (let i = 0; i < 3 && pool.length; i++) {
            const k = Math.floor(Math.random() * pool.length);
            const m = pool.splice(k, 1)[0];
            const n = m.pick();
            G.missions.push({ key: m.key, text: m.text.replace('{n}', n), need: n, have: 0, done: false });
        }
    }

    function countMission(key, add, setTo) {
        G.missions.forEach(m => {
            if (m.done || m.key !== key) return;
            m.have = setTo != null ? Math.max(m.have, setTo) : m.have + add;
            if (m.have >= m.need) {
                m.done = true;
                G.score += 250;
                sfx.power();
                G.floats.push({
                    text: 'MISSION!', x: G.x + 2, y: 5.6, born: G.time, big: true, col: '#8ef0a0'
                });
            }
        });
    }

    /* ========================================================================
     *  9. HIỆU ỨNG
     * ======================================================================*/

    function shake(mag, dur) {
        G.shakeMag = Math.max(G.time < G.shakeUntil ? G.shakeMag : 0, mag);
        G.shakeUntil = Math.max(G.shakeUntil, G.time + dur);
    }

    function flash(col, amt) {
        G.flashAt = G.time;
        G.flashCol = col;
        G.flashAmt = amt;
    }

    function burst(x, y, n, col) {
        const out = [];
        for (let i = 0; i < n; i++) {
            const a = Math.random() * 6.283;
            const sp = 3 + Math.random() * 9;
            out.push({
                x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                r: 0.06 + Math.random() * 0.14,
                life: 0.3 + Math.random() * 0.35, age: 0, col: col, grav: 22, drag: 0.15
            });
        }
        return out;
    }

    /* Bụi tung dưới chân — thứ làm cú tiếp đất có sức nặng. */
    function puff(x, y, n, col) {
        for (let i = 0; i < n; i++) {
            const a = -Math.PI * (0.15 + Math.random() * 0.7);
            const sp = 2 + Math.random() * 4;
            G.parts.push({
                x: x + (Math.random() - 0.5) * 0.5, y: y + 0.05,
                vx: Math.cos(a) * sp - 3, vy: Math.sin(a) * sp,
                r: 0.08 + Math.random() * 0.16,
                life: 0.24 + Math.random() * 0.2, age: 0, col: col, grav: 4, drag: 0.1
            });
        }
    }

    function stepFx(dt) {
        for (let i = G.parts.length - 1; i >= 0; i--) {
            const p = G.parts[i];
            p.age += dt;
            if (p.age >= p.life) { G.parts.splice(i, 1); continue; }
            p.vy += (p.grav == null ? 22 : p.grav) * dt;
            if (p.drag) { const k = Math.pow(p.drag, dt); p.vx *= k; p.vy *= k; }
            p.x += p.vx * dt;
            p.y -= p.vy * dt;
        }
        for (let i = G.rings.length - 1; i >= 0; i--) {
            G.rings[i].age += dt;
            if (G.rings[i].age >= G.rings[i].life) G.rings.splice(i, 1);
        }
        for (let i = G.floats.length - 1; i >= 0; i--) {
            if (G.time - G.floats[i].born > 1.1) G.floats.splice(i, 1);
        }
        if (G.escapees) {
            for (let i = G.escapees.length - 1; i >= 0; i--) {
                const e = G.escapees[i];
                e.vy += 30 * dt;
                e.x += e.vx * dt;
                e.y -= e.vy * dt;
                if (G.time - e.born > 1.4) G.escapees.splice(i, 1);
            }
        }

        /* Nhịp trống chạy theo tốc độ: mỗi lượt chơi tự nhanh dần lên. */
        if (G.mode === 'play') {
            G.beat += dt * (1.9 + G.speed * 0.085);
            while (G.beat >= 1) {
                G.beat -= 1;
                G.beatN++;
                if (G.beatN % 4 === 0) sfx.kick(); else sfx.hat();
            }
        }
    }

    /* ========================================================================
     *  10. VẼ
     * ======================================================================*/

    /* Hạt trang trí nền, mỗi vùng cảnh một kiểu (lá bay, cát, tinh thể, sao). */
    const deco = [];
    function seedDeco() {
        deco.length = 0;
        for (let i = 0; i < 34; i++) {
            deco.push({
                x: Math.random(), y: Math.random(),
                r: 0.004 + Math.random() * 0.014,
                s: 0.15 + Math.random() * 0.9,
                p: Math.random() * 6.28
            });
        }
    }

    function zone() { return ZONES[Math.min(G.zone, ZONES.length - 1)]; }

    function draw() {
        const Z = zone();

        ctx.save();
        if (G.time < G.shakeUntil) {
            const left = G.shakeUntil - G.time;
            const k = V.u * G.shakeMag * 0.8 * Math.min(1, left * 3.2);
            ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
        }

        drawSky(Z);
        drawParallax(Z);
        drawGround(Z);
        drawItems(Z);
        drawTail();
        drawPlayer();
        drawParts();
        drawRings();
        drawFlash();
        drawFloats();
        drawSpeedLines();

        ctx.restore();
    }

    function drawSky(Z) {
        const g = ctx.createLinearGradient(0, 0, 0, V.h);
        g.addColorStop(0, Z.sky[0]);
        g.addColorStop(0.55, Z.sky[1]);
        g.addColorStop(1, Z.sky[2]);
        ctx.fillStyle = g;
        ctx.fillRect(-30, -30, V.w + 60, V.h + 60);

        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#ffffff';
        deco.forEach(d => {
            const x = ((d.x - G.dist * 0.004 * d.s) % 1 + 1) % 1;
            const y = d.y + Math.sin(G.time * d.s + d.p) * 0.02;
            ctx.beginPath();
            ctx.arc(x * V.w, y * V.h * 0.75, d.r * V.w, 0, 6.283);
            ctx.fill();
        });
        ctx.restore();
    }

    /* Ba lớp nền trôi với ba tốc độ khác nhau. Không có lớp nào thì cảm giác
     * tốc độ biến mất hẳn — mặt đất trôi một mình trông như bé chạy tại chỗ. */
    function drawParallax(Z) {
        /* Máy dựng đứng có bầu trời cao gấp đôi máy nằm ngang; đồi cứ để nguyên
         * chiều cao thì thành một vệt mỏng dưới đáy, phần còn lại trống hoác.
         * Cho đồi cao theo bầu trời để khung hình lúc nào cũng đầy. */
        const fill = Math.max(1, Math.min(2.6, (V.skyU || 7) / 6.4));
        const layers = [
            { col: Z.far, k: 0.15, h: 3.4 * fill, w: 7 * Math.sqrt(fill), seed: 11 },
            { col: Z.mid, k: 0.35, h: 2.3 * fill, w: 5 * Math.sqrt(fill), seed: 29 }
        ];
        layers.forEach(L => {
            ctx.fillStyle = L.col;
            const off = (G.dist * L.k) % L.w;
            const n = Math.ceil(V.cols / L.w) + 2;
            for (let i = -1; i < n; i++) {
                const bx = i * L.w - off;
                /* Chiều cao lấy từ một hàm băm cố định theo chỉ số, không phải
                 * random: nếu random thì mỗi khung hình đồi lại nhảy một kiểu. */
                const idx = Math.floor((G.dist * L.k) / L.w) + i + L.seed;
                const hh = L.h * (0.55 + 0.45 * Math.abs(Math.sin(idx * 12.9898)));
                hump(bx * V.u, sy(0), L.w * V.u, hh * V.u, Z.key);
            }
        });
    }

    function hump(x, baseY, w, h, kind) {
        ctx.beginPath();
        if (kind === 'cave') {
            /* Hang thì vẽ măng đá nhọn hoắt thay cho đồi tròn. */
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + w * 0.5, baseY - h);
            ctx.lineTo(x + w, baseY);
        } else if (kind === 'night') {
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + w * 0.3, baseY - h);
            ctx.lineTo(x + w * 0.62, baseY - h * 0.55);
            ctx.lineTo(x + w, baseY);
        } else {
            ctx.moveTo(x, baseY);
            ctx.quadraticCurveTo(x + w * 0.5, baseY - h * 2, x + w, baseY);
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawGround(Z) {
        const gy = sy(0);
        const bottom = V.h + 40;

        /* Mặt đất vẽ theo từng đoạn giữa các hố. */
        let cursor = G.x - PLAYER_X - 2;
        const end = G.x + V.cols + 2;
        const list = G.gaps.filter(g => g.x1 > cursor && g.x0 < end)
            .sort((a, b) => a.x0 - b.x0);

        const segs = [];
        list.forEach(g => {
            if (g.x0 > cursor) segs.push([cursor, g.x0]);
            cursor = Math.max(cursor, g.x1);
        });
        if (cursor < end) segs.push([cursor, end]);

        segs.forEach(s => {
            const x0 = sx(s[0]), x1 = sx(s[1]);
            ctx.fillStyle = Z.dirt;
            ctx.fillRect(x0, gy, x1 - x0, bottom - gy);
            ctx.fillStyle = Z.ground;
            ctx.fillRect(x0, gy, x1 - x0, V.u * 0.42);
            /* Vạch sáng chạy dọc mép cỏ cho mặt đất có mép rõ ràng — bé phải
               nhìn ra ngay đâu là chỗ đặt chân được. */
            ctx.fillStyle = 'rgba(255,255,255,0.22)';
            ctx.fillRect(x0, gy, x1 - x0, V.u * 0.09);
        });

        /* Bệ lơ lửng */
        G.plats.forEach(p => {
            if (p.x1 < G.x - 4 || p.x0 > G.x + V.cols) return;
            const x0 = sx(p.x0), x1 = sx(p.x1), y = sy(p.y);
            const h = V.u * 0.55;
            ctx.fillStyle = Z.dirt;
            roundRect(x0, y, x1 - x0, h, V.u * 0.16);
            ctx.fill();
            ctx.fillStyle = Z.ground;
            roundRect(x0, y, x1 - x0, h * 0.55, V.u * 0.16);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(x0 + 2, y, x1 - x0 - 4, V.u * 0.07);
        });
    }

    function drawItems(Z) {
        G.items.forEach(it => {
            if (it.gone) return;
            if (it.x < G.x - 3 || it.x > G.x + V.cols + 2) return;
            const x = sx(it.x);

            if (it.t === T.FRUIT) {
                const y = sy(it.y) + Math.sin(G.time * 3 + it.bob) * V.u * 0.08;
                ctx.save();
                ctx.shadowColor = 'rgba(255,212,59,0.8)';
                ctx.shadowBlur = V.u * 0.35;
                const g = ctx.createRadialGradient(x - V.u * 0.1, y - V.u * 0.1, V.u * 0.04, x, y, V.u * 0.34);
                g.addColorStop(0, '#fff9db');
                g.addColorStop(1, '#f59f00');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(x, y, V.u * 0.3, 0, 6.283);
                ctx.fill();
                ctx.restore();
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.beginPath();
                ctx.arc(x - V.u * 0.1, y - V.u * 0.11, V.u * 0.07, 0, 6.283);
                ctx.fill();
                return;
            }

            if (it.t === T.FRIEND) {
                drawCage(x, sy(it.y), it);
                return;
            }

            if (it.t === T.POWER) {
                drawPower(x, sy(it.y) + Math.sin(G.time * 2.6 + it.bob) * V.u * 0.12, it);
                return;
            }

            if (it.t === T.ROCK) {
                drawRock(x, sy(0), it.h);
                return;
            }
            if (it.t === T.SPIKE) {
                drawSpike(x, sy(0));
                return;
            }
            if (it.t === T.BRANCH) {
                drawBranch(x, sy(3.2), Z);
                return;
            }
        });
    }

    function drawRock(x, gy, h) {
        const w = V.u * 1.1, hh = V.u * h;
        const g = ctx.createLinearGradient(0, gy - hh, 0, gy);
        g.addColorStop(0, '#9aa4b2');
        g.addColorStop(1, '#4b5563');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - w / 2, gy);
        ctx.lineTo(x - w * 0.34, gy - hh * 0.85);
        ctx.lineTo(x + w * 0.06, gy - hh);
        ctx.lineTo(x + w / 2, gy - hh * 0.5);
        ctx.lineTo(x + w / 2, gy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = Math.max(1, V.u * 0.05);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.beginPath();
        ctx.moveTo(x - w * 0.3, gy - hh * 0.72);
        ctx.lineTo(x + w * 0.02, gy - hh * 0.9);
        ctx.lineTo(x - w * 0.06, gy - hh * 0.6);
        ctx.closePath();
        ctx.fill();
    }

    function drawSpike(x, gy) {
        const w = V.u * 1.2, h = V.u * 0.85;
        ctx.fillStyle = '#2f9e44';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const bx = x - w / 2 + (i * w) / 4;
            ctx.moveTo(bx - w * 0.14, gy);
            ctx.lineTo(bx, gy - h * (0.7 + (i % 2) * 0.3));
            ctx.lineTo(bx + w * 0.14, gy);
        }
        ctx.fill();
        ctx.fillStyle = '#8ce99a';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const bx = x - w / 2 + (i * w) / 4;
            ctx.moveTo(bx - w * 0.05, gy - h * 0.35);
            ctx.lineTo(bx, gy - h * (0.7 + (i % 2) * 0.3));
            ctx.lineTo(bx + w * 0.02, gy - h * 0.4);
        }
        ctx.fill();
    }

    function drawBranch(x, topY, Z) {
        /* Cành chìa từ trên xuống, khoảng hở dưới nó vừa đủ cho tư thế trượt. */
        const y0 = sy(3.2), y1 = sy(1.05);
        ctx.fillStyle = '#6b4423';
        roundRect(x - V.u * 0.7, y0 - V.u * 0.6, V.u * 1.4, (y1 - y0) + V.u * 0.6, V.u * 0.2);
        ctx.fill();
        ctx.fillStyle = Z.key === 'cave' ? '#8ed0ff' : '#2f9e44';
        for (let i = 0; i < 3; i++) {
            const yy = y0 + (y1 - y0) * (0.2 + i * 0.3);
            ctx.beginPath();
            ctx.ellipse(x + (i % 2 ? 1 : -1) * V.u * 0.55, yy, V.u * 0.45, V.u * 0.22,
                (i % 2 ? -0.5 : 0.5), 0, 6.283);
            ctx.fill();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x - V.u * 0.7, y1 - V.u * 0.08, V.u * 1.4, V.u * 0.08);
    }

    function drawCage(x, gy, it) {
        const w = V.u * 1.3, h = V.u * 1.5;
        const bob = Math.sin(G.time * 4 + it.bob) * V.u * 0.05;
        const pal = PALS[it.pal];

        /* Lồng treo lơ lửng thì phải có dây, không thì nhìn như cái hộp bay. */
        if (it.y > 0.3) {
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = Math.max(1, V.u * 0.05);
            ctx.beginPath();
            ctx.moveTo(x, gy - h + bob);
            ctx.lineTo(x + Math.sin(G.time * 2 + it.bob) * V.u * 0.1, 0);
            ctx.stroke();
        }

        /* Bạn nhỏ ngồi trong lồng, ngoáy tai cho ra vẻ đang sốt ruột chờ. */
        drawPal(x, gy - h * 0.18 + bob, V.u * 0.5, pal, G.time * 6 + it.bob, false);

        ctx.strokeStyle = '#c9d1d9';
        ctx.lineWidth = Math.max(1.5, V.u * 0.09);
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            const bx = x - w / 2 + (i * w) / 4;
            ctx.moveTo(bx, gy);
            ctx.lineTo(bx, gy - h);
        }
        ctx.moveTo(x - w / 2, gy - h);
        ctx.lineTo(x + w / 2, gy - h);
        ctx.moveTo(x - w / 2, gy);
        ctx.lineTo(x + w / 2, gy);
        ctx.stroke();

        /* Quầng sáng nhấp nháy để mắt bắt được từ xa. */
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.16 + 0.12 * Math.sin(G.time * 5);
        const g = ctx.createRadialGradient(x, gy - h * 0.5, 0, x, gy - h * 0.5, V.u * 1.8);
        g.addColorStop(0, '#ffe066');
        g.addColorStop(1, 'rgba(255,224,102,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, gy - h * 0.5, V.u * 1.8, 0, 6.283);
        ctx.fill();
        ctx.restore();
    }

    function drawPower(x, y, it) {
        const r = V.u * 0.48;
        const col = it.kind === POWER.SHIELD ? '#8ed0ff'
            : it.kind === POWER.MAGNET ? '#ff9de2' : '#ff922b';
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 + 0.2 * Math.sin(G.time * 5 + it.bob);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.6, 0, 6.283);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = 'rgba(12,26,44,0.9)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(1.5, r * 0.22);
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.save();
        ctx.translate(x, y);
        if (it.kind === POWER.SHIELD) {
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.55);
            ctx.lineTo(r * 0.45, -r * 0.3);
            ctx.lineTo(r * 0.45, r * 0.15);
            ctx.quadraticCurveTo(0, r * 0.7, -r * 0.45, r * 0.15);
            ctx.lineTo(-r * 0.45, -r * 0.3);
            ctx.closePath();
            ctx.fill();
        } else if (it.kind === POWER.MAGNET) {
            ctx.lineWidth = r * 0.3;
            ctx.strokeStyle = col;
            ctx.beginPath();
            ctx.arc(0, r * 0.1, r * 0.42, Math.PI, 0);
            ctx.stroke();
            ctx.fillRect(-r * 0.57, r * 0.1, r * 0.3, r * 0.42);
            ctx.fillRect(r * 0.27, r * 0.1, r * 0.3, r * 0.42);
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.6);
            ctx.quadraticCurveTo(r * 0.4, 0, r * 0.22, r * 0.45);
            ctx.lineTo(-r * 0.22, r * 0.45);
            ctx.quadraticCurveTo(-r * 0.4, 0, 0, -r * 0.6);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    /* ---- đoàn bạn chạy sau lưng ---- */
    function trailAt(worldX) {
        const t = G.trail;
        if (!t.length) return 0;
        if (worldX <= t[0].x) return t[0].y;
        /* Duyệt ngược: bạn cần tra thường nằm gần cuối mảng. */
        for (let i = t.length - 1; i > 0; i--) {
            if (t[i - 1].x <= worldX && worldX <= t[i].x) {
                const span = t[i].x - t[i - 1].x;
                const k = span > 0.0001 ? (worldX - t[i - 1].x) / span : 0;
                return t[i - 1].y + (t[i].y - t[i - 1].y) * k;
            }
        }
        return t[t.length - 1].y;
    }

    function drawTail() {
        for (let i = G.tail.length - 1; i >= 0; i--) {
            const wx = G.x - (i + 1) * TAIL_GAP;
            const wy = trailAt(wx);
            const pal = PALS[G.tail[i]];
            const hop = Math.abs(Math.sin(G.runCycle * 0.5 - i * 0.6)) * 0.18;
            drawPal(sx(wx), sy(wy + hop), V.u * 0.42, pal, G.runCycle - i * 0.6, true);
        }

        if (G.escapees) {
            G.escapees.forEach(e => {
                const k = Math.min(1, (G.time - e.born) / 1.4);
                ctx.save();
                ctx.globalAlpha = 1 - k;
                drawPal(sx(e.x), sy(e.y), V.u * 0.42, PALS[e.pal], G.time * 14, true);
                ctx.restore();
            });
        }
    }

    /* Một bạn nhỏ: thân tròn, hai tai, mặt. Vẽ bằng hình cơ bản chứ không dùng
     * ảnh — nhờ vậy đổi cỡ màn hình bao nhiêu cũng nét. */
    function drawPal(x, y, r, pal, phase, running) {
        const bounce = running ? Math.abs(Math.sin(phase)) * r * 0.18 : 0;
        const cy = y - r - bounce;

        /* bóng đổ */
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.06, r * 0.7, r * 0.2, 0, 0, 6.283);
        ctx.fill();

        /* chân */
        if (running) {
            ctx.strokeStyle = pal.dark;
            ctx.lineWidth = r * 0.26;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - r * 0.25, cy + r * 0.6);
            ctx.lineTo(x - r * 0.25 + Math.cos(phase) * r * 0.45, y);
            ctx.moveTo(x + r * 0.25, cy + r * 0.6);
            ctx.lineTo(x + r * 0.25 + Math.cos(phase + Math.PI) * r * 0.45, y);
            ctx.stroke();
        }

        /* tai */
        ctx.fillStyle = pal.main;
        [-1, 1].forEach(s => {
            ctx.beginPath();
            ctx.ellipse(x + s * r * 0.5, cy - r * 0.72, r * 0.24, r * 0.42,
                s * 0.35, 0, 6.283);
            ctx.fill();
        });
        ctx.fillStyle = pal.ear;
        [-1, 1].forEach(s => {
            ctx.beginPath();
            ctx.ellipse(x + s * r * 0.5, cy - r * 0.7, r * 0.12, r * 0.24,
                s * 0.35, 0, 6.283);
            ctx.fill();
        });

        /* thân */
        const g = ctx.createRadialGradient(x - r * 0.3, cy - r * 0.35, r * 0.1, x, cy, r);
        g.addColorStop(0, pal.ear);
        g.addColorStop(0.6, pal.main);
        g.addColorStop(1, pal.dark);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, cy, r * 0.92, 0, 6.283);
        ctx.fill();

        /* mặt */
        ctx.fillStyle = '#1b2430';
        ctx.beginPath();
        ctx.arc(x - r * 0.3, cy - r * 0.1, r * 0.13, 0, 6.283);
        ctx.arc(x + r * 0.3, cy - r * 0.1, r * 0.13, 0, 6.283);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - r * 0.26, cy - r * 0.15, r * 0.05, 0, 6.283);
        ctx.arc(x + r * 0.34, cy - r * 0.15, r * 0.05, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = '#1b2430';
        ctx.lineWidth = r * 0.09;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, cy + r * 0.12, r * 0.24, 0.25, Math.PI - 0.25);
        ctx.stroke();
        /* má hồng */
        ctx.fillStyle = 'rgba(255,120,150,0.45)';
        ctx.beginPath();
        ctx.arc(x - r * 0.55, cy + r * 0.14, r * 0.13, 0, 6.283);
        ctx.arc(x + r * 0.55, cy + r * 0.14, r * 0.13, 0, 6.283);
        ctx.fill();
    }

    function drawPlayer() {
        const x = sx(G.x);
        const y = sy(G.y);
        const h = playerH();
        const hurt = G.time < G.hurtUntil;
        /* Nhấp nháy lúc bất tử — không có dấu hiệu này thì bé không hiểu vì sao
         * vừa đâm vào đá mà lần này không sao. */
        if (hurt && Math.floor(G.time * 14) % 2 === 0) return;

        ctx.save();

        /* khiên */
        if (G.shield > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.3 + 0.15 * Math.sin(G.time * 6);
            ctx.strokeStyle = '#8ed0ff';
            ctx.lineWidth = V.u * 0.12;
            ctx.beginPath();
            ctx.arc(x, y - h * V.u * 0.5, V.u * 1.25, 0, 6.283);
            ctx.stroke();
            ctx.restore();
        }

        const bodyR = V.u * 0.52;
        const sliding = G.sliding > 0;
        const cy = sliding ? y - bodyR * 0.75 : y - h * V.u + bodyR;
        const phase = G.runCycle;

        /* bóng đổ trên mặt đất ngay dưới chân */
        const sup = supportAt(G.x, G.y, 1, G.y);
        if (sup != null) {
            const shY = sy(sup);
            const k = Math.max(0.25, 1 - (shY - y) / (V.u * 5));
            ctx.fillStyle = 'rgba(0,0,0,' + (0.28 * k) + ')';
            ctx.beginPath();
            ctx.ellipse(x, shY, V.u * 0.55 * k, V.u * 0.16 * k, 0, 0, 6.283);
            ctx.fill();
        }

        /* tên lửa dưới chân */
        if (G.rocketT > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const fl = V.u * (0.7 + Math.random() * 0.5);
            const g = ctx.createLinearGradient(x, y, x, y + fl);
            g.addColorStop(0, '#fff3bf');
            g.addColorStop(1, 'rgba(255,146,43,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - V.u * 0.3, y);
            ctx.lineTo(x + V.u * 0.3, y);
            ctx.lineTo(x, y + fl);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        /* chân tay */
        ctx.strokeStyle = '#1f6f4a';
        ctx.lineWidth = V.u * 0.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (sliding) {
            ctx.moveTo(x - bodyR * 0.2, cy + bodyR * 0.5);
            ctx.lineTo(x + bodyR * 1.1, cy + bodyR * 0.7);
        } else if (!G.onGround) {
            ctx.moveTo(x - bodyR * 0.3, cy + bodyR * 0.7);
            ctx.lineTo(x - bodyR * 0.7, cy + bodyR * 1.35);
            ctx.moveTo(x + bodyR * 0.3, cy + bodyR * 0.7);
            ctx.lineTo(x + bodyR * 0.8, cy + bodyR * 1.1);
        } else {
            ctx.moveTo(x - bodyR * 0.25, cy + bodyR * 0.7);
            ctx.lineTo(x - bodyR * 0.25 + Math.cos(phase) * bodyR * 0.7, y);
            ctx.moveTo(x + bodyR * 0.25, cy + bodyR * 0.7);
            ctx.lineTo(x + bodyR * 0.25 + Math.cos(phase + Math.PI) * bodyR * 0.7, y);
        }
        ctx.stroke();

        /* thân: quả bóng xanh lá có mũ phi hành, cho khác hẳn đám bạn tròn */
        const g2 = ctx.createRadialGradient(x - bodyR * 0.3, cy - bodyR * 0.35, bodyR * 0.1, x, cy, bodyR);
        g2.addColorStop(0, '#b2f2bb');
        g2.addColorStop(0.6, '#51cf66');
        g2.addColorStop(1, '#2b8a3e');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(x, cy, bodyR, 0, 6.283);
        ctx.fill();

        /* khăn quàng bay ngược chiều chạy — chi tiết rẻ tiền nhất mà thêm được
           nhiều cảm giác tốc độ nhất. */
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(x - bodyR * 0.2, cy - bodyR * 0.1);
        ctx.quadraticCurveTo(
            x - bodyR * 1.6, cy - bodyR * (0.5 + 0.25 * Math.sin(G.time * 12)),
            x - bodyR * 2.1, cy + bodyR * (0.1 + 0.2 * Math.sin(G.time * 9)));
        ctx.quadraticCurveTo(x - bodyR * 1.4, cy + bodyR * 0.3, x - bodyR * 0.2, cy + bodyR * 0.32);
        ctx.closePath();
        ctx.fill();

        /* mặt */
        ctx.fillStyle = '#1b2430';
        ctx.beginPath();
        ctx.arc(x + bodyR * 0.02, cy - bodyR * 0.12, bodyR * 0.13, 0, 6.283);
        ctx.arc(x + bodyR * 0.55, cy - bodyR * 0.12, bodyR * 0.13, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = '#1b2430';
        ctx.lineWidth = bodyR * 0.11;
        ctx.beginPath();
        ctx.arc(x + bodyR * 0.28, cy + bodyR * 0.18, bodyR * 0.26, 0.2, Math.PI - 0.2);
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
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = (1 - k) * 0.7;
            ctx.strokeStyle = g.col;
            ctx.lineWidth = Math.max(1, V.u * 0.14 * (1 - k));
            ctx.beginPath();
            ctx.arc(sx(g.x), sy(g.y), (g.r0 * (1 + k * g.grow)) * V.u, 0, 6.283);
            ctx.stroke();
            ctx.restore();
        });
    }

    function drawFlash() {
        const k = (G.time - G.flashAt) / 0.24;
        if (k < 0 || k >= 1) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = (1 - k) * (1 - k) * (G.flashAmt || 0.3);
        ctx.fillStyle = G.flashCol;
        ctx.fillRect(0, 0, V.w, V.h);
        ctx.restore();
    }

    function drawFloats() {
        G.floats.forEach(f => {
            const age = G.time - f.born;
            if (age < 0) return;
            const k = age / 1.1;
            const pop = age < 0.16 ? 0.4 + 1.05 * (age / 0.16)
                : 1.1 - 0.1 * Math.min(1, (age - 0.16) / 0.14);
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - k * k);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(sx(f.x), sy(f.y) - k * V.u * 1.4);
            ctx.scale(pop, pop);
            ctx.font = (f.big ? 800 : 700) + ' ' +
                Math.round(V.u * (f.big ? 0.62 : 0.46)) +
                'px "Baloo 2", Fredoka, system-ui, sans-serif';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = Math.max(2, V.u * 0.08);
            ctx.lineJoin = 'round';
            ctx.strokeText(f.text, 0, 0);
            ctx.fillStyle = f.col || '#ffffff';
            ctx.fillText(f.text, 0, 0);
            ctx.restore();
        });
    }

    /* Vạch tốc độ: chỉ hiện khi đã chạy nhanh hoặc đang bay tên lửa. */
    function drawSpeedLines() {
        const k = G.rocketT > 0 ? 1 : Math.max(0, (G.speed - RUN_MAX * 0.62) / (RUN_MAX * 0.38));
        if (k <= 0.02) return;
        ctx.save();
        ctx.globalAlpha = Math.min(0.34, k * 0.34);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, V.u * 0.05);
        for (let i = 0; i < 9; i++) {
            const yy = ((i * 97 + Math.floor(G.dist * 40) * 13) % 100) / 100 * V.h * 0.8;
            const len = V.u * (1.4 + (i % 3));
            const xx = (V.w + V.u * 4) - ((G.dist * 260 + i * 211) % (V.w + V.u * 6));
            ctx.beginPath();
            ctx.moveTo(xx, yy);
            ctx.lineTo(xx + len, yy);
            ctx.stroke();
        }
        ctx.restore();
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
        hud: el('hud'),
        dist: el('hud-dist'), pals: el('hud-pals'), fruit: el('hud-fruit'),
        score: el('hud-score'), combo: el('hud-combo'), comboWrap: el('combo-wrap'),
        zone: el('hud-zone'),
        powers: el('power-strip'),
        menu: el('menu-overlay'), over: el('over-overlay'),
        overDist: el('over-dist'), overPals: el('over-pals'), overFruit: el('over-fruit'),
        overScore: el('over-score'), overBest: el('over-best'), overNew: el('over-new'),
        overMissions: el('over-missions'),
        menuBest: el('menu-best'), menuPals: el('menu-pals'),
        missions: el('mission-list')
    };

    function show(n) { if (n) n.classList.remove('hidden'); }
    function hide(n) { if (n) n.classList.add('hidden'); }

    function updateHud() {
        if (!ui.dist) return;
        ui.dist.textContent = G.metres;
        ui.pals.textContent = G.tail.length;
        ui.fruit.textContent = G.fruit;
        ui.score.textContent = G.score;
        ui.zone.textContent = zone().name;

        if (G.combo >= 3) {
            ui.comboWrap.classList.remove('hidden');
            ui.combo.textContent = 'x' + G.combo;
        } else {
            ui.comboWrap.classList.add('hidden');
        }

        /* Dãy biểu tượng vật phẩm đang chạy: mỗi thứ một viên, hết thì biến. */
        let html = '';
        if (G.shield > 0) html += '<span class="pw pw-shield"><i class="fa-solid fa-shield-halved"></i></span>';
        if (G.magnetT > 0) html += '<span class="pw pw-magnet"><i class="fa-solid fa-magnet"></i>' +
            '<b>' + Math.ceil(G.magnetT) + '</b></span>';
        if (G.rocketT > 0) html += '<span class="pw pw-rocket"><i class="fa-solid fa-rocket"></i>' +
            '<b>' + Math.ceil(G.rocketT) + '</b></span>';
        if (ui.powers.innerHTML !== html) ui.powers.innerHTML = html;

        paintMissions(ui.missions);
    }

    function paintMissions(node) {
        if (!node) return;
        const html = G.missions.map(m =>
            '<li class="' + (m.done ? 'done' : '') + '">' +
            '<i class="fa-solid ' + (m.done ? 'fa-circle-check' : 'fa-circle') + '"></i>' +
            '<span>' + m.text + '</span>' +
            '<b>' + Math.min(m.have, m.need) + '/' + m.need + '</b></li>').join('');
        if (node.innerHTML !== html) node.innerHTML = html;
    }

    function showMenu() {
        G.mode = 'menu';
        hide(ui.hud);
        hide(ui.over);
        show(ui.menu);
        ui.menuBest.textContent = store.data.best;
        ui.menuPals.textContent = store.data.bestPals;
    }

    function showOver(newBest) {
        ui.overDist.textContent = G.metres;
        ui.overPals.textContent = G.pals;
        ui.overFruit.textContent = G.fruit;
        ui.overScore.textContent = G.score;
        ui.overBest.textContent = store.data.best;
        ui.overNew.hidden = !newBest;
        paintMissions(ui.overMissions);
        show(ui.over);
    }

    function play() {
        sfx.wake();
        hide(ui.menu);
        hide(ui.over);
        show(ui.hud);
        startRun();
    }

    /* ---- điều khiển ----
     * Một ngón là đủ: chạm nửa trên nhảy, chạm nửa dưới trượt. Bàn phím có
     * thêm mũi tên cho ai chơi trên máy tính. */
    function wireInput() {
        const host = canvas.parentElement;

        host.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            sfx.wake();
            if (G.mode !== 'play') return;
            const r = canvas.getBoundingClientRect();
            const rel = (ev.clientY - r.top) / r.height;
            if (rel > 0.66) slide(); else jump();
        });
        host.addEventListener('pointerup', ev => { ev.preventDefault(); releaseJump(); });
        host.addEventListener('pointercancel', releaseJump);
        host.addEventListener('contextmenu', ev => ev.preventDefault());

        window.addEventListener('keydown', ev => {
            if (ev.repeat) return;
            const k = ev.key;
            if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
                ev.preventDefault();
                if (G.mode === 'play') jump();
                else if (G.mode === 'menu') play();
                else if (G.mode === 'over') play();
            }
            if (k === 'ArrowDown' || k === 's' || k === 'S') {
                ev.preventDefault();
                slide();
            }
        });
        window.addEventListener('keyup', ev => {
            if (ev.key === ' ' || ev.key === 'ArrowUp' || ev.key === 'w' || ev.key === 'W') {
                releaseJump();
            }
        });
    }

    function wireButtons() {
        el('btn-play').addEventListener('click', play);
        el('btn-again').addEventListener('click', play);
        el('btn-over-menu').addEventListener('click', showMenu);
        el('btn-nav-restart').addEventListener('click', play);

        const resetBtn = el('btn-reset-progress');
        if (resetBtn) resetBtn.addEventListener('click', () => {
            store.reset();
            ui.menuBest.textContent = 0;
            ui.menuPals.textContent = 0;
        });

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
    let hudTick = 0;

    function frame(now) {
        const t = now / 1000;
        let dt = last ? t - last : 0;
        last = t;
        if (dt > 0.05) dt = 0.05;      // tab ẩn quay lại: đừng nhảy cóc
        G.time += dt;

        if (G.mode === 'play') {
            stepPlayer(dt);
            stepItems(dt);
            buildAhead();
            cullBehind();
            /* HUD là DOM, cập nhật mỗi khung hình thì trình duyệt phải tính lại
             * bố cục 60 lần một giây cho vài con số — mười lần là thừa đủ. */
            hudTick += dt;
            if (hudTick > 0.1) { hudTick = 0; updateHud(); }
        }
        stepFx(dt);
        draw();
        requestAnimationFrame(frame);
    }

    function init() {
        store.load();
        sfx.init();
        seedDeco();
        resize();
        startRun();
        showMenu();

        wireInput();
        wireButtons();

        window.addEventListener('resize', resize);
        if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
        window.addEventListener('orientationchange', () => setTimeout(resize, 200));

        /* Cửa sau để thử: gọi thẳng từ console hoặc từ script kiểm thử. */
        window.rescueRun = {
            G, V, ZONES, CHUNKS, store,
            play, jump, slide, releaseJump,
            state: () => ({
                mode: G.mode, m: G.metres, pals: G.tail.length, rescued: G.pals,
                fruit: G.fruit, score: G.score, combo: G.combo, speed: +G.speed.toFixed(2),
                zone: zone().key, shield: G.shield
            })
        };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
