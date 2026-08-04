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
    return `            <a href="/g/${g.slug}" class="poki-tile ${g.tile}"
                data-topics="${g.topics.join(' ')}"
                data-keywords="${esc(kw)}">${badge}
                <img src="/${g.dir}/icon.jpg" alt="" class="tile-img" fetchpriority="high" decoding="async"
                     onerror="if(this.dataset.png){this.remove()}else{this.dataset.png=1;this.src=this.src.replace('.jpg','.png')}">
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

    const grid = START + '\n\n' + K.GAMES.map(tileHtml).join('\n\n') + '\n\n';
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
