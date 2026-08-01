/* ============================================================================
 * WEBSOCKET TỐI GIẢN (RFC 6455) — KHÔNG CẦN CÀI THƯ VIỆN
 * ----------------------------------------------------------------------------
 * Cả dự án đang chạy bằng Node thuần, package.json không có dependency nào và
 * máy chủ triển khai bằng `node server.js`. Kéo về thư viện `ws` chỉ để đẩy vài
 * dòng JSON qua lại là đổi luôn cách vận hành, nên phần khung WebSocket viết
 * tay ở đây: bắt tay, đọc/ghi khung dữ liệu, ping giữ nhịp.
 *
 * Phạm vi vừa đủ cho game cờ tướng:
 *   - chỉ nhận khung text và các khung điều khiển (close/ping/pong)
 *   - tự ghép khung bị chia nhỏ (continuation)
 *   - chặn thông điệp quá lớn để không ai bơm bộ nhớ máy chủ
 * ==========================================================================*/

'use strict';

const crypto = require('crypto');
const EventEmitter = require('events');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_MESSAGE = 64 * 1024;        // 64KB: nước cờ chỉ vài chục byte
const PING_MS = 25000;

class WebSocketConn extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.open = true;
        this.buffer = Buffer.alloc(0);
        this.fragments = [];
        this.fragmentOp = 0;
        this.alive = true;

        socket.on('data', (chunk) => this._onData(chunk));
        socket.on('close', () => this._closed());
        socket.on('error', () => this._closed());
        socket.setTimeout(0);
        socket.setNoDelay(true);

        this.pingTimer = setInterval(() => {
            if (!this.open) return;
            if (!this.alive) return this.close();      // không trả lời ping -> coi như đứt
            this.alive = false;
            this._frame(0x9, Buffer.alloc(0));
        }, PING_MS);
    }

    send(obj) {
        if (!this.open) return;
        const text = typeof obj === 'string' ? obj : JSON.stringify(obj);
        this._frame(0x1, Buffer.from(text, 'utf8'));
    }

    close(code) {
        if (!this.open) return;
        this.open = false;
        clearInterval(this.pingTimer);
        try {
            const buf = Buffer.alloc(2);
            buf.writeUInt16BE(code || 1000, 0);
            this._frame(0x8, buf, true);
            this.socket.end();
        } catch (e) { /* đã đứt rồi */ }
        this.emit('close');
    }

    _closed() {
        if (!this.open) return;
        this.open = false;
        clearInterval(this.pingTimer);
        this.emit('close');
    }

    _frame(opcode, payload, force) {
        if (!this.open && !force) return;
        const len = payload.length;
        let header;
        if (len < 126) {
            header = Buffer.alloc(2);
            header[1] = len;
        } else if (len < 65536) {
            header = Buffer.alloc(4);
            header[1] = 126;
            header.writeUInt16BE(len, 2);
        } else {
            header = Buffer.alloc(10);
            header[1] = 127;
            header.writeBigUInt64BE(BigInt(len), 2);
        }
        header[0] = 0x80 | opcode;      // FIN + opcode
        try { this.socket.write(Buffer.concat([header, payload])); } catch (e) { this._closed(); }
    }

    _onData(chunk) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        if (this.buffer.length > MAX_MESSAGE * 4) return this.close(1009);

        while (this.buffer.length >= 2) {
            const b0 = this.buffer[0], b1 = this.buffer[1];
            const fin = (b0 & 0x80) !== 0;
            const opcode = b0 & 0x0f;
            const masked = (b1 & 0x80) !== 0;
            let len = b1 & 0x7f;
            let offset = 2;

            if (len === 126) {
                if (this.buffer.length < offset + 2) return;
                len = this.buffer.readUInt16BE(offset);
                offset += 2;
            } else if (len === 127) {
                if (this.buffer.length < offset + 8) return;
                const big = this.buffer.readBigUInt64BE(offset);
                if (big > BigInt(MAX_MESSAGE)) return this.close(1009);
                len = Number(big);
                offset += 8;
            }

            // Trình duyệt luôn che dữ liệu; không che là sai giao thức
            if (!masked) return this.close(1002);
            if (this.buffer.length < offset + 4 + len) return;   // chưa đủ khung
            const mask = this.buffer.slice(offset, offset + 4);
            offset += 4;

            const payload = Buffer.allocUnsafe(len);
            for (let i = 0; i < len; i++) payload[i] = this.buffer[offset + i] ^ mask[i & 3];
            this.buffer = this.buffer.slice(offset + len);

            if (opcode === 0x8) return this.close(1000);          // đối phương đóng
            if (opcode === 0x9) { this._frame(0xA, payload); continue; }   // ping -> pong
            if (opcode === 0xA) { this.alive = true; continue; }           // pong

            if (opcode === 0x0) {
                this.fragments.push(payload);
            } else {
                this.fragments = [payload];
                this.fragmentOp = opcode;
            }

            const total = this.fragments.reduce((n, f) => n + f.length, 0);
            if (total > MAX_MESSAGE) return this.close(1009);

            if (fin) {
                const full = Buffer.concat(this.fragments);
                this.fragments = [];
                if (this.fragmentOp === 0x1) {
                    let msg = null;
                    try { msg = JSON.parse(full.toString('utf8')); } catch (e) { msg = null; }
                    if (msg) this.emit('message', msg);
                }
                // khung nhị phân: game này không dùng, bỏ qua
            }
        }
    }
}

/* Bắt tay nâng cấp từ HTTP lên WebSocket. Trả về connection hoặc null. */
function upgrade(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        return null;
    }
    const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
    socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
    );
    const conn = new WebSocketConn(socket);
    if (head && head.length) conn._onData(head);
    return conn;
}

module.exports = { upgrade, WebSocketConn, MAX_MESSAGE };
