<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
    <div v-for="photo in photos" :key="photo.id" class="rounded shadow">
      <img
        :src="photo.imageUrl"
        alt="uploaded"
        class="w-full h-24 object-cover rounded"
      />
      <p class="text-sm text-gray-700 break-words">{{ photo.description }}</p>
      <button @click="editPhoto = photo" class="text-blue-500 text-sm underline">編集</button>
      <button
        @click="deletePhoto(photo)"
        class="mt-2 w-full bg-red-500 text-white py-1 rounded hover:bg-red-600"
      >
        削除
      </button>
    </div>
  </div>
  <!-- 編集モーダルの表示 -->
  <PhotoEditModal
    v-if="editPhoto"
    :photo="editPhoto"
    @close="editPhoto = null"
  />
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, deleteDoc, doc  } from 'firebase/firestore'
import { deleteObject, ref as storageRef, getStorage } from 'firebase/storage'
import PhotoEditModal from './PhotoEditModal.vue'

const photos = ref([])
const editPhoto = ref(null)

//photosを参照して、作成（createdAt）が新しい順に並べる
const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'))

//unsubscribeはFirestoreの監視を解除する関数を保持する変数
let unsubscribe = null

onMounted(() => {

  //Firestoreのドキュメントであるphotosに変化があった際、自動で実行される
  unsubscribe = onSnapshot(q, (snapshot) => {
    //再度photosの値を再代入する
    photos.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

//削除ボタンがクリックされると実行される関数
const deletePhoto = async (photo) => {
  //削除実行前の確認
  const ok = window.confirm('この画像を削除してもよろしいですか？')
  if (!ok) return

  try {
    // Firestorage の画像を削除
    if (photo.imagePath) {
      const storage = getStorage() //Firestorageの情報（インスタンス）を取得
      const imageRef = storageRef(storage, photo.imagePath) //削除する画像のFirestorage内のファイルパス（参照先）を作成
      await deleteObject(imageRef) //参照先を引数に削除の実行
    }

    // Firestore のドキュメントを削除
    await deleteDoc(doc(db, 'photos', photo.id))
  } catch (err) {
    console.error('削除に失敗しました', err)
  }
}
</script>
