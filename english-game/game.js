/* =========================================================
   ENGLISH QUEST — English Adventure (Mầm Non đến Lớp 5)
   Game học tiếng Anh cho trẻ em: từ vựng, hình ảnh Phonics,
   ngữ pháp, ghép câu, nối từ, nghe điền từ và phân loại.
   ========================================================= */

(() => {
    'use strict';

    /* =====================================================
       1. DỮ LIỆU BÀI HỌC
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

    const READING = {
        title: "A Busy Sunday at Bo's House",
        pics: ['🎨', '🏊', '🎂', '🎸'],
        text: `Hello! My name is Bo. What a busy Sunday! My family <b>has done</b> so many things today.
My sister Lan <b>has drawn</b> three pictures of our cat, and she <b>has given</b> one of them to me.
My brother Nam and I <b>have run</b> around the lake, and after that we <b>have swum</b> for a whole hour.
Mum <b>has made</b> a big chocolate cake, and we <b>have already eaten</b> half of it!
Dad <b>has bought</b> a new guitar, so the whole family <b>has sung</b> together all afternoon.
Right now Grandma <b>has sat</b> in her old chair and <b>has read</b> the newspaper twice. Our lazy dog <b>has slept</b> under the table since lunchtime — he <b>hasn't moved</b> at all!
I <b>have taken</b> forty photos today, but I <b>haven't written</b> my diary yet.`,
        plain: "Hello! My name is Bo. What a busy Sunday! My family has done so many things today. My sister Lan has drawn three pictures of our cat, and she has given one of them to me. My brother Nam and I have run around the lake, and after that we have swum for a whole hour. Mum has made a big chocolate cake, and we have already eaten half of it! Dad has bought a new guitar, so the whole family has sung together all afternoon. Right now Grandma has sat in her old chair and has read the newspaper twice. Our lazy dog has slept under the table since lunchtime, he hasn't moved at all! I have taken forty photos today, but I haven't written my diary yet."
    };

    const READING2 = {
        title: "Bo's Summer Trip to Da Nang",
        pics: ['✈️', '🏖️', '⛰️', '📸'],
        text: `My family <b>has just come</b> back from an exciting trip to Da Nang!
We <b>have done</b> so many wonderful things during this vacation.
My brother Nam and I <b>have swum</b> in the warm blue sea every morning, and we <b>have found</b> beautiful seashells on the beach.
Mum <b>has bought</b> fresh seafood, and she <b>has made</b> delicious meals for everyone.
Dad <b>has driven</b> us up to Ba Na Hills, where we <b>have seen</b> the giant Golden Bridge in the clouds.
I <b>have taken</b> more than one hundred photos, and I <b>have met</b> friendly children from many different countries.
Lan <b>has drawn</b> a beautiful painting of the Dragon Bridge at night.
Our whole family <b>has grown</b> closer, and we <b>have known</b> how wonderful traveling together is!`,
        plain: "My family has just come back from an exciting trip to Da Nang! We have done so many wonderful things during this vacation. My brother Nam and I have swum in the warm blue sea every morning, and we have found beautiful seashells on the beach. Mum has bought fresh seafood, and she has made delicious meals for everyone. Dad has driven us up to Ba Na Hills, where we have seen the giant Golden Bridge in the clouds. I have taken more than one hundred photos, and I have met friendly children from many different countries. Lan has drawn a beautiful painting of the Dragon Bridge at night. Our whole family has grown closer, and we have known how wonderful traveling together is!"
    };

    /* ---------- Các chặng chơi ---------- */

    const STATIONS = [
        {
            id: 'vocab1',
            no: 'Chặng 1',
            icon: '🎴',
            color: '#ffd700',
            title: 'Thẻ Từ Mới · Phần 1',
            desc: '10 động từ đầu: speak, draw, catch, do, eat, drink, run, swim, sing, write. Có tranh, phiên âm và giọng đọc chuẩn.',
            items: [
                ...VOCAB.slice(0, 10).map(v => ({ kind: 'card', w: v })),
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>speak</b> (nói) là gì?', emoji: '🗣️',
                  opts: ['spoken', 'spoke', 'speaked', 'speaking'], ans: 0,
                  why: '<b>speak → spoke → spoken</b>. Thì hiện tại hoàn thành luôn dùng cột V3: <em>I have <b>spoken</b> to her.</em>' },
                { kind: 'choice', prompt: '<b>drawn</b> là dạng V3 của động từ nào?', emoji: '🎨',
                  opts: ['draw', 'drew', 'drown', 'drawing'], ans: 0,
                  why: '<b>draw → drew → drawn</b> (vẽ). Cẩn thận: <em>drown</em> nghĩa là “chết đuối”, khác hẳn nhé!' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>swim</b> (bơi) là gì?', emoji: '🏊',
                  opts: ['swum', 'swam', 'swimmed', 'swimming'], ans: 0,
                  why: '<b>swim → swam → swum</b>. Nhớ theo vần <b>i → a → u</b>, giống <em>sing → sang → sung</em>.' },
                { kind: 'choice', prompt: 'Động từ nào có nghĩa là <b>“hát”</b>?', emoji: '🎤',
                  opts: ['sing', 'sink', 'sign', 'ring'], ans: 0,
                  why: '<b>sing /sɪŋ/</b> = hát (sing → sang → sung). <em>sink</em> = chìm, <em>sign</em> = ký tên, <em>ring</em> = rung chuông.' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>catch</b> (bắt) là gì?', emoji: '🥎',
                  opts: ['caught', 'catched', 'cought', 'catching'], ans: 0,
                  why: '<b>catch → caught → caught</b>. V2 và V3 giống hệt nhau, đọc là /kɔːt/.' }
            ]
        },
        {
            id: 'vocab2',
            no: 'Chặng 2',
            icon: '🃏',
            color: '#ff9900',
            title: 'Thẻ Từ Mới · Phần 2',
            desc: '10 động từ tiếp theo: read, make, buy, take, give, come, sleep, sit, stand, fly.',
            items: [
                ...VOCAB.slice(10, 20).map(v => ({ kind: 'card', w: v })),
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>fly</b> (bay) là gì?', emoji: '✈️',
                  opts: ['flown', 'flew', 'flied', 'flying'], ans: 0,
                  why: '<b>fly → flew → flown</b>. <em>flew</em> là V2, còn <em>flied</em> hoàn toàn không tồn tại.' },
                { kind: 'choice', prompt: '<b>given</b> là dạng V3 của động từ nào?', emoji: '🎁',
                  opts: ['give', 'get', 'gave', 'giving'], ans: 0,
                  why: '<b>give → gave → given</b> (cho, tặng). <em>get</em> có V3 là <b>got/gotten</b>, khác nhé!' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>come</b> (đến) là gì?', emoji: '🚪',
                  opts: ['come', 'came', 'comed', 'coming'], ans: 0,
                  why: '<b>come → came → come</b>. V3 quay lại giống hệt V1 — giống trường hợp <em>run → ran → run</em>.' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>sleep</b> (ngủ) là gì?', emoji: '😴',
                  opts: ['slept', 'sleeped', 'sleept', 'sleeping'], ans: 0,
                  why: '<b>sleep → slept → slept</b>. Nguyên âm rút ngắn: /sliːp/ thành /slept/.' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>stand</b> (đứng) là gì?', emoji: '🧍',
                  opts: ['stood', 'standed', 'stand', 'standing'], ans: 0,
                  why: '<b>stand → stood → stood</b>, giống kiểu <em>sit → sat → sat</em>: V2 và V3 trùng nhau.' }
            ]
        },
        {
            id: 'vocab3',
            no: 'Chặng 3',
            icon: '🎴',
            color: '#e0aaff',
            title: 'Thẻ Từ Mới · Phần 3',
            desc: '10 động từ cao cấp tiếp theo: go, see, know, find, think, tell, meet, win, drive, grow. Trọn bộ 30 từ!',
            items: [
                ...VOCAB.slice(20, 30).map(v => ({ kind: 'card', w: v })),
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>go</b> (đi) là gì?', emoji: '🚶',
                  opts: ['gone', 'went', 'goed', 'going'], ans: 0,
                  why: '<b>go → went → gone</b>. Lưu ý: <em>went</em> là V2, còn V3 là <b>gone</b>.' },
                { kind: 'choice', prompt: '<b>seen</b> là dạng V3 của động từ nào?', emoji: '👁️',
                  opts: ['see', 'saw', 'so', 'seeing'], ans: 0,
                  why: '<b>see → saw → seen</b> (nhìn thấy, xem).' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>think</b> (nghĩ) là gì?', emoji: '💡',
                  opts: ['thought', 'thinked', 'thanked', 'thinking'], ans: 0,
                  why: '<b>think → thought → thought</b>. Cùng vần -ought với <em>bought</em> và <em>caught</em>.' },
                { kind: 'choice', prompt: 'Động từ nào có nghĩa là <b>“chiến thắng”</b>?', emoji: '🏆',
                  opts: ['win', 'wind', 'wine', 'wing'], ans: 0,
                  why: '<b>win /wɪn/</b> = thắng (win → won → won). <em>won</em> phát âm giống hệt số 1 (one).' },
                { kind: 'choice', prompt: 'Dạng <b>V3</b> của <b>grow</b> (lớn lên, trồng) là gì?', emoji: '🌱',
                  opts: ['grown', 'grew', 'growed', 'growing'], ans: 0,
                  why: '<b>grow → grew → grown</b>. Theo quy luật -ow → -ew → -own.' }
            ]
        },
        {
            id: 'match',
            no: 'Chặng 4',
            icon: '🔗',
            color: '#00f0ff',
            title: 'Nối Từ · Cơ Bản',
            desc: 'Nối V1 với V3 cho các động từ cơ bản, nối từ với nghĩa tiếng Việt và nối các trạng từ dấu hiệu.',
            items: [
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 1', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['speak', 'spoken'], ['draw', 'drawn'], ['catch', 'caught'], ['do', 'done'], ['eat', 'eaten']] },
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 2', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['drink', 'drunk'], ['run', 'run'], ['swim', 'swum'], ['sing', 'sung'], ['write', 'written']] },
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 3', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['read', 'read'], ['make', 'made'], ['buy', 'bought'], ['take', 'taken'], ['give', 'given']] },
                { kind: 'match', title: 'Nối động từ với nghĩa tiếng Việt', leftLabel: 'English', rightLabel: 'Tiếng Việt',
                  pairs: [['🗣️ speak', 'nói'], ['🎨 draw', 'vẽ'], ['🥎 catch', 'bắt, bắt kịp'], ['🏊 swim', 'bơi'], ['🎤 sing', 'hát'], ['✈️ fly', 'bay']] },
                { kind: 'match', title: 'Nối trạng từ dấu hiệu với nghĩa', leftLabel: 'Dấu hiệu', rightLabel: 'Nghĩa',
                  pairs: [['just', 'vừa mới'], ['already', 'rồi'], ['yet', 'chưa (câu phủ định / hỏi)'], ['ever', 'đã từng'], ['never', 'chưa bao giờ'], ['since', 'từ khi (mốc thời gian)']] }
            ]
        },
        {
            id: 'match2',
            no: 'Chặng 5',
            icon: '⚡',
            color: '#00e676',
            title: 'Nối Từ · Nâng Cao',
            desc: 'Nối V1 với V3 và nối nghĩa tiếng Việt cho các động từ nhóm nâng cao.',
            items: [
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 4', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['come', 'come'], ['sleep', 'slept'], ['sit', 'sat'], ['stand', 'stood'], ['fly', 'flown']] },
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 5', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['go', 'gone'], ['see', 'seen'], ['know', 'known'], ['find', 'found'], ['think', 'thought']] },
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 6', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['tell', 'told'], ['meet', 'met'], ['win', 'won'], ['drive', 'driven'], ['grow', 'grown']] },
                { kind: 'match', title: 'Nối động từ với nghĩa tiếng Việt', leftLabel: 'English', rightLabel: 'Tiếng Việt',
                  pairs: [['🚶 go', 'đi'], ['👁️ see', 'thấy, xem'], ['🧠 know', 'biết, hiểu'], ['🔍 find', 'tìm thấy'], ['💡 think', 'suy nghĩ']] },
                { kind: 'match', title: 'Nối động từ với nghĩa tiếng Việt', leftLabel: 'English', rightLabel: 'Tiếng Việt',
                  pairs: [['📢 tell', 'kể, bảo'], ['🤝 meet', 'gặp mặt'], ['🏆 win', 'thắng, đoạt giải'], ['🚗 drive', 'lái xe'], ['🌱 grow', 'lớn lên, trồng']] }
            ]
        },
        {
            id: 'build',
            no: 'Chặng 6',
            icon: '🧩',
            color: '#3ddc84',
            title: 'Ghép Từ Thành Câu',
            desc: 'Bấm các mảnh từ để xếp thành câu hiện tại hoàn thành đúng ngữ pháp.',
            items: [
                { kind: 'build', target: 'I have done my homework .', emoji: '📋', vi: 'Tớ đã làm xong bài tập về nhà.',
                  why: 'Chủ ngữ <b>I</b> đi với <b>have</b>, theo sau là V3 <b>done</b> (không phải <em>did</em>).' },
                { kind: 'build', target: 'She has drawn a beautiful picture .', emoji: '🎨', vi: 'Cô ấy đã vẽ một bức tranh rất đẹp.',
                  why: 'Chủ ngữ số ít <b>She</b> đi với <b>has</b> + V3 <b>drawn</b>.' },
                { kind: 'build', target: 'They have never eaten sushi .', emoji: '🍣', vi: 'Họ chưa bao giờ ăn sushi.',
                  why: 'Trạng từ <b>never</b> đứng giữa <b>have</b> và V3: have + never + eaten.' },
                { kind: 'build', target: 'We have sung this song many times .', emoji: '🎤', vi: 'Chúng tớ đã hát bài này rất nhiều lần.',
                  why: '<b>many times</b> (nhiều lần) là dấu hiệu của hiện tại hoàn thành. V3 của <em>sing</em> là <b>sung</b>.' },
                { kind: 'build', target: 'He has just bought a new bike .', emoji: '🚲', vi: 'Cậu ấy vừa mới mua một chiếc xe đạp mới.',
                  why: '<b>just</b> (vừa mới) đứng giữa <b>has</b> và V3 <b>bought</b>.' },
                { kind: 'build', target: 'Have you ever flown in a plane ?', emoji: '✈️', vi: 'Bạn đã bao giờ đi máy bay chưa?',
                  why: 'Câu hỏi đảo <b>Have</b> lên trước chủ ngữ: Have + S + ever + V3 ? V3 của <em>fly</em> là <b>flown</b>.' },
                { kind: 'build', target: 'My little sister has not slept yet .', emoji: '😴', vi: 'Em gái tớ vẫn chưa ngủ.',
                  why: 'Phủ định: has + not + V3 <b>slept</b>. Từ <b>yet</b> (chưa) đứng cuối câu.' },
                { kind: 'build', target: 'The cat has caught a big fish .', emoji: '🐟', vi: 'Con mèo đã bắt được một con cá to.',
                  why: '<b>The cat</b> là danh từ số ít → dùng <b>has</b> + V3 <b>caught</b>.' },
                { kind: 'build', target: 'Our team has won the gold medal .', emoji: '🏆', vi: 'Đội chúng tớ đã giành huy chương vàng.',
                  why: '<b>Our team</b> là danh từ tập hợp số ít → <b>has</b> + V3 <b>won</b>.' }
            ]
        },
        {
            id: 'grammar',
            no: 'Chặng 7',
            icon: '📝',
            color: '#9d4edd',
            title: 'Luyện Ngữ Pháp',
            desc: 'Chia động từ, chọn have/has, phân biệt since và for.',
            items: [
                { kind: 'choice', prompt: 'Mai ______ her homework already.', emoji: '📋',
                  opts: ['has done', 'have done', 'has did', 'has do'], ans: 0,
                  why: '<b>Mai</b> là chủ ngữ số ít → dùng <b>has</b>, và động từ phải ở dạng V3 <b>done</b>.' },
                { kind: 'fill', prompt: 'I ______ this book twice.', cue: '(read)', emoji: '📖',
                  answers: ['have read', 'i have read', "i've read"],
                  bank: ['have', 'has', 'read', 'readed'],
                  why: 'Chủ ngữ <b>I</b> → <b>have</b>. V3 của <em>read</em> viết y hệt là <b>read</b> nhưng đọc là /red/.' },
                { kind: 'choice', prompt: '______ you ever ______ in the sea?', emoji: '🌊',
                  opts: ['Have / swum', 'Has / swum', 'Have / swam', 'Did / swum'], ans: 0,
                  why: 'Chủ ngữ <b>you</b> → <b>Have</b>. Sau đó phải là V3 <b>swum</b> (không phải V2 <em>swam</em>).' },
                { kind: 'fill', prompt: 'They ______ the letter yet.', cue: '(not / write)', emoji: '✍️',
                  answers: ["haven't written", 'have not written', 'havent written'],
                  bank: ["haven't", 'have not', 'written', 'wrote'],
                  why: 'Phủ định với <b>they</b>: <b>have not / haven\'t</b> + V3 <b>written</b>. Từ <em>yet</em> báo hiệu câu phủ định.' },
                { kind: 'choice', prompt: 'We have sat here ______ 7 o\'clock.', emoji: '🪑',
                  opts: ['since', 'for', 'in', 'from'], ans: 0,
                  why: '<b>since</b> đi với <u>mốc thời gian</u> (7 o\'clock, Monday, 2018). Còn <b>for</b> đi với <u>khoảng thời gian</u>.' },
                { kind: 'choice', prompt: 'The baby has slept ______ ten hours.', emoji: '😴',
                  opts: ['for', 'since', 'ago', 'at'], ans: 0,
                  why: '<b>for</b> + khoảng thời gian (ten hours, a week, two months).' },
                { kind: 'fill', prompt: 'He ______ me a present.', cue: '(just / give)', emoji: '🎁',
                  answers: ['has just given', 'he has just given'],
                  bank: ['has', 'just', 'given', 'gave'],
                  why: 'Trật tự đúng là <b>has + just + V3</b>. V3 của <em>give</em> là <b>given</b>.' },
                { kind: 'fill', prompt: 'We ______ each other since 2018.', cue: '(know)', emoji: '🧠',
                  answers: ['have known'], bank: ['have', 'has', 'known', 'knew'],
                  why: 'Chủ ngữ <b>We</b> → <b>have</b> + V3 <b>known</b>. Từ <em>since</em> chỉ mốc thời gian 2018.' },
                { kind: 'choice', prompt: 'Grandma ______ in that chair for an hour.', emoji: '👵',
                  opts: ['has stood', 'have stood', 'has standed', 'has stand'], ans: 0,
                  why: '<b>Grandma</b> số ít → <b>has</b>. V3 của <em>stand</em> là <b>stood</b>.' },
                { kind: 'fill', prompt: 'The plane ______ to Da Nang.', cue: '(already / fly)', emoji: '✈️',
                  answers: ['has already flown'],
                  bank: ['has', 'have', 'already', 'flown'],
                  why: '<b>The plane</b> số ít → <b>has</b>. V3 của <em>fly</em> là <b>flown</b>.' }
            ]
        },
        {
            id: 'listen',
            no: 'Chặng 8',
            icon: '🎧',
            color: '#ff007f',
            title: 'Nghe &amp; Điền Từ',
            desc: 'Nghe câu tiếng Anh (có nút nghe chậm 🐢) rồi điền từ còn thiếu.',
            items: [
                { kind: 'listen', sentence: 'I have eaten a big pizza.',        display: 'I have ______ a big pizza.',     emoji: '🍕', answers: ['eaten'],  bank: ['eaten', 'ate', 'eat', 'eating'],
                  why: 'V3 của <em>eat</em> là <b>eaten</b>.' },
                { kind: 'listen', sentence: 'She has drawn a lovely picture.',  display: 'She has ______ a lovely picture.', emoji: '🎨', answers: ['drawn'], bank: ['drawn', 'drew', 'draw', 'drawing'],
                  why: 'V3 của <em>draw</em> là <b>drawn</b>.' },
                { kind: 'listen', sentence: 'They have bought a new car.',      display: 'They have ______ a new car.',    emoji: '🚗', answers: ['bought'], bank: ['bought', 'brought', 'buy', 'buyed'],
                  why: 'V3 của <em>buy</em> là <b>bought</b>.' },
                { kind: 'listen', sentence: 'He has caught a big fish.',        display: 'He has ______ a big fish.',      emoji: '🐟', answers: ['caught'], bank: ['caught', 'catched', 'catch', 'cating'],
                  why: 'V3 của <em>catch</em> là <b>caught</b>.' },
                { kind: 'listen', sentence: 'He has found his lost keys.',      display: 'He has ______ his lost keys.',   emoji: '🔑', answers: ['found'], bank: ['found', 'finded', 'find', 'finding'],
                  why: 'V3 của <em>find</em> là <b>found</b>.' },
                { kind: 'listen', sentence: 'We have flown to Da Nang.',        display: 'We have ______ to Da Nang.',     emoji: '✈️', answers: ['flown'],  bank: ['flown', 'flew', 'fly', 'flied'],
                  why: 'V3 của <em>fly</em> là <b>flown</b>.' },
                { kind: 'listen', sentence: 'The baby has slept for two hours.', display: 'The baby has ______ for two hours.', emoji: '😴', answers: ['slept'], bank: ['slept', 'sleeped', 'sleep', 'sleeping'],
                  why: 'V3 của <em>sleep</em> là <b>slept</b>.' },
                { kind: 'listen', sentence: 'He has given me a present.',       display: 'He has ______ me a present.',    emoji: '🎁', answers: ['given'],  bank: ['given', 'gave', 'give', 'giving'],
                  why: 'V3 của <em>give</em> là <b>given</b>.' }
            ]
        },
        {
            id: 'read',
            no: 'Chặng 9',
            icon: '📖',
            color: '#ff8c42',
            title: 'Bài Đọc · Ngày Chủ Nhật',
            desc: 'Đọc chuyện ngày Chủ nhật bận rộn của Bo (bấm nghe cả bài), rồi trả lời 6 câu hỏi.',
            passage: READING,
            items: [
                { kind: 'choice', prompt: 'How many pictures <b>has Lan drawn</b>?',
                  opts: ['Three', 'Two', 'Forty', 'One'], ans: 0,
                  why: '“My sister Lan has drawn <b>three pictures</b> of our cat.”' },
                { kind: 'choice', prompt: 'What <b>has Mum made</b> today?',
                  opts: ['A big chocolate cake', 'A new guitar', 'Three pictures', 'A cup of milk'], ans: 0,
                  why: '“Mum has made <b>a big chocolate cake</b>, and we have already eaten half of it!”' },
                { kind: 'choice', prompt: 'Why <b>has the family sung</b> together?',
                  opts: ['Because Dad has bought a new guitar', 'Because Lan has drawn a picture', 'Because they have run around the lake', 'Because the dog has slept'], ans: 0,
                  why: '“Dad has bought a new guitar, <b>so</b> the whole family has sung together all afternoon.”' },
                { kind: 'choice', prompt: 'What <b>has the dog done</b> since lunchtime?',
                  opts: ['It has slept under the table', 'It has run around the lake', 'It has caught a fish', 'It has eaten the cake'], ans: 0,
                  why: '“Our lazy dog <b>has slept under the table since lunchtime</b>.”' },
                { kind: 'fill', prompt: 'Điền theo bài đọc: “I have ______ forty photos today.”', cue: '(take)', emoji: '📸',
                  answers: ['taken'], bank: ['taken', 'took', 'take', 'taking'],
                  why: 'Trong bài: “I have <b>taken</b> forty photos today.”' },
                { kind: 'choice', prompt: 'Bo <b>has written</b> his diary today.',
                  opts: ['False — he hasn\'t written it yet', 'True — he has written it twice', 'True — he wrote it this morning', 'The text doesn\'t say'], ans: 0,
                  why: '“I have taken forty photos today, but <b>I haven\'t written my diary yet</b>.”' }
            ]
        },
        {
            id: 'read2',
            no: 'Chặng 10',
            icon: '🏖️',
            color: '#ff7043',
            title: 'Bài Đọc · Chuyến Đi Đà Nẵng',
            desc: 'Đọc nhật ký du lịch Đà Nẵng đáng nhớ của Bo (bấm nghe cả bài), rồi làm 6 câu hỏi đọc hiểu.',
            passage: READING2,
            items: [
                { kind: 'choice', prompt: 'Where <b>has Bo\'s family gone</b> on vacation?',
                  opts: ['Da Nang', 'Ha Noi', 'Phu Quoc', 'Sa Pa'], ans: 0,
                  why: '“My family has just come back from an exciting trip to <b>Da Nang</b>!”' },
                { kind: 'choice', prompt: 'What <b>have Bo and Nam found</b> on the beach?',
                  opts: ['Beautiful seashells', 'Forty photos', 'A lost key', 'A new guitar'], ans: 0,
                  why: '“We have found <b>beautiful seashells</b> on the beach.”' },
                { kind: 'choice', prompt: 'Where <b>has Dad driven</b> the family?',
                  opts: ['Up to Ba Na Hills', 'To the zoo', 'To the park', 'To school'], ans: 0,
                  why: '“Dad has driven us up to <b>Ba Na Hills</b>, where we have seen the giant Golden Bridge.”' },
                { kind: 'fill', prompt: 'Điền từ theo bài đọc: “I have ______ more than one hundred photos.”', cue: '(take)', emoji: '📸',
                  answers: ['taken'], bank: ['taken', 'took', 'take', 'taking'],
                  why: 'Trong bài: “I have <b>taken</b> more than one hundred photos.” — V3 của <em>take</em> là <b>taken</b>.' },
                { kind: 'choice', prompt: 'How many photos <b>has Bo taken</b> on this trip?',
                  opts: ['More than 100', 'Forty', 'Ten', 'Three'], ans: 0,
                  why: '“I have taken <b>more than one hundred photos</b>.”' },
                { kind: 'choice', prompt: 'What <b>has Lan drawn</b>?',
                  opts: ['A painting of the Dragon Bridge', 'A cat', 'A car', 'A tree'], ans: 0,
                  why: '“Lan has drawn a <b>beautiful painting of the Dragon Bridge</b> at night.”' }
            ]
        },
        {
            id: 'boss',
            no: 'Chặng 11',
            icon: '🏆',
            color: '#ff4d6d',
            title: 'Thử Thách Tổng Hợp',
            desc: 'Trắc nghiệm tổng hợp trộn tất cả dạng bài trên các động từ đã học.',
            items: [
                { kind: 'choice', prompt: 'Chọn câu <b>đúng</b>:', emoji: '🎯',
                  opts: ['My dad has flown to Ha Noi.', 'My dad have flown to Ha Noi.', 'My dad has flew to Ha Noi.', 'My dad has fly to Ha Noi.'], ans: 0,
                  why: '<b>My dad</b> (số ít) → <b>has</b> + V3 <b>flown</b>.' },
                { kind: 'fill', prompt: 'Linh and Hoa ______ their homework.', cue: '(already / do)', emoji: '📋',
                  answers: ['have already done'], bank: ['have', 'has', 'already', 'done'],
                  why: 'Hai người → số nhiều → <b>have</b>. V3 của <em>do</em> là <b>done</b>.' },
                { kind: 'build', target: 'I have never drunk coffee .', emoji: '☕', vi: 'Tớ chưa bao giờ uống cà phê.',
                  why: 'Cấu trúc trải nghiệm: S + have/has + <b>never</b> + V3.' },
                { kind: 'listen', sentence: 'She has taken my pen.', display: 'She has ______ my pen.', emoji: '🖊️',
                  answers: ['taken'], bank: ['taken', 'took', 'take', 'taking'],
                  why: 'V3 của <em>take</em> là <b>taken</b>.' },
                { kind: 'choice', prompt: 'Điền từ đúng: “I haven\'t spoken to him ______ .”', emoji: '⏳',
                  opts: ['yet', 'already', 'just', 'since'], ans: 0,
                  why: 'Câu phủ định dùng <b>yet</b> ở cuối câu = “vẫn chưa”.' },
                { kind: 'fill', prompt: '______ she ______ the song yet?', cue: '(sing)', emoji: '🎤',
                  answers: ['has sung', 'has she sung'],
                  bank: ['Has', 'Have', 'sung', 'sang'],
                  why: 'Câu hỏi với <b>she</b>: <b>Has</b> she <b>sung</b> the song yet?' }
            ]
        },
        {
            id: 'ultra_boss',
            no: 'Chặng 12',
            icon: '👑',
            color: '#d500f9',
            title: 'Đại Chiến Cuối Cùng',
            desc: 'Thử thách đỉnh cao trắc nghiệm tổng hợp cả 30 động từ bất quy tắc và toàn bộ kiến thức Thì Hiện Tại Hoàn Thành!',
            items: [
                { kind: 'choice', prompt: 'Chọn câu <b>đúng</b>:', emoji: '🎯',
                  opts: ['She has gone to school.', 'She have gone to school.', 'She has went to school.', 'She has go to school.'], ans: 0,
                  why: '<b>She</b> (số ít) → <b>has</b> + V3 <b>gone</b>.' },
                { kind: 'fill', prompt: 'We ______ each other since 2018.', cue: '(know)', emoji: '🧠',
                  answers: ['have known'], bank: ['have', 'has', 'known', 'knew'],
                  why: 'Chủ ngữ <b>We</b> → <b>have</b> + V3 <b>known</b>. Từ <em>since</em> chỉ mốc thời gian 2018.' },
                { kind: 'build', target: 'Our team has won the gold medal .', emoji: '🏆', vi: 'Đội chúng tớ đã giành huy chương vàng.',
                  why: '<b>Our team</b> là danh từ tập hợp số ít → <b>has</b> + V3 <b>won</b>.' },
                { kind: 'listen', sentence: 'He has found his lost keys.', display: 'He has ______ his lost keys.', emoji: '🔑',
                  answers: ['found'], bank: ['found', 'finded', 'find', 'finding'],
                  why: 'V3 của <em>find</em> là <b>found</b>.' },
                { kind: 'choice', prompt: 'Điền từ: “My dad has driven ______ 3 hours.”', emoji: '🚗',
                  opts: ['for', 'since', 'at', 'in'], ans: 0,
                  why: '3 hours là khoảng thời gian → dùng <b>for</b>.' },
                { kind: 'fill', prompt: 'I ______ about this question for a long time.', cue: '(think)', emoji: '💡',
                  answers: ['have thought', "i've thought"], bank: ['have', 'has', 'thought', 'thinked'],
                  why: 'Chủ ngữ <b>I</b> → <b>have</b> + V3 <b>thought</b>.' },
                { kind: 'build', target: 'She has told me a funny story .', emoji: '📢', vi: 'Cô ấy đã kể cho tớ một câu chuyện buồn cười.',
                  why: 'Cấu trúc: S + has + V3 <b>told</b> + me + O.' },
                { kind: 'choice', prompt: 'Dạng V3 của <b>drive</b> là gì?', emoji: '🚘',
                  opts: ['driven', 'drove', 'droven', 'driving'], ans: 0,
                  why: '<b>drive → drove → driven</b>.' }
            ]
        }
    ];

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

    let activeGradeFilter = 'all';
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

        $('play-icon').textContent = st.icon;
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

    function speak(text, rateOverride) {
        if (!TTS_OK) {
            showToast('⚠️ Trình duyệt này không hỗ trợ đọc tiếng Anh');
            return;
        }
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
       4. MÀN HÌNH BẢN ĐỒ (10 WORLDS / 100 LEVELS)
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
        if (activeGradeFilter === 'all') return window.ENGLISH_WORLDS;
        const gNum = Number(activeGradeFilter);
        return window.ENGLISH_WORLDS.filter(w => w.gradeMin <= gNum && w.gradeMax >= gNum);
    }

    function renderMap() {
        const worlds = getFilteredWorlds();
        const worldNav = $('world-nav');
        const worldNavContainer = $('world-nav-container');
        
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
            return `
                <div class="world-card ${isSelected ? 'active' : ''}" data-world="${w.id}">
                    <div class="w-icon">${w.icon}</div>
                    <div class="w-info">
                        <div class="w-title" title="${escapeHtml(w.title)}">${w.title}</div>
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

        $('btn-resume').addEventListener('click', () => {
            sfx.init();
            sfx.click();
            resumeRun();
        });

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
        renderMap();
        bindEvents();

        // Tải lại trang giữa chừng -> Kiểm tra lượt học cũ để hỏi bé
        const found = readRun();
        if (found) {
            const { data: d, station: st } = found;
            const total = st.items.length;
            const at = Math.min(total, (Number(d.idx) || 0) + (d.answered ? 2 : 1));
            $('resume-confirm-info').innerHTML = `${st.icon} <b>${st.title}</b><br><small>Đang ở câu ${at}/${total} · ❤️ ${d.hearts} · 💎 ${d.xp}</small>`;
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
