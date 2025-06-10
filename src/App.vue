<script setup>
import { currentUser } from './stores/user'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import { signOut } from 'firebase/auth'
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const error = ref('')

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
  <main class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-6 rounded shadow max-w-sm w-full text-center">
      <h1 class="text-2xl font-bold mb-4">📷 Photoshelf</h1>

      <!-- ログインしていないとき -->
      <div v-if="!currentUser">
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
            ログイン
          </button>
        </form>
        <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
      </div>

      <!-- ログイン済みのとき -->
      <div v-else>
        <p class="mb-4">ログイン中：{{ currentUser.email }}</p>
        <button
          @click="logout"
          class="w-full bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          ログアウト
        </button>
      </div>
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
