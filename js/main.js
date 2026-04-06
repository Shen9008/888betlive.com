document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', function (e) {
        var toggle = e.target.closest('.mobile-menu-toggle');
        if (!toggle) return;
        var menu = document.querySelector('.mobile-menu');
        if (menu) {
            menu.classList.toggle('active');
            var isOpen = menu.classList.contains('active');
            var use = toggle.querySelector('use');
            if (use) {
                use.setAttribute('href', isOpen ? '#icon-close' : '#icon-menu');
            }
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                var menu = document.querySelector('.mobile-menu');
                if (menu && menu.classList.contains('active')) {
                    menu.classList.remove('active');
                    var t = document.querySelector('.mobile-menu-toggle');
                    if (t) {
                        var u = t.querySelector('use');
                        if (u) u.setAttribute('href', '#icon-menu');
                    }
                }
            }
        });
    });

    function initHeaderScroll() {
        var header = document.querySelector('.header');
        if (!header) return;
        window.addEventListener('scroll', function () {
            var y = window.pageYOffset;
            header.style.background = y > 80 ? 'rgba(7, 9, 15, 0.98)' : 'rgba(7, 9, 15, 0.92)';
        });
    }
    initHeaderScroll();

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
