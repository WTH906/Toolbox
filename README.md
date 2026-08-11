# MD Annotator

A Vite + React app for reading and annotating Markdown documents, with a two-way bridge to Obsidian.

Inspired by [markdown-live-preview](https://github.com/tanabe/markdown-live-preview) and [Hypothes.is](https://web.hypothes.is/).

## Features

- **Import / Export** — Load any `.md` file from disk (file picker or drag-and-drop) and export it back
- **Rendered view only** — No raw markdown pane; you see the fully rendered document
- **Highlight annotations** — Select any text to highlight it in one of five colours
- **Margin comments** — Attach notes to any highlight, visible in the sidebar
- **Annotation sidebar** — Browse, edit, delete, and jump-to all annotations
- **Export annotations** — Save annotations as a `.annotations.json` sidecar file
- **Dark / Light theme** — Toggle manually or auto-detect from system preference
- **Obsidian bridge** — Send notes from Obsidian to the app and back with one click each way

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build & deploy

```bash
npm run build
```

The `dist/` folder is ready for Vercel. To deploy:

```bash
npm i -g vercel
vercel
```

### Setting up Upstash Redis (cloud sync)

Sessions are saved to Upstash Redis so annotations persist across devices and browser tabs.

1. In your Vercel dashboard, go to your project → **Integrations** → search **Upstash Redis** in the Marketplace → install it
2. Create a Redis database (pick a region close to your users)
3. Vercel automatically injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars — no manual config needed
4. Redeploy and cloud sync is live

**Local development**: KV isn't available locally, so the app automatically falls back to `localStorage`. Your mother won't notice the difference — the status bar shows "Saved locally" instead of "Saved".

## Obsidian bridge

The companion Obsidian plugin is in the `obsidian-annotator-bridge/` folder. See its own README for installation.

### Sessions

On first visit, the app asks for a session name (e.g. "maman"). This name is the key — whoever types the same name on any device gets the same notes and annotations. No password, no account, no friction. Sessions auto-expire after 90 days of inactivity.

The status bar at the bottom shows sync state at a glance:
- **Green dot / "Saved"** — synced to Upstash Redis
- **Orange dot / "Saved locally"** — Redis unavailable, using browser storage
- **"Saving…"** — write in progress
- Click the session name to switch sessions

### How the round-trip works

1. In Obsidian, click the **highlighter icon** in the ribbon
2. Your browser opens with the note rendered in MD Annotator
3. Highlight text, add comments
4. Click **Send to Obsidian** → vault and folder are pre-filled → click Send
5. The note appears back in your Obsidian vault

### Technical details

- **Obsidian → App**: The plugin base64-encodes the note into a URL hash fragment (`#name=...&content=...`). The hash never hits any server.
- **App → Obsidian**: The app constructs an `obsidian://new` URI with the note content. Obsidian handles the protocol natively.
- URL length limit is ~2MB depending on browser, which covers virtually all markdown notes.

## Tech stack

| Layer       | Library                              |
|-------------|--------------------------------------|
| Bundler     | Vite 6                               |
| UI          | React 19                             |
| Markdown    | marked + DOMPurify                   |
| Styling     | github-markdown-css + custom CSS vars|
| Storage     | Upstash Redis (via Vercel Marketplace)|

## Merging into your toolbox

This is a standard Vite + React project. To integrate:

1. Copy `src/components/` and `src/hooks/`
2. Import `App` or individual components
3. Required deps: `marked`, `dompurify`, `github-markdown-css`

## License

MIT
