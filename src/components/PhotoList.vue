<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
    <div v-for="photo in photos" :key="photo.id" class="rounded shadow">
      <img
        :src="photo.imageUrl"
        alt="uploaded"
        class="w-full h-24 object-cover rounded"
      />
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

const photos = ref([])

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
</script>
