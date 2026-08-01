/* =========================================================
   CỜ TƯỚNG ONLINE — PHÍA TRÌNH DUYỆT
   ---------------------------------------------------------
   Ba lối vào: Tạo Phòng, Vào Phòng, Đánh Với Máy.

   Máy chủ mới là trọng tài — mọi nước đi đều được nó kiểm lại. Bản luật ở đây
   chỉ dùng để tô sáng ô đi được và chặn thao tác sai ngay trên tay cho mượt,
   nên có sửa cũng không đi được nước phạm luật.

   Bố cục tệp:
     1. Trạng thái & tiện ích
     2. Âm thanh
     3. Vẽ bàn cờ
     4. Thao tác chuột / chạm
     5. Kết nối WebSocket
     6. Chế độ đánh với máy
     7. Màn hình & nút bấm
   ========================================================= */

(function () {
    'use strict';

    const X = window.Xiangqi;
    const COLS = X.COLS, ROWS = X.ROWS;

    /* =====================================================
       1. TRẠNG THÁI
       ===================================================== */

    const S = {
        screen: 'home',
        mode: null,                 // 'online' | 'ai'
        minutes: 10,
        aiLevel: 1,

        // ván đang chơi
        board: X.initial(),
        turn: 'red',
        mySide: 'red',
        phase: 'waiting',           // waiting | countdown | playing | over
        lastMove: null,
        check: false,
        clock: { red: 600000, black: 600000 },
        players: { red: null, black: null },
        result: null,
        rematch: { red: false, black: false },
        captured: [],

        // thao tác
        sel: -1,
        legal: [],
        drag: null,
        anim: null,

        // mạng
        ws: null,
        code: '',
        token: '',
        connected: false,
        retry: 0,
        wantReconnect: false
    };

    const LS = 'kibuXiangqi';
    function saveLocal() {
        try {
            localStorage.setItem(LS, JSON.stringify({
                name: el('input-name').value || '',
                code: S.code, token: S.token, minutes: S.minutes
            }));
        } catch (e) { }
    }
    function loadLocal() {
        try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; }
    }

    const el = id => document.getElementById(id);
    const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);

    function fmtClock(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function tr(s) {
        if (window.KibuI18n && window.KibuI18n.t) { try { return window.KibuI18n.t(s); } catch (e) { return s; } }
        return s;
    }
    function setText(node, str) {
        if (!node) return;
        const out = tr(str);
        if (node.textContent !== out) node.textContent = out;
    }

    let toastTimer = null;
    function toast(msg) {
        const t = el('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }

    let msgTimer = null;
    function boardMsg(msg) {
        const m = el('board-msg');
        m.textContent = msg;
        m.classList.add('show');
        clearTimeout(msgTimer);
        msgTimer = setTimeout(() => m.classList.remove('show'), 2200);
    }

    /* =====================================================
       2. ÂM THANH
       ===================================================== */

    const audio = {
        ctx: null, enabled: true,
        init() {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        },
        tone(type, f0, f1, dur, vol) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(f0, t);
            if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
        },
        knock() { this.tone('triangle', 320, 150, 0.11, 0.22); this.tone('sine', 900, 500, 0.06, 0.09); },
        capture() { this.tone('square', 240, 110, 0.16, 0.2); this.tone('triangle', 520, 200, 0.12, 0.13); },
        check() { [880, 1180].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.14, 0.18), i * 110)); },
        select() { this.tone('sine', 640, 760, 0.06, 0.1); },
        deny() { this.tone('sawtooth', 190, 110, 0.16, 0.14); },
        join() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.16, 0.16), i * 90)); },
        beep(hi) { this.tone('square', hi ? 1046 : 660, hi ? 1320 : 660, 0.14, 0.16); },
        win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone('triangle', f, f, 0.24, 0.18), i * 130)); },
        lose() { [500, 400, 300, 220].forEach((f, i) => setTimeout(() => this.tone('sine', f, f * 0.9, 0.28, 0.16), i * 150)); }
    };

    /* =====================================================
       3. VẼ BÀN CỜ
       ===================================================== */

    let canvas, ctx, geo = { cell: 40, ox: 0, oy: 0, w: 0, h: 0, dpr: 1 };

    // Bên mình luôn ở phía dưới bàn cờ cho dễ nhìn
    function flipped() { return S.mySide === 'black'; }

    function cellOf(i) {
        let r = X.rowOf(i), c = X.colOf(i);
        if (flipped()) { r = ROWS - 1 - r; c = COLS - 1 - c; }
        return { r, c };
    }
    function pointOf(i) {
        const p = cellOf(i);
        return { x: geo.ox + p.c * geo.cell, y: geo.oy + p.r * geo.cell };
    }
    function indexAt(x, y) {
        let c = Math.round((x - geo.ox) / geo.cell);
        let r = Math.round((y - geo.oy) / geo.cell);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return -1;
        if (flipped()) { r = ROWS - 1 - r; c = COLS - 1 - c; }
        return X.idx(r, c);
    }

    function resize() {
        if (!canvas) return;
        const wrap = canvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        const availW = Math.max(120, rect.width - 8);
        const availH = Math.max(120, rect.height - 8);
        // 8 khoảng ngang, 9 khoảng dọc, chừa lề nửa ô mỗi bên
        const cell = Math.floor(Math.min(availW / (COLS - 1 + 1.1), availH / (ROWS - 1 + 1.1)));
        geo.cell = Math.max(18, cell);
        geo.w = Math.round(geo.cell * (COLS - 1 + 1.1));
        geo.h = Math.round(geo.cell * (ROWS - 1 + 1.1));
        geo.ox = Math.round(geo.cell * 0.55);
        geo.oy = Math.round(geo.cell * 0.55);
        geo.dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.style.width = geo.w + 'px';
        canvas.style.height = geo.h + 'px';
        canvas.width = Math.round(geo.w * geo.dpr);
        canvas.height = Math.round(geo.h * geo.dpr);
        draw();
    }

    function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }

    function drawBoard() {
        const cell = geo.cell, ox = geo.ox, oy = geo.oy;
        const w = (COLS - 1) * cell, h = (ROWS - 1) * cell;

        // nền gỗ
        const g = ctx.createLinearGradient(0, 0, geo.w, geo.h);
        g.addColorStop(0, '#f0d9a8');
        g.addColorStop(0.5, '#e5c489');
        g.addColorStop(1, '#d9b273');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, geo.w, geo.h);

        // vân gỗ
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.strokeStyle = '#6b4a24';
        ctx.lineWidth = 1;
        for (let i = 0; i < 26; i++) {
            const y = (i * geo.h) / 26 + Math.sin(i) * 3;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(geo.w * 0.3, y + 5, geo.w * 0.7, y - 5, geo.w, y + 2);
            ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = '#5d3f1e';
        ctx.lineWidth = Math.max(1, cell * 0.028);
        ctx.lineCap = 'round';

        // các đường ngang
        for (let r = 0; r < ROWS; r++) line(ox, oy + r * cell, ox + w, oy + r * cell);
        // các đường dọc: cắt ở sông, trừ hai mép
        for (let c = 0; c < COLS; c++) {
            const x = ox + c * cell;
            if (c === 0 || c === COLS - 1) line(x, oy, x, oy + h);
            else { line(x, oy, x, oy + 4 * cell); line(x, oy + 5 * cell, x, oy + h); }
        }

        // viền ngoài đậm hơn
        ctx.lineWidth = Math.max(1.5, cell * 0.05);
        ctx.strokeRect(ox, oy, w, h);

        // đường chéo trong cung
        ctx.lineWidth = Math.max(1, cell * 0.026);
        [0, 7].forEach(top => {
            line(ox + 3 * cell, oy + top * cell, ox + 5 * cell, oy + (top + 2) * cell);
            line(ox + 5 * cell, oy + top * cell, ox + 3 * cell, oy + (top + 2) * cell);
        });

        // chữ trên sông
        ctx.save();
        ctx.fillStyle = 'rgba(93, 63, 30, 0.72)';
        ctx.font = '700 ' + Math.round(cell * 0.52) + 'px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const my = oy + 4.5 * cell;
        ctx.fillText('楚 河', ox + w * 0.25, my);
        ctx.fillText('漢 界', ox + w * 0.75, my);
        ctx.restore();

        // dấu chữ thập ở vị trí pháo và tốt
        const marks = [[2, 1], [2, 7], [7, 1], [7, 7], [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]];
        ctx.strokeStyle = 'rgba(93, 63, 30, 0.85)';
        ctx.lineWidth = Math.max(1, cell * 0.022);
        marks.forEach(m => {
            let r = m[0], c = m[1];
            if (flipped()) { r = ROWS - 1 - r; c = COLS - 1 - c; }
            const x = ox + c * cell, y = oy + r * cell, d = cell * 0.1, L = cell * 0.16;
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(s => {
                if ((c === 0 && s[0] < 0) || (c === COLS - 1 && s[0] > 0)) return;
                line(x + s[0] * d, y + s[1] * d, x + s[0] * (d + L), y + s[1] * d);
                line(x + s[0] * d, y + s[1] * d, x + s[0] * d, y + s[1] * (d + L));
            });
        });
    }

    function drawHighlights() {
        const cell = geo.cell;

        // nước vừa đi
        if (S.lastMove) {
            ctx.save();
            ctx.strokeStyle = 'rgba(46, 120, 190, 0.85)';
            ctx.lineWidth = Math.max(2, cell * 0.05);
            [S.lastMove.from, S.lastMove.to].forEach(i => {
                const p = pointOf(i);
                ctx.strokeRect(p.x - cell * 0.42, p.y - cell * 0.42, cell * 0.84, cell * 0.84);
            });
            ctx.restore();
        }

        // ô đang chọn
        if (S.sel >= 0) {
            const p = pointOf(S.sel);
            ctx.save();
            ctx.strokeStyle = '#2f8f4a';
            ctx.lineWidth = Math.max(2, cell * 0.06);
            ctx.beginPath();
            ctx.arc(p.x, p.y, cell * 0.46, 0, 6.2832);
            ctx.stroke();
            ctx.restore();
        }

        // các nước đi được
        S.legal.forEach(i => {
            const p = pointOf(i);
            const occupied = S.board[i] !== '.';
            ctx.save();
            if (occupied) {
                ctx.strokeStyle = 'rgba(200, 50, 31, 0.85)';
                ctx.lineWidth = Math.max(2, cell * 0.06);
                ctx.beginPath();
                ctx.arc(p.x, p.y, cell * 0.46, 0, 6.2832);
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(47, 143, 74, 0.55)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, cell * 0.14, 0, 6.2832);
                ctx.fill();
            }
            ctx.restore();
        });

        // tướng đang bị chiếu
        if (S.check && S.phase === 'playing') {
            const g = X.findGeneral(S.board, S.turn);
            if (g >= 0) {
                const p = pointOf(g);
                ctx.save();
                ctx.strokeStyle = 'rgba(220, 40, 40, 0.9)';
                ctx.lineWidth = Math.max(2, cell * 0.07);
                ctx.beginPath();
                ctx.arc(p.x, p.y, cell * 0.47, 0, 6.2832);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    function drawPiece(p, x, y, size, lift) {
        const red = X.isRed(p);
        const r = size * 0.46;

        ctx.save();
        if (lift) {
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = size * 0.3;
            ctx.shadowOffsetY = size * 0.12;
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = size * 0.1;
            ctx.shadowOffsetY = size * 0.05;
        }

        // thân quân bằng gỗ
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.15, x, y, r);
        g.addColorStop(0, '#fdf0d5');
        g.addColorStop(0.65, '#f0d9a8');
        g.addColorStop(1, '#c9a066');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.2832);
        ctx.fill();
        ctx.restore();

        // vành trong
        ctx.save();
        ctx.strokeStyle = red ? 'rgba(200, 50, 31, 0.9)' : 'rgba(35, 37, 43, 0.9)';
        ctx.lineWidth = Math.max(1.2, size * 0.035);
        ctx.beginPath();
        ctx.arc(x, y, r * 0.82, 0, 6.2832);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(120, 84, 42, 0.5)';
        ctx.lineWidth = Math.max(1, size * 0.02);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.2832);
        ctx.stroke();
        ctx.restore();

        // chữ Hán
        ctx.save();
        ctx.fillStyle = red ? '#b8241a' : '#23252b';
        ctx.font = '900 ' + Math.round(size * 0.55) + 'px "Noto Serif SC", "Songti SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(X.GLYPH[p] || '?', x, y + size * 0.02);
        ctx.restore();
    }

    function draw() {
        if (!ctx) return;
        ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
        ctx.clearRect(0, 0, geo.w, geo.h);
        drawBoard();
        drawHighlights();

        const size = geo.cell * 0.92;
        for (let i = 0; i < X.SIZE; i++) {
            const p = S.board[i];
            if (p === '.') continue;
            if (S.drag && S.drag.from === i) continue;          // quân đang cầm vẽ sau
            if (S.anim && S.anim.to === i) continue;            // quân đang bay
            const pt = pointOf(i);
            drawPiece(p, pt.x, pt.y, size);
        }

        // quân đang bay tới ô mới
        if (S.anim) {
            const t = clamp((performance.now() - S.anim.start) / S.anim.dur, 0, 1);
            const e = 1 - Math.pow(1 - t, 3);
            const a = pointOf(S.anim.from), b = pointOf(S.anim.to);
            drawPiece(S.anim.piece, a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e, size, true);
            if (t >= 1) S.anim = null;
        }

        // quân đang kéo bằng tay
        if (S.drag) drawPiece(S.board[S.drag.from], S.drag.x, S.drag.y, size * 1.08, true);
    }

    function loop() {
        if (S.anim || S.drag) draw();
        requestAnimationFrame(loop);
    }

    /* =====================================================
       4. THAO TÁC
       ===================================================== */

    function myTurn() {
        return S.phase === 'playing' && S.turn === S.mySide &&
            (S.mode === 'ai' ? S.turn === S.mySide : true);
    }

    function selectAt(i) {
        const p = S.board[i];
        if (p === '.' || X.sideOf(p) !== S.mySide) return false;
        S.sel = i;
        S.legal = X.movesFrom(S.board, i);
        audio.select();
        draw();
        return true;
    }

    function clearSel() { S.sel = -1; S.legal = []; draw(); }

    function tryMove(from, to) {
        if (!myTurn()) return false;
        if (X.movesFrom(S.board, from).indexOf(to) < 0) {
            audio.deny();
            return false;
        }
        if (S.mode === 'ai') { applyLocalMove(from, to); setTimeout(aiThink, 260); }
        else send({ t: 'move', from, to });
        clearSel();
        return true;
    }

    function pointerPos(ev) {
        const r = canvas.getBoundingClientRect();
        const t = ev.touches && ev.touches[0] ? ev.touches[0] : ev;
        return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    function onDown(ev) {
        audio.init();
        if (!myTurn()) return;
        const pos = pointerPos(ev);
        const i = indexAt(pos.x, pos.y);
        if (i < 0) return;
        ev.preventDefault();

        if (S.sel >= 0 && S.legal.indexOf(i) >= 0) { tryMove(S.sel, i); return; }

        const p = S.board[i];
        if (p !== '.' && X.sideOf(p) === S.mySide) {
            selectAt(i);
            S.drag = { from: i, x: pos.x, y: pos.y, moved: false };
        } else if (S.sel >= 0) {
            clearSel();
        }
    }

    function onMove(ev) {
        if (!S.drag) return;
        const pos = pointerPos(ev);
        if (Math.hypot(pos.x - S.drag.x, pos.y - S.drag.y) > 4) S.drag.moved = true;
        S.drag.x = pos.x; S.drag.y = pos.y;
        ev.preventDefault();
    }

    function onUp(ev) {
        if (!S.drag) return;
        const d = S.drag;
        S.drag = null;
        if (!d.moved) { draw(); return; }                    // bấm chọn, không phải kéo
        const pos = pointerPos(ev.changedTouches ? { touches: ev.changedTouches } : ev);
        const to = indexAt(pos.x, pos.y);
        if (to >= 0 && to !== d.from) tryMove(d.from, to);
        else draw();
    }

    /* =====================================================
       5. KẾT NỐI
       ===================================================== */

    function wsUrl() {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        return proto + '//' + location.host + '/ws/xiangqi';
    }

    function connect(onOpen) {
        if (S.ws && (S.ws.readyState === 0 || S.ws.readyState === 1)) { if (onOpen) onOpen(); return; }
        let ws;
        try { ws = new WebSocket(wsUrl()); } catch (e) { note('Không kết nối được máy chủ.', true); return; }
        S.ws = ws;

        ws.onopen = () => {
            S.connected = true;
            S.retry = 0;
            if (onOpen) onOpen();
        };
        ws.onmessage = (e) => {
            let msg = null;
            try { msg = JSON.parse(e.data); } catch (err) { return; }
            onServer(msg);
        };
        ws.onclose = () => {
            S.connected = false;
            if (!S.wantReconnect) return;
            // Rớt mạng: thử nối lại vài lần rồi mới chịu thua
            S.retry++;
            if (S.retry > 8) { note('Mất kết nối tới máy chủ.', true); return; }
            boardMsg('Reconnecting...');
            setTimeout(() => connect(() => send({ t: 'rejoin', code: S.code, token: S.token })), Math.min(4000, 400 * S.retry));
        };
        ws.onerror = () => { };
    }

    function send(msg) {
        if (S.ws && S.ws.readyState === 1) S.ws.send(JSON.stringify(msg));
    }

    function onServer(msg) {
        if (msg.t === 'error') {
            // Ván cũ hết hạn là chuyện bình thường khi mở lại trang sau một lúc
            if (S.screen === 'home' && /không nhận ra|không còn/i.test(msg.msg)) { note(''); return; }
            note(msg.msg, true);
            toast(msg.msg);
            audio.deny();
            return;
        }
        if (msg.t === 'welcome') {
            S.mySide = msg.side;
            S.token = msg.token;
            S.code = msg.state.code;
            S.wantReconnect = true;
            saveLocal();
            applyState(msg.state);
            return;
        }
        if (msg.t === 'state') {
            S.mySide = msg.side;
            applyState(msg.state);
            return;
        }
    }

    let prevPhase = '', prevMoveCount = -1, prevBoard = '';

    function applyState(st) {
        const wasBoard = prevBoard;
        const newBoard = st.board.split('');

        // Có nước mới: cho quân bay tới ô đích và kêu một tiếng
        if (st.lastMove && st.moveCount !== prevMoveCount && prevMoveCount >= 0 && wasBoard) {
            const captured = wasBoard[st.lastMove.to];
            S.anim = {
                from: st.lastMove.from, to: st.lastMove.to,
                piece: newBoard[st.lastMove.to], start: performance.now(), dur: 190
            };
            if (captured && captured !== '.') { audio.capture(); pushCaptured(captured); }
            else audio.knock();
        }

        S.board = newBoard;
        S.turn = st.turn;
        S.phase = st.phase;
        S.lastMove = st.lastMove;
        S.check = st.check;
        S.clock = st.clock;
        S.players = st.players;
        S.result = st.result;
        S.rematch = st.rematch || { red: false, black: false };
        S.code = st.code;

        if (st.moveCount === 0) S.captured = [];
        prevMoveCount = st.moveCount;
        prevBoard = st.board;

        // Ván mới bắt đầu thì phải dọn bảng kết quả của ván cũ đi
        if (S.phase !== 'over') {
            hideEnd();
            el('btn-rematch').disabled = false;
            el('rematch-note').textContent = '';
        }

        if (S.phase === 'waiting') showScreen('lobby');
        else if (S.phase === 'countdown') { showScreen('game'); runCountdown(st.countdownIn); }
        else if (S.phase === 'playing') { showScreen('game'); el('countdown').hidden = true; }
        else if (S.phase === 'over') { showScreen('game'); showEnd(); }

        if (S.phase !== prevPhase) {
            if (S.phase === 'countdown') audio.join();
            prevPhase = S.phase;
        }
        if (S.check && S.phase === 'playing') {
            if (S.turn === S.mySide) { boardMsg('Check!'); audio.check(); }
        }

        clearSel();
        renderLobby();
        renderGame();
        draw();
    }

    function pushCaptured(p) {
        S.captured.push(p);
        const box = el('captured');
        const sp = document.createElement('span');
        sp.className = 'cap' + (X.isRed(p) ? '' : ' black');
        sp.textContent = X.GLYPH[p];
        box.appendChild(sp);
    }

    let countdownTimer = null;
    function runCountdown(ms) {
        const box = el('countdown');
        box.hidden = false;
        clearInterval(countdownTimer);
        const tick = () => {
            const left = Math.ceil((ms - (Date.now() - t0)) / 1000);
            if (left <= 0) {
                box.querySelector('span').textContent = tr('Go!');
                audio.beep(true);
                clearInterval(countdownTimer);
                setTimeout(() => { box.hidden = true; }, 500);
                return;
            }
            const span = box.querySelector('span');
            if (span.textContent !== String(left)) { span.textContent = left; audio.beep(false); }
        };
        const t0 = Date.now();
        tick();
        countdownTimer = setInterval(tick, 120);
    }

    /* =====================================================
       6. ĐÁNH VỚI MÁY
       ===================================================== */

    const VALUE = { K: 100000, R: 900, C: 450, N: 400, B: 200, A: 200, P: 100 };

    function evaluate(board) {
        let score = 0;
        for (let i = 0; i < X.SIZE; i++) {
            const p = board[i];
            if (p === '.') continue;
            const kind = p.toUpperCase();
            let v = VALUE[kind] || 0;
            if (kind === 'P') {
                const r = X.rowOf(i);
                const crossed = X.isRed(p) ? r <= 4 : r >= 5;
                if (crossed) v += 100;                       // tốt qua sông mạnh hơn hẳn
            }
            // khuyến khích ra quân về phía giữa bàn
            const c = X.colOf(i);
            v += (4 - Math.abs(4 - c)) * 2;
            score += X.isRed(p) ? v : -v;
        }
        return score;
    }

    function search(board, side, depth, alpha, beta) {
        if (depth === 0) return evaluate(board);
        const moves = X.allMoves(board, side);
        if (!moves.length) return side === 'red' ? -99999 : 99999;   // bí nước = thua

        // ăn quân trước cho cắt tỉa hiệu quả
        moves.sort((a, b) => (board[b.to] !== '.' ? 1 : 0) - (board[a.to] !== '.' ? 1 : 0));

        if (side === 'red') {
            let best = -Infinity;
            for (const m of moves) {
                const v = search(X.applyMove(board, m.from, m.to), 'black', depth - 1, alpha, beta);
                if (v > best) best = v;
                if (best > alpha) alpha = best;
                if (alpha >= beta) break;
            }
            return best;
        }
        let best = Infinity;
        for (const m of moves) {
            const v = search(X.applyMove(board, m.from, m.to), 'red', depth - 1, alpha, beta);
            if (v < best) best = v;
            if (best < beta) beta = best;
            if (alpha >= beta) break;
        }
        return best;
    }

    function aiThink() {
        if (S.mode !== 'ai' || S.phase !== 'playing' || S.turn === S.mySide) return;
        const side = S.turn;
        const depth = S.aiLevel === 1 ? 1 : (S.aiLevel === 2 ? 2 : 3);
        const moves = X.allMoves(S.board, side);
        if (!moves.length) return finishLocal(S.mySide, 'checkmate');

        let best = null, bestVal = side === 'red' ? -Infinity : Infinity;
        for (const m of moves) {
            let v = search(X.applyMove(S.board, m.from, m.to), side === 'red' ? 'black' : 'red', depth - 1, -Infinity, Infinity);
            if (S.aiLevel === 1) v += (Math.random() - 0.5) * 120;    // mức Dễ đi hơi hú hoạ
            if (side === 'red' ? v > bestVal : v < bestVal) { bestVal = v; best = m; }
        }
        if (best) applyLocalMove(best.from, best.to);
    }

    function applyLocalMove(from, to) {
        const captured = S.board[to];
        S.anim = { from, to, piece: S.board[from], start: performance.now(), dur: 190 };
        S.board = X.applyMove(S.board, from, to);
        S.lastMove = { from, to };
        S.turn = S.turn === 'red' ? 'black' : 'red';
        if (captured !== '.') { audio.capture(); pushCaptured(captured); } else audio.knock();

        S.localHistory.push({ key: X.positionKey(S.board, S.turn), mover: S.turn === 'red' ? 'black' : 'red', check: X.inCheck(S.board, S.turn) });
        S.check = X.inCheck(S.board, S.turn);
        if (S.check && S.turn === S.mySide) { boardMsg('Check!'); audio.check(); }

        const st = X.status(S.board, S.turn, S.localHistory);
        clearSel();
        renderGame();
        draw();
        if (st.over) finishLocal(st.winner, st.reason);
    }

    function finishLocal(winner, reason) {
        S.phase = 'over';
        S.result = { winner, reason };
        renderGame();
        showEnd();
    }

    function startAiGame() {
        S.mode = 'ai';
        S.mySide = 'red';
        S.board = X.initial();
        S.turn = 'red';
        S.phase = 'playing';
        S.lastMove = null;
        S.check = false;
        S.captured = [];
        S.localHistory = [];
        S.result = null;
        el('captured').innerHTML = '';
        S.clock = { red: S.minutes * 60000, black: S.minutes * 60000 };
        S.players = { red: { name: nameOf(), online: true }, black: { name: 'AI', online: true } };
        prevMoveCount = -1; prevBoard = '';
        showScreen('game');
        el('countdown').hidden = true;
        renderGame();
        resize();
        startLocalClock();
    }

    let localClock = null;
    function startLocalClock() {
        clearInterval(localClock);
        let last = Date.now();
        localClock = setInterval(() => {
            const now = Date.now();
            if (S.mode === 'ai' && S.phase === 'playing') {
                S.clock[S.turn] -= now - last;
                if (S.clock[S.turn] <= 0) {
                    S.clock[S.turn] = 0;
                    clearInterval(localClock);
                    finishLocal(S.turn === 'red' ? 'black' : 'red', 'timeout');
                }
                renderGame();
            }
            last = now;
            if (S.mode !== 'ai' || S.phase === 'over') clearInterval(localClock);
        }, 250);
    }

    /* =====================================================
       7. MÀN HÌNH & NÚT
       ===================================================== */

    function showScreen(name) {
        if (S.screen === name) return;
        S.screen = name;
        ['home', 'lobby', 'game'].forEach(s => {
            el('screen-' + s).classList.toggle('active', s === name);
        });
        if (name === 'game') setTimeout(resize, 30);
    }

    function note(msg, warn) {
        const n = S.screen === 'lobby' ? el('lobby-note') : el('home-note');
        n.textContent = msg;
        n.classList.toggle('warn', !!warn);
    }

    function nameOf() {
        const v = (el('input-name').value || '').trim();
        return v || 'Người chơi';
    }

    function renderLobby() {
        el('room-code').textContent = S.code || '------';
        const r = S.players.red, b = S.players.black;
        const seatR = el('seat-red'), seatB = el('seat-black');
        seatR.querySelector('.seat-name').textContent = r ? r.name : '—';
        seatB.querySelector('.seat-name').textContent = b ? b.name : tr('Waiting...');
        if (S.phase === 'waiting') note('Waiting for a second player...');
    }

    function renderGame() {
        const topSide = flipped() ? 'red' : 'black';
        const botSide = flipped() ? 'black' : 'red';
        [['strip-top', topSide], ['strip-bottom', botSide]].forEach(([id, side]) => {
            const strip = el(id);
            const p = S.players[side];
            strip.querySelector('.ps-dot').className = 'ps-dot ' + side;
            strip.querySelector('.ps-name').textContent =
                (p ? p.name : '—') + (side === S.mySide && S.mode !== 'ai' ? ' (' + tr('you') + ')' : '');
            const clockEl = strip.querySelector('.ps-clock');
            clockEl.textContent = fmtClock(S.clock[side]);
            clockEl.classList.toggle('low', S.clock[side] < 30000);
            strip.classList.toggle('turn', S.phase === 'playing' && S.turn === side);
            strip.classList.toggle('offline', !!(p && p.online === false));
        });
    }

    const REASONS = {
        checkmate: 'Checkmate!',
        stalemate: 'No legal moves left!',
        timeout: 'Out of time!',
        resign: 'Xin thua.',
        disconnect: 'Your opponent disconnected.',
        left: 'Your opponent left the room.',
        perpetual: 'Perpetual check is not allowed.',
        repetition: 'Threefold repetition — draw.',
        idle: 'Sixty moves without a capture — draw.'
    };

    function showEnd() {
        const res = S.result || {};
        const won = res.winner && res.winner === S.mySide;
        el('end-emblem').textContent = res.winner ? (won ? '🏆' : '😢') : '🤝';
        el('end-title').textContent = res.winner
            ? (won ? tr('YOU WIN!') : tr('YOU LOSE'))
            : tr('DRAW');
        el('end-reason').textContent = tr(REASONS[res.reason] || '');
        renderRematch();
        el('modal-end').classList.add('active');
        if (res.winner) (won ? audio.win() : audio.lose());
        else audio.beep(false);
    }

    function hideEnd() { el('modal-end').classList.remove('active'); }

    /* Ai đã bấm "đánh ván nữa" thì hiện ra cho bên kia biết. Trước đây showEnd()
       xoá trắng dòng này mỗi lần máy chủ gửi trạng thái mới, nên vừa bấm xong là
       chữ "đang chờ đối thủ" biến mất. */
    function renderRematch() {
        const note = el('rematch-note'), btn = el('btn-rematch');
        if (S.mode === 'ai') { note.textContent = ''; btn.disabled = false; return; }
        const other = S.mySide === 'red' ? 'black' : 'red';
        const mine = !!(S.rematch && S.rematch[S.mySide]);
        const theirs = !!(S.rematch && S.rematch[other]);
        btn.disabled = mine;
        if (mine && !theirs) note.textContent = tr('Waiting for your opponent...');
        else if (theirs && !mine) note.textContent = tr('Your opponent wants a rematch!');
        else note.textContent = '';
    }

    function pillGroup(rowId, attr, cb) {
        const row = el(rowId);
        if (!row) return;
        row.addEventListener('click', e => {
            const b = e.target.closest('.pill');
            if (!b || !row.contains(b)) return;
            row.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            audio.select();
            cb(b.dataset[attr]);
        });
    }

    function leaveRoom() {
        if (S.mode === 'online') send({ t: 'leave' });
        S.wantReconnect = false;
        S.mode = null;
        S.code = '';
        S.token = '';
        S.captured = [];
        el('captured').innerHTML = '';
        prevMoveCount = -1; prevBoard = ''; prevPhase = '';
        clearInterval(localClock);
        hideEnd();
        showScreen('home');
        note('');
        saveLocal();
    }

    function wire() {
        pillGroup('time-row', 'min', v => { S.minutes = +v; saveLocal(); });
        pillGroup('ai-row', 'level', v => { S.aiLevel = +v; });

        el('btn-create').addEventListener('click', () => {
            audio.init();
            S.mode = 'online';
            note('Creating room...');
            connect(() => send({ t: 'create', name: nameOf(), minutes: S.minutes }));
            saveLocal();
        });

        el('btn-join-open').addEventListener('click', () => {
            const box = el('join-box');
            box.hidden = !box.hidden;
            el('ai-box').hidden = true;
            if (!box.hidden) el('input-code').focus();
        });

        el('btn-ai').addEventListener('click', () => {
            const box = el('ai-box');
            box.hidden = !box.hidden;
            el('join-box').hidden = true;
        });

        el('btn-ai-start').addEventListener('click', () => { audio.init(); startAiGame(); });

        const doJoin = () => {
            const code = (el('input-code').value || '').trim().toUpperCase();
            if (code.length !== 6) { note('A room code has 6 characters.', true); return; }
            audio.init();
            S.mode = 'online';
            note('Joining room...');
            connect(() => send({ t: 'join', code, name: nameOf() }));
            saveLocal();
        };
        el('btn-join').addEventListener('click', doJoin);
        el('input-code').addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
        el('input-name').addEventListener('change', saveLocal);

        el('btn-copy').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(S.code);
                toast('Room code copied!');
            } catch (e) {
                const t = document.createElement('textarea');
                t.value = S.code;
                document.body.appendChild(t);
                t.select();
                try { document.execCommand('copy'); toast('Room code copied!'); } catch (e2) { toast('Không sao chép được, bạn tự chép nhé!'); }
                document.body.removeChild(t);
            }
        });

        el('btn-share').addEventListener('click', async () => {
            const text = tr('Come play Xiangqi with me! Room code:') + S.code;
            const url = location.origin + location.pathname + '?room=' + S.code;
            if (navigator.share) {
                try { await navigator.share({ title: 'XIANGQI KIBU', text, url }); return; } catch (e) { }
            }
            try { await navigator.clipboard.writeText(text + ' — ' + url); toast('Invite copied — send it to your friend!'); }
            catch (e) { toast(text); }
        });

        el('btn-leave-lobby').addEventListener('click', leaveRoom);
        el('btn-exit').addEventListener('click', leaveRoom);
        el('btn-end-exit').addEventListener('click', leaveRoom);
        el('btn-menu-nav').addEventListener('click', leaveRoom);

        el('btn-resign').addEventListener('click', () => {
            if (S.phase !== 'playing') return;
            if (!confirm(tr('Are you sure you want to resign?'))) return;
            if (S.mode === 'ai') finishLocal(S.mySide === 'red' ? 'black' : 'red', 'resign');
            else send({ t: 'resign' });
        });

        el('btn-rematch').addEventListener('click', () => {
            if (S.mode === 'ai') { hideEnd(); startAiGame(); return; }
            send({ t: 'rematch' });
            S.rematch[S.mySide] = true;
            renderRematch();
        });

        const btnSound = el('btn-sound');
        btnSound.addEventListener('click', () => {
            audio.enabled = !audio.enabled;
            el('sound-icon').className = audio.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            btnSound.classList.toggle('muted', !audio.enabled);
        });

        canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        canvas.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);
        window.addEventListener('touchcancel', () => { S.drag = null; draw(); });

        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => setTimeout(resize, 250));
        if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas.parentElement);
    }

    function boot() {
        canvas = el('board');
        ctx = canvas.getContext('2d');

        const saved = loadLocal();
        if (saved.name) el('input-name').value = saved.name;
        if (saved.minutes) {
            S.minutes = saved.minutes;
            el('time-row').querySelectorAll('.pill').forEach(b => {
                b.classList.toggle('active', +b.dataset.min === S.minutes);
            });
        }

        // Vào bằng đường dẫn có sẵn mã phòng: ?room=ABC123
        const m = location.search.match(/[?&]room=([A-Za-z0-9]{6})/);
        if (m) {
            el('input-code').value = m[1].toUpperCase();
            el('join-box').hidden = false;
            note('Bấm "Vào" để tham gia phòng ' + m[1].toUpperCase());
        } else if (saved.code && saved.token) {
            /* Lỡ tay tải lại trang hay điện thoại tự làm mới tab thì phải quay
               về đúng ván đang dở, chứ không phải mất ván. Máy chủ giữ chỗ một
               phút; hết hạn hoặc phòng đã dọn thì nó báo lỗi và mình lặng lẽ ở
               lại màn hình chính. */
            S.mode = 'online';
            S.code = saved.code;
            S.token = saved.token;
            S.wantReconnect = true;
            note('Looking for your game...');
            connect(() => send({ t: 'rejoin', code: saved.code, token: saved.token }));
            setTimeout(() => {
                if (S.screen === 'home') {
                    S.wantReconnect = false;
                    S.mode = null;
                    S.code = ''; S.token = '';
                    saveLocal();
                    note('');
                }
            }, 2500);
        }

        wire();
        resize();
        requestAnimationFrame(loop);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();

})();
