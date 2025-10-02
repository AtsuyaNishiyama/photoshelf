import { ref } from 'vue'
import type { User } from 'firebase/auth'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

// Firebase 認証インスタンスを取得
const auth = getAuth()

// 現在のユーザー（ログインしていなければ null）
export const currentUser = ref<User | null>(null)

// Firebase Auth の初期化が終わったかどうか（true になれば状態判定OK）
export const isAuthReady = ref<boolean>(false)

// 状態監視
onAuthStateChanged(auth, (user: User | null) => {
  console.log('[Firebase Auth] 状態変更:', user)
  currentUser.value = user
  isAuthReady.value = true
})