# English Adventure --- Game Design & AI Coding Specification

> Tài liệu đặc tả để AI coding xây dựng game học tiếng Anh cho trẻ từ
> **Mầm non đến Lớp 5** (3 tuổi đến 11 tuổi).

## 1. Mục tiêu sản phẩm

Xây dựng game học tiếng Anh cho trẻ em Việt Nam từ **Mầm non đến Lớp 5** theo hình thức
**học qua mini-game**, có progression rõ ràng từ từ vựng nhận biết qua tranh ảnh, âm thanh phát âm đến ngữ pháp nâng cao.

Mục tiêu:
- Trẻ Mầm non học từ vựng qua hình ảnh emoji sinh động, âm thanh phát âm chuẩn tự động (TTS), không yêu cầu đọc chữ thạo.
- Học sinh Lớp 1-5 học từ vựng và ngữ pháp thông qua tương tác trực quan (kéo thả, chọn đáp án, xếp câu, phân loại).
- Tạo cảm giác đang chơi game: World → Level → Stars/XP → Unlock → Boss.
- Hạn chế chữ hướng dẫn dài, phản hồi tức thì với hiệu ứng âm thanh & động lực học tập.

## 2. Đối tượng

-   **Mầm non (Pre-K & Kindergarten)**: 3--6 tuổi (Hình ảnh, âm thanh, phát âm tự động, nhận biết màu sắc, con số, chữ cái, đồ chơi, gia đình).
-   **Lớp 1**: 6--7 tuổi (Từ vựng học tập, quần áo, thức ăn, câu ngắn *This is a...*, động vật & hành động).
-   **Lớp 2**: 7--8 tuổi (Từ vựng đời sống, To Be, Have/Has, So sánh số nhiều, Giới từ).
-   **Lớp 3**: 8--9 tuổi (Hiện tại đơn, Hiện tại tiếp diễn, Giờ giấc, Trạng từ).
-   **Lớp 4**: 9--10 tuổi (Quá khứ đơn, Tương lai, So sánh hơn & So sánh nhất).
-   **Lớp 5**: 10--11 tuổi (Hiện tại hoàn thành, 30 Động từ bất quy tắc V3, Thử thách Tổng hợp & Trùm Cuối).

Ngôn ngữ giao diện chính: **Tiếng Việt**.\
Nội dung học và câu hỏi: **Tiếng Anh**.

## 3. Cấu trúc progression

-   **12 Worlds**
-   **120 Levels**
-   Mỗi World có 10 level.
-   Level 10 của mỗi World là **Boss Level**.
-   Mỗi level có khoảng 6--10 câu/thử thách.
-   Một lượt chơi lý tưởng: 2--5 phút.

Progression:

`World → Level → Questions/Mini-games → Result → Stars + XP → Unlock next level`

------------------------------------------------------------------------

# 4. ROADMAP 120 LEVEL (MẦM NON DẾN LỚP 5)

## WORLD 1 --- 🎈 Pre-K & Kindergarten Starter (Mầm non)

**Mục tiêu:** Bảng chữ cái Alphabet Phonics, Màu sắc, Số đếm 1-10, Động vật nuôi cơ bản.\
**Phù hợp:** Mầm non (3-5 tuổi).

  Level   Nội dung                   Gameplay
  ------- -------------------------- -----------------
  1       Alphabet ABC Phonics (A-G) Flashcard + Audio
  2       Alphabet Phonics (H-N)     Flashcard + Audio
  3       Alphabet Phonics (O-Z)     Flashcard + Audio
  4       Colors (Red, Blue, Yellow) Picture Choice
  5       Colors (Green, Pink, Orange) Picture Choice
  6       Numbers 1 - 5              Count & Pick
  7       Numbers 6 - 10             Count & Pick
  8       Pets (Cat, Dog, Bird)      Picture Match
  9       Animals (Fish, Duck, Rabbit) Listen & Tap
  10      👑 Boss: Pre-K Fun         Mixed Challenge

------------------------------------------------------------------------

## WORLD 2 --- 🧸 Fun Around Me (Mầm non)

**Mục tiêu:** Gia đình, Trái cây, Bộ phận cơ thể, Đồ chơi & Cảm xúc.\
**Phù hợp:** Mầm non (4-6 tuổi).

  Level   Nội dung                   Gameplay
  ------- -------------------------- -----------------
  11      Family (Mommy, Daddy)      Picture Choice
  12      Family (Brother, Sister)   Picture Match
  13      Fruits (Apple, Banana)     Flashcard + Audio
  14      Fruits (Orange, Watermelon) Picture Choice
  15      My Body (Head, Eyes, Nose) Tap Body Part
  16      My Body (Hands, Legs)      Listen & Tap
  17      Toys (Ball, Doll, Car)     Picture Match
  18      Toys (Teddy, Robot)        Picture Choice
  19      Feelings (Happy, Sad)      Emoji Choice
  20      👑 Boss: Kids World        Mixed Challenge

------------------------------------------------------------------------

## WORLD 3 --- 🌱 School & Home (Lớp 1)

**Mục tiêu:** Đồ dùng học tập, Quần áo, Thức ăn, Cấu trúc câu ngắn *This is a...*, *It is red*.\
**Phù hợp:** Lớp 1 (6-7 tuổi).

  Level   Nội dung                   Gameplay
  ------- -------------------------- -----------------
  21      School Supplies (Pen, Book) Picture Match
  22      Classroom Objects          Choice
  23      Clothes (Shirt, Pants)     Picture Quiz
  24      Clothes (Hat, Shoes)       Match
  25      Food (Bread, Milk, Rice)   Picture Choice
  26      This is a...               Sentence Builder
  27      It is [color]              Choice
  28      My Room (Bed, Chair)       Picture Match
  29      Short Sentences            Sentence Builder
  30      👑 Boss: School Star       Mixed Challenge

------------------------------------------------------------------------

## WORLD 4 --- 🐶 Animals & Actions (Lớp 1)

**Mục tiêu:** Động vật hoang dã, Động từ hành động (*run, fly, swim*), Cấu trúc *I can...*, *I like...*.\
**Phù hợp:** Lớp 1 (6-7 tuổi).

  Level   Nội dung                   Gameplay
  ------- -------------------------- -----------------
  31      Wild Animals (Lion, Elephant) Picture Match
  32      Wild Animals (Monkey, Tiger) Choice
  33      Action Verbs (Run, Jump)   Listen & Pick
  34      Action Verbs (Fly, Swim)   Choice
  35      I can [verb]               Sentence Builder
  36      I cannot [verb]            Fill Missing
  37      I like [food/animal]       Choice
  38      I don't like...            Fill Missing
  39      Animal Actions Match       Sorting
  40      👑 Boss: Jungle Hero       Mixed Challenge

------------------------------------------------------------------------

## WORLD 3 --- 🏠 Where Is It?

**Mục tiêu:** Prepositions + There is / There are.

  Level   Nội dung
  ------- --------------------------
  21      In / On
  22      Under
  23      Behind / In front of
  24      Next to / Between
  25      Where is...?
  26      There is
  27      There are
  28      There is vs There are
  29      Describe the Room
  30      👑 Boss: Find Everything

Ưu tiên gameplay dựa trên tranh: chọn vị trí, kéo đồ vật, tìm đồ vật
trong phòng.

------------------------------------------------------------------------

## WORLD 4 --- ☀️ Every Day

**Mục tiêu:** Present Simple.

  Level   Nội dung
  ------- --------------------------------------
  31      Daily Activities
  32      I play / eat / go
  33      He plays
  34      She goes
  35      Verb + s / es
  36      Don't / Doesn't
  37      Do you...?
  38      Does he/she...?
  39      Always / Usually / Sometimes / Never
  40      👑 Boss: My Daily Routine

Ví dụ:

`Tom ___ his teeth every morning.`

-   brush
-   **brushes**
-   brushing

------------------------------------------------------------------------

## WORLD 5 --- 🏃 Right Now!

**Mục tiêu:** Present Continuous.

  Level   Nội dung
  ------- --------------------------------------
  41      Action Verbs
  42      Verb + ing
  43      I am playing
  44      He / She is running
  45      They are eating
  46      am / is / are + V-ing
  47      Negative Sentences
  48      What is he/she doing?
  49      Present Simple vs Present Continuous
  50      👑 Boss: What's Happening?

Ưu tiên animation hoặc hình minh họa hành động.

------------------------------------------------------------------------

## WORLD 6 --- 🦖 Yesterday

**Mục tiêu:** Past Simple.

  Level   Nội dung
  ------- ------------------------------
  51      Yesterday / Last night
  52      Was / Were
  53      Played / Watched
  54      Regular Verbs -ed
  55      Go → Went
  56      Eat → Ate / Drink → Drank
  57      See → Saw / Have → Had
  58      Didn't
  59      Did you...?
  60      👑 Boss: Yesterday Adventure

Irregular verbs nên có hệ thống card/collectible:

-   GO → WENT
-   EAT → ATE
-   DRINK → DRANK
-   SEE → SAW
-   HAVE → HAD
-   COME → CAME
-   TAKE → TOOK
-   MAKE → MADE

------------------------------------------------------------------------

## WORLD 7 --- 🚀 Tomorrow

**Mục tiêu:** Future with Will + Be Going To.

  Level   Nội dung
  ------- ---------------------------
  61      Tomorrow / Next week
  62      Will
  63      Will not / Won't
  64      Will you...?
  65      Predictions
  66      Be Going To
  67      Plans
  68      Will vs Going To
  69      My Future Plan
  70      👑 Boss: Future Adventure

------------------------------------------------------------------------

## WORLD 8 --- 🏆 Compare & Describe

**Mục tiêu:** Adjectives, Comparative, Superlative.

  Level   Nội dung
  ------- ------------------------------
  71      Adjectives
  72      Big / Small / Tall / Short
  73      Bigger / Smaller
  74      Taller / Shorter
  75      Faster / Slower
  76      The Biggest
  77      The Fastest
  78      Good → Better → Best
  79      Compare Animals
  80      👑 Boss: Animal Championship

Ví dụ gameplay:

`🐭  🐶  🐘`

`Which animal is the biggest?`

Trẻ chọn con voi.

------------------------------------------------------------------------

## WORLD 9 --- ⭐ My Experiences

**Mục tiêu:** Present Perfect.

> **QUAN TRỌNG:** Project hiện tại đã có module **Present Perfect**. AI
> coding cần kiểm tra code hiện có và **tái sử dụng/refactor module đó
> vào World 9**, không viết lại toàn bộ nếu không cần thiết.

  Level   Nội dung
  ------- --------------------------------
  81      Have / Has
  82      Past Participle V3
  83      I have played
  84      She has visited
  85      Have you ever...?
  86      Never
  87      Already
  88      Yet
  89      Present Perfect vs Past Simple
  90      👑 Boss: My Experiences

------------------------------------------------------------------------

## WORLD 10 --- 👑 English Master

**Mục tiêu:** Tổng hợp và ứng dụng.

  Level   Nội dung
  ------- ----------------------------------
  91      Build Sentences
  92      Fix the Sentence
  93      Choose the Correct Tense
  94      Read & Match
  95      Short Story
  96      Reading Questions
  97      Picture → Sentence
  98      Picture → Story
  99      Ultimate Challenge
  100     🏰 FINAL BOSS --- English Master

Final Boss trộn: - Present Simple - Present Continuous - Past Simple -
Future - Present Perfect - Prepositions - Comparatives / Superlatives -
Vocabulary - Reading

------------------------------------------------------------------------

# 5. CÁC DẠNG MINI-GAME

Không được để toàn bộ game chỉ là câu hỏi 4 đáp án.

AI nên xây dựng các gameplay component có thể tái sử dụng.

## 5.1 Multiple Choice

Ví dụ:

`She ___ a cat.`

-   have
-   has
-   having

## 5.2 Drag & Drop

Kéo từ vào ô trống:

`He [____] running.`

Words: `am` `is` `are`

## 5.3 Matching

Ví dụ:

`go` ↔ `went`\
`eat` ↔ `ate`\
`see` ↔ `saw`

## 5.4 Sentence Builder

Các block:

`She` `is` `playing` `football`

Trẻ kéo/sắp xếp thành câu đúng.

## 5.5 Picture Quiz

Hiển thị tranh → chọn từ hoặc câu đúng.

## 5.6 Listening

Phát audio tiếng Anh → trẻ: - chọn tranh; - chọn từ; - chọn câu; - sắp
xếp từ.

## 5.7 Fill Missing

`Tom ___ to school every day.`

## 5.8 Sorting

Ví dụ chia từ thành:

`Present` \| `Past`

hoặc:

`Have` \| `Has`

## 5.9 Spider Climb

Gameplay arcade/reward.

-   Hiển thị câu hỏi.
-   Trả lời đúng → Spider leo lên.
-   Sai → không tiến hoặc mất 1 heart.
-   Chuỗi đúng liên tiếp → bonus.
-   Đến đỉnh → hoàn thành level.

Spider Climb nên là một **game mode dùng lại được**, nhận question set
từ data thay vì hard-code grammar.

## 5.10 Boss Battle

Boss Level: - 10--15 câu. - Trộn 3--5 gameplay. - Khó hơn level
thường. - Có progress bar/Boss HP. - Trả lời đúng gây damage. - Hoàn
thành nhận reward đặc biệt.

------------------------------------------------------------------------

# 6. GAME LOOP

Flow đề xuất:

`Home` → `World Map` → `Select World` → `Select Level` → `Gameplay` →
`Answer Feedback` → `Level Result` → `Stars + XP` → `Unlock` →
`World Map`

Không nên có quá nhiều màn hình trung gian.

------------------------------------------------------------------------

# 7. HỆ THỐNG STARS

Mỗi level tối đa ⭐⭐⭐.

Ví dụ:

-   ⭐: hoàn thành ≥ 60%
-   ⭐⭐: ≥ 80%
-   ⭐⭐⭐: ≥ 95%

Không khóa progression quá gắt với trẻ nhỏ.

Khuyến nghị: - Chỉ cần hoàn thành level để mở level kế tiếp. - Stars
dùng để mở cosmetic/reward/bonus.

------------------------------------------------------------------------

# 8. XP & LEVEL

Ví dụ:

-   Correct answer: +10 XP
-   Combo: bonus XP
-   Finish level: +50 XP
-   Perfect level: +100 XP
-   Boss: +150 XP

XP dùng để tăng Player Level.

Không dùng cơ chế phạt XP khi trẻ trả lời sai.

------------------------------------------------------------------------

# 9. HEART / LIVES

Có thể dùng ❤️ để tạo cảm giác game nhưng không gây khó chịu.

Khuyến nghị: - 3--5 hearts trong một level. - Sai → feedback + giải
thích. - Không bắt trẻ chờ thời gian thật để hồi heart. - Có thể retry
ngay.

------------------------------------------------------------------------

# 10. STREAK / COMBO

Ví dụ:

3 câu đúng → `🔥 Great!`

5 câu → `🔥🔥 Amazing!`

10 câu → `⚡ Perfect Combo!`

Combo có thể: - tăng XP; - tạo animation; - tăng damage trong Boss
Battle; - giúp Spider leo nhanh hơn.

------------------------------------------------------------------------

# 11. REWARDS

Reward phù hợp trẻ nhỏ:

-   ⭐ Stars
-   🪙 Coins
-   🏆 Trophies
-   🎖️ Badges
-   Character skins
-   Avatar
-   Hats
-   Pets
-   Stickers

Không cần monetization trong core gameplay.

------------------------------------------------------------------------

# 12. WORLD MAP

World Map cần trực quan.

Ví dụ:

``` text
🌱 World 1
   ●—●—●—●—●—●—●—●—●—👑
                         |
🎒 World 2
   ●—●—●—●—●—●—●—●—●—👑
                         |
🏠 World 3
...
```

State của level: - Locked - Available - Completed 1 star - Completed 2
stars - Completed 3 stars

------------------------------------------------------------------------

# 13. UI/UX CHO TRẺ

## Bắt buộc

-   Button lớn.
-   Font dễ đọc.
-   Ít chữ trên màn hình.
-   Icon rõ ràng.
-   Không có UI quá nhỏ.
-   Animation vui nhưng không gây nhiễu.
-   Feedback ngay sau thao tác.
-   Màu sắc thân thiện.
-   Hạn chế menu phức tạp.

## Feedback đúng

Ví dụ:

`✓ Great job!`

Kèm: - animation; - sound; - XP; - character reaction.

## Feedback sai

Không dùng: `WRONG!`

Ưu tiên:

`Try again!`

Sau 1--2 lần sai có thể highlight đáp án/gợi ý.

------------------------------------------------------------------------

# 14. ÂM THANH

Cần hỗ trợ:

-   pronunciation audio;
-   correct sound;
-   incorrect/try-again sound;
-   button sound;
-   reward sound;
-   boss sound;
-   background music.

Phải có: - Music ON/OFF - Sound Effects ON/OFF - Voice ON/OFF

------------------------------------------------------------------------

# 15. PRONUNCIATION

Mỗi vocabulary item nên hỗ trợ:

``` text
word
meaning
image
audio
example
```

Ví dụ:

``` json
{
  "word": "apple",
  "meaning": "quả táo",
  "image": "apple.webp",
  "audio": "apple.mp3",
  "example": "I have an apple."
}
```

------------------------------------------------------------------------

# 16. DATA-DRIVEN ARCHITECTURE

**Không hard-code câu hỏi trực tiếp trong component.**

Gameplay engine và educational content phải tách riêng.

Cấu trúc:

``` text
Content Data
     ↓
Question Engine
     ↓
Gameplay Component
     ↓
Result / Progress
```

Một question có thể được sử dụng bởi nhiều gameplay khác nhau.

------------------------------------------------------------------------

# 17. DATA MODEL ĐỀ XUẤT

## World

``` ts
interface World {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  icon: string;
  gradeMin: number;
  gradeMax: number;
  description: string;
  levels: Level[];
}
```

## Level

``` ts
interface Level {
  id: string;
  worldId: string;
  order: number;
  title: string;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  gameModes: GameMode[];
  questionIds: string[];
  isBoss: boolean;
  requiredLevelId?: string;
}
```

## GameMode

``` ts
type GameMode =
  | "multiple_choice"
  | "drag_drop"
  | "matching"
  | "sentence_builder"
  | "picture_quiz"
  | "listening"
  | "fill_missing"
  | "sorting"
  | "spider_climb"
  | "boss";
```

## Question

``` ts
interface Question {
  id: string;

  grade: 2 | 3 | 4 | 5;

  topic: string;

  type: GameMode;

  instruction?: string;

  prompt: string;

  options?: string[];

  correctAnswer: string | string[];

  explanation?: string;

  image?: string;

  audio?: string;

  difficulty: 1 | 2 | 3 | 4 | 5;

  tags?: string[];
}
```

------------------------------------------------------------------------

# 18. EXAMPLE QUESTION DATA

``` json
{
  "id": "present-simple-001",
  "grade": 3,
  "topic": "present_simple",
  "type": "multiple_choice",
  "instruction": "Chọn đáp án đúng",
  "prompt": "Tom ___ football every Sunday.",
  "options": [
    "play",
    "plays",
    "playing"
  ],
  "correctAnswer": "plays",
  "explanation": "Tom = he, nên động từ thêm -s.",
  "difficulty": 2,
  "tags": [
    "present-simple",
    "third-person"
  ]
}
```

------------------------------------------------------------------------

# 19. PLAYER PROGRESS DATA

``` ts
interface PlayerProgress {
  playerLevel: number;
  xp: number;
  coins: number;

  unlockedWorlds: string[];
  unlockedLevels: string[];

  levelProgress: Record<string, LevelProgress>;

  achievements: string[];

  settings: {
    music: boolean;
    soundEffects: boolean;
    voice: boolean;
  };
}
```

``` ts
interface LevelProgress {
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  attempts: number;
}
```

------------------------------------------------------------------------

# 20. QUESTION RANDOMIZATION

Khi chơi lại level: - random thứ tự câu; - random thứ tự answer
options; - lấy subset từ question pool lớn hơn; - tránh lặp câu vừa xuất
hiện; - giữ đúng difficulty của level.

Ví dụ level cần 10 câu nhưng pool có 25 câu.

Mỗi lượt chọn random 10 câu.

------------------------------------------------------------------------

# 21. DIFFICULTY

### ⭐ Level 1

Nhận biết.

Ví dụ: `🐱 → cat`

### ⭐⭐ Level 2

Chọn cấu trúc đơn giản.

`She ___ happy.`

### ⭐⭐⭐ Level 3

Điền câu.

### ⭐⭐⭐⭐ Level 4

Phân biệt cấu trúc gần giống nhau.

### ⭐⭐⭐⭐⭐ Level 5

Mixed grammar + reading/context.

------------------------------------------------------------------------

# 22. CONTENT RULES

Nội dung phải: - phù hợp trẻ 7--11 tuổi; - câu ngắn; - vocabulary quen
thuộc; - tránh chủ đề người lớn; - tránh câu quá phức tạp; - ưu tiên ngữ
cảnh gia đình, trường học, động vật, đồ ăn, thể thao, thiên nhiên, đồ
chơi, bạn bè.

Không đưa kiến thức grammar vượt quá mục tiêu của level nếu chưa được
unlock.

------------------------------------------------------------------------

# 23. VOCABULARY THEMES

Từ vựng nên xoay quanh:

1.  Animals
2.  Family
3.  School
4.  Toys
5.  Food
6.  Drinks
7.  Colors
8.  Numbers
9.  Body
10. Clothes
11. House
12. Daily Activities
13. Sports
14. Weather
15. Transportation
16. Nature
17. Jobs
18. Places
19. Holidays
20. Hobbies

------------------------------------------------------------------------

# 24. SAVE SYSTEM

Phải lưu: - world đã mở; - level đã mở; - stars; - best score; - XP; -
coins; - achievements; - settings.

Nếu app chưa có backend: - dùng local persistence trước.

Kiến trúc cần cho phép chuyển sang cloud sync sau này.

------------------------------------------------------------------------

# 25. RESUME

Khi mở app lại:

``` text
Continue Learning
World 4 — Every Day
Level 36 — Don't / Doesn't
```

Cho phép Resume nhanh.

------------------------------------------------------------------------

# 26. EXISTING PRESENT PERFECT MODULE

Đây là yêu cầu quan trọng cho AI coding.

Trước khi code:

1.  Inspect project hiện tại.
2.  Tìm module/game Present Perfect đã tồn tại.
3.  Xác định:
    -   components có thể reuse;
    -   question format;
    -   scoring;
    -   assets;
    -   audio;
    -   navigation.
4.  Refactor nếu cần để phù hợp architecture chung.
5.  Đưa Present Perfect vào **World 9**.
6.  Không phá gameplay hiện tại.
7.  Không duplicate logic nếu có thể tái sử dụng.

------------------------------------------------------------------------

# 27. PHASE TRIỂN KHAI

Không nên yêu cầu AI code toàn bộ 100 level cùng lúc.

## Phase 1 --- Core Engine

Làm: - Home - World Map - Level Select - Player Progress - Question
Engine - Stars - XP - Save - Settings

## Phase 2 --- Gameplay Components

Làm reusable components: 1. Multiple Choice 2. Drag & Drop 3. Matching
4. Sentence Builder 5. Picture Quiz 6. Fill Missing 7. Sorting 8.
Listening

## Phase 3 --- World 1

Implement hoàn chỉnh World 1.

Mục tiêu là kiểm tra toàn bộ architecture.

## Phase 4 --- World 2--5

Thêm content, không duplicate game engine.

## Phase 5 --- World 6--8

Thêm grammar nâng cao + Boss.

## Phase 6 --- World 9

Integrate Present Perfect hiện có.

## Phase 7 --- World 10

Mixed challenges + Final Boss.

## Phase 8 --- Polish

-   animations;
-   sound;
-   rewards;
-   achievements;
-   balancing;
-   accessibility;
-   performance.

------------------------------------------------------------------------

# 28. HƯỚNG MỞ RỘNG LÊN 150 LEVEL

Sau MVP 100 level, thêm khoảng 5 Worlds:

## World 11 --- 💪 I Can!

-   Can / Can't
-   Abilities
-   Can you...?
-   Requests

## World 12 --- ❓ Question Master

-   What
-   Where
-   Who
-   When
-   Why
-   How
-   How many
-   How much

## World 13 --- 🍎 Food Market

-   Countable / Uncountable
-   Some / Any
-   A / An
-   Much / Many
-   A lot of

## World 14 --- 🦸 Be a Good Hero

-   Should / Shouldn't
-   Must / Mustn't
-   Rules
-   Advice

## World 15 --- 📚 Story Adventure

-   Reading comprehension
-   Sentence building
-   Story ordering
-   Listening comprehension
-   Short writing
-   Mixed grammar

Levels 101--150 sẽ được chia đều cho 5 World này.

------------------------------------------------------------------------

# 29. ACCEPTANCE CRITERIA

Phiên bản MVP được coi là đạt khi:

-   Có World Map hoạt động.
-   Có ít nhất World 1 hoàn chỉnh.
-   Level unlock đúng progression.
-   Có ít nhất 5 gameplay types hoạt động.
-   Questions lấy từ data, không hard-code trong UI.
-   Có Stars.
-   Có XP.
-   Có lưu progress.
-   Có replay.
-   Question/order được random hợp lý.
-   Có feedback đúng/sai.
-   UI phù hợp trẻ nhỏ.
-   Có responsive layout.
-   Present Perfect hiện tại không bị mất.
-   Architecture cho phép đưa Present Perfect vào World 9.
-   Có thể thêm World/Level/Question mới chủ yếu bằng data thay vì sửa
    game engine.

------------------------------------------------------------------------

# 30. YÊU CẦU AI CODING TRƯỚC KHI BẮT ĐẦU

AI coding **không được lập tức rewrite toàn bộ project**.

Hãy thực hiện theo thứ tự:

1.  Inspect cấu trúc repository hiện tại.
2.  Xác định framework, routing, state management, storage và styling
    đang dùng.
3.  Tìm implementation của Present Perfect.
4.  Liệt kê phần có thể reuse.
5.  Đề xuất architecture tối thiểu cần thay đổi.
6.  Giữ compatibility với code hiện có.
7.  Tạo data model chung cho World / Level / Question.
8.  Implement Core Engine.
9.  Implement **World 1** hoàn chỉnh làm vertical slice.
10. Chạy/test World 1.
11. Chỉ sau khi core architecture ổn định mới mở rộng các World tiếp
    theo.

## Nguyên tắc kỹ thuật

-   Reusable components.
-   Data-driven.
-   Không duplicate question logic.
-   Không hard-code nội dung học trong UI component.
-   Tách game logic khỏi presentation.
-   Tách content khỏi engine.
-   Code dễ mở rộng lên 150+ levels.
-   Ưu tiên code đơn giản, dễ bảo trì hơn abstraction không cần thiết.

------------------------------------------------------------------------

# 31. NHIỆM VỤ ĐẦU TIÊN CHO AI

Khi nhận file này, hãy bắt đầu bằng:

> Hãy inspect project hiện tại và implementation Present Perfect. Chưa
> code ngay. Hãy mô tả architecture hiện tại, những component có thể tái
> sử dụng, những điểm cần refactor, sau đó đề xuất implementation plan
> để biến project thành game 10 Worlds / 100 Levels theo specification
> này. Ưu tiên data-driven architecture và giữ nguyên những phần hiện
> tại đang hoạt động tốt.

Sau khi plan được xác nhận, bắt đầu implement **Core Engine + World 1**
trước.

------------------------------------------------------------------------

## Tóm tắt

Mục tiêu cuối cùng:

**Một game tiếng Anh cho trẻ lớp 2--5 có progression 100 level, nhiều
mini-game, có Stars/XP/rewards, nội dung data-driven và có thể mở rộng
lên 150+ level mà không phải viết lại game engine.**
