/* Kịch bản dựng cảnh để chụp ảnh App Store — CHỈ chèn tạm lúc chụp, không
   nằm trong bản nộp. Chạy theo đồng hồ vì bên ngoài không gọi được vào trang. */
(function () {
    var q = function (s) { return document.querySelector(s); };
    var click = function (s) { var e = q(s); if (e) e.click(); };
    var G = function () { return window.dartsGame.game; };

    function play(players, arena, mode, scores) {
        click('#btn-menu');
        click('[data-players="' + players + '"]');
        click('[data-arena="' + arena + '"]');
        click('[data-mode="' + mode + '"]');
        click('#btn-start');
        setTimeout(function () {
            scores.forEach(function (s, i) {
                var b = G().booths[i];
                if (!b) return;
                b.score = s; b.pops = s; b.hits = s; b.throws = s + 3;
                b.streak = i === 0 ? 3 : 1; b.bestStreak = 4;
            });
            G().syncHud();
            /* Thả vật cản của sân vào khoảnh bé đầu tiên. Bãi biển có hải âu,
               vũ trụ có phi hành gia — ảnh lên store nên có mặt chúng, vì đó
               là thứ làm hai sân ấy khác hội chợ. Chờ thêm một nhịp cho nó
               trôi vào giữa màn rồi hẵng bấm máy. */
            if (window.dartsGame.game.arenaCfg.hazard) window.dartsGame.spawnGull(0);
            /* 2,5 giây chứ không phải 4,2: máy bấm ở T + 6,5 nên đặt điểm lúc
               nào cũng được, miễn là XONG HẲN trước đó một quãng rộng. Để sát
               giờ bấm thì chỉ cần máy giả lập khởi động chậm hơn thường lệ một
               chút là ảnh ra bảng điểm toàn số 0. */
        }, 2500);
    }

    window.addEventListener('load', function () {
        /* Mỗi cảnh dựng ở mốc T, máy bấm ở T + 5,5 giây — xem SHOTS trong
           make-shots.js, hai bên phải khớp nhau. */
        /* 0–4s: màn chọn chế độ (chỉ iPad dùng được, iPhone ngang bị cắt) */
        setTimeout(function () { play(2, 'fair', 'versus', [14, 11]); }, 4000);
        setTimeout(function () { play(4, 'fair', 'versus', [12, 9, 15, 7]); }, 12000);
        setTimeout(function () { play(2, 'beach', 'versus', [18, 16]); }, 20000);
        setTimeout(function () { play(2, 'space', 'versus', [21, 17]); }, 28000);
        setTimeout(function () { play(1, 'fair', 'versus', [23]); }, 36000);
        setTimeout(function () { play(2, 'fair', 'sniper', [8, 6]); }, 44000);
        setTimeout(function () {
            window.dartsGame.fakeFinish([
                { score: 24, hits: 21, throws: 28, pops: 21, streak: 6, golds: 2, bombs: 1 },
                { score: 19, hits: 17, throws: 27, pops: 17, streak: 4, golds: 1, bombs: 2 }
            ]);
        }, 52000);
    });
})();
