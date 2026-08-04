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

/* Bắn sự kiện SAU khi trang tải xong, không phải ngay lúc module chạy: lúc đó
   Firebase còn đang nạp gtag.js, sự kiện gửi sớm bị rơi mất (đã thử: gọi ngay
   thì chỉ thấy page_view, gọi sau khi tải xong thì game_open lên đủ). */
const game = currentGame();

function trackGameOpen() {
    if (!game) return;
    logEvent(analytics, 'game_open', {
        game_slug: game.slug,
        game_name: gameName(game.slug),
        language: game.lang
    });
}

/* ---------- Đếm lượt chơi của RIÊNG MÌNH ----------
   GA4 ở trên đếm đúng nhưng số nằm bên Google, mình không lấy ra để hiện lên
   trang được. Cửa /api/play của máy chủ nhà thì lấy ra được, nên trang chủ mới
   có hàng "đang hot" và số lượt trên từng ô.

   Máy chủ KHÔNG lưu gì nhận dạng được người chơi — chỉ slug game và ngày. Chỗ
   này cũng không gửi gì thêm ngoài slug.

   CHỐNG THỔI PHỒNG: một tab chỉ tính một lượt cho mỗi game trong 30 phút. Bấm
   F5 mười lần vẫn là một lượt, và một bé mở đi mở lại cả buổi cũng không đẩy
   game ấy lên đầu bảng "hot". Ghi mốc thời gian vào sessionStorage nên đóng
   tab là quên — không phải cookie, không theo dõi qua ngày. */
const PLAY_COOLDOWN_MS = 30 * 60 * 1000;

function countPlayOnce() {
    if (!game) return;
    const key = 'kibu_played_' + game.slug;
    try {
        const last = +(sessionStorage.getItem(key) || 0);
        if (Date.now() - last < PLAY_COOLDOWN_MS) return;
        sessionStorage.setItem(key, String(Date.now()));
    } catch (e) { /* trình duyệt khoá sessionStorage: cứ đếm, thà hơn không */ }

    /* fetch với keepalive để lượt chơi vẫn được ghi kể cả khi bé bấm vào game
       rồi rời trang ngay. Hỏng thì im lặng bỏ qua — đây là con số cho vui,
       không đáng để làm phiền bé bằng một thông báo lỗi. */
    try {
        fetch('/api/play?g=' + encodeURIComponent(game.slug), {
            method: 'GET', keepalive: true, cache: 'no-store'
        }).catch(() => { });
    } catch (e) { /* bỏ qua */ }
}

if (game) {
    if (document.readyState === 'complete') { trackGameOpen(); countPlayOnce(); }
    else window.addEventListener('load', () => { trackGameOpen(); countPlayOnce(); }, { once: true });
}
