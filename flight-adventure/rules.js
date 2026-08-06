/* ============================================================================
 * FLIGHT ADVENTURE KIDS — LUẬT BAY & DỮ LIỆU TUYẾN
 * ----------------------------------------------------------------------------
 * Tệp này KHÔNG vẽ gì cả. Nó giữ ba thứ, và giữ mỗi thứ đúng một lần:
 *
 *   1. Hằng số bay      — nhanh chậm, lên xuống, ngưỡng cất và hạ cánh
 *   2. Dữ liệu tuyến    — địa hình dọc đường, thắng cảnh, sân bay hai đầu
 *   3. Mấy phép suy ra  — mặt đất cao bao nhiêu ở quãng này, đang bay qua vùng gì
 *
 * VÌ SAO TÁCH RA. Máy soát (check-flight.js) phải trả lời được một câu duy
 * nhất mà cả trò chơi đứng lên trên nó: "một đứa bé năm tuổi bấm loạn xạ thì
 * có bay tới nơi và hạ cánh được không?". Muốn trả lời thì phải chạy được luật
 * bay mà KHÔNG cần trình duyệt, không cần canvas, không cần ai bấm. Trộn luật
 * vào chỗ vẽ thì câu ấy chỉ trả lời được bằng cách ngồi chơi thử — mà ngồi
 * chơi thử thì không ai chơi đủ hai trăm lượt để yên tâm.
 *
 * NGUYÊN TẮC LỚN NHẤT CỦA CẢ GAME, và mọi con số dưới đây phải phục tùng nó:
 * KHÔNG BAO GIỜ THUA. Bay thấp quá thì máy bay tự nâng lên. Chậm quá thì tự
 * lấy đà. Bay quá sân bay thì lượn một vòng quay lại. Bản mô tả gọi đó là
 * "focused on exploration, not failure" — và với trẻ con năm tuổi thì một lần
 * thua là một lần đóng máy, không phải một lần rút kinh nghiệm.
 * ==========================================================================*/
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.FlightRules = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ------------------------------------------------------------------ *
     * 1. KHỔ SÂN
     *
     *    Nằm ngang, khác hẳn Người Nhện Leo Tháp. Bay thì thứ đáng có là
     *    CHIỀU NGANG — đường chân trời, cái gì đang tới phía trước, còn bao
     *    xa nữa thì tới nơi. Dựng đứng lên thì mất hết.
     * ------------------------------------------------------------------ */
    var W = 960, H = 600;

    /* Máy bay đứng yên một chỗ trên màn hình, thế giới trôi qua nó. Đặt hơi
     * lệch về trái để phần nhìn thấy trước mặt rộng hơn phần sau lưng — mắt
     * cần biết cái gì SẮP tới, chứ cái đã qua thì không cần nữa. */
    var PLANE_SX = 0.32;

    /* ================================================================
     * MÁY QUAY BÁM ĐUÔI — phép chiếu phối cảnh
     * ----------------------------------------------------------------
     * Bản đầu vẽ NGANG, kiểu 2D: máy bay đứng nghiêng một chỗ, thế giới
     * trôi từ phải sang trái. Chạy được, nhưng nó kể sai câu chuyện —
     * bé không "đang lái máy bay", bé đang xem một cuộn phim trôi qua.
     *
     * Nay máy quay ngồi CHẾCH TRÊN VÀ SAU ĐUÔI, nhìn về phía trước.
     * Thấy được cả chiếc máy bay lẫn khoảng không quanh nó, và quan
     * trọng nhất: có chiều thứ ba để lái. Trái phải không còn là một
     * thứ trang trí nữa mà là một hướng đi thật.
     *
     * Phép chiếu là phép chiếu phối cảnh thẳng thớm, không mẹo mực:
     *
     *     d  = wx - cam.x            (mét trước mặt máy quay)
     *     s  = FOCAL / d             (một mét ở đó bằng bấy nhiêu điểm ảnh)
     *     px = W/2 + (wz - cam.z) * s
     *     py = HORIZON + (cam.alt - walt) * s
     *
     * Mọi thứ trong game — mặt đất, nhà cửa, vòng mây, chính chiếc máy
     * bay — đều đi qua đúng bốn dòng ấy. Một phép chiếu duy nhất thì
     * không bao giờ có chuyện vật này ở trước vật kia trong mắt mà lại
     * ở sau nó trong mã.
     * ================================================================ */
    var FOCAL = 560;               // tiêu cự, điểm ảnh
    var HORIZON = 236;             // đường chân trời nằm ở đây khi bay bằng
    var CAM_BACK = 210;            // máy quay lùi sau máy bay bấy nhiêu mét
    var CAM_UP = 34;               // và cao hơn nó bấy nhiêu
    var NEAR = 26;                 // gần hơn ngần này thì không vẽ (chia cho 0)
    var VIEW_FAR = 16000;          // xa hơn ngần này thì chìm hẳn vào sương mù

    /* Bay lệch sang hai bên được bao xa. Ra ngoài thì trò chơi nhẹ nhàng đẩy
     * về — bản mô tả viết "if the player flies too far away, the game gently
     * turns the plane back", và chữ đáng giá nhất trong câu ấy là "gently". */
    var LAT_MAX = 2600;            // mét lệch tối đa so với trục tuyến
    var LAT_SPEED = 165;           // m/s khi bẻ hết sang một bên
    var LAT_EASE = 2.2;            // bẻ và trả lái mượt cỡ nào

    /* ------------------------------------------------------------------ *
     * 2. HẰNG SỐ BAY
     *
     *    Đơn vị là mét và giây, thật từ đầu đến cuối. Bảng điểm hiện km/h và
     *    mét, và hai con số ấy suy thẳng từ đây chứ không phải con số trang
     *    trí — nên khi bé hỏi "600 km/h là nhanh cỡ nào" thì câu trả lời có
     *    thật ở trong game.
     * ------------------------------------------------------------------ */
    var SPD_MIN = 60;              // m/s — chậm nhất, lúc còn lăn trên đường băng
    var SPD_CRUISE = 160;          // m/s ≈ 576 km/h — ga giữa
    var SPD_MAX = 205;             // m/s ≈ 738 km/h — hết ga
    var SPD_ACCEL = 26;            // đổi tốc bao nhanh (m/s mỗi giây)

    var ROTATE_SPD = 78;           // đủ nhanh thì mới nhấc mũi lên được
    var TOUCHDOWN_SPD = 96;        // chậm hơn ngần này thì bánh chạm đất êm

    var CLIMB_RATE = 34;           // m/s khi kéo hết cần LÊN
    /* Xuống nhanh hơn lên, và xuống KHÔNG cần đà.
     *
     * Máy soát bắt được đúng chỗ này: bản đầu em cho lên và xuống chung một
     * hệ số, mà hệ số ấy lại nhân với đà — nên lúc hạ cánh, đúng lúc máy bay
     * chậm nhất, nó chỉ chúc xuống nổi 8,5 m mỗi giây. Cần 18. Con bọ "bé
     * ngoan" bay đúng cách vẫn không chạm nổi đường băng, cứ lượn vòng mãi.
     *
     * Đời thật cũng thế: muốn lên thì phải có sức, còn muốn xuống thì chỉ cần
     * thôi giữ. */
    var DESCEND_RATE = 30;
    var ALT_MAX = 8000;            // trần bay nâng lên 8000m cho bé tự do khám phá
    var ALT_CRUISE = 1500;         // độ cao đẹp nhất để ngắm cảnh

    /* Buông tay thì máy bay TỰ CÂN BẰNG. Bản mô tả đòi đúng điều này, và nó
     * quan trọng hơn vẻ ngoài: đứa bé buông tay ra để chỉ vào màn hình khoe
     * với mẹ, quay lại vẫn thấy máy bay đang bay ngay ngắn. */
    var LEVEL_EASE = 2.4;

    /* Sát đất bao nhiêu thì trò chơi ra tay đỡ. Không phải "thua" — là một
     * bàn tay vô hình nâng mũi lên, kèm một câu nhắc. */
    var SAFE_CLEAR = 130;          // mét trên đỉnh địa hình
    var RESCUE_LIFT = 46;          // nâng bấy nhiêu mỗi giây khi đã quá thấp

    /* ------------------------------------------------------------------ *
     * 3. CHỤP ẢNH & VÒNG MÂY
     * ------------------------------------------------------------------ */
    var PHOTO_RANGE = 1500;        // trong ngần này mét thì nút máy ảnh sáng lên

    /* Bán kính vòng mây và ngôi sao, tính bằng MÉT trong thế giới thật.
     *
     * Sang phối cảnh thì đây mới là cách khai đúng: một hình cầu bán kính 105 m
     * chiếu lên màn thành một hình tròn bán kính 105·s, tự to lên khi tới gần
     * và nhỏ đi khi ra xa, không cần một dòng nào chỉnh tay. Bản 2D cũ phải
     * khai bằng điểm ảnh vì hai tỉ lệ ngang dọc khác nhau tám lần và một vòng
     * tròn thật sẽ ra hình ô-van dẹt. */
    /* Vòng rộng 160 m bán kính, sao 95 m. Máy soát cho con bọ lái thẳng tới
     * từng vòng, và với bán kính 105 nó vẫn trượt hai cái — trượt có 111 m và
     * 123 m, tức là lái gần đúng mà vẫn hụt. Với một đứa bé sáu tuổi thì "gần
     * đúng mà vẫn hụt" là kiểu thất bại tệ nhất: nó không dạy được gì cả, chỉ
     * làm bé nghĩ mình dở. Nới cửa ra thì gần đúng là qua, còn lệch hẳn thì
     * vẫn trượt — và đó mới là thứ dạy được. */
    var RING_R = 160;
    /* Sao vẽ nhỏ (75 m) nhưng NHẶT ĐƯỢC TỪ XA (210 m).
     *
     * Tách hai con số ra là cố ý, và không phải để gian lận. Vòng mây là một
     * cái cửa: chui đúng qua giữa mới tính, và cảm giác "vừa lách qua" chính
     * là phần thưởng. Sao thì khác hẳn — bản mô tả gọi chúng là "gentle
     * floating stars", tức là thứ bé lượm được trên đường chứ không phải thứ
     * bé phải nhắm. Vẽ to bằng tầm nhặt thì nó lấn át cả cái vòng và trông
     * như một mặt trời; vẽ nhỏ mà nhặt hẹp thì đo được rằng bé bay đúng
     * đường vẫn trượt ba trên năm cái.
     *
     * Nên: nhỏ để nhìn, rộng để nhặt. */
    var STAR_R = 75;
    var STAR_PICK = 210;

    /* ------------------------------------------------------------------ *
     * 4. HẠ CÁNH
     *
     *    Ba mức, và KHÔNG mức nào là trượt. Bản mô tả viết thẳng: "No result
     *    should feel like failure for young children." Nên mức thấp nhất tên
     *    là "có trò chơi đỡ một tay", chứ không phải "hạ cánh kém".
     * ------------------------------------------------------------------ */
    var LAND_GREAT = { vs: 4.5, spd: 92 };    // êm và chậm
    var LAND_NICE = { vs: 9.0, spd: 104 };

    /* Bay quá sân bay mấy vòng thì trò chơi cầm tay hẳn.
     *
     * "Lượn lại thử tiếp" là một lời hứa tử tế, nhưng lượn mãi thì nó thành
     * một cái bẫy lịch sự: bé không thua, mà cũng không bao giờ xong. Bản mô
     * tả viết "young children should always be able to finish a flight" — nên
     * sau vòng thứ hai, trò chơi tự lái nốt. */
    var CIRCLE_GIVE_UP = 2;

    /* Cao bao nhiêu thì bắt đầu chúc xuống, và đường trượt dài bao xa. Tách ra
     * thành hằng số vì hai con số này phải cân với DESCEND_RATE: chúc quá gấp
     * thì máy bay không xuống kịp dù kéo hết cần. */
    var GLIDE_ALT = 820;
    var GLIDE_END_PAD = 300;       // chạm đất cách đầu đường băng bấy nhiêu mét

    /* ------------------------------------------------------------------ *
     * 5. ĐỊA HÌNH
     *
     *    Mặt đất cao bao nhiêu ở quãng x. Suy từ mấy mốc rồi nội suy trơn —
     *    không giữ mảng điểm nào cả, nên tuyến dài bao nhiêu cũng không tốn
     *    thêm bộ nhớ, và máy soát hỏi được độ cao ở BẤT KỲ chỗ nào mà không
     *    phải dựng cả thế giới lên trước.
     * ------------------------------------------------------------------ */

    function smooth(t) { return t * t * (3 - 2 * t); }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* Hàm băm nhỏ, cho mấy chi tiết lặt vặt (nhà cửa, sóng, cây) đứng YÊN
     * một chỗ theo toạ độ. Rải bằng Math.random thì mỗi khung hình chúng nhảy
     * một chỗ khác, và cả mặt đất rung lên như bị động đất. */
    function hash(a, b) {
        var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
        return s - Math.floor(s);
    }

    /* ------------------------------------------------------------------ *
     * 6. TUYẾN BAY
     *
     *    Một tuyến là một mảng ĐOẠN nối đuôi nhau, cộng với danh sách thắng
     *    cảnh và hai sân bay. Thêm tuyến mới là thêm dữ liệu, không phải thêm
     *    mã — đó là lý do phần này trông dài: cái dài ra là dữ liệu, còn phần
     *    chạy thì vẫn từng ấy.
     *
     *    kind của đoạn quyết định cả hình vẽ lẫn độ cao mặt đất:
     *      city      thành phố — nhà cao, cầu, sông
     *      fields    đồng ruộng, làng mạc, sông quanh co
     *      hills     đồi thấp, rừng
     *      mountains núi đá vôi, mây vắt ngang sườn
     *      coast     bờ biển — nửa đất nửa nước
     *      sea       biển, có đảo và thuyền
     * ------------------------------------------------------------------ */

    var ROUTES = [
        {
            id: 'han-dad',
            en: 'Hanoi to Da Nang', vi: 'Hà Nội đến Đà Nẵng',
            fromCity: { en: 'Hanoi', vi: 'Hà Nội' },
            toCity: { en: 'Da Nang', vi: 'Đà Nẵng' },
            fromAirport: { en: 'Noi Bai Airport', vi: 'Sân bay Nội Bài', code: 'HAN' },
            toAirport: { en: 'Da Nang Airport', vi: 'Sân bay Đà Nẵng', code: 'DAD' },
            realKm: 760,
            sky: 'morning',
            len: 26000,               // mét thế giới từ đầu đường băng tới đầu đường băng kia
            /* Đường băng cất cánh nằm ở đầu, đường băng hạ cánh ở cuối. Giữa
             * hai cái ấy là chuyến đi. */
            runwayLen: 2600,
            /* Mời hạ cánh sớm hẳn, còn 8,4 km nữa mới tới nơi.
             *
             * Máy soát đo ra: bé bay ở độ cao ngắm cảnh 1 500 m, mà chúc xuống
             * nhanh nhất cũng chỉ 30 m mỗi giây — cần gần một phút, tức là gần
             * sáu cây số đường bay, mới xuống tới đầu đường băng. Mời muộn thì
             * dù bé làm đúng mọi thứ vẫn tới nơi cao quá và phải lượn lại, mà
             * bị bắt làm lại đúng lúc mình vừa làm đúng là kiểu bực nhất. */
            landStart: 17600,
            segments: [
                { to: 3400, kind: 'city' },
                { to: 8200, kind: 'fields' },
                { to: 12600, kind: 'hills' },
                { to: 17000, kind: 'mountains' },
                { to: 20600, kind: 'coast' },
                { to: 26000, kind: 'city' }
            ],
            landmarks: [
                {
                    at: 2400, kind: 'lake', z: -520,
                    en: 'Hoan Kiem Lake', vi: 'Hồ Hoàn Kiếm',
                    factEn: 'A famous lake in the middle of Hanoi.',
                    factVi: 'Một cái hồ nổi tiếng ở giữa Hà Nội.'
                },
                {
                    at: 10600, kind: 'river', z: 640,
                    en: 'Winding River', vi: 'Dòng Sông Uốn Khúc',
                    factEn: 'Rivers carry water from the mountains to the sea.',
                    factVi: 'Sông mang nước từ núi ra tới biển.'
                },
                {
                    at: 15200, kind: 'pass', z: -380,
                    en: 'Hai Van Pass', vi: 'Đèo Hải Vân',
                    factEn: 'A mountain road high above the sea.',
                    factVi: 'Một con đèo chạy cao trên mặt biển.'
                },
                {
                    at: 19400, kind: 'beach', z: 760,
                    en: 'My Khe Beach', vi: 'Biển Mỹ Khê',
                    factEn: 'A long sandy beach beside the city.',
                    factVi: 'Một bãi cát dài ngay cạnh thành phố.'
                },
                {
                    at: 22600, kind: 'bridge', z: -300,
                    en: 'Dragon Bridge', vi: 'Cầu Rồng',
                    factEn: 'A bridge shaped like a dragon.',
                    factVi: 'Một cây cầu mang hình con rồng.'
                }
            ]
        }
    ];

    function routeById(id) {
        for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return ROUTES[i];
        return ROUTES[0];
    }

    /* Đoạn nào ở quãng x, và đã đi được bao nhiêu phần của đoạn ấy. Trả về cả
     * đoạn kế tiếp với hệ số pha trộn, để chỗ vẽ chuyển cảnh dần chứ không
     * đổi đánh cái ở đúng một điểm — nhìn thấy ranh giới giữa hai vùng là
     * nhìn thấy cái lưới bên dưới trò chơi. */
    var BLEND = 900;               // mét giao nhau giữa hai vùng

    function segmentAt(route, x) {
        var segs = route.segments, from = 0, i;
        for (i = 0; i < segs.length; i++) {
            if (x < segs[i].to || i === segs.length - 1) {
                var s = segs[i];
                var next = segs[Math.min(segs.length - 1, i + 1)];
                var toEnd = s.to - x;
                var k = (i < segs.length - 1 && toEnd < BLEND) ? 1 - toEnd / BLEND : 0;
                return { seg: s, next: next, k: clamp(k, 0, 1), from: from, idx: i };
            }
            from = segs[i].to;
        }
        return { seg: segs[0], next: segs[0], k: 0, from: 0, idx: 0 };
    }

    /* Độ cao đặc trưng của từng kiểu vùng, mét. Biển âm để mặt nước nằm dưới
     * mực đất một chút — nhìn từ trên cao mới ra bờ. */
    var GROUND = { city: 40, fields: 60, hills: 340, mountains: 1050, coast: 20, sea: 0 };

    /* ĐƯỜNG BĂNG PHẢI PHẲNG.
     *
     * Máy soát bắt được: vệt sáng dẫn hạ cánh chui xuống dưới mặt đất 16 mét,
     * vì cao độ đường băng lấy ở một đầu còn mặt đất thành phố thì gợn sóng
     * ±14 m. Đời thật người ta san phẳng cả dải ấy trước khi đổ bê-tông, và ở
     * đây cũng phải thế — nếu không thì vệt sáng dẫn bé đâm xuống một cái gờ. */
    var RUNWAY_RAMP = 500;         // mét dốc thoải hai đầu, nối vào đất tự nhiên

    function baseGround(kind, x) {
        var g = GROUND[kind] == null ? 40 : GROUND[kind];
        if (kind === 'mountains') {
            /* ba tầng sóng chồng nhau: dãy lớn, đỉnh nhỏ, rồi gợn vụn */
            return g
                + Math.sin(x / 1750) * 420
                + Math.sin(x / 620 + 1.3) * 165
                + Math.sin(x / 210 + 2.7) * 42;
        }
        if (kind === 'hills') {
            return g + Math.sin(x / 1250) * 175 + Math.sin(x / 430 + 0.8) * 58;
        }
        if (kind === 'fields') return g + Math.sin(x / 1600) * 34;
        if (kind === 'coast') return g + Math.sin(x / 900) * 18;
        if (kind === 'city') return g + Math.sin(x / 700) * 14;
        return g;
    }

    function rawGround(route, x) {
        var s = segmentAt(route, x);
        var a = baseGround(s.seg.kind, x);
        if (s.k <= 0) return a;
        return lerp(a, baseGround(s.next.kind, x), smooth(s.k));
    }

    /* Cao độ hai sân bay. Tính một lần rồi nhớ vào chính tuyến — vừa rẻ, vừa
     * bảo đảm mọi chỗ hỏi đều nhận đúng một con số. */
    function padY(route) {
        if (route._pad) return route._pad;
        route._pad = {
            dep: rawGround(route, route.runwayLen / 2),
            arr: rawGround(route, route.len - route.runwayLen / 2)
        };
        return route._pad;
    }

    /* Mặt đất cao bao nhiêu ở quãng x. NGUỒN SỰ THẬT DUY NHẤT: chỗ vẽ mặt đất,
     * chỗ đỡ máy bay khi bay thấp, chỗ đặt đường băng, và máy soát đều hỏi
     * đúng hàm này. Ba chỗ tự tính lấy thì có ngày mắt thấy máy bay lướt sát
     * ngọn núi mà mã lại tưởng còn cách hai trăm mét. */
    function groundAt(route, x) {
        var g = rawGround(route, x);
        var pad = padY(route);
        var f = flatBlend(x, 0, route.runwayLen);
        if (f > 0) g = lerp(g, pad.dep, smooth(f));
        f = flatBlend(x, route.len - route.runwayLen, route.len);
        if (f > 0) g = lerp(g, pad.arr, smooth(f));
        return g;
    }

    function flatBlend(x, x0, x1) {
        if (x >= x0 && x <= x1) return 1;
        if (x < x0) return clamp(1 - (x0 - x) / RUNWAY_RAMP, 0, 1);
        return clamp(1 - (x - x1) / RUNWAY_RAMP, 0, 1);
    }

    /* Trần an toàn: bay dưới ngần này là trò chơi ra tay đỡ. */
    function floorAt(route, x) { return groundAt(route, x) + SAFE_CLEAR; }

    /* ------------------------------------------------------------------ *
     * 7. HAI ĐẦU ĐƯỜNG BĂNG
     * ------------------------------------------------------------------ */
    function departRunway(route) { return { x0: 0, x1: route.runwayLen, y: padY(route).dep }; }
    function arriveRunway(route) {
        var x1 = route.len;
        return { x0: x1 - route.runwayLen, x1: x1, y: padY(route).arr };
    }

    /* Đường trượt hạ cánh: từ chỗ mời hạ cánh, một đường thẳng thoai thoải cắm
     * xuống đầu đường băng. Trẻ con không đọc được góc chúc, nhưng ĐI THEO một
     * vệt sáng thì đứa nào cũng làm được — nên đường này vừa là phép tính vừa
     * là thứ vẽ ra trên màn hình, và cả hai đọc chung một hàm. */
    function glideAlt(route, x) {
        var rw = arriveRunway(route);
        var startX = route.landStart;
        var endX = rw.x0 + GLIDE_END_PAD;       // chạm đất ngay sau đầu đường băng
        if (x <= startX) return GLIDE_ALT;
        if (x >= endX) return rw.y;
        return lerp(GLIDE_ALT, rw.y, (x - startX) / (endX - startX));
    }

    /* Chúc theo vệt sáng thì cần tụt bao nhiêu mét mỗi giây, ở tốc độ chạm
     * đất. Máy soát hỏi con số này để bắt trường hợp vệt sáng dốc hơn khả
     * năng chúc của máy bay — kiểu hỏng mà mắt không thấy được, chỉ thấy hậu
     * quả là máy bay lượn vòng mãi không hạ nổi. */
    function glideSink(route) {
        var rw = arriveRunway(route);
        var run = rw.x0 + GLIDE_END_PAD - route.landStart;
        return (GLIDE_ALT - rw.y) / (run / TOUCHDOWN_SPD);
    }

    /* ------------------------------------------------------------------ *
     * 8. VÒNG MÂY VÀ SAO TRỜI
     *
     *    Suy thẳng từ toạ độ chứ không giữ mảng: bay đi bay lại vẫn thấy đúng
     *    những vòng ấy ở đúng những chỗ ấy, và tuyến dài bao nhiêu cũng không
     *    phải sinh trước cái gì.
     * ------------------------------------------------------------------ */
    /* Đụng vào vòng/sao không. Ba chiều thật, khoảng cách thật — mà vì mọi
     * thứ đều chiếu qua chung một phép, cái mắt thấy đúng là cái này tính. */
    function hitBall(dx, dAlt, dz, r) {
        return dx * dx + dAlt * dAlt + dz * dz < r * r;
    }

    var RING_GAP = 1450;
    var RING_FROM = 4200;          // đủ xa để cất cánh xong và ổn định
    var RING_END_PAD = 1400;       // và dừng trước lúc được mời hạ cánh

    /* CHUỖI VÒNG MÂY — và chữ "chuỗi" là cả bài học ở đây.
     *
     * Bản đầu em rải mỗi vòng một chỗ ngẫu nhiên: độ cao bốc từ hàm băm, độ
     * lệch ngang bốc từ hàm băm. Máy soát cho một con bọ lái THẲNG tới từng
     * vòng một, và nó chỉ qua được 2 trên 12.
     *
     * Lý do là số học chứ không phải tay lái. Hai vòng cách nhau 1 450 m, ở
     * tốc độ ga giữa là chín giây. Trong chín giây máy bay bẻ ngang được chừng
     * 1 500 m và leo được 300 m. Mà rải ngẫu nhiên thì hai vòng liền nhau có
     * thể lệch nhau 3 200 m ngang và 1 250 m dọc. Bay tới không kịp — không
     * phải khó, mà là KHÔNG THỂ. Đứa bé sẽ tưởng tại mình dở.
     *
     * Nay mỗi vòng đặt theo vòng TRƯỚC NÓ, và bước nhảy bị kẹp trong đúng cái
     * mà máy bay bay nổi trong quãng thời gian ấy. Đường bay nối các vòng lại
     * thành một dải lượn mềm — vừa bay được, vừa đẹp hơn hẳn kiểu rải hạt.
     *
     * Chỗ nào địa hình dựng lên nhanh hơn sức leo (sườn núi đá vôi) thì bỏ
     * hẳn vòng ấy đi, thà thiếu một vòng còn hơn treo nó ở chỗ không ai tới.
     */
    function ringChain(route) {
        if (route._rings) return route._rings;
        /* Dừng hẳn trước lúc trò chơi mời hạ cánh. Máy soát bắt được: hai
         * vòng cuối nằm sau mốc ấy, và bé nào cũng bỏ chúng lại — không phải
         * vì khó, mà vì đúng lúc ấy trò chơi bảo bé quay ra lo hạ cánh. Treo
         * phần thưởng ở chỗ mình vừa bảo người ta đừng nhìn tới là một kiểu
         * thất hứa lặng lẽ. */
        var last = route.landStart - RING_END_PAD;
        var n = Math.floor((last - RING_FROM) / RING_GAP) + 1;
        var dt = RING_GAP / SPD_CRUISE;
        var dzMax = LAT_SPEED * dt * 0.55;      // chừa lại cho quãng vào cua
        var upMax = CLIMB_RATE * dt * 0.8;
        var dnMax = DESCEND_RATE * dt * 0.8;
        var out = [], alt = null, z = 0, i;
        for (i = 0; i < n; i++) {
            var x = RING_FROM + i * RING_GAP;
            var floor = floorAt(route, x) + 150;
            var wantAlt = clamp(1250 + Math.sin(i * 0.55 + 0.6) * 420, floor, ALT_MAX - 500);
            var wantZ = Math.sin(i * 0.9) * 900 + Math.sin(i * 0.37 + 1.7) * 300;
            if (alt === null) {
                /* VÒNG ĐẦU TIÊN PHẢI VỚI TỚI ĐƯỢC TỪ CÚ CẤT CÁNH.
                 *
                 * Máy soát bắt được: bản trước vòng đầu treo ở 1 487 m ngay
                 * quãng 4 200 m, mà từ lúc rời đường băng tới đó chỉ có hai
                 * mươi tư giây — cần leo 60 m mỗi giây trong khi máy bay leo
                 * nổi 34. Bé lái đúng hoàn hảo vẫn trượt bốn vòng đầu, và
                 * trượt ngay lúc vừa mới học lái xong. Đặt thấp rồi để cả
                 * chuỗi leo dần lên thì vòng nào cũng tới được. */
                alt = Math.max(floor, 620);
                z = 0;                       // thẳng trục, đúng hướng vừa cất cánh
            }
            else {
                alt += clamp(wantAlt - alt, -dnMax, upMax);
                z += clamp(wantZ - z, -dzMax, dzMax);
            }
            out.push(alt < floor - 1 ? null : { i: i, x: x, alt: alt, z: z });
        }
        route._rings = out;
        return out;
    }

    function ringAt(route, i) {
        var c = ringChain(route);
        return (i < 0 || i >= c.length) ? null : c[i];
    }
    function ringCount(route) { return ringChain(route).length; }

    /* Sao treo GIỮA hai vòng, ngay trên đường nối chúng. Bay men theo dải vòng
     * mây thì nhặt được sao mà không phải rẽ thêm đâu cả — phần thưởng cho
     * việc đi đúng đường, chứ không phải một việc thứ hai phải làm. */
    function starCount(route) { return Math.max(0, ringCount(route) - 1); }

    /* Bao nhiêu vòng THẬT SỰ có mặt — chỗ nào địa hình dựng quá nhanh thì
     * chuỗi bỏ trống. Máy soát đếm bằng con số này chứ không bằng chiều dài
     * mảng, không thì nó đòi bé chui qua cả mấy cái lỗ trống. */
    function ringReal(route) {
        var c = ringChain(route), n = 0;
        for (var i = 0; i < c.length; i++) if (c[i]) n++;
        return n;
    }

    function starAt(route, i) {
        var c = ringChain(route);
        var a = c[i], b = c[i + 1];
        if (!a || !b) return null;
        if (hash(i, 11) > 0.62) return null;          // thưa thôi, không rải kín trời
        /* ĐẶT NGAY TRÊN ĐƯỜNG VÀO VÒNG KẾ TIẾP.
         *
         * Ba lần đo mới ra chỗ đúng, và hai lần đầu sai vì em đoán thay vì
         * đo. Đặt giữa hai vòng: lệch 150–330 m khỏi lối bay thật. Kéo về
         * phía vòng vừa qua: còn tệ hơn, 240–300 m.
         *
         * Đo mới hiểu: máy bay bẻ ngang 165 m mỗi giây trong khi bay tới chỉ
         * 160 — nên nó chụm về đúng hướng vòng kế tiếp chỉ sau NỬA quãng, rồi
         * giữ nguyên hướng ấy mà bay nốt. Lối bay không phải đường thẳng nối
         * hai vòng, mà là một cú bẻ sớm rồi một đoạn thẳng dài.
         *
         * Nên sao treo ngay trên đoạn thẳng ấy: cùng độ cao và độ lệch với
         * vòng sắp tới, chỉ lùi lại 620 m. Bay đúng vào vòng thì tự nhiên
         * nhặt được sao trên đường vào — phần thưởng cho việc ĐI ĐÚNG, chứ
         * không phải một việc thứ hai phải làm. */
        return {
            i: i,
            x: b.x - 620,
            alt: b.alt + (hash(i, 13) - 0.5) * 70,
            z: b.z + (hash(i, 17) - 0.5) * 70
        };
    }

    /* Bao nhiêu vòng THẬT SỰ có mặt — chỗ nào địa hình dựng quá nhanh thì
     * chuỗi bỏ trống. Máy soát đếm bằng con số này chứ không bằng chiều dài
     * mảng, không thì nó đòi bé chui qua cả mấy cái lỗ trống. */
    function ringReal(route) {
        var c = ringChain(route), n = 0;
        for (var i = 0; i < c.length; i++) if (c[i]) n++;
        return n;
    }

    /* ------------------------------------------------------------------ *
     * 9. XẾP HẠNG HẠ CÁNH
     * ------------------------------------------------------------------ */
    function landRating(vs, spd, helped) {
        if (helped) return 'assisted';
        if (vs <= LAND_GREAT.vs && spd <= LAND_GREAT.spd) return 'great';
        if (vs <= LAND_NICE.vs && spd <= LAND_NICE.spd) return 'nice';
        return 'assisted';
    }

    return {
        W: W, H: H, PLANE_SX: PLANE_SX,
        SPD_MIN: SPD_MIN, SPD_CRUISE: SPD_CRUISE, SPD_MAX: SPD_MAX, SPD_ACCEL: SPD_ACCEL,
        ROTATE_SPD: ROTATE_SPD, TOUCHDOWN_SPD: TOUCHDOWN_SPD,
        CLIMB_RATE: CLIMB_RATE, DESCEND_RATE: DESCEND_RATE,
        ALT_MAX: ALT_MAX, ALT_CRUISE: ALT_CRUISE,
        CIRCLE_GIVE_UP: CIRCLE_GIVE_UP, GLIDE_ALT: GLIDE_ALT, glideSink: glideSink,
        LEVEL_EASE: LEVEL_EASE, SAFE_CLEAR: SAFE_CLEAR, RESCUE_LIFT: RESCUE_LIFT,
        PHOTO_RANGE: PHOTO_RANGE, RING_R: RING_R, STAR_R: STAR_R, STAR_PICK: STAR_PICK,
        hitBall: hitBall,
        FOCAL: FOCAL, HORIZON: HORIZON, CAM_BACK: CAM_BACK, CAM_UP: CAM_UP,
        NEAR: NEAR, VIEW_FAR: VIEW_FAR,
        LAT_MAX: LAT_MAX, LAT_SPEED: LAT_SPEED, LAT_EASE: LAT_EASE,
        LAND_GREAT: LAND_GREAT, LAND_NICE: LAND_NICE,
        ROUTES: ROUTES, routeById: routeById,
        segmentAt: segmentAt, groundAt: groundAt, floorAt: floorAt,
        departRunway: departRunway, arriveRunway: arriveRunway, glideAlt: glideAlt,
        ringAt: ringAt, ringCount: ringCount, ringReal: ringReal,
        starAt: starAt, starCount: starCount,
        landRating: landRating,
        clamp: clamp, lerp: lerp, smooth: smooth, hash: hash
    };
}));
