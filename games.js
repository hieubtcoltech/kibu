/* ============================================================================
 * KIBU Games — DANH BẠ GAME, nguồn sự thật duy nhất
 * ----------------------------------------------------------------------------
 * VÌ SAO CÓ TỆP NÀY
 * Trước đây thông tin một game nằm rải ở BỐN chỗ chép tay: routes.js (thư mục
 * ↔ slug), index.html (ô gạch, tên, từ khoá, màu nền), sitemap.xml (hai dòng
 * URL) và i18n.js (bản dịch tên). Thêm một game là phải nhớ sửa đủ bốn, mà
 * không có gì soát xem bốn chỗ ấy có khớp nhau không — quên một chỗ thì game
 * mới vẫn chạy, chỉ là Google không thấy, hoặc trang chủ không có ô, hoặc bản
 * tiếng Việt trơ ra tiếng Anh. Kiểu lỗi im lặng, phát hiện được thì đã lâu.
 *
 * Nay mọi thứ về một game khai đúng MỘT LẦN ở đây. routes.js vẫn giữ bảng
 * thư mục ↔ slug của nó (nó nạp trên cả 25 trang game nên em không đụng vào),
 * còn check-games.js bắt hai bên phải khớp, và bắt cả sitemap lẫn trang chủ
 * phải khớp theo.
 *
 * MỖI MỤC GỒM
 *   dir       thư mục trên đĩa (giữ nguyên tên cũ, đổi là hỏng hết đường dẫn)
 *   slug      phần đuôi URL công khai: /vi/g/<slug>
 *   en, vi    tên game hai thứ tiếng
 *   topics    một tới ba CHỦ ĐỀ, để lọc trên trang chủ (xem TOPICS bên dưới)
 *   players   '1' chơi một mình, '1-2', '1-4' — chơi chung một máy
 *   tile      lớp CSS nền ô gạch, đang khai trong <style> của index.html
 *   added     ngày lên sóng, dùng để xếp thứ tự và gắn nhãn MỚI
 *   keywords  từ khoá cho ô tìm kiếm trang chủ (cả tiếng Việt không dấu)
 * ==========================================================================*/
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.KibuGames = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Tám chủ đề. Ít thôi và phải rõ ràng: bé (hoặc bố mẹ bé) nhìn một cái là
     * biết bấm vào đâu. Chia hai mươi nhóm thì cái nào cũng có hai game, lọc
     * xong vẫn phải dò tiếp — hỏng cả mục đích. */
    var TOPICS = [
        { key: 'puzzle', vi: 'Giải đố', en: 'Puzzle', icon: 'fa-puzzle-piece' },
        { key: 'action', vi: 'Hành động', en: 'Action', icon: 'fa-bolt' },
        { key: 'sports', vi: 'Thể thao', en: 'Sports', icon: 'fa-futbol' },
        { key: 'board', vi: 'Cờ & bàn', en: 'Board', icon: 'fa-chess' },
        { key: 'creative', vi: 'Vẽ & sáng tạo', en: 'Creative', icon: 'fa-palette' },
        { key: 'learning', vi: 'Học tập', en: 'Learning', icon: 'fa-graduation-cap' },
        { key: 'physics', vi: 'Vật lý', en: 'Physics', icon: 'fa-atom' },
        { key: 'duo', vi: 'Chơi cùng nhau', en: 'Play together', icon: 'fa-users' }
    ];

    /* Xếp theo ngày lên sóng, mới nhất trước — đúng thứ tự đang hiện ở trang
     * chủ, để đổi sang sinh ô gạch từ tệp này mà mặt trang không xê dịch. */
    var GAMES = [
        {
            dir: 'marble-machine', slug: 'marble-machine', tile: 'tile-marble',
            en: 'Marble Machine', vi: 'Cỗ Máy Kỳ Quặc',
            topics: ['puzzle', 'physics'], players: '1', added: '2026-08-04',
            keywords: 'marble machine marble run chain reaction rube goldberg co may ky quac game vat ly domino ramp conveyor seesaw bouncer fan magnet bumper physics puzzle 40 levels phaser'
        },
        {
            dir: 'claw-machine', slug: 'claw-machine', tile: 'tile-claw',
            en: 'Claw Machine', vi: 'Máy Gắp Thú',
            topics: ['physics', 'duo'], players: '1-4', added: '2026-08-03',
            keywords: 'claw machine plush grabber may gap thu game gap thu bong gap gau bong toy crane prize grabber physics phaser collect 30 plushies 4 player turns'
        },
        {
            dir: 'screw-jam', slug: 'screw-jam', tile: 'tile-screwjam',
            en: 'Screw Jam', vi: 'Vặn Ốc',
            topics: ['puzzle', 'duo'], players: '1-2', added: '2026-08-03',
            keywords: 'screw jam nuts and bolts puzzle unscrew bolts game van oc tro choi thao oc vit thao vit screw puzzle wooden plates 60 levels colour blind friendly 2 player race phaser'
        },
        {
            dir: 'water-sort', slug: 'water-sort', tile: 'tile-watersort',
            en: 'Water Sort', vi: 'Rót Màu',
            topics: ['puzzle', 'duo'], players: '1-2', added: '2026-08-02',
            keywords: 'water sort color sort colour pouring puzzle game xep mau game rot mau tro choi xep mau nuoc sort puzzle 60 levels hint undo colour blind friendly 2 player race'
        },
        {
            dir: 'melon-drop', slug: 'melon-drop', tile: 'tile-melon',
            en: 'Melon Drop', vi: 'Ghép Dưa Hấu',
            topics: ['puzzle', 'physics'], players: '1', added: '2026-08-02',
            keywords: 'melon drop suika fruit merge game tha dua game ghep hoa qua watermelon merge physics puzzle drop fruit combine'
        },
        {
            dir: 'bounce-hoops', slug: 'bounce-hoops', tile: 'tile-hoops',
            en: 'Bounce Hoops', vi: 'Ném Bóng Vào Rổ',
            topics: ['physics', 'puzzle'], players: '1', added: '2026-08-01',
            keywords: 'bounce hoops ball physics puzzle game bong nay vao ro tro choi nem bong aim bounce ricochet levels'
        },
        {
            dir: 'panda-run', slug: 'panda-run', tile: 'tile-panda',
            en: 'Panda Run', vi: 'Panda Giải Cứu Bạn',
            topics: ['action'], players: '1', added: '2026-08-01',
            keywords: 'panda run endless runner game gau truc chay tro choi chay nhay jump slide obstacles'
        },
        {
            dir: 'bubble-pop', slug: 'bubble-pop', tile: 'tile-bubble',
            en: 'Bubble Pop', vi: 'Bắn Bóng Nổ',
            topics: ['puzzle', 'action'], players: '1', added: '2026-07-31',
            keywords: 'bubble pop bubble shooter game ban bong tro choi ban bong mau match colours aim shoot'
        },
        {
            dir: 'fruit-crush', slug: 'fruit-crush', tile: 'tile-fruit tile-hot',
            en: 'Fruit Crush', vi: 'Xếp Hoa Quả',
            topics: ['puzzle'], players: '1', added: '2026-07-20',
            keywords: 'fruit crush match 3 game xep hoa qua tro choi ghep 3 candy match puzzle swap'
        },
        {
            dir: 'sling-blast', slug: 'sling-blast', tile: 'tile-sling',
            en: 'Sling Blast', vi: 'Bắn Bi Phá Tháp',
            topics: ['physics', 'action'], players: '1', added: '2026-07-30',
            keywords: 'sling blast slingshot physics game ban na tro choi ban bi aim launch phaser'
        },
        {
            dir: 'coloring-game', slug: 'magic-coloring', tile: 'tile-coloring',
            en: 'Magic Coloring', vi: 'Tô Màu Thần Kỳ',
            topics: ['creative'], players: '1', added: '2026-07-29',
            keywords: 'magic coloring colouring book game to mau tro choi to mau paint draw kids art'
        },
        {
            dir: 'basketball-game', slug: 'basketball-duel', tile: 'tile-basket tile-hot',
            en: 'Basketball Duel', vi: 'Song Đấu Bóng Rổ',
            topics: ['sports', 'duo'], players: '1-2', added: '2026-07-22',
            keywords: 'basketball duel game bong ro tro choi nem ro hoop shoot 2 player'
        },
        {
            dir: 'bowling-game', slug: 'strike-party', tile: 'tile-bowling',
            en: 'Strike Party', vi: 'Ném Bóng Bowling',
            topics: ['sports', 'duo'], players: '1-4', added: '2026-07-28',
            keywords: 'strike party bowling game bowling tro choi bowling pins strike spare 4 player'
        },
        {
            dir: 'cyber-snake', slug: 'cyber-snake', tile: 'tile-snake',
            en: 'Cyber Snake', vi: 'Rắn Săn Mồi',
            topics: ['action'], players: '1', added: '2026-07-27',
            keywords: 'cyber snake game ran san moi tro choi con ran neon snake grow eat phaser'
        },
        {
            dir: 'billiards-game', slug: 'pool-masters', tile: 'tile-pool',
            en: 'Pool Masters', vi: 'Cao Thủ Bi-a',
            topics: ['sports', 'physics', 'duo'], players: '1-2', added: '2026-07-24',
            keywords: 'pool masters billiards game bi a tro choi bi a 8 ball cue physics 2 player'
        },
        {
            dir: 'soccer-game', slug: 'super-striker', tile: 'tile-soccer',
            en: 'Super Striker', vi: 'Sút Bóng Siêu Đỉnh',
            topics: ['sports', 'duo'], players: '1-2', added: '2026-07-23',
            keywords: 'super striker soccer football game sut bong tro choi da bong goal penalty 2 player'
        },
        {
            dir: 'darts-game', slug: 'balloon-darts', tile: 'tile-darts',
            en: 'Balloon Darts', vi: 'Phi Tiêu Bong Bóng',
            topics: ['sports', 'action'], players: '1-2', added: '2026-07-25',
            keywords: 'balloon darts game phi tieu tro choi nem phi tieu bong bay throw aim pop'
        },
        {
            dir: 'xiangqi', slug: 'co-tuong', tile: 'tile-xiangqi',
            en: 'Xiangqi', vi: 'Cờ Tướng',
            topics: ['board', 'duo'], players: '1-2', added: '2026-07-26',
            keywords: 'xiangqi chinese chess co tuong choi co tuong online board game 2 player'
        },
        {
            dir: 'tictactoe-game', slug: 'tic-tac-toe', tile: 'tile-tictactoe',
            en: 'Tic Tac Toe', vi: 'Cờ Ca-rô',
            topics: ['board', 'duo'], players: '1-2', added: '2026-07-26',
            keywords: 'tic tac toe game co caro tro choi caro noughts crosses 2 player'
        },
        {
            dir: 'ocean-game', slug: 'ocean-party', tile: 'tile-ocean',
            en: 'Ocean Party', vi: 'Tiệc Đại Dương',
            topics: ['action', 'duo'], players: '1-4', added: '2026-07-21',
            keywords: 'ocean party underwater treasure game tiec dai duong tro choi duoi bien 4 player family'
        },
        {
            dir: 'aqua-dash', slug: 'aqua-dash', tile: 'tile-aqua',
            en: 'Aqua Dash', vi: 'Đua Dưới Biển',
            topics: ['action', 'duo'], players: '1-4', added: '2026-07-21',
            keywords: 'aqua dash underwater race game dua duoi bien tro choi boi loi swim dash treasure 4 player'
        },
        {
            dir: 'racer-game', slug: 'neon-racer', tile: 'tile-racer',
            en: 'Neon Racer', vi: 'Đua Xe Neon',
            topics: ['action', 'sports'], players: '1', added: '2026-07-19',
            keywords: 'neon racer racing car game dua xe tro choi lai xe speed dodge'
        },
        {
            dir: 'space-shooter', slug: 'neon-nebula', tile: 'tile-space',
            en: 'Neon Nebula', vi: 'Phi Thuyền Neon',
            topics: ['action'], players: '1', added: '2026-07-18',
            keywords: 'neon nebula space shooter game phi thuyen tro choi ban may bay vu tru stars'
        },
        {
            dir: 'shooter-game', slug: 'bot-arena', tile: 'tile-shooter',
            en: 'Bot Arena', vi: 'Đấu Trường Rô-bốt',
            topics: ['action'], players: '1', added: '2026-07-17',
            keywords: 'bot arena shooter game dau truong robot tro choi ban robot aim survive'
        },
        {
            dir: 'english-game', slug: 'english-quest', tile: 'tile-english',
            en: 'English Quest', vi: 'Học Tiếng Anh',
            topics: ['learning'], players: '1', added: '2026-07-16',
            keywords: 'english quest learn english game hoc tieng anh tro choi hoc tu vung present perfect grammar kids'
        }
    ];

    var bySlug = {}, byDir = {};
    GAMES.forEach(function (g) { bySlug[g.slug] = g; byDir[g.dir] = g; });

    /* Ba game mới nhất được gắn nhãn MỚI. Tính theo ngày chứ không gắn tay:
     * gắn tay thì nhãn MỚI dính mãi trên game làm từ nửa năm trước, mà chuyện
     * ấy đã xảy ra rồi — có tám ô cùng đeo nhãn MỚI một lúc. */
    var NEW_COUNT = 3;
    var newest = GAMES.slice().sort(function (a, b) {
        return a.added < b.added ? 1 : (a.added > b.added ? -1 : 0);
    }).slice(0, NEW_COUNT).map(function (g) { return g.slug; });

    return {
        TOPICS: TOPICS,
        GAMES: GAMES,
        bySlug: function (s) { return bySlug[s]; },
        byDir: function (d) { return byDir[d]; },
        topic: function (key) {
            for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].key === key) return TOPICS[i];
            return null;
        },
        isNew: function (slug) { return newest.indexOf(slug) >= 0; },
        /* Danh sách game thuộc một chủ đề, giữ nguyên thứ tự mới → cũ */
        inTopic: function (key) {
            return GAMES.filter(function (g) { return g.topics.indexOf(key) >= 0; });
        }
    };
}));
