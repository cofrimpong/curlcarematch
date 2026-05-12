import { generateGroundedReply } from '../lib/langchain-chat.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

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

    response.status(200).json({ answer });
  } catch (error) {
    response.status(500).json({ error: error.message || 'The LangChain chat route failed.' });
  }
}