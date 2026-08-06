/* ============================================================================
 * SPIDER CLIMB — LUẬT & BỘ SINH MÀN
 * ----------------------------------------------------------------------------
 * Tệp này KHÔNG biết gì về canvas, không chạm vào DOM. Nhờ vậy node chạy thẳng
 * được, và check-climb.js sinh ra hàng chục nghìn mét màn rồi soát từng điều
 * luật công bằng trước khi có ai vẽ một nét nào.
 *
 * VÌ SAO TÁCH RA
 * Bản thiết kế đòi đúng một thứ khó nhất ở game leo vô tận: "lúc nào cũng phải
 * còn ít nhất một đường đi hợp lý". Điều ấy nghe hiển nhiên nhưng rải chướng
 * ngại ngẫu nhiên là hỏng ngay — hai bức tường cùng bị chặn ở một độ cao thì
 * người chơi chết mà không hiểu vì sao, và loại chết ấy giết game nhanh hơn
 * mọi thứ khác. Nên phép ĐẶT vật cản ở đây tự từ chối những chỗ đặt sai, còn
 * máy soát thì kiểm lại lần nữa trên màn thật.
 *
 * HỆ TRỤC
 *   worldY tăng dần khi LEO LÊN. Xuất phát ở 0 (mặt đường), leo mãi tới +∞.
 *   Độ cao mét = worldY / PX_PER_M.
 *   Toạ độ ngang trong khe tính bằng "ax" — 0 là mặt trong tường trái, 1 là
 *   mặt trong tường phải. Khe rộng hẹp thay đổi theo độ cao, dùng ax thì mọi
 *   thứ tự co giãn theo, khỏi phải tính lại.
 *
 * BỐ CỤC
 *   1. Khổ sân, hằng số vật lý      6. Thư viện khuôn màn
 *   2. Sáu vùng cao độ              7. Bộ sinh
 *   3. Đường cong khó               8. Nhiệm vụ
 *   4. Ngẫu nhiên có hạt giống      9. Trang phục
 *   5. Thế giới & phép đặt an toàn 10. Điểm
 * ==========================================================================*/
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.ClimbRules = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ========================================================================
     *  1. KHỔ SÂN VÀ HẰNG SỐ VẬT LÝ
     * ======================================================================*/

    var W = 540, H = 960;          // khổ sân lô-gic, dựng đứng 9:16
    var PX_PER_M = 20;             // 20 điểm ảnh là một mét

    var GAP_MIN = 190;             // khe hẹp nhất — nhảy nhanh, nhịp gấp
    var GAP_DEF = 258;             // khe thường
    var GAP_MAX = 336;             // khe rộng nhất — bay lâu, hở sườn lâu

    /* Khoảng trống BẮT BUỘC trên tường đối diện, tính từ hai đầu một vật cản.
     * Đây là con số giữ cho game công bằng: bị chặn bên này thì bên kia phải
     * quang ít nhất chừng ấy, cả trên lẫn dưới. Hệ quả là hai vật cản ở hai
     * tường luôn cách nhau ít nhất 2×CLEAR = 300 điểm ảnh ≈ 1,5 giây leo lúc
     * mới xuất phát. Đủ để nhìn thấy, nghĩ, rồi nhảy. */
    var CLEAR = 150;
    var SAME_SIDE_MIN = 200;       // hai vật cản cùng một tường phải cách nhau
    var SURFACE_CLEAR = 90;        // mặt tường xấu cũng phải chừa bên kia quang

    /* Bước so le nhỏ nhất còn hợp luật giữa hai vật cản Ở HAI TƯỜNG: chiều cao
     * một vật cản (120) cộng 2×CLEAR, thêm chút dư cho khuôn nào đặt vật cản
     * cao hơn. Mọi khuôn ép đổi tường đều phải dùng con số này thay vì tự đoán
     * — đoán thấp hơn thì phép đặt lẳng lặng từ chối, và khuôn mất tác dụng mà
     * không có gì kêu lên. */
    var STEP = 120 + 2 * CLEAR + 50;

    /* ---- Vật lý nhân vật ---- */
    var CLIMB_BASE = 188;          // tốc độ leo lúc xuất phát (điểm ảnh/giây)
    var CLIMB_MAX = 338;           // trần tốc độ leo
    /* Bắt tường xong thì leo vọt lên trong non một giây. Đây là PHẦN THƯỞNG
     * cho cú nhảy đẹp, và nó tự khép vòng: nhảy giỏi thì lên nhanh, lên nhanh
     * thì điểm cao, chứ không cần thêm nút nào để bấm. */
    var CLIMB_BOOST = 1.55;
    /* KÍNH: leo bình thường, nhưng MÉP TRÊN của ô kính là hạn chót.
     *
     * Bản đầu kính làm tụt xuống. Chạy thử thì nó chỉ là một đoạn bực mình chứ
     * không phải một quyết định: đằng nào cũng phải nhảy, chỉ là nhảy muộn hơn.
     * Nay leo qua kính nhanh như thường, nhưng bò tới sát mép trên là cả tấm
     * vỡ và rơi — nên câu hỏi thành "nhảy đi lúc nào", và người chơi NHÌN THẤY
     * hạn chót của mình từ xa thay vì đoán theo đồng hồ trong đầu.
     *
     * Đổi này còn lật ngược ý nghĩa nút LEO NHANH, và đó là chỗ hay nhất: trên
     * tấm nứt thì leo nhanh là lối thoát, còn trên kính thì leo nhanh đẩy mình
     * tới hạn chót sớm hơn. Cùng một nút, hai mặt tường, hai câu trả lời trái
     * ngược. */
    var GLASS_WARN = 160;          // vào quãng này tính từ mép trên thì kính rạn
    var GLASS_GRACE = 0.35;        // vừa bám vào thì luôn có bấy nhiêu giây để phản ứng
    var GLASS_MIN_H = 240;         // ô kính không được ngắn hơn, không thì hạn chót tới ngay
    var JUMP_VX = 760;             // tốc độ ngang lúc nhảy, KHÔNG đổi theo khe
    var GRAVITY = 1460;            // trọng lực trong CÚ NHẢY — nặng cho cú bay gọn
    /* Nhưng lúc RƠI thì nhẹ hơn hẳn, và có tốc độ tối đa.
     *
     * Máy chơi thử đo ra chỗ này: 28 trên 30 lần chết là rơi khỏi đáy màn.
     * Nguyên do không phải người chơi kém — mà là dưới chân họ chỉ còn 42%
     * chiều cao màn hình, rơi với trọng lực của cú nhảy thì hết veo trong bảy
     * phần mười giây. Bản thiết kế đòi "rơi nhẹ thì cứu được nếu bắt tường kịp",
     * mà bảy phần mười giây thì chưa kịp nhận ra là mình đang rơi.
     *
     * Nhẹ đi và có trần tốc độ thì cửa sổ ấy thành hơn một giây rưỡi: đủ để
     * nhìn, chọn tường, rồi bắn tơ. Rơi vẫn đáng sợ, nhưng đáng sợ vì mất độ
     * cao và mất một lần bắn tơ, chứ không phải vì không kịp làm gì. */
    var FALL_GRAVITY = 760;
    var FALL_MAX_V = 560;          // tốc độ rơi tối đa (điểm ảnh/giây)
    var FALL_DRIFT = 60;           // rơi thì trôi nhẹ vào giữa khe
    var CAM_ANCHOR = 0.58;         // người chơi đứng ở đây tính từ mép trên
    var PLAYER_R = 17;             // bán kính người chơi

    /* Khe rộng nhất chia cho tốc độ ngang ra thời gian bay dài nhất:
     * 336/760 ≈ 0,44 giây. Khe hẹp nhất 190/760 ≈ 0,25 giây. Chính khoảng chênh
     * ấy là "khe rộng khó hơn" — không phải vì nhảy hụt (nhảy hụt là bất công,
     * người chơi có làm gì sai đâu) mà vì hở sườn lâu gần gấp đôi giữa khe.
     *
     * Cú nhảy KHÔNG có vận tốc dọc riêng, và cũng không chịu trọng lực. Đang
     * bay thì độ cao vẫn tăng đúng tốc độ leo — nhảy là chuyện đi ngang, đổi
     * tường; đi lên là việc khác và phải chạy liên tục, vì máy quay bám vào
     * đó. Vòng cung của cú nhảy nằm ở phần vẽ chứ không ở toạ độ thật. */

    /* ---- Ba nhân vật phản diện ---- */
    /* Gã thò ra cao bấy nhiêu điểm ảnh. Người nhện cao chừng 50, nên 70 là
     * vừa: nhỉnh hơn một chút cho ra dáng vai u thịt bắp, chứ không phải một
     * gã khổng lồ. Con số này phải khai ĐÚNG MỘT CHỖ — phép đặt, phép soát và
     * phần vẽ đều đọc từ đây, mà bài học lệch số của mấy lần trước còn mới. */
    var THUG_H = 70;
    var THUG_WARN = 0.9;           // cửa sổ lạch cạch bấy nhiêu giây trước khi hắn thò ra
    var THUG_OUT = 1.4;            // rồi hắn chắn tường bấy nhiêu giây
    var RIVAL_SPEED = 132;         // đối thủ tụt xuống nhanh chừng này (điểm ảnh/giây)
    var RIVAL_WINDUP = 0.55;       // hắn rùn người bấy nhiêu giây trước khi nhảy sang
    /* Mỗi lượt chạm mặt hắn chỉ được nhảy sang tường mình ĐÚNG MỘT LẦN.
     *
     * Đây là con số giữ cho hắn thú vị thay vì bất công. Cho nhảy không giới
     * hạn thì hắn bám dính lấy người chơi và đường thoát biến mất — mà bản
     * thiết kế đòi lúc nào cũng phải còn một đường đi hợp lý. Một lần thì
     * thành ra đúng một màn đấu trí: đổi tường, hắn theo, đổi lại, hắn hết
     * lượt. */
    var RIVAL_JUMPS = 1;
    var SHOT_SPEED = 430;          // đạn rô-bốt gác bay ngang
    var SHOT_LIVE = 0.9;           // và sống được bấy nhiêu giây

    /* ---- Sét ở vùng Đêm Giông ----
     *
     * Tia sét KHÔNG đánh vào chỗ người chơi đang đứng — nó đánh vào chỗ người
     * chơi SẼ tới nếu cứ leo đều như thế. Nghe thì ác, nhưng chính chỗ ấy làm
     * nó thành một mối nguy chơi được: đứng yên leo tiếp là dính, muốn né thì
     * phải ĐỔI một thứ gì đó — nhảy sang tường kia, hoặc bấm leo nhanh cho vượt
     * qua. Đánh vào chỗ hiện tại thì người chơi tự leo ra khỏi đó, tia sét
     * thành trò trang trí; đánh mà không báo trước thì thành xổ số.
     *
     * 1,15 giây báo trước là con số quan trọng nhất ở đây: đủ để nhìn thấy
     * vòng sáng, hiểu ra nó đang nhắm đâu, rồi kịp bấm một cái. */
    var BOLT_WARN = 1.15;          // giây vòng ngắm nhấp nháy trước khi sét giáng
    var BOLT_HIT = 0.22;           // giây tia sét ở lại trên màn
    var BOLT_R = 46;               // bán kính ăn đòn
    var BOLT_GAP_MIN = 5.5;        // giãn cách hai tia, ngắn nhất
    var BOLT_GAP_MAX = 9.5;        // và dài nhất
    var BOLT_GRACE = 3.5;          // vừa vào vùng giông thì được yên bấy nhiêu giây

    var CRACK_HOLD = 1.25;         // bám tấm nứt quá ngần này giây thì vỡ
    var WEB_MAX = 3;               // số lần bắn tơ giữ trong người
    var WEB_RECHARGE = 6.2;        // giây nạp lại một lần bắn
    var WEB_RANGE = 430;           // tầm bắn
    /* Hồi sinh xong thì phía trên phải quang bấy nhiêu điểm ảnh.
     *
     * 300 là chừng một giây rưỡi leo lúc mới xuất phát. Đây không phải con số
     * cho đẹp: chỗ hồi sinh chỉ cần "bám được" thôi thì có thể là chỗ ngay
     * dưới một cục điều hoà — bám được thật, nhưng leo một cái là đâm, rơi
     * tiếp, mất mạng tiếp. Mất mạng vì mình chơi dở thì chịu, mất mạng vì chỗ
     * game đặt mình vào thì không ai chịu được. */
    var RESPAWN_CLEAR = 300;

    var LIVES = 3;                 // số lần rơi được cứu trong một lượt
    var NEAR_MISS_PX = 46;         // sát bao nhiêu thì tính là "né sát"

    /* ========================================================================
     *  2. SÁU VÙNG CAO ĐỘ
     * ------------------------------------------------------------------------
     *  Mốc mét lấy đúng theo bản thiết kế. Mỗi vùng đổi cả bầu trời, màu toà
     *  nhà lẫn thời tiết — leo cao mà cảnh không đổi thì chẳng ai leo tiếp.
     * ======================================================================*/

    var ZONES = [
        {
            id: 'street', from: 0, to: 500, name: 'Street Morning', icon: '🌅',
            sky: ['#8fd0f0', '#d9eefb', '#ffe6c2'], tower: '#b9a48c', towerDark: '#8d7862',
            win: '#ffe9b8', winOff: '#8f7c66', far: '#a9bfd4', accent: '#ffb861',
            weather: 'none'
        },
        {
            id: 'district', from: 500, to: 1500, name: 'Skyscraper District', icon: '🏙️',
            sky: ['#4b8fd6', '#8ec6ef', '#cfe8f7'], tower: '#7f93ab', towerDark: '#5d7088',
            win: '#d8f2ff', winOff: '#4b5e75', far: '#7f9bbb', accent: '#4bd7ff',
            weather: 'none'
        },
        {
            id: 'cloudline', from: 1500, to: 3000, name: 'Cloudline', icon: '☁️',
            sky: ['#6fa9d8', '#b9d9ee', '#e8f3fa'], tower: '#9aa7b6', towerDark: '#71808f',
            win: '#eaf6ff', winOff: '#5b6a7b', far: '#b9cfe0', accent: '#9de8ff',
            weather: 'mist'
        },
        {
            id: 'sunset', from: 3000, to: 4500, name: 'Construction Sunset', icon: '🌇',
            sky: ['#3a2a63', '#c8584f', '#ffb361'], tower: '#8a6a55', towerDark: '#5f473a',
            win: '#ffd08a', winOff: '#6b4f3f', far: '#7b5566', accent: '#ff9040',
            weather: 'none'
        },
        {
            /* PHỐ ĐÊM. Chỗ này trước bỏ trống: leo qua hoàng hôn là vào thẳng
             * cơn giông, tức là cả game không có lấy một quãng thành phố ban
             * đêm sáng đèn — mà đó lại đúng là hình ảnh người ta nghĩ tới đầu
             * tiên khi nghe "người nhện leo toà nhà chọc trời".
             *
             * Nó cũng đặt đúng chỗ trong nhịp cảm xúc: sau quãng công trường
             * ngổn ngang là một quãng đẹp và bình yên, để cơn giông ngay sau đó
             * đổ xuống cho ra đổ. */
            id: 'neon', from: 4500, to: 6200, name: 'Neon Night City', icon: '🌃',
            sky: ['#050a1c', '#0d1a3d', '#2a3f6b'], tower: '#2a3550', towerDark: '#151d2f',
            win: '#ffe9a8', winOff: '#232c44', far: '#111a33', accent: '#ff56c8',
            weather: 'none',
            /* Gần như ô nào cũng sáng — thành phố sầm uất thì nhìn lên là một
             * tấm lưới đèn, chứ không phải vài ô lác đác. */
            winLit: 0.82,
            neon: ['#ff56c8', '#4bd7ff', '#8fff6a', '#ffb03a'],
            cityLights: 1
        },
        {
            id: 'storm', from: 6200, to: 8500, name: 'Night Storm', icon: '⛈️',
            sky: ['#080d1e', '#132146', '#22355f'], tower: '#2e3a52', towerDark: '#1c2537',
            win: '#ffe07a', winOff: '#26314a', far: '#1a2440', accent: '#7ec8ff',
            weather: 'rain', winLit: 0.66, cityLights: 1
        },
        {
            id: 'sky', from: 8500, to: Infinity, name: 'Sky Fantasy', icon: '🌌',
            sky: ['#120a35', '#3d1f6d', '#6d3f9c'], tower: '#3b2f63', towerDark: '#251d44',
            win: '#c9a6ff', winOff: '#2e2550', far: '#2a1f4d', accent: '#ff7ae0',
            weather: 'aurora'
        }
    ];

    function zoneAt(m) {
        for (var i = ZONES.length - 1; i >= 0; i--) if (m >= ZONES[i].from) return ZONES[i];
        return ZONES[0];
    }
    function zoneIndexAt(m) {
        for (var i = ZONES.length - 1; i >= 0; i--) if (m >= ZONES[i].from) return i;
        return 0;
    }

    /* ========================================================================
     *  3. ĐƯỜNG CONG KHÓ
     * ------------------------------------------------------------------------
     *  Khó lên bằng cách CHỒNG THÊM LỚP chứ không phải bằng cách phạt nặng
     *  hơn. Tốc độ leo nhích chậm, còn thứ tăng nhanh là mật độ vật cản và số
     *  mối nguy cùng lúc — người chơi giỏi lên là ra quyết định nhanh hơn, chứ
     *  không phải bấm nhanh hơn.
     * ======================================================================*/

    /* Đường cong chữ S: 400 mét đầu gần như phẳng cho người mới quen ngón tay,
     * giữa quãng mới dốc, rồi thoải dần nên leo mấy nghìn mét vẫn còn chỗ nhanh
     * thêm. Hàm bão hoà thường dùng (1-e^-x) dốc nhất ngay lúc xuất phát — sai
     * hẳn chỗ cần. */
    function curve(m, half) {
        var t = m / half;
        return (t * t) / (1 + t * t);
    }

    function difficulty(m) {
        var c = curve(m, 2600);
        return {
            climb: CLIMB_BASE + (CLIMB_MAX - CLIMB_BASE) * c,
            /* Nhịp vật cản dày lên, nhưng có trần: dày quá thì màn thành mê
             * cung, mà mê cung đọc bằng mắt trong nửa giây là bất khả. */
            density: 0.34 + 0.42 * c,
            moverSpeed: 1 + 0.75 * c,
            /* Cửa sổ phản ứng của tia laser co lại, nhưng không bao giờ dưới
             * MIN_WINDOW ở mục 5 — máy soát canh chỗ này. */
            window: 1 - 0.42 * c,
            layers: 1 + Math.floor(c * 2.4)
        };
    }

    /* ========================================================================
     *  4. NGẪU NHIÊN CÓ HẠT GIỐNG
     * ------------------------------------------------------------------------
     *  Chế độ "Leo Hằng Ngày" cần mọi người gặp đúng một màn giống nhau, nên
     *  không dùng Math.random được. mulberry32: ngắn, nhanh, phân bố đủ tốt.
     * ======================================================================*/

    function makeRng(seed) {
        var a = (seed >>> 0) || 1;
        function rnd() {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
        rnd.range = function (lo, hi) { return lo + rnd() * (hi - lo); };
        rnd.int = function (lo, hi) { return Math.floor(lo + rnd() * (hi - lo + 1)); };
        rnd.pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };
        rnd.chance = function (p) { return rnd() < p; };
        return rnd;
    }

    /* Hạt giống của ngày, tính từ lịch chứ không từ đồng hồ — ai ở múi giờ nào
     * cũng có màn riêng của ngày hôm đó theo lịch máy mình. */
    function dailySeed(date) {
        var d = date || new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    /* ========================================================================
     *  5. THẾ GIỚI & PHÉP ĐẶT AN TOÀN
     * ------------------------------------------------------------------------
     *  Mọi thứ trong màn nằm ở đây. Điểm mấu chốt: các hàm đặt đều TỰ TỪ CHỐI
     *  chỗ đặt phạm luật và trả về false. Khuôn màn nào bị từ chối thì đơn giản
     *  là chỗ ấy quang — thà thiếu một vật cản còn hơn có một cái bẫy chết.
     * ======================================================================*/

    var MIN_WINDOW = 1.15;         // giây tối thiểu mối nguy tuần hoàn để hở

    /* Con bay chiếm chừng bấy nhiêu phần một lượt bay qua — phần còn lại của
     * nửa chu kỳ là khe trống. */
    var FLY_OCC = 0.35;

    var SIDE_L = 0, SIDE_R = 1;

    function overlap(a0, a1, b0, b1) { return a0 < b1 && b0 < a1; }

    /* CỬA SỔ AN TOÀN của một mối nguy tuần hoàn, tính bằng giây.
     *
     * Hàm này là NGUỒN SỰ THẬT DUY NHẤT, và nó phải như vậy. Bản đầu em viết
     * công thức ở hai chỗ — một chỗ để ép lúc đặt, một chỗ để soát — rồi hai
     * chỗ lệch nhau: phép đặt tưởng đã kẹp đủ, máy soát vẫn kêu hở có 1,04 s.
     * Sai không phải ở con số nào cả, sai ở chỗ có HAI con số. */
    /* Mốc mét ba nhân vật phản diện bước vào. Giãn xa nhau, và mỗi đứa lần đầu
     * xuất hiện là xuất hiện MỘT MÌNH — luật giới thiệu dần của bản thiết kế.
     * Gặp lần đầu mà đã kèm mối nguy khác thì người chơi chỉ kịp thấy mình
     * chết, không kịp thấy mình chết vì cái gì. */
    var THUG_M = 700;              // gã thò ra cửa sổ
    var RIVAL_M = 2200;            // người nhện đối thủ, leo ngược xuống
    var SENTRY_M = 4200;           // rô-bốt gác, bắn đón đầu

    function moverWindow(m) {
        if (m.kind === 'laser') return m.period - m.charge - m.fire;
        /* Gã kia thò ra bao lâu thì nguy hiểm bấy lâu; phần còn lại của chu kỳ
         * là khe trống, kể cả quãng hắn đang loay hoay mở cửa sổ. */
        if (m.kind === 'thug') return m.period - m.out;
        if (m.kind === 'sentry') return m.period - m.charge - SHOT_LIVE;
        /* Đối thủ không tuần hoàn — hắn đi xuống một lần rồi thôi. Chỗ giữ cho
         * hắn công bằng không phải chu kỳ mà là số lần được nhảy sang tường
         * mình, xem RIVAL_JUMPS. */
        if (m.kind === 'rival') return Infinity;
        if (m.kind === 'drone' || m.kind === 'bird') return m.period * 0.5 * (1 - FLY_OCC);
        if (m.kind === 'debris') return m.period - 0.8;
        if (m.kind === 'swing') return m.period * 0.5;
        return Infinity;               // giàn lau kính và cục điều hoà long không tuần hoàn
    }

    function World(seed) {
        this.rng = makeRng(seed);
        this.seed = seed;
        this.gapKeys = [{ y: -H, gap: GAP_DEF }, { y: 900, gap: GAP_DEF }];
        this.blockers = [];        // vật cản đứng yên bám tường
        this.surfaces = [];        // mặt tường xấu: kính, nứt, điện
        this.movers = [];          // mối nguy di động trong khe hoặc trượt trên tường
        this.pickups = [];         // xu, ngọc, vật phẩm
        this.winds = [];           // dải gió
        this.marks = [];           // mốc vùng, biển báo
        this.cursor = 900;         // đã sinh tới độ cao này
        this.log = [];             // tên khuôn đã dùng, để soát nhịp
        this.heat = 0;             // độ căng của mấy khuôn vừa rồi
        this.sinceRest = 0;        // bao nhiêu khuôn rồi chưa được nghỉ
        this.lastId = '';
        this.zoneDone = 0;
    }

    /* ---- tra cứu ---- */

    World.prototype.gapAt = function (y) {
        var k = this.gapKeys, i;
        for (i = k.length - 1; i >= 0; i--) {
            if (y >= k[i].y) {
                if (i === k.length - 1) return k[i].gap;
                var a = k[i], b = k[i + 1];
                var t = (y - a.y) / (b.y - a.y);
                /* Nội suy mềm chứ không thẳng: khe đổi rộng theo đường thẳng
                 * thì mặt tường gãy khúc, mắt thấy ngay là "chỗ này máy nối
                 * vào". Cosin thì tường phình ra thu vào như thật. */
                t = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
                return a.gap + (b.gap - a.gap) * t;
            }
        }
        return k[0].gap;
    };

    /* Mặt trong của tường ở độ cao y. side 0 = trái, 1 = phải. */
    World.prototype.wallX = function (side, y) {
        var g = this.gapAt(y);
        return side === SIDE_L ? (W - g) / 2 : (W + g) / 2;
    };

    World.prototype.blockerAt = function (side, y) {
        var b = this.blockers;
        for (var i = 0; i < b.length; i++) {
            if (b[i].side === side && y >= b[i].y0 && y <= b[i].y1) return b[i];
        }
        return null;
    };

    World.prototype.surfaceAt = function (side, y) {
        var s = this.surfaces;
        for (var i = 0; i < s.length; i++) {
            if (s[i].side === side && y >= s[i].y0 && y <= s[i].y1 && !s[i].dead) return s[i];
        }
        return null;
    };

    World.prototype.windAt = function (y) {
        var w = this.winds;
        for (var i = 0; i < w.length; i++) if (y >= w[i].y0 && y <= w[i].y1) return w[i];
        return null;
    };

    /* Bám được ở đây không? Dùng cho cả lúc leo, lúc bắt tường và lúc rơi. */
    World.prototype.canCling = function (side, y) {
        if (this.blockerAt(side, y)) return false;
        var s = this.surfaceAt(side, y);
        if (s && s.kind === 'electric' && !s.cut) return false;
        return true;
    };

    /* ---- phép đặt, có kiểm luật ---- */

    /* Vật cản đứng yên. Từ chối nếu:
     *   · dính vào vật cản khác cùng tường mà chưa đủ thưa
     *   · làm tường ĐỐI DIỆN hết quang trong khoảng bắt buộc
     *   · đè lên mặt tường xấu bên kia
     * Đây là hàm giữ cho cả game công bằng. */
    World.prototype.blocker = function (side, y0, h, type) {
        var y1 = y0 + h, b;
        if (!this.wallFree(side, y0, y1)) return null;
        b = { side: side, y0: y0, y1: y1, type: type || 'ac', hp: type === 'barrier' ? 2 : 1 };
        this.blockers.push(b);
        /* Vật cản sinh SAU có thể đè lên xu đã rải trước đó — luật "vật phẩm
         * không được là bẫy" phải giữ theo cả hai chiều thời gian, nên gỡ nốt
         * mấy đồng nằm dưới nó. Bản trước chỉ kiểm lúc đặt xu, và máy soát bắt
         * được đúng những đồng bị vật cản chèn thêm phủ lên. */
        var nearAx = side === SIDE_L ? 0.16 : 0.84;
        this.pickups = this.pickups.filter(function (p) {
            var hugs = side === SIDE_L ? p.ax < nearAx : p.ax > nearAx;
            return !(hugs && p.y >= y0 - 14 && p.y <= y1 + 14);
        });
        return b;
    };

    /* Mặt tường xấu. Không CHẶN đường nhưng phạt, nên luật nhẹ hơn một bậc:
     * chỉ đòi tường đối diện quang hoàn toàn ở quãng ấy. */
    World.prototype.surface = function (side, y0, h, kind) {
        var y1 = y0 + h, i;
        var other = 1 - side;
        for (i = 0; i < this.surfaces.length; i++) {
            var s = this.surfaces[i];
            if (s.side === side && overlap(y0 - 40, y1 + 40, s.y0, s.y1)) return null;
            if (s.side === other && overlap(y0 - SURFACE_CLEAR, y1 + SURFACE_CLEAR, s.y0, s.y1)) return null;
        }
        for (i = 0; i < this.blockers.length; i++) {
            var b = this.blockers[i];
            if (b.side === other && overlap(y0 - CLEAR, y1 + CLEAR, b.y0, b.y1)) return null;
            if (b.side === side && overlap(y0, y1, b.y0, b.y1)) return null;
        }
        var out = { side: side, y0: y0, y1: y1, kind: kind, cut: false };
        this.surfaces.push(out);
        return out;
    };

    /* Có ĐÒI ĐƯỢC một quãng tường không?
     *
     * Vật cản đứng yên, giàn lau kính và gã thò cửa sổ đều chiếm chỗ trên mặt
     * tường, nên đều phải theo đúng một luật: bên kia phải quang. Tách ra dùng
     * chung vì bản trước em chép luật ấy ba lần, và ba bản chép đã bắt đầu
     * lệch nhau — chỗ thì kiểm cả mặt tường xấu, chỗ thì quên.
     *
     * Trả về true nếu đòi được. */
    World.prototype.wallFree = function (side, y0, y1) {
        var other = 1 - side, i;
        for (i = 0; i < this.blockers.length; i++) {
            var b = this.blockers[i];
            if (b.side === side) {
                if (overlap(y0 - SAME_SIDE_MIN, y1 + SAME_SIDE_MIN, b.y0, b.y1)) return false;
            } else if (overlap(y0 - CLEAR, y1 + CLEAR, b.y0 - CLEAR, b.y1 + CLEAR)) return false;
        }
        for (i = 0; i < this.surfaces.length; i++) {
            var sf = this.surfaces[i];
            if (sf.side === other && overlap(y0 - CLEAR, y1 + CLEAR, sf.y0, sf.y1)) return false;
            if (sf.side === side && overlap(y0, y1, sf.y0, sf.y1)) return false;
        }
        for (i = 0; i < this.movers.length; i++) {
            var mv = this.movers[i];
            if (mv.kind !== 'platform' && mv.kind !== 'thug') continue;
            var m0 = mv.y0 != null ? mv.y0 : mv.y;
            var m1 = mv.y1 != null ? mv.y1 : mv.y + 90;
            if (mv.side === side) {
                if (overlap(y0 - SAME_SIDE_MIN, y1 + SAME_SIDE_MIN, m0, m1)) return false;
            } else if (overlap(y0 - CLEAR, y1 + CLEAR, m0 - CLEAR, m1 + CLEAR)) return false;
        }
        return true;
    };

    /* Mối nguy di động. Mỗi loại tự khai chu kỳ và bề rộng cửa sổ an toàn;
     * hàm này ép cửa sổ ấy không bao giờ hẹp hơn MIN_WINDOW giây. */
    World.prototype.mover = function (kind, opt) {
        var m = { kind: kind, hp: 1, dead: false };
        for (var k in opt) if (Object.prototype.hasOwnProperty.call(opt, k)) m[k] = opt[k];
        m.phase = m.phase == null ? this.rng() : m.phase;

        if (kind === 'laser') {
            m.charge = Math.max(0.75, m.charge || 1.1);
            m.fire = Math.min(0.55, m.fire || 0.45);
            m.period = Math.max(m.charge + m.fire + MIN_WINDOW, m.period || 3.2);
            m.hp = 0;                                    // tơ không phá được
        } else if (kind === 'drone' || kind === 'bird') {
            /* Bay ngang qua khe rồi quay lại. Nửa chu kỳ là một lượt qua, nên
             * chỉ cần chu kỳ đủ dài là luôn có lúc khe trống. */
            m.period = Math.max(MIN_WINDOW / (0.5 * (1 - FLY_OCC)), m.period || 3.0);
            /* Bay trong LÒNG khe thôi, không quét sát mặt tường: máy bay và
             * chim là mối nguy của cú BAY NGANG, không phải của người đang
             * bám tường leo. Cho span = 1 thì chúng chạm tới cả hai mặt
             * tường và giết người chơi ở đúng lúc họ không làm gì được —
             * leo là tự động, đứng lại không được, tránh cũng không xong. */
            m.span = Math.min(0.74, m.span == null ? 0.74 : m.span);
        } else if (kind === 'debris') {
            m.period = Math.max(MIN_WINDOW + 0.8, m.period || 2.4);
            m.hp = 1;
        } else if (kind === 'platform') {
            /* Giàn lau kính trượt dọc một mặt tường — nó là vật cản BIẾT ĐI,
             * nên phải theo đúng luật quang bên kia như vật cản đứng yên. */
            var other = 1 - m.side, i;
            for (i = 0; i < this.blockers.length; i++) {
                var b = this.blockers[i];
                if (b.side === other && overlap(m.y0 - CLEAR, m.y1 + CLEAR, b.y0 - CLEAR, b.y1 + CLEAR)) return null;
                if (b.side === m.side && overlap(m.y0 - SAME_SIDE_MIN, m.y1 + SAME_SIDE_MIN, b.y0, b.y1)) return null;
            }
            for (i = 0; i < this.surfaces.length; i++) {
                var s = this.surfaces[i];
                if (s.side === other && overlap(m.y0 - CLEAR, m.y1 + CLEAR, s.y0, s.y1)) return null;
            }
            m.period = Math.max(3, m.period || 4.2);
            m.hp = 0;
        } else if (kind === 'swing') {
            m.period = Math.max(2 * MIN_WINDOW, m.period || 2.8);
            m.hp = 1;
        } else if (kind === 'loose') {
            m.period = 0;
            m.hp = 1;
        } else if (kind === 'thug') {
            /* Hắn chiếm mặt tường lúc thò ra, nên phải theo đúng luật của vật
             * cản đứng yên: bên kia phải quang suốt quãng ấy. */
            if (!this.wallFree(m.side, m.y, m.y + THUG_H)) return null;
            m.warn = Math.max(0.7, m.warn || THUG_WARN);
            m.out = Math.min(1.6, m.out || THUG_OUT);
            m.period = Math.max(m.warn + m.out + MIN_WINDOW, m.period || 4.2);
            m.hp = 1;
        } else if (kind === 'rival') {
            /* Đối thủ chỉ XÔ chứ không giết, và người chơi luôn đổi tường được,
             * nên hắn không cần đòi chỗ trên tường như mấy loại kia. */
            m.speed = m.speed || RIVAL_SPEED;
            m.ry = m.y;                       // độ cao hiện tại, tự đi xuống
            m.jumps = RIVAL_JUMPS;
            m.windup = 0;
            m.hp = 1;
        } else if (kind === 'sentry') {
            if (!this.wallFree(m.side, m.y - 30, m.y + 30)) return null;
            m.charge = Math.max(0.85, m.charge || 1.05);
            m.period = Math.max(m.charge + SHOT_LIVE + MIN_WINDOW, m.period || 3.8);
            m.t = 0;
            m.shot = null;
            m.hp = 1;
        }
        this.movers.push(m);
        return m;
    };

    /* Vật phẩm. Không được nằm chồng lên vật cản — thưởng mà lại là bẫy thì
     * người chơi mất lòng tin vào mọi thứ sáng lấp lánh trên màn hình. */
    World.prototype.pickup = function (type, ax, y) {
        /* Chế độ khắc nghiệt bật cờ này: khiên biến thành xu. Đổi ở ĐÂY chứ
         * không đổi lúc nhặt, để thứ vẽ ra trên tường đúng là thứ nhặt được —
         * vẽ cái khiên rồi nhặt được đồng xu là lừa người chơi. */
        if (type === 'shield' && this.noShields) type = 'coin';
        for (var side = 0; side < 2; side++) {
            /* ax dưới 0,14 coi như dán tường trái, trên 0,86 là tường phải */
            var near = side === SIDE_L ? ax < 0.16 : ax > 0.84;
            if (near && this.blockerAt(side, y)) return null;
        }
        var p = { type: type, ax: ax, y: y, taken: false };
        this.pickups.push(p);
        return p;
    };

    World.prototype.coinRun = function (ax, y0, n, step, dax) {
        for (var i = 0; i < n; i++) {
            this.pickup('coin', Math.min(0.93, Math.max(0.07, ax + (dax || 0) * i)), y0 + step * i);
        }
    };

    World.prototype.gapTo = function (y, gap) {
        gap = Math.max(GAP_MIN, Math.min(GAP_MAX, gap));
        var last = this.gapKeys[this.gapKeys.length - 1];
        if (y <= last.y) return;
        this.gapKeys.push({ y: y, gap: gap });
    };

    World.prototype.wind = function (y0, h, dir, str) {
        this.winds.push({ y0: y0, y1: y0 + h, dir: dir, str: str });
    };

    World.prototype.currentGap = function () {
        return this.gapKeys[this.gapKeys.length - 1].gap;
    };

    /* Dọn rác phía dưới máy quay. Không dọn thì sau mười phút leo, mảng vật
     * thể phình tới mấy chục nghìn phần tử và mọi vòng lặp tra cứu chậm dần —
     * kiểu chậm khó thấy vì nó chỉ hiện ra ở lượt chơi dài, đúng lượt đáng giá
     * nhất. */
    World.prototype.prune = function (belowY) {
        function keep(o) { return (o.y1 != null ? o.y1 : o.y) > belowY; }
        this.blockers = this.blockers.filter(keep);
        this.surfaces = this.surfaces.filter(keep);
        this.movers = this.movers.filter(function (m) {
            return (m.y1 != null ? m.y1 : m.y) > belowY;
        });
        this.pickups = this.pickups.filter(function (p) { return p.y > belowY && !p.taken; });
        this.winds = this.winds.filter(keep);
        this.marks = this.marks.filter(function (o) { return o.y > belowY; });
        while (this.gapKeys.length > 3 && this.gapKeys[1].y < belowY) this.gapKeys.shift();
    };

    /* ========================================================================
     *  6. THƯ VIỆN KHUÔN MÀN
     * ------------------------------------------------------------------------
     *  Màn vô tận nhưng phải có cảm giác được người xếp tay. Cách làm: mỗi đoạn
     *  là một KHUÔN có chủ đích rõ ràng — đoạn này để nghỉ, đoạn này ép đổi
     *  tường, đoạn kia treo xu ở chỗ nguy hiểm. Rải ngẫu nhiên thì chơi mười
     *  giây là biết, vì mọi đoạn đều na ná nhau.
     *
     *  intensity  0 nghỉ · 1 dễ · 2 thường · 3 gắt · 4 hiếm và rất gắt
     *  minM       chỉ xuất hiện từ độ cao này trở lên (luật giới thiệu dần)
     * ======================================================================*/

    var PATTERNS = [

        /* ---------- nghỉ và làm quen ---------- */
        {
            id: 'open-climb', intensity: 0, minM: 0, weight: 10,
            build: function (w, y, d) {
                var h = 430;
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.coinRun(side === SIDE_L ? 0.1 : 0.9, y + 90, 4, 62, 0);
                return h;
            }
        },
        {
            id: 'recovery', intensity: 0, minM: 120, weight: 5,
            build: function (w, y, d) {
                /* Sau một trận gắt phải có chỗ thở, và chỗ thở phải CÓ THƯỞNG
                 * thì người chơi mới thấy mình vừa sống sót chứ không phải vừa
                 * đi qua một đoạn trống. */
                var gift = w.rng.pick(['shield', 'web', 'web', 'magnet', 'slow']);
                w.pickup(gift, 0.5, y + 200);
                w.coinRun(0.28, y + 300, 3, 50, 0.11);
                return 400;
            }
        },

        /* ---------- vật cản đứng yên ---------- */
        {
            id: 'single-block', intensity: 1, minM: 0, weight: 9,
            build: function (w, y, d) {
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                var type = d.m < 180 ? 'ac' : w.rng.pick(['ac', 'balcony', 'sign']);
                w.blocker(side, y + 200, type === 'balcony' ? 150 : 118, type);
                w.coinRun(side === SIDE_L ? 0.9 : 0.1, y + 190, 4, 58, 0);
                /* Từ 300 m trở lên thì thêm một bậc nữa ở tường đối diện: một
                 * mình một vật cản chỉ là "nhảy một cái rồi thôi", hai cái mới
                 * thành một quyết định có trước có sau. */
                if (d.m > 300) {
                    w.blocker(1 - side, y + 200 + STEP, 118, w.rng.pick(['ac', 'sign']));
                    w.pickup('coin', side === SIDE_L ? 0.1 : 0.9, y + 260 + STEP);
                    return 500 + STEP;
                }
                return 500;
            }
        },
        {
            id: 'zigzag', intensity: 2, minM: 140, weight: 9,
            build: function (w, y, d) {
                /* Các bậc so le, và BƯỚC PHẢI ĐỦ DÀI.
                 *
                 * Bản đầu em đặt bước 350 vì tưởng 2×CLEAR = 300 là đủ. Sai:
                 * luật đo từ MÉP vật cản, nên khoảng cần là chiều cao vật cản
                 * cộng 300. Bước 350 khiến bậc thứ hai trở đi bị chính phép đặt
                 * từ chối im lặng — khuôn "ép đổi tường" nhiều bậc nhất trong
                 * game chỉ còn đúng một bậc, mà không có gì báo. Máy chơi thử
                 * bắt được: cả phút leo chỉ phải nhảy một lần. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                var n = d.m > 2500 ? 4 : (d.m > 600 ? 3 : 2);
                for (var i = 0; i < n; i++) {
                    w.blocker(side, y + 180 + i * STEP, 120, w.rng.pick(['ac', 'sign', 'balcony']));
                    /* xu treo đúng tường phải nhảy sang — thưởng cho đi đúng */
                    w.pickup('coin', side === SIDE_L ? 0.9 : 0.1, y + 250 + i * STEP);
                    side = 1 - side;
                }
                return 200 + n * STEP;
            }
        },
        {
            id: 'barrier-forced', intensity: 3, minM: 3000, weight: 5,
            build: function (w, y, d) {
                /* Rào công trường dài 380 điểm ảnh: bịt hẳn một tường suốt gần
                 * hai giây leo, nên bên kia phải đi trọn quãng ấy — và bên kia
                 * có một con máy bay không người lái chờ sẵn. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                if (w.blocker(side, y + 200, 380, 'barrier')) {
                    w.mover('drone', { y: y + 420, period: 3.1 / d.moverSpeed, span: 0.9 });
                    w.coinRun(side === SIDE_L ? 0.88 : 0.12, y + 230, 5, 66, 0);
                    w.pickup('gem', side === SIDE_L ? 0.9 : 0.1, y + 590);
                }
                return 760;
            }
        },

        /* ---------- xu và tham lam ---------- */
        {
            id: 'coin-arc', intensity: 1, minM: 40, weight: 8,
            build: function (w, y, d) {
                /* Vòng cung xu vắt ngang khe, đỉnh cung nằm đúng đường bay của
                 * cú nhảy. Không ép ai nhảy cả — nhưng nhìn thấy là muốn nhảy,
                 * và đó chính là chỗ hay: người chơi tự chọn liều. */
                var dir = w.rng.chance(0.5) ? 1 : -1;
                var n = 7;
                for (var i = 0; i < n; i++) {
                    var t = i / (n - 1);
                    var ax = dir > 0 ? 0.1 + 0.8 * t : 0.9 - 0.8 * t;
                    w.pickup('coin', ax, y + 180 + Math.sin(t * Math.PI) * 96 + t * 40);
                }
                return 470;
            }
        },
        {
            id: 'treasure-risk', intensity: 2, minM: 220, weight: 7,
            build: function (w, y, d) {
                /* Dây xu chạy dọc CHÍNH cái tường có mặt xấu. Đường an toàn vẫn
                 * còn nguyên bên kia, chỉ là không có gì. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                var kind = d.m > 900 ? w.rng.pick(['glass', 'cracked']) : 'glass';
                if (w.surface(side, y + 170, Math.max(GLASS_MIN_H, 300), kind)) {
                    w.coinRun(side === SIDE_L ? 0.09 : 0.91, y + 190, 6, 52, 0);
                    w.pickup(w.rng.chance(0.3) ? 'gem' : 'x2', side === SIDE_L ? 0.09 : 0.91, y + 510);
                }
                return 600;
            }
        },

        /* ---------- mặt tường xấu ---------- */
        {
            id: 'glass-run', intensity: 2, minM: 400, weight: 7,
            build: function (w, y, d) {
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.surface(side, y + 160, Math.max(GLASS_MIN_H, 300 + 120 * curve(d.m, 3000)), 'glass');
                w.coinRun(side === SIDE_L ? 0.9 : 0.1, y + 200, 4, 60, 0);
                return 620;
            }
        },
        {
            id: 'crack-run', intensity: 2, minM: 900, weight: 6,
            build: function (w, y, d) {
                /* Tấm nứt không giết ngay — bám quá 1,25 giây mới vỡ. Nên đây
                 * là đoạn ép LEO NHANH: giữ tay để tăng tốc, hoặc nhảy sớm. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                if (w.surface(side, y + 170, 280, 'cracked')) {
                    w.pickup('coin', side === SIDE_L ? 0.09 : 0.91, y + 250);
                    w.pickup('coin', side === SIDE_L ? 0.09 : 0.91, y + 340);
                }
                return 560;
            }
        },
        {
            id: 'electric-run', intensity: 3, minM: 4200, weight: 6,
            build: function (w, y, d) {
                /* Dây điện chớp trước khi phóng — và tơ CẮT ĐƯỢC nó. Đây là chỗ
                 * duy nhất trong game mà bắn tơ mở ra một con đường mới thay vì
                 * chỉ dọn một mối nguy. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                if (w.surface(side, y + 180, 260, 'electric')) {
                    w.coinRun(side === SIDE_L ? 0.09 : 0.91, y + 210, 4, 58, 0);
                    w.pickup('web', side === SIDE_L ? 0.9 : 0.1, y + 200);
                }
                return 580;
            }
        },

        /* ---------- mối nguy di động ---------- */
        {
            id: 'drone-gate', intensity: 2, minM: 60, weight: 8,
            build: function (w, y, d) {
                /* Con đầu tiên người chơi gặp phải bay CHẬM và một mình. Luật
                 * giới thiệu dần: thấy rõ nó là cái gì trước đã, rồi mới đến
                 * lúc nó bay nhanh, rồi mới đến lúc nó bay cùng thứ khác. */
                var slow = d.m < 300 ? 1.5 : 1;
                w.mover('drone', { y: y + 250, period: (3.4 * slow) / d.moverSpeed, span: 1 });
                w.pickup('coin', 0.5, y + 250);
                w.coinRun(0.5, y + 340, 3, 54, 0);
                return 540;
            }
        },
        {
            id: 'bird-flock', intensity: 2, minM: 1400, weight: 6,
            build: function (w, y, d) {
                /* Hai con lệch pha nửa vòng: lúc nào cũng có một con ở giữa
                 * khe, nhưng không bao giờ cả hai cùng chỗ. */
                w.mover('bird', { y: y + 220, period: 2.6 / d.moverSpeed, phase: 0, span: 1 });
                w.mover('bird', { y: y + 430, period: 2.6 / d.moverSpeed, phase: 0.5, span: 1 });
                w.pickup('coin', 0.5, y + 320);
                return 640;
            }
        },
        {
            id: 'laser-gate', intensity: 3, minM: 550, weight: 7,
            build: function (w, y, d) {
                /* Tia bảo vệ nạp 1,1 giây (vạch mờ nhấp nháy) rồi bắn 0,45
                 * giây. Cửa sổ an toàn còn lại luôn ≥ MIN_WINDOW, phép đặt ép
                 * như vậy. Muốn qua thì phải nhìn vạch nạp mà tính. */
                w.mover('laser', { y: y + 260, period: 3.4 * d.window, charge: 1.1 * d.window, fire: 0.45 });
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.blocker(side, y + 440, 120, 'sign');
                w.pickup('coin', 0.5, y + 350);
                return 620;
            }
        },
        {
            id: 'sign-swing', intensity: 2, minM: 550, weight: 6,
            build: function (w, y, d) {
                /* Biển quảng cáo lủng lẳng, đu ra giữa khe rồi đu về. Nó CHẶN
                 * đường bay chứ không chặn tường, nên vẫn leo được cả hai bên —
                 * chỉ là phải chọn đúng lúc mà nhảy. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.mover('swing', { side: side, y: y + 260, len: 120, period: 2.9 / d.moverSpeed });
                w.coinRun(0.5, y + 380, 3, 56, 0);
                return 560;
            }
        },
        {
            id: 'platform-lift', intensity: 2, minM: 2200, weight: 6,
            build: function (w, y, d) {
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                var m = w.mover('platform', {
                    side: side, y0: y + 180, y1: y + 480, period: 4.4 / d.moverSpeed
                });
                if (m) w.coinRun(side === SIDE_L ? 0.9 : 0.1, y + 220, 4, 62, 0);
                return 640;
            }
        },
        {
            id: 'debris-fall', intensity: 3, minM: 3000, weight: 6,
            build: function (w, y, d) {
                /* Mảnh vỡ rơi trong khe theo nhịp. Rơi từ trên xuống nên nhìn
                 * thấy từ xa — mối nguy duy nhất trong game đi ngược chiều leo,
                 * và chính vì thế nó đọc được rất rõ. */
                var n = d.layers >= 3 ? 2 : 1;
                for (var i = 0; i < n; i++) {
                    w.mover('debris', {
                        ax: 0.3 + 0.4 * w.rng(), y0: y + 150, y1: y + 640,
                        period: 2.5 / d.moverSpeed, phase: i * 0.5
                    });
                }
                w.pickup('coin', 0.5, y + 300);
                w.pickup(w.rng.chance(0.35) ? 'gem' : 'coin', 0.5, y + 460);
                return 700;
            }
        },
        {
            id: 'web-target', intensity: 1, minM: 100, weight: 7,
            build: function (w, y, d) {
                /* Cục điều hoà long ra, treo lơ lửng giữa khe. Bắn tơ cho nó rơi
                 * là đường bay thông; không bắn thì vẫn qua được bằng cách nhảy
                 * sớm hơn hoặc muộn hơn. Tơ giúp chứ không thay thế. */
                w.mover('loose', { ax: 0.5, y: y + 260 });
                w.pickup('coin', 0.5, y + 380);
                w.pickup('web', 0.5, y + 150);
                return 520;
            }
        },

        /* ---------- NHÂN VẬT PHẢN DIỆN ----------
         * Máy bay và chim là mối nguy vô tri: chúng bay theo nhịp của chúng,
         * chẳng buồn biết có ai đang leo. Ba đứa dưới đây thì NHÌN THẤY người
         * chơi, và đó là chỗ khác nhau — leo qua một cái quạt và leo qua một
         * kẻ đang chờ mình là hai cảm giác không giống nhau chút nào. */
        {
            id: 'window-thug', intensity: 2, minM: THUG_M, weight: 7,
            build: function (w, y, d) {
                /* Cửa sổ lạch cạch gần một giây rồi mới có kẻ thò ra chắn
                 * đường. Bất ngờ nằm ở chỗ KHÔNG BIẾT CỬA SỔ NÀO, chứ không
                 * phải ở chỗ không kịp phản ứng — bất ngờ kiểu sau là bẫy. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                var n = d.m > 3000 ? 2 : 1;
                for (var i = 0; i < n; i++) {
                    w.mover('thug', {
                        side: side, y: y + 220 + i * STEP,
                        period: (4.2 - 0.5 * curve(d.m, 4000)) / 1
                    });
                    w.pickup('coin', side === SIDE_L ? 0.9 : 0.1, y + 260 + i * STEP);
                    side = 1 - side;
                }
                return 240 + n * STEP;
            }
        },
        {
            id: 'rival-descent', intensity: 3, minM: RIVAL_M, weight: 7,
            build: function (w, y, d) {
                /* Người nhện đối thủ tụt xuống ngược chiều, và nếu mình đổi
                 * tường thì hắn nhảy theo — đúng MỘT lần. Nên đây là một màn
                 * đấu trí ngắn có lời giải chắc chắn: đổi tường, hắn theo, đổi
                 * lại, hắn hết lượt. Hoặc bắn tơ cho xong chuyện. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.mover('rival', {
                    side: side, y: y + 720,
                    speed: RIVAL_SPEED * (0.85 + 0.35 * curve(d.m, 5000))
                });
                w.pickup('web', 0.5, y + 170);
                w.coinRun(0.5, y + 300, 4, 62, 0);
                w.pickup('gem', 0.5, y + 620);
                return 820;
            }
        },
        {
            id: 'sentry-post', intensity: 3, minM: SENTRY_M, weight: 6,
            build: function (w, y, d) {
                /* Rô-bốt gác ngắm rồi bắn ngang khe. Chấm đỏ dính lên người
                 * chơi gần một giây trước khi nổ súng, và viên đạn bay chậm —
                 * nên câu trả lời luôn là "đừng đứng yên", chứ không phải
                 * "đoán xem lúc nào". */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.mover('sentry', {
                    side: side, y: y + 300,
                    period: 3.8 * d.window, charge: 1.05 * d.window
                });
                w.coinRun(side === SIDE_L ? 0.88 : 0.12, y + 200, 4, 64, 0);
                return 640;
            }
        },
        {
            id: 'rooftop-ambush', intensity: 4, minM: 8000, weight: 5,
            build: function (w, y, d) {
                /* Trên tám nghìn mét thì cả ba đứa cùng ra. Đây là chỗ duy nhất
                 * chúng gặp nhau, và chỉ sau khi người chơi đã gặp riêng từng
                 * đứa hàng nghìn mét trước đó. */
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.mover('thug', { side: side, y: y + 200, period: 3.7 });
                w.mover('sentry', { side: 1 - side, y: y + 560, period: 3.4, charge: 0.9 });
                w.mover('rival', { side: side, y: y + 900, speed: RIVAL_SPEED * 1.25 });
                w.pickup('shield', 0.5, y + 260);
                w.pickup('x2', 0.5, y + 700);
                w.pickup('gem', 0.5, y + 860);
                return 1020;
            }
        },

        /* ---------- khe rộng hẹp ---------- */
        {
            id: 'narrow-sprint', intensity: 1, minM: 250, weight: 7,
            build: function (w, y, d) {
                /* Khe hẹp lại: bay ngang nhanh hơn, nhịp nhảy dồn dập, cảm giác
                 * như chạy nước rút. Thưởng là một dây xu dài. */
                w.gapTo(y + 60, GAP_MIN + 20);
                w.gapTo(y + 620, GAP_DEF);
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.blocker(side, y + 260, 110, 'ac');
                for (var i = 0; i < 6; i++) {
                    w.pickup('coin', i % 2 ? 0.22 : 0.78, y + 180 + i * 62);
                }
                return 700;
            }
        },
        {
            id: 'wide-precision', intensity: 2, minM: 300, weight: 7,
            build: function (w, y, d) {
                /* Khe giãn ra: cú nhảy mất gần nửa giây giữa không trung, hở
                 * sườn lâu nhất trong game. Nên chỗ này KHÔNG bao giờ có mối
                 * nguy bay ngang — hai cái cộng lại là bất công. */
                w.gapTo(y + 60, GAP_MAX - 10);
                w.gapTo(y + 680, GAP_DEF);
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.blocker(side, y + 300, 130, 'balcony');
                w.pickup('gem', 0.5, y + 330);
                return 760;
            }
        },

        /* ---------- thời tiết ---------- */
        {
            id: 'wind-corridor', intensity: 3, minM: 1600, weight: 6,
            build: function (w, y, d) {
                /* Gió thổi ngang, đẩy cú nhảy đi. Hạt bụi bay ngang báo trước
                 * cả hướng lẫn độ mạnh — nhìn hạt là biết phải nhảy sớm hay
                 * muộn. Gió KHÔNG đổi hướng giữa chừng, đổi thì thành xổ số. */
                var dir = w.rng.chance(0.5) ? 1 : -1;
                w.wind(y + 140, 520, dir, 150 + 120 * curve(d.m, 4000));
                var side = dir > 0 ? SIDE_L : SIDE_R;   // chặn tường xuôi gió
                w.blocker(side, y + 300, 120, 'sign');
                w.coinRun(0.5, y + 220, 4, 60, dir * 0.08);
                return 700;
            }
        },

        /* ---------- kết hợp, chỉ ở trên cao ---------- */
        {
            id: 'storm-combo', intensity: 4, minM: 6200, weight: 5,
            build: function (w, y, d) {
                w.mover('laser', { y: y + 250, period: 3.3 * d.window, charge: 1.05 * d.window, fire: 0.45 });
                w.surface(w.rng.chance(0.5) ? SIDE_L : SIDE_R, y + 470, GLASS_MIN_H + 20, 'glass');
                w.mover('drone', { y: y + 640, period: 2.9 / d.moverSpeed, span: 1 });
                w.pickup('gem', 0.5, y + 560);
                w.pickup('shield', 0.5, y + 760);
                return 860;
            }
        },
        {
            id: 'sky-gauntlet', intensity: 4, minM: 8500, weight: 5,
            build: function (w, y, d) {
                var side = w.rng.chance(0.5) ? SIDE_L : SIDE_R;
                w.blocker(side, y + 200, 130, 'sign');
                w.blocker(1 - side, y + 560, 130, 'ac');
                w.mover('debris', { ax: 0.4, y0: y + 150, y1: y + 780, period: 2.4 / d.moverSpeed, phase: 0.2 });
                w.mover('drone', { y: y + 400, period: 2.8 / d.moverSpeed, span: 1 });
                w.pickup('x2', 0.5, y + 400);
                w.pickup('gem', 0.5, y + 700);
                return 920;
            }
        }
    ];

    var PATTERN_BY_ID = {};
    PATTERNS.forEach(function (p) { PATTERN_BY_ID[p.id] = p; });

    /* ========================================================================
     *  7. BỘ SINH — CHỌN KHUÔN THEO NHỊP
     * ------------------------------------------------------------------------
     *  Luật nhịp của bản thiết kế: thử thách → thưởng → nghỉ → leo thang, và
     *  KHÔNG BAO GIỜ căng hết cỡ liên tục. Cài bằng một con số "heat": khuôn
     *  gắt thì cộng, khuôn nhẹ thì trừ; heat cao thì chỉ còn khuôn nhẹ được
     *  chọn. Đơn giản mà đủ để lượt chơi có hình sin chứ không phải đường thẳng
     *  dốc lên.
     * ======================================================================*/

    World.prototype.pickPattern = function (m, d) {
        var w = this, out = [], total = 0;

        /* Đủ căng rồi thì bắt nghỉ, không bàn thêm. */
        var capIntensity = this.heat >= 5 ? 0 : (this.heat >= 3 ? 1 : 4);
        if (this.sinceRest >= 7) capIntensity = 0;

        PATTERNS.forEach(function (p) {
            if (m < p.minM) return;
            if (p.intensity > capIntensity) return;
            if (p.id === w.lastId) return;               // không lặp liền hai lần
            /* Khuôn nghỉ mà chưa mệt thì hiếm khi cần */
            var wt = p.weight;
            if (p.intensity === 0 && w.heat <= 1) wt *= 0.25;
            /* Càng lên cao càng nghiêng về khuôn gắt — nhưng vẫn qua bộ lọc
             * heat ở trên, nên nghiêng chứ không dồn */
            wt *= 1 + p.intensity * curve(m, 3200) * 0.6;
            out.push({ p: p, w: wt });
            total += wt;
        });

        if (!out.length) return PATTERN_BY_ID['open-climb'];
        var r = this.rng() * total;
        for (var i = 0; i < out.length; i++) {
            r -= out[i].w;
            if (r <= 0) return out[i].p;
        }
        return out[out.length - 1].p;
    };

    /* Sinh thêm màn cho tới độ cao topY. game.js gọi mỗi khung hình. */
    World.prototype.ensure = function (topY) {
        var guard = 0;
        while (this.cursor < topY && guard++ < 60) {
            var m = this.cursor / PX_PER_M;
            var d = difficulty(m);
            d.m = m;

            /* Mốc vùng: đúng chỗ đổi vùng thì ép một đoạn quang, để cảnh mới
             * hiện ra mà người chơi còn kịp ngẩng lên nhìn. */
            var zi = zoneIndexAt(m);
            if (zi > this.zoneDone) {
                this.zoneDone = zi;
                this.marks.push({ y: this.cursor + 60, zone: zi });
                this.cursor += PATTERN_BY_ID['open-climb'].build(this, this.cursor, d);
                this.heat = 0; this.sinceRest = 0; this.lastId = 'open-climb';
                /* Ghi cả đoạn quang này vào nhật ký. Bỏ sót nó thì máy soát
                 * nhịp đếm nhầm: nó thấy mười một đoạn liền không nghỉ, trong
                 * khi thật ra có một chỗ nghỉ ở giữa mà nhật ký không kể. */
                this.log.push({ id: 'open-climb', y: this.cursor, m: Math.round(m), i: 0 });
                continue;
            }

            var p = this.pickPattern(m, d);
            var h = p.build(this, this.cursor, d) || 460;

            /* Thưa bớt ở độ cao thấp: bản thiết kế đòi 30 giây đầu phải dễ thở
             * và có xu, chưa vội phạt ai. */
            if (m < 120) h += 120;

            this.cursor += h;
            this.lastId = p.id;
            this.log.push({ id: p.id, y: this.cursor, m: Math.round(m), i: p.intensity });

            this.heat += p.intensity >= 3 ? 3 : (p.intensity === 2 ? 1.5 : (p.intensity === 1 ? 0.6 : -3));
            if (this.heat < 0) this.heat = 0;
            if (p.intensity === 0) this.sinceRest = 0; else this.sinceRest++;

            /* Mật độ: nhét thêm vật cản lẻ vào đoạn vừa sinh. Thử vài chỗ chứ
             * không một chỗ — thử một chỗ thì hầu hết lần đều rơi trúng vùng
             * cấm quanh vật cản của chính khuôn ấy và bị từ chối, nên nút vặn
             * mật độ gần như không vặn được gì. */
            if (p.intensity <= 2) {
                var tries = this.rng.chance(d.density) ? 2 : 1;
                for (var k = 0; k < tries; k++) {
                    var frac = 0.25 + 0.5 * this.rng();
                    var side2 = this.rng.chance(0.5) ? SIDE_L : SIDE_R;
                    this.blocker(side2, this.cursor - h * frac, 110, this.rng.pick(['ac', 'sign']));
                }
            }
        }
    };

    /* ========================================================================
     *  8. NHIỆM VỤ
     * ------------------------------------------------------------------------
     *  Ba nhiệm vụ mở cùng lúc, xong cái nào thay cái mới. Câu chữ dựng từ
     *  KHUÔN có chỗ trống {0} — nhờ vậy 32 nhiệm vụ chỉ tốn mười mấy dòng dịch
     *  trong i18n.js thay vì 32 dòng.
     * ======================================================================*/

    var MISSIONS = [
        { id: 'h300', tpl: 'Climb to {0} m', n: 300, stat: 'metres', coins: 60 },
        { id: 'h600', tpl: 'Climb to {0} m', n: 600, stat: 'metres', coins: 110 },
        { id: 'h1000', tpl: 'Climb to {0} m', n: 1000, stat: 'metres', coins: 180 },
        { id: 'h1600', tpl: 'Climb to {0} m', n: 1600, stat: 'metres', coins: 260, gems: 1 },
        { id: 'h2500', tpl: 'Climb to {0} m', n: 2500, stat: 'metres', coins: 400, gems: 1 },
        { id: 'h4000', tpl: 'Climb to {0} m', n: 4000, stat: 'metres', coins: 650, gems: 2 },

        { id: 'c50', tpl: 'Collect {0} coins in one climb', n: 50, stat: 'coins', coins: 70 },
        { id: 'c100', tpl: 'Collect {0} coins in one climb', n: 100, stat: 'coins', coins: 140 },
        { id: 'c200', tpl: 'Collect {0} coins in one climb', n: 200, stat: 'coins', coins: 280, gems: 1 },

        { id: 'd3', tpl: 'Web {0} drones out of the sky', n: 3, stat: 'drones', coins: 80 },
        { id: 'd8', tpl: 'Web {0} drones out of the sky', n: 8, stat: 'drones', coins: 170 },
        { id: 'd15', tpl: 'Web {0} drones out of the sky', n: 15, stat: 'drones', coins: 300, gems: 1 },

        { id: 'foe2', tpl: 'Web {0} of the climbers who get in your way', n: 2, stat: 'foes', coins: 140 },
        { id: 'foe5', tpl: 'Web {0} of the climbers who get in your way', n: 5, stat: 'foes', coins: 280, gems: 1 },

        { id: 'w3', tpl: 'Ride out {0} wind gusts', n: 3, stat: 'gusts', coins: 90 },
        { id: 'w8', tpl: 'Ride out {0} wind gusts', n: 8, stat: 'gusts', coins: 190 },

        { id: 'j30', tpl: 'Jump between the towers {0} times', n: 30, stat: 'jumps', coins: 80 },
        { id: 'j60', tpl: 'Jump between the towers {0} times', n: 60, stat: 'jumps', coins: 150 },
        { id: 'j120', tpl: 'Jump between the towers {0} times', n: 120, stat: 'jumps', coins: 280, gems: 1 },

        { id: 'k10', tpl: 'Chain a combo of {0}', n: 10, stat: 'combo', coins: 90 },
        { id: 'k20', tpl: 'Chain a combo of {0}', n: 20, stat: 'combo', coins: 180 },
        { id: 'k35', tpl: 'Chain a combo of {0}', n: 35, stat: 'combo', coins: 330, gems: 1 },

        { id: 'n5', tpl: 'Slip past {0} near misses', n: 5, stat: 'near', coins: 100 },
        { id: 'n12', tpl: 'Slip past {0} near misses', n: 12, stat: 'near', coins: 210 },

        { id: 'g2', tpl: 'Pick up {0} gems', n: 2, stat: 'gems', coins: 120 },
        { id: 'g5', tpl: 'Pick up {0} gems', n: 5, stat: 'gems', coins: 240, gems: 1 },

        { id: 'r3', tpl: 'Catch a wall {0} times after a fall', n: 3, stat: 'catches', coins: 90 },
        { id: 'r8', tpl: 'Catch a wall {0} times after a fall', n: 8, stat: 'catches', coins: 180 },

        { id: 'p4', tpl: 'Grab {0} power-ups', n: 4, stat: 'powers', coins: 100 },
        { id: 'p9', tpl: 'Grab {0} power-ups', n: 9, stat: 'powers', coins: 200 },

        { id: 'b3', tpl: 'Break {0} cracked panels', n: 3, stat: 'cracks', coins: 110 },
        { id: 's10', tpl: 'Fire {0} web shots', n: 10, stat: 'webs', coins: 90 },

        { id: 'z3', tpl: 'Reach the Cloudline zone', n: 1500, stat: 'metres', coins: 250, gems: 1 },
        { id: 'z5', tpl: 'Reach the Night Storm zone', n: 6200, stat: 'metres', coins: 700, gems: 3 },
        { id: 'z4b', tpl: 'Reach the Neon Night City', n: 4500, stat: 'metres', coins: 520, gems: 2 },

        { id: 'nolife', tpl: 'Climb {0} m without losing a life', n: 400, stat: 'cleanMetres', coins: 220, gems: 1 }
    ];

    function missionText(ms) {
        return ms.tpl.replace('{0}', String(ms.n));
    }

    /* Ba nhiệm vụ khác nhau, không trùng cái đã xong. */
    function rollMissions(done, rng, n) {
        var pool = MISSIONS.filter(function (ms) { return done.indexOf(ms.id) < 0; });
        if (pool.length < (n || 3)) pool = MISSIONS.slice();
        var out = [];
        var r = rng || makeRng(dailySeed());
        while (out.length < (n || 3) && pool.length) {
            var i = Math.floor(r() * pool.length);
            out.push(pool[i].id);
            pool.splice(i, 1);
        }
        return out;
    }

    /* ========================================================================
     *  9. TRANG PHỤC
     * ------------------------------------------------------------------------
     *  Chỉ đổi màu, KHÔNG đổi sức mạnh. Bản thiết kế nói rõ: nâng cấp không
     *  được lấy mất phần kỹ năng của game, nên tiền xu tiêu vào chỗ đẹp thôi.
     * ======================================================================*/

    var SUITS = [
        { id: 'classic', name: 'Classic Red', body: '#d92d3c', trim: '#1b2a56', web: '#ffffff', eye: '#ffffff', cost: 0 },
        { id: 'midnight', name: 'Midnight Blue', body: '#1f4bb8', trim: '#0d1430', web: '#9fd4ff', eye: '#d8f0ff', cost: 400 },
        { id: 'neon', name: 'Neon Green', body: '#28d17c', trim: '#10321f', web: '#c9ffdf', eye: '#eafff2', cost: 700 },
        { id: 'gold', name: 'Golden Hour', body: '#f4b31f', trim: '#6b3d05', web: '#fff0bd', eye: '#fffaf0', cost: 1200 },
        { id: 'shadow', name: 'Shadow', body: '#2b2f3a', trim: '#0b0d12', web: '#8b93a8', eye: '#ff5470', cost: 1800 },
        { id: 'ice', name: 'Ice Drift', body: '#7fd8ff', trim: '#0f4a68', web: '#eaffff', eye: '#0f4a68', cost: 2400 },
        { id: 'magma', name: 'Magma', body: '#ff5a1f', trim: '#4a0f00', web: '#ffd0a3', eye: '#fff2e0', cost: 3200 },
        { id: 'cosmic', name: 'Cosmic', body: '#8b4bff', trim: '#1d0b45', web: '#ffb3f2', eye: '#fff0ff', cost: 4500 }
    ];

    /* ========================================================================
     * 10. ĐIỂM
     * ------------------------------------------------------------------------
     *  Độ cao là nguồn điểm chính, đúng như bản thiết kế. Mọi thứ khác chỉ là
     *  gia vị — nếu xu ăn đứt độ cao thì người chơi sẽ đứng nhặt xu chứ không
     *  leo, và game mất luôn cái tên của nó.
     * ======================================================================*/

    var SCORE = {
        perMetre: 10,
        coin: 25,
        gem: 250,
        webKill: 60,
        nearMiss: 20,
        cleanJump: 12,
        zone: 600
    };

    /* Hệ số nhân theo chuỗi liên hoàn, trần 8 — cao hơn nữa thì một lượt may
     * mắn đè bẹp mọi lượt chơi tử tế khác trên bảng vàng. */
    function comboMul(combo) {
        return Math.min(8, 1 + Math.floor(combo / 5));
    }

    return {
        W: W, H: H, PX_PER_M: PX_PER_M,
        GAP_MIN: GAP_MIN, GAP_DEF: GAP_DEF, GAP_MAX: GAP_MAX,
        CLEAR: CLEAR, SAME_SIDE_MIN: SAME_SIDE_MIN, SURFACE_CLEAR: SURFACE_CLEAR,
        MIN_WINDOW: MIN_WINDOW,
        CLIMB_BASE: CLIMB_BASE, CLIMB_MAX: CLIMB_MAX, CLIMB_BOOST: CLIMB_BOOST,
        GLASS_WARN: GLASS_WARN, GLASS_GRACE: GLASS_GRACE, GLASS_MIN_H: GLASS_MIN_H,
        JUMP_VX: JUMP_VX,
        GRAVITY: GRAVITY, FALL_GRAVITY: FALL_GRAVITY, FALL_MAX_V: FALL_MAX_V,
        FALL_DRIFT: FALL_DRIFT, CAM_ANCHOR: CAM_ANCHOR, PLAYER_R: PLAYER_R,
        BOLT_WARN: BOLT_WARN, BOLT_HIT: BOLT_HIT, BOLT_R: BOLT_R,
        BOLT_GAP_MIN: BOLT_GAP_MIN, BOLT_GAP_MAX: BOLT_GAP_MAX, BOLT_GRACE: BOLT_GRACE,
        CRACK_HOLD: CRACK_HOLD, WEB_MAX: WEB_MAX, WEB_RECHARGE: WEB_RECHARGE,
        WEB_RANGE: WEB_RANGE, LIVES: LIVES, NEAR_MISS_PX: NEAR_MISS_PX,
        RESPAWN_CLEAR: RESPAWN_CLEAR,
        SIDE_L: SIDE_L, SIDE_R: SIDE_R,
        ZONES: ZONES, zoneAt: zoneAt, zoneIndexAt: zoneIndexAt,
        difficulty: difficulty, curve: curve,
        makeRng: makeRng, dailySeed: dailySeed,
        World: World, PATTERNS: PATTERNS, moverWindow: moverWindow, FLY_OCC: FLY_OCC,
        THUG_M: THUG_M, RIVAL_M: RIVAL_M, SENTRY_M: SENTRY_M,
        THUG_H: THUG_H, THUG_WARN: THUG_WARN, THUG_OUT: THUG_OUT, RIVAL_SPEED: RIVAL_SPEED,
        RIVAL_WINDUP: RIVAL_WINDUP, RIVAL_JUMPS: RIVAL_JUMPS,
        SHOT_SPEED: SHOT_SPEED, SHOT_LIVE: SHOT_LIVE,
        MISSIONS: MISSIONS, missionText: missionText, rollMissions: rollMissions,
        SUITS: SUITS, SCORE: SCORE, comboMul: comboMul,
        overlap: overlap
    };
}));
