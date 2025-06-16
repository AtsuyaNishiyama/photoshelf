<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">画像の編集</h2>

      <img :src="photo.imageUrl" alt="photo" class="w-full h-40 object-cover rounded mb-4" />

      <input
          type="file"
          accept="image/*"
          @change="handleFileChange"
          class="mb-4"
      />

      <textarea
          v-model="newDescription"
          placeholder="説明文を編集"
          class="w-full p-2 border rounded mb-4"
          rows="3"
      />

      <div class="flex justify-end space-x-2">
        <button @click="$emit('close')" class="px-4 py-2 bg-gray-300 rounded">キャンセル</button>
        <button @click="updatePhoto" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          保存
        </button>
      </div>

      <p v-if="successMessage" class="text-green-600 mt-2">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, getStorage } from 'firebase/storage'

// props で編集対象の photo を受け取る
const props = defineProps({
  photo: Object
})

// emit で親にモーダルを閉じるよう伝える
const emit = defineEmits(['close'])

//親コンポーネントから受け取ったdescriptionの値もしくを定義・編集画面の入力画面に表示させたり・説明文をFirestoreを更新する際の利用
const newDescription = ref(props.photo.description || '')
const successMessage = ref('')
const errorMessage = ref('')
const newFile = ref(null)

//「画像ファイルが選択されたとき」に実行
const handleFileChange = (e) => {
newFile.value = e.target.files[0]
console.log('選択されたファイル:', newFile.value)
}

//編集ボタンをクリックした際、実行される関数
const updatePhoto = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const photoRef = doc(db, 'photos', props.photo.id)
    const updatedData = { description: newDescription.value }


    // 新しい画像が選択されていれば実行
    if (newFile.value) {
        const storage = getStorage()

        // 元のパスがある場合、既存の画像を削除
        if (props.photo.imagePath) {
        const oldRef = storageRef(storage, props.photo.imagePath)
        await deleteObject(oldRef)
        }

        // 新しい画像をアップロード
        const newPath = `images/${Date.now()}_${newFile.value.name}`
        const newImageRef = storageRef(storage, newPath)
        await uploadBytes(newImageRef, newFile.value)
        const newUrl = await getDownloadURL(newImageRef)
        
        //updatedDataのオブジェクトのにimageUrl・imagePathプロパティ:値を追加
        updatedData.imageUrl = newUrl
        updatedData.imagePath = newPath
    }
    // Firestore 更新
    await updateDoc(photoRef, updatedData)

    successMessage.value = '更新しました！'
    // 少し待ってからモーダルを閉じる（表示確認のため）
    setTimeout(() => {
      emit('close')
    }, 800)
  } catch (err) {
    console.error(err)
    errorMessage.value = '更新に失敗しました'
  }
}
</script>
