/* =========================================================
   KIBU Games — Google Analytics (GA4 qua Firebase)
   ---------------------------------------------------------
   Trước đây mỗi trang tự chép lại nguyên khối khởi tạo Firebase — 12 bản giống
   hệt nhau, mà fruit-crush thì lại thiếu hẳn nên game đó không hề được đếm.
   Gom về một chỗ: sửa cấu hình hay thêm sự kiện chỉ phải đụng vào đây.

   Nạp bằng:  <script type="module" src="/analytics.js"></script>

   GA4 tự ghi page_view cho mọi trang, nên báo cáo "Pages and screens" đã cho
   biết trang game nào đông người vào. Ngoài ra ở đây bắn thêm một sự kiện
   riêng game_open kèm tên game, để lọc và xếp hạng cho gọn.
   ========================================================= */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';

const firebaseConfig = {
    apiKey: 'AIzaSyCqxLyJzhKND5BSY0axRLzcUjCWziMHm1k',
    authDomain: 'kibu-world.firebaseapp.com',
    projectId: 'kibu-world',
    storageBucket: 'kibu-world.firebasestorage.app',
    messagingSenderId: '466171110853',
    appId: '1:466171110853:web:0143134de5fa4f421657ac',
    measurementId: 'G-9SP0KGJ5PW'
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Giữ lại hai biến toàn cục cũ phòng khi có đoạn mã nào đang trông vào chúng
window.firebaseApp = app;
window.firebaseAnalytics = analytics;

/* Trang này là trang game nào? routes.js là script thường nên đã chạy xong
   trước module này; vẫn để sẵn cách đọc thẳng từ URL nếu vì lý do gì đó
   KibuRoutes không có mặt. */
function currentGame() {
    try {
        const r = window.KibuRoutes && window.KibuRoutes.parse(location.pathname);
        if (r && r.kind === 'game') return { slug: r.slug, lang: r.lang };
    } catch (e) { /* rơi xuống cách dưới */ }

    const m = location.pathname.match(/^\/(?:(vi|en)\/)?g\/([a-z0-9-]+)/i);
    if (m) return { slug: m[2], lang: m[1] || document.documentElement.lang || 'vi' };

    // Đường dẫn cũ dạng /shooter-game/
    const d = location.pathname.match(/^\/([a-z0-9-]+)\/?$/i);
    if (d && window.KibuRoutes && window.KibuRoutes.slugOf(d[1])) {
        return { slug: window.KibuRoutes.slugOf(d[1]), lang: document.documentElement.lang || 'vi' };
    }
    return null;
}

/* Tên game lấy từ <title> ("Ocean Party - Free Online Kids Game | KIBU Games")
   nên không phải nuôi thêm một bảng tên nữa. */
function gameName(slug) {
    const t = (document.title || '').split(/\s+[-|]\s+/)[0].trim();
    return t || slug;
}

const game = currentGame();
if (game) {
    logEvent(analytics, 'game_open', {
        game_slug: game.slug,
        game_name: gameName(game.slug),
        language: game.lang
    });
}
