/* Visitor interactions. No tracking, external calls, forms or editor code. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const toast = message => {
    const el = $('.toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    window.clearTimeout(el._timer);
    el._timer = window.setTimeout(() => el.classList.remove('visible'), 4500);
  };
  const menu = $('.menu-toggle');
  const nav = $('.site-header .nav-links');
  if (menu && nav) {
    if(nav.id) menu.setAttribute('aria-controls',nav.id);
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        menu.focus();
      }
    });
  }
  $$('.orbit-experience').forEach(root => {
    $$('[data-orbit]', root).forEach((button, i) => button.addEventListener('click', () => {
      $$('[data-orbit]', root).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      $$('[data-orbit-panel]', root).forEach(p => p.hidden = p.dataset.orbitPanel !== button.dataset.orbit);
      const index = $('.small-index', root);
      if (index) index.textContent = String(i + 1).padStart(2, '0') + ' /';
    }));
  });
  $$('.workflow').forEach(root => {
    $$('[data-flow-step]', root).forEach(button => button.addEventListener('click', () => {
      $$('[data-flow-step]', root).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      $$('[data-flow-panel]', root).forEach(p => p.hidden = p.dataset.flowPanel !== button.dataset.flowStep);
    }));
  });
  $$('[role="tablist"]').forEach(root => {
    const tabs = $$('[role="tab"]', root);
    const activate = (button, focus) => {
      tabs.forEach(b => {
        const selected = b === button;
        b.setAttribute('aria-selected', String(selected));
        b.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(b.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (focus) button.focus();
    };
    tabs.forEach((button, i) => {
      button.addEventListener('click', () => activate(button, false));
      button.addEventListener('keydown', e => {
        let next;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { e.preventDefault(); activate(tabs[next], true); }
      });
    });
  });
  const filters = $$('[data-filter]');
  const rows = $$('.project-row');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    rows.forEach(row => {
      row.hidden = button.dataset.filter !== 'all' && row.dataset.category !== button.dataset.filter;
      if (!row.hidden) count++;
    });
    const status = $('.filter-count');
    if (status) status.textContent = count + (count === 1 ? ' study' : ' studies');
    const empty = $('.empty-state');
    if (empty) empty.hidden = count !== 0;
  }));
  let dialog;
  $$('[data-full-image]').forEach(button => button.addEventListener('click', () => {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'image-dialog';
      dialog.setAttribute('aria-label', 'Expanded project artifact');
      dialog.innerHTML = '<div class="image-dialog-head"><span></span><button type="button">Close</button></div><img alt=""><p class="image-dialog-error figure-note" role="status" hidden>The full-size image could not load. Close this view to continue reading the case study.</p>';
      $('img',dialog).addEventListener('error',()=>{$('img',dialog).hidden=true;$('.image-dialog-error',dialog).hidden=false;});
      $('img',dialog).addEventListener('load',()=>{$('img',dialog).hidden=false;$('.image-dialog-error',dialog).hidden=true;});
      document.body.append(dialog);
      $('button', dialog).addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    }
    $('span', dialog).textContent = button.dataset.imageTitle || 'Project artifact';
    const img = $('img', dialog);
    img.hidden=false;$('.image-dialog-error',dialog).hidden=true;
    img.src = button.dataset.fullImage;
    img.alt = $('img', button)?.alt || button.dataset.imageTitle || 'Project artifact';
    dialog.showModal();
  }));
  $$('.copy-email').forEach(button => button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      toast('Email address copied.');
    } catch {
      toast('Copy was unavailable. The email address is displayed below the links.');
    }
  }));
  let paused = false;
  try { paused = localStorage.getItem('gk-motion-paused') === 'true'; } catch {}
  const updateMotion = () => {
    document.documentElement.classList.toggle('motion-paused', paused);
    $$('.motion-toggle').forEach(button => {
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? 'Resume motion' : 'Pause motion';
    });
  };
  updateMotion();
  $$('.motion-toggle').forEach(button => button.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('gk-motion-paused', String(paused)); } catch {}
    updateMotion();
  }));
  $$('img').forEach(img => {
    const failed = () => {
    if (img.dataset.failed) return;
    img.dataset.failed = 'true';
    img.hidden = true;
    const notice = document.createElement('p');
    notice.className = 'figure-note image-fallback';
    notice.textContent = 'Project image unavailable. The case study provides the context.';
    img.insertAdjacentElement('afterend', notice);
    };
    img.addEventListener('error', failed);
    if (img.complete && img.currentSrc && img.naturalWidth === 0) failed();
  });
  let printStates = [];
  window.addEventListener('beforeprint', () => {
    printStates = $$('details').map(el => [el, el.open]);
    printStates.forEach(([el]) => el.open = true);
  });
  window.addEventListener('afterprint', () => printStates.forEach(([el, open]) => el.open = open));
  $$('.print-profile').forEach(button => button.addEventListener('click', () => window.print()));
})();

/* User-controlled schematic walkthroughs. Content comes from editable stages. */
(() => {
  'use strict';
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-work-visual]').forEach(root=>{
    const stages=[...root.querySelectorAll('[data-work-stage]')];
    const play=root.querySelector('[data-work-play]'),progress=root.querySelector('.work-progress');
    if(!stages.length || !play || !progress)return;
    let index=0,timer=null;
    const quiet=()=>preference.matches || document.documentElement.classList.contains('motion-paused');
    function stop(){
      if(timer!==null)window.clearInterval(timer);
      timer=null;root.dataset.workPlaying='false';
      play.textContent=quiet()?'Motion reduced':index===stages.length-1?'Replay walkthrough':'Play walkthrough';
    }
    function select(next){
      index=Math.max(0,Math.min(stages.length-1,next));
      root.dataset.workStep=String(index);
      stages.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
      progress.textContent=`Stage ${index+1} of ${stages.length} · ${stages[index].querySelector('strong')?.textContent || ''}`;
    }
    stages.forEach((button,i)=>{
      button.disabled=false;
      button.addEventListener('click',()=>{select(i);stop();});
      button.addEventListener('keydown',event=>{
        let next;
        if(event.key==='ArrowRight')next=Math.min(stages.length-1,i+1);
        if(event.key==='ArrowLeft')next=Math.max(0,i-1);
        if(event.key==='Home')next=0;
        if(event.key==='End')next=stages.length-1;
        if(next!==undefined){event.preventDefault();select(next);stop();stages[next].focus();}
      });
    });
    play.addEventListener('click',()=>{
      if(timer!==null || quiet())return stop();
      if(index===stages.length-1)select(0);
      root.dataset.workPlaying='true';play.textContent='Pause walkthrough';
      timer=window.setInterval(()=>{
        select(index+1);
        if(index===stages.length-1)stop();
      },2400);
    });
    const updatePreference=()=>{if(quiet())stop();play.disabled=quiet();if(timer===null)stop();};
    preference.addEventListener?.('change',updatePreference);
    new MutationObserver(updatePreference).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    select(0);updatePreference();
  });
})();
