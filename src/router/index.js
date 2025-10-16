import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/Home.vue';

// Using hash history for Electron compatibility
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    }
  ]
});

export default router;
