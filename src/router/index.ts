import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '@/components/Login.vue'
import IndexView from '@/views/index.vue'

const routes = [
  { path: '/login', component: LoginForm },
  { path: '/', component: IndexView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router