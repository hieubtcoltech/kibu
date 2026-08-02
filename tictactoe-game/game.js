/* =========================================================
   CỜ CARO (TIC TAC TOE) — GAME LOGIC
   Bé X đi trước, bé O hoặc máy đi sau. Ba mức máy: Dễ (đi bừa),
   Vừa (biết ăn và biết chặn) và Khó (minimax, không bao giờ thua).
   ========================================================= */
(function () {
    'use strict';

    /* ------------------------------------------------------------------ *
     * 1. CHỮ NGHĨA
     *    i18n.js dịch phần chữ tĩnh trong HTML; mấy dòng game tự sinh ra thì
     *    nằm ở đây, và ô chứa chúng mang data-i18n-skip để engine không
     *    dịch chồng lên. i18n.js phơi ra { lang, t, refresh } — KHÔNG có
     *    getLang(), nên đọc thẳng .lang.
     * ------------------------------------------------------------------ */
    var STR = {
        vi: {
            turnX: 'Lượt Của Bé X',
            turnO: 'Lượt Của Bé O',
            turnAi: 'Máy Đang Nghĩ',
            winX: 'Bé X Thắng!',
            winO: 'Bé O Thắng!',
            winAi: 'Máy Thắng!',
            winKid: 'Bé Thắng Rồi!',
            draw: 'Hoà Rồi!',
            cell: 'Ô số ',
            soundOn: 'Tắt âm thanh',
            soundOff: 'Bật âm thanh'
        },
        en: {
            turnX: "Kid X's Turn",
            turnO: "Kid O's Turn",
            turnAi: 'AI Is Thinking',
            winX: 'Kid X Wins!',
            winO: 'Kid O Wins!',
            winAi: 'The AI Wins!',
            winKid: 'You Win!',
            draw: "It's A Draw!",
            cell: 'Square ',
            soundOn: 'Turn sound off',
            soundOff: 'Turn sound on'
        }
    };

    function lang() {
        if (window.KibuI18n && window.KibuI18n.lang === 'vi') return 'vi';
        if (window.KibuI18n && window.KibuI18n.lang === 'en') return 'en';
        return document.documentElement.lang === 'vi' ? 'vi' : 'en';
    }

    function t(key) { return STR[lang()][key]; }

    /* ------------------------------------------------------------------ *
     * 2. HÌNH QUÂN CỜ
     * ------------------------------------------------------------------ */
    var MARK_SVG = {
        X: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M24 24 L76 76"/><path d="M76 24 L24 76"/></svg>',
        O: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="28"/></svg>'
    };

    var LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    var AI_DELAY = 520;   // để bé kịp nhìn thấy nước mình vừa đi

    /* ------------------------------------------------------------------ *
     * 3. PHẦN TỬ TRÊN TRANG
     * ------------------------------------------------------------------ */
    var el = {
        board: document.getElementById('board'),
        turnBanner: document.getElementById('turnBanner'),
        overlay: document.getElementById('overlay'),
        resultMark: document.getElementById('resultMark'),
        resultText: document.getElementById('resultText'),
        confetti: document.getElementById('confetti'),
        btnRestart: document.getElementById('btnRestart'),
        btnRematch: document.getElementById('btnRematch'),
        btnSound: document.getElementById('btn-sound'),
        soundIcon: document.getElementById('sound-icon'),
        modePvp: document.getElementById('modePvp'),
        modePve: document.getElementById('modePve'),
        difficultyRow: document.getElementById('difficultyRow'),
        scoreX: document.getElementById('scoreX'),
        scoreO: document.getElementById('scoreO'),
        scoreDraw: document.getElementById('scoreDraw')
    };

    // Mấy phần tử chỉ dùng để đo khung — không có cũng chẳng sao
    function pick(sel) { return document.querySelector ? document.querySelector(sel) : null; }
    var cardEl = pick('.play-card');
    var wrapEl = pick('.game-wrapper');
    var setupEl = pick('.setup');
    var scoreEl = pick('.scoreboard');

    /* ------------------------------------------------------------------ *
     * 4. TRẠNG THÁI
     * ------------------------------------------------------------------ */
    var board = new Array(9).fill(null);
    var current = 'X';
    var roundOver = false;
    var locked = false;        // máy đang nghĩ — chặn tay bé, khác với hết ván
    var aiTimer = null;
    var mode = 'pvp';          // 'pvp' | 'pve'
    var difficulty = 'medium'; // 'easy' | 'medium' | 'hard'
    var score = { X: 0, O: 0, draw: 0 };
    var cells = [];
    var winLineEl = null;

    /* ------------------------------------------------------------------ *
     * 5. ÂM THANH — mấy tiếng "tưng" nhẹ, không chói tai
     * ------------------------------------------------------------------ */
    var soundOn = true;
    var audio = null;
    var SOUND_KEY = 'kibu_tictactoe_sound';

    try {
        soundOn = localStorage.getItem(SOUND_KEY) !== 'off';
    } catch (e) { /* chế độ riêng tư */ }

    function audioCtx() {
        var Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        if (!audio) audio = new Ctor();
        if (audio.state === 'suspended' && audio.resume) audio.resume();
        return audio;
    }

    /* notes: [tần số, lúc bắt đầu (giây), độ dài] */
    function play(notes, type, volume) {
        if (!soundOn) return;
        try {
            var ctx = audioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;
            notes.forEach(function (n) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = type || 'sine';
                osc.frequency.setValueAtTime(n[0], now + n[1]);
                gain.gain.setValueAtTime(0.0001, now + n[1]);
                gain.gain.exponentialRampToValueAtTime(volume || 0.16, now + n[1] + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + n[2]);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + n[1]);
                osc.stop(now + n[1] + n[2] + 0.02);
            });
        } catch (e) { /* trình duyệt chặn âm thanh thì thôi, game vẫn chạy */ }
    }

    var SOUNDS = {
        markX: function () { play([[523.25, 0, 0.16]], 'triangle'); },
        markO: function () { play([[392.00, 0, 0.16]], 'triangle'); },
        win: function () { play([[523.25, 0, 0.18], [659.25, 0.12, 0.18], [783.99, 0.24, 0.18], [1046.50, 0.36, 0.34]], 'sine', 0.18); },
        draw: function () { play([[440, 0, 0.2], [349.23, 0.16, 0.3]], 'sine', 0.13); },
        aiWin: function () { play([[392, 0, 0.2], [329.63, 0.16, 0.28]], 'triangle', 0.13); },
        tap: function () { play([[660, 0, 0.07]], 'sine', 0.1); },
        nope: function () { play([[220, 0, 0.1]], 'sine', 0.08); }
    };

    function applySoundButton() {
        if (!el.soundIcon || !el.btnSound) return;
        el.soundIcon.className = soundOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        el.btnSound.classList.toggle('is-off', !soundOn);
        el.btnSound.title = soundOn ? t('soundOn') : t('soundOff');
    }

    /* ------------------------------------------------------------------ *
     * 6. DỰNG BÀN CỜ
     *    Mỗi ô là một <button> thật, nên bé bấm bằng chuột, chạm hay bàn
     *    phím đều được và trình đọc màn hình đọc ra được.
     * ------------------------------------------------------------------ */
    function buildBoard() {
        el.board.innerHTML = '';
        cells = [];
        for (var i = 0; i < 9; i++) {
            var cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'cell';
            cell.setAttribute('data-index', String(i));
            cell.setAttribute('aria-label', t('cell') + (i + 1));
            cell.addEventListener('click', onCellClick);
            el.board.appendChild(cell);
            cells.push(cell);
        }
    }

    function onCellClick(e) {
        var index = parseInt(e.currentTarget.getAttribute('data-index'), 10);

        if (roundOver || locked) return;
        if (board[index] !== null) { SOUNDS.nope(); return; }

        playMove(index, current);

        // Tới lượt máy: khoá bàn rồi để máy đi sau một nhịp
        if (!roundOver && mode === 'pve' && current === 'O') {
            locked = true;
            renderTurn();
            aiTimer = setTimeout(function () {
                aiTimer = null;
                locked = false;
                aiMove();
            }, AI_DELAY);
        }
    }

    /* Một nước đi trọn vẹn: đặt quân → xét thắng/hoà → đổi lượt */
    function playMove(index, player) {
        board[index] = player;

        var cell = cells[index];
        cell.classList.add('is-taken', player === 'X' ? 'mark-x' : 'mark-o');
        cell.innerHTML = MARK_SVG[player];
        cell.disabled = true;
        cell.setAttribute('aria-label', t('cell') + (index + 1) + ': ' + player);
        (player === 'X' ? SOUNDS.markX : SOUNDS.markO)();

        var line = winningLine(board, player);
        if (line) { endRound(player, line); return; }
        if (board.every(function (v) { return v !== null; })) { endRound(null, null); return; }

        current = player === 'X' ? 'O' : 'X';
        renderTurn();
    }

    function winningLine(state, player) {
        for (var i = 0; i < LINES.length; i++) {
            var l = LINES[i];
            if (state[l[0]] === player && state[l[1]] === player && state[l[2]] === player) return l;
        }
        return null;
    }

    /* ------------------------------------------------------------------ *
     * 7. HIỂN THỊ
     * ------------------------------------------------------------------ */
    function renderTurn() {
        var thinking = mode === 'pve' && current === 'O' && locked;
        var mark = '<span class="turn-mark">' + MARK_SVG[current] + '</span>';
        var text;

        if (thinking) text = t('turnAi');
        else if (current === 'X') text = t('turnX');
        else text = mode === 'pve' ? t('turnAi') : t('turnO');

        el.turnBanner.className = 'turn-banner ' + (current === 'X' ? 'for-x' : 'for-o');
        el.turnBanner.innerHTML = mark + '<span>' + text + '</span>' +
            (thinking ? '<span class="thinking"><i></i><i></i><i></i></span>' : '');
    }

    function renderScore() {
        el.scoreX.textContent = String(score.X);
        el.scoreO.textContent = String(score.O);
        el.scoreDraw.textContent = String(score.draw);
    }

    function clearWinLine() {
        if (winLineEl && winLineEl.parentNode) winLineEl.parentNode.removeChild(winLineEl);
        winLineEl = null;
    }

    /* Vạch nối ba quân thắng, vẽ theo vị trí thật của ô đầu và ô cuối */
    function drawWinLine(line) {
        clearWinLine();
        var boardRect = el.board.getBoundingClientRect();
        var a = cells[line[0]].getBoundingClientRect();
        var b = cells[line[2]].getBoundingClientRect();
        var x1 = a.left + a.width / 2 - boardRect.left;
        var y1 = a.top + a.height / 2 - boardRect.top;
        var x2 = b.left + b.width / 2 - boardRect.left;
        var y2 = b.top + b.height / 2 - boardRect.top;
        var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        var node = document.createElement('div');
        node.className = 'win-line';
        node.style.left = x1 + 'px';
        node.style.top = (y1 - 6) + 'px';
        node.style.transform = 'rotate(' + angle + 'deg)';
        el.board.appendChild(node);
        winLineEl = node;

        // đặt width sau một khung hình để transition có cái mà chạy
        requestAnimationFrame(function () {
            if (winLineEl === node) node.style.width = len + 'px';
        });
    }

    /* ------------------------------------------------------------------ *
     * 8. KẾT THÚC VÁN
     * ------------------------------------------------------------------ */
    function endRound(winner, line) {
        roundOver = true;
        locked = false;

        cells.forEach(function (c) { c.disabled = true; });

        if (winner) {
            score[winner] += 1;
            line.forEach(function (i) { cells[i].classList.add('is-win'); });
            drawWinLine(line);
        } else {
            score.draw += 1;
        }
        renderScore();

        var aiWon = winner === 'O' && mode === 'pve';
        var kidWonVsAi = winner === 'X' && mode === 'pve';

        if (!winner) {
            el.resultMark.className = 'result-mark';
            el.resultMark.innerHTML = '<span class="emoji">🤝</span>';
            el.resultText.className = 'result-text is-draw';
            el.resultText.textContent = t('draw');
            SOUNDS.draw();
        } else if (aiWon) {
            el.resultMark.className = 'result-mark';
            el.resultMark.innerHTML = '<span class="emoji">🤖</span>';
            el.resultText.className = 'result-text win-o';
            el.resultText.textContent = t('winAi');
            SOUNDS.aiWin();
        } else {
            el.resultMark.className = 'result-mark ' + (winner === 'X' ? 'mark-x' : 'mark-o');
            el.resultMark.innerHTML = MARK_SVG[winner];
            el.resultText.className = 'result-text ' + (winner === 'X' ? 'win-x' : 'win-o');
            el.resultText.textContent = kidWonVsAi ? t('winKid') : (winner === 'X' ? t('winX') : t('winO'));
            SOUNDS.win();
            startConfetti();
        }

        setTimeout(function () { el.overlay.classList.add('is-open'); }, 620);
    }

    /* ------------------------------------------------------------------ *
     * 9. VÁN MỚI
     * ------------------------------------------------------------------ */
    function newRound() {
        // nước máy đang hẹn giờ phải huỷ, không thì nó rơi vào ván mới
        if (aiTimer !== null) { clearTimeout(aiTimer); aiTimer = null; }

        board = new Array(9).fill(null);
        current = 'X';
        roundOver = false;
        locked = false;

        clearWinLine();
        stopConfetti();
        el.overlay.classList.remove('is-open');

        cells.forEach(function (cell, i) {
            cell.className = 'cell';
            cell.innerHTML = '';
            cell.disabled = false;
            cell.setAttribute('aria-label', t('cell') + (i + 1));
        });

        renderTurn();
    }

    function resetAll() {
        score = { X: 0, O: 0, draw: 0 };
        renderScore();
        newRound();
    }

    /* ------------------------------------------------------------------ *
     * 10. MÁY ĐI
     * ------------------------------------------------------------------ */
    function aiMove() {
        if (roundOver) return;
        var index;
        if (difficulty === 'easy') index = randomMove();
        else if (difficulty === 'medium') index = mediumMove();
        else index = bestMove();

        if (index === null || index === undefined) return;
        playMove(index, 'O');
    }

    function freeCells(state) {
        var out = [];
        for (var i = 0; i < 9; i++) if (state[i] === null) out.push(i);
        return out;
    }

    function randomMove() {
        var free = freeCells(board);
        if (!free.length) return null;
        return free[Math.floor(Math.random() * free.length)];
    }

    /* Vừa: ăn được thì ăn, không thì chặn, rồi mới tới ô giữa và bốn góc */
    function mediumMove() {
        var win = lineFinisher('O');
        if (win !== null) return win;

        var block = lineFinisher('X');
        if (block !== null) return block;

        if (board[4] === null) return 4;

        var corners = [0, 2, 6, 8].filter(function (i) { return board[i] === null; });
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

        return randomMove();
    }

    /* Ô còn trống duy nhất của một hàng đã có hai quân của `player` */
    function lineFinisher(player) {
        for (var i = 0; i < LINES.length; i++) {
            var l = LINES[i];
            var mine = 0, empty = -1;
            for (var k = 0; k < 3; k++) {
                if (board[l[k]] === player) mine++;
                else if (board[l[k]] === null) empty = l[k];
            }
            if (mine === 2 && empty >= 0) return empty;
        }
        return null;
    }

    /* Khó: minimax đầy đủ — hoà là kết quả tốt nhất bé có thể đạt */
    function bestMove() {
        var best = -Infinity, move = null;
        var free = freeCells(board);
        for (var i = 0; i < free.length; i++) {
            board[free[i]] = 'O';
            var s = minimax(board, 0, false);
            board[free[i]] = null;
            if (s > best) { best = s; move = free[i]; }
        }
        return move;
    }

    function minimax(state, depth, maximizing) {
        if (winningLine(state, 'O')) return 10 - depth;
        if (winningLine(state, 'X')) return depth - 10;
        var free = freeCells(state);
        if (!free.length) return 0;

        var i, s;
        if (maximizing) {
            var best = -Infinity;
            for (i = 0; i < free.length; i++) {
                state[free[i]] = 'O';
                s = minimax(state, depth + 1, false);
                state[free[i]] = null;
                if (s > best) best = s;
            }
            return best;
        }
        var worst = Infinity;
        for (i = 0; i < free.length; i++) {
            state[free[i]] = 'X';
            s = minimax(state, depth + 1, true);
            state[free[i]] = null;
            if (s < worst) worst = s;
        }
        return worst;
    }

    /* ------------------------------------------------------------------ *
     * 11. PHÁO GIẤY
     * ------------------------------------------------------------------ */
    var confettiOn = false;
    var pieces = [];
    var confettiCtx = el.confetti && el.confetti.getContext ? el.confetti.getContext('2d') : null;
    var CONFETTI_COLORS = ['#ff7a5c', '#ffc247', '#37d69a', '#3fb8ff', '#a98bff', '#ff4f81'];
    var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

    function sizeCanvas() {
        if (!el.confetti) return;
        el.confetti.width = el.overlay.clientWidth || 400;
        el.confetti.height = el.overlay.clientHeight || 400;
    }

    function startConfetti() {
        if (!confettiCtx || reduceMotion) return;
        sizeCanvas();
        pieces = [];
        for (var i = 0; i < 70; i++) {
            pieces.push({
                x: Math.random() * el.confetti.width,
                y: Math.random() * -el.confetti.height,
                w: 7 + Math.random() * 7,
                h: 10 + Math.random() * 8,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                vx: -1.2 + Math.random() * 2.4,
                vy: 2 + Math.random() * 2.6,
                rot: Math.random() * Math.PI,
                vr: -0.12 + Math.random() * 0.24
            });
        }
        confettiOn = true;
        requestAnimationFrame(confettiFrame);
    }

    function stopConfetti() {
        confettiOn = false;
        pieces = [];
        if (confettiCtx && el.confetti) confettiCtx.clearRect(0, 0, el.confetti.width, el.confetti.height);
    }

    function confettiFrame() {
        if (!confettiOn || !confettiCtx) return;
        confettiCtx.clearRect(0, 0, el.confetti.width, el.confetti.height);

        pieces.forEach(function (p) {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            if (p.y > el.confetti.height + 20) {
                p.y = -20;
                p.x = Math.random() * el.confetti.width;
            }
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.rot);
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            confettiCtx.restore();
        });

        requestAnimationFrame(confettiFrame);
    }

    window.addEventListener('resize', function () { if (confettiOn) sizeCanvas(); });

    /* ------------------------------------------------------------------ *
     * 12. BÀN CỜ TỰ VỪA KHUNG
     *     Trang không cuộn được, mà chiều cao còn thừa thì đổi theo đủ thứ:
     *     chân trang xuống một hay hai dòng, có hiện hàng độ khó hay không,
     *     máy dọc hay máy ngang. CSS đoán bằng một hằng số vh cho lần vẽ đầu,
     *     còn ở đây đo thật rồi chốt lại — không bao giờ tràn ra khỏi thẻ.
     * ------------------------------------------------------------------ */
    function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }

    function fitBoard() {
        if (!cardEl || !wrapEl || !window.getComputedStyle) return;
        try {
            var cs = window.getComputedStyle(cardEl);
            var wcs = window.getComputedStyle(wrapEl);
            var rowGap = num(cs.rowGap);
            var twoCol = String(cs.gridTemplateColumns || '').trim().split(/\s+/).length > 1;

            var availH = wrapEl.clientHeight - num(wcs.paddingTop) - num(wcs.paddingBottom)
                - num(cs.paddingTop) - num(cs.paddingBottom) - num(cs.borderTopWidth) * 2;
            var availW = cardEl.clientWidth - num(cs.paddingLeft) - num(cs.paddingRight);

            if (twoCol) {
                // cột phải giữ đúng bề rộng lớn nhất CSS cho phép
                availW -= (num(cs.getPropertyValue('--side-col')) || 280) + num(cs.columnGap);
            } else {
                [setupEl, scoreEl, el.turnBanner, el.btnRestart].forEach(function (n) {
                    if (n && !n.hidden && n.offsetHeight) availH -= n.offsetHeight + rowGap;
                });
            }

            el.board.style.width = Math.max(120, Math.floor(Math.min(availH, availW, 400))) + 'px';
        } catch (e) { /* trình duyệt cũ thì cứ dùng con số của CSS */ }
    }

    if (window.ResizeObserver && wrapEl && cardEl) {
        var ro = new window.ResizeObserver(fitBoard);
        ro.observe(wrapEl);
        ro.observe(cardEl);
    }
    window.addEventListener('resize', fitBoard);
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
        document.fonts.ready.then(fitBoard);   // chữ tải xong thì mấy hàng cao lên
    }

    /* ------------------------------------------------------------------ *
     * 13. NÚT BẤM
     * ------------------------------------------------------------------ */
    /* Chế độ nằm ở một chỗ duy nhất: hàng độ khó và hai nút luôn vẽ lại theo
     * `mode`, kể cả lúc mới mở trang — không phụ thuộc vào HTML viết sẵn. */
    function renderMode() {
        el.modePvp.classList.toggle('is-active', mode === 'pvp');
        el.modePve.classList.toggle('is-active', mode === 'pve');
        el.difficultyRow.hidden = mode !== 'pve';
    }

    function setMode(next) {
        mode = next;
        renderMode();
        fitBoard();               // hàng độ khó hiện/ẩn làm đổi chỗ còn thừa
        resetAll();               // đổi đối thủ thì điểm cũ không còn nghĩa gì
    }

    el.modePvp.addEventListener('click', function () { SOUNDS.tap(); setMode('pvp'); });
    el.modePve.addEventListener('click', function () { SOUNDS.tap(); setMode('pve'); });

    Array.prototype.forEach.call(el.difficultyRow.querySelectorAll('.diff-btn'), function (btn) {
        btn.addEventListener('click', function () {
            SOUNDS.tap();
            difficulty = btn.getAttribute('data-diff');
            Array.prototype.forEach.call(el.difficultyRow.querySelectorAll('.diff-btn'), function (b) {
                b.classList.toggle('is-active', b === btn);
            });
            resetAll();
        });
    });

    el.btnRestart.addEventListener('click', function () { SOUNDS.tap(); newRound(); });
    el.btnRematch.addEventListener('click', function () { SOUNDS.tap(); newRound(); });

    if (el.btnSound) {
        el.btnSound.addEventListener('click', function () {
            soundOn = !soundOn;
            try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (e) { /* riêng tư */ }
            applySoundButton();
            if (soundOn) SOUNDS.tap();
        });
    }

    /* ------------------------------------------------------------------ *
     * 14. CHẠY
     * ------------------------------------------------------------------ */
    buildBoard();
    renderMode();
    renderScore();
    applySoundButton();
    newRound();
    fitBoard();
})();
