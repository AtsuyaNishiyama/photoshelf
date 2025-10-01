<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 min-h-screen bg-blue-100">
    <div v-for="photo in photos" :key="photo.id" class="relative ">
      <!-- 画像部分 -->
      <div class="w-full max-w-[290px] h-[200px] mx-auto overflow-hidden rounded relative">
        <img
          :src="photo.imageUrl"
          class="w-full h-full object-cover"
          @click="detailedPhoto = photo"
        />

        <!-- 三点リーダー -->
        <button
          @click="toggleMenu(photo.id)"
          class="absolute top-2 right-2 bg-white p-0.5 rounded-full shadow-md hover:bg-gray-200 z-20"
        >
          <img v-if="menuOpen !== photo.id" src="/dots.svg" class="w-3 h-3" />
          <img v-else src="/close.svg" class="w-3 h-3" />
        </button>

        <!-- メニュー -->
        <div
          v-if="menuOpen === photo.id"
          class="absolute top-10 right-2 bg-white rounded shadow-md flex flex-col space-y-1 p-1 z-20"
        >
          <a
            :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(photo.address ?? '')}`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center space-x-1 hover:bg-gray-100 p-1 rounded text-xs"
          >
            <img src="/pin.svg" alt="Map Pin" class="w-3 h-3" />
            <span>地図</span>
          </a>

          <button
            @click="editPhoto = photo; menuOpen = null"
            class="flex items-center space-x-1 hover:bg-gray-100 p-1 rounded text-xs"
          >
            <img src="/pen.svg" alt="Edit" class="w-3 h-3" />
            <span>編集</span>
          </button>
          
          <button
            @click="deletePhoto(photo); menuOpen = null"
            class="flex items-center space-x-1 hover:bg-gray-100 p-1 rounded text-xs text-red-500"
          >
            <img src="/trash.svg" alt="Trash" class="w-3 h-3" />
            <span>削除</span>
          </button>
        </div>

        <!-- 評価 -->
        <div
          class="absolute bottom-0 w-full bg-gradient-to-t from-black via-transparent to-transparent text-white text-xs p-2 pointer-events-none"
        >
          <div class="text-yellow-500">
            <span v-for="n in 5" :key="n">
              {{ n <= photo.rating ? '★' : '☆' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <PhotoEditModal v-if="editPhoto" :photo="editPhoto" @close="editPhoto = null" />
    <PhotoDetailModal v-if="detailedPhoto" :photo="detailedPhoto" @close="detailedPhoto = null"/>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { db, auth } from '@/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, query, orderBy, onSnapshot, deleteDoc, doc, where,
  type DocumentData, type Timestamp, type Unsubscribe
} from 'firebase/firestore'
import { deleteObject, ref as storageRef, getStorage } from 'firebase/storage'
import PhotoEditModal from '@/PhotoEditModal.vue'
import PhotoDetailModal from '@/PhotoDetailModal.vue'

/** 将来の安定運用のためのドメイン型（最低限） */
export type Rating = 1 | 2 | 3 | 4 | 5

export interface Photo {
  id: string
  uid: string
  imageUrl: string
  rating: Rating
  address?: string
  imagePath?: string
  /** 日付UIで使いやすいように変換後を保持（存在しない場合は null） */
  shootingDate: Date | null
  /** Firestoreフィールドは他にもあり得るので拡張余地を残す */
  [key: string]: unknown
}

const photos: Ref<Photo[]> = ref([])
const editPhoto: Ref<Photo | null> = ref(null)
const menuOpen: Ref<string | null> = ref(null)
const detailedPhoto: Ref<Photo | null> = ref(null)

watch(detailedPhoto, (val) => {
  console.log('モーダルに渡された photo:', val)
  console.log('📸 detailedPhoto:', val)
})

const toggleMenu = (id: string) => {
  menuOpen.value = menuOpen.value === id ? null : id
}

// Firestoreの購読解除関数
let unsubscribe: Unsubscribe | null = null

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const q = query(
        collection(db, 'photos'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      )

      unsubscribe = onSnapshot(q, (snapshot) => {
        photos.value = snapshot.docs.map((d) => {
          // Firestore 生データ（shootingDateがTimestampの可能性を考慮）
          const data = d.data() as DocumentData & { shootingDate?: Timestamp; rating?: number }

          // rating は 1..5 の範囲に丸めて型アサート（必要なら厳密化可）
          const rawRating = Number(data.rating ?? 0)
          const rating = (Math.min(5, Math.max(1, rawRating)) || 1) as Rating

          return {
            id: d.id,
            uid: String(data.uid ?? ''),
            imageUrl: String(data.imageUrl ?? ''),
            rating,
            address: data.address ? String(data.address) : undefined,
            imagePath: data.imagePath ? String(data.imagePath) : undefined,
            shootingDate: data.shootingDate?.toDate?.() ?? null,
            ...data
          } as Photo
        })
      })
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

/** 削除ボタンがクリックされたときに実行 */
const deletePhoto = async (photo: Photo): Promise<void> => {
  const ok = window.confirm('この画像を削除してもよろしいですか？')
  if (!ok) return

  try {
    // Firestorage の画像を削除
    if (photo.imagePath) {
      const storage = getStorage()
      const imageRef = storageRef(storage, photo.imagePath)
      await deleteObject(imageRef)
    }

    // Firestore のドキュメントを削除
    await deleteDoc(doc(db, 'photos', photo.id))
  } catch (err) {
    console.error('削除に失敗しました', err)
  }
}
</script>
