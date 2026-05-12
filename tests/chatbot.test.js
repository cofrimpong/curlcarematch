import { describe, expect, it } from 'vitest';
import { buildAssistantStateKey, buildProductGuidanceReply, getMissingProfileFields, handleGenericRequest, handleProfileAction, isGreetingMessage, normalizeAssistantContext, normalizeConversationHistory, parseGuideCommand, parseNavigationCommand, parseProductFilterCommand, parseProfileCommand, resolveContextualMessage } from '../static/js/chatbot.js';

describe('chat assistant helpers', () => {
  it('reports missing profile fields in human labels', () => {
    const missing = getMissingProfileFields({
      hairType: '4C',
      porosity: '',
      density: 'high',
      goal: '',
      scalpConcern: 'none',
      budget: ''
    });

    expect(missing).toEqual(['Porosity', 'Main goal', 'Budget']);
  });

  it('parses profile field and ingredient commands', () => {
    expect(parseProfileCommand('set porosity to high')).toEqual({
      type: 'set-field',
      field: 'porosity',
      value: 'high'
    });

    expect(parseProfileCommand('i have 4b hair')).toEqual({
      type: 'set-field',
      field: 'hairType',
      value: '4B'
    });

    expect(parseProfileCommand('i have 4b hair, low porosity, medium density, main goal is moisture, i have a dry scalp, and my budget is no more than $25')).toEqual({
      type: 'batch-set-fields',
      updates: {
        hairType: '4B',
        porosity: 'low',
        density: 'medium',
        goal: 'moisture',
        scalpConcern: 'dryness',
        budget: 'up to $25'
      }
    });

    expect(parseProfileCommand('add parabens')).toEqual({
      type: 'toggle-ingredient',
      value: 'parabens',
      checked: true
    });
  });

  it('parses product filter commands', () => {
    expect(parseProductFilterCommand('show leave-ins under $25 for moisture')).toEqual({
      type: 'product-filters',
      clear: false,
      productTypes: ['leave-in'],
      goals: ['moisture'],
      budget: 'up to $25'
    });
  });

  it('parses guide navigation commands', () => {
    expect(parseGuideCommand('take me to type 4')).toEqual({
      type: 'guide-scroll',
      target: 'type-4a-4c'
    });

    expect(parseGuideCommand('show porosity')).toEqual({
      type: 'guide-scroll',
      target: 'porosity'
    });

    expect(parseGuideCommand('explain porosity')).toBeNull();

    expect(parseGuideCommand('help me understand density')).toBeNull();
  });

  it('parses site navigation commands from natural phrasing', () => {
    expect(parseNavigationCommand('take me back to the home page')).toEqual({
      href: 'index.html#why-this-exists',
      label: 'home page'
    });

    expect(parseNavigationCommand('bring me to products')).toEqual({
      href: 'products.html',
      label: 'product library'
    });

    expect(parseNavigationCommand('i want the hair guide')).toEqual({
      href: 'hair-type-guide.html',
      label: 'hair type guide'
    });

    expect(parseNavigationCommand('help me figure out my hair type')).toEqual({
      href: 'hair-type-guide.html',
      label: 'hair type guide'
    });

    expect(parseNavigationCommand('profile builder')).toEqual({
      href: 'quiz.html',
      label: 'profile builder'
    });
  });

  it('parses show my matches as a submit action', () => {
    expect(parseProfileCommand('show my matches')).toEqual({
      type: 'submit-profile'
    });
  });

  it('treats simple greetings like a human hello and follow-up offer', () => {
    expect(isGreetingMessage('hello')).toBe(true);
    expect(isGreetingMessage('hi there')).toBe(true);
    expect(isGreetingMessage('help me with porosity')).toBe(false);

    const reply = handleGenericRequest('hello', 'home', { products: [] });

    expect(reply).toContain('Hi. What can I help you with today?');
    expect(reply).toContain('Pick one of the cards below');
  });

  it('gives product guidance instead of repeating density explanations', () => {
    const reply = buildProductGuidanceReply('show me some products if i have low density', 'hair-guide', { products: [] });

    expect(reply).toContain('For low-density hair');
    expect(reply).toContain('lightweight leave-ins');
    expect(reply).toContain('product library');
  });

  it('explains profile topics even when the profile form is not mounted', () => {
    const reply = handleProfileAction(
      { type: 'explain-topic', topic: 'porosity' },
      {
        knowledge: {
          guides: {
            porosity: [
              { level: 'Low', description: 'Cuticles are tighter and moisture enters more slowly.' },
              { level: 'High', description: 'Moisture enters quickly but can escape faster too.' }
            ]
          },
          corpusText: '',
          products: []
        }
      }
    );

    expect(reply).toContain('Low: Cuticles are tighter');
    expect(reply).not.toContain('The profile builder is not active on this page.');
  });

  it('applies multiple profile fields at once and points to the next missing trait', () => {
    const inputs = {
      hairType: { value: '', dispatchEvent() {} },
      porosity: { value: '', dispatchEvent() {} },
      density: { value: '', dispatchEvent() {} },
      goal: { value: '', dispatchEvent() {} },
      scalpConcern: { value: '', dispatchEvent() {} },
      budget: { value: '', dispatchEvent() {} }
    };

    const form = {
      elements: {
        namedItem(name) {
          return inputs[name] || null;
        }
      },
      querySelectorAll() {
        return [];
      }
    };

    const reply = handleProfileAction(
      {
        type: 'batch-set-fields',
        updates: {
          hairType: '4B',
          porosity: 'low',
          density: 'medium'
        }
      },
      { knowledge: {}, form }
    );

    expect(inputs.hairType.value).toBe('4B');
    expect(inputs.porosity.value).toBe('low');
    expect(inputs.density.value).toBe('medium');
    expect(reply).toContain('Updated your profile: Hair type: 4B | Porosity: Low | Density: Medium.');
    expect(reply).toContain('Next up: Main goal.');
  });

  it('normalizes stored conversation history', () => {
    const normalized = normalizeConversationHistory([
      { role: 'assistant', text: ' First reply ' },
      { role: 'system', text: 'ignore me' },
      { role: 'user', text: '  ' },
      { role: 'user', text: 'Second reply' }
    ]);

    expect(normalized).toEqual([
      { role: 'assistant', text: 'First reply' },
      { role: 'user', text: 'Second reply' }
    ]);
  });

  it('resolves follow-up field prompts from recent context', () => {
    const resolved = resolveContextualMessage('set it to high', [
      { role: 'user', text: 'what is porosity?' },
      { role: 'assistant', text: 'Porosity is how your hair takes in and holds moisture.' }
    ], normalizeAssistantContext({ lastTopic: 'porosity', lastProfileField: 'porosity' }));

    expect(resolved).toBe('set porosity to high');
  });

  it('resolves follow-up product prompts from recent context', () => {
    const resolved = resolveContextualMessage('show those under $25', [
      { role: 'user', text: 'show leave-ins' },
      { role: 'assistant', text: 'Updated the product library for product type leave-in.' }
    ], normalizeAssistantContext({ lastIntent: 'product-filters', lastProductTypes: ['leave-in'] }));

    expect(resolved).toBe('show leave-in under $25');
  });

  it('normalizes stored assistant context', () => {
    expect(normalizeAssistantContext({
      lastIntent: 'product-filters',
      lastTopic: 'porosity',
      lastProductTypes: ['leave-in'],
      lastGoals: ['moisture'],
      lastBudget: 'up to $25'
    })).toEqual({
      lastIntent: 'product-filters',
      lastTopic: 'porosity',
      lastProfileField: '',
      lastGuideTarget: '',
      lastNavigationLabel: '',
      lastProductTypes: ['leave-in'],
      lastGoals: ['moisture'],
      lastBudget: 'up to $25'
    });
  });

  it('scopes assistant storage keys by signed-in user', () => {
    expect(buildAssistantStateKey(null)).toBe('curlcareAssistantUi:guest');
    expect(buildAssistantStateKey({ email: 'Taylor@example.com' })).toBe('curlcareAssistantUi:user:taylor%40example.com');
  });
});