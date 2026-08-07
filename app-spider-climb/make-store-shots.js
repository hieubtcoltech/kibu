/* ============================================================================
 * Dựng bộ ảnh QUẢNG BÁ cho App Store từ ảnh chụp thô
 * ----------------------------------------------------------------------------
 *     npm run store-shots            (chạy sau `npm run shots`)
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MODE = (process.argv[2] || 'plain').toLowerCase();
if (!['plain', 'device'].includes(MODE)) {
    throw new Error(`Kiểu "${MODE}" không có. Chỉ nhận 'plain' hoặc 'device'.`);
}

const OUT = path.join(__dirname, 'screenshots');
const FONTS = path.join(__dirname, 'vendor', 'fonts');
const TMP = path.join(__dirname, 'build', 'store-tmp');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const WORDS = {
    '0-menu': {
        en: ['Two Towers, One Endless Climb', 'Leap wall-to-wall between skyscrapers'],
        vi: ['Hai tòa nhà, một đường leo', 'Nhảy liên tục giữa các tòa cao tầng']
    },
    '1-climb': {
        en: ['Endless Vertical Action', 'Dodge sentry drones and glass hazards'],
        vi: ['Hành động leo cao vô tận', 'Né rô-bốt gác và kính vỡ']
    },
    '2-web': {
        en: ['Fire Your Web Line', 'Shoot down drones and catch yourself while falling'],
        vi: ['Bắn tơ nhện hạ rô-bốt', 'Bắn rụng drone và cứu mình khi trượt chân']
    },
    '3-storm': {
        en: ['Survive the Night Storm', 'Watch out for lightning bolts and strong winds'],
        vi: ['Vượt bão đêm giông tố', 'Coi chừng tia sét giật và gió thổi ngang']
    },
    '4-suits': {
        en: ['Unlock Unique Suits', 'Customize your spider hero look with coins'],
        vi: ['Mở khóa trang phục nhện', 'Đổi màu áo cho người nhện bằng xu']
    },
    '5-missions': {
        en: ['Complete Daily Missions', 'Earn gems and break your best records'],
        vi: ['Làm nhiệm vụ mỗi ngày', 'Nhận kim cương và phá kỷ lục cá nhân']
    },
    '6-over': {
        en: ['Climb Higher Every Time', 'Track your score, coins and longest combo'],
        vi: ['Chinh phục độ cao mới', 'Ghi danh điểm cao, chuỗi nhảy và số xu']
    }
};

const SKINS = {
    '0-menu': ['#131e3a', '#060a14', '#4bd7ff'],
    '1-climb': ['#3a131b', '#0e0407', '#ff3b52'],
    '2-web': ['#0b3142', '#041118', '#39d6ff'],
    '3-storm': ['#21153d', '#080512', '#b07aff'],
    '4-suits': ['#3b2f0a', '#141003', '#ffd75e'],
    '5-missions': ['#0a3622', '#03120b', '#8fe870'],
    '6-over': ['#3b1526', '#14050c', '#ff56c8']
};

const DEVICES = {
    phone: { corner: 0.125, bezel: 0.030, island: { w: 0.284, h: 0.082, edge: 0.025 } },
    pad: { corner: 0.029, bezel: 0.026, island: null }
};

const b64 = f => fs.readFileSync(f).toString('base64');

function fontCss() {
    const css = fs.readFileSync(path.join(FONTS, 'fonts.css'), 'utf8');
    const pick = family => {
        const re = new RegExp("font-family: '" + family + "'[\\s\\S]*?src: url\\(\\./([^)]+)\\)", 'g');
        const files = [];
        let m;
        while ((m = re.exec(css))) files.push(m[1]);
        if (!files.length) throw new Error('Không thấy phông ' + family + ' trong vendor/fonts/fonts.css');
        return files.map(f => "@font-face{font-family:'" + family + "';font-weight:400 800;font-display:block;" +
            "src:url(data:font/woff2;base64," + b64(path.join(FONTS, f)) + ") format('woff2')}").join('\n');
    };
    return pick('Baloo 2') + '\n' + pick('Nunito');
}

function page(shot, W, H, lang, fonts) {
    const w = WORDS[shot.name] || { en: ['Spider Climb', ''], vi: ['Spider Climb', ''] };
    const [title, sub] = w[lang];
    const [c1, c2, glow] = SKINS[shot.name] || SKINS['1-climb'];

    const u = Math.min(W, H) / 100;
    const dev = DEVICES[shot.kind];
    const framed = MODE === 'device';
    const bezelR = framed ? dev.bezel : 0;

    const padX = 6 * u;
    const padY = 7 * u;
    const gap = 5 * u;
    const wordsBox = Math.round(H * 0.21);
    const wordsW = W - 2 * padX;
    const aspect = shot.w / shot.h;

    const guessW = W - 2 * padX;
    const bezel = Math.round(bezelR * Math.min(guessW, guessW / aspect));

    let screenW, screenH;
    const visibleH = H - padY - wordsBox - gap;
    screenW = W - 2 * padX - 2 * bezel;
    let outerH0 = screenW / aspect + 2 * bezel;
    if (visibleH / outerH0 < 0.62) outerH0 = visibleH / 0.62;
    screenW = Math.min(screenW, (outerH0 - 2 * bezel) * aspect);

    screenW = Math.round(screenW);
    screenH = Math.round(screenW / aspect);
    const outerW = Math.round(screenW + 2 * bezel), outerH = Math.round(screenH + 2 * bezel);

    const shortPx = Math.min(screenW, screenH);
    const rScreen = Math.round(dev.corner * shortPx);
    const rOuter = rScreen + bezel;
    const isl = dev.island ? {
        w: Math.round(dev.island.w * shortPx),
        h: Math.round(dev.island.h * shortPx),
        edge: Math.round(dev.island.edge * shortPx)
    } : null;

    return `<!doctype html><meta charset="utf-8"><style>
${fonts}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body {
    background:
        radial-gradient(120% 80% at 50% 0%, ${glow}44 0%, transparent 62%),
        linear-gradient(168deg, ${c1} 0%, ${c2} 74%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: ${padY}px ${padX}px;
    gap: ${gap}px;
    font-family: 'Nunito', sans-serif;
    -webkit-font-smoothing: antialiased;
}
body::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(112deg, transparent 38%, rgba(255,255,255,0.05) 50%, transparent 62%);
    pointer-events: none;
}
.words {
    position: relative;
    text-align: center;
    width: ${wordsW}px;
    height: ${wordsBox}px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 0 0 auto;
}
h1 {
    font-family: 'Baloo 2', sans-serif;
    font-weight: 800;
    font-size: ${8.2 * u}px;
    line-height: 1.08;
    letter-spacing: -0.015em;
    color: #fff;
    text-shadow: 0 ${0.5 * u}px ${2 * u}px rgba(0,0,0,0.45);
    text-wrap: balance;
}
p {
    margin-top: ${2.2 * u}px;
    font-size: ${3.5 * u}px;
    font-weight: 600;
    line-height: 1.42;
    color: rgba(255,255,255,0.76);
    text-wrap: balance;
    max-width: ${74 * u}px;
    margin-left: auto;
    margin-right: auto;
}
.rule {
    width: ${9 * u}px; height: ${0.75 * u}px;
    margin: ${2.6 * u}px auto 0;
    border-radius: ${u}px;
    background: ${glow};
    box-shadow: 0 0 ${2 * u}px ${glow}aa;
}
.phone {
    position: relative;
    flex: 0 0 auto;
    width: ${outerW}px;
    height: ${outerH}px;
    ${framed ? `padding: ${bezel}px;
    border-radius: ${rOuter}px;
    background: linear-gradient(150deg, #3a3d4a 0%, #0a0b10 26%, #0a0b10 74%, #2e313c 100%);
    box-shadow:
        0 ${3 * u}px ${9 * u}px rgba(0,0,0,0.55),
        0 ${0.9 * u}px ${2 * u}px rgba(0,0,0,0.4),
        inset 0 0 0 ${Math.max(1, Math.round(0.22 * u))}px rgba(255,255,255,0.16);`
            : `filter: drop-shadow(0 ${3 * u}px ${8 * u}px rgba(0,0,0,0.55));`}
    display: flex;
}
.screen {
    position: relative;
    flex: 1;
    border-radius: ${rScreen}px;
    overflow: hidden;
    background: #070b16;
    ${framed ? '' : `box-shadow: inset 0 0 0 ${Math.max(1, Math.round(0.18 * u))}px rgba(255,255,255,0.14);`}
}
.screen img { display: block; width: 100%; height: 100%; object-fit: fill; }
${isl ? `.island {
    position: absolute;
    background: #000;
    top: ${isl.edge}px; left: 50%; transform: translateX(-50%);
    width: ${isl.w}px; height: ${isl.h}px; border-radius: ${isl.h}px;
}` : ''}
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
        ${isl ? '<div class="island"></div>' : ''}
        <div class="glare"></div>
    </div>
</div>`;
}

function pngSize(f) {
    const fd = fs.openSync(f, 'r');
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 16);
    fs.closeSync(fd);
    return { w: buf.readUInt32BE(0), h: buf.readUInt32BE(4) };
}

function build() {
    if (!fs.existsSync(CHROME)) {
        throw new Error('Không thấy Google Chrome ở ' + CHROME);
    }
    if (!fs.existsSync(OUT)) {
        throw new Error('Chưa có thư mục screenshots/. Chạy `npm run shots` trước.');
    }
    const framedMode = MODE === 'device';
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
            const dst = path.join(OUT, (framedMode ? 'store-device-' : 'store-') + lang, dir);
            fs.rmSync(dst, { recursive: true, force: true });
            fs.mkdirSync(dst, { recursive: true });

            const isPad = dir.startsWith('ipad');
            for (const f of fs.readdirSync(src).filter(n => n.endsWith('.png')).sort()) {
                const file = path.join(src, f);
                const { w, h } = pngSize(file);
                const name = f.replace(/\.png$/, '');
                const shot = { name, w, h, data: b64(file), kind: isPad ? 'pad' : 'phone' };
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
                console.log(`  ${ok ? '✓' : '✗'} ${dir}/${f}   ${got.w} × ${got.h}`);
                if (!ok) throw new Error('Ảnh ra sai số đo.');
            }
        }
    }
    fs.rmSync(TMP, { recursive: true, force: true });
    console.log('\nXong. Ảnh quảng bá nằm ở screenshots/store-en/ và screenshots/store-vi/');
}

build();
