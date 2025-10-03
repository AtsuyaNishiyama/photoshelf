<script setup lang="ts">
const emit = defineEmits<{
  (e: 'open-register'): void
  (e: 'logout'): void
}>()
</script>

<template>
  <!-- v-if="currentUser" =>ログイン中のみNavberが表示される -->
  <div  class="w-full bg-gray-800 text-white p-2">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold caprasimo-regular">Photoshelf</h1>

      <div class="flex space-x-4">
        <!-- 登録ボタン -->
        <button
          @click="emit('open-register')"
          class="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 transition duration-200 ease-in-out"
        >
          登録
        </button>

        <!-- ログアウトボタン -->
        <button
          @click="emit('logout')"
          class="bg-gray-400 text-white rounded p-2 hover:bg-gray-500 transition duration-200 ease-in-out"
        >
          <img src="/logout.svg" alt="Logout" class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>