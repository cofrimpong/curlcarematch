import { clearStoredProfile, readStoredProfile, writeStoredProfile } from './profile-storage.js';

const AUTH_STATE_EVENT_NAME = 'curlcare:auth-state-change';
const REQUIRED_FIELDS = ['hairType', 'porosity', 'density', 'goal', 'scalpConcern', 'budget'];

export function normalizeProfile(rawProfile) {
  return {
    hairType: rawProfile.hairType || '',
    porosity: rawProfile.porosity || '',
    density: rawProfile.density || '',
    goal: rawProfile.goal || '',
    scalpConcern: rawProfile.scalpConcern || '',
    budget: rawProfile.budget || '',
    avoidIngredients: Array.isArray(rawProfile.avoidIngredients) ? rawProfile.avoidIngredients : []
  };
}

export function validateProfile(profile) {
  const missingFields = REQUIRED_FIELDS.filter((field) => !profile[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

function collectFormData(form) {
  const formData = new FormData(form);
  const profile = normalizeProfile({
    hairType: formData.get('hairType'),
    porosity: formData.get('porosity'),
    density: formData.get('density'),
    goal: formData.get('goal'),
    scalpConcern: formData.get('scalpConcern'),
    budget: formData.get('budget'),
    avoidIngredients: formData.getAll('avoidIngredients')
  });

  return profile;
}

function updateProgress(form) {
  const completed = REQUIRED_FIELDS.filter((field) => {
    const input = form.elements.namedItem(field);
    return input && input.value;
  }).length;
  const progressText = document.getElementById('quiz-progress-text');
  const progressBar = document.getElementById('quiz-progress-bar');
  const percentage = Math.round((completed / REQUIRED_FIELDS.length) * 100);

  progressText.textContent = `${completed} of ${REQUIRED_FIELDS.length} completed`;
  progressBar.style.width = `${percentage}%`;
}

function fillFormFromStorage(form) {
  const profile = readStoredProfile();

  form.reset();

  if (!profile) {
    updateProgress(form);
    return;
  }

  const normalizedProfile = normalizeProfile(profile);
  REQUIRED_FIELDS.forEach((field) => {
    const input = form.elements.namedItem(field);

    if (input) {
      input.value = normalizedProfile[field];
    }
  });

  normalizedProfile.avoidIngredients.forEach((value) => {
    const checkbox = form.querySelector(`input[name="avoidIngredients"][value="${value}"]`);

    if (checkbox) {
      checkbox.checked = true;
    }
  });

  updateProgress(form);
}

function showFeedback(message) {
  const feedback = document.getElementById('quiz-feedback');
  feedback.textContent = message;
  feedback.classList.remove('d-none');
}

function clearFeedback() {
  const feedback = document.getElementById('quiz-feedback');
  feedback.textContent = '';
  feedback.classList.add('d-none');
}

function initQuizPage() {
  const form = document.getElementById('quiz-form');
  const resetButton = document.getElementById('quiz-reset');

  if (!form || !resetButton) {
    return;
  }

  fillFormFromStorage(form);

  form.addEventListener('change', () => updateProgress(form));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFeedback();

    const profile = collectFormData(form);
    const validation = validateProfile(profile);

    if (!validation.isValid) {
      showFeedback(`Please complete: ${validation.missingFields.join(', ')}`);
      return;
    }

    writeStoredProfile(profile);
    window.location.href = 'results.html';
  });

  resetButton.addEventListener('click', () => {
    clearStoredProfile();
    form.reset();
    clearFeedback();
    updateProgress(form);
  });

  document.addEventListener(AUTH_STATE_EVENT_NAME, () => {
    clearFeedback();
    fillFormFromStorage(form);
  });
}

if (typeof document !== 'undefined') {
  initQuizPage();
}
