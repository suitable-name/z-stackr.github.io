/**
 * z-stackr — site script.
 *
 * No external resources are loaded. Without the script every page still reads
 * top to bottom; the before/after figures then show the stacked result alone.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageToc();
  initCopyButtons();
  initCompare();
});

/* -------------------------------------------------------------
 * "On this page", built from the page's own numbered sections
 * (`main > section[id]` with an <h2>), so it never drifts from the
 * headings. Wide screens: a sticky sidebar with the section in view
 * marked. Narrow screens: a collapsible list under the page title and a
 * "Contents" button that returns to it.
 * ----------------------------------------------------------- */

const TOC_MIN_SECTIONS = 5;

function tocEntries(main) {
  return [...main.querySelectorAll(':scope > section[id]')]
    .map((section) => {
      const h2 = section.querySelector(':scope > h2');
      if (!h2) return null;
      const num = h2.querySelector('.sec-num');
      const label = [...h2.childNodes]
        .filter((n) => !(n.nodeType === 1 && n.classList.contains('sec-num')))
        .map((n) => n.textContent)
        .join('')
        .trim();
      return { id: section.id, num: num ? num.textContent.trim() : '', label, section };
    })
    .filter(Boolean);
}

function tocList(entries) {
  const ol = document.createElement('ol');
  for (const e of entries) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + e.id;
    a.dataset.target = e.id;
    if (e.num) {
      const n = document.createElement('span');
      n.className = 'toc-num';
      n.textContent = e.num;
      a.append(n);
    }
    const text = document.createElement('span');
    text.textContent = e.label;
    a.append(text);
    li.append(a);
    ol.append(li);
  }
  return ol;
}

function initPageToc() {
  const main = document.querySelector('main.container');
  if (!main) return;
  const entries = tocEntries(main);
  if (entries.length < TOC_MIN_SECTIONS) return;

  const side = document.createElement('nav');
  side.className = 'toc-side';
  side.setAttribute('aria-label', 'On this page');
  const sideHead = document.createElement('p');
  sideHead.className = 'toc-head';
  sideHead.textContent = 'On this page';
  side.append(sideHead, tocList(entries));

  const inline = document.createElement('details');
  inline.className = 'toc-inline';
  inline.id = 'contents';
  const summary = document.createElement('summary');
  summary.textContent = 'On this page · ' + entries.length + ' sections';
  const inlineNav = document.createElement('nav');
  inlineNav.setAttribute('aria-label', 'On this page');
  inlineNav.append(tocList(entries));
  inline.append(summary, inlineNav);
  const head = main.querySelector(':scope > .page-head');
  if (head) head.after(inline); else main.prepend(inline);

  const back = document.createElement('a');
  back.className = 'toc-back';
  back.href = '#contents';
  back.textContent = 'Contents';
  back.addEventListener('click', () => { inline.open = true; });
  document.body.append(back);

  main.prepend(side);
  main.classList.add('with-toc');
  document.body.classList.add('has-toc');
  side.style.gridRow = '1 / span ' + main.children.length;

  inlineNav.addEventListener('click', (ev) => {
    if (ev.target.closest('a')) inline.open = false;
  });

  if (!('IntersectionObserver' in window)) return;

  new IntersectionObserver((records) => {
    for (const r of records) {
      back.classList.toggle('is-visible', !r.isIntersecting && r.boundingClientRect.top < 0);
    }
  }).observe(inline);

  const links = [...side.querySelectorAll('a')];
  const setCurrent = () => {
    let current = entries[0].id;
    const line = window.innerHeight / 3;
    for (const e of entries) {
      if (e.section.getBoundingClientRect().top <= line) current = e.id;
    }
    for (const a of links) {
      if (a.dataset.target === current) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };
  let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; setCurrent(); });
  }, { passive: true });
  window.addEventListener('resize', setCurrent);
  setCurrent();
}

/* -------------------------------------------------------------
 * Copy-to-clipboard for code blocks.
 * ----------------------------------------------------------- */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block')?.querySelector('code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        const label = button.textContent;
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = label; }, 1500);
      } catch (err) {
        console.error('Copy failed: ', err);
      }
    });
  });
}

/* -------------------------------------------------------------
 * Before / after figures: `.compare` holds two images of equal size; a
 * range input over them moves the split. Keyboard: the input's own arrow
 * keys. Without the script the CSS default split (50 %) stays.
 * ----------------------------------------------------------- */
function initCompare() {
  document.querySelectorAll('.compare').forEach((box) => {
    const range = box.querySelector('input[type="range"]');
    if (!range) return;
    const set = () => box.style.setProperty('--split', range.value + '%');
    range.addEventListener('input', set);
    set();
  });
}
