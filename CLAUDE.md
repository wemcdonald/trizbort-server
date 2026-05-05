# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trizbort.io is a browser-based TypeScript map editor for interactive fiction. Users drag rooms onto a canvas and generate code for Inform 7, TADS, Quest, and other adventure design systems.

This fork extends the original with a **server mode**: a thin Express server that serves the Trizbort SPA, exposes a REST API (`GET/PUT /api/map`), and regenerates Inform 7 source code (spliced into `story.ni` between sentinel comments) on every save.

## Build Commands

```bash
npm install                                  # Install dependencies
npm run dev                                  # Vite dev server (client only, port 5173)
npm run build                                # Build client → dist/
npm run build:server                         # Compile server → dist-server/
npm run test                                 # Run server unit tests (Vitest)
```

## Running the Map Server

```bash
npm run build && npm run build:server
node dist-server/index.js /path/to/project   # e.g. /home/will/code/egreth
```

Open `http://localhost:3333`. The client auto-loads `design/map.json` from the target project and auto-saves on every edit.

`PORT` env var overrides 3333.

## Architecture

### Client (Vite + TypeScript)

The Trizbort SPA runs entirely in the browser. In server mode, `window.__TRIZBORT_SERVER__` is injected by the server into `index.html`. The client detects this and swaps file-saver / file-input for `fetch` calls.

Key client files:
- `src/App.ts` — singleton global state (`App.map`, `App.zoom`, `App.selection`, `App.undoStack`)
- `src/Editor.ts` — canvas interaction, mouse/keyboard, rendering
- `src/Dispatcher.ts` — Observer event bus (`subscribe`, `unsubscribe`, `notify`)
- `src/io/serverSync.ts` — `isServerMode()`, `loadMapFromServer()`, `saveMapToServer()`, `watchServerMap()`
- `src/panels/menuPanel/MenuPanel.ts` — wires server load/save into Save/Open menu items; auto-saves on `Refresh`/`Added`/`Delete` events (debounced 800ms); SSE-reloads on external file change

### Server (Node/Express, `server/`)

- `server/index.ts` — entry point; loads config, mounts router, SSE endpoint, chokidar watcher, serves dist/
- `server/routes.ts` — `GET /api/config`, `GET /api/map`, `PUT /api/map` (save + codegen)
- `server/config.ts` — loads `trizbort.config.json` from the target project
- `server/mapStore.ts` — read/write `design/map.json` (opaque JSON, pretty-printed)
- `server/codegen.ts` — transforms raw Trizbort JSON (elements/`_name`/`_dockStart`) into Handlebars context, compiles `src/codegen/inform7/*.handlebars` at startup
- `server/sentinelWriter.ts` — splices generated I7 between `[ === BEGIN/END GENERATED MAP === ]` markers in `story.ni`

### Map JSON Format (design/map.json)

The file stores the raw Trizbort serialisation:
```json
{
  "title": "...",
  "author": "...",
  "elements": [
    { "_type": "Room", "id": 1, "_name": "Kitchen", "_description": "...", "_dark": false, "objects": [] },
    { "_type": "Connector", "id": 2, "_dockStart": 1, "_dockEnd": 3, "_startDir": 0, "_endDir": 8, "_startType": 0, "_endType": 0, "_oneWay": false }
  ],
  "startRoom": 1,
  "settings": {}
}
```

Note the underscore-prefixed fields — these are the TypeScript class properties serialised by `JSON.stringify`.

### Target Project Config (trizbort.config.json)

Drop this at the root of any Inform 7 project:
```json
{
  "mapSource": "design/map.json",
  "generators": [
    {
      "target": "inform7",
      "output": "src/egreth.inform/Source/story.ni",
      "sentinelBegin": "BEGIN GENERATED MAP",
      "sentinelEnd": "END GENERATED MAP"
    }
  ]
}
```

### Code Generation

`src/codegen/` contains generators for all supported systems. Inform 7 uses Handlebars templates in `src/codegen/inform7/`. The server compiles these templates at startup (via the `handlebars` npm package) and applies the transform:

- `elements` filtered by `_type === 'Room'` → rooms with `name`, `description`, `dark`, `connections`
- `elements` filtered by `_type === 'Connector'` → connections paired to rooms by id
- The generated I7 block is spliced into `story.ni` between sentinel comments; the title line is stripped (story.ni already declares it)

### Tests

```bash
npm run test     # all server tests (Vitest)
```

Test files live in `test/server/`. Fixtures in `test/server/fixtures/valid-project/`.

## Key Patterns

- **Singleton**: `App` class for global state
- **Observer**: `Dispatcher` for event propagation  
- **Factory**: `ViewFactory` for view creation
- **Template Method**: `CodeGenerator` base with concrete implementations
