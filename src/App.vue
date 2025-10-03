<script setup lang="ts">
withDefaults(
defineProps<{
test?: string,
}>(),
{
test: "ボタン"
}
)
</script>

<template>
  <div><router-view/>

  </div>
</template>

<style>

</style>