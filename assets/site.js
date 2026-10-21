/* Progressive enhancement: the academic content remains readable without JS. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const readPreference = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  const closeMenu = () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); menu.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.header-inner')) closeMenu(); });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  matchMedia('(min-width:761px)').addEventListener('change', closeMenu);

  // Language choice applies only to the bilingual Profile section.
  const languageSwitch = document.querySelector('.language-switch');
  if (languageSwitch) {
    languageSwitch.hidden = false;
    const selectLanguage = (language, remember = true) => {
      document.querySelectorAll('[data-profile-language]').forEach(panel => { panel.hidden = panel.dataset.profileLanguage !== language; });
      languageSwitch.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
      if (remember) savePreference('boyifu-profile-language', language);
    };
    selectLanguage(readPreference('boyifu-profile-language') === 'zh' ? 'zh' : 'en', false);
    languageSwitch.querySelectorAll('button').forEach(button => button.addEventListener('click', () => selectLanguage(button.dataset.language)));
  }

  const search = document.querySelector('#news-search');
  if (search) {
    const rows = [...document.querySelectorAll('.archive-row')];
    const filters = [...document.querySelectorAll('[data-filter]')];
    const pagination = document.querySelector('#pagination');
    const params = new URLSearchParams(location.search);
    let filter = ['all', 'paper', 'news'].includes(params.get('type')) ? params.get('type') : 'all';
    let page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    search.value = params.get('q') || '';
    const perPage = 8;
    function render(updateUrl = true) {
      const query = search.value.trim().toLocaleLowerCase();
      const terms = query.split(/\s+/).filter(Boolean);
      const matches = rows.filter(row => (filter === 'all' || row.dataset.kind === filter) && terms.every(term => (row.textContent + ' ' + row.dataset.search).toLocaleLowerCase().includes(term)));
      const pages = Math.ceil(matches.length / perPage);
      page = Math.max(1, Math.min(page, pages || 1));
      rows.forEach(row => { row.hidden = true; });
      matches.slice((page - 1) * perPage, page * perPage).forEach(row => { row.hidden = false; });
      filters.forEach(button => { const active = button.dataset.filter === filter; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
      document.querySelector('#search-status').textContent = `${matches.length} ${matches.length === 1 ? 'update' : 'updates'}${query ? ' found' : ''}`;
      document.querySelector('#no-results').hidden = matches.length !== 0;
      pagination.replaceChildren();
      pagination.hidden = pages <= 1;
      for (let number = 1; number <= pages; number++) {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = number; button.setAttribute('aria-label', `Page ${number}`);
        if (number === page) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => { page = number; render(); document.querySelector('#news-archive').scrollIntoView({block:'start', behavior:matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth'}); pagination.querySelector('[aria-current]').focus({preventScroll:true}); });
        pagination.append(button);
      }
      if (updateUrl) {
        const next = new URLSearchParams();
        if (query) next.set('q', search.value.trim());
        if (filter !== 'all') next.set('type', filter);
        if (page > 1) next.set('page', page);
        history.replaceState(null, '', location.pathname + (next.size ? '?' + next.toString() : '') + location.hash);
      }
    }
    search.addEventListener('input', () => { page = 1; render(); });
    filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; page = 1; render(); }));
    document.querySelector('#reset-search').addEventListener('click', () => { search.value = ''; filter = 'all'; page = 1; render(); search.focus(); });
    render(false);
  }

  let toastTimer;
  const announce = text => { const toast = document.querySelector('.toast'); toast.textContent = text; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 3500); };
  document.querySelectorAll('[data-copy]').forEach(button => {
    if (!navigator.clipboard) return;
    button.hidden = false;
    button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(button.dataset.copy); announce('Email address copied.'); } catch { announce('Please select the email address to copy it.'); } });
  });

  // Freeze GIFs using their currently decoded frame; keep originals for resuming.
  const motionToggle = document.querySelector('#motion-toggle');
  if (motionToggle) {
    const images = [...document.querySelectorAll('.reconstruction-gallery img')];
    const reduced = matchMedia('(prefers-reduced-motion:reduce)');
    let paused = reduced.matches;
    function freeze(image) {
      const old = image.parentNode.querySelector('canvas');
      if (!paused) { if (old) old.remove(); image.style.visibility = ''; return; }
      if (!image.complete || !image.naturalWidth || old) return;
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d'); if (!context) return;
      context.drawImage(image, 0, 0); canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', image.alt + ' (paused)');
      image.parentNode.append(canvas); image.style.visibility = 'hidden';
    }
    function renderMotion() { images.forEach(freeze); motionToggle.textContent = paused ? 'Play animations' : 'Pause animations'; motionToggle.setAttribute('aria-pressed', String(paused)); }
    images.forEach(image => image.addEventListener('load', () => freeze(image)));
    motionToggle.hidden = false;
    motionToggle.addEventListener('click', () => { paused = !paused; renderMotion(); });
    reduced.addEventListener('change', event => { paused = event.matches; renderMotion(); });
    renderMotion();
  }

  const banner = document.querySelector('.cookie-banner');
  if (banner) {
    const analyticsId = document.body.dataset.analytics;
    const localPreview = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
    let analyticsStarted = false;
    function startAnalytics() {
      if (localPreview || analyticsStarted) return;
      analyticsStarted = true;
      if (analyticsId) {
        window['ga-disable-' + analyticsId] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date()); window.gtag('config', analyticsId);
        const script = document.createElement('script'); script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(analyticsId); document.head.append(script);
      }
    }
    const stored = readPreference('boyifu-analytics');
    if (stored === 'granted') startAnalytics();
    // Analytics preferences open only when the visitor selects Cookie settings.
    document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', () => { banner.hidden = false; banner.querySelector('button').focus(); }));
    document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
      const value = button.dataset.consent; savePreference('boyifu-analytics', value); banner.hidden = true;
      if (value === 'granted') startAnalytics();
      else { window['ga-disable-' + analyticsId] = true; if (analyticsStarted) location.reload(); }
    }));
  }
})();
