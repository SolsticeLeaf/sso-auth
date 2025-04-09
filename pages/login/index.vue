<script setup lang="ts">
import LoginFormComponent from "~/components/LoginFormComponent.vue";
import LoginUserComponent from "~/components/LoginUserComponent.vue";

const { status: response_status, data: response_data } = await $fetch('/api/getUserData', {
  default: () => [],
  cache: "no-cache",
  server: false,
  method: 'POST',
  body: '{}'
}).catch(error => console.log(error));
</script>

<template>
  <ClientOnly>
    <KeepAlive>
      <div class="displayed">
        <div class="logo">
          <h1 class="logo__first">SLEAF</h1>
          <h1 class="logo__second">AUTH</h1>
        </div>
        <div id="hero" class="wrapper blur__glass">
          <LoginFormComponent v-if="response_status !== 'OK'"/>
          <LoginUserComponent v-else :data="response_data" />
        </div>
      </div>
    </KeepAlive>
  </ClientOnly>
</template>

<style scoped lang="scss">
</style>
