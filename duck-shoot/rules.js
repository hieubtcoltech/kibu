/**
 * BẮN VỊT — luật chơi và bảng vòng đấu
 * ----------------------------------------------------------------------------
 * Tệp này KHÔNG biết gì về Phaser lẫn việc vẽ. Nó chỉ trả lời ba câu:
 *   · một ván gồm mấy vòng, mỗi vòng cảnh gì, vịt bay kiểu gì
 *   · một vòng thả ra những con vịt nào, lúc nào, ở độ cao nào
 *   · bắn trúng thì được mấy điểm
 *
 * VÌ SAO TÁCH RA
 * Cả trò chơi đứng hay đổ ở một câu: BỐN BÉ CÓ CƠ HỘI NGANG NHAU KHÔNG. Đàn
 * vịt bay xuyên qua bốn làn, nên bé ở đầu hướng bay bao giờ cũng gặp vịt
 * trước — nếu vòng nào cũng bay một chiều thì bé số 1 thắng bằng chỗ ngồi chứ
 * không phải bằng tay. Tách luật ra khỏi phần vẽ thì máy soát nạp thẳng tệp
 * này, chạy trọn một ván và ĐẾM được số cơ hội của từng bé.
 *
 * CÁCH CHỐNG THIÊN VỊ — em phải nghĩ lại một lần
 *
 * Ý đầu của em: vịt bay ngang xuyên qua cả bốn làn, vòng nào đổi chiều một
 * lần. Nghe thì công bằng, nhưng viết ra bảng vòng đấu mới thấy hỏng: bay
 * ngang thì chỉ có hai làn ngoài cùng được gặp vịt ĐẦU TIÊN. Ba bé chơi thì bé
 * ở giữa không bao giờ có cơ hội bắn trước — con vịt nào tới tay bé ấy cũng là
 * con hai bé kia đã bắn trượt. Đổi chiều bao nhiêu lần cũng không cứu được.
 *
 * Cách làm đúng: vịt BẬT LÊN TỪ BỤI CỎ ở một chỗ bất kỳ trên cả bề ngang, rồi
 * mới bay chéo lên và thoát ra. Chỗ bật lên rải đều khắp màn hình, nên làn nào
 * cũng có cơ hội gặp vịt đầu tiên đúng bằng nhau — công bằng nằm ngay trong
 * cách dựng, không phải nhờ vá víu. Con vịt bật lên ở làn bé 2 mà bé 2 trượt
 * thì nó bay chéo sang làn bé 3, rồi bé 4 — vẫn giữ nguyên cái hồi hộp "con
 * vịt đang trôi dần sang làn mình".
 *
 * check-fair.js chạy hàng nghìn ván rồi đếm: mỗi làn được gặp vịt trước bao
 * nhiêu lần, và tổng thời gian vịt nằm trong tầm bắn của từng làn là bao lâu.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.DuckRules = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Sáu vòng, mỗi vòng một cảnh và một kiểu bay. Số chẵn để hai chiều bay
     * chia đều — ba vòng bay sang phải, ba vòng bay sang trái. */
    var ROUNDS = [
        {
            key: 'dawn', vi: 'Bình minh đồng cỏ', en: 'Dawn Meadow',
            fly: 'straight', ducks: 9, speed: [150, 190], gap: 1.25, crowRate: 0,
            moods: [['rise', 0.62], ['runner', 0.38]],
            hint_vi: 'Vài con chạy trên bờ đã rồi mới bay. Quen tay đi.',
            hint_en: 'Some ducks run along the bank first. Warm up.'
        },
        {
            key: 'lake', vi: 'Hoàng hôn mặt hồ', en: 'Sunset Lake',
            fly: 'wave', ducks: 10, speed: [175, 215], gap: 1.15, crowRate: 0.14,
            moods: [['rise', 0.34], ['diver', 0.46], ['runner', 0.20]],
            hint_vi: 'Vịt bơi trên ao, lặn xuống rồi ngoi lên chỗ khác.',
            hint_en: 'Ducks swim, dive, and surface somewhere else.'
        },
        {
            key: 'night', vi: 'Đêm đom đóm', en: 'Firefly Night',
            fly: 'straight', ducks: 10, speed: [195, 240], gap: 1.05, dark: true, crowRate: 0.12,
            moods: [['rise', 0.40], ['hider', 0.42], ['runner', 0.18]],
            hint_vi: 'Trời tối, vịt lại hay chui vào bụi cây. Chờ nó ló ra.',
            hint_en: 'Dark out, and ducks hide in the bushes. Wait for them.'
        },
        {
            key: 'storm', vi: 'Trời nổi bão', en: 'Storm Front',
            fly: 'gust', ducks: 11, speed: [205, 255], gap: 1.0, wind: true, crowRate: 0.18,
            moods: [['rise', 0.36], ['panic', 0.46], ['runner', 0.18]],
            hint_vi: 'Gió giật, vịt hoảng bay loạn xạ. Khó ngắm lắm!',
            hint_en: 'Panicked ducks fly wild. Hard to aim!'
        },
        {
            key: 'flock', vi: 'Đàn vịt kéo về', en: 'The Big Flock',
            fly: 'vform', ducks: 14, speed: [215, 260], gap: 0.72, crowRate: 0.20,
            moods: [['rise', 0.50], ['runner', 0.22], ['hider', 0.16], ['panic', 0.12]],
            hint_vi: 'Cả đàn kéo về một lúc. Bắn nhanh tay!',
            hint_en: 'The whole flock at once. Fire fast!'
        },
        {
            key: 'golden', vi: 'Vòng vàng', en: 'Golden Round',
            fly: 'wave', ducks: 12, speed: [255, 310], gap: 0.85, goldRate: 0.55, crowRate: 0.12,
            moods: [['rise', 0.44], ['panic', 0.30], ['diver', 0.14], ['runner', 0.12]],
            hint_vi: 'Vịt vàng bay rất nhanh, điểm gấp ba.',
            hint_en: 'Golden ducks, fast and worth triple.'
        }
    ];

    /* Ba loại vịt. Con nhỏ bay nhanh hơn và đáng điểm hơn — thưởng cho tay
     * chắc, chứ không phải thưởng cho ai bấm loạn. */
    var KINDS = {
        big: { pts: 1, r: 30, vs: 0.88 },
        small: { pts: 2, r: 22, vs: 1.18 },
        gold: { pts: 5, r: 24, vs: 1.35 },
        /* CHIM LẠ — bắn nhầm là trừ điểm.
         *
         * Ý của anh Hiếu, và nó chữa đúng chỗ yếu nhất của trò chơi: không có
         * nó thì bé chỉ việc bấm liên tục vào chỗ nào có động là ăn điểm, mắt
         * không cần làm gì. Có nó thì mỗi phát bắn là một quyết định.
         *
         * Trừ 3 điểm — nặng hơn con vịt to (1 điểm) nhưng nhẹ hơn con vàng
         * (5 điểm), nên bé nhỡ tay không mất trắng cả vòng, mà cũng đủ xót để
         * lần sau nhìn cho kỹ. Điểm không bao giờ tụt xuống dưới 0, phần này
         * game lo — bé mà thấy điểm âm là nản, bỏ chơi luôn. */
        crow: { pts: -3, r: 26, vs: 1.02, decoy: true }
    };

    /* Chuỗi bắn trúng liên tiếp: nhân điểm dần, chặn trần ở 3 để một bé đang
     * dẫn không bỏ xa cả bàn tới mức mấy bé kia buông tay. */
    var COMBO_STEP = [1, 1, 1.5, 2, 2.5, 3];
    function comboMult(streak) {
        return COMBO_STEP[Math.min(streak, COMBO_STEP.length - 1)];
    }

    /* Chim lạ bị trừ ĐÚNG 3 điểm, không nhân theo chuỗi. Nhân theo chuỗi thì
     * bé đang bắn hay nhất lại bị phạt nặng nhất — đúng ngược với ý muốn, vì
     * chuỗi dài là phần thưởng chứ không phải cái bẫy. */
    function score(kind, streak) {
        var k = KINDS[kind];
        if (k.decoy) return k.pts;
        return Math.round(k.pts * comboMult(streak));
    }

    function isDecoy(kind) { return !!(KINDS[kind] && KINDS[kind].decoy); }

    /* MỘT CHỖ DUY NHẤT định nghĩa mặt đất, mép trên và mặt ao.
     *
     * Trước đây con số 0.86 nằm rải ở ba tệp: rules.js, game.js và
     * check-fair.js. Ba bản sao của cùng một con số là ba cơ hội để chúng lệch
     * nhau, mà lệch thì máy soát đo một thế giới còn bé chơi một thế giới khác
     * — đúng cái sai nguy hiểm nhất, vì nó không báo lỗi mà chỉ âm thầm làm
     * mọi phép đo vô nghĩa. Giờ ai cần thì hỏi ở đây. */
    var GROUND_AT = 0.80;      // mặt đất nằm ở 80% chiều cao
    var TOP_AT = 0.097;        // trên mức này là khuất tầm bắn
    var POND_AT = 0.45;        // vịt nổi ở 45% quãng từ mặt đất xuống đáy

    function groundOf(H) { return H * GROUND_AT; }
    function topOf(H) { return Math.round(H * TOP_AT); }
    function pondOf(H) { var g = groundOf(H); return g + (H - g) * POND_AT; }

    /* ------------------------------------------------------------------ *
     * NĂM KIỂU CON VỊT XỬ SỰ
     *
     * Ý anh Hiếu: đừng để con nào cũng bật lên rồi bay thẳng. Cho nó chạy
     * trên bờ, nấp bụi cây, lặn xuống ao, thỉnh thoảng bay loạn xạ.
     *
     * Chỗ then chốt về mặt dựng: TẤT CẢ đều nằm trong duckAt() — một hàm
     * thuần tuý, cho vào (con vịt, giây thứ mấy) thì trả ra chỗ nó đang ở.
     * Nhờ vậy máy soát công bằng không phải sửa một dòng nào về cách bay: nó
     * vẫn gọi đúng hàm ấy, và mọi kiểu mới tự động được đo. Nếu em nhét cách
     * bay vào phần vẽ thì máy soát sẽ đo một đằng bé chơi một nẻo — mà đó
     * đúng là cái bẫy em đã tránh từ đầu khi tách rules.js ra.
     * ------------------------------------------------------------------ */
    function pickMode(moods, r) {
        if (!moods) return 'rise';
        var acc = 0;
        for (var i = 0; i < moods.length; i++) {
            acc += moods[i][1];
            if (r < acc) return moods[i][0];
        }
        return 'rise';
    }

    /* Chỗ mọc bụi cây của một vòng.
     *
     * Bụi phải mọc sẵn từ đầu vòng chứ không hiện ra đúng lúc có con vịt định
     * chui vào — hiện ra thì thành lời mách nước, bé cứ nhè bụi mới mọc mà
     * canh. Và phải có cả BỤI KHÔNG CÓ GÌ: nếu bụi nào cũng giấu một con vịt
     * thì đếm bụi là biết còn mấy con, hết hồi hộp.
     */
    function bushes(round, seed, W, H) {
        var out = [];
        var f = flock(round, seed, W, H);
        for (var i = 0; i < f.length; i++) {
            if (f[i].mode !== 'hider') continue;
            out.push({ x: fold(f[i].x0 + f[i].dir * f[i].runSpeed * f[i].runT, W, 1).x, decoy: false });
        }
        /* Bụi trống, rải đều bằng chính hạt của vòng. Chúng còn một việc nữa
         * ngoài việc đánh lạc hướng: bụi trống được đặt gần ống kính hơn và vẽ
         * to hơn, nên dải tiền cảnh mới có lớp lang chứ không phẳng lì. */
        var rnd = rng(seed + round * 104729);
        for (var j = 0; j < 7; j++) out.push({ x: Math.round(W * rnd()), decoy: true, depth: rnd() });
        return out.sort(function (a, b) { return a.x - b.x; });
    }

    /* Số ngẫu nhiên GIEO HẠT. Cùng một hạt thì cả ván y hệt nhau, nhờ vậy máy
     * soát đo được và hai bé chơi cùng một vòng gặp cùng một đàn vịt. */
    function rng(seed) {
        var s = seed | 0;
        return function () {
            s = (s + 0x6D2B79F5) | 0;
            var t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* Dựng danh sách vịt của một vòng.
     *
     *   round  chỉ số vòng (0…5)
     *   seed   hạt ngẫu nhiên
     *   W, H   khổ vùng trời
     *
     * Trả về [{t, kind, x0, speed, dir, rise, amp, phase}]:
     *   t      giây thứ mấy thì con vịt bật lên
     *   x0     bật lên ở đâu trên bề ngang — RẢI ĐỀU, đây là chỗ giữ công bằng
     *   dir    +1 bay chéo sang phải, −1 sang trái
     *   rise   độ dốc bay lên (ô/giây)
     */
    function flock(round, seed, W, H) {
        var R = ROUNDS[round % ROUNDS.length];
        var rnd = rng(seed + round * 7919);
        var out = [];
        var t = 0.6;

        /* Tốc độ nhân theo khổ thế giới. Bầu trời trên điện thoại cầm dựng chỉ
         * rộng 720 ô nhưng cao hơn nhiều; giữ nguyên số ô/giây thì vịt bay
         * ngang vụt qua trong chớp mắt còn bay lên thì ì ạch mãi không khuất.
         * Nhân theo khổ thì bé cầm máy kiểu nào cũng thấy con vịt bay "nhanh
         * như nhau", và số giây một vòng gần như không đổi. */
        var sx = W / 1280, sy = H / 720;
        for (var i = 0; i < R.ducks; i++) {
            /* Bốc loại: chim lạ trước, rồi mới tới ba loại vịt. Bốc riêng một
             * lần rút cho chim lạ chứ không nhét chung vào bảng xác suất vịt —
             * như vậy chỉnh mật độ chim lạ của một vòng không làm xê dịch tỉ lệ
             * vịt vàng của vòng ấy. */
            var crow = R.crowRate ? rnd() < R.crowRate : false;
            var gold = !crow && (R.goldRate ? rnd() < R.goldRate : rnd() < 0.08);
            var small = !crow && !gold && rnd() < 0.42;
            var kind = crow ? 'crow' : (gold ? 'gold' : (small ? 'small' : 'big'));
            var sp = R.speed[0] + rnd() * (R.speed[1] - R.speed[0]);

            /* Chỗ bật lên rải đều trên TOÀN BỀ NGANG, không chừa mép.
             *
             * Bản đầu em chừa 6% mỗi mép cho con vịt khỏi bật lên sát viền.
             * Nghe thì vô hại, nhưng máy soát công bằng bắt được ngay: hai làn
             * ngoài cùng vì thế có vùng bật lên hẹp hơn hai làn giữa, và với
             * bốn bé thì số lần gặp vịt trước lệch tới 28%. Bé ngồi giữa thắng
             * bằng chỗ ngồi. Rải đều thật thì mới công bằng thật. */
            var x0 = W * rnd();

            /* Chiều bay: đúng 50–50, KHÔNG phụ thuộc chỗ bật lên.
             *
             * Bản trước em ép con vịt bật lên sát mép phải bay ngược vào
             * trong, sợ nó ra khỏi màn ngay. Từ khi cho vịt vòng lại ở hai mép
             * thì nỗi lo ấy không còn — mà cái luật ép ấy lại đẩy vịt dồn về
             * giữa màn, khiến làn giữa được ngắm lâu hơn tới 10% và số vịt đi
             * qua nhiều hơn 26%. Máy soát công bằng chỉ đúng vào chỗ này. Bỏ
             * luật ép đi thì mọi làn đối xứng hoàn toàn. */
            var dir = rnd() < 0.5 ? 1 : -1;

            var mode = pickMode(R.moods, rnd());

            var d = {
                t: +t.toFixed(3),
                kind: kind,
                mode: mode,
                x0: Math.round(x0),
                speed: Math.round(sp * KINDS[kind].vs * sx),
                dir: dir,
                rise: Math.round((88 + rnd() * 52) * KINDS[kind].vs * sy),
                amp: (R.fly === 'wave' ? 26 + rnd() * 44 : (R.fly === 'gust' ? 14 + rnd() * 28 : 0)) * sy,
                phase: rnd() * Math.PI * 2
            };

            /* Số đo riêng của từng kiểu. Bốc HẾT mọi số ở đây, kể cả những số
             * kiểu này không dùng tới — có vậy thì đổi tỉ lệ kiểu của một vòng
             * mới không làm xê dịch mọi con vịt phía sau trong cùng một hạt. */
            var runT = 0.9 + rnd() * 1.0;
            var runSpeed = (54 + rnd() * 46) * sx;
            var hideT = 0.9 + rnd() * 1.0;
            var swimT = 1.0 + rnd() * 0.8;
            var downT = 0.9 + rnd() * 0.7;
            var dives = rnd() < 0.45 ? 2 : 1;
            var zig = (46 + rnd() * 62) * sx;

            if (mode === 'runner') { d.runT = runT; d.runSpeed = runSpeed; }
            if (mode === 'hider') { d.runT = runT * 0.75; d.runSpeed = runSpeed; d.hideT = hideT; }
            if (mode === 'diver') {
                d.swimT = swimT; d.downT = downT; d.dives = dives;
                d.swimSpeed = runSpeed * 0.72;
            }
            if (mode === 'panic') { d.zig = zig; d.rise = Math.round(d.rise * 1.22); }

            out.push(d);
            t += R.gap * (0.72 + rnd() * 0.56);
        }
        return out;
    }

    /* Đường bay của một con vịt tại giây dt kể từ lúc nó bật lên.
     *
     * VỊT LƯỢN VÒNG, KHÔNG BAY THẲNG RA KHỎI MÀN. Chạm mép trái hay mép phải
     * thì nó vòng lại, cứ thế bay lên cao dần cho tới khi khuất khỏi tầm bắn.
     * Đúng như đàn vịt bị đánh động: chúng lượn vòng trên đầm rồi mới lên cao
     * và đi.
     *
     * Đây không phải chi tiết cho đẹp mà là CHỖ GIỮ CÔNG BẰNG. Cho vịt bay
     * thẳng ra mép thì làn giữa hứng vịt từ cả hai phía còn làn ngoài cùng chỉ
     * hứng từ một phía — máy soát đo được: làn giữa được ngắm lâu hơn 16% và
     * điểm đi qua nhiều hơn 21%. Cho vịt vòng lại thì mọi làn đối xứng nhau,
     * chênh lệch biến mất.
     *
     * Hàm này dùng chung cho phần vẽ và cho máy soát — hai bên phải nhìn đúng
     * một đường bay, không thì soát một đằng chơi một nẻo.
     */
    /* Gấp đường đi ngang vào trong khoảng [0, W] — đi thẳng bao xa cũng quy về
     * được, nên không phải mô phỏng từng cú vòng. */
    function fold(raw, W, dir) {
        var span = W > 0 ? W : 1;
        var m = ((raw % (2 * span)) + 2 * span) % (2 * span);
        return { x: m <= span ? m : 2 * span - m, turn: m > span ? -dir : dir };
    }

    function duckAt(d, dt, groundY, W, H) {
        H = H || groundY / GROUND_AT;
        var pondY = groundY + (H - groundY) * POND_AT;   // chỗ vịt nổi trên mặt ao
        var mode = d.mode || 'rise';
        var f, y, t2, run;

        /* ---- CHẠY TRÊN BỜ rồi mới cất cánh ---- */
        if (mode === 'runner') {
            if (dt < d.runT) {
                f = fold(d.x0 + d.dir * d.runSpeed * dt, W, d.dir);
                /* nhấp nhô theo nhịp chân — đứng yên một độ cao thì trông như
                 * bị dán vào nền, không ra dáng đang chạy */
                y = groundY - 8 - Math.abs(Math.sin(dt * 9.5)) * 9;
                return { x: f.x, y: y, turn: f.turn, hidden: false, state: 'ground' };
            }
            t2 = dt - d.runT;
            run = d.dir * d.runSpeed * d.runT;
            f = fold(d.x0 + run + d.dir * d.speed * t2, W, d.dir);
            y = groundY - d.rise * t2;
            if (d.amp) y += Math.sin(t2 * 3.1 + d.phase) * d.amp;
            return { x: f.x, y: y, turn: f.turn, hidden: false, state: 'air' };
        }

        /* ---- CHẠY RỒI CHUI VÀO BỤI, biến mất một lúc, rồi vọt ra ---- */
        if (mode === 'hider') {
            if (dt < d.runT) {
                f = fold(d.x0 + d.dir * d.runSpeed * dt, W, d.dir);
                y = groundY - 8 - Math.abs(Math.sin(dt * 9.5)) * 9;
                return { x: f.x, y: y, turn: f.turn, hidden: false, state: 'ground' };
            }
            run = d.dir * d.runSpeed * d.runT;
            f = fold(d.x0 + run, W, d.dir);
            if (dt < d.runT + d.hideT) {
                /* Trong bụi: KHÔNG bắn được. Chỗ này là lý do phải trả thêm cờ
                 * hidden ra ngoài — máy soát công bằng phải bỏ qua những giây
                 * ấy, không thì nó tính cả thời gian bé không thể làm gì vào
                 * "giây được ngắm", và phép đo hoá ra rộng rãi hơn sự thật. */
                return { x: f.x, y: groundY - 6, turn: f.turn, hidden: true, state: 'bush' };
            }
            t2 = dt - d.runT - d.hideT;
            var f3 = fold(d.x0 + run + d.dir * d.speed * t2, W, d.dir);
            y = groundY - d.rise * t2;
            if (d.amp) y += Math.sin(t2 * 3.1 + d.phase) * d.amp;
            return { x: f3.x, y: y, turn: f3.turn, hidden: false, state: 'air' };
        }

        /* ---- BƠI TRÊN AO, LẶN XUỐNG, NGOI LÊN CHỖ KHÁC, rồi bay ---- */
        if (mode === 'diver') {
            var cycle = d.swimT + d.downT;
            var total = cycle * d.dives;
            if (dt < total) {
                /* Bơi và lặn đều đi ngang cùng một tốc độ, nên con vịt ngoi lên
                 * ở CHỖ KHÁC chỗ nó lặn xuống — đấy mới là cái làm bé nín thở
                 * nhìn mặt nước. */
                f = fold(d.x0 + d.dir * d.swimSpeed * dt, W, d.dir);
                var inCycle = dt % cycle;
                if (inCycle < d.swimT) {
                    y = pondY + Math.sin(dt * 2.4 + d.phase) * 4;
                    return { x: f.x, y: y, turn: f.turn, hidden: false, state: 'water' };
                }
                return { x: f.x, y: pondY, turn: f.turn, hidden: true, state: 'under' };
            }
            t2 = dt - total;
            var swum = d.dir * d.swimSpeed * total;
            var f4 = fold(d.x0 + swum + d.dir * d.speed * t2, W, d.dir);
            y = pondY - (pondY - groundY) - d.rise * t2;
            if (d.amp) y += Math.sin(t2 * 3.1 + d.phase) * d.amp;
            return { x: f4.x, y: y, turn: f4.turn, hidden: false, state: 'air' };
        }

        /* ---- BAY LOẠN XẠ: giật ngang giật dọc, khó ngắm hẳn ---- */
        if (mode === 'panic') {
            /* Hai sóng khác tần số cộng vào nhau. Một sóng thôi thì thành nhịp
             * đều, bé bắt được nhịp là bắn trúng đều; cộng hai sóng lệch tần
             * thì đường bay không lặp lại, phải nhìn chứ không đoán được. */
            var wob = Math.sin(dt * 6.3 + d.phase) * d.zig
                + Math.sin(dt * 11.7 + d.phase * 2) * d.zig * 0.45;
            f = fold(d.x0 + d.dir * d.speed * dt + wob, W, d.dir);
            y = groundY - d.rise * dt + Math.sin(dt * 8.1 + d.phase) * d.zig * 0.26;
            return { x: f.x, y: y, turn: f.turn, hidden: false, state: 'air' };
        }

        /* ---- BẬT LÊN BAY THẲNG (kiểu gốc) ---- */
        y = groundY - d.rise * dt;
        if (d.amp) y += Math.sin(dt * 3.1 + d.phase) * d.amp;
        f = fold(d.x0 + d.dir * d.speed * dt, W, d.dir);
        return { x: f.x, y: y, turn: f.turn, hidden: false, state: 'air' };
    }

    /* Con vịt còn trong tầm bắn không: nó chỉ thoát bằng đường LÊN CAO, vì
     * hai mép bên đã vòng lại rồi.
     *
     * top là mép dưới của dải bảng điểm. Bản đầu em cho vịt bay thêm 60 ô nữa
     * mới tính là thoát, và ảnh chụp thử lộ ngay: con vịt chui vào sau thẻ
     * điểm rồi nằm đó, bé nhìn thấy nửa cái đuôi mà bắn không tới. Cho nó biến
     * mất ngay dưới dải bảng điểm thì không còn chỗ nào bắn được mà không nhìn
     * thấy. */
    function inView(p, W, top) {
        return p.y > top;
    }

    /* Một vòng kéo dài bao lâu: con cuối cùng bật lên rồi còn phải bay hết
     * tầm nhìn. Lấy quãng NGẮN hơn trong hai quãng — ngang và dọc — vì con vịt
     * thoát ra ở mép nào trước thì mất ở mép ấy. */
    /* Một vòng kéo dài bao lâu: con cuối cùng bật lên rồi còn phải bay lên
     * khuất tầm bắn. Vịt vòng lại ở hai mép nên chỉ thoát bằng đường lên cao,
     * tính theo độ dốc bay lên là đủ. */
    function roundTime(round, seed, W, H) {
        var f = flock(round, seed, W, H);
        var groundY = groundOf(H), top = topOf(H);
        var last = 0;
        /* Bay thử THẬT từng con thay vì tính bằng công thức.
         *
         * Công thức cũ — quãng đường chia độ dốc — chỉ đúng hồi con nào cũng
         * bật lên bay thẳng. Từ khi có con chạy trên bờ, con nấp bụi, con lặn
         * xuống ao thì trước lúc cất cánh nó còn mất thêm mấy giây nữa, và
         * công thức ấy đếm thiếu. Bay thử thì kiểu nào mới thêm sau này cũng
         * tự khắc tính đúng, không phải nhớ quay lại sửa chỗ này. */
        for (var i = 0; i < f.length; i++) {
            var t = 0;
            while (t < 30) {
                var p = duckAt(f[i], t, groundY, W, H);
                if (!inView(p, W, top)) break;
                t += 1 / 20;
            }
            last = Math.max(last, f[i].t + t);
        }
        return last + 0.8;
    }

    return {
        ROUNDS: ROUNDS,
        KINDS: KINDS,
        comboMult: comboMult,
        score: score,
        isDecoy: isDecoy,
        rng: rng,
        flock: flock,
        bushes: bushes,
        GROUND_AT: GROUND_AT,
        groundOf: groundOf,
        topOf: topOf,
        pondOf: pondOf,
        duckAt: duckAt,
        inView: inView,
        roundTime: roundTime
    };
}));
