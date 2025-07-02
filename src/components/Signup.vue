<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="w-full max-w-xs min-w-[280px] mx-auto p-6 bg-blue-400 rounded shadow-2xl">
      <h2 class="text-2xl mb-6 text-white text-center caprasimo-regular">SignUp</h2>

      <form @submit.prevent="signup" class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="メールアドレス"
          class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="password"
          type="password"
          placeholder="パスワード"
          class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded hover:scale-105"
        >
          登録
        </button>
      </form>

      <p v-if="error" class="text-red-500 mt-2 text-sm">{{ error }}</p>

      <p class="text-white mt-4 text-sm text-center">
        <button @click="$emit('backToLogin')" class="underline">
          ログインに戻る
        </button>
    </p>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const email = ref('')
const password = ref('')
const error = ref('')

const signup = async () => {
  error.value = ''
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value)
    alert('ユーザー登録が完了しました')
  } catch (err) {
    error.value = '登録に失敗しました'
    console.error(err)
  }
}

defineEmits(['backToLogin'])
</script>

