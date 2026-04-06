/**
 * 888bet Live – load header, footer, CTA banner; SVG sprite; active nav.
 */
(function () {
    'use strict';

    var pathname = window.location.pathname || '';
    var isSub = pathname.indexOf('/news/') !== -1;
    var base = isSub ? '../' : '';

    var rootPages = [
        'index.html', 'slots.html', 'live-casino.html', 'table-games.html',
        'promotions.html', 'about-us.html', 'help-center.html', 'terms.html'
    ];

    function rewriteLinks(html) {
        if (!isSub) return html;
        html = html.replace(/\shref="(?!https?:\/\/|#|mailto:|\.\.\/)([^"]+)"/g, function (_, href) {
            if (rootPages.indexOf(href) !== -1) return ' href="../' + href + '"';
            return ' href="' + href + '"';
        });
        return html;
    }

    function setActiveNav() {
        var page = document.body.getAttribute('data-page') || '';
        if (!page) return;
        document.querySelectorAll('.nav__link[data-nav="' + page + '"], .mobile-menu__link[data-nav="' + page + '"]').forEach(function (el) {
            el.classList.add('nav__link--active', 'mobile-menu__link--active');
        });
    }

    function injectSvgSprite() {
        if (document.getElementById('svg-sprite')) return;
        var symbols =
            '<symbol id="icon-menu" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></symbol>' +
            '<symbol id="icon-close" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></symbol>' +
            '<symbol id="icon-slot" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 13H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></symbol>' +
            '<symbol id="icon-live" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></symbol>' +
            '<symbol id="icon-table" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4V6zm0 5h7v7H4v-7zm9 0h7v7h-7v-7z"/></symbol>' +
            '<symbol id="icon-gift" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-1V4h1zm-4 0h1v2h-1c-.55 0-1-.45-1-1s.45-1 1-1zM4 8h16v2H4V8zm0 4h16v8H4v-8z"/></symbol>' +
            '<symbol id="icon-shield" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></symbol>' +
            '<symbol id="icon-help" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></symbol>' +
            '<symbol id="icon-bolt" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></symbol>' +
            '<symbol id="icon-chart" viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.07-4-4L2 16.99z"/></symbol>';

        var wrap = document.createElement('div');
        wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" id="svg-sprite"><defs>' + symbols + '</defs></svg>';
        document.body.insertBefore(wrap.firstChild, document.body.firstChild);
    }

    function run() {
        injectSvgSprite();
        Promise.all([
            fetch(base + 'partials/header.html').then(function (r) { return r.text(); }),
            fetch(base + 'partials/footer.html').then(function (r) { return r.text(); }),
            fetch(base + 'partials/cta-banner.html').then(function (r) { return r.text(); })
        ]).then(function (parts) {
            var headerHtml = rewriteLinks(parts[0]);
            var footerHtml = rewriteLinks(parts[1]);
            var bannerHtml = rewriteLinks(parts[2]);
            var headerPlaceholder = document.getElementById('partial-header');
            var footerPlaceholder = document.getElementById('partial-footer');
            if (headerPlaceholder) {
                var temp = document.createElement('div');
                temp.innerHTML = headerHtml;
                var parent = headerPlaceholder.parentNode;
                while (temp.firstChild) {
                    parent.insertBefore(temp.firstChild, headerPlaceholder);
                }
                headerPlaceholder.remove();
            }
            if (footerPlaceholder) {
                footerPlaceholder.outerHTML = footerHtml;
            }
            var main = document.getElementById('main-content');
            if (main && bannerHtml.trim()) {
                var firstSection = main.querySelector('section');
                if (firstSection) {
                    firstSection.insertAdjacentHTML('afterend', bannerHtml);
                }
            }
            setActiveNav();
        }).catch(function () {
            setActiveNav();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
