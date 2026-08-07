/* ============================================================================
 * Tạo icon và màn hình chờ cho app từ đúng cái icon của game trên web
 * ----------------------------------------------------------------------------
 *     node make-icons.js          →  assets/icon.png, assets/splash*.png
 *     npx @capacitor/assets generate --ios
 *
 * Dùng sips có sẵn trong macOS, không cài thêm thư viện xử lý ảnh nào.
 * Icon nộp App Store bắt buộc 1024×1024, PNG, KHÔNG có kênh trong suốt.
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'spider-climb', 'icon-800.jpg');
const OUT = path.join(__dirname, 'assets');
const BG = '070b16';        // trùng --bg-dark của game

const sips = (...args) => execFileSync('sips', args, { stdio: ['ignore', 'ignore', 'inherit'] });

fs.mkdirSync(OUT, { recursive: true });

/* ---- Icon: 800 → 1024 ---- */
const icon = path.join(OUT, 'icon.png');
sips('-s', 'format', 'png', '-z', '1024', '1024', SRC, '--out', icon);

/* ---- Màn hình chờ: 2732×2732 ---- */
const splash = path.join(OUT, 'splash.png');
sips('-z', '900', '900', icon, '--out', splash);
sips('--padToHeightWidth', '2732', '2732', '--padColor', BG, splash);

fs.copyFileSync(splash, path.join(OUT, 'splash-dark.png'));

for (const f of ['icon.png', 'splash.png', 'splash-dark.png']) {
    const p = path.join(OUT, f);
    const dim = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', p], { encoding: 'utf8' })
        .match(/pixel\w+:\s*(\d+)/g).map(s => s.split(/:\s*/)[1]).join('×');
    console.log(`  ✓ assets/${f}  ${dim}`);
}
