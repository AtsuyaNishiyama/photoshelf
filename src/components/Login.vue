<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="w-full max-w-xs min-w-[280px] mx-auto p-6 bg-blue-400 rounded shadow-2xl">
      <h2 class="text-2xl mb-6 text-white text-center caprasimo-regular">PhotoShelf</h2>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="メールアドレス"
          class="w-full p-2 border border-gray-300 rounded"
        />
        <input
          v-model="password"
          type="password"
          placeholder="パスワード"
          class="w-full p-2 border border-gray-300 rounded"
        />
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">ログイン</button>
      </form>
      <p v-if="error" class="text-red-100 mt-2">{{ error }}</p>
      <p class="text-white mt-4 text-sm text-center">
        <button @click="$emit('showSignup')" class="underline">アカウントをお持ちでない方はこちら</button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const emit = defineEmits(['showSignup']) // App.vue に通知する

const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
  } catch (err) {
    error.value = 'ログインに失敗しました'
    console.error(err)
  }
}
</script>

<style scoped>
.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.btn {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  width: 100%;
}
</style>
