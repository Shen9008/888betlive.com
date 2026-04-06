/**
 * 888bet Live — placeholder "live" widgets: rotating win feed, optional countdowns.
 * Replace with API/WebSocket data in production.
 */
(function () {
    'use strict';

    var WIN_ROTATE_MS = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 12000 : 5500;

    var WIN_SAMPLES = [
        { user: 'StarRider_88', amount: '42,180', game: 'Gates of Olympus', type: 'slot' },
        { user: 'Miko_Live', amount: '18,920', game: 'Lightning Roulette', type: 'live' },
        { user: 'BaccPro_N', amount: '9,440', game: 'Speed Baccarat', type: 'live' },
        { user: 'SpinVault', amount: '127,600', game: 'Mega Moolah (network)', type: 'jackpot' },
        { user: 'HoldWin_K', amount: '22,310', game: 'Hold & Win Deluxe', type: 'slot' },
        { user: 'AceTable_7', amount: '6,850', game: 'Blackjack Azure', type: 'live' },
        { user: 'MegaWays_J', amount: '31,005', game: 'Bonanza Megaways', type: 'slot' },
        { user: 'ShowTime_99', amount: '14,200', game: 'Crazy Time', type: 'show' },
        { user: 'FastFlip', amount: '3,420', game: 'Instant Turbo', type: 'fast' },
        { user: 'BonusBuy_X', amount: '55,880', game: 'Sweet Bonanza (feature)', type: 'slot' },
        { user: 'Riverbank_', amount: '11,090', game: 'French Roulette', type: 'live' },
        { user: 'PokerFace_Q', amount: '27,400', game: 'Casino Hold\'em', type: 'live' }
    ];

    function formatWinLine(w) {
        return (
            '<span class="win-ticker__line"><span class="win-ticker__user">@' + w.user + '</span> won ' +
            '<span class="win-ticker__amt">$' + w.amount + '</span> on ' +
            '<span class="win-ticker__game">' + w.game + '</span></span>'
        );
    }

    function initWinTicker() {
        var el = document.getElementById('win-ticker-feed');
        if (!el) return;

        var i = Math.floor(Math.random() * WIN_SAMPLES.length);

        function tick() {
            el.classList.add('is-updating');
            setTimeout(function () {
                i = (i + 1) % WIN_SAMPLES.length;
                el.innerHTML = formatWinLine(WIN_SAMPLES[i]);
                el.classList.remove('is-updating');
            }, 200);
        }

        el.innerHTML = formatWinLine(WIN_SAMPLES[i]);
        setInterval(tick, WIN_ROTATE_MS);
    }

    function initCountdownPlaceholders() {
        function pad(n) { return n < 10 ? '0' + n : String(n); }

        document.querySelectorAll('[data-countdown-end]').forEach(function (node) {
            var end = parseInt(node.getAttribute('data-countdown-end'), 10);
            if (!end || isNaN(end)) return;

            function update() {
                var now = Date.now();
                var left = Math.max(0, end - now);
                var s = Math.floor(left / 1000);
                var d = Math.floor(s / 86400);
                var h = Math.floor((s % 86400) / 3600);
                var m = Math.floor((s % 3600) / 60);
                var sec = s % 60;
                if (left <= 0) {
                    node.textContent = 'Ending soon';
                    return;
                }
                node.textContent = d > 0
                    ? d + 'd ' + pad(h) + 'h ' + pad(m) + 'm'
                    : pad(h) + 'h ' + pad(m) + 'm ' + pad(sec) + 's';
            }

            update();
            setInterval(update, 1000);
        });

        document.querySelectorAll('[data-countdown-hours]').forEach(function (node) {
            var hrs = parseFloat(node.getAttribute('data-countdown-hours'), 10);
            if (!hrs || isNaN(hrs)) return;
            var end = Date.now() + hrs * 3600000;

            function update() {
                var left = Math.max(0, end - Date.now());
                var s = Math.floor(left / 1000);
                var d = Math.floor(s / 86400);
                var h = Math.floor((s % 86400) / 3600);
                var m = Math.floor((s % 3600) / 60);
                var sec = s % 60;
                node.textContent = left <= 0 ? 'Check promotions' : (d > 0 ? d + 'd ' : '') + pad(h) + 'h ' + pad(m) + 'm ' + pad(sec) + 's';
            }

            update();
            setInterval(update, 1000);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initWinTicker();
            initCountdownPlaceholders();
        });
    } else {
        initWinTicker();
        initCountdownPlaceholders();
    }
})();
