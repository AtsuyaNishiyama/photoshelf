<template>
  <div class="max-w-sm mx-auto mt-10 p-6 bg-white rounded shadow">
    
    <h2 class="text-2xl mb-4">ログイン</h2>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="メールアドレス" class="input mb-2" />
      <input v-model="password" type="password" placeholder="パスワード" class="input mb-4" />
      <button type="submit" class="btn">ログイン</button>
    </form>
    <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const email = ref('')
const password = ref('')
const error = ref('')

const login = async () => {
  try {
    error.value = ''
    await signInWithEmailAndPassword(auth, email.value, password.value)
    alert('ログイン成功！')
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
}
</style>
