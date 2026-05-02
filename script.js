/* =========================================================
   hieuhfgr - VOI archive  |  script.js
   Loads data.json → renders full timeline dynamically.
   To add/edit memories: only touch data.json.
   ========================================================= */

const timeline = document.getElementById('timeline');

/* ── Load & render ──────────────────────────────────────── */
async function loadMemories() {
  let data;
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    timeline.innerHTML = `<p style="text-align:center;color:#a0432a;padding:3rem;font-family:'Caveat',cursive;font-size:1.2rem;">
      Couldn't load memories — ${err.message}<br>
      <small>Make sure data.json is in the same folder and you're using a local server.</small>
    </p>`;
    return;
  }

  timeline.innerHTML = ''; // clear loading message

  data.forEach((group, groupIdx) => {
    /* ── Year divider ── */
    const divider = document.createElement('div');
    divider.className = 'year-divider';
    divider.innerHTML = `<span class="year-label">${escHtml(group.title)}</span>`;
    timeline.appendChild(divider);

    /* ── Section note ── */
    if (group.note) {
      const note = document.createElement('p');
      note.className = 'section-note';
      note.textContent = group.note;
      timeline.appendChild(note);
    }

    /* ── Doodle arrow (only after first group) ── */
    if (groupIdx > 0) {
      const arrowWrap = document.createElement('div');
      arrowWrap.style.cssText = 'position:relative;height:24px;margin-bottom:0.5rem';
      arrowWrap.innerHTML = `
        <svg class="doodle-arrow" style="left:50%;top:0;transform:translateX(-50%)"
             width="60" height="24" viewBox="0 0 60 24" fill="none" aria-hidden="true">
          <path d="M30 2 C30 2, 30 18, 30 20" stroke="#8b6340" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M22 14 L30 22 L38 14" stroke="#8b6340" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>`;
      timeline.appendChild(arrowWrap);
    }

    /* ── Gallery row ── */
    const row = document.createElement('div');
    row.className = 'gallery-row';

    group.images.forEach(imgData => {
      const card = buildPolaroid(imgData);
      row.appendChild(card);
    });

    timeline.appendChild(row);
  });

  /* ── After render: scroll-reveal + lightbox ── */
  initScrollReveal();
  initLightbox();
}

/* ── Build one polaroid card ────────────────────────────── */
function buildPolaroid(imgData) {
  const rot = imgData.rot ?? randomRot();

  const card = document.createElement('div');
  card.className = 'polaroid';
  card.style.setProperty('--rot', `${rot}deg`);

  /* Store full description for lightbox */
  card.dataset.description = imgData.description || '';
  card.dataset.fullCaption  = imgData.caption || '';

  /* Stamp badge */
  const stampHtml = imgData.stamp
    ? `<span class="stamp">${escHtml(imgData.stamp)}</span>`
    : '';

  /* Caption — optionally wrap first occurrence of linkText in <a> */
  let captionHtml = escHtml(imgData.caption || '');
  if (imgData.link && imgData.linkText) {
    const safeText = escHtml(imgData.linkText);
    captionHtml = captionHtml.replace(
      safeText,
      `<a href="${escHtml(imgData.link)}" target="_blank" rel="noopener noreferrer">${safeText}</a>`
    );
  }

  card.innerHTML = `
    ${stampHtml}
    <div class="polaroid-img-wrap">
      <img src="${escHtml(imgData.src)}" alt="${escHtml(imgData.caption || '')}" loading="lazy">
    </div>
    <p class="polaroid-caption">
      ${captionHtml}
      ${imgData.date ? `<span class="date">${escHtml(imgData.date)}</span>` : ''}
    </p>`;

  return card;
}

/* ── Scroll-reveal via IntersectionObserver ─────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.polaroid').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 2) * 0.12}s`;
    observer.observe(el);
  });
}

/* ── Lightbox ───────────────────────────────────────────── */
function initLightbox() {
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lightboxImg');
  const lbCaption = document.getElementById('lightboxCaption');
  const lbDesc    = document.getElementById('lightboxDescription');
  const lbClose   = document.getElementById('lightboxClose');

  document.querySelectorAll('.polaroid').forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      lbImg.src        = img.src;
      lbImg.alt        = img.alt;
      lbCaption.textContent = card.dataset.fullCaption || img.alt;
      lbDesc.textContent    = card.dataset.description || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

/* ── Parallax background ────────────────────────────────── */
const bg = document.getElementById('parallaxBg');
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      bg.style.transform = `translateY(${window.scrollY * 0.18}px)`;
      ticking = false;
    });
    ticking = true;
  }
});

/* ── Helpers ────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function randomRot() {
  const pool = [-3.5, -2.5, -1.8, -1.2, 1.5, 2.2, 2.8, 3.1, 4.2];
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ── Init ───────────────────────────────────────────────── */
loadMemories();
