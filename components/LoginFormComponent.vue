<script setup lang="ts">
import ActionButton from '~/components/utilities/ActionButton.vue';
import iconsConfig from '~/config/icons.config';
import { getDefaultTextColor } from '~/utilities/colors.utils';
import { decodeBase64AsJson, encodeBase64 } from '~/utilities/base64.utils';
const { t, locale } = useI18n();
const theme = useColorMode();
const route = useRoute();
const routeData = route?.query?.data || '';
const data = decodeBase64AsJson(routeData);
const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const isButtonDisabled = ref(false);
const isAlertShow = ref(false);
const alertMessage = ref('');

const openRegisterPage = () => {
  return openWindow(`/register?data=${routeData}`);
};

const openForgotPasswordPage = () => {
  return openWindow(`/account/forgotPassword?data=${routeData}`);
};

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

const focusPassword = () => {
  document?.getElementById('passwordInput')?.focus();
};

function getInputValue(elementId: string): string {
  return (<HTMLInputElement>document.getElementById(elementId))?.value?.replaceAll(' ', '');
}

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
    const inputUsername = getInputValue('usernameInput');
    const { status: response_status, code: response_code } = await $fetch('/api/authorize', {
      default: () => [],
      cache: 'no-cache',
      server: false,
      method: 'POST',
      headers: { userAgent: useDevice().userAgent },
      body: JSON.stringify({
        username: inputUsername,
        password: getInputValue('passwordInput'),
        isEmail: emailExpression.test(inputUsername),
        clientId: data.clientId || '',
        locale: data.locale || locale.value,
      }),
    });
    if (response_status) {
      switch (response_status) {
        case 'OK':
          openRedirectUrl(response_code);
          break;
        case 'EMPTY_USERNAME':
          showAlert('empty_username');
          break;
        case 'USERNAME_MUST_BE_LATIN':
          showAlert('username_latin');
          break;
        case 'SMALL_USERNAME':
          showAlert('username_length');
          break;
        case 'SMALL_PASSWORD':
          showAlert('password_length');
          break;
        case 'NOT_FOUND':
          showAlert('wrong_credentials');
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
</script>

<template>
  <div class="main blur__glass">
    <input
      type="text"
      id="usernameInput"
      name="amount"
      class="main__input"
      v-on:input="hideAlert"
      v-on:keyup.enter="focusPassword"
      :placeholder="t('username_email')"
      required />
    <input
      type="password"
      id="passwordInput"
      name="amount"
      class="main__input"
      v-on:input="hideAlert"
      v-on:keyup.enter="authorize"
      :placeholder="t('password')"
      required />
    <p v-if="isAlertShow" class="main__alert">{{ alertMessage }}</p>
    <ActionButton
      :text="t('login')"
      :icon="iconsConfig.button_login"
      color="#50C878"
      text-color="#ffffff"
      :click="authorize"
      :outline="false"
      :disabled="isButtonDisabled" />
    <ActionButton :text="t('forgotPassword')" :text-color="getDefaultTextColor(theme.value)" :click="openForgotPasswordPage" :link="true" />
    <ActionButton :text="t('registerLink')" :text-color="getDefaultTextColor(theme.value)" :click="openRegisterPage" :link="true" />
  </div>
</template>

<style scoped lang="scss">
.main {
  display: flex;
  flex-direction: column;
  padding: 2rem !important;
  padding-bottom: 1rem !important;
  text-align: center;
  width: fit-content !important;
  max-width: 100%;
  gap: 1rem;

  &__input {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    border-radius: 2rem;
    background: transparent;
    min-width: 8rem;
    padding: 1rem;
    font-weight: bold;
    font-size: 1rem;
    border: 1px solid #a782ff !important;
    color: #2c2044;
  }

  .dark &__input {
    color: #ffffff;
  }

  &__alert {
    color: #c71700 !important;
    font-weight: bold !important;
  }
}
</style>
