<script setup lang="ts">
import ActionButton from '~/components/utilities/ActionButton.vue';
import FlexButton from '~/components/utilities/FlexButton.vue';
import iconsConfig from '~/config/icons.config';
import { getDefaultTextColor } from '~/utilities/colors.utils';

const { t } = useI18n();
const route = useRoute();
const theme = useColorMode();
const cookies = useCookie('cookies');

function acceptCookies() {
  cookies.value = 'accepted';
}
</script>

<template>
  <div class="content blur__glass" v-if="cookies !== 'accepted'">
    <h6>{{ t('cookies') }}</h6>
    <p>{{ t('cookies_description') }}</p>
    <div class="content__buttons">
      <ActionButton
        :text="t('cookies_button_accept')"
        text-color="#ffffff"
        :icon="iconsConfig.accept"
        color="#009a00"
        :transparent="false"
        @click="acceptCookies()" />
      <FlexButton
        :text="t('cookies_button_info')"
        :text-color="getDefaultTextColor(theme.value)"
        :icon="iconsConfig.info"
        color="transparent"
        :transparent="true"
        :link="`/docs/cookies?data=${route?.query?.data}`" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '/assets/scss/screens.scss' as *;

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 30rem;
  gap: 1rem;

  &__description {
    word-wrap: break-word;
  }

  &__buttons {
    gap: 1rem;
    display: flex;
    flex-direction: row;
  }

  @media screen and (max-width: $screen-xss) {
    width: 90%;
  }
}

.blur__glass {
  padding: 1rem;
}
</style>
