<script setup lang="ts">
import { ref, watch, computed } from 'vue';
const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    required: false,
  },
  enter: {
    type: Function,
    default: null,
  },
  hideAlert: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const value = ref(props.modelValue);
const error = ref('');

const validate = () => {
  if (!value.value && props.required) {
    error.value = t('field_required');
    return false;
  }
  if (value.value && props.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    error.value = emailRegex.test(value.value) ? '' : t('incorrect_email');
  }
  if (value.value && props.type === 'text' && props.id?.includes('username')) {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (value.value.length < 5) {
      error.value = t('username_length_input');
    } else if (!usernameRegex.test(value.value)) {
      error.value = t('username_latin');
    } else {
      error.value = '';
    }
  }
  if (value.value && props.type === 'password') {
    let errorStr: string = '';
    const password = value.value;
    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/.test(password)) {
      errorStr = t('error_latin_only');
    } else {
      if (password.length < 8) {
        errorStr = getMsg(errorStr, t('error_8_symbols'));
      }
      if (!/[A-Z]/.test(password)) {
        errorStr = getMsg(errorStr, t('error_no_uppercase'));
      }
      if (!/[a-z]/.test(password)) {
        errorStr = getMsg(errorStr, t('error_no_lowercase'));
      }
      if (!/\W|_/g.test(password)) {
        errorStr = getMsg(errorStr, t('error_no_special_char'));
      }
      if (!/[0-9]/.test(password)) {
        errorStr = getMsg(errorStr, t('error_no_digits'));
      }
    }

    error.value = errorStr;
  }
  return !error.value;
};

function getMsg(errorStr: string, msg: string): string {
  return `${errorStr}${hasText(errorStr) ? '\n' : ''}- ${msg}`;
}

function hasText(value: string): Boolean {
  return value.length > 0;
}

watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue;
    validate();
  }
);

watch(value, (newValue) => {
  emit('update:modelValue', newValue);
  validate();
});

const inputClasses = computed(() => ['main__input', { 'input-error': error.value }]);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  value.value = target.value.replace(/\s+/g, '');
  props.hideAlert?.();
};

const onKeyup = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && props.enter) {
    props.enter();
  }
};
</script>

<template>
  <input
    :id="id"
    :type="type"
    :value="value"
    :placeholder="placeholder"
    :autofocus="autofocus"
    :style="`border: 1px solid ${error ? '#c71700' : '#A782FF'} !important`"
    @input="onInput"
    @keyup="onKeyup" />
  <p v-if="error" class="main__alert">{{ error }}</p>
</template>

<style scoped>
input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 2rem;
  background: transparent;
  min-width: 8rem;
  padding: 1rem;
  font-weight: bold;
  font-size: 1rem;
}

.main__alert {
  color: #c71700 !important;
  text-align: center;
  white-space: pre-line;
}
</style>
