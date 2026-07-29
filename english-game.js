/* =========================================================
   ENGLISH QUEST — Present Perfect (Hiện Tại Hoàn Thành)
   Game học tiếng Anh: từ vựng, nối từ, ghép câu, ngữ pháp,
   nghe điền từ, đọc hiểu và trắc nghiệm tổng hợp.
   ========================================================= */

(() => {
    'use strict';

    /* =====================================================
       1. DỮ LIỆU BÀI HỌC
       ===================================================== */

    const VOCAB = [
        { w: 'eat',    v2: 'ate',    v3: 'eaten',    ipa: '/iːt/',      vi: 'ăn',            emoji: '🍕', ex: 'I have eaten a big pizza.',            exVi: 'Tớ vừa ăn một chiếc pizza to.' },
        { w: 'go',     v2: 'went',   v3: 'gone',     ipa: '/ɡəʊ/',      vi: 'đi',            emoji: '🏖️', ex: 'She has gone to the beach.',           exVi: 'Cô ấy đã đi ra biển rồi.' },
        { w: 'see',    v2: 'saw',    v3: 'seen',     ipa: '/siː/',      vi: 'nhìn thấy',     emoji: '👀', ex: 'We have seen that film twice.',        exVi: 'Chúng tớ đã xem phim đó hai lần.' },
        { w: 'write',  v2: 'wrote',  v3: 'written',  ipa: '/raɪt/',     vi: 'viết',          emoji: '✍️', ex: 'He has written a long letter.',        exVi: 'Cậu ấy đã viết một lá thư dài.' },
        { w: 'read',   v2: 'read',   v3: 'read',     ipa: '/riːd/',     vi: 'đọc',           emoji: '📖', ex: 'They have read this book already.',    exVi: 'Họ đã đọc quyển sách này rồi.' },
        { w: 'drink',  v2: 'drank',  v3: 'drunk',    ipa: '/drɪŋk/',    vi: 'uống',          emoji: '🥤', ex: 'I have drunk three glasses of milk.',  exVi: 'Tớ đã uống ba cốc sữa.' },
        { w: 'buy',    v2: 'bought', v3: 'bought',   ipa: '/baɪ/',      vi: 'mua',           emoji: '🛒', ex: 'My mum has bought a new bike.',        exVi: 'Mẹ tớ vừa mua một chiếc xe đạp mới.' },
        { w: 'break',  v2: 'broke',  v3: 'broken',   ipa: '/breɪk/',    vi: 'làm vỡ, làm gãy', emoji: '💔', ex: 'Nam has broken his glasses.',        exVi: 'Nam đã làm vỡ cặp kính của cậu ấy.' },
        { w: 'lose',   v2: 'lost',   v3: 'lost',     ipa: '/luːz/',     vi: 'làm mất',       emoji: '🔑', ex: 'I have lost my keys again!',          exVi: 'Tớ lại làm mất chìa khoá rồi!' },
        { w: 'take',   v2: 'took',   v3: 'taken',    ipa: '/teɪk/',     vi: 'chụp, lấy, mang', emoji: '📸', ex: 'She has taken many photos today.',   exVi: 'Hôm nay cô ấy đã chụp rất nhiều ảnh.' },
        { w: 'meet',   v2: 'met',    v3: 'met',      ipa: '/miːt/',     vi: 'gặp gỡ',        emoji: '🤝', ex: 'We have met her before.',             exVi: 'Chúng tớ đã từng gặp cô ấy trước đây.' },
        { w: 'finish', v2: 'finished', v3: 'finished', ipa: '/ˈfɪnɪʃ/', vi: 'hoàn thành',    emoji: '✅', ex: 'I have just finished my homework.',   exVi: 'Tớ vừa mới làm xong bài tập.' }
    ];

    const READING = {
        title: "Mai's Amazing Summer",
        pics: ['🧳', '📸', '🏖️', '💌'],
        text: `Hi! My name is Mai. I <b>have lived</b> in Ha Noi for ten years, but this summer <b>has been</b> the most exciting one of my life.
My family and I <b>have visited</b> three cities: Da Nang, Hue and Hoi An. I <b>have eaten</b> so much delicious food, and I <b>have taken</b> more than two hundred photos!
My brother Nam <b>has not come</b> with us because he <b>has just started</b> a new job in Ho Chi Minh City. I <b>have already sent</b> him four postcards, but he <b>hasn't answered</b> yet.
I <b>have never felt</b> so happy. I <b>have already asked</b> my parents about next summer!`,
        plain: "Hi! My name is Mai. I have lived in Ha Noi for ten years, but this summer has been the most exciting one of my life. My family and I have visited three cities: Da Nang, Hue and Hoi An. I have eaten so much delicious food, and I have taken more than two hundred photos! My brother Nam has not come with us because he has just started a new job in Ho Chi Minh City. I have already sent him four postcards, but he hasn't answered yet. I have never felt so happy. I have already asked my parents about next summer!"
    };

    /* ---------- Các chặng chơi ---------- */

    const STATIONS = [
        {
            id: 'vocab',
            no: 'Chặng 1',
            icon: '🎴',
            color: '#ffd700',
            title: 'Thẻ Từ Mới',
            desc: 'Lật thẻ học 12 động từ kèm tranh minh hoạ, phiên âm và giọng đọc chuẩn. Cuối chặng có 5 câu kiểm tra nhanh.',
            items: [
                ...VOCAB.map(v => ({ kind: 'card', w: v })),
                { kind: 'choice', prompt: 'Dạng <b>V3</b> (quá khứ phân từ) của <b>write</b> là gì?', emoji: '✍️',
                  opts: ['written', 'wrote', 'writed', 'writing'], ans: 0,
                  why: '<b>write → wrote → written</b>. Thì hiện tại hoàn thành luôn dùng cột V3: <em>He has <b>written</b> a letter.</em>' },
                { kind: 'choice', prompt: '<b>eaten</b> là dạng V3 của động từ nào?', emoji: '🍕',
                  opts: ['eat', 'ate', 'eight', 'eating'], ans: 0,
                  why: '<b>eat → ate → eaten</b>. Chú ý <em>ate</em> là V2 (quá khứ đơn), còn <em>eight</em> nghĩa là số 8 nhé!' },
                { kind: 'choice', prompt: 'Động từ nào có nghĩa là <b>“làm mất”</b>?', emoji: '🔑',
                  opts: ['lose', 'loose', 'choose', 'close'], ans: 0,
                  why: '<b>lose /luːz/</b> = làm mất (lose → lost → lost). <em>loose</em> nghĩa là “lỏng, rộng”.' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>break</b> là gì?', emoji: '💔',
                  opts: ['broken', 'broke', 'breaked', 'breaking'], ans: 0,
                  why: '<b>break → broke → broken</b>. <em>Nam has <b>broken</b> his glasses.</em>' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>buy</b> là gì?', emoji: '🛒',
                  opts: ['bought', 'brought', 'buyed', 'buying'], ans: 0,
                  why: '<b>buy → bought → bought</b>. Đừng nhầm với <em>brought</em> (V3 của <b>bring</b> = mang đến) nhé!' }
            ]
        },
        {
            id: 'match',
            no: 'Chặng 2',
            icon: '🔗',
            color: '#00f0ff',
            title: 'Nối Từ',
            desc: 'Nối từ tiếng Anh với nghĩa tiếng Việt, nối động từ nguyên thể với dạng V3, và nối các trạng từ dấu hiệu.',
            items: [
                { kind: 'match', title: 'Nối động từ với nghĩa tiếng Việt', leftLabel: 'English', rightLabel: 'Tiếng Việt',
                  pairs: [['🍕 eat', 'ăn'], ['🏖️ go', 'đi'], ['👀 see', 'nhìn thấy'], ['✍️ write', 'viết'], ['🛒 buy', 'mua'], ['💔 break', 'làm vỡ']] },
                { kind: 'match', title: 'Nối động từ nguyên thể với dạng V3', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['eat', 'eaten'], ['go', 'gone'], ['see', 'seen'], ['write', 'written'], ['take', 'taken'], ['drink', 'drunk']] },
                { kind: 'match', title: 'Nối từ nguyên thể với dạng V3 (nhóm 2)', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['buy', 'bought'], ['break', 'broken'], ['lose', 'lost'], ['meet', 'met'], ['finish', 'finished'], ['read', 'read']] },
                { kind: 'match', title: 'Nối trạng từ dấu hiệu với nghĩa', leftLabel: 'Dấu hiệu', rightLabel: 'Nghĩa',
                  pairs: [['just', 'vừa mới'], ['already', 'rồi'], ['yet', 'chưa (câu phủ định / hỏi)'], ['ever', 'đã từng'], ['never', 'chưa bao giờ'], ['since', 'từ khi (mốc thời gian)']] }
            ]
        },
        {
            id: 'build',
            no: 'Chặng 3',
            icon: '🧩',
            color: '#3ddc84',
            title: 'Ghép Từ Thành Câu',
            desc: 'Bấm vào các mảnh từ để xếp thành câu hiện tại hoàn thành đúng ngữ pháp. Nghe câu mẫu để kiểm tra lại.',
            items: [
                { kind: 'build', target: 'I have finished my homework .', emoji: '✅', vi: 'Tớ đã làm xong bài tập về nhà.',
                  why: 'Chủ ngữ <b>I</b> đi với <b>have</b>, sau đó là V3 <b>finished</b>.' },
                { kind: 'build', target: 'She has gone to the beach .', emoji: '🏖️', vi: 'Cô ấy đã đi ra biển.',
                  why: 'Chủ ngữ số ít <b>She</b> đi với <b>has</b> + V3 <b>gone</b>.' },
                { kind: 'build', target: 'They have never seen a lion .', emoji: '🦁', vi: 'Họ chưa bao giờ nhìn thấy sư tử.',
                  why: 'Trạng từ <b>never</b> đứng giữa <b>have</b> và V3: have + never + seen.' },
                { kind: 'build', target: 'We have lived here for five years .', emoji: '🏠', vi: 'Chúng tớ đã sống ở đây được 5 năm.',
                  why: '<b>for</b> + khoảng thời gian (five years) — việc bắt đầu trong quá khứ và vẫn còn tiếp diễn.' },
                { kind: 'build', target: 'He has just bought a new bike .', emoji: '🚲', vi: 'Cậu ấy vừa mới mua một chiếc xe đạp mới.',
                  why: '<b>just</b> (vừa mới) cũng đứng giữa <b>has</b> và V3 <b>bought</b>.' },
                { kind: 'build', target: 'Have you ever eaten sushi ?', emoji: '🍣', vi: 'Bạn đã bao giờ ăn sushi chưa?',
                  why: 'Câu hỏi đảo <b>Have</b> lên trước chủ ngữ: Have + S + ever + V3 ?' },
                { kind: 'build', target: 'My sister has not washed the dishes yet .', emoji: '🍽️', vi: 'Chị tớ vẫn chưa rửa bát.',
                  why: 'Phủ định: has + not + V3. Từ <b>yet</b> (chưa) đứng cuối câu.' }
            ]
        },
        {
            id: 'grammar',
            no: 'Chặng 4',
            icon: '📝',
            color: '#9d4edd',
            title: 'Luyện Ngữ Pháp',
            desc: 'Chia động từ, chọn have/has, phân biệt since và for. Mỗi câu đều có lời giải thích tiếng Việt rõ ràng.',
            items: [
                { kind: 'choice', prompt: 'Mai ______ her homework already.', emoji: '📚',
                  opts: ['has finished', 'have finished', 'has finish', 'is finished'], ans: 0,
                  why: '<b>Mai</b> là chủ ngữ số ít → dùng <b>has</b>, và động từ phải ở dạng V3 <b>finished</b>.' },
                { kind: 'fill', prompt: 'I ______ that film three times.', cue: '(see)', emoji: '🎬',
                  answers: ['have seen', 'i have seen', "i've seen"],
                  bank: ['have', 'has', 'seen', 'saw'],
                  why: 'Chủ ngữ <b>I</b> → <b>have</b>. V3 của <em>see</em> là <b>seen</b> (không phải <em>saw</em>). ➜ <b>have seen</b>' },
                { kind: 'choice', prompt: '______ you ever ______ to Da Nang?', emoji: '🌉',
                  opts: ['Have / been', 'Has / been', 'Have / be', 'Did / been'], ans: 0,
                  why: 'Chủ ngữ <b>you</b> → <b>Have</b>. Cấu trúc câu hỏi trải nghiệm: <b>Have + S + ever + V3?</b>' },
                { kind: 'fill', prompt: 'They ______ the project yet.', cue: '(not / finish)', emoji: '🛠️',
                  answers: ["haven't finished", 'have not finished', "havent finished"],
                  bank: ["haven't", 'have not', 'finished', 'yet'],
                  why: 'Phủ định với <b>they</b>: <b>have not / haven\'t</b> + V3 <b>finished</b>. Từ <em>yet</em> báo hiệu câu phủ định.' },
                { kind: 'choice', prompt: 'We have lived in this house ______ 2018.', emoji: '🏡',
                  opts: ['since', 'for', 'in', 'from'], ans: 0,
                  why: '<b>since</b> đi với <u>mốc thời gian</u> (2018, Monday, last year). Còn <b>for</b> đi với <u>khoảng thời gian</u>.' },
                { kind: 'choice', prompt: 'She has studied English ______ five years.', emoji: '📗',
                  opts: ['for', 'since', 'ago', 'at'], ans: 0,
                  why: '<b>for</b> + khoảng thời gian (five years, a week, two months).' },
                { kind: 'fill', prompt: 'He ______ a new phone.', cue: '(just / buy)', emoji: '📱',
                  answers: ['has just bought', 'he has just bought'],
                  bank: ['has', 'just', 'bought', 'buyed'],
                  why: 'Trật tự đúng là <b>has + just + V3</b>. V3 của <em>buy</em> là <b>bought</b>.' },
                { kind: 'choice', prompt: 'Câu nào dưới đây <b>đúng</b> ngữ pháp?', emoji: '🧐',
                  opts: ['I have never eaten durian.', 'I have never ate durian.', 'I has never eaten durian.', 'I have never eat durian.'], ans: 0,
                  why: '<b>I + have + never + eaten</b>. Sau have/has bắt buộc là V3 (<em>eaten</em>), không phải V1 hay V2.' },
                { kind: 'choice', prompt: 'Câu nào <b>KHÔNG</b> dùng được thì hiện tại hoàn thành?', emoji: '⛔',
                  opts: ['I ______ my bike yesterday.', 'I ______ my bike already.', 'I ______ my bike three times.', 'I ______ my bike since Monday.'], ans: 0,
                  why: 'Khi có mốc quá khứ rõ ràng như <b>yesterday</b>, ta phải dùng <u>quá khứ đơn</u> (I fixed my bike yesterday), không dùng hiện tại hoàn thành.' },
                { kind: 'fill', prompt: 'My parents ______ me a puppy!', cue: '(already / give)', emoji: '🐶',
                  answers: ['have already given'],
                  bank: ['have', 'has', 'already', 'given'],
                  why: 'Chủ ngữ số nhiều <b>my parents</b> → <b>have</b>. V3 của <em>give</em> là <b>given</b>, và <em>already</em> đứng giữa.' }
            ]
        },
        {
            id: 'listen',
            no: 'Chặng 5',
            icon: '🎧',
            color: '#ff007f',
            title: 'Nghe &amp; Điền Từ',
            desc: 'Nghe câu tiếng Anh (có nút nghe chậm 🐢) rồi điền từ còn thiếu vào chỗ trống. Có tranh gợi ý cho mỗi câu.',
            items: [
                { kind: 'listen', sentence: 'I have eaten a big pizza.',        display: 'I have ______ a big pizza.',        emoji: '🍕', answers: ['eaten'],   bank: ['eaten', 'ate', 'eat', 'eating'],
                  why: 'V3 của <em>eat</em> là <b>eaten</b>: I have <b>eaten</b> a big pizza. (Tớ đã ăn một chiếc pizza to.)' },
                { kind: 'listen', sentence: 'She has gone to the beach.',       display: 'She has ______ to the beach.',      emoji: '🏖️', answers: ['gone'],    bank: ['gone', 'went', 'go', 'going'],
                  why: 'V3 của <em>go</em> là <b>gone</b>: She has <b>gone</b> to the beach. (Cô ấy đã đi ra biển.)' },
                { kind: 'listen', sentence: 'They have bought a new car.',      display: 'They have ______ a new car.',       emoji: '🚗', answers: ['bought'],  bank: ['bought', 'brought', 'buy', 'buyed'],
                  why: 'V3 của <em>buy</em> là <b>bought</b>: They have <b>bought</b> a new car. (Họ đã mua một chiếc ô tô mới.)' },
                { kind: 'listen', sentence: 'He has broken his glasses.',       display: 'He has ______ his glasses.',        emoji: '👓', answers: ['broken'],  bank: ['broken', 'broke', 'break', 'breaked'],
                  why: 'V3 của <em>break</em> là <b>broken</b>: He has <b>broken</b> his glasses. (Cậu ấy đã làm vỡ kính.)' },
                { kind: 'listen', sentence: 'We have visited the old museum.',  display: 'We have ______ the old museum.',    emoji: '🏛️', answers: ['visited'], bank: ['visited', 'visit', 'visiting', 'visits'],
                  why: '<em>visit</em> là động từ có quy tắc → V3 là <b>visited</b>. (Chúng tớ đã tới thăm bảo tàng cổ.)' },
                { kind: 'listen', sentence: 'I have never seen snow.',          display: 'I have ______ seen snow.',          emoji: '❄️', answers: ['never'],   bank: ['never', 'ever', 'not', 'yet'],
                  why: '<b>never</b> = chưa bao giờ, đứng giữa <em>have</em> và V3. (Tớ chưa bao giờ nhìn thấy tuyết.)' },
                { kind: 'listen', sentence: 'Have you finished your homework yet?', display: 'Have you finished your homework ______ ?', emoji: '📝', answers: ['yet'], bank: ['yet', 'already', 'since', 'ever'],
                  why: '<b>yet</b> (chưa) đứng cuối câu hỏi và câu phủ định. (Bạn đã làm xong bài tập chưa?)' },
                { kind: 'listen', sentence: 'My mum has just made a cake.',     display: 'My mum has ______ made a cake.',    emoji: '🎂', answers: ['just'],    bank: ['just', 'yet', 'ever', 'for'],
                  why: '<b>just</b> = vừa mới, đứng giữa <em>has</em> và V3 <em>made</em>. (Mẹ tớ vừa mới làm một chiếc bánh.)' }
            ]
        },
        {
            id: 'read',
            no: 'Chặng 6',
            icon: '📖',
            color: '#ff8c42',
            title: 'Bài Đọc Hiểu',
            desc: 'Đọc nhật ký mùa hè của Mai (có thể bấm nghe cả bài), rồi trả lời 5 câu hỏi tìm đáp án trong bài.',
            passage: READING,
            items: [
                { kind: 'choice', prompt: 'How long <b>has Mai lived</b> in Ha Noi?',
                  opts: ['For ten years', 'For three years', 'Since this summer', 'For two hundred days'], ans: 0,
                  why: 'Câu đầu bài: “I have lived in Ha Noi <b>for ten years</b>.” — <em>for</em> + khoảng thời gian.' },
                { kind: 'choice', prompt: 'How many cities <b>has Mai visited</b> this summer?',
                  opts: ['Three', 'Two', 'Four', 'Ten'], ans: 0,
                  why: '“My family and I have visited <b>three cities</b>: Da Nang, Hue and Hoi An.”' },
                { kind: 'choice', prompt: 'Why <b>hasn\'t Nam come</b> with the family?',
                  opts: ['Because he has just started a new job', 'Because he has broken his leg', 'Because he has lost his money', 'Because he has never liked the beach'], ans: 0,
                  why: '“He has not come with us <b>because he has just started a new job</b> in Ho Chi Minh City.”' },
                { kind: 'choice', prompt: 'Nam <b>has answered</b> the postcards.',
                  opts: ['False — he hasn\'t answered yet', 'True — he has answered four times', 'True — he answered yesterday', 'The text doesn\'t say'], ans: 0,
                  why: '“I have already sent him four postcards, but <b>he hasn\'t answered yet</b>.” — <em>yet</em> = vẫn chưa.' },
                { kind: 'fill', prompt: 'Điền từ còn thiếu theo bài đọc: “I have ______ 200 photos!”', cue: '(take)', emoji: '📸',
                  answers: ['taken'], bank: ['taken', 'took', 'take', 'taking'],
                  why: 'Trong bài: “I have <b>taken</b> more than two hundred photos!” — V3 của <em>take</em> là <b>taken</b>.' },
                { kind: 'choice', prompt: 'Từ <b>“already”</b> trong bài có nghĩa là gì?',
                  opts: ['rồi (việc đã xảy ra)', 'chưa bao giờ', 'sắp sửa', 'hàng ngày'], ans: 0,
                  why: '<b>already</b> = “rồi”, nhấn mạnh việc đã hoàn tất: “I have <b>already</b> sent him four postcards.”' }
            ]
        },
        {
            id: 'boss',
            no: 'Chặng 7',
            icon: '🏆',
            color: '#ff4d6d',
            title: 'Thử Thách Cuối',
            desc: 'Trắc nghiệm tổng hợp trộn tất cả dạng bài: chọn đáp án, điền từ, ghép câu và nghe. Vượt qua để nhận huy hiệu!',
            items: [
                { kind: 'choice', prompt: 'Chọn câu <b>đúng</b>:', emoji: '🎯',
                  opts: ['My dad has washed the car.', 'My dad have washed the car.', 'My dad has wash the car.', 'My dad has washing the car.'], ans: 0,
                  why: '<b>My dad</b> (số ít) → <b>has</b> + V3 <b>washed</b>.' },
                { kind: 'fill', prompt: 'Linh and Hoa ______ their room.', cue: '(already / clean)', emoji: '🧹',
                  answers: ['have already cleaned'], bank: ['have', 'has', 'already', 'cleaned'],
                  why: 'Hai người → số nhiều → <b>have</b>. <em>clean</em> có quy tắc → <b>cleaned</b>. Trật tự: have + already + V3.' },
                { kind: 'build', target: 'I have never been to London .', emoji: '🇬🇧', vi: 'Tớ chưa bao giờ đến London.',
                  why: 'Cấu trúc trải nghiệm: S + have/has + <b>never</b> + <b>been to</b> + nơi chốn.' },
                { kind: 'listen', sentence: 'She has lost her umbrella.', display: 'She has ______ her umbrella.', emoji: '☂️',
                  answers: ['lost'], bank: ['lost', 'lose', 'losed', 'loses'],
                  why: 'V3 của <em>lose</em> là <b>lost</b>. (Cô ấy đã làm mất chiếc ô.)' },
                { kind: 'choice', prompt: 'Điền từ đúng: “I haven\'t met him ______ .”', emoji: '⏳',
                  opts: ['yet', 'already', 'just', 'since'], ans: 0,
                  why: 'Câu phủ định dùng <b>yet</b> ở cuối câu = “vẫn chưa”.' },
                { kind: 'choice', prompt: 'Câu nào dùng <b>sai</b> thì hiện tại hoàn thành?', emoji: '🚫',
                  opts: ['We have gone to the zoo last Sunday.', 'We have gone to the zoo twice.', 'We have just gone to the zoo.', 'We have never gone to the zoo.'], ans: 0,
                  why: 'Có <b>last Sunday</b> (mốc quá khứ rõ ràng) thì phải dùng quá khứ đơn: <em>We went to the zoo last Sunday.</em>' },
                { kind: 'fill', prompt: '______ she ______ the letter yet?', cue: '(write)', emoji: '💌',
                  answers: ['has written', 'has she written'],
                  bank: ['Has', 'Have', 'written', 'wrote'],
                  why: 'Câu hỏi với <b>she</b>: <b>Has</b> she <b>written</b> the letter yet? (Điền: has … written)' },
                { kind: 'build', target: 'How long have you studied English ?', emoji: '⏱️', vi: 'Bạn đã học tiếng Anh được bao lâu rồi?',
                  why: 'Câu hỏi về khoảng thời gian: <b>How long + have/has + S + V3?</b>' },
                { kind: 'choice', prompt: 'Chọn cặp đúng: “I have been a student ______ 2020 and ______ four years.”', emoji: '🎒',
                  opts: ['since / for', 'for / since', 'since / since', 'for / for'], ans: 0,
                  why: '<b>since</b> + mốc thời gian (2020) · <b>for</b> + khoảng thời gian (four years).' },
                { kind: 'listen', sentence: 'We have already had lunch.', display: 'We have ______ had lunch.', emoji: '🍜',
                  answers: ['already'], bank: ['already', 'yet', 'never', 'since'],
                  why: '<b>already</b> = “rồi”, đứng giữa have và V3. (Chúng tớ đã ăn trưa rồi.)' }
            ]
        }
    ];

    const TOTAL_STARS = STATIONS.length * 3;
    const MAX_HEARTS = 5;
    const SAVE_KEY = 'english_quest_pp_v1';

    /* =====================================================
       2. TRẠNG THÁI & LƯU TIẾN TRÌNH
       ===================================================== */

    let save = { xp: 0, best: 0, stars: {} };

    function loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                save = {
                    xp: Number(parsed.xp) || 0,
                    best: Number(parsed.best) || 0,
                    stars: (parsed.stars && typeof parsed.stars === 'object') ? parsed.stars : {}
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
        matchLeft: 0
    };

    let soundOn = true;

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

    /* ---------- Âm thanh hiệu ứng (WebAudio) ---------- */
    const sfx = {
        ctx: null,
        init() {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        },
        tone(freq, dur, type = 'sine', vol = 0.15) {
            if (!soundOn || !this.ctx) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain).connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + dur);
        },
        correct() { this.tone(660, 0.14, 'triangle'); setTimeout(() => this.tone(880, 0.22, 'triangle'), 90); },
        wrong() { this.tone(200, 0.3, 'sawtooth', 0.12); },
        click() { this.tone(520, 0.06, 'square', 0.07); },
        win() {
            [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.16), i * 130));
        },
        fail() { [400, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.12), i * 150)); }
    };

    /* ---------- Đọc tiếng Anh (Text-to-Speech) ---------- */
    const TTS_OK = 'speechSynthesis' in window;
    let voices = [];

    function refreshVoices() {
        if (!TTS_OK) return;
        voices = window.speechSynthesis.getVoices() || [];
    }

    function pickVoice() {
        if (!voices.length) refreshVoices();
        return voices.find(v => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name))
            || voices.find(v => /en[-_]US/i.test(v.lang))
            || voices.find(v => /^en/i.test(v.lang))
            || null;
    }

    function speak(text, rate = 0.92) {
        if (!TTS_OK) {
            showToast('⚠️ Trình duyệt này không hỗ trợ đọc tiếng Anh');
            return;
        }
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ''));
            u.lang = 'en-US';
            u.rate = rate;
            u.pitch = 1.05;
            const v = pickVoice();
            if (v) u.voice = v;
            window.speechSynthesis.speak(u);
        } catch (e) {
            console.warn('TTS lỗi:', e);
        }
    }

    /* ---------- Hiệu ứng ---------- */
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
       4. MÀN HÌNH BẢN ĐỒ
       ===================================================== */

    function starRow(n, cls) {
        let out = '';
        for (let i = 0; i < 3; i++) out += `<span class="${i < n ? 'on' : 'off'}">⭐</span>`;
        return `<div class="${cls}">${out}</div>`;
    }

    function renderMap() {
        const grid = $('station-grid');
        grid.innerHTML = STATIONS.map((st, i) => {
            const stars = save.stars[st.id] || 0;
            return `
                <button class="station-card" data-station="${st.id}" style="--st-color:${st.color}">
                    <div class="st-top">
                        <span class="st-icon">${st.icon}</span>
                        <div>
                            <div class="st-no">${st.no} · ${st.items.length} câu</div>
                            <div class="st-title">${st.title}</div>
                        </div>
                    </div>
                    <p class="st-desc">${st.desc}</p>
                    <div class="st-foot">
                        ${starRow(stars, 'st-stars')}
                        <span class="st-go">${stars ? 'LUYỆN LẠI' : 'BẮT ĐẦU'} ▶</span>
                    </div>
                </button>`;
        }).join('');

        grid.querySelectorAll('.station-card').forEach(card => {
            card.addEventListener('click', () => {
                sfx.init();
                sfx.click();
                startStation(card.dataset.station);
            });
        });

        const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
        const doneCount = Object.values(save.stars).filter(v => v > 0).length;
        $('stat-xp').textContent = save.xp;
        $('stat-stars').textContent = `${totalStars}/${TOTAL_STARS}`;
        $('stat-streak').textContent = save.best;
        $('stat-done').textContent = `${doneCount}/${STATIONS.length}`;
    }

    function showScreen(name) {
        $('screen-map').classList.toggle('active', name === 'map');
        $('screen-play').classList.toggle('active', name === 'play');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* =====================================================
       5. VÒNG CHƠI
       ===================================================== */

    function startStation(id) {
        const st = STATIONS.find(s => s.id === id);
        if (!st) return;
        run.station = st;
        run.idx = 0;
        run.hearts = MAX_HEARTS;
        run.xp = 0;
        run.combo = 0;
        run.bestCombo = 0;
        run.mistakes = 0;
        $('play-icon').textContent = st.icon;
        $('play-title').innerHTML = st.title;
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
        const it = currentItem();
        run.answered = false;
        run.selected = -1;
        run.tray = [];
        run.matchSel = null;
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
            default:       stage.innerHTML = '<p class="q-hint">Dạng bài chưa hỗ trợ.</p>';
        }
    }

    function passageHtml() {
        const p = run.station.passage;
        if (!p) return '';
        return `
            <div class="passage">
                <h4>
                    <span>📔 ${escapeHtml(p.title)}</span>
                    <button class="btn-speak small" data-speak="${escapeHtml(p.plain)}">
                        <i class="fa-solid fa-volume-high"></i> Nghe cả bài
                    </button>
                </h4>
                <div class="passage-pics">${p.pics.join(' ')}</div>
                <div>${p.text.replace(/\n/g, '<br>')}</div>
            </div>`;
    }

    function picHtml(emoji) {
        if (!emoji) return '';
        return `<div class="pic-frame"><span class="pic-emoji">${emoji}</span></div>`;
    }

    // --- Thẻ từ vựng ---
    function renderCard(stage, it) {
        const v = it.w;
        stage.innerHTML = `
            ${picHtml(v.emoji)}
            <div class="vocab-word">${escapeHtml(v.w)}</div>
            <div class="vocab-ipa">${escapeHtml(v.ipa)}</div>
            <div class="vocab-vi">${escapeHtml(v.vi)}</div>
            <div class="speak-row">
                <button class="btn-speak" data-speak="${escapeHtml(v.w)}">
                    <i class="fa-solid fa-volume-high"></i> Nghe từ
                </button>
                <button class="btn-speak small" data-speak="${escapeHtml(v.w)}" data-slow="1">
                    🐢 Nghe chậm
                </button>
            </div>
            <div class="vocab-forms">
                <div class="form-pill"><small>V1</small><b>${escapeHtml(v.w)}</b></div>
                <div class="form-pill"><small>V2</small><b>${escapeHtml(v.v2)}</b></div>
                <div class="form-pill v3"><small>V3 · dùng ở thì này</small><b>${escapeHtml(v.v3)}</b></div>
            </div>
            <div class="vocab-example">
                <div class="en">${v.ex.replace(new RegExp('\\b(have|has)(\\s+\\w+)?\\s+' + v.v3 + '\\b', 'i'), m => '<u>' + m + '</u>')}</div>
                <div class="vi">${escapeHtml(v.exVi)}</div>
                <button class="btn-speak small" style="margin-top:10px" data-speak="${escapeHtml(v.ex)}">
                    <i class="fa-solid fa-volume-high"></i> Nghe câu ví dụ
                </button>
            </div>`;
        setCheckButton('TỚ THUỘC RỒI ➡️', true);
        speak(v.w);
    }

    // --- Trắc nghiệm ---
    function renderChoice(stage, it) {
        const keys = ['A', 'B', 'C', 'D', 'E'];
        stage.innerHTML = `
            ${passageHtml()}
            ${picHtml(it.emoji)}
            <div class="q-prompt">${it.prompt}</div>
            ${it.speak ? `<div class="speak-row"><button class="btn-speak small" data-speak="${escapeHtml(it.speak)}"><i class="fa-solid fa-volume-high"></i> Nghe câu</button></div>` : ''}
            <div class="opts">
                ${it.opts.map((o, i) => `
                    <button class="opt" data-opt="${i}">
                        <span class="key">${keys[i]}</span>
                        <span>${o}</span>
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

    // --- Điền từ (ngữ pháp) ---
    function renderFill(stage, it) {
        stage.innerHTML = `
            ${passageHtml()}
            ${picHtml(it.emoji)}
            <div class="q-prompt">
                ${it.prompt.replace(/_{3,}/g, '<span class="blank">&nbsp;</span>')}
                ${it.cue ? `<span class="cue">${escapeHtml(it.cue)}</span>` : ''}
            </div>
            <p class="q-hint">Chia động từ trong ngoặc rồi gõ vào ô bên dưới 👇</p>
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

    // --- Nghe & điền từ ---
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

    // --- Ghép câu ---
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

    // --- Nối từ ---
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

        // Chưa chọn gì → chọn ô này
        if (!run.matchSel) {
            stage.querySelectorAll('.m-item').forEach(x => x.classList.remove('sel'));
            el.classList.add('sel');
            run.matchSel = el;
            return;
        }

        // Bấm lại chính ô đang chọn → bỏ chọn
        if (run.matchSel === el) {
            el.classList.remove('sel');
            run.matchSel = null;
            return;
        }

        // Bấm hai ô cùng cột → chuyển lựa chọn
        if (run.matchSel.dataset.side === el.dataset.side) {
            run.matchSel.classList.remove('sel');
            el.classList.add('sel');
            run.matchSel = el;
            return;
        }

        const a = run.matchSel;
        a.classList.remove('sel');
        run.matchSel = null;

        if (a.dataset.i === el.dataset.i) {
            a.classList.add('done');
            el.classList.add('done');
            a.disabled = true;
            el.disabled = true;
            run.matchLeft--;
            sfx.correct();
            const gain = award();
            popXP(gain);

            if (run.matchLeft === 0) {
                run.answered = true;
                showFeedback(true, 'Nối đúng hết rồi! 🎯',
                    'Bé đã ghi nhớ được cả bảng này. Cùng sang câu tiếp theo nào!');
                setCheckButton('TIẾP TỤC ➡️', true);
            }
        } else {
            a.classList.add('shake');
            el.classList.add('shake');
            setTimeout(() => { a.classList.remove('shake'); el.classList.remove('shake'); }, 380);
            sfx.wrong();
            loseHeart();
        }
    }

    /* =====================================================
       6. CHẤM ĐIỂM
       ===================================================== */

    function award() {
        run.combo++;
        if (run.combo > run.bestCombo) run.bestCombo = run.combo;
        const gain = 10 + Math.min(run.combo - 1, 5) * 3;
        run.xp += gain;
        updateBars();
        return gain;
    }

    function loseHeart() {
        run.combo = 0;
        run.mistakes++;
        run.hearts--;
        updateBars();
        if (run.hearts <= 0) {
            run.answered = true;
            setTimeout(() => finishStation(false), 600);
        }
    }

    function onCheckClick() {
        const it = currentItem();

        // Đã chấm rồi → sang câu tiếp
        if (run.answered) {
            nextItem();
            return;
        }

        if (it.kind === 'card') {
            run.xp += 5;
            updateBars();
            nextItem();
            return;
        }

        if (it.kind === 'match') return; // tự chấm khi nối

        let ok = false;
        let userText = '';

        if (it.kind === 'choice') {
            if (run.selected < 0) return;
            ok = run.selected === it.ans;
            const stage = $('stage');
            stage.querySelectorAll('.opt').forEach((b, i) => {
                b.disabled = true;
                b.classList.remove('selected');
                if (i === it.ans) b.classList.add('correct');
                else if (i === run.selected) b.classList.add('wrong');
            });
            userText = it.opts[it.ans];

        } else if (it.kind === 'fill' || it.kind === 'listen') {
            const input = $('fill-input');
            const val = normalize(input.value);
            if (!val) return;
            ok = (it.answers || []).some(a => normalize(a) === val);
            input.disabled = true;
            input.classList.add(ok ? 'ok' : 'bad');
            $('stage').querySelectorAll('.hint-chips .chip').forEach(c => c.disabled = true);
            userText = it.answers[0];

        } else if (it.kind === 'build') {
            // So khớp từng mảnh từ (giữ nguyên dấu câu) để tránh ăn may khi đặt sai vị trí dấu
            const built = run.tray.map(o => o.w).join(' ');
            ok = built.toLowerCase() === it.target.toLowerCase();
            $('stage').querySelectorAll('.chip').forEach(c => {
                c.disabled = true;
                if (!c.classList.contains('used')) c.classList.add(ok ? 'ok' : 'bad');
            });
            userText = it.target.replace(/ ([.?!,])/g, '$1');
        }

        run.answered = true;

        if (ok) {
            const gain = award();
            popXP(gain);
            sfx.correct();
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
            setCheckButton(run.idx === run.station.items.length - 1 ? 'HOÀN THÀNH CHẶNG 🏁' : 'TIẾP TỤC ➡️', true);
        }

        // Đọc lại câu đúng cho bé nghe
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
       7. KẾT THÚC CHẶNG
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
        persist();

        $('progress-fill').style.width = completed ? '100%' : $('progress-fill').style.width;

        if (completed) {
            sfx.win();
            confetti(stars === 3 ? 60 : 34);
            $('res-emoji').textContent = stars === 3 ? '🏆' : (stars === 2 ? '🎉' : '👍');
            $('res-title').textContent = 'Hoàn thành ' + st.no + '!';
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

        const idx = STATIONS.indexOf(st);
        const hasNext = completed && idx < STATIONS.length - 1;
        $('btn-res-next').style.display = hasNext ? '' : 'none';
        $('btn-res-next').dataset.next = hasNext ? STATIONS[idx + 1].id : '';

        openModal('modal-result');
        renderMap();
    }

    /* =====================================================
       8. MODAL & SỰ KIỆN
       ===================================================== */

    function openModal(id) { $(id).classList.add('open'); }
    function closeModal(id) { $(id).classList.remove('open'); }

    function renderTheoryVerbs() {
        $('theory-verbs').innerHTML = VOCAB.map(v => `
            <div class="verb-row">
                <span class="vr-emo">${v.emoji}</span>
                <span class="vr-v1">${escapeHtml(v.w)}</span>
                <span>→</span>
                <span class="vr-v3">${escapeHtml(v.v3)}</span>
                <span class="vr-vi">${escapeHtml(v.vi)}</span>
            </div>`).join('');
    }

    function bindEvents() {
        $('btn-check').addEventListener('click', () => { sfx.init(); onCheckClick(); });

        $('btn-quit').addEventListener('click', () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            showScreen('map');
            renderMap();
        });

        $('btn-theory').addEventListener('click', () => { sfx.init(); openModal('modal-theory'); });

        $('btn-sound').addEventListener('click', () => {
            soundOn = !soundOn;
            $('sound-icon').className = soundOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            showToast(soundOn ? '🔊 Đã bật âm thanh' : '🔇 Đã tắt âm thanh');
            if (!soundOn && window.speechSynthesis) window.speechSynthesis.cancel();
        });

        $('btn-reset').addEventListener('click', () => {
            if (!confirm('Xoá toàn bộ điểm và sao đã đạt để học lại từ đầu?')) return;
            save = { xp: 0, best: 0, stars: {} };
            persist();
            renderMap();
            showToast('🔄 Đã xoá tiến trình, cùng học lại nào!');
        });

        // Nút đóng modal
        document.querySelectorAll('[data-close]').forEach(b => {
            b.addEventListener('click', () => closeModal(b.dataset.close));
        });
        document.querySelectorAll('.modal').forEach(m => {
            m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
        });

        // Nút trong modal kết quả
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
            showScreen('map');
            renderMap();
        });

        // Mọi nút "nghe" đều dùng chung một handler
        document.addEventListener('click', e => {
            const b = e.target.closest('[data-speak]');
            if (!b) return;
            sfx.init();
            speak(b.dataset.speak, b.dataset.slow ? 0.6 : 0.92);
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

        if (TTS_OK) {
            refreshVoices();
            window.speechSynthesis.onvoiceschanged = refreshVoices;
        }
    }

    /* =====================================================
       9. KHỞI ĐỘNG
       ===================================================== */

    window.addEventListener('DOMContentLoaded', () => {
        loadSave();
        renderTheoryVerbs();
        renderMap();
        bindEvents();
        if (!TTS_OK) {
            showToast('⚠️ Trình duyệt không hỗ trợ đọc tiếng Anh — hãy dùng Chrome/Safari/Edge nhé');
        }
    });
})();
