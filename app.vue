<script setup lang="ts">
import {Vue3Marquee} from "vue3-marquee";
import initialConfig from "@/config/initial.config";
import {decodeBase64AsJson} from "~/utilities/base64.utils";

const { setLocale } = useI18n();
const route = useRoute();
const nickname = initialConfig.nickname;
const repeatRows = ref(4);

function calculateDirection(index: any): "normal" | "reverse" {
  return (index % 2 === 0) ? "reverse" : "normal";
}

const resizeEvent = function () {
  const row = document.querySelector(".background__text__row");
  const screenHeight = window.innerHeight;
  const clientHeight = row?.clientHeight || 160;
  if (clientHeight > 0) {
    repeatRows.value = Math.ceil(screenHeight / clientHeight) - 1;
  }
};

function setTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
}

onMounted(() => {
  umTrackView();
});

onBeforeMount(() => {
  const data = decodeBase64AsJson(route?.query?.data || "");
  const queryLocale = data.locale;
  const queryTheme = data.theme;
  if (queryLocale === "ru" || queryLocale === "en") {
    setLocale(queryLocale);
  }
  if (queryTheme === "dark" || queryTheme === "light") {
    setTheme(queryTheme);
  } else {
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  window.addEventListener("resize", resizeEvent);
  nextTick(() => {
    resizeEvent();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeEvent);
});
</script>

<template>
  <Body>
    <NuxtLayout>
      <div class="background__blur">
        <div class="background__text">
          <div v-for="(rowIndex) in repeatRows" :key="'row-' + rowIndex" class="background__text__row">
            <ClientOnly>
              <KeepAlive>
                <Vue3Marquee :duration="60" clone :direction="calculateDirection(rowIndex)">
                  <div class="background__text__word">
                    {{ nickname }}
                  </div>
                </Vue3Marquee>
              </KeepAlive>
            </ClientOnly>
          </div>
        </div>
      </div>
      <div id="body" class="body">
        <NuxtPage />
      </div>
    </NuxtLayout>
  </Body>
</template>

<style scoped lang="scss">
@use "@/assets/scss/screens" as *;

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

.background {
  &__blur {
    background-color: transparent;
    width: 100%;
    height: 100%;
    position: fixed;
    display: flex;
    flex-direction: row;
    filter: var(--blur);
    -webkit-filter: var(--blur);
    justify-content: center;
    align-items: center;

  }

  &__text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    font-size: var(--text-size, 6rem);
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    cursor: default;

    &__row {
      display: flex;
      justify-content: space-evenly;
      white-space: nowrap;
      width: 100%;
      word-spacing: 0.2rem;
    }

    &__word {
      font-size: 7.5rem;
      padding: 0 1.5rem;
      display: inline-flex;
      color: transparent !important;
      -webkit-text-stroke: var(--text-stroke) var(--background-word);

      @media screen and (max-width: $screen-lg) {
        font-size: 5rem;
      }
    }
  }
}
</style>
