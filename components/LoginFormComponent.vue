<script setup lang="ts">
import ActionButton from "~/components/utilities/ActionButton.vue";
import iconsConfig from "~/config/icons.config";
import {decodeBase64AsJson} from "~/utilities/base64.utils";
const { t } = useI18n()
const route = useRoute();
const routeData = route?.query?.data || "";
const data = decodeBase64AsJson(routeData);

const isButtonDisabled = ref(false);
const isAlertShow = ref(false);
const alertMessage = ref('');

const openRegisterPage = () => {
  return openWindow(`/register?data=${routeData}`);
}

const openReturnUrl = () => {
  hideAlert();
  openWindow(`/login/emailVerify?data=${routeData}`);
}

const focusPassword = () => {
  document?.getElementById('passwordInput')?.focus();
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
const authorize = async () => {
  isButtonDisabled.value = true;
  try {
    const { status: response_status } = await $fetch('/api/authorize', {
      default: () => [],
      cache: "no-cache",
      server: false,
      method: 'POST',
      body: JSON.stringify({
        username: getInputValue("usernameInput"),
        password: getInputValue("passwordInput"),
        apiPath: data.apiPath || ''
      })
    });
    if (response_status) {
      switch (response_status) {
        case "VERIFIED": openReturnUrl(); break;
        case "NOT_VERIFIED": openReturnUrl(); break;
        case "EMPTY_USERNAME": showAlert(t('empty_username')); break;
        case "SMALL_USERNAME": showAlert(t('username_length')); break;
        case "SMALL_PASSWORD": showAlert(t('password_length')); break;
        case "NOT_FOUND": showAlert(t('wrong_credentials')); break;
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
  <div class="main">
    <input
        type="text"
        id="usernameInput"
        name="amount"
        class="main__input"
        v-on:input="hideAlert"
        v-on:keyup.enter="focusPassword"
        :placeholder="t('username')"
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
    <p v-if="isAlertShow" class="main__alert">{{alertMessage}}</p>
    <ActionButton :text="t('login')"
                  :icon="iconsConfig.button_login"
                  color="--button-color"
                  text-color="--text-color-light"
                  class="main__button"
                  :click="authorize"
                  :outline="false"
                  :disabled="isButtonDisabled" />
    <ActionButton :text="t('registerLink')"
                  text-color="--text-color-primary"
                  class="main__button"
                  :click="openRegisterPage"
                  :link="true" />
  </div>
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
