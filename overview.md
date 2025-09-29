# Comprehensive Project Overview: SOW Workbench by Social Garden

This document provides a complete, self-contained overview of the SOW Workbench project, derived from all source files (excluding Markdown documentation like plan.md). It covers the technical stack, system architecture, UI/UX design, branding/marketing positioning, key features, and deployment configuration. The project is an AI-powered web application for generating and editing Statements of Work (SOWs), built as a monorepo for a digital marketing agency. This overview is designed to be fed into any AI model to reconstruct the project's purpose, structure, and implementation details.

## 1. Project Overview and Purpose
The SOW Workbench is a web-based tool developed by Social Garden Australia, a performance marketing and digital transformation agency. It enables users (primarily project managers, marketers, and clients) to collaboratively create, edit, and manage professional Scopes of Work (SOWs) using AI assistance powered by Grok (via OpenRouter). The app streamlines project planning by combining conversational AI for requirement gathering with a structured editor for SOW documents, including scopes, deliverables, roles, pricing, and visualizations.

- **Core Value Proposition**: AI-driven SOW generation reduces manual effort from hours to minutes, ensuring consistent, professional outputs aligned with agency standards. It supports folder organization for multiple projects, real-time editing, and exports for client delivery.
- **Target Users**: Internal agency teams (e.g., proposal specialists), clients in property, education, e-commerce, and government sectors.
- **Key Differentiators**: Integrated AI chat for iterative planning, visual diagrams (Mermaid), drag-and-drop reorganization, and agency-specific rate card integration.

The app operates in two modes:
- **Conversational Mode**: Full-screen AI chat to discuss and refine project requirements.
- **Workbench Mode**: Split-view editor with sidebar navigation, main editing area (tabs for editor/conversation), and right-panel AI companion.

## 2. Tech Stack
The project is a TypeScript monorepo using PNPM for workspace management. It features a full-stack setup with a Next.js frontend, Express backend, and Prisma for database interactions.

### Frontend (apps/web)
- **Framework**: Next.js 14 (App Router, TypeScript, React 18).
- **Styling**: Tailwind CSS 3.3.6 with shadcn/ui components (Radix UI primitives for accessibility), class-variance-authority for variants, Tailwind Merge for class handling, and tailwindcss-animate for animations.
- **State Management**: Zustand for global store (sow-store.ts handles SOWs, folders, messages, UI states like sidebar/chat visibility, loading, and pricing calculations).
- **UI Libraries/Components**:
  - Lucide-react for icons (e.g., Bot, User, Plus, Trash2).
  - React-markdown with remark-gfm for AI response rendering, react-syntax-highlighter for code blocks.
  - @dnd-kit for drag-and-drop (reordering scopes/deliverables).
  - Mermaid 11.12 for diagram generation in scopes.
  - html2canvas, jsPDF, xlsx for exports (PDF, XLSX).
- **Other Dependencies**: next-themes (dark/light mode), use-debounce (auto-save), clsx (conditional classes).
- **Dev Tools**: ESLint (Next.js config), TypeScript 5.3, PostCSS, Autoprefixer.
- **Config Files**:
  - next.config.mjs: Transpiles @sow-workbench/db, remote image patterns (e.g., ibb.co), rewrites /api/* to backend:5578.
  - tailwind.config.ts: Custom theme with CSS variables for colors (primary: hsl(188 70% 30%) – teal-green), radius (0.5rem), animations (accordion-down/up).
  - globals.css: Tailwind layers, body styling (bg-background text-foreground), dark mode variables (e.g., --primary: hsl(170 95% 40%) – bright green).
  - tsconfig.json: Standard Next.js TS config.

### Backend (apps/api)
- **Framework**: Express 4.18 (Node.js/TSX watch for dev).
- **Database**: Prisma 5.8 (client generator, PostgreSQL provider via DATABASE_URL env).
- **AI Integration**: @google/generative-ai 0.18 (Gemini via OpenRouter API for chat completions, prompt engineering for SOW generation).
- **Middleware/Security**: Cors 2.8, helmet 7.1, dotenv 16.3, Zod 3.22 for validation.
- **Routes** (src/routes/):
  - sow.ts: CRUD for SOWs (create, read, update, delete), chat endpoint for AI messages (integrates Gemini service).
  - folders.ts: Nested folder management (create, rename, delete, move SOWs).
  - rate-card.ts: Manage pricing items (name, rate).
  - settings.ts: Key-value settings (e.g., selected AI model).
  - ai-models.ts: List available models.
- **Services** (src/services/):
  - gemini.ts: Core AI logic – conversational chat or SOW generation (JSON output with projectTitle, clientName, overview, outcomes, scopes [name, overview, deliverables, assumptions, roles {name, description, hours, rate, total}], budgetNote). Uses OpenRouter for Grok-4-fast:free, with agency knowledge base prompt.
- **Dev Tools**: TSX 4.6 for hot-reload, @types/* for Express/Cors/Node.
- **Config**: tsconfig.json (strict TS), .env (API keys, DB URL).

### Database (packages/db)
- **ORM**: Prisma (schema.prisma defines models: Folder (nested hierarchy), SOW (JSON sowData, messages relation), Message (role/content/timestamps), RateCardItem (name/rate), Setting (key/value)).
- **Provider**: PostgreSQL (env DATABASE_URL).
- **Scripts**: generate (client), migrate:dev/deploy, studio (UI), seed.ts (initial data).
- **Dev**: ts-node for seeding.

### Workspace & Build
- **Package Manager**: PNPM (pnpm-workspace.yaml: apps/*, packages/*).
- **Root package.json**: Scripts for dev (concurrent web/api), build, start (PM2), clean. Dev deps: concurrently, TS 5.3.
- **Deployment**: ecosystem.dev.config.js (PM2 for API/Web in dev: watch files, logs, restart on memory). ecosystem.production.config.js (implied for prod). VPS_DEPLOYMENT.md (not read, but implies VPS setup).

## 3. System Architecture
The monorepo follows a client-server pattern with AI backend integration.

### Data Flow
- **Frontend (Next.js SSR/CSR)**: Pages like /workbench (SOWWorkbench component initializes store, auto-creates SOW if none). Layout.tsx wraps in ThemeProvider (system/dark mode).
- **State Management (Zustand)**: sow-store.ts centralizes SOWs, folders, rate card, messages, UI (sidebar/chat visibility, modes: conversational/workbench, loading/saving/typing). Actions: fetch/create/select/update SOWs/folders, sendMessage (optimistic UI + API call), pricing recalcs (hours * rate).
- **Backend (Express)**: index.ts sets up routes/middleware. API base: localhost:5578 (rewritten in Next.js). Endpoints handle CRUD, chat (calls Gemini for response/SOW JSON).
- **Database (Prisma/PostgreSQL)**: Models support hierarchical folders, SOWs with JSON data (projectTitle, clientName, overview, outcomes array, scopes array [name, overview, deliverables/assumptions arrays, roles array {name, desc, hours, rate, total}, subtotal]), messages (linked to SOW), rate items, settings.
- **AI Integration**: Gemini service (OpenRouter proxy) for chat/SOW gen. Prompts include agency KB (Social Garden history, services, values). SOW gen outputs strict JSON; conversational mode uses history context.
- **File Structure**:
  - apps/web/src/app/: Pages (layout.tsx, workbench/page.tsx, settings/ai/page.tsx, rate-card/page.tsx, my-sow/page.tsx, landing/page.tsx).
  - apps/web/src/components/: UI (main-content.tsx: modes/tabs, sidebar.tsx: folders/SOWs/bulk ops, chat/*: input/message-list/message (markdown/code), workbench/*: scopes/summary/diagram (Mermaid), ui/*: shadcn primitives).
  - apps/web/src/lib/: utils.ts (classNames), export-utils.ts (PDF/XLSX via jsPDF/html2canvas/xlsx).
  - apps/web/src/stores/: sow-store.ts (full state/actions).
  - apps/api/src/: index.ts (Express setup), routes/* (Zod-validated endpoints), services/gemini.ts (AI prompts).
  - packages/db/: schema.prisma, seed.ts.
  - Public: Logos (header/footer – Social Garden branding).

### Security/Performance
- Helmet/Cors for security; Zod validation.
- Debounced auto-save (1.5s) in workbench.
- Optimistic updates in chat (add user message immediately).
- Error handling: Store errorMessage, console logs.

## 4. UI/UX Design
The design is modern, accessible, and agency-professional, using shadcn/ui for consistent components.

- **Layout**: Flex-based (min-h-screen). Workbench: Left sidebar (w-64, folders/SOWs, bulk select/delete), main (flex-1, header with title/exports/tabs [Conversation/Editor], tab content), right chat panel (w-96, always visible in workbench, toggleable).
- **Modes**:
  - Conversational: Full-screen chat (header with model select, message list, input footer with shortcuts [/buildsow]).
  - Workbench: Tabbed main (Editor: summary/scopes/diagram; Conversation: read-only history). Transitions with Framer Motion-like anims (slide/fade).
- **Components**:
  - Chat: Message bubbles (user right/blue-gradient, AI left/card), avatars (User/Bot icons), markdown (tables, code with copy, blockquotes), typing indicator (dots + "AI typing...").
  - Workbench: Cards for summary (title/client/overview inputs), scopes (nested forms for deliverables/assumptions/roles [select from rate card, hours/rate/total calc], subtotal/grand total green highlight [#20e28f]), Mermaid diagram at bottom.
  - Sidebar: Hierarchical folders (expandable, drag SOWs), unorganized SOWs (cards with edit/delete), bulk mode (checkboxes/select all/delete), settings links (AI/rate card).
  - Inputs: Auto-resizing textarea (chat, max 160px), number inputs for hours (step=1).
  - Interactions: DnD reordering (scopes/roles), optimistic chat sends, auto-save on sowData change.
- **Themes**: System/dark/light (next-themes, CSS vars: primary teal-green dark bright green).
- **Accessibility**: Radix UI (ARIA roles), keyboard nav (Enter send, Shift+Enter new line), focus rings, alt texts (implied for logos/icons).
- **Responsiveness**: Tailwind (grid-cols-2 for summary, overflow-auto for lists/panels), mobile-friendly (stack on small screens implied by flex).
- **Polish**: Animations (slide-in, hover shadows), gradients (#20e28f to #1bc47d for buttons/avatars), loading spinners, error messages.

## 5. Branding & Marketing
Social Garden Australia positions as Australia's #1 Performance Marketing & Digital Transformation Agency (founded 2013, 70+ employees, $2B+ sales delivered).

- **Visual Identity**:
  - Logos: header-logo.png (light theme), footer-logo.png (dark) – Company mark (likely garden/plant motif with text "Social Garden").
  - Colors: Primary hsl(188 70% 30%) (teal for light), hsl(170 95% 40%) (bright green for dark). Accents: Green gradients (#20e28f to #1bc47d for AI elements/buttons). Muted backgrounds, professional neutrals.
  - Typography: Inter font (latin subsets), sans-serif, clean/modern.
- **Marketing Positioning**:
  - Tagline: "AI-powered generation and editing of professional Scopes of Work using Grok AI".
  - Value: ROI-focused, measurable results for property/education/e-commerce/government. Emphasizes expertise (HubSpot/Salesforce certified, video marketing).
  - Tone: Professional, friendly, innovative (vibrant culture, core values: Respect, Accountability, etc.).
  - Landing (app/landing/page.tsx): Hero with overview, features (AI chat, visual scopes, exports), CTA for new SOW.
  - AI Persona: "The Architect" – Senior proposal specialist, flawless SOWs, agency KB-integrated (history, services, awards like Deloitte Fast 50).
- **Monetization/Go-to-Market**: Internal tool for agency efficiency; potential SaaS for clients (implied by templates/rate cards). Marketing: "Streamline SOWs with AI – From Brief to Budget in Minutes".

## 6. Key Features
- **SOW Management**: Create/edit SOWs (JSON: title, client, overview, outcomes, scopes [deliverables, assumptions, roles/pricing], budget). Auto-save, rename, delete, move to folders.
- **AI Chat**: Conversational mode for requirement gathering (/buildsow triggers JSON SOW gen). History with markdown rendering, typing indicators, model select (Grok/Claude/GPT).
- **Organization**: Nested folders (create/rename/delete), bulk select/delete, unorganized SOWs drag-target.
- **Pricing**: Rate card CRUD, auto-calc totals (hours * rate from card), subtotals/grand total.
- **Visualization**: Mermaid flowcharts for scopes (deliverables → roles → timeline).
- **Exports**: PDF (jsPDF/html2canvas), XLSX (xlsx lib) from header.
- **Settings**: AI models, rate card management (pages/settings/ai, rate-card).
- **UI Modes**: Toggle sidebar/chat, transition workbench/conversational.

## 7. Deployment and Operations
- **Dev Setup**: Concurrent pnpm dev (web: next dev port 5577, api: tsx watch port 5578). PM2 ecosystem.dev.config.js (watch src, logs, restart on memory).
- **Prod**: PM2 ecosystem.production.config.js (env production), build (tsc for api, next build for web), start concurrent.
- **DB**: Prisma migrate/deploy, seed.ts for initial data (dev.db SQLite fallback?).
- **Env Vars**: DATABASE_URL (PG), OPENROUTER_API_KEY (AI), NEXT_PUBLIC_API_URL (rewrites).
- **Monitoring**: PM2 logs/status/reload/delete, health endpoint (/health).
- **Scaling**: Fork mode, max memory restart (300M API, 500M web), VPS implied (VPS_DEPLOYMENT.md).

This overview captures the entire project essence: An AI-enhanced SOW tool blending agency branding with modern full-stack tech for efficient project scoping.