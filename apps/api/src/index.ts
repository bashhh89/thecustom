import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { sowRoutes } from './routes/sow.js';
import { rateCardRoutes } from './routes/rate-card.js';
import { settingsRoutes } from './routes/settings.js';
import { aiModelsRoutes } from './routes/ai-models.js';
import { folderRoutes } from './routes/folders.js';
import { exportRoutes } from './routes/export.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sows', sowRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/rate-card', rateCardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai/models', aiModelsRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});
