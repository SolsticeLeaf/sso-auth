<script setup lang="ts">
import FlexButton from '~/components/utilities/FlexButton.vue';
import { textFormat } from '~/utilities/text.utils';
import { getDefaultTextColor } from '~/utilities/colors.utils';
import iconsConfig from '~/config/icons.config';
const { t, locale } = useI18n();
const route = useRoute();
const theme = useColorMode();

const isLoaded = ref(false);
const data = ref<any>();

onBeforeMount(async () => {
  try {
    const { data: response_data } = await $fetch('/api/docs/getDoc', {
      default: () => [],
      cache: 'no-cache',
      server: false,
      method: 'POST',
      body: JSON.stringify({
        page: 'terms-of-use',
      }),
    });
    data.value = response_data;
  } finally {
    isLoaded.value = true;
  }
});

function getLocaleObjects(): any[] {
  const locales = data.value.locales;
  if (locale.value in locales) {
    const objects = (locales[locale.value] as any[]).sort((a, b) => a.index - b.index);
    return objects;
  }
  return (locales.en as any[]).sort((a, b) => a.index - b.index);
}
</script>

<template>
  <ClientOnly>
    <KeepAlive>
      <div class="body">
        <div class="wrapper blur__glass" v-if="isLoaded">
          <div class="text">
            <FlexButton
              :text="t('back_login')"
              :text-color="getDefaultTextColor(theme.value)"
              :icon="iconsConfig.arrow_left"
              color="transparent"
              :transparent="true"
              :link="`/login?data=${route?.query?.data}`" />
            <div v-for="obj in getLocaleObjects()">
              <h4 v-if="obj.type === 'title'">{{ obj.text }}</h4>
              <h5 v-if="obj.type === 'subTitle'">{{ obj.text }}</h5>
              <div v-if="obj.type === 'text'" class="text__paragraph">
                <p v-for="line in textFormat(obj.text)">
                  {{ line }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </KeepAlive>
  </ClientOnly>
</template>

<style scoped lang="scss">
.body {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 1rem;
  max-height: fit-content;
  align-items: center;
  width: 100vw;
  gap: 1rem;
  padding-bottom: 3rem;
}

.wrapper {
  display: flex;
  flex-direction: column;
  height: fit-content;
  width: 50%;
}

.text {
  display: flex;
  flex-direction: column;
  white-space: pre-line;
  gap: 2rem;
  padding: 1rem;

  &__paragraph {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}

h4,
h5 {
  width: 100%;
  text-align: center;
}

p {
  text-indent: 2rem;
}

.blur__glass {
  padding: 1rem;
}
</style>
