/* ============================================================================
 * KIBU Games — URL map, shared by server.js and the browser
 * ----------------------------------------------------------------------------
 * Public URLs look like:
 *     /vi                      /en                     home
 *     /vi/about                /en/about               about
 *     /vi/g/balloon-darts      /en/g/balloon-darts     a game
 *
 * On disk the games still live in their original folders; the server maps a
 * slug to its folder. Keeping the folders means every asset URL
 * (/darts-game/style.css …) stays valid and nothing has to be moved.
 * ==========================================================================*/
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.KibuRoutes = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    var LANGS = ['vi', 'en'];
    var DEFAULT_LANG = 'en';   // web viết gốc bằng tiếng Anh, tiếng Việt là bản dịch

    /* folder on disk  →  slug in the URL (the game's own brand name) */
    var GAMES = [
        { dir: 'fruit-crush', slug: 'fruit-crush' },
        { dir: 'shooter-game', slug: 'bot-arena' },
        { dir: 'racer-game', slug: 'neon-racer' },
        { dir: 'english-game', slug: 'english-quest' },
        { dir: 'space-shooter', slug: 'neon-nebula' },
        { dir: 'cyber-snake', slug: 'cyber-snake' },
        { dir: 'basketball-game', slug: 'basketball-duel' },
        { dir: 'billiards-game', slug: 'pool-masters' },
        { dir: 'soccer-game', slug: 'super-striker' },
        { dir: 'darts-game', slug: 'balloon-darts' },
        { dir: 'ocean-game', slug: 'ocean-party' },
        { dir: 'aqua-dash', slug: 'aqua-dash' },
        { dir: 'xiangqi', slug: 'co-tuong' },
        { dir: 'tictactoe-game', slug: 'tic-tac-toe' }
    ];

    var bySlug = {}, byDir = {};
    GAMES.forEach(function (g) { bySlug[g.slug] = g; byDir[g.dir] = g; });

    function isLang(s) { return LANGS.indexOf(s) >= 0; }

    /* "/vi/g/balloon-darts" → {lang:'vi', kind:'game', slug:'balloon-darts', dir:'darts-game'}
     * Returns null when the path is not one of our public URLs. */
    function parse(pathname) {
        var parts = String(pathname || '').split('/').filter(Boolean);
        if (!parts.length || !isLang(parts[0])) return null;
        var lang = parts[0];
        if (parts.length === 1) return { lang: lang, kind: 'home' };
        if (parts.length === 2 && parts[1] === 'about') return { lang: lang, kind: 'about' };
        if (parts.length === 3 && parts[1] === 'g' && bySlug[parts[2]]) {
            return { lang: lang, kind: 'game', slug: parts[2], dir: bySlug[parts[2]].dir };
        }
        return null;
    }

    /* The language-free shape of a public URL, e.g. "/g/balloon-darts". */
    function bare(route) {
        if (!route) return '/';
        if (route.kind === 'about') return '/about';
        if (route.kind === 'game') return '/g/' + route.slug;
        return '/';
    }

    function build(lang, barePath) {
        if (!isLang(lang)) lang = DEFAULT_LANG;
        if (!barePath || barePath === '/') return '/' + lang;
        return '/' + lang + (barePath.charAt(0) === '/' ? '' : '/') + barePath;
    }

    /* Old links that are already indexed or bookmarked, mapped to their bare
     * new shape so callers can add whichever language they resolved. */
    function legacyBare(pathname) {
        var p = String(pathname || '').replace(/index\.html$/, '');
        if (p === '/' || p === '') return '/';
        if (p === '/about.html' || p === '/about' || p === '/about/') return '/about';
        var m = p.match(/^\/([^/]+)\/?$/);
        if (m && byDir[m[1]]) return '/g/' + byDir[m[1]].slug;
        var g = p.match(/^\/g\/([^/]+)\/?$/);
        if (g && bySlug[g[1]]) return '/g/' + g[1];
        return null;
    }

    return {
        LANGS: LANGS,
        DEFAULT_LANG: DEFAULT_LANG,
        GAMES: GAMES,
        isLang: isLang,
        dirOf: function (slug) { return bySlug[slug] && bySlug[slug].dir; },
        slugOf: function (dir) { return byDir[dir] && byDir[dir].slug; },
        parse: parse,
        bare: bare,
        build: build,
        legacyBare: legacyBare
    };
}));
