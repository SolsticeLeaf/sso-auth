<script setup lang="ts">
import ActionButton from "~/components/utilities/ActionButton.vue";
import BaseInput from "~/components/utilities/BaseInput.vue";

const { t } = useI18n()
const route = useRoute();
const routeData = route?.query?.data || "";
const isAlertShow = ref(false);
const alertMessage = ref('');

const openLoginPage = () => {
  openWindow(`/login?data=${routeData}`);
}

const openRedirectUrl = () => {
  openWindow(`/login/emailVerify?data=${routeData}`);
}

function openWindow(url: string) {
  window.location.assign(url);
  window.open(url, "_self")
}

function showAlert(message: string) {
  isAlertShow.value = true;
  alertMessage.value = t(message);
}

function hideAlert() {
  isAlertShow.value = false;
}

const email = ref('');
const setupEmail = async () => {
  try {
    hideAlert();
    const { status: response_status } = await $fetch('/api/changeEmail', {
      default: () => [],
      cache: "no-cache",
      server: false,
      method: 'POST',
      body: JSON.stringify({
        email: email.value.replaceAll(' ', ''),
        userAgent: useDevice().userAgent
      })
    });
    if (response_status) {
      switch (response_status) {
        case "OK":
          openRedirectUrl();
          break;
        case "INCORRECT_EMAIL":
          showAlert('incorrect_email');
          break;
        case "NO_EMAIL":
          showAlert('empty_email');
          break;
        case "ERROR":
          showAlert('unknown_error');
          break;
        case "NOT_FOUND":
          openLoginPage();
          break;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Unknown error occurred.');
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
        <div id="hero" class="wrapper blur__glass">
          <div class="main">
            <h6>{{t('setupEmailPage')}}</h6>
            <BaseInput
                v-model="email"
                type="email"
                id="emailInput"
                :placeholder="t('email')"
                :required="true"
                :enter="setupEmail"
            />
            <p v-if="isAlertShow">{{alertMessage}}</p>
            <ActionButton :text="t('submit')"
                          color="--button-color"
                          text-color="--text-color-light"
                          class="main__button"
                          :click="setupEmail"
                          :outline="false"
                          :disabled="false" />
            <ActionButton :text="t('back_login')"
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
  white-space: pre-line;
}
</style>
