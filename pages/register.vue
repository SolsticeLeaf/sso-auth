<script setup lang="ts">
import ActionButton from "~/components/utilities/ActionButton.vue";
import iconsConfig from "~/config/icons.config";
const { t } = useI18n()
const route = useRoute();
const routeData = route?.query?.data || "";

const isButtonDisabled = ref(false);
const isAlertShow = ref(false);
const alertMessage = ref('');

const openLoginPage = () => {
  openWindow(`/login?data=${routeData}`);
}

const openReturnUrl = () => {
  hideAlert();
  openWindow(`/login/emailVerify?data=${routeData}`);
}

const focusUsername = () => {
  document?.getElementById('passwordInput')?.focus();
}

const focusPassword = () => {
  document?.getElementById('passwordInput')?.focus();
}

const focusPasswordRepeat = () => {
  document?.getElementById('passwordRepeatInput')?.focus();
}

function getInputValue(elementId: string): string {
  return (<HTMLInputElement> document.getElementById(elementId))?.value?.replaceAll(' ', '');
}

function showAlert(message: string) {
  isAlertShow.value = true;
  alertMessage.value = message;
}

function hideAlert() {
  isAlertShow.value = false;
}

function openWindow(url: string) {
  window.location.assign(url);
  window.open(url, "_self")
}
const register = async () => {
  isButtonDisabled.value = true;
  try {
    const { status: response_status } = await $fetch('/api/register', {
      default: () => [],
      cache: "no-cache",
      server: false,
      method: 'POST',
      body: JSON.stringify({
        email: getInputValue("emailInput"),
        username: getInputValue("usernameInput"),
        password: getInputValue("passwordInput"),
        passwordRepeat: getInputValue("passwordRepeatInput")
      })
    });
    if (response_status) {
      switch (response_status) {
        case "OK": hideAlert(); openReturnUrl(); break;
        case "EMPTY_EMAIL": showAlert(t('empty_email')); break;
        case "EMPTY_USERNAME": showAlert(t('empty_username')); break;
        case "SMALL_USERNAME": showAlert(t('username_length')); break;
        case "SMALL_PASSWORD": showAlert(t('password_length')); break;
        case "EMPTY_PASSWORD_REPEAT": showAlert(t('empty_password_repeat')); break;
        case "INCORRECT_EMAIL": showAlert(t('incorrect_email')); break;
        case "PASSWORD_MISMATCH": showAlert(t('passwords_not_match')); break;
        case "USERNAME_EXISTS": showAlert(t('wrong_credentials')); break;
        default: showAlert(t('unknown_error')); break;
      }
    } else {
      showAlert(t('unknown_error'));
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert(t('unknown_error'));
  }
  isButtonDisabled.value = false;
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
        <div id="hero" class="wrapper blur__glass">
          <div class="main">
            <h6>{{t('registerPage')}}</h6>
            <input
                type="text"
                id="emailInput"
                class="main__input"
                v-on:input="hideAlert"
                v-on:keyup.enter="focusUsername"
                :placeholder="t('email')"
                required />
            <input
                type="text"
                id="usernameInput"
                class="main__input"
                v-on:input="hideAlert"
                v-on:keyup.enter="focusPassword"
                :placeholder="t('username')"
                required />
            <input
                type="password"
                id="passwordInput"
                class="main__input"
                v-on:input="hideAlert"
                v-on:keyup.enter="focusPasswordRepeat"
                :placeholder="t('password')"
                required />
            <input
                type="password"
                id="passwordRepeatInput"
                class="main__input"
                v-on:input="hideAlert"
                v-on:keyup.enter="register"
                :placeholder="t('password_repeat')"
                required />
            <p v-if="isAlertShow">{{alertMessage}}</p>
            <ActionButton :text="t('register')"
                          :icon="iconsConfig.button_register"
                          color="--button-color"
                          text-color="--text-color-light"
                          class="main__button"
                          :click="register"
                          :outline="false"
                          :disabled="isButtonDisabled" />
            <ActionButton :text="t('loginLink')"
                          text-color="--text-color-primary"
                          class="main__button"
                          :click="openLoginPage"
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
  width: fit-content;
  align-content: center;
  text-align: center;
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
    border: 1px solid var(--input-border) !important;
    color: var(--text-color-primary) !important;
  }

  &__alert {
    color: var(--text-alert) !important;
    font-weight: bold !important;
  }
}
</style>
