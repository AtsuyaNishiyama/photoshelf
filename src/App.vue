<script setup>
import { currentUser , isAuthReady } from './stores/user'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import { signOut } from 'firebase/auth'
import { ref } from 'vue'
import  Signup  from './components/Signup.vue'
import PhotoFormModal from './components/PhotoFormModal.vue'
import PhotoList from './components/PhotoList.vue'
import Login from './components/Login.vue'

const email = ref('')
const password = ref('')
const error = ref('')
const isSignup = ref(false)
const showModal = ref(false)

const login = async () => {
  error.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
  } catch (err) {
    error.value = 'ログインに失敗しました'
    console.error(err)
  }
}

const logout = async () => {
  await signOut(auth)
}
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
