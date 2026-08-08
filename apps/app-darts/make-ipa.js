/* ============================================================================
 * Dựng tệp .ipa để nộp App Store
 * ----------------------------------------------------------------------------
 *     npm run ipa            (đã tự chạy `npm run sync` trước)
 *
 * Hai bước, đúng như bấm Product → Archive → Distribute trong Xcode:
 *   1. archive  — dựng bản Release cho máy thật, ký bằng chứng chỉ phân phối
 *   2. export   — đóng gói archive thành .ipa theo ExportOptions.plist
 *
 * -allowProvisioningUpdates cho phép Xcode tự xin chứng chỉ và hồ sơ cấp phép
 * cho bundle id mới. Cần tài khoản Apple đã đăng nhập sẵn trong Xcode
 * (Settings → Accounts); không có thì bước 1 dừng và báo thiếu gì.
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const IOS = path.join(__dirname, 'ios', 'App');
const OUT = path.join(__dirname, 'build');
const ARCHIVE = path.join(OUT, 'App.xcarchive');
const IPA_DIR = path.join(OUT, 'ipa');

function xcode(args) {
    console.log('\n$ xcodebuild ' + args.slice(0, 6).join(' ') + ' …\n');
    execFileSync('xcodebuild', args, { cwd: IOS, stdio: 'inherit' });
}

/* Số hiệu bản dựng phải TĂNG ở mỗi lần nộp, kể cả khi số phiên bản không đổi —
   App Store Connect từ chối thẳng bản trùng số. In ra để khỏi quên. */
function versions() {
    const pbx = fs.readFileSync(path.join(IOS, 'App.xcodeproj', 'project.pbxproj'), 'utf8');
    const get = k => (pbx.match(new RegExp(k + ' = ([^;]+);')) || [])[1];
    return { marketing: get('MARKETING_VERSION'), build: get('CURRENT_PROJECT_VERSION') };
}

fs.rmSync(OUT, { recursive: true, force: true });

const v = versions();
console.log(`Balloon Darts ${v.marketing} (bản dựng ${v.build})`);

xcode([
    '-project', 'App.xcodeproj',
    '-scheme', 'App',
    '-configuration', 'Release',
    '-destination', 'generic/platform=iOS',
    '-archivePath', ARCHIVE,
    '-allowProvisioningUpdates',
    'archive'
]);

xcode([
    '-exportArchive',
    '-archivePath', ARCHIVE,
    '-exportPath', IPA_DIR,
    '-exportOptionsPlist', path.join(__dirname, 'ExportOptions.plist'),
    '-allowProvisioningUpdates'
]);

const ipa = fs.readdirSync(IPA_DIR).find(f => f.endsWith('.ipa'));
if (!ipa) throw new Error('Không thấy tệp .ipa nào trong ' + IPA_DIR);
const p = path.join(IPA_DIR, ipa);

console.log(`\n✓ ${p}`);
console.log(`  ${(fs.statSync(p).size / 1024 / 1024).toFixed(1)} MB — ${v.marketing} (${v.build})`);
console.log('\nNộp lên App Store Connect bằng một trong hai cách:');
console.log('  · Transporter (App Store) — kéo tệp .ipa vào, bấm Deliver');
console.log('  · xcrun altool --upload-app -f "' + p + '" -t ios -u <apple-id> -p <app-specific-password>');
