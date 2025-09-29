// Core types for the SOW Workbench
export type { SOW, Message, RateCardItem } from '@prisma/client';

// Prisma client instance
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface Role {
  name: string;
  description: string;
  hours: number;
  rate: number;
  total: number;
}

export interface Scope {
  scopeName: string;
  scopeOverview: string;
  deliverables: string[];
  assumptions: string[];
  roles: Role[];
  subtotal: number;
}

export interface SOWData {
  projectTitle: string;
  clientName: string;
  projectOverview: string;
  projectOutcomes: string[];
  scopes: Scope[];
  budgetNote?: string;
}
