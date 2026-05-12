const PROFILE_STORAGE_KEY = 'curlcareProfile';
const AUTH_SESSION_STORAGE_KEY = 'curlcareAuthSession';

function readAuthSessionUser() {
  try {
    const stored = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function buildProfileStorageKey(user) {
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return `${PROFILE_STORAGE_KEY}:guest`;
  }

  return `${PROFILE_STORAGE_KEY}:user:${encodeURIComponent(normalizedEmail)}`;
}

function getProfileStorage(user = readAuthSessionUser()) {
  return user?.email ? localStorage : sessionStorage;
}

export function readStoredProfile() {
  try {
    const user = readAuthSessionUser();
    const stored = getProfileStorage(user).getItem(buildProfileStorageKey(user));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function writeStoredProfile(profile) {
  try {
    const user = readAuthSessionUser();
    getProfileStorage(user).setItem(buildProfileStorageKey(user), JSON.stringify(profile));
  } catch {
    // Ignore storage failures and keep the profile builder usable.
  }
}

export function clearStoredProfile() {
  try {
    const user = readAuthSessionUser();
    getProfileStorage(user).removeItem(buildProfileStorageKey(user));
  } catch {
    // Ignore storage failures and keep the profile builder usable.
  }
}