(function () {
    'use strict';

    const STORE_KEY = 'kibu_animal_color_rescue_progress';
    const SOUND_KEY = 'kibu_animal_color_rescue_sound';
    const STAR = '\u2605';
    const LOCK = '\uD83D\uDD12';

    const palette = [
        { key: 'red', en: 'Red', vi: 'Đỏ', color: '#ff6b6b', dark: '#e03131', shadow: '#b92323' },
        { key: 'yellow', en: 'Yellow', vi: 'Vàng', color: '#ffd43b', dark: '#f59f00', shadow: '#b36d00' },
        { key: 'blue', en: 'Blue', vi: 'Xanh dương', color: '#4dabf7', dark: '#1c7ed6', shadow: '#0b5394' },
        { key: 'green', en: 'Green', vi: 'Xanh lá', color: '#69db7c', dark: '#2f9e44', shadow: '#1a6b2a' },
        { key: 'pink', en: 'Pink', vi: 'Hồng', color: '#f783ac', dark: '#d6336c', shadow: '#a61e4d' },
        { key: 'purple', en: 'Purple', vi: 'Tím', color: '#b197fc', dark: '#7048e8', shadow: '#4c2bbf' }
    ];

    const shapes = [
        { key: 'circle', en: 'Circle', vi: 'Hình tròn', symbol: '\u25CF' },
        { key: 'star', en: 'Star', vi: 'Ngôi sao', symbol: '\u2605' },
        { key: 'triangle', en: 'Triangle', vi: 'Tam giác', symbol: '\u25B2' },
        { key: 'square', en: 'Square', vi: 'Hình vuông', symbol: '\u25A0' },
        { key: 'heart', en: 'Heart', vi: 'Trái tim', symbol: '\u2665' }
    ];

    const sizes = [
        { key: 'small', en: 'Small', vi: 'Nhỏ', scale: 0.84 },
        { key: 'medium', en: 'Medium', vi: 'Vừa', scale: 1 },
        { key: 'big', en: 'Big', vi: 'Lớn', scale: 1.18 }
    ];

    const faces = ['\uD83D\uDC30', '\uD83D\uDC25', '\uD83D\uDC31', '\uD83D\uDC36', '\uD83D\uDC38', '\uD83E\uDD8A', '\uD83D\uDC3C', '\uD83D\uDC35'];
    const stickers = ['\uD83C\uDF3C', '\uD83C\uDF88', '\uD83C\uDF1F', '\uD83C\uDF4E', '\uD83C\uDF52', '\uD83C\uDF6D', '\uD83C\uDF35', '\uD83C\uDF81'];

    const text = {
        en: {
            appName: 'Animal Color Rescue',
            menu: 'Menu',
            levels: 'Levels',
            restart: 'Restart',
            sound: 'Sound',
            level: 'Level',
            tagline: 'Drag each friend to the right home.',
            colors: 'Colors',
            colorsHint: 'Match by red, yellow, blue, and more.',
            shapes: 'Shapes',
            shapesHint: 'Find the same circle, star, or heart.',
            sizes: 'Sizes',
            sizesHint: 'Sort small, medium, and big friends.',
            play: 'Play',
            chooseLevel: 'Choose a Level',
            back: 'Back',
            reset: 'Reset progress',
            greatJob: 'Great job!',
            next: 'Next Level',
            matchColors: 'Match each friend to the same color home.',
            matchShapes: 'Match each friend to the same shape home.',
            matchSizes: 'Match each friend to the same size home.',
            tryAgain: 'Try another home.',
            nice: 'Nice match!',
            allHome: 'Everyone found a home.',
            locked: 'Finish earlier levels first.'
        },
        vi: {
            appName: 'Giải Cứu Màu Sắc',
            menu: 'Menu',
            levels: 'Chọn Màn',
            restart: 'Chơi Lại',
            sound: 'Âm Thanh',
            level: 'Màn',
            tagline: 'Kéo từng bạn về đúng nhà.',
            colors: 'Màu sắc',
            colorsHint: 'Ghép đỏ, vàng, xanh và nhiều màu khác.',
            shapes: 'Hình dạng',
            shapesHint: 'Tìm cùng hình tròn, sao, trái tim.',
            sizes: 'Kích cỡ',
            sizesHint: 'Xếp bạn nhỏ, vừa và lớn.',
            play: 'Chơi',
            chooseLevel: 'Chọn Màn',
            back: 'Quay Lại',
            reset: 'Xóa tiến trình',
            greatJob: 'Giỏi lắm!',
            next: 'Màn Tiếp',
            matchColors: 'Ghép mỗi bạn vào nhà cùng màu.',
            matchShapes: 'Ghép mỗi bạn vào nhà cùng hình.',
            matchSizes: 'Ghép mỗi bạn vào nhà cùng kích cỡ.',
            tryAgain: 'Thử nhà khác nhé.',
            nice: 'Đúng rồi!',
            allHome: 'Tất cả đã về nhà.',
            locked: 'Hãy hoàn thành các màn trước.'
        }
    };

    const el = {
        shell: document.querySelector('.game-shell'),
        levelNumber: document.getElementById('level-number'),
        goal: document.getElementById('goal-text'),
        stars: document.getElementById('star-count'),
        playArea: document.getElementById('play-area'),
        targets: document.getElementById('target-zone'),
        tray: document.getElementById('tray'),
        toast: document.getElementById('toast'),
        rewards: document.getElementById('reward-strip'),
        menu: document.getElementById('menu-overlay'),
        levels: document.getElementById('levels-overlay'),
        win: document.getElementById('win-overlay'),
        levelGrid: document.getElementById('level-grid'),
        bigSticker: document.getElementById('big-sticker'),
        winCopy: document.getElementById('win-copy'),
        soundIcon: document.getElementById('sound-icon')
    };

    const state = {
        lang: 'en',
        level: 0,
        targets: [],
        pieces: [],
        dragging: null,
        moves: 0,
        mistakes: 0,
        sound: true,
        progress: { unlocked: 0, stars: {}, stickers: [] },
        winTimer: 0
    };

    const sfx = {
        ctx: null,
        wake() {
            if (this.ctx) return;
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) this.ctx = new AC();
        },
        tone(freq, dur, type, vol, slide) {
            if (!state.sound || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, now);
            if (slide) osc.frequency.exponentialRampToValueAtTime(slide, now + dur);
            gain.gain.setValueAtTime(vol || 0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + dur + 0.02);
        },
        pick() { this.tone(460, 0.07, 'sine', 0.05, 680); },
        ok() { this.tone(660, 0.08, 'triangle', 0.06, 920); },
        nope() { this.tone(190, 0.12, 'square', 0.04, 130); },
        win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'triangle', 0.09), i * 90)); }
    };

    function t(key) {
        return (text[state.lang] && text[state.lang][key]) || text.en[key] || key;
    }

    function label(item) {
        return state.lang === 'vi' ? item.vi : item.en;
    }

    function detectLang() {
        const kibu = window.KibuI18n && window.KibuI18n.lang;
        const route = window.KibuRoutes && window.KibuRoutes.parse(location.pathname);
        const stored = (() => {
            try { return localStorage.getItem('kibu_global_lang'); } catch (e) { return null; }
        })();
        state.lang = (route && route.lang) || kibu || stored || document.documentElement.lang || 'en';
        if (state.lang !== 'vi') state.lang = 'en';
    }

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state.progress)); } catch (e) { }
    }

    function load() {
        try {
            state.sound = localStorage.getItem(SOUND_KEY) !== '0';
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) Object.assign(state.progress, JSON.parse(raw));
        } catch (e) { }
        state.progress.unlocked = Math.max(0, Math.min(levels.length - 1, state.progress.unlocked || 0));
    }

    function saveSound() {
        try { localStorage.setItem(SOUND_KEY, state.sound ? '1' : '0'); } catch (e) { }
        el.soundIcon.className = state.sound ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }

    function makeLevels() {
        const out = [];
        for (let i = 0; i < 30; i++) {
            const kind = i < 10 ? 'color' : (i < 20 ? 'shape' : 'size');
            const count = Math.min(8, 3 + Math.floor(i / 3));
            out.push({ kind, count, seed: i * 17 + 5 });
        }
        return out;
    }

    const levels = makeLevels();

    function buildLevel(spec) {
        const pieces = [];
        let choices;
        if (spec.kind === 'color') choices = palette.slice(0, Math.min(6, 3 + Math.floor(spec.seed / 34)));
        else if (spec.kind === 'shape') choices = shapes.slice(0, Math.min(5, 3 + Math.floor((spec.seed - 170) / 51)));
        else choices = sizes;

        for (let i = 0; i < spec.count; i++) {
            const color = palette[(spec.seed + i * 2) % palette.length];
            const shape = shapes[(spec.seed + i) % shapes.length];
            const size = sizes[(spec.seed + i * 2) % sizes.length];
            const answer = choices[i % choices.length];
            pieces.push({
                id: 'p' + i,
                face: faces[(spec.seed + i) % faces.length],
                color: spec.kind === 'color' ? answer : color,
                shape: spec.kind === 'shape' ? answer : shape,
                size: spec.kind === 'size' ? answer : size,
                answer: answer.key,
                x: 0,
                y: 0,
                placed: false,
                node: null
            });
        }

        const targets = choices.map(choice => ({
            key: choice.key,
            choice,
            count: pieces.filter(p => p.answer === choice.key).length,
            placed: 0,
            node: null
        })).filter(target => target.count > 0);

        return { kind: spec.kind, pieces: shuffle(pieces, spec.seed), targets };
    }

    function shuffle(arr, seed) {
        const copy = arr.slice();
        let x = seed || 1;
        for (let i = copy.length - 1; i > 0; i--) {
            x = (x * 9301 + 49297) % 233280;
            const j = x % (i + 1);
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy;
    }

    function applyTexts() {
        document.querySelectorAll('[data-text]').forEach(node => {
            node.textContent = t(node.dataset.text);
        });
        el.goal.textContent = goalFor(state.targets.kind || 'color');
        document.title = t('appName') + ' - KIBU Games';
    }

    function goalFor(kind) {
        if (kind === 'shape') return t('matchShapes');
        if (kind === 'size') return t('matchSizes');
        return t('matchColors');
    }

    function show(node) { node.classList.remove('hidden'); }
    function hide(node) { node.classList.add('hidden'); }

    function startLevel(index) {
        window.clearTimeout(state.winTimer);
        state.level = Math.max(0, Math.min(levels.length - 1, index));
        const built = buildLevel(levels[state.level]);
        state.targets = built.targets;
        state.targets.kind = built.kind;
        state.pieces = built.pieces;
        state.moves = 0;
        state.mistakes = 0;
        hide(el.menu);
        hide(el.levels);
        hide(el.win);
        renderLevel();
    }

    function renderLevel() {
        el.levelNumber.textContent = state.level + 1;
        el.goal.textContent = goalFor(state.targets.kind);
        el.stars.textContent = totalStars();
        el.targets.innerHTML = '';
        el.tray.innerHTML = '';
        el.playArea.querySelectorAll('.piece').forEach(node => node.remove());
        el.targets.style.setProperty('--target-cols', Math.min(5, state.targets.length));
        el.targets.style.setProperty('--target-cols-mobile', Math.min(3, state.targets.length));

        state.targets.forEach(target => {
            const node = document.createElement('div');
            node.className = 'target';
            node.dataset.key = target.key;
            node.style.setProperty('--target-color', targetColor(target));
            node.innerHTML = '<div class="target-label"></div><div class="target-dock"></div>';
            node.querySelector('.target-label').appendChild(targetLabel(target));
            el.targets.appendChild(node);
            target.node = node;
        });

        state.pieces.forEach(piece => {
            const node = document.createElement('button');
            node.type = 'button';
            node.className = 'piece';
            node.dataset.id = piece.id;
            node.dataset.shape = piece.shape.symbol;
            node.setAttribute('aria-label', piece.face + ' ' + label(piece.color));
            node.style.setProperty('--piece-color', piece.color.color);
            node.style.setProperty('--piece-dark', piece.color.dark);
            node.style.setProperty('--piece-shadow', piece.color.shadow);
            node.style.setProperty('--piece-size', Math.round(76 * piece.size.scale) + 'px');
            node.innerHTML = '<span class="piece-face">' + piece.face + '</span>';
            el.playArea.appendChild(node);
            piece.node = node;
            wirePiece(piece);
        });

        requestAnimationFrame(layoutPieces);
        renderRewards();
    }

    function targetColor(target) {
        if (state.targets.kind === 'color') return target.choice.color;
        if (state.targets.kind === 'shape') return '#fff2b8';
        return target.choice.key === 'small' ? '#c3fae8' : (target.choice.key === 'medium' ? '#d0ebff' : '#ffd8a8');
    }

    function targetLabel(target) {
        const wrap = document.createElement('span');
        wrap.className = 'target-symbol';
        if (state.targets.kind === 'shape') wrap.textContent = target.choice.symbol + ' ' + label(target.choice);
        else if (state.targets.kind === 'size') wrap.textContent = sizeIcon(target.choice.key) + ' ' + label(target.choice);
        else wrap.textContent = label(target.choice);
        return wrap;
    }

    function sizeIcon(key) {
        if (key === 'small') return '\u25CF';
        if (key === 'medium') return '\u25CF\u25CF';
        return '\u25CF\u25CF\u25CF';
    }

    function layoutPieces() {
        const tray = el.tray.getBoundingClientRect();
        const area = el.playArea.getBoundingClientRect();
        if (!tray.width || !tray.height || !area.width) return;

        const unplaced = state.pieces.filter(p => !p.placed);
        const n = unplaced.length;
        if (n === 0) return;

        const availWidth = Math.max(100, tray.width - 24);
        const baseSizes = unplaced.map(p => Math.round(76 * p.size.scale));
        const sumBaseSizes = baseSizes.reduce((a, b) => a + b, 0);
        const minGap = n > 1 ? 4 : 0;
        const reqWidth = sumBaseSizes + (n - 1) * minGap;

        let fitScale = 1.0;
        if (reqWidth > availWidth) {
            fitScale = Math.max(0.48, availWidth / reqWidth);
        }

        const effectiveSizes = unplaced.map(p => Math.round(76 * p.size.scale * fitScale));
        const sumEffective = effectiveSizes.reduce((a, b) => a + b, 0);

        let gap = 0;
        if (n > 1) {
            gap = (availWidth - sumEffective) / (n - 1);
            gap = Math.max(2, Math.min(22, gap));
        }

        const actualTotalWidth = sumEffective + (n - 1) * gap;
        const startX = tray.left + (tray.width - actualTotalWidth) / 2;

        let currentX = startX;
        unplaced.forEach((piece, i) => {
            const size = effectiveSizes[i];
            piece.node.style.setProperty('--piece-size', size + 'px');

            const x = currentX - area.left;
            const y = tray.top + (tray.height - size) / 2 - area.top;

            placeNode(piece, x, y);
            piece.homeX = x;
            piece.homeY = y;

            currentX += size + gap;
        });
    }

    function placeNode(piece, x, y) {
        piece.x = x;
        piece.y = y;
        piece.node.style.left = Math.round(x) + 'px';
        piece.node.style.top = Math.round(y) + 'px';
    }

    function wirePiece(piece) {
        piece.node.addEventListener('pointerdown', ev => {
            if (piece.placed) return;
            sfx.wake();
            sfx.pick();
            piece.node.setPointerCapture(ev.pointerId);
            const rect = piece.node.getBoundingClientRect();
            const area = el.playArea.getBoundingClientRect();
            state.dragging = {
                piece,
                pointerId: ev.pointerId,
                dx: ev.clientX - rect.left,
                dy: ev.clientY - rect.top,
                areaLeft: area.left,
                areaTop: area.top
            };
            piece.node.classList.add('is-dragging');
            ev.preventDefault();
        });

        piece.node.addEventListener('pointermove', ev => {
            if (!state.dragging || state.dragging.piece !== piece) return;
            moveDragging(ev);
        });

        piece.node.addEventListener('pointerup', ev => dropPiece(piece, ev));
        piece.node.addEventListener('pointercancel', ev => dropPiece(piece, ev, true));
    }

    function moveDragging(ev) {
        if (!state.dragging) return;
        const d = state.dragging;
        const piece = d.piece;
        placeNode(piece, ev.clientX - d.areaLeft - d.dx, ev.clientY - d.areaTop - d.dy);
        highlightTarget(piece, ev.clientX, ev.clientY);
    }

    function highlightTarget(piece, x, y) {
        state.targets.forEach(tar => tar.node.classList.remove('is-ready'));
        const target = targetAt(x, y);
        if (target && canAccept(target, piece)) target.node.classList.add('is-ready');
    }

    function targetAt(x, y) {
        return state.targets.find(target => {
            const r = target.node.getBoundingClientRect();
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        });
    }

    function canAccept(target, piece) {
        return target.key === piece.answer && target.placed < target.count;
    }

    function dropPiece(piece, ev, cancelled) {
        if (!state.dragging || state.dragging.piece !== piece) return;
        piece.node.classList.remove('is-dragging');
        state.targets.forEach(tar => tar.node.classList.remove('is-ready'));
        const target = !cancelled && targetAt(ev.clientX, ev.clientY);
        if (target && canAccept(target, piece)) {
            state.moves++;
            snapToTarget(piece, target);
            sfx.ok();
            toast(t('nice'));
            if (state.pieces.every(p => p.placed)) finishLevel();
        } else {
            state.mistakes++;
            sfx.nope();
            piece.node.classList.add('wiggle');
            window.setTimeout(() => piece.node.classList.remove('wiggle'), 380);
            placeNode(piece, piece.homeX, piece.homeY);
            toast(t('tryAgain'));
        }
        state.dragging = null;
    }

    function snapToTarget(piece, target) {
        piece.placed = true;
        target.placed++;
        piece.node.classList.add('is-placed');
        target.node.classList.toggle('is-full', target.placed >= target.count);

        const naturalSize = Math.round(76 * piece.size.scale);
        piece.node.style.setProperty('--piece-size', naturalSize + 'px');

        const dock = target.node.querySelector('.target-dock').getBoundingClientRect();
        const area = el.playArea.getBoundingClientRect();
        const size = piece.node.offsetWidth || naturalSize;
        const offset = (target.placed - 1) - (target.count - 1) / 2;
        const x = dock.left + dock.width / 2 - size / 2 + offset * Math.min(34, size * 0.38) - area.left;
        const y = dock.top + dock.height / 2 - size / 2 - area.top;
        placeNode(piece, x, y);
        layoutPieces();
    }

    function finishLevel() {
        const earned = Math.max(1, 3 - Math.min(2, state.mistakes));
        const old = state.progress.stars[state.level] || 0;
        if (earned > old) state.progress.stars[state.level] = earned;
        state.progress.unlocked = Math.max(state.progress.unlocked || 0, Math.min(levels.length - 1, state.level + 1));
        const sticker = stickers[state.level % stickers.length];
        if (state.progress.stickers.indexOf(sticker) < 0) state.progress.stickers.push(sticker);
        save();
        renderRewards();
        el.stars.textContent = totalStars();
        el.bigSticker.textContent = sticker;
        el.winCopy.textContent = t('allHome') + ' ' + STAR.repeat(earned);
        sfx.win();
        state.winTimer = window.setTimeout(() => show(el.win), 500);
    }

    function totalStars() {
        return Object.keys(state.progress.stars || {}).reduce((sum, key) => sum + state.progress.stars[key], 0);
    }

    function renderRewards() {
        el.rewards.innerHTML = '';
        const list = state.progress.stickers.length ? state.progress.stickers : [stickers[0]];
        list.slice(-12).forEach(sticker => {
            const node = document.createElement('span');
            node.className = 'sticker';
            node.textContent = sticker;
            el.rewards.appendChild(node);
        });
    }

    function renderLevelGrid() {
        el.levelGrid.innerHTML = '';
        for (let i = 0; i < levels.length; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'level-btn';
            if (i === state.level) btn.classList.add('is-current');
            const locked = i > (state.progress.unlocked || 0);
            if (locked) btn.classList.add('is-locked');
            const stars = state.progress.stars[i] || 0;
            btn.innerHTML = '<span>' + (locked ? LOCK : (i + 1)) + '</span><span class="level-stars">' + (stars ? STAR.repeat(stars) : '') + '</span>';
            btn.addEventListener('click', () => {
                if (locked) {
                    toast(t('locked'));
                    sfx.nope();
                    return;
                }
                startLevel(i);
            });
            el.levelGrid.appendChild(btn);
        }
    }

    function toast(msg) {
        el.toast.textContent = msg;
        el.toast.hidden = false;
        window.clearTimeout(toast.timer);
        toast.timer = window.setTimeout(() => { el.toast.hidden = true; }, 900);
    }

    function resetProgress() {
        state.progress = { unlocked: 0, stars: {}, stickers: [] };
        save();
        renderLevelGrid();
        renderRewards();
        startLevel(0);
        show(el.levels);
    }

    function wireButtons() {
        document.getElementById('btn-play').addEventListener('click', () => startLevel(state.progress.unlocked || 0));
        document.getElementById('btn-home').addEventListener('click', () => show(el.menu));
        document.getElementById('btn-levels').addEventListener('click', () => { renderLevelGrid(); show(el.levels); });
        document.getElementById('btn-menu-levels').addEventListener('click', () => { renderLevelGrid(); show(el.levels); });
        document.getElementById('btn-levels-back').addEventListener('click', () => hide(el.levels));
        document.getElementById('btn-win-levels').addEventListener('click', () => { hide(el.win); renderLevelGrid(); show(el.levels); });
        document.getElementById('btn-restart').addEventListener('click', () => startLevel(state.level));
        document.getElementById('btn-next').addEventListener('click', () => startLevel(Math.min(levels.length - 1, state.level + 1)));
        document.getElementById('btn-reset').addEventListener('click', resetProgress);
        document.getElementById('btn-sound').addEventListener('click', () => {
            sfx.wake();
            state.sound = !state.sound;
            saveSound();
        });
        window.addEventListener('pointermove', moveDragging);
        window.addEventListener('pointerup', ev => {
            if (state.dragging) dropPiece(state.dragging.piece, ev);
        });
        window.addEventListener('pointercancel', ev => {
            if (state.dragging) dropPiece(state.dragging.piece, ev, true);
        });
        window.addEventListener('resize', () => requestAnimationFrame(layoutPlacedAndTray));
    }

    function layoutPlacedAndTray() {
        const placed = [];
        state.targets.forEach(target => target.placed = 0);
        state.pieces.forEach(piece => {
            if (piece.placed) {
                const target = state.targets.find(tar => tar.key === piece.answer);
                if (target) placed.push([piece, target]);
            }
        });
        placed.forEach(([piece, target]) => snapToTarget(piece, target));
        layoutPieces();
    }

    function init() {
        detectLang();
        load();
        applyTexts();
        saveSound();
        wireButtons();
        startLevel(state.progress.unlocked || 0);
        show(el.menu);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
