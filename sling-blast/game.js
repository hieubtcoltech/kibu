/* ============================================================================
 * SLING BLAST — kéo ná, thả tay, đánh sập cả toà tháp
 * ----------------------------------------------------------------------------
 * Chạy trên Phaser 3 với engine vật lý Matter, cùng cách làm với Pool Masters
 * và Super Striker: mọi thứ trên sân đều là vật thể thật, va chạm thật, đổ
 * thật — không có hoạt cảnh dựng sẵn.
 *
 * Cách tổ chức file:
 *   1. Hằng số thế giới, vật liệu, các loại bi
 *   2. Mười hai màn chơi (dựng bằng vài hàm tiện ích cho khỏi sai toạ độ)
 *   3. Âm thanh tổng hợp bằng WebAudio (không tải file nào)
 *   4. Tiến trình lưu ở localStorage
 *   5. Scene Phaser: dựng màn, ngắm bắn, va chạm, hiệu ứng
 *   6. Nối với các bảng HTML bao quanh
 *
 * Ghi chú vật lý: Matter cộng trọng lực theo công thức
 *      Δv = gravity.y × gravity.scale × dt²  (dt = 16.666 ms, scale = 0.001)
 * nên với gravity.y = 1.1 thì mỗi khung hình vận tốc rơi tăng ~0.306 px.
 * Hàm vẽ đường ngắm dùng đúng con số đó nên chấm ngắm trùng với đường bay thật.
 * ==========================================================================*/
(function () {
    'use strict';

    var M = Phaser.Physics.Matter.Matter;   /* Matter gốc, để gọi Body/Sleeping */

    /* ================================================================== *
     * 1. THẾ GIỚI
     * ================================================================== */

    var W = 1280, H = 720;
    var GROUND_Y = 640;                 /* mặt đất, mọi thứ đứng trên đây */
    var SLING_X = 215, SLING_Y = 452;   /* chỗ treo bi trên chạc ná */
    var MAX_PULL = 155;                 /* kéo xa nhất */
    var LAUNCH_K = 0.152;               /* đổi độ kéo thành vận tốc */
    var GRAVITY_Y = 1.1;
    var G_STEP = GRAVITY_Y * 0.001 * 16.666 * 16.666;   /* ~0.306 px/khung² */
    var AIR = 0.006;                    /* ma sát không khí của bi */
    /* Hình chữ Y của chạc ná: hai gọng dài ARM_LEN chụm tại FORK_Y, nghiêng
       ARM_A radian. Đầu gọng chính là chỗ buộc dây cao su. */
    var FORK_Y = SLING_Y + 16, ARM_LEN = 78, ARM_A = 0.62;
    var TIP_L = { x: SLING_X - Math.sin(ARM_A) * ARM_LEN, y: FORK_Y - Math.cos(ARM_A) * ARM_LEN };
    var TIP_R = { x: SLING_X + Math.sin(ARM_A) * ARM_LEN, y: FORK_Y - Math.cos(ARM_A) * ARM_LEN };

    /* Bốn màu bóng bay, đổi vòng theo thứ tự khai báo trong màn */
    var BALLOON_COLORS = [0xff6b8a, 0x6ec6f5, 0x8fe07a, 0xffd34d];

    /* Vật liệu: máu (hp) quyết định chịu được mấy cú, khối lượng quyết định
       nó đè sập cái gì khi rơi. Băng nhẹ và giòn, đá nặng và lì. */
    var MAT = {
        wood:  { fill: 0xd0913f, dark: 0x7d4f16, hp: 62,  density: 0.0012, pts: 100 },
        stone: { fill: 0x9fadba, dark: 0x54636f, hp: 215, density: 0.0030, pts: 150 },
        ice:   { fill: 0x93e6ff, dark: 0x3a9cc4, hp: 26,  density: 0.0006, pts: 80  },
        tnt:   { fill: 0xff6a4a, dark: 0x9d2510, hp: 24,  density: 0.0016, pts: 250 }
    };

    /* Bi: 'power' là phép chạm giữa không trung mới kích hoạt */
    var AMMO = {
        rock:    { r: 20, density: 0.0078, fill: 0xffb3d1, dark: 0xd4557f, power: null,      label: 'Piggy' },
        split:   { r: 18, density: 0.0062, fill: 0x8fe07a, dark: 0x2c7c33, power: 'split',   label: 'Splitter' },
        bomb:    { r: 20, density: 0.0068, fill: 0xff8a70, dark: 0xa8280f, power: 'bomb',    label: 'Bomb' },
        thunder: { r: 18, density: 0.0062, fill: 0xffd34d, dark: 0xb07400, power: 'thunder', label: 'Thunder' }
    };

    /* ================================================================== *
     * 2. MƯỜI HAI MÀN
     * ------------------------------------------------------------------
     * Toạ độ là tâm khối. Dựng bằng hàm cho khỏi lệch: hai khối chồng nhau
     * dù chỉ 1 px cũng bị Matter bắn văng ra ngay khi màn vừa mở.
     * ================================================================== */

    function B(x, y, w, h, m, deg) {
        return { x: x, y: y, w: w, h: h, m: m, a: (deg || 0) * Math.PI / 180 };
    }

    var PW = 24, PH = 100, SPAN = 130, LT = 24;   /* cột: rộng/cao, khẩu độ, xà */

    /* Một "cổng" gồm hai cột và một xà ngang, xếp được nhiều tầng.
       Trả về mảng khối; đỉnh của cổng nằm ở baseY - floors*(PH+LT). */
    function gate(cx, baseY, mat, floors) {
        var out = [], y = baseY, f;
        for (f = 0; f < (floors || 1); f++) {
            out.push(B(cx - SPAN / 2, y - PH / 2, PW, PH, mat));
            out.push(B(cx + SPAN / 2, y - PH / 2, PW, PH, mat));
            out.push(B(cx, y - PH - LT / 2, SPAN + PW + 10, LT, mat));
            y = y - PH - LT;
        }
        return out;
    }
    function gateTop(baseY, floors) { return baseY - (floors || 1) * (PH + LT); }

    /* Chồng khối vuông nhỏ lên nhau, dùng làm tường hoặc chân đế */
    function stack(cx, baseY, mat, n, w, h) {
        var out = [], i;
        w = w || 44; h = h || 30;
        for (i = 0; i < n; i++) out.push(B(cx, baseY - h / 2 - i * h, w, h, mat));
        return out;
    }

    /* Grumpy đứng trên mặt phẳng cao y */
    function T(x, y) { return { x: x, y: y - 24 }; }


    /* ---------- Vật thể của ba chương sau ----------
       Mỗi chương thêm đúng một thứ mới để bé kịp làm quen, không dồn hết:
         chương 2  địa hình cố định — tường và bệ đá không phá được
         chương 3  bập bênh và đệm nhún — bắn kiểu nảy, kiểu bẩy
         chương 4  bóng bay — nhà treo lơ lửng, bắn nổ bóng cho rơi
    */

    /* Tường/bệ đá: vật tĩnh, không có máu, không phá được */
    function WALL(x, y, w, h) { return { x: x, y: y, w: w, h: h, kind: 'rock' }; }

    /* Đệm nhún: cũng tĩnh nhưng nảy gần như hoàn toàn */
    function PAD(x, y, w, h) { return { x: x, y: y, w: w, h: h, kind: 'pad' }; }

    /* Bập bênh: tấm ván ghim tâm vào một điểm cố định, quay quanh điểm đó */
    /* spin: tốc độ quay ban đầu. Vật ghim đúng trọng tâm thì trọng lực không
       sinh mô-men nào cả, nên không có tham số này nó đứng im chứ không quay. */
    function PIVOT(x, y, w, h, m, spin) { return { x: x, y: y, w: w, h: h, m: m || 'wood', spin: spin || 0 }; }

    /* Bóng bay buộc vào khối thứ `block` trong mảng blocks của màn */
    function BALLOON(x, y, block) { return { x: x, y: y, block: block }; }

    var LEVELS = [
        {
            name: 'First Throw',
            tip: 'Drag back from the ball, then let go.',
            ammo: ['rock', 'rock', 'rock'],
            blocks: gate(900, GROUND_Y, 'wood', 1),
            targets: [T(900, GROUND_Y)]
        },
        {
            name: 'Twin Towers',
            tip: 'Aim at the posts - the roof does the rest.',
            ammo: ['rock', 'rock', 'rock'],
            blocks: gate(820, GROUND_Y, 'wood', 1).concat(gate(1060, GROUND_Y, 'wood', 1)),
            targets: [T(820, GROUND_Y), T(1060, GROUND_Y)]
        },
        {
            name: 'Ice Bridge',
            tip: 'Ice shatters from the lightest tap.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            blocks: gate(830, GROUND_Y, 'ice', 1)
                .concat(gate(1070, GROUND_Y, 'ice', 1))
                .concat([B(950, gateTop(GROUND_Y, 1) - 12, 268, 24, 'wood')]),
            targets: [T(830, GROUND_Y), T(1070, GROUND_Y), T(950, gateTop(GROUND_Y, 1) - 24)]
        },
        {
            name: 'Stone Gate',
            tip: 'Stone is tough - hit the same spot twice.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            blocks: gate(900, GROUND_Y, 'stone', 1)
                .concat(gate(900, gateTop(GROUND_Y, 1), 'wood', 1)),
            targets: [T(900, GROUND_Y), T(900, gateTop(GROUND_Y, 2))]
        },
        {
            name: 'Boom Time',
            tip: 'Tap the screen while the red bomb is flying!',
            ammo: ['bomb', 'rock', 'rock', 'rock'],
            /* Xà gỗ nằm lọt giữa hai cổng: mép cổng trong ở 897 và 1053, nên
               xà rộng 140 đặt tại 975 còn chừa mỗi bên 8 px. */
            blocks: gate(820, GROUND_Y, 'wood', 1)
                .concat(gate(1130, GROUND_Y, 'wood', 1))
                .concat([B(975, GROUND_Y - 12, 140, 24, 'stone')]),
            targets: [T(820, GROUND_Y), T(1130, GROUND_Y), T(975, GROUND_Y - 24)]
        },
        {
            name: 'Three Huts',
            tip: 'Tap in the air to split one ball into three.',
            ammo: ['split', 'rock', 'split'],
            blocks: gate(760, GROUND_Y, 'wood', 1)
                .concat(gate(950, GROUND_Y, 'wood', 1))
                .concat(gate(1140, GROUND_Y, 'wood', 1)),
            targets: [T(760, GROUND_Y), T(950, GROUND_Y), T(1140, GROUND_Y)]
        },
        {
            name: 'High Rise',
            tip: 'Tap while the yellow ball flies to dive straight down.',
            ammo: ['thunder', 'rock', 'rock'],
            blocks: gate(950, GROUND_Y, 'wood', 3),
            targets: [T(950, GROUND_Y), T(950, gateTop(GROUND_Y, 1)), T(950, gateTop(GROUND_Y, 3))]
        },
        {
            name: 'Danger Barrels',
            tip: 'Red barrels blow up when you break them.',
            ammo: ['rock', 'rock', 'rock'],
            blocks: gate(880, GROUND_Y, 'stone', 1)
                .concat(gate(1110, GROUND_Y, 'stone', 1))
                .concat(stack(995, GROUND_Y, 'tnt', 3, 46, 34)),
            targets: [T(880, GROUND_Y), T(1110, GROUND_Y), T(995, GROUND_Y - 102)]
        },
        {
            name: 'The Cellar',
            tip: 'A bomb clears what a rock cannot reach.',
            ammo: ['bomb', 'split', 'rock'],
            /* Hầm rộng hơn khẩu độ cổng chuẩn: hai Cục Cáu ngồi dưới cần
               176 px lọt lòng, cổng gate() chỉ có 106. */
            blocks: [
                B(800, GROUND_Y - 50, 24, 100, 'stone'),
                B(1000, GROUND_Y - 50, 24, 100, 'stone'),
                B(900, GROUND_Y - 112, 260, 24, 'stone'),
                B(756, GROUND_Y - 50, 24, 100, 'wood'),
                B(1044, GROUND_Y - 50, 24, 100, 'wood')
            ],
            targets: [T(860, GROUND_Y), T(940, GROUND_Y), T(900, GROUND_Y - 124)]
        },
        {
            name: 'Pyramid',
            tip: 'Knock out the bottom and the top comes down.',
            ammo: ['rock', 'rock', 'rock', 'bomb'],
            blocks: gate(800, GROUND_Y, 'wood', 1)
                .concat(gate(1010, GROUND_Y, 'wood', 1))
                .concat([B(905, gateTop(GROUND_Y, 1) - 14, 300, 28, 'wood')])
                .concat(gate(905, gateTop(GROUND_Y, 1) - 28, 'ice', 1)),
            targets: [T(800, GROUND_Y), T(1010, GROUND_Y),
                      T(905, gateTop(GROUND_Y, 1) - 28), T(905, gateTop(gateTop(GROUND_Y, 1) - 28, 1))]
        },
        {
            name: 'Sky Perch',
            tip: 'Thin ice posts hold a very heavy roof.',
            ammo: ['thunder', 'rock', 'rock'],
            blocks: [
                B(820, GROUND_Y - 60, 20, 120, 'ice'),
                B(1000, GROUND_Y - 60, 20, 120, 'ice'),
                B(910, GROUND_Y - 134, 260, 28, 'stone'),
                B(1130, GROUND_Y - 50, 24, 100, 'wood'),
                B(1130, GROUND_Y - 112, 120, 24, 'wood')
            ],
            targets: [T(870, GROUND_Y - 148), T(950, GROUND_Y - 148), T(1130, GROUND_Y - 124)]
        },
        {
            name: 'Grumpy Fortress',
            tip: 'Last one! Use every trick you have learned.',
            ammo: ['bomb', 'split', 'thunder', 'rock', 'rock'],
            blocks: gate(730, GROUND_Y, 'stone', 2)
                .concat(gate(1150, GROUND_Y, 'stone', 2))
                .concat([B(940, gateTop(GROUND_Y, 2) - 14, 340, 28, 'wood')])
                .concat(stack(940, GROUND_Y, 'tnt', 2, 46, 34))
                .concat(gate(940, gateTop(GROUND_Y, 2) - 28, 'ice', 1)),
            targets: [T(730, GROUND_Y), T(1150, GROUND_Y),
                      T(730, gateTop(GROUND_Y, 1)), T(1150, gateTop(GROUND_Y, 1)),
                      T(940, gateTop(GROUND_Y, 2) - 28)]
        }
    ];

    /* ================================================================== *
     * 2b. CHƯƠNG 2 — ĐỒI ĐÁ
     * ------------------------------------------------------------------
     * Cái mới: địa hình cố định. Tường và bệ đá không bắn vỡ được, nên bé
     * phải học bắn vòng cầu qua, luồn qua khe, hoặc nảy vào.
     * ================================================================== */
    var CH2 = [
        {
            name: 'Over The Wall',
            tip: 'Pull high so the ball arcs over the wall.',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [WALL(650, 500, 44, 280)],
            blocks: gate(980, GROUND_Y, 'wood', 1),
            targets: [T(980, GROUND_Y)]
        },
        {
            name: 'The Ledge',
            tip: 'The hut sits on rock. Rock never breaks - the hut does.',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [WALL(980, 570, 300, 34)],
            blocks: gate(980, 553, 'wood', 1),
            targets: [T(980, 553)]
        },
        {
            name: 'Two Pillars',
            tip: 'Rock pillars on both sides. The only way in is the middle.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            terrain: [WALL(770, 520, 40, 240), WALL(1170, 520, 40, 240)],
            blocks: gate(970, GROUND_Y, 'wood', 1),
            targets: [T(970, GROUND_Y), T(970, gateTop(GROUND_Y, 1))]
        },
        {
            name: 'Under The Roof',
            tip: 'A rock roof is in the way - roll the ball in from the side.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            terrain: [WALL(1000, 430, 420, 34)],
            blocks: [B(1190, GROUND_Y - 50, 24, 100, 'wood')],
            targets: [T(880, GROUND_Y), T(1010, GROUND_Y)]
        },
        {
            name: 'The Window',
            tip: 'Fire through the window between the two rocks.',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [WALL(720, 380, 44, 200), WALL(720, 610, 44, 60)],
            blocks: gate(1010, GROUND_Y, 'wood', 1),
            targets: [T(1010, GROUND_Y)]
        },
        {
            name: 'The Canyon',
            tip: 'All three are down in the gap. Drop one in and they all go.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            terrain: [WALL(790, 530, 40, 220), WALL(1180, 530, 40, 220)],
            blocks: [B(880, GROUND_Y - 12, 120, 24, 'wood'),
                     B(1090, GROUND_Y - 12, 120, 24, 'wood')],
            targets: [T(880, GROUND_Y - 24), T(985, GROUND_Y), T(1090, GROUND_Y - 24)]
        },
        {
            name: 'Bomb The Ledge',
            tip: 'Rock blocks every path - set the bomb off right above it.',
            ammo: ['bomb', 'rock', 'rock'],
            terrain: [WALL(950, 545, 380, 30)],
            blocks: gate(950, 530, 'stone', 1),
            targets: [T(950, 530), T(950, gateTop(530, 1))]
        },
        {
            name: 'Rock Bridge',
            tip: 'One Grumpy on the bridge, one under it.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            /* Cầu tựa trên hai trụ, mặt cầu đua ra khỏi trụ trái một quãng và
               Cục Cáu thứ hai đứng dưới phần đua đó.
               Đây là chỗ tôi sai hai lần: hễ trụ ngoài cùng chạm tới mặt cầu
               thì cả mảng từ y=452 xuống đất bị bịt, bi không có đường nào vào
               gầm — muốn vượt trụ phải bay cao hơn 480, mà 452-480 lại đúng là
               mặt cầu. Chừa vòm giữa hai trụ cũng vô ích vì muốn tới được vòm
               thì đã phải ở trong gầm rồi. */
            terrain: [WALL(970, 466, 560, 28),
                      WALL(880, 560, 34, 160), WALL(1215, 560, 34, 160)],
            blocks: gate(1000, 452, 'wood', 1),
            targets: [T(1000, 452), T(770, GROUND_Y)]
        },
        {
            name: 'Stair Steps',
            tip: 'Three steps, one Grumpy each. Higher is harder.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            terrain: [WALL(800, 610, 200, 60), WALL(1000, 560, 200, 160),
                      WALL(1180, 500, 160, 280)],
            targets: [T(800, 580), T(1000, 480), T(1180, 360)]
        },
        {
            name: 'The Tunnel',
            tip: 'The only way through is the tunnel near the ground.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            /* Tường dừng ở y=560, chừa khe cao 80 px sát đất — đúng cái hầm
               mà mách nước nói tới. Bản trước tường chạm đất, không có hầm. */
            terrain: [WALL(780, 380, 44, 360)],
            blocks: gate(1030, GROUND_Y, 'ice', 1),
            targets: [T(1030, GROUND_Y)]
        },
        {
            name: 'High Wall',
            tip: 'The tallest wall yet. Pull all the way back!',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [WALL(640, 430, 44, 420)],
            blocks: gate(1000, GROUND_Y, 'wood', 2),
            targets: [T(1000, GROUND_Y), T(1000, gateTop(GROUND_Y, 2))]
        },
        {
            name: 'Rock Fortress',
            tip: 'End of the world - use the bomb and the thunder ball.',
            ammo: ['bomb', 'thunder', 'rock', 'rock'],
            terrain: [WALL(700, 520, 40, 240), WALL(1210, 520, 40, 240),
                      WALL(955, 400, 300, 28)],
            blocks: gate(870, GROUND_Y, 'stone', 1)
                .concat(gate(1060, GROUND_Y, 'stone', 1)),
            targets: [T(870, GROUND_Y), T(1060, GROUND_Y), T(955, 386)]
        }
    ];

    /* ================================================================== *
     * 2c. CHƯƠNG 3 — CÔNG TRƯỜNG
     * ------------------------------------------------------------------
     * Cái mới: đệm nhún (bi nảy gần như không mất sức) và bập bênh (tấm ván
     * ghim tâm, quay tự do). Bé học bắn nảy và bắn bẩy.
     * ================================================================== */
    var CH3 = [
        {
            name: 'First Bounce',
            tip: 'The green pad bounces hard - try firing straight at it!',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [PAD(700, 618, 180, 44)],
            blocks: gate(1030, GROUND_Y, 'wood', 1),
            targets: [T(1030, GROUND_Y), T(1030, gateTop(GROUND_Y, 1))]
        },
        {
            name: 'Bounce Over',
            tip: 'Bounce first, then you can clear the wall behind.',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [PAD(640, 618, 170, 44), WALL(830, 500, 40, 280)],
            blocks: gate(1080, GROUND_Y, 'wood', 1),
            targets: [T(1080, GROUND_Y)]
        },
        {
            name: 'See-Saw',
            tip: 'The see-saw turns on its middle pin. Hit one end, the other flies up.',
            ammo: ['rock', 'rock', 'rock'],
            /* Hai hòn đá bằng nhau ở hai đầu cho ván nằm cân, còn Cục Cáu ngồi
               đúng trên chốt. Bản trước chỉ có một hòn đá nên ván đổ ngay lúc
               mở màn và hất Cục Cáu xuống trước khi bé kịp bắn. */
            pivots: [PIVOT(980, 500, 320, 22, 'wood')],
            blocks: [B(870, 466, 44, 44, 'stone'), B(1090, 466, 44, 44, 'stone')],
            targets: [T(980, 489), T(980, GROUND_Y)]
        },
        {
            name: 'Spinning Gate',
            tip: 'The gate spins - slip past while it lies flat.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            pivots: [PIVOT(820, 470, 26, 300, 'wood', 0.055)],
            blocks: gate(1080, GROUND_Y, 'wood', 1),
            targets: [T(1080, GROUND_Y)]
        },
        {
            name: 'Double Bounce',
            tip: 'Two pads in a row send the ball a long way.',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [PAD(620, 618, 150, 44), PAD(830, 618, 150, 44)],
            blocks: gate(1120, GROUND_Y, 'wood', 2),
            targets: [T(1120, GROUND_Y), T(1120, gateTop(GROUND_Y, 2))]
        },
        {
            name: 'The Catapult',
            tip: 'Smash this end and the stone on the far end flies up.',
            ammo: ['rock', 'rock', 'rock'],
            pivots: [PIVOT(900, 520, 300, 22, 'wood')],
            blocks: [B(1030, 494, 52, 30, 'stone')],
            terrain: [WALL(1170, 560, 40, 160)],
            targets: [T(1170, 480), T(760, GROUND_Y)]
        },
        {
            name: 'Bounce And Bomb',
            tip: 'Bounce up first, then tap to set the bomb off up close.',
            ammo: ['bomb', 'rock', 'rock'],
            terrain: [PAD(680, 618, 160, 44), WALL(880, 470, 40, 340)],
            blocks: gate(1090, GROUND_Y, 'stone', 1),
            targets: [T(1090, GROUND_Y), T(1090, gateTop(GROUND_Y, 1))]
        },
        {
            name: 'Swing Bridge',
            tip: 'The swinging bridge tips - lean it and everything slides off.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            pivots: [PIVOT(980, 470, 360, 22, 'wood')],
            blocks: [B(880, 444, 40, 30, 'wood'), B(1080, 444, 40, 30, 'wood')],
            targets: [T(980, 459), T(980, GROUND_Y)]
        },
        {
            name: 'Trampoline Park',
            tip: 'Three pads - see how many bounces you can get.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            terrain: [PAD(600, 618, 130, 44), PAD(780, 618, 130, 44), PAD(960, 618, 130, 44)],
            blocks: gate(1160, GROUND_Y, 'ice', 2),
            targets: [T(1160, GROUND_Y), T(1160, gateTop(GROUND_Y, 2))]
        },
        {
            name: 'Windmill',
            tip: 'Two blades spinning apart - find the gap.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            pivots: [PIVOT(760, 450, 24, 240, 'wood', 0.05), PIVOT(1000, 450, 24, 240, 'wood', -0.05)],
            blocks: gate(1180, GROUND_Y, 'wood', 1),
            targets: [T(1180, GROUND_Y)]
        },
        {
            name: 'Spring Tower',
            tip: 'Bounce high, then dive straight onto the roof.',
            ammo: ['thunder', 'rock', 'rock'],
            terrain: [PAD(660, 618, 170, 44)],
            blocks: gate(1050, GROUND_Y, 'wood', 3),
            targets: [T(1050, gateTop(GROUND_Y, 3)), T(1050, GROUND_Y)]
        },
        {
            name: 'Playground Boss',
            tip: 'Pads and a see-saw together - last one of the world!',
            ammo: ['bomb', 'rock', 'rock', 'rock'],
            terrain: [PAD(640, 618, 150, 44), WALL(1210, 540, 40, 200)],
            pivots: [PIVOT(900, 480, 280, 22, 'wood')],
            blocks: gate(1090, GROUND_Y, 'stone', 1),
            targets: [T(900, 469), T(1090, GROUND_Y), T(1090, gateTop(GROUND_Y, 1))]
        }
    ];

    /* ================================================================== *
     * 2d. CHƯƠNG 4 — TRÊN MÂY
     * ------------------------------------------------------------------
     * Cái mới: bóng bay. Cả ngôi nhà treo lơ lửng nhờ bóng; bắn nổ bóng thì
     * nhà rơi. Bắn thẳng vào nhà cũng được, nhưng nổ bóng thì đẹp hơn nhiều.
     * ================================================================== */
    var CH4 = [
        {
            name: 'First Balloon',
            tip: 'Pop the balloon and the hut falls to the ground.',
            ammo: ['rock', 'rock', 'rock'],
            blocks: [B(1000, 430, 240, 24, 'wood')],
            balloons: [BALLOON(1000, 320, 0)],
            targets: [T(1000, 418)]
        },
        {
            name: 'Two Balloons',
            tip: 'Two balloons, two decks - one ball each if you aim well.',
            ammo: ['rock', 'rock', 'rock'],
            blocks: [B(880, 420, 170, 24, 'wood'), B(1120, 420, 170, 24, 'wood')],
            balloons: [BALLOON(880, 310, 0), BALLOON(1120, 310, 1)],
            targets: [T(880, 408), T(1120, 408)]
        },
        {
            name: 'Sky And Ground',
            tip: 'One Grumpy in the sky, one on the ground.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            blocks: [B(1020, 400, 240, 24, 'wood')]
                .concat(gate(880, GROUND_Y, 'wood', 1)),
            balloons: [BALLOON(1020, 292, 0)],
            targets: [T(1020, 388), T(880, GROUND_Y)]
        },
        {
            name: 'Behind The Cloud',
            tip: 'A rock wall in front, the balloon hides behind it.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            terrain: [WALL(700, 470, 40, 340)],
            blocks: [B(1030, 400, 250, 24, 'wood')],
            balloons: [BALLOON(1030, 292, 0)],
            targets: [T(1030, 388)]
        },
        {
            name: 'Balloon Tower',
            tip: 'The sky hut has two floors.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            blocks: [B(1010, 420, 260, 24, 'wood')]
                .concat(gate(1010, 408, 'wood', 1)),
            balloons: [BALLOON(1010, 312, 0)],
            targets: [T(1010, 408), T(1010, gateTop(408, 1))]
        },
        {
            name: 'Bomb In The Sky',
            tip: 'One bomb in mid-air takes down every balloon.',
            ammo: ['bomb', 'rock', 'rock'],
            blocks: [B(880, 400, 190, 24, 'wood'), B(1140, 400, 190, 24, 'wood')],
            balloons: [BALLOON(880, 300, 0), BALLOON(1140, 300, 1)],
            targets: [T(880, 388), T(1140, 388)]
        },
        {
            name: 'Bounce To The Sky',
            tip: 'Bounce off the pad all the way up to the balloon.',
            ammo: ['rock', 'rock', 'rock'],
            terrain: [PAD(700, 618, 170, 44)],
            blocks: [B(1050, 360, 240, 24, 'wood')],
            balloons: [BALLOON(1050, 252, 0)],
            targets: [T(1050, 348)]
        },
        {
            name: 'Three In A Row',
            tip: 'Three balloons, three huts, only four balls.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            blocks: [B(820, 420, 150, 24, 'wood'), B(1010, 380, 150, 24, 'wood'),
                     B(1200, 440, 150, 24, 'wood')],
            balloons: [BALLOON(820, 320, 0), BALLOON(1010, 280, 1), BALLOON(1200, 340, 2)],
            targets: [T(820, 408), T(1010, 368), T(1200, 428)]
        },
        {
            name: 'Split In The Air',
            tip: 'Tap in the air to split into three and sweep the whole row.',
            ammo: ['split', 'rock', 'rock'],
            blocks: [B(880, 390, 150, 24, 'wood'), B(1040, 390, 150, 24, 'wood'),
                     B(1200, 390, 150, 24, 'wood')],
            balloons: [BALLOON(880, 290, 0), BALLOON(1040, 290, 1), BALLOON(1200, 290, 2)],
            targets: [T(880, 378), T(1040, 378), T(1200, 378)]
        },
        {
            name: 'Sky Fortress',
            tip: 'A flying stone fort - popping the balloons is the easy way.',
            ammo: ['rock', 'rock', 'rock', 'rock'],
            blocks: [B(1020, 400, 300, 26, 'stone')]
                .concat(gate(1020, 387, 'wood', 1)),
            balloons: [BALLOON(1020, 292, 0)],
            targets: [T(1020, 387), T(1020, gateTop(387, 1))]
        },
        {
            name: 'Storm Cloud',
            tip: 'The thunder ball diving from above suits this one.',
            ammo: ['thunder', 'rock', 'rock'],
            terrain: [WALL(760, 460, 40, 360)],
            blocks: [B(1060, 380, 260, 24, 'wood')],
            balloons: [BALLOON(1060, 272, 0)],
            targets: [T(1000, 368), T(1120, 368)]
        },
        {
            name: 'Cloud Kingdom',
            tip: 'The very last level. Good luck!',
            ammo: ['bomb', 'split', 'thunder', 'rock', 'rock'],
            terrain: [WALL(700, 500, 40, 280), PAD(880, 618, 150, 44)],
            blocks: [B(1050, 380, 280, 26, 'stone')]
                .concat(gate(1050, 367, 'wood', 1))
                .concat(gate(1160, GROUND_Y, 'wood', 1)),
            balloons: [BALLOON(1050, 272, 0)],
            targets: [T(1050, 367), T(1050, gateTop(367, 1)),
                      T(1160, GROUND_Y), T(1160, gateTop(GROUND_Y, 1))]
        }
    ];

    /* Bốn chương nối lại thành một danh sách phẳng: mã màn vẫn là số chạy từ
       0, nên tiến trình đã lưu của bé chơi bản 12 màn cũ vẫn dùng được. */
    var CHAPTERS = [
        { name: 'Basics', from: 0 },
        { name: 'Rocky Ridge', from: 12 },
        { name: 'Playground', from: 24 },
        { name: 'Sky High', from: 36 }
    ];
    LEVELS = LEVELS.concat(CH2, CH3, CH4);

    function chapterOf(i) { return Math.min(CHAPTERS.length - 1, Math.floor(i / 12)); }

    /* ================================================================== *
     * 3. ÂM THANH — tổng hợp tại chỗ, không tải file
     * ================================================================== */

    var Sfx = {
        on: true, ac: null,
        ctx: function () {
            if (!this.ac) {
                try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); }
                catch (e) { return null; }
            }
            if (this.ac.state === 'suspended') this.ac.resume();
            return this.ac;
        },
        tone: function (f, d, type, vol, slide) {
            if (!this.on) return;
            var ac = this.ctx(); if (!ac) return;
            var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
            o.type = type || 'square';
            o.frequency.setValueAtTime(f, t);
            if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol || 0.07, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + d);
            o.connect(g); g.connect(ac.destination);
            o.start(t); o.stop(t + d + 0.02);
        },
        /* Tiếng "xì" của nhiễu trắng, dùng cho vỡ và nổ */
        noise: function (d, vol, lowpass) {
            if (!this.on) return;
            var ac = this.ctx(); if (!ac) return;
            var n = Math.floor(ac.sampleRate * d), buf = ac.createBuffer(1, n, ac.sampleRate);
            var data = buf.getChannelData(0), i;
            for (i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
            var src = ac.createBufferSource(); src.buffer = buf;
            var g = ac.createGain(); g.gain.value = vol || 0.1;
            var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass || 1200;
            src.connect(f); f.connect(g); g.connect(ac.destination);
            src.start();
        },
        stretch: function () { this.tone(180, 0.06, 'triangle', 0.03, 320); },
        launch: function () { this.tone(520, 0.16, 'triangle', 0.06, 140); },
        thud: function () { this.tone(120, 0.09, 'sine', 0.06, 70); },
        crack: function (mat) {
            if (mat === 'ice') { this.tone(1400, 0.1, 'triangle', 0.05, 2600); this.noise(0.12, 0.07, 4200); }
            else if (mat === 'stone') { this.noise(0.2, 0.11, 700); this.tone(90, 0.16, 'sine', 0.06, 55); }
            else { this.noise(0.15, 0.09, 1600); this.tone(200, 0.1, 'square', 0.04, 110); }
        },
        pop: function () { this.tone(700, 0.1, 'square', 0.07, 1300); this.tone(1050, 0.09, 'triangle', 0.05, 1800); },
        boom: function () { this.noise(0.5, 0.16, 500); this.tone(70, 0.4, 'sine', 0.1, 40); },
        split: function () { var s = this; [700, 900, 1150].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.07, 'square', 0.05); }, i * 45); }); },
        dive: function () { this.tone(1200, 0.2, 'sawtooth', 0.06, 200); },
        win: function () { var s = this; [523, 659, 784, 1046, 1318].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.24, 'triangle', 0.09); }, i * 95); }); },
        lose: function () { var s = this; [400, 320, 250].forEach(function (f, i) { setTimeout(function () { s.tone(f, 0.28, 'sawtooth', 0.07, f * 0.6); }, i * 130); }); }
    };

    /* ================================================================== *
     * 4. TIẾN TRÌNH
     * ================================================================== */

    var SAVE_KEY = 'kibu_sling_blast_v1';

    var Save = {
        data: { stars: {}, best: {}, unlocked: 1 },
        load: function () {
            try {
                var raw = localStorage.getItem(SAVE_KEY);
                if (raw) {
                    var d = JSON.parse(raw);
                    if (d && typeof d === 'object') {
                        this.data.stars = d.stars || {};
                        this.data.best = d.best || {};
                        this.data.unlocked = Math.min(LEVELS.length, Math.max(1, d.unlocked || 1));
                    }
                }
            } catch (e) { /* chế độ riêng tư chặn localStorage — chơi vẫn được, chỉ không nhớ */ }
        },
        save: function () {
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { }
        },
        record: function (idx, stars, score) {
            var k = String(idx);
            if ((this.data.stars[k] || 0) < stars) this.data.stars[k] = stars;
            if ((this.data.best[k] || 0) < score) this.data.best[k] = score;
            if (idx + 2 > this.data.unlocked) this.data.unlocked = Math.min(LEVELS.length, idx + 2);
            this.save();
        },
        totalStars: function () {
            var t = 0, k;
            for (k in this.data.stars) if (this.data.stars.hasOwnProperty(k)) t += this.data.stars[k];
            return t;
        },
        reset: function () {
            this.data = { stars: {}, best: {}, unlocked: 1 };
            this.save();
        }
    };

    /* ================================================================== *
     * 5. SCENE
     * ================================================================== */

    function $(id) { return document.getElementById(id); }

    function lerpColor(a, b, t) {
        var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
        var br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
        return ((ar + (br - ar) * t) << 16 | (ag + (bg - ag) * t) << 8 | (ab + (bb - ab) * t)) & 0xffffff;
    }

    class PlayScene extends Phaser.Scene {
        constructor() { super('play'); }

        create() {
            var self = this;

            this.matter.world.setGravity(0, GRAVITY_Y);

            /* --- ảnh nền vẽ một lần --- */
            this.bg = this.add.graphics().setDepth(0);
            this.drawBackdrop();

            /* --- hạt: một chấm trắng nhỏ, tô màu lại khi bắn --- */
            var g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 8, 8);
            g.generateTexture('sb-px', 8, 8);
            g.clear(); g.fillStyle(0xffffff, 1); g.fillCircle(7, 7, 7);
            g.generateTexture('sb-dot', 14, 14);
            g.destroy();

            /* --- mặt đất --- */
            this.ground = this.matter.add.rectangle(W / 2, GROUND_Y + 60, W + 400, 120, {
                isStatic: true, friction: 0.9, restitution: 0.1, label: 'ground'
            });

            /* --- lớp vẽ vật thể --- */
            this.gfx = this.add.graphics().setDepth(5);
            this.fx = this.add.graphics().setDepth(6);

            this.blocks = [];
            this.targets = [];
            this.balls = [];
            this.terrain = [];
            this.balloons = [];
            this.pins = [];
            this.removeQueue = [];
            this.blastQueue = [];
            this.state = 'idle';
            this.levelIndex = 0;

            /* --- điều khiển --- */
            this.input.on('pointerdown', function (p) { self.onDown(p); });
            this.input.on('pointermove', function (p) { self.onMove(p); });
            this.input.on('pointerup', function () { self.onUp(); });

            /* --- va chạm ---
               Không đụng vào thế giới ngay trong hàm này: Matter đang duyệt
               danh sách cặp va chạm, xoá vật thể giữa chừng là hỏng vòng lặp.
               Ghi vào hàng đợi, xử lý ở update(). */
            this.matter.world.on('collisionstart', function (ev) {
                var i, p, rv, em, dmg;
                for (i = 0; i < ev.pairs.length; i++) {
                    p = ev.pairs[i];
                    rv = relVel(p.bodyA, p.bodyB);
                    if (rv < 3.1) continue;
                    em = effMass(p.bodyA, p.bodyB);
                    dmg = rv * em * 2.25;
                    self.applyHit(p.bodyA, dmg, p);
                    self.applyHit(p.bodyB, dmg, p);
                }
            });

            UI.sceneReady(this);
        }

        /* ---------------- nền ---------------- */
        drawBackdrop() {
            var g = this.bg, i, t, c;
            /* trời: 44 dải màu chuyển dần, vẽ một lần nên không tốn gì */
            for (i = 0; i < 44; i++) {
                t = i / 43;
                c = lerpColor(0x1d5f96, 0x8fd3f4, t);
                g.fillStyle(c, 1);
                g.fillRect(0, i * (GROUND_Y / 44), W, GROUND_Y / 44 + 1);
            }
            this.drawSun(g, 1120, 122, 50);
            /* mây */
            this.cloud(g, 260, 120, 1.1); this.cloud(g, 700, 86, 0.8);
            this.cloud(g, 1000, 190, 0.65); this.cloud(g, 470, 210, 0.5);
            /* đồi xa */
            g.fillStyle(0x4c9d63, 1);
            this.hill(g, 180, GROUND_Y, 300, 130);
            this.hill(g, 620, GROUND_Y, 380, 165);
            this.hill(g, 1080, GROUND_Y, 330, 120);
            /* đất */
            g.fillStyle(0x6cbf5a, 1); g.fillRect(0, GROUND_Y, W, 26);
            g.fillStyle(0x8a6237, 1); g.fillRect(0, GROUND_Y + 26, W, H - GROUND_Y - 26);
            g.fillStyle(0x74512c, 1);
            for (i = 0; i < 26; i++) {
                g.fillRect((i * 71) % W, GROUND_Y + 44 + ((i * 37) % 34), 34, 9);
            }
            /* cỏ */
            g.fillStyle(0x57a747, 1);
            for (i = 0; i < 90; i++) {
                var x = (i * 97) % W;
                g.fillTriangle(x, GROUND_Y, x + 5, GROUND_Y - 9 - (i % 5) * 2, x + 10, GROUND_Y);
            }
        }
        /* Mặt trời: quầng sáng ba lớp, mười hai tia nắng toả ra, rồi tới đĩa
           mặt trời ba tông vàng. Bản trước chỉ có hai vòng tròn trắng ngà nên
           nhìn ra mặt trăng chứ không ra mặt trời. */
        drawSun(g, cx, cy, r) {
            var i, a, w = 0.075;
            g.fillStyle(0xffe680, 0.09); g.fillCircle(cx, cy, r * 2.2);
            g.fillStyle(0xffe680, 0.14); g.fillCircle(cx, cy, r * 1.72);
            g.fillStyle(0xffeea0, 0.24); g.fillCircle(cx, cy, r * 1.3);

            g.fillStyle(0xffdb4d, 0.75);
            for (i = 0; i < 12; i++) {
                a = i * Math.PI / 6 + 0.13;
                g.fillTriangle(
                    cx + Math.cos(a - w) * r * 1.12, cy + Math.sin(a - w) * r * 1.12,
                    cx + Math.cos(a + w) * r * 1.12, cy + Math.sin(a + w) * r * 1.12,
                    cx + Math.cos(a) * r * (i % 2 ? 1.62 : 1.95),
                    cy + Math.sin(a) * r * (i % 2 ? 1.62 : 1.95));
            }

            g.fillStyle(0xffb020, 1); g.fillCircle(cx, cy, r);
            g.fillStyle(0xffd23f, 1); g.fillCircle(cx, cy, r * 0.88);
            g.fillStyle(0xffe98a, 1); g.fillCircle(cx - r * 0.12, cy - r * 0.14, r * 0.62);
            g.fillStyle(0xfff6cd, 1); g.fillCircle(cx - r * 0.26, cy - r * 0.3, r * 0.3);
        }

        cloud(g, x, y, s) {
            g.fillStyle(0xffffff, 0.9);
            g.fillCircle(x, y, 26 * s);
            g.fillCircle(x + 30 * s, y + 6 * s, 20 * s);
            g.fillCircle(x - 30 * s, y + 8 * s, 17 * s);
            g.fillCircle(x + 8 * s, y - 16 * s, 19 * s);
        }
        hill(g, cx, baseY, w, h) {
            var pts = [], i, t;
            for (i = 0; i <= 20; i++) {
                t = i / 20;
                pts.push({ x: cx - w / 2 + w * t, y: baseY - Math.sin(t * Math.PI) * h });
            }
            pts.push({ x: cx + w / 2, y: baseY });
            pts.push({ x: cx - w / 2, y: baseY });
            g.fillPoints(pts, true);
        }

        /* ---------------- dựng màn ---------------- */
        loadLevel(idx) {
            var self = this, L = LEVELS[idx], i, b, mat, body, t;

            this.clearWorld();
            this.levelIndex = idx;
            this.score = 0;
            this.queue = L.ammo.slice();
            this.armed = null;
            this.dragging = false;
            this.usedPower = false;
            this.state = 'aim';
            this.settleAt = 0;
            this.shotAt = 0;
            this.matter.world.engine.timing.timeScale = 1;

            /* Có màn chỉ toàn địa hình đá, không có khối nào phá được */
            var BL = L.blocks || [], held = {};
            (L.balloons || []).forEach(function (o) { held[o.block] = (held[o.block] || 0) + 1; });

            for (i = 0; i < BL.length; i++) {
                b = BL[i];
                mat = MAT[b.m];
                body = this.matter.add.rectangle(b.x, b.y, b.w, b.h, {
                    angle: b.a, density: mat.density, friction: 0.62,
                    frictionStatic: 0.9, restitution: 0.06, label: 'block',
                    /* Sàn đang được bóng giữ thì để tĩnh: treo một vật nặng bằng
                       dây nối của Matter luôn rung và có lúc văng thẳng khỏi
                       màn, trong khi cái bé cần chỉ là "đang treo" rồi "rơi". */
                    isStatic: !!held[i]
                });
                body.kibu = { kind: 'block', m: b.m, w: b.w, h: b.h, hp: mat.hp,
                              maxHp: mat.hp, body: body, dead: false, holders: held[i] || 0 };
                this.blocks.push(body.kibu);
            }

            /* địa hình cố định */
            for (i = 0; i < (L.terrain || []).length; i++) {
                b = L.terrain[i];
                body = this.matter.add.rectangle(b.x, b.y, b.w, b.h, {
                    isStatic: true, friction: b.kind === 'pad' ? 0.2 : 0.85,
                    restitution: b.kind === 'pad' ? 0.95 : 0.05, label: 'terrain'
                });
                body.kibu = { kind: 'terrain', pad: b.kind === 'pad', w: b.w, h: b.h, body: body, dead: false };
                this.terrain.push(body.kibu);
            }

            /* bập bênh: ván ghim tâm, quay tự do quanh điểm ghim */
            for (i = 0; i < (L.pivots || []).length; i++) {
                b = L.pivots[i];
                mat = MAT[b.m];
                body = this.matter.add.rectangle(b.x, b.y, b.w, b.h, {
                    density: mat.density * 0.6, friction: 0.6, restitution: 0.1, label: 'pivot'
                });
                body.kibu = { kind: 'block', m: b.m, w: b.w, h: b.h, hp: mat.hp * 3,
                              maxHp: mat.hp * 3, body: body, dead: false, pinned: true };
                this.blocks.push(body.kibu);
                if (b.spin) M.Body.setAngularVelocity(body, b.spin);
                this.pins.push({ x: b.x, y: b.y, body: body });
                this.matter.world.add(M.Constraint.create({
                    pointA: { x: b.x, y: b.y }, bodyB: body, pointB: { x: 0, y: 0 },
                    stiffness: 1, length: 0
                }));
            }

            for (i = 0; i < L.targets.length; i++) {
                t = L.targets[i];
                body = this.matter.add.circle(t.x, t.y, 24, {
                    density: 0.0011, friction: 0.5, restitution: 0.32, label: 'target'
                });
                body.kibu = { kind: 'target', r: 24, hp: 42, maxHp: 42, body: body, dead: false, hurt: 0 };
                this.targets.push(body.kibu);
            }

            /* bóng bay: buộc vào khối đã dựng ở trên, và mỗi khung hình được
               nâng lên đúng bằng trọng lượng của cả cụm nên nó lơ lửng tại chỗ */
            for (i = 0; i < (L.balloons || []).length; i++) {
                b = L.balloons[i];
                var host = this.blocks[b.block];
                if (!host) continue;
                body = this.matter.add.circle(b.x, b.y, 26, { isStatic: true, label: 'balloon' });
                body.kibu = { kind: 'balloon', r: 26, hp: 12, maxHp: 12, body: body,
                              host: host, dead: false, hue: i % 4 };
                this.balloons.push(body.kibu);
            }

            this.arm();
            UI.levelStarted(idx, L);
            this.matter.world.resume();
        }

        clearWorld() {
            var i, w = this.matter.world;
            for (i = 0; i < this.blocks.length; i++) w.remove(this.blocks[i].body);
            for (i = 0; i < this.targets.length; i++) w.remove(this.targets[i].body);
            for (i = 0; i < this.balls.length; i++) w.remove(this.balls[i].body);
            for (i = 0; i < this.terrain.length; i++) w.remove(this.terrain[i].body);
            for (i = 0; i < this.balloons.length; i++) w.remove(this.balloons[i].body);
            /* Dây ghim của bập bênh phải gỡ theo, không thì màn sau vẫn còn một
               điểm ghim vô hình kéo giữa không trung. */
            M.Composite.allConstraints(w.localWorld).forEach(function (c) {
                if (!c.bodyA || c.bodyA.label === 'ground') return;
                if (c.bodyB && c.bodyB.kibu && c.bodyB.kibu.pinned) w.removeConstraint(c);
            });
            M.Composite.allConstraints(w.localWorld).forEach(function (c) {
                if (!c.bodyA && c.bodyB) w.removeConstraint(c);
            });
            this.blocks = []; this.targets = []; this.balls = [];
            this.terrain = []; this.balloons = []; this.pins = [];
            this.removeQueue = []; this.blastQueue = [];
        }

        /* Đặt viên tiếp theo lên ná. Lúc này bi CHƯA phải vật thể vật lý —
           nếu là vật thể thật thì nó rơi khỏi ná trong lúc bé còn đang ngắm. */
        arm() {
            if (!this.queue.length) { this.armed = null; return; }
            this.armed = { type: this.queue[0], x: SLING_X, y: SLING_Y };
            this.usedPower = false;
            UI.updateHud(this);
        }

        /* ---------------- ngắm bắn ---------------- */
        onDown(p) {
            if (this.state === 'flying') { this.tryPower(); return; }
            if (this.state !== 'aim' || !this.armed) return;
            var d = Phaser.Math.Distance.Between(p.worldX, p.worldY, this.armed.x, this.armed.y);
            /* Bé 4-5 tuổi khó chạm trúng viên bi, nên cả nửa trái sân đều bắt
               được thao tác kéo, không chỉ đúng viên bi. */
            if (d > 170 && p.worldX > 560) return;
            this.dragging = true;
            Sfx.ctx();
            this.onMove(p);
        }

        onMove(p) {
            if (!this.dragging || !this.armed) return;
            var dx = p.worldX - SLING_X, dy = p.worldY - SLING_Y;
            var len = Math.hypot(dx, dy);
            if (len > MAX_PULL) { dx = dx / len * MAX_PULL; dy = dy / len * MAX_PULL; len = MAX_PULL; }
            /* chỉ cho kéo về phía sau và xuống dưới, đúng như ná thật */
            if (dx > 40) dx = 40;
            this.armed.x = SLING_X + dx;
            this.armed.y = SLING_Y + dy;
            if (len > 20 && (this.stretchTick || 0) < this.time.now) {
                this.stretchTick = this.time.now + 110;
                Sfx.stretch();
            }
        }

        onUp() {
            if (!this.dragging || !this.armed) return;
            this.dragging = false;
            var dx = SLING_X - this.armed.x, dy = SLING_Y - this.armed.y;
            var pull = Math.hypot(dx, dy);
            if (pull < 14) { this.armed.x = SLING_X; this.armed.y = SLING_Y; return; }

            var spec = AMMO[this.armed.type];
            var ball = this.spawnBall(this.armed.x, this.armed.y, this.armed.type, spec.r);
            M.Body.setVelocity(ball.body, { x: dx * LAUNCH_K, y: dy * LAUNCH_K });

            this.queue.shift();
            this.armed = null;
            this.state = 'flying';
            this.shotAt = this.time.now;
            this.cameras.main.shake(90, 0.003);
            Sfx.launch();
            UI.updateHud(this);
        }

        spawnBall(x, y, type, r) {
            var spec = AMMO[type];
            var body = this.matter.add.circle(x, y, r, {
                density: spec.density, friction: 0.35, frictionAir: AIR,
                restitution: 0.42, label: 'ball'
            });
            var e = { kind: 'ball', r: r, type: type, body: body, dead: false, trail: [] };
            body.kibu = e;
            this.balls.push(e);
            return e;
        }

        /* Chạm màn hình giữa lúc bay = kích hoạt phép của viên bi */
        tryPower() {
            if (this.usedPower) return;
            var b = this.balls[0], spec, i, ang, sp, nb;
            if (!b || b.dead) return;
            spec = AMMO[b.type];
            if (!spec.power) return;
            this.usedPower = true;

            if (spec.power === 'bomb') {
                this.blastQueue.push({ x: b.body.position.x, y: b.body.position.y, r: 190, power: 15, dmg: 150 });
                this.killBall(b);
            } else if (spec.power === 'split') {
                var vx = b.body.velocity.x, vy = b.body.velocity.y;
                var px = b.body.position.x, py = b.body.position.y;
                this.killBall(b);
                sp = Math.hypot(vx, vy);
                ang = Math.atan2(vy, vx);
                for (i = -1; i <= 1; i++) {
                    nb = this.spawnBall(px + i * 26, py - 14, 'split', 13);
                    M.Body.setVelocity(nb.body, {
                        x: Math.cos(ang + i * 0.30) * sp * 1.02,
                        y: Math.sin(ang + i * 0.30) * sp * 1.02
                    });
                }
                Sfx.split();
                this.burst(px, py, 0x8fe07a, 14, 200);
            } else if (spec.power === 'thunder') {
                M.Body.setVelocity(b.body, { x: b.body.velocity.x * 0.55, y: 27 });
                Sfx.dive();
                this.burst(b.body.position.x, b.body.position.y, 0xffd34d, 16, 240);
                this.cameras.main.flash(120, 255, 235, 120);
            }
        }

        killBall(b) {
            if (b.dead) return;
            b.dead = true;
            this.removeQueue.push(b);
        }

        /* ---------------- va chạm & sát thương ---------------- */
        applyHit(body, dmg, pair) {
            var e = body.kibu, cx, cy;
            if (!e || e.dead) return;
            if (e.kind === 'ball') return;                     /* bi không có máu */

            cx = pair.collision && pair.collision.supports && pair.collision.supports[0]
                ? pair.collision.supports[0].x : body.position.x;
            cy = pair.collision && pair.collision.supports && pair.collision.supports[0]
                ? pair.collision.supports[0].y : body.position.y;

            e.hp -= dmg;

            if (e.kind === 'terrain') return;           /* đá và đệm không phá được */
            if (e.kind === 'balloon') { this.popBalloon(e); return; }

            if (e.kind === 'target') {
                e.hurt = 1;
                if (e.hp <= 0) { this.popTarget(e, cx, cy); }
                else if (dmg > 12) { Sfx.thud(); }
                return;
            }

            /* khối */
            if (e.hp <= 0) this.breakBlock(e, cx, cy);
            else if (dmg > 22) { Sfx.thud(); this.burst(cx, cy, MAT[e.m].dark, 4, 90); }
        }

        breakBlock(e, x, y) {
            if (e.dead) return;
            e.dead = true;
            this.removeQueue.push(e);
            this.score += MAT[e.m].pts;
            Sfx.crack(e.m);
            this.burst(x, y, MAT[e.m].fill, e.m === 'ice' ? 20 : 13, e.m === 'ice' ? 260 : 180);
            if (e.m === 'tnt') {
                this.blastQueue.push({ x: e.body.position.x, y: e.body.position.y, r: 200, power: 16, dmg: 170 });
            }
        }

        /* Nổ bóng bay: cắt dây, ngôi nhà đang treo rơi tự do */
        popBalloon(e, silent) {
            if (e.dead) return;
            e.dead = true;
            this.removeQueue.push(e);
            if (e.host && !e.host.dead) {
                e.host.holders--;
                if (e.host.holders <= 0) M.Body.setStatic(e.host.body, false);
            }
            if (!silent) {
                Sfx.crack('ice');
                this.burst(e.body.position.x, e.body.position.y, BALLOON_COLORS[e.hue], 18, 240);
                this.score += 60;
            }
        }

        popTarget(e, x, y) {
            if (e.dead) return;
            e.dead = true;
            this.removeQueue.push(e);
            this.score += 1000;
            Sfx.pop();
            this.burst(x, y, 0x7ee081, 22, 300);
            this.floatText(e.body.position.x, e.body.position.y, '+1000');
            this.cameras.main.shake(140, 0.006);
        }

        /* ---------------- nổ ---------------- */
        blast(x, y, radius, power, dmg) {
            var bodies = this.matter.world.localWorld.bodies, i, b, dx, dy, d, f, e;
            Sfx.boom();
            this.cameras.main.shake(320, 0.014);
            this.cameras.main.flash(180, 255, 190, 120);
            this.burst(x, y, 0xffb020, 34, 420);
            this.burst(x, y, 0xff5b3d, 26, 320);
            this.ring(x, y, radius);

            for (i = 0; i < bodies.length; i++) {
                b = bodies[i];
                if (b.isStatic) continue;
                dx = b.position.x - x; dy = b.position.y - y;
                d = Math.hypot(dx, dy);
                if (d > radius || d < 0.001) continue;
                f = 1 - d / radius;
                M.Body.setVelocity(b, {
                    x: b.velocity.x + (dx / d) * power * f,
                    y: b.velocity.y + (dy / d) * power * f - power * 0.25 * f
                });
                e = b.kibu;
                if (e && !e.dead && e.kind === 'balloon') { this.blastQueue.push(null); this.popBalloon(e); continue; }
                if (e && !e.dead && e.kind !== 'ball' && e.kind !== 'terrain') {
                    e.hp -= dmg * f;
                    if (e.hp <= 0) {
                        if (e.kind === 'target') this.popTarget(e, b.position.x, b.position.y);
                        else this.breakBlock(e, b.position.x, b.position.y);
                    }
                }
            }
        }

        /* ---------------- hiệu ứng ---------------- */
        burst(x, y, color, n, speed) {
            var em = this.add.particles(x, y, 'sb-px', {
                speed: { min: speed * 0.25, max: speed },
                angle: { min: 0, max: 360 },
                lifespan: { min: 260, max: 700 },
                scale: { start: 1.15, end: 0 },
                gravityY: 520,
                tint: color,
                emitting: false
            }).setDepth(7);
            em.explode(n);
            this.time.delayedCall(1000, function () { em.destroy(); });
        }

        ring(x, y, r) {
            var c = this.add.circle(x, y, 10, 0xffd8a0, 0.55).setDepth(7);
            this.tweens.add({
                targets: c, radius: r, alpha: 0, duration: 380, ease: 'Cubic.Out',
                onUpdate: function (tw, t) { t.setRadius(t.radius); },
                onComplete: function () { c.destroy(); }
            });
        }

        floatText(x, y, txt) {
            var t = this.add.text(x, y, txt, {
                fontFamily: 'Baloo 2, Fredoka, sans-serif', fontSize: '30px',
                color: '#ffe27a', stroke: '#4a2a00', strokeThickness: 5
            }).setOrigin(0.5).setDepth(9);
            this.tweens.add({
                targets: t, y: y - 70, alpha: 0, duration: 900, ease: 'Cubic.Out',
                onComplete: function () { t.destroy(); }
            });
        }

        /* ---------------- vòng lặp ---------------- */
        update(time, delta) {
            var i, e, b, blast;

            /* nổ đã xếp hàng từ khung trước */
            while (this.blastQueue.length) {
                blast = this.blastQueue.shift();
                if (blast) this.blast(blast.x, blast.y, blast.r, blast.power, blast.dmg);
            }

            /* dọn vật thể đã chết */
            while (this.removeQueue.length) {
                e = this.removeQueue.shift();
                this.matter.world.remove(e.body);
                if (e.kind === 'block') this.blocks.splice(this.blocks.indexOf(e), 1);
                else if (e.kind === 'target') this.targets.splice(this.targets.indexOf(e), 1);
                else if (e.kind === 'balloon') this.balloons.splice(this.balloons.indexOf(e), 1);
                else this.balls.splice(this.balls.indexOf(e), 1);
            }

            /* rơi ra khỏi thế giới thì coi như xong đời */
            for (i = this.blocks.length - 1; i >= 0; i--) {
                b = this.blocks[i].body;
                if (b.position.y > H + 260 || b.position.x < -240 || b.position.x > W + 420) {
                    this.blocks[i].dead = true;
                    this.removeQueue.push(this.blocks[i]);
                }
            }
            for (i = this.targets.length - 1; i >= 0; i--) {
                b = this.targets[i].body;
                if (b.position.y > H + 200 || b.position.x < -240 || b.position.x > W + 420) {
                    this.popTarget(this.targets[i], b.position.x, Math.min(b.position.y, H - 40));
                }
            }
            for (i = this.balls.length - 1; i >= 0; i--) {
                b = this.balls[i].body;
                if (b.position.y > H + 200 || b.position.x < -240 || b.position.x > W + 420) {
                    this.killBall(this.balls[i]);
                }
            }


            /* vệt đuôi bi */
            for (i = 0; i < this.balls.length; i++) {
                e = this.balls[i];
                e.trail.push({ x: e.body.position.x, y: e.body.position.y });
                if (e.trail.length > 16) e.trail.shift();
            }

            if (this.state === 'flying') this.checkShotEnd(time);

            this.render();
        }

        /* Kết thúc lượt bắn: thắng ngay khi hết Grumpy, còn thua thì phải đợi
           mọi thứ đứng yên — một khối đang rơi vẫn có thể đè trúng con cuối. */
        checkShotEnd(time) {
            var self = this;
            if (!this.targets.length) {
                this.state = 'ending';
                this.matter.world.engine.timing.timeScale = 0.32;
                this.cameras.main.flash(220, 255, 255, 200);
                this.time.delayedCall(950, function () {
                    self.matter.world.engine.timing.timeScale = 1;
                    self.finish(true);
                });
                return;
            }

            /* Chỉ cần cả sân đứng yên là xong lượt. Đừng đòi thêm điều kiện
               "hết bi trên sân": viên bi nằm ngủ trên mặt đất không bao giờ tự
               biến mất, đợi nó thì lượt nào cũng phải chờ đủ 7 giây chốt chặn. */
            var moving = this.maxSpeed();
            var elapsed = time - this.shotAt;

            /* 7 giây là chốt chặn: có màn khối lăn tròn mãi không chịu dừng */
            if ((moving < 1.15 && elapsed > 900) || elapsed > 7000) {
                if (this.queue.length) {
                    this.state = 'aim';
                    this.clearSpentBalls();
                    this.arm();
                } else {
                    this.state = 'ending';
                    this.time.delayedCall(260, function () { self.finish(false); });
                }
            }
        }

        /* Bi đã nằm im thì dọn đi cho sân đỡ rối và đỡ tốn vòng tính va chạm */
        clearSpentBalls() {
            var i;
            for (i = this.balls.length - 1; i >= 0; i--) {
                this.burst(this.balls[i].body.position.x, this.balls[i].body.position.y,
                    AMMO[this.balls[i].type].fill, 6, 90);
                this.killBall(this.balls[i]);
            }
        }

        maxSpeed() {
            var bodies = this.matter.world.localWorld.bodies, i, s, mx = 0;
            for (i = 0; i < bodies.length; i++) {
                if (bodies[i].isStatic) continue;
                s = Math.hypot(bodies[i].velocity.x, bodies[i].velocity.y);
                if (s > mx) mx = s;
            }
            return mx;
        }

        finish(won) {
            this.matter.world.pause();
            if (won) {
                /* mỗi viên chưa dùng đổi thành 1000 điểm và một ngôi sao */
                var left = this.queue.length;
                this.score += left * 1000;
                var stars = left >= 2 ? 3 : (left === 1 ? 2 : 1);
                Sfx.win();
                UI.won(this.levelIndex, stars, this.score);
            } else {
                Sfx.lose();
                UI.lost(this.targets.length);
            }
        }

        /* ---------------- vẽ ---------------- */
        render() {
            var g = this.gfx, i, e, b, t, spec;
            g.clear();

            /* --- ná --- */
            this.drawSling(g);

            /* --- địa hình cố định: tường đá và đệm nhún --- */
            for (i = 0; i < this.terrain.length; i++) {
                e = this.terrain[i]; b = e.body;
                g.save();
                g.translateCanvas(b.position.x, b.position.y);
                if (e.pad) {
                    g.fillStyle(0x2f8f4a, 1);
                    g.fillRoundedRect(-e.w / 2, -e.h / 2, e.w, e.h, 8);
                    g.fillStyle(0x7ee081, 1);
                    g.fillRoundedRect(-e.w / 2, -e.h / 2, e.w, e.h * 0.55, 8);
                    /* mấy nếp lò xo cho bé nhìn là biết chỗ này nảy */
                    g.lineStyle(3, 0x1c5c2e, 1);
                    for (t = 0; t < 4; t++) {
                        g.beginPath();
                        g.moveTo(-e.w / 2 + 6 + t * (e.w - 12) / 3.4, e.h / 2 - 3);
                        g.lineTo(-e.w / 2 + 14 + t * (e.w - 12) / 3.4, -e.h / 2 + 6);
                        g.strokePath();
                    }
                } else {
                    g.fillStyle(0x6b7480, 1);
                    g.fillRoundedRect(-e.w / 2, -e.h / 2, e.w, e.h, 7);
                    g.fillStyle(0x8a94a1, 1);
                    g.fillRoundedRect(-e.w / 2, -e.h / 2, e.w, Math.min(12, e.h * 0.35), 7);
                    g.lineStyle(3, 0x49525c, 1);
                    g.strokeRoundedRect(-e.w / 2, -e.h / 2, e.w, e.h, 7);
                }
                g.restore();
            }

            /* --- chân ghim của bập bênh --- */
            for (i = 0; i < this.pins.length; i++) {
                g.fillStyle(0x5c6b78, 1);
                g.fillTriangle(this.pins[i].x - 24, this.pins[i].y + 42,
                               this.pins[i].x + 24, this.pins[i].y + 42,
                               this.pins[i].x, this.pins[i].y - 2);
                g.fillStyle(0x39424b, 1);
                g.fillCircle(this.pins[i].x, this.pins[i].y, 7);
            }

            /* --- khối --- */
            for (i = 0; i < this.blocks.length; i++) {
                e = this.blocks[i]; b = e.body;
                spec = MAT[e.m];
                t = 1 - Math.max(0, e.hp) / e.maxHp;
                g.save();
                g.translateCanvas(b.position.x, b.position.y);
                g.rotateCanvas(b.angle);
                g.fillStyle(spec.fill, 1);
                g.fillRoundedRect(-e.w / 2, -e.h / 2, e.w, e.h, Math.min(6, e.h / 3));
                /* càng gần vỡ càng sạm đi, bé nhìn là biết sắp gãy */
                if (t > 0.02) {
                    g.fillStyle(0x000000, t * 0.42);
                    g.fillRoundedRect(-e.w / 2, -e.h / 2, e.w, e.h, Math.min(6, e.h / 3));
                }
                g.lineStyle(3, spec.dark, 1);
                g.strokeRoundedRect(-e.w / 2, -e.h / 2, e.w, e.h, Math.min(6, e.h / 3));
                if (e.m === 'tnt') {
                    g.fillStyle(0xffe27a, 1);
                    g.fillRect(-e.w / 2 + 5, -4, e.w - 10, 8);
                    g.fillStyle(0x9d2510, 1);
                    g.fillCircle(0, 0, 3);
                }
                if (t > 0.45) {   /* rạn nứt */
                    g.lineStyle(2, spec.dark, 0.9);
                    g.beginPath();
                    g.moveTo(-e.w / 4, -e.h / 2);
                    g.lineTo(-e.w / 8, 0);
                    g.lineTo(-e.w / 3, e.h / 4);
                    g.strokePath();
                }
                g.restore();
            }

            /* --- Grumpy --- */
            for (i = 0; i < this.targets.length; i++) {
                e = this.targets[i]; b = e.body;
                t = 1 - Math.max(0, e.hp) / e.maxHp;
                g.save();
                g.translateCanvas(b.position.x, b.position.y);
                g.rotateCanvas(b.angle);
                g.fillStyle(lerpColor(0x63d16f, 0xd2603f, t), 1);
                g.fillCircle(0, 0, e.r);
                g.lineStyle(3, 0x24552b, 1);
                g.strokeCircle(0, 0, e.r);
                /* mắt */
                g.fillStyle(0xffffff, 1);
                g.fillCircle(-8, -5, 7); g.fillCircle(8, -5, 7);
                g.fillStyle(0x14251a, 1);
                g.fillCircle(-7, -4, 3.4); g.fillCircle(9, -4, 3.4);
                /* lông mày cau có */
                g.lineStyle(3, 0x14251a, 1);
                g.beginPath(); g.moveTo(-15, -15); g.lineTo(-3, -10); g.strokePath();
                g.beginPath(); g.moveTo(15, -15); g.lineTo(3, -10); g.strokePath();
                /* miệng */
                g.lineStyle(3, 0x14251a, 1);
                g.beginPath(); g.moveTo(-7, 11); g.lineTo(7, 11); g.strokePath();
                g.restore();
            }

            /* --- bóng bay và sợi dây --- */
            for (i = 0; i < this.balloons.length; i++) {
                e = this.balloons[i]; b = e.body;
                if (e.host && !e.host.dead) {
                    g.lineStyle(2, 0xffffff, 0.8);
                    g.beginPath();
                    g.moveTo(b.position.x, b.position.y + e.r);
                    g.lineTo(e.host.body.position.x, e.host.body.position.y);
                    g.strokePath();
                }
                g.fillStyle(BALLOON_COLORS[e.hue], 1);
                g.fillEllipse(b.position.x, b.position.y, e.r * 2, e.r * 2.25);
                g.fillStyle(0xffffff, 0.45);
                g.fillEllipse(b.position.x - e.r * 0.3, b.position.y - e.r * 0.45, e.r * 0.5, e.r * 0.62);
                g.fillStyle(BALLOON_COLORS[e.hue], 1);
                g.fillTriangle(b.position.x - 5, b.position.y + e.r * 1.06,
                               b.position.x + 5, b.position.y + e.r * 1.06,
                               b.position.x, b.position.y + e.r * 1.35);
            }

            /* --- bi đang bay + vệt đuôi --- */
            for (i = 0; i < this.balls.length; i++) {
                e = this.balls[i];
                this.drawTrail(g, e);
                this.drawBall(g, e.body.position.x, e.body.position.y, e.r, e.type, e.body.angle);
            }

            /* --- bi trên ná + đường ngắm --- */
            if (this.armed) {
                if (this.dragging) this.drawAim(g);
                this.drawBand(g, TIP_R);
                this.drawBall(g, this.armed.x, this.armed.y, AMMO[this.armed.type].r, this.armed.type, 0);
                this.drawBand(g, TIP_L);
            }
        }

        drawTrail(g, e) {
            var i, p, a;
            for (i = 0; i < e.trail.length; i++) {
                p = e.trail[i];
                a = (i / e.trail.length) * 0.4;
                g.fillStyle(AMMO[e.type].fill, a);
                g.fillCircle(p.x, p.y, e.r * (0.25 + 0.5 * i / e.trail.length));
            }
        }

        drawBall(g, x, y, r, type, angle) {
            var spec = AMMO[type];
            g.save();
            g.translateCanvas(x, y);
            g.rotateCanvas(angle || 0);
            g.fillStyle(spec.fill, 1);
            g.fillCircle(0, 0, r);
            g.lineStyle(3, spec.dark, 1);
            g.strokeCircle(0, 0, r);
            if (type !== 'rock') {
                g.fillStyle(0xffffff, 0.55);
                g.fillCircle(-r * 0.32, -r * 0.34, r * 0.26);
            }
            if (type === 'rock') {
                /* Chú lợn hồng: hai tai, mõm tròn, má ửng. Vẽ sau vòng tròn nền
                   nên nằm đè lên, và quay theo viên bi cho vui mắt. */
                g.fillStyle(spec.fill, 1);
                g.fillCircle(0, 0, r);
                g.lineStyle(3, spec.dark, 1);
                g.strokeCircle(0, 0, r);
                g.fillStyle(0xff85b6, 0.5);
                g.fillCircle(-r * 0.58, r * 0.22, r * 0.19);
                g.fillCircle(r * 0.58, r * 0.22, r * 0.19);
                g.fillStyle(0xffffff, 1);
                g.fillCircle(-r * 0.34, -r * 0.28, r * 0.21);
                g.fillCircle(r * 0.34, -r * 0.28, r * 0.21);
                g.fillStyle(0x3b1420, 1);
                g.fillCircle(-r * 0.3, -r * 0.27, r * 0.11);
                g.fillCircle(r * 0.38, -r * 0.27, r * 0.11);
                g.fillStyle(0xff9bc4, 1);
                g.fillEllipse(0, r * 0.3, r * 0.66, r * 0.46);
                g.lineStyle(2, spec.dark, 1);
                g.strokeEllipse(0, r * 0.3, r * 0.66, r * 0.46);
                g.fillStyle(0x8c3358, 1);
                g.fillCircle(-r * 0.14, r * 0.3, r * 0.08);
                g.fillCircle(r * 0.14, r * 0.3, r * 0.08);
            } else if (type === 'bomb') {
                g.lineStyle(3, 0x3a1206, 1);
                g.beginPath(); g.moveTo(0, -r); g.lineTo(4, -r - 9); g.strokePath();
                g.fillStyle(0xffd34d, 1); g.fillCircle(5, -r - 11, 3.5);
            } else if (type === 'thunder') {
                g.fillStyle(0x7a4a00, 1);
                g.fillTriangle(-4, -8, 5, -1, -1, -1);
                g.fillTriangle(1, 8, -5, 1, 1, 1);
            } else if (type === 'split') {
                g.fillStyle(0x1d5c24, 1);
                g.fillCircle(-5, 2, 3); g.fillCircle(5, 2, 3); g.fillCircle(0, -5, 3);
            }
            g.restore();
        }

        /* Chạc ná hình chữ Y: một thân đứng, hai gọng chụm vào nhau ở FORK_Y.
           Vẽ ba thanh song song rời nhau như trước thì nhìn ra ba cây cọc,
           không ra cái ná. */
        drawSling(g) {
            g.fillStyle(0x6b4423, 1);
            g.fillRoundedRect(SLING_X - 13, FORK_Y - 8, 26, GROUND_Y - FORK_Y + 6, 9);
            this.limb(g, -ARM_A);
            this.limb(g, ARM_A);
            g.fillCircle(SLING_X, FORK_Y, 14);
            g.fillStyle(0x8a5a2e, 0.5);         /* vệt sáng dọc thân cho đỡ bẹt */
            g.fillRoundedRect(SLING_X - 8, FORK_Y - 4, 6, GROUND_Y - FORK_Y - 6, 3);
            g.fillStyle(0x4a2c14, 1);
            g.fillRoundedRect(SLING_X - 30, GROUND_Y - 15, 60, 19, 7);
        }

        limb(g, ang) {
            g.save();
            g.translateCanvas(SLING_X, FORK_Y);
            g.rotateCanvas(ang);
            g.fillRoundedRect(-9, -ARM_LEN, 18, ARM_LEN + 12, 8);
            g.restore();
        }

        /* Dây sau vẽ trước viên bi, dây trước vẽ sau — có trước có sau thì
           viên bi mới nằm trong bọc da chứ không dán đè lên dây. */
        drawBand(g, tip) {
            var a = this.armed;
            g.lineStyle(9, 0x8b3a2a, 1);
            g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(a.x, a.y); g.strokePath();
            g.fillStyle(0x8b3a2a, 1);
            g.fillCircle(tip.x, tip.y, 5);
        }

        /* Đường ngắm: mô phỏng đúng công thức trọng lực của Matter nên chấm
           ngắm nằm ngay trên đường bay thật, không phải áng chừng. */
        drawAim(g) {
            var a = this.armed;
            var vx = (SLING_X - a.x) * LAUNCH_K, vy = (SLING_Y - a.y) * LAUNCH_K;
            var x = a.x, y = a.y, i, alpha;
            g.fillStyle(0xffffff, 1);
            for (i = 0; i < 150; i++) {
                vx *= (1 - AIR); vy *= (1 - AIR);
                vy += G_STEP;
                x += vx; y += vy;
                if (y > GROUND_Y || x > W) break;
                if (i % 5 === 0) {
                    alpha = 0.85 - i / 190;
                    if (alpha <= 0.05) break;
                    g.fillStyle(0xffffff, alpha);
                    g.fillCircle(x, y, 4.5 - i / 70);
                }
            }
            /* mũi tên chỉ lực kéo */
            var pull = Math.hypot(SLING_X - a.x, SLING_Y - a.y) / MAX_PULL;
            g.lineStyle(4, lerpColor(0x7ee081, 0xff5b3d, pull), 0.9);
            g.beginPath(); g.moveTo(a.x, a.y);
            g.lineTo(a.x + (SLING_X - a.x) * 0.42, a.y + (SLING_Y - a.y) * 0.42);
            g.strokePath();
        }

        /* Cổng gỡ lỗi cho kiểm thử tự động, chỉ mở khi địa chỉ có ?debug=1 */
        debugFire(vx, vy) {
            if (this.state !== 'aim' || !this.armed) return false;
            var spec = AMMO[this.armed.type];
            var ball = this.spawnBall(SLING_X, SLING_Y, this.armed.type, spec.r);
            M.Body.setVelocity(ball.body, { x: vx, y: vy });
            this.queue.shift();
            this.armed = null;
            this.state = 'flying';
            this.shotAt = this.time.now;
            UI.updateHud(this);
            return true;
        }
    }

    /* Vận tốc tương đối lúc chạm nhau */
    function relVel(a, b) {
        return Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
    }

    /* Khối lượng hiệu dụng của cú va: vật tĩnh coi như nặng vô hạn */
    function effMass(a, b) {
        var ma = a.isStatic ? Infinity : a.mass;
        var mb = b.isStatic ? Infinity : b.mass;
        if (!isFinite(ma) && !isFinite(mb)) return 0;
        if (!isFinite(ma)) return mb;
        if (!isFinite(mb)) return ma;
        return (ma * mb) / (ma + mb);
    }

    /* ================================================================== *
     * 6. NỐI VỚI CÁC BẢNG HTML
     * ================================================================== */

    var UI = {
        game: null,
        scene: null,
        pending: null,
        chapter: 0,       /* chương đang mở trong bảng chọn màn */       /* màn cần mở ngay khi scene sẵn sàng */

        init: function () {
            var self = this;
            Save.load();

            $('btn-play').addEventListener('click', function () { self.showLevels(); });
            $('btn-levels-back').addEventListener('click', function () {
                $('levels-overlay').classList.add('hidden');
                $('menu-overlay').classList.remove('hidden');
            });
            $('btn-reset-progress').addEventListener('click', function () {
                Save.reset();
                self.buildLevelGrid();
            });
            $('btn-next').addEventListener('click', function () {
                var n = self.currentLevel + 1;
                if (n >= LEVELS.length) { self.showAllDone(); return; }
                self.hideOverlays();
                self.play(n);
            });
            $('btn-replay').addEventListener('click', function () { self.hideOverlays(); self.play(self.currentLevel); });
            $('btn-finish').addEventListener('click', function () { self.showAllDone(); });
            $('btn-win-levels').addEventListener('click', function () { self.showLevels(); });
            $('btn-lose-retry').addEventListener('click', function () { self.hideOverlays(); self.play(self.currentLevel); });
            $('btn-lose-levels').addEventListener('click', function () { self.showLevels(); });
            $('btn-all-levels').addEventListener('click', function () { self.showLevels(); });
            $('btn-nav-levels').addEventListener('click', function () { self.showLevels(); });
            $('btn-nav-retry').addEventListener('click', function () {
                if (self.scene && self.currentLevel != null) { self.hideOverlays(); self.play(self.currentLevel); }
            });

            this.buildLevelGrid();
            /* Bảng chào đang mở sẵn lúc vào trang, mà syncHint chỉ chạy khi có
               người bấm — không gọi ở đây thì lời nhắc hiện xuyên qua nó. */
            this.syncHint();
        },

        OVERLAYS: ['menu-overlay', 'levels-overlay', 'win-overlay', 'lose-overlay', 'all-overlay'],

        hideOverlays: function () {
            this.OVERLAYS.forEach(function (id) { $(id).classList.add('hidden'); });
            this.syncHint();
        },

        /* Lời nhắc xoay máy nằm dưới lớp bảng phủ nên khi có bảng nó vẫn hiện
           mờ mờ xuyên qua. Có bảng thì giấu hẳn đi. */
        syncHint: function () {
            var open = this.OVERLAYS.some(function (id) {
                return !$(id).classList.contains('hidden');
            });
            $('rotate-hint').hidden = open;
        },

        showLevels: function () {
            if (this.currentLevel != null) this.chapter = chapterOf(this.currentLevel);
            this.hideOverlays();
            this.buildLevelGrid();
            $('levels-overlay').classList.remove('hidden');
            UI.syncHint();
            $('hud').classList.add('hidden');
            if (this.scene) this.scene.matter.world.pause();
        },

        showAllDone: function () {
            this.hideOverlays();
            $('all-stars').textContent = '★ ' + Save.totalStars() + ' / ' + (LEVELS.length * 3);
            this.chapter = 0;
            $('all-overlay').classList.remove('hidden');
            UI.syncHint();
            $('hud').classList.add('hidden');
        },

        buildLevelGrid: function () {
            var grid = $('level-grid'), self = this, i, btn, stars, locked, s;

            /* thanh chương: mở khoá theo màn đầu của chương đó */
            var tabs = $('chapter-tabs'), c, tab, need, got, k;
            tabs.innerHTML = '';
            for (c = 0; c < CHAPTERS.length; c++) {
                need = CHAPTERS[c].from + 1;
                locked = need > Save.data.unlocked;
                got = 0;
                for (k = CHAPTERS[c].from; k < CHAPTERS[c].from + 12; k++) got += Save.data.stars[String(k)] || 0;
                tab = document.createElement('button');
                tab.className = 'ch-tab' + (c === this.chapter ? ' is-on' : '') + (locked ? ' locked' : '');
                tab.appendChild(document.createTextNode(locked ? '🔒 ' + CHAPTERS[c].name : CHAPTERS[c].name));
                s = document.createElement('span');
                s.className = 'ch-stars';
                s.textContent = locked ? '' : '★' + got + '/36';
                tab.appendChild(s);
                if (!locked) {
                    tab.addEventListener('click', (function (idx) {
                        return function () { self.chapter = idx; self.buildLevelGrid(); };
                    }(c)));
                }
                tabs.appendChild(tab);
            }

            var from = CHAPTERS[this.chapter].from;
            grid.innerHTML = '';
            for (i = from; i < from + 12 && i < LEVELS.length; i++) {
                stars = Save.data.stars[String(i)] || 0;
                locked = (i + 1) > Save.data.unlocked;
                btn = document.createElement('button');
                btn.className = 'lv' + (locked ? ' locked' : '') + (stars ? ' done' : '');
                s = document.createElement('span');
                s.className = 'lv-num';
                s.textContent = locked ? '🔒' : String(i - from + 1);
                btn.appendChild(s);
                s = document.createElement('span');
                s.className = 'lv-stars';
                s.textContent = stars ? '★'.repeat(stars) : '';
                btn.appendChild(s);
                if (!locked) {
                    btn.addEventListener('click', (function (idx) {
                        return function () { self.hideOverlays(); self.play(idx); };
                    }(i)));
                }
                grid.appendChild(btn);
            }
        },

        /* Tạo Phaser ở lần chơi đầu; những lần sau chỉ nạp lại màn */
        play: function (idx) {
            this.currentLevel = idx;
            Sfx.ctx();
            $('hud').classList.remove('hidden');
            if (!this.game) {
                this.pending = idx;
                this.game = new Phaser.Game({
                    type: Phaser.AUTO,
                    parent: 'game-canvas',
                    width: W, height: H,
                    backgroundColor: '#8fd3f4',
                    /* KHÔNG dùng autoCenter của Phaser: .board-host đã là flex
                       căn giữa rồi, hai cơ chế cùng căn thì lệch nhau. */
                    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.NO_CENTER },
                    physics: {
                        default: 'matter',
                        matter: { gravity: { y: GRAVITY_Y }, debug: false }
                    },
                    scene: [PlayScene],
                    banner: false
                });
            } else {
                this.scene.loadLevel(idx);
            }
        },

        sceneReady: function (scene) {
            this.scene = scene;
            if (this.pending != null) {
                var p = this.pending;
                this.pending = null;
                scene.loadLevel(p);
            }
            exposeDebug();
        },

        levelStarted: function (idx, L) {
            $('hud-level').textContent = 'Level ' + (idx % 12 + 1);
            $('hud-chapter').textContent = CHAPTERS[chapterOf(idx)].name;
            $('hud-name').textContent = L.name;
            this.updateHud(this.scene);
            var tip = $('tip');
            tip.textContent = L.tip;
            tip.classList.remove('hidden');
            clearTimeout(this.tipTimer);
            this.tipTimer = setTimeout(function () { tip.classList.add('hidden'); }, 3600);
        },

        updateHud: function (scene) {
            if (!scene) return;
            $('hud-targets').textContent = String(scene.targets.length);
            var box = $('hud-balls'), i, d, all = LEVELS[scene.levelIndex].ammo;
            box.innerHTML = '';
            for (i = 0; i < all.length; i++) {
                d = document.createElement('span');
                /* viên còn lại nằm ở cuối danh sách, nên các viên đã bắn là
                   những viên đầu tiên */
                d.className = 'ball-dot ' + all[i] + (i < all.length - scene.queue.length ? ' spent' : '');
                box.appendChild(d);
            }
        },

        won: function (idx, stars, score) {
            Save.record(idx, stars, score);
            var box = $('win-stars'), i, s;
            box.innerHTML = '';
            for (i = 0; i < 3; i++) {
                s = document.createElement('span');
                s.className = 'star' + (i < stars ? ' lit' : '');
                s.textContent = '★';
                box.appendChild(s);
            }
            $('win-score').textContent = String(score);
            $('win-best').textContent = String(Save.data.best[String(idx)] || score);
            var last = (idx + 1 >= LEVELS.length);
            $('btn-next').hidden = last;
            $('btn-finish').hidden = !last;
            $('win-overlay').classList.remove('hidden');
            UI.syncHint();
        },

        lost: function (left) {
            $('lose-note').textContent = left === 1
                ? 'One Grumpy is still standing. Try a different angle!'
                : 'A few Grumpies are still standing. Try a different angle!';
            $('lose-overlay').classList.remove('hidden');
            UI.syncHint();
        }
    };

    /* Cổng gỡ lỗi, chỉ mở khi địa chỉ có ?debug=1 — dùng cho kiểm thử tự động.
       Người chơi bình thường không chạm tới và nó không cho gian lận điểm. */
    function exposeDebug() {
        if (!/[?&]debug=1/.test(location.search)) return;
        window.SB = {
            scene: function () { return UI.scene; },
            state: function () {
                var s = UI.scene;
                return {
                    level: s.levelIndex, state: s.state, score: s.score,
                    targets: s.targets.length, blocks: s.blocks.length,
                    balls: s.balls.length, queue: s.queue.slice()
                };
            },
            load: function (i) { UI.hideOverlays(); UI.play(i); },
            fire: function (vx, vy) { return UI.scene.debugFire(vx, vy); },
            power: function () { UI.scene.tryPower(); },
            levels: LEVELS.length,
            /* Toạ độ khai báo của màn, chưa qua engine. Đo sau khi Matter đã
               chạy vài khung thì mọi chỗ tiếp xúc đều lún 1-2 px, không phân
               biệt được lỗi dựng màn với lún bình thường. */
            declared: function (i) {
                return { blocks: LEVELS[i].blocks || [], targets: LEVELS[i].targets,
                         terrain: LEVELS[i].terrain || [], pivots: LEVELS[i].pivots || [],
                         balloons: LEVELS[i].balloons || [] };
            },
            chapters: CHAPTERS.map(function (c) { return c.name; }),
            /* kiểm tra không có khối nào chồng lên khối nào lúc mới dựng màn */
            overlaps: function () {
                var bs = UI.scene.blocks, out = [], i, j, a, b;
                for (i = 0; i < bs.length; i++) {
                    for (j = i + 1; j < bs.length; j++) {
                        a = bs[i].body.bounds; b = bs[j].body.bounds;
                        var ox = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
                        var oy = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
                        if (ox > 1.5 && oy > 1.5) out.push([i, j, Math.round(ox), Math.round(oy)]);
                    }
                }
                return out;
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { UI.init(); });
    } else {
        UI.init();
    }
}());
