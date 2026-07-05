
(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const savedTheme = localStorage.getItem('portfolio-theme');
  const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (preferredDark ? 'dark' : 'light');
  root.dataset.theme = initialTheme;

  function updateThemeLabel() {
    if (!themeButton) return;
    const dark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    themeButton.querySelector('[data-theme-icon]').textContent = dark ? '☀' : '◐';
  }
  updateThemeLabel();
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('portfolio-theme', root.dataset.theme);
    updateThemeLabel();
  });

  const menuButton = document.querySelector('[data-menu-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  menuButton?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const counters = document.querySelectorAll('[data-counter]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.counter || 0);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 900;
      const start = performance.now();
      const format = value => target >= 1000 ? Math.round(value).toLocaleString() : String(Math.round(value));
      const animate = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${prefix}${format(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      counterObserver.unobserve(el);
    });
  }, { threshold: .5 });
  counters.forEach(el => counterObserver.observe(el));

  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectCards = document.querySelectorAll('[data-project-card]');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn === button)));
    projectCards.forEach(card => {
      const categories = (card.dataset.categories || '').split(' ');
      card.hidden = filter !== 'all' && !categories.includes(filter);
    });
  }));

  document.querySelectorAll('[data-tabs]').forEach(group => {
    const buttons = [...group.querySelectorAll('[role="tab"]')];
    const panels = [...group.querySelectorAll('[role="tabpanel"]')];
    const activate = button => {
      buttons.forEach(btn => {
        const active = btn === button;
        btn.setAttribute('aria-selected', String(active));
        btn.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => panel.hidden = panel.id !== button.getAttribute('aria-controls'));
    };
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button));
      button.addEventListener('keydown', event => {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        const delta = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
        const next = buttons[(index + delta + buttons.length) % buttons.length];
        activate(next); next.focus();
      });
    });
  });

  const tocLinks = [...document.querySelectorAll('.toc a')];
  const sections = tocLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (sections.length) {
    const tocObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-22% 0px -68% 0px', threshold: 0 });
    sections.forEach(section => tocObserver.observe(section));
  }

  const toast = document.querySelector('[data-toast]');
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }
  document.querySelectorAll('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('goutham.kondeti@gmail.com');
      showToast('Email copied');
    } catch {
      window.location.href = 'mailto:goutham.kondeti@gmail.com';
    }
  }));

  document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
