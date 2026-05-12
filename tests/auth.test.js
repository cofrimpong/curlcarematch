import { describe, expect, it } from 'vitest';
import { buildAvatarLabel, isFirebaseConfigReady, loginLocalUser, mapFirebaseUser, registerLocalUser } from '../static/js/auth.js';

describe('auth helpers', () => {
  it('builds an avatar label from the current user', () => {
    expect(buildAvatarLabel({ name: 'Taylor' })).toBe('T');
    expect(buildAvatarLabel({ email: 'curl@example.com' })).toBe('C');
  });

  it('registers a local email account', () => {
    const result = registerLocalUser([], {
      name: 'Taylor Curl',
      email: 'taylor@example.com',
      password: 'secret12'
    });

    expect(result.users).toHaveLength(1);
    expect(result.user).toEqual({
      name: 'Taylor Curl',
      email: 'taylor@example.com',
      provider: 'email',
      source: 'local'
    });
  });

  it('prevents duplicate email registration', () => {
    expect(() => registerLocalUser([
      { name: 'Taylor Curl', email: 'taylor@example.com', password: 'secret12', provider: 'email' }
    ], {
      name: 'Taylor Again',
      email: 'taylor@example.com',
      password: 'secret12'
    })).toThrow('An account with that email already exists.');
  });

  it('logs in a registered email account', () => {
    const user = loginLocalUser([
      { name: 'Taylor Curl', email: 'taylor@example.com', password: 'secret12', provider: 'email' }
    ], {
      email: 'taylor@example.com',
      password: 'secret12'
    });

    expect(user).toEqual({
      name: 'Taylor Curl',
      email: 'taylor@example.com',
      provider: 'email',
      source: 'local'
    });
  });

  it('validates a Firebase web config before enabling Google auth', () => {
    expect(isFirebaseConfigReady({
      apiKey: 'abc123',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo-project',
      appId: '1:123:web:abc'
    })).toBe(true);

    expect(isFirebaseConfigReady({
      apiKey: 'YOUR_API_KEY',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo-project',
      appId: '1:123:web:abc'
    })).toBe(false);
  });

  it('maps a Firebase user into the site session shape', () => {
    expect(mapFirebaseUser({
      displayName: 'Google User',
      email: 'google.user@example.com'
    })).toEqual({
      name: 'Google User',
      email: 'google.user@example.com',
      provider: 'google',
      source: 'firebase'
    });
  });
});