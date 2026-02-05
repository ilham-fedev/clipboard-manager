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

## Privacy

- All clipboard data is stored locally on your machine
- No data is sent to external servers
- History is stored in plain text in the app's data directory

## License

MIT
