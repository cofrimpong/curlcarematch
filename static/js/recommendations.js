import { safeJsonFetch } from './app.js';
import { getBudgetLabelForPrice, hasListedPrice, isPriceWithinBudget } from './budget.js';

export const SCORE_WEIGHTS = {
  hairType: 20,
  porosity: 20,
  density: 15,
  goal: 20,
  budget: 15,
  ingredients: 10
};

const MAX_RECOMMENDATIONS = 8;
const MAX_PER_BRAND_FIRST_PASS = 2;

function normalizeList(values) {
  return (values || []).map((value) => value.toLowerCase());
}

function sentenceCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

export function getBadgeLabel(score) {
  if (score >= 67) {
    return { label: 'Best Match', className: 'score-best' };
  }

  if (score >= 34) {
    return { label: 'Good Match', className: 'score-good' };
  }

  return { label: 'Possible Match', className: 'score-possible' };
}

function getIngredientScore(product, avoidIngredients) {
  if (!avoidIngredients.length) {
    return {
      score: SCORE_WEIGHTS.ingredients,
      warnings: []
    };
  }

  const productIngredients = normalizeList(product.ingredients);
  const warningText = normalizeList(product.avoidWarnings);
  const conflicts = avoidIngredients.filter((entry) => {
    const normalizedEntry = entry.toLowerCase();
    return productIngredients.includes(normalizedEntry) || warningText.some((warning) => warning.includes(normalizedEntry));
  });
  const score = Math.max(0, SCORE_WEIGHTS.ingredients - conflicts.length * 5);
  const warnings = conflicts.map((entry) => `Contains ${entry}.`);

  return { score, warnings };
}

export function scoreProduct(profile, product) {
  let score = 0;
  const reasons = [];
  const warnings = [];
  const breakdown = {
    hairType: 0,
    porosity: 0,
    density: 0,
    goal: 0,
    budget: 0,
    ingredients: 0
  };

  if (profile.hairType === 'unknown') {
    breakdown.hairType = 10;
    reasons.push('hair type left as unknown, so scoring stays flexible');
  } else if (product.bestHairTypes.includes(profile.hairType)) {
    breakdown.hairType = SCORE_WEIGHTS.hairType;
    reasons.push(`matches your ${profile.hairType} hair type`);
  }

  if (profile.porosity === 'unsure') {
    breakdown.porosity = 10;
    reasons.push('porosity is unsure, so medium weight was applied');
  } else if (product.bestPorosity.includes(profile.porosity)) {
    breakdown.porosity = SCORE_WEIGHTS.porosity;
    reasons.push(`fits ${profile.porosity} porosity needs`);
  }

  if (profile.density === 'unsure') {
    breakdown.density = 8;
    reasons.push('density is unsure, so partial credit was used');
  } else if (product.bestDensity.includes(profile.density)) {
    breakdown.density = SCORE_WEIGHTS.density;
    reasons.push(`works well for ${profile.density} density hair`);
  }

  if (product.goals.includes(profile.goal)) {
    breakdown.goal = SCORE_WEIGHTS.goal;
    reasons.push(`supports your ${profile.goal} goal`);
  }

  if (isPriceWithinBudget(product.price, profile.budget)) {
    breakdown.budget = SCORE_WEIGHTS.budget;
    reasons.push(`stays inside your ${profile.budget} budget`);
  } else if (!hasListedPrice(product.price)) {
    warnings.push('Official site does not list a direct price.');
  }

  const ingredientScore = getIngredientScore(product, profile.avoidIngredients || []);
  breakdown.ingredients = ingredientScore.score;
  warnings.push(...ingredientScore.warnings);

  if (ingredientScore.score === SCORE_WEIGHTS.ingredients) {
    reasons.push('avoids your selected ingredient concerns');
  }

  if (profile.scalpConcern !== 'none') {
    if (product.scalpConcerns.includes(profile.scalpConcern)) {
      reasons.push(`lines up with your ${profile.scalpConcern} scalp concern`);
    } else {
      warnings.push(`Not specifically targeted toward ${profile.scalpConcern}.`);
    }
  }

  score = Object.values(breakdown).reduce((total, value) => total + value, 0);
  const uniqueWarnings = [...new Set(warnings)];

  return {
    ...product,
    score,
    breakdown,
    reasons,
    warnings: uniqueWarnings,
    badge: getBadgeLabel(score)
  };
}

function getExplanationLead(score) {
  if (score >= 67) {
    return 'This product scored strongly because it';
  }

  if (score >= 34) {
    return 'This product is a moderate fit because it';
  }

  return 'This product is a limited fit because it';
}

export function buildExplanation(match) {
  const reasons = match.reasons.slice(0, 4).join(', ');
  const warningSentence = match.warnings.length ? ` ${match.warnings.slice(0, 2).join(' ')}` : '';

  if (!reasons) {
    return `This product has limited overlap with your selected profile.${warningSentence}`;
  }

  return `${getExplanationLead(match.score)} ${reasons}.${warningSentence}`;
}

export function selectRecommendations(products, profile) {
  const candidates = profile.productType
    ? products.filter((product) => product.productType === profile.productType)
    : products;

  const ranked = candidates
    .map((product) => {
      const match = scoreProduct(profile, product);
      return {
        ...match,
        explanation: buildExplanation(match)
      };
    })
    .sort((left, right) => right.score - left.score);

  const highConfidence = ranked.filter((item) => item.score >= 50);
  const source = highConfidence.length >= 5 ? highConfidence : ranked;

  const diversified = [];
  const brandCounts = new Map();

  for (const item of source) {
    if (diversified.length >= MAX_RECOMMENDATIONS) {
      break;
    }

    const currentCount = brandCounts.get(item.brand) || 0;

    if (currentCount >= MAX_PER_BRAND_FIRST_PASS) {
      continue;
    }

    diversified.push(item);
    brandCounts.set(item.brand, currentCount + 1);
  }

  if (diversified.length < MAX_RECOMMENDATIONS) {
    for (const item of source) {
      if (diversified.length >= MAX_RECOMMENDATIONS) {
        break;
      }

      if (diversified.some((candidate) => candidate.id === item.id)) {
        continue;
      }

      diversified.push(item);
    }
  }

  return diversified;
}

function renderProfileSummary(profile) {
  const mount = document.getElementById('results-profile-summary');
  const chips = [
    `Hair type: ${profile.hairType === 'unknown' ? 'Unknown' : profile.hairType}`,
    `Porosity: ${sentenceCase(profile.porosity)}`,
    `Density: ${sentenceCase(profile.density)}`,
    `Goal: ${sentenceCase(profile.goal)}`,
    `Budget: ${profile.budget}`
  ];

  mount.innerHTML = chips.map((chip) => `<span class="detail-chip">${chip}</span>`).join('');
}

function renderResultCards(recommendations) {
  const grid = document.getElementById('results-grid');

  grid.innerHTML = recommendations
    .map((item) => {
      const ingredients = item.ingredients.slice(0, 4).map((entry) => `<span class="ingredient-chip">${entry}</span>`).join('');
      const warnings = item.warnings.slice(0, 3).map((entry) => `<span class="warning-chip">${entry}</span>`).join('');
      const productLink = item.productUrl
        ? `<a class="btn btn-outline-brand btn-sm" href="${item.productUrl}" target="_blank" rel="noopener noreferrer">Visit Product Site</a>`
        : '';
      const priceText = hasListedPrice(item.price) ? `$${item.price.toFixed(2)}` : 'Price unavailable';

      return `
        <div class="col-lg-6">
          <article class="results-card">
            <div class="results-card-header mb-3">
              <div>
                <span class="mini-pill mb-2">${item.productType}</span>
                <h3 class="mb-1">${item.name}</h3>
                <p class="mb-0">${item.brand}</p>
              </div>
              <div class="text-lg-end">
                <div class="results-card-score ${item.badge.className}">Product Fit Score: ${item.score}/100</div>
                <span class="score-badge ${item.badge.className} mt-2">${item.badge.label}</span>
              </div>
            </div>
            <div class="detail-row mb-3">
              <span class="detail-chip">${getBudgetLabelForPrice(item.price)}</span>
              <span class="detail-chip">${priceText}</span>
              <span class="detail-chip">Best for ${item.goals.slice(0, 2).join(', ')}</span>
            </div>
            <p>${item.description}</p>
            <p>${item.explanation}</p>
            <div class="chip-row mb-3">${ingredients}</div>
            <div class="chip-row">${warnings}</div>
            <div class="mt-3">${productLink}</div>
          </article>
        </div>
      `;
    })
    .join('');
}

function renderNoResults(emptyState, profile) {
  emptyState.classList.remove('d-none');
  emptyState.innerHTML = `
    <h2 class="h3">No matches found yet</h2>
    <p class="mb-0">No products matched your current profile closely enough to show results. Try broadening your budget, scalp concern, or ingredient preferences, or browse the full product library instead.</p>
    <div class="d-flex flex-wrap gap-3 mt-3">
      <a class="btn btn-brand" href="quiz.html">Adjust profile</a>
      <a class="btn btn-outline-brand" href="products.html">Browse product library</a>
    </div>
  `;
}

async function initResultsPage() {
  const grid = document.getElementById('results-grid');

  if (!grid) {
    return;
  }

  const emptyState = document.getElementById('results-empty');
  const rawProfile = sessionStorage.getItem('curlcareProfile');

  if (!rawProfile) {
    emptyState.classList.remove('d-none');
    emptyState.innerHTML = '<h2 class="h3">No hair profile found</h2><p class="mb-0">Start with your profile so the recommendation engine has enough context to rank products.</p><a class="btn btn-brand mt-3" href="quiz.html">Build profile</a>';
    return;
  }

  try {
    const profile = JSON.parse(rawProfile);
    const products = await safeJsonFetch('data/products.json');
    const recommendations = selectRecommendations(products, profile);
    renderProfileSummary(profile);

    if (!recommendations.length) {
      grid.innerHTML = '';
      renderNoResults(emptyState, profile);
      return;
    }

    renderResultCards(recommendations);
  } catch (error) {
    emptyState.classList.remove('d-none');
    emptyState.innerHTML = `<h2 class="h3">Unable to load results</h2><p class="mb-0">${error.message}</p>`;
  }
}

if (typeof document !== 'undefined') {
  void initResultsPage();
}
