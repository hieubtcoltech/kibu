/* ============================================================================
 * Chụp bộ ảnh màn hình để nộp App Store
 * ----------------------------------------------------------------------------
 *     npm run shots
 *
 * Ra sáu bộ trong screenshots/ , đúng số đo App Store Connect đòi:
 *
 *     NẰM NGANG                                  DỰNG ĐỨNG
 *     iphone-6.9/          2868 × 1320           iphone-6.9-portrait/  1320 × 2868
 *     iphone-6.5/          2778 × 1284           iphone-6.5-portrait/  1284 × 2778
 *     ipad-13/             2752 × 2064
 *     ipad-12.9/           2732 × 2048
 *
 * Làm đủ cỡ vì App Store Connect có nhiều ô ảnh, mỗi ô đòi một số đo riêng và
 * thả nhầm ô là nó báo "Screenshots dimensions should be…". Có sẵn cả sáu bộ
 * thì thả vào ô nào cũng xong.
 *
 * Ba chuyện script phải tự lo, vì không có cách nào khác:
 *   1. Máy giả lập không xoay được bằng lệnh (cần quyền trợ năng). Nên tạm khoá
 *      app theo đúng chiều đang cần trong Info.plist, chụp xong trả nguyên trạng.
 *   2. Bên ngoài không gọi được vào trang. Nên chèn tạm src/shots-scenes.js —
 *      nó tự dựng từng cảnh theo đồng hồ, script chờ đúng mốc rồi bấm máy.
 *   3. simctl luôn trả ảnh theo khung hình GỐC của máy (dựng đứng). Chụp ngang
 *      thì nội dung nằm xoay bên trong, phải xoay lại 270°.
 *
 * Ảnh KHÔNG theo git (xem .gitignore): mấy chục MB ảnh mà repo này lại tự deploy
 * lên máy chủ web — đẩy lên đó là thừa. Cần thì chạy lại lệnh này.
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const IOS = path.join(__dirname, 'ios', 'App');
const PLIST = path.join(IOS, 'App', 'Info.plist');
const WWW = path.join(__dirname, 'www');
const OUT = path.join(__dirname, 'screenshots');
const DD = path.join(__dirname, 'build', 'shots-dd');
const APP_ID = 'com.kibu.BalloonDarts';

/* Mốc thời gian khớp với các setTimeout trong src/shots-scenes.js: chụp vào
   giữa quãng mỗi cảnh, sau khi đếm ngược 3 giây đã xong. */
const SHOTS = [
    { at: 2000, name: '0-menu', ipadOnly: true },   // màn chọn chế độ
    { at: 9500, name: '1-duel' },                   // 2 bé, hội chợ
    { at: 17500, name: '2-fourkids' },              // 4 bé
    { at: 25500, name: '3-beach' },                 // bãi biển
    { at: 33500, name: '4-solo' },                  // một bé
    { at: 41500, name: '5-golden' },                // săn bóng vàng
    { at: 46500, name: '6-ketqua', ipadOnly: true } // bảng kết quả
];

/* Hai màn có BẢNG (chọn chế độ, kết quả) chỉ chụp trên iPad. Bảng cao hơn màn
   hình iPhone nên bị cắt mất một khúc — ảnh thế lên store trông như app hỏng. */
const IPHONE = { name: 'iPhone 16 Pro Max', dir: 'iphone-6.9' };
const IPAD = { name: 'iPad Pro 13-inch (M4)', dir: 'ipad-13' };

const run = (cmd, args, opts) => execFileSync(cmd, args, Object.assign({ encoding: 'utf8' }, opts));
const sim = (...args) => { try { return run('xcrun', ['simctl', ...args]); } catch (e) { return ''; } };
const sleep = ms => ms > 0 && execFileSync(process.execPath, ['-e', `const t=Date.now();while(Date.now()-t<${ms});`]);

function udidOf(name) {
    const list = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])).devices;
    for (const runtime of Object.keys(list)) {
        const hit = list[runtime].find(d => d.name === name);
        if (hit) return hit.udid;
    }
    throw new Error(`Không có máy giả lập "${name}". Tải thêm trong Xcode → Settings → Components.`);
}

/* ------------------------------------------------------------ hướng màn ---
 * Bản gốc được GHI LẠI NGUYÊN VĂN ở đây chứ không chỉ sao lưu vào biến.
 *
 * Lần trước chỉ giữ trong biến rồi trả lại ở khối finally — script chết giữa
 * chừng vì hết đĩa, finally không chạy tới nơi, và Info.plist nằm lại ở trạng
 * thái khoá ngang. Suýt nữa thì nộp lên App Store một bản app không xoay dọc
 * được. Viết thẳng ra như dưới đây thì trả lại được kể cả khi lần chạy trước
 * đã chết dở. */
const PORTRAIT = '<string>UIInterfaceOrientationPortrait</string>';
const UPSIDE = '<string>UIInterfaceOrientationPortraitUpsideDown</string>';
const LAND = '<string>UIInterfaceOrientationLandscapeLeft</string>\n' +
    '\t\t<string>UIInterfaceOrientationLandscapeRight</string>';

const ORIENTATIONS = {
    original: { phone: [PORTRAIT, LAND], pad: [PORTRAIT, UPSIDE, LAND] },
    landscape: { phone: [LAND], pad: [LAND] },
    portrait: { phone: [PORTRAIT], pad: [PORTRAIT] }
};

function setOrientation(which) {
    const o = ORIENTATIONS[which];
    const arr = list => '<array>\n\t\t' + list.join('\n\t\t') + '\n\t</array>';
    let t = fs.readFileSync(PLIST, 'utf8');
    const before = t;
    t = t.replace(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/,
        '<key>UISupportedInterfaceOrientations</key>\n\t' + arr(o.phone));
    t = t.replace(/<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/,
        '<key>UISupportedInterfaceOrientations~ipad</key>\n\t' + arr(o.pad));
    if (t === before && which !== 'original') {
        throw new Error('Info.plist: không thấy mục hướng màn hình.');
    }
    fs.writeFileSync(PLIST, t);
}

function restore() {
    /* Trả Info.plist TRƯỚC — chỉ ghi một tệp nhỏ, gần như không thể hỏng. Dựng
       lại www/ sau và bọc try: nó cần đĩa trống, mà lỗi ở đó thì cùng lắm là
       còn sót tệp dựng tạm, chứ không được phép kéo theo cái plist. */
    setOrientation('original');
    try {
        run('npm', ['run', 'sync'], { cwd: __dirname, stdio: 'inherit' });
    } catch (e) {
        console.error('\n⚠  Chưa dọn được www/. Chạy `npm run sync` bằng tay trước khi dựng .ipa.');
    }
}

/* ---------------------------------------------------------------- dựng ---- */
function buildForSimulator() {
    run('node', ['build-www.js'], { cwd: __dirname, stdio: 'inherit' });
    fs.copyFileSync(path.join(__dirname, 'src', 'shots-scenes.js'), path.join(WWW, 'shots-scenes.js'));
    const idx = path.join(WWW, 'index.html');
    fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8')
        .replace('</body>', '    <script src="shots-scenes.js"></script>\n</body>'));
    run('npx', ['cap', 'copy', 'ios'], { cwd: __dirname, stdio: 'inherit' });
    run('xcodebuild', [
        '-project', 'App.xcodeproj', '-scheme', 'App', '-configuration', 'Debug',
        '-sdk', 'iphonesimulator', '-destination', 'generic/platform=iOS Simulator',
        '-derivedDataPath', DD, 'CODE_SIGNING_ALLOWED=NO', 'build'
    ], { cwd: IOS, stdio: ['ignore', 'ignore', 'inherit'] });
}

/* ---------------------------------------------------------------- chụp ---- */
function shootOn(device, outDir, rotate) {
    const udid = udidOf(device.name);
    const app = path.join(DD, 'Build', 'Products', 'Debug-iphonesimulator', 'App.app');
    const dir = path.join(OUT, outDir);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    console.log(`\n${device.name} ${rotate ? 'ngang' : 'dọc'} → screenshots/${outDir}/`);
    sim('boot', udid);
    sim('bootstatus', udid, '-b');
    sim('install', udid, app);
    sim('terminate', udid, APP_ID);
    sim('launch', udid, APP_ID);
    sleep(1500);                       // trang nạp xong, đồng hồ trong shots-scenes.js bắt đầu chạy

    const isPad = device === IPAD;
    let clock = 0;
    for (const s of SHOTS) {
        sleep(s.at - clock);
        clock = s.at;
        if (s.ipadOnly && !isPad) continue;
        const out = path.join(dir, s.name + '.png');
        if (rotate) {
            const raw = path.join(dir, s.name + '.raw.png');
            sim('io', udid, 'screenshot', raw);
            run('sips', ['-r', '270', raw, '--out', out], { stdio: 'ignore' });
            fs.unlinkSync(raw);
        } else {
            sim('io', udid, 'screenshot', out);
        }
        const dim = run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out])
            .match(/pixel\w+:\s*(\d+)/g).map(x => x.split(/:\s*/)[1]).join(' × ');
        console.log(`  ✓ ${s.name}.png   ${dim}`);
    }
    sim('shutdown', udid);
}

/* ------------------------------------------------------------ cỡ phái sinh --
 * Cỡ 6.5" và 12.9" thu từ ảnh đã chụp chứ không chụp lại trên máy giả lập
 * khác: tỉ lệ hai bên gần như trùng, mà mỗi lượt chụp là thêm một máy giả lập
 * phải tải về và một phút chờ.
 *
 * sips -z GIỮ tỉ lệ chứ không ép đúng số đo, nên phải hai bước: thu cho vừa
 * khung rồi chèn nền cho đủ đúng số đo. Nền chèn lấy đúng màu nền của game nên
 * không nhìn ra chỗ nối. */
function derive(fromDir, toDir, w, h) {
    const src = path.join(OUT, fromDir), dst = path.join(OUT, toDir);
    if (!fs.existsSync(src)) return;
    fs.rmSync(dst, { recursive: true, force: true });
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src).filter(n => n.endsWith('.png'))) {
        const tmp = path.join(dst, '_' + f);
        run('sips', ['-z', String(h), String(w), path.join(src, f), '--out', tmp], { stdio: 'ignore' });
        run('sips', ['-p', String(h), String(w), '--padColor', '070914', tmp,
            '--out', path.join(dst, f)], { stdio: 'ignore' });
        fs.unlinkSync(tmp);
    }
    console.log(`  ✓ screenshots/${toDir}/   ${w} × ${h}`);
}

/* ---------------------------------------------------------------- chạy ---- */
try {
    setOrientation('landscape');
    buildForSimulator();
    shootOn(IPHONE, 'iphone-6.9', true);
    shootOn(IPAD, 'ipad-13', true);

    /* Dựng đứng chỉ chụp iPhone: iPad dựng đứng thì sân chơi tụt xuống còn một
       dải mỏng giữa hai vùng tối, không đáng để lên store. */
    setOrientation('portrait');
    buildForSimulator();
    shootOn(IPHONE, 'iphone-6.9-portrait', false);
} finally {
    restore();
}

console.log('\nCỡ phái sinh:');
derive('iphone-6.9', 'iphone-6.5', 2778, 1284);
derive('ipad-13', 'ipad-12.9', 2732, 2048);
derive('iphone-6.9-portrait', 'iphone-6.5-portrait', 1284, 2778);

console.log('\nXong. Kéo thẳng vào App Store Connect → Media Manager.');
