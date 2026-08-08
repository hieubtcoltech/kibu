/* =========================================================
   ENGLISH ADVENTURE — DATA WORLDS & 100 LEVELS (Grades 2-5)
   Decoupled Data-Driven Educational Content Engine
   ========================================================= */

window.ENGLISH_WORLDS = [
    {
        id: 'world-1',
        order: 1,
        title: '🌱 English Starter',
        subtitle: 'Pronouns + To Be + Kiến thức nền tảng',
        grade: 'Lớp 2',
        gradeMin: 2,
        icon: '🌱',
        color: '#3ddc84',
        levels: [
            {
                id: 'w1-l1',
                order: 1,
                title: 'I / You / He / She / It',
                topic: 'Personal Pronouns',
                desc: 'Học các đại từ nhân xưng cơ bản chỉ người và vật.',
                items: [
                    { kind: 'choice', prompt: 'Chọn từ nghĩa là <b>“Tớ / Tôi”</b>:', emoji: '🙋‍♂️', opts: ['I', 'You', 'He', 'She'], ans: 0, why: '<b>I</b> = Tôi, tớ, mình.' },
                    { kind: 'choice', prompt: 'Chọn đại từ thay thế cho <b>bạn nam (Cậu ấy / Anh ấy)</b>:', emoji: '👦', opts: ['He', 'She', 'It', 'They'], ans: 0, why: '<b>He</b> dùng cho nam số ít.' },
                    { kind: 'choice', prompt: 'Chọn đại từ thay thế cho <b>bạn nữ (Cô ấy / Bạn ấy)</b>:', emoji: '👧', opts: ['She', 'He', 'It', 'We'], ans: 0, why: '<b>She</b> dùng cho nữ số ít.' },
                    { kind: 'choice', prompt: 'Chọn đại từ chỉ <b>con vật / đồ vật (Nó)</b>:', emoji: '🐶', opts: ['It', 'She', 'He', 'You'], ans: 0, why: '<b>It</b> chỉ đồ vật hoặc con vật số ít.' },
                    { kind: 'match', title: 'Nối đại từ tiếng Anh với nghĩa tiếng Việt', leftLabel: 'Tiếng Anh', rightLabel: 'Tiếng Việt', pairs: [['I', 'tớ, tôi'], ['You', 'bạn'], ['He', 'cậu ấy (nam)'], ['She', 'cô ấy (nữ)'], ['It', 'nó (vật/con vật)']] }
                ]
            },
            {
                id: 'w1-l2',
                order: 2,
                title: 'I am',
                topic: 'To Be with I',
                desc: 'Học cấu trúc "I am..." để giới thiệu bản thân.',
                items: [
                    { kind: 'choice', prompt: 'Điền từ đúng: “I ______ a student.”', emoji: '🎒', opts: ['am', 'is', 'are', 'be'], ans: 0, why: 'Chủ ngữ <b>I</b> luôn đi với động từ to-be <b>am</b>.' },
                    { kind: 'fill', prompt: 'I ______ happy today.', cue: '(be)', emoji: '😊', answers: ['am', 'i am'], bank: ['am', 'is', 'are'], why: '<b>I + am</b> (Tớ đang rất vui).' },
                    { kind: 'build', target: 'I am seven years old .', emoji: '🎂', vi: 'Tớ 7 tuổi.', why: 'Cấu trúc giới thiệu tuổi: I + am + số tuổi + years old.' },
                    { kind: 'listen', sentence: 'I am a good boy.', display: 'I ______ a good boy.', emoji: '👦', answers: ['am'], bank: ['am', 'is', 'are'], why: 'Nghe từ <b>am</b>.' }
                ]
            },
            {
                id: 'w1-l3',
                order: 3,
                title: 'He / She is',
                topic: 'To Be with He/She',
                desc: 'Học cách miêu tả một người khác dùng "is".',
                items: [
                    { kind: 'choice', prompt: 'He ______ a doctor.', emoji: '👨‍⚕️', opts: ['is', 'am', 'are', 'be'], ans: 0, why: '<b>He</b> (anh ấy) số ít đi với <b>is</b>.' },
                    { kind: 'choice', prompt: 'She ______ my teacher.', emoji: '👩‍🏫', opts: ['is', 'am', 'are', 'be'], ans: 0, why: '<b>She</b> (cô ấy) số ít đi với <b>is</b>.' },
                    { kind: 'fill', prompt: 'My brother ______ tall.', cue: '(be)', emoji: '🧍‍♂️', answers: ['is'], bank: ['is', 'am', 'are'], why: 'My brother (anh tớ) = He → đi với <b>is</b>.' },
                    { kind: 'build', target: 'She is a clever girl .', emoji: '👧', vi: 'Cô ấy là một cô gái thông minh.', why: 'She + is + a + adjective + noun.' }
                ]
            },
            {
                id: 'w1-l4',
                order: 4,
                title: 'You / We / They are',
                topic: 'To Be with Plurals',
                desc: 'Dùng "are" với số nhiều và từ "You".',
                items: [
                    { kind: 'choice', prompt: 'We ______ best friends.', emoji: '👫', opts: ['are', 'is', 'am', 'be'], ans: 0, why: '<b>We</b> (chúng tớ) số nhiều đi với <b>are</b>.' },
                    { kind: 'choice', prompt: 'They ______ playing in the park.', emoji: '🛝', opts: ['are', 'is', 'am', 'be'], ans: 0, why: '<b>They</b> (họ / chúng nó) đi với <b>are</b>.' },
                    { kind: 'fill', prompt: 'You ______ very kind.', cue: '(be)', emoji: '🌟', answers: ['are'], bank: ['are', 'is', 'am'], why: '<b>You</b> luôn đi với <b>are</b>.' },
                    { kind: 'match', title: 'Nối đại từ số nhiều với động từ To Be tương ứng', leftLabel: 'Chủ ngữ', rightLabel: 'To Be', pairs: [['I', 'am'], ['He', 'is'], ['She', 'is'], ['We', 'are'], ['They', 'are']] }
                ]
            },
            {
                id: 'w1-l5',
                order: 5,
                title: 'am / is / are',
                topic: 'To Be Summary',
                desc: 'Phân biệt chính xác am, is, are cho mọi chủ ngữ.',
                items: [
                    { kind: 'choice', prompt: 'The cat ______ sleeping.', emoji: '🐱', opts: ['is', 'are', 'am', 'be'], ans: 0, why: 'The cat (1 con mèo) = số ít → dùng <b>is</b>.' },
                    { kind: 'choice', prompt: 'The dogs ______ barking.', emoji: '🐕‍🕳️', opts: ['are', 'is', 'am', 'be'], ans: 0, why: 'The dogs (các con chó) = số nhiều → dùng <b>are</b>.' },
                    { kind: 'fill', prompt: 'I ______ ready to play.', cue: '(be)', emoji: '🚀', answers: ['am'], bank: ['am', 'is', 'are'], why: 'I đi với <b>am</b>.' },
                    { kind: 'sort', title: 'Phân loại chủ ngữ đi với IS hay ARE', leftLabel: 'Dùng IS (số ít)', rightLabel: 'Dùng ARE (số nhiều / you)', pairs: [['He', 'We'], ['She', 'They'], ['It', 'You'], ['My dad', 'My friends']] }
                ]
            },
            {
                id: 'w1-l6',
                order: 6,
                title: 'To Be Negative',
                topic: 'To Be + Not',
                desc: 'Học câu phủ định: am not, is not (isn\'t), are not (aren\'t).',
                items: [
                    { kind: 'choice', prompt: 'He ______ sad today.', emoji: '😢', opts: ['is not', 'am not', 'are not', 'be not'], ans: 0, why: 'Phủ định của is là <b>is not</b> (isn\'t).' },
                    { kind: 'fill', prompt: 'They ______ at home now.', cue: '(be / not)', emoji: '🏠', answers: ["aren't", 'are not'], bank: ["aren't", "isn't", "am not"], why: 'They đi với <b>are not / aren\'t</b>.' },
                    { kind: 'build', target: 'I am not hungry .', emoji: '🍕', vi: 'Tớ không đói.', why: 'I + am + not + tính từ.' },
                    { kind: 'choice', prompt: 'Dạng viết tắt của <b>is not</b> là gì?', emoji: '✍️', opts: ["isn't", "aren't", "am't", "isnt't"], ans: 0, why: '<b>is not → isn\'t</b>.' }
                ]
            },
            {
                id: 'w1-l7',
                order: 7,
                title: 'Is he...? / Are they...?',
                topic: 'To Be Questions',
                desc: 'Học cách đặt câu hỏi và trả lời Yes / No với To Be.',
                items: [
                    { kind: 'choice', prompt: '______ she your sister?', emoji: '👧', opts: ['Is', 'Are', 'Am', 'Do'], ans: 0, why: 'Chủ ngữ <b>she</b> → đảo <b>Is</b> lên đầu câu hỏi.' },
                    { kind: 'choice', prompt: '______ you ready? — Yes, I am!', emoji: '🏁', opts: ['Are', 'Is', 'Am', 'Does'], ans: 0, why: 'Chủ ngữ <b>you</b> → dùng <b>Are</b>.' },
                    { kind: 'fill', prompt: 'Is he hungry? — Yes, he ______.', cue: '(be)', emoji: '🍔', answers: ['is'], bank: ['is', 'are', 'am'], why: 'Trả lời ngắn: Yes, he <b>is</b>.' },
                    { kind: 'build', target: 'Are they happy ?', emoji: '😄', vi: 'Họ có vui không?', why: 'Câu hỏi To Be: Are + They + tính từ ?' }
                ]
            },
            {
                id: 'w1-l8',
                order: 8,
                title: 'Numbers & Ages',
                topic: 'Numbers 1-10',
                desc: 'Đếm số và hỏi đáp tuổi tác.',
                items: [
                    { kind: 'choice', prompt: 'Số <b>8</b> trong tiếng Anh viết là gì?', emoji: '8️⃣', opts: ['eight', 'seven', 'nine', 'ten'], ans: 0, why: '8 = <b>eight</b> /eɪt/.' },
                    { kind: 'choice', prompt: '“How old are you?” nghĩa là gì?', emoji: '❓', opts: ['Bạn bao nhiêu tuổi?', 'Bạn tên là gì?', 'Bạn khỏe không?', 'Bạn ở đâu?'], ans: 0, why: 'How old are you = Bạn bao nhiêu tuổi?' },
                    { kind: 'match', title: 'Nối số với chữ tiếng Anh', leftLabel: 'Số', rightLabel: 'Chữ', pairs: [['1', 'one'], ['3', 'three'], ['5', 'five'], ['7', 'seven'], ['10', 'ten']] },
                    { kind: 'fill', prompt: 'I have ______ apples.', cue: '(5)', emoji: '🍎', answers: ['five'], bank: ['five', 'four', 'six'], why: '5 = <b>five</b>.' }
                ]
            },
            {
                id: 'w1-l9',
                order: 9,
                title: 'Colors & Objects',
                topic: 'Colors & Vocabulary',
                desc: 'Học các màu sắc quen thuộc và đồ vật.',
                items: [
                    { kind: 'choice', prompt: 'Màu <b>đỏ</b> trong tiếng Anh là gì?', emoji: '🔴', opts: ['red', 'blue', 'green', 'yellow'], ans: 0, why: 'Red /red/ = màu đỏ.' },
                    { kind: 'choice', prompt: 'Quả chuối có màu gì? “The banana is ______.”', emoji: '🍌', opts: ['yellow', 'pink', 'purple', 'black'], ans: 0, why: 'Banana is <b>yellow</b> (màu vàng).' },
                    { kind: 'match', title: 'Nối màu sắc tiếng Anh với tiếng Việt', leftLabel: 'English', rightLabel: 'Tiếng Việt', pairs: [['blue', 'xanh dương'], ['green', 'xanh lá'], ['yellow', 'màu vàng'], ['pink', 'màu hồng'], ['white', 'màu trắng']] },
                    { kind: 'build', target: 'The sky is blue .', emoji: '🌤️', vi: 'Bầu trời có màu xanh dương.', why: 'Chủ ngữ + is + màu sắc.' }
                ]
            },
            {
                id: 'w1-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: To Be Master',
                topic: 'World 1 Boss Challenge',
                desc: 'Thử thách tổng hợp toàn bộ đại từ, động từ To Be, số đếm và màu sắc!',
                items: [
                    { kind: 'choice', prompt: 'She ______ eight years old.', emoji: '🎂', opts: ['is', 'are', 'am', 'be'], ans: 0, why: 'She đi với <b>is</b>.' },
                    { kind: 'fill', prompt: 'We ______ not sad.', cue: '(be)', emoji: '😄', answers: ['are'], bank: ['are', 'is', 'am'], why: 'We đi với <b>are</b>.' },
                    { kind: 'build', target: 'It is a red apple .', emoji: '🍎', vi: 'Nó là một quả táo màu đỏ.', why: 'It + is + a + color + noun.' },
                    { kind: 'listen', sentence: 'They are my best friends.', display: 'They ______ my best friends.', emoji: '👫', answers: ['are'], bank: ['are', 'is', 'am'], why: 'Nghe từ <b>are</b>.' },
                    { kind: 'choice', prompt: 'Câu nào <b>đúng</b> ngữ pháp?', emoji: '🎯', opts: ['I am a clever student.', 'I is a clever student.', 'I are a clever student.', 'I be a clever student.'], ans: 0, why: 'I luôn đi với <b>am</b>.' }
                ]
            }
        ]
    },
    {
        id: 'world-2',
        order: 2,
        title: '🎒 My Everyday World',
        subtitle: 'Have/Has + Demonstratives + Trường học & Gia đình',
        grade: 'Lớp 2',
        gradeMin: 2,
        icon: '🎒',
        color: '#ff9900',
        levels: [
            {
                id: 'w2-l1',
                order: 1,
                title: 'School Objects',
                topic: 'Vocabulary',
                desc: 'Học từ vựng dụng cụ học tập.',
                items: [
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“quyển sách”</b>?', emoji: '📖', opts: ['book', 'pen', 'ruler', 'bag'], ans: 0, why: '<b>book</b> = quyển sách.' },
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“cây thước kẻ”</b>?', emoji: '📏', opts: ['ruler', 'pencil', 'eraser', 'desk'], ans: 0, why: '<b>ruler</b> = thước kẻ.' },
                    { kind: 'match', title: 'Nối dụng cụ học tập', leftLabel: 'English', rightLabel: 'Tiếng Việt', pairs: [['pen', 'cây bút mực'], ['pencil', 'bút chì'], ['bag', 'cặp sách'], ['desk', 'bàn học'], ['eraser', 'cục tẩy']] }
                ]
            },
            {
                id: 'w2-l2',
                order: 2,
                title: 'Family',
                topic: 'Family Members',
                desc: 'Từ vựng về các thành viên trong gia đình.',
                items: [
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“Mẹ”</b>?', emoji: '👩', opts: ['mother', 'father', 'brother', 'sister'], ans: 0, why: '<b>mother</b> (mum/mom) = mẹ.' },
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“Bố”</b>?', emoji: '👨', opts: ['father', 'mother', 'grandma', 'baby'], ans: 0, why: '<b>father</b> (dad) = bố.' },
                    { kind: 'match', title: 'Nối thành viên gia đình', leftLabel: 'English', rightLabel: 'Tiếng Việt', pairs: [['brother', 'anh/em trai'], ['sister', 'chị/em gái'], ['grandma', 'bà'], ['grandpa', 'ông'], ['baby', 'em bé']] }
                ]
            },
            {
                id: 'w2-l3',
                order: 3,
                title: 'I / You have',
                topic: 'Have got',
                desc: 'Học cách nói "Tớ có..." dùng have.',
                items: [
                    { kind: 'choice', prompt: 'I ______ a new schoolbag.', emoji: '🎒', opts: ['have', 'has', 'having', 'is'], ans: 0, why: '<b>I</b> đi với <b>have</b>.' },
                    { kind: 'fill', prompt: 'You ______ two blue pens.', cue: '(have)', emoji: '🖊️', answers: ['have'], bank: ['have', 'has'], why: '<b>You + have</b>.' },
                    { kind: 'build', target: 'I have a red bicycle .', emoji: '🚲', vi: 'Tớ có một chiếc xe đạp màu đỏ.', why: 'I + have + a + noun.' }
                ]
            },
            {
                id: 'w2-l4',
                order: 4,
                title: 'He / She has',
                topic: 'Has got',
                desc: 'Nói về sở hữu của người khác dùng has.',
                items: [
                    { kind: 'choice', prompt: 'He ______ a cute puppy.', emoji: '🐶', opts: ['has', 'have', 'having', 'are'], ans: 0, why: '<b>He</b> (số ít) đi với <b>has</b>.' },
                    { kind: 'choice', prompt: 'She ______ a long pink ruler.', emoji: '📏', opts: ['has', 'have', 'is', 'am'], ans: 0, why: '<b>She</b> đi với <b>has</b>.' },
                    { kind: 'fill', prompt: 'My sister ______ three books.', cue: '(have)', emoji: '📚', answers: ['has'], bank: ['has', 'have'], why: 'My sister = She → dùng <b>has</b>.' }
                ]
            },
            {
                id: 'w2-l5',
                order: 5,
                title: 'Have vs Has',
                topic: 'Sorting & Grammar',
                desc: 'Phân biệt khi nào dùng HAVE và HAS.',
                items: [
                    { kind: 'sort', title: 'Phân loại chủ ngữ dùng HAVE hay HAS', leftLabel: 'Dùng HAVE', rightLabel: 'Dùng HAS', pairs: [['I', 'He'], ['You', 'She'], ['We', 'It'], ['They', 'My brother']] },
                    { kind: 'choice', prompt: 'We ______ a big house.', emoji: '🏡', opts: ['have', 'has', 'are', 'is'], ans: 0, why: 'We số nhiều → <b>have</b>.' }
                ]
            },
            {
                id: 'w2-l6',
                order: 6,
                title: 'This / That',
                topic: 'Demonstratives Singular',
                desc: 'Phân biệt Đây là (This) và Kia là (That).',
                items: [
                    { kind: 'choice', prompt: '______ is my book. (ở gần tay tớ)', emoji: '👉📖', opts: ['This', 'That', 'These', 'Those'], ans: 0, why: 'Vật ở gần số ít → <b>This</b>.' },
                    { kind: 'choice', prompt: '______ is a plane. (ở đằng xa)', emoji: '✈️', opts: ['That', 'This', 'These', 'Those'], ans: 0, why: 'Vật ở xa số ít → <b>That</b>.' }
                ]
            },
            {
                id: 'w2-l7',
                order: 7,
                title: 'These / Those',
                topic: 'Demonstratives Plural',
                desc: 'Phân biệt Đây là những... (These) và Kìa là những... (Those).',
                items: [
                    { kind: 'choice', prompt: '______ are my toys. (ở gần)', emoji: '🧸', opts: ['These', 'Those', 'This', 'That'], ans: 0, why: 'Các vật ở gần số nhiều → <b>These</b>.' },
                    { kind: 'choice', prompt: '______ are birds in the sky. (ở xa)', emoji: '🕊️', opts: ['Those', 'These', 'That', 'This'], ans: 0, why: 'Các vật ở xa số nhiều → <b>Those</b>.' }
                ]
            },
            {
                id: 'w2-l8',
                order: 8,
                title: 'My / Your / His / Her',
                topic: 'Possessive Adjectives',
                desc: 'Học tính từ sở hữu: của tớ, của bạn, của cậu ấy, của cô ấy.',
                items: [
                    { kind: 'choice', prompt: 'This is ______ bag. (của tớ)', emoji: '🎒', opts: ['my', 'your', 'his', 'her'], ans: 0, why: 'Của tớ = <b>my</b>.' },
                    { kind: 'choice', prompt: 'That is ______ hat. (của cậu ấy)', emoji: '🧢', opts: ['his', 'her', 'my', 'your'], ans: 0, why: 'Của cậu ấy (nam) = <b>his</b>.' },
                    { kind: 'choice', prompt: 'This is ______ doll. (của cô ấy)', emoji: '🪆', opts: ['her', 'his', 'my', 'your'], ans: 0, why: 'Của cô ấy (nữ) = <b>her</b>.' }
                ]
            },
            {
                id: 'w2-l9',
                order: 9,
                title: 'Build a Sentence',
                topic: 'Sentence Structure',
                desc: 'Ghép câu sở hữu hoàn chỉnh.',
                items: [
                    { kind: 'build', target: 'This is my new ruler .', emoji: '📏', vi: 'Đây là cây thước mới của tớ.', why: 'This + is + my + adj + noun.' },
                    { kind: 'build', target: 'She has a cute cat .', emoji: '🐱', vi: 'Cô ấy có một con mèo đáng yêu.', why: 'She + has + a + adj + noun.' }
                ]
            },
            {
                id: 'w2-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: My World',
                topic: 'World 2 Boss Challenge',
                desc: 'Thử thách tổng hợp trường học, gia đình, have/has và this/that!',
                items: [
                    { kind: 'choice', prompt: 'My brother ______ a blue car.', emoji: '🚗', opts: ['has', 'have', 'is', 'are'], ans: 0, why: 'My brother (số ít) → <b>has</b>.' },
                    { kind: 'fill', prompt: '______ are my friends over there.', cue: '(ở xa / số nhiều)', emoji: '👫', answers: ['Those'], bank: ['Those', 'These', 'This'], why: 'Ở xa số nhiều → <b>Those</b>.' },
                    { kind: 'build', target: 'He has three books in his bag .', emoji: '🎒', vi: 'Cậu ấy có ba quyển sách trong cặp.', why: 'He + has + ...' }
                ]
            }
        ]
    },
    {
        id: 'world-3',
        order: 3,
        title: '🏠 Where Is It?',
        subtitle: 'Giới từ chỉ vị trí + There is / There are',
        grade: 'Lớp 3',
        gradeMin: 3,
        icon: '🏠',
        color: '#00f0ff',
        levels: [
            {
                id: 'w3-l1',
                order: 1,
                title: 'In / On',
                topic: 'Prepositions',
                desc: 'Phân biệt Ở trong (In) và Ở trên (On).',
                items: [
                    { kind: 'choice', prompt: 'The cat is ______ the box. (ở trong)', emoji: '📦🐱', opts: ['in', 'on', 'under', 'behind'], ans: 0, why: '<b>in</b> = ở trong.' },
                    { kind: 'choice', prompt: 'The book is ______ the table. (ở trên mặt bàn)', emoji: '📖🪑', opts: ['on', 'in', 'under', 'next to'], ans: 0, why: '<b>on</b> = ở trên bề mặt.' }
                ]
            },
            {
                id: 'w3-l2',
                order: 2,
                title: 'Under',
                topic: 'Prepositions',
                desc: 'Học từ Under (ở dưới).',
                items: [
                    { kind: 'choice', prompt: 'The shoes are ______ the bed. (ở dưới gầm giường)', emoji: '👟🛏️', opts: ['under', 'on', 'in', 'above'], ans: 0, why: '<b>under</b> = ở phía dưới.' }
                ]
            },
            {
                id: 'w3-l3',
                order: 3,
                title: 'Behind / In front of',
                topic: 'Prepositions',
                desc: 'Học Behind (phía sau) và In front of (phía trước).',
                items: [
                    { kind: 'choice', prompt: 'The ball is ______ the door. (ở phía sau cửa)', emoji: '⚽🚪', opts: ['behind', 'in front of', 'on', 'in'], ans: 0, why: '<b>behind</b> = ở phía sau.' },
                    { kind: 'choice', prompt: 'The tree is ______ the house. (ở phía trước nhà)', emoji: '🌳🏡', opts: ['in front of', 'behind', 'under', 'between'], ans: 0, why: '<b>in front of</b> = ở phía trước.' }
                ]
            },
            {
                id: 'w3-l4',
                order: 4,
                title: 'Next to / Between',
                topic: 'Prepositions',
                desc: 'Học Next to (bên cạnh) và Between (ở giữa).',
                items: [
                    { kind: 'choice', prompt: 'The chair is ______ the desk. (bên cạnh)', emoji: '🪑🛋️', opts: ['next to', 'between', 'under', 'in'], ans: 0, why: '<b>next to</b> = ngay bên cạnh.' },
                    { kind: 'choice', prompt: 'The lamp is ______ the sofa and the table. (ở giữa hai vật)', emoji: '💡', opts: ['between', 'next to', 'behind', 'on'], ans: 0, why: '<b>between A and B</b> = ở giữa A và B.' }
                ]
            },
            {
                id: 'w3-l5',
                order: 5,
                title: 'Where is...?',
                topic: 'Questions',
                desc: 'Đặt câu hỏi tìm đồ vật: Where is / Where are...?',
                items: [
                    { kind: 'choice', prompt: '______ is my pen? — It\'s on the desk.', emoji: '🖊️', opts: ['Where', 'What', 'Who', 'When'], ans: 0, why: 'Hỏi vị trí dùng từ <b>Where</b>.' }
                ]
            },
            {
                id: 'w3-l6',
                order: 6,
                title: 'There is',
                topic: 'There is',
                desc: 'Nói "Có 1 vật..." dùng There is.',
                items: [
                    { kind: 'choice', prompt: '______ a apple on the table.', emoji: '🍎', opts: ['There is', 'There are', 'They are', 'It are'], ans: 0, why: 'Danh từ số ít <b>an apple</b> → dùng <b>There is</b>.' }
                ]
            },
            {
                id: 'w3-l7',
                order: 7,
                title: 'There are',
                topic: 'There are',
                desc: 'Nói "Có nhiều vật..." dùng There are.',
                items: [
                    { kind: 'choice', prompt: '______ three cats in the room.', emoji: '🐱🐱🐱', opts: ['There are', 'There is', 'It is', 'They is'], ans: 0, why: 'Danh từ số nhiều <b>three cats</b> → dùng <b>There are</b>.' }
                ]
            },
            {
                id: 'w3-l8',
                order: 8,
                title: 'There is vs There are',
                topic: 'Grammar Comparison',
                desc: 'Luyện tập chọn nhanh There is hay There are.',
                items: [
                    { kind: 'sort', title: 'Phân loại dùng THERE IS hay THERE ARE', leftLabel: 'There is (số ít)', rightLabel: 'There are (số nhiều)', pairs: [['a book', 'two books'], ['a dog', 'five dogs'], ['an orange', 'many oranges']] }
                ]
            },
            {
                id: 'w3-l9',
                order: 9,
                title: 'Describe the Room',
                topic: 'Sentence Builder',
                desc: 'Mô tả vị trí các vật trong phòng.',
                items: [
                    { kind: 'build', target: 'There is a cat under the table .', emoji: '🐱🪑', vi: 'Có một con mèo dưới bàn.', why: 'There is + a + noun + preposition + ...' }
                ]
            },
            {
                id: 'w3-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: Find Everything',
                topic: 'World 3 Boss Challenge',
                desc: 'Đại chiến truy tìm đồ vật & giới từ vị trí!',
                items: [
                    { kind: 'choice', prompt: 'Where ______ the keys? — They are on the table.', emoji: '🔑', opts: ['are', 'is', 'am', 'be'], ans: 0, why: 'Keys số nhiều → dùng <b>are</b>.' },
                    { kind: 'build', target: 'There are two books on my desk .', emoji: '📚', vi: 'Có hai quyển sách trên bàn học của tớ.', why: 'There are + plural noun + on my desk.' }
                ]
            }
        ]
    },
    {
        id: 'world-4',
        order: 4,
        title: '☀️ Every Day',
        subtitle: 'Thì Hiện Tại Đơn (Present Simple)',
        grade: 'Lớp 3',
        gradeMin: 3,
        icon: '☀️',
        color: '#ff8c42',
        levels: [
            {
                id: 'w4-l1',
                order: 1,
                title: 'Daily Activities',
                topic: 'Vocabulary',
                desc: 'Học các hoạt động hàng ngày.',
                items: [
                    { kind: 'match', title: 'Nối hoạt động hàng ngày', leftLabel: 'English', rightLabel: 'Tiếng Việt', pairs: [['get up', 'thức dậy'], ['eat breakfast', 'ăn sáng'], ['go to school', 'đi học'], ['do homework', 'làm bài tập'], ['go to bed', 'đi ngủ']] }
                ]
            },
            {
                id: 'w4-l2',
                order: 2,
                title: 'I play / eat / go',
                topic: 'I/You/We/They + V1',
                desc: 'Động từ giữ nguyên với I, You, We, They.',
                items: [
                    { kind: 'choice', prompt: 'I ______ to school every morning.', emoji: '🏫', opts: ['go', 'goes', 'going', 'went'], ans: 0, why: 'Chủ ngữ <b>I</b> → động từ giữ nguyên <b>go</b>.' }
                ]
            },
            {
                id: 'w4-l3',
                order: 3,
                title: 'He plays',
                topic: 'He/She/It + V-s',
                desc: 'Thêm "s" sau động từ đi với He, She, It.',
                items: [
                    { kind: 'choice', prompt: 'He ______ football every afternoon.', emoji: '⚽', opts: ['plays', 'play', 'playing', 'played'], ans: 0, why: 'Chủ ngữ <b>He</b> → động từ thêm -s: <b>plays</b>.' }
                ]
            },
            {
                id: 'w4-l4',
                order: 4,
                title: 'She goes',
                topic: 'Verb + es',
                desc: 'Thêm "es" với các động từ đuôi o, ch, sh, s, x, z.',
                items: [
                    { kind: 'choice', prompt: 'She ______ TV in the evening.', emoji: '📺', opts: ['watches', 'watch', 'watching', 'watched'], ans: 0, why: 'Đuôi -ch thêm -es với chủ ngữ She: <b>watches</b>.' }
                ]
            },
            {
                id: 'w4-l5',
                order: 5,
                title: 'Verb + s / es',
                topic: 'Spelling Rules',
                desc: 'Luyện tập quy tắc s/es với ngôi thứ 3 số ít.',
                items: [
                    { kind: 'fill', prompt: 'Tom ______ (brush) his teeth every day.', cue: '(brush)', emoji: '🪥', answers: ['brushes'], bank: ['brushes', 'brush', 'brushing'], why: 'Tom = He, đuôi -sh → <b>brushes</b>.' }
                ]
            },
            {
                id: 'w4-l6',
                order: 6,
                title: "Don't / Doesn't",
                topic: 'Present Simple Negative',
                desc: 'Phủ định: Don\'t (I/We/They) và Doesn\'t (He/She/It).',
                items: [
                    { kind: 'choice', prompt: 'She ______ like coffee.', emoji: '☕', opts: ["doesn't", "don't", "not", "isn't"], ans: 0, why: 'She số ít → dùng <b>doesn\'t</b> + V nguyên thể.' }
                ]
            },
            {
                id: 'w4-l7',
                order: 7,
                title: 'Do you...?',
                topic: 'Questions with Do',
                desc: 'Đặt câu hỏi Do you / Do they...?',
                items: [
                    { kind: 'choice', prompt: '______ you play basketball?', emoji: '🏀', opts: ['Do', 'Does', 'Are', 'Is'], ans: 0, why: 'Câu hỏi với <b>you</b> → dùng <b>Do</b>.' }
                ]
            },
            {
                id: 'w4-l8',
                order: 8,
                title: 'Does he/she...?',
                topic: 'Questions with Does',
                desc: 'Đặt câu hỏi Does he / Does she...?',
                items: [
                    { kind: 'choice', prompt: '______ he live in Ha Noi?', emoji: '🏙️', opts: ['Does', 'Do', 'Is', 'Are'], ans: 0, why: 'Câu hỏi với <b>he</b> → dùng <b>Does</b>.' }
                ]
            },
            {
                id: 'w4-l9',
                order: 9,
                title: 'Always / Usually / Sometimes / Never',
                topic: 'Adverbs of Frequency',
                desc: 'Trạng từ chỉ tần suất trong thì hiện tại đơn.',
                items: [
                    { kind: 'choice', prompt: 'I ______ drink milk before going to bed. (100% luôn luôn)', emoji: '🥛', opts: ['always', 'sometimes', 'never', 'rarely'], ans: 0, why: 'Luôn luôn = <b>always</b>.' }
                ]
            },
            {
                id: 'w4-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: My Daily Routine',
                topic: 'World 4 Boss Challenge',
                desc: 'Thử thách tổng hợp thì hiện tại đơn!',
                items: [
                    { kind: 'choice', prompt: 'Lan ______ to school by bus every day.', emoji: '🚌', opts: ['goes', 'go', 'going', 'went'], ans: 0, why: 'Lan (số ít) → <b>goes</b>.' },
                    { kind: 'build', target: 'He does not like ice cream .', emoji: '🍦', vi: 'Cậu ấy không thích kem.', why: 'He + does not + like + ...' }
                ]
            }
        ]
    },
    {
        id: 'world-5',
        order: 5,
        title: '🏃 Right Now!',
        subtitle: 'Thì Hiện Tại Tiếp Diễn (Present Continuous)',
        grade: 'Lớp 3',
        gradeMin: 3,
        icon: '🏃',
        color: '#ff007f',
        levels: [
            {
                id: 'w5-l1',
                order: 1,
                title: 'Action Verbs',
                topic: 'Vocabulary',
                desc: 'Các động từ chỉ hành động.',
                items: [
                    { kind: 'match', title: 'Nối động từ hành động', leftLabel: 'English', rightLabel: 'Tiếng Việt', pairs: [['run', 'chạy'], ['swim', 'bơi'], ['dance', 'khiêu vũ'], ['read', 'đọc'], ['cook', 'nấu ăn']] }
                ]
            },
            {
                id: 'w5-l2',
                order: 2,
                title: 'Verb + ing',
                topic: 'V-ing Spelling Rules',
                desc: 'Quy tắc thêm -ing vào sau động từ.',
                items: [
                    { kind: 'choice', prompt: 'Dạng V-ing của <b>run</b> (gấp đôi n) là gì?', emoji: '🏃', opts: ['running', 'runing', 'runed', 'runny'], ans: 0, why: '1 nguyên âm + 1 phụ âm cuối → gấp đôi: <b>running</b>.' }
                ]
            },
            {
                id: 'w5-l3',
                order: 3,
                title: 'I am playing',
                topic: 'I am + V-ing',
                desc: 'Nói hành động tớ đang làm lúc này.',
                items: [
                    { kind: 'build', target: 'I am reading a book now .', emoji: '📖', vi: 'Tớ đang đọc sách ngay lúc này.', why: 'I + am + V-ing + ...' }
                ]
            },
            {
                id: 'w5-l4',
                order: 4,
                title: 'He / She is running',
                topic: 'He/She is + V-ing',
                desc: 'Nói hành động anh ấy / cô ấy đang làm.',
                items: [
                    { kind: 'choice', prompt: 'She ______ a song right now.', emoji: '🎤', opts: ['is singing', 'sings', 'are singing', 'sang'], ans: 0, why: 'She + <b>is singing</b>.' }
                ]
            },
            {
                id: 'w5-l5',
                order: 5,
                title: 'They are eating',
                topic: 'We/They are + V-ing',
                desc: 'Hành động nhóm người đang thực hiện.',
                items: [
                    { kind: 'choice', prompt: 'They ______ football in the yard.', emoji: '⚽', opts: ['are playing', 'is playing', 'play', 'played'], ans: 0, why: 'They đi với <b>are playing</b>.' }
                ]
            },
            {
                id: 'w5-l6',
                order: 6,
                title: 'am / is / are + V-ing',
                topic: 'Full Formula',
                desc: 'Luyện tập ghép To Be + V-ing chuẩn xác.',
                items: [
                    { kind: 'fill', prompt: 'Look! The dog ______ (swim) in the lake.', cue: '(swim)', emoji: '🐕🏊', answers: ['is swimming'], bank: ['is swimming', 'are swimming', 'swims'], why: 'Look! chỉ hành động đang xảy ra: <b>is swimming</b>.' }
                ]
            },
            {
                id: 'w5-l7',
                order: 7,
                title: 'Negative Sentences',
                topic: 'Not + V-ing',
                desc: 'Câu phủ định: am not / isn\'t / aren\'t + V-ing.',
                items: [
                    { kind: 'choice', prompt: 'He ______ sleeping, he is studying!', emoji: '📚', opts: ["isn't", "aren't", "am not", "don't"], ans: 0, why: 'He + <b>isn\'t</b> + V-ing.' }
                ]
            },
            {
                id: 'w5-l8',
                order: 8,
                title: 'What is he/she doing?',
                topic: 'Questions',
                desc: 'Hỏi đáp ai đó đang làm gì.',
                items: [
                    { kind: 'choice', prompt: 'What ______ you doing? — I am drawing.', emoji: '🎨', opts: ['are', 'is', 'am', 'do'], ans: 0, why: 'What + <b>are</b> + you + doing?' }
                ]
            },
            {
                id: 'w5-l9',
                order: 9,
                title: 'Present Simple vs Continuous',
                topic: 'Grammar Distinction',
                desc: 'Phân biệt thói quen (every day) vs Đang làm (now).',
                items: [
                    { kind: 'choice', prompt: 'He usually plays games, but now he ______ a book.', emoji: '📖', opts: ['is reading', 'reads', 'readed', 'read'], ans: 0, why: 'Có <b>now</b> → dùng hiện tại tiếp diễn: <b>is reading</b>.' }
                ]
            },
            {
                id: 'w5-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: What\'s Happening?',
                topic: 'World 5 Boss Challenge',
                desc: 'Thử thách trực quan điều gì đang xảy ra!',
                items: [
                    { kind: 'build', target: 'Look ! They are dancing together .', emoji: '💃🕺', vi: 'Nhìn kìa! Họ đang nhảy cùng nhau.', why: 'Look! + They + are + dancing + ...' }
                ]
            }
        ]
    },
    {
        id: 'world-6',
        order: 6,
        title: '🦖 Yesterday',
        subtitle: 'Thì Quá Khứ Đơn (Past Simple)',
        grade: 'Lớp 4',
        gradeMin: 4,
        icon: '🦖',
        color: '#9d4edd',
        levels: [
            {
                id: 'w6-l1',
                order: 1,
                title: 'Yesterday / Last night',
                topic: 'Time Signals',
                desc: 'Dấu hiệu mốc thời gian trong quá khứ.',
                items: [
                    { kind: 'match', title: 'Nối mốc thời gian quá khứ', leftLabel: 'English', rightLabel: 'Tiếng Việt', pairs: [['yesterday', 'hôm qua'], ['last night', 'tối qua'], ['last week', 'tuần trước'], ['two days ago', '2 ngày trước']] }
                ]
            },
            {
                id: 'w6-l2',
                order: 2,
                title: 'Was / Were',
                topic: 'Past To Be',
                desc: 'To Be trong quá khứ: Was (số ít) và Were (số nhiều/you).',
                items: [
                    { kind: 'choice', prompt: 'I ______ at the zoo yesterday.', emoji: '🦁', opts: ['was', 'were', 'am', 'is'], ans: 0, why: 'I đi với <b>was</b> trong quá khứ.' },
                    { kind: 'choice', prompt: 'They ______ happy last Sunday.', emoji: '😊', opts: ['were', 'was', 'are', 'is'], ans: 0, why: 'They đi với <b>were</b> trong quá khứ.' }
                ]
            },
            {
                id: 'w6-l3',
                order: 3,
                title: 'Played / Watched',
                topic: 'Regular Verbs -ed',
                desc: 'Thêm -ed vào động từ có quy tắc.',
                items: [
                    { kind: 'choice', prompt: 'We ______ football yesterday afternoon.', emoji: '⚽', opts: ['played', 'play', 'playing', 'plays'], ans: 0, why: 'Có <b>yesterday</b> → dùng V-ed: <b>played</b>.' }
                ]
            },
            {
                id: 'w6-l4',
                order: 4,
                title: 'Regular Verbs -ed',
                topic: 'Spelling Rules',
                desc: 'Các quy tắc thêm -ed (lived, stopped, studied).',
                items: [
                    { kind: 'fill', prompt: 'She ______ (study) English last night.', cue: '(study)', emoji: '📖', answers: ['studied'], bank: ['studied', 'studyed', 'study'], why: 'y đổi thành i + ed: <b>studied</b>.' }
                ]
            },
            {
                id: 'w6-l5',
                order: 5,
                title: 'Go → Went',
                topic: 'Irregular Verbs',
                desc: 'Động từ bất quy tắc nhóm 1.',
                items: [
                    { kind: 'choice', prompt: 'Quá khứ (V2) của <b>go</b> là gì?', emoji: '🚶', opts: ['went', 'gone', 'goed', 'going'], ans: 0, why: 'go → <b>went</b>.' }
                ]
            },
            {
                id: 'w6-l6',
                order: 6,
                title: 'Eat → Ate / Drink → Drank',
                topic: 'Irregular Verbs',
                desc: 'Động từ bất quy tắc nhóm 2.',
                items: [
                    { kind: 'match', title: 'Nối V1 với V2 quá khứ', leftLabel: 'V1', rightLabel: 'V2 (Quá khứ)', pairs: [['eat', 'ate'], ['drink', 'drank'], ['sing', 'sang'], ['swim', 'swam']] }
                ]
            },
            {
                id: 'w6-l7',
                order: 7,
                title: 'See → Saw / Have → Had',
                topic: 'Irregular Verbs',
                desc: 'Động từ bất quy tắc nhóm 3.',
                items: [
                    { kind: 'match', title: 'Nối V1 với V2 quá khứ', leftLabel: 'V1', rightLabel: 'V2 (Quá khứ)', pairs: [['see', 'saw'], ['have', 'had'], ['make', 'made'], ['buy', 'bought']] }
                ]
            },
            {
                id: 'w6-l8',
                order: 8,
                title: "Didn't",
                topic: 'Past Negative',
                desc: 'Câu phủ định quá khứ: didn\'t + V1 nguyên thể.',
                items: [
                    { kind: 'choice', prompt: 'I ______ go to school yesterday.', emoji: '🏠', opts: ["didn't", "don't", "wasn't", "not"], ans: 0, why: 'Phủ định quá khứ dùng <b>didn\'t</b> + V1.' }
                ]
            },
            {
                id: 'w6-l9',
                order: 9,
                title: 'Did you...?',
                topic: 'Past Questions',
                desc: 'Đặt câu hỏi quá khứ với Did.',
                items: [
                    { kind: 'choice', prompt: '______ you see the movie last night?', emoji: '🎬', opts: ['Did', 'Do', 'Were', 'Was'], ans: 0, why: 'Hỏi quá khứ dùng <b>Did</b> + S + V1?' }
                ]
            },
            {
                id: 'w6-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: Yesterday Adventure',
                topic: 'World 6 Boss Challenge',
                desc: 'Thử thách quá khứ đơn dũng cảm!',
                items: [
                    { kind: 'build', target: 'We went to the beach yesterday .', emoji: '🏖️', vi: 'Chúng tớ đã đi biển hôm qua.', why: 'We + went (V2) + to ...' }
                ]
            }
        ]
    },
    {
        id: 'world-7',
        order: 7,
        title: '🚀 Tomorrow',
        subtitle: 'Thì Tương Lai (Will & Be Going To)',
        grade: 'Lớp 4',
        gradeMin: 4,
        icon: '🚀',
        color: '#3ddc84',
        levels: [
            {
                id: 'w7-l1',
                order: 1,
                title: 'Tomorrow / Next week',
                topic: 'Future Time Signals',
                desc: 'Các mốc thời gian trong tương lai.',
                items: [
                    { kind: 'match', title: 'Nối mốc tương lai', leftLabel: 'English', rightLabel: 'Tiếng Việt', pairs: [['tomorrow', 'ngày mai'], ['next week', 'tuần sau'], ['next year', 'năm sau'], ['soon', 'sớm thôi']] }
                ]
            },
            {
                id: 'w7-l2',
                order: 2,
                title: 'Will',
                topic: 'Future Simple',
                desc: 'Dự đoán hoặc quyết định bộc phát với Will + V1.',
                items: [
                    { kind: 'choice', prompt: 'I ______ help you with your homework.', emoji: '🤝', opts: ['will', 'was', 'did', 'have'], ans: 0, why: 'Hành động hứa hẹn trong tương lai dùng <b>will</b> + V1.' }
                ]
            },
            {
                id: 'w7-l3',
                order: 3,
                title: "Will not / Won't",
                topic: 'Future Negative',
                desc: 'Phủ định tương lai đơn: won\'t + V1.',
                items: [
                    { kind: 'choice', prompt: 'It ______ rain tomorrow.', emoji: '☀️', opts: ["won't", "doesn't", "didn't", "isn't"], ans: 0, why: 'Dạng viết tắt của will not là <b>won\'t</b>.' }
                ]
            },
            {
                id: 'w7-l4',
                order: 4,
                title: 'Will you...?',
                topic: 'Future Questions',
                desc: 'Hỏi hoặc nhờ vả trong tương lai: Will you...?',
                items: [
                    { kind: 'choice', prompt: '______ you come to my party tomorrow?', emoji: '🎉', opts: ['Will', 'Do', 'Did', 'Are'], ans: 0, why: 'Câu hỏi tương lai đảo <b>Will</b> lên đầu.' }
                ]
            },
            {
                id: 'w7-l5',
                order: 5,
                title: 'Predictions',
                topic: 'Future Predictions',
                desc: 'Dự đoán tương lai (Robots will help humans).',
                items: [
                    { kind: 'build', target: 'Robots will do the housework .', emoji: '🤖', vi: 'Rô-bốt sẽ làm việc nhà.', why: 'S + will + V1 + O.' }
                ]
            },
            {
                id: 'w7-l6',
                order: 6,
                title: 'Be Going To',
                topic: 'Intention',
                desc: 'Dự định có kế hoạch trước: am/is/are going to + V1.',
                items: [
                    { kind: 'choice', prompt: 'I am ______ to visit my grandparents this weekend.', emoji: '👵👨‍🦳', opts: ['going', 'go', 'went', 'gone'], ans: 0, why: 'Cấu trúc dự định: be <b>going</b> to + V1.' }
                ]
            },
            {
                id: 'w7-l7',
                order: 7,
                title: 'Plans',
                topic: 'Future Plans',
                desc: 'Nói về kế hoạch đã lên lịch sẵn.',
                items: [
                    { kind: 'fill', prompt: 'She ______ (be) going to buy a new bike.', cue: '(be)', emoji: '🚲', answers: ['is'], bank: ['is', 'are', 'am'], why: 'She đi với <b>is</b> going to.' }
                ]
            },
            {
                id: 'w7-l8',
                order: 8,
                title: 'Will vs Going To',
                topic: 'Grammar Distinction',
                desc: 'Phân biệt Will (bộc phát) vs Going To (có kế hoạch).',
                items: [
                    { kind: 'choice', prompt: 'Look at those dark clouds! It ______ rain!', emoji: '🌧️', opts: ['is going to', 'will', 'was', 'did'], ans: 0, why: 'Dự đoán có dấu hiệu rõ ràng (mây đen) → dùng <b>is going to</b>.' }
                ]
            },
            {
                id: 'w7-l9',
                order: 9,
                title: 'My Future Plan',
                topic: 'Sentence Builder',
                desc: 'Viết về ước mơ và kế hoạch tương lai.',
                items: [
                    { kind: 'build', target: 'I am going to be an astronaut .', emoji: '👨‍🚀', vi: 'Tớ sẽ trở thành một phi hành gia.', why: 'I am going to be ...' }
                ]
            },
            {
                id: 'w7-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: Future Adventure',
                topic: 'World 7 Boss Challenge',
                desc: 'Thử thách chinh phục hành trình tương lai!',
                items: [
                    { kind: 'choice', prompt: 'We ______ travel to the moon in 2050.', emoji: '🌕', opts: ['will', 'did', 'are', 'were'], ans: 0, why: 'Tương lai xa năm 2050 → <b>will</b>.' }
                ]
            }
        ]
    },
    {
        id: 'world-8',
        order: 8,
        title: '🏆 Compare & Describe',
        subtitle: 'Tính Từ + So Sánh Hơn (-er) & So Sánh Nhất (-est)',
        grade: 'Lớp 4',
        gradeMin: 4,
        icon: '🏆',
        color: '#ffd700',
        levels: [
            {
                id: 'w8-l1',
                order: 1,
                title: 'Adjectives',
                topic: 'Vocabulary',
                desc: 'Các tính từ miêu tả đặc điểm.',
                items: [
                    { kind: 'match', title: 'Nối cặp tính từ trái ngược', leftLabel: 'Tính từ', rightLabel: 'Trái nghĩa', pairs: [['big', 'small'], ['tall', 'short'], ['fast', 'slow'], ['hot', 'cold'], ['happy', 'sad']] }
                ]
            },
            {
                id: 'w8-l2',
                order: 2,
                title: 'Big / Small / Tall / Short',
                topic: 'Basic Adjectives',
                desc: 'Nhận biết kích thước và chiều cao.',
                items: [
                    { kind: 'choice', prompt: 'The elephant is very ______. (to lớn)', emoji: '🐘', opts: ['big', 'small', 'short', 'thin'], ans: 0, why: 'Voi thì <b>big</b> (to lớn).' }
                ]
            },
            {
                id: 'w8-l3',
                order: 3,
                title: 'Bigger / Smaller',
                topic: 'Comparatives -er',
                desc: 'So sánh hơn: thêm -er + than.',
                items: [
                    { kind: 'choice', prompt: 'An elephant is ______ than a mouse.', emoji: '🐘🐭', opts: ['bigger', 'big', 'biggest', 'more big'], ans: 0, why: 'So sánh hơn của big là <b>bigger</b> (gấp đôi g).' }
                ]
            },
            {
                id: 'w8-l4',
                order: 4,
                title: 'Taller / Shorter',
                topic: 'Comparatives',
                desc: 'So sánh cao hơn và ngắn/thấp hơn.',
                items: [
                    { kind: 'choice', prompt: 'A giraffe is ______ than a horse.', emoji: '🦒🐴', opts: ['taller', 'tall', 'tallest', 'more tall'], ans: 0, why: 'Giraffe cao hơn → <b>taller</b>.' }
                ]
            },
            {
                id: 'w8-l5',
                order: 5,
                title: 'Faster / Slower',
                topic: 'Comparatives Speed',
                desc: 'So sánh tốc độ nhanh hơn / chậm hơn.',
                items: [
                    { kind: 'choice', prompt: 'A cheetah is ______ than a turtle.', emoji: '🐆🐢', opts: ['faster', 'slower', 'fastest', 'slow'], ans: 0, why: 'Báo gấm nhanh hơn rùa → <b>faster</b>.' }
                ]
            },
            {
                id: 'w8-l6',
                order: 6,
                title: 'The Biggest',
                topic: 'Superlatives -est',
                desc: 'So sánh nhất: the + adj-est.',
                items: [
                    { kind: 'choice', prompt: 'The blue whale is ______ animal in the world.', emoji: '🐋', opts: ['the biggest', 'bigger', 'big', 'most big'], ans: 0, why: 'So sánh nhất → <b>the biggest</b>.' }
                ]
            },
            {
                id: 'w8-l7',
                order: 7,
                title: 'The Fastest',
                topic: 'Superlatives',
                desc: 'Ai là người / vật nhanh nhất?',
                items: [
                    { kind: 'choice', prompt: 'Which animal is ______? (nhanh nhất)', emoji: '🐆', opts: ['the fastest', 'faster', 'fast', 'more fast'], ans: 0, why: 'Nhanh nhất = <b>the fastest</b>.' }
                ]
            },
            {
                id: 'w8-l8',
                order: 8,
                title: 'Good → Better → Best',
                topic: 'Irregular Comparatives',
                desc: 'So sánh bất quy tắc: Good → Better → Best.',
                items: [
                    { kind: 'match', title: 'Nối các cấp so sánh bất quy tắc', leftLabel: 'Tính từ gốc', rightLabel: 'So sánh hơn / nhất', pairs: [['good', 'better (tốt hơn)'], ['better', 'the best (tốt nhất)'], ['bad', 'worse (tệ hơn)'], ['worse', 'the worst (tệ nhất)']] }
                ]
            },
            {
                id: 'w8-l9',
                order: 9,
                title: 'Compare Animals',
                topic: 'Sentence Builder',
                desc: 'Ghép câu so sánh các loài động vật.',
                items: [
                    { kind: 'build', target: 'A tiger is faster than a cat .', emoji: '🐅🐱', vi: 'Hổ nhanh hơn mèo.', why: 'A tiger + is + faster + than + a cat.' }
                ]
            },
            {
                id: 'w8-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: Animal Championship',
                topic: 'World 8 Boss Challenge',
                desc: 'Đại hội so sánh muôn thú!',
                items: [
                    { kind: 'choice', prompt: 'The cheetah is the ______ animal of all.', emoji: '🥇', opts: ['fastest', 'faster', 'fast', 'more fast'], ans: 0, why: 'Trong tất cả → dùng so sánh nhất <b>fastest</b>.' }
                ]
            }
        ]
    },
    {
        id: 'world-9',
        order: 9,
        title: '⭐ My Experiences',
        subtitle: 'Thì Hiện Tại Hoàn Thành (Present Perfect)',
        grade: 'Lớp 5',
        gradeMin: 5,
        icon: '⭐',
        color: '#ff8c42',
        levels: [
            {
                id: 'w9-l1',
                order: 1,
                title: 'Irregular Verbs V3 · Part 1',
                topic: 'V3 Past Participle',
                desc: '10 động từ đầu: speak, draw, catch, do, eat, drink, run, swim, sing, write.',
                items: [
                    { kind: 'choice', prompt: 'Dạng V3 của <b>speak</b> là gì?', emoji: '🗣️', opts: ['spoken', 'spoke', 'speaked', 'speaking'], ans: 0, why: 'speak → spoke → <b>spoken</b>.' },
                    { kind: 'choice', prompt: 'Dạng V3 của <b>eat</b> là gì?', emoji: '🍕', opts: ['eaten', 'ate', 'eated', 'eating'], ans: 0, why: 'eat → ate → <b>eaten</b>.' }
                ]
            },
            {
                id: 'w9-l2',
                order: 2,
                title: 'Irregular Verbs V3 · Part 2',
                topic: 'V3 Past Participle',
                desc: '10 động từ tiếp theo: read, make, buy, take, give, come, sleep, sit, stand, fly.',
                items: [
                    { kind: 'choice', prompt: 'Dạng V3 của <b>fly</b> là gì?', emoji: '✈️', opts: ['flown', 'flew', 'flied', 'flying'], ans: 0, why: 'fly → flew → <b>flown</b>.' },
                    { kind: 'choice', prompt: 'Dạng V3 của <b>buy</b> là gì?', emoji: '🛒', opts: ['bought', 'brought', 'buyed', 'buying'], ans: 0, why: 'buy → <b>bought</b>.' }
                ]
            },
            {
                id: 'w9-l3',
                order: 3,
                title: 'Irregular Verbs V3 · Part 3',
                topic: 'V3 Past Participle',
                desc: '10 động từ cao cấp: go, see, know, find, think, tell, meet, win, drive, grow.',
                items: [
                    { kind: 'choice', prompt: 'Dạng V3 của <b>go</b> là gì?', emoji: '🚶', opts: ['gone', 'went', 'goed', 'going'], ans: 0, why: 'go → went → <b>gone</b>.' },
                    { kind: 'choice', prompt: 'Dạng V3 của <b>see</b> là gì?', emoji: '👁️', opts: ['seen', 'saw', 'seeing', 'so'], ans: 0, why: 'see → saw → <b>seen</b>.' }
                ]
            },
            {
                id: 'w9-l4',
                order: 4,
                title: 'Matching V1 & V3',
                topic: 'V1 to V3 Matching',
                desc: 'Nối động từ nguyên thể với cột V3.',
                items: [
                    { kind: 'match', title: 'Nối V1 với V3', leftLabel: 'V1', rightLabel: 'V3', pairs: [['go', 'gone'], ['see', 'seen'], ['know', 'known'], ['win', 'won'], ['drive', 'driven']] }
                ]
            },
            {
                id: 'w9-l5',
                order: 5,
                title: 'Have / Has + V3',
                topic: 'Affirmative Sentences',
                desc: 'Cấu trúc khẳng định: S + have/has + V3.',
                items: [
                    { kind: 'build', target: 'I have done my homework .', emoji: '📋', vi: 'Tớ đã làm xong bài tập.', why: 'I + have + done (V3).' }
                ]
            },
            {
                id: 'w9-l6',
                order: 6,
                title: "Haven't / Hasn't + Yet",
                topic: 'Negative Sentences',
                desc: 'Phủ định hiện tại hoàn thành với từ Yet ở cuối câu.',
                items: [
                    { kind: 'choice', prompt: 'She hasn\'t written her diary ______.', emoji: '⏳', opts: ['yet', 'already', 'since', 'ever'], ans: 0, why: 'Câu phủ định dùng <b>yet</b> ở cuối câu.' }
                ]
            },
            {
                id: 'w9-l7',
                order: 7,
                title: 'Have you ever...? / Never',
                topic: 'Experiences',
                desc: 'Hỏi đáp về trải nghiệm trong đời.',
                items: [
                    { kind: 'choice', prompt: 'I have ______ swum in the deep ocean.', emoji: '🌊', opts: ['never', 'ever', 'yet', 'since'], ans: 0, why: 'Chưa bao giờ = <b>never</b>.' }
                ]
            },
            {
                id: 'w9-l8',
                order: 8,
                title: 'Since vs For',
                topic: 'Time Expressions',
                desc: 'Phân biệt Since (mốc thời gian) và For (khoảng thời gian).',
                items: [
                    { kind: 'choice', prompt: 'We have lived here ______ 2020.', emoji: '📅', opts: ['since', 'for', 'in', 'at'], ans: 0, why: 'Mốc thời gian 2020 → dùng <b>since</b>.' },
                    { kind: 'choice', prompt: 'He has slept ______ five hours.', emoji: '😴', opts: ['for', 'since', 'ago', 'on'], ans: 0, why: 'Khoảng thời gian 5 tiếng → dùng <b>for</b>.' }
                ]
            },
            {
                id: 'w9-l9',
                order: 9,
                title: 'Reading: Bo\'s Adventures',
                topic: 'Reading Comprehension',
                desc: 'Đọc hiểu bài đọc trải nghiệm chuyến du lịch.',
                items: [
                    { kind: 'choice', prompt: 'How many photos has Bo taken?', emoji: '📸', opts: ['More than 100', 'Forty', 'Ten', 'Three'], ans: 0, why: 'Bo taken more than 100 photos.' }
                ]
            },
            {
                id: 'w9-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: My Experiences',
                topic: 'World 9 Boss Challenge',
                desc: 'Thử thách đỉnh cao Hiện Tại Hoàn Thành!',
                items: [
                    { kind: 'choice', prompt: 'Our team ______ the championship!', emoji: '🏆', opts: ['has won', 'have won', 'has win', 'woned'], ans: 0, why: 'Our team (số ít) → <b>has won</b>.' }
                ]
            }
        ]
    },
    {
        id: 'world-10',
        order: 10,
        title: '👑 English Master',
        subtitle: 'Tổng hợp kiến thức & Đố vui thử thách đỉnh cao',
        grade: 'Lớp 5',
        gradeMin: 5,
        icon: '👑',
        color: '#d500f9',
        levels: [
            {
                id: 'w10-l1',
                order: 1,
                title: 'Build Sentences',
                topic: 'Sentence Structure',
                desc: 'Xếp câu phức hợp đa dạng thì.',
                items: [
                    { kind: 'build', target: 'She has played piano for five years .', emoji: '🎹', vi: 'Cô ấy đã chơi đàn piano được 5 năm.', why: 'S + has + V3 + for + time.' }
                ]
            },
            {
                id: 'w10-l2',
                order: 2,
                title: 'Fix the Sentence',
                topic: 'Error Correction',
                desc: 'Tìm và sửa lỗi sai trong câu.',
                items: [
                    { kind: 'choice', prompt: 'Sửa câu sai: “He go to school yesterday.”', emoji: '🔍', opts: ['He went to school yesterday.', 'He goes to school yesterday.', 'He is go to school yesterday.', 'He gone to school yesterday.'], ans: 0, why: 'Có yesterday quá khứ → <b>went</b>.' }
                ]
            },
            {
                id: 'w10-l3',
                order: 3,
                title: 'Choose the Correct Tense',
                topic: 'All Tenses',
                desc: 'Phân biệt Hiện tại đơn, Tiếp diễn, Quá khứ, Tương lai, Hoàn thành.',
                items: [
                    { kind: 'choice', prompt: 'Look! The bird ______ in the sky right now.', emoji: '🕊️', opts: ['is flying', 'flies', 'flew', 'has flown'], ans: 0, why: 'Right now → dùng tiếp diễn: <b>is flying</b>.' }
                ]
            },
            {
                id: 'w10-l4',
                order: 4,
                title: 'Read & Match',
                topic: 'Comprehension',
                desc: 'Đọc đoạn văn ngắn và nối câu trả lời.',
                items: [
                    { kind: 'match', title: 'Nối câu hỏi và câu trả lời tương ứng', leftLabel: 'Câu hỏi', rightLabel: 'Trả lời', pairs: [['Where are you from?', 'I am from Viet Nam.'], ['What is your hobby?', 'I like playing football.'], ['Have you ever seen snow?', 'No, I have never seen it.'], ['What will you do tomorrow?', 'I will visit my grandma.']] }
                ]
            },
            {
                id: 'w10-l5',
                order: 5,
                title: 'Short Story',
                topic: 'Reading',
                desc: 'Đọc mẩu chuyện phiêu lưu ngắn.',
                items: [
                    { kind: 'choice', prompt: 'What did Tim find in the forest?', emoji: '🌲', opts: ['A magical golden key', 'A big dragon', 'A red car', 'A book'], ans: 0, why: 'Tim found a magical golden key.' }
                ]
            },
            {
                id: 'w10-l6',
                order: 6,
                title: 'Reading Questions',
                topic: 'Comprehension',
                desc: 'Trả lời các câu hỏi suy luận.',
                items: [
                    { kind: 'choice', prompt: 'Why was the princess happy?', emoji: '👑', opts: ['Because her dog came back home', 'Because it was raining', 'Because she lost her shoe', 'Because she was tired'], ans: 0, why: 'Because her dog came back home.' }
                ]
            },
            {
                id: 'w10-l7',
                order: 7,
                title: 'Picture → Sentence',
                topic: 'Visual Comprehension',
                desc: 'Nhìn tranh chọn câu mô tả chính xác nhất.',
                items: [
                    { kind: 'choice', prompt: 'Bức tranh vẽ hai bạn nhỏ đang bơi ngoài biển: 🏊‍♂️🏊‍♀️🌊', emoji: '🏖️', opts: ['They are swimming in the sea.', 'They swam in the sea yesterday.', 'They will swim tomorrow.', 'They have never swum.'], ans: 0, why: 'Tranh đang diễn ra hành động → <b>They are swimming in the sea</b>.' }
                ]
            },
            {
                id: 'w10-l8',
                order: 8,
                title: 'Picture → Story',
                topic: 'Visual Storytelling',
                desc: 'Sắp xếp diễn biến câu chuyện qua tranh.',
                items: [
                    { kind: 'build', target: 'First they cooked , then they ate .', emoji: '🍳🍲', vi: 'Đầu tiên họ nấu ăn, sau đó họ ăn.', why: 'First ... then ...' }
                ]
            },
            {
                id: 'w10-l9',
                order: 9,
                title: 'Ultimate Challenge',
                topic: 'Pre-Boss Warmup',
                desc: 'Khởi động tốc độ phản xạ trước trận đại chiến cuối!',
                items: [
                    { kind: 'choice', prompt: 'Chọn câu <b>đúng duy nhất</b>:', emoji: '🎯', opts: ['I have known my best friend for three years.', 'I have know my best friend since three years.', 'I knew my best friend for three years ago.', 'I am knowing my best friend.'], ans: 0, why: 'Present perfect + for + khoảng thời gian: <b>have known ... for three years</b>.' }
                ]
            },
            {
                id: 'w10-l10',
                order: 10,
                isBoss: true,
                title: '🏰 FINAL BOSS: English Master',
                topic: 'World 10 Final Boss',
                desc: 'Trận đại chiến cuối cùng chinh phục danh hiệu Cao Thủ Tiếng Anh!',
                items: [
                    { kind: 'choice', prompt: 'She ______ to London twice, and she will go again next year.', emoji: '✈️', opts: ['has been', 'was', 'goes', 'will go'], ans: 0, why: 'Đã từng đến và quay về → <b>has been</b>.' },
                    { kind: 'build', target: 'Congratulations ! You are an English Master now !', emoji: '🎓🏆', vi: 'Chúc mừng! Bạn đã là Cao Thủ Tiếng Anh rồi!', why: 'Congratulations! You are an English Master now!' },
                    { kind: 'fill', prompt: 'If you work hard, you ______ achieve your dreams.', cue: '(will)', emoji: '🌟', answers: ['will'], bank: ['will', 'was', 'did'], why: 'Tương lai: you <b>will</b> achieve your dreams.' }
                ]
            }
        ]
    }
];
