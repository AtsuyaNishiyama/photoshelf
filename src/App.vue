<script setup lang="ts">
import { currentUser , isAuthReady } from '@/stores/user'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import { ref } from 'vue'
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import Signup from '@/components/Signup.vue'
import PhotoFormModal from '@/components/PhotoFormModal.vue'
import PhotoList from '@/components/PhotoList.vue'
import Login from '@/components/Login.vue'

const email = ref<string>('')
const password = ref<string>('')
const error = ref<string>('')
const isSignup = ref<boolean>(false)
const showModal = ref<boolean>(false)

const login = async():Promise<void> => {
  error.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
  } catch (err) {
    error.value = 'ログインに失敗しました'
    console.error(err)
  }
}

const logout = async ():Promise<void> => {
  await signOut(auth)
}

const router = useRouter()
let idleTimer: number | undefined

// 自動ログアウト処理
const handleAutoLogout = async ():Promise<void> => {
  await logout()
  alert('15分間操作がなかったため、自動的にログアウトしました。')
  router.push('/login')
}

// タイマーリセット処理
const resetIdleTimer = () => {
  if(idleTimer !== undefined){
  clearTimeout(idleTimer)
  }
  idleTimer = window.setTimeout(() => {
   void handleAutoLogout()
  }, 15 * 60 * 1000) // 15分
}

// 監視対象のイベント
const idleEvents : Array<keyof WindowEventMap> = [
  'mousemove', 
  'mousedown', 
  'keypress', 
  'scroll', 
  'touchstart'
]

onMounted(() => {
  // currentUser がログイン済みのときのみタイマーを動作
  watch(currentUser, (user) => {
    if (user) {
      // 初期タイマー設定
      resetIdleTimer()
      idleEvents.forEach(event =>
        window.addEventListener(event, resetIdleTimer)
      )
    } else {
      // ログアウトしたらタイマー停止
      clearTimeout(idleTimer)
      idleEvents.forEach(event =>
        window.removeEventListener(event, resetIdleTimer)
      )
    }
  }, { immediate: true })
})

onBeforeUnmount(() => {
  clearTimeout(idleTimer)
  idleEvents.forEach(event =>
    window.removeEventListener(event, resetIdleTimer)
  )
})
</script>

<template>
  <main class="flex items-center justify-center">
    <div class="w-full bg-blue-white text-center">
      
      <div v-if="currentUser" class="w-full bg-gray-800 text-white p-2">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold caprasimo-regular">Photoshelf</h1>

          <div class="flex space-x-4">
            <!-- 登録ボタン -->
            <button
              @click="showModal = true"
              class="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 transition duration-200 ease-in-out"
            >
              登録
            </button>

            <!-- ログアウトボタン -->
            <button
              @click="logout"
              class="bg-gray-400 text-white rounded p-2 hover:bg-gray-500 transition duration-200 ease-in-out"
            >
              <img src="/logout.svg" alt="Logout" class="w-3 h-3" />
            </button>
          </div>
        </div>    

      </div>

      <!-- ログイン状態がまだ取得されていないとき（初期状態） -->
      <div v-if="!isAuthReady">
        <p>読み込み中...</p>
      </div>

      <!-- サインアップ画面表示中 -->
      <div v-else-if="!currentUser && isSignup" class="px-8">
        <Signup @backToLogin="isSignup = false" />
      </div>

      <!-- ログインしていないとき -->
      <div v-else-if="!currentUser && !isSignup && isAuthReady" class="px-8">
        <Login @showSignup="isSignup = true" />
      </div>

      <!-- ログイン済みのとき -->
      <div v-else>
        <PhotoFormModal v-if="showModal" @close="showModal = false" />
      </div>

      <!-- 画像リスト -->
      <PhotoList v-if="currentUser" />
    </div>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: sans-serif;
  color:black
}
</style>
