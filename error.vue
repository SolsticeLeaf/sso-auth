<script setup lang="ts">
import ActionButton from '~/components/utilities/ActionButton.vue';
import iconsConfig from '~/config/icons.config';
import BackgroundWords from '~/components/BackgroundWords.vue';
import CookieBanner from '~/components/utilities/CookieBanner.vue';
import { decodeBase64AsJson } from '~/utilities/base64.utils';
import type { NuxtError } from '#app';

defineProps({
  error: Object as () => NuxtError,
});

const { t, tm, setLocale } = useI18n();
const theme = useColorMode();
const route = useRoute();
const routeData = route?.query?.data || '';

onBeforeMount(() => {
  const data = decodeBase64AsJson(route?.query?.data || '');
  const queryLocale = data.locale;
  const queryTheme = data.theme;
  if (queryLocale === 'ru' || queryLocale === 'en') {
    setLocale(queryLocale);
  }
  if (queryTheme === 'dark' || queryTheme === 'light') {
    theme.preference = queryTheme;
    theme.value = queryTheme;
  } else {
    theme.preference = 'system';
  }
});

const openMainPage = () => {
  const url = `/login?data=${routeData}`;
  window.location.assign(url);
  window.open(url, '_self');
};
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
        <div class="wrapper blur__glass">
          <h4>{{ t('error') }}: {{ error.statusCode }} ({{ error.statusMessage }})</h4>
          <ActionButton :text="t('back')" :icon="iconsConfig.home" color="#50C878" text-color="#ffffff" @click="openMainPage" :outline="false" />
        </div>
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

  @media screen and (max-width: $screen-sm) {
    width: 90%;
  }
}

.body {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  justify-content: center;
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
}

.blur__glass {
  padding: 1rem;
}

.wrapper {
  gap: 0.5rem;
  width: fit-content;
}
</style>
