/* =========================================================
   ENGLISH ADVENTURE — DATA WORLDS & 120 LEVELS (Mầm Non - Lớp 5)
   Decoupled Data-Driven Educational Content Engine
   ========================================================= */

window.ENGLISH_WORLDS = [
    // =====================================================
    // WORLD 1: MẦM NON (PRE-K & KINDERGARTEN - AGE 3-5)
    // =====================================================
    {
        id: 'world-1',
        order: 1,
        title: '🎈 Pre-K & Kindergarten Starter',
        subtitle: 'Bảng chữ cái Phonics + Màu sắc + Số đếm 1-10',
        grade: 'Mầm non',
        gradeMin: 0,
        gradeMax: 0,
        icon: '🎈',
        color: '#ff4d6d',
        levels: [
            {
                id: 'w1-l1',
                order: 1,
                title: 'Alphabet Phonics (A - G)',
                topic: 'ABC Phonics',
                desc: 'Học âm và từ vựng cơ bản chữ A đến G.',
                items: [
                    { kind: 'card', w: { w: 'Apple', ipa: '/ˈæp.əl/', vi: 'quả táo', emoji: '🍎', ex: 'A is for Apple.', exVi: 'A dành cho Apple.' } },
                    { kind: 'card', w: { w: 'Ball', ipa: '/bɔːl/', vi: 'quả bóng', emoji: '⚽', ex: 'B is for Ball.', exVi: 'B dành cho Ball.' } },
                    { kind: 'card', w: { w: 'Cat', ipa: '/kæt/', vi: 'con mèo', emoji: '🐱', ex: 'C is for Cat.', exVi: 'C dành cho Cat.' } },
                    { kind: 'card', w: { w: 'Dog', ipa: '/dɒɡ/', vi: 'con chó', emoji: '🐶', ex: 'D is for Dog.', exVi: 'D dành cho Dog.' } },
                    { kind: 'choice', prompt: 'Từ nào bắt đầu bằng chữ <b>A</b>?', emoji: '🍎', opts: ['Apple', 'Ball', 'Cat', 'Dog'], ans: 0, why: '<b>Apple</b> bắt đầu bằng chữ A.' },
                    { kind: 'choice', prompt: 'Con <b>Cat 🐱</b> là con gì?', emoji: '🐱', opts: ['con mèo', 'con chó', 'con gấu', 'con chim'], ans: 0, why: '<b>Cat</b> = con mèo.' }
                ]
            },
            {
                id: 'w1-l2',
                order: 2,
                title: 'Alphabet Phonics (H - N)',
                topic: 'ABC Phonics',
                desc: 'Học âm và từ vựng chữ H đến N.',
                items: [
                    { kind: 'card', w: { w: 'Hat', ipa: '/hæt/', vi: 'cái mũ', emoji: '🧢', ex: 'H is for Hat.', exVi: 'H dành cho Hat.' } },
                    { kind: 'card', w: { w: 'Ice', ipa: '/aɪs/', vi: 'nước đá', emoji: '🧊', ex: 'I is for Ice.', exVi: 'I dành cho Ice.' } },
                    { kind: 'card', w: { w: 'Juice', ipa: '/dʒuːs/', vi: 'nước ép', emoji: '🧃', ex: 'J is for Juice.', exVi: 'J dành cho Juice.' } },
                    { kind: 'choice', prompt: '<b>Juice 🧃</b> nghĩa là gì?', emoji: '🧃', opts: ['nước ép', 'cái mũ', 'nước đá', 'con cá'], ans: 0, why: '<b>Juice</b> = nước ép trái cây.' }
                ]
            },
            {
                id: 'w1-l3',
                order: 3,
                title: 'Alphabet Phonics (O - Z)',
                topic: 'ABC Phonics',
                desc: 'Học âm và từ vựng chữ O đến Z.',
                items: [
                    { kind: 'card', w: { w: 'Sun', ipa: '/sʌn/', vi: 'mặt trời', emoji: '☀️', ex: 'S is for Sun.', exVi: 'S dành cho Sun.' } },
                    { kind: 'card', w: { w: 'Tree', ipa: '/triː/', vi: 'cây xanh', emoji: '🌳', ex: 'T is for Tree.', exVi: 'T dành cho Tree.' } },
                    { kind: 'card', w: { w: 'Zoo', ipa: '/zuː/', vi: 'sở thú', emoji: '🦁', ex: 'Z is for Zoo.', exVi: 'Z dành cho Zoo.' } },
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“mặt trời”</b>?', emoji: '☀️', opts: ['Sun', 'Tree', 'Zoo', 'Star'], ans: 0, why: '<b>Sun</b> = mặt trời.' }
                ]
            },
            {
                id: 'w1-l4',
                order: 4,
                title: 'Colors (Red, Blue, Yellow)',
                topic: 'Primary Colors',
                desc: 'Nhận biết các màu sắc cơ bản.',
                items: [
                    { kind: 'card', w: { w: 'Red', ipa: '/red/', vi: 'màu đỏ', emoji: '🔴', ex: 'Red apple.', exVi: 'Quả táo màu đỏ.' } },
                    { kind: 'card', w: { w: 'Blue', ipa: '/bluː/', vi: 'xanh dương', emoji: '🔵', ex: 'Blue sky.', exVi: 'Bầu trời xanh.' } },
                    { kind: 'card', w: { w: 'Yellow', ipa: '/ˈjel.əʊ/', vi: 'màu vàng', emoji: '🟡', ex: 'Yellow sun.', exVi: 'Mặt trời màu vàng.' } },
                    { kind: 'choice', prompt: 'Màu <b>Red 🔴</b> là màu gì?', emoji: '🔴', opts: ['màu đỏ', 'xanh dương', 'màu vàng', 'màu trắng'], ans: 0, why: '<b>Red</b> = màu đỏ.' }
                ]
            },
            {
                id: 'w1-l5',
                order: 5,
                title: 'Colors (Green, Pink, Orange)',
                topic: 'More Colors',
                desc: 'Học tiếp màu xanh lá, màu hồng, màu cam.',
                items: [
                    { kind: 'card', w: { w: 'Green', ipa: '/ɡriːn/', vi: 'xanh lá', emoji: '🟢', ex: 'Green tree.', exVi: 'Cây xanh lá.' } },
                    { kind: 'card', w: { w: 'Pink', ipa: '/pɪŋk/', vi: 'màu hồng', emoji: '🩷', ex: 'Pink flower.', exVi: 'Bông hoa màu hồng.' } },
                    { kind: 'choice', prompt: 'Màu <b>Green 🟢</b> là màu gì?', emoji: '🟢', opts: ['xanh lá', 'màu hồng', 'màu cam', 'màu đen'], ans: 0, why: '<b>Green</b> = xanh lá cây.' }
                ]
            },
            {
                id: 'w1-l6',
                order: 6,
                title: 'Numbers 1 - 5',
                topic: 'Counting',
                desc: 'Đếm các số từ 1 đến 5.',
                items: [
                    { kind: 'card', w: { w: 'One', ipa: '/wʌn/', vi: 'số 1', emoji: '1️⃣', ex: 'One cat.', exVi: 'Một con mèo.' } },
                    { kind: 'card', w: { w: 'Two', ipa: '/tuː/', vi: 'số 2', emoji: '2️⃣', ex: 'Two dogs.', exVi: 'Hai con chó.' } },
                    { kind: 'card', w: { w: 'Three', ipa: '/θriː/', vi: 'số 3', emoji: '3️⃣', ex: 'Three apples.', exVi: 'Ba quả táo.' } },
                    { kind: 'choice', prompt: 'Số <b>Three 3️⃣</b> là số mấy?', emoji: '3️⃣', opts: ['số 3', 'số 1', 'số 2', 'số 4'], ans: 0, why: '<b>Three</b> = số 3.' }
                ]
            },
            {
                id: 'w1-l7',
                order: 7,
                title: 'Numbers 6 - 10',
                topic: 'Counting',
                desc: 'Đếm các số từ 6 đến 10.',
                items: [
                    { kind: 'card', w: { w: 'Five', ipa: '/faɪv/', vi: 'số 5', emoji: '5️⃣', ex: 'Five stars.', exVi: 'Năm ngôi sao.' } },
                    { kind: 'card', w: { w: 'Ten', ipa: '/ten/', vi: 'số 10', emoji: '🔟', ex: 'Ten fingers.', exVi: 'Mười ngón tay.' } },
                    { kind: 'choice', prompt: 'Số <b>Ten 🔟</b> là số mấy?', emoji: '🔟', opts: ['số 10', 'số 5', 'số 6', 'số 8'], ans: 0, why: '<b>Ten</b> = số 10.' }
                ]
            },
            {
                id: 'w1-l8',
                order: 8,
                title: 'Pets (Cat, Dog, Bird)',
                topic: 'Pet Animals',
                desc: 'Nhận biết các con vật nuôi dễ thương.',
                items: [
                    { kind: 'card', w: { w: 'Cat', ipa: '/kæt/', vi: 'con mèo', emoji: '🐱', ex: 'Cute cat.', exVi: 'Con mèo đáng yêu.' } },
                    { kind: 'card', w: { w: 'Bird', ipa: '/bɜːd/', vi: 'con chim', emoji: '🐦', ex: 'Little bird.', exVi: 'Con chim nhỏ.' } },
                    { kind: 'choice', prompt: '<b>Bird 🐦</b> là con gì?', emoji: '🐦', opts: ['con chim', 'con mèo', 'con chó', 'con cá'], ans: 0, why: '<b>Bird</b> = con chim.' }
                ]
            },
            {
                id: 'w1-l9',
                order: 9,
                title: 'Animals (Fish, Duck, Rabbit)',
                topic: 'Animals',
                desc: 'Từ vựng con cá, con vịt, con thỏ.',
                items: [
                    { kind: 'card', w: { w: 'Fish', ipa: '/fɪʃ/', vi: 'con cá', emoji: '🐟', ex: 'Swim like a fish.', exVi: 'Bơi như con cá.' } },
                    { kind: 'card', w: { w: 'Rabbit', ipa: '/ˈræb.ɪt/', vi: 'con thỏ', emoji: '🐰', ex: 'White rabbit.', exVi: 'Con thỏ trắng.' } },
                    { kind: 'choice', prompt: '<b>Rabbit 🐰</b> là con gì?', emoji: '🐰', opts: ['con thỏ', 'con vịt', 'con cá', 'con rùa'], ans: 0, why: '<b>Rabbit</b> = con thỏ.' }
                ]
            },
            {
                id: 'w1-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: Pre-K Fun Star',
                topic: 'Pre-K Boss',
                desc: 'Thử thách vui nhộn tổng hợp cho bé Mầm non!',
                items: [
                    { kind: 'choice', prompt: '<b>Apple 🍎</b> có màu gì?', emoji: '🍎', opts: ['Red (Đỏ)', 'Blue (Xanh)', 'Yellow (Vàng)'], ans: 0, why: 'Apple có màu <b>Red</b>.' },
                    { kind: 'choice', prompt: 'Con gì biết sủa <b>Woof Woof</b>?', emoji: '🐶', opts: ['Dog (Chó)', 'Cat (Mèo)', 'Bird (Chim)'], ans: 0, why: '<b>Dog</b> sủa gâu gâu.' }
                ]
            }
        ]
    },

    // =====================================================
    // WORLD 2: MẦM NON (FUN AROUND ME - AGE 4-6)
    // =====================================================
    {
        id: 'world-2',
        order: 2,
        title: '🧸 Fun Around Me',
        subtitle: 'Gia đình + Trái cây + Đồ chơi + Cảm xúc',
        grade: 'Mầm non',
        gradeMin: 0,
        gradeMax: 0,
        icon: '🧸',
        color: '#ff9900',
        levels: [
            {
                id: 'w2-l1',
                order: 1,
                title: 'Family (Mommy, Daddy)',
                topic: 'My Family',
                desc: 'Học từ vựng Bố và Mẹ thân yêu.',
                items: [
                    { kind: 'card', w: { w: 'Mommy', ipa: '/ˈmɒm.i/', vi: 'Mẹ yêu', emoji: '👩', ex: 'I love my Mommy.', exVi: 'Tớ yêu Mẹ tớ.' } },
                    { kind: 'card', w: { w: 'Daddy', ipa: '/ˈdæd.i/', vi: 'Bố yêu', emoji: '👨', ex: 'My Daddy is strong.', exVi: 'Bố tớ rất khỏe.' } },
                    { kind: 'choice', prompt: '<b>Mommy 👩</b> nghĩa là gì?', emoji: '👩', opts: ['Mẹ yêu', 'Bố yêu', 'Bà', 'Ông'], ans: 0, why: '<b>Mommy</b> = Mẹ.' }
                ]
            },
            {
                id: 'w2-l2',
                order: 2,
                title: 'Family (Brother, Sister)',
                topic: 'My Family',
                desc: 'Học từ vựng Anh/Em trai & Chị/Em gái.',
                items: [
                    { kind: 'card', w: { w: 'Brother', ipa: '/ˈbrʌð.ər/', vi: 'anh/em trai', emoji: '👦', ex: 'My brother.', exVi: 'Anh/em trai tớ.' } },
                    { kind: 'card', w: { w: 'Sister', ipa: '/ˈsɪs.tər/', vi: 'chị/em gái', emoji: '👧', ex: 'My sister.', exVi: 'Chị/em gái tớ.' } },
                    { kind: 'choice', prompt: '<b>Sister 👧</b> nghĩa là gì?', emoji: '👧', opts: ['chị/em gái', 'anh/em trai', 'ông', 'bà'], ans: 0, why: '<b>Sister</b> = chị hoặc em gái.' }
                ]
            },
            {
                id: 'w2-l3',
                order: 3,
                title: 'Fruits (Apple, Banana)',
                topic: 'Yummy Fruits',
                desc: 'Học các loại quả thơm ngon.',
                items: [
                    { kind: 'card', w: { w: 'Banana', ipa: '/bəˈnɑː.nə/', vi: 'quả chuối', emoji: '🍌', ex: 'Yellow banana.', exVi: 'Quả chuối màu vàng.' } },
                    { kind: 'choice', prompt: 'Trái cây nào có màu vàng <b>Yellow</b>?', emoji: '🍌', opts: ['Banana (Chuối)', 'Apple (Táo đỏ)', 'Grape (Nho)'], ans: 0, why: '<b>Banana</b> màu vàng.' }
                ]
            },
            {
                id: 'w2-l4',
                order: 4,
                title: 'Fruits (Orange, Watermelon)',
                topic: 'Yummy Fruits',
                desc: 'Từ vựng quả cam và dưa hấu.',
                items: [
                    { kind: 'card', w: { w: 'Watermelon', ipa: '/ˈwɔː.təˌmel.ən/', vi: 'dưa hấu', emoji: '🍉', ex: 'Sweet watermelon.', exVi: 'Dưa hấu ngọt lịm.' } },
                    { kind: 'choice', prompt: '<b>Watermelon 🍉</b> là quả gì?', emoji: '🍉', opts: ['dưa hấu', 'quả cam', 'quả chuối', 'quả táo'], ans: 0, why: '<b>Watermelon</b> = dưa hấu.' }
                ]
            },
            {
                id: 'w2-l5',
                order: 5,
                title: 'My Body (Head, Eyes, Nose)',
                topic: 'Body Parts',
                desc: 'Nhận biết các bộ phận trên khuôn mặt.',
                items: [
                    { kind: 'card', w: { w: 'Eye', ipa: '/aɪ/', vi: 'mắt', emoji: '👁️', ex: 'Two eyes.', exVi: 'Hai mắt.' } },
                    { kind: 'card', w: { w: 'Nose', ipa: '/nəʊz/', vi: 'mũi', emoji: '👃', ex: 'One nose.', exVi: 'Một cái mũi.' } },
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“mắt”</b>?', emoji: '👁️', opts: ['Eye', 'Nose', 'Head', 'Ear'], ans: 0, why: '<b>Eye</b> = mắt.' }
                ]
            },
            {
                id: 'w2-l6',
                order: 6,
                title: 'My Body (Hand, Leg)',
                topic: 'Body Parts',
                desc: 'Từ vựng bàn tay và đôi chân.',
                items: [
                    { kind: 'card', w: { w: 'Hand', ipa: '/hænd/', vi: 'bàn tay', emoji: '✋', ex: 'Clap your hands.', exVi: 'Vỗ tay nào.' } },
                    { kind: 'choice', prompt: '<b>Hand ✋</b> nghĩa là gì?', emoji: '✋', opts: ['bàn tay', 'cái chân', 'cái đầu', 'cái tai'], ans: 0, why: '<b>Hand</b> = bàn tay.' }
                ]
            },
            {
                id: 'w2-l7',
                order: 7,
                title: 'Toys (Ball, Doll, Car)',
                topic: 'My Toys',
                desc: 'Các món đồ chơi yêu thích.',
                items: [
                    { kind: 'card', w: { w: 'Doll', ipa: '/dɒl/', vi: 'búp bê', emoji: '🪆', ex: 'Pretty doll.', exVi: 'Búp bê xinh xắn.' } },
                    { kind: 'card', w: { w: 'Car', ipa: '/kɑːr/', vi: 'ô tô đồ chơi', emoji: '🚗', ex: 'Red car.', exVi: 'Ô tô màu đỏ.' } },
                    { kind: 'choice', prompt: 'Món đồ chơi nào là <b>“búp bê”</b>?', emoji: '🪆', opts: ['Doll', 'Car', 'Ball', 'Robot'], ans: 0, why: '<b>Doll</b> = búp bê.' }
                ]
            },
            {
                id: 'w2-l8',
                order: 8,
                title: 'Toys (Teddy, Robot)',
                topic: 'My Toys',
                desc: 'Gấu bông Teddy và Robot.',
                items: [
                    { kind: 'card', w: { w: 'Teddy', ipa: '/ˈted.i/', vi: 'gấu bông', emoji: '🧸', ex: 'Soft teddy bear.', exVi: 'Gấu bông mềm mại.' } },
                    { kind: 'choice', prompt: '<b>Teddy 🧸</b> là con gì?', emoji: '🧸', opts: ['gấu bông', 'robot', 'ô tô', 'quả bóng'], ans: 0, why: '<b>Teddy</b> = gấu bông.' }
                ]
            },
            {
                id: 'w2-l9',
                order: 9,
                title: 'Feelings (Happy, Sad)',
                topic: 'Feelings',
                desc: 'Học cảm xúc vui vẻ và buồn rầu.',
                items: [
                    { kind: 'card', w: { w: 'Happy', ipa: '/ˈhæp.i/', vi: 'vui vẻ', emoji: '😊', ex: 'I am happy.', exVi: 'Tớ rất vui.' } },
                    { kind: 'card', w: { w: 'Sad', ipa: '/sæd/', vi: 'buồn rầu', emoji: '😢', ex: 'Don\'t be sad.', exVi: 'Đừng buồn nhé.' } },
                    { kind: 'choice', prompt: 'Emoji 😊 thể hiện cảm xúc gì?', emoji: '😊', opts: ['Happy (Vui)', 'Sad (Buồn)', 'Angry (Tức giận)'], ans: 0, why: '😊 = <b>Happy</b> (vui vẻ).' }
                ]
            },
            {
                id: 'w2-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: Kids World Master',
                topic: 'Kids Boss',
                desc: 'Trận đấu trùm cuối cho thế giới của bé!',
                items: [
                    { kind: 'choice', prompt: 'Khi bé vui, bé cảm thấy thế nào?', emoji: '😊', opts: ['Happy', 'Sad', 'Cold'], ans: 0, why: 'Vui = <b>Happy</b>.' },
                    { kind: 'choice', prompt: '<b>Mommy 👩 + Daddy 👨</b> là ai?', emoji: '👨‍👩‍👧', opts: ['Family (Gia đình)', 'Toys (Đồ chơi)', 'Fruits (Hoa quả)'], ans: 0, why: 'Bố mẹ là <b>Family</b>.' }
                ]
            }
        ]
    },

    // =====================================================
    // WORLD 3: LỚP 1 (SCHOOL & HOME - AGE 6-7)
    // =====================================================
    {
        id: 'world-3',
        order: 3,
        title: '🌱 School & Home',
        subtitle: 'Dụng cụ học tập + Quần áo + Mẫu câu This is a...',
        grade: 'Lớp 1',
        gradeMin: 1,
        gradeMax: 1,
        icon: '🌱',
        color: '#00f0ff',
        levels: [
            {
                id: 'w3-l1',
                order: 1,
                title: 'School Supplies',
                topic: 'Classroom',
                desc: 'Bút mực, sách, cặp sách.',
                items: [
                    { kind: 'card', w: { w: 'Book', ipa: '/bʊk/', vi: 'quyển sách', emoji: '📖', ex: 'English book.', exVi: 'Sách tiếng Anh.' } },
                    { kind: 'card', w: { w: 'Pen', ipa: '/pen/', vi: 'cây bút', emoji: '🖊️', ex: 'Red pen.', exVi: 'Bút đỏ.' } },
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“cây bút”</b>?', emoji: '🖊️', opts: ['Pen', 'Book', 'Bag', 'Ruler'], ans: 0, why: '<b>Pen</b> = cây bút.' }
                ]
            },
            {
                id: 'w3-l2',
                order: 2,
                title: 'Classroom Objects',
                topic: 'Classroom',
                desc: 'Bàn học, ghế, bảng.',
                items: [
                    { kind: 'card', w: { w: 'Desk', ipa: '/desk/', vi: 'bàn học', emoji: '🪑', ex: 'On the desk.', exVi: 'Trên bàn học.' } },
                    { kind: 'choice', prompt: '<b>Desk 🪑</b> nghĩa là gì?', emoji: '🪑', opts: ['bàn học', 'ghế', 'bảng', 'cặp'], ans: 0, why: '<b>Desk</b> = bàn học.' }
                ]
            },
            {
                id: 'w3-l3',
                order: 3,
                title: 'Clothes (Shirt, Pants)',
                topic: 'My Clothes',
                desc: 'Áo sơ mi và quần dài.',
                items: [
                    { kind: 'card', w: { w: 'Shirt', ipa: '/ʃɜːt/', vi: 'áo sơ mi', emoji: '👔', ex: 'White shirt.', exVi: 'Áo sơ mi trắng.' } },
                    { kind: 'choice', prompt: '<b>Shirt 👔</b> là gì?', emoji: '👔', opts: ['áo sơ mi', 'quần dài', 'cái mũ', 'đôi giày'], ans: 0, why: '<b>Shirt</b> = áo sơ mi.' }
                ]
            },
            {
                id: 'w3-l4',
                order: 4,
                title: 'Clothes (Hat, Shoes)',
                topic: 'My Clothes',
                desc: 'Mũ đội và đôi giày.',
                items: [
                    { kind: 'card', w: { w: 'Hat', ipa: '/hæt/', vi: 'cái mũ', emoji: '🧢', ex: 'Blue hat.', exVi: 'Mũ màu xanh.' } },
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“cái mũ”</b>?', emoji: '🧢', opts: ['Hat', 'Shoes', 'Shirt', 'Socks'], ans: 0, why: '<b>Hat</b> = cái mũ.' }
                ]
            },
            {
                id: 'w3-l5',
                order: 5,
                title: 'Food (Bread, Milk)',
                topic: 'Yummy Food',
                desc: 'Bánh mì và sữa tươi.',
                items: [
                    { kind: 'card', w: { w: 'Milk', ipa: '/mɪlk/', vi: 'sữa tươi', emoji: '🥛', ex: 'Drink milk.', exVi: 'Uống sữa.' } },
                    { kind: 'choice', prompt: '<b>Milk 🥛</b> nghĩa là gì?', emoji: '🥛', opts: ['sữa tươi', 'bánh mì', 'cơm', 'nước lọc'], ans: 0, why: '<b>Milk</b> = sữa.' }
                ]
            },
            {
                id: 'w3-l6',
                order: 6,
                title: 'This is a...',
                topic: 'Simple Sentence',
                desc: 'Nói Đây là một...',
                items: [
                    { kind: 'build', target: 'This is a book .', emoji: '📖', vi: 'Đây là một quyển sách.', why: 'This is a + noun.' }
                ]
            },
            {
                id: 'w3-l7',
                order: 7,
                title: 'It is red',
                topic: 'Simple Sentence',
                desc: 'Nói Nó có màu...',
                items: [
                    { kind: 'choice', prompt: 'Điền từ: “It ______ a red hat.”', emoji: '🧢', opts: ['is', 'are', 'am'], ans: 0, why: 'It đi với <b>is</b>.' }
                ]
            },
            {
                id: 'w3-l8',
                order: 8,
                title: 'My Room (Bed, Chair)',
                topic: 'My Room',
                desc: 'Cái giường và cái ghế.',
                items: [
                    { kind: 'card', w: { w: 'Bed', ipa: '/bed/', vi: 'cái giường', emoji: '🛏️', ex: 'Sleep on the bed.', exVi: 'Ngủ trên giường.' } },
                    { kind: 'choice', prompt: '<b>Bed 🛏️</b> là gì?', emoji: '🛏️', opts: ['cái giường', 'cái ghế', 'cái bàn', 'cái cửa'], ans: 0, why: '<b>Bed</b> = cái giường.' }
                ]
            },
            {
                id: 'w3-l9',
                order: 9,
                title: 'Short Sentences',
                topic: 'Sentence Builder',
                desc: 'Ghép câu ngắn hoàn chỉnh.',
                items: [
                    { kind: 'build', target: 'This is my pen .', emoji: '🖊️', vi: 'Đây là bút của tớ.', why: 'This + is + my + pen.' }
                ]
            },
            {
                id: 'w3-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: School Star',
                topic: 'Grade 1 Boss',
                desc: 'Trận đấu trùm trường học & ngôi nhà!',
                items: [
                    { kind: 'build', target: 'This is a yellow pencil .', emoji: '✏️', vi: 'Đây là cây bút chì màu vàng.', why: 'This is a + color + noun.' }
                ]
            }
        ]
    },

    // =====================================================
    // WORLD 4: LỚP 1 (ANIMALS & ACTIONS - AGE 6-7)
    // =====================================================
    {
        id: 'world-4',
        order: 4,
        title: '🐶 Animals & Actions',
        subtitle: 'Động vật hoang dã + Động từ hành động + I can...',
        grade: 'Lớp 1',
        gradeMin: 1,
        gradeMax: 1,
        icon: '🐶',
        color: '#ff8c42',
        levels: [
            {
                id: 'w4-l1',
                order: 1,
                title: 'Wild Animals (Lion, Elephant)',
                topic: 'Wild Animals',
                desc: 'Sư tử và con voi.',
                items: [
                    { kind: 'card', w: { w: 'Lion', ipa: '/ˈlaɪ.ən/', vi: 'sư tử', emoji: '🦁', ex: 'King lion.', exVi: 'Vua sư tử.' } },
                    { kind: 'choice', prompt: '<b>Lion 🦁</b> là con gì?', emoji: '🦁', opts: ['sư tử', 'con voi', 'con hổ', 'con khỉ'], ans: 0, why: '<b>Lion</b> = sư tử.' }
                ]
            },
            {
                id: 'w4-l2',
                order: 2,
                title: 'Wild Animals (Monkey, Tiger)',
                topic: 'Wild Animals',
                desc: 'Con khỉ và con hổ.',
                items: [
                    { kind: 'card', w: { w: 'Monkey', ipa: '/ˈmʌŋ.ki/', vi: 'con khỉ', emoji: '🐒', ex: 'Funny monkey.', exVi: 'Con khỉ tinh nghịch.' } },
                    { kind: 'choice', prompt: '<b>Monkey 🐒</b> là con gì?', emoji: '🐒', opts: ['con khỉ', 'con hổ', 'con gấu', 'con hươu'], ans: 0, why: '<b>Monkey</b> = con khỉ.' }
                ]
            },
            {
                id: 'w4-l3',
                order: 3,
                title: 'Action Verbs (Run, Jump)',
                topic: 'Actions',
                desc: 'Hành động chạy và nhảy.',
                items: [
                    { kind: 'card', w: { w: 'Run', ipa: '/rʌn/', vi: 'chạy', emoji: '🏃', ex: 'Run fast.', exVi: 'Chạy nhanh.' } },
                    { kind: 'choice', prompt: 'Từ nào nghĩa là <b>“chạy”</b>?', emoji: '🏃', opts: ['Run', 'Jump', 'Swim', 'Fly'], ans: 0, why: '<b>Run</b> = chạy.' }
                ]
            },
            {
                id: 'w4-l4',
                order: 4,
                title: 'Action Verbs (Fly, Swim)',
                topic: 'Actions',
                desc: 'Hành động bay và bơi.',
                items: [
                    { kind: 'card', w: { w: 'Swim', ipa: '/swɪm/', vi: 'bơi', emoji: '🏊', ex: 'Swim in water.', exVi: 'Bơi dưới nước.' } },
                    { kind: 'choice', prompt: '<b>Swim 🏊</b> nghĩa là gì?', emoji: '🏊', opts: ['bơi', 'bay', 'nhảy', 'chạy'], ans: 0, why: '<b>Swim</b> = bơi.' }
                ]
            },
            {
                id: 'w4-l5',
                order: 5,
                title: 'I can [verb]',
                topic: 'Can ability',
                desc: 'Nói Tớ có thể...',
                items: [
                    { kind: 'build', target: 'I can swim .', emoji: '🏊', vi: 'Tớ có thể bơi.', why: 'I + can + V1.' }
                ]
            },
            {
                id: 'w4-l6',
                order: 6,
                title: 'I cannot [verb]',
                topic: 'Cannot',
                desc: 'Nói Tớ không thể...',
                items: [
                    { kind: 'choice', prompt: 'A bird can ______. (Con chim có thể làm gì?)', emoji: '🐦', opts: ['fly', 'swim', 'drive', 'read'], ans: 0, why: 'Bird can <b>fly</b> (bay).' }
                ]
            },
            {
                id: 'w4-l7',
                order: 7,
                title: 'I like [animal]',
                topic: 'Express Likes',
                desc: 'Nói Tớ thích...',
                items: [
                    { kind: 'build', target: 'I like cats .', emoji: '🐱', vi: 'Tớ thích mèo.', why: 'I + like + plural noun.' }
                ]
            },
            {
                id: 'w4-l8',
                order: 8,
                title: "I don't like...",
                topic: 'Dislikes',
                desc: 'Nói Tớ không thích...',
                items: [
                    { kind: 'choice', prompt: 'Điền từ: “I ______ like snakes.”', emoji: '🐍', opts: ["don't", "doesn't", "not"], ans: 0, why: 'I + <b>don\'t</b> + like.' }
                ]
            },
            {
                id: 'w4-l9',
                order: 9,
                title: 'Animal Actions Match',
                topic: 'Sorting',
                desc: 'Ghép động vật với khả năng của chúng.',
                items: [
                    { kind: 'match', title: 'Nối con vật với hành động tương ứng', leftLabel: 'Con vật', rightLabel: 'Hành động', pairs: [['Bird', 'can fly'], ['Fish', 'can swim'], ['Rabbit', 'can jump'], ['Cheetah', 'can run']] }
                ]
            },
            {
                id: 'w4-l10',
                order: 10,
                isBoss: true,
                title: '👑 Boss: Jungle Hero',
                topic: 'Jungle Boss',
                desc: 'Trận đấu trùm cuối thế giới động vật!',
                items: [
                    { kind: 'build', target: 'The lion can run fast .', emoji: '🦁', vi: 'Con sư tử có thể chạy rất nhanh.', why: 'The lion + can + run + fast.' }
                ]
            }
        ]
    },

    // =====================================================
    // WORLDS 5 TO 12 (GRADES 2 TO 5 - PREVIOUSLY BUILT)
    // =====================================================
    {
        id: 'world-5',
        order: 5,
        title: '🌱 English Starter',
        subtitle: 'Pronouns + To Be + Kiến thức nền tảng',
        grade: 'Lớp 2',
        gradeMin: 2,
        gradeMax: 2,
        icon: '🌱',
        color: '#3ddc84',
        levels: [
            {
                id: 'w5-l1',
                order: 1,
                title: 'I / You / He / She / It',
                topic: 'Personal Pronouns',
                desc: 'Học đại từ nhân xưng chỉ người và vật.',
                items: [
                    { kind: 'choice', prompt: 'Chọn từ nghĩa là <b>“Tớ / Tôi”</b>:', emoji: '🙋‍♂️', opts: ['I', 'You', 'He', 'She'], ans: 0, why: '<b>I</b> = Tôi, tớ.' },
                    { kind: 'choice', prompt: 'Chọn đại từ cho <b>bạn nam</b>:', emoji: '👦', opts: ['He', 'She', 'It', 'They'], ans: 0, why: '<b>He</b> dùng cho nam số ít.' }
                ]
            },
            {
                id: 'w5-l2', order: 2, title: 'I am', topic: 'To Be', desc: 'To Be với ngôi I.', items: [{ kind: 'choice', prompt: 'I ______ a student.', opts: ['am', 'is', 'are'], ans: 0, why: 'I đi với am.' }]
            },
            {
                id: 'w5-l3', order: 3, title: 'He / She is', topic: 'To Be', desc: 'To Be với He/She.', items: [{ kind: 'choice', prompt: 'She ______ my teacher.', opts: ['is', 'am', 'are'], ans: 0, why: 'She đi với is.' }]
            },
            {
                id: 'w5-l4', order: 4, title: 'You / We / They are', topic: 'To Be', desc: 'To Be số nhiều.', items: [{ kind: 'choice', prompt: 'We ______ best friends.', opts: ['are', 'is', 'am'], ans: 0, why: 'We đi với are.' }]
            },
            {
                id: 'w5-l5', order: 5, title: 'am / is / are', topic: 'Summary', desc: 'Tổng hợp To Be.', items: [{ kind: 'choice', prompt: 'The cat ______ sleeping.', opts: ['is', 'are', 'am'], ans: 0, why: 'Cat số ít dùng is.' }]
            },
            {
                id: 'w5-l6', order: 6, title: 'To Be Negative', topic: 'Negative', desc: 'Phủ định To Be.', items: [{ kind: 'choice', prompt: 'He ______ sad.', opts: ["isn't", "aren't", "am not"], ans: 0, why: 'He isn\'t.' }]
            },
            {
                id: 'w5-l7', order: 7, title: 'Is he...?', topic: 'Questions', desc: 'Hỏi với To Be.', items: [{ kind: 'choice', prompt: '______ she your sister?', opts: ['Is', 'Are', 'Am'], ans: 0, why: 'Is she.' }]
            },
            {
                id: 'w5-l8', order: 8, title: 'Numbers & Ages', topic: 'Numbers', desc: 'Đếm số & hỏi tuổi.', items: [{ kind: 'choice', prompt: 'How old are you?', opts: ['I am 7 years old', 'I am fine'], ans: 0, why: 'Hỏi tuổi.' }]
            },
            {
                id: 'w5-l9', order: 9, title: 'Colors & Objects', topic: 'Colors', desc: 'Màu sắc.', items: [{ kind: 'choice', prompt: 'The sky is ______.', opts: ['blue', 'red', 'yellow'], ans: 0, why: 'Sky is blue.' }]
            },
            {
                id: 'w5-l10', order: 10, isBoss: true, title: '👑 Boss: To Be Master', topic: 'Boss', desc: 'Trùm To Be.', items: [{ kind: 'build', target: 'I am a good student .', emoji: '🎓', vi: 'Tớ là một học sinh giỏi.', why: 'I am...' }]
            }
        ]
    },
    {
        id: 'world-6',
        order: 6,
        title: '🎒 Everyday World',
        subtitle: 'Have/Has + Trường học & Gia đình',
        grade: 'Lớp 2',
        gradeMin: 2,
        gradeMax: 2,
        icon: '🎒',
        color: '#ff9900',
        levels: [
            { id: 'w6-l1', order: 1, title: 'School Objects', topic: 'School', desc: 'Dụng cụ học tập.', items: [{ kind: 'choice', prompt: 'Book nghĩa là gì?', opts: ['sách', 'bút'], ans: 0, why: 'Book = sách.' }] },
            { id: 'w6-l2', order: 2, title: 'Family', topic: 'Family', desc: 'Gia đình.', items: [{ kind: 'choice', prompt: 'Mother nghĩa là gì?', opts: ['mẹ', 'bố'], ans: 0, why: 'Mother = mẹ.' }] },
            { id: 'w6-l3', order: 3, title: 'I have', topic: 'Have', desc: 'Sở hữu với I.', items: [{ kind: 'choice', prompt: 'I ______ a bag.', opts: ['have', 'has'], ans: 0, why: 'I have.' }] },
            { id: 'w6-l4', order: 4, title: 'He has', topic: 'Has', desc: 'Sở hữu với He.', items: [{ kind: 'choice', prompt: 'He ______ a dog.', opts: ['has', 'have'], ans: 0, why: 'He has.' }] },
            { id: 'w6-l5', order: 5, title: 'Have vs Has', topic: 'Sort', desc: 'Phân biệt have/has.', items: [{ kind: 'choice', prompt: 'She ______ a cat.', opts: ['has', 'have'], ans: 0, why: 'She has.' }] },
            { id: 'w6-l6', order: 6, title: 'This / That', topic: 'This/That', desc: 'Đây/Kia.', items: [{ kind: 'choice', prompt: '______ is a car.', opts: ['This', 'These'], ans: 0, why: 'This is.' }] },
            { id: 'w6-l7', order: 7, title: 'These / Those', topic: 'These/Those', desc: 'Những cái này/kìa.', items: [{ kind: 'choice', prompt: '______ are toys.', opts: ['These', 'This'], ans: 0, why: 'These are.' }] },
            { id: 'w6-l8', order: 8, title: 'My / Your', topic: 'Possessive', desc: 'Của tớ / Của bạn.', items: [{ kind: 'choice', prompt: 'This is ______ bag.', opts: ['my', 'I'], ans: 0, why: 'My bag.' }] },
            { id: 'w6-l9', order: 9, title: 'Build Sentence', topic: 'Build', desc: 'Ghép câu.', items: [{ kind: 'build', target: 'This is my bag .', emoji: '🎒', vi: 'Đây là cặp của tớ.', why: 'This is my bag.' }] },
            { id: 'w6-l10', order: 10, isBoss: true, title: '👑 Boss: My World', topic: 'Boss', desc: 'Trùm thế giới của tớ.', items: [{ kind: 'build', target: 'She has a new bag .', emoji: '🎒', vi: 'Cô ấy có cặp mới.', why: 'She has...' }] }
        ]
    },
    {
        id: 'world-7',
        order: 7,
        title: '🏠 Where Is It?',
        subtitle: 'Giới từ + There is / There are',
        grade: 'Lớp 3',
        gradeMin: 3,
        gradeMax: 3,
        icon: '🏠',
        color: '#00f0ff',
        levels: [
            { id: 'w7-l1', order: 1, title: 'In / On', topic: 'Prepositions', desc: 'Ở trong / Ở trên.', items: [{ kind: 'choice', prompt: 'In nghĩa là gì?', opts: ['ở trong', 'ở trên'], ans: 0, why: 'In = trong.' }] },
            { id: 'w7-l2', order: 2, title: 'Under', topic: 'Under', desc: 'Ở dưới.', items: [{ kind: 'choice', prompt: 'Under nghĩa là gì?', opts: ['ở dưới', 'ở trên'], ans: 0, why: 'Under = dưới.' }] },
            { id: 'w7-l3', order: 3, title: 'Behind', topic: 'Behind', desc: 'Phía sau.', items: [{ kind: 'choice', prompt: 'Behind nghĩa là gì?', opts: ['phía sau', 'phía trước'], ans: 0, why: 'Behind = sau.' }] },
            { id: 'w7-l4', order: 4, title: 'Next to', topic: 'Next to', desc: 'Bên cạnh.', items: [{ kind: 'choice', prompt: 'Next to nghĩa là gì?', opts: ['bên cạnh', 'ở giữa'], ans: 0, why: 'Next to = cạnh.' }] },
            { id: 'w7-l5', order: 5, title: 'Where is...?', topic: 'Questions', desc: 'Hỏi vị trí.', items: [{ kind: 'choice', prompt: '______ is my pen?', opts: ['Where', 'What'], ans: 0, why: 'Where is.' }] },
            { id: 'w7-l6', order: 6, title: 'There is', topic: 'There is', desc: 'Có 1 vật.', items: [{ kind: 'choice', prompt: '______ a book.', opts: ['There is', 'There are'], ans: 0, why: 'There is a.' }] },
            { id: 'w7-l7', order: 7, title: 'There are', topic: 'There are', desc: 'Có nhiều vật.', items: [{ kind: 'choice', prompt: '______ two books.', opts: ['There are', 'There is'], ans: 0, why: 'There are two.' }] },
            { id: 'w7-l8', order: 8, title: 'Sort Is/Are', topic: 'Sort', desc: 'Phân loại Is/Are.', items: [{ kind: 'choice', prompt: 'There ______ a cat.', opts: ['is', 'are'], ans: 0, why: 'There is.' }] },
            { id: 'w7-l9', order: 9, title: 'Describe Room', topic: 'Build', desc: 'Mô tả phòng.', items: [{ kind: 'build', target: 'There is a cat on the bed .', emoji: '🐱', vi: 'Có một con mèo trên giường.', why: 'There is...' }] },
            { id: 'w7-l10', order: 10, isBoss: true, title: '👑 Boss: Find Items', topic: 'Boss', desc: 'Trùm vị trí.', items: [{ kind: 'build', target: 'There are three books under the desk .', emoji: '📚', vi: 'Có 3 quyển sách dưới bàn.', why: 'There are...' }] }
        ]
    },
    {
        id: 'world-8',
        order: 8,
        title: '☀️ Daily Routines',
        subtitle: 'Thì Hiện Tại Đơn (Present Simple)',
        grade: 'Lớp 3',
        gradeMin: 3,
        gradeMax: 3,
        icon: '☀️',
        color: '#ff8c42',
        levels: [
            { id: 'w8-l1', order: 1, title: 'Daily Actions', topic: 'Routine', desc: 'Hoạt động hằng ngày.', items: [{ kind: 'choice', prompt: 'Get up nghĩa là gì?', opts: ['thức dậy', 'đi ngủ'], ans: 0, why: 'Get up = thức dậy.' }] },
            { id: 'w8-l2', order: 2, title: 'I play', topic: 'V1', desc: 'Động từ giữ nguyên.', items: [{ kind: 'choice', prompt: 'I ______ to school.', opts: ['go', 'goes'], ans: 0, why: 'I go.' }] },
            { id: 'w8-l3', order: 3, title: 'He plays', topic: 'V-s', desc: 'Động từ thêm -s.', items: [{ kind: 'choice', prompt: 'He ______ football.', opts: ['plays', 'play'], ans: 0, why: 'He plays.' }] },
            { id: 'w8-l4', order: 4, title: 'She watches', topic: 'V-es', desc: 'Động từ thêm -es.', items: [{ kind: 'choice', prompt: 'She ______ TV.', opts: ['watches', 'watch'], ans: 0, why: 'She watches.' }] },
            { id: 'w8-l5', order: 5, title: 'Spelling Rules', topic: 'Rules', desc: 'Quy tắc s/es.', items: [{ kind: 'choice', prompt: 'Tom ______ (brush) teeth.', opts: ['brushes', 'brush'], ans: 0, why: 'Brushes.' }] },
            { id: 'w8-l6', order: 6, title: "Doesn't", topic: 'Negative', desc: 'Phủ định doesn\'t.', items: [{ kind: 'choice', prompt: 'She ______ like milk.', opts: ["doesn't", "don't"], ans: 0, why: 'She doesn\'t.' }] },
            { id: 'w8-l7', order: 7, title: 'Do you...?', topic: 'Questions', desc: 'Hỏi với Do.', items: [{ kind: 'choice', prompt: '______ you like apples?', opts: ['Do', 'Does'], ans: 0, why: 'Do you.' }] },
            { id: 'w8-l8', order: 8, title: 'Does he...?', topic: 'Questions', desc: 'Hỏi với Does.', items: [{ kind: 'choice', prompt: '______ he play games?', opts: ['Does', 'Do'], ans: 0, why: 'Does he.' }] },
            { id: 'w8-l9', order: 9, title: 'Always/Never', topic: 'Frequency', desc: 'Trạng từ tần suất.', items: [{ kind: 'choice', prompt: 'Always nghĩa là gì?', opts: ['luôn luôn', 'không bao giờ'], ans: 0, why: 'Always = luôn luôn.' }] },
            { id: 'w8-l10', order: 10, isBoss: true, title: '👑 Boss: Routine Star', topic: 'Boss', desc: 'Trùm thói quen.', items: [{ kind: 'build', target: 'He goes to school every day .', emoji: '🏫', vi: 'Cậu ấy đi học mỗi ngày.', why: 'He goes...' }] }
        ]
    },
    {
        id: 'world-9',
        order: 9,
        title: '🏃 Doing Things Now',
        subtitle: 'Thì Hiện Tại Tiếp Diễn (Present Continuous)',
        grade: 'Lớp 3',
        gradeMin: 3,
        gradeMax: 3,
        icon: '🏃',
        color: '#ff007f',
        levels: [
            { id: 'w9-l1', order: 1, title: 'V-ing', topic: 'V-ing', desc: 'Động từ đuôi -ing.', items: [{ kind: 'choice', prompt: 'Dạng -ing của run là gì?', opts: ['running', 'runing'], ans: 0, why: 'Running.' }] },
            { id: 'w9-l2', order: 2, title: 'I am reading', topic: 'Continuous', desc: 'Tớ đang đọc.', items: [{ kind: 'build', target: 'I am reading now .', emoji: '📖', vi: 'Tớ đang đọc sách.', why: 'I am reading.' }] },
            { id: 'w9-l3', order: 3, title: 'She is singing', topic: 'Continuous', desc: 'Cô ấy đang hát.', items: [{ kind: 'choice', prompt: 'She ______ now.', opts: ['is singing', 'sings'], ans: 0, why: 'Is singing.' }] },
            { id: 'w9-l4', order: 4, title: 'They are playing', topic: 'Continuous', desc: 'Họ đang chơi.', items: [{ kind: 'choice', prompt: 'They ______ football.', opts: ['are playing', 'is playing'], ans: 0, why: 'Are playing.' }] },
            { id: 'w9-l5', order: 5, title: 'Negative Continuous', topic: 'Negative', desc: 'Isn\'t / Aren\'t V-ing.', items: [{ kind: 'choice', prompt: 'He ______ sleeping.', opts: ["isn't", "aren't"], ans: 0, why: 'Isn\'t.' }] },
            { id: 'w9-l6', order: 6, title: 'What are you doing?', topic: 'Questions', desc: 'Bạn đang làm gì?', items: [{ kind: 'choice', prompt: 'What ______ you doing?', opts: ['are', 'is'], ans: 0, why: 'What are you doing.' }] },
            { id: 'w9-l7', order: 7, title: 'Simple vs Continuous', topic: 'Compare', desc: 'Hiện tại đơn vs Tiếp diễn.', items: [{ kind: 'choice', prompt: 'Now he ______ a book.', opts: ['is reading', 'reads'], ans: 0, why: 'Is reading.' }] },
            { id: 'w9-l8', order: 8, title: 'Build Continuous', topic: 'Build', desc: 'Ghép câu tiếp diễn.', items: [{ kind: 'build', target: 'She is cooking in the kitchen .', emoji: '🍳', vi: 'Cô ấy đang nấu ăn trong bếp.', why: 'She is cooking...' }] },
            { id: 'w9-l9', order: 9, title: 'Listen & Pick', topic: 'Listen', desc: 'Nghe & chọn.', items: [{ kind: 'choice', prompt: 'Nghe câu: They are swimming.', opts: ['They are swimming', 'They swim'], ans: 0, why: 'Are swimming.' }] },
            { id: 'w9-l10', order: 10, isBoss: true, title: '👑 Boss: Action Master', topic: 'Boss', desc: 'Trùm hành động.', items: [{ kind: 'build', target: 'Look ! The dog is running .', emoji: '🐕', vi: 'Nhìn kìa! Con chó đang chạy.', why: 'Is running.' }] }
        ]
    },
    {
        id: 'world-10',
        order: 10,
        title: '🦖 Past Stories',
        subtitle: 'Thì Quá Khứ Đơn (Past Simple)',
        grade: 'Lớp 4',
        gradeMin: 4,
        gradeMax: 4,
        icon: '🦖',
        color: '#9d4edd',
        levels: [
            { id: 'w10-l1', order: 1, title: 'Yesterday', topic: 'Signals', desc: 'Mốc quá khứ.', items: [{ kind: 'choice', prompt: 'Yesterday nghĩa là gì?', opts: ['hôm qua', 'ngày mai'], ans: 0, why: 'Yesterday = hôm qua.' }] },
            { id: 'w10-l2', order: 2, title: 'Was / Were', topic: 'To Be Past', desc: 'Was / Were.', items: [{ kind: 'choice', prompt: 'I ______ at home yesterday.', opts: ['was', 'were'], ans: 0, why: 'I was.' }] },
            { id: 'w10-l3', order: 3, title: 'Played / Watched', topic: 'V-ed', desc: 'Động từ có quy tắc.', items: [{ kind: 'choice', prompt: 'We ______ football yesterday.', opts: ['played', 'play'], ans: 0, why: 'Played.' }] },
            { id: 'w10-l4', order: 4, title: 'Go → Went', topic: 'Irregular', desc: 'Go sang went.', items: [{ kind: 'choice', prompt: 'Quá khứ của go là gì?', opts: ['went', 'gone'], ans: 0, why: 'Go → went.' }] },
            { id: 'w10-l5', order: 5, title: 'Eat → Ate', topic: 'Irregular', desc: 'Eat sang ate.', items: [{ kind: 'choice', prompt: 'Quá khứ của eat là gì?', opts: ['ate', 'eaten'], ans: 0, why: 'Eat → ate.' }] },
            { id: 'w10-l6', order: 6, title: "Didn't", topic: 'Negative', desc: 'Phủ định quá khứ.', items: [{ kind: 'choice', prompt: 'I ______ go to school yesterday.', opts: ["didn't", "don't"], ans: 0, why: 'Didn\'t.' }] },
            { id: 'w10-l7', order: 7, title: 'Did you...?', topic: 'Questions', desc: 'Hỏi quá khứ.', items: [{ kind: 'choice', prompt: '______ you see him yesterday?', opts: ['Did', 'Do'], ans: 0, why: 'Did you.' }] },
            { id: 'w10-l8', order: 8, title: 'Build Past', topic: 'Build', desc: 'Ghép câu quá khứ.', items: [{ kind: 'build', target: 'We went to the beach yesterday .', emoji: '🏖️', vi: 'Chúng tớ đã đi biển hôm qua.', why: 'We went...' }] },
            { id: 'w10-l9', order: 9, title: 'Irregular Matching', topic: 'Match', desc: 'Nối động từ quá khứ.', items: [{ kind: 'match', title: 'Nối V1 với V2', leftLabel: 'V1', rightLabel: 'V2', pairs: [['go', 'went'], ['see', 'saw'], ['buy', 'bought']] }] },
            { id: 'w10-l10', order: 10, isBoss: true, title: '👑 Boss: Dino Past Master', topic: 'Boss', desc: 'Trùm quá khứ.', items: [{ kind: 'build', target: 'He bought a new car yesterday .', emoji: '🚗', vi: 'Cậu ấy đã mua ô tô hôm qua.', why: 'He bought...' }] }
        ]
    },
    {
        id: 'world-11',
        order: 11,
        title: '🚀 Tomorrow & Compare',
        subtitle: 'Thì Tương Lai (Will) & So Sánh (-er/-est)',
        grade: 'Lớp 4',
        gradeMin: 4,
        gradeMax: 4,
        icon: '🚀',
        color: '#3ddc84',
        levels: [
            { id: 'w11-l1', order: 1, title: 'Will', topic: 'Future', desc: 'Tương lai với Will.', items: [{ kind: 'choice', prompt: 'I ______ help you tomorrow.', opts: ['will', 'was'], ans: 0, why: 'Will help.' }] },
            { id: 'w11-l2', order: 2, title: "Won't", topic: 'Negative', desc: 'Phủ định Won\'t.', items: [{ kind: 'choice', prompt: 'It ______ rain tomorrow.', opts: ["won't", "didn't"], ans: 0, why: 'Won\'t rain.' }] },
            { id: 'w11-l3', order: 3, title: 'Be going to', topic: 'Plan', desc: 'Dự định tương lai.', items: [{ kind: 'choice', prompt: 'I am going to ______ football.', opts: ['play', 'played'], ans: 0, why: 'Be going to + V1.' }] },
            { id: 'w11-l4', order: 4, title: 'Faster / Taller', topic: 'Comparative', desc: 'So sánh hơn -er.', items: [{ kind: 'choice', prompt: 'He is ______ than me.', opts: ['taller', 'tallest'], ans: 0, why: 'Taller than.' }] },
            { id: 'w11-l5', order: 5, title: 'More beautiful', topic: 'Long Adj', desc: 'So sánh hơn tính từ dài.', items: [{ kind: 'choice', prompt: 'This flower is ______ beautiful.', opts: ['more', 'er'], ans: 0, why: 'More beautiful.' }] },
            { id: 'w11-l6', order: 6, title: 'Fastest / Tallest', topic: 'Superlative', desc: 'So sánh nhất -est.', items: [{ kind: 'choice', prompt: 'He is the ______ boy in class.', opts: ['tallest', 'taller'], ans: 0, why: 'The tallest.' }] },
            { id: 'w11-l7', order: 7, title: 'Most expensive', topic: 'Long Adj Superlative', desc: 'So sánh nhất tính từ dài.', items: [{ kind: 'choice', prompt: 'This is the ______ expensive car.', opts: ['most', 'more'], ans: 0, why: 'The most expensive.' }] },
            { id: 'w11-l8', order: 8, title: 'Build Future', topic: 'Build', desc: 'Ghép câu tương lai.', items: [{ kind: 'build', target: 'I will fly to Ha Noi tomorrow .', emoji: '✈️', vi: 'Tớ sẽ bay đến Hà Nội ngày mai.', why: 'I will fly...' }] },
            { id: 'w11-l9', order: 9, title: 'Build Compare', topic: 'Build', desc: 'Ghép câu so sánh.', items: [{ kind: 'build', target: 'A cheetah is faster than a dog .', emoji: '🐆', vi: 'Báo gấm chạy nhanh hơn chó.', why: 'Faster than.' }] },
            { id: 'w11-l10', order: 10, isBoss: true, title: '👑 Boss: Future & Compare', topic: 'Boss', desc: 'Trùm tương lai & so sánh.', items: [{ kind: 'build', target: 'Mount Everest is the highest mountain .', emoji: '🏔️', vi: 'Đỉnh Everest là ngọn núi cao nhất.', why: 'The highest.' }] }
        ]
    },
    {
        id: 'world-12',
        order: 12,
        title: '⭐ My Experiences & Ultimate Master',
        subtitle: 'Thì Hiện Tại Hoàn Thành (Present Perfect) & Đấu Trùm Cuối',
        grade: 'Lớp 5',
        gradeMin: 5,
        gradeMax: 5,
        icon: '⭐',
        color: '#ffd700',
        levels: [
            {
                id: 'w12-l1', order: 1, title: 'Present Perfect Starter', topic: 'Present Perfect', desc: '30 Động từ V3 cơ bản.',
                items: [{ kind: 'choice', prompt: 'V3 của speak là gì?', opts: ['spoken', 'spoke', 'speak'], ans: 0, why: 'speak -> spoke -> spoken.' }]
            },
            {
                id: 'w12-l2', order: 2, title: 'Have / Has + V3', topic: 'Formula', desc: 'Cấu trúc Have/Has V3.',
                items: [{ kind: 'choice', prompt: 'I ______ done my homework.', opts: ['have', 'has'], ans: 0, why: 'I have done.' }]
            },
            {
                id: 'w12-l3', order: 3, title: 'Already & Yet', topic: 'Signals', desc: 'Phân biệt Already & Yet.',
                items: [{ kind: 'choice', prompt: 'I haven\'t finished ______.', opts: ['yet', 'already'], ans: 0, why: 'Phủ định cuối câu dùng yet.' }]
            },
            {
                id: 'w12-l4', order: 4, title: 'Since & For', topic: 'Signals', desc: 'Mốc thời gian vs Khoảng thời gian.',
                items: [{ kind: 'choice', prompt: 'We have lived here ______ 2010.', opts: ['since', 'for'], ans: 0, why: 'Mốc năm dùng since.' }]
            },
            {
                id: 'w12-l5', order: 5, title: '30 Irregular Verbs Part 1', topic: 'Verbs V3', desc: '10 động từ V3 đầu.',
                items: [{ kind: 'choice', prompt: 'V3 của eat là gì?', opts: ['eaten', 'ate'], ans: 0, why: 'eaten.' }]
            },
            {
                id: 'w12-l6', order: 6, title: '30 Irregular Verbs Part 2', topic: 'Verbs V3', desc: '10 động từ V3 tiếp.',
                items: [{ kind: 'choice', prompt: 'V3 của write là gì?', opts: ['written', 'wrote'], ans: 0, why: 'written.' }]
            },
            {
                id: 'w12-l7', order: 7, title: '30 Irregular Verbs Part 3', topic: 'Verbs V3', desc: '10 động từ V3 cuối.',
                items: [{ kind: 'choice', prompt: 'V3 của go là gì?', opts: ['gone', 'went'], ans: 0, why: 'gone.' }]
            },
            {
                id: 'w12-l8', order: 8, title: 'Reading Passage', topic: 'Reading', desc: 'Đọc hiểu bài văn.',
                items: [{ kind: 'choice', prompt: 'Bo has taken 40 photos.', opts: ['True', 'False'], ans: 0, why: 'Trong bài.' }]
            },
            {
                id: 'w12-l9', order: 9, title: 'Ultimate Grammar Challenge', topic: 'All Grammar', desc: 'Trắc nghiệm tổng hợp.',
                items: [{ kind: 'build', target: 'She has gone to school .', emoji: '🎒', vi: 'Cô ấy đã đi học rồi.', why: 'She + has + gone.' }]
            },
            {
                id: 'w12-l10', order: 10, isBoss: true, title: '👑 Ultimate Boss: English Master', topic: 'Final Boss', desc: 'Đại chiến trùm cuối toàn bộ chương trình Mầm non - Lớp 5!',
                items: [
                    { kind: 'choice', prompt: 'She ______ never seen a lion before.', opts: ['has', 'have', 'is'], ans: 0, why: 'She + has + V3.' },
                    { kind: 'build', target: 'Our team has won the gold medal .', emoji: '🏆', vi: 'Đội của chúng tớ đã giành huy chương vàng.', why: 'Our team + has + won.' }
                ]
            }
        ]
    }
];
