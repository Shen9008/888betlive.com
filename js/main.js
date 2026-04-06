document.addEventListener('DOMContentLoaded', function () {

    (function initPageLoader() {

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var loader = document.createElement('div');

        loader.id = 'page-loader';

        loader.setAttribute('role', 'status');

        loader.setAttribute('aria-live', 'polite');

        loader.setAttribute('aria-busy', 'true');

        loader.innerHTML =

            '<div class="page-loader__ring" aria-hidden="true"></div>' +

            '<span class="sr-only">Loading page…</span>';

        document.body.insertBefore(loader, document.body.firstChild);

        function hide() {

            loader.setAttribute('aria-busy', 'false');

            loader.classList.add('page-loader--done');

            window.setTimeout(function () {

                if (loader.parentNode) loader.parentNode.removeChild(loader);

            }, 480);

        }

        if (document.readyState === 'complete') {

            window.requestAnimationFrame(hide);

        } else {

            window.addEventListener('load', hide);

        }

    })();



    (function initCustomCursor() {

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        if (!window.matchMedia('(pointer: fine)').matches) return;

        var ring = document.createElement('div');

        ring.className = 'cursor-ring';

        ring.setAttribute('aria-hidden', 'true');

        var dot = document.createElement('div');

        dot.className = 'cursor-dot';

        dot.setAttribute('aria-hidden', 'true');

        document.body.appendChild(ring);

        document.body.appendChild(dot);

        document.body.classList.add('has-custom-cursor');

        var mx = 0;

        var my = 0;

        var rx = 0;

        var ry = 0;

        var sel =

            'a, button, .btn, [role="button"], input, textarea, select, label, .nav__link, .game-tile, .category-card';

        window.addEventListener(

            'mousemove',

            function (e) {

                mx = e.clientX;

                my = e.clientY;

                dot.style.left = mx + 'px';

                dot.style.top = my + 'px';

                var hover = e.target.closest(sel);

                ring.classList.toggle('cursor-ring--active', !!hover);

            },

            { passive: true }

        );

        function loop() {

            rx += (mx - rx) * 0.18;

            ry += (my - ry) * 0.18;

            ring.style.left = rx + 'px';

            ring.style.top = ry + 'px';

            window.requestAnimationFrame(loop);

        }

        loop();

    })();



    var menuScrollLockY = 0;



    function setMenuOpen(isOpen) {

        var menu = document.querySelector('.mobile-menu');

        var toggle = document.querySelector('.mobile-menu-toggle');

        if (!menu || !toggle) return;

        menu.classList.toggle('active', isOpen);

        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');

        var use = toggle.querySelector('use');

        if (use) {

            use.setAttribute('href', isOpen ? '#icon-close' : '#icon-menu');

        }

        document.body.classList.toggle('menu-open', isOpen);

        if (isOpen) {

            menuScrollLockY = window.scrollY || window.pageYOffset;

            document.body.style.position = 'fixed';

            document.body.style.top = '-' + menuScrollLockY + 'px';

            document.body.style.left = '0';

            document.body.style.right = '0';

            document.body.style.width = '100%';

        } else {

            document.body.style.position = '';

            document.body.style.top = '';

            document.body.style.left = '';

            document.body.style.right = '';

            document.body.style.width = '';

            window.scrollTo(0, menuScrollLockY);

        }

    }



    document.body.addEventListener('click', function (e) {

        var toggle = e.target.closest('.mobile-menu-toggle');

        if (toggle) {

            var menu = document.querySelector('.mobile-menu');

            if (menu) {

                setMenuOpen(!menu.classList.contains('active'));

            }

            return;

        }

        var openMenu = document.querySelector('.mobile-menu.active');

        if (openMenu && !e.target.closest('.mobile-menu')) {

            setMenuOpen(false);

        }

    });



    document.addEventListener('keydown', function (e) {

        if (e.key !== 'Escape') return;

        var menu = document.querySelector('.mobile-menu');

        if (menu && menu.classList.contains('active')) {

            e.preventDefault();

            setMenuOpen(false);

            var t = document.querySelector('.mobile-menu-toggle');

            if (t) t.focus();

        }

    });



    var mqDesktop = window.matchMedia('(min-width: 1024px)');

    function closeMenuIfDesktop() {

        if (!mqDesktop.matches) return;

        var menu = document.querySelector('.mobile-menu');

        if (menu && menu.classList.contains('active')) {

            setMenuOpen(false);

        }

    }

    if (mqDesktop.addEventListener) {

        mqDesktop.addEventListener('change', closeMenuIfDesktop);

    } else if (mqDesktop.addListener) {

        mqDesktop.addListener(closeMenuIfDesktop);

    }



    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {

        anchor.addEventListener('click', function (e) {

            var href = anchor.getAttribute('href');

            if (!href || href === '#') return;

            var target = document.querySelector(href);

            if (target) {

                e.preventDefault();

                var smoothScroll = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                target.scrollIntoView({ behavior: smoothScroll ? 'smooth' : 'auto', block: 'start' });

                var menu = document.querySelector('.mobile-menu');

                if (menu && menu.classList.contains('active')) {

                    setMenuOpen(false);

                }

            }

        });

    });



    function initHeaderScroll() {

        var header = document.querySelector('.header');

        if (!header || header.getAttribute('data-scroll-init') === '1') return;

        header.setAttribute('data-scroll-init', '1');

        window.addEventListener(

            'scroll',

            function () {

                var y = window.scrollY || window.pageYOffset;

                header.style.background = y > 80 ? 'rgba(0, 0, 0, 0.97)' : 'rgba(0, 0, 0, 0.94)';

            },

            { passive: true }

        );

    }

    initHeaderScroll();

    document.addEventListener('888betlive:partials', initHeaderScroll);



    var observer = new IntersectionObserver(function (entries) {

        entries.forEach(function (entry) {

            if (entry.isIntersecting) {

                entry.target.classList.add('fade-in');

                observer.unobserve(entry.target);

            }

        });

    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });



    document.querySelectorAll('[data-animate]').forEach(function (el) {

        observer.observe(el);

    });

});

