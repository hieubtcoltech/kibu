/* ============================================================================
 * KIBU Games — Shared bilingual engine (Vietnamese ⇄ English)
 * ----------------------------------------------------------------------------
 * One dictionary for the whole site. Loaded from <head> on every page, BEFORE
 * each game's game.js, so it can patch the canvas text API before any drawing
 * happens.
 *
 * What it translates:
 *   1. [data-i18n] / [data-i18n-html] elements (key based)
 *   2. every plain text node in <body> (whitespace-normalised exact match)
 *   3. placeholder / title / alt / aria-label attributes
 *   4. document.title
 *   5. canvas fillText / strokeText / measureText  ← the HUD text in the games
 *   6. text injected later by game.js (MutationObserver)
 *
 * Direction: the dictionary holds [vi, en] pairs and is used both ways, so the
 * pages written in English (index, about) become Vietnamese too.
 *
 * Per-page opt-out, set on <html>:
 *   data-kibu-i18n="off"    → engine only wires the flag button (page owns i18n)
 *   data-kibu-i18n="exact"  → whole-string matches only, no in-sentence
 *                             substitution (used by english-game, whose lesson
 *                             content is Vietnamese on purpose)
 * ==========================================================================*/
(function () {
    'use strict';

    var LANG_KEY = 'kibu_global_lang';

    /* ------------------------------------------------------------------ *
     * 1. DICTIONARY — [ vietnamese, english ]
     *
     *    {0} {1} … are placeholders that match any run of characters, used
     *    for strings the games build with template literals.
     * ------------------------------------------------------------------ */
    var PAIRS = [

        /* ---------- Navigation, shared buttons, shared HUD ---------- */
        ['Trang Chủ', 'Home'],
        ['Về Menu', 'Main Menu'],
        ['Về Chúng Tôi', 'About Us'],
        ['Chơi Game', 'Play Games', 'x'],        // substring of "Sân Chơi Game Trực Tuyến"
        ['Âm Thanh', 'Sound'],
        ['Nhạc Nền', 'Music'],
        ['Chơi Lại', 'Restart'],
        ['Đấu Lại', 'Play Again'],
        ['Đá Lại', 'Rematch'],
        ['Thi Lại', 'Play Again'],
        ['Đua Lại', 'Race Again'],
        ['Học Lại', 'Start Over'],
        ['Thử Lại', 'Try Again'],
        ['Ván Mới', 'New Game'],
        ['Luật Chơi', 'Rules'],
        ['Đã Hiểu', 'Got It'],
        ['Cửa Hàng', 'Shop'],
        ['Đóng Cửa Hàng', 'Close Shop'],
        ['Đổi Chế Độ', 'Change Mode'],
        ['Đổi Đội Hình', 'Change Lineup'],
        ['Chọn Màn', 'Levels'],
        ['Bảng Vàng', 'High Scores'],
        ['Tạm Dừng', 'Paused'],
        ['Chơi Tiếp', 'Resume'],
        ['Đá Tiếp', 'Resume Match'],
        ['Bắt Đầu', 'Start'],
        ['Đóng', 'Close'],
        ['Bắt Đầu Chơi', 'Start Playing'],
        ['Điểm Số', 'Score'],
        ['Xu Thưởng', 'Coins'],
        ['Kỷ Lục', 'Best'],
        ['Bật', 'On'],
        ['Tắt', 'Off'],
        ['Dễ', 'Easy'],
        ['Vừa', 'Medium'],
        ['Khó', 'Hard'],
        ['Siêu Khó', 'Insane'],
        ['Độ Khó', 'Difficulty'],
        ['Bé 1', 'Kid 1'],
        ['Bé 2', 'Kid 2'],
        ['Bé 3', 'Kid 3'],
        ['Bé 4', 'Kid 4'],
        ['Người Chơi 1', 'Player 1'],
        ['Người Chơi 2', 'Player 2'],
        ['Số Người Chơi', 'Number Of Players'],
        ['Chọn Chế Độ Chơi', 'Choose A Game Mode'],
        ['Cách Ngắm', 'How To Aim'],
        ['Đối Kháng', 'Versus'],
        ['Luyện Tập', 'Practice'],
        ['Thắng!', 'Wins!'],
        ['Hoà Rồi!', "It's A Draw!"],
        ['Hoà Nhau!', "It's A Draw!"],
        ['Hoà', 'Draw', 'x'],          // ô đếm ván hoà trên bảng điểm cờ caro
        ['Chiến Thắng!', 'Victory!'],
        ['Thất Bại!', 'Defeat!'],
        ['Bắt Đầu!', 'Go!'],
        ['Chuỗi dài nhất:', 'Longest streak:'],
        ['Chuỗi dài nhất', 'Longest streak'],
        ['Chuỗi đúng dài nhất', 'Longest streak'],
        ['Chuỗi:', 'Streak:', 'f'],
        ['Chuỗi', 'Streak'],
        ['Chính xác', 'Accuracy'],
        ['Điểm số đạt được:', 'Final score:'],
        ['Điểm số hack được:', 'Score hacked:'],
        ['Nghỉ một chút rồi chơi tiếp nhé!', 'Take a short break, then jump back in!'],
        ['Nghỉ giải lao một chút rồi đá tiếp nhé!', 'Take a short break, then get back on the pitch!'],
        ['Cân bằng', 'Balanced'],
        ['Mũi tên & thanh lực chạy chậm', 'Slow-moving arrow and power bar'],
        ['Mũi tên tự lắc, giữ phím lấy lực rồi thả', 'The arrow swings by itself — hold to charge, release to fire'],
        ['Kéo lùi như bắn ná (hợp với màn hình cảm ứng)', 'Drag back like a slingshot (great on touch screens)'],
        ['Giữ & Thả', 'Hold & Release'],
        ['Kéo & Thả', 'Drag & Release'],
        ['Phím của từng bé:', 'Keys for each kid:'],
        ['PHÍM CỦA TỪNG BÉ', 'KEYS FOR EACH KID'],
        ['2 bé →', '2 kids →'],
        ['3 bé →', '3 kids →'],
        ['4 bé →', '4 kids →'],
        ['Trên máy cảm ứng: mỗi bé chạm vào', 'On a touch screen each kid taps'],
        ['Từ', 'With'],
        ['1 đến 4 bé', '1 to 4 kids'],
        ['2 đến 4 bé', '2 to 4 kids'],
        ['đúng vật lý thật', 'true-to-life physics'],
        ['hoặc', 'or', 'f'],
        ['và', 'and', 'f'],
        ['1 BÉ', '1 KID'],
        ['2 BÉ', '2 KIDS'],
        ['3 BÉ', '3 KIDS'],
        ['4 BÉ', '4 KIDS'],
        ['Trợ Giúp Bé:', 'Aim Helper:'],
        ['Trợ Giúp Bé: Bật', 'Aim Helper: On'],
        ['Trợ Giúp Bé: Tắt', 'Aim Helper: Off'],
        ['Hiện đường bay dự đoán giúp bé ngắm dễ hơn', 'Show the predicted flight path to make aiming easier'],

        /* ---------- Nhãn ngắn ở màn hình chọn (Ocean Party & Aqua Dash) ----------
           Rút gọn nhãn mà quên bổ sung ở đây thì bản tiếng Anh lòi ra tiếng Việt.
           "THỜI LƯỢNG" tách riêng khỏi "Thời Gian" của đồng hồ trong HUD, vì mỗi
           chỗ cần một nghĩa khác nhau. */
        ['SỐ BÉ', 'PLAYERS'],
        ['VÙNG BIỂN', 'PICK YOUR SEA'],
        ['THỜI LƯỢNG', 'ROUND TIME'],
        ['Nhanh', 'Quick'],
        ['Hôm Nay', 'Daily'],
        ['1 phút', '1 minute'],
        ['Gom kho báu — hết giờ ai nhiều điểm nhất thắng!',
            'Grab treasure — the highest score when time runs out wins!'],
        ['Bơi theo màn hình, gom kho báu — tụt lại là bị loại!',
            'Keep up with the screen, grab treasure — fall behind and you are out!'],
        ['BỘ ĐỒ CỦA BÉ 1', 'KID 1\'S WETSUIT'],
        ['Điều khiển', 'Controls'],
        ['Ăn điểm', 'Scoring'],
        ['Tránh xa', 'Avoid'],
        ['Cưỡi cá & bảo bối', 'Rides & power-ups'],
        ['Luật đua', 'Race rules'],
        ['Ăn liên tiếp không nghỉ để nhân điểm', 'Collect without stopping to multiply your score'],
        ['Mỗi mét bơi được thêm 2 điểm', 'Every metre swum adds 2 points'],
        ['Cá mập đuổi bé bơi nhanh nhất', 'Sharks chase the fastest swimmer'],
        ['Cá mập đuổi bé đang đứng chót', 'Sharks chase whoever is last'],
        ['Màn hình tự trôi', 'The screen scrolls'],
        ['Tụt lại là bị loại', 'Fall behind, you are out'],
        ['Hết giờ, nhiều điểm nhất thắng', 'Highest score at the buzzer wins'],
        ['3 đường: khó thì nhiều kho báu', '3 routes: riskier means richer'],
        ['cần gạt', 'joystick'],

        /* ---------- Strike Party (bowling-game) ---------- */
        ['THỬ TÀI STRIKE', 'STRIKE CHALLENGE'],
        ['8 quả trên giàn ki đầy — ai được nhiều strike hơn?', '8 balls at a full rack - who lands the most strikes?'],
        ['DỌN KI SÓT', 'SPARE MASTER'],
        ['Những thế ki sót có thật, từ dễ tới thế 7-10 khét tiếng', 'Real leaves to clear, from buckets up to the 7-10'],
        ['🦃 TURKEY - ba cú strike liên tiếp, chuỗi nổi tiếng nhất của bowling',
            '🦃 TURKEY - three strikes in a row, the most famous streak in bowling'],
        ['🔥 SIÊU KHÓ', '🔥 INSANE'],
        ['STRIKE PARTY', 'STRIKE PARTY'],
        ['Ném Bóng Bowling', 'Strike Party'],
        ['ĐANG NÉM', 'NOW BOWLING'],
        ['Giữ phím của bé lúc quả bóng trượt ngang, thả ra là bóng lăn', 'Hold your key while the ball slides across, let go to bowl'],
        ['VÁN ĐẦY ĐỦ', 'FULL GAME'],
        ['Mỗi bé 10 hiệp — đúng như thật', '10 frames each - the real thing'],
        ['VÁN NHANH', 'QUICK MATCH'],
        ['5 hiệp — đua nhanh phân thắng bại', '5 frames - a short race for the win'],
        ['Không có hồi kết — ném bao lâu tuỳ thích', 'No end - bowl as long as you like'],
        ['Mũi ngắm chậm, có thanh chắn rãnh, bóng gần như không cong', 'Slow aim, bumpers on, ball barely curves'],
        ['Có rãnh thật, bóng cong nhẹ', 'Real gutters, ball hooks a little'],
        ['Mũi ngắm nhanh, bóng cong mạnh, không có vạch ngắm', 'Fast aim, strong hook, no aiming line'],
        ['Lớp dầu trên đường cứ trôi đi dưới quả bóng!', 'The oil keeps shifting under the ball!'],
        ['BẮT ĐẦU NÉM', 'START BOWLING'],
        ['❌ STRIKE - đổ cả 10 ki ngay bóng đầu, được 10 điểm cộng thêm hai bóng sau',
            '❌ STRIKE - all 10 on the first ball, 10 points plus your next two balls'],
        ['➗ SPARE - đổ hết 10 ki bằng hai bóng, được 10 điểm cộng thêm một bóng sau',
            '➗ SPARE - all 10 across two balls, 10 points plus your next ball'],
        ['🕳️ GUTTER - bóng rơi xuống rãnh, lần này không đổ ki nào',
            '🕳️ GUTTER - the ball fell in the channel, no pins this time'],
        ['Bowling, cho 1-4 bé', 'Bowling, 1-4 kids'],
        ['Làn rộng nhất, dễ ngắm nhất', 'Widest lanes, easiest to aim'],
        ['Ba làn cạnh nhau', 'Three lanes side by side'],
        ['Bốn làn, phải ngắm chuẩn hơn', 'Four lanes, aim has to be sharper'],
        ['Ném một mình và phá kỷ lục của chính mình', 'Bowl alone and chase your best score'],

        /* ---------- Sling Blast (sling-blast) ---------- */
        ['Bắn Bi Phá Tháp', 'Sling Blast'],
        ['Kéo ná, thả tay, đánh sập cả toà tháp', 'Pull back, let go, bring the whole tower down'],
        ['Kéo rồi thả', 'Pull and release'],
        ['Kéo viên bi về phía sau rồi thả tay là bắn.', 'Drag back from the slingshot and let go to fire.'],
        ['Chạm giữa không trung', 'Tap in the air'],
        ['Chạm một cái lúc viên bi phép đang bay để bật phép của nó.',
            'Tap once while a special ball is flying to set off its power.'],
        ['Nổ hết Cục Cáu', 'Pop every Grumpy'],
        ['Dọn sạch là thắng. Bi thừa lại đổi thành sao.', 'Clear them all to win. Shots left turn into stars.'],
        ['Heo Con', 'Piggy'],
        ['Tròn trịa và nặng', 'Round and heavy'],
        ['Tách Ba', 'Splitter'],
        ['Chạm để tách thành ba', 'Tap to split into three'],
        ['Bom', 'Bomb'],
        ['Chạm để nổ tung', 'Tap to blow up'],
        ['Sấm Sét', 'Thunder'],
        ['Chạm để lao xuống thật nhanh', 'Tap to dive down fast'],
        ['CHƠI', 'PLAY'],
        ['CHỌN MÀN', 'CHOOSE A LEVEL'],
        ['Quay Lại', 'Back'],
        ['Xoá tiến trình', 'Reset progress'],
        ['Chơi lại màn này', 'Replay level'],
        ['QUA MÀN!', 'LEVEL CLEARED!'],
        ['Màn tiếp', 'Next level'],
        ['Xem hết sao của bé', 'See all my stars'],
        ['Chơi lại', 'Replay'],
        ['HẾT BI!', 'OUT OF SHOTS!'],
        ['Vẫn còn vài Cục Cáu đứng đó. Thử ngắm góc khác xem!',
            'A few Grumpies are still standing. Try a different angle!'],
        ['Còn đúng một Cục Cáu thôi. Thử ngắm góc khác xem!',
            'One Grumpy is still standing. Try a different angle!'],
        ['Thử lại', 'Try again'],
        ['QUA HẾT MỌI MÀN!', 'ALL LEVELS CLEARED!'],
        ['Bé đã đánh sập mọi toà tháp. Ngắm quá giỏi!', 'You knocked down every tower. Amazing aim!'],
        ['Chơi lại từ đầu', 'Play again'],
        ['Màn {0}', 'Level {0}'],
        ['Cục Cáu còn lại', 'Grumpies left'],
        ['Bi còn lại', 'Balls left'],
        ['Xoay ngang điện thoại để sân chơi rộng gấp đôi', 'Turn your phone sideways for a much bigger playfield'],
        /* tên và mách nước của 12 màn */
        ['Cú Bắn Đầu Tiên', 'First Throw'],
        ['Kéo viên bi về sau rồi thả tay ra.', 'Drag back from the ball, then let go.'],
        ['Hai Toà Tháp', 'Twin Towers'],
        ['Nhắm vào hai cột, mái nhà sẽ tự sập.', 'Aim at the posts - the roof does the rest.'],
        ['Cầu Băng', 'Ice Bridge'],
        ['Băng chỉ chạm nhẹ là vỡ tan.', 'Ice shatters from the lightest tap.'],
        ['Cổng Đá', 'Stone Gate'],
        ['Đá rất cứng, hãy bắn trúng một chỗ hai lần.', 'Stone is tough - hit the same spot twice.'],
        ['Giờ Nổ', 'Boom Time'],
        ['Chạm màn hình lúc quả bom đỏ đang bay!', 'Tap the screen while the red bomb is flying!'],
        ['Ba Túp Lều', 'Three Huts'],
        ['Chạm giữa không trung để tách một viên thành ba.', 'Tap in the air to split one ball into three.'],
        ['Tháp Cao', 'High Rise'],
        ['Chạm lúc viên vàng đang bay để nó lao thẳng xuống.',
            'Tap while the yellow ball flies to dive straight down.'],
        ['Thùng Thuốc Nổ', 'Danger Barrels'],
        ['Thùng đỏ vỡ ra là nổ tung.', 'Red barrels blow up when you break them.'],
        ['Hầm Ngầm', 'The Cellar'],
        ['Chỗ viên đá không tới được thì để quả bom lo.', 'A bomb clears what a rock cannot reach.'],
        ['Kim Tự Tháp', 'Pyramid'],
        ['Phá chân tháp là cả ngọn đổ theo.', 'Knock out the bottom and the top comes down.'],
        ['Chòi Trên Cao', 'Sky Perch'],
        ['Hai cột băng mỏng đang đỡ một mái đá rất nặng.', 'Thin ice posts hold a very heavy roof.'],
        ['Pháo Đài Cục Cáu', 'Grumpy Fortress'],
        ['Màn cuối! Dùng hết mọi mẹo bé đã học.', 'Last one! Use every trick you have learned.'],

        /* chương và màn mới của Sling Blast */
        ['Cơ Bản', 'Basics'],
        ['Đồi Đá', 'Rocky Ridge'],
        ['Công Trường', 'Playground'],
        ['Trên Mây', 'Sky High'],
        ['Vượt Tường', 'Over The Wall'],
        ['Bệ Đá', 'The Ledge'],
        ['Hai Cột Đá', 'Two Pillars'],
        ['Dưới Mái Đá', 'Under The Roof'],
        ['Ô Cửa Sổ', 'The Window'],
        ['Khe Núi', 'The Canyon'],
        ['Bom Trên Bệ', 'Bomb The Ledge'],
        ['Cầu Đá', 'Rock Bridge'],
        ['Bậc Thang', 'Stair Steps'],
        ['Đường Hầm', 'The Tunnel'],
        ['Tường Cao', 'High Wall'],
        ['Pháo Đài Đá', 'Rock Fortress'],
        ['Cú Nảy Đầu Tiên', 'First Bounce'],
        ['Nảy Qua Tường', 'Bounce Over'],
        ['Bập Bênh', 'See-Saw'],
        ['Cửa Quay', 'Spinning Gate'],
        ['Nảy Hai Lần', 'Double Bounce'],
        ['Máy Bắn Đá', 'The Catapult'],
        ['Nảy Rồi Nổ', 'Bounce And Bomb'],
        ['Cầu Đưa Võng', 'Swing Bridge'],
        ['Công Viên Nhún', 'Trampoline Park'],
        ['Cối Xay Gió', 'Windmill'],
        ['Tháp Lò Xo', 'Spring Tower'],
        ['Trùm Công Trường', 'Playground Boss'],
        ['Quả Bóng Đầu Tiên', 'First Balloon'],
        ['Hai Quả Bóng', 'Two Balloons'],
        ['Trời Và Đất', 'Sky And Ground'],
        ['Sau Đám Mây', 'Behind The Cloud'],
        ['Tháp Bóng Bay', 'Balloon Tower'],
        ['Bom Giữa Trời', 'Bomb In The Sky'],
        ['Nảy Lên Trời', 'Bounce To The Sky'],
        ['Ba Nhà Một Hàng', 'Three In A Row'],
        ['Tách Ba Giữa Trời', 'Split In The Air'],
        ['Pháo Đài Bay', 'Sky Fortress'],
        ['Mây Giông', 'Storm Cloud'],
        ['Vương Quốc Mây', 'Cloud Kingdom'],
        ['Kéo cao lên để bi bay vòng cầu qua bức tường.', 'Pull high so the ball arcs over the wall.'],
        ['Nhà nằm trên bệ đá. Bệ không vỡ, chỉ nhà mới vỡ.', 'The hut sits on rock. Rock never breaks - the hut does.'],
        ['Hai cột đá chặn hai bên, lối vào chỉ còn ở giữa.', 'Rock pillars on both sides. The only way in is the middle.'],
        ['Có mái đá che trên đầu — thả bi lăn vào từ bên hông.', 'A rock roof is in the way - roll the ball in from the side.'],
        ['Bắn lọt qua ô cửa sổ giữa hai khối đá.', 'Fire through the window between the two rocks.'],
        ['Cả ba đứng dưới khe. Rơi trúng khe là ăn cả cụm.', 'All three are down in the gap. Drop one in and they all go.'],
        ['Bệ đá chắn hết đường — cho quả bom nổ ngay bên trên.', 'Rock blocks every path - set the bomb off right above it.'],
        ['Trên cầu một bé, dưới gầm cầu một bé.', 'One Grumpy on the bridge, one under it.'],
        ['Ba bậc, mỗi bậc một bé. Bậc càng cao càng khó.', 'Three steps, one Grumpy each. Higher is harder.'],
        ['Đường duy nhất là cái hầm sát mặt đất.', 'The only way through is the tunnel near the ground.'],
        ['Tường cao nhất từ trước tới giờ. Kéo hết cỡ nhé!', 'The tallest wall yet. Pull all the way back!'],
        ['Hết chương rồi — dùng cả bom lẫn sấm sét nhé.', 'End of the world - use the bomb and the thunder ball.'],
        ['Tấm đệm xanh nảy rất mạnh — bắn xuống đó thử xem!', 'The green pad bounces hard - try firing straight at it!'],
        ['Nảy lên rồi mới qua được bức tường phía sau.', 'Bounce first, then you can clear the wall behind.'],
        ['Bập bênh quay quanh chốt giữa. Đập một đầu, đầu kia hất lên.', 'The see-saw turns on its middle pin. Hit one end, the other flies up.'],
        ['Cánh cửa quay tít — canh lúc nó nằm ngang mà lách qua.', 'The gate spins - slip past while it lies flat.'],
        ['Hai tấm đệm liền nhau, nảy được rất xa.', 'Two pads in a row send the ball a long way.'],
        ['Đập mạnh đầu này, hòn đá đầu kia bay lên phá nhà.', 'Smash this end and the stone on the far end flies up.'],
        ['Nảy lên trước, tới gần rồi mới chạm cho bom nổ.', 'Bounce up first, then tap to set the bomb off up close.'],
        ['Cầu treo lắc lư — làm nó nghiêng cho cả nhà trượt xuống.', 'The swinging bridge tips - lean it and everything slides off.'],
        ['Ba tấm đệm — thử xem bi nảy được mấy lần.', 'Three pads - see how many bounces you can get.'],
        ['Hai cánh quạt quay ngược nhau, canh khe mà chui.', 'Two blades spinning apart - find the gap.'],
        ['Nảy thật cao rồi rơi thẳng xuống nóc tháp.', 'Bounce high, then dive straight onto the roof.'],
        ['Đủ cả đệm nhún lẫn bập bênh — màn cuối chương!', 'Pads and a see-saw together - last one of the world!'],
        ['Bắn nổ quả bóng, ngôi nhà sẽ rơi xuống đất.', 'Pop the balloon and the hut falls to the ground.'],
        ['Hai quả bóng giữ một sàn — nổ một quả là nó nghiêng.', 'Two balloons hold one deck - pop one and it tilts.'],
        ['Một bé trên trời, một bé dưới đất.', 'One Grumpy in the sky, one on the ground.'],
        ['Tường đá chắn trước, bóng bay nấp sau lưng nó.', 'A rock wall in front, the balloon hides behind it.'],
        ['Nhà trên trời có tới hai tầng.', 'The sky hut has two floors.'],
        ['Một quả bom nổ giữa trời hạ được cả chùm bóng.', 'One bomb in mid-air takes down every balloon.'],
        ['Nảy từ tấm đệm lên tận chỗ bóng bay.', 'Bounce off the pad all the way up to the balloon.'],
        ['Ba quả bóng, ba ngôi nhà, và chỉ có bốn viên bi.', 'Three balloons, three huts, only four balls.'],
        ['Chạm giữa trời cho bi tách ba, quét một lượt cả hàng.', 'Tap in the air to split into three and sweep the whole row.'],
        ['Pháo đài bay bằng đá — nổ bóng cho nó rơi mới dễ.', 'A flying stone fort - popping the balloons is the easy way.'],
        ['Bi sấm sét bổ nhào từ trên xuống là hợp nhất.', 'The thunder ball diving from above suits this one.'],
        ['Màn cuối của cả trò chơi. Chúc bé bắn thật chuẩn!', 'The very last level. Good luck!'],

        /* ---------- Panda Run (panda-run) ---------- */
        ['Panda Giải Cứu Bạn', 'Panda Run'],
        ['Chú panda dũng cảm lên đường giải cứu các bạn động vật!',
            'A brave little panda is off to free his animal friends!'],
        ['Chạm để nhảy', 'Tap to jump'],
        ['Chạm chỗ nào cũng được. Giữ tay lâu hơn thì nhảy xa hơn.',
            'Tap anywhere. Hold your finger down to jump further.'],
        ['Vuốt xuống để nằm', 'Swipe down to slide'],
        ['Vuốt xuống để chui qua khúc gỗ. Giữ nguyên tay thì nằm mãi.',
            'Swipe down to duck under the logs. Keep your finger down to stay low.'],
        ['Giải cứu các bạn', 'Free the animals'],
        ['Mở được chuồng nào là bạn ấy chạy theo sau lưng bé.',
            'Open a cage and that friend runs behind you.'],
        ['Đâm phải chướng ngại thì một bạn chạy mất — lượt chơi vẫn tiếp tục. Chỉ khi sau lưng không còn ai thì mới dừng.',
            'Bump into something and one friend runs off — the run keeps going. You only stop when nobody is left behind you.'],
        ['CHẠY NÀO!', 'RUN!'],
        ['CHẠY LẠI', 'RUN AGAIN'],
        ['Lượt mới', 'New run'],
        ['Bắt đầu lượt mới', 'Start a new run'],
        ['Tạm Dừng', 'Pause'],
        /* "Resume" đã có sẵn ở mục dùng chung (→ "Chơi Tiếp"), khai lại ở đây
         * chỉ tổ thừa: bảng tra giữ dòng đầu tiên trùng khoá. */
        ['NGHỈ MỘT CHÚT', 'TAKE A BREAK'],
        ['Các bạn nhỏ đứng đợi bé ngay đây nhé.', 'Your friends will wait right here.'],
        ['CHẠY TIẾP NÀO', 'KEEP RUNNING'],
        ['Số bạn', 'Friends'],
        ['CÁC BẠN CHẠY MẤT HẾT RỒI!', 'EVERYONE GOT AWAY!'],
        ['KỶ LỤC MỚI!', 'NEW BEST RUN!'],
        ['Xa nhất', 'Best run'],
        ['Cứu nhiều nhất', 'Most friends'],
        ['Quãng đường', 'Distance'],
        ['Số bạn đã cứu', 'Friends rescued'],
        ['Xu Vàng', 'Coins'],
        ['Nhặt {0} xu', 'Collect {0} coins'],
        ['Mét', 'Metres'],
        /* nhiệm vụ mỗi lượt — {0} là con số game tự điền */
        ['Cứu {0} bạn', 'Rescue {0} friends'],
        ['Chạy {0} m', 'Run {0} m'],
        ['Đạt chuỗi {0}', 'Reach a {0} combo'],
        /* bốn vùng cảnh */
        ['Rừng Xanh', 'Green Forest'],
        ['Sa Mạc', 'Desert'],
        ['Xứ Băng Giá', 'Frozen Land'],
        ['Thành Phố Lớn', 'Big City'],
        ['Xứ Dung Nham', 'Lava Land'],
        ['Lâu Đài Cổ Tích', 'Fairy Castle'],
        /* chữ bật ra giữa sân */
        ['CỨU ĐƯỢC RỒI!', 'RESCUED!'],
        ['MẤT MỘT BẠN', '-1 FRIEND'],
        ['ĐỠ ĐƯỢC!', 'SAVED!'],
        ['KHIÊN!', 'SHIELD!'],
        ['NAM CHÂM!', 'MAGNET!'],
        ['BAY LÊN!', 'BLAST OFF!'],
        ['XONG NHIỆM VỤ!', 'MISSION!'],
        ['ĐỈNH!', 'NICE!'],

        /* ---------- Bubble Pop (bubble-pop) ---------- */
        ['Bắn Bóng Nổ', 'Bubble Pop'],
        ['Ngắm, nảy tường, nổ sạch cả bàn', 'Aim, bounce off the walls, pop them all'],
        ['Ngắm rồi bắn', 'Aim and shoot'],
        ['Kéo để ngắm, thả tay là quả bóng bay đi.', 'Drag to aim, let go to fire the bubble.'],
        ['Ghép ba quả', 'Match three'],
        ['Ba quả cùng màu trở lên là nổ ngay.', 'Three or more of one colour pop right away.'],
        ['Cắt cho rơi', 'Cut them loose'],
        ['Quả nào mất chỗ bám là rơi xuống hết.', 'Bubbles with nothing holding them fall down.'],
        ['Băng', 'Ice'],
        ['Có quả nổ ngay cạnh là băng nứt', 'Cracks when a bubble pops next to it'],
        ['Đá Tảng', 'Stone'],
        ['Không nổ được, chỉ rơi thôi', 'Never pops, only falls'],
        ['Ngôi Sao', 'Star'],
        ['Làm cho nó rơi là cứu được', 'Free it by making it drop'],
        ['Phép Thuật', 'Power'],
        ['Đầy thanh thì đổi được bom hoặc cầu vồng', 'Fill the bar for a bomb or a rainbow'],
        ['Quả bóng phép', 'Power bubble'],
        ['Thưởng bóng dư', 'Shots bonus'],
        ['THỬ LẠI NHÉ!', 'TRY AGAIN!'],
        ['Hết bóng rồi! Thử nổ cụm to hơn xem.', 'Out of bubbles! Try popping bigger groups.'],
        ['Bóng chạm vạch đỏ mất rồi! Lần sau dọn nhanh hơn nhé.',
            'The bubbles reached the red line! Clear them faster next time.'],
        ['Bé nổ sạch từng quả bóng. Ngắm quá giỏi!', 'You popped every single bubble. What an aim!'],
        /* thanh thông tin */
        ['Bóng còn lại', 'Bubbles left'],
        ['Sao cần cứu', 'Stars to free'],
        ['Còn phải nổ', 'Colour left'],
        ['Băng còn lại', 'Ice left'],
        ['Lượt bắn', 'Shots left'],
        ['TUYỆT!', 'GREAT!'],
        ['SIÊU QUÁ!', 'AMAZING!'],
        /* bốn chương */
        ['Bãi Biển', 'Bubble Beach'],
        ['Hang Băng', 'Frozen Cave'],
        ['Rừng Vui', 'Jungle Party'],
        ['Vũ Trụ Bong Bóng', 'Space Bubbles'],
        /* tên và mách nước của 24 màn */
        ['Quả Đầu Tiên', 'First Pop'],
        ['Ba quả cùng màu là nổ!', 'Three bubbles of the same colour pop!'],
        ['Dải Màu', 'Colour Bands'],
        ['Ngắm vào dải cùng một màu.', 'Aim at a band of the same colour.'],
        ['Bắn nảy vào tường bên để với tới tháp xa.', 'Bounce off the side walls to reach the far tower.'],
        ['Cây Cầu', 'The Bridge'],
        ['Phá một cột là cả cây cầu rơi theo.', 'Knock out a pillar and the whole bridge falls.'],
        ['Trái Tim Lớn', 'Big Heart'],
        ['Dọn khúc giữa trước, hai bên tự rơi.', 'Clear the middle first, the sides drop by themselves.'],
        ['Quả Bóng Biển', 'Beach Ball'],
        ['Quả bóng bốn màu. Nổ đủ 18 quả xanh dương nhé.', 'A big ball of four colours. Pop 18 blue ones.'],
        ['Băng Đầu Tiên', 'First Ice'],
        ['Phải có quả nổ ngay cạnh thì băng mới nứt.', 'Ice cracks when a bubble pops right next to it.'],
        ['Tường Băng', 'Ice Wall'],
        ['Nổ các hàng thường để làm tan hàng băng.', 'Pop the free rows to melt the frozen ones.'],
        ['Đá không bao giờ nổ. Lách đạn qua khe giữa chúng.', 'Stone never pops. Squeeze your shots between them.'],
        ['Mặt Cười Đóng Băng', 'Frozen Smile'],
        ['Làm tan hết băng trên khuôn mặt này.', 'Melt every piece of ice on this face.'],
        ['Nhũ Băng', 'Icicles'],
        ['Cột băng dài mảnh — trúng một phát là rụng cả cột.',
            'Long thin spikes - one good hit drops a whole one.'],
        ['Pháo Đài Tuyết', 'Snow Fortress'],
        ['Cả hang băng một lượt. Cứ từ từ thôi.', 'The whole cave at once. Take your time.'],
        ['Ngôi Sao Bị Nhốt', 'Caged Star'],
        ['Phá chỗ giữ ngôi sao là nó rơi ra ngay.', 'Break what holds the star and it falls free.'],
        ['Ba Ngôi Sao', 'Three Stars'],
        ['Sao phải rơi hẳn xuống mới được tính.', 'A star only counts once it drops all the way down.'],
        ['Con Bướm', 'Butterfly'],
        ['Hai cánh, ba ngôi sao ở giữa. Dọn từng cánh một.', 'Two wings and three stars down the middle.'],
        ['Cây Thông Cao', 'Tall Tree'],
        ['Hai ngôi sao nằm trong thân cây, ngay dưới đáy.', 'Two stars are hidden down in the trunk.'],
        ['Thang Sao', 'Star Ladder'],
        ['Bốn ngôi sao, mỗi bên thang hai quả.', 'Four stars, one on each side of the ladder.'],
        ['Vua Rừng Xanh', 'Jungle King'],
        ['Đá, băng và sao đủ cả. Chúc bé may mắn!', 'Stone, ice and stars all in one. Good luck!'],
        ['Phóng Tên Lửa', 'Lift Off'],
        ['Coi chừng — cứ vài phát là cả bàn tụt xuống!', 'Watch out - the sky pushes down every few shots!'],
        ['Mưa Thiên Thạch', 'Meteor Rain'],
        ['Nhiều cụm nhỏ rải rác. Dọn nhanh lên nhé.', 'Small clumps everywhere. Pick them off fast.'],
        ['Người Ngoài Hành Tinh', 'Little Alien'],
        ['Hai mắt băng và một cái ăng ten bằng đá.', 'Two icy eyes and a stone antenna.'],
        ['Hành Tinh Có Vành', 'Ringed Planet'],
        ['Vành đá ở lại. Dọn sạch mọi thứ quanh nó.', 'The stone ring stays. Clear everything around it.'],
        ['Hố Đen', 'Black Hole'],
        ['Bắn nảy vòng qua đám đá ở giữa.', 'Bounce your shots around the stones in the middle.'],
        ['Trùm Thiên Hà', 'Galaxy Boss'],
        ['Màn cuối. Dùng hết mọi mẹo bé đã học được.',
            'The last one. Everything you have learned, all at once.'],

        /* ---------- Magic Coloring (coloring-game) ----------
         * Tên tranh nằm trong art.js và được game tự đặt theo đúng ngôn ngữ, nên
         * ở đây chỉ có phần vỏ trang. */
        /* Tên game chỉ khai báo một bản viết hoa chữ đầu. Bảng tra khớp không
         * phân biệt hoa thường, giữ dòng đầu tiên trùng khoá và applyCase chép
         * lại kiểu chữ của bản gốc — nên thêm một dòng VIẾT HOA HẾT không giúp
         * gì cho tiêu đề trong trang game (nó vốn đã tự hoa theo bản gốc), mà
         * còn đè lên dòng này và bắt ô game ngoài trang chủ phải hét theo trong
         * khi mấy ô bên cạnh đều viết hoa chữ đầu. */
        ['Tô Màu Thần Kỳ', 'Magic Coloring'],
        ['Chạm để tô, cho bé 3-6 tuổi', 'Tap to colour, ages 3-6'],
        ['Bảng Màu', 'Colours'],
        ['Hình Dán', 'Stickers'],
        ['Đổi Tranh', 'Pictures'],
        ['Hoàn Tác', 'Undo'],
        ['Tô Giúp Bé', 'Surprise'],
        ['Lưu Tranh', 'Save'],
        /* Không dùng 'Start Over' — english-game đã lấy chuỗi đó cho 'Học Lại' ở
           phần dùng chung phía trên, và cặp nào đứng trước thì thắng. */
        ['Tô Lại Từ Đầu', 'Start Again'],
        ['Chọn một bức tranh', 'Pick a picture'],
        ['Xong rồi! Đẹp quá!', 'All done! Beautiful!'],
        ['Tranh Tiếp Theo', 'Next Picture'],
        ['Tô Tiếp', 'Keep Colouring'],
        ['Tô màu thế nào', 'How to colour'],
        ['Chạm vào một màu ở phía dưới.', 'Tap a colour at the bottom.'],
        ['Chạm vào phần nào của tranh là phần đó được tô.', 'Tap any part of the picture to fill it.'],
        ['Chạm lại lần nữa bằng màu khác là đổi được màu.', 'Tap it again with another colour to change it.'],
        ['Ở đây không có gì sai được cả — không đếm giờ, không tính điểm, không thua bao giờ. Mỗi bức tranh tự lưu lại nên lúc nào bé cũng có thể quay lại tô tiếp.',
            'Nothing can go wrong here - there is no timer, no score and no way to lose. Every picture is saved by itself, so your little one can come back to it later.'],
        ['Âm thanh bật hay tắt', 'Sound on or off'],
        ['Hướng dẫn chơi', 'How to play'],
        ['Chọn bức tranh khác', 'Choose another picture'],
        ['Bỏ màu vừa tô', 'Undo the last colour'],
        ['Dán hình lấp lánh lên tranh', 'Stick shiny stickers on the picture'],
        ['Để cô tiên tô giúp bé', 'Let the fairy colour it for you'],
        ['Lưu tranh về máy', 'Save the picture to your device'],
        ['Tô lại bức tranh này từ đầu', 'Start this picture again'],
        ['Bức tranh đang tô', 'Colouring picture'],
        /* Tên các rổ hình dán — game tự đặt đúng ngôn ngữ, để đây cho phần
           title/aria-label khỏi lệch nếu engine có quét tới. */
        ['Tim và sao', 'Hearts and stars'],
        ['Hoa và lá', 'Flowers and leaves'],
        ['Con vật', 'Animals'],
        ['Đồ ngọt', 'Sweet things'],
        ['Công chúa', 'Princess'],
        ['Trời và mây', 'Sky and clouds'],
        ['Tô lại bức tranh này từ đầu nhé?', 'Start this picture again?'],
        ['Toàn bộ màu và hình dán trên bức tranh này sẽ bay hết, tranh trở lại thành nét vẽ trắng như lúc đầu.',
            'All the colours and stickers on this picture will come off, and it goes back to being an empty outline.'],
        ['Không, Giữ Lại', 'No, Keep It'],
        ['Đúng Rồi, Xoá Đi', 'Yes, Clear It'],
        ['Thu nhỏ lại', 'Make it smaller'],
        ['Phóng to lên', 'Make it bigger'],
        ['Bỏ hình dán này ra', 'Take it off'],
        ['Xong', 'Done'],
        ['Bật hình dán lên rồi kéo hình dán để chuyển chỗ, hoặc chạm vào hình dán để đổi cỡ hay bỏ ra.',
            'With stickers on, drag a sticker to move it, or tap it to resize or take it off.'],

        /* ---------- Tic Tac Toe (tictactoe) ---------- */
        /* Chỉ một bản viết hoa chữ đầu — xem chú thích ở mục Magic Coloring. */
        ['Cờ Ca-rô', 'Tic Tac Toe'],
        ['Chơi cờ ca-rô cổ điển và đấu với máy tính siêu thông minh.',
            'Play classic Tic Tac Toe and challenge our super-smart AI.'],

        /* ---------- Cờ Tướng (xiangqi) ---------- */
        ['Hai Bé Một Máy', 'Two Players, One Screen'],
        ['ĐỎ THẮNG!', 'RED WINS!'],
        ['ĐEN THẮNG!', 'BLACK WINS!'],
        ['Đỏ', 'Red'],
        ['Đen', 'Black'],
        ['Xoay bàn cờ sau mỗi nước đi', 'Turn the board around after every move'],
        ['Để tắt khi hai bé cùng ngồi trước một màn hình. Bật lên khi hai bé chuyền tay nhau chiếc điện thoại, để bên đến lượt luôn nhìn thấy phe mình ở phía dưới.',
            'Leave it off when you both sit in front of one screen. Turn it on when you pass a phone back and forth, so the player to move always looks at their own side.'],
        /* Chỉ một bản viết hoa chữ đầu — xem chú thích ở mục Magic Coloring. */
        ['Cờ Tướng', 'Xiangqi'],
        ['Cờ Tướng Online', 'Xiangqi Online'],
        ['Tạo phòng, gửi mã cho bạn, đánh ngay. Không cần đăng ký.',
            'Create a room, send the code to a friend, start playing. No sign-up.'],
        ['Tên của bạn', 'Your name'],
        ['Nhập tên...', 'Enter your name...'],
        ['Thời gian mỗi bên', 'Time per player'],
        ['{0} phút', '{0} minutes'],
        ['Tạo Phòng', 'Create Room'],
        ['Vào Phòng', 'Join Room'],
        ['Đánh Với Máy', 'Play vs AI'],
        ['MÃ PHÒNG', 'ROOM CODE'],
        ['Vào', 'Join'],
        ['Dễ', 'Easy'], ['Vừa', 'Medium'], ['Khó', 'Hard'],
        ['Bắt Đầu', 'Start'],
        ['PHÒNG CHỜ', 'WAITING ROOM'],
        ['Gửi mã này cho bạn của bạn để cùng vào đánh', 'Send this code to your friend so they can join'],
        ['Sao Chép', 'Copy'], ['Chia Sẻ', 'Share'],
        ['Bật / tắt âm thanh', 'Turn sound on / off'],
        ['Về màn hình chọn', 'Back to the menu'],
        ['Về màn hình chính', 'Back to the main screen'],
        ['Bơi nhanh', 'Swim fast'],
        ['Bé 1 bơi bằng', 'Kid 1 swims with'],
        ['để lướt nhanh.', 'to dash.'],
        ['Tổng điểm:', 'Total score:'],
        ['Cùng xem ai gom được nhiều kho báu nhất nào!', 'Let us see who collects the most treasure!'],
        ['Khoe thành tích', 'Show it off'],
        ['Đã sao chép!', 'Copied!'],
        ['Không sao chép được', 'Copy failed'],
        ['Cần đăng trò chơi lên mạng mới chia sẻ Facebook được',
            'Facebook sharing needs the game hosted online'],
        ['ĐỎ · đi trước', 'RED · moves first'], ['ĐEN', 'BLACK'],
        ['Đang chờ...', 'Waiting...'],
        ['Đang chờ người thứ hai vào phòng...', 'Waiting for a second player...'],
        ['Rời Phòng', 'Leave Room'],
        ['Xin Thua', 'Resign'], ['Thoát', 'Exit'],
        ['Màn Hình Chính', 'Main Menu'],
        ['Đánh Ván Nữa', 'Play Again'],
        ['Bạn chắc chắn muốn xin thua?', 'Are you sure you want to resign?'],
        ['Đang chờ đối thủ đồng ý...', 'Waiting for your opponent...'],
        ['Đối thủ muốn đánh ván nữa!', 'Your opponent wants a rematch!'],
        ['BẠN THẮNG!', 'YOU WIN!'], ['BẠN THUA', 'YOU LOSE'], ['HOÀ CỜ', 'DRAW'],
        ['HẾT VÁN', 'GAME OVER'],
        ['Chiếu tướng!', 'Check!'],
        ['Chiếu bí!', 'Checkmate!'],
        ['Hết nước đi!', 'No legal moves left!'],
        ['Hết giờ!', 'Out of time!'],
        ['Xin thua.', 'Resigned.'],
        ['Đối thủ mất kết nối.', 'Your opponent disconnected.'],
        ['Đối thủ đã rời phòng.', 'Your opponent left the room.'],
        ['Chiếu mãi không được phép.', 'Perpetual check is not allowed.'],
        ['Lặp nước ba lần — hoà.', 'Threefold repetition — draw.'],
        ['Sáu mươi nước không ăn quân — hoà.', 'Sixty moves without a capture — draw.'],
        ['Đã sao chép mã phòng!', 'Room code copied!'],
        ['Vào đánh cờ tướng với mình nhé! Mã phòng: ', 'Come play Xiangqi with me! Room code: '],
        ['Đã chép lời mời, gửi cho bạn nhé!', 'Invite copied — send it to your friend!'],
        ['Mã phòng gồm 6 ký tự.', 'A room code has 6 characters.'],
        ['Đang tạo phòng...', 'Creating room...'],
        ['Đang vào phòng...', 'Joining room...'],
        ['Đang kết nối lại...', 'Reconnecting...'],
        ['Đang tìm lại ván đang chơi...', 'Looking for your game...'],
        ['Không tìm thấy phòng này. Kiểm tra lại mã nhé!', 'Room not found. Check the code!'],
        ['Phòng đã đủ hai người rồi!', 'That room is already full!'],
        ['Phòng đang chờ bạn cũ kết nối lại. Đợi một chút nhé!', 'That room is holding a seat for a player who dropped. Try again shortly!'],
        ['Chưa tới lượt bạn!', 'Not your turn!'],
        ['Nước đi không hợp lệ.', 'Illegal move.'],
        ['Bắt đầu!', 'Go!'],
        ['bạn', 'you'],
        ['Máy', 'AI'],

        /* ---------- Aqua Dash (aqua-dash) ----------
           Nhiều chuỗi dùng chung với Ocean Party (tên vùng biển, cá cưỡi, bảo
           bối, sự kiện) nên chỉ liệt kê phần riêng của game đua. */
        ['CUỘC ĐUA ĐÁY BIỂN', 'THE GREAT SEA RACE'],
        ['Màn hình tự trôi về phía trước. Bơi theo cho kịp, gom kho báu — ai tụt lại phía sau là bị loại!',
            'The screen keeps scrolling forward. Swim to keep up, grab treasure — fall behind and you are out!'],
        ['MẤY BÉ CÙNG ĐUA?', 'HOW MANY RACERS?'],
        ['CHỌN BỘ ĐỒ LẶN CHO BÉ 1', 'PICK KID 1\'S WETSUIT'],
        ['ĐỘ DÀI CUỘC ĐUA', 'RACE LENGTH'],
        ['{0} phút', '{0} minutes'],
        ['XUẤT PHÁT!', 'GO!'],
        ['BƠI!', 'SWIM!'],
        ['VỀ ĐÍCH!', 'FINISHED!'],
        ['Luật Đua', 'Race Rules'],
        ['BIỂN BĂNG GIÁ', 'FROZEN OCEAN'],
        ['Tốc độ x{0}', 'Speed x{0}'],
        ['Bị loại', 'Knocked out'],
        ['Sắp bị bỏ lại!', 'Falling behind!'],
        ['💨 {0} BỊ TỤT LẠI PHÍA SAU!', '💨 {0} FELL BEHIND!'],
        ['BỊ LOẠI!', 'KNOCKED OUT!'],
        ['Bé bơi được {0}m và gom {1} điểm!', 'You swam {0}m and collected {1} points!'],
        ['🏁 Bơi xa nhất: {0} ({1}m)', '🏁 Longest swim: {0} ({1}m)'],
        ['{0}m · 🧰 {1} rương · 💎 {2} đá quý · 🔥 chuỗi {3}',
            '{0}m · 🧰 {1} chests · 💎 {2} gems · 🔥 combo {3}'],
        ['{0}m · 🧰 {1} rương · 💎 {2} đá quý · 🔥 chuỗi {3} · bị loại',
            '{0}m · 🧰 {1} chests · 💎 {2} gems · 🔥 combo {3} · knocked out'],
        ['Đua Lại', 'Race Again'],
        ['Xanh Biển', 'Ocean Blue'], ['Đỏ Lửa', 'Fire Red'], ['Xanh Lá', 'Leaf Green'],
        ['Tím Mộng', 'Dreamy Purple'], ['Đen Bí Ẩn', 'Mystery Black'], ['Trắng Băng', 'Ice White'],
        ['💰 CƠN LŨ KHO BÁU!', '💰 TREASURE RUSH!'],
        ['🪙 MƯA VÀNG!', '🪙 GOLD RAIN!'],
        ['🪼 BÃO SỨA TRÀN TỚI!', '🪼 JELLYFISH STORM!'],
        ['🦈 ĐÀN CÁ MẬP LAO TỚI!', '🦈 SHARK FRENZY!'],
        ['⭐ Sao biển', '⭐ Starfish'],
        ['Màn hình tự trôi, bé phải bơi theo', 'The screen scrolls — keep swimming'],
        ['Tụt khỏi mép trái là bị loại', 'Fall off the left edge and you are out'],
        ['Hết giờ, ai nhiều điểm nhất thì thắng', 'When time is up, the highest score wins'],
        ['Bơi được càng xa càng nhiều điểm thưởng', 'The further you swim, the more bonus points'],
        ['Có 3 đường: trên, giữa, dưới — đường khó nhiều kho báu hơn',
            'Three routes: upper, middle, lower — the risky one hides more treasure'],
        ['Bé có thể huých nhau giành đường, nhưng không đánh nhau',
            'You can bump each other for the best line, but no fighting'],
        ['Mỗi mét bơi được', 'Every metre swum'],
        ['Cá mập luôn đuổi bé đang đứng chót', 'Sharks always chase whoever is in last place'],
        ['+15 GIÂY!', '+15 SECONDS!'],
        ['🐚 BỊ KẸP!', '🐚 CLAMPED!'],

        /* ---------- Ocean Party (ocean-game) ---------- */
        ['ĐẠI TIỆC ĐÁY BIỂN', 'OCEAN TREASURE PARTY'],
        ['Lặn xuống biển, gom ngọc trai và kho báu. Hết giờ, ai nhiều điểm nhất là vô địch!',
            'Dive in, grab pearls and treasure. When time runs out, the highest score wins!'],
        ['MẤY BÉ CÙNG CHƠI?', 'HOW MANY KIDS?'],
        ['1 BÉ', '1 KID'],
        ['KIỂU CHƠI', 'GAME MODE'],
        ['Tiệc Nhanh', 'Quick Party'],
        ['Giải Đấu', 'Tournament'],
        ['Thử Thách Hôm Nay', 'Daily Challenge'],
        ['Chơi một màn duy nhất', 'Play a single round'],
        ['Ba màn liên tiếp, cộng dồn điểm', 'Three rounds in a row, scores add up'],
        ['Mỗi ngày một màn giống nhau cho tất cả mọi người', 'The same stage for everyone, every day'],
        ['CHỌN VÙNG BIỂN', 'PICK YOUR SEA'],
        ['THỜI GIAN MỖI MÀN', 'ROUND LENGTH'],
        ['{0} giây', '{0} seconds'],
        ['LẶN THÔI!', 'DIVE IN!'],
        ['Cách Chơi', 'How To Play'],
        ['CÁCH CHƠI', 'HOW TO PLAY'],
        ['Bộ Sưu Tập', 'Collection'],
        ['BỘ SƯU TẬP', 'COLLECTION'],
        ['Chọn Lại', 'Change Setup'],
        ['Đổi Màn', 'Change Stage'],
        ['Màn Tiếp Theo', 'Next Round'],
        ['Hiểu Rồi!', 'Got It!'],

        // Vùng biển
        ['RẠN SAN HÔ', 'CORAL REEF'],
        ['RỪNG TẢO BIỂN', 'KELP FOREST'],
        ['TÀU CƯỚP BIỂN ĐẮM', 'SUNKEN PIRATE SHIP'],
        ['HANG PHA LÊ', 'CRYSTAL CAVE'],
        ['NÚI LỬA ĐÁY BIỂN', 'UNDERWATER VOLCANO'],
        ['VỰC THẲM', 'THE DEEP ABYSS'],
        ['ATLANTIS CỔ ĐẠI', 'ANCIENT ATLANTIS'],
        ['{0} — MÀN {1}/{2}', '{0} — ROUND {1}/{2}'],

        // HUD
        ['Thời Gian', 'Time Left'],
        ['Dẫn Đầu', 'Leader'],
        ['Nhặt thật nhiều kho báu!', 'Grab as much treasure as you can!'],
        ['Choáng!', 'Dizzy!'],
        ['Bơi chậm', 'Slowed'],
        ['Mù mực', 'Inked'],
        ['Bị kẹp!', 'Trapped!'],

        // Nhiệm vụ phụ
        ['Gom 3 viên đá quý 💎', 'Collect 3 rare gems 💎'],
        ['Mở 2 rương kho báu 🧰', 'Open 2 treasure chests 🧰'],
        ['Tìm 1 hang bí mật 🕳️', 'Find 1 hidden cave 🕳️'],
        ['Cưỡi 2 sinh vật biển 🐬', 'Ride 2 sea creatures 🐬'],
        ['Nhặt 25 viên ngọc trai 🫧', 'Collect 25 pearls 🫧'],
        ['🎯 {0} XONG NHIỆM VỤ! +{1}', '🎯 {0} FINISHED THE MISSION! +{1}'],

        // Sự kiện
        ['🐋 CÁ VOI KHỔNG LỒ BƠI QUA!', '🐋 A GIANT WHALE SWIMS BY!'],
        ['🪙 MƯA KHO BÁU!', '🪙 TREASURE RAIN!'],
        ['🫧 BONG BÓNG KHỔNG LỒ NÂNG CẢ NHÀ LÊN!', '🫧 A HUGE BUBBLE LIFTS EVERYONE UP!'],
        ['🔄 DÒNG NƯỚC ĐỔI CHIỀU!', '🔄 THE CURRENTS REVERSE!'],
        ['🌑 BIỂN TỐI SẦM LẠI!', '🌑 THE SEA GOES DARK!'],
        ['🐟 ĐÀN CÁ TRÀN QUA CHE HẾT TẦM NHÌN!', '🐟 A FISH SCHOOL BLOCKS YOUR VIEW!'],
        ['🦑 KRAKEN QUẬT VÒI KHẮP NƠI!', '🦑 THE KRAKEN IS SMASHING EVERYWHERE!'],
        ['🕳️ {0} TÌM RA HANG BÍ MẬT!', '🕳️ {0} FOUND A HIDDEN CAVE!'],
        ['🕳️ HANG BÍ MẬT! +{0}', '🕳️ HIDDEN CAVE! +{0}'],

        // Cưỡi cá & bảo bối
        ['Cá Heo', 'Dolphin'], ['Rùa Biển', 'Sea Turtle'], ['Cá Kiếm', 'Swordfish'],
        ['Bạch Tuộc', 'Octopus'], ['Cá Nóc', 'Puffer Fish'], ['Cá Đuối', 'Manta Ray'],
        ['Nhanh như tên lửa!', 'Fast as a rocket!'],
        ['Mai rùa chắn hết bẫy!', 'The shell blocks every hazard!'],
        ['Húc thủng tường san hô!', 'Smash right through coral walls!'],
        ['Bấm lướt để phun mực!', 'Press dash to squirt ink!'],
        ['Bấm lướt để hất bạn ra xa!', 'Press dash to blast rivals away!'],
        ['Lướt êm, dòng nước chịu thua!', 'Glide smooth — currents can\'t touch you!'],
        ['{0} tạm biệt!', '{0} says bye!'],
        ['{0} chạy mất!', '{0} swam away!'],
        ['Bong Bóng Tốc Độ', 'Speed Bubble'],
        ['Nam Châm Kho Báu', 'Treasure Magnet'],
        ['Khiên San Hô', 'Coral Shield'],
        ['Nhân Đôi Điểm', 'Double Score'],
        ['Ra-đa Kho Báu', 'Treasure Radar'],
        ['Giữ Chuỗi Lâu Hơn', 'Combo Booster'],
        ['Bong Bóng Đỡ Đòn', 'Guard Bubble'],
        ['Thêm 10 Giây', 'Plus 10 Seconds'],
        ['+10 GIÂY!', '+10 SECONDS!'],
        ['🐢 MAI RÙA CHẶN!', '🐢 SHELL BLOCKED IT!'],
        ['🛡️ KHIÊN ĐỠ!', '🛡️ SHIELD HELD!'],
        ['🎈 BỤP!', '🎈 POP!'],
        ['🐚 BỊ KẸP RỒI!', '🐚 CLAMPED!'],
        ['RƠI MẤT KHO BÁU!', 'DROPPED SOME TREASURE!'],
        ['RƯƠNG KHO BÁU!', 'TREASURE CHEST!'],
        ['MÙ MỰC!', 'INKED!'],
        ['VĂNG!', 'BLASTED!'],

        // Kết quả
        ['VÔ ĐỊCH ĐÁY BIỂN!', 'CHAMPION OF THE DEEP!'],
        ['{0} VÔ ĐỊCH!', '{0} WINS!'],
        ['HẾT GIỜ!', 'TIME IS UP!'],
        ['Cùng vỗ tay cho nhà vô địch đáy biển nào!', 'Give it up for the champion of the deep!'],
        ['Bé gom được {0} điểm kho báu!', 'You collected {0} treasure points!'],
        ['🧰 Săn kho báu giỏi nhất: {0}', '🧰 Best treasure hunter: {0}'],
        ['🔥 Chuỗi dài nhất: {0} ({1})', '🔥 Longest combo: {0} ({1})'],
        ['🐬 Nài cá cừ nhất: {0}', '🐬 Best sea rider: {0}'],
        ['🕳️ Nhà thám hiểm: {0}', '🕳️ Top explorer: {0}'],
        ['🛡️ Không dính bẫy nào: {0}', '🛡️ Never got hit: {0}'],
        ['🎁 Vừa mở khoá: {0}', '🎁 Just unlocked: {0}'],
        ['{0} rương · 💎 {1} đá quý · 🕳️ {2} hang · 🔥 chuỗi {3}',
            '{0} chests · 💎 {1} gems · 🕳️ {2} caves · 🔥 combo {3}'],

        // Bộ sưu tập
        ['Nhân Vật', 'Characters'],
        ['Mũ & Vệt Bơi', 'Hats & Trails'],
        ['Thành Tích', 'Achievements'],
        ['Tổng điểm đã gom: {0} · Vùng biển đã mở: {1}/7', 'Total score: {0} · Seas unlocked: {1}/7'],
        ['Đang dùng', 'In use'],
        ['Bấm để dùng', 'Tap to use'],
        ['1 điểm', '1 point'],
        ['{0} điểm', '{0} points'],
        ['Bé Lặn', 'Little Diver'], ['Tiên Cá', 'Mermaid'], ['Hải Cẩu', 'Seal'],
        ['Cánh Cụt', 'Penguin'], ['Bé Mực', 'Baby Squid'], ['Bé Mập', 'Baby Shark'],
        ['Bé Tuộc', 'Baby Octopus'], ['Tôm Hùm', 'Lobster'],
        ['Không Đội', 'No Hat'], ['Vương Miện', 'Crown'], ['Nón Rơm', 'Straw Hat'],
        ['Mũ Cướp Biển', 'Pirate Hat'], ['Hoa Biển', 'Sea Flower'], ['Nón Tiệc', 'Party Hat'],
        ['Bong Bóng', 'Bubbles'], ['Ngôi Sao', 'Stars'], ['Trái Tim', 'Hearts'],
        ['Lấp Lánh', 'Sparkles'], ['Cầu Vồng', 'Rainbow'], ['Lửa Biển', 'Sea Fire'],

        // Thành tích
        ['Chuyến Lặn Đầu Tiên', 'First Dive'], ['Chơi xong một màn', 'Finish one round'],
        ['Tay Gom Cừ Khôi', 'Combo Master'], ['Đạt chuỗi nhân x5', 'Reach a x5 combo'],
        ['Thợ Săn Rương', 'Chest Hunter'], ['Mở 3 rương trong một màn', 'Open 3 chests in one round'],
        ['Nhà Thám Hiểm', 'Explorer'], ['Tìm 2 hang bí mật trong một màn', 'Find 2 hidden caves in one round'],
        ['Kho Báu Nhỏ', 'Small Fortune'], ['Được 1500 điểm trong một màn', 'Score 1500 in one round'],
        ['Vua Đáy Biển', 'King Of The Deep'], ['Được 3000 điểm trong một màn', 'Score 3000 in one round'],
        ['Nài Cá Cừ', 'Sea Rider'], ['Cưỡi đủ 6 loài sinh vật', 'Ride all 6 sea creatures'],
        ['Không Một Vết Xước', 'Untouched'], ['Hết màn mà không dính bẫy nào', 'Finish a round without a single hit'],
        ['Chạy Thoát Cá Mập', 'Shark Dodger'], ['Bị cá mập đuổi 10 giây mà không bị đớp', 'Survive 10 seconds of shark chase'],
        ['Chăm Chỉ', 'Daily Diver'], ['Hoàn thành Thử Thách Hôm Nay', 'Finish the Daily Challenge'],
        ['Chạm Tới Atlantis', 'Reach Atlantis'], ['Mở khoá vùng biển cuối cùng', 'Unlock the final sea'],
        ['🏅 Thành tích mới: {0}', '🏅 New achievement: {0}'],

        // Bảng cách chơi
        ['Điều Khiển', 'Controls'],
        ['Ăn Điểm', 'Scoring'],
        ['Coi Chừng', 'Watch Out'],
        ['Cưỡi Cá & Bảo Bối', 'Rides & Power-Ups'],
        ['{0}: {1} · lướt {2}', '{0}: {1} · dash {2}'],
        ['Trên điện thoại: cần gạt bên trái, nút ⚡ bên phải', 'On phones: joystick on the left, ⚡ button on the right'],
        ['Ngọc trai', 'Pearl'], ['Đồng vàng', 'Gold coin'], ['Đá quý hiếm', 'Rare gem'],
        ['Rương kho báu', 'Treasure chest'], ['Tìm ra hang bí mật', 'Find a hidden cave'],
        ['Ăn liên tiếp không nghỉ được nhân điểm tới', 'Collect without stopping to multiply up to'],
        ['Sứa làm bé tê cứng', 'Jellyfish stun you'],
        ['Nhím biển & san hô độc làm mất điểm', 'Sea urchins & poison coral cost points'],
        ['Lươn điện, mìn biển, cua kẹp', 'Electric eels, sea mines, snapping crabs'],
        ['Mực phun mực che mắt', 'Squids ink your view'],
        ['Cá mập đuổi bé nào bơi nhanh nhất', 'Sharks chase the fastest swimmer'],
        ['Xoáy nước và dòng chảy cuốn bé đi', 'Whirlpools and currents drag you around'],
        ['Cá heo cực nhanh · 🐢 Rùa bất tử', 'Dolphins are lightning fast · 🐢 Turtles are hazard-proof'],
        ['Cá kiếm phá tường san hô', 'Swordfish smash coral walls'],
        ['Cá nóc hất văng đối thủ', 'Puffer fish blast rivals away'],
        ['Bong bóng tốc độ, khiên, nam châm', 'Speed bubbles, shields, magnets'],
        ['Ra-đa kho báu, x2 điểm, thêm giờ', 'Treasure radar, double score, extra time'],
        ['📅 Hôm nay bé đã chơi rồi: {0} điểm. Chơi lại vẫn được nhé!',
            '📅 You already played today: {0} points. Feel free to play again!'],

        /* ---------- Home page (index.html) & About ---------- */
        ['Kid Built Games', 'Kid Built Games'],
        ['100% MIỄN PHÍ', '100% FREE'],
        ['LÀM BẰNG TÌNH YÊU DÀNH CHO CÁC BÉ', 'BUILT WITH LOVE FOR KIDS'],
        ['Không tìm thấy game nào phù hợp!', 'No matching games found!'],
        ['Tìm game...', 'Search games...'],
        ['Xoá tìm kiếm', 'Clear search'],
        ['Đọc câu chuyện của chúng tớ!', 'Read our story!'],
        ['MỚI', 'NEW'],
        ['Xếp 3 viên ngọt ngào', 'Match-3 sweetness'],
        ['2-4 bé, chung một máy', '2-4 kids, one screen'],
        ['Bi-a 8 bi cho 2 bé', 'Two-player 8-ball'],
        ['Đại tiệc bóng đá mini', 'Mini football party'],
        ['{0} bé đang chơi', '{0} kids playing now'],
        ['KIBU Games - Game miễn phí 100%, làm bằng tình yêu dành cho các bé và gia đình.',
            'KIBU Games - 100% Free games built with love for kids and families.'],
        ['KIBU Games - Game miễn phí 100% do Bon & Tin làm bằng cả tình yêu dành cho các bé.',
            'KIBU Games - 100% Free games built by Bon & Tin with love for kids.'],
        ['Do Các Bé Làm, Cho Các Bé Chơi!', 'Built By Kids, For Kids!'],
        ['Gặp Bon & Tin - Hai Bộ Óc Đứng Sau KIBU Games!', 'Meet Bon & Tin - The Minds Behind KIBU Games!'],
        ['Chào mừng bạn đến với', 'Welcome to'],
        ['(Viết tắt của', '(Short for'],
        [')! Tất cả các game trên trang web này đều do', ')! All the games on this website are created by'],
        ['—hai bạn nhỏ mê sáng tạo, dùng trí tuệ nhân tạo để biến trí tưởng tượng thành hiện thực. Bởi vì còn ai hiểu các bạn nhỏ thích chơi gì hơn chính các bạn nhỏ?',
            '—two young kid creators who use artificial intelligence to bring their imagination to life. Because who understands what kids love to play better than kids themselves?'],
        ['Hai Bạn Nhỏ Sáng Tạo Chính', 'Our Lead Kid Creators'],
        ['Nghĩ ra những game hành động, những trận đấu thể thao và luật chơi hấp dẫn. Bon dùng AI để thiết kế phần vật lý, tốc độ và các thử thách thật ngầu!',
            'Envisions action-packed games, sports duels, and exciting gameplay rules. Bon uses AI to design cool physics, speed racing, and challenge mechanics!'],
        ['Mơ ra những chủ đề game đầy màu sắc, trò xếp hoa quả và ứng dụng học tiếng Anh có giọng đọc cùng phần thưởng vui nhộn!',
            'Dreams up colorful game themes, fruit matching puzzles, and interactive English learning apps with speech and fun rewards!'],
        ['Điều Gì Làm Nên KIBU Games', 'Why KIBU Games is Special'],
        ['Do Bé Làm, Cho Bé Chơi', 'By Kids, For Kids'],
        ['Bon & Tin thiết kế game từ chính góc nhìn của trẻ con—chăm chút từng luật chơi, màu sắc và biểu tượng sao cho thật vui!',
            "Bon & Tin design games directly from a kid's perspective—making sure every rule, color, and icon is maximum fun!"],
        ['Siêu Năng Lực AI', 'AI Superpower'],
        ['Bon & Tin coi AI là người bạn đồng hành sáng tạo, cùng nhau viết code, vẽ đồ hoạ và xây nên những trải nghiệm học tập tương tác.',
            'Bon & Tin harness AI as their creative partner to generate code, craft graphics, and build interactive learning experiences.'],
        ['Miễn Phí 100% & An Toàn', '100% Free & Safe'],
        ['Không thu phí, không quảng cáo độc hại. Chỉ có niềm vui và việc học trong lành cho các bé và gia đình ở khắp mọi nơi.',
            'No paywalls or harmful ads. Safe, pure entertainment and learning for kids and families everywhere.'],
        ['Sứ Mệnh Của Chúng Tớ', 'Our Mission'],
        ['Tại', 'At'],
        [', Bon & Tin muốn cho các bạn nhỏ trên khắp thế giới thấy rằng công nghệ và AI không chỉ để tiêu thụ—chúng còn là công cụ để tạo ra bất cứ điều gì bạn tưởng tượng!',
            ", Bon & Tin want to show kids around the world that technology and AI aren't just for consuming—they can be tools to create anything you can imagine!"],
        ['Dù là xếp hoa quả, đua siêu xe, học tiếng Anh hay so tài thể thao hai người, mọi game trên KIBU đều được làm bằng tình yêu thuần khiết dành cho các bé ở khắp mọi nơi.',
            "Whether it's matching fruits, racing sports cars, learning English, or playing 2-player sports duels, every game on KIBU is built with pure love for kids everywhere."],

        /* ---------- Soccer — Super Striker ---------- */
        ['Bóng Đá Mini', 'Mini Soccer'],
        ['Đội Đỏ', 'Red Team'],
        ['Đội Xanh', 'Blue Team'],
        ['Thời Gian', 'Time'],
        ['Thời Gian Trận Đấu', 'Match Duration'],
        ['Đội Hình & Phím Bấm', 'Lineup & Controls'],
        ['Vào Sân Thi Đấu', 'Kick Off Match'],
        ['Vào Sân!', 'Kick Off!'],
        ['Đội Đỏ Vô Địch!', 'Red Team Champion!'],
        ['Đội Xanh Vô Địch!', 'Blue Team Champion!'],
        ['{0} Vô Địch!', '{0} Champion!'],
        ['Một trận cầu quá hay!', 'What a match!'],
        ['2 BÉ · 1-1', '2 KIDS · 1-1'],
        ['3 BÉ · 2-1', '3 KIDS · 2-1'],
        ['4 BÉ · 2-2', '4 KIDS · 2-2'],
        ['Đối đầu tay đôi', 'Head-to-head duel'],
        ['Bé chơi một mình chạy nhanh và sút mạnh hơn ⭐', 'The solo kid runs faster and shoots harder ⭐'],
        ['Hai đội, tha hồ chuyền bóng', 'Two teams — pass all you like'],
        ['1 PHÚT 30', '1 MIN 30'],
        ['2 PHÚT 30', '2 MIN 30'],
        ['4 PHÚT', '4 MINS'],
        ['Đá nhanh', 'Quick match'],
        ['Vừa đủ', 'Just right'],
        ['Trận dài', 'Long match'],
        ['Thủ Môn', 'Goalie'],
        ['Khung Thành {0}', '{0} Goal'],
        ['Cột Dọc!', 'Off The Post!'],
        ['Bắt Gọn!', 'Caught It!'],
        ['Cứu Thua!', 'What A Save!'],
        ['Cướp Bóng!', 'Tackle!'],
        ['Phát Bóng!', 'Goal Kick!'],
        ['Vào Rồi!', 'Goal!'],
        ['Chuyền Xoáy!', 'Curved Pass!'],
        ['Sút Xoáy Mạnh!', 'Power Curve Shot!'],
        ['Siêu Sao', 'Superstar'],
        ['Thủ Môn Cản!', 'Keeper Saves!'],
        ['Sút Hụt!', 'Missed!'],
        ['Không Vào!', 'No Goal!'],
        ['Đấu Súng!', 'Sudden Death!'],
        ['Đá Luân Lưu', 'Penalty Shootout'],
        ['{0} Ghi Bàn!', '{0} Scores!'],
        ['{0} Thắng Luân Lưu!', '{0} Wins The Shootout!'],
        ['Giữ phím {0} để lấy lực', 'Hold {0} to charge'],
        ['Thả ra để sút!', 'Release to shoot!'],
        ['Hoà {0} - {1} sau thời gian thi đấu, {2} thắng', 'Level at {0} - {1} after full time — {2} win'],
        ['{0} - {1} trên chấm phạt đền. Chúc mừng', '{0} - {1} on penalties. Congratulations'],
        ['Tỉ số {0} - {1}. Hai đội ngang tài ngang sức, đá lại một trận nữa nhé!',
            'It ends {0} - {1}. Evenly matched — time for a rematch!'],
        ['Thắng {0} - {1}. Chúc mừng', 'Winning {0} - {1}. Congratulations'],
        ['bàn thắng', 'goals'],
        ['Sút', 'Shots'],
        ['Chuyền', 'Passes'],
        ['Cướp bóng', 'Tackles'],
        ['Sút xoáy', 'Curve shots'],
        ['chưa kịp phản xạ', 'no time to react'],
        ['ai gần bóng hơn', 'whoever is closer to the ball'],
        ['dính', 'sticky'],
        ['Bấm nhanh = <b>CHUYỀN</b> · Giữ rồi thả = <b>SÚT</b> · Phím thứ hai = <b>ĐÁ XOÁY</b> (bóng bay cong) · Chạy khi có bóng = <b>RÊ BÓNG</b>',
            'Tap = <b>PASS</b> · Hold and release = <b>SHOOT</b> · Second key = <b>CURVE</b> (the ball bends) · Run with the ball = <b>DRIBBLE</b>'],
        ['cùng đá trên một máy. Rê bóng qua người, chuyền cho đồng đội rồi tung cú sút qua',
            'play together on one device. Dribble past defenders, pass to a teammate, then fire a shot past the'],
        ['thủ môn', 'goalie'],
        ['vào lưới đối phương! Sân vẽ theo', 'into the net! The pitch follows'],
        ['luật futsal', 'futsal rules'],
        [': vòng cấm hình vòng cung, hai chấm phạt đền, khu thay người.',
            ': an arc-shaped penalty area, two penalty spots and substitution zones.'],

        /* ---------- Basketball — Basketball Duel ---------- */
        ['2 đến 4 bé chơi chung một máy!', '2 to 4 kids play together on one screen!'],
        ['90 giây', '90 seconds'],
        ['60 giây', '60 seconds'],
        ['Chơi tự do', 'Free play'],
        ['Kim chậm', 'Slow arrow'],
        ['Bình thường', 'Normal'],
        ['Nhanh, không hướng dẫn', 'Fast, no guide'],
        ['Rổ di chuyển!', 'Moving hoop!'],
        ['Kim tự quay', 'Auto-swing arrow'],
        ['Kéo như bắn ná', 'Drag slingshot'],
        ['Cảm ứng: Chạm phần sân của mình', 'Touch screen: Tap your own side'],
        ['🏀 Gần = 2 điểm', '🏀 Close = 2 pts'],
        ['☄️ Xa = 3 điểm', '☄️ Far = 3 pts'],
        ['✨ Sạch lưới = +1 điểm', '✨ Swish = +1 pt'],
        ['🔥 Combo = +1 điểm', '🔥 Combo = +1 pt'],
        ['Song Đấu Bóng Rổ', 'Basketball Duel', '>'],
        ['Thi 3 Điểm', '3-Point Contest'],
        ['Bắt Đầu Trận Đấu', 'Start The Match'],
        ['1 Điểm', '1 Point'],
        ['2 Điểm', '2 Points'],
        ['3 Điểm', '3 Points'],
        ['★ BÓNG VÀNG · 2 ĐIỂM', '★ GOLDEN BALL · 2 POINTS'],
        ['🔥 BỐC LỬA +1', '🔥 ON FIRE +1'],
        ['🔥 ĐANG NÓNG MÁY!', '🔥 HEATING UP!'],
        ['Trượt rồi!', 'Missed!'],
        ['nảy vào rổ', 'off the rim and in'],
        ['cột', 'the post'],
        ['Phím {0}', 'Key {0}'],
        ['🏆 CHIẾN THẮNG! 🏆', '🏆 VICTORY! 🏆'],
        ['😭 HU HU... THUA RỒI', '😭 BOO HOO... WE LOST'],
        ['Giữ phím để lấy lực — Thả đúng lúc để ném', 'Hold to charge — release at the right moment to shoot'],
        ['Giữ phím để lấy lực, thả đúng lúc để ném', 'hold to charge, release at the right moment to shoot'],
        ['Kéo lùi rồi thả như bắn ná (chạm phần sân của mình)', 'Drag back and release like a slingshot (tap your own half)'],
        ['{0} cùng được {1} điểm — ngang tài ngang sức!', '{0} both scored {1} — perfectly matched!'],
        ['Ghi {0} điểm (các bạn còn lại: {1}).', 'Scored {0} points (the others: {1}).'],
        ['Chuỗi ghi điểm dài nhất: {0} quả liên tiếp!', 'Longest scoring streak: {0} in a row!'],
        ['Vào rổ', 'Made'],
        ['Một trận đấu quá hay!', 'What a game!'],
        ['Sân rộng nhất, bóng to nhất', 'Widest court, biggest ball'],
        ['Ba sân cạnh nhau', 'Three courts side by side'],
        ['Bốn sân, đứng gần rổ hơn', 'Four courts, closer to the hoop'],
        ['90 giây · ai nhiều điểm hơn thì thắng', '90 seconds · most points wins'],
        ['60 giây · đi qua 5 vị trí, bóng vàng ăn đôi', '60 seconds · five spots, golden ball scores double'],
        ['Không tính giờ · ném thoải mái', 'No timer · shoot as long as you like'],
        ['Chạy nhanh, không có đường ngắm', 'Fast moving, no aiming guide'],
        ['Cả cái rổ trượt lên xuống liên tục!', 'The whole hoop slides up and down non-stop!'],
        ['2 ĐIỂM · đứng gần', '2 POINTS · close range'],
        ['3 ĐIỂM · ngoài vạch', '3 POINTS · behind the line'],
        ['SWISH +1 · không chạm vành', 'SWISH +1 · nothing but net'],
        ['🔥 3 quả liên tiếp = BỐC LỬA +1', '🔥 3 in a row = ON FIRE +1'],
        ['phần sân của mình', 'their own half'],
        ['cùng chơi trên một máy — mỗi bé một rổ riêng. Vành cao 3,05m và đường bay của bóng theo',
            'play on one device — each kid gets their own hoop. The rim sits at 3.05m and the ball flies with'],
        ['bóng và vành được phóng to như', 'the ball and rim are scaled up like an'],
        ['bộ rổ mini trong nhà', 'indoor mini hoop set'],
        ['cho dễ nhìn, vẫn giữ nguyên tỉ lệ bóng/vành của thi đấu chuyên nghiệp.',
            'so they are easy to see, while keeping the pro ball-to-rim ratio.'],

        /* ---------- Darts — Balloon Darts ---------- */
        ['1 đến 4 bé chơi chung một máy!', '1 to 4 kids play together on one screen!'],
        ['Săn Bóng Vàng', 'GOLDEN HUNT'],
        ['Gió thổi!', 'Windy!'],
        ['Phi Tiêu Bong Bóng', 'Balloon Darts', '>'],
        ['Săn Bóng Vàng', 'Golden Balloon Hunt'],
        ['Bắt Đầu Thi Tài', 'Start The Contest'],
        ['Bóng To', 'Big Balloon'],
        ['Bóng Vừa', 'Medium Balloon'],
        ['Bóng Nhỏ', 'Small Balloon'],
        ['Bóng Vàng', 'Golden Balloon'],
        ['Bóng Bom', 'Bomb Balloon'],
        ['Trượt', 'Miss'],
        ['bụp', 'pop'],
        ['Gió', 'Wind'],
        ['🔥 BỐC LỬA!', '🔥 ON FIRE!'],
        ['{0} — Mũi tên tự lắc, giữ phím lấy lực rồi thả để phi',
            '{0} — the arrow swings by itself; hold to charge, release to throw'],
        ['{0} — Kéo lùi trong gian hàng của mình rồi thả, như bắn ná',
            '{0} — drag back inside your own booth and release, like a slingshot'],
        ['Mũi tên tự lắc, giữ phím lấy lực rồi thả để phi',
            'the arrow swings by itself; hold to charge, release to throw'],
        ['Kéo lùi trong gian hàng của mình rồi thả, như bắn ná',
            'drag back inside your own booth and release, like a slingshot'],
        ['Cả nhà cùng được {0} điểm — thi lại một ván nữa nhé!',
            'Everyone finished on {0} points — time for another round!'],
        ['{0} điểm', '{0} points'],
        ['nổ 1 quả bóng', 'popped 1 balloon'],
        ['nổ {0} quả bóng', 'popped {0} balloons'],
        ['{0}/{1} mũi phi trúng', '{0}/{1} darts on target'],
        ['chuỗi {0} quả liên tiếp', 'a streak of {0} in a row'],
        ['{0} quả bóng vàng', '{0} golden balloons'],
        [' — tay phi tiêu cừ khôi của gian hàng!', ' — the sharpest dart thrower at the fair!'],
        ['mũi phi trúng', 'darts on target'],
        ['quả', 'in a row'],
        ['quả bóng nổ', 'balloons popped'],
        ['Bóng vàng:', 'Golden:'],
        ['Bom:', 'Bombs:', 'f'],
        ['Tay phi tiêu cừ khôi!', 'A brilliant dart thrower!'],
        ['Gian hàng rộng nhất, bóng to nhất', 'Widest booth, biggest balloons'],
        ['Ba gian cạnh nhau', 'Three booths side by side'],
        ['Bốn gian, ngắm phải chuẩn hơn', 'Four booths — aim has to be sharper'],
        ['90 giây · ai nổ được nhiều điểm hơn thì thắng', '90 seconds · the most points from pops wins'],
        ['60 giây · bóng nhỏ, bay nhanh, điểm nhân đôi', '60 seconds · small, fast balloons, double points'],
        ['Không tính giờ · phi thoải mái', 'No timer · throw as long as you like'],
        ['Chạy nhanh, không có đường bay dự đoán', 'Fast moving, no predicted flight path'],
        ['Gió giật liên tục thổi bay cả mũi tiêu!', 'Constant gusts blow the darts off course!'],
        ['🎈 BÓNG TO · 1 ĐIỂM', '🎈 BIG BALLOON · 1 POINT'],
        ['🎈 BÓNG NHỎ · 3 ĐIỂM', '🎈 SMALL BALLOON · 3 POINTS'],
        ['🥇 BÓNG VÀNG · 5 ĐIỂM', '🥇 GOLDEN BALLOON · 5 POINTS'],
        ['🔥 3 mũi trúng liên tiếp = BỐC LỬA +1', '🔥 3 hits in a row = ON FIRE +1'],
        ['💣 BÓNG BOM · TRỪ 3 ĐIỂM, đừng phi vào!', '💣 BOMB BALLOON · MINUS 3 POINTS — do not hit it!'],
        ['gian hàng của mình', 'their own booth'],
        ['bộ đồ chơi trong nhà', 'indoor toy set'],
        ['cùng chơi trên một máy — mỗi bé một gian hàng riêng. Bóng bay bay lên liên tục, bé',
            'play on one device — each kid gets their own booth. Balloons keep floating up, and kids'],
        ['ngắm rồi phi tiêu', 'aim and throw darts'],
        ['cho nổ thật nhiều. Mũi tiêu bay theo', 'to pop as many as they can. Each dart flies with'],
        [': có trọng lực kéo xuống, có sức cản không khí, và', ': gravity pulls it down, air resists it, and'],
        ['tự xoay mũi theo hướng bay', 'the tip turns to follow the flight path'],
        ['y như phi tiêu ngoài đời.', 'just like a real dart.'],

        /* Phi tiêu — chế độ một bé */
        ['Chơi một mình, phá kỷ lục của chính mình', 'Play solo and beat your own record'],
        ['THỬ TÀI', 'SOLO RUN'],
        ['90 giây · ghi càng nhiều điểm càng tốt', '90 seconds · score as many points as you can'],
        ['KỶ LỤC MỚI!', 'NEW RECORD!'],
        ['ĐƯỢC {0} ĐIỂM!', '{0} POINTS!'],
        ['kỷ lục cũ {0} điểm', 'previous best {0} points'],
        ['kỷ lục của bé: {0} điểm', 'your record: {0} points'],
        ['🎯 Mình vừa được {0} điểm ở Phi Tiêu Bong Bóng trên KIBU Games! Bạn phá được kỷ lục này không?',
            '🎯 I just scored {0} points on Balloon Darts at KIBU Games! Think you can beat that?'],

        ['Bấm nhanh = <b>CHUYỀN</b> · Giữ rồi thả = <b>SÚT</b> · Phím thứ hai = <b>ĐÁ XOÁY</b> (bóng bay cong) · Chạy khi có bóng = <b>RÊ BÓNG</b>',
            'Tap = <b>PASS</b> · Hold and release = <b>SHOOT</b> · Second key = <b>CURVE SHOT</b> (the ball bends) · Run with the ball = <b>DRIBBLE</b>'],

        /* Chuỗi trong game trước đây ghép nối từng mảnh nên chưa có cặp dịch */
        [' — MÀN {0}/{1}', ' — ROUND {0}/{1}'],
        ['🧰 {0} rương · 💎 {1} đá quý · 🕳️ {2} hang · 🔥 chuỗi {3}', '🧰 {0} chests · 💎 {1} gems · 🕳️ {2} caves · 🔥 combo {3}'],
        ['LẶN!', 'DIVE!'],
        ['🏁 {0}m · 🧰 {1} rương · 💎 {2} đá quý · 🔥 chuỗi {3}', '🏁 {0}m · 🧰 {1} chests · 💎 {2} gems · 🔥 combo {3}'],
        ['Cùng vỗ tay cho nhà vô địch nào!', 'Let us clap for the champion!'],
        ['🫧 BONG BÓNG NÂNG CẢ NHÀ LÊN!', '🫧 BUBBLES LIFT EVERYONE UP!'],
        ['Húc thủng san hô!', 'Smashed through the coral!'],
        ['Bấm lướt để hất bạn ra!', 'Tap dash to shove others away!'],
        ['Dòng nước chịu thua!', 'The current gives up!'],
        ['Thêm 15 Giây', '+15 Seconds'],
        ['BÓNG THẦN KỲ', 'MAGIC BALLOON'],
        ['BÓNG QUẬY', 'CRAZY BALLOON'],
        ['Hết phép chùm', 'Triple shot over'],
        ['💥 NỔ HẾT! +{0}', '💥 POPPED THEM ALL! +{0}'],
        ['💥 NỔ TUNG {0} QUẢ!', '💥 {0} BALLOONS BLOWN UP!'],
        ['✨ CHÙM 3 MŨI! +{0}', '✨ TRIPLE SHOT! +{0}'],
        ['✨ CHÙM 3 MŨI — 5 GIÂY!', '✨ TRIPLE SHOT — 5 SECONDS!'],
        ['Không kết nối được máy chủ.', 'Could not reach the server.'],
        ['Mất kết nối tới máy chủ.', 'Lost connection to the server.'],
        ['Người chơi', 'Player'],
        ['Không sao chép được, bạn tự chép nhé!', 'Could not copy — please copy it yourself!'],
        ['Bấm "Vào" để tham gia phòng {0}', 'Tap "Join" to enter room {0}'],
        ['BI TRƠN 1-7', 'SOLIDS 1-7'],
        ['BI SỌC 9-15', 'STRIPES 9-15'],
        ['Sứa', 'Jellyfish'],
        ['Nhím Biển', 'Sea Urchin'],
        ['San Hô Độc', 'Stinging Coral'],
        ['Rong Dính', 'Sticky Weed'],
        ['Lươn Điện', 'Electric Eel'],
        ['Cua Cáu Kỉnh', 'Grumpy Crab'],
        ['Đá Rơi', 'Falling Rock'],
        ['Mực Phun', 'Inky Squid'],
        ['Mìn Biển', 'Sea Mine'],
        ['Sò Khổng Lồ', 'Giant Clam'],
        ['Cá Mập', 'Shark'],

        /* ---------- Billiards — Pool Masters ---------- */
        ['Bi-a 8 Bi — Song Đấu', '8-Ball Pool — Duel'],
        ['Bắt Đầu Ván Đấu', 'Start The Frame'],
        ['Đường Ngắm:', 'Aim Line:'],
        ['Đường Ngắm: Bật', 'Aim Line: On'],
        ['Đường Ngắm: Tắt', 'Aim Line: Off'],
        ['Chưa chọn nhóm bi', 'No group assigned yet'],
        ['Lượt Của Bé 1', "Kid 1's Turn"],
        ['Lượt Của Bé 2', "Kid 2's Turn"],
        ['LƯỢT CỦA {0} BÉ {1}', "{0} KID {1}'S TURN"],
        ['Kéo lùi từ bi trắng rồi thả', 'Drag back from the cue ball and release'],
        ['Kéo đặt bi trắng vào chỗ đẹp', 'Drag the cue ball to a good spot'],
        ['Bi đang lăn...', 'Balls are rolling...'],
        ['Phá bi nào!', 'Time to break!'],
        ['Bi Trơn 1-7', 'Solids 1-7'],
        ['Bi Sọc 9-15', 'Stripes 9-15'],
        ['bi trơn 1-7', 'solids 1-7'],
        ['bi sọc 9-15', 'stripes 9-15'],
        ['bi số 8', 'the 8 ball'],
        ['🎱 ĐÁNH BI SỐ 8!', '🎱 SHOOT THE 8 BALL!'],
        ['Kết Thúc', 'Frame Over'],
        ['Bấm ĐẤU LẠI để chơi ván mới', 'Press PLAY AGAIN for a new frame'],
        ['Điểm Chạm Bi Cái', 'Cue Ball Contact Point'],
        ['Chạm vào bi cái để chọn — đánh xong tự về giữa', 'Tap the cue ball to pick a spot — it resets to centre after the shot'],
        ['Cú kết thúc hoàn hảo với bi số 8!', 'A perfect finish on the 8 ball!'],
        ['Bi trắng rơi lỗ cùng bi số 8 — thua ngay!', 'Cue ball potted with the 8 — instant loss!'],
        ['Đưa bi số 8 vào lỗ quá sớm — thua ngay!', 'Potted the 8 ball too early — instant loss!'],
        ['Bi trắng rơi lỗ!', 'Cue ball potted!'],
        ['Không chạm được bi nào!', 'No ball was hit!'],
        ['Phải chạm bi số 8 trước!', 'You must hit the 8 ball first!'],
        ['Chạm nhầm bi của đối thủ!', "Hit the opponent's ball first!"],
        ['{0} nhận {1}!', '{0} takes {1}!'],
        ['⚠️ {0} {1} được cầm bi trắng đặt tự do.', '⚠️ {0} {1} gets ball in hand.'],
        ['{0}✅ Vào lỗ đẹp — {1} đánh tiếp!', '{0}✅ Nice pot — {1} shoots again!'],
        ['{0}Đến lượt {1}', "{0}{1}'s turn"],
        ['Chưa ăn được bi — đến lượt {0} {1}', "Nothing potted — {0} {1}'s turn"],
        ['{0} {1} THẮNG!', '{0} {1} WINS!'],
        ['Cú đánh quyết định quá đẹp!', 'What a finishing shot!'],
        ['Hiện đường ngắm và bi ma giúp bé đánh chuẩn hơn', 'Show the aim line and ghost ball for more accurate shots'],
        ['Đánh GIỮA bi — bi lăn tự nhiên, chạm xong còn trôi theo quán tính',
            'CENTRE hit — natural roll, the cue keeps drifting after contact'],
        ['Đánh CAO — bi trắng chạy tiếp theo bi mục tiêu', 'TOP spin — the cue follows the object ball'],
        ['Đánh THẤP — bi trắng lùi ngược trở lại', 'BOTTOM spin — the cue draws back'],
        ['Xoáy TRÁI — bi trắng ăn băng rồi lệch sang trái', 'LEFT english — the cue kicks left off the cushion'],
        ['Xoáy PHẢI — bi trắng ăn băng rồi lệch sang phải', 'RIGHT english — the cue kicks right off the cushion'],
        ['CAO + xoáy TRÁI — chạy tiếp và bạt sang trái', 'TOP + LEFT — follows through and veers left'],
        ['CAO + xoáy PHẢI — chạy tiếp và bạt sang phải', 'TOP + RIGHT — follows through and veers right'],
        ['THẤP + xoáy TRÁI — lùi lại và bạt sang trái', 'BOTTOM + LEFT — draws back and veers left'],
        ['THẤP + xoáy PHẢI — lùi lại và bạt sang phải', 'BOTTOM + RIGHT — draws back and veers right'],
        ['đường chéo', 'diagonal'],
        ['bám', 'grip'],
        ['bi tập', 'practice ball'],
        ['lăn', 'roll'],
        ['sống', 'live'],
        ['băng ma', 'ghost cushion'],
        ['Hai bé thay phiên nhau đánh trên cùng một máy. Ai ăn hết nhóm bi của mình rồi đưa',
            'Two kids take turns on the same device. The first to clear their own group and pot'],
        ['vào lỗ trước sẽ thắng!', 'wins!'],
        ['Đánh trước — phá bi', 'Breaks first'],
        ['Đánh sau', 'Shoots second'],
        ['Kéo lùi', 'Drag back'],
        ['từ bi trắng (như bắn ná) để ngắm và lấy lực', 'from the cue ball (like a slingshot) to aim and charge'],
        ['Thả tay', 'Release'],
        ['để đánh — kéo càng xa, cú đánh càng mạnh', 'to shoot — the further you drag, the harder the hit'],
        ['Chạm vào', 'Tap'],
        ['bi cái to phía dưới bàn', 'the large cue ball below the table'],
        ['để chọn 1 trong', 'to pick one of'],
        ['9 điểm chạm', '9 contact points'],
        ['— đánh cao, thấp hay xoáy ngang', '— top, bottom or side spin'],
        ['Ăn được bi của mình thì', 'Pot one of your own balls and you'],
        ['được đánh tiếp', 'shoot again'],
        ['Phím', 'Keys'],
        ['chỉnh hướng thật chuẩn,', 'fine-tune the angle,'],
        ['để đánh', 'to shoot'],
        ['🎱 9 điểm chạm bi cái:', '🎱 The 9 cue ball contact points:'],
        ['Chạm vào bi cái to ở dưới bàn để chọn chỗ đầu cơ chạm vào bi trắng —',
            'Tap the large cue ball below the table to choose where the tip strikes the cue ball —'],
        ['đánh CAO', 'TOP spin'],
        ['bi trắng chạy tiếp theo bi mục tiêu,', 'sends the cue after the object ball,'],
        ['đánh THẤP', 'BOTTOM spin'],
        ['bi trắng lùi ngược lại,', 'draws the cue back,'],
        ['xoáy TRÁI/PHẢI', 'LEFT/RIGHT english'],
        ['bi trắng ăn băng rồi bạt sang bên đó. Đánh xong sẽ tự trở về giữa bi.',
            'kicks the cue off the cushion to that side. It resets to centre after each shot.'],
        ['🎯 Chọn nhóm bi:', '🎯 Choosing your group:'],
        ['Sau cú phá bi, ai ăn được bi nào trước thì nhận nhóm đó —', 'After the break, whoever pots first takes that group —'],
        ['🔁 Đánh tiếp:', '🔁 Shooting again:'],
        ['Ăn được bi của nhóm mình thì được đánh thêm lượt nữa.', 'Pot a ball from your own group and you get another turn.'],
        ['⚠️ Phạm lỗi:', '⚠️ Fouls:'],
        ['Bi trắng rơi lỗ, không chạm bi nào, hoặc chạm bi của đối thủ trước. Khi đó đối thủ được',
            "Potting the cue ball, hitting nothing, or hitting the opponent's ball first. Your opponent then gets"],
        ['cầm bi trắng đặt tự do', 'ball in hand'],
        ['🏆 Thắng:', '🏆 Winning:'],
        ['Ăn hết nhóm bi của mình rồi đưa', 'Clear your whole group, then pot'],
        ['vào lỗ.', 'in a pocket.'],
        ['Đưa bi số 8 vào lỗ khi chưa ăn hết nhóm của mình, hoặc bi trắng rơi lỗ cùng lúc với bi 8.',
            'Potting the 8 before clearing your group, or potting the cue ball together with the 8, loses the frame.'],

        /* ---------- Shooter — Bot Arena ---------- */
        ['Đặc Nhiệm Con Người', 'Human Special Forces'],
        ['CON NGƯỜI CẦM SÚNG 🧑‍✈️🔫 VS ROBOT 🤖', 'HUMAN GUNNER 🧑‍✈️🔫 VS ROBOTS 🤖'],
        ['Bé nhập vai', 'Play as a'],
        ['CON NGƯỜI CẦM SÚNG 🧑‍✈️🔫', 'HUMAN GUNNER 🧑‍✈️🔫'],
        ['dũng cảm tiêu diệt các binh đoàn', 'and bravely wipe out the legions of'],
        ['độc ác!', 'evil robots!'],
        ['Con Người Sinh Tồn', 'Human Survival'],
        ['Bé cầm súng tiêu diệt từng đợt Robot địch & Trùm Robot Khổng Lồ!',
            'Take on wave after wave of enemy robots and the giant robot boss!'],
        ['Con Người Đấu Đội', 'Human Team Battle'],
        ['Bé (Con Người) cùng đội Robot bảo vệ tiêu diệt Binh Đoàn Robot Đỏ!',
            'Team up with the guardian robots to destroy the Red Robot Legion!'],
        ['CHỌN TRANG BỊ & VŨ KHÍ CHO NHÂN VẬT:', 'CHOOSE YOUR GEAR & WEAPON:'],
        ['🛡️ Giáp Đặc Nhiệm (+Tốc)', '🛡️ Special Forces Armour (+Speed)'],
        ['🛡️ Giáp Thép Kevlar (+Máu)', '🛡️ Kevlar Steel Armour (+Health)'],
        ['🪖 Băng Rôn (+Sát Thương)', '🪖 Headband (+Damage)'],
        ['🪖 Mũ Thép (Chống Bẫy)', '🪖 Steel Helmet (Trap Proof)'],
        ['Độ Khó Đấu Trường:', 'Arena Difficulty:'],
        ['Dễ (Vui Vẻ)', 'Easy (Just Fun)'],
        ['Vừa (Thử Thách)', 'Medium (Challenge)'],
        ['Khó (Dũng Sĩ)', 'Hard (Hero)'],
        ['Cửa Hàng Nâng Cấp', 'Upgrade Shop'],
        ['Số xu hiện có:', 'Coins available:'],
        ['Máu Tối Đa', 'Max Health'],
        ['Tốc Độ Chạy', 'Move Speed'],
        ['Sát Thương Súng', 'Weapon Damage'],
        ['Cấp {0} (+{1} Máu)', 'Level {0} (+{1} Health)'],
        ['Cấp {0} (+{1}% Tốc)', 'Level {0} (+{1}% Speed)'],
        ['Cấp {0} (+{1}% ST)', 'Level {0} (+{1}% DMG)'],
        ['Xu thưởng kiếm được: +', 'Coins earned: +'],
        ['Bạn đã hạ gục toàn bộ các đợt Bot!', 'You took down every wave of bots!'],
        ['Bé đã xuất sắc đánh bại toàn bộ các đợt Bot!', 'You brilliantly defeated every wave of bots!'],
        ['Đừng nản lòng, hãy thử lại để bắn gục Bot nhé!', "Don't give up — try again and take those bots down!"],
        ['Bot Còn Lại:', 'Bots Left:'],
        ['Đợt {0}', 'Wave {0}'],
        ['Đợt 1', 'Wave 1'],
        ['Súng Ngắn', 'Pistol', 'x'],
        ['Súng Săn', 'Shotgun', 'x'],
        ['Súng Laser', 'Laser Gun', 'x'],
        ['Tên Lửa', 'Rocket Launcher', 'x'],
        ['Súng Băng', 'Freeze Gun', 'x'],
        ['Phun Lửa', 'Flamethrower', 'x'],
        ['Súng Sấm Sét', 'Lightning Gun', 'x'],
        ['Kiếm Laser', 'Laser Sword', 'x'],
        ['Tự Ngắm:', 'Auto Aim:'],
        ['Tự Ngắm: Bật', 'Auto Aim: On'],
        ['Tự Ngắm: Tắt', 'Auto Aim: Off'],
        ['🌀 LÒ XO BẮN SIÊU TỐC!', '🌀 SUPER SPRING LAUNCH!'],
        ['❌ HẾT ĐẠN! TỰ ĐỔI SÚNG NGẮN!', '❌ OUT OF AMMO! SWITCHING TO PISTOL!'],
        ['💣 BOM HẠT NHÂN DỌN SẠCH BẮN TOÀN BỘ BOT!', '💣 NUKE WIPES OUT EVERY BOT!'],
        ['🌊 ĐỢT {0}: CÓ THÙNG DẦU NỔ 🛢️ & LÒ XO NHẢY 🌀!', '🌊 WAVE {0}: EXPLOSIVE BARRELS 🛢️ & BOUNCE PADS 🌀!'],
        ['👑 CẢNH BÁO: TRÙM ROBOT KHỔNG LỒ XUẤT HIỆN!', '👑 WARNING: GIANT ROBOT BOSS INCOMING!'],
        ['🔫 ĐÃ ĐỔI SÚNG: {0}', '🔫 WEAPON SWITCHED: {0}'],
        ['🔫 ĐÃ TRANG BỊ & NẠP ĐẠN: {0}!', '🔫 EQUIPPED & LOADED: {0}!'],
        ['🛡️ ĐÃ BẬT KHIÊN NĂNG LƯỢNG!', '🛡️ ENERGY SHIELD ACTIVATED!'],
        ['❤️ HỒI MÁU CẤP TỐC!', '❤️ RAPID HEAL!'],
        ['⚡ TĂNG TỐC ĐỘ DI CHUYỂN!', '⚡ MOVEMENT SPEED UP!'],
        ['🔥 SIÊU SÁT THƯƠNG GẤP ĐÔI!', '🔥 DOUBLE DAMAGE BOOST!'],
        ['🎯 Đã BẬT Tự Động Ngắm Bắn', '🎯 Auto aim turned ON'],
        ['🎯 Đã TẮT Tự Động Ngắm Bắn', '🎯 Auto aim turned OFF'],
        ['🛡️ Đã trang bị {0}', '🛡️ Equipped {0}'],
        ['🎉 NÂNG CẤP THÀNH CÔNG!', '🎉 UPGRADE COMPLETE!'],
        ['❌ BẠN KHÔNG ĐỦ XU!', '❌ NOT ENOUGH COINS!'],
        ['Tự động ngắm bắn cho bé', 'Auto aim for kids'],
        ['Bấm phím 1 để chọn', 'Press 1 to select'],
        ['Bấm phím 2 để chọn', 'Press 2 to select'],
        ['Bấm phím 3 để chọn', 'Press 3 to select'],
        ['Bấm phím 4 để chọn', 'Press 4 to select'],

        /* ---------- Racer — Neon Racer ---------- */
        ['Đường Đua Siêu Tốc', 'Turbo Speedway'],
        ['Bình Nitro 🚀', 'Nitro Tank 🚀'],
        ['Quãng Đường', 'Distance'],
        ['Lái siêu xe né chướng ngại vật, ăn bình Nitro 🚀 phóng bứt tốc độ!',
            'Drive a supercar, dodge the obstacles and grab Nitro 🚀 for a burst of speed!'],
        ['Chọn Siêu Xe Của Bé:', 'Pick Your Supercar:'],
        ['Siêu Xe Đỏ', 'Red Supercar'],
        ['Tốc độ cao', 'High top speed'],
        ['Húc văng vệt dầu', 'Smashes through oil slicks'],
        ['Hồi Nitro siêu nhanh', 'Super fast Nitro recharge'],
        ['Bắt Đầu Đua Xe', 'Start Racing'],
        ['Va Chạm Rồi!', 'Crashed!'],
        ['Đừng nản lòng, hãy nhấn Chơi Lại để lập kỷ lục đường đua mới nhé!',
            "Don't give up — hit Restart and set a brand new track record!"],
        ['Quãng đường đua được:', 'Distance covered:'],
        ['🚨 VI PHẠM VƯỢT ĐÈN ĐỎ! CẢNH SÁT BẮT XOAY XE!', '🚨 RAN A RED LIGHT! THE POLICE SPIN YOU OUT!'],
        ['🟢 LÁI XE AN TOÀN DỪNG ĐÈN ĐỎ! THƯỞNG +100m!', '🟢 SAFE STOP AT THE RED LIGHT! BONUS +100m!'],
        ['🟢 ĐÈN XANH: PHÓNG TỐC ĐỘ GO GO GO!', '🟢 GREEN LIGHT: GO GO GO!'],
        ['💥 ĐÃ HÚC VĂNG XE CHẠY ẨU!', '💥 SMASHED THAT RECKLESS DRIVER AWAY!'],
        ['🚀 ĐÃ NẠP THÊM 50% NITRO!', '🚀 NITRO REFILLED BY 50%!'],
        ['🪙 THƯỞNG +50m QUÃNG ĐƯỜNG!', '🪙 BONUS +50m DISTANCE!'],
        ['🛡️ BẬT KHIÊN BẢO VỆ XE!', '🛡️ CAR SHIELD ACTIVATED!'],
        ['🌀 VỆT DẦU TRƠN! XOAY TÍT XE!', '🌀 SLIPPERY OIL! SPINNING OUT!'],

        /* ---------- Cyber Snake ---------- */
        /* Tên 8 màn chơi — game tự đặt theo ngôn ngữ, để đây cho phần menu */
        ['KHỞI ĐỘNG', 'BOOT UP'],
        ['BỐN TRỤ', 'FOUR PILLARS'],
        ['THẬP TỰ', 'THE CROSS'],
        ['CỔNG DỊCH CHUYỂN', 'PORTAL GRID'],
        ['HÀNH LANG', 'CORRIDORS'],
        ['MÊ CUNG', 'THE MAZE'],
        ['ĐẤU TRƯỜNG', 'THE ARENA'],
        ['LÕI NGUY HIỂM', 'DANGER CORE'],
        ['CHẶNG', 'STAGE'],
        ['8 màn neon, rắn trườn mượt, một thân rắn phát sáng', '8 neon stages, smooth gliding, one glowing snake'],
        ['8 MÀN PHẢI VƯỢT', '8 STAGES TO CLEAR'],
        ['Ăn đủ số lõi là qua màn. Ở màn CỔNG DỊCH CHUYỂN và ĐẤU TRƯỜNG, hai mép bàn thông nhau — trườn ra mép này là hiện lại ở mép kia. Vượt hết tám màn thì chơi lại từ đầu, nhanh hơn.',
            'Eat enough cores to clear a stage. On PORTAL GRID and THE ARENA the edges wrap around - slide off one side and you come back on the other. Clear all eight and they start again, faster.'],
        ['OVERDRIVE: nhân đôi điểm và nhân đôi tốc độ', 'OVERDRIVE: double points and double speed'],
        ['LÕI CRYO: mọi thứ chậm hẳn lại', 'CRYO CORE: everything slows down'],
        ['Hệ Thống Power-Up Cores', 'Power-Up Core System'],
        ['Điều Khiển', 'Controls'],
        [': Mồi thường (+100đ, dài +1)', ': Standard core (+100 pts, +1 length)'],
        [': Nhân đôi điểm + Siêu tốc (5s)', ': Double points + overdrive (5s)'],
        [': Làm chậm tốc độ di chuyển (5s)', ': Slows movement down (5s)'],
        [': Phá hủy giật lùi đuôi (-2 đốt thân)', ': Destroys the tail (-2 body segments)'],
        [': Cho điểm cực lớn (+500đ)', ': Huge score bonus (+500 pts)'],
        ['để điều khiển hướng đi.', 'to steer.'],
        ['Trên di động:', 'On mobile:'],
        ['Vuốt màn hình', 'Swipe the screen'],
        ['theo hướng muốn rẽ.', 'in the direction you want to turn.'],
        ['Bắt Đầu Hack Grid', 'Start Hacking The Grid'],
        ['Hack Lại', 'Hack Again'],
        ['Kết nối mạng lưới đã bị ngắt', 'Grid connection terminated'],
        ['Đạt tới Level:', 'Level reached:'],
        ['Kỷ Lục Mới Đã Được Thiết Lập!', 'New Record Set!'],
        ['Điểm', 'Score'],
        ['Cao Nhất', 'High'],
        ['Cấp', 'Level'],
        ['Độ Dài', 'Size'],
        ['Siêu Tốc', 'Overdrive'],
        ['Siêu Tốc Đang Bật', 'Overdrive Active'],
        ['Phát Hiện Va Chạm Lưới', 'Grid Collusion Detected'],
        ['Hack lưới điện tử neon', 'Neon Grid Grid Cybernetic Hack'],

        /* ---------- Space Shooter — Neon Nebula ---------- */
        ['Hướng Dẫn', 'How To Play'],
        [': Di chuyển trái/phải', ': Move left/right'],
        [': Di chuyển lên/xuống', ': Move up/down'],
        [': Bắn laser vũ khí', ': Fire the laser'],
        ['Click chuột', 'Mouse click'],
        ['Di chuột / Chạm kéo : Tự động di chuyển & Bắn', 'Move the mouse / drag to move and fire automatically'],
        ['Chọn Tàu Chiến', 'Choose Your Ship'],
        ['Tàu chiến của bạn đã bị tiêu diệt', 'Your ship has been destroyed'],
        ['Sống sót đến Wave:', 'Survived to wave:'],
        ['Máu', 'HP'],
        ['Khiên', 'Shield'],
        ['Đợt', 'Wave'],
        ['Cảnh Báo: Đợt Tấn Công Mới', 'Warning: Incoming Wave'],
        ['Nhiệm Vụ Thất Bại', 'Mission Failed'],
        ['Game bắn phi thuyền trong dải ngân hà tương lai', 'A Futuristic Particle Space Shooter'],

        /* ---------- Fruit Crush (page chrome only — game owns its own i18n) ---------- */
        ['Chế Độ Thử Màn', 'Level Test Mode'],

        /* ---------- English Quest (UI chrome only — lessons stay Vietnamese) ---------- */
        ['Chinh Phục Thì Hiện Tại Hoàn Thành', 'Master The Present Perfect'],
        ['🗺️ Bản đồ hành trình · 8 chặng · 20 động từ', '🗺️ Journey map · 8 stages · 20 verbs'],
        ['Điểm kinh nghiệm', 'Experience points'],
        ['Sao đã đạt', 'Stars earned'],
        ['Chặng hoàn thành', 'Stages completed'],
        ['Bé đang học dở một chặng', 'You have a stage in progress'],
        ['▶ HỌC TIẾP', '▶ CONTINUE'],
        ['▶ Học Tiếp', '▶ Continue'],
        ['🗺️ Bản Đồ', '🗺️ Map'],
        ['Chọn một chặng để bắt đầu', 'Pick a stage to begin'],
        ['Lượt học dở dang', 'Unfinished session'],
        ['Bé đang học dở một chặng. Bé muốn học tiếp hay quay về bản đồ học tập?',
            'You have a stage in progress. Continue it, or go back to the map?'],
        ['Hoàn thành chặng!', 'Stage complete!'],
        ['Bé làm tốt lắm!', 'Great work!'],
        ['💎 Điểm nhận được', '💎 Points earned'],
        ['🎯 Độ chính xác', '🎯 Accuracy'],
        ['🔥 Chuỗi đúng', '🔥 Correct streak'],
        ['🔁 Làm lại', '🔁 Replay'],
        ['➡️ Chặng tiếp theo', '➡️ Next stage'],
        ['Về bản đồ hành trình', 'Back to the journey map'],
        ['Xoá tiến trình đã lưu', 'Clear saved progress'],
        ['Bỏ lượt học dở này', 'Discard this unfinished session'],
        ['Quay lại bản đồ', 'Back to the map'],
        ['Kiểm Tra', 'Check'],
        ['Tốc độ đọc', 'Speech rate'],
        ['🐢 Chậm', '🐢 Slow'],
        ['🚶 Vừa', '🚶 Medium'],
        ['🐇 Bình thường', '🐇 Normal'],
        ['🎙️ Chọn Giọng Đọc', '🎙️ Choose A Voice'],
        ['Bấm ▶ nghe thử từng giọng, rồi chọn giọng nào nghe tự nhiên nhất nhé.',
            'Press ▶ to preview each voice, then pick the one that sounds most natural.'],
        ['Ghi Nhớ', 'Cheat Sheet'],
        ['Giọng Đọc', 'Voice'],
        ['Chặng', 'Stage'],
        ['Câu {0} / {1}', 'Question {0} / {1}'],
        ['Học', 'Learn'],
        ['20 động từ bất quy tắc', '20 irregular verbs'],
        ['có tranh minh hoạ & phát âm, luyện ngữ pháp, ghép câu, nối từ, nghe điền từ và đọc hiểu — tất cả trong một cuộc phiêu lưu.',
            'with pictures & pronunciation, plus grammar drills, sentence building, matching, listening gap-fills and reading — all in one adventure.'],
        ['💡 Mẹo: bấm nút', '💡 Tip: press the'],
        ['ở trên để xem lại toàn bộ công thức bất cứ lúc nào.', 'button above to review every formula at any time.'],
        /* Voice-settings help — app UI, so it follows the interface language */
        ['😕 Nghe vẫn như robot? Bấm vào đây', '😕 Still sounds robotic? Tap here'],
        ['Giọng đọc là', 'The voice comes from'],
        ['của thiết bị', 'your device'],
        [', không phải của trang web. Máy chưa tải giọng cao cấp thì chỉ có giọng nén đời cũ nghe rất máy móc. Tải thêm giọng',
            ', not from this website. Without a premium voice installed you only get an old compressed one that sounds very robotic. Install extra voices'],
        ['miễn phí', 'for free', 'x'],           // far too common to splice into a sentence
        ['như sau:', 'like this:'],
        ['🖥️ Trên máy Mac', '🖥️ On a Mac'],
        ['📱 Trên iPad / iPhone', '📱 On iPad / iPhone'],
        ['Mở', 'Open'],
        ['Mở phần', 'Open'],
        ['Cài đặt Hệ thống', 'System Settings'],
        ['Trợ năng', 'Accessibility'],
        ['Nội dung đọc', 'Spoken Content'],
        ['Ở mục', 'Under'],
        ['Giọng nói hệ thống', 'System Voice'],
        [', bấm', ', press'],
        ['Quản lý giọng nói…', 'Manage Voices…'],
        [', tải các giọng có chữ', 'and download the voices marked'],
        ['— gợi ý:', '— suggested:'],
        ['Tải xong,', 'Once downloaded,'],
        ['tải lại trang này', 'reload this page'],
        ['rồi quay lại đây chọn giọng mới', 'then come back here and pick the new voice'],
        ['Cài đặt', 'Settings'],
        ['Giọng nói', 'Voices'],
        ['Tải giọng có chữ', 'Download the voices marked'],
        ['(Nâng cao)', '(Enhanced)'],
        ['(Cao cấp)', '(Premium)'],
        ['💡 Mẹo nhanh: mở bài học bằng', '💡 Quick tip: open the lesson in'],
        ['— Chrome có sẵn giọng', '— Chrome ships with'],
        ['chạy qua mạng, nghe tự nhiên hơn hẳn giọng cài sẵn của máy.',
            'online voices that sound far more natural than the built-in ones.'],
        /* Journey map: stage cards are navigation, so they follow the UI
         * language even though the lessons behind them stay Vietnamese. */
        ['Chặng {0} · {1} câu', 'Stage {0} · {1} questions'],
        ['BẮT ĐẦU ▶', 'START ▶'],
        ['Thẻ Từ Mới · Phần 1', 'Flashcards · Part 1'],
        ['10 động từ đầu: speak, draw, catch, do, eat, drink, run, swim, sing, write. Có tranh, phiên âm và giọng đọc chuẩn.',
            'The first 10 verbs: speak, draw, catch, do, eat, drink, run, swim, sing, write. With pictures, phonetics and native audio.'],
        ['Thẻ Từ Mới · Phần 2', 'Flashcards · Part 2'],
        ['10 động từ tiếp theo: read, make, buy, take, give, come, sleep, sit, stand, fly. Học xong là trọn bảng 20 từ!',
            'The next 10 verbs: read, make, buy, take, give, come, sleep, sit, stand, fly. Finish these and you have all 20!'],
        ['Nối Từ', 'Matching'],
        ['Nối V1 với V3 cho cả 20 động từ, nối từ với nghĩa tiếng Việt và nối các trạng từ dấu hiệu.',
            'Match V1 to V3 for all 20 verbs, match words to their Vietnamese meaning, and match the signal adverbs.'],
        ['Ghép Từ Thành Câu', 'Sentence Building'],
        ['Bấm các mảnh từ để xếp thành câu hiện tại hoàn thành đúng ngữ pháp, dùng chính 20 động từ vừa học.',
            'Tap the word tiles to build grammatically correct present perfect sentences with the 20 verbs you just learned.'],
        ['Luyện Ngữ Pháp', 'Grammar Drills'],
        ['Chia động từ, chọn have/has, phân biệt since và for. Mỗi câu đều có lời giải thích tiếng Việt rõ ràng.',
            'Conjugate the verbs, pick have/has, tell since from for. Every question comes with a clear Vietnamese explanation.'],
        ['Nghe & Điền Từ', 'Listen & Fill In'],
        ['Nghe câu tiếng Anh (có nút nghe chậm 🐢) rồi điền từ còn thiếu. Mỗi câu đều có tranh minh hoạ gợi ý.',
            'Listen to the English sentence (there is a slow 🐢 button) then fill in the missing word. Each one has a picture hint.'],
        ['Bài Đọc Hiểu', 'Reading Comprehension'],
        ['Đọc chuyện ngày Chủ nhật bận rộn của bạn Bo (bấm nghe cả bài), rồi trả lời 6 câu hỏi tìm đáp án trong bài.',
            "Read about Bo's busy Sunday (you can play the whole story), then answer 6 questions about it."],
        ['Thử Thách Cuối', 'Final Challenge'],
        ['Trắc nghiệm tổng hợp trộn tất cả dạng bài trên 20 động từ đã học. Vượt qua để nhận huy hiệu!',
            'A mixed quiz covering every exercise type across all 20 verbs. Pass it to earn your badge!'],
        ['Chặng 1', 'Stage 1'],
        ['Chặng 2', 'Stage 2'],
        ['Chặng 3', 'Stage 3'],
        ['Chặng 4', 'Stage 4'],
        ['Chặng 5', 'Stage 5'],
        ['Chặng 6', 'Stage 6'],
        ['Chặng 7', 'Stage 7'],
        ['Chặng 8', 'Stage 8']
    ];

    /* Key based entries used by [data-i18n] / [data-i18n-html] — [vi, en] */
    var KEYS = {
        sk_dribble_t: ['RÊ BÓNG', 'DRIBBLING'],
        sk_dribble_d: ['Có bóng rồi cứ chạy, bóng dính theo chân bé', 'Once you have the ball just run — it sticks to your feet'],
        sk_pass_t: ['CHUYỀN BÓNG', 'PASSING'],
        sk_pass_d: ['<i>Bấm nhanh</i> phím hành động để chuyền cho đồng đội', '<i>Tap</i> the action key to pass to a teammate'],
        sk_soft_t: ['SÚT NHẸ', 'SOFT SHOT'],
        sk_soft_d: ['<i>Giữ một chút</i> rồi thả — bóng đi vừa phải, dễ đặt lòng', '<i>Hold briefly</i> then release — a gentle, easy-to-place shot'],
        sk_power_t: ['SÚT MẠNH', 'POWER SHOT'],
        sk_power_d: ['<i>Giữ lâu</i> cho thanh lực qua vạch trắng rồi thả — bóng bay như tên lửa', '<i>Hold longer</i> until the power bar passes the white line, then release — a rocket'],
        sk_curve_t: ['ĐÁ XOÁY', 'CURVE SHOT'],
        sk_curve_d: ['Dùng <i>phím thứ hai</i> — bóng bay cong vòng qua thủ môn, đổi lại đi nhẹ hơn chút', 'Use the <i>second key</i> — the ball bends around the keeper, but travels a little softer'],
        sk_goalie_t: ['QUA MẶT THỦ MÔN', 'BEATING THE GOALIE'],
        sk_goalie_d: ['Sút thẳng thì bị bắt — hãy <i>chạy dạt sang một bên</i> rồi sút vào góc trống!', 'Straight shots get saved — <i>run out wide</i> first, then fire into the open corner!'],
        sk_penalty_t: ['ĐÁ LUÂN LƯU', 'PENALTY SHOOTOUT'],
        sk_penalty_d: ['Hết giờ mà hoà thì hai đội <i>đá luân lưu 3 quả</i>, vẫn hoà thì đấu súng tới khi phân thắng bại', 'Still level at full time? <i>Three penalties each</i> — then sudden death until someone wins'],
        soc_desc: ['Từ <b>2 đến 4 bé</b> cùng đá trên một máy. Rê bóng qua người, chuyền cho đồng đội rồi tung cú sút qua <b>thủ môn</b> vào lưới đối phương! Sân vẽ theo <b>luật futsal</b>: vòng cấm hình vòng cung, hai chấm phạt đền, khu thay người.',
            'With <b>2 to 4 kids</b> on one device: dribble past defenders, pass to a teammate and fire a shot past the <b>goalie</b>! The pitch follows <b>futsal rules</b> — an arc-shaped penalty area, two penalty spots and substitution zones.'],
        kid1: ['BÉ 1', 'KID 1'],
        kid2: ['BÉ 2', 'KID 2'],
        kid3: ['BÉ 3', 'KID 3'],
        kid4: ['BÉ 4', 'KID 4']
    };

    /* ------------------------------------------------------------------ *
     * 2. ENGINE
     * ------------------------------------------------------------------ */
    var R = window.KibuRoutes || null;

    /* The URL is the source of truth: /vi/g/… and /en/g/… are two separate
     * pages, so the address bar must win over whatever was stored last. */
    function detectLang() {
        var route = R && R.parse(location.pathname);
        if (route) return route.lang;
        try {
            var saved = localStorage.getItem(LANG_KEY);
            if (saved === 'vi' || saved === 'en') return saved;
        } catch (e) { /* private mode */ }
        return (navigator.language || 'en').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en';
    }

    var lang = detectLang();
    var mode = (document.documentElement.getAttribute('data-kibu-i18n') || '').toLowerCase();
    var domEnabled = mode !== 'off';
    var fragEnabled = domEnabled && mode !== 'exact';

    /* ---- Chặn cái nháy ngôn ngữ gốc trên bản dịch ----
     * Trang game nay viết sẵn bằng tiếng Anh, bản /vi dịch ở trình duyệt sau khi
     * DOM dựng xong — nên người dùng thấy tiếng Anh loé lên rồi mới đổi.
     * Tệp này là script chặn trong <head>, chạy trước khi <body> được vẽ, nên
     * chỉ cần giấu trang tới lúc dịch xong là hết nháy. Có hẹn giờ mở lại phòng
     * khi dịch lỗi — thà chữ sai ngôn ngữ còn hơn màn hình trắng. */
    var veil = null;
    if (domEnabled && lang !== 'en') {
        try {
            veil = document.createElement('style');
            veil.id = 'kibu-i18n-veil';
            veil.textContent = 'html{visibility:hidden!important}';
            (document.head || document.documentElement).appendChild(veil);
            setTimeout(unveil, 1200);
        } catch (e) { veil = null; }
    }

    function unveil() {
        if (!veil) return;
        if (veil.parentNode) veil.parentNode.removeChild(veil);
        veil = null;
    }

    function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    /* Restore the casing of the source string: SHOUTY stays shouty, quiet
     * stays quiet. Lets one dictionary entry cover "Trang Chủ" and "TRANG CHỦ". */
    function applyCase(src, out) {
        var hasLetters = src.toUpperCase() !== src.toLowerCase();
        if (!hasLetters) return out;
        if (src === src.toUpperCase()) return out.toUpperCase();
        if (src === src.toLowerCase()) return out.toLowerCase();
        return out;
    }

    /* A lone word is far too easy to hit inside an unrelated sentence — the
     * entry "Phím"→"Keys" would rewrite "Giữ phím để lấy lực" into
     * "Giữ keys để lấy lực". So single words are matched as whole strings only,
     * unless the entry opts in with the 'f' flag. 'x' forces exact-only. */
    function fragmentSafe(src, flags) {
        if (flags.indexOf('x') >= 0) return false;
        if (flags.indexOf('f') >= 0) return true;
        return src.split(/\s+/).length >= 2;
    }

    var exactMap = {};        // normalised lowercase source → target
    var markupMap = {};       // subset of exactMap whose source carries HTML
    var markupCount = 0;
    var patterns = [];        // { re, out } for entries containing {0}
    var fragEntries = [];     // plain entries usable inside longer strings

    (function buildTables() {
        var srcIdx = lang === 'en' ? 0 : 1;
        var dstIdx = 1 - srcIdx;
        for (var i = 0; i < PAIRS.length; i++) {
            var from = PAIRS[i][srcIdx], to = PAIRS[i][dstIdx];
            if (!from || !to || from === to) continue;
            var flags = PAIRS[i][2] || '';
            // '>' marks a Vietnamese heading whose English side is also a game's
            // brand name. Translating it forward is right ("SONG ĐẤU BÓNG RỔ" →
            // "Basketball Duel"), translating it back is not: it would rename
            // the brand on the home page while the other nine cards stay English.
            if (flags.indexOf('>') >= 0 && lang !== 'en') continue;
            from = norm(from); to = norm(to);

            if (/\{\d\}/.test(from)) {
                // "Ghi {0} điểm" → /^Ghi ([\s\S]*?) điểm$/, remembering which
                // placeholder each capture group carries.
                var order = [];
                from.replace(/\{(\d)\}/g, function (m, n) { order.push(+n); return m; });
                // A placeholder at the very start or end has literal text on one
                // side only, so it happily swallows a whole sentence: "Phím {0}"
                // would turn "phím hành động để chuyền cho đồng đội" into
                // "Key hành động…". Such an edge is capped at a few words —
                // but only when the literal part is too short to be distinctive
                // on its own. Interior placeholders are fenced in already.
                var weight = from.replace(/\{\d\}/g, '').length;
                var edge = weight >= 12 ? '([\\s\\S]+?)' : '(\\S+(?:\\s+\\S+){0,3})';
                var parts = from.split(/\{\d\}/).map(esc);
                var last = parts.length - 1;
                var body = '';
                for (var k = 0; k <= last; k++) {
                    body += parts[k];
                    if (k === last) break;
                    var atEdge = (k === 0 && parts[0] === '') || (k === last - 1 && parts[last] === '');
                    body += atEdge ? edge : '([\\s\\S]+?)';
                }
                var bounded = !/^\{\d\}/.test(from) && !/\{\d\}$/.test(from);
                patterns.push({
                    re: bounded ? new RegExp(body, 'gi') : null,
                    anchored: new RegExp('^' + body + '$', 'i'),
                    order: order,
                    out: to,
                    weight: weight
                });
                continue;
            }

            var key = from.toLowerCase();
            if (!(key in exactMap)) exactMap[key] = to;
            if (from.indexOf('<') >= 0 && !(key in markupMap)) { markupMap[key] = to; markupCount++; }
            if (fragmentSafe(from, flags)) fragEntries.push(from);
        }
        // Most specific pattern first: "Chưa ăn được bi — đến lượt {0} {1}"
        // must win over the looser "{0}Đến lượt {1}".
        patterns.sort(function (a, b) { return b.weight - a.weight; });
    })();

    /* One alternation regex, longest alternative first, so a single pass never
     * translates the output of an earlier replacement.
     *
     * Both edges are guarded so a phrase only matches on word boundaries —
     * without it "và"→"and" would turn "BÓNG VÀNG" into "BÓNG ANDNG". The left
     * edge is a consumed group rather than a lookbehind, which older iPad
     * Safari does not support. */
    var WORD = 'A-Za-z0-9À-ỹ';
    var fragRe = null;
    if (fragEnabled && fragEntries.length) {
        fragEntries.sort(function (a, b) { return b.length - a.length; });
        try {
            fragRe = new RegExp(
                '(^|[^' + WORD + '])(' + fragEntries.map(esc).join('|') + ')(?![' + WORD + '])',
                'gi'
            );
        } catch (e) { fragRe = null; }
    }

    function replaceFragments(str) {
        var out = str;
        for (var j = 0; j < patterns.length; j++) {
            var pg = patterns[j];
            if (!pg.re) continue;
            pg.re.lastIndex = 0;
            out = out.replace(pg.re, function () {
                var a = Array.prototype.slice.call(arguments, 1, arguments.length - 2);
                return expand(pg.out, pg.order, a);
            });
        }
        if (fragRe) {
            fragRe.lastIndex = 0;
            out = out.replace(fragRe, function (m, before, word) {
                var v = exactMap[norm(word).toLowerCase()];
                return v == null ? m : before + applyCase(word, v);
            });
        }
        return out;
    }

    /* Interpolated values get translated too, so "🔫 ĐÃ ĐỔI SÚNG: SÚNG LASER"
     * comes out fully English rather than half-and-half. */
    var depth = 0;
    function expand(out, order, args) {
        return out.replace(/\{(\d)\}/g, function (m, n) {
            var pos = order.indexOf(+n);
            if (pos < 0 || args[pos] == null) return '';
            var v = String(args[pos]);
            if (depth >= 3) return v;
            depth++;
            try { return t(v); } finally { depth--; }
        });
    }

    /* Page titles are deliberately bilingual for SEO
     * ("KIBU Games - Free Online Games … | Sân Chơi Game Trực Tuyến Miễn Phí").
     * Substituting phrase by phrase inside one produces exactly the mess this
     * engine exists to prevent — "Sân Play Games Trực Tuyến for free" — so a
     * title only ever changes on a whole-string dictionary match. */
    function tWholeOnly(str) {
        if (typeof str !== 'string' || !str) return str;
        var flat = norm(str);
        var hit = exactMap[flat.toLowerCase()];
        return hit == null ? str : applyCase(flat, hit);
    }

    function t(str) {
        if (typeof str !== 'string' || !str) return str;
        var flat = norm(str);
        if (!flat) return str;

        var hit = exactMap[flat.toLowerCase()];
        if (hit != null) return applyCase(flat, hit);

        var out = str;
        for (var i = 0; i < patterns.length; i++) {
            var m = patterns[i].anchored.exec(flat);
            if (m) {
                // A loose pattern can swallow words it should not translate
                // ("{0} {1} THẮNG!" eats "NGƯỜI CHƠI 1"), so sweep the result
                // for anything the dictionary still knows.
                out = expand(patterns[i].out, patterns[i].order, m.slice(1));
                if (fragEnabled) out = replaceFragments(out);
                // "ĐỘI ĐỎ GHI BÀN!" is shouted, so its translation is too.
                if (flat === flat.toUpperCase() && flat.toUpperCase() !== flat.toLowerCase()) {
                    out = out.toUpperCase();
                }
                return out;
            }
        }

        return fragEnabled ? replaceFragments(out) : out;
    }

    /* ---- canvas: HUD text drawn by the games ---- */
    (function patchCanvas() {
        var C = window.CanvasRenderingContext2D;
        if (!C || !C.prototype) return;
        ['fillText', 'strokeText'].forEach(function (fn) {
            var orig = C.prototype[fn];
            if (!orig) return;
            C.prototype[fn] = function (text) {
                var args = Array.prototype.slice.call(arguments);
                if (typeof args[0] === 'string') args[0] = t(args[0]);
                return orig.apply(this, args);
            };
        });
        // keep centring correct: measure what will actually be drawn
        var measure = C.prototype.measureText;
        if (measure) {
            C.prototype.measureText = function (text) {
                return measure.call(this, typeof text === 'string' ? t(text) : text);
            };
        }
    })();

    /* ---- DOM ---- */
    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
    var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
    var busy = false;
    var observer = null;

    function skipped(el) {
        for (var n = el; n; n = n.parentElement) {
            if (n.nodeType === 1 && n.hasAttribute('data-i18n-skip')) return true;
        }
        return false;
    }

    function translateTextNode(node) {
        var parent = node.parentElement;
        if (!parent || SKIP_TAGS[parent.tagName] || skipped(parent)) return;
        var raw = node.nodeValue;
        if (!raw || !raw.trim()) return;
        var out = t(raw.trim());
        if (out === raw.trim()) return;
        node.nodeValue = raw.match(/^\s*/)[0] + out + raw.match(/\s*$/)[0];
    }

    /* querySelectorAll never returns the root itself, so match it separately —
     * game.js often injects a single element that carries the attribute. */
    function within(root, selector) {
        var list = root.querySelectorAll ? [].slice.call(root.querySelectorAll(selector)) : [];
        if (root.nodeType === 1 && root.matches && root.matches(selector)) list.unshift(root);
        return list;
    }

    function translateKeys(root) {
        var idx = lang === 'en' ? 1 : 0;
        within(root, '[data-i18n]').forEach(function (el) {
            var e = KEYS[el.getAttribute('data-i18n')];
            if (e) el.textContent = e[idx];
        });
        within(root, '[data-i18n-html]').forEach(function (el) {
            var e = KEYS[el.getAttribute('data-i18n-html')];
            if (e) el.innerHTML = e[idx];
        });
    }

    function translateAttrs(root) {
        ATTRS.forEach(function (a) {
            within(root, '[' + a + ']').forEach(function (el) {
                if (skipped(el)) return;
                var v = el.getAttribute(a);
                if (!v) return;
                var out = t(v);
                if (out !== v) el.setAttribute(a, out);
            });
        });
    }

    /* Some hints arrive as one HTML string with <b> emphasis inside. Matching
     * the markup as a whole keeps the emphasis and, more importantly, keeps
     * words in context: the <b>CHUYỀN</b> in "tap = pass" is a verb, while the
     * "Chuyền" of the end-of-match stats table is the noun "Passes". */
    function translateMarkup(root) {
        if (!markupCount) return;
        var seen = [];
        var inline = within(root, 'b, i, em, strong');
        for (var i = 0; i < inline.length; i++) {
            var p = inline[i].parentElement;
            if (!p || seen.indexOf(p) >= 0 || skipped(p)) continue;
            seen.push(p);
            var v = markupMap[norm(p.innerHTML).toLowerCase()];
            if (v != null) p.innerHTML = v;
        }
    }

    function translateTree(root) {
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        var batch = [], n;
        while ((n = walker.nextNode())) batch.push(n);
        batch.forEach(translateTextNode);
    }

    var OBSERVE = { childList: true, subtree: true, characterData: true };

    /* Runs work with the observer muted, so our own edits never feed back in. */
    function quietly(fn) {
        if (!domEnabled || busy) return;
        busy = true;
        if (observer) observer.disconnect();
        try { fn(); }
        finally {
            if (observer) observer.observe(document.body, OBSERVE);
            busy = false;
        }
    }

    function translateAll() {
        quietly(function () {
            translateKeys(document);
            translateMarkup(document);
            translateTree(document.body);
            translateAttrs(document);
            localizeLinks(document);
            var title = tWholeOnly(document.title);
            if (title !== document.title) document.title = title;
        });
    }

    /* The games rewrite score/timer nodes every frame. Re-walking the whole
     * document on each of those would be wasteful, so only the nodes that
     * actually changed get retranslated, batched once per frame. */
    var queue = [];
    var queued = false;

    function scheduleFlush() {
        if (queued) return;
        queued = true;
        // rAF keeps us in step with the game loop, but a throttled or hidden
        // tab may never call it — the timer guarantees the flush still happens.
        if (window.requestAnimationFrame) window.requestAnimationFrame(flushQueue);
        window.setTimeout(flushQueue, 50);
    }

    function flushQueue() {
        queued = false;
        // A pass is already running; come back rather than dropping the batch,
        // which used to leave those nodes untranslated for good.
        if (busy) return scheduleFlush();
        var nodes = queue;
        queue = [];
        if (!nodes.length) return;   // the paired rAF/timer already drained it
        quietly(function () {
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                if (!n || !n.isConnected) continue;
                if (n.nodeType === 3) {
                    translateTextNode(n);
                } else if (n.nodeType === 1) {
                    translateKeys(n);
                    translateMarkup(n.parentElement || n);
                    translateTree(n);
                    translateAttrs(n);
                    localizeLinks(n);
                }
            }
        });
    }

    /* Never discards a batch: our own edits cannot show up here because the
     * observer is disconnected while they run, so everything delivered is a
     * genuine change from the game and has to be translated. */
    function onMutations(records) {
        for (var i = 0; i < records.length; i++) {
            var r = records[i];
            if (r.type === 'characterData') {
                queue.push(r.target);
            } else {
                for (var j = 0; j < r.addedNodes.length; j++) queue.push(r.addedNodes[j]);
            }
        }
        if (queue.length) scheduleFlush();
    }

    /* ---- internal links ----
     * Links are authored language-free ("/", "/about", "/g/balloon-darts") so
     * the same markup serves both languages; the active language is stitched
     * on here. The server redirects the language-free forms too, so a click
     * that lands before this runs still ends up in the right place. */
    function localizeLinks(root) {
        if (!R) return;
        within(root, 'a[href]').forEach(function (a) {
            var href = a.getAttribute('href');
            if (!href || href.charAt(0) !== '/') return;
            if (R.parse(href)) return;                       // already prefixed
            var bare = R.legacyBare(href.split(/[?#]/)[0]);
            if (!bare) return;                               // an asset, leave it
            a.setAttribute('href', R.build(lang, bare));
        });
    }

    /* ---- language switcher ---- */
    function wireSwitcher() {
        var btn = document.getElementById('btn-global-lang');
        var flag = document.getElementById('global-lang-flag');
        /* Nút hiện lá cờ của ngôn ngữ sẽ CHUYỂN SANG, không phải ngôn ngữ đang
         * xem: bấm vào cờ Anh thì ra tiếng Anh. Hiện cờ ngôn ngữ hiện tại thì
         * người dùng tưởng bấm vào sẽ giữ nguyên. */
        if (flag) {
            var toVi = lang !== 'vi';
            flag.src = toVi ? 'https://flagcdn.com/w40/vn.png' : 'https://flagcdn.com/w40/gb.png';
            flag.alt = toVi ? 'Chuyển sang Tiếng Việt' : 'Switch to English';
        }
        if (btn) {
            btn.title = lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt';
        }
        if (btn && !btn.dataset.kibuWired) {
            btn.dataset.kibuWired = '1';
            btn.addEventListener('click', function () {
                var next = lang === 'vi' ? 'en' : 'vi';
                try {
                    localStorage.setItem(LANG_KEY, next);
                    localStorage.setItem('fruitCrushLang', next); // fruit-crush reads its own key
                } catch (e) { /* private mode */ }
                var route = R && R.parse(location.pathname);
                if (route) {
                    // same page, other language — a reload would keep the old one
                    window.location.href = R.build(next, R.bare(route)) + location.search + location.hash;
                } else {
                    window.location.reload();
                }
            });
        }
    }

    function start() {
        document.documentElement.lang = lang;
        wireSwitcher();
        localizeLinks(document);   // needed even where DOM translation is off
        if (!domEnabled) { unveil(); return; }
        translateAll();
        unveil();                  // dịch xong mới cho hiện, khỏi nháy tiếng Việt
        observer = new MutationObserver(onMutations);
        observer.observe(document.body, OBSERVE);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.KibuI18n = { lang: lang, t: t, refresh: translateAll, LANG_KEY: LANG_KEY };
})();
