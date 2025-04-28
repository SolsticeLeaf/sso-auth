<script setup lang="ts">
import BackgroundWords from '~/components/BackgroundWords.vue';
import CookieBanner from '~/components/utilities/CookieBanner.vue';
import { decodeBase64AsJson } from '~/utilities/base64.utils';

const { tm, setLocale } = useI18n();
const theme = useColorMode();
const route = useRoute();

onMounted(() => {
  umTrackView();
});

onBeforeMount(() => {
  const data = decodeBase64AsJson(route?.query?.data || '');
  const queryLocale = data.locale;
  const queryTheme = data.theme;
  if (queryLocale === 'ru' || queryLocale === 'en') {
    setLocale(queryLocale);
  }
  if (queryTheme === 'dark' || queryTheme === 'light') {
    theme.value = queryTheme;
  }
});
</script>

<template>
  <Body>
    <ClientOnly>
      <Suspense>
        <KeepAlive>
          <BackgroundWords :array="tm('backgroundWords')" />
        </KeepAlive>
      </Suspense>
    </ClientOnly>
    <NuxtLayout>
      <div id="body" class="body">
        <Suspense>
          <CookieBanner class="cookies-banner" />
        </Suspense>
        <NuxtPage />
      </div>
    </NuxtLayout>
  </Body>
</template>

<style scoped lang="scss">
@use '@/assets/scss/screens' as *;

.cookies-banner {
  display: flex;
  position: fixed;
  z-index: 200;
  bottom: 1rem;
  right: 1rem;

  @media screen and (max-width: $screen-md) {
    bottom: 0.5rem;
    right: auto;
  }
}

.body {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: space-between;
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
}
</style>
