/* ============================================================================
 * Lớp đệm giữa game web và vỏ app — nạp TRƯỚC game.js
 * ----------------------------------------------------------------------------
 * Không sửa một dòng nào trong game.js. Cái gì bản app cần khác thì vá ở đây,
 * để mai kia game trên web cập nhật, chạy lại `npm run sync` là xong, không phải
 * chép tay lại bản vá nào.
 * ==========================================================================*/
(function () {
    'use strict';

    var Plugins = (window.Capacitor && window.Capacitor.Plugins) || {};

    /* ---------------------------------------------------------------- 1 ---
     * Chia sẻ bằng khay của iOS
     *
     * Trong WKWebView không có navigator.share, nên nếu game gọi chia sẻ sẽ không
     * hoạt động. Gắn navigator.share vào plugin Share là game tự dùng khay chia sẻ
     * thật của hệ thống. */
    if (Plugins.Share && typeof navigator.share !== 'function') {
        navigator.share = function (data) {
            data = data || {};
            return Plugins.Share.share({
                title: data.title,
                text: data.text,
                url: data.url,
                dialogTitle: data.title
            });
        };
    }

    /* ---------------------------------------------------------------- 2 ---
     * Chặn phóng to bằng hai ngón và chạm hai lần. Bé chơi hay chạm dồn dập,
     * phóng nhầm một cái là màn chơi lệch hẳn mà bé không biết đường về. */
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
        document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
    });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------------------------------------------------------------- 3 ---
     * Tắt màn hình chờ khi trang đã vẽ xong. Để plugin tự tắt theo giờ thì hoặc
     * là tắt sớm (thấy nền trống) hoặc là chờ thừa. */
    function hideSplash() {
        if (Plugins.SplashScreen) Plugins.SplashScreen.hide();
    }
    if (document.readyState === 'complete') hideSplash();
    else window.addEventListener('load', function () { setTimeout(hideSplash, 120); });
})();
