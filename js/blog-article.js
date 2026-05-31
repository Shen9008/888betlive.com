/**
 * 888bet Live — article page: sidebar "recent posts" and related posts from blogs.json
 * using the same sort as scripts/content-sync.js.
 */
(function () {
    'use strict';

    var SIDE_RECENT_LIMIT = 3;
    var RELATED_POSTS_LIMIT = 3;

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

    function slugFromDocument() {
        var fromAttr = document.body && document.body.getAttribute('data-blog-slug');
        if (fromAttr) return fromAttr.trim();
        var pathname = window.location.pathname || '';
        var parts = pathname.replace(/\/$/, '').split('/');
        var last = parts[parts.length - 1];
        return last === 'blog' ? '' : (last || '');
    }

    function buildSlugIndex(posts, currentSlug, relatedCsv) {
        var slugToPost = {};
        posts.forEach(function (p) {
            if (p && p.slug) slugToPost[p.slug] = p;
        });

        var relatedDesired = [];
        if (relatedCsv) {
            relatedCsv.split(',').forEach(function (s) {
                var trimmed = String(s || '').trim();
                if (!trimmed) return;
                var post = slugToPost[trimmed];
                if (post && trimmed !== currentSlug && relatedDesired.indexOf(post) === -1) {
                    relatedDesired.push(post);
                }
            });
        }

        var others = posts
            .filter(function (p) { return (p.slug || '') !== currentSlug; })
            .sort(sortBlogsForIndex);

        var relatedFallback = [];
        var used = {};

        relatedDesired.forEach(function (p) {
            var sl = p.slug;
            used[sl] = true;
        });

        for (var i = 0; i < others.length && relatedFallback.length + relatedDesired.length < RELATED_POSTS_LIMIT; i++) {
            var p = others[i];
            if (!used[p.slug]) {
                relatedFallback.push(p);
                used[p.slug] = true;
            }
        }

        return { relatedDesired: relatedDesired, relatedMerged: relatedDesired.concat(relatedFallback).slice(0, RELATED_POSTS_LIMIT) };
    }

    function populateList(container, posts, slugToHref) {
        container.textContent = '';
        posts.forEach(function (post) {
            var slug = post.slug || '';
            if (!slug) return;
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = slugToHref(slug);
            a.textContent = post.title || slug;
            li.appendChild(a);
            container.appendChild(li);
        });
    }

    function run() {
        var currentSlug = slugFromDocument();
        if (!currentSlug) return;

        var sidebarEl = document.getElementById('sidebar-posts');
        var relatedSection = document.getElementById('related-posts');
        var relatedList = relatedSection ? relatedSection.querySelector('.blog-related-list') : null;
        var relatedPlaceholder = relatedSection ? relatedSection.querySelector('.blog-related-placeholder') : null;

        fetch('../../assets/data/blogs.json')
            .then(function (r) {
                if (!r.ok) throw new Error('Could not load blog data');
                return r.json();
            })
            .then(function (data) {
                var posts = Array.isArray(data) ? data.slice().sort(sortBlogsForIndex) : [];
                var bySlugHref = function (slug) {
                    return '/blog/' + encodeURIComponent(String(slug));
                };

                if (sidebarEl) {
                    var recent = posts
                        .filter(function (p) { return (p.slug || '') !== currentSlug; })
                        .slice(0, SIDE_RECENT_LIMIT);
                    if (recent.length === 0) {
                        sidebarEl.innerHTML = '<li class="blog-sidebar-placeholder">No other posts yet.</li>';
                    } else {
                        populateList(sidebarEl, recent, bySlugHref);
                    }
                }

                if (relatedList && relatedSection) {
                    var csv = document.body.getAttribute('data-related-slugs') || '';
                    var built = buildSlugIndex(posts, currentSlug, csv);
                    var useList = built.relatedMerged.length ? built.relatedMerged : posts.filter(function (p) {
                        return (p.slug || '') !== currentSlug;
                    }).slice(0, RELATED_POSTS_LIMIT);

                    if (useList.length === 0) {
                        if (relatedPlaceholder) relatedPlaceholder.textContent = 'Related posts appear when more articles are synced.';
                        relatedList.hidden = true;
                        return;
                    }
                    if (relatedPlaceholder) relatedPlaceholder.hidden = true;
                    relatedList.hidden = false;
                    populateList(relatedList, useList.slice(0, RELATED_POSTS_LIMIT), bySlugHref);
                }
            })
            .catch(function () {
                if (sidebarEl) {
                    sidebarEl.innerHTML = '<li class="blog-sidebar-placeholder">Could not load recent posts.</li>';
                }
                if (relatedPlaceholder) {
                    relatedPlaceholder.textContent = 'Could not load related posts.';
                }
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
