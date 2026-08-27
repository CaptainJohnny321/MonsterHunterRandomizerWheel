# Monster Hunter Randomizer

Monster Hunter Randomizer is a desktop hunt randomizer for Monster Hunter Wilds. Choose the monsters and weapons in each wheel, set their percentage weights, and roll a hunt assignment.

## Download for Windows

Download the latest version directly from the repository:

- [Download and install Monster Hunter Randomizer](https://github.com/CaptainJohnny321/MonsterHunterRandomizerWheel/releases/latest/download/Monster.Hunter.Randomizer.Setup.0.0.0.exe)
- [Download the portable version](https://github.com/CaptainJohnny321/MonsterHunterRandomizerWheel/releases/latest/download/Monster.Hunter.Randomizer.0.0.0.exe)
- [View all releases and files](https://github.com/CaptainJohnny321/MonsterHunterRandomizerWheel/releases)

The installer is recommended for most users. The portable version runs without installation.

## Monster variant options

Each monster has separate checkboxes for **Normal** and **Tempered**. **Arch Tempered** is available for Arkveld, Uth Duna, Rey Dau, Nu Udra, and Jin Dahaad. Use **Tempered all** or **Arch Tempered all** above the monster list to enable or disable an entire tier. Variant checkboxes share the monster's weight value, so enabled variants have equal weight for that monster.

## Streamer setup guide

### What streamers need

1. Download and install the latest **Monster Hunter Randomizer** Windows release.
2. Open Monster Hunter Randomizer before opening Streamlabs.
3. Keep the app running while streaming. It hosts the overlay locally.

### The overlay URL

The URL for Streamlabs is:

```text
http://127.0.0.1:3210/?overlay=1
```

This URL is the same for every streamer, but `127.0.0.1` always means **the current computer**. Each streamer must have Monster Hunter Randomizer running on their own computer for the URL to work. The URL does not come from GitHub and does not need to be changed for different users.

### Add the overlay to Streamlabs

1. Open Streamlabs Desktop.
2. In the **Sources** panel, click **Add Source**.
3. Select **Browser Source**.
4. Paste the overlay URL above into the **URL** field.
5. Set the Browser Source size to match the area where it will appear on stream, such as `800` width by `450` height.
6. Confirm that the Browser Source background is transparent, then click **Done**.
7. Resize and position the source on the stream canvas.

The overlay shows only the monster and weapon wheels. The page background, headings, buttons, weight lists, and hunt log are hidden automatically.

### Open the second overlay window

Click the clearly labeled **Streamer overlay** button in the main application. This opens a second window containing only the wheels, while the original window keeps the controls, weights, percentages, and enable/disable settings.

The two windows stay synchronized. Roll or change settings in the main window and the overlay updates. In the overlay window, press **Space** to request a roll from the main window. Press **Escape** to close overlay mode.

For a Browser Source instead of a second app window, use the URL with `?overlay=1` shown above.

### Troubleshooting

- **Browser Source says "Failed to load":** open Monster Hunter Randomizer first, then refresh the Browser Source in Streamlabs.
- **The page is blank:** confirm the URL is exactly `http://127.0.0.1:3210/?overlay=1`, including `?overlay=1`.
- **The overlay disappears:** make sure the desktop app is still running. Closing it stops the local overlay server.
- **The wheels do not match the native app:** Browser Source runs as a separate app instance. Use Streamlabs **Window Capture** and crop the native app, or use the native app's **Streamer overlay** mode for a live matching display.

During development, `npm run dev` remains available at `http://localhost:5173/?overlay=1`.

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

Commit the generated installer to a GitHub Release rather than the source repository. People can download the installer for their operating system and use Monster Hunter Randomizer like a normal desktop app.

On Windows, download the portable `.exe` from the GitHub Release to run Monster Hunter Randomizer directly without installing it. The `Setup` `.exe` installs the app normally and adds standard Windows shortcuts.

To publish a Windows release automatically, push a version tag such as `v1.0.0`. GitHub Actions builds both Windows executables and attaches them to a new GitHub Release. The first workflow run may require enabling Actions and allowing the workflow to write releases in the repository settings.

## Asset attribution

Monster icons and weapon icons are sourced from the Monster Hunter Wiki. See the asset README files for source links and attribution requirements:

- `assets/monsters/README.md`
- `assets/weapons/README.md`
