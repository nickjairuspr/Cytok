# CytoAI Chat

A full-stack AI chat application with a ChatGPT-style interface powered by the CytoAI API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/chat-app run dev` — run the frontend (port 18228)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, framer-motion, lucide-react
- API: Express 5
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Markdown: react-markdown + rehype-highlight + remark-gfm
- AI: CytoAI API (OpenAI-compatible, base URL: https://cytoai.jemph.workers.dev/v1)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `artifacts/api-server/src/routes/chat.ts` — SSE streaming proxy to CytoAI
- `artifacts/api-server/src/routes/models.ts` — Models list endpoint
- `artifacts/chat-app/src/hooks/useChat.ts` — Main chat state management
- `artifacts/chat-app/src/hooks/useLocalStorage.ts` — localStorage utility
- `artifacts/chat-app/src/components/` — Sidebar, MessageList, ChatInput, SettingsModal
- `artifacts/chat-app/src/pages/Chat.tsx` — Main chat page
- `artifacts/chat-app/src/lib/types.ts` — Shared types (ChatSession, Message, ChatSettings)

## Architecture decisions

- CytoAI API key is proxied through the Express backend — never exposed to the frontend
- Frontend also accepts a user-provided API key via Settings modal (sent as `x-api-key` header)
- Chat history saved in localStorage (`cytoai-sessions`) — no DB needed for persistence
- Settings saved in localStorage (`cytoai-settings`) — model, temperature, max tokens, API key
- SSE streaming handled by forwarding the ReadableStream from CytoAI directly to the client
- AbortController used for stop-generation support

## Product

- ChatGPT-style dark UI with sidebar + main chat area
- Real-time SSE streaming responses
- Markdown rendering with syntax highlighting and code copy buttons
- Model selector: `cyto-2.4` and `cyto-2.4-thinking`
- Settings modal: API key, temperature slider, max tokens slider
- Chat history in sidebar with delete + clear all
- Export conversation as JSON
- Keyboard shortcuts: Cmd/Ctrl+K (new chat), Escape (stop generation)
- Mobile responsive with collapsible sidebar

## Environment variables needed

- `CYTOAI_API_KEY` — Your CytoAI API key (can also be set per-user in the Settings modal)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- The `highlight.js/styles/github-dark.css` import must be the first line in `index.css`
- `uuid` package is used in `useChat.ts` — must be in `devDependencies`
- The SSE `/api/chat` route is not in the OpenAPI spec (codegen doesn't handle streaming well); it's implemented directly

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
