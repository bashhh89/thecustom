import express from 'express';
import { prisma } from '@sow-workbench/db';
import { z } from 'zod';
import { getConversationalReply } from '../services/conversation.service.js';
import { generateSowData } from '../services/generation.service.js';
import { executeSlashCommand } from '../services/command.service.js';

const router = express.Router();

// Schemas for validation
const CreateSOWSchema = z.object({
  name: z.string().optional(),
  folderId: z.string().optional(),
  sowData: z.any().optional(),
});

const UpdateSOWSchema = z.object({
  name: z.string().optional(),
  folderId: z.string().optional(),
  sowData: z.any().optional(),
});

const MoveSOWSchema = z.object({
  folderId: z.string().nullable(),
});

// GET /api/sows - Fetch all SOWs
router.get('/', async (req, res) => {
  try {
    const sows = await prisma.sOW.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    res.json(sows);
  } catch (error) {
    console.error('Error fetching SOWs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sows - Create new SOW
router.post('/', async (req, res) => {
  try {
    const { name, folderId, sowData } = CreateSOWSchema.parse(req.body);

    // Check if folder exists if provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });
      if (!folder) {
        return res.status(400).json({ error: 'Folder not found' });
      }
    }

    const sow = await prisma.sOW.create({
      data: {
        name: name || undefined,
        folderId,
        sowData: sowData || undefined,
      },
    });

    res.status(201).json(sow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      console.error('Error creating SOW:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/sows/:id - Fetch single SOW
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sow = await prisma.sOW.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!sow) {
      return res.status(404).json({ error: 'SOW not found' });
    }

    res.json(sow);
  } catch (error) {
    console.error('Error fetching SOW:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/sows/:id - Update SOW
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sowData } = UpdateSOWSchema.parse(req.body);

    const sow = await prisma.sOW.update({
      where: { id },
      data: {
        name,
        sowData,
      },
    });

    res.json(sow);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else if (error?.code === 'P2025') {
      res.status(404).json({ error: 'SOW not found' });
    } else {
      console.error('Error updating SOW:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// DELETE /api/sows/:id - Delete SOW
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.sOW.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
      res.status(404).json({ error: 'SOW not found' });
    } else {
      console.error('Error deleting SOW:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});



// PUT /api/sows/:id/move - Move SOW to folder
router.put('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { folderId } = MoveSOWSchema.parse(req.body);

    // Check if folder exists if provided
    if (folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });
      if (!folder) {
        return res.status(400).json({ error: 'Folder not found' });
      }
    }

    const sow = await prisma.sOW.update({
      where: { id },
      data: {
        folderId,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    res.json(sow);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else if (error?.code === 'P2025') {
      res.status(404).json({ error: 'SOW not found' });
    } else {
      console.error('Error moving SOW:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// POST /api/sows/:id/conversation - Chat conversationally
router.post('/:id/conversation', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Save user message
    await prisma.message.create({
      data: {
        sowId: id,
        role: 'user',
        content: message,
      },
    });

    // Get conversation history
    const messages = await prisma.message.findMany({
      where: { sowId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Get AI response
    const reply = await getConversationalReply(messages);

    // Save AI response
    const savedMessage = await prisma.message.create({
      data: {
        sowId: id,
        role: 'assistant',
        content: reply,
      },
    });

    res.json({ reply: savedMessage });
  } catch (error) {
    console.error('Error in conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sows/:id/generate - Generate SOW data
router.post('/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;

    // Get conversation history
    const messages = await prisma.message.findMany({
      where: { sowId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch rate card
    const rateCard = await prisma.rateCardItem.findMany();

    // Generate SOW data
    const result = await generateSowData(messages, rateCard);

    // Update SOW with new data
    await prisma.sOW.update({
      where: { id },
      data: { sowData: result.sowData as any },
    });

    res.json({ 
      sowData: result.sowData,
      aiMessage: result.aiMessage,
      architectsLog: result.architectsLog
    });
  } catch (error) {
    console.error('Error generating SOW:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sows/:id/refine - Execute slash commands to refine SOW data
router.post('/:id/refine', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;

    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Get current SOW data
    const sow = await prisma.sOW.findUnique({
      where: { id },
      select: { sowData: true },
    });

    if (!sow) {
      return res.status(404).json({ error: 'SOW not found' });
    }

    // Parse and execute command
    const updatedSowData = await executeSlashCommand(command, sow.sowData);

    // Update SOW with refined data
    await prisma.sOW.update({
      where: { id },
      data: { sowData: updatedSowData as any },
    });

    res.json({ sowData: updatedSowData });
  } catch (error) {
    console.error('Error refining SOW:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sows/share/:id - Get public shared SOW
router.get('/share/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sow = await prisma.sOW.findUnique({
      where: { id },
      select: { 
        id: true,
        name: true,
        sowData: true,
        createdAt: true,
        updatedAt: true
      },
    });

    if (!sow) {
      return res.status(404).json({ error: 'SOW not found' });
    }

    // Return the SOW data for public viewing
    res.json({
      id: sow.id,
      name: sow.name,
      sowData: sow.sowData,
      createdAt: sow.createdAt,
      updatedAt: sow.updatedAt
    });
  } catch (error) {
    console.error('Error fetching shared SOW:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/sows/:id/messages - Reset chat for SOW
router.delete('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all messages for this SOW
    await prisma.message.deleteMany({
      where: { sowId: id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error resetting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as sowRoutes };
