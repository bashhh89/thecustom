import { Message } from '@sow-workbench/db';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
}

export async function getConversationalReply(history: Message[]): Promise<string> {
  const systemPrompt = `You are a helpful and professional AI assistant. Your role is to have a natural conversation with a user to help them define the requirements for a Statement of Work. Ask clarifying questions and guide them. Do not generate JSON or any structured data.`;

  // Convert message history to OpenRouter format
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3002',
      'X-Title': 'SOW Workbench'
    },
    body: JSON.stringify({
      model: 'x-ai/grok-4-fast:free',
      messages,
      temperature: 0.8,
      max_tokens: 1000,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenRouter API error:', response.status, errorData);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json() as OpenRouterResponse;

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from AI');
  }

  return data.choices[0].message.content.trim();
}