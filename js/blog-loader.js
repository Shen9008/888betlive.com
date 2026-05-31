/**
 * 888bet Live — blog index: load blogs.json, sort by published_date (then cms_updated_at, synced_at),
 * paginate (6 per URL ?page=). Ellipsis + jump when many pages.
 */
(function () {
    'use strict';

    var PAGE_SIZE = 6;
    /** Show “Go to page” when there are this many pages or more */
    var JUMP_THRESHOLD = 12;
    /** From this many pages, use a tighter number strip + emphasized jump UI */
    var LARGE_ARCHIVE_THRESHOLD = 99;

    function sortBlogsForIndex(a, b) {
        var pb = new Date(b.published_date || 0).getTime();
        var pa = new Date(a.published_date || 0).getTime();
        if (pb !== pa) return pb - pa;
        var cb = new Date(b.cms_updated_at || 0).getTime();
        var ca = new Date(a.cms_updated_at || 0).getTime();
        if (cb !== ca) return cb - ca;
        var sb = new Date(b.synced_at || 0).getTime();
        var sa = new Date(a.synced_at || 0).getTime();
        if (sb !== sa) return sb - sa;
        return String(a.slug).localeCompare(String(b.slug));
    }

    function formatDate(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        try {
            return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d);
        } catch (_) {
            return iso;
        }
    }

    function getPageFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var p = parseInt(params.get('page'), 10);
        if (!isFinite(p) || p < 1) return 1;
        return p;
    }

    function setUrlPage(page, replaceHistory) {
        var url = new URL(window.location.href);
        if (page <= 1) {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', String(page));
        }
        var qs = url.searchParams.toString();
        var path = url.pathname;
        var next = qs ? path + '?' + qs : path;
        if (replaceHistory) {
            history.replaceState({ blogPage: page }, '', next);
        } else {
            history.pushState({ blogPage: page }, '', next);
        }
    }

    /** Page numbers with single ellipsis tokens between gaps (scalable past 99+ pages). */
    function buildPaginationItems(current, total) {
        if (total <= 1) return [];

        var delta = total >= LARGE_ARCHIVE_THRESHOLD ? 1 : 2;
        var SHOW_ALL_MAX = 13;

        function rangeAll() {
            var o = [];
            for (var i = 1; i <= total; i++) o.push(i);
            return o;
        }

        if (total <= SHOW_ALL_MAX) {
            return rangeAll();
        }

        var bucket = {};
        function add(p) {
            if (p >= 1 && p <= total) bucket[p] = true;
        }

        add(1);
        add(total);
        var j;
        for (j = current - delta; j <= current + delta; j++) add(j);

        var nums = Object.keys(bucket)
            .map(Number)
            .sort(function (a, b) {
                return a - b;
            });

        var seq = [];
        for (j = 0; j < nums.length; j++) {
            if (j > 0 && nums[j] - nums[j - 1] > 1) {
                seq.push('ellipsis');
            }
            seq.push(nums[j]);
        }
        return seq;
    }

    function renderEmpty(mount, pager, message) {
        mount.innerHTML = '<p class="blog-grid__empty">' + message + '</p>';
        mount.removeAttribute('hidden');
        if (pager) {
            pager.innerHTML = '';
            pager.setAttribute('hidden', 'hidden');
        }
    }

    var DEFAULT_THUMB = '/images/post-default.webp';

    function resolveListingThumbSrc(cover_image) {
        var s = cover_image && String(cover_image).trim();
        if (!s) return DEFAULT_THUMB;
        try {
            if (/^https?:\/\//i.test(s)) {
                var u = new URL(s);
                var lh = (window.location.hostname || '').replace(/^www\./i, '').toLowerCase();
                var ih = u.hostname.replace(/^www\./i, '').toLowerCase();
                var local = lh === 'localhost' || lh === '127.0.0.1';
                var prodSite = ih === '888betlive.com';
                if ((prodSite && local) || ih === lh) {
                    return u.pathname && u.pathname !== '/' ? u.pathname : DEFAULT_THUMB;
                }
                return s;
            }
        } catch (_) {
            return DEFAULT_THUMB;
        }
        return s.charAt(0) === '/' ? s : DEFAULT_THUMB;
    }

    function attachThumbFallback(img) {
        img.addEventListener('error', function onErr() {
            img.removeEventListener('error', onErr);
            if (!img.dataset.fallbackApplied) {
                img.dataset.fallbackApplied = '1';
                img.src = DEFAULT_THUMB;
            }
        });
    }

    function blogPostPath(slug) {
        return '/blog/' + encodeURIComponent(String(slug));
    }

    function renderCard(post) {
        var slug = post.slug || '';
        if (!slug) return null;

        var titleText = post.title || slug;

        var art = document.createElement('article');
        art.className = 'blog-card';

        var thumbSrc = resolveListingThumbSrc(post.cover_image);
        var thumbLink = document.createElement('a');
        thumbLink.className = 'blog-card__thumb';
        thumbLink.href = blogPostPath(slug);
        thumbLink.setAttribute('aria-label', 'Open article: ' + titleText);
        var img = document.createElement('img');
        img.src = thumbSrc;
        img.alt = '';
        img.width = 640;
        img.height = 360;
        img.loading = 'lazy';
        img.decoding = 'async';
        attachThumbFallback(img);
        thumbLink.appendChild(img);
        art.appendChild(thumbLink);

        var cardBody = document.createElement('div');
        cardBody.className = 'blog-card__body';

        var cat = document.createElement('span');
        cat.className = 'blog-card__category';
        cat.textContent = post.category || 'Blog';

        var title = document.createElement('h2');
        title.className = 'blog-card__title';
        var titleLink = document.createElement('a');
        titleLink.href = blogPostPath(slug);
        titleLink.textContent = titleText;
        title.appendChild(titleLink);

        var meta = document.createElement('p');
        meta.className = 'blog-card__meta';
        var parts = [];
        if (post.reading_time) parts.push(post.reading_time);
        var dateStr = formatDate(post.published_date);
        if (dateStr) parts.push(dateStr);
        meta.textContent = parts.join(' · ');

        cardBody.appendChild(cat);
        cardBody.appendChild(title);
        cardBody.appendChild(meta);

        if (post.excerpt && String(post.excerpt).trim()) {
            var excerpt = document.createElement('p');
            excerpt.className = 'blog-card__excerpt';
            excerpt.textContent = post.excerpt;
            cardBody.appendChild(excerpt);
        }

        var read = document.createElement('a');
        read.className = 'blog-card__read';
        read.href = blogPostPath(slug);
        read.textContent = 'Read article';
        cardBody.appendChild(read);

        art.appendChild(cardBody);
        return art;
    }

    function renderGrid(mount, pagePosts) {
        var frag = document.createDocumentFragment();
        pagePosts.forEach(function (post) {
            var node = renderCard(post);
            if (node) frag.appendChild(node);
        });

        mount.textContent = '';
        mount.appendChild(frag);
        mount.removeAttribute('hidden');
    }

    function renderPagination(nav, opts) {
        var current = opts.current;
        var totalPages = opts.totalPages;
        var totalPosts = opts.totalPosts;
        var onPageChange = opts.onPageChange;

        if (totalPages <= 1) {
            nav.innerHTML = '';
            nav.setAttribute('hidden', 'hidden');
            return;
        }

        nav.removeAttribute('hidden');

        var prevDisabled = current <= 1;
        var nextDisabled = current >= totalPages;

        function pageHref(p) {
            if (p <= 1) {
                var u = new URL(window.location.href);
                u.searchParams.delete('page');
                var q = u.searchParams.toString();
                return q ? u.pathname + '?' + q : u.pathname;
            }
            var u2 = new URL(window.location.href);
            u2.searchParams.set('page', String(p));
            return u2.pathname + '?' + u2.searchParams.toString();
        }

        var html = '';
        html += '<div class="blog-pagination__toolbar">';

        html +=
            '<p class="blog-pagination__status">Showing <strong>' +
            escapeHtml(String(opts.rangeStart)) +
            '</strong>–<strong>' +
            escapeHtml(String(opts.rangeEnd)) +
            '</strong> of <strong>' +
            escapeHtml(String(totalPosts)) +
            '</strong> posts · Page <strong>' +
            escapeHtml(String(current)) +
            '</strong> of <strong>' +
            escapeHtml(String(totalPages)) +
            '</strong></p>';

        html += '<div class="blog-pagination__controls">';

        if (prevDisabled) {
            html += '<span class="blog-pagination__btn blog-pagination__btn--nav blog-pagination__btn--disabled" aria-disabled="true">Previous</span>';
        } else {
            html +=
                '<a class="blog-pagination__btn blog-pagination__btn--nav" rel="prev" href="' +
                escapeAttr(pageHref(current - 1)) +
                '" data-page="' +
                (current - 1) +
                '">Previous</a>';
        }

        html += '<ul class="blog-pagination__list" role="list">';

        var items = buildPaginationItems(current, totalPages);
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item === 'ellipsis') {
                html +=
                    '<li class="blog-pagination__item blog-pagination__item--ellipsis" aria-hidden="true"><span>\u2026</span></li>';
                continue;
            }
            var num = item;
            if (num === current) {
                html +=
                    '<li class="blog-pagination__item"><span class="blog-pagination__btn blog-pagination__btn--page blog-pagination__btn--current" aria-current="page">' +
                    num +
                    '</span></li>';
            } else {
                html +=
                    '<li class="blog-pagination__item"><a class="blog-pagination__btn blog-pagination__btn--page" href="' +
                    escapeAttr(pageHref(num)) +
                    '" data-page="' +
                    num +
                    '">' +
                    num +
                    '</a></li>';
            }
        }

        html += '</ul>';

        if (nextDisabled) {
            html += '<span class="blog-pagination__btn blog-pagination__btn--nav blog-pagination__btn--disabled" aria-disabled="true">Next</span>';
        } else {
            html +=
                '<a class="blog-pagination__btn blog-pagination__btn--nav" rel="next" href="' +
                escapeAttr(pageHref(current + 1)) +
                '" data-page="' +
                (current + 1) +
                '">Next</a>';
        }

        html += '</div>';

        /* Jump control for large archives (required UX when page count exceeds ~99) */
        if (totalPages >= JUMP_THRESHOLD) {
            var largeClass = totalPages >= LARGE_ARCHIVE_THRESHOLD ? ' blog-pagination__jump--large' : '';
            html +=
                '<div class="blog-pagination__jump' +
                largeClass +
                '"><label class="blog-pagination__jump-label"><span class="blog-pagination__jump-text">Go to page</span><input type="number" class="blog-pagination__jump-input" min="1" max="' +
                totalPages +
                '" inputmode="numeric" value="' +
                current +
                '" aria-label="Page number (1 to ' +
                totalPages +
                ')"></label><button type="button" class="blog-pagination__jump-btn btn btn--outline btn--sm">Go</button></div>';

            if (totalPages >= LARGE_ARCHIVE_THRESHOLD) {
                html +=
                    '<p class="blog-pagination__hint">Large archive: use Go to page for fast jumps.</p>';
            }
        }

        html += '</div>';

        nav.innerHTML = html;

        function handleClick(ev) {
            var a = ev.target.closest('a[data-page]');
            if (a) {
                ev.preventDefault();
                var pg = parseInt(a.getAttribute('data-page'), 10);
                if (isFinite(pg)) onPageChange(pg);
                return;
            }
        }

        nav.addEventListener('click', handleClick);

        if (totalPages >= JUMP_THRESHOLD) {
            var inp = nav.querySelector('.blog-pagination__jump-input');
            var btn = nav.querySelector('.blog-pagination__jump-btn');
            function doJump() {
                if (!inp) return;
                var v = parseInt(inp.value, 10);
                if (!isFinite(v)) return;
                v = Math.max(1, Math.min(totalPages, v));
                onPageChange(v);
            }
            if (btn) btn.addEventListener('click', doJump);
            if (inp)
                inp.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        doJump();
                    }
                });
        }

        nav._cleanup = function () {
            nav.removeEventListener('click', handleClick);
        };
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escapeAttr(s) {
        return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function scrollToBlogGrid() {
        var el = document.getElementById('blog-post-grid');
        if (!el) return;
        var y = el.getBoundingClientRect().top + window.scrollY - 24;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

    function bindBlogListing(mount, nav, blogs) {
        function totalPages() {
            return Math.max(1, Math.ceil(blogs.length / PAGE_SIZE));
        }

        function applyPage(page, replaceHistory, skipScroll) {
            var tp = totalPages();
            var p = Math.max(1, Math.min(tp, page));
            if (p !== page && page > tp) {
                replaceHistory = true;
            }

            var startIdx = (p - 1) * PAGE_SIZE;
            var slice = blogs.slice(startIdx, startIdx + PAGE_SIZE);

            renderGrid(mount, slice);

            if (nav._cleanup) nav._cleanup();

            setUrlPage(p, !!replaceHistory);

            var rangeEnd = startIdx + slice.length;

            renderPagination(nav, {
                current: p,
                totalPages: tp,
                totalPosts: blogs.length,
                rangeStart: slice.length ? startIdx + 1 : 0,
                rangeEnd: rangeEnd,
                onPageChange: function (next) {
                    applyPage(next, false, false);
                },
            });

            if (!skipScroll && !replaceHistory) scrollToBlogGrid();
        }

        var initial = getPageFromUrl();
        applyPage(initial, true, true);

        window.addEventListener('popstate', function () {
            applyPage(getPageFromUrl(), true, true);
        });
    }

    function run() {
        var mount = document.getElementById('blog-post-grid');
        var nav = document.getElementById('blog-pagination');
        if (!mount) return;

        fetch('../assets/data/blogs.json')
            .then(function (r) {
                if (!r.ok) throw new Error('Could not load blog data');
                return r.json();
            })
            .then(function (data) {
                var blogs = Array.isArray(data) ? data.slice() : [];
                blogs.sort(sortBlogsForIndex);
                if (blogs.length === 0) {
                    renderEmpty(mount, nav, 'No posts yet. Run the content sync when your CMS is connected.');
                    return;
                }
                bindBlogListing(mount, nav, blogs);
            })
            .catch(function () {
                renderEmpty(mount, nav, 'Could not load the blog listing. Check that assets/data/blogs.json is available.');
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
