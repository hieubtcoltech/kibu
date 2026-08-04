/**
 * KIBU Games — sinh lại lưới ô gạch trang chủ từ danh bạ
 * ----------------------------------------------------------------------------
 * Chạy:  node make-home.js          (sinh lại và ghi đè vào index.html)
 *        node make-home.js --check  (chỉ soát xem đang khớp không, không ghi)
 *
 * VÌ SAO SINH RA CHỨ KHÔNG CHÉP TAY
 * Hai mươi lăm ô gạch, mỗi ô một khối HTML gần giống nhau, chép tay từ đầu.
 * Hậu quả nhìn thấy được: có lúc TÁM ô cùng đeo nhãn MỚI, trong đó vài game đã
 * làm từ hơn nửa tháng trước — vì nhãn gắn tay, gắn xong không ai gỡ. Nay nhãn
 * suy từ ngày lên sóng trong games.js, ba game mới nhất mới có.
 *
 * VÌ SAO KHÔNG DỰNG Ô GẠCH BẰNG JAVASCRIPT LÚC CHẠY
 * Vì trang chủ cần Google đọc được. Dựng bằng JavaScript thì mã nguồn trang chỉ
 * còn một cái lưới rỗng, hai mươi lăm cái tên game biến mất khỏi HTML. Nên
 * lưới vẫn là HTML tĩnh, chỉ là do máy này viết ra chứ không do tay.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const K = require('./games.js');

const FILE = path.join(__dirname, 'index.html');
const START = '<div class="poki-grid" id="cardsGrid">';
const END = '            <!-- No Results Container -->';

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function tileHtml(g) {
    const badge = K.isNew(g.slug)
        ? '\n                <span class="tile-badge badge-new">NEW</span>'
        : '';
    /* data-topics là thứ hàng nút lọc chủ đề đọc; data-keywords là ô tìm kiếm.
     * Cho luôn tên tiếng Việt vào từ khoá để bé gõ "co tuong" cũng ra. */
    const kw = (g.keywords + ' ' + g.vi.toLowerCase() + ' ' + g.en.toLowerCase()).trim();
    /* ẢNH Ô GẠCH — chỗ nặng nhất của trang chủ, và cũng là chỗ dễ sửa nhất.
     *
     * Anh Hiếu gửi báo cáo Lighthouse: LCP 14,2 giây trên mạng 4G chậm. Đo ra
     * thì 26 ảnh ô gạch cộng lại 3,5 MB — nhiều tệp còn để nguyên 1024×1024
     * trong khi ô gạch chỉ hiện ở 164–189px. Và cả 26 cái đều mang
     * fetchpriority="high" mà không cái nào lazy, nên trình duyệt tải hết 3,5
     * MB trước khi vẽ xong màn hình đầu.
     *
     * Ba việc:
     *   · thu ảnh về 400px (gấp đôi cỡ hiện lớn nhất, đủ cho màn nét đôi)
     *   · thêm bản WebP, trình duyệt nào hiểu thì lấy, không thì rơi về JPG
     *   · chỉ SÁU ô đầu ưu tiên cao, còn lại lazy — bé cuộn tới đâu tải tới đó
     *
     * width/height khai sẵn để trình duyệt chừa đúng chỗ, khỏi giật bố cục.
     */
    const eager = g.eager;
    const prio = eager
        ? 'fetchpriority="high"'
        : 'loading="lazy"';
    return `            <a href="/g/${g.slug}" class="poki-tile ${g.tile}"
                data-topics="${g.topics.join(' ')}"
                data-keywords="${esc(kw)}">${badge}
                <picture>
                    <source srcset="/${g.dir}/icon.webp" type="image/webp">
                    <img src="/${g.dir}/icon.jpg" alt="" class="tile-img" width="400" height="400"
                         ${prio} decoding="async"
                         onerror="if(this.dataset.png){this.remove()}else{this.dataset.png=1;this.src=this.src.replace('.jpg','.png')}">
                </picture>
                <div class="tile-label">${esc(g.en)}</div>
            </a>`;
}

function chipsHtml() {
    const all = '<button type="button" class="topic-chip is-on" data-topic="">All games</button>';   /* /i18n.js dịch chữ này */
    const rest = K.TOPICS.map(t =>
        `<button type="button" class="topic-chip" data-topic="${t.key}"><i class="fa-solid ${t.icon}"></i> ${esc(t.en)}</button>`
    ).join('\n            ');
    return '            ' + all + '\n            ' + rest;
}

function build(src) {
    const i = src.indexOf(START);
    const j = src.indexOf(END, i);
    if (i < 0 || j < 0) throw new Error('không tìm thấy mốc lưới ô gạch trong index.html');

    const grid = START + '\n\n' + K.GAMES.map((g, i) => tileHtml(Object.assign({}, g, { eager: i < 6 }))).join('\n\n') + '\n\n';
    let out = src.slice(0, i) + grid + src.slice(j);

    /* Hàng nút lọc chủ đề nằm ngay trên lưới */
    const cs = '<div class="topic-row" id="topicRow">';
    const ce = '\n\n        <div class="poki-grid"';
    const ci = out.indexOf(cs), cj = out.indexOf(ce, ci);
    if (ci >= 0 && cj >= 0) {
        out = out.slice(0, ci) + cs + '\n' + chipsHtml() + '\n        </div>' + out.slice(cj);
    }
    return out;
}

const src = fs.readFileSync(FILE, 'utf8');
const out = build(src);

if (process.argv.includes('--check')) {
    if (out !== src) {
        console.log('KHÔNG ĐẠT — lưới ô gạch trong index.html không khớp games.js.');
        console.log('           chạy "node make-home.js" để sinh lại.');
        process.exit(1);
    }
    console.log('ĐẠT — lưới ô gạch khớp danh bạ (' + K.GAMES.length + ' game).');
} else {
    fs.writeFileSync(FILE, out);
    console.log('đã sinh lại ' + K.GAMES.length + ' ô gạch và ' + (K.TOPICS.length + 1) + ' nút lọc chủ đề.');
}
