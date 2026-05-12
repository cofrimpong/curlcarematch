import { describe, expect, it } from 'vitest';
import { scoreProduct } from '../static/js/recommendations.js';

const product = {
  name: 'Test Leave-In',
  price: 12,
  bestHairTypes: ['4C'],
  bestPorosity: ['low'],
  bestDensity: ['high'],
  goals: ['moisture'],
  budgetCategory: '$10-$15',
  scalpConcerns: ['dryness'],
  ingredients: ['aloe vera', 'glycerin'],
  avoidWarnings: []
};

describe('scoreProduct', () => {
  it('rewards direct hair profile matches', () => {
    const match = scoreProduct(
      {
        hairType: '4C',
        porosity: 'low',
        density: 'high',
        goal: 'moisture',
        budget: 'up to $15',
        scalpConcern: 'dryness',
        avoidIngredients: []
      },
      product
    );

    expect(match.score).toBe(100);
  });

  it('reduces ingredient score when avoided ingredients conflict', () => {
    const match = scoreProduct(
      {
        hairType: '4C',
        porosity: 'low',
        density: 'high',
        goal: 'moisture',
        budget: 'up to $15',
        scalpConcern: 'dryness',
        avoidIngredients: ['glycerin']
      },
      product
    );

    expect(match.breakdown.ingredients).toBe(5);
    expect(match.warnings.some((warning) => warning.includes('glycerin'))).toBe(true);
  });

  it('does not award budget points when the official site does not list a price', () => {
    const match = scoreProduct(
      {
        hairType: '4C',
        porosity: 'low',
        density: 'high',
        goal: 'moisture',
        budget: 'up to $15',
        scalpConcern: 'dryness',
        avoidIngredients: []
      },
      {
        ...product,
        price: null
      }
    );

    expect(match.breakdown.budget).toBe(0);
    expect(match.warnings).toContain('Official site does not list a direct price.');
  });

  it('does not show product avoid warnings unless the user selected matching ingredients to avoid', () => {
    const match = scoreProduct(
      {
        hairType: '4C',
        porosity: 'low',
        density: 'high',
        goal: 'moisture',
        budget: 'up to $15',
        scalpConcern: 'dryness',
        avoidIngredients: []
      },
      {
        ...product,
        ingredients: ['coconut oil', 'shea butter'],
        avoidWarnings: ['contains coconut oil', 'contains heavy oils/butters']
      }
    );

    expect(match.warnings).not.toContain('Contains coconut oil.');
    expect(match.warnings).not.toContain('Contains heavy oils/butters.');
  });

  it('shows matched ingredient warnings when the user selected those ingredients to avoid', () => {
    const match = scoreProduct(
      {
        hairType: '4C',
        porosity: 'low',
        density: 'high',
        goal: 'moisture',
        budget: 'up to $15',
        scalpConcern: 'dryness',
        avoidIngredients: ['coconut oil']
      },
      {
        ...product,
        ingredients: ['coconut oil', 'shea butter'],
        avoidWarnings: ['contains coconut oil', 'contains heavy oils/butters']
      }
    );

    expect(match.warnings).toContain('Contains coconut oil.');
    expect(match.warnings).not.toContain('Contains heavy oils/butters.');
  });
});
