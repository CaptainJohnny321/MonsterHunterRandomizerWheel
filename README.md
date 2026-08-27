# Monster Wheel

Monster Wheel is a desktop hunt randomizer for Monster Hunter Wilds. Choose the monsters and weapons in each wheel, set their percentage weights, and roll a hunt assignment.

## Run during development

```text
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Run as a desktop app

```text
npm install
npm run app
```

This builds the app and opens it in Electron. The packaged app loads all assets locally and does not require an internet connection.

## Build a downloadable release

Run this on the platform you want to distribute:

```text
npm run dist
```

Installers are written to `release/`:

- Windows: NSIS installer (`.exe`) and portable app (`.exe`)
- macOS: disk image (`.dmg`)
- Linux: AppImage (`.AppImage`)

Commit the generated installer to a GitHub Release rather than the source repository. People can download the installer for their operating system and use Monster Wheel like a normal desktop app.

On Windows, download the portable `.exe` from the GitHub Release to run Monster Wheel directly without installing it. The `Setup` `.exe` installs the app normally and adds standard Windows shortcuts.

To publish releases automatically, push a version tag such as `v1.0.0`. GitHub Actions builds all three platform installers and attaches them to a new GitHub Release. The first workflow run may require enabling Actions and allowing the workflow to write releases in the repository settings.

## Asset attribution

Monster icons and weapon icons are sourced from the Monster Hunter Wiki. See the asset README files for source links and attribution requirements:

- `assets/monsters/README.md`
- `assets/weapons/README.md`
