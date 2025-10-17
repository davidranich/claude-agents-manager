<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'create']);

const folderName = ref('');
const errorMessage = ref('');

watch(() => props.show, (newVal) => {
  if (newVal) {
    folderName.value = '';
    errorMessage.value = '';
  }
});

const handleCreate = () => {
  const trimmed = folderName.value.trim();

  if (!trimmed) {
    errorMessage.value = 'Please enter a folder name';
    return;
  }

  // Validate folder name (no special characters that are invalid in file paths)
  if (/[<>:"/\\|?*]/.test(trimmed)) {
    errorMessage.value = 'Folder name contains invalid characters';
    return;
  }

  emit('create', trimmed);
  folderName.value = '';
  errorMessage.value = '';
};

const handleClose = () => {
  emit('close');
  folderName.value = '';
  errorMessage.value = '';
};

const handleKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleCreate();
  } else if (event.key === 'Escape') {
    handleClose();
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click.self="handleClose"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Create New Folder</h3>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Folder Name
            </label>
            <input
              v-model="folderName"
              @keydown="handleKeydown"
              type="text"
              placeholder="my-folder"
              class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autofocus
            />
            <p v-if="errorMessage" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ errorMessage }}
            </p>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              @click="handleClose"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleCreate"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div > div,
.modal-leave-active > div > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div > div,
.modal-leave-to > div > div {
  transform: scale(0.95);
}
</style>
