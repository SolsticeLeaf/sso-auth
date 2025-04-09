<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import LoginFormComponent from "~/components/LoginFormComponent.vue";
import LoginUserComponent from "~/components/LoginUserComponent.vue";

const status = ref('');
const data = ref({});
const isLoaded = ref(false);

onBeforeMount(async () => {
  try {
    const { status: response_status, data: response_data } = await $fetch('/api/getUserData', {
      default: () => [],
      cache: "no-cache",
      server: false,
      method: 'POST',
      body: '{}'
    });
    status.value = response_status;
    data.value = response_data;
  } finally {
    isLoaded.value = true;
  }
});
</script>

<template>
  <ClientOnly>
    <KeepAlive>
      <div v-if="isLoaded" class="displayed">
        <div class="logo">
          <h1 class="logo__first">SLEAF</h1>
          <h1 class="logo__second">AUTH</h1>
        </div>
        <div id="hero" class="wrapper blur__glass">
          <LoginFormComponent v-if="status !== 'OK'" />
          <LoginUserComponent v-else :data="data" />
        </div>
      </div>
    </KeepAlive>
  </ClientOnly>
</template>

<style scoped lang="scss">
</style>
