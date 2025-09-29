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

export async function getConversationalReply(message: string, history: Message[]): Promise<string> {
  // Simple conversational prompt - NO SOW GENERATION LOGIC
  const conversationPrompt = `You are a helpful AI assistant specializing in project planning and SOW creation. Your goal is to have a natural, conversational dialogue with the user to help them plan their project.

Guidelines:
- Be friendly and conversational
- Ask clarifying questions about project scope, timeline, budget, and requirements
- Keep responses concise but informative
- Guide the conversation toward gathering enough information for a comprehensive project brief
- When appropriate, suggest they can use "/buildsow" to generate the final SOW

Respond naturally to continue the conversation.`;

  // Prepare messages for AI
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: conversationPrompt },
    ...history.slice(-10).map(msg => ({ // Last 10 messages for context
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    { role: 'user', content: message }
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
      max_tokens: 800,
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
    throw new Error('No response from Grok');
  }

  return data.choices[0].message.content.trim();
}
