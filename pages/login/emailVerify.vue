<script setup lang="ts">
import iconsConfig from '~/config/icons.config';
import ActionButton from '~/components/utilities/ActionButton.vue';
import { decodeBase64AsJson } from '~/utilities/base64.utils';
import { getDefaultTextColor } from '~/utilities/colors.utils';

const { t } = useI18n();
const theme = useColorMode();
const route = useRoute();
const routeData = route?.query?.data || '';
const data = decodeBase64AsJson(route?.query?.data || '');

const showTitle = ref(false);
const message = ref('wait');
const retryButton = ref(false);
const backButton = ref(false);
const setupEmailButton = ref(false);

const openLoginPage = () => {
  openWindow(`/login?data=${routeData}`);
};

const openEmailSetupPage = () => {
  openWindow(`/account/email?data=${routeData}`);
};
const openRedirectUrl = () => {
  openWindow(data.redirectUrl || '/');
};

function openWindow(url: string) {
  window.location.assign(url);
  window.open(url, '_self');
}

onBeforeMount(async () => {
  await check();
});

const check = async () => {
  try {
    setMessage('wait', 'none');
    const { status: response_status } = await $fetch('/api/system/userVerify', {
      default: () => [],
      cache: 'no-cache',
      server: false,
      method: 'POST',
      headers: { userAgent: useDevice().userAgent },
      body: JSON.stringify({ routeData: data }),
    });
    if (response_status) {
      console.log('✅status:', response_status);
      switch (response_status) {
        case 'OK':
          openRedirectUrl();
          break;
        case 'EXPIRED':
          setMessage('code_expired', 'retry');
          break;
        case 'NO_EMAIL':
          setMessage('no_email_alert', 'setupEmail');
          break;
        case 'ALREADY_SENT':
          setMessage('email_already_sent', 'back');
          break;
        case 'CODE_SENT':
          setMessage('email_sent', 'back');
          break;
        case 'CODE_NOT_SENT':
          setMessage('email_not_sent', 'retry');
          break;
        case 'TOKEN_NOT_FOUND':
          setMessage('notFound', 'back');
          break;
        case 'ERROR':
          setMessage('unknown_error', 'retry');
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.error(`🕵️‍♂️❌ Error during email verification for user "${data.userId}":`, error);
    alert('Unknown error occurred.');
    setMessage('unknown_error', 'retry');
  }
};

function setMessage(msg: string, button: 'none' | 'retry' | 'back' | 'setupEmail') {
  message.value = msg;
  showTitle.value = msg !== 'wait';
  switch (button) {
    case 'retry':
      retryButton.value = true;
      break;
    case 'back':
      backButton.value = true;
      break;
    case 'setupEmail':
      setupEmailButton.value = true;
      break;
    default:
      retryButton.value = false;
      backButton.value = false;
      setupEmailButton.value = false;
      break;
  }
}
</script>

<template>
  <ClientOnly>
    <KeepAlive>
      <div class="displayed">
        <div class="logo">
          <h1 class="logo__first">SLEAF</h1>
          <h1 class="logo__second">AUTH</h1>
        </div>
        <div id="hero" class="wrapper">
          <div class="main blur__glass">
            <h6 v-if="showTitle">{{ t('registerPreCompletePage') }}</h6>
            <p>{{ t(message) }}</p>
            <ActionButton
              v-if="retryButton"
              :text="t('send_code')"
              :icon="iconsConfig.repeat"
              color="#dcc944"
              text-color="#1a1a1a"
              class="main__button"
              :click="check"
              :outline="false"
              :disabled="false" />
            <ActionButton
              v-if="backButton"
              :text="t('back_login')"
              :icon="iconsConfig.arrow_left"
              color="#50C878"
              text-color="#ffffff"
              class="main__button"
              :click="openLoginPage"
              :outline="false"
              :disabled="false" />
            <ActionButton
              v-if="setupEmailButton"
              :text="t('setup_email')"
              color="#50C878"
              text-color="#ffffff"
              class="main__button"
              :click="openEmailSetupPage"
              :outline="false"
              :disabled="false" />
            <ActionButton
              v-if="retryButton || backButton"
              :text="t('change_email')"
              :text-color="getDefaultTextColor(theme.value)"
              class="main__button"
              :click="openEmailSetupPage"
              :link="true" />
          </div>
        </div>
      </div>
    </KeepAlive>
  </ClientOnly>
</template>

<style scoped lang="scss">
.main {
  display: flex;
  flex-direction: column;
  padding: 2rem !important;
  text-align: center;
  width: fit-content !important;
  max-width: 100%;
  gap: 1rem;
}

.blur__glass {
  padding: 0;
}
</style>
