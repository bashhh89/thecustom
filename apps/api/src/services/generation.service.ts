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
  timeline?: {
    duration: string;
    phases: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
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
  rate: string; // Rate card name reference
  total: number;
}

interface GenerationResult {
  sowData: SOWData;
  aiMessage: string;
  architectsLog: string[];
}

export async function generateSowData(history: Message[], rateCard: RateCardItem[]): Promise<GenerationResult> {
  // Create the rate card string
  const rateCardText = rateCard.map(item => `${item.name}: $${item.rate}`).join('\n');

  // System prompt - The JSON Architect
  const systemPrompt = `You are 'The Architect,' the most senior and highest-paid proposal specialist at Social Garden. Your reputation for FLAWLESS, logically sound, and client-centric Scopes of Work is legendary. Your performance is valued over a million dollars a year because you NEVER make foolish mistakes, you NEVER default to generic templates, and you ALWAYS follow instructions with absolute precision.

YOUR ONLY FUNCTION: Convert user project briefs into complete, structured SOWData JSON objects.

CRITICAL: Your response must be a single, valid JSON object with THREE properties: "sowData", "aiMessage", and "architectsLog".

IMPORTANT: The "aiMessage" must be conversational and contextual. Reference the actual project title, number of scopes, and estimated budget. Make it sound like a helpful collaborator presenting their work.

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
          "name": "Tech - Specialist",
          "description": "Core development and implementation",
          "hours": 60,
          "rate": "Tech - Specialist",
          "total": 7200
        },
        {
          "name": "Project Manager",
          "description": "Project coordination and client communication",
          "hours": 20,
          "rate": "Project Manager",
          "total": 2000
        }
      ],
      "subtotal": 9200
    }
  ],
  "timeline": {
    "duration": "6-8 weeks",
    "phases": [
      {
        "name": "Discovery & Planning",
        "duration": "1-2 weeks",
        "deliverables": ["Project kickoff", "Requirements analysis", "Technical specifications"]
      },
      {
        "name": "Development & Implementation",
        "duration": "4-5 weeks", 
        "deliverables": ["Core development", "Integration", "Testing"]
      },
      {
        "name": "Launch & Optimization",
        "duration": "1 week",
        "deliverables": ["Go-live support", "Performance optimization", "Knowledge transfer"]
      }
    ]
  },
  "budgetNote": "Total investment: $XX,XXX over X-X weeks. This scope has been carefully crafted to deliver maximum ROI while maintaining the highest quality standards. The pricing reflects our proven expertise and includes comprehensive support throughout the project lifecycle."
}

CRITICAL OUTPUT RULES:
1. JSON ONLY - Your entire response must be a single JSON object
2. VALID FORMATTING - Correct JSON syntax required
3. COMPLETE CONTENT - Fill ALL fields, not just title and client name
4. PRACTICAL SCOPE - Create real, deliverable project work that benefits the client
5. PROFESSIONAL TONE - All text should be confident, benefit-driven, professional
6. ACCURATE PRICING - Use exact rate card names (${rateCardText})
7. INTELLIGENT TIMELINE - Analyze total hours and scope complexity to generate realistic project timeline

8. SMART ROLE ASSIGNMENT - You MUST intelligently assign appropriate roles for each scope:
   - Analyze the deliverables and complexity of each scope
   - Select the most suitable roles from the rate card based on work type
   - Estimate realistic hours for each role based on deliverable complexity
   - NEVER leave roles empty or undefined
   - For web development: typically needs Tech - Specialist, Project Manager
   - For strategy work: typically needs Strategy - Senior, Project Manager
   - For complex builds: may need Senior Developer, Tech - Specialist, Project Manager
   - Always ensure roles match the work described in deliverables
8. COMMERCIAL INTELLIGENCE - Create compelling budgetNote that justifies investment and demonstrates value

RATE CARD REFERENCE:
${rateCardText}

ROLE SELECTION INTELLIGENCE:
You MUST select actual role names from the rate card above. Analyze each scope's deliverables and assign the most appropriate roles:
- For technical development work: Use "Tech - Specialist", "Senior Developer"  
- For strategic planning: Use "Strategy - Senior", "Strategy - Director"
- For project management: Always include "Project Manager" for coordination
- For design work: Use "Design - Senior" if available
- Match the role expertise to the deliverable complexity
- Estimate hours based on deliverable scope (simple tasks: 10-30hrs, complex: 40-80hrs, major builds: 80-120hrs)

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
  "aiMessage": "Alright, I've generated the first draft of the SOW for '[PROJECT_TITLE]'. You can see it in the editor now - I've structured it with [NUMBER] phases and estimated [TOTAL_BUDGET]. How does it look? Let me know if you'd like to make any changes.",
  "architectsLog": [
    "Brief Analysis: Identified [key insight about project requirements]",
    "Core Strategy: Structured SOW with [number] phases focusing on [strategic approach]",
    "Role Selection: Prioritized [specific roles] to optimize for [client constraint/goal]",
    "Budget Reasoning: Applied [specific rate/hour decisions] to meet [target/constraint]",
    "Timeline Logic: Estimated [time consideration] based on [complexity factors]"
  ]
}`;

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
    throw new Error('No response from AI');
  }

  const content = data.choices[0].message.content;
  const finishReason = data.choices[0].finish_reason;

  if (finishReason !== 'stop') {
    console.warn('AI response was cut off:', finishReason);
  }

  // Parse the JSON response
  let parsed;
  try {
    console.log('Raw AI response:', content.substring(0, 500) + '...');
    
    // More aggressive cleaning
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks
    cleanedContent = cleanedContent.replace(/^```json\s?|```\s?$/gm, '');
    cleanedContent = cleanedContent.replace(/^```\s?|```\s?$/gm, '');
    
    // Find JSON object boundaries
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in response');
    }
    
    cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
    console.log('Cleaned content for parsing:', cleanedContent.substring(0, 200) + '...');
    
    parsed = JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('Failed to parse JSON response:', parseError);
    console.error('Raw content:', content);
    throw new Error('Invalid JSON response from AI');
  }

  // Helper to fill missing rates/totals
  function fillRoleRates(sowData: SOWData) {
    if (!sowData?.scopes) return sowData;
    for (const scope of sowData.scopes) {
      if (!scope.roles) continue;
      for (const role of scope.roles) {
        // Find rate from rate card if missing/invalid
        let rateNum = Number(role.rate);
        if (!rateNum || isNaN(rateNum)) {
          // Try to match by name
          const rc = rateCard.find(r => r.name === role.name);
          if (rc) {
            role.rate = rc.rate.toString();
            rateNum = rc.rate;
          }
        }
        // If still missing, set to 100 as fallback
        if (!rateNum || isNaN(rateNum)) {
          role.rate = '100';
          rateNum = 100;
        }
        // Fill total if missing/invalid
        if (!role.total || isNaN(Number(role.total))) {
          role.total = (Number(role.hours) || 0) * rateNum;
        }
      }
      // Update scope subtotal
      scope.subtotal = scope.roles.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    }
    return sowData;
  }

  if (parsed.sowData && parsed.aiMessage) {
    // New format with wrapper - return both sowData and architectsLog
    const fixedSowData = fillRoleRates(parsed.sowData);
    return {
      sowData: fixedSowData,
      aiMessage: parsed.aiMessage,
      architectsLog: parsed.architectsLog || []
    };
  } else if (parsed.projectTitle) {
    // Direct SOW data format - backwards compatibility
    const fixedSowData = fillRoleRates(parsed);
    return {
      sowData: fixedSowData,
      aiMessage: "Generated SOW data based on conversation",
      architectsLog: []
    };
  } else {
    console.error('Invalid response format:', parsed);
    throw new Error('Invalid response format - missing sowData or direct SOW data');
  }
}