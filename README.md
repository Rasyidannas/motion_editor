# Motion Editor

SvelteKit project with Drizzle ORM and SQLite using an **MVVM** (Model-View-ViewModel) architecture.

### What is the Model?

Business logic, API calls, databases, repositories — the data layer.

- **Server-side handlers** (`src/routes/api/`) expose CRUD endpoints for elements and animejs records.
- **View models** (`src/view_models/`) encapsulate all database operations (Drizzle queries, inserts, deletes) and validation.
- **DB schema** (`src/lib/server/db/schema/`) defines tables, enums, and relationships.
- Core data structures: `ElementBlock` / `AnimeBlock` (parser output), DB rows from `elements` and `animejs` tables.

The Model never imports View or ViewModel code — it is a pure data/service layer.

### What is the View?

Displaying data and capturing user interactions (clicks, typing, etc.), forwarding actions to the ViewModel.

- **Svelte pages & components** (`src/routes/canvas/[frameId]/+page.svelte`) render the UI: code editor, element tree, preview iframe, playback controls, AI chat drawer.
- The View binds to reactive stores exposed by the ViewModel (`$code`, `$elements`, `$selectedElement`, `$previewDoc`, `$saving`, `$saveError`, …).
- User actions (typing in the editor, clicking Save, toggling play/pause, selecting an element) call ViewModel methods (`view.saveElement()`, `view.selectElement()`, `view.togglePlay()`, …).
- The View never calls the Model directly — it only talks to the ViewModel.

### What is the ViewModel?

Holds and exposes observable UI state. Receives user actions from the View, calls the Model to get or persist data, and exposes results reactively back to the View.

- **`createCanvasView(serverData)`** (`src/views/canvasView.js`) is the central ViewModel factory. It owns all writable/derived Svelte stores:
  - `code`, `elements`, `selectedElement`, `previewDoc`, `saving`, `saveError`, `playing`, …
- Methods like `saveElement()`, `selectElement()`, `togglePlay()`, `sendChat()` orchestrate the flow: parse editor content → call Model APIs → update stores → the View re-renders automatically.
- The ViewModel is also responsible for **preparing/formatting data** for the View:
  - `parseCodeEditor()` splits raw editor text into typed `ElementBlock[]` and `AnimeBlock[]` arrays.
  - `mergeCodeEditor()` reverses it: reassembles DB records back into a single editor string on page load.
  - `previewDoc` is a derived store that wraps user code in a complete HTML document with animejs imports and runtime controls.
- The ViewModel holds **no DOM references** — it is fully testable without a browser.

## Database Schema

Located at `src/lib/server/db/schema/`.

### Tables

| Table | Columns |
|---|---|
| `frames` | `id` (text PK), `title`, `created_at`, `updated_at` |
| `elements` | `id`, `value` (json), `type`, `frame_id` (FK → frames), `created_at`, `updated_at` |
| `animejs` | `id`, `element_id` (FK → elements), `type`, `type_value` (json), `util`, `util_value` (json), `created_at`, `updated_at` |

### Enum types (text-based)

- `element_types` — `rectangle`, `elipse`, `triangle`, `star`
- `animejs_types` — `timer`, `animate`, `timeline`, `layout`, `svg`, `anime_text`, `easing`
- `utility` — `stagger`, `get`, `utility_set`, `clean_inline_style`, `remove`, `sync`, `keep_time`, `random`, `create_seeded_random`, `random_pick`, `shuffle`, `round`, `clamp`, `snap`, `wrap`, `map_range`, `lerp`, `damp`, `round_pad`, `pad_start`, `pad_end`, `deg_end`, `deg_to_rad`, `rad_to_deg`, `chain_able`

## Migrations

```sh
# Generate a new migration SQL file
npm run db:generate

# Apply pending migrations to the database
npm run db:migrate

# Push schema changes directly (requires TTY)
npm run db:push
```

## Seeding

```sh
# Seed the database
npm run db:seed
```

Seed logic is defined in `src/lib/server/db/seed.js`.

## AI Chat

The canvas page has an AI Chat drawer (toggle in the top bar) that edits the
code editor: describe a change, the reply replaces the editor code, and the
preview updates live. An Undo button restores the previous code.

It calls an OpenAI-compatible chat completions API, configured via `.env`:

```sh
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
# AI_API_URL=https://api.openai.com/v1
```

Other providers work by pointing `AI_API_URL` at them, e.g. OpenRouter
(`https://openrouter.ai/api/v1`), Groq (`https://api.groq.com/openai/v1`), or a
local Ollama (`http://localhost:11434/v1` with any `AI_API_KEY` value).

### OpenRouter setup

1. Create a key at https://openrouter.ai/keys
2. Set in `.env`:
```sh
AI_API_URL=https://openrouter.ai/api/v1
AI_API_KEY=sk-or-...
AI_MODEL=openrouter/free
```
`openrouter/free` auto-routes to a currently-free model (the free roster
churns, so this is stabler than pinning a `:free` ID; pick a specific one from
https://openrouter.ai/models if you prefer). Optional `AI_SITE_URL` /
`AI_SITE_NAME` are sent as `HTTP-Referer` / `X-Title` for OpenRouter rankings.

## Adding a Column

1. Edit the table definition in `src/lib/server/db/schema/<file>.js`:
   ```js
   // Example: add a `description` column to `frames`
   description: text('description')
   ```
2. Generate the migration:
   ```sh
   npm run db:generate
   ```
3. Apply the migration:
   ```sh
   npm run db:migrate
   ```

## Removing a Column

1. Remove the column definition from `src/lib/server/db/schema/<file>.js`:
   ```js
   // Delete this line:
   // description: text('description')
   ```
2. **SQLite does not support `ALTER TABLE DROP COLUMN` directly.** You must recreate the table:
   - Create a new temporary table without the column
   - Copy data from the old table
   - Drop the old table
   - Rename the temporary table
   
   Use `npm run db:push` to let Drizzle handle the schema diff automatically, or manually handle it in the migration SQL file generated by `npm run db:generate`.

## Schema File Structure

```
src/lib/server/db/
├── schema.js          # Re-exports all tables and enums
├── index.js           # Drizzle client setup
├── drizzle.config.js  # Drizzle Kit config
└── schema/
    ├── enums.js       # Text-based enum column definitions
    ├── frames.js      # frames table
    ├── elements.js    # elements table
    └── animejs.js     # animejs table
```
