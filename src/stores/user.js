import { ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

export const currentUser = ref(null)

onAuthStateChanged(auth, (user) => {
  currentUser.value = user
})
