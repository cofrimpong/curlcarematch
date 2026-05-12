import { describe, expect, it } from 'vitest';
import { normalizeProfile, validateProfile } from '../static/js/quiz.js';
import { buildProfileStorageKey } from '../static/js/profile-storage.js';

describe('quiz helpers', () => {
  it('normalizes missing optional fields', () => {
    const profile = normalizeProfile({ hairType: 'unknown', productType: 'leave-in' });
    expect(profile.scalpConcern).toBe('');
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

  it('scopes stored profiles by signed-in user', () => {
    expect(buildProfileStorageKey(null)).toBe('curlcareProfile:guest');
    expect(buildProfileStorageKey({ email: 'Taylor@example.com' })).toBe('curlcareProfile:user:taylor%40example.com');
  });
});
