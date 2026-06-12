<!-- components/Snackbar.vue -->
<template>
    <v-snackbar
      v-model="snackbar.visible"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="bottom-right"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </template>
  
<script>
  import { ref } from 'vue';
  
  export const snackbar = ref({
    visible: false,
    message: '',
    color: '',
    timeout: 3000,
  });
  
  export const showSnackbar = (message, color = 'success', timeout = 3000) => {
    snackbar.value = { visible: true, message, color, timeout };
  };
  
    export default {
        setup() {
            return {
                snackbar,
            };
        },
    };
</script>
  