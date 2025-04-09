<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <ClientOnly>
    <KeepAlive>
      <div class="body">
        <h1 class="blur__glass">{{ t('not_found') }}</h1>
      </div>
    </KeepAlive>
  </ClientOnly>
</template>

<style scoped lang="scss">

.body {
  display: flex;
  width: 100vw;
  height: 100vh;
  justify-content: center;
  align-items: center;
}

.blur__glass {
  padding: 0 1.5rem;
}

</style>
