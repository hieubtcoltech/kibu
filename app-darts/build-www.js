/* ============================================================================
 * Dựng thư mục www/ cho app từ mã nguồn web ở ../darts-game
 * ----------------------------------------------------------------------------
 * App KHÔNG chép tay: mỗi lần sửa game trên web, chạy `npm run sync` là bản app
 * cập nhật theo. Nhờ vậy web và app không bao giờ lệch nhau.
 *
 * Bản app khác bản web đúng bốn điểm, đều là yêu cầu của App Store:
 *   1. Không gọi mạng   — phông chữ, icon, lá cờ nằm sẵn trong gói; bỏ Google
 *                         Analytics và bộ đếm người online. Máy bay chế độ máy
 *                         bay vẫn chơi được, và không thu thập dữ liệu của trẻ.
 *   2. Không dẫn ra web — bỏ liên kết Facebook/Telegram/WhatsApp, nút "Trang
 *                         chủ", nút chia sẻ lên Facebook/X. App cho trẻ mà bắn
 *                         ra trình duyệt ngoài là lý do bị từ chối phổ biến.
 *   3. Chia sẻ bằng khay hệ thống thay cho cửa sổ bật lên của trình duyệt.
 *   4. Chừa lề tai thỏ và thanh vuốt của iPhone.
 *
 * Mọi phép thay thế bên dưới đều BẮT BUỘC khớp. Nếu sau này index.html của web
 * đổi và một phép không khớp nữa, script dừng ngay kèm tên phép — thà hỏng lúc
 * dựng còn hơn ra một app thiếu mất phần đã sửa.
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');        // repo web
const GAME = path.join(ROOT, 'darts-game');
const WWW = path.join(__dirname, 'www');
const SRC = path.join(__dirname, 'src');

/* Ảnh nào cần cho lúc chơi. og-image (chỉ dùng khi chia sẻ link web), icon-600/
   icon-800 (chỉ dùng để tạo icon app) và trang đo check-sea.html đều ở ngoài
   gói cho nhẹ. */
const GAME_ASSETS = [
    'game.js', 'style.css', 'icon.jpg', 'icon.webp',
    'arena-fair.jpg', 'arena-fair.webp', 'arena-fair-512.jpg', 'arena-fair-512.webp',
    'arena-beach.jpg', 'arena-beach.webp', 'arena-beach-512.jpg', 'arena-beach-512.webp'
];

function copy(from, to) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
}

function copyDir(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
        const s = path.join(from, e.name), d = path.join(to, e.name);
        e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
    }
}

/* ------------------------------------------------------------------------ *
 * Bộ sửa HTML — mỗi phép có tên để báo lỗi cho rõ
 * ------------------------------------------------------------------------ */
function editor(text) {
    const api = {
        text,
        /** Bắt buộc khớp; khớp 0 lần là dừng cả bản dựng. */
        must(name, find, replace) {
            const before = api.text;
            api.text = api.text.replace(find, replace);
            if (api.text === before) {
                throw new Error(
                    `Phép sửa "${name}" không khớp gì trong darts-game/index.html.\n` +
                    `  Trang web chắc đã đổi. Mở build-www.js sửa lại phép này rồi dựng lại.`);
            }
            return api;
        },
        /** Có thì bỏ, không có cũng không sao (thẻ SEO hay thêm bớt). */
        drop(find) { api.text = api.text.replace(find, ''); return api; }
    };
    return api;
}

function buildIndex() {
    const e = editor(fs.readFileSync(path.join(GAME, 'index.html'), 'utf8'));

    /* --- 1. Lề tai thỏ: không có viewport-fit=cover thì env(safe-area-*) luôn
       trả về 0 và nội dung chui xuống dưới tai thỏ. --- */
    e.must('viewport', /content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/,
        'content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"');

    /* --- 1b. Tên trang: trên web nó là dòng tiêu đề đi câu tìm kiếm, trong app
       không ai nhìn thấy — để gọn cho khỏi lẫn. --- */
    e.must('tiêu đề', /<title>[^<]*<\/title>/, '<title>Balloon Darts</title>');

    /* --- 2. Bỏ phần SEO: trong app không ai đọc, mà còn trỏ ra kibugames.com --- */
    e.drop(/\s*<!-- SEO Meta Tags -->/)
        .drop(/\s*<meta name="(description|keywords|author|robots)"[^>]*>/g)
        .drop(/\s*<link rel="canonical"[^>]*>/)
        .drop(/\s*<link rel="alternate"[^>]*>/g)
        .drop(/\s*<!-- Open Graph \/ Facebook -->/)
        .drop(/\s*<meta property="og:[^"]*"[^>]*>/g)
        .drop(/\s*<!-- Kích thước khai sẵn[\s\S]*?-->/)
        .drop(/\s*<!-- Twitter Card -->/)
        .drop(/\s*<meta name="twitter:[^"]*"[^>]*>/g)
        .drop(/\s*<!-- Structured Data \(JSON-LD\) -->/)
        .drop(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/)
        .drop(/\s*<!-- Favicon -->/)
        .drop(/\s*<link rel="icon"[^>]*>/g)
        .drop(/\s*<link rel="apple-touch-icon"[^>]*>/);

    /* --- 3. Phông chữ và bộ icon: lấy từ vendor/ trong gói thay vì CDN.
       Đây là điểm mấu chốt để app chạy được khi mất mạng. --- */
    e.must('preconnect', /\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">[\s\S]*?<link href="https:\/\/fonts\.googleapis\.com\/css2[^>]*>/,
        '\n    <link rel="stylesheet" href="vendor/fonts/fonts.css">')
        .must('fontawesome', /\s*<!-- FontAwesome nạp KHÔNG CHẶN[\s\S]*?<noscript><link rel="stylesheet" href="https:\/\/cdnjs[^>]*><\/noscript>/,
            '\n    <link rel="stylesheet" href="vendor/fontawesome/css/fontawesome.min.css">' +
            '\n    <link rel="stylesheet" href="vendor/fontawesome/css/solid.min.css">');

    /* --- 4. Bỏ đo đếm và bộ đếm người online: cả hai đều gọi máy chủ. App cho
       trẻ em không được gửi dữ liệu đi mà chưa có người lớn đồng ý, nên cách gọn
       nhất là không có gì để gửi. routes.js chỉ phục vụ URL của web (i18n.js
       thiếu nó vẫn chạy, tự lùi về ngôn ngữ của máy). --- */
    e.must('bỏ routes.js', /\s*<script src="\/routes\.js"><\/script>/, '')
        .must('bỏ presence.js', /\s*<script src="\/presence\.js" defer><\/script>/, '')
        .must('bỏ analytics', /\s*<!-- Google Analytics[^>]*-->\s*<script type="module" src="\/analytics\.js"><\/script>/, '');

    /* --- 5. Đường dẫn tuyệt đối "/x" thành tương đối "x": trong app trang nằm
       ở capacitor://localhost/index.html, "/x" vẫn đúng, nhưng để tương đối thì
       mở thẳng bằng file:// lúc thử cũng chạy. --- */
    e.must('đường dẫn tài nguyên', /(src|href)="\/(darts-game\/|site-chrome\.css|i18n\.js|logo\.svg)/g, '$1="$2');

    /* --- 6. Thêm phần riêng của app. app.js nạp TRƯỚC game.js vì nó thay
       navigator.share bằng khay chia sẻ của iOS, mà game đọc navigator.share
       ngay lúc dựng bảng kết quả. --- */
    e.must('css của app', /<\/head>/, '    <link rel="stylesheet" href="app.css">\n</head>')
        .must('js của app', /<script src="darts-game\/game\.js"><\/script>/,
            '<script src="app.js"></script>\n    <script src="darts-game/game.js"></script>');

    /* --- 7. Logo KIBU thôi làm liên kết: trong app không có "trang chủ" để về,
       bấm vào chỉ tổ thoát khỏi game. --- */
    e.must('logo hết là liên kết', /<a href="\/" class="nav-home" title="Home" aria-label="Home">([\s\S]*?)<\/a>/,
        '<span class="nav-home">$1</span>');

    /* --- 8. Nút "HOME" ở màn kết thúc trỏ về web; đổi thành quay lại màn chọn
       chế độ (app.js nối nút này với nút "Change Mode" sẵn có). --- */
    e.must('nút HOME', /<a href="\/" class="big-btn btn-ghost"><i class="fa-solid fa-house"><\/i> HOME<\/a>/,
        '<button id="btn-over-menu" class="big-btn btn-ghost"><i class="fa-solid fa-list"></i> CHANGE MODE</button>');

    /* --- 9. Bỏ hẳn chân trang: trong đó chỉ có liên kết Facebook / Telegram /
       WhatsApp, dòng giới thiệu trỏ về web và bộ đếm người online — app không
       giữ thứ nào. Riêng nút đổi ngôn ngữ thì dời lên thanh trên cùng.

       Dời chứ không giữ nguyên chỗ cũ, vì khi xoay ngang iPhone chỉ còn hơn 400
       điểm ảnh chiều cao: một dải chân trang ăn mất chỗ của sân chơi, mà nút cờ
       nằm sát mép dưới lại đúng chỗ vuốt về màn hình chính. i18n.js tìm nút này
       theo id nên đặt đâu cũng chạy. --- */
    e.must('bỏ chân trang', /\s*<footer class="site-footer">[\s\S]*?<\/footer>/, '')
        .must('nút đổi ngôn ngữ lên thanh trên', /(<button id="btn-restart"[\s\S]*?<\/button>)/,
            `$1
                <button id="btn-global-lang" class="lang-flag-btn" title="Switch Language / Đổi ngôn ngữ">
                    <img id="global-lang-flag" src="vendor/flags/vn.png" alt="Language">
                </button>`);

    return e.text;
}

/* ------------------------------------------------------------------------ *
 * Chạy
 * ------------------------------------------------------------------------ */
fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

fs.writeFileSync(path.join(WWW, 'index.html'), buildIndex());

for (const f of GAME_ASSETS) copy(path.join(GAME, f), path.join(WWW, 'darts-game', f));
copy(path.join(ROOT, 'site-chrome.css'), path.join(WWW, 'site-chrome.css'));
copy(path.join(ROOT, 'logo.svg'), path.join(WWW, 'logo.svg'));
copyDir(path.join(__dirname, 'vendor'), path.join(WWW, 'vendor'));
copy(path.join(SRC, 'app.css'), path.join(WWW, 'app.css'));
copy(path.join(SRC, 'app.js'), path.join(WWW, 'app.js'));

/* i18n.js lấy hai lá cờ từ flagcdn.com — thứ duy nhất còn gọi ra mạng. Trỏ về
   tệp trong gói. Sửa lúc chép chứ không sửa tệp gốc, để web vẫn dùng CDN. */
{
    const src = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
    const out = src.replace(/https:\/\/flagcdn\.com\/w40\/(vn|gb)\.png/g, 'vendor/flags/$1.png');
    if (out === src) throw new Error('Không thấy địa chỉ flagcdn trong i18n.js — kiểm tra lại nút đổi ngôn ngữ.');
    fs.writeFileSync(path.join(WWW, 'i18n.js'), out);
}

/* Chốt chặn cuối: quét cả gói xem còn chỗ nào gọi ra mạng không. Sót một thứ là
   app đứng hình vài giây khi máy không có mạng — và Apple duyệt app trong phòng
   kín, mạng chập chờn. */
const OFFENDERS = [];
(function scan(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { scan(p); continue; }
        if (!/\.(html|js|css)$/.test(e.name)) continue;
        const t = fs.readFileSync(p, 'utf8');
        for (const m of t.matchAll(/(src|href)\s*=\s*["'](https?:)?\/\/[^"']+/gi))
            OFFENDERS.push(`${path.relative(WWW, p)} → ${m[0].slice(0, 70)}`);
        for (const m of t.matchAll(/url\(\s*["']?(https?:)?\/\/[^)]+/gi))
            OFFENDERS.push(`${path.relative(WWW, p)} → ${m[0].slice(0, 70)}`);
    }
})(WWW);

let bytes = 0;
(function size(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        e.isDirectory() ? size(p) : bytes += fs.statSync(p).size;
    }
})(WWW);

console.log(`www/ đã dựng xong — ${(bytes / 1024 / 1024).toFixed(1)} MB`);
if (OFFENDERS.length) {
    console.log('\n⚠  Còn tham chiếu ra mạng (app phải chạy được khi mất mạng):');
    OFFENDERS.forEach(o => console.log('   ' + o));
    process.exit(1);
}
console.log('Không còn tham chiếu nào ra mạng ✓');
