export const BUDGET_OPTIONS = [
  { value: 'up to $10', label: 'Up to $10', max: 10 },
  { value: 'up to $15', label: 'Up to $15', max: 15 },
  { value: 'up to $25', label: 'Up to $25', max: 25 },
  { value: 'up to $40', label: 'Up to $40', max: 40 },
  { value: 'up to $60', label: 'Up to $60', max: 60 },
  { value: 'up to $100', label: 'Up to $100', max: 100 }
];

export function getBudgetMax(budgetValue) {
  const option = BUDGET_OPTIONS.find((entry) => entry.value === budgetValue);
  return option ? option.max : Number.POSITIVE_INFINITY;
}

export function hasListedPrice(price) {
  return typeof price === 'number' && Number.isFinite(price) && price >= 0;
}

export function isPriceWithinBudget(price, budgetValue) {
  if (!hasListedPrice(price)) {
    return false;
  }

  return price <= getBudgetMax(budgetValue);
}

export function getBudgetLabelForPrice(price) {
  if (!hasListedPrice(price)) {
    return 'Price unavailable';
  }

  const option = BUDGET_OPTIONS.find((entry) => price <= entry.max);
  return option ? option.label : 'Over $100';
}