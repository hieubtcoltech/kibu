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
        }, 4200);
    }

    window.addEventListener('load', function () {
        /* 0–4s: màn chọn chế độ (chỉ iPad dùng được, iPhone ngang bị cắt) */
        setTimeout(function () { play(2, 'fair', 'versus', [14, 11]); }, 4000);
        setTimeout(function () { play(4, 'fair', 'versus', [12, 9, 15, 7]); }, 12000);
        setTimeout(function () { play(2, 'beach', 'versus', [18, 16]); }, 20000);
        setTimeout(function () { play(1, 'fair', 'versus', [23]); }, 28000);
        setTimeout(function () { play(2, 'fair', 'sniper', [8, 6]); }, 36000);
        setTimeout(function () {
            window.dartsGame.fakeFinish([
                { score: 24, hits: 21, throws: 28, pops: 21, streak: 6, golds: 2, bombs: 1 },
                { score: 19, hits: 17, throws: 27, pops: 17, streak: 4, golds: 1, bombs: 2 }
            ]);
        }, 44000);
    });
})();
