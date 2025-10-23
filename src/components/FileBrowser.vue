<script setup>
import { ref, watch, computed, provide } from 'vue';
import { useAgentStore } from '@/stores/agentStore';
import { useElectronAPI } from '@/composables/useElectronAPI';
import NewFileDialog from './NewFileDialog.vue';
import NewFolderDialog from './NewFolderDialog.vue';
import RenameDialog from './RenameDialog.vue';
import TreeItem from './TreeItem.vue';

const agentStore = useAgentStore();
const { readDirectoryTree, readFile, createFile, fileExists, deleteFile, createDirectory, directoryExists, deleteDirectory, renameItem } = useElectronAPI();

const loading = ref(false);
const error = ref(null);
const showNewFileDialog = ref(false);
const showNewFolderDialog = ref(false);
const showRenameDialog = ref(false);
const itemToRename = ref(null);
const fileTree = ref([]);
const expandedDirs = ref(new Set());
const isRootDropTarget = ref(false);

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
    const tree = await readDirectoryTree(dirPath);
    fileTree.value = tree;
    // Still set files in store for compatibility
    const flatFiles = flattenTree(tree);
    agentStore.setFiles(flatFiles);
  } catch (err) {
    error.value = 'Failed to load directory contents';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

// Flatten tree for backward compatibility
function flattenTree(tree) {
  const result = [];
  for (const item of tree) {
    result.push(item);
    if (item.children) {
      result.push(...flattenTree(item.children));
    }
  }
  return result;
}

// Toggle directory expansion
function toggleDirectory(dirPath) {
  if (expandedDirs.value.has(dirPath)) {
    expandedDirs.value.delete(dirPath);
  } else {
    expandedDirs.value.add(dirPath);
  }
  // Force reactivity
  expandedDirs.value = new Set(expandedDirs.value);
}

function isExpanded(dirPath) {
  return expandedDirs.value.has(dirPath);
}

async function handleItemClick(item) {
  if (item.isDirectory) {
    toggleDirectory(item.path);
  } else if (item.isFile) {
    const canSelect = agentStore.selectFile(item);
    if (canSelect) {
      try {
        const content = await readFile(item.path);
        agentStore.setFileContent(content);
      } catch (err) {
        error.value = 'Failed to load file';
        console.error(err);
      }
    }
  }
}

// Check if file/folder should be shown (markdown/txt files or directories)
function shouldShowItem(item) {
  if (item.isDirectory) return true;
  if (item.isFile) {
    return item.name.endsWith('.md') || item.name.endsWith('.txt');
  }
  return false;
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

// Provide tree state functions to TreeItem components
provide('isExpanded', isExpanded);
provide('isSelected', isSelected);
provide('shouldShowItem', shouldShowItem);
provide('agentStore', agentStore);

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
      await handleItemClick(newFile);
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

async function handleCreateFolder(folderName) {
  if (!agentStore.currentDirectory) {
    error.value = 'No directory selected';
    return;
  }

  const folderPath = `${agentStore.currentDirectory}/${folderName}`;

  try {
    // Check if folder already exists
    const exists = await directoryExists(folderPath);
    if (exists) {
      error.value = `Folder "${folderName}" already exists`;
      return;
    }

    // Create the folder
    await createDirectory(folderPath);

    // Reload directory contents
    await loadDirectoryContents(agentStore.currentDirectory);

    showNewFolderDialog.value = false;
    error.value = null;
  } catch (err) {
    error.value = 'Failed to create folder';
    console.error(err);
  }
}

async function handleDeleteFolder(folder, event) {
  // Stop event propagation to prevent folder toggle
  event.stopPropagation();

  // Confirmation dialog with stronger warning
  const confirmed = confirm(
    `Are you sure you want to delete the folder "${folder.name}" and ALL its contents?\n\nThis will permanently delete all files and subfolders inside "${folder.name}".\n\nThis action cannot be undone.`
  );
  if (!confirmed) {
    return;
  }

  try {
    // Delete the folder recursively
    await deleteDirectory(folder.path);

    // If a file in the deleted folder was selected, clear selection
    if (agentStore.selectedFile && agentStore.selectedFile.path.startsWith(folder.path)) {
      agentStore.clearSelection();
    }

    // Reload directory contents
    await loadDirectoryContents(agentStore.currentDirectory);

    error.value = null;
  } catch (err) {
    error.value = 'Failed to delete folder';
    console.error(err);
  }
}

// Unified delete handler that dispatches to file or folder delete
function handleDeleteItem(item, event) {
  if (item.isDirectory) {
    handleDeleteFolder(item, event);
  } else {
    handleDeleteFile(item, event);
  }
}

// Handle rename button click
function handleRenameItem(item, event) {
  // Stop event propagation to prevent file selection or folder toggle
  event.stopPropagation();

  itemToRename.value = item;
  showRenameDialog.value = true;
}

// Handle rename confirmation from dialog
async function handleRenameConfirm(newName) {
  if (!itemToRename.value) return;

  const item = itemToRename.value;
  const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
  const newPath = `${parentPath}/${newName}`;

  try {
    // Perform the rename
    await renameItem(item.path, newPath);

    // If the renamed item was the selected file, update the selection
    if (agentStore.selectedFile && agentStore.selectedFile.path === item.path) {
      agentStore.selectedFile.path = newPath;
      agentStore.selectedFile.name = newName;
    }

    // Reload directory contents
    await loadDirectoryContents(agentStore.currentDirectory);

    // Close dialog and clear state
    showRenameDialog.value = false;
    itemToRename.value = null;
    error.value = null;
  } catch (err) {
    error.value = `Failed to rename ${item.isDirectory ? 'folder' : 'file'}`;
    console.error(err);
  }
}

// Handle drag and drop move operation
async function handleMoveItem(data) {
  const { source, destination } = data;

  // Construct the new path
  const newPath = `${destination.path}/${source.name}`;

  try {
    // Perform the move (using rename API)
    await renameItem(source.path, newPath);

    // If the moved item was the selected file, update the selection
    if (agentStore.selectedFile && agentStore.selectedFile.path === source.path) {
      agentStore.selectedFile.path = newPath;
    }

    // Reload directory contents
    await loadDirectoryContents(agentStore.currentDirectory);

    error.value = null;
  } catch (err) {
    error.value = `Failed to move ${source.isDirectory ? 'folder' : 'file'}`;
    console.error(err);
  }
}

// Handle drag over the root/current directory area
function handleRootDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleRootDragEnter(event) {
  event.preventDefault();
  isRootDropTarget.value = true;
}

function handleRootDragLeave(event) {
  // Only set to false if leaving the container entirely
  if (event.target.classList.contains('file-browser-drop-zone')) {
    isRootDropTarget.value = false;
  }
}

async function handleRootDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  isRootDropTarget.value = false;

  try {
    const draggedData = JSON.parse(event.dataTransfer.getData('text/plain'));

    // Get the parent directory of the dragged item
    const sourceParent = draggedData.path.substring(0, draggedData.path.lastIndexOf('/'));

    // Don't move if already in the current directory
    if (sourceParent === agentStore.currentDirectory) {
      return;
    }

    // Construct the new path in the current directory
    const newPath = `${agentStore.currentDirectory}/${draggedData.name}`;

    // Perform the move
    await renameItem(draggedData.path, newPath);

    // If the moved item was the selected file, update the selection
    if (agentStore.selectedFile && agentStore.selectedFile.path === draggedData.path) {
      agentStore.selectedFile.path = newPath;
    }

    // Reload directory contents
    await loadDirectoryContents(agentStore.currentDirectory);

    error.value = null;
  } catch (err) {
    error.value = 'Failed to move item';
    console.error(err);
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="p-3 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-300">Agent Files</h3>
        <div v-if="agentStore.currentDirectory" class="flex gap-2">
          <button
            @click="showNewFolderDialog = true"
            class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
            title="Create new folder"
          >
            <font-awesome-icon icon="folder" />
            Folder
          </button>
          <button
            @click="showNewFileDialog = true"
            class="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
            title="Create new agent file"
          >
            <font-awesome-icon icon="plus" />
            File
          </button>
        </div>
      </div>
      <div v-if="agentStore.currentDirectory" class="text-xs text-gray-600 dark:text-gray-500 break-all">
        {{ agentStore.currentDirectory }}
      </div>
    </div>

    <div
      class="flex-1 overflow-y-auto file-browser-drop-zone transition-colors"
      :class="{ 'bg-blue-50 dark:bg-blue-950': isRootDropTarget }"
      @dragover="handleRootDragOver"
      @dragenter="handleRootDragEnter"
      @dragleave="handleRootDragLeave"
      @drop="handleRootDrop"
    >
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

      <!-- File tree -->
      <div v-else class="py-2">
        <TreeItem
          v-for="item in fileTree"
          :key="item.path"
          :item="item"
          :level="0"
          @click="handleItemClick"
          @delete="handleDeleteItem"
          @rename="handleRenameItem"
          @move="handleMoveItem"
        />
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

    <!-- New Folder Dialog -->
    <NewFolderDialog
      :show="showNewFolderDialog"
      @close="showNewFolderDialog = false"
      @create="handleCreateFolder"
    />

    <!-- Rename Dialog -->
    <RenameDialog
      :show="showRenameDialog"
      :currentName="itemToRename?.name"
      :isDirectory="itemToRename?.isDirectory"
      @close="showRenameDialog = false; itemToRename = null"
      @rename="handleRenameConfirm"
    />
  </div>
</template>
