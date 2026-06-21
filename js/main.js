/* ============================================================
   KetamineUI Documentation — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. Sidebar Toggle (Mobile)
     ---------------------------------------------------------- */
  function initSidebar() {
    const sidebar  = document.querySelector('.sidebar');
    const btn      = document.querySelector('.hamburger-btn');
    const overlay  = document.querySelector('.sidebar-overlay');
    if (!sidebar || !btn) return;

    function open()  {
      sidebar.classList.add('open');
      btn.classList.add('open');
      if (overlay) overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      sidebar.classList.remove('open');
      btn.classList.remove('open');
      if (overlay) overlay.classList.remove('visible');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', function () {
      sidebar.classList.contains('open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) close();
    });

    // Close on resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) close();
    });
  }

  /* ----------------------------------------------------------
     2. Active Sidebar Link
     ---------------------------------------------------------- */
  function initActiveLink() {
    const links = document.querySelectorAll('.nav-link');
    if (!links.length) return;

    const current = window.location.pathname.split('/').pop() || 'index.html';

    links.forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href) return;
      const page = href.split('/').pop().split('#')[0];
      if (page === current || (current === 'index.html' && (page === '' || page === '/' || page === 'index.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* ----------------------------------------------------------
     3. Lua Syntax Highlighter
     ---------------------------------------------------------- */
  function highlightLua(src) {
    var tokens = [];
    var i = 0;
    var len = src.length;

    function esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var keywords = [
      'local','function','end','if','then','else','elseif','for','while','do',
      'return','true','false','nil','not','and','or','in','repeat','until',
      'break','goto'
    ];
    var kwSet = {};
    keywords.forEach(function (k) { kwSet[k] = true; });

    while (i < len) {
      var ch = src[i];

      // Multi-line comment --[[ ... ]]
      if (ch === '-' && src[i+1] === '-' && src[i+2] === '[' && src[i+3] === '[') {
        var end = src.indexOf(']]', i + 4);
        if (end === -1) end = len - 2;
        var block = src.substring(i, end + 2);
        tokens.push('<span class="token-comment">' + esc(block) + '</span>');
        i = end + 2;
        continue;
      }

      // Single-line comment
      if (ch === '-' && src[i+1] === '-') {
        var nl = src.indexOf('\n', i);
        if (nl === -1) nl = len;
        var comment = src.substring(i, nl);
        tokens.push('<span class="token-comment">' + esc(comment) + '</span>');
        i = nl;
        continue;
      }

      // Multi-line string [[ ... ]]
      if (ch === '[' && src[i+1] === '[') {
        var end = src.indexOf(']]', i + 2);
        if (end === -1) end = len - 2;
        var block = src.substring(i, end + 2);
        tokens.push('<span class="token-string">' + esc(block) + '</span>');
        i = end + 2;
        continue;
      }

      // Strings
      if (ch === '"' || ch === "'") {
        var quote = ch;
        var j = i + 1;
        while (j < len) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === quote) { j++; break; }
          j++;
        }
        tokens.push('<span class="token-string">' + esc(src.substring(i, j)) + '</span>');
        i = j;
        continue;
      }

      // Numbers (including hex 0x, floats)
      if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < len && /[0-9]/.test(src[i+1]))) {
        var j = i;
        if (ch === '0' && (src[i+1] === 'x' || src[i+1] === 'X')) {
          j += 2;
          while (j < len && /[0-9a-fA-F]/.test(src[j])) j++;
        } else {
          while (j < len && /[0-9]/.test(src[j])) j++;
          if (j < len && src[j] === '.') {
            j++;
            while (j < len && /[0-9]/.test(src[j])) j++;
          }
          if (j < len && (src[j] === 'e' || src[j] === 'E')) {
            j++;
            if (j < len && (src[j] === '+' || src[j] === '-')) j++;
            while (j < len && /[0-9]/.test(src[j])) j++;
          }
        }
        tokens.push('<span class="token-number">' + esc(src.substring(i, j)) + '</span>');
        i = j;
        continue;
      }

      // Identifiers / keywords
      if (/[a-zA-Z_]/.test(ch)) {
        var j = i + 1;
        while (j < len && /[a-zA-Z0-9_]/.test(src[j])) j++;
        var word = src.substring(i, j);

        // Look ahead for function call
        var ahead = j;
        while (ahead < len && src[ahead] === ' ') ahead++;

        if (word === 'true' || word === 'false') {
          tokens.push('<span class="token-boolean">' + esc(word) + '</span>');
        } else if (word === 'nil') {
          tokens.push('<span class="token-nil">' + esc(word) + '</span>');
        } else if (word === 'self') {
          tokens.push('<span class="token-self">' + esc(word) + '</span>');
        } else if (kwSet[word]) {
          tokens.push('<span class="token-keyword">' + esc(word) + '</span>');
        } else if (ahead < len && (src[ahead] === '(' || src[ahead] === '"' || src[ahead] === "'" || (src[ahead] === '{') )) {
          tokens.push('<span class="token-function">' + esc(word) + '</span>');
        } else {
          // Check if previous non-space token was a dot — property access
          var prevIdx = tokens.length - 1;
          while (prevIdx >= 0 && tokens[prevIdx] === ' ') prevIdx--;
          if (prevIdx >= 0 && tokens[prevIdx] === '<span class="token-punctuation">.</span>') {
            tokens.push('<span class="token-property">' + esc(word) + '</span>');
          } else if (prevIdx >= 0 && tokens[prevIdx] === '<span class="token-punctuation">:</span>') {
            // method call
            if (ahead < len && src[ahead] === '(') {
              tokens.push('<span class="token-function">' + esc(word) + '</span>');
            } else {
              tokens.push('<span class="token-property">' + esc(word) + '</span>');
            }
          } else {
            tokens.push(esc(word));
          }
        }
        i = j;
        continue;
      }

      // Operators
      if ('=~<>+-*/%^#'.indexOf(ch) !== -1) {
        var op = ch;
        // Two-char operators
        if (i + 1 < len) {
          var two = ch + src[i+1];
          if (two === '==' || two === '~=' || two === '<=' || two === '>=' || two === '..' || two === '<<' || two === '>>') {
            op = two;
          }
        }
        tokens.push('<span class="token-operator">' + esc(op) + '</span>');
        i += op.length;
        continue;
      }

      // Dot / colon as punctuation
      if (ch === '.' || ch === ':') {
        tokens.push('<span class="token-punctuation">' + esc(ch) + '</span>');
        i++;
        continue;
      }

      // Brackets / parens / braces / commas / semicolons
      if ('(){}[],;'.indexOf(ch) !== -1) {
        tokens.push('<span class="token-punctuation">' + esc(ch) + '</span>');
        i++;
        continue;
      }

      // Whitespace and everything else
      tokens.push(esc(ch));
      i++;
    }

    return tokens.join('');
  }

  /**
   * Apply Lua highlighting to all code blocks marked with data-lang="lua"
   * or class "language-lua"
   */
  function initSyntaxHighlighting() {
    var blocks = document.querySelectorAll(
      '.code-block pre code[class*="language-lua"], ' +
      '.code-block[data-lang="lua"] pre code, ' +
      '.code-block pre code.lua'
    );

    blocks.forEach(function (codeEl) {
      // Only process once
      if (codeEl.dataset.highlighted) return;
      codeEl.dataset.highlighted = 'true';

      var raw = codeEl.textContent;
      codeEl.innerHTML = highlightLua(raw);
    });
  }

  /* ----------------------------------------------------------
     4. Code Copy Button
     ---------------------------------------------------------- */
  function initCodeCopy() {
    document.querySelectorAll('.code-copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var block = btn.closest('.code-block');
        if (!block) return;
        var code = block.querySelector('pre code') || block.querySelector('pre');
        if (!code) return;

        var text = code.textContent;
        navigator.clipboard.writeText(text).then(function () {
          var original = btn.innerHTML;
          btn.classList.add('copied');
          btn.innerHTML = '✓ Copied';
          setTimeout(function () {
            btn.classList.remove('copied');
            btn.innerHTML = original;
          }, 2000);
        }).catch(function () {
          // Fallback
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          var original = btn.innerHTML;
          btn.classList.add('copied');
          btn.innerHTML = '✓ Copied';
          setTimeout(function () {
            btn.classList.remove('copied');
            btn.innerHTML = original;
          }, 2000);
        });
      });
    });
  }

  /* ----------------------------------------------------------
     5. Smooth Scroll for Anchor Links
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update URL without jump
      history.pushState(null, '', '#' + id);
    });
  }

  /* ----------------------------------------------------------
     6. Search Modal
     ---------------------------------------------------------- */
  var searchIndex = [
    { title: 'Getting Started',       path: 'getting-started.html',   section: 'Introduction',   icon: '📖' },
    { title: 'Installation',          path: 'installation.html',      section: 'Introduction',   icon: '📦' },
    { title: 'Quick Start',           path: 'quick-start.html',       section: 'Introduction',   icon: '⚡' },
    { title: 'Configuration',         path: 'configuration.html',     section: 'Guide',          icon: '⚙️' },
    { title: 'Theming',               path: 'theming.html',           section: 'Guide',          icon: '🎨' },
    { title: 'Window',                path: 'api/window.html',        section: 'API Reference',  icon: '🪟' },
    { title: 'Tab',                   path: 'api/tab.html',           section: 'API Reference',  icon: '📑' },
    { title: 'Section',               path: 'api/section.html',       section: 'API Reference',  icon: '📂' },
    { title: 'Button',                path: 'api/button.html',        section: 'API Reference',  icon: '🔘' },
    { title: 'Toggle',                path: 'api/toggle.html',        section: 'API Reference',  icon: '🔄' },
    { title: 'Slider',                path: 'api/slider.html',        section: 'API Reference',  icon: '📏' },
    { title: 'Dropdown',              path: 'api/dropdown.html',      section: 'API Reference',  icon: '📋' },
    { title: 'Input',                 path: 'api/input.html',         section: 'API Reference',  icon: '✏️' },
    { title: 'Keybind',               path: 'api/keybind.html',       section: 'API Reference',  icon: '⌨️' },
    { title: 'ColorPicker',           path: 'api/colorpicker.html',   section: 'API Reference',  icon: '🎨' },
    { title: 'Label',                 path: 'api/label.html',         section: 'API Reference',  icon: '🏷️' },
    { title: 'Paragraph',             path: 'api/paragraph.html',     section: 'API Reference',  icon: '📝' },
    { title: 'Notification',          path: 'api/notification.html',  section: 'API Reference',  icon: '🔔' },
    { title: 'Dialog',                path: 'api/dialog.html',        section: 'API Reference',  icon: '💬' },
    { title: 'Examples',              path: 'examples.html',          section: 'Resources',      icon: '💡' },
    { title: 'Changelog',             path: 'changelog.html',         section: 'Resources',      icon: '📋' },
    { title: 'Migration Guide',       path: 'migration.html',         section: 'Resources',      icon: '🔀' },
  ];

  var searchState = {
    selectedIdx: -1,
    filtered: []
  };

  function initSearch() {
    var overlay = document.querySelector('.search-modal-overlay');
    var modal   = document.querySelector('.search-modal');
    var input   = document.querySelector('.search-modal input');
    var results = document.querySelector('.search-results');
    if (!overlay || !input) return;

    // Also bind sidebar search trigger
    var trigger = document.querySelector('.sidebar-search');
    if (trigger) trigger.addEventListener('click', openSearch);

    function openSearch() {
      overlay.classList.add('visible');
      input.value = '';
      searchState.selectedIdx = -1;
      renderResults('');
      setTimeout(function () { input.focus(); }, 50);
    }

    function closeSearch() {
      overlay.classList.remove('visible');
      input.value = '';
    }

    // Cmd/Ctrl + K
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (overlay.classList.contains('visible')) {
          closeSearch();
        } else {
          openSearch();
        }
      }
      if (e.key === 'Escape' && overlay.classList.contains('visible')) {
        closeSearch();
      }
    });

    // Click overlay to close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    // Filter on input
    input.addEventListener('input', function () {
      searchState.selectedIdx = -1;
      renderResults(input.value.trim());
    });

    // Keyboard navigation
    input.addEventListener('keydown', function (e) {
      var items = results.querySelectorAll('.search-result-item');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchState.selectedIdx = Math.min(searchState.selectedIdx + 1, items.length - 1);
        updateSelected(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchState.selectedIdx = Math.max(searchState.selectedIdx - 1, 0);
        updateSelected(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchState.selectedIdx >= 0 && searchState.selectedIdx < searchState.filtered.length) {
          window.location.href = searchState.filtered[searchState.selectedIdx].path;
          closeSearch();
        }
      }
    });

    function updateSelected(items) {
      items.forEach(function (el, idx) {
        el.classList.toggle('selected', idx === searchState.selectedIdx);
      });
      // Scroll into view
      if (items[searchState.selectedIdx]) {
        items[searchState.selectedIdx].scrollIntoView({ block: 'nearest' });
      }
    }

    function renderResults(query) {
      if (!results) return;
      var q = query.toLowerCase();

      if (!q) {
        searchState.filtered = searchIndex;
      } else {
        searchState.filtered = searchIndex.filter(function (item) {
          return item.title.toLowerCase().indexOf(q) !== -1 ||
                 item.section.toLowerCase().indexOf(q) !== -1 ||
                 item.path.toLowerCase().indexOf(q) !== -1;
        });
      }

      if (!searchState.filtered.length) {
        results.innerHTML = '<div class="search-empty">No results found for "' + escHtml(query) + '"</div>';
        return;
      }

      var html = '';
      searchState.filtered.forEach(function (item, idx) {
        html += '<div class="search-result-item' + (idx === searchState.selectedIdx ? ' selected' : '') +
                '" data-idx="' + idx + '">' +
                '<span class="result-icon">' + item.icon + '</span>' +
                '<div class="result-text">' +
                '<div class="result-title">' + highlightMatch(item.title, q) + '</div>' +
                '<div class="result-path">' + item.section + '</div>' +
                '</div>' +
                '<span class="result-arrow">→</span>' +
                '</div>';
      });
      results.innerHTML = html;

      // Click handlers
      results.querySelectorAll('.search-result-item').forEach(function (el) {
        el.addEventListener('click', function () {
          var idx = parseInt(el.dataset.idx);
          if (searchState.filtered[idx]) {
            window.location.href = searchState.filtered[idx].path;
            closeSearch();
          }
        });
        el.addEventListener('mouseenter', function () {
          searchState.selectedIdx = parseInt(el.dataset.idx);
          updateSelected(results.querySelectorAll('.search-result-item'));
        });
      });
    }

    function highlightMatch(text, query) {
      if (!query) return escHtml(text);
      var lower = text.toLowerCase();
      var idx = lower.indexOf(query);
      if (idx === -1) return escHtml(text);
      return escHtml(text.substring(0, idx)) +
             '<strong>' + escHtml(text.substring(idx, idx + query.length)) + '</strong>' +
             escHtml(text.substring(idx + query.length));
    }
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ----------------------------------------------------------
     7. Table of Contents Generation
     ---------------------------------------------------------- */
  function initTOC() {
    var wrapper = document.querySelector('.toc-wrapper');
    var content = document.querySelector('.main-content');
    if (!wrapper || !content) return;

    var headings = content.querySelectorAll('h2, h3');
    if (headings.length < 2) {
      wrapper.style.display = 'none';
      return;
    }

    var toc = document.createElement('nav');
    toc.className = 'toc';
    toc.setAttribute('aria-label', 'Table of contents');

    var title = document.createElement('div');
    title.className = 'toc-title';
    title.textContent = 'On this page';
    toc.appendChild(title);

    var list = document.createElement('div');
    list.className = 'toc-list';

    headings.forEach(function (heading, idx) {
      // Ensure heading has an ID
      if (!heading.id) {
        heading.id = 'heading-' + idx + '-' + heading.textContent
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      var link = document.createElement('a');
      link.className = 'toc-link' + (heading.tagName === 'H3' ? ' toc-h3' : '');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.replace(/^[▸•]\s*/, ''); // strip bullet prefixes
      list.appendChild(link);
    });

    toc.appendChild(list);
    wrapper.innerHTML = '';
    wrapper.appendChild(toc);
  }

  /* ----------------------------------------------------------
     8. Scroll Spy for TOC
     ---------------------------------------------------------- */
  function initScrollSpy() {
    var tocLinks = document.querySelectorAll('.toc-link');
    if (!tocLinks.length) return;

    var headings = [];
    tocLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) headings.push({ el: el, link: link });
    });

    if (!headings.length) return;

    var ticking = false;

    function update() {
      var scrollTop = window.scrollY + 120; // offset
      var active = null;

      for (var i = headings.length - 1; i >= 0; i--) {
        if (headings[i].el.offsetTop <= scrollTop) {
          active = headings[i];
          break;
        }
      }

      tocLinks.forEach(function (l) { l.classList.remove('active'); });
      if (active) active.link.classList.add('active');
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ----------------------------------------------------------
     9. Scroll-Triggered Animations
     ---------------------------------------------------------- */
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      elements.forEach(function (el) { observer.observe(el); });
    } else {
      // Fallback: show all
      elements.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  /* ----------------------------------------------------------
     10. Page Transition Fade
     ---------------------------------------------------------- */
  function initPageTransitions() {
    // Fade out before navigating to internal links
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href) return;

      // Skip external links, anchors, and special protocols
      if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('javascript:') || link.target === '_blank') return;

      e.preventDefault();
      var main = document.querySelector('.main-content');
      if (main) {
        main.style.opacity = '0';
        main.style.transform = 'translateY(8px)';
        main.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      }
      setTimeout(function () {
        window.location.href = href;
      }, 200);
    });
  }

  /* ----------------------------------------------------------
     11. Auto-generate Code Block Headers
     ---------------------------------------------------------- */
  function initCodeBlockHeaders() {
    document.querySelectorAll('.code-block').forEach(function (block) {
      // Skip if header already exists
      if (block.querySelector('.code-block-header')) return;

      var lang = block.dataset.lang || '';
      var title = block.dataset.title || '';
      if (!lang && !title) return;

      var header = document.createElement('div');
      header.className = 'code-block-header';

      var left = '';
      if (lang) left += '<span class="code-block-lang">' + escHtml(lang) + '</span>';
      if (title) left += '<span class="code-block-title">' + escHtml(title) + '</span>';

      header.innerHTML = left +
        '<button class="code-copy-btn" aria-label="Copy code">⧉ Copy</button>';

      block.insertBefore(header, block.firstChild);
    });
  }

  /* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    initActiveLink();
    initCodeBlockHeaders();
    initSyntaxHighlighting();
    initCodeCopy();
    initSmoothScroll();
    initSearch();
    initTOC();
    initScrollSpy();
    initScrollAnimations();
    initPageTransitions();
  });

})();
