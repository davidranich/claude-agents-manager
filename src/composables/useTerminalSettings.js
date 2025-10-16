import { ref, watch } from 'vue';

const STORAGE_KEY = 'claudeAgentsManager_terminalPreference';

// Available terminals
export const TERMINALS = {
  TERMINAL: 'terminal',
  ITERM: 'iterm',
};

export const TERMINAL_LABELS = {
  [TERMINALS.TERMINAL]: 'Terminal.app',
  [TERMINALS.ITERM]: 'iTerm2',
};

// Initialize from localStorage or default to Terminal.app
const preferredTerminal = ref(localStorage.getItem(STORAGE_KEY) || TERMINALS.TERMINAL);

// Watch for changes and save to localStorage
watch(preferredTerminal, (newValue) => {
  localStorage.setItem(STORAGE_KEY, newValue);
});

export function useTerminalSettings() {
  const setPreferredTerminal = (terminal) => {
    if (Object.values(TERMINALS).includes(terminal)) {
      preferredTerminal.value = terminal;
    }
  };

  return {
    preferredTerminal,
    setPreferredTerminal,
    TERMINALS,
    TERMINAL_LABELS,
  };
}
