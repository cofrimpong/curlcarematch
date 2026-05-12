import 'dotenv/config';

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateGroundedReply } from './lib/langchain-chat.js';

const app = express();
const port = Number(process.env.PORT || 4173);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '1mb' }));
app.use(express.static(rootDir, { extensions: ['html'] }));

app.post('/api/chat', async (request, response) => {
  const message = String(request.body?.message || '').trim();
  const page = String(request.body?.page || 'site').trim();
  const history = Array.isArray(request.body?.history) ? request.body.history : [];

  if (!message) {
    response.status(400).json({ error: 'A message is required.' });
    return;
  }

  try {
    const answer = await generateGroundedReply({ message, page, history });

    if (!answer) {
      response.status(502).json({ error: 'The LangChain assistant returned an empty response.' });
      return;
    }

    response.json({ answer });
  } catch (error) {
    response.status(500).json({ error: error.message || 'The LangChain chat route failed.' });
  }
});

app.listen(port, () => {
  console.log(`CurlCare Match server running at http://127.0.0.1:${port}`);
});