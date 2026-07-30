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
        { w: 'fly',   v2: 'flew',   v3: 'flown',   ipa: '/flaɪ/',   vi: 'bay',          emoji: '✈️', ex: 'The plane has flown to Ha Noi.',      exVi: 'Chiếc máy bay đã bay đến Hà Nội.' }
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
            desc: '10 động từ tiếp theo: read, make, buy, take, give, come, sleep, sit, stand, fly. Học xong là trọn bảng 20 từ!',
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
            id: 'match',
            no: 'Chặng 3',
            icon: '🔗',
            color: '#00f0ff',
            title: 'Nối Từ',
            desc: 'Nối V1 với V3 cho cả 20 động từ, nối từ với nghĩa tiếng Việt và nối các trạng từ dấu hiệu.',
            items: [
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 1', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['speak', 'spoken'], ['draw', 'drawn'], ['catch', 'caught'], ['do', 'done'], ['eat', 'eaten']] },
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 2', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['drink', 'drunk'], ['run', 'run'], ['swim', 'swum'], ['sing', 'sung'], ['write', 'written']] },
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 3', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['read', 'read'], ['make', 'made'], ['buy', 'bought'], ['take', 'taken'], ['give', 'given']] },
                { kind: 'match', title: 'Nối V1 với V3 · nhóm 4', leftLabel: 'V1 (nguyên thể)', rightLabel: 'V3 (quá khứ phân từ)',
                  pairs: [['come', 'come'], ['sleep', 'slept'], ['sit', 'sat'], ['stand', 'stood'], ['fly', 'flown']] },
                { kind: 'match', title: 'Nối động từ với nghĩa tiếng Việt · nhóm 1', leftLabel: 'English', rightLabel: 'Tiếng Việt',
                  pairs: [['🗣️ speak', 'nói'], ['🎨 draw', 'vẽ'], ['🥎 catch', 'bắt, bắt kịp'], ['🏊 swim', 'bơi'], ['🎤 sing', 'hát'], ['✈️ fly', 'bay']] },
                { kind: 'match', title: 'Nối động từ với nghĩa tiếng Việt · nhóm 2', leftLabel: 'English', rightLabel: 'Tiếng Việt',
                  pairs: [['🎁 give', 'cho, tặng'], ['🚪 come', 'đến'], ['😴 sleep', 'ngủ'], ['🪑 sit', 'ngồi'], ['🧍 stand', 'đứng'], ['🎂 make', 'làm, tạo ra']] },
                { kind: 'match', title: 'Nối trạng từ dấu hiệu với nghĩa', leftLabel: 'Dấu hiệu', rightLabel: 'Nghĩa',
                  pairs: [['just', 'vừa mới'], ['already', 'rồi'], ['yet', 'chưa (câu phủ định / hỏi)'], ['ever', 'đã từng'], ['never', 'chưa bao giờ'], ['since', 'từ khi (mốc thời gian)']] }
            ]
        },
        {
            id: 'build',
            no: 'Chặng 4',
            icon: '🧩',
            color: '#3ddc84',
            title: 'Ghép Từ Thành Câu',
            desc: 'Bấm các mảnh từ để xếp thành câu hiện tại hoàn thành đúng ngữ pháp, dùng chính 20 động từ vừa học.',
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
                  why: '<b>The cat</b> là danh từ số ít → dùng <b>has</b> + V3 <b>caught</b>.' }
            ]
        },
        {
            id: 'grammar',
            no: 'Chặng 5',
            icon: '📝',
            color: '#9d4edd',
            title: 'Luyện Ngữ Pháp',
            desc: 'Chia động từ, chọn have/has, phân biệt since và for. Mỗi câu đều có lời giải thích tiếng Việt rõ ràng.',
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
                { kind: 'choice', prompt: 'Câu nào dưới đây <b>đúng</b> ngữ pháp?', emoji: '🧐',
                  opts: ['I have never drunk coffee.', 'I have never drank coffee.', 'I has never drunk coffee.', 'I have never drink coffee.'], ans: 0,
                  why: '<b>I + have + never + drunk</b>. Sau have/has bắt buộc là V3 (<em>drunk</em>), không phải V1 hay V2 (<em>drank</em>).' },
                { kind: 'choice', prompt: 'Câu nào <b>KHÔNG</b> dùng được thì hiện tại hoàn thành?', emoji: '⛔',
                  opts: ['I ______ to Ha Noi last week.', 'I ______ to Ha Noi twice.', 'I ______ to Ha Noi already.', 'I ______ to Ha Noi since 2020.'], ans: 0,
                  why: 'Khi có mốc quá khứ rõ ràng như <b>last week</b>, ta phải dùng <u>quá khứ đơn</u> (I flew to Ha Noi last week), không dùng hiện tại hoàn thành.' },
                { kind: 'fill', prompt: 'My parents ______ a new house.', cue: '(already / buy)', emoji: '🏡',
                  answers: ['have already bought'],
                  bank: ['have', 'has', 'already', 'bought'],
                  why: 'Chủ ngữ số nhiều <b>my parents</b> → <b>have</b>. V3 của <em>buy</em> là <b>bought</b>, <em>already</em> đứng giữa.' },
                { kind: 'choice', prompt: 'Grandma ______ in that chair for an hour.', emoji: '👵',
                  opts: ['has stood', 'have stood', 'has standed', 'has stand'], ans: 0,
                  why: '<b>Grandma</b> số ít → <b>has</b>. V3 của <em>stand</em> là <b>stood</b> (không có <em>standed</em>).' },
                { kind: 'fill', prompt: 'The plane ______ to Da Nang.', cue: '(already / fly)', emoji: '✈️',
                  answers: ['has already flown'],
                  bank: ['has', 'have', 'already', 'flown'],
                  why: '<b>The plane</b> số ít → <b>has</b>. V3 của <em>fly</em> là <b>flown</b>.' }
            ]
        },
        {
            id: 'listen',
            no: 'Chặng 6',
            icon: '🎧',
            color: '#ff007f',
            title: 'Nghe &amp; Điền Từ',
            desc: 'Nghe câu tiếng Anh (có nút nghe chậm 🐢) rồi điền từ còn thiếu. Mỗi câu đều có tranh minh hoạ gợi ý.',
            items: [
                { kind: 'listen', sentence: 'I have eaten a big pizza.',        display: 'I have ______ a big pizza.',     emoji: '🍕', answers: ['eaten'],  bank: ['eaten', 'ate', 'eat', 'eating'],
                  why: 'V3 của <em>eat</em> là <b>eaten</b>. (Tớ đã ăn một chiếc pizza to.)' },
                { kind: 'listen', sentence: 'She has drawn a lovely picture.',  display: 'She has ______ a lovely picture.', emoji: '🎨', answers: ['drawn'], bank: ['drawn', 'drew', 'draw', 'drawing'],
                  why: 'V3 của <em>draw</em> là <b>drawn</b>. (Cô ấy đã vẽ một bức tranh đáng yêu.)' },
                { kind: 'listen', sentence: 'They have bought a new car.',      display: 'They have ______ a new car.',    emoji: '🚗', answers: ['bought'], bank: ['bought', 'brought', 'buy', 'buyed'],
                  why: 'V3 của <em>buy</em> là <b>bought</b>. Cẩn thận <em>brought</em> là của <b>bring</b> nhé!' },
                { kind: 'listen', sentence: 'He has caught a big fish.',        display: 'He has ______ a big fish.',      emoji: '🐟', answers: ['caught'], bank: ['caught', 'catched', 'catch', 'cating'],
                  why: 'V3 của <em>catch</em> là <b>caught</b>. (Cậu ấy đã bắt được một con cá to.)' },
                { kind: 'listen', sentence: 'We have flown to Da Nang.',        display: 'We have ______ to Da Nang.',     emoji: '✈️', answers: ['flown'],  bank: ['flown', 'flew', 'fly', 'flied'],
                  why: 'V3 của <em>fly</em> là <b>flown</b>. (Chúng tớ đã bay tới Đà Nẵng.)' },
                { kind: 'listen', sentence: 'The baby has slept for two hours.', display: 'The baby has ______ for two hours.', emoji: '😴', answers: ['slept'], bank: ['slept', 'sleeped', 'sleep', 'sleeping'],
                  why: 'V3 của <em>sleep</em> là <b>slept</b>. (Em bé đã ngủ được hai tiếng.)' },
                { kind: 'listen', sentence: 'He has given me a present.',       display: 'He has ______ me a present.',    emoji: '🎁', answers: ['given'],  bank: ['given', 'gave', 'give', 'giving'],
                  why: 'V3 của <em>give</em> là <b>given</b>. (Cậu ấy đã tặng tớ một món quà.)' },
                { kind: 'listen', sentence: 'I have never swum in the sea.',    display: 'I have ______ swum in the sea.', emoji: '🌊', answers: ['never'],  bank: ['never', 'ever', 'not', 'yet'],
                  why: '<b>never</b> = chưa bao giờ, đứng giữa <em>have</em> và V3. (Tớ chưa bao giờ bơi ngoài biển.)' },
                { kind: 'listen', sentence: 'Have you done your homework yet?', display: 'Have you done your homework ______ ?', emoji: '📝', answers: ['yet'], bank: ['yet', 'already', 'since', 'ever'],
                  why: '<b>yet</b> (chưa) đứng cuối câu hỏi và câu phủ định. (Bạn đã làm bài tập chưa?)' },
                { kind: 'listen', sentence: 'My mum has just made a cake.',     display: 'My mum has ______ made a cake.', emoji: '🎂', answers: ['just'],   bank: ['just', 'yet', 'ever', 'for'],
                  why: '<b>just</b> = vừa mới, đứng giữa <em>has</em> và V3 <em>made</em>. (Mẹ tớ vừa mới làm một chiếc bánh.)' }
            ]
        },
        {
            id: 'read',
            no: 'Chặng 7',
            icon: '📖',
            color: '#ff8c42',
            title: 'Bài Đọc Hiểu',
            desc: 'Đọc chuyện ngày Chủ nhật bận rộn của bạn Bo (bấm nghe cả bài), rồi trả lời 6 câu hỏi tìm đáp án trong bài.',
            passage: READING,
            items: [
                { kind: 'choice', prompt: 'How many pictures <b>has Lan drawn</b>?',
                  opts: ['Three', 'Two', 'Forty', 'One'], ans: 0,
                  why: '“My sister Lan has drawn <b>three pictures</b> of our cat.” Bé chú ý số <em>one</em> trong bài là bức tranh Lan tặng Bo nhé.' },
                { kind: 'choice', prompt: 'What <b>has Mum made</b> today?',
                  opts: ['A big chocolate cake', 'A new guitar', 'Three pictures', 'A cup of milk'], ans: 0,
                  why: '“Mum has made <b>a big chocolate cake</b>, and we have already eaten half of it!”' },
                { kind: 'choice', prompt: 'Why <b>has the family sung</b> together?',
                  opts: ['Because Dad has bought a new guitar', 'Because Lan has drawn a picture', 'Because they have run around the lake', 'Because the dog has slept'], ans: 0,
                  why: '“Dad has bought a new guitar, <b>so</b> the whole family has sung together all afternoon.” — từ <em>so</em> chỉ kết quả.' },
                { kind: 'choice', prompt: 'What <b>has the dog done</b> since lunchtime?',
                  opts: ['It has slept under the table', 'It has run around the lake', 'It has caught a fish', 'It has eaten the cake'], ans: 0,
                  why: '“Our lazy dog <b>has slept under the table since lunchtime</b>.” — <em>since</em> + mốc thời gian (lunchtime).' },
                { kind: 'fill', prompt: 'Điền theo bài đọc: “I have ______ forty photos today.”', cue: '(take)', emoji: '📸',
                  answers: ['taken'], bank: ['taken', 'took', 'take', 'taking'],
                  why: 'Trong bài: “I have <b>taken</b> forty photos today.” — V3 của <em>take</em> là <b>taken</b>.' },
                { kind: 'choice', prompt: 'Bo <b>has written</b> his diary today.',
                  opts: ['False — he hasn\'t written it yet', 'True — he has written it twice', 'True — he wrote it this morning', 'The text doesn\'t say'], ans: 0,
                  why: '“I have taken forty photos today, but <b>I haven\'t written my diary yet</b>.” — <em>yet</em> = vẫn chưa.' }
            ]
        },
        {
            id: 'boss',
            no: 'Chặng 8',
            icon: '🏆',
            color: '#ff4d6d',
            title: 'Thử Thách Cuối',
            desc: 'Trắc nghiệm tổng hợp trộn tất cả dạng bài trên 20 động từ đã học. Vượt qua để nhận huy hiệu!',
            items: [
                { kind: 'choice', prompt: 'Chọn câu <b>đúng</b>:', emoji: '🎯',
                  opts: ['My dad has flown to Ha Noi.', 'My dad have flown to Ha Noi.', 'My dad has flew to Ha Noi.', 'My dad has fly to Ha Noi.'], ans: 0,
                  why: '<b>My dad</b> (số ít) → <b>has</b> + V3 <b>flown</b>.' },
                { kind: 'fill', prompt: 'Linh and Hoa ______ their homework.', cue: '(already / do)', emoji: '📋',
                  answers: ['have already done'], bank: ['have', 'has', 'already', 'done'],
                  why: 'Hai người → số nhiều → <b>have</b>. V3 của <em>do</em> là <b>done</b>. Trật tự: have + already + V3.' },
                { kind: 'build', target: 'I have never drunk coffee .', emoji: '☕', vi: 'Tớ chưa bao giờ uống cà phê.',
                  why: 'Cấu trúc trải nghiệm: S + have/has + <b>never</b> + V3. V3 của <em>drink</em> là <b>drunk</b>.' },
                { kind: 'listen', sentence: 'She has taken my pen.', display: 'She has ______ my pen.', emoji: '🖊️',
                  answers: ['taken'], bank: ['taken', 'took', 'take', 'taking'],
                  why: 'V3 của <em>take</em> là <b>taken</b>. (Cô ấy đã lấy cái bút của tớ.)' },
                { kind: 'choice', prompt: 'Điền từ đúng: “I haven\'t spoken to him ______ .”', emoji: '⏳',
                  opts: ['yet', 'already', 'just', 'since'], ans: 0,
                  why: 'Câu phủ định dùng <b>yet</b> ở cuối câu = “vẫn chưa”.' },
                { kind: 'choice', prompt: 'Câu nào dùng <b>sai</b> thì hiện tại hoàn thành?', emoji: '🚫',
                  opts: ['We have run in the park last Sunday.', 'We have run in the park twice.', 'We have just run in the park.', 'We have never run in the park.'], ans: 0,
                  why: 'Có <b>last Sunday</b> (mốc quá khứ rõ ràng) thì phải dùng quá khứ đơn: <em>We ran in the park last Sunday.</em>' },
                { kind: 'fill', prompt: '______ she ______ the song yet?', cue: '(sing)', emoji: '🎤',
                  answers: ['has sung', 'has she sung'],
                  bank: ['Has', 'Have', 'sung', 'sang'],
                  why: 'Câu hỏi với <b>she</b>: <b>Has</b> she <b>sung</b> the song yet? V3 của <em>sing</em> là <b>sung</b>.' },
                { kind: 'build', target: 'How long have you sat here ?', emoji: '🪑', vi: 'Bạn đã ngồi đây được bao lâu rồi?',
                  why: 'Câu hỏi về khoảng thời gian: <b>How long + have/has + S + V3?</b> V3 của <em>sit</em> là <b>sat</b>.' },
                { kind: 'choice', prompt: 'Chọn cặp đúng: “I have stood here ______ 8 o\'clock and ______ two hours.”', emoji: '🧍',
                  opts: ['since / for', 'for / since', 'since / since', 'for / for'], ans: 0,
                  why: '<b>since</b> + mốc thời gian (8 o\'clock) · <b>for</b> + khoảng thời gian (two hours).' },
                { kind: 'listen', sentence: 'We have already made dinner.', display: 'We have ______ made dinner.', emoji: '🍜',
                  answers: ['already'], bank: ['already', 'yet', 'never', 'since'],
                  why: '<b>already</b> = “rồi”, đứng giữa have và V3. (Chúng tớ đã nấu xong bữa tối rồi.)' },
                { kind: 'choice', prompt: 'Dạng V3 nào <b>giống hệt</b> V1?', emoji: '🔁',
                  opts: ['come', 'sing', 'write', 'give'], ans: 0,
                  why: '<b>come → came → come</b> (và <em>run → ran → run</em>) có V3 quay lại giống V1. Các từ kia đều đổi: sung, written, given.' },
                { kind: 'fill', prompt: 'My friends ______ to my house.', cue: '(just / come)', emoji: '🚪',
                  answers: ['have just come'], bank: ['have', 'has', 'just', 'come'],
                  why: '<b>My friends</b> số nhiều → <b>have</b>. V3 của <em>come</em> vẫn là <b>come</b>.' }
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
            const st = STATIONS.find(s => s.id === d.id);
            if (!st) { clearRun(); return null; }        // chặng đã bị đổi tên/gỡ bỏ
            return { data: d, station: st };
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
        return id ? STATIONS.find(s => s.id === id) : null;
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
        if (!TTS_OK) return;
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
        const doing = readRun();
        grid.innerHTML = STATIONS.map((st, i) => {
            const stars = save.stars[st.id] || 0;
            const isDoing = doing && doing.station.id === st.id;
            return `
                <button class="station-row ${stars === 3 ? 'mastered' : ''} ${isDoing ? 'doing' : ''}"
                        data-station="${st.id}" style="--st-color:${st.color}">
                    <span class="st-index">${i + 1}</span>
                    <span class="st-icon">${st.icon}</span>
                    <span class="st-body">
                        <span class="st-head">
                            <span class="st-title">${st.title}</span>
                            ${isDoing ? '<span class="st-flag">Đang học dở</span>' : ''}
                            ${stars === 3 ? '<span class="st-flag done">Đã thuộc</span>' : ''}
                        </span>
                        <span class="st-desc">${st.desc}</span>
                        <span class="st-meta">${st.no} · ${st.items.length} câu</span>
                    </span>
                    <span class="st-right">
                        ${starRow(stars, 'st-stars')}
                        <span class="st-go">${stars ? 'LUYỆN LẠI' : 'BẮT ĐẦU'} ▶</span>
                    </span>
                </button>`;
        }).join('');

        grid.querySelectorAll('.station-row').forEach(card => {
            card.addEventListener('click', () => {
                sfx.init();
                sfx.click();
                startStation(card.dataset.station);
            });
        });

        renderResumeBar();

        const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
        const doneCount = Object.values(save.stars).filter(v => v > 0).length;
        $('stat-xp').textContent = save.xp;
        $('stat-stars').textContent = `${totalStars}/${TOTAL_STARS}`;
        $('stat-streak').textContent = save.best;
        $('stat-done').textContent = `${doneCount}/${STATIONS.length}`;
    }

    /** Thanh "Học tiếp" hiện trên bản đồ khi còn một chặng đang làm dở. */
    function renderResumeBar() {
        const bar = $('resume-bar');
        const found = readRun();
        if (!found) {
            bar.classList.remove('show');
            return;
        }
        const { data: d, station: st } = found;
        const total = st.items.length;
        const at = Math.min(total, (Number(d.idx) || 0) + (d.answered ? 2 : 1));
        $('rs-title').innerHTML = `${st.icon} ${st.title}`;
        $('rs-sub').textContent = `Đang ở câu ${at}/${total} · ❤️ ${d.hearts} · 💎 ${d.xp}`;
        bar.classList.add('show');
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
            ${v.tip ? `<div class="vocab-tip">💡 <b>Mẹo nhớ:</b> ${escapeHtml(v.tip)}</div>` : ''}
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

        saveRun();

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
        clearRun();   // chặng đã khép lại, không còn gì để học dở

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
        $('theory-verbs').innerHTML = VOCAB.map((v, i) => `
            <div class="verb-row">
                <span class="vr-no">${i + 1}</span>
                <span class="vr-emo">${v.emoji}</span>
                <span class="vr-v1">${escapeHtml(v.w)}</span>
                <span class="vr-v2">${escapeHtml(v.v2)}</span>
                <span class="vr-v3">${escapeHtml(v.v3)}</span>
                <span class="vr-vi">${escapeHtml(v.vi)}</span>
            </div>`).join('');
    }

    function bindEvents() {
        $('btn-check').addEventListener('click', () => { sfx.init(); onCheckClick(); });

        // Thoát về bản đồ nhưng VẪN GIỮ chỗ đang học để quay lại sau
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

        $('btn-drop').addEventListener('click', () => {
            if (!confirm('Bỏ lượt học dở này? Điểm của lượt đó sẽ không được tính.')) return;
            clearRun();
            renderMap();
            showToast('🗑️ Đã bỏ lượt học dở');
        });

        $('btn-theory').addEventListener('click', () => { sfx.init(); openModal('modal-theory'); });

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
            save = { xp: 0, best: 0, stars: {} };
            persist();
            clearRun();
            setHash('');
            showScreen('map');
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

        if (TTS_OK) {
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
        renderTheoryVerbs();
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
