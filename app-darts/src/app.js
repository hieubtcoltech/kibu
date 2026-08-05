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
     * Trong WKWebView không có navigator.share, nên game sẽ không vẽ nút
     * "Chia sẻ" mà chỉ còn Facebook / X — hai thứ vừa dẫn ra ngoài app (dễ bị
     * Apple đánh trượt với app cho trẻ em) vừa cần đường dẫn http nên bấm cũng
     * không ra gì. Gắn navigator.share vào plugin Share là game tự vẽ đúng nút
     * cần, còn bấm vào thì ra khay chia sẻ thật của máy. */
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
     * Gỡ hai nút dẫn ra mạng xã hội ngay khi bảng khoe điểm hiện ra.
     * Game dựng bảng này bằng innerHTML mỗi lần chơi xong, nên phải rình chứ
     * không gỡ một lần là xong được. */
    var shareBox = document.getElementById('solo-share');
    if (shareBox && window.MutationObserver) {
        new MutationObserver(function () {
            shareBox.querySelectorAll('.share-fb, .share-x').forEach(function (b) { b.remove(); });
        }).observe(shareBox, { childList: true, subtree: true });
    }

    /* ---------------------------------------------------------------- 3 ---
     * Nút ở màn kết thúc: bản web là "HOME" trỏ về kibugames.com, bản app đổi
     * thành quay lại màn chọn chế độ. Mượn luôn nút "Change Mode" trên thanh
     * trên cùng để không phải biết gì về bên trong game. */
    var over = document.getElementById('btn-over-menu');
    var menu = document.getElementById('btn-menu');
    if (over && menu) over.addEventListener('click', function () { menu.click(); });

    /* ---------------------------------------------------------------- 4 ---
     * Chặn phóng to bằng hai ngón và chạm hai lần. Bé chơi hay chạm dồn dập,
     * phóng nhầm một cái là màn chơi lệch hẳn mà bé không biết đường về. */
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
        document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
    });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---------------------------------------------------------------- 5 ---
     * Tắt màn hình chờ khi trang đã vẽ xong. Để plugin tự tắt theo giờ thì hoặc
     * là tắt sớm (thấy nền trống) hoặc là chờ thừa. */
    function hideSplash() {
        if (Plugins.SplashScreen) Plugins.SplashScreen.hide();
    }
    if (document.readyState === 'complete') hideSplash();
    else window.addEventListener('load', function () { setTimeout(hideSplash, 120); });
})();
