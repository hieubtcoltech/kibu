/* =========================================================
   KIBU Games — số người đang chơi
   ---------------------------------------------------------
   Mỗi tab tự sinh một mã ngẫu nhiên (giữ trong sessionStorage nên đóng tab là
   mất, không theo dõi ai cả) rồi gửi nhịp tim tới /api/online. Server trả về
   tổng số tab còn "sống" và con số đó được ghi vào mọi phần tử [data-online].

   Chèn vào trang bằng: <script src="/presence.js" defer></script>
   ========================================================= */
(function () {
    'use strict';

    var PING_MS = 20000;          // server coi 45s là hết hạn, gửi 20s một lần
    var ID_KEY = 'kibuTabId';
    var lastCount = null;

    function tabId() {
        try {
            var v = sessionStorage.getItem(ID_KEY);
            if (!v) {
                v = Math.random().toString(36).slice(2) + Date.now().toString(36);
                sessionStorage.setItem(ID_KEY, v);
            }
            return v;
        } catch (e) {
            // Chế độ riêng tư chặn sessionStorage — mỗi lần tải trang tính một mã mới
            return Math.random().toString(36).slice(2);
        }
    }

    var id = tabId();

    /* Luôn dựng câu tiếng Việt rồi mới nhờ i18n dịch: đó cũng là cách game.js
     * làm, và tránh cảnh chữ nhấp nháy tiếng Việt một nhịp trên bản tiếng Anh
     * trước khi bộ quan sát của i18n kịp dịch lại. */
    function label(n) {
        var text = n + ' bé đang chơi';
        if (window.KibuI18n && window.KibuI18n.t) {
            try { return window.KibuI18n.t(text); } catch (e) { /* dùng bản gốc */ }
        }
        return text;
    }

    function paint(n) {
        lastCount = n;
        var nodes = document.querySelectorAll('[data-online]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            el.hidden = false;
            var slot = el.querySelector('[data-online-text]') || el;
            slot.textContent = label(n);
        }
    }

    function ping() {
        // Tab đang ẩn thì thôi, để nó tự rụng khỏi danh sách sau 45 giây
        if (document.hidden) return;
        fetch('/api/online?id=' + encodeURIComponent(id), { cache: 'no-store' })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (data && typeof data.online === 'number') paint(data.online);
            })
            .catch(function () { /* mất mạng thì giữ nguyên con số cũ */ });
    }

    function start() {
        ping();
        setInterval(ping, PING_MS);
        // Quay lại tab thì cập nhật ngay, không đợi hết một nhịp
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) ping();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
