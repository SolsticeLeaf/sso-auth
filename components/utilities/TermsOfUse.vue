<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
</script>

<template>
  <div class="terms">
    <p>{{ t('terms_1') }}</p>
    <NuxtLink class="link" :to="`/docs/terms-of-use?data=${route?.query?.data}`"
      ><p>{{ t('terms_2') }}</p></NuxtLink
    >
    <p>{{ t('terms_3') }}</p>
    <NuxtLink class="link" :to="`/docs/personal-data?data=${route?.query?.data}`"
      ><p>{{ t('terms_4') }}</p></NuxtLink
    >
    <p>{{ t('terms_5') }}</p>
    <NuxtLink class="link" :to="`/docs/privacy-policy?data=${route?.query?.data}`"
      ><p>{{ t('terms_6') }}</p></NuxtLink
    >
  </div>
</template>

<style scoped lang="scss">
@use '/assets/scss/screens.scss' as *;

.terms {
  display: flex;
  flex-direction: row;
  text-align: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.3rem;
  width: 90%;
  z-index: 20;
  color: #00000097;
}

.dark .terms {
  color: #ffffff97;
}

.link {
  z-index: 200;
  color: #00000097;
}

.link:hover {
  cursor: pointer;
}

.dark .link {
  color: #ffffff97;
}

p {
  font-size: 0.9rem;

  @media screen and (max-width: $screen-lg) {
    font-size: 0.8rem;
  }
}
</style>
