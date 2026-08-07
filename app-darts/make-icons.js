/* ============================================================================
 * Tạo icon và màn hình chờ tràn viền (Fullscreen) cho app
 * ----------------------------------------------------------------------------
 *     node make-icons.js          →  assets/icon.png, assets/splash*.png
 *     npx @capacitor/assets generate --ios --iosProject ios/App
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'darts-game', 'icon-800.jpg');
const SPLASH_SRC = path.join(__dirname, 'assets', 'splash-source.png');
const OUT = path.join(__dirname, 'assets');

const sips = (...args) => execFileSync('sips', args, { stdio: ['ignore', 'ignore', 'inherit'] });

fs.mkdirSync(OUT, { recursive: true });

/* ---- Icon: 800 → 1024 ---- */
const icon = path.join(OUT, 'icon.png');
sips('-s', 'format', 'png', '-z', '1024', '1024', SRC, '--out', icon);

/* ---- Full-bleed Splash Screen ---- */
const splash = path.join(OUT, 'splash.png');
if (fs.existsSync(SPLASH_SRC)) {
    sips('-s', 'format', 'png', '-z', '2732', '2732', SPLASH_SRC, '--out', splash);
} else {
    sips('-z', '900', '900', icon, '--out', splash);
    sips('--padToHeightWidth', '2732', '2732', '--padColor', '070914', splash);
}

fs.copyFileSync(splash, path.join(OUT, 'splash-dark.png'));

for (const f of ['icon.png', 'splash.png', 'splash-dark.png']) {
    const p = path.join(OUT, f);
    const dim = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', p], { encoding: 'utf8' })
        .match(/pixel\w+:\s*(\d+)/g).map(s => s.split(/:\s*/)[1]).join('×');
    console.log(`  ✓ assets/${f}  ${dim}`);
}
