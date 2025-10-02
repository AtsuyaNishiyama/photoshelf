<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded shadow-lg w-full max-w-[90vw] max-h-[90vh] overflow-y-auto sm:w-[500px] relative">
      <button
        @click="$emit('close')"
        class="absolute top-2 right-2 bg-gray-300 p-2 rounded-full shadow-2xl hover:bg-gray-400 hover:scale-105 transition-transform duration-150"
      >
        <img src="/close.svg" alt="閉じる" class="w-4 h-4" />
      </button>

      <img 
        :src="photo.imageUrl" 
        alt="photo" 
        class="w-full h-auto max-h-[300px] object-contain rounded mb-4"
      />

      <input
          type="file"
          accept="image/*"
          @change="handleFileChange"
          class="mb-4"
      />

      <div class="text-yellow-500 text-xl mb-4">
        <span
          v-for="n in 5"
          :key="n"
          class="cursor-pointer"
          @click="newRating = n"
        >
          {{ n <= newRating ? '★' : '☆' }}
        </span>
      </div>

      <input
        type="date"
        v-model="newShootingDate"
        class="w-full p-2 border rounded mb-4"
      />

      <textarea
        v-model="newDescription"
        placeholder="説明文を編集"
        class="w-full p-2 border rounded mb-4"
        rows="3"
      ></textarea>

      <input
        v-model="newAddress"
        type="text"
        placeholder="住所を編集"
        class="w-full p-2 border rounded mb-4"
      />

      <div class="flex justify-end">
        <button @click="updatePhoto" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          保存
        </button>
      </div>

      <p v-if="successMessage" class="text-green-600 mt-2">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { db, storage } from '@/firebase'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// ---- 型 ----
type LatLng = { lat: number; lng: number }
type FirestoreDateLike = Date | { toDate: () => Date } | string | null | undefined

type PhotoForEdit = {
  id: string
  imageUrl?: string | undefined
  imagePath?: string | null
  description?: string | null
  address?: string | null
  location?: LatLng | null
  shootingDate?: FirestoreDateLike
  rating?: number | null
}

// props（テンプレートそのまま使えるように photo を維持）
const props = defineProps<{ photo: PhotoForEdit }>()
const emit = defineEmits<{ (e: 'close'): void }>()

// ---- ENV ----
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

// ---- 入力状態（templateのv-modelを変えないため、shootingDateはstringで保持）----
const newDescription = ref<string>(props.photo.description ?? '')
const newAddress = ref<string>(props.photo.address ?? '')
const newRating = ref<number>(props.photo.rating ?? 5)
const newShootingDate = ref<string>(coerceToInputDate(props.photo.shootingDate)) // ← templateのv-model="newShootingDate"を維持
const newFile = ref<File | null>(null)

const successMessage = ref<string>('')
const errorMessage = ref<string>('')
const saving = ref<boolean>(false)

// ---- shootingDate 初期整形：YYYY-MM-DD 文字列へ ----
function coerceToInputDate(v: FirestoreDateLike): string {
  // Date | Timestamp-like | string(YYYY-MM-DD) | null/undefined を受け取って、YYYY-MM-DD に正規化
  if (!v) return ''
  if (typeof v === 'string') {
    // 既にYYYY-MM-DD想定。形式外なら空にする
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''
  }
  const d = v instanceof Date ? v : typeof (v as any).toDate === 'function' ? (v as any).toDate() : null
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---- 住所→緯度経度 ----
async function getCoordinatesFromAddress(addressText: string): Promise<LatLng> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressText)}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json() as {
    status: string
    results: Array<{ geometry: { location: LatLng } }>
  }
  if (data.status === 'OK' && data.results?.length) {
    return data.results[0].geometry.location
  }
  throw new Error('住所の変換に失敗しました')
}

// ---- 画像ファイル選択 ----
function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  newFile.value = input.files?.[0] ?? null
  console.log('選択されたファイル:', newFile.value)
}

// ---- 更新 ----
async function updatePhoto() {
  successMessage.value = ''
  errorMessage.value = ''
  saving.value = true

  try {
    const photoRef = doc(db, 'photos', props.photo.id)

    // 住所（空はnull、値があればジオコーディング）
    let nextLocation: LatLng | null = null
    const addr = (newAddress.value ?? '').trim()
    if (addr.length > 0) {
      try {
        nextLocation = await getCoordinatesFromAddress(addr)
      } catch (e) {
        console.warn('ジオコーディング失敗。位置は未更新のまま続行します。', e)
        nextLocation = props.photo.location ?? null
      }
    } else {
      nextLocation = null
    }

    // 画像差し替え（成功後に旧画像削除）
    let nextImageUrl = props.photo.imageUrl ?? undefined
    let nextImagePath = props.photo.imagePath ?? null
    if (newFile.value) {
      const newPath = `images/${Date.now()}_${newFile.value.name}`
      const newImageRef = storageRef(storage, newPath)
      await uploadBytes(newImageRef, newFile.value)
      nextImageUrl = await getDownloadURL(newImageRef)

      if (props.photo.imagePath) {
        try { await deleteObject(storageRef(storage, props.photo.imagePath)) }
        catch (e) { console.warn('旧画像の削除に失敗', e) }
      }
      nextImagePath = newPath
    }

    // shootingDate: 文字列(YYYY-MM-DD) → Date|null → Timestamp|null
    const dateStr = (newShootingDate.value ?? '').trim()
    const dateForSave = dateStr ? new Date(dateStr) : null

    const updatedData: Record<string, unknown> = {
      description: newDescription.value,
      address: addr || null,
      rating: newRating.value ?? 5,
      shootingDate: dateForSave ? Timestamp.fromDate(dateForSave) : null,
      location: nextLocation,
      imageUrl: nextImageUrl,
      imagePath: nextImagePath,
    }

    await updateDoc(photoRef, updatedData)

    successMessage.value = '更新しました！'
    setTimeout(() => emit('close'), 800)
  } catch (err) {
    console.error(err)
    errorMessage.value = '更新に失敗しました'
  } finally {
    saving.value = false
  }
}
</script>