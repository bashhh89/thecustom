import express from 'express';

const router = express.Router();

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

// Fetch all available models from OpenRouter
router.get('/', async (req, res) => {
  try {
    // Fetch models from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText);
      return res.status(500).json({ error: 'Failed to fetch models from OpenRouter' });
    }

    const data = await response.json() as OpenRouterModelsResponse;

    // Use all available models
    const supportedModels = data.data;

    // Transform to our format
    const models = supportedModels.map(model => ({
      id: model.id,
      name: model.id, // Use the full ID as the name for now
      displayName: model.name || model.id.replace('/', ' - ')
    }));

    res.json(models);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as aiModelsRoutes };
