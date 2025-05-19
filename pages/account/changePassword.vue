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

const password = ref('');
const passwordRepeat = ref('');
const isButtonDisabled = ref(false);
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

function hasText(value: string): boolean {
  return value.replaceAll(' ', '').length > 0;
}

const focusPasswordRepeat = () => {
  document?.getElementById('passwordRepeatInput')?.focus();
};

const allFieldsHasText = computed(() => {
  return hasText(password.value) && hasText(passwordRepeat.value);
});

const changePassword = async () => {
  isButtonDisabled.value = true;
  try {
    const response = await $fetch<{ status: string }>('/api/changePassword', {
      cache: 'no-cache',
      method: 'POST',
      headers: { userAgent: useDevice().userAgent },
      body: JSON.stringify({
        password: password.value.replaceAll(' ', ''),
        passwordRepeat: passwordRepeat.value.replaceAll(' ', ''),
        routeData: data,
      }),
    });
    if (response.status) {
      switch (response.status) {
        case 'OK':
          hideAlert();
          openLoginPage();
          break;
        case 'SMALL_PASSWORD':
          showAlert('password_length');
          break;
        case 'EMPTY_PASSWORD_REPEAT':
          showAlert('empty_password_repeat');
          break;
        case 'PASSWORD_MISMATCH':
          showAlert('passwords_not_match');
          break;
        case 'PASSWORD_ONLY_LATIN':
          showAlert('password_only_latin');
          break;
        case 'PASSWORD_NO_UPPERCASE':
          showAlert('password_no_uppercase');
          break;
        case 'PASSWORD_NO_LOWERCASE':
          showAlert('password_no_lowercase');
          break;
        case 'PASSWORD_NO_DIGIT':
          showAlert('password_no_digit');
          break;
        case 'PASSWORD_NO_SPECIAL_CHAR':
          showAlert('password_no_special_char');
          break;
        case 'TOKEN_EXPIRED':
          showAlert('code_expired');
          break;
        case 'TOKEN_NOT_FOUND':
          showAlert('notFound');
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
  <ClientOnly>
    <KeepAlive>
      <div class="displayed">
        <div class="logo">
          <h1 class="logo__first">SLEAF</h1>
          <h1 class="logo__second">AUTH</h1>
        </div>
        <div id="hero" class="wrapper">
          <div class="main blur__glass">
            <h6>{{ t('changePasswordPage') }}</h6>
            <BaseInput
              v-model="password"
              type="password"
              id="passwordInput"
              :placeholder="t('password')"
              :required="true"
              :enter="focusPasswordRepeat"
              :hideAlert="hideAlert" />
            <BaseInput
              v-model="passwordRepeat"
              type="password"
              id="passwordRepeatInput"
              :placeholder="t('password_repeat')"
              :required="true"
              :enter="changePassword"
              :hideAlert="hideAlert" />
            <p v-if="isAlertShow">{{ alertMessage }}</p>
            <ActionButton
              :text="t('change_password')"
              color="#50C878"
              text-color="#ffffff"
              class="main__button"
              :click="changePassword"
              :outline="false"
              :noLoadingIcon="!allFieldsHasText"
              :disabled="isButtonDisabled || !allFieldsHasText" />
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
