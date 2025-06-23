<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">画像アップロード</h2>

      <input type="file" accept="image/*" @change="handleFileChange" class="mb-4" />

      <div class="flex items-center space-x-1 mt-4">
        <span
          v-for="n in 5"
          :key="n"
          @click="rating = n"
          class="cursor-pointer text-2xl"
        >
          {{ n <= rating ? '★' : '☆' }}
        </span>
      </div>

      <textarea
        v-model="description"
        placeholder="説明文を入力してください"
        class="w-full p-2 border rounded mt-4"
        rows="2"
      />

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

<script setup>
import { ref } from 'vue'
import { storage } from '../firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const file = ref(null)
const uploading = ref(false)
const error = ref('')
const description = ref('')
const emit = defineEmits(['close'])
const address = ref('')
const rating = ref(5) 


//APIキーの取得
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY


const getCoordinatesFromAddress = async (addressText) => {

  //  TODO: Google Maps APIキーをCloud Functions経由に切り替える
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressText)}&key=${GOOGLE_API_KEY}`

  //Google Maps API に住所を送って、返ってきた生データをresと定義
  const res = await fetch(url)
  //生データをJSON形式に変換
  const data = await res.json()

  console.log('住所変換APIレスポンス:', data) 

  if (data.status === 'OK') {
    //JSONデータの一番目の.geometry.locationをlocationで定義
    const location = data.results[0].geometry.location
    return location // { lat: ..., lng: ... }
  } else {
    throw new Error('住所の変換に失敗しました')
  }
}


const handleFileChange = (e) => {
  file.value = e.target.files[0]
}

//登録ボタンがクリックされたら、実行される関数
const handleCreatePhoto = async () => {
  //ファイルの値がないなら実行
  if (!file.value) {
    error.value = 'ファイルを選択してください'
    return
  }
  //uploadingの値をtrue・errorの値を空にする=>アップロード中と表示される
  uploading.value = true
  error.value = ''


  try {
    const path = `images/${Date.now()}_${file.value.name}`
    const imageRef = storageRef(storage, path)
    await uploadBytes(imageRef, file.value)
    const url = await getDownloadURL(imageRef)
    const location = await getCoordinatesFromAddress(address.value)

    // Firestore に画像情報を保存
    await addDoc(collection(db, 'photos'), {
      imageUrl: url,
      imagePath: path, // FirestorageのURLを保存
      description: description.value, 
      address: address.value,
      location,
      rating: rating.value, 
      createdAt: serverTimestamp()
    })

    //uploadingの値をfalse・fileの値をnull・errorの値を空にする=>初期値に戻す
    uploading.value = false
    file.value = null
    error.value = ''
    // 親に「完了した」ことを伝える=>ポップアップ画面が閉じる
    emit('close')
  } catch (err) {
    console.error(err)
    error.value = 'アップロードに失敗しました'
  } finally {
    uploading.value = false
    file.value = null
    description.value = ''
  }
}

</script>
