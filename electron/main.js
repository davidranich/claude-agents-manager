const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;

// Terminal sessions storage
const terminals = {};

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Create the browser window with security best practices
  mainWindow = new BrowserWindow({
    width: 2300,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, '../public/images/claude-agents-manager-guy.png'),
    webPreferences: {
      // Security: Enable context isolation
      contextIsolation: true,
      // Security: Disable node integration in renderer
      nodeIntegration: false,
      // Security: Disable remote module
      enableRemoteModule: false,
      // Preload script for secure IPC
      preload: path.join(__dirname, 'preload.js'),
      // Enable web security
      webSecurity: true,
      // Disable eval
      sandbox: true
    },
    show: false,
    backgroundColor: '#1f2937'
  });

  // Set Content Security Policy to allow data URIs for images
  // Must be set before loading the page
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*"
            : "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'"
        ]
      }
    });
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS apps stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// IPC Handlers - Secure API for renderer
// ============================================

// Recursive function to read directory tree
async function readDirectoryTree(dirPath, basePath = dirPath) {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const result = [];

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      const relativePath = path.relative(basePath, fullPath);

      const fileInfo = {
        name: file.name,
        path: fullPath,
        relativePath: relativePath,
        isDirectory: file.isDirectory(),
        isFile: file.isFile()
      };

      if (file.isDirectory()) {
        // Recursively read subdirectories
        fileInfo.children = await readDirectoryTree(fullPath, basePath);
      }

      result.push(fileInfo);
    }

    return result;
  } catch (error) {
    console.error('Error reading directory tree:', error);
    return [];
  }
}

// Get directory contents (flat list - for backwards compatibility)
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      path: path.join(dirPath, file.name),
      isDirectory: file.isDirectory(),
      isFile: file.isFile()
    }));
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
});

// Get directory contents (tree structure)
ipcMain.handle('read-directory-tree', async (event, dirPath) => {
  try {
    return await readDirectoryTree(dirPath);
  } catch (error) {
    console.error('Error reading directory tree:', error);
    throw error;
  }
});

// Read file contents
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

// Write file contents
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});

// Select directory dialog
ipcMain.handle('select-directory', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Get app path
ipcMain.handle('get-app-path', () => {
  return app.getPath('home');
});

// Create new file
ipcMain.handle('create-file', async (event, filePath, content = '') => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
});

// Check if file exists
ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
});

// Delete file
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
});

// Create new directory
ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: false });
    return { success: true, path: dirPath };
  } catch (error) {
    console.error('Error creating directory:', error);
    throw error;
  }
});

// Delete directory (recursively)
ipcMain.handle('delete-directory', async (event, dirPath) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    console.error('Error deleting directory:', error);
    throw error;
  }
});

// Check if directory exists
ipcMain.handle('directory-exists', async (event, dirPath) => {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
});

// Rename file or directory
ipcMain.handle('rename-item', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true, newPath: newPath };
  } catch (error) {
    console.error('Error renaming item:', error);
    throw error;
  }
});

// ============================================
// Claude Code Integration - External Terminal
// ============================================

// Launch Claude Code in external terminal
ipcMain.handle('launch-claude-code-external', async (event, filePath, cwd, terminalType = 'terminal') => {
  try {
    const platform = os.platform();

    // Build the command - with or without file path
    const claudeCmd = filePath ? `claude \\"${filePath}\\"` : 'claude';

    if (platform === 'darwin') {
      // macOS - support different terminals
      let script;

      if (terminalType === 'iterm') {
        // iTerm2
        script = `tell application "iTerm"
          activate
          tell current window
            create tab with default profile
            tell current session
              write text "cd \\"${cwd}\\" && ${claudeCmd}"
            end tell
          end tell
        end tell`;
      } else {
        // Terminal.app (default)
        script = `tell application "Terminal"
          activate
          do script "cd \\"${cwd}\\" && ${claudeCmd}"
        end tell`;
      }

      spawn('osascript', ['-e', script]);
      return { success: true };
    } else if (platform === 'win32') {
      // Windows - use cmd
      const winClaudeCmd = filePath ? `claude "${filePath}"` : 'claude';
      spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `cd /d "${cwd}" && ${winClaudeCmd}`]);
      return { success: true };
    } else {
      // Linux - try common terminal emulators
      const terminals = ['gnome-terminal', 'konsole', 'xterm'];
      const linuxClaudeCmd = filePath ? `claude "${filePath}"` : 'claude';

      for (const term of terminals) {
        try {
          if (term === 'gnome-terminal') {
            spawn(term, ['--', 'bash', '-c', `cd "${cwd}" && ${linuxClaudeCmd}; exec bash`]);
          } else if (term === 'konsole') {
            spawn(term, ['-e', 'bash', '-c', `cd "${cwd}" && ${linuxClaudeCmd}; exec bash`]);
          } else {
            spawn(term, ['-e', 'bash', '-c', `cd "${cwd}" && ${linuxClaudeCmd}; exec bash`]);
          }
          return { success: true };
        } catch (err) {
          continue;
        }
      }

      throw new Error('No suitable terminal emulator found');
    }
  } catch (error) {
    console.error('Error launching Claude Code:', error);
    return { success: false, error: error.message };
  }
});
