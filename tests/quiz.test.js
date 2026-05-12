import { describe, expect, it } from 'vitest';
import { normalizeProfile, validateProfile } from '../static/js/quiz.js';

describe('quiz helpers', () => {
  it('normalizes missing optional fields', () => {
    const profile = normalizeProfile({ hairType: 'unknown', productType: 'leave-in' });
    expect(profile.scalpConcern).toBe('none');
    expect(profile.avoidIngredients).toEqual([]);
    expect(profile).not.toHaveProperty('productType');
  });

  it('flags missing required fields', () => {
    const validation = validateProfile({
      hairType: '4C',
      porosity: '',
      density: 'high',
      goal: 'moisture',
      scalpConcern: 'dryness',
      budget: 'up to $15'
    });

    expect(validation.isValid).toBe(false);
    expect(validation.missingFields).toContain('porosity');
  });
});
