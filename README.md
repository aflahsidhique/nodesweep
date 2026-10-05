<p align="center">
  <img src="build/icon.png" alt="NodeSweep" width="128" height="128" />
</p>

<h1 align="center">NodeSweep</h1>

<p align="center">Clean unused <code>node_modules</code>. Keep what matters.</p>

NodeSweep is a small Windows desktop app that finds `node_modules` folders in projects you haven't touched in a while and lets you delete them in one click. You can reclaim gigabytes of disk space without hunting through folders by hand. Reinstalling the dependencies later is just `npm install` away.

## Download

Grab the latest installer from the [Releases](https://github.com/aflahsidhique/nodesweep/releases/latest) page and run `NodeSweep-<version>-setup.exe`.

> The installer is not code-signed yet, so Windows SmartScreen may show "Windows protected your PC". Click **More info → Run anyway** to continue.

## Features

- **Scan a folder or a whole drive** for `node_modules` directories.
- **Spot inactive projects.** A project counts as unused when none of its `package.json`, lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) or, optionally, its Git `HEAD` has changed within the chosen period (7–60 days).
- **Minimum size filter** so only folders worth deleting show up (50 MB – 1 GB).
- **Review before deleting.** Results are sorted by size, you pick what goes, and a confirmation dialog shows the total.
- **Built-in error console.** Click the settings icon in the title bar to see any errors or warnings from the current session, with copyable details.

## How deletion is kept safe

Every deletion request is checked in the main process before anything is removed. A target must:

1. be an absolute path to a folder literally named `node_modules`,
2. sit inside one of the folders or drives you chose to scan, and
3. still exist and be a real directory.

Anything else is refused. While scanning, NodeSweep never follows symbolic links, and it skips build and cache folders such as `.git`, `dist`, `build`, `.next` and `.cache`.

## Development

Requirements: [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev        # start the app with hot reload
npm test           # run unit tests
npm run typecheck  # type-check main, preload and renderer
npm run lint
```

### Building the Windows installer

```bash
npm run build:win
```

The installer is written to `dist/NodeSweep-<version>-setup.exe`. Installer artwork (icon, sidebar and header bitmaps, welcome page text) lives in [`build/`](build).

> **VS Code users:** if the build fails with `app.asar: The process cannot access the file`, VS Code is holding the old archive open. The bundled `.vscode/settings.json` prevents this, but if it happens, fully quit VS Code and build again.

### Project layout

```
src/
  main/       Electron main process: IPC handlers, scanner, deletion, settings, logging
  preload/    Typed bridge exposed to the renderer as window.nodeSweep
  renderer/   React + Tailwind UI
  shared/     Types and IPC channel names shared by both sides
build/        Installer icon and artwork
resources/    Runtime window icon
```

Built with [Electron](https://www.electronjs.org/), [electron-vite](https://electron-vite.org/), React, Tailwind CSS and Zustand.

### Keeping the app small

Renderer libraries are bundled by Vite, so they're listed under `devDependencies` and aren't shipped as `node_modules`. Main-process libraries are bundled into `out/main` the same way. The packaged app only contains `out/`, `resources/` and `package.json`.

## Contributing

Issues and pull requests are welcome. Please run `npm run typecheck`, `npm run lint` and `npm test` before opening a PR.

## License

[MIT](LICENSE)
