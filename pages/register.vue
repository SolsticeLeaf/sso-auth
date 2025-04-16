<script setup lang="ts">
import ActionButton from "~/components/utilities/ActionButton.vue";
import iconsConfig from "~/config/icons.config";
import BaseInput from "~/components/utilities/BaseInput.vue";
const { t } = useI18n()
const route = useRoute();
const routeData = route?.query?.data || "";

const email = ref('');
const username = ref('');
const password = ref('');
const passwordRepeat = ref('');

const isButtonDisabled = ref(false);
const isAlertShow = ref(false);
const alertMessage = ref('');

onBeforeMount(async () => {
  try {
    const { status: response_status, user: response_data } = await $fetch('/api/checkAuthStatus', {
      default: () => [],
      cache: "no-cache",
      server: false,
      method: 'POST',
      body: JSON.stringify({
        userAgent: useDevice().userAgent
      })
    });
    if (response_status === "OK") {
      openLoginPage();
    }
  } catch {}
});

const openLoginPage = () => {
  openWindow(`/login?data=${routeData}`);
}

const openRedirectUrl = () => {
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

function showAlert(message: string) {
  isAlertShow.value = true;
  alertMessage.value = t(message);
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
        email: email.value.replaceAll(' ', ''),
        username: username.value.replaceAll(' ', ''),
        password: password.value.replaceAll(' ', ''),
        passwordRepeat: passwordRepeat.value.replaceAll(' ', ''),
        userAgent: useDevice().userAgent
      })
    });
    if (response_status) {
      switch (response_status) {
        case "OK": hideAlert(); openRedirectUrl(); break;
        case "EMPTY_EMAIL": showAlert('empty_email'); break;
        case "EMPTY_USERNAME": showAlert('empty_username'); break;
        case "SMALL_USERNAME": showAlert('username_length'); break;
        case "SMALL_PASSWORD": showAlert('password_length'); break;
        case "USERNAME_MUST_BE_LATIN": showAlert('username_latin'); break;
        case "BAD_WORD": showAlert('username_bad_word'); break;
        case "EMPTY_PASSWORD_REPEAT": showAlert('empty_password_repeat'); break;
        case "INCORRECT_EMAIL": showAlert('incorrect_email'); break;
        case "PASSWORD_MISMATCH": showAlert('passwords_not_match'); break;
        case "PASSWORD_ONLY_LATIN": showAlert('password_only_latin'); break;
        case "PASSWORD_NO_UPPERCASE": showAlert('password_no_uppercase'); break;
        case "PASSWORD_NO_LOWERCASE": showAlert('password_no_lowercase'); break;
        case "PASSWORD_NO_DIGIT": showAlert('password_no_digit'); break;
        case "PASSWORD_NO_SPECIAL_CHAR": showAlert('password_no_special_char'); break;
        case "USERNAME_EXISTS": showAlert('username_exist'); break;
        case "EMAIL_EXISTS": showAlert('email_exist'); break;
        default: showAlert('unknown_error'); break;
      }
    } else {
      showAlert('unknown_error');
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('unknown_error');
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
            <BaseInput
                v-model="email"
                type="email"
                id="emailInput"
                :placeholder="t('email')"
                :required="true"
                :enter="focusUsername"
                :hideAlert="hideAlert"
            />
            <BaseInput
                v-model="username"
                type="text"
                id="usernameInput"
                :placeholder="t('username')"
                :required="true"
                :enter="focusPassword"
                :hideAlert="hideAlert"
            />
            <BaseInput
                v-model="password"
                type="password"
                id="passwordInput"
                :placeholder="t('password')"
                :required="true"
                :enter="focusPasswordRepeat"
                :hideAlert="hideAlert"
            />
            <BaseInput
                v-model="passwordRepeat"
                type="password"
                id="passwordRepeatInput"
                :placeholder="t('password_repeat')"
                :required="true"
                :enter="register"
                :hideAlert="hideAlert"
            />

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
.input-error {
  border: 1px solid red !important;
}

.main__alert {
  color: red;
  font-size: 0.8rem;
  text-align: left;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
  white-space: pre-line;
}

.main {
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-content: center;
  text-align: center;
  gap: 1rem;

  &__alert {
    color: var(--text-alert) !important;
    font-weight: bold !important;
  }
}
</style>
