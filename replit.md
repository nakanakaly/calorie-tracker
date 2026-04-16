# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Mobile App (`artifacts/mobile`)
Expo React Native app — 食事カロリー管理 (Food & Calorie Tracker)

**Features:**
- Daily calorie tracking with animated ring chart
- Macro nutrient tracking (protein, carbs, fat) with progress bars
- Meal sections: breakfast, lunch, dinner, snack
- Date navigation to view past/future days
- History screen with per-day summaries
- Daily goal settings with presets
- **Nutrition label scanner**: camera/gallery photo → OpenAI Vision → auto-fill form

**Key files:**
- `app/(tabs)/index.tsx` — main home screen
- `app/add-food.tsx` — add food form with label scanner
- `app/history.tsx` — history screen
- `app/settings.tsx` — goal settings
- `context/FoodLogContext.tsx` — AsyncStorage data layer
- `constants/colors.ts` — design tokens (green health theme)

### API Server (`artifacts/api-server`)
Express server

**Routes:**
- `GET /api/healthz` — health check
- `POST /api/nutrition-scan` — OpenAI Vision nutrition label extraction (accepts `{ imageBase64: string }`)

**AI Integration:**
- Uses Replit AI Integrations (OpenAI) via env vars `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY`
- Model: gpt-4o with vision for nutrition label analysis

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
