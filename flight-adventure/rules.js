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

    /* HAI TỈ LỆ, CỐ Ý KHÁC NHAU.
     *
     * Ngang 0,9 điểm ảnh mỗi mét: ở tốc độ ga giữa thì cảnh vật trôi chừng
     * 144 điểm ảnh mỗi giây — đủ để thấy mình đang bay, chưa tới mức chóng mặt.
     *
     * Đứng chỉ 0,115: nén lại gần tám lần. Đây là một lời nói dối cố ý, và nó
     * là lời nói dối ĐÁNG GIÁ NHẤT trong cả trò chơi. Vẽ đúng tỉ lệ thì bay ở
     * độ cao ngắm cảnh là mặt đất tụt hẳn ra khỏi màn hình, và cả game hoá
     * thành một khung trời trắng — mà "ngắm cảnh" chính là toàn bộ lý do trò
     * chơi này tồn tại. Nén lại thì lúc nào cũng thấy đủ ba thứ cùng lúc: máy
     * bay, mặt đất, và khoảng cách giữa hai cái đó.
     *
     * Máy quay KHÔNG trôi theo chiều đứng. Độ cao 0 luôn ở đúng một chỗ trên
     * màn hình, nên bé nhìn một cái là biết mình đang cao hay thấp — không
     * phải suy từ con số nào cả. */
    var PPM = 0.9;                 // điểm ảnh mỗi mét, chiều ngang
    var VPM = 0.115;               // điểm ảnh mỗi mét, chiều đứng
    /* Độ cao 0 nằm ở đây trên màn hình. Đặt ở 512 thì dải mặt đất chỉ còn 88
     * điểm ảnh — nhìn trên máy thật ra một vệt xám mỏng dưới đáy, và cả khung
     * hình thành ra một bầu trời rỗng. Hạ xuống 468 thì mặt đất được 132 điểm
     * ảnh, đủ chỗ cho nhà cửa, sông và bãi biển hiện ra thành hình. Trần bay
     * 3 400 m vẫn nằm gọn trong màn (y = 77). */
    var GROUND_Y = 468;

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
    var ALT_MAX = 3400;            // trần bay — trên nữa chỉ có trời trắng, chán
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

    /* Bán kính vòng mây và ngôi sao tính bằng ĐIỂM ẢNH, không phải mét.
     *
     * Vì hai tỉ lệ trên khác nhau tám lần, nên một vòng tròn khai bằng mét sẽ
     * vẽ ra thành cái ellipse dẹt lét, mà chỗ đụng lại tính theo mét — mắt
     * thấy một hình, mã tính một hình khác, và đứa bé bay xuyên qua giữa vòng
     * mà trò chơi bảo trượt. Khai bằng điểm ảnh thì mắt thấy sao, tính vậy. */
    var RING_PX = 62;
    var STAR_PX = 34;

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
                    at: 2400, kind: 'lake', ground: 0,
                    en: 'Hoan Kiem Lake', vi: 'Hồ Hoàn Kiếm',
                    factEn: 'A famous lake in the middle of Hanoi.',
                    factVi: 'Một cái hồ nổi tiếng ở giữa Hà Nội.'
                },
                {
                    at: 10600, kind: 'river', ground: 120,
                    en: 'Winding River', vi: 'Dòng Sông Uốn Khúc',
                    factEn: 'Rivers carry water from the mountains to the sea.',
                    factVi: 'Sông mang nước từ núi ra tới biển.'
                },
                {
                    at: 15200, kind: 'pass', ground: 900,
                    en: 'Hai Van Pass', vi: 'Đèo Hải Vân',
                    factEn: 'A mountain road high above the sea.',
                    factVi: 'Một con đèo chạy cao trên mặt biển.'
                },
                {
                    at: 19400, kind: 'beach', ground: 0,
                    en: 'My Khe Beach', vi: 'Biển Mỹ Khê',
                    factEn: 'A long sandy beach beside the city.',
                    factVi: 'Một bãi cát dài ngay cạnh thành phố.'
                },
                {
                    at: 22600, kind: 'bridge', ground: 0,
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
    var RING_GAP = 1450;
    var RING_FROM = 4200, RING_TO = 20200;

    /* Đụng vào vòng/sao không: đo trong không gian MÀN HÌNH, đúng thứ mắt
     * thấy. Cả chỗ vẽ, chỗ tính và máy soát đều gọi hàm này. */
    function hitPx(dxMetre, dAltMetre, rPx) {
        var dx = dxMetre * PPM, dy = dAltMetre * VPM;
        return dx * dx + dy * dy < rPx * rPx;
    }

    function ringAt(route, i) {
        var x = RING_FROM + i * RING_GAP;
        if (x > RING_TO) return null;
        var g = groundAt(route, x);
        var alt = g + 620 + hash(i, 3) * 1250;
        return { i: i, x: x, alt: clamp(alt, 500, ALT_MAX - 400) };
    }
    function ringCount(route) { return Math.floor((RING_TO - RING_FROM) / RING_GAP) + 1; }

    var STAR_GAP = 700;
    function starAt(route, i) {
        var x = RING_FROM + 380 + i * STAR_GAP;
        if (x > RING_TO) return null;
        if (hash(i, 11) > 0.55) return null;         // thưa thôi, không rải kín trời
        var g = groundAt(route, x);
        return { i: i, x: x, alt: clamp(g + 420 + hash(i, 13) * 1500, 380, ALT_MAX - 300) };
    }
    function starCount(route) { return Math.floor((RING_TO - RING_FROM) / STAR_GAP) + 1; }

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
        PHOTO_RANGE: PHOTO_RANGE, RING_PX: RING_PX, STAR_PX: STAR_PX, hitPx: hitPx,
        PPM: PPM, VPM: VPM, GROUND_Y: GROUND_Y,
        LAND_GREAT: LAND_GREAT, LAND_NICE: LAND_NICE,
        ROUTES: ROUTES, routeById: routeById,
        segmentAt: segmentAt, groundAt: groundAt, floorAt: floorAt,
        departRunway: departRunway, arriveRunway: arriveRunway, glideAlt: glideAlt,
        ringAt: ringAt, ringCount: ringCount, starAt: starAt, starCount: starCount,
        landRating: landRating,
        clamp: clamp, lerp: lerp, smooth: smooth, hash: hash
    };
}));
