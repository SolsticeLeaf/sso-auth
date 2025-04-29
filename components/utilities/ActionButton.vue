<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  text: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#50C878',
  },
  textColor: {
    type: String,
    default: 'white',
  },
  click: {
    type: Function,
    default: () => {},
  },
  link: {
    type: Boolean,
    default: false,
  },
  noLoadingIcon: {
    type: Boolean,
    default: false,
  },
  outline: {
    type: Boolean,
    default: false,
  },
});

const buttonStyle = computed(() => ({
  backgroundColor: props.outline ? 'transparent' : props.color,
  padding: '0.5rem 1rem',
  filter: props.disabled ? 'brightness(80%)' : 'none',
  border: `2px solid ${props.color}`,
}));

const textStyle = computed(() => ({
  color: props.textColor,
  fontWeight: 'bold',
}));

function onClick() {
  if (!props.disabled) {
    props.click();
  }
}
</script>

<template>
  <div @click="onClick" class="button" :style="props.link ? '' : buttonStyle">
    <Icon :name="props.disabled ? (props.noLoadingIcon ? '' : 'line-md:loading-loop') : props.icon" class="button__img" :style="textStyle"></Icon>
    <p :style="textStyle">{{ props.text }}</p>
  </div>
</template>

<style scoped lang="scss">
* {
  cursor: pointer;
  user-select: none;
}

.button {
  align-items: center;
  justify-content: center;
  display: flex;
  gap: 0.5rem;
  text-decoration: none;
  border-radius: 2rem;
  transition: background-color 0.3s, transform 0.2s, color 0.3s;

  &__img {
    font-size: 1.5rem;
  }
}

.button:hover {
  opacity: 0.8;
}

.button:active {
  transform: scale(0.95);
}
</style>
