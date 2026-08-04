/**
 * KIBU Games — máy soát danh bạ game
 * ----------------------------------------------------------------------------
 * Chạy:  node check-games.js
 *
 * VÌ SAO CẦN
 * Thông tin một game phải có mặt ở bốn chỗ: games.js (danh bạ), routes.js
 * (đường dẫn), index.html (ô gạch trang chủ) và sitemap.xml (cho Google). Thêm
 * game mà quên một chỗ thì KHÔNG CÓ GÌ HỎNG NGAY — game vẫn chơi được, chỉ là
 * Google không bao giờ thấy nó, hoặc trang chủ không có ô, hoặc bản tiếng Việt
 * trơ ra tiếng Anh. Loại lỗi im lặng ấy nằm im hàng tháng.
 *
 * Máy này soát:
 *   1. danh bạ ↔ routes.js: cùng một tập game, cùng slug
 *   2. mỗi game phải có thư mục thật, có index.html và có icon
 *   3. mỗi game phải có ĐỦ HAI dòng trong sitemap (bản vi và bản en)
 *   4. lưới ô gạch trang chủ phải khớp danh bạ (gọi make-home.js --check)
 *   5. chủ đề khai trong danh bạ phải nằm trong bảng TOPICS
 *   6. tên tiếng Việt của game phải có trong i18n.js, không thì bật cờ Việt
 *      lên vẫn thấy tên tiếng Anh
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const K = require('./games.js');
const R = require('./routes.js');

const fails = [];
const warn = [];

console.log('soát danh bạ ' + K.GAMES.length + ' game\n');

/* ---- 1. danh bạ ↔ routes ---- */
for (const g of K.GAMES) {
    const slug = R.slugOf(g.dir);
    if (!slug) fails.push(`${g.dir}: có trong danh bạ nhưng routes.js không biết`);
    else if (slug !== g.slug) fails.push(`${g.dir}: danh bạ ghi slug "${g.slug}", routes.js ghi "${slug}"`);
}
for (const r of R.GAMES) {
    if (!K.byDir(r.dir)) fails.push(`${r.dir}: có trong routes.js nhưng danh bạ chưa có`);
}

/* ---- 2. tệp thật trên đĩa ---- */
for (const g of K.GAMES) {
    const dir = path.join(ROOT, g.dir);
    if (!fs.existsSync(dir)) { fails.push(`${g.dir}: không có thư mục`); continue; }
    if (!fs.existsSync(path.join(dir, 'index.html'))) fails.push(`${g.dir}: thiếu index.html`);
    const hasIcon = ['icon.jpg', 'icon.png'].some(f => fs.existsSync(path.join(dir, f)));
    if (!hasIcon) fails.push(`${g.dir}: thiếu icon (ô gạch trang chủ sẽ trống)`);
    const hasOg = ['og-image.jpg', 'og-image.png'].some(f => fs.existsSync(path.join(dir, f)));
    if (!hasOg) warn.push(`${g.dir}: thiếu og-image — chia sẻ lên mạng xã hội sẽ không có ảnh`);
}

/* ---- 3. sitemap ---- */
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
for (const g of K.GAMES) {
    for (const lang of ['vi', 'en']) {
        const loc = `<loc>https://kibugames.com/${lang}/g/${g.slug}</loc>`;
        if (sitemap.indexOf(loc) < 0) fails.push(`${g.slug}: thiếu dòng ${lang} trong sitemap.xml`);
    }
}
/* và ngược lại: sitemap không được trỏ tới game đã gỡ */
const inMap = [...sitemap.matchAll(/<loc>https:\/\/kibugames\.com\/(?:vi|en)\/g\/([a-z0-9-]+)<\/loc>/g)]
    .map(m => m[1]);
for (const slug of new Set(inMap)) {
    if (!K.bySlug(slug)) fails.push(`sitemap.xml trỏ tới "${slug}" nhưng danh bạ không có game ấy`);
}

/* ---- 4. lưới ô gạch trang chủ ---- */
try {
    execFileSync(process.execPath, [path.join(ROOT, 'make-home.js'), '--check'], { stdio: 'pipe' });
} catch (e) {
    fails.push('lưới ô gạch trong index.html không khớp danh bạ — chạy "node make-home.js"');
}

/* ---- 5. chủ đề ---- */
const topicKeys = K.TOPICS.map(t => t.key);
for (const g of K.GAMES) {
    if (!g.topics || !g.topics.length) fails.push(`${g.slug}: chưa xếp chủ đề nào`);
    for (const t of g.topics || []) {
        if (topicKeys.indexOf(t) < 0) fails.push(`${g.slug}: chủ đề lạ "${t}"`);
    }
    if ((g.topics || []).length > 3) warn.push(`${g.slug}: xếp tới ${g.topics.length} chủ đề, nhiều quá thì lọc mất tác dụng`);
}
/* chủ đề rỗng thì cái nút lọc ấy bấm vào chẳng ra gì */
for (const t of K.TOPICS) {
    const n = K.inTopic(t.key).length;
    if (n === 0) fails.push(`chủ đề "${t.vi}" không có game nào — nút lọc ấy bấm vào ra trang trống`);
    else if (n === 1) warn.push(`chủ đề "${t.vi}" mới có 1 game`);
}

/* ---- 6. tên tiếng Việt có trong i18n chưa ---- */
const i18n = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
for (const g of K.GAMES) {
    if (g.vi === g.en) continue;                     // tên giữ nguyên hai thứ tiếng
    const pair = `'${g.vi}', '${g.en}'`;
    if (i18n.indexOf(pair) < 0) {
        warn.push(`${g.slug}: chưa có cặp dịch [${g.vi} ⇄ ${g.en}] trong i18n.js`);
    }
}

/* ---- 7. kênh liên hệ phải có mặt ở MỌI trang ----
 * Hai cái nút liên hệ nằm ở chân trang, mà chân trang thì chép tay trên 27
 * tệp. Thêm game mới bằng cách chép một trang cũ thì có, nhưng chép nhầm bản
 * chưa có nút thì mất — và mất im lặng, chẳng ai để ý chân trang thiếu gì. */
const pages = K.GAMES.map(g => path.join(g.dir, 'index.html'))
    .concat(['index.html', 'about.html']);
for (const f of pages) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    const miss = [
        ['facebook.com/kibugames.official', 'Facebook'],
        ['t.me/coolkitty007', 'Telegram'],
        ['wa.me/', 'WhatsApp']
    ].filter(([needle]) => html.indexOf(needle) < 0).map(([, name]) => name);
    if (miss.length) fails.push(`${f}: chân trang thiếu kênh liên hệ (${miss.join(', ')})`);
}

/* ---- kết quả ---- */
const byTopic = K.TOPICS.map(t => `${t.vi} ${K.inTopic(t.key).length}`).join(' · ');
console.log('  chủ đề: ' + byTopic);
console.log('  nhãn MỚI: ' + K.GAMES.filter(g => K.isNew(g.slug)).map(g => g.slug).join(', '));
console.log('');

if (warn.length) {
    console.log('nhắc nhở (không chặn):');
    warn.forEach(w => console.log('  · ' + w));
    console.log('');
}
if (fails.length) {
    console.log('KHÔNG ĐẠT:');
    fails.forEach(f => console.log('  · ' + f));
    process.exit(1);
}
console.log('ĐẠT — danh bạ, routes, tệp trên đĩa, sitemap và trang chủ khớp nhau cả.');
