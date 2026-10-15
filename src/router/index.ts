import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/modules/home/HomeView.vue'),
    },
    {
      path: '/editor/:id',
      name: 'editor',
      component: () => import('@/modules/editor/EditorView.vue'),
    },
    {
      path: '/preview/:id',
      name: 'preview',
      component: () => import('@/modules/preview/PreviewView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
