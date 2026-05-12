import { describe, expect, it } from 'vitest';
import { filterProducts, sortProducts } from '../static/js/products.js';

const products = [
  {
    name: 'Wave Mist',
    brand: 'Test',
    price: 8.99,
    bestHairTypes: ['2A'],
    bestPorosity: ['low'],
    bestDensity: ['low'],
    productType: 'leave-in',
    budgetCategory: 'under $10',
    goals: ['frizz control']
  },
  {
    name: 'Coil Cream',
    brand: 'Test',
    price: 18.99,
    bestHairTypes: ['4C'],
    bestPorosity: ['high'],
    bestDensity: ['high'],
    productType: 'leave-in',
    budgetCategory: '$15-$25',
    goals: ['moisture']
  },
  {
    name: 'Official Link Only',
    brand: 'Test',
    price: null,
    bestHairTypes: ['3A'],
    bestPorosity: ['medium'],
    bestDensity: ['high'],
    productType: 'leave-in',
    budgetCategory: 'price unavailable',
    goals: ['moisture']
  }
];

describe('filterProducts', () => {
  it('filters by hair type and porosity', () => {
    const result = filterProducts(products, { hairType: '4C', porosity: 'high', density: '', productType: [], budget: '', goal: [] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Coil Cream');
  });

  it('filters by product type and budget', () => {
    const result = filterProducts(products, { hairType: '', porosity: '', density: '', productType: ['leave-in'], budget: 'up to $10', goal: [] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Wave Mist');
  });

  it('supports multiple product types and goals', () => {
    const result = filterProducts(products, {
      hairType: '',
      porosity: '',
      density: '',
      productType: ['leave-in', 'oil'],
      budget: 25,
      goal: ['moisture', 'frizz control']
    });

    expect(result.map((product) => product.name)).toEqual(['Wave Mist', 'Coil Cream']);
  });

  it('excludes products without listed prices when a budget is selected', () => {
    const result = filterProducts(products, { hairType: '', porosity: '', density: '', productType: ['leave-in'], budget: 'up to $25', goal: [] });
    expect(result.map((product) => product.name)).not.toContain('Official Link Only');
  });
});

describe('sortProducts', () => {
  it('sorts products from low to high price', () => {
    const result = sortProducts(products, 'price-low-high');

    expect(result.map((product) => product.name)).toEqual(['Wave Mist', 'Coil Cream', 'Official Link Only']);
  });

  it('sorts products from high to low price', () => {
    const result = sortProducts(products, 'price-high-low');

    expect(result.map((product) => product.name)).toEqual(['Coil Cream', 'Wave Mist', 'Official Link Only']);
  });
});
