/**
 * Melon Drop — KIBU Games
 * ----------------------------------------------------------------------------
 * Thả trái cây vào thùng. Hai quả GIỐNG NHAU chạm nhau thì nhập lại thành một
 * quả to hơn một bậc. Cứ thế leo từ quả anh đào bé xíu lên tới quả dưa hấu.
 * Thùng đầy tràn khỏi vạch đỏ là hết lượt.
 *
 * VÌ SAO CHỌN LỐI CHƠI NÀY
 * Luật giải thích xong trong năm giây, không cần biết chữ: quả giống nhau
 * chạm nhau thì to lên. Bé bốn tuổi ngồi xuống là chơi được ngay, mà người
 * lớn vẫn ngồi lì được vì mỗi lần thả là một lần tính chỗ. Đây cũng là thể
 * loại nhẹ đồ hoạ nhất trong các game đang được chuộng — cả sân chỉ gồm mấy
 * hình tròn tô màu, không phải vẽ một tấm ảnh nào.
 *
 * VÌ SAO TỰ VIẾT PHẦN VẬT LÝ
 * Giống Bounce Hoops: cả game chỉ có đúng một thứ vật lý là chồng hình tròn
 * đè lên nhau, tự viết thì gọn hơn nhiều so với kéo về một thư viện nặng vài
 * trăm ki-lô-bai rồi chỉ dùng một phần trăm của nó. Quan trọng hơn: đống trái
 * cây phải nằm YÊN khi bé không đụng vào. Thư viện tổng quát hay để đống hình
 * rung lăn tăn mãi không dứt, mà rung thì hai quả cạnh nhau tự dưng nhập vào
 * lúc bé không ngờ — hỏng cả cái tính toán của bé. Tự viết thì em chỉnh được
 * đúng chỗ cần: nhiều vòng lặp đẩy nhau, độ nảy gần bằng không, và một ngưỡng
 * ngủ để đống quả đứng im hẳn.
 *
 * Cả sân vẽ bằng canvas 2D, không thư viện ngoài. Chữ để bên HTML cho /i18n.js
 * lo phần dịch, nên trong này gần như không vẽ chữ.
 *
 * Bố cục file:
 *   1. Cấu hình      2. Trái cây     3. Tiến trình   4. Âm thanh
 *   5. Thùng         6. Vật lý       7. Trạng thái   8. Hình học
 *   9. Điều khiển   10. Hiệu ứng    11. Vẽ          12. Giao diện   13. Vòng lặp
 */
(function () {
    'use strict';

    /* ========================================================================
     *  1. CẤU HÌNH
     * ------------------------------------------------------------------------
     *  Mọi kích thước tính bằng "ô" trong lòng thùng, không tính bằng điểm ảnh.
     *  Thùng lúc nào cũng rộng đúng 7 ô và cao 10,2 ô, máy to máy nhỏ đều vậy —
     *  nhờ thế một đống trái cây xếp được trên điện thoại thì cũng xếp được y
     *  hệt trên máy tính, bé không phải học lại tay.
     * ======================================================================*/

    const BW = 7.6;             // bề ngang lòng thùng
    const BH = 10.8;            // chiều cao lòng thùng
    const DANGER_Y = 2.0;       // vạch đỏ: quả nằm cao hơn vạch này là bắt đầu nguy
    const HOLD_Y = 1.0;         // quả đang cầm lơ lửng ở độ cao này

    const GRAV = 26;            // trọng lực, ô/giây²
    const STEP = 1 / 120;       // bước tính vật lý, cố định để máy nào cũng ra một kết quả
    const ITER = 7;             // số vòng gỡ chồng lấn mỗi bước

    /* Ba con số quyết định đống quả nằm yên hay rung mãi.
     *   REST  độ nảy. Để 0,05 tức là gần như không nảy — trái cây chín rơi
     *         xuống thì lún chứ không tưng như quả bóng cao su. Và chỉ cú va
     *         nào nhanh hơn BOUNCE_V mới được nảy: tiếp xúc nằm nghỉ mà cũng
     *         nảy thì cả đống rung li ti không bao giờ dứt.
     *   BAUM  chỗ lún vào nhau được gỡ ra bao nhiêu phần trong một bước, dưới
     *         dạng vận tốc tách. Để 0,25 thì đè lún lúc cân bằng chỉ khoảng
     *         0,007 ô — mắt không nhìn ra. Cao hơn thì đống quả nảy tưng.
     *   SLOP  chồng lấn nhỏ hơn ngần này thì kệ. Không có nó thì đống quả cứ
     *         nhích qua nhích lại quanh con số 0 tuyệt đối, không bao giờ ngủ.
     */
    const REST = 0.05;
    const BOUNCE_V = 1.0;       // chậm hơn ngần này thì coi như đặt xuống, không nảy
    const BAUM = 0.25;
    const MAX_BIAS = 3;         // vận tốc tách ra tối đa, kẻo lún sâu thì bắn vọt
    /* Mười vòng gỡ lún nghe nhiều, nhưng đây là chỗ quyết định đống quả có
     * chịu đứng im hay không, và máy dò thông số nói rõ: để 3 vòng thì 44/124
     * quả vẫn trôi sau ba giây, để 10 vòng thì chỉ còn 6/132 và quả trôi xa
     * nhất chỉ 0,09 ô — mắt không thấy được. Đắt hơn chừng 40% thời gian tính,
     * mà cả thùng cũng chỉ hơn hai chục quả nên vẫn nhanh gấp hàng chục lần
     * mức cần thiết. */
    const PITER = 10;           // số vòng gỡ lún
    const BIAS = 0.65;          // chỉ còn dùng cho phép kéo cứng ở clampWalls
    const SLOP = 0.004;

    /* Hệ số ma sát. Đây là thứ giữ cho đống quả đứng yên thay vì bò lổm ngổm:
     * quả nằm nghiêng trên mặt cong của quả dưới chỉ trượt xuống khi độ dốc
     * chỗ tiếp xúc vượt quá MU (tức khoảng 19°). Dốc hơn thì vẫn lăn như
     * thường, nên đống quả vẫn tự tìm chỗ trũng mà lấp — chỉ là lấp xong thì
     * đứng hẳn. */
    const MU = 0.6;            // quả với quả
    const MU_W = 0.7;           // quả với sàn và vách

    /* Ngủ: quả nào đứng gần như một chỗ suốt SLEEP_T giây thì cho đứng hẳn.
     * Không có bước này thì cả đống rung li ti mãi, mà rung là hai quả cạnh
     * nhau chạm vào nhau lúc bé không ngờ rồi tự nhập — mất luôn cái thú "mình
     * tính chỗ".
     *
     * Đo bằng QUÃNG ĐƯỜNG ĐI ĐƯỢC chứ không đo bằng vận tốc, và đây là chỗ máy
     * soát dạy cho: quả nằm im dưới đáy thùng vẫn có vận tốc 0,2 ô/giây suốt
     * ngày, vì mỗi bước trọng lực lại cộng thêm g×dt rồi sàn lại chặn lại. Lấy
     * vận tốc làm mốc thì không quả nào ngủ nổi — đo lần đầu ra đúng 0% số quả
     * chịu ngủ. Quãng đường thì thật thà: nằm im là bằng không. */
    /* Ngưỡng này phải CHẶT. Hồi đầu em để 0,012 ô mỗi bước, nghe thì bé tí,
     * nhưng một bước là 1/120 giây — hoá ra cho phép quả bò 1,4 ô mỗi giây mà
     * vẫn được tính là "đứng yên". Đống quả ngủ say trong khi thật ra nó đang
     * trôi cả ô trong ba giây, mắt nhìn thấy rõ mà máy soát vẫn khen đạt. Từ
     * lúc phần gỡ lún chuyển sang sổ vận tốc giả thì đống quả nghỉ thật sự
     * đứng im tuyệt đối (đo được đúng 0,00000), nên xiết hẳn xuống được. */
    /* Sức cản lúc đi chậm — xem ghi chú ở movePositions() */
    const CREEP_V = 1.2;        // chậm hơn ngần này ô/giây thì bắt đầu hãm
    const CREEP_DAMP = 0.86;    // mỗi bước giữ lại bấy nhiêu phần
    const STOP_V = 0.08;        // chậm hơn nữa thì dừng hẳn cho xong
    const SPIN_FOLLOW = 0.12;   // vòng quay đuổi theo chuyển động nhanh chậm cỡ nào
    const SPIN_MIN = 0.06;      // chậm hơn ngần này rad/giây thì thôi quay hẳn

    const SLEEP_D = 0.004;      // nhúc nhích chưa tới ngần này ô mỗi bước thì coi như đứng yên
    const SLEEP_T = 0.22;

    /* Đánh thức quả đang ngủ thì phải có cú chạm ra hồn. Mỗi bước trọng lực
     * cộng thêm 0,22 ô/giây vào quả nằm trên, nên hai quả chồng nhau lúc nào
     * cũng "đang lao vào nhau" với chừng ấy vận tốc — lấy mốc thấp hơn thì cả
     * đống đánh thức nhau mỗi khung hình và không quả nào ngủ được phút nào.
     * Đây là lỗi máy soát bắt được ở lần chạy thứ hai. */
    const WAKE_V = 0.5;

    /* Hai quả cách nhau chưa tới ngần này ô thì coi là đang chạm — dùng chung
     * cho cả việc nhập quả lẫn việc gộp đám lúc xét ngủ, để hai chỗ ấy không
     * bao giờ hiểu khác nhau về chữ "chạm". */
    const TOUCH = 0.02;

    /* Riêng lúc gộp đám để xét ngủ thì nới rộng hơn. Đống quả nằm nghỉ không
     * còn lún vào nhau nữa (nhờ thứ tự tính đã sửa), nên hai quả kề nhau có
     * thể hở một khe mảnh mà vẫn đang tựa vào nhau thật; lấy đúng 0,02 thì máy
     * tưởng chúng rời nhau, mỗi quả một đám, đám nào cũng "không chạm sàn" và
     * chẳng quả nào ngủ được. */
    const ISLAND_GAP = 0.08;

    const DROP_CD = 0.42;       // thả xong phải chờ ngần này giây mới thả quả kế
    const TOPOUT_T = 2.0;       // quả nằm trên vạch đỏ lâu ngần này giây thì hết lượt
    const SETTLE_V = 1.7;       // quả đi chậm hơn ngần này mới bị vạch đỏ tính
    const SPAWN_VY = 0.6;       // vận tốc ban đầu lúc buông tay

    const STORE_KEY = 'kibu_melon_drop_best';
    const SOUND_KEY = 'kibu_melon_drop_sound';

    /* ========================================================================
     *  2. TRÁI CÂY
     * ------------------------------------------------------------------------
     *  Mười bậc, mỗi bậc to hơn bậc trước chừng 1,2 lần. Chọn tỉ lệ này vì hai
     *  lẽ: nhìn là biết ngay hai quả có cùng bậc hay không (chênh 20% mắt bắt
     *  được), và hai quả dưa hấu — bán kính 1,58 — xếp cạnh nhau chiếm 6,3 ô,
     *  vẫn lọt trong lòng thùng rộng 7,6 ô, tức là cú nhập cuối cùng có chỗ mà
     *  diễn ra.
     *
     *  VÌ SAO MƯỜI BẬC CHỨ KHÔNG PHẢI MƯỜI MỘT
     *  Bản đầu em xếp mười một bậc (có thêm quả lê) cho giống mấy game cùng
     *  loại. Máy soát chơi hộ mười bốn ván, ván nào cũng thả hai trăm bảy chục
     *  lượt mới đầy thùng, mà TUYỆT NHIÊN không ván nào ra nổi quả dưa hấu —
     *  cả mười bốn ván cộng lại mới có năm quả dưa lưới, trong khi phải có hai
     *  quả dưa lưới NẰM CẠNH NHAU mới thành dưa hấu. Tính ra mỗi lượt thả đáng
     *  4,3 "quả anh đào", mà quả dưa hấu ở bậc 10 thì đáng 1024 — cần 236 lượt
     *  thả liên tục không hỏng, dài hơn cả một ván. Cái đích đặt ra cho bé mà
     *  chính máy còn không với tới thì không phải cái đích, chỉ là câu quảng
     *  cáo. Bỏ một bậc đi thì còn 512, tức chừng 118 lượt — vừa tầm một ván
     *  chơi ngon lành.
     *
     *  emoji dùng cho thanh thông tin và cái thang trong bảng chào, đỡ phải vẽ.
     *  born là điểm được cộng lúc quả này RA ĐỜI, nên quả anh đào không có
     *  điểm (nó chỉ được thả xuống chứ không do nhập mà thành).
     * ======================================================================*/

    const FRUITS = [
        { name: 'Cherry', emoji: '🍒', r: 0.30, born: 0, c: '#ef4056', c2: '#b41f33', face: '#7a1020' },
        { name: 'Strawberry', emoji: '🍓', r: 0.37, born: 3, c: '#ff5f6d', c2: '#c62839', face: '#7a1020' },
        { name: 'Grape', emoji: '🍇', r: 0.45, born: 6, c: '#a06bef', c2: '#6d38b8', face: '#3b1a63' },
        { name: 'Orange', emoji: '🍊', r: 0.54, born: 10, c: '#ff9d2e', c2: '#dd6f00', face: '#7a3b00' },
        { name: 'Lemon', emoji: '🍋', r: 0.65, born: 15, c: '#ffdd45', c2: '#e0ab00', face: '#7a5a00' },
        { name: 'Apple', emoji: '🍎', r: 0.78, born: 21, c: '#f0384b', c2: '#b3172a', face: '#6d0f1c' },
        { name: 'Peach', emoji: '🍑', r: 0.94, born: 28, c: '#ffb0a0', c2: '#ef7c6a', face: '#8a3a2c' },
        { name: 'Pineapple', emoji: '🍍', r: 1.13, born: 36, c: '#f5c443', c2: '#c68f16', face: '#6b4a06' },
        { name: 'Melon', emoji: '🍈', r: 1.34, born: 45, c: '#9fdc6d', c2: '#68a840', face: '#33571f' },
        { name: 'Watermelon', emoji: '🍉', r: 1.58, born: 55, c: '#49b45c', c2: '#2b7a3a', face: '#14401d' }
    ];

    const TOP_TIER = FRUITS.length - 1;
    const MELON_POP = 120;      // thưởng cho lần hai quả dưa hấu nhập vào nhau rồi nổ

    /* Chỉ năm bậc đầu được thả xuống. Quả càng to càng hiếm — thả toàn quả to
     * thì thùng đầy trong mười giây, mà thả toàn quả bé thì chẳng bao giờ leo
     * lên nổi bậc cao. */
    const DROP_W = [30, 26, 20, 14, 10];

    function pickTier(rnd) {
        let sum = 0;
        for (const w of DROP_W) sum += w;
        let k = (rnd || Math.random)() * sum;
        for (let i = 0; i < DROP_W.length; i++) {
            k -= DROP_W[i];
            if (k <= 0) return i;
        }
        return 0;
    }

    /* ========================================================================
     *  3. TIẾN TRÌNH
     * ------------------------------------------------------------------------
     *  Chỉ nhớ đúng hai thứ: điểm cao nhất và quả to nhất từng làm ra. Game này
     *  không có màn để mở khoá, nên chẳng có gì khác đáng nhớ.
     * ======================================================================*/

    const store = {
        data: { best: 0, bestTier: 0 },

        load() {
            try {
                const raw = localStorage.getItem(STORE_KEY);
                if (raw) Object.assign(this.data, JSON.parse(raw));
            } catch (e) { /* chế độ riêng tư: chơi được nhưng không nhớ */ }
        },
        save() {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        record(score, tier) {
            let fresh = false;
            if (score > (this.data.best || 0)) { this.data.best = score; fresh = true; }
            if (tier > (this.data.bestTier || 0)) this.data.bestTier = tier;
            this.save();
            return fresh;
        },
        reset() { this.data = { best: 0, bestTier: 0 }; this.save(); }
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
            const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 900;
            const g = ac.createGain(); g.gain.value = vol == null ? 0.1 : vol;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },

        drop() { this.tone(240, 0.07, 'triangle', 0.06, 150); },
        /* Tiếng quả chạm quả nhỏ dần theo lực chạm, đặt nhẹ thì gần như không
         * kêu. Một tiếng "cộp" như nhau cho mọi lần chạm thì tai chán rất nhanh
         * mà đống quả lúc nào cũng có cái gì đó khẽ động. */
        bump(v, r) {
            const k = Math.min(1, v / 9);
            if (k < 0.12) return;
            this.tone(150 + (1 - r) * 260, 0.05 + k * 0.04, 'sine', 0.03 + k * 0.05, 80);
        },
        /* Nhập quả: bậc càng cao tiếng càng trầm và càng đầy, để tai bé cũng
         * biết vừa làm ra thứ gì to. */
        merge(tier) {
            const f = 880 - tier * 62;
            this.tone(f, 0.11, 'triangle', 0.1, f * 1.6);
            this.tone(f * 2, 0.07, 'sine', 0.05, f * 3);
        },
        big() {
            [523, 659, 784, 1046].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.2, 'triangle', 0.12), i * 80));
        },
        melon() {
            [392, 523, 659, 784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.26, 'triangle', 0.14), i * 95));
        },
        warn() { this.tone(300, 0.13, 'square', 0.05, 220); },
        over() {
            this.noise(0.2, 0.07, 260);
            [440, 349, 262].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.09), i * 150));
        }
    };

    /* ========================================================================
     *  5. THÙNG
     * ------------------------------------------------------------------------
     *  Mỗi bé một thùng, và thùng là một thế giới khép kín: có đống quả riêng,
     *  điểm riêng, đồng hồ nguy hiểm riêng. Nhờ vậy chế độ hai bé chỉ là "chạy
     *  hai thùng cạnh nhau" chứ không phải viết lại cái gì — phần vật lý không
     *  hề biết là đang có mấy bé chơi.
     * ======================================================================*/

    let seq = 1;

    function makeBox(kid) {
        return {
            kid: kid,                 // 1 hoặc 2, dùng cho nhãn và màu
            fruits: [],
            contacts: new Map(),      // xung lực của bước trước, giữ lại để khởi động ấm
            score: 0,
            bestTier: 0,
            held: pickTier(),         // quả đang cầm trên tay
            next: pickTier(),         // quả kế tiếp, cho bé nhìn trước mà tính
            aimX: BW / 2,
            dropCd: 0,
            dangerT: 0,               // đã ở trên vạch đỏ bao lâu
            warnAt: -9,               // lần cuối kêu tiếng cảnh báo
            over: false,
            won: false,               // đã làm ra quả dưa hấu (chế độ hai bé)
            parts: [],                // mảnh vụn lúc nhập quả
            rings: [],
            pops: [],                 // số điểm bay lên
            shakeUntil: 0,
            shakeMag: 0,
            time: 0
        };
    }

    function addFruit(box, tier, x, y, vx, vy) {
        const f = {
            id: seq++, tier: tier, r: FRUITS[tier].r,
            x: x, y: y, vx: vx || 0, vy: vy || 0,
            rot: (Math.random() - 0.5) * 0.6, spin: 0,
            px: 0, py: 0,                  // sổ vận tốc giả, chỉ dùng để gỡ chỗ lún
            jnF: 0, jtF: 0, jnW: 0, jtW: 0,  // xung lực đã dùng với sàn và vách, giữ sang bước sau
            vx0: 0, vy0: 0,                // vận tốc lúc đầu bước, để tính phần nảy
            stepX: x, stepY: y,            // chỗ đứng lúc đầu bước, để tính vòng quay
            roll: 0,                       // quãng đường lăn trung bình mấy bước gần đây
            age: 0, still: 0, sleeping: false,
            lastX: x, lastY: y,            // chỗ đứng lần soát ngủ trước

            born: box.time                 // để phóng to rồi co lại lúc mới ra đời
        };
        box.fruits.push(f);
        if (tier > box.bestTier) box.bestTier = tier;
        return f;
    }

    /* ========================================================================
     *  6. VẬT LÝ
     * ------------------------------------------------------------------------
     *  Vòng đời một bước: rơi tự do → gỡ chồng lấn nhiều vòng → nhập quả.
     *
     *  Gỡ chồng lấn bằng cách chạy đi chạy lại ITER lần trên danh sách cặp quả
     *  đang chạm nhau, mỗi lần đẩy nhau ra một phần. Cách này (sequential
     *  impulse) là cách các thư viện vật lý 2D vẫn dùng; điểm hay của nó với
     *  game này là quả to đè quả bé thì quả bé lún xuống chứ không bị bắn ra —
     *  vì lực đẩy chia theo KHỐI LƯỢNG, mà khối lượng em tính theo diện tích
     *  (r²) đúng như quả thật: quả dưa nặng hơn quả anh đào ba mươi lần.
     * ======================================================================*/

    function invMass(f) { return 1 / (f.r * f.r); }

    /* Đánh thức quả đang ngủ. Bất cứ thứ gì chạm vào nó đều phải gọi hàm này,
     * không thì quả ngủ biến thành bức tường bất động giữa thùng.
     *
     * Chỉ mở mắt nó ra thôi, KHÔNG xoá đồng hồ đứng-yên. Đồng hồ ấy đo bằng
     * quãng đường đi được, và đó mới là sự thật: đống quả nằm nghỉ vẫn còn
     * chút vận tốc lắc lư trong người (chừng 0,3–0,8 ô/giây) mà vị trí không
     * hề nhúc nhích. Hồi trước hàm này xoá đồng hồ, thế là mấy quả ấy cứ đánh
     * thức lẫn nhau vòng quanh, không quả nào tích nổi ba phần mười giây đứng
     * yên, và cả thùng không bao giờ ngủ được — đo ra đúng 0%. Quả nào bị đẩy
     * đi thật thì quãng đường tự nó lớn lên, đồng hồ tự đếm lại từ đầu, không
     * cần ai xoá hộ. */
    function wake(f) { f.sleeping = false; }

    /* Trọng lực cộng vào vận tốc. Tách hẳn khỏi bước dời vị trí, vì thứ tự
     * giữa hai việc này quyết định đống quả có đứng im được hay không — xem
     * ghi chú dài ở stepBox(). */
    function applyGravity(box, dt) {
        for (const f of box.fruits) {
            f.age += dt;
            if (f.sleeping) continue;
            f.vy += GRAV * dt;
        }
    }

    function movePositions(box, dt) {
        for (const f of box.fruits) {
            if (f.sleeping) continue;
            /* Sức cản của chỗ nằm: quả đi CHẬM thì hãm dần cho dừng hẳn.
             *
             * Hình tròn tuyệt đối nhẵn thì trên lý thuyết lăn mãi không dừng —
             * ma sát trượt không cản được chuyện lăn. Quả thật thì mềm, hơi
             * bẹp chỗ tiếp xúc, nên lăn một lúc là hết đà. Không có vế này thì
             * cứ năm đống quả lại có một đống lăn tăn hoài không chịu đứng,
             * máy soát đo được 50 lần trong 266 lần ngồi soi.
             *
             * Chỉ hãm phần đi chậm hơn CREEP_V. Quả đang rơi hay đang lăn thật
             * thì không đụng tới, nên bé vẫn thấy trái cây lăn tự nhiên. */
            const sp = Math.hypot(f.vx, f.vy);
            if (sp < CREEP_V) {
                if (sp < STOP_V) { f.vx = 0; f.vy = 0; }
                else { f.vx *= CREEP_DAMP; f.vy *= CREEP_DAMP; }
            }
            f.x += f.vx * dt;
            f.y += f.vy * dt;
        }
    }

    /* VÒNG QUAY bám theo QUÃNG ĐƯỜNG THẬT quả đi được, tính đúng một lần ở
     * cuối mỗi bước.
     *
     * Anh Hiếu để ý: thùng càng nhiều quả thì càng có nhiều quả quay tít mà
     * không bao giờ dừng. Đúng, và có hai lỗi chồng lên nhau.
     *
     * Lỗi thứ nhất: em cộng vòng quay ngay trong vòng lặp giải va chạm, mà
     * vòng ấy chạy bảy lần mỗi bước, một trăm hai mươi bước mỗi giây. Mỗi lần
     * chỉ cộng một tí xíu, nhưng 840 lần một giây thì quả đứng im vẫn quay tới
     * năm vòng mỗi giây.
     *
     * Lỗi thứ hai: em lấy VẬN TỐC làm mốc. Đống quả nằm nghỉ vẫn còn chút vận
     * tốc lăn tăn trong người mà vị trí không hề xê dịch — lấy nó tính vòng
     * quay thì quả vẫn quay chậm chậm mãi.
     *
     * Nay lấy đúng quãng đường quả thật sự đi được trong bước: đi bao nhiêu
     * thì lăn bấy nhiêu, đúng như bánh xe lăn không trượt. Quả đứng yên thì
     * quãng đường bằng không, vòng quay tắt hẳn. Không có đường nào để cộng
     * dồn, cũng không cần ngưỡng nào để chặn. */
    function updateSpin(box, dt) {
        for (const f of box.fruits) {
            if (f.sleeping) { f.spin = 0; f.roll = 0; continue; }
            /* Lấy quãng đường TRUNG BÌNH mấy bước gần đây chứ không lấy đúng
             * bước vừa rồi. Phần gỡ lún mỗi bước lại đẩy quả qua rồi đẩy lại,
             * cộng vào nhau thì bằng không mà từng bước thì lắc qua lắc lại —
             * lấy nguyên một bước thì cái lắc ấy hoá thành vòng quay. Trung
             * bình trượt làm cái lắc tự triệt tiêu, còn chuyện lăn thật thì
             * cùng chiều nên vẫn giữ nguyên. */
            f.roll = f.roll * 0.9 + (f.x - f.stepX) * 0.1;
            const want = (f.roll / dt) / f.r;
            f.spin += (want - f.spin) * SPIN_FOLLOW;
            if (Math.abs(f.spin) < SPIN_MIN) f.spin = 0;
            f.rot += f.spin * dt;
        }
    }

    /* Danh sách cặp có thể chạm nhau, dựng MỘT lần cho cả bước rồi dùng lại cho
     * cả ITER vòng. Nới thêm 0,25 ô để cặp nào sắp chạm cũng nằm sẵn trong danh
     * sách, khỏi phải quét lại giữa chừng. Số quả trong thùng hiếm khi quá 40
     * nên quét đôi một là đủ nhanh, không cần chia lưới. */
    function pairsOf(box) {
        const a = box.fruits, out = [];
        for (let i = 0; i < a.length; i++) {
            for (let j = i + 1; j < a.length; j++) {
                const p = a[i], q = a[j];
                const dx = q.x - p.x, dy = q.y - p.y;
                const rr = p.r + q.r + 0.25;
                if (dx * dx + dy * dy < rr * rr) {
                    /* Mang xung lực của bước trước sang, xem ghi chú ở
                     * warmStart(). Khoá là cặp mã số hai quả. */
                    const key = p.id < q.id ? p.id + ':' + q.id : q.id + ':' + p.id;
                    const old = box.contacts.get(key);
                    out.push({ p: p, q: q, key: key, jn: old ? old.jn : 0, jt: old ? old.jt : 0 });
                }
            }
        }
        return out;
    }

    /* KHỞI ĐỘNG ẤM (warm starting) — áp lại xung lực của bước trước trước khi
     * giải bước này.
     *
     * Anh Hiếu để ý: thùng càng nhiều quả thì càng có nhiều quả quay tít không
     * bao giờ dừng, mà theo lẽ thường thì lấp đầy chỗ trũng xong là phải đứng
     * hết. Anh nói đúng, và đây là chỗ thiếu.
     *
     * Quả nằm im dưới đáy vẫn phải được đỡ bằng một lực đúng bằng trọng lực đè
     * lên nó. Mỗi bước em bắt máy tìm lại cái lực ấy TỪ ĐẦU, mà bảy vòng lặp
     * thì chưa đủ để lực truyền hết xuống đáy một chồng quả — nên bao giờ cũng
     * còn sót lại một chút vận tốc chưa bị triệt tiêu. Vị trí thì gần như
     * không xê dịch (chưa tới 0,04 ô mỗi giây), nhưng chút vận tốc trượt ấy
     * lại chính là thứ em đem ra tính vòng quay của quả — thành ra cả đống
     * đứng im mà vẫn quay tít. Đống càng cao, lực phải truyền càng xa, sót
     * càng nhiều: đúng như anh thấy.
     *
     * Cách chữa là cách mọi thư viện vật lý dùng: nhớ lấy lực đỡ của bước
     * trước rồi áp lại ngay đầu bước sau. Đống quả nằm yên thì lực đỡ bước này
     * gần y hệt bước trước, nên vừa vào đã gần đúng, mấy vòng lặp còn lại chỉ
     * chỉnh nốt phần lẻ. Vận tốc dư biến mất, và quả thôi quay. */
    function warmStart(box, pairs) {
        for (const pr of pairs) {
            const p = pr.p, q = pr.q;
            const dx = q.x - p.x, dy = q.y - p.y;
            const d = Math.hypot(dx, dy);
            /* Rời nhau ra rồi thì bỏ sổ cũ đi — áp lực đỡ của một chỗ chạm
             * không còn tồn tại là bịa. */
            if (d < 1e-6 || d > p.r + q.r + SLOP) { pr.jn = 0; pr.jt = 0; pr.vn0 = 0; continue; }
            const nx = dx / d, ny = dy / d, tx = -ny, ty = nx;
            /* Tốc độ lao vào lúc ĐẦU bước, ghi lại trước khi động vào vận tốc —
             * phần nảy phải tính theo cú va thật, không tính theo vận tốc đã
             * bị chính mình sửa. */
            pr.vn0 = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;

            if (!pr.jn && !pr.jt) continue;
            const ip = invMass(p), iq = invMass(q);
            const ix = nx * pr.jn + tx * pr.jt, iy = ny * pr.jn + ty * pr.jt;
            p.vx -= ix * ip; p.vy -= iy * ip;
            q.vx += ix * iq; q.vy += iy * iq;
        }
        /* Tường và sàn cũng vậy */
        for (const f of box.fruits) {
            f.vy0 = f.vy; f.vx0 = f.vx;
            if (f.y + f.r > BH - SLOP) { f.vy -= f.jnF; f.vx -= f.jtF; }
            else { f.jnF = 0; f.jtF = 0; }
            if (f.x - f.r < SLOP) { f.vx += f.jnW; f.vy -= f.jtW; }
            else if (f.x + f.r > BW - SLOP) { f.vx -= f.jnW; f.vy -= f.jtW; }
            else { f.jnW = 0; f.jtW = 0; }
        }
    }

    function saveContacts(box, pairs) {
        box.contacts.clear();
        for (const pr of pairs) {
            if (pr.jn > 0 || pr.jt) box.contacts.set(pr.key, { jn: pr.jn, jt: pr.jt });
        }
    }

    function solvePair(pr, dt, onBump) {
        const p = pr.p, q = pr.q;
        let dx = q.x - p.x, dy = q.y - p.y;
        let d = Math.hypot(dx, dy);
        /* Hai quả trùng khít tâm (hiếm, nhưng xảy ra khi ba quả nhập liên
         * hoàn): tự chọn một hướng để còn đẩy nhau ra, không thì chia cho 0. */
        if (d < 1e-6) { dx = 0; dy = -1; d = 1e-6; }
        const overlap = p.r + q.r - d;
        if (overlap <= SLOP) return;

        const nx = dx / d, ny = dy / d;
        const ip = invMass(p), iq = invMass(q), im = ip + iq;

        /* 1. Chỗ lún vào nhau không đẩy thẳng bằng cách dời toạ độ, mà biến
         *    thành một VẬN TỐC tách ra rồi giao cho phần vận tốc lo.
         *
         *    Bản đầu em dời toạ độ trực tiếp. Nghe thì hợp lý mà hỏng: dời toạ
         *    độ là bịa ra chuyển động không có vận tốc nào đi kèm, nên ma sát
         *    không tài nào ghì lại được — mỗi bước trọng lực ép đống quả lún
         *    xuống một tí rồi phép dời lại đẩy ra một tí, quả nào nằm nghiêng
         *    thì mỗi lần đẩy lại xê ra một chút. Nhìn màn hình thì thấy đống
         *    quả bò lổm ngổm mãi không đứng, mà máy soát đếm được hơn trăm quả
         *    còn trôi sau ba giây bé không hề đụng vào.
         *
         *    Đưa nó về thành vận tốc thì mọi thứ nằm chung một sổ: ma sát nhìn
         *    thấy, phép soát đứng-yên nhìn thấy, và cái ngưỡng đè lún cân bằng
         *    chỉ còn khoảng 0,007 ô — mắt không thấy được. */
        const rvx = q.vx - p.vx, rvy = q.vy - p.vy;
        const vn = rvx * nx + rvy * ny;

        /* 2. Vận tốc: chặn hai quả lao vào nhau. Chỉ cú va đủ nhanh mới được
         *    nảy, còn tiếp xúc nằm nghỉ thì không — nảy ở đây là nguồn rung
         *    của cả đống. */
        /* Cộng dồn xung lực pháp tuyến của cả bước rồi mới chặn, y như ma sát
         * ở dưới. Điểm mấu chốt là tổng ấy được phép GIẢM: khởi động ấm áp lại
         * lực đỡ của bước trước, mà chỗ tựa vừa mất đi thì lực ấy quá tay —
         * phải trừ bớt lại được. Bản đầu em chỉ cho cộng thêm, thế là mỗi bước
         * lại đẩy quả lên một nhát trong khi trọng lực chỉ kéo xuống một tí:
         * cả thùng trái cây bắn tung lên trời, máy soát đếm 2400 lần quả bay
         * khỏi thùng. */
        const target = (-pr.vn0 > BOUNCE_V) ? -REST * pr.vn0 : 0;
        let accN = pr.jn - (vn - target) / im;
        if (accN < 0) accN = 0;
        const j = accN - pr.jn;
        pr.jn = accN;
        if (j !== 0) {
            p.vx -= nx * j * ip; p.vy -= ny * j * ip;
            q.vx += nx * j * iq; q.vy += ny * j * iq;
        }
        if (onBump && -vn > 0.9) onBump(-vn, Math.min(p.r, q.r));
        if (-vn > WAKE_V) { wake(p); wake(q); }

        /* 3. Ma sát Coulomb: cố hãm hẳn phần trượt dọc mặt tiếp xúc về 0, nhưng
         *    không được hãm mạnh hơn MU lần lực đè lên nhau.
         *
         *    Bản đầu em làm ma sát kiểu "cứ nhân vận tốc trượt với 0,78 cho nó
         *    nhỏ dần", không nhìn tới lực đè. Kiểu ấy không có ma sát TĨNH: quả
         *    nằm trên mặt cong của quả dưới lúc nào cũng trượt xuống một tí,
         *    nên cả đống quả bò lổm ngổm mãi không đứng hẳn — máy soát đếm được
         *    43 quả vẫn trôi sau ba giây bé không đụng vào. Trước đó em che nó
         *    đi bằng cách cho từng quả ngủ, mà chính chỗ ấy đẻ ra lỗi quả treo
         *    lơ lửng. Có ma sát thật thì đống quả tự nó đứng, không cần che. */
        const tx = -ny, ty = nx;
        const vt = rvx * tx + rvy * ty;
        if (pr.jn > 0) {
            /* CỘNG DỒN rồi mới chặn, chứ không chặn từng vòng một.
             *
             * Bản trước em chặn riêng từng vòng: mỗi vòng được phép hãm tới
             * MU×jn, mà một bước chạy bảy vòng, thành ra tổng cộng hãm gấp bảy
             * lần mức vật lý cho phép. Hãm quá tay thì phần trượt bị đẩy ngược
             * lại, vòng sau lại đẩy ngược nữa — mỗi lần một tí, và đống quả
             * bắt đầu tự lắc mạnh dần lên theo cấp số nhân. Máy soát nhìn thấy
             * rõ: quãng đường mỗi nửa giây cứ nhân lên 1,13 lần, 0,02 → 0,14 ô
             * sau tám giây, không bao giờ chịu đứng.
             *
             * Chặn theo TỔNG xung lực đã dùng trong cả bước thì mới đúng luật
             * Coulomb: hãm nhiều lắm cũng chỉ tới mức lực đè cho phép. */
            const cap = MU * pr.jn;
            let acc = pr.jt + (-vt / im);
            if (acc > cap) acc = cap; else if (acc < -cap) acc = -cap;
            const jt = acc - pr.jt;
            pr.jt = acc;
            p.vx -= tx * jt * ip; p.vy -= ty * jt * ip;
            q.vx += tx * jt * iq; q.vy += ty * jt * iq;
        }
    }

    /* Gỡ chỗ lún bằng VẬN TỐC GIẢ (split impulse).
     *
     * Chỗ lún không được đẩy thẳng bằng cách dời toạ độ: dời toạ độ là bịa ra
     * chuyển động mà không có vận tốc nào đi kèm, nên ma sát không ghì lại
     * được, và quả nào nằm nghiêng thì mỗi bước lại bị xê ra một chút — đống
     * quả bò lổm ngổm mãi không đứng. Cũng không được cộng thẳng vào vận tốc
     * thật: làm thế là bơm năng lượng vào đống quả, thử rồi, cả đống bật tung.
     *
     * Cách đúng là mở một sổ vận tốc riêng chỉ để gỡ lún. Gỡ xong thì đem sổ
     * ấy dời vị trí rồi xoá đi, vận tốc thật không hề hay biết. */
    function solvePairPos(pr, dt) {
        const p = pr.p, q = pr.q;
        const dx = q.x - p.x, dy = q.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 1e-6) return;
        const pen = p.r + q.r - d - SLOP;
        if (pen <= 0) return;

        const nx = dx / d, ny = dy / d;
        const ip = invMass(p), iq = invMass(q), im = ip + iq;
        let want = BAUM * pen / dt;
        if (want > MAX_BIAS) want = MAX_BIAS;

        const rel = (q.px - p.px) * nx + (q.py - p.py) * ny;
        const j = (want - rel) / im;
        if (j <= 0) return;
        p.px -= nx * j * ip; p.py -= ny * j * ip;
        q.px += nx * j * iq; q.py += ny * j * iq;
    }

    function solveWallsPos(f, dt) {
        if (f.y + f.r > BH + SLOP) {
            const want = Math.min(MAX_BIAS, BAUM * (f.y + f.r - BH - SLOP) / dt);
            if (-f.py < want) f.py = -want;
        }
        if (f.x - f.r < -SLOP) {
            const want = Math.min(MAX_BIAS, BAUM * (f.r - f.x - SLOP) / dt);
            if (f.px < want) f.px = want;
        } else if (f.x + f.r > BW + SLOP) {
            const want = Math.min(MAX_BIAS, BAUM * (f.x + f.r - BW - SLOP) / dt);
            if (-f.px < want) f.px = -want;
        }
    }

    function solveWalls(f, dt, onBump) {
        /* Sàn */
        if (f.y + f.r > BH) {
            if (f.vy > 1.2 && onBump) onBump(f.vy, f.r);
            if (f.vy > WAKE_V) wake(f);
            const target = (f.vy0 > BOUNCE_V) ? -REST * f.vy0 : 0;
            let accN = f.jnF + (f.vy - target);
            if (accN < 0) accN = 0;
            f.vy -= accN - f.jnF;
            f.jnF = accN;

            /* Ma sát mặt sàn, cùng một luật (và cùng một cách cộng dồn) với
             * ma sát giữa hai quả */
            const cap = MU_W * f.jnF;
            let acc = f.jtF + f.vx;
            if (acc > cap) acc = cap; else if (acc < -cap) acc = -cap;
            f.vx -= acc - f.jtF;
            f.jtF = acc;
        }
        /* Vách trái và vách phải, cùng một luật ma sát với sàn: chỉ giữ được
         * quả theo chiều dọc khi đống quả bên trong ÉP nó vào vách.
         *
         * Chỗ này từng là một lỗi nặng. Bản đầu em viết f.vy *= 0.78 cho quả
         * nào chạm vách — nhìn thì vô hại, nhưng nó chạy bảy vòng mỗi bước, tức
         * là mỗi bước cắt mất 82% vận tốc rơi. Quả nào lỡ chạm vách coi như bị
         * dán vào tường, tụt xuống chậm tới mức máy tưởng nó đứng yên rồi cho
         * ngủ luôn — thành ra quả treo lơ lửng giữa thùng mà anh Hiếu nhìn
         * phát hiện ra. Ma sát phải đi theo lực ép, không được tự tiện hãm. */
        if (f.x - f.r < 0) {
            if (-f.vx > WAKE_V) wake(f);
            const target = (-f.vx0 > BOUNCE_V) ? -REST * f.vx0 : 0;
            let accN = f.jnW - (f.vx - target);
            if (accN < 0) accN = 0;
            f.vx += accN - f.jnW;
            f.jnW = accN;
            wallFriction(f, MU_W * f.jnW);
        } else if (f.x + f.r > BW) {
            if (f.vx > WAKE_V) wake(f);
            const target = (f.vx0 > BOUNCE_V) ? -REST * f.vx0 : 0;
            let accN = f.jnW + (f.vx - target);
            if (accN < 0) accN = 0;
            f.vx -= accN - f.jnW;
            f.jnW = accN;
            wallFriction(f, MU_W * f.jnW);
        }
    }

    /* Hãm phần trượt dọc mặt vách, cộng dồn rồi chặn theo tổng — y như chỗ hai
     * quả đè nhau, và vì cùng một lý do. */
    function wallFriction(f, cap) {
        if (cap <= 0) return;
        let acc = f.jtW + f.vy;
        if (acc > cap) acc = cap; else if (acc < -cap) acc = -cap;
        f.vy -= acc - f.jtW;
        f.jtW = acc;
    }

    /* Vách và sàn là tường thật, không phải gợi ý: sau khi giải xong mọi va
     * chạm, kéo thẳng quả nào còn lún ra ngoài về đúng trong lòng thùng. Không
     * có bước này thì lúc thùng chật, đống quả ép nhau đủ mạnh để đẩy một quả
     * lòi hẳn qua vách — máy soát đếm được hơn hai trăm lần trong tám ván. */
    function clampWalls(f) {
        if (f.x < f.r) { f.x = f.r; if (f.vx < 0) f.vx = 0; }
        else if (f.x > BW - f.r) { f.x = BW - f.r; if (f.vx > 0) f.vx = 0; }
        if (f.y > BH - f.r) { f.y = BH - f.r; if (f.vy > 0) f.vy = 0; }
    }

    /* Cho ngủ những quả đã đứng im. Ngủ rồi thì trọng lực thôi kéo, nên đống
     * quả đứng im tuyệt đối chứ không rung li ti nữa.
     *
     * NGỦ THEO CẢ ĐÁM, KHÔNG NGỦ LẺ TỪNG QUẢ
     * Bản đầu cho từng quả tự ngủ riêng. Chơi thử là thấy ngay: có quả dâu
     * treo lơ lửng giữa lưng chừng thùng, dưới chân trống hoác. Lý do là quả
     * dâu ngủ trên đầu một quả cam, rồi quả cam từ từ lăn đi chỗ khác — lăn
     * chậm nên không có cú chạm nào đủ mạnh để đánh thức quả dâu, mà quả đang
     * ngủ thì trọng lực không kéo nữa. Thế là nó đứng nguyên chỗ cũ, không có
     * gì đỡ. Nhìn là biết sai ngay, mà máy soát lúc ấy lại không bắt được vì
     * nó chỉ đo "có nhúc nhích không", còn quả này thì đứng im thật.
     *
     * Chữa đúng gốc bằng cách gộp những quả đang chạm nhau thành một ĐÁM rồi
     * xét cả đám một lượt, đúng cách các thư viện vật lý thật vẫn làm:
     *   · cả đám cùng đứng im đủ lâu thì mới cho ngủ;
     *   · trong đám phải có ít nhất một quả chạm sàn — cả đám lơ lửng giữa
     *     không trung thì đời nào cho ngủ;
     *   · một quả trong đám động đậy là cả đám tỉnh theo.
     * Nhờ vế thứ ba, quả cam vừa nhúc nhích là quả dâu trên đầu tỉnh ngay và
     * rơi xuống như lẽ thường.
     */
    function sleepIslands(box, dt) {
        const a = box.fruits, n = a.length;
        if (!n) return;

        /* 1. Quả nào đứng yên đủ lâu. Đo cho MỌI quả, kể cả quả đang ngủ: quả
         *    ngủ mà bị đẩy đi thì chính chỗ này phát hiện ra rồi đếm lại từ
         *    đầu, khỏi cần thêm luật đánh thức riêng nào. */
        for (let i = 0; i < n; i++) {
            const f = a[i];
            const moved = Math.hypot(f.x - f.lastX, f.y - f.lastY);
            f.lastX = f.x; f.lastY = f.y;
            f.still = moved < SLEEP_D ? f.still + dt : 0;
        }

        const supported = new Array(n).fill(false);
        for (let i = 0; i < n; i++) {
            const p = a[i];
            if (p.y + p.r > BH - ISLAND_GAP) supported[i] = true;
            for (let j = i + 1; j < n; j++) {
                const q = a[j];
                const dx = q.x - p.x, dy = q.y - p.y;
                const rr = p.r + q.r + 0.05;
                if (dx * dx + dy * dy <= rr * rr) {
                    if (q.y > p.y + p.r * 0.25) supported[i] = true;
                    if (p.y > q.y + q.r * 0.25) supported[j] = true;
                }
            }
        }

        /* 3. Quả nào đứng im và có điểm tựa thật thì cho ngủ riêng quả đó.
         * Bản cũ bắt cả một "đảo" quả phải cùng đứng im mới ngủ. Chỉ một quả
         * trên đỉnh còn lăn tăn là toàn bộ đống dưới đáy bị giữ thức, tiếp tục
         * nhận trọng lực và truyền vi dao động qua lại mãi. Tách theo từng quả
         * làm phần đã ổn định đứng hẳn, còn quả phía trên vẫn được rơi/lăn khi
         * điểm tựa bên dưới đổi chỗ. */
        for (let i = 0; i < n; i++) {
            const f = a[i];
            const nap = f.still > SLEEP_T && supported[i];
            f.sleeping = nap;
            /* Quả ngủ thì vận tốc phải bằng không. Mấy hàm gỡ chồng lấn vẫn
             * cộng lực vào nó, mà ngủ thì không ai đem ra dùng — cứ thế cộng
             * dồn. Máy soát từng bắt được một quả nằm im mà trong người mang
             * sẵn 1,1 ô/giây; tới lúc tỉnh dậy nó vọt đi như bị ai đá. */
            if (nap) { f.vx = 0; f.vy = 0; f.spin = 0; }
        }
    }

    /* Nhập quả. Mỗi bước chỉ nhập một lượt, quả vừa sinh ra không nhập tiếp
     * ngay trong cùng bước — để bé còn kịp nhìn thấy chuỗi nhập liên hoàn diễn
     * ra từng nhịp một chứ không biến mất cả đống trong một khung hình. */
    function doMerges(box, cb) {
        const a = box.fruits;
        const dead = new Set();
        const born = [];

        for (let i = 0; i < a.length; i++) {
            const p = a[i];
            if (dead.has(p.id)) continue;
            for (let j = i + 1; j < a.length; j++) {
                const q = a[j];
                if (dead.has(q.id) || q.tier !== p.tier) continue;
                const dx = q.x - p.x, dy = q.y - p.y;
                const touch = p.r + q.r + TOUCH;
                if (dx * dx + dy * dy > touch * touch) continue;

                dead.add(p.id); dead.add(q.id);

                /* Quả mới ra đời ở giữa hai quả cũ, nghiêng về phía quả nặng
                 * hơn — ở đây hai quả cùng bậc nên đúng là điểm giữa. */
                const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
                const mvx = (p.vx + q.vx) / 2, mvy = (p.vy + q.vy) / 2;

                if (p.tier >= TOP_TIER) {
                    /* Hai quả dưa hấu gặp nhau thì nổ tung, dọn hẳn chỗ. Không
                     * cho nhập lên bậc cao hơn nữa vì không còn bậc nào, mà bỏ
                     * mặc hai quả to đùng nằm đó thì thùng nghẹt luôn. */
                    box.score += MELON_POP;
                    if (cb) cb('pop', TOP_TIER, mx, my, MELON_POP);
                } else {
                    const nt = p.tier + 1;
                    const f = addFruit(box, nt, mx, my, mvx, mvy);
                    /* Quả mới to hơn hai quả cũ, nên đặt đúng điểm giữa là nó
                     * đã thò ra ngoài vách hoặc thụt xuống dưới sàn rồi. Kéo
                     * về trong lòng thùng ngay tại đây, đừng để bước sau mới
                     * lo — máy soát đếm được cả trăm khung hình có quả nằm
                     * ngoài thùng chỉ vì chỗ này. */
                    clampWalls(f);
                    f.lastX = f.x; f.lastY = f.y;
                    f.born = box.time;
                    born.push(f);
                    box.score += FRUITS[nt].born;
                    if (cb) cb('merge', nt, mx, my, FRUITS[nt].born);
                }
                break;
            }
        }

        if (dead.size) {
            box.fruits = a.filter(f => !dead.has(f.id));
            /* Đống quả vừa mất chỗ đỡ thì phải tỉnh hết dậy, không thì mấy quả
             * đang ngủ treo lơ lửng giữa không trung. */
            for (const f of box.fruits) wake(f);
        }
        return born.length > 0 || dead.size > 0;
    }

    /* Một bước vật lý trọn vẹn. Máy soát ở check-physics.js gọi thẳng hàm này
     * nên đừng đưa chuyện vẽ vời hay âm thanh vào đây — chỉ nhận cb để báo ra
     * ngoài, ai muốn kêu tiếng thì tự kêu. */
    function stepBox(box, dt, cb) {
        box.time += dt;

        /* THỨ TỰ TRONG MỘT BƯỚC — chỗ này em làm sai một lần, và cái sai ấy
         * chính là thứ anh Hiếu nhìn thấy.
         *
         * Lúc đầu em cho quả RƠI trước rồi mới giải va chạm. Nghe thì tự
         * nhiên, nhưng nó sinh ra một cái bánh cóc: mỗi bước trọng lực dìm quả
         * lún thẳng XUỐNG một khoảng g·dt² (chừng 0,002 ô), rồi phần gỡ lún
         * đẩy nó ra theo hướng PHÁP TUYẾN của chỗ chạm — mà chỗ chạm giữa hai
         * hình tròn thì hầu như bao giờ cũng chéo. Lún thẳng xuống, đẩy ra
         * chéo lên: mỗi bước quả xê ngang một tí, một trăm hai mươi bước một
         * giây. Vận tốc đo được gần như bằng không (0,005 ô/giây) mà quả vẫn
         * bò ngang 0,1 ô mỗi giây — nhìn màn hình thì thấy cả đống trái cây cứ
         * nhúc nhích trườn đi, không đứng hẳn bao giờ.
         *
         * Thứ tự đúng, cũng là thứ tự mọi thư viện vật lý dùng: cộng trọng lực
         * vào VẬN TỐC → giải va chạm trên vận tốc → rồi mới đem vận tốc đã sửa
         * ra dời vị trí. Làm vậy thì quả nằm nghỉ có vận tốc bị triệt tiêu
         * TRƯỚC khi nó kịp lún, nên chẳng còn chỗ lún nào để mà đẩy ra, và cái
         * bánh cóc biến mất. */
        applyGravity(box, dt);
        /* Chỗ đứng lúc đầu bước, để cuối bước biết quả đã thật sự đi bao xa */
        for (const f of box.fruits) { f.stepX = f.x; f.stepY = f.y; }

        const pairs = pairsOf(box);
        warmStart(box, pairs);
        const onBump = cb ? (v, r) => cb('bump', 0, 0, 0, 0, v, r) : null;
        for (let k = 0; k < ITER; k++) {
            /* Quả với quả xử trước, vách xử sau. Thứ tự này không đổi chỗ được:
             * vòng nào cũng phải KẾT THÚC bằng vách, vì lần đẩy cuối cùng của
             * mấy quả bên cạnh hay tống quả này lún vào tường, mà lún xong
             * không ai kéo ra thì nó nằm luôn ngoài thùng. */
            for (const pr of pairs) solvePair(pr, dt, k === 0 ? onBump : null);
            for (const f of box.fruits) solveWalls(f, dt, k === 0 ? onBump : null);
        }
        saveContacts(box, pairs);

        /* Vận tốc đã sửa xong, giờ mới đem ra dời vị trí */
        movePositions(box, dt);

        /* Lượt riêng để gỡ nốt chỗ lún còn sót, chạy trên sổ vận tốc giả rồi
         * mới đem dời vị trí. */
        for (const f of box.fruits) { f.px = 0; f.py = 0; }
        for (let k = 0; k < PITER; k++) {
            for (const pr of pairs) solvePairPos(pr, dt);
            for (const f of box.fruits) solveWallsPos(f, dt);
        }
        for (const f of box.fruits) {
            if (f.px || f.py) { f.x += f.px * dt; f.y += f.py * dt; }
        }

        for (const f of box.fruits) clampWalls(f);

        updateSpin(box, dt);
        doMerges(box, cb);
        sleepIslands(box, dt);
    }

    /* Có quả nào nhô lên trên vạch đỏ mà đã nằm im chưa? Quả đang rơi vèo qua
     * vùng đó không tính — không thì lần thả nào cũng bị kêu oan. */
    function overLine(box) {
        for (const f of box.fruits) {
            if (f.age < 0.7) continue;
            if (Math.hypot(f.vx, f.vy) > SETTLE_V) continue;
            if (f.y - f.r < DANGER_Y) return true;
        }
        return false;
    }

    /* ========================================================================
     *  7. TRẠNG THÁI
     * ======================================================================*/

    const G = {
        mode: 'menu',       // menu | play | over
        kids: 1,
        boxes: [],
        time: 0,
        winner: 0,          // chế độ hai bé: 1, 2 hoặc 0 nếu hoà
        melonSeen: false    // đã khoe băng-rôn dưa hấu lần nào chưa, mỗi ván một lần
    };

    function newGame(kids) {
        G.kids = kids;
        G.boxes = [];
        chipShown[0] = {}; chipShown[1] = {};
        for (let i = 0; i < kids; i++) G.boxes.push(makeBox(i + 1));
        G.winner = 0;
        G.melonSeen = false;
        G.mode = 'play';
        layout();
    }

    /* ========================================================================
     *  8. HÌNH HỌC
     * ------------------------------------------------------------------------
     *  Mỗi thùng được chia một khoảng chữ nhật trên màn hình, rồi tự co giãn
     *  cho vừa khoảng ấy. Một bé thì thùng chiếm giữa màn; hai bé thì hai thùng
     *  nằm cạnh nhau, mỗi thùng một nửa. Cạnh nhau chứ không trên dưới: hai bé
     *  ngồi cùng một máy đều phải nhìn thấy thùng của mình lẫn thùng của bạn,
     *  mà xếp trên dưới thì bé ngồi dưới bị cái đầu của bé kia che mất.
     * ======================================================================*/

    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');

    const V = { w: 0, h: 0, dpr: 1 };
    const rects = [];           // {x, y, w, h, u} theo điểm ảnh CSS, mỗi thùng một cái

    const PAD_TOP = 34;         // chừa chỗ cho thẻ điểm nổi phía trên thùng

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
        V.w = w; V.h = h; V.dpr = dpr;
        layout();
    }

    function layout() {
        rects.length = 0;
        const n = Math.max(1, G.boxes.length || G.kids);
        const gap = n > 1 ? Math.max(10, V.w * 0.02) : 0;
        const cellW = (V.w - gap * (n - 1) - 16) / n;
        const cellH = V.h - PAD_TOP - 10;

        const u = Math.min(cellW / BW, cellH / BH);
        const bw = BW * u, bh = BH * u;
        const totalW = bw * n + gap * (n - 1);
        const x0 = (V.w - totalW) / 2;
        const y0 = PAD_TOP + (cellH - bh) / 2;

        for (let i = 0; i < n; i++) {
            rects.push({ x: x0 + i * (bw + gap), y: y0, w: bw, h: bh, u: u });
        }
        placeChips();
    }

    /* Thẻ điểm là thẻ HTML thật (để /i18n.js dịch được chữ "Bé 1"), nên mỗi lần
     * đổi cỡ màn phải tự tay đặt nó lên đúng đầu thùng. */
    function placeChips() {
        for (let i = 0; i < ui.chips.length; i++) {
            const chip = ui.chips[i], r = rects[i];
            if (!chip) continue;
            /* Đang ở bảng chào thì giấu hết thẻ điểm. Không có vế G.mode ở đây
             * thì mỗi lần đổi cỡ cửa sổ, ResizeObserver lại gọi vào và bày thẻ
             * "BÉ 1 — 0 điểm" ra ngay sau lưng bảng chào. */
            if (G.mode !== 'play' || !r || i >= G.kids) { chip.hidden = true; continue; }
            chip.hidden = false;
            chip.style.left = r.x + 'px';
            chip.style.top = Math.max(0, r.y - PAD_TOP + 2) + 'px';
            chip.style.width = r.w + 'px';
        }
    }

    /* Toạ độ trong thùng ⇄ toạ độ trên màn */
    function bx(i, x) { return rects[i].x + x * rects[i].u; }
    function by(i, y) { return rects[i].y + y * rects[i].u; }

    function boxAt(px, py) {
        for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            /* Nới vùng nhận ngón tay ra hai bên và lên trên: ngón tay bé đặt
             * hụt ra ngoài mép thùng vài chục điểm ảnh là chuyện thường, mà
             * chạm hụt thì quả không rơi và bé tưởng game đơ. */
            if (px >= r.x - 30 && px <= r.x + r.w + 30 && py >= r.y - PAD_TOP && py <= r.y + r.h + 30) return i;
        }
        return -1;
    }

    /* ========================================================================
     *  9. ĐIỀU KHIỂN
     * ------------------------------------------------------------------------
     *  Chạm vào thùng nào thì lái quả của thùng ấy — nhờ thế hai bé chơi cùng
     *  lúc trên một màn cảm ứng vẫn không giẫm chân nhau, mỗi ngón tay được
     *  ghi sổ riêng theo pointerId.
     * ======================================================================*/

    const pointers = new Map();   // pointerId → chỉ số thùng

    /* Quả đang cầm không được thò ra ngoài vách, kể cả một phần */
    function aimClamp(box) {
        const r = FRUITS[box.held].r;
        box.aimX = Math.max(r + 0.05, Math.min(BW - r - 0.05, box.aimX));
    }

    function aimTo(i, px) {
        const box = G.boxes[i];
        if (!box || box.over || G.mode !== 'play') return;
        box.aimX = (px - rects[i].x) / rects[i].u;
        aimClamp(box);
    }

    function dropAt(i) {
        const box = G.boxes[i];
        if (!box || box.over || box.dropCd > 0 || G.mode !== 'play') return;
        const tier = box.held;
        addFruit(box, tier, box.aimX, HOLD_Y, 0, SPAWN_VY);
        box.held = box.next;
        box.next = pickTier();
        box.dropCd = DROP_CD;
        sfx.drop();
        paintChips();
    }

    function wireInput() {
        const host = canvas.parentElement;

        host.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            sfx.wake();
            if (G.mode !== 'play') return;
            const r = canvas.getBoundingClientRect();
            const px = ev.clientX - r.left, py = ev.clientY - r.top;
            const i = boxAt(px, py);
            if (i < 0) return;
            pointers.set(ev.pointerId, i);
            if (host.setPointerCapture) { try { host.setPointerCapture(ev.pointerId); } catch (e) { } }
            aimTo(i, px);
        }, { passive: false });

        host.addEventListener('pointermove', ev => {
            if (G.mode !== 'play') return;
            const r = canvas.getBoundingClientRect();
            const px = ev.clientX - r.left, py = ev.clientY - r.top;
            const held = pointers.get(ev.pointerId);
            if (held != null) { aimTo(held, px); return; }
            /* Chuột rê ngang mà chưa bấm thì quả vẫn đi theo — trên máy tính
             * bé quen thấy quả bám con trỏ trước khi bấm thả. */
            if (ev.pointerType === 'mouse') {
                const i = boxAt(px, py);
                if (i >= 0) aimTo(i, px);
            }
        });

        function release(ev) {
            const i = pointers.get(ev.pointerId);
            if (i == null) return;
            pointers.delete(ev.pointerId);
            dropAt(i);
        }
        host.addEventListener('pointerup', release);
        host.addEventListener('pointercancel', ev => pointers.delete(ev.pointerId));

        /* ---- bàn phím ----
         * Một bé: mũi tên trái phải, dấu cách thả.
         * Hai bé: bé 1 dùng A D và S, bé 2 dùng mũi tên và số 0/Enter — hai
         * cụm phím nằm hai đầu bàn phím để hai bé không cụng tay nhau. */
        const keyMove = { 1: 0, 2: 0 };

        window.addEventListener('keydown', ev => {
            if (G.mode !== 'play') return;
            const k = ev.key;
            let used = true;
            if (k === 'a' || k === 'A') keyMove[1] = -1;
            else if (k === 'd' || k === 'D') keyMove[1] = 1;
            else if (k === 's' || k === 'S' || k === 'w' || k === 'W') dropAt(0);
            else if (k === 'ArrowLeft') keyMove[2] = -1;
            else if (k === 'ArrowRight') keyMove[2] = 1;
            else if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter') dropAt(G.kids > 1 ? 1 : 0);
            else if (k === ' ') dropAt(0);
            else used = false;
            if (used) { ev.preventDefault(); sfx.wake(); }
        });

        window.addEventListener('keyup', ev => {
            const k = ev.key;
            if (k === 'a' || k === 'A' || k === 'd' || k === 'D') keyMove[1] = 0;
            if (k === 'ArrowLeft' || k === 'ArrowRight') keyMove[2] = 0;
        });

        /* Giữ phím thì quả trượt đều tay, gọi mỗi khung hình từ vòng lặp */
        G.stepKeys = function (dt) {
            for (let i = 0; i < G.boxes.length; i++) {
                /* Một bé thì cả A/D lẫn mũi tên đều lái được cái thùng duy nhất
                 * — bé nào quen tay nào cũng chơi được ngay. */
                const dir = (keyMove[i + 1] || 0) || (G.kids === 1 ? keyMove[2] : 0);
                if (!dir) continue;
                const box = G.boxes[i];
                box.aimX += dir * 6.5 * dt;
                aimClamp(box);
            }
        };
    }

    /* ========================================================================
     *  10. HIỆU ỨNG
     * ======================================================================*/

    function puff(box, x, y, tier, n) {
        const col = FRUITS[tier].c;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 1.6 + Math.random() * 3.4;
            box.parts.push({
                x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
                r: 0.05 + Math.random() * 0.09, life: 0.5 + Math.random() * 0.35, t: 0, c: col
            });
        }
    }

    function ring(box, x, y, tier) {
        box.rings.push({ x: x, y: y, r0: FRUITS[tier].r * 0.7, t: 0, life: 0.42, c: FRUITS[tier].c });
    }

    function pop(box, x, y, n) {
        box.pops.push({ x: x, y: y, n: n, t: 0, life: 0.9 });
    }

    function shake(box, mag, dur) {
        box.shakeMag = Math.max(box.shakeMag, mag);
        box.shakeUntil = Math.max(box.shakeUntil, box.time + dur);
    }

    function stepFx(box, dt) {
        for (let i = box.parts.length - 1; i >= 0; i--) {
            const p = box.parts[i];
            p.t += dt;
            if (p.t >= p.life) { box.parts.splice(i, 1); continue; }
            p.vy += 16 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt;
        }
        for (let i = box.rings.length - 1; i >= 0; i--) {
            const r = box.rings[i];
            r.t += dt;
            if (r.t >= r.life) box.rings.splice(i, 1);
        }
        for (let i = box.pops.length - 1; i >= 0; i--) {
            const p = box.pops[i];
            p.t += dt;
            if (p.t >= p.life) box.pops.splice(i, 1);
        }
    }

    /* ========================================================================
     *  11. VẼ
     * ======================================================================*/

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function draw() {
        ctx.clearRect(0, 0, V.w, V.h);
        for (let i = 0; i < G.boxes.length && i < rects.length; i++) drawBox(i);
    }

    function drawBox(i) {
        const box = G.boxes[i], r = rects[i], u = r.u;

        ctx.save();
        if (box.time < box.shakeUntil) {
            const k = box.shakeMag * u * 0.04;
            ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
        } else {
            box.shakeMag = 0;
        }

        /* ---- lòng thùng ---- */
        ctx.save();
        roundRect(r.x, r.y, r.w, r.h, 14);
        ctx.clip();

        const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
        g.addColorStop(0, '#fff8e8');
        g.addColorStop(1, '#ffe9c4');
        ctx.fillStyle = g;
        ctx.fillRect(r.x, r.y, r.w, r.h);

        /* Dải trời phía trên vạch đỏ, sáng hơn một chút để bé thấy rõ "vùng
         * được phép", đỏ dần lên khi sắp thua. */
        const dg = ctx.createLinearGradient(0, r.y, 0, by(i, DANGER_Y));
        const heat = Math.min(1, box.dangerT / TOPOUT_T);
        dg.addColorStop(0, 'rgba(255,255,255,0.85)');
        dg.addColorStop(1, heat > 0 ? 'rgba(255,120,110,' + (0.12 + heat * 0.4) + ')' : 'rgba(255,255,255,0.15)');
        ctx.fillStyle = dg;
        ctx.fillRect(r.x, r.y, r.w, by(i, DANGER_Y) - r.y);

        drawDangerLine(i, heat);
        drawGuide(i);

        for (const f of box.fruits) drawFruit(i, f);
        drawRings(i);
        drawParts(i);
        drawHeld(i);
        drawPops(i);

        ctx.restore();

        /* ---- thành thùng ---- */
        ctx.lineWidth = Math.max(3, u * 0.09);
        ctx.strokeStyle = box.over ? '#8d5524' : (i === 0 ? '#b5651d' : '#2f7d8f');
        roundRect(r.x, r.y, r.w, r.h, 14);
        ctx.stroke();

        ctx.restore();
    }

    function drawDangerLine(i, heat) {
        const r = rects[i], y = by(i, DANGER_Y);
        ctx.save();
        ctx.setLineDash([r.u * 0.22, r.u * 0.16]);
        ctx.lineWidth = Math.max(2, r.u * 0.045);
        ctx.strokeStyle = heat > 0 ? 'rgba(220,40,40,' + (0.55 + heat * 0.45) + ')' : 'rgba(224,90,70,0.5)';
        ctx.beginPath();
        ctx.moveTo(r.x, y);
        ctx.lineTo(r.x + r.w, y);
        ctx.stroke();
        ctx.restore();
    }

    /* Đường chấm rơi thẳng từ quả đang cầm xuống đáy: bé nhìn là biết quả sẽ
     * chạm chỗ nào, khỏi phải thả thử rồi tiếc. */
    function drawGuide(i) {
        const box = G.boxes[i];
        if (box.over || G.mode !== 'play') return;
        const r = rects[i];
        const x = bx(i, box.aimX);
        ctx.save();
        ctx.setLineDash([r.u * 0.12, r.u * 0.2]);
        ctx.lineWidth = Math.max(1.5, r.u * 0.03);
        ctx.strokeStyle = 'rgba(120, 80, 30, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x, by(i, HOLD_Y) + FRUITS[box.held].r * r.u);
        ctx.lineTo(x, r.y + r.h);
        ctx.stroke();
        ctx.restore();
    }

    function drawHeld(i) {
        const box = G.boxes[i];
        if (box.over || G.mode !== 'play') return;
        const t = FRUITS[box.held];
        /* Quả đang cầm mờ đi một chút trong lúc chờ hết nghỉ, để bé biết vì sao
         * bấm mà chưa thả được. */
        ctx.save();
        ctx.globalAlpha = box.dropCd > 0 ? 0.45 : 1;
        paintFruit(bx(i, box.aimX), by(i, HOLD_Y), t.r * rects[i].u, box.held, 0, 1, 0, 0, box.time);
        ctx.restore();
    }

    function drawFruit(i, f) {
        const u = rects[i].u;
        /* Quả mới nhập phồng lên rồi xẹp về đúng cỡ trong 0,2 giây — nhịp này
         * là phần thưởng mắt thấy được cho mỗi lần bé ghép trúng. */
        const age = G.boxes[i].time - f.born;
        let s = 1;
        if (age < 0.2) {
            const k = age / 0.2;
            s = 1 + 0.3 * Math.sin(k * Math.PI) * (1 - k * 0.3);
        }
        paintFruit(bx(i, f.x), by(i, f.y), f.r * u * s, f.tier, f.rot, s, f.vx, f.vy, age);
    }

    /* Vẽ một quả: khối tròn có khối, cuống lá, hai con mắt và cái miệng. Mặt
     * mũi chỉ tốn mấy dòng mà đổi hẳn cảm giác — đống hình tròn trơn thì lạnh,
     * gắn mắt vào là bé coi như một lũ bạn. */
    function paintFruit(cx, cy, r, tier, rot, scale, vx, vy, age) {
        const t = FRUITS[tier];
        const wobble = Math.min(0.13, Math.hypot(vx || 0, vy || 0) * 0.015);
        const breath = 0.012 * Math.sin((age || 0) * 9 + tier);
        const sx = 1 + wobble + breath;
        const sy = 1 - wobble * 0.72 - breath;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot || 0);

        /* bóng đổ dưới đáy quả */
        ctx.fillStyle = 'rgba(120, 70, 20, 0.13)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.82, r * 0.86, r * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.scale(sx, sy);
        const g = ctx.createRadialGradient(-r * 0.32, -r * 0.36, r * 0.1, 0, 0, r * 1.06);
        g.addColorStop(0, lighten(t.c, 0.28));
        g.addColorStop(0.55, t.c);
        g.addColorStop(1, t.c2);
        ctx.fillStyle = g;
        fruitShape(tier, r);
        ctx.fill();

        ctx.lineWidth = Math.max(1, r * 0.07);
        ctx.strokeStyle = t.c2;
        ctx.stroke();

        decorate(tier, r);

        /* bóng sáng */
        ctx.fillStyle = 'rgba(255,255,255,0.52)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.36, -r * 0.42, r * 0.26, r * 0.17, -0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.24)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.08, -r * 0.2, r * 0.54, r * 0.43, -0.35, Math.PI * 1.08, Math.PI * 1.72);
        ctx.fill();

        /* cuống và lá, chỉ vẽ khi quả đủ to để nhìn ra */
        if (r > 7) stemAndLeaf(tier, r);

        face(r, t, scale);
        ctx.restore();
    }

    function fruitShape(tier, r) {
        const f = FRUITS[tier];
        ctx.beginPath();
        if (f.name === 'Strawberry') {
            ctx.moveTo(0, r * 0.92);
            ctx.bezierCurveTo(-r * 0.98, r * 0.3, -r * 0.84, -r * 0.76, 0, -r * 0.94);
            ctx.bezierCurveTo(r * 0.84, -r * 0.76, r * 0.98, r * 0.3, 0, r * 0.92);
        } else if (f.name === 'Lemon') {
            ctx.moveTo(-r * 0.95, 0);
            ctx.bezierCurveTo(-r * 0.72, -r * 0.9, r * 0.72, -r * 0.9, r * 0.95, 0);
            ctx.bezierCurveTo(r * 0.72, r * 0.9, -r * 0.72, r * 0.9, -r * 0.95, 0);
        } else if (f.name === 'Apple') {
            ctx.moveTo(0, -r * 0.85);
            ctx.bezierCurveTo(-r * 0.22, -r * 1.04, -r * 0.98, -r * 0.7, -r * 0.9, r * 0.08);
            ctx.bezierCurveTo(-r * 0.82, r * 0.86, -r * 0.18, r * 1.02, 0, r * 0.76);
            ctx.bezierCurveTo(r * 0.18, r * 1.02, r * 0.82, r * 0.86, r * 0.9, r * 0.08);
            ctx.bezierCurveTo(r * 0.98, -r * 0.7, r * 0.22, -r * 1.04, 0, -r * 0.85);
        } else if (f.name === 'Peach') {
            ctx.moveTo(0, -r);
            ctx.bezierCurveTo(-r * 0.95, -r * 0.82, -r, r * 0.55, -r * 0.18, r * 0.94);
            ctx.bezierCurveTo(0, r, r * 0.18, r * 0.94, r * 0.18, r * 0.94);
            ctx.bezierCurveTo(r, r * 0.55, r * 0.95, -r * 0.82, 0, -r);
        } else if (f.name === 'Pineapple') {
            ctx.ellipse(0, r * 0.06, r * 0.78, r * 0.98, 0, 0, Math.PI * 2);
        } else {
            ctx.arc(0, 0, r, 0, Math.PI * 2);
        }
        ctx.closePath();
    }

    function stemAndLeaf(tier, r) {
        const f = FRUITS[tier];
        if (f.name === 'Pineapple') {
            ctx.fillStyle = '#3f9f38';
            for (let k = -2; k <= 2; k++) {
                ctx.save();
                ctx.rotate(k * 0.28);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.72);
                ctx.quadraticCurveTo(r * 0.18, -r * 1.18, k * r * 0.18, -r * 1.45);
                ctx.quadraticCurveTo(-r * 0.08, -r * 1.08, 0, -r * 0.72);
                ctx.fill();
                ctx.restore();
            }
            return;
        }
        if (f.name === 'Cherry') {
            ctx.strokeStyle = '#5d3a16';
            ctx.lineWidth = Math.max(1.5, r * 0.09);
            ctx.beginPath();
            ctx.moveTo(-r * 0.18, -r * 0.78);
            ctx.quadraticCurveTo(-r * 0.08, -r * 1.28, r * 0.35, -r * 1.42);
            ctx.stroke();
            ctx.fillStyle = '#4faa3a';
            ctx.beginPath();
            ctx.ellipse(r * 0.22, -r * 1.24, r * 0.2, r * 0.1, -0.45, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        ctx.strokeStyle = '#6b4a1f';
        ctx.lineWidth = Math.max(1.5, r * 0.085);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.86);
        ctx.quadraticCurveTo(r * 0.08, -r * 1.08, r * 0.02, -r * 1.2);
        ctx.stroke();
        ctx.fillStyle = '#4faa3a';
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 1.12, r * 0.28, r * 0.14, -0.45, 0, Math.PI * 2);
        ctx.fill();
    }

    /* Nét riêng của từng loại quả — chỉ vài đường, đủ để phân biệt khi hai bậc
     * cạnh nhau có màu hao hao. */
    function decorate(tier, r) {
        const f = FRUITS[tier];
        if (f.name === 'Cherry') {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.32, -r * 0.38, r * 0.16, r * 0.09, -0.55, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(120,16,32,0.28)';
            ctx.lineWidth = Math.max(1, r * 0.04);
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.76, -0.1, 0.95);
            ctx.stroke();
        } else if (f.name === 'Watermelon' || f.name === 'Melon') {
            ctx.save();
            ctx.beginPath(); ctx.arc(0, 0, r * 0.99, 0, Math.PI * 2); ctx.clip();
            ctx.strokeStyle = f.name === 'Watermelon' ? 'rgba(19,86,32,0.62)' : 'rgba(255,255,255,0.55)';
            ctx.lineWidth = Math.max(1, r * 0.08);
            for (let k = -3; k <= 3; k++) {
                ctx.beginPath();
                ctx.moveTo(k * r * 0.28, -r);
                ctx.bezierCurveTo(k * r * 0.45, -r * 0.38, k * r * 0.45, r * 0.38, k * r * 0.28, r);
                ctx.stroke();
            }
            if (f.name === 'Watermelon') {
                ctx.strokeStyle = 'rgba(175,235,128,0.35)';
                ctx.lineWidth = Math.max(1, r * 0.045);
                for (let k = -2; k <= 2; k++) {
                    ctx.beginPath();
                    ctx.moveTo(k * r * 0.34 + r * 0.13, -r);
                    ctx.bezierCurveTo(k * r * 0.5, -r * 0.3, k * r * 0.5, r * 0.3, k * r * 0.34 + r * 0.13, r);
                    ctx.stroke();
                }
            }
            ctx.restore();
        } else if (f.name === 'Strawberry') {
            ctx.fillStyle = 'rgba(255,255,220,0.85)';
            for (let k = 0; k < 13; k++) {
                const row = Math.floor(k / 4);
                const col = k % 4;
                const x = (col - 1.5) * r * 0.23 + (row % 2) * r * 0.08;
                const y = -r * 0.48 + row * r * 0.28;
                if (Math.abs(x) + Math.abs(y) * 0.45 > r * 0.78) continue;
                ctx.beginPath();
                ctx.ellipse(x, y, r * 0.045, r * 0.075, 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#54b83f';
            for (let k = -2; k <= 2; k++) {
                ctx.save();
                ctx.rotate(k * 0.18);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.76);
                ctx.lineTo(r * 0.16, -r * 1.03);
                ctx.lineTo(-r * 0.16, -r * 0.92);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        } else if (f.name === 'Pineapple') {
            ctx.save();
            ctx.beginPath(); ctx.ellipse(0, r * 0.06, r * 0.78, r * 0.98, 0, 0, Math.PI * 2); ctx.clip();
            ctx.strokeStyle = 'rgba(125,82,8,0.46)';
            ctx.lineWidth = Math.max(1, r * 0.06);
            for (let k = -3; k <= 3; k++) {
                ctx.beginPath(); ctx.moveTo(-r, k * r * 0.34); ctx.lineTo(r, k * r * 0.34 + r * 0.5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-r, k * r * 0.34 + r * 0.5); ctx.lineTo(r, k * r * 0.34); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,238,120,0.55)';
            for (let yy = -2; yy <= 2; yy++) {
                for (let xx = -2; xx <= 2; xx++) {
                    if (Math.abs(xx) + Math.abs(yy) > 3) continue;
                    ctx.beginPath();
                    ctx.arc(xx * r * 0.25, yy * r * 0.28 + r * 0.08, r * 0.035, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        } else if (f.name === 'Grape') {
            const spots = [
                [-0.28, -0.28], [0.05, -0.34], [0.32, -0.14],
                [-0.18, 0.02], [0.18, 0.08], [-0.02, 0.36]
            ];
            spots.forEach((p, idx) => {
                const gg = ctx.createRadialGradient((p[0] - 0.08) * r, (p[1] - 0.1) * r, r * 0.02, p[0] * r, p[1] * r, r * 0.25);
                gg.addColorStop(0, lighten(f.c, 0.28));
                gg.addColorStop(1, idx % 2 ? '#7f43d0' : f.c2);
                ctx.fillStyle = gg;
                ctx.beginPath();
                ctx.arc(p[0] * r, p[1] * r, r * 0.24, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (f.name === 'Lemon') {
            ctx.save();
            fruitShape(tier, r * 0.99);
            ctx.clip();
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            for (let k = 0; k < 18; k++) {
                const a = k * 2.31;
                const d = 0.18 + ((k * 37) % 70) / 100;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r * d, Math.sin(a) * r * d * 0.72, r * 0.035, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(215,150,0,0.18)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.86, 0, r * 0.07, r * 0.18, 0, 0, Math.PI * 2);
            ctx.ellipse(r * 0.86, 0, r * 0.07, r * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (f.name === 'Orange') {
            ctx.save();
            ctx.beginPath(); ctx.arc(0, 0, r * 0.99, 0, Math.PI * 2); ctx.clip();
            ctx.strokeStyle = 'rgba(255,255,255,0.16)';
            ctx.lineWidth = Math.max(1, r * 0.035);
            for (let k = 0; k < 7; k++) {
                const a = k * Math.PI / 7;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(a + Math.PI) * r, Math.sin(a + Math.PI) * r);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.16)';
            for (let k = 0; k < 18; k++) {
                const a = k * 0.7;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, r * 0.045, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else if (f.name === 'Apple') {
            ctx.strokeStyle = 'rgba(120,20,35,0.34)';
            ctx.lineWidth = Math.max(1, r * 0.055);
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.78);
            ctx.quadraticCurveTo(-r * 0.1, -r * 0.3, -r * 0.02, r * 0.68);
            ctx.stroke();
        } else if (f.name === 'Peach') {
            ctx.strokeStyle = 'rgba(175,77,66,0.4)';
            ctx.lineWidth = Math.max(1, r * 0.07);
            ctx.beginPath();
            ctx.moveTo(r * 0.12, -r * 0.78);
            ctx.bezierCurveTo(-r * 0.18, -r * 0.28, -r * 0.18, r * 0.42, r * 0.1, r * 0.78);
            ctx.stroke();
        }
    }

    function face(r, t, scale) {
        const eye = Math.max(1.1, r * 0.11);
        const dx = r * 0.3, dy = -r * 0.06;
        ctx.fillStyle = t.face;
        ctx.beginPath(); ctx.arc(-dx, dy, eye, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(dx, dy, eye, 0, Math.PI * 2); ctx.fill();

        /* đốm sáng trong mắt, chỉ đủ chỗ khi quả to */
        if (r > 10) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath(); ctx.arc(-dx + eye * 0.35, dy - eye * 0.35, eye * 0.34, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(dx + eye * 0.35, dy - eye * 0.35, eye * 0.34, 0, Math.PI * 2); ctx.fill();
        }

        ctx.strokeStyle = t.face;
        ctx.lineWidth = Math.max(1, r * 0.075);
        ctx.lineCap = 'round';
        ctx.beginPath();
        /* quả vừa mới nhập (scale còn lớn hơn 1) thì cười toác ra */
        const open = scale > 1.02 ? r * 0.22 : r * 0.12;
        ctx.arc(0, r * 0.16, r * 0.24, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        if (open > r * 0.2) {
            ctx.fillStyle = t.face;
            ctx.beginPath();
            ctx.arc(0, r * 0.16, r * 0.24, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.fill();
        }
    }

    function drawParts(i) {
        const box = G.boxes[i], u = rects[i].u;
        for (const p of box.parts) {
            const k = 1 - p.t / p.life;
            ctx.globalAlpha = k;
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.arc(bx(i, p.x), by(i, p.y), p.r * u * k, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawRings(i) {
        const box = G.boxes[i], u = rects[i].u;
        for (const r of box.rings) {
            const k = r.t / r.life;
            ctx.globalAlpha = (1 - k) * 0.7;
            ctx.strokeStyle = r.c;
            ctx.lineWidth = Math.max(2, u * 0.08 * (1 - k));
            ctx.beginPath();
            ctx.arc(bx(i, r.x), by(i, r.y), (r.r0 + k * 1.5) * u, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    /* Điểm bay lên. Đây là chỗ duy nhất trong game có chữ vẽ trên canvas, mà
     * lại chỉ là con số nên /i18n.js không phải dịch gì. */
    function drawPops(i) {
        const box = G.boxes[i], u = rects[i].u;
        for (const p of box.pops) {
            const k = p.t / p.life;
            ctx.globalAlpha = 1 - k * k;
            ctx.fillStyle = '#c2410c';
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineWidth = Math.max(2, u * 0.06);
            ctx.font = '800 ' + Math.max(12, u * 0.42) + 'px Baloo 2, Fredoka, sans-serif';
            ctx.textAlign = 'center';
            const txt = '+' + p.n;
            const x = bx(i, p.x), y = by(i, p.y) - k * u * 1.4;
            ctx.strokeText(txt, x, y);
            ctx.fillText(txt, x, y);
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'start';
    }

    function lighten(hex, k) {
        const n = parseInt(hex.slice(1), 16);
        const r = Math.min(255, ((n >> 16) & 255) + 255 * k);
        const g = Math.min(255, ((n >> 8) & 255) + 255 * k);
        const b = Math.min(255, (n & 255) + 255 * k);
        return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
    }

    /* ========================================================================
     *  12. GIAO DIỆN
     * ======================================================================*/

    const el = id => document.getElementById(id);
    const ui = {
        chips: [el('chip-1'), el('chip-2')],
        chipScore: [el('chip-1-score'), el('chip-2-score')],
        chipNext: [el('chip-1-next'), el('chip-2-next')],
        tip: el('tip'),
        menu: el('menu-overlay'), over: el('over-overlay'), duo: el('duo-overlay'),
        overScore: el('over-score'), overBest: el('over-best'), overFruit: el('over-fruit'),
        overBigFruit: el('over-bigfruit'),
        overNew: el('over-new'), overTitle: el('over-title'),
        duoTitle: el('duo-title'), duoWhy: el('duo-why'),
        duoScore1: el('duo-score-1'), duoScore2: el('duo-score-2'),
        kidBtns: Array.prototype.slice.call(document.querySelectorAll('[data-kids]'))
    };

    function show(n) { if (n) n.classList.remove('hidden'); }
    function hide(n) { if (n) n.classList.add('hidden'); }
    function hideAll() { [ui.menu, ui.over, ui.duo].forEach(hide); }

    /* Chỉ ghi vào thẻ điểm khi con số ĐỔI. Ghi đè mỗi khung hình thì trông vẫn
     * y hệt, nhưng /i18n.js có một MutationObserver ngồi rình cả trang: mỗi lần
     * ghi là một lần nó thức dậy quét lại chữ, sáu mươi lần một giây, trong khi
     * điểm cả chục giây mới đổi một lần. */
    const chipShown = [{}, {}];

    function paintChips() {
        for (let i = 0; i < G.boxes.length && i < ui.chips.length; i++) {
            const box = G.boxes[i], seen = chipShown[i];
            if (ui.chipScore[i] && seen.score !== box.score) {
                ui.chipScore[i].textContent = box.score;
                seen.score = box.score;
            }
            if (ui.chipNext[i] && seen.next !== box.next) {
                ui.chipNext[i].textContent = FRUITS[box.next].emoji;
                seen.next = box.next;
            }
        }
    }

    function showTip(text, ms) {
        if (!text) return;
        ui.tip.textContent = text;
        show(ui.tip);
        clearTimeout(showTip.t);
        showTip.t = setTimeout(() => hide(ui.tip), ms || 2600);
    }

    function startGame(kids) {
        newGame(kids);
        hideAll();
        paintChips();
        placeChips();
        const keys = el('keys');
        if (keys) keys.classList.toggle('duo', kids > 1);
    }

    function openMenu() {
        G.mode = 'menu';
        hideAll();
        for (const c of ui.chips) if (c) c.hidden = true;
        show(ui.menu);
    }

    function endSolo() {
        const box = G.boxes[0];
        G.mode = 'over';
        sfx.over();
        const fresh = store.record(box.score, box.bestTier);
        ui.overScore.textContent = box.score;
        ui.overBest.textContent = store.data.best;
        /* Quả to nhất của RIÊNG ván này hiện to giữa bảng, còn quả to nhất từ
         * trước tới nay nằm ở hàng dưới — bé thấy được mình hôm nay đã tới đâu
         * so với ngày mình chơi hay nhất. */
        ui.overFruit.textContent = FRUITS[box.bestTier].emoji;
        ui.overBigFruit.textContent = FRUITS[store.data.bestTier || 0].emoji;
        ui.overNew.hidden = !fresh;
        show(ui.over);
    }

    function endDuo(winner, why) {
        G.mode = 'over';
        G.winner = winner;
        sfx.over();
        const a = G.boxes[0].score, b = G.boxes[1].score;
        ui.duoScore1.textContent = a;
        ui.duoScore2.textContent = b;
        ui.duoTitle.textContent = winner ? 'Kid ' + winner + ' wins!' : "It's a draw!";
        ui.duoWhy.textContent = why;
        show(ui.duo);
    }

    function wireButtons() {
        ui.kidBtns.forEach(b => {
            b.addEventListener('click', () => {
                ui.kidBtns.forEach(x => x.classList.remove('is-on'));
                b.classList.add('is-on');
                G.kids = +b.dataset.kids;
            });
        });

        el('btn-play').addEventListener('click', () => { sfx.wake(); startGame(G.kids); });
        el('btn-nav-menu').addEventListener('click', openMenu);
        /* Đang ở bảng chào thì nút chơi lại không có gì để chơi lại — bấm vào
         * mà nhảy thẳng vào ván mới thì bé chưa kịp chọn một bé hay hai bé. */
        el('btn-nav-restart').addEventListener('click', () => { if (G.mode !== 'menu') startGame(G.kids); });
        el('btn-again').addEventListener('click', () => startGame(G.kids));
        el('btn-over-menu').addEventListener('click', openMenu);
        el('btn-duo-again').addEventListener('click', () => startGame(2));
        el('btn-duo-menu').addEventListener('click', openMenu);

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
     * ------------------------------------------------------------------------
     *  Phần vật lý chạy theo bước cố định 1/120 giây, tách hẳn khỏi nhịp vẽ.
     *  Máy 60 Hz hay 120 Hz đều cho ra một đống quả xếp y hệt nhau — đây là
     *  điều kiện bắt buộc, vì hai bé ngồi hai máy khác nhau mà cùng thả một
     *  kiểu lại ra hai kết quả thì còn gì để so điểm.
     * ======================================================================*/

    let acc = 0, last = 0;

    function update(dt) {
        if (G.mode !== 'play') return;
        if (G.stepKeys) G.stepKeys(dt);

        acc += dt;
        let guard = 0;
        while (acc >= STEP && guard++ < 8) {
            acc -= STEP;
            for (const box of G.boxes) {
                if (box.over) continue;
                stepBox(box, STEP, mkCb(box));
            }
        }
        if (guard >= 8) acc = 0;

        for (const box of G.boxes) {
            stepFx(box, dt);
            if (box.over) continue;
            if (box.dropCd > 0) box.dropCd -= dt;

            /* đồng hồ vạch đỏ */
            if (overLine(box)) {
                box.dangerT += dt;
                if (box.time - box.warnAt > 0.6) { box.warnAt = box.time; sfx.warn(); }
                if (box.dangerT >= TOPOUT_T) topOut(box);
            } else if (box.dangerT > 0) {
                box.dangerT = Math.max(0, box.dangerT - dt * 1.6);
            }
        }
        paintChips();
    }

    /* Cầu nối giữa phần vật lý và phần nghe nhìn. Phần vật lý chỉ báo "vừa có
     * chuyện này", còn kêu tiếng gì, bắn mảnh vụn ra sao thì ở đây quyết. */
    function mkCb(box) {
        return function (kind, tier, x, y, n, v, r) {
            if (kind === 'bump') { sfx.bump(v, r); return; }
            if (kind === 'merge' || kind === 'pop') {
                sfx.merge(tier);
                puff(box, x, y, tier, kind === 'pop' ? 22 : 8 + tier);
                ring(box, x, y, tier);
                pop(box, x, y, n);
                if (tier >= 6) shake(box, 0.5 + tier * 0.15, 0.18);

                if (kind === 'pop') {
                    shake(box, 2.4, 0.35);
                    sfx.melon();
                }
                if (tier === TOP_TIER && kind === 'merge') onMelon(box);
                else if (tier === 8) sfx.big();
            }
        };
    }

    /* Làm ra được quả dưa hấu. Ở chế độ một bé thì đây là khoảnh khắc để khoe
     * chứ không phải để kết thúc — bé vẫn chơi tiếp, và hai quả dưa gặp nhau
     * sau đó sẽ nổ tung dọn chỗ. Ở chế độ hai bé thì ai ra dưa trước là thắng
     * luôn, vì cần một cái đích rõ ràng để hai bé còn đua. */
    function onMelon(box) {
        sfx.melon();
        shake(box, 2.2, 0.4);
        if (G.kids > 1) {
            box.won = true;
            endDuo(box.kid, 'First watermelon!');
        } else if (!G.melonSeen) {
            G.melonSeen = true;
            showTip('WATERMELON! 🍉', 3200);
        }
    }

    function topOut(box) {
        /* Hai thùng cùng tràn trong đúng một khung hình là chuyện hiếm nhưng
         * có thật; không chặn ở đây thì bảng kết quả bị viết đè hai lần và
         * tuyên bố nhầm người thắng. */
        if (G.mode !== 'play') return;
        box.over = true;
        shake(box, 3, 0.5);
        if (G.kids === 1) { endSolo(); return; }
        const other = G.boxes[box.kid === 1 ? 1 : 0];
        endDuo(other.kid, 'The other basket overflowed');
    }

    function frame(now) {
        const t = now / 1000;
        let dt = last ? t - last : 0;
        last = t;
        if (dt > 0.05) dt = 0.05;
        G.time += dt;

        update(dt);
        draw();
        requestAnimationFrame(frame);
    }

    function init() {
        store.load();
        sfx.init();
        /* Dựng sẵn một thùng để bảng chào có cái nền trái cây nhìn cho vui */
        G.boxes = [makeBox(1)];
        resize();
        openMenu();
        wireInput();
        wireButtons();

        window.addEventListener('resize', resize);
        if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
        window.addEventListener('orientationchange', () => setTimeout(resize, 200));

        /* ?kids=2 mở thẳng vào ván hai bé, khỏi bấm qua bảng chào. Tiện cho bố
         * mẹ đặt sẵn một đường dẫn cho hai anh em, và tiện cho máy soát giao
         * diện chụp ảnh màn chơi thật. */
        const want = +(new URLSearchParams(location.search).get('kids') || 0);
        if (want === 1 || want === 2) setTimeout(() => startGame(want), 0);

        window.melonDrop = {
            G, FRUITS, BW, BH, DANGER_Y, HOLD_Y, TOP_TIER, STEP,
            makeBox, addFruit, stepBox, overLine, pickTier, store,
            start: k => startGame(k),
            /* Đẩy đồng hồ của game đi một nhịp, đúng cái nhịp mà mỗi khung hình
             * vẫn gọi. Máy soát giao diện cần cửa này vì Chrome không cửa sổ
             * chạy requestAnimationFrame rất thưa, mà không có nhịp thì đồng hồ
             * vạch đỏ không chạy và bảng "đầy thùng" không bao giờ hiện ra —
             * tức là đúng cái đoạn cần soát lại là đoạn không soi được. */
            tick: dt => update(dt),
            /* Thả hộ một quả — máy soát giao diện dùng cửa này để chơi thay bé */
            drop: (i, x) => {
                const box = G.boxes[i || 0];
                if (!box) return false;
                if (x != null) { box.aimX = x; aimClamp(box); }
                box.dropCd = 0;
                dropAt(i || 0);
                return true;
            },
            state: () => ({
                mode: G.mode, kids: G.kids,
                boxes: G.boxes.map(b => ({
                    score: b.score, fruits: b.fruits.length,
                    best: b.bestTier, over: b.over, danger: +b.dangerT.toFixed(2)
                }))
            })
        };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
