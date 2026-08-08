/* =========================================================
   ENGLISH QUEST — Dữ liệu 12 thế giới / 120 bài học

   Bám khung Cambridge YLE:
     • World 1-6   → Pre A1 Starters
     • World 7-11  → A1 Movers
     • World 12    → A2 Flyers

   Chuẩn mỗi bài:
     • 8-10 mục, ít nhất 3 dạng khác nhau
     • Câu trắc nghiệm tối thiểu 3 lựa chọn (ưu tiên 4)
     • Bài 5 của mỗi thế giới là bài ôn lại 4 bài trước
     • Bài 10 là Boss: 12-14 mục tổng hợp cả thế giới

   Dạng bài mở dần theo sức đọc - viết của bé:
     Mầm non  : card, choice, match, sort      (chưa phải gõ chữ)
     Lớp 1    : + build                         (xếp câu từ mảnh có sẵn)
     Lớp 2    : + fill                          (gõ một từ)
     Lớp 3 trở lên: + listen, + passage         (nghe chép, bài đọc hiểu)

   Lược đồ từng dạng — đúng theo renderer trong game.js:
     card   { kind, w:{ w, ipa, vi, emoji, ex, exVi } }
     choice { kind, prompt, emoji?, speak?, opts[], ans, why }
     build  { kind, target:'từ cách nhau kể cả dấu câu', vi, emoji?, why }
     fill   { kind, prompt:'... ___ ...', cue?, emoji?, answers[], bank[] }
     listen { kind, sentence, display:'... ___ ...', emoji?, answers[], bank[] }
     match  { kind, title, leftLabel, rightLabel, pairs:[[trái, phải nối với nó]] }
     sort   { kind, title, leftLabel, rightLabel, pairs:[[vào cột trái, vào cột phải]] }
   Riêng `sort`: hai phần tử trong mỗi cặp KHÔNG liên quan nhau, chỉ là
   "một từ cho cột trái, một từ cho cột phải" — engine trộn hết rồi cho bé xếp.

   Bài đọc gắn ở cấp level: level.passage = { title, pics[], text, plain }
   `text` hiện ra cho bé đọc (có thể chứa HTML), `plain` là bản không thẻ để
   trình duyệt đọc thành tiếng.
   ========================================================= */

window.ENGLISH_WORLDS = [
/* ===================== WORLD 1 — Pre A1 Starters =====================
   Mầm non. Bé chưa đọc được chữ nên mọi câu đều có tranh emoji, và không có
   dạng nào phải gõ bàn phím. */
{
    id: 'world-1', order: 1,
    title: '🎈 Pre-K & Kindergarten Starter',
    subtitle: 'Bảng chữ cái Phonics + Màu sắc + Số đếm 1-10',
    grade: 'Mầm non', gradeMin: 0, gradeMax: 0,
    icon: '🎈', color: '#c2255c',
    levels: [
        {
            id: 'w1-l1', order: 1, title: 'Alphabet Phonics (A - G)',
            topic: 'Phonics', desc: 'Bảy chữ cái đầu tiên A B C D E F G, mỗi chữ một từ và một bức tranh.',
            items: [
                { kind: 'card', w: { w: 'Apple', ipa: '/ˈæp.əl/', vi: 'quả táo', emoji: '🍎', ex: 'A is for apple.', exVi: 'A là chữ của apple.' } },
                { kind: 'card', w: { w: 'Ball', ipa: '/bɔːl/', vi: 'quả bóng', emoji: '⚽', ex: 'B is for ball.', exVi: 'B là chữ của ball.' } },
                { kind: 'card', w: { w: 'Cat', ipa: '/kæt/', vi: 'con mèo', emoji: '🐱', ex: 'C is for cat.', exVi: 'C là chữ của cat.' } },
                { kind: 'card', w: { w: 'Dog', ipa: '/dɒɡ/', vi: 'con chó', emoji: '🐶', ex: 'D is for dog.', exVi: 'D là chữ của dog.' } },
                { kind: 'choice', prompt: 'Từ nào bắt đầu bằng chữ <b>A</b>?', emoji: '🍎', opts: ['Ball', 'Apple', 'Dog', 'Cat'], ans: 1, why: '<b>A</b>pple bắt đầu bằng chữ A.' },
                { kind: 'choice', prompt: 'Từ nào bắt đầu bằng chữ <b>C</b>?', emoji: '🐱', opts: ['Dog', 'Ball', 'Cat', 'Apple'], ans: 2, why: '<b>C</b>at bắt đầu bằng chữ C.' },
                { kind: 'choice', prompt: '🐶 Con chó tiếng Anh là gì?', emoji: '🐶', opts: ['Dog', 'Cat', 'Ball', 'Apple'], ans: 0, why: 'Con chó là <b>dog</b> /dɒɡ/.' },
                { kind: 'match', title: 'Nối chữ cái với từ bắt đầu bằng chữ đó', leftLabel: 'Chữ cái', rightLabel: 'Từ', pairs: [['A', 'Apple'], ['B', 'Ball'], ['C', 'Cat'], ['D', 'Dog']] },
                { kind: 'choice', prompt: 'Chữ nào đứng ngay <b>sau</b> chữ E?', opts: ['G', 'D', 'F', 'A'], ans: 2, why: 'Thứ tự là E → <b>F</b> → G.' }
            ]
        },
        {
            id: 'w1-l2', order: 2, title: 'Alphabet Phonics (H - N)',
            topic: 'Phonics', desc: 'Bảy chữ tiếp theo H I J K L M N cùng những từ quen thuộc.',
            items: [
                { kind: 'card', w: { w: 'Hat', ipa: '/hæt/', vi: 'cái mũ', emoji: '🧢', ex: 'H is for hat.', exVi: 'H là chữ của hat.' } },
                { kind: 'card', w: { w: 'Ice', ipa: '/aɪs/', vi: 'nước đá', emoji: '🧊', ex: 'I is for ice.', exVi: 'I là chữ của ice.' } },
                { kind: 'card', w: { w: 'Kite', ipa: '/kaɪt/', vi: 'con diều', emoji: '🪁', ex: 'K is for kite.', exVi: 'K là chữ của kite.' } },
                { kind: 'card', w: { w: 'Lion', ipa: '/ˈlaɪ.ən/', vi: 'con sư tử', emoji: '🦁', ex: 'L is for lion.', exVi: 'L là chữ của lion.' } },
                { kind: 'choice', prompt: 'Từ nào bắt đầu bằng chữ <b>L</b>?', emoji: '🦁', opts: ['Hat', 'Ice', 'Lion', 'Kite'], ans: 2, why: '<b>L</b>ion bắt đầu bằng chữ L.' },
                { kind: 'choice', prompt: '🪁 Con diều tiếng Anh là gì?', emoji: '🪁', opts: ['Kite', 'Hat', 'Lion', 'Ice'], ans: 0, why: 'Con diều là <b>kite</b> /kaɪt/.' },
                { kind: 'choice', prompt: 'Chữ <b>M</b> là chữ đầu của từ nào?', emoji: '🐒', opts: ['Nest', 'Monkey', 'Ice', 'Hat'], ans: 1, why: '<b>M</b>onkey (con khỉ) bắt đầu bằng chữ M.' },
                { kind: 'match', title: 'Nối chữ cái với từ của nó', leftLabel: 'Chữ cái', rightLabel: 'Từ', pairs: [['H', 'Hat'], ['I', 'Ice'], ['K', 'Kite'], ['L', 'Lion']] },
                { kind: 'choice', prompt: 'Chữ nào đứng ngay <b>trước</b> chữ N?', opts: ['L', 'M', 'K', 'O'], ans: 1, why: 'Thứ tự là L → <b>M</b> → N.' }
            ]
        },
        {
            id: 'w1-l3', order: 3, title: 'Alphabet Phonics (O - Z)',
            topic: 'Phonics', desc: 'Đoạn cuối bảng chữ cái, từ O đến Z.',
            items: [
                { kind: 'card', w: { w: 'Orange', ipa: '/ˈɒr.ɪndʒ/', vi: 'quả cam', emoji: '🍊', ex: 'O is for orange.', exVi: 'O là chữ của orange.' } },
                { kind: 'card', w: { w: 'Panda', ipa: '/ˈpæn.də/', vi: 'gấu trúc', emoji: '🐼', ex: 'P is for panda.', exVi: 'P là chữ của panda.' } },
                { kind: 'card', w: { w: 'Sun', ipa: '/sʌn/', vi: 'mặt trời', emoji: '☀️', ex: 'S is for sun.', exVi: 'S là chữ của sun.' } },
                { kind: 'card', w: { w: 'Tiger', ipa: '/ˈtaɪ.ɡər/', vi: 'con hổ', emoji: '🐅', ex: 'T is for tiger.', exVi: 'T là chữ của tiger.' } },
                { kind: 'choice', prompt: 'Từ nào bắt đầu bằng chữ <b>P</b>?', emoji: '🐼', opts: ['Sun', 'Tiger', 'Orange', 'Panda'], ans: 3, why: '<b>P</b>anda bắt đầu bằng chữ P.' },
                { kind: 'choice', prompt: '☀️ Mặt trời tiếng Anh là gì?', emoji: '☀️', opts: ['Sun', 'Panda', 'Tiger', 'Orange'], ans: 0, why: 'Mặt trời là <b>sun</b> /sʌn/.' },
                { kind: 'choice', prompt: 'Chữ cái <b>cuối cùng</b> của bảng chữ cái là chữ nào?', opts: ['Y', 'W', 'Z', 'X'], ans: 2, why: 'Bảng chữ cái kết thúc bằng chữ <b>Z</b>.' },
                { kind: 'match', title: 'Nối chữ cái với từ của nó', leftLabel: 'Chữ cái', rightLabel: 'Từ', pairs: [['O', 'Orange'], ['P', 'Panda'], ['S', 'Sun'], ['T', 'Tiger']] },
                { kind: 'sort', title: 'Xếp từ vào đúng nhóm', leftLabel: '🐾 Con vật', rightLabel: '🍎 Không phải con vật', pairs: [['Panda', 'Orange'], ['Tiger', 'Sun'], ['Lion', 'Hat']] }
            ]
        },
        {
            id: 'w1-l4', order: 4, title: 'Colors (Red, Blue, Yellow)',
            topic: 'Colours', desc: 'Ba màu cơ bản đầu tiên: đỏ, xanh dương, vàng.',
            items: [
                { kind: 'card', w: { w: 'Red', ipa: '/red/', vi: 'màu đỏ', emoji: '🔴', ex: 'The apple is red.', exVi: 'Quả táo màu đỏ.' } },
                { kind: 'card', w: { w: 'Blue', ipa: '/bluː/', vi: 'màu xanh dương', emoji: '🔵', ex: 'The sky is blue.', exVi: 'Bầu trời màu xanh dương.' } },
                { kind: 'card', w: { w: 'Yellow', ipa: '/ˈjel.əʊ/', vi: 'màu vàng', emoji: '🟡', ex: 'The sun is yellow.', exVi: 'Mặt trời màu vàng.' } },
                { kind: 'choice', prompt: '🍎 Quả táo này màu gì?', emoji: '🍎', opts: ['Blue', 'Red', 'Yellow'], ans: 1, why: 'Quả táo màu đỏ — <b>red</b>.' },
                { kind: 'choice', prompt: '🍌 Quả chuối này màu gì?', emoji: '🍌', opts: ['Yellow', 'Red', 'Blue'], ans: 0, why: 'Quả chuối màu vàng — <b>yellow</b>.' },
                { kind: 'choice', prompt: '🌊 Biển màu gì?', emoji: '🌊', opts: ['Red', 'Yellow', 'Blue'], ans: 2, why: 'Biển màu xanh dương — <b>blue</b>.' },
                { kind: 'choice', prompt: '<b>Red</b> nghĩa là màu gì?', emoji: '🔴', opts: ['màu vàng', 'màu đỏ', 'màu xanh'], ans: 1, why: '<b>Red</b> là màu đỏ.' },
                { kind: 'match', title: 'Nối màu với đồ vật đúng màu đó', leftLabel: 'Màu', rightLabel: 'Đồ vật', pairs: [['Red', '🍎 apple'], ['Blue', '🌊 sea'], ['Yellow', '☀️ sun']] }
            ]
        },
        {
            id: 'w1-l5', order: 5, title: '🔄 Ôn tập: Chữ cái & Màu sắc',
            topic: 'Review', desc: 'Ôn lại bốn bài vừa học: bảng chữ cái và ba màu cơ bản.',
            items: [
                { kind: 'choice', prompt: 'Từ nào bắt đầu bằng chữ <b>B</b>?', emoji: '⚽', opts: ['Cat', 'Apple', 'Ball', 'Dog'], ans: 2, why: '<b>B</b>all bắt đầu bằng chữ B.' },
                { kind: 'choice', prompt: '🦁 Con sư tử tiếng Anh là gì?', emoji: '🦁', opts: ['Tiger', 'Lion', 'Panda', 'Cat'], ans: 1, why: 'Sư tử là <b>lion</b>, hổ mới là tiger.' },
                { kind: 'choice', prompt: '🐼 Con này tiếng Anh là gì?', emoji: '🐼', opts: ['Panda', 'Dog', 'Tiger', 'Lion'], ans: 0, why: 'Gấu trúc là <b>panda</b>.' },
                { kind: 'choice', prompt: '🟡 Màu này tiếng Anh là gì?', emoji: '🟡', opts: ['Red', 'Blue', 'Yellow'], ans: 2, why: 'Màu vàng là <b>yellow</b>.' },
                { kind: 'choice', prompt: 'Chữ nào đứng ngay sau chữ <b>B</b>?', opts: ['C', 'A', 'D', 'E'], ans: 0, why: 'Thứ tự là A B <b>C</b> D E.' },
                { kind: 'match', title: 'Nối từ tiếng Anh với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Hat', 'cái mũ'], ['Kite', 'con diều'], ['Sun', 'mặt trời'], ['Orange', 'quả cam']] },
                { kind: 'sort', title: 'Xếp từ vào đúng nhóm', leftLabel: '🎨 Màu sắc', rightLabel: '🐾 Con vật', pairs: [['Red', 'Cat'], ['Blue', 'Dog'], ['Yellow', 'Panda']] },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> là màu?', opts: ['Blue', 'Yellow', 'Tiger', 'Red'], ans: 2, why: '<b>Tiger</b> là con hổ, không phải màu sắc.' },
                { kind: 'choice', prompt: '🧊 Từ này bắt đầu bằng chữ nào?', emoji: '🧊', opts: ['E', 'I', 'A', 'O'], ans: 1, why: '<b>I</b>ce bắt đầu bằng chữ I.' }
            ]
        },
        {
            id: 'w1-l6', order: 6, title: 'Numbers 1 - 5',
            topic: 'Numbers', desc: 'Đếm từ một đến năm bằng tiếng Anh.',
            items: [
                { kind: 'card', w: { w: 'One', ipa: '/wʌn/', vi: 'số một', emoji: '1️⃣', ex: 'I have one nose.', exVi: 'Tớ có một cái mũi.' } },
                { kind: 'card', w: { w: 'Two', ipa: '/tuː/', vi: 'số hai', emoji: '2️⃣', ex: 'I have two eyes.', exVi: 'Tớ có hai con mắt.' } },
                { kind: 'card', w: { w: 'Three', ipa: '/θriː/', vi: 'số ba', emoji: '3️⃣', ex: 'I see three cats.', exVi: 'Tớ thấy ba con mèo.' } },
                { kind: 'card', w: { w: 'Five', ipa: '/faɪv/', vi: 'số năm', emoji: '5️⃣', ex: 'I have five fingers.', exVi: 'Tớ có năm ngón tay.' } },
                { kind: 'choice', prompt: '🐱🐱 Có mấy con mèo?', emoji: '🐱', opts: ['Three', 'One', 'Two', 'Four'], ans: 2, why: 'Có 2 con mèo — <b>two</b>.' },
                { kind: 'choice', prompt: '⭐⭐⭐ Có mấy ngôi sao?', emoji: '⭐', opts: ['Three', 'Two', 'Five', 'One'], ans: 0, why: 'Có 3 ngôi sao — <b>three</b>.' },
                { kind: 'choice', prompt: 'Số <b>5</b> tiếng Anh là gì?', emoji: '5️⃣', opts: ['Four', 'Five', 'Three', 'Two'], ans: 1, why: 'Số 5 là <b>five</b> /faɪv/.' },
                { kind: 'match', title: 'Nối số với chữ tiếng Anh', leftLabel: 'Số', rightLabel: 'Tiếng Anh', pairs: [['1', 'One'], ['2', 'Two'], ['3', 'Three'], ['5', 'Five']] }
            ]
        },
        {
            id: 'w1-l7', order: 7, title: 'Numbers 6 - 10',
            topic: 'Numbers', desc: 'Đếm tiếp từ sáu đến mười.',
            items: [
                { kind: 'card', w: { w: 'Six', ipa: '/sɪks/', vi: 'số sáu', emoji: '6️⃣', ex: 'Six balls are here.', exVi: 'Có sáu quả bóng ở đây.' } },
                { kind: 'card', w: { w: 'Seven', ipa: '/ˈsev.ən/', vi: 'số bảy', emoji: '7️⃣', ex: 'A week has seven days.', exVi: 'Một tuần có bảy ngày.' } },
                { kind: 'card', w: { w: 'Eight', ipa: '/eɪt/', vi: 'số tám', emoji: '8️⃣', ex: 'I am eight years old.', exVi: 'Tớ tám tuổi.' } },
                { kind: 'card', w: { w: 'Ten', ipa: '/ten/', vi: 'số mười', emoji: '🔟', ex: 'I have ten fingers.', exVi: 'Tớ có mười ngón tay.' } },
                { kind: 'choice', prompt: 'Số <b>10</b> tiếng Anh là gì?', emoji: '🔟', opts: ['Nine', 'Eight', 'Ten', 'Seven'], ans: 2, why: 'Số 10 là <b>ten</b> /ten/.' },
                { kind: 'choice', prompt: 'Số nào đứng <b>giữa</b> six và eight?', opts: ['Nine', 'Seven', 'Five', 'Ten'], ans: 1, why: '6 → <b>7 (seven)</b> → 8.' },
                { kind: 'choice', prompt: 'Một tuần có mấy ngày?', emoji: '📅', opts: ['Seven', 'Six', 'Ten', 'Eight'], ans: 0, why: 'Một tuần có 7 ngày — <b>seven</b> days.' },
                { kind: 'match', title: 'Nối số với chữ tiếng Anh', leftLabel: 'Số', rightLabel: 'Tiếng Anh', pairs: [['6', 'Six'], ['7', 'Seven'], ['8', 'Eight'], ['10', 'Ten']] },
                { kind: 'sort', title: 'Xếp số vào đúng nhóm', leftLabel: 'Số bé (1-5)', rightLabel: 'Số lớn (6-10)', pairs: [['Two', 'Seven'], ['Three', 'Nine'], ['Five', 'Ten']] }
            ]
        },
        {
            id: 'w1-l8', order: 8, title: 'Pets (Cat, Dog, Bird)',
            topic: 'Animals', desc: 'Những con vật nuôi trong nhà bé hay gặp.',
            items: [
                { kind: 'card', w: { w: 'Bird', ipa: '/bɜːd/', vi: 'con chim', emoji: '🐦', ex: 'The bird can fly.', exVi: 'Con chim biết bay.' } },
                { kind: 'card', w: { w: 'Fish', ipa: '/fɪʃ/', vi: 'con cá', emoji: '🐟', ex: 'The fish can swim.', exVi: 'Con cá biết bơi.' } },
                { kind: 'card', w: { w: 'Rabbit', ipa: '/ˈræb.ɪt/', vi: 'con thỏ', emoji: '🐰', ex: 'The rabbit is white.', exVi: 'Con thỏ màu trắng.' } },
                { kind: 'choice', prompt: '🐦 Con nào biết <b>bay</b>?', emoji: '🐦', opts: ['Fish', 'Bird', 'Cat', 'Rabbit'], ans: 1, why: 'Con chim — <b>bird</b> — biết bay.' },
                { kind: 'choice', prompt: '🐟 Con nào sống dưới nước?', emoji: '🐟', opts: ['Fish', 'Dog', 'Bird', 'Rabbit'], ans: 0, why: 'Con cá — <b>fish</b> — sống dưới nước.' },
                { kind: 'choice', prompt: '🐰 Con thỏ tiếng Anh là gì?', emoji: '🐰', opts: ['Cat', 'Bird', 'Rabbit', 'Fish'], ans: 2, why: 'Con thỏ là <b>rabbit</b>.' },
                { kind: 'choice', prompt: 'Con nào <b>không</b> nuôi trong nhà được?', opts: ['Cat', 'Tiger', 'Dog', 'Fish'], ans: 1, why: '<b>Tiger</b> (con hổ) sống trong rừng, không nuôi trong nhà.' },
                { kind: 'match', title: 'Nối con vật với việc nó làm được', leftLabel: 'Con vật', rightLabel: 'Làm được gì', pairs: [['Bird', 'fly 🕊️'], ['Fish', 'swim 🏊'], ['Rabbit', 'jump 🦘'], ['Dog', 'run 🏃']] }
            ]
        },
        {
            id: 'w1-l9', order: 9, title: 'Toys & Things I Like',
            topic: 'Toys', desc: 'Đồ chơi quen thuộc: bóng, búp bê, xe, gấu bông.',
            items: [
                { kind: 'card', w: { w: 'Doll', ipa: '/dɒl/', vi: 'búp bê', emoji: '🪆', ex: 'This is my doll.', exVi: 'Đây là búp bê của tớ.' } },
                { kind: 'card', w: { w: 'Car', ipa: '/kɑːr/', vi: 'ô tô đồ chơi', emoji: '🚗', ex: 'I have a red car.', exVi: 'Tớ có một chiếc ô tô đỏ.' } },
                { kind: 'card', w: { w: 'Teddy bear', ipa: '/ˈted.i beər/', vi: 'gấu bông', emoji: '🧸', ex: 'My teddy bear is soft.', exVi: 'Gấu bông của tớ mềm lắm.' } },
                { kind: 'choice', prompt: '🧸 Con gấu bông tiếng Anh là gì?', emoji: '🧸', opts: ['Doll', 'Teddy bear', 'Car', 'Ball'], ans: 1, why: 'Gấu bông là <b>teddy bear</b>.' },
                { kind: 'choice', prompt: '⚽ Bé đá cái gì?', emoji: '⚽', opts: ['a ball', 'a doll', 'a car'], ans: 0, why: 'Bé đá quả bóng — <b>a ball</b>.' },
                { kind: 'choice', prompt: '🚗 Chiếc xe này màu đỏ. Nói thế nào?', emoji: '🚗', opts: ['The car is blue.', 'The car is red.', 'The car is yellow.'], ans: 1, why: 'Xe màu đỏ → The car is <b>red</b>.' },
                { kind: 'match', title: 'Nối đồ chơi với tranh của nó', leftLabel: 'Từ', rightLabel: 'Tranh', pairs: [['Ball', '⚽'], ['Doll', '🪆'], ['Car', '🚗'], ['Teddy bear', '🧸']] },
                { kind: 'sort', title: 'Xếp từ vào đúng nhóm', leftLabel: '🧸 Đồ chơi', rightLabel: '🐾 Con vật', pairs: [['Doll', 'Rabbit'], ['Car', 'Bird'], ['Ball', 'Fish']] }
            ]
        },
        {
            id: 'w1-l10', order: 10, title: '👑 Boss: Pre-K Fun Star', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp cả thế giới: chữ cái, màu sắc, số đếm, con vật và đồ chơi.',
            items: [
                { kind: 'choice', prompt: 'Từ nào bắt đầu bằng chữ <b>D</b>?', emoji: '🐶', opts: ['Cat', 'Ball', 'Apple', 'Dog'], ans: 3, why: '<b>D</b>og bắt đầu bằng chữ D.' },
                { kind: 'choice', prompt: '🐅 Con này tiếng Anh là gì?', emoji: '🐅', opts: ['Lion', 'Tiger', 'Panda', 'Cat'], ans: 1, why: 'Con hổ là <b>tiger</b>.' },
                { kind: 'choice', prompt: '🔵 Màu này tiếng Anh là gì?', emoji: '🔵', opts: ['Blue', 'Red', 'Yellow'], ans: 0, why: 'Màu xanh dương là <b>blue</b>.' },
                { kind: 'choice', prompt: '⭐⭐⭐⭐⭐ Có mấy ngôi sao?', emoji: '⭐', opts: ['Three', 'Four', 'Five', 'Six'], ans: 2, why: 'Có 5 ngôi sao — <b>five</b>.' },
                { kind: 'choice', prompt: 'Số <b>8</b> tiếng Anh là gì?', emoji: '8️⃣', opts: ['Eight', 'Seven', 'Nine', 'Ten'], ans: 0, why: 'Số 8 là <b>eight</b> /eɪt/.' },
                { kind: 'choice', prompt: '🐟 Con cá làm gì được?', emoji: '🐟', opts: ['It can fly.', 'It can swim.', 'It can jump.'], ans: 1, why: 'Con cá biết bơi — It can <b>swim</b>.' },
                { kind: 'choice', prompt: '🍊 Quả cam tiếng Anh là gì?', emoji: '🍊', opts: ['Apple', 'Orange', 'Ball'], ans: 1, why: 'Quả cam là <b>orange</b>.' },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> con vật?', opts: ['Panda', 'Rabbit', 'Kite', 'Bird'], ans: 2, why: '<b>Kite</b> là con diều — đồ chơi, không phải con vật.' },
                { kind: 'match', title: 'Nối từ với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Sun', 'mặt trời'], ['Doll', 'búp bê'], ['Rabbit', 'con thỏ'], ['Hat', 'cái mũ']] },
                { kind: 'match', title: 'Nối số với chữ tiếng Anh', leftLabel: 'Số', rightLabel: 'Tiếng Anh', pairs: [['4', 'Four'], ['6', 'Six'], ['9', 'Nine'], ['10', 'Ten']] },
                { kind: 'sort', title: 'Xếp từ vào đúng nhóm', leftLabel: '🔢 Số đếm', rightLabel: '🎨 Màu sắc', pairs: [['Three', 'Red'], ['Seven', 'Blue'], ['Ten', 'Yellow']] },
                { kind: 'choice', prompt: 'Chữ cái <b>đầu tiên</b> của bảng chữ cái là chữ nào?', opts: ['B', 'A', 'C', 'Z'], ans: 1, why: 'Bảng chữ cái bắt đầu bằng chữ <b>A</b>.' }
            ]
        }
    ]
},
/* ===================== WORLD 2 — Pre A1 Starters =====================
   Vẫn Mầm non: gia đình, trái cây, bộ phận cơ thể, đồ ăn, cảm xúc.
   Bắt đầu cho bé làm quen mẫu câu ngắn "This is my ...", "I am ...". */
{
    id: 'world-2', order: 2,
    title: '🧸 Fun Around Me',
    subtitle: 'Gia đình + Trái cây + Đồ chơi + Cảm xúc',
    grade: 'Mầm non', gradeMin: 0, gradeMax: 0,
    icon: '🧸', color: '#b5620a',
    levels: [
        {
            id: 'w2-l1', order: 1, title: 'My Family (Mommy, Daddy)',
            topic: 'Family', desc: 'Bố, mẹ, em bé — những người thân gần nhất với bé.',
            items: [
                { kind: 'card', w: { w: 'Mother', ipa: '/ˈmʌð.ər/', vi: 'mẹ', emoji: '👩', ex: 'This is my mother.', exVi: 'Đây là mẹ của tớ.' } },
                { kind: 'card', w: { w: 'Father', ipa: '/ˈfɑː.ðər/', vi: 'bố', emoji: '👨', ex: 'This is my father.', exVi: 'Đây là bố của tớ.' } },
                { kind: 'card', w: { w: 'Baby', ipa: '/ˈbeɪ.bi/', vi: 'em bé', emoji: '👶', ex: 'The baby is small.', exVi: 'Em bé thì nhỏ.' } },
                { kind: 'choice', prompt: '👩 Mẹ tiếng Anh là gì?', emoji: '👩', opts: ['Father', 'Mother', 'Baby', 'Sister'], ans: 1, why: 'Mẹ là <b>mother</b> (gọi thân mật: mummy, mom).' },
                { kind: 'choice', prompt: '👨 Bố tiếng Anh là gì?', emoji: '👨', opts: ['Father', 'Mother', 'Brother'], ans: 0, why: 'Bố là <b>father</b> (gọi thân mật: daddy, dad).' },
                { kind: 'choice', prompt: 'Điền vào chỗ trống: This is my ______. 👶', emoji: '👶', opts: ['baby', 'mother', 'father'], ans: 0, why: 'Tranh là em bé → This is my <b>baby</b> brother/sister.' },
                { kind: 'choice', prompt: '<b>Family</b> nghĩa là gì?', emoji: '👨‍👩‍👧', opts: ['trường học', 'gia đình', 'bạn bè'], ans: 1, why: '<b>Family</b> là gia đình.' },
                { kind: 'match', title: 'Nối người thân với tranh', leftLabel: 'Từ', rightLabel: 'Tranh', pairs: [['Mother', '👩'], ['Father', '👨'], ['Baby', '👶'], ['Family', '👨‍👩‍👧']] }
            ]
        },
        {
            id: 'w2-l2', order: 2, title: 'My Family (Brother, Sister)',
            topic: 'Family', desc: 'Anh chị em và ông bà.',
            items: [
                { kind: 'card', w: { w: 'Brother', ipa: '/ˈbrʌð.ər/', vi: 'anh trai / em trai', emoji: '👦', ex: 'My brother is seven.', exVi: 'Anh của tớ bảy tuổi.' } },
                { kind: 'card', w: { w: 'Sister', ipa: '/ˈsɪs.tər/', vi: 'chị gái / em gái', emoji: '👧', ex: 'My sister likes cats.', exVi: 'Chị tớ thích mèo.' } },
                { kind: 'card', w: { w: 'Grandmother', ipa: '/ˈɡræn.mʌð.ər/', vi: 'bà', emoji: '👵', ex: 'My grandmother is kind.', exVi: 'Bà của tớ hiền lắm.' } },
                { kind: 'card', w: { w: 'Grandfather', ipa: '/ˈɡræn.fɑː.ðər/', vi: 'ông', emoji: '👴', ex: 'My grandfather has a hat.', exVi: 'Ông của tớ có một cái mũ.' } },
                { kind: 'choice', prompt: '👧 Chị gái tiếng Anh là gì?', emoji: '👧', opts: ['Brother', 'Mother', 'Sister', 'Baby'], ans: 2, why: 'Chị / em gái là <b>sister</b>.' },
                { kind: 'choice', prompt: '👴 Ông tiếng Anh là gì?', emoji: '👴', opts: ['Grandmother', 'Grandfather', 'Father'], ans: 1, why: 'Ông là <b>grandfather</b>; bà là grandmother.' },
                { kind: 'choice', prompt: 'Bạn nam trong nhà bé gọi là gì?', emoji: '👦', opts: ['brother', 'sister', 'mother'], ans: 0, why: 'Anh / em trai là <b>brother</b>.' },
                { kind: 'match', title: 'Nối người thân với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Brother', 'anh / em trai'], ['Sister', 'chị / em gái'], ['Grandmother', 'bà'], ['Grandfather', 'ông']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '👦 Nam', rightLabel: '👧 Nữ', pairs: [['Father', 'Mother'], ['Brother', 'Sister'], ['Grandfather', 'Grandmother']] }
            ]
        },
        {
            id: 'w2-l3', order: 3, title: 'Fruits (Apple, Banana)',
            topic: 'Food', desc: 'Những loại quả bé hay ăn.',
            items: [
                { kind: 'card', w: { w: 'Banana', ipa: '/bəˈnɑː.nə/', vi: 'quả chuối', emoji: '🍌', ex: 'The banana is yellow.', exVi: 'Quả chuối màu vàng.' } },
                { kind: 'card', w: { w: 'Grapes', ipa: '/ɡreɪps/', vi: 'quả nho', emoji: '🍇', ex: 'I like grapes.', exVi: 'Tớ thích nho.' } },
                { kind: 'card', w: { w: 'Watermelon', ipa: '/ˈwɔː.tə.mel.ən/', vi: 'quả dưa hấu', emoji: '🍉', ex: 'The watermelon is big.', exVi: 'Quả dưa hấu to lắm.' } },
                { kind: 'choice', prompt: '🍌 Quả này tiếng Anh là gì?', emoji: '🍌', opts: ['Apple', 'Banana', 'Orange', 'Grapes'], ans: 1, why: 'Quả chuối là <b>banana</b>.' },
                { kind: 'choice', prompt: '🍉 Quả dưa hấu tiếng Anh là gì?', emoji: '🍉', opts: ['Watermelon', 'Banana', 'Apple'], ans: 0, why: 'Dưa hấu là <b>watermelon</b> — ghép từ water (nước) + melon (quả dưa).' },
                { kind: 'choice', prompt: 'Quả nào màu <b>đỏ</b>?', emoji: '🍎', opts: ['Banana', 'Apple', 'Grapes'], ans: 1, why: 'Quả táo — <b>apple</b> — màu đỏ.' },
                { kind: 'choice', prompt: 'Tớ thích nho. Nói thế nào?', emoji: '🍇', opts: ['I like grapes.', 'I like banana.', 'I like apple.'], ans: 0, why: '<b>I like grapes.</b> — nho luôn ở dạng số nhiều: grapes.' },
                { kind: 'match', title: 'Nối quả với tranh', leftLabel: 'Từ', rightLabel: 'Tranh', pairs: [['Apple', '🍎'], ['Banana', '🍌'], ['Grapes', '🍇'], ['Watermelon', '🍉']] }
            ]
        },
        {
            id: 'w2-l4', order: 4, title: 'Food & Drink',
            topic: 'Food', desc: 'Đồ ăn thức uống hằng ngày: cơm, bánh mì, sữa, nước.',
            items: [
                { kind: 'card', w: { w: 'Rice', ipa: '/raɪs/', vi: 'cơm, gạo', emoji: '🍚', ex: 'I eat rice every day.', exVi: 'Tớ ăn cơm mỗi ngày.' } },
                { kind: 'card', w: { w: 'Bread', ipa: '/bred/', vi: 'bánh mì', emoji: '🍞', ex: 'I eat bread for breakfast.', exVi: 'Tớ ăn bánh mì bữa sáng.' } },
                { kind: 'card', w: { w: 'Milk', ipa: '/mɪlk/', vi: 'sữa', emoji: '🥛', ex: 'I drink milk.', exVi: 'Tớ uống sữa.' } },
                { kind: 'card', w: { w: 'Water', ipa: '/ˈwɔː.tər/', vi: 'nước', emoji: '💧', ex: 'Please drink water.', exVi: 'Hãy uống nước nhé.' } },
                { kind: 'choice', prompt: '🥛 Sữa tiếng Anh là gì?', emoji: '🥛', opts: ['Water', 'Bread', 'Milk', 'Rice'], ans: 2, why: 'Sữa là <b>milk</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🥛', opts: ['I drink milk.', 'I eat milk.', 'I drink bread.'], ans: 0, why: 'Đồ lỏng thì <b>drink</b> (uống), đồ đặc thì eat (ăn).' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🍚', opts: ['I drink rice.', 'I eat rice.', 'I eat water.'], ans: 1, why: 'Cơm là đồ ăn nên dùng <b>eat</b>; nước thì drink.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '🍽️ Ăn (eat)', rightLabel: '🥤 Uống (drink)', pairs: [['Rice', 'Milk'], ['Bread', 'Water'], ['Apple', 'Juice']] }
            ]
        },
        {
            id: 'w2-l5', order: 5, title: '🔄 Ôn tập: Gia đình & Đồ ăn',
            topic: 'Review', desc: 'Ôn lại người thân, trái cây và đồ ăn thức uống.',
            items: [
                { kind: 'choice', prompt: '👵 Bà tiếng Anh là gì?', emoji: '👵', opts: ['Grandfather', 'Mother', 'Grandmother', 'Sister'], ans: 2, why: 'Bà là <b>grandmother</b>.' },
                { kind: 'choice', prompt: '🍉 Quả này tiếng Anh là gì?', emoji: '🍉', opts: ['Watermelon', 'Grapes', 'Apple'], ans: 0, why: 'Dưa hấu là <b>watermelon</b>.' },
                { kind: 'choice', prompt: '🍞 Bánh mì tiếng Anh là gì?', emoji: '🍞', opts: ['Rice', 'Bread', 'Milk'], ans: 1, why: 'Bánh mì là <b>bread</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '💧', opts: ['I eat water.', 'I drink water.', 'I drink rice.'], ans: 1, why: 'Nước thì uống → I <b>drink</b> water.' },
                { kind: 'choice', prompt: 'Đây là mẹ của tớ. Nói thế nào?', emoji: '👩', opts: ['This is my mother.', 'This is my father.', 'This is my sister.'], ans: 0, why: 'Mẹ là mother → This is my <b>mother</b>.' },
                { kind: 'match', title: 'Nối từ với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Brother', 'anh trai'], ['Banana', 'quả chuối'], ['Milk', 'sữa'], ['Baby', 'em bé']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '👨‍👩‍👧 Người thân', rightLabel: '🍎 Đồ ăn', pairs: [['Mother', 'Rice'], ['Sister', 'Bread'], ['Grandfather', 'Apple']] },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> trái cây?', opts: ['Apple', 'Grapes', 'Bread', 'Banana'], ans: 2, why: '<b>Bread</b> là bánh mì, không phải trái cây.' },
                { kind: 'choice', prompt: 'Trong nhà, người nhỏ tuổi nhất thường là ai?', emoji: '👶', opts: ['the baby', 'the grandfather', 'the mother'], ans: 0, why: 'Em bé — <b>the baby</b> — nhỏ tuổi nhất.' }
            ]
        },
        {
            id: 'w2-l6', order: 6, title: 'My Body (Head, Eyes, Nose)',
            topic: 'Body', desc: 'Các bộ phận trên khuôn mặt và đầu.',
            items: [
                { kind: 'card', w: { w: 'Head', ipa: '/hed/', vi: 'cái đầu', emoji: '🧑', ex: 'Touch your head.', exVi: 'Hãy chạm vào đầu con.' } },
                { kind: 'card', w: { w: 'Eyes', ipa: '/aɪz/', vi: 'đôi mắt', emoji: '👀', ex: 'I have two eyes.', exVi: 'Tớ có hai con mắt.' } },
                { kind: 'card', w: { w: 'Nose', ipa: '/nəʊz/', vi: 'cái mũi', emoji: '👃', ex: 'My nose is small.', exVi: 'Mũi tớ nhỏ.' } },
                { kind: 'card', w: { w: 'Mouth', ipa: '/maʊθ/', vi: 'cái miệng', emoji: '👄', ex: 'Open your mouth.', exVi: 'Hãy há miệng ra.' } },
                { kind: 'choice', prompt: '👀 Bé có mấy con mắt?', emoji: '👀', opts: ['one eye', 'two eyes', 'three eyes'], ans: 1, why: 'Hai mắt → <b>two eyes</b>. Nhiều hơn một thì thêm -s.' },
                { kind: 'choice', prompt: '👃 Bé ngửi bằng gì?', emoji: '👃', opts: ['my nose', 'my eyes', 'my mouth'], ans: 0, why: 'Ngửi bằng mũi — <b>nose</b>.' },
                { kind: 'choice', prompt: '👀 Bé nhìn bằng gì?', emoji: '👀', opts: ['my mouth', 'my nose', 'my eyes'], ans: 2, why: 'Nhìn bằng mắt — <b>eyes</b>.' },
                { kind: 'match', title: 'Nối bộ phận với tranh', leftLabel: 'Từ', rightLabel: 'Tranh', pairs: [['Head', '🧑'], ['Eyes', '👀'], ['Nose', '👃'], ['Mouth', '👄']] }
            ]
        },
        {
            id: 'w2-l7', order: 7, title: 'My Body (Hand, Leg, Hair)',
            topic: 'Body', desc: 'Tay, chân, tóc và tai.',
            items: [
                { kind: 'card', w: { w: 'Hand', ipa: '/hænd/', vi: 'bàn tay', emoji: '✋', ex: 'Wash your hands.', exVi: 'Hãy rửa tay nhé.' } },
                { kind: 'card', w: { w: 'Leg', ipa: '/leɡ/', vi: 'cái chân', emoji: '🦵', ex: 'I run with my legs.', exVi: 'Tớ chạy bằng chân.' } },
                { kind: 'card', w: { w: 'Hair', ipa: '/heər/', vi: 'tóc', emoji: '💇', ex: 'Her hair is long.', exVi: 'Tóc bạn ấy dài.' } },
                { kind: 'card', w: { w: 'Ears', ipa: '/ɪəz/', vi: 'đôi tai', emoji: '👂', ex: 'I hear with my ears.', exVi: 'Tớ nghe bằng tai.' } },
                { kind: 'choice', prompt: '👂 Bé nghe bằng gì?', emoji: '👂', opts: ['my ears', 'my hands', 'my legs'], ans: 0, why: 'Nghe bằng tai — <b>ears</b>.' },
                { kind: 'choice', prompt: '🏃 Bé chạy bằng gì?', emoji: '🏃', opts: ['my hair', 'my legs', 'my ears'], ans: 1, why: 'Chạy bằng chân — <b>legs</b>.' },
                { kind: 'choice', prompt: 'Bé có mấy bàn tay?', emoji: '✋', opts: ['one hand', 'three hands', 'two hands'], ans: 2, why: 'Hai bàn tay — <b>two hands</b>.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '😀 Trên mặt', rightLabel: '🧍 Phần còn lại', pairs: [['Nose', 'Hand'], ['Mouth', 'Leg'], ['Eyes', 'Hair']] },
                { kind: 'match', title: 'Nối bộ phận với việc nó làm', leftLabel: 'Bộ phận', rightLabel: 'Để làm gì', pairs: [['Eyes', 'see 👀'], ['Ears', 'hear 👂'], ['Nose', 'smell 👃'], ['Legs', 'run 🏃']] }
            ]
        },
        {
            id: 'w2-l8', order: 8, title: 'Toys (Ball, Doll, Robot)',
            topic: 'Toys', desc: 'Hộp đồ chơi của bé và mẫu câu "I have a ...".',
            items: [
                { kind: 'card', w: { w: 'Robot', ipa: '/ˈrəʊ.bɒt/', vi: 'người máy', emoji: '🤖', ex: 'I have a robot.', exVi: 'Tớ có một con rô-bốt.' } },
                { kind: 'card', w: { w: 'Kite', ipa: '/kaɪt/', vi: 'con diều', emoji: '🪁', ex: 'My kite is big.', exVi: 'Con diều của tớ to.' } },
                { kind: 'card', w: { w: 'Bike', ipa: '/baɪk/', vi: 'xe đạp', emoji: '🚲', ex: 'I ride my bike.', exVi: 'Tớ đạp xe.' } },
                { kind: 'choice', prompt: '🤖 Đồ chơi này tiếng Anh là gì?', emoji: '🤖', opts: ['Doll', 'Robot', 'Ball', 'Kite'], ans: 1, why: 'Người máy là <b>robot</b>.' },
                { kind: 'choice', prompt: 'Tớ có một quả bóng. Nói thế nào?', emoji: '⚽', opts: ['I have a ball.', 'I am a ball.', 'I like a ball.'], ans: 0, why: 'Có cái gì đó → <b>I have a ...</b>.' },
                { kind: 'choice', prompt: '🚲 Bé làm gì với chiếc xe đạp?', emoji: '🚲', opts: ['I eat my bike.', 'I ride my bike.', 'I drink my bike.'], ans: 1, why: 'Đi xe đạp là <b>ride a bike</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🧸', opts: ['I have a teddy bear.', 'I have teddy bear.', 'I have an teddy bear.'], ans: 0, why: 'Danh từ đếm được số ít cần <b>a</b> đứng trước: a teddy bear.' },
                { kind: 'match', title: 'Nối đồ chơi với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Robot', 'người máy'], ['Kite', 'con diều'], ['Bike', 'xe đạp'], ['Doll', 'búp bê']] }
            ]
        },
        {
            id: 'w2-l9', order: 9, title: 'Feelings (Happy, Sad)',
            topic: 'Feelings', desc: 'Nói về cảm xúc bằng mẫu câu "I am ...".',
            items: [
                { kind: 'card', w: { w: 'Happy', ipa: '/ˈhæp.i/', vi: 'vui vẻ', emoji: '😀', ex: 'I am happy today.', exVi: 'Hôm nay tớ vui.' } },
                { kind: 'card', w: { w: 'Sad', ipa: '/sæd/', vi: 'buồn', emoji: '😢', ex: 'She is sad.', exVi: 'Bạn ấy buồn.' } },
                { kind: 'card', w: { w: 'Hungry', ipa: '/ˈhʌŋ.ɡri/', vi: 'đói bụng', emoji: '🍽️', ex: 'I am hungry.', exVi: 'Tớ đói bụng.' } },
                { kind: 'card', w: { w: 'Tired', ipa: '/taɪəd/', vi: 'mệt, buồn ngủ', emoji: '😴', ex: 'He is tired.', exVi: 'Bạn ấy mệt rồi.' } },
                { kind: 'choice', prompt: '😀 Bạn ấy thấy thế nào?', emoji: '😀', opts: ['sad', 'happy', 'tired'], ans: 1, why: 'Mặt cười → <b>happy</b> (vui).' },
                { kind: 'choice', prompt: '😢 Bạn ấy thấy thế nào?', emoji: '😢', opts: ['sad', 'happy', 'hungry'], ans: 0, why: 'Mặt khóc → <b>sad</b> (buồn).' },
                { kind: 'choice', prompt: 'Tớ đói bụng. Nói thế nào?', emoji: '🍽️', opts: ['I am hungry.', 'I have hungry.', 'I hungry.'], ans: 0, why: 'Cảm xúc dùng <b>am / is / are</b>: I <b>am</b> hungry.' },
                { kind: 'choice', prompt: 'Bé đói thì nên làm gì?', emoji: '🍚', opts: ['I sleep.', 'I eat.', 'I run.'], ans: 1, why: 'Đói thì ăn — <b>eat</b>.' },
                { kind: 'match', title: 'Nối cảm xúc với khuôn mặt', leftLabel: 'Từ', rightLabel: 'Mặt', pairs: [['Happy', '😀'], ['Sad', '😢'], ['Hungry', '🍽️'], ['Tired', '😴']] }
            ]
        },
        {
            id: 'w2-l10', order: 10, title: '👑 Boss: Kids World Master', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp: gia đình, trái cây, đồ ăn, cơ thể, đồ chơi và cảm xúc.',
            items: [
                { kind: 'choice', prompt: '👨 Bố tiếng Anh là gì?', emoji: '👨', opts: ['Mother', 'Father', 'Brother', 'Grandfather'], ans: 1, why: 'Bố là <b>father</b>.' },
                { kind: 'choice', prompt: '🍇 Quả này tiếng Anh là gì?', emoji: '🍇', opts: ['Grapes', 'Apple', 'Banana'], ans: 0, why: 'Nho là <b>grapes</b>.' },
                { kind: 'choice', prompt: '👂 Bé nghe bằng gì?', emoji: '👂', opts: ['eyes', 'nose', 'ears'], ans: 2, why: 'Nghe bằng tai — <b>ears</b>.' },
                { kind: 'choice', prompt: '😴 Bạn ấy thấy thế nào?', emoji: '😴', opts: ['happy', 'tired', 'hungry'], ans: 1, why: 'Ngáp và nhắm mắt → <b>tired</b> (mệt, buồn ngủ).' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🥛', opts: ['I eat milk.', 'I drink milk.', 'I am milk.'], ans: 1, why: 'Sữa thì uống → <b>drink</b> milk.' },
                { kind: 'choice', prompt: 'Tớ có một con diều. Nói thế nào?', emoji: '🪁', opts: ['I have a kite.', 'I am a kite.', 'I like kite.'], ans: 0, why: 'Sở hữu → <b>I have a kite.</b>' },
                { kind: 'choice', prompt: 'Bé vui. Nói thế nào?', emoji: '😀', opts: ['I have happy.', 'I am happy.', 'I happy.'], ans: 1, why: 'Cảm xúc luôn đi với to be: I <b>am</b> happy.' },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> bộ phận cơ thể?', opts: ['Hand', 'Robot', 'Nose', 'Leg'], ans: 1, why: '<b>Robot</b> là đồ chơi.' },
                { kind: 'match', title: 'Nối từ với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Sister', 'chị gái'], ['Bread', 'bánh mì'], ['Hair', 'tóc'], ['Bike', 'xe đạp']] },
                { kind: 'match', title: 'Nối bộ phận với việc nó làm', leftLabel: 'Bộ phận', rightLabel: 'Để làm gì', pairs: [['Eyes', 'see'], ['Mouth', 'eat'], ['Legs', 'run'], ['Hands', 'hold']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '😀 Cảm xúc', rightLabel: '👨‍👩‍👧 Người thân', pairs: [['Happy', 'Mother'], ['Sad', 'Brother'], ['Tired', 'Baby']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '🍽️ Ăn được', rightLabel: '🧸 Chơi được', pairs: [['Rice', 'Ball'], ['Banana', 'Doll'], ['Bread', 'Robot']] }
            ]
        }
    ]
},
/* ===================== WORLD 3 — Pre A1 Starters =====================
   Lớp 1. Mở thêm dạng `build`: bé chưa gõ được nhưng đã ghép được mảnh từ
   thành câu, đây là bước đệm trước khi phải tự viết. */
{
    id: 'world-3', order: 3,
    title: '🌱 School & Home',
    subtitle: 'Dụng cụ học tập + Quần áo + Mẫu câu This is a...',
    grade: 'Lớp 1', gradeMin: 1, gradeMax: 1,
    icon: '🌱', color: '#0f766e',
    levels: [
        {
            id: 'w3-l1', order: 1, title: 'School Supplies',
            topic: 'School', desc: 'Sách, bút, cặp — những thứ bé mang tới lớp mỗi ngày.',
            items: [
                { kind: 'card', w: { w: 'Book', ipa: '/bʊk/', vi: 'quyển sách', emoji: '📕', ex: 'This is my book.', exVi: 'Đây là sách của tớ.' } },
                { kind: 'card', w: { w: 'Pen', ipa: '/pen/', vi: 'cái bút mực', emoji: '🖊️', ex: 'I write with a pen.', exVi: 'Tớ viết bằng bút mực.' } },
                { kind: 'card', w: { w: 'Pencil', ipa: '/ˈpen.səl/', vi: 'bút chì', emoji: '✏️', ex: 'My pencil is short.', exVi: 'Bút chì của tớ ngắn.' } },
                { kind: 'card', w: { w: 'Bag', ipa: '/bæɡ/', vi: 'cái cặp', emoji: '🎒', ex: 'My bag is heavy.', exVi: 'Cặp của tớ nặng.' } },
                { kind: 'choice', prompt: '✏️ Đồ này tiếng Anh là gì?', emoji: '✏️', opts: ['Pen', 'Pencil', 'Book', 'Bag'], ans: 1, why: 'Bút chì là <b>pencil</b>; bút mực mới là pen.' },
                { kind: 'choice', prompt: '🎒 Bé đựng sách vở trong cái gì?', emoji: '🎒', opts: ['a bag', 'a book', 'a pen'], ans: 0, why: 'Đựng trong cặp — <b>a bag</b>.' },
                { kind: 'choice', prompt: 'Bé viết bằng cái gì?', emoji: '🖊️', opts: ['a book', 'a bag', 'a pen'], ans: 2, why: 'Viết bằng bút — <b>a pen</b>.' },
                { kind: 'build', target: 'This is my book .', vi: 'Đây là quyển sách của tớ.', emoji: '📕', why: 'Mẫu câu: <b>This is my + đồ vật</b>.' },
                { kind: 'match', title: 'Nối đồ dùng với tranh', leftLabel: 'Từ', rightLabel: 'Tranh', pairs: [['Book', '📕'], ['Pen', '🖊️'], ['Pencil', '✏️'], ['Bag', '🎒']] }
            ]
        },
        {
            id: 'w3-l2', order: 2, title: 'Classroom Objects',
            topic: 'School', desc: 'Đồ vật trong lớp học: bàn, ghế, bảng, cửa.',
            items: [
                { kind: 'card', w: { w: 'Desk', ipa: '/desk/', vi: 'cái bàn học', emoji: '🪑', ex: 'The book is on the desk.', exVi: 'Quyển sách ở trên bàn.' } },
                { kind: 'card', w: { w: 'Chair', ipa: '/tʃeər/', vi: 'cái ghế', emoji: '💺', ex: 'Sit on the chair.', exVi: 'Hãy ngồi lên ghế.' } },
                { kind: 'card', w: { w: 'Board', ipa: '/bɔːd/', vi: 'cái bảng', emoji: '📋', ex: 'Look at the board.', exVi: 'Hãy nhìn lên bảng.' } },
                { kind: 'card', w: { w: 'Door', ipa: '/dɔːr/', vi: 'cái cửa', emoji: '🚪', ex: 'Open the door, please.', exVi: 'Làm ơn mở cửa.' } },
                { kind: 'choice', prompt: '💺 Bé ngồi lên cái gì?', emoji: '💺', opts: ['a desk', 'a chair', 'a door'], ans: 1, why: 'Ngồi lên ghế — <b>a chair</b>.' },
                { kind: 'choice', prompt: 'Cô giáo viết lên cái gì?', emoji: '📋', opts: ['the board', 'the chair', 'the bag'], ans: 0, why: 'Viết lên bảng — <b>the board</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🚪', opts: ['Open the door.', 'Open a door the.', 'The open door.'], ans: 0, why: 'Câu ra lệnh bắt đầu bằng động từ: <b>Open</b> the door.' },
                { kind: 'build', target: 'This is a chair .', vi: 'Đây là một cái ghế.', emoji: '💺', why: '<b>This is a + danh từ số ít</b>.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '🏫 Trong lớp học', rightLabel: '🍎 Đồ ăn', pairs: [['Desk', 'Rice'], ['Board', 'Milk'], ['Chair', 'Bread']] }
            ]
        },
        {
            id: 'w3-l3', order: 3, title: 'Clothes (Shirt, Pants)',
            topic: 'Clothes', desc: 'Áo, quần, váy — những thứ bé mặc.',
            items: [
                { kind: 'card', w: { w: 'Shirt', ipa: '/ʃɜːt/', vi: 'cái áo sơ mi', emoji: '👕', ex: 'My shirt is white.', exVi: 'Áo của tớ màu trắng.' } },
                { kind: 'card', w: { w: 'Trousers', ipa: '/ˈtraʊ.zəz/', vi: 'cái quần dài', emoji: '👖', ex: 'These trousers are blue.', exVi: 'Cái quần này màu xanh.' } },
                { kind: 'card', w: { w: 'Dress', ipa: '/dres/', vi: 'cái váy liền', emoji: '👗', ex: 'She has a red dress.', exVi: 'Bạn ấy có một cái váy đỏ.' } },
                { kind: 'choice', prompt: '👕 Đồ này tiếng Anh là gì?', emoji: '👕', opts: ['Dress', 'Shirt', 'Trousers'], ans: 1, why: 'Áo sơ mi là <b>shirt</b>.' },
                { kind: 'choice', prompt: '👗 Bạn nữ mặc cái gì trong tranh?', emoji: '👗', opts: ['a dress', 'a shirt', 'a hat'], ans: 0, why: 'Váy liền là <b>a dress</b>.' },
                { kind: 'choice', prompt: 'Áo của tớ màu xanh. Nói thế nào?', emoji: '👕', opts: ['My shirt is blue.', 'My shirt blue.', 'My blue shirt is.'], ans: 0, why: 'Mẫu: <b>My + đồ vật + is + màu</b>.' },
                { kind: 'build', target: 'My dress is red .', vi: 'Váy của tớ màu đỏ.', emoji: '👗', why: 'Mẫu: My + danh từ + <b>is</b> + màu sắc.' },
                { kind: 'match', title: 'Nối quần áo với tranh', leftLabel: 'Từ', rightLabel: 'Tranh', pairs: [['Shirt', '👕'], ['Trousers', '👖'], ['Dress', '👗'], ['Hat', '🧢']] }
            ]
        },
        {
            id: 'w3-l4', order: 4, title: 'Clothes (Hat, Shoes, Socks)',
            topic: 'Clothes', desc: 'Mũ, giày, tất — và cách nói số nhiều.',
            items: [
                { kind: 'card', w: { w: 'Shoes', ipa: '/ʃuːz/', vi: 'đôi giày', emoji: '👟', ex: 'My shoes are new.', exVi: 'Giày của tớ mới.' } },
                { kind: 'card', w: { w: 'Socks', ipa: '/sɒks/', vi: 'đôi tất', emoji: '🧦', ex: 'I wear white socks.', exVi: 'Tớ đi tất trắng.' } },
                { kind: 'card', w: { w: 'Coat', ipa: '/kəʊt/', vi: 'áo khoác', emoji: '🧥', ex: 'Put on your coat.', exVi: 'Hãy mặc áo khoác vào.' } },
                { kind: 'choice', prompt: '👟 Giày luôn đi <b>một đôi</b>, nên nói thế nào?', emoji: '👟', opts: ['My shoes are new.', 'My shoes is new.', 'My shoe are new.'], ans: 0, why: 'Số nhiều <b>shoes</b> đi với <b>are</b>.' },
                { kind: 'choice', prompt: '🧦 Đồ này tiếng Anh là gì?', emoji: '🧦', opts: ['Shoes', 'Socks', 'Coat', 'Hat'], ans: 1, why: 'Tất là <b>socks</b>.' },
                { kind: 'choice', prompt: 'Trời lạnh thì bé mặc gì?', emoji: '🧥', opts: ['a coat', 'a dress', 'socks'], ans: 0, why: 'Trời lạnh mặc áo khoác — <b>a coat</b>.' },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> quần áo?', opts: ['Shirt', 'Chair', 'Socks', 'Coat'], ans: 1, why: '<b>Chair</b> là cái ghế.' },
                { kind: 'build', target: 'My shoes are new .', vi: 'Giày của tớ thì mới.', emoji: '👟', why: 'Danh từ số nhiều (shoes) đi với <b>are</b>.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '1 cái (is)', rightLabel: 'Nhiều cái (are)', pairs: [['Shirt', 'Shoes'], ['Coat', 'Socks'], ['Dress', 'Trousers']] }
            ]
        },
        {
            id: 'w3-l5', order: 5, title: '🔄 Ôn tập: Đồ dùng & Quần áo',
            topic: 'Review', desc: 'Ôn lại đồ dùng học tập, đồ vật trong lớp và quần áo.',
            items: [
                { kind: 'choice', prompt: '🎒 Cái cặp tiếng Anh là gì?', emoji: '🎒', opts: ['Book', 'Bag', 'Desk', 'Coat'], ans: 1, why: 'Cái cặp là <b>bag</b>.' },
                { kind: 'choice', prompt: '🚪 Cái cửa tiếng Anh là gì?', emoji: '🚪', opts: ['Door', 'Board', 'Chair'], ans: 0, why: 'Cái cửa là <b>door</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🧦', opts: ['My socks is white.', 'My socks are white.', 'My sock are white.'], ans: 1, why: 'Socks là số nhiều → dùng <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: This ______ a pencil.', emoji: '✏️', opts: ['are', 'am', 'is'], ans: 2, why: '<b>This is</b> — số ít luôn đi với is.' },
                { kind: 'build', target: 'This is my bag .', vi: 'Đây là cái cặp của tớ.', emoji: '🎒', why: 'This is my + đồ vật.' },
                { kind: 'build', target: 'My shirt is white .', vi: 'Áo của tớ màu trắng.', emoji: '👕', why: 'My + đồ vật + is + màu.' },
                { kind: 'match', title: 'Nối từ với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Pencil', 'bút chì'], ['Chair', 'cái ghế'], ['Dress', 'cái váy'], ['Shoes', 'đôi giày']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '🏫 Đồ dùng học tập', rightLabel: '👕 Quần áo', pairs: [['Book', 'Shirt'], ['Pencil', 'Socks'], ['Bag', 'Coat']] },
                { kind: 'choice', prompt: 'Cô giáo nói "Look at the board." Bé phải làm gì?', emoji: '📋', opts: ['Nhìn lên bảng', 'Mở cửa', 'Ngồi xuống ghế'], ans: 0, why: '<b>Look at</b> = nhìn vào; <b>the board</b> = cái bảng.' }
            ]
        },
        {
            id: 'w3-l6', order: 6, title: 'This is a... / That is a...',
            topic: 'Grammar', desc: 'Chỉ đồ vật ở gần bằng This, ở xa bằng That.',
            items: [
                { kind: 'choice', prompt: 'Đồ vật ở <b>ngay cạnh</b> bé thì dùng từ nào?', emoji: '👉', opts: ['That', 'This', 'Those'], ans: 1, why: '<b>This</b> = cái này (ở gần). That = cái kia (ở xa).' },
                { kind: 'choice', prompt: 'Đồ vật ở <b>đằng xa</b> thì dùng từ nào?', emoji: '👈', opts: ['That', 'This', 'These'], ans: 0, why: '<b>That</b> = cái kia (ở xa).' },
                { kind: 'choice', prompt: 'Điền: ______ is a book. (sách trong tay bé)', emoji: '📕', opts: ['That', 'These', 'This'], ans: 2, why: 'Sách trong tay là ở gần → <b>This</b>.' },
                { kind: 'choice', prompt: 'Điền: This ______ a pen.', emoji: '🖊️', opts: ['is', 'are', 'am'], ans: 0, why: 'This luôn đi với <b>is</b>.' },
                { kind: 'choice', prompt: 'Chọn câu <b>đúng</b>:', emoji: '🪑', opts: ['This a is desk.', 'This is a desk.', 'Is this a desk.'], ans: 1, why: 'Thứ tự đúng: <b>This is a desk.</b>' },
                { kind: 'build', target: 'This is a pencil .', vi: 'Đây là một cái bút chì.', emoji: '✏️', why: 'This is a + danh từ số ít.' },
                { kind: 'build', target: 'That is a door .', vi: 'Kia là một cái cửa.', emoji: '🚪', why: 'That is a + danh từ số ít (ở xa).' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '👉 This (gần)', rightLabel: '👈 That (xa)', pairs: [['cái bút trong tay', 'cái bảng trên tường'], ['quyển sách đang cầm', 'cái cửa cuối lớp'], ['cái cặp dưới chân', 'cái cây ngoài sân']] }
            ]
        },
        {
            id: 'w3-l7', order: 7, title: 'It is + màu sắc / kích cỡ',
            topic: 'Grammar', desc: 'Tả đồ vật: nó màu gì, to hay nhỏ.',
            items: [
                { kind: 'card', w: { w: 'Big', ipa: '/bɪɡ/', vi: 'to, lớn', emoji: '🐘', ex: 'The elephant is big.', exVi: 'Con voi thì to.' } },
                { kind: 'card', w: { w: 'Small', ipa: '/smɔːl/', vi: 'nhỏ, bé', emoji: '🐜', ex: 'The ant is small.', exVi: 'Con kiến thì nhỏ.' } },
                { kind: 'card', w: { w: 'New', ipa: '/njuː/', vi: 'mới', emoji: '✨', ex: 'My bag is new.', exVi: 'Cặp của tớ mới.' } },
                { kind: 'choice', prompt: '🐘 Con voi thì thế nào?', emoji: '🐘', opts: ['It is small.', 'It is big.', 'It is new.'], ans: 1, why: 'Voi rất to → <b>It is big.</b>' },
                { kind: 'choice', prompt: '🐜 Con kiến thì thế nào?', emoji: '🐜', opts: ['It is small.', 'It is big.', 'It is new.'], ans: 0, why: 'Kiến rất nhỏ → <b>It is small.</b>' },
                { kind: 'choice', prompt: 'Điền: The pencil ______ short.', emoji: '✏️', opts: ['are', 'is', 'am'], ans: 1, why: 'The pencil là một cái → dùng <b>is</b>.' },
                { kind: 'choice', prompt: 'Thứ tự nào <b>đúng</b>?', emoji: '👕', opts: ['a shirt white', 'a white shirt', 'white a shirt'], ans: 1, why: 'Tiếng Anh để tính từ <b>trước</b> danh từ: a <b>white</b> shirt.' },
                { kind: 'build', target: 'It is a big bag .', vi: 'Đó là một cái cặp to.', emoji: '🎒', why: 'Tính từ (big) đứng trước danh từ (bag).' },
                { kind: 'build', target: 'The book is new .', vi: 'Quyển sách thì mới.', emoji: '📕', why: 'Danh từ + is + tính từ.' }
            ]
        },
        {
            id: 'w3-l8', order: 8, title: 'My Room (Bed, Table, Window)',
            topic: 'Home', desc: 'Đồ vật trong phòng của bé.',
            items: [
                { kind: 'card', w: { w: 'Bed', ipa: '/bed/', vi: 'cái giường', emoji: '🛏️', ex: 'I sleep in my bed.', exVi: 'Tớ ngủ trên giường.' } },
                { kind: 'card', w: { w: 'Table', ipa: '/ˈteɪ.bəl/', vi: 'cái bàn', emoji: '🪵', ex: 'The cake is on the table.', exVi: 'Cái bánh ở trên bàn.' } },
                { kind: 'card', w: { w: 'Window', ipa: '/ˈwɪn.dəʊ/', vi: 'cửa sổ', emoji: '🪟', ex: 'Open the window.', exVi: 'Hãy mở cửa sổ.' } },
                { kind: 'card', w: { w: 'Lamp', ipa: '/læmp/', vi: 'cái đèn', emoji: '💡', ex: 'The lamp is on.', exVi: 'Cái đèn đang bật.' } },
                { kind: 'choice', prompt: '🛏️ Bé ngủ ở đâu?', emoji: '🛏️', opts: ['in my bed', 'on my table', 'in my bag'], ans: 0, why: 'Ngủ trên giường — <b>in my bed</b>.' },
                { kind: 'choice', prompt: '🪟 Cửa sổ tiếng Anh là gì?', emoji: '🪟', opts: ['Door', 'Window', 'Table'], ans: 1, why: 'Cửa sổ là <b>window</b>; cửa ra vào là door.' },
                { kind: 'choice', prompt: 'Từ nào <b>không</b> ở trong phòng ngủ?', opts: ['Bed', 'Lamp', 'Board', 'Window'], ans: 2, why: '<b>Board</b> (cái bảng) ở lớp học.' },
                { kind: 'build', target: 'This is my bed .', vi: 'Đây là cái giường của tớ.', emoji: '🛏️', why: 'This is my + đồ vật.' },
                { kind: 'match', title: 'Nối đồ vật với chỗ của nó', leftLabel: 'Đồ vật', rightLabel: 'Ở đâu', pairs: [['Bed', 'bedroom 🛏️'], ['Board', 'classroom 🏫'], ['Table', 'kitchen 🍽️'], ['Window', 'wall 🧱']] }
            ]
        },
        {
            id: 'w3-l9', order: 9, title: 'Short Sentences',
            topic: 'Grammar', desc: 'Ghép các mẫu câu đã học thành câu hoàn chỉnh.',
            items: [
                { kind: 'build', target: 'This is a red pen .', vi: 'Đây là một cái bút màu đỏ.', emoji: '🖊️', why: 'This is a + tính từ + danh từ.' },
                { kind: 'build', target: 'My bag is big .', vi: 'Cặp của tớ to.', emoji: '🎒', why: 'My + danh từ + is + tính từ.' },
                { kind: 'build', target: 'That is a window .', vi: 'Kia là một cái cửa sổ.', emoji: '🪟', why: 'That dùng cho vật ở xa.' },
                { kind: 'build', target: 'My shoes are small .', vi: 'Giày của tớ nhỏ.', emoji: '👟', why: 'Shoes số nhiều → are.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['This is a book.', 'My pen is blue.', 'My socks is white.'], ans: 2, why: 'Phải là "My socks <b>are</b> white" vì socks số nhiều.' },
                { kind: 'choice', prompt: 'Điền: Those ______ my shoes.', emoji: '👟', opts: ['is', 'are', 'am'], ans: 1, why: '<b>Those</b> (những cái kia) là số nhiều → are.' },
                { kind: 'choice', prompt: 'Chọn cách nói lịch sự khi nhờ mở cửa:', emoji: '🚪', opts: ['Open the door!', 'Open the door, please.', 'Door open you.'], ans: 1, why: 'Thêm <b>please</b> cho lịch sự.' },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '✅ Câu đúng', rightLabel: '❌ Câu sai', pairs: [['This is a chair.', 'This are a chair.'], ['My bag is new.', 'My bag are new.'], ['Those are books.', 'Those is books.']] }
            ]
        },
        {
            id: 'w3-l10', order: 10, title: '👑 Boss: School Star', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp: đồ dùng, quần áo, đồ trong phòng và các mẫu câu This/That.',
            items: [
                { kind: 'choice', prompt: '✏️ Bút chì tiếng Anh là gì?', emoji: '✏️', opts: ['Pen', 'Pencil', 'Book', 'Bag'], ans: 1, why: 'Bút chì là <b>pencil</b>.' },
                { kind: 'choice', prompt: '🧥 Áo khoác tiếng Anh là gì?', emoji: '🧥', opts: ['Coat', 'Shirt', 'Dress'], ans: 0, why: 'Áo khoác là <b>coat</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ is a desk. (cái bàn ngay trước mặt)', emoji: '🪑', opts: ['That', 'This', 'Those'], ans: 1, why: 'Ở gần → <b>This</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '👟', opts: ['My shoes are new.', 'My shoes is new.', 'My shoe are new.'], ans: 0, why: 'shoes số nhiều → <b>are</b>.' },
                { kind: 'choice', prompt: 'Thứ tự nào <b>đúng</b>?', emoji: '👗', opts: ['a dress red', 'a red dress', 'red a dress'], ans: 1, why: 'Tính từ đứng trước danh từ: a <b>red</b> dress.' },
                { kind: 'choice', prompt: '🪟 Từ nào ở trong phòng ngủ?', emoji: '🪟', opts: ['Board', 'Window', 'Pencil'], ans: 1, why: '<b>Window</b> — cửa sổ.' },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> quần áo?', opts: ['Socks', 'Coat', 'Lamp', 'Shirt'], ans: 2, why: '<b>Lamp</b> là cái đèn.' },
                { kind: 'build', target: 'This is my new bag .', vi: 'Đây là cái cặp mới của tớ.', emoji: '🎒', why: 'This is my + tính từ + danh từ.' },
                { kind: 'build', target: 'That is a big table .', vi: 'Kia là một cái bàn to.', emoji: '🪵', why: 'That is a + tính từ + danh từ.' },
                { kind: 'build', target: 'My pencil is short .', vi: 'Bút chì của tớ ngắn.', emoji: '✏️', why: 'My + danh từ + is + tính từ.' },
                { kind: 'match', title: 'Nối từ với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Board', 'cái bảng'], ['Window', 'cửa sổ'], ['Trousers', 'cái quần'], ['Lamp', 'cái đèn']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '🏫 Ở lớp học', rightLabel: '🏠 Ở nhà', pairs: [['Board', 'Bed'], ['Desk', 'Lamp'], ['Chair', 'Window']] }
            ]
        }
    ]
},
/* ===================== WORLD 4 — Pre A1 Starters =====================
   Lớp 1. Động vật + động từ hành động, rồi ghép vào hai cấu trúc trụ cột của
   Starters: can / can't và like / don't like. */
{
    id: 'world-4', order: 4,
    title: '🐶 Animals & Actions',
    subtitle: 'Động vật hoang dã + Động từ hành động + I can...',
    grade: 'Lớp 1', gradeMin: 1, gradeMax: 1,
    icon: '🐶', color: '#1a7f4b',
    levels: [
        {
            id: 'w4-l1', order: 1, title: 'Wild Animals (Lion, Elephant)',
            topic: 'Animals', desc: 'Thú rừng: sư tử, voi, khỉ.',
            items: [
                { kind: 'card', w: { w: 'Elephant', ipa: '/ˈel.ɪ.fənt/', vi: 'con voi', emoji: '🐘', ex: 'The elephant is very big.', exVi: 'Con voi rất to.' } },
                { kind: 'card', w: { w: 'Monkey', ipa: '/ˈmʌŋ.ki/', vi: 'con khỉ', emoji: '🐒', ex: 'The monkey can climb.', exVi: 'Con khỉ biết leo trèo.' } },
                { kind: 'card', w: { w: 'Giraffe', ipa: '/dʒɪˈrɑːf/', vi: 'hươu cao cổ', emoji: '🦒', ex: 'The giraffe has a long neck.', exVi: 'Hươu cao cổ có cái cổ dài.' } },
                { kind: 'choice', prompt: '🐘 Con này tiếng Anh là gì?', emoji: '🐘', opts: ['Monkey', 'Elephant', 'Lion', 'Giraffe'], ans: 1, why: 'Con voi là <b>elephant</b>.' },
                { kind: 'choice', prompt: '🦒 Con nào có cổ dài nhất?', emoji: '🦒', opts: ['Elephant', 'Monkey', 'Giraffe'], ans: 2, why: '<b>Giraffe</b> — hươu cao cổ.' },
                { kind: 'choice', prompt: '🐒 Con khỉ giỏi làm gì nhất?', emoji: '🐒', opts: ['climb 🧗', 'swim 🏊', 'fly 🕊️'], ans: 0, why: 'Khỉ leo trèo rất giỏi — <b>climb</b>.' },
                { kind: 'choice', prompt: 'Con nào <b>không</b> sống trong rừng?', opts: ['Lion', 'Elephant', 'Fish', 'Monkey'], ans: 2, why: '<b>Fish</b> (con cá) sống dưới nước.' },
                { kind: 'build', target: 'The elephant is big .', vi: 'Con voi thì to.', emoji: '🐘', why: 'The + con vật + is + tính từ.' },
                { kind: 'match', title: 'Nối con vật với tranh', leftLabel: 'Từ', rightLabel: 'Tranh', pairs: [['Lion', '🦁'], ['Elephant', '🐘'], ['Monkey', '🐒'], ['Giraffe', '🦒']] }
            ]
        },
        {
            id: 'w4-l2', order: 2, title: 'Wild Animals (Tiger, Bear)',
            topic: 'Animals', desc: 'Hổ, gấu, ngựa vằn và cách tả chúng.',
            items: [
                { kind: 'card', w: { w: 'Bear', ipa: '/beər/', vi: 'con gấu', emoji: '🐻', ex: 'The bear is brown.', exVi: 'Con gấu màu nâu.' } },
                { kind: 'card', w: { w: 'Zebra', ipa: '/ˈzeb.rə/', vi: 'ngựa vằn', emoji: '🦓', ex: 'The zebra is black and white.', exVi: 'Ngựa vằn màu đen trắng.' } },
                { kind: 'card', w: { w: 'Snake', ipa: '/sneɪk/', vi: 'con rắn', emoji: '🐍', ex: 'The snake is long.', exVi: 'Con rắn thì dài.' } },
                { kind: 'choice', prompt: '🦓 Con này màu gì?', emoji: '🦓', opts: ['red and blue', 'black and white', 'green and yellow'], ans: 1, why: 'Ngựa vằn màu <b>black and white</b> (đen và trắng).' },
                { kind: 'choice', prompt: '🐍 Con rắn tiếng Anh là gì?', emoji: '🐍', opts: ['Snake', 'Bear', 'Zebra', 'Tiger'], ans: 0, why: 'Con rắn là <b>snake</b>.' },
                { kind: 'choice', prompt: 'Con nào <b>không có chân</b>?', emoji: '🐍', opts: ['Bear', 'Zebra', 'Snake'], ans: 2, why: 'Con rắn — <b>snake</b> — không có chân.' },
                { kind: 'choice', prompt: 'Điền: The tiger ______ orange and black.', emoji: '🐅', opts: ['are', 'is', 'am'], ans: 1, why: 'The tiger là một con → dùng <b>is</b>.' },
                { kind: 'build', target: 'The snake is very long .', vi: 'Con rắn rất dài.', emoji: '🐍', why: '<b>very</b> đứng trước tính từ để nhấn mạnh.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '🌳 Thú rừng', rightLabel: '🏠 Thú nuôi', pairs: [['Tiger', 'Cat'], ['Zebra', 'Dog'], ['Bear', 'Rabbit']] }
            ]
        },
        {
            id: 'w4-l3', order: 3, title: 'Action Verbs (Run, Jump)',
            topic: 'Verbs', desc: 'Động từ chỉ hành động bé làm hằng ngày.',
            items: [
                { kind: 'card', w: { w: 'Run', ipa: '/rʌn/', vi: 'chạy', emoji: '🏃', ex: 'I can run fast.', exVi: 'Tớ chạy nhanh được.' } },
                { kind: 'card', w: { w: 'Jump', ipa: '/dʒʌmp/', vi: 'nhảy', emoji: '🦘', ex: 'Rabbits jump high.', exVi: 'Thỏ nhảy cao.' } },
                { kind: 'card', w: { w: 'Walk', ipa: '/wɔːk/', vi: 'đi bộ', emoji: '🚶', ex: 'I walk to school.', exVi: 'Tớ đi bộ tới trường.' } },
                { kind: 'card', w: { w: 'Sing', ipa: '/sɪŋ/', vi: 'hát', emoji: '🎤', ex: 'She can sing well.', exVi: 'Bạn ấy hát hay.' } },
                { kind: 'choice', prompt: '🏃 Hành động này tiếng Anh là gì?', emoji: '🏃', opts: ['Walk', 'Jump', 'Run', 'Sing'], ans: 2, why: 'Chạy là <b>run</b>; đi bộ mới là walk.' },
                { kind: 'choice', prompt: '🎤 Bé làm gì với bài hát?', emoji: '🎤', opts: ['sing a song', 'run a song', 'eat a song'], ans: 0, why: 'Hát một bài hát — <b>sing a song</b>.' },
                { kind: 'choice', prompt: 'Đi <b>chậm</b> bằng hai chân gọi là gì?', emoji: '🚶', opts: ['run', 'walk', 'jump'], ans: 1, why: 'Đi bộ là <b>walk</b>.' },
                { kind: 'build', target: 'I can run fast .', vi: 'Tớ chạy nhanh được.', emoji: '🏃', why: 'I can + động từ nguyên mẫu + trạng từ.' },
                { kind: 'match', title: 'Nối hành động với tranh', leftLabel: 'Động từ', rightLabel: 'Tranh', pairs: [['Run', '🏃'], ['Jump', '🦘'], ['Walk', '🚶'], ['Sing', '🎤']] }
            ]
        },
        {
            id: 'w4-l4', order: 4, title: 'Action Verbs (Fly, Swim, Climb)',
            topic: 'Verbs', desc: 'Bay, bơi, leo, vẽ — thêm động từ mới.',
            items: [
                { kind: 'card', w: { w: 'Fly', ipa: '/flaɪ/', vi: 'bay', emoji: '🕊️', ex: 'Birds can fly.', exVi: 'Chim biết bay.' } },
                { kind: 'card', w: { w: 'Swim', ipa: '/swɪm/', vi: 'bơi', emoji: '🏊', ex: 'I can swim in the sea.', exVi: 'Tớ bơi được ở biển.' } },
                { kind: 'card', w: { w: 'Climb', ipa: '/klaɪm/', vi: 'leo, trèo', emoji: '🧗', ex: 'Monkeys climb trees.', exVi: 'Khỉ trèo cây.' } },
                { kind: 'card', w: { w: 'Draw', ipa: '/drɔː/', vi: 'vẽ', emoji: '🎨', ex: 'I draw a cat.', exVi: 'Tớ vẽ một con mèo.' } },
                { kind: 'choice', prompt: '🐟 Con cá làm gì được?', emoji: '🐟', opts: ['fly', 'swim', 'climb'], ans: 1, why: 'Cá biết bơi — <b>swim</b>.' },
                { kind: 'choice', prompt: '🕊️ Con chim làm gì được?', emoji: '🕊️', opts: ['fly', 'swim', 'draw'], ans: 0, why: 'Chim biết bay — <b>fly</b>.' },
                { kind: 'choice', prompt: '🎨 Bé dùng bút chì để làm gì?', emoji: '🎨', opts: ['swim', 'climb', 'draw'], ans: 2, why: 'Dùng bút chì để vẽ — <b>draw</b>.' },
                { kind: 'build', target: 'Birds can fly high .', vi: 'Chim bay cao được.', emoji: '🕊️', why: 'Danh từ số nhiều + can + động từ nguyên mẫu.' },
                { kind: 'match', title: 'Nối con vật với việc nó làm được', leftLabel: 'Con vật', rightLabel: 'Làm được gì', pairs: [['Bird', 'fly'], ['Fish', 'swim'], ['Monkey', 'climb'], ['Rabbit', 'jump']] }
            ]
        },
        {
            id: 'w4-l5', order: 5, title: '🔄 Ôn tập: Con vật & Hành động',
            topic: 'Review', desc: 'Ôn lại thú rừng và các động từ hành động.',
            items: [
                { kind: 'choice', prompt: '🐻 Con này tiếng Anh là gì?', emoji: '🐻', opts: ['Bear', 'Tiger', 'Zebra', 'Lion'], ans: 0, why: 'Con gấu là <b>bear</b>.' },
                { kind: 'choice', prompt: '🧗 Hành động này tiếng Anh là gì?', emoji: '🧗', opts: ['Swim', 'Climb', 'Jump'], ans: 1, why: 'Leo trèo là <b>climb</b>.' },
                { kind: 'choice', prompt: 'Con nào biết bơi <b>và</b> sống dưới nước?', emoji: '🐟', opts: ['Bird', 'Fish', 'Monkey'], ans: 1, why: '<b>Fish</b> sống dưới nước và biết bơi.' },
                { kind: 'choice', prompt: 'Điền: Monkeys ______ climb trees.', emoji: '🐒', opts: ['can', 'is', 'are'], ans: 0, why: 'Nói về khả năng thì dùng <b>can</b>.' },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> động từ?', opts: ['Run', 'Jump', 'Zebra', 'Sing'], ans: 2, why: '<b>Zebra</b> là con ngựa vằn — danh từ.' },
                { kind: 'build', target: 'I can swim very well .', vi: 'Tớ bơi rất giỏi.', emoji: '🏊', why: 'I can + động từ + very well.' },
                { kind: 'match', title: 'Nối động từ với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['Fly', 'bay'], ['Draw', 'vẽ'], ['Walk', 'đi bộ'], ['Sing', 'hát']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '🐾 Con vật', rightLabel: '🏃 Hành động', pairs: [['Bear', 'Run'], ['Snake', 'Draw'], ['Giraffe', 'Climb']] },
                { kind: 'choice', prompt: '🦒 Hươu cao cổ tiếng Anh là gì?', emoji: '🦒', opts: ['Zebra', 'Giraffe', 'Elephant'], ans: 1, why: 'Hươu cao cổ là <b>giraffe</b>.' }
            ]
        },
        {
            id: 'w4-l6', order: 6, title: 'I can + động từ',
            topic: 'Can', desc: 'Nói về việc bé làm được bằng cấu trúc can.',
            items: [
                { kind: 'choice', prompt: 'Sau <b>can</b> thì động từ ở dạng nào?', emoji: '💪', opts: ['thêm -s (runs)', 'nguyên mẫu (run)', 'thêm -ing (running)'], ans: 1, why: 'Sau can luôn là động từ <b>nguyên mẫu</b>: I can run.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🏊', opts: ['I can swims.', 'I can swim.', 'I can swimming.'], ans: 1, why: 'can + <b>swim</b> (nguyên mẫu).' },
                { kind: 'choice', prompt: 'Điền: She ______ sing beautifully.', emoji: '🎤', opts: ['cans', 'can', 'is can'], ans: 1, why: '<b>Can</b> không bao giờ thêm -s, dù chủ ngữ là she.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🧗', opts: ['He can climb.', 'He cans climb.', 'He can climbs.'], ans: 0, why: 'He <b>can climb</b> — cả can lẫn climb đều giữ nguyên.' },
                { kind: 'build', target: 'I can draw a cat .', vi: 'Tớ vẽ được một con mèo.', emoji: '🎨', why: 'I can + động từ + tân ngữ.' },
                { kind: 'build', target: 'My sister can sing .', vi: 'Chị tớ hát được.', emoji: '🎤', why: 'Chủ ngữ + can + động từ nguyên mẫu.' },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '✅ Đúng', rightLabel: '❌ Sai', pairs: [['I can jump.', 'I can jumps.'], ['She can fly.', 'She cans fly.'], ['We can swim.', 'We can swimming.']] },
                { kind: 'choice', prompt: 'Bé muốn khoe chạy nhanh. Nói thế nào?', emoji: '🏃', opts: ['I can run fast.', 'I run can fast.', 'I am can run.'], ans: 0, why: 'Thứ tự: I + can + động từ + trạng từ.' }
            ]
        },
        {
            id: 'w4-l7', order: 7, title: "I can't + động từ",
            topic: 'Can', desc: 'Nói về việc bé chưa làm được: cannot / can\'t.',
            items: [
                { kind: 'choice', prompt: 'Dạng phủ định của <b>can</b> là gì?', emoji: '🚫', opts: ['can not is', "can't (cannot)", 'no can'], ans: 1, why: 'can + not = cannot, viết tắt là <b>can\'t</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🕊️', opts: ["I can't fly.", "I can't flying.", "I don't can fly."], ans: 0, why: "can't + động từ nguyên mẫu: <b>can't fly</b>." },
                { kind: 'choice', prompt: '🐟 Con cá <b>không</b> làm được gì?', emoji: '🐟', opts: ["It can't swim.", "It can't fly.", "It can't eat."], ans: 1, why: 'Cá bơi được nhưng <b>không bay được</b>.' },
                { kind: 'choice', prompt: 'Điền: Elephants ______ climb trees.', emoji: '🐘', opts: ["can't", "aren't", "don't"], ans: 0, why: 'Voi không trèo cây được → <b>can\'t</b> climb.' },
                { kind: 'build', target: "I can't swim yet .", vi: 'Tớ chưa biết bơi.', emoji: '🏊', why: "can't + động từ; <b>yet</b> = chưa (nhưng rồi sẽ được).", },
                { kind: 'build', target: "A snake can't jump .", vi: 'Con rắn không nhảy được.', emoji: '🐍', why: "Chủ ngữ + can't + động từ nguyên mẫu." },
                { kind: 'match', title: 'Nối con vật với việc nó KHÔNG làm được', leftLabel: 'Con vật', rightLabel: 'Không làm được', pairs: [['Fish', "can't fly"], ['Elephant', "can't climb"], ['Snake', "can't walk"], ['Bird', "can't swim fast"]] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '✅ Bé làm được', rightLabel: "🚫 Bé chưa làm được", pairs: [['I can walk.', "I can't drive a car."], ['I can sing.', "I can't fly."], ['I can draw.', "I can't cook."]] }
            ]
        },
        {
            id: 'w4-l8', order: 8, title: 'I like + danh từ',
            topic: 'Like', desc: 'Nói về thứ bé thích.',
            items: [
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🍎', opts: ['I like apples.', 'I likes apples.', 'I am like apples.'], ans: 0, why: 'Chủ ngữ <b>I</b> thì động từ giữ nguyên: I <b>like</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ cats.', emoji: '🐱', opts: ['like', 'likes', 'liking'], ans: 1, why: 'Chủ ngữ <b>she</b> thì động từ thêm -s: <b>likes</b>.' },
                { kind: 'choice', prompt: 'Nói chung chung "tớ thích chuối" thì dùng dạng nào?', emoji: '🍌', opts: ['I like banana.', 'I like bananas.', 'I like a bananas.'], ans: 1, why: 'Thích cả loại nói chung → dùng <b>số nhiều</b>: bananas.' },
                { kind: 'choice', prompt: 'Điền: My brother ______ football.', emoji: '⚽', opts: ['likes', 'like', 'liking'], ans: 0, why: 'My brother = he → thêm -s: <b>likes</b>.' },
                { kind: 'build', target: 'I like ice cream .', vi: 'Tớ thích kem.', emoji: '🍦', why: 'I like + danh từ.' },
                { kind: 'build', target: 'She likes dogs and cats .', vi: 'Bạn ấy thích chó và mèo.', emoji: '🐶', why: 'She likes + danh từ số nhiều; <b>and</b> nối hai thứ.' },
                { kind: 'match', title: 'Nối chủ ngữ với động từ đúng', leftLabel: 'Chủ ngữ', rightLabel: 'Động từ', pairs: [['I', 'like'], ['You', 'like'], ['He', 'likes'], ['She', 'likes']] },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['We like books.', 'He likes books.', 'She like books.'], ans: 2, why: 'Phải là "She <b>likes</b> books".' }
            ]
        },
        {
            id: 'w4-l9', order: 9, title: "I don't like + danh từ",
            topic: 'Like', desc: 'Nói về thứ bé không thích.',
            items: [
                { kind: 'choice', prompt: 'Phủ định của "I like" là gì?', emoji: '🚫', opts: ["I not like", "I don't like", "I doesn't like"], ans: 1, why: 'Chủ ngữ I dùng <b>don\'t</b>: I don\'t like.' },
                { kind: 'choice', prompt: 'Điền: He ______ like carrots.', emoji: '🥕', opts: ["don't", "doesn't", "not"], ans: 1, why: 'Chủ ngữ <b>he</b> dùng <b>doesn\'t</b>.' },
                { kind: 'choice', prompt: 'Sau <b>doesn\'t</b> thì động từ thế nào?', emoji: '💡', opts: ['giữ nguyên (like)', 'thêm -s (likes)', 'thêm -ing (liking)'], ans: 0, why: "Đã có doesn't gánh phần -s rồi nên động từ về <b>nguyên mẫu</b>: doesn't like." },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🐍', opts: ["She doesn't likes snakes.", "She doesn't like snakes.", "She don't like snakes."], ans: 1, why: "she → doesn't, rồi động từ nguyên mẫu <b>like</b>." },
                { kind: 'build', target: "I don't like snakes .", vi: 'Tớ không thích rắn.', emoji: '🐍', why: "I don't like + danh từ số nhiều." },
                { kind: 'build', target: "He doesn't like milk .", vi: 'Bạn ấy không thích sữa.', emoji: '🥛', why: "He doesn't like + danh từ." },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: "don't", rightLabel: "doesn't", pairs: [['I', 'He'], ['You', 'She'], ['We', 'It']] },
                { kind: 'choice', prompt: 'Bé không thích cà rốt. Nói thế nào?', emoji: '🥕', opts: ["I don't like carrots.", "I doesn't like carrots.", "I not like carrots."], ans: 0, why: "Chủ ngữ I → <b>don't</b>." }
            ]
        },
        {
            id: 'w4-l10', order: 10, title: '👑 Boss: Jungle Hero', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp: động vật, động từ, can/can\'t và like/don\'t like.',
            items: [
                { kind: 'choice', prompt: '🦓 Con này tiếng Anh là gì?', emoji: '🦓', opts: ['Bear', 'Zebra', 'Giraffe', 'Snake'], ans: 1, why: 'Ngựa vằn là <b>zebra</b>.' },
                { kind: 'choice', prompt: '🧗 Con khỉ làm gì giỏi?', emoji: '🐒', opts: ['It can climb.', 'It can fly.', 'It can swim fast.'], ans: 0, why: 'Khỉ trèo giỏi — <b>climb</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🏊', opts: ['I can swims.', 'I can swim.', 'I can swimming.'], ans: 1, why: 'Sau can là động từ nguyên mẫu.' },
                { kind: 'choice', prompt: 'Điền: A fish ______ fly.', emoji: '🐟', opts: ["can't", "doesn't", "isn't"], ans: 0, why: 'Không có khả năng → <b>can\'t</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ cats very much.', emoji: '🐱', opts: ['like', 'likes', 'liking'], ans: 1, why: 'she → <b>likes</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ["He doesn't like milk.", "I don't like milk.", "She don't like milk."], ans: 2, why: "she phải dùng <b>doesn't</b>." },
                { kind: 'choice', prompt: 'Từ nào <b>không phải</b> động từ?', opts: ['Climb', 'Draw', 'Bear', 'Sing'], ans: 2, why: '<b>Bear</b> là con gấu.' },
                { kind: 'build', target: 'I can draw an elephant .', vi: 'Tớ vẽ được một con voi.', emoji: '🐘', why: 'Trước nguyên âm (e) dùng <b>an</b> chứ không phải a.' },
                { kind: 'build', target: "My brother can't swim .", vi: 'Anh tớ không biết bơi.', emoji: '🏊', why: "Chủ ngữ + can't + động từ nguyên mẫu." },
                { kind: 'build', target: 'She likes monkeys and birds .', vi: 'Bạn ấy thích khỉ và chim.', emoji: '🐒', why: 'She likes + danh từ số nhiều.' },
                { kind: 'match', title: 'Nối con vật với việc nó làm được', leftLabel: 'Con vật', rightLabel: 'Làm được gì', pairs: [['Bird', 'can fly'], ['Fish', 'can swim'], ['Monkey', 'can climb'], ['Rabbit', 'can jump']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '✅ can (làm được)', rightLabel: "🚫 can't (không làm được)", pairs: [['A bird can fly.', "An elephant can't fly."], ['A fish can swim.', "A snake can't walk."], ['A monkey can climb.', "A fish can't climb."]] }
            ]
        }
    ]
},
/* ===================== WORLD 5 — Pre A1 Starters =====================
   Lớp 2. Mở thêm dạng `fill`: bé bắt đầu tự gõ một từ thay vì chỉ chọn.
   Ô gợi ý bên dưới vẫn cho bấm chèn nhanh nên không quá sức. */
{
    id: 'world-5', order: 5,
    title: '🌱 English Starter',
    subtitle: 'Pronouns + To Be + Kiến thức nền tảng',
    grade: 'Lớp 2', gradeMin: 2, gradeMax: 2,
    icon: '🌱', color: '#2f5bd0',
    levels: [
        {
            id: 'w5-l1', order: 1, title: 'I / You / He / She / It',
            topic: 'Pronouns', desc: 'Năm đại từ nhân xưng cơ bản nhất.',
            items: [
                { kind: 'choice', prompt: 'Đại từ nào nghĩa là <b>tớ / tôi</b>?', emoji: '🙋', opts: ['You', 'I', 'He', 'She'], ans: 1, why: '<b>I</b> = tôi. Luôn viết hoa dù đứng giữa câu.' },
                { kind: 'choice', prompt: 'Đại từ nào dùng cho <b>bạn nam</b>?', emoji: '👦', opts: ['She', 'It', 'He', 'You'], ans: 2, why: '<b>He</b> dùng cho nam; she dùng cho nữ.' },
                { kind: 'choice', prompt: 'Đại từ nào dùng cho <b>bạn nữ</b>?', emoji: '👧', opts: ['She', 'He', 'It'], ans: 0, why: '<b>She</b> dùng cho nữ.' },
                { kind: 'choice', prompt: 'Đại từ nào dùng cho <b>con vật hoặc đồ vật</b>?', emoji: '🪑', opts: ['He', 'She', 'It'], ans: 2, why: '<b>It</b> dùng cho đồ vật và con vật.' },
                { kind: 'choice', prompt: 'Thay "Nam" bằng đại từ nào?', emoji: '👦', opts: ['He', 'She', 'It', 'They'], ans: 0, why: 'Nam là bạn nam → <b>He</b>.' },
                { kind: 'choice', prompt: 'Thay "the cat" bằng đại từ nào?', emoji: '🐱', opts: ['He', 'It', 'She'], ans: 1, why: 'Con vật → <b>It</b>.' },
                { kind: 'match', title: 'Nối đại từ với nghĩa tiếng Việt', leftLabel: 'Đại từ', rightLabel: 'Nghĩa', pairs: [['I', 'tôi'], ['You', 'bạn'], ['He', 'anh ấy'], ['She', 'cô ấy']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '👦 He', rightLabel: '👧 She', pairs: [['my father', 'my mother'], ['my brother', 'my sister'], ['Nam', 'Lan']] }
            ]
        },
        {
            id: 'w5-l2', order: 2, title: 'We / You / They',
            topic: 'Pronouns', desc: 'Đại từ số nhiều: chúng tớ, các bạn, họ.',
            items: [
                { kind: 'choice', prompt: 'Đại từ nào nghĩa là <b>chúng tớ</b>?', emoji: '👨‍👩‍👧', opts: ['They', 'We', 'You'], ans: 1, why: '<b>We</b> = chúng tôi, chúng tớ.' },
                { kind: 'choice', prompt: 'Đại từ nào nghĩa là <b>họ, chúng nó</b>?', emoji: '👥', opts: ['They', 'We', 'It'], ans: 0, why: '<b>They</b> = họ (nhiều người hoặc nhiều vật).' },
                { kind: 'choice', prompt: 'Thay "Nam and Lan" bằng đại từ nào?', emoji: '👫', opts: ['He', 'She', 'They'], ans: 2, why: 'Hai người trở lên → <b>They</b>.' },
                { kind: 'choice', prompt: 'Thay "my sister and I" bằng đại từ nào?', emoji: '👭', opts: ['We', 'They', 'You'], ans: 0, why: 'Có "I" ở trong → <b>We</b> (chúng tớ).' },
                { kind: 'choice', prompt: 'Thay "the books" bằng đại từ nào?', emoji: '📚', opts: ['It', 'They', 'He'], ans: 1, why: 'Nhiều đồ vật → <b>They</b>.' },
                { kind: 'fill', prompt: 'Nam and Ba are my friends. ______ are in my class.', hint: 'Thay hai bạn ấy bằng một đại từ rồi gõ vào ô 👇', emoji: '👫', answers: ['They', 'they'], bank: ['They', 'We', 'He', 'It'] },
                { kind: 'match', title: 'Nối nhóm người với đại từ đúng', leftLabel: 'Nhóm', rightLabel: 'Đại từ', pairs: [['Nam and Lan', 'They'], ['my mother and I', 'We'], ['the dog', 'It'], ['my father', 'He']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '1 người / 1 vật', rightLabel: 'Nhiều người / nhiều vật', pairs: [['He', 'They'], ['She', 'We'], ['It', 'You (các bạn)']] }
            ]
        },
        {
            id: 'w5-l3', order: 3, title: 'I am ...',
            topic: 'To Be', desc: 'Động từ to be đi với chủ ngữ I.',
            items: [
                { kind: 'choice', prompt: 'Chủ ngữ <b>I</b> đi với dạng nào của to be?', emoji: '🙋', opts: ['is', 'am', 'are'], ans: 1, why: '<b>I am</b> — chỉ mình I dùng am.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🎒', opts: ['I am a student.', 'I is a student.', 'I are a student.'], ans: 0, why: 'I luôn đi với <b>am</b>.' },
                { kind: 'choice', prompt: 'Viết tắt của <b>I am</b> là gì?', emoji: '✂️', opts: ["I'm", "Im", "I're"], ans: 0, why: "I am = <b>I'm</b> (có dấu nháy thay chữ a)." },
                { kind: 'choice', prompt: 'Điền: I ______ eight years old.', emoji: '8️⃣', opts: ['is', 'are', 'am'], ans: 2, why: 'I + <b>am</b>.' },
                { kind: 'fill', prompt: 'I ______ happy today.', hint: 'Điền dạng đúng của to be (am / is / are) 👇', emoji: '😀', answers: ['am', "'m"], bank: ['am', 'is', 'are'] },
                { kind: 'fill', prompt: 'I ______ from Vietnam.', hint: 'Điền dạng đúng của to be 👇', emoji: '🇻🇳', answers: ['am'], bank: ['am', 'is', 'are'] },
                { kind: 'build', target: 'I am a good student .', vi: 'Tớ là một học sinh ngoan.', emoji: '🎒', why: 'I am + a + tính từ + danh từ.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ["I'm nine.", 'I am tired.', 'I are happy.'], ans: 2, why: 'Phải là "I <b>am</b> happy".' }
            ]
        },
        {
            id: 'w5-l4', order: 4, title: 'He / She / It is ...',
            topic: 'To Be', desc: 'To be với chủ ngữ số ít ngôi thứ ba.',
            items: [
                { kind: 'choice', prompt: '<b>He, She, It</b> đi với dạng nào của to be?', emoji: '👦', opts: ['am', 'is', 'are'], ans: 1, why: 'Ba đại từ số ít này đều dùng <b>is</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ my teacher.', emoji: '👩‍🏫', opts: ['am', 'are', 'is'], ans: 2, why: 'She + <b>is</b>.' },
                { kind: 'choice', prompt: 'Điền: The cat ______ black.', emoji: '🐈‍⬛', opts: ['is', 'are', 'am'], ans: 0, why: 'The cat = it → <b>is</b>.' },
                { kind: 'choice', prompt: 'Viết tắt của <b>she is</b> là gì?', emoji: '✂️', opts: ["she's", 'shes', "she're"], ans: 0, why: "she is = <b>she's</b>." },
                { kind: 'fill', prompt: 'He ______ my brother.', hint: 'Điền dạng đúng của to be 👇', emoji: '👦', answers: ['is', "'s"], bank: ['am', 'is', 'are'] },
                { kind: 'fill', prompt: 'My school ______ very big.', hint: 'Điền dạng đúng của to be 👇', emoji: '🏫', answers: ['is'], bank: ['am', 'is', 'are'] },
                { kind: 'build', target: 'She is a good teacher .', vi: 'Cô ấy là một giáo viên giỏi.', emoji: '👩‍🏫', why: 'She is + a + tính từ + danh từ.' },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'đi với am', rightLabel: 'đi với is', pairs: [['I', 'He'], ['I (chỉ mình I)', 'She'], ['I', 'The dog']] }
            ]
        },
        {
            id: 'w5-l5', order: 5, title: '🔄 Ôn tập: Đại từ & am/is',
            topic: 'Review', desc: 'Ôn lại đại từ nhân xưng và hai dạng am, is.',
            items: [
                { kind: 'choice', prompt: 'Thay "my mother" bằng đại từ nào?', emoji: '👩', opts: ['He', 'She', 'It', 'They'], ans: 1, why: 'Mẹ là nữ → <b>She</b>.' },
                { kind: 'choice', prompt: 'Thay "the books" bằng đại từ nào?', emoji: '📚', opts: ['They', 'It', 'He'], ans: 0, why: 'Nhiều vật → <b>They</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ in Grade 2.', emoji: '2️⃣', opts: ['is', 'am', 'are'], ans: 1, why: 'I + <b>am</b>.' },
                { kind: 'choice', prompt: 'Điền: It ______ a nice day.', emoji: '☀️', opts: ['is', 'am', 'are'], ans: 0, why: 'It + <b>is</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['She is kind.', 'I am kind.', 'He am kind.'], ans: 2, why: 'Phải là "He <b>is</b> kind".' },
                { kind: 'fill', prompt: 'My sister ______ six years old.', hint: 'Điền dạng đúng của to be 👇', emoji: '👧', answers: ['is'], bank: ['am', 'is', 'are'] },
                { kind: 'build', target: 'He is my best friend .', vi: 'Cậu ấy là bạn thân nhất của tớ.', emoji: '🤝', why: 'He is + my + tính từ + danh từ.' },
                { kind: 'match', title: 'Nối chủ ngữ với to be đúng', leftLabel: 'Chủ ngữ', rightLabel: 'To be', pairs: [['I', 'am'], ['He', 'is'], ['She', 'is'], ['It', 'is']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '👤 Số ít', rightLabel: '👥 Số nhiều', pairs: [['He', 'They'], ['She', 'We'], ['The cat', 'The cats']] }
            ]
        },
        {
            id: 'w5-l6', order: 6, title: 'You / We / They are ...',
            topic: 'To Be', desc: 'To be với chủ ngữ số nhiều và với you.',
            items: [
                { kind: 'choice', prompt: '<b>You, We, They</b> đi với dạng nào của to be?', emoji: '👥', opts: ['am', 'is', 'are'], ans: 2, why: 'Cả ba đều dùng <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: We ______ best friends.', emoji: '🤝', opts: ['is', 'are', 'am'], ans: 1, why: 'We + <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: They ______ in the garden.', emoji: '🌳', opts: ['are', 'is', 'am'], ans: 0, why: 'They + <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: The cats ______ hungry.', emoji: '🐱', opts: ['is', 'are', 'am'], ans: 1, why: 'The cats số nhiều → <b>are</b>.' },
                { kind: 'choice', prompt: 'Viết tắt của <b>they are</b> là gì?', emoji: '✂️', opts: ["they're", 'theyre', "they's"], ans: 0, why: "they are = <b>they're</b>." },
                { kind: 'fill', prompt: 'You ______ very kind.', hint: 'Điền dạng đúng của to be 👇', emoji: '😊', answers: ['are', "'re"], bank: ['am', 'is', 'are'] },
                { kind: 'fill', prompt: 'My friends ______ at school.', hint: 'Điền dạng đúng của to be 👇', emoji: '🏫', answers: ['are'], bank: ['am', 'is', 'are'] },
                { kind: 'build', target: 'We are in the same class .', vi: 'Chúng tớ học cùng một lớp.', emoji: '🏫', why: 'We are + cụm giới từ.' },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'đi với is', rightLabel: 'đi với are', pairs: [['He', 'We'], ['The dog', 'They'], ['My sister', 'My friends']] }
            ]
        },
        {
            id: 'w5-l7', order: 7, title: 'To Be phủ định (am not / isn\'t / aren\'t)',
            topic: 'To Be', desc: 'Nói điều gì đó KHÔNG đúng.',
            items: [
                { kind: 'choice', prompt: 'Phủ định thì thêm từ nào sau to be?', emoji: '🚫', opts: ['no', 'not', "don't"], ans: 1, why: 'to be + <b>not</b>: is not, are not, am not.' },
                { kind: 'choice', prompt: 'Viết tắt của <b>is not</b> là gì?', emoji: '✂️', opts: ["isn't", "is'nt", "in't"], ans: 0, why: "is not = <b>isn't</b>." },
                { kind: 'choice', prompt: 'Điền: He ______ sad. (bạn ấy không buồn)', emoji: '😀', opts: ["aren't", "isn't", "am not"], ans: 1, why: "He → <b>isn't</b>." },
                { kind: 'choice', prompt: 'Điền: They ______ at home.', emoji: '🏠', opts: ["aren't", "isn't", "am not"], ans: 0, why: "They → <b>aren't</b>." },
                { kind: 'choice', prompt: '<b>I am not</b> viết tắt thế nào?', emoji: '✂️', opts: ["I amn't", "I'm not", "I aren't"], ans: 1, why: "Tiếng Anh không có \"amn't\"; ta viết <b>I'm not</b>." },
                { kind: 'fill', prompt: "The book ______ new. (nó cũ rồi)", hint: "Điền dạng phủ định của to be (isn't / aren't) 👇", emoji: '📕', answers: ["isn't", 'is not'], bank: ["isn't", "aren't", "am not"] },
                { kind: 'build', target: "I am not hungry now .", vi: 'Bây giờ tớ không đói.', emoji: '🍽️', why: 'I am + not + tính từ.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: "isn't", rightLabel: "aren't", pairs: [['He', 'They'], ['She', 'We'], ['The cat', 'The cats']] }
            ]
        },
        {
            id: 'w5-l8', order: 8, title: 'Câu hỏi Am / Is / Are ...?',
            topic: 'Questions', desc: 'Đảo to be lên đầu để đặt câu hỏi.',
            items: [
                { kind: 'choice', prompt: 'Muốn hỏi thì ta làm gì với to be?', emoji: '❓', opts: ['bỏ đi', 'đưa lên đầu câu', 'thêm -s'], ans: 1, why: 'She is happy → <b>Is</b> she happy?' },
                { kind: 'choice', prompt: 'Điền: ______ she your sister?', emoji: '👧', opts: ['Am', 'Are', 'Is'], ans: 2, why: 'she → <b>Is</b> she ...?' },
                { kind: 'choice', prompt: 'Điền: ______ you ready?', emoji: '🙋', opts: ['Are', 'Is', 'Am'], ans: 0, why: 'you → <b>Are</b> you ...?' },
                { kind: 'choice', prompt: 'Trả lời ngắn cho "Is he your friend?" khi ĐÚNG:', emoji: '✅', opts: ['Yes, he is.', 'Yes, he does.', 'Yes, he are.'], ans: 0, why: 'Hỏi bằng to be thì trả lời bằng to be: <b>Yes, he is.</b>' },
                { kind: 'choice', prompt: 'Trả lời ngắn khi SAI:', emoji: '❌', opts: ["No, he isn't.", "No, he doesn't.", 'No, he not.'], ans: 0, why: "<b>No, he isn't.</b>" },
                { kind: 'fill', prompt: '______ they in the park?', hint: 'Điền to be đúng để mở đầu câu hỏi 👇', emoji: '🌳', answers: ['Are', 'are'], bank: ['Am', 'Is', 'Are'] },
                { kind: 'build', target: 'Is she your teacher ?', vi: 'Cô ấy có phải cô giáo của bạn không?', emoji: '👩‍🏫', why: 'Câu hỏi: to be + chủ ngữ + phần còn lại + dấu ?' },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '💬 Câu kể', rightLabel: '❓ Câu hỏi', pairs: [['She is happy.', 'Is she happy?'], ['They are here.', 'Are they here?'], ['He is tall.', 'Is he tall?']] }
            ]
        },
        {
            id: 'w5-l9', order: 9, title: 'Tuổi tác & Giới thiệu bản thân',
            topic: 'Numbers', desc: 'Nói tên, tuổi và lớp của mình.',
            items: [
                { kind: 'choice', prompt: 'Hỏi tuổi thì nói thế nào?', emoji: '🎂', opts: ['How old are you?', 'How many are you?', 'What old are you?'], ans: 0, why: '<b>How old are you?</b> = Bạn bao nhiêu tuổi?' },
                { kind: 'choice', prompt: 'Trả lời "How old are you?" thế nào?', emoji: '7️⃣', opts: ['I am fine.', 'I am seven years old.', 'I have seven.'], ans: 1, why: '<b>I am ... years old.</b>' },
                { kind: 'choice', prompt: 'Hỏi tên thì nói thế nào?', emoji: '🙋', opts: ['Who are you name?', 'What is your name?', 'How is your name?'], ans: 1, why: '<b>What is your name?</b>' },
                { kind: 'choice', prompt: 'Điền: My name ______ Lan.', emoji: '👧', opts: ['is', 'are', 'am'], ans: 0, why: 'My name = it → <b>is</b>.' },
                { kind: 'fill', prompt: 'I ______ nine years old.', hint: 'Điền dạng đúng của to be 👇', emoji: '9️⃣', answers: ['am'], bank: ['am', 'is', 'are'] },
                { kind: 'build', target: 'I am in Grade 2 .', vi: 'Tớ học lớp 2.', emoji: '2️⃣', why: 'I am in Grade + số.' },
                { kind: 'build', target: 'My name is Nam .', vi: 'Tớ tên là Nam.', emoji: '👦', why: 'My name is + tên.' },
                { kind: 'match', title: 'Nối câu hỏi với câu trả lời', leftLabel: 'Câu hỏi', rightLabel: 'Trả lời', pairs: [['What is your name?', 'My name is Nam.'], ['How old are you?', 'I am eight.'], ['Are you a student?', 'Yes, I am.'], ['How are you?', 'I am fine.']] }
            ]
        },
        {
            id: 'w5-l10', order: 10, title: '👑 Boss: To Be Master', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp: đại từ, am/is/are, phủ định và câu hỏi.',
            items: [
                { kind: 'choice', prompt: 'Thay "Nam and I" bằng đại từ nào?', emoji: '👫', opts: ['They', 'We', 'You'], ans: 1, why: 'Có "I" ở trong → <b>We</b>.' },
                { kind: 'choice', prompt: 'Điền: My brother ______ ten.', emoji: '👦', opts: ['am', 'is', 'are'], ans: 1, why: 'My brother = he → <b>is</b>.' },
                { kind: 'choice', prompt: 'Điền: The books ______ on the desk.', emoji: '📚', opts: ['is', 'are', 'am'], ans: 1, why: 'The books số nhiều → <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ tired. (tớ không mệt)', emoji: '😀', opts: ["am not", "isn't", "aren't"], ans: 0, why: 'I → <b>am not</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ your father a doctor?', emoji: '👨‍⚕️', opts: ['Is', 'Are', 'Am'], ans: 0, why: 'your father = he → <b>Is</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['We are friends.', 'She is nice.', 'They is here.'], ans: 2, why: 'They số nhiều → phải là "They <b>are</b> here".' },
                { kind: 'choice', prompt: 'Trả lời ngắn cho "Are you eight?" khi ĐÚNG:', emoji: '✅', opts: ['Yes, I am.', 'Yes, I do.', 'Yes, I is.'], ans: 0, why: '<b>Yes, I am.</b>' },
                { kind: 'fill', prompt: 'She ______ my best friend.', hint: 'Điền dạng đúng của to be 👇', emoji: '🤝', answers: ['is', "'s"], bank: ['am', 'is', 'are'] },
                { kind: 'fill', prompt: "We ______ late. (chúng tớ không muộn)", hint: "Điền dạng phủ định của to be 👇", emoji: '⏰', answers: ["aren't", 'are not'], bank: ["isn't", "aren't", "am not"] },
                { kind: 'build', target: 'I am a student in Grade 2 .', vi: 'Tớ là học sinh lớp 2.', emoji: '🎒', why: 'I am + a + danh từ + cụm giới từ.' },
                { kind: 'build', target: 'Are they your friends ?', vi: 'Họ có phải bạn của bạn không?', emoji: '👥', why: 'Câu hỏi: Are + chủ ngữ số nhiều + ...?' },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'đi với is', rightLabel: 'đi với are', pairs: [['My mother', 'My parents'], ['The cat', 'The cats'], ['He', 'They']] }
            ]
        }
    ]
},
/* ===================== WORLD 6 — Pre A1 Starters =====================
   Lớp 2. Sở hữu (have / has), chỉ định (this/that/these/those), tính từ sở
   hữu và số nhiều — bộ khung còn lại của Starters. */
{
    id: 'world-6', order: 6,
    title: '🎒 Everyday World',
    subtitle: 'Have/Has + Trường học & Gia đình',
    grade: 'Lớp 2', gradeMin: 2, gradeMax: 2,
    icon: '🎒', color: '#6538b8',
    levels: [
        {
            id: 'w6-l1', order: 1, title: 'I have / You have',
            topic: 'Have', desc: 'Nói mình có cái gì.',
            items: [
                { kind: 'choice', prompt: '<b>Have</b> nghĩa là gì?', emoji: '🎁', opts: ['là', 'có', 'làm'], ans: 1, why: '<b>Have</b> = có (sở hữu).' },
                { kind: 'choice', prompt: 'Điền: I ______ a new bag.', emoji: '🎒', opts: ['has', 'have', 'am'], ans: 1, why: 'I → <b>have</b>.' },
                { kind: 'choice', prompt: 'Điền: You ______ nice shoes.', emoji: '👟', opts: ['have', 'has', 'having'], ans: 0, why: 'You → <b>have</b>.' },
                { kind: 'choice', prompt: 'Điền: We ______ two cats.', emoji: '🐱', opts: ['has', 'have', 'having'], ans: 1, why: 'We → <b>have</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '📕', opts: ['I have a book.', 'I has a book.', 'I am have a book.'], ans: 0, why: 'I <b>have</b> a book.' },
                { kind: 'fill', prompt: 'They ______ a big house.', hint: 'Điền have hoặc has cho đúng chủ ngữ 👇', emoji: '🏠', answers: ['have'], bank: ['have', 'has'] },
                { kind: 'build', target: 'I have two brothers .', vi: 'Tớ có hai anh trai.', emoji: '👦', why: 'I have + số + danh từ số nhiều.' },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'have', rightLabel: 'has', pairs: [['I', 'He'], ['You', 'She'], ['We', 'It']] }
            ]
        },
        {
            id: 'w6-l2', order: 2, title: 'He has / She has',
            topic: 'Have', desc: 'Ngôi thứ ba số ít đổi have thành has.',
            items: [
                { kind: 'choice', prompt: '<b>He, She, It</b> dùng dạng nào?', emoji: '👦', opts: ['have', 'has', 'having'], ans: 1, why: 'Ngôi thứ ba số ít đổi have → <b>has</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ long hair.', emoji: '👧', opts: ['have', 'has', 'having'], ans: 1, why: 'She → <b>has</b>.' },
                { kind: 'choice', prompt: 'Điền: My father ______ a car.', emoji: '🚗', opts: ['has', 'have', 'having'], ans: 0, why: 'My father = he → <b>has</b>.' },
                { kind: 'choice', prompt: 'Điền: The cat ______ blue eyes.', emoji: '🐱', opts: ['have', 'has', 'having'], ans: 1, why: 'The cat = it → <b>has</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['He has a dog.', 'She has a doll.', 'He have a bike.'], ans: 2, why: 'Phải là "He <b>has</b> a bike".' },
                { kind: 'fill', prompt: 'My sister ______ a red dress.', hint: 'Điền have hoặc has 👇', emoji: '👗', answers: ['has'], bank: ['have', 'has'] },
                { kind: 'build', target: 'She has a new bike .', vi: 'Bạn ấy có một chiếc xe đạp mới.', emoji: '🚲', why: 'She has + a + tính từ + danh từ.' },
                { kind: 'match', title: 'Nối chủ ngữ với have/has đúng', leftLabel: 'Chủ ngữ', rightLabel: 'Động từ', pairs: [['I', 'have'], ['They', 'have'], ['He', 'has'], ['My mother', 'has']] }
            ]
        },
        {
            id: 'w6-l3', order: 3, title: 'Have hay Has?',
            topic: 'Have', desc: 'Luyện phân biệt hai dạng cho thật chắc.',
            items: [
                { kind: 'choice', prompt: 'Điền: Nam and Ba ______ new books.', emoji: '📚', opts: ['have', 'has', 'having'], ans: 0, why: 'Hai người = they → <b>have</b>.' },
                { kind: 'choice', prompt: 'Điền: My dog ______ four legs.', emoji: '🐶', opts: ['have', 'has', 'having'], ans: 1, why: 'My dog = it → <b>has</b>.' },
                { kind: 'choice', prompt: 'Điền: You and I ______ the same bag.', emoji: '🎒', opts: ['has', 'have', 'having'], ans: 1, why: 'You and I = we → <b>have</b>.' },
                { kind: 'choice', prompt: 'Điền: The elephant ______ a long nose.', emoji: '🐘', opts: ['has', 'have', 'having'], ans: 0, why: 'The elephant = it → <b>has</b>.' },
                { kind: 'fill', prompt: 'My friends ______ many toys.', hint: 'Điền have hoặc has 👇', emoji: '🧸', answers: ['have'], bank: ['have', 'has'] },
                { kind: 'fill', prompt: 'Lan ______ a beautiful doll.', hint: 'Điền have hoặc has 👇', emoji: '🪆', answers: ['has'], bank: ['have', 'has'] },
                { kind: 'build', target: 'My father has a big car .', vi: 'Bố tớ có một chiếc ô tô to.', emoji: '🚗', why: 'Ngôi thứ ba số ít → has.' },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '✅ Đúng', rightLabel: '❌ Sai', pairs: [['She has a cat.', 'She have a cat.'], ['They have books.', 'They has books.'], ['It has four legs.', 'It have four legs.']] }
            ]
        },
        {
            id: 'w6-l4', order: 4, title: 'Số nhiều: thêm -s, -es',
            topic: 'Plurals', desc: 'Một cái thì thôi, nhiều cái thì thêm đuôi.',
            items: [
                { kind: 'choice', prompt: 'Nhiều hơn một thì danh từ thêm gì?', emoji: '📚', opts: ['-s hoặc -es', '-ing', '-ed'], ans: 0, why: 'book → book<b>s</b>, box → box<b>es</b>.' },
                { kind: 'choice', prompt: 'Số nhiều của <b>book</b> là gì?', emoji: '📕', opts: ['bookes', 'books', 'bookies'], ans: 1, why: 'Thêm -s: <b>books</b>.' },
                { kind: 'choice', prompt: 'Số nhiều của <b>box</b> là gì?', emoji: '📦', opts: ['boxs', 'boxes', 'boxies'], ans: 1, why: 'Tận cùng -x thì thêm <b>-es</b>: boxes.' },
                { kind: 'choice', prompt: 'Số nhiều của <b>bus</b> là gì?', emoji: '🚌', opts: ['buses', 'buss', 'busses'], ans: 0, why: 'Tận cùng -s thì thêm -es: <b>buses</b>.' },
                { kind: 'choice', prompt: 'Số nhiều của <b>child</b> là gì?', emoji: '👶', opts: ['childs', 'childes', 'children'], ans: 2, why: '<b>Children</b> — đây là dạng bất quy tắc, phải nhớ.' },
                { kind: 'fill', prompt: 'I have three ______. (cat)', hint: 'Đổi từ trong ngoặc sang số nhiều 👇', emoji: '🐱', answers: ['cats'], bank: ['cats', 'cat', 'cates'] },
                { kind: 'fill', prompt: 'There are two ______ here. (box)', hint: 'Đổi từ trong ngoặc sang số nhiều 👇', emoji: '📦', answers: ['boxes'], bank: ['boxes', 'boxs', 'box'] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: 'Thêm -s', rightLabel: 'Thêm -es', pairs: [['book', 'box'], ['dog', 'bus'], ['pen', 'watch']] }
            ]
        },
        {
            id: 'w6-l5', order: 5, title: '🔄 Ôn tập: Have/Has & Số nhiều',
            topic: 'Review', desc: 'Ôn lại sở hữu và cách tạo số nhiều.',
            items: [
                { kind: 'choice', prompt: 'Điền: My brother ______ a robot.', emoji: '🤖', opts: ['have', 'has', 'having'], ans: 1, why: 'my brother = he → <b>has</b>.' },
                { kind: 'choice', prompt: 'Điền: We ______ English on Monday.', emoji: '📅', opts: ['have', 'has', 'having'], ans: 0, why: 'We → <b>have</b>.' },
                { kind: 'choice', prompt: 'Số nhiều của <b>watch</b> là gì?', emoji: '⌚', opts: ['watchs', 'watches', 'watch'], ans: 1, why: 'Tận cùng -ch thì thêm -es: <b>watches</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '👟', opts: ['I have two shoe.', 'I have two shoes.', 'I has two shoes.'], ans: 1, why: 'two → danh từ số nhiều <b>shoes</b>, và I → have.' },
                { kind: 'fill', prompt: 'She has five ______. (pen)', hint: 'Đổi từ trong ngoặc sang số nhiều 👇', emoji: '🖊️', answers: ['pens'], bank: ['pens', 'pen', 'penes'] },
                { kind: 'build', target: 'I have three red pens .', vi: 'Tớ có ba cái bút đỏ.', emoji: '🖊️', why: 'Số + tính từ + danh từ số nhiều.' },
                { kind: 'match', title: 'Nối số ít với số nhiều', leftLabel: 'Số ít', rightLabel: 'Số nhiều', pairs: [['book', 'books'], ['box', 'boxes'], ['child', 'children'], ['bus', 'buses']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: 'have', rightLabel: 'has', pairs: [['They', 'She'], ['We', 'My father'], ['You', 'The dog']] },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['He has two cats.', 'They have a car.', 'She have a doll.'], ans: 2, why: 'Phải là "She <b>has</b> a doll".' }
            ]
        },
        {
            id: 'w6-l6', order: 6, title: 'This / That',
            topic: 'Demonstratives', desc: 'Cái này ở gần, cái kia ở xa (số ít).',
            items: [
                { kind: 'choice', prompt: 'Vật ở <b>gần</b> dùng từ nào?', emoji: '👉', opts: ['That', 'This', 'Those'], ans: 1, why: '<b>This</b> = cái này (gần).' },
                { kind: 'choice', prompt: 'Vật ở <b>xa</b> dùng từ nào?', emoji: '👈', opts: ['That', 'This', 'These'], ans: 0, why: '<b>That</b> = cái kia (xa).' },
                { kind: 'choice', prompt: 'Điền: ______ is my pen. (bút trong tay)', emoji: '🖊️', opts: ['That', 'These', 'This'], ans: 2, why: 'Trong tay là gần → <b>This</b>.' },
                { kind: 'choice', prompt: 'This và That đi với to be nào?', emoji: '💡', opts: ['is', 'are', 'am'], ans: 0, why: 'Cả hai đều là số ít → <b>is</b>.' },
                { kind: 'fill', prompt: '______ is a beautiful flower. (bông hoa ngay trước mặt)', hint: 'Điền This hoặc That 👇', emoji: '🌸', answers: ['This', 'this'], bank: ['This', 'That'] },
                { kind: 'build', target: 'That is my school .', vi: 'Kia là trường của tớ.', emoji: '🏫', why: 'That is + danh từ số ít.' },
                { kind: 'match', title: 'Nối tình huống với từ đúng', leftLabel: 'Tình huống', rightLabel: 'Dùng từ', pairs: [['cái bút trong tay', 'This'], ['ngôi nhà đằng xa', 'That'], ['quyển sách đang cầm', 'This'], ['cái cây ngoài sân', 'That']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '👉 This (gần)', rightLabel: '👈 That (xa)', pairs: [['cái ghế tớ đang ngồi', 'toà nhà bên kia đường'], ['cái cặp trên vai', 'ngọn núi phía xa'], ['bàn tay của tớ', 'mặt trăng']] }
            ]
        },
        {
            id: 'w6-l7', order: 7, title: 'These / Those',
            topic: 'Demonstratives', desc: 'Dạng số nhiều của this và that.',
            items: [
                { kind: 'choice', prompt: 'Số nhiều của <b>this</b> là gì?', emoji: '👉', opts: ['those', 'these', 'thises'], ans: 1, why: 'this → <b>these</b>.' },
                { kind: 'choice', prompt: 'Số nhiều của <b>that</b> là gì?', emoji: '👈', opts: ['those', 'these', 'thats'], ans: 0, why: 'that → <b>those</b>.' },
                { kind: 'choice', prompt: 'These và Those đi với to be nào?', emoji: '💡', opts: ['is', 'are', 'am'], ans: 1, why: 'Số nhiều → <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ are my books. (sách trên bàn ngay đây)', emoji: '📚', opts: ['Those', 'This', 'These'], ans: 2, why: 'Nhiều và ở gần → <b>These</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '👟', opts: ['These are my shoes.', 'These is my shoes.', 'This are my shoes.'], ans: 0, why: 'These + <b>are</b> + danh từ số nhiều.' },
                { kind: 'fill', prompt: '______ are my friends. (các bạn đứng cạnh tớ)', hint: 'Điền These hoặc Those 👇', emoji: '👥', answers: ['These', 'these'], bank: ['These', 'Those'] },
                { kind: 'build', target: 'Those are big trees .', vi: 'Kia là những cái cây to.', emoji: '🌳', why: 'Those are + tính từ + danh từ số nhiều.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '👤 Số ít (this/that)', rightLabel: '👥 Số nhiều (these/those)', pairs: [['This is a book.', 'These are books.'], ['That is a cat.', 'Those are cats.'], ['This is my pen.', 'These are my pens.']] }
            ]
        },
        {
            id: 'w6-l8', order: 8, title: 'My / Your / His / Her',
            topic: 'Possessive', desc: 'Của tớ, của bạn, của cậu ấy, của cô ấy.',
            items: [
                { kind: 'choice', prompt: '"Của tôi" tiếng Anh là gì?', emoji: '🙋', opts: ['I', 'my', 'me'], ans: 1, why: '<b>My</b> = của tôi. Luôn đứng trước danh từ.' },
                { kind: 'choice', prompt: '"Của cậu ấy (nam)" là gì?', emoji: '👦', opts: ['her', 'his', 'he'], ans: 1, why: '<b>His</b> = của cậu ấy.' },
                { kind: 'choice', prompt: '"Của cô ấy" là gì?', emoji: '👧', opts: ['her', 'his', 'she'], ans: 0, why: '<b>Her</b> = của cô ấy.' },
                { kind: 'choice', prompt: 'Điền: This is Nam. ______ bag is blue.', emoji: '🎒', opts: ['Her', 'His', 'My'], ans: 1, why: 'Nam là nam → <b>His</b> bag.' },
                { kind: 'choice', prompt: 'Điền: This is Lan. ______ hair is long.', emoji: '👧', opts: ['His', 'Her', 'Your'], ans: 1, why: 'Lan là nữ → <b>Her</b> hair.' },
                { kind: 'fill', prompt: 'I am Nam. This is ______ bike.', hint: 'Điền tính từ sở hữu đúng 👇', emoji: '🚲', answers: ['my'], bank: ['my', 'your', 'his', 'her'] },
                { kind: 'build', target: 'Her dress is very nice .', vi: 'Váy của cô ấy rất đẹp.', emoji: '👗', why: 'Tính từ sở hữu + danh từ + is + tính từ.' },
                { kind: 'match', title: 'Nối đại từ với tính từ sở hữu', leftLabel: 'Đại từ', rightLabel: 'Sở hữu', pairs: [['I', 'my'], ['You', 'your'], ['He', 'his'], ['She', 'her']] }
            ]
        },
        {
            id: 'w6-l9', order: 9, title: 'Ghép câu hoàn chỉnh',
            topic: 'Build', desc: 'Ráp tất cả những gì đã học của thế giới này.',
            items: [
                { kind: 'build', target: 'This is my new bag .', vi: 'Đây là cái cặp mới của tớ.', emoji: '🎒', why: 'This is + sở hữu + tính từ + danh từ.' },
                { kind: 'build', target: 'She has two little sisters .', vi: 'Bạn ấy có hai em gái nhỏ.', emoji: '👧', why: 'She has + số + tính từ + danh từ số nhiều.' },
                { kind: 'build', target: 'Those are his books .', vi: 'Kia là những quyển sách của cậu ấy.', emoji: '📚', why: 'Those are + sở hữu + danh từ số nhiều.' },
                { kind: 'build', target: 'My father has a black car .', vi: 'Bố tớ có một chiếc ô tô màu đen.', emoji: '🚗', why: 'Ngôi ba số ít → has.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['These are my pens.', 'This is her book.', 'Those is my shoes.'], ans: 2, why: 'Those số nhiều → phải là "Those <b>are</b> my shoes".' },
                { kind: 'fill', prompt: 'My brother ______ a big kite.', hint: 'Điền have hoặc has 👇', emoji: '🪁', answers: ['has'], bank: ['have', 'has'] },
                { kind: 'choice', prompt: 'Điền: ______ are those?', emoji: '❓', opts: ['What', 'Who', 'Where'], ans: 0, why: 'Hỏi về đồ vật → <b>What</b> are those?' },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '👤 Số ít', rightLabel: '👥 Số nhiều', pairs: [['This is a pen.', 'These are pens.'], ['He has a cat.', 'They have cats.'], ['That is my bag.', 'Those are my bags.']] }
            ]
        },
        {
            id: 'w6-l10', order: 10, title: '👑 Boss: My World', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp: have/has, this/these, sở hữu và số nhiều.',
            items: [
                { kind: 'choice', prompt: 'Điền: My mother ______ a nice hat.', emoji: '🧢', opts: ['have', 'has', 'having'], ans: 1, why: 'my mother = she → <b>has</b>.' },
                { kind: 'choice', prompt: 'Điền: My friends ______ many books.', emoji: '📚', opts: ['have', 'has', 'having'], ans: 0, why: 'my friends = they → <b>have</b>.' },
                { kind: 'choice', prompt: 'Số nhiều của <b>bus</b> là gì?', emoji: '🚌', opts: ['buss', 'buses', 'busies'], ans: 1, why: 'Tận cùng -s thì thêm -es: <b>buses</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ are my socks. (tất ngay đây)', emoji: '🧦', opts: ['This', 'These', 'That'], ans: 1, why: 'Nhiều + gần → <b>These</b>.' },
                { kind: 'choice', prompt: 'Điền: That is Lan. ______ bag is pink.', emoji: '🎒', opts: ['His', 'Her', 'Your'], ans: 1, why: 'Lan là nữ → <b>Her</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['These are books.', 'This is a book.', 'These is a book.'], ans: 2, why: 'These số nhiều → phải là "These <b>are</b>".' },
                { kind: 'choice', prompt: 'Số nhiều của <b>child</b> là gì?', emoji: '👶', opts: ['children', 'childs', 'childrens'], ans: 0, why: '<b>Children</b> — bất quy tắc.' },
                { kind: 'fill', prompt: 'He ______ three cats.', hint: 'Điền have hoặc has 👇', emoji: '🐱', answers: ['has'], bank: ['have', 'has'] },
                { kind: 'fill', prompt: 'I have two ______. (box)', hint: 'Đổi từ trong ngoặc sang số nhiều 👇', emoji: '📦', answers: ['boxes'], bank: ['boxes', 'boxs', 'box'] },
                { kind: 'build', target: 'These are my new shoes .', vi: 'Đây là đôi giày mới của tớ.', emoji: '👟', why: 'These are + sở hữu + tính từ + danh từ số nhiều.' },
                { kind: 'build', target: 'His sister has a doll .', vi: 'Chị của cậu ấy có một con búp bê.', emoji: '🪆', why: 'His + danh từ + has + a + danh từ.' },
                { kind: 'match', title: 'Nối đại từ với tính từ sở hữu', leftLabel: 'Đại từ', rightLabel: 'Sở hữu', pairs: [['I', 'my'], ['He', 'his'], ['She', 'her'], ['You', 'your']] }
            ]
        }
    ]
},
/* ===================== WORLD 7 — A1 Movers =====================
   Lớp 3. Từ đây mở thêm hai thứ:
     • `listen` — bé nghe câu rồi gõ từ còn thiếu, đây mới thật sự là luyện
       nghe (các nút loa ở bài trước chỉ là đọc to chữ đang hiện).
     • `passage` — bài đọc gắn ở cấp level, hiện phía trên mọi câu hỏi của
       bài đó, nên câu hỏi đọc hiểu mới có căn cứ để trả lời. */
{
    id: 'world-7', order: 7,
    title: '🏠 Where Is It?',
    subtitle: 'Giới từ + There is / There are',
    grade: 'Lớp 3', gradeMin: 3, gradeMax: 3,
    icon: '🏠', color: '#0e7490',
    levels: [
        {
            id: 'w7-l1', order: 1, title: 'In / On / Under',
            topic: 'Prepositions', desc: 'Ba giới từ chỉ nơi chốn dùng nhiều nhất.',
            items: [
                { kind: 'card', w: { w: 'In', ipa: '/ɪn/', vi: 'ở trong', emoji: '📦', ex: 'The cat is in the box.', exVi: 'Con mèo ở trong hộp.' } },
                { kind: 'card', w: { w: 'On', ipa: '/ɒn/', vi: 'ở trên (bề mặt)', emoji: '🪑', ex: 'The book is on the desk.', exVi: 'Quyển sách ở trên bàn.' } },
                { kind: 'card', w: { w: 'Under', ipa: '/ˈʌn.dər/', vi: 'ở dưới', emoji: '🛏️', ex: 'The ball is under the bed.', exVi: 'Quả bóng ở dưới gầm giường.' } },
                { kind: 'choice', prompt: 'Con mèo nằm <b>bên trong</b> cái hộp. Dùng giới từ nào?', emoji: '📦', opts: ['on', 'in', 'under'], ans: 1, why: 'Bên trong → <b>in</b> the box.' },
                { kind: 'choice', prompt: 'Quyển sách đặt <b>trên mặt bàn</b>. Dùng giới từ nào?', emoji: '📕', opts: ['on', 'in', 'under'], ans: 0, why: 'Trên bề mặt → <b>on</b> the table.' },
                { kind: 'choice', prompt: 'Quả bóng lăn <b>xuống gầm</b> giường. Dùng giới từ nào?', emoji: '⚽', opts: ['on', 'in', 'under'], ans: 2, why: 'Phía dưới → <b>under</b> the bed.' },
                { kind: 'fill', prompt: 'The pen is ______ the bag. (trong cặp)', hint: 'Điền giới từ chỉ nơi chốn 👇', emoji: '🎒', answers: ['in'], bank: ['in', 'on', 'under'] },
                { kind: 'listen', sentence: 'The cat is under the chair.', display: 'The cat is ______ the chair.', emoji: '🐱', answers: ['under'], bank: ['in', 'on', 'under'] },
                { kind: 'build', target: 'The book is on the desk .', vi: 'Quyển sách ở trên bàn học.', emoji: '📕', why: 'Chủ ngữ + is + giới từ + the + nơi chốn.' }
            ]
        },
        {
            id: 'w7-l2', order: 2, title: 'Behind / In front of / Next to',
            topic: 'Prepositions', desc: 'Phía sau, phía trước, bên cạnh.',
            items: [
                { kind: 'card', w: { w: 'Behind', ipa: '/bɪˈhaɪnd/', vi: 'phía sau', emoji: '🚪', ex: 'The dog is behind the door.', exVi: 'Con chó ở sau cánh cửa.' } },
                { kind: 'card', w: { w: 'In front of', ipa: '/ɪn frʌnt ɒv/', vi: 'phía trước', emoji: '🏠', ex: 'A tree is in front of the house.', exVi: 'Có một cái cây trước nhà.' } },
                { kind: 'card', w: { w: 'Next to', ipa: '/nekst tuː/', vi: 'bên cạnh', emoji: '👫', ex: 'Lan sits next to me.', exVi: 'Lan ngồi cạnh tớ.' } },
                { kind: 'choice', prompt: '<b>Behind</b> nghĩa là gì?', emoji: '🚪', opts: ['phía trước', 'phía sau', 'bên cạnh'], ans: 1, why: '<b>Behind</b> = phía sau.' },
                { kind: 'choice', prompt: 'Bạn ngồi ngay cạnh bé thì dùng giới từ nào?', emoji: '👫', opts: ['next to', 'behind', 'under'], ans: 0, why: 'Bên cạnh → <b>next to</b>.' },
                { kind: 'choice', prompt: 'Điền: The car is ______ the house. (đỗ trước nhà)', emoji: '🚗', opts: ['behind', 'in front of', 'in'], ans: 1, why: 'Trước nhà → <b>in front of</b> the house.' },
                { kind: 'fill', prompt: 'The bag is ______ the chair. (phía sau ghế)', hint: 'Điền giới từ chỉ nơi chốn 👇', emoji: '🎒', answers: ['behind'], bank: ['behind', 'next to', 'on'] },
                { kind: 'listen', sentence: 'The school is next to the park.', display: 'The school is ______ ______ the park.', emoji: '🏫', answers: ['next to'], bank: ['next to', 'behind', 'under'] },
                { kind: 'match', title: 'Nối giới từ với nghĩa tiếng Việt', leftLabel: 'Giới từ', rightLabel: 'Nghĩa', pairs: [['Behind', 'phía sau'], ['In front of', 'phía trước'], ['Next to', 'bên cạnh'], ['Under', 'ở dưới']] }
            ]
        },
        {
            id: 'w7-l3', order: 3, title: 'Between / Near',
            topic: 'Prepositions', desc: 'Ở giữa hai vật, và ở gần.',
            items: [
                { kind: 'card', w: { w: 'Between', ipa: '/bɪˈtwiːn/', vi: 'ở giữa (hai vật)', emoji: '↔️', ex: 'The ball is between two boxes.', exVi: 'Quả bóng ở giữa hai cái hộp.' } },
                { kind: 'card', w: { w: 'Near', ipa: '/nɪər/', vi: 'ở gần', emoji: '📍', ex: 'My house is near the school.', exVi: 'Nhà tớ ở gần trường.' } },
                { kind: 'choice', prompt: '<b>Between</b> dùng khi có mấy vật hai bên?', emoji: '↔️', opts: ['một', 'hai', 'ba'], ans: 1, why: '<b>Between</b> = ở giữa <b>hai</b> vật: between A <b>and</b> B.' },
                { kind: 'choice', prompt: 'Điền: The bank is between the shop ______ the school.', emoji: '🏦', opts: ['or', 'and', 'with'], ans: 1, why: 'Cấu trúc cố định: between A <b>and</b> B.' },
                { kind: 'choice', prompt: 'Nhà tớ cách trường 100 mét. Nói thế nào?', emoji: '🏠', opts: ['My house is near the school.', 'My house is under the school.', 'My house is in the school.'], ans: 0, why: 'Gần → <b>near</b>.' },
                { kind: 'choice', prompt: 'Điền: Lan sits ______ Nam and Ba.', emoji: '👫', opts: ['between', 'near', 'behind'], ans: 0, why: 'Ở giữa hai người → <b>between</b>.' },
                { kind: 'fill', prompt: 'The park is ______ my house. (ở gần)', hint: 'Điền giới từ chỉ nơi chốn 👇', emoji: '🌳', answers: ['near'], bank: ['near', 'between', 'under'] },
                { kind: 'listen', sentence: 'The cat is between the two chairs.', display: 'The cat is ______ the two chairs.', emoji: '🐱', answers: ['between'], bank: ['between', 'near', 'behind'] },
                { kind: 'build', target: 'My house is near the park .', vi: 'Nhà tớ ở gần công viên.', emoji: '🏠', why: 'Chủ ngữ + is + near + the + nơi chốn.' }
            ]
        },
        {
            id: 'w7-l4', order: 4, title: 'Where is / Where are ...?',
            topic: 'Questions', desc: 'Hỏi đồ vật ở đâu.',
            items: [
                { kind: 'choice', prompt: 'Hỏi "ở đâu" thì dùng từ để hỏi nào?', emoji: '❓', opts: ['What', 'Who', 'Where'], ans: 2, why: '<b>Where</b> = ở đâu.' },
                { kind: 'choice', prompt: 'Điền: ______ is my pen?', emoji: '🖊️', opts: ['Where', 'What', 'When'], ans: 0, why: 'Hỏi vị trí → <b>Where</b>.' },
                { kind: 'choice', prompt: 'Hỏi về <b>nhiều</b> đồ vật thì dùng gì?', emoji: '📚', opts: ['Where is', 'Where are', 'Where am'], ans: 1, why: 'Số nhiều → <b>Where are</b> my books?' },
                { kind: 'choice', prompt: 'Trả lời cho "Where is the cat?"', emoji: '🐱', opts: ['It is under the table.', 'Yes, it is.', 'It is a cat.'], ans: 0, why: 'Hỏi ở đâu thì trả lời bằng <b>vị trí</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ are my shoes?', emoji: '👟', opts: ['Where is', 'Where are', 'Where am'], ans: 1, why: 'shoes số nhiều → <b>Where are</b>.' },
                { kind: 'fill', prompt: '______ is my school bag?', hint: 'Điền từ để hỏi về nơi chốn 👇', emoji: '🎒', answers: ['Where', 'where'], bank: ['Where', 'What', 'Who'] },
                { kind: 'listen', sentence: 'Where are the books?', display: 'Where ______ the books?', emoji: '📚', answers: ['are'], bank: ['is', 'are', 'am'] },
                { kind: 'build', target: 'Where is my ball ?', vi: 'Quả bóng của tớ ở đâu?', emoji: '⚽', why: 'Where + is + chủ ngữ số ít + ?' },
                { kind: 'match', title: 'Nối câu hỏi với câu trả lời', leftLabel: 'Câu hỏi', rightLabel: 'Trả lời', pairs: [['Where is the cat?', 'It is on the bed.'], ['Where are the pens?', 'They are in the bag.'], ['Where is Nam?', 'He is at school.'], ['Where are you?', 'I am at home.']] }
            ]
        },
        {
            id: 'w7-l5', order: 5, title: '🔄 Ôn tập: Giới từ nơi chốn',
            topic: 'Review', desc: 'Ôn lại toàn bộ giới từ và câu hỏi Where.',
            items: [
                { kind: 'choice', prompt: 'Điền: The ball is ______ the box. (bên trong)', emoji: '📦', opts: ['on', 'in', 'under'], ans: 1, why: 'Bên trong → <b>in</b>.' },
                { kind: 'choice', prompt: 'Điền: The cat sits ______ the two boxes.', emoji: '🐱', opts: ['between', 'near', 'in'], ans: 0, why: 'Giữa hai vật → <b>between</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ is your mother?', emoji: '👩', opts: ['What', 'Where', 'Who'], ans: 1, why: 'Hỏi vị trí → <b>Where</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['Where is my pen?', 'Where are my pens?', 'Where is my pens?'], ans: 2, why: 'pens số nhiều → phải là "Where <b>are</b> my pens?"' },
                { kind: 'fill', prompt: 'The dog is ______ the door. (phía sau)', hint: 'Điền giới từ chỉ nơi chốn 👇', emoji: '🚪', answers: ['behind'], bank: ['behind', 'near', 'on'] },
                { kind: 'listen', sentence: 'My bag is on the chair.', display: 'My bag is ______ the chair.', emoji: '🎒', answers: ['on'], bank: ['on', 'in', 'under'] },
                { kind: 'build', target: 'The ball is under the table .', vi: 'Quả bóng ở dưới gầm bàn.', emoji: '⚽', why: 'Chủ ngữ + is + under + the + nơi chốn.' },
                { kind: 'match', title: 'Nối giới từ với nghĩa', leftLabel: 'Giới từ', rightLabel: 'Nghĩa', pairs: [['In', 'ở trong'], ['On', 'ở trên'], ['Between', 'ở giữa'], ['Near', 'ở gần']] },
                { kind: 'sort', title: 'Xếp câu hỏi vào đúng nhóm', leftLabel: 'Where is (số ít)', rightLabel: 'Where are (số nhiều)', pairs: [['my pen', 'my pens'], ['the cat', 'the cats'], ['your book', 'your books']] }
            ]
        },
        {
            id: 'w7-l6', order: 6, title: 'There is ...',
            topic: 'There is', desc: 'Nói "có một cái gì đó ở đâu đó".',
            items: [
                { kind: 'choice', prompt: '<b>There is</b> dùng cho danh từ thế nào?', emoji: '1️⃣', opts: ['số ít', 'số nhiều', 'cả hai đều được'], ans: 0, why: 'There is + danh từ <b>số ít</b>: There is a cat.' },
                { kind: 'choice', prompt: 'Điền: ______ a book on the desk.', emoji: '📕', opts: ['There is', 'There are', 'There am'], ans: 0, why: 'a book là số ít → <b>There is</b>.' },
                { kind: 'choice', prompt: 'Điền: There is ______ apple in the bag.', emoji: '🍎', opts: ['a', 'an', 'the'], ans: 1, why: 'apple bắt đầu bằng nguyên âm → dùng <b>an</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🐱', opts: ['There is a cat.', 'There are a cat.', 'There is cats.'], ans: 0, why: 'There is + a + danh từ số ít.' },
                { kind: 'choice', prompt: 'Phủ định của "There is a cat" là gì?', emoji: '🚫', opts: ["There isn't a cat.", "There aren't a cat.", "There not is a cat."], ans: 0, why: "There + <b>isn't</b> + danh từ số ít." },
                { kind: 'fill', prompt: 'There ______ a lamp in my room.', hint: 'Điền is hoặc are 👇', emoji: '💡', answers: ['is'], bank: ['is', 'are'] },
                { kind: 'listen', sentence: 'There is a dog in the garden.', display: 'There is a ______ in the garden.', emoji: '🐶', answers: ['dog'], bank: ['dog', 'cat', 'bird'] },
                { kind: 'build', target: 'There is a cat on the bed .', vi: 'Có một con mèo ở trên giường.', emoji: '🐱', why: 'There is + a + danh từ + giới từ + nơi chốn.' }
            ]
        },
        {
            id: 'w7-l7', order: 7, title: 'There are ...',
            topic: 'There are', desc: 'Dạng số nhiều: có nhiều thứ ở đâu đó.',
            items: [
                { kind: 'choice', prompt: '<b>There are</b> dùng cho danh từ thế nào?', emoji: '🔢', opts: ['số ít', 'số nhiều', 'cả hai đều được'], ans: 1, why: 'There are + danh từ <b>số nhiều</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ three books on the desk.', emoji: '📚', opts: ['There is', 'There are', 'There am'], ans: 1, why: 'three books số nhiều → <b>There are</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🪑', opts: ['There are two chair.', 'There are two chairs.', 'There is two chairs.'], ans: 1, why: 'two → danh từ số nhiều <b>chairs</b>, và dùng are.' },
                { kind: 'choice', prompt: 'Phủ định của "There are five cats" là gì?', emoji: '🚫', opts: ["There aren't five cats.", "There isn't five cats.", "There not are five cats."], ans: 0, why: "Số nhiều → <b>aren't</b>." },
                { kind: 'choice', prompt: 'Hỏi "Có bao nhiêu quyển sách?" thế nào?', emoji: '❓', opts: ['How many books are there?', 'How much books are there?', 'How many book are there?'], ans: 0, why: 'Đếm được → <b>How many</b> + danh từ số nhiều.' },
                { kind: 'fill', prompt: 'There ______ four windows in my class.', hint: 'Điền is hoặc are 👇', emoji: '🪟', answers: ['are'], bank: ['is', 'are'] },
                { kind: 'listen', sentence: 'There are six chairs in the room.', display: 'There are ______ chairs in the room.', emoji: '🪑', answers: ['six', '6'], bank: ['six', 'four', 'ten'] },
                { kind: 'build', target: 'There are three books under the desk .', vi: 'Có ba quyển sách ở dưới gầm bàn.', emoji: '📚', why: 'There are + số + danh từ số nhiều + nơi chốn.' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: 'There is', rightLabel: 'There are', pairs: [['a cat', 'two cats'], ['one book', 'many books'], ['a chair', 'five chairs']] }
            ]
        },
        {
            id: 'w7-l8', order: 8, title: 'Phân loại There is / There are',
            topic: 'Sort', desc: 'Luyện chọn đúng dạng theo số ít hay số nhiều.',
            items: [
                { kind: 'sort', title: 'Xếp cụm từ vào đúng dạng', leftLabel: 'There IS', rightLabel: 'There ARE', pairs: [['a dog', 'two dogs'], ['one apple', 'six apples'], ['a red car', 'many cars'], ['an egg', 'ten eggs']] },
                { kind: 'choice', prompt: 'Điền: ______ a big tree in the garden.', emoji: '🌳', opts: ['There is', 'There are', 'There am'], ans: 0, why: 'a big tree số ít → <b>There is</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ many students in the class.', emoji: '👥', opts: ['There is', 'There are', 'There am'], ans: 1, why: 'many students số nhiều → <b>There are</b>.' },
                { kind: 'choice', prompt: 'Điền: There ______ some water in the glass.', emoji: '💧', opts: ['is', 'are', 'am'], ans: 0, why: 'Water không đếm được → luôn dùng <b>is</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['There is a pen.', 'There are pens.', 'There is pens.'], ans: 2, why: 'pens số nhiều → phải là "There <b>are</b> pens".' },
                { kind: 'fill', prompt: 'There ______ two doors in my house.', hint: 'Điền is hoặc are 👇', emoji: '🚪', answers: ['are'], bank: ['is', 'are'] },
                { kind: 'listen', sentence: 'There are five apples on the table.', display: 'There ______ five apples on the table.', emoji: '🍎', answers: ['are'], bank: ['is', 'are'] },
                { kind: 'build', target: 'There are many books in the library .', vi: 'Có nhiều sách trong thư viện.', emoji: '📚', why: 'There are + many + danh từ số nhiều.' }
            ]
        },
        {
            id: 'w7-l9', order: 9, title: '📔 Bài đọc: My Bedroom',
            topic: 'Reading', desc: 'Đọc đoạn văn tả căn phòng rồi trả lời câu hỏi.',
            passage: {
                title: 'My Bedroom',
                pics: ['🛏️', '🪟', '🧸', '📚'],
                text: 'This is my bedroom. It is small but very nice.<br>There is a bed near the window. My teddy bear is <b>on</b> the bed.<br>There is a desk <b>next to</b> the bed. There are many books <b>on</b> the desk.<br>My school bag is <b>under</b> the desk. There are two pictures <b>on</b> the wall.<br>My cat likes to sleep <b>under</b> my bed!',
                plain: 'This is my bedroom. It is small but very nice. There is a bed near the window. My teddy bear is on the bed. There is a desk next to the bed. There are many books on the desk. My school bag is under the desk. There are two pictures on the wall. My cat likes to sleep under my bed.'
            },
            items: [
                { kind: 'choice', prompt: 'Căn phòng thế nào?', opts: ['big and nice', 'small but nice', 'small and bad'], ans: 1, why: 'Bài viết: "It is <b>small but very nice</b>."' },
                { kind: 'choice', prompt: 'Con gấu bông ở đâu?', emoji: '🧸', opts: ['on the bed', 'under the bed', 'on the desk'], ans: 0, why: '"My teddy bear is <b>on the bed</b>."' },
                { kind: 'choice', prompt: 'Cái cặp ở đâu?', emoji: '🎒', opts: ['on the desk', 'near the window', 'under the desk'], ans: 2, why: '"My school bag is <b>under the desk</b>."' },
                { kind: 'choice', prompt: 'Có mấy bức tranh trên tường?', emoji: '🖼️', opts: ['one', 'two', 'three'], ans: 1, why: '"There are <b>two</b> pictures on the wall."' },
                { kind: 'choice', prompt: 'Con mèo thích ngủ ở đâu?', emoji: '🐱', opts: ['on the bed', 'under the bed', 'on the desk'], ans: 1, why: '"My cat likes to sleep <b>under my bed</b>."' },
                { kind: 'choice', prompt: 'Cái bàn học ở đâu?', emoji: '🪑', opts: ['next to the bed', 'under the bed', 'near the door'], ans: 0, why: '"There is a desk <b>next to the bed</b>."' },
                { kind: 'fill', prompt: 'There is a bed ______ the window.', hint: 'Đọc lại bài rồi điền giới từ đúng 👇', emoji: '🪟', answers: ['near'], bank: ['near', 'under', 'behind'] },
                { kind: 'build', target: 'There are many books on the desk .', vi: 'Có nhiều sách ở trên bàn.', emoji: '📚', why: 'Câu này lấy nguyên từ bài đọc.' }
            ]
        },
        {
            id: 'w7-l10', order: 10, title: '👑 Boss: Find Items', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp: giới từ, Where, There is/are và một bài đọc mới.',
            passage: {
                title: 'In the Classroom',
                pics: ['🏫', '📋', '🪑', '🎒'],
                text: 'Look at my classroom! There is a big board <b>in front of</b> the class.<br>There are twenty desks and twenty chairs. My desk is <b>near</b> the window.<br>There is a clock <b>on</b> the wall, <b>next to</b> the board.<br>My bag is <b>under</b> my desk, and my pencil case is <b>on</b> it.<br>There are three big windows, so our classroom is very bright.',
                plain: 'Look at my classroom! There is a big board in front of the class. There are twenty desks and twenty chairs. My desk is near the window. There is a clock on the wall, next to the board. My bag is under my desk, and my pencil case is on it. There are three big windows, so our classroom is very bright.'
            },
            items: [
                { kind: 'choice', prompt: 'Cái bảng ở đâu?', emoji: '📋', opts: ['in front of the class', 'behind the class', 'under the desk'], ans: 0, why: '"There is a big board <b>in front of</b> the class."' },
                { kind: 'choice', prompt: 'Trong lớp có bao nhiêu cái bàn?', emoji: '🪑', opts: ['ten', 'twenty', 'three'], ans: 1, why: '"There are <b>twenty</b> desks."' },
                { kind: 'choice', prompt: 'Cái đồng hồ ở đâu?', emoji: '🕐', opts: ['on the wall', 'on the desk', 'under the board'], ans: 0, why: '"There is a clock <b>on the wall</b>."' },
                { kind: 'choice', prompt: 'Có mấy cửa sổ?', emoji: '🪟', opts: ['two', 'three', 'twenty'], ans: 1, why: '"There are <b>three</b> big windows."' },
                { kind: 'choice', prompt: 'Điền: ______ is my pencil case?', emoji: '✏️', opts: ['What', 'Where', 'Who'], ans: 1, why: 'Hỏi vị trí → <b>Where</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ two cats under the tree.', emoji: '🐱', opts: ['There is', 'There are', 'There am'], ans: 1, why: 'two cats số nhiều → <b>There are</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['There is a clock.', 'There are three windows.', 'There is three windows.'], ans: 2, why: 'three windows số nhiều → phải là "There <b>are</b>".' },
                { kind: 'fill', prompt: 'My bag is ______ my desk. (ở dưới)', hint: 'Đọc lại bài rồi điền giới từ 👇', emoji: '🎒', answers: ['under'], bank: ['under', 'on', 'near'] },
                { kind: 'listen', sentence: 'The clock is next to the board.', display: 'The clock is ______ ______ the board.', emoji: '🕐', answers: ['next to'], bank: ['next to', 'under', 'behind'] },
                { kind: 'build', target: 'There is a clock on the wall .', vi: 'Có một cái đồng hồ trên tường.', emoji: '🕐', why: 'There is + a + danh từ + on the + nơi chốn.' },
                { kind: 'build', target: 'Where are my books ?', vi: 'Sách của tớ ở đâu?', emoji: '📚', why: 'Where + are + danh từ số nhiều + ?' },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: 'There IS', rightLabel: 'There ARE', pairs: [['a board', 'twenty desks'], ['a clock', 'three windows'], ['a bag', 'many books']] }
            ]
        }
    ]
},
/* ===================== WORLD 8 — A1 Movers =====================
   Lớp 3. Thì Hiện tại đơn: thói quen hằng ngày. Trọng tâm là cái bẫy kinh
   điển của học sinh Việt — thêm -s cho ngôi thứ ba số ít. */
{
    id: 'world-8', order: 8,
    title: '☀️ Daily Routines',
    subtitle: 'Thì Hiện Tại Đơn (Present Simple)',
    grade: 'Lớp 3', gradeMin: 3, gradeMax: 3,
    icon: '☀️', color: '#b45309',
    levels: [
        {
            id: 'w8-l1', order: 1, title: 'Daily Actions',
            topic: 'Routine', desc: 'Từ vựng về việc bé làm mỗi ngày.',
            items: [
                { kind: 'card', w: { w: 'Get up', ipa: '/ɡet ʌp/', vi: 'thức dậy', emoji: '⏰', ex: 'I get up at six.', exVi: 'Tớ dậy lúc sáu giờ.' } },
                { kind: 'card', w: { w: 'Brush teeth', ipa: '/brʌʃ tiːθ/', vi: 'đánh răng', emoji: '🪥', ex: 'I brush my teeth every morning.', exVi: 'Sáng nào tớ cũng đánh răng.' } },
                { kind: 'card', w: { w: 'Have breakfast', ipa: '/hæv ˈbrek.fəst/', vi: 'ăn sáng', emoji: '🥣', ex: 'We have breakfast at seven.', exVi: 'Chúng tớ ăn sáng lúc bảy giờ.' } },
                { kind: 'card', w: { w: 'Go to bed', ipa: '/ɡəʊ tuː bed/', vi: 'đi ngủ', emoji: '🛏️', ex: 'I go to bed at nine.', exVi: 'Tớ đi ngủ lúc chín giờ.' } },
                { kind: 'choice', prompt: '⏰ <b>Get up</b> nghĩa là gì?', emoji: '⏰', opts: ['đi ngủ', 'thức dậy', 'ăn sáng'], ans: 1, why: '<b>Get up</b> = thức dậy, ra khỏi giường.' },
                { kind: 'choice', prompt: '🪥 Việc này tiếng Anh là gì?', emoji: '🪥', opts: ['wash my face', 'brush my teeth', 'have lunch'], ans: 1, why: 'Đánh răng — <b>brush my teeth</b>.' },
                { kind: 'choice', prompt: 'Buổi sáng bé ăn bữa gì?', emoji: '🥣', opts: ['breakfast', 'lunch', 'dinner'], ans: 0, why: 'Bữa sáng là <b>breakfast</b>; trưa lunch, tối dinner.' },
                { kind: 'listen', sentence: 'I get up at six o clock.', display: 'I get up at ______ o clock.', emoji: '⏰', answers: ['six', '6'], bank: ['six', 'seven', 'nine'] },
                { kind: 'match', title: 'Nối hoạt động với thời điểm', leftLabel: 'Hoạt động', rightLabel: 'Khi nào', pairs: [['get up', 'in the morning'], ['have lunch', 'at noon'], ['go to bed', 'at night'], ['do homework', 'after school']] }
            ]
        },
        {
            id: 'w8-l2', order: 2, title: 'I / You / We / They + động từ',
            topic: 'V1', desc: 'Với các chủ ngữ này, động từ giữ nguyên.',
            items: [
                { kind: 'choice', prompt: 'Thì Hiện tại đơn dùng để nói về điều gì?', emoji: '🔁', opts: ['việc đang xảy ra ngay lúc này', 'thói quen, việc lặp đi lặp lại', 'việc đã xong hôm qua'], ans: 1, why: 'Hiện tại đơn tả <b>thói quen</b> và sự thật.' },
                { kind: 'choice', prompt: 'Điền: I ______ to school every day.', emoji: '🏫', opts: ['goes', 'go', 'going'], ans: 1, why: 'Chủ ngữ I → động từ <b>giữ nguyên</b>.' },
                { kind: 'choice', prompt: 'Điền: They ______ football on Sunday.', emoji: '⚽', opts: ['plays', 'play', 'playing'], ans: 1, why: 'They → <b>play</b>, không thêm -s.' },
                { kind: 'choice', prompt: 'Điền: We ______ breakfast at seven.', emoji: '🥣', opts: ['have', 'has', 'having'], ans: 0, why: 'We → <b>have</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '📖', opts: ['I reads books.', 'I read books.', 'I reading books.'], ans: 1, why: 'I + động từ nguyên mẫu: <b>read</b>.' },
                { kind: 'fill', prompt: 'You ______ English very well. (speak)', hint: 'Chia động từ trong ngoặc cho đúng chủ ngữ 👇', emoji: '🗣️', answers: ['speak'], bank: ['speak', 'speaks', 'speaking'] },
                { kind: 'listen', sentence: 'We play football every Sunday.', display: 'We ______ football every Sunday.', emoji: '⚽', answers: ['play'], bank: ['play', 'plays', 'playing'] },
                { kind: 'build', target: 'I go to school every day .', vi: 'Ngày nào tớ cũng đi học.', emoji: '🏫', why: 'I + động từ nguyên mẫu + cụm chỉ tần suất.' }
            ]
        },
        {
            id: 'w8-l3', order: 3, title: 'He / She / It + động từ thêm -s',
            topic: 'V-s', desc: 'Quy tắc quan trọng nhất của Hiện tại đơn.',
            items: [
                { kind: 'choice', prompt: 'Với <b>He, She, It</b> thì động từ thế nào?', emoji: '👦', opts: ['giữ nguyên', 'thêm -s / -es', 'thêm -ing'], ans: 1, why: 'Ngôi thứ ba số ít → động từ <b>thêm -s</b>.' },
                { kind: 'choice', prompt: 'Điền: He ______ football every day.', emoji: '⚽', opts: ['play', 'plays', 'playing'], ans: 1, why: 'He → <b>plays</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ to school by bike.', emoji: '🚲', opts: ['go', 'goes', 'going'], ans: 1, why: 'go → <b>goes</b> (tận cùng -o thì thêm -es).' },
                { kind: 'choice', prompt: 'Điền: My father ______ up at five.', emoji: '⏰', opts: ['get', 'gets', 'getting'], ans: 1, why: 'My father = he → <b>gets</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['She reads books.', 'He plays games.', 'She read books.'], ans: 2, why: 'Phải là "She <b>reads</b> books".' },
                { kind: 'fill', prompt: 'My sister ______ the piano. (play)', hint: 'Chia động từ trong ngoặc cho đúng chủ ngữ 👇', emoji: '🎹', answers: ['plays'], bank: ['play', 'plays', 'playing'] },
                { kind: 'listen', sentence: 'He goes to bed at nine.', display: 'He ______ to bed at nine.', emoji: '🛏️', answers: ['goes'], bank: ['go', 'goes', 'going'] },
                { kind: 'build', target: 'She gets up at six .', vi: 'Bạn ấy dậy lúc sáu giờ.', emoji: '⏰', why: 'She + động từ thêm -s.' },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'Động từ GIỮ NGUYÊN', rightLabel: 'Động từ THÊM -S', pairs: [['I', 'He'], ['They', 'She'], ['We', 'My mother']] }
            ]
        },
        {
            id: 'w8-l4', order: 4, title: 'Quy tắc thêm -es và -ies',
            topic: 'Rules', desc: 'Không phải động từ nào cũng chỉ thêm -s.',
            items: [
                { kind: 'choice', prompt: 'Động từ tận cùng <b>-ch, -sh, -x, -s, -o</b> thì thêm gì?', emoji: '📏', opts: ['-s', '-es', '-ies'], ans: 1, why: 'watch → watch<b>es</b>, go → go<b>es</b>.' },
                { kind: 'choice', prompt: 'Chia: She ______ TV. (watch)', emoji: '📺', opts: ['watchs', 'watches', 'watchies'], ans: 1, why: 'Tận cùng -ch → thêm <b>-es</b>: watches.' },
                { kind: 'choice', prompt: 'Chia: He ______ his teeth. (brush)', emoji: '🪥', opts: ['brushs', 'brushes', 'brushies'], ans: 1, why: 'Tận cùng -sh → <b>brushes</b>.' },
                { kind: 'choice', prompt: 'Phụ âm + <b>y</b> thì đổi thế nào?', emoji: '📏', opts: ['thêm -s', 'đổi y thành i rồi thêm -es', 'thêm -ing'], ans: 1, why: 'study → stud<b>ies</b>, fly → fl<b>ies</b>.' },
                { kind: 'choice', prompt: 'Chia: She ______ English. (study)', emoji: '📖', opts: ['studys', 'studies', 'studyes'], ans: 1, why: 'phụ âm + y → bỏ y thêm <b>-ies</b>: studies.' },
                { kind: 'choice', prompt: 'Chia: He ______ football. (play)', emoji: '⚽', opts: ['plaies', 'plays', 'playes'], ans: 1, why: 'Nguyên âm + y (a-y) thì chỉ thêm <b>-s</b>: plays.' },
                { kind: 'fill', prompt: 'Tom ______ his teeth every night. (brush)', hint: 'Chia động từ trong ngoặc 👇', emoji: '🪥', answers: ['brushes'], bank: ['brushes', 'brushs', 'brush'] },
                { kind: 'fill', prompt: 'My sister ______ hard. (study)', hint: 'Chia động từ trong ngoặc 👇', emoji: '📖', answers: ['studies'], bank: ['studies', 'studys', 'study'] },
                { kind: 'sort', title: 'Xếp động từ vào đúng nhóm', leftLabel: 'Thêm -s', rightLabel: 'Thêm -es', pairs: [['play', 'watch'], ['read', 'go'], ['run', 'brush']] }
            ]
        },
        {
            id: 'w8-l5', order: 5, title: '🔄 Ôn tập: Chia động từ Hiện tại đơn',
            topic: 'Review', desc: 'Ôn lại toàn bộ quy tắc chia động từ.',
            items: [
                { kind: 'choice', prompt: 'Điền: They ______ to music. (listen)', emoji: '🎧', opts: ['listens', 'listen', 'listening'], ans: 1, why: 'They → giữ nguyên <b>listen</b>.' },
                { kind: 'choice', prompt: 'Điền: My mother ______ dinner. (cook)', emoji: '🍳', opts: ['cook', 'cooks', 'cookes'], ans: 1, why: 'my mother = she → <b>cooks</b>.' },
                { kind: 'choice', prompt: 'Điền: He ______ TV after school. (watch)', emoji: '📺', opts: ['watchs', 'watches', 'watch'], ans: 1, why: 'Tận cùng -ch → <b>watches</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['She studies English.', 'He goes to school.', 'They plays football.'], ans: 2, why: 'They → phải là "They <b>play</b>".' },
                { kind: 'fill', prompt: 'Nam ______ to school at seven. (go)', hint: 'Chia động từ trong ngoặc 👇', emoji: '🏫', answers: ['goes'], bank: ['goes', 'go', 'gos'] },
                { kind: 'listen', sentence: 'My mother cooks dinner every evening.', display: 'My mother ______ dinner every evening.', emoji: '🍳', answers: ['cooks'], bank: ['cook', 'cooks', 'cooking'] },
                { kind: 'build', target: 'He watches TV every evening .', vi: 'Tối nào cậu ấy cũng xem TV.', emoji: '📺', why: 'He + watches (thêm -es).' },
                { kind: 'match', title: 'Nối động từ với dạng ngôi thứ ba', leftLabel: 'Nguyên mẫu', rightLabel: 'Thêm đuôi', pairs: [['play', 'plays'], ['watch', 'watches'], ['study', 'studies'], ['go', 'goes']] },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '✅ Đúng', rightLabel: '❌ Sai', pairs: [['She goes home.', 'She go home.'], ['I play games.', 'I plays games.'], ['He studies math.', 'He studys math.']] }
            ]
        },
        {
            id: 'w8-l6', order: 6, title: "Phủ định: don't / doesn't",
            topic: 'Negative', desc: 'Nói mình KHÔNG làm việc gì.',
            items: [
                { kind: 'choice', prompt: 'Chủ ngữ I / You / We / They dùng gì?', emoji: '🚫', opts: ["don't", "doesn't", 'didn\'t'], ans: 0, why: "I, you, we, they → <b>don't</b>." },
                { kind: 'choice', prompt: 'Chủ ngữ He / She / It dùng gì?', emoji: '🚫', opts: ["don't", "doesn't", 'didn\'t'], ans: 1, why: "he, she, it → <b>doesn't</b>." },
                { kind: 'choice', prompt: "Sau <b>doesn't</b> động từ thế nào?", emoji: '💡', opts: ['giữ nguyên', 'thêm -s', 'thêm -ing'], ans: 0, why: "doesn't đã gánh chữ -s rồi nên động từ về <b>nguyên mẫu</b>." },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🥛', opts: ["She doesn't likes milk.", "She doesn't like milk.", "She don't like milk."], ans: 1, why: "she → doesn't + động từ nguyên mẫu <b>like</b>." },
                { kind: 'choice', prompt: 'Điền: We ______ go to school on Sunday.', emoji: '📅', opts: ["don't", "doesn't", 'didn\'t'], ans: 0, why: "We → <b>don't</b>." },
                { kind: 'fill', prompt: "He ______ like carrots.", hint: "Điền don't hoặc doesn't 👇", emoji: '🥕', answers: ["doesn't", 'does not'], bank: ["don't", "doesn't"] },
                { kind: 'listen', sentence: "I don't like milk.", display: "I ______ like milk.", emoji: '🥛', answers: ["don't", 'do not'], bank: ["don't", "doesn't"] },
                { kind: 'build', target: "She doesn't watch TV .", vi: 'Bạn ấy không xem TV.', emoji: '📺', why: "She + doesn't + động từ nguyên mẫu." },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: "don't", rightLabel: "doesn't", pairs: [['I', 'He'], ['They', 'She'], ['We', 'My father']] }
            ]
        },
        {
            id: 'w8-l7', order: 7, title: 'Câu hỏi: Do / Does ...?',
            topic: 'Questions', desc: 'Đặt câu hỏi có/không với Hiện tại đơn.',
            items: [
                { kind: 'choice', prompt: 'Hỏi với I / you / we / they dùng từ nào?', emoji: '❓', opts: ['Do', 'Does', 'Did'], ans: 0, why: '<b>Do</b> you like...?' },
                { kind: 'choice', prompt: 'Hỏi với he / she / it dùng từ nào?', emoji: '❓', opts: ['Do', 'Does', 'Did'], ans: 1, why: '<b>Does</b> he like...?' },
                { kind: 'choice', prompt: 'Sau <b>Does</b> động từ thế nào?', emoji: '💡', opts: ['giữ nguyên', 'thêm -s', 'thêm -ing'], ans: 0, why: 'Does he <b>play</b>? — không phải "plays".' },
                { kind: 'choice', prompt: 'Điền: ______ you like apples?', emoji: '🍎', opts: ['Do', 'Does', 'Are'], ans: 0, why: 'you → <b>Do</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ he play games?', emoji: '🎮', opts: ['Do', 'Does', 'Is'], ans: 1, why: 'he → <b>Does</b>.' },
                { kind: 'choice', prompt: 'Trả lời ngắn cho "Does she like cats?" khi ĐÚNG:', emoji: '✅', opts: ['Yes, she does.', 'Yes, she is.', 'Yes, she likes.'], ans: 0, why: 'Hỏi bằng does thì đáp bằng <b>does</b>.' },
                { kind: 'fill', prompt: '______ your brother play football?', hint: 'Điền Do hoặc Does 👇', emoji: '⚽', answers: ['Does', 'does'], bank: ['Do', 'Does'] },
                { kind: 'listen', sentence: 'Do you go to school by bike?', display: '______ you go to school by bike?', emoji: '🚲', answers: ['Do', 'do'], bank: ['Do', 'Does'] },
                { kind: 'build', target: 'Does she like ice cream ?', vi: 'Bạn ấy có thích kem không?', emoji: '🍦', why: 'Does + chủ ngữ + động từ nguyên mẫu + ?' }
            ]
        },
        {
            id: 'w8-l8', order: 8, title: 'Trạng từ tần suất',
            topic: 'Frequency', desc: 'Always, usually, often, sometimes, never.',
            items: [
                { kind: 'card', w: { w: 'Always', ipa: '/ˈɔːl.weɪz/', vi: 'luôn luôn (100%)', emoji: '💯', ex: 'I always brush my teeth.', exVi: 'Tớ luôn đánh răng.' } },
                { kind: 'card', w: { w: 'Sometimes', ipa: '/ˈsʌm.taɪmz/', vi: 'thỉnh thoảng', emoji: '🔀', ex: 'I sometimes play chess.', exVi: 'Thỉnh thoảng tớ chơi cờ.' } },
                { kind: 'card', w: { w: 'Never', ipa: '/ˈnev.ər/', vi: 'không bao giờ (0%)', emoji: '🚫', ex: 'I never eat snails.', exVi: 'Tớ không bao giờ ăn ốc sên.' } },
                { kind: 'choice', prompt: '<b>Always</b> nghĩa là gì?', emoji: '💯', opts: ['không bao giờ', 'luôn luôn', 'thỉnh thoảng'], ans: 1, why: '<b>Always</b> = luôn luôn.' },
                { kind: 'choice', prompt: 'Trạng từ tần suất đứng ở đâu?', emoji: '📍', opts: ['trước động từ thường', 'sau động từ thường', 'cuối câu'], ans: 0, why: 'I <b>always</b> get up early — đứng trước động từ thường.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '📚', opts: ['I read always books.', 'I always read books.', 'Always I read books.'], ans: 1, why: 'Trạng từ tần suất đứng <b>trước</b> động từ thường.' },
                { kind: 'choice', prompt: 'Với động từ <b>to be</b> thì trạng từ đứng ở đâu?', emoji: '💡', opts: ['trước to be', 'sau to be', 'cuối câu'], ans: 1, why: 'He is <b>always</b> happy — đứng <b>sau</b> to be.' },
                { kind: 'fill', prompt: 'I ______ eat snails. (không bao giờ)', hint: 'Điền trạng từ tần suất 👇', emoji: '🐌', answers: ['never'], bank: ['never', 'always', 'sometimes'] },
                { kind: 'sort', title: 'Xếp theo mức độ thường xuyên', leftLabel: '💯 Rất hay làm', rightLabel: '🚫 Ít hoặc không làm', pairs: [['always', 'never'], ['usually', 'rarely'], ['often', 'sometimes']] }
            ]
        },
        {
            id: 'w8-l9', order: 9, title: '📔 Bài đọc: My Day',
            topic: 'Reading', desc: 'Đọc về một ngày của bạn Mai rồi trả lời câu hỏi.',
            passage: {
                title: "Mai's Day",
                pics: ['⏰', '🏫', '🍚', '🛏️'],
                text: 'My name is Mai. I am nine years old.<br>I <b>get up</b> at six o clock every morning. I <b>brush</b> my teeth and <b>wash</b> my face.<br>I <b>have</b> breakfast at half past six. My mother <b>cooks</b> rice and eggs.<br>I <b>go</b> to school at seven. My school <b>starts</b> at half past seven.<br>After school, I <b>do</b> my homework. Then I <b>play</b> with my little brother.<br>I <b>go</b> to bed at nine o clock. I never watch TV after eight.',
                plain: 'My name is Mai. I am nine years old. I get up at six o clock every morning. I brush my teeth and wash my face. I have breakfast at half past six. My mother cooks rice and eggs. I go to school at seven. My school starts at half past seven. After school, I do my homework. Then I play with my little brother. I go to bed at nine o clock. I never watch TV after eight.'
            },
            items: [
                { kind: 'choice', prompt: 'Mai bao nhiêu tuổi?', emoji: '🎂', opts: ['eight', 'nine', 'ten'], ans: 1, why: '"I am <b>nine</b> years old."' },
                { kind: 'choice', prompt: 'Mai thức dậy lúc mấy giờ?', emoji: '⏰', opts: ['at six', 'at seven', 'at nine'], ans: 0, why: '"I get up <b>at six</b> o clock."' },
                { kind: 'choice', prompt: 'Ai nấu bữa sáng?', emoji: '🍳', opts: ['Mai', 'her mother', 'her brother'], ans: 1, why: '"My <b>mother</b> cooks rice and eggs."' },
                { kind: 'choice', prompt: 'Sau giờ học Mai làm gì trước?', emoji: '📝', opts: ['plays with her brother', 'watches TV', 'does her homework'], ans: 2, why: '"After school, I <b>do my homework</b>. Then I play..."' },
                { kind: 'choice', prompt: 'Mai đi ngủ lúc mấy giờ?', emoji: '🛏️', opts: ['at eight', 'at nine', 'at ten'], ans: 1, why: '"I go to bed at <b>nine</b> o clock."' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b> theo bài đọc?', opts: ['Mai never watches TV after eight.', 'Mai always watches TV at night.', 'Mai watches TV at nine.'], ans: 0, why: '"I <b>never</b> watch TV after eight."' },
                { kind: 'fill', prompt: 'Mai ______ to school at seven. (go)', hint: 'Chia động từ theo bài đọc 👇', emoji: '🏫', answers: ['goes'], bank: ['goes', 'go', 'going'] },
                { kind: 'listen', sentence: 'She brushes her teeth every morning.', display: 'She ______ her teeth every morning.', emoji: '🪥', answers: ['brushes'], bank: ['brush', 'brushes', 'brushing'] },
                { kind: 'build', target: 'Mai gets up at six .', vi: 'Mai dậy lúc sáu giờ.', emoji: '⏰', why: 'Mai = she → gets (thêm -s).' }
            ]
        },
        {
            id: 'w8-l10', order: 10, title: '👑 Boss: Routine Star', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp cả thì Hiện tại đơn, kèm bài đọc mới.',
            passage: {
                title: "Ba's Weekend",
                pics: ['🌅', '⚽', '📚', '🍜'],
                text: 'Ba is my best friend. He lives near my house.<br>On Saturday he <b>gets</b> up late, at eight o clock.<br>He <b>doesn\'t go</b> to school on Saturday. He <b>plays</b> football with his friends in the morning.<br>In the afternoon he <b>reads</b> comic books. He <b>doesn\'t watch</b> TV very much.<br>His mother <b>cooks</b> pho for lunch. Ba <b>loves</b> pho!<br>On Sunday he <b>visits</b> his grandmother. She <b>lives</b> in the countryside.',
                plain: "Ba is my best friend. He lives near my house. On Saturday he gets up late, at eight o clock. He doesn't go to school on Saturday. He plays football with his friends in the morning. In the afternoon he reads comic books. He doesn't watch TV very much. His mother cooks pho for lunch. Ba loves pho! On Sunday he visits his grandmother. She lives in the countryside."
            },
            items: [
                { kind: 'choice', prompt: 'Thứ Bảy Ba dậy lúc mấy giờ?', emoji: '🌅', opts: ['at six', 'at seven', 'at eight'], ans: 2, why: '"he gets up late, <b>at eight</b> o clock."' },
                { kind: 'choice', prompt: 'Buổi sáng thứ Bảy Ba làm gì?', emoji: '⚽', opts: ['plays football', 'reads books', 'visits his grandmother'], ans: 0, why: '"He <b>plays football</b> with his friends in the morning."' },
                { kind: 'choice', prompt: 'Chủ nhật Ba làm gì?', emoji: '👵', opts: ['plays football', 'visits his grandmother', 'goes to school'], ans: 1, why: '"On Sunday he <b>visits his grandmother</b>."' },
                { kind: 'choice', prompt: 'Điền: My brother ______ his homework every evening.', emoji: '📝', opts: ['do', 'does', 'doing'], ans: 1, why: 'my brother = he → <b>does</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ study on Sunday.', emoji: '🚫', opts: ["don't", "doesn't", "isn't"], ans: 1, why: "she → <b>doesn't</b> + động từ nguyên mẫu." },
                { kind: 'choice', prompt: 'Điền: ______ they live in Hanoi?', emoji: '❓', opts: ['Do', 'Does', 'Are'], ans: 0, why: 'they → <b>Do</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['He studies English.', 'She watches TV.', 'He don\'t like fish.'], ans: 2, why: "he → phải là \"He <b>doesn't</b> like fish\"." },
                { kind: 'choice', prompt: 'Chia: My sister ______ the piano. (play)', emoji: '🎹', opts: ['play', 'plays', 'playes'], ans: 1, why: 'Nguyên âm + y → chỉ thêm -s: <b>plays</b>.' },
                { kind: 'fill', prompt: 'Ba ______ comic books in the afternoon. (read)', hint: 'Chia động từ theo bài đọc 👇', emoji: '📚', answers: ['reads'], bank: ['reads', 'read', 'reading'] },
                { kind: 'listen', sentence: "He doesn't watch TV very much.", display: "He ______ watch TV very much.", emoji: '📺', answers: ["doesn't", 'does not'], bank: ["don't", "doesn't"] },
                { kind: 'build', target: 'She does not like fish .', vi: 'Bạn ấy không thích cá.', emoji: '🐟', why: 'Dạng đầy đủ của doesn\'t là <b>does not</b>.' },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '✅ Đúng', rightLabel: '❌ Sai', pairs: [['He goes to school.', 'He go to school.'], ["She doesn't like milk.", "She don't like milk."], ['Does he play?', 'Does he plays?']] }
            ]
        }
    ]
},
/* ===================== WORLD 9 — A1 Movers =====================
   Lớp 3. Hiện tại tiếp diễn, và điều quan trọng nhất của thế giới này là bài
   cuối: phân biệt nó với Hiện tại đơn — chỗ học sinh hay lẫn nhất. */
{
    id: 'world-9', order: 9,
    title: '🏃 Doing Things Now',
    subtitle: 'Thì Hiện Tại Tiếp Diễn (Present Continuous)',
    grade: 'Lớp 3', gradeMin: 3, gradeMax: 3,
    icon: '🏃', color: '#a3357f',
    levels: [
        {
            id: 'w9-l1', order: 1, title: 'Quy tắc thêm -ing',
            topic: 'V-ing', desc: 'Cách biến động từ thành dạng -ing.',
            items: [
                { kind: 'choice', prompt: 'Dạng -ing của <b>play</b> là gì?', emoji: '⚽', opts: ['playing', 'plaing', 'playling'], ans: 0, why: 'Bình thường chỉ thêm -ing: <b>playing</b>.' },
                { kind: 'choice', prompt: 'Động từ tận cùng bằng <b>e</b> câm thì sao?', emoji: '📏', opts: ['giữ nguyên e', 'bỏ e rồi thêm -ing', 'gấp đôi e rồi thêm -ing'], ans: 1, why: 'write → writ<b>ing</b>, make → mak<b>ing</b>.' },
                { kind: 'choice', prompt: 'Dạng -ing của <b>write</b> là gì?', emoji: '✍️', opts: ['writeing', 'writing', 'writting'], ans: 1, why: 'Bỏ e rồi thêm -ing: <b>writing</b>.' },
                { kind: 'choice', prompt: 'Dạng -ing của <b>run</b> là gì?', emoji: '🏃', opts: ['runing', 'running', 'runnning'], ans: 1, why: 'Một nguyên âm + một phụ âm cuối → <b>gấp đôi</b> phụ âm: running.' },
                { kind: 'choice', prompt: 'Dạng -ing của <b>swim</b> là gì?', emoji: '🏊', opts: ['swiming', 'swimming', 'swimmming'], ans: 1, why: 'Gấp đôi m: <b>swimming</b>.' },
                { kind: 'fill', prompt: 'Dạng -ing của <b>sit</b> là ______.', hint: 'Gõ dạng -ing của động từ 👇', emoji: '🪑', answers: ['sitting'], bank: ['sitting', 'siting', 'sittting'] },
                { kind: 'fill', prompt: 'Dạng -ing của <b>read</b> là ______.', hint: 'Gõ dạng -ing của động từ 👇', emoji: '📖', answers: ['reading'], bank: ['reading', 'readding', 'reding'] },
                { kind: 'sort', title: 'Xếp động từ vào đúng nhóm', leftLabel: 'Chỉ thêm -ing', rightLabel: 'Gấp đôi phụ âm', pairs: [['play', 'run'], ['read', 'swim'], ['go', 'sit']] },
                { kind: 'match', title: 'Nối động từ với dạng -ing', leftLabel: 'Nguyên mẫu', rightLabel: '-ing', pairs: [['write', 'writing'], ['run', 'running'], ['play', 'playing'], ['make', 'making']] }
            ]
        },
        {
            id: 'w9-l2', order: 2, title: 'I am + V-ing',
            topic: 'Continuous', desc: 'Nói việc mình đang làm ngay lúc này.',
            items: [
                { kind: 'choice', prompt: 'Hiện tại tiếp diễn dùng để nói gì?', emoji: '⏱️', opts: ['thói quen hằng ngày', 'việc đang xảy ra ngay bây giờ', 'việc đã xong'], ans: 1, why: 'Tiếp diễn tả việc <b>đang diễn ra lúc nói</b>.' },
                { kind: 'choice', prompt: 'Công thức của thì này là gì?', emoji: '📐', opts: ['to be + V-ing', 'do + V', 'V + -s'], ans: 0, why: '<b>am / is / are + động từ đuôi -ing</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ reading a book now.', emoji: '📖', opts: ['am', 'is', 'are'], ans: 0, why: 'I → <b>am</b> + reading.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '✍️', opts: ['I writing now.', 'I am writing now.', 'I am write now.'], ans: 1, why: 'Phải có đủ <b>am</b> lẫn <b>-ing</b>.' },
                { kind: 'choice', prompt: 'Từ nào hay đi cùng thì tiếp diễn?', emoji: '🕐', opts: ['every day', 'now / at the moment', 'yesterday'], ans: 1, why: '<b>now, right now, at the moment</b> là dấu hiệu của tiếp diễn.' },
                { kind: 'fill', prompt: 'I am ______ a picture now. (draw)', hint: 'Chia động từ trong ngoặc sang dạng -ing 👇', emoji: '🎨', answers: ['drawing'], bank: ['drawing', 'draw', 'draws'] },
                { kind: 'listen', sentence: 'I am eating breakfast now.', display: 'I am ______ breakfast now.', emoji: '🥣', answers: ['eating'], bank: ['eating', 'eat', 'eats'] },
                { kind: 'build', target: 'I am reading a book now .', vi: 'Bây giờ tớ đang đọc sách.', emoji: '📖', why: 'I am + V-ing + tân ngữ + now.' }
            ]
        },
        {
            id: 'w9-l3', order: 3, title: 'He / She is + V-ing',
            topic: 'Continuous', desc: 'Tiếp diễn với ngôi thứ ba số ít.',
            items: [
                { kind: 'choice', prompt: 'Điền: She ______ singing a song.', emoji: '🎤', opts: ['am', 'is', 'are'], ans: 1, why: 'She → <b>is</b> + singing.' },
                { kind: 'choice', prompt: 'Điền: He is ______ football. (play)', emoji: '⚽', opts: ['play', 'plays', 'playing'], ans: 2, why: 'Sau to be phải là <b>V-ing</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🏃', opts: ['He is runing.', 'He is running.', 'He running.'], ans: 1, why: 'run → gấp đôi n → <b>running</b>, và cần có is.' },
                { kind: 'choice', prompt: 'Điền: The cat ______ sleeping.', emoji: '🐱', opts: ['is', 'are', 'am'], ans: 0, why: 'The cat = it → <b>is</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['She is dancing.', 'He is swimming.', 'She is dance.'], ans: 2, why: 'Thiếu -ing → phải là "She is <b>dancing</b>".' },
                { kind: 'fill', prompt: 'She is ______ TV now. (watch)', hint: 'Chia động từ trong ngoặc sang dạng -ing 👇', emoji: '📺', answers: ['watching'], bank: ['watching', 'watch', 'watches'] },
                { kind: 'listen', sentence: 'He is swimming in the pool.', display: 'He is ______ in the pool.', emoji: '🏊', answers: ['swimming'], bank: ['swimming', 'swiming', 'swim'] },
                { kind: 'build', target: 'She is singing a song .', vi: 'Bạn ấy đang hát một bài hát.', emoji: '🎤', why: 'She is + V-ing + tân ngữ.' }
            ]
        },
        {
            id: 'w9-l4', order: 4, title: 'We / They are + V-ing',
            topic: 'Continuous', desc: 'Tiếp diễn với chủ ngữ số nhiều.',
            items: [
                { kind: 'choice', prompt: 'Điền: They ______ playing football.', emoji: '⚽', opts: ['is', 'are', 'am'], ans: 1, why: 'They → <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: We ______ studying English.', emoji: '📖', opts: ['are', 'is', 'am'], ans: 0, why: 'We → <b>are</b>.' },
                { kind: 'choice', prompt: 'Điền: The children ______ running.', emoji: '👧', opts: ['is', 'are', 'am'], ans: 1, why: 'children là số nhiều → <b>are</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🎮', opts: ['They is playing.', 'They are playing.', 'They are play.'], ans: 1, why: 'They + <b>are</b> + V-ing.' },
                { kind: 'choice', prompt: 'Điền: Nam and Ba ______ doing homework.', emoji: '📝', opts: ['is', 'are', 'am'], ans: 1, why: 'Hai người = they → <b>are</b>.' },
                { kind: 'fill', prompt: 'They are ______ in the park. (run)', hint: 'Chia động từ trong ngoặc sang dạng -ing 👇', emoji: '🏃', answers: ['running'], bank: ['running', 'runing', 'run'] },
                { kind: 'listen', sentence: 'We are studying English now.', display: 'We ______ studying English now.', emoji: '📖', answers: ['are'], bank: ['is', 'are', 'am'] },
                { kind: 'build', target: 'They are playing in the garden .', vi: 'Các bạn ấy đang chơi ngoài vườn.', emoji: '🌳', why: 'They are + V-ing + nơi chốn.' },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'is + V-ing', rightLabel: 'are + V-ing', pairs: [['He', 'They'], ['She', 'We'], ['The cat', 'The children']] }
            ]
        },
        {
            id: 'w9-l5', order: 5, title: '🔄 Ôn tập: Hiện tại tiếp diễn',
            topic: 'Review', desc: 'Ôn lại công thức và cách thêm -ing.',
            items: [
                { kind: 'choice', prompt: 'Điền: I ______ writing a letter.', emoji: '✉️', opts: ['am', 'is', 'are'], ans: 0, why: 'I → <b>am</b>.' },
                { kind: 'choice', prompt: 'Dạng -ing của <b>sit</b> là gì?', emoji: '🪑', opts: ['siting', 'sitting', 'siteing'], ans: 1, why: 'Gấp đôi t → <b>sitting</b>.' },
                { kind: 'choice', prompt: 'Điền: The dog ______ eating.', emoji: '🐶', opts: ['is', 'are', 'am'], ans: 0, why: 'The dog = it → <b>is</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['We are dancing.', 'He is reading.', 'They is playing.'], ans: 2, why: 'They → phải là "They <b>are</b> playing".' },
                { kind: 'fill', prompt: 'He is ______ a bike. (ride)', hint: 'Chia động từ trong ngoặc sang dạng -ing 👇', emoji: '🚲', answers: ['riding'], bank: ['riding', 'rideing', 'ride'] },
                { kind: 'listen', sentence: 'The children are singing now.', display: 'The children are ______ now.', emoji: '🎤', answers: ['singing'], bank: ['singing', 'sing', 'sings'] },
                { kind: 'build', target: 'My mother is cooking dinner .', vi: 'Mẹ tớ đang nấu bữa tối.', emoji: '🍳', why: 'Chủ ngữ số ít + is + V-ing.' },
                { kind: 'match', title: 'Nối động từ với dạng -ing', leftLabel: 'Nguyên mẫu', rightLabel: '-ing', pairs: [['sit', 'sitting'], ['ride', 'riding'], ['read', 'reading'], ['swim', 'swimming']] },
                { kind: 'sort', title: 'Xếp câu vào đúng nhóm', leftLabel: '✅ Đúng', rightLabel: '❌ Sai', pairs: [['She is running.', 'She is runing.'], ['They are eating.', 'They is eating.'], ['I am writing.', 'I am writeing.']] }
            ]
        },
        {
            id: 'w9-l6', order: 6, title: 'Phủ định tiếp diễn',
            topic: 'Negative', desc: 'Thêm not vào sau to be.',
            items: [
                { kind: 'choice', prompt: 'Phủ định thì <b>not</b> đặt ở đâu?', emoji: '🚫', opts: ['sau to be', 'trước to be', 'cuối câu'], ans: 0, why: 'is <b>not</b> playing, are <b>not</b> playing.' },
                { kind: 'choice', prompt: 'Điền: He ______ playing now.', emoji: '🚫', opts: ["isn't", "aren't", "doesn't"], ans: 0, why: "He → <b>isn't</b> playing." },
                { kind: 'choice', prompt: 'Điền: They ______ watching TV.', emoji: '📺', opts: ["isn't", "aren't", "don't"], ans: 1, why: "They → <b>aren't</b>." },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '📖', opts: ["She doesn't reading.", "She isn't reading.", "She not reading."], ans: 1, why: "Tiếp diễn phủ định dùng <b>isn't</b> + V-ing, không dùng doesn't." },
                { kind: 'choice', prompt: 'Điền: I ______ sleeping.', emoji: '😴', opts: ["am not", "isn't", "aren't"], ans: 0, why: 'I → <b>am not</b>.' },
                { kind: 'fill', prompt: "The baby ______ crying. (không khóc)", hint: "Điền dạng phủ định của to be 👇", emoji: '👶', answers: ["isn't", 'is not'], bank: ["isn't", "aren't", "am not"] },
                { kind: 'listen', sentence: "They are not playing football.", display: "They are ______ playing football.", emoji: '⚽', answers: ['not'], bank: ['not', 'no', "don't"] },
                { kind: 'build', target: 'She is not watching TV .', vi: 'Bạn ấy không đang xem TV.', emoji: '📺', why: 'Chủ ngữ + is + not + V-ing.' }
            ]
        },
        {
            id: 'w9-l7', order: 7, title: 'What are you doing?',
            topic: 'Questions', desc: 'Hỏi ai đó đang làm gì.',
            items: [
                { kind: 'choice', prompt: 'Hỏi "bạn đang làm gì?" thế nào?', emoji: '❓', opts: ['What do you do?', 'What are you doing?', 'What you doing?'], ans: 1, why: '<b>What are you doing?</b> — tiếp diễn cần to be.' },
                { kind: 'choice', prompt: 'Điền: What ______ she doing?', emoji: '❓', opts: ['is', 'are', 'does'], ans: 0, why: 'she → <b>is</b>.' },
                { kind: 'choice', prompt: 'Trả lời cho "What are you doing?"', emoji: '📖', opts: ['I am reading.', 'I read every day.', 'Yes, I am.'], ans: 0, why: 'Hỏi đang làm gì thì đáp bằng <b>am + V-ing</b>.' },
                { kind: 'choice', prompt: 'Điền: ______ he sleeping?', emoji: '😴', opts: ['Is', 'Are', 'Does'], ans: 0, why: 'he → <b>Is</b> he sleeping?' },
                { kind: 'choice', prompt: 'Trả lời ngắn cho "Are they playing?" khi ĐÚNG:', emoji: '✅', opts: ['Yes, they are.', 'Yes, they do.', 'Yes, they is.'], ans: 0, why: 'Hỏi bằng are thì đáp <b>Yes, they are.</b>' },
                { kind: 'fill', prompt: 'What ______ they doing?', hint: 'Điền dạng đúng của to be 👇', emoji: '❓', answers: ['are'], bank: ['is', 'are', 'am'] },
                { kind: 'listen', sentence: 'What is your sister doing?', display: 'What is your ______ doing?', emoji: '👧', answers: ['sister'], bank: ['sister', 'brother', 'mother'] },
                { kind: 'build', target: 'What are you doing now ?', vi: 'Bây giờ bạn đang làm gì?', emoji: '❓', why: 'What + are + you + V-ing + now?' }
            ]
        },
        {
            id: 'w9-l8', order: 8, title: 'Hiện tại đơn hay Tiếp diễn?',
            topic: 'Compare', desc: 'Chỗ dễ lẫn nhất: khi nào dùng thì nào.',
            items: [
                { kind: 'choice', prompt: '"Every day" là dấu hiệu của thì nào?', emoji: '📅', opts: ['Hiện tại đơn', 'Hiện tại tiếp diễn', 'Quá khứ đơn'], ans: 0, why: 'Việc lặp lại hằng ngày → <b>Hiện tại đơn</b>.' },
                { kind: 'choice', prompt: '"Now / at the moment" là dấu hiệu của thì nào?', emoji: '⏱️', opts: ['Hiện tại đơn', 'Hiện tại tiếp diễn', 'Quá khứ đơn'], ans: 1, why: 'Đang xảy ra lúc nói → <b>Tiếp diễn</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ to school every day.', emoji: '🏫', opts: ['go', 'am going', 'went'], ans: 0, why: 'every day → Hiện tại đơn: <b>go</b>.' },
                { kind: 'choice', prompt: 'Điền: Look! The baby ______.', emoji: '👶', opts: ['cries', 'is crying', 'cried'], ans: 1, why: '"Look!" = ngay lúc này → <b>is crying</b>.' },
                { kind: 'choice', prompt: 'Điền: She usually ______ TV in the evening.', emoji: '📺', opts: ['watches', 'is watching', 'watched'], ans: 0, why: '<b>usually</b> = thói quen → Hiện tại đơn.' },
                { kind: 'choice', prompt: 'Điền: Be quiet! They ______ now.', emoji: '🤫', opts: ['study', 'are studying', 'studied'], ans: 1, why: '<b>now</b> → tiếp diễn.' },
                { kind: 'fill', prompt: 'He ______ football every Sunday. (play)', hint: 'Chọn thì đúng rồi chia động từ 👇', emoji: '⚽', answers: ['plays'], bank: ['plays', 'is playing', 'play'] },
                { kind: 'sort', title: 'Xếp dấu hiệu vào đúng thì', leftLabel: '🔁 Hiện tại đơn', rightLabel: '⏱️ Tiếp diễn', pairs: [['every day', 'now'], ['usually', 'at the moment'], ['always', 'Look!']] },
                { kind: 'build', target: 'She is cooking at the moment .', vi: 'Lúc này bạn ấy đang nấu ăn.', emoji: '🍳', why: 'at the moment → dùng tiếp diễn.' }
            ]
        },
        {
            id: 'w9-l9', order: 9, title: '📔 Bài đọc: At the Park',
            topic: 'Reading', desc: 'Đọc cảnh công viên rồi trả lời — toàn thì tiếp diễn.',
            passage: {
                title: 'At the Park',
                pics: ['🌳', '⚽', '🐶', '🍦'],
                text: 'It is Sunday morning. My family <b>is</b> at the park.<br>My father <b>is reading</b> a newspaper under a big tree.<br>My mother <b>is sitting</b> next to him. She <b>is drinking</b> tea.<br>My brother Nam <b>is playing</b> football with his friends.<br>My little sister <b>is eating</b> ice cream. She <b>is not sharing</b> it with me!<br>Our dog <b>is running</b> after a ball. I <b>am taking</b> photos of everyone.',
                plain: 'It is Sunday morning. My family is at the park. My father is reading a newspaper under a big tree. My mother is sitting next to him. She is drinking tea. My brother Nam is playing football with his friends. My little sister is eating ice cream. She is not sharing it with me. Our dog is running after a ball. I am taking photos of everyone.'
            },
            items: [
                { kind: 'choice', prompt: 'Bố đang làm gì?', emoji: '📰', opts: ['reading a newspaper', 'drinking tea', 'playing football'], ans: 0, why: '"My father is <b>reading a newspaper</b>."' },
                { kind: 'choice', prompt: 'Mẹ đang uống gì?', emoji: '🍵', opts: ['milk', 'tea', 'water'], ans: 1, why: '"She is drinking <b>tea</b>."' },
                { kind: 'choice', prompt: 'Nam đang làm gì?', emoji: '⚽', opts: ['taking photos', 'eating ice cream', 'playing football'], ans: 2, why: '"Nam is <b>playing football</b> with his friends."' },
                { kind: 'choice', prompt: 'Em gái đang ăn gì?', emoji: '🍦', opts: ['ice cream', 'bread', 'an apple'], ans: 0, why: '"My little sister is eating <b>ice cream</b>."' },
                { kind: 'choice', prompt: 'Con chó đang làm gì?', emoji: '🐶', opts: ['sleeping', 'running after a ball', 'eating'], ans: 1, why: '"Our dog is <b>running after a ball</b>."' },
                { kind: 'choice', prompt: 'Người kể chuyện đang làm gì?', emoji: '📷', opts: ['playing football', 'taking photos', 'reading'], ans: 1, why: '"I am <b>taking photos</b> of everyone."' },
                { kind: 'fill', prompt: 'My mother is ______ next to him. (sit)', hint: 'Chia động từ theo bài đọc 👇', emoji: '🪑', answers: ['sitting'], bank: ['sitting', 'siting', 'sit'] },
                { kind: 'listen', sentence: 'Our dog is running after a ball.', display: 'Our dog is ______ after a ball.', emoji: '🐶', answers: ['running'], bank: ['running', 'runing', 'run'] },
                { kind: 'build', target: 'My father is reading a newspaper .', vi: 'Bố tớ đang đọc báo.', emoji: '📰', why: 'Chủ ngữ + is + V-ing + tân ngữ.' }
            ]
        },
        {
            id: 'w9-l10', order: 10, title: '👑 Boss: Action Master', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp tiếp diễn và phân biệt với Hiện tại đơn.',
            passage: {
                title: 'A Busy Classroom',
                pics: ['🏫', '✍️', '🎨', '🎵'],
                text: 'It is ten o clock. Our class <b>is</b> very busy today.<br>The teacher <b>is writing</b> on the board. Some students <b>are copying</b> the words.<br>Lan and Mai <b>are drawing</b> a big picture of a garden.<br>Ba <b>is not doing</b> his work. He <b>is looking</b> out of the window!<br>Usually we <b>study</b> maths at ten, but today we <b>are having</b> an art lesson.<br>Everyone <b>is enjoying</b> it very much.',
                plain: 'It is ten o clock. Our class is very busy today. The teacher is writing on the board. Some students are copying the words. Lan and Mai are drawing a big picture of a garden. Ba is not doing his work. He is looking out of the window. Usually we study maths at ten, but today we are having an art lesson. Everyone is enjoying it very much.'
            },
            items: [
                { kind: 'choice', prompt: 'Cô giáo đang làm gì?', emoji: '✍️', opts: ['writing on the board', 'drawing a picture', 'looking out of the window'], ans: 0, why: '"The teacher is <b>writing on the board</b>."' },
                { kind: 'choice', prompt: 'Lan và Mai đang làm gì?', emoji: '🎨', opts: ['copying words', 'drawing a picture', 'studying maths'], ans: 1, why: '"Lan and Mai are <b>drawing a big picture</b>."' },
                { kind: 'choice', prompt: 'Ba đang làm gì?', emoji: '🪟', opts: ['doing his work', 'looking out of the window', 'drawing'], ans: 1, why: '"He is <b>looking out of the window</b>."' },
                { kind: 'choice', prompt: 'Hôm nay lớp học môn gì?', emoji: '🎨', opts: ['maths', 'art', 'English'], ans: 1, why: '"today we are having an <b>art</b> lesson."' },
                { kind: 'choice', prompt: 'Điền: Look! The cat ______ up the tree.', emoji: '🐱', opts: ['climbs', 'is climbing', 'climbed'], ans: 1, why: '"Look!" → tiếp diễn <b>is climbing</b>.' },
                { kind: 'choice', prompt: 'Điền: We ______ English every Monday.', emoji: '📅', opts: ['study', 'are studying', 'studied'], ans: 0, why: 'every Monday → Hiện tại đơn <b>study</b>.' },
                { kind: 'choice', prompt: 'Dạng -ing của <b>swim</b> là gì?', emoji: '🏊', opts: ['swiming', 'swimming', 'swimeing'], ans: 1, why: 'Gấp đôi m → <b>swimming</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['She is dancing.', 'They are eating.', "He doesn't playing."], ans: 2, why: "Tiếp diễn phủ định dùng <b>isn't playing</b>, không dùng doesn't." },
                { kind: 'fill', prompt: 'Some students are ______ the words. (copy)', hint: 'Chia động từ theo bài đọc 👇', emoji: '✍️', answers: ['copying'], bank: ['copying', 'copyings', 'copy'] },
                { kind: 'listen', sentence: 'The teacher is writing on the board.', display: 'The teacher is ______ on the board.', emoji: '📋', answers: ['writing'], bank: ['writing', 'writeing', 'write'] },
                { kind: 'build', target: 'They are drawing a big picture .', vi: 'Các bạn ấy đang vẽ một bức tranh to.', emoji: '🎨', why: 'They are + V-ing + tân ngữ.' },
                { kind: 'sort', title: 'Xếp dấu hiệu vào đúng thì', leftLabel: '🔁 Hiện tại đơn', rightLabel: '⏱️ Tiếp diễn', pairs: [['every Monday', 'right now'], ['usually', 'Look!'], ['often', 'at the moment']] }
            ]
        }
    ]
},
/* ===================== WORLD 10 — A1 Movers =====================
   Lớp 4. Quá khứ đơn. Chia làm hai nhánh rõ ràng: động từ có quy tắc (thêm
   -ed) và động từ bất quy tắc (phải thuộc lòng). */
{
    id: 'world-10', order: 10,
    title: '🦖 Past Stories',
    subtitle: 'Thì Quá Khứ Đơn (Past Simple)',
    grade: 'Lớp 4', gradeMin: 4, gradeMax: 4,
    icon: '🦖', color: '#5b21b6',
    levels: [
        {
            id: 'w10-l1', order: 1, title: 'Dấu hiệu quá khứ',
            topic: 'Time', desc: 'Yesterday, last night, ago — biết khi nào phải dùng quá khứ.',
            items: [
                { kind: 'card', w: { w: 'Yesterday', ipa: '/ˈjes.tə.deɪ/', vi: 'hôm qua', emoji: '📅', ex: 'I went to the zoo yesterday.', exVi: 'Hôm qua tớ đi sở thú.' } },
                { kind: 'card', w: { w: 'Last night', ipa: '/lɑːst naɪt/', vi: 'tối qua', emoji: '🌙', ex: 'I slept early last night.', exVi: 'Tối qua tớ ngủ sớm.' } },
                { kind: 'card', w: { w: 'Ago', ipa: '/əˈɡəʊ/', vi: 'cách đây (bao lâu)', emoji: '⏳', ex: 'Two days ago I was sick.', exVi: 'Cách đây hai hôm tớ bị ốm.' } },
                { kind: 'choice', prompt: 'Từ nào là dấu hiệu của thì <b>quá khứ</b>?', emoji: '📅', opts: ['every day', 'yesterday', 'now'], ans: 1, why: '<b>Yesterday</b> = hôm qua → chuyện đã xong.' },
                { kind: 'choice', prompt: '<b>Last week</b> nghĩa là gì?', emoji: '📆', opts: ['tuần trước', 'tuần sau', 'tuần này'], ans: 0, why: '<b>Last</b> = trước, vừa qua.' },
                { kind: 'choice', prompt: 'Câu nào nói về quá khứ?', emoji: '⏳', opts: ['I play football every day.', 'I played football yesterday.', 'I am playing football.'], ans: 1, why: 'Có <b>yesterday</b> và động từ <b>played</b>.' },
                { kind: 'choice', prompt: '"Three days ______" nghĩa là "cách đây ba ngày".', emoji: '⏳', opts: ['ago', 'last', 'next'], ans: 0, why: 'Số + đơn vị thời gian + <b>ago</b>.' },
                { kind: 'sort', title: 'Xếp cụm từ vào đúng thì', leftLabel: '🔁 Hiện tại', rightLabel: '⏳ Quá khứ', pairs: [['every day', 'yesterday'], ['now', 'last night'], ['usually', 'two days ago']] },
                { kind: 'match', title: 'Nối cụm thời gian với nghĩa', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['yesterday', 'hôm qua'], ['last night', 'tối qua'], ['last week', 'tuần trước'], ['an hour ago', 'cách đây một tiếng']] }
            ]
        },
        {
            id: 'w10-l2', order: 2, title: 'Was / Were',
            topic: 'To Be Past', desc: 'Dạng quá khứ của am, is, are.',
            items: [
                { kind: 'choice', prompt: 'Quá khứ của <b>am</b> và <b>is</b> là gì?', emoji: '⏳', opts: ['was', 'were', 'been'], ans: 0, why: 'am/is → <b>was</b>.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>are</b> là gì?', emoji: '⏳', opts: ['was', 'were', 'been'], ans: 1, why: 'are → <b>were</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ at home yesterday.', emoji: '🏠', opts: ['was', 'were', 'am'], ans: 0, why: 'I → <b>was</b>.' },
                { kind: 'choice', prompt: 'Điền: They ______ very happy.', emoji: '😀', opts: ['was', 'were', 'been'], ans: 1, why: 'They → <b>were</b>.' },
                { kind: 'choice', prompt: 'Điền: The film ______ very good.', emoji: '🎬', opts: ['were', 'was', 'been'], ans: 1, why: 'The film = it → <b>was</b>.' },
                { kind: 'choice', prompt: 'Phủ định: He ______ at school yesterday.', emoji: '🚫', opts: ["wasn't", "weren't", 'isn\'t'], ans: 0, why: "He → <b>wasn't</b>." },
                { kind: 'fill', prompt: 'We ______ at the zoo last Sunday.', hint: 'Điền was hoặc were 👇', emoji: '🦁', answers: ['were'], bank: ['was', 'were'] },
                { kind: 'listen', sentence: 'She was very tired last night.', display: 'She ______ very tired last night.', emoji: '😴', answers: ['was'], bank: ['was', 'were'] },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'was', rightLabel: 'were', pairs: [['I', 'You'], ['He', 'We'], ['The cat', 'They']] }
            ]
        },
        {
            id: 'w10-l3', order: 3, title: 'Động từ có quy tắc: thêm -ed',
            topic: 'Regular', desc: 'Phần lớn động từ chỉ cần thêm -ed là xong.',
            items: [
                { kind: 'choice', prompt: 'Quá khứ của <b>play</b> là gì?', emoji: '⚽', opts: ['played', 'plaied', 'plaed'], ans: 0, why: 'Thêm -ed: <b>played</b>.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>watch</b> là gì?', emoji: '📺', opts: ['watched', 'watchd', 'watchied'], ans: 0, why: 'Thêm -ed: <b>watched</b>.' },
                { kind: 'choice', prompt: 'Ở quá khứ, mọi chủ ngữ dùng chung một dạng đúng không?', emoji: '💡', opts: ['Đúng', 'Sai, he/she vẫn thêm -s', 'Sai, chỉ I mới đổi'], ans: 0, why: 'Quá khứ đơn <b>không</b> phân biệt ngôi: I played, he played, they played.' },
                { kind: 'choice', prompt: 'Điền: She ______ TV last night.', emoji: '📺', opts: ['watch', 'watches', 'watched'], ans: 2, why: 'last night → quá khứ <b>watched</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '⚽', opts: ['He played football yesterday.', 'He plays football yesterday.', 'He playeds football yesterday.'], ans: 0, why: 'yesterday → <b>played</b>, và quá khứ không thêm -s.' },
                { kind: 'fill', prompt: 'I ______ my homework last night. (finish)', hint: 'Chia động từ trong ngoặc sang quá khứ 👇', emoji: '📝', answers: ['finished'], bank: ['finished', 'finish', 'finishes'] },
                { kind: 'listen', sentence: 'We watched a film yesterday.', display: 'We ______ a film yesterday.', emoji: '🎬', answers: ['watched'], bank: ['watched', 'watch', 'watches'] },
                { kind: 'build', target: 'She played the piano yesterday .', vi: 'Hôm qua bạn ấy chơi đàn piano.', emoji: '🎹', why: 'Chủ ngữ + động từ đuôi -ed + cụm thời gian quá khứ.' }
            ]
        },
        {
            id: 'w10-l4', order: 4, title: 'Quy tắc chính tả khi thêm -ed',
            topic: 'Rules', desc: 'Không phải lúc nào cũng chỉ dán -ed vào đuôi.',
            items: [
                { kind: 'choice', prompt: 'Động từ tận cùng bằng <b>e</b> thì thêm gì?', emoji: '📏', opts: ['-ed', 'chỉ thêm -d', 'gấp đôi phụ âm rồi thêm -ed'], ans: 1, why: 'like → like<b>d</b>, love → love<b>d</b>.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>like</b> là gì?', emoji: '❤️', opts: ['likeed', 'liked', 'likd'], ans: 1, why: 'Đã có e rồi nên chỉ thêm d: <b>liked</b>.' },
                { kind: 'choice', prompt: 'Phụ âm + <b>y</b> thì đổi thế nào?', emoji: '📏', opts: ['thêm -ed', 'đổi y thành i rồi thêm -ed', 'chỉ thêm -d'], ans: 1, why: 'study → stud<b>ied</b>, cry → cr<b>ied</b>.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>study</b> là gì?', emoji: '📖', opts: ['studyed', 'studied', 'studed'], ans: 1, why: 'phụ âm + y → <b>studied</b>.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>stop</b> là gì?', emoji: '🛑', opts: ['stoped', 'stopped', 'stopd'], ans: 1, why: 'Một nguyên âm + một phụ âm → gấp đôi p: <b>stopped</b>.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>play</b> là gì?', emoji: '⚽', opts: ['plaied', 'played', 'playd'], ans: 1, why: 'Nguyên âm + y (a-y) thì chỉ thêm -ed: <b>played</b>.' },
                { kind: 'fill', prompt: 'She ______ hard for the test. (study)', hint: 'Chia động từ trong ngoặc sang quá khứ 👇', emoji: '📖', answers: ['studied'], bank: ['studied', 'studyed', 'study'] },
                { kind: 'fill', prompt: 'The bus ______ at the school. (stop)', hint: 'Chia động từ trong ngoặc sang quá khứ 👇', emoji: '🚌', answers: ['stopped'], bank: ['stopped', 'stoped', 'stop'] },
                { kind: 'sort', title: 'Xếp động từ vào đúng nhóm', leftLabel: 'Chỉ thêm -d', rightLabel: 'Gấp đôi phụ âm + -ed', pairs: [['like', 'stop'], ['love', 'plan'], ['live', 'shop']] }
            ]
        },
        {
            id: 'w10-l5', order: 5, title: '🔄 Ôn tập: Was/Were & -ed',
            topic: 'Review', desc: 'Ôn lại to be quá khứ và động từ có quy tắc.',
            items: [
                { kind: 'choice', prompt: 'Điền: They ______ at the park yesterday.', emoji: '🌳', opts: ['was', 'were', 'been'], ans: 1, why: 'They → <b>were</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ my grandmother last week. (visit)', emoji: '👵', opts: ['visit', 'visited', 'visits'], ans: 1, why: 'last week → <b>visited</b>.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>cry</b> là gì?', emoji: '😢', opts: ['cryed', 'cried', 'cryied'], ans: 1, why: 'phụ âm + y → <b>cried</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['He was happy.', 'They were here.', 'She were tired.'], ans: 2, why: 'She → phải là "She <b>was</b> tired".' },
                { kind: 'fill', prompt: 'We ______ football last Sunday. (play)', hint: 'Chia động từ trong ngoặc sang quá khứ 👇', emoji: '⚽', answers: ['played'], bank: ['played', 'play', 'plaied'] },
                { kind: 'listen', sentence: 'They were at home last night.', display: 'They ______ at home last night.', emoji: '🏠', answers: ['were'], bank: ['was', 'were'] },
                { kind: 'build', target: 'I visited my grandmother last week .', vi: 'Tuần trước tớ đến thăm bà.', emoji: '👵', why: 'Chủ ngữ + động từ -ed + cụm thời gian quá khứ.' },
                { kind: 'match', title: 'Nối động từ với dạng quá khứ', leftLabel: 'Nguyên mẫu', rightLabel: 'Quá khứ', pairs: [['play', 'played'], ['study', 'studied'], ['stop', 'stopped'], ['like', 'liked']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: 'was', rightLabel: 'were', pairs: [['She', 'They'], ['It', 'We'], ['My father', 'My parents']] }
            ]
        },
        {
            id: 'w10-l6', order: 6, title: 'Động từ bất quy tắc (phần 1)',
            topic: 'Irregular', desc: 'Mười động từ bất quy tắc hay gặp nhất.',
            items: [
                { kind: 'choice', prompt: 'Quá khứ của <b>go</b> là gì?', emoji: '🚶', opts: ['goed', 'went', 'gone'], ans: 1, why: 'go → <b>went</b> (quá khứ) → gone (V3).' },
                { kind: 'choice', prompt: 'Quá khứ của <b>eat</b> là gì?', emoji: '🍽️', opts: ['eated', 'ate', 'eaten'], ans: 1, why: 'eat → <b>ate</b> → eaten.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>see</b> là gì?', emoji: '👀', opts: ['seed', 'saw', 'seen'], ans: 1, why: 'see → <b>saw</b> → seen.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>have</b> là gì?', emoji: '🎁', opts: ['haved', 'had', 'has'], ans: 1, why: 'have → <b>had</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ to the zoo yesterday.', emoji: '🦁', opts: ['goed', 'went', 'go'], ans: 1, why: 'go là bất quy tắc → <b>went</b>.' },
                { kind: 'fill', prompt: 'She ______ a big cake yesterday. (make)', hint: 'Chia động từ bất quy tắc sang quá khứ 👇', emoji: '🎂', answers: ['made'], bank: ['made', 'maked', 'make'] },
                { kind: 'listen', sentence: 'We saw a big elephant.', display: 'We ______ a big elephant.', emoji: '🐘', answers: ['saw'], bank: ['saw', 'seed', 'see'] },
                { kind: 'build', target: 'I went to the zoo yesterday .', vi: 'Hôm qua tớ đi sở thú.', emoji: '🦁', why: 'go → went (bất quy tắc).' },
                { kind: 'match', title: 'Nối động từ với dạng quá khứ', leftLabel: 'Nguyên mẫu', rightLabel: 'Quá khứ', pairs: [['go', 'went'], ['eat', 'ate'], ['see', 'saw'], ['have', 'had']] }
            ]
        },
        {
            id: 'w10-l7', order: 7, title: 'Động từ bất quy tắc (phần 2)',
            topic: 'Irregular', desc: 'Thêm mười động từ bất quy tắc nữa.',
            items: [
                { kind: 'choice', prompt: 'Quá khứ của <b>run</b> là gì?', emoji: '🏃', opts: ['runned', 'ran', 'run'], ans: 1, why: 'run → <b>ran</b> → run.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>swim</b> là gì?', emoji: '🏊', opts: ['swimmed', 'swam', 'swum'], ans: 1, why: 'swim → <b>swam</b> → swum.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>write</b> là gì?', emoji: '✍️', opts: ['writed', 'wrote', 'written'], ans: 1, why: 'write → <b>wrote</b> → written.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>drink</b> là gì?', emoji: '🥛', opts: ['drinked', 'drank', 'drunk'], ans: 1, why: 'drink → <b>drank</b> → drunk.' },
                { kind: 'choice', prompt: 'Quá khứ của <b>buy</b> là gì?', emoji: '🛒', opts: ['buyed', 'bought', 'buied'], ans: 1, why: 'buy → <b>bought</b>.' },
                { kind: 'fill', prompt: 'He ______ a letter to his friend. (write)', hint: 'Chia động từ bất quy tắc sang quá khứ 👇', emoji: '✉️', answers: ['wrote'], bank: ['wrote', 'writed', 'write'] },
                { kind: 'listen', sentence: 'They ran in the park.', display: 'They ______ in the park.', emoji: '🏃', answers: ['ran'], bank: ['ran', 'runned', 'run'] },
                { kind: 'build', target: 'She bought a new book .', vi: 'Bạn ấy đã mua một quyển sách mới.', emoji: '📕', why: 'buy → bought.' },
                { kind: 'match', title: 'Nối động từ với dạng quá khứ', leftLabel: 'Nguyên mẫu', rightLabel: 'Quá khứ', pairs: [['run', 'ran'], ['swim', 'swam'], ['write', 'wrote'], ['buy', 'bought']] }
            ]
        },
        {
            id: 'w10-l8', order: 8, title: "Phủ định & câu hỏi: didn't / Did ...?",
            topic: 'Negative', desc: 'Có did rồi thì động từ về nguyên mẫu.',
            items: [
                { kind: 'choice', prompt: 'Phủ định quá khứ dùng từ nào?', emoji: '🚫', opts: ["don't", "doesn't", "didn't"], ans: 2, why: 'Quá khứ → <b>didn\'t</b> cho mọi chủ ngữ.' },
                { kind: 'choice', prompt: "Sau <b>didn't</b> động từ ở dạng nào?", emoji: '💡', opts: ['nguyên mẫu', 'thêm -ed', 'thêm -ing'], ans: 0, why: "didn't đã mang nghĩa quá khứ rồi → động từ về <b>nguyên mẫu</b>." },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '📺', opts: ["I didn't watched TV.", "I didn't watch TV.", "I don't watched TV."], ans: 1, why: "didn't + <b>watch</b> (nguyên mẫu)." },
                { kind: 'choice', prompt: 'Câu hỏi quá khứ mở đầu bằng từ nào?', emoji: '❓', opts: ['Do', 'Does', 'Did'], ans: 2, why: '<b>Did</b> you go...?' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '❓', opts: ['Did you went there?', 'Did you go there?', 'Did you goes there?'], ans: 1, why: 'Did + chủ ngữ + <b>động từ nguyên mẫu</b>.' },
                { kind: 'choice', prompt: 'Trả lời ngắn cho "Did she come?" khi ĐÚNG:', emoji: '✅', opts: ['Yes, she did.', 'Yes, she was.', 'Yes, she came.'], ans: 0, why: 'Hỏi bằng did thì đáp <b>Yes, she did.</b>' },
                { kind: 'fill', prompt: "He ______ go to school yesterday.", hint: "Điền dạng phủ định của quá khứ 👇", emoji: '🚫', answers: ["didn't", 'did not'], bank: ["didn't", "doesn't", "don't"] },
                { kind: 'listen', sentence: 'Did you see the film?', display: '______ you see the film?', emoji: '🎬', answers: ['Did', 'did'], bank: ['Did', 'Do', 'Does'] },
                { kind: 'build', target: 'I did not eat breakfast .', vi: 'Tớ đã không ăn sáng.', emoji: '🥣', why: "Dạng đầy đủ của didn't là <b>did not</b>, sau đó là động từ nguyên mẫu." }
            ]
        },
        {
            id: 'w10-l9', order: 9, title: '📔 Bài đọc: My Holiday',
            topic: 'Reading', desc: 'Đọc nhật ký kỳ nghỉ rồi trả lời — toàn thì quá khứ.',
            passage: {
                title: 'My Holiday in Ha Long Bay',
                pics: ['🚢', '🏝️', '🦐', '📷'],
                text: 'Last summer my family <b>went</b> to Ha Long Bay. We <b>travelled</b> by bus for four hours.<br>The bay <b>was</b> beautiful. There <b>were</b> hundreds of green islands in the blue water.<br>On the first day we <b>took</b> a boat trip. I <b>saw</b> a cave with strange rocks inside.<br>My brother and I <b>swam</b> in the sea. The water <b>was</b> warm.<br>Mum <b>bought</b> fresh seafood and Dad <b>cooked</b> it for dinner. It <b>tasted</b> wonderful!<br>I <b>took</b> many photos, but I <b>did not want</b> to go home.',
                plain: 'Last summer my family went to Ha Long Bay. We travelled by bus for four hours. The bay was beautiful. There were hundreds of green islands in the blue water. On the first day we took a boat trip. I saw a cave with strange rocks inside. My brother and I swam in the sea. The water was warm. Mum bought fresh seafood and Dad cooked it for dinner. It tasted wonderful! I took many photos, but I did not want to go home.'
            },
            items: [
                { kind: 'choice', prompt: 'Gia đình đi đâu?', emoji: '🏝️', opts: ['Da Nang', 'Ha Long Bay', 'Hanoi'], ans: 1, why: '"my family went to <b>Ha Long Bay</b>."' },
                { kind: 'choice', prompt: 'Họ đi bằng phương tiện gì?', emoji: '🚌', opts: ['by bus', 'by plane', 'by train'], ans: 0, why: '"We travelled <b>by bus</b> for four hours."' },
                { kind: 'choice', prompt: 'Nước biển thế nào?', emoji: '🌊', opts: ['cold', 'warm', 'dirty'], ans: 1, why: '"The water was <b>warm</b>."' },
                { kind: 'choice', prompt: 'Ai nấu bữa tối?', emoji: '🍳', opts: ['Mum', 'Dad', 'the brother'], ans: 1, why: '"Mum bought fresh seafood and <b>Dad cooked</b> it."' },
                { kind: 'choice', prompt: 'Bạn nhỏ có muốn về nhà không?', emoji: '🏠', opts: ['Có', 'Không', 'Bài không nói tới'], ans: 1, why: '"I <b>did not want</b> to go home."' },
                { kind: 'choice', prompt: 'Quá khứ của <b>take</b> là gì?', emoji: '📷', opts: ['taked', 'took', 'taken'], ans: 1, why: 'take → <b>took</b> → taken.' },
                { kind: 'fill', prompt: 'My brother and I ______ in the sea. (swim)', hint: 'Chia động từ theo bài đọc 👇', emoji: '🏊', answers: ['swam'], bank: ['swam', 'swimmed', 'swum'] },
                { kind: 'listen', sentence: 'Mum bought fresh seafood.', display: 'Mum ______ fresh seafood.', emoji: '🦐', answers: ['bought'], bank: ['bought', 'buyed', 'buy'] },
                { kind: 'build', target: 'We travelled by bus .', vi: 'Chúng tớ đã đi bằng xe buýt.', emoji: '🚌', why: 'travel → travelled (gấp đôi l theo lối viết Anh-Anh).' }
            ]
        },
        {
            id: 'w10-l10', order: 10, title: '👑 Boss: Dino Past Master', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp toàn bộ thì Quá khứ đơn.',
            passage: {
                title: 'The Dinosaur Museum',
                pics: ['🦖', '🦴', '🏛️', '🎟️'],
                text: 'Last Saturday our class <b>visited</b> the dinosaur museum.<br>We <b>left</b> school at eight and <b>arrived</b> at nine.<br>Inside, we <b>saw</b> a huge T-Rex skeleton. It <b>was</b> twelve metres long!<br>Our teacher <b>told</b> us that dinosaurs <b>lived</b> millions of years ago.<br>Lan <b>drew</b> a picture of a Triceratops. Nam <b>asked</b> the guide many questions.<br>We <b>did not have</b> lunch at the museum. We <b>ate</b> our sandwiches in the park.<br>Everybody <b>enjoyed</b> the trip very much.',
                plain: 'Last Saturday our class visited the dinosaur museum. We left school at eight and arrived at nine. Inside, we saw a huge T-Rex skeleton. It was twelve metres long! Our teacher told us that dinosaurs lived millions of years ago. Lan drew a picture of a Triceratops. Nam asked the guide many questions. We did not have lunch at the museum. We ate our sandwiches in the park. Everybody enjoyed the trip very much.'
            },
            items: [
                { kind: 'choice', prompt: 'Lớp đi đâu?', emoji: '🏛️', opts: ['the zoo', 'the dinosaur museum', 'the park'], ans: 1, why: '"our class visited the <b>dinosaur museum</b>."' },
                { kind: 'choice', prompt: 'Họ tới nơi lúc mấy giờ?', emoji: '🕘', opts: ['at eight', 'at nine', 'at ten'], ans: 1, why: '"arrived <b>at nine</b>."' },
                { kind: 'choice', prompt: 'Bộ xương T-Rex dài bao nhiêu?', emoji: '🦴', opts: ['two metres', 'twelve metres', 'twenty metres'], ans: 1, why: '"It was <b>twelve metres</b> long."' },
                { kind: 'choice', prompt: 'Họ ăn trưa ở đâu?', emoji: '🥪', opts: ['at the museum', 'in the park', 'at school'], ans: 1, why: '"We ate our sandwiches <b>in the park</b>."' },
                { kind: 'choice', prompt: 'Điền: They ______ at the beach last week.', emoji: '🏖️', opts: ['was', 'were', 'been'], ans: 1, why: 'They → <b>were</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ her homework last night. (do)', emoji: '📝', opts: ['did', 'done', 'does'], ans: 0, why: 'do → <b>did</b> ở quá khứ.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ["I didn't go.", 'He went home.', "She didn't went."], ans: 2, why: "Sau didn't phải là <b>go</b>, không phải went." },
                { kind: 'choice', prompt: 'Quá khứ của <b>drink</b> là gì?', emoji: '🥛', opts: ['drinked', 'drank', 'drunk'], ans: 1, why: 'drink → <b>drank</b>.' },
                { kind: 'fill', prompt: 'Our teacher ______ us a story. (tell)', hint: 'Chia động từ bất quy tắc sang quá khứ 👇', emoji: '📖', answers: ['told'], bank: ['told', 'telled', 'tell'] },
                { kind: 'listen', sentence: 'We left school at eight.', display: 'We ______ school at eight.', emoji: '🏫', answers: ['left'], bank: ['left', 'leaved', 'leave'] },
                { kind: 'build', target: 'We did not have lunch there .', vi: 'Chúng tớ đã không ăn trưa ở đó.', emoji: '🥪', why: 'did not + động từ nguyên mẫu.' },
                { kind: 'match', title: 'Nối động từ với dạng quá khứ', leftLabel: 'Nguyên mẫu', rightLabel: 'Quá khứ', pairs: [['tell', 'told'], ['leave', 'left'], ['draw', 'drew'], ['eat', 'ate']] }
            ]
        }
    ]
},
/* ===================== WORLD 11 — A1 Movers → A2 Flyers =====================
   Lớp 4. Hai mảng: nói về tương lai (will / be going to) và so sánh
   (-er / -est, more / most). */
{
    id: 'world-11', order: 11,
    title: '🚀 Tomorrow & Compare',
    subtitle: 'Thì Tương Lai (Will) & So Sánh (-er/-est)',
    grade: 'Lớp 4', gradeMin: 4, gradeMax: 4,
    icon: '🚀', color: '#047857',
    levels: [
        {
            id: 'w11-l1', order: 1, title: 'Will + động từ',
            topic: 'Future', desc: 'Nói về việc sẽ xảy ra.',
            items: [
                { kind: 'card', w: { w: 'Tomorrow', ipa: '/təˈmɒr.əʊ/', vi: 'ngày mai', emoji: '📅', ex: 'I will call you tomorrow.', exVi: 'Mai tớ sẽ gọi cho bạn.' } },
                { kind: 'card', w: { w: 'Next week', ipa: '/nekst wiːk/', vi: 'tuần sau', emoji: '📆', ex: 'We will meet next week.', exVi: 'Tuần sau chúng ta sẽ gặp nhau.' } },
                { kind: 'choice', prompt: 'Sau <b>will</b> động từ ở dạng nào?', emoji: '📐', opts: ['nguyên mẫu', 'thêm -s', 'thêm -ing'], ans: 0, why: 'will + <b>động từ nguyên mẫu</b>: will go, will eat.' },
                { kind: 'choice', prompt: '<b>Will</b> có đổi theo chủ ngữ không?', emoji: '💡', opts: ['Có, he wills', 'Không, luôn là will', 'Có, she willes'], ans: 1, why: '<b>Will</b> dùng chung cho mọi chủ ngữ.' },
                { kind: 'choice', prompt: 'Điền: I ______ visit my grandma tomorrow.', emoji: '👵', opts: ['will', 'wills', 'am'], ans: 0, why: 'I <b>will</b> visit.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '⚽', opts: ['He will plays football.', 'He will play football.', 'He wills play football.'], ans: 1, why: 'will + <b>play</b> (nguyên mẫu).' },
                { kind: 'fill', prompt: 'We ______ go to the beach next summer.', hint: 'Điền trợ động từ chỉ tương lai 👇', emoji: '🏖️', answers: ['will', "'ll"], bank: ['will', 'wills', 'are'] },
                { kind: 'listen', sentence: 'I will call you tomorrow.', display: 'I ______ call you tomorrow.', emoji: '📞', answers: ['will'], bank: ['will', 'am', 'was'] },
                { kind: 'build', target: 'I will visit my grandma tomorrow .', vi: 'Mai tớ sẽ đến thăm bà.', emoji: '👵', why: 'Chủ ngữ + will + động từ nguyên mẫu.' }
            ]
        },
        {
            id: 'w11-l2', order: 2, title: "Won't & câu hỏi Will ...?",
            topic: 'Future', desc: 'Phủ định và câu hỏi ở thì tương lai.',
            items: [
                { kind: 'choice', prompt: 'Phủ định của <b>will</b> là gì?', emoji: '🚫', opts: ["willn't", "won't", "don't will"], ans: 1, why: "will not = <b>won't</b> — viết tắt hơi lạ, phải nhớ." },
                { kind: 'choice', prompt: 'Điền: It ______ rain tomorrow. (trời sẽ không mưa)', emoji: '☀️', opts: ["won't", "doesn't", "isn't"], ans: 0, why: "Tương lai phủ định → <b>won't</b>." },
                { kind: 'choice', prompt: 'Câu hỏi tương lai mở đầu bằng gì?', emoji: '❓', opts: ['Do', 'Will', 'Are'], ans: 1, why: '<b>Will</b> you come?' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '❓', opts: ['Will you come tomorrow?', 'Will you comes tomorrow?', 'Do you will come tomorrow?'], ans: 0, why: 'Will + chủ ngữ + động từ nguyên mẫu.' },
                { kind: 'choice', prompt: 'Trả lời ngắn cho "Will you help me?" khi ĐỒNG Ý:', emoji: '✅', opts: ['Yes, I will.', 'Yes, I do.', 'Yes, I am.'], ans: 0, why: '<b>Yes, I will.</b>' },
                { kind: 'fill', prompt: "She ______ come to the party. (sẽ không đến)", hint: 'Điền dạng phủ định của will 👇', emoji: '🎉', answers: ["won't", 'will not'], bank: ["won't", "doesn't", "isn't"] },
                { kind: 'listen', sentence: 'Will you help me tomorrow?', display: '______ you help me tomorrow?', emoji: '🤝', answers: ['Will', 'will'], bank: ['Will', 'Do', 'Are'] },
                { kind: 'build', target: 'I will not forget you .', vi: 'Tớ sẽ không quên bạn đâu.', emoji: '💚', why: "Dạng đầy đủ của won't là <b>will not</b>." }
            ]
        },
        {
            id: 'w11-l3', order: 3, title: 'Be going to',
            topic: 'Future', desc: 'Nói về dự định đã tính trước.',
            items: [
                { kind: 'choice', prompt: '<b>Be going to</b> dùng khi nào?', emoji: '📋', opts: ['việc đã có kế hoạch trước', 'việc vừa nghĩ ra lúc nói', 'việc đã xảy ra xong'], ans: 0, why: 'going to = <b>đã định sẵn</b>; will thường là quyết định tức thì.' },
                { kind: 'choice', prompt: 'Công thức đúng là gì?', emoji: '📐', opts: ['am/is/are going to + V', 'going to + V', 'will going to + V'], ans: 0, why: 'Phải có to be: I <b>am</b> going to play.' },
                { kind: 'choice', prompt: 'Điền: I ______ going to visit Hue.', emoji: '🏯', opts: ['am', 'is', 'are'], ans: 0, why: 'I → <b>am</b> going to.' },
                { kind: 'choice', prompt: 'Điền: They ______ going to play football.', emoji: '⚽', opts: ['is', 'are', 'am'], ans: 1, why: 'They → <b>are</b> going to.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '📚', opts: ['She going to study.', 'She is going to study.', 'She is going to studies.'], ans: 1, why: 'Đủ to be và động từ nguyên mẫu.' },
                { kind: 'fill', prompt: 'We ______ going to have a picnic.', hint: 'Điền dạng đúng của to be 👇', emoji: '🧺', answers: ['are'], bank: ['am', 'is', 'are'] },
                { kind: 'listen', sentence: 'He is going to buy a new bike.', display: 'He is going to ______ a new bike.', emoji: '🚲', answers: ['buy'], bank: ['buy', 'buys', 'bought'] },
                { kind: 'build', target: 'I am going to play football .', vi: 'Tớ định sẽ đi đá bóng.', emoji: '⚽', why: 'am + going to + động từ nguyên mẫu.' }
            ]
        },
        {
            id: 'w11-l4', order: 4, title: 'So sánh hơn: tính từ ngắn + -er',
            topic: 'Comparative', desc: 'Tall → taller. So sánh hai thứ với nhau.',
            items: [
                { kind: 'choice', prompt: 'So sánh hơn với tính từ <b>ngắn</b> thì thêm gì?', emoji: '📏', opts: ['-er', '-est', 'more'], ans: 0, why: 'tall → tall<b>er</b> (cao hơn).' },
                { kind: 'choice', prompt: 'Sau tính từ so sánh hơn thường có từ nào?', emoji: '🔗', opts: ['than', 'then', 'that'], ans: 0, why: 'A is taller <b>than</b> B.' },
                { kind: 'choice', prompt: 'So sánh hơn của <b>big</b> là gì?', emoji: '🐘', opts: ['biger', 'bigger', 'more big'], ans: 1, why: 'Gấp đôi phụ âm: <b>bigger</b>.' },
                { kind: 'choice', prompt: 'So sánh hơn của <b>happy</b> là gì?', emoji: '😀', opts: ['happyer', 'happier', 'more happy'], ans: 1, why: 'phụ âm + y → đổi y thành i: <b>happier</b>.' },
                { kind: 'choice', prompt: 'Điền: An elephant is ______ than a cat.', emoji: '🐘', opts: ['big', 'bigger', 'biggest'], ans: 1, why: 'So sánh hai con → <b>bigger than</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '🏃', opts: ['He is faster than me.', 'He is more fast than me.', 'He is fastest than me.'], ans: 0, why: 'fast là tính từ ngắn → <b>faster than</b>.' },
                { kind: 'fill', prompt: 'A giraffe is ______ than a horse. (tall)', hint: 'Đổi tính từ trong ngoặc sang so sánh hơn 👇', emoji: '🦒', answers: ['taller'], bank: ['taller', 'tallest', 'more tall'] },
                { kind: 'listen', sentence: 'My brother is taller than me.', display: 'My brother is ______ than me.', emoji: '👦', answers: ['taller'], bank: ['taller', 'tallest', 'tall'] },
                { kind: 'build', target: 'A dog is bigger than a cat .', vi: 'Con chó to hơn con mèo.', emoji: '🐶', why: 'A + is + tính từ-er + than + B.' }
            ]
        },
        {
            id: 'w11-l5', order: 5, title: '🔄 Ôn tập: Tương lai & So sánh hơn',
            topic: 'Review', desc: 'Ôn lại will, be going to và so sánh hơn.',
            items: [
                { kind: 'choice', prompt: 'Điền: We ______ go to the zoo tomorrow.', emoji: '🦁', opts: ['will', 'wills', 'willing'], ans: 0, why: '<b>will</b> + động từ nguyên mẫu.' },
                { kind: 'choice', prompt: 'Điền: She ______ going to sing tonight.', emoji: '🎤', opts: ['am', 'is', 'are'], ans: 1, why: 'She → <b>is</b> going to.' },
                { kind: 'choice', prompt: 'So sánh hơn của <b>hot</b> là gì?', emoji: '🔥', opts: ['hoter', 'hotter', 'more hot'], ans: 1, why: 'Gấp đôi t: <b>hotter</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['He will come.', "She won't come.", 'They will comes.'], ans: 2, why: 'Sau will phải là <b>come</b>, không thêm -s.' },
                { kind: 'fill', prompt: 'Summer is ______ than winter. (hot)', hint: 'Đổi tính từ trong ngoặc sang so sánh hơn 👇', emoji: '☀️', answers: ['hotter'], bank: ['hotter', 'hoter', 'hottest'] },
                { kind: 'listen', sentence: 'It will rain tomorrow.', display: 'It ______ rain tomorrow.', emoji: '🌧️', answers: ['will'], bank: ['will', 'is', 'was'] },
                { kind: 'build', target: 'I am going to study English .', vi: 'Tớ định sẽ học tiếng Anh.', emoji: '📖', why: 'am going to + động từ nguyên mẫu.' },
                { kind: 'match', title: 'Nối tính từ với dạng so sánh hơn', leftLabel: 'Tính từ', rightLabel: 'So sánh hơn', pairs: [['tall', 'taller'], ['big', 'bigger'], ['happy', 'happier'], ['fast', 'faster']] },
                { kind: 'sort', title: 'Xếp cụm thời gian vào đúng nhóm', leftLabel: '⏳ Quá khứ', rightLabel: '🚀 Tương lai', pairs: [['yesterday', 'tomorrow'], ['last week', 'next week'], ['two days ago', 'next summer']] }
            ]
        },
        {
            id: 'w11-l6', order: 6, title: 'So sánh hơn: more + tính từ dài',
            topic: 'Comparative', desc: 'Tính từ dài thì không thêm -er mà dùng more.',
            items: [
                { kind: 'choice', prompt: 'Tính từ <b>dài</b> (từ 2-3 âm tiết) so sánh hơn thế nào?', emoji: '📏', opts: ['thêm -er', 'more + tính từ', 'the most + tính từ'], ans: 1, why: 'beautiful → <b>more beautiful</b>.' },
                { kind: 'choice', prompt: 'So sánh hơn của <b>beautiful</b> là gì?', emoji: '🌸', opts: ['beautifuler', 'more beautiful', 'beautifullest'], ans: 1, why: 'Tính từ dài → <b>more beautiful</b>.' },
                { kind: 'choice', prompt: 'So sánh hơn của <b>expensive</b> là gì?', emoji: '💰', opts: ['expensiver', 'more expensive', 'most expensive'], ans: 1, why: 'Dài → <b>more expensive</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['This book is more interesting.', 'She is more beautiful.', 'He is more taller.'], ans: 2, why: 'tall là tính từ ngắn → chỉ dùng <b>taller</b>, không kèm more.' },
                { kind: 'choice', prompt: 'So sánh hơn của <b>good</b> là gì?', emoji: '👍', opts: ['gooder', 'more good', 'better'], ans: 2, why: 'good là bất quy tắc → <b>better</b>.' },
                { kind: 'choice', prompt: 'So sánh hơn của <b>bad</b> là gì?', emoji: '👎', opts: ['badder', 'worse', 'more bad'], ans: 1, why: 'bad → <b>worse</b> (bất quy tắc).' },
                { kind: 'fill', prompt: 'This film is ______ ______ than that one. (interesting)', hint: 'Tính từ dài — gõ cả cụm so sánh hơn 👇', emoji: '🎬', answers: ['more interesting'], bank: ['more interesting', 'interestinger', 'most interesting'] },
                { kind: 'sort', title: 'Xếp tính từ vào đúng nhóm', leftLabel: 'Thêm -er', rightLabel: 'Dùng more', pairs: [['tall', 'beautiful'], ['fast', 'expensive'], ['big', 'interesting']] },
                { kind: 'build', target: 'This book is more interesting .', vi: 'Quyển sách này thú vị hơn.', emoji: '📕', why: 'more + tính từ dài.' }
            ]
        },
        {
            id: 'w11-l7', order: 7, title: 'So sánh nhất: the + tính từ + -est',
            topic: 'Superlative', desc: 'Nhất trong cả nhóm, từ ba thứ trở lên.',
            items: [
                { kind: 'choice', prompt: 'So sánh nhất với tính từ ngắn thì thêm gì?', emoji: '🏆', opts: ['-er', '-est', 'more'], ans: 1, why: 'tall → the tall<b>est</b>.' },
                { kind: 'choice', prompt: 'Trước tính từ so sánh nhất thường có từ nào?', emoji: '🔗', opts: ['a', 'the', 'than'], ans: 1, why: 'Luôn có <b>the</b>: the tallest, the biggest.' },
                { kind: 'choice', prompt: 'So sánh nhất của <b>big</b> là gì?', emoji: '🐘', opts: ['bigest', 'biggest', 'more big'], ans: 1, why: 'Gấp đôi g: the <b>biggest</b>.' },
                { kind: 'choice', prompt: 'Điền: The elephant is the ______ animal on land.', emoji: '🐘', opts: ['bigger', 'biggest', 'big'], ans: 1, why: 'Nhất trong tất cả → <b>the biggest</b>.' },
                { kind: 'choice', prompt: 'Khi nào dùng so sánh nhất?', emoji: '🏆', opts: ['so sánh 2 thứ', 'so sánh từ 3 thứ trở lên', 'không so sánh gì cả'], ans: 1, why: 'Hai thứ → so sánh hơn; từ ba trở lên → <b>so sánh nhất</b>.' },
                { kind: 'choice', prompt: 'So sánh nhất của <b>good</b> là gì?', emoji: '👍', opts: ['goodest', 'the best', 'the better'], ans: 1, why: 'good → better → <b>the best</b>.' },
                { kind: 'fill', prompt: 'Nam is the ______ boy in my class. (tall)', hint: 'Đổi tính từ trong ngoặc sang so sánh nhất 👇', emoji: '👦', answers: ['tallest'], bank: ['tallest', 'taller', 'most tall'] },
                { kind: 'listen', sentence: 'She is the best student in the class.', display: 'She is the ______ student in the class.', emoji: '🏆', answers: ['best'], bank: ['best', 'better', 'goodest'] },
                { kind: 'build', target: 'This is the biggest cake .', vi: 'Đây là cái bánh to nhất.', emoji: '🎂', why: 'the + tính từ-est + danh từ.' }
            ]
        },
        {
            id: 'w11-l8', order: 8, title: 'So sánh nhất: the most + tính từ dài',
            topic: 'Superlative', desc: 'Tính từ dài dùng the most.',
            items: [
                { kind: 'choice', prompt: 'Tính từ dài ở so sánh nhất dùng gì?', emoji: '📏', opts: ['the ...-est', 'the most + tính từ', 'the more + tính từ'], ans: 1, why: 'the <b>most</b> beautiful.' },
                { kind: 'choice', prompt: 'So sánh nhất của <b>beautiful</b> là gì?', emoji: '🌸', opts: ['the beautifulest', 'the most beautiful', 'the more beautiful'], ans: 1, why: 'Dài → <b>the most beautiful</b>.' },
                { kind: 'choice', prompt: 'Điền: This is the ______ expensive car.', emoji: '🚗', opts: ['more', 'most', 'much'], ans: 1, why: 'So sánh nhất → the <b>most</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['the most difficult', 'the most beautiful', 'the most tallest'], ans: 2, why: 'Không dùng most kèm -est. Chỉ <b>the tallest</b>.' },
                { kind: 'choice', prompt: 'Phân biệt: "more" dùng cho so sánh nào?', emoji: '🔢', opts: ['so sánh hơn (2 thứ)', 'so sánh nhất (3+ thứ)', 'so sánh bằng'], ans: 0, why: '<b>more</b> = hơn (2 thứ); <b>the most</b> = nhất.' },
                { kind: 'fill', prompt: 'Ha Long Bay is the ______ ______ place in Vietnam. (beautiful)', hint: 'Tính từ dài — gõ cả cụm so sánh nhất 👇', emoji: '🏝️', answers: ['most beautiful'], bank: ['most beautiful', 'beautifulest', 'more beautiful'] },
                { kind: 'sort', title: 'Xếp cụm vào đúng nhóm', leftLabel: '➕ So sánh hơn', rightLabel: '🏆 So sánh nhất', pairs: [['taller than', 'the tallest'], ['more beautiful', 'the most beautiful'], ['better than', 'the best']] },
                { kind: 'build', target: 'She is the most beautiful girl .', vi: 'Bạn ấy là cô gái xinh nhất.', emoji: '🌸', why: 'the most + tính từ dài + danh từ.' }
            ]
        },
        {
            id: 'w11-l9', order: 9, title: '📔 Bài đọc: Three Friends',
            topic: 'Reading', desc: 'Đọc rồi so sánh ba bạn nhỏ với nhau.',
            passage: {
                title: 'Three Friends',
                pics: ['👦', '👧', '🧒', '📏'],
                text: 'Nam, Lan and Ba are good friends. They are all in Grade 4.<br>Nam is 130 cm tall. Lan is 135 cm tall. Ba is 142 cm tall.<br>So Lan is <b>taller than</b> Nam, and Ba is <b>the tallest</b> of the three.<br>Nam runs 100 metres in 18 seconds. Lan runs it in 20 seconds. Ba runs it in 17 seconds.<br>Ba is <b>the fastest</b> runner. Lan is <b>slower than</b> Nam.<br>Tomorrow they <b>will take</b> part in the school sports day.<br>Nam says, "I <b>am going to</b> practise every evening!"',
                plain: 'Nam, Lan and Ba are good friends. They are all in Grade 4. Nam is 130 cm tall. Lan is 135 cm tall. Ba is 142 cm tall. So Lan is taller than Nam, and Ba is the tallest of the three. Nam runs 100 metres in 18 seconds. Lan runs it in 20 seconds. Ba runs it in 17 seconds. Ba is the fastest runner. Lan is slower than Nam. Tomorrow they will take part in the school sports day. Nam says, I am going to practise every evening!'
            },
            items: [
                { kind: 'choice', prompt: 'Ai cao nhất?', emoji: '📏', opts: ['Nam', 'Lan', 'Ba'], ans: 2, why: 'Ba cao 142 cm — "Ba is <b>the tallest</b>".' },
                { kind: 'choice', prompt: 'Ai thấp nhất?', emoji: '📏', opts: ['Nam', 'Lan', 'Ba'], ans: 0, why: 'Nam chỉ 130 cm — thấp nhất.' },
                { kind: 'choice', prompt: 'Ai chạy nhanh nhất?', emoji: '🏃', opts: ['Nam', 'Lan', 'Ba'], ans: 2, why: 'Ba chạy 17 giây — "Ba is <b>the fastest</b>".' },
                { kind: 'choice', prompt: 'Ai chạy chậm nhất?', emoji: '🐢', opts: ['Nam', 'Lan', 'Ba'], ans: 1, why: 'Lan mất 20 giây — chậm nhất.' },
                { kind: 'choice', prompt: 'Ngày mai họ sẽ làm gì?', emoji: '🏅', opts: ['take part in sports day', 'go to the zoo', 'study maths'], ans: 0, why: '"they will <b>take part in the school sports day</b>."' },
                { kind: 'choice', prompt: 'Nam định làm gì mỗi tối?', emoji: '💪', opts: ['watch TV', 'practise', 'sleep early'], ans: 1, why: '"I am going to <b>practise</b> every evening."' },
                { kind: 'fill', prompt: 'Lan is ______ than Nam. (tall)', hint: 'Đổi tính từ sang so sánh hơn theo bài đọc 👇', emoji: '📏', answers: ['taller'], bank: ['taller', 'tallest', 'more tall'] },
                { kind: 'listen', sentence: 'Ba is the fastest runner.', display: 'Ba is the ______ runner.', emoji: '🏃', answers: ['fastest'], bank: ['fastest', 'faster', 'fast'] },
                { kind: 'build', target: 'Ba is the tallest boy .', vi: 'Ba là bạn nam cao nhất.', emoji: '👦', why: 'the + tính từ-est + danh từ.' }
            ]
        },
        {
            id: 'w11-l10', order: 10, title: '👑 Boss: Future & Compare', isBoss: true,
            topic: 'Boss', desc: 'Thử thách tổng hợp tương lai và cả ba cấp so sánh.',
            passage: {
                title: 'Our School Trip Next Month',
                pics: ['🚌', '⛰️', '🏖️', '📸'],
                text: 'Next month our class <b>will go</b> on a school trip. We <b>are going to</b> visit Sa Pa.<br>Sa Pa is <b>colder than</b> Hanoi, so we <b>will bring</b> warm coats.<br>Fansipan is <b>the highest</b> mountain in Vietnam. It is <b>more difficult</b> to climb than the small hills near my house.<br>The trip <b>will not be</b> cheap, but our teacher says it <b>will be</b> <b>the best</b> trip of the year.<br>I <b>am going to</b> take my new camera. Lan <b>is going to</b> bring her notebook.<br>We <b>won\'t forget</b> this trip!',
                plain: "Next month our class will go on a school trip. We are going to visit Sa Pa. Sa Pa is colder than Hanoi, so we will bring warm coats. Fansipan is the highest mountain in Vietnam. It is more difficult to climb than the small hills near my house. The trip will not be cheap, but our teacher says it will be the best trip of the year. I am going to take my new camera. Lan is going to bring her notebook. We won't forget this trip!"
            },
            items: [
                { kind: 'choice', prompt: 'Lớp sẽ đi đâu?', emoji: '⛰️', opts: ['Ha Long Bay', 'Sa Pa', 'Da Nang'], ans: 1, why: '"We are going to visit <b>Sa Pa</b>."' },
                { kind: 'choice', prompt: 'Sa Pa so với Hà Nội thì thế nào?', emoji: '🧥', opts: ['hotter', 'colder', 'the same'], ans: 1, why: '"Sa Pa is <b>colder than</b> Hanoi."' },
                { kind: 'choice', prompt: 'Fansipan là gì?', emoji: '⛰️', opts: ['ngọn núi cao nhất Việt Nam', 'một bãi biển', 'một thành phố'], ans: 0, why: '"Fansipan is <b>the highest mountain</b> in Vietnam."' },
                { kind: 'choice', prompt: 'Bạn nhỏ định mang gì?', emoji: '📷', opts: ['a notebook', 'a new camera', 'a warm coat only'], ans: 1, why: '"I am going to take my <b>new camera</b>."' },
                { kind: 'choice', prompt: 'Điền: He ______ come to school tomorrow. (sẽ không đến)', emoji: '🚫', opts: ["won't", "doesn't", "didn't"], ans: 0, why: "Tương lai phủ định → <b>won't</b>." },
                { kind: 'choice', prompt: 'Điền: They ______ going to have a party.', emoji: '🎉', opts: ['is', 'are', 'am'], ans: 1, why: 'They → <b>are</b> going to.' },
                { kind: 'choice', prompt: 'So sánh nhất của <b>good</b> là gì?', emoji: '🏆', opts: ['the goodest', 'the best', 'the better'], ans: 1, why: 'good → better → <b>the best</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['She is taller than me.', 'He is the most tallest.', 'It is more expensive.'], ans: 1, why: 'Không dùng most kèm -est — chỉ <b>the tallest</b>.' },
                { kind: 'fill', prompt: 'Fansipan is the ______ mountain in Vietnam. (high)', hint: 'Đổi tính từ sang so sánh nhất 👇', emoji: '⛰️', answers: ['highest'], bank: ['highest', 'higher', 'most high'] },
                { kind: 'listen', sentence: 'We will bring warm coats.', display: 'We ______ bring warm coats.', emoji: '🧥', answers: ['will'], bank: ['will', 'are', 'were'] },
                { kind: 'build', target: 'I am going to take my camera .', vi: 'Tớ định mang máy ảnh đi.', emoji: '📷', why: 'am going to + động từ nguyên mẫu.' },
                { kind: 'sort', title: 'Xếp cụm vào đúng nhóm', leftLabel: '➕ So sánh hơn', rightLabel: '🏆 So sánh nhất', pairs: [['colder than', 'the highest'], ['more difficult', 'the best'], ['taller than', 'the biggest']] }
            ]
        }
    ]
},
/* ===================== WORLD 12 — A2 Flyers =====================
   Lớp 5. Hiện tại hoàn thành — mức Flyers. Hai bài đọc ở Lv9 và Lv10 vốn đã
   được viết sẵn trong game.js (biến READING / READING2) nhưng chỉ gắn vào
   mảng STATIONS không ai dùng; nay đưa về đúng chỗ của chúng. */
{
    id: 'world-12', order: 12,
    title: '⭐ My Experiences & Ultimate Master',
    subtitle: 'Thì Hiện Tại Hoàn Thành (Present Perfect) & Đấu Trùm Cuối',
    grade: 'Lớp 5', gradeMin: 5, gradeMax: 5,
    icon: '⭐', color: '#8a5a00',
    levels: [
        {
            id: 'w12-l1', order: 1, title: 'Hiện tại hoàn thành là gì?',
            topic: 'Present Perfect', desc: 'Việc đã xảy ra nhưng còn liên quan tới bây giờ.',
            items: [
                { kind: 'choice', prompt: 'Công thức của Hiện tại hoàn thành là gì?', emoji: '📐', opts: ['have/has + V3', 'have/has + V-ing', 'will + V'], ans: 0, why: '<b>have / has + động từ cột 3 (V3)</b>.' },
                { kind: 'choice', prompt: 'Thì này dùng để nói gì?', emoji: '💡', opts: ['việc sẽ xảy ra', 'việc đã xong nhưng còn liên quan tới hiện tại', 'việc đang xảy ra'], ans: 1, why: 'Ví dụ: "I have finished my homework" — làm xong rồi nên <b>bây giờ</b> được đi chơi.' },
                { kind: 'choice', prompt: 'Chủ ngữ nào dùng <b>has</b>?', emoji: '👦', opts: ['I, you, we, they', 'he, she, it', 'chỉ mình I'], ans: 1, why: 'Ngôi thứ ba số ít → <b>has</b>; còn lại dùng have.' },
                { kind: 'choice', prompt: 'Điền: I ______ finished my homework.', emoji: '📝', opts: ['have', 'has', 'am'], ans: 0, why: 'I → <b>have</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ eaten breakfast.', emoji: '🥣', opts: ['have', 'has', 'had'], ans: 1, why: 'She → <b>has</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>đúng</b>?', emoji: '📖', opts: ['He have read the book.', 'He has read the book.', 'He has reading the book.'], ans: 1, why: 'has + <b>read</b> (V3).' },
                { kind: 'fill', prompt: 'They ______ finished their work.', hint: 'Điền have hoặc has 👇', emoji: '✅', answers: ['have'], bank: ['have', 'has'] },
                { kind: 'listen', sentence: 'I have finished my homework.', display: 'I ______ finished my homework.', emoji: '📝', answers: ['have'], bank: ['have', 'has', 'had'] },
                { kind: 'sort', title: 'Xếp chủ ngữ vào đúng nhóm', leftLabel: 'have + V3', rightLabel: 'has + V3', pairs: [['I', 'He'], ['They', 'She'], ['We', 'My mother']] }
            ]
        },
        {
            id: 'w12-l2', order: 2, title: 'V3 của động từ có quy tắc',
            topic: 'V3', desc: 'Động từ có quy tắc thì V2 và V3 giống hệt nhau.',
            items: [
                { kind: 'choice', prompt: 'Với động từ có quy tắc, V3 giống cột nào?', emoji: '📏', opts: ['V1 (nguyên mẫu)', 'V2 (quá khứ)', 'V-ing'], ans: 1, why: 'play – played – <b>played</b>: V2 và V3 giống nhau.' },
                { kind: 'choice', prompt: 'V3 của <b>play</b> là gì?', emoji: '⚽', opts: ['play', 'played', 'playing'], ans: 1, why: 'play – played – <b>played</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>study</b> là gì?', emoji: '📖', opts: ['studyed', 'studied', 'studying'], ans: 1, why: 'phụ âm + y → <b>studied</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>watch</b> là gì?', emoji: '📺', opts: ['watched', 'watchen', 'watching'], ans: 0, why: 'watch – watched – <b>watched</b>.' },
                { kind: 'choice', prompt: 'Điền: She has ______ TV for two hours. (watch)', emoji: '📺', opts: ['watch', 'watched', 'watching'], ans: 1, why: 'has + V3 → <b>watched</b>.' },
                { kind: 'fill', prompt: 'We have ______ English for three years. (study)', hint: 'Chia động từ trong ngoặc sang V3 👇', emoji: '📖', answers: ['studied'], bank: ['studied', 'studyed', 'study'] },
                { kind: 'listen', sentence: 'He has finished his homework.', display: 'He has ______ his homework.', emoji: '✅', answers: ['finished'], bank: ['finished', 'finish', 'finishing'] },
                { kind: 'build', target: 'I have played football today .', vi: 'Hôm nay tớ đã chơi bóng đá.', emoji: '⚽', why: 'have + V3 + cụm thời gian còn liên quan tới hiện tại.' }
            ]
        },
        {
            id: 'w12-l3', order: 3, title: 'V3 bất quy tắc (phần 1)',
            topic: 'V3', desc: 'Mười động từ bất quy tắc quan trọng nhất.',
            items: [
                { kind: 'choice', prompt: 'V3 của <b>eat</b> là gì?', emoji: '🍽️', opts: ['ate', 'eaten', 'eated'], ans: 1, why: 'eat – ate – <b>eaten</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>go</b> là gì?', emoji: '🚶', opts: ['went', 'gone', 'goed'], ans: 1, why: 'go – went – <b>gone</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>see</b> là gì?', emoji: '👀', opts: ['saw', 'seen', 'seed'], ans: 1, why: 'see – saw – <b>seen</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>write</b> là gì?', emoji: '✍️', opts: ['wrote', 'written', 'writed'], ans: 1, why: 'write – wrote – <b>written</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>do</b> là gì?', emoji: '📝', opts: ['did', 'done', 'doed'], ans: 1, why: 'do – did – <b>done</b>.' },
                { kind: 'choice', prompt: 'Điền: I have ______ that film. (see)', emoji: '🎬', opts: ['saw', 'seen', 'see'], ans: 1, why: 'have + V3 → <b>seen</b>.' },
                { kind: 'fill', prompt: 'She has ______ a letter. (write)', hint: 'Chia động từ trong ngoặc sang V3 👇', emoji: '✉️', answers: ['written'], bank: ['written', 'wrote', 'writed'] },
                { kind: 'match', title: 'Nối V1 với V3', leftLabel: 'V1', rightLabel: 'V3', pairs: [['eat', 'eaten'], ['go', 'gone'], ['see', 'seen'], ['write', 'written']] },
                { kind: 'sort', title: 'Xếp vào đúng cột', leftLabel: 'V2 (quá khứ)', rightLabel: 'V3 (phân từ)', pairs: [['ate', 'eaten'], ['went', 'gone'], ['saw', 'seen']] }
            ]
        },
        {
            id: 'w12-l4', order: 4, title: 'V3 bất quy tắc (phần 2)',
            topic: 'V3', desc: 'Thêm mười động từ bất quy tắc nữa.',
            items: [
                { kind: 'choice', prompt: 'V3 của <b>drink</b> là gì?', emoji: '🥛', opts: ['drank', 'drunk', 'drinked'], ans: 1, why: 'drink – drank – <b>drunk</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>swim</b> là gì?', emoji: '🏊', opts: ['swam', 'swum', 'swimmed'], ans: 1, why: 'swim – swam – <b>swum</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>take</b> là gì?', emoji: '📷', opts: ['took', 'taken', 'taked'], ans: 1, why: 'take – took – <b>taken</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>give</b> là gì?', emoji: '🎁', opts: ['gave', 'given', 'gived'], ans: 1, why: 'give – gave – <b>given</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>buy</b> là gì?', emoji: '🛒', opts: ['bought', 'buyed', 'boughten'], ans: 0, why: 'buy – bought – <b>bought</b> (V2 và V3 giống nhau).' },
                { kind: 'choice', prompt: 'V3 của <b>make</b> là gì?', emoji: '🎂', opts: ['maked', 'made', 'maden'], ans: 1, why: 'make – made – <b>made</b>.' },
                { kind: 'fill', prompt: 'They have ______ in the sea. (swim)', hint: 'Chia động từ trong ngoặc sang V3 👇', emoji: '🏊', answers: ['swum'], bank: ['swum', 'swam', 'swimmed'] },
                { kind: 'listen', sentence: 'I have taken many photos.', display: 'I have ______ many photos.', emoji: '📷', answers: ['taken'], bank: ['taken', 'took', 'taked'] },
                { kind: 'match', title: 'Nối V1 với V3', leftLabel: 'V1', rightLabel: 'V3', pairs: [['drink', 'drunk'], ['take', 'taken'], ['give', 'given'], ['make', 'made']] }
            ]
        },
        {
            id: 'w12-l5', order: 5, title: '🔄 Ôn tập: have/has + V3',
            topic: 'Review', desc: 'Ôn lại công thức và các V3 đã học.',
            items: [
                { kind: 'choice', prompt: 'Điền: He ______ gone to school.', emoji: '🏫', opts: ['have', 'has', 'had'], ans: 1, why: 'He → <b>has</b>.' },
                { kind: 'choice', prompt: 'Điền: We have ______ our lunch. (eat)', emoji: '🍚', opts: ['ate', 'eaten', 'eat'], ans: 1, why: 'have + V3 → <b>eaten</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['She has written a letter.', 'They have gone home.', 'He has went home.'], ans: 2, why: 'went là V2 — phải dùng V3 <b>gone</b>.' },
                { kind: 'choice', prompt: 'V3 của <b>read</b> viết thế nào?', emoji: '📖', opts: ['read', 'readed', 'readen'], ans: 0, why: 'read – read – <b>read</b>: viết giống nhau, chỉ đọc khác.' },
                { kind: 'fill', prompt: 'She has ______ a big cake. (make)', hint: 'Chia động từ trong ngoặc sang V3 👇', emoji: '🎂', answers: ['made'], bank: ['made', 'maked', 'make'] },
                { kind: 'listen', sentence: 'They have gone to the park.', display: 'They have ______ to the park.', emoji: '🌳', answers: ['gone'], bank: ['gone', 'went', 'go'] },
                { kind: 'build', target: 'I have done my homework .', vi: 'Tớ đã làm xong bài tập.', emoji: '📝', why: 'have + done (V3 của do).' },
                { kind: 'match', title: 'Nối V1 với V3', leftLabel: 'V1', rightLabel: 'V3', pairs: [['do', 'done'], ['buy', 'bought'], ['see', 'seen'], ['swim', 'swum']] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: 'Có quy tắc (V3 = V2)', rightLabel: 'Bất quy tắc', pairs: [['played', 'gone'], ['studied', 'eaten'], ['watched', 'written']] }
            ]
        },
        {
            id: 'w12-l6', order: 6, title: 'Already / Yet / Just',
            topic: 'Signals', desc: 'Ba trạng từ đi kèm quen thuộc nhất.',
            items: [
                { kind: 'choice', prompt: '<b>Already</b> nghĩa là gì?', emoji: '✅', opts: ['đã ... rồi', 'chưa', 'vừa mới'], ans: 0, why: '<b>Already</b> = đã rồi, dùng trong câu khẳng định.' },
                { kind: 'choice', prompt: '<b>Yet</b> dùng trong câu nào?', emoji: '❓', opts: ['khẳng định', 'phủ định và câu hỏi', 'chỉ dùng trong câu cảm thán'], ans: 1, why: '<b>Yet</b> đứng cuối câu phủ định hoặc câu hỏi: "Have you finished yet?"' },
                { kind: 'choice', prompt: '<b>Just</b> nghĩa là gì?', emoji: '⚡', opts: ['đã lâu rồi', 'vừa mới xong', 'sắp sửa xảy ra'], ans: 1, why: '<b>Just</b> = vừa mới: "I have just eaten."' },
                { kind: 'choice', prompt: 'Already và just đứng ở đâu?', emoji: '📍', opts: ['giữa have/has và V3', 'cuối câu', 'đầu câu'], ans: 0, why: 'I have <b>already</b> eaten. — đứng giữa.' },
                { kind: 'choice', prompt: 'Điền: I have ______ finished my homework.', emoji: '✅', opts: ['yet', 'already', 'never'], ans: 1, why: 'Câu khẳng định → <b>already</b>.' },
                { kind: 'choice', prompt: "Điền: She hasn't come ______.", emoji: '⏳', opts: ['already', 'yet', 'just'], ans: 1, why: 'Câu phủ định, cuối câu → <b>yet</b>.' },
                { kind: 'fill', prompt: 'I have ______ eaten lunch. (vừa mới)', hint: 'Điền trạng từ đúng 👇', emoji: '⚡', answers: ['just'], bank: ['just', 'yet', 'already'] },
                { kind: 'build', target: 'I have already done it .', vi: 'Tớ đã làm xong rồi.', emoji: '✅', why: 'have + already + V3.' },
                { kind: 'sort', title: 'Xếp trạng từ vào đúng loại câu', leftLabel: '✅ Câu khẳng định', rightLabel: '❓ Phủ định / câu hỏi', pairs: [['already', 'yet'], ['just', 'yet (câu hỏi)'], ['ever (trong câu hỏi)', "haven't ... yet"]] }
            ]
        },
        {
            id: 'w12-l7', order: 7, title: 'Since / For',
            topic: 'Signals', desc: 'Since đi với mốc thời gian, for đi với khoảng thời gian.',
            items: [
                { kind: 'choice', prompt: '<b>Since</b> đi với gì?', emoji: '📍', opts: ['mốc thời gian (2020, Monday)', 'khoảng thời gian (2 years)', 'cả hai đều sai'], ans: 0, why: '<b>since</b> = từ khi nào: since 2020, since Monday.' },
                { kind: 'choice', prompt: '<b>For</b> đi với gì?', emoji: '⏱️', opts: ['mốc thời gian', 'khoảng thời gian', 'cả hai đều sai'], ans: 1, why: '<b>for</b> = trong bao lâu: for two years, for an hour.' },
                { kind: 'choice', prompt: 'Điền: I have lived here ______ 2019.', emoji: '🏠', opts: ['for', 'since', 'from'], ans: 1, why: '2019 là một mốc → <b>since</b>.' },
                { kind: 'choice', prompt: 'Điền: She has studied English ______ three years.', emoji: '📖', opts: ['for', 'since', 'from'], ans: 0, why: 'three years là khoảng → <b>for</b>.' },
                { kind: 'choice', prompt: 'Điền: We have known each other ______ we were six.', emoji: '🤝', opts: ['for', 'since', 'from'], ans: 1, why: 'Mốc "we were six" → <b>since</b>.' },
                { kind: 'fill', prompt: 'He has been ill ______ two days.', hint: 'Điền since hoặc for 👇', emoji: '🤒', answers: ['for'], bank: ['for', 'since'] },
                { kind: 'listen', sentence: 'I have lived here since 2019.', display: 'I have lived here ______ 2019.', emoji: '🏠', answers: ['since'], bank: ['since', 'for', 'from'] },
                { kind: 'sort', title: 'Xếp vào đúng nhóm', leftLabel: '📍 SINCE (mốc)', rightLabel: '⏱️ FOR (khoảng)', pairs: [['2020', 'two years'], ['Monday', 'a week'], ['last summer', 'three months']] },
                { kind: 'build', target: 'I have known her for five years .', vi: 'Tớ quen bạn ấy được năm năm rồi.', emoji: '🤝', why: 'have + V3 + for + khoảng thời gian.' }
            ]
        },
        {
            id: 'w12-l8', order: 8, title: 'Hiện tại hoàn thành hay Quá khứ đơn?',
            topic: 'Compare', desc: 'Ranh giới quan trọng nhất ở mức Flyers.',
            items: [
                { kind: 'choice', prompt: 'Câu có <b>yesterday</b> thì dùng thì nào?', emoji: '📅', opts: ['Quá khứ đơn', 'Hiện tại hoàn thành', 'Hiện tại tiếp diễn'], ans: 0, why: 'Thời gian đã xác định rõ → <b>Quá khứ đơn</b>.' },
                { kind: 'choice', prompt: 'Câu có <b>already, yet, just, ever</b> thì dùng thì nào?', emoji: '⚡', opts: ['Quá khứ đơn', 'Hiện tại hoàn thành', 'Hiện tại tiếp diễn'], ans: 1, why: 'Đó là dấu hiệu của <b>Hiện tại hoàn thành</b>.' },
                { kind: 'choice', prompt: 'Điền: I ______ my homework yesterday.', emoji: '📅', opts: ['did', 'have done', 'am doing'], ans: 0, why: 'yesterday → <b>did</b> (Quá khứ đơn).' },
                { kind: 'choice', prompt: 'Điền: I ______ my homework already.', emoji: '✅', opts: ['did', 'have done', 'am doing'], ans: 1, why: 'already → <b>have done</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['I saw him yesterday.', 'I have seen him yesterday.', 'I have just seen him.'], ans: 1, why: 'Không dùng Hiện tại hoàn thành với <b>yesterday</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ to Japan last year.', emoji: '✈️', opts: ['went', 'has gone', 'is going'], ans: 0, why: 'last year → <b>went</b>.' },
                { kind: 'fill', prompt: 'We ______ never been to Sa Pa.', hint: 'Điền have hoặc has 👇', emoji: '⛰️', answers: ['have'], bank: ['have', 'has', 'did'] },
                { kind: 'sort', title: 'Xếp dấu hiệu vào đúng thì', leftLabel: '⏳ Quá khứ đơn', rightLabel: '✅ Hiện tại hoàn thành', pairs: [['yesterday', 'already'], ['last week', 'just'], ['two days ago', 'since 2020']] },
                { kind: 'build', target: 'I have never eaten sushi .', vi: 'Tớ chưa bao giờ ăn sushi.', emoji: '🍣', why: 'have + never + V3.' }
            ]
        },
        {
            id: 'w12-l9', order: 9, title: "📔 Bài đọc: A Busy Sunday",
            topic: 'Reading', desc: 'Bài đọc dài về một ngày Chủ nhật bận rộn, toàn thì Hiện tại hoàn thành.',
            passage: {
                title: "A Busy Sunday at Bo's House",
                pics: ['🎨', '🏊', '🎂', '🎸'],
                text: 'Hello! My name is Bo. What a busy Sunday! My family <b>has done</b> so many things today.<br>My sister Lan <b>has drawn</b> three pictures of our cat, and she <b>has given</b> one of them to me.<br>My brother Nam and I <b>have run</b> around the lake, and after that we <b>have swum</b> for a whole hour.<br>Mum <b>has made</b> a big chocolate cake, and we <b>have already eaten</b> half of it!<br>Dad <b>has bought</b> a new guitar, so the whole family <b>has sung</b> together all afternoon.<br>Grandma <b>has sat</b> in her old chair and <b>has read</b> the newspaper twice. Our lazy dog <b>has slept</b> under the table since lunchtime — he <b>hasn\'t moved</b> at all!<br>I <b>have taken</b> forty photos today, but I <b>haven\'t written</b> my diary yet.',
                plain: "Hello! My name is Bo. What a busy Sunday! My family has done so many things today. My sister Lan has drawn three pictures of our cat, and she has given one of them to me. My brother Nam and I have run around the lake, and after that we have swum for a whole hour. Mum has made a big chocolate cake, and we have already eaten half of it! Dad has bought a new guitar, so the whole family has sung together all afternoon. Grandma has sat in her old chair and has read the newspaper twice. Our lazy dog has slept under the table since lunchtime, he hasn't moved at all! I have taken forty photos today, but I haven't written my diary yet."
            },
            items: [
                { kind: 'choice', prompt: 'Lan đã vẽ mấy bức tranh?', emoji: '🎨', opts: ['two', 'three', 'four'], ans: 1, why: '"Lan has drawn <b>three</b> pictures."' },
                { kind: 'choice', prompt: 'Bo đã chụp bao nhiêu bức ảnh?', emoji: '📷', opts: ['fourteen', 'forty', 'four'], ans: 1, why: '"I have taken <b>forty</b> photos today."' },
                { kind: 'choice', prompt: 'Bố đã mua gì?', emoji: '🎸', opts: ['a new guitar', 'a chocolate cake', 'a newspaper'], ans: 0, why: '"Dad has bought <b>a new guitar</b>."' },
                { kind: 'choice', prompt: 'Con chó đã làm gì?', emoji: '🐶', opts: ['run around the lake', 'slept under the table', 'eaten the cake'], ans: 1, why: '"Our lazy dog has <b>slept under the table</b>."' },
                { kind: 'choice', prompt: 'Bo đã viết nhật ký chưa?', emoji: '📔', opts: ['Rồi', 'Chưa', 'Bài không nói tới'], ans: 1, why: '"I <b>haven\'t written</b> my diary yet."' },
                { kind: 'choice', prompt: 'Bà đã đọc báo mấy lần?', emoji: '📰', opts: ['once', 'twice', 'three times'], ans: 1, why: '"has read the newspaper <b>twice</b>."' },
                { kind: 'choice', prompt: 'V3 của <b>sing</b> trong bài là gì?', emoji: '🎤', opts: ['sang', 'sung', 'singed'], ans: 1, why: 'sing – sang – <b>sung</b>.' },
                { kind: 'fill', prompt: 'Mum has ______ a big chocolate cake. (make)', hint: 'Chia động từ theo bài đọc 👇', emoji: '🎂', answers: ['made'], bank: ['made', 'maked', 'make'] },
                { kind: 'listen', sentence: 'We have already eaten half of it.', display: 'We have already ______ half of it.', emoji: '🍰', answers: ['eaten'], bank: ['eaten', 'ate', 'eat'] },
                { kind: 'build', target: 'I have taken forty photos today .', vi: 'Hôm nay tớ đã chụp bốn mươi bức ảnh.', emoji: '📷', why: 'have + taken (V3 của take).' }
            ]
        },
        {
            id: 'w12-l10', order: 10, title: '👑 Ultimate Boss: English Master', isBoss: true,
            topic: 'Boss', desc: 'Trận cuối của cả hành trình: bài đọc dài và câu hỏi gộp mọi thì đã học.',
            passage: {
                title: "Bo's Summer Trip to Da Nang",
                pics: ['✈️', '🏖️', '⛰️', '📸'],
                text: 'My family <b>has just come</b> back from an exciting trip to Da Nang!<br>We <b>have done</b> so many wonderful things during this vacation.<br>My brother Nam and I <b>have swum</b> in the warm blue sea every morning, and we <b>have found</b> beautiful seashells on the beach.<br>Mum <b>has bought</b> fresh seafood, and she <b>has made</b> delicious meals for everyone.<br>Dad <b>has driven</b> us up to Ba Na Hills, where we <b>have seen</b> the giant Golden Bridge in the clouds.<br>I <b>have taken</b> more than one hundred photos, and I <b>have met</b> friendly children from many different countries.<br>Lan <b>has drawn</b> a beautiful painting of the Dragon Bridge at night.<br>Our whole family <b>has grown</b> closer, and we <b>have known</b> how wonderful traveling together is!',
                plain: 'My family has just come back from an exciting trip to Da Nang! We have done so many wonderful things during this vacation. My brother Nam and I have swum in the warm blue sea every morning, and we have found beautiful seashells on the beach. Mum has bought fresh seafood, and she has made delicious meals for everyone. Dad has driven us up to Ba Na Hills, where we have seen the giant Golden Bridge in the clouds. I have taken more than one hundred photos, and I have met friendly children from many different countries. Lan has drawn a beautiful painting of the Dragon Bridge at night. Our whole family has grown closer, and we have known how wonderful traveling together is!'
            },
            items: [
                { kind: 'choice', prompt: 'Gia đình vừa đi đâu về?', emoji: '✈️', opts: ['Ha Long Bay', 'Da Nang', 'Sa Pa'], ans: 1, why: '"back from an exciting trip to <b>Da Nang</b>."' },
                { kind: 'choice', prompt: 'Bố đã lái xe đưa cả nhà đi đâu?', emoji: '⛰️', opts: ['Ba Na Hills', 'the beach', 'the Dragon Bridge'], ans: 0, why: '"Dad has driven us up to <b>Ba Na Hills</b>."' },
                { kind: 'choice', prompt: 'Bo đã chụp bao nhiêu ảnh?', emoji: '📸', opts: ['forty', 'more than one hundred', 'ten'], ans: 1, why: '"I have taken <b>more than one hundred</b> photos."' },
                { kind: 'choice', prompt: 'Lan đã vẽ gì?', emoji: '🎨', opts: ['the Golden Bridge', 'the Dragon Bridge', 'the sea'], ans: 1, why: '"Lan has drawn a beautiful painting of the <b>Dragon Bridge</b>."' },
                { kind: 'choice', prompt: 'V3 của <b>drive</b> là gì?', emoji: '🚗', opts: ['drove', 'driven', 'drived'], ans: 1, why: 'drive – drove – <b>driven</b>.' },
                { kind: 'choice', prompt: 'Điền: She ______ never been to Japan.', emoji: '🗾', opts: ['have', 'has', 'did'], ans: 1, why: 'She → <b>has</b> never been.' },
                { kind: 'choice', prompt: 'Điền: I ______ my homework two hours ago.', emoji: '⏳', opts: ['finished', 'have finished', 'am finishing'], ans: 0, why: 'two hours ago là thời gian xác định → <b>Quá khứ đơn</b>.' },
                { kind: 'choice', prompt: 'Điền: He has lived here ______ 2018.', emoji: '🏠', opts: ['for', 'since', 'from'], ans: 1, why: '2018 là mốc → <b>since</b>.' },
                { kind: 'choice', prompt: 'Câu nào <b>sai</b>?', opts: ['I have already eaten.', "She hasn't come yet.", 'They have gone yesterday.'], ans: 2, why: 'Không dùng Hiện tại hoàn thành với <b>yesterday</b>.' },
                { kind: 'choice', prompt: 'Điền: We ______ seashells on the beach. (find)', emoji: '🐚', opts: ['have found', 'have finded', 'have find'], ans: 0, why: 'find – found – <b>found</b>.' },
                { kind: 'fill', prompt: 'Dad has ______ us to Ba Na Hills. (drive)', hint: 'Chia động từ theo bài đọc sang V3 👇', emoji: '🚗', answers: ['driven'], bank: ['driven', 'drove', 'drived'] },
                { kind: 'listen', sentence: 'I have met friendly children from many countries.', display: 'I have ______ friendly children from many countries.', emoji: '🌏', answers: ['met'], bank: ['met', 'meeted', 'meet'] },
                { kind: 'build', target: 'My family has just come back .', vi: 'Gia đình tớ vừa mới trở về.', emoji: '✈️', why: 'has + just + come (V3).' },
                { kind: 'match', title: 'Nối V1 với V3 (trận cuối!)', leftLabel: 'V1', rightLabel: 'V3', pairs: [['drive', 'driven'], ['grow', 'grown'], ['know', 'known'], ['find', 'found']] }
            ]
        }
    ]
},
];
