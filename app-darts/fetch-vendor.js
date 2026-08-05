/* ============================================================================
 * Tải các tệp mà bản web đang lấy từ CDN về máy — CHẠY MỘT LẦN.
 * ----------------------------------------------------------------------------
 * App trên App Store phải chơi được khi không có mạng: Apple mở app trong phòng
 * duyệt, thấy chữ nhảy phông hay thiếu icon là trượt ngay. Nên toàn bộ phông
 * chữ, bộ icon và lá cờ đều nằm trong gói cài đặt.
 *
 *     node fetch-vendor.js
 *
 * Kết quả nằm ở vendor/ và được commit cùng repo, để lần dựng sau không cần
 * mạng nữa.
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const VENDOR = path.join(__dirname, 'vendor');

/* Trình duyệt cũ được Google Fonts trả về woff/ttf; khai một UA Chrome mới để
   nhận đúng woff2 (nhẹ hơn một nửa). */
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function mkdir(p) { fs.mkdirSync(p, { recursive: true }); }

async function get(url, headers) {
    const res = await fetch(url, { headers: headers || {} });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
    return res;
}

async function getText(url) { return (await get(url, { 'User-Agent': UA })).text(); }

async function download(url, dest) {
    const res = await get(url, { 'User-Agent': UA });
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log('  ✓', path.relative(__dirname, dest),
        '(' + Math.round(fs.statSync(dest).size / 1024) + ' KB)');
}

/* ---------------------------------------------------------------- fonts ---
 * Giữ đủ cả ba bộ ký tự: vietnamese cho dấu tiếng Việt, latin-ext và latin.
 * Bỏ bộ vietnamese là chữ có dấu rơi về phông hệ thống, nhìn lệch hẳn. */
const KEEP_SUBSETS = ['vietnamese', 'latin-ext', 'latin'];

async function fonts() {
    const url = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500..800' +
        '&family=Nunito:wght@400;600;700;800&display=swap';
    const css = await getText(url);
    const dir = path.join(VENDOR, 'fonts');
    mkdir(dir);

    /* CSS của Google chia thành từng khối "/* vietnamese *\/ @font-face{…}".
       Đọc tên bộ ký tự ở dòng chú thích ngay trước mỗi khối để biết giữ hay bỏ. */
    const blocks = css.split(/\/\*\s*([a-z0-9-]+)\s*\*\//i).slice(1);
    let out = '';
    const jobs = [];
    for (let i = 0; i < blocks.length; i += 2) {
        const subset = blocks[i];
        const body = blocks[i + 1];
        if (!KEEP_SUBSETS.includes(subset)) continue;
        const rewritten = body.replace(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g, (m, u) => {
            const name = u.split('/').slice(-2).join('-').replace(/[^\w.-]/g, '_');
            jobs.push([u, path.join(dir, name)]);
            return `url(./${name})`;
        });
        out += `/* ${subset} */${rewritten}`;
    }
    fs.writeFileSync(path.join(dir, 'fonts.css'), out);
    for (const [u, dest] of jobs) if (!fs.existsSync(dest)) await download(u, dest);
    console.log('  ✓ vendor/fonts/fonts.css');
}

/* ---------------------------------------------------------- font awesome ---
 * Lấy qua npm chứ không qua CDN: bản trên npm có giấy phép đi kèm, cần cho hồ
 * sơ nộp app. Chỉ giữ nhóm "solid" — game không dùng icon thương hiệu nào sau
 * khi bỏ các nút mạng xã hội. */
function fontAwesome() {
    const dir = path.join(VENDOR, 'fontawesome');
    /* Giữ nguyên bố cục css/ + webfonts/ của gói gốc: trong solid.min.css đường
       dẫn phông là ../webfonts/…, dẹp thư mục css đi là hỏng liên kết. */
    mkdir(path.join(dir, 'webfonts'));
    mkdir(path.join(dir, 'css'));
    const src = path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free');
    if (!fs.existsSync(src)) {
        execFileSync('npm', ['i', '--no-save', '@fortawesome/fontawesome-free@6'],
            { cwd: __dirname, stdio: 'inherit' });
    }
    for (const f of ['css/fontawesome.min.css', 'css/solid.min.css']) {
        fs.copyFileSync(path.join(src, f), path.join(dir, f));
        console.log('  ✓ vendor/fontawesome/' + f);
    }
    fs.copyFileSync(path.join(src, 'webfonts/fa-solid-900.woff2'),
        path.join(dir, 'webfonts/fa-solid-900.woff2'));
    fs.copyFileSync(path.join(src, 'LICENSE.txt'), path.join(dir, 'LICENSE.txt'));
    console.log('  ✓ vendor/fontawesome/webfonts/fa-solid-900.woff2');
}

/* ---------------------------------------------------------------- flags ---
 * Nút đổi ngôn ngữ ở i18n.js trỏ thẳng vào flagcdn.com; bản app thay bằng hai
 * tệp này (build-www.js sửa đường dẫn khi chép). */
async function flags() {
    const dir = path.join(VENDOR, 'flags');
    mkdir(dir);
    for (const code of ['vn', 'gb']) {
        const dest = path.join(dir, code + '.png');
        if (!fs.existsSync(dest)) await download(`https://flagcdn.com/w40/${code}.png`, dest);
    }
}

(async () => {
    mkdir(VENDOR);
    console.log('Phông chữ Google…'); await fonts();
    console.log('Font Awesome…'); fontAwesome();
    console.log('Lá cờ…'); await flags();
    console.log('\nXong. vendor/ đã đủ, lần dựng sau không cần mạng.');
})().catch(e => { console.error('\n✗', e.message); process.exit(1); });
