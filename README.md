# Clipboard Manager

A lightweight, native macOS clipboard history manager built with Electron. Quickly access and paste previously copied text with a global keyboard shortcut.

## Features

- **Clipboard History** - Automatically saves copied text (up to 1000 items)
- **Global Shortcut** - Access history anytime with `Cmd+Shift+V` (customizable)
- **Instant Search** - Filter history with real-time search
- **Quick Paste** - Click or press Enter to paste and return to your app
- **Keyboard Navigation** - Navigate with arrow keys, Enter to paste, Escape to close
- **Menu Bar App** - Lives in your menu bar, always accessible
- **Customizable** - Configure history size, delete key, and keyboard shortcut
- **Light & Dark Mode** - Automatically follows macOS system appearance

## Why I Built This

This application was born out of necessity. As a WordPress support specialist, I deal with a heavy load of copy-paste actions every day — SSH credentials, error logs, outdated plugin and theme lists for audit reports, and countless other snippets of text.

I was inspired by [Pastebot](https://tapbots.com/pastebot/) for Mac, but wanted a free alternative that I could share with my colleagues to make their workflow easier too.

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/ilham-fedev/clipboard-manager.git
cd clipboard-manager

# Install dependencies
npm install

# Run the app
npm start
```

### Build for Distribution

```bash
npm run build
```

This creates a `.dmg` and `.zip` in the `dist` folder that you can install.

## Usage

### Basic Usage

1. Copy text as usual (`Cmd+C`)
2. Press `Cmd+Shift+V` to open clipboard history
3. Click an item or use arrow keys and press Enter to paste
4. The text is pasted into your previous application

### Keyboard Shortcuts

| Shortcut | Action |
| -------- | ------ |
| `Cmd+Shift+V` | Open/close clipboard history |
| `↑` / `↓` | Navigate items |
| `Enter` | Paste selected item |
| `Escape` | Close window |
| `Delete` (⌫) | Delete selected item (configurable) |

### Settings

Right-click the menu bar icon to access settings:

- **History Size** - Choose from 10, 25, 50, 100, 200, 500, or 1000 items
- **Delete Key** - Use Delete (⌫) or Fn+Delete to remove items
- **Keyboard Shortcut** - Customize the global shortcut
- **Clear History** - Remove all saved clipboard items

## Requirements

- macOS 11.0 (Big Sur) or later
- Apple Silicon (ARM64) Mac

## Tech Stack

- [Electron](https://www.electronjs.org/) - Desktop application framework
- [electron-store](https://github.com/sindresorhus/electron-store) - Persistent storage
- AppleScript - macOS integration for paste functionality

## Architecture

```text
Main Process (main.js)
├── Clipboard monitoring (500ms polling)
├── Global shortcut registration
├── Window management
├── Tray menu
└── IPC handlers

Renderer Process (renderer.js)
├── Search and filtering
├── Keyboard navigation
└── UI updates

Preload Scripts
├── preload.js - Main window API bridge
└── shortcut-preload.js - Settings window API bridge
```

## FAQ

<details>
<summary><strong>What happens when the history reaches the limit?</strong></summary>

> The oldest items are automatically removed to make room for new ones. New copies are added to the top, and when the limit is exceeded, the oldest entry at the bottom is discarded.
</details>

<details>
<summary><strong>Where is my clipboard data stored?</strong></summary>

> Data is stored locally in `~/Library/Application Support/clipboard-manager/` using electron-store. Your clipboard history persists between app restarts.
</details>

<details>
<summary><strong>Does it support images or files?</strong></summary>

> Currently, only text content is supported. Images, files, and other non-text clipboard content are not captured.
</details>

<details>
<summary><strong>How often does it check the clipboard?</strong></summary>

> The app polls the clipboard every 500 milliseconds (0.5 seconds) for changes.
</details>

<details>
<summary><strong>What happens if I copy the same text twice?</strong></summary>

> Duplicate entries are not added. If the text already exists in your history, it won't create a new entry.
</details>

<details>
<summary><strong>Does it work in fullscreen applications?</strong></summary>

> Yes, the clipboard history window appears on all workspaces and desktops, including fullscreen apps.
</details>

<details>
<summary><strong>How do I change the keyboard shortcut?</strong></summary>

> Right-click the menu bar icon and select "Change Shortcut...". Press your desired key combination (must include a modifier key like Cmd, Ctrl, or Option).
</details>

<details>
<summary><strong>Why isn't the Delete key working?</strong></summary>

> On Mac, the Delete key (⌫) sends a "Backspace" event. Make sure "Delete (⌫)" is selected in Settings > Delete Key. If you want to use Fn+Delete instead, select that option.
</details>

## Privacy

- All clipboard data is stored locally on your machine
- No data is sent to external servers
- History is stored in plain text in the app's data directory

## License

MIT
