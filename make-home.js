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
    const prio = g.eager ? 'fetchpriority="high"' : 'loading="lazy"';

    /* PHẢI HỎI ĐĨA XEM TỆP CÓ THẬT KHÔNG, không được đoán theo tên.
     *
     * Anh Hiếu báo mất hẳn ảnh của game tictactoe. Nguyên do là em: game ấy chỉ
     * có icon.png, không có icon.jpg, và bản trước em cứ thế viết cứng cả
     * icon.webp lẫn icon.jpg vào thẻ.
     *
     * Chỗ chết người nằm ở <picture>: khi trình duyệt đã CHỌN một <source> mà
     * tệp ấy 404 thì nó KHÔNG rơi về <img> nữa. Cái onerror trên <img> — thứ
     * xưa nay vẫn đỡ cho trường hợp png — không bao giờ được gọi. Ô gạch trống
     * trơn mà không có lỗi nào trên bảng điều khiển.
     *
     * Nên giờ hỏi thẳng đĩa: có webp thì mới thêm <source>, và <img> trỏ đúng
     * đuôi tệp đang có. */
    const dir = path.join(__dirname, g.dir);
    const hasWebp = fs.existsSync(path.join(dir, 'icon.webp'));
    const base = fs.existsSync(path.join(dir, 'icon.jpg')) ? 'icon.jpg'
        : fs.existsSync(path.join(dir, 'icon.png')) ? 'icon.png' : null;
    if (!base) throw new Error(`${g.dir}: không có icon.jpg lẫn icon.png`);

    /* HAI CỠ ẢNH, để trình duyệt TỰ CHỌN cái vừa đủ nét.
     *
     * Anh Hiếu: "ảnh game icon nào hiển thị ở grid 2x2 thì đang bị mờ do em mới
     * tối ưu... đó là bộ mặt của game mà".
     *
     * Đo ra đúng: hai ô "HOT" hiện ở 398px, tức là cần 796px trên màn nét đôi,
     * mà em lại thu mọi ảnh xuống còn 400px. Hai mươi lăm ô nhỏ thì 400px vừa
     * đủ, riêng hai ô to thì mờ hẳn — và em đã đo tổng dung lượng mà không đo
     * TỪNG CỠ Ô.
     *
     * Chữa bằng srcset kèm khổ thật (400w và 800w) và sizes khai đúng bề rộng
     * ô ấy chiếm trên màn. Trình duyệt nhân với độ nét màn hình rồi tự lấy tệp
     * nhỏ nhất còn đủ nét: ô nhỏ vẫn lấy bản 400, chỉ ô to mới kéo bản 800.
     * Không phải chọn giữa "nét" và "nhẹ" nữa — được cả hai. */
    const big = /tile-hot/.test(g.tile || '');
    const sizes = big ? '(max-width: 560px) 88vw, 400px' : '(max-width: 560px) 44vw, 200px';
    /* BA BẬC: 400 · 600 · 800.
     *
     * Hai bậc thôi thì màn 3× — tức là phần lớn điện thoại — rơi vào cảnh khó
     * xử: ô nhỏ 164px cần 492px, bản 400 thì thiếu mà bản 800 thì thừa gấp đôi
     * số byte. Thêm bậc 600 vào giữa là máy nào cũng lấy đúng cái vừa đủ.
     * Tệp nằm trên đĩa thì không tốn gì; chỉ băng thông mới tốn, mà băng thông
     * thì trình duyệt tự chọn tiết kiệm nhất.
     *
     * Riêng hai ô HOT còn thêm bậc 1024: chúng hiện ở 398px, mà 398 × 3 là
     * 1193 — bậc 800 vẫn thiếu. Đo mới biết, chứ nhìn thì không ai thấy.
     *
     * Bậc nào KHÔNG CÓ TỆP thì bỏ qua, và tệp chỉ tạo khi ảnh gốc thật sự đủ
     * lớn. Ảnh gốc của basketball-game chỉ 768px nên nó dừng ở bậc 800 — làm
     * thêm bậc 1024 cho nó chỉ là phóng to một tấm ảnh không còn chi tiết,
     * tốn byte mà không thêm được một nét nào, lại còn khai gian với trình
     * duyệt là mình có 1024px. */
    const widths = [400, 600, 800, 1024];
    const jpgList = widths
        .map(px => ({ px, f: px === 400 ? base : base.replace('.', `-${px}.`) }))
        .filter(v => fs.existsSync(path.join(dir, v.f)))
        .map(v => `/${g.dir}/${v.f} ${v.px}w`);
    const webpList = widths
        .map(px => ({ px, f: px === 400 ? 'icon.webp' : `icon-${px}.webp` }))
        .filter(v => fs.existsSync(path.join(dir, v.f)))
        .map(v => `/${g.dir}/${v.f} ${v.px}w`);

    const jpgSet = jpgList.length > 1 ? ` srcset="${jpgList.join(', ')}" sizes="${sizes}"` : '';
    const webpSet = webpList.length > 1
        ? `srcset="${webpList.join(', ')}" sizes="${sizes}"`
        : `srcset="/${g.dir}/icon.webp"`;

    const src = `                <img src="/${g.dir}/${base}"${jpgSet} alt="" class="tile-img" width="400" height="400"
                         ${prio} decoding="async">`;
    const img = hasWebp
        ? `<picture>
                    <source ${webpSet} type="image/webp">
                ${src}
                </picture>`
        : src.trim();

    return `            <a href="/g/${g.slug}" class="poki-tile ${g.tile}"
                data-topics="${g.topics.join(' ')}"
                data-keywords="${esc(kw)}">${badge}
                ${img}
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
