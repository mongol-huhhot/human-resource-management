<!-- DatePicker.vue -->
<script setup>
import { ref, watch, computed } from 'vue';
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: null
  },
  label: {
    type: String,
    default: 'Select Date'
  },
  prependIcon: {
    type: String,
    default: 'mdi-calendar'
  },
  title: {
    type: String,
    default: '日付選択'
  },
  header: {
    type: String,
    default: 'Date Picker'
  },
  mode: {
    type: String,
    default: 'date', // 'date' or 'month'
    validator: v => ['date', 'month'].includes(v)
  }
});

const emit = defineEmits(['update:modelValue']);
const menu = ref(false);

// Format string based on mode
const formatString = computed(() => props.mode === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD');

// We use a temporary string to drive the date picker
const tempDate = ref(
  props.modelValue
    ? typeof props.modelValue === 'string'
      ? props.modelValue
      : dayjs(props.modelValue).format(formatString.value)
    : null
);

// Watch for changes in the parent
watch(() => props.modelValue, (val) => {
  if (val) tempDate.value = val
  else tempDate.value = null;
});

const allowedDates = (date) => {
  let year;
  if (typeof date === 'string') {
    year = parseInt(date.split('-')[0]);
  } else if (date instanceof Date) {
    year = date.getFullYear();
  } else {
    return false;
  }
  return year >= 2025;
};

function onSelectDate(val) {
  if (val) {
    emit('update:modelValue', dayjs(val).format('YYYY-MM-DD'));
  }
  menu.value = false;
}

const clearDate = () => {
  emit('update:modelValue', null);
  tempDate.value = null;
};

</script>

<template>
  <v-menu v-model="menu" :close-on-content-click="false">
    <template v-slot:activator="{ props: activatorProps }">
      <v-text-field
        v-bind="activatorProps"
        :model-value="props.modelValue ? dayjs(String(props.modelValue)).format(formatString) : ''"
        :label="label"
        :prepend-icon="prependIcon"
        readonly
        clearable
        density="compact"
        @click:clear="clearDate"
        style="min-width: 12em; max-width: 18em;"
      ></v-text-field>
    </template>

    <v-date-picker
      v-model="tempDate"
      color="primary"
      :title="title"
      :view-mode="props.mode === 'month' ? 'year' : 'month'"
      :show-adjacent-months="props.mode === 'date'"
      :hide-header="props.mode === 'month'"
      :allowed-dates="allowedDates"
      :hide-day="props.mode === 'month'"
      @update:model-value="onSelectDate"
      scrollable
      elevation="4"
      density="compact"
    />
  </v-menu>
</template>


<!-- For date (YYYY-MM-DD) -->
<!---
<DatePicker 
  v-model="selectedDate"
  label="日付を選択"
  mode="date"
/>
-->
<!-- For month (YYYY-MM) -->

<!--
<DatePicker 
  v-model="selectedMonth"
  label="月を選択"
  mode="month"
/>
-->