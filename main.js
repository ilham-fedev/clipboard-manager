const {
  app,
  BrowserWindow,
  globalShortcut,
  clipboard,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  screen,
  shell
} = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize store for persistence
const store = new Store({
  defaults: {
    clipboardHistory: [],
    settings: {
      maxHistorySize: 50,
      deleteKey: 'Backspace', // Mac: 'Backspace' = Delete key (⌫), 'Delete' = Fn+Delete
      pasteShortcut: 'CommandOrControl+Shift+V'
    }
  }
});

let mainWindow = null;
let shortcutWindow = null;
let tray = null;
let clipboardHistory = store.get('clipboardHistory') || [];
let lastClipboardContent = '';
let clipboardWatcher = null;
let previousApp = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Make window appear on all Spaces/Desktops
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Hide window when it loses focus
  mainWindow.on('blur', () => {
    hideWindow();
  });

  // Center window on screen
  mainWindow.on('ready-to-show', () => {
    const windowBounds = mainWindow.getBounds();
    const x = Math.round((width - windowBounds.width) / 2);
    const y = Math.round((height - windowBounds.height) / 3);
    mainWindow.setPosition(x, y);
  });
}

function showWindow() {
  if (mainWindow) {
    // Store the frontmost app before showing our window
    const { execSync } = require('child_process');
    try {
      // Get both process name and bundle identifier
      const result = execSync(`osascript -e '
        tell application "System Events"
          set frontApp to first process whose frontmost is true
          set appName to name of frontApp
          set bundleId to bundle identifier of frontApp
        end tell
        return appName & "|" & bundleId
      '`).toString().trim();

      const [processName, bundleId] = result.split('|');

      // Map Electron-based apps to their actual names using bundle identifier
      if (processName === 'Electron' && bundleId) {
        if (bundleId.includes('vscode') || bundleId.includes('VSCode')) {
          previousApp = 'Visual Studio Code';
        } else if (bundleId.includes('claude')) {
          previousApp = 'Claude';
        } else {
          previousApp = processName;
        }
      } else {
        previousApp = processName;
      }
    } catch (e) {
      previousApp = null;
    }

    // Get display where cursor is located
    const cursorPoint = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
    const { width, height, x, y } = currentDisplay.workArea;

    // Calculate center position on the current display
    const winWidth = 500;
    const winHeight = 400;
    const newX = Math.round(x + (width - winWidth) / 2);
    const newY = Math.round(y + (height - winHeight) / 3);

    // Set position first, then show
    mainWindow.setPosition(newX, newY);

    mainWindow.webContents.send('update-history', clipboardHistory);
    mainWindow.webContents.send('update-settings', store.get('settings'));
    mainWindow.show();
    mainWindow.focus();
  }
}

function hideWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
    // Also hide the app to return focus to previous app
    app.hide();
  }
}

function showShortcutWindow() {
  if (shortcutWindow) {
    shortcutWindow.focus();
    return;
  }

  // Unregister all shortcuts while recording
  globalShortcut.unregisterAll();

  shortcutWindow = new BrowserWindow({
    width: 350,
    height: 220,
    show: false,
    frame: true,
    titleBarStyle: 'hidden',
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'shortcut-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  shortcutWindow.loadFile('shortcut.html');

  shortcutWindow.once('ready-to-show', () => {
    shortcutWindow.center();
    shortcutWindow.show();
    shortcutWindow.focus();
  });

  shortcutWindow.on('closed', () => {
    shortcutWindow = null;
    // Re-register shortcuts when window closes
    registerShortcuts();
  });
}

function createTray() {
  // Create a 16x16 clipboard icon as base64 PNG
  const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEbSURBVDiNpZMxS8NAGIbfu0ug4FAHwcVJcHMQN0EQ/AEODv4A/4Gbm5uTi4ubf8DFxUXo4qCDi4ODIAiCQ0GQDg4WxCGJ13yXXC45Ey94uPfuee++XAKZpqELcqAEfCAC7oA3YAD0gb5r2BWv6HlEQB94AFaBNWAFmK21FcmhewTcAufAJbAFDIB1YGStzSb8D2CslLoC9oEjoAscz8WIAS8t7GlS7pu0gWtgG9gAFoGvWCPwC4xaWNcVJ3QKXABbwBKwAHxba6Op2VNgH4gngClwAmxrree9m1rXgLMsS8/FBrCitZ6s4BfOOB54BY6BnSkyN3YOnGitVzMJhv8A/wXiObH+A4B/ArFE5oH4z0BU9TdKF2Lhfzz+CQAAAABJRU5ErkJggg==';

  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${iconBase64}`);
  icon.setTemplateImage(true); // Makes it adapt to light/dark menu bar

  tray = new Tray(icon);

  // Also set title as fallback (shows text next to icon)
  tray.setTitle('📋');

  updateTrayMenu();

  tray.setToolTip('Clipboard Manager');
}

function updateTrayMenu() {
  const settings = store.get('settings');

  // Format shortcut for display
  const displayShortcut = settings.pasteShortcut
    .replace('CommandOrControl', 'Cmd')
    .replace('+', '+');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Open Clipboard (${displayShortcut})`,
      click: () => showWindow()
    },
    { type: 'separator' },
    {
      label: 'Change Shortcut...',
      click: () => showShortcutWindow()
    },
    {
      label: 'History Size',
      submenu: [10, 25, 50, 100, 200, 500, 1000].map(size => ({
        label: `${size} items`,
        type: 'radio',
        checked: settings.maxHistorySize === size,
        click: () => {
          settings.maxHistorySize = size;
          store.set('settings', settings);
          trimHistory();
        }
      }))
    },
    {
      label: 'Delete Key',
      submenu: [
        {
          label: 'Delete (⌫)',
          type: 'radio',
          checked: settings.deleteKey === 'Backspace',
          click: () => {
            settings.deleteKey = 'Backspace';
            store.set('settings', settings);
          }
        },
        {
          label: 'Fn+Delete',
          type: 'radio',
          checked: settings.deleteKey === 'Delete',
          click: () => {
            settings.deleteKey = 'Delete';
            store.set('settings', settings);
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Clear History',
      click: () => {
        clipboardHistory = [];
        store.set('clipboardHistory', clipboardHistory);
      }
    },
    { type: 'separator' },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Contact',
          click: () => shell.openExternal('mailto:ilham.hady@gmail.com')
        },
        {
          label: 'GitHub',
          click: () => shell.openExternal('https://github.com/ilham-fedev')
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function trimHistory() {
  const maxSize = store.get('settings.maxHistorySize');
  if (clipboardHistory.length > maxSize) {
    clipboardHistory = clipboardHistory.slice(0, maxSize);
    store.set('clipboardHistory', clipboardHistory);
  }
}

function startClipboardWatcher() {
  // Initialize with current clipboard content
  lastClipboardContent = clipboard.readText();

  clipboardWatcher = setInterval(() => {
    const currentContent = clipboard.readText();

    // Check if content changed and is not empty
    if (currentContent && currentContent !== lastClipboardContent) {
      lastClipboardContent = currentContent;

      // Check for duplicates in history
      const isDuplicate = clipboardHistory.some(item => item.content === currentContent);

      if (!isDuplicate) {
        // Add to beginning of history
        clipboardHistory.unshift({
          id: Date.now(),
          content: currentContent,
          timestamp: new Date().toISOString()
        });

        // Trim history if needed
        trimHistory();

        // Save to store
        store.set('clipboardHistory', clipboardHistory);
      }
    }
  }, 500);
}

function registerShortcuts() {
  const settings = store.get('settings');

  // Unregister all shortcuts first
  globalShortcut.unregisterAll();

  // Register paste shortcut
  const registered = globalShortcut.register(settings.pasteShortcut, () => {
    if (mainWindow.isVisible()) {
      hideWindow();
    } else {
      showWindow();
    }
  });

  if (!registered) {
    console.error('Failed to register shortcut:', settings.pasteShortcut);
  }
}

// IPC Handlers
ipcMain.handle('get-history', () => {
  return clipboardHistory;
});

ipcMain.handle('get-settings', () => {
  return store.get('settings');
});

ipcMain.handle('paste-item', async (event, content) => {
  // Write to clipboard
  clipboard.writeText(content);
  lastClipboardContent = content;

  // Store the app to return to before hiding
  const targetApp = previousApp;

  // Hide window first
  mainWindow.hide();

  // Simulate Cmd+V using AppleScript (macOS)
  const { exec } = require('child_process');

  return new Promise((resolve) => {
    // Build AppleScript to activate previous app and paste
    let script;
    if (targetApp) {
      // Activate the previous app, wait for it to be ready, then paste
      script = `osascript -e '
        tell application "${targetApp}" to activate
        delay 0.2
        tell application "System Events"
          keystroke "v" using command down
        end tell
      '`;
    } else {
      // Fallback: just try to paste
      script = `osascript -e '
        delay 0.2
        tell application "System Events"
          keystroke "v" using command down
        end tell
      '`;
    }

    exec(script, (error) => {
      if (error) {
        console.error('Paste simulation failed:', error);
      }
      resolve(true);
    });
  });
});

ipcMain.handle('delete-item', (event, id) => {
  clipboardHistory = clipboardHistory.filter(item => item.id !== id);
  store.set('clipboardHistory', clipboardHistory);
  return clipboardHistory;
});

ipcMain.handle('close-window', () => {
  hideWindow();
});

// Shortcut window IPC handlers
ipcMain.handle('get-current-shortcut', () => {
  return store.get('settings.pasteShortcut');
});

ipcMain.handle('save-shortcut', (event, accelerator) => {
  try {
    // Test if the shortcut can be registered
    globalShortcut.unregisterAll();
    const success = globalShortcut.register(accelerator, () => {});

    if (success) {
      // Save the new shortcut
      const settings = store.get('settings');
      settings.pasteShortcut = accelerator;
      store.set('settings', settings);

      // Re-register with proper handler
      registerShortcuts();
      updateTrayMenu();

      return { success: true };
    } else {
      // Restore old shortcut
      registerShortcuts();
      return { success: false, error: 'Shortcut is already in use' };
    }
  } catch (err) {
    registerShortcuts();
    return { success: false, error: err.message };
  }
});

ipcMain.handle('close-shortcut-window', () => {
  if (shortcutWindow) {
    shortcutWindow.close();
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();
  startClipboardWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Clear clipboard watcher
  if (clipboardWatcher) {
    clearInterval(clipboardWatcher);
  }

  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Hide dock icon (runs as menu bar app)
app.dock?.hide();
