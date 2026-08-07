/* ============================================================================
 * Kịch bản dựng cảnh để chụp ảnh App Store
 * ----------------------------------------------------------------------------
 * CHỈ chèn tạm lúc chụp (xem make-shots.js), KHÔNG nằm trong bản nộp.
 *
 * Chạy theo ĐỒNG HỒ chứ không nhận lệnh từ bên ngoài: ảnh chụp trong app thật
 * trên máy giả lập, mà từ ngoài thì không gọi được vào trang. Mỗi cảnh dựng ở
 * mốc T, máy bấm ở T + 2,5 giây — mốc bên này phải khớp với SHOTS bên
 * make-shots.js.
 *
 * BA NHỊP CHO MỖI CẢNH CHƠI, và nhịp giữa mới là chỗ đáng nói:
 *
 *   T + 0,0s   đặt người nhện lên đúng độ cao cần chụp
 *   T + 0,9s   CHỐT KHUÔN HÌNH rồi ĐÓNG BĂNG game
 *   T + 2,5s   bấm máy
 *
 * Vì sao phải đóng băng chứ không chụp lúc đang chạy: mấy thứ đắt giá nhất
 * trên màn hình đều CHỚP QUA. Tia tơ sống 0,22 giây, tia sét giáng 0,22 giây.
 * Để game chạy tự do rồi bấm máy theo đồng hồ thì mười lần có tám lần chụp
 * đúng lúc chúng vừa tắt — ảnh ra một khe trời trống trơn, đọc không ra trò
 * chơi này chơi cái gì. Đóng băng rồi mới dựng nốt mấy thứ ấy thì tấm nào ra
 * tấm ấy, chạy lại bao nhiêu lần cũng thế.
 *
 * Còn quãng 0,9 giây chạy thật ở đầu thì để game tự lo phần nó làm tốt hơn:
 * máy quay trôi vào đúng chỗ, số mét trên HUD nhích lên thật, mưa với đèn thành
 * phố tự vào nếp.
 * ==========================================================================*/
(function () {
    'use strict';

    /* ---------------------------------------------------------- hồ sơ chơi --
     * Ghi TRƯỚC khi game khởi động (tệp này chèn ngay sau game.js, mà game.js
     * chỉ đọc lúc DOMContentLoaded). Máy mới cài thì mọi con số đều bằng 0 —
     * bảng chọn trống trơn, cửa hàng ghi "🪙 0" và không mua nổi bộ nào. Ảnh
     * lên store phải là app của một người ĐÃ CHƠI, nên dựng sẵn một hồ sơ. */
    try {
        localStorage.setItem('kibu_spider_climb', JSON.stringify({
            coins: 5240, gems: 18, suit: 'classic',
            owned: ['classic', 'midnight', 'neon', 'gold'],
            best: { endless: 41880, daily: 12640, hardcore: 8420 },
            bestM: { endless: 612, daily: 244, hardcore: 158 },
            rec: { combo: 26, drones: 38, sprint: 61.4 },
            missions: null, done: [], dailyDay: 0, dailyBestDay: 0,
            plays: 42, seenHelp: true
        }));
    } catch (e) { }

    /* Chốt khuôn hình ở đây, sớm hơn hẳn lúc bấm máy. Máy giả lập nạp trang
       nhanh chậm mỗi lần một khác, nên mốc bấm máy trôi được cỡ một giây về hai
       phía; để khoảng hở rộng thì trôi kiểu gì cũng rơi vào quãng đã đóng
       băng. */
    var FREEZE_AT = 900;

    var D = null, R = null, G = null, P = null, H = 0;
    var timers = [];

    function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function clearAll() { timers.forEach(clearTimeout); timers.length = 0; }

    /* ------------------------------------------------------------ trợ giúp --
     * Đặt người nhện lên tường ở một độ cao cho trước, rồi để game chạy tiếp.
     *
     * Ba việc không được quên, thiếu cái nào cũng ra ảnh sai:
     *   · world.ensure() mỗi lượt chỉ sinh được 60 khuôn màn, mà nhảy thẳng lên
     *     mấy nghìn mét thì cần hàng trăm — phải gọi tới khi sinh đủ.
     *   · G.maxY là thứ HUD lấy ra tính mét. Quên thì ảnh ghi "0 m" trong khi
     *     người nhện đang lơ lửng giữa trời.
     *   · G.camY phải đặt đúng theo luật của game (CAM_ANCHOR), chứ để camY =
     *     P.y thì người nhện dính sát mép trên và bị cắt mất nửa người.
     */
    function climbTo(metres, side, opt) {
        D.start('endless');

        var w = G.world;
        var y = 900 + metres * R.PX_PER_M;

        /* Sinh màn tới quá đầu người chơi một màn hình. Chốt vòng lặp để một
           bộ sinh hỏng cũng không treo cả lượt chụp. */
        for (var i = 0; i < 600 && w.cursor < y + H; i++) w.ensure(y + H);

        y = clearSpot(w, side, y, 760);

        P.side = side;
        P.y = y;
        P.vx = 0; P.vy = 0;
        P.state = 'cling';
        P.face = side === R.SIDE_L ? 1 : -1;
        P.crack = 0; P.glassOn = null; P.glassT = 0;
        P.x = wallHold(side, y);
        /* Bất tử trong lúc dàn cảnh. Sẽ TRẢ VỀ 0 ở nhịp chốt khuôn hình: game
           vẽ người đang bất tử theo kiểu nhấp nháy, mà nhấp nháy thì một nửa số
           khung hình người nhện chỉ còn mờ 42% — chụp trúng khung ấy là ảnh ra
           một cái bóng ma. */
        P.invuln = 999;
        P.web = R.WEB_MAX;

        G.maxY = y;
        G.camY = y + H * R.CAM_ANCHOR;
        G.zone = R.zoneIndexAt(metres);
        G.zoneBannerT = 0;
        G.score = opt.score || 0;
        G.coins = opt.coins || 0;
        G.gems = opt.gems || 0;
        G.combo = opt.combo || 0;
        G.maxCombo = Math.max(G.maxCombo, G.combo);
        G.lives = opt.lives == null ? R.LIVES : opt.lives;
        G.bolt = null; G.farBolt = null; G.flash = 0; G.shake = 0;

        w.ensure(G.camY + H);
        w.prune(G.camY - H * 1.8);
        D.showScreen(null);
        D.touchButtons(true);
        D.hud(true);
    }

    function wallHold(side, y) {
        return G.world.wallX(side, y) + (side === R.SIDE_L ? R.PLAYER_R : -R.PLAYER_R);
    }

    /* Quét lên tìm chỗ bám mà cả quãng `room` phía trên đều trống. Không có chỗ
       nào thì trả lại chỗ ban đầu — thà ảnh xấu còn hơn không có ảnh. */
    function clearSpot(w, side, y0, room) {
        for (var k = 0; k < 80; k++) {
            var y = y0 + k * 70, ok = true;
            for (var d = 0; d <= room; d += 40) {
                if (w.blockerAt(side, y + d)) { ok = false; break; }
            }
            if (ok) return y;
        }
        return y0;
    }

    /* ------------------------------------------------------- chốt khuôn hình --
     * Gọi ở T + 0,9s. Sửa lại tư thế cho chắc rồi ĐÓNG BĂNG: 'shots_freeze'
     * không phải một giai đoạn game biết tới, nên vòng lặp bỏ qua phần cập nhật
     * và chỉ còn vẽ — đúng thứ cần.
     *
     * Chốt tư thế vì trong 0,9 giây vừa rồi người nhện có thể đã bị hất khỏi
     * tường (đụng chim, đụng giàn giáo). Rơi ngửa giữa khe cũng là một khoảnh
     * khắc thật của game, nhưng không phải khoảnh khắc mình muốn kể. */
    function freeze(extra) {
        var w = G.world;
        if (P.state !== 'cling') {
            var y = clearSpot(w, P.side, G.camY - H * R.CAM_ANCHOR, 120);
            P.y = y;
            G.camY = y + H * R.CAM_ANCHOR;
        }
        P.state = 'cling';
        P.vx = 0; P.vy = 0;
        P.x = wallHold(P.side, P.y);
        P.face = P.side === R.SIDE_L ? 1 : -1;
        P.crack = 0;
        P.invuln = 0;
        G.flash = 0; G.shake = 0;
        G.maxY = Math.max(G.maxY, P.y);

        if (extra) extra();

        G.phase = 'shots_freeze';
        D.hud(true);
    }

    /* Một con máy bay không người lái, đặt đúng chỗ trong khe.
     *
     * Vị trí ngang của nó do đồng hồ mối nguy quyết định (xem moverPos), nên
     * muốn nó đứng đâu thì phải giải ngược ra pha — đặt bừa pha rồi hy vọng nó
     * bay tới chỗ đẹp là trò may rủi, mà ảnh store thì không được may rủi. */
    function drone(y, across) {
        var m = G.world.mover('drone', { y: y, period: 3.2, phase: 0, span: 0.7 });
        if (m) aim(m, across);
        return m;
    }

    function aim(m, across) {
        var ph = Math.asin(Math.max(-1, Math.min(1, across))) / (Math.PI * 2);
        m.phase = ((ph - G.hz / m.period) % 1 + 1) % 1;
    }

    /* ---------------------------------------------------------------- cảnh --
     * Mỗi cảnh nói MỘT điều, và điều ấy phải khác hẳn cảnh bên cạnh — bảy tấm
     * ảnh cùng một khoảng trời xanh thì người lướt qua chỉ đọc ra một tấm.
     */

    /* Khu cao ốc ban ngày: trời xanh, kính sáng, hai con máy bay chắn đường. */
    function sceneClimb() {
        climbTo(820, R.SIDE_L, { score: 11840, coins: 96, gems: 3, combo: 7 });
        later(FREEZE_AT, function () {
            freeze(function () {
                drone(P.y + 200, 0.15);
                drone(P.y + 430, -0.55);
            });
        });
    }

    /* Phố đêm đèn nê-ông, tia tơ đang bay và một con máy bay ở đầu tia.
     *
     * Bắn THẬT bằng chính hàm của game chứ không vẽ tay một sợi dây — có thế
     * thì đầu tia mới rơi đúng vào một mục tiêu thật, và điểm cộng cũng là điểm
     * thật.
     *
     * Nhưng bắn trúng thì con máy bay CHẾT, mà chết là thôi vẽ. Ảnh ra một sợi
     * dây trắng chỉ vào khoảng không — nhìn không hiểu người nhện đang bắn cái
     * gì. Nên bắn xong dựng nó dậy: tấm ảnh phải kể được cả hai đầu của cú
     * bắn, chứ một mình sợi dây thì chưa thành câu chuyện. */
    function sceneWeb() {
        climbTo(4880, R.SIDE_R, { score: 63200, coins: 412, gems: 11, combo: 12 });
        later(FREEZE_AT, function () {
            var hit = drone(P.y + 230, -0.3);    // con dính tơ
            var far = drone(P.y + 520, 0.45);    // con còn bay, để thấy chúng đi thành đàn
            P.web = R.WEB_MAX;
            D.web();                             // phải bắn TRƯỚC lúc đóng băng: fireWeb đòi phase 'play'
            if (hit) hit.dead = false;
            if (far) far.dead = false;
            freeze();
        });
    }

    /* Đêm giông: mưa, chớp xa sau hai toà tháp, và một tia sét đang giáng ngay
       bên cạnh người nhện. */
    function sceneStorm() {
        climbTo(6980, R.SIDE_L, { score: 92600, coins: 574, gems: 16, combo: 9, lives: 2 });
        later(FREEZE_AT, function () {
            freeze(function () {
                G.bolt = {
                    t: R.BOLT_WARN + 0.02,   // ngay đầu quãng giáng: tia sáng nhất
                    side: P.side,
                    y: P.y + 150,
                    seed: 137,
                    done: true
                };
                G.farBolt = { life: 0.42, x: R.W * 0.3, seed: 411 };
                G.flash = 0.16;
                drone(P.y + 470, 0.5);
            });
        });
    }

    /* Cửa hàng trang phục */
    function sceneSuits() {
        D.touchButtons(false);
        var b = document.getElementById('btn-shop');
        if (b) b.click();
    }

    /* Nhiệm vụ trong ngày */
    function sceneMissions() {
        D.touchButtons(false);
        var b = document.getElementById('btn-missions');
        if (b) b.click();
    }

    /* Bảng kết quả — dựng bằng cách CHƠI THẬT rồi thua thật.
     *
     * Bản trước tự ghi chữ vào từng ô của bảng. Nhìn thì được, nhưng bảng ấy
     * còn có thanh so với kỷ lục, huy hiệu "KỶ LỤC MỚI", tên vùng đạt được và
     * danh sách nhiệm vụ vừa xong — mấy thứ ấy do game tự tính, ghi tay không
     * ra. Nay đặt trạng thái cuối lượt rồi thả cho rơi khỏi đáy màn: game tự
     * kết thúc lượt và tự dựng cả bảng, đúng như lúc chơi thật. */
    function sceneOver() {
        climbTo(1284, R.SIDE_R, { score: 24680, coins: 268, gems: 7, combo: 18, lives: 1 });
        G.stats.drones = 23;
        G.stats.foes = 6;
        G.stats.catches = 9;
        G.stats.jumps = 148;
        G.stats.coins = 268;
        G.stats.gems = 7;
        later(FREEZE_AT, function () {
            P.invuln = 0;
            P.state = 'fall';
            P.y = G.camY - H - 200;      // rơi khỏi đáy màn ⇒ hết mạng ⇒ endRun()
        });
    }

    /* ---------------------------------------------------------------- chạy -- */
    var STORY = [
        { at: 6500, run: sceneClimb },
        { at: 13000, run: sceneWeb },
        { at: 19500, run: sceneStorm },
        { at: 26000, run: sceneSuits },
        { at: 32500, run: sceneMissions },
        { at: 39000, run: sceneOver }
    ];

    function begin() {
        D = window.ClimbDebug;
        if (!D) { setTimeout(begin, 50); return; }
        R = D.R; G = D.G; P = D.P; H = R.H;

        /* Mốc 0 là lúc TRANG NẠP XONG, không phải lúc mở app — make-shots.js
           đợi đúng quãng ấy rồi mới bắt đầu đếm. */
        STORY.forEach(function (s) {
            setTimeout(function () { clearAll(); s.run(); }, s.at);
        });
    }

    if (document.readyState === 'complete') begin();
    else window.addEventListener('load', begin);
})();
