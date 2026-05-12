const AUTH_USERS_STORAGE_KEY = 'curlcareAuthUsers';
const AUTH_SESSION_STORAGE_KEY = 'curlcareAuthSession';
const AUTH_STATE_EVENT_NAME = 'curlcare:auth-state-change';
const ASSISTANT_UI_STORAGE_KEY = 'curlcareAssistantUi';
const FIREBASE_CONFIG_MODULE_PATHS = [
  './firebase-auth-config.local.js',
  './firebase-auth-config.js'
];

let firebaseAuthClientPromise;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim();
}

export function buildAvatarLabel(user) {
  const source = normalizeName(user?.name) || normalizeEmail(user?.email) || 'U';
  return source.charAt(0).toUpperCase();
}

export function isFirebaseConfigReady(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return requiredKeys.every((key) => {
    const value = String(config[key] || '').trim();
    return value && !value.includes('YOUR_');
  });
}

export function mapFirebaseUser(user) {
  return {
    name: normalizeName(user?.displayName),
    email: normalizeEmail(user?.email),
    provider: 'google',
    source: 'firebase'
  };
}

function normalizeStoredUsers(users) {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      name: normalizeName(entry.name),
      email: normalizeEmail(entry.email),
      password: String(entry.password || ''),
      provider: entry.provider === 'google' ? 'google' : 'email'
    }))
    .filter((entry) => entry.email);
}

function readStoredUsers() {
  try {
    return normalizeStoredUsers(JSON.parse(localStorage.getItem(AUTH_USERS_STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

function writeStoredUsers(users) {
  localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(normalizeStoredUsers(users)));
}

function readSessionUser() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_SESSION_STORAGE_KEY) || 'null');

    if (!parsed) {
      return null;
    }

    return {
      name: normalizeName(parsed.name),
      email: normalizeEmail(parsed.email),
      provider: parsed.provider === 'google' ? 'google' : 'email',
      source: parsed.source === 'firebase' ? 'firebase' : 'local'
    };
  } catch {
    return null;
  }
}

function buildAssistantStateKey(user) {
  const normalizedEmail = normalizeEmail(user?.email);

  if (!normalizedEmail) {
    return `${ASSISTANT_UI_STORAGE_KEY}:guest`;
  }

  return `${ASSISTANT_UI_STORAGE_KEY}:user:${encodeURIComponent(normalizedEmail)}`;
}

function clearAssistantStateForUser(user) {
  if (!user?.email) {
    return;
  }

  localStorage.removeItem(buildAssistantStateKey(user));
}

function writeSessionUser(user) {
  if (!user) {
    clearAssistantStateForUser(readSessionUser());
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    document.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT_NAME, { detail: { user: null } }));
    return;
  }

  const normalizedUser = {
    name: normalizeName(user.name),
    email: normalizeEmail(user.email),
    provider: user.provider === 'google' ? 'google' : 'email',
    source: user.source === 'firebase' ? 'firebase' : 'local'
  };

  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(normalizedUser));
  document.dispatchEvent(new CustomEvent(AUTH_STATE_EVENT_NAME, { detail: { user: normalizedUser } }));
}

export function registerLocalUser(users, payload) {
  const existingUsers = normalizeStoredUsers(users);
  const name = normalizeName(payload?.name);
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '').trim();

  if (!name) {
    throw new Error('Enter your name to create an account.');
  }

  if (!email || !email.includes('@')) {
    throw new Error('Enter a valid email address.');
  }

  if (password.length < 6) {
    throw new Error('Use a password with at least 6 characters.');
  }

  if (existingUsers.some((entry) => entry.email === email)) {
    throw new Error('An account with that email already exists.');
  }

  const user = { name, email, password, provider: 'email' };
  return {
    users: [...existingUsers, user],
    user: { name, email, provider: 'email', source: 'local' }
  };
}

export function loginLocalUser(users, payload) {
  const existingUsers = normalizeStoredUsers(users);
  const email = normalizeEmail(payload?.email);
  const password = String(payload?.password || '').trim();
  const match = existingUsers.find((entry) => entry.email === email && entry.provider === 'email');

  if (!match || match.password !== password) {
    throw new Error('Email or password did not match our records.');
  }

  return {
    name: match.name,
    email: match.email,
    provider: match.provider,
    source: 'local'
  };
}

async function loadFirebaseConfig() {
  for (const modulePath of FIREBASE_CONFIG_MODULE_PATHS) {
    try {
      const module = await import(modulePath);

      if (isFirebaseConfigReady(module.firebaseAuthConfig)) {
        return module.firebaseAuthConfig;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function getFirebaseAuthClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!firebaseAuthClientPromise) {
    firebaseAuthClientPromise = (async () => {
      const config = await loadFirebaseConfig();

      if (!config) {
        return null;
      }

      const [{ initializeApp, getApp, getApps }, authModule] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js')
      ]);
      const app = getApps().length ? getApp() : initializeApp(config);
      const auth = authModule.getAuth(app);
      const provider = new authModule.GoogleAuthProvider();

      provider.setCustomParameters({ prompt: 'select_account' });
      await authModule.setPersistence(auth, authModule.browserLocalPersistence);

      return {
        auth,
        provider,
        onAuthStateChanged: authModule.onAuthStateChanged,
        signInWithPopup: authModule.signInWithPopup,
        signOut: authModule.signOut
      };
    })();
  }

  return firebaseAuthClientPromise;
}

async function signInWithGoogle() {
  const client = await getFirebaseAuthClient();

  if (!client) {
    throw new Error('Google sign-in is not configured yet. Add your Firebase web config to static/js/firebase-auth-config.js or static/js/firebase-auth-config.local.js.');
  }

  const result = await client.signInWithPopup(client.auth, client.provider);
  return mapFirebaseUser(result.user);
}

async function signOutFirebaseSession() {
  const client = await getFirebaseAuthClient();

  if (client) {
    await client.signOut(client.auth);
  }
}

async function attachFirebaseSessionListener(state, render) {
  const client = await getFirebaseAuthClient();

  if (!client) {
    state.googleStatus = 'unavailable';
    render();
    return;
  }

  state.googleStatus = 'ready';
  client.onAuthStateChanged(client.auth, (firebaseUser) => {
    if (firebaseUser?.email) {
      state.user = mapFirebaseUser(firebaseUser);
      writeSessionUser(state.user);
    } else if (state.user?.source === 'firebase') {
      state.user = null;
      writeSessionUser(null);
    }

    render();
  });
}

function getAuthMarkup(state) {
  const avatarLabel = buildAvatarLabel(state.user);
  const avatarText = state.user ? `${state.user.name || state.user.email}` : 'Account';
  const googleCopy = state.googleStatus === 'ready'
    ? state.mode === 'create' ? 'Create account with Google' : 'Continue with Google'
    : 'Set up Firebase for Google sign-in';
  const helperCopy = state.googleStatus === 'ready'
    ? 'Use Google sign-in through Firebase, or keep using a local email account on this device.'
    : 'Google sign-in turns on after you add your Firebase web config. Email accounts still work locally on this device.';
  const authActions = state.user
    ? `
      <div class="auth-dropdown-section">
        <p class="auth-dropdown-label">Signed in as</p>
        <strong class="auth-dropdown-name">${state.user.name || state.user.email}</strong>
        <span class="auth-dropdown-email">${state.user.email}</span>
      </div>
      <button class="auth-dropdown-action" type="button" data-auth-signout>Sign out</button>
    `
    : `
      <button class="auth-dropdown-action" type="button" data-auth-open="login">Log in</button>
      <button class="auth-dropdown-action" type="button" data-auth-open="create">Create account</button>
    `;

  return `
    <div class="auth-shell">
      <button class="auth-avatar-button" type="button" aria-expanded="${String(state.dropdownOpen)}" aria-label="Open account menu" data-auth-avatar>
        <span class="auth-avatar-circle">${avatarLabel}</span>
        <span class="auth-avatar-text">${avatarText}</span>
      </button>
      <div class="auth-dropdown ${state.dropdownOpen ? '' : 'd-none'}" data-auth-dropdown>
        ${authActions}
      </div>
    </div>
    <div class="auth-modal-backdrop ${state.modalOpen ? '' : 'd-none'}" data-auth-backdrop>
      <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Account access">
        <div class="auth-modal-header">
          <div>
            <p class="panel-label mb-2">Account</p>
            <h2 class="auth-modal-title">${state.mode === 'create' ? 'Create your account' : 'Log in to your account'}</h2>
          </div>
          <button class="auth-modal-close" type="button" aria-label="Close account modal" data-auth-close>&times;</button>
        </div>
        <div class="auth-tab-row">
          <button class="auth-tab ${state.mode === 'login' ? 'auth-tab-active' : ''}" type="button" data-auth-mode="login">Log in</button>
          <button class="auth-tab ${state.mode === 'create' ? 'auth-tab-active' : ''}" type="button" data-auth-mode="create">Create account</button>
        </div>
        <p class="auth-helper-copy">${helperCopy}</p>
        ${state.error ? `<div class="auth-feedback auth-feedback-error">${state.error}</div>` : ''}
        ${state.success ? `<div class="auth-feedback auth-feedback-success">${state.success}</div>` : ''}
        <button class="auth-google-button" type="button" data-auth-google>
          <span class="auth-google-mark">G</span>
          <span>${googleCopy}</span>
        </button>
        <div class="auth-divider"><span>or use email</span></div>
        <form class="auth-form" data-auth-form>
          ${state.mode === 'create' ? '<label class="auth-field-label" for="auth-name">Name</label><input id="auth-name" name="name" class="form-control auth-input" type="text" autocomplete="name" />' : ''}
          <label class="auth-field-label" for="auth-email">Email</label>
          <input id="auth-email" name="email" class="form-control auth-input" type="email" autocomplete="email" />
          <label class="auth-field-label" for="auth-password">Password</label>
          <input id="auth-password" name="password" class="form-control auth-input" type="password" autocomplete="current-password" />
          <button class="btn btn-brand auth-submit" type="submit">${state.mode === 'create' ? 'Create account' : 'Log in'}</button>
        </form>
      </div>
    </div>
  `;
}

export function initAuthUi() {
  const mount = document.querySelector('[data-auth-root]');

  if (!mount) {
    return;
  }

  const state = {
    users: readStoredUsers(),
    user: readSessionUser(),
    dropdownOpen: false,
    modalOpen: false,
    mode: 'login',
    googleStatus: 'checking',
    error: '',
    success: ''
  };

  const closeSurfaces = () => {
    state.dropdownOpen = false;
    state.modalOpen = false;
    state.error = '';
    state.success = '';
  };

  const render = () => {
    mount.innerHTML = getAuthMarkup(state);

    const avatarButton = mount.querySelector('[data-auth-avatar]');
    const dropdown = mount.querySelector('[data-auth-dropdown]');
    const backdrop = mount.querySelector('[data-auth-backdrop]');
    const closeButton = mount.querySelector('[data-auth-close]');
    const googleButton = mount.querySelector('[data-auth-google]');
    const authForm = mount.querySelector('[data-auth-form]');

    avatarButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      state.dropdownOpen = !state.dropdownOpen;
      state.modalOpen = false;
      state.error = '';
      state.success = '';
      render();
    });

    dropdown?.querySelectorAll('[data-auth-open]').forEach((button) => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.authOpen;
        state.dropdownOpen = false;
        state.modalOpen = true;
        state.error = '';
        state.success = '';
        render();
      });
    });

    dropdown?.querySelector('[data-auth-signout]')?.addEventListener('click', async () => {
      if (state.user?.source === 'firebase') {
        await signOutFirebaseSession();
      }

      state.user = null;
      state.dropdownOpen = false;
      writeSessionUser(null);
      render();
    });

    mount.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        state.mode = button.dataset.authMode;
        state.error = '';
        state.success = '';
        render();
      });
    });

    closeButton?.addEventListener('click', () => {
      closeSurfaces();
      render();
    });

    backdrop?.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        closeSurfaces();
        render();
      }
    });

    googleButton?.addEventListener('click', async () => {
      try {
        state.user = await signInWithGoogle();
        state.modalOpen = false;
        state.success = 'Signed in with Google.';
        state.error = '';
        writeSessionUser(state.user);
        render();
      } catch (error) {
        state.error = error.message || 'Google sign-in could not be completed.';
        state.success = '';
        render();
      }
    });

    authForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(authForm);

      try {
        if (state.mode === 'create') {
          const result = registerLocalUser(state.users, {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password')
          });

          state.users = result.users;
          state.user = result.user;
          state.success = 'Account created and signed in.';
        } else {
          state.user = loginLocalUser(state.users, {
            email: formData.get('email'),
            password: formData.get('password')
          });
          state.success = 'Logged in successfully.';
        }

        state.error = '';
        state.modalOpen = false;
        writeStoredUsers(state.users);
        writeSessionUser(state.user);
        render();
      } catch (error) {
        state.error = error.message;
        state.success = '';
        render();
      }
    });
  };

  document.addEventListener('click', (event) => {
    if (!mount.contains(event.target)) {
      if (state.dropdownOpen) {
        state.dropdownOpen = false;
        render();
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && (state.dropdownOpen || state.modalOpen)) {
      closeSurfaces();
      render();
    }
  });

  render();
  void attachFirebaseSessionListener(state, render);
}