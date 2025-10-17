const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  readDirectoryTree: (dirPath) => ipcRenderer.invoke('read-directory-tree', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  createFile: (filePath, content) => ipcRenderer.invoke('create-file', filePath, content),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),

  // Directory operations
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  deleteDirectory: (dirPath) => ipcRenderer.invoke('delete-directory', dirPath),
  directoryExists: (dirPath) => ipcRenderer.invoke('directory-exists', dirPath),

  // Rename operations
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('rename-item', oldPath, newPath),

  // Dialog operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // App information
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Claude Code integration
  launchClaudeCodeExternal: (filePath, cwd, terminalType) => ipcRenderer.invoke('launch-claude-code-external', filePath, cwd, terminalType),

  // Platform information
  platform: process.platform
});
