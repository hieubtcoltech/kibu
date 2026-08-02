(function() {
    'use strict';

    // Game Elements
    const cells = document.querySelectorAll('[data-cell]');
    const boardElement = document.getElementById('board');
    const turnText = document.getElementById('turnText');
    const overlay = document.getElementById('gameOverOverlay');
    const winnerText = document.getElementById('winnerText');
    const btnRestart = document.getElementById('btnRestart');
    const btnRematch = document.getElementById('btnRematch');

    // Setup Selectors
    const modePvp = document.getElementById('modePvp');
    const modePve = document.getElementById('modePve');
    const difficultyContainer = document.getElementById('difficultyContainer');
    const diffEasy = document.getElementById('diffEasy');
    const diffMedium = document.getElementById('diffMedium');
    const diffHard = document.getElementById('diffHard');

    // Confetti canvas
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');

    // Sound Synthesizer via Web Audio API
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSound(type) {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            if (type === 'click') {
                // Retro synth pop sound
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'place-o') {
                // Alternate place sound
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'win') {
                // Success tune
                const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.1);
                    osc.stop(now + idx * 0.1 + 0.15);
                });
            } else if (type === 'draw') {
                // Falling sound
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(150, now + 0.4);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'tap') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            }
        } catch (e) {
            console.warn('Audio synthesis context blocked or unsupported:', e);
        }
    }

    // State Variables
    let isXTurn = true;
    let gameActive = true;
    let gameMode = 'pvp'; // 'pvp' or 'pve'
    let difficulty = 'medium'; // 'easy', 'medium', 'hard'
    let boardState = Array(9).fill(null);

    const WINNING_COMBINATIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // Initialize/Reset Board
    function startGame() {
        isXTurn = true;
        gameActive = true;
        boardState.fill(null);
        overlay.classList.remove('visible');
        boardElement.classList.remove('shake');
        
        cells.forEach(cell => {
            cell.classList.remove('taken', 'x-cell', 'o-cell');
            cell.innerHTML = '';
        });

        updateTurnIndicator();
        stopConfetti();
    }

    function updateTurnIndicator() {
        if (!gameActive) return;
        const currentLang = window.KibuI18n ? window.KibuI18n.getLang() : 'en';
        if (isXTurn) {
            turnText.innerHTML = currentLang === 'vi' ? 
                '<span class="x-turn">Bé X</span> Lượt Đi' : 
                '<span class="x-turn">Kid X\'s</span> Turn';
        } else {
            turnText.innerHTML = currentLang === 'vi' ? 
                '<span class="o-turn">Bé O</span> Lượt Đi' : 
                '<span class="o-turn">Kid O\'s</span> Turn';
        }
    }

    // Click handler for cells
    function handleCellClick(e) {
        const cell = e.target.closest('[data-cell]');
        const cellIndex = parseInt(cell.getAttribute('data-cell'));

        if (boardState[cellIndex] !== null || !gameActive) return;

        // X's turn
        makeMove(cellIndex, 'X');

        if (checkWin('X')) {
            endGame(false, 'X');
            return;
        }

        if (checkDraw()) {
            endGame(true);
            return;
        }

        // Check if PvE mode
        if (gameMode === 'pve') {
            gameActive = false; // Temporarily block player clicks during AI turn
            isXTurn = false;
            updateTurnIndicator();
            setTimeout(() => {
                aiMove();
            }, 550);
        } else {
            isXTurn = !isXTurn;
            updateTurnIndicator();
        }
    }

    function makeMove(index, player) {
        boardState[index] = player;
        const cell = cells[index];
        cell.classList.add('taken', player === 'X' ? 'x-cell' : 'o-cell');
        
        // Draw matching neon SVG token
        if (player === 'X') {
            cell.innerHTML = `
                <svg viewBox="0 0 100 100">
                    <path d="M20,20 L80,80" stroke-dasharray="100" stroke-dashoffset="100"/>
                    <path d="M80,20 L20,80" stroke-dasharray="100" stroke-dashoffset="100"/>
                </svg>
            `;
            playSound('click');
        } else {
            cell.innerHTML = `
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="30" stroke-dasharray="200" stroke-dashoffset="200"/>
                </svg>
            `;
            playSound('place-o');
        }
    }

    // AI Logic
    function aiMove() {
        if (!gameActive && boardState.includes(null) === false) return;

        let bestIndex;
        if (difficulty === 'easy') {
            bestIndex = getRandomMove();
        } else if (difficulty === 'medium') {
            bestIndex = getMediumMove();
        } else {
            bestIndex = getBestMoveMinimax();
        }

        if (bestIndex !== undefined && bestIndex !== null) {
            makeMove(bestIndex, 'O');

            if (checkWin('O')) {
                endGame(false, 'O');
                return;
            }

            if (checkDraw()) {
                endGame(true);
                return;
            }
        }

        gameActive = true;
        isXTurn = true;
        updateTurnIndicator();
    }

    function getRandomMove() {
        const availableIndices = [];
        boardState.forEach((val, idx) => {
            if (val === null) availableIndices.push(idx);
        });
        if (availableIndices.length === 0) return null;
        return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    function getMediumMove() {
        // 1. Try to win
        for (let combo of WINNING_COMBINATIONS) {
            const countO = combo.filter(i => boardState[i] === 'O').length;
            const countEmpty = combo.filter(i => boardState[i] === null).length;
            if (countO === 2 && countEmpty === 1) {
                return combo.find(i => boardState[i] === null);
            }
        }
        // 2. Try to block player X
        for (let combo of WINNING_COMBINATIONS) {
            const countX = combo.filter(i => boardState[i] === 'X').length;
            const countEmpty = combo.filter(i => boardState[i] === null).length;
            if (countX === 2 && countEmpty === 1) {
                return combo.find(i => boardState[i] === null);
            }
        }
        // 3. Take center if available
        if (boardState[4] === null) return 4;
        // 4. Random move
        return getRandomMove();
    }

    // Minimax Unbeatable AI
    function getBestMoveMinimax() {
        let bestScore = -Infinity;
        let move;
        for (let i = 0; i < 9; i++) {
            if (boardState[i] === null) {
                boardState[i] = 'O';
                let score = minimax(boardState, 0, false);
                boardState[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }

    function minimax(state, depth, isMaximizing) {
        if (checkWinState(state, 'O')) return 10 - depth;
        if (checkWinState(state, 'X')) return depth - 10;
        if (!state.includes(null)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (state[i] === null) {
                    state[i] = 'O';
                    let score = minimax(state, depth + 1, false);
                    state[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (state[i] === null) {
                    state[i] = 'X';
                    let score = minimax(state, depth + 1, true);
                    state[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    // Helper check states
    function checkWin(player) {
        return WINNING_COMBINATIONS.some(combination => {
            return combination.every(index => boardState[index] === player);
        });
    }

    function checkWinState(state, player) {
        return WINNING_COMBINATIONS.some(combination => {
            return combination.every(index => state[index] === player);
        });
    }

    function checkDraw() {
        return boardState.every(cell => cell !== null);
    }

    // End Game Handler
    function endGame(draw, winner = '') {
        gameActive = false;
        const currentLang = window.KibuI18n ? window.KibuI18n.getLang() : 'en';

        if (draw) {
            winnerText.className = 'winner-text draw';
            winnerText.textContent = currentLang === 'vi' ? 'HOÀ RỒI!' : "IT'S A DRAW!";
            playSound('draw');
            boardElement.classList.add('shake');
        } else {
            winnerText.className = `winner-text ${winner === 'X' ? 'x-win' : 'o-win'}`;
            winnerText.textContent = currentLang === 'vi' ? 
                `Bé ${winner} Thắng!` : 
                `KID ${winner} WINS!`;
            playSound('win');
            startConfetti();
        }

        setTimeout(() => {
            overlay.classList.add('visible');
        }, 600);
    }

    // Interactive Confetti System
    let confettiActive = false;
    let confettiParticles = [];
    const confettiColors = ['#00f0ff', '#ff007f', '#39ff14', '#ffff00', '#ff00ff'];

    function resizeCanvas() {
        canvas.width = overlay.clientWidth;
        canvas.height = overlay.clientHeight;
    }

    window.addEventListener('resize', resizeCanvas);

    function startConfetti() {
        resizeCanvas();
        confettiActive = true;
        confettiParticles = [];
        for (let i = 0; i < 100; i++) {
            confettiParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 6,
                color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 5 + 3,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5
            });
        }
        drawConfettiFrame();
    }

    function stopConfetti() {
        confettiActive = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawConfettiFrame() {
        if (!confettiActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confettiParticles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;

            if (p.y > canvas.height) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        });

        requestAnimationFrame(drawConfettiFrame);
    }

    // Setup mode triggers
    modePvp.addEventListener('click', () => {
        playSound('tap');
        gameMode = 'pvp';
        modePvp.classList.add('active');
        modePve.classList.remove('active');
        difficultyContainer.style.display = 'none';
        startGame();
    });

    modePve.addEventListener('click', () => {
        playSound('tap');
        gameMode = 'pve';
        modePve.classList.add('active');
        modePvp.classList.remove('active');
        difficultyContainer.style.display = 'flex';
        startGame();
    });

    // Difficulty click settings
    [diffEasy, diffMedium, diffHard].forEach((btn, idx) => {
        const levels = ['easy', 'medium', 'hard'];
        btn.addEventListener('click', () => {
            playSound('tap');
            difficulty = levels[idx];
            [diffEasy, diffMedium, diffHard].forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            startGame();
        });
    });

    // Restart & Rematch action listeners
    btnRestart.addEventListener('click', () => {
        playSound('tap');
        startGame();
    });

    btnRematch.addEventListener('click', () => {
        playSound('tap');
        startGame();
    });

    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Run setup immediately
    startGame();
})();
