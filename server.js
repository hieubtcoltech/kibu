#!/usr/bin/env node
/* =========================================================
   Playground Static Server
   Server tĩnh không cần cài thêm thư viện nào.
   Chạy:  node server.js  [port]
   Mặc định lắng nghe trên 0.0.0.0 để các máy khác trong cùng
   mạng Wi-Fi (điện thoại, iPad của các con) đều vào được.
   ========================================================= */

'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const zlib = require('zlib');
const os = require('os');
const url = require('url');

const ROUTES = require('./routes.js');
const XIANGQI = require('./xiangqi-server.js');

const ROOT = __dirname;
const SITE = process.env.SITE_ORIGIN || 'https://kibugames.com';
const START_PORT = Number(process.argv[2] || process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PORT_TRIES = 20;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    /* Thiếu dòng này thì sitemap.xml rơi vào nhánh octet-stream ở dưới: trình
       duyệt tải file về thay vì hiện ra, và Search Console có thể từ chối đọc
       vì Google đòi sitemap phải là text/xml hoặc application/xml. */
    '.xml': 'text/xml; charset=utf-8',
    '.xsl': 'text/xsl; charset=utf-8',
    '.xslt': 'text/xsl; charset=utf-8',
    '.map': 'application/json; charset=utf-8'
};

/* ---------- Màu cho terminal ---------- */
const C = {
    reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
    cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m',
    magenta: '\x1b[35m', red: '\x1b[31m', gray: '\x1b[90m'
};

/* ---------- Danh sách IP trong mạng LAN ---------- */
function lanAddresses() {
    const out = [];
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                out.push({ name, address: net.address });
            }
        }
    }
    return out;
}

/* ---------- Chặn truy cập ra ngoài thư mục dự án ---------- */
function safeResolve(urlPath) {
    let decoded;
    try {
        decoded = decodeURIComponent(urlPath);
    } catch {
        return null; // URL mã hoá hỏng
    }
    // Bỏ mọi byte null và chuẩn hoá
    if (decoded.includes('\0')) return null;

    // Không phục vụ file/thư mục ẩn (.git, .env, .DS_Store…) — tránh lộ mã nguồn
    if (decoded.split('/').some(seg => seg.startsWith('.') && seg !== '.' && seg !== '..')) return null;

    const resolved = path.resolve(ROOT, '.' + path.posix.normalize(decoded));
    // Phải nằm trong ROOT
    if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
    return resolved;
}

/* send() cũng phải biết nén.
 *
 * Em thêm phần nén ở chỗ phục vụ TỆP TĨNH, đo lại thấy i18n.js giảm 67% và
 * mừng — rồi đo tiếp mấy trang HTML thì chúng vẫn gửi thô nguyên 61 KB. Vì
 * trang HTML không đi qua đường tệp tĩnh: nó được dựng lại theo ngôn ngữ rồi
 * gửi bằng hàm này, một lối hoàn toàn khác.
 *
 * Sửa được một nửa mà tưởng xong là chuyện dễ xảy ra nhất khi tối ưu — phải đo
 * ĐÚNG THỨ mình vừa sửa, và đo cả những thứ tưởng là đã sửa theo.
 */
function send(res, status, body, headers = {}, req = null) {
    const accept = String((req && req.headers['accept-encoding']) || '');
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
    let encoding = null;
    if (buf.length > 1024) {
        if (/\bbr\b/.test(accept)) encoding = 'br';
        else if (/\bgzip\b/.test(accept)) encoding = 'gzip';
    }
    if (encoding) {
        const out = zlib[encoding === 'br' ? 'brotliCompressSync' : 'gzipSync'](
            buf,
            encoding === 'br'
                ? { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }
                : { level: 6 }
        );
        res.writeHead(status, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': out.length,
            'Content-Encoding': encoding,
            'Vary': 'Accept-Encoding',
            ...headers
        });
        res.end(out);
        return;
    }
    res.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': buf.length,
        ...headers
    });
    res.end(buf);
}

const NOT_FOUND_PAGE = (p) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 · Không tìm thấy</title>
<style>
 body{margin:0;min-height:100vh;display:grid;place-items:center;
      font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
      background:linear-gradient(135deg,#050714,#101428);color:#fff;text-align:center;padding:24px}
 .box{max-width:460px}
 h1{font-size:5rem;margin:0;background:linear-gradient(135deg,#ff007f,#ffd700,#00f0ff);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
 p{color:#94a3b8;line-height:1.6}
 code{background:rgba(255,255,255,.1);padding:2px 8px;border-radius:6px;color:#ffd700}
 a{display:inline-block;margin-top:20px;padding:14px 32px;border-radius:16px;
   background:linear-gradient(135deg,#ff007f,#9d4edd);color:#fff;text-decoration:none;font-weight:700}
</style></head><body><div class="box">
<h1>404</h1>
<p>Không tìm thấy <code>${p.replace(/[<>&]/g, '')}</code> trên máy chủ này.</p>
<a href="/">🏠 Về trang chọn game</a>
</div></body></html>`;

/* ---------- Ngôn ngữ & SEO cho URL sạch ---------- */

/* Chỉ dùng cho URL chưa có tiền tố ngôn ngữ. Ưu tiên đầu tiên của trình duyệt
   quyết định; không rõ thì về tiếng Việt vì đó là đối tượng chính của trang. */
function pickLang(req) {
    const header = String(req.headers['accept-language'] || '').toLowerCase();
    const first = (header.split(',')[0] || '').trim();
    if (first.startsWith('en')) return 'en';
    if (first.startsWith('vi')) return 'vi';
    return header.includes('vi') ? 'vi' : (header.includes('en') ? 'en' : ROUTES.DEFAULT_LANG);
}

/* Cùng một file HTML được phục vụ ở hai địa chỉ, nên canonical / hreflang /
   og:url phải viết lại theo ngôn ngữ đang xem — nếu để nguyên thì Google thấy
   hai URL cùng khai báo một canonical và sẽ bỏ qua một bản. */
function injectSeo(html, route) {
    const bare = ROUTES.bare(route);
    const urlFor = (l) => SITE + ROUTES.build(l, bare);
    const canonical = urlFor(route.lang);

    html = html.replace(/(<html[^>]*\slang=")[^"]*(")/i, `$1${route.lang}$2`);
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/i, `$1${canonical}$2`);
    html = html.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*"[^>]*>\n?/gi, '');
    html = html.replace(/(<link rel="canonical"[^>]*>\n?)/i, (m) =>
        m +
        `    <link rel="alternate" hreflang="vi" href="${urlFor('vi')}">\n` +
        `    <link rel="alternate" hreflang="en" href="${urlFor('en')}">\n` +
        `    <link rel="alternate" hreflang="x-default" href="${urlFor('en')}">\n`);
    html = html.replace(/(<meta property="og:url" content=")[^"]*(")/i, `$1${canonical}$2`);
    html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/i,
        `$1${route.lang === 'vi' ? 'vi_VN' : 'en_US'}$2`);
    html = html.replace(/(<meta name="twitter:url" content=")[^"]*(")/i, `$1${canonical}$2`);
    return html;
}

/* ---------- Đếm số người đang chơi ----------
   Mỗi tab tự sinh một mã ngẫu nhiên rồi cứ ~20 giây gọi /api/online một lần.
   Không nghe tin quá PRESENCE_TTL thì coi như đã đóng trang. Đếm trong bộ nhớ
   nên chỉ đúng khi chạy một tiến trình (pm2 hiện chạy đúng một) và số sẽ về 0
   sau mỗi lần khởi động lại — chấp nhận được, đây là con số cho vui.
   PRESENCE_MAX chặn trên để một con bot gọi liên tục với mã khác nhau không
   làm phình bộ nhớ. */
const PRESENCE_TTL = 45000;
const PRESENCE_MAX = 5000;
const presence = new Map();

function touchPresence(id) {
    const now = Date.now();
    for (const [key, seen] of presence) {
        if (now - seen > PRESENCE_TTL) presence.delete(key);
    }
    if (id && (presence.has(id) || presence.size < PRESENCE_MAX)) {
        presence.set(id, now);
    }
    return presence.size;
}

/* ---------- Đếm lượt chơi ----------
   Ghi lại game nào được mở bao nhiêu lần, để trang chủ hiện được hàng "đang
   hot" và số lượt trên từng ô. Trước đây chỉ có GA4 của Google: nó đếm đúng
   nhưng dữ liệu nằm bên Google, mình không lấy ra để hiện lên trang được.

   BA ĐIỀU RÀNG BUỘC, ghi rõ ở đây vì chúng quyết định toàn bộ thiết kế:

   1. ĐÂY LÀ WEB CHO TRẺ CON — không lưu bất cứ thứ gì nhận dạng được người
      chơi. Không cookie, không mã người dùng, không địa chỉ IP, không user
      agent. Mỗi lượt chơi ghi đúng hai thứ: slug game và NGÀY (không giờ phút).
      Có muốn cũng không truy ra được ai đã chơi gì.

   2. KHÔNG THÊM PHẦN MỀM NGOÀI. Cả web chạy Node thuần, không một gói npm nào,
      và em giữ nguyên nếp ấy. Số liệu để trong một tệp JSON bé xíu, gộp sẵn
      theo ngày — không cần cơ sở dữ liệu, không cần tiến trình thứ hai.

   3. SỐNG SÓT QUA KHỞI ĐỘNG LẠI. Máy chủ restart mỗi lần deploy (webhook kéo
      mã mới rồi pm2 restart). Đếm trong bộ nhớ như phần "đang online" thì mất
      sạch mỗi lần deploy, nên số lượt phải ghi xuống đĩa. Ghi mỗi lượt một
      lần thì tốn ổ đĩa vô ích, nên gộp trong bộ nhớ rồi mỗi 60 giây mới xả
      xuống một lần, và xả nốt lúc tắt.

   Tệp nằm ở data/plays.json, KHÔNG theo git — deploy kiểu "git pull" không
   đụng tới nó. */
const PLAYS_FILE = path.join(ROOT, 'data', 'plays.json');
const PLAYS_KEEP_DAYS = 60;      // giữ lịch sử hai tháng, đủ cho "hot 7 ngày"
const PLAYS_FLUSH_MS = 60000;

let plays = { total: {}, days: {} };   // {slug: n} và {'YYYY-MM-DD': {slug: n}}
let playsDirty = false;

function today() {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function loadPlays() {
    try {
        const raw = fs.readFileSync(PLAYS_FILE, 'utf8');
        const d = JSON.parse(raw);
        if (d && typeof d === 'object') {
            plays.total = d.total || {};
            plays.days = d.days || {};
        }
    } catch (e) { /* chưa có tệp: lần chạy đầu, bắt đầu từ số không */ }
}

function savePlays() {
    if (!playsDirty) return;
    /* Dọn ngày quá cũ trước khi ghi, để tệp không phình mãi */
    const keys = Object.keys(plays.days).sort();
    while (keys.length > PLAYS_KEEP_DAYS) delete plays.days[keys.shift()];
    try {
        fs.mkdirSync(path.dirname(PLAYS_FILE), { recursive: true });
        fs.writeFileSync(PLAYS_FILE, JSON.stringify(plays));
        playsDirty = false;
    } catch (e) {
        console.error('không ghi được số lượt chơi:', e.message);
    }
}

/* Chỉ nhận slug có thật trong danh bạ. Thiếu chỗ này thì ai gọi
   /api/play?g=<gì cũng được> cũng làm phình tệp số liệu bằng rác. */
function countPlay(slug) {
    if (!slug || !ROUTES.dirOf(slug)) return false;
    const day = today();
    plays.total[slug] = (plays.total[slug] || 0) + 1;
    if (!plays.days[day]) plays.days[day] = {};
    plays.days[day][slug] = (plays.days[day][slug] || 0) + 1;
    playsDirty = true;
    return true;
}

/* Bảng tổng cho trang chủ: tổng mọi thời và tổng bảy ngày gần nhất. */
function playStats() {
    const now = new Date();
    const week = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
        const day = plays.days[key];
        if (!day) continue;
        for (const slug in day) week[slug] = (week[slug] || 0) + day[slug];
    }
    return { total: plays.total, week: week };
}

loadPlays();
setInterval(savePlays, PLAYS_FLUSH_MS).unref();
process.on('SIGTERM', () => { savePlays(); process.exit(0); });
process.on('SIGINT', () => { savePlays(); process.exit(0); });

/* ---------- Xử lý request ---------- */
async function handle(req, res) {
    const started = Date.now();
    const parsed = url.parse(req.url);
    let pathname = parsed.pathname || '/';

    const log = (status) => {
        const color = status >= 500 ? C.red : status >= 400 ? C.yellow : C.green;
        const ms = Date.now() - started;
        console.log(`${C.gray}${new Date().toLocaleTimeString('vi-VN')}${C.reset} ` +
            `${color}${status}${C.reset} ${req.method} ${pathname} ${C.dim}(${ms}ms)${C.reset}`);
    };

    // GitHub Webhook Auto-Deploy Endpoint
    if (pathname === '/api/webhook' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                if (payload.ref === 'refs/heads/main' || !payload.ref) {
                    console.log(`${C.cyan}🚀 GitHub Push received! Auto-deploying...${C.reset}`);
                    const { exec } = require('child_process');
                    exec('git pull && pm2 restart kibu', { cwd: ROOT }, (err, stdout, stderr) => {
                        if (err) console.error(`${C.red}Auto-deploy error:${C.reset}`, err);
                        else console.log(`${C.green}Auto-deploy successful!${C.reset}\n`, stdout);
                    });
                    send(res, 200, JSON.stringify({ status: 'success', message: 'Deploy triggered' }), { 'Content-Type': 'application/json' });
                } else {
                    send(res, 200, JSON.stringify({ status: 'ignored', message: 'Not main branch' }), { 'Content-Type': 'application/json' });
                }
            } catch (e) {
                send(res, 400, 'Invalid Payload');
            }
            log(200);
        });
        return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, 'Method Not Allowed', { 'Allow': 'GET, HEAD' });
        return log(405);
    }

    // Nhịp tim của từng tab đang mở; trả về tổng số người đang chơi.
    if (pathname === '/api/online') {
        const id = new URLSearchParams(parsed.query || '').get('id');
        const body = JSON.stringify({ online: touchPresence(id) });
        send(res, 200, body, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        });
        return log(200);
    }

    /* Một lượt chơi. Gọi bằng ảnh beacon nên phải là GET; trả về 1×1 rỗng.
       Bên trình duyệt tự chặn gọi lại trong 30 phút cho cùng một game, nên bấm
       F5 mười lần vẫn tính một lượt. */
    if (pathname === '/api/play') {
        const g = new URLSearchParams(parsed.query || '').get('g');
        const ok = countPlay(g);
        send(res, 200, JSON.stringify({ ok: ok }), {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        });
        return log(200);
    }

    /* Bảng tổng lượt chơi cho trang chủ. Cho phép nằm bộ nhớ đệm 60 giây —
       con số này không cần chính xác tới từng giây, mà để no-store thì mỗi
       lượt vào trang chủ lại đánh thức máy chủ một lần vô ích. */
    if (pathname === '/api/stats') {
        send(res, 200, JSON.stringify(playStats()), {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60'
        });
        return log(200);
    }

    /* ---------- URL sạch có tiền tố ngôn ngữ ----------
       /vi/g/balloon-darts  ->  darts-game/index.html
       Game vẫn nằm nguyên thư mục cũ nên mọi asset (/darts-game/style.css…)
       không phải đổi gì. */
    /* "/" PHỤC VỤ THẲNG, KHÔNG CHUYỂN HƯỚNG.
     *
     * Lighthouse báo "avoid multiple page redirects — 601 ms", và đo ra đúng
     * một cú 302 từ "/" sang "/en". Trên mạng 4G chậm, một vòng đi về là hơn
     * nửa giây trước khi trình duyệt biết phải tải cái gì.
     *
     * Nhưng lý do đáng sửa hơn là chuyện NHẤT QUÁN: thẻ canonical trong
     * index.html vẫn khai địa chỉ chuẩn là "https://kibugames.com/", trong khi
     * máy chủ lại đẩy mọi người khỏi đúng địa chỉ ấy. Hai bên nói ngược nhau.
     * Giờ "/" trả thẳng nội dung đúng ngôn ngữ đoán được, còn /vi và /en vẫn
     * chạy như cũ cho ai đã lưu hoặc đã được Google lập chỉ mục.
     *
     * Vary: Accept-Language là bắt buộc — thiếu nó thì máy chủ trung gian có
     * thể đưa bản tiếng Việt cho người dùng tiếng Anh và ngược lại.
     */
    if (pathname === '/' || pathname === '/index.html') {
        try {
            const lang = pickLang(req);
            const html = injectSeo(
                await fsp.readFile(path.join(ROOT, 'index.html'), 'utf8'),
                { lang: lang, kind: 'home' }
            );
            send(res, 200, html, {
                'Cache-Control': 'no-cache',
                'Vary': 'Accept-Encoding, Accept-Language',
                'X-Content-Type-Options': 'nosniff'
            }, req);
            return log(200);
        } catch (e) {
            send(res, 404, NOT_FOUND_PAGE(pathname));
            return log(404);
        }
    }

    /* Trang tĩnh nào ứng với tệp nào. Thêm trang mới thì thêm một dòng ở đây
     * và một nhánh trong routes.js — hai chỗ, không hơn. */
    const PAGE_FILE = { about: 'about.html', privacy: 'privacy.html' };

    const route = ROUTES.parse(pathname);
    if (route) {
        const pagePath = route.kind === 'game'
            ? path.join(ROOT, route.dir, 'index.html')
            : path.join(ROOT, PAGE_FILE[route.kind] || 'index.html');
        try {
            /* Trang HTML dựng lại theo ngôn ngữ nên đi lối RIÊNG, không qua
             * phần phục vụ tệp tĩnh. Em thêm phần nén ở dưới ấy, đo i18n.js
             * giảm 67% rồi tưởng xong — đo tiếp mới thấy trang chủ vẫn gửi thô
             * nguyên 61 KB, vì nó chưa bao giờ chạy qua chỗ em vừa sửa.
             *
             * Bài học: sửa xong phải đo ĐÚNG THỨ vừa sửa, và đo cả những thứ
             * tưởng là đã được sửa theo. */
            const html = injectSeo(await fsp.readFile(pagePath, 'utf8'), route);
            send(res, 200, html, {
                'Cache-Control': 'no-cache',
                'X-Content-Type-Options': 'nosniff'
            }, req);
            if (req.method === 'HEAD') { /* send() đã đóng, thân rỗng là chấp nhận được */ }
        } catch (e) {
            send(res, 404, NOT_FOUND_PAGE(pathname));
            return log(404);
        }
        return log(200);
    }

    /* ---------- Đường dẫn cũ / chưa có ngôn ngữ -> chuyển hướng ---------- */
    const bare = ROUTES.legacyBare(pathname);
    if (bare) {
        const target = ROUTES.build(pickLang(req), bare) + (parsed.search || '');
        // "/" chỉ là cửa vào, kết quả phụ thuộc trình duyệt nên dùng 302;
        // các URL cũ đã được Google lập chỉ mục thì 301 để dồn về địa chỉ mới.
        const status = pathname === '/' ? 302 : 301;
        res.writeHead(status, { 'Location': target, 'Vary': 'Accept-Language' });
        res.end();
        return log(status);
    }

    let filePath = safeResolve(pathname);
    if (!filePath) {
        send(res, 403, 'Forbidden');
        return log(403);
    }

    try {
        let stat = await fsp.stat(filePath).catch(() => null);

        // Thư mục -> tìm index.html bên trong
        if (stat && stat.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            const indexStat = await fsp.stat(indexPath).catch(() => null);
            if (indexStat && indexStat.isFile()) {
                filePath = indexPath;
                stat = indexStat;
            } else {
                stat = null;
            }
        }

        // Không có phần mở rộng -> thử thêm .html  (vd: /english -> english.html)
        if (!stat && !path.extname(filePath)) {
            const htmlPath = filePath + '.html';
            const htmlStat = await fsp.stat(htmlPath).catch(() => null);
            if (htmlStat && htmlStat.isFile()) {
                filePath = htmlPath;
                stat = htmlStat;
            }
        }

        if (!stat || !stat.isFile()) {
            send(res, 404, NOT_FOUND_PAGE(pathname));
            return log(404);
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        const etag = `W/"${stat.size}-${stat.mtimeMs}"`;

        // Trình duyệt đã có bản mới nhất rồi
        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, { 'ETag': etag });
            res.end();
            return log(304);
        }

        /* ---------------------------------------------------------------
         * NÉN
         *
         * Anh Hiếu gửi báo cáo Lighthouse và em đo lại thì máy chủ đang gửi
         * MỌI thứ ở dạng thô: i18n.js một mình đã 151 KB, index.html 61 KB.
         * Với mạng 4G chậm thì riêng chỗ ấy là mấy giây.
         *
         * zlib có sẵn trong Node nên không phải thêm thư viện nào — cả web này
         * từ đầu tới giờ không có một gói npm nào và em muốn giữ nguyên như
         * vậy. Ưu tiên brotli vì nó nhỏ hơn gzip chừng 15%, trình duyệt nào
         * không hiểu thì rơi về gzip, không hiểu nữa thì gửi thô như cũ.
         *
         * Chỉ nén thứ đáng nén. Ảnh JPG/PNG/WebP đã nén sẵn rồi, nén lại chỉ
         * tốn thời gian máy chủ mà tệp còn to ra.
         * -------------------------------------------------------------*/
        const compressible = /\.(html?|js|mjs|css|json|svg|xml|txt|map)$/i.test(filePath);
        const accept = String(req.headers['accept-encoding'] || '');
        let encoding = null;
        if (compressible && stat.size > 1024) {
            if (/\bbr\b/.test(accept)) encoding = 'br';
            else if (/\bgzip\b/.test(accept)) encoding = 'gzip';
        }

        if (encoding) {
            const body = zlib[encoding === 'br' ? 'brotliCompressSync' : 'gzipSync'](
                fs.readFileSync(filePath),
                encoding === 'br'
                    /* Mức 5 chứ không phải mức 11: mức cao nhất nén nhỏ hơn
                     * chừng 4% nhưng tốn gấp mười lần thời gian máy chủ, mà
                     * máy chủ này chạy trên một máy nhỏ. */
                    ? { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }
                    : { level: 6 }
            );
            res.writeHead(200, {
                'Content-Type': type,
                'Content-Length': body.length,
                'Content-Encoding': encoding,
                'Vary': 'Accept-Encoding',
                'ETag': etag,
                'Last-Modified': stat.mtime.toUTCString(),
                'Cache-Control': 'no-cache',
                'X-Content-Type-Options': 'nosniff'
            });
            if (req.method === 'HEAD') { res.end(); return log(200); }
            res.end(body);
            return log(200);
        }

        const headers = {
            'Content-Type': type,
            'Content-Length': stat.size,
            'ETag': etag,
            'Last-Modified': stat.mtime.toUTCString(),
            /* Ảnh/âm thanh/phông chữ gần như không đổi mà lại nặng nhất trang —
               cho trình duyệt giữ hẳn 7 ngày, vào lại là hiện tức thì. Còn
               HTML/JS/CSS vẫn hỏi lại mỗi lần để các con thấy ngay bản vừa sửa. */
            'Cache-Control': /\.(png|jpe?g|gif|webp|svg|ico|mp3|wav|ogg|woff2?|ttf)$/i.test(filePath)
                ? 'public, max-age=604800'
                : 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        };

        res.writeHead(200, headers);
        if (req.method === 'HEAD') {
            res.end();
            return log(200);
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', (err) => {
            console.error(`${C.red}Lỗi đọc file:${C.reset}`, err.message);
            res.destroy();
        });
        stream.pipe(res);
        res.on('finish', () => log(200));

    } catch (err) {
        console.error(`${C.red}Lỗi server:${C.reset}`, err);
        if (!res.headersSent) send(res, 500, 'Internal Server Error');
        log(500);
    }
}

/* ---------- Khởi động (tự nhảy cổng nếu bị chiếm) ---------- */
function listen(port, triesLeft) {
    const server = http.createServer(handle);

    /* Cờ tướng hai người cần kênh hai chiều tức thời. Chỉ đường /ws/xiangqi mới
       được nâng cấp lên WebSocket, còn lại đóng luôn cho gọn. */
    server.on('upgrade', (req, socket, head) => {
        const path = (req.url || '').split('?')[0];
        if (path === '/ws/xiangqi') XIANGQI.handleUpgrade(req, socket, head);
        else socket.destroy();
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && triesLeft > 0) {
            console.log(`${C.yellow}⚠  Cổng ${port} đang bận, thử cổng ${port + 1}…${C.reset}`);
            listen(port + 1, triesLeft - 1);
        } else if (err.code === 'EACCES') {
            console.error(`${C.red}✖ Không có quyền dùng cổng ${port}. Hãy chọn cổng > 1024.${C.reset}`);
            process.exit(1);
        } else {
            console.error(`${C.red}✖ Không khởi động được server:${C.reset}`, err.message);
            process.exit(1);
        }
    });

    server.listen(port, HOST, () => banner(port));

    const shutdown = () => {
        console.log(`\n${C.magenta}👋 Đã tắt server. Hẹn gặp lại!${C.reset}`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 1500).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

function banner(port) {
    const lan = lanAddresses();
    const line = '─'.repeat(58);

    console.log(`\n${C.cyan}┌${line}┐${C.reset}`);
    console.log(`${C.cyan}│${C.reset}  ${C.bold}🎮  SÂN CHƠI GAME CHO BÉ — máy chủ đã sẵn sàng${C.reset}`);
    console.log(`${C.cyan}└${line}┘${C.reset}\n`);

    console.log(`  ${C.bold}Trên máy này:${C.reset}`);
    console.log(`    ${C.green}➜${C.reset}  http://localhost:${port}\n`);

    if (lan.length) {
        console.log(`  ${C.bold}Cho các con vào (cùng mạng Wi-Fi):${C.reset}`);
        lan.forEach(n => {
            console.log(`    ${C.green}➜${C.reset}  ${C.bold}${C.yellow}http://${n.address}:${port}${C.reset}  ${C.dim}(${n.name})${C.reset}`);
        });
        console.log('');
    } else {
        console.log(`  ${C.yellow}⚠  Chưa thấy địa chỉ mạng LAN — máy có thể đang không nối Wi-Fi.${C.reset}\n`);
    }

    console.log(`  ${C.bold}Vào thẳng từng game:${C.reset}`);
    [
        ['english', '🎓 English Quest — học tiếng Anh'],
        ['fruit', '🍓 Fruit Crush Deluxe'],
        ['shooter', '🤖 Bot Arena Blaster'],
        ['racer', '🏎️  Neon Racer Arcade'],
        ['basketball-game', '🏀 Basketball Duel — 2 bé thi đấu'],
        ['billiards-game', '🎱 Pool Masters — bi-a 8 bi 2 người'],
        ['soccer-game', '⚽ Super Striker — bóng đá mini 2-4 bé'],
        ['darts-game', '🎯 Phi Tiêu Bong Bóng — 2-4 bé thi phi tiêu'],
        ['coloring-game', '🎨 Tô Màu Thần Kỳ — 30 tranh cho bé 3-6 tuổi'],
        ['bowling-game', '🎳 Strike Party — bowling 1-4 bé, tính điểm thật'],
        ['sling-blast', '🪃 Sling Blast — kéo ná phá tháp, 12 màn vật lý'],
        ['bubble-pop', '🫧 Bubble Pop — bắn bóng nổ, 24 màn bốn thế giới']
    ].forEach(([slug, name]) => {
        console.log(`    ${C.dim}/${slug}${C.reset}${' '.repeat(Math.max(1, 10 - slug.length))}${name}`);
    });

    console.log(`\n  ${C.dim}Thư mục phục vụ: ${ROOT}${C.reset}`);
    console.log(`  ${C.dim}Nhấn Ctrl + C để dừng server.${C.reset}\n`);
}

listen(START_PORT, MAX_PORT_TRIES);
