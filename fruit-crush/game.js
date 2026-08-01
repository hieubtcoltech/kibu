/**
 * Fruit Crush Deluxe - Game Core logic
 * - Màn chơi có mục tiêu riêng
 * - Hoa quả đặc biệt: tia ngang, tia dọc, bom, cầu vồng (+ các combo)
 * - Hiệu ứng particle trên canvas, tile chuyển động bằng transform
 */

/* ============================================================
 *  1. CẤU HÌNH
 * ============================================================ */

const GRID = 8;

const FRUITS = [
    { emoji: '🍎', color: '#ff4d6d' },
    { emoji: '🍌', color: '#ffd93d' },
    { emoji: '🍇', color: '#b06cff' },
    { emoji: '🍊', color: '#ff9f43' },
    { emoji: '🍓', color: '#ff5c8a' },
    { emoji: '🍒', color: '#ff2e63' },
    { emoji: '🥝', color: '#7bed9f' },
];

const SP = {
    LINE_H: 'lineH',
    LINE_V: 'lineV',
    BOMB: 'bomb',
    RAINBOW: 'rainbow',
};

// Loại ô trên bàn cờ
const KIND = {
    FRUIT: 'fruit',       // quả thường, tráo và ghép được
    CRATE: 'crate',       // thùng gỗ: không tráo/ghép, vỡ khi có vụ nổ cạnh bên
    HARVEST: 'harvest',   // dừa: không tráo/ghép, rơi theo trọng lực về mép bàn
};

/**
 * Sơ đồ bố trí bàn cờ — mỗi màn 8 dòng, mỗi dòng 8 ký tự:
 *   '.' ô trống      '#' băng 1 lớp     '=' băng 2 lớp     'X' thùng gỗ
 * Số lượng băng/thùng của mục tiêu được đếm tự động từ sơ đồ này.
 */
const TILE_EMPTY = '.';
const TILE_FROST1 = '#';
const TILE_FROST2 = '=';
const TILE_CRATE = 'X';

// Ô được tặng sẵn quả đặc biệt ngay khi vào màn (dành cho các màn thưởng)
//   'H' tia ngang   'V' tia dọc   'B' bom   'R' cầu vồng
const TILE_GIFTS = {
    H: SP.LINE_H,
    V: SP.LINE_V,
    B: SP.BOMB,
    R: SP.RAINBOW,
};

const OBJ = {
    FRUIT: 'fruit',       // thu thập N quả loại X
    FROST: 'frost',       // phá sạch băng
    CRATE: 'crate',       // đập vỡ hết thùng gỗ
    HARVEST: 'harvest',   // đưa dừa về mép bàn
    SPECIAL: 'special',   // tạo N quả đặc biệt
    COMBO: 'combo',       // đạt chuỗi combo x N
};

const LEVELS = [
    {
        moves: 22, target: 1500, colors: 5,
        desc: { vi: 'Khởi động nhẹ nhàng với vườn táo.', en: 'A gentle warm-up in the apple orchard.' },
        objectives: [{ type: OBJ.FRUIT, fruit: 0, count: 12 }],
    },
    {
        moves: 22, target: 2200, colors: 5,
        desc: { vi: 'Thu hoạch chuối và nho cùng lúc.', en: 'Harvest bananas and grapes at the same time.' },
        objectives: [{ type: OBJ.FRUIT, fruit: 1, count: 14 }, { type: OBJ.FRUIT, fruit: 2, count: 14 }],
    },
    {
        moves: 22, target: 2600, colors: 5,
        desc: { vi: 'Băng giá phủ giữa bàn — ghép ngay trên ô băng để đập vỡ nó.', en: 'Frost covers the middle — match on top of a frosted tile to shatter it.' },
        objectives: [{ type: OBJ.FROST }],
        layout: [
            '........',
            '........',
            '..####..',
            '..####..',
            '..####..',
            '..####..',
            '........',
            '........',
        ],
    },
    {
        moves: 28, target: 3000, colors: 5,
        desc: { vi: 'Băng hai lớp cứng đầu hơn: phải ghép hai lần mới vỡ.', en: 'Double frost is stubborn: you need two matches to break it.' },
        objectives: [{ type: OBJ.FROST }, { type: OBJ.FRUIT, fruit: 3, count: 14 }],
        layout: [
            '==....==',
            '=#....#=',
            '........',
            '........',
            '........',
            '........',
            '=#....#=',
            '==....==',
        ],
    },
    {
        moves: 20, target: 3200, colors: 5,
        desc: { vi: 'Thùng gỗ không ghép được — cho nổ ngay bên cạnh để đập vỡ chúng.', en: 'Crates cannot be matched — blow something up right next to them.' },
        objectives: [{ type: OBJ.CRATE }],
        layout: [
            '........',
            '........',
            '..XXXX..',
            '........',
            '........',
            '..XXXX..',
            '........',
            '........',
        ],
    },
    {
        moves: 24, target: 3600, colors: 6,
        desc: { vi: 'Thùng gỗ ngồi giữa vòng băng — dọn theo thứ tự nào đây?', en: 'Crates sit inside a ring of frost — which do you clear first?' },
        objectives: [{ type: OBJ.FROST }, { type: OBJ.CRATE }],
        layout: [
            '........',
            '.######.',
            '.#XXXX#.',
            '.#X..X#.',
            '.#X..X#.',
            '.#XXXX#.',
            '.######.',
            '........',
        ],
    },
    {
        moves: 26, target: 3000, colors: 5,
        desc: { vi: 'Dừa rơi từ trên trời xuống! Dọn đường cho chúng chạm đáy bàn.', en: 'Coconuts drop in from above! Clear a path so they reach the bottom.' },
        objectives: [{ type: OBJ.HARVEST, count: 3 }],
        harvest: { total: 3, onBoard: 2 },
    },
    {
        moves: 28, target: 3600, colors: 6,
        desc: { vi: 'Thùng gỗ chặn lối dừa rơi — phá tường trước đã.', en: 'Crates block the coconuts — break the wall first.' },
        objectives: [{ type: OBJ.HARVEST, count: 3 }, { type: OBJ.CRATE }],
        harvest: { total: 3, onBoard: 2 },
        layout: [
            '........',
            '........',
            '........',
            'XX.XX.XX',
            '........',
            '........',
            '.X.XX.X.',
            '........',
        ],
    },
    {
        moves: 20, target: 4200, colors: 6,
        desc: { vi: 'Lần này điểm số không đủ: hãy tự tay chế tạo 4 quả đặc biệt.', en: 'Points are not enough this time: craft 4 special fruits yourself.' },
        objectives: [{ type: OBJ.SPECIAL, count: 4 }],
    },
    {
        moves: 22, target: 4500, colors: 6,
        desc: { vi: 'Cẩn thận! Cứ 4 lượt là cả bàn cờ đảo ngược trọng lực.', en: 'Careful! Every 4 moves the whole board flips its gravity.' },
        objectives: [{ type: OBJ.FRUIT, fruit: 5, count: 24 }],
        gravityFlip: 4,
    },
    {
        moves: 28, target: 4500, colors: 6,
        desc: { vi: 'Trọng lực đảo mỗi 5 lượt — dừa sẽ rơi ngược lên trời, hãy canh đúng lúc!', en: 'Gravity flips every 5 moves — coconuts will fall upward, so time it right!' },
        objectives: [{ type: OBJ.HARVEST, count: 3 }],
        harvest: { total: 3, onBoard: 2 },
        gravityFlip: 5,
    },
    {
        moves: 24, target: 5200, colors: 6,
        desc: { vi: 'Đường hầm băng hẹp: mọi vụ nổ đều dội lại rất mạnh.', en: 'A narrow frozen tunnel: every explosion echoes hard here.' },
        objectives: [{ type: OBJ.FROST }],
        layout: [
            '........',
            '.=####=.',
            '.#....#.',
            '.#....#.',
            '.#....#.',
            '.#....#.',
            '.=####=.',
            '........',
        ],
    },
    {
        moves: 24, target: 5600, colors: 6,
        desc: { vi: 'Mục tiêu là một chuỗi combo x4 — hãy dựng thế rồi để phản ứng dây chuyền tự chạy.', en: 'Your goal is a x4 combo chain — set it up and let it run.' },
        objectives: [{ type: OBJ.COMBO, count: 4 }],
    },
    {
        moves: 28, target: 6000, colors: 6,
        desc: { vi: 'Pháo đài thùng gỗ bọc băng hai lớp. Cần một quả cầu vồng!', en: 'A crate fortress wrapped in double frost. You will want a rainbow!' },
        objectives: [{ type: OBJ.CRATE }, { type: OBJ.FROST }],
        layout: [
            '..XXXX..',
            '.#=..=#.',
            'X......X',
            'X.####.X',
            'X.####.X',
            'X......X',
            '.#=..=#.',
            '..XXXX..',
        ],
    },
    {
        moves: 28, target: 6500, colors: 7,
        desc: { vi: 'Kiwi xuất hiện, và dừa phải vượt qua hai tầng băng để về đích.', en: 'Kiwi arrives, and coconuts must cross two layers of frost.' },
        objectives: [{ type: OBJ.HARVEST, count: 3 }, { type: OBJ.FROST }],
        harvest: { total: 3, onBoard: 2 },
        layout: [
            '........',
            '........',
            '########',
            '........',
            '........',
            '==....==',
            '........',
            '........',
        ],
    },
    {
        moves: 30, target: 7000, colors: 7,
        desc: { vi: 'Hai cột băng dựng đứng giữa bàn, còn trọng lực thì cứ 4 lượt lại đảo.', en: 'Two frozen pillars stand in the middle while gravity flips every 4 moves.' },
        objectives: [{ type: OBJ.FROST }, { type: OBJ.SPECIAL, count: 3 }],
        gravityFlip: 4,
        layout: [
            '..#..#..',
            '.=#..#=.',
            '..#..#..',
            '........',
            '........',
            '..#..#..',
            '.=#..#=.',
            '..#..#..',
        ],
    },
    {
        moves: 30, target: 8000, colors: 7,
        desc: { vi: 'Mê cung thùng gỗ: dừa chỉ lọt qua được hai khe hẹp.', en: 'A crate maze: the coconuts can only slip through two narrow gaps.' },
        objectives: [{ type: OBJ.HARVEST, count: 3 }, { type: OBJ.CRATE }],
        harvest: { total: 3, onBoard: 2 },
        layout: [
            '........',
            'XXX..XXX',
            '........',
            '..XXXX..',
            '........',
            'XX.XX.XX',
            '........',
            '........',
        ],
    },
    {
        moves: 34, target: 9000, colors: 7,
        desc: { vi: 'Màn cuối: băng, thùng gỗ, dừa và trọng lực đảo — tất cả cùng lúc!', en: 'Final level: frost, crates, coconuts and flipping gravity — all at once!' },
        objectives: [
            { type: OBJ.FROST },
            { type: OBJ.CRATE },
            { type: OBJ.HARVEST, count: 3 },
            { type: OBJ.COMBO, count: 4 },
        ],
        harvest: { total: 3, onBoard: 2 },
        gravityFlip: 6,
        layout: [
            '..#..#..',
            '.X#..#X.',
            '..#..#..',
            '...XX...',
            '...XX...',
            '..#..#..',
            '.X#..#X.',
            '..#..#..',
        ],
    },

    /* ---------- Hai màn đặc biệt khép lại hành trình ---------- */
    {
        // Cả bàn phủ băng: mọi cú ghép đều có ích, nhưng lõi băng dày rất lì.
        // Tặng sẵn hai quả bom để phá tan lớp vỏ ngoài ngay từ nước đầu.
        moves: 32, target: 12000, colors: 6, music: 'frost',
        desc: {
            vi: 'Cung điện băng: cả bàn cờ đóng băng! Hai quả bom được tặng sẵn để bạn mở màn thật giòn giã.',
            en: 'The ice palace: the whole board is frozen! Two free bombs are waiting to crack it wide open.',
        },
        objectives: [{ type: OBJ.FROST }, { type: OBJ.SPECIAL, count: 4 }],
        layout: [
            '########',
            '#======#',
            '#=####=#',
            '#=#B.#=#',
            '#=#.B#=#',
            '#=####=#',
            '#======#',
            '########',
        ],
    },
    {
        // Màn tổng kết: đủ bốn chướng ngại vật, trọng lực đảo liên tục, và một
        // kho quả đặc biệt tặng sẵn ở giữa để người chơi mở tiệc pháo hoa.
        moves: 36, target: 16000, colors: 7, music: 'gravity',
        desc: {
            vi: 'Đại tiệc hoa quả: đủ cả băng, thùng gỗ, dừa và trọng lực đảo — kèm một kho quả đặc biệt tặng sẵn giữa bàn!',
            en: 'The grand feast: frost, crates, coconuts and flipping gravity — plus a stash of free special fruits in the middle!',
        },
        objectives: [
            { type: OBJ.FROST },
            { type: OBJ.CRATE },
            { type: OBJ.HARVEST, count: 3 },
            { type: OBJ.COMBO, count: 4 },
        ],
        harvest: { total: 3, onBoard: 2 },
        gravityFlip: 5,
        // Cột 0 và 7 để trống hẳn làm hai làn cho dừa rơi; kho quả đặc biệt
        // nằm giữa, được viền băng và thùng gỗ bao quanh như một rương báu.
        layout: [
            '.XX..XX.',
            '.#....#.',
            '..X##X..',
            '..#VB#..',
            '..#BH#..',
            '..X##X..',
            '.#....#.',
            '.XX..XX.',
        ],
    },
];

/* ============================================================
 *  1b. NGÔN NGỮ (i18n)
 * ============================================================ */

const I18N = {
    vi: {
        title: 'Fruit Crush Deluxe - Trò chơi xếp hoa quả ngọt ngào',
        langSwitch: 'English',
        tagline: 'Trải nghiệm ghép hoa quả ngọt ngào',
        score: 'Điểm Số',
        target: 'Mục tiêu',
        moves: 'Lượt Đi',
        movesSub: 'Cố lên nhé!',
        levelWord: 'Màn',
        btnLevels: 'Chọn Màn',
        btnRestart: 'Chơi Lại',
        btnSound: 'Âm Thanh',
        btnMusic: 'Nhạc Nền',
        btnScores: 'Bảng Vàng',
        scoresTitle: 'Bảng Vàng',
        scoresSub: 'Mười thành tích cao nhất, lưu ngay trên máy bạn.',
        scoresEmpty: 'Chưa có ai ghi danh. Hãy là người đầu tiên!',
        scoreLevelShort: 'Màn {n}',
        anonymous: 'Người chơi ẩn danh',
        recordPrompt: 'Thành tích này lọt Bảng Vàng — ghi danh nhé!',
        recordPlaceholder: 'Tên của bạn',
        recordSave: 'Ghi danh',
        recordSaved: 'Đã ghi danh — hạng #{rank}!',
        shareTitle: 'Khoe thành tích',
        shareNative: 'Chia sẻ',
        shareCopy: 'Sao chép',
        shareText: '🍉 Mình vừa đạt {score} điểm ở Màn {level} trong Fruit Crush Deluxe!{stars} Bạn phá được kỷ lục này không?',
        shareNeedsHost: 'Cần đăng trò chơi lên mạng mới chia sẻ Facebook được',
        copied: 'Đã sao chép!',
        copyFailed: 'Không sao chép được',
        devBadge: 'CHẾ ĐỘ THỬ MÀN',
        musicOn: 'Nhạc nền: bản "{theme}"',
        musicOff: 'Đã tắt nhạc nền',
        specialsTitle: 'Hoa quả đặc biệt',
        spH: '<b>Tia ngang</b> — ghép 4 quả theo hàng ngang, nổ sạch cả hàng.',
        spV: '<b>Tia dọc</b> — ghép 4 quả theo hàng dọc, nổ sạch cả cột.',
        spBomb: '<b>Bom</b> — ghép hình chữ L hoặc T, nổ tung 8 ô xung quanh.',
        spRainbow: '<b>Cầu vồng</b> — ghép 5 quả thẳng hàng, quét sạch mọi quả cùng loại.',
        howTitle: 'Cách chơi',
        how1: 'Chạm chọn hoặc vuốt hai quả cạnh nhau để tráo đổi.',
        how2: 'Hoàn thành mục tiêu thu thập <b>và</b> đạt điểm trước khi hết lượt.',
        how3: 'Kết hợp hai quả đặc biệt cạnh nhau để tạo vụ nổ cực lớn!',
        btnStart: 'Bắt Đầu',
        introStats: '<i class="fa-solid fa-hourglass-half"></i> {moves} lượt &nbsp;·&nbsp; <i class="fa-solid fa-trophy"></i> {target} điểm',
        victoryTitle: 'Chiến Thắng!',
        victoryMsg: 'Chúc mừng bạn đã hoàn thành Màn {level}!',
        scoreLabel: 'Điểm số',
        btnNext: 'Màn Tiếp Theo',
        btnMap: 'Về bản đồ màn chơi',
        gameoverTitle: 'Hết Lượt Đi!',
        reasonScore: 'Bạn chưa đạt đủ điểm mục tiêu.',
        reasonObjective: 'Bạn chưa thu thập đủ hoa quả mục tiêu.',
        gameoverStats: 'Điểm đạt được: {score} / {target}',
        btnRetry: 'Thử Lại',
        mapTitle: 'Bản Đồ Màn Chơi',
        mapSub: 'Hoàn thành từng màn để mở khoá thử thách tiếp theo.',
        btnClose: 'Đóng',
        shuffle: 'Hết nước đi — trộn lại!',
        soundState: 'Âm thanh: {state}',
        soundOff: 'Đã tắt âm thanh',
        endlessDesc: 'Chế độ vô tận — càng ngày càng khó!',
        // Mục tiêu
        obj_fruit: 'Thu thập quả',
        obj_frost: 'Phá sạch băng',
        obj_crate: 'Đập vỡ thùng gỗ',
        obj_harvest: 'Đưa dừa về mép bàn',
        obj_special: 'Tạo quả đặc biệt',
        obj_combo: 'Đạt chuỗi combo',
        // Chướng ngại vật & cơ chế
        obstaclesTitle: 'Chướng ngại vật',
        obFrost: '<b>Băng</b> — ghép quả ngay trên ô băng để phá. Băng dày cần hai lần.',
        obCrate: '<b>Thùng gỗ</b> — không tráo được, phải cho nổ ở ô ngay cạnh nó.',
        obHarvest: '<b>Dừa</b> — dọn đường cho nó rơi tới mép bàn theo chiều trọng lực.',
        obGravity: '<b>Đảo trọng lực</b> — cứ vài lượt là cả bàn rơi ngược chiều!',
        gravityFlip: 'ĐẢO TRỌNG LỰC!',
        gravityIn: 'đảo sau {n} lượt',
        gravityEvery: 'đảo mỗi {n} lượt',
    },
    en: {
        title: 'Fruit Crush Deluxe - A sweet fruit matching game',
        langSwitch: 'Tiếng Việt',
        tagline: 'A sweet fruit-matching adventure',
        score: 'Score',
        target: 'Target',
        moves: 'Moves',
        movesSub: 'You got this!',
        levelWord: 'Level',
        btnLevels: 'Levels',
        btnRestart: 'Restart',
        btnSound: 'Sound',
        btnMusic: 'Music',
        btnScores: 'Hall of Fame',
        scoresTitle: 'Hall of Fame',
        scoresSub: 'The ten best runs, saved right on your own device.',
        scoresEmpty: 'Nobody here yet. Be the first!',
        scoreLevelShort: 'Lv {n}',
        anonymous: 'Anonymous',
        recordPrompt: 'This run makes the Hall of Fame!',
        recordPlaceholder: 'Your name',
        recordSave: 'Add my name',
        recordSaved: 'Saved — rank #{rank}!',
        shareTitle: 'Show it off',
        shareNative: 'Share',
        shareCopy: 'Copy',
        shareText: '🍉 I just scored {score} points on level {level} of Fruit Crush Deluxe!{stars} Think you can beat that?',
        shareNeedsHost: 'Facebook sharing needs the game hosted online',
        copied: 'Copied!',
        copyFailed: 'Could not copy',
        devBadge: 'LEVEL TEST MODE',
        musicOn: 'Music: "{theme}" theme',
        musicOff: 'Music is off',
        specialsTitle: 'Special fruits',
        spH: '<b>Row blast</b> — match 4 in a row to clear the whole row.',
        spV: '<b>Column blast</b> — match 4 in a column to clear the whole column.',
        spBomb: '<b>Bomb</b> — match an L or T shape to blow up the 8 surrounding tiles.',
        spRainbow: '<b>Rainbow</b> — match 5 in a line to wipe out every fruit of one kind.',
        howTitle: 'How to play',
        how1: 'Tap two neighbouring fruits, or swipe one onto the other, to swap them.',
        how2: 'Finish the collection goals <b>and</b> hit the target score before you run out of moves.',
        how3: 'Swap two special fruits next to each other for a huge explosion!',
        btnStart: 'Start',
        introStats: '<i class="fa-solid fa-hourglass-half"></i> {moves} moves &nbsp;·&nbsp; <i class="fa-solid fa-trophy"></i> {target} points',
        victoryTitle: 'Victory!',
        victoryMsg: 'Congratulations, you cleared Level {level}!',
        scoreLabel: 'Score',
        btnNext: 'Next Level',
        btnMap: 'Back to level map',
        gameoverTitle: 'Out of moves!',
        reasonScore: "You didn't reach the target score.",
        reasonObjective: "You didn't collect all the fruits you needed.",
        gameoverStats: 'Your score: {score} / {target}',
        btnRetry: 'Try Again',
        mapTitle: 'Level Map',
        mapSub: 'Clear a level to unlock the next challenge.',
        btnClose: 'Close',
        shuffle: 'No moves left — shuffling!',
        soundState: 'Sound: {state}',
        soundOff: 'Sound is off',
        endlessDesc: 'Endless mode — it only gets harder!',
        // Objectives
        obj_fruit: 'Collect fruit',
        obj_frost: 'Clear all the frost',
        obj_crate: 'Smash every crate',
        obj_harvest: 'Bring the coconuts home',
        obj_special: 'Create special fruits',
        obj_combo: 'Reach a combo chain',
        // Obstacles & mechanics
        obstaclesTitle: 'Obstacles',
        obFrost: '<b>Frost</b> — match a fruit on top of it to shatter it. Thick frost takes two hits.',
        obCrate: '<b>Crate</b> — cannot be swapped; blow something up right next to it.',
        obHarvest: '<b>Coconut</b> — clear a path so it can fall all the way to the edge.',
        obGravity: '<b>Gravity flip</b> — every few moves the whole board falls the other way!',
        gravityFlip: 'GRAVITY FLIP!',
        gravityIn: 'flips in {n}',
        gravityEvery: 'flips every {n} moves',
    },
};

const LANG_KEY = 'fruitCrushLang';
const GLOBAL_LANG_KEY = 'kibu_global_lang'; // khoá dùng chung cho cả site

function detectLanguage() {
    try {
        // Ngôn ngữ nằm ngay trong đường dẫn (/vi/g/fruit-crush) nên nó quyết
        // định, không phải lựa chọn đã lưu từ lần trước
        const route = window.KibuRoutes && window.KibuRoutes.parse(location.pathname);
        if (route && I18N[route.lang]) return route.lang;
        // Rồi mới tới lựa chọn ngôn ngữ chung của cả site, cuối cùng là khoá riêng
        const global = localStorage.getItem(GLOBAL_LANG_KEY);
        if (global && I18N[global]) return global;
        const saved = localStorage.getItem(LANG_KEY);
        if (saved && I18N[saved]) return saved;
    } catch (e) { /* bỏ qua */ }
    const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return nav.startsWith('vi') ? 'vi' : 'en';
}

let lang = detectLanguage();

// Lấy chuỗi đã dịch, thay các chỗ trống dạng {tên}
function t(key, vars) {
    let text = I18N[lang][key];
    if (text === undefined) text = I18N.vi[key];
    if (text === undefined) return key;
    if (vars) {
        for (const name of Object.keys(vars)) {
            text = text.split('{' + name + '}').join(vars[name]);
        }
    }
    return text;
}

// Mô tả màn chơi theo ngôn ngữ hiện tại (màn vô tận không có desc riêng)
function levelDesc(config) {
    if (!config || !config.desc) return t('endlessDesc');
    return config.desc[lang] || config.desc.vi || '';
}

// Các sơ đồ dùng lại cho chế độ vô tận, xoay vòng để mỗi màn một kiểu
const ENDLESS_LAYOUTS = [
    ['........', '..####..', '.#....#.', '.#....#.', '.#....#.', '.#....#.', '..####..', '........'],
    ['XX....XX', '........', '..=##=..', '..#..#..', '..#..#..', '..=##=..', '........', 'XX....XX'],
    ['..#..#..', '..#..#..', 'XX#..#XX', '........', '........', 'XX#..#XX', '..#..#..', '..#..#..'],
    ['========', '........', '..XXXX..', '........', '........', '..XXXX..', '........', '========'],
];

// Sinh cấu hình cho các màn vô tận sau danh sách cố định
function getLevelConfig(index) {
    if (index < LEVELS.length) return LEVELS[index];

    const n = index - LEVELS.length + 1;
    const fruits = [0, 1, 2, 3, 4, 5, 6];
    const layout = ENDLESS_LAYOUTS[n % ENDLESS_LAYOUTS.length];
    const objectives = [
        { type: OBJ.FRUIT, fruit: fruits[(n * 3) % 7], count: 24 + n * 2 },
        { type: OBJ.FROST },
        { type: OBJ.CRATE },
    ];

    // Cứ vài màn lại đổi kiểu thử thách để không bị lặp
    if (n % 3 === 0) objectives.push({ type: OBJ.HARVEST, count: 3 + Math.floor(n / 3) });
    if (n % 4 === 0) objectives.push({ type: OBJ.COMBO, count: 4 });
    if (n % 5 === 0) objectives.push({ type: OBJ.SPECIAL, count: 3 });

    return {
        moves: Math.max(16, 26 - Math.floor(n / 2)),
        target: 9000 + n * 1500,
        colors: 7,
        // không có desc riêng: levelDesc() sẽ dùng câu mô tả chung cho chế độ vô tận
        objectives,
        layout,
        harvest: n % 3 === 0 ? { total: 3 + Math.floor(n / 3), onBoard: 2 } : null,
        gravityFlip: n % 2 === 0 ? 4 : 0,
    };
}

/**
 * Chuẩn hoá cấu hình màn: đếm băng/thùng từ sơ đồ để mục tiêu không bao giờ
 * lệch với bàn cờ thực tế, và bỏ những mục tiêu không có gì để làm.
 */
function prepareLevel(config) {
    const layout = config.layout || null;
    let frostLayers = 0;
    let crateCount = 0;

    if (layout) {
        for (let r = 0; r < GRID; r++) {
            const row = layout[r] || '';
            for (let c = 0; c < GRID; c++) {
                const ch = row[c] || TILE_EMPTY;
                if (ch === TILE_FROST1) frostLayers += 1;
                else if (ch === TILE_FROST2) frostLayers += 2;
                else if (ch === TILE_CRATE) crateCount += 1;
            }
        }
    }

    const objectives = config.objectives
        .map(obj => {
            const o = { ...obj, type: obj.type || OBJ.FRUIT };
            if (o.type === OBJ.FROST) o.count = frostLayers;
            if (o.type === OBJ.CRATE) o.count = crateCount;
            return o;
        })
        .filter(o => o.count > 0);

    return { ...config, objectives, frostLayers, crateCount };
}

const STORAGE_KEY = 'fruitCrushDeluxeProgress';

/* ============================================================
 *  2. ÂM THANH
 * ============================================================ */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.enabled = true;
        this.unlocked = false;
        this.failure = null;
        this.onUnlocked = null;   // gọi lại khi âm thanh vừa được mở khoá
    }

    init() {
        try {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) {
                    this.failure = 'Trình duyệt không hỗ trợ Web Audio API';
                    return null;
                }
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = 0.9;
                this.master.connect(this.ctx.destination);
            }
            // Trình duyệt có thể tạm dừng context bất cứ lúc nào (chính sách autoplay,
            // chuyển tab...) nên luôn thử đánh thức lại trước mỗi lần phát.
            if (this.ctx.state !== 'running') this.ctx.resume();
            return this.ctx;
        } catch (e) {
            this.failure = String(e && e.message || e);
            return null;
        }
    }

    /**
     * Gọi trong cử chỉ đầu tiên của người dùng: phát một mẫu câm để "mở khoá"
     * âm thanh (bắt buộc trên iOS/Safari), sau đó mọi tiếng động mới kêu được.
     */
    unlock() {
        const ctx = this.init();
        if (!ctx || ctx.state !== 'running') return;
        if (!this.unlocked) {
            try {
                const src = ctx.createBufferSource();
                src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
                src.connect(this.master);
                src.start(0);
                this.unlocked = true;
            } catch (e) {
                this.failure = String(e && e.message || e);
                return;
            }
        }
        // Nhạc nền đang chờ cử chỉ đầu tiên thì cho vào luôn
        if (this.onUnlocked) this.onUnlocked();
    }

    // Trạng thái để soi lỗi nhanh trong console: fruitCrushAudio()
    status() {
        return {
            enabled: this.enabled,
            unlocked: this.unlocked,
            contextState: this.ctx ? this.ctx.state : 'chưa tạo',
            failure: this.failure,
        };
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.unlock();
        return this.enabled;
    }

    // Tiện ích tạo một nốt đơn
    tone({ freq = 440, type = 'sine', start = 0, dur = 0.2, vol = 0.15, sweepTo = null }) {
        if (!this.enabled) return;
        const ctx = this.init();
        if (!ctx) return;

        try {
            const t0 = ctx.currentTime + start;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(this.master);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, t0);
            if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);

            gain.gain.setValueAtTime(vol, t0);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

            osc.start(t0);
            osc.stop(t0 + dur + 0.02);
        } catch (e) {
            this.failure = String(e && e.message || e);
        }
    }

    // Tiếng nổ dựa trên nhiễu trắng
    noise({ dur = 0.3, vol = 0.2, filterFrom = 2000, filterTo = 200 }) {
        if (!this.enabled) return;
        const ctx = this.init();
        if (!ctx) return;

        try {
            const rate = ctx.sampleRate;
            const len = Math.floor(rate * dur);
            const buffer = ctx.createBuffer(1, len, rate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

            const src = ctx.createBufferSource();
            src.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(filterFrom, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(filterTo, ctx.currentTime + dur);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

            src.connect(filter);
            filter.connect(gain);
            gain.connect(this.master);
            src.start();
        } catch (e) {
            this.failure = String(e && e.message || e);
        }
    }

    playSwap() { this.tone({ freq: 300, sweepTo: 620, type: 'triangle', dur: 0.14, vol: 0.12 }); }
    playInvalid() { this.tone({ freq: 220, sweepTo: 120, type: 'square', dur: 0.16, vol: 0.08 }); }

    playMatch(combo = 0) {
        const base = 440 + Math.min(combo, 8) * 90;
        this.tone({ freq: base, type: 'sine', dur: 0.22, vol: 0.16 });
        this.tone({ freq: base * 1.5, type: 'sine', start: 0.07, dur: 0.2, vol: 0.12 });
    }

    playCreateSpecial() {
        [523, 659, 784, 1046].forEach((f, i) =>
            this.tone({ freq: f, type: 'triangle', start: i * 0.05, dur: 0.22, vol: 0.14 }));
    }

    playLine() {
        this.tone({ freq: 900, sweepTo: 200, type: 'sawtooth', dur: 0.3, vol: 0.1 });
        this.noise({ dur: 0.25, vol: 0.12, filterFrom: 5000, filterTo: 800 });
    }

    playBomb() {
        this.noise({ dur: 0.5, vol: 0.28, filterFrom: 1800, filterTo: 80 });
        this.tone({ freq: 120, sweepTo: 40, type: 'sine', dur: 0.45, vol: 0.2 });
    }

    playRainbow() {
        this.noise({ dur: 0.7, vol: 0.2, filterFrom: 6000, filterTo: 300 });
        [392, 523, 659, 784, 1046, 1318].forEach((f, i) =>
            this.tone({ freq: f, type: 'sine', start: i * 0.06, dur: 0.4, vol: 0.13 }));
    }

    playLevelUp() {
        [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((f, i) =>
            this.tone({ freq: f, type: 'sine', start: i * 0.08, dur: 0.3, vol: 0.15 }));
    }

    playGameOver() {
        [400, 300, 200, 150].forEach((f, i) =>
            this.tone({ freq: f, type: 'sawtooth', start: i * 0.15, dur: 0.4, vol: 0.1 }));
    }

    playStar(index) {
        this.tone({ freq: 660 + index * 220, type: 'triangle', dur: 0.35, vol: 0.16 });
    }

    // Thùng gỗ vỡ: tiếng gỗ khô, đục
    playCrate() {
        this.noise({ dur: 0.28, vol: 0.22, filterFrom: 1200, filterTo: 150 });
        this.tone({ freq: 180, sweepTo: 90, type: 'square', dur: 0.16, vol: 0.09 });
    }

    // Dừa chạm mép bàn: tiếng "bịch" trầm rồi leng keng phần thưởng
    playHarvest() {
        this.tone({ freq: 90, sweepTo: 55, type: 'sine', dur: 0.3, vol: 0.22 });
        [784, 1046, 1318].forEach((f, i) =>
            this.tone({ freq: f, type: 'triangle', start: 0.12 + i * 0.07, dur: 0.3, vol: 0.14 }));
    }

    // Đảo trọng lực: tiếng vút đảo chiều
    playFlip() {
        this.tone({ freq: 200, sweepTo: 900, type: 'sawtooth', dur: 0.35, vol: 0.12 });
        this.tone({ freq: 900, sweepTo: 200, type: 'sine', start: 0.3, dur: 0.4, vol: 0.12 });
        this.noise({ dur: 0.6, vol: 0.14, filterFrom: 400, filterTo: 4000 });
    }
}

const sound = new SoundEngine();

/* ============================================================
 *  2b. NHẠC NỀN
 * ============================================================ */

const MUSIC_KEY = 'fruitCrushMusic';

// Mỗi màn một chủ đề: vòng hoà âm ghi bằng số nửa cung so với nốt gốc.
// Chủ đề được chọn theo chỉ số màn nên chơi lại một màn luôn nghe đúng bài đó.
const THEMES = [
    {   // Vườn táo — Đô trưởng, tươi sáng
        name: 'orchard', bpm: 100, root: 60,
        bass: 'triangle', lead: 'triangle',
        chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [9, 12, 16]],
    },
    {   // Nhiệt đới — La thứ, có chút đung đưa
        name: 'tropic', bpm: 108, root: 57,
        bass: 'sine', lead: 'square',
        chords: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [7, 10, 14]],
    },
    {   // Băng giá — Rê thứ, thưa và lạnh
        name: 'frost', bpm: 88, root: 62,
        bass: 'sine', lead: 'sine',
        chords: [[0, 3, 7], [-2, 3, 7], [5, 8, 12], [3, 7, 12]],
    },
    {   // Kho gỗ — Sol mixolydian, chắc nhịp
        name: 'crates', bpm: 112, root: 55,
        bass: 'triangle', lead: 'square',
        chords: [[0, 4, 7], [10, 14, 17], [5, 9, 12], [0, 4, 9]],
    },
    {   // Biển dừa — Fa trưởng, thong thả
        name: 'coconut', bpm: 96, root: 53,
        bass: 'sine', lead: 'triangle',
        chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]],
    },
    {   // Vô trọng lực — Mi thứ, căng và trôi
        name: 'gravity', bpm: 118, root: 52,
        bass: 'sawtooth', lead: 'triangle',
        chords: [[0, 3, 7], [7, 10, 14], [8, 12, 15], [3, 7, 10]],
    },
];

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Nhạc nền tổng hợp bằng Web Audio: không cần tệp âm thanh nào.
 * Dùng bộ lập lịch nhìn trước (lookahead) để nhịp không bị trôi khi trình
 * duyệt bận vẽ hiệu ứng — setTimeout chỉ dùng để *đặt lịch*, còn thời điểm
 * phát nốt luôn tính theo đồng hồ của AudioContext.
 */
class MusicEngine {
    constructor(soundEngine) {
        this.sound = soundEngine;
        this.enabled = true;
        this.playing = false;
        this.timer = null;
        this.gain = null;
        this.theme = null;
        this.transpose = 0;
        this.stepDur = 0.15;
        this.step = 0;
        this.nextTime = 0;
        this.pendingLevel = null;   // màn đang chờ âm thanh được mở khoá
        this.pendingTheme = null;
        this.volume = 0.16;         // nhỏ hơn hẳn hiệu ứng để không át tiếng nổ

        try {
            const saved = localStorage.getItem(MUSIC_KEY);
            if (saved !== null) this.enabled = saved === '1';
        } catch (e) { /* bỏ qua */ }
    }

    // Bắt đầu nhạc của một màn; nếu trình duyệt chưa mở khoá âm thanh thì chờ.
    // themeName cho phép màn đặc biệt chỉ định hẳn bản nhạc của riêng nó.
    play(levelIndex, themeName = null) {
        this.pendingLevel = levelIndex;
        this.pendingTheme = themeName;
        if (!this.enabled) return;
        const ctx = this.sound.init();
        if (!ctx || ctx.state !== 'running') return;
        this.startNow(levelIndex, themeName);
    }

    startNow(levelIndex, themeName = null) {
        const ctx = this.sound.ctx;
        if (!ctx || !this.sound.master) return;

        this.stopNow();
        const picked = themeName ? THEMES.findIndex(th => th.name === themeName) : -1;
        this.theme = THEMES[picked >= 0 ? picked : levelIndex % THEMES.length];
        // dịch giọng theo nhóm màn để cùng một chủ đề vẫn thấy mới
        this.transpose = (Math.floor(levelIndex / THEMES.length) % 4) * 2;
        this.stepDur = 60 / this.theme.bpm / 4;   // mỗi bước là một nốt móc kép

        this.gain = ctx.createGain();
        this.gain.gain.setValueAtTime(0, ctx.currentTime);
        this.gain.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 1.2);
        this.gain.connect(this.sound.master);

        this.step = 0;
        this.nextTime = ctx.currentTime + 0.1;
        this.playing = true;
        this.tick();
    }

    // Lên lịch trước cho các nốt sắp tới rồi hẹn kiểm tra lại
    tick() {
        const ctx = this.sound.ctx;
        if (!ctx || !this.playing) return;

        const lookahead = 0.3;
        let guard = 0;
        while (this.nextTime < ctx.currentTime + lookahead && guard++ < 64) {
            this.playStep(this.step, this.nextTime);
            this.nextTime += this.stepDur;
            this.step = (this.step + 1) % 64;   // vòng lặp 4 ô nhịp
        }

        this.timer = setTimeout(() => this.tick(), 80);
    }

    playStep(step, time) {
        const th = this.theme;
        if (!th) return;
        const chord = th.chords[Math.floor(step / 16) % th.chords.length];
        const inBar = step % 16;

        // Bè trầm: nhấn ở phách mạnh
        if (inBar === 0 || inBar === 6 || inBar === 8 || inBar === 14) {
            this.note(chord[0] - 12, time, this.stepDur * 3.2, th.bass, 0.5);
        }

        // Bè giai điệu rải hợp âm ở các bước chẵn
        if (inBar % 2 === 0) {
            const idx = (step / 2) % chord.length;
            const octave = inBar === 0 || inBar === 8 ? 12 : 0;
            this.note(chord[idx] + 12 + octave, time, this.stepDur * 1.6, th.lead, 0.26);
        }

        // Nốt láy nhẹ cuối ô nhịp cho đỡ đơn điệu
        if (inBar === 15) {
            this.note(chord[chord.length - 1] + 19, time, this.stepDur, th.lead, 0.16);
        }

        // Bộ gõ: tiếng gõ nhẹ ở phách lẻ
        if (inBar % 4 === 2) this.hat(time, 0.05);
        if (inBar === 0 || inBar === 8) this.hat(time, 0.09);
    }

    note(semitone, time, dur, type, vol) {
        const ctx = this.sound.ctx;
        if (!ctx || !this.gain || !this.theme) return;
        try {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(midiToFreq(this.theme.root + this.transpose + semitone), time);

            env.gain.setValueAtTime(0.0001, time);
            env.gain.exponentialRampToValueAtTime(vol, time + 0.02);
            env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

            osc.connect(env);
            env.connect(this.gain);
            osc.start(time);
            osc.stop(time + dur + 0.05);
        } catch (e) { /* bỏ qua một nốt lỗi, không làm gãy nhạc */ }
    }

    hat(time, vol) {
        const ctx = this.sound.ctx;
        if (!ctx || !this.gain) return;
        try {
            const len = Math.floor(ctx.sampleRate * 0.05);
            const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

            const src = ctx.createBufferSource();
            src.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(6000, time);
            const env = ctx.createGain();
            env.gain.setValueAtTime(vol, time);
            env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

            src.connect(filter);
            filter.connect(env);
            env.connect(this.gain);
            src.start(time);
        } catch (e) { /* bỏ qua */ }
    }

    // Tắt dần rồi dừng hẳn
    stop(fadeSec = 0.6) {
        const ctx = this.sound.ctx;
        if (!this.playing || !ctx || !this.gain) { this.stopNow(); return; }
        const g = this.gain;
        try {
            g.gain.cancelScheduledValues(ctx.currentTime);
            g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fadeSec);
        } catch (e) { /* bỏ qua */ }
        this.playing = false;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        setTimeout(() => { try { g.disconnect(); } catch (e) { /* bỏ qua */ } }, fadeSec * 1000 + 100);
        this.gain = null;
    }

    stopNow() {
        this.playing = false;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        if (this.gain) {
            try { this.gain.disconnect(); } catch (e) { /* bỏ qua */ }
            this.gain = null;
        }
    }

    // Gọi khi người chơi vừa có cử chỉ đầu tiên: nhạc đang chờ thì cho chạy
    onUnlock() {
        if (this.enabled && !this.playing && this.pendingLevel !== null) {
            this.startNow(this.pendingLevel, this.pendingTheme);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        try { localStorage.setItem(MUSIC_KEY, this.enabled ? '1' : '0'); } catch (e) { /* bỏ qua */ }
        if (this.enabled) this.play(this.pendingLevel || 0, this.pendingTheme);
        else this.stop(0.3);
        return this.enabled;
    }

    themeName() {
        return this.theme ? this.theme.name : '—';
    }
}

const music = new MusicEngine(sound);
sound.onUnlocked = () => music.onUnlock();

/* ============================================================
 *  3. HỆ THỐNG HIỆU ỨNG (CANVAS PARTICLES)
 * ============================================================ */

class FX {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.parts = [];
        this.running = false;
        this.last = 0;
        this.w = 0;
        this.h = 0;
    }

    resize(w, h) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.w = w;
        this.h = h;
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    add(p) {
        this.parts.push(p);
        this.start();
    }

    burst(x, y, color, count = 14, power = 1) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
            const speed = (70 + Math.random() * 160) * power;
            this.add({
                kind: 'spark',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40 * power,
                size: 2 + Math.random() * 3.5 * power,
                color,
                life: 0.45 + Math.random() * 0.45,
                age: 0,
            });
        }
    }

    juice(x, y, color) {
        // vệt "nước quả" bay lên rồi rơi xuống
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
            const speed = 100 + Math.random() * 120;
            this.add({
                kind: 'drop',
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color,
                life: 0.7 + Math.random() * 0.3,
                age: 0,
            });
        }
    }

    shock(x, y, color, maxR = 120) {
        this.add({ kind: 'ring', x, y, r: 6, maxR, color, life: 0.5, age: 0, width: 6 });
    }

    beam(orientation, pos, color) {
        this.add({ kind: 'beam', orientation, pos, color, life: 0.42, age: 0 });
    }

    flash(color, strength = 0.35) {
        this.add({ kind: 'flash', color, strength, life: 0.5, age: 0 });
    }

    sweepRainbow() {
        this.add({ kind: 'rainbow', life: 0.9, age: 0 });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.last = performance.now();
        requestAnimationFrame(t => this.tick(t));
    }

    tick(now) {
        const dt = Math.min((now - this.last) / 1000, 0.05);
        this.last = now;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (const p of this.parts) {
            p.age += dt;
            const t = p.age / p.life;
            if (t >= 1) continue;
            const alpha = 1 - t;

            if (p.kind === 'spark' || p.kind === 'drop') {
                p.vy += (p.kind === 'drop' ? 700 : 420) * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.kind === 'ring') {
                const r = p.r + (p.maxR - p.r) * easeOut(t);
                ctx.globalAlpha = alpha * 0.9;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.width * (1 - t) + 1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.kind === 'beam') {
                const grow = easeOut(Math.min(t * 2.2, 1));
                ctx.globalAlpha = alpha;
                const grad = p.orientation === 'h'
                    ? ctx.createLinearGradient(0, p.pos - 26, 0, p.pos + 26)
                    : ctx.createLinearGradient(p.pos - 26, 0, p.pos + 26, 0);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.5, p.color);
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = grad;
                if (p.orientation === 'h') {
                    const len = this.w * grow;
                    ctx.fillRect(this.w / 2 - len / 2, p.pos - 26, len, 52);
                } else {
                    const len = this.h * grow;
                    ctx.fillRect(p.pos - 26, this.h / 2 - len / 2, 52, len);
                }
            } else if (p.kind === 'flash') {
                ctx.globalAlpha = alpha * p.strength;
                ctx.fillStyle = p.color;
                ctx.fillRect(0, 0, this.w, this.h);
            } else if (p.kind === 'rainbow') {
                const grad = ctx.createLinearGradient(0, 0, this.w, this.h);
                ['#ff4d6d', '#ff9f43', '#ffd93d', '#7bed9f', '#00f0ff', '#b06cff'].forEach((c, i, arr) => {
                    grad.addColorStop(i / (arr.length - 1), c);
                });
                ctx.globalAlpha = alpha * 0.45;
                ctx.fillStyle = grad;
                const bandH = this.h * 0.5;
                const y = -bandH + (this.h + bandH * 2) * easeOut(t);
                ctx.fillRect(0, y, this.w, bandH);
            }
        }

        ctx.restore();
        this.parts = this.parts.filter(p => p.age < p.life);

        if (this.parts.length) {
            requestAnimationFrame(t => this.tick(t));
        } else {
            ctx.clearRect(0, 0, this.w, this.h);
            this.running = false;
        }
    }
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ============================================================
 *  4. TRẠNG THÁI & DOM
 * ============================================================ */

const state = {
    grid: [],
    frost: [],          // số lớp băng còn lại của từng ô
    frostEls: [],       // phần tử hiển thị băng tương ứng
    levelIndex: 0,
    config: null,
    score: 0,
    moves: 0,
    counters: null,     // tiến độ của mọi loại mục tiêu
    gravity: 1,         // 1 = rơi xuống, -1 = rơi ngược lên
    movesUntilFlip: 0,
    harvestLeft: 0,     // số dừa chưa được thả xuống bàn
    busy: true,
    combo: 0,
    selected: null,
    lastSwap: null,
    idleTimer: null,
    hintCells: [],
    started: false,
};

// Bộ đếm tiến độ cho mọi kiểu mục tiêu
function newCounters() {
    return {
        [OBJ.FRUIT]: FRUITS.map(() => 0),
        [OBJ.FROST]: 0,
        [OBJ.CRATE]: 0,
        [OBJ.HARVEST]: 0,
        [OBJ.SPECIAL]: 0,
        [OBJ.COMBO]: 0,
    };
}

let cellSize = 56;
let gapSize = 6;
let step = 62;
let padX = 14;   // viền an toàn hai bên + phía dưới
let padTop = 6;  // viền trên, bằng gapSize để vẫn che được quả đang rơi
let uid = 0;

const boardEl = document.getElementById('board');
const cellLayer = document.getElementById('cell-layer');
const tileLayer = document.getElementById('tile-layer');
const popupLayer = document.getElementById('popup-layer');
const boardWrapper = document.getElementById('board-wrapper');
const boardArea = document.querySelector('.board-area');
const fx = new FX(document.getElementById('fx-canvas'));

const scoreEl = document.getElementById('score');
const targetScoreEl = document.getElementById('target-score');
const movesEl = document.getElementById('moves');
const levelEl = document.getElementById('level');
const progressEl = document.getElementById('level-progress');
const objectivesEl = document.getElementById('objectives');
const starRow = document.getElementById('star-row');
const comboBanner = document.getElementById('combo-banner');
const gravityBadge = document.getElementById('gravity-badge');
const devBadge = document.getElementById('dev-badge');

const btnRestart = document.getElementById('btn-restart');
const btnSound = document.getElementById('btn-sound');
const btnLevels = document.getElementById('btn-levels');
const btnScores = document.getElementById('btn-scores');
const btnLang = document.getElementById('btn-lang');
const btnMusic = document.getElementById('btn-music');
const musicIcon = document.getElementById('music-icon');
const langLabel = document.getElementById('lang-label');
const soundIcon = document.getElementById('sound-icon');

const modalVictory = document.getElementById('modal-victory');
const modalGameOver = document.getElementById('modal-gameover');
const modalLevels = document.getElementById('modal-levels');
const modalScores = document.getElementById('modal-scores');
const modalIntro = document.getElementById('modal-intro');

const btnNextLevel = document.getElementById('btn-next-level');
const btnRetry = document.getElementById('btn-retry');
const btnStart = document.getElementById('btn-start');
const btnCloseLevels = document.getElementById('btn-close-levels');
const btnVictoryMap = document.getElementById('btn-victory-map');
const btnGameOverMap = document.getElementById('btn-gameover-map');

const victoryMsgEl = document.getElementById('victory-msg');
const victoryStatsEl = document.getElementById('victory-stats');
const victoryStars = document.getElementById('victory-stars');
const gameoverStatsEl = document.getElementById('gameover-stats');
const gameoverReasonEl = document.getElementById('gameover-reason');
const levelGridEl = document.getElementById('level-grid');
const scoreListEl = document.getElementById('score-list');
const toastEl = document.getElementById('toast');
const btnCloseScores = document.getElementById('btn-close-scores');
const victoryRecordEl = document.getElementById('victory-record');
const victoryShareEl = document.getElementById('victory-share');
const gameoverRecordEl = document.getElementById('gameover-record');
const gameoverShareEl = document.getElementById('gameover-share');
const introLevelEl = document.getElementById('intro-level');
const introDescEl = document.getElementById('intro-desc');
const introGoalsEl = document.getElementById('intro-goals');
const introStatsEl = document.getElementById('intro-stats');

/* ============================================================
 *  5. TIẾN TRÌNH (LOCALSTORAGE)
 * ============================================================ */

function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            return { unlocked: data.unlocked || 1, stars: data.stars || {} };
        }
    } catch (e) { /* bỏ qua */ }
    return { unlocked: 1, stars: {} };
}

function saveProgress(progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* bỏ qua */ }
}

let progress = loadProgress();

/* ============================================================
 *  6. KÍCH THƯỚC BÀN CHƠI
 * ============================================================ */

function computeMetrics() {
    // Đo theo cột chứa bàn cờ: .board-wrapper là flex item nên tự co theo nội dung
    const areaWidth = (boardArea ? boardArea.clientWidth : 0) || window.innerWidth;
    const available = areaWidth - 24; // trừ padding + viền của wrapper

    // Viền an toàn để các hiệu ứng phóng to (bounce, gợi ý, nổ) của những ô sát
    // mép không bị overflow:hidden cắt mất góc.
    padX = available >= 400 ? 14 : 10;

    const maxBoard = Math.max(200, Math.min(available - padX * 2, 480));
    gapSize = maxBoard >= 400 ? 6 : 4;
    step = Math.floor((maxBoard + gapSize) / GRID);
    cellSize = step - gapSize;

    // Viền trên đúng bằng khoảng cách giữa hai ô: quả mới rơi từ hàng -1 sẽ nằm
    // sát ngay mép vùng cắt nên vẫn bị che kín trước khi rơi vào bàn.
    padTop = gapSize;

    const boardSize = step * GRID - gapSize;
    const boxW = boardSize + padX * 2;
    const boxH = boardSize + padTop + padX;

    boardEl.style.setProperty('--cell', cellSize + 'px');
    boardEl.style.setProperty('--step', step + 'px');
    boardEl.style.width = boxW + 'px';
    boardEl.style.height = boxH + 'px';
    boardEl.style.fontSize = Math.round(cellSize * 0.62) + 'px';

    fx.resize(boxW, boxH);
}

function buildCellBackground() {
    cellLayer.innerHTML = '';
    state.frostEls = [];
    for (let r = 0; r < GRID; r++) {
        state.frostEls[r] = [];
        for (let c = 0; c < GRID; c++) {
            const bg = document.createElement('div');
            bg.className = 'cell-bg';
            const { x, y } = cellPos(r, c);
            bg.style.transform = `translate3d(${x}px, ${y}px, 0)`;

            // lớp băng là phần tử con để có thể tự chạy animation riêng
            const face = document.createElement('div');
            face.className = 'frost-face';
            bg.appendChild(face);

            cellLayer.appendChild(bg);
            state.frostEls[r][c] = face;
        }
    }
    paintAllFrost();
}

// Vẽ lại lớp băng của một ô theo số lớp còn lại
function paintFrost(r, c) {
    const el = state.frostEls[r] && state.frostEls[r][c];
    if (!el) return;
    const layers = (state.frost[r] && state.frost[r][c]) || 0;
    el.classList.toggle('frost-1', layers === 1);
    el.classList.toggle('frost-2', layers >= 2);
}

function paintAllFrost() {
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) paintFrost(r, c);
    }
}

function cellPos(r, c) {
    return { x: padX + c * step, y: padTop + r * step };
}

function cellCenter(r, c) {
    return { x: padX + c * step + cellSize / 2, y: padTop + r * step + cellSize / 2 };
}

/* ============================================================
 *  7. TẠO & HIỂN THỊ Ô
 * ============================================================ */

function createCell(type, special = null, kind = KIND.FRUIT) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.style.width = cellSize + 'px';
    el.style.height = cellSize + 'px';

    const inner = document.createElement('div');
    inner.className = 'fruit-inner';
    el.appendChild(inner);

    const cell = { id: ++uid, type, special, kind, el, inner, r: 0, c: 0, vr: 0, vc: 0 };
    paintCell(cell);
    tileLayer.appendChild(el);
    return cell;
}

function createCrate() {
    return createCell(0, null, KIND.CRATE);
}

function createHarvest() {
    return createCell(0, null, KIND.HARVEST);
}

function paintCell(cell) {
    cell.el.classList.remove('sp-lineH', 'sp-lineV', 'sp-bomb', 'sp-rainbow', 'is-crate', 'is-harvest');

    if (cell.kind === KIND.CRATE) {
        cell.inner.textContent = '📦';
        cell.el.classList.add('is-crate');
        cell.el.style.setProperty('--fruit-color', '#c98b4b');
        return;
    }

    if (cell.kind === KIND.HARVEST) {
        cell.inner.textContent = '🥥';
        cell.el.classList.add('is-harvest');
        cell.el.style.setProperty('--fruit-color', '#8b5a2b');
        return;
    }

    const fruit = FRUITS[cell.type];
    cell.el.style.setProperty('--fruit-color', fruit.color);

    if (cell.special === SP.RAINBOW) {
        cell.inner.textContent = '🌈';
        cell.el.classList.add('sp-rainbow');
    } else {
        cell.inner.textContent = fruit.emoji;
        if (cell.special === SP.LINE_H) cell.el.classList.add('sp-lineH');
        else if (cell.special === SP.LINE_V) cell.el.classList.add('sp-lineV');
        else if (cell.special === SP.BOMB) cell.el.classList.add('sp-bomb');
    }
}

// Chỉ quả thường mới tráo/ghép được; thùng gỗ và dừa thì không
function isFruit(cell) {
    return !!cell && cell.kind === KIND.FRUIT;
}

function applyPos(cell, vr, vc, ms) {
    const { x, y } = cellPos(vr, vc);
    cell.vr = vr;
    cell.vc = vc;
    cell.el.style.transitionDuration = (ms || 0) + 'ms';
    cell.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (!ms) void cell.el.offsetWidth; // ép trình duyệt áp dụng ngay
}

function moveCellTo(cell, r, c) {
    const dist = Math.max(Math.abs(r - cell.vr), Math.abs(c - cell.vc));
    const ms = Math.min(140 + dist * 55, 520);
    applyPos(cell, r, c, ms);
    return ms;
}

function repositionAll() {
    // Trên điện thoại, thanh địa chỉ trượt lên xuống làm bắn sự kiện resize ngay
    // lúc còn ở màn hình chào — lúc đó bàn cờ chưa dựng nên state.grid rỗng và
    // hàm này ném lỗi.
    if (!state.grid || !state.grid.length) return;
    for (let r = 0; r < GRID; r++) {
        const row = state.grid[r];
        if (!row) continue;
        for (let c = 0; c < GRID; c++) {
            const cell = row[c];
            if (cell) {
                cell.el.style.width = cellSize + 'px';
                cell.el.style.height = cellSize + 'px';
                applyPos(cell, r, c, 0);
            }
        }
    }
}

/* ============================================================
 *  8. KHỞI TẠO MÀN CHƠI
 * ============================================================ */

function randomType() {
    return Math.floor(Math.random() * state.config.colors);
}

function startLevel(index, showIntro = true) {
    state.levelIndex = index;
    state.config = prepareLevel(getLevelConfig(index));
    state.score = 0;
    state.moves = state.config.moves;
    state.counters = newCounters();
    state.selected = null;
    state.combo = 0;
    state.busy = true;
    state.started = false;
    state.gravity = 1;
    state.movesUntilFlip = state.config.gravityFlip || 0;
    state.harvestLeft = state.config.harvest ? state.config.harvest.total : 0;

    computeMetrics();
    buildFrost();
    buildCellBackground();
    buildGrid();
    renderObjectives();
    updateGravityIndicator();
    updateUI();

    hideModal(modalVictory);
    hideModal(modalGameOver);
    hideModal(modalLevels);

    // Mỗi màn một chủ đề nhạc riêng; nếu trình duyệt chưa mở khoá âm thanh thì
    // nhạc sẽ tự vào ngay khi người chơi chạm lần đầu.
    music.play(index, state.config.music || null);

    if (showIntro) {
        showIntroModal();
    } else {
        hideModal(modalIntro);
        state.busy = false;
        state.started = true;
        scheduleHint();
    }
}

// Đọc sơ đồ màn chơi để rải băng lên bàn
function buildFrost() {
    const layout = state.config.layout;
    state.frost = [];
    for (let r = 0; r < GRID; r++) {
        state.frost[r] = [];
        const row = layout ? (layout[r] || '') : '';
        for (let c = 0; c < GRID; c++) {
            const ch = row[c] || TILE_EMPTY;
            state.frost[r][c] = ch === TILE_FROST2 ? 2 : (ch === TILE_FROST1 ? 1 : 0);
        }
    }
}

function layoutChar(r, c) {
    const layout = state.config.layout;
    if (!layout) return TILE_EMPTY;
    const row = layout[r] || '';
    return row[c] || TILE_EMPTY;
}

function buildGrid() {
    tileLayer.innerHTML = '';
    state.grid = [];

    for (let r = 0; r < GRID; r++) {
        state.grid[r] = [];
        for (let c = 0; c < GRID; c++) {
            let cell;

            const ch = layoutChar(r, c);

            if (ch === TILE_CRATE) {
                cell = createCrate();
            } else {
                let type;
                let guard = 0;
                do {
                    type = randomType();
                    guard++;
                } while (guard < 40 && (
                    (c >= 2 && isFruit(state.grid[r][c - 1]) && isFruit(state.grid[r][c - 2]) &&
                        state.grid[r][c - 1].type === type && state.grid[r][c - 2].type === type) ||
                    (r >= 2 && isFruit(state.grid[r - 1][c]) && isFruit(state.grid[r - 2][c]) &&
                        state.grid[r - 1][c].type === type && state.grid[r - 2][c].type === type)
                ));
                // Màn thưởng có thể tặng sẵn quả đặc biệt ngay tại ô này
                cell = createCell(type, TILE_GIFTS[ch] || null);
            }

            cell.r = r;
            cell.c = c;
            state.grid[r][c] = cell;
            applyPos(cell, r, c, 0);
            // hiệu ứng xuất hiện lần lượt (dọn class sau khi chạy xong)
            const delay = (r + c) * 22;
            cell.inner.style.animationDelay = `${delay}ms`;
            cell.el.classList.add('spawn-in');
            setTimeout(() => {
                cell.el.classList.remove('spawn-in');
                cell.inner.style.animationDelay = '';
            }, delay + 520);
        }
    }

    // Thả sẵn vài quả dừa ở hàng đầu theo hướng trọng lực.
    // Chỉ bốc trong những cột không bị thùng gỗ chiếm chỗ, nếu không thì màn có
    // hàng đầu nhiều thùng (ví dụ '..XXXX..') sẽ vào màn mà chẳng có quả dừa nào.
    if (state.config.harvest) {
        const r = entryRow();
        const freeCols = range(GRID).filter(c => {
            const cell = state.grid[r][c];
            return cell && cell.kind !== KIND.CRATE;
        });
        const onBoard = Math.min(state.config.harvest.onBoard || 1, state.harvestLeft, freeCols.length);

        shuffled(freeCols).slice(0, onBoard).forEach(c => {
            state.grid[r][c].el.remove();
            const coconut = createHarvest();
            coconut.r = r;
            coconut.c = c;
            state.grid[r][c] = coconut;
            applyPos(coconut, r, c, 0);
            state.harvestLeft--;
        });
    }

    if (!findHint()) reshuffleBoard(false);
}

// Hàng mà quả mới rơi vào (theo hướng trọng lực hiện tại)
function entryRow() {
    return state.gravity === 1 ? 0 : GRID - 1;
}

// Hàng đích của dừa: mép bàn theo hướng rơi
function landingRow() {
    return state.gravity === 1 ? GRID - 1 : 0;
}

function range(n) {
    return Array.from({ length: n }, (_, i) => i);
}

function shuffled(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/* ============================================================
 *  9. GIAO DIỆN
 * ============================================================ */

function updateUI() {
    scoreEl.textContent = state.score;
    targetScoreEl.textContent = state.config.target;
    movesEl.textContent = state.moves;
    levelEl.textContent = state.levelIndex + 1;

    const progressPct = Math.min((state.score / state.config.target) * 100, 100);
    progressEl.style.width = `${progressPct}%`;

    const stars = starCount();
    starRow.querySelectorAll('.star').forEach(el => {
        el.classList.toggle('active', Number(el.dataset.star) <= stars);
    });

    updateObjectiveProgress();
}

function starCount(score = state.score) {
    const t = state.config.target;
    if (score >= t * 2) return 3;
    if (score >= t * 1.5) return 2;
    if (score >= t) return 1;
    return 0;
}

// Biểu tượng đại diện cho từng kiểu mục tiêu
function objectiveIcon(obj) {
    switch (obj.type) {
        case OBJ.FROST: return '❄️';
        case OBJ.CRATE: return '📦';
        case OBJ.HARVEST: return '🥥';
        case OBJ.SPECIAL: return '✨';
        case OBJ.COMBO: return '🔥';
        default: return FRUITS[obj.fruit].emoji;
    }
}

// Khoá duy nhất để tìm lại phần tử của mục tiêu trên giao diện
function objectiveKey(obj) {
    return obj.type === OBJ.FRUIT ? `fruit-${obj.fruit}` : obj.type;
}

function objectiveProgress(obj) {
    if (obj.type === OBJ.FRUIT) return state.counters[OBJ.FRUIT][obj.fruit];
    return state.counters[obj.type];
}

function renderObjectives() {
    objectivesEl.innerHTML = '';
    state.config.objectives.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'objective';
        item.dataset.key = objectiveKey(obj);
        item.title = t('obj_' + obj.type);
        item.innerHTML = `
            <span class="objective-icon">${objectiveIcon(obj)}</span>
            <span class="objective-count"><b>0</b>/${obj.count}</span>
            <i class="fa-solid fa-check objective-check"></i>`;
        objectivesEl.appendChild(item);
    });
}

function updateObjectiveProgress() {
    state.config.objectives.forEach(obj => {
        const item = objectivesEl.querySelector(`.objective[data-key="${objectiveKey(obj)}"]`);
        if (!item) return;
        const got = Math.min(objectiveProgress(obj), obj.count);
        const bold = item.querySelector('b');
        if (bold.textContent !== String(got)) {
            bold.textContent = got;
            item.classList.remove('bump');
            void item.offsetWidth;
            item.classList.add('bump');
        }
        item.classList.toggle('done', got >= obj.count);
    });
}

function objectivesComplete() {
    return state.config.objectives.every(obj => objectiveProgress(obj) >= obj.count);
}

/**
 * Dịch lại toàn bộ giao diện: các nhãn tĩnh gắn data-i18n / data-i18n-html,
 * cộng với những phần được dựng bằng JS (mô tả màn, thống kê trong modal...).
 */
function applyLanguage() {
    document.documentElement.lang = lang;
    document.title = t('title');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });

    if (langLabel) langLabel.textContent = t('langSwitch');
    musicIcon.className = music.enabled ? 'fa-solid fa-music' : 'fa-solid fa-volume-xmark';
    btnMusic.classList.toggle('btn-muted', !music.enabled);
    btnMusic.title = music.enabled ? t('musicOn', { theme: music.themeName() }) : t('musicOff');
    btnSound.title = sound.enabled
        ? t('soundState', { state: sound.status().contextState })
        : t('soundOff');

    // Nội dung động: chỉ vẽ lại khi màn chơi đã sẵn sàng
    if (state.config) {
        renderIntroContent();
        renderVictoryContent();
        renderGameOverContent();
    }
    if (!modalLevels.classList.contains('hidden')) renderLevelMap();
    if (!modalScores.classList.contains('hidden')) renderScoreBoard();
}

function setLanguage(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try {
        localStorage.setItem(LANG_KEY, lang);
        localStorage.setItem(GLOBAL_LANG_KEY, lang); // giữ đồng bộ với cả site
    } catch (e) { /* bỏ qua */ }
    applyLanguage();
}

function showModal(modal) {
    modal.classList.remove('hidden');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('pop-in');
    void content.offsetWidth;
    content.classList.add('pop-in');
}

function hideModal(modal) {
    modal.classList.add('hidden');
}

function renderIntroContent() {
    introLevelEl.textContent = state.levelIndex + 1;
    introDescEl.textContent = levelDesc(state.config);
    const goals = state.config.objectives.map(o =>
        `<div class="intro-goal" title="${t('obj_' + o.type)}">` +
        `<span>${objectiveIcon(o)}</span> x${o.count}</div>`);
    // Báo trước cơ chế đảo trọng lực để người chơi còn tính đường
    if (state.config.gravityFlip) {
        goals.push(`<div class="intro-goal is-warning"><span>🔄</span> ` +
                   `${t('gravityEvery', { n: state.config.gravityFlip })}</div>`);
    }
    introGoalsEl.innerHTML = goals.join('');
    introStatsEl.innerHTML = t('introStats', {
        moves: state.config.moves,
        target: state.config.target,
    });
}

function showIntroModal() {
    renderIntroContent();
    showModal(modalIntro);
}

function renderVictoryContent() {
    victoryMsgEl.innerHTML = t('victoryMsg', { level: state.levelIndex + 1 });
    victoryStatsEl.textContent = `${t('scoreLabel')}: ${state.score}`;
    renderEndgamePanel(victoryRecordEl, victoryShareEl, {
        score: state.score,
        level: state.levelIndex + 1,
        stars: starCount(),
    });
}

function renderGameOverContent() {
    gameoverReasonEl.textContent = objectivesComplete() ? t('reasonScore') : t('reasonObjective');
    gameoverStatsEl.textContent = t('gameoverStats', {
        score: state.score,
        target: state.config.target,
    });
    renderEndgamePanel(gameoverRecordEl, gameoverShareEl, {
        score: state.score,
        level: state.levelIndex + 1,
        stars: 0,
    });
}

function renderLevelMap() {
    levelGridEl.innerHTML = '';
    const total = Math.max(LEVELS.length, progress.unlocked + 2);
    for (let i = 0; i < total; i++) {
        const unlocked = dev.enabled || i < progress.unlocked;
        const stars = progress.stars[i] || 0;
        const btn = document.createElement('button');
        btn.className = 'level-node' + (unlocked ? '' : ' locked');

        // Xem trước các cơ chế của màn để thấy ngay màn nào chơi kiểu gì
        const cfg = prepareLevel(getLevelConfig(i));
        const icons = cfg.objectives.slice(0, 3).map(objectiveIcon).join('');
        const flip = cfg.gravityFlip ? '🔄' : '';

        btn.innerHTML = unlocked
            ? `<span class="level-icons">${icons}${flip}</span>
               <span class="level-num">${i + 1}</span>
               <span class="level-stars">${[1, 2, 3].map(s =>
                   `<i class="fa-solid fa-star ${s <= stars ? 'on' : ''}"></i>`).join('')}</span>`
            : `<i class="fa-solid fa-lock"></i>`;
        if (unlocked) btn.title = `${t('levelWord')} ${i + 1} — ${levelDesc(cfg)}`;
        if (unlocked) {
            btn.addEventListener('click', () => {
                sound.init();
                hideModal(modalLevels);
                startLevel(i);
            });
        }
        levelGridEl.appendChild(btn);
    }
}

function floatText(x, y, text, className = '') {
    const el = document.createElement('div');
    el.className = 'score-pop ' + className;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    popupLayer.appendChild(el);
    setTimeout(() => el.remove(), 950);
}

function showCombo(n) {
    if (n < 2) return;
    showBanner(`COMBO x${n}!`);
}

// Dòng chữ lớn chạy ngang bàn cờ (combo, đảo trọng lực...)
function showBanner(text, variant = '') {
    comboBanner.textContent = text;
    comboBanner.className = 'combo-banner' + (variant ? ' ' + variant : '');
    void comboBanner.offsetWidth;
    comboBanner.classList.add('show');
}

function shakeBoard(strength = 'small') {
    boardWrapper.classList.remove('shake-small', 'shake-big');
    void boardWrapper.offsetWidth;
    boardWrapper.classList.add(strength === 'big' ? 'shake-big' : 'shake-small');
}

/* ============================================================
 *  10. ĐIỀU KHIỂN (CHẠM / VUỐT)
 * ============================================================ */

let pointerStart = null;

boardEl.addEventListener('pointerdown', e => {
    if (state.busy || !state.started) return;
    sound.init();
    const pos = pointFromEvent(e);
    if (!pos) return;
    pointerStart = { ...pos, x: e.clientX, y: e.clientY, moved: false };
    clearHint();
});

window.addEventListener('pointermove', e => {
    if (!pointerStart || state.busy) return;
    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;
    if (Math.abs(dx) < step * 0.45 && Math.abs(dy) < step * 0.45) return;

    let tr = pointerStart.r;
    let tc = pointerStart.c;
    if (Math.abs(dx) > Math.abs(dy)) tc += dx > 0 ? 1 : -1;
    else tr += dy > 0 ? 1 : -1;

    pointerStart.moved = true;
    const start = { r: pointerStart.r, c: pointerStart.c };
    pointerStart = null;
    deselect();
    if (inBounds(tr, tc)) trySwap(start.r, start.c, tr, tc);
});

window.addEventListener('pointerup', e => {
    if (!pointerStart || state.busy) { pointerStart = null; return; }
    const pos = pointFromEvent(e);
    pointerStart = null;
    if (!pos) return;
    handleTap(pos.r, pos.c);
});

window.addEventListener('pointercancel', () => { pointerStart = null; });

function pointFromEvent(e) {
    const rect = boardEl.getBoundingClientRect();
    // Trừ viền an toàn, rồi kẹp lại để phần viền vẫn tính là ô ngoài cùng
    const c = clampIndex(Math.floor((e.clientX - rect.left - padX) / step));
    const r = clampIndex(Math.floor((e.clientY - rect.top - padTop) / step));
    if (!inBounds(r, c)) return null;
    return { r, c };
}

function clampIndex(i) {
    return Math.max(0, Math.min(GRID - 1, i));
}

function inBounds(r, c) {
    return r >= 0 && r < GRID && c >= 0 && c < GRID;
}

function handleTap(r, c) {
    const cell = state.grid[r][c];
    if (!cell) return;

    // Thùng gỗ và dừa không tráo được — lắc nhẹ để báo cho người chơi
    if (!isFruit(cell)) {
        deselect();
        cell.el.classList.remove('nudge');
        void cell.el.offsetWidth;
        cell.el.classList.add('nudge');
        setTimeout(() => cell.el.classList.remove('nudge'), 320);
        sound.playInvalid();
        return;
    }

    if (!state.selected) {
        state.selected = cell;
        cell.el.classList.add('selected');
        return;
    }

    if (state.selected === cell) {
        deselect();
        return;
    }

    const prev = state.selected;
    const adjacent = Math.abs(prev.r - r) + Math.abs(prev.c - c) === 1;
    deselect();

    if (adjacent) {
        trySwap(prev.r, prev.c, r, c);
    } else {
        state.selected = cell;
        cell.el.classList.add('selected');
    }
}

function deselect() {
    if (state.selected) state.selected.el.classList.remove('selected');
    state.selected = null;
}

/* ============================================================
 *  11. LOGIC TRÁO ĐỔI
 * ============================================================ */

async function trySwap(r1, c1, r2, c2) {
    if (state.busy) return;
    const a = state.grid[r1][c1];
    const b = state.grid[r2][c2];
    if (!isFruit(a) || !isFruit(b)) return;

    state.busy = true;
    clearHint();
    sound.playSwap();

    swapCells(a, b);
    await animateSwap(a, b);

    const comboClear = specialComboCells(a, b);
    const matches = findMatches();

    if (comboClear) {
        state.moves--;
        updateUI();
        state.combo = 0;
        await runClear(comboClear.cells, comboClear.origin);
        await collapseAndRefill();
        await resolveCascades();
    } else if (matches.length) {
        state.moves--;
        updateUI();
        state.lastSwap = [a, b];
        state.combo = 0;
        await resolveCascades();
    } else {
        // không tạo được match → trả về vị trí cũ
        sound.playInvalid();
        a.el.classList.add('nudge');
        b.el.classList.add('nudge');
        swapCells(a, b);
        await animateSwap(a, b);
        setTimeout(() => {
            a.el.classList.remove('nudge');
            b.el.classList.remove('nudge');
        }, 150);
        state.busy = false;
        scheduleHint();
        return;
    }

    finishTurn();
}

function swapCells(a, b) {
    const ar = a.r, ac = a.c, br = b.r, bc = b.c;
    state.grid[ar][ac] = b;
    state.grid[br][bc] = a;
    a.r = br; a.c = bc;
    b.r = ar; b.c = ac;
}

async function animateSwap(a, b) {
    applyPos(a, a.r, a.c, 190);
    applyPos(b, b.r, b.c, 190);
    await wait(200);
}

/* ============================================================
 *  12. TÌM MATCH
 * ============================================================ */

function matchType(cell) {
    if (!isFruit(cell)) return -1;              // ô trống, thùng gỗ, dừa: cắt đứt chuỗi
    if (cell.special === SP.RAINBOW) return -2; // cầu vồng không tham gia match thường
    return cell.type;
}

function findRuns() {
    const runs = [];

    for (let r = 0; r < GRID; r++) {
        let c = 0;
        while (c < GRID) {
            const t = matchType(state.grid[r][c]);
            if (t < 0) { c++; continue; }
            let end = c + 1;
            while (end < GRID && matchType(state.grid[r][end]) === t) end++;
            if (end - c >= 3) runs.push({ dir: 'h', r, c, len: end - c, type: t });
            c = end;
        }
    }

    for (let c = 0; c < GRID; c++) {
        let r = 0;
        while (r < GRID) {
            const t = matchType(state.grid[r][c]);
            if (t < 0) { r++; continue; }
            let end = r + 1;
            while (end < GRID && matchType(state.grid[end][c]) === t) end++;
            if (end - r >= 3) runs.push({ dir: 'v', r, c, len: end - r, type: t });
            r = end;
        }
    }

    return runs;
}

function runCells(run) {
    const out = [];
    for (let i = 0; i < run.len; i++) {
        const r = run.dir === 'h' ? run.r : run.r + i;
        const c = run.dir === 'h' ? run.c + i : run.c;
        out.push(state.grid[r][c]);
    }
    return out;
}

// Gộp các run giao nhau thành nhóm (để nhận diện hình L / T)
function findMatches() {
    const runs = findRuns();
    if (!runs.length) return [];

    const groups = [];
    const used = new Array(runs.length).fill(false);

    for (let i = 0; i < runs.length; i++) {
        if (used[i]) continue;
        const groupRuns = [runs[i]];
        used[i] = true;
        const keys = new Set(runCells(runs[i]).map(cell => `${cell.r},${cell.c}`));

        let changed = true;
        while (changed) {
            changed = false;
            for (let j = 0; j < runs.length; j++) {
                if (used[j] || runs[j].type !== runs[i].type) continue;
                const cells = runCells(runs[j]);
                if (cells.some(cell => keys.has(`${cell.r},${cell.c}`))) {
                    used[j] = true;
                    groupRuns.push(runs[j]);
                    cells.forEach(cell => keys.add(`${cell.r},${cell.c}`));
                    changed = true;
                }
            }
        }

        const cells = Array.from(keys).map(k => {
            const [r, c] = k.split(',').map(Number);
            return state.grid[r][c];
        }).filter(Boolean);

        groups.push({ runs: groupRuns, cells, type: runs[i].type });
    }

    return groups;
}

// Quyết định loại quả đặc biệt được tạo ra và vị trí của nó
function planSpecial(group) {
    const hRuns = group.runs.filter(r => r.dir === 'h');
    const vRuns = group.runs.filter(r => r.dir === 'v');
    const longest = group.runs.reduce((a, b) => (b.len > a.len ? b : a));

    let special = null;
    if (hRuns.length && vRuns.length) special = SP.BOMB;
    else if (longest.len >= 5) special = SP.RAINBOW;
    else if (longest.len === 4) special = longest.dir === 'h' ? SP.LINE_H : SP.LINE_V;
    if (!special) return null;

    // Ưu tiên đặt tại ô người chơi vừa tráo
    let host = null;
    if (state.lastSwap) {
        host = group.cells.find(cell => state.lastSwap.includes(cell)) || null;
    }
    if (!host && special === SP.BOMB) {
        // giao điểm của run ngang và dọc
        for (const hr of hRuns) {
            for (const vr of vRuns) {
                const cross = group.cells.find(cell =>
                    cell.r === hr.r && cell.c >= hr.c && cell.c < hr.c + hr.len &&
                    cell.c === vr.c && cell.r >= vr.r && cell.r < vr.r + vr.len);
                if (cross) { host = cross; break; }
            }
            if (host) break;
        }
    }
    if (!host) {
        const cells = runCells(longest);
        host = cells[Math.floor(cells.length / 2)];
    }

    return { special, host };
}

/* ============================================================
 *  13. NỔ & DỌN Ô
 * ============================================================ */

function cellsInRow(r) {
    const out = [];
    for (let c = 0; c < GRID; c++) if (state.grid[r][c]) out.push(state.grid[r][c]);
    return out;
}

function cellsInCol(c) {
    const out = [];
    for (let r = 0; r < GRID; r++) if (state.grid[r][c]) out.push(state.grid[r][c]);
    return out;
}

function cellsInBox(r, c, radius) {
    const out = [];
    for (let rr = r - radius; rr <= r + radius; rr++) {
        for (let cc = c - radius; cc <= c + radius; cc++) {
            if (inBounds(rr, cc) && state.grid[rr][cc]) out.push(state.grid[rr][cc]);
        }
    }
    return out;
}

// Mọi quả thường cùng loại (bỏ qua cầu vồng, thùng gỗ, dừa)
function cellsOfType(type) {
    const out = [];
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            const cell = state.grid[r][c];
            if (isFruit(cell) && cell.type === type && cell.special !== SP.RAINBOW) out.push(cell);
        }
    }
    return out;
}

function allCells() {
    const out = [];
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) if (state.grid[r][c]) out.push(state.grid[r][c]);
    }
    return out;
}

// Kích hoạt một quả đặc biệt: trả về các ô bị ảnh hưởng + tạo hiệu ứng
function activateSpecial(cell) {
    const color = FRUITS[cell.type].color;
    const center = cellCenter(cell.r, cell.c);

    switch (cell.special) {
        case SP.LINE_H:
            sound.playLine();
            fx.beam('h', center.y, color);
            fx.burst(center.x, center.y, '#ffffff', 12, 1.1);
            shakeBoard('small');
            return cellsInRow(cell.r);

        case SP.LINE_V:
            sound.playLine();
            fx.beam('v', center.x, color);
            fx.burst(center.x, center.y, '#ffffff', 12, 1.1);
            shakeBoard('small');
            return cellsInCol(cell.c);

        case SP.BOMB:
            sound.playBomb();
            fx.shock(center.x, center.y, '#ffd93d', step * 2.1);
            fx.burst(center.x, center.y, '#ff9f43', 26, 1.6);
            fx.flash('#ffb347', 0.2);
            shakeBoard('big');
            return cellsInBox(cell.r, cell.c, 1);

        case SP.RAINBOW: {
            sound.playRainbow();
            fx.sweepRainbow();
            fx.shock(center.x, center.y, '#ffffff', step * 4);
            shakeBoard('big');
            // Nếu bị nổ lây, cầu vồng quét một màu ngẫu nhiên
            const type = Math.floor(Math.random() * state.config.colors);
            return cellsOfType(type);
        }

        default:
            return [];
    }
}

// Xử lý combo khi tráo hai quả đặc biệt (hoặc đặc biệt + thường)
function specialComboCells(a, b) {
    const sa = a.special;
    const sb = b.special;
    if (!sa && !sb) return null;

    const isLine = s => s === SP.LINE_H || s === SP.LINE_V;
    const origin = cellCenter(b.r, b.c);
    const cells = new Set();
    const addAll = list => list.forEach(cell => cells.add(cell));

    const rainbow = sa === SP.RAINBOW ? a : (sb === SP.RAINBOW ? b : null);
    const other = rainbow === a ? b : a;

    if (rainbow) {
        if (other.special === SP.RAINBOW) {
            // Cầu vồng + Cầu vồng: xoá sạch bàn cờ
            sound.playRainbow();
            fx.sweepRainbow();
            fx.flash('#ffffff', 0.6);
            shakeBoard('big');
            rainbow.special = null;
            other.special = null;
            addAll(allCells());
            return { cells: Array.from(cells), origin };
        }

        if (isLine(other.special) || other.special === SP.BOMB) {
            // Biến toàn bộ quả cùng màu thành quả đặc biệt rồi cho nổ hết
            const targets = cellsOfType(other.type);
            const kind = other.special;
            targets.forEach((cell, i) => {
                if (cell === other) return;
                cell.special = kind === SP.BOMB
                    ? SP.BOMB
                    : (i % 2 === 0 ? SP.LINE_H : SP.LINE_V);
                paintCell(cell);
                cell.el.classList.add('upgrade');
            });
            sound.playRainbow();
            fx.sweepRainbow();
            rainbow.special = null;
            addAll(targets);
            cells.add(rainbow);
            return { cells: Array.from(cells), origin };
        }

        // Cầu vồng + quả thường: quét sạch mọi quả cùng loại
        sound.playRainbow();
        fx.sweepRainbow();
        shakeBoard('big');
        rainbow.special = null;
        addAll(cellsOfType(other.type));
        cells.add(rainbow);
        cells.add(other);
        return { cells: Array.from(cells), origin };
    }

    if (isLine(sa) && isLine(sb)) {
        // Tia + Tia: nổ chữ thập
        sound.playLine();
        fx.beam('h', cellCenter(b.r, b.c).y, '#00f0ff');
        fx.beam('v', cellCenter(b.r, b.c).x, '#00f0ff');
        shakeBoard('big');
        a.special = null; b.special = null;
        addAll(cellsInRow(b.r));
        addAll(cellsInCol(b.c));
        return { cells: Array.from(cells), origin };
    }

    if ((isLine(sa) && sb === SP.BOMB) || (sa === SP.BOMB && isLine(sb))) {
        // Tia + Bom: nổ 3 hàng và 3 cột
        sound.playBomb();
        sound.playLine();
        for (let d = -1; d <= 1; d++) {
            if (inBounds(b.r + d, 0)) { addAll(cellsInRow(b.r + d)); fx.beam('h', cellCenter(b.r + d, 0).y, '#ffd93d'); }
            if (inBounds(0, b.c + d)) { addAll(cellsInCol(b.c + d)); fx.beam('v', cellCenter(0, b.c + d).x, '#ffd93d'); }
        }
        fx.flash('#ffd93d', 0.25);
        shakeBoard('big');
        a.special = null; b.special = null;
        return { cells: Array.from(cells), origin };
    }

    if (sa === SP.BOMB && sb === SP.BOMB) {
        // Bom + Bom: vụ nổ 5x5
        sound.playBomb();
        fx.shock(origin.x, origin.y, '#ff9f43', step * 3.4);
        fx.burst(origin.x, origin.y, '#ffd93d', 40, 2);
        fx.flash('#ffb347', 0.35);
        shakeBoard('big');
        a.special = null; b.special = null;
        addAll(cellsInBox(b.r, b.c, 2));
        return { cells: Array.from(cells), origin };
    }

    // Quả đặc biệt đơn lẻ được tráo với quả thường:
    // chỉ kích hoạt nếu cú tráo đó không tạo được match nào
    const single = sa ? a : b;
    if (findMatches().length === 0) {
        addAll(activateSpecial(single));
        cells.add(single);
        single.special = null;
        return { cells: Array.from(cells), origin: cellCenter(single.r, single.c) };
    }

    return null;
}

// Thu thập toàn bộ ô bị nổ (bao gồm phản ứng dây chuyền của quả đặc biệt)
function expandClear(seed, protectedCells = new Set()) {
    const result = new Map();
    const queue = [...seed];

    while (queue.length) {
        const cell = queue.shift();
        if (!cell || result.has(cell.id)) continue;
        if (protectedCells.has(cell)) continue;
        if (cell.kind === KIND.HARVEST) continue; // dừa chỉ rời bàn khi chạm mép
        if (state.grid[cell.r] && state.grid[cell.r][cell.c] !== cell) continue; // ô đã cũ

        result.set(cell.id, cell);

        if (cell.special) {
            const affected = activateSpecial(cell);
            for (const next of affected) {
                if (!result.has(next.id)) queue.push(next);
            }
        }
    }

    // Vụ nổ ở ô nào thì đập vỡ luôn thùng gỗ nằm ngay cạnh ô đó
    const around = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const cell of Array.from(result.values())) {
        for (const [dr, dc] of around) {
            const r = cell.r + dr;
            const c = cell.c + dc;
            if (!inBounds(r, c)) continue;
            const neighbor = state.grid[r][c];
            if (neighbor && neighbor.kind === KIND.CRATE && !result.has(neighbor.id)) {
                result.set(neighbor.id, neighbor);
            }
        }
    }

    return Array.from(result.values());
}

/**
 * Phá một lớp băng tại ô (r, c). Trả về true nếu có băng bị phá.
 */
function breakFrost(r, c) {
    if (!inBounds(r, c)) return false;
    const layers = state.frost[r][c];
    if (!layers) return false;

    state.frost[r][c] = layers - 1;
    state.counters[OBJ.FROST]++;
    paintFrost(r, c);

    const el = state.frostEls[r][c];
    if (el) {
        el.classList.remove('frost-crack');
        void el.offsetWidth;
        el.classList.add('frost-crack');
    }
    const center = cellCenter(r, c);
    fx.burst(center.x, center.y, '#bfeaff', 8, 0.7);
    return true;
}

// Nổ danh sách ô (tự mở rộng phản ứng dây chuyền)
async function runClear(seedCells, origin, extraMultiplier = 1) {
    const cells = expandClear(seedCells);
    if (!cells.length) return 0;
    const anchor = origin || cellCenter(cells[0].r, cells[0].c);
    return runClearPrepared(cells, anchor, extraMultiplier);
}

/* ============================================================
 *  14. RƠI & LẤP ĐẦY
 * ============================================================ */

/**
 * Dồn ô theo hướng trọng lực rồi lấp đầy từ mép đối diện.
 * state.gravity = 1: rơi xuống (lấp từ trên); = -1: rơi lên (lấp từ dưới).
 */
async function collapseAndRefill() {
    let maxMs = 0;
    const g = state.gravity;
    const last = g === 1 ? GRID - 1 : 0;     // ô cuối theo chiều rơi
    const firstEmptyStep = -g;               // hướng đi ngược lại để quét

    for (let c = 0; c < GRID; c++) {
        // quét từ phía "đáy" ngược lên, dồn mọi ô về phía đáy
        let write = last;
        for (let i = 0; i < GRID; i++) {
            const r = last + firstEmptyStep * i;
            const cell = state.grid[r][c];
            if (!cell) continue;
            if (write !== r) {
                state.grid[write][c] = cell;
                state.grid[r][c] = null;
                cell.r = write;
                cell.c = c;
                maxMs = Math.max(maxMs, moveCellTo(cell, write, c));
            }
            write += firstEmptyStep;
        }

        // các ô trống còn lại nằm về phía mép vào, lấp bằng quả mới rơi từ ngoài bàn
        const emptyCount = g === 1 ? write + 1 : GRID - write;
        for (let i = 0; i < emptyCount; i++) {
            const row = write - g * i;

            // Quả cuối cùng của cột (xa mép đích nhất) có thể là một quả dừa mới
            let cell;
            if (state.harvestLeft > 0 && i === emptyCount - 1 && shouldDropHarvest()) {
                cell = createHarvest();
                state.harvestLeft--;
            } else {
                cell = createCell(randomType());
            }

            cell.r = row;
            cell.c = c;
            state.grid[row][c] = cell;
            applyPos(cell, row - g * emptyCount, c, 0); // xuất phát ngoài mép bàn
            cell.el.classList.add('falling');
            maxMs = Math.max(maxMs, moveCellTo(cell, row, c));
        }
    }

    if (maxMs) await wait(maxMs + 40);

    // dọn class tạm
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            const cell = state.grid[r][c];
            if (cell) cell.el.classList.remove('falling', 'upgrade');
        }
    }
}

// Chỉ thả dừa khi trên bàn chưa có quá nhiều; cột nào cũng có cơ hội như nhau
function shouldDropHarvest() {
    const cfg = state.config.harvest;
    if (!cfg) return false;
    const onBoard = allCells().filter(cell => cell.kind === KIND.HARVEST).length;
    if (onBoard >= (cfg.onBoard || 1)) return false;
    return Math.random() < 0.5;
}

/**
 * Dừa chạm mép bàn theo hướng trọng lực thì được thu hoạch.
 * Trả về số quả vừa thu được.
 */
async function collectHarvest() {
    const row = landingRow();
    const landed = [];
    for (let c = 0; c < GRID; c++) {
        const cell = state.grid[row][c];
        if (cell && cell.kind === KIND.HARVEST) landed.push(cell);
    }
    if (!landed.length) return 0;

    sound.playHarvest();
    landed.forEach(cell => {
        const center = cellCenter(cell.r, cell.c);
        fx.burst(center.x, center.y, '#ffd93d', 22, 1.3);
        fx.shock(center.x, center.y, '#ffd93d', step * 1.6);
        floatText(center.x, center.y, '🥥 +1', 'big');

        state.counters[OBJ.HARVEST]++;
        state.score += 500;
        if (state.grid[cell.r][cell.c] === cell) state.grid[cell.r][cell.c] = null;

        cell.el.classList.add('pop');
        const el = cell.el;
        setTimeout(() => el.remove(), 320);
    });

    shakeBoard('small');
    updateUI();
    await wait(260);
    return landed.length;
}

/* ============================================================
 *  15. VÒNG LẶP XỬ LÝ CHUỖI (CASCADE)
 * ============================================================ */

async function resolveCascades() {
    while (true) {
        const groups = findMatches();
        if (!groups.length) break;

        state.combo++;
        state.counters[OBJ.COMBO] = Math.max(state.counters[OBJ.COMBO], state.combo);
        sound.playMatch(state.combo - 1);
        showCombo(state.combo);

        // 1. Xác định các quả đặc biệt sẽ được tạo
        const plans = [];
        const protectedCells = new Set();
        for (const group of groups) {
            const plan = planSpecial(group);
            if (plan) {
                plans.push({ ...plan, group });
                protectedCells.add(plan.host);
            }
        }

        // 2. Gom các ô bị nổ (bỏ qua ô sẽ trở thành quả đặc biệt)
        const seed = [];
        groups.forEach(group => group.cells.forEach(cell => {
            if (!protectedCells.has(cell)) seed.push(cell);
        }));

        const cells = expandClear(seed, protectedCells);
        const origin = cells.length ? cellCenter(cells[0].r, cells[0].c) : null;
        await runClearPrepared(cells, origin);

        // 3. Nâng cấp các ô được chọn thành quả đặc biệt
        if (plans.length) {
            sound.playCreateSpecial();
            plans.forEach(plan => {
                const host = plan.host;
                if (!host || state.grid[host.r][host.c] !== host) return;
                host.special = plan.special;
                state.counters[OBJ.SPECIAL]++;
                paintCell(host);
                host.el.classList.remove('upgrade');
                void host.el.offsetWidth;
                host.el.classList.add('upgrade');
                const center = cellCenter(host.r, host.c);
                fx.shock(center.x, center.y, '#ffffff', step * 1.1);
                fx.burst(center.x, center.y, '#ffffff', 14, 0.9);
            });
            await wait(160);
        }

        state.lastSwap = null;
        await collapseAndRefill();

        // Dừa vừa chạm mép thì thu hoạch, rồi để bàn cờ dồn lại tiếp
        while (await collectHarvest()) {
            await collapseAndRefill();
        }
    }

    state.combo = 0;
}

// Nổ danh sách ô đã được mở rộng sẵn: tính điểm, bắn hiệu ứng, xoá khỏi lưới
async function runClearPrepared(cells, origin, extraMultiplier = 1) {
    if (!cells.length) return 0;
    const comboMul = 1 + Math.max(0, state.combo - 1) * 0.5;
    const points = Math.round(cells.length * 60 * (1 + state.levelIndex * 0.1) * comboMul * extraMultiplier);
    state.score += points;

    let hasCrate = false;

    cells.forEach(cell => {
        const center = cellCenter(cell.r, cell.c);
        const isCrate = cell.kind === KIND.CRATE;
        const color = isCrate ? '#c98b4b' : FRUITS[cell.type].color;

        fx.burst(center.x, center.y, color, isCrate ? 14 : 9, isCrate ? 1.1 : 0.85);
        if (!isCrate) fx.juice(center.x, center.y, color);

        if (isCrate) {
            hasCrate = true;
            state.counters[OBJ.CRATE]++;
        } else {
            state.counters[OBJ.FRUIT][cell.type]++;
            // chỉ quả thường mới làm vỡ băng ở ngay ô mình đứng
            breakFrost(cell.r, cell.c);
        }

        if (state.grid[cell.r][cell.c] === cell) state.grid[cell.r][cell.c] = null;

        cell.el.classList.add('pop');
        const el = cell.el;
        setTimeout(() => el.remove(), 320);
    });

    if (hasCrate) sound.playCrate();
    if (origin) floatText(origin.x, origin.y, `+${points}`, cells.length >= 8 ? 'big' : '');
    updateUI();
    await wait(240);
    return points;
}

/* ============================================================
 *  16. KẾT THÚC LƯỢT / MÀN
 * ============================================================ */

async function finishTurn() {
    updateUI();

    // Dừa còn nằm sẵn ở mép bàn ngay sau lượt đi
    while (await collectHarvest()) {
        await collapseAndRefill();
        await resolveCascades();
    }

    // Đảo trọng lực theo chu kỳ của màn chơi
    if (state.config.gravityFlip && state.moves > 0) {
        state.movesUntilFlip--;
        if (state.movesUntilFlip <= 0) {
            state.movesUntilFlip = state.config.gravityFlip;
            await flipGravity();
        }
        updateGravityIndicator();
    }

    // Không còn nước đi hợp lệ → trộn lại bàn cờ
    if (!findHint()) {
        await reshuffleBoard(true);
    }

    const won = state.score >= state.config.target && objectivesComplete();
    if (won) {
        state.busy = true;
        await celebrateWin();
        return;
    }

    if (state.moves <= 0) {
        state.busy = true;
        music.stop(0.8);          // nhường sân cho tiếng kết thúc
        await wait(300);
        sound.playGameOver();
        renderGameOverContent();
        showModal(modalGameOver);
        return;
    }

    state.busy = false;
    scheduleHint();
}

/**
 * Đảo chiều trọng lực: mọi quả sẽ rơi về phía ngược lại, dừa cũng đổi mép đích.
 */
async function flipGravity() {
    state.gravity = -state.gravity;
    sound.playFlip();
    shakeBoard('big');
    fx.flash('#00f0ff', 0.35);
    showBanner(t('gravityFlip'), 'gravity');
    boardEl.classList.remove('flip-down', 'flip-up');
    void boardEl.offsetWidth;
    boardEl.classList.add(state.gravity === 1 ? 'flip-down' : 'flip-up');

    await wait(520);
    updateGravityIndicator();

    // Bàn cờ đang đầy nên chưa có gì rơi, nhưng dừa có thể đã nằm ngay mép đích mới
    while (await collectHarvest()) {
        await collapseAndRefill();
        await resolveCascades();
    }
}

function updateGravityIndicator() {
    if (!gravityBadge) return;
    const active = !!state.config.gravityFlip;
    gravityBadge.classList.toggle('hidden', !active);
    if (!active) return;
    gravityBadge.classList.toggle('is-up', state.gravity === -1);
    gravityBadge.innerHTML =
        `<i class="fa-solid ${state.gravity === 1 ? 'fa-arrow-down' : 'fa-arrow-up'}"></i> ` +
        t('gravityIn', { n: state.movesUntilFlip });
}

async function celebrateWin() {
    // Thưởng lượt còn lại: mỗi lượt biến một quả ngẫu nhiên thành tia và cho nổ
    if (state.moves > 0) {
        const bonusMoves = Math.min(state.moves, 6);
        for (let i = 0; i < bonusMoves; i++) {
            // chỉ quả thường mới nâng cấp được thành tia
            const cells = allCells().filter(isFruit);
            if (!cells.length) break;
            const cell = cells[Math.floor(Math.random() * cells.length)];
            cell.special = i % 2 === 0 ? SP.LINE_H : SP.LINE_V;
            paintCell(cell);
            cell.el.classList.add('upgrade');
            await wait(90);
            await runClear([cell], cellCenter(cell.r, cell.c), 1.5);
            await collapseAndRefill();
            state.moves--;
            updateUI();
        }
        // dọn nốt các chuỗi phát sinh
        await resolveCascades();
    }

    music.stop(0.9);              // nhường sân cho khúc nhạc chiến thắng
    await wait(350);
    sound.playLevelUp();

    const stars = Math.max(1, starCount());
    progress.stars[state.levelIndex] = Math.max(progress.stars[state.levelIndex] || 0, stars);
    progress.unlocked = Math.max(progress.unlocked, state.levelIndex + 2);
    saveProgress(progress);

    renderVictoryContent();
    victoryStars.querySelectorAll('.star').forEach(el => el.classList.remove('active', 'pop-star'));
    showModal(modalVictory);

    victoryStars.querySelectorAll('.star').forEach((el, i) => {
        if (i < stars) {
            setTimeout(() => {
                el.classList.add('active', 'pop-star');
                sound.playStar(i);
            }, 300 + i * 260);
        }
    });
}

/* ============================================================
 *  17. GỢI Ý & TRỘN BÀN
 * ============================================================ */

function typeGrid() {
    return state.grid.map(row => row.map(cell => matchType(cell)));
}

function hasMatchAround(types, r, c) {
    const t = types[r][c];
    if (t < 0) return false;

    let count = 1;
    for (let cc = c - 1; cc >= 0 && types[r][cc] === t; cc--) count++;
    for (let cc = c + 1; cc < GRID && types[r][cc] === t; cc++) count++;
    if (count >= 3) return true;

    count = 1;
    for (let rr = r - 1; rr >= 0 && types[rr][c] === t; rr--) count++;
    for (let rr = r + 1; rr < GRID && types[rr][c] === t; rr++) count++;
    return count >= 3;
}

function findHint() {
    // Quả cầu vồng luôn dùng được
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            const cell = state.grid[r][c];
            if (cell && cell.special === SP.RAINBOW) {
                // chỉ được tráo với quả thường — thùng gỗ và dừa thì không
                const neighbor = [
                    state.grid[r][c + 1], state.grid[r][c - 1],
                    state.grid[r + 1] && state.grid[r + 1][c],
                    state.grid[r - 1] && state.grid[r - 1][c],
                ].find(isFruit);
                if (neighbor) return [cell, neighbor];
            }
        }
    }

    const types = typeGrid();
    const trySwapTypes = (r1, c1, r2, c2) => {
        // Nước đi chỉ hợp lệ khi cả hai ô đều là quả thường
        if (!isFruit(state.grid[r1][c1]) || !isFruit(state.grid[r2][c2])) return false;
        const tmp = types[r1][c1];
        types[r1][c1] = types[r2][c2];
        types[r2][c2] = tmp;
        const ok = hasMatchAround(types, r1, c1) || hasMatchAround(types, r2, c2);
        types[r2][c2] = types[r1][c1];
        types[r1][c1] = tmp;
        return ok;
    };

    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            if (c + 1 < GRID && trySwapTypes(r, c, r, c + 1)) {
                return [state.grid[r][c], state.grid[r][c + 1]];
            }
            if (r + 1 < GRID && trySwapTypes(r, c, r + 1, c)) {
                return [state.grid[r][c], state.grid[r + 1][c]];
            }
        }
    }
    return null;
}

async function reshuffleBoard(animate = true) {
    if (animate) {
        floatText(fx.w / 2, fx.h / 2, t('shuffle'), 'big');
        allCells().forEach(cell => cell.el.classList.add('shuffling'));
        await wait(280);
    }

    // Chỉ xáo lại quả thường: thùng gỗ và dừa phải đứng yên tại chỗ
    const cells = allCells().filter(isFruit);
    const original = cells.map(cell => cell.type);

    // Đặt tham lam để không tạo sẵn bộ ba nào ngay sau khi trộn
    for (let attempt = 0; attempt < 40; attempt++) {
        const pool = shuffled(original);
        const counts = new Map();
        pool.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));

        // -1 nghĩa là ô không phải quả (thùng/dừa) — tự khắc cắt đứt mọi chuỗi
        const placed = Array.from({ length: GRID }, () => new Array(GRID).fill(-1));
        for (const cell of cells) {
            const { r, c } = cell;
            const available = [...counts.keys()].filter(t => counts.get(t) > 0);
            const safe = available.filter(t =>
                !(c >= 2 && placed[r][c - 1] === t && placed[r][c - 2] === t) &&
                !(r >= 2 && placed[r - 1][c] === t && placed[r - 2][c] === t));
            const list = safe.length ? safe : available;
            const pick = list[Math.floor(Math.random() * list.length)];
            placed[r][c] = pick;
            counts.set(pick, counts.get(pick) - 1);
        }

        cells.forEach(cell => { cell.type = placed[cell.r][cell.c]; });

        if (findMatches().length === 0 && findHint()) break;
    }

    cells.forEach(paintCell);

    if (animate) {
        allCells().forEach(cell => cell.el.classList.remove('shuffling'));
        await wait(200);
    }
}

function scheduleHint() {
    clearHint();
    state.idleTimer = setTimeout(() => {
        if (state.busy || !state.started) return;
        const hint = findHint();
        if (hint) {
            state.hintCells = hint;
            hint.forEach(cell => cell.el.classList.add('hint'));
        }
    }, 5000);
}

function clearHint() {
    if (state.idleTimer) clearTimeout(state.idleTimer);
    state.idleTimer = null;
    state.hintCells.forEach(cell => cell.el.classList.remove('hint'));
    state.hintCells = [];
}

/* ============================================================
 *  18. TIỆN ÍCH & SỰ KIỆN
 * ============================================================ */

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

btnRestart.addEventListener('click', () => {
    sound.init();
    startLevel(state.levelIndex, false);
});

// Mở khoá âm thanh ở cử chỉ đầu tiên của người dùng, dù chạm vào đâu trên trang.
// Trình duyệt chặn AudioContext ngoài cử chỉ, nên cần bám vào mọi loại tương tác.
['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown'].forEach(type => {
    window.addEventListener(type, () => sound.unlock(), { capture: true, passive: true });
});
// Context có thể bị treo khi chuyển tab — đánh thức lại khi quay về,
// và tạm ngắt nhạc nền khi người chơi rời đi cho đỡ phiền
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        music.stop(0.3);
    } else {
        sound.init();
        if (music.enabled && state.started) music.play(state.levelIndex, state.config && state.config.music);
    }
});
// Soi trạng thái âm thanh trong console nếu cần: fruitCrushAudio()
window.fruitCrushAudio = () => sound.status();

/* ============================================================
 *  19. BẢNG VÀNG (ghi danh điểm cao) & CHIA SẺ
 * ============================================================ */

const SCORES_KEY = 'fruitCrushScores';
const NAME_KEY = 'fruitCrushPlayerName';
const MAX_SCORES = 10;
const MAX_NAME_LENGTH = 16;

// Đọc bảng điểm đã lưu, bỏ qua mọi dữ liệu hỏng để không làm gãy trò chơi
function loadScores() {
    try {
        const raw = localStorage.getItem(SCORES_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        return data
            .filter(e => e && typeof e.score === 'number' && Number.isFinite(e.score))
            .map(e => ({
                name: String(e.name || '').slice(0, MAX_NAME_LENGTH) || t('anonymous'),
                level: Number(e.level) || 1,
                score: Math.max(0, Math.floor(e.score)),
                date: Number(e.date) || 0,
            }))
            .sort(compareScores)
            .slice(0, MAX_SCORES);
    } catch (e) {
        return [];
    }
}

function saveScores(entries) {
    try {
        localStorage.setItem(SCORES_KEY, JSON.stringify(entries.slice(0, MAX_SCORES)));
    } catch (e) { /* bỏ qua: hết dung lượng hoặc bị chặn */ }
}

// Điểm cao đứng trước; bằng điểm thì màn cao hơn thắng; vẫn bằng thì ai ghi trước đứng trước
function compareScores(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return a.date - b.date;
}

// Điểm này có lọt vào bảng vàng không? (bảng chưa đầy thì luôn lọt)
function qualifiesForBoard(score, level = 1) {
    if (!(score > 0)) return false;
    const entries = loadScores();
    if (entries.length < MAX_SCORES) return true;
    const last = entries[entries.length - 1];
    return compareScores({ score, level, date: Date.now() }, last) < 0;
}

function sanitizeName(name) {
    const clean = String(name == null ? '' : name)
        .replace(/[\u0000-\u001F\u007F]/g, '')   // bỏ ký tự điều khiển
        .replace(/[<>]/g, '')                      // bỏ dấu ngoặc thẻ HTML
        .trim()
        .slice(0, MAX_NAME_LENGTH);
    return clean || t('anonymous');
}

/**
 * Ghi một thành tích vào bảng vàng.
 * Trả về { rank, entries } — rank là thứ hạng 1-based, hoặc 0 nếu không lọt bảng.
 */
function addScore({ name, level, score, date = Date.now() }) {
    const entry = {
        name: sanitizeName(name),
        level: Math.max(1, Math.floor(level) || 1),
        score: Math.max(0, Math.floor(score) || 0),
        date,
    };

    const entries = loadScores();
    entries.push(entry);
    entries.sort(compareScores);
    const kept = entries.slice(0, MAX_SCORES);
    saveScores(kept);

    const rank = kept.indexOf(entry) + 1;   // 0 nếu bị đẩy khỏi bảng
    return { rank, entries: kept, entry };
}

function loadPlayerName() {
    try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; }
}

function savePlayerName(name) {
    try { localStorage.setItem(NAME_KEY, name); } catch (e) { /* bỏ qua */ }
}

/* ---------------- Chia sẻ ---------------- */

// Facebook chỉ nhận đường dẫn http(s); mở từ tệp trên máy thì không chia sẻ được
function shareableUrl() {
    try {
        const proto = window.location.protocol;
        if (proto === 'http:' || proto === 'https:') {
            return window.location.origin + window.location.pathname;
        }
    } catch (e) { /* bỏ qua */ }
    return '';
}

function buildShareText({ score, level, stars = 0 }) {
    const starText = stars > 0 ? ' ' + '⭐'.repeat(stars) : '';
    return t('shareText', {
        score: score.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US'),
        level,
        stars: starText,
    });
}

function facebookShareUrl(url) {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
}

function twitterShareUrl(text, url) {
    const params = ['text=' + encodeURIComponent(text), 'hashtags=FruitCrushDeluxe'];
    if (url) params.push('url=' + encodeURIComponent(url));
    return 'https://x.com/intent/post?' + params.join('&');
}

// Sao chép có đường lui cho ngữ cảnh không bảo mật (mở tệp bằng file://)
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) { /* thử cách cũ bên dưới */ }

    try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        return ok;
    } catch (e) {
        return false;
    }
}

let toastTimer = null;

function showToast(message, kind = '') {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 2200);
}

/* ---------------- Giao diện bảng vàng ---------------- */

const MEDALS = ['🥇', '🥈', '🥉'];

function formatScoreDate(ms) {
    if (!ms) return '';
    try {
        return new Date(ms).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US',
            { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return '';
    }
}

function renderScoreBoard(highlightDate = null) {
    if (!scoreListEl) return;
    const entries = loadScores();

    if (!entries.length) {
        scoreListEl.innerHTML = `<p class="score-empty">${t('scoresEmpty')}</p>`;
        return;
    }

    scoreListEl.innerHTML = entries.map((e, i) => {
        const medal = MEDALS[i] || `<span class="score-rank">${i + 1}</span>`;
        const isNew = highlightDate && e.date === highlightDate;
        return `
            <div class="score-row${i < 3 ? ' top-' + (i + 1) : ''}${isNew ? ' is-new' : ''}">
                <div class="score-medal">${medal}</div>
                <div class="score-name">${escapeHtml(e.name)}</div>
                <div class="score-meta">${t('scoreLevelShort', { n: e.level })}</div>
                <div class="score-points">${e.score.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</div>
                <div class="score-date">${formatScoreDate(e.date)}</div>
            </div>`;
    }).join('');
}

// Tên do người chơi tự nhập nên phải thoát ký tự trước khi ghép vào HTML
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Dựng phần "ghi danh + chia sẻ" ở cuối modal Thắng hoặc Thua.
 */
function renderEndgamePanel(recordEl, shareEl, ctx) {
    const { score, level, stars } = ctx;
    const text = buildShareText({ score, level, stars });
    const url = shareableUrl();

    // --- Ghi danh ---
    if (recordEl) {
        if (qualifiesForBoard(score, level)) {
            recordEl.classList.remove('hidden');
            recordEl.innerHTML = `
                <div class="record-title"><i class="fa-solid fa-medal"></i> ${t('recordPrompt')}</div>
                <div class="record-form">
                    <input class="record-input" type="text" maxlength="${MAX_NAME_LENGTH}"
                           placeholder="${t('recordPlaceholder')}" value="${escapeHtml(loadPlayerName())}">
                    <button class="btn btn-primary record-save">${t('recordSave')}</button>
                </div>`;

            const input = recordEl.querySelector('.record-input');
            const save = () => {
                const name = sanitizeName(input.value);
                savePlayerName(name === t('anonymous') ? '' : name);
                const { rank, entry } = addScore({ name, level, score });
                recordEl.innerHTML =
                    `<div class="record-done"><i class="fa-solid fa-circle-check"></i> ` +
                    `${t('recordSaved', { rank: rank || MAX_SCORES })}</div>`;
                renderScoreBoard(entry.date);
                sound.playStar(1);
            };

            recordEl.querySelector('.record-save').addEventListener('click', save);
            input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
            setTimeout(() => input.focus(), 350);
        } else {
            recordEl.classList.add('hidden');
            recordEl.innerHTML = '';
        }
    }

    // --- Chia sẻ ---
    if (!shareEl) return;
    const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    shareEl.innerHTML = `
        <div class="share-title">${t('shareTitle')}</div>
        <div class="share-row">
            ${canNativeShare ? `<button class="share-btn share-native"><i class="fa-solid fa-share-nodes"></i> ${t('shareNative')}</button>` : ''}
            <button class="share-btn share-fb"${url ? '' : ' disabled title="' + t('shareNeedsHost') + '"'}><i class="fa-brands fa-facebook-f"></i> Facebook</button>
            <button class="share-btn share-x"><i class="fa-brands fa-x-twitter"></i></button>
            <button class="share-btn share-copy"><i class="fa-solid fa-copy"></i> ${t('shareCopy')}</button>
        </div>`;

    const nativeBtn = shareEl.querySelector('.share-native');
    if (nativeBtn) {
        nativeBtn.addEventListener('click', async () => {
            try {
                await navigator.share({ title: 'Fruit Crush Deluxe', text, url: url || undefined });
            } catch (e) { /* người chơi bấm huỷ — không cần báo gì */ }
        });
    }

    shareEl.querySelector('.share-fb').addEventListener('click', () => {
        if (!url) { showToast(t('shareNeedsHost'), 'warn'); return; }
        openShareWindow(facebookShareUrl(url));
    });

    shareEl.querySelector('.share-x').addEventListener('click', () => {
        openShareWindow(twitterShareUrl(text, url));
    });

    shareEl.querySelector('.share-copy').addEventListener('click', async () => {
        const full = url ? `${text}\n${url}` : text;
        const ok = await copyToClipboard(full);
        showToast(ok ? t('copied') : t('copyFailed'), ok ? '' : 'warn');
    });
}

function openShareWindow(url) {
    /* Không đặt noopener: hộp thoại của Facebook cần gọi ngược về trang mở nó
       để báo đã đăng xong. Thiếu đường về đó thì nút Đăng cứ quay mãi. */
    window.open(url, 'kibu_share', 'width=620,height=560');
}

/* ============================================================
 *  20. CHẾ ĐỘ THỬ MÀN (dành cho người làm game)
 *
 *  Bật bằng địa chỉ  ?dev=1  hoặc gõ  fruitCrush.on()  trong Console.
 *  Khi bật: bản đồ mở khoá toàn bộ màn và có huy hiệu DEV ở góc màn hình.
 *  Nhảy thẳng tới một màn:  ?level=17
 * ============================================================ */

const DEV_KEY = 'fruitCrushDev';

const dev = {
    enabled: false,

    // --- bật/tắt ---
    on() { return this.setEnabled(true); },
    off() { return this.setEnabled(false); },
    setEnabled(value) {
        this.enabled = !!value;
        try { localStorage.setItem(DEV_KEY, this.enabled ? '1' : '0'); } catch (e) { /* bỏ qua */ }
        if (devBadge) devBadge.classList.toggle('hidden', !this.enabled);
        return this.enabled ? 'Đã bật chế độ thử màn / dev mode ON' : 'Đã tắt / dev mode OFF';
    },

    // --- đi lại giữa các màn ---
    goto(levelNumber) {
        const index = Math.max(0, Math.floor(levelNumber) - 1);
        this.unlockUpTo(index + 1);
        startLevel(index, false);
        return this.status();
    },
    next() { return this.goto(state.levelIndex + 2); },
    prev() { return this.goto(state.levelIndex); },
    replay() { return this.goto(state.levelIndex + 1); },

    // --- tiến trình ---
    unlockAll() {
        progress.unlocked = Math.max(progress.unlocked, LEVELS.length + 2);
        saveProgress(progress);
        renderLevelMap();
        return `Đã mở khoá ${progress.unlocked} màn`;
    },
    unlockUpTo(n) {
        progress.unlocked = Math.max(progress.unlocked, n);
        saveProgress(progress);
        return progress.unlocked;
    },
    resetProgress() {
        progress = { unlocked: 1, stars: {} };
        saveProgress(progress);
        return 'Đã xoá sạch tiến trình';
    },
    clearScores() {
        saveScores([]);
        renderScoreBoard();
        return 'Đã xoá Bảng Vàng';
    },
    addFakeScore(name, level, score) {
        const { rank } = addScore({ name, level, score });
        renderScoreBoard();
        return `Đã thêm ${name} — hạng ${rank || 'ngoài bảng'}`;
    },

    // --- nắn trạng thái màn đang chơi để thử nhanh ---
    moves(n) { state.moves = Math.max(0, Math.floor(n)); updateUI(); return state.moves; },
    score(n) { state.score = Math.max(0, Math.floor(n)); updateUI(); return state.score; },

    // Hoàn thành mọi mục tiêu để xem màn hình chiến thắng
    async win() {
        if (!state.config) return 'Chưa vào màn nào';
        state.score = Math.max(state.score, state.config.target);
        state.config.objectives.forEach(o => {
            if (o.type === OBJ.FRUIT) state.counters[OBJ.FRUIT][o.fruit] = o.count;
            else state.counters[o.type] = o.count;
        });
        updateUI();
        await finishTurn();
        return 'Đã hoàn thành mục tiêu';
    },

    // Ép thua để xem màn hình hết lượt
    async lose() {
        if (!state.config) return 'Chưa vào màn nào';
        state.moves = 0;
        await finishTurn();
        return 'Đã ép hết lượt';
    },

    // Đặt một quả đặc biệt lên ô bất kỳ để thử combo: gift(3, 4, 'bomb')
    gift(r, c, kind = 'bomb') {
        const map = { h: SP.LINE_H, lineH: SP.LINE_H, v: SP.LINE_V, lineV: SP.LINE_V,
                      bomb: SP.BOMB, rainbow: SP.RAINBOW };
        const special = map[kind];
        if (!special) return `Loại không hợp lệ. Dùng: ${Object.keys(map).join(', ')}`;
        if (!inBounds(r, c)) return 'Toạ độ ngoài bàn cờ';
        const cell = state.grid[r][c];
        if (!isFruit(cell)) return 'Ô này là thùng gỗ hoặc dừa, không gắn được';
        cell.special = special;
        paintCell(cell);
        cell.el.classList.add('upgrade');
        setTimeout(() => cell.el.classList.remove('upgrade'), 600);
        return `Đã đặt ${kind} tại ${r},${c}`;
    },

    async flip() { await flipGravity(); return `Trọng lực: ${state.gravity === 1 ? 'xuống' : 'lên'}`; },

    // Phá sạch băng còn lại (để kiểm tra nhanh phần sau của màn)
    clearFrost() {
        let n = 0;
        for (let r = 0; r < GRID; r++) {
            for (let c = 0; c < GRID; c++) {
                while (state.frost[r][c] > 0) { breakFrost(r, c); n++; }
            }
        }
        updateUI();
        return `Đã phá ${n} lớp băng`;
    },

    // --- xem thông tin ---
    status() {
        if (!state.config) return 'Chưa vào màn nào';
        return {
            màn: state.levelIndex + 1,
            lượt: state.moves,
            điểm: `${state.score}/${state.config.target}`,
            sao: starCount(),
            trọngLực: state.gravity === 1 ? 'xuống' : 'lên',
            nhạc: music.themeName(),
            mụcTiêu: state.config.objectives.map(o =>
                `${o.type}${o.type === OBJ.FRUIT ? ' ' + FRUITS[o.fruit].emoji : ''} ` +
                `${objectiveProgress(o)}/${o.count}`),
        };
    },

    // Bảng tổng hợp mọi màn để soát thiết kế
    levels() {
        const rows = LEVELS.map((lv, i) => {
            const cfg = prepareLevel(lv);
            return {
                màn: i + 1,
                lượt: cfg.moves,
                điểm: cfg.target,
                màu: cfg.colors,
                mụcTiêu: cfg.objectives.map(o => `${o.type}:${o.count}`).join(' '),
                băng: cfg.frostLayers,
                thùng: cfg.crateCount,
                dừa: cfg.harvest ? cfg.harvest.total : 0,
                đảoTrọngLực: cfg.gravityFlip || '',
                nhạc: cfg.music || '(theo thứ tự)',
            };
        });
        if (console.table) console.table(rows);
        return rows;
    },

    help() {
        const lines = [
            'Công cụ thử màn — Fruit Crush',
            '  fruitCrush.on() / .off()      bật, tắt chế độ thử màn',
            '  fruitCrush.goto(17)           mở thẳng màn 17',
            '  fruitCrush.next() / .prev()   màn kế / màn trước',
            '  fruitCrush.replay()           chơi lại màn hiện tại',
            '  fruitCrush.unlockAll()        mở khoá toàn bộ bản đồ',
            '  fruitCrush.resetProgress()    xoá sạch tiến trình đã lưu',
            '  fruitCrush.clearScores()      xoá Bảng Vàng',
            '  fruitCrush.addFakeScore(...)  thêm điểm giả để soát bảng',
            '  fruitCrush.levels()           bảng thiết kế của cả 20 màn',
            '  fruitCrush.status()           tình trạng màn đang chơi',
            '  fruitCrush.moves(3)           đặt số lượt còn lại',
            '  fruitCrush.win() / .lose()    xem ngay màn thắng / thua',
            '  fruitCrush.gift(3,4,"bomb")   đặt quả đặc biệt để thử combo',
            '                                 (h, v, bomb, rainbow)',
            '  fruitCrush.flip()             đảo trọng lực ngay',
            '  fruitCrush.clearFrost()       phá sạch băng còn lại',
            'Địa chỉ: ?dev=1 để bật, ?level=17 để vào thẳng màn 17',
        ];
        console.log(lines.join('\n'));
        return lines.length + ' lệnh';
    },
};

window.fruitCrush = dev;

// Đọc thiết lập thử màn từ localStorage và từ địa chỉ trang
function initDevMode() {
    let enabled = false;
    try { enabled = localStorage.getItem(DEV_KEY) === '1'; } catch (e) { /* bỏ qua */ }

    let jumpTo = null;
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('dev')) enabled = params.get('dev') !== '0';
        const lv = parseInt(params.get('level'), 10);
        if (Number.isFinite(lv) && lv > 0) {
            jumpTo = lv - 1;
            enabled = params.get('dev') === '0' ? false : true;
        }
    } catch (e) { /* bỏ qua */ }

    dev.setEnabled(enabled);
    if (enabled) {
        dev.unlockUpTo(LEVELS.length + 2);
        console.log('%cFruit Crush · chế độ thử màn đang BẬT', 'color:#00f0ff;font-weight:bold');
        dev.help();
    }
    return jumpTo;
}

btnSound.addEventListener('click', () => {
    const on = sound.toggle();
    soundIcon.className = on ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    btnSound.classList.toggle('btn-muted', !on);
    const st = sound.status();
    btnSound.title = on
        ? t('soundState', { state: st.contextState }) + (st.failure ? ' — ' + st.failure : '')
        : t('soundOff');
});

btnMusic.addEventListener('click', () => {
    const on = music.toggle();
    musicIcon.className = on ? 'fa-solid fa-music' : 'fa-solid fa-volume-xmark';
    btnMusic.classList.toggle('btn-muted', !on);
    btnMusic.title = on ? t('musicOn', { theme: music.themeName() }) : t('musicOff');
});

// Nút đổi ngôn ngữ riêng của màn chơi đã được thay bằng nút cờ chung của cả
// site, nên phần tử này có thể không còn. Thiếu kiểm tra ở đây thì cả đoạn
// khởi tạo phía sau sẽ dừng giữa chừng và giao diện không được dịch.
if (btnLang) {
    btnLang.addEventListener('click', () => {
        setLanguage(lang === 'vi' ? 'en' : 'vi');
    });
}

btnLevels.addEventListener('click', () => {
    renderLevelMap();
    showModal(modalLevels);
});

btnCloseLevels.addEventListener('click', () => hideModal(modalLevels));

btnScores.addEventListener('click', () => {
    renderScoreBoard();
    showModal(modalScores);
});

btnCloseScores.addEventListener('click', () => hideModal(modalScores));

btnStart.addEventListener('click', () => {
    sound.init();
    hideModal(modalIntro);
    state.busy = false;
    state.started = true;
    scheduleHint();
});

btnNextLevel.addEventListener('click', () => {
    hideModal(modalVictory);
    startLevel(state.levelIndex + 1);
});

btnRetry.addEventListener('click', () => {
    hideModal(modalGameOver);
    startLevel(state.levelIndex, false);
});

btnVictoryMap.addEventListener('click', () => {
    hideModal(modalVictory);
    renderLevelMap();
    showModal(modalLevels);
});

btnGameOverMap.addEventListener('click', () => {
    hideModal(modalGameOver);
    renderLevelMap();
    showModal(modalLevels);
});

let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        computeMetrics();
        buildCellBackground();
        repositionAll();
    }, 120);
});

window.addEventListener('DOMContentLoaded', () => {
    progress = loadProgress();
    const jumpTo = initDevMode();
    applyLanguage();

    // ?level=N mở thẳng màn đó và bỏ qua màn giới thiệu cho đỡ mất thì giờ
    if (jumpTo !== null) startLevel(jumpTo, false);
    else startLevel(Math.max(0, progress.unlocked - 1));
});
