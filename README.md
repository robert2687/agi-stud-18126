<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Agentic Studio Pro

Agentic Studio Pro is a browser-native, self-healing IDE that orchestrates Gemini agents to plan, design, scaffold, and patch a project from a single prompt. It combines a Monaco editor, live preview, and terminal logs in a single dashboard while persisting sessions in local storage.

View your app in AI Studio: https://ai.studio/apps/drive/1fN0Gg-P6qvAqavzOsQ4CRDs-etNzdTh8

## Overview
- Prompt-driven workflow with planner, designer, architect, coder, compiler, and patcher stages.
- Monaco-based editor with language detection and undo/redo controls.
- Live preview pane with status overlays.
- Terminal-style activity log and status badges.
- Local-only authentication and session persistence with autosave.

## Tech Stack
- React + TypeScript + Vite
- Gemini API via `@google/genai`
- Monaco Editor
- Tailwind CDN for styling

## Setup
**Prerequisites:** Node.js (LTS recommended)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` and set your Gemini API key:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

This project configures Vite to use port 3000 (see `vite.config.ts`) instead of the default 5173. To override it, update the config or run `npm run dev -- --port <your-port>`, and always confirm the active port in the terminal output.

## Usage
1. Sign up or log in (credentials are stored in local storage for demo use only and are **not** production-ready—use proper authentication for real deployments).
2. Enter an app idea in the intent panel and click **Run**.
3. Track agent progress in the status badge and terminal logs.
4. Review generated files in the editor, then switch to **Preview** to view the UI.
5. Use **Save** or `Cmd/Ctrl + S` to persist the workspace, or **Reset** to start over.

## Scripts
- `npm run dev` — start the Vite dev server.
- `npm run build` — build production assets to `dist/`.
- `npm run preview` — preview the production build locally.

## Configuration
- **Environment variables:** `GEMINI_API_KEY` is loaded from `.env.local` in `vite.config.ts` and exposed as `process.env.API_KEY`, which is what `geminiService.ts` uses. `process.env.GEMINI_API_KEY` is also defined if you need the original name elsewhere.
- **Port:** the dev server is configured for port `3000`.

## Project Structure
- `App.tsx` — main UI and agent workflow orchestration.
- `geminiService.ts` — Gemini API integration and response shaping.
- `types.ts` — shared TypeScript types for project state and design system.
- `vite.config.ts` — Vite configuration and environment variable wiring.
