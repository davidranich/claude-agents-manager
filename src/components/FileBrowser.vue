<script setup>
import { ref, watch } from 'vue';
import { useAgentStore } from '@/stores/agentStore';
import { useElectronAPI } from '@/composables/useElectronAPI';
import NewFileDialog from './NewFileDialog.vue';

const agentStore = useAgentStore();
const { readDirectory, readFile, createFile, fileExists, deleteFile } = useElectronAPI();

const loading = ref(false);
const error = ref(null);
const showNewFileDialog = ref(false);

// Watch for directory changes and load files
watch(() => agentStore.currentDirectory, async (newDir) => {
  if (newDir) {
    await loadDirectoryContents(newDir);
  }
}, { immediate: true });

async function loadDirectoryContents(dirPath) {
  loading.value = true;
  error.value = null;
  try {
    const fileList = await readDirectory(dirPath);
    agentStore.setFiles(fileList);
  } catch (err) {
    error.value = 'Failed to load directory contents';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function handleFileClick(file) {
  if (file.isFile) {
    const canSelect = agentStore.selectFile(file);
    if (canSelect) {
      try {
        const content = await readFile(file.path);
        agentStore.setFileContent(content);
      } catch (err) {
        error.value = 'Failed to load file';
        console.error(err);
      }
    }
  }
}

function getFileIcon(file) {
  if (file.isDirectory) return 'folder';
  if (file.name.endsWith('.md')) return 'file-lines';
  if (file.name.endsWith('.txt')) return 'file';
  return 'file';
}

function isSelected(file) {
  return agentStore.selectedFile?.path === file.path;
}

async function handleCreateFile(fileName) {
  if (!agentStore.currentDirectory) {
    error.value = 'No directory selected';
    return;
  }

  const filePath = `${agentStore.currentDirectory}/${fileName}`;

  try {
    // Check if file already exists
    const exists = await fileExists(filePath);
    if (exists) {
      error.value = `File "${fileName}" already exists`;
      return;
    }

    // Create the file with a default template
    const defaultContent = `# ${fileName.replace(/\.(md|txt)$/, '')}\n\n`;
    await createFile(filePath, defaultContent);

    // Reload directory contents
    await loadDirectoryContents(agentStore.currentDirectory);

    // Select the newly created file
    const newFile = agentStore.files.find(f => f.path === filePath);
    if (newFile) {
      await handleFileClick(newFile);
    }

    showNewFileDialog.value = false;
  } catch (err) {
    error.value = 'Failed to create file';
    console.error(err);
  }
}

async function handleDeleteFile(file, event) {
  // Stop event propagation to prevent file selection
  event.stopPropagation();

  // Confirmation dialog
  const confirmed = confirm(`Are you sure you want to delete "${file.name}"?\n\nThis action cannot be undone.`);
  if (!confirmed) {
    return;
  }

  try {
    // Delete the file
    await deleteFile(file.path);

    // If the deleted file was selected, clear selection
    if (isSelected(file)) {
      agentStore.clearSelection();
    }

    // Reload directory contents
    await loadDirectoryContents(agentStore.currentDirectory);

    error.value = null;
  } catch (err) {
    error.value = 'Failed to delete file';
    console.error(err);
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="p-3 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-300">Agent Files</h3>
        <button
          v-if="agentStore.currentDirectory"
          @click="showNewFileDialog = true"
          class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
          title="Create new agent file"
        >
          <font-awesome-icon icon="plus" />
          New
        </button>
      </div>
      <div v-if="agentStore.currentDirectory" class="text-xs text-gray-600 dark:text-gray-500 break-all">
        {{ agentStore.currentDirectory }}
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Loading state -->
      <div v-if="loading" class="p-4 text-center text-gray-600 dark:text-gray-500">
        <div class="animate-pulse">Loading files...</div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="p-4 text-center text-red-500 dark:text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Empty state -->
      <div v-else-if="agentStore.markdownFiles.length === 0" class="p-4 text-center text-gray-600 dark:text-gray-500 text-sm">
        <div class="mb-2">
          <font-awesome-icon icon="folder" size="2x" />
        </div>
        <div>No agent files found</div>
        <div class="text-xs mt-1">Looking for .md or .txt files</div>
      </div>

      <!-- File list -->
      <div v-else class="py-2">
        <div
          v-for="file in agentStore.markdownFiles"
          :key="file.path"
          class="relative group"
        >
          <button
            @click="handleFileClick(file)"
            class="w-full px-4 py-2.5 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            :class="{
              'bg-gray-200 dark:bg-gray-700 border-l-2 border-blue-500': isSelected(file),
              'border-l-2 border-transparent': !isSelected(file)
            }"
          >
            <font-awesome-icon :icon="getFileIcon(file)" class="text-gray-500 dark:text-gray-400" />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-800 dark:text-gray-200 truncate">
                {{ file.name }}
              </div>
            </div>
            <div
              v-if="isSelected(file) && agentStore.hasUnsavedChanges"
              class="w-2 h-2 rounded-full bg-yellow-500"
              title="Unsaved changes"
            ></div>
          </button>
          <!-- Delete button (appears on hover) -->
          <button
            @click="(e) => handleDeleteFile(file, e)"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-opacity"
            title="Delete file"
          >
            <font-awesome-icon icon="trash" class="text-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- File count -->
    <div
      v-if="agentStore.markdownFiles.length > 0"
      class="p-3 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-500"
    >
      {{ agentStore.markdownFiles.length }} agent file{{ agentStore.markdownFiles.length !== 1 ? 's' : '' }}
    </div>

    <!-- New File Dialog -->
    <NewFileDialog
      :show="showNewFileDialog"
      @close="showNewFileDialog = false"
      @create="handleCreateFile"
    />
  </div>
</template>
