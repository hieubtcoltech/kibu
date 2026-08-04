/**
 * CỖ MÁY KỲ QUẶC — bộ mảnh máy và thư viện tầng
 * ----------------------------------------------------------------------------
 * Tệp này KHÔNG biết gì về Phaser lẫn Matter. Nó chỉ mô tả hình dáng: mảnh nào
 * to bao nhiêu, đặt ở đâu, nghiêng bao nhiêu, và mảnh ấy cư xử thế nào (nảy,
 * cuốn, thổi, hút). Bên game.js mới dựng thành vật thể vật lý thật.
 *
 * VÌ SAO TÁCH RA
 * Máy soát màn chơi phải trả lời được câu "màn này có lắp lại được không" mà
 * không cần vẽ gì cả. Tách phần mô tả ra khỏi phần vẽ thì máy soát nạp đúng cái
 * bản mô tả game đang chạy — không có bản chép nào để mà lệch nhau.
 *
 * CÁCH MỘT MÀN ĐƯỢC DỰNG
 * Cỗ máy xếp thành nhiều TẦNG chồng lên nhau. Viên bi vào tầng ở một bên, đi
 * ngang qua tầng rồi rơi xuống tầng kế ở bên kia — cứ thế zíc-zắc xuống đáy như
 * cái máng trượt nước. Mỗi tầng là một trò vật lý khác nhau: dốc trượt, hàng
 * domino đổ, ván bập bênh, bàn nhún, quạt thổi, băng chuyền, đệm nảy, nam châm.
 *
 * Mỗi tầng có đúng MỘT mảnh chính có thể tháo ra. Tháo mảnh ấy đi thì viên bi
 * đứt đường, và việc của bé là lắp lại cho đúng chỗ, đúng chiều.
 *
 * VÌ SAO MÀN NÀO CŨNG CHẮC CHẮN GIẢI ĐƯỢC
 * Không có màn nào được bịa ra rồi mới đi tìm lời giải. Máy dựng cỗ máy HOÀN
 * CHỈNH trước, chạy thử cho viên bi về đích thật, rồi mới tháo mảnh ra làm đề
 * bài. Lời giải có trước, đề bài có sau.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.MarbleParts = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Khổ một tầng. Cả cỗ máy rộng 640, mỗi tầng cao 152 — sáu tầng vừa kín
     * chiều cao bàn chơi mà vẫn còn chỗ cho khay mảnh ở dưới. */
    var BAY_W = 640;
    var BAY_H = 176;
    var BALL_R = 15;

    /* ------------------------------------------------------------------ *
     * KIỂU MẢNH
     *
     * Mỗi kiểu có: tên hiển thị, màu, và cách nó tác động lên viên bi.
     * "flip" cho biết mảnh ấy có phân biệt trái/phải hay không — dốc trượt và
     * quạt gió thì có (đặt ngược chiều là bi đi sai đường), đệm nảy thì không.
     * ------------------------------------------------------------------ */
    var KIND = {
        ramp:   { name: 'Ramp',      color: 0x8f7bff, flip: true,  icon: '📐' },
        seesaw: { name: 'Seesaw',    color: 0x63e6be, flip: true,  icon: '⚖️' },
        spring: { name: 'Bouncer',   color: 0xff6b8a, flip: true,  icon: '🛏️' },
        fan:    { name: 'Fan',       color: 0x4dabf7, flip: true,  icon: '💨' },
        belt:   { name: 'Conveyor',  color: 0xffd43b, flip: true,  icon: '➡️' },
        bumper: { name: 'Bumper',    color: 0xf783ac, flip: false, icon: '⭕' },
        magnet: { name: 'Magnet',    color: 0xff8787, flip: true,  icon: '🧲' }
    };

    /* ------------------------------------------------------------------ *
     * THƯ VIỆN TẦNG
     *
     * Toạ độ viết theo chiều đi TRÁI → PHẢI. Muốn tầng chạy ngược thì lật
     * ngang (mirror), không phải viết lại.
     *
     * GIAO ƯỚC GIỮA CÁC TẦNG — chỗ này em làm sai lần đầu và sai rất nặng
     *
     * Bản đầu mỗi tầng em tự chọn chỗ vào chỗ ra theo mắt nhìn. Chạy thử ra
     * kết quả kỳ quặc: có màn "thắng" sau đúng 0,9 giây — mà 0,9 giây chính là
     * thời gian rơi tự do hết chiều cao ấy. Viên bi rơi thẳng một mạch xuống
     * giỏ, không chạm lấy một mảnh nào của cỗ máy. Máy chấm thì vẫn báo ĐẠT.
     *
     * Gốc rễ: tầng dưới lật ngang so với tầng trên, nên chỗ RA của tầng trên
     * phải soi gương đúng vào chỗ VÀO của tầng dưới. Muốn thế thì mọi tầng
     * phải dùng CHUNG một cặp số:
     *
     *     ENTRY + EXIT = BAY_W        (104 + 536 = 640)
     *
     * Thêm nữa, viên bi không bao giờ rơi trúng một điểm — nó rơi trúng một
     * VÙNG. Nên tầng nào cũng phải có máng hứng rộng ở chỗ vào (bắt được bi
     * rơi lệch cỡ 60 ô), và có gờ chặn ở chỗ ra để bi không văng quá xa.
     * Hai thứ đó do intake() và guard() lo, tầng nào cũng gọi.
     *
     * Mỗi tầng trả về:
     *   enter  chỗ viên bi rơi vào tầng (x tính từ mép trái tầng)
     *   exit   chỗ viên bi rời tầng xuống tầng dưới
     *   fixed  những mảnh gắn chết, bé không tháo được
     *   slot   MẢNH CHÍNH — mảnh có thể bị tháo ra làm đề bài
     * ------------------------------------------------------------------ */

    var ENTRY = 104;
    var EXIT = BAY_W - ENTRY;          // 536

    /* Gờ chặn bên phải: giữ cho viên bi rơi xuống trong khoảng hẹp quanh EXIT
     * thay vì văng tuốt sang mép tủ. Thiếu nó thì bi rơi ở x=620, tầng dưới
     * lật ngang lại chờ bi ở x=20 — trượt máng, đứt chuỗi. */
    function guard() {
        return { shape: 'box', x: 600, y: 118, w: 18, h: 116, angle: 0, role: 'wall' };
    }

    /* Máng ra ở đáy tầng.
     *
     * Thêm cái này là bước đổi cách nghĩ. Trước đó mỗi trò phải TỰ ném viên bi
     * rơi trúng cửa ra, nên trò nào cũng phải chỉnh ly từng ô một: đệm nảy hụt
     * 40 ô, nam châm hụt 30 ô, bập bênh thì bi kẹt. Sửa được cái này thì hỏng
     * cái kia, cả buổi không xong.
     *
     * Nay đáy tầng nào cũng có sẵn một máng hứng rộng 135 ô. Trò chỉ cần ném
     * viên bi rơi ĐÂU ĐÓ trúng máng, còn việc dắt nó ra đúng cửa rơi là của
     * máng. Dung sai từ vài ô nhảy lên hơn trăm ô, và tám trò tự nhiên chạy
     * được cả tám mà không cần trò nào biết mặt trò nào. */
    function outfeed() {
        return { shape: 'box', x: 460, y: 152, w: 120, h: 14, angle: 0.06, fric: 0.10, role: 'shelf' };
    }

    /* Máng hứng ở chỗ vào: một tấm nghiêng rộng, bắt viên bi rơi lệch trong
     * khoảng x = 44…172 rồi dồn nó về đúng đường của tầng. */
    function intake() {
        /* fric thấp hẳn: máng hứng là cái máng TRƯỢT, không phải mặt đường.
         * Để ma sát thường thì viên bi bò xuống hết máng rồi rơi gần như thẳng
         * đứng, chẳng còn đà nào để chạy tiếp — mấy tầng cần bi tới có tốc độ
         * (domino, bập bênh) chết đứng vì chuyện này. */
        return { shape: 'box', x: 100, y: 36, w: 190, h: 14, angle: 0.34, fric: 0.06, role: 'ledge' };
    }

    /* SÀN TẦNG: bịt kín đáy tầng từ mép trái tới mép máng ra, chỉ chừa đúng
     * cửa rơi.
     *
     * Thiếu nó thì cỗ máy có một lỗ hổng chí mạng mà nhìn không ra. Tầng nào
     * thiếu mảnh, viên bi rơi thẳng xuống ở mép trái tầng ấy — rồi tầng dưới
     * (đang lật ngang) lại đưa đúng cái máng ra của nó ra hứng, thế là bi được
     * cứu, chạy tiếp và về đích như thường. Tháo mảnh mà vẫn thắng.
     *
     * Máy sinh màn bắt được ngay: nó phải vứt gần hết những màn tháo mảnh ở
     * tầng lẻ, thành ra cả thế giới đầu chỉ toàn màn "sửa tầng cuối". Nhìn
     * danh sách màn thấy mười cái g=4 giống hệt nhau là biết có gì đó sai ở
     * tầng dưới chứ không phải ở máy sinh màn.
     *
     * Có sàn thì rơi hụt là nằm luôn tại chỗ, và mọi tầng đều thật sự cần
     * thiết. */
    function floorPan() {
        return { shape: 'box', x: 205, y: 183, w: 390, h: 14, angle: 0, role: 'floor' };
    }

    /* Mọi tầng dùng chung một khuôn: máng hứng ở cửa vào, sàn tầng, máng ra ở
     * đáy, gờ chặn bên phải. Phần viết riêng cho từng tầng chỉ còn đúng cái trò của
     * nó, nằm gọn trong ô x 190…520, y 70…135.
     *
     * Bản đồ một tầng, đọc từ trái sang:
     *     10…190   máng hứng          (bắt bi rơi lệch, dồn về mép 190)
     *    190…520   chỗ của trò riêng
     *    400…520   máng ra            (hứng bi từ trò, dắt ra cửa rơi)
     *    520…591   CỬA RƠI            (khoảng trống bắt buộc, rộng 71 ô)
     *    591       mặt trong gờ chặn */
    function frame(extra) {
        return [intake()].concat(extra || []).concat([floorPan(), outfeed(), guard()]);
    }

    /* Dốc trượt: tấm ván dài, bi lăn từ đầu cao xuống đầu thấp rồi rơi. */
    function bayRamp() {
        return {
            kind: 'ramp',
            enter: { x: ENTRY, y: 0 },
            exit: { x: EXIT, y: BAY_H },
            fixed: frame(),
            slot: { kind: 'ramp', x: 347, y: 104, w: 309, h: 18, angle: 0.156 }
        };
    }

    /* Băng chuyền: mặt băng cuốn đều, chở viên bi chạy ngang hết tầng. Chắc ăn
     * nhất trong cả thư viện — để dành cho những màn đã nhiều tầng. */
    function bayBelt() {
        return {
            kind: 'belt',
            enter: { x: ENTRY, y: 0 },
            exit: { x: EXIT, y: BAY_H },
            fixed: frame(),
            slot: { kind: 'belt', x: 350, y: 120, w: 320, h: 20, angle: 0, speed: 4.6 }
        };
    }

    /* Ván bập bênh: bi rơi vào đầu ĐANG CAO, sức nặng của nó lật ván xuống,
     * ván càng dốc bi càng chạy nhanh rồi văng khỏi đầu kia. Tầng duy nhất mà
     * mảnh chính tự nó chuyển động. */
    function baySeesaw() {
        return {
            kind: 'seesaw',
            enter: { x: ENTRY, y: 0 },
            exit: { x: EXIT, y: BAY_H },
            fixed: frame([
                { shape: 'tri', x: 330, y: 140, w: 58, h: 40, angle: 0, role: 'pivot' }
            ]),
            slot: { kind: 'seesaw', x: 330, y: 112, w: 280, h: 16, angle: 0.15 }
        };
    }

    /* Hàng domino: bi lăn tới húc con đầu tiên, cả hàng đổ dây chuyền, con
     * cuối cùng ngã VẮT NGANG khe hở thành cây cầu cho chính viên bi đi qua.
     *
     * Em chọn kiểu này thay vì "domino bấm nút mở cửa sập" vì nó chắc chắn
     * hơn nhiều: cầu đã bắc rồi thì bi qua được, không phụ thuộc vào chuyện
     * con domino cuối có đập trúng cái nút bé xíu hay không. */
    /* ---- VÌ SAO KHÔNG CÓ TẦNG DOMINO ----
     *
     * Em đã dựng nó bốn lần bằng bốn cách khác nhau và bỏ cả bốn. Ghi lại đây
     * để sau này ai đó (kể cả em) đừng dựng lại lần thứ năm mà không biết:
     *
     *   1. Bi lăn tới húc ngang sườn con thứ nhất. Đo được bi tới nơi chỉ còn
     *      96 ô/giây — húc mãi sáu mươi khung hình mới lật nổi một con, rồi
     *      hết đà nằm kẹt ngay dưới chân nó.
     *   2. Cho domino nghiêng sẵn cho dễ đổ. Trên kệ liền thì được, nhưng bi
     *      vẫn chui lọt xuống dưới cái chân đang kênh lên mà kẹt cứng.
     *   3. Cho bi RƠI trúng đỉnh con thứ nhất (cánh tay đòn dài nhất). Lật
     *      được thật, nhưng con dày 22 thì mặt trên rộng gần bằng viên bi, bi
     *      ĐẬU LUÔN TRÊN ĐỈNH như đậu trên cột rồi lăn qua đỉnh cả ba con.
     *   4. Làm con mỏng lại, mỗi con đứng trên một cái bệ rời để thiếu domino
     *      là bi lọt khe. Con thứ nhất đổ đẹp, nhưng khi đổ nó rơi TỤT XUỐNG
     *      KHE giữa hai bệ nên không với tới con thứ hai — chuỗi đứt.
     *
     * Cái khó gốc: hàng domino cần một mặt đỡ liền để đổ dây chuyền, mà bất kỳ
     * mặt đỡ liền nào cũng thành một con đường cho viên bi đi — thế là tháo
     * domino ra bé vẫn thắng, đề bài hoá ra có lời giải rỗng. Hai đòi hỏi ấy
     * chọi nhau, và em chưa tìm ra cách nào thoả cả hai mà không phải mấy chục
     * lần chỉnh ly từng ô.
     *
     * Bảy trò còn lại đều đã chạy vững cả hai chiều và đều thoả hai điều kiện
     * (đủ mảnh thì bi về đích, tháo mảnh thì không), nên em chốt bảy. Thà bảy
     * trò chắc chắn còn hơn tám trò mà một trò lúc được lúc không.
     * ------------------------------------------------------------------ */

    /* Bàn nhún: bi rơi xuống hố bên trái, đệm hất nó bật lên vượt qua bức
     * tường giữa tầng rồi rơi xuống máng ra. Tầng ồn ào nhất. */
    function baySpring() {
        return {
            kind: 'spring',
            enter: { x: ENTRY, y: 0 },
            exit: { x: EXIT, y: BAY_H },
            fixed: frame([
                { shape: 'box', x: 360, y: 130, w: 16, h: 92, angle: 0, role: 'wall' }
            ]),
            slot: { kind: 'spring', x: 220, y: 168, w: 150, h: 20, angle: 0.28, kick: { vx: 300, vy: -400 } }
        };
    }

    /* Quạt gió: bi rơi khỏi mép máng hứng, luồng gió thổi ngang đẩy nó bạt
     * sang máng ra. Đặt quạt ngược chiều thì bi bị thổi trở lại — đây là tầng
     * dạy bé nhìn chiều mũi tên. */
    function bayFan() {
        return {
            kind: 'fan',
            enter: { x: ENTRY, y: 0 },
            exit: { x: EXIT, y: BAY_H },
            fixed: frame(),
            slot: {
                kind: 'fan', x: 44, y: 118, w: 64, h: 76, angle: 0,
                wind: { w: 470, h: 130, force: 0.0048 }
            }
        };
    }

    /* Đệm nảy tròn: bi rơi trúng vai phải quả đệm, nảy chéo sang máng ra như
     * bi trong máy pinball. Không phân biệt trái phải. */
    function bayBumper() {
        return {
            kind: 'bumper',
            enter: { x: ENTRY, y: 0 },
            exit: { x: EXIT, y: BAY_H },
            fixed: frame(),
            slot: { kind: 'bumper', x: 200, y: 140, w: 68, h: 68, angle: 0, kick: { speed: 520 } }
        };
    }

    /* Nam châm: giữa đường có một khoảng hụt, bi không đủ đà bay qua. Cục nam
     * châm bên kia hút nó vượt khe. Trông như phép thuật, thật ra chỉ là một
     * vùng lực hướng về tâm. */
    function bayMagnet() {
        return {
            kind: 'magnet',
            enter: { x: ENTRY, y: 0 },
            exit: { x: EXIT, y: BAY_H },
            fixed: frame([
                { shape: 'box', x: 250, y: 92, w: 160, h: 16, angle: 0.10, role: 'shelf' }
            ]),
            slot: {
                kind: 'magnet', x: 592, y: 74, w: 60, h: 60, angle: 0,
                pull: { r: 360, force: 0.0012 }
            }
        };
    }

    var BAYS = {
        ramp: bayRamp, seesaw: baySeesaw, spring: baySpring,
        fan: bayFan, belt: bayBelt, bumper: bayBumper, magnet: bayMagnet
    };
    var BAY_KEYS = Object.keys(BAYS);

    /* ------------------------------------------------------------------ *
     * LẬT NGANG
     *
     * Tầng nào cũng viết theo chiều trái → phải. Lật ngang thì x thành
     * (rộng − x) và mọi góc đổi dấu; riêng băng chuyền phải đổi cả chiều
     * cuốn, quạt phải đổi chiều thổi. Quên đổi mấy cái đó là tầng lật trông
     * thì đúng mà chạy thì sai — em bị đúng lỗi ấy ở lần dựng đầu.
     * ------------------------------------------------------------------ */
    function mirrorShape(s) {
        var out = {};
        for (var k in s) out[k] = s[k];
        out.x = BAY_W - s.x;
        if (s.angle) out.angle = -s.angle;
        if (s.speed) out.speed = -s.speed;
        return out;
    }

    function mirrorBay(bay) {
        var out = {
            kind: bay.kind,
            enter: { x: BAY_W - bay.enter.x, y: bay.enter.y },
            exit: { x: BAY_W - bay.exit.x, y: bay.exit.y },
            fixed: bay.fixed.map(mirrorShape),
            slot: mirrorShape(bay.slot)
        };
        return out;
    }

    /* ------------------------------------------------------------------ *
     * DỰNG MỘT MÀN
     *
     * Màn chơi ghi trong levels.js chỉ là một dãy tên tầng cộng với vài con
     * số — gọn để tải nhanh. inflate() bung nó ra thành bản mô tả đầy đủ.
     *
     *   b   dãy tên tầng, viết tắt một chữ cái (xem SHORT)
     *   m   bit nào bật thì tầng ấy bị lật ngang
     *   g   bit nào bật thì MẢNH CHÍNH của tầng ấy bị tháo ra khay
     *   d   số mảnh mồi nhử thêm vào khay (mảnh thừa, không chỗ nào cần)
     * ------------------------------------------------------------------ */
    var SHORT = { r: 'ramp', s: 'seesaw', p: 'spring', f: 'fan', b: 'belt', u: 'bumper', m: 'magnet' };
    var LONG = {};
    for (var sk in SHORT) LONG[SHORT[sk]] = sk;

    function inflate(raw) {
        var keys = String(raw.b).split('').map(function (c) { return SHORT[c]; });
        var bays = [];
        for (var i = 0; i < keys.length; i++) {
            var bay = BAYS[keys[i]]();
            /* Tầng lẻ lật ngang để đường bi zíc-zắc; bit trong raw.m đảo thêm
             * nếu màn ấy muốn khác đi. */
            var flip = (i % 2 === 1) !== !!((raw.m >> i) & 1);
            if (flip) bay = mirrorBay(bay);
            bay.index = i;
            bay.flipped = flip;
            bay.top = i * BAY_H;
            bay.gone = !!((raw.g >> i) & 1);
            bays.push(bay);
        }
        return {
            bays: bays,
            decoys: raw.d || 0,
            need: bays.filter(function (b) { return b.gone; }).length
        };
    }

    /* Khay mảnh: những mảnh đã tháo ra, cộng thêm mấy mảnh mồi nhử.
     * Mồi nhử lấy kiểu nào cũng được MIỄN LÀ không trùng kiểu đang thiếu —
     * trùng kiểu thì bé cắm nhầm cái mồi vào ô trống mà máy vẫn tính đúng,
     * hoá ra đề bài có hai lời giải, mà một trong hai là do em cẩu thả. */
    function trayOf(level, pick) {
        var tray = [];
        level.bays.forEach(function (b) {
            if (b.gone) tray.push({ kind: b.slot.kind, from: b.index });
        });
        var used = {};
        tray.forEach(function (t) { used[t.kind] = 1; });
        var pool = BAY_KEYS.filter(function (k) { return !used[k]; });
        for (var i = 0; i < level.decoys && pool.length; i++) {
            var k = pool[pick ? pick(pool.length) : i % pool.length];
            tray.push({ kind: k, from: -1 });
        }
        return tray;
    }

    return {
        BAY_W: BAY_W, BAY_H: BAY_H, BALL_R: BALL_R,
        KIND: KIND, BAYS: BAYS, BAY_KEYS: BAY_KEYS, SHORT: SHORT, LONG: LONG,
        mirrorBay: mirrorBay, inflate: inflate, trayOf: trayOf
    };
}));
