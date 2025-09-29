# SOW Workbench: Complete Technical Documentation

## Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 14    │    │   Express API   │    │  PostgreSQL DB  │
│   Frontend      │◄──►│   Backend       │◄──►│   + Prisma ORM  │
│   (Port 3000)   │    │   (Port 5578)   │    │   (Port 5440)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Zustand       │    │   OpenRouter    │    │   File Storage  │
│   State Mgmt    │    │   AI Gateway    │    │   (PDFs/Excel)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling and validation

**Backend:**
- **Express.js** - REST API server
- **TypeScript** - Type safety across the stack
- **Prisma ORM** - Database access and migrations
- **OpenRouter API** - AI model gateway (Grok-4-Fast)
- **PostgreSQL** - Primary database

**Infrastructure:**
- **PNPM Monorepo** - Package management and workspace structure
- **Concurrent Development** - API and web servers in parallel
- **Environment Management** - Separate dev/prod configurations

## Database Schema

### Core Tables

```sql
-- SOWs (Statement of Work documents)
model SOW {
  id        String   @id @default(cuid())
  name      String   @default("Untitled SOW")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  folderId  String?  -- Optional folder organization
  sowData   Json?    -- Complete SOW structure
  messages  Message[] -- Conversation history
}

-- Chat Messages
model Message {
  id        String   @id @default(cuid())
  role      String   -- "user" or "assistant"
  content   String   -- Message content
  createdAt DateTime @default(now())
  sowId     String   -- Links to SOW
}

-- Rate Card Items
model RateCardItem {
  id   String @id @default(cuid())
  name String @unique -- "Tech - Specialist", "Project Manager"
  rate Int             -- Hourly rate in dollars
}

-- Folder Organization
model Folder {
  id       String   @id @default(cuid())
  name     String
  parentId String?  -- Nested folder support
  sows     SOW[]    -- SOWs in this folder
}

-- Application Settings
model Setting {
  id    String @id @default(cuid())
  key   String @unique -- "selectedModel", "apiKey"
  value String @db.Text -- Setting value
}
```

### SOW Data Structure (JSON)

```typescript
interface SOWData {
  projectTitle: string
  clientName: string
  projectOverview: string
  projectOutcomes: string[]
  scopes: Scope[]
  budgetNote?: string
  timeline?: {
    duration: string
    phases: Phase[]
  }
}

interface Scope {
  scopeName: string
  scopeOverview: string
  deliverables: string[]
  assumptions: string[]
  roles: Role[]
  subtotal: number
}

interface Role {
  name: string        // Rate card reference
  description: string
  hours: number
  rate: string       // Rate card name for lookup
  total: number      // hours × rate
}
```

## API Architecture

### REST Endpoints

**SOW Management:**
```
GET    /api/sows              -- List all SOWs
POST   /api/sows              -- Create new SOW
GET    /api/sows/:id          -- Get specific SOW
PUT    /api/sows/:id          -- Update SOW
DELETE /api/sows/:id          -- Delete SOW
PUT    /api/sows/:id/move     -- Move SOW to folder
```

**AI Services:**
```
POST   /api/sows/:id/conversation  -- Chat with AI
POST   /api/sows/:id/generate      -- Generate SOW from chat
POST   /api/sows/:id/refine        -- Refine specific parts
POST   /api/sows/:id/commercial    -- Commercial override
```

**Data Management:**
```
GET    /api/rate-card         -- Get all rates
POST   /api/rate-card         -- Create rate item
PUT    /api/rate-card/:id     -- Update rate
DELETE /api/rate-card/:id     -- Delete rate

GET    /api/folders           -- Get folder tree
POST   /api/folders           -- Create folder
PUT    /api/folders/:id       -- Update folder
DELETE /api/folders/:id       -- Delete folder

GET    /api/settings/:key     -- Get setting
PUT    /api/settings/:key     -- Update setting
```

### AI Service Architecture

**Three Specialized Services:**

1. **Conversation Service** (`conversation.service.ts`)
   - Natural language chat
   - Requirements gathering
   - Clarifying questions
   - No SOW generation

2. **Generation Service** (`generation.service.ts`)
   - Complete SOW creation from chat history
   - Intelligent role assignment
   - Rate card integration
   - Returns: `{sowData, aiMessage, architectsLog}`

3. **Command Service** (`command.service.ts`)
   - Slash command processing
   - Field-specific refinements
   - Quick SOW modifications

### AI Prompt Engineering

**The JSON Architect System:**
```typescript
const systemPrompt = `You are 'The Architect,' the most senior proposal specialist at Social Garden. Your reputation for FLAWLESS SOWs is legendary.

CRITICAL OUTPUT RULES:
1. JSON ONLY - Single valid JSON object
2. THREE PROPERTIES: "sowData", "aiMessage", "architectsLog"
3. INTELLIGENT ROLES - Select from rate card, estimate hours
4. COMMERCIAL INTELLIGENCE - Professional pricing and positioning

ROLE SELECTION INTELLIGENCE:
- Technical work: "Tech - Specialist", "Tech - Producer"
- Strategy: "Tech - Sr. Consultant", "Account Management"
- Project coordination: Always include "Project Management"
- Match expertise to deliverable complexity`
```

**Post-Processing Intelligence:**
- Auto-fills missing rates from rate card
- Recalculates totals if inconsistent
- Ensures no $0 or empty roles
- Validates JSON structure

## Frontend Architecture

### Component Structure

```
src/
├── app/                    -- Next.js App Router
│   ├── layout.tsx         -- Root layout
│   ├── page.tsx           -- Landing page
│   ├── workbench/         -- Main SOW editor
│   └── settings/          -- Configuration
├── components/
│   ├── ui/                -- shadcn/ui components
│   ├── chat/              -- AI conversation
│   │   ├── chat-input.tsx
│   │   ├── message-list.tsx
│   │   └── chat-message.tsx
│   ├── workbench/         -- SOW editor
│   │   ├── workbench.tsx
│   │   ├── project-summary.tsx
│   │   └── project-scopes.tsx
│   └── sidebar/           -- Navigation
├── stores/
│   └── sow-store.ts       -- Zustand state management
└── lib/
    ├── utils.ts           -- Utilities
    └── export-utils.ts    -- PDF/Excel export
```

### State Management (Zustand)

**Core State:**
```typescript
interface SOWStore {
  // Data
  sows: SOW[]
  activeSow: SOW | null
  rateCard: RateCardItem[]
  
  // UI State
  sidebarVisible: boolean
  isLoading: boolean
  chatMode: 'plan' | 'build'
  
  // Actions
  sendMessage: (content: string) => Promise<void>
  updateActiveSowData: (data: any) => Promise<void>
  recalculateAllTotals: () => void
}
```

**Unified State Updates:**
- Optimistic updates for UX
- Automatic pricing recalculation
- Real-time synchronization with backend
- Auto-save functionality

### Key Features Implementation

**1. Architect's Log:**
```typescript
// AI response includes reasoning
{
  sowData: {...},
  aiMessage: "Generated SOW for HubSpot Integration...",
  architectsLog: [
    "Brief Analysis: Identified complex API integration needs",
    "Role Selection: Prioritized Tech - Specialist for technical depth",
    "Budget Reasoning: Estimated 80 hours based on similar projects"
  ]
}

// Displayed as collapsible section in chat
<ArchitectsLogSection architectsLog={message.architectsLog} />
```

**2. Liquid Editor:**
```typescript
// Every field is controlled input
<Input
  value={sowData.projectTitle}
  onChange={(e) => updateField('projectTitle', e.target.value)}
/>

// Auto-save with debouncing
const debouncedSave = useDebouncedCallback(
  async (sowData) => await updateActiveSowData(sowData),
  1500
);
```

**3. Intelligent Pricing:**
```typescript
// Role selection auto-populates rate
const handleRoleChange = (roleName: string) => {
  const rateItem = rateCard.find(r => r.name === roleName);
  if (rateItem) {
    updateRole(scopeIndex, roleIndex, 'rate', rateItem.rate);
    recalculateAllTotals();
  }
};
```

## Development Workflow

### Monorepo Structure
```
/root/thecustom/
├── apps/
│   ├── web/               -- Next.js frontend
│   └── api/               -- Express backend
├── packages/
│   ├── db/                -- Prisma schema & migrations
│   └── ui/                -- Shared components (future)
├── package.json           -- Root dependencies
├── pnpm-workspace.yaml    -- Workspace configuration
└── ecosystem.*.config.js  -- PM2 deployment
```

### Development Commands
```bash
# Start development servers
pnpm dev                   # Both web + API concurrently

# Database operations
cd packages/db
pnpm generate             # Generate Prisma client
pnpm migrate:dev          # Run migrations
pnpm seed                 # Seed rate card data

# Package management
pnpm install              # Install all dependencies
pnpm --filter web add X   # Add dependency to web app
pnpm --filter api add X   # Add dependency to API
```

### Deployment Architecture

**Production Setup (PM2):**
```javascript
// ecosystem.production.config.js
module.exports = {
  apps: [
    {
      name: 'sow-api',
      cwd: './apps/api',
      script: 'tsx src/index.ts',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'sow-web',
      cwd: './apps/web',
      script: 'npm start',
      env: { NODE_ENV: 'production' }
    }
  ]
};
```

**Database (PostgreSQL):**
- Connection pooling via Prisma
- Automatic migrations
- Backup and monitoring scripts

## Security & Performance

### Security Measures
- **API Authentication** - Environment-based API keys
- **Input Validation** - Zod schemas for all inputs
- **SQL Injection Protection** - Prisma ORM parameterized queries
- **Rate Limiting** - Express middleware for API protection
- **Environment Isolation** - Separate dev/prod configurations

### Performance Optimizations
- **Next.js Optimizations** - Image optimization, code splitting
- **Database Indexing** - Optimized queries for large datasets
- **Caching Strategy** - React Query for API caching
- **Bundle Optimization** - Tree shaking, dynamic imports
- **CDN Ready** - Static asset optimization

### Monitoring & Logging
- **Error Tracking** - Structured error logging
- **Performance Monitoring** - API response times
- **Usage Analytics** - User interaction tracking
- **Health Checks** - Automated uptime monitoring

## Scaling Considerations

### Multi-Tenant Architecture (SaaS Ready)
```typescript
// Add tenantId to all models
model SOW {
  id       String @id @default(cuid())
  tenantId String @index  // Organization isolation
  // ... rest of fields
}

// Middleware for tenant isolation
app.use((req, res, next) => {
  req.tenantId = extractTenantFromAuth(req);
  next();
});
```

### Horizontal Scaling
- **Stateless API** - Ready for load balancing
- **Database Sharding** - Tenant-based partitioning
- **CDN Integration** - Global content delivery
- **Microservices Ready** - Clear service boundaries

### Integration Points
- **Webhook Support** - Real-time notifications
- **REST API** - Third-party integrations
- **Export Formats** - PDF, Excel, JSON
- **Import Capabilities** - Existing proposal migration

This technical foundation supports both current Social Garden needs and future SaaS expansion to thousands of agencies worldwide.