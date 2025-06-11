import { ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

export const currentUser = ref(null)
export const isAuthReady = ref(false)

onAuthStateChanged(auth, (user) => {
  console.log('[Firebase Auth] 状態変更:', user)
  currentUser.value = user
  isAuthReady.value = true
})
