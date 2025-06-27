<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    <div v-for="photo in photos" :key="photo.id" class="rounded shadow relative">
      <!-- 画像部分 -->
      <img
        :src="photo.imageUrl"
        alt="uploaded"
        class="w-full h-40 object-cover rounded"
      />

      <!-- 右上にGoogle MapsのSVGピンアイコン（pin.svg） -->
      <a
        :href="`https://www.google.com/maps/search/?api=1&query=${photo.location.lat},${photo.location.lng}`"
        target="_blank"
        rel="noopener noreferrer"
        class="absolute top-2 right-2 bg-white p-0.5 rounded-full shadow-md hover:bg-gray-200"
      >
        <!-- pin.svg を表示 -->
        <img src="/pin.svg" alt="Map Pin" class="w-3 h-3 text-red-500" />
      </a>

      <!-- ゴミ箱アイコン（マップアイコンの下に追加） -->
      <button
        @click="deletePhoto(photo)"
        class="absolute top-8 right-2 bg-white p-0.5 rounded-full shadow-md hover:bg-gray-200"
      >
        <!-- ゴミ箱アイコン (trash.svg) -->
        <img src="/trash.svg" alt="Trash" class="w-3 h-3"/>
      </button>

      <!-- 編集ボタン -->
      <button
        @click="editPhoto = photo" 
        class="absolute top-14 right-2 bg-white p-0.5 rounded-full shadow-md hover:bg-gray-200"
      >
        <img src="/pen.svg" alt="Pen" class="w-3 h-3"/>
      </button>
      
    
      <!-- 画像下に説明文と評価 -->
      <div class="flex flex-col justify-end absolute bottom-0 w-full bg-gradient-to-t from-black via-transparent to-transparent pt-16 text-white rounded-b">
        <div class="text-yellow-500 text-xs">
          <span v-for="n in 5" :key="n">
            {{ n <= photo.rating ? '★' : '☆' }}
          </span>
        </div>
        <p class="text-xs text-gray-200 break-words">{{ photo.description }}</p>
      </div>

      <!-- 撮影日 -->
      <!-- <p class="text-sm text-gray-600 mt-2">
        撮影日:
        {{ photo.shootingDate ? photo.shootingDate.toLocaleDateString() : '未登録' }}
      </p> -->

      
    </div>
  </div>
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
    photos.value = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        shootingDate: data.shootingDate?.toDate?.() ?? null
      };
    });
  });  
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
