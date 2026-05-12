import { safeJsonFetch } from './app.js';
import { getBudgetLabelForPrice, hasListedPrice, isPriceWithinBudget } from './budget.js';

const PRODUCT_TYPE_LABELS = {
  shampoo: 'Shampoo',
  conditioner: 'Conditioner',
  'leave-in': 'Leave-in',
  'deep conditioner': 'Deep conditioner',
  oil: 'Oil',
  'gel/mousse': 'Gel/mousse',
  'scalp treatment': 'Scalp treatment'
};

const GOAL_LABELS = {
  moisture: 'Moisture',
  'curl definition': 'Curl definition',
  'frizz control': 'Frizz control',
  'growth support': 'Growth support',
  'thickness/volume': 'Thickness/volume',
  'scalp hydration': 'Scalp hydration',
  'protective styling': 'Protective styling',
  'damage repair': 'Damage repair'
};

function getProductTypeTokenClass(productType) {
  return `product-type-${productType.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()}`;
}

function normalizeFilterArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`), (input) => input.value);
}

function getBudgetMaxFromSlider() {
  const slider = document.getElementById('filterBudget');
  return Number(slider.value);
}

function updateBudgetLabel() {
  const slider = document.getElementById('filterBudget');
  const label = document.getElementById('filterBudgetLabel');
  label.textContent = `$${slider.value}`;
}

function getPriceValue(product) {
  return hasListedPrice(product.price) ? product.price : null;
}

export function filterProducts(products, filters) {
  const selectedProductTypes = normalizeFilterArray(filters.productType);
  const selectedGoals = normalizeFilterArray(filters.goal);

  return products.filter((product) => {
    const matchesHairType = !filters.hairType || product.bestHairTypes.includes(filters.hairType);
    const matchesPorosity = !filters.porosity || product.bestPorosity.includes(filters.porosity);
    const matchesDensity = !filters.density || product.bestDensity.includes(filters.density);
    const matchesProductType = selectedProductTypes.length === 0 || selectedProductTypes.includes(product.productType);
    const matchesBudget = typeof filters.budget === 'number'
      ? hasListedPrice(product.price) && product.price <= filters.budget
      : !filters.budget || isPriceWithinBudget(product.price, filters.budget);
    const matchesGoal = selectedGoals.length === 0 || selectedGoals.some((goal) => product.goals.includes(goal));

    return matchesHairType && matchesPorosity && matchesDensity && matchesProductType && matchesBudget && matchesGoal;
  });
}

export function sortProducts(products, sortOrder) {
  if (sortOrder !== 'price-low-high' && sortOrder !== 'price-high-low') {
    return [...products];
  }

  const direction = sortOrder === 'price-low-high' ? 1 : -1;

  return [...products].sort((left, right) => {
    const leftPrice = getPriceValue(left);
    const rightPrice = getPriceValue(right);

    if (leftPrice === null && rightPrice === null) {
      return 0;
    }

    if (leftPrice === null) {
      return 1;
    }

    if (rightPrice === null) {
      return -1;
    }

    return (leftPrice - rightPrice) * direction;
  });
}

function buildProductCard(product) {
  const chips = product.ingredients.slice(0, 4).map((entry) => `<span class="ingredient-chip">${entry}</span>`).join('');
  const productLink = product.productUrl
    ? `<a class="btn btn-outline-brand btn-sm mt-3" href="${product.productUrl}" target="_blank" rel="noopener noreferrer">Visit Product Site</a>`
    : '';
  const priceText = hasListedPrice(product.price) ? `$${product.price.toFixed(2)}` : 'Price unavailable';
  const productTypeClass = getProductTypeTokenClass(product.productType);

  return `
    <div class="col-lg-4 col-md-6">
      <article class="product-card">
        <div class="product-card-header mb-3">
          <div>
            <span class="mini-pill mb-2 ${productTypeClass}">${product.productType}</span>
            <h3 class="mb-1">${product.name}</h3>
            <p class="mb-0">${product.brand}</p>
          </div>
          <div class="product-price">${priceText}</div>
        </div>
        <p>${product.description}</p>
        <div class="detail-row mb-3">
          <span class="detail-chip">${getBudgetLabelForPrice(product.price)}</span>
          <span class="detail-chip">${product.goals.slice(0, 2).join(', ')}</span>
        </div>
        <div class="chip-row">${chips}</div>
        ${productLink}
      </article>
    </div>
  `;
}

function getFilters() {
  return {
    hairType: '',
    porosity: '',
    density: '',
    productType: getCheckedValues('productType'),
    budget: getBudgetMaxFromSlider(),
    goal: getCheckedValues('goal'),
    sort: document.getElementById('filterSort')?.value || 'default'
  };
}

function buildActiveFilterEntries(filters) {
  const entries = [];

  filters.productType.forEach((value) => {
    entries.push({
      label: PRODUCT_TYPE_LABELS[value] || value,
      className: getProductTypeTokenClass(value)
    });
  });

  filters.goal.forEach((value) => {
    entries.push({
      label: GOAL_LABELS[value] || value,
      className: ''
    });
  });

  if (filters.budget < 100) {
    entries.push({
      label: `Up to $${filters.budget}`,
      className: ''
    });
  }

  if (filters.sort === 'price-low-high') {
    entries.push({
      label: 'Price: Low to high',
      className: ''
    });
  }

  if (filters.sort === 'price-high-low') {
    entries.push({
      label: 'Price: High to low',
      className: ''
    });
  }

  return entries;
}

function updateActiveFilterSummary(filters) {
  const entries = buildActiveFilterEntries(filters);
  const count = document.getElementById('activeFilterCount');
  const chips = document.getElementById('activeFilterChips');

  count.textContent = String(entries.length);
  chips.innerHTML = entries.length
    ? entries.map((entry) => `<span class="detail-chip ${entry.className}">${entry.label}</span>`).join('')
    : '<span class="muted-small">No filters selected yet.</span>';
}

function updateResultsExplainer(filters, total) {
  const explainer = document.getElementById('product-results-explainer');
  const productTypes = filters.productType.length
    ? filters.productType.map((value) => PRODUCT_TYPE_LABELS[value] || value).join(', ')
    : 'all product types';
  const goals = filters.goal.length
    ? filters.goal.map((value) => GOAL_LABELS[value] || value).join(', ')
    : 'all goals';
  const sortLabel = filters.sort === 'price-low-high'
    ? ' Sorted from low to high price.'
    : filters.sort === 'price-high-low'
      ? ' Sorted from high to low price.'
      : '';

  explainer.textContent = `${total} match${total === 1 ? '' : 'es'} for ${productTypes}, focused on ${goals}.${sortLabel}`;
}

function clearAllFilters() {
  document.querySelectorAll('input[name="productType"], input[name="goal"]').forEach((input) => {
    input.checked = false;
  });
  document.getElementById('filterBudget').value = '100';
  document.getElementById('filterSort').value = 'default';
}

async function initProductsPage() {
  const grid = document.getElementById('products-grid');

  if (!grid) {
    return;
  }

  const count = document.getElementById('product-results-count');
  const clearButton = document.getElementById('clearFilters');
  const controls = Array.from(document.querySelectorAll('input[name="productType"], input[name="goal"], #filterBudget, #filterSort'));

  try {
    const products = await safeJsonFetch('data/products.json');

    const render = () => {
      updateBudgetLabel();
      const filters = getFilters();
      const filteredProducts = sortProducts(filterProducts(products, filters), filters.sort);
      updateActiveFilterSummary(filters);
      count.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} shown`;
      updateResultsExplainer(filters, filteredProducts.length);
      grid.innerHTML = filteredProducts.map((product) => buildProductCard(product)).join('');
    };

    controls.forEach((control) => control.addEventListener('input', render));
    controls.forEach((control) => control.addEventListener('change', render));
    clearButton.addEventListener('click', () => {
      clearAllFilters();
      render();
    });

    render();
  } catch (error) {
    count.textContent = error.message;
  }
}

if (typeof document !== 'undefined') {
  void initProductsPage();
}
