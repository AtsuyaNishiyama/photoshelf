<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded shadow-lg w-full max-w-[90vw] max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold mb-4">画像アップロード</h2>

      <div v-if="imagePreviewUrl" class="flex items-center justify-center mb-4">
        <img :src="imagePreviewUrl" alt="プレビュー" class="max-h-[30vw] object-contain rounded shadow" />
      </div>

      <input 
        type="file" 
        accept="image/*" 
        @change="handleFileChange" 
      />

      <div class="flex items-center justify-center space-x-1 mt-4">
        <span
          v-for="n in 5"
          :key="n"
          @click="rating = n"
          class="cursor-pointer text-2xl text-yellow-500"
        >
          {{ n <= rating ? '★' : '☆' }}
        </span>
      </div>

      <input
        type="date"
        v-model="shootingDate"
        class="w-full p-2 border rounded"
      />

      <textarea
        v-model="description"
        placeholder="説明文を入力してください"
        class="w-full p-2 border rounded mt-4"
        rows="2"
      ></textarea>

      <input
        v-model="address"
        type="text"
        placeholder="住所を入力してください"
        class="w-full p-2 border rounded mt-4"
      />

      <!-- -->
      <div class="flex justify-end space-x-2">
        <!-- クリックすると親コンポーネントにcloseを伝える=>ポップアップ画面が閉じるようになる-->
        <button @click="$emit('close')" class="px-4 py-2 bg-gray-300 rounded">キャンセル</button>
        <!-- クリックすると関数handleCreatePhotoが実行される-->
        <button @click="handleCreatePhoto" class="px-4 py-2 bg-blue-500 text-white rounded">
          登録
        </button>
      </div>

      <!-- uproadingの値がtrueならアップロードと表示される-->
      <p v-if="uploading" class="text-blue-500 mt-2">アップロード中...</p>
      <!-- errorの値がtrueならエラーの値が表示される-->
      <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from 'vue'
import { storage } from '../firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { Script } from 'vm'

const file = ref<File | null>(null)
const uploading = ref<boolean>(false)
const error = ref<string>('')
const description = ref<string>('')

const address = ref<string>('')
const rating = ref<number>(5) 
const shootingDate = ref<Date | null>(null) 
const selectedImage = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
let objectUrl: string | null = null
const imagePreviewSrc = computed<string | undefined>(() => imagePreviewUrl.value || undefined)
const auth = getAuth()

const emit = defineEmits<{
  (e: 'close'): void
}>()

//APIキーの取得
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

//YYYY-MM-DDの形式で保存
function dateToInputValue(d: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
//YYYY-MM-DDの形式で出力
function inputValueToDate(v: string): Date | null {
  if (!v) return null
  const [y, m, d] = v.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

type LatLng = {
  lat: number
  lng: number
}

const getCoordinatesFromAddress = async (addressText: string): Promise<LatLng> => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressText)}&key=${GOOGLE_API_KEY}`
  const res = await fetch(url)
  const data = await res.json() as {
    status: string
    results: Array<{ geometry: { location: LatLng } }>
  }

  console.log('住所変換APIレスポンス:', data)

  if (data.status === 'OK' && data.results?.length) {
    return data.results[0].geometry.location
  }
  throw new Error('住所の変換に失敗しました')
}


// ---- 画像選択＆プレビュー ----
function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const picked = input.files?.[0] ?? null
  file.value = picked
  selectedImage.value = picked

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
  imagePreviewUrl.value = picked ? (objectUrl = URL.createObjectURL(picked)) : null
}

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})

// ---- 作成処理 ----
const handleCreatePhoto = async (): Promise<void> => {
  if (!file.value) {
    error.value = 'ファイルを選択してください'
    return
  }
  if (!auth.currentUser) {
    error.value = 'ログインが必要です'
    return
  }

  uploading.value = true
  error.value = ''

  try {
    console.log('ログイン中ユーザー:', auth.currentUser)

    // Storage へアップロード
    const path = `images/${Date.now()}_${file.value.name}`
    const imageRef = storageRef(storage, path)
    await uploadBytes(imageRef, file.value)
    const url = await getDownloadURL(imageRef)

    // 住所→緯度経度（住所が未入力ならnull）
    let location:LatLng | null = null
    if (address.value.trim()) {
      try {
        location = await getCoordinatesFromAddress(address.value.trim())
      } catch (e) {
        console.warn('住所のジオコーディングに失敗しましたが続行します。', e)
      }
    }

    // Firestore に保存（shootingDate は Timestamp|null に変換）
    await addDoc(collection(db, 'photos'), {
      uid: auth.currentUser.uid,
      imageUrl: url,
      imagePath: path,
      description: description.value,
      address: address.value || null,
      location, // {lat,lng} | null
      shootingDate: shootingDate.value ? Timestamp.fromDate(shootingDate.value) : null,
      rating: rating.value,
      createdAt: serverTimestamp(),
    })

    // 後処理
    uploading.value = false
    // 初期化
    file.value = null
    selectedImage.value = null
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null }
    imagePreviewUrl.value = null
    description.value = ''
    address.value = ''
    rating.value = 5
    shootingDate.value = null
    error.value = ''

    // 親へ完了通知（モーダルを閉じる）
    emit('close')
  } catch (err) {
    console.error(err)
    error.value = 'アップロードに失敗しました'
  } finally {
    uploading.value = false
  }
}

</script>