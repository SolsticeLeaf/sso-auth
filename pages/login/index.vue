<script setup lang="ts">

const { status: response_status, data: response_data } = await $fetch('/api/getUserData', {
  default: () => [],
  cache: "no-cache",
  server: false,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}'
});
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
@use "../../assets/scss/screens" as *;

.logo {
  display: flex;
  flex-direction: row;
  gap: 1rem;

  &__second {
    background: var(--logo-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}
</style>
