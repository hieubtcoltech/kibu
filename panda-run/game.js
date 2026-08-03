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

    const RUN_START = 6;         // tốc độ chạy lúc mới xuất phát (u/giây)
    const RUN_MAX = 14;          // trần tốc độ
    /* Đường cong hình chữ S: đoạn đầu gần như phẳng cho bé làm quen ngón tay,
     * giữa quãng mới dốc lên, cuối lại thoải dần nên chạy nghìn mét vẫn còn chỗ
     * nhanh thêm.
     *
     * Trước dùng hàm bão hoà (1 - e^-m/H), nhưng hàm đó dốc nhất đúng ngay lúc
     * xuất phát — sai hẳn chỗ cần: bé còn chưa biết chạm vào đâu thì màn hình
     * đã trôi mỗi lúc một nhanh. Còn tăng tuyến tính thì hai trăm mét là chạm
     * trần, từ đó lượt chơi phẳng lì.
     *
     * Quãng nửa đường đặt tận 1100 m — xa hơn nhiều lần một lượt chơi thường
     * của bé. Cố ý: game này để bé quay lại chơi lâu dài chứ không phải để vắt
     * kiệt trong ba phút, nên tốc độ phải còn chỗ nhích lên suốt mấy nghìn mét
     * về sau, chứ không dồn hết cái khó vào một phút đầu. */
    const RUN_MID = 1100;        // chạy tới đây thì được nửa quãng tăng tốc

    const GRAV = 52;             // trọng lực (u/giây²)
    /* Nhảy ba mức, chỉ khác nhau ở chỗ bé giữ tay bao lâu:
     *
     *   chạm rồi thả ngay  → nhảy ~1,2 u, vừa đủ qua hòn đá thấp
     *   chạm bình thường   → nhảy ~2,7 u
     *   chạm rồi giữ tay   → nhảy ~4,0 u, tới được bệ cao và hố rộng nhất
     *
     * Hai cơ chế ghép lại mới ra được ba mức đó. Giữ tay thì trọng lực nhẹ đi
     * (bay lên lâu hơn); thả tay sớm thì CẮT bớt đà đang bay lên. Chỉ có vế
     * giữ tay thôi là không đủ: cú chạm nhanh nhất vẫn bay gần hết tầm, vì đà
     * bật ban đầu đã ném bé lên rồi. */
    const JUMP_V = 14.0;         // vận tốc bật lên
    const JUMP_CUT = 11.0;       // thả tay sớm thì đà bay lên chỉ còn bấy nhiêu
    const HOLD_T = 0.26;         // giữ tay thêm bấy nhiêu giây thì nhảy cao hơn
    const HOLD_G = 0.32;         // lúc đang giữ thì trọng lực chỉ còn bấy nhiêu
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
        BRANCH: 'branch',   // khúc gỗ đổ, phải trượt xuống mới chui lọt
        /* Thú canh: chướng ngại BIẾT CỬ ĐỘNG, và là kẻ đã nhốt các bạn nhỏ.
         * Game tên là Giải Cứu Bạn mà không có kẻ nào nhốt thì chuồng hoá ra
         * tự mọc giữa rừng — có đứa canh thì việc cứu mới thành việc phải
         * giành lấy. Vài con đứng ngay trước chuồng, đúng nghĩa canh giữ. */
        GUARD: 'guard',
        PLAT: 'plat',       // bệ lơ lửng, đứng lên được
        COIN: 'coins',
        FRIEND: 'friend',
        POWER: 'power'
    };

    const POWER = { SHIELD: 'shield', MAGNET: 'magnet', ROCKET: 'rocket' };

    /* Sáu vùng cảnh, đổi sau mỗi ZONE_LEN mét. Đổi cảnh không chỉ cho đẹp: nó
     * là cái mốc để bé biết mình đã đi được xa tới đâu, con số mét trên HUD
     * chạy quá nhanh nên mắt không bám kịp.
     *
     * Chạy chậm thì mỗi mét lâu hơn, nên quãng đổi cảnh để ngắn cho lần đổi
     * cảnh đầu tiên vẫn tới trong khoảng nửa phút. */
    const ZONE_LEN = 110;
    const ZONES = [
        {
            key: 'jungle', name: 'Green Forest',
            sky: ['#0b3d2e', '#125c3f', '#2f8f5b'],
            far: '#0d4733', mid: '#116b46', ground: '#1f7a4d', dirt: '#134e33',
            accent: '#ffd43b'
        },
        {
            key: 'desert', name: 'Desert',
            sky: ['#8a4a15', '#c2711f', '#efc069'],
            far: '#a35c1e', mid: '#c9822f', ground: '#e6c377', dirt: '#b3894a',
            accent: '#fff3bf'
        },
        {
            key: 'ice', name: 'Frozen Land',
            sky: ['#0a3555', '#12608f', '#6fc4e0'],
            far: '#12547f', mid: '#2f8db8', ground: '#d6f0ff', dirt: '#8dc4dd',
            accent: '#8ed0ff'
        },
        {
            key: 'city', name: 'Big City',
            sky: ['#0e1830', '#22314f', '#5b7099'],
            far: '#1a2740', mid: '#2c3d5e', ground: '#5d6480', dirt: '#343a4d',
            accent: '#ffd43b'
        },
        {
            key: 'lava', name: 'Lava Land',
            sky: ['#2b0704', '#71190a', '#c94a16'],
            far: '#4a0f07', mid: '#8a2410', ground: '#4f2719', dirt: '#2b120b',
            accent: '#ff922b'
        },
        {
            key: 'fairy', name: 'Fairy Castle',
            sky: ['#1b0b33', '#3a1a63', '#8452b0'],
            far: '#26104a', mid: '#4a2388', ground: '#63409a', dirt: '#33195e',
            accent: '#ff9de2'
        }
    ];

    /* Sáu bạn cần giải cứu, đúng bộ trong bản thiết kế. Mỗi bạn là một loài
     * riêng chứ không phải một quả bóng đổi màu: bé phải nhận ra mình vừa cứu
     * được CON GÌ thì việc cứu mới có nghĩa với bé. */
    const ANIMALS = [
        { key: 'rabbit', name: 'Rabbit', main: '#e4ebf3', dark: '#a3aebd', soft: '#ffd3e0' },
        { key: 'fox', name: 'Fox', main: '#ff9f45', dark: '#d1580d', soft: '#fff1e0' },
        /* Khỉ để nâu ngả vàng hẳn, khác gấu nâu đỏ — hai con cùng thân tròn tai
         * tròn, chỉ còn màu với cái đuôi để phân biệt. */
        { key: 'monkey', name: 'Monkey', main: '#c99a5e', dark: '#8d6432', soft: '#f7e3c2' },
        { key: 'chick', name: 'Chick', main: '#ffd93b', dark: '#e0a400', soft: '#fff6c8' },
        { key: 'elephant', name: 'Elephant', main: '#a9c7e8', dark: '#6f93bd', soft: '#dfeaf8' },
        { key: 'bear', name: 'Bear Cub', main: '#c98a4b', dark: '#8a5626', soft: '#f3ddc0' }
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
            out.push({ t: T.COIN, x: x, y: 1.1 + top * (1 - k * k) });
        }
        return out;
    }

    function line(x0, n, y, step) {
        const out = [];
        for (let i = 0; i < n; i++) out.push({ t: T.COIN, x: x0 + i * (step || 1.1), y: y });
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
        /* Thú canh xuất hiện ngay ở mức dễ, một mình giữa đường trống, để bé
         * làm quen với nó như một chướng ngại bình thường trước đã. Để dành tới
         * mức khó mới cho gặp thì phần lớn lượt chơi ngắn chẳng bao giờ thấy
         * mặt kẻ đã nhốt bạn mình. */
        {
            w: 22, tier: 0, items: [].concat(
                [{ t: T.GUARD, x: 10 }],
                arc(7.2, 12.8, 2.0)
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
                /* Con canh đứng ngay trước chuồng: muốn cứu bạn thì phải vượt
                 * qua nó đã. Đây là chỗ chủ đề của game hiện ra thành luật chơi
                 * chứ không chỉ nằm trong cái tên. */
                [{ t: T.GUARD, x: 12.2 }, { t: T.FRIEND, x: 14, y: 1.75 }]
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
                { t: T.ROCK, x: 14.4, h: 1.1 }, { t: T.GUARD, x: 22 },
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
                [{ t: T.GUARD, x: 28 }, { t: T.FRIEND, x: 30, y: 1.75 }]
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
                { t: T.GAP, x: 24, w: 5.4 }, { t: T.GUARD, x: 32 },
                { t: T.FRIEND, x: 34, y: 1.75 }],
                arc(7, 13.5, 2.2), arc(15, 21.7, 2.2), arc(23, 30, 2.2)
            )
        },
        {
            w: 40, tier: 3, items: [].concat(
                [{ t: T.ROCK, x: 8, h: 1.2 }, { t: T.BRANCH, x: 11.5 },
                { t: T.ROCK, x: 15, h: 1.2 }, { t: T.BRANCH, x: 18.5 },
                { t: T.GUARD, x: 22 }, { t: T.FRIEND, x: 30, y: 1.75 },
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
        data: { best: 0, bestPals: 0, coins: 0, runs: 0 },

        load() {
            try {
                const raw = localStorage.getItem(STORE_KEY);
                if (raw) Object.assign(this.data, JSON.parse(raw));
            } catch (e) { /* chế độ riêng tư: chơi được nhưng không nhớ */ }
        },
        save() {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        record(dist, pals, coins) {
            let newBest = false;
            if (dist > this.data.best) { this.data.best = dist; newBest = true; }
            if (pals > this.data.bestPals) this.data.bestPals = pals;
            this.data.coins += coins;
            this.data.runs++;
            this.save();
            return newBest;
        },
        reset() {
            this.data = { best: 0, bestPals: 0, coins: 0, runs: 0 };
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
        bgm: null,
        bgmSource: null,

        init() {
            try { this.on = localStorage.getItem(SOUND_KEY) !== '0'; } catch (e) { }
            /* Đường dẫn phải viết đầy đủ từ gốc, không được viết tương đối.
             *
             * Trang game có hai kiểu địa chỉ: /panda-run/ và /vi/g/panda-run.
             * Viết 'music.mp3' thì ở kiểu thứ nhất nó tìm đúng chỗ, nhưng ở
             * kiểu thứ hai — chính là địa chỉ bé bấm vào từ trang chủ — nó đi
             * tìm /vi/g/music.mp3 và nhận 404. Nhạc im ru mà chẳng báo lỗi gì
             * ra màn hình. Mọi tài nguyên khác trong trang đều viết đầy đủ
             * (/panda-run/style.css, /panda-run/icon.jpg), chỗ này sót lại. */
            this.bgm = new Audio('/panda-run/music.mp3');
            this.bgm.loop = true;
            /* Nhạc nền phải nhường chỗ cho tiếng động. Để 0,35 thì cả bản phối
             * đè lên mấy sóng đơn mỏng manh của tiếng ăn xu, tiếng va chạm —
             * nghe như game mất tiếng, trong khi tiếng vẫn phát ra đều.
             *
             * Nhạc chỉ là phông nền, còn tiếng động mới là thứ NÓI CHO BÉ BIẾT
             * vừa có chuyện gì xảy ra: ăn được xu, cứu được bạn, hay vừa đâm
             * phải. Mất phông nền thì game vẫn chơi được; mất lời báo thì bé
             * không biết mình vừa làm đúng hay sai. Nên khi hai bên tranh nhau,
             * nhạc là bên phải lùi. */
            this.bgm.volume = 0.09;
            this.bgm.preload = 'auto';
            this.bgm.addEventListener('error', () => {
                console.warn('Không tải được /panda-run/music.mp3');
            });
        },
        /* AudioContext chỉ dựng sau cú chạm đầu tiên — trình duyệt chặn âm tự
         * phát, dựng sớm thì nó nằm im ở trạng thái suspended. */
        wake() {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) {
                    this.ctx = new AC();
                    // Kết nối BGM qua AudioContext để tránh chiếm quyền âm thanh trên macOS/iOS
                    if (this.bgm && !this.bgmSource) {
                        try {
                            this.bgmSource = this.ctx.createMediaElementSource(this.bgm);
                            this.bgmSource.connect(this.ctx.destination);
                        } catch (e) {
                            console.warn("createMediaElementSource failed:", e);
                        }
                    }
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            if (this.on && this.bgm && this.bgm.paused && G.mode !== 'paused') {
                this.bgm.play().catch(e => console.log("BGM play failed or blocked:", e));
            }
        },
        toggle() {
            this.on = !this.on;
            try { localStorage.setItem(SOUND_KEY, this.on ? '1' : '0'); } catch (e) { }
            if (this.on) {
                if (this.bgm && G.mode !== 'paused') this.bgm.play().catch(e => console.log("BGM play failed or blocked:", e));
            } else {
                if (this.bgm) this.bgm.pause();
            }
            return this.on;
        },
        playBgm() {
            if (this.on && this.bgm && this.bgm.paused) {
                this.bgm.play().catch(e => console.log("BGM play failed or blocked:", e));
            }
        },
        pauseBgm() {
            if (this.bgm) {
                this.bgm.pause();
            }
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

        /* Âm lượng các tiếng động phải to hơn hẳn nhạc nền, không thì chúng
         * chìm nghỉm dưới bản nhạc và bé tưởng game mất tiếng.
         *
         * Tiếng động ở đây là sóng đơn, mỏng như một sợi chỉ; còn nhạc là cả
         * một bản phối dày đặc. Cùng một con số âm lượng thì tai vẫn nghe nhạc
         * to gấp mấy lần. Nên tiếng động để 0,16–0,24 trong khi nhạc chỉ 0,15. */
        jump() { this.tone(420, 0.14, 'triangle', 0.14, 760); },
        land() { this.noise(0.05, 0.09, 300); this.tone(150, 0.07, 'sine', 0.11, 90); },
        slide() { this.noise(0.22, 0.11, 1400); },
        /* Quả ăn liên tiếp leo dần lên theo thang ngũ cung, chuỗi càng dài tai
         * càng nghe ra là mình đang ăn đậm. */
        coin(i) { this.tone(NOTES[Math.min(i, NOTES.length - 1)], 0.1, 'sine', 0.17); },
        pal() {
            [784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.16, 'triangle', 0.22), i * 65));
        },
        hurt() { this.noise(0.2, 0.24, 200); this.tone(220, 0.26, 'sawtooth', 0.2, 80); },
        power() {
            [660, 880, 1320].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.14, 'square', 0.15), i * 55));
        },
        rocket() { this.noise(0.5, 0.18, 320); this.tone(180, 0.5, 'sawtooth', 0.15, 520); },
        zone() {
            [523, 659, 784, 1046, 1318].forEach((f, i) =>
                setTimeout(() => this.tone(f, 0.2, 'triangle', 0.2), i * 80));
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
        mode: 'menu',        // menu | play | paused | over

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
        cheerAt: -9,         // mốc vừa cứu được bạn, để panda nhe răng cười
        wantSlide: -9,       // vừa vuốt xuống lúc còn trên không, chạm đất là nằm
        slideHold: false,    // còn giữ tay/phím xuống thì nằm mãi
        resuming: false,     // đang đếm ngược để chạy tiếp, chưa hẳn là đã dừng
        runCycle: 0,         // pha chạy, dùng để vẽ chân tay

        tail: [],            // các bạn đã cứu, phần tử là chỉ số màu trong ANIMALS
        trail: [],           // vệt đường đã đi, để đoàn bám theo

        items: [],           // vật thể đang có trên đường
        gaps: [],            // các hố, tra riêng cho nhanh
        plats: [],
        builtTo: 0,          // đã dựng đường tới toạ độ nào
        lastChunk: -1,

        coins: 0,
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
        /* Sprite vẽ theo cỡ u nên đổi cỡ màn hình là phải vẽ lại, không thì ảnh
         * bị kéo giãn nhoè hết nét. */
        bakeSprites();
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
            pal: Math.floor(Math.random() * ANIMALS.length),
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
        G.cheerAt = -9;
        G.wantSlide = -9;
        G.slideHold = false;
        G.runCycle = 0;
        G.tail = [];
        for (let i = 0; i < START_PALS; i++) {
            G.tail.push(Math.floor(Math.random() * ANIMALS.length));
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
        G.coins = 0;
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

    /* Thả tay giữa chừng thì cắt bớt đà đang bay lên — bé thả càng sớm càng
     * nhảy thấp. Chỉ cắt khi vẫn còn trong quãng được giữ (jumpHold > 0): giữ
     * quá HOLD_T rồi mới thả nghĩa là bé đã "mua" trọn cú nhảy cao, cắt lúc đó
     * là ăn cướp công. Cũng không cắt khi đang đứng trên đất, vì cú thả tay ấy
     * có thể là của thao tác trượt chứ không phải của cú nhảy nào cả. */
    function releaseJump() {
        if (!G.onGround && G.jumpHold > 0 && G.vy < -JUMP_CUT) G.vy = -JUMP_CUT;
        G.jumpHold = 0;
    }

    function slide() {
        if (G.mode !== 'play' || G.rocketT > 0) return;
        if (!G.onGround) {
            /* Trên không vuốt xuống thì rơi sập — vừa là đòn né nhanh vừa cứu
             * được cú nhảy lỡ đà. Ghi nhớ ý định để chạm đất là nằm xuống luôn,
             * không bắt bé vuốt lần nữa: bé vuốt xuống là đã nói rõ muốn nằm. */
            G.vy = Math.max(G.vy, 16);
            G.jumpHold = 0;
            G.wantSlide = G.time;
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
        /* Nhịp chân suy ra từ tốc độ chạy, để bàn chân đứng yên so với mặt đất
         * lúc chống. Đặt bừa một con số ở đây là sinh ra trượt chân: bản trước
         * để 0,9 nên bàn chân miết tới trước 85% quãng đường mỗi bước, nhìn ra
         * đúng động tác moonwalk. */
        const cadence = Math.min(CADENCE_MAX, TAU * sp * LEG_CONTACT / (2 * LEG_AMP));
        G.runCycle += dt * (G.onGround ? cadence : 4);

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
                /* Chạm đất là hết quãng giữ tay của cú nhảy vừa rồi; không xoá
                 * thì cú thả tay sau đó lại đi cắt nhầm cú nhảy kế tiếp. */
                G.jumpHold = 0;
                /* Vừa vuốt xuống lúc còn trên không thì đáp xuống là nằm luôn. */
                if (G.time - G.wantSlide < 0.4) {
                    G.wantSlide = -9;
                    G.sliding = SLIDE_T;
                    sfx.slide();
                    puff(G.x - 0.4, sup, 6, '#ffe9a8');
                }
            } else {
                if (G.onGround) G.lastGround = G.time;
                G.onGround = false;
            }
        }

        /* Còn giữ tay (hoặc giữ phím xuống) thì nằm mãi, thả ra mới đứng dậy.
         * Trước đó tư thế nằm tự hết sau SLIDE_T dù bé vẫn đang giữ — gặp khúc
         * gỗ dài hoặc hai khúc liền nhau là bé nằm được nửa đường rồi bật dậy
         * đâm vào khúc sau, mà bé thì đang giữ tay đúng như game dạy. */
        if (G.slideHold && G.onGround && G.rocketT <= 0) {
            G.sliding = 0.18;              // thả tay ra là đứng dậy sau 0,18 giây
        } else if (G.sliding > 0) {
            G.sliding -= dt;
        }
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

            if (it.t === T.COIN) {
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
                    takeCoin(it);
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
            else if (it.t === T.GUARD) { x0 = it.x - 0.62; x1 = it.x + 0.62; y0 = 0; y1 = 1.35; }
            else { x0 = it.x - 0.7; x1 = it.x + 0.7; y0 = 1.05; y1 = 2.6; }   // khúc gỗ

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

    function takeCoin(it) {
        G.coins++;
        bumpCombo();
        G.score += 10 * mult();
        sfx.coin(Math.min(G.combo, NOTES.length - 1));
        G.parts.push.apply(G.parts, burst(it.x, it.y, 6, '#ffd43b'));
        G.rings.push({ x: it.x, y: it.y, r0: 0.3, grow: 2.2, life: 0.26, age: 0, col: '#ffe066' });
        countMission('coins', 1);
    }

    function rescue(it) {
        if (G.tail.length < MAX_TAIL) G.tail.push(it.pal);
        G.cheerAt = G.time;
        G.pals++;
        bumpCombo();
        G.score += 120 * mult();
        sfx.pal();
        shake(0.16, 0.2);
        flash('#ffe066', 0.3);
        G.parts.push.apply(G.parts, burst(it.x, it.y + 0.8, 18, ANIMALS[it.pal].main));
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
            G.parts.push.apply(G.parts, burst(G.x - 1, G.y + 0.6, 14, ANIMALS[pal].main));
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
        const newBest = store.record(G.metres, G.pals, G.coins);
        G.score += G.metres * 5;
        showOver(newBest);
    }

    /* ---- nhiệm vụ mỗi lượt ---- */
    const MISSION_POOL = [
        { key: 'pals', text: 'Rescue {n} friends', pick: () => 3 + Math.floor(Math.random() * 3) },
        { key: 'coins', text: 'Collect {n} coins', pick: () => 30 + Math.floor(Math.random() * 4) * 10 },
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
                // Tắt nhịp trống tổng hợp để không đè nhạc nền BGM
                // if (G.beatN % 4 === 0) sfx.kick(); else sfx.hat();
            }
        }
    }

    /* ========================================================================
     *  10. SPRITE
     * ------------------------------------------------------------------------
     *  Mỗi tư thế được vẽ MỘT LẦN vào một tấm canvas ẩn, từ đó về sau mỗi khung
     *  hình chỉ dán tấm ảnh đó lên sân. Hai cái lợi:
     *
     *    • Mượt hơn. Chu kỳ chạy tám hình chuyển liên tục, chứ vẽ lại đường nét
     *      mỗi khung thì phải giữ hình thật đơn giản mới kịp, mà đơn giản quá
     *      thì nhân vật trông như quả bóng có mặt.
     *    • Nhẹ hơn. Con panda có gần bốn mươi nét vẽ; nhân với đoàn bạn chạy
     *      sau lưng và sáu chục đồng xu trên màn hình là mỗi khung hình phải
     *      dựng lại hàng nghìn đường. Dán ảnh sẵn thì chỉ còn vài chục lệnh.
     *
     *  Sprite nướng lại mỗi lần đổi cỡ màn hình, vì cỡ một đơn vị u đổi theo.
     * ======================================================================*/

    const TAU = Math.PI * 2;

    const SPR = {
        u: 0,               // cỡ u lúc nướng; khác với V.u hiện tại thì nướng lại
        panda: null,        // { run: [8], jump, slide, cheer }
        pals: [],           // pals[i] = { run: [2], sit }
        coin: [],           // sáu hình xu xoay
        guard: [],          // hai hình thú canh, nhấp nhổm qua lại
        cage: null, log: null, rock: null, spike: null
    };

    /* Mười hai hình cho một vòng chạy thay vì tám: với nhịp chân đúng (xem
     * LEG_AMP bên dưới) thì tám hình đổi quá thưa, mắt thấy giật. */
    const PANDA_FRAMES = 12;
    const COIN_FRAMES = 6;

    /* Biên độ trước–sau của bàn chân, và phần trăm vòng chạy mà một chân còn
     * chống đất. Hai số này quyết định nhịp chân: bàn chân lùi được 2×LEG_AMP
     * trong LEG_CONTACT của một vòng, nên muốn nó đứng yên so với mặt đất thì
     *
     *      số vòng mỗi giây = tốc độ × LEG_CONTACT / (2 × LEG_AMP)
     *
     * Để chống đất dưới nửa vòng (0,45) thì có những lúc cả hai chân đều rời
     * đất — đó mới là CHẠY; đúng nửa vòng trở lên là dáng đi bộ nhanh.
     *
     * Ba thứ này ràng buộc lẫn nhau, đổi một cái là hai cái kia phải theo:
     * chân ngắn (sải nhỏ) + khua chậm + không trượt. Panda phải chân ngắn cho
     * đúng dáng gấu trúc, mà chân ngắn thì sải ngắn, sải ngắn thì nhịp phải
     * nhanh mới bù đủ quãng — trừ khi rút bớt thời gian chạm đất, và đó là lối
     * ra: chạm đất 34% mỗi chân, hai chân cộng lại 68%, còn 32% là lúc cả hai
     * chân cùng rời đất. Đúng pha bay của một cú chạy thật. */
    const LEG_AMP = 0.5;
    const LEG_CONTACT = 0.34;
    const CADENCE_MAX = 30;      // trần nhịp chân (rad/giây), khỏi loạn hình

    /* Vẽ sẵn một tấm. Trả về {c, w, h, ax, ay} — ax/ay là điểm neo (chỗ đặt
     * chân) tính trong toạ độ tấm ảnh, để lúc dán khỏi phải căn tay. */
    function bake(w, h, ax, ay, paint) {
        const c = document.createElement('canvas');
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        c.width = Math.max(1, Math.ceil(w * dpr));
        c.height = Math.max(1, Math.ceil(h * dpr));
        const g = c.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.lineJoin = 'round';
        g.lineCap = 'round';
        paint(g);
        return { c: c, w: w, h: h, ax: ax, ay: ay };
    }

    function blit(s, x, y, scale, alpha) {
        if (!s) return;
        const k = scale == null ? 1 : scale;
        ctx.save();
        if (alpha != null) ctx.globalAlpha *= alpha;
        ctx.drawImage(s.c, x - s.ax * k, y - s.ay * k, s.w * k, s.h * k);
        ctx.restore();
    }

    /* ---- gấu trúc ----
     * Tạo hình theo bản thiết kế: đầu to, hai tai đen tròn, hai mảng mắt đen,
     * khăn quàng đỏ bay ngược chiều chạy, ba lô xanh sau lưng. Toàn thân cao
     * đúng 1,58 u để khớp với khung va chạm 1,55 u — vẽ to hơn khung thì bé
     * thấy mình bị đụng oan, vẽ nhỏ hơn thì thấy game ăn gian.
     */
    /* limbFar sáng hơn limb gần một bậc rõ rệt. Hai bên cùng đen kịt thì lúc
     * tay chân chồng lên nhau mắt không tách được đâu là chi bên này, đâu là
     * chi bên kia — mà không tách được thì cũng không thấy chúng đang ngược
     * pha nhau, dù pha có đúng. */
    const PANDA = {
        white: '#fbfcfe', shade: '#dfe6f0', black: '#23262e', ink: '#14161b',
        /* Chân xa cũng ĐEN như chân gần, chỉ sẫm hơn một nấc và vẽ mảnh hơn
         * chút. Để đúng hai màu đen y hệt thì lúc hai chân chồng nhau mắt dính
         * thành một khối, không đọc ra được bước chạy nữa. */
        limbFar: '#15181f',
        scarf: '#e8443c', scarfDark: '#b32a25', pack: '#4c8f3f', packDark: '#356d2b',
        cheek: 'rgba(255,120,150,0.5)'
    };

    function paintPanda(g, u, pose, k) {
        const H = 2.0 * u;             // chiều cao tấm ảnh
        const cx = 1.35 * u;           // trục thân, lệch phải để chừa chỗ khăn bay
        const foot = 1.86 * u;         // chân chạm đất ở đây

        const a = k * TAU;
        const run = pose === 'run';
        const bob = run ? Math.abs(Math.sin(a)) * 0.05 * u : 0;
        const slide = pose === 'slide';
        const jump = pose === 'jump';

        /* Đổ người về trước một chút khi chạy. Đây là dấu hiệu mạnh nhất cho
         * biết nhân vật đang lao tới: người đứng thẳng đơ mà chân khua thì mắt
         * đọc ra "đang giậm chân tại chỗ" chứ không phải "đang chạy". Xoay
         * quanh điểm đặt chân nên bàn chân gần như không xê dịch. */
        const lean = run ? 0.075 : 0;
        if (lean) {
            g.save();
            g.translate(cx, foot);
            g.rotate(lean);
            g.translate(-cx, -foot);
        }

        /* Trượt thì cả người nằm rạp xuống và ngả về trước. */
        const bodyCY = slide ? foot - 0.32 * u : foot - 0.58 * u - bob;
        const headCY = slide ? foot - 0.60 * u : foot - 1.14 * u - bob;
        const headR = 0.42 * u;
        const bodyRX = slide ? 0.50 * u : 0.42 * u;
        const bodyRY = slide ? 0.26 * u : 0.34 * u;

        /* --- ba lô: vẽ trước thân để nằm hẳn ra sau lưng, và nhô hẳn ra ngoài
         * viền thân, không thì thân trắng nuốt mất nó --- */
        g.fillStyle = PANDA.pack;
        rr(g, cx - bodyRX - 0.24 * u, bodyCY - 0.34 * u, 0.42 * u, 0.60 * u, 0.16 * u);
        g.fill();
        g.fillStyle = PANDA.packDark;
        rr(g, cx - bodyRX - 0.24 * u, bodyCY - 0.04 * u, 0.42 * u, 0.13 * u, 0.05 * u);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.28)';
        rr(g, cx - bodyRX - 0.19 * u, bodyCY - 0.28 * u, 0.13 * u, 0.2 * u, 0.05 * u);
        g.fill();

        /* --- đuôi khăn: vẽ TRƯỚC thân để bay ra sau lưng ---
         * Vẽ sau thân thì dải đỏ nằm đè lên bụng trắng, con panda thành ra
         * đeo yếm. Dải cũng phải thon dần và lượn sóng, không thì nhìn như
         * một tấm ván sơn đỏ đóng ngang người. */
        const neckY0 = (slide ? headCY + 0.26 * u : headCY + 0.34 * u);
        const flut = run ? Math.sin(a * 2) * 0.09 * u : 0;
        g.fillStyle = PANDA.scarfDark;
        g.beginPath();
        g.moveTo(cx - 0.10 * u, neckY0 - 0.02 * u);
        g.quadraticCurveTo(cx - 0.52 * u, neckY0 - 0.26 * u + flut,
            cx - 0.94 * u, neckY0 - 0.06 * u + flut * 1.6);
        g.quadraticCurveTo(cx - 0.60 * u, neckY0 + 0.04 * u, cx - 0.44 * u, neckY0 + 0.16 * u);
        g.quadraticCurveTo(cx - 0.26 * u, neckY0 + 0.14 * u, cx - 0.08 * u, neckY0 + 0.12 * u);
        g.closePath();
        g.fill();

        /* ====================================================================
         *  CHÂN VÀ TAY — viết lại theo đúng một chu kỳ chạy
         * --------------------------------------------------------------------
         *  Bản trước sai ở chỗ không ai ngờ tới: pha tay chân đã đúng, nhưng
         *  BÀN CHÂN TRƯỢT. Một lần chống đất kéo dài nửa giây, trong nửa giây
         *  đó mặt đất trôi qua 3,5 u mà bàn chân chỉ lùi được 0,52 u so với
         *  thân — tức là nó miết TỚI TRƯỚC gần hết quãng đường. Đó đúng là
         *  động tác moonwalk, nên mắt đọc ra "chạy ngược" dù mọi con số pha
         *  đều đúng.
         *
         *  Hai thứ phải sửa cùng lúc:
         *    1. Lúc chống đất, bàn chân lùi ĐỀU (đường thẳng), không phải theo
         *       hình sin. Sin thì hai đầu chậm giữa nhanh, nhìn cũng ra trượt.
         *    2. Nhịp chân phải tính từ tốc độ chạy, sao cho quãng bàn chân lùi
         *       đúng bằng quãng mặt đất trôi. Chỗ này làm ở stepPlayer.
         *
         *  Quỹ đạo bàn chân theo pha p (0 → 1 là một vòng của MỘT chân):
         *    p ∈ [0 , 0.5]  CHỐNG ĐẤT — chân sát đất, lùi đều từ trước ra sau
         *    p ∈ [0.5 , 1]  ĐƯA CHÂN — nhấc lên, vòng ra trước
         * ==================================================================*/
        const LEG_A = LEG_AMP * u;         // biên độ trước–sau của bàn chân
        const LEG_LIFT = 0.30 * u;         // nhấc cao nhất lúc đưa chân
        const hipY = bodyCY + 0.20 * u;

        function footAt(p) {
            p = ((p % 1) + 1) % 1;
            if (p < LEG_CONTACT) {
                const t = p / LEG_CONTACT;
                return { x: LEG_A * (1 - 2 * t), y: 0 };
            }
            const t = (p - LEG_CONTACT) / (1 - LEG_CONTACT);
            /* Nhấc cao nhất ở giữa quãng đưa chân, và hơi lệch về nửa đầu —
             * chân co lên nhanh rồi mới duỗi ra đón đất, chứ không phải một
             * vòng cung cân đối. */
            return {
                x: LEG_A * (2 * t - 1),
                y: LEG_LIFT * Math.sin(Math.PI * Math.pow(t, 0.78))
            };
        }

        /* Chân MỘT KHÚC liền từ hông xuống bàn chân, không đầu gối.
         *
         * Gấu trúc chân ngắn và mập, gập gối vào chỉ tổ làm cái chân vốn đã
         * ngắn nay gãy làm đôi, nhìn còn ngắn hơn. Chân một khúc bo tròn hai
         * đầu hợp với tạo hình tròn trịa của cả con vật hơn.
         *
         * Bỏ luôn được phần giải ngược tìm đầu gối, nên bàn chân bao giờ cũng
         * đặt đúng chỗ cần đặt — trước đó khi hông và bàn chân xa nhau quá tầm
         * hai đốt thì phải kẹp lại, bàn chân hụt khỏi mặt đất một chút. */
        function leg(hx, hy, fx, fy, col, w) {
            g.strokeStyle = col;
            g.lineWidth = w;
            g.beginPath();
            g.moveTo(hx, hy);
            g.lineTo(fx, fy);
            g.stroke();
            /* Bàn chân nằm vuông góc với ống chân. */
            g.save();
            g.translate(fx, fy);
            g.rotate(Math.atan2(fy - hy, fx - hx) - Math.PI / 2);
            g.fillStyle = col;
            g.beginPath();
            g.ellipse(0, 0, w * 0.72, w * 0.5, 0, 0, TAU);
            g.fill();
            g.restore();
        }

        /* Tay cũng hai đốt, xoay quanh vai, vung đều cả trước lẫn sau lưng.
         * Biên độ để xấp xỉ biên độ chân thì mắt mới đọc ra được tay và chân
         * đang ngược nhau — thứ mắt bắt là biên độ, không phải con số pha. */
        function arm(sx0, sy0, p, col) {
            const sw = Math.cos(p * TAU) * 1.05;
            /* Tay dài thêm theo sải chân: chân bước rộng mà tay khua tí tẹo thì nhìn
             * lệch. */
            const upper = 0.22 * u, fore = 0.20 * u;
            const ex = sx0 + Math.sin(sw * 0.7) * upper;
            const ey = sy0 + Math.cos(sw * 0.7) * upper;
            /* Cẳng tay gập thêm về trước — kiểu tay chạy, không phải tay đi bộ. */
            const fa = sw * 0.7 + 0.85;
            const hx = ex + Math.sin(fa) * fore;
            const hy = ey + Math.cos(fa) * fore;
            g.strokeStyle = col;
            g.lineWidth = 0.17 * u;
            g.beginPath();
            g.moveTo(sx0, sy0);
            g.lineTo(ex, ey);
            g.lineTo(hx, hy);
            g.stroke();
            g.fillStyle = col;
            g.beginPath();
            g.ellipse(hx, hy, 0.115 * u, 0.09 * u, 0, 0, TAU);
            g.fill();
        }

        const limb = (x1, y1, x2, y2, w, col, paw) => {
            g.strokeStyle = col;
            g.lineWidth = w;
            g.beginPath();
            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.stroke();
            if (paw) {
                g.fillStyle = col;
                g.beginPath();
                g.ellipse(x2, y2, w * 0.62, w * 0.46, 0, 0, TAU);
                g.fill();
            }
        };

        /* Pha của hai chân lệch nhau nửa vòng. Chân XA đi trước nửa nhịp. */
        const pNear = k;
        const pFar = k + 0.5;

        if (slide) {
            limb(cx - 0.10 * u, hipY - 0.06 * u, cx - 0.58 * u, foot - 0.05 * u, 0.24 * u, PANDA.limbFar, true);
        } else if (jump) {
            /* Nhảy thì co chân lại — duỗi thẳng nhìn như đang rơi chứ không bật. */
            leg(cx - 0.11 * u, hipY, cx - 0.30 * u, foot - 0.34 * u, PANDA.limbFar, 0.21 * u);
            arm(cx - 0.16 * u, bodyCY - 0.16 * u, 0.5, PANDA.limbFar);
        } else {
            const f = footAt(pFar);
            leg(cx - 0.11 * u, hipY, cx + f.x, foot - f.y, PANDA.limbFar, 0.21 * u);
            /* Tay XA cùng pha với chân GẦN — tức ngược pha với chân cùng bên
             * nó. Đó là vận động chéo: tay phải theo chân trái. */
            arm(cx - 0.16 * u, bodyCY - 0.16 * u, pNear, PANDA.limbFar);
        }

        /* --- thân trắng --- */
        const bg = g.createLinearGradient(cx - bodyRX, bodyCY - bodyRY, cx + bodyRX, bodyCY + bodyRY);
        bg.addColorStop(0, PANDA.white);
        bg.addColorStop(1, PANDA.shade);
        g.fillStyle = bg;
        g.beginPath();
        g.ellipse(cx, bodyCY, bodyRX, bodyRY, 0, 0, TAU);
        g.fill();

        /* --- chân GẦN, vẽ đè lên thân --- */
        if (slide) {
            limb(cx + 0.20 * u, hipY - 0.08 * u, cx + 0.62 * u, foot - 0.03 * u, 0.24 * u, PANDA.black, true);
        } else if (jump) {
            leg(cx + 0.11 * u, hipY, cx + 0.34 * u, foot - 0.18 * u, PANDA.black, 0.225 * u);
        } else {
            const f = footAt(pNear);
            leg(cx + 0.11 * u, hipY, cx + f.x, foot - f.y, PANDA.black, 0.225 * u);
        }

        /* --- tay GẦN --- */
        if (jump) {
            limb(cx + 0.16 * u, bodyCY - 0.16 * u, cx + 0.52 * u, bodyCY - 0.40 * u,
                0.19 * u, PANDA.black, true);
        } else if (!slide) {
            arm(cx + 0.12 * u, bodyCY - 0.16 * u, pFar, PANDA.black);
        } else {
            limb(cx + 0.22 * u, bodyCY - 0.10 * u, cx + 0.68 * u, bodyCY + 0.06 * u,
                0.19 * u, PANDA.black, true);
        }

        /* --- nút khăn quàng ở cổ, vẽ sau thân cho nằm trước ngực --- */
        const neckY = neckY0;
        g.fillStyle = PANDA.scarfDark;
        rr(g, cx - 0.30 * u, neckY - 0.10 * u, 0.60 * u, 0.20 * u, 0.09 * u);
        g.fill();
        g.fillStyle = PANDA.scarf;
        rr(g, cx - 0.27 * u, neckY - 0.14 * u, 0.55 * u, 0.18 * u, 0.08 * u);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.25)';
        rr(g, cx - 0.22 * u, neckY - 0.12 * u, 0.42 * u, 0.05 * u, 0.02 * u);
        g.fill();

        /* --- tai --- */
        g.fillStyle = PANDA.black;
        g.beginPath();
        g.arc(cx - 0.26 * u, headCY - 0.32 * u, 0.16 * u, 0, TAU);
        g.arc(cx + 0.28 * u, headCY - 0.34 * u, 0.16 * u, 0, TAU);
        g.fill();

        /* --- đầu --- */
        const hg = g.createRadialGradient(cx - 0.12 * u, headCY - 0.16 * u, 0.06 * u,
            cx, headCY, headR);
        hg.addColorStop(0, '#ffffff');
        hg.addColorStop(1, PANDA.shade);
        g.fillStyle = hg;
        g.beginPath();
        g.arc(cx, headCY, headR, 0, TAU);
        g.fill();

        /* --- hai mảng mắt đen, đặt hơi lệch phải cho ra góc ba phần tư --- */
        g.fillStyle = PANDA.black;
        g.beginPath();
        g.ellipse(cx + 0.02 * u, headCY - 0.02 * u, 0.135 * u, 0.175 * u, -0.35, 0, TAU);
        g.ellipse(cx + 0.29 * u, headCY - 0.04 * u, 0.125 * u, 0.165 * u, 0.35, 0, TAU);
        g.fill();

        /* mắt: tròng trắng + con ngươi, thêm chấm sáng cho có hồn */
        const eye = (ex, ey, r) => {
            g.fillStyle = '#ffffff';
            g.beginPath(); g.arc(ex, ey, r, 0, TAU); g.fill();
            g.fillStyle = PANDA.ink;
            g.beginPath(); g.arc(ex + r * 0.18, ey + r * 0.05, r * 0.62, 0, TAU); g.fill();
            g.fillStyle = '#ffffff';
            g.beginPath(); g.arc(ex + r * 0.4, ey - r * 0.36, r * 0.26, 0, TAU); g.fill();
        };
        if (pose === 'cheer') {
            /* Mắt nhắm hình vòng cung — dùng cho lúc vừa cứu được bạn. */
            g.strokeStyle = '#ffffff';
            g.lineWidth = 0.045 * u;
            g.beginPath();
            g.arc(cx + 0.03 * u, headCY + 0.02 * u, 0.075 * u, Math.PI, 0);
            g.arc(cx + 0.29 * u, headCY, 0.07 * u, Math.PI, 0);
            g.stroke();
        } else {
            eye(cx + 0.03 * u, headCY - 0.01 * u, 0.072 * u);
            eye(cx + 0.29 * u, headCY - 0.03 * u, 0.066 * u);
        }

        /* --- mũi và miệng --- */
        g.fillStyle = PANDA.ink;
        g.beginPath();
        g.ellipse(cx + 0.17 * u, headCY + 0.15 * u, 0.062 * u, 0.048 * u, 0, 0, TAU);
        g.fill();
        g.strokeStyle = PANDA.ink;
        g.lineWidth = 0.036 * u;
        g.beginPath();
        if (pose === 'cheer' || run) {
            /* Miệng cười mở — panda trong bản thiết kế lúc nào cũng đang vui. */
            g.moveTo(cx + 0.09 * u, headCY + 0.21 * u);
            g.quadraticCurveTo(cx + 0.17 * u, headCY + 0.32 * u, cx + 0.26 * u, headCY + 0.20 * u);
        } else {
            g.moveTo(cx + 0.10 * u, headCY + 0.22 * u);
            g.quadraticCurveTo(cx + 0.17 * u, headCY + 0.28 * u, cx + 0.25 * u, headCY + 0.21 * u);
        }
        g.stroke();

        /* --- má hồng --- */
        g.fillStyle = PANDA.cheek;
        g.beginPath();
        g.ellipse(cx - 0.14 * u, headCY + 0.16 * u, 0.085 * u, 0.06 * u, 0, 0, TAU);
        g.ellipse(cx + 0.40 * u, headCY + 0.13 * u, 0.075 * u, 0.055 * u, 0, 0, TAU);
        g.fill();

        if (lean) g.restore();
    }

    /* ---- các bạn động vật ----
     * Chung một khung thân tròn, khác nhau ở tai, mõm, đuôi — vừa đủ để nhận ra
     * loài mà không phải vẽ sáu con từ đầu. */
    function paintPal(g, u, sp, frame) {
        const H = 1.15 * u;
        const cx = 0.58 * u;
        const foot = 1.06 * u;
        const bodyCY = foot - 0.36 * u;
        const r = 0.34 * u;
        const step = frame ? 1 : -1;

        /* chân */
        g.strokeStyle = sp.dark;
        g.lineWidth = 0.15 * u;
        g.beginPath();
        g.moveTo(cx - 0.12 * u, bodyCY + 0.22 * u);
        g.lineTo(cx - 0.12 * u + step * 0.14 * u, foot);
        g.moveTo(cx + 0.12 * u, bodyCY + 0.22 * u);
        g.lineTo(cx + 0.12 * u - step * 0.14 * u, foot);
        g.stroke();

        /* đuôi: cáo xù, khỉ cong, còn lại chấm tròn */
        if (sp.key === 'fox') {
            g.fillStyle = sp.main;
            g.beginPath();
            g.moveTo(cx - r * 0.7, bodyCY);
            g.quadraticCurveTo(cx - r * 2.0, bodyCY - r * 0.5, cx - r * 1.5, bodyCY + r * 0.7);
            g.quadraticCurveTo(cx - r * 1.0, bodyCY + r * 0.5, cx - r * 0.7, bodyCY + r * 0.4);
            g.closePath();
            g.fill();
            g.fillStyle = sp.soft;
            g.beginPath();
            g.arc(cx - r * 1.55, bodyCY + r * 0.2, r * 0.26, 0, TAU);
            g.fill();
        } else if (sp.key === 'monkey') {
            /* Đuôi cong vống lên cao hẳn — dấu hiệu duy nhất tách khỉ khỏi gấu
             * ở cỡ hình bé tí này, nên phải thấy rõ. */
            g.strokeStyle = sp.dark;
            g.lineWidth = 0.085 * u;
            g.beginPath();
            g.moveTo(cx - r * 0.75, bodyCY + r * 0.2);
            g.quadraticCurveTo(cx - r * 2.1, bodyCY + r * 0.1, cx - r * 1.7, bodyCY - r * 1.25);
            g.stroke();
        } else if (sp.key === 'elephant') {
            g.fillStyle = sp.dark;
            g.beginPath();
            g.arc(cx - r * 0.9, bodyCY + r * 0.2, r * 0.16, 0, TAU);
            g.fill();
        }

        /* tai */
        g.fillStyle = sp.main;
        if (sp.key === 'rabbit') {
            [-1, 1].forEach(s => {
                g.beginPath();
                g.ellipse(cx + s * r * 0.34, bodyCY - r * 1.15, r * 0.17, r * 0.6, s * 0.2, 0, TAU);
                g.fill();
            });
            g.fillStyle = sp.soft;
            [-1, 1].forEach(s => {
                g.beginPath();
                g.ellipse(cx + s * r * 0.34, bodyCY - r * 1.15, r * 0.08, r * 0.38, s * 0.2, 0, TAU);
                g.fill();
            });
        } else if (sp.key === 'fox') {
            [-1, 1].forEach(s => {
                g.beginPath();
                g.moveTo(cx + s * r * 0.28, bodyCY - r * 0.6);
                g.lineTo(cx + s * r * 0.72, bodyCY - r * 1.3);
                g.lineTo(cx + s * r * 0.86, bodyCY - r * 0.45);
                g.closePath();
                g.fill();
            });
        } else if (sp.key === 'elephant') {
            [-1, 1].forEach(s => {
                g.beginPath();
                g.ellipse(cx + s * r * 0.92, bodyCY - r * 0.15, r * 0.42, r * 0.5, 0, 0, TAU);
                g.fill();
            });
        } else if (sp.key === 'chick') {
            /* gà con không có tai, thay bằng túm lông trên đầu */
            g.strokeStyle = sp.dark;
            g.lineWidth = 0.05 * u;
            g.beginPath();
            g.moveTo(cx, bodyCY - r * 0.9);
            g.lineTo(cx - r * 0.1, bodyCY - r * 1.35);
            g.moveTo(cx + r * 0.08, bodyCY - r * 0.9);
            g.lineTo(cx + r * 0.26, bodyCY - r * 1.3);
            g.stroke();
        } else {
            [-1, 1].forEach(s => {
                g.beginPath();
                g.arc(cx + s * r * 0.62, bodyCY - r * 0.72, r * 0.28, 0, TAU);
                g.fill();
            });
            g.fillStyle = sp.soft;
            [-1, 1].forEach(s => {
                g.beginPath();
                g.arc(cx + s * r * 0.62, bodyCY - r * 0.72, r * 0.14, 0, TAU);
                g.fill();
            });
        }

        /* thân */
        const bg = g.createRadialGradient(cx - r * 0.3, bodyCY - r * 0.35, r * 0.1, cx, bodyCY, r);
        bg.addColorStop(0, sp.soft);
        bg.addColorStop(0.55, sp.main);
        bg.addColorStop(1, sp.dark);
        g.fillStyle = bg;
        g.beginPath();
        g.arc(cx, bodyCY, r, 0, TAU);
        g.fill();

        /* mõm sáng màu */
        g.fillStyle = sp.soft;
        g.beginPath();
        g.ellipse(cx + r * 0.18, bodyCY + r * 0.28, r * 0.42, r * 0.3, 0, 0, TAU);
        g.fill();

        /* vòi voi */
        if (sp.key === 'elephant') {
            g.strokeStyle = sp.main;
            g.lineWidth = 0.085 * u;
            g.beginPath();
            g.moveTo(cx + r * 0.2, bodyCY + r * 0.3);
            g.quadraticCurveTo(cx + r * 0.75, bodyCY + r * 0.65, cx + r * 0.6, bodyCY + r * 0.95);
            g.stroke();
        }

        /* mắt */
        const eye = (ex, ey, rr2) => {
            g.fillStyle = '#1b2430';
            g.beginPath(); g.arc(ex, ey, rr2, 0, TAU); g.fill();
            g.fillStyle = '#ffffff';
            g.beginPath(); g.arc(ex + rr2 * 0.34, ey - rr2 * 0.36, rr2 * 0.38, 0, TAU); g.fill();
        };
        eye(cx - r * 0.24, bodyCY - r * 0.12, r * 0.13);
        eye(cx + r * 0.34, bodyCY - r * 0.14, r * 0.13);

        /* mũi / mỏ */
        if (sp.key === 'chick') {
            g.fillStyle = '#ff922b';
            g.beginPath();
            g.moveTo(cx + r * 0.06, bodyCY + r * 0.2);
            g.lineTo(cx + r * 0.46, bodyCY + r * 0.3);
            g.lineTo(cx + r * 0.08, bodyCY + r * 0.42);
            g.closePath();
            g.fill();
        } else {
            g.fillStyle = '#1b2430';
            g.beginPath();
            g.ellipse(cx + r * 0.1, bodyCY + r * 0.18, r * 0.1, r * 0.08, 0, 0, TAU);
            g.fill();
        }

        /* má hồng */
        g.fillStyle = 'rgba(255,120,150,0.4)';
        g.beginPath();
        g.ellipse(cx - r * 0.62, bodyCY + r * 0.16, r * 0.16, r * 0.12, 0, 0, TAU);
        g.ellipse(cx + r * 0.72, bodyCY + r * 0.12, r * 0.14, r * 0.1, 0, 0, TAU);
        g.fill();
    }

    /* ---- đồng xu, xoay tròn sáu hình ---- */
    function paintCoin(g, u, frame) {
        const cx = 0.4 * u, cy = 0.4 * u, r = 0.32 * u;
        /* Bề ngang co lại rồi phình ra: xu đang quay quanh trục đứng. */
        const w = Math.abs(Math.cos((frame / COIN_FRAMES) * Math.PI)) * 0.86 + 0.14;
        g.save();
        g.translate(cx, cy);
        g.scale(w, 1);
        const gg = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        gg.addColorStop(0, '#fff6c8');
        gg.addColorStop(0.55, '#ffc93b');
        gg.addColorStop(1, '#d98c00');
        g.fillStyle = gg;
        g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
        g.strokeStyle = '#b87400';
        g.lineWidth = r * 0.12;
        g.beginPath(); g.arc(0, 0, r * 0.98, 0, TAU); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.75)';
        g.lineWidth = r * 0.1;
        g.beginPath(); g.arc(0, 0, r * 0.62, -2.4, -0.9); g.stroke();
        /* dấu chân trên mặt xu — chi tiết nhỏ nhưng buộc đồng xu vào chủ đề */
        if (w > 0.55) {
            g.fillStyle = 'rgba(180,110,0,0.55)';
            g.beginPath();
            g.ellipse(0, r * 0.12, r * 0.2, r * 0.16, 0, 0, TAU);
            g.fill();
            [-1, 0, 1].forEach(i => {
                g.beginPath();
                g.ellipse(i * r * 0.2, -r * 0.18, r * 0.07, r * 0.09, i * 0.4, 0, TAU);
                g.fill();
            });
        }
        g.restore();
    }

    /* ---- thú canh ----
     * Phải nhìn ra ngay là phe xấu, tách hẳn khỏi mấy bạn cần cứu: lông sẫm
     * thay vì màu tươi, mày cau chứ không phải mắt tròn, mõm nhe răng, vòng cổ
     * gai đỏ. Bé bốn tuổi không đọc chữ nhưng đọc được cái cau mày. */
    const GUARD_COL = { main: '#5a5566', dark: '#332f3d', soft: '#7b7488' };

    function paintGuard(g, u, frame) {
        const cx = 0.95 * u, foot = 1.5 * u;
        const bodyCY = foot - 0.44 * u;
        const r = 0.42 * u;
        const sw = frame ? 1 : -1;

        /* đuôi vẫy */
        g.strokeStyle = GUARD_COL.dark;
        g.lineWidth = 0.14 * u;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(cx - r * 0.8, bodyCY + r * 0.1);
        g.quadraticCurveTo(cx - r * 1.9, bodyCY - r * (0.1 + sw * 0.35),
            cx - r * 1.6, bodyCY - r * (0.9 + sw * 0.2));
        g.stroke();

        /* chân */
        g.strokeStyle = GUARD_COL.dark;
        g.lineWidth = 0.17 * u;
        g.beginPath();
        g.moveTo(cx - r * 0.45, bodyCY + r * 0.5);
        g.lineTo(cx - r * 0.5, foot);
        g.moveTo(cx + r * 0.45, bodyCY + r * 0.5);
        g.lineTo(cx + r * 0.52, foot);
        g.stroke();

        /* tai nhọn dựng đứng */
        g.fillStyle = GUARD_COL.main;
        [-1, 1].forEach(s => {
            g.beginPath();
            g.moveTo(cx + s * r * 0.3, bodyCY - r * 0.55);
            g.lineTo(cx + s * r * 0.72, bodyCY - r * 1.35);
            g.lineTo(cx + s * r * 0.88, bodyCY - r * 0.45);
            g.closePath();
            g.fill();
        });

        /* thân */
        const bg = g.createRadialGradient(cx - r * 0.3, bodyCY - r * 0.35, r * 0.1, cx, bodyCY, r);
        bg.addColorStop(0, GUARD_COL.soft);
        bg.addColorStop(0.6, GUARD_COL.main);
        bg.addColorStop(1, GUARD_COL.dark);
        g.fillStyle = bg;
        g.beginPath();
        g.arc(cx, bodyCY, r, 0, TAU);
        g.fill();

        /* mõm */
        g.fillStyle = GUARD_COL.soft;
        g.beginPath();
        g.ellipse(cx + r * 0.3, bodyCY + r * 0.3, r * 0.4, r * 0.28, 0, 0, TAU);
        g.fill();
        /* răng nanh */
        g.fillStyle = '#ffffff';
        [0.1, 0.42].forEach(k => {
            g.beginPath();
            g.moveTo(cx + r * k, bodyCY + r * 0.38);
            g.lineTo(cx + r * (k + 0.1), bodyCY + r * 0.38);
            g.lineTo(cx + r * (k + 0.05), bodyCY + r * 0.62);
            g.closePath();
            g.fill();
        });

        /* mắt và mày cau — chi tiết làm nên "kẻ xấu" */
        g.fillStyle = '#ffe066';
        g.beginPath();
        g.ellipse(cx - r * 0.05, bodyCY - r * 0.12, r * 0.13, r * 0.11, 0, 0, TAU);
        g.ellipse(cx + r * 0.42, bodyCY - r * 0.14, r * 0.13, r * 0.11, 0, 0, TAU);
        g.fill();
        g.fillStyle = '#1b1420';
        g.beginPath();
        g.ellipse(cx - r * 0.03, bodyCY - r * 0.12, r * 0.06, r * 0.09, 0, 0, TAU);
        g.ellipse(cx + r * 0.44, bodyCY - r * 0.14, r * 0.06, r * 0.09, 0, 0, TAU);
        g.fill();
        g.strokeStyle = '#1b1420';
        g.lineWidth = 0.055 * u;
        g.beginPath();
        g.moveTo(cx - r * 0.28, bodyCY - r * 0.42);
        g.lineTo(cx + r * 0.1, bodyCY - r * 0.22);
        g.moveTo(cx + r * 0.66, bodyCY - r * 0.44);
        g.lineTo(cx + r * 0.3, bodyCY - r * 0.24);
        g.stroke();

        /* vòng cổ gai đỏ */
        g.strokeStyle = '#c92a2a';
        g.lineWidth = 0.11 * u;
        g.beginPath();
        g.arc(cx, bodyCY, r * 0.93, 0.35, 2.1);
        g.stroke();
        g.fillStyle = '#ffd43b';
        [0.6, 1.1, 1.6].forEach(a2 => {
            g.beginPath();
            g.arc(cx + Math.cos(a2) * r * 0.93, bodyCY + Math.sin(a2) * r * 0.93, r * 0.09, 0, TAU);
            g.fill();
        });
    }

    /* ---- chuồng gỗ ---- */
    function paintCage(g, u) {
        const w = 1.5 * u, h = 1.6 * u;
        const x = 0.1 * u, y = 0.1 * u;
        g.fillStyle = '#8a5a2b';
        rr(g, x, y, w, 0.16 * u, 0.06 * u); g.fill();          // mái
        rr(g, x, y + h - 0.14 * u, w, 0.16 * u, 0.06 * u); g.fill();  // sàn
        g.fillStyle = '#a86f36';
        rr(g, x + 0.02 * u, y + 0.02 * u, w - 0.04 * u, 0.09 * u, 0.04 * u); g.fill();
        g.strokeStyle = '#6b4423';
        g.lineWidth = 0.09 * u;
        for (let i = 0; i <= 4; i++) {
            const bx = x + 0.1 * u + (i * (w - 0.2 * u)) / 4;
            g.beginPath();
            g.moveTo(bx, y + 0.14 * u);
            g.lineTo(bx, y + h - 0.12 * u);
            g.stroke();
        }
        /* ổ khoá vàng, đúng chi tiết trong bản thiết kế */
        g.fillStyle = '#ffc93b';
        rr(g, x + w * 0.5 - 0.11 * u, y + h * 0.52, 0.22 * u, 0.2 * u, 0.05 * u);
        g.fill();
        g.strokeStyle = '#e0a400';
        g.lineWidth = 0.05 * u;
        g.beginPath();
        g.arc(x + w * 0.5, y + h * 0.52, 0.08 * u, Math.PI, 0);
        g.stroke();
    }

    /* ---- khúc gỗ để trượt qua ----
     * Cao đúng bằng khung va chạm (1,05 u tới 2,6 u) nên là một thân cây đổ to
     * chứ không phải cành nhỏ. Vẽ đúng cỡ khung là chuyện sống còn: vẽ bé hơn
     * thì bé thấy mình đâm vào không khí, vẽ to hơn thì thấy game ăn gian. */
    function paintLog(g, u) {
        const w = 1.7 * u, h = 1.5 * u;
        const x = 0.06 * u, y = 0.06 * u;
        g.fillStyle = '#7a4a22';
        rr(g, x, y, w, h, h * 0.3); g.fill();
        g.fillStyle = '#a86f36';
        rr(g, x, y, w, h * 0.55, h * 0.28); g.fill();
        g.fillStyle = '#8a5a2b';
        rr(g, x + w * 0.06, y + h * 0.34, w * 0.88, h * 0.2, h * 0.1); g.fill();

        /* mặt cắt có vân gỗ ở đầu bên phải — chi tiết làm nó ra "thân cây" */
        const ex = x + w - h * 0.14, ey = y + h / 2;
        g.fillStyle = '#c98a4b';
        g.beginPath();
        g.ellipse(ex, ey, h * 0.16, h * 0.47, 0, 0, TAU);
        g.fill();
        g.strokeStyle = '#8a5a2b';
        g.lineWidth = 0.035 * u;
        [0.62, 0.38, 0.16].forEach(k => {
            g.beginPath();
            g.ellipse(ex, ey, h * 0.16 * k, h * 0.47 * k, 0, 0, TAU);
            g.stroke();
        });

        /* mấu cành và rêu, cho khúc gỗ đỡ trơn tuột */
        g.fillStyle = '#5e3718';
        g.beginPath();
        g.ellipse(x + w * 0.34, y + h * 0.66, h * 0.09, h * 0.07, 0.3, 0, TAU);
        g.fill();
        g.fillStyle = '#4c8f3f';
        g.beginPath();
        g.ellipse(x + w * 0.28, y + h * 0.1, w * 0.22, h * 0.08, -0.06, 0, TAU);
        g.ellipse(x + w * 0.62, y + h * 0.09, w * 0.14, h * 0.06, 0.04, 0, TAU);
        g.fill();
    }

    function rr(g, x, y, w, h, r) {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }

    /* Nướng lại toàn bộ sprite. Gọi sau mỗi lần đổi cỡ màn hình — chỉ mất vài
     * mili giây, mà nếu không nướng lại thì nhân vật bị kéo giãn mờ nhoè. */
    function bakeSprites() {
        const u = V.u;
        if (!u || SPR.u === u) return;
        SPR.u = u;

        const PW = 2.6 * u, PH = 2.0 * u, PAX = 1.35 * u, PAY = 1.86 * u;
        SPR.panda = {
            run: [],
            jump: bake(PW, PH, PAX, PAY, g => paintPanda(g, u, 'jump', 0)),
            slide: bake(PW, PH, PAX, PAY, g => paintPanda(g, u, 'slide', 0)),
            cheer: bake(PW, PH, PAX, PAY, g => paintPanda(g, u, 'cheer', 0))
        };
        for (let i = 0; i < PANDA_FRAMES; i++) {
            const k = i / PANDA_FRAMES;
            SPR.panda.run.push(bake(PW, PH, PAX, PAY, g => paintPanda(g, u, 'run', k)));
        }

        SPR.pals = ANIMALS.map(sp => ({
            run: [0, 1].map(f => bake(1.5 * u, 1.2 * u, 0.58 * u, 1.06 * u,
                g => paintPal(g, u, sp, f)))
        }));

        SPR.coin = [];
        for (let i = 0; i < COIN_FRAMES; i++) {
            SPR.coin.push(bake(0.8 * u, 0.8 * u, 0.4 * u, 0.4 * u,
                g => paintCoin(g, u, i)));
        }

        SPR.guard = [0, 1].map(f => bake(1.9 * u, 1.7 * u, 0.95 * u, 1.5 * u,
            g => paintGuard(g, u, f)));
        SPR.cage = bake(1.7 * u, 1.8 * u, 0.85 * u, 1.8 * u, g => paintCage(g, u));
        SPR.log = bake(1.82 * u, 1.62 * u, 0.91 * u, 0.81 * u, g => paintLog(g, u));
    }

    /* ========================================================================
     *  10b. VẼ
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

    /* Hình khối nền, mỗi cảnh một dáng riêng. Sáu cảnh mà dùng chung một quả
     * đồi tròn thì đổi cảnh chỉ còn là đổi màu, chạy một lúc là bé thấy đâu
     * cũng như đâu. */
    function hump(x, baseY, w, h, kind) {
        ctx.beginPath();
        if (kind === 'ice' || kind === 'lava') {
            /* Núi băng và núi lửa: đỉnh nhọn hoắt. */
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + w * 0.46, baseY - h);
            ctx.lineTo(x + w * 0.68, baseY - h * 0.52);
            ctx.lineTo(x + w, baseY);
        } else if (kind === 'city') {
            /* Nhà cao tầng: khối chữ nhật có mấy ô cửa sổ khoét bằng hình răng
             * cưa ở nóc, đủ để nhận ra là phố. */
            const bw = w * 0.62;
            ctx.moveTo(x + w * 0.19, baseY);
            ctx.lineTo(x + w * 0.19, baseY - h);
            ctx.lineTo(x + w * 0.19 + bw * 0.45, baseY - h);
            ctx.lineTo(x + w * 0.19 + bw * 0.45, baseY - h * 0.78);
            ctx.lineTo(x + w * 0.19 + bw, baseY - h * 0.78);
            ctx.lineTo(x + w * 0.19 + bw, baseY);
        } else if (kind === 'fairy') {
            /* Tháp lâu đài: thân vuông, chóp nhọn. */
            ctx.moveTo(x + w * 0.24, baseY);
            ctx.lineTo(x + w * 0.24, baseY - h * 0.62);
            ctx.lineTo(x + w * 0.5, baseY - h);
            ctx.lineTo(x + w * 0.76, baseY - h * 0.62);
            ctx.lineTo(x + w * 0.76, baseY);
        } else if (kind === 'desert') {
            /* Cồn cát: một bên thoải, một bên dốc — gió thổi một chiều. */
            ctx.moveTo(x, baseY);
            ctx.bezierCurveTo(x + w * 0.45, baseY - h * 1.1,
                x + w * 0.62, baseY - h, x + w * 0.78, baseY - h * 0.9);
            ctx.quadraticCurveTo(x + w * 0.9, baseY - h * 0.5, x + w, baseY);
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

            if (it.t === T.COIN) {
                const y = sy(it.y) + Math.sin(G.time * 3 + it.bob) * V.u * 0.08;
                /* Mỗi đồng lệch pha một chút theo vị trí, nên cả dãy xu xoay
                 * gợn sóng chứ không quay rập khuôn như một khối. */
                const f = Math.floor(G.time * 9 + it.x * 1.7) % COIN_FRAMES;
                ctx.save();
                ctx.shadowColor = 'rgba(255,201,59,0.75)';
                ctx.shadowBlur = V.u * 0.3;
                blit(SPR.coin[f], x, y);
                ctx.restore();
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
                drawLog(x, it);
                return;
            }
            if (it.t === T.GUARD) {
                /* Nhấp nhổm hai hình xen kẽ: đứng chết trân thì nhìn ra hòn đá
                 * hình con thú, chứ không phải một đứa đang rình. */
                const f = Math.floor(G.time * 5 + it.bob) % 2;
                const bob = Math.sin(G.time * 5 + it.bob) * V.u * 0.05;
                blit(SPR.guard[f], x, sy(0) + bob);
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

    /* Khúc gỗ nằm ngang chắn ngang đường, khoảng hở phía dưới vừa đủ cho tư
     * thế trượt — thay cho cành cây chìa xuống của bản trước, bám theo hình
     * trong bản thiết kế. */
    function drawLog(x, it) {
        const y = sy(1.83);          // đúng tâm khung va chạm 1,05 – 2,6
        ctx.save();
        ctx.translate(x, y);
        /* Nghiêng nhẹ: khúc gỗ nằm ngay ngắn quá trông như dán vào nền. */
        ctx.rotate(-0.045);
        blit(SPR.log, 0, 0);
        ctx.restore();
        /* Bóng đổ xuống mặt đất cho khúc gỗ dính vào cảnh. */
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(x, sy(0), V.u * 0.85, V.u * 0.13, 0, 0, 6.283);
        ctx.fill();
    }

    function drawCage(x, gy, it) {
        const h = V.u * 1.6;
        const bob = Math.sin(G.time * 4 + it.bob) * V.u * 0.05;
        const sp = SPR.pals[it.pal];

        /* Chuồng treo lơ lửng thì phải có dây, không thì nhìn như cái hộp bay. */
        if (it.y > 0.3) {
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = Math.max(1, V.u * 0.05);
            ctx.beginPath();
            ctx.moveTo(x, gy - h + bob);
            ctx.lineTo(x + Math.sin(G.time * 2 + it.bob) * V.u * 0.1, 0);
            ctx.stroke();
        }

        /* Bạn nhỏ ngồi trong chuồng, nhấp nhổm cho ra vẻ đang sốt ruột chờ. */
        if (sp) {
            const f = Math.floor(G.time * 4 + it.bob) % 2;
            blit(sp.run[f], x, gy - V.u * 0.22 + bob, 0.92);
        }
        blit(SPR.cage, x, gy + bob);

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
        /* Vẽ từ cuối đoàn về đầu để bạn đứng trước che bạn đứng sau, cả đoàn
         * xếp lớp có chiều sâu chứ không phẳng lì. */
        for (let i = G.tail.length - 1; i >= 0; i--) {
            const wx = G.x - (i + 1) * TAIL_GAP;
            const wy = trailAt(wx);
            const sp = SPR.pals[G.tail[i]];
            if (!sp) continue;
            const ph = G.runCycle - i * 0.6;
            const hop = Math.abs(Math.sin(ph)) * 0.16;
            palShadow(sx(wx), sy(wy));
            blit(sp.run[Math.sin(ph) > 0 ? 1 : 0], sx(wx), sy(wy + hop));
        }

        if (G.escapees) {
            G.escapees.forEach(e => {
                const k = Math.min(1, (G.time - e.born) / 1.4);
                const sp = SPR.pals[e.pal];
                if (!sp) return;
                ctx.save();
                ctx.rotate(0);
                blit(sp.run[Math.floor(G.time * 14) % 2], sx(e.x), sy(e.y), 1, 1 - k);
                ctx.restore();
            });
        }
    }

    function palShadow(x, y) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(x, y, V.u * 0.3, V.u * 0.08, 0, 0, 6.283);
        ctx.fill();
    }

    function drawPlayer() {
        const x = sx(G.x);
        const y = sy(G.y);
        const hurt = G.time < G.hurtUntil;

        /* Bóng đổ vẽ trước, và vẽ cả lúc đang nhấp nháy: mất luôn cái bóng thì
         * lúc bất tử bé không còn manh mối nào để biết mình đang ở đâu. */
        const sup = supportAt(G.x, G.y, 1, G.y);
        if (sup != null) {
            const shY = sy(sup);
            const k = Math.max(0.25, 1 - (shY - y) / (V.u * 5));
            ctx.fillStyle = 'rgba(0,0,0,' + (0.28 * k) + ')';
            ctx.beginPath();
            ctx.ellipse(x, shY, V.u * 0.55 * k, V.u * 0.16 * k, 0, 0, 6.283);
            ctx.fill();
        }

        /* Nhấp nháy lúc bất tử — không có dấu hiệu này thì bé không hiểu vì sao
         * vừa đâm vào đá mà lần này không sao. */
        if (hurt && Math.floor(G.time * 14) % 2 === 0) return;

        /* khiên */
        if (G.shield > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.3 + 0.15 * Math.sin(G.time * 6);
            ctx.strokeStyle = '#8ed0ff';
            ctx.lineWidth = V.u * 0.12;
            ctx.beginPath();
            ctx.arc(x, y - V.u * 0.8, V.u * 1.25, 0, 6.283);
            ctx.stroke();
            ctx.restore();
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

        if (!SPR.panda) return;

        /* Chọn tấm sprite theo tư thế. Chu kỳ chạy chia tám hình, chạy nhanh
         * thì lật hình nhanh theo — chân panda bước đúng nhịp mặt đất trôi chứ
         * không trượt băng. */
        let s;
        if (G.sliding > 0) s = SPR.panda.slide;
        else if (!G.onGround || G.rocketT > 0) s = SPR.panda.jump;
        else if (G.time - G.cheerAt < 0.45) s = SPR.panda.cheer;
        else {
            const f = Math.floor((G.runCycle / TAU) * PANDA_FRAMES) % PANDA_FRAMES;
            s = SPR.panda.run[(f + PANDA_FRAMES) % PANDA_FRAMES];
        }

        ctx.save();
        /* Nghiêng người theo đà rơi: lên thì ưỡn ra sau, xuống thì chúi tới. */
        if (!G.onGround && G.rocketT <= 0) {
            ctx.translate(x, y);
            ctx.rotate(Math.max(-0.18, Math.min(0.2, G.vy * 0.012)));
            ctx.translate(-x, -y);
        }
        blit(s, x, y);
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
        dist: el('hud-dist'), pals: el('hud-pals'), coins: el('hud-coins'),
        score: el('hud-score'), combo: el('hud-combo'), comboWrap: el('combo-wrap'),
        zone: el('hud-zone'),
        powers: el('power-strip'),
        menu: el('menu-overlay'), over: el('over-overlay'), pause: el('pause-overlay'),
        pauseDist: el('pause-dist'), pausePals: el('pause-pals'), pauseCoins: el('pause-coins'),
        pauseIcon: el('pause-icon'), pauseText: el('pause-text'), countdown: el('countdown'),
        overDist: el('over-dist'), overPals: el('over-pals'), overCoins: el('over-coins'),
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
        ui.coins.textContent = G.coins;
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
        stopCountdown();
        G.resuming = false;
        hide(ui.hud);
        hide(ui.over);
        hide(ui.pause);
        paintPauseBtn();
        show(ui.menu);
        ui.menuBest.textContent = store.data.best;
        ui.menuPals.textContent = store.data.bestPals;
    }

    function showOver(newBest) {
        ui.overDist.textContent = G.metres;
        ui.overPals.textContent = G.pals;
        ui.overCoins.textContent = G.coins;
        ui.overScore.textContent = G.score;
        ui.overBest.textContent = store.data.best;
        ui.overNew.hidden = !newBest;
        paintMissions(ui.overMissions);
        show(ui.over);
    }

    function play() {
        sfx.wake();
        sfx.playBgm();
        stopCountdown();
        G.resuming = false;
        hide(ui.menu);
        hide(ui.over);
        hide(ui.pause);
        show(ui.hud);
        startRun();
        paintPauseBtn();
    }

    /* ---- tạm dừng ----
     * Bé đang chạy dở mà mẹ gọi thì phải có chỗ dừng lại, không thì đoàn bạn
     * gom cả buổi đi tong vì một cuộc gọi. */
    function pause() {
        if (G.mode !== 'play' && !G.resuming) return;
        stopCountdown();
        G.resuming = false;
        G.mode = 'paused';
        sfx.pauseBgm();
        ui.pauseDist.textContent = G.metres;
        ui.pausePals.textContent = G.tail.length;
        ui.pauseCoins.textContent = G.coins;
        show(ui.pause);
        paintPauseBtn();
    }

    function resume() {
        if (G.mode !== 'paused') return;
        hide(ui.pause);
        /* Đang đếm ngược thì coi như đã chạy tiếp rồi: nút phải đọc là "Tạm
         * dừng", và bấm vào nó phải dừng lại chứ không phải đếm lại từ đầu. */
        G.resuming = true;
        paintPauseBtn();
        /* Đếm ngược ba nhịp rồi mới chạy tiếp: thả bé vào giữa đường ngay lúc
         * vừa bấm thì ngón tay còn chưa về chỗ đã đâm phải hòn đá đầu tiên. */
        countdown(3);
    }

    function togglePause() {
        if (G.mode === 'play' || G.resuming) pause();
        else if (G.mode === 'paused') resume();
    }

    let cdTimer = null;

    function stopCountdown() {
        if (cdTimer) { clearTimeout(cdTimer); cdTimer = null; }
        hide(ui.countdown);
    }

    function countdown(n) {
        if (n <= 0) {
            ui.countdown.textContent = 'GO!';
            ui.countdown.className = 'countdown go';
            sfx.pal();
            sfx.playBgm();
            cdTimer = setTimeout(() => {
                stopCountdown();
                cdTimer = null;
                /* Chỉ cho chạy tiếp nếu trong lúc đếm bé không bấm sang chỗ
                 * khác — bấm Menu giữa chừng mà vẫn nhảy vào lượt cũ thì lạ. */
                if (G.mode === 'paused') G.mode = 'play';
                G.resuming = false;
                /* Vẽ lại nút SAU khi mode đã đổi. Vẽ trước thì hàm vẽ vẫn đọc
                 * thấy mode là 'paused' và nhãn kẹt ở "Chơi tiếp" mãi mãi. */
                paintPauseBtn();
            }, 420);
            return;
        }
        ui.countdown.textContent = n;
        /* Gán lại className mỗi nhịp để chạy lại hiệu ứng nảy của CSS. */
        ui.countdown.className = 'countdown';
        void ui.countdown.offsetWidth;
        ui.countdown.className = 'countdown tick';
        sfx.tone(440 + (3 - n) * 90, 0.12, 'triangle', 0.09);
        cdTimer = setTimeout(() => countdown(n - 1), 600);
    }

    function paintPauseBtn() {
        /* Chỉ đọc là "chơi tiếp" khi thật sự đang đứng im. Lúc đang đếm ngược
         * thì game coi như đã chạy, nút phải quay về "tạm dừng". */
        const on = G.mode === 'paused' && !G.resuming;
        ui.pauseIcon.className = 'fa-solid ' + (on ? 'fa-play' : 'fa-pause');
        ui.pauseText.textContent = on ? 'Resume' : 'Pause';
    }

    /* ---- điều khiển ----
     * Một ngón là đủ: chạm nửa trên nhảy, chạm nửa dưới trượt. Bàn phím có
     * thêm mũi tên cho ai chơi trên máy tính. */
    /* ---- điều khiển bằng chạm ----
     *  chạm bất kỳ đâu   → nhảy
     *  chạm rồi giữ      → nhảy xa hơn
     *  vuốt từ trên xuống → nằm
     *
     *  Bản trước chia màn hình làm hai nửa: nửa trên nhảy, nửa dưới nằm. Trên
     *  iPad màn to, bé cầm hai tay ở mép dưới nên ngón cái rơi đúng vào vùng
     *  "nằm" — định nhảy mà thành nằm. Chạm đâu cũng nhảy thì không còn cái
     *  bẫy đó nữa.
     *
     *  Chỗ khó: cú nhảy phải nổ NGAY lúc đặt ngón xuống, không thì mất cảm
     *  giác nhạy, mà lúc đó chưa biết bé sắp vuốt xuống hay không. Nên vẫn cho
     *  nhảy ngay; nếu ngay sau đó phát hiện vuốt xuống trong lúc bé còn sát
     *  đất thì gỡ cú nhảy ra, trả về mặt đất rồi cho nằm. Cửa sổ gỡ chỉ hơn
     *  một phần năm giây nên mắt gần như không thấy.
     */
    /* Ngón tay vừa đặt xuống thì chưa biết bé định NHẢY hay định VUỐT XUỐNG để
     * nằm — hai thao tác bắt đầu giống hệt nhau.
     *
     * Bản trước cho nhảy ngay lúc chạm, phát hiện vuốt thì mới gỡ cú nhảy ra.
     * Nhưng gỡ xong thì mắt đã kịp thấy panda nhổm lên rồi mới nằm xuống — sai
     * hẳn động tác, đúng như anh gặp trên iPad.
     *
     * Giờ chờ đúng một nhịp rất ngắn trước khi quyết:
     *   ngón trượt xuống quá ngưỡng trong nhịp đó → NẰM, cú nhảy không bao giờ
     *                                               xảy ra, không còn gì để gỡ
     *   hết nhịp mà ngón vẫn đứng yên            → NHẢY
     *   nhấc ngón trước khi hết nhịp             → NHẢY ngay lập tức
     *
     * Cái giá là độ trễ TOUCH_WAIT giây cho mỗi cú nhảy. Ở tốc độ đầu game bé
     * chỉ đi thêm được nửa đơn vị trong quãng đó — đổi lấy việc động tác không
     * bao giờ sai nữa thì quá rẻ. Bàn phím không dính độ trễ này. */
    const TOUCH_WAIT = 0.085;

    function wireInput() {
        const host = canvas.parentElement;
        let touchId = null, touchY0 = 0, touchAt = 0, swiped = false;
        let waitTimer = null;

        const clearWait = () => {
            if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
        };

        host.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            sfx.wake();
            if (G.mode !== 'play') return;
            clearWait();
            touchId = ev.pointerId;
            touchY0 = ev.clientY;
            touchAt = G.time;
            swiped = false;
            /* Chưa nhảy vội — chờ xem có phải bé đang vuốt xuống không. */
            waitTimer = setTimeout(() => {
                waitTimer = null;
                if (!swiped) jump();
            }, TOUCH_WAIT * 1000);
        });

        host.addEventListener('pointermove', ev => {
            if (G.mode !== 'play' || swiped || ev.pointerId !== touchId) return;
            /* Ngưỡng vuốt để thấp: nhận ra càng sớm thì càng chắc bắt kịp trong
             * nhịp chờ, khỏi phải rơi xuống đường gỡ cú nhảy phía dưới. */
            const need = Math.max(16, V.u * 0.32);
            if (ev.clientY - touchY0 < need) return;
            swiped = true;
            /* Bắt kịp trong nhịp chờ: huỷ cú nhảy khi nó còn chưa xảy ra. Đây
             * là đường đi sạch nhất, không để lại vết gì trên màn hình. */
            clearWait();
            /* Ngón còn đặt trên màn thì cứ nằm, nhấc lên mới đứng dậy. */
            G.slideHold = true;

            /* Vuốt chậm quá, cú nhảy đã kịp nổ: gỡ ra, trả về mặt đất. Đường dự
             * phòng thôi — nhịp chờ ở trên bắt được gần hết. */
            if (G.time - touchAt < 0.3 && !G.onGround && G.vy < 0 && G.y < 1.2) {
                G.y = G.groundAt;
                G.vy = 0;
                G.onGround = true;
                G.jumpHold = 0;
            }
            slide();
        });

        const endTouch = ev => {
            if (ev && ev.pointerId != null && ev.pointerId !== touchId) return;
            /* Nhấc ngón trước khi hết nhịp chờ: đó là một cú chạm nhanh, cho
             * nhảy ngay rồi thả liền — thành cú nhảy thấp, đúng như bé muốn. */
            if (waitTimer && !swiped) {
                clearWait();
                jump();
            }
            clearWait();
            touchId = null;
            G.slideHold = false;
            releaseJump();
        };
        host.addEventListener('pointerup', ev => { ev.preventDefault(); endTouch(ev); });
        host.addEventListener('pointercancel', endTouch);
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
                G.slideHold = true;
                slide();
            }
            if (k === 'p' || k === 'P' || k === 'Escape') {
                ev.preventDefault();
                togglePause();
            }
        });
        window.addEventListener('keyup', ev => {
            const k = ev.key;
            if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') releaseJump();
            if (k === 'ArrowDown' || k === 's' || k === 'S') G.slideHold = false;
        });
        /* Rời khỏi cửa sổ giữa lúc đang giữ phím thì không có keyup nào tới —
         * không thả ra ở đây là panda nằm bò mãi. */
        window.addEventListener('blur', () => { G.slideHold = false; releaseJump(); });
    }

    function wireButtons() {
        el('btn-play').addEventListener('click', play);
        el('btn-again').addEventListener('click', play);
        el('btn-over-menu').addEventListener('click', showMenu);
        el('btn-nav-restart').addEventListener('click', play);
        el('btn-nav-pause').addEventListener('click', togglePause);
        el('btn-resume').addEventListener('click', resume);
        el('btn-pause-menu').addEventListener('click', showMenu);

        /* Chuyển tab, khoá máy hay nghe điện thoại là tự dừng luôn — bé quay
         * lại mà thấy đoàn bạn đã mất sạch thì oan quá. */
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) pause();
        });
        window.addEventListener('blur', pause);

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
        /* Đang nghỉ thì đồng hồ của game đứng hẳn. Để nó chạy tiếp thì lúc quay
         * lại chuỗi combo đã tự tuột và mọi hiệu ứng đang dở đã tan mất. */
        if (G.mode === 'paused') dt = 0;
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
        window.pandaRun = {
            G, V, SPR, ANIMALS, ZONES, CHUNKS, store, sfx,
            play, jump, slide, releaseJump, pause, resume,
            state: () => ({
                mode: G.mode, m: G.metres, pals: G.tail.length, rescued: G.pals,
                coins: G.coins, score: G.score, combo: G.combo, speed: +G.speed.toFixed(2),
                zone: zone().key, shield: G.shield
            })
        };

        requestAnimationFrame(frame);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
