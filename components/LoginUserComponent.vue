<script setup lang="ts">
import ActionButton from '~/components/utilities/ActionButton.vue';
import iconsConfig from '~/config/icons.config';
import { decodeBase64AsJson, encodeBase64 } from '~/utilities/base64.utils';
const { t } = useI18n();
const theme = useColorMode();
const route = useRoute();
const routeData = route?.query?.data || '';
const data = decodeBase64AsJson(routeData);

const isButtonDisabled = ref(false);
const isAlertShow = ref(false);
const alertMessage = ref('');

const props = defineProps({
  data: {
    type: Object,
    default: {},
  },
});
const openRedirectUrl = (code: string) => {
  hideAlert();
  const route = encodeBase64(
    JSON.stringify({
      locale: data.locale,
      theme: data.theme,
      redirectUrl: `${data.redirectUrl}${code.length > 0 ? code : ''}`,
      submitCode: data.submitCode,
      clientId: data.clientId,
    })
  );
  openWindow(`/login/emailVerify?data=${route}`);
};

function showAlert(message: string) {
  isAlertShow.value = true;
  alertMessage.value = t(message);
}

function hideAlert() {
  isAlertShow.value = false;
}

function openWindow(url: string) {
  window.location.assign(url);
  window.open(url, '_self');
}
const authorize = async () => {
  isButtonDisabled.value = true;
  try {
    const { status: response_status, code: response_code } = await $fetch('/api/authorize', {
      default: () => [],
      cache: 'no-cache',
      server: false,
      method: 'POST',
      headers: { userAgent: useDevice().userAgent },
      body: JSON.stringify({
        username: '',
        password: '',
        isEmail: false,
        clientId: data.clientId || '',
      }),
    });
    if (response_status) {
      switch (response_status) {
        case 'OK':
          openRedirectUrl(response_code);
          break;
        default:
          showAlert('unknown_error');
          break;
      }
    } else {
      showAlert('unknown_error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('unknown_error');
  }
  isButtonDisabled.value = false;
};

const exitAccount = async () => {
  try {
    await $fetch('/api/logoutAccount', {
      default: () => [],
      cache: 'no-cache',
      server: false,
      method: 'GET',
    });
  } catch (error) {
    console.error('Error:', error);
    showAlert('unknown_error');
  }
  location.reload();
};

const emailSignatureStyle = computed(() => {
  if (props.data.email.length === 0) {
    return '#c71700';
  }
  if (props.data.emailStatus !== 'VERIFIED') {
    return '#dcc944';
  }
  return '#50C878';
});
</script>

<template>
  <div class="main">
    <div class="main__userinfo transparent__glass">
      <LazyNuxtImg :src="props.data.avatar" class="main__userinfo__avatar" />
      <div class="main__userinfo__info">
        <h6>{{ props.data.username }}</h6>
        <div class="main__userinfo__info__email">
          <p :style="'color:' + emailSignatureStyle">*</p>
          {{ props.data.email || t('no_email') }}
        </div>
      </div>
    </div>
    <p v-if="isAlertShow" class="main__alert">{{ alertMessage }}</p>
    <ActionButton
      :text="t('login')"
      :icon="iconsConfig.button_login"
      color="#50C878"
      text-color="#ffffff"
      class="main__button"
      :click="authorize"
      :outline="false"
      :disabled="isButtonDisabled" />
    <ActionButton
      :text="t('change_account')"
      :icon="iconsConfig.button_logout"
      :text-color="theme.value === 'dark' ? '#ffffff' : '#2C2044'"
      class="main__button"
      :click="exitAccount"
      :link="true" />
  </div>
</template>

<style scoped lang="scss">
.transparent__glass {
  padding: 0.8rem 1rem;
}

.main {
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-content: center;
  text-align: center;
  gap: 1rem;

  &__userinfo {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    justify-content: center;

    &__avatar {
      height: 3rem;
    }

    &__info {
      vertical-align: middle;
      justify-content: center;
      text-align: start;
      display: flex;
      flex-direction: column;
      line-height: 1.5rem;

      &__email {
        display: flex;
        flex-direction: row;
        gap: 0.2rem;
      }
    }
  }

  &__alert {
    color: #c71700 !important;
    font-weight: bold !important;
  }
}
</style>
