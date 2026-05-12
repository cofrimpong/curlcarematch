import { describe, expect, it } from 'vitest';
import { getBadgeLabel, selectRecommendations } from '../static/js/recommendations.js';

const products = [
  {
    id: 1,
    name: 'High Match',
    brand: 'Test',
    price: 12,
    budgetCategory: '$10-$15',
    productType: 'leave-in',
    bestHairTypes: ['4C'],
    bestPorosity: ['low'],
    bestDensity: ['high'],
    goals: ['moisture'],
    scalpConcerns: ['dryness'],
    ingredients: ['aloe vera'],
    avoidWarnings: [],
    description: 'High match'
  },
  {
    id: 2,
    name: 'Lower Match',
    brand: 'Test',
    price: 26,
    budgetCategory: '$25+',
    productType: 'leave-in',
    bestHairTypes: ['1A'],
    bestPorosity: ['high'],
    bestDensity: ['low'],
    goals: ['thickness/volume'],
    scalpConcerns: ['none'],
    ingredients: ['coconut oil'],
    avoidWarnings: ['contains coconut oil'],
    description: 'Lower match'
  }
];

const profile = {
  hairType: '4C',
  porosity: 'low',
  density: 'high',
  goal: 'moisture',
  scalpConcern: 'dryness',
  budget: 'up to $15',
  productType: 'leave-in',
  avoidIngredients: []
};

describe('recommendation engine', () => {
  it('sorts products from highest to lowest score', () => {
    const recommendations = selectRecommendations(products, profile);
    expect(recommendations[0].name).toBe('High Match');
  });

  it('limits first-pass crowding from one brand when viable alternatives exist', () => {
    const crowdedProducts = [
      {
        id: 11,
        name: 'Brand A One',
        brand: 'Brand A',
        price: 12,
        budgetCategory: '$10-$15',
        productType: 'leave-in',
        bestHairTypes: ['4C'],
        bestPorosity: ['low'],
        bestDensity: ['high'],
        goals: ['moisture'],
        scalpConcerns: ['dryness'],
        ingredients: ['aloe vera'],
        avoidWarnings: [],
        description: 'A1'
      },
      {
        id: 12,
        name: 'Brand A Two',
        brand: 'Brand A',
        price: 12,
        budgetCategory: '$10-$15',
        productType: 'leave-in',
        bestHairTypes: ['4C'],
        bestPorosity: ['low'],
        bestDensity: ['high'],
        goals: ['moisture'],
        scalpConcerns: ['dryness'],
        ingredients: ['aloe vera'],
        avoidWarnings: [],
        description: 'A2'
      },
      {
        id: 13,
        name: 'Brand A Three',
        brand: 'Brand A',
        price: 12,
        budgetCategory: '$10-$15',
        productType: 'leave-in',
        bestHairTypes: ['4C'],
        bestPorosity: ['low'],
        bestDensity: ['high'],
        goals: ['moisture'],
        scalpConcerns: ['dryness'],
        ingredients: ['aloe vera'],
        avoidWarnings: [],
        description: 'A3'
      },
      {
        id: 14,
        name: 'Brand B One',
        brand: 'Brand B',
        price: 12,
        budgetCategory: '$10-$15',
        productType: 'leave-in',
        bestHairTypes: ['4C'],
        bestPorosity: ['low'],
        bestDensity: ['high'],
        goals: ['moisture'],
        scalpConcerns: ['dryness'],
        ingredients: ['aloe vera'],
        avoidWarnings: [],
        description: 'B1'
      }
    ];

    const recommendations = selectRecommendations(crowdedProducts, profile);
    expect(recommendations.slice(0, 3).map((item) => item.brand)).toContain('Brand B');
    expect(recommendations.slice(0, 3).filter((item) => item.brand === 'Brand A')).toHaveLength(2);
  });

  it('maps score bands to badge labels', () => {
    expect(getBadgeLabel(80).label).toBe('Best Match');
    expect(getBadgeLabel(67).label).toBe('Best Match');
    expect(getBadgeLabel(65).label).toBe('Good Match');
    expect(getBadgeLabel(45).label).toBe('Good Match');
    expect(getBadgeLabel(34).label).toBe('Good Match');
    expect(getBadgeLabel(20).label).toBe('Possible Match');
  });

  it('returns no recommendations when the selected product type has no candidates', () => {
    const recommendations = selectRecommendations(products, {
      ...profile,
      productType: 'oil'
    });

    expect(recommendations).toEqual([]);
  });
});
