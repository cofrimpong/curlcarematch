import { initChatAssistant } from './chatbot.js';
import { initAuthUi } from './auth.js';

const NAV_LINKS = [
  { href: 'index.html#why-this-exists', label: 'About', page: 'about' },
  { href: 'hair-type-guide.html', label: 'Hair Type Guide', page: 'hair-guide' },
  { href: 'quiz.html', label: 'Profile', page: 'quiz' },
  { href: 'results.html', label: 'Results', page: 'results' },
  { href: 'products.html', label: 'Products', page: 'products' }
];

const CURL_TYPES = [
  { id: '1A', path: 'M20 8 L20 150' },
  { id: '1B', path: 'M18 8 C20 48 22 96 20 150' },
  { id: '1C', path: 'M16 8 C24 44 12 94 20 150' },
  { id: '2A', path: 'M18 8 C4 42 36 78 20 114 C8 134 16 144 22 150' },
  { id: '2B', path: 'M20 8 C4 30 34 52 20 76 C6 98 34 118 20 150' },
  { id: '2C', path: 'M19 8 C3 24 36 42 18 62 C2 84 35 102 18 122 C5 138 16 145 21 150' },
  { id: '3A', path: 'M16 8 C2 20 2 42 18 48 C34 54 34 76 18 82 C2 88 2 110 18 116 C34 122 34 142 18 150' },
  { id: '3B', path: 'M14 8 C34 18 34 42 16 50 C0 58 0 82 18 90 C36 98 36 122 18 130 C4 136 4 146 18 150' },
  { id: '3C', path: 'M18 8 C34 18 34 30 18 40 C4 48 4 62 18 70 C32 78 32 92 18 100 C6 108 6 122 18 130 C30 138 30 146 20 150' },
  { id: '4A', path: 'M20 8 C8 16 8 28 20 36 C32 44 32 56 20 64 C8 72 8 84 20 92 C32 100 32 112 20 120 C8 128 8 140 20 150' },
  { id: '4B', path: 'M20 8 C10 12 30 18 20 24 C10 30 30 36 20 42 C10 48 30 54 20 60 C10 66 30 72 20 78 C10 84 30 90 20 96 C10 102 30 108 20 114 C10 120 30 126 20 132 C10 138 30 144 20 150' },
  { id: '4C', path: 'M20 8 C12 12 28 16 20 20 C12 24 28 28 20 32 C12 36 28 40 20 44 C12 48 28 52 20 56 C12 60 28 64 20 68 C12 72 28 76 20 80 C12 84 28 88 20 92 C12 96 28 100 20 104 C12 108 28 112 20 116 C12 120 28 124 20 128 C12 132 28 136 20 140 C12 144 28 148 20 150' }
];

const HAIR_TYPE_GROUPS = {
  '1A-1C': ['1A', '1B', '1C'],
  '2A-2C': ['2A', '2B', '2C'],
  '3A-3C': ['3A', '3B', '3C'],
  '4A-4C': ['4A', '4B', '4C']
};

export async function safeJsonFetch(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${path}. Start the site with a local server instead of opening the file directly.`);
  }

  return response.json();
}

function renderCurlRain() {
  const existingLayer = document.querySelector('[data-curl-rain]');

  if (existingLayer) {
    return;
  }

  const layer = document.createElement('div');
  layer.className = 'curl-rain';
  layer.setAttribute('data-curl-rain', '');
  layer.setAttribute('aria-hidden', 'true');

  const drops = Array.from({ length: 24 }, (_, index) => {
    const type = CURL_TYPES[index % CURL_TYPES.length];
    const left = 2 + ((index * 4.1) % 92);
    const duration = 18 + (index % 6) * 2.2;
    const delay = (index % 8) * -3.2;
    const scale = 0.78 + (index % 5) * 0.08;
    const opacity = 0.16 + (index % 4) * 0.07;

    return `
      <div
        class="curl-drop"
        style="left:${left}%; animation-duration:${duration}s; animation-delay:${delay}s; --curl-scale:${scale}; opacity:${opacity};"
      >
        <svg viewBox="0 0 40 160" role="presentation" focusable="false" aria-hidden="true">
          <path d="${type.path}"></path>
        </svg>
        <span>${type.id}</span>
      </div>
    `;
  }).join('');

  layer.innerHTML = drops;
  document.body.prepend(layer);
}

function renderHeader() {
  const mount = document.querySelector('[data-site-header]');

  if (!mount) {
    return;
  }

  const currentPage = document.body.dataset.page;
  const currentHash = window.location.hash;
  const navItems = NAV_LINKS.map((link) => {
    const isAboutSection = link.page === 'about' && currentPage === 'home' && currentHash === '#why-this-exists';
    const activeClass = link.page === currentPage || isAboutSection ? 'active' : '';
    return `<li class="nav-item"><a class="nav-link ${activeClass}" href="${link.href}">${link.label}</a></li>`;
  }).join('');

  mount.innerHTML = `
    <nav class="navbar navbar-expand-lg site-nav">
      <div class="container py-2">
        <a class="navbar-brand" href="index.html">CurlCare Match</a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#siteNav"
          aria-controls="siteNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="siteNav">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2">
            ${navItems}
          </ul>
          <div class="site-nav-tools ms-lg-3">
            <div data-auth-root></div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function renderFooter() {
  const mount = document.querySelector('[data-site-footer]');

  if (!mount) {
    return;
  }

  mount.innerHTML = '';
}

function buildGuideCard(item) {
  const tags = (item.commonNeeds || item.productGuidance || []).map((entry) => `<span class="detail-chip">${entry}</span>`).join('');

  return `
    <div class="col-md-6 col-xl-4">
      <article class="guide-card p-4">
        <span class="mini-pill mb-3">${item.id || item.level}</span>
        <h3>${item.title || item.level}</h3>
        <p>${item.description}</p>
        <p class="muted-small mb-3">${item.pattern || item.guidance}</p>
        <div class="chip-row">${tags}</div>
      </article>
    </div>
  `;
}

function toGuideAnchor(value) {
  return `type-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function buildHairTypeGuideCard(item) {
  const typeIds = HAIR_TYPE_GROUPS[item.id] || [];
  const swatches = typeIds.map((typeId) => {
    const type = CURL_TYPES.find((entry) => entry.id === typeId);

    if (!type) {
      return '';
    }

    return `
      <div class="hair-type-swatch">
        <svg viewBox="0 0 40 160" role="presentation" focusable="false" aria-hidden="true">
          <path d="${type.path}"></path>
        </svg>
        <span>${type.id}</span>
      </div>
    `;
  }).join('');

  const tags = (item.commonNeeds || []).map((entry) => `<span class="detail-chip">${entry}</span>`).join('');

  return `
    <div class="col-lg-6">
      <article class="guide-card hair-type-card" id="${toGuideAnchor(item.id)}">
        <div class="d-flex flex-wrap justify-content-between gap-3 align-items-start">
          <div>
            <span class="mini-pill mb-3">${item.id}</span>
            <h3 class="mb-2">${item.title}</h3>
          </div>
          <div class="type-chip-grid mt-0">${typeIds.map((typeId) => `<span>${typeId}</span>`).join('')}</div>
        </div>
        <div class="hair-type-visuals">${swatches}</div>
        <div class="hair-type-copy">
          <p>${item.description}</p>
          <p class="muted-small hair-type-pattern">${item.pattern}</p>
          <div class="chip-row">${tags}</div>
        </div>
      </article>
    </div>
  `;
}

function scrollToCurrentHash() {
  if (!window.location.hash) {
    return;
  }

  const target = document.querySelector(window.location.hash);

  if (!target) {
    return;
  }

  target.scrollIntoView();
}

async function renderGuidePages() {
  const hairGuideMount = document.querySelector('[data-hair-guide-grid]');
  const porosityMount = document.querySelector('[data-porosity-guide-grid]');
  const densityMount = document.querySelector('[data-density-guide-grid]');

  if (!hairGuideMount && !porosityMount && !densityMount) {
    return;
  }

  try {
    const guides = await safeJsonFetch('data/hair_guides.json');

    if (hairGuideMount) {
      hairGuideMount.innerHTML = guides.hairTypes.map((entry) => buildHairTypeGuideCard(entry)).join('');
    }

    if (porosityMount) {
      porosityMount.innerHTML = guides.porosity.map((entry) => buildGuideCard(entry)).join('');
    }

    if (densityMount) {
      densityMount.innerHTML = guides.density.map((entry) => buildGuideCard(entry)).join('');
    }

    scrollToCurrentHash();
  } catch (error) {
    const fallback = `<div class="col-12"><div class="alert alert-warning">${error.message}</div></div>`;

    if (hairGuideMount) {
      hairGuideMount.innerHTML = fallback;
    }

    if (porosityMount) {
      porosityMount.innerHTML = fallback;
    }

    if (densityMount) {
      densityMount.innerHTML = fallback;
    }
  }
}

function initBootstrap() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';
  script.integrity = 'sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz';
  script.crossOrigin = 'anonymous';
  document.body.appendChild(script);
}

function initApp() {
  renderCurlRain();
  renderHeader();
  initAuthUi();
  renderFooter();
  void renderGuidePages();
  initBootstrap();
  initChatAssistant();
}

if (typeof document !== 'undefined') {
  initApp();
}
