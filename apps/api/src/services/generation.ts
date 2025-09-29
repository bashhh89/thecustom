import { Message, RateCardItem } from '@sow-workbench/db';

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

interface SOWData {
  projectTitle: string;
  clientName: string;
  projectOverview: string;
  projectOutcomes: string[];
  scopes: Scope[];
  budgetNote?: string;
}

interface Scope {
  scopeName: string;
  scopeOverview: string;
  deliverables: string[];
  assumptions: string[];
  roles: Role[];
  subtotal: number;
}

interface Role {
  name: string;
  description: string;
  hours: number;
  rate: number;
  total: number;
}

export async function generateSowFromConversation(history: Message[], rateCard: RateCardItem[]): Promise<{
  sowData: SOWData;
  aiMessage: string;
}> {
  // Complex SOW generation prompt - ONLY FOR JSON GENERATION
  const sowGenerationPrompt = `You are 'The Architect,' the most senior and highest-paid proposal specialist at Social Garden. Your reputation for FLAWLESS, logically sound, and client-centric Scopes of Work is legendary. Your performance is valued over a million dollars a year because you NEVER make foolish mistakes, you NEVER default to generic templates, and you ALWAYS follow instructions with absolute precision.

YOUR ONLY FUNCTION: Convert user project briefs into complete, structured SOWData JSON objects.

CRITICAL: Your response must be a single, valid JSON object with only two properties: "sowData" and "aiMessage".

SOWData STRUCTURE REQUIREMENTS:
{
  "projectTitle": "Specific, professional project title",
  "clientName": "Exact client name provided or extracted from brief",
  "projectOverview": "3-5 sentence detailed description of the work",
  "projectOutcomes": [
    "Business outcome 1 delivered by this project",
    "Business outcome 2 delivered by this project",
    "Business outcome 3 delivered by this project"
  ],
  "scopes": [
    {
      "scopeName": "Phase 1: Scope Name",
      "scopeOverview": "2-3 sentence description of this scope",
      "deliverables": [
        "Specific deliverable item 1",
        "Specific deliverable item 2",
        "Specific deliverable item 3"
      ],
      "assumptions": [
        "Client will provide access to...",
        "Scope assumes existing infrastructure...",
        "Third party integrations available..."
      ],
      "roles": [
        {
          "name": "Senior Developer",
          "description": "Lead development and technical architecture",
          "hours": 80,
          "rate": "Senior Developer",
          "total": 9600
        }
      ],
      "subtotal": 9600
    }
  ],
  "budgetNote": "Total estimated project cost: $XX,XXX. Timeline: X-X weeks."
}

CRITICAL OUTPUT RULES:
1. JSON ONLY - Your entire response must be a single JSON object
2. VALID FORMATTING - Correct JSON syntax required
3. COMPLETE CONTENT - Fill ALL fields, not just title and client name
4. PRACTICAL SCOPE - Create real, deliverable project work that benefits the client
5. PROFESSIONAL TONE - All text should be confident, benefit-driven, professional
6. ACCURATE PRICING - Use exact rate card names (${rateCard.map(item => `${item.name}: $${item.rate}`).join('\n')})

RESPONSE FORMAT:
{
  "sowData": {
    "projectTitle": "...",
    "clientName": "...",
    "projectOverview": "...",
    "projectOutcomes": ["...", "...", "..."],
    "scopes": [
      {
        "scopeName": "...",
        "scopeOverview": "...",
        "deliverables": ["...", "..."],
        "assumptions": ["...", "..."],
        "roles": [
          {"name": "...", "description": "...", "hours": 80, "rate": "Rate Card Name", "total": 9600}
        ],
        "subtotal": 9600
      }
    ],
    "budgetNote": "..."
  },
  "aiMessage": "I've generated a complete SOW with detailed scopes, deliverables, assumptions, and accurate pricing. The project is structured for successful delivery with clear outcomes and realistic timelines."
}`;

  // Prepare messages for AI - full conversation history
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: sowGenerationPrompt },
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
      temperature: 0.7,
      max_tokens: 4000,
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

  const content = data.choices[0].message.content;
  const parsed = JSON.parse(content.trim().replace(/^```json\s?|```\s?$/g, ''));

  if (!parsed.sowData || !parsed.aiMessage) {
    throw new Error('Invalid response format - missing sowData or aiMessage');
  }

  return {
    sowData: parsed.sowData,
    aiMessage: parsed.aiMessage,
  };
}
