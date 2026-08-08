/* =========================================================
   ENGLISH QUEST — English Adventure (Mầm Non đến Lớp 5)
   Game học tiếng Anh cho trẻ em: từ vựng, hình ảnh Phonics,
   ngữ pháp, ghép câu, nối từ, nghe điền từ và phân loại.
   ========================================================= */

(() => {
    'use strict';

    /* =====================================================
       1. DỮ LIỆU BÀI HỌC

       Nội dung 120 bài nằm ở data/worlds.js. Chỗ này chỉ còn đúng một bảng:
       danh sách động từ bất quy tắc dùng để dựng bảng V1-V2-V3 trong hộp
       Ghi Nhớ của world 12 (xem getTheoryForWorld). Đừng xoá vì tưởng thừa —
       nó là nguồn duy nhất của bảng đó.
       ===================================================== */

    const VOCAB = [
        { w: 'speak', v2: 'spoke',  v3: 'spoken',  ipa: '/spiːk/',  vi: 'nói',          emoji: '🗣️', ex: 'I have spoken to my teacher.',        exVi: 'Tớ đã nói chuyện với cô giáo rồi.' },
        { w: 'draw',  v2: 'drew',   v3: 'drawn',   ipa: '/drɔː/',   vi: 'vẽ',           emoji: '🎨', ex: 'She has drawn a beautiful picture.',  exVi: 'Cô ấy đã vẽ một bức tranh rất đẹp.' },
        { w: 'catch', v2: 'caught', v3: 'caught',  ipa: '/kætʃ/',   vi: 'bắt, bắt kịp', emoji: '🥎', ex: 'He has caught the ball.',             exVi: 'Cậu ấy đã bắt được quả bóng.',
          tip: 'V2 và V3 giống hệt nhau: caught /kɔːt/' },
        { w: 'do',    v2: 'did',    v3: 'done',    ipa: '/duː/',    vi: 'làm',          emoji: '📋', ex: 'I have done my homework.',            exVi: 'Tớ đã làm xong bài tập về nhà.' },
        { w: 'eat',   v2: 'ate',    v3: 'eaten',   ipa: '/iːt/',    vi: 'ăn',           emoji: '🍕', ex: 'We have eaten a big pizza.',          exVi: 'Chúng tớ đã ăn một chiếc pizza to.' },
        { w: 'drink', v2: 'drank',  v3: 'drunk',   ipa: '/drɪŋk/',  vi: 'uống',         emoji: '🥤', ex: 'I have drunk two glasses of milk.',   exVi: 'Tớ đã uống hai cốc sữa.' },
        { w: 'run',   v2: 'ran',    v3: 'run',     ipa: '/rʌn/',    vi: 'chạy',         emoji: '🏃', ex: 'They have run five kilometres.',      exVi: 'Họ đã chạy được năm ki-lô-mét.',
          tip: 'V3 giống hệt V1: run → ran → run' },
        { w: 'swim',  v2: 'swam',   v3: 'swum',    ipa: '/swɪm/',   vi: 'bơi',          emoji: '🏊', ex: 'She has swum across the lake.',       exVi: 'Cô ấy đã bơi qua hồ.',
          tip: 'Nhớ theo vần i → a → u: swim, swam, swum' },
        { w: 'sing',  v2: 'sang',   v3: 'sung',    ipa: '/sɪŋ/',    vi: 'hát',          emoji: '🎤', ex: 'We have sung this song before.',      exVi: 'Chúng tớ đã hát bài này trước đây rồi.',
          tip: 'Cùng vần với swim: sing, sang, sung' },
        { w: 'write', v2: 'wrote',  v3: 'written', ipa: '/raɪt/',   vi: 'viết',         emoji: '✍️', ex: 'He has written a long letter.',       exVi: 'Cậu ấy đã viết một lá thư dài.' },
        { w: 'read',  v2: 'read',   v3: 'read',    ipa: '/riːd/',   vi: 'đọc',          emoji: '📖', ex: 'I have read this book twice.',        exVi: 'Tớ đã đọc quyển sách này hai lần.',
          tip: 'Viết giống nhau nhưng V2/V3 đọc là /red/ chứ không phải /riːd/' },
        { w: 'make',  v2: 'made',   v3: 'made',    ipa: '/meɪk/',   vi: 'làm, tạo ra',  emoji: '🎂', ex: 'My mum has made a chocolate cake.',   exVi: 'Mẹ tớ đã làm một chiếc bánh sô-cô-la.' },
        { w: 'buy',   v2: 'bought', v3: 'bought',  ipa: '/baɪ/',    vi: 'mua',          emoji: '🛒', ex: 'They have bought a new car.',         exVi: 'Họ đã mua một chiếc ô tô mới.',
          tip: 'Đừng nhầm với brought (V3 của bring = mang đến)' },
        { w: 'take',  v2: 'took',   v3: 'taken',   ipa: '/teɪk/',   vi: 'cầm, lấy',     emoji: '📸', ex: 'She has taken many photos today.',    exVi: 'Hôm nay cô ấy đã chụp rất nhiều ảnh.' },
        { w: 'give',  v2: 'gave',   v3: 'given',   ipa: '/ɡɪv/',    vi: 'cho, tặng',    emoji: '🎁', ex: 'He has given me a present.',          exVi: 'Cậu ấy đã tặng tớ một món quà.' },
        { w: 'come',  v2: 'came',   v3: 'come',    ipa: '/kʌm/',    vi: 'đến',          emoji: '🚪', ex: 'My friends have come to my house.',   exVi: 'Các bạn tớ đã đến nhà tớ.',
          tip: 'V3 giống hệt V1: come → came → come' },
        { w: 'sleep', v2: 'slept',  v3: 'slept',   ipa: '/sliːp/',  vi: 'ngủ',          emoji: '😴', ex: 'The baby has slept for two hours.',   exVi: 'Em bé đã ngủ được hai tiếng.' },
        { w: 'sit',   v2: 'sat',    v3: 'sat',     ipa: '/sɪt/',    vi: 'ngồi',         emoji: '🪑', ex: 'We have sat here since morning.',     exVi: 'Chúng tớ đã ngồi đây từ sáng.' },
        { w: 'stand', v2: 'stood',  v3: 'stood',   ipa: '/stænd/',  vi: 'đứng',         emoji: '🧍', ex: 'They have stood in line for an hour.', exVi: 'Họ đã đứng xếp hàng được một tiếng.' },
        { w: 'fly',   v2: 'flew',   v3: 'flown',   ipa: '/flaɪ/',   vi: 'bay',          emoji: '✈️', ex: 'The plane has flown to Ha Noi.',      exVi: 'Chiếc máy bay đã bay đến Hà Nội.' },
        { w: 'go',    v2: 'went',   v3: 'gone',    ipa: '/ɡəʊ/',    vi: 'đi',           emoji: '🚶', ex: 'She has gone to school.',             exVi: 'Cô ấy đã đi học rồi.',
          tip: 'V2 và V3 khác hẳn nguyên thể: go → went → gone. Phân biệt gone (đã đi chưa về) và been (đã đến và quay về)' },
        { w: 'see',   v2: 'saw',    v3: 'seen',    ipa: '/siː/',    vi: 'thấy, nhìn thấy', emoji: '👁️', ex: 'I have seen this movie twice.',        exVi: 'Tớ đã xem bộ phim này hai lần.',
          tip: 'see → saw → seen' },
        { w: 'know',  v2: 'knew',   v3: 'known',   ipa: '/nəʊ/',    vi: 'biết, hiểu',   emoji: '🧠', ex: 'We have known each other for 5 years.', exVi: 'Chúng tớ đã biết nhau được 5 năm.',
          tip: 'Theo vần -ow → -ew → -own: know, knew, known' },
        { w: 'find',  v2: 'found',  v3: 'found',   ipa: '/faɪnd/',  vi: 'tìm thấy',     emoji: '🔍', ex: 'He has found his lost keys.',          exVi: 'Cậu ấy đã tìm thấy chìa khóa bị mất.',
          tip: 'V2 và V3 giống hệt nhau: found /faʊnd/' },
        { w: 'think', v2: 'thought', v3: 'thought', ipa: '/θɪŋk/',  vi: 'suy nghĩ, nghĩ', emoji: '💡', ex: 'I have thought about this all day.',   exVi: 'Tớ đã suy nghĩ về việc này cả ngày.',
          tip: 'V2/V3 là thought /θɔːt/, cùng vần -ought với bought/caught' },
        { w: 'tell',  v2: 'told',   v3: 'told',    ipa: '/tel/',    vi: 'kể, nói cho biết', emoji: '📢', ex: 'She has told me a funny story.',      exVi: 'Cô ấy đã kể cho tớ một câu chuyện buồn cười.' },
        { w: 'meet',  v2: 'met',    v3: 'met',     ipa: '/miːt/',   vi: 'gặp mặt',      emoji: '🤝', ex: 'Have you met the new teacher yet?',    exVi: 'Bạn đã gặp giáo viên mới chưa?',
          tip: 'Nguyên âm rút ngắn: /miːt/ thành /met/' },
        { w: 'win',   v2: 'won',    v3: 'won',     ipa: '/wɪn/',    vi: 'thắng, đoạt giải', emoji: '🏆', ex: 'Our team has won the gold medal.',    exVi: 'Đội của chúng tớ đã giành huy chương vàng.',
          tip: 'V2 và V3 đọc là /wʌn/ (giống âm số 1 - one)' },
        { w: 'drive', v2: 'drove',  v3: 'driven',  ipa: '/draɪv/',  vi: 'lái xe',       emoji: '🚗', ex: 'Dad has driven 500 km today.',        exVi: 'Hôm nay bố tớ đã lái xe 500 cây số.' },
        { w: 'grow',  v2: 'grew',   v3: 'grown',   ipa: '/ɡrəʊ/',   vi: 'lớn lên, trồng', emoji: '🌱', ex: 'The plant has grown very fast.',      exVi: 'Cây nhỏ đã lớn rất nhanh.' }
    ];

    /* ---------- Tra cứu bài học trong ENGLISH_WORLDS ---------- */

    function getAllLevels() {
        if (!window.ENGLISH_WORLDS) return [];
        return window.ENGLISH_WORLDS.flatMap(w => w.levels);
    }

    function findLevel(id) {
        if (!window.ENGLISH_WORLDS) return null;
        for (const w of window.ENGLISH_WORLDS) {
            const l = w.levels.find(lvl => lvl.id === id);
            if (l) return { world: w, level: l };
        }
        return null;
    }

    const MAX_HEARTS = 5;
    const SAVE_KEY = 'english_adventure_save_v2';
    const OLD_SAVE_KEY = 'english_quest_pp_v1';

    // Không còn lựa chọn "Tất cả": bản đồ luôn hiển thị đúng một khối lớp.
    // Mặc định Mầm non, nhưng nếu bé đã học rồi thì pickStartingGrade() nhảy
    // thẳng tới khối bé đang học dở, khỏi phải bấm lại mỗi lần vào.
    let activeGradeFilter = '0';
    let activeWorldId = 'world-1';
    let isGridMode = true;

    /* =====================================================
       2. TRẠNG THÁI & LƯU TIẾN TRÌNH
       ===================================================== */

    let save = { xp: 0, best: 0, stars: {}, unlockedLevels: {} };

    function loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                save = {
                    xp: Number(parsed.xp) || 0,
                    best: Number(parsed.best) || 0,
                    stars: (parsed.stars && typeof parsed.stars === 'object') ? parsed.stars : {},
                    unlockedLevels: (parsed.unlockedLevels && typeof parsed.unlockedLevels === 'object') ? parsed.unlockedLevels : {}
                };
            }
        } catch (e) {
            console.warn('Không đọc được tiến trình đã lưu:', e);
        }
    }

    function persist() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(save));
        } catch (e) {
            console.warn('Không lưu được tiến trình:', e);
        }
    }

    // Trạng thái của lượt chơi hiện tại
    const run = {
        station: null,
        world: null,
        idx: 0,
        hearts: MAX_HEARTS,
        xp: 0,
        combo: 0,
        bestCombo: 0,
        mistakes: 0,
        answered: false,
        selected: -1,
        tray: [],
        matchSel: null,
        matchLeft: 0,
        sortWrong: 0
    };

    let soundOn = true;

    /* =====================================================
       2b. GHI NHỚ VỊ TRÍ ĐANG HỌC (chống mất bài khi F5)
       ===================================================== */

    const RUN_KEY = 'english_quest_run_v1';
    let navLock = false;   // chặn vòng lặp khi tự đổi địa chỉ URL

    function saveRun() {
        if (!run.station) return;
        try {
            localStorage.setItem(RUN_KEY, JSON.stringify({
                id: run.station.id,
                idx: run.idx,
                answered: run.answered,
                hearts: run.hearts,
                xp: run.xp,
                combo: run.combo,
                bestCombo: run.bestCombo,
                mistakes: run.mistakes
            }));
        } catch (e) {
            console.warn('Không lưu được vị trí đang học:', e);
        }
    }

    function clearRun() {
        try { localStorage.removeItem(RUN_KEY); } catch (e) { /* bỏ qua */ }
    }

    function readRun() {
        try {
            const d = JSON.parse(localStorage.getItem(RUN_KEY) || 'null');
            if (!d || !d.id) return null;
            const found = findLevel(d.id);
            if (!found) { clearRun(); return null; }
            return { data: d, station: found.level, world: found.world };
        } catch (e) {
            clearRun();
            return null;
        }
    }

    /** Nạp lại đúng chặng và đúng câu mà bé đang làm dở. */
    function resumeRun() {
        const found = readRun();
        if (!found) return false;
        const { data: d, station: st } = found;

        run.station = st;
        run.world = found.world;
        run.hearts = Math.min(MAX_HEARTS, Math.max(1, Number(d.hearts) || MAX_HEARTS));
        run.xp = Math.max(0, Number(d.xp) || 0);
        run.combo = Math.max(0, Number(d.combo) || 0);
        run.bestCombo = Math.max(0, Number(d.bestCombo) || 0);
        run.mistakes = Math.max(0, Number(d.mistakes) || 0);

        // Câu đã chấm điểm rồi thì vào lại là sang câu kế tiếp, tránh cộng điểm hai lần
        let idx = Math.max(0, Number(d.idx) || 0);
        if (d.answered) idx++;

        $('play-icon').textContent = found.world ? found.world.icon : '📖';
        $('play-title').innerHTML = st.title;
        setHash(st.id);
        showScreen('play');

        if (idx >= st.items.length) {
            // Bé vừa xong câu cuối thì tải lại trang -> trao thưởng luôn
            run.idx = st.items.length - 1;
            run.answered = true;
            updateBars();
            finishStation(true);
        } else {
            run.idx = idx;
            renderItem();
            showToast('📖 Đã quay lại đúng chỗ bé đang học!');
        }
        return true;
    }

    /* ---------- Đồng bộ địa chỉ URL để nút Back hoạt động ---------- */

    function setHash(id) {
        const target = id ? '#' + id : '';
        const current = window.location.hash;
        if (current === target) return;
        navLock = true;
        try {
            if (target) {
                window.location.hash = target;
            } else {
                window.history.replaceState(null, '',
                    window.location.pathname + window.location.search);
                navLock = false;
            }
        } catch (e) {
            navLock = false;
        }
    }

    function stationFromHash() {
        const id = (window.location.hash || '').replace(/^#/, '');
        if (!id) return null;
        const found = findLevel(id);
        return found ? found.level : null;
    }

    /* =====================================================
       3. TIỆN ÍCH
       ===================================================== */

    const $ = id => document.getElementById(id);

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function normalize(s) {
        return String(s)
            .toLowerCase()
            .replace(/[’‘`´]/g, "'")
            .replace(/[.,!?;:]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    let toastTimer = null;
    function showToast(msg) {
        const t = $('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
    }

    /* ---------- Âm thanh hiệu ứng sinh động (WebAudio Synthesizer) ---------- */
    const sfx = {
        ctx: null,
        init() {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        },
        tone(freq, dur, type = 'sine', vol = 0.15, endFreq = null) {
            if (!soundOn || !this.ctx) return;
            try {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, t);
                if (endFreq) {
                    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
                }
                gain.gain.setValueAtTime(vol, t);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                osc.connect(gain).connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + dur);
            } catch (e) {}
        },
        click() {
            // Nút bấm giòn giã kiểu pop-bubble
            this.tone(420, 0.05, 'sine', 0.12, 780);
        },
        correct() {
            // Chuỗi âm thanh chúc mừng 3 nốt tươi vui (C5 - E5 - G5 - C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((f, i) => {
                setTimeout(() => this.tone(f, 0.18, 'triangle', 0.18), i * 70);
            });
        },
        wrong() {
            // Âm thanh báo sai nhẹ nhàng kiểu nhún bồng bềnh (không làm bé sợ)
            this.tone(260, 0.2, 'sine', 0.16, 130);
            setTimeout(() => this.tone(180, 0.25, 'triangle', 0.14, 90), 80);
        },
        combo() {
            // Âm thanh thưởng combo chuỗi đúng (Chime lấp lánh)
            this.tone(880, 0.12, 'sine', 0.15, 1320);
            setTimeout(() => this.tone(1320, 0.2, 'sine', 0.18, 1760), 60);
        },
        win() {
            // Nhạc khải hoàn khi hoàn thành 1 bài học (Duolingo Fanfare)
            const fanfare = [
                { f: 523.25, d: 0.12 }, // C5
                { f: 659.25, d: 0.12 }, // E5
                { f: 783.99, d: 0.12 }, // G5
                { f: 1046.50, d: 0.22 }, // C6
                { f: 880.00, d: 0.12 },  // A5
                { f: 1046.50, d: 0.35 }  // C6 rực rỡ
            ];
            fanfare.forEach((n, i) => {
                setTimeout(() => this.tone(n.f, n.d, 'triangle', 0.2), i * 110);
            });
        },
        fail() {
            // Nhạc ngắt quãng dịu dàng khi hết tim
            const notes = [440, 392, 349, 293];
            notes.forEach((f, i) => {
                setTimeout(() => this.tone(f, 0.22, 'sine', 0.14, f * 0.8), i * 120);
            });
        }
    };

    /* ---------- Đọc tiếng Anh (Text-to-Speech) ---------- */
    const TTS_OK = 'speechSynthesis' in window;
    const PREF_KEY = 'english_quest_voice_v1';
    let voices = [];
    let prefs = { voiceURI: '', rate: 0.85 };

    // Giọng "chế" của macOS — nghe như robot, tuyệt đối không dùng để dạy phát âm
    const NOVELTY_VOICES = /bahh|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|bad news|good news|deranged|hysterical|princess|trinoids|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i;

    function loadPrefs() {
        try {
            const raw = localStorage.getItem(PREF_KEY);
            if (raw) {
                const p = JSON.parse(raw);
                if (typeof p.voiceURI === 'string') prefs.voiceURI = p.voiceURI;
                if (Number(p.rate) > 0) prefs.rate = Number(p.rate);
            }
        } catch (e) {
            console.warn('Không đọc được cài đặt giọng đọc:', e);
        }
    }

    function savePrefs() {
        try {
            localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
        } catch (e) {
            console.warn('Không lưu được cài đặt giọng đọc:', e);
        }
    }

    function refreshVoices() {
        if (!TTS_OK || !window.speechSynthesis) return;
        voices = window.speechSynthesis.getVoices() || [];
    }

    /** Chỉ lấy giọng tiếng Anh thật, bỏ hết giọng hài hước. */
    function englishVoices() {
        if (!voices.length) refreshVoices();
        return voices
            .filter(v => /^en([-_]|$)/i.test(v.lang) && !NOVELTY_VOICES.test(v.name))
            .sort((a, b) => voiceScore(b) - voiceScore(a));
    }

    /** Điểm chất lượng: càng cao càng nghe giống người thật. */
    function voiceScore(v) {
        let s = 0;
        if (/premium|enhanced|neural|natural/i.test(v.name)) s += 100;   // giọng cao cấp tải thêm
        if (v.localService === false) s += 45;                          // giọng chạy qua mạng (Google…)
        if (/^en[-_]US/i.test(v.lang)) s += 20;
        else if (/^en[-_]GB/i.test(v.lang)) s += 14;
        else if (/^en[-_]AU/i.test(v.lang)) s += 8;
        if (/ava|zoe|allison|susan|serena|samantha|karen|daniel|google|siri/i.test(v.name)) s += 10;
        if (/compact/i.test(v.name)) s -= 30;                           // bản nén, nghe máy móc
        return s;
    }

    function voiceQuality(v) {
        if (/premium|enhanced|neural|natural/i.test(v.name)) return { label: '✨ Cao cấp', cls: 'q-best' };
        if (v.localService === false) return { label: '🌐 Giọng mạng', cls: 'q-good' };
        return { label: 'Cơ bản', cls: 'q-basic' };
    }

    function pickVoice() {
        const list = englishVoices();
        if (!list.length) return null;
        if (prefs.voiceURI) {
            const saved = list.find(v => v.voiceURI === prefs.voiceURI);
            if (saved) return saved;
        }
        return list[0]; // đã sắp xếp theo điểm chất lượng
    }

    let passageAudioState = 'idle'; // 'idle' | 'playing' | 'paused'
    let currentPassagePlain = '';

    function stopPassageAudio() {
        if (!TTS_OK || !window.speechSynthesis) return;
        try { window.speechSynthesis.cancel(); } catch (e) {}
        passageAudioState = 'idle';
        updatePassageUI();
    }

    function updatePassageUI() {
        const playBtn = $('btn-passage-play');
        const replayBtn = $('btn-passage-replay');
        const statusBadge = $('passage-status');
        const playIcon = $('passage-play-icon');
        const playTxt = $('passage-play-txt');

        if (!playBtn) return;

        if (passageAudioState === 'playing') {
            playBtn.classList.add('pause-mode');
            if (playIcon) playIcon.className = 'fa-solid fa-circle-pause';
            if (playTxt) playTxt.textContent = 'Tạm dừng';
            if (replayBtn) replayBtn.style.display = 'inline-flex';
            if (statusBadge) {
                statusBadge.style.display = 'inline-block';
                statusBadge.textContent = '🔊 Đang đọc...';
            }
        } else if (passageAudioState === 'paused') {
            playBtn.classList.remove('pause-mode');
            if (playIcon) playIcon.className = 'fa-solid fa-circle-play';
            if (playTxt) playTxt.textContent = 'Nghe tiếp';
            if (replayBtn) replayBtn.style.display = 'inline-flex';
            if (statusBadge) {
                statusBadge.style.display = 'inline-block';
                statusBadge.textContent = '⏸️ Đã tạm dừng';
            }
        } else {
            playBtn.classList.remove('pause-mode');
            if (playIcon) playIcon.className = 'fa-solid fa-circle-play';
            if (playTxt) playTxt.textContent = 'Nghe cả bài';
            if (replayBtn) replayBtn.style.display = 'none';
            if (statusBadge) statusBadge.style.display = 'none';
        }
    }

    function handlePassagePlayClick(plainText) {
        if (!TTS_OK || !window.speechSynthesis) {
            showToast('⚠️ Trình duyệt này không hỗ trợ đọc tiếng Anh');
            return;
        }

        if (passageAudioState === 'idle') {
            try { window.speechSynthesis.cancel(); } catch (e) {}
            const textToSpeak = String(plainText || currentPassagePlain).replace(/<[^>]+>/g, '');
            const u = new SpeechSynthesisUtterance(textToSpeak);
            const v = pickVoice();
            if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-US'; }
            u.rate = prefs.rate;
            u.pitch = 1;
            u.volume = 1;

            u.onstart = () => { passageAudioState = 'playing'; updatePassageUI(); };
            u.onpause = () => { passageAudioState = 'paused'; updatePassageUI(); };
            u.onresume = () => { passageAudioState = 'playing'; updatePassageUI(); };
            u.onend = () => { passageAudioState = 'idle'; updatePassageUI(); };
            u.onerror = () => { passageAudioState = 'idle'; updatePassageUI(); };

            passageAudioState = 'playing';
            updatePassageUI();
            window.speechSynthesis.speak(u);
        } else if (passageAudioState === 'playing') {
            window.speechSynthesis.pause();
            passageAudioState = 'paused';
            updatePassageUI();
        } else if (passageAudioState === 'paused') {
            window.speechSynthesis.resume();
            passageAudioState = 'playing';
            updatePassageUI();
        }
    }

    function handlePassageReplayClick(plainText) {
        if (!TTS_OK || !window.speechSynthesis) return;
        try { window.speechSynthesis.cancel(); } catch (e) {}
        passageAudioState = 'idle';
        updatePassageUI();
        handlePassagePlayClick(plainText);
    }

    function speak(text, rateOverride) {
        if (!TTS_OK || !window.speechSynthesis) {
            showToast('⚠️ Trình duyệt này không hỗ trợ đọc tiếng Anh');
            return;
        }
        stopPassageAudio();
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ''));
            const v = pickVoice();
            if (v) {
                u.voice = v;
                u.lang = v.lang;
            } else {
                u.lang = 'en-US';
            }
            u.rate = rateOverride || prefs.rate;
            u.pitch = 1;   // giữ nguyên cao độ tự nhiên của giọng
            u.volume = 1;
            window.speechSynthesis.speak(u);
        } catch (e) {
            console.warn('TTS lỗi:', e);
        }
    }

    /* ---------- Bảng chọn giọng đọc ---------- */
    function renderVoiceList() {
        const box = $('voice-list');
        const list = englishVoices();

        if (!list.length) {
            box.innerHTML = `<p class="voice-empty">😕 Chưa tìm thấy giọng tiếng Anh nào trên thiết bị này.
                Xem hướng dẫn tải giọng ở phần bên dưới nhé.</p>`;
        } else {
            const active = pickVoice();
            box.innerHTML = list.map(v => {
                const q = voiceQuality(v);
                const on = active && v.voiceURI === active.voiceURI;
                return `
                    <div class="voice-row ${on ? 'on' : ''}" data-uri="${escapeHtml(v.voiceURI)}">
                        <button class="voice-play" data-play="${escapeHtml(v.voiceURI)}" title="Nghe thử">▶</button>
                        <div class="voice-info">
                            <b>${escapeHtml(v.name)}</b>
                            <small>${escapeHtml(v.lang)}</small>
                        </div>
                        <span class="voice-q ${q.cls}">${q.label}</span>
                        <span class="voice-check">${on ? '✔' : ''}</span>
                    </div>`;
            }).join('');
        }

        box.querySelectorAll('.voice-row').forEach(row => {
            row.addEventListener('click', e => {
                if (e.target.closest('.voice-play')) return;
                prefs.voiceURI = row.dataset.uri;
                savePrefs();
                renderVoiceList();
                speak('Hello! I have finished my homework.');
                showToast('🎙️ Đã chọn giọng đọc mới');
            });
        });

        box.querySelectorAll('.voice-play').forEach(btn => {
            btn.addEventListener('click', () => {
                const v = englishVoices().find(x => x.voiceURI === btn.dataset.play);
                if (!v) return;
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance('Hello! I have finished my homework.');
                u.voice = v;
                u.lang = v.lang;
                u.rate = prefs.rate;
                u.pitch = 1;
                window.speechSynthesis.speak(u);
            });
        });

        document.querySelectorAll('.speed-btn').forEach(b => {
            b.classList.toggle('on', Number(b.dataset.rate) === prefs.rate);
        });
    }

    function popXP(amount) {
        const btn = $('btn-check');
        const r = btn.getBoundingClientRect();
        const el = document.createElement('div');
        el.className = 'xp-pop';
        el.textContent = '+' + amount + ' 💎';
        el.style.left = (r.left + r.width / 2 - 40) + 'px';
        el.style.top = (r.top - 10) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    function confetti(n = 34) {
        const colors = ['#ffd700', '#ff007f', '#00f0ff', '#3ddc84', '#9d4edd', '#ff8c42'];
        for (let i = 0; i < n; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + 'vw';
            c.style.top = '-20px';
            c.style.background = colors[i % colors.length];
            c.style.animationDelay = (Math.random() * 0.4) + 's';
            c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 2200);
        }
    }

    /* =====================================================
       4. MÀN HÌNH BẢN ĐỒ (12 WORLDS / 120 LEVELS)
       ===================================================== */

    function isLevelUnlocked(lvl) {
        if (!lvl) return false;
        if (lvl.order === 1 || (lvl.id && lvl.id.endsWith('-l1')) || lvl.id === 'w1-l1') return true;
        if (save.unlockedLevels && save.unlockedLevels[lvl.id]) return true;
        const all = getAllLevels();
        const idx = all.findIndex(l => l.id === lvl.id);
        if (idx > 0) {
            const prev = all[idx - 1];
            if ((save.stars && save.stars[prev.id]) > 0) return true;
        }
        return false;
    }

    let searchQuery = '';

    function normalizeText(str) {
        if (!str) return '';
        return String(str)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function starRow(n, cls) {
        let out = '';
        for (let i = 0; i < 3; i++) out += `<span class="${i < n ? 'on' : 'off'}">⭐</span>`;
        return `<div class="${cls}">${out}</div>`;
    }

    function renderGradeTabs() {
        document.querySelectorAll('.grade-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.grade === activeGradeFilter);
            tab.onclick = () => {
                sfx.click();
                activeGradeFilter = tab.dataset.grade;
                const worlds = getFilteredWorlds();
                if (worlds.length > 0 && !worlds.some(w => w.id === activeWorldId)) {
                    activeWorldId = worlds[0].id;
                }
                renderGradeTabs();
                renderMap();
            };
        });
    }

    function getFilteredWorlds() {
        if (!window.ENGLISH_WORLDS) return [];
        const gNum = Number(activeGradeFilter);
        return window.ENGLISH_WORLDS.filter(w => w.gradeMin <= gNum && w.gradeMax >= gNum);
    }

    /** Chọn khối lớp mở sẵn khi vào trang: khối chứa bài xa nhất bé từng học.
     *  Bé mới hoàn toàn thì về Mầm non. */
    function pickStartingGrade() {
        if (!window.ENGLISH_WORLDS) return;
        let furthest = null;
        for (const w of window.ENGLISH_WORLDS) {
            for (const l of w.levels) {
                if (save.stars[l.id] > 0 || save.unlockedLevels[l.id]) furthest = w;
            }
        }
        if (!furthest) return;
        activeGradeFilter = String(furthest.gradeMin);
        activeWorldId = furthest.id;
    }

    function renderMap() {
        const worlds = getFilteredWorlds();
        const worldNav = $('world-nav');
        const worldNavContainer = $('world-nav-container');
        const searchInput = $('lesson-search-input');
        const clearBtn = $('btn-clear-search');
        const gradeFilterBar = document.querySelector('.grade-filter-bar');
        const sectionTitle = $('map-section-title');
        
        if (!worlds.some(w => w.id === activeWorldId) && worlds.length > 0) {
            activeWorldId = worlds[0].id;
        }

        const activeWorld = window.ENGLISH_WORLDS.find(w => w.id === activeWorldId) || worlds[0];

        // Apply grid mode or carousel mode
        if (worldNav && worldNavContainer) {
            worldNav.classList.toggle('grid-mode', isGridMode);
            worldNavContainer.classList.toggle('is-grid', isGridMode);
            const toggleText = $('view-toggle-text');
            if (toggleText) {
                toggleText.textContent = isGridMode ? 'Thanh Trượt' : 'Dạng Lưới';
            }
        }

        worldNav.innerHTML = worlds.map(w => {
            const completedCount = w.levels.filter(l => (save.stars[l.id] || 0) > 0).length;
            const isSelected = w.id === activeWorldId;
            const titleClean = w.title.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\s]+/u, '').trim();
            return `
                <div class="world-card ${isSelected ? 'active' : ''}" data-world="${w.id}">
                    <div class="w-icon">${w.icon}</div>
                    <div class="w-info">
                        <div class="w-title" title="${escapeHtml(titleClean)}">${titleClean}</div>
                        <span class="w-grade">${w.grade} · ${completedCount}/10</span>
                    </div>
                </div>`;
        }).join('');

        worldNav.querySelectorAll('.world-card').forEach(card => {
            card.onclick = () => {
                sfx.click();
                activeWorldId = card.dataset.world;
                renderMap();
            };
        });

        if (activeWorld) {
            $('current-world-title').textContent = `${activeWorld.title} (${activeWorld.grade} · ${activeWorld.subtitle})`;
        }

        const grid = $('station-grid');
        const doing = readRun();
        const query = searchQuery.trim();

        if (clearBtn) clearBtn.style.display = query ? 'grid' : 'none';

        if (query) {
            // Chế độ Tìm kiếm nhanh
            if (worldNavContainer) worldNavContainer.style.display = 'none';
            if (gradeFilterBar) gradeFilterBar.style.display = 'none';

            const normQ = normalizeText(query);
            const matches = [];

            window.ENGLISH_WORLDS.forEach(w => {
                w.levels.forEach(lvl => {
                    const matchTitle = normalizeText(lvl.title).includes(normQ);
                    const matchTopic = normalizeText(lvl.topic).includes(normQ);
                    const matchDesc = normalizeText(lvl.desc || '').includes(normQ);
                    const matchWorld = normalizeText(w.title).includes(normQ) || normalizeText(w.grade).includes(normQ);
                    const matchWords = lvl.items.some(it => it.w && normalizeText(it.w.w + ' ' + (it.w.vi || '')).includes(normQ));

                    if (matchTitle || matchTopic || matchDesc || matchWorld || matchWords) {
                        matches.push({ level: lvl, world: w });
                    }
                });
            });

            if (sectionTitle) {
                sectionTitle.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Tìm thấy <b>${matches.length}</b> bài học phù hợp cho "${escapeHtml(query)}"`;
            }

            if (matches.length === 0) {
                grid.innerHTML = `
                    <div class="search-empty-state">
                        <i class="fa-solid fa-face-frown-open"></i>
                        <div>Không tìm thấy bài học nào phù hợp với từ khóa "${escapeHtml(query)}"</div>
                        <small style="display:block; margin-top:8px; color:var(--ink-3)">Thử tìm từ khác như: <i>Animals, Present Perfect, Lớp 3, Colors...</i></small>
                    </div>`;
            } else {
                grid.innerHTML = matches.map(({ level: lvl, world: w }) => {
                    const stars = save.stars[lvl.id] || 0;
                    const unlocked = isLevelUnlocked(lvl);
                    const isDoing = doing && doing.station.id === lvl.id;
                    return `
                        <button class="station-row ${stars === 3 ? 'mastered' : ''} ${isDoing ? 'doing' : ''} ${!unlocked ? 'locked' : ''}"
                                data-station="${lvl.id}" ${!unlocked ? 'disabled' : ''} style="--st-color:${w.color}">
                            <span class="st-index">${lvl.order}</span>
                            <span class="st-icon">${unlocked ? (lvl.isBoss ? '👑' : w.icon) : '🔒'}</span>
                            <span class="st-body">
                                <span class="st-head">
                                    <span class="st-title">Lv ${lvl.order}. ${lvl.title}</span>
                                    <span class="st-flag done" style="background:var(--surface-2); color:var(--duo-blue); border-color:var(--border)">${w.grade} · ${w.title}</span>
                                    ${isDoing ? '<span class="st-flag">Đang học dở</span>' : ''}
                                    ${stars === 3 ? '<span class="st-flag done">Đã thuộc</span>' : ''}
                                </span>
                                <span class="st-desc">${lvl.desc || lvl.topic}</span>
                                <span class="st-meta">${lvl.topic} · ${lvl.items.length} câu</span>
                            </span>
                            <span class="st-right">
                                ${unlocked ? starRow(stars, 'st-stars') : '<span class="st-lock-txt">Khóa 🔒</span>'}
                                <span class="st-go">${unlocked ? (stars ? 'LUYỆN LẠI' : 'BẮT ĐẦU') : 'CHƯA MỞ'} ▶</span>
                            </span>
                        </button>`;
                }).join('');
            }
        } else {
            // Chế độ bản đồ bình thường
            if (worldNavContainer) worldNavContainer.style.display = isGridMode ? 'grid' : 'flex';
            if (gradeFilterBar) gradeFilterBar.style.display = 'flex';
            if (sectionTitle) {
                sectionTitle.innerHTML = `<i class="fa-solid fa-layer-group"></i> Chọn khối lớp &amp; Thế giới bài học`;
            }

            const levels = activeWorld ? activeWorld.levels : [];

            grid.innerHTML = levels.map((lvl, i) => {
                const stars = save.stars[lvl.id] || 0;
                const unlocked = isLevelUnlocked(lvl);
                const isDoing = doing && doing.station.id === lvl.id;
                return `
                    <button class="station-row ${stars === 3 ? 'mastered' : ''} ${isDoing ? 'doing' : ''} ${!unlocked ? 'locked' : ''}"
                            data-station="${lvl.id}" ${!unlocked ? 'disabled' : ''} style="--st-color:${activeWorld.color}">
                        <span class="st-index">${lvl.order}</span>
                        <span class="st-icon">${unlocked ? (lvl.isBoss ? '👑' : activeWorld.icon) : '🔒'}</span>
                        <span class="st-body">
                            <span class="st-head">
                                <span class="st-title">Lv ${lvl.order}. ${lvl.title}</span>
                                ${isDoing ? '<span class="st-flag">Đang học dở</span>' : ''}
                                ${stars === 3 ? '<span class="st-flag done">Đã thuộc</span>' : ''}
                                ${lvl.isBoss ? '<span class="st-flag boss">Boss Level</span>' : ''}
                            </span>
                            <span class="st-desc">${lvl.desc || lvl.topic}</span>
                            <span class="st-meta">${lvl.topic} · ${lvl.items.length} câu</span>
                        </span>
                        <span class="st-right">
                            ${unlocked ? starRow(stars, 'st-stars') : '<span class="st-lock-txt">Khóa 🔒</span>'}
                            <span class="st-go">${unlocked ? (stars ? 'LUYỆN LẠI' : 'BẮT ĐẦU') : 'CHƯA MỞ'} ▶</span>
                        </span>
                    </button>`;
            }).join('');
        }

        grid.querySelectorAll('.station-row:not([disabled])').forEach(card => {
            card.addEventListener('click', () => {
                sfx.init();
                sfx.click();
                startStation(card.dataset.station);
            });
        });

        renderResumeBar();

        const allLvl = getAllLevels();
        const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
        const doneCount = Object.values(save.stars).filter(v => v > 0).length;
        $('stat-xp').textContent = save.xp;
        $('stat-stars').textContent = `${totalStars}/${allLvl.length * 3}`;
        $('stat-streak').textContent = save.best;
        $('stat-done').textContent = `${doneCount}/${allLvl.length}`;
    }

    function renderResumeBar() {
        const bar = $('resume-bar');
        const found = readRun();
        if (!found) {
            bar.classList.remove('show');
            return;
        }
        const { data: d, station: st, world: w } = found;
        const total = st.items.length;
        const at = Math.min(total, (Number(d.idx) || 0) + (d.answered ? 2 : 1));
        $('rs-title').innerHTML = `${w ? w.icon : '📖'} ${st.title}`;
        $('rs-sub').textContent = `Đang ở câu ${at}/${total} · ❤️ ${d.hearts} · 💎 ${d.xp}`;
        bar.classList.add('show');
    }

    function showScreen(name) {
        $('screen-map').classList.toggle('active', name === 'map');
        $('screen-play').classList.toggle('active', name === 'play');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function stationFromHash() {
        const id = (window.location.hash || '').replace(/^#/, '');
        if (!id) return null;
        const found = findLevel(id);
        return found ? found.level : null;
    }

    /* =====================================================
       5. VÒNG CHƠI
       ===================================================== */

    function startStation(id) {
        const found = findLevel(id);
        if (!found) return;
        const st = found.level;
        run.station = st;
        run.world = found.world;
        run.idx = 0;
        run.hearts = MAX_HEARTS;
        run.xp = 0;
        run.combo = 0;
        run.bestCombo = 0;
        run.mistakes = 0;
        $('play-icon').textContent = found.world ? found.world.icon : '📖';
        $('play-title').innerHTML = st.title;
        setHash(st.id);
        showScreen('play');
        renderItem();
    }

    function currentItem() {
        return run.station.items[run.idx];
    }

    function updateBars() {
        const total = run.station.items.length;
        $('progress-fill').style.width = ((run.idx / total) * 100) + '%';
        $('play-count').textContent = `Câu ${run.idx + 1} / ${total}`;
        let hearts = '';
        for (let i = 0; i < MAX_HEARTS; i++) hearts += `<span class="${i < run.hearts ? '' : 'lost'}">❤️</span>`;
        $('hearts').innerHTML = hearts;
        $('run-xp').textContent = run.xp;
        $('run-combo').textContent = run.combo;
        $('combo-chip').classList.toggle('hot', run.combo >= 2);
        saveRun();
    }

    function setCheckButton(label, enabled) {
        const b = $('btn-check');
        b.textContent = label;
        b.disabled = !enabled;
    }

    function hideFeedback() {
        const fb = $('feedback');
        fb.className = 'feedback';
        fb.innerHTML = '';
    }

    function showFeedback(ok, title, text) {
        const fb = $('feedback');
        fb.className = 'feedback show ' + (ok ? 'ok' : 'no');
        fb.innerHTML = `
            <span class="fb-ic">${ok ? '🎉' : '💡'}</span>
            <div>
                <div class="fb-title">${title}</div>
                <div class="fb-text">${text}</div>
            </div>`;
    }

    /* ---------- Vẽ từng dạng bài ---------- */

    function renderItem() {
        stopPassageAudio();
        const it = currentItem();
        run.answered = false;
        run.selected = -1;
        run.tray = [];
        run.matchSel = null;
        run.sortWrong = 0;
        hideFeedback();
        updateBars();

        const stage = $('stage');
        switch (it.kind) {
            case 'card':   renderCard(stage, it); break;
            case 'choice': renderChoice(stage, it); break;
            case 'fill':   renderFill(stage, it); break;
            case 'listen': renderListen(stage, it); break;
            case 'build':  renderBuild(stage, it); break;
            case 'match':  renderMatch(stage, it); break;
            case 'sort':   renderSort(stage, it); break;
            default:       stage.innerHTML = '<p class="q-hint">Dạng bài chưa hỗ trợ.</p>';
        }
    }

    // --- Phân loại (Sorting) ---
    function renderSort(stage, it) {
        const leftItems = it.pairs.map(p => ({ text: p[0], type: 'left' }));
        const rightItems = it.pairs.map(p => ({ text: p[1], type: 'right' }));
        const allChips = shuffle([...leftItems, ...rightItems]);

        stage.innerHTML = `
            <div class="q-prompt" style="font-size:1.25rem">🗂️ ${escapeHtml(it.title)}</div>
            <p class="q-hint">Bấm từng từ rồi chọn đúng cột phân loại tương ứng.</p>
            <div class="sort-container">
                <div class="sort-bucket" data-bucket="left">
                    <h5>${escapeHtml(it.leftLabel)}</h5>
                    <div id="bucket-left" class="sort-items"></div>
                </div>
                <div class="sort-bucket" data-bucket="right">
                    <h5>${escapeHtml(it.rightLabel)}</h5>
                    <div id="bucket-right" class="sort-items"></div>
                </div>
            </div>
            <div class="bank-label" style="margin-top:16px;">Danh sách từ</div>
            <div id="sort-bank" class="hint-chips">
                ${allChips.map((c, i) => `<button class="chip" data-idx="${i}" data-type="${c.type}">${escapeHtml(c.text)}</button>`).join('')}
            </div>`;

        let selectedChip = null;
        const bank = $('sort-bank');
        const bLeft = $('bucket-left');
        const bRight = $('bucket-right');
        let placed = 0;
        const total = allChips.length;

        // Đếm số mảnh bỏ nhầm cột. Không có biến này thì phần chấm điểm chỉ
        // biết "bé đã xếp xong", chứ không biết xếp đúng hay sai.
        run.sortWrong = 0;

        bank.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (run.answered || chip.classList.contains('used')) return;
                sfx.click();
                bank.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                selectedChip = chip;
            });
        });

        stage.querySelectorAll('.sort-bucket').forEach(bucket => {
            bucket.addEventListener('click', () => {
                if (!selectedChip || run.answered) return;
                sfx.click();
                const bucketType = bucket.dataset.bucket;
                const chipType = selectedChip.dataset.type;
                const targetBox = bucketType === 'left' ? bLeft : bRight;

                const item = document.createElement('div');
                const isOk = bucketType === chipType;
                if (!isOk) run.sortWrong++;
                item.className = 'chip ' + (isOk ? 'ok' : 'bad');
                item.textContent = selectedChip.textContent;
                targetBox.appendChild(item);

                selectedChip.classList.add('used');
                selectedChip.classList.remove('selected');
                selectedChip = null;
                placed++;

                if (placed >= total) {
                    setCheckButton('KIỂM TRA', true);
                }
            });
        });

        setCheckButton('KIỂM TRA', false);
    }

    function passageHtml() {
        const p = run.station.passage;
        if (!p) return '';
        currentPassagePlain = p.plain || p.text || '';
        return `
            <div class="passage">
                <div class="passage-header">
                    <h4>📔 ${escapeHtml(p.title)}</h4>
                    <div class="passage-controls">
                        <button id="btn-passage-play" class="btn-passage-btn" data-passage="${escapeHtml(currentPassagePlain)}">
                            <i id="passage-play-icon" class="fa-solid fa-circle-play"></i> <span id="passage-play-txt">Nghe cả bài</span>
                        </button>
                        <button id="btn-passage-replay" class="btn-passage-btn replay-btn" data-passage="${escapeHtml(currentPassagePlain)}" style="display:none">
                            <i class="fa-solid fa-rotate-left"></i> <span>Tải lại</span>
                        </button>
                        <span id="passage-status" class="passage-status-badge" style="display:none"></span>
                    </div>
                </div>
                <div class="passage-pics">${p.pics ? p.pics.join(' ') : ''}</div>
                <div>${p.text.replace(/\n/g, '<br>')}</div>
            </div>`;
    }

    function picHtml(emoji) {
        if (!emoji) return '';
        return `<div class="pic-frame"><span class="pic-emoji">${emoji}</span></div>`;
    }

    function renderCard(stage, it) {
        const v = it.w;
        stage.innerHTML = `
            ${picHtml(v.emoji)}
            <div class="vocab-word">${escapeHtml(v.w)}</div>
            <div class="vocab-ipa">${escapeHtml(v.ipa || '')}</div>
            <div class="vocab-vi">${escapeHtml(v.vi)}</div>
            <div class="speak-row">
                <button class="btn-speak" data-speak="${escapeHtml(v.w)}">
                    <i class="fa-solid fa-volume-high"></i> Nghe từ
                </button>
                <button class="btn-speak small" data-speak="${escapeHtml(v.w)}" data-slow="1">
                    🐢 Nghe chậm
                </button>
            </div>
            ${v.v2 && v.v3 ? `
            <div class="vocab-forms">
                <div class="form-pill"><small>V1</small><b>${escapeHtml(v.w)}</b></div>
                <div class="form-pill"><small>V2</small><b>${escapeHtml(v.v2)}</b></div>
                <div class="form-pill v3"><small>V3 · dùng ở thì này</small><b>${escapeHtml(v.v3)}</b></div>
            </div>` : ''}
            ${v.tip ? `<div class="vocab-tip">💡 <b>Mẹo nhớ:</b> ${escapeHtml(v.tip)}</div>` : ''}
            ${v.ex ? `
            <div class="vocab-example">
                <div class="en">${escapeHtml(v.ex)}</div>
                <div class="vi">${escapeHtml(v.exVi || '')}</div>
                <button class="btn-speak small" style="margin-top:10px" data-speak="${escapeHtml(v.ex)}">
                    <i class="fa-solid fa-volume-high"></i> Nghe câu ví dụ
                </button>
            </div>` : ''}`;
        setCheckButton('TỚ THUỘC RỒI ➡️', true);
        speak(v.w);
    }

    function renderChoice(stage, it) {
        const keys = ['A', 'B', 'C', 'D', 'E'];

        // Trong dữ liệu, cả 101 câu trắc nghiệm đều để đáp án đúng ở opts[0].
        // Cứ hiện theo thứ tự gốc thì bé bấm A là đúng hết, không cần đọc câu
        // hỏi — bài kiểm tra hoá ra không đo được gì. Xáo vị trí hiển thị,
        // nhưng data-opt vẫn mang chỉ số gốc nên phần chấm điểm ở dưới
        // (so với it.ans) không phải đổi gì.
        const order = shuffle(it.opts.map((o, i) => ({ o, i })));

        stage.innerHTML = `
            ${passageHtml()}
            ${picHtml(it.emoji)}
            <div class="q-prompt">${it.prompt}</div>
            ${it.speak ? `<div class="speak-row"><button class="btn-speak small" data-speak="${escapeHtml(it.speak)}"><i class="fa-solid fa-volume-high"></i> Nghe câu</button></div>` : ''}
            <div class="opts">
                ${order.map((e, pos) => `
                    <button class="opt" data-opt="${e.i}">
                        <span class="key">${keys[pos]}</span>
                        <span>${e.o}</span>
                    </button>`).join('')}
            </div>`;

        stage.querySelectorAll('.opt').forEach(btn => {
            btn.addEventListener('click', () => {
                if (run.answered) return;
                sfx.click();
                run.selected = Number(btn.dataset.opt);
                stage.querySelectorAll('.opt').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                setCheckButton('KIỂM TRA', true);
            });
        });
        setCheckButton('KIỂM TRA', false);
    }

    function renderFill(stage, it) {
        stage.innerHTML = `
            ${passageHtml()}
            ${picHtml(it.emoji)}
            <div class="q-prompt">
                ${it.prompt.replace(/_{3,}/g, '<span class="blank">&nbsp;</span>')}
                ${it.cue ? `<span class="cue">${escapeHtml(it.cue)}</span>` : ''}
            </div>
            <p class="q-hint">${escapeHtml(it.hint || 'Chia động từ trong ngoặc rồi gõ vào ô bên dưới 👇')}</p>
            <div class="fill-row">
                <input id="fill-input" class="fill-input" type="text" autocomplete="off"
                       autocapitalize="off" spellcheck="false" placeholder="gõ đáp án…">
            </div>
            <div class="bank-label">Gợi ý — bấm để chèn nhanh</div>
            <div class="hint-chips">
                ${shuffle(it.bank || []).map(w => `<button class="chip" data-word="${escapeHtml(w)}">${escapeHtml(w)}</button>`).join('')}
            </div>`;
        bindFillInput(stage);
    }

    function renderListen(stage, it) {
        stage.innerHTML = `
            ${picHtml(it.emoji)}
            <div class="speak-row">
                <button class="btn-speak" data-speak="${escapeHtml(it.sentence)}">
                    <i class="fa-solid fa-headphones"></i> Nghe câu
                </button>
                <button class="btn-speak small" data-speak="${escapeHtml(it.sentence)}" data-slow="1">
                    🐢 Nghe chậm
                </button>
            </div>
            ${TTS_OK ? '' : `<p class="q-hint">⚠️ Trình duyệt không đọc được. Câu là: <b>${escapeHtml(it.sentence)}</b></p>`}
            <div class="q-prompt">${it.display.replace(/_{3,}/g, '<span class="blank">&nbsp;</span>')}</div>
            <p class="q-hint">Nghe kỹ rồi điền từ còn thiếu vào ô trống 👇</p>
            <div class="fill-row">
                <input id="fill-input" class="fill-input" type="text" autocomplete="off"
                       autocapitalize="off" spellcheck="false" placeholder="từ còn thiếu…">
            </div>
            <div class="bank-label">Gợi ý — bấm để chèn nhanh</div>
            <div class="hint-chips">
                ${shuffle(it.bank || []).map(w => `<button class="chip" data-word="${escapeHtml(w)}">${escapeHtml(w)}</button>`).join('')}
            </div>`;
        bindFillInput(stage);
        setTimeout(() => speak(it.sentence), 350);
    }

    function bindFillInput(stage) {
        const input = $('fill-input');
        const sync = () => setCheckButton('KIỂM TRA', input.value.trim().length > 0);

        input.addEventListener('input', sync);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && input.value.trim()) {
                e.preventDefault();
                onCheckClick();
            }
        });

        stage.querySelectorAll('.hint-chips .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (run.answered) return;
                sfx.click();
                const cur = input.value.trim();
                input.value = cur ? cur + ' ' + chip.dataset.word : chip.dataset.word;
                input.focus();
                sync();
            });
        });

        setCheckButton('KIỂM TRA', false);
        setTimeout(() => input.focus({ preventScroll: true }), 60);
    }

    function renderBuild(stage, it) {
        const words = it.target.split(' ');
        stage.innerHTML = `
            ${picHtml(it.emoji)}
            <div class="q-prompt" style="font-size:1.15rem">🇻🇳 ${escapeHtml(it.vi)}</div>
            <p class="q-hint">Bấm vào các mảnh từ để xếp thành câu tiếng Anh đúng.</p>
            <div id="build-tray" class="build-tray"></div>
            <div class="bank-label">Kho từ</div>
            <div id="build-bank" class="build-bank">
                ${shuffle(words.map((w, i) => ({ w, i })))
                    .map(o => `<button class="chip" data-i="${o.i}">${escapeHtml(o.w)}</button>`).join('')}
            </div>`;

        const bank = $('build-bank');
        const tray = $('build-tray');

        function redrawTray() {
            tray.innerHTML = run.tray
                .map(o => `<button class="chip" data-tray="${o.i}">${escapeHtml(o.w)}</button>`).join('');
            tray.querySelectorAll('.chip').forEach(c => {
                c.addEventListener('click', () => {
                    if (run.answered) return;
                    sfx.click();
                    const i = Number(c.dataset.tray);
                    run.tray = run.tray.filter(o => o.i !== i);
                    const back = bank.querySelector(`.chip[data-i="${i}"]`);
                    if (back) back.classList.remove('used');
                    redrawTray();
                    setCheckButton('KIỂM TRA', run.tray.length > 0);
                });
            });
        }

        bank.querySelectorAll('.chip').forEach(c => {
            c.addEventListener('click', () => {
                if (run.answered || c.classList.contains('used')) return;
                sfx.click();
                c.classList.add('used');
                run.tray.push({ i: Number(c.dataset.i), w: c.textContent });
                redrawTray();
                setCheckButton('KIỂM TRA', true);
            });
        });

        setCheckButton('KIỂM TRA', false);
    }

    function renderMatch(stage, it) {
        const left = shuffle(it.pairs.map((p, i) => ({ t: p[0], i })));
        const right = shuffle(it.pairs.map((p, i) => ({ t: p[1], i })));
        run.matchLeft = it.pairs.length;

        stage.innerHTML = `
            <div class="q-prompt" style="font-size:1.25rem">🔗 ${escapeHtml(it.title)}</div>
            <p class="q-hint">Bấm một ô bên trái, rồi bấm ô tương ứng bên phải để nối.</p>
            <div class="match-board">
                <div class="match-col">
                    <h5>${it.leftLabel}</h5>
                    ${left.map(o => `<button class="m-item" data-side="L" data-i="${o.i}">${escapeHtml(o.t)}</button>`).join('')}
                </div>
                <div class="match-col">
                    <h5>${it.rightLabel}</h5>
                    ${right.map(o => `<button class="m-item" data-side="R" data-i="${o.i}">${escapeHtml(o.t)}</button>`).join('')}
                </div>
            </div>`;

        stage.querySelectorAll('.m-item').forEach(el => {
            el.addEventListener('click', () => onMatchClick(stage, el, it));
        });

        setCheckButton('NỐI HẾT ĐỂ TIẾP TỤC', false);
    }

    function onMatchClick(stage, el, it) {
        if (run.answered || el.classList.contains('done')) return;
        sfx.click();

        if (!run.matchSel) {
            stage.querySelectorAll('.m-item').forEach(x => x.classList.remove('sel'));
            el.classList.add('sel');
            run.matchSel = el;
            return;
        }

        if (run.matchSel === el) {
            el.classList.remove('sel');
            run.matchSel = null;
            return;
        }

        if (run.matchSel.dataset.side === el.dataset.side) {
            run.matchSel.classList.remove('sel');
            el.classList.add('sel');
            run.matchSel = el;
            return;
        }

        const ok = run.matchSel.dataset.i === el.dataset.i;
        const a = run.matchSel;
        const b = el;
        run.matchSel = null;
        a.classList.remove('sel');

        if (ok) {
            sfx.correct();
            a.classList.add('done');
            b.classList.add('done');
            run.matchLeft--;
            if (run.matchLeft <= 0) {
                run.answered = true;
                const gain = award();
                popXP(gain);
                showFeedback(true, 'Hoàn thành nối từ! 🎉', 'Bé ghép đúng toàn bộ các cặp.');
                setCheckButton(run.idx === run.station.items.length - 1 ? 'HOÀN THÀNH BÀI 🏁' : 'TIẾP TỤC ➡️', true);
            }
        } else {
            sfx.wrong();
            a.classList.add('shake');
            b.classList.add('shake');
            setTimeout(() => { a.classList.remove('shake'); b.classList.remove('shake'); }, 400);
        }
    }

    /* =====================================================
       6. ĐÁNH GIÁ & CHẤM ĐIỂM
       ===================================================== */

    function award() {
        run.combo++;
        if (run.combo > run.bestCombo) run.bestCombo = run.combo;
        const base = 10;
        const bonus = run.combo >= 5 ? 10 : (run.combo >= 3 ? 5 : 0);
        const total = base + bonus;
        run.xp += total;
        updateBars();
        return total;
    }

    function loseHeart() {
        run.combo = 0;
        run.mistakes++;
        run.hearts = Math.max(0, run.hearts - 1);
        updateBars();
        if (run.hearts <= 0) finishStation(false);
    }

    function onCheckClick() {
        if (!run.station) return;
        const it = currentItem();

        if (run.answered) {
            nextItem();
            return;
        }

        let ok = false;
        let userText = '';

        if (it.kind === 'card') {
            ok = true;
        } else if (it.kind === 'choice') {
            if (run.selected < 0) return;
            ok = run.selected === it.ans;
            userText = it.opts[it.ans];
            const btn = $('stage').querySelector(`.opt[data-opt="${run.selected}"]`);
            if (btn) btn.classList.add(ok ? 'correct' : 'wrong');
            if (!ok) {
                const rightBtn = $('stage').querySelector(`.opt[data-opt="${it.ans}"]`);
                if (rightBtn) rightBtn.classList.add('correct');
            }
        } else if (it.kind === 'fill' || it.kind === 'listen') {
            const input = $('fill-input');
            const val = input.value.trim();
            if (!val) return;
            const normVal = normalize(val);
            ok = it.answers.some(a => normalize(a) === normVal);
            userText = it.answers[0];
            input.classList.add(ok ? 'ok' : 'bad');
            input.disabled = true;
        } else if (it.kind === 'build') {
            const built = run.tray.map(o => o.w).join(' ');
            ok = built.toLowerCase() === it.target.toLowerCase();
            $('stage').querySelectorAll('.chip').forEach(c => {
                c.disabled = true;
                if (!c.classList.contains('used')) c.classList.add(ok ? 'ok' : 'bad');
            });
            userText = it.target.replace(/ ([.?!,])/g, '$1');
        } else if (it.kind === 'sort') {
            ok = (run.sortWrong || 0) === 0;
            userText = 'xếp đúng cả ' + (it.pairs.length * 2) + ' từ vào hai cột';
        }

        run.answered = true;

        if (ok) {
            const gain = award();
            popXP(gain);
            if (run.combo >= 3) {
                sfx.combo();
            } else {
                sfx.correct();
            }
            const praise = ['Chính xác! 🎉', 'Tuyệt vời! ⭐', 'Giỏi quá! 👏', 'Quá đỉnh! 🚀'];
            showFeedback(true, praise[run.combo % praise.length],
                (it.why || '') + (run.combo >= 3 ? ` <b>🔥 Chuỗi ${run.combo} câu đúng liên tiếp!</b>` : ''));
        } else {
            sfx.wrong();
            showFeedback(false, 'Chưa đúng rồi 💪',
                `Đáp án đúng là: <b>${escapeHtml(userText)}</b><br>${it.why || ''}`);
            loseHeart();
        }

        if (run.hearts > 0) {
            setCheckButton(run.idx === run.station.items.length - 1 ? 'HOÀN THÀNH BÀI 🏁' : 'TIẾP TỤC ➡️', true);
        }

        saveRun();

        if (it.kind === 'build') speak(it.target.replace(/ ([.?!,])/g, '$1'));
        else if (it.kind === 'listen') speak(it.sentence);
    }

    function nextItem() {
        run.idx++;
        if (run.idx >= run.station.items.length) {
            finishStation(true);
            return;
        }
        renderItem();
    }

    /* =====================================================
       7. KẾT THÚC CHẶNG / BÀI HỌC
       ===================================================== */

    function finishStation(completed) {
        const st = run.station;
        const answerable = st.items.filter(i => i.kind !== 'card').length || 1;
        const acc = Math.max(0, Math.round((1 - run.mistakes / answerable) * 100));

        let stars = 0;
        if (completed) stars = run.mistakes === 0 ? 3 : (run.mistakes <= 2 ? 2 : 1);

        save.xp += run.xp;
        if (run.bestCombo > save.best) save.best = run.bestCombo;
        if (stars > (save.stars[st.id] || 0)) save.stars[st.id] = stars;

        if (completed && stars > 0) {
            const all = getAllLevels();
            const currIdx = all.findIndex(l => l.id === st.id);
            if (currIdx >= 0 && currIdx < all.length - 1) {
                const nextLvl = all[currIdx + 1];
                save.unlockedLevels[nextLvl.id] = true;
            }
        }

        persist();
        clearRun();

        $('progress-fill').style.width = completed ? '100%' : $('progress-fill').style.width;

        if (completed) {
            sfx.win();
            confetti(stars === 3 ? 60 : 34);
            $('res-emoji').textContent = stars === 3 ? '🏆' : (stars === 2 ? '🎉' : '👍');
            $('res-title').textContent = 'Hoàn thành ' + st.title + '!';
            $('res-sub').innerHTML = stars === 3
                ? 'Xuất sắc! Bé làm đúng tất cả các câu 🌟'
                : 'Làm tốt lắm! Xem lại phần giải thích rồi thử lấy 3 sao nhé.';
        } else {
            sfx.fail();
            $('res-emoji').textContent = '💔';
            $('res-title').textContent = 'Hết tim mất rồi!';
            $('res-sub').innerHTML = 'Không sao đâu, sai là cách học nhanh nhất. Cùng thử lại nào!';
        }

        let starsHtml = '';
        for (let i = 0; i < 3; i++) starsHtml += `<span class="${i < stars ? 'on' : 'off'}">⭐</span>`;
        $('res-stars').innerHTML = starsHtml;

        $('res-xp').textContent = run.xp;
        $('res-acc').textContent = (completed ? acc : 0) + '%';
        $('res-streak').textContent = run.bestCombo;

        const all = getAllLevels();
        const currIdx = all.findIndex(l => l.id === st.id);
        const hasNext = completed && currIdx < all.length - 1;
        $('btn-res-next').style.display = hasNext ? '' : 'none';
        $('btn-res-next').dataset.next = hasNext ? all[currIdx + 1].id : '';

        openModal('modal-result');
        renderMap();
    }

    /* =====================================================
       8. MODAL & SỰ KIỆN GHI NHỚ CHI TIẾT (12 WORLDS)
       ===================================================== */

    function openModal(id) { $(id).classList.add('open'); }
    function closeModal(id) { $(id).classList.remove('open'); }

    function getTheoryForWorld(worldId) {
        switch (worldId) {
            case 'world-1':
                return {
                    title: '🎈 Ghi Nhớ Mầm Non: Phonics A-Z, Màu Sắc & Số Đếm 1–10',
                    blocks: [
                        {
                            head: '1. Bảng Chữ Cái Phonics A – Z',
                            type: 'list',
                            items: [
                                '🅰️ <b>A</b> - Apple 🍎 (quả táo) · <b>B</b> - Ball ⚽ (quả bóng)',
                                '🐱 <b>C</b> - Cat (con mèo) · <b>D</b> - Dog 🐶 (con chó)',
                                '🐘 <b>E</b> - Elephant · <b>F</b> - Fish 🐟 · <b>G</b> - Giraffe 🦒',
                                '🧢 <b>H</b> - Hat · <b>I</b> - Ice 🧊 · <b>J</b> - Juice 🧃',
                                '🦁 <b>L</b> - Lion · <b>M</b> - Monkey 🐒 · <b>N</b> - Nest 🪹',
                                '🐼 <b>P</b> - Panda · <b>S</b> - Sun ☀️ · <b>T</b> - Tiger 🐅'
                            ]
                        },
                        {
                            head: '2. Màu Sắc Cơ Bản (Colors)',
                            type: 'signals',
                            signals: [
                                { word: 'Red 🔴', desc: 'Màu đỏ' },
                                { word: 'Blue 🔵', desc: 'Màu xanh dương' },
                                { word: 'Yellow 🟡', desc: 'Màu vàng' },
                                { word: 'Green 🟢', desc: 'Màu xanh lá' },
                                { word: 'Pink 🩷', desc: 'Màu hồng' },
                                { word: 'Orange 🟠', desc: 'Màu cam' }
                            ]
                        },
                        {
                            head: '3. Số Đếm 1 đến 10 (Numbers)',
                            type: 'grid',
                            items: [
                                '1️⃣ <b>One</b> (Một)', '2️⃣ <b>Two</b> (Hai)', '3️⃣ <b>Three</b> (Ba)', '4️⃣ <b>Four</b> (Bốn)', '5️⃣ <b>Five</b> (Năm)',
                                '6️⃣ <b>Six</b> (Sáu)', '7️⃣ <b>Seven</b> (Bảy)', '8️⃣ <b>Eight</b> (Tám)', '9️⃣ <b>Nine</b> (Chín)', '🔟 <b>Ten</b> (Mười)'
                            ]
                        },
                        {
                            head: '💡 Mẹo cho bé Mầm non',
                            type: 'note',
                            text: 'Bố mẹ cho bé bấm nút loa 🔊 nghe phát âm chuẩn mỗi ngày. Nhìn tranh và gọi tên bằng tiếng Anh để bé thẩm âm tự nhiên!'
                        }
                    ]
                };

            case 'world-2':
                return {
                    title: '🧸 Ghi Nhớ Mầm Non: Gia Đình, Trái Cây & Cảm Xúc',
                    blocks: [
                        {
                            head: '1. Thành Viên Gia Đình (Family)',
                            type: 'list',
                            items: [
                                '👩 <b>Mommy / Mother</b>: Mẹ',
                                '👨 <b>Daddy / Father</b>: Bố',
                                '👦 <b>Brother</b>: Anh / Em trai',
                                '👧 <b>Sister</b>: Chị / Em gái',
                                '👶 <b>Baby</b>: Em bé'
                            ]
                        },
                        {
                            head: '2. Trái Cây Yêu Thích',
                            type: 'signals',
                            signals: [
                                { word: 'Apple 🍎', desc: 'Quả táo' },
                                { word: 'Banana 🍌', desc: 'Quả chuối' },
                                { word: 'Orange 🍊', desc: 'Quả cam' },
                                { word: 'Watermelon 🍉', desc: 'Dưa hấu' },
                                { word: 'Milk 🥛', desc: 'Sữa' }
                            ]
                        },
                        {
                            head: '3. Cảm Xúc & Cơ Thể',
                            type: 'grid',
                            items: [
                                '😊 <b>Happy</b> (Vui)', '😢 <b>Sad</b> (Buồn)', '👀 <b>Eye</b> (Mắt)', '👃 <b>Nose</b> (Mũi)',
                                '👂 <b>Ear</b> (Tai)', '👄 <b>Mouth</b> (Miệng)', '✋ <b>Hand</b> (Bàn tay)'
                            ]
                        }
                    ]
                };

            case 'world-3':
                return {
                    title: '🌱 Ghi Nhớ Lớp 1: Đồ Dùng Học Tập & Mẫu Câu Giới Thiệu',
                    blocks: [
                        {
                            head: '1. Mẫu Câu Giới Thiệu Đồ Vật: This is a...',
                            type: 'formulas',
                            formulas: [
                                { tag: 'Mẫu câu 1', rule: 'This is a + [tên đồ vật]', ex: 'This is a book. (Đây là một cuốn sách.)' },
                                { tag: 'Mẫu câu 2', rule: 'It is + [màu sắc]', ex: 'It is red. (Nó có màu đỏ.)' }
                            ]
                        },
                        {
                            head: '2. Từ Vựng Đồ Dùng Học Tập & Quần Áo',
                            type: 'signals',
                            signals: [
                                { word: 'Book 📖', desc: 'Cuốn sách' },
                                { word: 'Pen 🖊️', desc: 'Bút mực' },
                                { word: 'Pencil ✏️', desc: 'Bút chì' },
                                { word: 'Desk 🪑', desc: 'Bàn học' },
                                { word: 'Hat 🧢', desc: 'Cái mũ' },
                                { word: 'Shirt 👕', desc: 'Áo sơ mi' }
                            ]
                        }
                    ]
                };

            case 'world-4':
                return {
                    title: '🐶 Ghi Nhớ Lớp 1: Động Vật & Động Từ Hành Động (I can...)',
                    blocks: [
                        {
                            head: '1. Mẫu Câu Khả Năng: I can...',
                            type: 'formulas',
                            formulas: [
                                { tag: 'Khẳng định', rule: 'I can + [động từ]', ex: 'I can run. (Tớ có thể chạy.)' },
                                { tag: 'Phủ định', rule: 'I cannot / can\'t + [động từ]', ex: 'I can\'t fly. (Tớ không thể bay.)' },
                                { tag: 'Sở thích', rule: 'I like + [động vật số nhiều]', ex: 'I like dogs. (Tớ thích những chú chó.)' }
                            ]
                        },
                        {
                            head: '2. Từ Vựng Động Từ Hành Động',
                            type: 'signals',
                            signals: [
                                { word: 'Run 🏃', desc: 'Chạy' },
                                { word: 'Jump 🦘', desc: 'Nhảy' },
                                { word: 'Fly 🐦', desc: 'Bay' },
                                { word: 'Swim 🏊', desc: 'Bơi' },
                                { word: 'Sing 🎤', desc: 'Hát' },
                                { word: 'Dance 💃', desc: 'Nhảy múa' }
                            ]
                        }
                    ]
                };

            case 'world-5':
                return {
                    title: '🌱 Ghi Nhớ Lớp 2: Động Từ To Be (Am / Is / Are)',
                    blocks: [
                        {
                            head: '1. Quy Tắc Chia Động Từ To Be',
                            type: 'formulas',
                            formulas: [
                                { tag: 'I đi với', rule: 'I + am (I\'m)', ex: 'I am a student.' },
                                { tag: 'Số ít', rule: 'He / She / It + is (He\'s / She\'s)', ex: 'She is happy. / It is a cat.' },
                                { tag: 'Số nhiều', rule: 'You / We / They + are (They\'re)', ex: 'We are ready.' }
                            ]
                        },
                        {
                            head: '2. Phủ Định & Câu Hỏi',
                            type: 'list',
                            items: [
                                '🛑 <b>Phủ định</b>: Thêm <i>not</i> phía sau To Be ➔ <i>is not = isn\'t</i>, <i>are not = aren\'t</i>.',
                                '❓ <b>Câu hỏi</b>: Đảo To Be lên đầu ➔ <i>Is he a doctor? Yes, he is.</i> / <i>Are you happy? Yes, I am.</i>'
                            ]
                        }
                    ]
                };

            case 'world-6':
                return {
                    title: '🎒 Ghi Nhớ Lớp 2: Sở Hữu Have/Has & Từ Chỉ Định',
                    blocks: [
                        {
                            head: '1. Động Từ Sở Hữu Have / Has',
                            type: 'formulas',
                            formulas: [
                                { tag: 'I / You / We / They', rule: 'S + have', ex: 'I have a new hat.' },
                                { tag: 'He / She / It', rule: 'S + has', ex: 'He has a red car.' }
                            ]
                        },
                        {
                            head: '2. Từ Chỉ Định (This, That, These, Those)',
                            type: 'signals',
                            signals: [
                                { word: 'This', desc: 'Đây (gần - số ít)' },
                                { word: 'That', desc: 'Đó (xa - số ít)' },
                                { word: 'These', desc: 'Những cái này (gần - số nhiều)' },
                                { word: 'Those', desc: 'Những cái đó (xa - số nhiều)' }
                            ]
                        }
                    ]
                };

            case 'world-7':
                return {
                    title: '🏠 Ghi Nhớ Lớp 3: Giới Từ Vị Trí & Cấu Trúc There is / There are',
                    blocks: [
                        {
                            head: '1. Giới Từ Vị Trí (Prepositions of Place)',
                            type: 'signals',
                            signals: [
                                { word: 'In 📦', desc: 'Ở trong' },
                                { word: 'On 🔝', desc: 'Ở trên' },
                                { word: 'Under ⬇️', desc: 'Ở dưới' },
                                { word: 'Behind 🔙', desc: 'Ở phía sau' },
                                { word: 'Next to ➡️', desc: 'Bên cạnh' },
                                { word: 'Between ↕️', desc: 'Ở giữa 2 vật' }
                            ]
                        },
                        {
                            head: '2. Cấu Trúc There is / There are',
                            type: 'formulas',
                            formulas: [
                                { tag: 'Số ít', rule: 'There is a / an + [N số ít]', ex: 'There is an apple on the table.' },
                                { tag: 'Số nhiều', rule: 'There are + [N số nhiều]', ex: 'There are 3 dogs in the yard.' }
                            ]
                        }
                    ]
                };

            case 'world-8':
                return {
                    title: '☀️ Ghi Nhớ Lớp 3: Thì Hiện Tại Đơn (Present Simple)',
                    blocks: [
                        {
                            head: '1. Công Thức Hiện Tại Đơn',
                            type: 'formulas',
                            formulas: [
                                { tag: 'He / She / It', rule: 'S + V-s / V-es', ex: 'She plays tennis every day.' },
                                { tag: 'I / You / We / They', rule: 'S + V1 (giữ nguyên)', ex: 'They walk to school.' },
                                { tag: 'Phủ định', rule: 'S + don\'t / doesn\'t + V1', ex: 'He doesn\'t like milk.' }
                            ]
                        },
                        {
                            head: '2. Mẹo Thêm -es Khi Tận Cùng Động Từ',
                            type: 'note',
                            text: '💡 Động từ tận cùng bằng <b>-o, -ch, -sh, -s, -x, -z</b> thì thêm <b>-es</b>: <i>go ➔ goes, watch ➔ watches, wash ➔ washes</i>.'
                        }
                    ]
                };

            case 'world-9':
                return {
                    title: '🏃 Ghi Nhớ Lớp 3: Thì Hiện Tại Tiếp Diễn (Present Continuous)',
                    blocks: [
                        {
                            head: '1. Công Thức Đang Diễn Ra',
                            type: 'formulas',
                            formulas: [
                                { tag: 'Khẳng định', rule: 'S + am / is / are + V-ing', ex: 'I am reading a book now.' },
                                { tag: 'Phủ định', rule: 'S + am / is / are + not + V-ing', ex: 'She isn\'t cooking.' },
                                { tag: 'Nghi vấn', rule: 'Am / Is / Are + S + V-ing?', ex: 'Are they playing soccer?' }
                            ]
                        },
                        {
                            head: '2. Từ Dấu Hiệu Nhận Biết',
                            type: 'signals',
                            signals: [
                                { word: 'Now', desc: 'Bây giờ' },
                                { word: 'Right now', desc: 'Ngay bây giờ' },
                                { word: 'At the moment', desc: 'Lúc này' },
                                { word: 'Look! 👁️', desc: 'Nhìn kìa!' },
                                { word: 'Listen! 👂', desc: 'Nghe kìa!' }
                            ]
                        }
                    ]
                };

            case 'world-10':
                return {
                    title: '🦖 Ghi Nhớ Lớp 4: Thì Quá Khứ Đơn (Past Simple)',
                    blocks: [
                        {
                            head: '1. To Be Quá Khứ & Động Từ Quá Khứ',
                            type: 'formulas',
                            formulas: [
                                { tag: 'Was', rule: 'I / He / She / It + was', ex: 'I was happy yesterday.' },
                                { tag: 'Were', rule: 'You / We / They + were', ex: 'They were at home.' },
                                { tag: 'Động từ thường', rule: 'S + V2 / V-ed', ex: 'We visited grandma last Sunday.' }
                            ]
                        },
                        {
                            head: '2. Động Từ Bất Quy Tắc Quá Khứ Phổ Biến',
                            type: 'signals',
                            signals: [
                                { word: 'go ➔ went', desc: 'đã đi' },
                                { word: 'eat ➔ ate', desc: 'đã ăn' },
                                { word: 'see ➔ saw', desc: 'đã thấy' },
                                { word: 'buy ➔ bought', desc: 'đã mua' },
                                { word: 'make ➔ made', desc: 'đã làm' },
                                { word: 'have ➔ had', desc: 'đã có' }
                            ]
                        }
                    ]
                };

            case 'world-11':
                return {
                    title: '🚀 Ghi Nhớ Lớp 4: Thì Tương Lai & Cấu Trúc So Sánh',
                    blocks: [
                        {
                            head: '1. Tương Lai Will vs Be going to',
                            type: 'formulas',
                            formulas: [
                                { tag: 'Will (Sẽ)', rule: 'S + will + V1', ex: 'I will help you. (Tớ sẽ giúp bạn.)' },
                                { tag: 'Be going to', rule: 'S + am/is/are + going to + V1', ex: 'They are going to travel tomorrow.' }
                            ]
                        },
                        {
                            head: '2. So Sánh Hơn & So Sánh Nhất',
                            type: 'formulas',
                            formulas: [
                                { tag: 'So sánh hơn', rule: 'adj-er + than / more adj + than', ex: 'Tom is taller than Ben.' },
                                { tag: 'So sánh nhất', rule: 'the adj-est / the most adj', ex: 'An is the tallest in class.' }
                            ]
                        }
                    ]
                };

            case 'world-12':
            default:
                return {
                    title: '⭐ Ghi Nhớ Lớp 5: Thì Hiện Tại Hoàn Thành & Trùm Cuối V3',
                    blocks: [
                        {
                            head: '1. Công Thức Hiện Tại Hoàn Thành (Present Perfect)',
                            type: 'formulas',
                            formulas: [
                                { tag: 'Khẳng định', rule: 'S + have / has + V3', ex: 'I have eaten pizza.' },
                                { tag: 'Phủ định', rule: 'S + have / has + not + V3', ex: 'She hasn\'t finished yet.' },
                                { tag: 'Nghi vấn', rule: 'Have / Has + S + V3?', ex: 'Have you seen it?' }
                            ]
                        },
                        {
                            head: '2. Từ Dấu Hiệu Nhận Biết Quan Trọng',
                            type: 'signals',
                            signals: [
                                { word: 'just', desc: 'vừa mới' },
                                { word: 'already', desc: 'đã... rồi' },
                                { word: 'yet', desc: 'chưa' },
                                { word: 'ever / never', desc: 'từng / chưa từng' },
                                { word: 'since', desc: 'từ khi (mốc)' },
                                { word: 'for', desc: 'trong (khoảng)' }
                            ]
                        },
                        {
                            head: '3. Bảng 30 Động Từ Bất Quy Tắc Cần Thuộc V3',
                            type: 'verbs',
                            verbs: VOCAB
                        }
                    ]
                };
        }
    }

    function openTheoryModal() {
        // Chỉ hiện ghi nhớ của bài đang học: đang chơi thì lấy world của chặng
        // đó, còn ở bản đồ thì lấy world bé đang chọn xem.
        const playing = $('screen-play').classList.contains('active');
        const currentWId = (playing && run.world ? run.world.id : activeWorldId) || 'world-1';

        // Render Theory Content
        const bodyContainer = $('theory-content-body');
        if (!bodyContainer) return;

        const theoryData = getTheoryForWorld(currentWId);
        let html = `<h3 style="margin-bottom:14px; font-size:1.15rem; color:var(--yellow)">${theoryData.title}</h3>`;

        theoryData.blocks.forEach(b => {
            html += `<div class="theory-block"><h4>${b.head}</h4>`;

            if (b.type === 'formulas') {
                html += `<div class="formula-row">`;
                b.formulas.forEach(f => {
                    const plainEx = f.ex ? f.ex.split('(')[0].trim() : '';
                    html += `
                        <div class="formula">
                            <span class="f-tag">${f.tag}</span>
                            <b>${f.rule}</b>
                            ${f.ex ? `<em><u>${f.ex}</u> <button class="btn-speak small inline-speak" data-speak="${escapeHtml(plainEx)}">🔊</button></em>` : ''}
                        </div>`;
                });
                html += `</div>`;
            } else if (b.type === 'signals') {
                html += `<div class="signal-grid">`;
                b.signals.forEach(s => {
                    const wordOnly = s.word.replace(/[^\w\s]/gi, '').trim();
                    html += `<span class="signal" data-speak="${escapeHtml(wordOnly)}" style="cursor:pointer">${s.word} <small>${s.desc}</small></span>`;
                });
                html += `</div>`;
            } else if (b.type === 'list') {
                html += `<ul class="theory-list">`;
                b.items.forEach(it => { html += `<li>${it}</li>`; });
                html += `</ul>`;
            } else if (b.type === 'grid') {
                html += `<div class="signal-grid">`;
                b.items.forEach(it => { html += `<span class="signal">${it}</span>`; });
                html += `</div>`;
            } else if (b.type === 'note') {
                html += `<p class="theory-note">${b.text}</p>`;
            } else if (b.type === 'verbs') {
                html += `
                    <div class="verb-legend">
                        <span>#</span><span></span><span>V1</span><span>V2</span><span>V3</span><span>Nghĩa</span>
                    </div>
                    <div class="verb-table">
                        ${b.verbs.map((v, i) => `
                            <div class="verb-row">
                                <span class="vr-no">${i + 1}</span>
                                <span class="vr-emo">${v.emoji}</span>
                                <span class="vr-v1">${escapeHtml(v.w)}</span>
                                <span class="vr-v2">${escapeHtml(v.v2 || '')}</span>
                                <span class="vr-v3">${escapeHtml(v.v3 || '')}</span>
                                <span class="vr-vi">${escapeHtml(v.vi)}</span>
                            </div>`).join('')}
                    </div>`;
            }

            html += `</div>`;
        });

        bodyContainer.innerHTML = html;

        // Wire TTS buttons inside theory content
        bodyContainer.querySelectorAll('[data-speak]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                speak(btn.dataset.speak);
            };
        });

        openModal('modal-theory');
    }

    function bindEvents() {
        renderGradeTabs();

        const btnToggleView = $('btn-toggle-view');
        if (btnToggleView) {
            btnToggleView.addEventListener('click', () => {
                sfx.click();
                isGridMode = !isGridMode;
                renderMap();
            });
        }

        const scrollLeftBtn = $('world-scroll-left');
        const scrollRightBtn = $('world-scroll-right');
        if (scrollLeftBtn) {
            scrollLeftBtn.addEventListener('click', () => {
                sfx.click();
                $('world-nav').scrollBy({ left: -260, behavior: 'smooth' });
            });
        }
        if (scrollRightBtn) {
            scrollRightBtn.addEventListener('click', () => {
                sfx.click();
                $('world-nav').scrollBy({ left: 260, behavior: 'smooth' });
            });
        }

        $('btn-check').addEventListener('click', () => { sfx.init(); onCheckClick(); });

        $('btn-quit').addEventListener('click', () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            saveRun();
            setHash('');
            showScreen('map');
            renderMap();
        });

        const searchInput = $('lesson-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                searchQuery = e.target.value;
                renderMap();
            });
        }

        const btnClearSearch = $('btn-clear-search');
        if (btnClearSearch) {
            btnClearSearch.addEventListener('click', () => {
                sfx.init();
                sfx.click();
                searchQuery = '';
                if (searchInput) searchInput.value = '';
                renderMap();
            });
        }

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (searchInput) { searchInput.focus(); searchInput.select(); }
            }
        });

        $('btn-resume').addEventListener('click', () => {
            sfx.init();
            sfx.click();
            resumeRun();
        });

        const btnDrop = $('btn-drop');
        if (btnDrop) {
            btnDrop.addEventListener('click', e => {
                e.stopPropagation();
                sfx.init();
                sfx.click();
                clearRun();
                renderMap();
                showToast('🗑️ Đã huỷ bài học dở');
            });
        }

        $('btn-resume-yes').addEventListener('click', () => {
            sfx.init();
            sfx.click();
            closeModal('modal-resume-confirm');
            resumeRun();
        });

        $('btn-resume-no').addEventListener('click', () => {
            sfx.init();
            sfx.click();
            closeModal('modal-resume-confirm');
            clearRun();
            showScreen('map');
            renderMap();
            showToast('🗑️ Đã bỏ lượt học dở và quay lại bản đồ');
        });

        $('btn-theory').addEventListener('click', () => { sfx.init(); openTheoryModal(); });

        $('btn-voice').addEventListener('click', () => {
            sfx.init();
            refreshVoices();
            renderVoiceList();
            openModal('modal-voice');
        });

        document.querySelectorAll('.speed-btn').forEach(b => {
            b.addEventListener('click', () => {
                prefs.rate = Number(b.dataset.rate);
                savePrefs();
                renderVoiceList();
                speak('I have just finished my homework.');
            });
        });

        $('btn-sound').addEventListener('click', () => {
            soundOn = !soundOn;
            $('sound-icon').className = soundOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            showToast(soundOn ? '🔊 Đã bật âm thanh' : '🔇 Đã tắt âm thanh');
            if (!soundOn && window.speechSynthesis) window.speechSynthesis.cancel();
        });

        $('btn-reset').addEventListener('click', () => {
            if (!confirm('Xoá toàn bộ điểm và sao đã đạt để học lại từ đầu?')) return;
            save = { xp: 0, best: 0, stars: {}, unlockedLevels: {} };
            persist();
            clearRun();
            setHash('');
            showScreen('map');
            renderMap();
            showToast('🔄 Đã xoá tiến trình, cùng học lại nào!');
        });

        document.querySelectorAll('[data-close]').forEach(b => {
            b.addEventListener('click', () => closeModal(b.dataset.close));
        });
        document.querySelectorAll('.modal').forEach(m => {
            m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
        });

        $('btn-res-again').addEventListener('click', () => {
            closeModal('modal-result');
            startStation(run.station.id);
        });
        $('btn-res-next').addEventListener('click', e => {
            const next = e.currentTarget.dataset.next;
            closeModal('modal-result');
            if (next) startStation(next);
        });
        $('btn-res-map').addEventListener('click', () => {
            closeModal('modal-result');
            setHash('');
            showScreen('map');
            renderMap();
        });

        // Nút Back / Forward của trình duyệt
        window.addEventListener('hashchange', () => {
            if (navLock) { navLock = false; return; }
            const st = stationFromHash();
            if (!st) {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                saveRun();
                showScreen('map');
                renderMap();
            } else if (!run.station || run.station.id !== st.id ||
                       !$('screen-play').classList.contains('active')) {
                startStation(st.id);
            }
        });

        // Mọi nút "nghe" đều dùng chung một handler
        document.addEventListener('click', e => {
            const playBtn = e.target.closest('#btn-passage-play');
            if (playBtn) {
                sfx.init();
                handlePassagePlayClick(playBtn.dataset.passage);
                return;
            }
            const replayBtn = e.target.closest('#btn-passage-replay');
            if (replayBtn) {
                sfx.init();
                handlePassageReplayClick(replayBtn.dataset.passage);
                return;
            }

            const b = e.target.closest('[data-speak]');
            if (!b) return;
            sfx.init();
            speak(b.dataset.speak, b.dataset.slow ? Math.max(0.4, prefs.rate - 0.3) : undefined);
        });

        // Phím tắt: 1-4 chọn đáp án, Enter để kiểm tra
        document.addEventListener('keydown', e => {
            if ($('screen-play').classList.contains('active') === false) return;
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                if (e.key === 'Enter') return; // input tự xử lý
            }
            if (e.key === 'Enter' && !$('btn-check').disabled) {
                e.preventDefault();
                onCheckClick();
            }
            if (/^[1-4]$/.test(e.key) && !run.answered) {
                const opt = $('stage').querySelector(`.opt[data-opt="${Number(e.key) - 1}"]`);
                if (opt) opt.click();
            }
        });

        if (TTS_OK && window.speechSynthesis) {
            refreshVoices();
            // Danh sách giọng thường nạp chậm một nhịp sau khi trang mở
            window.speechSynthesis.onvoiceschanged = () => {
                refreshVoices();
                if ($('modal-voice').classList.contains('open')) renderVoiceList();
            };
        }
    }

    /* =====================================================
       9. KHỞI ĐỘNG
       ===================================================== */

    window.addEventListener('DOMContentLoaded', () => {
        loadSave();
        loadPrefs();
        pickStartingGrade();
        renderMap();
        bindEvents();

        // Tải lại trang giữa chừng -> Kiểm tra lượt học cũ để hỏi bé
        const found = readRun();
        if (found) {
            const { data: d, station: st, world: w } = found;
            const total = st.items.length;
            const at = Math.min(total, (Number(d.idx) || 0) + (d.answered ? 2 : 1));
            const icon = w ? w.icon : '📖';
            $('resume-confirm-info').innerHTML = `${icon} <b>${st.title}</b><br><small>Đang ở câu ${at}/${total} · ❤️ ${d.hearts} · 💎 ${d.xp}</small>`;
            openModal('modal-resume-confirm');
        } else {
            // Không có bài dở, nhưng địa chỉ chỉ tới một chặng -> mở chặng đó
            const st = stationFromHash();
            if (st) startStation(st.id);
        }

        if (!TTS_OK) {
            showToast('⚠️ Trình duyệt không hỗ trợ đọc tiếng Anh — hãy dùng Chrome/Safari/Edge nhé');
        }
    });
})();
