import express from 'express';
import { prisma } from '@sow-workbench/db';
import { z } from 'zod';

const router = express.Router();

// Schemas for validation
const CreateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.string().optional(),
});

const UpdateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').optional(),
  parentId: z.string().optional(),
});

// GET /api/folders - Fetch all folders with their hierarchy
router.get('/', async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      include: {
        children: true,
        sows: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        _count: {
          select: {
            sows: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build hierarchical structure
    const buildHierarchy = (folders: any[], parentId: string | null = null): any[] => {
      return folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => ({
          ...folder,
          children: buildHierarchy(folders, folder.id),
        }));
    };

    const hierarchicalFolders = buildHierarchy(folders);

    res.json(hierarchicalFolders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/folders - Create new folder
router.post('/', async (req, res) => {
  try {
    const { name, parentId } = CreateFolderSchema.parse(req.body);

    // Check if parent exists if provided
    if (parentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return res.status(400).json({ error: 'Parent folder not found' });
      }
    }

    // Check for duplicate names at the same level
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name,
        parentId: parentId || null,
      },
    });

    if (existingFolder) {
      return res.status(400).json({ error: 'A folder with this name already exists at this level' });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId,
      },
      include: {
        children: true,
        sows: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            sows: true,
            children: true,
          },
        },
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      console.error('Error creating folder:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PUT /api/folders/:id - Update folder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = UpdateFolderSchema.parse(req.body);

    // Check if folder exists
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!existingFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if parent exists if provided
    if (parentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return res.status(400).json({ error: 'Parent folder not found' });
      }
    }

    // Check for duplicate names at the same level (excluding current folder)
    if (name) {
      const duplicateFolder = await prisma.folder.findFirst({
        where: {
          name,
          parentId: parentId || null,
          NOT: {
            id: id,
          },
        },
      });

      if (duplicateFolder) {
        return res.status(400).json({ error: 'A folder with this name already exists at this level' });
      }
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        name,
        parentId,
      },
      include: {
        children: true,
        sows: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            sows: true,
            children: true,
          },
        },
      },
    });

    res.json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      console.error('Error updating folder:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// DELETE /api/folders/:id - Delete folder
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if folder exists and get its children count
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            sows: true,
          },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Prevent deletion if folder has children or SOWs
    if (folder._count.children > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with subfolders. Move or delete subfolders first.' });
    }

    if (folder._count.sows > 0) {
      return res.status(400).json({ error: 'Cannot delete folder containing SOWs. Move or delete SOWs first.' });
    }

    await prisma.folder.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as folderRoutes };
