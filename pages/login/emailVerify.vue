<script setup lang="ts">
import iconsConfig from "~/config/icons.config";
import ActionButton from "~/components/utilities/ActionButton.vue";
import {decodeBase64AsJson} from "~/utilities/base64.utils";

const { t } = useI18n()
const route = useRoute();
const routeData = route?.query?.data || "";
const data = decodeBase64AsJson(route?.query?.data || "");

const message = ref('wait')
const retryButton = ref(false);
const backButton = ref(false);

const openLoginPage = () => {
  openWindow(`/login?data=${routeData}`);
}

const openReturnUrl = () => {
  openWindow(data.returnUrl || '/');
}

function openWindow(url: string) {
  window.location.assign(url);
  window.open(url, "_self")
}

onBeforeMount(async () => {
  await check();
})

const check = async () => {
  try {
    setMessage('wait', 'none');
    const { status: response_status } = await $fetch('/api/userVerify', {
      default: () => [],
      cache: "no-cache",
      server: false,
      method: 'POST',
      body: JSON.stringify({
        routeData: data
      })
    });
    if (response_status) {
      switch (response_status) {
        case "OK":
          openReturnUrl();
          break;
        case "EXPIRED":
          setMessage('code_expired', 'retry');
          break;
        case "ALREADY_SENT":
          setMessage('email_already_sent', 'back');
          break;
        case "CODE_SENT":
          setMessage('email_sent', 'back');
          break;
        case "CODE_NOT_SENT":
          setMessage('email_not_sent', 'retry');
          break;
        case "TOKEN_NOT_FOUND":
          openLoginPage();
          break;
        case "ERROR":
          setMessage('unknown_error', 'retry');
          break;
        default: break;
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Unknown error occurred.');
  }
}

function setMessage(msg: string, button: 'none' | 'retry' | 'back') {
  message.value = msg;
  switch (button) {
    case 'retry':
      retryButton.value = true;
      break;
    case 'back':
      backButton.value = true;
      break;
    default:
      retryButton.value = false;
      backButton.value = false;
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
        <div id="hero" class="wrapper blur__glass">
          <div class="main">
            <h6>{{t('registerPreCompletePage')}}</h6>
            <p>{{ t(message) }}</p>
            <ActionButton v-if="retryButton"
                          :text="t('send_code')"
                          :icon="iconsConfig.repeat"
                          color="--button-send-color"
                          text-color="--text-color-black"
                          class="main__button"
                          :click="check"
                          :outline="false"
                          :disabled="false" />
            <ActionButton v-else v-if="backButton"
                          :text="t('back_login')"
                          :icon="iconsConfig.arrow_left"
                          color="--button-color"
                          text-color="--text-color-light"
                          class="main__button"
                          :click="openLoginPage"
                          :outline="false"
                          :disabled="false" />
          </div>
        </div>
      </div>
    </KeepAlive>
  </ClientOnly>
</template>

<style scoped lang="scss">
@use "../../assets/scss/screens" as *;

.logo {
  display: flex;
  flex-direction: row;
  gap: 1rem;

  &__second {
    background: var(--logo-gradient);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

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
