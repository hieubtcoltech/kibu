/* ============================================================================
 * Chụp bộ ảnh màn hình để nộp App Store
 * ----------------------------------------------------------------------------
 *     npm run shots
 *
 * Ra bốn bộ trong screenshots/ , đúng số đo App Store Connect đòi:
 *
 *     iphone-6.9-portrait/   1320 × 2868      ipad-13-portrait/     2064 × 2752
 *     iphone-6.5-portrait/   1284 × 2778      ipad-12.9-portrait/   2048 × 2732
 *
 * Làm đủ bốn cỡ vì App Store Connect có nhiều ô ảnh, mỗi ô đòi một số đo riêng
 * và thả nhầm ô là nó báo "Screenshots dimensions should be…". Có sẵn cả bốn bộ
 * thì thả vào ô nào cũng xong.
 *
 * CHỤP TRONG APP THẬT TRÊN MÁY GIẢ LẬP, KHÔNG PHẢI TRONG CHROME.
 *
 * Bản trước chụp bằng Chrome headless với --window-size=1320,2868 cho nhanh.
 * Ảnh ra sai, và sai theo kiểu nhìn thoáng qua không thấy: Chrome hiểu con số
 * ấy là 1320 điểm ảnh CSS, tức một cửa sổ rộng bằng màn hình máy để bàn, nên
 * trang rơi vào nhánh giao diện máy tính — thanh trên bé tí, khung game lọt
 * thỏm giữa hai dải đen, chữ nhỏ như kiến. iPhone 16 Pro Max thật thì rộng 440
 * điểm ảnh CSS và vẽ ở tỉ lệ 3×. Không có cờ nào của Chrome bắc được cầu qua
 * chỗ ấy — phải chạy trong app thật.
 *
 * Hai chuyện script phải tự lo, vì không có cách nào khác:
 *   1. Bên ngoài không gọi được vào trang. Nên chèn tạm src/shots-scenes.js —
 *      nó tự dựng từng cảnh theo đồng hồ, script chờ đúng mốc rồi bấm máy.
 *   2. Máy giả lập NHỚ hướng màn của lần dùng trước. Ai đó xoay ngang rồi bỏ đó
 *      là cả bộ ảnh ra nằm ngang. Nên tạm khoá app dựng đứng trong Info.plist,
 *      chụp xong trả nguyên trạng.
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
const APP_ID = 'com.kibu.SpiderClimb';

/* Mỗi cảnh dựng ở mốc T trong src/shots-scenes.js, máy bấm ở T + 2,5 giây —
   đủ để game chạy tiếp một quãng thật: mưa rơi, đèn nhấp nháy, người nhện leo
   thêm mấy chục mét. Hai bên phải khớp nhau. */
const SHOTS = [
    { at: 2500, name: '0-menu' },      // bảng chọn chế độ
    { at: 9000, name: '1-climb' },     // khu cao ốc ban ngày
    { at: 15500, name: '2-web' },      // phố đêm nê-ông, đang bắn tơ
    { at: 22000, name: '3-storm' },    // đêm giông, sét đang nhắm
    { at: 28500, name: '4-suits' },    // cửa hàng trang phục
    { at: 35000, name: '5-missions' }, // nhiệm vụ trong ngày
    { at: 41500, name: '6-over' }      // bảng kết quả
];

const IPHONE = { name: 'iPhone 16 Pro Max', dir: 'iphone-6.9-portrait' };
const IPAD = { name: 'iPad Pro 13-inch (M4)', dir: 'ipad-13-portrait' };

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
 * Bản gốc được GHI LẠI NGUYÊN VĂN ở đây chứ không chỉ sao lưu vào biến: script
 * chết giữa chừng thì khối finally có thể không chạy tới nơi, và Info.plist
 * nằm lại ở trạng thái khoá dựng đứng — nộp lên App Store một bản app không
 * xoay ngang được. Viết thẳng ra như dưới đây thì trả lại được kể cả khi lần
 * chạy trước đã chết dở. */
const PORTRAIT = '<string>UIInterfaceOrientationPortrait</string>';
const UPSIDE = '<string>UIInterfaceOrientationPortraitUpsideDown</string>';
const LAND = '<string>UIInterfaceOrientationLandscapeLeft</string>\n' +
    '\t\t<string>UIInterfaceOrientationLandscapeRight</string>';

const ORIENTATIONS = {
    original: { phone: [PORTRAIT, LAND], pad: [PORTRAIT, UPSIDE, LAND] },
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
    sleep(2500);                       // trang nạp xong, đồng hồ trong shots-scenes.js bắt đầu chạy

    /* MỐC THỜI GIAN ĐO TỪ MỘT GỐC, KHÔNG PHẢI CỘNG DỒN CÁC LẦN CHỜ.
     *
     * Giữa hai lần chờ còn có việc phải làm — `simctl io screenshot` mất non
     * một giây, và mỗi lần gọi sleep lại đẻ ra một tiến trình node. Cộng dồn
     * thì máy chụp TỤT LẠI mỗi tấm một ít, dồn tới tấm cuối là lệch vài giây,
     * đủ để bấm máy vào cảnh SAU cảnh đang cần. Đo từ gốc thì mỗi lần chờ tự bù
     * lại phần đã trôi.
     *
     * Gốc đặt SAU quãng nghỉ ở trên, vì kịch bản chạy theo lúc TRANG NẠP XONG
     * chứ không theo lúc mở app. */
    const t0 = Date.now();
    for (const s of SHOTS) {
        const late = (Date.now() - t0) - s.at;
        if (late > 800) console.log(`  ⚠ trễ ${(late / 1000).toFixed(1)}s so với mốc ${s.name}`);
        sleep(s.at - (Date.now() - t0));
        const out = path.join(dir, s.name + '.png');
        sim('io', udid, 'screenshot', out);
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
        run('sips', ['-p', String(h), String(w), '--padColor', '070B16', tmp,
            '--out', path.join(dst, f)], { stdio: 'ignore' });
        fs.unlinkSync(tmp);
    }
    console.log(`  ✓ screenshots/${toDir}/   ${w} × ${h}`);
}

/* ---------------------------------------------------------------- chạy ---- */
try {
    setOrientation('portrait');
    buildForSimulator();
    shootOn(IPHONE);
    shootOn(IPAD);
} finally {
    restore();
}

console.log('\nCỡ phái sinh:');
derive('iphone-6.9-portrait', 'iphone-6.5-portrait', 1284, 2778);
derive('ipad-13-portrait', 'ipad-12.9-portrait', 2048, 2732);

console.log('\nXong. Kéo thẳng vào App Store Connect → Media Manager.');
