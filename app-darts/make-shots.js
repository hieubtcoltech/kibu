/* ============================================================================
 * Chụp bộ ảnh màn hình để nộp App Store
 * ----------------------------------------------------------------------------
 *     npm run shots
 *
 * Ra hai bộ trong screenshots/ , đúng kích thước Apple đòi:
 *     iphone-6.9/   2868 × 1320   (iPhone 16 Pro Max)
 *     ipad-13/      2752 × 2064   (iPad Pro 13-inch)
 *
 * Chụp NẰM NGANG: game cho 1–4 bé ngồi quanh một máy, cầm ngang mới ra đúng
 * không khí, còn dựng đứng thì sân chỉ chiếm một phần ba khung.
 *
 * Ba chuyện script phải tự lo, vì không có cách nào khác:
 *   1. Máy giả lập không xoay được bằng lệnh (cần quyền trợ năng). Nên tạm khoá
 *      app chỉ chạy ngang trong Info.plist, chụp xong trả lại nguyên trạng.
 *   2. Bên ngoài không gọi được vào trang. Nên chèn tạm src/shots-scenes.js —
 *      nó tự dựng từng cảnh theo đồng hồ, script chờ đúng mốc rồi bấm máy.
 *   3. simctl trả về ảnh theo khung hình GỐC của máy (luôn dựng đứng), nội dung
 *      nằm xoay bên trong. Xoay lại 270° là ra ảnh ngang đúng chiều.
 *
 * Ảnh KHÔNG theo git (xem .gitignore): 21 MB ảnh mà repo này lại tự deploy lên
 * máy chủ web — đẩy lên đó là thừa. Cần thì chạy lại lệnh này.
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

/* Mốc thời gian phải khớp với các setTimeout trong src/shots-scenes.js: chụp
   vào giữa quãng mỗi cảnh, sau khi đếm ngược 3 giây đã xong. */
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
   hình iPhone nằm ngang nên bị cắt mất một khúc — ảnh như thế lên store trông
   như app hỏng. */
const DEVICES = [
    { name: 'iPhone 16 Pro Max', dir: 'iphone-6.9' },
    { name: 'iPad Pro 13-inch (M4)', dir: 'ipad-13' }
];

const run = (cmd, args, opts) => execFileSync(cmd, args, Object.assign({ encoding: 'utf8' }, opts));
const sim = (...args) => { try { return run('xcrun', ['simctl', ...args]); } catch (e) { return ''; } };
const sleep = ms => execFileSync(process.execPath, ['-e', `const t=Date.now();while(Date.now()-t<${ms});`]);

function udidOf(name) {
    const list = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])).devices;
    for (const runtime of Object.keys(list)) {
        const hit = list[runtime].find(d => d.name === name);
        if (hit) return hit.udid;
    }
    throw new Error(`Không có máy giả lập "${name}". Tải thêm trong Xcode → Settings → Components.`);
}

/* ---------------------------------------------------------------- dựng ---- */
const plistBackup = fs.readFileSync(PLIST, 'utf8');

function lockLandscape() {
    const land = '<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n' +
        '\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>';
    let t = plistBackup
        .replace(/<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/,
            '<key>UISupportedInterfaceOrientations</key>\n\t' + land)
        .replace(/<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/,
            '<key>UISupportedInterfaceOrientations~ipad</key>\n\t' + land);
    if (t === plistBackup) throw new Error('Info.plist: không thấy mục hướng màn hình để tạm khoá.');
    fs.writeFileSync(PLIST, t);
}

function restore() {
    fs.writeFileSync(PLIST, plistBackup);
    /* Dựng lại www/ sạch để cái src="shots-scenes.js" không sót lại trong gói. */
    run('npm', ['run', 'sync'], { cwd: __dirname, stdio: 'inherit' });
}

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
function shootOn(device) {
    const udid = udidOf(device.name);
    const app = path.join(DD, 'Build', 'Products', 'Debug-iphonesimulator', 'App.app');
    const dir = path.join(OUT, device.dir);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    console.log(`\n${device.name} → screenshots/${device.dir}/`);
    sim('boot', udid);
    sim('bootstatus', udid, '-b');
    sim('install', udid, app);
    sim('terminate', udid, APP_ID);
    sim('launch', udid, APP_ID);
    sleep(1500);                       // trang nạp xong, đồng hồ trong shots-scenes.js bắt đầu chạy

    const isPad = device.dir.startsWith('ipad');
    let clock = 0;
    for (const s of SHOTS) {
        sleep(s.at - clock);
        clock = s.at;
        if (s.ipadOnly && !isPad) continue;
        const raw = path.join(dir, s.name + '.raw.png');
        sim('io', udid, 'screenshot', raw);
        const out = path.join(dir, s.name + '.png');
        run('sips', ['-r', '270', raw, '--out', out], { stdio: 'ignore' });
        fs.unlinkSync(raw);
        const dim = run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out])
            .match(/pixel\w+:\s*(\d+)/g).map(x => x.split(/:\s*/)[1]).join(' × ');
        console.log(`  ✓ ${s.name}.png   ${dim}`);
    }
    sim('shutdown', udid);
}

/* ---------------------------------------------------------------- chạy ---- */
try {
    lockLandscape();
    buildForSimulator();
    DEVICES.forEach(shootOn);
} finally {
    restore();                          // trả Info.plist và www/ về nguyên trạng dù có lỗi giữa chừng
}
console.log('\nXong. Kéo thẳng vào App Store Connect → Media Manager.');
