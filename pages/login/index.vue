<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import LoginFormComponent from '~/components/LoginFormComponent.vue';
import LoginUserComponent from '~/components/LoginUserComponent.vue';
import TermsOfUse from '~/components/utilities/TermsOfUse.vue';

const status = ref('');
const user = ref({});
const isLoaded = ref(false);

onBeforeMount(async () => {
  try {
    const { status: response_status, user: response_data } = await $fetch('/api/system/checkAuthStatus', {
      default: () => [],
      cache: 'no-cache',
      server: false,
      method: 'GET',
      headers: { userAgent: useDevice().userAgent },
    });
    status.value = response_status;
    user.value = response_data;
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
        <div class="wrapper">
          <div id="hero" class="login">
            <LoginFormComponent v-if="status !== 'OK'" />
            <LoginUserComponent v-else :data="user" />
          </div>
          <TermsOfUse />
        </div>
      </div>
    </KeepAlive>
  </ClientOnly>
</template>

<style scoped lang="scss">
@use '/assets/scss/screens.scss' as *;

.login {
  display: flex;
  width: 100%;
  justify-content: center;
}

.blur__glass {
  padding: 0;
}
</style>
