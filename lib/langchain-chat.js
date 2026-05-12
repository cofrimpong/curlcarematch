import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const openAiModelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 700,
  chunkOverlap: 120
});
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(moduleDir, '..');

let knowledgeChunksPromise;

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalizeSearchText(value)
    .split(' ')
    .filter((token) => token.length > 2);
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function buildKnowledgeSources() {
  const [corpusText, products, guides] = await Promise.all([
    fs.readFile(path.join(rootDir, '_corpus', 'haircare-knowledge.md'), 'utf8'),
    readJson(path.join(rootDir, 'data', 'products.json')),
    readJson(path.join(rootDir, 'data', 'hair_guides.json'))
  ]);

  const productSummaries = products.map((product) => ({
    source: `product:${product.id}`,
    type: 'product',
    body: [
      `${product.name} by ${product.brand}`,
      `Type: ${product.productType}`,
      `Best hair types: ${(product.bestHairTypes || []).join(', ')}`,
      `Best porosity: ${(product.bestPorosity || []).join(', ')}`,
      `Best density: ${(product.bestDensity || []).join(', ')}`,
      `Goals: ${(product.goals || []).join(', ')}`,
      `Ingredients: ${(product.ingredients || []).join(', ')}`,
      `Description: ${product.description || ''}`,
      `Warnings: ${(product.avoidWarnings || []).join(', ')}`
    ].join('\n')
  }));

  const guideSummaries = [
    ...(guides.hairTypes || []).map((entry) => ({
      source: `guide:hair-type:${entry.title}`,
      type: 'guide',
      body: `${entry.title}: ${entry.description}`
    })),
    ...(guides.porosity || []).map((entry) => ({
      source: `guide:porosity:${entry.level}`,
      type: 'guide',
      body: `Porosity ${entry.level}: ${entry.description}`
    })),
    ...(guides.density || []).map((entry) => ({
      source: `guide:density:${entry.level}`,
      type: 'guide',
      body: `Density ${entry.level}: ${entry.description}`
    }))
  ];

  return [
    { source: 'corpus:haircare-knowledge', type: 'corpus', body: corpusText },
    ...guideSummaries,
    ...productSummaries
  ];
}

async function buildKnowledgeChunks() {
  const sources = await buildKnowledgeSources();
  const chunkGroups = await Promise.all(sources.map(async (source) => {
    const documents = await textSplitter.createDocuments([source.body], [{ source: source.source, type: source.type }]);
    return documents.map((document) => ({
      text: document.pageContent,
      source: document.metadata.source,
      type: document.metadata.type,
      normalizedText: normalizeSearchText(document.pageContent)
    }));
  }));

  return chunkGroups.flat();
}

async function getKnowledgeChunks() {
  if (!knowledgeChunksPromise) {
    knowledgeChunksPromise = buildKnowledgeChunks();
  }

  return knowledgeChunksPromise;
}

function scoreChunk(chunk, queryTokens, page) {
  const overlapScore = queryTokens.reduce((score, token) => score + (chunk.normalizedText.includes(token) ? 2 : 0), 0);
  const pageBonus = page && chunk.source.includes(page) ? 1 : 0;
  return overlapScore + pageBonus;
}

async function retrieveRelevantContext(message, page) {
  const chunks = await getKnowledgeChunks();
  const queryTokens = tokenize(message);

  const ranked = chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk, queryTokens, page)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  return ranked.map((chunk) => `[${chunk.source}]\n${chunk.text}`).join('\n\n');
}

function buildHistorySnippet(history) {
  if (!Array.isArray(history) || !history.length) {
    return 'No recent conversation history.';
  }

  return history
    .slice(-6)
    .map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${String(entry.text || '').trim()}`)
    .join('\n');
}

function extractResponseText(response) {
  if (typeof response?.content === 'string') {
    return response.content.trim();
  }

  if (Array.isArray(response?.content)) {
    return response.content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join(' ')
      .trim();
  }

  return '';
}

export async function generateGroundedReply({ message, page, history }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const context = await retrieveRelevantContext(message, page);
  const model = new ChatOpenAI({
    model: openAiModelName,
    temperature: 0.2
  });
  const prompt = [
    'You are CurlCare Helper for a haircare recommendation site.',
    'Answer only using the provided context and the recent conversation when it is relevant.',
    'Be concise, practical, and do not invent products, ingredients, or site features.',
    'If the answer is not supported by the context, say that clearly and suggest the closest supported help you can give.',
    `Current page: ${page || 'site'}`,
    `Recent conversation:\n${buildHistorySnippet(history)}`,
    `Grounding context:\n${context || 'No relevant context matched.'}`,
    `User question: ${message}`
  ].join('\n\n');
  const response = await model.invoke(prompt);
  return extractResponseText(response);
}