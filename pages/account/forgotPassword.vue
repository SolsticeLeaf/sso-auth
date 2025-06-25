<script setup lang="ts">
import ActionButton from '~/components/utilities/ActionButton.vue';
import BaseInput from '~/components/utilities/BaseInput.vue';
import { decodeBase64AsJson } from '~/utilities/base64.utils';
import { getDefaultTextColor } from '~/utilities/colors.utils';

const { t } = useI18n();
const theme = useColorMode();
const route = useRoute();
const routeData = route?.query?.data || '';
const data = decodeBase64AsJson(route?.query?.data || '');
const isAlertShow = ref(false);
const alertMessage = ref('');

const openLoginPage = () => {
  openWindow(`/login?data=${routeData}`);
};

function openWindow(url: string) {
  window.location.assign(url);
  window.open(url, '_self');
}

function showAlert(message: string) {
  isAlertShow.value = true;
  alertMessage.value = t(message);
}

function hideAlert() {
  isAlertShow.value = false;
}

const email = ref('');
const isButtonDisabled = ref(false);
const lastEmailSentTime = ref(0);

const setupEmail = async () => {
  try {
    hideAlert();
    const currentTime = Date.now();
    if (currentTime - lastEmailSentTime.value < 60000) {
      showAlert('email_rate_limit');
      return;
    }
    isButtonDisabled.value = true;
    const response = await $fetch<{ status: string }>('/api/system/passwordRecovery', {
      cache: 'no-cache',
      method: 'POST',
      headers: { userAgent: useDevice().userAgent },
      body: JSON.stringify({ email: email.value.replaceAll(' ', ''), routeData: data }),
    });
    if (response.status) {
      console.log('✅status:', response.status);
      switch (response.status) {
        case 'OK':
          lastEmailSentTime.value = currentTime;
          showAlert('password_recovery_sent');
          break;
        case 'INCORRECT_EMAIL':
          showAlert('incorrect_email');
          break;
        case 'NO_EMAIL':
          showAlert('empty_email');
          break;
        case 'ERROR':
          showAlert('unknown_error');
          break;
      }
    }
  } catch (error) {
    console.error(`🔑❌ Error during password recovery for email "${email.value}":`, error);
    showAlert('unknown_error');
  } finally {
    isButtonDisabled.value = false;
  }
};
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
            <h6>{{ t('forgotPasswordPage') }}</h6>
            <BaseInput v-model="email" type="email" id="emailInput" :placeholder="t('email')" :required="true" :enter="setupEmail" />
            <p v-if="isAlertShow">{{ alertMessage }}</p>
            <ActionButton
              :text="t('submit')"
              color="#50C878"
              text-color="#ffffff"
              class="main__button"
              :click="setupEmail"
              :outline="false"
              :disabled="isButtonDisabled" />
            <ActionButton :text="t('back_login')" :text-color="getDefaultTextColor(theme.value)" class="main__button" :click="openLoginPage" :link="true" />
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
  white-space: pre-line;
}

.blur__glass {
  padding: 0;
}
</style>
