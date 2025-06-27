<script setup>
import { currentUser , isAuthReady } from './stores/user'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import { signOut } from 'firebase/auth'
import { ref } from 'vue'
import  Signup  from './components/Signup.vue'
import PhotoFormModal from './components/PhotoFormModal.vue'
import PhotoList from './components/PhotoList.vue'

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
    <div class="w-full bg-gradient-to-br from-blue-500 via-green-500 to-yellow-200  text-center">
      
      <div v-if="currentUser" class="w-full bg-gray-800 text-white p-2">
        <div class="flex justify-between items-center">
          <!-- 左側: Photoshelf -->
          <h1 class="text-3xl font-bold caprasimo-regular">Photoshelf</h1>
          
          <div class="text-sm caprasimo-regular">
            <span> {{ currentUser.email }}</span>
          </div>

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
              class="bg-gray-400 text-white rounded px-4 py-2 hover:bg-gray-500 transition duration-200 ease-in-out"
            >
              ログアウト
            </button>
          </div>
        </div>    

      </div>

      <!-- ログイン状態がまだ取得されていないとき（初期状態） -->
      <div v-if="!isAuthReady">
        <p>読み込み中...</p>
      </div>

      <!-- サインアップ画面表示中 -->
      <div v-else-if="!currentUser && isSignup">
        <Signup />
        <p><button @click="isSignup = false" class="text-blue-600 underline text-sm mt-4">ログインに戻る</button></p>
      </div>

      <!-- ログインしていないとき -->
      <div v-else-if="!currentUser" class="bg-white p-6 rounded">
        <h1 class="text-3xl caprasimo-regular font-bold">Photoshelf</h1>
        <form @submit.prevent="login" class="space-y-4">
          <input
            v-model="email"
            type="email"
            placeholder="メールアドレス"
            class="w-full px-3 py-2 border rounded"
          />
          <input
            v-model="password"
            type="password"
            placeholder="パスワード"
            class="w-full px-3 py-2 border rounded"
          />
          <button
            type="submit"
            class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
        <p><button @click="isSignup = true" class="text-blue-600 underline text-sm mt-4">アカウントをお持ちでない方はこちら</button></p>
        <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
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
