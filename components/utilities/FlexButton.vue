<script setup lang="ts">
const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  align: {
    type: String,
    default: 'center',
  },
  transparent: {
    type: Boolean,
    default: false,
  },
  textBold: {
    type: Boolean,
    default: true,
  },
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: '#50C878',
  },
  textColor: {
    type: String,
    default: 'white',
  },
  link: {
    type: String,
    default: '#',
  },
  outline: {
    type: Boolean,
    default: false,
  },
});

const buttonStyle = computed(() => ({
  backgroundColor: props.outline ? 'transparent' : props.color,
  border: `2px solid ${props.color}`,
  justifyContent: props.align,
  color: props.outline ? props.color : 'white',
}));

const textStyle = computed(() => ({
  color: props.textColor,
  fontWeight: props.textBold ? 'bold' : 'normal',
}));
</script>

<template>
  <NuxtLink :to="props.link" :class="props.transparent ? 'transparent__glass' : 'button'" :style="props.transparent ? '' : buttonStyle">
    <Icon :name="props.icon" class="button__img" :style="textStyle" />
    <p :style="textStyle">{{ props.text }}</p>
  </NuxtLink>
</template>

<style scoped lang="scss">
@use '/assets/scss/screens' as *;

* {
  cursor: pointer;
  user-select: none;
}

.button {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  border-radius: 2rem;
  transition: background-color 0.3s, transform 0.2s, color 0.3s;

  &__img {
    font-size: 1.5rem;
  }
}

.button:hover {
  opacity: 0.8;
  cursor: pointer;
}

.button:active {
  transform: scale(0.95);
}

.transparent__glass {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1rem !important;
  text-decoration: none;
  border-radius: 2rem;
  transition: background-color 0.3s, transform 0.2s, color 0.3s;
}

.transparent__glass:hover {
  opacity: 0.8;
}

.transparent__glass:active {
  transform: scale(0.95);
}
</style>
