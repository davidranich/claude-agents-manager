<script setup>
import { inject, ref } from 'vue';

const props = defineProps({
  item: Object,
  level: Number
});

const emit = defineEmits(['click', 'delete', 'rename', 'move']);

// Inject the tree state functions from FileBrowser
const isExpanded = inject('isExpanded');
const isSelected = inject('isSelected');
const shouldShowItem = inject('shouldShowItem');
const agentStore = inject('agentStore');

// Drag and drop state
const isDragging = ref(false);
const isDropTarget = ref(false);

function handleClick() {
  emit('click', props.item);
}

function handleDelete(event) {
  emit('delete', props.item, event);
}

function handleRename(event) {
  emit('rename', props.item, event);
}

function getFileIcon(item) {
  if (item.isDirectory) {
    return isExpanded(item.path) ? 'folder-open' : 'folder';
  }
  if (item.name.endsWith('.md')) return 'file-lines';
  if (item.name.endsWith('.txt')) return 'file';
  return 'file';
}

// Drag and drop handlers
function handleDragStart(event) {
  isDragging.value = true;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', JSON.stringify({
    path: props.item.path,
    name: props.item.name,
    isDirectory: props.item.isDirectory
  }));
}

function handleDragEnd() {
  isDragging.value = false;
}

function handleDragOver(event) {
  // Only allow dropping on directories
  if (!props.item.isDirectory) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
  // Only allow dropping on directories
  if (!props.item.isDirectory) return;

  event.preventDefault();
  isDropTarget.value = true;
}

function handleDragLeave() {
  isDropTarget.value = false;
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  isDropTarget.value = false;

  // Only allow dropping on directories
  if (!props.item.isDirectory) return;

  try {
    const draggedData = JSON.parse(event.dataTransfer.getData('text/plain'));

    // Don't allow dropping on itself
    if (draggedData.path === props.item.path) return;

    // Don't allow dropping a parent into its own child
    if (props.item.path.startsWith(draggedData.path + '/')) return;

    // Emit move event with source and destination
    emit('move', {
      source: draggedData,
      destination: props.item
    });
  } catch (err) {
    console.error('Error handling drop:', err);
  }
}
</script>

<template>
  <div v-if="shouldShowItem(item)">
    <div class="relative group">
      <button
        draggable="true"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="handleClick"
        class="w-full py-2.5 pr-20 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        :class="{
          'bg-gray-200 dark:bg-gray-700 border-l-2 border-blue-500': isSelected(item),
          'border-l-2 border-transparent': !isSelected(item),
          'px-4': level === 0,
          'opacity-50': isDragging,
          'bg-blue-100 dark:bg-blue-900 border-l-2 border-blue-500': isDropTarget
        }"
        :style="level > 0 ? { paddingLeft: (level * 16 + 16) + 'px' } : {}"
      >
        <font-awesome-icon
          v-if="item.isDirectory"
          :icon="isExpanded(item.path) ? 'chevron-down' : 'chevron-right'"
          class="text-gray-500 dark:text-gray-400 w-3"
        />
        <font-awesome-icon
          :icon="getFileIcon(item)"
          class="text-gray-500 dark:text-gray-400"
          :class="{ 'ml-5': !item.isDirectory }"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm text-gray-800 dark:text-gray-200 truncate">
            {{ item.name }}
          </div>
        </div>
        <div
          v-if="isSelected(item) && agentStore.hasUnsavedChanges"
          class="w-2 h-2 rounded-full bg-yellow-500"
          title="Unsaved changes"
        ></div>
      </button>
      <!-- Action buttons (appear on hover, for both files and folders) -->
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          @click="handleRename"
          class="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 transition-colors"
          :title="item.isDirectory ? 'Rename folder' : 'Rename file'"
        >
          <font-awesome-icon icon="pen" class="text-xs" />
        </button>
        <button
          @click="handleDelete"
          class="p-1.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors"
          :title="item.isDirectory ? 'Delete folder' : 'Delete file'"
        >
          <font-awesome-icon icon="trash" class="text-xs" />
        </button>
      </div>
    </div>

    <!-- Render children if directory is expanded -->
    <template v-if="item.isDirectory && isExpanded(item.path) && item.children">
      <TreeItem
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :level="level + 1"
        @click="(item) => $emit('click', item)"
        @delete="(item, event) => $emit('delete', item, event)"
        @rename="(item, event) => $emit('rename', item, event)"
        @move="(data) => $emit('move', data)"
      />
    </template>
  </div>
</template>
