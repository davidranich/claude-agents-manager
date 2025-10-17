import { ref } from 'vue';

export function useElectronAPI() {
  const loading = ref(false);
  const error = ref(null);

  const readDirectory = async (dirPath) => {
    loading.value = true;
    error.value = null;
    try {
      const files = await window.electronAPI.readDirectory(dirPath);
      return files;
    } catch (err) {
      error.value = err.message;
      console.error('Error reading directory:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const readDirectoryTree = async (dirPath) => {
    loading.value = true;
    error.value = null;
    try {
      const tree = await window.electronAPI.readDirectoryTree(dirPath);
      return tree;
    } catch (err) {
      error.value = err.message;
      console.error('Error reading directory tree:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const readFile = async (filePath) => {
    loading.value = true;
    error.value = null;
    try {
      const content = await window.electronAPI.readFile(filePath);
      return content;
    } catch (err) {
      error.value = err.message;
      console.error('Error reading file:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const writeFile = async (filePath, content) => {
    loading.value = true;
    error.value = null;
    try {
      await window.electronAPI.writeFile(filePath, content);
      return true;
    } catch (err) {
      error.value = err.message;
      console.error('Error writing file:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const selectDirectory = async () => {
    try {
      const dirPath = await window.electronAPI.selectDirectory();
      return dirPath;
    } catch (err) {
      error.value = err.message;
      console.error('Error selecting directory:', err);
      throw err;
    }
  };

  const getAppPath = async () => {
    try {
      const path = await window.electronAPI.getAppPath();
      return path;
    } catch (err) {
      error.value = err.message;
      console.error('Error getting app path:', err);
      throw err;
    }
  };

  const createFile = async (filePath, content = '') => {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI.createFile(filePath, content);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating file:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fileExists = async (filePath) => {
    try {
      const exists = await window.electronAPI.fileExists(filePath);
      return exists;
    } catch (err) {
      error.value = err.message;
      console.error('Error checking file existence:', err);
      throw err;
    }
  };

  const deleteFile = async (filePath) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI.deleteFile(filePath);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting file:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createDirectory = async (dirPath) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI.createDirectory(dirPath);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error creating directory:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteDirectory = async (dirPath) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI.deleteDirectory(dirPath);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error deleting directory:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const directoryExists = async (dirPath) => {
    try {
      const exists = await window.electronAPI.directoryExists(dirPath);
      return exists;
    } catch (err) {
      error.value = err.message;
      console.error('Error checking directory existence:', err);
      throw err;
    }
  };

  const renameItem = async (oldPath, newPath) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await window.electronAPI.renameItem(oldPath, newPath);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('Error renaming item:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    readDirectory,
    readDirectoryTree,
    readFile,
    writeFile,
    selectDirectory,
    getAppPath,
    createFile,
    fileExists,
    deleteFile,
    createDirectory,
    deleteDirectory,
    directoryExists,
    renameItem
  };
}
