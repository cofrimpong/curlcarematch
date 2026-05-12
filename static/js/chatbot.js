const STORAGE_KEY = 'curlcareProfile';
const ASSISTANT_UI_STORAGE_KEY = 'curlcareAssistantUi';
const AUTH_SESSION_STORAGE_KEY = 'curlcareAuthSession';
const AUTH_STATE_EVENT_NAME = 'curlcare:auth-state-change';
const MAX_ASSISTANT_HISTORY = 24;
const ASSISTANT_TYPING_DELAY_MS = {
  manualMin: 260,
  manualMax: 520,
  quickActionMin: 420,
  quickActionMax: 760
};
const REQUIRED_PROFILE_FIELDS = ['hairType', 'porosity', 'density', 'goal', 'scalpConcern', 'budget'];

const PROFILE_FIELD_LABELS = {
  hairType: 'Hair type',
  porosity: 'Porosity',
  density: 'Density',
  goal: 'Main goal',
  scalpConcern: 'Scalp concern',
  budget: 'Budget'
};

const PROFILE_GOAL_OPTIONS = {
  moisture: 'moisture',
  'curl definition': 'curl definition',
  curls: 'curl definition',
  definition: 'curl definition',
  'frizz control': 'frizz control',
  frizz: 'frizz control',
  'growth support': 'growth support',
  growth: 'growth support',
  'thickness/volume': 'thickness/volume',
  thickness: 'thickness/volume',
  volume: 'thickness/volume',
  'scalp hydration': 'scalp hydration',
  scalp: 'scalp hydration',
  'protective styling': 'protective styling',
  protective: 'protective styling',
  'damage repair': 'damage repair',
  repair: 'damage repair'
};

const PRODUCT_TYPE_OPTIONS = {
  shampoo: 'shampoo',
  conditioner: 'conditioner',
  'leave in': 'leave-in',
  'leave-in': 'leave-in',
  'deep conditioner': 'deep conditioner',
  oil: 'oil',
  gel: 'gel/mousse',
  mousse: 'gel/mousse',
  'gel mousse': 'gel/mousse',
  'gel/mousse': 'gel/mousse',
  scalp: 'scalp treatment',
  'scalp treatment': 'scalp treatment'
};

const PRODUCT_GOAL_OPTIONS = {
  moisture: 'moisture',
  'curl definition': 'curl definition',
  definition: 'curl definition',
  'frizz control': 'frizz control',
  frizz: 'frizz control',
  'growth support': 'growth support',
  growth: 'growth support',
  'thickness/volume': 'thickness/volume',
  thickness: 'thickness/volume',
  volume: 'thickness/volume',
  'scalp hydration': 'scalp hydration',
  'protective styling': 'protective styling',
  protective: 'protective styling',
  'damage repair': 'damage repair',
  repair: 'damage repair'
};

const HAIR_TYPE_GROUPS = {
  '1A-1C': ['1a', '1b', '1c', 'type 1', 'straight'],
  '2A-2C': ['2a', '2b', '2c', 'type 2', 'wavy'],
  '3A-3C': ['3a', '3b', '3c', 'type 3', 'curly'],
  '4A-4C': ['4a', '4b', '4c', 'type 4', 'coily', 'coily hair']
};

const GREETING_PATTERN = /^(hi|hello|hey|heya|hiya|good morning|good afternoon|good evening)( there| curlcare| assistant)?[!.?\s]*$/i;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9$/\-\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fetchJson(path) {
  return fetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load ${path}`);
    }

    return response.json();
  });
}

function fetchText(path) {
  return fetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load ${path}`);
    }

    return response.text();
  });
}

function toTitleCase(value) {
  return String(value || '')
    .split(' ')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function getAssistantPageLabel(page) {
  if (page === 'quiz') {
    return 'Profile builder';
  }

  if (page === 'hair-guide') {
    return 'Hair type guide';
  }

  if (page === 'products') {
    return 'Product library';
  }

  if (page === 'results') {
    return 'Results';
  }

  if (page === 'home') {
    return 'Home';
  }

  if (page === 'about') {
    return 'About';
  }

  if (page === 'chat') {
    return 'Full chat';
  }

  return toTitleCase(page || 'site');
}

function getAssistantContextPage(page) {
  if (page !== 'chat') {
    return page;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('context') || 'site';
}

function joinReplyParts(parts) {
  return parts.filter(Boolean).join('\n\n');
}

export function isGreetingMessage(message) {
  return GREETING_PATTERN.test(String(message || '').trim());
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getAssistantTypingDelay(inputMode, message) {
  const textLength = String(message || '').trim().length;
  const isQuickAction = inputMode === 'quick-action';
  const minDelay = isQuickAction ? ASSISTANT_TYPING_DELAY_MS.quickActionMin : ASSISTANT_TYPING_DELAY_MS.manualMin;
  const maxDelay = isQuickAction ? ASSISTANT_TYPING_DELAY_MS.quickActionMax : ASSISTANT_TYPING_DELAY_MS.manualMax;
  const scaledDelay = minDelay + Math.min(textLength * 8, maxDelay - minDelay);

  return Math.max(minDelay, Math.min(maxDelay, scaledDelay));
}

export function normalizeAssistantContext(context) {
  const value = context && typeof context === 'object' ? context : {};

  return {
    lastIntent: typeof value.lastIntent === 'string' ? value.lastIntent : '',
    lastTopic: typeof value.lastTopic === 'string' ? value.lastTopic : '',
    lastProfileField: typeof value.lastProfileField === 'string' ? value.lastProfileField : '',
    lastGuideTarget: typeof value.lastGuideTarget === 'string' ? value.lastGuideTarget : '',
    lastNavigationLabel: typeof value.lastNavigationLabel === 'string' ? value.lastNavigationLabel : '',
    lastProductTypes: Array.isArray(value.lastProductTypes) ? value.lastProductTypes.filter(Boolean) : [],
    lastGoals: Array.isArray(value.lastGoals) ? value.lastGoals.filter(Boolean) : [],
    lastBudget: typeof value.lastBudget === 'string' ? value.lastBudget : ''
  };
}

export function normalizeConversationHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((entry) => entry && (entry.role === 'assistant' || entry.role === 'user') && typeof entry.text === 'string' && entry.text.trim())
    .slice(-MAX_ASSISTANT_HISTORY)
    .map((entry) => ({
      role: entry.role,
      text: entry.text.trim()
    }));
}

function pushConversationEntry(history, role, text) {
  return normalizeConversationHistory([...history, { role, text }]);
}

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

export function buildAssistantStateKey(user) {
  const normalizedEmail = String(user?.email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return `${ASSISTANT_UI_STORAGE_KEY}:guest`;
  }

  return `${ASSISTANT_UI_STORAGE_KEY}:user:${encodeURIComponent(normalizedEmail)}`;
}

function getAssistantStateStorage() {
  return readAuthSessionUser()?.email ? localStorage : sessionStorage;
}

function createDefaultAssistantUiState() {
  return { open: false, expanded: false, history: [], context: normalizeAssistantContext(), pendingPrompt: '' };
}

function readAssistantUiState() {
  try {
    const stored = getAssistantStateStorage().getItem(buildAssistantStateKey(readAuthSessionUser()));

    if (!stored) {
      return createDefaultAssistantUiState();
    }

    const parsed = JSON.parse(stored);

    return {
      open: Boolean(parsed.open),
      expanded: Boolean(parsed.expanded),
      history: normalizeConversationHistory(parsed.history),
      context: normalizeAssistantContext(parsed.context),
      pendingPrompt: typeof parsed.pendingPrompt === 'string' ? parsed.pendingPrompt : ''
    };
  } catch {
    return createDefaultAssistantUiState();
  }
}

function writeAssistantUiState(state) {
  try {
    getAssistantStateStorage().setItem(buildAssistantStateKey(readAuthSessionUser()), JSON.stringify(state));
  } catch {
    // Ignore storage failures and keep the assistant usable.
  }
}

function readProfileFromStorage() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function readProfileFromForm(form) {
  if (!form) {
    return readProfileFromStorage() || {};
  }

  return {
    hairType: form.elements.namedItem('hairType')?.value || '',
    porosity: form.elements.namedItem('porosity')?.value || '',
    density: form.elements.namedItem('density')?.value || '',
    goal: form.elements.namedItem('goal')?.value || '',
    scalpConcern: form.elements.namedItem('scalpConcern')?.value || '',
    budget: form.elements.namedItem('budget')?.value || '',
    avoidIngredients: Array.from(form.querySelectorAll('input[name="avoidIngredients"]:checked'), (input) => input.value)
  };
}

export function getMissingProfileFields(profile) {
  return REQUIRED_PROFILE_FIELDS.filter((field) => !profile[field]).map((field) => PROFILE_FIELD_LABELS[field]);
}

function parseBudgetValue(text) {
  const budgetMatch = text.match(/(?:\$|up to\s*\$?|under\s*\$?)(10|15|25|40|60|100)\b/);

  if (!budgetMatch) {
    return null;
  }

  return `up to $${budgetMatch[1]}`;
}

function findOptionValue(text, optionMap) {
  const entries = Object.entries(optionMap).sort((left, right) => right[0].length - left[0].length);
  const match = entries.find(([alias]) => text.includes(alias));
  return match ? match[1] : null;
}

function findOptionValues(text, optionMap) {
  return [...new Set(
    Object.entries(optionMap)
      .filter(([alias]) => text.includes(alias))
      .map(([, value]) => value)
  )];
}

function findHairTypeValue(text) {
  if (text.includes("don't know") || text.includes('dont know') || text.includes('unknown')) {
    return 'unknown';
  }

  const explicit = text.match(/\b([1-4][abc])\b/);
  return explicit ? explicit[1].toUpperCase() : null;
}

function findIngredientValue(text) {
  const aliases = {
    sulfates: 'sulfates',
    sulfate: 'sulfates',
    silicones: 'silicones',
    silicone: 'silicones',
    'drying alcohols': 'drying alcohols',
    'drying alcohol': 'drying alcohols',
    'heavy oils/butters': 'heavy oils/butters',
    'heavy oils': 'heavy oils/butters',
    butters: 'heavy oils/butters',
    fragrance: 'fragrance',
    parfum: 'fragrance',
    parabens: 'parabens',
    paraben: 'parabens'
  };

  return findOptionValue(text, aliases);
}

function shouldRemoveIngredient(text) {
  return /(remove|uncheck|allow|include|put back|keep in)/.test(text);
}

function inferConversationTopic(text) {
  if (text.includes('hair type') || text.includes('curl type')) {
    return 'hair type';
  }

  if (text.includes('porosity')) {
    return 'porosity';
  }

  if (text.includes('density')) {
    return 'density';
  }

  if (text.includes('budget') || text.includes('up to $') || text.includes('under $')) {
    return 'budget';
  }

  if (text.includes('scalp concern') || text.includes('scalp')) {
    return 'scalp concern';
  }

  if (text.includes('goal')) {
    return 'goal';
  }

  return '';
}

function findRecentConversationTopic(history, assistantContext = normalizeAssistantContext()) {
  if (assistantContext.lastTopic) {
    return assistantContext.lastTopic;
  }

  const entries = normalizeConversationHistory(history).slice().reverse();

  for (const entry of entries) {
    const topic = inferConversationTopic(normalizeText(entry.text));

    if (topic) {
      return topic;
    }
  }

  return '';
}

function findRecentProductContext(history, assistantContext = normalizeAssistantContext()) {
  if (assistantContext.lastProductTypes.length || assistantContext.lastGoals.length || assistantContext.lastBudget) {
    return {
      productTypes: assistantContext.lastProductTypes,
      goals: assistantContext.lastGoals,
      budget: assistantContext.lastBudget
    };
  }

  const entries = normalizeConversationHistory(history).slice().reverse();
  const context = {
    productTypes: [],
    goals: [],
    budget: ''
  };

  for (const entry of entries) {
    const text = normalizeText(entry.text);

    if (!context.productTypes.length) {
      context.productTypes = findOptionValues(text, PRODUCT_TYPE_OPTIONS);
    }

    if (!context.goals.length) {
      context.goals = findOptionValues(text, PRODUCT_GOAL_OPTIONS);
    }

    if (!context.budget) {
      context.budget = parseBudgetValue(text) || '';
    }

    if (context.productTypes.length || context.goals.length || context.budget) {
      break;
    }
  }

  return context;
}

function buildProductContextPrompt(context) {
  const parts = ['show'];

  if (context.productTypes.length) {
    parts.push(context.productTypes.join(' and '));
  }

  if (context.goals.length) {
    parts.push(`for ${context.goals.join(' and ')}`);
  }

  if (context.budget) {
    parts.push(context.budget);
  }

  return parts.join(' ').trim();
}

export function resolveContextualMessage(message, history, assistantContext = normalizeAssistantContext()) {
  const original = String(message || '').trim();
  const text = normalizeText(original);

  if (!text) {
    return original;
  }

  const recentTopic = findRecentConversationTopic(history, assistantContext);
  const recentProductContext = findRecentProductContext(history, assistantContext);
  const lastAssistant = normalizeConversationHistory(history).slice().reverse().find((entry) => entry.role === 'assistant')?.text || '';
  const normalizedAssistant = normalizeText(lastAssistant);

  if (/^(yes\s+)?(do that|do it|that|those|it)\??$/.test(text)) {
    if (assistantContext.lastIntent === 'submit-profile') {
      return 'show my matches';
    }

    if (assistantContext.lastIntent === 'product-filters' && (recentProductContext.productTypes.length || recentProductContext.goals.length || recentProductContext.budget)) {
      return buildProductContextPrompt(recentProductContext);
    }

    if (assistantContext.lastIntent === 'explain-topic' && recentTopic) {
      return `explain ${recentTopic}`;
    }

    if (normalizedAssistant.includes('submit now') || normalizedAssistant.includes('see your matches')) {
      return 'show my matches';
    }

    if (recentProductContext.productTypes.length || recentProductContext.goals.length || recentProductContext.budget) {
      return buildProductContextPrompt(recentProductContext);
    }

    if (recentTopic) {
      return `explain ${recentTopic}`;
    }
  }

  if (recentTopic && /(set|change|make)\s+(it|that)\s+to\b/.test(text)) {
    return original.replace(/\b(it|that)\b/i, assistantContext.lastProfileField || recentTopic);
  }

  if (recentTopic && /(explain|describe|tell me about|what about)\s+(it|that|those)\b/.test(text)) {
    return original.replace(/\b(it|that|those)\b/i, recentTopic);
  }

  if (recentTopic && /^(it|that|those)\??$/.test(text)) {
    return `explain ${recentTopic}`;
  }

  if ((recentProductContext.productTypes.length || recentProductContext.goals.length || recentProductContext.budget)
    && /(those|them)\b/.test(text)) {
    let resolved = original;

    if (recentProductContext.productTypes.length) {
      resolved = resolved.replace(/\b(those|them)\b/i, recentProductContext.productTypes.join(' and '));
    }

    if (!parseBudgetValue(text) && recentProductContext.budget && /(show|filter|find|browse)/.test(text)) {
      resolved = `${resolved} ${recentProductContext.budget}`.trim();
    }

    return resolved;
  }

  return original;
}

function buildContextResolutionNote(originalMessage, resolvedMessage) {
  if (normalizeText(originalMessage) === normalizeText(resolvedMessage)) {
    return '';
  }

  return `I took "${originalMessage.trim()}" to mean "${resolvedMessage}" based on the recent chat.`;
}

function buildAssistantContextUpdate(command, page, resolvedMessage) {
  const normalized = normalizeText(resolvedMessage);

  if (command?.type === 'explain-topic') {
    return { lastIntent: 'explain-topic', lastTopic: command.topic };
  }

  if (command?.type === 'set-field') {
    return {
      lastIntent: 'set-field',
      lastProfileField: command.field,
      lastTopic: command.field === 'scalpConcern' ? 'scalp concern' : command.field === 'hairType' ? 'hair type' : command.field
    };
  }

  if (command?.type === 'toggle-ingredient') {
    return { lastIntent: 'toggle-ingredient', lastTopic: command.value };
  }

  if (command?.type === 'submit-profile' || normalized.includes('show my matches')) {
    return { lastIntent: 'submit-profile' };
  }

  if (command?.type === 'product-filters') {
    return {
      lastIntent: 'product-filters',
      lastProductTypes: command.productTypes || [],
      lastGoals: command.goals || [],
      lastBudget: command.budget || ''
    };
  }

  if (command?.type === 'guide-scroll') {
    return {
      lastIntent: 'guide-scroll',
      lastGuideTarget: command.target,
      lastTopic: command.target === 'porosity' || command.target === 'density' ? command.target : 'hair type'
    };
  }

  if (page === 'products') {
    const productTypes = findOptionValues(normalized, PRODUCT_TYPE_OPTIONS);
    const goals = findOptionValues(normalized, PRODUCT_GOAL_OPTIONS);
    const budget = parseBudgetValue(normalized) || '';

    if (productTypes.length || goals.length || budget) {
      return {
        lastIntent: 'product-filters',
        lastProductTypes: productTypes,
        lastGoals: goals,
        lastBudget: budget
      };
    }
  }

  const inferredTopic = inferConversationTopic(normalized);

  if (inferredTopic) {
    return { lastIntent: 'generic-topic', lastTopic: inferredTopic };
  }

  return {};
}

export function parseProfileCommand(message) {
  const text = normalizeText(message);

  if (!text) {
    return null;
  }

  if (/(what('?s| is) left|missing|progress|what do i still need)/.test(text)) {
    return { type: 'profile-status' };
  }

  if (/(show|see|finish|submit).*(matches|profile)|show my matches/.test(text)) {
    return { type: 'submit-profile' };
  }

  if (/(explain|help|what is|what's|difference|mean)/.test(text)) {
    if (text.includes('porosity')) {
      return { type: 'explain-topic', topic: 'porosity' };
    }

    if (text.includes('density')) {
      return { type: 'explain-topic', topic: 'density' };
    }

    if (text.includes('hair type') || text.includes('curl type')) {
      return { type: 'explain-topic', topic: 'hair type' };
    }

    if (text.includes('budget')) {
      return { type: 'explain-topic', topic: 'budget' };
    }

    if (text.includes('goal')) {
      return { type: 'explain-topic', topic: 'goal' };
    }
  }

  const ingredient = findIngredientValue(text);

  if (ingredient && /(avoid|remove|add|use|include|uncheck|check|without|skip|paraben|sulfate|silicone|fragrance|alcohol|butter)/.test(text)) {
    return {
      type: 'toggle-ingredient',
      value: ingredient,
      checked: !shouldRemoveIngredient(text)
    };
  }

  const budget = parseBudgetValue(text);

  if (budget && (text.includes('budget') || text.includes('$') || text.includes('under') || text.includes('up to'))) {
    return { type: 'set-field', field: 'budget', value: budget };
  }

  const hairType = findHairTypeValue(text);

  if (hairType && (text.includes('hair type') || text.includes('type ') || text === normalizeText(hairType))) {
    return { type: 'set-field', field: 'hairType', value: hairType };
  }

  const porosity = findOptionValue(text, { low: 'low', medium: 'medium', high: 'high', unsure: 'unsure' });
  if (porosity && text.includes('porosity')) {
    return { type: 'set-field', field: 'porosity', value: porosity };
  }

  const density = findOptionValue(text, { low: 'low', medium: 'medium', high: 'high', unsure: 'unsure' });
  if (density && text.includes('density')) {
    return { type: 'set-field', field: 'density', value: density };
  }

  const goal = findOptionValue(text, PROFILE_GOAL_OPTIONS);
  if (goal && (text.includes('goal') || text.includes('want') || text.includes('need'))) {
    return { type: 'set-field', field: 'goal', value: goal };
  }

  const scalpConcern = findOptionValue(text, {
    none: 'none',
    dryness: 'dryness',
    dry: 'dryness',
    itchiness: 'itchiness',
    itchy: 'itchiness',
    flakes: 'flakes',
    flaking: 'flakes',
    psoriasis: 'psoriasis-prone scalp',
    sensitivity: 'sensitivity',
    sensitive: 'sensitivity'
  });

  if (scalpConcern && (text.includes('scalp') || text.includes('concern'))) {
    return { type: 'set-field', field: 'scalpConcern', value: scalpConcern };
  }

  return null;
}

export function parseProductFilterCommand(message) {
  const text = normalizeText(message);

  if (!text) {
    return null;
  }

  if (/(clear|reset).*(filter|filters)/.test(text) || text === 'clear filters') {
    return { type: 'product-filters', clear: true, productTypes: [], goals: [], budget: null };
  }

  const productTypes = findOptionValues(text, PRODUCT_TYPE_OPTIONS);
  const goals = findOptionValues(text, PRODUCT_GOAL_OPTIONS);
  const budget = parseBudgetValue(text);

  if (!productTypes.length && !goals.length && !budget) {
    return null;
  }

  return { type: 'product-filters', clear: false, productTypes, goals, budget };
}

export function parseGuideCommand(message) {
  const text = normalizeText(message);
  const isExplanationRequest = /(explain|help|understand|what is|what s|tell me about|difference|mean)/.test(text);
  const isNavigationRequest = /(take me to|go to|jump to|scroll to|show(?: me)?|bring me to|send me to|head to|section)/.test(text);

  if (!text) {
    return null;
  }

  if (isExplanationRequest) {
    return null;
  }

  if (text.includes('porosity') && isNavigationRequest) {
    return { type: 'guide-scroll', target: 'porosity' };
  }

  if (text.includes('density') && isNavigationRequest) {
    return { type: 'guide-scroll', target: 'density' };
  }

  const groupEntry = Object.entries(HAIR_TYPE_GROUPS).find(([, aliases]) => aliases.some((alias) => text.includes(alias)));

  if (groupEntry && isNavigationRequest) {
    return { type: 'guide-scroll', target: `type-${groupEntry[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}` };
  }

  return null;
}

export function parseNavigationCommand(message) {
  const text = normalizeText(message);

  if (!text) {
    return null;
  }

  if (/(open|go to|take me to|take me back to|bring me to|send me to|show me|head to|navigate to|build|adjust|want).*(profile|quiz)/.test(text)
    || /^(profile|profile builder|quiz page)$/.test(text)) {
    return { href: 'quiz.html', label: 'profile builder' };
  }

  if (/(browse|open|go to|take me to|bring me to|send me to|show me|head to|navigate to|want).*(product|products|library|shop)/.test(text)
    || /^(products|product page|product library|shop)$/.test(text)) {
    return { href: 'products.html', label: 'product library' };
  }

  if (/(open|go to|take me to|bring me to|send me to|show me|head to|navigate to|see|want).*(results|matches)/.test(text)
    || /^(results|matches|results page)$/.test(text)) {
    return { href: 'results.html', label: 'results page' };
  }

  if (/(open|go to|take me to|bring me to|send me to|show me|head to|navigate to|see|want|help me figure out|figure out|learn).*(guide|hair type|curl type)/.test(text)
    || /^(guide|hair guide|hair type guide)$/.test(text)) {
    return { href: 'hair-type-guide.html', label: 'hair type guide' };
  }

  if (/(open|go to|take me to|take me back to|bring me to|send me to|show me|head to|navigate to|go back to|want).*(about|home|homepage|landing)/.test(text)
    || /^(home|homepage|about|landing page)$/.test(text)) {
    return { href: 'index.html#why-this-exists', label: 'home page' };
  }

  return null;
}

function getQuickPrompts(page) {
  if (page === 'quiz') {
    return ['What profile details am I still missing?', 'Help me understand porosity', 'Set my budget to $40', 'Exclude products with parabens', 'Show my best matches'];
  }

  if (page === 'products') {
    return ['Show me leave-ins worth trying', 'Filter for moisture-focused products', 'Keep the budget under $25', 'Reset the product filters', 'Take me to the profile builder'];
  }

  if (page === 'results') {
    return ['Summarize the profile behind these matches', 'Take me back to adjust my profile', 'Show similar products to compare', 'Explain how the budget affects my results'];
  }

  if (page === 'hair-guide') {
    return ['Take me to the type 4 section', 'Help me understand porosity', 'Explain the difference in density levels', 'Take me to the profile builder'];
  }

  return ['Help me build my hair profile', 'Explain how porosity affects product choice', 'Take me to the product library', 'Show me my saved results'];
}

function getQuickActionCards(page) {
  if (page === 'quiz') {
    return [
      {
        title: 'Check my progress',
        description: 'See which profile slots are still empty.',
        prompt: 'What profile details am I still missing?'
      },
      {
        title: 'Explain porosity',
        description: 'Get a simple explanation before you pick a value.',
        prompt: 'Help me understand porosity'
      },
      {
        title: 'Set my budget',
        description: 'Quick-fill a budget cap in one tap.',
        prompt: 'Set my budget to $40'
      },
      {
        title: 'Show my matches',
        description: 'Submit the finished profile and open results.',
        prompt: 'Show my best matches'
      }
    ];
  }

  if (page === 'products') {
    return [
      {
        title: 'Browse leave-ins',
        description: 'Narrow the library to leave-in products.',
        prompt: 'Show me leave-ins worth trying'
      },
      {
        title: 'Moisture picks',
        description: 'Filter toward moisture-focused products.',
        prompt: 'Filter for moisture-focused products'
      },
      {
        title: 'Budget under $25',
        description: 'Apply a lower price cap to the library.',
        prompt: 'Keep the budget under $25'
      },
      {
        title: 'Go to profile builder',
        description: 'Jump back and update the profile details.',
        prompt: 'Take me to the profile builder'
      }
    ];
  }

  if (page === 'results') {
    return [
      {
        title: 'Summarize my profile',
        description: 'Review the saved details behind these matches.',
        prompt: 'Summarize the profile behind these matches'
      },
      {
        title: 'Adjust profile',
        description: 'Go back and change the saved profile.',
        prompt: 'Take me back to adjust my profile'
      },
      {
        title: 'Compare products',
        description: 'Ask for similar products to review next.',
        prompt: 'Show similar products to compare'
      },
      {
        title: 'Explain budget effect',
        description: 'Understand how the budget shaped the list.',
        prompt: 'Explain how the budget affects my results'
      }
    ];
  }

  if (page === 'hair-guide') {
    return [
      {
        title: 'Go to type 4',
        description: 'Jump to the coily hair section.',
        prompt: 'Take me to the type 4 section'
      },
      {
        title: 'Explain porosity',
        description: 'Get a quick breakdown of what it means.',
        prompt: 'Help me understand porosity'
      },
      {
        title: 'Explain density',
        description: 'See how density changes product feel.',
        prompt: 'Explain the difference in density levels'
      },
      {
        title: 'Open profile builder',
        description: 'Move from the guide into the profile flow.',
        prompt: 'Take me to the profile builder'
      }
    ];
  }

  return [
    {
      title: 'Build my profile',
      description: 'Start filling the main hair details and preferences.',
      prompt: 'Help me build my hair profile'
    },
    {
      title: 'Learn porosity',
      description: 'Get a plain-language explanation first.',
      prompt: 'Explain how porosity affects product choice'
    },
    {
      title: 'Open product library',
      description: 'Browse products and narrow filters.',
      prompt: 'Take me to the product library'
    },
    {
      title: 'View saved results',
      description: 'Jump to the current match results page.',
      prompt: 'Show me my saved results'
    }
  ];
}

function getWelcomeMessage(page) {
  if (page === 'quiz') {
    return 'I can help fill this profile for you. Ask me to set a field, explain a term, or tell you what is still missing.';
  }

  if (page === 'products') {
    return 'I can adjust filters here, explain what the product types mean, or send you back to the profile builder.';
  }

  if (page === 'results') {
    return 'I can summarize the saved profile behind these results, explain profile terms, or send you to adjust the profile.';
  }

  if (page === 'hair-guide') {
    return 'I can jump you to the right curl group, explain porosity or density, and send you to the profile builder when you are ready.';
  }

  return 'I can help you move through the site, explain the hair profile fields, and point you to the right page.';
}

function formatProfileSummary(profile) {
  const lines = [];

  if (profile.hairType) {
    lines.push(`Hair type: ${profile.hairType === 'unknown' ? 'Unknown' : profile.hairType}`);
  }

  if (profile.porosity) {
    lines.push(`Porosity: ${toTitleCase(profile.porosity)}`);
  }

  if (profile.density) {
    lines.push(`Density: ${toTitleCase(profile.density)}`);
  }

  if (profile.goal) {
    lines.push(`Goal: ${toTitleCase(profile.goal)}`);
  }

  if (profile.scalpConcern) {
    lines.push(`Scalp concern: ${toTitleCase(profile.scalpConcern)}`);
  }

  if (profile.budget) {
    lines.push(`Budget: ${toTitleCase(profile.budget)}`);
  }

  if (profile.avoidIngredients?.length) {
    lines.push(`Avoiding: ${profile.avoidIngredients.map((item) => toTitleCase(item)).join(', ')}`);
  }

  return lines.length ? lines.join(' | ') : 'No saved profile details yet.';
}

function extractCorpusNotes(corpusText, keyword) {
  if (!corpusText) {
    return [];
  }

  return corpusText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2))
    .filter((line) => line.toLowerCase().includes(keyword))
    .slice(0, 2);
}

function buildTopicResponse(topic, knowledge) {
  if (topic === 'budget') {
    return joinReplyParts([
      'The profile builder supports budget caps of $10, $15, $25, $40, $60, and $100.',
      'Choose the highest amount you are comfortable spending on one product match, not your whole routine.',
      'On the products page, I can also narrow the library to a budget cap for you.'
    ]);
  }

  if (topic === 'goal') {
    return joinReplyParts([
      'The main goals here are moisture, curl definition, frizz control, growth support, thickness or volume, scalp hydration, protective styling, and damage repair.',
      'Pick the goal that matters most right now, and let the results page bring back different product types that support it.'
    ]);
  }

  if (topic === 'porosity' && knowledge.guides?.porosity) {
    const notes = knowledge.guides.porosity
      .map((entry) => `${entry.level}: ${entry.description}`)
      .join(' ');
    const corpusNotes = extractCorpusNotes(knowledge.corpusText, 'porosity');
    return joinReplyParts([
      notes,
      corpusNotes.join(' '),
      'If you are unsure, choose Unsure for now and keep the rest of the profile moving.'
    ]);
  }

  if (topic === 'density' && knowledge.guides?.density) {
    const notes = knowledge.guides.density
      .map((entry) => `${entry.level}: ${entry.description}`)
      .join(' ');
    const corpusNotes = extractCorpusNotes(knowledge.corpusText, 'density');
    return joinReplyParts([
      notes,
      corpusNotes.join(' '),
      'A quick rule: lower density usually likes lighter formulas, while higher density can often handle richer formulas or stronger hold.'
    ]);
  }

  if (topic === 'hair type' && knowledge.guides?.hairTypes) {
    const notes = knowledge.guides.hairTypes
      .map((entry) => `${entry.title}: ${entry.description}`)
      .join(' ');
    return joinReplyParts([
      notes,
      'If you are unsure, you can leave hair type as unknown and still get recommendations.'
    ]);
  }

  return joinReplyParts([
    'I can explain hair type, porosity, density, budget, and profile goals using the guide and local corpus.',
    'Try asking one of those directly and I will go deeper.'
  ]);
}

function buildProductSuggestionReply(message, knowledge) {
  const text = normalizeText(message);
  const products = knowledge.products || [];

  if (!products.length) {
    return '';
  }

  const matchedProducts = products.filter((product) => {
    const haystack = normalizeText([
      product.name,
      product.brand,
      product.productType,
      ...(product.goals || []),
      ...(product.ingredients || [])
    ].join(' '));

    return text.split(' ').some((token) => token.length > 3 && haystack.includes(token));
  }).slice(0, 3);

  if (!matchedProducts.length) {
    return '';
  }

  return `A few related products from the local dataset: ${matchedProducts.map((product) => `${product.name} by ${product.brand}`).join('; ')}.`;
}

export function buildProductGuidanceReply(message, page, knowledge) {
  const text = normalizeText(message);

  if (!/(product|products|recommend|recommended|suggest|routine|what should i use|what should i buy|show .*products|good products|best products)/.test(text)) {
    return '';
  }

  const productSuggestion = buildProductSuggestionReply(message, knowledge);
  const densityMatch = text.match(/\b(low|medium|high)\s+density\b/);

  if (densityMatch) {
    const densityLevel = densityMatch[1];
    const densityAdvice = {
      low: 'For low-density hair, start with lightweight leave-ins, airy mousse, light gels, and cleansers that rinse clean without leaving a heavy film.',
      medium: 'For medium-density hair, you usually have room to balance lightweight hydration with a bit more cream or hold, depending on your goal.',
      high: 'For high-density hair, richer conditioners, stronger hold stylers, and more layered moisture usually work better than very sheer formulas.'
    };
    const cautionAdvice = {
      low: 'Try not to stack rich butters or heavy oils too early, because they can flatten lower-density hair fast.',
      medium: 'If your hair starts feeling coated, step back to lighter layering and use stronger formulas only where you need them most.',
      high: 'If your hair still feels dry after styling, that usually points to needing more moisture or stronger layering rather than less product.'
    };

    return joinReplyParts([
      densityAdvice[densityLevel],
      cautionAdvice[densityLevel],
      page === 'products'
        ? 'If you want, I can narrow the library toward leave-ins, gels, or lighter moisture picks next.'
        : 'If you want, I can take you to the product library and help narrow toward leave-ins, gels, or lighter moisture picks next.',
      productSuggestion
    ]);
  }

  if (text.includes('density')) {
    return joinReplyParts([
      'Tell me whether you mean low, medium, or high density and I will point you toward the product textures that usually make the most sense.',
      page === 'products'
        ? 'From here I can also narrow the library after that.'
        : 'I can also take you to the product library once we narrow the direction.'
    ]);
  }

  return productSuggestion;
}

function createAssistantMarkup(page, assistantPage) {
  return `
    <div class="assistant-shell" data-chat-assistant>
      <button class="assistant-launcher" type="button" aria-expanded="false" aria-controls="assistant-panel">
        <span class="assistant-launcher-label">CurlCare Helper</span>
      </button>
      <section id="assistant-panel" class="assistant-panel d-none" aria-label="CurlCare chat assistant">
        <div class="assistant-panel-corner-control">
          <button class="assistant-expand" type="button" aria-pressed="false" aria-label="Expand conversation" title="Expand conversation">
            <svg viewBox="0 0 20 20" role="presentation" focusable="false" aria-hidden="true">
              <path d="M7 3H3v4" />
              <path d="M13 3h4v4" />
              <path d="M17 13v4h-4" />
              <path d="M3 13v4h4" />
              <path d="M3 7l5-5" />
              <path d="M17 7l-5-5" />
              <path d="M17 13l-5 5" />
              <path d="M3 13l5 5" />
            </svg>
            <span class="visually-hidden assistant-expand-label">Expand conversation</span>
          </button>
        </div>
        <div class="assistant-panel-header">
          <div class="assistant-panel-title-block">
            <p class="panel-label mb-2">Profile helper</p>
            <h2 class="assistant-title">Ask CurlCare</h2>
            <div class="assistant-context-pill">Current page: ${getAssistantPageLabel(assistantPage)}</div>
          </div>
        </div>
        <div class="assistant-messages-shell">
          <div class="assistant-messages-toolbar">
            <button class="assistant-fullscreen-toggle" type="button" aria-pressed="false" aria-label="Open conversation in fullscreen" title="Open conversation in fullscreen">
              <svg viewBox="0 0 20 20" role="presentation" focusable="false" aria-hidden="true">
                <path d="M7 3H3v4" />
                <path d="M13 3h4v4" />
                <path d="M17 13v4h-4" />
                <path d="M3 13v4h4" />
                <path d="M3 7l5-5" />
                <path d="M17 7l-5-5" />
                <path d="M17 13l-5 5" />
                <path d="M3 13l5 5" />
              </svg>
            </button>
          </div>
          <div class="assistant-messages" aria-live="polite"></div>
        </div>
        <div class="assistant-quick-actions"></div>
        <form class="assistant-form">
          <label class="visually-hidden" for="assistant-input">Message the assistant</label>
          <textarea id="assistant-input" class="assistant-input" rows="2" placeholder="Ask for help, like 'set porosity to high' or 'show leave-ins under $25'."></textarea>
          <div class="assistant-form-actions">
            <button class="btn btn-brand assistant-submit" type="submit">Send</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function appendMessage(container, role, text) {
  const bubble = document.createElement('div');
  bubble.className = `assistant-message assistant-message-${role}`;
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function appendTypingMessage(container) {
  const bubble = document.createElement('div');
  bubble.className = 'assistant-message assistant-message-assistant assistant-message-pending';
  bubble.setAttribute('aria-label', 'Assistant is thinking');
  bubble.innerHTML = '<span class="assistant-typing-dot"></span><span class="assistant-typing-dot"></span><span class="assistant-typing-dot"></span>';
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function renderQuickActions(container, prompts, onPick) {
  container.innerHTML = prompts
    .map((prompt) => {
      if (typeof prompt === 'string') {
        return `<button class="assistant-chip" type="button" data-assistant-prompt="${prompt}">${prompt}</button>`;
      }

      return `
        <button class="assistant-action-card" type="button" data-assistant-prompt="${prompt.prompt}">
          <span class="assistant-action-card-title">${prompt.title}</span>
          <span class="assistant-action-card-description">${prompt.description}</span>
        </button>
      `;
    })
    .join('');

  container.querySelectorAll('[data-assistant-prompt]').forEach((button) => {
    button.addEventListener('click', () => onPick(button.dataset.assistantPrompt));
  });
}

function triggerFormEvents(element) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

export function handleProfileAction(command, elements) {
  if (command.type === 'explain-topic') {
    return buildTopicResponse(command.topic, elements.knowledge);
  }

  const form = document.getElementById('quiz-form');

  if (!form) {
    return 'The profile builder is not active on this page.';
  }

  if (command.type === 'profile-status') {
    const profile = readProfileFromForm(form);
    const missing = getMissingProfileFields(profile);
    return missing.length
      ? joinReplyParts([
        `You still have ${missing.length} slot${missing.length === 1 ? '' : 's'} left: ${missing.join(', ')}.`,
        'You can ask me to fill one directly, like “set porosity to high” or “set budget to $40”.'
      ])
      : joinReplyParts([
        'Everything is filled in.',
        'You can submit now to see your matches.'
      ]);
  }

  if (command.type === 'submit-profile') {
    const profile = readProfileFromForm(form);
    const missing = getMissingProfileFields(profile);

    if (missing.length) {
      return joinReplyParts([
        `I cannot submit yet. You still need: ${missing.join(', ')}.`,
        'Ask me to set one of those fields, or fill them manually in the form.'
      ]);
    }

    form.requestSubmit();
    return 'Submitting your profile now.';
  }

  if (command.type === 'set-field') {
    const input = form.elements.namedItem(command.field);

    if (!input) {
      return `I could not find the ${PROFILE_FIELD_LABELS[command.field] || command.field} field on this page.`;
    }

    input.value = command.value;
    triggerFormEvents(input);
    return joinReplyParts([
      `${PROFILE_FIELD_LABELS[command.field] || command.field} set to ${toTitleCase(command.value)}.`,
      `You can ask “what's left?” any time and I will check the remaining slots.`
    ]);
  }

  if (command.type === 'toggle-ingredient') {
    const checkbox = form.querySelector(`input[name="avoidIngredients"][value="${command.value}"]`);

    if (!checkbox) {
      return `I could not find ${command.value} in the ingredient list.`;
    }

    checkbox.checked = command.checked;
    triggerFormEvents(checkbox);
    return command.checked
      ? joinReplyParts([
        `Added ${toTitleCase(command.value)} to your avoid list.`,
        'That preference will be saved with the rest of your profile.'
      ])
      : joinReplyParts([
        `Removed ${toTitleCase(command.value)} from your avoid list.`,
        'That ingredient will no longer be treated as a profile restriction.'
      ]);
  }

  return 'I can help fill profile fields, explain terms, and tell you what is missing.';
}

function applyProductsAction(command) {
  if (command.clear) {
    document.querySelectorAll('input[name="productType"], input[name="goal"]').forEach((input) => {
      input.checked = false;
      triggerFormEvents(input);
    });
    const slider = document.getElementById('filterBudget');
    slider.value = '100';
    triggerFormEvents(slider);
    return 'Cleared all product filters.';
  }

  if (command.productTypes.length) {
    document.querySelectorAll('input[name="productType"]').forEach((input) => {
      input.checked = command.productTypes.includes(input.value);
      triggerFormEvents(input);
    });
  }

  if (command.goals.length) {
    document.querySelectorAll('input[name="goal"]').forEach((input) => {
      input.checked = command.goals.includes(input.value);
      triggerFormEvents(input);
    });
  }

  if (command.budget) {
    const slider = document.getElementById('filterBudget');
    slider.value = command.budget.match(/\d+/)[0];
    triggerFormEvents(slider);
  }

  const parts = [];
  if (command.productTypes.length) {
    parts.push(`product type ${command.productTypes.join(', ')}`);
  }
  if (command.goals.length) {
    parts.push(`goal ${command.goals.join(', ')}`);
  }
  if (command.budget) {
    parts.push(`budget ${command.budget}`);
  }

  return `Updated the product library for ${parts.join(' and ')}.`;
}

function applyGuideAction(command) {
  if (command.target === 'porosity') {
    document.querySelector('[data-porosity-guide-grid]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return 'Jumped to the porosity section.';
  }

  if (command.target === 'density') {
    document.querySelector('[data-density-guide-grid]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return 'Jumped to the density section.';
  }

  const target = document.getElementById(command.target);

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return 'Jumped to that hair type group.';
  }

  return 'I could not find that guide section yet.';
}

export function handleGenericRequest(message, page, knowledge) {
  const text = normalizeText(message);
  const productSuggestion = buildProductSuggestionReply(message, knowledge);
  const productGuidance = buildProductGuidanceReply(message, page, knowledge);

  if (isGreetingMessage(message)) {
    return joinReplyParts([
      'Hi. What can I help you with today?',
      'Pick one of the cards below, or type what you want me to do.'
    ]);
  }

  if (text.includes('summarize my profile') || text.includes('my profile')) {
    return joinReplyParts([
      formatProfileSummary(readProfileFromStorage() || {}),
      'If you want, I can also help adjust one of those fields.'
    ]);
  }

  if (productGuidance) {
    return productGuidance;
  }

  if (text.includes('porosity')) {
    return buildTopicResponse('porosity', knowledge);
  }

  if (text.includes('density')) {
    return buildTopicResponse('density', knowledge);
  }

  if (text.includes('budget')) {
    return buildTopicResponse('budget', knowledge);
  }

  if (page === 'quiz') {
    return joinReplyParts([
      'I can fill fields for you here and explain what each one means.',
      'Try “set hair type to 4C”, “set budget to $40”, “add parabens”, or “what\'s left?”.',
      productSuggestion
    ]);
  }

  if (page === 'products') {
    return joinReplyParts([
      'I can adjust the product library filters here.',
      'Try “show leave-ins under $25”, “show moisture products”, or “clear filters”.',
      productSuggestion
    ]);
  }

  if (page === 'results') {
    return joinReplyParts([
      'I can summarize your saved profile, explain profile terms, or send you back to adjust your profile.',
      productSuggestion
    ]);
  }

  if (page === 'hair-guide') {
    return joinReplyParts([
      'I can jump you to a curl group or explain porosity and density.',
      'Try “take me to type 4” or “explain porosity”.'
    ]);
  }

  return joinReplyParts([
    'I can help with the profile builder, product library filters, guide navigation, and page-to-page navigation.',
    productSuggestion
  ]);
}

async function loadKnowledge() {
  const [guides, products, corpusText] = await Promise.all([
    fetchJson('data/hair_guides.json').catch(() => null),
    fetchJson('data/products.json').catch(() => null),
    fetchText('_corpus/haircare-knowledge.md').catch(() => '')
  ]);

  return { guides, products, corpusText };
}

export function initChatAssistant() {
  const existing = document.querySelector('[data-chat-assistant]');

  if (existing) {
    return;
  }

  const page = document.body.dataset.page || 'site';
  const assistantPage = getAssistantContextPage(page);
  const wrapper = document.createElement('div');
  wrapper.innerHTML = createAssistantMarkup(page, assistantPage);
  const mount = document.querySelector('[data-chat-page-mount]') || document.body;
  mount.appendChild(wrapper.firstElementChild);

  const shell = document.querySelector('[data-chat-assistant]');
  const launcher = shell.querySelector('.assistant-launcher');
  const panel = shell.querySelector('.assistant-panel');
  const expandButton = shell.querySelector('.assistant-expand');
  const fullscreenToggle = shell.querySelector('.assistant-fullscreen-toggle');
  const messages = shell.querySelector('.assistant-messages');
  const quickActions = shell.querySelector('.assistant-quick-actions');
  const form = shell.querySelector('.assistant-form');
  const input = shell.querySelector('.assistant-input');
  const submitButton = shell.querySelector('.assistant-submit');
  const knowledgePromise = loadKnowledge();
  let uiState = readAssistantUiState();
  let activeAssistantStateKey = buildAssistantStateKey(readAuthSessionUser());
  let conversationHistory = uiState.history || [];
  let assistantContext = normalizeAssistantContext(uiState.context);
  let pendingInputMode = 'manual';
  const initialPendingPrompt = page === 'chat' ? uiState.pendingPrompt : '';

  const syncConversationHistory = () => {
    uiState = { ...uiState, history: conversationHistory, context: assistantContext };
    writeAssistantUiState(uiState);
  };

  const updateAssistantContext = (partialContext) => {
    assistantContext = {
      ...assistantContext,
      ...normalizeAssistantContext(partialContext)
    };
    syncConversationHistory();
  };

  const appendConversationMessage = (role, text) => {
    appendMessage(messages, role, text);
    conversationHistory = pushConversationEntry(conversationHistory, role, text);
    syncConversationHistory();
  };

  const renderConversationHistory = () => {
    messages.innerHTML = '';

    if (conversationHistory.length) {
      conversationHistory.forEach((entry) => appendMessage(messages, entry.role, entry.text));
      return;
    }

    appendMessage(messages, 'assistant', getWelcomeMessage(assistantPage));
  };

  const syncAssistantStateForCurrentUser = () => {
    const nextStateKey = buildAssistantStateKey(readAuthSessionUser());

    if (nextStateKey === activeAssistantStateKey) {
      return;
    }

    activeAssistantStateKey = nextStateKey;
    uiState = readAssistantUiState();
    conversationHistory = uiState.history || [];
    assistantContext = normalizeAssistantContext(uiState.context);

    if (page === 'chat') {
      uiState = { ...uiState, open: true, expanded: true, pendingPrompt: '' };
    } else {
      uiState = { ...uiState, open: false, expanded: false, pendingPrompt: '' };
    }

    writeAssistantUiState(uiState);
    panel.classList.toggle('d-none', !uiState.open);
    shell.classList.toggle('assistant-shell-expanded', uiState.expanded);
    panel.classList.toggle('assistant-panel-expanded', uiState.expanded);
    launcher.setAttribute('aria-expanded', String(uiState.open));
    expandButton.setAttribute('aria-pressed', String(uiState.expanded));
    expandButton.setAttribute('aria-label', uiState.expanded ? 'Shrink conversation' : 'Expand conversation');
    expandButton.setAttribute('title', uiState.expanded ? 'Shrink conversation' : 'Expand conversation');
    expandButton.querySelector('.assistant-expand-label').textContent = uiState.expanded ? 'Shrink conversation' : 'Expand conversation';
    fullscreenToggle.setAttribute('aria-pressed', String(uiState.expanded));
    fullscreenToggle.setAttribute('aria-label', uiState.expanded ? 'Shrink conversation view' : 'Open conversation in fullscreen');
    fullscreenToggle.setAttribute('title', uiState.expanded ? 'Shrink conversation view' : 'Open conversation in fullscreen');
    renderConversationHistory();
    input.value = '';
  };

  if (page === 'chat') {
    shell.classList.add('assistant-shell-page');
  }

  if (!conversationHistory.length) {
    conversationHistory = pushConversationEntry(conversationHistory, 'assistant', getWelcomeMessage(assistantPage));
    syncConversationHistory();
  }

  renderConversationHistory();

  renderQuickActions(quickActions, getQuickActionCards(assistantPage), (prompt) => {
    if (page !== 'chat') {
      uiState = { ...uiState, pendingPrompt: prompt };
      writeAssistantUiState(uiState);
      window.location.href = `chat.html?context=${encodeURIComponent(assistantPage)}`;
      return;
    }

    pendingInputMode = 'quick-action';
    input.value = prompt;
    form.requestSubmit();
  });

  const setPanelState = (open) => {
    panel.classList.toggle('d-none', !open);
    launcher.setAttribute('aria-expanded', String(open));
    uiState = { ...uiState, open };
    writeAssistantUiState(uiState);

    if (open) {
      input.focus();
    }
  };

  const setExpandedState = (expanded) => {
    shell.classList.toggle('assistant-shell-expanded', expanded);
    panel.classList.toggle('assistant-panel-expanded', expanded);
    expandButton.setAttribute('aria-pressed', String(expanded));
    expandButton.setAttribute('aria-label', expanded ? 'Shrink conversation' : 'Expand conversation');
    expandButton.setAttribute('title', expanded ? 'Shrink conversation' : 'Expand conversation');
    expandButton.querySelector('.assistant-expand-label').textContent = expanded ? 'Shrink conversation' : 'Expand conversation';
    fullscreenToggle.setAttribute('aria-pressed', String(expanded));
    fullscreenToggle.setAttribute('aria-label', expanded ? 'Shrink conversation view' : 'Open conversation in fullscreen');
    fullscreenToggle.setAttribute('title', expanded ? 'Shrink conversation view' : 'Open conversation in fullscreen');
    uiState = { ...uiState, expanded };
    writeAssistantUiState(uiState);
  };

  launcher.addEventListener('click', () => setPanelState(panel.classList.contains('d-none')));
  expandButton.addEventListener('click', () => setExpandedState(!panel.classList.contains('assistant-panel-expanded')));
  fullscreenToggle.addEventListener('click', () => {
    if (page === 'chat') {
      return;
    }

    window.location.href = `chat.html?context=${encodeURIComponent(assistantPage)}`;
  });

  document.addEventListener(AUTH_STATE_EVENT_NAME, () => {
    syncAssistantStateForCurrentUser();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  setExpandedState(page === 'chat');
  if (page === 'chat') {
    launcher.classList.add('d-none');
    expandButton.classList.add('d-none');
    fullscreenToggle.classList.add('d-none');
    setPanelState(true);
  } else {
    setPanelState(false);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    const inputMode = pendingInputMode;

    pendingInputMode = 'manual';

    if (!message) {
      return;
    }

  const resolvedMessage = resolveContextualMessage(message, conversationHistory, assistantContext);
  const contextResolutionNote = buildContextResolutionNote(message, resolvedMessage);

  appendConversationMessage('user', message);
    input.value = '';
    input.disabled = true;
    submitButton.disabled = true;
    const typingBubble = appendTypingMessage(messages);
    const startedAt = Date.now();
    const targetTypingDelay = getAssistantTypingDelay(inputMode, resolvedMessage);

    try {
      const knowledge = await knowledgePromise;
      const elapsed = Date.now() - startedAt;

      if (elapsed < targetTypingDelay) {
        await wait(targetTypingDelay - elapsed);
      }

      const navigation = parseNavigationCommand(resolvedMessage);
      typingBubble.remove();

      if (navigation) {
        updateAssistantContext({ lastIntent: 'navigation', lastNavigationLabel: navigation.label });
        appendConversationMessage('assistant', joinReplyParts([contextResolutionNote, `Opening the ${navigation.label}.`]));
        window.location.href = navigation.href;
        return;
      }

        if (assistantPage === 'quiz') {
        const command = parseProfileCommand(resolvedMessage);

        if (command) {
          updateAssistantContext(buildAssistantContextUpdate(command, assistantPage, resolvedMessage));
          appendConversationMessage('assistant', joinReplyParts([contextResolutionNote, handleProfileAction(command, { knowledge })]));
          return;
        }
      }

      if (assistantPage === 'products') {
        const command = parseProductFilterCommand(resolvedMessage);

        if (command) {
          updateAssistantContext(buildAssistantContextUpdate(command, assistantPage, resolvedMessage));
          appendConversationMessage('assistant', joinReplyParts([contextResolutionNote, applyProductsAction(command)]));
          return;
        }
      }

      if (assistantPage === 'hair-guide') {
        const command = parseGuideCommand(resolvedMessage);

        if (command) {
          updateAssistantContext(buildAssistantContextUpdate(command, assistantPage, resolvedMessage));
          appendConversationMessage('assistant', joinReplyParts([contextResolutionNote, applyGuideAction(command)]));
          return;
        }
      }

      updateAssistantContext(buildAssistantContextUpdate(null, assistantPage, resolvedMessage));
      appendConversationMessage('assistant', joinReplyParts([contextResolutionNote, handleGenericRequest(resolvedMessage, assistantPage, knowledge)]));
    } finally {
      if (typingBubble.isConnected) {
        typingBubble.remove();
      }

      input.disabled = false;
      submitButton.disabled = false;

      if (inputMode === 'manual') {
        input.focus();
      }
    }
  });

  if (page === 'chat' && initialPendingPrompt) {
    uiState = { ...uiState, pendingPrompt: '' };
    writeAssistantUiState(uiState);
    pendingInputMode = 'quick-action';
    input.value = initialPendingPrompt;
    form.requestSubmit();
  }
}