// Serverless function for Vercel/Netlify
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, conversationHistory, personalContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Build messages array with conversation history
    const messages = conversationHistory && conversationHistory.length > 0
      ? [...conversationHistory, { role: 'user', content: question }]
      : [{ role: 'user', content: question }];

    // Build system message with or without personal context
    let systemMessage = `You are an AI interview assistant helping a candidate answer technical interview questions in real-time.

Your responses should:
- Be brief and professional (2-3 sentences)
- Sound natural and conversational, as if YOU are the candidate
- Include specific technical details when relevant
- Demonstrate practical knowledge without over-explaining
- Focus on real-world experience and results
- Always answer in first person as the candidate
- Remember and reference previous parts of the conversation when relevant

Never say "I'm an AI" or "I haven't done this" - instead, provide helpful, realistic answers a qualified candidate would give.`;

    // Add personal context if provided (Personalized Mode)
    if (personalContext && personalContext.trim()) {
      systemMessage += `\n\n--- CANDIDATE'S PERSONAL INFORMATION ---\n${personalContext}\n\nUse this information when answering questions about experience, projects, skills, or background. Speak as if YOU are the candidate with this experience.`;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        system: systemMessage,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API Error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: error.message });
  }
}
