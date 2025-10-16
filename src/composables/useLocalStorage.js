export function useLocalStorage() {
  const STORAGE_KEYS = {
    LAST_DIRECTORY: 'claudeAgentsManager_lastDirectory'
  };

  const saveLastDirectory = (dirPath) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_DIRECTORY, dirPath);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  };

  const getLastDirectory = () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_DIRECTORY);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  };

  const clearLastDirectory = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.LAST_DIRECTORY);
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  };

  return {
    saveLastDirectory,
    getLastDirectory,
    clearLastDirectory
  };
}
