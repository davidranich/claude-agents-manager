import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faFolder,
  faFile,
  faFileLines,
  faPlus,
  faRepeat,
  faSave,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faLink,
  faCode,
  faQuoteLeft,
  faMinus,
  faEraser,
  faListUl,
  faListOl,
  faHeading,
  faSun,
  faMoon,
  faBookOpen,
  faTrash,
  faTerminal,
  faCog,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

// Add icons to library
library.add(
  faFolder,
  faFile,
  faFileLines,
  faPlus,
  faRepeat,
  faSave,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faLink,
  faCode,
  faQuoteLeft,
  faMinus,
  faEraser,
  faListUl,
  faListOl,
  faHeading,
  faSun,
  faMoon,
  faBookOpen,
  faTrash,
  faTerminal,
  faCog,
  faTimes
);

const app = createApp(App);

// Register FontAwesome component globally
app.component('font-awesome-icon', FontAwesomeIcon);

app.use(createPinia());
app.use(router);

app.mount('#app');
