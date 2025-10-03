<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded shadow-lg w-full max-w-[90vw] max-h-[90vh] overflow-y-auto sm:w-[500px] relative">
      <button
        @click="$emit('close')"
        class="absolute top-2 right-2 bg-gray-300 p-2 rounded-full shadow hover:bg-gray-400"
      >
        <img src="/close.svg" alt="閉じる" class="w-4 h-4" />
      </button>
      <img 
        :src="photo.imageUrl" 
        alt="photo" 
        class="w-full h-auto max-h-[300px] object-contain rounded mb-4" 
      />

      <div class="space-y-2 text-sm text-gray-800">
        <!-- 評価 -->
        <div>
          評価:
          <span v-for="n in 5" :key="n" class="text-yellow-500">{{ n <= photo.rating ? '★' : '☆' }}</span>
        </div>

        <!-- 撮影日 -->
        <div>
          撮影日: 
          <span>{{ formatDate(photo.shootingDate) }}</span>
        </div>

        <!-- 説明 -->
        <div>
          説明: <span>{{ photo.description || 'なし' }}</span>
        </div>

        <!-- 住所 -->
        <div>
          住所: <span>{{ photo.address || '未登録' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Rating = 1 | 2 | 3 | 4 | 5

interface Photo {
  imageUrl: string
  rating: Rating
  shootingDate: Date | null
  description?: string
  address?: string
}

const props = defineProps<{ photo: Photo }>()
defineEmits<{ (e: 'close'): void }>()

function formatDate(date: Date | null): string {
  if (!date) return '未登録'
  return date.toLocaleDateString()
}
</script>
