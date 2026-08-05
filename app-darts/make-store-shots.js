/* ============================================================================
 * Dựng bộ ảnh QUẢNG BÁ cho App Store từ ảnh chụp thô
 * ----------------------------------------------------------------------------
 *     npm run store-shots            (chạy sau `npm run shots`)
 *
 * `make-shots.js` chụp ảnh THÔ: đúng cái màn hình máy, không hơn. Thả thẳng
 * lên store thì đúng luật nhưng trông như ảnh chụp màn hình gửi cho nhau —
 * người lướt qua không đọc ra app này chơi cái gì.
 *
 * Script này bọc mỗi ảnh thô thành một tấm quảng bá, đúng lối các app lớn vẫn
 * làm: NỀN MÀU + KHUNG MÁY THẬT + MỘT CÂU nói rõ tính năng.
 *
 *     ┌──────────────────────────┐
 *     │   NGOÀI VŨ TRỤ           │  ← tiêu đề, cỡ lớn
 *     │   Ít trọng lực, tiêu bay │  ← một dòng phụ
 *     │   thẳng hơn              │
 *     │      ╭────────────╮      │
 *     │      │            │      │  ← khung máy vẽ bằng CSS: viền bo,
 *     │      │  ảnh chụp  │      │    đảo động, gờ sáng, bóng đổ
 *     │      │            │      │
 *     │      ╰────────────╯      │
 *     └──────────────────────────┘
 *
 * Vì sao dựng bằng TRÌNH DUYỆT chứ không phải ImageMagick: chữ. Tấm ảnh quảng
 * bá sống chết ở chỗ đặt chữ — giãn dòng, giãn chữ, tự xuống dòng, đổ bóng.
 * Làm mấy việc ấy bằng dòng lệnh ImageMagick thì mỗi lần chỉnh một ly là dò
 * lại toạ độ bằng tay. CSS lo hết, và Chrome đã có sẵn trên máy này rồi.
 *
 * Trang dựng ra là TỰ CHỨA: phông chữ và ảnh chụp đều nhúng thẳng vào dạng
 * base64. Không cần máy chủ web, không gọi ra mạng — chạy được cả lúc mất mạng,
 * và không có cách nào lọt một tấm ảnh thiếu phông lên store.
 *
 * Ra hai bộ, mỗi thứ tiếng một bộ, vì App Store Connect cho gắn ảnh riêng theo
 * ngôn ngữ:
 *     screenshots/store-en/<cỡ máy>/…
 *     screenshots/store-vi/<cỡ máy>/…
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.join(__dirname, 'screenshots');
const FONTS = path.join(__dirname, 'vendor', 'fonts');
const TMP = path.join(__dirname, 'build', 'store-tmp');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* ---------------------------------------------------------------- lời ------
 * Mỗi cảnh một câu, và câu ấy phải nói TÍNH NĂNG chứ không tả lại cái ảnh.
 * "Hai bé so tài" nói được một điều mới; "Màn hình chơi game" thì không.
 *
 * Giữ tiêu đề ngắn: trên ô ảnh bé xíu ở App Store, quá bốn năm chữ là không ai
 * đọc hết trước khi vuốt qua.
 */
const WORDS = {
    '0-menu': {
        en: ['1 to 4 kids, one screen', 'Pick the players, the arena and the game mode'],
        vi: ['1 đến 4 bé, một màn hình', 'Chọn số bé, chọn sân chơi, chọn chế độ']
    },
    '1-duel': {
        en: ['Two kids, head to head', 'Same screen, same 90 seconds, one winner'],
        vi: ['Hai bé so tài', 'Chung màn hình, chung 90 giây, một người thắng']
    },
    '2-fourkids': {
        en: ['Four can play at once', 'Everyone gets their own lane and their own key'],
        vi: ['Bốn bé chơi cùng lúc', 'Mỗi bé một khoảnh sân và một phím riêng']
    },
    '3-beach': {
        en: ['Windy beach', 'Learn to aim into the breeze — and mind the gulls'],
        vi: ['Bãi biển lộng gió', 'Tập ngắm lệch theo gió — và coi chừng đàn hải âu']
    },
    '4-space': {
        en: ['Outer space, low gravity', 'Darts fly straighter here. Never hit the astronaut.'],
        vi: ['Ngoài vũ trụ, ít trọng lực', 'Mũi tiêu bay thẳng hơn. Đừng ném trúng phi hành gia.']
    },
    '5-solo': {
        en: ['Play solo, beat your record', 'No pressure, no timer to share, just practice'],
        vi: ['Chơi một mình, phá kỷ lục', 'Không ai giục, không phải chia lượt, cứ thế mà tập']
    },
    '6-golden': {
        en: ['Hunt the golden balloons', 'Small, fast and worth five times a plain one'],
        vi: ['Săn bóng vàng', 'Bé, bay nhanh, và đáng gấp năm quả bóng thường']
    },
    '7-ketqua': {
        en: ['See who threw best', 'Darts on target, longest streak, golden balloons'],
        vi: ['Xem ai ném giỏi nhất', 'Số mũi trúng, chuỗi dài nhất, bóng vàng ăn được']
    }
};

/* Nền mỗi tấm lấy theo đúng cảnh trong ảnh: tấm bãi biển nền xanh nước, tấm vũ
   trụ nền tím than. Nền chọi màu với ảnh thì tấm hình gãy làm đôi, mắt thấy
   ngay là đồ ghép. */
const SKINS = {
    '0-menu': ['#241640', '#0b0d1c', '#b06bff'],
    '1-duel': ['#3a1330', '#0d0a18', '#ff7ad9'],
    '2-fourkids': ['#132a4a', '#080d1a', '#4dabff'],
    '3-beach': ['#0b3d52', '#04141f', '#3fb9c4'],
    '4-space': ['#1b1547', '#05060f', '#7c6bff'],
    '5-solo': ['#3d2410', '#150c05', '#ff9f1a'],
    '6-golden': ['#43350c', '#161004', '#ffc93b'],
    '7-ketqua': ['#132b1c', '#060f0a', '#5ee06a']
};

const b64 = f => fs.readFileSync(f).toString('base64');

/* Phông nhúng thẳng vào trang. Chỉ lấy đúng hai tệp cần: Baloo 2 cho tiêu đề,
   Nunito cho dòng phụ — nhúng cả thư mục thì trang phình lên vô ích. */
function fontCss() {
    const css = fs.readFileSync(path.join(FONTS, 'fonts.css'), 'utf8');
    const pick = family => {
        const re = new RegExp("font-family: '" + family + "'[\\s\\S]*?src: url\\(\\./([^)]+)\\)", 'g');
        const files = [];
        let m;
        while ((m = re.exec(css))) files.push(m[1]);
        if (!files.length) throw new Error('Không thấy phông ' + family + ' trong vendor/fonts/fonts.css');
        /* Tệp ĐẦU trong nhóm là bộ chữ Latin cơ bản; mấy tệp sau là dấu tiếng
           Việt và ký tự mở rộng. Nhúng hết để chữ "Ngoài vũ trụ" không rơi mất
           dấu — mất dấu thì tấm ảnh lên store thành sai chính tả. */
        return files.map(f => "@font-face{font-family:'" + family + "';font-weight:400 800;font-display:block;" +
            "src:url(data:font/woff2;base64," + b64(path.join(FONTS, f)) + ") format('woff2')}").join('\n');
    };
    return pick('Baloo 2') + '\n' + pick('Nunito');
}

/* ------------------------------------------------------------- một tấm ---- */
function page(shot, W, H, lang, fonts) {
    const w = WORDS[shot.name] || { en: ['Balloon Darts', ''], vi: ['Phi Tiêu Bóng Bay', ''] };
    const [title, sub] = w[lang];
    const [c1, c2, glow] = SKINS[shot.name] || SKINS['1-duel'];

    /* Ảnh ngang quá thì xếp chữ BÊN TRÁI, máy bên phải. Xếp dọc trên tấm
       2868×1320 thì khung máy chỉ còn cao bằng một dải băng — nhìn không ra
       cái điện thoại nữa. */
    const side = W / H > 1.6;
    /* Mọi số đo tính theo CẠNH NGẮN, không theo bề ngang. Lấy theo bề ngang thì
       cùng một công thức ra chữ to tướng ở bản nằm ngang và chữ tí xíu ở bản
       dựng đứng. */
    const u = Math.min(W, H) / 100;
    const pad = shot.pad;

    /* ---- CỠ KHUNG MÁY TÍNH BẰNG SỐ, KHÔNG PHÓ MẶC CHO FLEX ----
     *
     * Bản đầu em để CSS tự co: .phone nhận chiều cao 88% rồi kèm aspect-ratio.
     * Kết quả là cái điện thoại rộng quá chỗ còn lại và bị CẮT MẤT NỬA BÊN
     * PHẢI ở bản nằm ngang, còn bản dựng đứng thì thò hẳn ra khỏi mép dưới.
     * Flex co theo một chiều, mà ở đây phải vừa CẢ HAI chiều cùng lúc.
     *
     * Biết đủ số đo rồi thì tính thẳng ra: chừa chỗ cho chữ, phần còn lại đem
     * lồng khung máy vào sao cho vừa cả bề ngang lẫn bề cao, lấy cạnh nào chật
     * hơn làm chuẩn. */
    const bezel = pad.bezel * u;
    const padX = (side ? 5 : 6) * u;
    const padY = (side ? 6 : 7) * u;
    const gap = (side ? 4 : 5) * u;
    /* Chỗ dành cho chữ, tính theo chiều cao tấm ảnh chứ không theo u: lấy theo
       u thì trên tấm iPad vuông vắn nó ngốn mất một phần ba khung. */
    const wordsBox = side ? 0 : Math.round(H * 0.21);
    const wordsW = side ? Math.round(W * 0.36) : W - 2 * padX;
    const aspect = shot.w / shot.h;

    let screenW, screenH;
    if (side) {
        const availW = W - 2 * padX - wordsW - gap;
        const availH = H - 2 * padY;
        screenW = Math.min(availW - 2 * bezel, (availH - 2 * bezel) * aspect);
    } else {
        /* CHO KHUNG MÁY TRÀN XUỐNG MÉP DƯỚI.
         *
         * Bản trước em ép cả cái máy phải nằm gọn trong phần còn lại sau khi
         * chừa chỗ chữ. Trên tấm iPad thì tấm ảnh và khung ảnh cùng tỉ lệ 4:3,
         * nên hễ chừa chỗ cho chữ là cái máy phải co lại theo CẢ HAI chiều —
         * ra một cái iPad tí xíu nằm giữa một vùng trống mênh mông.
         *
         * Cách các app lớn vẫn làm: để máy rộng gần hết khung rồi cho phần
         * dưới chạy ra ngoài mép. Mắt tự hiểu là cái máy còn dài xuống nữa,
         * mà phần đáng xem thì to hẳn lên.
         *
         * Vẫn chặn một mức: phải thấy được ít nhất 62% chiều cao máy, dưới nữa
         * thì thành ra cắt cụt chứ không còn là tràn. */
        const availW = W - 2 * padX;
        const visibleH = H - padY - wordsBox - gap;
        screenW = availW - 2 * bezel;
        let outerH0 = screenW / aspect + 2 * bezel;
        if (visibleH / outerH0 < 0.62) outerH0 = visibleH / 0.62;
        screenW = Math.min(screenW, (outerH0 - 2 * bezel) * aspect);
    }
    screenW = Math.round(screenW);
    screenH = Math.round(screenW / aspect);
    const outerW = Math.round(screenW + 2 * bezel), outerH = Math.round(screenH + 2 * bezel);

    return `<!doctype html><meta charset="utf-8"><style>
${fonts}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body {
    background:
        radial-gradient(120% 80% at 50% 0%, ${glow}44 0%, transparent 62%),
        linear-gradient(168deg, ${c1} 0%, ${c2} 74%);
    display: flex;
    flex-direction: ${side ? 'row' : 'column'};
    align-items: center;
    justify-content: ${side ? 'center' : 'flex-start'};
    padding: ${padY}px ${padX}px;
    gap: ${gap}px;
    font-family: 'Nunito', sans-serif;
    -webkit-font-smoothing: antialiased;
}
/* Vệt sáng chéo rất mờ, chỉ để mặt nền không bẹt thành một mảng màu chết */
body::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(112deg, transparent 38%, rgba(255,255,255,0.05) 50%, transparent 62%);
    pointer-events: none;
}
.words {
    position: relative;
    text-align: ${side ? 'left' : 'center'};
    width: ${wordsW}px;
    ${side ? '' : `height: ${wordsBox}px; display: flex; flex-direction: column; justify-content: center;`}
    flex: 0 0 auto;
}
h1 {
    font-family: 'Baloo 2', sans-serif;
    font-weight: 800;
    font-size: ${(side ? 7.4 : 8.2) * u}px;
    line-height: 1.08;
    letter-spacing: -0.015em;
    color: #fff;
    text-shadow: 0 ${0.5 * u}px ${2 * u}px rgba(0,0,0,0.45);
    text-wrap: balance;
}
p {
    margin-top: ${2.2 * u}px;
    font-size: ${(side ? 3.3 : 3.5) * u}px;
    font-weight: 600;
    line-height: 1.42;
    color: rgba(255,255,255,0.76);
    text-wrap: balance;
    ${side ? '' : `max-width: ${74 * u}px; margin-left: auto; margin-right: auto;`}
}
/* Gạch nhấn dưới tiêu đề, lấy đúng màu điểm nhấn của cảnh */
.rule {
    width: ${9 * u}px; height: ${0.75 * u}px;
    margin: ${2.6 * u}px ${side ? '0' : 'auto'} 0;
    border-radius: ${u}px;
    background: ${glow};
    box-shadow: 0 0 ${2 * u}px ${glow}aa;
}
/* --- KHUNG MÁY ---
   Vẽ bằng CSS chứ không dán ảnh khung có sẵn: khỏi phải kéo tệp ở đâu về, và
   quan trọng hơn là khỏi dính giấy phép của ảnh khung người khác vẽ. */
.phone {
    position: relative;
    flex: 0 0 auto;
    width: ${outerW}px;
    height: ${outerH}px;
    padding: ${bezel}px;
    border-radius: ${pad.radius * u}px;
    background: linear-gradient(150deg, #3a3d4a 0%, #0a0b10 26%, #0a0b10 74%, #2e313c 100%);
    box-shadow:
        0 ${3 * u}px ${9 * u}px rgba(0,0,0,0.55),
        0 ${0.9 * u}px ${2 * u}px rgba(0,0,0,0.4),
        inset 0 0 0 ${0.22 * u}px rgba(255,255,255,0.16);
    display: flex;
}
.screen {
    position: relative;
    flex: 1;
    border-radius: ${(pad.radius - pad.bezel * 0.72) * u}px;
    overflow: hidden;
    background: #070914;
}
/* fill chứ KHÔNG cover. Khung màn hình đã cắt đúng tỉ lệ tấm ảnh rồi nên hai
   bên khớp nhau, mà cover thì hễ lệch một pixel là nó phóng to lên và XÉN mất
   mép — bản đầu mất cả logo kibu với thẻ điểm hai bên. */
.screen img { display: block; width: 100%; height: 100%; object-fit: fill; }
/* Đảo động. Chỉ vẽ ở khung điện thoại — iPad không có, vẽ vào là sai máy.
   Máy cầm ngang thì đảo động nằm ở CẠNH TRÁI và dựng đứng, không phải trên
   đỉnh: nó gắn cứng vào thân máy, máy xoay thì nó xoay theo. Vẽ trên đỉnh ở
   ảnh nằm ngang là ai cầm iPhone cũng thấy sai. */
.island {
    position: absolute;
    background: #000;
    ${aspect > 1
            ? `left: ${pad.islandTop * u}px; top: 50%; transform: translateY(-50%);
       width: ${pad.islandH * u}px; height: ${pad.islandW * u}px;
       border-radius: ${pad.islandH * u}px;`
            : `top: ${pad.islandTop * u}px; left: 50%; transform: translateX(-50%);
       width: ${pad.islandW * u}px; height: ${pad.islandH * u}px;
       border-radius: ${pad.islandH * u}px;`}
}
/* Gờ sáng hắt chéo trên mặt kính, cho ra tấm KÍNH chứ không phải tờ giấy dán */
.glare {
    position: absolute; inset: 0;
    background: linear-gradient(128deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 26%, transparent 46%);
    pointer-events: none;
}
</style>
<div class="words">
    <h1>${title}</h1>
    <div class="rule"></div>
    ${sub ? `<p>${sub}</p>` : ''}
</div>
<div class="phone">
    <div class="screen">
        <img src="data:image/png;base64,${shot.data}">
        ${pad.island ? '<div class="island"></div>' : ''}
        <div class="glare"></div>
    </div>
</div>`;
}

/* ------------------------------------------------------------- chạy -------- */
function pngSize(f) {
    const b = fs.readFileSync(f, { start: 16, end: 24 });
    const fd = fs.openSync(f, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 16);
    fs.closeSync(fd);
    return { w: buf.readUInt32BE(0), h: buf.readUInt32BE(4) };
}

function build() {
    if (!fs.existsSync(CHROME)) {
        throw new Error('Không thấy Google Chrome ở ' + CHROME + '\nScript dựng ảnh bằng Chrome, cần cài Chrome trước.');
    }
    if (!fs.existsSync(OUT)) {
        throw new Error('Chưa có thư mục screenshots/. Chạy `npm run shots` trước để chụp ảnh thô đã.');
    }
    const fonts = fontCss();
    fs.rmSync(TMP, { recursive: true, force: true });
    fs.mkdirSync(TMP, { recursive: true });

    const dirs = fs.readdirSync(OUT).filter(d =>
        !d.startsWith('store-') && fs.statSync(path.join(OUT, d)).isDirectory());
    if (!dirs.length) throw new Error('screenshots/ rỗng. Chạy `npm run shots` trước.');

    for (const lang of ['en', 'vi']) {
        console.log(`\n── bộ tiếng ${lang === 'en' ? 'Anh' : 'Việt'} ──`);
        for (const dir of dirs) {
            const src = path.join(OUT, dir);
            const dst = path.join(OUT, 'store-' + lang, dir);
            fs.rmSync(dst, { recursive: true, force: true });
            fs.mkdirSync(dst, { recursive: true });

            const isPad = dir.startsWith('ipad');
            for (const f of fs.readdirSync(src).filter(n => n.endsWith('.png')).sort()) {
                const file = path.join(src, f);
                const { w, h } = pngSize(file);
                const name = f.replace(/\.png$/, '');
                const shot = {
                    name, w, h, data: b64(file),
                    /* iPad bo góc nông và không có đảo động; iPhone thì ngược lại. */
                    pad: isPad
                        ? { bezel: 1.5, radius: 3.4, island: false, islandTop: 0, islandW: 0, islandH: 0 }
                        : { bezel: 1.3, radius: 6.2, island: true, islandTop: 1.5, islandW: 15, islandH: 3.4 }
                };
                const html = path.join(TMP, `${lang}-${dir}-${name}.html`);
                fs.writeFileSync(html, page(shot, w, h, lang, fonts));

                execFileSync(CHROME, [
                    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
                    '--force-device-scale-factor=1',
                    `--screenshot=${path.join(dst, f)}`,
                    `--window-size=${w},${h}`,
                    '--virtual-time-budget=4000',
                    'file://' + html
                ], { stdio: ['ignore', 'ignore', 'ignore'] });

                const got = pngSize(path.join(dst, f));
                const ok = got.w === w && got.h === h;
                console.log(`  ${ok ? '✓' : '✗'} ${dir}/${f}   ${got.w} × ${got.h}${ok ? '' : `  ← PHẢI LÀ ${w} × ${h}`}`);
                if (!ok) throw new Error('Ảnh ra sai số đo, App Store Connect sẽ từ chối.');
            }
        }
    }
    fs.rmSync(TMP, { recursive: true, force: true });
    console.log('\nXong. Ảnh quảng bá nằm ở screenshots/store-en/ và screenshots/store-vi/');
    console.log('Kéo thẳng vào App Store Connect → Media Manager, mỗi thứ tiếng một bộ.');
}

build();
