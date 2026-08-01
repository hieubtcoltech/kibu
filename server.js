#!/usr/bin/env node
/* =========================================================
   Playground Static Server
   Server tĩnh không cần cài thêm thư viện nào.
   Chạy:  node server.js  [port]
   Mặc định lắng nghe trên 0.0.0.0 để các máy khác trong cùng
   mạng Wi-Fi (điện thoại, iPad của các con) đều vào được.
   ========================================================= */

'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const url = require('url');

const ROOT = __dirname;
const START_PORT = Number(process.argv[2] || process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PORT_TRIES = 20;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json; charset=utf-8'
};

/* ---------- Màu cho terminal ---------- */
const C = {
    reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
    cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m',
    magenta: '\x1b[35m', red: '\x1b[31m', gray: '\x1b[90m'
};

/* ---------- Danh sách IP trong mạng LAN ---------- */
function lanAddresses() {
    const out = [];
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                out.push({ name, address: net.address });
            }
        }
    }
    return out;
}

/* ---------- Chặn truy cập ra ngoài thư mục dự án ---------- */
function safeResolve(urlPath) {
    let decoded;
    try {
        decoded = decodeURIComponent(urlPath);
    } catch {
        return null; // URL mã hoá hỏng
    }
    // Bỏ mọi byte null và chuẩn hoá
    if (decoded.includes('\0')) return null;

    // Không phục vụ file/thư mục ẩn (.git, .env, .DS_Store…) — tránh lộ mã nguồn
    if (decoded.split('/').some(seg => seg.startsWith('.') && seg !== '.' && seg !== '..')) return null;

    const resolved = path.resolve(ROOT, '.' + path.posix.normalize(decoded));
    // Phải nằm trong ROOT
    if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
    return resolved;
}

function send(res, status, body, headers = {}) {
    res.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        ...headers
    });
    res.end(body);
}

const NOT_FOUND_PAGE = (p) => `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 · Không tìm thấy</title>
<style>
 body{margin:0;min-height:100vh;display:grid;place-items:center;
      font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
      background:linear-gradient(135deg,#050714,#101428);color:#fff;text-align:center;padding:24px}
 .box{max-width:460px}
 h1{font-size:5rem;margin:0;background:linear-gradient(135deg,#ff007f,#ffd700,#00f0ff);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
 p{color:#94a3b8;line-height:1.6}
 code{background:rgba(255,255,255,.1);padding:2px 8px;border-radius:6px;color:#ffd700}
 a{display:inline-block;margin-top:20px;padding:14px 32px;border-radius:16px;
   background:linear-gradient(135deg,#ff007f,#9d4edd);color:#fff;text-decoration:none;font-weight:700}
</style></head><body><div class="box">
<h1>404</h1>
<p>Không tìm thấy <code>${p.replace(/[<>&]/g, '')}</code> trên máy chủ này.</p>
<a href="/">🏠 Về trang chọn game</a>
</div></body></html>`;

/* ---------- Xử lý request ---------- */
async function handle(req, res) {
    const started = Date.now();
    const parsed = url.parse(req.url);
    let pathname = parsed.pathname || '/';

    const log = (status) => {
        const color = status >= 500 ? C.red : status >= 400 ? C.yellow : C.green;
        const ms = Date.now() - started;
        console.log(`${C.gray}${new Date().toLocaleTimeString('vi-VN')}${C.reset} ` +
            `${color}${status}${C.reset} ${req.method} ${pathname} ${C.dim}(${ms}ms)${C.reset}`);
    };

    // GitHub Webhook Auto-Deploy Endpoint
    if (pathname === '/api/webhook' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                if (payload.ref === 'refs/heads/main' || !payload.ref) {
                    console.log(`${C.cyan}🚀 GitHub Push received! Auto-deploying...${C.reset}`);
                    const { exec } = require('child_process');
                    exec('git pull && pm2 restart kibu', { cwd: ROOT }, (err, stdout, stderr) => {
                        if (err) console.error(`${C.red}Auto-deploy error:${C.reset}`, err);
                        else console.log(`${C.green}Auto-deploy successful!${C.reset}\n`, stdout);
                    });
                    send(res, 200, JSON.stringify({ status: 'success', message: 'Deploy triggered' }), { 'Content-Type': 'application/json' });
                } else {
                    send(res, 200, JSON.stringify({ status: 'ignored', message: 'Not main branch' }), { 'Content-Type': 'application/json' });
                }
            } catch (e) {
                send(res, 400, 'Invalid Payload');
            }
            log(200);
        });
        return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, 'Method Not Allowed', { 'Allow': 'GET, HEAD' });
        return log(405);
    }

    let filePath = safeResolve(pathname);
    if (!filePath) {
        send(res, 403, 'Forbidden');
        return log(403);
    }

    try {
        let stat = await fsp.stat(filePath).catch(() => null);

        // Thư mục -> tìm index.html bên trong
        if (stat && stat.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            const indexStat = await fsp.stat(indexPath).catch(() => null);
            if (indexStat && indexStat.isFile()) {
                filePath = indexPath;
                stat = indexStat;
            } else {
                stat = null;
            }
        }

        // Không có phần mở rộng -> thử thêm .html  (vd: /english -> english.html)
        if (!stat && !path.extname(filePath)) {
            const htmlPath = filePath + '.html';
            const htmlStat = await fsp.stat(htmlPath).catch(() => null);
            if (htmlStat && htmlStat.isFile()) {
                filePath = htmlPath;
                stat = htmlStat;
            }
        }

        if (!stat || !stat.isFile()) {
            send(res, 404, NOT_FOUND_PAGE(pathname));
            return log(404);
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        const etag = `W/"${stat.size}-${stat.mtimeMs}"`;

        // Trình duyệt đã có bản mới nhất rồi
        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, { 'ETag': etag });
            res.end();
            return log(304);
        }

        const headers = {
            'Content-Type': type,
            'Content-Length': stat.size,
            'ETag': etag,
            'Last-Modified': stat.mtime.toUTCString(),
            // Luôn hỏi lại server để các con thấy ngay nội dung vừa sửa
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        };

        res.writeHead(200, headers);
        if (req.method === 'HEAD') {
            res.end();
            return log(200);
        }

        const stream = fs.createReadStream(filePath);
        stream.on('error', (err) => {
            console.error(`${C.red}Lỗi đọc file:${C.reset}`, err.message);
            res.destroy();
        });
        stream.pipe(res);
        res.on('finish', () => log(200));

    } catch (err) {
        console.error(`${C.red}Lỗi server:${C.reset}`, err);
        if (!res.headersSent) send(res, 500, 'Internal Server Error');
        log(500);
    }
}

/* ---------- Khởi động (tự nhảy cổng nếu bị chiếm) ---------- */
function listen(port, triesLeft) {
    const server = http.createServer(handle);

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && triesLeft > 0) {
            console.log(`${C.yellow}⚠  Cổng ${port} đang bận, thử cổng ${port + 1}…${C.reset}`);
            listen(port + 1, triesLeft - 1);
        } else if (err.code === 'EACCES') {
            console.error(`${C.red}✖ Không có quyền dùng cổng ${port}. Hãy chọn cổng > 1024.${C.reset}`);
            process.exit(1);
        } else {
            console.error(`${C.red}✖ Không khởi động được server:${C.reset}`, err.message);
            process.exit(1);
        }
    });

    server.listen(port, HOST, () => banner(port));

    const shutdown = () => {
        console.log(`\n${C.magenta}👋 Đã tắt server. Hẹn gặp lại!${C.reset}`);
        server.close(() => process.exit(0));
        setTimeout(() => process.exit(0), 1500).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

function banner(port) {
    const lan = lanAddresses();
    const line = '─'.repeat(58);

    console.log(`\n${C.cyan}┌${line}┐${C.reset}`);
    console.log(`${C.cyan}│${C.reset}  ${C.bold}🎮  SÂN CHƠI GAME CHO BÉ — máy chủ đã sẵn sàng${C.reset}`);
    console.log(`${C.cyan}└${line}┘${C.reset}\n`);

    console.log(`  ${C.bold}Trên máy này:${C.reset}`);
    console.log(`    ${C.green}➜${C.reset}  http://localhost:${port}\n`);

    if (lan.length) {
        console.log(`  ${C.bold}Cho các con vào (cùng mạng Wi-Fi):${C.reset}`);
        lan.forEach(n => {
            console.log(`    ${C.green}➜${C.reset}  ${C.bold}${C.yellow}http://${n.address}:${port}${C.reset}  ${C.dim}(${n.name})${C.reset}`);
        });
        console.log('');
    } else {
        console.log(`  ${C.yellow}⚠  Chưa thấy địa chỉ mạng LAN — máy có thể đang không nối Wi-Fi.${C.reset}\n`);
    }

    console.log(`  ${C.bold}Vào thẳng từng game:${C.reset}`);
    [
        ['english', '🎓 English Quest — học tiếng Anh'],
        ['fruit', '🍓 Fruit Crush Deluxe'],
        ['shooter', '🤖 Bot Arena Blaster'],
        ['racer', '🏎️  Neon Racer Arcade'],
        ['basketball-game', '🏀 Basketball Duel — 2 bé thi đấu'],
        ['billiards-game', '🎱 Pool Masters — bi-a 8 bi 2 người'],
        ['soccer-game', '⚽ Super Striker — bóng đá mini 2-4 bé'],
        ['darts-game', '🎯 Phi Tiêu Bong Bóng — 2-4 bé thi phi tiêu']
    ].forEach(([slug, name]) => {
        console.log(`    ${C.dim}/${slug}${C.reset}${' '.repeat(Math.max(1, 10 - slug.length))}${name}`);
    });

    console.log(`\n  ${C.dim}Thư mục phục vụ: ${ROOT}${C.reset}`);
    console.log(`  ${C.dim}Nhấn Ctrl + C để dừng server.${C.reset}\n`);
}

listen(START_PORT, MAX_PORT_TRIES);
