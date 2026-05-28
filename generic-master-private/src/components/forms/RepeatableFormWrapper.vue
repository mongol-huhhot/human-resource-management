<!-- RepeatableFormWrapper.vue -->
<template>
  <div>
    <v-card
      v-for="(item, index) in modelValue"
      :key="item.__uuid || index"
      class="mb-4"
      variant="outlined"
    >
      <v-card-title>
        {{ label }} {{ index + 1 }}

        <v-spacer />

        <v-btn
          icon="mdi-delete"
          variant="text"
          color="error"
          @click="remove(index)"
        />
      </v-card-title>

      <v-card-text>
        <DynamicVuetifyForm
          v-model="modelValue[index]"
          :fields="children"
        />
      </v-card-text>
    </v-card>

    <v-btn
      color="primary"
      variant="outlined"
      @click="add"
    >
      {{ addButtonText || '追加' }}
    </v-btn>
  </div>
</template>

<script setup>
import DynamicVuetifyForm from './DynamicVuetifyForm.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: String,
  children: {
    type: Array,
    default: () => []
  },
  addButtonText: String
})

const emit = defineEmits(['update:modelValue'])

function add() {
  emit('update:modelValue', [
    ...props.modelValue,
    {
      __uuid: crypto.randomUUID()
    }
  ])
}

function remove(index) {
  const copied = [...props.modelValue]
  copied.splice(index, 1)
  emit('update:modelValue', copied)
}
</script>
