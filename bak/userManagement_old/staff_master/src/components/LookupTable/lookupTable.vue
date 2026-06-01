<script setup>
/**
 * LookupTable component
 * by, Janga Chen, 2025/07/02
 * This component provides a combobox for selecting items from a lookup table.
 * It supports multiple selections, item creation, and dynamic loading of items.
 * 
 * usage:
 * <LookupTable
 *   identify_code="department"
 *   :params="{identify_code: 'department', active: true}"
 *   v-model="selectedDepartment"
 *   :multiple="true"
 *   :creatable="true"
 *   label="部署を選択"
 *   density="compact"
 *   :returnObject="false"
 *   :original="originalDepartment"
 *   :isAutoComp="false" <!-- use v-autocomplete instead of v-combobox
 * />
 * identify_code="department" should be a globelly unique code of the lookup table
 * params should contain some additional parameters to filter items in the table. 
 * the final parameters are passed look like
 * e.g., {identify_code: 'department', active: true}
 * This component will load items from the API based on the identify_code and params.
 */
import { ref, watch, onMounted } from 'vue'
// import { debounce } from 'lodash'
import { useLookupTableStore } from '@/stores/LookupTable'

const useApi = useLookupTableStore()

const props = defineProps({
    // the code to identify the lookup table, e.g., 'department'
    identify_code: {
        type: String,
        required: true
    },
    // some additional paraemter to filter items
    // e.g., {active: true} to only show active items
    // this will be passed to the API call to load items
    // to identify the lookup table
    // e.g., {identify_code: 'department', active: true}
    params: {
        type: Object,
        default: () => ({}),
        required: true
    },
    // whether to allow multiple selections
    multiple: Boolean, 
    // creatable: Boolean, // whether to allow creating new items
    // If creatable is true, the component will allow users to add new items
    // If false, it will only allow selection from existing items
    creatable: Boolean,
    // modelValue: [String, Number, Array, Object], // v-model binding
    // modelValue can be a single value or an array of values
    // If multiple is true, modelValue should be an array
    // If multiple is false, modelValue can be a single value or an object
    // If returnObject is true, modelValue will be an object with code and name
    // If returnObject is false, modelValue will be a string or number
    modelValue: [String, Number, Array, Object],
    // label for the combobox
    // this will be displayed as the label for the combobox
    label: {
        type: String,
        default: '選択または入力',
        required: false
    },
    // density for the combobox
    // this will be passed to the v-combobox component
    // options are 'default', 'comfortable', 'compact'
    // default is 'compact'
    density: {
        type: String,
        default: 'compact',
        required: false
    },
    // returnObject: Boolean, // whether to return the whole object or just the code
    // If true, the modelValue will be an object with code and name
    // If false, the modelValue will be just the code
    // If multiple is true, modelValue will be an array of objects
    // If multiple is false, modelValue will be a single object or code
    // If returnObject is true, the combobox will display the name of the item
    // If returnObject is false, the combobox will display the code of the item
    returnObject: {
      type: Boolean,
      default: false,
      required: false
    },
    // original value, used for diff display
    // if the original value is different from the current value
    // this is useful for displaying the original value in the diff display
    // e.g., <DiffSelect v-model="selected" :original="originalValue"
    // :items="items" label="選択" density="compact" />
    original:{
      type: String,
      default: '',
      required: false
    },
    isAutoComp: {
      type: Boolean,
      default: false,
      required: false
    } // whether to use v-autocomplete instead of v-combobox
})

const emit = defineEmits(['update:modelValue', 'change']) // ✅ Declare 'change' here

const items = ref([])
const selected = ref(props.modelValue)
const loading = ref(false)
const dialog = ref(false)
const editItem = ref({})
const suppressWatch = ref(false)
// const extrasJson = ref('')
const jsonError = ref(false)
const isEditing = ref(false)

// Computed properties
const currentIdentifyCode = computed(() => props.identify_code)
const editDialogTitle = computed(() => 
  isEditing.value ? '項目を編集' : '新しい項目を追加'
)

// Sync modelValue changes
watch(() => props.modelValue, (val) => {
  selected.value = val
})

// Emit code values only
watch(selected, (val) => {
  if (suppressWatch.value) return
  emit('update:modelValue', val)
})

// New item detection with debounce
watch(selected, (val) => {
  if (!props.creatable || loading.value || dialog.value) return
  if (props.returnObject) return // Skip in returnObject mode

  const existsInItems = (v) => 
    items.value.some(i => i.name === v || i.code === v)

  if (props.multiple && Array.isArray(val)) {
    const newItems = val.filter(v => 
      v && typeof v === 'string' && !existsInItems(v)
    )
    if (newItems.length) addNewItem(newItems[0])
  } 
  else if (typeof val === 'string' && val && !existsInItems(val)) {
    addNewItem(val)
  }
})

// Data loading
onMounted(loadItems)
watch(() => props.params, loadItems, { deep: true })

async function loadItems() {
  try {
    loading.value = true
    items.value = await useApi.loadLookupTable({identify_code: props.identify_code, ...props.params})
    if(!props.creatable) {
      // If not creatable, filter out items with empty names
      items.value = items.value.filter(item => item.is_active === 'active' && item.name)
    }
    items.value = items.value || []
  } catch (error) {
    console.error("Load failed:", error)
  } finally {
    loading.value = false
  }
}

// Item creation
function addNewItem(name='') {
  editItem.value = {
    id: null,
    identify_code: currentIdentifyCode.value,
    code: '',
    name: name,
    extras: '{}',
    sort_order: null,
    is_active: 'active'
  }
  // extrasJson.value = JSON.stringify(editItem.value.extras, null, 2)
  isEditing.value = false
  dialog.value = true
}

function editSelectedItem() {
  if (!selected.value) {
    addNewItem()
    return
  }
  
  const selectedItem = props.returnObject 
    ? selected.value 
    : items.value.find(item => item.code === selected.value)
  
  if (selectedItem) {
    editItem.value = { ...selectedItem }
    // extrasJson.value = JSON.stringify(editItem.value.extras || {}, null, 2)
    isEditing.value = true
    dialog.value = true
  }
}

async function saveItem() {
  try {
    loading.value = true
    
    // Auto-generate code if empty
    if (!editItem.value.code.trim()) {
      editItem.value.code = `GEN_${Date.now().toString(36).slice(-6)}`
    }
    
    // Calculate sort order for new items
    if (!isEditing.value) {
      const maxSort = items.value.reduce(
        (max, item) => Math.max(max, item.sort_order || 0), 0
      )
      editItem.value.sort_order = maxSort + 1
    }
    const data = {
      identify_code: editItem.value.identify_code,
      code: editItem.value.code,
      name: editItem.value.name,
      extras: editItem.value.extras,
      sort_order: editItem.value.sort_order || 0, // Default to 0 if not set
      is_active: editItem.value.is_active || 'active' // Default to 'active'
    }
    await useApi.saveLookupTable(data)
    await loadItems()
    dialog.value = false
    loading.value = false
    // selected.value = editItem.value.code

    suppressWatch.value = false

  } catch (error) {
    console.error("Save failed:", error)
  } finally {
    loading.value = false
    dialog.value = false
  }
}

function cancelDialog() {
  suppressWatch.value = true
  if (props.multiple) {
    selected.value = selected.value.filter(v => v !== editItem.value.name)
  } else {
    selected.value = null
  }
  suppressWatch.value = false
  dialog.value = false
}

const statusData = [{value: 'active', label: '有効' }, { value: 'inactive', label: '未使用' }, { value: 'removed', label:'削除済み' }]

const beforeTitle = computed(() => {
  return items.value?.find((e) => e.value == props.original)?.title
})

</script>

<template>
  <div>
    <!-- Prepend Slot -->
    <slot name="prepend"></slot>

    <!-- Main Input Field -->
    <v-select
      v-if="!isAutoComp"
      v-model="selected"
      :items="items"
      item-title="name"
      item-value="code"
      :density="density"
      :multiple="multiple"
      :loading="loading"
      :clearable="true"
      :label="label"
      :return-object="returnObject"
      class="flex-grow-1 mt-2"
      @update:model-value="$emit('change')"
    >
      <!-- Custom Item Rendering -->
      <template #item="{ item, props: itemProps }">
        <slot name="item" :item="item" :props="itemProps">
          <v-list-item v-bind="itemProps">
            <v-list-item-title>{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle v-if="item.extras">
              <slot name="json-display" :extras="item.extras">
                <pre>{{ JSON.stringify(item.extras, null, 2) }}</pre>
              </slot>
            </v-list-item-subtitle>
          </v-list-item>
        </slot>
      </template>

      <!-- No Data Slot -->
      <template #no-data>
        <slot name="no-data">
          <v-list-item>No data available</v-list-item>
        </slot>
      </template>
    </v-select>

    <v-autocomplete
      v-else
      v-model="selected"
      :items="items"
      item-title="name"
      item-value="code"
      :density="density"
      :multiple="multiple"
      :loading="loading"
      :clearable="true"
      :label="label"
      :return-object="returnObject"
      class="flex-grow-1 mt-2"
      @update:modelValue="val => {
        emit('update:modelValue', val);
        emit('change', val);
      }"
    >
      <!-- Custom Item Rendering -->
      <template #item="{ item, props: itemProps }">
        <slot name="item" :item="item" :props="itemProps">
          <v-list-item v-bind="itemProps">
            <v-list-item-title>{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle v-if="item.extras">
              <slot name="json-display" :extras="item.extras">
                <pre>{{ JSON.stringify(item.extras, null, 2) }}</pre>
              </slot>
            </v-list-item-subtitle>
          </v-list-item>
        </slot>
      </template>

      <!-- No Data Slot -->
      <template #no-data>
        <slot name="no-data">
          <v-list-item>No data available</v-list-item>
        </slot>
      </template>
    </v-autocomplete>

    <!-- Append Slot -->
    <slot name="append"></slot>

    <!-- Creatable Button -->
    <v-btn
      v-if="creatable"
      icon
      variant="text"
      size="small"
      class="ml-2"
      @click="editSelectedItem"
    >
      <v-icon>mdi-pencil</v-icon>
    </v-btn>

    <!-- Dialog for Editing/Creating Items -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>{{ editDialogTitle }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field 
                label="識別コード"
                v-model="editItem.identify_code"
                readonly
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field 
                label="ステータス"
                v-model="editItem.is_active"
              >
                <template v-slot:append>
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props">mdi-menu-down</v-icon>
                    </template>
                    <v-list>
                      <v-list-item 
                        v-for="status in statusData" 
                        :key="status.value"
                        @click="editItem.is_active = status.value"
                      >
                        {{ status.label }}
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field 
                label="コード" 
                v-model="editItem.code"
                :rules="[v => !!v.trim() || '必須項目です']"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field 
                label="表示順" 
                v-model="editItem.sort_order"
                type="number"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field 
                label="名称" 
                v-model="editItem.name"
                :rules="[v => !!v.trim() || '必須項目です']"
              />
            </v-col>
            <v-col cols="12">
              <slot
                  name="json"
                  :editItem="editItem"
                  :json="editItem.extras"
                  :setJson="(val) => { editItem.extras = val }"
                >
                  <!-- Default fallback: -->
                  <v-textarea 
                    label="追加情報 (JSON形式)" 
                    v-model="editItem.extras"
                    :error="jsonError"
                    rows="5"
                    auto-grow
                  />
                  <v-alert v-if="jsonError" type="error" density="compact">
                    無効なJSON形式です
                  </v-alert>
                </slot>            
              </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="warning" @click="addNewItem">新規</v-btn>
          <v-btn color="primary" @click="saveItem">保存</v-btn>
          <v-btn text @click="cancelDialog">キャンセル</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  methods: {
    validateJson() {
      try {
        JSON.parse(this.editItem.extras)
        this.jsonError = false
      } catch (error) {
        this.jsonError = true
      }
    }
  }
}
</script>


<!-- 
sample usage:

<LookupTable
  identify_code="department"
  :params="{identify_code: 'department', active: true}"
  v-model="selectedDepartment"
  :multiple="true"
>
  <template #header>
    <h3>Custom Header: Select Department</h3>
  </template>

  <template #prepend>
    <v-icon>mdi-magnify</v-icon>
  </template>

  <template #item="{ item }">
    <v-list-item>
      <v-list-item-title>{{ item.name }} ({{ item.code }})</v-list-item-title>
    </v-list-item>
  </template>

  <template #no-data>
    <v-list-item>No departments found</v-list-item>
  </template>

  <template #footer>
    <p>Custom Footer: End of selection</p>
  </template>
</LookupTable> -->


<!-- <LookupTable ...>
  <!-- prepend slot -->
  <template #prepend>
    <span class="mr-2"><v-icon>mdi-account-group</v-icon></span>
  </template>

  <!-- select-item slot (custom item render) -->
  <template #select-item="{ item, index }">
    <v-list-item>
      <v-list-item-title>{{ item.name }} ({{ item.code }})</v-list-item-title>
      <v-list-item-subtitle v-if="item.extras">{{ item.extras }}</v-list-item-subtitle>
    </v-list-item>
  </template>

  <!-- append slot -->
  <template #append>
    <v-btn icon @click="showHelp"><v-icon>mdi-help-circle</v-icon></v-btn>
  </template>

  <!-- dialog-fields slot (extra dialog fields) -->
  <template #dialog-fields="{ editItem }">
    <v-col cols="12">
      <v-text-field label="カスタムフィールド" v-model="editItem.custom_field" />
    </v-col>
  </template>

  <!-- dialog-actions slot (customize footer) -->
  <template #dialog-actions="{ save, cancel, addNew }">
    <v-btn color="success" @click="save">保存する</v-btn>
    <v-btn color="info" @click="addNew">追加</v-btn>
    <v-btn text @click="cancel">閉じる</v-btn>
  </template>

  <!-- default slot -->
  <template #default>
    <div class="mt-2 text-caption">選択リストの下に追加情報や説明をここに</div>
  </template>
<!-- </LookupTable> -->
