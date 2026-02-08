# Changelog

All notable changes to Clipboard Manager will be documented in this file.

## [1.1.1] - 2026-02-08

### Added
- **Custom App Icon** - Replace default Electron icon with a proper clipboard manager icon

### Fixed
- Clipboard window now correctly appears on the current desktop when switching between spaces

## [1.1.0] - 2026-02-07

### Added
- **Launch at Login** - Toggle auto-start on macOS login from the tray menu
- **Pin/Favorite Items** - Pin frequently used snippets to the top of the list with the pin button or `P` key. Pinned items are never trimmed by the history limit
- **Move Duplicate to Top** - Re-copying text that already exists in history moves it to the top with a fresh timestamp instead of silently ignoring it

### Changed
- Pin and delete buttons are now grouped in an aligned action container on each item
- Footer hints now include `P` for pin
- Updated FAQ to reflect new duplicate behavior

## [1.0.0] - Initial Release

### Added
- Clipboard history with automatic text monitoring (500ms polling)
- Global keyboard shortcut `Cmd+Shift+V` (customizable)
- Real-time search filtering
- Quick paste with automatic return to previous app
- Keyboard navigation (arrow keys, Enter, Escape)
- Menu bar app with tray icon
- Configurable history size (10, 25, 50, 100, 200, 500, 1000 items)
- Configurable delete key (Delete or Fn+Delete)
- Custom keyboard shortcut via settings window
- Light and dark mode support (follows macOS system appearance)
- Help menu with Contact and GitHub links
- Persistent storage via electron-store
- macOS ARM64 build (DMG + ZIP)
