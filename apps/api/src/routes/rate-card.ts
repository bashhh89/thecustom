import express from 'express';
import { prisma } from '@sow-workbench/db';
import { z } from 'zod';

const router = express.Router();

// Schemas for validation
const CreateRateCardItemSchema = z.object({
  name: z.string().min(1),
  rate: z.number().int().positive(),
});

const UpdateRateCardItemSchema = z.object({
  name: z.string().min(1).optional(),
  rate: z.number().int().positive().optional(),
});

// GET /api/rate-card - Fetch all rate card items
router.get('/', async (req, res) => {
  try {
    const rateCard = await prisma.rateCardItem.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    res.json(rateCard);
  } catch (error) {
    console.error('Error fetching rate card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/rate-card - Create new rate card item
router.post('/', async (req, res) => {
  try {
    const { name, rate } = CreateRateCardItemSchema.parse(req.body);

    const item = await prisma.rateCardItem.create({
      data: {
        name,
        rate,
      },
    });

    res.status(201).json(item);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Name already exists' });
    } else {
      console.error('Error creating rate card item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PUT /api/rate-card/:id - Update rate card item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rate } = UpdateRateCardItemSchema.parse(req.body);

    const item = await prisma.rateCardItem.update({
      where: { id },
      data: {
        name,
        rate,
      },
    });

    res.json(item);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Rate card item not found' });
    } else if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Name already exists' });
    } else {
      console.error('Error updating rate card item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// DELETE /api/rate-card/:id - Delete rate card item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.rateCardItem.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Rate card item not found' });
    } else {
      console.error('Error deleting rate card item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export { router as rateCardRoutes };
