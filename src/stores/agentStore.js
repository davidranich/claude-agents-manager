import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAgentStore = defineStore('agent', () => {
  // State
  const currentDirectory = ref(null);
  const files = ref([]);
  const selectedFile = ref(null);
  const fileContent = ref('');
  const originalFileContent = ref(''); // Track original content
  const hasUnsavedChanges = ref(false);

  // Getters
  const markdownFiles = computed(() => {
    return files.value.filter(file =>
      file.isFile && (file.name.endsWith('.md') || file.name.endsWith('.txt'))
    );
  });

  const directories = computed(() => {
    return files.value.filter(file => file.isDirectory);
  });

  const currentFileName = computed(() => {
    return selectedFile.value?.name || null;
  });

  const currentFilePath = computed(() => {
    return selectedFile.value?.path || null;
  });

  // Actions
  function setCurrentDirectory(dirPath) {
    currentDirectory.value = dirPath;
  }

  function setFiles(fileList) {
    files.value = fileList;
  }

  function selectFile(file) {
    if (hasUnsavedChanges.value) {
      // TODO: Add confirmation dialog
      const confirmDiscard = confirm('You have unsaved changes. Discard them?');
      if (!confirmDiscard) {
        return false;
      }
    }
    selectedFile.value = file;
    hasUnsavedChanges.value = false;
    return true;
  }

  function setFileContent(content) {
    fileContent.value = content;
    originalFileContent.value = content; // Store original
    hasUnsavedChanges.value = false;
  }

  function updateFileContent(content) {
    fileContent.value = content;
    // Check if content matches original
    hasUnsavedChanges.value = content !== originalFileContent.value;
  }

  function clearSelection() {
    selectedFile.value = null;
    fileContent.value = '';
    originalFileContent.value = '';
    hasUnsavedChanges.value = false;
  }

  function markAsSaved() {
    originalFileContent.value = fileContent.value; // Update original to current
    hasUnsavedChanges.value = false;
  }

  return {
    // State
    currentDirectory,
    files,
    selectedFile,
    fileContent,
    hasUnsavedChanges,
    // Getters
    markdownFiles,
    directories,
    currentFileName,
    currentFilePath,
    // Actions
    setCurrentDirectory,
    setFiles,
    selectFile,
    setFileContent,
    updateFileContent,
    clearSelection,
    markAsSaved
  };
});
