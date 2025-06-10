import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'

const routes = [
  { path: '/login', component: LoginForm },
  // 他のルート...
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
